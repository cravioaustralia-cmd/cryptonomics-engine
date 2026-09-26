#!/usr/bin/env node
/**
 * Contact sheet: render renderFrame(t) at fixed intervals (or explicit times) and tile
 * the stills into one PNG for review before the final render.
 *
 *   node contact-sheet.mjs <episodeDir> [--every 2.5] [--at 0,3.1,14.9] [--cols 6] [--thumb 270]
 *
 * Writes out/contact/frame_NNN.jpg (full-size, timestamped) and out/contact-sheet.png.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
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
const thumb = parseInt(opt('thumb', '270'), 10);
const at = opt('at', '');
const times = at
  ? at.split(',').map(Number)
  : Array.from({ length: Math.floor(config.duration / every) + 1 }, (_, i) => +(i * every).toFixed(3)).filter(
      (t) => t < config.duration
    );

const outDir = path.join(episodeDir, 'out', 'contact');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const { page, browser, server } = await openEpisodePage(episodeDir);
for (let i = 0; i < times.length; i++) {
  const t = times[i];
  await page.evaluate((time) => {
    window.renderFrame(time);
    let tag = document.getElementById('__cs_tag');
    if (!tag) {
      tag = document.createElement('div');
      tag.id = '__cs_tag';
      tag.style.cssText =
        'position:absolute;left:0;top:0;padding:10px 18px;font:bold 64px monospace;color:#ff0;background:rgba(0,0,0,.75);z-index:9';
      document.body.appendChild(tag);
    }
    tag.textContent = time.toFixed(2) + 's';
  }, t);
  await page.screenshot({ path: path.join(outDir, `frame_${String(i).padStart(3, '0')}.jpg`), type: 'jpeg', quality: 85 });
}
await browser.close();
server.close();

const rows = Math.ceil(times.length / cols);
const sheet = path.join(episodeDir, 'out', 'contact-sheet.png');
const r = spawnSync(
  'ffmpeg',
  [
    '-y',
    '-v',
    'error',
    '-framerate',
    '1',
    '-i',
    path.join(outDir, 'frame_%03d.jpg'),
    '-vf',
    `scale=${thumb}:-1,tile=${cols}x${rows}:padding=6:margin=6:color=0x222222`,
    '-frames:v',
    '1',
    sheet,
  ],
  { stdio: 'inherit' }
);
if (r.status !== 0) process.exit(r.status || 1);
console.log(`Contact sheet (${times.length} frames) →`, sheet);
