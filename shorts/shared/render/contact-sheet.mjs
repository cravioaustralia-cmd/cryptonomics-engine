#!/usr/bin/env node
/**
 * Contact sheet for review before a final render.
 *   node contact-sheet.mjs <episodeDir> [--every 2.5] [--at 0,4.2,9] [--cols 6]
 * Writes <episode>/out/contact-sheet.jpg (+ single frames in out/contact/).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { openEpisode } from './capture.mjs';

const args = process.argv.slice(2);
const episodeDir = path.resolve(args[0] || '.');
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const config = JSON.parse(fs.readFileSync(path.join(episodeDir, 'render', 'config.json'), 'utf8'));
const every = parseFloat(opt('--every', '2.5'));
const cols = parseInt(opt('--cols', '6'), 10);
const times = opt('--at', null)
  ? opt('--at').split(',').map(Number)
  : Array.from({ length: Math.floor(config.duration / every) + 1 }, (_, i) => +(i * every).toFixed(3));

const outDir = path.join(episodeDir, 'out', 'contact');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const { page, close } = await openEpisode(episodeDir);
const files = [];
for (const [i, t] of times.entries()) {
  await page.evaluate((time) => window.renderFrame(time), t);
  const f = path.join(outDir, `f${String(i).padStart(3, '0')}_${t.toFixed(2)}.jpg`);
  await page.screenshot({ path: f, type: 'jpeg', quality: 85 });
  files.push(f);
}
await close();

const rows = Math.ceil(files.length / cols);
const sheet = path.join(episodeDir, 'out', 'contact-sheet.jpg');
spawnSync(
  'ffmpeg',
  ['-y', '-v', 'error', '-framerate', '1', '-pattern_type', 'glob', '-i', path.join(outDir, '*.jpg'),
    '-vf', `scale=270:480,tile=${cols}x${rows}:padding=4:color=black`, '-frames:v', '1', sheet],
  { stdio: 'inherit' }
);
console.log('Contact sheet →', sheet, `(${files.length} frames: ${times.join(', ')})`);
