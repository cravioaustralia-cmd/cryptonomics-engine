#!/usr/bin/env node
/**
 * Playwright: call renderFrame(t) each frame, pipe JPEGs into ffmpeg → silent MP4.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const renderDir = path.resolve(path.dirname(new URL(import.meta.url).pathname));
const fontsDir = path.resolve(renderDir, '..', 'fonts');

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

/** Tiny static server: engine + episode scenes/transcript, /img/* episode stills, /fonts/* shared fonts. */
export async function startEpisodeServer(episodeDir) {
  const { createServer } = await import('node:http');
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
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  return {
    server,
    pageUrl: `http://127.0.0.1:${port}/frame.html?scenes=/scenes.js&transcript=/transcript.json`,
  };
}

async function openPage(browser, pageUrl) {
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  });
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  await page.goto(pageUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ready && window.EPISODE);
  return page;
}

function launch() {
  // CHROMIUM_PATH lets a machine with a pre-installed Chromium skip `playwright install`.
  return chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });
}

/** Encode frames [from, to) of the episode into one MP4 segment. */
async function captureSegment({ browser, pageUrl, outVideo, fps, from, to, label }) {
  const ff = spawn(
    'ffmpeg',
    [
      '-y', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(fps), '-i', 'pipe:0',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '16',
      '-r', String(fps), '-movflags', '+faststart',
      outVideo,
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] }
  );
  const done = new Promise((resolve, reject) => {
    ff.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('ffmpeg video ' + code))));
  });
  const page = await openPage(browser, pageUrl);
  const t0 = Date.now();
  for (let i = from; i < to; i++) {
    const t = i / fps;
    await page.evaluate((time) => window.renderFrame(time), t);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92, animations: 'disabled' });
    const ok = ff.stdin.write(buf);
    if (!ok) await new Promise((r) => ff.stdin.once('drain', r));
    if ((i - from) % 150 === 0) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`${label} frame ${i}/${to} t=${t.toFixed(2)}s (${elapsed}s elapsed)`);
    }
  }
  ff.stdin.end();
  await done;
  await page.close();
}

export async function captureVideo({ episodeDir, outVideo, fps = 30, duration, workers }) {
  const { server, pageUrl } = await startEpisodeServer(episodeDir);
  const totalFrames = Math.ceil(duration * fps);
  fs.mkdirSync(path.dirname(outVideo), { recursive: true });
  const n = Math.max(1, Math.min(workers || Math.min(4, os.cpus().length), 8));
  const browser = await launch();

  if (n === 1) {
    await captureSegment({ browser, pageUrl, outVideo, fps, from: 0, to: totalFrames, label: 'w0' });
  } else {
    // Split into contiguous chunks, render in parallel pages, then concat losslessly.
    const per = Math.ceil(totalFrames / n);
    const segs = [];
    const jobs = [];
    for (let w = 0; w < n; w++) {
      const from = w * per;
      const to = Math.min(totalFrames, from + per);
      if (from >= to) break;
      const seg = outVideo.replace(/\.mp4$/, `.part${w}.mp4`);
      segs.push(seg);
      jobs.push(captureSegment({ browser, pageUrl, outVideo: seg, fps, from, to, label: `w${w}` }));
    }
    await Promise.all(jobs);
    const list = outVideo.replace(/\.mp4$/, '.parts.txt');
    fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
    await new Promise((resolve, reject) => {
      const p = spawn(
        'ffmpeg',
        ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', outVideo],
        { stdio: 'inherit' }
      );
      p.on('exit', (c) => (c === 0 ? resolve() : reject(new Error('concat ' + c))));
    });
    for (const s of segs) fs.unlinkSync(s);
    fs.unlinkSync(list);
  }

  await browser.close();
  server.close();
  console.log('Silent video →', outVideo);
  return outVideo;
}

/** Contact sheet: render PNG stills at given times (seconds) into outDir. */
export async function captureStills({ episodeDir, outDir, times }) {
  const { server, pageUrl } = await startEpisodeServer(episodeDir);
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await launch();
  const page = await openPage(browser, pageUrl);
  const files = [];
  for (const t of times) {
    await page.evaluate((time) => window.renderFrame(time), t);
    const f = path.join(outDir, `t${t.toFixed(2).padStart(6, '0')}.png`);
    await page.screenshot({ path: f, type: 'png' });
    files.push(f);
  }
  await browser.close();
  server.close();
  return files;
}
