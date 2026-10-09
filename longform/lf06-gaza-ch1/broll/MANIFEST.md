# lf06 Ch1 B-roll manifest

| ID | File | Seg | Prompt variant | VideoReview |
|---|---|---|---|---|
| AI03 | AI03_cavalry_silhouettes.mp4 (10.04 s, 1280x720, mute) | S08 | b_v2: long line of tiny distant riders on a far dune ridge, sepia haze, very slow pan | PASS 6/10 — very minor stiffness; distance hides it. Use a calm 5–6 s window, as a short shot; first AI clip: small "Dramatised reconstruction" label in the edit |
| AI05 | AI05_suitcases_ship.mp4 (10.04 s, 1280x720, mute) | S11 | a_v2: two leather suitcases on a deck planks, dawn glow, slow push-in | PASS 6/10 — minor latch wobble on the left case; background stable. Use 5–6 s |

Rejected after VideoReview (kept in `_rejected/`, do not use): first-pass versions (horse leg morphing; morphing water) and variants AI03 a_v1/a_v2/b_v1, AI05 a_v1/b_v1/b_v2 (leg melting, strap melting, railing warping).
Fallbacks if Claude sees a glitch on screen: AI03 -> PH02 PAN; AI05 -> PH05 PAN.
Both are 720p (Grok Imagine 1080p is not on this account); upscale to 1080p in the edit with the film grain overlay.
