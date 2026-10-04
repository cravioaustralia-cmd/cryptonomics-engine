from squeeze_radar.alerts import anti_spam, summary_line
from squeeze_radar.scoring import score_symbol
from squeeze_radar.timeutil import MINUTE_MS

PERFECT = {
    "volume_ratio": 4.2, "oi_chg_24h_pct": 18.0, "chg_24h_pct": 1.0, "funding_now_8h": -0.0003,
    "funding_own_avg_8h": -0.0001, "ls_ratio": 0.8, "ls_avg": 1.0, "last_price": 0.82, "floor": 0.79,
    "perf_vs_btc_pct": 3.0, "turnover_24h": 50_000_000,
}


def comp(r, name):
    return next(c for c in r.components if c.name == name).points


def test_perfect_tagged_setup_scores_100(cfg):
    r = score_symbol(PERFECT, cfg.scoring, tagged=True, too_new=False, min_turnover=2e6)
    assert r.score == 100
    assert comp(r, "volume_ratio") == 20 and comp(r, "oi_up_price_flat") == 25
    assert comp(r, "funding") == 15 and comp(r, "long_short") == 10
    assert comp(r, "floor_or_outperform") == 10 and comp(r, "tagged_bonus") == 20


def test_untagged_setup_and_components_are_separate(cfg):
    r = score_symbol(PERFECT, cfg.scoring, tagged=False, too_new=False, min_turnover=2e6)
    assert r.score == 80
    assert {c.name for c in r.components} >= {"volume_ratio", "oi_up_price_flat", "funding", "long_short",
                                               "floor_or_outperform", "tagged_bonus", "penalty_late",
                                               "penalty_thin", "penalty_too_new"}


def test_oi_up_but_price_moving_gets_no_absorption_points(cfg):
    m = dict(PERFECT, chg_24h_pct=5.0)
    r = score_symbol(m, cfg.scoring, tagged=False, too_new=False, min_turnover=2e6)
    assert comp(r, "oi_up_price_flat") == 0


def test_partial_points(cfg):
    m = dict(PERFECT, volume_ratio=2.5, oi_chg_24h_pct=6.0, funding_now_8h=-0.00005, funding_own_avg_8h=0.0)
    r = score_symbol(m, cfg.scoring, tagged=False, too_new=False, min_turnover=2e6)
    assert comp(r, "volume_ratio") == 10 and comp(r, "oi_up_price_flat") == 10
    m2 = dict(PERFECT, funding_now_8h=0.00005, funding_own_avg_8h=0.0001)  # positive but below own avg
    assert comp(score_symbol(m2, cfg.scoring, tagged=False, too_new=False, min_turnover=2e6), "funding") == 7


def test_penalties_late_thin_new_and_clamp(cfg):
    m = dict(PERFECT, chg_24h_pct=20.0, turnover_24h=1_000_000)
    r = score_symbol(m, cfg.scoring, tagged=False, too_new=True, min_turnover=2e6)
    assert comp(r, "penalty_late") == -25
    assert comp(r, "penalty_thin") == -10
    assert comp(r, "penalty_too_new") == -15
    empty = score_symbol({}, cfg.scoring, tagged=False, too_new=True, min_turnover=2e6)
    assert empty.score == 0 and empty.raw_total < 0  # clamped


def test_missing_data_scores_zero_not_crash(cfg):
    r = score_symbol({"last_price": 1.0}, cfg.scoring, tagged=False, too_new=False, min_turnover=2e6)
    assert 0 <= r.score <= 100


def test_summary_line_format():
    line = summary_line("MOVRUSDT", 84, PERFECT, "LOADING")
    assert line == ("<b>MOVR</b> | Score 84 | Vol 4.2x, OI +18%, price +1%, funding(8h) -0.030%, "
                    "TAGGED Stage 2 | floor 0.79")


# --------------------------------------------------------------- anti-spam --
def test_anti_spam_rules():
    kw = dict(delta=10, cooldown_minutes=120, stage_bypasses_cooldown=True)
    t = 10_000 * MINUTE_MS
    assert anti_spam(None, 85, None, t, **kw).send
    prev = {"last_score": 85, "last_stage": None, "last_alert_ms": t}
    # inside cooldown, big score change -> no
    assert not anti_spam(prev, 99, None, t + 30 * MINUTE_MS, **kw).send
    # after cooldown, small change -> no
    assert not anti_spam(prev, 90, None, t + 200 * MINUTE_MS, **kw).send
    # after cooldown, change >= 10 -> yes (up or down)
    assert anti_spam(prev, 95, None, t + 200 * MINUTE_MS, **kw).send
    assert anti_spam(prev, 75, None, t + 200 * MINUTE_MS, **kw).send
    # stage change bypasses cooldown
    assert anti_spam(prev, 85, "LOADING", t + 1 * MINUTE_MS, **kw).send
    # ...unless configured otherwise
    kw2 = dict(kw, stage_bypasses_cooldown=False)
    assert not anti_spam(prev, 85, "LOADING", t + 1 * MINUTE_MS, **kw2).send
    assert anti_spam(prev, 85, "LOADING", t + 121 * MINUTE_MS, **kw2).send
