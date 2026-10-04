"""Telegram formatting/outbox, config validation, health warnings, lock, HTTP retries."""
import subprocess
import sys
from pathlib import Path

import pytest
import requests

from squeeze_radar.config import ConfigError, load_config
from squeeze_radar.db import DB
from squeeze_radar.health import EMPTY, ERROR, OK, HealthTracker
from squeeze_radar.http import BlockedError, FetchError, RateLimiter, get_with_retries
from squeeze_radar.lock import AlreadyRunning, InstanceLock
from squeeze_radar.telegram import MAX_LEN, Notifier, esc, split_message

ROOT = Path(__file__).resolve().parents[1]


# ---------------------------------------------------------------- telegram --
def test_escape_html():
    assert esc("<b>A&B</b>") == "&lt;b&gt;A&amp;B&lt;/b&gt;"


def test_split_message():
    text = "\n".join(f"line {i} " + "x" * 90 for i in range(200))
    parts = split_message(text)
    assert all(len(p) <= MAX_LEN for p in parts) and len(parts) > 1
    assert "\n".join(parts) == text
    huge = "y" * (MAX_LEN * 2 + 10)
    assert [len(p) for p in split_message(huge)] == [MAX_LEN, MAX_LEN, 10]


class FakeResp:
    def __init__(self, code, data):
        self.status_code, self._d, self.text = code, data, str(data)

    def json(self):
        return self._d


class FakeSession:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def post(self, url, json, timeout):
        self.calls.append(json)
        r = self.responses.pop(0)
        if isinstance(r, Exception):
            raise r
        return r


def notifier(session, db, retries=3):
    return Notifier(db, "1:x", "42", dry_run=False, max_retries=retries, min_interval=0, timeout=1,
                    session=session, sleep=lambda s: None)


def test_telegram_retries_429_then_succeeds():
    db = DB(":memory:")
    s = FakeSession([FakeResp(429, {"ok": False, "parameters": {"retry_after": 1}}),
                     requests.ConnectionError("boom"), FakeResp(200, {"ok": True})])
    n = notifier(s, db)
    n.send("hello")
    assert len(s.calls) == 3
    assert db.one("SELECT COUNT(*) n FROM outbox WHERE sent_ms IS NULL")["n"] == 0


def test_telegram_failure_keeps_message_in_outbox_and_retries_later():
    db = DB(":memory:")
    s = FakeSession([FakeResp(500, {"ok": False})] * 2)
    n = notifier(s, db, retries=1)
    n.send("important")
    row = db.one("SELECT * FROM outbox")
    assert row["sent_ms"] is None and row["attempts"] == 1
    assert db.one("SELECT COUNT(*) n FROM events WHERE level='ERROR'")["n"] == 1
    s.responses = [FakeResp(200, {"ok": True})]
    assert n.flush() == 1
    assert db.one("SELECT sent_ms FROM outbox")["sent_ms"] is not None


def test_telegram_bad_html_falls_back_to_plain_text():
    db = DB(":memory:")
    s = FakeSession([FakeResp(400, {"ok": False, "description": "Bad Request: can't parse entities"}),
                     FakeResp(200, {"ok": True})])
    notifier(s, db).send("<b>x</b> &amp; y")
    assert "parse_mode" not in s.calls[1] and s.calls[1]["text"] == "x & y"


def test_dry_run_prints_instead_of_sending():
    db = DB(":memory:")
    out = []
    n = Notifier(db, "", "", dry_run=True, max_retries=0, min_interval=0, timeout=1, printer=out.append)
    n.send("hi")
    assert "DRY-RUN" in out[0] and "hi" in out[0]


# ------------------------------------------------------------------ config --
def _write_cfg(tmp_path, mutate):
    import yaml
    data = yaml.safe_load((ROOT / "config.yaml").read_text())
    mutate(data)
    p = tmp_path / "config.yaml"
    p.write_text(yaml.safe_dump(data))
    return p


def test_config_valid(cfg):
    assert cfg.alerts.instant_score_threshold == 80


def test_config_unknown_key_and_bad_values(tmp_path):
    p = _write_cfg(tmp_path, lambda d: d["alerts"].update(typo_key=1))
    with pytest.raises(ConfigError, match="typo_key"):
        load_config(p, require_telegram=False)
    p = _write_cfg(tmp_path, lambda d: d["schedule"].update(heartbeat_utc="25:99"))
    with pytest.raises(ConfigError, match="heartbeat_utc"):
        load_config(p, require_telegram=False)
    p = _write_cfg(tmp_path, lambda d: d["collection"].update(kline_limit=100))
    with pytest.raises(ConfigError, match="kline_limit"):
        load_config(p, require_telegram=False)
    p = _write_cfg(tmp_path, lambda d: d.pop("scoring"))
    with pytest.raises(ConfigError, match="scoring"):
        load_config(p, require_telegram=False)


def test_env_validation(tmp_path, monkeypatch):
    monkeypatch.delenv("TELEGRAM_BOT_TOKEN", raising=False)
    monkeypatch.delenv("TELEGRAM_CHAT_ID", raising=False)
    p = _write_cfg(tmp_path, lambda d: None)
    with pytest.raises(ConfigError, match="TELEGRAM_BOT_TOKEN is missing"):
        load_config(p)
    (tmp_path / ".env").write_text("TELEGRAM_BOT_TOKEN=nope\nTELEGRAM_CHAT_ID=abc\n")
    with pytest.raises(ConfigError, match="does not look like a bot token"):
        load_config(p)
    (tmp_path / ".env").write_text("TELEGRAM_BOT_TOKEN=123456789:" + "A" * 35 + "\nTELEGRAM_CHAT_ID=-1001234\n")
    assert load_config(p).telegram_chat_id == "-1001234"


# ------------------------------------------------------------------ health --
class Rec:
    def __init__(self):
        self.msgs = []

    def send_system(self, t):
        self.msgs.append(t)


def test_health_warns_after_n_failures_and_recovers():
    db = DB(":memory:")
    rec = Rec()
    h = HealthTracker(db, rec, 3, 6, True)
    h.report("binance", ERROR, "403")
    h.report("binance", EMPTY, "0 rows")
    assert rec.msgs == []
    h.report("binance", ERROR, "403 again")
    assert len(rec.msgs) == 1 and "3 times in a row" in rec.msgs[0] and "not \"no results\"" in rec.msgs[0]
    h.report("binance", ERROR, "still")  # no re-warn inside rewarn window
    assert len(rec.msgs) == 1
    h.report("binance", OK)
    assert len(rec.msgs) == 2 and "recovered" in rec.msgs[1]
    h.report("binance", "ok_empty")  # legitimate no-results is not a failure
    assert db.one("SELECT consecutive_failures c FROM source_health")["c"] == 0


# -------------------------------------------------------------------- lock --
def test_lock_prevents_second_instance(tmp_path):
    p = tmp_path / "x.lock"
    with InstanceLock(p):
        with pytest.raises(AlreadyRunning):
            InstanceLock(p).acquire()
        code = "import sys; sys.path.insert(0, %r)\nfrom squeeze_radar.lock import InstanceLock, AlreadyRunning\n" \
               "try:\n  InstanceLock(__import__('pathlib').Path(%r)).acquire(); print('GOT')\n" \
               "except AlreadyRunning: print('BLOCKED')" % (str(ROOT), str(p))
        out = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True).stdout
        assert "BLOCKED" in out
    InstanceLock(p).acquire()  # released -> can be taken again


# -------------------------------------------------------------------- http --
class HSession:
    def __init__(self, seq):
        self.seq = list(seq)
        self.n = 0

    def get(self, url, params=None, timeout=None, headers=None):
        self.n += 1
        r = self.seq.pop(0)
        if isinstance(r, Exception):
            raise r
        return r


class HResp:
    def __init__(self, code, data=None, text=""):
        self.status_code, self._d, self.text, self.headers = code, data, text, {}

    def json(self):
        if self._d is None:
            raise ValueError
        return self._d


def test_http_retries_and_gives_up():
    s = HSession([requests.Timeout("t"), HResp(502), HResp(200, {"retCode": 10006}), HResp(200, {"retCode": 0})])
    r = get_with_retries(s, "u", {}, timeout=1, max_retries=4, backoff_base=0.01, backoff_max=0.01,
                         retry_on_payload=lambda p: p.get("retCode") == 10006, sleep=lambda x: None)
    assert r.json()["retCode"] == 0 and s.n == 4
    s = HSession([HResp(500)] * 3)
    with pytest.raises(FetchError):
        get_with_retries(s, "u", {}, timeout=1, max_retries=2, backoff_base=0.01, backoff_max=0.01, sleep=lambda x: None)


def test_http_403_is_not_retried():
    s = HSession([HResp(403, text="captcha")])
    with pytest.raises(BlockedError):
        get_with_retries(s, "u", {}, timeout=1, max_retries=3, backoff_base=0.01, backoff_max=0.01, sleep=lambda x: None)
    assert s.n == 1


def test_rate_limiter_spacing():
    import time
    rl = RateLimiter(50)
    t = time.monotonic()
    for _ in range(11):
        rl.wait()
    assert time.monotonic() - t >= 0.19
