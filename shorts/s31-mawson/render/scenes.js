/* s31 Douglas Mawson — Impossible Journeys ep.6 — MAP ANIMATION (kinetic cartography is the picture).
 * Stack: SVG overlays + renderFrame(t) + Playwright + ffmpeg. No Remotion. Claude owns this file.
 *
 * Architecture (camera engine shared with s28 / s30, re-based on an orthographic globe plane)
 *  - Plane: orthographic projection centred on (146 E, 52 S), in kilometres (render/tools/make_basemap.py).
 *    George V Land sits ~16 deg from the centre, so the ice is not stretched, and the same plane pulls
 *    back to Australia for the series master map.
 *  - One continuous camera (keyframed lon/lat, zoom px/km, tilt, bearing) drives everything.
 *  - Basemap = graded satellite layers placed with a CSS matrix3d (exact projective map of a tilted plane).
 *  - Every overlay (routes, sledges, crevasses, ship, pins, labels) is screen-space SVG projected through
 *    the same matrix, so strokes and type stay crisp.
 *  - Timing comes from transcript.json (faster-whisper on the held Atlas VO, never modified).
 *
 * Dignity lock: two men die. No gore, no cartoon death, no faces in the scene (portraits are small name
 * cards only), no dog characters, the eating and the liver are not illustrated. The one gag (woolly hats,
 * flag pins) lives only on "two friends" and is gone before "Five weeks in". The snow-camel motif is early only.
 */
(function () {
  'use strict';
  const W = 1080;
  const H = 1920;
  const DUR = 79.584;
  const CAP_Y = 1344; // lower-middle band (~70%)
  const D2R = Math.PI / 180;
  const RE = 6371;
  const LON0 = 146;
  const LAT0 = -52;
  const S0 = Math.sin(LAT0 * D2R);
  const C0 = Math.cos(LAT0 * D2R);
  const FOCAL = 1700;

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

  const C = {
    gold: '#FFC83D',
    goldHi: '#FFE27A',
    route: '#FFB43A',
    routeCore: '#FFE9A8',
    back: '#FFF1CF',
    ice: '#CFE3F2',
    ink: '#0B0F1A',
    mawson: '#FFC83D',
    ninnis: '#FF7A5C',
    mertz: '#7FD0FF',
    gone: '#AEB8C4',
    warn: '#FF8A6B',
    wood: '#8A5A2E',
    woodHi: '#B9844E',
  };
  const F = {
    mont: "Montserrat, 'Arial Black', Arial, sans-serif",
    anton: "Anton, Impact, 'Arial Black', sans-serif",
  };

  // ---------------------------------------------------------------- projection (orthographic, km)
  function fwd(lon, lat) {
    const lo = (lon - LON0) * D2R;
    const la = lat * D2R;
    const cl = Math.cos(la);
    const x = RE * cl * Math.sin(lo);
    const y = RE * (C0 * Math.sin(la) - S0 * cl * Math.cos(lo));
    const vis = S0 * Math.sin(la) + C0 * cl * Math.cos(lo);
    return [x, -y, vis];
  }
  const PX = (ll) => fwd(ll[0], ll[1]);

  // ---------------------------------------------------------------- places (lon, lat)
  const BASE = [142.663, -67.009]; // Cape Denison, Commonwealth Bay (confirmed; labels only)
  const BAYL = [142.98, -66.82]; // label anchor in the bay
  const SHIP_A = [142.56, -66.9]; // the ship at anchor in Commonwealth Bay (unnamed)
  const SHIPP = [SHIP_A, [142.62, -66.83], [142.75, -66.74], [142.9, -66.6], [143.02, -66.38], [143.15, -66.12]];
  const NINNIS_GL = [147.0, -68.37]; // Wikipedia ~68°22'S 147°00'E
  const MERTZ_GL = [144.75, -67.5]; // Wikipedia ~67°30'S 144°45'E
  const CAMEL = [143.62, -67.36]; // snow-camel motif (unlabelled, early only)

  // Outbound (approximate track east from the base, inland of the coast, across the Mertz and Ninnis
  // glaciers). Tuned so the drawn length to the fall is about 500 km, as spoken.
  const OUTP = [
    BASE, [142.72, -67.07], [142.8, -67.14], [143.25, -67.36], [143.9, -67.52], [144.55, -67.6], [145.3, -67.68],
    [146.0, -67.92], [146.65, -68.18], [147.35, -68.5], [148.15, -68.66], [149.05, -68.72], [149.9, -68.86],
    [150.75, -69.02], [151.55, -69.06], [152.3, -69.02], [152.5, -69.0],
  ];
  const FALL = [152.3, -69.02]; // Ninnis's crevasse (no name, no date printed)
  // Return: south of the outbound track, back west. Mertz stops about 160 km from base.
  const MZ = [145.45, -68.04];
  const MC = [144.98, -67.84]; // Mawson's own crevasse, on the Mertz Glacier
  const RETP = [
    [152.5, -69.0], [152.25, -69.12], [151.7, -69.2], [150.8, -69.3], [149.85, -69.36], [148.9, -69.3], [148.0, -69.12],
    [147.2, -68.84], [146.5, -68.5], [145.95, -68.24], MZ, [145.2, -67.96], MC, [144.55, -67.7], [143.95, -67.52],
    [143.35, -67.34], [142.85, -67.16], [142.75, -67.09], [142.69, -67.035], BASE,
  ];

  // ---------------------------------------------------------------- monotone cubic interpolation
  function mono(keys) {
    const n = keys.length;
    const xs = keys.map((k) => k[0]);
    const ys = keys.map((k) => k[1]);
    const d = [];
    const m = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / Math.max(1e-6, xs[i + 1] - xs[i]));
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) {
        m[i] = 0;
        m[i + 1] = 0;
        continue;
      }
      const a = m[i] / d[i];
      const b = m[i + 1] / d[i];
      const s = a * a + b * b;
      if (s > 9) {
        const tau = 3 / Math.sqrt(s);
        m[i] = tau * a * d[i];
        m[i + 1] = tau * b * d[i];
      }
    }
    return (x) => {
      if (x <= xs[0]) return ys[0];
      if (x >= xs[n - 1]) return ys[n - 1];
      let i = 0;
      while (i < n - 2 && x > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i];
      const t = (x - xs[i]) / h;
      const t2 = t * t;
      const t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
    };
  }

  // ---------------------------------------------------------------- route geometry (plane km)
  function spline(pts, per = 16) {
    const out = [];
    const p = pts.map((q) => PX(q));
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[Math.max(0, i - 1)];
      const p1 = p[i];
      const p2 = p[i + 1];
      const p3 = p[Math.min(p.length - 1, i + 2)];
      for (let k = 0; k < per; k++) {
        const t = k / per;
        const t2 = t * t;
        const t3 = t2 * t;
        out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    out.push(p[p.length - 1].slice(0, 2));
    return out;
  }
  function mkLine(pts, per) {
    const P2 = spline(pts, per);
    const L = [0];
    for (let i = 1; i < P2.length; i++) L.push(L[i - 1] + Math.hypot(P2[i][0] - P2[i - 1][0], P2[i][1] - P2[i - 1][1]));
    const T = L[L.length - 1];
    const at = (f) => {
      const s = cl01(f) * T;
      let lo = 0;
      let hi = L.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (L[mid] < s) lo = mid;
        else hi = mid;
      }
      const u = (s - L[lo]) / Math.max(1e-9, L[hi] - L[lo]);
      return [lerp(P2[lo][0], P2[hi][0], u), lerp(P2[lo][1], P2[hi][1], u), lo];
    };
    const slice = (f0, f1) => {
      if (f1 <= f0) return [];
      const a = at(f0);
      const b = at(f1);
      const out = [[a[0], a[1]]];
      for (let i = a[2] + 1; i <= b[2]; i++) out.push(P2[i]);
      out.push([b[0], b[1]]);
      return out;
    };
    const fracNear = (ll) => {
      const [x, y] = PX(ll);
      let bi = 0;
      let bd = 1e9;
      P2.forEach((q, i) => {
        const dd = Math.hypot(q[0] - x, q[1] - y);
        if (dd < bd) {
          bd = dd;
          bi = i;
        }
      });
      return L[bi] / T;
    };
    return { pts: P2, L, T, at, slice, fracNear };
  }
  const OUT = mkLine(OUTP, 16);
  const RET = mkLine(RETP, 16);
  const SHIP = mkLine(SHIPP, 10);
  const fF = OUT.fracNear(FALL);
  const rMZ = RET.fracNear(MZ);
  const rMC = RET.fracNear(MC);

  // ---------------------------------------------------------------- the story clock (Whisper-timed)
  const T_HOOK_OUT = 1.25;
  const T_1912 = 7.9;
  const T_EAST = 10.9;
  const T_FRIENDS = 14.62;
  const T_GAG_OFF = 19.85;
  const T_FALL = 26.5; // "The snow gives way."
  const T_TURN = 33.3;
  const T_MDIE = 46.98;
  const T_SNAP = 53.06; // "...in half"
  const T_MFALL = 54.8; // "falls"
  const T_CLIMB = 57.66; // "climbs back out"
  const T_ARRIVE = 61.15; // sees his base
  const T_SAIL = 61.75; // ship leaves as he arrives
  const T_WINTER = 65.6;
  const T_GLAC = 68.9;
  const T_MASTER = 74.1;
  const T_LOOP = 78.7;

  // convoy order on the way out: Mertz ahead on skis, Mawson, Ninnis's sledge behind
  const OPEN_HEAD = (t) => 0.026 + 0.0011 * t; // frame-1 flash-forward: sledges just leaving the base
  // Mawson's position on the outbound line (fraction); his convoy gap is applied in screen space
  const HEADO = mono([
    [T_EAST - 0.2, 0.0], [12.9, 0.045], [15.0, 0.075], [17.5, 0.11], [19.9, 0.15], [21.2, 0.6], [22.0, 0.84], [22.9, 0.92],
    [24.0, fF - 0.035], [25.3, fF - 0.012], [26.45, fF + 0.004], [27.0, fF + 0.006],
  ]);
  // Return line fraction (Mawson). Mertz walks behind him and falls further behind as he weakens.
  const HEADR = mono([
    [T_TURN, 0.0], [34.4, 0.03], [36.9, 0.13], [39.6, 0.25], [42.6, 0.42], [44.3, rMZ - 0.07], [46.0, rMZ - 0.012],
    [47.0, rMZ + 0.001], [48.2, rMZ + 0.002], [50.4, rMZ + 0.004], [51.6, rMZ + 0.012], [53.4, rMZ + 0.02], [54.4, rMC - 0.002], [54.8, rMC],
    [58.4, rMC], [59.3, rMC + 0.04], [60.5, 0.93], [T_ARRIVE, 1.0],
  ]);
  const MERTZ_LAG = (t) => 0.004 + 0.022 * smooth(42.0, 46.2, t); // falls behind as he weakens
  // distance-to-base counter: spoken anchors only (500 at the fall, 160 when alone), 0 at the base
  const counterKm = (r) => (r <= rMZ ? lerp(500, 160, r / rMZ) : lerp(160, 0, (r - rMZ) / (1 - rMZ)));

  // ---------------------------------------------------------------- camera
  // [t, lon, lat, zoom px/km, tilt deg, bearing deg (360 = north up), focal y]
  const OPEN = [143.05, -67.27, 6.6, 54, 366, 1060];
  const CAMK = [
    [0.0, ...OPEN],
    [1.05, 143.3, -67.3, 6.0, 53, 364, 1000],
    [2.5, 146.0, -73.0, 0.36, 22, 360, 930],
    [3.25, 145.0, -70.5, 0.6, 26, 360, 940],
    [4.3, 142.75, -67.05, 9.5, 54, 360, 1000],
    [5.6, 142.72, -66.98, 15.0, 58, 352, 1010],
    [6.7, 142.78, -66.92, 12.5, 57, 350, 1000],
    [7.7, 143.4, -67.35, 2.6, 44, 360, 960],
    [9.3, 143.2, -67.25, 3.4, 46, 362, 970],
    [10.9, 142.9, -67.12, 7.5, 52, 364, 990],
    [12.9, 142.95, -67.15, 8.8, 54, 366, 1000],
    [14.4, 143.0, -67.2, 10.5, 56, 364, 1010],
    [17.0, 143.15, -67.27, 10.0, 56, 360, 1010],
    [19.9, 143.4, -67.36, 8.0, 54, 358, 1000],
    [21.3, 147.3, -68.4, 1.45, 36, 360, 950],
    [23.0, 147.6, -68.45, 1.38, 36, 362, 950],
    [24.4, 152.15, -69.0, 8.5, 55, 366, 1000],
    [25.6, 152.27, -69.02, 13.5, 58, 368, 1010],
    [27.4, 152.3, -69.02, 16.0, 60, 370, 1020],
    [29.0, 152.3, -69.02, 14.5, 59, 366, 1020],
    [32.4, 152.3, -69.03, 13.0, 57, 356, 1010],
    [33.9, 152.2, -69.08, 8.0, 54, 352, 1000],
    [35.6, 151.0, -69.2, 3.4, 46, 356, 980],
    [38.6, 149.6, -69.3, 3.6, 46, 360, 980],
    [41.6, 148.0, -69.1, 4.6, 48, 362, 990],
    [43.6, 146.6, -68.55, 6.8, 52, 364, 1000],
    [46.4, 145.8, -68.2, 9.0, 55, 366, 1010],
    [47.6, 145.6, -68.12, 7.5, 53, 364, 1000],
    [49.4, 144.1, -67.6, 1.75, 38, 360, 960],
    [51.1, 144.4, -67.7, 2.0, 40, 360, 960],
    [52.3, 145.25, -67.98, 12.0, 57, 364, 1010],
    [53.9, 145.15, -67.93, 13.5, 58, 362, 1010],
    [55.2, 144.98, -67.84, 16.5, 61, 358, 1030],
    [57.9, 144.98, -67.84, 18.0, 62, 354, 1030],
    [59.4, 144.4, -67.6, 5.5, 50, 358, 990],
    [60.8, 142.85, -67.1, 9.5, 54, 362, 1000],
    [62.2, 142.72, -67.0, 12.0, 57, 362, 1010],
    [64.6, 142.8, -66.82, 7.0, 53, 360, 1000],
    [67.6, 142.72, -66.98, 9.0, 56, 356, 1010],
    [69.3, 144.2, -67.4, 2.4, 42, 358, 960],
    [71.4, 146.0, -67.95, 1.35, 36, 360, 950],
    [73.6, 145.6, -67.85, 1.55, 37, 362, 950],
    [75.6, 140.0, -50.0, 0.32, 18, 360, 920],
    [78.2, 137.0, -42.0, 0.215, 12, 360, 900],
    [78.75, 138.0, -44.0, 0.23, 13, 360, 900],
    [DUR, ...OPEN],
  ];
  const CAMI = [1, 2, 3, 4, 5, 6].map((j) =>
    mono(CAMK.map((k) => {
      const p = fwd(k[1], k[2]);
      return [k[0], j === 1 ? p[0] : j === 2 ? p[1] : j === 3 ? Math.log(k[3]) : k[j]];
    }))
  );
  function camAt(t) {
    const cx = CAMI[0](t);
    const cy = CAMI[1](t);
    const z = Math.exp(CAMI[2](t));
    const tilt = CAMI[3](t);
    const bear = CAMI[4](t);
    const fy = CAMI[5](t);
    // gentle always-on drift (screen px); constant at the loop seam so the last frame flows into frame 1
    const dx = 7 * Math.sin(t * 0.57) + 3 * Math.sin(t * 1.31 + 1);
    const dy = 5 * Math.sin(t * 0.79 + 2);
    return { cx: cx + dx / z, cy: cy + dy / z, z, tilt, bear, fy, fx: 540 };
  }
  function mul(A, B) {
    const R = new Array(9);
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) R[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j];
    return R;
  }
  function camMatrix(c) {
    const s = Math.sin(c.tilt * D2R);
    const co = Math.cos(c.tilt * D2R);
    const ph = -c.bear * D2R;
    const T = [1, 0, -c.cx, 0, 1, -c.cy, 0, 0, 1];
    const S = [c.z, 0, 0, 0, c.z, 0, 0, 0, 1];
    const R = [Math.cos(ph), -Math.sin(ph), 0, Math.sin(ph), Math.cos(ph), 0, 0, 0, 1];
    const Pp = [1, (-c.fx * s) / FOCAL, c.fx, 0, co - (c.fy * s) / FOCAL, c.fy, 0, -s / FOCAL, 1];
    return mul(Pp, mul(R, mul(S, T)));
  }
  let CAM = null;
  let M = null;
  function projXY(X, Y) {
    const w = M[6] * X + M[7] * Y + M[8];
    if (w < 0.04) return null;
    return [(M[0] * X + M[1] * Y + M[2]) / w, (M[3] * X + M[4] * Y + M[5]) / w, 1 / w];
  }
  const proj = (ll) => {
    const p = PX(ll);
    return p[2] > 0 ? projXY(p[0], p[1]) : null;
  };
  function pathXY(pts, closed) {
    let d = '';
    let pen = false;
    for (const q of pts) {
      const p = projXY(q[0], q[1]);
      if (!p) {
        pen = false;
        continue;
      }
      d += (pen ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1]);
      pen = true;
    }
    return d + (closed && d ? 'Z' : '');
  }
  // lon/lat polyline → path, skipping the hidden hemisphere
  function pathLL(pts, closed) {
    let d = '';
    let pen = false;
    for (const q of pts) {
      const P = PX(q);
      const p = P[2] > 0.02 ? projXY(P[0], P[1]) : null;
      if (!p) {
        pen = false;
        continue;
      }
      d += (pen ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1]);
      pen = true;
    }
    return d + (closed && d ? 'Z' : '');
  }
  const zs = (z) => clamp(Math.pow(z / 7, 0.3), 0.6, 1.3);

  // ---------------------------------------------------------------- DOM / assets
  const FONT_CSS = `
    @font-face{font-family:'Anton';src:url(/ep/fonts/Anton-Regular.ttf) format('truetype');font-weight:400;}
    @font-face{font-family:'Montserrat';src:url(/ep/fonts/Montserrat-800.ttf) format('truetype');font-weight:800;}
    @font-face{font-family:'Montserrat';src:url(/ep/fonts/Montserrat-900.ttf) format('truetype');font-weight:900;}
    #stage{position:relative;width:1080px;height:1920px;overflow:hidden;background:#030713}
    #map{position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:hidden}
    #map img{position:absolute;left:0;top:0;transform-origin:0 0;display:block;max-width:none;backface-visibility:hidden}
    #map img.feather{
      -webkit-mask-image:linear-gradient(to right,transparent 0,#000 6%,#000 94%,transparent 100%),linear-gradient(to bottom,transparent 0,#000 6%,#000 94%,transparent 100%);
      -webkit-mask-composite:source-in;mask-composite:intersect}
    #ov{position:absolute;left:0;top:0}`;
  const st = document.createElement('style');
  st.textContent = FONT_CSS;
  document.head.appendChild(st);
  const GRAIN = '/ep/assets/grain.png';
  const LAYERS = [];
  let mapEl = null;
  let ovEl = null;
  let stageEl = null;
  let IJL = null;
  let ANT = null;
  let GLAC = null;
  const loadScript = (src) =>
    new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  window.EPISODE_READY = (async () => {
    const meta = await (await fetch('/ep/assets/map_layers.json')).json();
    await loadScript('/ep/assets/geo.js');
    await loadScript('/ep/assets/ij_routes.js');
    IJL = {};
    for (const k of ['ep1', 'ep2', 'ep4', 'ep5']) {
      // keep the visible-hemisphere part only (Hinkler's England start is on the far side of this globe)
      const pts = window.IJ[k].pts.filter((q) => PX(q)[2] > 0.08);
      IJL[k] = mkLine(pts, k === 'ep2' ? 2 : 6);
    }
    ANT = window.GEO.ant.concat(window.GEO.shelves);
    GLAC = {
      mertz: mkLine(window.GEO.glaciers.mertz, 12),
      ninnis: mkLine(window.GEO.glaciers.ninnis, 12),
    };
    const root = document.getElementById('root');
    root.innerHTML = `<div id="stage"><div id="map"></div><svg id="ov" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"></svg></div>`;
    stageEl = document.getElementById('stage');
    mapEl = document.getElementById('map');
    ovEl = document.getElementById('ov');
    const decs = [];
    for (const [name, L] of Object.entries(meta)) {
      const im = new Image();
      im.src = '/ep/' + L.src;
      im.width = L.w;
      im.height = L.h;
      im.className = name === 'globe' ? '' : 'feather';
      mapEl.appendChild(im);
      decs.push(im.decode().catch(() => {}));
      LAYERS.push({ name, el: im, A: [1 / L.K, 0, L.x0, 0, 1 / L.K, L.y0, 0, 0, 1], ...L });
    }
    for (const src of [GRAIN, '/ep/assets/card_mawson.jpg', '/ep/assets/card_ninnis.jpg', '/ep/assets/card_mertz.jpg']) {
      const g = new Image();
      g.src = src;
      decs.push(g.decode().catch(() => {}));
    }
    decs.push(document.fonts.load("400 100px 'Anton'"), document.fonts.load("800 40px 'Montserrat'"), document.fonts.load("900 40px 'Montserrat'"));
    await Promise.all(decs);
    const tr = await (await fetch('/transcript.json')).json();
    window.EPISODE = { duration: DUR, fps: 30, words: tr.words, scenes: [], images: {} };
  })();

  // zoom band where each layer fades in (px/km)
  const LAYER_Z = { globe: [0, 0], region: [0.75, 1.25], route: [2.3, 3.6], denison: [5.5, 8.5], fall: [7.0, 10.5], mcrev: [7.0, 10.5] };
  function updateMap() {
    for (const L of LAYERS) {
      const [z0, z1] = LAYER_Z[L.name] || [0, 0];
      let op = L.name === 'globe' ? 1 : smooth(z0, z1, CAM.z);
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
      const Mt = mul(M, L.A);
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
      <filter id="blur30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0d2140"/><stop offset="0.6" stop-color="#4c7aa6"/><stop offset="1" stop-color="#c3d9ea"/></linearGradient>
      <linearGradient id="hazeTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#d6e8f6" stop-opacity="0.32"/><stop offset="1" stop-color="#d6e8f6" stop-opacity="0"/></linearGradient>
      <linearGradient id="botShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></linearGradient>
      <radialGradient id="vig" cx="0.5" cy="0.46" r="0.78"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/></radialGradient>
      <radialGradient id="hutGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFE3A3" stop-opacity="0.95"/><stop offset="0.35" stop-color="#FFB547" stop-opacity="0.4"/><stop offset="1" stop-color="#FFB547" stop-opacity="0"/></radialGradient>
      <linearGradient id="chipG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16233a" stop-opacity="0.93"/><stop offset="1" stop-color="#090e1a" stop-opacity="0.93"/></linearGradient>
      <linearGradient id="crevG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1a33"/><stop offset="0.5" stop-color="#03070f"/><stop offset="1" stop-color="#0a1a33"/></linearGradient>
      <linearGradient id="aur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5CFFC4" stop-opacity="0"/><stop offset="0.55" stop-color="#5CFFC4" stop-opacity="0.55"/><stop offset="1" stop-color="#2BD7A0" stop-opacity="0"/></linearGradient>
      <linearGradient id="aur2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9A7BFF" stop-opacity="0"/><stop offset="0.6" stop-color="#7FE8D0" stop-opacity="0.45"/><stop offset="1" stop-color="#2BD7A0" stop-opacity="0"/></linearGradient>
      <clipPath id="cardClip"><rect x="0" y="0" width="200" height="200" rx="18"/></clipPath>
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
  // map labels never sit in the caption band
  const capClear = (y) => 1 - Math.min(smooth(1215, 1265, y), 1 - smooth(1420, 1470, y));
  const popIn = (t, a, d = 0.35) => (t < a ? 0 : easeOutBack(prog(t, a, d), 2.0));
  function callout(text, x, y, o = {}) {
    return label(text, x, y, { font: F.anton, fw: 400, ls: 1, fill: C.gold, size: 64, ...o });
  }
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

  // ---------------------------------------------------------------- line kit
  function screenPts(pts) {
    const out = [];
    for (const q of pts) {
      const p = projXY(q[0], q[1]);
      if (p) out.push(p);
    }
    return out;
  }
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
  function dashed(d, w, op, o = {}) {
    if (!d || op <= 0.001) return '';
    const off = o.flow ? -((o.t || 0) * 40) % 40 : 0;
    return `<g opacity="${f2(op)}" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="${d}" stroke="#000" stroke-opacity="0.45" stroke-width="${f1(w + 4)}" stroke-dasharray="${f1(w * 3)} ${f1(w * 2.6)}" stroke-dashoffset="${f1(off)}"/>
      <path d="${d}" stroke="${o.col || '#fff'}" stroke-width="${f1(w)}" stroke-dasharray="${f1(w * 3)} ${f1(w * 2.6)}" stroke-dashoffset="${f1(off)}"/>
    </g>`;
  }
  // dimension line parallel to a screen polyline, arrowheads both ends, yellow value
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
    const tick = (p, q) => {
      const dx = q[0] - p[0];
      const dy = q[1] - p[1];
      const L = Math.hypot(dx, dy) || 1;
      const nx = (-dy / L) * 14;
      const ny = (dx / L) * 14;
      return `<path d="M${f1(p[0] - nx)} ${f1(p[1] - ny)} L${f1(p[0] + nx)} ${f1(p[1] + ny)}" stroke="#fff" stroke-width="2.5"/>`;
    };
    return `<g opacity="${f2(op)}">
      <path d="${dPts(pts)}" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="5"/>
      <path d="${dPts(pts)}" fill="none" stroke="#fff" stroke-width="2.2"/>
      ${tick(a, a2)}${tick(b, b2)}
      ${arrowHead(a[0], a[1], angA, 0.6)}${arrowHead(b[0], b[1], angB, 0.6)}
      ${callout(txt, mid[0] + (o.dx || 0), mid[1] + (o.dy || 0), { size: o.size || 66, sc: o.sc == null ? 1 : o.sc })}
    </g>`;
  }
  // the anchor route: thick self-drawing line with a soft drop shadow and a warm glow
  function routeLine(sl, op, o = {}) {
    if (op <= 0.001 || sl.length < 2) return '';
    const d = pathXY(sl);
    if (!d) return '';
    const w = o.w || 7;
    const col = o.col || C.route;
    const core = o.core || C.routeCore;
    return `<g opacity="${f2(op)}" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="${d}" stroke="#000" stroke-opacity="0.38" stroke-width="${f1(w + 6)}" transform="translate(0 5)" filter="url(#blur3)"/>
      <path d="${d}" stroke="${col}" stroke-opacity="0.45" stroke-width="${f1(w * 3.2)}" filter="url(#blur6)"/>
      <path d="${d}" stroke="#2a1600" stroke-opacity="0.55" stroke-width="${f1(w + 3)}"/>
      <path d="${d}" stroke="${col}" stroke-width="${f1(w)}"/>
      <path d="${d}" stroke="${core}" stroke-opacity="0.85" stroke-width="${f1(w * 0.36)}"/>
    </g>`;
  }
  // screen point + heading (deg) at a line fraction, shifted sideways by off px
  function poseAt(line, f, off = 0) {
    const a = line.at(Math.max(0, f - 0.003));
    const b = line.at(Math.min(1, f + 0.003));
    const c = line.at(f);
    const pa = projXY(a[0], a[1]);
    const pb = projXY(b[0], b[1]);
    const pc = projXY(c[0], c[1]);
    if (!pa || !pb || !pc) return null;
    const dx = pb[0] - pa[0];
    const dy = pb[1] - pa[1];
    const L = Math.hypot(dx, dy) || 1;
    return { x: pc[0] - (dy / L) * off, y: pc[1] + (dx / L) * off, ang: (Math.atan2(dy, dx) * 180) / Math.PI, s: pc[2] };
  }
  // fraction step along a line that equals `px` screen pixels near fraction f
  function fracForPx(line, f, px) {
    const a = line.at(f);
    const b = line.at(Math.min(1, f + 0.002));
    const pa = projXY(a[0], a[1]);
    const pb = projXY(b[0], b[1]);
    if (!pa || !pb) return 0.01;
    const d = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) || 1e-3;
    return (0.002 * px) / d;
  }

  // ---------------------------------------------------------------- icons
  // Sledge, top-down, pointing +x. split: 0 = whole; >0 = only the front half is drawn (the back half is
  // drawn separately where it was left). man: Mawson's marker on the load (separates in his crevasse).
  function sledge(x, y, ang, s, col, o = {}) {
    const op = o.op == null ? 1 : o.op;
    if (op <= 0.01) return '';
    const half = o.half || 0; // 0 whole, 1 front half only, -1 back half only
    const grey = o.grey || 0;
    const load = grey > 0.5 ? '#9aa6b2' : col;
    const xa = half === 1 ? -2 : -30;
    const xb = half === -1 ? -2 : 30;
    const run = (yy) => {
      let d = `M${xa} ${yy} L${Math.min(xb, 22)} ${yy}`;
      if (half !== -1) d += ` Q31 ${yy} 30 ${yy * 0.25}`;
      return d;
    };
    const slats = [];
    for (let i = -24; i <= 16; i += 8) if (i >= xa + 2 && i <= xb - 2) slats.push(`<path d="M${i} -9 L${i} 9" stroke="${C.woodHi}" stroke-width="2.2"/>`);
    const lx0 = Math.max(xa + 4, -22);
    const lx1 = Math.min(xb - 4, 12);
    const loadRect = lx1 > lx0 ? `<rect x="${lx0}" y="-7.5" width="${lx1 - lx0}" height="15" rx="5" fill="${load}" stroke="#1d1206" stroke-width="2"/>
        <path d="M${lx0 + 3} -2.5 L${lx1 - 3} -2.5 M${lx0 + 3} 2.5 L${lx1 - 3} 2.5" stroke="#000" stroke-opacity="0.22" stroke-width="1.6"/>` : '';
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)}) scale(${f2(s)})" opacity="${f2(op)}">
      <ellipse cx="3" cy="7" rx="${half ? 18 : 33}" ry="12" fill="#06142a" opacity="0.38" filter="url(#blur3)" transform="translate(${half === 1 ? 14 : half === -1 ? -16 : 0} 0)"/>
      <g fill="none" stroke-linecap="round">
        <path d="${run(-10)}" stroke="#1d1206" stroke-width="5.5"/>
        <path d="${run(10)}" stroke="#1d1206" stroke-width="5.5"/>
        <path d="${run(-10)}" stroke="${C.wood}" stroke-width="3"/>
        <path d="${run(10)}" stroke="${C.wood}" stroke-width="3"/>
      </g>
      <rect x="${xa + 2}" y="-9" width="${xb - xa - 4}" height="18" rx="3" fill="${C.wood}" stroke="#1d1206" stroke-width="2"/>
      ${slats.join('')}
      ${loadRect}
      ${o.cut ? `<path d="M-2 -12 L-6 -5 L1 0 L-5 6 L-1 12" fill="none" stroke="#fff" stroke-width="${f1(2.5 * o.cut)}" opacity="${f2(o.cut)}"/>` : ''}
    </g>`;
  }
  // the person marker that rides on a sledge (team colour dot with white core)
  function manDot(x, y, s, col, op = 1) {
    if (op <= 0.01) return '';
    return `<g opacity="${f2(op)}">
      <circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(15 * s)}" fill="${col}" opacity="0.35" filter="url(#blur6)"/>
      <circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(7.5 * s)}" fill="#0b1220" opacity="0.6"/>
      <circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(6.2 * s)}" fill="${col}" stroke="#fff" stroke-width="${f1(2 * s)}"/>
    </g>`;
  }
  // the one gag: a tiny woolly hat (bobble beanie) sitting on the sledge icon
  function hat(x, y, s, cA, cB, p, wob) {
    if (p <= 0.01) return '';
    const sc = s * easeOutBack(cl01(p), 2.4);
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(wob)}) scale(${f2(sc)})" filter="url(#dsS)">
      <path d="M-13 2 C -13 -14 13 -14 13 2 Z" fill="${cA}" stroke="#1a1a1a" stroke-width="2"/>
      <path d="M-8 -9 C -6 -2 -6 -2 -5 2 M0 -12 L0 2 M8 -9 C 6 -2 6 -2 5 2" stroke="#000" stroke-opacity="0.18" stroke-width="2" fill="none"/>
      <rect x="-14.5" y="0" width="29" height="7" rx="3" fill="${cB}" stroke="#1a1a1a" stroke-width="2"/>
      <path d="M-11 1.5 L-11 5.5 M-6 1.5 L-6 5.5 M-1 1.5 L-1 5.5 M4 1.5 L4 5.5 M9 1.5 L9 5.5" stroke="#000" stroke-opacity="0.2" stroke-width="1.6"/>
      <circle cx="0" cy="-14" r="5" fill="${cB}" stroke="#1a1a1a" stroke-width="2"/>
    </g>`;
  }
  // flag pin (the other half of the gag): 'uk' or 'ch'
  function flagPin(x, y, s, kind, p, t) {
    if (p <= 0.01) return '';
    const sc = s * easeOutBack(cl01(p), 2.2);
    const wave = Math.sin(t * 6) * 1.5;
    let flag = '';
    if (kind === 'uk') {
      flag = `<g transform="translate(2 -46) skewY(${f1(wave)})">
        <clipPath id="ukc"><rect x="0" y="0" width="34" height="20" rx="2"/></clipPath>
        <g clip-path="url(#ukc)">
          <rect x="0" y="0" width="34" height="20" fill="#012169"/>
          <path d="M0 0 L34 20 M34 0 L0 20" stroke="#fff" stroke-width="5"/>
          <path d="M0 0 L34 20 M34 0 L0 20" stroke="#C8102E" stroke-width="1.8"/>
          <path d="M17 0 L17 20 M0 10 L34 10" stroke="#fff" stroke-width="7"/>
          <path d="M17 0 L17 20 M0 10 L34 10" stroke="#C8102E" stroke-width="4"/>
        </g>
        <rect x="0" y="0" width="34" height="20" rx="2" fill="none" stroke="#111" stroke-width="1.6"/>
      </g>`;
    } else {
      flag = `<g transform="translate(2 -46) skewY(${f1(wave)})">
        <rect x="0" y="0" width="22" height="22" rx="2" fill="#DA291C" stroke="#111" stroke-width="1.6"/>
        <path d="M11 4.5 L11 17.5 M4.5 11 L17.5 11" stroke="#fff" stroke-width="4.4"/>
      </g>`;
    }
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f2(sc)})" filter="url(#dsS)">
      <ellipse cx="0" cy="1" rx="6" ry="2.4" fill="#000" opacity="0.35"/>
      <path d="M0 0 L0 -46" stroke="#e9eef3" stroke-width="2.6"/>
      <circle cx="0" cy="-47" r="3" fill="#e9eef3"/>
      ${flag}
    </g>`;
  }
  // the ship (unnamed): small top-down steam yacht pointing +x, with a wake when moving
  function ship(x, y, ang, s, wake, op) {
    if (op <= 0.01) return '';
    let wk = '';
    if (wake > 0.01) {
      wk = `<g opacity="${f2(wake)}" fill="none" stroke="#e8f4ff" stroke-linecap="round">
        <path d="M-24 -4 Q -60 -10 -110 -26" stroke-width="2.4" opacity="0.7"/>
        <path d="M-24 4 Q -60 10 -110 26" stroke-width="2.4" opacity="0.7"/>
        <path d="M-26 0 L -80 0" stroke-width="5" opacity="0.28" filter="url(#blur3)"/>
      </g>`;
    }
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)}) scale(${f2(s)})" opacity="${f2(op)}">
      ${wk}
      <ellipse cx="0" cy="6" rx="30" ry="9" fill="#01060f" opacity="0.45" filter="url(#blur3)"/>
      <path d="M-24 -7 L14 -7 Q 30 -6 34 0 Q 30 6 14 7 L-24 7 Q -28 0 -24 -7 Z" fill="#1d2a3a" stroke="#05090f" stroke-width="2"/>
      <path d="M-20 -4.5 L13 -4.5 Q 25 -4 28 0 Q 25 4 13 4.5 L-20 4.5 Z" fill="#c9a274"/>
      <rect x="-12" y="-3.6" width="16" height="7.2" rx="1.5" fill="#f2efe6" stroke="#3a3326" stroke-width="1"/>
      <circle cx="-3" cy="0" r="2.6" fill="#2b2b2b"/>
      <path d="M-18 0 L22 0" stroke="#5a4a36" stroke-width="1.1"/>
    </g>`;
  }
  // a crevasse as a dark lens across the route: centre (plane km), axis angle (plane), half-length km, width km
  function crevasse(cx, cy, axAng, hl, wd, op, o = {}) {
    if (op <= 0.01 || wd <= 1e-4) return '';
    const ca = Math.cos(axAng);
    const sa = Math.sin(axAng);
    const N = 18;
    const top = [];
    const bot = [];
    for (let i = 0; i <= N; i++) {
      const u = -1 + (2 * i) / N;
      const prof = Math.pow(1 - u * u, 0.7) * (1 + 0.18 * Math.sin(i * 2.7 + (o.seed || 0)));
      const ax = cx + ca * hl * u;
      const ay = cy + sa * hl * u;
      top.push([ax - sa * wd * 0.5 * prof, ay + ca * wd * 0.5 * prof]);
      bot.push([ax + sa * wd * 0.5 * prof, ay - ca * wd * 0.5 * prof]);
    }
    const ring = top.concat(bot.reverse());
    const d = pathXY(ring, true);
    const dTop = pathXY(top);
    if (!d) return '';
    return `<g opacity="${f2(op)}">
      <path d="${d}" fill="#0b2346" opacity="0.5" filter="url(#blur3)" transform="translate(0 3)"/>
      <path d="${d}" fill="#3d6fa3" stroke="#e9f4ff" stroke-opacity="0.85" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="${d}" fill="url(#crevG)" transform="translate(0 ${f1(o.depth || 3)})"/>
      <path d="${dTop}" fill="none" stroke="#ffffff" stroke-opacity="0.65" stroke-width="2"/>
    </g>`;
  }
  // the hidden crevasse before it opens: a faint snow-bridge line
  function hiddenLine(cx, cy, axAng, hl, op) {
    if (op <= 0.01) return '';
    const ca = Math.cos(axAng);
    const sa = Math.sin(axAng);
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const u = -1 + i / 6;
      pts.push([cx + ca * hl * u, cy + sa * hl * u + Math.sin(i * 1.7) * 0.02]);
    }
    const d = pathXY(pts);
    return `<g opacity="${f2(op)}" fill="none" stroke-linecap="round">
      <path d="${d}" stroke="#4d79a8" stroke-width="9" opacity="0.6" filter="url(#blur3)"/>
      <path d="${d}" stroke="#ffffff" stroke-width="2.6" stroke-dasharray="10 9" opacity="0.9"/>
    </g>`;
  }

  // snow-camel (series motif): a wind-drift shape in the ice, unlabelled. Dromedary silhouette (unit box).
  const CAMEL_SHAPE = [
    [0, 52], [6, 40], [10, 30], [16, 24], [24, 22], [30, 14], [36, 6], [44, 2], [52, 6], [58, 14], [64, 10], [70, 4],
    [78, 6], [82, 14], [84, 22], [86, 30], [92, 30], [98, 26], [104, 24], [106, 30], [100, 36], [92, 40], [86, 44],
    [82, 52], [80, 60], [82, 76], [80, 78], [76, 62], [70, 58], [66, 76], [62, 78], [62, 58], [40, 58], [36, 76],
    [32, 78], [32, 58], [24, 56], [22, 76], [18, 78], [18, 56], [10, 56], [4, 58],
  ];
  function snowCamel(op) {
    if (op <= 0.01) return '';
    const [cx, cy] = PX(CAMEL);
    const km = 0.085; // 1 unit = 85 m → ~9 km long drift
    const a = -0.35;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const pts = CAMEL_SHAPE.map(([u, v]) => {
      const x = (u - 53) * km;
      const y = (v - 40) * km;
      return [cx + x * ca - y * sa, cy + x * sa + y * ca];
    });
    const d = pathXY(pts, true);
    if (!d) return '';
    return `<g opacity="${f2(op)}">
      <path d="${d}" fill="#3f6187" opacity="0.32" transform="translate(4 4)" filter="url(#blur3)"/>
      <path d="${d}" fill="#f1f7fc" opacity="0.30" transform="translate(-2 -2)" filter="url(#blur2)"/>
      <path d="${d}" fill="#d8e6f1" opacity="0.30" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1.2"/>
    </g>`;
  }

  // ---------------------------------------------------------------- the big custom pieces
  // Frame-1 hook card (never spoken). Clears by ~1.6 s; re-slams on the loop beat so the last frame matches.
  function hookCard(t) {
    let sc = 1;
    let op = 1;
    let dy = 0;
    if (t < 5) {
      const p = prog(t, T_HOOK_OUT, 0.4);
      op = 1 - easeIn(p);
      dy = -80 * easeIn(p);
      sc = 1 + 0.05 * p;
    } else {
      const p = prog(t, 79.24, 0.26);
      if (p <= 0) return '';
      sc = lerp(1.6, 1, easeOutBack(p, 1.3));
      op = cl01(p * 3);
    }
    if (op <= 0.001) return '';
    return `<g transform="translate(540 ${f1(560 + dy)}) rotate(-2.5) scale(${f2(sc * 0.92)})" opacity="${f2(op)}">
      <g filter="url(#ds)">
        <rect x="-430" y="-150" width="860" height="270" rx="26" fill="rgba(7,12,24,0.82)" stroke="${C.gold}" stroke-width="5"/>
        <rect x="-408" y="-128" width="816" height="226" rx="16" fill="none" stroke="#cfe6ff" stroke-opacity="0.22" stroke-width="2"/>
      </g>
      <text x="0" y="52" text-anchor="middle" font-family="${F.anton}" font-size="176" letter-spacing="4" fill="${C.gold}" stroke="#000" stroke-width="10" paint-order="stroke">A FEW HOURS</text>
    </g>`;
  }
  // DISTANCE TO BASE counter: return only; anchors as spoken (about 500, about 160); 0 at the base
  function distCounter(t, r) {
    const op = win(t, T_TURN + 0.25, 63.4, 0.35, 0.6);
    if (op <= 0.01) return '';
    const km = Math.max(0, Math.round(counterKm(r)));
    const anchor = Math.max(win(t, 33.5, 35.2, 0.2, 0.4), win(t, 49.1, 51.6, 0.25, 0.5));
    const home = smooth(T_ARRIVE - 0.3, T_ARRIVE, t);
    const sc = (t < T_TURN + 0.9 ? popIn(t, T_TURN + 0.25, 0.4) : 1) * (1 + 0.08 * anchor);
    const col = home > 0.5 ? '#ffffff' : C.gold;
    const kick = 1 + 0.05 * Math.max(0, 1 - ((counterKm(r) % 10) / 10) * 6) * (1 - home);
    return `<g transform="translate(540 236) scale(${f2(sc)})" opacity="${f2(op)}" filter="url(#ds)">
      <rect x="-250" y="-92" width="500" height="184" rx="30" fill="url(#chipG)" stroke="${anchor > 0.3 ? C.goldHi : C.gold}" stroke-width="${f1(3.5 + 2 * anchor)}"/>
      <text x="0" y="-44" text-anchor="middle" font-family="${F.mont}" font-weight="900" font-size="30" letter-spacing="6" fill="#d9e6f2">DISTANCE TO BASE</text>
      <g transform="translate(0 52) scale(${f2(kick)})"><text x="0" y="0" text-anchor="middle" font-family="${F.anton}" font-size="104" letter-spacing="3" fill="${col}" stroke="#000" stroke-width="5" paint-order="stroke">~${km} KM</text></g>
    </g>`;
  }
  // small PD portrait name cards (names only); side = 'L' | 'R'
  function nameCard(t, key, name, col, t0, t1, side) {
    const op = win(t, t0, t1, 0.3, 0.35);
    if (op <= 0.01) return '';
    const slide = (1 - easeOut(prog(t, t0, 0.45))) * (side === 'L' ? -320 : 320);
    const x = (side === 'L' ? 64 : 1080 - 64 - 236) + slide;
    const y = 300;
    return `<g transform="translate(${f1(x)} ${y})" opacity="${f2(op)}" filter="url(#ds)">
      <rect x="-10" y="-10" width="256" height="300" rx="24" fill="url(#chipG)" stroke="${col}" stroke-width="3.5"/>
      <g transform="translate(18 8)"><g clip-path="url(#cardClip)"><image href="/ep/assets/card_${key}.jpg" x="0" y="0" width="200" height="200"/></g>
        <rect x="0" y="0" width="200" height="200" rx="18" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="2"/></g>
      <text x="118" y="246" text-anchor="middle" font-family="${F.mont}" font-weight="900" font-size="${name.length > 7 ? 34 : 38}" letter-spacing="3" fill="#fff">${esc(name)}</text>
      <rect x="40" y="262" width="156" height="5" rx="2.5" fill="${col}"/>
    </g>`;
  }

  // ---------------------------------------------------------------- overlays per frame
  function overlays(t) {
    let back = '';
    let mid = '';
    let front = '';
    const z = CAM.z;
    const zk = zs(z);
    const loopMode = t < 7.6 || t > T_LOOP + 0.1;
    const story = 1 - smooth(T_LOOP - 0.1, T_LOOP + 0.35, t); // everything from the story fades for the loop

    // --- Antarctica: continent glow on the wide views (opening "across Antarctica", master map)
    const antOp = Math.max(win(t, 1.4, 3.6, 0.4, 0.6), 0.55 * win(t, 75.0, 78.9, 0.6, 0.5));
    if (antOp > 0.01 && ANT) {
      let d = '';
      for (const r of ANT) d += pathLL(r, false);
      back += `<g opacity="${f2(antOp)}" fill="none" stroke-linejoin="round">
        <path d="${d}" stroke="#bfe4ff" stroke-opacity="0.35" stroke-width="12" filter="url(#blur6)"/>
        <path d="${d}" stroke="#ffffff" stroke-opacity="0.85" stroke-width="2"/></g>`;
      const p = proj([140, -76]);
      const big = win(t, 1.55, 3.5, 0.3, 0.5);
      if (p && big > 0.01) front += label('ANTARCTICA', p[0], p[1], { size: 64, op: big * capClear(p[1]), sc: popIn(t, 1.6), ls: 8 });
    }

    // --- glaciers beat: the two glaciers glow, labels on their words
    const gOp = win(t, T_GLAC + 0.3, T_MASTER + 0.6, 0.6, 0.6);
    if (gOp > 0.01 && GLAC) {
      const draw = (L, t0, name, ll, dx, dy) => {
        const rv = easeInOut(prog(t, t0 - 0.35, 1.1));
        if (rv <= 0.001) return;
        const sl = L.slice(0.25, 0.25 + 0.75 * rv);
        const dd = pathXY(sl);
        back += `<g opacity="${f2(gOp)}" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="${dd}" stroke="#CFEFFF" stroke-opacity="0.32" stroke-width="${f1(Math.max(26, 30 * z))}" filter="url(#blur14)"/>
          <path d="${dd}" stroke="#ffffff" stroke-opacity="0.75" stroke-width="2.4" stroke-dasharray="2 10"/></g>`;
        const p = proj(ll);
        if (p) {
          const op = gOp * cl01(popIn(t, t0)) * capClear(p[1] + dy);
          front += label(name, p[0] + dx, p[1] + dy, { size: 46, op, sc: popIn(t, t0), ls: 4, fill: '#ffffff' });
          front += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="7" fill="#fff" stroke="#0b1220" stroke-width="3" opacity="${f2(op)}"/>`;
        }
      };
      draw(GLAC.ninnis, 71.65, 'NINNIS GLACIER', NINNIS_GL, 30, 70);
      draw(GLAC.mertz, 72.9, 'MERTZ GLACIER', MERTZ_GL, -10, -48);
    }

    // --- base: pin + place labels (labels from "his base"; the pin itself is always there in the story)
    const bp = proj(BASE);
    const baseOp = story * (t < 7.6 ? 1 : 1);
    if (bp && baseOp > 0.01 && z > 0.9) {
      const pk = clamp(Math.pow(z / 8, 0.3), 0.6, 1.25);
      const hut = Math.max(win(t, T_WINTER, T_GLAC + 0.6, 0.6, 0.6), 0.6 * win(t, T_ARRIVE, T_WINTER, 0.4, 0.2));
      if (hut > 0.01) back += `<circle cx="${f1(bp[0])}" cy="${f1(bp[1])}" r="${f1(90 * pk)}" fill="url(#hutGlow)" opacity="${f2(hut)}"/>`;
      mid += pin(bp[0], bp[1], pk, t < 7.6 ? -1 : 10.6, t < 7.6 ? 10 : t, C.gold, baseOp * smooth(0.9, 1.6, z));
      const lab = win(t, 12.3, 14.7, 0.35, 0.45) + win(t, T_ARRIVE - 0.5, 64.4, 0.3, 0.5) * 0.9;
      if (lab > 0.01) {
        const y = bp[1] + 46 * pk;
        mid += label('CAPE DENISON', bp[0] - 26 * pk, bp[1] + 40 * pk, { size: 36 * pk, op: lab * capClear(y), sc: popIn(t, t > 60 ? T_ARRIVE - 0.5 : 12.3), ls: 3, anchor: 'end' });
        const bq = proj(BAYL);
        if (bq) mid += label('COMMONWEALTH BAY', bq[0], bq[1], { size: 30 * pk, op: lab * 0.95 * capClear(bq[1]), sc: popIn(t, t > 60 ? T_ARRIVE - 0.3 : 12.6), ls: 6, fill: '#cfe6ff', fw: 800, italic: true });
      }
    }

    // --- snow-camel motif: frame 1 until the friends beat; gone before the crevasse, never returns
    if (t < 14) back += snowCamel(0.95 * (1 - smooth(12.6, 13.8, t)) * smooth(3.0, 12, z));

    // --- outbound route + convoy -----------------------------------------------------------------
    const outVis = story * (t < 7.6 ? 1 - smooth(6.9, 7.5, t) : 1) * (t > T_MASTER - 0.4 ? 1 - smooth(T_MASTER + 1.4, T_MASTER + 2.6, t) : 1);
    const headO = t < 7.6 ? OPEN_HEAD(t) : t > T_LOOP + 0.1 ? OPEN_HEAD(t - DUR) : t < T_EAST - 0.2 ? 0 : HEADO(Math.min(t, 27));
    const gapF = fracForPx(OUT, clamp(headO, 0, 1), 124 * zk);
    // drawn line: to the lead sledge (Mertz) on the way out; afterwards the whole outbound track to the fall
    const outEnd = t < T_TURN ? Math.min(1, headO + gapF) : fF;
    const loopTrail = t > T_LOOP + 0.1 ? smooth(T_LOOP + 0.25, T_LOOP + 0.7, t) : 1;
    if (outEnd > 0.0005) back += routeLine(OUT.slice(0, outEnd), outVis * (t < 7.6 ? 1 : loopTrail) * (t > 7.6 && t < T_EAST ? 0 : 1), { w: 7 * clamp(zk, 0.7, 1.15) });

    // --- return route (paler), drawn behind Mawson
    const rh = HEADR(t);
    if (t > T_TURN && rh > 0.0005) back += routeLine(RET.slice(0, rh), story * (t > T_MASTER - 0.4 ? 1 - smooth(T_MASTER + 1.4, T_MASTER + 2.6, t) : 1), { w: 6 * clamp(zk, 0.7, 1.15), col: '#FFD98A', core: '#FFFFFF' });

    // --- ~500 KM dimension along the outbound track (Five weeks in / about 500 km)
    const d500 = win(t, 21.5, 24.0, 0.3, 0.5);
    if (d500 > 0.01) {
      const sp = screenPts(OUT.slice(0, Math.min(fF, Math.max(0.3, headO))));
      if (sp.length > 4) front += dimension(sp, -44, '~500 KM', d500, { at: 0.55, dy: -50, sc: popIn(t, 21.55), size: 72 });
    }
    // --- ~160 KM dimension from where Mertz stops back to the base (Mawson is alone)
    const d160 = win(t, 49.1, 51.7, 0.3, 0.5);
    if (d160 > 0.01) {
      const sp = screenPts(RET.slice(rMZ, 1));
      if (sp.length > 4) front += dimension(sp, 46, '~160 KM', d160, { at: 0.5, dy: 70, sc: popIn(t, 49.15), size: 72 });
    }

    // --- crevasses (plane geometry, perpendicular to the track)
    const crevAt = (line, f, hl, wd, op, o) => {
      const a = line.at(Math.max(0, f - 0.002));
      const b = line.at(Math.min(1, f + 0.002));
      const c = line.at(f);
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2 + 0.75;
      return { c, ang, s: crevasse(c[0], c[1], ang, hl, wd, op, o), h: hiddenLine(c[0], c[1], ang, hl, op) };
    };
    // Ninnis's crevasse: hidden snow bridge (24.0) → gives way (26.5) → stays as the place he was lost
    const cvOp = story * (t > 23.6 ? 1 : 0) * (t > T_MASTER ? 1 - smooth(T_MASTER + 0.5, T_MASTER + 1.8, t) : 1);
    if (cvOp > 0.01) {
      const open = easeOut(prog(t, T_FALL - 0.1, 0.55));
      const cv = crevAt(OUT, fF, 9.0, 0.25 + 2.4 * open, cvOp, { seed: 1, depth: 3 + 6 * open });
      if (open < 0.99) back += cv.h.replace(/opacity="([\d.]+)"/, (m, v) => `opacity="${f2(+v * win(t, 23.9, T_FALL + 0.3, 0.8, 0.3))}"`);
      if (open > 0.001) back += cv.s;
      // collapse puff: a few snow grains settle (26.5–27.6), no figure
      if (t > T_FALL - 0.1 && t < T_FALL + 1.4) {
        const p = projXY(cv.c[0], cv.c[1]);
        if (p) {
          const u = prog(t, T_FALL - 0.1, 1.4);
          for (let i = 0; i < 16; i++) {
            const a = rand(i) * Math.PI * 2;
            const r = (14 + 46 * rand(i + 9)) * easeOut(u) * zk;
            mid += `<circle cx="${f1(p[0] + Math.cos(a) * r)}" cy="${f1(p[1] + Math.sin(a) * r * 0.55 - 10 * (1 - u))}" r="${f1((2 + 3 * rand(i + 3)) * zk)}" fill="#f3f9ff" opacity="${f2(0.8 * (1 - u))}"/>`;
          }
        }
      }
      // a quiet hollow ring marks the place (from "He's gone"), faint afterwards
      const ring = win(t, 27.4, T_MASTER + 1.5, 0.4, 0.8) * (t > 33.6 ? 0.55 : 1);
      const p = projXY(cv.c[0], cv.c[1]);
      if (p && ring > 0.01) {
        mid += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${f1(30 * zk)}" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="${f2(0.7 * ring)}"/>`;
        mid += ringPulse(p[0], p[1], t, 27.45, 10, 90 * zk, '#ffffff', 1.8, 1, 0.55, win(t, 27.4, 29.2, 0.1, 0.5));
      }
      // lost with him: labels only, then they sink into the crevasse
      const items = [['TENT', 29.38], ['MOST OF THE FOOD', 30.02], ['SIX BEST DOGS', 31.28]];
      if (p && t > 29.2 && t < 33.6) {
        items.forEach(([txt, t0], i) => {
          const sink = easeIn(prog(t, 32.3 + i * 0.12, 0.9));
          const op = cl01(popIn(t, t0)) * (1 - sink);
          const y = lerp(p[1] - 330 + i * 70, p[1], sink);
          const tx = lerp(540, p[0], sink);
          if (op > 0.01) front += label(txt, tx, y, { size: 46, op: op * capClear(y), sc: popIn(t, t0) * (1 - 0.6 * sink), ls: 4, fill: '#e8f1fa' });
        });
        if (t > 29.3) {
          const lop = win(t, 29.3, 33.0, 0.3, 0.6);
          front += `<path d="M${f1(p[0])} ${f1(p[1] - 22)} L${f1(lerp(p[0], 540, 0.5))} ${f1(p[1] - 150)}" stroke="#fff" stroke-width="2" stroke-dasharray="4 6" opacity="${f2(0.5 * lop)}"/>`;
        }
      }
    }
    // Mawson's own crevasse on the Mertz Glacier (54.8 → 58.3): he drops in on the rope and climbs out
    const mcOp = story * win(t, 54.2, 60.0, 0.3, 0.8);
    let mcInfo = null;
    if (mcOp > 0.01) {
      const open = easeOut(prog(t, T_MFALL - 0.15, 0.45));
      mcInfo = crevAt(RET, Math.min(1, rMC + 0.016), 6.5, 0.15 + 1.9 * open, mcOp, { seed: 4, depth: 3 + 6 * open });
      back += mcInfo.s;
    }

    // --- the ship (unnamed): at anchor in Commonwealth Bay; leaves just as Mawson arrives
    {
      let sf = 0;
      let wake = 0;
      let sop = story;
      if (t < 7.6) {
        // hook tease: "missed his ship home by a few hours" — it pulls away, then the story starts in 1912
        sf = 0.42 * easeInOut(prog(t, 4.7, 2.6));
        wake = win(t, 4.7, 7.4, 0.4, 0.4);
        sop *= 1 - smooth(6.9, 7.5, t);
      } else if (t > T_SAIL) {
        sf = easeIn(prog(t, T_SAIL, 1.2)) * 0.25 + 0.75 * easeInOut(prog(t, T_SAIL + 0.6, 4.6));
        wake = win(t, T_SAIL, 66.5, 0.4, 0.6);
        sop *= 1 - smooth(65.2, 66.4, t);
      } else if (t > 7.6) {
        sop *= smooth(7.6, 8.4, t);
      }
      if (t > T_LOOP + 0.1) {
        sf = 0;
        wake = 0;
        sop = smooth(T_LOOP + 0.3, T_LOOP + 0.7, t);
      }
      const ps = poseAt(SHIP, Math.max(0.0005, sf));
      if (ps && sop > 0.01 && z > 2.5) {
        const sk = 1.35 * clamp(Math.pow(z / 10, 0.45), 0.5, 1.3);
        mid += ship(ps.x, ps.y, sf > 0.001 ? ps.ang : -80, sk, wake, sop * smooth(2.5, 4.5, z));
      }
    }

    // --- sledges --------------------------------------------------------------------------------
    // outbound convoy (0 → crevasse), then the return pair, then Mawson alone
    const hatsP = Math.min(cl01(prog(t, T_FRIENDS, 0.4)), 1 - easeIn(prog(t, T_GAG_OFF, 0.45)));
    const flagsP = Math.min(cl01(prog(t, T_FRIENDS + 0.12, 0.45)), 1 - easeIn(prog(t, T_GAG_OFF - 0.1, 0.45)));
    const sk = zk * 1.45;
    const showIcons = (t < 7.6 && z > 1.2) || (t >= T_EAST - 0.4 && t < T_MASTER + 0.6) || t > T_LOOP + 0.1;
    const iconOp = (t < 7.6 ? smooth(1.0, 2.2, z) : t > T_LOOP ? smooth(T_LOOP + 0.3, T_LOOP + 0.7, t) * smooth(1.0, 2.2, z) : smooth(T_EAST - 0.4, T_EAST, t) * (1 - smooth(T_MASTER - 0.2, T_MASTER + 0.6, t))) * smooth(0.9, 1.8, z);
    if (showIcons && iconOp > 0.01) {
      const outbound = t < T_TURN || t < 7.6 || t > T_LOOP;
      if (outbound) {
        const fM = clamp(headO, 0, 1);
        const fMe = clamp(headO + gapF, 0, 1);
        const fN = clamp(headO - gapF, 0, 1);
        const pM = poseAt(OUT, fM, 0);
        const pMe = poseAt(OUT, fMe, 0);
        const pN = poseAt(OUT, fN, 0);
        // hook: "Only one came back" — two sledges dim, one stays bright (no deaths shown)
        const dimTwo = t < 7.6 ? win(t, 2.65, 7.4, 0.4, 0.4) : 0;
        // Ninnis's sledge breaks through and is gone (no figure, no gore)
        const fall = prog(t, T_FALL - 0.05, 0.75);
        const nOp = (t > T_FALL - 0.05 && !loopMode ? 1 - easeIn(fall) : 1) * (1 - 0.6 * dimTwo);
        const nScale = t > T_FALL - 0.05 && !loopMode ? 1 - 0.55 * easeIn(fall) : 1;
        const ord = [
          [pN, C.ninnis, nOp, nScale, 'NINNIS'],
          [pM, C.mawson, 1, 1, 'MAWSON'],
          [pMe, C.mertz, 1 - 0.6 * dimTwo, 1, 'MERTZ'],
        ];
        for (const [p, col, op, scl, name] of ord) {
          if (!p || op <= 0.01) continue;
          let px = p.x;
          let py = p.y;
          if (name === 'NINNIS' && t > T_FALL - 0.05 && !loopMode) {
            const cvp = OUT.at(fF);
            const q = projXY(cvp[0], cvp[1]);
            if (q) {
              px = lerp(p.x, q[0], easeOut(fall));
              py = lerp(p.y, q[1], easeOut(fall)) + 6 * easeIn(fall);
            }
          }
          mid += sledge(px, py, p.ang, sk * scl, col, { op: op * iconOp });
          mid += manDot(px - Math.cos(p.ang * D2R) * 10 * sk, py - Math.sin(p.ang * D2R) * 10 * sk, sk * scl, col, op * iconOp);
          // the one gag: hats on all three, flags beside Ninnis (Britain) and Mertz (Switzerland)
          if (hatsP > 0.01 && !loopMode) {
            const hc = name === 'MAWSON' ? ['#2E7D4F', '#F2C14E'] : name === 'NINNIS' ? ['#1F3A93', '#E8E8E8'] : ['#D52B1E', '#FFFFFF'];
            const stagger = name === 'MAWSON' ? 0 : name === 'NINNIS' ? 0.1 : 0.2;
            const hp = Math.min(cl01(prog(t, T_FRIENDS + stagger, 0.4)), 1 - easeIn(prog(t, T_GAG_OFF + stagger * 0.5, 0.45)));
            mid += hat(px, py - 22 * sk, sk * 1.05, hc[0], hc[1], hp, 6 * Math.sin(t * 3 + stagger * 9));
          }
          if (flagsP > 0.01 && !loopMode && name !== 'MAWSON') {
            mid += flagPin(px + 34 * sk, py - 6 * sk, sk * 1.1, name === 'NINNIS' ? 'uk' : 'ch', flagsP, t);
          }
          // names under the sledges while their cards are up (and while zoomed in)
          const nl = name === 'MAWSON' ? win(t, 9.9, 14.2, 0.3, 0.4) : name === 'NINNIS' ? win(t, 16.0, 20.0, 0.3, 0.4) + win(t, 23.9, T_FALL - 0.1, 0.3, 0.2) : win(t, 18.0, 20.0, 0.3, 0.4);
          if (nl > 0.01 && !loopMode) {
            const y = py + 40 * sk;
            mid += label(name, px, y, { size: 26, op: Math.min(1, nl) * op * iconOp * capClear(y), ls: 3, fill: '#fff' });
          }
        }
      } else {
        // return: Mawson ahead, Mertz behind (weakening); Mertz stops at T_MDIE; Mawson continues alone
        const fMa = clamp(rh, 0, 1);
        const turnU = easeInOut(prog(t, T_TURN, 0.9));
        const lag = fracForPx(RET, fMa, 118 * zk) + MERTZ_LAG(t);
        const fMe = t < T_MDIE ? clamp(fMa - lag, 0, 1) : clamp(HEADR(T_MDIE) - MERTZ_LAG(T_MDIE), 0, 1);
        const pMa = poseAt(RET, fMa, 0);
        const pMe = poseAt(RET, fMe, 0);
        // turning: blend from the outbound poses so the U-turn is continuous
        const fromM = poseAt(OUT, clamp(HEADO(27), 0, 1), 0);
        const fromMe = poseAt(OUT, clamp(HEADO(27) + fracForPx(OUT, HEADO(27), 124 * zk), 0, 1), 0);
        const blendPose = (p, q) => (p && q && turnU < 1 ? { x: lerp(q.x, p.x, turnU), y: lerp(q.y, p.y, turnU), ang: q.ang + angDiff(q.ang, p.ang) * turnU } : p);
        const A = blendPose(pMa, fromM);
        const B = blendPose(pMe, fromMe);
        // Mertz: weakens (dimmer, slower), stops in January 1913 → a quiet hollow ring stays at the place
        const weak = smooth(42.6, 46.5, t);
        const gone = smooth(T_MDIE, T_MDIE + 0.9, t);
        if (B) {
          const opMe = (1 - 0.35 * weak) * (1 - gone) * iconOp;
          mid += sledge(B.x, B.y, B.ang, sk, C.mertz, { op: opMe, grey: weak > 0.8 ? 0.6 : 0 });
          mid += manDot(B.x - Math.cos(B.ang * D2R) * 10 * sk, B.y - Math.sin(B.ang * D2R) * 10 * sk, sk, weak > 0.6 ? C.gone : C.mertz, opMe);
          const ringOp = win(t, T_MDIE, T_MASTER + 1.5, 0.5, 0.8) * (t > 50 ? 0.55 : 1) * iconOp;
          if (ringOp > 0.01) {
            mid += `<circle cx="${f1(B.x)}" cy="${f1(B.y)}" r="${f1(28 * zk)}" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="${f2(0.7 * ringOp)}"/>`;
            mid += ringPulse(B.x, B.y, t, T_MDIE + 0.05, 10, 80 * zk, '#ffffff', 1.9, 1, 0.55, win(t, T_MDIE, T_MDIE + 1.9, 0.1, 0.5));
          }
          const nl = win(t, 42.7, T_MDIE + 0.2, 0.3, 0.6) * iconOp;
          if (nl > 0.01) mid += label('MERTZ', B.x, B.y + 40 * sk, { size: 26, op: nl * capClear(B.y + 40 * sk), ls: 3 });
        }
        if (A) {
          // the sledge saw: the icon snaps into two halves (53.06); the back half is left where it was cut
          const snap = prog(t, T_SNAP - 0.12, 0.5);
          const cutFlash = win(t, T_SNAP - 0.5, T_SNAP + 0.1, 0.35, 0.12);
          const cutF = clamp(HEADR(T_SNAP), 0, 1);
          let man = { x: A.x - Math.cos(A.ang * D2R) * 10 * sk, y: A.y - Math.sin(A.ang * D2R) * 10 * sk };
          let manOp = iconOp;
          let manS = sk;
          // Mawson's crevasse: the sledge holds at the lip; his marker drops in on the rope, dangles, climbs out
          if (mcInfo && t > T_MFALL - 0.1 && t < T_CLIMB + 1.2) {
            const cp = projXY(mcInfo.c[0], mcInfo.c[1]);
            const drop = easeOut(prog(t, T_MFALL - 0.05, 0.5));
            const climb = easeInOut(prog(t, T_CLIMB - 0.05, 0.75));
            const k = drop * (1 - climb);
            if (cp) {
              const sway = Math.sin((t - T_MFALL) * 3.4) * 7 * zk * k * (t < T_CLIMB ? 1 : 1 - climb);
              const hx = lerp(man.x, cp[0] + sway, k);
              const hy = lerp(man.y, cp[1] + 6 * zk, k);
              front += `<path d="M${f1(A.x)} ${f1(A.y)} L${f1(hx)} ${f1(hy)}" stroke="#F6EBD3" stroke-width="${f1(2.6 * zk)}" stroke-dasharray="${f1(5 * zk)} ${f1(2.2 * zk)}" opacity="${f2(win(t, T_MFALL - 0.05, T_CLIMB + 0.9, 0.15, 0.3) * iconOp)}"/>`;
              man = { x: hx, y: hy };
              manS = sk * (1 - 0.28 * k);
              manOp = iconOp * (1 - 0.25 * k);
            }
          }
          if (t >= T_SNAP - 0.12) {
            // back half stays at the cut point, eases away and fades
            const bp2 = poseAt(RET, cutF, 0);
            if (bp2) {
              const away = easeOut(snap);
              const bx = bp2.x - Math.cos(bp2.ang * D2R) * 12 * sk * away;
              const by = bp2.y - Math.sin(bp2.ang * D2R) * 12 * sk * away + 4 * away;
              const bop = (1 - smooth(57.5, 60.0, t)) * iconOp * (1 - 0.35 * away);
              mid += `<g transform="rotate(${f1(-9 * away)} ${f1(bx)} ${f1(by)})">${sledge(bx, by, bp2.ang, sk, C.mawson, { op: bop, half: -1 })}</g>`;
            }
            mid += sledge(A.x, A.y, A.ang, sk, C.mawson, { op: iconOp, half: 1, cut: cutFlash });
          } else {
            mid += sledge(A.x, A.y, A.ang, sk, C.mawson, { op: iconOp, cut: cutFlash });
          }
          front += manDot(man.x, man.y, manS, C.mawson, manOp);
          const nl = Math.max(win(t, 33.2, 35.4, 0.3, 0.4), win(t, 48.0, 51.6, 0.3, 0.4), win(t, 54.6, 58.6, 0.3, 0.4)) * iconOp;
          if (nl > 0.01) mid += label('MAWSON', A.x, A.y + 42 * sk, { size: 26, op: nl * capClear(A.y + 42 * sk), ls: 3 });
          // VITAMIN A: one serious label beside the pair (not illustrated)
          const va = win(t, 40.05, 42.7, 0.25, 0.5);
          if (va > 0.01) {
            const vx = A.x + 40;
            const vy = A.y - 120;
            front += `<g transform="translate(${f1(vx)} ${f1(vy)}) scale(${f2(popIn(t, 40.05))})" opacity="${f2(va * capClear(vy))}" filter="url(#ds)">
              <rect x="-150" y="-36" width="300" height="72" rx="14" fill="url(#chipG)" stroke="${C.warn}" stroke-width="3"/>
              <text x="0" y="13" text-anchor="middle" font-family="${F.mont}" font-weight="900" font-size="38" letter-spacing="4" fill="#fff">VITAMIN A</text>
            </g>
            <path d="M${f1(vx - 30)} ${f1(vy + 36)} L${f1(A.x + 6)} ${f1(A.y - 14)}" stroke="#fff" stroke-width="2" opacity="${f2(0.6 * va)}"/>`;
          }
        }
      }
    }

    // --- "1912": extruded spatial year, then a small persistent chip
    if (t > T_1912 - 0.1 && t < 9.7) {
      const p = popIn(t, T_1912, 0.4);
      const op = 1 - smooth(9.0, 9.6, t);
      const y = 500 - 30 * prog(t, T_1912, 2);
      front += `<g transform="translate(540 ${f1(y)}) scale(${f2(p)})" opacity="${f2(op)}">
        ${[8, 6, 4, 2].map((k) => `<text x="${k * 0.6}" y="${k}" text-anchor="middle" font-family="${F.anton}" font-size="230" letter-spacing="6" fill="#7a4a06">1912</text>`).join('')}
        <text x="0" y="0" text-anchor="middle" font-family="${F.anton}" font-size="230" letter-spacing="6" fill="${C.gold}" stroke="#2b1500" stroke-width="5" paint-order="stroke">1912</text></g>`;
    }
    front += chip('1912', 540, 196, { op: win(t, 9.3, 20.3, 0.3, 0.4), size: 34, sc: popIn(t, 9.3) || 0 });
    // JANUARY 1913
    front += chip('JANUARY 1913', 540, 470, { op: win(t, 45.25, 48.6, 0.3, 0.6), size: 40, sc: popIn(t, 45.25) || 0, acc: '#cfe6ff' });

    // --- name cards (public-domain portraits, small, names only)
    front += nameCard(t, 'mawson', 'MAWSON', C.mawson, 9.86, 13.6, 'L');
    front += nameCard(t, 'ninnis', 'NINNIS', C.ninnis, 15.9, 20.15, 'L');
    front += nameCard(t, 'mertz', 'MERTZ', C.mertz, 17.92, 20.3, 'R');

    // --- master map: this route joins the prior Impossible Journeys (loaded polylines only)
    const mmOp = win(t, T_MASTER + 0.6, T_LOOP + 0.2, 0.6, 0.4);
    if (mmOp > 0.01 && IJL) {
      const seq = [['ep1', 'EP. 1', 75.7, [151.8, -26.0]], ['ep2', 'EP. 2', 76.0, [121.5, -6.4]], ['ep4', 'EP. 4', 76.3, [126.5, -27.2]], ['ep5', 'EP. 5', 76.6, [114.6, -30.0]]];
      for (const [k, tag, t0, at] of seq) {
        const rv = easeInOut(prog(t, t0, 1.4));
        if (rv <= 0.001) continue;
        const d = pathXY(IJL[k].slice(0, rv));
        back += `<g opacity="${f2(mmOp)}" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="${d}" stroke="#000" stroke-opacity="0.4" stroke-width="7"/>
          <path d="${d}" stroke="#ffffff" stroke-opacity="0.92" stroke-width="3.2"/></g>`;
        const p = proj(at);
        if (p) front += chip(tag, p[0], p[1], { op: mmOp * cl01(popIn(t, t0 + 0.6)), size: 24, sc: popIn(t, t0 + 0.6) || 0, acc: '#ffffff' });
      }
      // this journey, gold
      const d6 = pathXY(OUT.slice(0, fF)) + pathXY(RET.pts);
      back += `<g opacity="${f2(mmOp)}" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="${d6}" stroke="${C.route}" stroke-opacity="0.6" stroke-width="16" filter="url(#blur6)"/>
        <path d="${d6}" stroke="${C.gold}" stroke-width="5"/></g>`;
      const p6 = proj([147.5, -66.3]);
      if (p6) front += chip('EP. 6', p6[0], p6[1] - 40, { op: mmOp * cl01(popIn(t, 75.2)), size: 30, sc: popIn(t, 75.2) || 0 });
      front += chip('IMPOSSIBLE JOURNEYS', 540, 236, { op: mmOp * cl01(popIn(t, 74.7)), size: 40, sc: popIn(t, 74.7) || 0 });
    }

    return back + mid + front;
  }
  function angDiff(a, b) {
    let d = (b - a) % 360;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
  }

  // ---------------------------------------------------------------- atmosphere (sky, limb, haze, winter)
  function atmosphere(t) {
    let s = '';
    const tl = CAM.tilt * D2R;
    const yh = CAM.fy - (FOCAL * Math.cos(tl)) / Math.max(1e-3, Math.sin(tl));
    if (yh > -500) {
      const yH = Math.min(yh, H);
      s += `<rect x="0" y="0" width="${W}" height="${f1(Math.max(0, yH + 2))}" fill="url(#sky)"/>`;
      s += `<rect x="0" y="${f1(yH - 30)}" width="${W}" height="260" fill="url(#hazeTop)" opacity="0.9"/>`;
    }
    // globe limb glow when the disk edge is on screen
    if (CAM.z < 0.5) {
      const ring = [];
      for (let i = 0; i <= 96; i++) {
        const a = (i / 96) * Math.PI * 2;
        ring.push([RE * Math.cos(a), RE * Math.sin(a)]);
      }
      const d = pathXY(ring, true);
      if (d) s += `<path d="${d}" fill="none" stroke="#7fc4ff" stroke-opacity="${f2(0.5 * (1 - smooth(0.3, 0.5, CAM.z)))}" stroke-width="22" filter="url(#blur14)"/>`;
    }
    s += `<rect x="0" y="0" width="${W}" height="420" fill="url(#hazeTop)" opacity="${f2(0.55 - 0.3 * smooth(40, 10, CAM.tilt))}"/>`;
    return s;
  }
  // winter: aurora ribbons in the upper frame + wind-driven snow; no gag, just the long dark
  function winterFx(t, k) {
    if (k <= 0.01) return '';
    let s = '';
    for (let j = 0; j < 3; j++) {
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const x = -60 + i * 50;
        const y = 210 + j * 70 + 40 * Math.sin(i * 0.45 + t * (0.6 + j * 0.2) + j * 2) + 18 * Math.sin(i * 1.3 - t * 0.9 + j);
        pts.push([x, y]);
      }
      const top = pts.map((p) => [p[0], p[1] - 150 - 30 * Math.sin(p[0] * 0.01 + t + j)]);
      const d = dPts(pts) + 'L' + dPts(top.reverse()).slice(1) + 'Z';
      s += `<path d="${d}" fill="url(#${j === 1 ? 'aur2' : 'aur'})" opacity="${f2(k * (0.6 - j * 0.12))}" filter="url(#blur14)"/>`;
    }
    for (let i = 0; i < 70; i++) {
      const sp = 380 + 260 * rand(i);
      const x = ((rand(i + 3) * (W + 300) + (t - T_WINTER) * sp) % (W + 300)) - 150;
      const y = (rand(i + 7) * H + (t - T_WINTER) * 60 * rand(i + 1)) % H;
      const r = 1.2 + 2.6 * rand(i + 5);
      s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r * 3)}" ry="${f1(r)}" fill="#f2f8ff" opacity="${f2(k * (0.25 + 0.45 * rand(i + 11)))}"/>`;
    }
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
  // leading-edge tracking on the walking beats (camera follows the sledges)
  function trackPt(t) {
    if (t < T_TURN) {
      const a = OUT.at(clamp(HEADO(t), 0, 1));
      return a;
    }
    return RET.at(clamp(HEADR(t), 0, 1));
  }
  function trackW(t) {
    return Math.max(win(t, 11.2, 19.6, 0.8, 0.8) * 0.55, win(t, 34.4, 46.6, 0.8, 0.9) * 0.7, win(t, 59.2, 61.0, 0.4, 0.5) * 0.5);
  }
  window.renderFrame = function (t) {
    if (!stageEl) return;
    t = clamp(t, 0, DUR - 1e-4);
    CAM = camAt(t);
    const tw = trackW(t);
    if (tw > 0.001) {
      const q = trackPt(t);
      CAM.cx = lerp(CAM.cx, q[0], tw);
      CAM.cy = lerp(CAM.cy, q[1], tw);
    }
    M = camMatrix(CAM);
    updateMap();
    // quiet grades: the losses dim and cool the map a little; winter is the long dark
    const loss = Math.max(win(t, 27.3, 33.4, 0.6, 0.9) * 0.45, win(t, 44.8, 48.6, 0.8, 1.0) * 0.4);
    const winter = win(t, T_WINTER - 0.2, T_GLAC + 0.4, 0.9, 0.9);
    const sat = 1 - 0.3 * loss - 0.4 * winter;
    const bri = 1 - 0.14 * loss - 0.36 * winter;
    stageEl.style.filter = sat < 0.999 ? `saturate(${f2(sat)}) brightness(${f2(bri)})` : 'none';
    const gx = Math.floor(rand(Math.floor(t * 30)) * 384);
    const gy = Math.floor(rand(Math.floor(t * 30) + 0.5) * 384);
    const nightTint = winter > 0.01 ? `<rect width="${W}" height="${H}" fill="#06143a" opacity="${f2(0.3 * winter)}"/>` : '';
    ovEl.innerHTML = `${defs()}
      ${atmosphere(t)}
      ${nightTint}
      ${overlays(t)}
      ${winterFx(t, winter)}
      <rect y="${H * 0.62}" width="${W}" height="${H * 0.38}" fill="url(#botShade)" opacity="0.7"/>
      <rect width="${W}" height="${H}" fill="url(#vig)"/>
      <rect width="${W + 384}" height="${H + 384}" fill="url(#grainP)" opacity="0.05" transform="translate(${-gx} ${-gy})" style="mix-blend-mode:overlay"/>
      ${distCounter(t, HEADR(t))}
      ${hookCard(t)}
      ${captions(t, CAP_Y)}`;
  };
})();
