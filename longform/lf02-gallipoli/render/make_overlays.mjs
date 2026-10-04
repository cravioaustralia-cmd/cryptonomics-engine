#!/usr/bin/env node
// Transparent PNG overlays that must sit ABOVE the B-roll (so ffmpeg composites them last):
//   assets/badge.png              "IF AUSTRALIA" series badge, top-left, the whole film incl. B-roll, photos, end screen
//   assets/label_dramatised.png   "Dramatised reconstruction", on B01 only
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(new URL(import.meta.url).pathname);
const font = (f) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(here, 'fonts', f)).toString('base64');
const css = `
@font-face{font-family:Playfair;font-weight:900;src:url(${font('playfair-display-latin-900-normal.woff2')})}
@font-face{font-family:Elite;src:url(${font('special-elite-latin-400-normal.woff2')})}
html,body{margin:0;background:transparent}`;
const badge = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
  <defs><filter id="d" x="-20%" y="-40%" width="140%" height="180%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#1a1008" flood-opacity="0.45"/></filter></defs>
  <g transform="translate(46 38)" opacity="0.94">
    <rect x="0" y="0" width="292" height="60" fill="#efe4c8" stroke="#2e2216" stroke-width="2" filter="url(#d)"/>
    <rect x="5" y="5" width="282" height="50" fill="none" stroke="#2e2216" stroke-width="0.9"/>
    <rect x="5" y="5" width="9" height="50" fill="#b3261e"/>
    <text x="153" y="41" text-anchor="middle" font-family="Playfair" font-weight="900" font-size="29" letter-spacing="4" fill="#2e2216">IF AUSTRALIA</text>
  </g></svg>`;
const label = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
  <g transform="translate(60 1000)">
    <rect x="0" y="-30" width="352" height="44" rx="3" fill="rgba(20,14,8,0.62)"/>
    <text x="16" y="0" font-family="Elite" font-size="25" fill="#f2e8cf">Dramatised reconstruction</text>
  </g></svg>`;
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
for (const [name, svg] of [['badge.png', badge], ['label_dramatised.png', label]]) {
  await page.setContent(`<html><head><style>${css}</style></head><body>${svg}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(here, 'assets', name), omitBackground: true });
  console.log('wrote', name);
}
await browser.close();
