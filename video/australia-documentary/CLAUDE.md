# Project rules (read on every run)

This project builds a documentary video, "The Entire History of Australia". The full instructions are in PROMPT.md. These rules apply on every run, including resumed runs.

- Continue from the first unfinished part. Never redo a finished, committed chapter unless asked.
- No Remotion or video frameworks. SVG + renderFrame(t) + Playwright + ffmpeg only.
- Always reuse style.js, characters.js, maps.js and the bundled fonts, so every chapter looks the same.
- Audio timing comes from transcript.json, never from guesses.
- On-screen text only states facts from script/australia_voiceover_script.md.
- Show First Nations people with dignity. Never copy or animate Aboriginal artworks, sacred symbols or art styles. No violent or distressing imagery for the Frontier Wars, the Stolen Generations or Port Arthur.
- Only use images with a verified free licence (Public Domain, CC0, CC BY, CC BY-SA, Pexels, Pixabay), and record every one in SOURCES.md and CREDITS.txt.
- Never commit a file over 100 MB. Keep chapter files under 100 MB; publish the full video as a Release or artifact.
- Make a contact sheet and review it before rendering each chapter.
