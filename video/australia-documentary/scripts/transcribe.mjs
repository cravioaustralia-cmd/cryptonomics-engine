// Transcribes audio/australia-history-vo.mp3 with whisper.cpp (word-level
// timestamps) and writes transcript.json at the project root, in the shape
// consumed by the render pipeline: an ordered list of words with start/end
// times in seconds.
//
// Run with: node scripts/transcribe.mjs

import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
} from "@remotion/install-whisper-cpp";

const root = path.join(import.meta.dirname, "..");
const cacheDir = path.join(root, ".cache");
const whisperDir = path.join(cacheDir, "whisper.cpp");
const audioMp3 = path.join(root, "audio", "australia-history-vo.mp3");
const wavPath = path.join(cacheDir, "vo-16k.wav");
const rawOutPath = path.join(cacheDir, "whisper-raw.json");
const transcriptOutPath = path.join(root, "transcript.json");

const WHISPER_VERSION = "1.5.5";
const MODEL = "medium.en";

fs.mkdirSync(cacheDir, { recursive: true });

console.log("[1/4] Converting voiceover.mp3 -> 16kHz mono wav...");
execSync(
  `ffmpeg -y -i "${audioMp3}" -ar 16000 -ac 1 -c:a pcm_s16le "${wavPath}"`,
  { stdio: "inherit" },
);

console.log("[2/4] Installing whisper.cpp (git clone + make)...");
await installWhisperCpp({ to: whisperDir, version: WHISPER_VERSION });

console.log(`[3/4] Downloading Whisper "${MODEL}" model...`);
await downloadWhisperModel({
  model: MODEL,
  folder: whisperDir,
  onProgress: (downloaded, total) => {
    if (total) {
      const pct = ((downloaded / total) * 100).toFixed(1);
      process.stdout.write(`\r  downloading model: ${pct}%   `);
    }
  },
});
process.stdout.write("\n");

console.log("[4/4] Transcribing (English, word-level timestamps)...");
const whisperCppOutput = await transcribe({
  model: MODEL,
  whisperPath: whisperDir,
  whisperCppVersion: WHISPER_VERSION,
  inputPath: wavPath,
  tokenLevelTimestamps: true,
  splitOnWord: true,
  language: "en",
  printOutput: true,
});

fs.writeFileSync(rawOutPath, JSON.stringify(whisperCppOutput, null, 2));

// whisper.cpp's own per-token offsets carry real start/end ms; the
// @remotion/install-whisper-cpp toCaptions() helper drops end times, so we
// read offsets.from/to straight off the raw transcription entries instead.
const words = whisperCppOutput.transcription
  .filter((entry) => entry.text.trim().length > 0)
  .map((entry) => ({
    text: entry.text.trim(),
    start: Math.round((entry.offsets.from / 1000) * 1000) / 1000,
    end: Math.round((entry.offsets.to / 1000) * 1000) / 1000,
  }));

fs.writeFileSync(transcriptOutPath, JSON.stringify({ words }, null, 2));

console.log(`\nDone. ${words.length} words transcribed.`);
console.log(`Raw whisper output: ${rawOutPath}`);
console.log(`Transcript: ${transcriptOutPath}`);
