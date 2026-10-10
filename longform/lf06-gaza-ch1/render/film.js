/* 14,000 KILOMETRES — Chapter 1: The Vote Australia Cast First
 * Frame renderer: canvas 2D + d3-geo. renderFrame(t) is called by capture.mjs for every
 * frame (30 fps). All timing comes from timeline.json (real VO word times).
 * Design tokens, devices and moves follow script/PRODUCTION_SCRIPT.txt.
 */
'use strict';
const W = 1920, H = 1080, FPS = 30;
const COL = {
  navy: '#0E1A2B', paper: '#F2EEE6', amber: '#E8A33D', grey: '#8A8A8A',
  land: '#22324A', sea: '#0A1422', sand: '#D6BE96', slate: '#8C96A5', jer: '#EFEDE6', ink: '#1B1B1B',
  desk: '#0B1421',
};
const SS = '"Source Serif 4"', IN = 'Inter', PM = '"IBM Plex Mono"';

// ---------------------------------------------------------------- utilities
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ramp = (t, a, b) => clamp((t - a) / (b - a));
const eo = (t) => 1 - Math.pow(1 - clamp(t), 3);                  // ease-out cubic
const eio = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const eos = (t) => 1 - Math.pow(1 - clamp(t), 2);
const eob = (t) => { t = clamp(t); const c1 = 1.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const fadeIO = (t, a, b, fi = 0.3, fo = 0.3) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b));

let TL, C, GEO, VIDN;
const IMG = {}, MASKED = {};
const cv = document.getElementById('c');
const main = cv.getContext('2d');
const layer = document.createElement('canvas'); layer.width = W; layer.height = H;
const lctx = layer.getContext('2d');
let g = main; // current drawing context
let FRAME = 0;

function font(px, fam = IN, weight = 400, style = 'normal') { g.font = `${style} ${weight} ${px}px ${fam}`; }
function txt(s, x, y, { px = 28, fam = IN, w = 400, col = COL.paper, align = 'left', base = 'alphabetic', ls = 0, alpha = 1, style = 'normal', shadow = 0 } = {}) {
  g.save(); font(px, fam, w, style); g.fillStyle = col; g.textAlign = align; g.textBaseline = base;
  g.letterSpacing = ls + 'px'; g.globalAlpha *= alpha;
  if (shadow) { g.shadowColor = 'rgba(0,0,0,0.65)'; g.shadowBlur = shadow; g.shadowOffsetY = 2; }
  g.fillText(s, x, y); g.restore();
}
function measure(s, px, fam = IN, w = 400, ls = 0) { g.save(); font(px, fam, w); g.letterSpacing = ls + 'px'; const m = g.measureText(s).width; g.restore(); return m; }
function wrap(s, px, fam, w, maxW) {
  const words = s.split(' '); const lines = []; let cur = '';
  for (const wd of words) { const tryS = cur ? cur + ' ' + wd : wd; if (measure(tryS, px, fam, w) > maxW && cur) { lines.push(cur); cur = wd; } else cur = tryS; }
  if (cur) lines.push(cur); return lines;
}
function rrect(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

// ---------------------------------------------------------------- grades
const GRADE = {
  arch: 'grayscale(1) sepia(0.52) contrast(1.12) brightness(0.96)',
  archLight: 'sepia(0.35) contrast(1.06) brightness(0.98)',
  doc: 'sepia(0.22) contrast(1.06) brightness(0.97)',
  modern: 'saturate(0.74) contrast(1.04) brightness(0.96) hue-rotate(-4deg)',
  ai: 'saturate(0.85) sepia(0.15) contrast(1.05)',
  none: 'none',
};
function coolWash(x, y, w, h, a = 0.10) { g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = `rgba(40,80,140,${a * 2.2})`; g.fillRect(x, y, w, h); g.restore(); }

// draw `img` covering rect (dx,dy,dw,dh) with zoom about focus (fx,fy) in [0,1]
function cover(img, dx, dy, dw, dh, zoom = 1, fx = 0.5, fy = 0.5, filter = 'none', offX = 0, offY = 0) {
  if (!img) return;
  const iw = img.width, ih = img.height, ia = iw / ih, ra = dw / dh;
  let sw, sh; if (ia > ra) { sh = ih; sw = sh * ra; } else { sw = iw; sh = sw / ra; }
  sw /= zoom; sh /= zoom;
  const sx = clamp(fx * iw - sw / 2 + offX * sw, 0, iw - sw), sy = clamp(fy * ih - sh / 2 + offY * sh, 0, ih - sh);
  g.save(); g.filter = filter; g.imageSmoothingQuality = 'high';
  g.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh); g.restore();
}

// ---------------------------------------------------------------- textures (grain, desk, board)
const GRAIN = [];
function makeTextures() {
  for (let k = 0; k < 6; k++) {
    const c = document.createElement('canvas'); c.width = 640; c.height = 360; const x = c.getContext('2d');
    const id = x.createImageData(640, 360); const r = rng(1000 + k);
    for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 120; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    x.putImageData(id, 0, 0); GRAIN.push(c);
  }
  const mk = (base, seed, speck) => {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    const gr = x.createRadialGradient(W * 0.5, H * 0.45, 100, W * 0.5, H * 0.5, W * 0.75);
    gr.addColorStop(0, base[0]); gr.addColorStop(1, base[1]); x.fillStyle = gr; x.fillRect(0, 0, W, H);
    const r = rng(seed);
    for (let i = 0; i < speck; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.035})`; x.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    for (let i = 0; i < 260; i++) { x.strokeStyle = `rgba(255,255,255,${r() * 0.018})`; x.lineWidth = 1; x.beginPath(); const yy = r() * H; x.moveTo(0, yy); x.bezierCurveTo(W * 0.3, yy + r() * 30 - 15, W * 0.6, yy + r() * 30 - 15, W, yy + r() * 30 - 15); x.stroke(); }
    return c;
  };
  IMG.desk = mk(['#17263B', '#070D16'], 7, 9000);
  IMG.board = mk(['#142133', '#060B13'], 11, 16000);
}
function grain(amount = 0.07) {
  const k = FRAME % GRAIN.length; const r = rng(FRAME * 7 + 3);
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = amount;
  g.translate(r() * -40, r() * -40); g.drawImage(GRAIN[k], 0, 0, W + 80, H + 80); g.restore();
}
function vignette(a = 0.55) {
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.66);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
function flicker(amount = 1) { // projector flicker + dust + scratch (deterministic per frame)
  const r = rng(FRAME * 13 + 1);
  g.save(); g.fillStyle = `rgba(0,0,0,${(0.03 + r() * 0.07) * amount})`; g.fillRect(0, 0, W, H);
  if (r() < 0.35 * amount) { g.fillStyle = `rgba(255,240,215,${0.03 * amount})`; g.fillRect(0, 0, W, H); }
  g.globalAlpha = 0.35 * amount;
  for (let i = 0; i < 5; i++) { g.fillStyle = r() < 0.5 ? 'rgba(20,15,10,0.8)' : 'rgba(255,250,240,0.7)'; g.beginPath(); g.arc(r() * W, r() * H, 0.8 + r() * 2.2, 0, 7); g.fill(); }
  if (r() < 0.4) { g.strokeStyle = 'rgba(255,250,235,0.25)'; g.lineWidth = 1.2; const x = r() * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + r() * 6 - 3, H); g.stroke(); }
  g.restore();
}
function bottomShade(a = 0.5) { const gr = g.createLinearGradient(0, H * 0.62, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, H * 0.6, W, H * 0.4); }

// ---------------------------------------------------------------- media
function loadImg(key, url) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => { IMG[key] = i; res(i); }; i.onerror = () => rej(new Error(url)); i.src = url; }); }
const VCACHE = new Map(); let NEED = [];
function vid(id, lt) {
  const n = VIDN[id]; const idx = clamp(Math.floor(lt * FPS + 1e-6), 0, n - 1) + 1;
  const key = id + '/' + String(idx).padStart(4, '0');
  if (VCACHE.has(key)) return VCACHE.get(key);
  NEED.push(key); return null;
}
async function loadNeeded() {
  await Promise.all(NEED.map((k) => new Promise((res) => { const i = new Image(); i.onload = () => { VCACHE.set(k, i); res(); }; i.onerror = res; i.src = 'build/vid/' + k + '.jpg'; })));
  NEED = [];
  if (VCACHE.size > 40) { const ks = [...VCACHE.keys()]; for (let i = 0; i < ks.length - 30; i++) VCACHE.delete(ks[i]); }
}
// foreground mask (feathered) for 2.5D parallax
function makeMasked(key, drawMask, feather) {
  const img = IMG[key]; const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const x = c.getContext('2d'); x.filter = `blur(${feather}px)`; x.fillStyle = '#fff'; drawMask(x, img.width, img.height); x.filter = 'none';
  x.globalCompositeOperation = 'source-in'; x.drawImage(img, 0, 0); MASKED[key] = c;
}

// ---------------------------------------------------------------- devices
function caption(text, credit, a, opts = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha = a;
  const y = opts.y || 1012, x = opts.x || 72;
  if (text) {
    g.fillStyle = COL.amber; g.fillRect(x, y - 24, 4, 30);
    txt(text, x + 16, y, { px: 27, w: 600, col: COL.paper, shadow: 10 });
  }
  if (credit) txt(credit, opts.cx || W - 64, opts.cy || 1036, { px: 17, w: 400, col: 'rgba(242,238,230,0.78)', align: 'right', shadow: 8 });
  g.restore();
}
function aiLabel(a, y = 958) {
  if (a <= 0) return; g.save(); g.globalAlpha = a;
  const s = 'Dramatised reconstruction'; const w = measure(s, 19, IN, 500, 1) + 28;
  rrect(72, y - 25, w, 34, 4); g.fillStyle = 'rgba(14,26,43,0.62)'; g.fill(); g.strokeStyle = 'rgba(242,238,230,0.55)'; g.lineWidth = 1; g.stroke();
  txt(s, 86, y - 2, { px: 19, w: 500, col: COL.paper, ls: 1 }); g.restore();
}
// white-bordered print on the desk with DROP animation
function print(img, o, t) {
  const p = eo(ramp(t, o.t0, o.t0 + 0.34));
  if (t < o.t0) return;
  const w = o.w, h = o.h || w / (img.width / img.height);
  const sc = lerp(1.32, 1, p), rot = (o.rot + (1 - p) * (o.spin != null ? o.spin : 7)) * Math.PI / 180;
  g.save(); g.globalAlpha *= clamp(p * 2.5) * (o.alpha != null ? o.alpha : 1);
  g.translate(o.cx + (1 - p) * (o.dx || 0), o.cy + (1 - p) * (o.dy || -40)); g.rotate(rot); g.scale(sc, sc);
  const b = o.border != null ? o.border : 16;
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = lerp(70, 30, p); g.shadowOffsetY = lerp(48, 16, p);
  g.fillStyle = '#EFEBE2'; g.fillRect(-w / 2 - b, -h / 2 - b, w + 2 * b, h + 2 * b + (o.chin || 0));
  g.shadowColor = 'transparent';
  g.save(); g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.clip();
  const z = o.zoom ? o.zoom(t) : 1;
  cover(img, -w / 2, -h / 2, w, h, z, o.fx || 0.5, o.fy || 0.5, o.filter || GRADE.arch);
  if (o.par && MASKED[o.par]) { // 2.5D: foreground layer pushes slightly faster
    const z2 = z * (1 + 0.045 * (o.parP ? o.parP(t) : 0));
    cover(MASKED[o.par], -w / 2, -h / 2, w, h, z2, o.fx || 0.5, o.fy || 0.5, o.filter || GRADE.arch);
  }
  if (o.after) o.after(w, h, t);
  if (o.dim) { g.fillStyle = `rgba(0,0,0,${o.dim})`; g.fillRect(-w / 2, -h / 2, w, h); }
  g.restore();
  g.restore();
}
function desk() { g.drawImage(IMG.desk, 0, 0); }

// split-flap date board (lower-left, IBM Plex Mono)
const FLAPCH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function flapBoard(t, prev, next, tFlip, a, x = 72, y = 846) {
  if (a <= 0) return;
  g.save(); g.globalAlpha = a;
  const cw = 50, ch = 72, gap = 6; const n = Math.max(prev.length, next.length);
  const bw = n * (cw + gap) - gap + 28;
  rrect(x - 14, y - 14, bw, ch + 28, 8); g.fillStyle = 'rgba(6,11,19,0.82)'; g.fill(); g.strokeStyle = 'rgba(232,163,61,0.35)'; g.lineWidth = 1.5; g.stroke();
  for (let i = 0; i < n; i++) {
    const cx = x + i * (cw + gap); const target = next[i] || ' '; const before = prev[i] || ' ';
    const st = tFlip + i * 0.05; const dur = 0.22 + (i % 3) * 0.04;
    let ch_ = before; let fold = 0;
    if (t >= st && t < st + dur) { const r = rng(Math.floor(t * 40) + i * 31); ch_ = target === ' ' ? ' ' : FLAPCH[Math.floor(r() * FLAPCH.length)]; fold = ((t - st) * 40) % 1; }
    else if (t >= st + dur) ch_ = target;
    if (target === ' ' && before === ' ') { continue; }
    g.fillStyle = '#18243A'; rrect(cx, y, cw, ch, 5); g.fill();
    g.fillStyle = '#1E2C44'; g.fillRect(cx, y, cw, ch / 2);
    txt(ch_, cx + cw / 2, y + ch / 2 + 2, { px: 46, fam: PM, w: 600, col: COL.paper, align: 'center', base: 'middle' });
    if (fold > 0) { g.fillStyle = `rgba(10,16,26,${0.6 * (1 - fold)})`; g.fillRect(cx, y + ch / 2 * fold, cw, ch / 2 * (1 - fold)); }
    g.fillStyle = 'rgba(0,0,0,0.75)'; g.fillRect(cx, y + ch / 2 - 1, cw, 2);
  }
  g.restore();
}

// evidence card (Paper, Source Serif)
function evCard(x, y, w, title, lines, tag, a, opts = {}) {
  if (a <= 0) return;
  const p = eo(a);
  g.save(); g.globalAlpha *= clamp(a * 1.6); g.translate(0, (1 - p) * 26);
  const tl = wrap(title, opts.tpx || 36, SS, 600, w - 70);
  const h = 30 + (opts.tpx || 36) + tl.length * (opts.tpx || 36) * 1.2 - 8 + lines.length * 36 + (tag ? 58 : 18);
  g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 34; g.shadowOffsetY = 14;
  g.fillStyle = COL.paper; g.fillRect(x, y, w, h); g.shadowColor = 'transparent';
  g.fillStyle = COL.amber; g.fillRect(x, y, 8, h);
  let yy = y + 30 + (opts.tpx || 36);
  tl.forEach((l) => { txt(l, x + 34, yy - 8, { px: opts.tpx || 36, fam: SS, w: 600, col: COL.navy }); yy += (opts.tpx || 36) * 1.2; });
  lines.forEach((l) => { txt(l, x + 34, yy + 4, { px: 27, fam: SS, w: 400, col: '#2A3546', style: l.it ? 'italic' : 'normal' }); yy += 36; });
  if (tag) { g.fillStyle = 'rgba(14,26,43,0.15)'; g.fillRect(x + 34, yy + 4, w - 68, 1); txt(tag, x + 34, yy + 32, { px: 18, w: 500, col: '#5F6670', ls: 0.5 }); }
  g.restore();
  return h;
}
function lowerThird(t, a0, name, role, a) {
  if (a <= 0) return;
  const p = eo(ramp(t, a0, a0 + 0.35));
  g.save(); g.globalAlpha = a;
  const x = 72, y = 860; const wN = measure(name, 46, SS, 600);
  g.fillStyle = 'rgba(8,14,24,0.72)'; g.fillRect(x - 20, y - 54, (wN + 60) * p, 118);
  g.fillStyle = COL.amber; g.fillRect(x - 20, y - 54, 5, 118);
  g.beginPath(); g.rect(x - 20, y - 60, (wN + 60) * p, 130); g.clip();
  txt(name, x, y, { px: 46, fam: SS, w: 600, col: COL.paper });
  txt(role, x, y + 42, { px: 26, w: 500, col: COL.amber, ls: 0.5 });
  g.restore();
}
function pill(s, x, y, a, { px = 28, fill = 'rgba(14,26,43,0.9)', stroke = COL.amber, col = COL.paper, w = 600 } = {}) {
  if (a <= 0) return; const p = eob(a);
  g.save(); g.globalAlpha *= clamp(a * 2); const tw = measure(s, px, IN, w) + 36;
  g.translate(x, y); g.scale(lerp(0.6, 1, p), lerp(0.6, 1, p));
  rrect(0, -px * 0.95, tw, px * 1.7, 8); g.fillStyle = fill; g.fill(); g.strokeStyle = stroke; g.lineWidth = 2; g.stroke();
  txt(s, 18, px * 0.2, { px, w, col }); g.restore();
}
// hand-drawn amber circle around a box, progress p
function handCircle(cx, cy, rx, ry, p, seed = 3, lw = 6) {
  if (p <= 0) return; const r = rng(seed); const n = 90; const tot = Math.PI * 2 * 1.08; const a0 = -2.2;
  g.save(); g.strokeStyle = COL.amber; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(232,163,61,0.55)'; g.shadowBlur = 10;
  g.beginPath(); const wob = []; for (let i = 0; i <= n; i++) wob.push((r() - 0.5) * 0.035);
  const m = Math.floor(n * clamp(p));
  for (let i = 0; i <= m; i++) {
    const f = i / n; const ang = a0 + tot * f; const rr = 1 + Math.sin(f * 9) * 0.02 + wob[i] + f * 0.06;
    const x = cx + Math.cos(ang) * rx * rr, y = cy + Math.sin(ang) * ry * rr;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.stroke(); g.restore();
}
function highlighter(x, y, w, h, p) { if (p <= 0) return; g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(232,163,61,0.62)'; g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x + w * p, y); g.lineTo(x + w * p, y + h - 2); g.lineTo(x, y + h); g.closePath(); g.fill(); g.restore(); }
function kinetic(word, x, y, t, t0, px = 150) { // letter-by-letter rise, amber
  if (t < t0) return; let xx = x; const tot = measure(word, px, IN, 800, 6);
  xx = x - tot / 2;
  for (let i = 0; i < word.length; i++) {
    const p = eo(ramp(t, t0 + i * 0.03, t0 + i * 0.03 + 0.3)); const ch = word[i]; const cw = measure(ch, px, IN, 800, 6);
    g.save(); g.globalAlpha *= p; txt(ch, xx, y + (1 - p) * 40, { px, w: 800, col: COL.amber, ls: 6, shadow: 24 }); g.restore(); xx += cw;
  }
}

// ---------------------------------------------------------------- maps
const path = (proj) => d3.geoPath(proj, g);
function mercator(lon, lat, s) { return d3.geoMercator().center([lon, lat]).scale(s).translate([W / 2, H / 2]); }
function fillGeo(proj, fc, fill, stroke, lw = 1) { const pth = path(proj); g.beginPath(); pth(fc); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
function baseMap(proj) {
  g.fillStyle = COL.sea; g.fillRect(0, 0, W, H);
  const gr = d3.geoGraticule().step([1, 1]); g.beginPath(); path(proj)(gr()); g.strokeStyle = 'rgba(242,238,230,0.05)'; g.lineWidth = 1; g.stroke();
  g.save(); g.shadowColor = 'rgba(0,0,0,0.75)'; g.shadowBlur = 26; fillGeo(proj, GEO.region, COL.land, null); g.restore();
  g.save(); g.globalCompositeOperation = 'source-atop'; const lg = g.createLinearGradient(0, 0, W, H); lg.addColorStop(0, 'rgba(255,255,255,0.05)'); lg.addColorStop(1, 'rgba(0,0,0,0.12)'); g.fillStyle = lg; g.restore();
  fillGeo(proj, GEO.lakes, COL.sea, null);
}
function pinAt(proj, lonlat, label, t, t0, opts = {}) {
  if (t < t0) return; const [x, y] = proj(lonlat); const p = eo(ramp(t, t0, t0 + 0.3));
  const drop = (1 - p) * -60;
  g.save(); g.globalAlpha *= clamp(p * 2);
  // ring pulse on landing
  const rp = ramp(t, t0 + 0.22, t0 + 1.0); if (rp > 0 && rp < 1) { g.strokeStyle = `rgba(232,163,61,${0.8 * (1 - rp)})`; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 10 + rp * 46, 0, 7); g.stroke(); }
  const glow = opts.glow ? opts.glow(t) : 0;
  if (glow > 0) { const gr = g.createRadialGradient(x, y, 0, x, y, 60); gr.addColorStop(0, `rgba(232,163,61,${0.55 * glow})`); gr.addColorStop(1, 'rgba(232,163,61,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 60, 0, 7); g.fill(); }
  g.fillStyle = COL.amber; g.strokeStyle = COL.navy; g.lineWidth = 3; g.beginPath(); g.arc(x, y + drop, opts.r || 9, 0, 7); g.fill(); g.stroke();
  if (label) txt(label, x + (opts.lx != null ? opts.lx : 20), y + drop + (opts.ly != null ? opts.ly : 8), { px: opts.px || 30, w: 600, col: COL.paper, align: opts.align || 'left', shadow: 10 });
  g.restore();
}
function partialLine(pts, p) { // pts screen coords, draw first fraction p by length
  if (p <= 0 || pts.length < 2) return [];
  const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  const want = tot * clamp(p); let acc = 0; const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) { if (acc + L[i - 1] >= want) { const f = (want - acc) / L[i - 1]; out.push([lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]); return out; } acc += L[i - 1]; out.push(pts[i]); }
  return out;
}
function strokePts(pts, col, lw, dash, glow) {
  if (pts.length < 2) return; g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  if (dash) g.setLineDash(dash); if (glow) { g.shadowColor = col; g.shadowBlur = glow; }
  g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); g.restore();
}
function arrowHead(pts, col, size = 18) { if (pts.length < 2) return; const a = pts[pts.length - 1], b = pts[pts.length - 2]; const ang = Math.atan2(a[1] - b[1], a[0] - b[0]); g.save(); g.fillStyle = col; g.translate(a[0], a[1]); g.rotate(ang); g.beginPath(); g.moveTo(4, 0); g.lineTo(-size, -size * 0.6); g.lineTo(-size, size * 0.6); g.closePath(); g.fill(); g.restore(); }
function bezierPts(a, b, bulge, n = 60) { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; const dx = b[0] - a[0], dy = b[1] - a[1]; const cx = mx - dy * bulge, cy = my + dx * bulge; const out = []; for (let i = 0; i <= n; i++) { const t = i / n; out.push([(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * cx + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * cy + t * t * b[1]]); } return out; }

// ---------------------------------------------------------------- scenes
const SCENES = [];
function shot(a, xin, draw, extra = {}) { SCENES.push({ a, xin, draw, ...extra }); }

function sceneDisclaimer(t) {
  g.fillStyle = COL.navy; g.fillRect(0, 0, W, H);
  const a = fadeIO(t, 0.0, 4.02, 0.5, 0.45); const s = 1 + t * 0.018;
  g.save(); g.globalAlpha = a; g.translate(W / 2, H / 2); g.scale(s, s); g.translate(-W / 2, -H / 2);
  const paras = ['An independent, non-partisan documentary. We don’t take sides.',
    'Facts are sourced on screen; each side’s view is attributed and given equal weight.',
    'Some scenes and the narration voices are AI-generated.'];
  let lines = []; paras.forEach((p, i) => { lines = lines.concat(wrap(p, 38, SS, 400, 1180)); if (i < paras.length - 1) lines.push(''); });
  const lh = 56; let y = H / 2 - (lines.length * lh) / 2 + 30;
  g.fillStyle = COL.amber; g.fillRect(W / 2 - 40, y - 70, 80, 2);
  let para = 0; lines.forEach((l) => { if (!l) para++; if (l) { const pa = eo(ramp(t, 0.15 + para * 0.7, 0.75 + para * 0.7)); txt(l, W / 2, y + (1 - pa) * 14, { px: 38, fam: SS, w: 400, col: COL.paper, align: 'center', alpha: pa }); } y += l ? lh : 24; });
  g.restore();
}
function sceneCard(t) {
  g.fillStyle = COL.navy; g.fillRect(0, 0, W, H);
  const lt = t - C.card_in; const s = 1.0 + lt * 0.01;
  g.save(); g.translate(W / 2, H / 2); g.scale(s, s); g.translate(-W / 2, -H / 2);
  // the Thread motif: thin amber line drawing across behind the title
  const lp = eio(ramp(lt, 0.2, 2.2));
  g.save(); g.strokeStyle = 'rgba(232,163,61,0.55)'; g.lineWidth = 2; g.shadowColor = COL.amber; g.shadowBlur = 12;
  g.beginPath(); g.moveTo(260, 640); g.lineTo(260 + (W - 520) * lp, 640); g.stroke(); g.restore();
  g.fillStyle = COL.amber; g.beginPath(); g.arc(260, 640, 6 * clamp(lt * 4), 0, 7); g.fill();
  if (lp >= 1) { g.beginPath(); g.arc(W - 260, 640, 6, 0, 7); g.fill(); }
  txt('14,000 KILOMETRES', W / 2, 360, { px: 24, w: 600, col: COL.grey, align: 'center', ls: 8, alpha: eo(ramp(lt, 0.1, 0.5)) });
  txt('CHAPTER 1', W / 2, 440, { px: 30, w: 600, col: COL.amber, align: 'center', ls: 10, alpha: eo(ramp(lt, 0.25, 0.6)) });
  // title write-on (wipe)
  const wp = eio(ramp(lt, 0.45, 1.5)); const tw = measure('THE VOTE AUSTRALIA CAST FIRST', 92, SS, 600, 2);
  g.save(); g.beginPath(); g.rect(W / 2 - tw / 2 - 10, 470, (tw + 20) * wp, 140); g.clip();
  txt('THE VOTE AUSTRALIA CAST FIRST', W / 2, 580, { px: 92, fam: SS, w: 600, col: COL.paper, align: 'center', ls: 2 });
  g.restore();
  txt('SYDNEY', 260, 690, { px: 18, w: 600, col: COL.grey, align: 'center', ls: 4, alpha: eo(ramp(lt, 0.3, 0.8)) });
  txt('GAZA', W - 260, 690, { px: 18, w: 600, col: COL.grey, align: 'center', ls: 4, alpha: eo(ramp(lt, 2.0, 2.4)) });
  g.restore();
  flicker(0.35);
}

// ----- S05
function sceneS05a(t, lt) {
  cover(IMG.PH26, 0, 0, W, H, 1.10 + lt * 0.04, 0.50, 0.36, GRADE.arch, -0.04 + lt * 0.012, 0);
  vignette(0.5); flicker(1); bottomShade(0.5);
}
function sceneS05b(t, lt) {
  const f = vid('FT05b', lt + 0.2); if (f) cover(f, 0, 0, W, H, 1.06 + lt * 0.03, 0.5, 0.5, GRADE.arch);
  vignette(0.55); flicker(1); bottomShade(0.5);
}
function sceneDocPage(t, lt, phase) {
  // DOC01 page on the desk; phase S05: drop + approach the header; S07: dive to the title line + highlighter
  desk();
  const img = IMG.DOC01_page; const pw = 1150, ph = pw * img.height / img.width;
  let z, fx, fy, dropP;
  if (phase === 'S05') { dropP = eo(ramp(lt, 0, 0.4)); z = lerp(1.0, 1.35, eio(ramp(lt, 0.2, 2.0))); fx = 0.5; fy = lerp(0.42, 0.12, eio(ramp(lt, 0.2, 2.0))); }
  else { dropP = 1; const dz = eio(ramp(lt, 0.0, 1.35)); z = lerp(1.35, 3.0, dz); fx = lerp(0.5, 0.30, dz); fy = lerp(0.12, 0.198, dz); }
  // camera: page coords (fx,fy) -> screen centre at zoom z
  g.save(); g.translate(W / 2, H / 2 + (1 - dropP) * 60); g.scale(z * lerp(1.15, 1, dropP), z * lerp(1.15, 1, dropP)); g.rotate((1 - dropP) * 0.06 - 0.012);
  g.translate(-(fx - 0.5) * pw, -(fy - 0.5) * ph);
  g.globalAlpha *= clamp(dropP * 2);
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 40; g.shadowOffsetY = 18; g.fillStyle = '#EDE7DA'; g.fillRect(-pw / 2, -ph / 2, pw, ph); g.shadowColor = 'transparent';
  g.filter = GRADE.doc; g.drawImage(img, -pw / 2, -ph / 2, pw, ph); g.filter = 'none';
  if (phase === 'S07') { // highlighter over "181 (II). Future government of Palestine" (page px 200..1090, 695..760)
    const k = pw / img.width; const hp = eo(ramp(lt, 1.25, 1.85));
    highlighter(-pw / 2 + 196 * k, -ph / 2 + 690 * k, 900 * k, 74 * k, hp);
  }
  g.restore();
  vignette(0.5);
}

// ----- S06
function sceneAnnex(t, lt) {
  // UN partition-plan map (A/516 Annex A), cropped: title block -> the plan
  const img = IMG.ANNEX; const d = eio(ramp(lt, 0, 3.9));
  const z = lerp(2.15, 1.45, d), fx = lerp(0.24, 0.42, d), fy = lerp(0.118, 0.37, d);
  cover(img, 0, 0, W, H, z, fx, fy, GRADE.archLight);
  // amber underline sweeps under "PALESTINE" (title, crop px ~ 270..560 x 150) on "Palestine"
  const up = eo(ramp(t, C.palestine_s06, C.palestine_s06 + 0.45));
  if (up > 0) {
    const iw = img.width, ih = img.height, ia = iw / ih, ra = W / H; let sw, sh; if (ia > ra) { sh = ih; sw = sh * ra; } else { sw = iw; sh = sw / ra; } sw /= z; sh /= z;
    const sx = clamp(fx * iw - sw / 2, 0, iw - sw), sy = clamp(fy * ih - sh / 2, 0, ih - sh); const k = W / sw;
    const x0 = (282 - sx) * k, x1 = (800 - sx) * k, y0 = (196 - sy) * k;
    g.save(); g.strokeStyle = COL.amber; g.lineWidth = 6; g.lineCap = 'round'; g.shadowColor = COL.amber; g.shadowBlur = 12; g.beginPath(); g.moveTo(x0, y0); g.lineTo(lerp(x0, x1, up), y0); g.stroke(); g.restore();
  }
  vignette(0.5); bottomShade(0.55);
}
function sceneEvatt(t, lt) {
  desk();
  const tP = C.an_australian - 0.12; // portrait drops just before "Australian"
  const push = eio(ramp(t, tP + 0.4, C.doc + 0.8));
  g.save(); g.translate(W / 2, H / 2); const camZ = 1 + push * 0.10; g.scale(camZ, camZ); g.translate(-W / 2 - push * 70, -H / 2 + push * 10);
  print(IMG.PH01b, { t0: C.chairing - 0.05, cx: 640, cy: 470, w: 900, rot: -4, filter: GRADE.arch, zoom: (tt) => 1.04 + (tt - C.chairing) * 0.02, dim: 0.35 * eo(ramp(t, tP, tP + 0.5)) }, t);
  print(IMG.PH01, { t0: tP, cx: 1180, cy: 520, w: 560, rot: 2.5, filter: GRADE.arch, fy: 0.42, zoom: (tt) => 1.02 + Math.max(0, tt - tP) * 0.012, par: 'PH01', parP: (tt) => ramp(tt, tP, C.doc + 1) }, t);
  g.restore();
  // kinetic AUSTRALIAN
  const ka = 1 - ramp(t, C.foreign_minister - 0.4, C.foreign_minister);
  if (ka > 0) { g.save(); g.globalAlpha = ka; kinetic('AUSTRALIAN', 640, 300, t, C.australian_word); g.restore(); }
  // callout on "Doc"
  const cp = ramp(t, C.doc, C.doc + 0.3);
  if (cp > 0) {
    const x = 1300 - push * 40, y = 260; g.save(); g.strokeStyle = COL.amber; g.lineWidth = 3; g.globalAlpha = clamp(cp * 2);
    g.beginPath(); g.moveTo(x, y + 30); g.lineTo(x - 60 * eo(cp), y + 90 * eo(cp)); g.stroke(); g.restore();
    pill('Chair, UN Ad Hoc Committee on Palestine', x, y, cp, { px: 30 });
  }
}

// ----- S07 MAP03 (1947 partition plan)
function sceneMap03(t, lt) {
  const d = eio(ramp(lt, 0, 6.6));
  const proj = mercator(lerp(36.1, 35.5, d), lerp(31.5, 31.3, d), lerp(7600, 12400, d));
  baseMap(proj);
  const pth = path(proj);
  const div = eio(ramp(t, C.divide, C.divide + 1.7));
  const feats = Object.fromEntries(GEO.plan.features.map((f) => [f.properties.n, f]));
  // undivided Mandate land first (neutral, lighter land), then both zones revealed together
  g.beginPath(); GEO.plan.features.forEach((f) => pth(f)); g.fillStyle = '#3A4E68'; g.fill();
  if (div > 0) {
    const ctr = proj([35.0, 31.4]); const R = div * 900;
    g.save(); g.beginPath(); g.arc(ctr[0], ctr[1], R, 0, 7); g.clip();
    const A = 0.92;
    g.globalAlpha = A; g.beginPath(); pth(feats.jewish_state); g.fillStyle = COL.slate; g.fill();
    g.beginPath(); pth(feats.arab_state); pth(feats.jaffa_enclave); g.fillStyle = COL.sand; g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = '#2B2B2B'; g.lineWidth = 1.4;
    ['jewish_state', 'arab_state', 'jaffa_enclave'].forEach((k) => { g.beginPath(); pth(feats[k]); g.stroke(); });
    g.restore();
  }
  { const sp = ramp(t, C.arab_state, C.arab_state + 1.6); if (sp > 0 && sp < 1) { const sx = lerp(-400, W + 400, eio(sp)); g.save(); g.beginPath(); GEO.plan.features.forEach((ft) => pth(ft)); g.clip(); const sg = g.createLinearGradient(sx - 220, 0, sx + 220, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.28)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sg; g.fillRect(0, 0, W, H); g.restore(); } }
  fillGeo(proj, GEO.lakes, COL.sea, null);
  const jr = eo(ramp(t, C.divide + 0.9, C.divide + 1.4));
  if (jr > 0) {
    g.save(); g.globalAlpha = jr; g.beginPath(); pth(feats.jerusalem_corpus_separatum); g.fillStyle = COL.jer; g.fill(); g.strokeStyle = '#5A5A5A'; g.lineWidth = 2; g.stroke();
    const [jx, jy] = proj([35.21, 31.75]); g.strokeStyle = COL.jer; g.lineWidth = 2.5; g.beginPath(); g.arc(jx, jy, lerp(60, 30, jr), 0, 7); g.stroke(); g.restore();
  }
  // title + legend (both state labels appear on the same frame, same design)
  txt('UN Partition Plan, 29 November 1947', 72, 96, { px: 34, w: 600, alpha: eo(ramp(lt, 0.2, 0.6)), shadow: 8 });
  txt('General Assembly resolution 181 (II)', 72, 136, { px: 24, w: 400, col: '#B8BCC4', alpha: eo(ramp(lt, 0.3, 0.7)) });
  const la = eo(ramp(t, C.jewish_state, C.jewish_state + 0.35)), lj = eo(ramp(t, C.divide + 1.0, C.divide + 1.35));
  const LX = 1270, LY = 430;
  const legend = [[COL.slate, 'Proposed Jewish state', la], [COL.sand, 'Proposed Arab state', la], [null, 'Jerusalem (international zone)', lj]];
  legend.forEach(([c, s, a], i) => {
    if (a <= 0) return; const y = LY + i * 70; g.save(); g.globalAlpha = a; g.translate((1 - a) * 20, 0);
    if (c) { g.fillStyle = c; g.fillRect(LX, y - 28, 44, 34); g.strokeStyle = '#2B2B2B'; g.lineWidth = 1.4; g.strokeRect(LX, y - 28, 44, 34); }
    else { g.fillStyle = COL.jer; g.beginPath(); g.arc(LX + 22, y - 11, 15, 0, 7); g.fill(); g.strokeStyle = '#5A5A5A'; g.lineWidth = 2; g.stroke(); }
    txt(s, LX + 66, y, { px: 32, w: 600, col: COL.paper }); g.restore();
  });
  txt('Mediterranean Sea', ...proj([33.75, 32.35]), { px: 24, w: 400, style: 'italic', col: 'rgba(242,238,230,0.45)', align: 'center' });
  txt('Boundaries: UN map, A/516 Annex A, 1947 (public domain). Base: Natural Earth.', W - 64, 1036, { px: 17, col: 'rgba(242,238,230,0.7)', align: 'right' });
  vignette(0.45);
}

// ----- S07 roll call (voting sheet, typed table only)
const ROWS = { header: 20, afg: 53, arg: 90, aus: 126 }; // table-crop px (row centres)
function sceneRollCall(t, lt) {
  desk();
  const img = IMG.DOC02b; const k = 2.35; const tw = img.width * k, th = img.height * k;
  // strip slides up into place fast, then the reading bar steps down in true calling order
  const slide = eo(ramp(t, C.the_first - 0.15, C.the_first + 0.3));
  const s0 = C.first_country;
  const steps = [[s0 - 0.05, ROWS.header], [s0 + 0.1, ROWS.afg], [s0 + 0.55, ROWS.arg], [s0 + 1.05, ROWS.aus]];
  let focus = ROWS.header;
  for (let i = 1; i < steps.length; i++) { const [st, row] = steps[i]; const pv = steps[i - 1][1]; focus = lerp(focus === pv ? pv : focus, row, eo(ramp(t, st, st + 0.32))); }
  const pull = eio(ramp(t, C.australia + 0.75, C.australia + 1.7));
  const creep = eio(ramp(t, C.vote_yes, C.australia + 0.2));
  const camY = lerp(focus, 300, pull); const camZ = lerp(1 + creep * 0.16, 0.62, pull);
  g.save(); g.translate(W * lerp(0.46, 0.34, pull), H * 0.5 + (1 - slide) * 900); g.scale(camZ, camZ); g.translate(-tw / 2, -camY * k);
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 40; g.shadowOffsetY = 16; g.fillStyle = '#D9CDAE'; g.fillRect(-20, -30, tw + 40, th + 60); g.shadowColor = 'transparent';
  cover(img, 0, 0, tw, th, 1, 0.5, 0.5, GRADE.doc);
  // reading bar
  const barA = slide * (1 - pull * 0.6);
  g.fillStyle = `rgba(232,163,61,${0.22 * barA})`; g.fillRect(-14, (focus - 17) * k, tw + 28, 34 * k);
  g.strokeStyle = `rgba(232,163,61,${0.7 * barA})`; g.lineWidth = 2; g.strokeRect(-14, (focus - 17) * k, tw + 28, 34 * k);
  // vote tags in calling order
  [['No', ROWS.afg, steps[1][0] + 0.2], ['Abstain', ROWS.arg, steps[2][0] + 0.2], ['Yes', ROWS.aus, steps[3][0] + 0.3]].forEach(([s, row, t0], i) => {
    const a = eo(ramp(t, t0, t0 + 0.25)); pill(s, tw + 40, row * k + 12, a, { px: 34, stroke: i === 2 ? COL.amber : 'rgba(242,238,230,0.5)', col: i === 2 ? COL.amber : COL.paper });
  });
  // amber circle around AUSTRALIA (table px x 27..127, y 115..138) on "Australia"
  const cp = eio(ramp(t, C.australia, C.australia + 0.72));
  handCircle(77 * k, 126 * k, 78 * k, 23 * k, cp, 5, 6 / camZ);
  g.restore();
  // A/PV.128 excerpt slides in during the hold, "Australia," underlined
  const ex = eo(ramp(t, C.australia + 0.95, C.australia + 1.45));
  if (ex > 0) {
    const e = IMG.DOC02_excerpt; const ew = 760, eh = ew * e.height / e.width;
    g.save(); g.translate(1420 + (1 - ex) * 700, 470); g.rotate(0.03);
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 40; g.shadowOffsetY = 16; g.fillStyle = '#F4F1EA'; g.fillRect(-ew / 2 - 14, -eh / 2 - 14, ew + 28, eh + 28); g.shadowColor = 'transparent';
    g.filter = GRADE.doc; g.drawImage(e, -ew / 2, -eh / 2, ew, eh); g.filter = 'none';
    const kk = ew / e.width; const up = eo(ramp(t, C.australia + 1.35, C.australia + 1.75));
    g.strokeStyle = COL.amber; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-ew / 2 + 333 * kk, -eh / 2 + 365 * kk); g.lineTo(-ew / 2 + lerp(333, 518, up) * kk, -eh / 2 + 365 * kk); g.stroke();
    g.restore();
  }
  vignette(0.5);
}

// ----- S08
function sandParticles(t, n = 260, amt = 1) {
  const r = rng(77); g.save();
  for (let i = 0; i < n; i++) {
    const speed = 260 + r() * 520, y0 = r() * H, x0 = r() * W, len = 8 + r() * 30, a = (0.05 + r() * 0.18) * amt;
    const x = ((x0 + t * speed) % (W + 200)) - 100, y = y0 + Math.sin(t * 2 + i) * 6 + t * 12 * r();
    g.strokeStyle = `rgba(240,215,170,${a})`; g.lineWidth = 1 + r() * 1.6; g.beginPath(); g.moveTo(x, y % H); g.lineTo(x - len, (y % H) + len * 0.06); g.stroke();
  }
  // drifting haze band
  const gr = g.createLinearGradient(0, H * 0.55, 0, H); gr.addColorStop(0, 'rgba(230,200,150,0)'); gr.addColorStop(1, `rgba(230,200,150,${0.10 * amt})`); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.restore();
}
function sceneDesert(t, lt) {
  const f = vid('ST06', lt); if (f) cover(f, 0, 0, W, H, 1.04 + lt * 0.022, 0.5, 0.45, 'sepia(0.32) saturate(0.85) contrast(1.05) brightness(0.92)');
  sandParticles(lt); vignette(0.5);
}
function sceneAI03(t, lt) {
  const f = vid('AI03', lt); if (f) cover(f, 0, 0, W, H, 1.03 + lt * 0.015, 0.5, 0.5, GRADE.ai);
  sandParticles(lt + 5, 120, 0.5); vignette(0.5); bottomShade(0.4);
}
function sceneFT02(t, lt) {
  const f = vid('FT02', lt + 0.3); if (f) cover(f, 0, 0, W, H, 1.04 + lt * 0.02, 0.5, 0.5, GRADE.arch);
  vignette(0.55); flicker(0.6); bottomShade(0.5);
}
function sceneFT02c(t, lt) {
  const f = vid('FT02c', lt); if (f) cover(f, 0, 0, W, H, 1.05 + lt * 0.02, 0.5, 0.5, GRADE.arch);
  vignette(0.55); flicker(0.6); bottomShade(0.5);
}
const BEER = [34.7913, 31.2518], JER = [35.2137, 31.7683];
function sceneMap02(t, lt, which) {
  // continuous camera across the three MAP02 visits
  const s = ramp(t, C.charged - 0.4, C.s09_pic);
  const proj = mercator(lerp(34.85, 35.1, s), lerp(31.36, 31.52, s), lerp(40000, 31000, eio(s)));
  baseMap(proj);
  txt('Mediterranean Sea', ...proj([34.05, 31.85]), { px: 28, style: 'italic', col: 'rgba(242,238,230,0.45)', align: 'center' });
  txt('Dead Sea', ...proj([35.62, 31.35]), { px: 22, style: 'italic', col: 'rgba(242,238,230,0.4)', align: 'center' });
  // dotted charge arrow (schematic, from the east) on "charged"
  const ap = eio(ramp(t, C.charged, C.charged + 1.5));
  const ptsA = d3.range(0, 41).map((i) => proj([lerp(35.12, 34.815, i / 40), lerp(31.16, 31.248, i / 40) + Math.sin(i / 40 * Math.PI) * 0.025]));
  const pa = partialLine(ptsA, ap); strokePts(pa, COL.amber, 6, [2, 14], 8); if (ap > 0.05) arrowHead(pa, COL.amber, 24);
  // road to Jerusalem
  const rp = eio(ramp(t, C.road - 0.15, C.road + 1.15));
  const road = [BEER, [34.95, 31.38], [35.1, 31.53], [35.16, 31.66], JER].map((p) => proj(p));
  const smooth = []; for (let i = 0; i < road.length - 1; i++) for (let j = 0; j < 12; j++) smooth.push([lerp(road[i][0], road[i + 1][0], j / 12), lerp(road[i][1], road[i + 1][1], j / 12)]); smooth.push(road[road.length - 1]);
  strokePts(partialLine(smooth, rp), COL.amber, 5, null, 14);
  pinAt(proj, BEER, 'Beersheba', t, C.beersheba, { lx: -22, align: 'right', ly: 10 });
  pinAt(proj, JER, 'Jerusalem', t, C.road + 1.0, { lx: 22 });
  vignette(0.45);
  txt('Base map: Natural Earth (public domain)', W - 64, 1036, { px: 16, col: 'rgba(242,238,230,0.55)', align: 'right' });
}
function sceneStack(t, lt) {
  desk();
  const cam = 1 + lt * 0.02;
  g.save(); g.translate(W / 2, H / 2); g.scale(cam, cam); g.translate(-W / 2, -H / 2);
  print(IMG.PH02, { t0: C.one_of_last - 0.1, cx: 900, cy: 500, w: 1260, rot: -1.5, spin: 3, zoom: (tt) => 1.03 + (tt - C.one_of_last) * 0.03, fx: 0.55, fy: 0.55, par: 'PH02', parP: (tt) => ramp(tt, C.one_of_last, C.one_of_last + 3.5) }, t);
  print(IMG.PH02b, { t0: C.one_of_last + 0.95, cx: 1430, cy: 420, w: 520, rot: 5, filter: GRADE.arch, zoom: () => 1.0 }, t);
  print(IMG.PH02c, { t0: C.cavalry + 0.75, cx: 560, cy: 640, w: 680, rot: -6, filter: GRADE.arch, zoom: () => 1.0 }, t);
  g.restore(); vignette(0.45); bottomShade(0.4);
}

// ----- S09 SPLIT 1917 | 1947
function sceneS09(t, lt) {
  desk(); const cz = 1 + lt * 0.012; g.translate(W / 2, H / 2); g.scale(cz, cz); g.translate(-W / 2, -H / 2);
  const sl = eo(ramp(lt, 0, 0.75)); const pw = 800, ph = 560, y = 300;
  const lb = lerp(0.45, 1, eo(ramp(t, C.horseback, C.horseback + 0.5))), rb = lerp(0.45, 1, eo(ramp(t, C.ballot, C.ballot + 0.5)));
  const zoom = 1.04 + Math.max(0, lt) * 0.012;
  const panels = [[IMG.PH02, 140 - (1 - sl) * 1000, lb, '1917', 'Palestine, 1917 · AWM', 0.55, 0.55, GRADE.arch], [IMG.DOC02b, 980 + (1 - sl) * 1000, rb, '1947', 'UN voting sheet, 29 November 1947', 0.5, 0.115, GRADE.doc]];
  panels.forEach(([img, x, b, yr, cap, fx, fy, fil]) => {
    g.save(); g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 40; g.shadowOffsetY = 16; g.fillStyle = '#EFEBE2'; g.fillRect(x - 12, y - 12, pw + 24, ph + 24); g.restore();
    g.save(); g.beginPath(); g.rect(x, y, pw, ph); g.clip();
    cover(img, x, y, pw, ph, img === IMG.DOC02b ? zoom * 1.0 : zoom, fx, fy, `${fil} brightness(${b})`);
    if (img === IMG.DOC02b) { // circle stays on Australia
      const iw = img.width, ih = img.height, ia = iw / ih, ra = pw / ph; let sw, sh; if (ia > ra) { sh = ih; sw = sh * ra; } else { sw = iw; sh = sw / ra; } sw /= zoom; sh /= zoom;
      const sx = clamp(fx * iw - sw / 2, 0, iw - sw), sy = clamp(fy * ih - sh / 2, 0, ih - sh); const kk = pw / sw;
      g.globalAlpha = lerp(0.5, 1, (b - 0.45) / 0.55); handCircle(x + (77 - sx) * kk, y + (126 - sy) * kk, 78 * kk, 23 * kk, 1, 5, 6);
    }
    g.restore();
    txt(yr, x + pw / 2, y - 48, { px: 64, w: 700, col: b > 0.9 ? COL.amber : COL.paper, align: 'center', alpha: sl });
    txt(cap, x + pw / 2, y + ph + 54, { px: 22, w: 500, col: 'rgba(242,238,230,0.8)', align: 'center', alpha: sl });
  });
  // "twice": amber thread joins the two years
  const tp = eio(ramp(t, C.twice, C.twice + 0.8));
  if (tp > 0) { g.save(); g.strokeStyle = COL.amber; g.lineWidth = 3; g.shadowColor = COL.amber; g.shadowBlur = 10; g.beginPath(); g.moveTo(640, 230); g.lineTo(lerp(640, 1280, tp), 230); g.stroke(); g.restore(); }
  vignette(0.45);
  txt('Photo: Australian War Memorial A02788 (public domain) · Voting sheet: United Nations (public domain)', W - 64, 1036, { px: 16, col: 'rgba(242,238,230,0.6)', align: 'right', alpha: sl });
}

// ----- S10 QUIET MOMENT: two memories, identical treatment
const S10 = { gutter: 8 };
function s10Halves(t, rect, aCap) {
  // rect = {x,y,w,h} of the whole split frame; both halves identical size, identical zoom curve
  const { x, y, w, h } = rect; const hw = (w - S10.gutter * (w / W)) / 2;
  const t0 = C.s10_pic; const z = 1.04 + 0.0042 * Math.max(0, t - t0); // identical Ken Burns speed both halves
  const halves = [[IMG.PH03, x, 0.5, 0.42], [IMG.PH04, x + w - hw, 0.42, 0.5]];
  halves.forEach(([img, hx, fx, fy]) => { g.save(); g.beginPath(); g.rect(hx, y, hw, h); g.clip(); cover(img, hx, y, hw, h, z, fx, fy, GRADE.arch); g.restore(); });
  // divider (glows amber on "The same event")
  const gl = eio(ramp(t, C.same_event, C.same_event + 1.0));
  g.save(); const gx = x + w / 2; g.fillStyle = gl > 0 ? `rgba(232,163,61,${0.35 + 0.65 * gl})` : 'rgba(14,26,43,1)';
  if (gl > 0) { g.shadowColor = COL.amber; g.shadowBlur = 30 * gl; }
  g.fillRect(gx - S10.gutter / 2 * (w / W), y, S10.gutter * (w / W), h); g.restore();
  return hw;
}
function sceneS10(t, lt) {
  const rem = C.remember_idea; const m = eio(ramp(t, rem - 0.45, rem + 0.85)); // morph to the evidence board card
  g.drawImage(IMG.board, 0, 0);
  if (m < 1) { g.save(); g.globalAlpha = 1 - m; g.fillStyle = COL.navy; g.fillRect(0, 0, W, H); g.restore(); }
  const sl = eio(ramp(lt, 0, 1.3)); // slow, symmetric slide-in
  const card = CARD1;
  const rect = { x: lerp(0, card.px, m), y: lerp(0, card.py, m), w: lerp(W, card.pw, m), h: lerp(H, card.ph, m) };
  if (m > 0) drawCard1(t, m, rem);
  g.save();
  if (sl < 1) { // halves slide in from opposite sides
    const hw = W / 2; g.save(); g.beginPath(); g.rect(0, 0, W, H); g.clip();
    g.save(); g.translate(-(1 - sl) * hw, 0); g.beginPath(); g.rect(0, 0, W / 2, H); g.clip(); s10Halves(t, rect, 0); g.restore();
    g.save(); g.translate((1 - sl) * hw, 0); g.beginPath(); g.rect(W / 2, 0, W / 2, H); g.clip(); s10Halves(t, rect, 0); g.restore();
    g.restore();
  } else s10Halves(t, rect, 1);
  g.restore();
  // captions, credits, labels, number (fade out together as the frame becomes a card)
  const out = 1 - ramp(t, rem - 0.5, rem - 0.05);
  if (out > 0 && sl > 0.99) {
    g.save(); g.globalAlpha = out;
    const capA = eo(ramp(lt, 1.3, 1.9));
    const gr = g.createLinearGradient(0, H * 0.7, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = gr; g.fillRect(0, H * 0.7, W, H * 0.3);
    const gt = g.createLinearGradient(0, 0, 0, 260); gt.addColorStop(0, 'rgba(0,0,0,0.5)'); gt.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gt; g.fillRect(0, 0, W, 260);
    const hx = [0, W / 2 + S10.gutter / 2]; const hw = W / 2 - S10.gutter / 2;
    const caps = [['Tel Aviv, 14 May 1948', 'Photo: Hans Pinn / GPO Israel, CC BY-SA 3.0'], ['Galilee, October 1948', 'Photo: David Eldan / GPO Israel, CC BY-SA 3.0']];
    const labs = ['1948 — INDEPENDENCE', '1948 — THE NAKBA'];
    const la = eo(ramp(t, C.nakba, C.nakba + 0.7)); // SAME FRAME for both labels
    for (let i = 0; i < 2; i++) {
      const x0 = hx[i] + 56;
      g.save(); g.globalAlpha *= capA; g.fillStyle = COL.amber; g.fillRect(x0, 990, 4, 30); txt(caps[i][0], x0 + 16, 1014, { px: 26, w: 600, shadow: 10 });
      txt(caps[i][1], x0 + 16, 1046, { px: 17, col: 'rgba(242,238,230,0.78)', shadow: 8 }); g.restore();
      if (la > 0) { g.save(); g.globalAlpha *= la; txt(labs[i], hx[i] + hw / 2, 120, { px: 44, w: 600, align: 'center', ls: 3, shadow: 16 }); g.fillStyle = 'rgba(242,238,230,0.7)'; g.fillRect(hx[i] + hw / 2 - 60 * la, 146, 120 * la, 2); g.restore(); }
    }
    // number roll on the right half (voice: "more than seven hundred thousand")
    const np = ramp(t, C.seven_hundred, C.seven_hundred + 1.2);
    if (np > 0) {
      const v = Math.round(eo(np) * 700000 / 1000) * 1000; const s = v.toLocaleString('en-AU') + (np >= 1 ? '+' : '');
      const cx = W / 2 + S10.gutter / 2 + hw / 2; g.save(); g.globalAlpha *= clamp(np * 3);
      rrect(cx - 250, 760, 500, 170, 8); g.fillStyle = 'rgba(8,14,24,0.6)'; g.fill();
      txt(s, cx, 838, { px: 64, w: 700, align: 'center' });
      txt('displaced', cx, 878, { px: 26, w: 500, align: 'center', col: COL.paper });
      txt('UN Conciliation Commission for Palestine, 1950: ~711,000', cx, 912, { px: 17, w: 400, align: 'center', col: 'rgba(242,238,230,0.75)' });
      g.restore();
    }
    g.restore();
  }
  if (m > 0) drawCard1Text(t, rem);
}
// evidence board cards
const CARD1 = { cx: 640, cy: 520, w: 560, h: 470, px: 0, py: 0, pw: 0, ph: 0 };
CARD1.px = CARD1.cx - CARD1.w / 2 + 30; CARD1.py = CARD1.cy - CARD1.h / 2 + 30; CARD1.pw = CARD1.w - 60; CARD1.ph = (CARD1.w - 60) * 9 / 16;
const CARD2 = { cx: 1300, cy: 560, w: 520, h: 430 };
function drawCard1(t, a) {
  g.save(); g.globalAlpha *= clamp(a * 1.5);
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 40; g.shadowOffsetY = 18; g.fillStyle = COL.paper;
  g.fillRect(CARD1.cx - CARD1.w / 2, CARD1.cy - CARD1.h / 2, CARD1.w, CARD1.h); g.restore();
}
function drawCard1Text(t, rem) {
  const wp = eio(ramp(t, rem + 0.5, rem + 1.4)); const s = 'TWO MEMORIES';
  const y = CARD1.py + CARD1.ph + 80; const tw = measure(s, 50, SS, 600, 2);
  g.save(); g.beginPath(); g.rect(CARD1.cx - tw / 2 - 6, y - 60, (tw + 12) * wp, 80); g.clip();
  txt(s, CARD1.cx, y, { px: 50, fam: SS, w: 600, col: COL.navy, align: 'center', ls: 2 }); g.restore();
  txt('1948', CARD1.cx, y + 44, { px: 24, w: 600, col: '#6A6F78', align: 'center', ls: 4, alpha: eo(ramp(t, rem + 1.2, rem + 1.6)) });
  // pin (thunk) after the write-on
  const pp = eo(ramp(t, rem + 1.45, rem + 1.7));
  if (pp > 0) pinHead(CARD1.cx, CARD1.cy - CARD1.h / 2 + 4, pp);
}
function pinHead(x, y, p) { g.save(); g.globalAlpha *= clamp(p * 2); const s = lerp(1.8, 1, p); g.translate(x, y - (1 - p) * 20); g.scale(s, s); g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 8; g.shadowOffsetY = 4; g.fillStyle = COL.amber; g.beginPath(); g.arc(0, 0, 13, 0, 7); g.fill(); g.shadowColor = 'transparent'; g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.arc(-4, -4, 4, 0, 7); g.fill(); g.restore(); }
function boardStatic(t) { // board with card 1 complete (used in S10 tail and S13)
  g.drawImage(IMG.board, 0, 0);
  drawCard1(t, 1);
  s10Halves(C.remember_idea + 0.85, { x: CARD1.px, y: CARD1.py, w: CARD1.pw, h: CARD1.ph }, 0);
  drawCard1Text(Infinity, 0);
}
function sceneS10Board(t, lt) { // hold on the board after the pin (slow drift)
  g.save(); const z = 1 + lt * 0.01; g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2); boardStatic(t); g.restore(); vignette(0.5);
}

// ----- S11
function mapInset(t, a) {
  if (a <= 0) return;
  const x = 1240, y = 48, w = 620, h = 360;
  g.save(); g.globalAlpha = a; g.translate((1 - eo(a)) * 40, 0);
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 30; g.shadowOffsetY = 12; rrect(x, y, w, h, 10); g.fillStyle = COL.sea; g.fill(); g.shadowColor = 'transparent';
  g.save(); rrect(x, y, w, h, 10); g.clip();
  const proj = d3.geoEquirectangular().center([78, 6]).scale(w / (190 * Math.PI / 180)).translate([x + w / 2, y + h / 2]);
  fillGeo(proj, GEO.world, COL.land, null);
  const EU = [10, 49.5], ME = [36, 33.6], MEL = [144.96, -37.81], SYD = [151.21, -33.87];
  const DUR = 1.8;
  const l1 = eio(ramp(t, C.sailed, C.sailed + DUR)), l2 = eio(ramp(t, C.south_west, C.south_west + DUR)); // same design, weight, timing
  [[EU, MEL, l1, 'Europe', 'Melbourne', C.sailed, C.holocaust], [ME, SYD, l2, 'Middle East', 'Sydney', C.south_west, C.south_west + DUR]].forEach(([o, d, p, on, dn, t0, tg], i) => {
    if (t < t0 - 0.2) return;
    const pts = bezierPts(proj(o), proj(d), 0.16, 80); const pp = partialLine(pts, p);
    strokePts(pp, COL.amber, 3.2, null, 10);
    const [ox, oy] = proj(o); g.fillStyle = COL.paper; g.beginPath(); g.arc(ox, oy, 4.5, 0, 7); g.fill();
    txt(on, ox + (i ? 10 : -10), oy - 12, { px: 18, w: 600, align: i ? 'left' : 'right', shadow: 6, alpha: eo(ramp(t, t0 - 0.2, t0 + 0.2)) });
    if (p >= 1) {
      const [dx, dy] = proj(d); const glow = ramp(t, tg, tg + 0.2) * (1 - ramp(t, tg + 0.8, tg + 1.0));
      if (glow > 0) { const gr = g.createRadialGradient(dx, dy, 0, dx, dy, 34); gr.addColorStop(0, `rgba(232,163,61,${0.8 * glow})`); gr.addColorStop(1, 'rgba(232,163,61,0)'); g.fillStyle = gr; g.beginPath(); g.arc(dx, dy, 34, 0, 7); g.fill(); }
      g.fillStyle = COL.amber; g.strokeStyle = COL.navy; g.lineWidth = 2; g.beginPath(); g.arc(dx, dy, 6.5, 0, 7); g.fill(); g.stroke();
      txt(dn, dx - 10, dy + (i ? -12 : 26), { px: 18, w: 600, align: 'right', shadow: 6 });
    }
  });
  g.restore();
  rrect(x, y, w, h, 10); g.strokeStyle = 'rgba(242,238,230,0.25)'; g.lineWidth = 1.5; g.stroke();
  g.restore();
}
function sceneAI05(t, lt) { const f = vid('AI05', lt); if (f) cover(f, 0, 0, W, H, 1.03 + lt * 0.015, 0.5, 0.55, GRADE.ai); vignette(0.5); bottomShade(0.45); }
function scenePH05(t, lt) {
  desk(); const cam = 1 + lt * 0.018; g.save(); g.translate(W / 2, H / 2); g.scale(cam, cam); g.translate(-W / 2, -H / 2);
  print(IMG.PH05, { t0: C.melbourne - 0.15, cx: 820, cy: 540, w: 1240, rot: -1.5, filter: GRADE.arch, zoom: (tt) => 1.02 + (tt - C.melbourne) * 0.015, fx: 0.48, fy: 0.5 }, t);
  print(IMG.PH05s, { t0: C.per_person - 0.05, cx: 1440, cy: 720, w: 470, rot: 5, filter: GRADE.arch }, t);
  g.restore(); vignette(0.45); bottomShade(0.45);
}
function scenePH06(t, lt) {
  desk(); const cam = 1 + lt * 0.016; g.save(); g.translate(W / 2, H / 2); g.scale(cam, cam); g.translate(-W / 2, -H / 2);
  print(IMG.PH06, { t0: C.palestinian - 0.25, cx: 860, cy: 560, w: 1330, rot: 1.5, filter: GRADE.modern, zoom: (tt) => 1.02 + (tt - C.palestinian) * 0.018, fx: 0.5, fy: 0.55, after: (w, h) => coolWash(-w / 2, -h / 2, w, h, 0.08) }, t);
  g.restore(); vignette(0.45); bottomShade(0.45);
}

// ----- S12 population (two identical number rolls)
function rollVal(t, t0, target) { const p = ramp(t, t0, t0 + 0.9); return { p, v: Math.round(eos(p) * target) }; }
function sceneS12(t, lt) {
  g.fillStyle = COL.navy; g.fillRect(0, 0, W, H); const cz = 1 + lt * 0.011; g.translate(W / 2, H / 2); g.scale(cz, cz); g.translate(-W / 2, -H / 2);
  // Australia silhouette, faint
  const proj = d3.geoMercator().fitExtent([[560, 90], [1360, 900]], GEO.world.features.find((f) => f.properties.n === 'AUS'));
  g.save(); g.globalAlpha = 0.55 * eo(ramp(lt, 0, 1.2)); fillGeo(proj, GEO.world.features.find((f) => f.properties.n === 'AUS'), COL.land, 'rgba(242,238,230,0.12)', 1.5); g.restore();
  const pa = eo(ramp(lt, 0, 0.5));
  const panels = [[300, C.one_hundred, 100000, (v, done) => (done ? 'About 100,000' : v.toLocaleString('en-AU')), 'Jewish Australians'],
    [1000, C.eight_hundred, 800000, (v, done) => (done ? '800,000+' : v.toLocaleString('en-AU')), 'Muslim Australians']];
  panels.forEach(([x, t0, target, fmt, label]) => {
    const w = 620, h = 330, y = 330;
    g.save(); g.globalAlpha = pa; g.translate(0, (1 - pa) * 20);
    g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 30; g.shadowOffsetY = 12; g.fillStyle = COL.paper; g.fillRect(x, y, w, h); g.shadowColor = 'transparent';
    g.fillStyle = COL.amber; g.fillRect(x, y, w, 6);
    txt('CENSUS 2021', x + w / 2, y + 62, { px: 20, w: 600, col: '#6A6F78', align: 'center', ls: 5 });
    const { p, v } = rollVal(t, t0, target); const done = p >= 1;
    txt(p > 0 ? fmt(v, done) : '0', x + w / 2, y + 180, { px: 80, w: 700, col: COL.navy, align: 'center' });
    txt(label, x + w / 2, y + 258, { px: 38, fam: SS, w: 600, col: '#2A3546', align: 'center', alpha: eo(ramp(t, t0 + 0.6, t0 + 1.0)) });
    g.restore();
  });
  txt('ABS Census 2021: 99,956 and 813,392', W / 2, 760, { px: 24, w: 500, col: 'rgba(242,238,230,0.85)', align: 'center', alpha: eo(ramp(t, C.eight_hundred + 0.9, C.eight_hundred + 1.3)) });
  txt('Source: Australian Bureau of Statistics (CC BY 4.0)', W - 64, 1036, { px: 16, col: 'rgba(242,238,230,0.6)', align: 'right', alpha: pa });
  g.setTransform(1, 0, 0, 1, 0, 0); grain(0.06);
}

// ----- S13 MAP01 the Thread
const SYD = [151.2093, -33.8688], GAZA = [34.4668, 31.5017];
const THREAD = d3.geoInterpolate(SYD, GAZA);
const NODE_F = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
function globe(t, rot, R, cx, cy, opts) {
  const proj = d3.geoOrthographic().rotate(rot).scale(R).translate([cx, cy]).clipAngle(90);
  const pth = path(proj);
  // atmosphere
  const at = g.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 1.18); at.addColorStop(0, 'rgba(90,140,200,0.22)'); at.addColorStop(1, 'rgba(90,140,200,0)'); g.fillStyle = at; g.beginPath(); g.arc(cx, cy, R * 1.2, 0, 7); g.fill();
  g.beginPath(); pth({ type: 'Sphere' }); g.fillStyle = COL.sea; g.fill();
  g.beginPath(); pth(d3.geoGraticule().step([15, 15])()); g.strokeStyle = 'rgba(242,238,230,0.06)'; g.lineWidth = 1; g.stroke();
  g.beginPath(); pth(GEO.world); g.fillStyle = COL.land; g.fill(); g.strokeStyle = 'rgba(242,238,230,0.10)'; g.lineWidth = 0.8; g.stroke();
  // shading
  const sh = g.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.2, cx, cy, R); sh.addColorStop(0, 'rgba(255,255,255,0.05)'); sh.addColorStop(1, 'rgba(0,0,0,0.35)'); g.fillStyle = sh; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
  // the Thread
  const tp = opts.thread; const N = 160; const coords = d3.range(0, Math.floor(N * tp) + 1).map((i) => THREAD(Math.min(i / N, tp)));
  if (coords.length > 1) {
    const glowAmt = opts.glow || 0;
    g.save(); g.strokeStyle = COL.amber; g.lineWidth = 3.5 + glowAmt * 2; g.shadowColor = COL.amber; g.shadowBlur = 14 + glowAmt * 26; g.lineCap = 'round';
    g.beginPath(); pth({ type: 'LineString', coordinates: coords }); g.stroke(); g.restore();
  }
  // travelling pulse ("wired")
  if (opts.pulse != null && opts.pulse >= 0 && opts.pulse <= 1) { const pt = THREAD(opts.pulse); if (d3.geoDistance(pt, [-rot[0], -rot[1]]) < Math.PI / 2) { const [x, y] = proj(pt); const gr = g.createRadialGradient(x, y, 0, x, y, 40); gr.addColorStop(0, 'rgba(255,220,160,0.95)'); gr.addColorStop(1, 'rgba(232,163,61,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 40, 0, 7); g.fill(); } }
  const vis = (p) => d3.geoDistance(p, [-rot[0], -rot[1]]) < Math.PI / 2 - 0.02;
  // end points
  [[SYD, 'Sydney', opts.sydA], [GAZA, 'Gaza', opts.gazaA]].forEach(([p, s, a]) => { if (a > 0 && vis(p)) { const [x, y] = proj(p); g.save(); g.globalAlpha = a; g.fillStyle = COL.amber; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); txt(s, x + 14, y + 8, { px: 28, w: 600, shadow: 10 }); g.restore(); } });
  // nodes: node 1 lit, the rest dim and unlabelled
  NODE_F.forEach((f, i) => {
    const p = THREAD(f); if (f > tp || !vis(p) || opts.nodesA <= 0) return; const [x, y] = proj(p);
    g.save(); g.globalAlpha = opts.nodesA;
    if (i === 0 && opts.node1 > 0) {
      const l = opts.node1; const gl = opts.node1glow || 0;
      const gr = g.createRadialGradient(x, y, 0, x, y, 46 + gl * 40); gr.addColorStop(0, `rgba(232,163,61,${0.65 * l + 0.3 * gl})`); gr.addColorStop(1, 'rgba(232,163,61,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 50 + gl * 40, 0, 7); g.fill();
      g.fillStyle = COL.amber; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); g.strokeStyle = COL.paper; g.lineWidth = 2; g.stroke();
      if (opts.labelA > 0) pill('1947 VOTE', x + 26, y - 26, opts.labelA, { px: 26 });
      opts.node1xy = [x, y];
    } else { g.fillStyle = 'rgba(242,238,230,0.35)'; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
    g.restore();
  });
  // distance tag
  if (opts.kmA > 0) { const p = THREAD(0.5); if (vis(p)) { const [x, y] = proj(p); txt('14,000 km', x + 18, y + 40, { px: 22, w: 500, col: 'rgba(242,238,230,0.75)', alpha: opts.kmA, shadow: 8 }); } }
  return opts;
}
function sceneGlobe(t, lt, endHold) {
  g.drawImage(IMG.board, 0, 0); g.fillStyle = 'rgba(6,10,18,0.55)'; g.fillRect(0, 0, W, H);
  // camera path: Australia -> along the Thread -> centred on the whole Thread
  const k1 = eio(ramp(t, C.s13_pic, C.its_family + 1.2)), k2 = eio(ramp(t, C.australia_didnt - 0.4, C.start_clock + 1.4));
  let lon = lerp(140, 100, k1), lat = lerp(-22, -5, k1); lon = lerp(lon, 82, k2); lat = lerp(lat, 6, k2);
  let R = lerp(430, 470, k2);
  if (endHold) { const e = eio(ramp(t, C.s13_end + 1.2, C.total)); lon = lerp(84, 88, e); R = lerp(470, 455, e); }
  lon -= (t - C.s13_pic) * 0.7; lat += (t - C.s13_pic) * 0.25; const zoomIn = eio(ramp(t, C.australia_didnt, C.never_heard)); R *= lerp(1, 1.1, zoomIn);
  const cx = W / 2 + 60, cy = H / 2 + 20;
  const thread = eio(ramp(t, C.s13_pic + 0.35, C.its_family + 0.6));
  const pulse = t >= C.wired ? (((t - C.wired) * 0.55) % 1.3) : null;
  const o = globe(t, [-lon, -lat], R, cx, cy, {
    thread, glow: endHold ? 0.6 + 0.4 * Math.sin((t - C.s13_end) * 3.2) : ramp(t, C.wired, C.wired + 1.5) * 0.5,
    sydA: eo(ramp(t, C.s13_pic + 0.3, C.s13_pic + 0.7)), gazaA: eo(ramp(t, C.its_family + 0.4, C.its_family + 0.8)),
    nodesA: eo(ramp(t, C.its_family + 0.9, C.its_family + 1.4)), node1: eo(ramp(t, C.australia_didnt, C.australia_didnt + 0.4)),
    node1glow: endHold ? 1 : ramp(t, C.never_heard - 1.0, C.never_heard - 0.2), labelA: ramp(t, C.australia_didnt + 0.15, C.australia_didnt + 0.45),
    kmA: eo(ramp(t, C.its_family + 1.2, C.its_family + 1.7)), pulse: pulse != null && pulse <= 1 ? pulse : null,
  });
  // clock hand ticks once over the globe on "start the clock"
  const ca = fadeIO(t, C.start_clock - 0.3, C.start_clock + 1.6, 0.25, 0.4);
  if (ca > 0 && o.node1xy) {
    const [x, y] = o.node1xy; const r = 92; g.save(); g.globalAlpha = ca; g.strokeStyle = 'rgba(242,238,230,0.7)'; g.lineWidth = 2;
    g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.beginPath(); g.moveTo(x + Math.cos(a) * (r - 12), y + Math.sin(a) * (r - 12)); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); }
    const tick = eob(ramp(t, C.start_clock, C.start_clock + 0.22)); const ang = -Math.PI / 2 + tick * (Math.PI / 6);
    g.strokeStyle = COL.amber; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang) * (r - 18), y + Math.sin(ang) * (r - 18)); g.stroke(); g.restore();
  }
  vignette(0.55);
  if (!endHold) txt('Map data: Natural Earth (public domain)', W - 64, 1036, { px: 16, col: 'rgba(242,238,230,0.5)', align: 'right' });
}
function sceneBoard13(t, lt) {
  const z = 1 + lt * 0.012; g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
  boardStatic(t);
  // card 2 pins on "never heard of"; amber string ties it to TWO MEMORIES
  const t0 = C.never_heard; const p = eo(ramp(t, t0 - 0.25, t0 + 0.05));
  if (p > 0) {
    g.save(); g.globalAlpha = clamp(p * 2); g.translate(CARD2.cx, CARD2.cy + (1 - p) * -50); g.rotate(0.035); const s = lerp(1.15, 1, p); g.scale(s, s);
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 40; g.shadowOffsetY = 18; g.fillStyle = COL.paper; g.fillRect(-CARD2.w / 2, -CARD2.h / 2, CARD2.w, CARD2.h); g.shadowColor = 'transparent';
    const pw = CARD2.w - 60, ph = pw * 9 / 16; g.save(); g.beginPath(); g.rect(-pw / 2, -CARD2.h / 2 + 30, pw, ph); g.clip(); cover(IMG.DOC02b, -pw / 2, -CARD2.h / 2 + 30, pw, ph, 1.15, 0.0, 0.1, GRADE.doc); g.restore();
    txt('1947 VOTE', 0, -CARD2.h / 2 + 30 + ph + 74, { px: 50, fam: SS, w: 600, col: COL.navy, align: 'center', ls: 2 });
    txt('29 NOVEMBER 1947', 0, -CARD2.h / 2 + 30 + ph + 116, { px: 22, w: 600, col: '#6A6F78', align: 'center', ls: 4 });
    g.restore();
    pinHead(CARD2.cx, CARD2.cy - CARD2.h / 2 + 6, eo(ramp(t, t0, t0 + 0.2)));
  }
  const sp = eio(ramp(t, t0 + 0.2, t0 + 1.1));
  if (sp > 0) {
    const a = [CARD1.cx, CARD1.cy - CARD1.h / 2 + 4], b = [CARD2.cx, CARD2.cy - CARD2.h / 2 + 6];
    const pts = d3.range(0, 41).map((i) => { const f = i / 40; return [lerp(a[0], b[0], f), lerp(a[1], b[1], f) + Math.sin(f * Math.PI) * 90]; });
    strokePts(partialLine(pts, sp), COL.amber, 3, null, 8);
  }
  g.restore(); vignette(0.5);
}

// ---------------------------------------------------------------- shot list (absolute times)
let OVERLAYS = [];
function buildShots() {
  shot(0, 0, (t) => sceneDisclaimer(t));
  shot(C.card_in, 0.0, (t) => sceneCard(t));
  shot(C.s05_pic, 0.3, sceneS05a);
  shot(C.un - 0.05, 0.12, sceneS05b);
  shot(C.new_york + 0.35, 0.2, (t, lt) => sceneDocPage(t, lt, 'S05'));
  shot(C.s06_pic, 0.25, sceneAnnex);
  shot(C.chairing - 0.12, 0.15, sceneEvatt);
  shot(C.s07_pic, 0.2, (t, lt) => sceneDocPage(t, lt, 'S07'));
  shot(C.divide - 0.35, 0.25, sceneMap03);
  shot(C.the_first - 0.15, 0.0, sceneRollCall);
  shot(C.s08_pic, 0.45, sceneDesert);
  shot(C.thirty_years - 0.2, 0.4, sceneAI03);
  shot(C.light_horsemen - 0.25, 0.12, sceneFT02);
  shot(C.charged - 0.35, 0.15, (t, lt) => sceneMap02(t, lt, 1));
  shot(C.one_of_last - 0.15, 0.12, sceneStack);
  shot(C.it_helped - 0.1, 0.15, (t, lt) => sceneMap02(t, lt, 2));
  shot(C.british - 0.1, 0.15, sceneFT02c);
  shot(C.s08_hold - 0.15, 0.15, (t, lt) => sceneMap02(t, lt, 3));
  shot(C.s09_pic, 0.2, sceneS09);
  shot(C.s10_pic, 0.6, sceneS10);
  shot(C.remember_idea + 1.9, 0.0, sceneS10Board);
  shot(C.s11_pic, 0.8, sceneAI05);
  shot(C.melbourne - 0.2, 0.15, scenePH05);
  shot(C.palestinian - 0.3, 0.15, scenePH06);
  shot(C.south_west + 2.45, 0.35, sceneS12);
  shot(C.s13_pic, 0.4, (t, lt) => sceneGlobe(t, lt, false));
  shot(C.never_heard - 0.45, 0.3, sceneBoard13);
  shot(C.never_heard + 1.65, 0.4, (t, lt) => sceneGlobe(t, lt, true));
  SCENES.sort((a, b) => a.a - b.a);
  for (let i = 0; i < SCENES.length; i++) SCENES[i].b = i + 1 < SCENES.length ? SCENES[i + 1].a + SCENES[i + 1].xin : C.total + 1;

  // overlays: captions / credits / devices (a, b, fn)
  const cap = (a, b, text, credit, o = {}) => OVERLAYS.push({ a, b, fn: (t) => caption(text, credit, fadeIO(t, a, b, 0.3, 0.2), o) });
  cap(C.s05_pic + 0.4, C.un - 0.05, 'UN General Assembly, 1947', 'Photo: Arquivo Nacional (Brazil), Correio da Manhã collection (public domain)');
  cap(C.un + 0.1, C.new_york + 0.4, 'United Nations, Lake Success, New York, 1946', 'Film: Universal Newsreel, 1946 (public domain), via Internet Archive');
  cap(C.new_york + 0.6, C.s06_pic + 0.1, 'UN General Assembly resolution 181 (II), 1947', 'United Nations (public domain)');
  cap(C.s06_pic + 0.4, C.chairing - 0.1, 'Plan of partition proposed by the Ad Hoc Committee, November 1947', 'Based on UN Map No. 103, November 1947 (public domain)');
  cap(C.chairing + 0.25, C.an_australian - 0.1, 'H.V. Evatt, press conference, United States, May 1945', 'Photo: Australian Department of Information, 1945 (public domain)');
  cap(C.an_australian + 0.2, C.foreign_minister - 0.05, 'H.V. Evatt, 1940', 'Photo: National Library of Australia (public domain)');
  OVERLAYS.push({ a: C.foreign_minister, b: C.s07_pic + 0.1, fn: (t) => { const a = fadeIO(t, C.foreign_minister, C.s07_pic + 0.1, 0.3, 0.2); lowerThird(t, C.foreign_minister, 'H.V. “Doc” Evatt', 'Australian Foreign Minister', a); txt('Photo: National Library of Australia, 1940 (public domain)', W - 64, 1036, { px: 17, col: 'rgba(242,238,230,0.75)', align: 'right', alpha: a }); } });
  // DOC01 card
  OVERLAYS.push({ a: C.s07_pic + 1.4, b: C.divide - 0.2, fn: (t) => evCard(72, 760, 860, 'UN General Assembly Resolution 181 (II)', ['29 November 1947 · Future government of Palestine'], 'UN document A/RES/181(II)', fadeIO(t, C.s07_pic + 1.4, C.divide - 0.2, 0.3, 0.2)) });
  cap(C.the_first + 0.4, C.australia + 0.9, 'UN General Assembly voting sheet, 29 November 1947', 'United Nations (public domain), via Wikimedia Commons');
  OVERLAYS.push({ a: C.australia + 0.55, b: C.s08_pic + 0.2, fn: (t) => evCard(72, 742, 900, 'Roll-call vote, 29 November 1947 — Australia: Yes', ['Adopted 33–13, 10 abstentions'], 'UN General Assembly, 128th plenary meeting, A/PV.128', fadeIO(t, C.australia + 0.55, C.s08_pic + 0.2, 0.3, 0.25), { tpx: 34 }) });
  OVERLAYS.push({ a: C.thirty_years - 0.2, b: C.light_horsemen - 0.25, fn: (t) => aiLabel(fadeIO(t, C.thirty_years + 0.2, C.light_horsemen - 0.25, 0.35, 0.2), 1018) });
  cap(C.light_horsemen - 0.05, C.charged - 0.3, 'Beersheba, 1917', 'Film: Australian War Memorial F00042 (public domain)');
  cap(C.one_of_last + 0.15, C.cavalry + 0.7, 'Palestine, 1917', 'Credit: AWM A02788 / J06574 (public domain)');
  cap(C.cavalry + 0.9, C.it_helped - 0.05, 'Beersheba, 1 November 1917', 'Credit: AWM P02041.010 (public domain)');
  cap(C.british + 0.15, C.s08_hold - 0.1, 'Jerusalem, December 1917', 'Film: War Office Cinema Committee, 1917 (public domain)');
  // split-flap boards
  OVERLAYS.push({ a: C.s05_pic, b: C.s06_pic + 0.2, fn: (t) => flapBoard(t, '        ', 'NOV 1947', C.november, fadeIO(t, C.s05_pic + 0.05, C.s06_pic + 0.2, 0.25, 0.25), 72, 862) });
  OVERLAYS.push({ a: C.beersheba - 0.4, b: C.s09_pic + 0.2, fn: (t) => flapBoard(t, 'NOV 1947', 'OCT 1917', C.beersheba, fadeIO(t, C.beersheba - 0.4, C.s09_pic + 0.2, 0.25, 0.25), 72, 862) });
  // world inset with New York locator (S05)
  OVERLAYS.push({ a: C.general_assembly - 0.1, b: C.s06_pic + 0.2, fn: (t) => worldInsetNY(t, fadeIO(t, C.general_assembly - 0.1, C.s06_pic + 0.2, 0.3, 0.3)) });
  // S11
  OVERLAYS.push({ a: C.s11_pic + 0.4, b: C.s11_pic + 2.9, fn: (t) => aiLabel(fadeIO(t, C.s11_pic + 0.6, C.melbourne - 0.2, 0.35, 0.2), 1018) });
  OVERLAYS.push({ a: C.s11_pic + 0.5, b: C.south_west + 2.8, fn: (t) => mapInset(t, fadeIO(t, C.s11_pic + 0.5, C.south_west + 2.8, 0.4, 0.35)) });
  cap(C.melbourne + 0.2, C.per_person + 0.1, 'British migrants aboard the Georgic, 1949', 'Photo: Norman Herfort / Pix, Mitchell Library, State Library of NSW (public domain)');
  cap(C.per_person + 0.25, C.palestinian - 0.3, 'Port Melbourne, 1954', 'Photo: National Archives of Australia, A12111 (public domain)');
  cap(C.palestinian + 0.2, C.south_west + 2.45, 'Haldon Street, Lakemba, Sydney, 2007', 'Photo: Blu3d, CC BY-SA 3.0, via Wikimedia Commons');
  OVERLAYS.sort((a, b) => a.a - b.a);
}
function worldInsetNY(t, a) {
  if (a <= 0) return;
  const x = 1300, y = 56, w = 560, h = 300;
  g.save(); g.globalAlpha = a; g.translate((1 - eo(a)) * 30, 0);
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 30; g.shadowOffsetY = 12; rrect(x, y, w, h, 10); g.fillStyle = COL.sea; g.fill(); g.shadowColor = 'transparent';
  g.save(); rrect(x, y, w, h, 10); g.clip();
  const proj = d3.geoEquirectangular().scale(w / (2 * Math.PI) * 1.05).translate([x + w / 2, y + h / 2 + 18]);
  fillGeo(proj, GEO.world, COL.land, null);
  const NY = [-73.8467, 40.7458]; const [nx, ny] = proj(NY); const p = ramp(t, C.new_york, C.new_york + 0.3);
  if (p > 0) {
    const rp = ramp(t, C.new_york + 0.1, C.new_york + 1.1); if (rp < 1) { g.strokeStyle = `rgba(232,163,61,${1 - rp})`; g.lineWidth = 2.5; g.beginPath(); g.arc(nx, ny, 6 + rp * 40, 0, 7); g.stroke(); }
    g.fillStyle = COL.amber; g.beginPath(); g.arc(nx, ny, 7 * eob(p), 0, 7); g.fill();
    txt('New York', nx + 14, ny - 12, { px: 22, w: 600, alpha: clamp(p * 2), shadow: 6 });
  }
  g.restore(); rrect(x, y, w, h, 10); g.strokeStyle = 'rgba(242,238,230,0.25)'; g.lineWidth = 1.5; g.stroke(); g.restore();
}

// ---------------------------------------------------------------- frame
async function draw(t) {
  g = main; main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = 1; main.filter = 'none';
  main.fillStyle = COL.navy; main.fillRect(0, 0, W, H);
  for (const s of SCENES) {
    if (t < s.a || t >= s.b) continue;
    const a = s.xin > 0 ? eio(ramp(t, s.a, s.a + s.xin)) : 1;
    if (a >= 1) { g = main; g.save(); s.draw(t, t - s.a); g.restore(); }
    else { g = lctx; lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.clearRect(0, 0, W, H); g.save(); s.draw(t, t - s.a); g.restore(); g = main; main.save(); main.globalAlpha = a; main.drawImage(layer, 0, 0); main.restore(); }
  }
  g = main;
  for (const o of OVERLAYS) if (t >= o.a && t < o.b) { g.save(); o.fn(t); g.restore(); }
  grain(0.075);
  // closing fade to navy
  const fo = ramp(t, C.total - 1.1, C.total - 0.05); if (fo > 0) { g.fillStyle = `rgba(14,26,43,${eio(fo)})`; g.fillRect(0, 0, W, H); }
}
window.renderFrame = async function (t) {
  FRAME = Math.round(t * FPS);
  NEED = []; await draw(t);
  if (NEED.length) { await loadNeeded(); NEED = []; await draw(t); }
  return true;
};

// ---------------------------------------------------------------- boot
(async function boot() {
  const fonts = [
    [SS, 'SourceSerif4-Regular.ttf', '400', 'normal'], [SS, 'SourceSerif4-Semibold.ttf', '600', 'normal'], [SS, 'SourceSerif4-It.ttf', '400', 'italic'],
    [IN, 'Inter-Regular.ttf', '400', 'normal'], [IN, 'Inter-Medium.ttf', '500', 'normal'], [IN, 'Inter-SemiBold.ttf', '600', 'normal'], [IN, 'Inter-Bold.ttf', '700', 'normal'], [IN, 'Inter-Bold.ttf', '800', 'normal'], [IN, 'Inter-Italic.ttf', '400', 'italic'],
    [PM, 'IBMPlexMono-SemiBold.ttf', '600', 'normal'],
  ];
  await Promise.all(fonts.map(async ([fam, file, weight, style]) => { const f = new FontFace(fam.replace(/"/g, ''), `url(../fonts/${file})`, { weight, style }); await f.load(); document.fonts.add(f); }));
  TL = await (await fetch('timeline.json')).json(); C = TL.cue;
  GEO = await (await fetch('build/geo.json')).json();
  VIDN = await (await fetch('build/vid/counts.json')).json();
  const imgs = { PH26: 'PH26', PH01: 'PH01', PH01b: 'PH01b', PH02: 'PH02', PH02b: 'PH02b', PH02c: 'PH02c', PH03: 'PH03', PH04: 'PH04', PH05: 'PH05', PH05s: 'PH05s', PH06: 'PH06', DOC01_page: 'DOC01_page', DOC02_excerpt: 'DOC02_excerpt', DOC02b: 'DOC02b_table', ANNEX: 'ANNEX_crop' };
  await Promise.all(Object.entries(imgs).map(([k, f]) => loadImg(k, `build/img/${f}.jpg`)));
  makeTextures();
  makeMasked('PH01', (x, w, h) => { x.beginPath(); x.ellipse(w * 0.505, h * 0.45, w * 0.40, h * 0.41, 0, 0, 7); x.fill(); x.fillRect(0, h * 0.62, w, h * 0.38); }, 18);
  makeMasked('PH02', (x, w, h) => { x.beginPath(); x.moveTo(0, h * 0.53); x.lineTo(w * 0.22, h * 0.53); x.lineTo(w * 0.42, h * 0.535); x.lineTo(w * 0.72, h * 0.49); x.lineTo(w, h * 0.48); x.lineTo(w, h); x.lineTo(0, h); x.closePath(); x.fill(); }, 4);
  buildShots();
  window.__ready = true;
  window.__total = C.total;
  await window.renderFrame(0);
})().catch((e) => { window.__error = String(e && e.stack || e); console.error(e); });
