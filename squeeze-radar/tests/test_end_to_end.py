"""Full pipeline against the local fake exchange (real HTTP code, real SQLite, dry-run Telegram)."""
import subprocess
import sys
from pathlib import Path

import pytest
import yaml

import fake_exchange
from squeeze_radar.app import App
from squeeze_radar.config import load_config
from squeeze_radar.timeutil import HOUR_MS, now_ms

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="module")
def server():
    srv, port = fake_exchange.serve(0)
    yield f"http://127.0.0.1:{port}"
    srv.shutdown()


@pytest.fixture
def app_factory(tmp_path, server):
    data = yaml.safe_load((ROOT / "config.yaml").read_text())
    data["bybit"]["base_url"] = server
    data["bybit"]["max_requests_per_second"] = 100
    data["announcements"]["binance"]["base_url"] = server
    data["paths"] = {"database": str(tmp_path / "t.db"), "lock_file": str(tmp_path / "t.lock"),
                     "log_dir": str(tmp_path / "logs")}
    p = tmp_path / "config.yaml"
    p.write_text(yaml.safe_dump(data))
    apps = []

    def make():
        cfg = load_config(p, require_telegram=False)
        a = App(cfg, dry_run=True)
        printed = []
        a.notifier.printer = printed.append
        a.printed = printed
        apps.append(a)
        return a
    yield make, p
    for a in apps:
        a.close()


def test_full_run(app_factory):
    make, _ = app_factory
    fake_exchange.WORLD.binance_mode = "ok"
    app = make()
    app.run_once()
    db = app.db
    out = "\n".join(app.printed)

    # Universe: pagination worked, filters applied
    syms = {r["symbol"] for r in db.all("SELECT symbol FROM instruments WHERE active=1")}
    assert {"BTCUSDT", "MOVRUSDT", "1000PEPEUSDT", "NEWUSDT", "THINUSDT", "BADUSDT"} <= syms
    assert "AAPLUSDT" not in syms and "ETHPERP" not in syms
    assert db.one("SELECT too_new FROM instruments WHERE symbol='NEWUSDT'")["too_new"] == 1
    assert db.one("SELECT funding_interval_hour FROM instruments WHERE symbol='MOVRUSDT'")["funding_interval_hour"] == 4

    # Announcements: tokens extracted, multiplier prefix mapped, unmatched reported raw, old one ignored
    wl = {r["symbol"]: r for r in db.all("SELECT * FROM watchlist")}
    assert "MOVRUSDT" in wl and "1000PEPEUSDT" in wl
    assert "THINUSDT" in wl and wl["THINUSDT"]["source"] == "bybit"   # Bybit ST tag
    assert "Could not match confidently" in out and "ZZZQ" in out
    assert db.one("SELECT action FROM announcements WHERE ann_id='9000'")["action"] == "too-old"

    # Collect: one bad symbol did not crash the run; too-new/thin skipped
    snaps = {r["symbol"]: r for r in db.all("SELECT * FROM snapshots")}
    assert "BADUSDT" not in snaps and "NEWUSDT" not in snaps
    m = snaps["MOVRUSDT"]
    assert m["volume_ratio"] == pytest.approx(4.25, rel=0.1)
    assert m["oi_chg_24h_pct"] == pytest.approx(20.0, rel=0.01)
    assert m["funding_now_8h"] == pytest.approx(-0.0005)        # 4h rate normalized to 8h
    assert m["ls_ratio"] < m["ls_avg"]
    assert db.one("SELECT score FROM scores WHERE symbol='MOVRUSDT'")["score"] == 100
    comps = {r["component"]: r["points"] for r in db.all("SELECT * FROM score_components WHERE symbol='MOVRUSDT'")}
    assert comps["volume_ratio"] == 20 and comps["tagged_bonus"] == 20

    # Stage machine moved MOVR to LOADING and alerted, with the floor
    assert db.one("SELECT stage FROM watchlist WHERE symbol='MOVRUSDT'")["stage"] == "LOADING"
    assert "Stage change: MOVR" in out and "Suggested invalidation level" in out
    # Hourly summary in the documented one-line format
    assert "Top" in out and "| Score 100 |" in out and "TAGGED Stage 2" in out

    # Restart: nothing is re-alerted, announcements not reprocessed
    n_alerts = db.one("SELECT COUNT(*) n FROM alerts WHERE kind!='hourly_top'")["n"]
    app2 = make()
    app2.run_once(["announcements", "collect"])
    assert app2.db.one("SELECT COUNT(*) n FROM alerts WHERE kind!='hourly_top'")["n"] == n_alerts
    out2 = "\n".join(app2.printed)
    assert "NEW Binance Monitoring Tag" not in out2 and "Stage change" not in out2


def test_outcomes_and_report(app_factory):
    make, cfg_path = app_factory
    fake_exchange.WORLD.binance_mode = "ok"
    app = make()
    app.run_once(["universe", "announcements", "collect"])
    # Pretend the alerts happened 5 hours ago so the 4h window is complete.
    app.db.execute("UPDATE alerts SET created_ms=created_ms-?", (5 * HOUR_MS,))
    stats = app.outcomes.run()
    assert stats["tracked"] >= 1 and stats["errors"] == 0
    o = app.db.one("SELECT o.*, a.created_ms FROM outcomes o JOIN alerts a ON a.id=o.alert_id "
                   "WHERE o.symbol='MOVRUSDT' LIMIT 1")
    assert o["entry_ms"] >= o["created_ms"] and o["entry_ms"] - o["created_ms"] < 300_000
    w4 = app.db.one("SELECT * FROM outcome_windows WHERE alert_id=? AND window_h=4", (o["alert_id"],))
    assert w4["complete"] == 1 and w4["max_gain_pct"] is not None
    # Outcome job is incremental: second run fetches only new candles
    before = len(fake_exchange.WORLD.requests)
    app.outcomes.run()
    assert len(fake_exchange.WORLD.requests) - before <= 2 * stats["tracked"]

    # report.py runs against the DB and writes CSV
    r = subprocess.run([sys.executable, str(ROOT / "report.py"), "--config", str(cfg_path), "--csv",
                        str(cfg_path.parent / "csv")], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    assert "Hit rate by score range" in r.stdout and "Tagged vs untagged" in r.stdout
    assert (cfg_path.parent / "csv" / "alerts_outcomes.csv").exists()


def test_binance_block_and_format_change_are_never_silent(app_factory):
    make, _ = app_factory
    app = make()
    app.run_once(["universe"])
    fake_exchange.WORLD.binance_mode = "blocked"
    for _ in range(3):
        app.run_once(["announcements"])
    out = "\n".join(app.printed)
    assert "Data source problem" in out and "binance_announcements" in out and "BLOCKED" in out
    fake_exchange.WORLD.binance_mode = "changed"
    app.run_once(["announcements"])
    h = app.db.one("SELECT * FROM source_health WHERE source='binance_announcements'")
    assert h["consecutive_failures"] == 4 and "FORMAT CHANGED" in h["last_error"]
    fake_exchange.WORLD.binance_mode = "ok"
    app.run_once(["announcements"])
    assert "recovered" in "\n".join(app.printed)


def test_delisted_symbol_during_tracking(app_factory):
    make, _ = app_factory
    fake_exchange.WORLD.binance_mode = "ok"
    app = make()
    app.run_once(["universe", "announcements", "collect"])
    app.db.execute("UPDATE alerts SET created_ms=created_ms-?", (5 * HOUR_MS,))
    app.outcomes.run()
    # PEPE vanishes from Bybit
    w = fake_exchange.WORLD
    saved = list(w.instruments)
    w.instruments = [i for i in w.instruments if i["symbol"] != "1000PEPEUSDT"]
    try:
        app.run_once(["universe"])
        out = "\n".join(app.printed)
        assert "URGENT" in out and "1000PEPEUSDT" in out
        assert app.db.one("SELECT stage FROM watchlist WHERE symbol='1000PEPEUSDT'")["stage"] == "DELISTED"
        # Make the cached candles old and the API return nothing for the symbol
        app.db.execute("DELETE FROM candles_5m WHERE symbol='1000PEPEUSDT' AND start_ms > ?", (now_ms() - 3 * HOUR_MS,))
        app.db.execute("UPDATE outcomes SET status='tracking' WHERE symbol='1000PEPEUSDT'")
        w.by_sym["1000PEPEUSDT"]["price"] = w.by_sym["1000PEPEUSDT"]["price"]  # still served by kline
        app.outcomes.run()
        rows = app.db.all("SELECT status, last_price FROM outcomes WHERE symbol='1000PEPEUSDT'")
        assert rows  # never disappears
    finally:
        w.instruments = saved


def test_cli_lock_and_dry_run(app_factory):
    make, cfg_path = app_factory
    from squeeze_radar.lock import InstanceLock
    data = yaml.safe_load(cfg_path.read_text())
    with InstanceLock(Path(data["paths"]["lock_file"])):
        r = subprocess.run([sys.executable, str(ROOT / "main.py"), "--once", "--dry-run", "--job", "heartbeat",
                            "--config", str(cfg_path)], capture_output=True, text=True)
        assert r.returncode == 3 and "Only one instance" in r.stderr
    r = subprocess.run([sys.executable, str(ROOT / "main.py"), "--once", "--dry-run", "--job", "heartbeat",
                        "--config", str(cfg_path)], capture_output=True, text=True)
    assert r.returncode == 0 and "squeeze-radar alive" in r.stdout


def test_urgent_delisting_of_watchlist_perp(app_factory):
    make, _ = app_factory
    fake_exchange.WORLD.binance_mode = "ok"
    app = make()
    app.run_once(["universe", "announcements"])
    assert "8AM" not in "\n".join(app.printed)   # date text is not mistaken for a token
    fake_exchange.WORLD.extra_bybit = [{
        "title": "Delisting of MOVRUSDT Perpetual Contract", "description": "Bybit will delist MOVRUSDT on Oct 30, 2026, 8AM UTC.",
        "type": {"title": "Delistings", "key": "delistings"}, "tags": ["Derivatives"],
        "url": "https://announcements.bybit.com/en-US/article/delisting-of-movrusdt-perpetual-contract-blt0002/",
        "dateTimestamp": now_ms(), "publishTime": now_ms()}]
    try:
        app.run_once(["announcements"])
        out = "\n".join(app.printed)
        assert "URGENT: Bybit is delisting a watchlist perpetual" in out and "2026-10-30 08:00 UTC" in out
        assert app.db.one("SELECT delisting_ms FROM watchlist WHERE symbol='MOVRUSDT'")["delisting_ms"] is not None
        n = len(app.printed)
        app.run_once(["announcements"])  # same announcement again -> no second alert
        assert len(app.printed) == n
    finally:
        fake_exchange.WORLD.extra_bybit = []
