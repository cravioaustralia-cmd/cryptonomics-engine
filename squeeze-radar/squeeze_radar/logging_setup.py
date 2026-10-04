"""Rotating file logs plus console output. Log timestamps are UTC."""
from __future__ import annotations

import logging
import sys
import time
from logging.handlers import RotatingFileHandler
from pathlib import Path


class _UTCFormatter(logging.Formatter):
    converter = time.gmtime


def setup_logging(log_dir: Path, level: str, max_bytes: int, backup_count: int) -> None:
    log_dir.mkdir(parents=True, exist_ok=True)
    fmt = _UTCFormatter("%(asctime)sZ %(levelname)-7s %(name)s: %(message)s", "%Y-%m-%dT%H:%M:%S")
    root = logging.getLogger()
    root.setLevel(level)
    for h in list(root.handlers):
        root.removeHandler(h)
    fh = RotatingFileHandler(log_dir / "squeeze_radar.log", maxBytes=max_bytes,
                             backupCount=backup_count, encoding="utf-8")
    fh.setFormatter(fmt)
    root.addHandler(fh)
    eh = RotatingFileHandler(log_dir / "errors.log", maxBytes=max_bytes,
                             backupCount=backup_count, encoding="utf-8")
    eh.setLevel(logging.WARNING)
    eh.setFormatter(fmt)
    root.addHandler(eh)
    ch = logging.StreamHandler(sys.stdout)
    ch.setFormatter(fmt)
    root.addHandler(ch)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
