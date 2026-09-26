#!/usr/bin/env node
/**
 * Playwright: call renderFrame(t) each frame, pipe JPEGs into ffmpeg → silent MP4.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const renderDir = path.resolve(path.dirname(new URL(import.meta.url).pathname));
const fontsDir = path.resolve(renderDir, '..', 'fonts');

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/** Tiny static server: engine + episode scenes/transcript, /img/* → images/, /fonts/* → shared/fonts/. */
function startServer(episodeDir) {
  const roots = {
    '/engine.js': path.join(renderDir, 'engine.js'),
    '/frame.html': path.join(renderDir, 'frame.html'),
    '/scenes.js': path.join(episodeDir, 'render', 'scenes.js'),
    '/transcript.json': path.join(episodeDir, 'transcript.json'),
  };
  const dirs = [
    ['/img/', path.join(episodeDir, 'images')],
    ['/fonts/', fontsDir],
  ];
  const server = createServer((req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1');
    let file = roots[u.pathname];
    for (const [prefix, dir] of dirs) {
      if (!file && u.pathname.startsWith(prefix)) {
        const p = path.join(dir, decodeURIComponent(u.pathname.slice(prefix.length)));
        if (p.startsWith(dir)) file = p;
      }
    }
    if (!file || !fs.existsSync(file)) {
      res.writeHead(404);
      res.end('missing');
      return;
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(server)));
}

/** Open the episode frame page, wait for scenes, transcript, fonts and any EPISODE.ready preload. */
export async function openEpisodePage(episodeDir) {
  const server = await startServer(episodeDir);
  const { port } = server.address();
  const pageUrl = `http://127.0.0.1:${port}/frame.html?scenes=/scenes.js&transcript=/transcript.json`;
  // CHROMIUM_PATH lets a machine with a pre-installed browser skip `playwright install`.
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  });
  page.on('pageerror', (e) => console.error('[page]', e.message));
  await page.goto(pageUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ready && window.EPISODE);
  await page.evaluate(async () => {
    if (window.EPISODE.ready) await window.EPISODE.ready;
    await document.fonts.ready;
  });
  const close = async () => {
    await browser.close();
    server.close();
  };
  return { page, close };
}

/** Render one frame; resolves after the browser has painted it. */
export function renderAt(page, t) {
  return page.evaluate(
    (time) =>
      new Promise((resolve) => {
        window.renderFrame(time);
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }),
    t
  );
}

export async function captureVideo({ episodeDir, outVideo, fps = 30, duration }) {
  const totalFrames = Math.ceil(duration * fps);
  fs.mkdirSync(path.dirname(outVideo), { recursive: true });

  const ff = spawn(
    'ffmpeg',
    [
      '-y',
      '-f',
      'image2pipe',
      '-framerate',
      String(fps),
      '-i',
      'pipe:0',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-preset',
      'veryfast',
      '-crf',
      '18',
      '-r',
      String(fps),
      '-movflags',
      '+faststart',
      outVideo,
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] }
  );
  const ffDone = new Promise((resolve, reject) => {
    ff.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('ffmpeg video ' + code))));
  });

  const { page, close } = await openEpisodePage(episodeDir);

  const t0 = Date.now();
  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    await renderAt(page, t);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92, animations: 'disabled' });
    const ok = ff.stdin.write(buf);
    if (!ok) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 90 === 0) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`frame ${i}/${totalFrames} t=${t.toFixed(2)}s (${elapsed}s elapsed)`);
    }
  }
  ff.stdin.end();
  await ffDone;
  await close();
  console.log('Silent video →', outVideo);
  return outVideo;
}
