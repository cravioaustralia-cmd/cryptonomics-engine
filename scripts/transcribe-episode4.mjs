// One-off dev script: transcribes public/assets/episode4/voiceover.mp3 with
// whisper.cpp (multilingual model, word-level timestamps) and writes the raw
// output + a word-level captions file into .cache/. Run with:
//   node scripts/transcribe-episode4.mjs
//
// This does NOT run in CI. The output is consumed by
// scripts/align-episode4.mjs, which produces the committed
// src/episodes/episode4.captions.json.

import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";

const root = process.cwd();
const cacheDir = path.join(root, ".cache");
const whisperDir = path.join(cacheDir, "whisper.cpp");
const audioMp3 = path.join(
  root,
  "public",
  "assets",
  "episode4",
  "voiceover.mp3",
);
const wavPath = path.join(cacheDir, "episode4-voiceover-16k.wav");
const rawOutPath = path.join(cacheDir, "episode4-whisper-raw.json");
const wordsOutPath = path.join(cacheDir, "episode4-whisper-words.json");

const WHISPER_VERSION = "1.5.5";
const MODEL = "medium"; // multilingual (no ".en" suffix)

fs.mkdirSync(cacheDir, { recursive: true });

console.log("[1/4] Converting voiceover.mp3 -> 16kHz mono wav...");
execSync(
  `ffmpeg -y -i "${audioMp3}" -ar 16000 -ac 1 -c:a pcm_s16le "${wavPath}"`,
  { stdio: "inherit" },
);

console.log("[2/4] Installing whisper.cpp (git clone + make)...");
await installWhisperCpp({ to: whisperDir, version: WHISPER_VERSION });

console.log(`[3/4] Downloading Whisper "${MODEL}" multilingual model...`);
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

console.log("[4/4] Transcribing (Hindi/Hinglish, word-level timestamps)...");
const whisperCppOutput = await transcribe({
  model: MODEL,
  whisperPath: whisperDir,
  whisperCppVersion: WHISPER_VERSION,
  inputPath: wavPath,
  tokenLevelTimestamps: true,
  language: "hi",
  printOutput: true,
});

fs.writeFileSync(rawOutPath, JSON.stringify(whisperCppOutput, null, 2));

const { captions } = toCaptions({ whisperCppOutput });
fs.writeFileSync(wordsOutPath, JSON.stringify(captions, null, 2));

console.log(`\nDone. ${captions.length} whisper word tokens.`);
console.log(`Raw whisper output: ${rawOutPath}`);
console.log(`Word-level captions: ${wordsOutPath}`);
