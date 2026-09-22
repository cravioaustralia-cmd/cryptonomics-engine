import { Episode4 } from "./episode4/Episode4";
import meta from "./episode4.meta.json";
import { VIDEO } from "./shared/theme";

// Composition metadata for Episode 4. Duration is derived from the real
// voiceover length (src/episodes/episode4.meta.json, written by
// scripts/align-episode4.ts) — never hardcoded.
export const episode4Composition = {
  id: "Episode4",
  component: Episode4,
  width: VIDEO.width,
  height: VIDEO.height,
  fps: meta.fps,
  durationInFrames: meta.totalDurationInFrames,
};
