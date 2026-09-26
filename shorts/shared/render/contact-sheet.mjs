#!/usr/bin/env node
/**
 * Contact sheet: render renderFrame(t) at fixed intervals (or explicit times) and tile
 * them into one JPEG with timestamps. Review this before every final render.
 *
 *   node contact-sheet.mjs <episodeDir> [--every 2.5] [--at 0,7.4,12] [--cols 6] [--out file.jpg] [--full]
 *
 * --full also keeps each full-res 1080×1920 frame in out/contact/ for close review.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { openEpisodePage } from './capture.mjs';

const args = process.argv.slice(2);
const episodeDir = path.resolve(args[0] || '.');
const opt = (name, def) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : def;
};
const config = JSON.parse(fs.readFileSync(path.join(episodeDir, 'render', 'config.json'), 'utf8'));
const every = parseFloat(opt('every', '2.5'));
const cols = parseInt(opt('cols', '6'), 10);
const keepFull = args.includes('--full');
const outDir = path.join(episodeDir, 'out');
const frameDir = path.join(outDir, 'contact');
const outFile = path.resolve(opt('out', path.join(outDir, 'contact-sheet.jpg')));
fs.mkdirSync(frameDir, { recursive: true });
fs.mkdirSync(path.dirname(outFile), { recursive: true });

const times = opt('at', null)
  ? opt('at').split(',').map(Number)
  : Array.from({ length: Math.floor(config.duration / every) + 1 }, (_, i) =>
      Math.min(config.duration - 1 / 30, i * every)
    );

const run = (cmd, a) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, a, { stdio: ['ignore', 'ignore', 'inherit'] });
    p.on('exit', (c) => (c === 0 ? resolve() : reject(new Error(cmd + ' ' + c))));
  });

const { page, close } = await openEpisodePage({ episodeDir });
const files = [];
for (const [i, t] of times.entries()) {
  await page.evaluate((time) => window.renderFrame(time), t);
  const f = path.join(frameDir, `f${String(i).padStart(3, '0')}_${t.toFixed(2)}.jpg`);
  await page.screenshot({ path: f, type: 'jpeg', quality: 85 });
  files.push({ f, t });
}
await close();

// Tile: 270×480 cells with a timestamp label.
const inputs = files.flatMap(({ f }) => ['-i', f]);
const cells = files
  .map(
    ({ t }, i) =>
      `[${i}:v]scale=270:480,drawtext=text='${t.toFixed(2)}s':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6[c${i}]`
  )
  .join(';');
const layout = files
  .map((_, i) => `${(i % cols) * 270}_${Math.floor(i / cols) * 480}`)
  .join('|');
const stack =
  files.length > 1
    ? `${files.map((_, i) => `[c${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}:fill=black[out]`
    : `[c0]null[out]`;
await run('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', `${cells};${stack}`, '-map', '[out]', '-q:v', '3', outFile]);
if (!keepFull) for (const { f } of files) fs.unlinkSync(f);
console.log('Contact sheet →', outFile);
