# Sources — lf01 IF AUSTRALIA

Voice (`audio/vo/V01.mp3`–`V34.mp3`) and B-roll (`broll/B01.mp4`–`B12.mp4`) were already on branch `scaffold/lf01-if-australia`. They are not re-sourced here.

## John Curtin archive photo

- File: `longform/lf01-if-australia/images/curtin.jpg`
- What: Australian Prime Minister John Curtin speaking at the austerity meeting, Sydney Town Hall, 30 October 1942. Pix photographer, from a vintage negative. Black-and-white photograph, JPEG, 766×1024. This is the uncropped file uploaded to Wikimedia Commons from the State Library scan (the current Commons file is a later crop of the same negative).
- Commons file page: https://commons.wikimedia.org/wiki/File:John_Curtin_austerity_speech_SLNSW_1942.jpg
- File downloaded: https://upload.wikimedia.org/wikipedia/commons/archive/8/81/20220422064348%21John_Curtin_austerity_speech_SLNSW_1942.jpg
- Library catalogue: State Library of New South Wales, ON 388/Box 022/Item 043, item ID 9581591. Record: https://collection.sl.nsw.gov.au/record/npANw251/N3PKgBoeqkQjb
- Licence: Public domain. Australian photograph taken in 1942 (before 1 January 1955). Commons marks it PD-Australia and public domain in the United States (first published outside the US; public domain in Australia on the URAA date).
- Credit line: Mitchell Library, State Library of New South Wales.

## Music bed

- File: `longform/lf01-if-australia/audio/music/bed.mp3`
- Title: Long note One
- Composer: Kevin MacLeod (incompetech.com)
- Catalog: instruments basses and violins; feel dark, intense, suspenseful, unnerving; description "Just a very long pad for use under dialog." Album tag on the file: Scoring: Horror Soundscapes (2008). ISRC USUAN1100418.
- Duration: 7:20. Loop or hold it under a film of about 9–12 minutes (plus the 10 second end screen). It is a pad, not a full-length cue.
- Source URL: https://incompetech.com/music/royalty-free/mp3-royaltyfree/Long%20Note%20One.mp3
- Track page: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100418
- Licence: Creative Commons Attribution 4.0 International (CC BY 4.0). https://creativecommons.org/licenses/by/4.0/
- Credit line: Music: Long note One by Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By Attribution 4.0.

Not the Shorts Skyline bed. Not Mixkit. Not Pixabay.

## Map and design sources (added with the cut)

- **Terrain elevation:** AWS Terrain Tiles (Mapzen "terrarium" encoding), Open Data on AWS, fetched from `https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png` by `render/tools/build-tiles.py`. Free to use with attribution. The tiles combine SRTM (NASA), GMTED2010 (USGS), ETOPO1 (NOAA) and other public datasets. Full attribution: https://github.com/tilezen/joerd/blob/master/docs/attribution.md. The parchment styling, hillshade, water lining and ink coastlines are drawn by our script.
- **Coastlines, lakes, rivers, country outlines:** Natural Earth 1:10m / 1:50m / 1:110m, public domain, from https://github.com/nvkelso/natural-earth-vector.
- **Rail and road lines** (Darwin to Birdum, Port Augusta to Alice Springs, the north–south road through the gap) and the Kokoda line are approximate alignments drawn for the map. The Japanese-held wash in Act 1 is an approximate early-1942 extent.
- **Fonts** (in `render/fonts/`, licence files alongside): Oswald (SIL Open Font Licence 1.1), Special Elite (Apache 2.0), IM FELL English and IM FELL English SC (SIL Open Font Licence 1.1). All from https://github.com/google/fonts.
- **Paper grain, clouds:** generated procedurally by `render/tools/make-assets.py`. No third-party images.

## Sound effects

All sound effects, the IF AUSTRALIA series sting and the cliffhanger sting are synthesised in-house by `render/tools/build-sfx.py` (numpy). No third-party samples, no Mixkit, no Pixabay. The series sting is kept at `render/sfx/sting_series.wav` for later episodes.

## B-roll

B01–B12 are AI-generated dramatised reconstructions (Grok Imagine, prompts in `broll/PROMPTS.md`). They show no real people. Mark the upload as altered or synthetic content.
