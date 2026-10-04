"""Data-source health. A failure is never silent.

Each fetch reports one of:
  ok        data arrived and was non-empty
  ok_empty  the request worked and "no results" is a legitimate answer
  empty     the request worked but returned nothing where data is expected
  error     the request failed (network, HTTP, blocked, format change)
"empty" and "error" count as failures. After N in a row a Telegram warning
is sent, repeated every `rewarn_hours` while the problem lasts, and a
recovery notice is sent when the source works again.
"""
from __future__ import annotations

import logging

from .db import DB
from .redact import redact
from .timeutil import HOUR_MS, now_ms, short

log = logging.getLogger(__name__)

OK, OK_EMPTY, EMPTY, ERROR = "ok", "ok_empty", "empty", "error"


class HealthTracker:
    def __init__(self, db: DB, notifier, failures_before_warning: int, rewarn_hours: float,
                 send_recovery: bool):
        self.db = db
        self.notifier = notifier
        self.n = failures_before_warning
        self.rewarn_ms = rewarn_hours * HOUR_MS
        self.send_recovery = send_recovery

    def report(self, source: str, status: str, detail: str = "") -> None:
        detail = redact(detail)
        t = now_ms()
        row = self.db.one("SELECT * FROM source_health WHERE source=?", (source,))
        fails = row["consecutive_failures"] if row else 0
        in_failure = bool(row["in_failure"]) if row else False
        last_warned = row["last_warned_ms"] if row else None

        if status in (OK, OK_EMPTY):
            if in_failure and self.send_recovery:
                self.notifier.send_system(
                    f"✅ <b>Data source recovered</b>: {source}\n"
                    f"It works again after {fails} failed attempt(s). Result: {status}.")
            self.db.upsert("source_health", {
                "source": source, "consecutive_failures": 0, "last_status": status,
                "last_error": None, "last_ok_ms": t, "in_failure": 0,
                "last_fail_ms": row["last_fail_ms"] if row else None,
                "last_warned_ms": last_warned}, ["source"])
            return

        fails += 1
        level = "ERROR" if status == ERROR else "WARNING"
        log.log(logging.ERROR if status == ERROR else logging.WARNING,
                "source %s %s (%d in a row): %s", source, status, fails, detail)
        self.db.log_event(level, source, f"{status}: {detail}")
        warn = fails >= self.n and (not in_failure or last_warned is None or t - last_warned >= self.rewarn_ms)
        if warn:
            what = "returned EMPTY data" if status == EMPTY else "FAILED"
            last_ok = row["last_ok_ms"] if row else None
            self.notifier.send_system(
                f"⚠️ <b>Data source problem</b>: {source} {what} {fails} times in a row.\n"
                f"Last error: {detail[:600]}\n"
                f"Last success: {short(last_ok)}\n"
                f"This is a fetch failure, not \"no results\".")
            last_warned = t
            in_failure = True
        self.db.upsert("source_health", {
            "source": source, "consecutive_failures": fails, "last_status": status,
            "last_error": detail[:1000], "last_fail_ms": t, "in_failure": int(in_failure),
            "last_ok_ms": row["last_ok_ms"] if row else None, "last_warned_ms": last_warned}, ["source"])
