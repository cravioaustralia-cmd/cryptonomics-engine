"""Wire everything together and run jobs, either once or in a loop.

Jobs run one after another in a single thread, so runs can never overlap.
The last completed time slot of each job is stored in SQLite, so a restart
neither repeats a slot (no duplicate hourly summary) nor runs missed slots
several times (one catch-up run).
"""
from __future__ import annotations

import logging
import signal
import time
import traceback

from .bybit import BybitClient
from .collector import CollectJob
from .db import DB
from .health import ERROR, OK, HealthTracker
from .http import FetchError, FormatError, RateLimiter
from .outcomes import OutcomeJob
from .summary import heartbeat, hourly_summary
from .telegram import Notifier, esc
from .timeutil import DAY_MS, MINUTE_MS, iso, now_ms
from .universe import UniverseJob
from .watcher import AnnouncementJob

log = logging.getLogger(__name__)


class App:
    def __init__(self, cfg, dry_run: bool):
        self.cfg = cfg
        self.dry_run = dry_run
        self.db = DB(cfg.path(cfg.paths.database))
        b = cfg.bybit
        self.client = BybitClient(b.base_url, RateLimiter(b.max_requests_per_second), b.request_timeout_seconds,
                                  b.max_retries, b.backoff_base_seconds, b.backoff_max_seconds)
        t = cfg.alerts.telegram
        self.notifier = Notifier(self.db, cfg.telegram_bot_token, cfg.telegram_chat_id, dry_run=dry_run,
                                 max_retries=t.max_retries, min_interval=t.min_seconds_between_messages,
                                 timeout=t.timeout_seconds)
        h = cfg.health
        self.health = HealthTracker(self.db, self.notifier, h.failures_before_warning, h.rewarn_hours,
                                    h.send_recovery_notice)
        self.universe = UniverseJob(self.db, self.client, self.notifier, self.health, cfg, dry_run)
        self.collect = CollectJob(self.db, self.client, self.notifier, self.health, cfg, dry_run)
        self.announcements = AnnouncementJob(self.db, self.client, self.notifier, self.health, cfg, dry_run)
        self.outcomes = OutcomeJob(self.db, self.client, cfg)
        self._stop = False

    # ----------------------------------------------------------------- jobs --
    def jobs(self):
        s = self.cfg.schedule
        hh, mm = map(int, s.heartbeat_utc.split(":"))
        return [
            # name, interval ms, offset ms, function
            ("universe", s.universe_minutes * MINUTE_MS, 0, self.universe.run),
            ("announcements", s.announcements_minutes * MINUTE_MS, 0, self.announcements.run),
            ("collect", s.collect_minutes * MINUTE_MS, s.collect_offset_seconds * 1000, self.collect.run),
            ("hourly_summary", s.hourly_summary_minutes * MINUTE_MS, s.hourly_summary_offset_seconds * 1000,
             lambda: hourly_summary(self.db, self.notifier, self.cfg, self.dry_run)),
            ("outcomes", s.outcomes_minutes * MINUTE_MS, 120_000, self.outcomes.run),
            ("heartbeat", DAY_MS, (hh * 60 + mm) * MINUTE_MS, lambda: heartbeat(self.db, self.notifier, self.cfg)),
        ]

    def run_job(self, name: str, fn) -> bool:
        started = now_ms()
        log.info("job %s: start", name)
        try:
            result = fn()
            ok, err = True, None
            log.info("job %s: done in %.1fs %s", name, (now_ms() - started) / 1000, result)
            self.health.report(f"job:{name}", OK)
        except (FetchError, FormatError) as e:
            # Already reported (and warned about) by the data source's own health entry.
            ok, err = False, f"{type(e).__name__}: {e}"
            log.error("job %s failed: %s", name, err)
        except Exception as e:
            ok, err = False, f"{type(e).__name__}: {e}"
            log.error("job %s failed: %s\n%s", name, err, traceback.format_exc())
            self.health.report(f"job:{name}", ERROR, err)
        self.db.upsert("job_state", {"job": name, "last_run_ms": started, "last_run_iso": iso(started),
                                     "last_ok": int(ok), "last_error": err}, ["job"])
        return ok

    def _slot(self, t: int, interval: int, offset: int) -> int:
        return (t - offset) // interval

    def _mark_slot(self, name: str, slot: int) -> None:
        self.db.execute("INSERT INTO job_state (job, last_slot_ms) VALUES (?, ?) "
                        "ON CONFLICT(job) DO UPDATE SET last_slot_ms=excluded.last_slot_ms", (name, slot))

    def run_once(self, only: list[str] | None = None) -> None:
        order = ["universe", "announcements", "collect", "hourly_summary", "outcomes"]
        if only:
            order = [j for j in order + ["heartbeat"] if j in only]
        jobs = {n: (iv, off, fn) for n, iv, off, fn in self.jobs()}
        for name in order:
            iv, off, fn = jobs[name]
            self.run_job(name, fn)
            self._mark_slot(name, self._slot(now_ms(), iv, off))
        self.notifier.flush()

    def run_loop(self) -> None:
        signal.signal(signal.SIGTERM, self._on_signal)
        signal.signal(signal.SIGINT, self._on_signal)
        jobs = self.jobs()
        # Heartbeat: do not fire on startup just because today's time already passed.
        t = now_ms()
        for name, iv, off, _ in jobs:
            r = self.db.one("SELECT last_slot_ms FROM job_state WHERE job=?", (name,))
            if name == "heartbeat" and (r is None or r["last_slot_ms"] is None):
                self._mark_slot(name, self._slot(t, iv, off))
        self.notifier.send(f"▶️ <b>squeeze-radar started</b> ({'DRY-RUN' if self.dry_run else 'live'}) "
                           f"{esc(iso(t))}. Read-only scanner: no trading, no API keys.")
        # Universe must exist before the first collect.
        if not self.db.one("SELECT 1 FROM instruments WHERE active=1 LIMIT 1"):
            if self.run_job("universe", self.universe.run):
                iv, off = next((iv, off) for n, iv, off, _ in jobs if n == "universe")
                self._mark_slot("universe", self._slot(now_ms(), iv, off))
        while not self._stop:
            for name, iv, off, fn in jobs:
                if self._stop:
                    break
                t = now_ms()
                slot = self._slot(t, iv, off)
                r = self.db.one("SELECT last_slot_ms FROM job_state WHERE job=?", (name,))
                if r is None or r["last_slot_ms"] is None or slot > r["last_slot_ms"]:
                    self.run_job(name, fn)
                    self._mark_slot(name, slot)
            self.notifier.flush()  # retry anything Telegram could not take earlier
            for _ in range(self.cfg.schedule.loop_tick_seconds):
                if self._stop:
                    break
                time.sleep(1)
        log.info("stopped cleanly")

    def _on_signal(self, signum, _frame):
        log.info("signal %s received: finishing current job, then exiting", signum)
        self._stop = True

    def close(self):
        self.db.close()
