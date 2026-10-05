/* s32 Phar Lap — Impossible Journeys ep.7 — MAP ANIMATION (kinetic cartography is the picture).
 * Stack: SVG overlays + renderFrame(t) + Playwright + ffmpeg. No Remotion. Claude owns this file.
 *
 * Architecture
 *  - camera.js: one continuous camera (keyed look-at lon/lat, zoom px/km, tilt, bearing) over orthographic planes
 *    A (Tasman), B (California/Baja) and M (whole Pacific). Between planes the centre slerps: a globe spin.
 *  - Static basemap layers (tools/make_basemap.py) are placed with a CSS matrix3d of the camera homography.
 *    Spin frames use a per-frame basemap (tools/make_spin.py) rendered with the identical camera.
 *  - Every overlay (routes, the horse token, pins, gags, insets, labels) is screen-space SVG projected through the
 *    same camera, so strokes and type stay crisp.
 *  - Timing comes from transcript.json (faster-whisper on the held Atlas VO, never modified).
 *
 * Dignity lock: no gore, no cartoon death (California is a map state: the token stops and greys), no verdict on the
 * poisoning (two question labels that never settle), the split is a deadpan tug-of-war. Photos are small name cards.
 * The camel is the series motif: tiny, unlabelled, in the Flemington crowd only.
 */
(function () {
  'use strict';
  const W = 1080;
  const H = 1920;
  const CAP_Y = 1344; // lower-middle band (~70%)
  let K = null; // window.CAMERA
  let DUR = 74.76;

  // ---------------------------------------------------------------- utils
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const cl01 = (v) => clamp(v, 0, 1);
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, d) => cl01((t - a) / d);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeIn = (t) => t * t * t;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOutBack = (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
  const smooth = (a, b, x) => {
    const t = cl01((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const win = (t, a, b, fi = 0.25, fo = 0.25) => Math.min(smooth(a, a + fi, t), 1 - smooth(b - fo, b, t));
  const rand = (i) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const f1 = (n) => (Math.round(n * 10) / 10).toString();
  const f2 = (n) => (Math.round(n * 100) / 100).toString();
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const popIn = (t, a, d = 0.35) => (t < a ? 0 : easeOutBack(prog(t, a, d), 2.0));
  // damped spring for the "boing"
  const boing = (t, a, f = 9, damp = 5) => (t < a ? 0 : Math.exp(-(t - a) * damp) * Math.sin((t - a) * f * Math.PI * 2));

  const C = {
    gold: '#FFC83D',
    goldHi: '#FFE27A',
    route: '#FFB43A',
    routeCore: '#FFE9A8',
    ink: '#0B0F1A',
    chest: '#B65A2B',
    chestHi: '#D27B45',
    chestDk: '#6B2C12',
    red: '#E8433A',
    heart: '#E5484D',
    teal: '#8EE3E0',
    grey: '#9AA4AE',
  };
  const F = {
    mont: "Montserrat, 'Arial Black', Arial, sans-serif",
    anton: "Anton, Impact, 'Arial Black', sans-serif",
  };

  // ---------------------------------------------------------------- the story clock (Whisper-timed)
  const T = {
    hookOut: 1.25,
    nz: 2.6,
    died: 3.76,
    three: 5.38,
    y1926: 7.01,
    foal: 8.72,
    near: 10.14,
    nz2: 11.38,
    warts: 12.54,
    nobody: 14.16,
    picked: 15.5,
    catalogue: 16.38,
    shipped: 17.54,
    australia: 17.9,
    named: 19.0,
    pharlap: 19.34,
    lightning: 21.42,
    winning: 23.28,
    tally37: 25.64,
    tally51: 26.9,
    good: 27.42,
    shoot: 29.82,
    y1930: 31.42,
    cup: 32.12,
    wins: 33.5,
    y1932: 34.98,
    pacific: 37.38,
    mexico: 38.0,
    richest: 39.2,
    winsToo: 41.44,
    later: 42.84,
    california: 44.48,
    ill: 45.68,
    dies: 47.16,
    poisoned: 48.06,
    arsenic: 49.62,
    infection: 51.58,
    never: 53.74,
    both: 55.5,
    hide: 57.34,
    melb: 58.14,
    skeleton: 59.06,
    wlg: 60.02,
    heart: 61.04,
    twice: 62.26,
    canb: 64.88,
    hero: 66.34,
    episode: 69.1,
    follow: 71.64,
    because: 73.38,
    reslam: 74.42,
  };

  // ---------------------------------------------------------------- geometry (lon/lat lines; projected per frame)
  const D2R = Math.PI / 180;
  const vec = (ll) => [Math.cos(ll[1] * D2R) * Math.cos(ll[0] * D2R), Math.cos(ll[1] * D2R) * Math.sin(ll[0] * D2R), Math.sin(ll[1] * D2R)];
  function unwrap(pts) {
    for (let i = 1; i < pts.length; i++) {
      while (pts[i][0] - pts[i - 1][0] > 180) pts[i][0] -= 360;
      while (pts[i][0] - pts[i - 1][0] < -180) pts[i][0] += 360;
    }
    return pts;
  }
  function gc(a, b, n, bulge = 0) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const p = K.slerpLL(a, b, u);
      out.push([p[0], p[1] + bulge * Math.sin(u * Math.PI)]);
    }
    const o = unwrap(out);
    // keep the unwrapped start longitude of a
    const sh = Math.round((a[0] - o[0][0]) / 360) * 360;
    return o.map((p) => [p[0] + sh, p[1]]);
  }
  function mkLine(pts) {
    const L = [0];
    for (let i = 1; i < pts.length; i++) {
      const a = vec(pts[i - 1]);
      const b = vec(pts[i]);
      L.push(L[i - 1] + Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1)));
    }
    const Tt = L[L.length - 1] || 1e-9;
    const at = (f) => {
      const s = cl01(f) * Tt;
      let lo = 0;
      let hi = pts.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (L[mid] < s) lo = mid;
        else hi = mid;
      }
      const u = (s - L[lo]) / Math.max(1e-12, L[hi] - L[lo]);
      return [lerp(pts[lo][0], pts[hi][0], u), lerp(pts[lo][1], pts[hi][1], u), lo];
    };
    const slice = (f0, f1) => {
      if (f1 <= f0) return [];
      const a = at(f0);
      const b = at(f1);
      const out = [[a[0], a[1]]];
      for (let i = a[2] + 1; i <= b[2]; i++) out.push(pts[i]);
      out.push([b[0], b[1]]);
      return out;
    };
    return { pts, at, slice, km: Tt * 6371 };
  }
  // chaikin smoothing for hand-placed overland paths
  function smoothPts(p, it = 3) {
    let q = p;
    for (let k = 0; k < it; k++) {
      const o = [q[0]];
      for (let i = 0; i < q.length - 1; i++) {
        o.push([0.75 * q[i][0] + 0.25 * q[i + 1][0], 0.75 * q[i][1] + 0.25 * q[i + 1][1]]);
        o.push([0.25 * q[i][0] + 0.75 * q[i + 1][0], 0.25 * q[i][1] + 0.75 * q[i + 1][1]]);
      }
      o.push(q[q.length - 1]);
      q = o;
    }
    return q;
  }
  let P = null;
  let TAS = null; // Timaru -> Sydney (shipped across the Tasman)
  let PAC = null; // Sydney -> Agua Caliente (across the Pacific)
  let CAL = null; // Agua Caliente -> California
  let WIN = null; // the winning years: Sydney -> Melbourne overland (stylised)
  let KNOT = null; // Australian end of the tug-of-war rope
  let IJL = null;
  let GEO = null;

  // ---------------------------------------------------------------- camera state
  let CAM = null;
  let M = null;
  function projXY(X, Y) {
    const w = M[6] * X + M[7] * Y + M[8];
    if (w < 0.04) return null;
    return [(M[0] * X + M[1] * Y + M[2]) / w, (M[3] * X + M[4] * Y + M[5]) / w, 1 / w];
  }
  const proj = (ll) => {
    const p = K.fwd(ll[0], ll[1], CAM.c);
    return p[2] > 0.02 ? projXY(p[0], p[1]) : null;
  };
  function pathLL(pts, closed) {
    let d = '';
    let pen = false;
    for (const q of pts) {
      const p = proj(q);
      if (!p) {
        pen = false;
        continue;
      }
      d += (pen ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1]);
      pen = true;
    }
    return d + (closed && d ? 'Z' : '');
  }
  const screenPts = (pts) => pts.map(proj).filter((p) => p);
  const zs = (z) => clamp(Math.pow(z / 1.2, 0.18), 0.9, 1.3);

  // ---------------------------------------------------------------- DOM / assets
  const FONT_CSS = `
    @font-face{font-family:'Anton';src:url(/ep/fonts/Anton-Regular.ttf) format('truetype');font-weight:400;}
    @font-face{font-family:'Montserrat';src:url(/ep/fonts/Montserrat-800.ttf) format('truetype');font-weight:800;}
    @font-face{font-family:'Montserrat';src:url(/ep/fonts/Montserrat-900.ttf) format('truetype');font-weight:900;}
    #stage{position:relative;width:1080px;height:1920px;overflow:hidden;background:#02050f}
    #map{position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:hidden}
    #map img{position:absolute;left:0;top:0;transform-origin:0 0;display:block;max-width:none;backface-visibility:hidden}
    #map img.feather{
      -webkit-mask-image:linear-gradient(to right,transparent 0,#000 7%,#000 93%,transparent 100%),linear-gradient(to bottom,transparent 0,#000 7%,#000 93%,transparent 100%);
      -webkit-mask-composite:source-in;mask-composite:intersect}
    #spin{position:absolute;left:0;top:0;width:1080px;height:1920px;display:none}
    #ov{position:absolute;left:0;top:0}`;
  const st = document.createElement('style');
  st.textContent = FONT_CSS;
  document.head.appendChild(st);
  const GRAIN = '/ep/assets/grain.png';
  const LAYERS = [];
  let stageEl = null;
  let mapEl = null;
  let spinEl = null;
  let ovEl = null;
  let SPIN_SET = null;
  const loadScript = (src) =>
    new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });

  window.EPISODE_READY = (async () => {
    await loadScript('/ep/camera.js');
    K = window.CAMERA;
    DUR = K.DUR;
    P = K.P;
    const meta = await (await fetch('/ep/assets/map_layers.json')).json();
    await loadScript('/ep/assets/geo.js');
    await loadScript('/ep/assets/ij_routes.js');
    GEO = window.GEO;
    TAS = mkLine(gc(P.timaru, P.sydney, 80, 0.6));
    PAC = mkLine(gc(P.sydney, P.agua, 240));
    CAL = mkLine(smoothPts([P.agua, [242.6, 33.6], [241.4, 34.4], [240.3, 35.4], [239.0, 36.6], P.calif], 3));
    WIN = mkLine(smoothPts([P.sydney, [150.3, -34.5], [149.3, -35.1], [147.9, -35.9], [146.6, -36.4], [145.6, -37.2], P.flem], 3));
    KNOT = [151.6, -37.7];
    IJL = {};
    for (const k of ['ep1', 'ep2', 'ep4', 'ep5', 'ep6']) IJL[k] = mkLine(unwrap(window.IJ[k].pts.map((q) => q.slice())));
    SPIN_SET = new Set(K.spinFrames());
    const root = document.getElementById('root');
    root.innerHTML = `<div id="stage"><div id="map"></div><img id="spin"/><svg id="ov" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"></svg></div>`;
    stageEl = document.getElementById('stage');
    mapEl = document.getElementById('map');
    spinEl = document.getElementById('spin');
    ovEl = document.getElementById('ov');
    const decs = [];
    for (const [name, L] of Object.entries(meta)) {
      const im = new Image();
      im.src = '/ep/' + L.src;
      im.width = L.w;
      im.height = L.h;
      im.className = name.endsWith('globe') ? '' : 'feather';
      mapEl.appendChild(im);
      decs.push(im.decode().catch(() => {}));
      LAYERS.push({ name, el: im, A: [1 / L.K, 0, L.x0, 0, 1 / L.K, L.y0, 0, 0, 1], ...L });
    }
    for (const src of [GRAIN, '/ep/assets/card_pharlap.jpg', '/ep/assets/card_cup1930.jpg']) {
      const g = new Image();
      g.src = src;
      decs.push(g.decode().catch(() => {}));
    }
    decs.push(document.fonts.load("400 100px 'Anton'"), document.fonts.load("800 40px 'Montserrat'"), document.fonts.load("900 40px 'Montserrat'"));
    await Promise.all(decs);
    const tr = await (await fetch('/transcript.json')).json();
    window.EPISODE = { duration: DUR, fps: 30, words: tr.words, scenes: [], images: {} };
  })();

  // zoom band where each layer fades in (px/km); globe layers are the base of their plane
  const LAYER_Z = {
    A_tasman: [0.3, 0.5],
    A_seaus: [1.1, 1.8],
    A_cant: [1.1, 1.8],
    A_wlg: [1.6, 2.6],
    A_timaru: [4.0, 6.5],
    A_melb: [4.0, 6.5],
    B_cal: [0.4, 0.75],
    B_tj: [2.6, 4.6],
  };
  function updateMap() {
    for (const L of LAYERS) {
      let op = 0;
      if (!CAM.spin && L.plane === CAM.plane) {
        if (L.name.endsWith('globe')) op = 1;
        else {
          const [z0, z1] = LAYER_Z[L.name];
          op = smooth(z0, z1, CAM.z);
        }
      }
      if (op > 0.001) {
        const corners = [[0, 0], [L.w, 0], [L.w, L.h], [0, L.h]].map(([px, py]) => projXY(L.A[2] + px / L.K, L.A[5] + py / L.K));
        if (corners.every((c) => c)) {
          const xs = corners.map((c) => c[0]);
          const ys = corners.map((c) => c[1]);
          if (Math.max(...xs) < 0 || Math.min(...xs) > W || Math.max(...ys) < 0 || Math.min(...ys) > H) op = 0;
        }
      }
      if (op <= 0.001) {
        L.el.style.display = 'none';
        continue;
      }
      const Mt = K.mul(M, L.A);
      L.el.style.display = 'block';
      L.el.style.opacity = f2(op);
      L.el.style.transform = `matrix3d(${Mt[0]},${Mt[3]},0,${Mt[6]},${Mt[1]},${Mt[4]},0,${Mt[7]},0,0,1,0,${Mt[2]},${Mt[5]},0,${Mt[8]})`;
    }
  }

  // ---------------------------------------------------------------- SVG defs
  function defs() {
    return `<defs>
      <filter id="ds" x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity="0.55"/></filter>
      <filter id="dsS" x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.6"/></filter>
      <filter id="blur2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2"/></filter>
      <filter id="blur3" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="blur6" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="blur14" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
      <filter id="blur30" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="30"/></filter>
      <linearGradient id="hazeTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9fc4e8" stop-opacity="0.30"/><stop offset="1" stop-color="#9fc4e8" stop-opacity="0"/></linearGradient>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#050b1c"/><stop offset="0.7" stop-color="#1b3a66"/><stop offset="1" stop-color="#7aa6cf"/></linearGradient>
      <linearGradient id="botShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></linearGradient>
      <radialGradient id="vig" cx="0.5" cy="0.46" r="0.78"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/></radialGradient>
      <radialGradient id="warm" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFE3A3" stop-opacity="0.9"/><stop offset="0.4" stop-color="#FFB547" stop-opacity="0.35"/><stop offset="1" stop-color="#FFB547" stop-opacity="0"/></radialGradient>
      <radialGradient id="redGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FF8F8A" stop-opacity="0.9"/><stop offset="0.45" stop-color="#E5484D" stop-opacity="0.35"/><stop offset="1" stop-color="#E5484D" stop-opacity="0"/></radialGradient>
      <linearGradient id="chipG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16233a" stop-opacity="0.94"/><stop offset="1" stop-color="#090e1a" stop-opacity="0.94"/></linearGradient>
      <linearGradient id="paperG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBF4E2"/><stop offset="1" stop-color="#E9DCBC"/></linearGradient>
      <linearGradient id="grassG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5E9E46"/><stop offset="1" stop-color="#3D7A33"/></linearGradient>
      <radialGradient id="bubbleBg" cx="0.45" cy="0.35" r="0.8"><stop offset="0" stop-color="#9ccf7c"/><stop offset="1" stop-color="#4f8a3e"/></radialGradient>
      <clipPath id="cardClip"><rect x="0" y="0" width="240" height="180" rx="14"/></clipPath>
      <clipPath id="magClip"><circle cx="0" cy="0" r="250"/></clipPath>
      <pattern id="grainP" patternUnits="userSpaceOnUse" width="384" height="384"><image href="${GRAIN}" width="384" height="384"/></pattern>
    </defs>`;
  }

  // ---------------------------------------------------------------- typography kit
  function label(text, x, y, o = {}) {
    const size = o.size || 40;
    const op = o.op == null ? 1 : o.op;
    if (op <= 0.001) return '';
    const sc = o.sc == null ? 1 : o.sc;
    const anchor = o.anchor || 'middle';
    const fill = o.fill || '#fff';
    const ls = o.ls == null ? 3 : o.ls;
    const font = o.font || F.mont;
    const fw = o.fw || 900;
    const style = o.italic ? 'font-style:italic' : '';
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(o.rot || 0)}) scale(${f2(sc)})" opacity="${f2(op)}">
      <text x="3" y="5" text-anchor="${anchor}" font-family="${font}" font-weight="${fw}" font-size="${size}" letter-spacing="${ls}" fill="#000" opacity="0.45" style="${style}">${esc(text)}</text>
      <text x="0" y="0" text-anchor="${anchor}" font-family="${font}" font-weight="${fw}" font-size="${size}" letter-spacing="${ls}" fill="${fill}" style="${style}"
        stroke="rgba(8,12,22,0.85)" stroke-width="${f1(size * 0.16)}" stroke-linejoin="round" paint-order="stroke">${esc(text)}</text>
    </g>`;
  }
  // map labels and graphics never sit in the caption band
  const capClear = (y) => 1 - Math.min(smooth(1205, 1255, y), 1 - smooth(1430, 1480, y));
  const callout = (text, x, y, o = {}) => label(text, x, y, { font: F.anton, fw: 400, ls: 1, fill: C.gold, size: 64, ...o });
  function chip(text, x, y, o = {}) {
    const op = o.op == null ? 1 : o.op;
    if (op <= 0.001) return '';
    const size = o.size || 38;
    const w = o.w || text.length * size * 0.72 + 64;
    const h = size * 1.7;
    const sc = o.sc == null ? 1 : o.sc;
    const acc = o.acc || C.gold;
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f2(sc)})" opacity="${f2(op)}" filter="url(#ds)">
      <rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(h * 0.24)}" fill="url(#chipG)" stroke="${acc}" stroke-width="3"/>
      <rect x="${f1(-w / 2 + 14)}" y="${f1(h / 2 - 9)}" width="${f1(w - 28)}" height="4" rx="2" fill="${acc}" opacity="0.9"/>
      <text x="0" y="${f1(size * 0.36)}" text-anchor="middle" font-family="${F.mont}" font-weight="900" font-size="${size}" letter-spacing="3" fill="#fff">${esc(text)}</text>
    </g>`;
  }
  function pin(x, y, k, t0, t, col, op = 1) {
    const p = prog(t, t0, 0.45);
    if (p <= 0 || op <= 0.01) return '';
    const drop = (1 - easeOut(p)) * -120;
    const sq = p > 0.6 ? 1 + 0.12 * Math.sin((p - 0.6) * 22) * (1 - p) : 1;
    const s = 1.1 * k;
    return `<g transform="translate(${f1(x)} ${f1(y)})" opacity="${f2(op)}">
      <ellipse cx="0" cy="2" rx="${f1(16 * s * p)}" ry="${f1(5 * s * p)}" fill="#000" opacity="0.4"/>
      <g transform="translate(0 ${f1(drop)}) scale(${f2(s / sq)} ${f2(s * sq)})" filter="url(#dsS)">
        <path d="M0 0 C -6 -14 -20 -24 -20 -40 A 20 20 0 1 1 20 -40 C 20 -24 6 -14 0 0 Z" fill="#fff" stroke="${C.ink}" stroke-width="2.5"/>
        <circle cx="0" cy="-40" r="9.5" fill="${col}"/>
      </g>
    </g>`;
  }
  function ringPulse(x, y, t, t0, r0, r1, col = '#fff', period = 1.6, n = 2, ry = 0.55, op = 1) {
    if (t < t0 || op <= 0.01) return '';
    let s = '';
    for (let i = 0; i < n; i++) {
      const u = ((t - t0) / period + i / n) % 1;
      s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(lerp(r0, r1, u))}" ry="${f1(lerp(r0, r1, u) * ry)}" fill="none" stroke="${col}" stroke-width="${f1(3.5 * (1 - u) + 1)}" opacity="${f2((1 - u) * 0.85 * op)}"/>`;
    }
    return s;
  }
  const dPts = (sp) => sp.map((p, i) => (i ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1])).join('');
  function arrowHead(x, y, ang, s, col = '#fff') {
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)}) scale(${f2(s)})">
      <path d="M0 0 L -22 -12 L -16 0 L -22 12 Z" fill="${col}" stroke="#000" stroke-opacity="0.5" stroke-width="2.5" stroke-linejoin="round"/></g>`;
  }
  const angOf = (sp) => {
    const e = sp[sp.length - 1];
    const e2 = sp[Math.max(0, sp.length - 4)];
    return (Math.atan2(e[1] - e2[1], e[0] - e2[0]) * 180) / Math.PI;
  };
  function offsetPolyline(sp, off) {
    const out = [];
    for (let i = 0; i < sp.length; i++) {
      const a = sp[Math.max(0, i - 1)];
      const b = sp[Math.min(sp.length - 1, i + 1)];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const L = Math.hypot(dx, dy) || 1;
      out.push([sp[i][0] - (dy / L) * off, sp[i][1] + (dx / L) * off]);
    }
    return out;
  }
  // the anchor route: thick self-drawing line with a soft drop shadow and a warm glow
  function routeLine(ll, op, o = {}) {
    if (op <= 0.001 || ll.length < 2) return '';
    const d = pathLL(ll);
    if (!d) return '';
    const w = o.w || 7;
    const col = o.col || C.route;
    const core = o.core || C.routeCore;
    if (o.dash) {
      const off = -((o.t || 0) * 30) % 40;
      return `<g opacity="${f2(op)}" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="${d}" stroke="#000" stroke-opacity="0.35" stroke-width="${f1(w + 5)}" transform="translate(0 4)" filter="url(#blur3)" stroke-dasharray="${f1(w * 2.2)} ${f1(w * 2)}" stroke-dashoffset="${f1(off)}"/>
        <path d="${d}" stroke="${col}" stroke-opacity="0.35" stroke-width="${f1(w * 2.6)}" filter="url(#blur6)"/>
        <path d="${d}" stroke="#2a1600" stroke-opacity="0.6" stroke-width="${f1(w + 3)}" stroke-dasharray="${f1(w * 2.2)} ${f1(w * 2)}" stroke-dashoffset="${f1(off)}"/>
        <path d="${d}" stroke="${o.dashCol || '#ffffff'}" stroke-width="${f1(w)}" stroke-dasharray="${f1(w * 2.2)} ${f1(w * 2)}" stroke-dashoffset="${f1(off)}"/>
      </g>`;
    }
    return `<g opacity="${f2(op)}" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="${d}" stroke="#000" stroke-opacity="0.38" stroke-width="${f1(w + 6)}" transform="translate(0 5)" filter="url(#blur3)"/>
      <path d="${d}" stroke="${col}" stroke-opacity="0.45" stroke-width="${f1(w * 3.2)}" filter="url(#blur6)"/>
      <path d="${d}" stroke="#2a1600" stroke-opacity="0.55" stroke-width="${f1(w + 3)}"/>
      <path d="${d}" stroke="${col}" stroke-width="${f1(w)}"/>
      <path d="${d}" stroke="${core}" stroke-opacity="0.85" stroke-width="${f1(w * 0.36)}"/>
    </g>`;
  }
  // dimension line parallel to a screen polyline, arrowheads both ends, yellow km value
  function dimension(sp, off, txt, op, o = {}) {
    if (op <= 0.001 || sp.length < 2) return '';
    const pts = offsetPolyline(sp, off);
    const a = pts[0];
    const a2 = pts[Math.min(3, pts.length - 1)];
    const b = pts[pts.length - 1];
    const b2 = pts[Math.max(0, pts.length - 4)];
    const angA = (Math.atan2(a[1] - a2[1], a[0] - a2[0]) * 180) / Math.PI;
    const angB = (Math.atan2(b[1] - b2[1], b[0] - b2[0]) * 180) / Math.PI;
    const mid = pts[Math.round((o.at == null ? 0.5 : o.at) * (pts.length - 1))];
    return `<g opacity="${f2(op)}">
      <path d="${dPts(pts)}" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="5"/>
      <path d="${dPts(pts)}" fill="none" stroke="#fff" stroke-width="2.4"/>
      ${arrowHead(a[0], a[1], angA, 0.6)}${arrowHead(b[0], b[1], angB, 0.6)}
      ${callout(txt, mid[0] + (o.dx || 0), mid[1] + (o.dy || 0), { size: o.size || 62, sc: o.sc == null ? 1 : o.sc, op: capClear(mid[1] + (o.dy || 0)) })}
    </g>`;
  }
  // region highlight: glowing outline + faint translucent fill
  function region(rings, op, col = '#ffffff', fillOp = 0.1) {
    if (op <= 0.01 || !rings) return '';
    let d = '';
    for (const r of rings) d += pathLL(r, true);
    if (!d) return '';
    return `<g opacity="${f2(op)}" stroke-linejoin="round">
      <path d="${d}" fill="${col}" fill-opacity="${fillOp}" stroke="${col}" stroke-opacity="0.45" stroke-width="12" filter="url(#blur6)"/>
      <path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="0.92" stroke-width="2.6"/>
    </g>`;
  }
  // screen pose along a lon/lat line at fraction f
  function poseAt(line, f) {
    const a = proj(line.at(Math.max(0, f - 0.004)));
    const b = proj(line.at(Math.min(1, f + 0.004)));
    const c = proj(line.at(f));
    if (!a || !b || !c) return null;
    return { x: c[0], y: c[1], ang: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI, dir: b[0] >= a[0] ? 1 : -1 };
  }

  // ---------------------------------------------------------------- the horse token (side view, chestnut)
  // Ground contact at (0,0); faces +x before the dir flip. o: phase (gallop), run (0 stand .. 1 gallop),
  // duck (0..1), foal (0..1 leggy and small), grey (0..1), boat (0..1 hull under him), lie (0..1 still).
  function legPath(hx, hy, a1, a2, L1, L2) {
    const kx = hx + Math.sin(a1 * D2R) * L1;
    const ky = hy + Math.cos(a1 * D2R) * L1;
    const fx = kx + Math.sin(a2 * D2R) * L2;
    const fy = ky + Math.cos(a2 * D2R) * L2;
    return [`M${f1(hx)} ${f1(hy)} L${f1(kx)} ${f1(ky)} L${f1(fx)} ${f1(fy)}`, fx, fy];
  }
  function horse(x, y, s, o = {}) {
    const op = o.op == null ? 1 : o.op;
    if (op <= 0.01 || s <= 0.01) return '';
    const run = o.run == null ? 1 : o.run;
    const ph = o.phase || 0;
    const duck = o.duck || 0;
    const foal = o.foal || 0;
    const grey = o.grey || 0;
    const dir = o.dir || 1;
    const boat = o.boat || 0;
    const mix = (a, b) => {
      const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
      const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
      return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], grey))).join(',')})`;
    };
    const body = mix(C.chest, '#8C949C');
    const hi = mix(C.chestHi, '#B3BAC1');
    const dk = mix(C.chestDk, '#4E555C');
    const legL = 22 * (1 + 0.35 * foal);
    const bodyRx = 27 * (1 - 0.22 * foal);
    const bodyRy = 12.5 * (1 - 0.18 * foal);
    const bob = run * -3.5 * Math.abs(Math.sin(ph));
    const by = -legL * 1.35 - bodyRy * 0.45 + bob + duck * 14;
    // legs: [hipX, phaseOffset, amplitude]
    const sw = (k, amp) => run * amp * Math.sin(ph + k);
    const legs = [
      [-bodyRx * 0.62, Math.PI, 32, -1],
      [-bodyRx * 0.42, Math.PI + 0.7, 30, -1],
      [bodyRx * 0.55, 0, 36, 1],
      [bodyRx * 0.72, 0.7, 34, 1],
    ];
    let back = '';
    let front = '';
    legs.forEach(([hx, k, amp, side], i) => {
      const a1 = sw(k, amp) - duck * 25 * side;
      const bend = (side > 0 ? -1 : 1) * (run * (18 + 22 * Math.max(0, Math.cos(ph + k))) + duck * 55);
      const [d] = legPath(hx, by + bodyRy * 0.5, a1, a1 + bend, legL * 0.62, legL * 0.62);
      const str = `<path d="${d}" fill="none" stroke="${dk}" stroke-width="${f1(7.5 - 2 * foal)}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="${d}" fill="none" stroke="${i % 2 ? body : hi}" stroke-width="${f1(5 - 1.5 * foal)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      if (i % 2 === 0) back += str;
      else front += str;
    });
    // neck + head: duck lowers the head forward
    const nAng = -40 + duck * 46 + run * 6 * Math.sin(ph * 1 + 1.2);
    const nx = bodyRx * 0.7;
    const ny = by - bodyRy * 0.35;
    const nl = 21 * (1 - 0.05 * foal);
    const hx = nx + Math.cos(nAng * D2R) * nl;
    const hy = ny + Math.sin(nAng * D2R) * nl;
    const headAng = nAng + 8 - duck * 10;
    const tailAng = 160 + run * 18 * Math.sin(ph + 2.2) - duck * 20;
    const tx = -bodyRx * 0.95;
    const ty = by - bodyRy * 0.4;
    const tl = 22;
    const tex = tx + Math.cos(tailAng * D2R) * tl;
    const tey = ty + Math.sin(tailAng * D2R) * tl * 0.8 + 10;
    const hull = boat > 0.01
      ? `<g opacity="${f2(boat)}">
          <path d="M-46 -2 L 50 -2 L 40 15 L -38 15 Z" fill="#1E2C45" stroke="#06101f" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M-44 3 L 47 3" stroke="#E9EEF5" stroke-width="3"/>
          <path d="M-60 16 Q -80 18 -104 12 M-58 22 Q -84 26 -112 22" fill="none" stroke="#E8F4FF" stroke-opacity="0.7" stroke-width="2.4" stroke-linecap="round"/>
        </g>`
      : '';
    const shadow = boat > 0.5 ? '' : `<ellipse cx="0" cy="2" rx="${f1(30 - 4 * foal)}" ry="6" fill="#000" opacity="0.38" filter="url(#blur2)"/>`;
    const lift = boat * -8;
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f2(s * dir)} ${f2(s)})" opacity="${f2(op)}">
      ${shadow}
      <ellipse cx="0" cy="${f1(by)}" rx="${f1(bodyRx + 16)}" ry="${f1(bodyRy + 24)}" fill="#fff" opacity="${f2(0.16 * (1 - grey))}" filter="url(#blur6)"/>
      ${hull}
      <g transform="translate(0 ${f1(lift)})">
        ${back}
        <path d="M${f1(tx)} ${f1(ty)} Q ${f1(tx - 10)} ${f1(ty + 2)} ${f1(tex)} ${f1(tey)}" fill="none" stroke="${dk}" stroke-width="${f1(7 - 2 * foal)}" stroke-linecap="round"/>
        <ellipse cx="0" cy="${f1(by)}" rx="${f1(bodyRx)}" ry="${f1(bodyRy)}" fill="${body}" stroke="${dk}" stroke-width="2.4"/>
        <ellipse cx="${f1(-bodyRx * 0.2)}" cy="${f1(by - bodyRy * 0.45)}" rx="${f1(bodyRx * 0.6)}" ry="${f1(bodyRy * 0.3)}" fill="${hi}" opacity="0.55"/>
        <path d="M${f1(nx - 8)} ${f1(ny + 8)} L${f1(hx - 5)} ${f1(hy - 2)} L${f1(hx + 6)} ${f1(hy + 5)} L${f1(nx + 11)} ${f1(ny + 13)} Z" fill="${body}" stroke="${dk}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M${f1(nx - 5)} ${f1(ny + 2)} L${f1(hx - 4)} ${f1(hy - 3)}" stroke="${dk}" stroke-width="5" stroke-linecap="round"/>
        <g transform="translate(${f1(hx)} ${f1(hy)}) rotate(${f1(headAng)})">
          <path d="M-6 -3 C -7 6 -5 15 -3 20 C -1 24 5 24 6 20 C 7 13 7 4 6 -4 Z" fill="${body}" stroke="${dk}" stroke-width="2.2" stroke-linejoin="round"/>
          <path d="M-5 -2 L -11 -9 L -3 -6 Z" fill="${body}" stroke="${dk}" stroke-width="1.8" stroke-linejoin="round" transform="rotate(${f1(-duck * 40)} -4 -2)"/>
          <path d="M-7 -4 C -10 2 -9 8 -8 12" fill="none" stroke="${dk}" stroke-width="3.5" stroke-linecap="round"/>
          <circle cx="3" cy="2" r="1.7" fill="#140805"/>
          <circle cx="1.5" cy="18" r="1.2" fill="#140805" opacity="0.7"/>
        </g>
        ${front}
      </g>
    </g>`;
  }

  // ---------------------------------------------------------------- gag 1: the warts zoom (cartoon magnifier)
  function wartsBubble(t, fx, fy) {
    const op = win(t, T.warts - 0.08, T.nobody - 0.05, 0.12, 0.3);
    if (op <= 0.01) return '';
    const grow = easeOutBack(prog(t, T.warts - 0.08, 0.32), 2.2);
    const b = boing(t, T.warts + 0.1, 3.2, 4.0);
    const sc = grow * (1 + 0.1 * b);
    const cx = 540;
    const cy = 600;
    const r = 250;
    // the leader cone from the foal's head to the bubble
    const dx = cx - fx;
    const dy = cy - fy;
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L;
    const ny = dx / L;
    const cone = `<path d="M${f1(fx)} ${f1(fy)} L${f1(cx + nx * r * sc)} ${f1(cy + ny * r * sc)} L${f1(cx - nx * r * sc)} ${f1(cy - ny * r * sc)} Z" fill="#ffffff" opacity="${f2(0.18 * op)}"/>`;
    // warts appear one after another across "all over his head"
    const WARTS = [[-62, -58, 13], [-20, -74, 11], [24, -60, 12], [58, -30, 10], [-88, -20, 12], [-40, -8, 14], [6, -26, 9], [36, 6, 11], [-74, 30, 10], [-6, 34, 12], [84, 18, 9], [-118, -50, 10]];
    let warts = '';
    WARTS.forEach(([wx, wy, wr], i) => {
      const p = easeOutBack(prog(t, T.warts + 0.08 + i * 0.07, 0.22), 3.0);
      if (p <= 0) return;
      warts += `<g transform="translate(${wx} ${wy}) scale(${f2(p)})">
        <circle r="${wr}" fill="#C88752" stroke="#6B3416" stroke-width="2.5"/>
        <circle r="${f1(wr * 0.6)}" cx="${f1(wr * 0.25)}" cy="${f1(wr * 0.2)}" fill="#A86634" opacity="0.6"/>
        <circle r="${f1(wr * 0.28)}" cx="${f1(-wr * 0.3)}" cy="${f1(-wr * 0.35)}" fill="#F2C49A"/>
      </g>`;
    });
    const wob = 4 * b;
    const blink = win(t, 13.3, 13.45, 0.04, 0.04);
    const head = `<g transform="rotate(${f1(wob)})">
      <path d="M-200 220 L -150 40 C -150 -60 -90 -120 -10 -116 C 60 -112 110 -70 128 -10 C 142 36 140 78 112 96 C 84 114 40 104 10 92 C -20 82 -50 88 -70 110 L -60 220 Z" fill="${C.chest}" stroke="${C.chestDk}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M-120 -40 C -100 -90 -40 -110 10 -104" fill="none" stroke="${C.chestHi}" stroke-width="12" stroke-linecap="round" opacity="0.6"/>
      <path d="M-112 -92 C -122 -130 -116 -160 -104 -178 C -88 -150 -80 -124 -84 -104 Z" fill="${C.chest}" stroke="${C.chestDk}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M-104 -110 C -108 -134 -106 -150 -102 -160 C -94 -142 -92 -126 -94 -112 Z" fill="#E7A27A"/>
      <path d="M-72 -104 C -76 -140 -66 -166 -50 -182 C -40 -152 -38 -126 -46 -106 Z" fill="${C.chest}" stroke="${C.chestDk}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M-170 0 C -190 -40 -170 -90 -140 -110 C -150 -70 -150 -40 -146 -10 Z M -160 60 C -186 30 -184 0 -168 -20 C -164 10 -160 30 -150 50 Z" fill="${C.chestDk}"/>
      <ellipse cx="96" cy="58" rx="9" ry="14" fill="#3A1608" transform="rotate(-20 96 58)"/>
      <path d="M44 96 C 70 104 96 102 112 92" fill="none" stroke="${C.chestDk}" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="-30" cy="-34" rx="22" ry="${f1(16 * (1 - blink))}" fill="#fff" stroke="${C.chestDk}" stroke-width="4"/>
      <circle cx="-24" cy="-32" r="${f1(9 * (1 - blink))}" fill="#160803"/>
      <path d="M-54 -42 C -40 -50 -16 -50 -4 -44" fill="none" stroke="${C.chestDk}" stroke-width="7" stroke-linecap="round"/>
      ${warts}
    </g>`;
    return `<g opacity="${f2(op)}">
      ${cone}
      <g transform="translate(${cx} ${cy}) scale(${f2(sc)})" filter="url(#ds)">
        <circle r="${r + 14}" fill="#0b1220" opacity="0.5"/>
        <circle r="${r}" fill="url(#bubbleBg)"/>
        <g clip-path="url(#magClip)"><g transform="scale(1.22)">${head}</g></g>
        <circle r="${r}" fill="none" stroke="#ffffff" stroke-width="12"/>
        <circle r="${r + 7}" fill="none" stroke="${C.ink}" stroke-width="3" opacity="0.7"/>
        <path d="M${-r * 0.62} ${-r * 0.56} A ${r * 0.84} ${r * 0.84} 0 0 1 ${r * 0.1} ${-r * 0.84}" fill="none" stroke="#fff" stroke-opacity="0.45" stroke-width="10" stroke-linecap="round"/>
      </g>
    </g>`;
  }

  // ---------------------------------------------------------------- gag 2: the sales catalogue flips over Timaru
  function catalogue(t, ax, ay) {
    const t0 = T.picked;
    const op = win(t, t0, 17.75, 0.2, 0.3);
    if (op <= 0.01) return '';
    const rise = easeOutBack(prog(t, t0, 0.4), 1.6);
    const flip = easeInOut(prog(t, t0 + 0.3, 0.55)); // the right page turns over to the left
    const ring = easeInOut(prog(t, T.catalogue + 0.1, 0.55));
    const away = easeIn(prog(t, 17.35, 0.4));
    const pw = 210;
    const ph = 290;
    const x = ax;
    const y = ay - 250 - 40 * (1 - rise) - 120 * away;
    const rows = (seed, hl) => {
      let s = '';
      for (let i = 0; i < 9; i++) {
        const yy = 70 + i * 23;
        const w1 = 60 + 70 * rand(seed + i);
        s += `<rect x="20" y="${yy}" width="22" height="9" rx="2" fill="#7c6a4c" opacity="0.7"/>
          <rect x="50" y="${yy}" width="${f1(w1)}" height="9" rx="2" fill="#8d7b5b" opacity="0.55"/>
          <rect x="${f1(58 + w1)}" y="${yy}" width="${f1(130 - w1 > 10 ? 130 - w1 : 12)}" height="9" rx="2" fill="#a8977a" opacity="0.4"/>`;
        if (hl === i) {
          // the one entry: a tiny chestnut horse glyph
          s += `<g transform="translate(176 ${yy + 9}) scale(0.32)">${horse(0, 0, 1, { run: 0, foal: 1 })}</g>`;
        }
      }
      return s;
    };
    const header = (txt) => `<rect x="14" y="16" width="${pw - 28}" height="34" rx="4" fill="#2f3b52"/>
      <text x="${pw / 2}" y="40" text-anchor="middle" font-family="${F.mont}" font-weight="900" font-size="17" letter-spacing="2" fill="#F6EBD3">${txt}</text>`;
    // left page (static), right page turning (scaleX 1 -> -1 about the spine)
    const turn = 1 - 2 * flip;
    const showFront = turn > 0;
    const hlRow = 4;
    const rx = 20 + 12 * hlRow + 23 * hlRow;
    const ellipse = ring > 0.001
      ? `<path d="M 200 ${70 + hlRow * 23 + 4} m -175 0 a 175 20 0 1 0 350 0 a 175 20 0 1 0 -350 0" fill="none" stroke="${C.red}" stroke-width="5" stroke-linecap="round"
          stroke-dasharray="1200" stroke-dashoffset="${f1(1200 * (1 - ring))}" transform="translate(${-pw} 0) rotate(-3 ${pw} ${70 + hlRow * 23})"/>`
      : '';
    void rx;
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f2(0.9 + 0.1 * rise)})" opacity="${f2(op * (1 - away))}" filter="url(#ds)">
      <path d="M0 ${ph / 2 + 220 * (1 - away)} L 0 ${ph / 2 + 30}" stroke="#fff" stroke-opacity="0.5" stroke-width="2" stroke-dasharray="4 6"/>
      <g transform="translate(${-pw} ${-ph / 2})">
        <rect x="0" y="0" width="${pw}" height="${ph}" rx="8" fill="url(#paperG)" stroke="#6d5a3a" stroke-width="2"/>
        ${header('SALES')}
        ${rows(11, -1)}
      </g>
      <g transform="translate(0 ${-ph / 2})">
        <rect x="0" y="0" width="${pw}" height="${ph}" rx="8" fill="url(#paperG)" stroke="#6d5a3a" stroke-width="2"/>
        ${flip > 0.5 ? header('CATALOGUE') + rows(31, hlRow) : ''}
        ${flip > 0.5 ? ellipse : ''}
      </g>
      <g transform="scale(${f2(turn)} 1)" opacity="${f2(Math.abs(turn) < 0.04 ? 0 : 1)}">
        <g transform="translate(0 ${-ph / 2})">
          <rect x="0" y="0" width="${pw}" height="${ph}" rx="8" fill="${showFront ? 'url(#paperG)' : '#efe3c6'}" stroke="#6d5a3a" stroke-width="2"/>
          ${showFront ? header('CATALOGUE') + rows(21, -1) : `<g transform="translate(${pw} 0) scale(-1 1)">${header('SALES') + rows(11, -1)}</g>`}
          <rect x="0" y="0" width="${pw}" height="${ph}" rx="8" fill="#000" opacity="${f2(0.25 * (1 - Math.abs(turn)))}"/>
        </g>
      </g>
      <rect x="-3" y="${-ph / 2}" width="6" height="${ph}" fill="#6d5a3a" opacity="0.6"/>
    </g>`;
  }

  // ---------------------------------------------------------------- racecourse inset (Flemington, Agua Caliente)
  // A zoom bubble that grows out of the course pin: oval track, rails, a field of runners, the crowd on the straight.
  const CAMEL_SHAPE = [
    [0, 52], [6, 40], [10, 30], [16, 24], [24, 22], [30, 14], [36, 6], [44, 2], [52, 6], [58, 14], [64, 10], [70, 4],
    [78, 6], [82, 14], [84, 22], [86, 30], [92, 30], [98, 26], [104, 24], [106, 30], [100, 36], [92, 40], [86, 44],
    [82, 52], [80, 60], [82, 76], [80, 78], [76, 62], [70, 58], [66, 76], [62, 78], [62, 58], [40, 58], [36, 76],
    [32, 78], [32, 58], [24, 56], [22, 76], [18, 78], [18, 56], [10, 56], [4, 58],
  ];
  function racecourse(t, o) {
    const { ax, ay, t0, t1, tRun, tWin, camel, gold } = o;
    const op = win(t, t0, t1, 0.3, 0.35);
    if (op <= 0.01) return '';
    const grow = easeOutBack(prog(t, t0, 0.5), 1.4) * (1 - 0.15 * easeIn(prog(t, t1 - 0.35, 0.35)));
    const cx = 540;
    const cy = o.cy || 640;
    const bw = 860;
    const bh = 520;
    // the oval (track centreline)
    const ox = 0;
    const oy = -10;
    const orx = 300;
    const ory = 150;
    const trackPt = (u) => {
      // u: 0 at the winning post (bottom straight, right of centre), increasing anticlockwise around
      const a = Math.PI / 2 - 0.35 - u * Math.PI * 2;
      return [ox + Math.cos(a) * orx, oy + Math.sin(a) * ory];
    };
    // his position: one lap ending at the post at tWin, then he coasts on
    const lapU = (tt, lead) => {
      if (tt < tRun) return 0.04;
      const u = easeInOut(prog(tt, tRun, tWin - tRun)) * 0.96 + 0.04;
      return u + lead + 0.05 * Math.max(0, tt - tWin);
    };
    const u = lapU(t, 0);
    let field = '';
    for (let k = 0; k < 6; k++) {
      const lag = 0.035 + k * 0.022 + 0.01 * Math.sin(t * 2 + k);
      const uk = Math.max(0.0, lapU(t, 0) - lag * cl01((t - tRun) / 0.8));
      const [px, py] = trackPt(uk - (t < tRun ? 0.02 + k * 0.012 : 0));
      const off = (k % 3 - 1) * 9;
      field += horse(px, py + off, 0.62, { phase: t * 16 + k, run: t > tRun ? 1 : 0.2, grey: 0.75, dir: px < trackPt(uk + 0.01)[0] ? 1 : -1 });
    }
    const [hxp, hyp] = trackPt(u);
    const [hx2] = trackPt(u + 0.01);
    void hx2;
    const winP = win(t, tWin, tWin + 1.3, 0.05, 0.5);
    // crowd: dense dots on the stands below the home straight + along the rail
    let crowd = '';
    const pal = ['#2b2b33', '#4a4038', '#6b5a48', '#d9cdb5', '#8c2f2f', '#2f4a6b', '#3f3f3f', '#1d2633', '#b8a07a', '#5b6b4a'];
    let idx = 0;
    for (let row = 0; row < 5; row++) {
      for (let i = 0; i < 46; i++) {
        const x = -360 + i * 15.6 + (row % 2) * 7 + (rand(idx * 3.1) - 0.5) * 5;
        const y = ory + oy + 46 + row * 13 + (rand(idx * 7.7) - 0.5) * 4;
        const cheer = winP * 4 * Math.max(0, Math.sin(t * 9 + idx));
        crowd += `<circle cx="${f1(x)}" cy="${f1(y - cheer)}" r="${f1(4.6 + rand(idx) * 1.2)}" fill="${pal[Math.floor(rand(idx * 5.3) * pal.length)]}"/>`;
        idx++;
      }
    }
    // the series camel: tiny, unlabelled, standing in the crowd (Flemington only)
    let camelSvg = '';
    if (camel) {
      const ccx = 168;
      const ccy = ory + oy + 70;
      const pts = CAMEL_SHAPE.map(([a, b]) => `${f1(ccx + (a - 53) * 0.27)},${f1(ccy + (b - 40) * 0.27)}`).join(' ');
      camelSvg = `<polygon points="${pts}" fill="#C9A26B" stroke="#5a4326" stroke-width="1.3" stroke-linejoin="round"/>`;
    }
    const border = gold ? C.gold : '#ffffff';
    const post = trackPt(0);
    const cl = Math.min(1, prog(t, t0, 0.4));
    return `<g opacity="${f2(op)}">
      <path d="M${f1(ax)} ${f1(ay)} L${f1(cx - 60 * grow)} ${f1(cy + (bh / 2) * grow)} L${f1(cx + 60 * grow)} ${f1(cy + (bh / 2) * grow)} Z" fill="#fff" opacity="${f2(0.16 * cl)}"/>
      <g transform="translate(${cx} ${cy}) scale(${f2(grow)})" filter="url(#ds)">
        <clipPath id="rcClip${gold ? 'g' : 'f'}"><rect x="${-bw / 2}" y="${-bh / 2}" width="${bw}" height="${bh}" rx="40"/></clipPath>
        <g clip-path="url(#rcClip${gold ? 'g' : 'f'})">
          <rect x="${-bw / 2}" y="${-bh / 2}" width="${bw}" height="${bh}" fill="url(#grassG)"/>
          ${Array.from({ length: 12 }, (_, i) => `<rect x="${-bw / 2 + i * 72}" y="${-bh / 2}" width="36" height="${bh}" fill="#fff" opacity="0.035"/>`).join('')}
          <ellipse cx="${ox}" cy="${oy}" rx="${orx + 24}" ry="${ory + 24}" fill="none" stroke="#B88A5A" stroke-width="44"/>
          <ellipse cx="${ox}" cy="${oy}" rx="${orx + 24}" ry="${ory + 24}" fill="none" stroke="#9C7148" stroke-width="44" stroke-dasharray="3 9" opacity="0.4"/>
          <ellipse cx="${ox}" cy="${oy}" rx="${orx + 47}" ry="${ory + 47}" fill="none" stroke="#fff" stroke-width="3.5"/>
          <ellipse cx="${ox}" cy="${oy}" rx="${orx + 1}" ry="${ory + 1}" fill="none" stroke="#fff" stroke-width="3.5"/>
          <ellipse cx="${ox}" cy="${oy}" rx="${orx - 40}" ry="${ory - 40}" fill="#6FAE52" opacity="0.5"/>
          <rect x="-400" y="${ory + oy + 34}" width="800" height="90" fill="#2a2f3a"/>
          ${crowd}
          ${camelSvg}
          <rect x="-380" y="${ory + oy + 110}" width="760" height="30" fill="#e8e1d2"/>
          <path d="M-380 ${ory + oy + 110} L 380 ${ory + oy + 110}" stroke="#7a2d2d" stroke-width="6"/>
          <g transform="translate(${f1(post[0] + 10)} ${f1(post[1] + 10)})">
            <rect x="-3" y="-60" width="6" height="64" fill="#fff" stroke="#111" stroke-width="1.5"/>
            <circle cx="0" cy="-62" r="9" fill="${C.red}" stroke="#fff" stroke-width="2.5"/>
          </g>
          ${field}
          <circle cx="${f1(hxp)}" cy="${f1(hyp - 22)}" r="${f1(34 + 40 * winP)}" fill="url(#warm)" opacity="${f2(0.7 + 0.3 * winP)}"/>
          ${horse(hxp, hyp, 0.95, { phase: t * 17, run: t > tRun - 0.1 ? 1 : 0.2, dir: hx2 >= hxp ? 1 : -1 })}
          ${winP > 0.01 ? Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const rr = 40 + 120 * easeOut(prog(t, tWin, 0.6));
            return `<path d="M${f1(post[0] + Math.cos(a) * rr * 0.5)} ${f1(post[1] - 30 + Math.sin(a) * rr * 0.5)} L${f1(post[0] + Math.cos(a) * rr)} ${f1(post[1] - 30 + Math.sin(a) * rr)}" stroke="${C.goldHi}" stroke-width="5" stroke-linecap="round" opacity="${f2(winP * (1 - prog(t, tWin + 0.2, 0.8)))}"/>`;
          }).join('') : ''}
        </g>
        <rect x="${-bw / 2}" y="${-bh / 2}" width="${bw}" height="${bh}" rx="40" fill="none" stroke="${border}" stroke-width="10"/>
        <rect x="${-bw / 2 - 6}" y="${-bh / 2 - 6}" width="${bw + 12}" height="${bh + 12}" rx="46" fill="none" stroke="${C.ink}" stroke-width="3" opacity="0.7"/>
      </g>
    </g>`;
  }

  // ---------------------------------------------------------------- glyphs for the three cities
  function glyph(kind, x, y, s, col) {
    if (kind === 'HIDE') {
      return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f2(s)})"><path d="M-14 -8 C -16 -14 -8 -16 -4 -12 L 4 -12 C 8 -16 16 -14 14 -8 C 18 0 14 12 8 14 L 0 18 L -8 14 C -14 12 -18 0 -14 -8 Z" fill="${col}" stroke="#2a1206" stroke-width="2"/></g>`;
    }
    if (kind === 'SKELETON') {
      return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f2(s)}) rotate(-35)"><path d="M-12 -3 L 12 -3 L 12 3 L -12 3 Z" fill="#F4F1E8" stroke="#3a3a3a" stroke-width="1.6"/>
        <circle cx="-13" cy="-4" r="5" fill="#F4F1E8" stroke="#3a3a3a" stroke-width="1.6"/><circle cx="-13" cy="4" r="5" fill="#F4F1E8" stroke="#3a3a3a" stroke-width="1.6"/>
        <circle cx="13" cy="-4" r="5" fill="#F4F1E8" stroke="#3a3a3a" stroke-width="1.6"/><circle cx="13" cy="4" r="5" fill="#F4F1E8" stroke="#3a3a3a" stroke-width="1.6"/>
        <rect x="-11" y="-2.6" width="22" height="5.2" fill="#F4F1E8"/></g>`;
    }
    return heartPath(x, y, s, col);
  }
  function heartPath(x, y, s, col) {
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f2(s)})"><path d="M0 14 C -18 2 -20 -12 -10 -16 C -4 -18 0 -14 0 -9 C 0 -14 4 -18 10 -16 C 20 -12 18 2 0 14 Z" fill="${col}" stroke="#5a0d10" stroke-width="2"/>
      <path d="M-11 -9 C -10 -13 -6 -13 -4 -11" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="2.4" stroke-linecap="round"/></g>`;
  }
  // a city pin + name + part tag (the split)
  function cityTag(t, ll, name, part, tName, tPart, col, side, op, below = false) {
    const p = proj(ll);
    if (!p || op <= 0.01 || p[0] < -40 || p[0] > W + 40 || p[1] < -40 || p[1] > H + 40) return { back: '', front: '' };
    const k = zs(CAM.z);
    let back = `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${f1(70 * k)}" fill="url(${part === 'HEART' ? '#redGlow' : '#warm'})" opacity="${f2(0.75 * op * win(t, tPart, 99, 0.3, 0.1))}"/>`;
    back += ringPulse(p[0], p[1], t, tPart, 14 * k, 60 * k, col, 1.8, 2, 0.55, op * win(t, tPart, 99, 0.2, 0.1));
    let front = pin(p[0], p[1], k, Math.min(tName, tPart) - 0.3, t, col, op);
    const pp = popIn(t, tPart, 0.4);
    if (pp > 0) {
      const ty = below ? p[1] + 100 * k : p[1] - 78 * k;
      const w = part.length * 25 + 96;
      const anchorX = clamp(p[0] - w / 2 + side * 20, 24, W - 24 - w);
      front += `<g transform="translate(${f1(anchorX)} ${f1(ty)}) scale(${f2(pp)})" opacity="${f2(op * capClear(ty))}" filter="url(#ds)">
        <rect x="0" y="-30" width="${w}" height="60" rx="14" fill="url(#chipG)" stroke="${col}" stroke-width="3.5"/>
        ${glyph(part, 34, 0, 1.15, col)}
        <text x="62" y="12" font-family="${F.mont}" font-weight="900" font-size="34" letter-spacing="3" fill="#fff">${part}</text>
      </g>`;
    }
    const pn = popIn(t, tName, 0.35);
    if (pn > 0) front += label(name, p[0], p[1] + 44 * k, { size: 30 * k, op: op * capClear(p[1] + 44 * k), sc: pn, ls: 4 });
    return { back, front };
  }
  // tug-of-war rope across the Tasman: Wellington <-> a knot off the NSW coast, which splits to Melbourne + Canberra
  function rope(t, op) {
    if (op <= 0.01) return '';
    const pw = proj(P.wlg);
    const pk = proj(KNOT);
    const pm = proj(P.melb);
    const pc = proj(P.canb);
    if (!pw || !pk || !pm || !pc) return '';
    const stretch = easeOut(prog(t, 59.65, 0.9));
    // the tug: the centre marker swings toward one side, then the other, and never settles
    const tug = 0.5 + 0.06 * Math.sin((t - 59.6) * 2.3) + 0.03 * Math.sin((t - 59.6) * 5.1);
    const ropePts = (a, b, sag, n = 24) => {
      const out = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const x = lerp(a[0], b[0], u);
        const y = lerp(a[1], b[1], u) + Math.sin(u * Math.PI) * sag;
        out.push([x, y]);
      }
      return out;
    };
    const strand = (pts, w) => {
      const d = dPts(pts);
      return `<path d="${d}" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="${w + 5}" stroke-linecap="round" transform="translate(0 4)" filter="url(#blur2)"/>
        <path d="${d}" fill="none" stroke="#7a5326" stroke-width="${w + 2}" stroke-linecap="round"/>
        <path d="${d}" fill="none" stroke="#D9AE6E" stroke-width="${w}" stroke-linecap="round"/>
        <path d="${d}" fill="none" stroke="#8a5f2c" stroke-width="${w * 0.55}" stroke-dasharray="${f1(w * 0.9)} ${f1(w * 0.9)}" stroke-dashoffset="${f1(t * 6)}" stroke-linecap="butt"/>`;
    };
    const sag = 18 * (1 - 0.6 * Math.abs(Math.sin((t - 59.6) * 2.3)));
    // draw from Wellington toward the knot as it stretches
    const end = [lerp(pw[0], pk[0], stretch), lerp(pw[1], pk[1], stretch)];
    const main = ropePts(pw, end, sag * stretch);
    let s = `<g opacity="${f2(op)}">${strand(main, 11)}`;
    if (stretch > 0.98) {
      s += strand(ropePts(pk, pm, 8), 8) + strand(ropePts(pk, pc, 6), 8);
      const mx = lerp(pw[0], pk[0], tug);
      const my = lerp(pw[1], pk[1], tug) + Math.sin(tug * Math.PI) * sag;
      s += `<g transform="translate(${f1(mx)} ${f1(my)}) rotate(${f1(6 * Math.sin((t - 59.6) * 2.3))})" filter="url(#dsS)">
        <path d="M0 0 L 0 -34" stroke="#f1f1f1" stroke-width="3"/><path d="M0 -34 L 26 -26 L 0 -18 Z" fill="${C.red}" stroke="#5a0d10" stroke-width="1.6"/>
        <circle r="7" fill="${C.red}" stroke="#fff" stroke-width="2.5"/></g>`;
      s += `<circle cx="${f1(pk[0])}" cy="${f1(pk[1])}" r="7" fill="#D9AE6E" stroke="#7a5326" stroke-width="3"/>`;
    }
    return s + '</g>';
  }

  // ---------------------------------------------------------------- top-of-frame pieces
  function hookCard(t) {
    let sc = 1;
    let op = 1;
    let dy = 0;
    if (t < 10) {
      const p = prog(t, T.hookOut, 0.4);
      op = 1 - easeIn(p);
      dy = -80 * easeIn(p);
      sc = 1 + 0.05 * p;
    } else {
      const p = prog(t, T.reslam, DUR - T.reslam);
      if (p <= 0) return '';
      sc = lerp(1.6, 1, easeOutBack(p, 1.3));
      op = cl01(p * 3);
    }
    if (op <= 0.001) return '';
    return `<g transform="translate(540 ${f1(520 + dy)}) rotate(-2.5) scale(${f2(sc * 0.92)})" opacity="${f2(op)}">
      <g filter="url(#ds)">
        <rect x="-450" y="-150" width="900" height="270" rx="26" fill="rgba(7,12,24,0.82)" stroke="${C.gold}" stroke-width="5"/>
        <rect x="-428" y="-128" width="856" height="226" rx="16" fill="none" stroke="#ffe7b0" stroke-opacity="0.22" stroke-width="2"/>
      </g>
      <text x="0" y="52" text-anchor="middle" font-family="${F.anton}" font-size="170" letter-spacing="4" fill="${C.gold}" stroke="#000" stroke-width="10" paint-order="stroke">THREE CITIES</text>
    </g>`;
  }
  function bigYear(t, txt, t0, t1, y = 470) {
    if (t < t0 - 0.05 || t > t1) return '';
    const p = popIn(t, t0, 0.4);
    const op = 1 - smooth(t1 - 0.45, t1, t);
    const yy = y - 30 * prog(t, t0, 2);
    return `<g transform="translate(540 ${f1(yy)}) scale(${f2(p)})" opacity="${f2(op)}">
      ${[8, 6, 4, 2].map((k) => `<text x="${k * 0.6}" y="${k}" text-anchor="middle" font-family="${F.anton}" font-size="230" letter-spacing="6" fill="#7a4a06">${txt}</text>`).join('')}
      <text x="0" y="0" text-anchor="middle" font-family="${F.anton}" font-size="230" letter-spacing="6" fill="${C.gold}" stroke="#2b1500" stroke-width="5" paint-order="stroke">${txt}</text></g>`;
  }
  function nameCard(t, key, name, t0, t1, col = C.gold, side = 'L', y = 290) {
    const op = win(t, t0, t1, 0.3, 0.35);
    if (op <= 0.01) return '';
    const slide = (1 - easeOut(prog(t, t0, 0.45))) * (side === 'L' ? -340 : 340);
    const x = (side === 'L' ? 56 : W - 56 - 260) + slide;
    return `<g transform="translate(${f1(x)} ${y})" opacity="${f2(op)}" filter="url(#ds)">
      <rect x="-10" y="-10" width="280" height="262" rx="22" fill="url(#chipG)" stroke="${col}" stroke-width="3.5"/>
      <g transform="translate(10 8)"><g clip-path="url(#cardClip)"><image href="/ep/assets/card_${key}.jpg" x="0" y="0" width="240" height="180"/></g>
        <rect x="0" y="0" width="240" height="180" rx="14" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="2"/></g>
      <text x="130" y="226" text-anchor="middle" font-family="${F.mont}" font-weight="900" font-size="${name.length > 14 ? 19 : name.length > 9 ? 26 : 32}" letter-spacing="3" fill="#fff">${esc(name)}</text>
      <rect x="50" y="238" width="160" height="5" rx="2.5" fill="${col}"/>
    </g>`;
  }
  // 37 wins out of 51 starts: a grid of 51 that fills as the line is spoken
  function tally(t) {
    const op = win(t, 22.95, 28.1, 0.3, 0.45);
    if (op <= 0.01) return '';
    const n = Math.round(37 * easeInOut(prog(t, 23.2, T.tally37 + 0.4 - 23.2)));
    const show51 = popIn(t, T.tally51 - 0.1, 0.35);
    const cols = 17;
    let cells = '';
    for (let i = 0; i < 51; i++) {
      const cx = -cols * 15 + (i % cols) * 30 + 15;
      const cy = 18 + Math.floor(i / cols) * 30;
      const on = i < n;
      const fresh = on && i === n - 1 ? 1.25 : 1;
      cells += `<rect x="${f1(cx - 11 * fresh)}" y="${f1(cy - 11 * fresh)}" width="${f1(22 * fresh)}" height="${f1(22 * fresh)}" rx="5" fill="${on ? C.gold : 'rgba(255,255,255,0.10)'}" stroke="${on ? '#7a4a06' : 'rgba(255,255,255,0.35)'}" stroke-width="2"/>`;
    }
    const sc = popIn(t, 22.95, 0.4) || 0;
    return `<g transform="translate(540 300) scale(${f2(sc)})" opacity="${f2(op)}" filter="url(#ds)">
      <rect x="-300" y="-110" width="600" height="230" rx="30" fill="url(#chipG)" stroke="${C.gold}" stroke-width="3.5"/>
      <text x="${show51 > 0 ? -40 : 0}" y="-26" text-anchor="middle" font-family="${F.anton}" font-size="104" letter-spacing="2" fill="${C.gold}" stroke="#000" stroke-width="5" paint-order="stroke">${n}</text>
      ${show51 > 0 ? `<g transform="translate(60 -26) scale(${f2(show51)})"><text x="0" y="0" text-anchor="middle" font-family="${F.anton}" font-size="104" letter-spacing="2" fill="#fff" stroke="#000" stroke-width="5" paint-order="stroke">/51</text></g>` : ''}
      ${cells}
    </g>`;
  }
  // the near miss: a streak whooshes just over his head; he ducks
  function nearMiss(t, hx, hy, k) {
    const a = T.shoot - 0.12;
    const p = prog(t, a, 0.32);
    if (p <= 0 || p >= 1) return '';
    const x0 = -80;
    const x1 = 1160;
    const x = lerp(x0, x1, easeIn(p) * 0.4 + p * 0.6);
    const y = hy - 62 * k + (x - hx) * 0.06;
    return `<g>
      <path d="M${f1(x - 260)} ${f1(y + 10)} L${f1(x)} ${f1(y)}" stroke="#fff" stroke-opacity="0.55" stroke-width="6" stroke-linecap="round" filter="url(#blur3)"/>
      <path d="M${f1(x - 160)} ${f1(y + 6)} L${f1(x)} ${f1(y)}" stroke="#FFE9A8" stroke-width="4" stroke-linecap="round"/>
      <circle cx="${f1(x)}" cy="${f1(y)}" r="5" fill="#fff"/>
    </g>`;
  }

  // ---------------------------------------------------------------- overlays per frame
  function overlays(t) {
    let back = '';
    let mid = '';
    let front = '';
    const z = CAM.z;
    const zk = zs(z);
    const opening = t < 7.2 || t > T.because;
    const mmOp = win(t, 68.9, T.because + 0.4, 0.6, 0.45); // master map

    // ---- region highlights
    back += region(GEO.nz, Math.max(win(t, 2.35, 3.9, 0.3, 0.45), win(t, 55.4, 57.6, 0.35, 0.6), 0.5 * win(t, T.nz2, 13.0, 0.3, 0.5)), '#ffffff', 0.08);
    back += region(GEO.aus, Math.max(win(t, T.australia - 0.15, 19.3, 0.3, 0.5), win(t, 55.4, 57.6, 0.35, 0.6)), C.gold, 0.06);
    back += region(GEO.mex, win(t, 37.9, 40.2, 0.35, 0.6), '#ffffff', 0.08);
    back += region(GEO.cal, win(t, 44.2, 55.0, 0.35, 0.6), '#ffffff', 0.1);

    // ---- country / sea labels on their words
    const lab = (txt, ll, t0, t1, o = {}) => {
      const p = proj(ll);
      const op = win(t, t0, t1, 0.25, 0.35);
      if (!p || op <= 0.01) return;
      front += label(txt, p[0] + (o.dx || 0), p[1] + (o.dy || 0), { size: 50, ls: 10, op: op * capClear(p[1]), sc: popIn(t, t0), ...o });
    };
    lab('NEW ZEALAND', [174.6, -40.2], 2.45, 3.9, { size: 40, dx: 150, dy: -150 });
    lab('MEXICO', P.agua, 3.3, 3.9, { size: 36, dx: -26, dy: 12, anchor: 'end' });
    lab('NEW ZEALAND', [172.2, -42.1], T.nz2 + 0.05, 12.6, { size: 34, ls: 8 });
    lab('AUSTRALIA', [146.0, -31.5], T.australia, 19.2, { size: 46 });
    lab('PACIFIC OCEAN', [214, 25], T.pacific - 0.1, 38.4, { size: 40, ls: 10, italic: true, fw: 800, fill: '#cfe6ff' });
    lab('MEXICO', [249.0, 28.0], T.mexico, 40.3, { size: 46 });
    lab('CALIFORNIA', P.calLab, T.california - 0.05, 55.0, { size: 46, ls: 8 });
    lab('AUSTRALIA', [140.5, -27.5], T.both + 0.15, 57.5, { size: 44 });
    lab('NEW ZEALAND', [178.5, -38.0], T.both + 0.3, 57.5, { size: 38 });

    // ---- the opening flash-forward: Timaru -> Sydney (solid) then the dotted Pacific to Mexico
    {
      const g = t < 7.2 ? 1 - smooth(6.7, 7.2, t) : smooth(T.because + 0.2, T.reslam, t);
      if (g > 0.01) {
        const tt = t < 7.2 ? t : t - DUR; // the loop end replays the frame-1 state
        const ftas = t < 7.2 ? lerp(0.025, 1, easeInOut(prog(t, 0, 1.75))) : 0.025;
        const fpac = t < 7.2 ? easeInOut(prog(t, 1.55, 1.75)) : 0;
        const died = t < 7.2 ? win(t, T.died, 5.3, 0.3, 0.6) : 0;
        back += routeLine(TAS.slice(0, ftas), g * (1 - 0.4 * died), { w: 7 });
        if (fpac > 0.001) {
          const sl = PAC.slice(0, fpac);
          back += routeLine(sl, g * (1 - 0.4 * died), { w: 5.5, dash: true, t });
          const sp = screenPts(sl);
          if (sp.length > 3 && fpac < 0.995) front += arrowHead(sp[sp.length - 1][0], sp[sp.length - 1][1], angOf(sp), 1.0, '#fff');
        }
        const mx = proj(P.agua);
        if (mx && t < 7.2) {
          mid += pin(mx[0], mx[1], 0.9, 3.25, t, C.gold, g * win(t, 3.2, 4.6, 0.1, 0.5));
        }
        const ps = proj(P.sydney);
        if (ps) mid += `<circle cx="${f1(ps[0])}" cy="${f1(ps[1])}" r="7" fill="#fff" stroke="${C.ink}" stroke-width="3" opacity="${f2(g * smooth(1.5, 1.8, t < 7.2 ? t : 0))}"/>`;
        const pt = proj(P.timaru);
        if (pt) mid += `<circle cx="${f1(pt[0])}" cy="${f1(pt[1])}" r="7" fill="#fff" stroke="${C.ink}" stroke-width="3" opacity="${f2(g)}"/>`;
        // the horse gallops across the water (frame 1 he's just leaving Timaru)
        const hp = poseAt(TAS, Math.min(ftas, 0.999));
        if (hp) {
          front += horse(hp.x, hp.y + 4, 1.45 * zk, { phase: tt * 15, run: t < 7.2 ? 1 - smooth(1.7, 2.1, t) * 0.8 : 1, dir: hp.dir, op: g * (1 - 0.5 * died), grey: 0.6 * died });
        }
        // ~2,100 km across the Tasman (great-circle Timaru-Sydney, measured on this map)
        const dimOp = t < 7.2 ? win(t, 0.9, 2.2, 0.3, 0.4) : 0;
        if (dimOp > 0.01) front += dimension(screenPts(TAS.slice(0, 1)), -46, `~${(Math.round(TAS.km / 100) * 100).toLocaleString('en-AU')} KM`, dimOp, { size: 50, dy: -20 });
      }
    }

    // ---- gag 4 (opening): "three cities split him up" + the full split later
    {
      const openOp = win(t, T.three, 7.0, 0.15, 0.5);
      const splitOp = win(t, 56.8, 69.4, 0.3, 0.6);
      const op = Math.max(openOp, splitOp);
      if (op > 0.01) {
        const later = t > 20;
        const tm = later ? [T.melb, T.hide] : [T.three + 0.05, T.three + 0.05];
        const tw = later ? [T.wlg, T.skeleton] : [T.three + 0.25, T.three + 0.25];
        const tc = later ? [T.canb, T.heart] : [T.three + 0.45, T.three + 0.45];
        const a = cityTag(t, P.melb, 'MELBOURNE', 'HIDE', tm[0], tm[1], C.gold, -1, op, true);
        const b = cityTag(t, P.wlg, 'WELLINGTON', 'SKELETON', tw[0], tw[1], '#F4F1E8', 1, op);
        const c = cityTag(t, P.canb, 'CANBERRA', 'HEART', tc[0], tc[1], C.heart, 1, op);
        if (later) back += rope(t, splitOp);
        else back += rope(t + (59.65 - 5.95), openOp);
        back += a.back + b.back + c.back;
        front += a.front + b.front + c.front;
      }
      // almost twice the size of a normal horse's: big heart beside a normal one
      const hz = win(t, T.twice - 0.2, 65.9, 0.3, 0.5);
      const pc = proj(P.canb);
      if (hz > 0.01 && pc) {
        const g2 = easeOutBack(prog(t, T.twice + 0.15, 0.6), 1.8);
        const beat = 1 + 0.06 * Math.max(0, Math.sin(t * 7.5)) ** 4;
        const bx = pc[0] + 150;
        const by = pc[1] - 180;
        if (capClear(by) > 0) {
          front += `<g opacity="${f2(hz)}" filter="url(#ds)">
            <path d="M${f1(pc[0])} ${f1(pc[1] - 10)} L${f1(bx - 40)} ${f1(by + 60)}" stroke="#fff" stroke-opacity="0.6" stroke-width="2"/>
            ${heartPath(bx - 70, by + 18, 1.6, '#C9A0A2')}
            ${heartPath(bx + 40, by, (1.6 + 1.5 * g2) * beat, C.heart)}
            ${callout('~2×', bx + 40, by - 70 - 20 * g2, { size: 56, op: cl01(g2), sc: cl01(g2) })}
          </g>`;
        }
      }
    }

    // ---- Timaru: the foal, the warts, the catalogue
    const ptm = proj(P.timaru);
    const foalOp = win(t, T.foal - 0.1, 18.0, 0.2, 0.3);
    if (ptm && foalOp > 0.01 && t < 18.2) {
      const k = clamp(Math.pow(z / 3, 0.25), 0.75, 1.45);
      mid += ringPulse(ptm[0], ptm[1] + 4, t, T.foal, 18 * k, 70 * k, '#fff', 1.8, 2, 0.5, foalOp * (1 - smooth(T.nobody, T.nobody + 0.3, t)));
      mid += pin(ptm[0] - 40 * k, ptm[1] + 6, k * 0.85, T.foal - 0.2, t, C.gold, foalOp);
      const fs = 1.9 * k * easeOutBack(prog(t, T.foal, 0.45), 2.2);
      const wb = boing(t, T.warts + 0.1, 3.2, 4.0);
      // the foal on the map (still, grazing pose); the boing jiggles him too
      front += horse(ptm[0] + 6, ptm[1] + 8, fs * (1 + 0.08 * wb), { run: 0, foal: 1, op: foalOp, phase: 0 });
      const nl = popIn(t, T.near, 0.35);
      if (nl > 0) front += label('NEAR TIMARU', ptm[0], ptm[1] + 62 * k, { size: 36 * k, op: foalOp * capClear(ptm[1] + 62 * k) * (1 - smooth(17.4, 17.8, t)), sc: nl, ls: 4 });
      // gag 1: warts
      front += wartsBubble(t, ptm[0] + 30 * k, ptm[1] - 50 * k);
      // gag 2: the sales catalogue
      front += catalogue(t, ptm[0], ptm[1]);
    }

    // ---- shipped to Australia: across the Tasman on a boat, then Sydney; named Phar Lap
    {
      const shipOp = win(t, T.shipped - 0.1, 22.9, 0.25, 0.3);
      if (shipOp > 0.01) {
        const fr = easeInOut(prog(t, T.shipped, 18.45 - T.shipped));
        back += routeLine(TAS.slice(0, fr), shipOp, { w: 7 });
        const dOp = win(t, 17.95, 19.2, 0.3, 0.4);
        if (dOp > 0.01) front += dimension(screenPts(TAS.slice(0, 1)), -50, `~${(Math.round(TAS.km / 100) * 100).toLocaleString('en-AU')} KM`, dOp * smooth(0.95, 1, fr + 0.06), { size: 54, dy: -20 });
        const hp = poseAt(TAS, Math.min(fr, 0.999));
        const atSyd = smooth(18.35, 18.6, t);
        const ps = proj(P.sydney);
        if (ps) mid += pin(ps[0], ps[1], zk, 18.35, t, C.gold, shipOp);
        if (ps && popIn(t, 18.42) > 0) front += label('SYDNEY', ps[0] - 34 * zk, ps[1] - 30 * zk, { size: 32 * zk, op: shipOp * capClear(ps[1] - 30) * (1 - smooth(T.pharlap - 0.3, T.pharlap, t)), sc: popIn(t, 18.42), anchor: 'end', ls: 4 });
        if (hp && ps) {
          const x = lerp(hp.x, ps[0] + 26 * zk, atSyd);
          const y = lerp(hp.y, ps[1] + 8, atSyd);
          const grown = smooth(18.5, 19.2, t);
          const s = (1.3 + 0.5 * grown) * zk;
          front += horse(x, y, s, { phase: t * 15, run: atSyd > 0.5 ? 0.15 * (1 - grown) : 0.15, boat: 1 - atSyd, foal: 1 - grown, dir: atSyd > 0.5 ? 1 : hp.dir, op: shipOp });
          // "Phar Lap" — and lightning
          const pl = popIn(t, T.pharlap - 0.05, 0.4);
          if (pl > 0) {
            const ly = y + 60 * zk;
            front += label('PHAR LAP', x, ly, { size: 54, ls: 6, fill: C.goldHi, op: shipOp * capClear(ly), sc: pl });
            const zap = win(t, T.lightning - 0.08, T.lightning + 0.5, 0.05, 0.35);
            if (zap > 0.01) {
              front += `<g transform="translate(${f1(x + 150)} ${f1(ly - 40)}) scale(1.4)" opacity="${f2(zap)}" filter="url(#ds)">
                <path d="M6 -40 L -14 4 L 0 4 L -8 40 L 18 -8 L 4 -8 L 14 -40 Z" fill="${C.goldHi}" stroke="#7a4a06" stroke-width="2.5" stroke-linejoin="round"/></g>
                <rect x="0" y="0" width="${W}" height="${H}" fill="#fff8d6" opacity="${f2(0.22 * win(t, T.lightning - 0.05, T.lightning + 0.15, 0.03, 0.1))}"/>`;
            }
            const lt = popIn(t, T.lightning, 0.35);
            if (lt > 0) front += chip('“LIGHTNING”', x, ly + 70, { size: 30, sc: lt, op: shipOp * capClear(ly + 70) });
          }
        }
      }
    }

    // ---- winning: he gallops Sydney -> Melbourne leaving a gold trail; the tally fills
    {
      const wOp = win(t, 22.9, 31.0, 0.3, 0.3);
      if (wOp > 0.01) {
        const fw = easeInOut(prog(t, 23.0, 28.6 - 23.0));
        back += routeLine(WIN.slice(0, fw), wOp * 0.9 * (1 - smooth(29.4, 30.6, t)), { w: 5 });
        const hp = poseAt(WIN, Math.min(fw, 0.999));
        if (hp && t < 28.65) front += horse(hp.x, hp.y + 4, 1.6 * zk, { phase: t * 16, run: 1, dir: hp.dir, op: wOp });
        // little win flashes along the trail
        for (let i = 0; i < 6; i++) {
          const ti = 23.6 + i * 0.75;
          const fl = win(t, ti, ti + 0.6, 0.05, 0.4);
          if (fl > 0.01) {
            const q = proj(WIN.at(easeInOut(prog(ti, 23.0, 5.6))));
            if (q) front += ringPulse(q[0], q[1], t, ti, 8, 46, C.goldHi, 0.6, 1, 0.55, fl);
          }
        }
      }
      front += tally(t);
    }

    // ---- Flemington: the near miss, the Cup, the crowd camel
    {
      const pf = proj(P.flem);
      const fOp = win(t, 28.3, 35.2, 0.3, 0.35);
      if (pf && fOp > 0.01) {
        const k = clamp(Math.pow(z / 6, 0.25), 0.8, 1.4);
        mid += pin(pf[0] - 44 * k, pf[1] + 4, k * 0.9, 28.4, t, C.gold, fOp);
        const duck = win(t, T.shoot - 0.1, T.shoot + 0.55, 0.08, 0.25);
        const inset = smooth(31.7, 32.1, t);
        front += horse(pf[0] + 10, pf[1] + 6, 1.7 * k, { phase: t * 3, run: 0.12 * (1 - duck), duck, dir: 1, op: fOp * (1 - inset * 0.6) });
        front += nearMiss(t, pf[0] + 10, pf[1] + 6, 1.7 * k);
        const fl = popIn(t, 30.95, 0.35);
        if (fl > 0) front += label('FLEMINGTON', pf[0], pf[1] + 70 * k, { size: 36 * k, op: fOp * capClear(pf[1] + 70 * k), sc: fl, ls: 5 });
        front += racecourse(t, { ax: pf[0], ay: pf[1] - 20, t0: 31.75, t1: 35.15, tRun: 32.3, tWin: 33.72, camel: true, gold: false, cy: 735 });
      }
      front += chip('1930', 230, 196, { op: win(t, T.y1930, 34.9, 0.2, 0.4), size: 36, sc: popIn(t, T.y1930) || 0 });
      front += chip('MELBOURNE CUP', 520, 196, { op: win(t, T.cup, 34.9, 0.2, 0.4), size: 32, sc: popIn(t, T.cup) || 0 });
    }

    // ---- 1932: across the Pacific to Mexico (globe spin), Agua Caliente, he wins that too
    {
      const pOp = win(t, 36.1, 43.4, 0.3, 0.5);
      if (pOp > 0.01) {
        const fp = easeInOut(prog(t, 36.3, 38.3 - 36.3));
        back += routeLine(PAC.slice(0, fp), pOp, { w: 6, dash: true, t, dashCol: '#ffffff' });
        const hp = poseAt(PAC, Math.min(fp, 0.999));
        if (hp && fp < 0.999) front += horse(hp.x, hp.y + 6, 1.35, { phase: t * 10, run: 0.15, boat: 1, dir: hp.dir, op: pOp });
        const sp = screenPts(PAC.slice(0, 1));
        const dOp = win(t, 37.6, 38.9, 0.3, 0.4);
        if (dOp > 0.01) front += dimension(sp, 60, `~${(Math.round(PAC.km / 100) * 100).toLocaleString('en-AU')} KM`, dOp, { size: 58, dy: 56, at: 0.86 });
      }
      const pa = proj(P.agua);
      const aOp = win(t, 38.4, 43.3, 0.3, 0.4);
      if (pa && aOp > 0.01) {
        const k = clamp(Math.pow(z / 3, 0.25), 0.8, 1.35);
        mid += pin(pa[0], pa[1], k, 38.4, t, C.gold, aOp);
        const a1 = popIn(t, 38.75, 0.35);
        if (a1 > 0) front += label('AGUA CALIENTE', pa[0], pa[1] + 48 * k, { size: 36 * k, op: aOp * capClear(pa[1] + 48 * k), sc: a1, ls: 4 });
        const a2 = popIn(t, 39.05, 0.35);
        if (a2 > 0) front += label('TIJUANA', pa[0], pa[1] + 88 * k, { size: 28 * k, op: aOp * capClear(pa[1] + 88 * k), sc: a2, ls: 6, fill: '#cfe6ff', fw: 800 });
        // the richest race: gold prize glow + glints rising from the course
        const rich = win(t, T.richest - 0.1, 41.2, 0.3, 0.4);
        if (rich > 0.01) {
          back += `<circle cx="${f1(pa[0])}" cy="${f1(pa[1])}" r="${f1(160 * k)}" fill="url(#warm)" opacity="${f2(0.8 * rich)}"/>`;
          for (let i = 0; i < 14; i++) {
            const u = ((t - T.richest) * 0.7 + rand(i)) % 1;
            const gx = pa[0] + (rand(i + 9) - 0.5) * 220 * k;
            const gy = pa[1] - 30 - u * 260 * k;
            const sz = 3 + 4 * rand(i + 3);
            back += `<path d="M${f1(gx)} ${f1(gy - sz * 2)} L${f1(gx + sz * 0.5)} ${f1(gy)} L${f1(gx)} ${f1(gy + sz * 2)} L${f1(gx - sz * 0.5)} ${f1(gy)} Z" fill="${C.goldHi}" opacity="${f2(rich * Math.sin(u * Math.PI))}"/>`;
          }
        }
        front += racecourse(t, { ax: pa[0], ay: pa[1] - 20, t0: 40.3, t1: 42.75, tRun: 40.55, tWin: 41.75, camel: false, gold: true, cy: 620 });
      }
      front += bigYear(t, '1932', T.y1932, 36.6, 470);
      front += chip('1932', 540, 196, { op: win(t, 36.45, 42.7, 0.3, 0.4), size: 36, sc: popIn(t, 36.45) || 0 });
    }

    // ---- California: just over two weeks later; he falls ill and dies (map state only)
    {
      const cOp = win(t, 42.9, 55.2, 0.3, 0.5);
      if (cOp > 0.01) {
        const fc = easeInOut(prog(t, 43.1, 44.9 - 43.1));
        back += routeLine(CAL.slice(0, fc), cOp, { w: 5, dash: true, t: t < 45.4 ? t : 45.4, dashCol: '#ffffff' });
        const hp = poseAt(CAL, Math.min(fc, 0.999));
        const still = smooth(T.ill, T.dies + 0.3, t);
        const pcl = proj(P.calif);
        if (hp) {
          const k = zk;
          const x = fc >= 0.999 && pcl ? pcl[0] : hp.x;
          const y = fc >= 0.999 && pcl ? pcl[1] : hp.y;
          if (still > 0.01) back += ringPulse(x, y + 4, t, T.dies, 14, 70, '#cfd6dd', 2.4, 2, 0.5, cOp * win(t, T.dies, 55.0, 0.3, 0.5));
          front += horse(x, y + 4, 1.5 * k, { phase: t < T.ill ? t * 9 : T.ill * 9, run: (1 - still) * 0.6, grey: still, dir: hp.dir, op: cOp * (1 - 0.45 * smooth(T.dies, T.dies + 1.0, t)) });
          // two question labels on a beam that never settles (no verdict)
          const qOp = win(t, T.arsenic - 0.1, 54.95, 0.25, 0.45);
          if (qOp > 0.01) {
            const ang = 7 * Math.sin((t - T.arsenic) * 1.9) + 4 * Math.sin((t - T.arsenic) * 3.7);
            const bx = x;
            const by = y - 190;
            const la = popIn(t, T.arsenic, 0.35);
            const lb = popIn(t, T.infection, 0.35);
            const beam = smooth(T.infection, T.infection + 0.4, t);
            front += `<g opacity="${f2(qOp * capClear(by))}">
              <path d="M${f1(bx)} ${f1(y - 30)} L${f1(bx)} ${f1(by)}" stroke="#fff" stroke-opacity="${f2(0.6 * beam)}" stroke-width="3"/>
              <path d="M${f1(bx - 12)} ${f1(by + 12)} L${f1(bx)} ${f1(by - 2)} L${f1(bx + 12)} ${f1(by + 12)} Z" fill="#fff" opacity="${f2(beam)}"/>
              <g transform="rotate(${f1(ang * beam)} ${f1(bx)} ${f1(by)})">
                <path d="M${f1(bx - 230)} ${f1(by)} L${f1(bx + 230)} ${f1(by)}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="${f2(beam)}"/>
                ${la > 0 ? chip('ARSENIC?', bx - 200, by - 46, { size: 34, sc: la, acc: '#B8F27A' }) : ''}
                ${lb > 0 ? chip('INFECTION?', bx + 200, by - 46, { size: 34, sc: lb, acc: '#7FD0FF' }) : ''}
              </g>
            </g>`;
          }
        }
      }
      front += chip('+2 WEEKS', 540, 196, { op: win(t, T.later, 45.6, 0.25, 0.4), size: 36, sc: popIn(t, T.later) || 0 });
    }

    // ---- 1926 + the persistent chips
    front += bigYear(t, '1926', T.y1926, 8.6, 470);
    front += chip('1926', 540, 196, { op: win(t, 8.35, 15.3, 0.3, 0.4), size: 36, sc: popIn(t, 8.35) || 0 });

    // ---- name cards (public domain, small)
    front += nameCard(t, 'pharlap', 'PHAR LAP', T.pharlap - 0.1, 22.7);
    front += nameCard(t, 'cup1930', '1930 MELBOURNE CUP', T.wins - 0.2, 35.2, C.gold, 'R', 196);

    // ---- warm hold on the three pins ("if he's still your hero")
    const warmOp = win(t, 65.6, 68.9, 0.6, 0.5);

    // ---- master map: this route joins the prior Impossible Journeys (loaded polylines only; no ep.3, no s29)
    if (mmOp > 0.01 && IJL) {
      const seq = [['ep1', 'EP. 1', 69.75, [156.5, -24.0]], ['ep2', 'EP. 2', 70.05, [118.5, -4.0]], ['ep4', 'EP. 4', 70.35, [128.0, -21.0]], ['ep5', 'EP. 5', 70.65, [112.0, -30.5]], ['ep6', 'EP. 6', 70.95, [152.5, -63.0]]];
      for (const [k, tag, t0, at] of seq) {
        const rv = easeInOut(prog(t, t0, 1.3));
        if (rv <= 0.001) continue;
        const d = pathLL(IJL[k].slice(0, rv));
        back += `<g opacity="${f2(mmOp)}" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="${d}" stroke="#000" stroke-opacity="0.4" stroke-width="7"/>
          <path d="${d}" stroke="#ffffff" stroke-opacity="0.92" stroke-width="3.2"/></g>`;
        const p = proj(at);
        if (p) front += chip(tag, p[0], p[1] > 1190 && p[1] < 1500 ? (p[1] > 1345 ? 1530 : 1170) : p[1], { op: mmOp * cl01(popIn(t, t0 + 0.5)), size: 22, sc: popIn(t, t0 + 0.5) || 0, acc: '#ffffff' });
      }
      const d7 = pathLL(TAS.pts) + pathLL(PAC.pts) + pathLL(CAL.pts);
      back += `<g opacity="${f2(mmOp)}" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="${d7}" stroke="${C.route}" stroke-opacity="0.6" stroke-width="14" filter="url(#blur6)"/>
        <path d="${d7}" stroke="${C.gold}" stroke-width="4.5"/></g>`;
      for (const ll of [P.melb, P.wlg, P.canb, P.timaru, P.agua]) {
        const p = proj(ll);
        if (p) back += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="5" fill="${C.goldHi}" stroke="#2a1600" stroke-width="2" opacity="${f2(mmOp)}"/>`;
      }
      const p7 = proj([205, 10]);
      if (p7) front += chip('EP. 7', p7[0], p7[1], { op: mmOp * cl01(popIn(t, 69.35)), size: 30, sc: popIn(t, 69.35) || 0 });
      front += chip('IMPOSSIBLE JOURNEYS', 540, 236, { op: mmOp * cl01(popIn(t, 69.15)), size: 40, sc: popIn(t, 69.15) || 0 });
    }

    void opening;
    return { back, mid, front, warmOp };
  }

  // ---------------------------------------------------------------- atmosphere (limb, horizon haze)
  function atmosphere() {
    let s = '';
    const D = Math.PI / 180;
    const tl = CAM.tilt * D;
    const yh = CAM.fy - (K.FOCAL * Math.cos(tl)) / Math.max(1e-3, Math.sin(tl));
    if (yh > -400) {
      const yH = Math.min(yh, H);
      s += `<rect x="0" y="0" width="${W}" height="${f1(Math.max(0, yH + 2))}" fill="url(#sky)"/>`;
    }
    // globe limb: the circle of radius RE about the projection centre
    if (CAM.z < 0.6) {
      const ring = [];
      for (let i = 0; i <= 120; i++) {
        const a = (i / 120) * Math.PI * 2;
        const p = projXY(K.RE * Math.cos(a), K.RE * Math.sin(a));
        if (p) ring.push(p);
      }
      if (ring.length > 10) {
        const d = dPts(ring) + 'Z';
        const k = 1 - smooth(0.35, 0.6, CAM.z);
        s += `<path d="${d}" fill="none" stroke="#7fc4ff" stroke-opacity="${f2(0.55 * k)}" stroke-width="26" filter="url(#blur14)"/>
          <path d="${d}" fill="none" stroke="#bfe2ff" stroke-opacity="${f2(0.5 * k)}" stroke-width="3"/>`;
      }
    }
    s += `<rect x="0" y="0" width="${W}" height="420" fill="url(#hazeTop)" opacity="${f2(0.5 - 0.25 * smooth(40, 10, CAM.tilt))}"/>`;
    return s;
  }

  // ---------------------------------------------------------------- captions (Whisper word timings, karaoke)
  function buildCaptionGroups(words) {
    const groups = [];
    let cur = [];
    const flush = () => {
      if (cur.length) groups.push(cur);
      cur = [];
    };
    for (const w of words) {
      const chars = cur.reduce((n, x) => n + x.word.length + 1, 0) + w.word.length;
      if (cur.length && (cur.length >= 4 || chars > 20)) flush();
      cur.push(w);
      if (/[.?!,…:]$/.test(w.word)) flush();
    }
    flush();
    return groups.map((g) => ({ words: g, start: g[0].start, end: g[g.length - 1].end }));
  }
  let KG = null;
  function captions(t, capY) {
    if (!KG) KG = buildCaptionGroups(window.EPISODE.words || []);
    let gi = -1;
    for (let i = 0; i < KG.length; i++) {
      const next = KG[i + 1];
      const until = next ? Math.min(next.start - 0.02, KG[i].end + 0.6) : Math.min(KG[i].end + 0.6, DUR);
      if (t >= KG[i].start - 0.06 && t < until) {
        gi = i;
        break;
      }
    }
    if (gi < 0) return '';
    const g = KG[gi];
    const pop = easeOutBack(prog(t, g.start - 0.06, 0.16));
    const txt = g.words.map((w) => w.word.toUpperCase()).join(' ');
    const fs = Math.min(72, 900 / (txt.length * 0.72));
    const spans = g.words
      .map((w, k) => {
        const active = t >= w.start - 0.03 && (t < w.end + 0.08 || (k === g.words.length - 1 && t >= w.start));
        const fill = active ? C.goldHi : '#ffffff';
        return `<tspan fill="${fill}">${esc(w.word.toUpperCase())}${k < g.words.length - 1 ? ' ' : ''}</tspan>`;
      })
      .join('');
    return `<g transform="translate(540 ${f1(capY)}) scale(${f2(0.85 + 0.15 * pop)})" opacity="${f2(cl01(pop * 2))}">
      <text x="0" y="${f1(fs * 0.36)}" text-anchor="middle" font-family="${F.mont}" font-weight="900" font-size="${f1(fs)}"
        stroke="#000" stroke-width="${f1(fs * 0.2)}" stroke-linejoin="round" paint-order="stroke" filter="url(#dsS)" letter-spacing="1">${spans}</text>
    </g>`;
  }

  // ---------------------------------------------------------------- frame
  let lastSpin = -1;
  window.renderFrame = function (t) {
    if (!stageEl) return;
    t = clamp(t, 0, DUR - 1e-4);
    CAM = K.camAt(t);
    M = K.camMatrix(CAM);
    updateMap();
    // globe-spin basemap for this frame
    let wait = null;
    const fi = Math.round(t * K.FPS);
    if (CAM.spin && SPIN_SET.has(fi)) {
      if (lastSpin !== fi) {
        spinEl.src = `/ep/cache/spin/f${String(fi).padStart(5, '0')}.jpg`;
        wait = spinEl.decode().catch(() => {});
        lastSpin = fi;
      }
      spinEl.style.display = 'block';
    } else {
      spinEl.style.display = 'none';
    }
    // grades: "after he died" in the opening, the death in California, the warm hold
    const dark = Math.max(win(t, T.died, 5.2, 0.3, 0.6) * 0.35, win(t, T.ill, 55.0, 0.9, 0.9) * 0.55);
    const o = overlays(t);
    const warm = o.warmOp;
    const sat = 1 - 0.45 * dark + 0.08 * warm;
    const bri = 1 - 0.18 * dark + 0.03 * warm;
    stageEl.style.filter = Math.abs(sat - 1) > 0.001 || Math.abs(bri - 1) > 0.001 ? `saturate(${f2(sat)}) brightness(${f2(bri)})` : 'none';
    const gx = Math.floor(rand(Math.floor(t * 30)) * 384);
    const gy = Math.floor(rand(Math.floor(t * 30) + 0.5) * 384);
    ovEl.innerHTML = `${defs()}
      ${atmosphere()}
      ${warm > 0.01 ? `<rect width="${W}" height="${H}" fill="#ffb24a" opacity="${f2(0.07 * warm)}" style="mix-blend-mode:soft-light"/>` : ''}
      ${o.back}
      ${o.mid}
      <rect y="${H * 0.62}" width="${W}" height="${H * 0.38}" fill="url(#botShade)" opacity="0.7"/>
      <rect width="${W}" height="${H}" fill="url(#vig)"/>
      ${o.front}
      <rect width="${W + 384}" height="${H + 384}" fill="url(#grainP)" opacity="0.05" transform="translate(${-gx} ${-gy})" style="mix-blend-mode:overlay"/>
      ${hookCard(t)}
      ${captions(t, CAP_Y)}`;
    return wait;
  };
})();
