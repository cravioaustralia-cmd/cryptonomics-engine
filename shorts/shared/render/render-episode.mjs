#!/usr/bin/env node
/**
 * node render-episode.mjs <episodeDir> [--reuse-mix] [--workers N]
 *   --reuse-mix  keep the existing audio/final-mix.mp3 (held mix) instead of re-mixing
 *   --workers N  parallel Playwright pages for frame capture (default: min(4, cpus))
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { mixAudio } from './mix-audio.mjs';
import { captureVideo } from './capture.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const episodeDir = path.resolve(args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--workers') || '.');
const configPath = path.join(episodeDir, 'render', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const fps = config.fps || 30;
const duration = config.duration;
const slug = path.basename(episodeDir);
const outDir = path.join(episodeDir, 'out');
fs.mkdirSync(outDir, { recursive: true });

const silent = path.join(outDir, `${slug}-silent.mp4`);
const finalMp4 = path.join(outDir, `${slug}.mp4`);

// sfxDir in config may be an absolute path from another machine — fall back to the episode's sfx/.
let sfxDir = config.sfxDir;
if (!sfxDir || !fs.existsSync(sfxDir)) sfxDir = path.join(episodeDir, 'sfx');

let mixPath = path.join(episodeDir, 'audio', 'final-mix.mp3');
if (flag('--reuse-mix') && fs.existsSync(mixPath)) {
  console.log('== Reusing held mix ==', mixPath);
} else {
  console.log('== Mix audio ==');
  mixPath = await mixAudio({ episodeDir, sfxDir, sfxCues: config.sfxCues || [], duration });
}

console.log('== Capture frames ==');
const workers = opt('--workers') ? Number(opt('--workers')) : undefined;
await captureVideo({ episodeDir, outVideo: silent, fps, duration, workers });

console.log('== Mux ==');
await new Promise((resolve, reject) => {
  const p = spawn(
    'ffmpeg',
    [
      '-y', '-i', silent, '-i', mixPath,
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
      '-shortest', '-movflags', '+faststart',
      finalMp4,
    ],
    { stdio: 'inherit' }
  );
  p.on('exit', (c) => (c === 0 ? resolve() : reject(new Error('mux ' + c))));
});

console.log('DONE', finalMp4);
