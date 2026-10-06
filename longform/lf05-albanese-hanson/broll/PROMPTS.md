# lf05 AI B-roll — prompts (Grok Imagine, Video mode, 16:9)

**Generation status (6 Oct 2026): NOT generated in this pass.** This executor had no Grok Imagine access (no browser/Imagine tool). The parent should generate B04–B09 below (one clip each, 6 s, 720p, 16:9) and save as `broll/B04.mp4`… with a MANIFEST row each. B01–B03 already exist (REUSE from lf03, see `MANIFEST.md`).

AI B-roll is the **last** picture layer (script Part 4.1 ≈10%, and real footage first). Only use where no real clip in `footage/` fits.

## Rules (script Part 4.7 + series rules)

- People-free: no faces, no hands unless stated, no recognisable real person, no likeness of any politician.
- No flags, no party logos, no campaign material, no brand names, no readable text or numbers (digits must be blurred/unreadable — real numbers go in GFX).
- No religious dress, no ethnic or religious symbols. No Parliament interiors posing as real events.
- First AI clip on screen gets a small **"Dramatised reconstruction"** label in the edit (never baked into the mp4).
- Mute.

**Style anchor (prepend to every prompt):**
`Cinematic documentary B-roll, 16:9 widescreen, natural colour, gentle film grain, shallow depth of field, slow camera movement, realistic Australian setting, no text, no logos, no flags, no recognisable people, faces not visible:`

## To generate (parent)

| ID | Script asset | Seg | Prompt (after style anchor) |
|---|---|---|---|
| B04 | BR_STOCK_petrol_price_board_night (no free AU clip found) | S10, S24 | slow push-in on a tall roadside fuel price sign at night beside a suburban Australian road, glowing digits completely out of focus and unreadable, no brand name or logo, light drizzle, car headlights streaking past in soft bokeh, no people. |
| B05 | BR_STOCK_bills | S24 | household bills, an opened envelope and a basic calculator on a laminate kitchen bench in early morning light, all print blurred and unreadable, a kettle out of focus behind, no hands, no people. |
| B06 | BR_STOCK_for_lease_sign | S24 | empty small shopfront on a quiet Australian suburban strip, windows covered with brown paper and a plain blank white sign taped inside, no lettering anywhere, late afternoon light, slow sideways dolly, no people. |
| B07 | BR_STOCK_superannuation_documents | S26 | a manila folder of printed statements and a pair of reading glasses on a timber dining table, pages slightly fanned, all text blurred and unreadable, warm late-afternoon window light, no hands, no people. |
| B08 | BR_AI_vote_count_room (lf03 B06 rejected — people on monitors) | S34, S35 | empty vote-counting hall at night, rows of folding tables with neat stacks of blank paper ballots and plain cardboard ballot boxes, overhead fluorescent light, no screens, no signage, no people, slow high-angle drift. |
| B09 | "Please Explain" retro TV (text-only title card goes on in the edit) | S31 | a 1990s CRT television on a timber cabinet in a dim Australian lounge room, screen glowing with plain grey static and no image, curtains drawn, slow push-in, no people. |

Optional only if a hold runs short of real footage (prefer F01/F17–F20 Canberra): none proposed.

## Already present (REUSE from lf03 — prompts as recorded in `longform/lf03-hanson/broll/PROMPTS.md`)

| lf05 | lf03 | Prompt | Seg |
|---|---|---|---|
| B01 | B05 | ballot paper sliding into a ballot box, polling booth, no party names | S25, S34–S35 |
| B02 | B10 | empty red Senate benches, wide, no people, no readable crest text | S36 (Senate mechanics) |
| B03 | B11 | phone on a table, screen blurred, no readable post, no faces | S30, S31 (posts / "fire the liar" appeal) |
