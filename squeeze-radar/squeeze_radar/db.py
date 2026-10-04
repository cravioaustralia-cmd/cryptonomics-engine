"""SQLite storage (WAL mode). All state lives here so a restart loses nothing."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any, Iterable

from .timeutil import iso, now_ms

SCHEMA = """
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);

CREATE TABLE IF NOT EXISTS job_state (
    job TEXT PRIMARY KEY,
    last_slot_ms INTEGER,
    last_run_ms INTEGER,
    last_run_iso TEXT,
    last_ok INTEGER,
    last_error TEXT
);

CREATE TABLE IF NOT EXISTS instruments (
    symbol TEXT PRIMARY KEY,
    base_coin TEXT,
    quote_coin TEXT,
    contract_type TEXT,
    status TEXT,
    symbol_type TEXT,
    launch_time_ms INTEGER,
    launch_time_iso TEXT,
    funding_interval_min INTEGER,
    funding_interval_hour REAL,
    delivery_time_ms INTEGER,
    delivery_time_iso TEXT,
    tags_json TEXT,
    first_seen_ms INTEGER,
    last_seen_ms INTEGER,
    active INTEGER NOT NULL DEFAULT 1,
    removed_ms INTEGER,
    removed_iso TEXT,
    too_new INTEGER NOT NULL DEFAULT 0,
    turnover_24h REAL,
    updated_ms INTEGER,
    updated_iso TEXT
);

CREATE TABLE IF NOT EXISTS snapshots (
    run_ms INTEGER NOT NULL,
    run_iso TEXT,
    symbol TEXT NOT NULL,
    last_price REAL,
    chg_4h_pct REAL,
    chg_24h_pct REAL,
    volume_ratio REAL,
    turnover_24h REAL,
    oi_coin REAL,
    oi_usd REAL,
    oi_chg_4h_pct REAL,
    oi_chg_24h_pct REAL,
    funding_interval_h REAL,
    funding_now_8h REAL,
    funding_avg_n_8h REAL,
    funding_own_avg_8h REAL,
    ls_ratio REAL,
    ls_avg REAL,
    perf_vs_btc_pct REAL,
    range_tightness_pct REAL,
    floor REAL,
    range_high REAL,
    last_candle_ms INTEGER,
    last_close REAL,
    last_turnover_1h REAL,
    avg_turnover_1h REAL,
    eligible INTEGER,
    too_new INTEGER,
    tagged INTEGER,
    metrics_json TEXT,
    PRIMARY KEY (run_ms, symbol)
);
CREATE INDEX IF NOT EXISTS ix_snap_symbol ON snapshots(symbol, run_ms);

CREATE TABLE IF NOT EXISTS scores (
    run_ms INTEGER NOT NULL,
    run_iso TEXT,
    symbol TEXT NOT NULL,
    score REAL,
    raw_total REAL,
    tagged INTEGER,
    stage TEXT,
    PRIMARY KEY (run_ms, symbol)
);
CREATE TABLE IF NOT EXISTS score_components (
    run_ms INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    component TEXT NOT NULL,
    points REAL,
    detail TEXT,
    PRIMARY KEY (run_ms, symbol, component)
);

CREATE TABLE IF NOT EXISTS announcements (
    source TEXT NOT NULL,
    ann_id TEXT NOT NULL,
    url TEXT,
    title TEXT,
    published_ms INTEGER,
    published_iso TEXT,
    category TEXT,
    action TEXT,
    tokens_json TEXT,
    matched_json TEXT,
    unmatched_json TEXT,
    seen_ms INTEGER,
    seen_iso TEXT,
    PRIMARY KEY (source, ann_id)
);
CREATE INDEX IF NOT EXISTS ix_ann_url ON announcements(url);

CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    token TEXT,
    source TEXT,
    tag_type TEXT,
    announcement_url TEXT,
    tagged_ms INTEGER,
    tagged_iso TEXT,
    expires_ms INTEGER,
    expires_iso TEXT,
    stage TEXT NOT NULL,
    stage_since_ms INTEGER,
    floor REAL,
    active INTEGER NOT NULL DEFAULT 1,
    tag_removed_ms INTEGER,
    tag_removed_url TEXT,
    delisting_ms INTEGER,
    first_trigger_ms INTEGER,
    last_trigger_ms INTEGER,
    invalidated_ms INTEGER,
    last_eval_candle_ms INTEGER,
    ended_ms INTEGER,
    ended_reason TEXT,
    notes TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_watch_active ON watchlist(symbol) WHERE active = 1;

CREATE TABLE IF NOT EXISTS stage_transitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    watch_id INTEGER,
    symbol TEXT,
    from_stage TEXT,
    to_stage TEXT,
    reason TEXT,
    candle_ms INTEGER,
    at_ms INTEGER,
    at_iso TEXT
);

CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    symbol TEXT,
    created_ms INTEGER NOT NULL,
    created_iso TEXT,
    score REAL,
    stage TEXT,
    tagged INTEGER,
    floor REAL,
    price_at_alert REAL,
    metrics_json TEXT,
    components_json TEXT,
    message TEXT,
    dedupe_key TEXT UNIQUE,
    dry_run INTEGER
);
CREATE INDEX IF NOT EXISTS ix_alert_symbol ON alerts(symbol, created_ms);

CREATE TABLE IF NOT EXISTS alert_state (
    symbol TEXT PRIMARY KEY,
    last_score REAL,
    last_stage TEXT,
    last_alert_ms INTEGER
);

CREATE TABLE IF NOT EXISTS outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_ms INTEGER,
    created_iso TEXT,
    text TEXT NOT NULL,
    sent_ms INTEGER,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT
);

CREATE TABLE IF NOT EXISTS outcomes (
    alert_id INTEGER PRIMARY KEY,
    symbol TEXT,
    status TEXT,
    entry_ms INTEGER,
    entry_iso TEXT,
    entry_price REAL,
    floor REAL,
    first_hit TEXT,
    first_hit_ms INTEGER,
    gain_hit_ms INTEGER,
    floor_hit_ms INTEGER,
    peak_price REAL,
    peak_ms INTEGER,
    giveback_ms INTEGER,
    giveback_hours_from_gain REAL,
    giveback_hours_from_peak REAL,
    last_price REAL,
    last_candle_ms INTEGER,
    updated_ms INTEGER,
    updated_iso TEXT
);
CREATE TABLE IF NOT EXISTS outcome_windows (
    alert_id INTEGER NOT NULL,
    window_h INTEGER NOT NULL,
    complete INTEGER NOT NULL DEFAULT 0,
    change_pct REAL,
    max_gain_pct REAL,
    max_drawdown_pct REAL,
    PRIMARY KEY (alert_id, window_h)
);

CREATE TABLE IF NOT EXISTS candles_5m (
    symbol TEXT NOT NULL,
    start_ms INTEGER NOT NULL,
    open REAL, high REAL, low REAL, close REAL,
    PRIMARY KEY (symbol, start_ms)
);

CREATE TABLE IF NOT EXISTS source_health (
    source TEXT PRIMARY KEY,
    consecutive_failures INTEGER NOT NULL DEFAULT 0,
    last_status TEXT,
    last_error TEXT,
    last_ok_ms INTEGER,
    last_fail_ms INTEGER,
    last_warned_ms INTEGER,
    in_failure INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    at_ms INTEGER,
    at_iso TEXT,
    level TEXT,
    source TEXT,
    message TEXT
);
CREATE INDEX IF NOT EXISTS ix_events_at ON events(at_ms);
"""


class DB:
    def __init__(self, path: Path | str):
        if str(path) != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(path), timeout=30, isolation_level=None)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.execute("PRAGMA synchronous=NORMAL")
        self.conn.execute("PRAGMA foreign_keys=ON")
        self.conn.executescript(SCHEMA)

    # -- tiny helpers --------------------------------------------------------
    def execute(self, sql: str, params: Iterable[Any] = ()) -> sqlite3.Cursor:
        return self.conn.execute(sql, tuple(params))

    def one(self, sql: str, params: Iterable[Any] = ()) -> sqlite3.Row | None:
        return self.conn.execute(sql, tuple(params)).fetchone()

    def all(self, sql: str, params: Iterable[Any] = ()) -> list[sqlite3.Row]:
        return self.conn.execute(sql, tuple(params)).fetchall()

    def tx(self):
        return _Tx(self.conn)

    def insert(self, table: str, row: dict, or_clause: str = "") -> int:
        cols = ",".join(row)
        qs = ",".join("?" for _ in row)
        cur = self.conn.execute(f"INSERT {or_clause} INTO {table} ({cols}) VALUES ({qs})",
                                tuple(row.values()))
        return cur.lastrowid

    def upsert(self, table: str, row: dict, keys: list[str]) -> None:
        cols = ",".join(row)
        qs = ",".join("?" for _ in row)
        upd = ",".join(f"{c}=excluded.{c}" for c in row if c not in keys)
        sql = f"INSERT INTO {table} ({cols}) VALUES ({qs}) ON CONFLICT({','.join(keys)}) DO "
        sql += f"UPDATE SET {upd}" if upd else "NOTHING"
        self.conn.execute(sql, tuple(row.values()))

    def log_event(self, level: str, source: str, message: str) -> None:
        t = now_ms()
        self.conn.execute("INSERT INTO events (at_ms, at_iso, level, source, message) VALUES (?,?,?,?,?)",
                          (t, iso(t), level, source, message[:2000]))

    def get_meta(self, key: str) -> str | None:
        r = self.one("SELECT value FROM meta WHERE key=?", (key,))
        return r["value"] if r else None

    def set_meta(self, key: str, value: str) -> None:
        self.upsert("meta", {"key": key, "value": value}, ["key"])

    def close(self) -> None:
        self.conn.close()


class _Tx:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def __enter__(self):
        self.conn.execute("BEGIN IMMEDIATE")
        return self.conn

    def __exit__(self, exc_type, *_):
        if exc_type is None:
            self.conn.execute("COMMIT")
        else:
            self.conn.execute("ROLLBACK")


def dumps(o: Any) -> str:
    return json.dumps(o, separators=(",", ":"), sort_keys=True, default=str)
