"""Map announcement tokens (e.g. "PEPE") to Bybit USDT perpetual symbols.

Rules, in order:
1. Manual override in config.yaml wins.
2. Exact match TOKEN + "USDT".
3. Multiplier-prefix match: 1000PEPEUSDT, 10000..., 1000000... = PEPE.
   One candidate -> confident. Several -> ambiguous (never guess).
4. Exchange-side prefixes on the token itself (Binance "1MBABYDOGE",
   "1000SATS") are stripped and steps 2-3 repeated.
Anything else is "unmatched" and reported with the raw text.
"""
from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class MatchResult:
    token: str
    symbol: str | None
    status: str            # "matched", "ambiguous", "unmatched"
    method: str = ""
    candidates: tuple[str, ...] = ()


def underlying_of(symbol: str, prefixes: list[str], quote: str = "USDT") -> str:
    """1000PEPEUSDT -> PEPE. BTCUSDT -> BTC."""
    base = symbol[: -len(quote)] if symbol.endswith(quote) else symbol
    for p in sorted(prefixes, key=len, reverse=True):
        if base.startswith(p) and len(base) > len(p) and not base[len(p)].isdigit():
            return base[len(p):]
    return base


class SymbolMapper:
    def __init__(self, symbols: list[str], multiplier_prefixes: list[str],
                 overrides: dict[str, str] | None = None, token_prefixes: list[str] | None = None,
                 quote: str = "USDT"):
        self.quote = quote
        self.symbols = set(symbols)
        self.prefixes = sorted(multiplier_prefixes, key=len, reverse=True)
        self.overrides = {k.upper(): v.upper() for k, v in (overrides or {}).items()}
        self.token_prefixes = sorted(token_prefixes or [], key=len, reverse=True)
        self.by_underlying: dict[str, list[str]] = {}
        for s in symbols:
            if not s.endswith(quote):
                continue
            u = underlying_of(s, self.prefixes, quote)
            self.by_underlying.setdefault(u, []).append(s)

    def _try(self, tok: str) -> MatchResult | None:
        exact = tok + self.quote
        if exact in self.symbols:
            return MatchResult(tok, exact, "matched", "exact")
        cands = sorted(c for c in self.by_underlying.get(tok, []) if c != exact)
        if len(cands) == 1:
            return MatchResult(tok, cands[0], "matched", "multiplier-prefix")
        if len(cands) > 1:
            return MatchResult(tok, None, "ambiguous", "multiplier-prefix", tuple(cands))
        return None

    def match(self, token: str) -> MatchResult:
        tok = re.sub(r"[^A-Z0-9]", "", token.upper())
        if not tok:
            return MatchResult(token, None, "unmatched")
        if tok in self.overrides:
            sym = self.overrides[tok]
            if sym in self.symbols:
                return MatchResult(tok, sym, "matched", "override")
            return MatchResult(tok, None, "unmatched", f"override {sym} not in Bybit universe")
        r = self._try(tok)
        if r:
            return r
        for p in self.token_prefixes:
            if tok.startswith(p) and len(tok) > len(p):
                stripped = tok[len(p):]
                if stripped[0].isdigit():
                    continue
                r = self._try(stripped)
                if r:
                    return MatchResult(tok, r.symbol, r.status, f"token-prefix {p} + {r.method}", r.candidates)
        return MatchResult(tok, None, "unmatched")
