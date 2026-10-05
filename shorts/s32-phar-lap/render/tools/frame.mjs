#!/usr/bin/env node
/** Save full-resolution frames through the exact capture page: node frame.mjs outdir t1 t2 ... */
import fs from 'node:fs';
import path from 'node:path';
import { openEpisodePage } from '../../../shared/render/capture.mjs';
const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const dir = path.resolve(process.argv[2]);
fs.mkdirSync(dir, { recursive: true });
const { page, close } = await openEpisodePage(EP);
page.on('pageerror', (e) => console.log('ERR', e.message));
for (const t of process.argv.slice(3).map(Number)) {
  await page.evaluate((x) => window.renderFrame(x), t);
  await page.screenshot({ path: path.join(dir, `f${t.toFixed(2)}.jpg`), type: 'jpeg', quality: 90 });
}
await close();
