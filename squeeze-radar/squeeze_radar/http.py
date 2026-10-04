"""HTTP plumbing: a global rate limiter, timeouts, retries with backoff + jitter."""
from __future__ import annotations

import logging
import random
import threading
import time
from typing import Any, Callable

import requests

log = logging.getLogger(__name__)


class FetchError(Exception):
    """The request could not be completed (network, HTTP status, retries exhausted)."""

    def __init__(self, message: str, status: int | None = None, body: str | None = None):
        super().__init__(message)
        self.status = status
        self.body = body


class FormatError(Exception):
    """The response arrived but does not have the documented shape."""


class BlockedError(FetchError):
    """The site actively refused us (403 / captcha / WAF)."""


class RateLimiter:
    """Thread-safe limiter: requests are spaced at least 1/rate seconds apart."""

    def __init__(self, per_second: float):
        self.interval = 1.0 / per_second
        self._lock = threading.Lock()
        self._next = 0.0

    def wait(self) -> None:
        with self._lock:
            now = time.monotonic()
            t = max(now, self._next)
            self._next = t + self.interval
        delay = t - time.monotonic()
        if delay > 0:
            time.sleep(delay)


def backoff_delay(attempt: int, base: float, cap: float) -> float:
    return min(cap, base * (2 ** attempt)) + random.uniform(0, base)


def get_with_retries(
    session: requests.Session,
    url: str,
    params: dict | None,
    *,
    timeout: float,
    max_retries: int,
    backoff_base: float,
    backoff_max: float,
    limiter: RateLimiter | None = None,
    headers: dict | None = None,
    retry_on_payload: Callable[[Any], bool] | None = None,
    sleep: Callable[[float], None] = time.sleep,
) -> requests.Response:
    """GET with retries on network errors, 429 and 5xx.

    retry_on_payload(json) may return True to retry (e.g. Bybit retCode 10006).
    403 is never retried: it means we are banned or blocked, and hammering makes it worse.
    """
    last: Exception | None = None
    for attempt in range(max_retries + 1):
        if limiter:
            limiter.wait()
        try:
            resp = session.get(url, params=params, timeout=timeout, headers=headers)
        except requests.RequestException as e:
            last = FetchError(f"network error: {type(e).__name__}: {e}")
        else:
            if resp.status_code == 403:
                raise BlockedError(f"HTTP 403 Forbidden from {url}", 403, resp.text[:500])
            if resp.status_code == 429 or resp.status_code >= 500:
                last = FetchError(f"HTTP {resp.status_code} from {url}", resp.status_code, resp.text[:500])
                ra = resp.headers.get("Retry-After")
                if ra and ra.isdigit() and attempt < max_retries:
                    sleep(min(float(ra), backoff_max))
                    continue
            elif resp.status_code != 200:
                raise FetchError(f"HTTP {resp.status_code} from {url}", resp.status_code, resp.text[:500])
            else:
                if retry_on_payload is not None:
                    try:
                        payload = resp.json()
                    except ValueError:
                        return resp
                    if retry_on_payload(payload):
                        last = FetchError(f"retryable API payload from {url}: {str(payload)[:200]}")
                    else:
                        return resp
                else:
                    return resp
        if attempt < max_retries:
            d = backoff_delay(attempt, backoff_base, backoff_max)
            log.debug("retry %d/%d for %s in %.1fs (%s)", attempt + 1, max_retries, url, d, last)
            sleep(d)
    assert last is not None
    raise last
