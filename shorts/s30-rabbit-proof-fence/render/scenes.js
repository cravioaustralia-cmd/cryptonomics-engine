/* s30 Rabbit-Proof Fence — Impossible Journeys ep.5 — MAP EXPLAINER (kinetic cartography).
 * Stack: SVG overlays + renderFrame(t) + Playwright + ffmpeg. No Remotion. Claude owns this file.
 *
 * Architecture (camera/projection engine shared with s28)
 *  - One continuous camera (keyframed lon/lat, zoom, tilt, bearing) drives everything.
 *  - Basemap = graded satellite layers (render/make_basemap.py) placed with a CSS matrix3d that is the
 *    exact projective map of a tilted ground plane, so the 3D look stays sharp at any zoom.
 *  - Every overlay (fence, footprint trails, pins, labels) is screen-space SVG projected through the
 *    same matrix, so strokes and type stay crisp.
 *  - Timing comes from transcript.json (faster-whisper on the held Atlas VO, never modified).
 *
 * Dignity lock: Stolen Generations. No gags, no emoji, no rabbits, no faces, no people drawings.
 * The girls are footprint trails and labels. Families are small pins. The daughter left behind is a pin.
 */
(function () {
  'use strict';
  const W = 1080;
  const H = 1920;
  const DUR = 94.392;
  const CAP_Y = 1344; // lower-middle band (~70%)
  const D2R = Math.PI / 180;
  const COS = Math.cos(25 * D2R);
  const LON0 = 96;
  const LAT0 = 6;
  const FOCAL = 1700;
  const mxl = (lon) => (lon - LON0) * COS;
  const myl = (lat) => LAT0 - lat;

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
    fence: '#FFD873',
    fenceCore: '#FFF6DA',
    fenceGlow: '#FFB232',
    foot: '#FFF1D6',
    foot2: '#BFEBFF',
    gone: '#9AA3AD',
    camp: '#D2493C',
    home: '#FFB547',
    ink: '#0B0F1A',
    white: '#FFFFFF',
    lake: '#F4E6E0',
    pursuit: '#E8826A',
  };
  const F = {
    mont: "Montserrat, 'Arial Black', Arial, sans-serif",
    anton: "Anton, Impact, 'Arial Black', sans-serif",
  };

  // ---------------------------------------------------------------- places (lon, lat)
  const P = {
    jig: [120.78, -23.37], // Jigalong (label confirmed in FACT_NOTES)
    moore: [116.03, -31.04], // Moore River Native Settlement, near Mogumber (label confirmed)
    perth: [115.86, -31.95],
    town: [120.24, -26.6], // the "nearby town" — deliberately UNNAMED on screen
  };

  // Rabbit-proof fence No. 1, south coast (Starvation Boat Harbour) → north coast (near Cape Keraudren),
  // via Burracoppin and past Jigalong. Approximate trace through those documented anchors (images/SOURCES.md).
  const FENCE = [
    [120.05, -33.92], [119.86, -33.45], [119.64, -32.98], [119.33, -32.48], [118.93, -31.93], [118.48, -31.4],
    [118.55, -30.6], [118.75, -29.8], [118.95, -29.0], [119.3, -28.2], [119.68, -27.42], [119.98, -26.72],
    [120.2, -25.9], [120.4, -25.02], [120.6, -24.16], [120.76, -23.42], [120.64, -22.62], [120.36, -21.72],
    [120.06, -20.86], [119.77, -19.97],
  ];
  // The 1931 walk (stylised): out of Moore River north-east across the wheatbelt, onto the fence,
  // then north along it to Jigalong. The script's 1,600 km is shown as spoken; no day-by-day route is claimed.
  const WALKP = [
    P.moore, [116.32, -30.86], [116.7, -30.66], [117.12, -30.5], [117.6, -30.38], [118.08, -30.3], [118.52, -30.12],
    [118.75, -29.8], [118.95, -29.0], [119.3, -28.2], [119.68, -27.42], [119.98, -26.72],
    [120.2, -25.9], [120.4, -25.02], [120.6, -24.16], [120.76, -23.42], [120.775, -23.385],
  ];
  // the removals (not walked): Jigalong → the camp near Perth, white dashed intent line
  const TAKENP = [P.jig, [119.7, -24.3], [118.3, -26.6], [117.0, -29.0], [116.25, -30.45], P.moore];
  // an unnamed river crossed early in the walk (map state only)
  const RIVERP = [[116.18, -30.18], [116.36, -30.42], [116.47, -30.6], [116.55, -30.74], [116.64, -30.92], [116.7, -31.12], [116.86, -31.3]];

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

  // ---------------------------------------------------------------- route geometry (map units)
  function spline(pts, per = 24) {
    const out = [];
    const p = pts.map(([lo, la]) => [mxl(lo), myl(la)]);
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
    out.push(p[p.length - 1]);
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
    const fracNear = (lon, lat) => {
      const x = mxl(lon);
      const y = myl(lat);
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
  const FL = mkLine(FENCE, 24);
  const WALK = mkLine(WALKP, 24);
  const TAKEN = mkLine(TAKENP, 18);
  const RIVER = mkLine(RIVERP, 10);
  const fR = WALK.fracNear(116.53, -30.68); // river crossing
  const fJoin = WALK.fracNear(118.75, -29.8); // walk meets the fence
  const fG = WALK.fracNear(120.02, -26.62); // Gracie turns off toward the unnamed town
  const fJigFence = FL.fracNear(...P.jig);
  // Gracie's branch: from the fence toward the town; she stops short of it
  const GB = mkLine([[...WALK.at(fG)].slice(0, 2).map((v, i) => (i ? LAT0 - v : v / COS + LON0)), [120.12, -26.6], P.town], 12);

  // head schedules (route fraction vs time). Day 1 = the escape, the morning after arriving.
  const HEAD1 = mono([
    [32.6, 0], [33.4, 0.004], [42.3, fR * 0.42], [44.4, fR * 0.58], [48.7, fR * 0.93], [50.4, fR + 0.012],
    [51.2, fR + 0.03], [56.2, 0.56], [59.45, fG], [61.7, fG + 0.04], [65.55, 1],
  ]);
  const OPEN_HEAD = (t) => 0.022 + 0.0026 * t; // opening flash-forward: trails just starting to move
  const headAt = (t) => (t < 6 ? OPEN_HEAD(t) : t > 92.9 ? OPEN_HEAD(t - 94.392 + 0.0) : HEAD1(t));
  const HEAD2 = mono([[72.45, 0], [73.4, 0.06], [75.0, 0.55], [76.25, 1]]); // second walk, ten years later
  const GRACE = mono([[59.45, 0], [60.4, 0.55], [60.95, 0.78], [61.3, 0.8]]); // her branch, stops before the town
  const fHideA = HEAD1(44.4);
  const fHideB = HEAD1(50.4);

  // ---------------------------------------------------------------- camera
  // [t, lon, lat, zoom px/deg, tilt deg, bearing deg (360 = north up), focal y]
  const OPEN = [116.3, -30.92, 600, 60, 392, 1000];
  const CAMK = [
    [0.0, ...OPEN],
    [2.6, 116.5, -30.8, 420, 57, 390, 990],
    [4.4, 118.0, -28.4, 70, 34, 372, 900],
    [5.6, 119.2, -26.3, 66, 32, 362, 900],
    [7.2, 120.74, -23.48, 430, 50, 360, 920],
    [11.0, 120.78, -23.42, 560, 54, 352, 930],
    [13.4, 120.8, -23.4, 520, 52, 346, 930],
    [16.6, 120.8, -23.42, 300, 46, 350, 920],
    [18.4, 121.5, -25.6, 36, 16, 360, 880],
    [19.6, 121.4, -25.4, 38, 18, 360, 880],
    [22.4, 120.8, -23.6, 190, 40, 360, 900],
    [24.9, 120.78, -23.5, 280, 46, 360, 910],
    [26.4, 119.7, -24.9, 110, 38, 360, 900],
    [28.1, 117.6, -28.0, 80, 34, 360, 900],
    [30.0, 115.98, -31.55, 300, 46, 364, 820],
    [31.4, 116.08, -30.98, 560, 56, 378, 950],
    [33.4, 116.2, -30.92, 600, 57, 386, 960],
    [34.8, 117.4, -29.8, 110, 38, 372, 900],
    [36.2, 119.4, -27.4, 40, 22, 360, 880],
    [39.6, 119.7, -26.6, 36, 20, 360, 880],
    [41.6, 120.66, -23.62, 210, 42, 360, 900],
    [42.5, 120.0, -24.8, 120, 38, 362, 900],
    [43.6, 116.3, -30.84, 700, 56, 384, 940],
    [47.4, 116.42, -30.76, 760, 57, 388, 950],
    [50.2, 116.55, -30.7, 640, 55, 390, 950],
    [51.6, 116.9, -30.55, 260, 48, 386, 930],
    [53.4, 117.6, -29.9, 92, 36, 372, 900],
    [55.8, 119.0, -27.4, 58, 30, 362, 890],
    [57.6, 119.95, -26.65, 300, 48, 356, 920],
    [60.6, 120.08, -26.62, 520, 54, 350, 940],
    [61.7, 120.1, -26.55, 360, 50, 354, 930],
    [63.6, 120.45, -24.8, 220, 46, 360, 920],
    [65.7, 120.78, -23.43, 520, 54, 352, 940],
    [66.9, 120.8, -23.45, 470, 52, 350, 930],
    [68.6, 119.0, -26.6, 54, 28, 360, 880],
    [70.6, 116.4, -30.6, 260, 46, 372, 920],
    [72.2, 116.1, -30.98, 520, 54, 384, 950],
    [73.6, 116.9, -30.5, 170, 42, 380, 910],
    [75.1, 119.2, -27.7, 80, 34, 366, 900],
    [76.5, 120.62, -23.75, 230, 44, 360, 910],
    [78.6, 118.4, -27.2, 50, 26, 360, 880],
    [82.0, 118.5, -27.15, 47, 25, 360, 880],
    [86.5, 118.8, -26.9, 43, 23, 358, 880],
    [89.3, 129.0, -22.0, 22, 12, 360, 860],
    [92.5, 128.4, -22.4, 21, 12, 360, 860],
    [93.6, 117.6, -29.6, 120, 40, 380, 920],
    [DUR, ...OPEN],
  ];
  const CAMI = [1, 2, 3, 4, 5, 6].map((j) =>
    mono(CAMK.map((k) => [k[0], j === 1 ? mxl(k[1]) : j === 2 ? myl(k[2]) : j === 3 ? Math.log(k[3]) : k[j]]))
  );
  function camAt(t) {
    const cx = CAMI[0](t);
    const cy = CAMI[1](t);
    const z = Math.exp(CAMI[2](t));
    const tilt = CAMI[3](t);
    const bear = CAMI[4](t);
    const fy = CAMI[5](t);
    // gentle always-on drift (screen px). At the loop seam the opening has a constant drift so the
    // last frame flows straight into frame 1.
    const dx = 6 * Math.sin(t * 0.61) + 3 * Math.sin(t * 1.37 + 1);
    const dy = 4 * Math.sin(t * 0.83 + 2);
    const env = smooth(0, 1.2, t) * (1 - smooth(DUR - 1.2, DUR, t));
    return { cx: cx + (env * dx) / z, cy: cy + (env * dy) / z, z, tilt, bear, fy, fx: 540 };
  }
  // leading-edge tracking during the walking beats
  function trackPt(t) {
    if (t > 72 && t < 77) return WALK.at(HEAD2(t));
    return WALK.at(HEAD1(t));
  }
  function trackW(t) {
    return Math.max(
      win(t, 43.9, 51.8, 0.6, 1.2) * 0.85,
      win(t, 61.9, 65.2, 0.6, 0.8) * 0.7,
      win(t, 73.0, 76.2, 0.5, 0.7) * 0.6
    );
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
  const proj = (lon, lat) => projXY(mxl(lon), myl(lat));
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
  const pathLL = (pts, closed) => pathXY(pts.map(([lo, la]) => [mxl(lo), myl(la)]), closed);
  const zs = (z) => clamp(Math.pow(z / 140, 0.45), 0.72, 1.7);

  // ---------------------------------------------------------------- DOM / assets
  const FONT_CSS = `
    @font-face{font-family:'Anton';src:url(/ep/fonts/Anton-Regular.ttf) format('truetype');font-weight:400;}
    @font-face{font-family:'Montserrat';src:url(/ep/fonts/Montserrat-800.ttf) format('truetype');font-weight:800;}
    @font-face{font-family:'Montserrat';src:url(/ep/fonts/Montserrat-900.ttf) format('truetype');font-weight:900;}
    #stage{position:relative;width:1080px;height:1920px;overflow:hidden;background:#061533}
    #map{position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:hidden}
    #map img{position:absolute;left:0;top:0;transform-origin:0 0;display:block;max-width:none;backface-visibility:hidden}
    #map img.feather{
      -webkit-mask-image:linear-gradient(to right,transparent 0,#000 5%,#000 95%,transparent 100%),linear-gradient(to bottom,transparent 0,#000 5%,#000 95%,transparent 100%);
      -webkit-mask-composite:source-in;mask-composite:intersect}
    #map img.featherBase{
      -webkit-mask-image:linear-gradient(to right,transparent 0,#000 3%,#000 97%,transparent 100%),linear-gradient(to bottom,transparent 0,#000 4%,#000 96%,transparent 100%);
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
    IJL = {
      ep1: mkLine(window.IJ.ep1.pts, 4),
      ep2: mkLine(window.IJ.ep2.pts, 2),
      ep4: mkLine(window.IJ.ep4.pts, 10),
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
      im.className = name === 'base' ? 'featherBase' : 'feather';
      mapEl.appendChild(im);
      decs.push(im.decode().catch(() => {}));
      LAYERS.push({ name, el: im, A: [1 / L.K, 0, mxl(L.lon0), 0, 1 / L.K, myl(L.latT), 0, 0, 1], ...L });
    }
    const g = new Image();
    g.src = GRAIN;
    decs.push(g.decode().catch(() => {}));
    decs.push(document.fonts.load("400 100px 'Anton'"), document.fonts.load("800 40px 'Montserrat'"), document.fonts.load("900 40px 'Montserrat'"));
    await Promise.all(decs);
    const tr = await (await fetch('/transcript.json')).json();
    window.EPISODE = { duration: DUR, fps: 30, words: tr.words, scenes: [], images: {} };
  })();

  const LAYER_Z = { base: [0, 0], wa: [52, 80], moore: [280, 400], jigalong: [280, 400] };
  function updateMap() {
    for (const L of LAYERS) {
      const [z0, z1] = LAYER_Z[L.name] || [0, 0];
      let op = L.name === 'base' ? 1 : smooth(z0, z1, CAM.z);
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
      <filter id="blur3" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="blur6" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="blur14" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0b1f45"/><stop offset="0.55" stop-color="#2f5f98"/><stop offset="1" stop-color="#a9c9e2"/></linearGradient>
      <linearGradient id="hazeTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#c9e3f5" stop-opacity="0.30"/><stop offset="1" stop-color="#c9e3f5" stop-opacity="0"/></linearGradient>
      <linearGradient id="botShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></linearGradient>
      <radialGradient id="vig" cx="0.5" cy="0.46" r="0.78"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></radialGradient>
      <radialGradient id="homeGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFE3A3" stop-opacity="0.9"/><stop offset="0.4" stop-color="#FFB547" stop-opacity="0.35"/><stop offset="1" stop-color="#FFB547" stop-opacity="0"/></radialGradient>
      <radialGradient id="spot" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/></radialGradient>
      <linearGradient id="chipG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a2233" stop-opacity="0.92"/><stop offset="1" stop-color="#0b0f1a" stop-opacity="0.92"/></linearGradient>
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
    const rot = o.rot || 0;
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${f2(sc)})" opacity="${f2(op)}">
      <text x="3" y="5" text-anchor="${anchor}" font-family="${font}" font-weight="${fw}" font-size="${size}" letter-spacing="${ls}" fill="#000" opacity="0.45">${esc(text)}</text>
      <text x="0" y="0" text-anchor="${anchor}" font-family="${font}" font-weight="${fw}" font-size="${size}" letter-spacing="${ls}" fill="${fill}"
        stroke="rgba(10,10,14,0.85)" stroke-width="${f1(size * 0.16)}" stroke-linejoin="round" paint-order="stroke">${esc(text)}</text>
    </g>`;
  }
  const capClear = (y) => 1 - Math.min(smooth(1210, 1265, y), 1 - smooth(1420, 1470, y));
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
  // map pin (drop + squash); col = inner dot colour
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
  function dotGlow(x, y, r, col, op = 1, core = '#fff') {
    if (op <= 0.01) return '';
    return `<g opacity="${f2(op)}">
      <circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 2.6)}" fill="${col}" opacity="0.35" filter="url(#blur6)"/>
      <circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r + 2)}" fill="#000" opacity="0.45"/>
      <circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${col}"/>
      <circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 0.45)}" fill="${core}"/>
    </g>`;
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
  // dimension line running parallel to a screen polyline, arrowheads both ends, yellow value
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

  // The fence: a glowing guiding thread. reveal = fraction drawn from the south coast; level = brightness 0..1
  function fenceThread(t, reveal, level) {
    if (reveal <= 0.001 || level <= 0.01) return '';
    const sl = FL.slice(0, reveal);
    const d = pathXY(sl);
    if (!d) return '';
    const zk = zs(CAM.z);
    const w = 2.2 + 1.4 * zk;
    const flow = -((t * 90) % 260);
    let s = `<g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="${d}" stroke="#000" stroke-opacity="${f2(0.35 * level)}" stroke-width="${f1(w + 5)}" transform="translate(0 3)" filter="url(#blur3)"/>
      <path d="${d}" stroke="${C.fenceGlow}" stroke-opacity="${f2(0.55 * level)}" stroke-width="${f1(w * 6)}" filter="url(#blur14)"/>
      <path d="${d}" stroke="${C.fence}" stroke-opacity="${f2(0.75 * level)}" stroke-width="${f1(w * 2.2)}" filter="url(#blur3)"/>
      <path d="${d}" stroke="${C.fenceCore}" stroke-opacity="${f2(0.95 * Math.min(1, level * 1.4))}" stroke-width="${f1(w)}"/>
      <path d="${d}" stroke="#fff" stroke-opacity="${f2(0.7 * level)}" stroke-width="${f1(w * 0.9)}" stroke-dasharray="26 234" stroke-dashoffset="${f1(flow)}"/>
    </g>`;
    if (reveal < 0.999) {
      const h = FL.at(reveal);
      const p = projXY(h[0], h[1]);
      if (p) {
        s += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${f1(26 * zk)}" fill="${C.fence}" opacity="${f2(0.55 * level)}" filter="url(#blur14)"/>
          <circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${f1(5 * zk)}" fill="#fff" opacity="${f2(level)}"/>`;
      }
    }
    return s;
  }

  // Footprint trail: two staggered rows of small dots (left/right feet) along a route slice.
  // segs: [[f0, f1, opacityMultiplier], ...]
  function footTrail(line, segs, off, col, op) {
    if (op <= 0.01) return '';
    const zk = zs(CAM.z);
    const sp = clamp(11 * zk, 6.5, 17);
    const fw = clamp(3.2 * zk, 2.4, 5.2);
    const gap = clamp(2.6 * zk, 1.8, 4.4);
    let s = '';
    for (const [a, b, m] of segs) {
      if (b - a < 1e-5 || m * op <= 0.01) continue;
      const pts = screenPts(line.slice(a, b));
      if (pts.length < 2) continue;
      const base = offsetPolyline(pts, off);
      const L1 = dPts(offsetPolyline(base, -gap));
      const L2 = dPts(offsetPolyline(base, gap));
      s += `<g opacity="${f2(op * m)}" fill="none" stroke-linecap="round">
        <path d="${dPts(base)}" stroke="#000" stroke-opacity="0.22" stroke-width="${f1(fw * 3.2)}" stroke-linejoin="round"/>
        <path d="${L1}" stroke="${col}" stroke-width="${f1(fw)}" stroke-dasharray="0.01 ${f1(sp)}"/>
        <path d="${L2}" stroke="${col}" stroke-width="${f1(fw)}" stroke-dasharray="0.01 ${f1(sp)}" stroke-dashoffset="${f1(sp / 2)}"/>
      </g>`;
    }
    return s;
  }
  // screen point of a route fraction shifted sideways by off px
  function sideAt(line, f, off) {
    const a = line.at(Math.max(0, f - 0.002));
    const b = line.at(Math.min(1, f + 0.002));
    const pa = projXY(a[0], a[1]);
    const pb = projXY(b[0], b[1]);
    const c = line.at(f);
    const pc = projXY(c[0], c[1]);
    if (!pa || !pb || !pc) return pc;
    const dx = pb[0] - pa[0];
    const dy = pb[1] - pa[1];
    const L = Math.hypot(dx, dy) || 1;
    return [pc[0] - (dy / L) * off, pc[1] + (dx / L) * off, pc[2]];
  }

  // ---------------------------------------------------------------- the big custom pieces
  // Frame-1 hook card (never spoken). Clears by ~1.5 s; re-slams on the last beat so the loop matches.
  function hookCard(t) {
    let sc = 1;
    let op = 1;
    let dy = 0;
    if (t < 5) {
      const p = prog(t, 1.15, 0.4);
      op = 1 - easeIn(p);
      dy = -80 * easeIn(p);
      sc = 1 + 0.05 * p;
    } else {
      const p = prog(t, 94.08, 0.28);
      if (p <= 0) return '';
      sc = lerp(1.6, 1, easeOutBack(p, 1.3));
      op = cl01(p * 3);
    }
    if (op <= 0.001) return '';
    return `<g transform="translate(540 ${f1(560 + dy)}) rotate(-2.5) scale(${f2(sc * 0.9)})" opacity="${f2(op)}">
      <g filter="url(#ds)">
        <rect x="-410" y="-172" width="820" height="328" rx="26" fill="rgba(9,12,22,0.80)" stroke="${C.gold}" stroke-width="5"/>
        <rect x="-388" y="-150" width="776" height="284" rx="16" fill="none" stroke="#fff" stroke-opacity="0.18" stroke-width="2"/>
      </g>
      <text x="0" y="-14" text-anchor="middle" font-family="${F.anton}" font-size="156" letter-spacing="2" fill="${C.gold}" stroke="#000" stroke-width="10" paint-order="stroke">1,600 km.</text>
      <text x="0" y="122" text-anchor="middle" font-family="${F.anton}" font-size="128" letter-spacing="6" fill="#fff" stroke="#000" stroke-width="9" paint-order="stroke">NO MAP</text>
    </g>`;
  }

  // Day counter (escape = day 1). Ticks on the clock only; lands on NINE WEEKS on the spoken words.
  function dayCounter(t) {
    const op = win(t, 32.7, 66.9, 0.3, 0.5);
    if (op <= 0.01) return '';
    const big = Math.max(win(t, 50.7, 56.4, 0.5, 0.6), win(t, 61.75, 66.9, 0.3, 0.5));
    const y = lerp(214, 236, big);
    const x = lerp(230, 262, big);
    const sc = lerp(0.74, 0.95, big) * (t < 33.4 ? popIn(t, 32.7, 0.4) : 1);
    if (t >= 61.9) {
      const p = popIn(t, 61.9, 0.45);
      return `<g transform="translate(540 300) scale(${f2(1.12 * p)})" opacity="${f2(op)}" filter="url(#ds)">
        <rect x="-300" y="-74" width="600" height="148" rx="30" fill="url(#chipG)" stroke="${C.gold}" stroke-width="4"/>
        <text x="0" y="40" text-anchor="middle" font-family="${F.anton}" font-size="112" letter-spacing="4" fill="${C.gold}" stroke="#000" stroke-width="6" paint-order="stroke">NINE WEEKS</text>
      </g>`;
    }
    const day = 1 + Math.floor(62 * cl01((t - 32.7) / (61.85 - 32.7)));
    const frac = (62 * cl01((t - 32.7) / (61.85 - 32.7))) % 1;
    const kick = 1 + 0.06 * Math.max(0, 1 - frac * 5);
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f2(sc)})" opacity="${f2(op)}" filter="url(#ds)">
      <rect x="-200" y="-66" width="400" height="132" rx="26" fill="url(#chipG)" stroke="${C.gold}" stroke-width="3.5"/>
      <text x="-150" y="22" text-anchor="start" font-family="${F.mont}" font-weight="900" font-size="44" letter-spacing="5" fill="#fff" opacity="0.85">DAY</text>
      <g transform="translate(90 34) scale(${f2(kick)})"><text x="0" y="0" text-anchor="middle" font-family="${F.anton}" font-size="104" letter-spacing="2" fill="${C.gold}" stroke="#000" stroke-width="5" paint-order="stroke">${day}</text></g>
    </g>`;
  }

  // ---------------------------------------------------------------- overlays per frame
  function overlays(t) {
    let back = '';
    let front = '';
    const z = CAM.z;
    const zk = zs(z);

    // --- coast / borders context (zoomed-out only)
    const ctxOp = 1 - smooth(60, 120, z);
    if (ctxOp > 0.01 && window.GEO) {
      let dC = '';
      for (const r of GEO.coast) dC += pathLL(r, true);
      back += `<path d="${dC}" fill="none" stroke="#fff" stroke-opacity="${f2(0.14 * ctxOp)}" stroke-width="9" stroke-linejoin="round"/>
        <path d="${dC}" fill="none" stroke="#fff" stroke-opacity="${f2(0.5 * ctxOp)}" stroke-width="1.6" stroke-linejoin="round"/>`;
      let dB = '';
      for (const l of GEO.borders) dB += pathLL(l, false);
      back += `<path d="${dB}" fill="none" stroke="#fff" stroke-opacity="${f2(0.26 * ctxOp)}" stroke-width="1.6" stroke-dasharray="7 6"/>`;
    }

    // --- Western Australia region highlight (17.9–19.9, and a soft hold on the pull-backs)
    const waOp = Math.max(win(t, 17.85, 20.2, 0.35, 0.8), 0.45 * win(t, 77.5, 87.4, 1.0, 0.8));
    if (waOp > 0.01 && window.GEO) {
      const d = pathLL(GEO.wa, true);
      back += `<g opacity="${f2(waOp)}">
        <path d="${d}" fill="${C.gold}" fill-opacity="0.10" stroke="#fff" stroke-opacity="0.35" stroke-width="12" stroke-linejoin="round" filter="url(#blur6)"/>
        <path d="${d}" fill="none" stroke="#fff" stroke-width="3.2" stroke-linejoin="round"/>
      </g>`;
      const p = proj(122.4, -26.4);
      const big = win(t, 17.85, 20.2, 0.35, 0.8);
      if (p && big > 0.01) back += label('WESTERN AUSTRALIA', p[0], p[1], { size: 50, op: big, sc: popIn(t, 17.95), ls: 4 });
    }

    // --- terrain beats along the fence (farms 53.4 · sand dunes 54.6 · salt lakes 55.2), unlabelled map texture
    const farmOp = win(t, 53.3, 56.6, 0.5, 0.6);
    if (farmOp > 0.01) {
      // paddock grid across the wheatbelt (between the camp and the fence), faded toward the edges
      const cx = 117.3;
      const cy = -30.75;
      const rev = easeOut(prog(t, 53.35, 0.9));
      let s1 = '';
      for (let i = -8; i <= 8; i++) {
        for (let j = -6; j <= 6; j++) {
          const e = (i / 8.5) ** 2 + (j / 6.5) ** 2;
          if (e > 1 || rand(i * 31 + j * 7) > rev * 1.1) continue;
          const lon = cx + i * 0.16;
          const lat = cy + j * 0.13;
          const tone = rand(i * 13 + j * 5 + 2);
          const fill = tone < 0.33 ? '#D9E8A0' : tone < 0.66 ? '#E8D28E' : '#B8D58A';
          s1 += `<path d="${pathLL([[lon, lat], [lon + 0.145, lat], [lon + 0.145, lat - 0.115], [lon, lat - 0.115]], true)}" fill="${fill}" fill-opacity="${f2(0.28 * (1 - e * 0.7))}" stroke="#F4F9DC" stroke-opacity="${f2(0.65 * (1 - e * 0.6))}" stroke-width="1.4"/>`;
        }
      }
      back += `<g opacity="${f2(farmOp)}">${s1}</g>`;
    }
    const duneOp = win(t, 54.4, 56.7, 0.5, 0.6);
    if (duneOp > 0.01) {
      // linear dune ridges in the sandy country beside the fence (north of the town, south of home)
      let dd = '';
      const rev = easeOut(prog(t, 54.45, 0.9));
      for (let r = 0; r < 16; r++) {
        const lat = -24.2 - r * 0.12;
        const pts = [];
        const k0 = Math.floor(rand(r + 40) * 8);
        const n = Math.round((18 + 14 * rand(r + 60)) * rev);
        for (let k = k0; k <= k0 + n; k++) {
          const lon = 120.7 + k * 0.05;
          pts.push([lon, lat + 0.04 * Math.sin(k * 0.7 + r * 1.9) + 0.02 * Math.sin(k * 2.1 + r)]);
        }
        if (pts.length > 1) dd += pathLL(pts);
      }
      back += `<g opacity="${f2(duneOp)}" fill="none" stroke-linecap="round">
        <path d="${dd}" stroke="#5a2a0c" stroke-opacity="0.55" stroke-width="5" transform="translate(0 2)"/>
        <path d="${dd}" stroke="#FFD9A0" stroke-opacity="0.9" stroke-width="2.6"/></g>`;
    }
    const lakeOp = win(t, 55.15, 56.8, 0.4, 0.6);
    if (lakeOp > 0.01 && window.GEO) {
      let dl = '';
      for (const l of GEO.lakes) if (l.name === 'Lake Moore' || l.name === 'Lake Barlee') dl += pathLL(l.pts, true);
      const pulse = 0.75 + 0.25 * Math.sin((t - 55.2) * 5);
      back += `<g opacity="${f2(lakeOp * cl01(popIn(t, 55.2, 0.4)))}">
        <path d="${dl}" fill="${C.lake}" fill-opacity="0.55" stroke="#fff" stroke-opacity="${f2(0.6 * pulse)}" stroke-width="16" filter="url(#blur6)"/>
        <path d="${dl}" fill="none" stroke="#fff" stroke-width="3"/>
      </g>`;
    }

    // --- the fence thread
    let fReveal = 0;
    let fLevel = 0;
    if (t < 6.2) {
      fReveal = 1;
      fLevel = 0.42 * (1 - smooth(5.2, 6.1, t));
    } else if (t >= 35.3) {
      fReveal = easeInOut(prog(t, 35.3, 4.7));
      fLevel = 1 - 0.58 * smooth(92.9, 94.1, t);
    }
    back += fenceThread(t, fReveal, fLevel);
    // fence label (rotated along the thread)
    const fLabOp = win(t, 37.6, 40.0, 0.4, 0.4);
    if (fLabOp > 0.01) {
      const a = FL.at(0.3);
      const b = FL.at(0.34);
      const pa = projXY(a[0], a[1]);
      const pb = projXY(b[0], b[1]);
      if (pa && pb) {
        let ang = (Math.atan2(pb[1] - pa[1], pb[0] - pa[0]) * 180) / Math.PI;
        if (ang > 90) ang -= 180;
        if (ang < -90) ang += 180;
        back += label('RABBIT-PROOF FENCE', pa[0] + 40, pa[1], { size: 44, rot: ang, op: fLabOp, sc: popIn(t, 37.6), anchor: 'middle', fill: C.fenceCore });
      }
    }
    // "passes right by home": ring where the thread meets Jigalong
    const byHome = win(t, 40.6, 42.6, 0.3, 0.5);
    if (byHome > 0.01) {
      const p = proj(...P.jig);
      if (p) back += ringPulse(p[0], p[1], t, 40.6, 10, 90 * zk, C.fence, 1.1, 2, 0.55, byHome);
    }

    // --- the unnamed river (map state only)
    const rivOp = win(t, 48.6, 51.8, 0.4, 0.8);
    if (rivOp > 0.01) {
      const d = pathXY(RIVER.slice(0, easeOut(prog(t, 48.6, 0.8))));
      const sh = -((t * 30) % 30);
      back += `<g opacity="${f2(rivOp)}" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="${d}" stroke="#2b7fc4" stroke-opacity="0.6" stroke-width="${f1(26 * zk)}" filter="url(#blur6)"/>
        <path d="${d}" stroke="#58b9ef" stroke-width="${f1(9 * zk)}"/>
        <path d="${d}" stroke="#d9f4ff" stroke-opacity="0.8" stroke-width="${f1(2.2 * zk)}" stroke-dasharray="14 16" stroke-dashoffset="${f1(sh)}"/>
      </g>`;
      // crossing ripple at the trail
      const c = WALK.at(fR);
      const p = projXY(c[0], c[1]);
      if (p) back += ringPulse(p[0], p[1], t, 49.1, 8, 60 * zk, '#d9f4ff', 0.9, 2, 0.5, win(t, 49.1, 50.7, 0.2, 0.4));
    }

    // --- the removal (taken south): white dashed intent line, 25.3–30.6; again ten years later 68.3–70.4
    const takenOp = Math.max(win(t, 25.3, 31.4, 0.3, 0.8), win(t, 68.2, 71.0, 0.3, 0.7));
    if (takenOp > 0.01) {
      const rv = t < 40 ? easeInOut(prog(t, 25.35, 4.4)) : easeInOut(prog(t, 68.25, 1.9));
      const sl = TAKEN.slice(0, rv);
      back += dashed(pathXY(sl), 4.5, takenOp * 0.95, { flow: true, t });
      const sp = screenPts(sl);
      if (sp.length > 3) back += arrowHead(sp[sp.length - 1][0], sp[sp.length - 1][1], angOf(sp), 0.95 * zk, '#fff');
      // 1,600 km on "far to the south"
      const kmOp = win(t, 27.5, 31.0, 0.3, 0.5);
      if (kmOp > 0.01 && rv > 0.3) {
        const full = screenPts(TAKEN.slice(0, 1));
        back += dimension(full, -46, '1,600 KM', kmOp * smooth(0.3, 0.6, rv), { at: 0.45, dx: -70, sc: popIn(t, 27.6) });
      }
    }

    // --- pins: Jigalong (home), Moore River (camp), Perth
    const jigOp = (t < 6 ? win(t, 4.3, 6.3, 0.3, 0.5) : 0) + (t >= 6 ? win(t, 13.8, 92.9, 0.2, 0.6) * (1 - win(t, 17.8, 20.3, 0.3, 0.5) * 0.6) : 0);
    const jp = proj(...P.jig);
    if (jp && jigOp > 0.01) {
      const homeGlow = Math.max(win(t, 4.3, 6.2, 0.3, 0.6), win(t, 64.6, 67.3, 0.4, 0.8), win(t, 75.6, 77.5, 0.3, 0.8));
      if (homeGlow > 0.01) {
        back += `<ellipse cx="${f1(jp[0])}" cy="${f1(jp[1])}" rx="${f1(170 * zk)}" ry="${f1(90 * zk)}" fill="url(#homeGlow)" opacity="${f2(homeGlow)}"/>`;
        back += ringPulse(jp[0], jp[1], t, 0, 14, 110 * zk, C.home, 1.5, 2, 0.55, homeGlow);
      }
      back += pin(jp[0], jp[1], zk * 0.95 * clamp(jp[2], 0.6, 1.4), t < 6 ? 4.35 : 13.9, t, C.home, jigOp);
      const labOp = jigOp * (t < 6 ? 1 : cl01(popIn(t, 14.6)));
      back += label('JIGALONG', jp[0], jp[1] - 64 * zk - 12, { size: lerp(32, 46, smooth(80, 300, z)), op: labOp * capClear(jp[1] - 64 * zk - 12), sc: t < 6 ? popIn(t, 4.45) : popIn(t, 14.6) || 0 });
    }
    const mrOp = win(t, 29.4, 92.9, 0.2, 0.6) * (1 - 0.5 * win(t, 86.6, 93.0, 0.5, 0.5)) + (t < 6 ? 0.9 * (1 - smooth(4.0, 5.0, t)) : 0) + (t > 93 ? smooth(93.4, 94.0, t) * 0.9 : 0);
    const mp = proj(...P.moore);
    if (mp && mrOp > 0.01) {
      const t0 = t < 6 || t > 93 ? -1 : 29.5;
      back += pin(mp[0], mp[1], zk * 0.95 * clamp(mp[2], 0.6, 1.4), t0, t, C.camp, Math.min(1, mrOp));
      const lo = Math.min(1, mrOp) * (t0 < 0 ? 1 : cl01(popIn(t, 29.7)));
      back += label('MOORE RIVER', mp[0], mp[1] + 40 * zk + 8, { size: lerp(30, 42, smooth(80, 300, z)), op: lo * capClear(mp[1] + 40 * zk + 8), anchor: 'middle', sc: t0 < 0 ? 1 : popIn(t, 29.7) || 0 });
    }
    const peOp = win(t, 30.1, 31.9, 0.2, 0.4) + win(t, 70.4, 72.6, 0.3, 0.5);
    const pp = proj(...P.perth);
    if (pp && peOp > 0.01) {
      back += dotGlow(pp[0], pp[1], 7 * zk, '#ffffff', peOp, '#ffffff');
      back += label('PERTH', pp[0] + 18 * zk, pp[1] - 8, { size: 34, op: peOp * capClear(pp[1]), anchor: 'start', sc: t < 40 ? popIn(t, 30.2) : 1 });
    }

    // --- families at Jigalong: small warm pins (no people drawn)
    const famOp = Math.max(win(t, 14.9, 25.6, 0.5, 0.6), win(t, 64.4, 70.0, 0.6, 0.8), win(t, 75.6, 86.8, 0.6, 0.8)) * (t >= 6 ? 1 : 0);
    if (jp && famOp > 0.01) {
      const dim = 1 - 0.55 * win(t, 22.0, 25.6, 0.8, 0.3); // "away from their mothers"
      for (let i = 0; i < 9; i++) {
        const a = rand(i + 3) * Math.PI * 2;
        const r = (34 + 46 * rand(i + 11)) * zk;
        const x = jp[0] + Math.cos(a) * r;
        const y = jp[1] + Math.sin(a) * r * 0.55 + 6;
        const pi = cl01(popIn(t, 15.4 + i * 0.07));
        back += dotGlow(x, y, 4.2 * zk * Math.max(pi, t > 60 ? 1 : 0), C.home, famOp * dim, '#FFF4DE');
      }
    }

    // --- the three girls
    const zoomedIn = smooth(150, 300, z);
    // (a) at Jigalong before the removal (6–25.3): three marked dots with names + ages
    const atHomeOp = win(t, 6.6, 25.6, 0.4, 0.3);
    if (jp && atHomeOp > 0.01) {
      const names = [['MOLLY', 'ABOUT 14', 7.5], ['DAISY', 'ABOUT 8', 9.74], ['GRACIE', 'ABOUT 11', 11.78]];
      const base = [jp[0] - 4, jp[1] + 74 * zk];
      names.forEach(([n, age, t0], i) => {
        const x = base[0] + (i - 1) * 168 * zk;
        const y = base[1] + (i === 1 ? 26 : 0) * zk;
        const pp2 = cl01(popIn(t, t0, 0.4));
        back += dotGlow(x, y, 8 * zk, C.foot, atHomeOp * Math.max(0.35, pp2) * (t > 6.8 ? 1 : 0), '#fff');
        const lop = atHomeOp * pp2 * (1 - win(t, 17.8, 20.4, 0.3, 0.5));
        back += label(n, x, y + 56 * zk, { size: 34 * Math.min(zk, 1.3), op: lop, sc: popIn(t, t0) || 0, ls: 3 });
        back += label(age, x, y + 92 * zk, { size: 22 * Math.min(zk, 1.3), op: lop * 0.9, fill: C.goldHi, ls: 2, fw: 800 });
      });
    }
    // (b) being taken (25.3–30.4): three dim dots carried along the dashed line, then at the camp
    const ridOp = win(t, 25.6, 33.0, 0.3, 0.4);
    if (ridOp > 0.01) {
      const rv = easeInOut(prog(t, 25.6, 4.6));
      for (let i = 0; i < 3; i++) {
        const q = TAKEN.at(Math.max(0, rv - i * 0.004));
        const p = projXY(q[0], q[1]);
        if (p) back += dotGlow(p[0] + (i - 1) * 9 * zk, p[1] + (i === 1 ? 6 : 0), 6 * zk, C.foot, ridOp * 0.85, '#fff');
      }
    }

    // (c) the walk. Molly leads (centre), Daisy and Gracie either side.
    const OFFS = [0, -9, 9];
    const walkOp = (t < 6 ? 1 - smooth(5.3, 6.1, t) : win(t, 32.4, 92.9, 0.3, 0.6)) + (t > 93 ? smooth(93.3, 93.9, t) : 0);
    if (walkOp > 0.01) {
      const loopMode = t < 6 || t > 93;
      const h = loopMode ? (t < 6 ? OPEN_HEAD(t) : OPEN_HEAD(t - DUR)) : HEAD1(t);
      const hs = clamp(h, 0, 1);
      const caught = smooth(60.9, 61.35, t);
      const hideM = t > 44.4 ? smooth(44.5, 45.6, t) : 0; // hidden footprints fade
      const segFor = (head) => {
        if (loopMode) return [[0, head, 1]];
        const a = Math.min(head, fHideA);
        const b = Math.min(head, fHideB);
        return [[0, a, 1], [a, b, 1 - 0.78 * hideM], [b, head, 1]];
      };
      // Gracie: rides the walk to fG, then her branch toward the unnamed town; stops (caught)
      const gHead = Math.min(hs, fG);
      const gCol = caught > 0.5 ? C.gone : C.foot;
      back += footTrail(WALK, segFor(gHead), OFFS[2] * zk, gCol, walkOp * (1 - 0.45 * caught));
      const gb = t > 59.45 && !loopMode ? GRACE(t) : 0;
      if (gb > 0.001) {
        const sl = GB.slice(0, gb);
        const pts = screenPts(sl);
        if (pts.length > 1) {
          back += footTrail(GB, [[0, gb, 1]], 0, gCol, walkOp * (1 - 0.45 * caught));
        }
      }
      // Molly + Daisy
      back += footTrail(WALK, segFor(hs), OFFS[1] * zk, C.foot, walkOp);
      back += footTrail(WALK, segFor(hs), OFFS[0] * zk, C.foot, walkOp);
      // heads
      const headsOp = walkOp * (loopMode ? 1 : 1 - smooth(66.3, 67.2, t));
      const pM = sideAt(WALK, hs, OFFS[0] * zk);
      const pD = sideAt(WALK, Math.max(0, hs - 0.0025), OFFS[1] * zk);
      let pG;
      if (gb > 0.001) {
        const q = GB.at(gb);
        pG = projXY(q[0], q[1]);
      } else pG = sideAt(WALK, Math.max(0, gHead - 0.0045), OFFS[2] * zk);
      const r = 6.5 * zk * (loopMode ? 1.3 : 1);
      if (pG) {
        if (caught > 0.01) {
          back += `<circle cx="${f1(pG[0])}" cy="${f1(pG[1])}" r="${f1(r * 1.6)}" fill="none" stroke="${C.gone}" stroke-width="3" opacity="${f2(headsOp * caught)}"/>`;
          back += ringPulse(pG[0], pG[1], t, 60.92, 8, 70 * zk, '#ffffff', 1.4, 1, 0.55, win(t, 60.92, 62.4, 0.1, 0.4));
        }
        back += dotGlow(pG[0], pG[1], r, C.foot, headsOp * (1 - caught), '#fff');
      }
      if (pD) back += dotGlow(pD[0], pD[1], r, C.foot, headsOp, '#fff');
      if (pM) back += dotGlow(pM[0], pM[1], r * 1.08, C.foot, headsOp, '#fff');
      // trio label while zoomed in on the walk
      const trioOp = headsOp * zoomedIn * (loopMode ? 0 : Math.max(win(t, 32.9, 34.6, 0.3, 0.4), win(t, 43.6, 51.6, 0.4, 0.5), win(t, 57.2, 60.0, 0.4, 0.4)));
      if (pM && trioOp > 0.01) {
        const nearPin = mp ? Math.hypot(pM[0] - mp[0], pM[1] - mp[1]) < 90 : false;
        back += label('MOLLY · DAISY · GRACIE', pM[0] + (nearPin ? 60 : 0), pM[1] - (nearPin ? 96 : 44) * zk, { size: 28, op: trioOp, ls: 2 });
      }
      const duoOp = headsOp * Math.max(win(t, 61.6, 64.4, 0.3, 0.4) * smooth(120, 260, z), 0);
      if (pM && duoOp > 0.01) back += label('MOLLY · DAISY', pM[0], pM[1] - 44 * zk, { size: 30, op: duoOp, ls: 2 });
      const gLab = headsOp * win(t, 57.0, 63.0, 0.4, 0.6) * zoomedIn * (gb > 0.001 || t < 59.6 ? 1 : 0);
      if (pG && gLab > 0.01 && t > 59.4) back += label('GRACIE', pG[0] + 18, pG[1] + 46 * zk, { size: 28, op: gLab, ls: 2, anchor: 'start', fill: caught > 0.5 ? '#d6dbe0' : '#fff' });
      // the unnamed town: a small grey dot, no name
      const townOp = win(t, 57.5, 66.0, 0.5, 0.8);
      const tp = proj(...P.town);
      if (tp && townOp > 0.01) {
        back += `<g opacity="${f2(townOp)}"><circle cx="${f1(tp[0])}" cy="${f1(tp[1])}" r="${f1(9 * zk)}" fill="#e8ecef" stroke="#1a1f29" stroke-width="3"/>
          <circle cx="${f1(tp[0])}" cy="${f1(tp[1])}" r="${f1(22 * zk)}" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="2" stroke-dasharray="4 5"/></g>`;
      }
      // the tracker: a muted dashed pursuit line that loses the trail where the footprints were hidden
      const trOp = win(t, 42.5, 47.6, 0.4, 1.2);
      if (trOp > 0.01 && !loopMode) {
        const tf = Math.min(fHideA + 0.004, HEAD1(42.5) * 0.25 + (HEAD1(Math.min(t, 45.4)) - HEAD1(42.5) * 0.25) * easeOut(prog(t, 42.6, 2.6)) * 0.92);
        const sl = WALK.slice(0, Math.max(0.0005, tf));
        back += dashed(pathXY(sl), 4.6, trOp, { col: C.pursuit });
        const q = WALK.at(tf);
        const p = projXY(q[0], q[1]);
        if (p) {
          const lost = smooth(45.0, 46.2, t);
          back += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${f1(9 * zk)}" fill="none" stroke="${C.pursuit}" stroke-width="3.5" opacity="${f2(trOp)}"/>`;
          if (lost > 0.01) back += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${f1((12 + 40 * lost) * zk)}" fill="none" stroke="${C.pursuit}" stroke-width="2" stroke-dasharray="5 6" opacity="${f2(trOp * (1 - lost * 0.6))}"/>`;
          const tl = win(t, 42.7, 45.6, 0.3, 0.4);
          if (tl > 0.01) back += label('TRACKER', p[0] - 34 * zk, p[1] - 30 * zk, { size: 24, op: tl, ls: 3, fill: '#F3C9BE', anchor: 'end' });
        }
      }
      // burrows: small dark notches beside the trail at the night stops (map marks only)
      const burOp = win(t, 46.1, 51.8, 0.3, 0.8);
      if (burOp > 0.01 && !loopMode) {
        [0.3, 0.55, 0.8].forEach((k, i) => {
          const f = fR * k;
          if (f > hs) return;
          const p = sideAt(WALK, f, 26 * zk);
          if (!p) return;
          const pi = cl01(popIn(t, 46.2 + i * 0.25));
          back += `<g opacity="${f2(burOp * pi)}"><ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="${f1(11 * zk)}" ry="${f1(5.5 * zk)}" fill="#1c120a" stroke="#e8c79a" stroke-opacity="0.8" stroke-width="2"/></g>`;
        });
      }
      // food stop: one soft warm glow at the head ("catch rabbits to eat") — no animals drawn
      const fireOp = win(t, 47.6, 49.2, 0.3, 0.5);
      if (fireOp > 0.01 && pM && !loopMode) {
        const fl = 0.85 + 0.15 * Math.sin(t * 23) * Math.sin(t * 7);
        back += `<circle cx="${f1(pM[0] + 30 * zk)}" cy="${f1(pM[1] - 4)}" r="${f1(30 * zk)}" fill="#ffb347" opacity="${f2(0.5 * fireOp * fl)}" filter="url(#blur6)"/>
          <circle cx="${f1(pM[0] + 30 * zk)}" cy="${f1(pM[1] - 4)}" r="${f1(4 * zk)}" fill="#fff3d6" opacity="${f2(fireOp)}"/>`;
      }
      // opening 1,600 km dimension along the whole walk (1.3–5.3)
      if (loopMode && t < 6) {
        const prv = easeInOut(prog(t, 1.3, 1.7));
        const dOp = win(t, 1.3, 5.6, 0.3, 0.5);
        if (dOp > 0.01) {
          const sl = WALK.slice(0, prv);
          back += dashed(pathXY(sl), 4.2, dOp * 0.9, { flow: true, t });
          const sp = screenPts(sl);
          if (sp.length > 3) back += arrowHead(sp[sp.length - 1][0], sp[sp.length - 1][1], angOf(sp), 0.9, '#fff');
          const cnt = Math.round(1600 * easeOut(prog(t, 1.3, 1.4)));
          const txt = (cnt >= 1000 ? Math.floor(cnt / 1000) + ',' + String(cnt % 1000).padStart(3, '0') : String(cnt)) + ' KM';
          const sp2 = screenPts(WALK.slice(0, Math.max(0.05, prv)));
          if (sp2.length > 3) back += callout(txt, 600, 760, { size: 84, op: dOp, sc: popIn(t, 1.35) });
        }
      }
    }

    // --- the second walk, ten years later (67–86.8): Molly with her baby, one trail; the older daughter's pin stays
    const w2Op = win(t, 67.1, 86.9, 0.4, 0.7);
    if (w2Op > 0.01) {
      // Molly + two daughters as three small dots at Jigalong, then carried to the camp
      const rv = easeInOut(prog(t, 68.3, 2.0));
      const atCamp = t >= 70.3;
      let base;
      if (t < 68.3) {
        base = jp;
      } else {
        const q = TAKEN.at(rv);
        base = projXY(q[0], q[1]);
      }
      const h2 = HEAD2(t);
      if (t < 72.45 && base) {
        const op = win(t, 67.2, 72.7, 0.4, 0.2) * w2Op;
        const kd = t < 68.3 ? 1 : 0.8;
        back += dotGlow(base[0], base[1] + (t < 68.3 ? 60 * zk : 0), 7 * zk * kd, C.foot2, op, '#fff');
        back += dotGlow(base[0] - 14 * zk, base[1] + (t < 68.3 ? 72 * zk : 8), 4.2 * zk * kd, C.foot2, op * cl01(popIn(t, 71.3)), '#fff');
        back += dotGlow(base[0] + 14 * zk, base[1] + (t < 68.3 ? 72 * zk : 8), 4.2 * zk * kd, C.foot2, op * cl01(popIn(t, 71.4)), '#fff');
        if (t >= 67.3 && t < 68.6) back += label('MOLLY', base[0], base[1] + 18 * zk, { size: 30, op: win(t, 67.3, 68.5, 0.2, 0.3) * zoomedIn, ls: 3 });
      }
      // the second trail
      if (h2 > 0.0005) {
        back += footTrail(WALK, [[0, h2, 1]], 0, C.foot2, w2Op);
        const p = sideAt(WALK, h2, 0);
        if (p) {
          const hop = w2Op * (1 - smooth(76.3, 77.0, t));
          back += dotGlow(p[0], p[1], 7 * zk, C.foot2, hop, '#fff');
          back += dotGlow(p[0] + 7 * zk, p[1] - 6 * zk, 3.4 * zk, C.foot2, hop, '#fff'); // carrying her baby: one small dot with her
          if (t < 74.2) back += label('MOLLY', p[0] + (mp && Math.hypot(p[0] - mp[0], p[1] - mp[1]) < 90 ? 70 : 0), p[1] - (mp && Math.hypot(p[0] - mp[0], p[1] - mp[1]) < 90 ? 90 : 40) * zk, { size: 30, op: hop * win(t, 72.5, 74.2, 0.2, 0.4) * smooth(120, 260, z), ls: 3 });
        }
      }
      // older daughter: one pin that stays at the camp
      if (atCamp && mp) {
        const dop = w2Op * win(t, 72.4, 86.9, 0.3, 0.7);
        back += dotGlow(mp[0] + 16 * zk, mp[1] + 14 * zk, 7.5 * Math.max(zk, 1.15), C.foot2, dop, '#fff');
        back += ringPulse(mp[0] + 16 * zk, mp[1] + 14 * zk, t, 72.6, 8, 70 * zk, C.foot2, 2.0, 2, 0.55, dop * win(t, 76.6, 86.9, 0.6, 0.6));
      }
      // 20+ YEARS between the pin that stays and home
      const yOp = win(t, 80.6, 86.6, 0.3, 0.7);
      if (yOp > 0.01 && mp && jp) {
        const sp = screenPts(TAKEN.slice(0, 1)).reverse();
        back += dimension(sp, 54, '20+ YEARS', yOp, { at: 0.5, dx: -40, sc: popIn(t, 80.7), size: 70 });
      }
    }

    // "1931" spatial year, then a small persistent chip; "+10 YEARS" chip at the second walk
    if (t > 5.8 && t < 7.6) {
      const p = popIn(t, 5.95, 0.4);
      const op = 1 - smooth(7.0, 7.5, t);
      const y = 470 - 30 * prog(t, 5.95, 2);
      front += `<g transform="translate(540 ${f1(y)}) scale(${f2(p)})" opacity="${f2(op)}">
        ${[8, 6, 4, 2].map((k) => `<text x="${k * 0.6}" y="${k}" text-anchor="middle" font-family="${F.anton}" font-size="230" letter-spacing="6" fill="#7a4a06">1931</text>`).join('')}
        <text x="0" y="0" text-anchor="middle" font-family="${F.anton}" font-size="230" letter-spacing="6" fill="${C.gold}" stroke="#2b1500" stroke-width="5" paint-order="stroke">1931</text></g>`;
    }
    const yr = win(t, 7.3, 32.5, 0.3, 0.4);
    front += chip('1931', 150, 210, { op: yr, size: 34, sc: popIn(t, 7.3) || 0 });
    const ten = win(t, 67.05, 76.6, 0.3, 0.5);
    front += chip('+10 YEARS', 540, 300, { op: ten, size: 44, sc: popIn(t, 67.05) || 0, acc: C.foot2 });

    // master map (86.9–92.9): this route joins the prior Impossible Journeys (loaded polylines only)
    const mmOp = win(t, 86.9, 93.1, 0.5, 0.5);
    if (mmOp > 0.01 && IJL) {
      const seq = [['ep1', 'EP. 1', 87.4, [146.0, -18.0]], ['ep2', 'EP. 2', 87.7, [111.0, -8.0]], ['ep4', 'EP. 4', 88.0, [127.5, -25.3]]];
      for (const [k, tag, t0, at] of seq) {
        const rv = easeInOut(prog(t, t0, 1.5));
        if (rv <= 0.001) continue;
        const d = pathXY(IJL[k].slice(0, rv));
        back += `<g opacity="${f2(mmOp)}" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="${d}" stroke="#000" stroke-opacity="0.4" stroke-width="7"/>
          <path d="${d}" stroke="#ffffff" stroke-opacity="0.92" stroke-width="3.2"/></g>`;
        const p = proj(...at);
        if (p) back += chip(tag, p[0], p[1], { op: mmOp * cl01(popIn(t, t0 + 0.6)), size: 24, sc: popIn(t, t0 + 0.6) || 0, acc: '#ffffff' });
      }
      // this journey, highlighted gold
      const d5 = pathXY(WALK.pts);
      back += `<g opacity="${f2(mmOp)}" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="${d5}" stroke="${C.fenceGlow}" stroke-opacity="0.6" stroke-width="16" filter="url(#blur6)"/>
        <path d="${d5}" stroke="${C.gold}" stroke-width="5"/></g>`;
      const p5 = proj(116.4, -27.6);
      if (p5) back += chip('EP. 5', p5[0], p5[1], { op: mmOp * cl01(popIn(t, 88.4)), size: 30, sc: popIn(t, 88.4) || 0 });
      front += chip('IMPOSSIBLE JOURNEYS', 540, 300, { op: mmOp * cl01(popIn(t, 87.0)), size: 40, sc: popIn(t, 87.0) || 0 });
    }

    return back + front;
  }

  // ---------------------------------------------------------------- atmosphere (sky, horizon haze)
  function atmosphere() {
    let s = '';
    const tl = CAM.tilt * D2R;
    const yh = CAM.fy - (FOCAL * Math.cos(tl)) / Math.max(1e-3, Math.sin(tl));
    if (yh > -500) {
      const yH = Math.min(yh, H);
      s += `<rect x="0" y="0" width="${W}" height="${f1(Math.max(0, yH + 2))}" fill="url(#sky)"/>`;
      s += `<rect x="0" y="${f1(yH - 30)}" width="${W}" height="260" fill="url(#hazeTop)" opacity="0.9"/>`;
      s += `<rect x="0" y="${f1(yH - 6)}" width="${W}" height="14" fill="#e4f3ff" opacity="0.4" filter="url(#blur6)"/>`;
    }
    s += `<rect x="0" y="0" width="${W}" height="420" fill="url(#hazeTop)" opacity="${f2(0.6 - 0.35 * smooth(40, 10, CAM.tilt))}"/>`;
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
    // quiet grades: the policy beat darkens; the removal stays dim; a short night for the burrows
    const dark = Math.max(win(t, 19.6, 32.8, 0.8, 0.9) * (t < 25.2 ? 1 : 0.6), win(t, 76.7, 82.2, 0.8, 1.0) * 0.35);
    const night = win(t, 46.0, 48.9, 0.4, 0.5);
    const sat = 1 - 0.55 * dark - 0.35 * night;
    const bri = 1 - 0.24 * dark - 0.22 * night;
    stageEl.style.filter = sat < 0.999 ? `saturate(${f2(sat)}) brightness(${f2(bri)})` : 'none';
    const gx = Math.floor(rand(Math.floor(t * 30)) * 384);
    const gy = Math.floor(rand(Math.floor(t * 30) + 0.5) * 384);
    const nightTint = night > 0.01 ? `<rect width="${W}" height="${H}" fill="#0b1a3a" opacity="${f2(0.22 * night)}"/>` : '';
    ovEl.innerHTML = `${defs()}
      ${atmosphere()}
      ${nightTint}
      ${overlays(t)}
      <rect y="${H * 0.62}" width="${W}" height="${H * 0.38}" fill="url(#botShade)" opacity="0.7"/>
      <rect width="${W}" height="${H}" fill="url(#vig)"/>
      <rect width="${W + 384}" height="${H + 384}" fill="url(#grainP)" opacity="0.06" transform="translate(${-gx} ${-gy})" style="mix-blend-mode:overlay"/>
      ${dayCounter(t)}
      ${hookCard(t)}
      ${captions(t, CAP_Y)}`;
  };
})();
