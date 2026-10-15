#!/usr/bin/env node
/**
 * s33 Hutt River render driver (SVG + renderFrame + Playwright + ffmpeg, no Remotion).
 *
 *   node shorts/s33-hutt-river/render/render.mjs sheet   # contact sheet → out/contact_sheet.jpg
 *   node shorts/s33-hutt-river/render/render.mjs full    # mix + capture + mux → final/s33-hutt-river.mp4
 *
 * Prereqs: python3 render/build_data.py (writes ../transcript.json + map_data.js),
 *          npm install in shorts/shared/render (playwright).
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EP = path.dirname(HERE);
const SHARED = path.resolve(EP, '..', 'shared');
const { captureVideo } = await import(path.join(SHARED, 'render', 'capture.mjs'));
const config = JSON.parse(fs.readFileSync(path.join(HERE, 'config.json'), 'utf8'));
const OUT = path.join(EP, 'out');
const IMG_CACHE = path.join(OUT, 'img');
const mode = process.argv[2] || 'sheet';

const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });

// ---------- downscaled image cache (speeds up per-frame decode) ----------
function buildImageCache() {
  fs.mkdirSync(IMG_CACHE, { recursive: true });
  const src = path.join(EP, 'images');
  for (const f of fs.readdirSync(src)) {
    const from = path.join(src, f);
    const to = path.join(IMG_CACHE, f);
    if (f.endsWith('.svg')) {
      fs.copyFileSync(from, to);
      continue;
    }
    if (!/\.jpe?g$/i.test(f)) continue;
    if (!fs.existsSync(to)) ff(['-i', from, '-vf', "scale='if(gt(min(iw,ih),2200),iw*2200/min(iw,ih),iw)':-2", '-q:v', '2', to]);
  }
  const blur = path.join(IMG_CACHE, 'passport_control_at_hutt_river_province_blur.jpg');
  if (!fs.existsSync(blur))
    ff(['-i', path.join(src, 'passport_control_at_hutt_river_province.jpg'), '-vf', 'scale=1400:-2,gblur=sigma=14', '-q:v', '3', blur]);
}

// ---------- audio mix ----------
function mix() {
  const sfxPath = (f) => [path.join(EP, 'sfx', f), path.join(SHARED, 'sfx', f)].find((p) => fs.existsSync(p));
  const dur = config.duration;
  const inputs = ['-i', path.join(EP, 'audio', 'vo.mp3'), '-i', path.join(EP, config.music.file)];
  const fl = [];
  fl.push(`[0:a]aresample=48000,highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,apad=whole_dur=${dur}[vo]`);
  fl.push(`[vo]asplit=2[vo1][vokey]`);
  const m = config.music;
  fl.push(
    `[1:a]aresample=48000,atrim=start=${m.offset}:duration=${dur},asetpts=PTS-STARTPTS,volume=${m.gain},` +
      `afade=t=in:st=0:d=0.12,afade=t=out:st=${(dur - 0.6).toFixed(3)}:d=0.6[mus]`
  );
  fl.push(`[mus][vokey]sidechaincompress=threshold=0.04:ratio=5:attack=20:release=350:makeup=1[musd]`);
  const mixIn = ['[vo1]', '[musd]'];
  config.sfxCues.forEach((c, i) => {
    const p = sfxPath(c.file);
    if (!p) throw new Error('missing sfx ' + c.file);
    inputs.push('-i', p);
    const idx = i + 2;
    const ms = Math.round(c.at * 1000);
    const len = c.len || 3;
    let chain = `[${idx}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:${len},afade=t=out:st=${Math.max(0, len - 0.35)}:d=0.35`;
    if (c.reverse) chain += ',areverse';
    chain += `,volume=${c.vol},adelay=${ms}|${ms}[s${i}]`;
    fl.push(chain);
    mixIn.push(`[s${i}]`);
  });
  fl.push(`${mixIn.join('')}amix=inputs=${mixIn.length}:duration=first:dropout_transition=0:normalize=0,atrim=0:${dur}[pre]`);
  const pre = path.join(OUT, 'premix.wav');
  ff([...inputs, '-filter_complex', fl.join(';'), '-map', '[pre]', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s24le', pre]);

  // two-pass loudnorm → -14 LUFS, TP headroom for AAC
  const out = path.join(OUT, 'final-mix.wav');
  let ln = 'loudnorm=I=-14:TP=-2.6:LRA=11';
  const err = ffStderr(['-hide_banner', '-i', pre, '-af', ln + ':print_format=json', '-f', 'null', '-']);
  const j = JSON.parse(err.slice(err.lastIndexOf('{')));
  ln += `:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  ff(['-i', pre, '-af', `${ln},alimiter=limit=0.70:attack=2:release=60:level=false,aresample=48000`, '-ar', '48000', '-c:a', 'pcm_s24le', out]);
  return out;
}

function ffStderr(args) {
  return spawnSync('ffmpeg', args, { encoding: 'utf8' }).stderr;
}

function measure(file) {
  const e = ffStderr(['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const sum = e.slice(e.lastIndexOf('Summary'));
  const I = /I:\s+(-?[\d.]+) LUFS/.exec(sum);
  const TP = /Peak:\s+(-?[\d.]+) dBFS/.exec(sum);
  return { I: I && +I[1], TP: TP && +TP[1] };
}

// ---------- main ----------
fs.mkdirSync(OUT, { recursive: true });
buildImageCache();

if (mode === 'sheet') {
  const times = process.argv[3] ? process.argv[3].split(',').map(Number) : config.sheetTimes;
  const dir = path.join(OUT, 'sheet');
  fs.rmSync(dir, { recursive: true, force: true });
  const files = await captureVideo({ episodeDir: EP, outVideo: dir, duration: config.duration, imgDir: IMG_CACHE, stills: times });
  const cols = Math.min(6, files.length);
  const listArgs = [];
  files.forEach((f) => listArgs.push('-i', f));
  const n = files.length;
  const rows = Math.ceil(n / cols);
  const lab = files
    .map((f, i) => `[${i}:v]scale=360:640,drawtext=text='${times[i].toFixed(2)}s':x=10:y=10:fontsize=28:fontcolor=yellow:box=1:boxcolor=black@0.6[v${i}]`)
    .join(';');
  const pads = [];
  for (let i = n; i < rows * cols; i++) pads.push(i);
  const stackIn = files.map((_, i) => `[v${i}]`).join('');
  const layout = files.map((_, i) => `${(i % cols) * 360}_${Math.floor(i / cols) * 640}`).join('|');
  ff([...listArgs, '-filter_complex', `${lab};${stackIn}xstack=inputs=${n}:layout=${layout}:fill=black[o]`, '-map', '[o]', '-frames:v', '1', '-q:v', '3', path.join(OUT, 'contact_sheet.jpg')]);
  console.log('contact sheet →', path.join(OUT, 'contact_sheet.jpg'));
} else if (mode === 'mix') {
  const f = mix();
  console.log('mix', f, measure(f));
} else if (mode === 'full') {
  const mixFile = mix();
  console.log('mix', measure(mixFile));
  const silent = path.join(OUT, 's33-hutt-river-silent.mp4');
  if (!process.argv.includes('--reuse-video'))
    await captureVideo({ episodeDir: EP, outVideo: silent, fps: config.fps, duration: config.duration, imgDir: IMG_CACHE });
  const finalDir = path.join(EP, 'final');
  fs.mkdirSync(finalDir, { recursive: true });
  const final = path.join(finalDir, 's33-hutt-river.mp4');
  ff(['-i', silent, '-i', mixFile, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-t', String(config.duration), '-movflags', '+faststart', final]);
  // verify loudness on the decoded AAC
  const m = measure(final);
  console.log('FINAL', final, m);
  if (m.TP > -1.5) console.warn('WARNING: true peak above -1.5 dBTP');
}
