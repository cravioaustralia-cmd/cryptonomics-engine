"""Tagged watchlist: one active entry per Bybit symbol."""
from __future__ import annotations

from .db import DB
from .stages import EXPIRED, WATCH
from .timeutil import DAY_MS, iso


def active_entry(db: DB, symbol: str):
    return db.one("SELECT * FROM watchlist WHERE symbol=? AND active=1", (symbol,))


def active_entries(db: DB):
    return db.all("SELECT * FROM watchlist WHERE active=1 ORDER BY tagged_ms")


def add_tag(db: DB, *, symbol: str, token: str, source: str, tag_type: str, url: str,
            tagged_ms: int, days: float, now: int) -> tuple[int, bool]:
    """Add a tagged token. Returns (watch_id, created). A re-tag of a symbol that is
    already tracked extends its window and is noted, but is not a new entry."""
    expires = tagged_ms + int(days * DAY_MS)
    row = active_entry(db, symbol)
    if row:
        note = f"{iso(now)} also tagged by {source} ({tag_type}) {url}"
        db.execute("UPDATE watchlist SET expires_ms=MAX(expires_ms, ?), expires_iso=?, notes=COALESCE(notes || '\n', '') || ? "
                   "WHERE id=?", (expires, iso(max(expires, row["expires_ms"])), note, row["id"]))
        return row["id"], False
    wid = db.insert("watchlist", {
        "symbol": symbol, "token": token, "source": source, "tag_type": tag_type,
        "announcement_url": url, "tagged_ms": tagged_ms, "tagged_iso": iso(tagged_ms),
        "expires_ms": expires, "expires_iso": iso(expires), "stage": WATCH, "stage_since_ms": now,
        "active": 1})
    db.insert("stage_transitions", {"watch_id": wid, "symbol": symbol, "from_stage": None, "to_stage": WATCH,
                                    "reason": f"tagged by {source}: {tag_type}", "at_ms": now, "at_iso": iso(now)})
    return wid, True


def mark_tag_removed(db: DB, *, symbol: str, url: str, now: int, stop_tracking: bool) -> int | None:
    row = active_entry(db, symbol)
    if not row:
        return None
    db.execute("UPDATE watchlist SET tag_removed_ms=?, tag_removed_url=? WHERE id=?", (now, url, row["id"]))
    if stop_tracking:
        end_entry(db, row["id"], symbol, row["stage"], "tag removed", now)
    return row["id"]


def end_entry(db: DB, watch_id: int, symbol: str, from_stage: str, reason: str, now: int,
              to_stage: str = EXPIRED) -> None:
    db.execute("UPDATE watchlist SET active=0, stage=?, stage_since_ms=?, ended_ms=?, ended_reason=? WHERE id=?",
               (to_stage, now, now, reason, watch_id))
    db.insert("stage_transitions", {"watch_id": watch_id, "symbol": symbol, "from_stage": from_stage,
                                    "to_stage": to_stage, "reason": reason, "at_ms": now, "at_iso": iso(now)})
