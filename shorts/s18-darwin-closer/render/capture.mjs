#!/usr/bin/env node
/**
 * s18 capture — Playwright seeks renderFrame(t) across N parallel workers,
 * writes JPEG frames, then ffmpeg encodes. (SVG + renderFrame + Playwright + ffmpeg.)
 *
 *   node capture.mjs frames [workers]        → out/frames/*.jpg
 *   node capture.mjs stills t1,t2,...        → out/stills/t_XX.XX.png
 */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const EP = path.resolve(HERE, '..');
const ROOT = path.resolve(EP, '..'); // shorts/
const SLUG = path.basename(EP);
const OUT = path.join(EP, 'out');
const FPS = 30;
// reuse the shared renderer's Playwright install (shorts/shared/render)
const { chromium } = createRequire(path.join(ROOT, 'shared', 'render', 'package.json'))('playwright');
const DUR = 45.336;

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };
function serve() {
  const server = createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const file = path.join(ROOT, decodeURIComponent(u.pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(server)));
}

async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
  page.on('console', (m) => m.type() === 'error' && console.error('CONSOLE', m.text()));
  await page.goto(`http://127.0.0.1:${port}/${SLUG}/render/frame.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  return page;
}

async function shoot(page, t, file, type) {
  await page.evaluate((time) => {
    window.renderFrame(time);
    return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, t);
  const opts = type === 'png' ? { type: 'png' } : { type: 'jpeg', quality: 94 };
  fs.writeFileSync(file, await page.screenshot(opts));
}

const mode = process.argv[2] || 'frames';
const server = await serve();
const { port } = server.address();
const EXE = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ headless: true, executablePath: EXE, args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb'] });

if (mode === 'stills') {
  const dir = path.join(OUT, 'stills');
  fs.mkdirSync(dir, { recursive: true });
  const page = await openPage(browser, port);
  for (const t of process.argv[3].split(',').map(Number)) {
    await shoot(page, t, path.join(dir, `t_${t.toFixed(2).padStart(5, '0')}.png`), 'png');
  }
  console.log('stills →', dir);
} else {
  const dir = path.join(OUT, 'frames');
  fs.mkdirSync(dir, { recursive: true });
  const total = Math.ceil(DUR * FPS);
  const workers = Number(process.argv[3] || 3);
  const t0 = Date.now();
  let done = 0;
  await Promise.all(
    Array.from({ length: workers }, async (_, w) => {
      const page = await openPage(browser, port);
      for (let i = w; i < total; i += workers) {
        const f = path.join(dir, `f_${String(i).padStart(5, '0')}.jpg`);
        if (fs.existsSync(f) && process.env.RESUME) continue;
        await shoot(page, i / FPS, f, 'jpeg');
        if (++done % 60 === 0) console.log(`${done}/${total} frames (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
      }
    })
  );
  console.log('frames →', dir, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
server.close();
