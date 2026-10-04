"""Announcement watcher (every 10 min): Binance Monitoring Tag + Bybit risk/delisting notices."""
from __future__ import annotations

import logging

from . import watchlist as wl
from .alerts import record_alert
from .announcements import (Announcement, BinanceAnnouncements, classify_bybit, extract_tokens,
                            extract_usdt_symbols, parse_bybit_announcements, parse_delisting_time,
                            split_monitoring_title)
from .db import DB, dumps
from .health import EMPTY, ERROR, OK
from .http import BlockedError, FetchError, FormatError
from .symbols import MatchResult, SymbolMapper
from .telegram import esc
from .timeutil import DAY_MS, iso, now_ms, short

log = logging.getLogger(__name__)


class AnnouncementJob:
    def __init__(self, db: DB, bybit_client, notifier, health, cfg, dry_run: bool, binance=None):
        self.db, self.bybit, self.notifier, self.health, self.cfg = db, bybit_client, notifier, health, cfg
        self.dry_run = dry_run
        a = cfg.announcements
        self.binance = binance or BinanceAnnouncements(a.binance, a.user_agent, a.request_timeout_seconds)

    def _mapper(self) -> SymbolMapper:
        syms = [r["symbol"] for r in self.db.all(
            "SELECT symbol FROM instruments WHERE active=1 AND quote_coin=? AND contract_type=?",
            (self.cfg.universe.quote_coin, self.cfg.universe.contract_type))]
        return SymbolMapper(syms, self.cfg.symbols.multiplier_prefixes, self.cfg.symbols.overrides,
                            self.cfg.announcements.binance.token_prefixes, self.cfg.universe.quote_coin)

    def _seen(self, a: Announcement) -> bool:
        return self.db.one("SELECT 1 FROM announcements WHERE (source=? AND ann_id=?) OR url=?",
                           (a.source, a.ann_id, a.url)) is not None

    def _store(self, a: Announcement, action: str, tokens, matched, unmatched, t: int) -> None:
        self.db.insert("announcements", {
            "source": a.source, "ann_id": a.ann_id, "url": a.url, "title": a.title,
            "published_ms": a.published_ms, "published_iso": iso(a.published_ms), "category": a.category,
            "action": action, "tokens_json": dumps(tokens), "matched_json": dumps(matched),
            "unmatched_json": dumps(unmatched), "seen_ms": t, "seen_iso": iso(t)}, or_clause="OR IGNORE")

    def run(self) -> dict:
        if not self.db.one("SELECT 1 FROM instruments WHERE active=1 LIMIT 1"):
            # Tokens cannot be mapped without the Bybit universe. The universe failure
            # itself is already reported by the bybit_universe health check.
            log.error("announcements skipped: Bybit universe is empty (universe refresh failing?)")
            self.db.log_event("ERROR", "announcements", "skipped: universe empty")
            return {"status": "skipped-no-universe"}
        mapper = self._mapper()
        stats = {}
        if self.cfg.announcements.binance.enabled:
            stats["binance"] = self._run_binance(mapper)
        if self.cfg.announcements.bybit.enabled:
            stats["bybit"] = self._run_bybit(mapper)
        self.notifier.flush()
        return stats

    # ---------------------------------------------------------------- binance --
    def _run_binance(self, mapper: SymbolMapper) -> dict:
        cfg = self.cfg.announcements
        bootstrap = self.db.get_meta("binance_bootstrapped") is None
        articles: list[Announcement] = []
        errors = []
        for cid in cfg.binance.catalog_ids:
            try:
                articles.extend(self.binance.fetch_catalog(cid))
            except BlockedError as e:
                errors.append(f"catalog {cid}: BLOCKED: {e}")
            except FormatError as e:
                errors.append(f"catalog {cid}: FORMAT CHANGED: {e}")
            except FetchError as e:
                errors.append(f"catalog {cid}: {e}")
        if errors:
            self.health.report("binance_announcements", ERROR, " | ".join(errors))
            if not articles:
                return {"status": "error", "errors": errors}
        elif not articles:
            # The catalogs always contain articles; an empty list means something broke.
            self.health.report("binance_announcements", EMPTY, "catalogs returned 0 articles")
            return {"status": "empty"}
        else:
            self.health.report("binance_announcements", OK)

        t = now_ms()
        new = 0
        for a in articles:
            if self._seen(a):
                continue
            new += 1
            try:
                self._process_binance(a, mapper, t, bootstrap)
            except Exception:
                log.exception("processing Binance announcement %s failed", a.url)
                self.db.log_event("ERROR", "binance_announcements", f"processing failed: {a.title}")
        if bootstrap and not errors:
            self.db.set_meta("binance_bootstrapped", iso(t))
        return {"status": "ok", "articles": len(articles), "new": new}

    def _process_binance(self, a: Announcement, mapper: SymbolMapper, t: int, bootstrap: bool) -> None:
        cfg = self.cfg.announcements
        low = a.title.lower()
        if not any(k.lower() in low for k in cfg.binance.title_keywords):
            with self.db.tx():
                self._store(a, "ignored", [], [], [], t)
            return
        pub = a.published_ms
        if pub is None:
            if bootstrap:
                log.warning("Binance article without a publish date during first run, not tracked: %s", a.title)
                with self.db.tx():
                    self._store(a, "skipped-no-date", [], [], [], t)
                return
            pub = t
        if t - pub > cfg.watchlist_days * DAY_MS:
            with self.db.tx():
                self._store(a, "too-old", [], [], [], t)
            return

        added, removed = split_monitoring_title(a.title, cfg.stopwords, cfg.binance.removal_keywords)
        if not added and not removed:
            try:
                body = self.binance.fetch_detail_text(a.raw.get("code", ""))
                toks = extract_tokens(body, cfg.stopwords)
                if any(k in low for k in cfg.binance.removal_keywords):
                    removed = toks
                else:
                    added = toks
            except (FetchError, FormatError) as e:
                log.warning("Binance detail fetch failed for %s: %s", a.url, e)
        self._apply_tags(a, added, removed, mapper, t, pub, source="binance", tag_type="Binance Monitoring Tag")

    def _apply_tags(self, a: Announcement, added, removed, mapper, t, pub, *, source, tag_type,
                    direct_symbols=()) -> None:
        cfg = self.cfg.announcements
        matched, unmatched = [], []
        lines_add, lines_rm = [], []
        # Explicit Bybit symbols (e.g. "1000XUSDT") need no token matching.
        work = [(s, MatchResult(s, s, "matched", "symbol in text")) for s in direct_symbols]
        for tok in added:
            r = mapper.match(tok)
            if r.status == "matched" and r.symbol in direct_symbols:
                continue
            work.append((tok, r))
        added = [tok for tok, _ in work]
        with self.db.tx():
            for tok, r in work:
                if r.status != "matched":
                    unmatched.append({"token": tok, "status": r.status, "candidates": list(r.candidates)})
                    continue
                wid, created = wl.add_tag(self.db, symbol=r.symbol, token=tok, source=source, tag_type=tag_type,
                                          url=a.url, tagged_ms=pub, days=cfg.watchlist_days, now=t)
                matched.append({"token": tok, "symbol": r.symbol, "method": r.method, "action": "add"})
                lines_add.append(f"• {esc(tok)} → <b>{esc(r.symbol)}</b> ({esc(r.method)})"
                                 + ("" if created else " already on watchlist, window extended"))
                last = self.db.one("SELECT last_price FROM snapshots WHERE symbol=? ORDER BY run_ms DESC LIMIT 1",
                                   (r.symbol,))
                record_alert(self.db, kind="new_tag", symbol=r.symbol, t=t, stage="WATCH", tagged=True,
                             price=last["last_price"] if last else None, message=a.title,
                             dedupe_key=f"tag:{a.source}:{a.ann_id}:{r.symbol}", dry_run=self.dry_run)
            for tok in removed:
                r = mapper.match(tok)
                if r.status != "matched":
                    unmatched.append({"token": tok, "status": r.status, "candidates": list(r.candidates), "action": "remove"})
                    continue
                wid = wl.mark_tag_removed(self.db, symbol=r.symbol, url=a.url, now=t,
                                          stop_tracking=cfg.stop_tracking_on_tag_removal)
                matched.append({"token": tok, "symbol": r.symbol, "method": r.method, "action": "remove"})
                lines_rm.append(f"• {esc(tok)} → <b>{esc(r.symbol)}</b>" + (" (was on watchlist)" if wid else ""))
                record_alert(self.db, kind="tag_removed", symbol=r.symbol, t=t, message=a.title,
                             dedupe_key=f"tagrm:{a.source}:{a.ann_id}:{r.symbol}", dry_run=self.dry_run)

            action = "add" if added and not removed else "remove" if removed and not added else "mixed"
            self._store(a, action, {"added": added, "removed": removed}, matched, unmatched, t)

            age = "" if pub >= t - 3600_000 else f" (published {esc(short(pub))})"
            parts = []
            if lines_add:
                parts.append(f"🏷️ <b>NEW {esc(tag_type)}</b>{age}\n" + "\n".join(lines_add)
                             + "\nAdded to the tagged watchlist (Stage 1 WATCH).")
            if lines_rm:
                parts.append(f"🟢 <b>{esc(tag_type)} REMOVED</b>{age}\n" + "\n".join(lines_rm))
            if unmatched:
                parts.append("❓ <b>Could not match confidently</b> (not guessing):\n" + "\n".join(
                    f"• {esc(u['token'])}: {esc(u['status'])}"
                    + (f" candidates {esc(', '.join(u['candidates']))}" if u["candidates"] else " (no Bybit USDT perp found)")
                    for u in unmatched)
                    + "\nIf a token was renamed, add it under symbols.overrides in config.yaml.")
            if not added and not removed:
                parts.append("❓ <b>Tag announcement with no token found</b>. Please check it manually.")
            if parts:
                self.notifier.queue("\n\n".join(parts) + f"\n\nTitle: {esc(a.title)}\n{esc(a.url)}")

    # ------------------------------------------------------------------ bybit --
    def _run_bybit(self, mapper: SymbolMapper) -> dict:
        cfg = self.cfg.announcements
        rows, errors = [], []
        for typ in list(cfg.bybit.types) + [None]:
            try:
                rows.extend(self.bybit.announcements(cfg.bybit.locale, typ, cfg.bybit.page_size))
            except (FetchError, FormatError) as e:
                errors.append(f"type {typ or 'all'}: {e}")
        if errors:
            self.health.report("bybit_announcements", ERROR, " | ".join(errors))
            if not rows:
                return {"status": "error", "errors": errors}
        elif not rows:
            self.health.report("bybit_announcements", EMPTY, "0 announcements returned")
            return {"status": "empty"}
        else:
            self.health.report("bybit_announcements", OK)

        bootstrap = self.db.get_meta("bybit_ann_bootstrapped") is None
        t = now_ms()
        anns = {a.ann_id: a for a in parse_bybit_announcements(rows)}
        new = 0
        for a in anns.values():
            if self._seen(a):
                continue
            new += 1
            try:
                self._process_bybit(a, mapper, t, bootstrap)
            except Exception:
                log.exception("processing Bybit announcement %s failed", a.url)
                self.db.log_event("ERROR", "bybit_announcements", f"processing failed: {a.title}")
        if bootstrap and not errors:
            self.db.set_meta("bybit_ann_bootstrapped", iso(t))
        return {"status": "ok", "rows": len(rows), "new": new}

    def _process_bybit(self, a: Announcement, mapper: SymbolMapper, t: int, bootstrap: bool) -> None:
        cfg = self.cfg.announcements
        kind = classify_bybit(a, cfg.bybit.risk_keywords)
        pub = a.published_ms or t
        if kind is None or t - pub > cfg.watchlist_days * DAY_MS:
            with self.db.tx():
                self._store(a, "ignored" if kind is None else "too-old", [], [], [], t)
            return
        text = f"{a.title} {a.description}"
        all_syms = extract_usdt_symbols(text)
        syms = [s for s in all_syms if s in mapper.symbols]
        if len(syms) < len(all_syms):
            log.info("Bybit announcement names symbols not in the tracked universe: %s (%s)",
                     sorted(set(all_syms) - set(syms)), a.title)
        toks = [x for x in extract_tokens(a.title, cfg.stopwords) if not x.endswith("USDT")]
        if not toks and not all_syms:
            toks = [x for x in extract_tokens(a.description, cfg.stopwords) if not x.endswith("USDT")]
        is_perp = any(w in text.lower() for w in ("perpetual", "contract")) or bool(all_syms)

        if kind == "delisting" and is_perp:
            when = parse_delisting_time(text)
            targets = set(syms)
            for tok in toks:
                r = mapper.match(tok)
                if r.status == "matched":
                    targets.add(r.symbol)
            with self.db.tx():
                for sym in sorted(targets):
                    row = wl.active_entry(self.db, sym)
                    if not row:
                        continue
                    if when:
                        self.db.execute("UPDATE watchlist SET delisting_ms=? WHERE id=?", (when, row["id"]))
                    if record_alert(self.db, kind="delisting", symbol=sym, t=t, stage=row["stage"], tagged=True,
                                    message=a.title, dedupe_key=f"delist:{a.source}:{a.ann_id}:{sym}", dry_run=self.dry_run):
                        self.notifier.queue(
                            f"🚨 <b>URGENT: Bybit is delisting a watchlist perpetual</b>\n<b>{esc(sym)}</b> "
                            f"(stage {esc(row['stage'])})\nDelisting time: <b>{esc(short(when) if when else 'see announcement (could not parse)')}</b>\n"
                            f"{esc(a.title)}\n{esc(a.url)}")
                self._store(a, "delisting", {"symbols": syms, "tokens": toks}, sorted(targets), [], t)
        # Any Bybit delisting/risk notice is a "tag" for the strategy: track the coins.
        if not toks and not syms:
            with self.db.tx():
                self._store(a, kind + "-no-tracked-symbol", {"symbols": all_syms}, [], [], t)
            return
        self._apply_tags(a, toks, [], mapper, t, pub, source="bybit", direct_symbols=syms,
                         tag_type="Bybit delisting notice" if kind == "delisting" else "Bybit risk warning")
