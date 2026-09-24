// Merges the hook (generated fresh from transcript.json, since it has no
// standalone .srt) and each chapter's .srt into one australia-full.srt,
// shifting every timestamp by the cumulative duration of the parts before
// it in the final concatenated video. Durations come from ffprobe on the
// actual rendered parts, not assumed, so drift from encoder rounding
// can't desync the subtitles.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = path.join(import.meta.dirname, "..");

const PARTS = [
  { name: "part00_opening_and_hook", file: path.join(root, "parts/part00_opening_and_hook.mp4") },
  { name: "chapter01", file: path.join(root, "parts/chapter01.mp4"), srt: path.join(root, "parts/chapter01.srt") },
  { name: "chapter02", file: path.join(root, "parts/chapter02.mp4"), srt: path.join(root, "parts/chapter02.srt") },
  { name: "chapter03", file: path.join(root, "parts/chapter03.mp4"), srt: path.join(root, "parts/chapter03.srt") },
  { name: "chapter04", file: path.join(root, "parts/chapter04.mp4"), srt: path.join(root, "parts/chapter04.srt") },
  { name: "chapter05", file: path.join(root, "parts/chapter05.mp4"), srt: path.join(root, "parts/chapter05.srt") },
  { name: "chapter06", file: path.join(root, "parts/chapter06.mp4"), srt: path.join(root, "parts/chapter06.srt") },
  { name: "chapter07", file: path.join(root, "parts/chapter07.mp4"), srt: path.join(root, "parts/chapter07.srt") },
  { name: "chapter08", file: path.join(root, "parts/chapter08.mp4"), srt: path.join(root, "parts/chapter08.srt") },
  { name: "chapter09", file: path.join(root, "parts/chapter09.mp4"), srt: path.join(root, "parts/chapter09.srt") },
  { name: "chapter10", file: path.join(root, "parts/chapter10.mp4"), srt: path.join(root, "parts/chapter10.srt") },
  { name: "ending", file: path.join(root, "parts/ending.mp4") },
  { name: "closing", file: path.join(root, "parts/closing.mp4") },
];

function ffprobeDuration(file) {
  const out = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`).toString().trim();
  return Number(out);
}

function srtTime(t) {
  t = Math.max(0, t);
  const ms = Math.round(t * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const msRem = ms % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(msRem).padStart(3, "0")}`;
}

function parseSrtTime(str) {
  const m = str.match(/(\d+):(\d+):(\d+),(\d+)/);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 1000;
}

function parseSrt(text) {
  const blocks = text.trim().split(/\n\s*\n/);
  return blocks.map((block) => {
    const lines = block.split("\n");
    const [startStr, endStr] = lines[1].split(" --> ");
    return { start: parseSrtTime(startStr), end: parseSrtTime(endStr), text: lines.slice(2).join("\n") };
  });
}

// Build the hook's caption lines fresh from transcript.json (words 0-105),
// each shown at video time word.start + 13.0 (HOOK_OFFSET, the length of
// the silent opening cards before the hook starts speaking).
function buildHookCues() {
  const transcript = JSON.parse(fs.readFileSync(path.join(root, "transcript.json"), "utf8"));
  const words = transcript.words.slice(0, 106);
  const HOOK_OFFSET = 13.0;
  const maxWords = 8;
  const lines = [];
  let cur = [];
  for (const w of words) {
    cur.push(w);
    const endsSentence = /[.!?]$/.test(w.text);
    if (cur.length >= maxWords || endsSentence) {
      lines.push({ text: cur.map((x) => x.text).join(" "), start: cur[0].start, end: cur[cur.length - 1].end });
      cur = [];
    }
  }
  if (cur.length) lines.push({ text: cur.map((x) => x.text).join(" "), start: cur[0].start, end: cur[cur.length - 1].end });
  return lines.map((line, i) => {
    const nextStart = i + 1 < lines.length ? lines[i + 1].start : Infinity;
    const end = Math.min(line.end + 0.15, nextStart - 0.05);
    return { start: line.start + HOOK_OFFSET, end: end + HOOK_OFFSET, text: line.text };
  });
}

let cumulative = 0;
let cueNum = 1;
const outLines = [];
const durations = {};

for (const part of PARTS) {
  const duration = ffprobeDuration(part.file);
  durations[part.name] = duration;
  console.log(`${part.name}: offset=${cumulative.toFixed(3)}s duration=${duration.toFixed(3)}s`);

  let cues = [];
  if (part.name === "part00_opening_and_hook") {
    cues = buildHookCues();
  } else if (part.srt) {
    cues = parseSrt(fs.readFileSync(part.srt, "utf8"));
  }

  for (const cue of cues) {
    outLines.push(`${cueNum}\n${srtTime(cue.start + cumulative)} --> ${srtTime(cue.end + cumulative)}\n${cue.text}\n`);
    cueNum++;
  }

  cumulative += duration;
}

fs.writeFileSync(path.join(root, "out/australia-full.srt"), outLines.join("\n"));
console.log(`\nWrote out/australia-full.srt (${cueNum - 1} cues), total duration ${cumulative.toFixed(3)}s`);
fs.writeFileSync(path.join(root, "out/part-durations.json"), JSON.stringify(durations, null, 2));
