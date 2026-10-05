#!/usr/bin/env node
/**
 * s32 full build: mix (mix.mjs) → parallel Playwright capture through the shared episode page
 * (shared/render/capture.mjs openEpisodePage; same renderFrame(t) path) → concat → mux
 * → final/s32-phar-lap.mp4 (+ out/ copy) + final/contact-sheet.jpg (from the final MP4).
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

console.log('== Spin frames (globe turns; cached, only changed frames re-render) ==');
execFileSync('node', [path.join(HERE, 'tools', 'dump_spins.mjs')], { stdio: 'inherit' });
execFileSync('python3', [path.join(HERE, 'tools', 'make_spin.py')], { stdio: 'inherit' });

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

console.log('== Mux (video re-encode for size; audio = the measured AAC, stream-copied, never re-encoded) ==');
const mp4 = path.join(FINAL, `${slug}.mp4`);
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', silent, '-i', path.join(OUT, 'final-mix.m4a'),
  '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-tune', 'film', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-t', String(duration),
  '-movflags', '+faststart', mp4], { stdio: 'inherit' });
fs.copyFileSync(mp4, path.join(OUT, `${slug}.mp4`));
// true peak of the AAC as delivered inside the master MP4 (the sign-off number)
const r = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${mp4}" -map 0:a -af ebur128=peak=true -f null - 2>&1`]).toString();
const tp = +r.match(/True peak:\s+Peak:\s+(-?[\d.]+) dBFS/)[1];
const I = +r.match(/I:\s+(-?[\d.]+) LUFS/g).pop().match(/-?[\d.]+/)[0];
const line = `MASTER ${slug}.mp4 audio (AAC, stream-copied): I ${I} LUFS · true peak ${tp} dBTP → ${tp <= -1.5 ? 'PASS (≤ −1.5 dBTP)' : 'FAIL'}`;
console.log(line);
fs.appendFileSync(path.join(OUT, 'loudnorm-report.txt'), line + '\n');
fs.copyFileSync(path.join(OUT, 'loudnorm-report.txt'), path.join(FINAL, 'loudnorm-report.txt'));
if (tp > -1.5) throw new Error('AAC true peak over -1.5 dBTP');

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
