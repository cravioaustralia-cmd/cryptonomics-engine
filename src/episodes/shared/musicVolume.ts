import { interpolate } from "remotion";
import type { EpisodeCaptionWord } from "./captionTypes";

export type SpeechBlock = { start: number; end: number };

/**
 * Merges word-level timings into continuous "speech blocks" — consecutive
 * words separated by a small gap are treated as one phrase, so the music
 * ducks for the whole sentence instead of pumping on every micro-gap
 * between words.
 */
export const buildSpeechBlocks = (
  words: EpisodeCaptionWord[],
  mergeGapMs = 250,
): SpeechBlock[] => {
  const blocks: SpeechBlock[] = [];
  for (const w of words) {
    const last = blocks[blocks.length - 1];
    if (last && w.startMs - last.end <= mergeGapMs) {
      last.end = Math.max(last.end, w.endMs);
    } else {
      blocks.push({ start: w.startMs, end: w.endMs });
    }
  }
  return blocks;
};

const RAMP_MS = 150;
const DUCKED = 0.08;
const AMBIENT = 0.18;
const FADE_IN_MS = 500;
const FADE_OUT_MS = 1500;

/** Background-music volume at a given absolute time: ducked under speech, ambient in gaps, faded at the edges. */
export const getMusicVolume = (
  absoluteMs: number,
  blocks: SpeechBlock[],
  totalDurationMs: number,
): number => {
  let vol = AMBIENT;

  for (const b of blocks) {
    if (absoluteMs < b.start - RAMP_MS || absoluteMs > b.end + RAMP_MS) continue;

    let blockVol: number;
    if (absoluteMs < b.start) {
      blockVol = interpolate(absoluteMs, [b.start - RAMP_MS, b.start], [AMBIENT, DUCKED], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    } else if (absoluteMs <= b.end) {
      blockVol = DUCKED;
    } else {
      blockVol = interpolate(absoluteMs, [b.end, b.end + RAMP_MS], [DUCKED, AMBIENT], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    }
    vol = Math.min(vol, blockVol);
  }

  const fadeIn = interpolate(absoluteMs, [0, FADE_IN_MS], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    absoluteMs,
    [totalDurationMs - FADE_OUT_MS, totalDurationMs],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return vol * Math.min(fadeIn, fadeOut);
};
