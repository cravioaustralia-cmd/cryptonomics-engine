# PASTE BRIEF — Cravio AI sales video (motion graphics only)

You are building a **premium motion-graphics sales video** for **Cravio AI** (Australian AI consultancy, tagline *"AI that runs like a factory."*). Everything you need is in `promo/cravio-sales-video/` on branch `scaffold/cravio-sales-video` of `cravioaustralia-cmd/cryptonomics-engine`. You own all design, animation, timing, mixing and rendering. Remotion (React) is approved for this project; add it under `promo/cravio-sales-video/remotion/` (or a similar code-driven tool). Aim for the polish of a Stripe/Linear/Vercel launch film: crisp vector work, confident kinetic type, physically-plausible easing, nothing static for more than a beat.

## 0. Inputs (read these first)
- `script.md` — the source of truth: scene tables, VO lines, on-screen text, motion direction, music/SFX cue sheets, fact-check notes. **Use the "Scene 11 fix" line.**
- **VO is RECORDED (Atlas voice, raw, unprocessed) — use as-is, do NOT re-record or regenerate:**
  - `vo/hero_vo.mp3` — 68.86 s (hero cut). Text: `vo/read_hero.txt`.
  - `vo/social_vo.mp3` — 16.68 s (social cut). Text: `vo/read_social.txt`.
  - Whisper check: all words present, no omissions; phone read as "0478 953 337" (domestic format, as scripted). You may clean (gentle high-pass, de-ess, light compression), and you may split it at phrase gaps to place lines, but never time-stretch or pitch the speech.
  - **Hero VO is ~69 s against an 85 s target.** Re-time every scene to the real VO (detect phrase boundaries, e.g. with Whisper word timestamps, and drive scene starts from one timing JSON). Fill the ~16 s difference with **music-led breathing room**: a short instrumental hook before the first line or at the 0:21 logo drop, longer pauses on the scene 5 logo reveal and the scene 10 "Approve" hero moment, and the ≥ 2 s final hold on the end card. Final hero length can land anywhere in ~75–85 s; don't pad with dead air. The social VO (16.7 s) fits the 18 s cut, ending on the ≥ 2 s hold.
- `assets/logo/` — Circuit Track C mark. On navy use `*-colour-on-dark.svg` or `*-white.svg` ONLY (never the navy-track `*-colour` on navy). Horizontal, stacked and icon layouts. Outlined paths — never retype the wordmark.
- `assets/hero/hero.svg` (layered) + `assets/hero/layers/*.svg` (same layers as separate files) + `ANIMATION-NOTES.md`. Layer IDs: `layer-background`, `layer-assembly-tracks` (`track-main`, `track-loop`, `track-riser`), `layer-circuit-traces` (`trace-1..3`), `layer-data-pulses` (`pulse-1..5`), `layer-agent-nodes` (`agent-1..3` + labels), `layer-factory-motif`, `layer-hero-mark`, `layer-copy` (placeholder copy: do not use; set live type).
- `assets/icons/*.svg` — 24px line icons, `currentColor`, stroke 1.75: `agent-rfq-quote`, `agent-spec-catalogue`, `agent-order-status`, `agent-lead-research`, `agent-content-engine`, `service-ai-agents`, `service-content-marketing`, `service-custom-solutions`. Scale up as vectors; keep the stroke weight visually consistent (non-scaling stroke or re-weighted).
- `assets/illustrations/` (problem / how-it-works / proven-factory / CTA spots), `assets/brand-kit/brand-kit.md` + board, `assets/overview.png`.
- `assets/fonts/` — Space Grotesk and Inter (variable + static TTFs, OFL). Load locally; no web font fetching at render time.
- `music/` — 3 options (Kevin MacLeod, CC BY 4.0): `kmacleod-voxel-revolution.mp3`, `kmacleod-digital-lemonade.mp3`, `kmacleod-inspired.mp3`. Audition all three against the script's "modern industrial-electronic, ~110–120 BPM, drop on the logo" brief, pick one, and record the choice + required credit line in `final/CREDITS.txt`.
- `sfx/` — 11 cues: `ui_notification_pop`, `ui_click_scifi`, `ui_select_modern`, `ui_typing_soft` (long: trim), `glitch_small_electric`, `impact_whoosh_deep`, `riser_synth`, `whoosh_fast_transition`, `whoosh_fast`, `whoosh_simple_pixabay`, `chime_correct_tone`. You may build further cues (conveyor clack, stamp, gate) by layering/trimming/pitching these; don't pull un-licensed audio. Anything new you source must be added to `SOURCES.md` with URL + licence.
- Reference site (tone, claims, layout): https://cravioai-200.netlify.app

## 1. Brand system (non-negotiable)
- Colours: Navy `#0A1628` (ground), Cyan `#00C2B2` (accent, traces, ticks, CTAs, data pulses), Mist `#F4F7FA` (primary type on navy), Slate `#64748B` (secondary/captions), Line `#E2E8F0`. Allowed depth: navy→`#12263F` gradient as in hero.svg, subtle cyan glow (the hero's soft-glow filter). Amber is allowed ONLY as a small status colour for "Missing spec" / "Delay" / "Waiting" tags (script calls for it); red only for the scene-1 "Waiting 3 days" tag. No other hues, no rainbow gradients.
- Type: Space Grotesk Bold for headlines/kinetic type, Space Grotesk Medium for UI labels/buttons, Inter (400/500/600) for small UI body text inside mockups. Tight tracking on headlines (-1 to -2%), generous line height in UI.
- Logo: clear space ≥ ¼ icon height; no stretch, rotate, stroke, shadow or gradient on the mark; animate it by *drawing* the track (stroke-dashoffset) and popping the cyan nodes, then settle to the exact static logo.
- No people, faces, hands or silhouettes. "Your team" = cyan approval tick / "Approve" button. No robots, brains or sparkles.
- UI mockups: generic, unbranded, fictional placeholder data only (e.g. "Part #EX-2041", "Customer: Sample Pty Ltd"). Xero, MYOB, HubSpot, Gmail, Outlook as **plain text labels only**, no logos.

## 2. Motion language
- Motif: the **circuit/conveyor track**. Cyan PCB-style traces carry work items (emails, quotes, posts) station to station. Reuse `track-main` / `track-loop` / `track-riser` geometry and `pulse-*` dots as the connective tissue between scenes, so the film feels like one continuous camera move along a production line.
- Easing: no linear moves. Use springs (Remotion `spring`, damping ~14–20, mass ~0.6–1) or cubic-bezier ease-out-expo / ease-in-out-quart; small overshoot on pops (≤ 6%); motion blur or 1–2 frame smears on fast whips. Stagger list items 2–4 frames.
- Kinetic typography: word- or line-level reveals synced to VO syllables (mask wipes, y-offset + opacity, per-letter for the tagline only). Key on-screen text from the script must be burned in (sound-off friendly). Max ~7 words on screen at once outside the UI mockups.
- Cuts land on beats of the chosen track (~110–120 BPM); align the music drop to the logo draw at ~0:21.
- Depth: 2.5D parallax layers (background grid → tracks → nodes → UI cards), soft shadows `rgba(0,0,0,.35)` on cards, subtle cyan glow on active items. Keep it clean — premium = restraint plus precision.
- Safe areas: 16:9 title-safe 5%; 9:16 keep the top 15% and bottom 20% clear of key type.

## 3. Hero cut — 16:9, target ~75–85 s (timecodes below are the script's; re-time to the recorded 68.9 s VO)
| # | Time | VO (exact) | On-screen | Build direction (from script, push it further) |
|---|---|---|---|---|
| 1 | 0:00–0:03 | "Your quotes are waiting. Your customers aren't." | RFQ waiting… → Customer: "Any update?" | Inbox UI slams in full-frame, unread RFQ, red "Waiting 3 days" tag ticking up; on "aren't" second email drops, stack shakes. Hard cut on a hi-hat stop. SFX: notification pop, tick, thud (impact trimmed). |
| 2 | 0:03–0:10 | "You run lean. The same people quoting, packing and chasing invoices are meant to be posting on LinkedIn too." | Quote. Pack. Chase. Post. | Four line icons (quote doc, box, invoice, unbranded post card) stack onto one small cyan circle "Your team"; stack wobbles (spring). Topples → match-on-motion into 3. |
| 3 | 0:10–0:16 | "Spec questions. 'Where's my order?' A website nobody's had time to touch." | "Which earth rod for clay soil?" · "Where's my order?" · Website: last updated… | Chat bubbles pop and multiply into a grid; browser mockup desaturates and gathers dust particles. Iris to a dot. |
| 4 | 0:16–0:21 | "You know you should be using AI. You just don't have the hours." | Both lines, line by line | Kinetic type; clock icon whose hands become a never-finishing spinner; spinner morphs into the Circuit Track C (riser under). |
| 5 | 0:21–0:26 | "Meet Cravio AI. AI that runs like a factory." | Cravio AI · AI that runs like a factory. | Logo draws as a cyan trace, nodes pop, pulse; traces shoot outward and become the conveyor spanning the frame (hero.svg tracks/traces/pulses). **Music drop.** Camera rides right. |
| 6 | 0:26–0:36 | "We build and deploy AI agents for your firm. One reads emailed RFQs, matches your catalogue and price list, and drafts the quote in your template." | RFQ / quote-draft agent · Matched: catalogue + price list · Missing spec flagged | Station 1 (`agent-rfq-quote` icon as station badge): email enters, part numbers highlight and connect by lines to a catalogue table, quote doc assembles line by line; amber "Missing spec" flag pops. Typing ticks. |
| 7 | 0:36–0:44 | "Another answers spec questions from your datasheets, citing the source. Another drafts order-status replies, and escalates delays." | Spec assistant: cites source · Order status → reply drafted · Delay → escalated | Station 2 (`agent-spec-catalogue`): chat answer + "Source: datasheet p.4" chip linked to a PDF icon. Station 3 (`agent-order-status`): table row turns amber, draft reply + "Escalated to team" tag. |
| 8 | 0:44–0:49 | "And one researches leads and drafts outreach for your sales rep." | Lead research & outreach · Spam Act compliant | Station 4 (`agent-lead-research`): generic cards "Builder / Contractor / Distributor" enrich with data chips, draft email card appears; small shield "Consent + unsubscribe". Track loops up (`track-riser`). |
| 9 | 0:49–0:58 | "Then there's the content engine: product launches and factory footage become LinkedIn posts, blogs, reels, SEO pages and newsletters." | Research → LinkedIn & blog → Reels → SEO pages → Newsletters | Second conveyor (`agent-content-engine`): "Product launch" file + abstract film-strip icon split into five format cards that stamp out on the beat with a cyan stamp. Slide into one review queue. |
| 10 | 0:58–1:05 | "Nothing goes out until a person on your team says yes." | Nothing goes out without a human yes. | **Hero moment — hold it.** All items queue at an "Approve" gate; cursor clicks a cyan ✓ (click SFX), gate opens, items flow to "Scheduled" / "Sent". Music pulls back to pad. Big ✓ scales up and wipes the frame cyan (whoosh). |
| 11 | 1:05–1:11 | "Got a problem that doesn't fit a box? We'll build custom AI around it." | Custom AI solutions · Xero · MYOB · HubSpot · Gmail · Outlook (text labels) · connected to the tools you already use | Odd puzzle piece "Your problem" gets a custom piece machined to fit (`service-custom-solutions`); text-label nodes connect via traces. Pull back to an aerial of the whole factory. |
| 12 | 1:11–1:17 | "Built by a manufacturing family. Priced to your needs." | Built by a manufacturing family. · Priced to your needs. | Aerial: the conveyor network forms the C logo shape; two lines lock in. Fade through navy. |
| 13 | 1:17–1:25 | "Book your free 30-minute AI audit at cravioai.com, or call 0478 953 337." | Book a free 30-minute AI audit · cravioai.com · +61 478 953 337 · logo + AI that runs like a factory. | CTA kinetic build; URL types out with a cursor; phone counts in digit by digit; horizontal on-dark logo settles bottom-centre, C trace pulses once (chime). **Hold final frame ≥ 2 s**, then black. |

## 4. Social cut — 9:16 1080×1920, target 18 s (sound-off first)
| # | Time | VO (exact) | On-screen | Direction |
|---|---|---|---|---|
| 1 | 0:00–0:03 | "Your quotes are waiting. Your customers aren't." | Your quotes are waiting. / Your customers aren't. | Full-frame inbox, ticking "Waiting" tag, "Any update?" slams in. Hard cut. |
| 2 | 0:03–0:09 | "Cravio AI builds agents that draft quotes, answer spec questions and reply on orders." | Draft quotes. Answer specs. Reply on orders. | C logo flash, fast vertical conveyor carries three items, each stamped cyan ✓. Whip pan. |
| 3 | 0:09–0:13 | "Plus content that runs itself, with a human approving everything." | Posts · Reels · SEO · Newsletters · ✓ Human approves every output | Four format cards stack; "Approve" clicked; ✓ wipe. |
| 4 | 0:13–0:18 | "Book your free AI audit at cravioai.com." | AI that runs like a factory. · Free 30-min AI audit · cravioai.com · +61 478 953 337 | Stacked on-dark logo draws, CTA + URL type in. Hold ≥ 2 s. |
Music: 4-bar cut-down of the hero track starting on the drop. Re-compose for vertical — do not just crop the 16:9 frames. Optional bonus: 1:1 1080×1080 of the same cut.

## 5. Audio
- Music sits under VO, ducked ~10–14 dB while VO speaks (sidechain or keyframed), up in gaps and on the drop/CTA.
- SFX **sparse and tasteful**: ~1 cue per scene max except the conveyor/stamp rhythm in 6–9; follow the script's SFX table. No cartoon sounds.
- Master each deliverable to **-14 LUFS integrated (±1), true peak ≤ -1.5 dBTP** (e.g. ffmpeg `loudnorm=I=-14:TP=-1.5:LRA=11`, two-pass). Report measured values in `final/CREDITS.txt`.

## 6. Deliverables (commit to `promo/cravio-sales-video/final/`)
- `cravio_hero_16x9_1080p.mp4` — 1920×1080, 30 fps (or 60), H.264 high, yuv420p, AAC 48 kHz 320k.
- `cravio_hero_16x9_4k.mp4` — 3840×2160 if render time allows (vectors, so it should).
- `cravio_social_9x16_1080x1920.mp4` — 18 s.
- `final/CREDITS.txt` — chosen music + CC BY credit line, SFX licences, loudness readings, any deviations.
- Keep source (Remotion project, timing JSON) committed; do not commit `node_modules` or render caches (add a .gitignore).
- Commit and **push to `scaffold/cravio-sales-video`**. **No PR, no merge.** Never commit `shorts/incoming-vo/*` or `shorts/s19-emu-war/images/*`. Use Git LFS or check repo size if MP4s are large.

## 7. Content rules (hard)
- **NO invented stats, numbers, clients, testimonials, logos, case studies or prices.** Use only claims in `script.md` or on https://cravioai-200.netlify.app. Do not name MB Enterprises; do not say "proven in our own factory".
- **CTA exactly:** book at **cravioai.com** or call **+61 478 953 337** (on-screen format). VO reads it as "0478 953 337" per the script.
- Keep "free 30-minute AI audit" as scripted (open question: the site says 30–45 minutes; if Abhishek changes it, the line becomes "free AI audit").
- Australian English spelling throughout.

## 8. Quality bar / self-check before pushing
Watch both renders end to end: no text overflow or safe-area violations, no typos, logo variant correct on navy, every on-screen claim traceable to the script, CTA characters exact, cuts on beat, loudness/TP measured and within spec, final frame holds ≥ 2 s.
