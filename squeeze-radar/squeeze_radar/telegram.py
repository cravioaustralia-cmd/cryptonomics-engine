"""Telegram notifier (HTML parse mode) with a persistent outbox.

Every message is first written to the SQLite outbox, then sent. If Telegram is
down, the message stays in the outbox and is retried on the next run, so an
outage never loses an alert and a restart never resends a delivered one.
In dry-run mode messages are printed to the console instead.
"""
from __future__ import annotations

import html
import logging
import time
from typing import Callable

import requests

from .db import DB
from .http import backoff_delay
from .timeutil import iso, now_ms

log = logging.getLogger(__name__)

MAX_LEN = 4096  # Telegram sendMessage text limit (python-telegram-bot MessageLimit.MAX_TEXT_LENGTH)


def esc(s) -> str:
    """Escape text for Telegram HTML mode (&, <, > and quotes)."""
    return html.escape(str(s), quote=True)


def split_message(text: str, limit: int = MAX_LEN) -> list[str]:
    """Split on line boundaries so no chunk exceeds `limit`. Lines longer than the
    limit are hard-split. Tags are kept per-line by the formatters, so a split
    never cuts an HTML tag in half."""
    if len(text) <= limit:
        return [text]
    chunks, cur = [], ""
    for line in text.split("\n"):
        while len(line) > limit:
            if cur:
                chunks.append(cur)
                cur = ""
            chunks.append(line[:limit])
            line = line[limit:]
        candidate = line if not cur else cur + "\n" + line
        if len(candidate) > limit:
            chunks.append(cur)
            cur = line
        else:
            cur = candidate
    if cur:
        chunks.append(cur)
    return chunks


class TelegramError(Exception):
    pass


class Notifier:
    def __init__(self, db: DB, token: str, chat_id: str, *, dry_run: bool, max_retries: int,
                 min_interval: float, timeout: float, session: requests.Session | None = None,
                 printer: Callable[[str], None] = print, sleep: Callable[[float], None] = time.sleep):
        self.db = db
        self.token = token
        self.chat_id = chat_id
        self.dry_run = dry_run
        self.max_retries = max_retries
        self.min_interval = min_interval
        self.timeout = timeout
        self.session = session or requests.Session()
        self.printer = printer
        self.sleep = sleep
        self._last_send = 0.0
        self.sent_count = 0

    # -- public -------------------------------------------------------------
    def queue(self, text: str) -> None:
        """Store a message in the outbox without sending. Use inside a DB transaction
        so the message and the state change that caused it commit together."""
        for chunk in split_message(text):
            t = now_ms()
            self.db.insert("outbox", {"created_ms": t, "created_iso": iso(t), "text": chunk})

    def send(self, text: str) -> None:
        """Queue a message and try to deliver everything pending."""
        self.queue(text)
        self.flush()

    send_system = send

    def flush(self) -> int:
        pending = self.db.all("SELECT id, text, attempts FROM outbox WHERE sent_ms IS NULL ORDER BY id")
        delivered = 0
        for row in pending:
            try:
                self._deliver(row["text"])
            except TelegramError as e:
                self.db.execute("UPDATE outbox SET attempts=attempts+1, last_error=? WHERE id=?",
                                (str(e)[:500], row["id"]))
                self.db.log_event("ERROR", "telegram", str(e))
                log.error("Telegram delivery failed, message kept in outbox for retry: %s", e)
                break  # keep order; retry later
            self.db.execute("UPDATE outbox SET sent_ms=?, attempts=attempts+1 WHERE id=?", (now_ms(), row["id"]))
            delivered += 1
            self.sent_count += 1
        return delivered

    # -- internals ----------------------------------------------------------
    def _deliver(self, text: str) -> None:
        if self.dry_run:
            self.printer("\n----- [DRY-RUN Telegram message] -----\n" + text + "\n--------------------------------------")
            return
        wait = self.min_interval - (time.monotonic() - self._last_send)
        if wait > 0:
            self.sleep(wait)
        url = f"https://api.telegram.org/bot{self.token}/sendMessage"
        body = {"chat_id": self.chat_id, "text": text, "parse_mode": "HTML",
                "disable_web_page_preview": True}
        last = "unknown error"
        for attempt in range(self.max_retries + 1):
            try:
                r = self.session.post(url, json=body, timeout=self.timeout)
                self._last_send = time.monotonic()
                try:
                    data = r.json()
                except ValueError:
                    data = {}
                if r.status_code == 200 and data.get("ok"):
                    return
                desc = data.get("description") or r.text[:200]
                last = f"HTTP {r.status_code}: {desc}"
                if r.status_code == 429:
                    ra = (data.get("parameters") or {}).get("retry_after", 5)
                    self.sleep(float(ra) + 0.5)
                    continue
                if r.status_code == 400 and "parse" in str(desc).lower():
                    # Broken HTML should never happen, but never drop the alert: send as plain text.
                    body = {"chat_id": self.chat_id, "text": html.unescape(_strip_tags(text)),
                            "disable_web_page_preview": True}
                    continue
                if 400 <= r.status_code < 500 and r.status_code != 429:
                    raise TelegramError(last)  # bad token/chat id: retrying will not help
            except requests.RequestException as e:
                last = f"network error: {e}"
            if attempt < self.max_retries:
                self.sleep(backoff_delay(attempt, 1.0, 30.0))
        raise TelegramError(last)


def _strip_tags(s: str) -> str:
    import re
    return re.sub(r"</?[a-zA-Z][^>]*>", "", s)
