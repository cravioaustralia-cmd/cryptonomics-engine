#!/usr/bin/env node
/**
 * s35 build: Playwright drives renderFrame(t) from the shared frame.html/engine.js.
 *   node build.mjs stills <outDir> <t1> <t2> ...   → PNG stills (contact sheet input)
 *   node build.mjs video <out.mp4> [workers]       → silent 1080x1920 30 fps H.264
 * Uses the Playwright install in shorts/shared/render (npm install there first).
 */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const epDir = path.resolve(here, '..');
const shared = path.resolve(epDir, '../shared/render');
const require = createRequire(path.join(shared, 'package.json'));
const { chromium } = require('playwright');

const FPS = 30;
const transcript = JSON.parse(fs.readFileSync(path.join(epDir, 'transcript.json'), 'utf8'));
const DURATION = transcript.duration;

function serve() {
  const routes = {
    '/frame.html': path.join(shared, 'frame.html'),
    '/engine.js': path.join(shared, 'engine.js'),
    '/scenes.js': path.join(here, 'scenes.js'),
    '/geo.json': path.join(here, 'geo.json'),
    '/transcript.json': path.join(epDir, 'transcript.json'),
  };
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    let f = routes[u.pathname];
    if (!f && u.pathname.startsWith('/img/')) f = path.join(epDir, 'images', path.basename(decodeURIComponent(u.pathname)));
    if (!f || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'max-age=3600' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(server)));
}

async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  await page.goto(`http://127.0.0.1:${port}/frame.html?scenes=/scenes.js&transcript=/transcript.json`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ready && window.EPISODE);
  // preload + decode every still so no frame captures a half-loaded image
  await page.evaluate(async () => {
    await Promise.all(Object.values(window.EPISODE.images).map((u) => { const i = new Image(); i.src = u; return i.decode().catch(() => {}); }));
    await document.fonts.ready;
  });
  return page;
}

async function frameAt(page, t, type = 'jpeg') {
  await page.evaluate((time) => window.renderFrame(time), t);
  await page.evaluate(() => Promise.all([...document.querySelectorAll('image')].map((im) => (im.complete === false ? new Promise((r) => im.addEventListener('load', r, { once: true })) : null))).then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))));
  return page.screenshot(type === 'png' ? { type: 'png' } : { type: 'jpeg', quality: 92 });
}

const [mode, out, ...rest] = process.argv.slice(2);
const server = await serve();
const port = server.address().port;
const exe = process.env.PW_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ headless: true, executablePath: exe, args: ['--disable-dev-shm-usage', '--no-sandbox'] });

if (mode === 'stills') {
  fs.mkdirSync(out, { recursive: true });
  const page = await openPage(browser, port);
  for (const ts of rest) {
    const buf = await frameAt(page, Number(ts), 'png');
    fs.writeFileSync(path.join(out, `t${Number(ts).toFixed(2).padStart(6, '0')}.png`), buf);
  }
} else if (mode === 'video') {
  const workers = Number(rest[0] || 4);
  const total = Math.round(DURATION * FPS);
  const tmp = out + '.parts';
  fs.mkdirSync(tmp, { recursive: true });
  const per = Math.ceil(total / workers);
  const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const a = w * per, b = Math.min(total, a + per);
    const page = await openPage(browser, port);
    const seg = path.join(tmp, `seg${w}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', 'pipe:0',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = a; i < b; i++) {
      const buf = await frameAt(page, i / FPS);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if ((i - a) % 120 === 0) console.log(`w${w} frame ${i}/${b} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
    ff.stdin.end();
    await new Promise((r, j) => ff.on('exit', (c) => (c === 0 ? r() : j(new Error('ffmpeg seg ' + c)))));
  }));
  const list = path.join(tmp, 'list.txt');
  fs.writeFileSync(list, Array.from({ length: workers }, (_, w) => `file 'seg${w}.mp4'`).join('\n'));
  await new Promise((r, j) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out], { stdio: 'inherit' }).on('exit', (c) => (c === 0 ? r() : j(new Error('concat')))));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('silent video →', out, `${total} frames`, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
server.close();
