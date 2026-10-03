# lf01 log

2026-10-03 14:17 AEST — Scaffold only. Production script v2 copied byte-for-byte into `script/script.md` from the text extract (page breaks left in). `PASTE_BRIEF.md` written for a paste into Claude Code. No scenes, no plates, no VO, no B-roll, no YouTube. Branch `scaffold/lf01-if-australia` off `main` (`d9aa880`). Issue opened as a pointer only, with no at-mention.

2026-10-03 16:20 AEST — Full uncut V01–V34 seated from the user's second PDF. Atlas, Australian English, documentary pace. Files in audio/vo/. Part 3 of script.md replaced with the uncut lines. B-roll B01–B12 already in broll/. V28 was re-recorded after the first take said Dakota. The seated file says Kokoda.

2026-10-03 — Claude Code build (paste brief). Long-form 16:9, 1920×1080, 30 fps. SVG + `renderFrame(t)` + Playwright + ffmpeg; no Remotion.
- Whisper (faster-whisper medium.en) on all 34 takes; cut locked to real words with the Part 2 gaps. 0.4 s breath seams where Part 2 marks no gap. Narration runs 10:05 (script estimate ~8:20), so the cut is 10:55 including the 10 s end screen. Not trimmed to force 9:00.
- Whisper slips (Birdham, Stewart, Ulungora, "curtains turned", Millan Bay) were not used for text; on-screen spellings follow the script. In V10, Whisper hears "would eat around ten to twelve divisions" where Part 3 says "would need". The take was left as recorded.
- Mid-roll holds at 3:02 and 7:22. Big "1/2/3" at 3:02, 5:21, 7:22. End screen from 10:45.
- 12 B-roll clips trimmed to their Part 2 lengths and composited by ffmpeg as zoom-throughs (iris from the pin, 0.3 s in, 0.35 s back into the pin). "Dramatised reconstruction" label on B01 only.
- John Curtin: no photo in this render. Commons is blocked by the session egress policy, so the V09 card is an archive nameplate. Drop the file at `render/archive/curtin.jpg` and re-render to add it (see SOURCES.md).
- Matthias Ulungura: map label only.
- Mix: VO untouched (−22.0 LUFS assembled), Mixkit beds, in-house SFX, series sting invented here. Two-pass loudnorm on the master only (linear) after a 4× oversampled peak limiter. Delivered MP4: −14.0 LUFS, −1.6 dBTP (final/loudnorm-report.md).
- Final: `final/lf01-if-australia.mp4`, 10:55, 1920×1080/30, H.264 two-pass ~1.0 Mbit/s + AAC 192 kbit/s (94 MiB, kept under GitHub's 100 MiB file limit). For a higher-bitrate upload master, rebuild with `python3 render/compose.py --crf 18` (about 250–300 MB, not committed).
- Review notes on delivered B-roll (not swapped, per brief): B04 reads as a modern ferry/catamaran rather than a 1940s landing craft (avoid-list risk: modern vehicles). B11 soldiers wear US-style helmets. B12 shows faces at the rail (not identifiable real people). Regenerate B04 if Video Production agrees.
