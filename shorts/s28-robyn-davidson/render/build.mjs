#!/usr/bin/env node
/**
 * s28 full build: mix (mix.mjs) → parallel Playwright capture through the shared episode page
 * (shared/render/capture.mjs openEpisodePage; same renderFrame(t) path) → concat → mux
 * → final/s28-robyn-davidson.mp4 (+ out/ copy) + final/contact-sheet.jpg (from the final MP4).
 *   PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium node build.mjs [--workers 4] [--remux]
 */
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { openEpisodePage } from '../../shared/render/capture.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const EP = path.resolve(HERE, '..');
const slug = path.basename(EP);
const OUT = path.join(EP, 'out');
const FINAL = path.join(EP, 'final');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(FINAL, { recursive: true });
const { duration } = JSON.parse(fs.readFileSync(path.join(EP, 'transcript.json'), 'utf8'));
const fps = 30;
const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : d;
};
const WORKERS = +arg('--workers', 4);

console.log('== Mix ==');
execFileSync('node', [path.join(HERE, 'mix.mjs')], { stdio: 'inherit' });

const silent = path.join(OUT, `${slug}-silent.mp4`);
async function captureChunk(i0, i1, file) {
  const { page, close } = await openEpisodePage(EP);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', 'pipe:0',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '16', '-r', String(fps), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = i0; i < i1; i++) {
    await page.evaluate((x) => window.renderFrame(x), i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((i - i0) % 150 === 0) console.log(`  [${path.basename(file)}] ${i - i0}/${i1 - i0} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('exit', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
  await close();
}
if (process.argv.includes('--remux') && fs.existsSync(silent)) {
  console.log('== Capture skipped (--remux) ==');
} else {
  console.log(`== Capture (${WORKERS} workers) ==`);
  const total = Math.round(duration * fps);
  const per = Math.ceil(total / WORKERS);
  const parts = [];
  const jobs = [];
  for (let w = 0; w < WORKERS; w++) {
    const a = w * per;
    const b = Math.min(total, a + per);
    if (a >= b) break;
    const f = path.join(OUT, `part${w}.mp4`);
    parts.push(f);
    jobs.push(captureChunk(a, b, f));
  }
  await Promise.all(jobs);
  const list = path.join(OUT, 'parts.txt');
  fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', silent]);
  parts.forEach((p) => fs.rmSync(p));
  fs.rmSync(list);
}

console.log('== Mux ==');
const mp4 = path.join(FINAL, `${slug}.mp4`);
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', silent, '-i', path.join(OUT, 'final-mix.wav'),
  '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', String(duration),
  '-movflags', '+faststart', mp4], { stdio: 'inherit' });
fs.copyFileSync(mp4, path.join(OUT, `${slug}.mp4`));

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
console.log(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate:format=duration,size', '-of', 'compact', mp4]).toString());
console.log('DONE', mp4, sheet);
