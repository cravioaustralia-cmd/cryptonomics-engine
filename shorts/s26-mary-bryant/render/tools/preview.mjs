#!/usr/bin/env node
/**
 * Render selected timestamps of this episode to PNG (same page + server layout as
 * shared/render/capture.mjs). Usage:
 *   node render/tools/preview.mjs <outDir> t1 t2 ...      (seconds)
 *   node render/tools/preview.mjs <outDir> --every 1.5     (contact-sheet sampling)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const SHARED = path.resolve(EP, '..', 'shared', 'render');
const require = createRequire(path.join(SHARED, 'package.json'));
const { chromium } = require('playwright');

const outDir = path.resolve(process.argv[2]);
let times = process.argv.slice(3);
const dur = JSON.parse(fs.readFileSync(path.join(EP, 'transcript.json'), 'utf8')).duration;
if (times[0] === '--every') { const st = +times[1]; times = []; for (let t = 0; t < dur; t += st) times.push(t.toFixed(2)); }
times = times.map(Number);
fs.mkdirSync(outDir, { recursive: true });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  let f = { '/engine.js': path.join(SHARED, 'engine.js'), '/frame.html': path.join(SHARED, 'frame.html'), '/scenes.js': path.join(EP, 'render', 'scenes.js'), '/transcript.json': path.join(EP, 'transcript.json') }[u.pathname];
  if (!f && u.pathname.startsWith('/img/')) f = path.join(EP, 'images', decodeURIComponent(u.pathname.slice(5)));
  if (!f && u.pathname.startsWith('/ep/')) f = path.join(EP, decodeURIComponent(u.pathname.slice(4)));
  if (!f || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const opts = { headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox'] };
let browser;
try { browser = await chromium.launch(opts); } catch { browser = await chromium.launch({ ...opts, executablePath: '/opt/pw-browsers/chromium' }); }
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text()); });
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/frame.html?scenes=/scenes.js&transcript=/transcript.json`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ready && window.EPISODE && window.__assetsReady !== false, null, { timeout: 120000 });
const t0 = Date.now();
const prof = process.env.PROFILE;
for (const t of times) {
  const a = Date.now();
  await page.evaluate((x) => window.renderFrame(x), t);
  const b = Date.now();
  if (prof) await page.screenshot({ type: 'jpeg', quality: 92 });
  else await page.screenshot({ path: path.join(outDir, `f_${t.toFixed(2).padStart(6, '0')}.png`) });
  if (prof) console.log(t, 'eval', b - a, 'shot', Date.now() - b);
}
console.log(`${times.length} frames, ${((Date.now() - t0) / times.length).toFixed(0)} ms/frame`);
await browser.close(); server.close();
