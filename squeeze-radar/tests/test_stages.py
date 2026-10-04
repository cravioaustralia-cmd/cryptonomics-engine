from conftest import T0, hourly

from squeeze_radar.stages import (EXPIRED, INVALIDATED, LOADING, TRIGGER, WATCH, WatchState, evaluate)
from squeeze_radar.timeutil import DAY_MS, HOUR_MS

N = 200
TAG = T0 + 150 * HOUR_MS
LOADING_M = {"funding_now_8h": -0.0003, "oi_chg_24h_pct": 12.0, "last_close": 1.0, "floor": 0.99,
             "ls_ratio": 0.8, "ls_avg": 1.0}
FADED_M = dict(LOADING_M, funding_now_8h=0.0001)


def flat(n=N, last_close=None, last_turnover=None, last_low=None):
    closes = [1.0] * n
    turn = [1000.0] * n
    lows = [0.99] * n
    highs = [1.01] * n
    if last_close is not None:
        closes[-1] = last_close
        highs[-1] = max(1.01, last_close * 1.001)
    if last_turnover is not None:
        turn[-1] = last_turnover
    if last_low is not None:
        lows[-1] = last_low
    elif last_close is not None:
        lows[-1] = min(0.99, last_close * 0.999)
    return hourly(closes, turnovers=turn, lows=lows, highs=highs)


def state(stage=WATCH, **kw):
    d = dict(stage=stage, stage_since_ms=TAG, tagged_ms=TAG, expires_ms=TAG + 30 * DAY_MS)
    d.update(kw)
    return WatchState(**d)


def now_after(candles):
    return candles[-1].start_ms + HOUR_MS + 60_000


def run(st, cs, m, cfg, now=None):
    return evaluate(st, cs, m, cfg.stages, cfg.collection.floor_days, now or now_after(cs))


def test_watch_to_loading(cfg):
    cs = flat()
    r = run(state(), cs, LOADING_M, cfg)
    assert r.state.stage == LOADING
    assert r.transitions[0].from_stage == WATCH and "loading conditions met" in r.transitions[0].reason


def test_loading_back_to_watch_when_conditions_fade(cfg):
    cs = flat()
    r = run(state(LOADING), cs, FADED_M, cfg)
    assert r.state.stage == WATCH
    assert "conditions faded" in r.transitions[0].reason and "not negative" in r.transitions[0].reason


def test_watch_stays_watch_without_conditions(cfg):
    r = run(state(), flat(), FADED_M, cfg)
    assert r.state.stage == WATCH and r.transitions == []


def test_trigger_breakout_with_volume_and_negative_funding(cfg):
    cs = flat(last_close=1.05, last_turnover=2500.0)
    r = run(state(LOADING), cs, LOADING_M, cfg)
    assert r.state.stage == TRIGGER and r.state.ever_triggered
    assert "range high" in r.transitions[0].reason and r.transitions[0].candle_ms == cs[-1].start_ms


def test_no_trigger_without_volume_or_with_positive_funding(cfg):
    cs = flat(last_close=1.05, last_turnover=1500.0)  # only 1.5x
    assert run(state(LOADING), cs, LOADING_M, cfg).state.stage != TRIGGER
    cs2 = flat(last_close=1.05, last_turnover=5000.0)
    assert run(state(LOADING), cs2, FADED_M, cfg).state.stage != TRIGGER


def test_trigger_holds_then_falls_back(cfg):
    cs = flat(last_close=1.05, last_turnover=2500.0)
    r = run(state(LOADING), cs, LOADING_M, cfg)
    st = r.state
    # Same candles 2h later: still TRIGGER (hold period), and the candle is not re-counted.
    r2 = run(st, cs, FADED_M, cfg, now=now_after(cs) + 2 * HOUR_MS)
    assert r2.state.stage == TRIGGER and r2.transitions == []
    # After the hold period with faded conditions -> WATCH (backwards)
    r3 = run(r2.state, cs, FADED_M, cfg, now=now_after(cs) + 25 * HOUR_MS)
    assert r3.state.stage == WATCH and r3.transitions[0].from_stage == TRIGGER


def test_trigger_falls_back_to_loading_if_conditions_hold(cfg):
    cs = flat(last_close=1.05, last_turnover=2500.0)
    st = run(state(LOADING), cs, LOADING_M, cfg).state
    r = run(st, cs, dict(LOADING_M, last_close=1.05), cfg, now=now_after(cs) + 25 * HOUR_MS)
    assert r.state.stage == LOADING


def test_invalidation_on_close_below_floor(cfg):
    cs = flat(last_close=0.95)
    r = run(state(LOADING), cs, LOADING_M, cfg)
    assert r.state.stage == INVALIDATED
    assert "below floor 0.99" in r.transitions[0].reason
    assert r.state.invalidated_ms is not None


def test_wick_below_floor_does_not_invalidate_in_close_mode(cfg):
    cs = flat(last_close=1.0, last_low=0.90)  # wick only
    assert run(state(WATCH), cs, FADED_M, cfg).state.stage == WATCH


def test_invalidated_stays_then_rearms(cfg):
    cs = flat(last_close=0.95)
    st = run(state(LOADING), cs, LOADING_M, cfg).state
    inv_at = st.invalidated_ms
    r = run(st, cs, LOADING_M, cfg, now=inv_at + 5 * HOUR_MS)
    assert r.state.stage == INVALIDATED and r.transitions == []
    r2 = run(st, cs, LOADING_M, cfg, now=inv_at + 25 * HOUR_MS)
    assert r2.transitions[0].to_stage == WATCH and "re-armed" in r2.transitions[0].reason
    # The old breakdown candle is not tested again after re-arm; conditions put it in LOADING.
    assert r2.state.stage == LOADING


def test_expired_after_window(cfg):
    cs = flat()
    st = state(WATCH, expires_ms=TAG + 1)
    r = run(st, cs, FADED_M, cfg)
    assert r.state.stage == EXPIRED and "no trigger" in r.transitions[-1].reason
    # Expired is terminal
    assert run(r.state, cs, LOADING_M, cfg).state.stage == EXPIRED


def test_candles_before_tag_are_ignored(cfg):
    cs = flat(last_close=0.95)  # breakdown candle closes at the end
    st = state(WATCH, tagged_ms=cs[-1].start_ms + 2 * HOUR_MS)  # tagged after that candle closed
    st.expires_ms = st.tagged_ms + 30 * DAY_MS
    r = run(st, cs, FADED_M, cfg)
    assert r.state.stage == WATCH


def test_candle_is_not_evaluated_twice(cfg):
    cs = flat(last_close=0.95)
    st = state(WATCH, last_eval_candle_ms=cs[-1].start_ms)
    assert run(st, cs, FADED_M, cfg).state.stage == WATCH
