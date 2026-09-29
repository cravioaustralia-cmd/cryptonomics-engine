#!/usr/bin/env node
/**
 * s21 build: render/mix.mjs (float premix → two-pass master loudnorm) → shared capture.mjs
 * (Playwright renderFrame) → mux → final/s21-broome-japanese-cemetery.mp4.
 * Not render-episode.mjs: its shared mixAudio loudnorms VO before amix.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { captureVideo } from '../../shared/render/capture.mjs';

const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DUR = 39.816;
execFileSync('node', [path.join(EP, 'render', 'mix.mjs')], { stdio: 'inherit' });
const silent = path.join(EP, 'out', 's21-silent.mp4');
await captureVideo({ episodeDir: EP, outVideo: silent, fps: 30, duration: DUR });
const final = path.join(EP, 'final', 's21-broome-japanese-cemetery.mp4');
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', silent, '-i', path.join(EP, 'out', 'final-mix.wav'),
  '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', '30',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', String(DUR), '-movflags', '+faststart', final], { stdio: 'inherit' });
console.log('DONE', final);
