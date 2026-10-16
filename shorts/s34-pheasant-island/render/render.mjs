#!/usr/bin/env node
/**
 * s34 Pheasant Island — full render.
 *   node render.mjs            # mix + capture + mux + loudness check
 *   node render.mjs --audio    # audio mix only
 * Env: PW_CHROMIUM_PATH=/opt/pw-browsers/chromium when Playwright's own browser is absent.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const here = path.dirname(new URL(import.meta.url).pathname);
const ep = path.resolve(here, '..');
const slug = 's34-pheasant-island';
const DUR = 43.56;
const work = path.join(ep, 'out');
const finalDir = path.join(ep, 'final');
fs.mkdirSync(work, { recursive: true });
fs.mkdirSync(finalDir, { recursive: true });

const run = (args) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr.slice(-2000));
  return r.stderr;
};
const peakDb = (file) => {
  const e = run(['-i', file, '-af', 'volumedetect', '-f', 'null', '-']);
  return parseFloat(/max_volume: (-?[\d.]+) dB/.exec(e)[1]);
};

// ---- SFX cues: sparse, peak-matched ----
// { file, at, peak (target peak dBFS before master), dur (trim), fadeIn, fadeOut }
const SFX = [
  { file: 'text_pop.mp3', at: 0.02, peak: -16 }, // frame-1 hook
  { file: 'whoosh_1.mp3', at: 3.95, peak: -18, dur: 0.9, fadeOut: 0.3 }, // push to name card
  { file: 'river_flow_mixkit2459.mp3', at: 5.0, peak: -26, dur: 5.6, fadeIn: 0.8, fadeOut: 1.2 }, // map bed
  { file: 'text_pop.mp3', at: 5.38, peak: -18 }, // pin drop
  { file: 'impact_hit.mp3', at: 12.84, peak: -13, dur: 1.8, fadeOut: 0.8 }, // 1659 slam
  { file: 'pen_writing_mixkit2536.mp3', at: 18.45, peak: -17, dur: 1.6, fadeIn: 0.05, fadeOut: 0.3 }, // signature
  { file: 'impact_hit.mp3', at: 22.86, peak: -17, dur: 1.2, fadeOut: 0.6 }, // wax seal
  { file: 'text_pop.mp3', at: 29.95, peak: -18 }, // Spain fill
  { file: 'text_pop.mp3', at: 32.5, peak: -18 }, // France fill
  { file: 'text_pop.mp3', at: 35.95, peak: -18 }, // padlock clicks shut
  { file: 'riser.mp3', at: DUR - 2.62, peak: -20, fadeIn: 1.0 }, // loop lift
];

function mix() {
  const vo = path.join(ep, 'audio', 'vo.mp3');
  const music = path.join(ep, 'music', 'sneaky_snitch_kevin_macleod.mp3');
  const inputs = ['-i', vo, '-i', music];
  const f = [];
  // VO: tidy low end, gentle compression
  f.push('[0:a]aresample=48000,highpass=f=75,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,apad=whole_dur=' + DUR + ',asplit=2[vo][key]');
  // Music: bed under VO, ducked by the VO, short tail fade for a clean loop seam
  f.push(`[1:a]aresample=48000,atrim=0:${DUR},volume=-15dB,afade=t=in:st=0:d=0.15,afade=t=out:st=${DUR - 0.45}:d=0.45[mraw]`);
  f.push('[mraw][key]sidechaincompress=threshold=0.04:ratio=5:attack=20:release=350:makeup=1[mus]');
  const labels = ['[vo]', '[mus]'];
  SFX.forEach((c, i) => {
    const file = path.join(ep, 'sfx', c.file);
    inputs.push('-i', file);
    const gain = c.peak - peakDb(file);
    const idx = i + 2;
    let chain = `[${idx}:a]aresample=48000,aformat=channel_layouts=stereo`;
    if (c.dur) chain += `,atrim=0:${c.dur}`;
    if (c.fadeIn) chain += `,afade=t=in:st=0:d=${c.fadeIn}`;
    if (c.fadeOut && c.dur) chain += `,afade=t=out:st=${c.dur - c.fadeOut}:d=${c.fadeOut}`;
    const ms = Math.round(c.at * 1000);
    chain += `,volume=${gain.toFixed(2)}dB,adelay=${ms}|${ms}[s${i}]`;
    f.push(chain);
    labels.push(`[s${i}]`);
  });
  f.push(`${labels.join('')}amix=inputs=${labels.length}:duration=first:dropout_transition=0:normalize=0,atrim=0:${DUR}[pre]`);
  const pre = path.join(work, 'mix-pre.wav');
  run(['-y', ...inputs, '-filter_complex', f.join(';'), '-map', '[pre]', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s24le', pre]);
  // two-pass loudnorm to -14 LUFS, TP -2.0 (headroom for AAC)
  const m = run(['-i', pre, '-af', 'loudnorm=I=-14:TP=-2.0:LRA=11:print_format=json', '-f', 'null', '-']);
  const j = JSON.parse(m.slice(m.lastIndexOf('{'), m.lastIndexOf('}') + 1));
  const out = path.join(work, 'final-mix.wav');
  run(['-y', '-i', pre, '-af',
    `loudnorm=I=-14:TP=-2.0:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,aresample=48000`,
    '-ar', '48000', '-c:a', 'pcm_s24le', out]);
  console.log('mix →', out);
  return out;
}

function measure(file) {
  const e = run(['-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const s = e.slice(e.lastIndexOf('Summary:'));
  const I = parseFloat(/I:\s+(-?[\d.]+) LUFS/.exec(s)[1]);
  const TP = parseFloat(/Peak:\s+(-?[\d.]+) dBFS/.exec(s)[1]);
  return { I, TP };
}

const audioOnly = process.argv.includes('--audio');
execFileSync(path.join(here, 'prep-images.sh'), { stdio: 'inherit' });
execFileSync('node', [path.join(here, 'build-transcript.mjs')], { stdio: 'inherit' });
const mixWav = mix();
console.log('mix loudness', measure(mixWav));
if (audioOnly) process.exit(0);

const { captureVideo } = await import(path.resolve(ep, '..', 'shared', 'render', 'capture.mjs'));
const silent = path.join(work, `${slug}-silent.mp4`);
await captureVideo({ episodeDir: ep, outVideo: silent, fps: 30, duration: DUR });

const finalMp4 = path.join(finalDir, `${slug}.mp4`);
let gainDb = 0;
for (let attempt = 0; attempt < 3; attempt++) {
  run(['-y', '-i', silent, '-i', mixWav, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
    '-af', `volume=${gainDb}dB`, '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-t', String(DUR),
    '-movflags', '+faststart', finalMp4]);
  const m = measure(finalMp4);
  console.log('final AAC loudness', m, 'gain', gainDb);
  if (m.TP <= -1.5) break;
  gainDb -= m.TP + 1.5 + 0.1;
}
console.log('DONE', finalMp4);
