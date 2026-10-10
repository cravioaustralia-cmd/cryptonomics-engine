#!/usr/bin/env node
/**
 * lf06 Ch1 capture: Playwright calls renderFrame(t) on render/film.html and pipes JPEG frames
 * into ffmpeg. Runs N workers over contiguous frame ranges, then concatenates (lossless copy).
 *
 *   node render/capture.mjs video  [--workers 4] [--out render/build/picture.mp4]
 *   node render/capture.mjs stills 12.5 30 61.2 ...   (PNG stills into render/build/stills/)
 */
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const EP = path.dirname(HERE);
const FPS = 30;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.ttf': 'font/ttf' };

function serve() {
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const f = path.join(EP, path.normalize(u));
    if (!f.startsWith(EP) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(server)));
}

async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/render/film.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 120000 });
  const err = await page.evaluate(() => window.__error);
  if (err) throw new Error(err);
  return page;
}
async function grab(page) {
  // read the canvas directly (faster than a page screenshot)
  const b64 = await page.evaluate(() => document.getElementById('c').toDataURL('image/jpeg', 0.95).split(',')[1]);
  return Buffer.from(b64, 'base64');
}

async function stills(times) {
  const server = await serve(); const { port } = server.address();
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await openPage(browser, port);
  const od = path.join(HERE, 'build', 'stills'); fs.mkdirSync(od, { recursive: true });
  for (const t of times) {
    await page.evaluate((tt) => window.renderFrame(tt), t);
    const f = path.join(od, `t${t.toFixed(2).padStart(7, '0')}.jpg`); fs.writeFileSync(f, await grab(page)); console.log(f);
  }
  await browser.close(); server.close();
}

async function worker(browser, port, f0, f1, out) {
  const page = await openPage(browser, port);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', 'pipe:0',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = f0; i < f1; i++) {
    await page.evaluate((tt) => window.renderFrame(tt), i / FPS);
    const buf = await grab(page);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((i - f0) % 150 === 0) console.log(`[${path.basename(out)}] ${i - f0}/${f1 - f0} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('exit', (c) => (c === 0 ? r() : j(new Error('ffmpeg ' + c)))));
  await page.close();
}

async function video(workers, out) {
  const server = await serve(); const { port } = server.address();
  const tl = JSON.parse(fs.readFileSync(path.join(HERE, 'timeline.json')));
  const total = Math.round(tl.total * FPS);
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const od = path.join(HERE, 'build', 'chunks'); fs.mkdirSync(od, { recursive: true });
  const per = Math.ceil(total / workers); const parts = [];
  const jobs = [];
  for (let w = 0; w < workers; w++) {
    const f0 = w * per, f1 = Math.min(total, f0 + per); if (f0 >= f1) break;
    const p = path.join(od, `part${w}.mp4`); parts.push(p); jobs.push(worker(browser, port, f0, f1, p));
  }
  await Promise.all(jobs);
  await browser.close(); server.close();
  const list = path.join(od, 'list.txt'); fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n'));
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out]);
  console.log('picture ->', out, total, 'frames');
}

const [mode, ...rest] = process.argv.slice(2);
if (mode === 'stills') await stills(rest.map(Number));
else if (mode === 'video') {
  const wi = rest.indexOf('--workers'); const oi = rest.indexOf('--out');
  await video(wi >= 0 ? Number(rest[wi + 1]) : 4, oi >= 0 ? rest[oi + 1] : path.join(HERE, 'build', 'picture.mp4'));
} else { console.error('usage: capture.mjs video|stills ...'); process.exit(1); }
