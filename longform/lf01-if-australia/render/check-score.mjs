#!/usr/bin/env node
/* Load the score in Node, report anchors (heard / fallback), B-roll windows, SFX/music cues, and
 * evaluate frame(t) every 0.1 s to catch exceptions. Writes out/score.json for mix + composite. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const R = path.dirname(new URL(import.meta.url).pathname);
const EP = path.resolve(R, '..');
const ctx = vm.createContext({ console, Math, JSON });
for (const f of ['map.js', 'icons.js', 'score.js']) vm.runInContext(fs.readFileSync(path.join(R, f), 'utf8'), ctx, { filename: f });
const T = JSON.parse(fs.readFileSync(path.join(R, 'timeline.json'), 'utf8'));
const GEO = JSON.parse(fs.readFileSync(path.join(R, 'geo', 'geo.json'), 'utf8'));
const S = ctx.buildScore(T, GEO);
let errs = 0;
for (let t = 0; t < S.duration; t += 0.1) {
  try { const f = S.frame(t); if (!f.views.length) throw new Error('no view'); for (const v of f.views) if (!isFinite(v.cam.x + v.cam.y + v.cam.z)) throw new Error('bad cam'); if (/NaN|undefined/.test(f.svg)) throw new Error('NaN/undefined in svg'); }
  catch (e) { if (errs++ < 12) console.log('ERR t=' + t.toFixed(1), e.message); }
}
const fmt = (t) => (t == null ? '   —   ' : `${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, '0')}`);
console.log(`\nframes checked, errors: ${errs}\n\nANCHORS`);
for (const a of S.anchors) console.log(`${a.id}  ${fmt(a.t)}  ${a.how.padEnd(30)} "${a.phrase}"`);
console.log('\nCAMERA KEYS INSIDE ZOOM-THROUGH WINDOWS');
for (const z of S.zt) for (const k of S.camKeys) if (k.zt !== z.id && k.movedFrom != null && k.movedFrom > z.a - 0.05 && k.movedFrom < z.b + 0.05) console.log(`${z.id} [${fmt(z.a)}–${fmt(z.b)}] key moved ${fmt(k.movedFrom)} → ${fmt(k.t)} (${k.lon},${k.lat},z${k.z})`);
console.log('\nB-ROLL');
for (const b of S.broll) console.log(`${b.id} ${fmt(b.t)} → ${fmt(b.t + b.dur)} (${b.dur}s) beat ${b.beat}`);
fs.mkdirSync(path.join(EP, 'out'), { recursive: true });
fs.writeFileSync(path.join(EP, 'out', 'score.json'), JSON.stringify({ duration: S.duration, broll: S.broll, sfx: S.sfx, music: S.music, anchors: S.anchors, chapters: T.chapters, midrolls: T.midrolls, endScreen: T.endScreen, segments: T.segments.map(({ words, ...s }) => s) }, null, 1));
process.exit(errs ? 1 : 0);
