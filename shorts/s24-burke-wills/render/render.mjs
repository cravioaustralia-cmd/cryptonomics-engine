#!/usr/bin/env node
/**
 * s24 Burke & Wills — render driver (SVG + renderFrame + Playwright + ffmpeg).
 *
 *   node render/render.mjs stills [t1,t2,…]   → out/stills/*.png (review frames)
 *   node render/render.mjs sheet             → final/contact-sheet.jpg (4×4 grid)
 *   node render/render.mjs video             → mix + capture + mux → final/s24-burke-wills.mp4
 *   node render/render.mjs animatic          → silent full-script animatic (synthetic timings)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { captureVideo } from '../../shared/render/capture.mjs';

const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(EP, 'out');
const FINAL = path.join(EP, 'final');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(FINAL, { recursive: true });
const tx = JSON.parse(fs.readFileSync(path.join(EP, 'transcript.json'), 'utf8'));
const DUR = tx.duration;
const FPS = 30;
const mode = process.argv[2] || 'video';

if (mode === 'stills') {
  const times = (process.argv[3] || '0,2,6,10,16.3,20.3,22.8,27.5,31,34.5,37,39.1').split(',').map(Number);
  const files = await captureVideo({ episodeDir: EP, fps: FPS, duration: DUR, times, stillsDir: path.join(OUT, 'stills') });
  console.log(files.join('\n'));
} else if (mode === 'sheet') {
  const n = 16;
  const times = Array.from({ length: n }, (_, i) => +(0.05 + (i * (DUR - 0.2)) / (n - 1)).toFixed(2));
  const dir = path.join(OUT, 'sheet');
  fs.rmSync(dir, { recursive: true, force: true });
  const files = await captureVideo({ episodeDir: EP, fps: FPS, duration: DUR, times, stillsDir: dir });
  const args = ['-y', '-hide_banner', '-loglevel', 'error'];
  files.forEach((f) => args.push('-i', f));
  const lab = files.map((_, i) => `[${i}:v]scale=270:480,drawtext=text='${times[i].toFixed(1)}s':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`).join(';');
  const grid = files.map((_, i) => `[v${i}]`).join('') + `xstack=inputs=${n}:layout=` +
    Array.from({ length: n }, (_, i) => `${(i % 4) * 270}_${Math.floor(i / 4) * 480}`).join('|') + '[out]';
  execFileSync('ffmpeg', [...args, '-filter_complex', `${lab};${grid}`, '-map', '[out]', '-q:v', '3', path.join(FINAL, 'contact-sheet.jpg')], { stdio: 'inherit' });
  console.log('contact sheet →', path.join(FINAL, 'contact-sheet.jpg'));
} else if (mode === 'video') {
  execFileSync('node', [path.join(EP, 'render', 'mix.mjs')], { stdio: 'inherit' });
  const silent = path.join(OUT, 's24-burke-wills-silent.mp4');
  await captureVideo({ episodeDir: EP, outVideo: silent, fps: FPS, duration: DUR });
  const final = path.join(FINAL, 's24-burke-wills.mp4');
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', silent, '-i', path.join(OUT, 'final-mix.wav'),
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-t', String(DUR), '-movflags', '+faststart', final], { stdio: 'inherit' });
  console.log('DONE', final);
} else if (mode === 'animatic') {
  const tp = path.join(EP, 'render', 'transcript-full-animatic.json');
  const d = JSON.parse(fs.readFileSync(tp, 'utf8')).duration;
  const silent = path.join(OUT, 'animatic-full.mp4');
  await captureVideo({ episodeDir: EP, outVideo: silent, fps: FPS, duration: d, transcriptPath: tp });
  const small = path.join(FINAL, 's24-burke-wills-full-script-animatic-540p.mp4');
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', silent, '-vf', 'scale=540:960', '-c:v', 'libx264', '-crf', '26', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', small], { stdio: 'inherit' });
  console.log('animatic →', small);
}
