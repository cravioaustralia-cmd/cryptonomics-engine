"""Load and validate config.yaml and .env.

Any missing or invalid value raises ConfigError with a readable message,
and main.py exits before doing any work.
"""
from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Literal

import yaml
from dotenv import dotenv_values
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator, model_validator


class ConfigError(Exception):
    pass


class _Strict(BaseModel):
    # Unknown keys are errors, so a typo in config.yaml is caught at startup.
    model_config = ConfigDict(extra="forbid")


class Paths(_Strict):
    database: str
    lock_file: str
    log_dir: str


class Logging(_Strict):
    level: Literal["DEBUG", "INFO", "WARNING", "ERROR"]
    max_bytes: int = Field(gt=10_000)
    backup_count: int = Field(ge=1)


class Schedule(_Strict):
    universe_minutes: int = Field(ge=5)
    collect_minutes: int = Field(ge=5)
    collect_offset_seconds: int = Field(ge=0, le=600)
    announcements_minutes: int = Field(ge=1)
    hourly_summary_minutes: int = Field(ge=15)
    hourly_summary_offset_seconds: int = Field(ge=0, le=3000)
    outcomes_minutes: int = Field(ge=5)
    heartbeat_utc: str
    loop_tick_seconds: int = Field(ge=1, le=300)

    @field_validator("heartbeat_utc")
    @classmethod
    def _hhmm(cls, v: str) -> str:
        if not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", v):
            raise ValueError("must be HH:MM in 24h UTC, e.g. '08:00'")
        return v


class Bybit(_Strict):
    base_url: str
    max_requests_per_second: float = Field(gt=0, le=100)
    request_timeout_seconds: float = Field(gt=0, le=120)
    max_retries: int = Field(ge=0, le=10)
    backoff_base_seconds: float = Field(gt=0)
    backoff_max_seconds: float = Field(gt=0)
    worker_threads: int = Field(ge=1, le=32)


class Universe(_Strict):
    quote_coin: str
    contract_type: str
    status: str
    min_history_days: float = Field(ge=0)
    min_turnover_24h_usd: float = Field(ge=0)
    exclude_symbol_types: list[str]
    bybit_risk_tags: list[str]
    benchmark_symbol: str


class Collection(_Strict):
    kline_interval_minutes: Literal[60]
    kline_limit: int = Field(ge=50, le=1000)
    volume_ratio_baseline_days: int = Field(ge=1, le=30)
    range_hours: int = Field(ge=1, le=168)
    floor_days: int = Field(ge=1, le=30)
    oi_interval: Literal["1h"]
    oi_limit: int = Field(ge=26, le=200)
    funding_history_limit: int = Field(ge=3, le=200)
    funding_avg_settlements: int = Field(ge=1, le=50)
    funding_own_avg_days: int = Field(ge=1, le=30)
    ls_period: Literal["1h"]
    ls_avg_days: int = Field(ge=1, le=20)
    max_symbol_failure_ratio: float = Field(gt=0, le=1)

    @model_validator(mode="after")
    def _enough_candles(self) -> "Collection":
        need = 24 * (1 + self.volume_ratio_baseline_days)
        if self.kline_limit < need + 1:
            raise ValueError(
                f"kline_limit={self.kline_limit} is too small: volume ratio needs "
                f"{need} closed 1h candles plus the in-progress one (>= {need + 1})"
            )
        if self.kline_limit < self.floor_days * 24 + 2:
            raise ValueError("kline_limit too small for floor_days")
        return self


class Health(_Strict):
    failures_before_warning: int = Field(ge=1)
    rewarn_hours: float = Field(gt=0)
    send_recovery_notice: bool


class BinanceAnn(_Strict):
    enabled: bool
    base_url: str
    list_path: str
    detail_path: str
    catalog_name_keywords: list[str] = Field(min_length=1)
    fallback_catalog_ids: list[int] = Field(min_length=1)
    page_size: int = Field(ge=1, le=50)
    title_keywords: list[str] = Field(min_length=1)
    removal_keywords: list[str] = Field(min_length=1)
    delisting_keywords: list[str]
    token_prefixes: list[str]


class BybitAnn(_Strict):
    enabled: bool
    locale: str
    page_size: int = Field(ge=1, le=100)
    types: list[str]
    risk_keywords: list[str]


class Announcements(_Strict):
    user_agent: str = Field(min_length=10)
    request_timeout_seconds: float = Field(gt=0)
    binance: BinanceAnn
    bybit: BybitAnn
    watchlist_days: float = Field(gt=0)
    stop_tracking_on_tag_removal: bool
    stopwords: list[str]


class Symbols(_Strict):
    multiplier_prefixes: list[str]
    overrides: dict[str, str] | None = None

    @field_validator("multiplier_prefixes")
    @classmethod
    def _digits(cls, v: list[str]) -> list[str]:
        for p in v:
            if not p.isdigit():
                raise ValueError(f"prefix {p!r} must be digits only")
        return sorted(v, key=len, reverse=True)

    @field_validator("overrides")
    @classmethod
    def _ov(cls, v):
        v = v or {}
        out = {}
        for k, s in v.items():
            if not isinstance(s, str) or not s.upper().endswith("USDT"):
                raise ValueError(f"override {k}: {s!r} must be a Bybit USDT symbol like RENDERUSDT")
            out[str(k).upper()] = s.upper()
        return out


class Stages(_Strict):
    loading_require_negative_funding: bool
    loading_min_oi_change_24h_pct: float
    loading_require_above_floor: bool
    loading_ls_below_avg_factor: float = Field(gt=0)
    trigger_range_hours: int = Field(ge=2, le=168)
    trigger_turnover_multiple: float = Field(gt=0)
    trigger_turnover_avg_hours: int = Field(ge=24, le=168)
    trigger_require_negative_funding: bool
    trigger_hold_hours: float = Field(gt=0)
    invalidation_price: Literal["close", "low"]
    invalidated_rearm_hours: float = Field(ge=0)


class VolumeRatioScore(_Strict):
    full_at: float
    full_points: float
    partial_at: float
    partial_points: float


class OiFlatScore(_Strict):
    min_oi_change_24h_pct: float
    max_abs_price_change_24h_pct: float
    points: float
    partial_min_oi_change_24h_pct: float
    partial_points: float


class FundingScore(_Strict):
    negative_points: float
    below_own_avg_points: float


class LsScore(_Strict):
    below_avg_factor: float = Field(gt=0)
    points: float


class FloorScore(_Strict):
    max_distance_above_floor_pct: float
    min_outperformance_vs_btc_pct: float
    points: float


class Penalties(_Strict):
    late_price_change_24h_pct: float
    late_points: float
    thin_turnover_24h_usd: float
    thin_points: float
    too_new_points: float


class Scoring(_Strict):
    volume_ratio: VolumeRatioScore
    oi_up_price_flat: OiFlatScore
    funding: FundingScore
    long_short: LsScore
    floor_or_outperform: FloorScore
    tagged_bonus: float
    penalties: Penalties


class TelegramCfg(_Strict):
    max_retries: int = Field(ge=0, le=10)
    min_seconds_between_messages: float = Field(ge=0)
    timeout_seconds: float = Field(gt=0)


class Alerts(_Strict):
    instant_score_threshold: float = Field(ge=0, le=100)
    hourly_top_n: int = Field(ge=1, le=50)
    rescore_delta: float = Field(ge=0)
    cooldown_minutes: float = Field(ge=0)
    stage_change_bypasses_cooldown: bool
    telegram: TelegramCfg


class Outcomes(_Strict):
    windows_hours: list[int] = Field(min_length=1)
    target_gain_pct: float = Field(gt=0)
    giveback_fraction: float = Field(gt=0, lt=1)
    track_kinds: list[Literal["score", "stage", "new_tag", "hourly_top"]]
    hourly_top_dedupe_hours: float = Field(ge=0)
    candle_minutes: Literal[5]

    @field_validator("windows_hours")
    @classmethod
    def _sorted(cls, v: list[int]) -> list[int]:
        if any(w <= 0 for w in v):
            raise ValueError("windows must be positive hours")
        return sorted(set(v))


class Sentiment(_Strict):
    enabled: bool
    min_score: float


class Config(_Strict):
    paths: Paths
    logging: Logging
    schedule: Schedule
    bybit: Bybit
    universe: Universe
    collection: Collection
    health: Health
    announcements: Announcements
    symbols: Symbols
    stages: Stages
    scoring: Scoring
    alerts: Alerts
    outcomes: Outcomes
    sentiment: Sentiment

    # Filled from .env, not from YAML.
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""
    base_dir: str = "."

    def path(self, p: str) -> Path:
        q = Path(p)
        return q if q.is_absolute() else Path(self.base_dir) / q


_TOKEN_RE = re.compile(r"^\d{5,}:[A-Za-z0-9_-]{30,}$")
_CHAT_RE = re.compile(r"^(-?\d{3,}|@[A-Za-z0-9_]{4,})$")


def load_config(config_path: str | Path, env_path: str | Path | None = None,
                require_telegram: bool = True) -> Config:
    config_path = Path(config_path)
    if not config_path.is_file():
        raise ConfigError(f"Config file not found: {config_path}")
    try:
        raw = yaml.safe_load(config_path.read_text(encoding="utf-8"))
    except yaml.YAMLError as e:
        raise ConfigError(f"config.yaml is not valid YAML: {e}") from e
    if not isinstance(raw, dict):
        raise ConfigError("config.yaml must be a mapping of sections")
    try:
        cfg = Config(**raw)
    except ValidationError as e:
        lines = []
        for err in e.errors():
            loc = ".".join(str(x) for x in err["loc"])
            lines.append(f"  - {loc}: {err['msg']}")
        raise ConfigError("config.yaml is invalid:\n" + "\n".join(lines)) from None

    cfg.base_dir = str(config_path.resolve().parent)

    env_path = Path(env_path) if env_path else config_path.resolve().parent / ".env"
    env = dict(dotenv_values(env_path)) if env_path.is_file() else {}
    # Real environment variables win over the file (handy for systemd).
    token = os.environ.get("TELEGRAM_BOT_TOKEN") or env.get("TELEGRAM_BOT_TOKEN") or ""
    chat = os.environ.get("TELEGRAM_CHAT_ID") or env.get("TELEGRAM_CHAT_ID") or ""
    token, chat = token.strip(), chat.strip()

    if require_telegram:
        problems = []
        if not env_path.is_file() and not (os.environ.get("TELEGRAM_BOT_TOKEN")):
            problems.append(f".env file not found at {env_path} (copy .env.example to .env)")
        if not token:
            problems.append("TELEGRAM_BOT_TOKEN is missing")
        elif not _TOKEN_RE.match(token):
            problems.append("TELEGRAM_BOT_TOKEN does not look like a bot token (123456789:ABC...)")
        if not chat:
            problems.append("TELEGRAM_CHAT_ID is missing")
        elif not _CHAT_RE.match(chat):
            problems.append("TELEGRAM_CHAT_ID must be a number (e.g. 123456789 or -100123...) or @channelname")
        if problems:
            raise ConfigError(".env is invalid:\n" + "\n".join(f"  - {p}" for p in problems))
    from .redact import register_secret
    register_secret(token)
    cfg.telegram_bot_token = token
    cfg.telegram_chat_id = chat
    return cfg
