export type EpisodeCaptionWord = {
  word: string;
  startMs: number;
  endMs: number;
  /** Which visual scene this word belongs to (used to never split a caption page across a scene cut). */
  sceneId: string;
  /** Index of this word within its scene's script text — used to look up scene-specific animation trigger frames. */
  sceneWordIndex?: number;
  emphasis?: "money" | "punch";
  emoji?: string;
};

export type CaptionPage = {
  words: EpisodeCaptionWord[];
  startMs: number;
  endMs: number;
  sceneId: string;
};

const MIN_WORDS_PER_PAGE = 2;
const MAX_WORDS_PER_PAGE = 4;
const TARGET_WORDS_PER_PAGE = 3;

/**
 * Groups timed words into 2-4 word "pages" for display, never crossing a
 * scene boundary (so a caption page always matches the visual it's shown
 * over).
 */
export const buildCaptionPages = (
  words: EpisodeCaptionWord[],
): CaptionPage[] => {
  const pages: CaptionPage[] = [];
  let currentSceneWords: EpisodeCaptionWord[] = [];

  const flushScene = () => {
    if (currentSceneWords.length === 0) return;
    let i = 0;
    while (i < currentSceneWords.length) {
      let take = Math.min(TARGET_WORDS_PER_PAGE, currentSceneWords.length - i);
      const remainder = currentSceneWords.length - i - take;
      // Avoid leaving a dangling 1-word page: fold it into this page instead
      // (still within the 2-4 word range).
      if (remainder > 0 && remainder < MIN_WORDS_PER_PAGE) {
        take = Math.min(MAX_WORDS_PER_PAGE, take + remainder);
      }
      const chunk = currentSceneWords.slice(i, i + take);
      pages.push({
        words: chunk,
        startMs: chunk[0].startMs,
        endMs: chunk[chunk.length - 1].endMs,
        sceneId: chunk[0].sceneId,
      });
      i += take;
    }
    currentSceneWords = [];
  };

  for (const word of words) {
    if (
      currentSceneWords.length > 0 &&
      currentSceneWords[0].sceneId !== word.sceneId
    ) {
      flushScene();
    }
    currentSceneWords.push(word);
  }
  flushScene();

  return pages;
};
