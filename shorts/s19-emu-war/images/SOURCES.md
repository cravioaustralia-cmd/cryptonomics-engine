# Image sources — s19-emu-war

All files under `images/`. Wikimedia Commons public-domain (AU Crown copyright expired pre-1976) or Creative Commons. No AI historical stills. No deceased-emu carcass hero frames.

**Mode:** Standard Skylab photo-underlay Short — **not** map-explainer. Correct geography: WA wheatbelt (Merredin / Campion district) + Australian emu (*Dromaius novaehollandiae*). Prefer WA emu stills; one arid NSW flock used only as species-correct scatter reference.

**Scaffold gaps for Claude (optional):** Trove 1932 newspaper scan/masthead as archival prop (PD era press); Sir George Pearce PD portrait (`File:George Pearce - Mills (cropped).jpg`); higher-res Lewis-gun detail if MG overlay needs it. Commons rate-limits blocked some optional pulls at scaffold time.

---

### s19_01_soldiers_resting_emu_war.jpg
- **Title:** Australian soldiers resting during Emu War
- **Author:** Unknown (Pickering Brook Heritage / AU government era)
- **Licence:** Public domain (Australian Crown copyright expired; pre-1976)
- **URL:** https://commons.wikimedia.org/wiki/File:Australian_soldiers_resting_during_Emu_War.jpg
- **Why it fits:** Period 1932 detachment still — open / pull-out / Meredith-era military mood.

### s19_02_lewis_gun_emu_war.jpg
- **Title:** Lewis Gun during Emu War
- **Author:** Unknown (Wazee Digital / AU government era)
- **Licence:** Public domain (Australian Crown copyright expired; pre-1976)
- **URL:** https://commons.wikimedia.org/wiki/File:Lewis_Gun_during_Emu_War.jpg
- **Why it fits:** Period Lewis machine gun in the field — machine-gun mechanics underlay + MG overlays.

### s19_03_mcmurray_ohalloran_lewis.jpg
- **Title:** Sergeant McMurray and Gunner J. O’Halloran with Lewis gun during Emu War
- **Author:** Unknown (Pickering Brook Heritage / AU government era)
- **Licence:** Public domain (Australian Crown copyright expired; pre-1976)
- **URL:** https://commons.wikimedia.org/wiki/File:Sargent_McMurray_and_J._O%27Hallroan_Emu_War.jpg
- **Why it fits:** Named RAA gunners with Lewis gun — army-sends / ops beats (not modern soldier stand-ins).

### s19_04_emus_coming_to_drink.jpg
- **Title:** Emus coming to drink (Emu War era)
- **Author:** Unknown (Pickering Brook Heritage / AU government era)
- **Licence:** Public domain (Australian Crown copyright expired; pre-1976)
- **URL:** https://commons.wikimedia.org/wiki/File:Emus_coming_to_drink_Emu_War.jpg
- **Why it fits:** Period emu field still tied to the 1932 operation.

### s19_05_fallow_caused_by_emus.jpg
- **Title:** Fallow caused by emus
- **Author:** Unknown (Pickering Brook Heritage / AU government era)
- **Licence:** Public domain (Australian Crown copyright expired; pre-1976)
- **URL:** https://commons.wikimedia.org/wiki/File:Fallow_caused_by_emus.jpg
- **Why it fits:** Farmland damage colour before / during the cull — “wrecking wheat farms.”

### s19_06_wheatbelt_merredin.jpg
- **Title:** Wheatbelt view near Merredin
- **Author:** Orderinchaos
- **Licence:** CC BY-SA 4.0
- **URL:** https://commons.wikimedia.org/wiki/File:Wheatbelt_view_near_Merredin.jpg
- **Why it fits:** Correct **WA Wheatbelt** landscape near Merredin (Campion district geography).

### s19_07_merredin_aerial.jpg
- **Title:** Merredin aerial 2017-01
- **Author:** Orderinchaos
- **Licence:** CC BY-SA 4.0
- **URL:** https://commons.wikimedia.org/wiki/File:Merredin_aerial_2017-01.jpg
- **Why it fits:** Aerial Merredin WA — wheatbelt town / farms context for 1932 ops area.

### s19_08_emu_running_monkey_mia_wa.jpg
- **Title:** Emu running on the beach at Monkey Mia, July 2020 01
- **Author:** Calistemon
- **Licence:** CC BY-SA 4.0
- **URL:** https://commons.wikimedia.org/wiki/File:Emu_running_on_the_beach_at_Monkey_Mia,_July_2020_01.jpg
- **Why it fits:** **Western Australia** emu at full run — Problem 2 speed beat (>40 km/h). Soft: beach ≠ Campion wheat paddock; use as WA sprint colour.

### s19_09_emus_stokes_np_wa.jpg
- **Title:** Emus at the boundary of Stokes National Park, January 2024 01
- **Author:** Calistemon
- **Licence:** CC BY-SA 4.0
- **URL:** https://commons.wikimedia.org/wiki/File:Emus_(Dromaius_novaehollandiae)_at_the_boundary_of_Stokes_National_Park,_January_2024_01.jpg
- **Why it fits:** **WA** emu group — flock / scatter Problem 1 colour.

### s19_10_emu_cape_range_wa.jpg
- **Title:** Cape Range National Park – Émeu d’Australie
- **Author:** Gfievet
- **Licence:** CC BY-SA 4.0
- **URL:** https://commons.wikimedia.org/wiki/File:Cape_Range_National_Park_-_%C3%89meu_d%27Australie.jpg
- **Why it fits:** **WA** emu portrait — resilience / punchline underlay.

### s19_11_emu_bibbulmun_wa.jpg
- **Title:** Emu, Bibbulmun Track, Western Australia 08 (15)
- **Author:** Firstac5
- **Licence:** CC BY-SA 4.0
- **URL:** https://commons.wikimedia.org/wiki/File:Emu,_Bibbulmun_Track,_Western_Australia_08_(15).jpg
- **Why it fits:** **WA** emu still — hook / loop / portrait beats.

### s19_12_emu_mob.jpg
- **Title:** Emu mob set free
- **Author:** MPF (derived from Chudditch)
- **Licence:** CC BY-SA 3.0
- **URL:** https://commons.wikimedia.org/wiki/File:Emu_mob_set_free.jpg
- **Why it fits:** Australian emu flock scatter reference (Fowlers Gap NSW arid station — correct species/country). Prefer WA flock (`s19_09`) when both fit; keep for Problem 1 scatter density.

---

## Build notes (Claude, Checkpoint C render)

- All 12 stills above are used; derived 9:16 crops / blurred fills / 2× prints live in `render/assets/` (made by `render/tools/prep_assets.py`, same licences as the sources). CC BY-SA crops are shared alike.
- `s19_08` (Monkey Mia) is cropped tight to the emu, excluding beach visitors; used as WA speed colour only, not as the Campion battlefield.
- `s19_09` is used as a wide pan plate (two WA emus drifting apart) for Problem 1.
- The period prints are 1932 photographs; no likeness of Major Meredith is claimed (his beat uses a nameplate over the detachment photo).
- **Newspaper props are stylised motion graphics**, not reproductions of any real masthead or article: generic “THE PRESS” masthead, headline “THE EMU WAR” / “EMU WAR” (the term used by the press at the time), factual sub-lines only (machine guns versus birds · Campion district, W.A. · guns withdrawn), placeholder body lines.
- Lewis gun, emus, speedo, calendar, brass, WA locator glyph: vector MG drawn in `scenes.js` (WA outline hand-plotted from approximate coastline coordinates; Merredin pin at 118.28° E, 31.48° S).
- Font: Montserrat (SIL OFL 1.1) — `render/assets/fonts/OFL.txt`.
