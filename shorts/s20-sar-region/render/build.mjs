#!/usr/bin/env node
/**
 * s20 build: mix.mjs → Playwright capture (shared capture.mjs) → mux → final/s20-sar-region.mp4
 * Usage (from repo root): CHROMIUM_PATH=/opt/pw-browsers/chromium node shorts/s20-sar-region/render/build.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { captureVideo } from '../../shared/render/capture.mjs';

const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DUR = 40.536;
const out = path.join(EP, 'out');
const fin = path.join(EP, 'final');
fs.mkdirSync(fin, { recursive: true });

console.log('== Mix ==');
execFileSync('node', [path.join(EP, 'render', 'mix.mjs')], { stdio: 'inherit' });

console.log('== Capture ==');
const silent = path.join(out, 's20-sar-region-silent.mp4');
await captureVideo({ episodeDir: EP, outVideo: silent, fps: 30, duration: DUR });

console.log('== Mux ==');
const mp4 = path.join(fin, 's20-sar-region.mp4');
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', silent, '-i', path.join(out, 'final-mix.wav'),
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', String(DUR), '-movflags', '+faststart', mp4], { stdio: 'inherit' });
console.log('DONE', mp4);
