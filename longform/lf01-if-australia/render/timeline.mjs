#!/usr/bin/env node
/**
 * lf01 timeline builder → render/timeline.json
 *
 * For each chunk V01…V34:
 *   - audio/vo/Vxx.mp3 present → length = measured speech span (ffmpeg silencedetect trims
 *     head/tail padding, 80 ms margin kept). Words come from transcripts/Vxx.json (Whisper,
 *     made by tools/retune.py), shifted to film time.
 *   - missing → PROVISIONAL length from the script clocks:
 *       next clock − this clock − this gap − next pre-gap.
 * Edit gaps and pre-gaps (the "1", "2", "3" slams) are the script's seconds, never stretched.
 * Nothing here invents word timings: with no transcript, beats fall back to fractions of
 * the chunk window inside score.js, flagged provisional.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const R = path.dirname(new URL(import.meta.url).pathname);
const EP = path.resolve(R, '..');
const B = JSON.parse(fs.readFileSync(path.join(R, 'beats.json'), 'utf8'));
const VO_DIR = path.join(EP, 'audio', 'vo');
const TR_DIR = path.join(EP, 'transcripts');

function probe(file) {
  return parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());
}
function speechSpan(file, dur) {
  const log = execFileSync('bash', ['-c', `ffmpeg -hide_banner -nostats -i "${file}" -af silencedetect=noise=-45dB:d=0.12 -f null - 2>&1 || true`]).toString();
  const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
  let a = 0, b = dur;
  if (starts.length && starts[0] < 0.05 && ends.length) a = ends[0];
  if (starts.length && starts[starts.length - 1] > a && (ends.length < starts.length || ends[ends.length - 1] >= dur - 0.05)) b = starts[starts.length - 1];
  return [Math.max(0, a - 0.08), Math.min(dur, b + 0.08)];
}

const beats = B.beats;
const segs = [];
let t = 0;
let anyReal = false, allReal = true;
for (let i = 0; i < beats.length; i++) {
  const bt = beats[i], nx = beats[i + 1];
  const pre = bt.preGap || 0;
  const preStart = t;
  t += pre;
  const file = path.join(VO_DIR, `${bt.id}.mp3`);
  let dur, srcIn = 0, srcOut = null, provisional = true, words = [];
  if (fs.existsSync(file)) {
    const fd = probe(file);
    [srcIn, srcOut] = speechSpan(file, fd);
    dur = srcOut - srcIn;
    provisional = false;
    anyReal = true;
    const tr = path.join(TR_DIR, `${bt.id}.json`);
    if (fs.existsSync(tr)) {
      const J = JSON.parse(fs.readFileSync(tr, 'utf8'));
      words = (J.words || []).map((w) => ({ w: w.word, s: +(t + w.start - srcIn).toFixed(3), e: +(t + w.end - srcIn).toFixed(3) }));
    }
  } else {
    allReal = false;
    const nextClock = nx ? nx.clock : bt.provisionalEnd;
    dur = nextClock - bt.clock - (bt.gapAfter || 0) - (nx ? nx.preGap || 0 : 0);
  }
  const seg = {
    id: bt.id, preStart: +preStart.toFixed(3), start: +t.toFixed(3), end: +(t + dur).toFixed(3), dur: +dur.toFixed(3),
    gapAfter: bt.gapAfter || 0, preGap: pre, provisional, srcIn: +srcIn.toFixed(3), srcOut: srcOut == null ? null : +srcOut.toFixed(3),
    scriptClock: bt.clock, broll: bt.broll || null, words,
  };
  t += dur + (bt.gapAfter || 0);
  seg.gapEnd = +t.toFixed(3);
  segs.push(seg);
}
const endScreen = { start: +t.toFixed(3), end: +(t + B.endScreen).toFixed(3) };
const byId = Object.fromEntries(segs.map((s) => [s.id, s]));
const chapters = B.acts.map((a) => ({ title: a.title, t: byId[a.first].preStart }));
const midrolls = B.midrolls.map((m) => ({ ...m, t: byId[m.after].gapEnd }));
const out = {
  mode: allReal ? 'vo-locked' : anyReal ? 'mixed' : 'provisional-script-clocks',
  duration: endScreen.end, segments: segs, endScreen, chapters, midrolls,
};
fs.writeFileSync(path.join(R, 'timeline.json'), JSON.stringify(out, null, 1));
console.log(`timeline: ${out.mode}, ${segs.length} chunks, runtime ${out.duration.toFixed(2)} s (end screen ${endScreen.start.toFixed(2)}–${endScreen.end.toFixed(2)})`);
