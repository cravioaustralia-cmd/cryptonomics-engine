"""lf10 shot spec: every base shot, overlay and hold, anchored to spoken words.

Anchors: 'word' / 'word#n' (n-th occurrence in the segment) / 'word+0.3' / 'start' / 'end'.
Overlay props starting with '@' are word anchors resolved to absolute seconds.
"""

SRC_AEC = "Source: Australian Electoral Commission"


def build_spec(g):
    P, V, D, K, O, seg, hold = g["P"], g["V"], g["D"], g["K"], g["O"], g["seg"], g["hold"]

    def board(frm, to, **kw):
        return O("board", frm, to, explain=True, **kw)

    # ============================================================ COLD OPEN
    hold(1.6, [V("BR_STOCK_canberra_sunset_sky", 0.0, ss=0.0)], music="MUS_01_tense_pulse", chapter="Cold open: 11 November 1975", name="lead-in")
    seg("S01", [
        P("IMG_whitlam_headshot", None, frame="framed", fh=930, label=dict(title="11 NOVEMBER 1975", sub="GOVERNMENT HOUSE, CANBERRA", at="11th", to="meeting")),
        V("BR_AI_01_driveway_dusk", "meeting", ss=0.5),
        P("IMG_whitlam_headshot", "he#1", frame="framed", fh=930, move="none", zoom=[1.0, 1.0], sfx="SFX_bass_impact", sfx_gain=0.9),
        V("BR_AI_02_ballot_into_box", "he#2", ss=0.0),
        P("IMG_whitlam_after_dismissal_1975", "he#3", focus=[0.3, 0.35], label=dict(title="Gough Whitlam", sub="Parliament House, 11 November 1975")),
        P("IMG_kerr_governor_general", "dismissed", frame="framed", fh=980, move="up", label=dict(title="SIR JOHN KERR", sub="GOVERNOR-GENERAL", at="man")),
    ], [
        O("crack", "walked", "he#2-0.12"),
    ])
    seg("S02", [
        P("IMG_rudd_2007", None, frame="framed", fh=900, label=dict(title="KEVIN RUDD", sub="2010", at="start")),
        P("IMG_gillard", "and", frame="framed", fh=900, label=dict(title="JULIA GILLARD", sub="2013", at="and")),
        P("IMG_abbott_official", "four", frame="framed", fh=900, label=dict(title="TONY ABBOTT", sub="2015", at="four")),
        P("IMG_turnbull_peo", "prime", frame="framed", fh=900, label=dict(title="MALCOLM TURNBULL", sub="2018", at="prime")),
        P("IMG_house_of_reps_chamber", "not", sfx="SFX_shutter"),
        P("IMG_senate_chamber", "in", focus=[0.5, 0.5], label=dict(title="THE SENATE", sub="Parliament House, Canberra", at="in", to="elected")),
        V("BR_STOCK_parliament_house_canberra", "his", ss=0.3),
    ], [
        O("fourpms", "not", "in-0.12", explain=True, captionAt="@not+0.3", caption="PUSHED OUT BY THEIR OWN COLLEAGUES",
          credit="Photos: MoAD © Commonwealth of Australia CC BY 4.0 · Dilma Rousseff CC BY-SA 2.0 · Commonwealth of Australia CC BY 3.0 AU · Commonwealth of Australia CC BY 4.0 · via Wikimedia Commons",
          pms=[dict(src="IMG_rudd_2007.jpg", name="Rudd", year="2010", at="@not"), dict(src="IMG_gillard.jpg", name="Gillard", year="2013", at="@not+0.35"),
               dict(src="IMG_abbott_official.jpg", name="Abbott", year="2015", at="@by#1"), dict(src="IMG_turnbull_peo.jpg", name="Turnbull", year="2018", at="@by#1+0.35")]),
        O("big", "half", "end", explain=True, lines=[dict(t="ABOUT 0.5%", size=190, color="#E8CC6E", at="@half"), dict(t="OF THE VOTE", size=54, font="sans", at="@half+0.4"),
                                                      dict(t="ELECTED TO THE SENATE · 2013", size=44, font="sans", color="#EFE6D2", at="@vote", gap=30)], source=SRC_AEC),
    ])
    seg("S03", [
        V("BR_STOCK_printing_press", None, ss=1.0, sfx="SFX_press_machinery_hum", sfx_gain=0.7),
        V("BR_STOCK_newspaper_press_running", "politics", ss=4.0),
        V("BR_STOCK_canberra_sunset_sky", "so", ss=0.0),
        V("BR_AI_news_desk", "media", ss=1.0),
        P("IMG_super_pit_kalgoorlie", "billionaires", focus=[0.5, 0.5], move="panR"),
        V("BR_AI_03_corridor_door_night", "backroom", ss=0.0),
        V("BR_STOCK_parliament_house_canberra", "today", ss=0.0),
        P("IMG_parliament_house_blue_hour", "stay", move="in"),
    ], [
        O("crown", "today", "stay", path=[960, -40, 120], size=230),
        board("stay", "end", appear=True),
    ])
    hold(4.2, [P("IMG_parliament_house_flag", 0.0, move="up", zoom=[1.08, 1.16])], [
        O("title", 0.0, -0.02, explain=True),
    ], name="title", chapter=None)

    # ============================================================ SUSPECT 1
    hold(3.2, [V("BR_STOCK_newspaper_flipping_pov", 0.0, ss=0.0)], [
        O("chapter", 0.0, -0.02, explain=True, kicker="SUSPECT #1", title="The Press Baron", crown=True),
    ], music="MUS_02_investigative", chapter="Suspect #1: The Press Baron")
    seg("S04", [
        V("BR_STOCK_printing_press", None, ss=8.0),
        V("BR_STOCK_newspaper_press_running", "youll", ss=12.0),
        P("IMG_murdoch_2011", "rupert", frame="framed", fh=980),
        P("BR_STOCK_adelaide_skyline", "adelaide", move="panR"),
        V("BR_STOCK_london_city", "global", ss=2.0),
        P("IMG_murdoch_reagan_oval_office", "eventually", focus=[0.6, 0.4], label=dict(title="Rupert Murdoch (right) with President Reagan", sub="White House, 1983", at="fox")),
    ], [
        O("tag", "rupert", "adelaide", n=1, name="THE PRESS BARON"),
        O("route", "global", "eventually", explain=True, beats=["@global", "@global+0.5", "@newspapers", "@television"]),
    ])
    seg("S05", [
        V("BR_STOCK_sydney_aerial_skyscrapers", None, ss=3.0),
        V("BR_STOCK_melbourne_aerial_dusk", "largest", ss=1.0),
        V("BR_STOCK_brisbane_aerial", "with", ss=4.0),
        V("BR_STOCK_perth_elizabeth_quay", "every", ss=5.0),
        P("IMG_murdoch_2011", "heres", focus=[0.5, 0.3], zoom=[1.0, 1.08]),
        V("BR_STOCK_digital_screens", "1985", ss=0.5),
        V("BR_AI_news_desk", "own", ss=4.0),
        V("BR_STOCK_printing_press", "so", ss=11.0),
        P("IMG_parliament_house_blue_hour", "technically", move="out"),
    ], [
        O("ausmap", "papers", "heres", explain=True, beats=["@papers", "@papers+0.2", "@papers+0.4", "@nearly", "@nearly+0.2", "@every", "@every+0.2"], source="Source: Reuters / Al Jazeera, 2020"),
        O("passport", "1985", "own", explain=True, flipAt="@citizen-0.3"),
        O("lower", "1985", "own", title="1985 · US CITIZENSHIP"),
        board("technically", "end", filled=[], newCard=1, cardAt="@technically+0.2"),
    ])
    seg("S06", [
        P("IMG_whitlam_policy_speech_1972", None, frame="framed", fh=960, label=dict(title="1972 · “IT'S TIME”", sub="Gough Whitlam's policy speech", at="1972")),
        P("IMG_whitlam_blacktown_rally", "national", focus=[0.6, 0.4], label=dict(title="Whitlam campaign rally", sub="Blacktown, 13 November 1972", at="famous")),
        P("IMG_first_whitlam_ministry_1972", "whitlam#2", focus=[0.5, 0.45], label=dict(title="Whitlam government sworn in", sub="5 December 1972")),
        P("IMG_fraser_1974", "murdoch", frame="framed", fh=960, label=dict(title="Malcolm Fraser", sub="Liberal leader · 1974 portrait", at="during")),
        V("BR_STOCK_newspaper_press_running", "his#3", ss=8.0),
        V("BR_STOCK_typewriter_closeup", "that", ss=0.5),
        V("BR_STOCK_book_pages_turning", "wrote", ss=1.0),
    ], [
        O("letter", "75", "end", explain=True, marksFrom="@75", marksTo="@protest", caption="Letter from 75 News Limited journalists, Dec 1975"),
    ])
    seg("S07", [
        V("BR_STOCK_open_office_empty", None, ss=1.0),
        V("BR_STOCK_newspaper_press_running", "something", ss=16.0, rate=0.6),
        V("BR_STOCK_typewriter_closeup", "they#2", ss=4.0, sfx="SFX_typewriter", sfx_gain=0.6),
        P("IMG_murdoch_2011", "murdoch", frame="framed", fh=980, label=dict(title="Murdoch's position", sub="1977 interview", at="argued")),
        V("BR_STOCK_open_office_empty", "editors", ss=12.0),
    ], [
        O("lower", "8th", "they#2", title="8 DECEMBER 1975", sub="FIRST STRIKE OVER EDITORIAL COVERAGE"),
    ])
    seg("S08", [
        V("BR_AI_04_newspaper_doorstep", None, ss=0.5),
        P("IMG_house_of_reps_chamber", "you#1", focus=[0.5, 0.55], label=dict(title="House of Representatives", sub="Parliament House, Canberra")),
        P("IMG_rudd_2007", "2020", frame="framed", fh=960, label=dict(title="Kevin Rudd", sub="Former Prime Minister", at="kevin")),
        V("BR_STOCK_parliament_house_canberra", "cancer", ss=1.5),
        V("BR_STOCK_laptop_typing", "launched", ss=1.0),
    ], [
        O("lower", "petition", "END", title="PETITION FOR A ROYAL COMMISSION", sub="Launched by Kevin Rudd, 2020"),
    ])
    seg("S09", [
        V("BR_STOCK_phone_scrolling", None, ss=0.0),
        D("DOC_aph_epetition_EN1938", "biggest", crop=[660, 150, 900, 360], scroll=0, label=dict(title="E-petition EN1938", sub="Parliament of Australia website", at="electronic")),
        P("IMG_turnbull_peo", "former", frame="framed", fh=960, label=dict(title="Malcolm Turnbull", sub="Former Liberal Prime Minister", at="malcolm")),
        V("BR_STOCK_newspaper_press_running", "has#1", ss=2.0),
        P("IMG_parliament_house_blue_hour", "news", move="in"),
    ], [
        O("counter", "start", "biggest", explain=True, target=501876, landAt="@signatures", kicker="E-PETITION", unit="SIGNATURES", source="Source: Al Jazeera / AFP; The New Daily, Nov 2020"),
        O("panels2", "has#1", "end", explain=True, kickerL="TURNBULL'S VIEW", lt="The Murdoch press helped bring him down in 2018", lb="Malcolm Turnbull's view.", lAt="@argued",
          kickerR="NEWS CORP", rt="News Corp denies these claims", rb="News Corp has always rejected claims like these.", rAt="@news", lc="#16263D", rc="#B3261E"),
    ])
    seg("S10", [
        V("BR_AI_02_ballot_into_box", None, ss=5.0),
        V("BR_AI_02_ballot_into_box", "not", ss=7.4, zoom=[1.14, 1.16], sfx="SFX_record_scratch", sfx_gain=0.55),
        P("IMG_albanese_dfat", "2022", frame="framed", fh=980, label=dict(title="Anthony Albanese", sub="Labor · elections won in 2022 and 2025", at="2022")),
        V("BR_STOCK_parliament_house_canberra", "despite", ss=0.5),
        P("IMG_parliament_house_blue_hour", "murdoch", move="out"),
        D("DOC_aec_tallyroom_dickson_2025", "2025#2", crop=[990, 700, 900, 270], scroll=0, label=dict(title="OPPOSITION LEADER LOSES DICKSON", sub="2025 · AEC Tally Room", at="opposition")),
    ], [
        O("stamp", "not", "2022", text="CASE OPEN"),
        O("cards", "despite", "2025#2", explain=True, items=[dict(kicker="2022", title="Labor win", at="@despite"), dict(kicker="2025", title="Labor win", at="@despite+0.4")], source="Data: AEC Tally Room"),
    ])
    seg("S11", [
        P("IMG_murdoch_2015", None, focus=[0.5, 0.35], label=dict(title="Rupert Murdoch", sub="2015", at="start")),
        V("BR_AI_06_boardroom_empty_chair", "and#1", ss=0.0),
        V("BR_STOCK_open_office_empty", "son", ss=6.0),
        V("BR_STOCK_newspaper_press_running", "press", ss=0.0),
        V("BR_AI_05_newspaper_train_seat", "real", ss=0.5),
        V("BR_STOCK_phone_scrolling", "young", ss=4.0),
    ], [
        O("tree", "and#1", "press", explain=True, branchAt="@son", goldAt="@lachlan", stampAt="@2050", source="Source: News Corp / Fox Corp announcement, Sept 2025"),
    ])

    # ============================================================ SUSPECT 2
    hold(3.0, [V("BR_STOCK_tv_static_bw", 0.0, ss=0.0)], [
        O("chapter", 0.0, -0.02, explain=True, kicker="SUSPECT #2", title="The Man Who Owned the Screen", crown=True, size=92),
    ], music="MUS_07_retro_synth", chapter="Suspect #2: The Man Who Owned the Screen")
    seg("S12", [
        V("BR_STOCK_tv_static_bw", None, ss=6.0),
        V("BR_AI_1990s_lounge_tv_glow", "another", ss=0.5),
        K("Kerry Packer", "kerry", role="Owner of Channel Nine", note="No free-licence photo available"),
        V("BR_STOCK_cricket_ground_waca", "man#2", ss=2.0),
        V("BR_STOCK_sydney_aerial_skyscrapers", "for", ss=10.0),
    ], [
        O("tag", "kerry", "man#2", n=2, name="THE TV TYCOON"),
    ])
    seg("S13", [
        V("BR_STOCK_tv_rainy_night_room", None, ss=2.0),
        V("BR_STOCK_vintage_phone_ringing", "he", ss=0.0, sfx="SFX_vintage_phone_ring", sfx_gain=0.5),
        P("IMG_house_of_reps_chamber", "1991", focus=[0.4, 0.5], move="panL", honest="Illustrative · House of Representatives chamber"),
        V("BR_STOCK_open_office_empty", "answer", ss=4.0),
    ], [
        O("lower", "1991", "answer", title="1991", sub="PARLIAMENTARY COMMITTEE ON THE PRINT MEDIA"),
    ])
    seg("S14", [
        V("BR_STOCK_calculator_accounts", "start-0.3", ss=9.0, sfx="SFX_gavel", sfx_gain=0.5),
        V("BR_STOCK_book_pages_turning", "tax", ss=4.0),
        V("BR_STOCK_banknotes_aud", "government", ss=1.0),
        P("IMG_parliament_house_flag", "politicians", move="up", zoom=[1.1, 1.18]),
        V("BR_STOCK_parliament_house_canberra", "billionaire", ss=2.5),
    ], [
        O("cards", "anyone", "politicians", explain=True, cw=1300, cols=1,
          items=[dict(kicker="PARAPHRASE, NOT A DIRECT QUOTE · 1991", title="Anyone who didn't minimise their tax within the law needed their head read.", size=50, at="@anyone"),
                 dict(title="The government wasn't exactly spending its money wisely anyway.", size=50, at="@government")]),
    ])
    seg("S15", [
        K("Kerry Packer", None, role="Died 2005", note="No free-licence photo available"),
        V("BR_AI_06_boardroom_empty_chair", "story", ss=2.0),
        V("BR_STOCK_canberra_sunset_sky", "sometimes", ss=3.0),
    ], [
        board("sometimes", "END", filled=[1], newCard=2, cardAt="@sometimes+0.2", newString=[1, 2], stringAt="@makes"),
    ])

    # ============================================================ SUSPECT 3
    hold(3.0, [V("BR_STOCK_gas_flare", 0.0, ss=0.0)], [
        O("chapter", 0.0, -0.02, explain=True, kicker="SUSPECT #3", title="The Mining Money", crown=True),
    ], music="MUS_08_industrial_percussion", chapter="Suspect #3: The Mining Money")
    seg("S16", [
        P("IMG_super_pit_kalgoorlie", None, move="panL"),
        V("BR_STOCK_ore_train", "iron", ss=6.0),
        P("IMG_coal_train_qld", "coal", focus=[0.5, 0.6], label=dict(title="Coal train", sub="Corinda, Queensland, 2019", at="coal")),
        V("BR_STOCK_gas_flare", "gas", ss=11.0),
        D("DOC_pmtranscripts_17260_rspt_2010", "may", tall=True, crop=[395, 455, 1130, 430], scroll=0),
    ], [
        O("tag", "start", "iron", n=3, name="THE MINING MONEY"),
        O("lower", "may", "end", title="MAY 2010 · RESOURCE SUPER PROFITS TAX", sub="Media release, 2 May 2010"),
    ])
    seg("S17", [
        P("IMG_super_pit_kalgoorlie", None, focus=[0.3, 0.6], move="in"),
        V("BR_STOCK_digital_screens", "against", ss=6.0),
        V("BR_STOCK_ore_train", "mining", ss=12.0),
        V("BR_STOCK_banknotes_aud", "22", ss=4.0),
        V("BR_STOCK_perth_elizabeth_quay", "perth", ss=10.0, honest="Perth today · illustrative", sfx="SFX_crowd_murmur", sfx_gain=0.35),
        V("BR_STOCK_crowd_street_crossing", "back#2", ss=3.0, honest="Stand-in · overseas street, not the 2010 rally"),
        P("IMG_rinehart_2015", "gina", frame="framed", fh=600, label=dict(title="Gina Rinehart", sub="2015 photo", at="gina")),
        P("IMG_forrest_2017", "beside", frame="framed", fh=940, label=dict(title="Andrew Forrest", sub="2017 photo", at="andrew")),
    ], [
        O("stack", "about", "perth", explain=True, head="$22 MILLION", headAt="@22", sub="IN ABOUT 6 WEEKS", subAt="@six",
          parts=[dict(value=17.2, valueLabel="$17.2m", label="Minerals Council of Australia", color="#C9A227", at="@mining"),
                 dict(value=4.2, valueLabel="$4.2m", label="BHP Billiton", color="#E8CC6E", at="@spent"),
                 dict(value=0.6, valueLabel="", label="Others", color="#9AA3AF", at="@around", small=True)],
          source="Source: AEC disclosures, reported by SMH 2011"),
        O("lower", "perth", "back#2", title="PERTH · JUNE 2010", sub="Rally against the mining tax"),
    ])
    seg("S18", [
        P("IMG_parliament_house_blue_hour", None, move="in"),
        V("BR_STOCK_canberra_sunset_sky", "about", ss=1.0),
        P("IMG_rudd_2007", "kevin", frame="framed", fh=960, label=dict(title="Kevin Rudd", sub="Prime Minister until 24 June 2010", at="kevin")),
        P("IMG_parliament_house_blue_hour", "now", move="out", zoom=[1.2, 1.1]),
        V("BR_STOCK_parliament_house_canberra", "shelved", ss=0.0),
        V("BR_STOCK_canberra_sunset_sky", "hard", ss=6.0),
        V("BR_STOCK_banknotes_aud", "showed", ss=6.5),
    ], [
        O("lower", "start", "about", title="24 JUNE 2010"),
        O("cards", "many", "showed", explain=True, title="Why Rudd fell", cols=4, cw=360, minH=150,
          items=[dict(title="Falling polls", at="@falling", size=40), dict(title="A shelved climate policy", at="@shelved", size=40),
                 dict(title="Colleagues", sub="internal tensions", at="@colleagues", size=40), dict(title="Mining campaign", at="@mining", size=40, hlAt="@mining+0.3")]),
    ])
    seg("S19", [
        P("IMG_gillard", None, frame="framed", fh=980, label=dict(title="Julia Gillard", sub="Prime Minister from 24 June 2010", at="julia")),
        V("BR_STOCK_calculator_accounts", "biggest", ss=14.0),
        P("IMG_senate_chamber", "raised", focus=[0.5, 0.45], move="panR"),
        P("IMG_palmer_2015", "and#2", focus=[0.62, 0.26], zoom=[1.14, 1.18], label=dict(title="Clive Palmer", sub="Member for Fairfax 2013–2016", at="clive")),
        V("BR_STOCK_banknotes_aud", "biggest#2", ss=0.0),
    ], [
        O("lower", "raised", "and#2", title="MRRT · INTRODUCED 2012 · REPEALED 2014", sub="Minerals Resource Rent Tax"),
    ])
    seg("S20", [
        V("BR_AI_07_letterbox_flyers", None, ss=5.0),
        V("BR_STOCK_digital_screens", "spending", ss=4.0),
        V("BR_AI_08_phone_glow_dark", "about#2", ss=0.0),
        V("BR_STOCK_banknotes_aud", "seats#2", ss=6.0),
        V("BR_STOCK_sydney_street_timelapse", "trumpet", ss=0.0),
    ], [
        O("bars", "start", "END", explain=True, max=123, h=430, bw=250, gap=110, base=760, title="Palmer's political spending",
          bars=[dict(label="2019", sub="United Australia Party", value=89, valueLabel="about $89M", at="@89", chairs=0, chairsAt="@zero#1"),
                dict(label="2022", sub="United Australia Party", value=123, valueLabel="about $123M", at="@123", chairs=1, chairsAt="@one"),
                dict(label="2025", sub="Trumpet of Patriots", value=53, valueLabel="about $53M", at="@53", chairs=0, chairsAt="@zero#2")],
          source="Source: Grattan Institute analysis of AEC returns"),
    ])
    seg("S21", [
        P("IMG_senate_chamber", None, focus=[0.5, 0.5], move="in", label=dict(title="THE SENATE", sub="Parliament House, Canberra", at="start")),
        V("BR_STOCK_parliament_house_canberra", "about", ss=0.5),
        P("IMG_palmer_2015", "palmer#1", focus=[0.62, 0.28], zoom=[1.14, 1.18], label=dict(title="Clive Palmer", sub="2015 photo", at="palmer#1")),
        V("BR_STOCK_banknotes_aud", "maybe", ss=7.5),
        V("BR_AI_strategy_room_whiteboard", "but", ss=0.5),
    ], [
        O("bars", "one", "palmer#1", explain=True, max=123, h=430, bw=250, gap=160, base=760, title="2025 election",
          bars=[dict(label="TRUMPET OF PATRIOTS", value=53, valueLabel="about $53M", at="@one", chairs=0, chairsAt="@one", dim=True, lsize=26),
                dict(label="ONE NATION", value=3, valueLabel="about $3M", at="@spent", chairs=3, chairsAt="@three", highlight=True, lsize=26)],
          source="Source: AEC data, reported by AAP / The New Daily"),
        board("but", "END", filled=[1, 2], newCard=3, cardAt="@but+0.2", crownOn=3, crownMode="wobble", crownAt="@money", leaveAt="@prime-0.2"),
    ])

    # ============================================================ SUSPECT 4
    hold(3.0, [V("BR_AI_03_corridor_door_night", 0.0, ss=4.0)], [
        O("chapter", 0.0, -0.02, explain=True, kicker="SUSPECT #4", title="The Faceless Men", crown=True),
    ], music="MUS_03_archival", chapter="Suspect #4: The Faceless Men")
    seg("S22", [
        V("BR_AI_03_corridor_door_night", None, ss=0.5),
        P("IMG_house_of_reps_chamber", "taken", focus=[0.5, 0.5]),
    ], [
        O("tag", "start", "taken", n=4, name="THE FACELESS MEN"),
        O("fourpms", "taken", "END", explain=True, captionAt="@not", caption="NOT BY VOTERS · BY THEIR OWN SIDE",
          credit="Photos: MoAD © Commonwealth of Australia CC BY 4.0 · Dilma Rousseff CC BY-SA 2.0 · Commonwealth of Australia CC BY 3.0 AU · Commonwealth of Australia CC BY 4.0 · via Wikimedia Commons",
          pms=[dict(src="IMG_rudd_2007.jpg", name="Rudd", year="2010", at="@taken+0.3"), dict(src="IMG_gillard.jpg", name="Gillard", year="2013", at="@taken+0.6"),
               dict(src="IMG_abbott_official.jpg", name="Abbott", year="2015", at="@eight"), dict(src="IMG_turnbull_peo.jpg", name="Turnbull", year="2018", at="@years")]),
    ])
    seg("S23", [
        V("BR_STOCK_canberra_sunset_sky", None, ss=7.5),
        V("BR_STOCK_parliament_house_canberra", "vote", ss=0.0),
        V("BR_AI_strategy_room_whiteboard", "and", ss=2.0),
        V("BR_STOCK_open_office_empty", "replaced", ss=14.0),
    ], [
        O("chain", "vote", "END", explain=True, beats=["@vote", "@mp", "@room", "@leader#1"], swapAt="@replaced"),
    ])
    seg("S24", [
        V("BR_AI_08_phone_glow_dark", None, ss=3.0),
        V("BR_STOCK_canberra_sunset_sky", "credited", ss=5.0),
        V("BR_STOCK_newspaper_press_running", "press", ss=6.0),
        V("BR_AI_03_corridor_door_night", "faceless", ss=5.0),
    ], [
        O("faceless", "start", "press"),
        O("big", "faceless", "END", lines=[dict(t="“THE FACELESS MEN”", size=120, at="@faceless")]),
    ])
    seg("S25", [
        V("BR_STOCK_chess_dark_room", None, ss=0.0),
        V("BR_STOCK_chess_closeup", "help", ss=0.0),
        V("BR_AI_strategy_room_whiteboard", "means", ss=5.5, rate=0.8),
    ], [
        O("seats", "help", "END", explain=True, mode="presel", dropAt="@picked", title="Safe seats", note="Illustrative: not a real seat map"),
    ])
    seg("S26", [
        V("BR_STOCK_handshake_table", None, ss=0.0),
        P("IMG_rights_at_work_campaign", "in", focus=[0.5, 0.75], zoom=[1.25, 1.32], label=dict(title="“Your Rights at Work” campaign", sub="2006", at="your")),
        P("IMG_howard_2006_ec", "sweep", frame="framed", fh=980, label=dict(title="John Howard (left)", sub="2002 photo", at="john")),
        V("BR_STOCK_suburbs_aerial_rooftops", "howard#2", ss=2.0),
        P("IMG_rudd_2007", "rudd", frame="framed", fh=900, sfx="SFX_shutter", label=dict(title="RUDD", sub="2010", at="rudd")),
        P("IMG_gillard", "gillard", frame="framed", fh=900, sfx="SFX_shutter", label=dict(title="GILLARD", sub="2013", at="gillard")),
        P("IMG_abbott_official", "abbott", frame="framed", fh=900, sfx="SFX_shutter", label=dict(title="ABBOTT", sub="2015", at="abbott")),
        P("IMG_turnbull_peo", "turnbull", frame="framed", fh=900, sfx="SFX_shutter", label=dict(title="TURNBULL", sub="2018", at="turnbull")),
    ], [
        O("seats", "howard#2", "rudd", explain=True, mode="named", title="2007 · PM loses his own seat", note="Illustrative: not a real seat map",
          named=[dict(i=29, name="BENNELONG", at="@lost", color="#B3261E", **{"from": "#1f4e9c"})]),
    ])
    seg("S27", [
        V("BR_STOCK_revolving_door", None, ss=0.0),
        V("BR_STOCK_padlock_shed", "harder", ss=0.5),
        V("BR_STOCK_sydney_street_timelapse", "so", ss=8.0),
        V("BR_STOCK_crowd_street_crossing", "every", ss=10.0),
        V("BR_STOCK_revolving_door", "revolving", ss=8.0),
    ], [
        board("so", "every", filled=[1, 2, 3], newCard=4, cardAt="@so+0.2", crownOn=4, crownMode="slide", crownAt="@kingmakers#1", leaveAt="@hurting"),
    ])

    # ============================================================ SUSPECT 5
    hold(3.0, [P("IMG_senate_chamber", 0.0, move="out")], [
        O("chapter", 0.0, -0.02, explain=True, kicker="SUSPECT #5", title="The Preference Whisperer", crown=True),
    ], music="MUS_09_playful_plucks", chapter="Suspect #5: The Preference Whisperer")
    seg("S28", [
        V("BR_STOCK_book_pages_turning", None, ss=6.0),
        P("IMG_senate_ballot_vic_folded", "how", focus=[0.5, 0.5], move="in", zoom=[1.02, 1.08], honest="2016 Senate ballot rendering, not 2013"),
    ], [
        O("tag", "start", "how", n=5, name="THE PREFERENCE WHISPERER"),
    ])
    seg("S29", [
        V("BR_AI_09_ballot_count_hands", None, ss=0.0),
        P("IMG_senate_ballot_vic_folded", "your#2", focus=[0.5, 0.5], move="in", zoom=[1.04, 1.08], honest="2016 Senate ballot rendering"),
        V("BR_AI_10_pencil_marks_ballot", "senate", ss=0.0),
        V("BR_STOCK_handshake_table", "according", ss=1.5),
    ], [
        O("flow", "first", "END", explain=True, startAt="@cant", ticketAt="@tick"),
    ])
    seg("S30", [
        K("Glenn Druery", None, role="Political strategist", note="No free-licence photo available"),
        V("BR_STOCK_handshake_table", "famous", ss=0.0),
        V("BR_STOCK_chess_closeup", "each", ss=1.0),
        V("BR_STOCK_digital_screens", "snowballed", ss=8.0),
    ], [
        O("web", "each", "END", explain=True, snowAt="@swapped", snowTo="@crossed"),
    ])
    seg("S31", [
        P("IMG_muir_senators_swearing_in_2014", None, focus=[0.5, 0.4], label=dict(title="New senators sworn in, 7 July 2014", sub="including Ricky Muir", at="ricky")),
        V("BR_STOCK_melbourne_aerial_dusk", "victoria", ss=4.0),
        V("BR_STOCK_melbourne_albert_park_aerial", "about", ss=3.0),
        P("IMG_senate_ballot_vic_folded", "supporters", focus=[0.5, 0.5], move="in", zoom=[1.0, 1.08], honest="2016 Senate ballot rendering"),
        V("BR_STOCK_book_pages_turning", "critics", ss=2.0),
    ], [
        O("big", "primary", "supporters", explain=True, lines=[dict(t="2013 · VICTORIA", size=50, font="sans", color="#EFE6D2", at="@primary"),
                                                                 dict(t="ABOUT 0.5%", size=190, color="#E8CC6E", at="@half"),
                                                                 dict(t="PRIMARY VOTE", size=54, font="sans", at="@half+0.3")], source=SRC_AEC),
        O("panels2", "supporters", "END", explain=True, kickerL="SUPPORTERS SAID", lt="System working", lb="The system was working as designed.", lAt="@supporters",
          kickerR="CRITICS SAID", rt="Voters in the dark", rb="Voters had no idea where their votes were going.", rAt="@critics", lc="#16263D", rc="#B3261E"),
    ])
    seg("S32", [
        P("IMG_senate_chamber", None, focus=[0.5, 0.5], move="panL"),
        P("IMG_senate_ballot_vic_folded", "2016", frame="full", focus=[0.5, 0.5], zoom=[1.0, 1.12], honest="2016 Senate ballot rendering"),
        V("BR_STOCK_book_pages_turning", "proved", ss=8.0),
        P("IMG_parliament_house_blue_hour", "sometimes", move="in"),
    ], [
        O("lower", "2016", "proved", title="2016 · GROUP VOTING TICKETS ABOLISHED", sub="Senate voting rules changed"),
        board("sometimes", "END", filled=[1, 2, 3, 4], newCard=5, cardAt="@sometimes+0.2"),
    ])

    # ============================================================ SUSPECT 6
    hold(3.0, [V("BR_STOCK_melbourne_albert_park_aerial", 0.0, ss=12.0)], [
        O("chapter", 0.0, -0.02, explain=True, kicker="SUSPECT #6", title="The New Kingmakers", crown=True, teal=True),
    ], music="MUS_04_momentum", chapter="Suspect #6: The New Kingmakers")
    seg("S33", [
        V("BR_STOCK_suburbs_aerial_rooftops", None, ss=6.0),
        V("BR_STOCK_melbourne_albert_park_aerial", "independent", ss=4.0),
        V("BR_STOCK_sydney_aerial_skyscrapers", "won", ss=14.0),
        P("IMG_house_of_reps_chamber", "kooyong", focus=[0.5, 0.5], move="out"),
    ], [
        O("tag", "start", "independent", n=6, name="THE NEW KINGMAKERS", teal=True),
        O("seats", "won", "END", explain=True, mode="named", title="2022 · The teals", note="Illustrative: not a real seat map",
          named=[dict(i=15, name="KOOYONG", at="@kooyong", **{"from": "#1f4e9c"}), dict(i=32, name="WENTWORTH", at="@wentworth", **{"from": "#1f4e9c"}),
                 dict(i=45, name="MACKELLAR", at="@mackellar", **{"from": "#1f4e9c"})]),
    ])
    seg("S34", [
        V("BR_STOCK_sydney_street_timelapse", None, ss=12.0),
        P("IMG_holmes_a_court", "fundraising", frame="framed", fh=860, label=dict(title="Simon Holmes à Court", sub="Founder, Climate 200 · 2021 photo", at="simon")),
        V("BR_STOCK_laptop_typing", "raised", ss=0.5),
    ], [
        O("coins", "raised", "END", explain=True, inAt="@thousands", outAt="@shared"),
    ])
    seg("S35", [
        P("IMG_house_of_reps_chamber", None, focus=[0.5, 0.5], move="in"),
        V("BR_STOCK_parliament_house_canberra", "critics", ss=1.0),
        P("IMG_parliament_house_blue_hour", "big", move="out"),
    ], [
        O("panels2", "start", "END", explain=True, kickerL="SUPPORTERS SAY", lt="A fair shot", lb="Climate 200 gave community candidates a fair shot against party machines.", lAt="@supporters",
          kickerR="CRITICS SAY", rt="A party in all but name", rb="Using big money to pick winners while claiming to be independent.", rAt="@critics", lc="#1FA3A3", rc="#B3261E"),
    ])
    seg("S36", [
        V("BR_STOCK_canberra_sunset_sky", None, ss=0.0),
        V("BR_STOCK_printing_press", "newspapers", ss=5.0),
        V("BR_STOCK_tv_static_bw", "television", ss=9.0),
        P("IMG_super_pit_kalgoorlie", "mining", focus=[0.6, 0.5]),
        V("BR_AI_03_corridor_door_night", "factions", ss=7.0),
        P("IMG_senate_ballot_vic_folded", "preference", focus=[0.5, 0.5], zoom=[1.0, 1.06], honest="2016 Senate ballot rendering"),
        V("BR_STOCK_melbourne_albert_park_aerial", "now", ss=16.0),
    ])

    # ============================================================ THE RULEBOOK
    hold(4.4, [P("IMG_parliament_house_blue_hour", 0.0, move="in", zoom=[1.05, 1.12])], [
        board(0.0, 2.2, filled=[1, 2, 3, 4, 5, 6], strings=[[1, 2], [1, 3], [3, 4], [4, 5], [5, 6], [2, 6]], teal=True),
        O("chapter", 2.0, -0.02, explain=True, kicker="CHAPTER 7", title="The Rulebook Just Changed"),
    ], chapter="The Rulebook Just Changed")
    seg("S37", [
        D("DOC_aec_fadreform_2026", None, tall=True, crop=[300, 0, 1320, 760], scroll=220),
        V("BR_STOCK_parliament_house_canberra", "biggest", ss=0.0),
        P("IMG_parliament_house_blue_hour", "and#2", move="in"),
        V("BR_STOCK_book_pages_turning", "first", ss=0.0),
        P("IMG_house_of_reps_chamber", "political#2", focus=[0.5, 0.5], move="in"),
        V("BR_STOCK_parliament_house_canberra", "outside", ss=1.0),
    ], [
        O("big", "1st#1", "political#2", explain=True, lines=[dict(t="CHANGES FROM 1 JULY 2026", size=88, at="@july"),
                                                             dict(t="NATIONAL CAPS FROM 1 JANUARY 2027", size=76, color="#E8CC6E", at="@january", gap=26)], source="Source: Australian Electoral Commission"),
        O("gauges", "political#2", "END", explain=True, partyAt="@90", thirdAt="@11", source="Source: AAP; The Daily Aus"),
    ])
    seg("S38", [
        P("IMG_senate_chamber", None, focus=[0.5, 0.5], move="in"),
        V("BR_STOCK_parliament_house_canberra", "independents", ss=4.0),
        P("IMG_parliament_house_flag", "protect", move="up"),
        V("BR_STOCK_book_pages_turning", "whoever", ss=10.0),
        P("IMG_parliament_house_blue_hour", "next", move="out"),
    ], [
        O("panels2", "start", "whoever", explain=True, kickerL="THE GOVERNMENT SAYS", lt="Stopping big money", lb="It's about stopping big money from buying elections.", lAt="@the+0.1",
          kickerR="SOME INDEPENDENTS SAY", rt="A major-party stitch-up", rb="The caps protect parties that already have huge war chests.", rAt="@the+0.1", lc="#16263D", rc="#B3261E"),
        board("next", "END", filled=[1, 2, 3, 4, 5, 6], strings=[[1, 2], [1, 3], [3, 4], [4, 5], [5, 6], [2, 6]], teal=True, extra=dict(title="THE RULEBOOK", at="@election")),
    ])

    # ============================================================ THE REVEAL
    hold(3.2, [V("BR_STOCK_suburbs_aerial_rooftops", 0.0, ss=0.0)], [
        O("chapter", 0.0, -0.02, explain=True, kicker="THE REVEAL", title="The Real Kingmaker", crown=True),
    ], music="MUS_05_sober", chapter="The Reveal")
    seg("S39", [
        V("BR_AI_09_ballot_count_hands", None, ss=2.0),
        V("BR_AI_02_ballot_into_box", "since", ss=0.0),
        V("BR_STOCK_sydney_street_timelapse", "turn", ss=2.0),
        V("BR_STOCK_melbourne_aerial_dusk", "thats", ss=6.0),
        V("BR_STOCK_suburbs_aerial_rooftops", "more", ss=10.0),
    ], [
        O("big", "since", "turn", explain=True, lines=[dict(t="SINCE 1924", size=150, color="#E8CC6E", at="@since"), dict(t="COMPULSORY VOTING", size=60, font="sans", at="@compulsory")], source=SRC_AEC),
        O("turnout", "thats", "END", explain=True, dotsAt="@around", nineAt="@9", ukAt="@far", source="Source: AEC / International IDEA"),
    ])
    seg("S40", [
        V("BR_STOCK_crowd_street_crossing", None, ss=0.0, sfx="SFX_crowd_murmur", sfx_gain=0.3),
        V("BR_AI_election_night_empty_hall", "supporters", ss=1.0),
        V("BR_STOCK_sydney_street_timelapse", "in#2", ss=14.0, label=dict(title="Chatswood, Sydney", at="australia")),
        V("BR_STOCK_melbourne_aerial_dusk", "including", ss=0.0),
    ])
    seg("S41", [
        V("BR_STOCK_nurse_corridor_back", None, ss=1.0),
        V("BR_AI_04_newspaper_doorstep", "voter", ss=5.0),
        V("BR_STOCK_tv_rainy_night_room", "watch", ss=9.0),
        V("BR_STOCK_phone_scrolling", "never", ss=10.0),
    ])
    seg("S42", [
        V("BR_STOCK_brisbane_aerial", None, ss=10.0),
        V("BR_STOCK_newspaper_flipping_pov", "murdochs", ss=5.0),
        V("BR_STOCK_tv_static_bw", "packers", ss=2.0),
        V("BR_STOCK_digital_screens", "palmers", ss=1.0),
        P("IMG_rights_at_work_campaign", "unions", focus=[0.5, 0.75], zoom=[1.25, 1.3]),
        V("BR_AI_07_letterbox_flyers", "teals", ss=3.0),
        V("BR_STOCK_sydney_street_timelapse", "and", ss=4.0),
        V("BR_STOCK_banknotes_aud", "billionaires", ss=8.5),
        V("BR_STOCK_newspaper_press_running", "newspaper", ss=16.0),
        P("IMG_howard_2006_ec", "sometimes", frame="framed", fh=980, label=dict(title="2007 · LOST OWN SEAT", sub="John Howard (left), 2002 photo", at="sometimes")),
        P("IMG_dutton_2018", "loses", frame="framed", fh=980, label=dict(title="2025 · LOST OWN SEAT", sub="Peter Dutton, 2018 photo", at="loses")),
    ], [
        O("voter", "and", "billionaires", explain=True, flyAt="@when"),
    ])
    seg("S43", [
        P("IMG_whitlam_headshot", None, frame="framed", fh=930),
        P("IMG_whitlam_after_dismissal_1975", "goff", focus=[0.3, 0.35], label=dict(title="Gough Whitlam", sub="Parliament House, 11 November 1975", at="goff")),
        P("IMG_kerr_governor_general", "whatever", frame="framed", fh=980, move="in", label=dict(title="Sir John Kerr", sub="Governor-General", at="whatever")),
        P("IMG_dismissal_demonstration_1975", "election", focus=[0.4, 0.4], label=dict(title="Parliament House, November 1975", sub="Crowds after the dismissal", at="election")),
        P("IMG_fraser_1977", "landslide", frame="framed", fh=980, label=dict(title="13 DECEMBER 1975", sub="Landslide win for Malcolm Fraser · 1977 portrait", at="landslide")),
        V("BR_STOCK_parliament_house_canberra", "didnt", ss=0.0),
        V("BR_AI_02_ballot_into_box", "it", ss=5.0, rate=0.7),
    ])
    seg("S44", [
        V("BR_AI_09_ballot_count_hands", None, ss=5.0),
        V("BR_AI_02_ballot_into_box", "but", ss=1.0, rate=0.8),
        V("BR_AI_10_pencil_marks_ballot", "one#2", ss=3.0, rate=0.7),
    ], [
        O("crown", "but", "one#2", path=[960, -60, 300], size=240),
    ])
    hold(2.2, [], [], name="beat after pencil", chapter=None)
    # ============================================================ OUTRO
    seg("S45", [
        P("IMG_parliament_house_blue_hour", None, move="in"),
        V("BR_STOCK_canberra_sunset_sky", "media", ss=5.0),
        V("BR_STOCK_parliament_house_canberra", "and", ss=0.0),
        P("IMG_parliament_house_flag", "worlds", move="up", zoom=[1.04, 1.12]),
    ], [
        O("cards", "think", "and", explain=True, title="Who holds the most power?", cols=4, cw=330,
          items=[dict(title="The media", at="@media", size=40), dict(title="The money", at="@money", size=40), dict(title="The parties", at="@parties", size=40), dict(title="The voters", at="@voters", size=40)]),
        O("endscreen", "and", "END", explain=True),
    ])
    hold(2.6, [V("BR_STOCK_canberra_sunset_sky", 0.0, ss=0.0)], [O("endscreen", 0.0, -0.01, explain=True, cont=True)], name="tail", chapter=None)
