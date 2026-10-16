// Render a set of stills from one bundle: node scripts/stills.mjs Hero out_dir scale f1 f2 ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const [, , comp, outDir, scale, ...frames] = process.argv;
const browserExecutable = process.env.REMOTION_BROWSER || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, '../assets')});
const composition = await selectComposition({serveUrl, id: comp, browserExecutable});
fs.mkdirSync(outDir, {recursive: true});
for (const f of frames) {
  const frame = Number(f);
  try {
    await renderStill({serveUrl, composition, frame, output: path.join(outDir, `${comp}_${String(frame).padStart(4, '0')}.png`), scale: Number(scale), browserExecutable, chromiumOptions: {gl: 'swangle'}});
  } catch (e) {
    console.error('frame', frame, e.message.split('\n').slice(0, 6).join('\n'));
  }
}
console.log('done');
