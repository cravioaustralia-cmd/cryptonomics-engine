#!/usr/bin/env node
/**
 * Contact sheet: capture renderFrame(t) at beat times (shared capture.mjs stills mode),
 * then tile with ffmpeg → out/contact-sheet.jpg. Optional CLI times override the defaults.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { captureVideo } from '../../shared/render/capture.mjs';

const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(EP, 'out');
const DIR = path.join(OUT, 'contact');
fs.rmSync(DIR, { recursive: true, force: true });

const DEFAULT = [
  0.0, 1.5, 3.9, 4.9, 6.5, 8.0, 9.6, 11.2, 12.6, 13.9, 15.2, 17.6, 19.0, 20.1, 21.0, 22.8,
  23.6, 26.4, 28.2, 29.9, 31.6, 33.8, 36.6, 38.3, 39.3, 39.8,
];
const times = process.argv.length > 2 ? process.argv.slice(2).map(Number) : DEFAULT;
await captureVideo({ episodeDir: EP, outVideo: DIR, duration: 39.816, stills: times });

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.png')).sort();
const cols = 6;
const rows = Math.ceil(files.length / cols);
const inputs = files.flatMap((f) => ['-i', path.join(DIR, f)]);
const fl = files
  .map(
    (f, i) =>
      `[${i}:v]scale=270:480,drawtext=text='${f.slice(1, 7)}s':x=8:y=8:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.6[v${i}]`
  )
  .join(';');
const pads = Array.from({ length: rows * cols - files.length }, (_, k) => `color=c=black:s=270x480:d=1[p${k}]`);
const all = [...files.map((_, i) => `[v${i}]`), ...pads.map((_, k) => `[p${k}]`)];
const layout = all.map((_, i) => `${(i % cols) * 270}_${Math.floor(i / cols) * 480}`).join('|');
const graph = [fl, ...pads, `${all.join('')}xstack=inputs=${all.length}:layout=${layout}[out]`].join(';');
const sheet = path.join(OUT, 'contact-sheet.jpg');
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...inputs, '-filter_complex', graph, '-map', '[out]', '-frames:v', '1', '-q:v', '3', sheet], {
  stdio: 'inherit',
});
console.log('Contact sheet →', sheet);
