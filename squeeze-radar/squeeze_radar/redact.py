"""Mask secrets (Telegram bot tokens) in anything that is logged, stored or printed.

A Telegram request URL looks like https://api.telegram.org/bot<TOKEN>/sendMessage,
and network errors from `requests` include that URL. Every log line, stored error
and console message goes through `redact()` so the token never leaks.
"""
from __future__ import annotations

import logging
import re

# bot123456789:AAH... inside URLs, and a bare token anywhere else.
_BOT_URL = re.compile(r"bot\d{5,}:[A-Za-z0-9_-]{20,}")
_BARE = re.compile(r"(?<![A-Za-z0-9])\d{5,}:[A-Za-z0-9_-]{30,}")
_extra: set[str] = set()


def register_secret(value: str | None) -> None:
    """Also mask this exact value (e.g. the configured token), whatever its shape."""
    if value and len(value) >= 8:
        _extra.add(value)


def redact(text) -> str:
    s = str(text)
    for v in _extra:
        if v in s:
            s = s.replace(v, "<redacted>")
    s = _BOT_URL.sub("bot<redacted>", s)
    return _BARE.sub("<redacted-token>", s)


class RedactingFormatter(logging.Formatter):
    """Formats the full record (message, args and traceback), then masks secrets."""

    def format(self, record: logging.LogRecord) -> str:
        return redact(super().format(record))
