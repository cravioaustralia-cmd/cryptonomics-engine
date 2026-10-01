import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCENE_HTML = path.join(__dirname, "scene.html");
const CHROMIUM_PATH = "/opt/pw-browsers/chromium";

const FPS = 30;
const DURATION = 30;

const mode = process.argv[2]; // "stills" | "frames"
const outDir = process.argv[3];

async function main() {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto("file://" + SCENE_HTML);
  await page.waitForFunction(() => window.sceneReady === true, null, { timeout: 15000 });

  if (mode === "stills") {
    const times = process.argv[4].split(",").map(Number);
    fs.mkdirSync(outDir, { recursive: true });
    for (const t of times) {
      await page.evaluate((tt) => window.renderFrame(tt), t);
      const file = path.join(outDir, `still_t${t}.png`);
      await page.screenshot({ path: file });
      console.log("saved", file);
    }
  } else if (mode === "frames") {
    fs.mkdirSync(outDir, { recursive: true });
    const totalFrames = Math.round(DURATION * FPS);
    const startFrame = process.argv[4] ? parseInt(process.argv[4], 10) : 0;
    const endFrame = process.argv[5] ? parseInt(process.argv[5], 10) : totalFrames - 1;
    console.log(`Rendering frames ${startFrame}..${endFrame} of ${totalFrames}`);
    const t0 = Date.now();
    for (let i = startFrame; i <= endFrame; i++) {
      const t = i / FPS;
      await page.evaluate((tt) => window.renderFrame(tt), t);
      const file = path.join(outDir, `frame_${String(i).padStart(5, "0")}.png`);
      await page.screenshot({ path: file });
      if (i % 30 === 0) {
        const elapsed = (Date.now() - t0) / 1000;
        console.log(`frame ${i}/${endFrame} (${elapsed.toFixed(1)}s elapsed)`);
      }
    }
  } else {
    console.error("usage: node render.mjs stills <outDir> <t1,t2,...>");
    console.error("       node render.mjs frames <outDir> [startFrame endFrame]");
    process.exit(1);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
