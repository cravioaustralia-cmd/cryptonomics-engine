#!/usr/bin/env node
/**
 * Playwright: call renderFrame(t) each frame, pipe JPEGs into ffmpeg → silent MP4.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Optional: point at a preinstalled Chromium when the pinned Playwright build is absent.
const LAUNCH_EXTRA = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};

export async function captureVideo({
  episodeDir,
  outVideo,
  fps = 30,
  duration,
  transcriptPath, // optional override (default <episode>/transcript.json)
  times, // optional: array of seconds → write PNG stills instead of a video
  stillsDir,
  startFrame = 0,
  endFrame, // optional exclusive frame bound for partial renders
}) {
  const renderDir = path.resolve(path.dirname(new URL(import.meta.url).pathname));
  const frameHtml = path.join(renderDir, 'frame.html');
  const scenesUrl = pathToFileURL(path.join(episodeDir, 'render', 'scenes.js')).href;
  const transcriptUrl = pathToFileURL(path.join(episodeDir, 'transcript.json')).href;

  // Serve via file:// with query — scenes must be file URLs relative won't work cross-folder.
  // Use a tiny static server instead for clean paths.
  const { createServer } = await import('node:http');
  const roots = {
    '/engine.js': path.join(renderDir, 'engine.js'),
    '/frame.html': frameHtml,
    '/scenes.js': path.join(episodeDir, 'render', 'scenes.js'),
    '/transcript.json': transcriptPath || path.join(episodeDir, 'transcript.json'),
  };
  // map /img/* to episode images
  const imgRoot = path.join(episodeDir, 'images');

  const server = createServer((req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1');
    let file = roots[u.pathname];
    if (!file && u.pathname.startsWith('/img/')) {
      file = path.join(imgRoot, decodeURIComponent(u.pathname.slice(5)));
    }
    // /ep/* → any file inside the episode folder (fonts, derived assets)
    if (!file && u.pathname.startsWith('/ep/')) {
      const p = path.normalize(path.join(episodeDir, decodeURIComponent(u.pathname.slice(4))));
      if (p.startsWith(path.resolve(episodeDir) + path.sep)) file = p;
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
      '.woff2': 'font/woff2',
    };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });

  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  const pageUrl = `http://127.0.0.1:${port}/frame.html?scenes=/scenes.js&transcript=/transcript.json`;

  const totalFrames = Math.ceil(duration * fps);

  if (times && times.length) {
    fs.mkdirSync(stillsDir, { recursive: true });
    const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox'], ...LAUNCH_EXTRA });
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    await page.goto(pageUrl, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__ready && window.EPISODE);
    const out = [];
    for (const t of times) {
      await page.evaluate((time) => window.renderFrame(time), t);
      const f = path.join(stillsDir, `t${t.toFixed(2).padStart(6, '0')}.png`);
      await page.screenshot({ path: f, type: 'png', animations: 'disabled' });
      out.push(f);
    }
    await browser.close();
    server.close();
    return out;
  }

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
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
    ...LAUNCH_EXTRA,
  });
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  });
  await page.goto(pageUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ready && window.EPISODE);

  const t0 = Date.now();
  const lastFrame = Math.min(totalFrames, endFrame ?? totalFrames);
  for (let i = startFrame; i < lastFrame; i++) {
    const t = i / fps;
    await page.evaluate((time) => window.renderFrame(time), t);
    const buf = await page.screenshot({ type: 'jpeg', quality: 88, animations: 'disabled' });
    const ok = ff.stdin.write(buf);
    if (!ok) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 90 === 0) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`frame ${i}/${lastFrame} t=${t.toFixed(2)}s (${elapsed}s elapsed)`);
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
