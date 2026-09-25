# History Shorts rules (read on every run)

- Vertical 1080×1920, 30 fps. **No Remotion** and no other video frameworks.
- Stack: **SVG + renderFrame(t) + Playwright + ffmpeg only.** Claude Code builds the animations. Reuse `shorts/shared/render/`; put episode scenes in `shorts/sNN-…/render/`.
- Motion (required): every Short must be fun to watch — mix animation with stills, never Ken Burns / slideshow-only. Plan each VO beat as ANIMATE or STILL with a named motion (hook slam, orbit/satellite, map pin drop, debris particles, museum plaque, ticket print + ISSUED stamp, UNPAID stamp + year count, radio EQ + cash pop, loop punchline, etc.). Claude builds real SVG motion graphics for ANIMATE beats; use photos where the still carries the beat.
- Captions for history Shorts sit in the lower-middle band (~70% from top) (~70% (lower-middle band)); keep context badges clear of the caption band.
- Captions must never overlap animations, badges, stamps, cards, or other on-screen text. Default lower-middle (~70% from top); nudge per beat when a graphic occupies that band.
- Always reuse the approved history style kit in `shorts/shared/style/` once Checkpoint A is approved. Never redesign it without being asked.
- Timing always comes from the Whisper/transcript JSON for that Short.
- On-screen text only states facts from the Short's script.
- Keep text, faces and key action out of the bottom and right-edge areas where YouTube's buttons and title sit.
- Depict every people and culture with dignity. No sacred art or symbols, no violent or distressing images.
- Only use images with a verified free licence, recorded in SOURCES.md.
- Never commit files over 100 MB.
- Make and review a contact sheet before every final render.
- Stop and wait for "approved" whenever an issue asks you to.
- Do **not** use Remotion CLI or `src/episodes` Remotion compositions for history Shorts renders.
- **On-screen text rule (strict):** Captions (~70%) carry spoken words. Extra graphics text ONLY for names, places, key facts, and artifact prop text. Short frame-1 hook OK if not a full spoken sentence. NO VO-echo titles that restate narration (no speech-echo slam titles, punchline cards, multi-line story cards).
- **Motion-graphics quality bar (preferred channel look):** Photo-underlay + SVG motion graphics on top (s01 Skylab style). Every major beat uses a full-bleed photo via `stillLayer(url, { dim, scale, driftX/driftY })` (dim ~0.4–0.55) with real SVG motion overlays (orbit rings, stamps, particles, pin drops, kinetic labels, tickets, bars, plate rotate-in, etc.). Slight Ken-Burns drift on stills is OK as underlay motion only — never slideshow-only. Illustrated cartoon worlds as the sole background are not the preferred look. Keep captions clear of graphics.
- **Still accuracy rule (strict):** Never choose random or filler photos. Every still must be INTERESTING and FACTUALLY CORRECT for that beat (right place, person, artifact, era). Examples: Lincolnshire parish must be flat English countryside — never alpine/mountains; Euston beats need real London Euston / cemetery-swallowed station context; Mauritius must read as Mauritius coast/port; dig beats need archaeological / railway excavation feel; ship/voyage beats need Investigator / Flinders chart / historically relevant art; Trim needs black cat or Trim statue; portrait beats need actual Flinders likeness (PD art). Document licence + why it fits in `images/SOURCES.md`.

- **Images (strict):** every still must be interesting and factually correct for that beat (right person, place, artifact, era). Never random/filler or geographically wrong stand-ins. Free licence in SOURCES.md; no AI historical stills.
- **Preferred cut style:** photo underlay + MG overlays every beat (Skylab pattern); not cartoon-world primary; not slideshow-only.

## Quality ownership (locked 2026-09-26)
- **You (Claude Code) design and animate** every Short at best quality — premium motion graphics, same attention to detail every episode.
- Production manager only manages assets, review, and delivery — never ships basic placeholder SVG.
- Preferred look: photo underlay + designed MG on top (Skylab bar). Not clip-art overlays. Not Ken Burns slideshow.
- Images: interesting + factually correct only; no AI historical stills; no geographically wrong stand-ins.
- On-screen text: names/places/key facts/artifact text only. No VO-echo titles.
