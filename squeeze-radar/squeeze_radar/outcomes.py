"""Outcome tracking for every alert, from 5-minute candles. No look-ahead:

- Entry = OPEN of the first 5m candle that starts at or after the alert time.
- For each window (4h, 24h, 72h, 7d): % change at the window end, max gain and
  max drawdown inside the window. A window is filled only once it has fully passed.
- First hit: did price touch the floor or +target% first? If both happen in the
  same 5m candle we cannot know the order, so it is marked "ambiguous".
- Exit: after +target%, when does price give back `giveback_fraction` of the gain
  measured from the highest high since entry, and how long did that take.
- A symbol delisted during tracking is marked "delisted" with its last price.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Sequence

from .bybit import ApiError, Candle
from .db import DB
from .http import FetchError, FormatError
from .timeutil import HOUR_MS, iso, now_ms as _now

log = logging.getLogger(__name__)

FIVE_MIN = 5 * 60_000


@dataclass
class WindowResult:
    window_h: int
    complete: bool
    change_pct: float | None = None
    max_gain_pct: float | None = None
    max_drawdown_pct: float | None = None


@dataclass
class OutcomeResult:
    status: str                       # pending | tracking | complete | delisted
    entry_ms: int | None = None
    entry_price: float | None = None
    first_hit: str | None = None      # gain | floor | ambiguous | none (None = undecided yet)
    first_hit_ms: int | None = None
    gain_hit_ms: int | None = None
    floor_hit_ms: int | None = None
    peak_price: float | None = None
    peak_ms: int | None = None
    giveback_ms: int | None = None
    giveback_hours_from_gain: float | None = None
    giveback_hours_from_peak: float | None = None
    last_price: float | None = None
    last_candle_ms: int | None = None
    windows: list[WindowResult] = field(default_factory=list)


def compute_outcome(candles: Sequence[Candle], alert_ms: int, floor: float | None,
                    windows_h: Sequence[int], target_pct: float, giveback_frac: float,
                    now_ms: int, delisted: bool = False) -> OutcomeResult:
    """candles: CLOSED 5m candles, ascending."""
    cs = [c for c in candles if c.start_ms >= alert_ms and c.start_ms + FIVE_MIN <= now_ms]
    if not cs:
        return OutcomeResult(status="delisted" if delisted else "pending",
                             windows=[WindowResult(w, False) for w in windows_h])
    entry = cs[0]
    e = entry.open
    res = OutcomeResult(status="tracking", entry_ms=entry.start_ms, entry_price=e,
                        last_price=cs[-1].close, last_candle_ms=cs[-1].start_ms)
    max_h = max(windows_h)
    horizon_end = entry.start_ms + max_h * HOUR_MS
    track = [c for c in cs if c.start_ms < horizon_end]

    # Windows
    for w in windows_h:
        end = entry.start_ms + w * HOUR_MS
        inside = [c for c in track if c.start_ms < end]
        complete = now_ms >= end and bool(inside) and inside[-1].start_ms + FIVE_MIN >= end
        if complete or (delisted and inside):
            res.windows.append(WindowResult(
                w, complete,
                (inside[-1].close / e - 1) * 100,
                (max(c.high for c in inside) / e - 1) * 100,
                (min(c.low for c in inside) / e - 1) * 100))
        else:
            res.windows.append(WindowResult(w, False))

    # First hit: floor vs +target
    gain_lvl = e * (1 + target_pct / 100)
    gain_idx = None
    for i, c in enumerate(track):
        hit_gain = c.high >= gain_lvl
        hit_floor = floor is not None and c.low <= floor
        if hit_gain and hit_floor:
            res.first_hit, res.first_hit_ms = "ambiguous", c.start_ms
            res.gain_hit_ms = res.floor_hit_ms = c.start_ms
            break
        if hit_gain:
            res.first_hit, res.first_hit_ms, res.gain_hit_ms = "gain", c.start_ms, c.start_ms
            gain_idx = i
            break
        if hit_floor:
            res.first_hit, res.first_hit_ms, res.floor_hit_ms = "floor", c.start_ms, c.start_ms
            break
    horizon_done = now_ms >= horizon_end
    if res.first_hit is None and (horizon_done or delisted):
        res.first_hit = "none"

    # Record the gain hit even if the floor came first (for reversal stats only).
    if res.first_hit == "floor":
        for i, c in enumerate(track):
            if c.high >= gain_lvl and c.start_ms > res.floor_hit_ms:
                gain_idx = i
                res.gain_hit_ms = c.start_ms
                break
    elif res.first_hit == "gain" and floor is not None:
        for c in track:
            if c.start_ms > res.gain_hit_ms and c.low <= floor:
                res.floor_hit_ms = c.start_ms
                break

    # Exit: give back X% of the gain from the high
    if gain_idx is not None:
        peak = max(c.high for c in track[: gain_idx + 1])
        peak_ms = max(track[: gain_idx + 1], key=lambda c: c.high).start_ms
        for c in track[gain_idx + 1:]:
            level = peak - giveback_frac * (peak - e)
            if c.low <= level:
                res.giveback_ms = c.start_ms
                res.giveback_hours_from_gain = (c.start_ms - res.gain_hit_ms) / HOUR_MS
                res.giveback_hours_from_peak = (c.start_ms - peak_ms) / HOUR_MS
                break
            if c.high > peak:
                peak, peak_ms = c.high, c.start_ms
        res.peak_price, res.peak_ms = peak, peak_ms

    if delisted:
        res.status = "delisted"
    elif all(w.complete for w in res.windows):
        res.status = "complete"
    return res


# --------------------------------------------------------------------- job --

class OutcomeJob:
    def __init__(self, db: DB, client, cfg):
        self.db = db
        self.client = client
        self.cfg = cfg

    def _cached(self, symbol: str, start: int, end: int) -> list[Candle]:
        rows = self.db.all("SELECT * FROM candles_5m WHERE symbol=? AND start_ms>=? AND start_ms<=? ORDER BY start_ms",
                           (symbol, start, end))
        return [Candle(r["start_ms"], r["open"], r["high"], r["low"], r["close"], 0.0, 0.0) for r in rows]

    def _refresh_cache(self, symbol: str, start: int, end: int, now: int) -> bool:
        """Fetch closed 5m candles missing from the cache. Returns False if the symbol
        looks delisted (API says invalid symbol / no data while inactive)."""
        r = self.db.one("SELECT MAX(start_ms) AS m FROM candles_5m WHERE symbol=? AND start_ms>=?", (symbol, start))
        fetch_from = (r["m"] + FIVE_MIN) if r and r["m"] else start - (start % FIVE_MIN)
        fetch_to = min(end, now - FIVE_MIN)
        if fetch_from > fetch_to:
            return True
        try:
            cs = self.client.klines_range(symbol, 5, fetch_from, fetch_to)
        except ApiError as e:
            log.warning("outcome candles %s: %s", symbol, e)
            return not self._inactive(symbol)
        closed = [c for c in cs if c.start_ms + FIVE_MIN <= now]
        with self.db.tx() as conn:
            conn.executemany("INSERT OR REPLACE INTO candles_5m (symbol,start_ms,open,high,low,close) VALUES (?,?,?,?,?,?)",
                             [(symbol, c.start_ms, c.open, c.high, c.low, c.close) for c in closed])
        if not closed and self._inactive(symbol):
            return False
        return True

    def _inactive(self, symbol: str) -> bool:
        r = self.db.one("SELECT active FROM instruments WHERE symbol=?", (symbol,))
        return r is not None and not r["active"]

    def run(self) -> dict:
        oc = self.cfg.outcomes
        now = _now()
        kinds = tuple(oc.track_kinds)
        if not kinds:
            return {"tracked": 0}
        q = ("SELECT a.id, a.symbol, a.created_ms, a.floor FROM alerts a LEFT JOIN outcomes o ON o.alert_id=a.id "
             f"WHERE a.symbol IS NOT NULL AND a.kind IN ({','.join('?' * len(kinds))}) "
             "AND (o.status IS NULL OR o.status IN ('pending','tracking')) ORDER BY a.created_ms")
        alerts = self.db.all(q, kinds)
        max_h = max(oc.windows_hours)
        stats = {"tracked": 0, "complete": 0, "delisted": 0, "errors": 0}
        for a in alerts:
            sym = a["symbol"]
            try:
                end = a["created_ms"] + (max_h + 1) * HOUR_MS
                alive = self._refresh_cache(sym, a["created_ms"], end, now)
                candles = self._cached(sym, a["created_ms"] - FIVE_MIN, end)
                delisted = (not alive) or (self._inactive(sym) and (not candles or candles[-1].start_ms < now - 2 * HOUR_MS))
                r = compute_outcome(candles, a["created_ms"], a["floor"], oc.windows_hours,
                                    oc.target_gain_pct, oc.giveback_fraction, now, delisted=delisted)
                self._save(a["id"], sym, a["floor"], r, now)
                stats["tracked"] += 1
                stats["complete"] += r.status == "complete"
                stats["delisted"] += r.status == "delisted"
            except (FetchError, FormatError) as e:
                stats["errors"] += 1
                log.warning("outcome update failed for alert %s %s: %s", a["id"], sym, e)
            except Exception:  # one bad alert must never stop the job
                stats["errors"] += 1
                log.exception("unexpected outcome error for alert %s %s", a["id"], sym)
        return stats

    def _save(self, alert_id: int, symbol: str, floor, r: OutcomeResult, now: int) -> None:
        with self.db.tx():
            self.db.upsert("outcomes", {
                "alert_id": alert_id, "symbol": symbol, "status": r.status, "entry_ms": r.entry_ms,
                "entry_iso": iso(r.entry_ms), "entry_price": r.entry_price, "floor": floor,
                "first_hit": r.first_hit, "first_hit_ms": r.first_hit_ms, "gain_hit_ms": r.gain_hit_ms,
                "floor_hit_ms": r.floor_hit_ms, "peak_price": r.peak_price, "peak_ms": r.peak_ms,
                "giveback_ms": r.giveback_ms, "giveback_hours_from_gain": r.giveback_hours_from_gain,
                "giveback_hours_from_peak": r.giveback_hours_from_peak, "last_price": r.last_price,
                "last_candle_ms": r.last_candle_ms, "updated_ms": now, "updated_iso": iso(now)}, ["alert_id"])
            for w in r.windows:
                self.db.upsert("outcome_windows", {
                    "alert_id": alert_id, "window_h": w.window_h, "complete": int(w.complete),
                    "change_pct": w.change_pct, "max_gain_pct": w.max_gain_pct,
                    "max_drawdown_pct": w.max_drawdown_pct}, ["alert_id", "window_h"])
