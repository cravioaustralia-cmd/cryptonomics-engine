# lf10 build: how the cut is made

Everything here is reproducible from the branch. Picture is Remotion (`src/lf10/`), sound is a numpy mix, loudness is set on the master only.

## Pipeline

1. **Proxies.** Every clip in `footage/` and `broll/` is transcoded to a muted 1920×1080 30 fps H.264 proxy in `public/lf10/v/` (git-ignored). AI clips (`BR_AI_*`) are cropped at this stage: the bottom-right 192×108 px of the 1280×720 frame (where Grok places its watermark) is removed, then scaled up. Vertical clips are centre-cropped to 16:9. Stills are copied to `public/lf10/img/` (downscaled to ≤2400 px; the transparent Senate-ballot PNG is flattened onto white).
2. **ASR.** `faster-whisper large-v3` word timestamps for all 45 raw takes → `out/asr/Snn.json`. `asr_check.py out/asr` compares them with `vo-paste/` word by word (numbers spelled out on both sides).
3. **Timeline.** `build_timeline.py out/asr` places the 45 takes in order (each trimmed only at head and tail; never sped up, stretched or level-normalised), resolves every cut and overlay from the word anchors in `spec.py`, and writes `src/lf10/timeline.json` and `out/plan.json`. It refuses shots longer than 6 s, same-asset runs over 6 s, and clips that would run out.
4. **Mix.** `mix_audio.py` → `out/mix_premaster.wav`: narration at unity gain; nine chapter music beds normalised to −23 LUFS then automated (−41 LUFS under narration, −27 LUFS in holds, 0.45 s ramps); SFX only on picture changes. Hits are placed in measured pauses of the take, and the script reports any hit whose onset lands on voiced narration (currently 0).
5. **Picture.** `npx remotion render src/lf10/index.ts LF10 build/out/video_1x.mp4 --muted --crf=17 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`.
6. **Master.** `master.sh` → bus compressor + limiter on the full mix, then two-pass `loudnorm` (I −14, TP −1.5, linear); muxes `final/lf10_1x.mp4`; builds the 1.28× cut from the same picture (`setpts=PTS/1.28,fps=30`) and the same pre-master mix (`atempo=1.28`, pitch held), mastered the same way → `final/lf10_128x.mp4`.
7. **Checks.** `checks.py final/lf10_1x.mp4 final/lf10_128x.mp4` → `out/CHECKS.md`; `asr_final.py` transcribes the narration inside each final master → `out/asr_final_*.json`.
8. **Description.** `description.py` → `final/DESCRIPTION.md` (chapters for both cuts, credits for only the assets the timeline uses).

## Editorial decisions (beyond the brief's fallback table)

- **ParlView:** not used (APH conditions). All PV01–PV18 rows use their listed still or document fallback.
- **Polling-place photo dropped.** `IMG_polling_place_2022` shows readable party campaign posters (a Liberal banner, a Greens logo and an attack poster). It is not used anywhere. Its slots use the AI ballot-box clip (S10 "CASE OPEN"), Canberra dusk (S23) and suburbs aerial / AI ballot counting (Reveal).
- **Perth CBD clip dropped.** `BR_STOCK_perth_cbd_william_st` has "KEEP CLEAR" painted across the road for its whole length. Replaced by Elizabeth Quay (S17), Melbourne aerial (S40) and Chatswood (S42).
- **Lachlan Murdoch photo not used.** The file is a tight crop of one man, not the five-person group the asset note describes, and the Commons page could not be reached to confirm identity. A name node in the family-tree animation stands in (rule: missing photo → name card).
- **Softened for legibility rules:** newspaper page-flip, Vanuatu press, book pages and the Senate-ballot rendering (party logos and candidate names) are slightly blurred; the WACA clip is reframed and softened to keep the sponsor logo out; the gas-flare clip is reframed to drop its burned-in date stamp and only its two landscape sections are used; the Shibuya crowd is reframed below the billboards; Palmer's photo is reframed to drop a microphone logo.
- **No SFX on words:** S02's three mid-sentence shutter hits, the S06 paper slide and the S44 pencil were dropped because those cuts sit on spoken words.
- **Petition count:** the APH e-petition page shows 501,128 (validated) signatures; the script says 501,876 (Al Jazeera / AFP, The New Daily). The card follows the narration and its fact-sheet source, and the page is framed on its title, not its count.
- **Crack overlay (0.2):** drawn on the glass at the edge of the frame, away from Whitlam's face; the photo itself is not split or altered.
- **What-if beat (S21):** "if money alone could buy power…" plays over an AI room and the case-board animation, never real footage.
- **S38 balance:** the government's and the independents' cards come up together and share the screen equally.
