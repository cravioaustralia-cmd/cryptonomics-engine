# squeeze-radar

A **read-only** crypto scanner for short-squeeze setups on Bybit USDT perpetuals.

- It **never** places trades, **never** uses exchange API keys and **never** touches an account.
- It reads public market data and public announcements, scores setups, sends Telegram alerts,
  and logs everything to SQLite so you can measure whether the strategy works **before** trading it.

## The strategy it watches

1. A token gets a Binance **Monitoring Tag** (possible future delisting) or a Bybit risk/delisting warning.
2. Traders sell and open shorts, expecting it to die.
3. Shorts get crowded: funding turns negative, open interest rises, but price stops falling and holds
   a floor. Volume rises while price stays flat (absorption).
4. Trapped shorts get squeezed and price spikes (the "last dance"). This can take days or up to a month,
   and spikes often reverse fast.

The same pattern (volume up, coin-OI up, price flat, negative funding) is also scanned on **all** pairs.

---

## 1. Quick start on your laptop

Requires Python 3.10 or newer (built and tested on 3.11).

```bash
git clone https://github.com/cravioaustralia-cmd/cryptonomics-engine.git
cd cryptonomics-engine/squeeze-radar
python3.11 -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                 # Windows: copy .env.example .env
```

### Telegram setup

1. In Telegram, open **@BotFather**, send `/newbot`, follow the steps and copy the **token**.
2. Send any message to your new bot.
3. Open `https://api.telegram.org/bot<TOKEN>/getUpdates` in a browser and copy `"chat":{"id": ...}`.
4. Put both into `.env`:

```
TELEGRAM_BOT_TOKEN=123456789:ABC...
TELEGRAM_CHAT_ID=123456789
```

### First run: verify every endpoint live (do this first)

```bash
python scripts/verify_endpoints.py      # live check of every endpoint, field and unit used
python -m pytest -q                     # unit + end-to-end tests (offline)
python main.py --test-telegram          # sends one real test message
python main.py --once --dry-run         # a full real scan, alerts printed to the console
```

`verify_endpoints.py` must show **0 FAIL** before you rely on the scanner. It checks, for example, that
open interest is in coin units, turnover is in USDT, the first kline row is the candle in progress,
and the Binance announcement JSON still has the expected shape.

### Commands

| Command | What it does |
|---|---|
| `python main.py --once` | Run every job once (universe, announcements, scan, hourly summary, outcomes) and exit |
| `python main.py --loop` | Run continuously on the schedule in `config.yaml` |
| `--dry-run` | Print alerts to the console instead of Telegram (no `.env` needed) |
| `python main.py --once --job collect` | Run only selected jobs (`universe`, `announcements`, `collect`, `hourly_summary`, `outcomes`, `heartbeat`) |
| `python main.py --test-telegram` | Send one test message |
| `python report.py [--csv reports/] [--kind score]` | Outcome report in the terminal, optionally CSV |

---

## 2. How it works

| Job | Default interval | What it does |
|---|---|---|
| universe | 60 min | All Bybit `linear` instruments (cursor pagination). Keeps USDT, `Trading`, `LinearPerpetual`. Stores funding interval and launch time. Marks symbols younger than 7 days "too new". Detects new and removed symbols, scheduled perpetual delistings and Bybit risk tags such as `ST`. |
| announcements | 10 min | Binance Monitoring Tag additions and removals, plus Bybit delisting and risk notices. De-duplicated by ID and URL. |
| collect | 15 min | Market data for every liquid symbol and every tagged one, then scoring, stage updates and instant alerts. |
| hourly_summary | 60 min | Top 10 scored pairs, one line each. |
| outcomes | 30 min | Fills in what happened after each alert, using 5-minute candles. |
| heartbeat | daily, 08:00 UTC | Says it is alive: symbols scanned, alerts sent, errors in the last 24h. |

Jobs run one after another in a single process, so they never overlap. A lock file stops a second
instance from starting. Every job's last completed time slot is stored in SQLite. A restart therefore
never repeats an alert or a summary, and missed slots are caught up once, not many times.

### Data and units (Bybit V5 public endpoints)

| Metric | Source and calculation |
|---|---|
| Price change 4h / 24h | Closed 1h candles: last close against the close 4 or 24 candles earlier. |
| Volume ratio | Last 24h **turnover in USDT** divided by the average daily turnover of the previous 7 **full** days. The current 24h window is excluded from the baseline. |
| Coin-OI change 4h / 24h | `/v5/market/open-interest` at 1h, in **coin units**, so price moves do not distort it. OI in USD is coin OI times price, for display only. |
| Funding | Current rate, the average of the last 3 settlements, and its own 7-day average. All are **normalized to 8h**: `rate × 8 / intervalHours`. The interval of each historical settlement is inferred from the gap between settlements, so a coin that switched from 8h to 1h is handled. |
| Long/short ratio | `buyRatio / sellRatio` at 1h, compared with that symbol's **own** 7-day average. |
| vs BTC | 24h change minus BTCUSDT's 24h change. |
| Range tightness | (24h high − low) / price, from closed candles. |
| Floor | Lowest low of the 3 days of closed 1h candles **before** the candle being tested (see note). |

Only **closed** candles are used. A candle counts as closed when `start + interval <= now`, so the live
candle Bybit returns first is always dropped.

**Floor note:** if the floor included the candle being tested, that candle could never close below it
and invalidation would be impossible. The floor is therefore the lowest low of the 72 closed candles
before the newest closed candle.

### Stages (tagged tokens)

| Stage | Rule |
|---|---|
| Stage 1 WATCH | Just tagged. |
| Stage 2 LOADING | All of: normalized funding < 0, coin-OI rising over 24h, close above the floor, L/S ratio below its own 7-day average. |
| Stage 3 TRIGGER | A closed 1h candle closes above the previous 24h range high, with turnover at least 2x the average hourly turnover of the previous 7 days, while funding is still negative. TRIGGER is held 24h, then re-evaluated. |
| INVALIDATED | A closed 1h candle **closes** below the floor (set `invalidation_price: low` to use wicks). Alerted immediately. Re-arms to WATCH with a fresh floor after 24h. |
| EXPIRED | 30 days after the tag. |
| DELISTED | The symbol disappeared from Bybit. URGENT alert. |

Stages can move backwards, for example LOADING back to WATCH when funding turns positive. Every
transition is stored in `stage_transitions` with its reason. Only candles that closed after the tag
time, and after the previous evaluation, are tested, so no candle is counted twice.

### Score (0-100)

| Component | Default points |
|---|---|
| Volume ratio ≥ 3x (≥ 2x) | 20 (10) |
| Coin-OI ≥ +10% (≥ +5%) in 24h while \|price\| < 3% | 25 (10) |
| Funding(8h) negative, or below its own average | 15, or 7 |
| L/S ratio ≤ 95% of its own 7-day average | 10 |
| Within 8% above the floor, or beating BTC by 2+ points | 10 |
| On the tagged watchlist | 20 |
| Penalty: already up ≥ 15% in 24h (late) | −25 |
| Penalty: 24h turnover < $5M (thin) | −10 |
| Penalty: tagged but younger than 7 days | −15 |

Every component is stored separately in `score_components` with a readable reason. All numbers live in
`config.yaml`.

### Alerts

- **Hourly**, top 10, one line each:
  `MOVR | Score 84 | Vol 4.2x, OI +18%, price +1%, funding(8h) -0.030%, TAGGED Stage 2 | floor 0.79`
- **Instant**: score ≥ 80, any stage change, invalidation, new tag, tag removal, delisting warning
  (URGENT for a perpetual on the watchlist), and data-source failures.
- **Anti-spam**: a symbol re-alerts only if its score moved by 10+ points or its stage changed, and only
  after the cooldown (120 min). Stage changes skip the cooldown by default
  (`stage_change_bypasses_cooldown`), and the same transition is never alerted twice.
- HTML parse mode with escaping. Messages over 4096 characters are split on line boundaries. Retries
  and back-off follow Telegram's `retry_after`, with at most one message per 1.1 s.
- Every message goes through a SQLite **outbox** first. If Telegram is down, nothing is lost: delivery
  is retried on the next loop.

### Failures are never silent

Each data source reports `ok`, `ok_empty` (a legitimate "no results"), `empty` (no data where data is
expected) or `error`. After 3 failures in a row (`health.failures_before_warning`) you get a Telegram
warning that says it is a fetch failure, not "no results". It repeats every 6h while the problem lasts,
and you get a recovery notice when the source works again. Binance 403, 429, captcha pages and changes
to the JSON format are reported explicitly. One bad symbol is logged and skipped. A whole scan only
counts as failed if more than 20% of symbols fail.

### Outcome tracking

- Every alert is stored with all metrics, score components, stage, floor and time.
- **Entry** is the OPEN of the first 5-minute candle that starts at or after the alert. There is no
  look-ahead.
- For 4h, 24h, 72h and 7d: % change at the window end, plus max gain and max drawdown inside the window.
  A window is filled only once it has fully passed.
- **First hit**: did price touch the floor or +10% first? If both happen inside the same 5-minute
  candle, it is marked `ambiguous` and not counted as a hit.
- **Exit**: after +10%, the time at which price gives back 50% of the gain from its highest high, and
  how long that took.
- A symbol delisted during tracking is marked `delisted` with its last price. It stays in the report.
- 5-minute candles are cached in SQLite, and each run only fetches new ones.

`report.py` shows hit rate by score range, results by stage, tagged vs untagged, average days from tag
to trigger, average reversal speed after spikes, and the count of ambiguous and delisted cases.

---

## 3. Oracle Cloud Ubuntu server

> **Region matters.** Bybit's API docs say requests from US IP addresses get HTTP 403. Pick a non-US
> region and run `scripts/verify_endpoints.py` on the server before anything else.

```bash
# 1. System packages (Ubuntu 22.04 ships Python 3.10, Ubuntu 24.04 ships 3.12. Both work.)
sudo apt update && sudo apt install -y python3 python3-venv python3-pip git

# 2. Code
cd ~
git clone https://github.com/cravioaustralia-cmd/cryptonomics-engine.git
cd cryptonomics-engine/squeeze-radar
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env && nano .env        # paste the bot token and chat id
chmod 600 .env

# 3. Verify before running
.venv/bin/python scripts/verify_endpoints.py
.venv/bin/python -m pytest -q
.venv/bin/python main.py --test-telegram
.venv/bin/python main.py --once --dry-run

# 4. Run as a service (Restart=always)
sudo cp deploy/squeeze-radar.service /etc/systemd/system/
#    edit User= and the paths in the file if your user is not "ubuntu"
sudo systemctl daemon-reload
sudo systemctl enable --now squeeze-radar
sudo systemctl status squeeze-radar
```

### Viewing logs

```bash
journalctl -u squeeze-radar -f                 # live service output
tail -f logs/squeeze_radar.log                 # full rotating log (5 MB x 10 files)
tail -f logs/errors.log                        # warnings and errors only
```

### Updating the code from GitHub

```bash
cd ~/cryptonomics-engine
git pull
cd squeeze-radar
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest -q
sudo systemctl restart squeeze-radar
```

The database in `data/` is never touched by `git pull`, and the schema is created with
`CREATE TABLE IF NOT EXISTS`. A restart keeps all state and does not re-send alerts.

---

## 4. Files

```
squeeze-radar/
├── main.py                  CLI: --once / --loop / --dry-run / --test-telegram
├── report.py                outcome report (terminal + CSV)
├── config.yaml              every threshold, weight, interval and limit, with comments
├── .env.example             Telegram token + chat id template
├── requirements.txt         pinned versions
├── deploy/squeeze-radar.service
├── scripts/verify_endpoints.py   live check of every endpoint, field and unit
├── squeeze_radar/
│   ├── app.py               job wiring and scheduler (no overlap, restart-safe)
│   ├── config.py            config.yaml + .env validation
│   ├── bybit.py             read-only Bybit V5 public client and parsers
│   ├── http.py              rate limiter, retries, back-off with jitter, timeouts
│   ├── universe.py          instrument universe, delisting and risk-tag detection
│   ├── collector.py         15-min scan: metrics, scoring, stages, instant alerts
│   ├── metrics.py           pure calculations (funding normalization, volume ratio, OI, floor...)
│   ├── scoring.py           0-100 score with separate components
│   ├── stages.py            stage machine
│   ├── announcements.py     Binance + Bybit announcement fetch and parsing
│   ├── watcher.py           announcement job and watchlist updates
│   ├── symbols.py           token to Bybit symbol mapping (1000PEPEUSDT = PEPE)
│   ├── watchlist.py         tagged watchlist storage
│   ├── alerts.py            message formats, anti-spam, alert records
│   ├── telegram.py          Telegram sender with outbox, splitting, retries
│   ├── health.py            data-source failure tracking and warnings
│   ├── outcomes.py          outcome calculation and job
│   ├── summary.py           hourly top-N and daily heartbeat
│   ├── sentiment.py         disabled hook for a future X/Grok sentiment check
│   ├── lock.py, db.py, timeutil.py, logging_setup.py
└── tests/                   pytest unit tests + end-to-end test against a local fake exchange
```

All timestamps are UTC, stored as Unix milliseconds plus ISO strings.

## 5. Sentiment hook (disabled)

`squeeze_radar/sentiment.py` has `check_sentiment(symbol, token, metrics)`. Implement it, for example
with a call to the Grok API, put the key in `.env`, and set `sentiment.enabled: true`. Its result is
appended to instant alerts for coins scoring at least `sentiment.min_score`. Errors in the hook are
caught, so it can never stop a scan.

## 6. Assumptions and things to verify

These were checked against the official Bybit docs source (github.com/bybit-exchange/docs), but **not**
with a live call from the build environment, which had no network access to the exchanges.
`scripts/verify_endpoints.py` checks each of them live:

- `instruments-info` gives `fundingInterval` in **minutes**, and `tickers` gives `fundingIntervalHour`.
- `deliveryTime` on a perpetual is `"0"` unless a delisting is scheduled.
- Instrument `tags` (e.g. `ST`) mark Bybit risk contracts. Which tags count is configurable.
- Binance announcement JSON: `/bapi/composite/v1/public/cms/article/catalog/list/query` returns
  `data.articles[]` with `id`, `code`, `title` and `releaseDate`. This endpoint is undocumented and can
  change, and the scanner warns if it does. Catalog 161 ("Delisting") is assumed to carry the Monitoring
  Tag notices, and catalog 49 is scanned too.
- Token extraction from announcement titles is heuristic. Tokens that cannot be matched confidently are
  sent to you as raw text, never guessed.
- Delisting dates in Bybit announcement text are parsed best-effort. The structured `deliveryTime` from
  `instruments-info` is also used.
- 24h turnover in USDT is treated as USD.
