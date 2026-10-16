#!/usr/bin/env node
/**
 * Grab individual frames for review / contact sheets.
 * Usage: node stills.mjs <outDir> t1 t2 ...   (times in seconds)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';

const here = path.dirname(new URL(import.meta.url).pathname);
const episodeDir = path.resolve(here, '..');
const shared = path.resolve(episodeDir, '..', 'shared', 'render');
const require = createRequire(path.join(shared, 'package.json'));
const { chromium } = require('playwright');

const outDir = path.resolve(process.argv[2]);
const times = process.argv.slice(3).map(Number);
fs.mkdirSync(outDir, { recursive: true });

const roots = {
  '/engine.js': path.join(shared, 'engine.js'),
  '/frame.html': path.join(shared, 'frame.html'),
  '/scenes.js': path.join(episodeDir, 'render', 'scenes.js'),
  '/transcript.json': path.join(episodeDir, 'transcript.json'),
};
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  let file = roots[u.pathname];
  if (!file && u.pathname.startsWith('/img/')) file = path.join(episodeDir, 'images', decodeURIComponent(u.pathname.slice(5)));
  if (!file || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/frame.html?scenes=/scenes.js&transcript=/transcript.json`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ready);
for (const t of times) {
  await page.evaluate((x) => window.renderFrame(x), t);
  await page.evaluate(() => Promise.all([...document.images].map((i) => (i.decode ? i.decode().catch(() => {}) : 0))));
  await page.waitForTimeout(60);
  await page.screenshot({ path: path.join(outDir, `t${t.toFixed(2).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 85 });
}
await browser.close();
server.close();
console.log('wrote', times.length, 'stills to', outDir);
