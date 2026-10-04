#!/usr/bin/env python3
"""squeeze-radar: READ-ONLY crypto short-squeeze scanner.

It never places trades, never uses exchange API keys and never touches an
account. It reads public data, scores setups, sends Telegram alerts and logs
everything for later measurement.

Usage:
  python main.py --once [--dry-run]           run every job once and exit
  python main.py --loop [--dry-run]           run continuously on the schedule in config.yaml
  python main.py --once --job collect         run only some jobs (universe, announcements,
                                              collect, hourly_summary, outcomes, heartbeat)
  python main.py --test-telegram              send one test message to Telegram and exit
"""
from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from squeeze_radar.config import ConfigError, load_config  # noqa: E402
from squeeze_radar.lock import AlreadyRunning, InstanceLock  # noqa: E402
from squeeze_radar.logging_setup import setup_logging  # noqa: E402

JOBS = ["universe", "announcements", "collect", "hourly_summary", "outcomes", "heartbeat"]


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description="Read-only short-squeeze scanner (Bybit perpetuals).")
    mode = p.add_mutually_exclusive_group(required=True)
    mode.add_argument("--once", action="store_true", help="run all jobs once, then exit")
    mode.add_argument("--loop", action="store_true", help="run continuously")
    mode.add_argument("--test-telegram", action="store_true", help="send one test message and exit")
    p.add_argument("--dry-run", action="store_true", help="print alerts to the console instead of Telegram")
    p.add_argument("--job", action="append", choices=JOBS, help="with --once: run only this job (repeatable)")
    p.add_argument("--config", default=str(HERE / "config.yaml"))
    p.add_argument("--env", default=None, help="path to .env (default: next to config.yaml)")
    args = p.parse_args(argv)

    try:
        # In dry-run, Telegram credentials are optional (nothing is sent).
        cfg = load_config(args.config, args.env, require_telegram=not args.dry_run)
    except ConfigError as e:
        print(f"CONFIG ERROR:\n{e}", file=sys.stderr)
        return 2

    setup_logging(cfg.path(cfg.paths.log_dir), cfg.logging.level, cfg.logging.max_bytes, cfg.logging.backup_count)
    log = logging.getLogger("main")

    try:
        lock = InstanceLock(cfg.path(cfg.paths.lock_file))
        lock.acquire()
    except AlreadyRunning as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 3

    from squeeze_radar.app import App
    app = App(cfg, dry_run=args.dry_run)
    try:
        if args.test_telegram:
            from squeeze_radar.timeutil import iso, now_ms
            app.notifier.send(f"✅ <b>squeeze-radar test message</b>\nTelegram is configured correctly. "
                              f"Sent {iso(now_ms())}.\nThis bot is read-only: it never trades.")
            pending = app.db.one("SELECT COUNT(*) AS n FROM outbox WHERE sent_ms IS NULL")["n"]
            if pending:
                print("Telegram test FAILED: message is still in the outbox. See logs/errors.log.", file=sys.stderr)
                return 1
            print("Telegram test message sent.")
            return 0
        if args.once:
            log.info("single run (%s)", "dry-run" if args.dry_run else "live")
            app.run_once(args.job)
        else:
            log.info("loop mode (%s)", "dry-run" if args.dry_run else "live")
            app.run_loop()
        return 0
    finally:
        app.close()
        lock.release()


if __name__ == "__main__":
    sys.exit(main())
