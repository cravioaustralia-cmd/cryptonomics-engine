#!/usr/bin/env node
/**
 * Contact sheet: render sample frames via renderFrame(t) and tile them for review.
 * Usage: node contact-sheet.mjs <episodeDir> [out.jpg] [--times 0,1.5,...] [--every 2.5] [--cols 6]
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { openEpisodePage } from './capture.mjs';

const args = process.argv.slice(2);
const episodeDir = path.resolve(args[0] || '.');
const opt = (k, d) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : d;
};
const cfg = JSON.parse(fs.readFileSync(path.join(episodeDir, 'render', 'config.json'), 'utf8'));
const outFile = path.resolve(args[1] && !args[1].startsWith('--') ? args[1] : path.join(episodeDir, 'out', 'contact-sheet.jpg'));
const every = Number(opt('--every', 2.5));
const cols = Number(opt('--cols', 6));
const times = opt('--times')
  ? opt('--times').split(',').map(Number)
  : Array.from({ length: Math.floor(cfg.duration / every) + 1 }, (_, i) => +(i * every).toFixed(3));

const tmp = path.join(path.dirname(outFile), 'contact-frames');
fs.mkdirSync(tmp, { recursive: true });
for (const f of fs.readdirSync(tmp)) fs.unlinkSync(path.join(tmp, f));

const { page, browser, server } = await openEpisodePage(episodeDir);
for (let i = 0; i < times.length; i++) {
  await page.evaluate((time) => {
    window.renderFrame(time);
    let el = document.getElementById('__cs');
    if (!el) {
      el = document.createElement('div');
      el.id = '__cs';
      el.style.cssText = 'position:fixed;left:12px;top:12px;font:700 56px sans-serif;color:#fff;background:rgba(0,0,0,.7);padding:4px 14px;z-index:9';
      document.body.appendChild(el);
    }
    el.textContent = time.toFixed(2) + 's';
  }, times[i]);
  await page.screenshot({ path: path.join(tmp, `f${String(i).padStart(3, '0')}.jpg`), type: 'jpeg', quality: 85 });
}
await browser.close();
server.close();

const rows = Math.ceil(times.length / cols);
const labels = times.map((t) => t.toFixed(2));
fs.writeFileSync(path.join(tmp, 'labels.txt'), labels.join('\n'));
await new Promise((resolve, reject) => {
  const p = spawn('ffmpeg', [
    '-y', '-framerate', '1', '-i', path.join(tmp, 'f%03d.jpg'),
    '-vf', `scale=270:480,tile=${cols}x${rows}:padding=6:color=0x222222`,
    '-frames:v', '1', outFile,
  ], { stdio: ['ignore', 'ignore', 'inherit'] });
  p.on('exit', (c) => (c === 0 ? resolve() : reject(new Error('tile ' + c))));
});
console.log('Contact sheet →', outFile, `(${times.length} frames: ${labels.join(', ')})`);
