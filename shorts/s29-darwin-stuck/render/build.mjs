#!/usr/bin/env node
/**
 * s29 build: episode mix (two-pass master loudnorm) → shared Playwright capture → mux.
 *   PW_CHROMIUM_PATH=/opt/pw-browsers/chromium node shorts/s29-darwin-stuck/render/build.mjs
 * Outputs: out/s29-darwin-stuck.mp4 and a copy at final/s29-darwin-stuck.mp4
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { captureVideo } from '../../shared/render/capture.mjs';

const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(EP, 'render', 'config.json'), 'utf8'));
const slug = path.basename(EP);
const OUT = path.join(EP, 'out');
fs.mkdirSync(OUT, { recursive: true });

console.log('== Mix ==');
execFileSync('node', [path.join(EP, 'render', 'mix.mjs')], { stdio: 'inherit' });

const silent = path.join(OUT, `${slug}-silent.mp4`);
if (!process.argv.includes('--skip-capture')) {
  console.log('== Capture ==');
  await captureVideo({ episodeDir: EP, outVideo: silent, fps: cfg.fps, duration: cfg.duration, jpegQuality: 95, crf: 18, preset: 'slow' });
}

console.log('== Mux ==');
const mp4 = path.join(OUT, `${slug}.mp4`);
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', silent, '-i', path.join(OUT, 'final-mix.wav'),
  '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000',
  '-t', String(cfg.duration), '-movflags', '+faststart', mp4], { stdio: 'inherit' });
fs.mkdirSync(path.join(EP, 'final'), { recursive: true });
fs.copyFileSync(mp4, path.join(EP, 'final', `${slug}.mp4`));
console.log('DONE', mp4);
