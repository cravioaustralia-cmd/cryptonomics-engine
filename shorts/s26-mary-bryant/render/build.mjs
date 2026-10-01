#!/usr/bin/env node
/**
 * s26 full build: episode mix (render/mix.mjs, locked path) → shared Playwright capture
 * (shorts/shared/render/capture.mjs) → mux → out/s26-mary-bryant.mp4 + final/ copy.
 *   node shorts/s26-mary-bryant/render/build.mjs [--skip-mix]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const { captureVideo } = await import(path.resolve(EP, '..', 'shared', 'render', 'capture.mjs'));
const cfg = JSON.parse(fs.readFileSync(path.join(EP, 'render', 'config.json'), 'utf8'));
const OUT = path.join(EP, 'out');
fs.mkdirSync(OUT, { recursive: true });
if (!process.argv.includes('--skip-mix')) execFileSync('node', [path.join(EP, 'render', 'mix.mjs')], { stdio: 'inherit' });
const silent = path.join(OUT, `${cfg.slug}-silent.mp4`);
await captureVideo({ episodeDir: EP, outVideo: silent, fps: cfg.fps, duration: cfg.duration, jpegQuality: 95, crf: 19, preset: 'slow' });
const mp4 = path.join(OUT, `${cfg.slug}.mp4`);
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', silent, '-i', path.join(OUT, 'final-mix.wav'),
  '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-t', String(cfg.duration), '-movflags', '+faststart', mp4], { stdio: 'inherit' });
fs.mkdirSync(path.join(EP, 'final'), { recursive: true });
fs.copyFileSync(mp4, path.join(EP, 'final', `${cfg.slug}.mp4`));
console.log('DONE', mp4);
