import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from squeeze_radar.bybit import Candle  # noqa: E402
from squeeze_radar.config import load_config  # noqa: E402
from squeeze_radar.timeutil import HOUR_MS  # noqa: E402

T0 = 1_759_000_000_000 - (1_759_000_000_000 % HOUR_MS)  # fixed hour boundary (Sept 2025)


@pytest.fixture
def cfg():
    return load_config(ROOT / "config.yaml", require_telegram=False)


def hourly(closes, start=T0, turnover=1000.0, spread=0.01, lows=None, highs=None, turnovers=None):
    """Build ascending 1h candles from a list of closes."""
    out = []
    prev = closes[0]
    for i, c in enumerate(closes):
        o = prev
        hi = highs[i] if highs else max(o, c) * (1 + spread)
        lo = lows[i] if lows else min(o, c) * (1 - spread)
        t = turnovers[i] if turnovers else turnover
        out.append(Candle(start + i * HOUR_MS, o, hi, lo, c, t / c, t))
        prev = c
    return out


def five_min(rows, start):
    """rows: list of (open, high, low, close)."""
    return [Candle(start + i * 300_000, o, h, l, c, 0, 0) for i, (o, h, l, c) in enumerate(rows)]
