# Shot plan — s09-wombat-cube-poop (Checkpoint C hand-off)

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline in `shorts/shared/render/` (no Remotion).
- Every beat uses a full-bleed, factually tied photo/schematic underlay with MG Skylab-style overlays: restrained parallax/crop, cube outline stamps, intestine stiffness callouts, territory pin, prize badge, type, particles and practical texture. Do not invent AI “historical” stills or fake wombat anatomy diagrams.
- No AI stills. Cube scat is shown as respectful science / nature photography — not gross-out filler. Prefer dim underlays (~0.4–0.55) with MG that keeps the comic curiosity tone light.
- Captions remain in the lower-middle safe band. Keep extra MG text sparse: the frame-1 hook `PERFECT CUBES`, `WOMBAT`, `~100 / NIGHT`, `ROUND → CUBE?`, `STIFF / STRETCHY`, `TERRITORY`, `PRIZE`, and the loop closer only where useful. Do not echo whole VO sentences as titles.
- Crossfade at seams. The final frame should loop back to the opening “perfect cubes” language.

## Beat table

Approximate seams for the held **33.792 s** Atlas VO. Claude must retune against Whisper word timings.

| # | Time (s) | Mode | Photo/scan underlay (factually tied) | Named motion / MG treatment |
|---|---:|---|---|---|
| 1 | 0–4.4 | ANIMATE | `s09_01_cube_scat_certified.jpg` — cube-shaped wombat scat (CC BY-SA 3.0); unspoken hook | Frame-1 hook `PERFECT CUBES`; cube outline slam + soft ground parallax; amused impact on “weirder.” |
| 2 | 4.4–9.0 | ANIMATE | `s09_02_common_wombat_maria.jpg` — common wombat, Maria Island (CC BY-SA 4.0); species reveal | Wombat push-in; `WOMBAT` name chip; wipe toward cube count |
| 3 | 9.0–12.2 | ANIMATE | `s09_04_cube_scat_close.jpg` — museum specimen cubes with scale coin (CC BY-SA 4.0); “up to a hundred… every night” | Cube stack / counter tick `~100`; night-tint drift; `EVERY NIGHT` stamp |
| 4 | 12.2–16.0 | ANIMATE | `s09_03_common_wombat_side.jpg` — common wombat side view, Maria Island (CC BY-SA 4.0); round-hole puzzle beat | Curious zoom; `ROUND → CUBE?` kinetic question; soft circle→square morph in MG (not fake anatomy) |
| 5 | 16.0–22.0 | ANIMATE | `s09_05_digestive_diagram.png` — PD human digestive schematic as intestine stand-in; stiff/stretchy walls research | Diagram hold + highlight bands; `STIFF` / `STRETCHY` alternating labels; corner-squeeze particle cue on “corners” |
| 6 | 22.0–27.0 | ANIMATE | `s09_07_cube_scat_cradle.jpg` — Cradle Mountain cube scat (CC0) +/or `s09_06_burrow_narawntapu.jpg` burrow+scat habitat; rocks / territory theory | Rock/log pin drop; `TERRITORY` badge; cube that *doesn’t* roll (MG anti-roll) |
| 7 | 27.0–31.2 | ANIMATE | `s09_08_science_medal.jpg` — PD science-award medallion (abstract prize; **not** Ig Nobel logo) | Medal rotate-in; `PRIZE` stamp; soft trophy sparkle; punchline build |
| 8 | 31.2–33.792 | ANIMATE | `s09_01_cube_scat_certified.jpg` (callback) — loop punchline | Cube slam callback to beat 1; hook line reassembles for loop |

## Still inventory / factual guardrails

1. Certified cube scat — real brick/cube-shaped wombat faeces; hook only.
2. Maria Island common wombat — *Vombatus ursinus*; species reveal.
3. Side-view common wombat — same species; round-hole / animal continuity beat.
4. National Poo Museum cube specimens — science photography with scale; hundred-cubes beat (not gross-out).
5. Digestive-system diagram (PD) — **human** schematic stand-in for “scientists studied intestines”; MG must not claim it is a wombat gut photo. Prefer abstract stiffness bands over fake wombat anatomy.
6. Narawntapu burrow + scat — Tasmanian habitat / territory deposition context.
7. Cradle Mountain cube scat (CC0) — cubes on ground / bush; “don’t roll away” underlay.
8. US National Medal of Science illustration (PD) — abstract “scientists won a prize” underlay. Real-world referent is the **2019 Ig Nobel Physics Prize** (Yang et al.) — documented in `fact-check.md`; do **not** invent Ig Nobel branding or fake ceremony stills.

No AI wombat-anatomy fakes, no square-anus jokes as literal diagrams, no unlicensed Soft Matter paper figures.

## Audio hand-off

- Held Atlas VO: `audio/vo.mp3` (33.792 s); **do not re-record**.
- Bed: `music/music.mp3` and `audio/music.mp3` — **Fun and Games** by Ahjay Stelino, Mixkit Free Music Licence (light / quirky / curious — not dark sci-fi). Claude owns ducking, timing, loudness and final mix.
- SFX: `sfx/` contains selected reviewed Mixkit shared-kit cues; source URLs are in `sfx/sources.tsv`.
