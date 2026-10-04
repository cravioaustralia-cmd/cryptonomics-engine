import pytest
from conftest import T0, five_min

from squeeze_radar.outcomes import compute_outcome
from squeeze_radar.timeutil import HOUR_MS

W = [4, 24, 72, 168]


def flat_rows(n, p=1.0):
    return [(p, p * 1.001, p * 0.999, p)] * n


def run(rows, alert_ms=T0 + 60_000, floor=0.9, now=None, delisted=False, start=T0):
    cs = five_min(rows, start)
    now = now or (cs[-1].start_ms + 300_000)
    return compute_outcome(cs, alert_ms, floor, W, 10.0, 0.5, now, delisted=delisted)


def test_entry_is_open_of_first_5m_candle_after_alert():
    rows = [(1.0, 1.0, 1.0, 1.0), (1.02, 1.03, 1.01, 1.02)] + flat_rows(10, 1.02)
    r = run(rows, alert_ms=T0 + 60_000)  # alert inside the first candle -> entry is the 2nd candle's open
    assert r.entry_ms == T0 + 300_000 and r.entry_price == 1.02


def test_pending_before_any_candle():
    r = run(flat_rows(3), alert_ms=T0 + 10 * HOUR_MS, now=T0 + 10 * HOUR_MS + 1000)
    assert r.status == "pending" and r.entry_price is None


def test_windows_fill_only_when_complete():
    rows = flat_rows(12 * 5)  # 5 hours of candles
    r = run(rows, alert_ms=T0)
    w4 = next(w for w in r.windows if w.window_h == 4)
    w24 = next(w for w in r.windows if w.window_h == 24)
    assert w4.complete and w4.change_pct == pytest.approx(0.0)
    assert not w24.complete and w24.change_pct is None
    assert r.status == "tracking"


def test_max_gain_and_drawdown_in_window():
    rows = flat_rows(10) + [(1.0, 1.08, 0.95, 1.0)] + flat_rows(12 * 4)
    r = run(rows, alert_ms=T0)
    w4 = next(w for w in r.windows if w.window_h == 4)
    assert w4.max_gain_pct == pytest.approx(8.0)
    assert w4.max_drawdown_pct == pytest.approx(-5.0)


def test_gain_first():
    rows = flat_rows(5) + [(1.0, 1.11, 0.99, 1.1)] + [(1.1, 1.1, 0.85, 0.86)] + flat_rows(5, 0.86)
    r = run(rows, alert_ms=T0)
    assert r.first_hit == "gain" and r.gain_hit_ms == T0 + 5 * 300_000
    assert r.floor_hit_ms == T0 + 6 * 300_000


def test_floor_first():
    rows = flat_rows(5) + [(1.0, 1.0, 0.89, 0.9)] + [(0.9, 1.2, 0.9, 1.15)]
    r = run(rows, alert_ms=T0)
    assert r.first_hit == "floor"
    assert r.gain_hit_ms == T0 + 6 * 300_000  # recorded for reversal stats, but not a hit


def test_ambiguous_same_candle():
    rows = flat_rows(5) + [(1.0, 1.12, 0.85, 1.0)] + flat_rows(5)
    r = run(rows, alert_ms=T0)
    assert r.first_hit == "ambiguous"


def test_none_after_horizon():
    rows = flat_rows(12 * 24 * 7 + 5)
    r = run(rows, alert_ms=T0)
    assert r.first_hit == "none" and r.status == "complete"
    assert all(w.complete for w in r.windows)


def test_giveback_after_spike():
    # entry 1.0; spike to 1.20 high (gain +20%); giveback level = 1.20 - 0.5*0.20 = 1.10
    rows = (flat_rows(2) + [(1.0, 1.11, 1.0, 1.1)] + [(1.1, 1.20, 1.1, 1.18)]
            + [(1.18, 1.18, 1.12, 1.13)] + [(1.13, 1.13, 1.09, 1.09)] + flat_rows(3, 1.09))
    r = run(rows, alert_ms=T0)
    assert r.first_hit == "gain"
    assert r.peak_price == pytest.approx(1.20) and r.peak_ms == T0 + 3 * 300_000
    assert r.giveback_ms == T0 + 5 * 300_000
    assert r.giveback_hours_from_peak == pytest.approx(2 * 300_000 / HOUR_MS)
    assert r.giveback_hours_from_gain == pytest.approx(3 * 300_000 / HOUR_MS)


def test_delisted_marks_status_and_keeps_last_price():
    rows = flat_rows(20, 1.0) + [(1.0, 1.0, 0.5, 0.5)]
    r = run(rows, alert_ms=T0, delisted=True, now=T0 + 10 * 24 * HOUR_MS, floor=None)
    assert r.status == "delisted" and r.last_price == 0.5
    w4 = next(w for w in r.windows if w.window_h == 4)
    assert w4.change_pct == pytest.approx(-50.0) and not w4.complete
    assert r.first_hit == "none"


def test_delisted_without_any_candle():
    r = compute_outcome([], T0, 0.9, W, 10, 0.5, T0 + HOUR_MS, delisted=True)
    assert r.status == "delisted"


def test_in_progress_candle_is_not_used():
    cs = five_min(flat_rows(3) + [(1.0, 2.0, 1.0, 2.0)], T0)
    now = cs[-1].start_ms + 60_000  # last candle still open
    r = compute_outcome(cs, T0, 0.9, W, 10, 0.5, now)
    assert r.first_hit is None and r.last_price == 1.0
