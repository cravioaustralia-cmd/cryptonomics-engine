#!/usr/bin/env node
/**
 * Contact sheet: render frames every N seconds (or at explicit times) and tile them.
 *
 *   node contact-sheet.mjs <episodeDir> [--every 2.5] [--at 0,3.2,10] [--cols 6] [--out file.jpg]
 *
 * Writes out/contact/<t>.png per frame (timestamp burned in) plus out/contact-sheet.jpg.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { openEpisodePage, renderAt } from './capture.mjs';

const args = process.argv.slice(2);
const episodeDir = path.resolve(args[0] || '.');
const opt = (name, def) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : def;
};
const config = JSON.parse(fs.readFileSync(path.join(episodeDir, 'render', 'config.json'), 'utf8'));
const every = parseFloat(opt('every', '2.5'));
const cols = parseInt(opt('cols', '6'), 10);
const times = opt('at')
  ? opt('at').split(',').map(Number)
  : Array.from({ length: Math.floor(config.duration / every) + 1 }, (_, i) =>
      Math.min(i * every, config.duration - 1 / (config.fps || 30))
    );

const outDir = path.join(episodeDir, 'out');
const frameDir = path.join(outDir, 'contact');
fs.rmSync(frameDir, { recursive: true, force: true });
fs.mkdirSync(frameDir, { recursive: true });
const sheet = path.resolve(opt('out', path.join(outDir, 'contact-sheet.jpg')));

const { page, close } = await openEpisodePage(episodeDir);
const files = [];
for (const t of times) {
  await renderAt(page, t);
  // Burn a timestamp tag into the review frame (ffmpeg static build has no drawtext).
  await page.evaluate((time) => {
    let tag = document.getElementById('__cs_tag');
    if (!tag) {
      tag = document.createElement('div');
      tag.id = '__cs_tag';
      tag.style.cssText =
        'position:fixed;left:0;bottom:0;padding:6px 18px;background:#000;color:#ff0;font:bold 64px monospace;z-index:9';
      document.body.appendChild(tag);
    }
    tag.textContent = time.toFixed(2) + 's';
  }, t);
  const f = path.join(frameDir, `${t.toFixed(2).padStart(6, '0')}.png`);
  await page.screenshot({ path: f });
  files.push({ f, t });
}
await close();

// Tile with ffmpeg: scale each frame to 270×480 with a thin border, then xstack.
const w = 270;
const h = 480;
const inputs = files.flatMap(({ f }) => ['-i', f]);
const rows = Math.ceil(files.length / cols);
const filters = files.map(
  (_, i) =>
    `[${i}:v]scale=${w}:${h},pad=${w + 4}:${h + 4}:2:2:black[v${i}]`
);
// Pad the grid with black tiles so xstack gets a full rectangle.
const total = rows * cols;
for (let i = files.length; i < total; i++) {
  filters.push(`color=black:s=${w + 4}x${h + 4}:d=1[v${i}]`);
}
const layout = Array.from({ length: total }, (_, i) => `${(i % cols) * (w + 4)}_${Math.floor(i / cols) * (h + 4)}`).join('|');
filters.push(
  `${Array.from({ length: total }, (_, i) => `[v${i}]`).join('')}xstack=inputs=${total}:layout=${layout}[out]`
);
await new Promise((resolve, reject) => {
  const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filters.join(';'), '-map', '[out]', '-frames:v', '1', '-q:v', '3', sheet], {
    stdio: 'inherit',
  });
  p.on('exit', (c) => (c === 0 ? resolve() : reject(new Error('contact sheet ffmpeg ' + c))));
});
console.log('Contact sheet →', sheet);
console.log('Times:', times.map((t) => t.toFixed(2)).join(' '));
