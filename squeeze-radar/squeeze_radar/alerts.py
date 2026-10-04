"""Alert formatting, anti-spam decisions and alert records (used for outcome tracking)."""
from __future__ import annotations

from dataclasses import dataclass

from .db import DB, dumps
from .stages import STAGE_NUM
from .telegram import esc
from .timeutil import MINUTE_MS, iso


@dataclass
class SpamDecision:
    send: bool
    reason: str


def anti_spam(prev: dict | None, score: float, stage: str | None, now_ms: int, *,
              delta: float, cooldown_minutes: float, stage_bypasses_cooldown: bool) -> SpamDecision:
    """Re-alert a symbol only if its score moved by >= delta or its stage changed,
    and only after the cooldown. Stage changes may bypass the cooldown."""
    if prev is None:
        return SpamDecision(True, "first alert for symbol")
    stage_changed = (stage or None) != (prev.get("last_stage") or None)
    if stage_changed and stage_bypasses_cooldown:
        return SpamDecision(True, f"stage changed {prev.get('last_stage')} -> {stage}")
    last_t = prev.get("last_alert_ms") or 0
    if now_ms - last_t < cooldown_minutes * MINUTE_MS:
        return SpamDecision(False, "cooldown active")
    if stage_changed:
        return SpamDecision(True, f"stage changed {prev.get('last_stage')} -> {stage}")
    last_score = prev.get("last_score")
    if last_score is None or abs(score - last_score) >= delta:
        return SpamDecision(True, f"score moved {last_score} -> {score}")
    return SpamDecision(False, f"score change {score - last_score:+.1f} < {delta}")


def get_alert_state(db: DB, symbol: str) -> dict | None:
    r = db.one("SELECT * FROM alert_state WHERE symbol=?", (symbol,))
    return dict(r) if r else None


def set_alert_state(db: DB, symbol: str, score: float | None, stage: str | None, t: int) -> None:
    db.upsert("alert_state", {"symbol": symbol, "last_score": score, "last_stage": stage,
                              "last_alert_ms": t}, ["symbol"])


def record_alert(db: DB, *, kind: str, symbol: str | None, t: int, score=None, stage=None,
                 tagged=None, floor=None, price=None, metrics=None, components=None,
                 message: str = "", dedupe_key: str, dry_run: bool) -> int | None:
    """Insert an alert row. Returns None if this dedupe_key was already recorded."""
    cur = db.execute(
        "INSERT OR IGNORE INTO alerts (kind, symbol, created_ms, created_iso, score, stage, tagged, floor, "
        "price_at_alert, metrics_json, components_json, message, dedupe_key, dry_run) "
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (kind, symbol, t, iso(t), score, stage, None if tagged is None else int(tagged), floor, price,
         dumps(metrics) if metrics is not None else None,
         dumps(components) if components is not None else None, message, dedupe_key, int(dry_run)))
    return cur.lastrowid if cur.rowcount else None


# ----------------------------------------------------------------- format --

def name(symbol: str) -> str:
    return symbol[:-4] if symbol.endswith("USDT") else symbol


def fmt_price(v) -> str:
    if v is None:
        return "n/a"
    return f"{v:.6g}"


def _p(v, digits=0) -> str:
    if v is None:
        return "n/a"
    v = round(v, digits) + 0.0  # avoid "-0%"
    return f"{v:+.{digits}f}%"


def _fr(v) -> str:
    return "n/a" if v is None else f"{v * 100:+.4f}%"


def summary_line(symbol: str, score: float, m: dict, stage: str | None) -> str:
    """MOVR | Score 84 | Vol 4.2x, OI +18%, price +1%, funding(8h) -0.03%, TAGGED Stage 2 | floor 0.79"""
    vr = m.get("volume_ratio")
    fn = m.get("funding_now_8h")
    parts = [
        f"Vol {vr:.1f}x" if vr is not None else "Vol n/a",
        f"OI {_p(m.get('oi_chg_24h_pct'))}",
        f"price {_p(m.get('chg_24h_pct'))}",
        f"funding(8h) {'n/a' if fn is None else f'{fn * 100:+.3f}%'}",
    ]
    if stage:
        parts.append(f"TAGGED {STAGE_NUM.get(stage, stage)}")
    return (f"<b>{esc(name(symbol))}</b> | Score {score:.0f} | {esc(', '.join(parts))} | "
            f"floor {esc(fmt_price(m.get('floor')))}")


def detail_block(symbol: str, m: dict, components: dict | None = None) -> str:
    lines = [
        f"Price {fmt_price(m.get('last_price'))} | 4h {_p(m.get('chg_4h_pct'), 1)} | 24h {_p(m.get('chg_24h_pct'), 1)} | vs BTC {_p(m.get('perf_vs_btc_pct'), 1)}",
        f"Coin-OI 4h {_p(m.get('oi_chg_4h_pct'), 1)} | 24h {_p(m.get('oi_chg_24h_pct'), 1)} | OI ${m.get('oi_usd') or 0:,.0f}",
        f"Funding(8h) now {_fr(m.get('funding_now_8h'))} | avg last settlements {_fr(m.get('funding_avg_n_8h'))}"
        f" | own avg {_fr(m.get('funding_own_avg_8h'))} | interval {m.get('funding_interval_h') or 'n/a'}h",
        "L/S ratio {} vs 7d avg {} | range 24h {}".format(
            "n/a" if m.get("ls_ratio") is None else f"{m['ls_ratio']:.3f}",
            "n/a" if m.get("ls_avg") is None else f"{m['ls_avg']:.3f}",
            "n/a" if m.get("range_tightness_pct") is None else f"{m['range_tightness_pct']:.1f}%"),
        f"Turnover 24h ${m.get('turnover_24h') or 0:,.0f} | Vol ratio {'n/a' if m.get('volume_ratio') is None else format(m['volume_ratio'], '.2f') + 'x'}",
        f"Floor (invalidation) {fmt_price(m.get('floor'))}",
    ]
    out = "\n".join(esc(x) for x in lines)
    if components:
        comp = ", ".join(f"{k} {v['points']:+g}" for k, v in components.items() if v["points"])
        out += "\n<i>Score parts: " + esc(comp or "none") + "</i>"
    return out


def bybit_link(symbol: str) -> str:
    return f'<a href="https://www.bybit.com/trade/usdt/{esc(symbol)}">{esc(symbol)}</a>'
