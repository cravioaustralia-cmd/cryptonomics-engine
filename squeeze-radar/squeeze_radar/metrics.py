"""Pure metric calculations. No I/O here, so every function is unit-tested.

Conventions:
- Candles are ascending by start time.
- Only CLOSED candles are used: a candle is closed when start + interval <= now.
- Percentages are returned as percent (1.5 means +1.5%).
"""
from __future__ import annotations

from typing import Sequence

from .bybit import Candle
from .timeutil import DAY_MS, HOUR_MS

VALID_FUNDING_HOURS = (1, 2, 4, 8)


def closed_candles(candles: Sequence[Candle], interval_ms: int, now_ms: int) -> list[Candle]:
    """Drop any candle that has not finished yet (Bybit returns the live one first)."""
    return [c for c in candles if c.start_ms + interval_ms <= now_ms]


def pct(new: float | None, old: float | None) -> float | None:
    if new is None or old is None or old == 0:
        return None
    return (new / old - 1.0) * 100.0


# ---------------------------------------------------------------- funding --

def normalize_funding_8h(rate: float | None, interval_hours: float | None) -> float | None:
    """Convert a per-interval funding rate to its 8-hour equivalent.

    A coin that settles every 1h at -0.01% pays -0.08% per 8h. Without this,
    1h/2h/4h coins look far less negative than 8h coins.
    """
    if rate is None or not interval_hours or interval_hours <= 0:
        return None
    return rate * 8.0 / interval_hours


def settlement_intervals(history: Sequence[tuple[int, float]], current_interval_h: float) -> list[float]:
    """Interval (hours) that each settlement covered, inferred from the gap to the
    previous settlement. Falls back to the current interval when the gap is not a
    standard interval (first row, missing rows, or an interval change)."""
    out = []
    for i, (ts, _) in enumerate(history):
        h = current_interval_h
        if i > 0:
            gap_h = round((ts - history[i - 1][0]) / HOUR_MS)
            if gap_h in VALID_FUNDING_HOURS:
                h = float(gap_h)
        out.append(h)
    return out


def funding_metrics(current_rate: float | None, interval_h: float | None,
                    history: Sequence[tuple[int, float]], n_avg: int,
                    own_avg_days: int, now_ms: int) -> dict:
    """history: ascending (timestamp_ms, rate) settlements."""
    ih = interval_h if interval_h and interval_h > 0 else None
    res = {"funding_interval_h": ih,
           "funding_now_8h": normalize_funding_8h(current_rate, ih),
           "funding_avg_n_8h": None, "funding_own_avg_8h": None}
    if not history or ih is None:
        return res
    hist = [h for h in history if h[0] <= now_ms]
    ints = settlement_intervals(hist, ih)
    norm = [normalize_funding_8h(r, i) for (_, r), i in zip(hist, ints)]
    last = norm[-n_avg:]
    if last:
        res["funding_avg_n_8h"] = sum(last) / len(last)
    cutoff = now_ms - own_avg_days * DAY_MS
    window = [v for (ts, _), v in zip(hist, norm) if ts >= cutoff]
    if window:
        res["funding_own_avg_8h"] = sum(window) / len(window)
    return res


# ----------------------------------------------------------- volume / price --

def volume_ratio(closed_hourly: Sequence[Candle], baseline_days: int) -> tuple[float | None, float | None]:
    """Last 24h turnover (USDT) / average daily turnover of the previous N FULL days.

    Uses closed 1h candles only. The baseline excludes the current 24h window.
    Returns (ratio, last_24h_turnover).
    """
    need = 24 * (1 + baseline_days)
    if len(closed_hourly) < need:
        return None, None
    last24 = sum(c.turnover for c in closed_hourly[-24:])
    base = closed_hourly[-need:-24]
    base_daily = sum(c.turnover for c in base) / baseline_days
    if base_daily <= 0:
        return None, last24
    return last24 / base_daily, last24


def price_change(closed_hourly: Sequence[Candle], hours: int) -> float | None:
    """% change from the close `hours` candles ago to the last close."""
    if len(closed_hourly) < hours + 1:
        return None
    return pct(closed_hourly[-1].close, closed_hourly[-1 - hours].close)


def range_tightness(closed_hourly: Sequence[Candle], hours: int) -> float | None:
    """(high - low) / last close over the last `hours` closed candles, in %."""
    if len(closed_hourly) < hours:
        return None
    w = closed_hourly[-hours:]
    last = w[-1].close
    if last <= 0:
        return None
    return (max(c.high for c in w) - min(c.low for c in w)) / last * 100.0


def floor_level(closed_hourly: Sequence[Candle], days: int, upto_index: int | None = None) -> float | None:
    """Lowest low of the `days` days of closed candles BEFORE candle `upto_index`
    (default: before the latest closed candle).

    The latest candle is excluded on purpose: a floor that includes the candle
    being tested could never be broken, so invalidation would be impossible.
    """
    n = days * 24
    end = len(closed_hourly) - 1 if upto_index is None else upto_index
    if end < n:
        return None
    return min(c.low for c in closed_hourly[end - n:end])


def range_high(closed_hourly: Sequence[Candle], hours: int, upto_index: int | None = None) -> float | None:
    """Highest high of the `hours` closed candles before candle `upto_index`."""
    end = len(closed_hourly) - 1 if upto_index is None else upto_index
    if end < hours:
        return None
    return max(c.high for c in closed_hourly[end - hours:end])


def avg_hourly_turnover(closed_hourly: Sequence[Candle], hours: int, upto_index: int | None = None) -> float | None:
    end = len(closed_hourly) - 1 if upto_index is None else upto_index
    if end < hours:
        return None
    w = closed_hourly[end - hours:end]
    return sum(c.turnover for c in w) / len(w)


# ------------------------------------------------------------- open interest --

def oi_change(points: Sequence[tuple[int, float]], hours: int) -> float | None:
    """% change of open interest in COIN units over `hours`.

    points: ascending (timestamp_ms, oi_coin). Matches the point exactly `hours`
    before the latest; if that exact point is missing, uses the nearest earlier
    point no more than 1h older. Otherwise returns None (no guessing).
    """
    if len(points) < 2:
        return None
    t_last, v_last = points[-1]
    target = t_last - hours * HOUR_MS
    best = None
    for t, v in points:
        if target - HOUR_MS <= t <= target:
            best = v  # the latest qualifying point (closest to target)
    return pct(v_last, best)


# --------------------------------------------------------------- long/short --

def long_short_metrics(points: Sequence[tuple[int, float, float]], avg_days: int, now_ms: int) -> tuple[float | None, float | None]:
    """Return (latest long/short account ratio, its own average over avg_days).

    ratio = buyRatio / sellRatio. Lower = more accounts short.
    """
    pts = [p for p in points if p[0] <= now_ms and p[2] > 0]
    if not pts:
        return None, None
    ratios = [(t, b / s) for t, b, s in pts]
    cutoff = now_ms - avg_days * DAY_MS
    window = [r for t, r in ratios if t >= cutoff]
    avg = sum(window) / len(window) if window else None
    return ratios[-1][1], avg


# ------------------------------------------------------------------ bundle --

def compute_symbol_metrics(*, now_ms: int, ticker: dict, closed_hourly: Sequence[Candle],
                           oi_points: Sequence[tuple[int, float]],
                           funding_hist: Sequence[tuple[int, float]],
                           ls_points: Sequence[tuple[int, float, float]],
                           btc_chg_24h: float | None, col, stages_cfg) -> dict:
    """Combine raw data for one symbol into the stored/scored metric set."""
    m: dict = {}
    m["last_price"] = ticker.get("last_price")
    m["chg_4h_pct"] = price_change(closed_hourly, 4)
    m["chg_24h_pct"] = price_change(closed_hourly, 24)
    vr, t24 = volume_ratio(closed_hourly, col.volume_ratio_baseline_days)
    m["volume_ratio"] = vr
    m["turnover_24h"] = ticker.get("turnover_24h")
    m["turnover_24h_closed"] = t24
    m["oi_coin"] = oi_points[-1][1] if oi_points else None
    price = m["last_price"]
    m["oi_usd"] = m["oi_coin"] * price if (m["oi_coin"] is not None and price) else None
    m["oi_chg_4h_pct"] = oi_change(oi_points, 4)
    m["oi_chg_24h_pct"] = oi_change(oi_points, 24)
    m.update(funding_metrics(ticker.get("funding_rate"), ticker.get("funding_interval_hour"),
                             funding_hist, col.funding_avg_settlements, col.funding_own_avg_days, now_ms))
    m["ls_ratio"], m["ls_avg"] = long_short_metrics(ls_points, col.ls_avg_days, now_ms)
    m["perf_vs_btc_pct"] = (m["chg_24h_pct"] - btc_chg_24h) if (m["chg_24h_pct"] is not None and btc_chg_24h is not None) else None
    m["range_tightness_pct"] = range_tightness(closed_hourly, col.range_hours)
    m["floor"] = floor_level(closed_hourly, col.floor_days)
    m["range_high"] = range_high(closed_hourly, stages_cfg.trigger_range_hours)
    last = closed_hourly[-1] if closed_hourly else None
    m["last_candle_ms"] = last.start_ms if last else None
    m["last_close"] = last.close if last else None
    m["last_low"] = last.low if last else None
    m["last_turnover_1h"] = last.turnover if last else None
    m["avg_turnover_1h"] = avg_hourly_turnover(closed_hourly, stages_cfg.trigger_turnover_avg_hours)
    return m
