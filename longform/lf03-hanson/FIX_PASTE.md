# lf03 fix paste — patch the existing cut (do not rebuild)

Branch `scaffold/lf03-hanson`. Do **not** merge, open a PR, comment on GitHub, @ anyone, or upload to YouTube. Australian English.

This is a **fix on the finished master**, not a new film. Keep the existing edit/timeline, cards, photos, chapters, Abbott card (S14–S29), S22 bleep, ANALYSIS (S30), WHAT COULD HAPPEN (S35), and the first-AI-clip **Dramatised reconstruction** label. Do not redo design from scratch.

## 1) Voice — even pace

Replace narration with `audio/vo-even/S01.mp3`–`S37.mp3` (pitch held; originals in `audio/vo/` untouched). Re-time **picture only where a segment’s length changed**; leave on-target shots alone. Keep mix rules: quiet bed under voice, bed up in pauses, hits on picture not words.

## 2) Picture — real footage over AI

Drop in `footage/F01.mp4`… per `footage/CREDITS.md`. Prefer real clips over AI B-roll and over static photos where they match the narration. All muted, scaled to 1920×1080. Never on imagined/what-if beats. Real people only as themselves. Keep existing photos/cards where no clip fits. Skip ParlView (not in repo; terms too restrictive — see CREDITS).

## 3) Re-export master

Rebuild/export from the patched timeline at 1×, then deliver the whole film at **1.28× pitch held**, two-pass loudnorm on master only ~**−14 LUFS**, true peak ≤ **−1.5 dBTP**. Update `final/loudnorm-report.md`, chapter list with new times, contact sheet, and add footage credits to the credits file.

No YouTube. No PR. No merge.
