// Exports an SRT subtitle file for a chapter, using the same caption-line
// grouping as the on-screen captions (style.js buildCaptionLines), so the
// exported file matches what's burned into the video.
//
// Usage: node scripts/export_srt.mjs <startWordIdx> <endWordIdxExclusive> <out.srt> [maxWords]

import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const [startIdx, endIdx, outPath, maxWordsArg] = process.argv.slice(2);
const maxWords = Number(maxWordsArg || 8);

if (!startIdx || !endIdx || !outPath) {
  console.error("Usage: node scripts/export_srt.mjs <startWordIdx> <endWordIdxExclusive> <out.srt> [maxWords]");
  process.exit(1);
}

const transcript = JSON.parse(fs.readFileSync(path.join(root, "transcript.json"), "utf8"));
const words = transcript.words.slice(Number(startIdx), Number(endIdx));

function buildCaptionLines(words, maxWords) {
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
  if (cur.length) {
    lines.push({ text: cur.map((x) => x.text).join(" "), start: cur[0].start, end: cur[cur.length - 1].end });
  }
  return lines;
}

function srtTime(t) {
  const ms = Math.round(t * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const msRem = ms % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(msRem).padStart(3, "0")}`;
}

const chapterStart = words[0].start;
const lines = buildCaptionLines(words, maxWords);

const srt = lines
  .map((line, i) => {
    const start = line.start - chapterStart;
    const nextStart = i + 1 < lines.length ? lines[i + 1].start - chapterStart : Infinity;
    const end = Math.min(line.end - chapterStart + 0.15, nextStart - 0.05);
    return `${i + 1}\n${srtTime(start)} --> ${srtTime(end)}\n${line.text}\n`;
  })
  .join("\n");

fs.writeFileSync(path.join(root, outPath), srt);
console.log(`Wrote ${outPath}: ${lines.length} lines, chapter starts at global t=${chapterStart}s`);
