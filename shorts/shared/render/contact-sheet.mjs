#!/usr/bin/env node
/**
 * Contact sheet: render renderFrame(t) at fixed intervals (or explicit times)
 * and tile the frames with timestamps → out/contact-sheet.jpg.
 *
 *   node contact-sheet.mjs <episodeDir> [--every 2.5] [--times 0,1.5,4] [--cols 6]
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { openEpisode } from './capture.mjs';

const args = process.argv.slice(2);
const episodeDir = path.resolve(args[0] || '.');
const opt = (name, def) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : def;
};
const config = JSON.parse(fs.readFileSync(path.join(episodeDir, 'render', 'config.json'), 'utf8'));
const duration = config.duration;
const every = Number(opt('every', 2.5));
const cols = Number(opt('cols', 6));
let times = opt('times', null);
times = times
  ? times.split(',').map(Number)
  : Array.from({ length: Math.floor(duration / every) + 1 }, (_, i) => +(i * every).toFixed(3));
times = times.filter((t) => t <= duration - 1 / (config.fps || 30));

const outDir = path.join(episodeDir, 'out', 'contact');
fs.mkdirSync(outDir, { recursive: true });
const { page, close } = await openEpisode(episodeDir);
const files = [];
for (const [i, t] of times.entries()) {
  await page.evaluate((time) => window.renderFrame(time), t);
  const f = path.join(outDir, `f${String(i).padStart(3, '0')}.jpg`);
  await page.screenshot({ path: f, type: 'jpeg', quality: 85 });
  files.push({ f, t });
}
await close();

const tw = 270;
const th = 480;
const rows = Math.ceil(files.length / cols);
const inputs = files.flatMap(({ f }) => ['-i', f]);
const labelled = files
  .map(
    ({ t }, i) =>
      `[${i}:v]scale=${tw}:${th},drawtext=text='${t.toFixed(2)}s':x=8:y=8:fontsize=22:` +
      `fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=4[v${i}]`
  )
  .join(';');
// pad missing cells with black so xstack gets a full grid
const pads = [];
for (let i = files.length; i < rows * cols; i++) {
  pads.push(`color=c=black:s=${tw}x${th}:d=1[v${i}]`);
}
const layout = Array.from({ length: rows * cols }, (_, i) => `${(i % cols) * tw}_${Math.floor(i / cols) * th}`).join('|');
const stackIn = Array.from({ length: rows * cols }, (_, i) => `[v${i}]`).join('');
const filter = [labelled, ...pads, `${stackIn}xstack=inputs=${rows * cols}:layout=${layout}[out]`].join(';');
const sheet = path.join(episodeDir, 'out', 'contact-sheet.jpg');
await new Promise((resolve, reject) => {
  const p = spawn('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', filter, '-map', '[out]', '-frames:v', '1', sheet], {
    stdio: 'inherit',
  });
  p.on('exit', (c) => (c === 0 ? resolve() : reject(new Error('contact sheet ' + c))));
});
console.log('Contact sheet →', sheet);
