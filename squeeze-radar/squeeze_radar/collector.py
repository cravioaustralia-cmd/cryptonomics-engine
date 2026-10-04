"""Collect market data, score every pair, update tagged stages and send instant alerts."""
from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

from . import watchlist as wl
from .alerts import (anti_spam, bybit_link, detail_block, fmt_price, get_alert_state, name, record_alert,
                     set_alert_state, summary_line)
from .bybit import ApiError
from .db import DB, dumps
from .health import EMPTY, ERROR, OK
from .http import BlockedError, FetchError, FormatError
from .metrics import closed_candles, compute_symbol_metrics, price_change
from .scoring import score_symbol
from .sentiment import sentiment_line
from .stages import EXPIRED, INVALIDATED, STAGE_NUM, WatchState, evaluate
from .telegram import esc
from .timeutil import HOUR_MS, iso, now_ms, short

log = logging.getLogger(__name__)

STAGE_ICON = {"WATCH": "👀", "LOADING": "⏳", "TRIGGER": "🚀", "INVALIDATED": "❌", "EXPIRED": "⌛"}


class CollectJob:
    def __init__(self, db: DB, client, notifier, health, cfg, dry_run: bool):
        self.db, self.client, self.notifier, self.health, self.cfg = db, client, notifier, health, cfg
        self.dry_run = dry_run

    # ------------------------------------------------------------- fetching --
    def _fetch_symbol(self, sym: str, now: int) -> dict:
        c = self.cfg.collection
        kl = self.client.klines(sym, "60", limit=c.kline_limit)
        closed = closed_candles(kl, HOUR_MS, now)
        if not closed:
            raise FormatError(f"{sym}: no closed 1h candles returned")
        oi = self.client.open_interest(sym, c.oi_interval, c.oi_limit)
        fh = self.client.funding_history(sym, c.funding_history_limit)
        ls = self.client.account_ratio(sym, c.ls_period, min(500, c.ls_avg_days * 24 + 2))
        # Open interest and long/short points are snapshots; keep only past ones.
        oi = [p for p in oi if p[0] <= now]
        return {"closed": closed, "oi": oi, "funding": fh, "ls": ls}

    # ------------------------------------------------------------------ run --
    def run(self) -> dict:
        cfg, u, col = self.cfg, self.cfg.universe, self.cfg.collection
        run_ms = now_ms()
        try:
            tickers = self.client.tickers("linear")
        except (FetchError, FormatError) as e:
            self.health.report("bybit_market", ERROR, f"tickers: {e}")
            raise
        if not tickers:
            self.health.report("bybit_market", EMPTY, "tickers returned no symbols")
            return {"status": "empty"}

        instruments = {r["symbol"]: r for r in self.db.all("SELECT * FROM instruments WHERE active=1")}
        if not instruments:
            self.health.report("bybit_market", EMPTY, "no instruments in database (universe refresh failed?)")
            return {"status": "no-universe"}
        watch = {r["symbol"]: r for r in wl.active_entries(self.db)}

        # Decide what to fetch: liquid + old enough, plus every tagged symbol.
        todo, skipped_new, skipped_thin = [], 0, 0
        for sym, ins in instruments.items():
            tk = tickers.get(sym)
            tagged = sym in watch
            if tk is None:
                continue
            if ins["too_new"] and not tagged:
                skipped_new += 1
                continue
            if (tk.get("turnover_24h") or 0) < u.min_turnover_24h_usd and not tagged:
                skipped_thin += 1
                continue
            todo.append(sym)
        bench = u.benchmark_symbol
        if bench not in todo and bench in tickers:
            todo.append(bench)

        # Benchmark first (BTC 24h change for relative performance).
        btc_chg = None
        try:
            bk = closed_candles(self.client.klines(bench, "60", limit=30), HOUR_MS, run_ms)
            btc_chg = price_change(bk, 24)
        except (FetchError, FormatError) as e:
            log.warning("benchmark %s failed: %s", bench, e)

        results: dict[str, dict] = {}
        failures: dict[str, str] = {}
        with ThreadPoolExecutor(max_workers=cfg.bybit.worker_threads) as ex:
            futs = {ex.submit(self._fetch_symbol, s, run_ms): s for s in todo}
            for f in as_completed(futs):
                s = futs[f]
                try:
                    results[s] = f.result()
                except BlockedError as e:
                    failures[s] = f"blocked: {e}"
                except (ApiError, FetchError, FormatError) as e:
                    failures[s] = str(e)
                except Exception as e:  # one bad symbol never crashes the run
                    failures[s] = f"unexpected {type(e).__name__}: {e}"
                    log.exception("unexpected error fetching %s", s)
        for s, err in sorted(failures.items()):
            log.warning("symbol %s skipped: %s", s, err)

        # Health: whole-run failure if too many symbols failed.
        ratio = len(failures) / max(1, len(todo))
        if todo and ratio > col.max_symbol_failure_ratio:
            sample = "; ".join(f"{k}: {v}" for k, v in list(failures.items())[:3])
            self.health.report("bybit_market", ERROR, f"{len(failures)}/{len(todo)} symbols failed. e.g. {sample}")
        elif todo and not results:
            self.health.report("bybit_market", EMPTY, "no symbol returned data")
        else:
            self.health.report("bybit_market", OK)

        scored = 0
        for sym in sorted(results):
            try:
                self._process(sym, results[sym], tickers[sym], instruments[sym], watch.get(sym), btc_chg, run_ms)
                scored += 1
            except Exception:
                log.exception("processing %s failed; continuing", sym)
                self.db.log_event("ERROR", "collect", f"processing {sym} failed")

        # Tagged symbols that could not be fetched still need expiry handling.
        for sym, row in watch.items():
            if sym not in results and run_ms >= row["expires_ms"]:
                with self.db.tx():
                    wl.end_entry(self.db, row["id"], sym, row["stage"], "tracking window ended (no data)", run_ms)
        self.notifier.flush()
        self.db.set_meta("last_collect_run_ms", str(run_ms))
        self.db.set_meta("last_collect_stats", dumps({"run_ms": run_ms, "fetched": len(todo), "scored": scored,
                                                      "failed": len(failures), "too_new": skipped_new,
                                                      "thin": skipped_thin}))
        log.info("collect: fetched %d, scored %d, failed %d, skipped too-new %d, thin %d",
                 len(todo), scored, len(failures), skipped_new, skipped_thin)
        return {"status": "ok", "fetched": len(todo), "scored": scored, "failed": len(failures)}

    # ------------------------------------------------------------- per symbol --
    def _process(self, sym: str, data: dict, tk: dict, ins, wrow, btc_chg, run_ms: int) -> None:
        cfg = self.cfg
        m = compute_symbol_metrics(now_ms=run_ms, ticker=tk, closed_hourly=data["closed"], oi_points=data["oi"],
                                   funding_hist=data["funding"], ls_points=data["ls"], btc_chg_24h=btc_chg,
                                   col=cfg.collection, stages_cfg=cfg.stages)
        if m["funding_interval_h"] is None and ins["funding_interval_hour"]:
            # Ticker lacked fundingIntervalHour; fall back to the instrument value.
            tk2 = dict(tk, funding_interval_hour=ins["funding_interval_hour"])
            m = compute_symbol_metrics(now_ms=run_ms, ticker=tk2, closed_hourly=data["closed"], oi_points=data["oi"],
                                       funding_hist=data["funding"], ls_points=data["ls"], btc_chg_24h=btc_chg,
                                       col=cfg.collection, stages_cfg=cfg.stages)
        tagged = wrow is not None
        too_new = bool(ins["too_new"])
        sr = score_symbol(m, cfg.scoring, tagged=tagged, too_new=too_new,
                          min_turnover=cfg.universe.min_turnover_24h_usd)
        eligible = (not too_new) and (m["turnover_24h"] or 0) >= cfg.universe.min_turnover_24h_usd
        comps = sr.as_dict()

        with self.db.tx():
            # Stage machine (tagged only)
            transitions, stage = [], None
            if wrow is not None:
                st = WatchState(stage=wrow["stage"], stage_since_ms=wrow["stage_since_ms"] or wrow["tagged_ms"],
                                tagged_ms=wrow["tagged_ms"], expires_ms=wrow["expires_ms"],
                                last_eval_candle_ms=wrow["last_eval_candle_ms"], invalidated_ms=wrow["invalidated_ms"],
                                ever_triggered=wrow["first_trigger_ms"] is not None)
                res = evaluate(st, data["closed"], m, cfg.stages, cfg.collection.floor_days, run_ms)
                s2 = res.state
                stage = s2.stage
                first_trig = wrow["first_trigger_ms"]
                last_trig = wrow["last_trigger_ms"]
                for tr in res.transitions:
                    if tr.to_stage == "TRIGGER":
                        first_trig = first_trig or tr.at_ms
                        last_trig = tr.at_ms
                    tid = self.db.insert("stage_transitions", {
                        "watch_id": wrow["id"], "symbol": sym, "from_stage": tr.from_stage, "to_stage": tr.to_stage,
                        "reason": tr.reason, "candle_ms": tr.candle_ms, "at_ms": tr.at_ms, "at_iso": iso(tr.at_ms)})
                    transitions.append((tid, tr))
                self.db.execute(
                    "UPDATE watchlist SET stage=?, stage_since_ms=?, floor=?, last_eval_candle_ms=?, invalidated_ms=?, "
                    "first_trigger_ms=?, last_trigger_ms=?, active=?, ended_ms=?, ended_reason=? WHERE id=?",
                    (s2.stage, s2.stage_since_ms, res.floor, s2.last_eval_candle_ms, s2.invalidated_ms,
                     first_trig, last_trig, 0 if s2.stage == EXPIRED else 1,
                     run_ms if s2.stage == EXPIRED else None,
                     transitions[-1][1].reason if (s2.stage == EXPIRED and transitions) else None, wrow["id"]))

            # Persist snapshot + score + components
            self.db.upsert("snapshots", {
                "run_ms": run_ms, "run_iso": iso(run_ms), "symbol": sym,
                **{k: m.get(k) for k in ("last_price", "chg_4h_pct", "chg_24h_pct", "volume_ratio", "turnover_24h",
                                         "oi_coin", "oi_usd", "oi_chg_4h_pct", "oi_chg_24h_pct", "funding_interval_h",
                                         "funding_now_8h", "funding_avg_n_8h", "funding_own_avg_8h", "ls_ratio", "ls_avg",
                                         "perf_vs_btc_pct", "range_tightness_pct", "floor", "range_high",
                                         "last_candle_ms", "last_close", "last_turnover_1h", "avg_turnover_1h")},
                "eligible": int(eligible), "too_new": int(too_new), "tagged": int(tagged),
                "metrics_json": dumps(m)}, ["run_ms", "symbol"])
            self.db.upsert("scores", {"run_ms": run_ms, "run_iso": iso(run_ms), "symbol": sym, "score": sr.score,
                                      "raw_total": sr.raw_total, "tagged": int(tagged), "stage": stage},
                           ["run_ms", "symbol"])
            for c in sr.components:
                self.db.upsert("score_components", {"run_ms": run_ms, "symbol": sym, "component": c.name,
                                                    "points": c.points, "detail": c.detail},
                               ["run_ms", "symbol", "component"])

            self._alerts(sym, m, sr, comps, stage, transitions, wrow, eligible or tagged, run_ms)

    # --------------------------------------------------------------- alerts --
    def _alerts(self, sym, m, sr, comps, stage, transitions, wrow, alertable, run_ms) -> None:
        cfg = self.cfg
        a = cfg.alerts
        prev = get_alert_state(self.db, sym)
        sent_any = False
        sent_line = sentiment_line(cfg, sym, name(sym), m, sr.score)

        for tid, tr in transitions:
            urgent = tr.to_stage in (INVALIDATED,)
            if not urgent and not a.stage_change_bypasses_cooldown:
                d = anti_spam(prev, sr.score, tr.to_stage, run_ms, delta=a.rescore_delta,
                              cooldown_minutes=a.cooldown_minutes, stage_bypasses_cooldown=False)
                if not d.send:
                    log.info("stage alert %s suppressed: %s", sym, d.reason)
                    continue
            icon = STAGE_ICON.get(tr.to_stage, "🔔")
            head = "INVALIDATED" if tr.to_stage == INVALIDATED else "Stage change"
            msg = (f"{icon} <b>{head}: {esc(name(sym))}</b> {esc(STAGE_NUM.get(tr.from_stage or '', tr.from_stage or '-'))}"
                   f" → <b>{esc(STAGE_NUM.get(tr.to_stage, tr.to_stage))}</b> ({esc(tr.to_stage)})\n"
                   f"Reason: {esc(tr.reason)}\n"
                   f"Tagged {esc(short(wrow['tagged_ms']))} by {esc(wrow['source'])}: {esc(wrow['tag_type'])}\n"
                   f"{summary_line(sym, sr.score, m, stage)}\n{detail_block(sym, m, comps)}\n"
                   f"Suggested invalidation level (floor): <b>{esc(fmt_price(m.get('floor')))}</b>\n"
                   f"{bybit_link(sym)}{sent_line}")
            if record_alert(self.db, kind="stage", symbol=sym, t=run_ms, score=sr.score, stage=tr.to_stage, tagged=True,
                            floor=m.get("floor"), price=m.get("last_price"), metrics=m, components=comps, message=msg,
                            dedupe_key=f"stage:{wrow['id']}:{tid}", dry_run=self.dry_run):
                self.notifier.queue(msg)
                sent_any = True

        if not sent_any and alertable and sr.score >= a.instant_score_threshold:
            d = anti_spam(prev, sr.score, stage, run_ms, delta=a.rescore_delta, cooldown_minutes=a.cooldown_minutes,
                          stage_bypasses_cooldown=a.stage_change_bypasses_cooldown)
            if d.send:
                msg = (f"🔥 <b>High score {sr.score:.0f}</b> ({esc(d.reason)})\n{summary_line(sym, sr.score, m, stage)}\n"
                       f"{detail_block(sym, m, comps)}\n{bybit_link(sym)}{sent_line}")
                if record_alert(self.db, kind="score", symbol=sym, t=run_ms, score=sr.score, stage=stage,
                                tagged=wrow is not None, floor=m.get("floor"), price=m.get("last_price"), metrics=m,
                                components=comps, message=msg, dedupe_key=f"score:{sym}:{run_ms}", dry_run=self.dry_run):
                    self.notifier.queue(msg)
                    sent_any = True
            else:
                log.debug("score alert %s suppressed: %s", sym, d.reason)

        if sent_any:
            set_alert_state(self.db, sym, sr.score, stage, run_ms)
