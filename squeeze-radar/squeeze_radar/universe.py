"""Universe refresh (hourly): all Bybit USDT linear perpetuals that are Trading."""
from __future__ import annotations

import json
import logging

from . import watchlist as wl
from .alerts import name, record_alert
from .db import DB, dumps
from .health import EMPTY, ERROR, OK
from .http import BlockedError, FetchError, FormatError
from .telegram import esc
from .timeutil import DAY_MS, iso, now_ms, short

log = logging.getLogger(__name__)


def eligible_instrument(i: dict, u) -> bool:
    return (i["quote_coin"] == u.quote_coin and i["status"] == u.status
            and i["contract_type"] == u.contract_type
            and (i.get("symbol_type") or "") not in set(u.exclude_symbol_types))


class UniverseJob:
    def __init__(self, db: DB, client, notifier, health, cfg, dry_run: bool):
        self.db, self.client, self.notifier, self.health, self.cfg = db, client, notifier, health, cfg
        self.dry_run = dry_run

    def run(self) -> dict:
        u = self.cfg.universe
        t = now_ms()
        try:
            instruments = self.client.instruments("linear")
            tickers = self.client.tickers("linear")
        except BlockedError as e:
            self.health.report("bybit_universe", ERROR, f"{e} (403 = IP rate-limit ban for ~10 min, or a region-blocked IP)")
            raise
        except (FetchError, FormatError) as e:
            self.health.report("bybit_universe", ERROR, str(e))
            raise
        if not instruments or not tickers:
            self.health.report("bybit_universe", EMPTY, f"instruments={len(instruments)} tickers={len(tickers)}")
            return {"status": "empty"}

        keep = [i for i in instruments if eligible_instrument(i, u)]
        prev_active = {r["symbol"] for r in self.db.all("SELECT symbol FROM instruments WHERE active=1")}
        # Guard: a partial response must not be mistaken for mass delistings.
        if prev_active and len(keep) < 0.5 * len(prev_active):
            msg = f"only {len(keep)} eligible instruments vs {len(prev_active)} before; ignoring this refresh"
            self.health.report("bybit_universe", ERROR, msg)
            return {"status": "suspicious"}

        risk_tags = set(u.bybit_risk_tags)
        first_run = not prev_active
        messages: list[str] = []
        new_syms, removed_syms = [], []
        with self.db.tx():
            seen = set()
            for i in keep:
                sym = i["symbol"]
                seen.add(sym)
                old = self.db.one("SELECT * FROM instruments WHERE symbol=?", (sym,))
                tk = tickers.get(sym, {})
                launch = i["launch_time_ms"]
                too_new = launch is None or (t - launch) < u.min_history_days * DAY_MS
                fi_min = i["funding_interval_min"]
                fi_h = tk.get("funding_interval_hour") or (fi_min / 60 if fi_min else None)
                self.db.upsert("instruments", {
                    "symbol": sym, "base_coin": i["base_coin"], "quote_coin": i["quote_coin"],
                    "contract_type": i["contract_type"], "status": i["status"], "symbol_type": i["symbol_type"],
                    "launch_time_ms": launch, "launch_time_iso": iso(launch),
                    "funding_interval_min": fi_min, "funding_interval_hour": fi_h,
                    "delivery_time_ms": i["delivery_time_ms"], "delivery_time_iso": iso(i["delivery_time_ms"]),
                    "tags_json": dumps(i["tags"]),
                    "first_seen_ms": old["first_seen_ms"] if old else t, "last_seen_ms": t,
                    "active": 1, "removed_ms": None, "removed_iso": None, "too_new": int(too_new),
                    "turnover_24h": tk.get("turnover_24h"), "updated_ms": t, "updated_iso": iso(t)}, ["symbol"])
                if not old or not old["active"]:
                    new_syms.append(sym)

                # Scheduled perpetual delisting (deliveryTime is the delisting time for perps).
                old_dt = old["delivery_time_ms"] if old else None
                if i["delivery_time_ms"] and i["delivery_time_ms"] != old_dt:
                    self._delisting_scheduled(sym, i["delivery_time_ms"], t, messages)

                # Bybit risk tags (e.g. ST) behave like a Monitoring Tag.
                old_tags = set(json.loads(old["tags_json"])) if old and old["tags_json"] else set()
                gained = (set(i["tags"]) & risk_tags) - old_tags
                lost = (old_tags & risk_tags) - set(i["tags"])
                for tag in gained:
                    wid, created = wl.add_tag(self.db, symbol=sym, token=name(sym), source="bybit",
                                              tag_type=f"Bybit '{tag}' risk tag", url=f"https://www.bybit.com/trade/usdt/{sym}",
                                              tagged_ms=t, days=self.cfg.announcements.watchlist_days, now=t)
                    if created:
                        note = " (already tagged at first scan; real tag date unknown)" if first_run else ""
                        messages.append(f"🏷️ <b>Bybit risk tag</b> '{esc(tag)}' on <b>{esc(sym)}</b>{note}. Added to watchlist (Stage 1 WATCH).")
                        record_alert(self.db, kind="new_tag", symbol=sym, t=t, stage="WATCH", tagged=True,
                                     price=tk.get("last_price"), message=f"bybit tag {tag}",
                                     dedupe_key=f"tag:bybit-instrument:{tag}:{sym}:{t // DAY_MS}", dry_run=self.dry_run)
                for tag in lost:
                    if not first_run:
                        wid = wl.mark_tag_removed(self.db, symbol=sym, url="instrument tags", now=t,
                                                  stop_tracking=self.cfg.announcements.stop_tracking_on_tag_removal)
                        messages.append(f"🟢 <b>Bybit risk tag REMOVED</b> '{esc(tag)}' from <b>{esc(sym)}</b>"
                                        + (" (was on watchlist)" if wid else ""))

            # Symbols that disappeared: delisted or no longer Trading.
            for sym in prev_active - seen:
                removed_syms.append(sym)
                self.db.execute("UPDATE instruments SET active=0, removed_ms=?, removed_iso=? WHERE symbol=?",
                                (t, iso(t), sym))
                row = wl.active_entry(self.db, sym)
                if row:
                    wl.end_entry(self.db, row["id"], sym, row["stage"], "symbol removed from Bybit (delisted or not Trading)", t,
                                 to_stage="DELISTED")
                    messages.append(f"🚨 <b>URGENT</b>: watchlist symbol <b>{esc(sym)}</b> is no longer a Trading "
                                    f"USDT perpetual on Bybit (delisted or suspended). Tracking ended.")
            for m in messages:
                self.notifier.queue(m)
        self.notifier.flush()
        self.health.report("bybit_universe", OK)
        log.info("universe: %d eligible (%d new, %d removed)", len(keep), len(new_syms), len(removed_syms))
        return {"status": "ok", "eligible": len(keep), "new": len(new_syms), "removed": len(removed_syms)}

    def _delisting_scheduled(self, sym: str, when_ms: int, t: int, messages: list[str]) -> None:
        row = wl.active_entry(self.db, sym)
        log.warning("Bybit perpetual %s has a delisting time %s", sym, iso(when_ms))
        if not row:
            return
        self.db.execute("UPDATE watchlist SET delisting_ms=? WHERE id=?", (when_ms, row["id"]))
        key = f"delist:instrument:{sym}:{when_ms}"
        if record_alert(self.db, kind="delisting", symbol=sym, t=t, stage=row["stage"], tagged=True,
                        message="perpetual delisting scheduled", dedupe_key=key, dry_run=self.dry_run):
            messages.append(f"🚨 <b>URGENT DELISTING</b>: Bybit perpetual <b>{esc(sym)}</b> (on watchlist) "
                            f"is scheduled to delist at <b>{esc(short(when_ms))}</b>.")
