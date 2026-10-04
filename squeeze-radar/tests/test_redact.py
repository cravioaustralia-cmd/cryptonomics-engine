"""The Telegram bot token must never appear in logs, stored errors or console output."""
import logging

import requests

from squeeze_radar.db import DB
from squeeze_radar.redact import RedactingFormatter, redact, register_secret
from squeeze_radar.telegram import START_HINT, Notifier, check_connection

FAKE = "1234567890:AAFakeTokenForTestsOnly_abcdefghijklmno"


def test_redact_url_and_bare_token():
    url = f"https://api.telegram.org/bot{FAKE}/sendMessage"
    assert FAKE not in redact(url) and "bot<redacted>/sendMessage" in redact(url)
    assert FAKE not in redact(f"token={FAKE} oops")
    register_secret("short-odd-secret-xyz")
    assert "short-odd-secret-xyz" not in redact("value short-odd-secret-xyz")


def test_formatter_masks_message_args_and_traceback():
    fmt = RedactingFormatter("%(message)s")
    try:
        raise requests.ConnectionError(f"Max retries exceeded with url: /bot{FAKE}/getMe")
    except requests.ConnectionError:
        rec = logging.getLogger("t").makeRecord("t", logging.ERROR, __file__, 1, "failed %s", (f"bot{FAKE}",),
                                               exc_info=__import__("sys").exc_info())
    out = fmt.format(rec)
    assert FAKE not in out and "redacted" in out


class S:
    def __init__(self, get_resp=None, post_resp=None, exc=None):
        self.get_resp, self.post_resp, self.exc = get_resp, post_resp, exc

    def get(self, url, timeout):
        if self.exc:
            raise self.exc
        return self.get_resp

    def post(self, url, json=None, timeout=None):
        if self.exc:
            raise self.exc
        return self.post_resp


class R:
    def __init__(self, code, data):
        self.status_code, self._d, self.text = code, data, str(data)

    def json(self):
        return self._d


ME = R(200, {"ok": True, "result": {"username": "my_radar_bot"}})


def test_check_connection_success_shows_username():
    ok, msg = check_connection(FAKE, "42", "hi", S(ME, R(200, {"ok": True, "result": {"message_id": 7}})))
    assert ok and "@my_radar_bot" in msg and "message_id 7" in msg


def test_chat_not_found_and_403_tell_user_to_press_start():
    ok, msg = check_connection(FAKE, "42", "hi", S(ME, R(400, {"ok": False, "description": "Bad Request: chat not found"})))
    assert not ok and START_HINT in msg
    ok, msg = check_connection(FAKE, "42", "hi", S(ME, R(403, {"ok": False, "description": "Forbidden: bot was blocked by the user"})))
    assert not ok and START_HINT in msg


def test_network_error_does_not_leak_token():
    ok, msg = check_connection(FAKE, "42", "hi", S(exc=requests.ConnectionError(
        f"HTTPSConnectionPool(host='api.telegram.org'): Max retries exceeded with url: /bot{FAKE}/getMe")))
    assert not ok and FAKE not in msg


def test_notifier_stored_error_is_masked():
    db = DB(":memory:")

    class Boom:
        def post(self, url, json, timeout):
            raise requests.ConnectionError(f"failed url: {url}")
    n = Notifier(db, FAKE, "42", dry_run=False, max_retries=0, min_interval=0, timeout=1, session=Boom(),
                 sleep=lambda s: None)
    n.send("x")
    assert FAKE not in db.one("SELECT last_error FROM outbox")["last_error"]
    assert all(FAKE not in r["message"] for r in db.all("SELECT message FROM events"))
