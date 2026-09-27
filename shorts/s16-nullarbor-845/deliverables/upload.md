# Upload: s16 Nullarbor +8:45 (unofficial Central Western Time)

**File:** `shorts/s16-nullarbor-845/deliverables/s16-nullarbor-845.mp4` (1080×1920, 30 fps, 37.06 s, H.264 + AAC 48 kHz, −14.5 LUFS / −1.5 dBTP, 25 MB)
**Contact sheet:** `shorts/s16-nullarbor-845/deliverables/contact-sheet.jpg` (frames from the encoded MP4, every 2.5 s plus the last frame)
**Task:** issue #32. **Status:** ready for Checkpoint C review; do **not** upload until it's approved.

## Title (pick one)
1. Australia's Time Zone That No Law Created #shorts
2. The Nullarbor Runs on +8:45 Time #shorts
3. The Weirdest Time Zone in Australia #shorts

## Description
There's a strip of the Nullarbor Plain, where Western Australia meets South Australia, that runs on its own time: UTC+8:45. Perth is 8 hours ahead of world time and Adelaide is 9 and a half, so a few roadhouses in between split the difference. It's one of the only quarter-hour offsets on Earth. There are even highway signs telling drivers to change their clocks, yet no government ever made it official, and nobody's sure exactly when it began.

#australia #nullarbor #timezone #roadtrip #westernaustralia #southaustralia #history #shorts

**Map:** NASA satellite imagery (public domain) over AWS Terrain Tiles relief (SRTM/GMTED/ETOPO1, public domain). Map treatment rendered by the channel.

**Image credits**
- Entering Central Western Time Zone: Groogle / Wikimedia Commons, CC BY-SA 4.0
- Eyre Highway, South Australia (on Nullarbor Plain): Chuq / Wikimedia Commons, CC BY-SA 4.0
- Eyre Highway, Western Australia (near Caiguna): Chuq / Wikimedia Commons, CC BY-SA 4.0
- Nullarbor Plain: OliveDenim / Wikimedia Commons, CC BY-SA 4.0
- Eucla Hotel Motel, 2017: Bahnfrend / Wikimedia Commons, CC BY-SA 4.0
- Checkpoint, Border Village, 2017: Bahnfrend / Wikimedia Commons, CC BY-SA 4.0
- SA–WA border sign, October 2023: Chuq / Wikimedia Commons, CC BY-SA 4.0
- Perth CBD skyline, 2022: Kgbo / Wikimedia Commons, CC BY-SA 4.0
- Adelaide skyline, December 2022: Ardash Muradian / Wikimedia Commons, CC BY-SA 2.0
- Nullarbor Plain satellite image: NASA, public domain

Licences: https://creativecommons.org/licenses/by-sa/4.0/ · https://creativecommons.org/licenses/by-sa/2.0/

**Music:** "Traveling Along" by Ahjay Stelino (Mixkit Stock Music Free Licence) · **SFX:** Mixkit · **Font:** Oswald (SIL OFL)

## Tags
nullarbor, nullarbor plain, eucla, eucla time, central western time, cwst, utc+8:45, time zone, australian time zones, eyre highway, border village, western australia, south australia, road trip australia, weird time zones, shorts

## Pinned comment
Have you ever driven the Nullarbor and changed your watch by 45 minutes? ⏰

## Settings
- Made for kids: **No**
- Altered or synthetic content: **No** (real photos, NASA satellite imagery and terrain data with motion graphics; no AI-generated images)
- Category: Education
- Language: English (Australia)

## Review checklist (Checkpoint C)
- [x] **Hook and loop.** Frame 1 shows the unspoken `+8:45` flip clock over the Eyre Highway. The loop line "Yet to this day," whips back to that exact composition while the digits re-flip. The last frame matches frame 1 (mean pixel difference 1.0/255 outside the caption band), so the line cycles into "There's a strip of Australia…".
- [x] **Locked map.** It uses a real topo basemap (AWS Terrain Tiles relief and bathymetry) coloured with the real NASA Nullarbor satellite still, georeferenced. On top are parchment WA / SA fills with the terrain visible through them, a thick white outer glow on the coast and the 129°E border, soft shadows, and bold 3D labels (`NULLARBOR PLAIN`, `WA`, `SA`, `EUCLA`, `BORDER VILLAGE`, `EYRE HWY`, `CWST`). Only the Nullarbor / WA–SA / Eucla corridor is shown.
  - `s16_03` (MODIS "South Australia") was **not** used. It shows Spencer Gulf and the Flinders Ranges, not the Nullarbor.
- [x] **Captions.** They sit at ~70% from the top on Whisper word timings, corrected to the script. Graphics stay out of the caption band, the bottom UI zone and the right edge.
- [x] **On-screen text.** It is limited to names, places, facts and prop text:
  - `+8:45`, `NO LAW`, `8:45`
  - `NULLARBOR PLAIN`, `WA`, `SA`, `WA–SA BORDER`
  - `PERTH +8` / `AWST`, `ADELAIDE +9:30` / `ACST`, `UTC`
  - `EUCLA`, `BORDER VILLAGE`, `EYRE HWY`, `CWST`
  - `UTC+8:45`, the `UTC OFFSETS` dial with `¼ HOUR`, `+45 MIN`
  - the `TIME ZONES` register with its `UNOFFICIAL` stamp, `NO STATUTE`
  - `BEGAN ????`
  
  There are no VO-echo titles.
- [x] **Soft facts.**
  - The offset is described as unofficial or "no statute", never "illegal".
  - Only Eucla and Border Village are named. The other roadhouses are unlabelled dots.
  - The rarity dial shows other quarter-hour offsets as unlabelled ticks, which supports "one of the only", not "the only".
  - No founding year is stated; the year counter never settles.
  - Perth and Adelaide offsets are standard time.
- [x] **Mix.** The VO measured −22.75 LUFS and got a static +6.75 dB gain plus `apad`. It then goes through a float amix with the music (from 2.0 s) and 55 SFX, and a two-pass loudnorm on the master only. There is no VO loudnorm before amix.
  - Whisper on the final MP4 recovers every VO word, and the loop tail "day" runs 36.52–37.04 s.
