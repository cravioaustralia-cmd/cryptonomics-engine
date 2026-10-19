// Render review stills at given seconds, reusing one browser. usage: node stills.mjs <serveUrl> <outDir> t1 t2 ...
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
const [serveUrl, outDir, ...times] = process.argv.slice(2);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const puppeteerInstance = await openBrowser("chrome", { browserExecutable });
const composition = await selectComposition({ serveUrl, id: "LF10", puppeteerInstance, browserExecutable });
for (const t of times) {
  const frame = Math.round(parseFloat(t) * 30);
  await renderStill({ composition, serveUrl, frame, output: `${outDir}/f${String(frame).padStart(6, "0")}.jpg`, imageFormat: "jpeg", jpegQuality: 80, puppeteerInstance, browserExecutable, scale: 0.5 });
  process.stdout.write(".");
}
await puppeteerInstance.close({ silent: true });
console.log("done");
