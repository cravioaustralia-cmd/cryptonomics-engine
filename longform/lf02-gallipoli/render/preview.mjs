#!/usr/bin/env node
// Stills at chosen times through the exact render path (same page, same server routes as capture.mjs).
// Usage: node preview.mjs <outDir> t1 t2 ...   (times in seconds)   or   --every 5 <outDir>
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const episodeDir = path.resolve(here, '..');
const shared = path.resolve(here, '../../../shorts/shared/render');
let args = process.argv.slice(2);
let every = null;
let cuesOut = null;
if (args[0] === '--cues') { cuesOut = args[1]; args = args.slice(2); }
if (args[0] === '--every') { every = parseFloat(args[1]); args = args.slice(2); }
const outDir = path.resolve(args.shift() || '/tmp');
fs.mkdirSync(outDir, { recursive: true });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  let f = null;
  if (u.pathname === '/frame.html') f = path.join(here, 'frame.html');
  else if (u.pathname === '/engine.js') f = path.join(shared, 'engine.js');
  else if (u.pathname === '/scenes.js') f = path.join(here, 'scenes.js');
  else if (u.pathname.startsWith('/ep/')) f = path.join(here, decodeURIComponent(u.pathname.slice(4)));
  if (!f || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
page.on('response', (r) => { if (r.status() >= 400) console.error('HTTP', r.status(), r.url()); });
await page.goto(`http://127.0.0.1:${server.address().port}/frame.html`);
await page.waitForFunction(() => window.__ready && window.EPISODE_READY);
await page.evaluate(() => window.EPISODE_READY);
const dur = await page.evaluate(() => window.EPISODE.duration);
if (cuesOut) { fs.writeFileSync(cuesOut, JSON.stringify(await page.evaluate(() => window.CUES), null, 1)); console.log('cues ->', cuesOut); }
let times = args.map(Number);
if (every) { times = []; for (let t = 0; t < dur; t += every) times.push(+t.toFixed(2)); }
const t0 = Date.now();
for (const t of times) {
  await page.evaluate((x) => window.renderFrame(x), t);
  await page.screenshot({ path: path.join(outDir, `t${String(Math.round(t * 100)).padStart(6, '0')}.jpg`), type: 'jpeg', quality: 85 });
}
console.log(times.length, 'stills in', ((Date.now() - t0) / 1000).toFixed(1), 's →', outDir);
await browser.close();
server.close();
