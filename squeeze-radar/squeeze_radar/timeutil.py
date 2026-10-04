"""UTC time helpers. Everything is stored as Unix milliseconds plus ISO strings."""
from __future__ import annotations

import time
from datetime import datetime, timezone

HOUR_MS = 3_600_000
MINUTE_MS = 60_000
DAY_MS = 86_400_000


def now_ms() -> int:
    return int(time.time() * 1000)


def iso(ms: int | None) -> str | None:
    if ms is None:
        return None
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def short(ms: int | None) -> str:
    if ms is None:
        return "-"
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d %H:%M UTC")


def floor_to(ms: int, step_ms: int) -> int:
    return ms - (ms % step_ms)
