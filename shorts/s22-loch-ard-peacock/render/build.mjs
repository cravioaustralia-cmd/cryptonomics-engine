#!/usr/bin/env node
/**
 * s22 full build: mix (mix.mjs) → Playwright capture (shared/render/capture.mjs)
 * → mux → final/s22-loch-ard-peacock.mp4 + final/contact-sheet.jpg (from the final MP4).
 *   PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium node build.mjs   (cloud container)
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { captureVideo } from '../../shared/render/capture.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const EP = path.resolve(HERE, '..');
const slug = path.basename(EP);
const OUT = path.join(EP, 'out');
const FINAL = path.join(EP, 'final');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(FINAL, { recursive: true });
const { duration } = JSON.parse(fs.readFileSync(path.join(EP, 'transcript.json'), 'utf8'));
const fps = 30;

console.log('== Mix ==');
execFileSync('node', [path.join(HERE, 'mix.mjs')], { stdio: 'inherit' });

console.log('== Capture ==');
const silent = path.join(OUT, `${slug}-silent.mp4`);
await captureVideo({ episodeDir: EP, outVideo: silent, fps, duration });

console.log('== Mux ==');
const mp4 = path.join(FINAL, `${slug}.mp4`);
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', silent, '-i', path.join(OUT, 'final-mix.wav'),
  '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', String(duration),
  '-movflags', '+faststart', mp4], { stdio: 'inherit' });

console.log('== Contact sheet (from final MP4) ==');
const N = 24;
const cols = 6;
const sheet = path.join(FINAL, 'contact-sheet.jpg');
const times = Array.from({ length: N }, (_, i) => (i + 0.5) * (duration / N));
const tmp = fs.mkdtempSync(path.join(OUT, 'cs-'));
times.forEach((t, i) => {
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', t.toFixed(3), '-i', mp4, '-frames:v', '1',
    '-vf', `scale=270:480,drawtext=text='${t.toFixed(1)}s':x=8:y=8:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.6`,
    path.join(tmp, `c${String(i).padStart(2, '0')}.png`)]);
});
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', '1', '-i', path.join(tmp, 'c%02d.png'),
  '-vf', `tile=${cols}x${Math.ceil(N / cols)}`, '-frames:v', '1', '-q:v', '3', sheet]);
fs.rmSync(tmp, { recursive: true, force: true });

const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate:format=duration,size', '-of', 'compact', mp4]).toString();
console.log(probe);
console.log('DONE', mp4, sheet);
