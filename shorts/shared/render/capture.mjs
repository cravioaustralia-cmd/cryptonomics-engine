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

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};

/**
 * Serve the episode through a tiny static server (file:// can't load cross-folder cleanly)
 * and open frame.html in headless Chromium. Returns { page, close }.
 */
export async function openEpisode(episodeDir) {
  const roots = {
    '/engine.js': path.join(renderDir, 'engine.js'),
    '/frame.html': path.join(renderDir, 'frame.html'),
    '/scenes.js': path.join(episodeDir, 'render', 'scenes.js'),
    '/transcript.json': path.join(episodeDir, 'transcript.json'),
  };
  const imgRoot = path.join(episodeDir, 'images');

  const server = createServer((req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1');
    let file = roots[u.pathname];
    // map /img/* to episode images
    if (!file && u.pathname.startsWith('/img/')) {
      file = path.join(imgRoot, decodeURIComponent(u.pathname.slice(5)));
    }
    // shared OFL fonts (shorts/shared/render/fonts) for scenes that load @font-face
    if (!file && u.pathname.startsWith('/fonts/')) {
      file = path.join(renderDir, 'fonts', path.basename(decodeURIComponent(u.pathname.slice(7))));
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

  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  const pageUrl = `http://127.0.0.1:${port}/frame.html?scenes=/scenes.js&transcript=/transcript.json`;

  const browser = await chromium.launch({
    headless: true,
    // CHROMIUM_PATH lets sandboxes with a pre-installed Chromium skip `playwright install`
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  });
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  await page.goto(pageUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ready && window.EPISODE);
  // optional episode preload hook (fonts, image decode) before the first frame
  await page.evaluate(async () => {
    if (window.EPISODE && typeof window.EPISODE.preload === 'function') await window.EPISODE.preload();
    if (document.fonts) await document.fonts.ready;
  });

  return {
    page,
    async close() {
      await browser.close();
      server.close();
    },
  };
}

export async function captureVideo({ episodeDir, outVideo, fps = 30, duration, video = {} }) {
  const crf = String(video.crf ?? 18);
  const preset = video.preset || 'veryfast';
  const jpegQuality = video.jpegQuality ?? 88;
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
      preset,
      '-crf',
      crf,
      ...(video.maxrate ? ['-maxrate', video.maxrate, '-bufsize', video.bufsize || video.maxrate] : []),
      '-r',
      String(fps),
      '-movflags',
      '+faststart',
      outVideo,
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] }
  );

  const { page, close } = await openEpisode(episodeDir);

  const t0 = Date.now();
  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    // renderFrame may return a promise (e.g. waiting on image decode); evaluate awaits it
    await page.evaluate((time) => window.renderFrame(time), t);
    const buf = await page.screenshot({ type: 'jpeg', quality: jpegQuality, animations: 'disabled' });
    const ok = ff.stdin.write(buf);
    if (!ok) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 90 === 0) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`frame ${i}/${totalFrames} t=${t.toFixed(2)}s (${elapsed}s elapsed)`);
    }
  }
  ff.stdin.end();
  await new Promise((resolve, reject) => {
    ff.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('ffmpeg video ' + code))));
  });
  await close();
  console.log('Silent video →', outVideo);
  return outVideo;
}
