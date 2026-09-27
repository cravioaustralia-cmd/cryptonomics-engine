#!/usr/bin/env node
/**
 * Grab single frames from an episode's renderFrame(t) as JPEGs (for checks / contact sheets).
 * Usage: node snapshot.mjs <episodeDir> <outDir> t1 t2 ...
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const [episodeArg, outArg, ...times] = process.argv.slice(2);
const episodeDir = path.resolve(episodeArg);
const outDir = path.resolve(outArg);
const renderDir = path.dirname(new URL(import.meta.url).pathname);
fs.mkdirSync(outDir, { recursive: true });

const roots = {
  '/engine.js': path.join(renderDir, 'engine.js'),
  '/frame.html': path.join(renderDir, 'frame.html'),
  '/scenes.js': path.join(episodeDir, 'render', 'scenes.js'),
  '/transcript.json': path.join(episodeDir, 'transcript.json'),
};
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = createServer((req, res) => {
  const u = new URL(req.url, 'http://127.0.0.1');
  let file = roots[u.pathname];
  if (!file && u.pathname.startsWith('/img/')) file = path.join(episodeDir, 'images', decodeURIComponent(u.pathname.slice(5)));
  if (!file || !fs.existsSync(file)) return res.writeHead(404).end('missing');
  res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const { port } = server.address();
const browser = await chromium.launch({ headless: true,
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--disable-dev-shm-usage', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
await page.goto(`http://127.0.0.1:${port}/frame.html?scenes=/scenes.js&transcript=/transcript.json`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ready && window.EPISODE);
for (const t of times) {
  await page.evaluate((x) => window.renderFrame(x), Number(t));
  const f = path.join(outDir, `t${Number(t).toFixed(2).padStart(6, '0')}.jpg`);
  await page.screenshot({ path: f, type: 'jpeg', quality: 85 });
  console.log(f);
}
await browser.close();
server.close();
