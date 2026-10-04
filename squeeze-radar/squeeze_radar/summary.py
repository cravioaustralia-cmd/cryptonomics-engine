"""Hourly top-N summary and daily heartbeat messages."""
from __future__ import annotations

import json
import logging

from .alerts import record_alert, summary_line
from .db import DB
from .telegram import esc
from .timeutil import DAY_MS, HOUR_MS, now_ms, short

log = logging.getLogger(__name__)


def hourly_summary(db: DB, notifier, cfg, dry_run: bool) -> dict:
    row = db.one("SELECT MAX(run_ms) AS r FROM scores")
    if not row or row["r"] is None:
        notifier.send("📊 <b>Hourly top</b>: no scan data yet.")
        return {"status": "no-data"}
    run_ms = row["r"]
    t = now_ms()
    stale = t - run_ms > 2 * cfg.schedule.collect_minutes * 60_000
    rows = db.all(
        "SELECT s.symbol, s.score, s.stage, sn.metrics_json FROM scores s "
        "JOIN snapshots sn ON sn.run_ms=s.run_ms AND sn.symbol=s.symbol "
        "WHERE s.run_ms=? AND (sn.eligible=1 OR s.tagged=1) ORDER BY s.score DESC, s.symbol LIMIT ?",
        (run_ms, cfg.alerts.hourly_top_n))
    lines = [f"📊 <b>Top {len(rows)} squeeze setups</b> (scan {esc(short(run_ms))})"]
    if stale:
        lines.append(f"⚠️ Latest scan is old ({esc(short(run_ms))}). Check data-source warnings.")
    bucket_ms = max(1, int(cfg.outcomes.hourly_top_dedupe_hours * HOUR_MS))
    for i, r in enumerate(rows, 1):
        m = json.loads(r["metrics_json"])
        lines.append(f"{i}. {summary_line(r['symbol'], r['score'], m, r['stage'])}")
        record_alert(db, kind="hourly_top", symbol=r["symbol"], t=t, score=r["score"], stage=r["stage"],
                     tagged=r["stage"] is not None, floor=m.get("floor"), price=m.get("last_price"), metrics=m,
                     message="hourly top", dedupe_key=f"hourly:{r['symbol']}:{t // bucket_ms}", dry_run=dry_run)
    if not rows:
        lines.append("No eligible pairs in the latest scan (scan worked, nothing qualified).")
    stages = db.all("SELECT stage, COUNT(*) AS n FROM watchlist WHERE active=1 GROUP BY stage")
    if stages:
        lines.append("Watchlist: " + esc(", ".join(f"{s['stage']} {s['n']}" for s in stages)))
    notifier.send("\n".join(lines))
    return {"status": "ok", "rows": len(rows)}


def heartbeat(db: DB, notifier, cfg) -> dict:
    t = now_ms()
    since = t - DAY_MS
    runs = db.one("SELECT COUNT(DISTINCT run_ms) AS runs, COUNT(DISTINCT symbol) AS syms FROM snapshots WHERE run_ms>=?",
                  (since,))
    last = db.get_meta("last_collect_stats")
    last_stats = json.loads(last) if last else {}
    sent = db.one("SELECT COUNT(*) AS n FROM outbox WHERE sent_ms>=?", (since,))["n"]
    alerts = db.one("SELECT COUNT(*) AS n FROM alerts WHERE created_ms>=? AND kind!='hourly_top'", (since,))["n"]
    errs = db.one("SELECT COUNT(*) AS n FROM events WHERE at_ms>=? AND level='ERROR'", (since,))["n"]
    warns = db.one("SELECT COUNT(*) AS n FROM events WHERE at_ms>=? AND level='WARNING'", (since,))["n"]
    pending = db.one("SELECT COUNT(*) AS n FROM outbox WHERE sent_ms IS NULL")["n"]
    wl = db.one("SELECT COUNT(*) AS n FROM watchlist WHERE active=1")["n"]
    health = db.all("SELECT source, last_status, consecutive_failures, last_ok_ms FROM source_health ORDER BY source")
    lines = [
        "💓 <b>squeeze-radar alive</b> " + esc(short(t)),
        f"Scans last 24h: {runs['runs']} | symbols scanned: {runs['syms']}",
        f"Last scan: fetched {last_stats.get('fetched', 'n/a')}, scored {last_stats.get('scored', 'n/a')}, "
        f"failed {last_stats.get('failed', 'n/a')}",
        f"Alerts last 24h: {alerts} | Telegram messages sent: {sent} | unsent in outbox: {pending}",
        f"Errors last 24h: {errs} | warnings: {warns}",
        f"Tagged watchlist: {wl} active",
    ]
    for h in health:
        flag = "✅" if h["last_status"] in ("ok", "ok_empty") else "⚠️"
        lines.append(f"{flag} {esc(h['source'])}: {esc(h['last_status'])}, last ok {esc(short(h['last_ok_ms']))}")
    notifier.send("\n".join(lines))
    return {"status": "ok"}
