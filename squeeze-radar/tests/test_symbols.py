from squeeze_radar.symbols import SymbolMapper, underlying_of

PREFIXES = ["1000000", "100000", "10000", "1000", "100"]
UNIVERSE = ["BTCUSDT", "1000PEPEUSDT", "10000SATSUSDT", "1000000MOGUSDT", "MOVRUSDT", "1INCHUSDT",
            "SHIB1000USDT", "1000BONKUSDT", "BONKUSDT", "RENDERUSDT", "1000XUSDT", "10000XUSDT",
            "BABYDOGEUSDT_X", "1000000BABYDOGEUSDT"]


def mapper(overrides=None):
    return SymbolMapper(UNIVERSE, PREFIXES, overrides or {}, token_prefixes=["1000000", "1000", "1M"])


def test_underlying_strips_multiplier_prefix():
    assert underlying_of("1000PEPEUSDT", PREFIXES) == "PEPE"
    assert underlying_of("10000SATSUSDT", PREFIXES) == "SATS"
    assert underlying_of("1000000MOGUSDT", PREFIXES) == "MOG"
    assert underlying_of("1INCHUSDT", PREFIXES) == "1INCH"   # "1" is not a multiplier
    assert underlying_of("BTCUSDT", PREFIXES) == "BTC"


def test_exact_match():
    r = mapper().match("MOVR")
    assert (r.status, r.symbol, r.method) == ("matched", "MOVRUSDT", "exact")


def test_multiplier_prefix_matches():
    assert mapper().match("PEPE").symbol == "1000PEPEUSDT"
    assert mapper().match("SATS").symbol == "10000SATSUSDT"
    assert mapper().match("mog").symbol == "1000000MOGUSDT"
    assert mapper().match("1INCH").symbol == "1INCHUSDT"


def test_exact_beats_prefixed_duplicate():
    # Both BONKUSDT and 1000BONKUSDT exist: the exact symbol is the confident match.
    r = mapper().match("BONK")
    assert r.symbol == "BONKUSDT" and r.method == "exact"


def test_ambiguous_is_not_guessed():
    r = mapper().match("X")  # 1000XUSDT and 10000XUSDT
    assert r.status == "ambiguous" and r.symbol is None
    assert set(r.candidates) == {"1000XUSDT", "10000XUSDT"}


def test_unmatched():
    r = mapper().match("NOTONBYBIT")
    assert r.status == "unmatched" and r.symbol is None


def test_override_for_renamed_token():
    m = mapper({"RNDR": "RENDERUSDT"})
    r = m.match("RNDR")
    assert (r.symbol, r.method) == ("RENDERUSDT", "override")
    # override pointing to a symbol that is not listed is reported, not guessed
    r2 = mapper({"FOO": "FOOUSDT"}).match("FOO")
    assert r2.status == "unmatched"


def test_binance_side_prefix_token():
    # Binance writes 1MBABYDOGE (1 million BABYDOGE); Bybit trades 1000000BABYDOGEUSDT.
    r = mapper().match("1MBABYDOGE")
    assert r.symbol == "1000000BABYDOGEUSDT"
    # Binance 1000SATS -> Bybit 10000SATSUSDT
    assert mapper().match("1000SATS").symbol == "10000SATSUSDT"
