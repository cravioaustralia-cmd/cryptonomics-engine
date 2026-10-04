"""Stage machine for tagged tokens. Pure logic, no I/O.

WATCH -> LOADING -> TRIGGER, any of them -> INVALIDATED, any -> EXPIRED.
Stages can move backwards (LOADING -> WATCH when the conditions fade,
TRIGGER -> LOADING/WATCH after the hold period). INVALIDATED re-arms to WATCH
after a configurable time, with a fresh floor.

Only candles that CLOSED after the token was tagged, and after the previous
evaluation, are tested for invalidation and trigger, so a candle is never
counted twice and history before the tag is never used as a signal.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Sequence

from .bybit import Candle
from .metrics import avg_hourly_turnover, floor_level, range_high
from .timeutil import HOUR_MS, short

WATCH, LOADING, TRIGGER, INVALIDATED, EXPIRED = "WATCH", "LOADING", "TRIGGER", "INVALIDATED", "EXPIRED"
STAGE_NUM = {WATCH: "Stage 1", LOADING: "Stage 2", TRIGGER: "Stage 3", INVALIDATED: "Invalidated", EXPIRED: "Expired"}


@dataclass
class WatchState:
    stage: str
    stage_since_ms: int
    tagged_ms: int
    expires_ms: int
    last_eval_candle_ms: int | None = None
    invalidated_ms: int | None = None
    ever_triggered: bool = False


@dataclass
class Transition:
    from_stage: str
    to_stage: str
    reason: str
    candle_ms: int | None
    at_ms: int


@dataclass
class StageResult:
    state: WatchState
    transitions: list[Transition] = field(default_factory=list)
    floor: float | None = None


def _fmt(v, f="{:.6g}"):
    return "n/a" if v is None else f.format(v)


def loading_check(m: dict, st) -> tuple[bool, str]:
    """All LOADING conditions, with a reason listing each one."""
    parts, ok = [], True
    fn = m.get("funding_now_8h")
    if st.loading_require_negative_funding:
        c = fn is not None and fn < 0
        ok &= c
        parts.append(f"funding(8h) {_fmt(None if fn is None else fn * 100, '{:+.4f}')}% {'<0 ok' if c else 'not negative'}")
    oi = m.get("oi_chg_24h_pct")
    c = oi is not None and oi > st.loading_min_oi_change_24h_pct
    ok &= c
    parts.append(f"coin OI 24h {_fmt(oi, '{:+.1f}')}% {'rising' if c else 'not rising'}")
    if st.loading_require_above_floor:
        price, floor = m.get("last_close"), m.get("floor")
        c = price is not None and floor is not None and price > floor
        ok &= c
        parts.append(f"close {_fmt(price)} {'above' if c else 'not above'} floor {_fmt(floor)}")
    ls, lsa = m.get("ls_ratio"), m.get("ls_avg")
    c = ls is not None and lsa is not None and ls < lsa * st.loading_ls_below_avg_factor
    ok &= c
    parts.append(f"L/S {_fmt(ls, '{:.3f}')} {'below' if c else 'not below'} avg {_fmt(lsa, '{:.3f}')}")
    return ok, "; ".join(parts)


def evaluate(state: WatchState, closed_hourly: Sequence[Candle], m: dict, st, floor_days: int,
             now_ms: int) -> StageResult:
    """Advance the stage machine. `m` holds the current metrics for the symbol."""
    s = WatchState(**state.__dict__)
    res = StageResult(state=s)

    def move(to: str, reason: str, candle_ms: int | None):
        if to == s.stage:
            return
        res.transitions.append(Transition(s.stage, to, reason, candle_ms, now_ms))
        s.stage = to
        s.stage_since_ms = now_ms

    if s.stage == EXPIRED:
        return res

    # Candles to test: closed after the tag time and after the last evaluation.
    start_after = max(s.last_eval_candle_ms if s.last_eval_candle_ms is not None else -1,
                      s.tagged_ms - HOUR_MS)  # candle whose close is after the tag
    new_idx = [i for i, c in enumerate(closed_hourly) if c.start_ms > start_after]
    if closed_hourly:
        s.last_eval_candle_ms = max(s.last_eval_candle_ms or 0, closed_hourly[-1].start_ms)
    res.floor = floor_level(closed_hourly, floor_days)

    # 1) Re-arm after invalidation
    if s.stage == INVALIDATED:
        if s.invalidated_ms is not None and now_ms - s.invalidated_ms >= st.invalidated_rearm_hours * HOUR_MS \
                and now_ms < s.expires_ms:
            move(WATCH, f"re-armed {st.invalidated_rearm_hours:g}h after invalidation; new floor {_fmt(res.floor)}", None)
            # only candles after the re-arm moment count from now on
            new_idx = []
        else:
            if now_ms >= s.expires_ms:
                move(EXPIRED, "tracking window ended", None)
            return res

    # 2) Invalidation and trigger, candle by candle in time order
    for i in new_idx:
        c = closed_hourly[i]
        fl = floor_level(closed_hourly, floor_days, upto_index=i)
        px = c.close if st.invalidation_price == "close" else c.low
        if fl is not None and px < fl:
            s.invalidated_ms = now_ms
            move(INVALIDATED, f"1h candle {short(c.start_ms)} {st.invalidation_price} {_fmt(px)} "
                              f"below floor {_fmt(fl)}", c.start_ms)
            return res
        rh = range_high(closed_hourly, st.trigger_range_hours, upto_index=i)
        avg_t = avg_hourly_turnover(closed_hourly, st.trigger_turnover_avg_hours, upto_index=i)
        fn = m.get("funding_now_8h")
        funding_ok = (not st.trigger_require_negative_funding) or (fn is not None and fn < 0)
        if rh is not None and avg_t and c.close > rh and c.turnover >= st.trigger_turnover_multiple * avg_t \
                and funding_ok:
            reason = (f"1h candle {short(c.start_ms)} closed {_fmt(c.close)} above {st.trigger_range_hours}h range high "
                      f"{_fmt(rh)}, turnover {c.turnover / avg_t:.1f}x avg, funding(8h) "
                      f"{_fmt(None if fn is None else fn * 100, '{:+.4f}')}%")
            if s.stage == TRIGGER:
                s.stage_since_ms = now_ms  # fresh breakout extends the hold
            move(TRIGGER, reason, c.start_ms)
            s.ever_triggered = True

    # 3) Expiry
    if now_ms >= s.expires_ms:
        move(EXPIRED, "tracking window ended " + ("(had triggered)" if s.ever_triggered else "with no trigger"), None)
        return res

    # 4) Hold TRIGGER for a while, then fall back to the condition check
    if s.stage == TRIGGER and now_ms - s.stage_since_ms < st.trigger_hold_hours * HOUR_MS:
        return res

    ok, why = loading_check(m, st)
    if ok:
        move(LOADING, "loading conditions met: " + why, None)
    else:
        if s.stage in (LOADING, TRIGGER):
            move(WATCH, "conditions faded: " + why, None)
    return res
