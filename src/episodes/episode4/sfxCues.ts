import type { EpisodeCaptionWord } from "../shared/captionTypes";
import type { SceneTiming } from "../shared/timing";

export type SfxName =
  | "whoosh"
  | "pop"
  | "cash-register"
  | "thud"
  | "record-scratch";

export type SfxEvent = { frame: number; sfx: SfxName };

/** Sound cues anchored to a specific spoken word — timed from real speech, not guesswork. */
const KEYWORD_CUES: { sceneId: string; sceneWordIndex: number; sfx: SfxName }[] = [
  { sceneId: "scene02-scale", sceneWordIndex: 12, sfx: "pop" }, // "Bina" stamp
  { sceneId: "scene06-order", sceneWordIndex: 8, sfx: "cash-register" }, // "10,000"
  { sceneId: "scene08-today", sceneWordIndex: 0, sfx: "pop" }, // "Aaj?"
  { sceneId: "scene08-today", sceneWordIndex: 16, sfx: "cash-register" }, // "8,000"
  { sceneId: "scene09-phones", sceneWordIndex: 15, sfx: "pop" }, // "EMI" stamp
  { sceneId: "scene10-ferrari", sceneWordIndex: 15, sfx: "whoosh" }, // "Ferrari" morph
  { sceneId: "scene12-pause", sceneWordIndex: 1, sfx: "record-scratch" }, // "ek second"
  { sceneId: "scene14-blockchain", sceneWordIndex: 3, sfx: "thud" }, // "Blockchain." drop
  { sceneId: "scene15-cta", sceneWordIndex: 8, sfx: "pop" }, // "like" tap
  { sceneId: "scene15-cta", sceneWordIndex: 14, sfx: "pop" }, // "subscribe" tap
];

const MIN_GAP_FRAMES_FACTOR = 2; // seconds

/**
 * Builds the final SFX timeline: a "whoosh" on every scene cut plus the
 * keyword cues above, all anchored to real word timestamps, then thins the
 * combined list so no two cues land closer than ~2 seconds apart (keeps
 * SFX "subtle... never more than one every ~2 seconds").
 */
export const buildSfxEvents = (
  words: EpisodeCaptionWord[],
  scenes: SceneTiming[],
  fps: number,
): SfxEvent[] => {
  const events: SfxEvent[] = [];

  // Scene-cut whooshes (skip the very first scene — nothing to transition from).
  for (let i = 1; i < scenes.length; i++) {
    events.push({ frame: scenes[i].startFrame, sfx: "whoosh" });
  }

  for (const cue of KEYWORD_CUES) {
    const word = words.find(
      (w) => w.sceneId === cue.sceneId && w.sceneWordIndex === cue.sceneWordIndex,
    );
    if (!word) continue;
    events.push({
      frame: Math.round((word.startMs / 1000) * fps),
      sfx: cue.sfx,
    });
  }

  events.sort((a, b) => a.frame - b.frame);

  const minGap = MIN_GAP_FRAMES_FACTOR * fps;
  const kept: SfxEvent[] = [];
  for (const ev of events) {
    if (kept.length === 0 || ev.frame - kept[kept.length - 1].frame >= minGap) {
      kept.push(ev);
    }
  }
  return kept;
};
