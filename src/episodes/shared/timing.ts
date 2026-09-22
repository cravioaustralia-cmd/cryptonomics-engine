import type { EpisodeCaptionWord } from "./captionTypes";

export type SceneTiming = {
  sceneId: string;
  startMs: number;
  endMs: number;
  startFrame: number;
  durationInFrames: number;
};

/**
 * Derives each scene's [start, end) from the real word timings — the first
 * word of a scene starts it, the first word of the next scene ends it. The
 * final scene runs through to the end of the video (voiceover + outro).
 */
export const getSceneTimings = (
  words: EpisodeCaptionWord[],
  totalDurationMs: number,
  fps: number,
): SceneTiming[] => {
  const sceneIds: string[] = [];
  for (const w of words) {
    if (sceneIds[sceneIds.length - 1] !== w.sceneId) sceneIds.push(w.sceneId);
  }

  const sceneStartMs = sceneIds.map((id) => {
    const first = words.find((w) => w.sceneId === id)!;
    return first.startMs;
  });

  return sceneIds.map((sceneId, i) => {
    const startMs = sceneStartMs[i];
    const endMs = i + 1 < sceneIds.length ? sceneStartMs[i + 1] : totalDurationMs;
    const startFrame = Math.round((startMs / 1000) * fps);
    const endFrame = Math.round((endMs / 1000) * fps);
    return {
      sceneId,
      startMs,
      endMs,
      startFrame,
      durationInFrames: Math.max(1, endFrame - startFrame),
    };
  });
};

/**
 * Local (scene-relative) frame at which a specific scene word starts
 * speaking — used to trigger an in-scene animation (a stamp, a counter,
 * a zoom) exactly when that word is said, instead of a guessed delay.
 */
export const getWordLocalFrame = (
  words: EpisodeCaptionWord[],
  sceneId: string,
  sceneWordIndex: number,
  sceneStartMs: number,
  fps: number,
): number => {
  const word = words.find(
    (w) => w.sceneId === sceneId && w.sceneWordIndex === sceneWordIndex,
  );
  if (!word) return 0;
  return Math.round(((word.startMs - sceneStartMs) / 1000) * fps);
};
