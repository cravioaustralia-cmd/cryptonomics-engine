"""Hook for a future X/Twitter sentiment check (e.g. via the Grok API).

DISABLED by default (config.yaml -> sentiment.enabled: false).

To add it later:
1. Put the API key in .env (e.g. GROK_API_KEY=...) and read it here with os.environ.
2. Implement `check_sentiment` to return a SentimentResult.
3. Set sentiment.enabled: true.
The result is appended to instant alerts for coins scoring >= sentiment.min_score.
Any exception here is caught and logged, so a broken hook can never stop a scan.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

log = logging.getLogger(__name__)


@dataclass
class SentimentResult:
    label: str          # e.g. "bullish", "bearish", "neutral"
    score: float        # e.g. -1.0 .. 1.0
    summary: str = ""   # one short line for the alert


def check_sentiment(symbol: str, token: str, metrics: dict) -> SentimentResult | None:
    """Return sentiment for `token`, or None if unavailable. Not implemented yet."""
    return None


def sentiment_line(cfg, symbol: str, token: str, metrics: dict, score: float) -> str:
    """Safe wrapper used by the alert code. Returns '' when disabled or on any error."""
    if not cfg.sentiment.enabled or score < cfg.sentiment.min_score:
        return ""
    try:
        r = check_sentiment(symbol, token, metrics)
    except Exception:
        log.exception("sentiment hook failed for %s", symbol)
        return ""
    if r is None:
        return ""
    from .telegram import esc
    return f"\nX sentiment: {esc(r.label)} ({r.score:+.2f}) {esc(r.summary)}"
