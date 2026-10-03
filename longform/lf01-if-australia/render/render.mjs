#!/usr/bin/env node
/**
 * lf01 map plates: SVG + renderFrame(t) + Playwright + ffmpeg, via shorts/shared/render/capture.mjs
 * (1920×1080 override). Renders frame ranges in parallel workers, then concatenates losslessly.
 *
 *   node render.mjs [--from s] [--to s] [--workers n] [--out file] [--stills t1,t2,…]
 * Env: TILES=<tile pyramid dir> (default render/tiles)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { captureVideo } from '../../../shorts/shared/render/capture.mjs';

const R = path.dirname(new URL(import.meta.url).pathname);
const EP = path.resolve(R, '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const T = JSON.parse(fs.readFileSync(path.join(R, 'timeline.json'), 'utf8'));
const fps = 30;
const TILES = process.env.TILES || path.join(R, 'tiles');
const from = +(args.from ?? 0), to = +(args.to ?? T.duration);
const workers = +(args.workers ?? 3);
const out = path.resolve(args.out ?? path.join(EP, 'out', 'map.mp4'));
const OUTDIR = path.dirname(out);
fs.mkdirSync(OUTDIR, { recursive: true });

const common = {
  episodeDir: EP, fps, duration: T.duration, width: 1920, height: 1080,
  roots: { '/frame.html': path.join(R, 'frame.html') },
  dirs: { '/ep/': R, '/tiles/': TILES },
};

if (args.stills) {
  // single frames → PNG for the contact sheet / checks
  const ts = args.stills.split(',').map(Number);
  const tmp = path.join(OUTDIR, 'stills-tmp.mp4');
  for (const t of ts) {
    const f = Math.round(t * fps);
    await captureVideo({ ...common, outVideo: tmp, frameRange: [f, f + 1] });
    const png = path.join(OUTDIR, 'stills', `t${t.toFixed(2).padStart(7, '0')}.jpg`);
    fs.mkdirSync(path.dirname(png), { recursive: true });
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', tmp, '-frames:v', '1', '-q:v', '3', png]);
    console.log('still', png);
  }
  process.exit(0);
}

const f0 = Math.round(from * fps), f1 = Math.round(to * fps);
const per = Math.ceil((f1 - f0) / workers);
const parts = [];
const jobs = [];
for (let w = 0; w < workers; w++) {
  const a = f0 + w * per, b = Math.min(f1, a + per);
  if (a >= b) break;
  const part = path.join(OUTDIR, `part-${String(w).padStart(2, '0')}.mp4`);
  parts.push(part);
  jobs.push(captureVideo({ ...common, outVideo: part, frameRange: [a, b] }));
}
const t0 = Date.now();
await Promise.all(jobs);
const list = path.join(OUTDIR, 'parts.txt');
fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n'));
execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out]);
parts.forEach((p) => fs.unlinkSync(p));
console.log(`map plates → ${out} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
