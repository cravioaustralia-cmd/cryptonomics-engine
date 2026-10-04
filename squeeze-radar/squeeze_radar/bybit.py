"""Read-only client for Bybit V5 PUBLIC market endpoints. No keys, no account calls.

Endpoints, parameters and fields follow the official docs
(github.com/bybit-exchange/docs, docs/v5/...):
  GET /v5/market/instruments-info   category, limit (1-1000), cursor -> nextPageCursor
  GET /v5/market/tickers            category (all symbols in one call)
  GET /v5/market/kline              list = [startTime, open, high, low, close, volume, turnover],
                                    newest first; the first row can be the candle in progress
  GET /v5/market/open-interest      intervalTime 5min|15min|30min|1h|4h|1d, limit 1-200;
                                    openInterest for linear is in BASE COIN
  GET /v5/market/funding/history    limit 1-200, newest first
  GET /v5/market/account-ratio      period 5min..1d, limit 1-500, buyRatio/sellRatio
  GET /v5/announcements/index       locale, type, page, limit
"""
from __future__ import annotations

import logging
import threading
from dataclasses import dataclass
from typing import Any

import requests

from .http import FetchError, FormatError, RateLimiter, get_with_retries

log = logging.getLogger(__name__)

RETRYABLE_RETCODES = {10006, 10016}  # too many visits, server error


class ApiError(FetchError):
    def __init__(self, ret_code: int, ret_msg: str, path: str):
        super().__init__(f"Bybit retCode={ret_code} {ret_msg} on {path}")
        self.ret_code = ret_code
        self.ret_msg = ret_msg


@dataclass(frozen=True)
class Candle:
    start_ms: int
    open: float
    high: float
    low: float
    close: float
    volume: float     # base coin
    turnover: float   # quote coin (USDT)


def fnum(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _req(d: dict, key: str, where: str) -> Any:
    if not isinstance(d, dict) or key not in d:
        raise FormatError(f"{where}: missing field '{key}'")
    return d[key]


def parse_envelope(payload: Any, path: str) -> dict:
    if not isinstance(payload, dict) or "retCode" not in payload:
        raise FormatError(f"{path}: response is not a Bybit envelope")
    if payload["retCode"] != 0:
        raise ApiError(int(payload["retCode"]), str(payload.get("retMsg")), path)
    result = payload.get("result")
    if not isinstance(result, dict):
        raise FormatError(f"{path}: 'result' is not an object")
    return result


def parse_klines(result: dict) -> list[Candle]:
    rows = _req(result, "list", "kline")
    if not isinstance(rows, list):
        raise FormatError("kline: list is not an array")
    out = []
    for r in rows:
        if not isinstance(r, list) or len(r) < 7:
            raise FormatError(f"kline: row has unexpected shape {r!r}")
        out.append(Candle(int(r[0]), float(r[1]), float(r[2]), float(r[3]), float(r[4]),
                          float(r[5]), float(r[6])))
    out.sort(key=lambda c: c.start_ms)  # ascending
    return out


def parse_instruments(result: dict) -> tuple[list[dict], str]:
    rows = _req(result, "list", "instruments-info")
    if not isinstance(rows, list):
        raise FormatError("instruments-info: list is not an array")
    out = []
    for r in rows:
        for k in ("symbol", "contractType", "status", "baseCoin", "quoteCoin", "launchTime"):
            _req(r, k, "instruments-info item")
        out.append({
            "symbol": r["symbol"],
            "base_coin": r["baseCoin"],
            "quote_coin": r["quoteCoin"],
            "contract_type": r["contractType"],
            "status": r["status"],
            "symbol_type": r.get("symbolType") or "",
            "launch_time_ms": int(r["launchTime"]) if str(r["launchTime"]).isdigit() else None,
            # Docs: fundingInterval is in MINUTES on instruments-info.
            "funding_interval_min": int(r["fundingInterval"]) if str(r.get("fundingInterval", "")).isdigit() else None,
            # Docs: deliveryTime is "Perpetual delisting time" for perpetuals; "0" when none.
            "delivery_time_ms": int(r["deliveryTime"]) if str(r.get("deliveryTime", "0")).isdigit() and int(r.get("deliveryTime") or 0) > 0 else None,
            "tags": [str(t) for t in (r.get("tags") or [])],
        })
    return out, str(result.get("nextPageCursor") or "")


def parse_tickers(result: dict) -> dict[str, dict]:
    rows = _req(result, "list", "tickers")
    if not isinstance(rows, list):
        raise FormatError("tickers: list is not an array")
    out = {}
    for r in rows:
        for k in ("symbol", "lastPrice", "turnover24h", "fundingRate"):
            _req(r, k, "tickers item")
        out[r["symbol"]] = {
            "last_price": fnum(r["lastPrice"]),
            "turnover_24h": fnum(r["turnover24h"]),
            "volume_24h": fnum(r.get("volume24h")),
            "funding_rate": fnum(r["fundingRate"]),
            "funding_interval_hour": fnum(r.get("fundingIntervalHour")),
            "next_funding_ms": int(r["nextFundingTime"]) if str(r.get("nextFundingTime", "")).isdigit() else None,
            "open_interest": fnum(r.get("openInterest")),
            "open_interest_value": fnum(r.get("openInterestValue")),
            "price_24h_pcnt": fnum(r.get("price24hPcnt")),
        }
    return out


def parse_open_interest(result: dict) -> list[tuple[int, float]]:
    rows = _req(result, "list", "open-interest")
    out = []
    for r in rows:
        out.append((int(_req(r, "timestamp", "open-interest item")),
                    float(_req(r, "openInterest", "open-interest item"))))
    out.sort()
    return out


def parse_funding_history(result: dict) -> list[tuple[int, float]]:
    rows = _req(result, "list", "funding/history")
    out = []
    for r in rows:
        out.append((int(_req(r, "fundingRateTimestamp", "funding item")),
                    float(_req(r, "fundingRate", "funding item"))))
    out.sort()
    return out


def parse_account_ratio(result: dict) -> list[tuple[int, float, float]]:
    rows = _req(result, "list", "account-ratio")
    out = []
    for r in rows:
        out.append((int(_req(r, "timestamp", "account-ratio item")),
                    float(_req(r, "buyRatio", "account-ratio item")),
                    float(_req(r, "sellRatio", "account-ratio item"))))
    out.sort()
    return out


class BybitClient:
    def __init__(self, base_url: str, limiter: RateLimiter, timeout: float, max_retries: int,
                 backoff_base: float, backoff_max: float, session: requests.Session | None = None):
        self.base_url = base_url.rstrip("/")
        self.limiter = limiter
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff_base = backoff_base
        self.backoff_max = backoff_max
        self._fixed_session = session
        self._local = threading.local()

    @property
    def session(self) -> requests.Session:
        """One HTTP session per worker thread (requests.Session is not guaranteed thread-safe)."""
        if self._fixed_session is not None:
            return self._fixed_session
        s = getattr(self._local, "s", None)
        if s is None:
            s = requests.Session()
            s.headers.update({"Accept": "application/json", "User-Agent": "squeeze-radar/1.0 (read-only)"})
            self._local.s = s
        return s

    def get(self, path: str, params: dict) -> dict:
        resp = get_with_retries(
            self.session, self.base_url + path, params,
            timeout=self.timeout, max_retries=self.max_retries,
            backoff_base=self.backoff_base, backoff_max=self.backoff_max,
            limiter=self.limiter,
            retry_on_payload=lambda p: isinstance(p, dict) and p.get("retCode") in RETRYABLE_RETCODES,
        )
        try:
            payload = resp.json()
        except ValueError:
            raise FormatError(f"{path}: response is not JSON: {resp.text[:200]!r}") from None
        return parse_envelope(payload, path)

    # -- endpoints ----------------------------------------------------------
    def instruments(self, category: str = "linear") -> list[dict]:
        out: list[dict] = []
        cursor = ""
        for _ in range(50):  # hard stop against a cursor loop
            params = {"category": category, "limit": 1000}
            if cursor:
                params["cursor"] = cursor
            items, cursor = parse_instruments(self.get("/v5/market/instruments-info", params))
            out.extend(items)
            if not cursor or not items:
                break
        else:
            raise FormatError("instruments-info: pagination did not terminate")
        return out

    def tickers(self, category: str = "linear") -> dict[str, dict]:
        return parse_tickers(self.get("/v5/market/tickers", {"category": category}))

    def klines(self, symbol: str, interval: str, limit: int | None = None,
               start: int | None = None, end: int | None = None) -> list[Candle]:
        p: dict[str, Any] = {"category": "linear", "symbol": symbol, "interval": interval}
        if limit:
            p["limit"] = limit
        if start is not None:
            p["start"] = start
        if end is not None:
            p["end"] = end
        return parse_klines(self.get("/v5/market/kline", p))

    def klines_range(self, symbol: str, interval_min: int, start_ms: int, end_ms: int) -> list[Candle]:
        """All candles with start in [start_ms, end_ms], paging backwards 1000 at a time."""
        step = interval_min * 60_000
        out: dict[int, Candle] = {}
        cur_end = end_ms
        for _ in range(100):
            batch = self.klines(symbol, str(interval_min), limit=1000, start=start_ms, end=cur_end)
            if not batch:
                break
            for c in batch:
                if start_ms <= c.start_ms <= end_ms:
                    out[c.start_ms] = c
            oldest = batch[0].start_ms
            if len(batch) < 1000 or oldest <= start_ms:
                break
            cur_end = oldest - step
        return [out[k] for k in sorted(out)]

    def open_interest(self, symbol: str, interval: str, limit: int) -> list[tuple[int, float]]:
        return parse_open_interest(self.get("/v5/market/open-interest", {
            "category": "linear", "symbol": symbol, "intervalTime": interval, "limit": limit}))

    def funding_history(self, symbol: str, limit: int) -> list[tuple[int, float]]:
        return parse_funding_history(self.get("/v5/market/funding/history", {
            "category": "linear", "symbol": symbol, "limit": limit}))

    def account_ratio(self, symbol: str, period: str, limit: int) -> list[tuple[int, float, float]]:
        return parse_account_ratio(self.get("/v5/market/account-ratio", {
            "category": "linear", "symbol": symbol, "period": period, "limit": limit}))

    def announcements(self, locale: str, ann_type: str | None, limit: int, page: int = 1) -> list[dict]:
        p: dict[str, Any] = {"locale": locale, "limit": limit, "page": page}
        if ann_type:
            p["type"] = ann_type
        result = self.get("/v5/announcements/index", p)
        rows = _req(result, "list", "announcements")
        if not isinstance(rows, list):
            raise FormatError("announcements: list is not an array")
        for r in rows:
            _req(r, "title", "announcement item")
            _req(r, "url", "announcement item")
        return rows
