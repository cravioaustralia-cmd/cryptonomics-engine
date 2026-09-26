#!/usr/bin/env node
/**
 * Playwright: call renderFrame(t) each frame, pipe JPEGs into ffmpeg → silent MP4.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/** Serve frame.html + episode assets, open it in headless Chromium and wait for the episode. */
export async function openEpisodePage(episodeDir) {
  const renderDir = path.resolve(path.dirname(new URL(import.meta.url).pathname));
  const frameHtml = path.join(renderDir, 'frame.html');
  // Serve via file:// with query — scenes must be file URLs relative won't work cross-folder.
  // Use a tiny static server instead for clean paths.
  const { createServer } = await import('node:http');
  const roots = {
    '/engine.js': path.join(renderDir, 'engine.js'),
    '/frame.html': frameHtml,
    '/scenes.js': path.join(episodeDir, 'render', 'scenes.js'),
    '/transcript.json': path.join(episodeDir, 'transcript.json'),
  };
  // map /img/* to episode images
  const imgRoot = path.join(episodeDir, 'images');

  const server = createServer((req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1');
    let file = roots[u.pathname];
    if (!file && u.pathname.startsWith('/img/')) {
      file = path.join(imgRoot, decodeURIComponent(u.pathname.slice(5)));
    }
    if (!file || !fs.existsSync(file)) {
      res.writeHead(404);
      res.end('missing');
      return;
    }
    const ext = path.extname(file).toLowerCase();
    const types = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });

  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  const pageUrl = `http://127.0.0.1:${port}/frame.html?scenes=/scenes.js&transcript=/transcript.json`;

  const browser = await chromium.launch({
    headless: true,
    // Optional override when the pinned Playwright browser build is not installed
    // (e.g. PW_CHROMIUM_PATH=/opt/pw-browsers/chromium in cloud containers).
    executablePath: process.env.PW_CHROMIUM_PATH || undefined,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  });
  await page.goto(pageUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ready && window.EPISODE);

  // Scenes may expose EPISODE.preload (a Promise) so stills are decoded before capture.
  await page.evaluate(() => (window.EPISODE && window.EPISODE.preload) || null);
  return { page, browser, server };
}

export async function captureVideo({ episodeDir, outVideo, fps = 30, duration }) {
  const { page, browser, server } = await openEpisodePage(episodeDir);
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

  const t0 = Date.now();
  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    await page.evaluate((time) => window.renderFrame(time), t);
    const buf = await page.screenshot({ type: 'jpeg', quality: 88, animations: 'disabled' });
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
  await browser.close();
  server.close();
  console.log('Silent video →', outVideo);
  return outVideo;
}
