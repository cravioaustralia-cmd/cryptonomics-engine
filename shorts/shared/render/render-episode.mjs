#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { mixAudio } from './mix-audio.mjs';
import { captureVideo } from './capture.mjs';

const episodeDir = path.resolve(process.argv[2] || '.');
const configPath = path.join(episodeDir, 'render', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const fps = config.fps || 30;
const duration = config.duration;
const slug = path.basename(episodeDir);
const outDir = path.join(episodeDir, 'out');
fs.mkdirSync(outDir, { recursive: true });

const silent = path.join(outDir, `${slug}-silent.mp4`);
const finalMp4 = path.join(outDir, `${slug}.mp4`);

console.log('== Mix audio ==');
const mixPath = await mixAudio({
  episodeDir,
  sfxDir: config.sfxDir,
  sfxCues: config.sfxCues || [],
  duration,
  mix: config.mix,
});

console.log('== Capture frames ==');
await captureVideo({ episodeDir, outVideo: silent, fps, duration });

console.log('== Mux ==');
await new Promise((resolve, reject) => {
  const p = spawn(
    'ffmpeg',
    [
      '-y',
      '-i',
      silent,
      '-i',
      mixPath,
      '-map',
      '0:v',
      '-map',
      '1:a',
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-t',
      String(duration),
      '-movflags',
      '+faststart',
      finalMp4,
    ],
    { stdio: 'inherit' }
  );
  p.on('exit', (c) => (c === 0 ? resolve() : reject(new Error('mux ' + c))));
});

console.log('DONE', finalMp4);
