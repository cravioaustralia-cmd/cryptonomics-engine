"""Fetch and parse Binance + Bybit announcements.

Binance: public JSON behind https://www.binance.com/en/support/announcement
  GET /bapi/composite/v1/public/cms/article/catalog/list/query?catalogId=..&pageNo=..&pageSize=..
  -> {"code": "000000", "success": true, "data": {"articles": [{"id", "code", "title", ...}], "total"}}
  (Binance's official announcement API is a signed WebSocket stream that needs an
  API key, which this project never uses.)
Bybit: official V5 endpoint GET /v5/announcements/index (no id field: the id is
  taken from the 'blt...' slug at the end of the article URL).
"""
from __future__ import annotations

import hashlib
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone

import requests

from .http import BlockedError, FetchError, FormatError, get_with_retries

log = logging.getLogger(__name__)


@dataclass
class Announcement:
    source: str              # "binance" | "bybit"
    ann_id: str
    url: str
    title: str
    published_ms: int | None
    category: str = ""
    description: str = ""
    raw: dict = field(default_factory=dict)


# ----------------------------------------------------------------- tokens --

_CAPS = re.compile(r"(?<![A-Za-z0-9])([A-Z0-9][A-Z0-9]{1,14})(?![A-Za-z0-9])")
_PAREN = re.compile(r"\(([A-Za-z0-9]{2,15})\)")
_DATE = re.compile(r"^\d{4}$|^\d{1,2}$|^\d{6,}$|^\d{1,2}(AM|PM)$|^\d{1,2}(ST|ND|RD|TH)$|^Q[1-4]$|^H[12]$")


def extract_tokens(text: str, stopwords: list[str]) -> list[str]:
    """Ticker-looking words: (TICKER) in parentheses and ALL-CAPS words.
    Order preserved, duplicates and stopwords removed."""
    stop = {s.upper() for s in stopwords}
    found: list[str] = []
    for m in _PAREN.finditer(text):
        found.append(m.group(1).upper())
    for m in _CAPS.finditer(text):
        found.append(m.group(1))
    out, seen = [], set()
    for t in found:
        if t in seen or t in stop or _DATE.match(t) or not re.search(r"[A-Z]", t):
            continue
        seen.add(t)
        out.append(t)
    return out


def extract_usdt_symbols(text: str) -> list[str]:
    return list(dict.fromkeys(re.findall(r"(?<![A-Z0-9])([0-9A-Z]{2,25}USDT)(?![A-Z0-9])", text.upper())))


def split_monitoring_title(title: str, stopwords: list[str], removal_keywords: list[str]) -> tuple[list[str], list[str]]:
    """Return (added_tokens, removed_tokens) for a Binance Monitoring Tag title.

    "Binance Will Extend the Monitoring Tag to Include A, B" -> ([A, B], [])
    "Binance Will Remove the Monitoring Tag from C"          -> ([], [C])
    "... Monitoring Tag on A and Remove the Monitoring Tag from C" -> ([A], [C])
    """
    low = title.lower()
    pos = None
    for kw in removal_keywords:
        i = low.find(kw.lower())
        if i != -1 and (pos is None or i < pos):
            pos = i
    if pos is None:
        return extract_tokens(title, stopwords), []
    before, after = title[:pos], title[pos:]
    if any(w in before.lower() for w in ("include", "add", "extend", " on ")):
        return extract_tokens(before, stopwords), extract_tokens(after, stopwords)
    # Pure removal title: every token is a removal.
    return [], extract_tokens(title, stopwords)


_MONTHS = {m: i for i, m in enumerate(["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}


def parse_delisting_time(text: str) -> int | None:
    """Best-effort: find a date/time like 'Oct 10, 2025, 8AM UTC', '2025-10-10 08:00 (UTC)'
    or '10 October 2025 at 8:00 UTC'. Returns Unix ms (UTC) or None."""
    t = text.replace(" ", " ")
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})[ T,]*(?:at )?(\d{1,2}):(\d{2})", t)
    if m:
        y, mo, d, h, mi = map(int, m.groups())
        return _ms(y, mo, d, h, mi)
    m = re.search(r"([A-Za-z]{3})[a-z]*\.? (\d{1,2}),? (\d{4})(?:,? (?:at )?(\d{1,2})(?::(\d{2}))? ?([AaPp][Mm])?)?", t)
    if m and m.group(1).lower()[:3] in _MONTHS:
        return _ms(int(m.group(3)), _MONTHS[m.group(1).lower()[:3]], int(m.group(2)),
                   *_hm(m.group(4), m.group(5), m.group(6)))
    m = re.search(r"(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4})(?:,? (?:at )?(\d{1,2})(?::(\d{2}))? ?([AaPp][Mm])?)?", t)
    if m and m.group(2).lower()[:3] in _MONTHS:
        return _ms(int(m.group(3)), _MONTHS[m.group(2).lower()[:3]], int(m.group(1)),
                   *_hm(m.group(4), m.group(5), m.group(6)))
    return None


def _hm(h, mi, ampm):
    hh = int(h) if h else 0
    if ampm:
        if ampm.lower() == "pm" and hh < 12:
            hh += 12
        if ampm.lower() == "am" and hh == 12:
            hh = 0
    return hh, int(mi) if mi else 0


def _ms(y, mo, d, h=0, mi=0) -> int | None:
    try:
        return int(datetime(y, mo, d, h, mi, tzinfo=timezone.utc).timestamp() * 1000)
    except ValueError:
        return None


# ---------------------------------------------------------------- Binance --

def _looks_blocked(text: str) -> bool:
    low = text[:3000].lower()
    return any(k in low for k in ("captcha", "challenge", "access denied", "cf-chl", "awswaf", "<html"))


def parse_binance_list(payload, base_url: str) -> list[Announcement]:
    if not isinstance(payload, dict):
        raise FormatError("binance: response is not a JSON object")
    if payload.get("success") is not True or str(payload.get("code")) != "000000":
        raise FormatError(f"binance: unexpected status code={payload.get('code')!r} "
                          f"success={payload.get('success')!r} message={payload.get('message')!r}")
    data = payload.get("data")
    if not isinstance(data, dict) or not isinstance(data.get("articles"), list):
        raise FormatError("binance: data.articles missing (response format changed?)")
    out = []
    for a in data["articles"]:
        if not isinstance(a, dict) or "title" not in a or ("id" not in a and "code" not in a):
            raise FormatError(f"binance: article without id/code/title: {str(a)[:200]}")
        code = str(a.get("code") or "")
        aid = str(a.get("id") or code)
        url = f"{base_url}/en/support/announcement/detail/{code}" if code else f"{base_url}/en/support/announcement"
        pub = None
        for k in ("releaseDate", "publishDate", "publishTime"):
            if isinstance(a.get(k), (int, float)) and a[k] > 0:
                pub = int(a[k])
                break
        out.append(Announcement("binance", aid, url, str(a["title"]), pub, raw=a))
    return out


class BinanceAnnouncements:
    def __init__(self, cfg, user_agent: str, timeout: float, session: requests.Session | None = None):
        self.cfg = cfg
        self.timeout = timeout
        self.session = session or requests.Session()
        self.headers = {"User-Agent": user_agent, "Accept": "application/json, text/plain, */*",
                        "Accept-Language": "en-US,en;q=0.9", "clienttype": "web",
                        "Referer": f"{cfg.base_url}/en/support/announcement"}

    def fetch_catalog(self, catalog_id: int, page: int = 1) -> list[Announcement]:
        url = self.cfg.base_url + self.cfg.list_path
        try:
            r = get_with_retries(self.session, url, {"catalogId": catalog_id, "pageNo": page,
                                                     "pageSize": self.cfg.page_size},
                                 timeout=self.timeout, max_retries=2, backoff_base=2.0, backoff_max=20.0,
                                 headers=self.headers)
        except BlockedError as e:
            raise BlockedError(f"Binance blocked the request (HTTP 403{', captcha/WAF page' if e.body and _looks_blocked(e.body) else ''})",
                               403, e.body) from None
        except FetchError as e:
            if e.status == 429:
                raise BlockedError("Binance rate-limited the request (HTTP 429)", 429, e.body) from None
            raise
        if r.status_code == 202 or "x-amzn-waf-action" in {k.lower() for k in r.headers}:
            raise BlockedError(f"Binance returned a WAF/captcha challenge (HTTP {r.status_code})", r.status_code)
        try:
            payload = r.json()
        except ValueError:
            if _looks_blocked(r.text):
                raise BlockedError("Binance returned an HTML/captcha page instead of JSON", r.status_code, r.text[:300]) from None
            raise FormatError(f"Binance response is not JSON: {r.text[:200]!r}") from None
        return parse_binance_list(payload, self.cfg.base_url)

    def fetch_detail_text(self, code: str) -> str:
        """Best-effort article body (used only when the title names no token)."""
        url = self.cfg.base_url + self.cfg.detail_path
        r = get_with_retries(self.session, url, {"articleCode": code}, timeout=self.timeout,
                             max_retries=1, backoff_base=2.0, backoff_max=10.0, headers=self.headers)
        try:
            data = r.json().get("data") or {}
        except ValueError:
            raise FormatError("Binance article detail is not JSON") from None
        body = data.get("body") or data.get("content") or ""
        # Body is a JSON-encoded rich-text tree. Collect every text leaf.
        texts = re.findall(r'"text"\s*:\s*"((?:[^"\\]|\\.)*)"', body) if isinstance(body, str) else []
        return " ".join(texts) if texts else (body if isinstance(body, str) else "")


# ------------------------------------------------------------------ Bybit --

def bybit_ann_id(url: str) -> str:
    m = re.search(r"-(blt[0-9a-zA-Z]+)/?(?:\?.*)?$", url)
    if m:
        return m.group(1)
    return "url-" + hashlib.sha1(url.encode()).hexdigest()[:16]


def parse_bybit_announcements(rows: list[dict]) -> list[Announcement]:
    out = []
    for r in rows:
        typ = r.get("type") or {}
        pub = r.get("publishTime") or r.get("dateTimestamp")
        out.append(Announcement(
            "bybit", bybit_ann_id(r["url"]), r["url"], str(r["title"]),
            int(pub) if isinstance(pub, (int, float)) and pub > 0 else None,
            category=str(typ.get("key") or ""), description=str(r.get("description") or ""),
            raw={"tags": r.get("tags"), "type": typ}))
    return out


def classify_bybit(a: Announcement, risk_keywords: list[str]) -> str | None:
    """'delisting', 'risk' or None."""
    low = f" {a.title.lower()} "
    if a.category == "delistings" or "delist" in low:
        return "delisting"
    if any(k.lower() in low for k in risk_keywords):
        return "risk"
    return None
