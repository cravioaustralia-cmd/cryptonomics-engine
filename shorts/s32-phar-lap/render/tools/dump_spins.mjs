#!/usr/bin/env node
/** Dump the exact camera of every globe-spin frame (from ../camera.js) -> ../cache/spin_cams.json for make_spin.py. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname);
const CAM = require(path.join(HERE, '..', 'camera.js'));
const frames = CAM.spinFrames().map((i) => {
  const c = CAM.camAt(i / CAM.FPS);
  return { i, c: c.c, M: CAM.camMatrix(c), z: c.z };
});
fs.mkdirSync(path.join(HERE, '..', 'cache'), { recursive: true });
fs.writeFileSync(path.join(HERE, '..', 'cache', 'spin_cams.json'), JSON.stringify(frames));
console.log(frames.length, 'spin frames');
