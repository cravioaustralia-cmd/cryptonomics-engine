// Aligns our Roman Hinglish script (src/episodes/episode4/script.ts) against
// Whisper's word-level transcript of the same audio
// (.cache/episode4-whisper-words.json, produced by transcribe-episode4.mjs)
// using fuzzy/phonetic sequence alignment, then writes:
//   - src/episodes/episode4.captions.json  (word, startMs, endMs, scene, ...)
//   - src/episodes/episode4.meta.json      (voiceover duration, total frames)
// and prints a sync report.
//
// Run with: npx tsx scripts/align-episode4.ts

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import {
  SCRIPT_SCENES,
  getSceneWords,
  getAllScriptWords,
} from "../src/episodes/episode4/script";
import type { EpisodeCaptionWord } from "../src/episodes/shared/captionTypes";
import { normalizeForMatching } from "./devanagari";
import { globalAlign } from "./align";

const root = process.cwd();
const whisperWordsPath = path.join(
  root,
  ".cache",
  "episode4-whisper-words.json",
);
const voiceoverPath = path.join(
  root,
  "public",
  "assets",
  "episode4",
  "voiceover.mp3",
);
const captionsOutPath = path.join(
  root,
  "src",
  "episodes",
  "episode4.captions.json",
);
const metaOutPath = path.join(root, "src", "episodes", "episode4.meta.json");

const FPS = 30;
const OUTRO_MS = 1000;
const CONFIDENCE_THRESHOLD = 0.34;

if (!fs.existsSync(whisperWordsPath)) {
  console.error(
    `Missing ${whisperWordsPath}.\nRun "node scripts/transcribe-episode4.mjs" first.`,
  );
  process.exit(1);
}

type WhisperWord = {
  text: string;
  startMs: number;
  endMs: number;
};

const whisperWordsRaw: WhisperWord[] = JSON.parse(
  fs.readFileSync(whisperWordsPath, "utf-8"),
);
// Whisper sometimes emits empty/whitespace-only or punctuation-only tokens.
const whisperWords = whisperWordsRaw
  .map((w) => ({ ...w, norm: normalizeForMatching(w.text) }))
  .filter((w) => w.norm.length > 0);

const scriptWordsFlat = getAllScriptWords(); // [{sceneId, sceneWordIndex, text}]
const scriptNorms = scriptWordsFlat.map((w) => normalizeForMatching(w.text));
const whisperNorms = whisperWords.map((w) => w.norm);

console.log(
  `Aligning ${scriptWordsFlat.length} script words against ${whisperWords.length} Whisper tokens...`,
);

const pairs = globalAlign(scriptNorms, whisperNorms);

type TimedWord = {
  startMs: number | null;
  endMs: number | null;
  confident: boolean;
};

const timedByScriptIndex: TimedWord[] = scriptWordsFlat.map(() => ({
  startMs: null,
  endMs: null,
  confident: false,
}));

for (const pair of pairs) {
  if (pair.scriptIndex === null || pair.otherIndex === null) continue;
  const whisperWord = whisperWords[pair.otherIndex];
  const confident = pair.score >= CONFIDENCE_THRESHOLD;
  timedByScriptIndex[pair.scriptIndex] = {
    startMs: whisperWord.startMs,
    endMs: whisperWord.endMs,
    confident,
  };
}

// --- Interpolate uncertain / unmatched words between confident anchors ---

const voiceoverDurationMs = Math.round(
  parseFloat(
    execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voiceoverPath}"`,
    )
      .toString()
      .trim(),
  ) * 1000,
);

const finalTimes: { startMs: number; endMs: number; confident: boolean }[] =
  timedByScriptIndex.map((t) => ({
    startMs: t.startMs ?? -1,
    endMs: t.endMs ?? -1,
    confident: t.confident && t.startMs !== null,
  }));

let i = 0;
while (i < finalTimes.length) {
  if (finalTimes[i].confident) {
    i++;
    continue;
  }
  // Find the run of non-confident words [i, j)
  let j = i;
  while (j < finalTimes.length && !finalTimes[j].confident) j++;

  const prevEnd = i === 0 ? 0 : finalTimes[i - 1].endMs;
  const nextStart =
    j === finalTimes.length ? voiceoverDurationMs : finalTimes[j].startMs;

  const gapWords = scriptWordsFlat.slice(i, j);
  const totalChars = gapWords.reduce((n, w) => n + w.text.length, 0) || 1;
  const gapDuration = Math.max(0, nextStart - prevEnd);

  let cursor = prevEnd;
  for (let k = i; k < j; k++) {
    const w = scriptWordsFlat[k];
    const share = gapDuration * (w.text.length / totalChars);
    const start = cursor;
    const end = cursor + share;
    finalTimes[k] = { startMs: Math.round(start), endMs: Math.round(end), confident: false };
    cursor = end;
  }

  i = j;
}

// Guard against any rounding overlaps.
for (let k = 1; k < finalTimes.length; k++) {
  if (finalTimes[k].startMs < finalTimes[k - 1].endMs) {
    finalTimes[k].startMs = finalTimes[k - 1].endMs;
  }
  if (finalTimes[k].endMs <= finalTimes[k].startMs) {
    finalTimes[k].endMs = finalTimes[k].startMs + 1;
  }
}

// --- Attach scene metadata + emphasis/emoji annotations ---

const captionWords: EpisodeCaptionWord[] = scriptWordsFlat.map((w, idx) => {
  const scene = SCRIPT_SCENES.find((s) => s.id === w.sceneId)!;
  const annotation = scene.annotations?.[w.sceneWordIndex];
  return {
    word: w.text,
    startMs: finalTimes[idx].startMs,
    endMs: finalTimes[idx].endMs,
    sceneId: w.sceneId,
    sceneWordIndex: w.sceneWordIndex,
    ...(annotation?.emphasis ? { emphasis: annotation.emphasis } : {}),
    ...(annotation?.emoji ? { emoji: annotation.emoji } : {}),
  };
});

fs.writeFileSync(captionsOutPath, JSON.stringify(captionWords, null, 2));

const totalDurationInFrames = Math.round(
  ((voiceoverDurationMs + OUTRO_MS) / 1000) * FPS,
);
fs.writeFileSync(
  metaOutPath,
  JSON.stringify(
    {
      voiceoverDurationMs,
      outroMs: OUTRO_MS,
      fps: FPS,
      totalDurationInFrames,
    },
    null,
    2,
  ),
);

// --- Sync report ---

const fmt = (ms: number) => {
  const s = ms / 1000;
  const m = Math.floor(s / 60);
  const rem = (s - m * 60).toFixed(2);
  return `${m}:${rem.padStart(5, "0")}`;
};

console.log("\n=== SYNC REPORT ===");
let sceneCursor = 0;
for (const scene of SCRIPT_SCENES) {
  const wordCount = getSceneWords(scene).length;
  const sceneCaptionWords = captionWords.slice(
    sceneCursor,
    sceneCursor + wordCount,
  );
  sceneCursor += wordCount;

  const first = sceneCaptionWords[0];
  const last = sceneCaptionWords[sceneCaptionWords.length - 1];
  const confidentCount = timedByScriptIndex
    .slice(sceneCursor - wordCount, sceneCursor)
    .filter((t) => t.confident).length;

  console.log(
    `${scene.id.padEnd(22)} [${fmt(first.startMs)} -> ${fmt(last.endMs)}]  ` +
      `"${first.word}"..."${last.word}"  (${confidentCount}/${wordCount} confidently matched)`,
  );
}
console.log(`\nVoiceover duration: ${fmt(voiceoverDurationMs)} (${voiceoverDurationMs}ms)`);
console.log(`Total video duration: ${fmt(voiceoverDurationMs + OUTRO_MS)} = ${totalDurationInFrames} frames @ ${FPS}fps`);
console.log(`\nWrote ${captionsOutPath}`);
console.log(`Wrote ${metaOutPath}`);
