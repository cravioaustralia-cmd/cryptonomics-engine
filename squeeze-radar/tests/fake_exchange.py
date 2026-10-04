"""A local fake of the Bybit V5 public API and the Binance announcement JSON.

Responses follow the shapes in the official docs. Used by the end-to-end test,
and runnable on its own to demo a full dry-run without internet:

    python tests/fake_exchange.py 8765
"""
from __future__ import annotations

import json
import math
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

HOUR = 3_600_000
DAY = 86_400_000


def now_ms():
    return int(time.time() * 1000)


class World:
    """Synthetic market. MOVR shows the full squeeze-loading pattern."""

    def __init__(self):
        self.t0 = now_ms()
        self.binance_mode = "ok"      # ok | blocked | waf | changed
        self.extra_bybit = []         # extra announcement rows to serve
        self.delist_catalog_id = 161  # change to test catalog discovery by name
        self.requests = []
        self.instruments = [
            dict(symbol="BTCUSDT", base="BTC", launch=self.t0 - 2000 * DAY, price=60000.0),
            dict(symbol="MOVRUSDT", base="MOVR", launch=self.t0 - 900 * DAY, price=0.82),
            dict(symbol="1000PEPEUSDT", base="1000PEPE", launch=self.t0 - 600 * DAY, price=0.0095),
            dict(symbol="BADUSDT", base="BAD", launch=self.t0 - 300 * DAY, price=1.0),
            dict(symbol="NEWUSDT", base="NEW", launch=self.t0 - 1 * DAY, price=2.0),
            dict(symbol="THINUSDT", base="THIN", launch=self.t0 - 300 * DAY, price=3.0),
            dict(symbol="AAPLUSDT", base="AAPL", launch=self.t0 - 300 * DAY, price=200.0, stype="stock"),
            dict(symbol="ETHPERP", base="ETH", launch=self.t0 - 900 * DAY, price=3000.0, quote="USDC"),
        ]
        self.by_sym = {i["symbol"]: i for i in self.instruments}

    # -- hourly candles: 7 quiet days then a high-volume flat day for MOVR
    def hourly(self, sym, start, end):
        base = self.by_sym[sym]["price"]
        out = []
        first = (start // HOUR) * HOUR
        for t in range(first, end + 1, HOUR):
            age_h = (self.t0 - t) / HOUR
            wiggle = 1 + 0.004 * math.sin(t / HOUR)
            o = c = base * wiggle
            turnover = 400_000.0
            if sym == "MOVRUSDT" and age_h <= 24:
                turnover = 1_700_000.0       # ~4x volume, price flat (absorption)
            if sym == "THINUSDT":
                turnover = 10_000.0
            out.append([str(t), f"{o:.6g}", f"{o * 1.01:.6g}", f"{o * 0.99:.6g}", f"{c:.6g}",
                        f"{turnover / c:.4f}", f"{turnover:.4f}"])
        return out

    def five_min(self, sym, start, end):
        base = self.by_sym[sym]["price"]
        out = []
        first = (start // 300_000) * 300_000
        for t in range(first, end + 1, 300_000):
            p = base * (1 + 0.002 * math.sin(t / 300_000))
            out.append([str(t), f"{p:.6g}", f"{p * 1.002:.6g}", f"{p * 0.998:.6g}", f"{p:.6g}", "1", f"{p:.4f}"])
        return out


WORLD = World()


def ok(result):
    return {"retCode": 0, "retMsg": "OK", "result": result, "retExtInfo": {}, "time": now_ms()}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body, ctype="application/json"):
        data = body if isinstance(body, bytes) else json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):  # noqa: C901
        u = urlparse(self.path)
        q = {k: v[0] for k, v in parse_qs(u.query).items()}
        WORLD.requests.append((u.path, q))
        w = WORLD
        sym = q.get("symbol")
        if u.path == "/v5/market/instruments-info":
            items = []
            for i in w.instruments:
                items.append({"symbol": i["symbol"], "contractType": "LinearPerpetual", "status": "Trading",
                              "baseCoin": i["base"], "quoteCoin": i.get("quote", "USDT"),
                              "launchTime": str(i["launch"]), "deliveryTime": "0", "fundingInterval": 480,
                              "symbolType": i.get("stype", ""), "settleCoin": "USDT",
                              "tags": ["ST"] if i["symbol"] == "THINUSDT" else []})
            if q.get("cursor") == "p2":
                return self._send(200, ok({"category": "linear", "list": items[4:], "nextPageCursor": ""}))
            return self._send(200, ok({"category": "linear", "list": items[:4], "nextPageCursor": "p2"}))
        if u.path == "/v5/market/tickers":
            lst = []
            for i in w.instruments:
                t24 = 1_700_000 * 24 if i["symbol"] == "MOVRUSDT" else (240_000 if i["symbol"] == "THINUSDT" else 9_600_000)
                lst.append({"symbol": i["symbol"], "lastPrice": str(i["price"]), "turnover24h": str(t24),
                            "volume24h": "1", "fundingRate": "-0.00025" if i["symbol"] == "MOVRUSDT" else "0.0001",
                            "fundingIntervalHour": "4" if i["symbol"] == "MOVRUSDT" else "8",
                            "nextFundingTime": str(now_ms() + HOUR), "openInterest": "1000",
                            "openInterestValue": "1000", "price24hPcnt": "0.001"})
            return self._send(200, ok({"category": "linear", "list": lst}))
        if sym == "BADUSDT":
            return self._send(200, {"retCode": 10001, "retMsg": "params error: symbol invalid", "result": {}})
        if u.path == "/v5/market/kline":
            n = now_ms()
            interval = q["interval"]
            limit = int(q.get("limit", 200))
            if interval == "60":
                end = int(q.get("end", n))
                rows = w.hourly(sym, end - (limit - 1) * HOUR, end)
            else:
                end = min(int(q.get("end", n)), n)
                start = int(q.get("start", end - limit * 300_000))
                rows = w.five_min(sym, max(start, end - (limit - 1) * 300_000), end)
            rows = rows[-limit:][::-1]  # newest first, like Bybit
            return self._send(200, ok({"symbol": sym, "category": "linear", "list": rows}))
        if u.path == "/v5/market/open-interest":
            n = (now_ms() // HOUR) * HOUR
            lim = int(q.get("limit", 50))
            lst = []
            for k in range(lim):
                t = n - k * HOUR
                v = 1_000_000.0
                if sym == "MOVRUSDT":
                    v = 1_000_000.0 * (1 + 0.20 * max(0, 24 - k) / 24)  # +20% coin OI over 24h
                lst.append({"openInterest": f"{v:.2f}", "singleOpenInterest": f"{v / 2:.2f}", "timestamp": str(t)})
            return self._send(200, ok({"symbol": sym, "category": "linear", "list": lst, "nextPageCursor": ""}))
        if u.path == "/v5/market/funding/history":
            step = 4 if sym == "MOVRUSDT" else 8
            n = (now_ms() // (step * HOUR)) * step * HOUR
            rate = "-0.0002" if sym == "MOVRUSDT" else "0.0001"
            lst = [{"symbol": sym, "fundingRate": rate, "fundingRateTimestamp": str(n - k * step * HOUR)}
                   for k in range(min(int(q.get("limit", 200)), 60))]
            return self._send(200, ok({"category": "linear", "list": lst}))
        if u.path == "/v5/market/account-ratio":
            n = (now_ms() // HOUR) * HOUR
            lst = []
            for k in range(int(q.get("limit", 50))):
                buy = 0.42 if (sym == "MOVRUSDT" and k < 2) else 0.5
                lst.append({"symbol": sym, "buyRatio": str(buy), "sellRatio": str(round(1 - buy, 4)), "timestamp": str(n - k * HOUR)})
            return self._send(200, ok({"list": lst, "nextPageCursor": ""}))
        if u.path == "/v5/announcements/index":
            lst = [{"title": "Delisting of XYZUSDT Perpetual Contract", "description": "Oct 30, 2026, 8AM UTC",
                    "type": {"title": "Delistings", "key": "delistings"}, "tags": ["Derivatives"],
                    "url": "https://announcements.bybit.com/en-US/article/delisting-of-xyzusdt-perpetual-contract-blt0001/",
                    "dateTimestamp": now_ms() - HOUR, "publishTime": now_ms() - HOUR}] + w.extra_bybit
            return self._send(200, ok({"total": 1, "list": lst}))
        if u.path == "/bapi/composite/v1/public/cms/article/list/query":
            if w.binance_mode == "blocked":
                return self._send(403, b"<html>captcha challenge</html>", "text/html")
            if w.binance_mode == "waf":
                return self._send(202, b"<html><script>awsWafCookieDomainList</script></html>", "text/html")
            if w.binance_mode == "changed":
                # old/different shape: articles at top level, no catalogs
                return self._send(200, {"code": "000000", "success": True, "data": {"articles": []}})
            delist_id = w.delist_catalog_id
            delist = {"catalogId": delist_id, "parentCatalogId": None, "catalogName": "Delisting", "articles": [
                {"id": 9001, "code": "monitor9001", "type": 1,
                 "title": "Binance Will Extend the Monitoring Tag to Include MOVR, PEPE and ZZZQ",
                 "releaseDate": w.t0 - 2 * HOUR},
                {"id": 9002, "code": "delist9002", "type": 1,
                 "title": "Binance Futures Will Delist USDⓈ-M MOVRUSDT Perpetual Contract",
                 "releaseDate": w.t0 - 3 * HOUR},
                {"id": 9000, "code": "old9000", "type": 1,
                 "title": "Binance Will Extend the Monitoring Tag to Include OLD", "releaseDate": w.t0 - 90 * DAY}]}
            listing = {"catalogId": 48, "parentCatalogId": None, "catalogName": "New Cryptocurrency Listing",
                       "articles": [{"id": 8000, "code": "list8000", "type": 1,
                                     "title": "Binance Will List Something (SMTH)", "releaseDate": w.t0}]}
            news = {"catalogId": 49, "parentCatalogId": None, "catalogName": "Latest Binance News", "articles": []}
            cid = q.get("catalogId")
            if cid is None:
                cats = [listing, news, delist]
            elif cid == str(delist_id):
                cats = [delist]
            elif cid == "48":
                cats = [listing]
            else:
                cats = []
            return self._send(200, {"code": "000000", "message": None, "messageDetail": None, "success": True,
                                    "data": {"catalogs": cats}})
        self._send(404, {"error": "not found"})


def serve(port: int = 0) -> tuple[ThreadingHTTPServer, int]:
    srv = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    th = threading.Thread(target=srv.serve_forever, daemon=True)
    th.start()
    return srv, srv.server_address[1]


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    srv, p = serve(port)
    print(f"fake exchange on http://127.0.0.1:{p}")
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        srv.shutdown()
