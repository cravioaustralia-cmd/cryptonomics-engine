#!/usr/bin/env python3
"""Outcome report: does the strategy work?

  python report.py                     print to the terminal
  python report.py --csv out/          also write CSV files into out/
  python report.py --kind score        only alerts of one kind (score, stage, new_tag, hourly_top)

"Hit" = price reached +target% (config outcomes.target_gain_pct) BEFORE touching the floor.
Ambiguous cases (both inside one 5m candle) are counted separately, never as hits.
"""
from __future__ import annotations

import argparse
import csv
import sqlite3
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from squeeze_radar.config import ConfigError, load_config  # noqa: E402


def q(conn, sql, params=()):
    return [dict(r) for r in conn.execute(sql, params).fetchall()]


def fmt(v, d=1, suffix=""):
    return "-" if v is None else f"{v:.{d}f}{suffix}"


def table(title: str, rows: list[dict], cols: list[str]) -> str:
    out = [f"\n== {title} =="]
    if not rows:
        return "\n".join(out + ["(no data yet)"])
    widths = {c: max(len(c), *(len(str(r.get(c, ""))) for r in rows)) for c in cols}
    out.append("  ".join(c.ljust(widths[c]) for c in cols))
    out.append("  ".join("-" * widths[c] for c in cols))
    for r in rows:
        out.append("  ".join(str(r.get(c, "")).ljust(widths[c]) for c in cols))
    return "\n".join(out)


def group_stats(rows: list[dict], key, windows: list[int]) -> list[dict]:
    groups: dict = {}
    for r in rows:
        groups.setdefault(key(r), []).append(r)
    out = []
    for g in sorted(groups, key=lambda x: str(x)):
        rs = groups[g]
        decided = [r for r in rs if r["first_hit"] in ("gain", "floor")]
        hits = sum(r["first_hit"] == "gain" for r in rs)
        row = {"group": g, "alerts": len(rs), "decided": len(decided),
               "hit_rate": fmt(100 * hits / len(decided), 0, "%") if decided else "-",
               "floor_first": sum(r["first_hit"] == "floor" for r in rs),
               "ambiguous": sum(r["first_hit"] == "ambiguous" for r in rs),
               "delisted": sum(r["status"] == "delisted" for r in rs)}
        for w in windows:
            vals = [r[f"chg_{w}h"] for r in rs if r.get(f"chg_{w}h") is not None]
            mg = [r[f"mg_{w}h"] for r in rs if r.get(f"mg_{w}h") is not None]
            row[f"avg_{w}h"] = fmt(sum(vals) / len(vals), 1, "%") if vals else "-"
            row[f"maxgain_{w}h"] = fmt(sum(mg) / len(mg), 1, "%") if mg else "-"
        out.append(row)
    return out


def score_bucket(s):
    if s is None:
        return "n/a"
    lo = int(s // 10 * 10)
    return f"{lo:02d}-{min(lo + 9, 100)}"


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description="squeeze-radar outcome report")
    p.add_argument("--config", default=str(HERE / "config.yaml"))
    p.add_argument("--csv", default=None, help="directory to write CSV files")
    p.add_argument("--kind", default=None, help="filter alerts by kind")
    args = p.parse_args(argv)
    try:
        cfg = load_config(args.config, require_telegram=False)
    except ConfigError as e:
        print(f"CONFIG ERROR:\n{e}", file=sys.stderr)
        return 2
    dbp = cfg.path(cfg.paths.database)
    if not dbp.exists():
        print(f"No database yet at {dbp}. Run main.py first.")
        return 1
    conn = sqlite3.connect(f"file:{dbp}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    windows = cfg.outcomes.windows_hours

    where = "WHERE o.alert_id IS NOT NULL"
    params: tuple = ()
    if args.kind:
        where += " AND a.kind=?"
        params = (args.kind,)
    rows = q(conn, f"""SELECT a.id, a.kind, a.symbol, a.created_iso, a.score, a.stage, a.tagged, a.floor,
                       o.status, o.entry_price, o.first_hit, o.giveback_hours_from_gain, o.giveback_hours_from_peak,
                       o.last_price FROM alerts a LEFT JOIN outcomes o ON o.alert_id=a.id {where}
                       ORDER BY a.created_ms""", params)
    wins = q(conn, "SELECT * FROM outcome_windows")
    by_alert: dict = {}
    for w in wins:
        by_alert.setdefault(w["alert_id"], {})[w["window_h"]] = w
    for r in rows:
        for w in windows:
            ww = by_alert.get(r["id"], {}).get(w)
            r[f"chg_{w}h"] = ww["change_pct"] if ww and (ww["complete"] or r["status"] == "delisted") else None
            r[f"mg_{w}h"] = ww["max_gain_pct"] if ww and (ww["complete"] or r["status"] == "delisted") else None
            r[f"dd_{w}h"] = ww["max_drawdown_pct"] if ww and (ww["complete"] or r["status"] == "delisted") else None

    cols = ["group", "alerts", "decided", "hit_rate", "floor_first", "ambiguous", "delisted"] + \
           [f"avg_{w}h" for w in windows] + [f"maxgain_{w}h" for w in windows[-1:]]
    print(f"squeeze-radar report  (hit = +{cfg.outcomes.target_gain_pct:g}% before floor; "
          f"{len(rows)} tracked alerts{' of kind ' + args.kind if args.kind else ''})")
    t1 = group_stats(rows, lambda r: score_bucket(r["score"]), windows)
    t2 = group_stats(rows, lambda r: r["stage"] or "untagged/none", windows)
    t3 = group_stats(rows, lambda r: "tagged" if r["tagged"] else "untagged", windows)
    t4 = group_stats(rows, lambda r: r["kind"], windows)
    print(table("Hit rate by score range", t1, cols))
    print(table("Results by stage at alert", t2, cols))
    print(table("Tagged vs untagged", t3, cols))
    print(table("By alert kind", t4, cols))

    # Tag -> trigger timing
    tt = q(conn, "SELECT symbol, tagged_ms, first_trigger_ms FROM watchlist WHERE tagged_ms IS NOT NULL")
    trig = [(r["first_trigger_ms"] - r["tagged_ms"]) / 86_400_000 for r in tt if r["first_trigger_ms"]]
    print("\n== Tag to trigger ==")
    print(f"Tagged tokens tracked: {len(tt)} | reached TRIGGER: {len(trig)} | "
          f"avg days tag->trigger: {fmt(sum(trig) / len(trig), 2) if trig else '-'}")

    rv = [r["giveback_hours_from_peak"] for r in rows if r["giveback_hours_from_peak"] is not None]
    rg = [r["giveback_hours_from_gain"] for r in rows if r["giveback_hours_from_gain"] is not None]
    print("\n== Reversal speed after spikes ==")
    print(f"Spikes that gave back {cfg.outcomes.giveback_fraction:.0%} of the gain: {len(rv)} | "
          f"avg hours from peak: {fmt(sum(rv) / len(rv), 1) if rv else '-'} | "
          f"avg hours from +{cfg.outcomes.target_gain_pct:g}%: {fmt(sum(rg) / len(rg), 1) if rg else '-'}")

    st = q(conn, "SELECT status, COUNT(*) AS n FROM outcomes GROUP BY status")
    amb = sum(r["first_hit"] == "ambiguous" for r in rows)
    dl = sum(r["status"] == "delisted" for r in rows)
    print("\n== Data quality ==")
    print(f"Ambiguous (floor and target in the same 5m candle): {amb} | delisted during tracking: {dl}")
    print("Outcome status: " + (", ".join(f"{s['status']} {s['n']}" for s in st) or "none yet"))

    if args.csv:
        out = Path(args.csv)
        out.mkdir(parents=True, exist_ok=True)
        detail_cols = ["id", "kind", "symbol", "created_iso", "score", "stage", "tagged", "floor", "status",
                       "entry_price", "first_hit", "giveback_hours_from_gain", "giveback_hours_from_peak", "last_price"] + \
                      [f"{p}_{w}h" for w in windows for p in ("chg", "mg", "dd")]
        for fname, data, c in [("alerts_outcomes.csv", rows, detail_cols), ("by_score.csv", t1, cols),
                               ("by_stage.csv", t2, cols), ("tagged_vs_untagged.csv", t3, cols),
                               ("by_kind.csv", t4, cols)]:
            with open(out / fname, "w", newline="", encoding="utf-8") as fh:
                w = csv.DictWriter(fh, fieldnames=c, extrasaction="ignore")
                w.writeheader()
                w.writerows(data)
        print(f"\nCSV files written to {out.resolve()}")
    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
