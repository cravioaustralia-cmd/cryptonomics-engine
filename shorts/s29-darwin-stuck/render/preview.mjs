#!/usr/bin/env node
/**
 * Render chosen timestamps to JPEG stills (design review + contact sheet).
 * Uses the shared frame.html / engine.js and this episode's scenes.js via the same
 * static-server layout as shorts/shared/render/capture.mjs.
 *
 *   node preview.mjs <outDir> t1 t2 ...        (times in seconds)
 *   node preview.mjs <outDir> --sheet          (contact sheet times; see SHEET_TIMES)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const EP = path.resolve(HERE, '..');
const SHARED = path.resolve(EP, '..', 'shared', 'render');
const require = createRequire(path.join(SHARED, 'package.json'));
const { chromium } = require('playwright');

export const SHEET_TIMES = [0.0, 0.5, 2.6, 5.3, 7.9, 9.0, 10.6, 11.4, 12.9, 14.6, 16.8, 19.7, 20.9, 22.8,
  24.6, 26.4, 27.4, 28.6, 30.4, 31.6, 32.6, 33.8, 35.6, 37.9, 39.6, 42.0, 43.4, 44.6, 46.1, 47.9, 50.2, 51.85];

const outDir = path.resolve(process.argv[2] || path.join(EP, 'out', 'preview'));
let times = process.argv.slice(3).map(Number).filter((x) => !Number.isNaN(x));
if (process.argv.includes('--sheet')) times = SHEET_TIMES;
fs.mkdirSync(outDir, { recursive: true });

const roots = {
  '/engine.js': path.join(SHARED, 'engine.js'),
  '/frame.html': path.join(SHARED, 'frame.html'),
  '/scenes.js': path.join(EP, 'render', 'scenes.js'),
  '/transcript.json': path.join(EP, 'transcript.json'),
};
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const u = new URL(req.url, 'http://127.0.0.1');
  let file = roots[u.pathname];
  if (!file && u.pathname.startsWith('/img/')) file = path.join(EP, 'images', decodeURIComponent(u.pathname.slice(5)));
  if (!file || !fs.existsSync(file)) { res.writeHead(404); res.end('missing'); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const { port } = server.address();
const browser = await chromium.launch({ headless: true, executablePath: process.env.PW_CHROMIUM_PATH || undefined, args: ['--disable-dev-shm-usage', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text()); });
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto(`http://127.0.0.1:${port}/frame.html?scenes=/scenes.js&transcript=/transcript.json`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ready && window.EPISODE, null, { timeout: 120000 });
for (const t of times) {
  await page.evaluate((x) => window.renderFrame(x), t);
  const f = path.join(outDir, `t${t.toFixed(2).padStart(5, '0')}.jpg`);
  await page.screenshot({ path: f, type: 'jpeg', quality: 90 });
  console.log(f);
}
await browser.close();
server.close();
