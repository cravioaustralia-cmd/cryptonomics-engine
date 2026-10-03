#!/usr/bin/env node
// Render the silent 16:9 map plate with the SHARED capture (size override 1920x1080), in parallel slices.
// Usage: PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium node render_map.mjs [workers]
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { captureVideo } from '../../../shorts/shared/render/capture.mjs';

const here = path.dirname(new URL(import.meta.url).pathname);
const episodeDir = path.resolve(here, '..');
const build = path.join(episodeDir, 'build');
fs.mkdirSync(build, { recursive: true });
const tl = JSON.parse(fs.readFileSync(path.join(here, 'timeline.json'), 'utf8'));
const fps = 30;
const total = Math.ceil(tl.duration * fps);
const workers = parseInt(process.argv[2] || '4', 10);
const per = Math.ceil(total / workers);
const parts = [];
await Promise.all(
  Array.from({ length: workers }, (_, w) => {
    const startFrame = w * per;
    const endFrame = Math.min(total, (w + 1) * per);
    const out = path.join(build, `map_part${w}.mp4`);
    parts.push(out);
    return captureVideo({
      episodeDir, outVideo: out, fps, duration: tl.duration,
      width: 1920, height: 1080, frameHtml: path.join(here, 'frame.html'), startFrame, endFrame,
    });
  })
);
fs.writeFileSync(path.join(build, 'map_parts.txt'), parts.map((p) => `file '${p}'`).join('\n') + '\n');
const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(build, 'map_parts.txt'), '-c', 'copy', path.join(build, 'map.mp4')], { stdio: 'inherit' });
if (r.status !== 0) throw new Error('concat failed');
console.log('map plate →', path.join(build, 'map.mp4'), total, 'frames');
