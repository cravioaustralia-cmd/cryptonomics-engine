"""Parsers tested against the example responses in the official Bybit V5 docs
(github.com/bybit-exchange/docs) and the Binance bapi shape."""
import pytest

from squeeze_radar import bybit as B
from squeeze_radar.announcements import (bybit_ann_id, classify_bybit, extract_tokens, extract_usdt_symbols,
                                         parse_binance_list, parse_bybit_announcements, parse_delisting_time,
                                         split_monitoring_title)
from squeeze_radar.http import FormatError

STOP = ["BINANCE", "BYBIT", "USDT", "UTC", "AND", "THE", "TAG", "ST", "NEW"]

KLINE_DOC = {"retCode": 0, "retMsg": "OK", "result": {"symbol": "BTCUSD", "category": "inverse", "list": [
    ["1670608800000", "17071", "17073", "17027", "17055.5", "268611", "15.74462667"],
    ["1670605200000", "17071.5", "17071.5", "17061", "17071", "4177", "0.24469757"],
    ["1670601600000", "17086.5", "17088", "16978", "17071.5", "6356", "0.37288112"]]},
    "retExtInfo": {}, "time": 1672025956592}


def test_kline_doc_example_sorted_ascending():
    cs = B.parse_klines(B.parse_envelope(KLINE_DOC, "/v5/market/kline"))
    assert [c.start_ms for c in cs] == [1670601600000, 1670605200000, 1670608800000]
    assert cs[-1].close == 17055.5 and cs[-1].turnover == pytest.approx(15.74462667)


def test_envelope_error_and_format_errors():
    with pytest.raises(B.ApiError) as e:
        B.parse_envelope({"retCode": 10001, "retMsg": "params error", "result": {}}, "/x")
    assert e.value.ret_code == 10001
    with pytest.raises(FormatError):
        B.parse_envelope({"foo": 1}, "/x")
    with pytest.raises(FormatError):
        B.parse_klines({"list": [["1", "2"]]})


def test_open_interest_doc_example():
    res = {"symbol": "BTCUSD", "category": "inverse", "list": [
        {"openInterest": "63910691.00000000", "singleOpenInterest": "31955346", "timestamp": "1780963200000"},
        {"openInterest": "63942311.00000000", "singleOpenInterest": "31971156", "timestamp": "1780617600000"}],
        "nextPageCursor": "x"}
    pts = B.parse_open_interest(res)
    assert pts[0] == (1780617600000, 63942311.0) and pts[-1][0] == 1780963200000


def test_funding_and_account_ratio_doc_examples():
    f = B.parse_funding_history({"category": "linear", "list": [
        {"symbol": "ETHPERP", "fundingRate": "0.0001", "fundingRateTimestamp": "1672041600000"}]})
    assert f == [(1672041600000, 0.0001)]
    ls = B.parse_account_ratio({"list": [
        {"symbol": "BTCUSDT", "buyRatio": "0.49", "sellRatio": "0.51", "timestamp": "1696262400000"},
        {"symbol": "BTCUSDT", "buyRatio": "0.4927", "sellRatio": "0.5073", "timestamp": "1696258800000"}]})
    assert ls[0][0] == 1696258800000 and ls[-1][1:] == (0.49, 0.51)


def test_instruments_parse_fields_and_units():
    res = {"category": "linear", "nextPageCursor": "abc", "list": [{
        "symbol": "1000PEPEUSDT", "contractType": "LinearPerpetual", "status": "Trading", "baseCoin": "1000PEPE",
        "quoteCoin": "USDT", "launchTime": "1683244800000", "deliveryTime": "0", "fundingInterval": 240,
        "symbolType": "", "tags": ["ST"]}]}
    items, cursor = B.parse_instruments(res)
    assert cursor == "abc"
    i = items[0]
    assert i["funding_interval_min"] == 240 and i["delivery_time_ms"] is None and i["tags"] == ["ST"]
    res["list"][0]["deliveryTime"] = "1790000000000"
    assert B.parse_instruments(res)[0][0]["delivery_time_ms"] == 1790000000000


def test_tickers_parse():
    res = {"category": "linear", "list": [{"symbol": "MOVRUSDT", "lastPrice": "0.82", "turnover24h": "12345.6",
                                           "volume24h": "100", "fundingRate": "-0.0001", "fundingIntervalHour": "4",
                                           "openInterest": "1000", "openInterestValue": "820",
                                           "nextFundingTime": "1700000000000", "price24hPcnt": "0.01"}]}
    t = B.parse_tickers(res)["MOVRUSDT"]
    assert t["funding_interval_hour"] == 4 and t["funding_rate"] == -0.0001 and t["turnover_24h"] == 12345.6


# ----------------------------------------------------------- announcements --
def test_binance_list_parse_and_format_change():
    payload = {"code": "000000", "success": True, "data": {"total": 2, "articles": [
        {"id": 123, "code": "abc123", "title": "Binance Will Extend the Monitoring Tag to Include ALPACA, PDA and WING",
         "releaseDate": 1759000000000}]}}
    a = parse_binance_list(payload, "https://www.binance.com")[0]
    assert a.ann_id == "123" and a.url.endswith("/detail/abc123") and a.published_ms == 1759000000000
    with pytest.raises(FormatError):
        parse_binance_list({"code": "000000", "success": True, "data": {"catalogs": []}}, "x")
    with pytest.raises(FormatError):
        parse_binance_list({"code": "100001", "success": False, "message": "blocked"}, "x")


def test_monitoring_title_add_remove_mixed():
    rm = ["remove", "removal"]
    add, r = split_monitoring_title("Binance Will Extend the Monitoring Tag to Include ALPACA, PDA, VIDT and WING", STOP, rm)
    assert add == ["ALPACA", "PDA", "VIDT", "WING"] and r == []
    add, r = split_monitoring_title("Binance Will Remove the Monitoring Tag from MOVR", STOP, rm)
    assert add == [] and r == ["MOVR"]
    add, r = split_monitoring_title("Notice of Removal of Monitoring Tag on Ankr (ANKR) and Zcash (ZEC)", STOP, rm)
    assert add == [] and r == ["ANKR", "ZEC"]
    add, r = split_monitoring_title(
        "Binance Will Add the Monitoring Tag on 1000SATS, FTT and Remove the Monitoring Tag from BAL", STOP, rm)
    assert add == ["1000SATS", "FTT"] and r == ["BAL"]


def test_extract_tokens_filters_noise():
    toks = extract_tokens("Binance Will Delist ALPACA (ALPACA), USDT pairs on 2025-04-15 at 03:00 UTC", STOP)
    assert toks == ["ALPACA"]
    assert extract_usdt_symbols("Delisting of 1000XUSDT and ABCUSDT Perpetual Contracts") == ["1000XUSDT", "ABCUSDT"]


def test_bybit_announcement_id_and_classification():
    url = "https://announcements.bybit.com/en-US/article/delisting-of-abcusdt-perpetual-contract-blt1234abcd/"
    assert bybit_ann_id(url) == "blt1234abcd"
    assert bybit_ann_id("https://x.com/a").startswith("url-")
    rows = [{"title": "Delisting of ABCUSDT Perpetual Contract", "description": "on Oct 10, 2025, 8AM UTC",
             "type": {"title": "Delistings", "key": "delistings"}, "tags": ["Derivatives"], "url": url,
             "dateTimestamp": 1759000000000, "publishTime": 1759000001000}]
    a = parse_bybit_announcements(rows)[0]
    assert a.published_ms == 1759000001000 and classify_bybit(a, ["risk warning"]) == "delisting"


@pytest.mark.parametrize("text,iso", [
    ("will be delisted on Oct 10, 2025, 8AM UTC", "2025-10-10T08:00:00Z"),
    ("at 2025-10-10 08:30 (UTC)", "2025-10-10T08:30:00Z"),
    ("delisting on 10 October 2025 at 12:00 UTC", "2025-10-10T12:00:00Z"),
    ("Sep 3, 2025, 12PM UTC", "2025-09-03T12:00:00Z"),
])
def test_parse_delisting_time(text, iso):
    from squeeze_radar.timeutil import iso as to_iso
    assert to_iso(parse_delisting_time(text)) == iso


def test_parse_delisting_time_none():
    assert parse_delisting_time("no date here") is None
