#!/usr/bin/env node
/**
 * Playwright: call renderFrame(t) each frame, pipe JPEGs into ffmpeg → silent MP4.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Optional overrides (defaults keep every Short vertical 1080x1920, unchanged):
//   width/height  viewport (long-form 16:9 passes 1920x1080)
//   frameHtml     episode's own page instead of the shared 1080x1920 frame.html
//   startFrame/endFrame  render a slice (parallel workers); /ep/* serves <episode>/render/*
export async function captureVideo({
  episodeDir, outVideo, fps = 30, duration,
  width = 1080, height = 1920, frameHtml: frameOverride, startFrame = 0, endFrame,
}) {
  const renderDir = path.resolve(path.dirname(new URL(import.meta.url).pathname));
  const frameHtml = frameOverride || path.join(renderDir, 'frame.html');
  const scenesUrl = pathToFileURL(path.join(episodeDir, 'render', 'scenes.js')).href;
  const transcriptUrl = pathToFileURL(path.join(episodeDir, 'transcript.json')).href;

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
    if (!file && u.pathname.startsWith('/ep/')) {
      const base = path.join(episodeDir, 'render');
      const f = path.normalize(path.join(base, decodeURIComponent(u.pathname.slice(4))));
      if (f.startsWith(base + path.sep)) file = f;
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
      '.svg': 'image/svg+xml',
      '.woff2': 'font/woff2',
    };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });

  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  const pageUrl = `http://127.0.0.1:${port}/frame.html?scenes=/scenes.js&transcript=/transcript.json`;

  const totalFrames = endFrame != null ? endFrame : Math.ceil(duration * fps);
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

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  await page.goto(pageUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ready && window.EPISODE);
  await page.evaluate(async () => {
    if (window.EPISODE_READY) await window.EPISODE_READY;
  });

  const t0 = Date.now();
  for (let i = startFrame; i < totalFrames; i++) {
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
