"""Score a symbol 0-100. Every component is returned separately with a reason."""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Component:
    name: str
    points: float
    detail: str


@dataclass
class ScoreResult:
    score: float
    raw_total: float
    components: list[Component] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {c.name: {"points": c.points, "detail": c.detail} for c in self.components}


def _f(v, fmt="{:+.2f}"):
    return "n/a" if v is None else fmt.format(v)


def score_symbol(m: dict, sc, *, tagged: bool, too_new: bool, min_turnover: float) -> ScoreResult:
    """m: metrics dict from metrics.compute_symbol_metrics. sc: config.scoring."""
    comps: list[Component] = []

    # Volume ratio
    vr = m.get("volume_ratio")
    p = 0.0
    if vr is not None and vr >= sc.volume_ratio.full_at:
        p = sc.volume_ratio.full_points
    elif vr is not None and vr >= sc.volume_ratio.partial_at:
        p = sc.volume_ratio.partial_points
    comps.append(Component("volume_ratio", p, f"vol ratio {_f(vr, '{:.2f}x')}"))

    # Coin-OI up while price flat (absorption)
    oi = m.get("oi_chg_24h_pct")
    ch = m.get("chg_24h_pct")
    o = sc.oi_up_price_flat
    p = 0.0
    if oi is not None and ch is not None and abs(ch) < o.max_abs_price_change_24h_pct:
        if oi >= o.min_oi_change_24h_pct:
            p = o.points
        elif oi >= o.partial_min_oi_change_24h_pct:
            p = o.partial_points
    comps.append(Component("oi_up_price_flat", p, f"coin OI 24h {_f(oi)}%, price 24h {_f(ch)}%"))

    # Funding (8h-normalized)
    fn = m.get("funding_now_8h")
    favg = m.get("funding_own_avg_8h")
    p = 0.0
    if fn is not None and fn < 0:
        p = sc.funding.negative_points
    elif fn is not None and favg is not None and fn < favg:
        p = sc.funding.below_own_avg_points
    comps.append(Component("funding", p, f"funding(8h) {_f(None if fn is None else fn * 100, '{:+.4f}')}% "
                                         f"vs own avg {_f(None if favg is None else favg * 100, '{:+.4f}')}%"))

    # Long/short ratio vs its own average
    ls, lsa = m.get("ls_ratio"), m.get("ls_avg")
    p = 0.0
    if ls is not None and lsa is not None and ls <= lsa * sc.long_short.below_avg_factor:
        p = sc.long_short.points
    comps.append(Component("long_short", p, f"L/S {_f(ls, '{:.3f}')} vs 7d avg {_f(lsa, '{:.3f}')}"))

    # Holding the floor or outperforming BTC
    price, floor = m.get("last_price"), m.get("floor")
    vs_btc = m.get("perf_vs_btc_pct")
    f = sc.floor_or_outperform
    holding = (price is not None and floor is not None and floor > 0 and price >= floor
               and (price / floor - 1) * 100 <= f.max_distance_above_floor_pct)
    outperf = vs_btc is not None and vs_btc >= f.min_outperformance_vs_btc_pct
    p = f.points if (holding or outperf) else 0.0
    dist = (price / floor - 1) * 100 if (price and floor) else None
    comps.append(Component("floor_or_outperform", p,
                           f"{_f(dist)}% above floor, vs BTC {_f(vs_btc)}%"))

    # Tagged bonus
    comps.append(Component("tagged_bonus", sc.tagged_bonus if tagged else 0.0,
                           "on tagged watchlist" if tagged else "not tagged"))

    # Penalties
    pen = sc.penalties
    late = ch is not None and ch >= pen.late_price_change_24h_pct
    comps.append(Component("penalty_late", -pen.late_points if late else 0.0,
                           f"price 24h {_f(ch)}% (late if >= {pen.late_price_change_24h_pct}%)"))
    t24 = m.get("turnover_24h")
    thin = t24 is None or t24 < max(pen.thin_turnover_24h_usd, min_turnover)
    comps.append(Component("penalty_thin", -pen.thin_points if thin else 0.0,
                           f"24h turnover ${_f(t24, '{:,.0f}')}"))
    comps.append(Component("penalty_too_new", -pen.too_new_points if too_new else 0.0,
                           "listed < min history" if too_new else "history ok"))

    raw = sum(c.points for c in comps)
    return ScoreResult(score=round(max(0.0, min(100.0, raw)), 1), raw_total=raw, components=comps)
