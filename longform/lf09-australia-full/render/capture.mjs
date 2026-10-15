#!/usr/bin/env node
// Usage:
//   node capture.mjs stills out_dir t1,t2,...           -> PNG stills at film times
//   node capture.mjs video  out.mp4 [--master] [--workers 4] [--from s] [--to s]
//   node capture.mjs collect out.json                   -> SFX cue list + counter windows
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
const R = path.dirname(new URL(import.meta.url).pathname);
const EP = path.dirname(R);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.ttf': 'font/ttf' };
function serve() {
  const map = (p) => {
    if (p === '/' || p === '/frame.html') return path.join(R, 'frame.html');
    if (p.startsWith('/clips/')) return path.join(R, 'cache', 'clips', p.slice(7));
    if (p.startsWith('/photos/')) return path.join(R, 'cache', 'photos', p.slice(8));
    if (p.startsWith('/stills/')) return path.join(R, 'cache', 'stills', p.slice(8));
    return path.join(R, p);
  };
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, 'http://x').pathname); const f = map(u);
    if (!f.startsWith(R) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'max-age=3600' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv)));
}
async function openPage(browser, port, master) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
  await page.goto(`http://127.0.0.1:${port}/frame.html${master ? '?master=1' : ''}`);
  await page.waitForFunction(() => window.RT && window.RT.ready, null, { timeout: 120000 });
  return page;
}
const args = process.argv.slice(2); const mode = args[0]; const out = args[1];
const flag = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const master = args.includes('--master'); const SPEED = 1.28;
const srv = await serve(); const port = srv.address().port;
const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox', '--font-render-hinting=none'] });
if (mode === 'stills') {
  fs.mkdirSync(out, { recursive: true });
  const page = await openPage(browser, port, false);
  for (const ts of args[2].split(',')) {
    const t = +ts; await page.evaluate((t) => RT.renderFrame(t), t);
    await page.screenshot({ path: path.join(out, `t${t.toFixed(2).padStart(7, '0')}.png`) });
  }
  console.log('warn', JSON.stringify(await page.evaluate(() => RT.warn.slice(0, 50))));
} else if (mode === 'collect') {
  const page = await openPage(browser, port, master);
  const res = await page.evaluate(() => RT.collect());
  res.duration = await page.evaluate(() => RT.TL.duration);
  fs.writeFileSync(out, JSON.stringify(res, null, 1)); console.log('cues', res.sfx.length, 'warn', res.warn.length, res.warn.slice(0, 40));
} else if (mode === 'video') {
  const tl = JSON.parse(fs.readFileSync(path.join(R, 'data', 'timeline.json')));
  const total = master ? Math.round(tl.duration / SPEED * 30) : Math.round(tl.duration * 30);
  const f0 = Math.round((+flag('--from', 0)) * 30), f1 = Math.min(total, flag('--to') ? Math.round(+flag('--to') * 30) : total);
  const workers = +flag('--workers', 4); const per = Math.ceil((f1 - f0) / workers);
  const tmp = out + '.parts'; fs.mkdirSync(tmp, { recursive: true });
  const t0 = Date.now();
  const jobs = [...Array(workers).keys()].map(async (w) => {
    const a = f0 + w * per, b = Math.min(f1, a + per); if (a >= b) return null;
    const part = path.join(tmp, `part${String(w).padStart(2, '0')}.mp4`);
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', 'pipe:0', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '30', part], { stdio: ['pipe', 'inherit', 'inherit'] });
    const page = await openPage(browser, port, master);
    for (let f = a; f < b; f++) {
      const tView = f / 30; const t = master ? tView * SPEED : tView;
      await page.evaluate(([t, tv]) => RT.renderFrame(t, tv), [t, tView]);
      const buf = await page.screenshot({ type: 'jpeg', quality: 94 });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if ((f - a) % 300 === 0) console.log(`w${w} ${f - a}/${b - a} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end(); await new Promise((r, j) => ff.on('exit', (c) => (c === 0 ? r() : j(new Error('ffmpeg ' + c)))));
    const warn = await page.evaluate(() => RT.warn.filter((x) => x.startsWith('img')).slice(0, 20));
    if (warn.length) console.log('IMGWARN', w, warn);
    await page.close(); return part;
  });
  const parts = (await Promise.all(jobs)).filter(Boolean);
  fs.writeFileSync(path.join(tmp, 'list.txt'), parts.map((p) => `file '${path.resolve(p)}'`).join('\n'));
  await new Promise((r, j) => spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'copy', out], { stdio: 'inherit' }).on('exit', (c) => (c === 0 ? r() : j(new Error('concat')))));
  console.log('done', out, ((Date.now() - t0) / 1000).toFixed(0) + 's', 'frames', f1 - f0);
}
await browser.close(); srv.close();
