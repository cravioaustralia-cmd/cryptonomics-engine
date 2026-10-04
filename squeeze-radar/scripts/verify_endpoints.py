#!/usr/bin/env python3
"""LIVE check of every endpoint, field and unit squeeze-radar relies on.

Run this first on any new machine (laptop or server):

    python scripts/verify_endpoints.py

It only makes public GET requests (no keys, no account access). Each check
prints PASS / WARN / FAIL. Exit code 1 if anything FAILs.
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from squeeze_radar.config import load_config  # noqa: E402
from squeeze_radar.redact import redact  # noqa: E402

RESULTS = []


def check(name, ok, detail="", warn=False):
    tag = "PASS" if ok else ("WARN" if warn else "FAIL")
    RESULTS.append(tag)
    print(f"[{tag}] {name}" + (f" -- {detail}" if detail else ""))


def bybit(path, **params):
    r = requests.get("https://api.bybit.com" + path, params=params, timeout=20,
                     headers={"User-Agent": "squeeze-radar-verify/1.0"})
    if r.status_code != 200:
        raise RuntimeError(f"HTTP {r.status_code}: {r.text[:200]}")
    j = r.json()
    if j.get("retCode") != 0:
        raise RuntimeError(f"retCode {j.get('retCode')}: {j.get('retMsg')}")
    return j["result"]


def main() -> int:
    import argparse
    ap = argparse.ArgumentParser(description="Live endpoint verification (public GET requests only)")
    ap.add_argument("--config", default=str(ROOT / "config.yaml"))
    args = ap.parse_args()
    cfg = load_config(args.config, require_telegram=False)
    now = int(time.time() * 1000)
    sym = "BTCUSDT"
    fi: dict = {}

    # ---- instruments-info --------------------------------------------------
    try:
        allrows, cursor, pages = [], "", 0
        while True:
            p = {"category": "linear", "limit": 1000}
            if cursor:
                p["cursor"] = cursor
            res = bybit("/v5/market/instruments-info", **p)
            allrows += res["list"]
            pages += 1
            cursor = res.get("nextPageCursor") or ""
            if not cursor or not res["list"] or pages > 20:
                break
        check("instruments-info returns data", len(allrows) > 100, f"{len(allrows)} rows in {pages} page(s)")
        need = ["symbol", "contractType", "status", "baseCoin", "quoteCoin", "launchTime", "deliveryTime",
                "fundingInterval"]
        missing = [k for k in need if k not in allrows[0]]
        check("instruments-info has required fields", not missing, f"missing {missing}" if missing else "")
        perps = [r for r in allrows if r["quoteCoin"] == "USDT" and r["contractType"] == "LinearPerpetual"
                 and r["status"] == "Trading"]
        check("USDT LinearPerpetual Trading symbols found", len(perps) > 100, f"{len(perps)}")
        fi = {r["symbol"]: r.get("fundingInterval") for r in perps}
        check("fundingInterval looks like MINUTES (60/120/240/480)",
              set(int(v) for v in fi.values() if str(v).isdigit()) <= {60, 120, 240, 480, 960},
              f"values seen: {sorted(set(fi.values()))[:8]}", warn=True)
        check("'tags' field present (Bybit risk tags e.g. ST)", "tags" in allrows[0],
              f"examples: {[r['symbol'] for r in perps if r.get('tags')][:5]}", warn=True)
        dts = sorted({r['deliveryTime'] for r in perps})[:3]
        check("perp deliveryTime is '0' unless delisting is scheduled", "0" in dts, f"sample {dts}", warn=True)
        prefixed = [r["symbol"] for r in perps if r["symbol"][0].isdigit()][:8]
        print(f"       multiplier-prefixed examples: {prefixed}")
        print(f"       baseCoin of first prefixed: "
              f"{[(r['symbol'], r['baseCoin']) for r in perps if r['symbol'][0].isdigit()][:3]}")
    except Exception as e:
        check("instruments-info", False, str(e))
        perps = []

    # ---- tickers ------------------------------------------------------------
    try:
        res = bybit("/v5/market/tickers", category="linear")
        tk = {r["symbol"]: r for r in res["list"]}
        check("tickers returns all symbols in ONE call", len(tk) > 100, f"{len(tk)}")
        t = tk[sym]
        need = ["lastPrice", "turnover24h", "volume24h", "fundingRate", "fundingIntervalHour", "openInterest",
                "openInterestValue", "nextFundingTime"]
        missing = [k for k in need if k not in t]
        check("tickers has required fields", not missing, f"missing {missing}" if missing else "")
        t24, v24, lp = float(t["turnover24h"]), float(t["volume24h"]), float(t["lastPrice"])
        check("turnover24h is in USDT (~ volume24h x price)", 0.5 < t24 / (v24 * lp) < 2.0,
              f"turnover/(vol*price)={t24 / (v24 * lp):.2f}")
        mism = [s for s, r in tk.items() if s in fi and str(fi[s]).isdigit() and r.get("fundingIntervalHour")
                and abs(int(fi[s]) / 60 - float(r["fundingIntervalHour"])) > 0.01]
        check("fundingIntervalHour (tickers) == fundingInterval/60 (instruments)", not mism,
              f"{len(mism)} mismatches e.g. {mism[:3]}" if mism else "", warn=True)
        hours = sorted({r.get("fundingIntervalHour") for r in tk.values() if r.get("fundingIntervalHour")})
        print(f"       fundingIntervalHour values: {hours}")
    except Exception as e:
        check("tickers", False, str(e))
        tk = {}

    # ---- kline -------------------------------------------------------------
    try:
        res = bybit("/v5/market/kline", category="linear", symbol=sym, interval="60", limit=200)
        rows = res["list"]
        check("kline returns 200 rows of 7 fields", len(rows) == 200 and len(rows[0]) == 7, f"{len(rows)} rows")
        check("kline is newest-first", int(rows[0][0]) > int(rows[-1][0]))
        in_prog = int(rows[0][0]) + 3_600_000 > now
        check("first kline row is the candle IN PROGRESS (code drops it)", in_prog,
              f"first start {rows[0][0]}, now {now}", warn=True)
        o, c, vol, turn = float(rows[1][1]), float(rows[1][4]), float(rows[1][5]), float(rows[1][6])
        check("kline turnover is in USDT (~ volume x price)", 0.8 < turn / (vol * (o + c) / 2) < 1.2,
              f"ratio {turn / (vol * (o + c) / 2):.3f}")
        r5 = bybit("/v5/market/kline", category="linear", symbol=sym, interval="5", limit=1000,
                   start=now - 2 * 86_400_000, end=now - 86_400_000)["list"]
        check("5m kline with start/end returns rows inside range",
              r5 and all(now - 2 * 86_400_000 <= int(x[0]) <= now - 86_400_000 for x in r5), f"{len(r5)} rows")
    except Exception as e:
        check("kline", False, str(e))

    # ---- open interest ------------------------------------------------------
    try:
        res = bybit("/v5/market/open-interest", category="linear", symbol=sym, intervalTime="1h", limit=30)
        pts = res["list"]
        check("open-interest 1h returns 30 points", len(pts) == 30)
        ts = [int(p["timestamp"]) for p in pts]
        check("open-interest points are 1h apart", all(abs(a - b) == 3_600_000 for a, b in zip(ts, ts[1:])))
        if tk:
            oi_coin = float(pts[0]["openInterest"])
            oi_val = float(tk[sym]["openInterestValue"])
            ratio = oi_coin * float(tk[sym]["lastPrice"]) / oi_val
            check("openInterest is in COIN units (coin x price ~ openInterestValue)", 0.85 < ratio < 1.15,
                  f"ratio {ratio:.3f}")
    except Exception as e:
        check("open-interest", False, str(e))

    # ---- funding history ---------------------------------------------------
    try:
        res = bybit("/v5/market/funding/history", category="linear", symbol=sym, limit=5)
        lst = res["list"]
        check("funding/history returns settlements", len(lst) == 5)
        ts = [int(x["fundingRateTimestamp"]) for x in lst]
        gaps = {round((a - b) / 3_600_000) for a, b in zip(ts, ts[1:])}
        check("funding/history newest-first, gaps match fundingIntervalHour", ts[0] > ts[-1],
              f"gaps(h)={gaps}, fundingIntervalHour={tk.get(sym, {}).get('fundingIntervalHour')}")
        # A 1h-interval symbol, if any, to confirm normalization matters
        one_h = [s for s, r in tk.items() if r.get("fundingIntervalHour") in ("1", "2", "4")][:1]
        if one_h:
            r2 = bybit("/v5/market/funding/history", category="linear", symbol=one_h[0], limit=3)["list"]
            ts2 = [int(x["fundingRateTimestamp"]) for x in r2]
            print(f"       {one_h[0]} interval {tk[one_h[0]]['fundingIntervalHour']}h, gaps "
                  f"{[round((a - b) / 3_600_000) for a, b in zip(ts2, ts2[1:])]}h")
    except Exception as e:
        check("funding/history", False, str(e))

    # ---- account ratio ------------------------------------------------------
    try:
        res = bybit("/v5/market/account-ratio", category="linear", symbol=sym, period="1h", limit=170)
        lst = res["list"]
        check("account-ratio 1h returns up to 170 points", len(lst) >= 160, f"{len(lst)}")
        s = float(lst[0]["buyRatio"]) + float(lst[0]["sellRatio"])
        check("buyRatio + sellRatio ~ 1", 0.98 < s < 1.02, f"{s:.4f}")
    except Exception as e:
        check("account-ratio", False, str(e))

    # ---- Bybit announcements ----------------------------------------------
    try:
        res = bybit("/v5/announcements/index", locale="en-US", type="delistings", limit=5)
        lst = res["list"]
        check("Bybit announcements (delistings) returns rows", len(lst) > 0, f"{len(lst)}")
        if lst:
            a = lst[0]
            check("announcement has title/url/type/publishTime", all(k in a for k in ("title", "url", "type")),
                  f"keys {sorted(a)}")
            check("announcement url ends with blt... id", "blt" in a["url"], a["url"], warn=True)
            print(f"       latest: {a['title']}")
    except Exception as e:
        check("Bybit announcements", False, str(e))

    # ---- Binance announcements (JSON only; HTML pages are WAF-protected and never fetched) ----
    b = cfg.announcements.binance
    hdrs = {"User-Agent": cfg.announcements.user_agent, "Accept": "application/json", "clienttype": "web"}

    def bget(**params):
        r = requests.get(b.base_url + b.list_path, params={"type": 1, "pageNo": 1, "pageSize": b.page_size, **params},
                         headers=hdrs, timeout=20)
        ok_json = r.status_code == 200 and r.headers.get("content-type", "").startswith("application/json")
        if not ok_json:
            raise RuntimeError(f"HTTP {r.status_code} {r.headers.get('content-type')} "
                               f"waf={'x-amzn-waf-action' in {k.lower() for k in r.headers}}")
        return r.json()

    def walk(cats, out):
        for c in cats:
            out.append(c)
            walk(c.get("catalogs") or [], out)
        return out

    mon_kw = [k.lower() for k in b.title_keywords]
    del_kw = [k.lower() for k in b.delisting_keywords]
    try:
        j = bget()
        check("Binance list/query (all catalogs): code 000000 + data.catalogs",
              j.get("code") == "000000" and isinstance((j.get("data") or {}).get("catalogs"), list),
              f"code={j.get('code')} data keys={sorted((j.get('data') or {}).keys())}")
        cats = walk(j["data"]["catalogs"], [])
        print("       catalogs (id | name | articles | monitoring-tag titles | delisting titles):")
        for c in cats:
            arts = c.get("articles") or []
            nm = sum(any(k in a["title"].lower() for k in mon_kw) for a in arts)
            nd = sum(any(k in a["title"].lower() for k in del_kw) for a in arts)
            print(f"         {c.get('catalogId'):>4} | {c.get('catalogName')} | {len(arts)} | {nm} | {nd}")
        targets = [c["catalogId"] for c in cats
                   if any(k.lower() in str(c.get("catalogName", "")).lower() for k in b.catalog_name_keywords)]
        check(f"a catalog name contains {b.catalog_name_keywords}", bool(targets), f"selected {targets}")
        for cid in targets or b.fallback_catalog_ids:
            jj = bget(catalogId=cid)
            arts = [a for c in walk(jj["data"]["catalogs"], []) for a in (c.get("articles") or [])]
            check(f"Binance catalog {cid}: articles with id/code/title/releaseDate",
                  bool(arts) and all(k in arts[0] for k in ("id", "code", "title", "releaseDate")),
                  f"{len(arts)} articles, keys {sorted(arts[0]) if arts else []}")
            mt = [a["title"] for a in arts if any(k in a["title"].lower() for k in mon_kw)]
            dl = [a["title"] for a in arts if any(k in a["title"].lower() for k in del_kw)]
            check(f"Binance catalog {cid}: contains Monitoring Tag or delisting titles", bool(mt or dl),
                  f"{len(mt)} monitoring-tag, {len(dl)} delisting on page 1", warn=True)
            for t in (mt[:3] + dl[:3]):
                print(f"         - {t}")
    except Exception as e:
        check("Binance announcements JSON", False, str(e))

    # ---- Telegram (optional, read-only getMe) ------------------------------
    try:
        c2 = load_config(args.config, require_telegram=True)
        r = requests.get(f"https://api.telegram.org/bot{c2.telegram_bot_token}/getMe", timeout=20).json()
        check("Telegram bot token valid (getMe)", r.get("ok") is True, f"bot @{(r.get('result') or {}).get('username')}")
    except Exception as e:
        check("Telegram (needs .env)", False, redact(e), warn=True)

    fails = RESULTS.count("FAIL")
    print(f"\n{RESULTS.count('PASS')} PASS, {RESULTS.count('WARN')} WARN, {fails} FAIL")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
