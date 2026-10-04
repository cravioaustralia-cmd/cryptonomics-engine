import pytest
from conftest import T0, hourly

from squeeze_radar import metrics as M
from squeeze_radar.timeutil import DAY_MS, HOUR_MS


# ---------------------------------------------------------- funding --------
@pytest.mark.parametrize("rate,hours,expected", [
    (-0.0001, 8, -0.0001),
    (-0.0001, 1, -0.0008),   # 1h coin pays 8x per 8h
    (-0.0001, 2, -0.0004),
    (-0.0001, 4, -0.0002),
    (0.0003, 4, 0.0006),
])
def test_normalize_funding(rate, hours, expected):
    assert M.normalize_funding_8h(rate, hours) == pytest.approx(expected)


def test_normalize_funding_invalid():
    assert M.normalize_funding_8h(None, 8) is None
    assert M.normalize_funding_8h(-0.001, 0) is None
    assert M.normalize_funding_8h(-0.001, None) is None


def test_funding_metrics_average_and_interval_inference():
    now = T0 + 100 * HOUR_MS
    # 4h settlements, newest last
    hist = [(now - 16 * HOUR_MS, -0.0002), (now - 12 * HOUR_MS, -0.0001), (now - 8 * HOUR_MS, -0.0001),
            (now - 4 * HOUR_MS, -0.0004)]
    r = M.funding_metrics(-0.0002, 4, hist, 3, 7, now)
    assert r["funding_now_8h"] == pytest.approx(-0.0004)
    # last 3 settlements normalized to 8h: -0.0002, -0.0002, -0.0008
    assert r["funding_avg_n_8h"] == pytest.approx((-0.0002 - 0.0002 - 0.0008) / 3)
    assert r["funding_own_avg_8h"] == pytest.approx((-0.0004 - 0.0002 - 0.0002 - 0.0008) / 4)


def test_funding_interval_change_is_detected_from_gaps():
    now = T0 + 100 * HOUR_MS
    # Was 8h, now 1h. Current interval = 1h.
    hist = [(now - 18 * HOUR_MS, -0.0008), (now - 10 * HOUR_MS, -0.0008), (now - 2 * HOUR_MS, -0.0001),
            (now - 1 * HOUR_MS, -0.0001)]
    ints = M.settlement_intervals(hist, 1)
    assert ints == [1, 8, 8, 1]  # first falls back to current; gaps of 8h then 1h
    r = M.funding_metrics(-0.0001, 1, hist, 2, 7, now)
    # last two: -0.0001 settled after an 8h gap -> -0.0001; -0.0001 after a 1h gap -> -0.0008
    assert r["funding_avg_n_8h"] == pytest.approx((-0.0001 - 0.0008) / 2)


# ----------------------------------------------------- closed candles -------
def test_closed_candles_excludes_in_progress():
    cs = hourly([1, 2, 3])
    now = T0 + 2 * HOUR_MS + 10 * 60_000  # third candle started 10 min ago
    closed = M.closed_candles(cs, HOUR_MS, now)
    assert [c.close for c in closed] == [1, 2]
    # exactly at the boundary the candle is closed
    assert len(M.closed_candles(cs, HOUR_MS, T0 + 3 * HOUR_MS)) == 3


# ------------------------------------------------------- volume ratio -------
def test_volume_ratio_uses_turnover_and_excludes_current_window():
    # 7 days baseline at 100/h (= 2400/day), last 24h at 300/h (= 7200)
    turnovers = [100.0] * (24 * 7) + [300.0] * 24
    cs = hourly([1.0] * len(turnovers), turnovers=turnovers)
    ratio, last24 = M.volume_ratio(cs, 7)
    assert last24 == pytest.approx(7200)
    assert ratio == pytest.approx(3.0)


def test_volume_ratio_ignores_older_candles_and_needs_full_history():
    turnovers = [999999.0] * 5 + [100.0] * (24 * 7) + [200.0] * 24
    cs = hourly([1.0] * len(turnovers), turnovers=turnovers)
    assert M.volume_ratio(cs, 7)[0] == pytest.approx(2.0)
    short = hourly([1.0] * 100)
    assert M.volume_ratio(short, 7) == (None, None)


def test_volume_ratio_uses_turnover_not_coin_volume():
    # Price doubles: coin volume halves, USD turnover unchanged -> ratio 1.0
    closes = [1.0] * (24 * 7) + [2.0] * 24
    cs = hourly(closes, turnover=500.0)
    assert M.volume_ratio(cs, 7)[0] == pytest.approx(1.0)


# --------------------------------------------------------- OI change --------
def test_oi_change_in_coin_units():
    pts = [(T0 + i * HOUR_MS, 1000.0 + 10 * i) for i in range(25)]
    assert M.oi_change(pts, 24) == pytest.approx((1240 / 1000 - 1) * 100)
    assert M.oi_change(pts, 4) == pytest.approx((1240 / 1200 - 1) * 100)


def test_oi_change_missing_point_returns_none():
    pts = [(T0, 100.0), (T0 + 30 * HOUR_MS, 200.0)]
    assert M.oi_change(pts, 4) is None


def test_oi_change_not_distorted_by_price():
    # Same coin OI, price doubled: change must be 0 (USD OI would show +100%).
    pts = [(T0, 500.0), (T0 + 24 * HOUR_MS, 500.0)]
    assert M.oi_change(pts, 24) == 0


# --------------------------------------------- floor / range / l-s ---------
def test_floor_excludes_latest_candle():
    lows = [5.0] * 72 + [1.0]
    cs = hourly([6.0] * 73, lows=lows, highs=[7.0] * 73)
    assert M.floor_level(cs, 3) == 5.0  # last candle (low 1.0) is the one being tested


def test_range_tightness_and_price_change():
    cs = hourly([10.0] * 23 + [11.0], highs=[12.0] * 24, lows=[9.0] * 24)
    assert M.range_tightness(cs, 24) == pytest.approx(3 / 11 * 100)
    cs2 = hourly([100.0] * 20 + [104.0, 104.0, 104.0, 104.0, 110.0])
    assert M.price_change(cs2, 4) == pytest.approx(110 / 104 * 100 - 100)


def test_long_short_vs_own_average():
    now = T0 + 10 * DAY_MS
    pts = [(now - 9 * DAY_MS, 0.9, 0.1)]  # outside 7-day window
    pts += [(now - i * HOUR_MS, 0.5, 0.5) for i in range(1, 100)]
    pts.append((now, 0.4, 0.6))
    ratio, avg = M.long_short_metrics(sorted(pts), 7, now)
    assert ratio == pytest.approx(0.4 / 0.6)
    assert avg < 1.0 and avg > ratio
