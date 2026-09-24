// Generic renderer: serves the project over local HTTP, steps a
// render/*.html page's window.__renderFrame(t) at a fixed fps, captures
// PNG frames via Playwright, then encodes them with ffmpeg.
//
// Usage: node scripts/render.mjs <page.html> <output.mp4> [--fps N] [--quality low|full] [--end SECONDS]

import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { chromium } from "playwright";

const root = path.join(import.meta.dirname, "..");
const args = process.argv.slice(2);
const pageArg = args[0];
const outArg = args[1];
const flags = Object.fromEntries(
  args
    .slice(2)
    .map((a, i, arr) => (a.startsWith("--") ? [a.slice(2), arr[i + 1]] : null))
    .filter(Boolean),
);

if (!pageArg || !outArg) {
  console.error("Usage: node scripts/render.mjs <render/page.html> <out/video.mp4> [--fps N] [--end SECONDS]");
  process.exit(1);
}

const fps = Number(flags.fps || 15);
const framesDir = path.join(root, ".cache", "frames-" + path.basename(outArg, ".mp4"));
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

const CONTENT_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split("?")[0]);
      const filePath = path.join(root, urlPath);
      if (!filePath.startsWith(root)) {
        res.writeHead(403);
        res.end();
        return;
      }
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end();
          return;
        }
        const ext = path.extname(filePath);
        res.writeHead(200, { "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream" });
        res.end(data);
      });
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function main() {
  const server = await startServer();
  const port = server.address().port;
  const pageUrl = `http://127.0.0.1:${port}/${pageArg}`;

  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", headless: true });
  const page = await browser.newPage({ viewport: null });

  console.log(`Loading ${pageUrl} ...`);
  await page.goto(pageUrl, { waitUntil: "load" });
  await page.evaluate(() => window.__ready);

  const svgSize = await page.evaluate(() => {
    const svg = document.getElementById("stage");
    return { width: Number(svg.getAttribute("width")), height: Number(svg.getAttribute("height")) };
  });
  await page.setViewportSize({ width: svgSize.width, height: svgSize.height });

  const endTime = Number(flags.end || (await page.evaluate(() => window.__END_TIME)));
  const totalFrames = Math.round(endTime * fps);
  console.log(`Rendering ${totalFrames} frames @ ${fps}fps (${svgSize.width}x${svgSize.height}, end=${endTime}s)...`);

  const t0 = Date.now();
  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    await page.evaluate((t) => window.__renderFrame(t), t);
    const framePath = path.join(framesDir, `frame-${String(i).padStart(6, "0")}.png`);
    await page.screenshot({ path: framePath });
    if (i % 30 === 0) process.stdout.write(`\r  frame ${i}/${totalFrames}`);
  }
  process.stdout.write(`\r  frame ${totalFrames}/${totalFrames}\n`);
  console.log(`Captured in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  await browser.close();
  server.close();

  const outPath = path.join(root, outArg);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  console.log("Encoding with ffmpeg...");
  execSync(
    `ffmpeg -y -framerate ${fps} -i "${framesDir}/frame-%06d.png" -c:v libx264 -pix_fmt yuv420p -crf 23 -preset veryfast "${outPath}"`,
    { stdio: "inherit" },
  );
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
