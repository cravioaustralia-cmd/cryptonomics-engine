/* s28 Robyn Davidson — Impossible Journeys ep.4 — MAP EXPLAINER (kinetic cartography).
 * Stack: SVG overlays + renderFrame(t) + Playwright + ffmpeg. No Remotion. Claude owns this file.
 *
 * Architecture
 *  - One continuous camera (keyframed lon/lat, zoom, tilt, bearing) drives everything.
 *  - Basemap = graded satellite layers (render/make_basemap.py) placed with a CSS matrix3d that is the
 *    exact projective map of a tilted ground plane, so the 3D look stays sharp at any zoom.
 *  - Every overlay (route, labels, icons, gags) is screen-space SVG projected through the same matrix,
 *    so strokes and type stay crisp.
 *  - Timing comes from transcript.json (faster-whisper on the held Atlas VO).
 */
(function () {
  'use strict';
  const W = 1080;
  const H = 1920;
  const DUR = 95.4;
  const CAP_Y = 1344; // lower-middle band (~70%)
  const D2R = Math.PI / 180;
  const COS = Math.cos(25 * D2R);
  const LON0 = 96;
  const LAT0 = 6;
  const FOCAL = 1700; // virtual camera distance (px)
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
  // window: fade in over fi at a, fade out over fo ending at b
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
    route: '#FFAA1F',
    routeCore: '#FFD45C',
    red: '#E8322E',
    redHi: '#FF5A4E',
    ink: '#0B0F1A',
    sand: '#D9A15A',
    sandHi: '#F0C37E',
    sandLo: '#A86F36',
    camelLine: '#3A2410',
    white: '#FFFFFF',
  };
  const F = {
    mont: "Montserrat, 'Arial Black', Arial, sans-serif",
    anton: "Anton, Impact, 'Arial Black', sans-serif",
  };

  // ---------------------------------------------------------------- places (lon, lat)
  const P = {
    alice: [133.8807, -23.698],
    uluru: [131.0369, -25.3444],
    docker: [129.08, -24.86],
    warburton: [126.58, -26.13],
    hamelin: [114.153, -26.4],
    gibsonLbl: [125.0, -24.35],
  };

  // Approximate 1977 track (Alice → Glen Helen → Areyonga → past Uluru → Docker River → Warburton →
  // Carnegie → Wiluna → Hamelin Pool). Only Alice Springs, Uluru and the coast are labelled.
  const WAY = [
    [133.8807, -23.698], [133.3, -23.76], [132.68, -23.69], [132.27, -24.07], [131.85, -24.62],
    [131.32, -25.12], [131.03, -25.27], [130.73, -25.24], [130.15, -25.02], [129.08, -24.86],
    [128.3, -25.32], [127.4, -25.8], [126.58, -26.13], [125.5, -25.95], [124.3, -25.92],
    [122.97, -25.8], [121.6, -26.2], [120.22, -26.59], [118.9, -26.45], [117.4, -26.15],
    [116.1, -26.3], [115.0, -26.38], [114.45, -26.42], [114.22, -26.41], [114.153, -26.4],
  ];

  // Impossible Journeys master map (series graphic; approximate tracks)
  const EP1 = [ // ep.1 Mary Bryant, 1791 — Sydney Cove north inside the reef, Torres Strait, Timor
    [151.21, -33.86], [152.4, -32.2], [153.5, -28.6], [153.2, -25.4], [151.2, -23.0], [149.0, -20.4],
    [146.6, -18.4], [145.6, -15.6], [143.8, -12.6], [142.4, -10.7], [139.5, -10.1], [135.0, -9.7],
    [130.0, -9.6], [126.5, -9.9], [123.58, -10.18],
  ];
  const EP2 = [ // ep.2 Bert Hinkler, 1928 — arriving from England via Singapore, Java, Bima → Darwin
    [96.5, 4.6], [100.4, 3.4], [103.82, 1.35], [106.0, -3.0], [107.6, -6.9], [112.5, -7.8],
    [118.7, -8.45], [124.5, -10.4], [130.84, -12.46],
  ];
  const NEXT = [[114.153, -26.4], [111.5, -25.2], [107.5, -22.6], [104.0, -19.4]];

  // ---------------------------------------------------------------- monotone cubic interpolation
  function mono(keys) {
    const n = keys.length;
    const xs = keys.map((k) => k[0]);
    const ys = keys.map((k) => k[1]);
    const d = [];
    const m = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / Math.max(1e-6, xs[i + 1] - xs[i]));
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    m[0] = 0;
    m[n - 1] = 0;
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
        const q = [0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3));
        out.push(q);
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
  const ROUTE = mkLine(WAY, 28);
  const LEP1 = mkLine(EP1, 10);
  const LEP2 = mkLine(EP2, 10);
  const LNEXT = mkLine(NEXT, 10);
  const fU = ROUTE.fracNear(131.03, -25.27);
  const fD = ROUTE.fracNear(129.08, -24.86);
  const fWb = ROUTE.fracNear(126.58, -26.13);
  const fC = ROUTE.fracNear(122.97, -25.8);
  const fOpen = ROUTE.fracNear(129.98, -24.98);
  const OPEN_SPEED = 0.0024; // route fraction per second during the opening march

  // ---------------------------------------------------------------- camera
  // [t, lon, lat, zoom px/deg, tilt deg, bearing deg (360 = north up), focal y]
  const OPEN = [129.93, -24.975, 560, 66, 305, 900];
  const CAMK = [
    [0.0, ...OPEN],
    [2.5, 129.85, -24.96, 500, 63, 303, 900],
    [4.5, 125.2, -25.1, 46, 24, 360, 900],
    [5.4, 124.6, -25.1, 44, 22, 360, 900],
    [6.3, 126.8, -24.8, 52, 24, 360, 900],
    [8.3, 133.55, -23.9, 175, 36, 360, 880],
    [10.1, 133.84, -23.76, 240, 40, 360, 880],
    [11.3, 133.8, -23.95, 200, 36, 360, 880],
    [12.9, 134.0, -26.6, 25.5, 14, 360, 900],
    [14.7, 131.2, -26.1, 26.5, 15, 360, 900],
    [17.1, 124.6, -25.6, 34, 20, 360, 900],
    [17.75, 125.0, -25.5, 34, 20, 360, 900],
    [19.1, 133.865, -23.72, 330, 48, 360, 920],
    [22.0, 133.872, -23.708, 370, 50, 360, 920],
    [22.6, 133.876, -23.705, 430, 52, 360, 930],
    [24.6, 133.879, -23.701, 540, 54, 360, 940],
    [25.8, 133.881, -23.7, 600, 55, 360, 950],
    [26.7, 133.88, -23.715, 300, 46, 360, 900],
    [31.1, 133.86, -23.73, 255, 44, 360, 900],
    [33.0, 133.84, -23.74, 240, 42, 360, 890],
    [36.5, 133.8, -23.76, 205, 40, 360, 890],
    [38.7, 131.2, -24.6, 78, 32, 360, 890],
    [39.4, 130.4, -24.85, 66, 30, 360, 890],
    [41.3, 129.6, -25.0, 58, 30, 360, 890],
    [43.9, 131.4, -24.5, 72, 32, 360, 890],
    [44.6, 132.75, -24.45, 112, 36, 360, 890],
    [46.9, 132.0, -24.75, 122, 38, 360, 890],
    [48.25, 131.05, -25.31, 400, 55, 360, 920],
    [49.35, 130.82, -25.25, 300, 50, 360, 910],
    [50.9, 127.1, -25.0, 64, 33, 360, 890],
    [53.4, 129.1, -24.95, 150, 40, 360, 890],
    [56.9, 127.25, -25.65, 132, 40, 360, 890],
    [57.6, 127.0, -25.8, 112, 36, 360, 890],
    [59.2, 131.0, -27.2, 31, 16, 360, 900],
    [61.3, 129.2, -26.7, 36, 18, 360, 900],
    [64.0, 124.6, -26.1, 66, 26, 360, 890],
    [66.25, 123.4, -26.0, 82, 28, 360, 890],
    [69.5, 122.55, -25.98, 170, 42, 360, 900],
    [72.4, 122.35, -26.02, 205, 45, 360, 900],
    [74.9, 118.4, -26.4, 108, 38, 360, 890],
    [76.8, 114.9, -26.0, 118, 38, 360, 890],
    [78.55, 114.5, -25.6, 104, 36, 360, 890],
    [79.55, 114.135, -26.402, 1500, 60, 252, 940],
    [80.9, 114.13, -26.4, 1400, 60, 254, 940],
    [84.0, 114.06, -26.33, 300, 48, 262, 960],
    [87.0, 114.08, -26.36, 360, 48, 266, 960],
    [89.0, 124.1, -25.2, 47, 24, 360, 890],
    [91.4, 128.0, -18.6, 19.5, 12, 360, 860],
    [94.1, 128.6, -19.2, 18.5, 12, 360, 860],
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
    // gentle always-on drift (screen px), zero at both loop ends
    const env = smooth(0, 1.5, t) * (1 - smooth(DUR - 1.5, DUR, t));
    const dx = env * (5 * Math.sin(t * 0.61) + 3 * Math.sin(t * 1.37 + 1));
    const dy = env * (4 * Math.sin(t * 0.83 + 2));
    return { cx: cx + dx / z, cy: cy + dy / z, z, tilt, bear, fy, fx: 540 };
  }
  // leading-edge tracking: blend the camera centre toward the route head during walking beats
  function trackW(t) {
    return Math.max(win(t, 47.2, 50.3, 0.6, 0.8) * 0.55, win(t, 52.8, 57.8, 0.8, 0.8) * 0.85, win(t, 63.4, 77.2, 1.0, 1.2) * 0.8);
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
  const onScreen = (p, m = 80) => p && p[0] > -m && p[0] < W + m && p[1] > -m && p[1] < H + m;
  // icon size from zoom (screen px scale), perspective applied separately
  const zs = (z) => clamp(Math.pow(z / 140, 0.45), 0.78, 1.9);

  // ---------------------------------------------------------------- DOM / assets
  const FONT_CSS = `
    @font-face{font-family:'Anton';src:url(/ep/fonts/Anton-Regular.ttf) format('truetype');font-weight:400;}
    @font-face{font-family:'Montserrat';src:url(/ep/fonts/Montserrat-800.ttf) format('truetype');font-weight:800;}
    @font-face{font-family:'Montserrat';src:url(/ep/fonts/Montserrat-900.ttf) format('truetype');font-weight:900;}
    #stage{position:relative;width:1080px;height:1920px;overflow:hidden;background:#06102a}
    #map{position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:hidden}
    #map img{position:absolute;left:0;top:0;transform-origin:0 0;display:block;max-width:none;backface-visibility:hidden}
    #map img.feather{
      -webkit-mask-image:linear-gradient(to right,transparent 0,#000 5%,#000 95%,transparent 100%),linear-gradient(to bottom,transparent 0,#000 5%,#000 95%,transparent 100%);
      -webkit-mask-composite:source-in;mask-composite:intersect}
    #ov{position:absolute;left:0;top:0}`;
  const st = document.createElement('style');
  st.textContent = FONT_CSS;
  document.head.appendChild(st);
  const IMG = {
    smolan: { u: '/img/s28_02_rick_smolan_macworld_2009.jpg', w: 895, h: 1253 },
  };
  const GRAIN = '/ep/assets/grain.png';
  let LAYERS = [];
  let mapEl = null;
  let ovEl = null;
  let stageEl = null;
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
      if (name !== 'base') im.className = 'feather';
      mapEl.appendChild(im);
      decs.push(im.decode().catch(() => {}));
      LAYERS.push({ name, el: im, A: [1 / L.K, 0, mxl(L.lon0), 0, 1 / L.K, myl(L.latT), 0, 0, 1], ...L });
    }
    for (const u of [IMG.smolan.u, GRAIN]) {
      const i = new Image();
      i.src = u;
      decs.push(i.decode().catch(() => {}));
    }
    decs.push(document.fonts.load("400 100px 'Anton'"), document.fonts.load("800 40px 'Montserrat'"), document.fonts.load("900 40px 'Montserrat'"));
    await Promise.all(decs);
    const tr = await (await fetch('/transcript.json')).json();
    window.EPISODE = { duration: DUR, fps: 30, words: tr.words, scenes: [], images: { smolan: IMG.smolan.u } };
  })();

  // layer visibility by zoom: [fade-in from z0 to z1]
  const LAYER_Z = { base: [0, 0], corridor: [62, 88], sharkbay: [150, 220], opening: [260, 360], uluru: [230, 320], alice: [260, 360], hamelin: [700, 1000] };
  function updateMap() {
    for (const L of LAYERS) {
      const [z0, z1] = LAYER_Z[L.name] || [0, 0];
      let op = L.name === 'base' ? 1 : smooth(z0, z1, CAM.z);
      if (op > 0.001) {
        // cull when the layer misses the screen
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
      <filter id="blur6" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="blur14" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0d2550"/><stop offset="0.55" stop-color="#3f78b5"/><stop offset="1" stop-color="#b9daf0"/></linearGradient>
      <linearGradient id="hazeTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#c9e3f5" stop-opacity="0.34"/><stop offset="1" stop-color="#c9e3f5" stop-opacity="0"/></linearGradient>
      <linearGradient id="botShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></linearGradient>
      <radialGradient id="vig" cx="0.5" cy="0.46" r="0.78"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></radialGradient>
      <radialGradient id="oceanGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#9ff4ff" stop-opacity="0.85"/><stop offset="0.35" stop-color="#4fc3e8" stop-opacity="0.45"/><stop offset="1" stop-color="#2a7fc0" stop-opacity="0"/></radialGradient>
      <radialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff2c4" stop-opacity="0.8"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
      <radialGradient id="spot" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.62"/></radialGradient>
      <linearGradient id="camelG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.sandHi}"/><stop offset="1" stop-color="${C.sand}"/></linearGradient>
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
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f2(sc)})" opacity="${f2(op)}">
      <text x="3" y="5" text-anchor="${anchor}" font-family="${font}" font-weight="${fw}" font-size="${size}" letter-spacing="${ls}" fill="#000" opacity="0.45">${esc(text)}</text>
      <text x="0" y="0" text-anchor="${anchor}" font-family="${font}" font-weight="${fw}" font-size="${size}" letter-spacing="${ls}" fill="${fill}"
        stroke="rgba(10,10,14,0.85)" stroke-width="${f1(size * 0.16)}" stroke-linejoin="round" paint-order="stroke">${esc(text)}</text>
    </g>`;
  }
  // pop-in label animation helper
  const popIn = (t, a, d = 0.35) => (t < a ? 0 : easeOutBack(prog(t, a, d), 2.2));
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
  function pin(x, y, k, t0, t, col = C.red) {
    const p = prog(t, t0, 0.45);
    if (p <= 0) return '';
    const drop = (1 - easeOut(p)) * -120;
    const sq = p > 0.6 ? 1 + 0.12 * Math.sin((p - 0.6) * 22) * (1 - p) : 1;
    const s = 1.15 * k;
    return `<g transform="translate(${f1(x)} ${f1(y)})">
      <ellipse cx="0" cy="2" rx="${f1(16 * s * p)}" ry="${f1(5 * s * p)}" fill="#000" opacity="0.4"/>
      <g transform="translate(0 ${f1(drop)}) scale(${f2(s / sq)} ${f2(s * sq)})" filter="url(#dsS)">
        <path d="M0 0 C -6 -14 -20 -24 -20 -40 A 20 20 0 1 1 20 -40 C 20 -24 6 -14 0 0 Z" fill="#fff" stroke="${C.ink}" stroke-width="2.5"/>
        <circle cx="0" cy="-40" r="9.5" fill="${col}"/>
      </g>
    </g>`;
  }
  function ringPulse(x, y, t, t0, r0, r1, col = '#fff', period = 1.3, n = 2, ry = 1) {
    if (t < t0) return '';
    let s = '';
    for (let i = 0; i < n; i++) {
      const u = ((t - t0) / period + i / n) % 1;
      s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(lerp(r0, r1, u))}" ry="${f1(lerp(r0, r1, u) * ry)}" fill="none" stroke="${col}" stroke-width="${f1(4 * (1 - u) + 1)}" opacity="${f2((1 - u) * 0.9)}"/>`;
    }
    return s;
  }

  // ---------------------------------------------------------------- icon kit (local coords: feet at 0,0, facing right)
  function legPath(hx, hy, len, ang, kneeBend) {
    const a = ang * D2R;
    const kx = hx + Math.sin(a) * len * 0.52;
    const ky = hy + Math.cos(a) * len * 0.52;
    const b = (ang - kneeBend) * D2R;
    const fx = kx + Math.sin(b) * len * 0.5;
    const fy = ky + Math.cos(b) * len * 0.5;
    return `M${f1(hx)} ${f1(hy)} L${f1(kx)} ${f1(ky)} L${f1(fx)} ${f1(fy)}`;
  }
  function camel(x, y, s, face, ph, o = {}) {
    if (s <= 0.01) return '';
    const op = o.op == null ? 1 : o.op;
    const walk = o.walk == null ? 1 : o.walk;
    const bob = Math.sin(ph * 2) * 1.6 * walk;
    const sw = (k) => Math.sin(ph + k) * 22 * walk;
    const series = !!o.series;
    const wild = !!o.wild;
    const body = series ? '#E3B470' : C.sand;
    const legC = series ? '#9a6a35' : '#8a5a2b';
    const legF = '#6b4220';
    const headTurn = o.headTurn || 0;
    let packs = '';
    if (!wild) {
      packs = series
        ? `<path d="M-16 -58 Q -2 -70 12 -58 L 14 -44 L -18 -44 Z" fill="${C.red}" stroke="${C.camelLine}" stroke-width="1.6"/>
           <path d="M-12 -50 l4 -4 l4 4 l-4 4 z M2 -50 l4 -4 l4 4 l-4 4 z" fill="#fff" opacity="0.9"/>`
        : `<path d="M-20 -54 Q -2 -72 16 -54 L 18 -46 L -22 -46 Z" fill="#7d3a26" stroke="${C.camelLine}" stroke-width="1.6"/>
           <rect x="-27" y="-50" width="12" height="16" rx="3" fill="#6d7a3e" stroke="${C.camelLine}" stroke-width="1.4"/>
           <rect x="11" y="-50" width="12" height="16" rx="3" fill="#b8843f" stroke="${C.camelLine}" stroke-width="1.4"/>
           <path d="M-20 -52 L18 -52" stroke="#e8d2a0" stroke-width="2" stroke-dasharray="4 3"/>`;
    }
    const kick = o.kick || 0; // 0..1 rear-leg kick
    const lunge = o.lunge || 0; // 0..1 head forward (bite)
    const spit = o.spit || 0;
    const legs = (far) => {
      const c = far ? legF : legC;
      const k0 = far ? Math.PI : 0;
      const hind = kick > 0 && !far ? `M-16 -30 L ${f1(-16 - 26 * kick)} ${f1(-20 - 12 * kick)} L ${f1(-16 - 40 * kick)} ${f1(-14 - 6 * kick)}` : legPath(-16, -30, 31, sw(k0), 12);
      return `<path d="${hind}" stroke="${c}" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="${legPath(-10, -30, 31, sw(k0 + 2.4), 10)}" stroke="${c}" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="${legPath(16, -32, 33, sw(k0 + Math.PI), -8)}" stroke="${c}" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="${legPath(22, -32, 33, sw(k0 + Math.PI + 2.4), -8)}" stroke="${c}" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    };
    const bodyD = 'M-27 -33 C -31 -45 -23 -53 -13 -59 C -5 -67 6 -65 12 -55 C 16 -49 19 -47 23 -46 L 29 -38 C 26 -31 20 -29 14 -30 L -16 -30 C -22 -30 -25 -31 -27 -33 Z';
    const neckHead = `<g transform="translate(${f1(24 + lunge * 10)} ${f1(-44 + lunge * 6)}) rotate(${f1(Math.sin(ph * 2 + 0.6) * 3 * walk - lunge * 22 + headTurn)})">
        <path d="M-2 0 C 2 -6 6 -16 9 -22 C 11 -27 18 -28 22 -24 L 27 -20 C 29 -18 27 -15 24 -16 L 19 -16 C 15 -11 11 -2 7 6 Z" fill="${body}" stroke="${C.camelLine}" stroke-width="2"/>
        <circle cx="18.5" cy="-21.5" r="1.9" fill="${C.camelLine}"/>
        <path d="M15.5 -24.2 Q 18.5 -26.2 21.5 -24.4" stroke="${C.camelLine}" stroke-width="1.3" fill="none"/>
        <path d="M14 -26 l-1.5 -4 l3.5 2.5 z" fill="${body}" stroke="${C.camelLine}" stroke-width="1.2"/>
        ${lunge > 0.3 ? `<path d="M24 -16 l2 3 l2 -3 l2 3" stroke="#fff" stroke-width="1.6" fill="none"/>` : ''}
        ${spit > 0 ? `<circle cx="${f1(30 + spit * 6)}" cy="-18" r="${f1(2 + spit * 2)}" fill="#dff3ff" stroke="#6aa" stroke-width="0.8"/>` : ''}
      </g>`;
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f2(s * face)} ${f2(s)})" opacity="${f2(op)}">
      <ellipse cx="0" cy="1" rx="34" ry="6.5" fill="#000" opacity="0.33"/>
      <g transform="translate(0 ${f1(bob)})">
        ${legs(true)}
        <g stroke="#fff" stroke-width="7" stroke-linejoin="round" fill="none" opacity="0.92"><path d="${bodyD}"/></g>
        <path d="${bodyD}" fill="url(#camelG)" stroke="${C.camelLine}" stroke-width="2"/>
        <path d="M-27 -36 C -31 -32 -31 -26 -29 -22" stroke="${C.camelLine}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        ${packs}
        ${neckHead}
        ${legs(false)}
      </g>
    </g>`;
  }
  function person(x, y, s, face, ph, o = {}) {
    if (s <= 0.01) return '';
    const op = o.op == null ? 1 : o.op;
    const walk = o.walk == null ? 1 : o.walk;
    const fill = o.fill || '#ffffff';
    const hat = o.hat !== false;
    const sw = Math.sin(ph) * 26 * walk;
    const bob = Math.abs(Math.sin(ph)) * -1.5 * walk;
    const armsUp = o.armsUp || 0;
    const line = '#15171c';
    const limb = (x0, y0, len, ang, wdt) => {
      const a = ang * D2R;
      return `<path d="M${x0} ${y0} L${f1(x0 + Math.sin(a) * len)} ${f1(y0 + Math.cos(a) * len)}" stroke="${line}" stroke-width="${wdt + 4}" stroke-linecap="round"/>
        <path d="M${x0} ${y0} L${f1(x0 + Math.sin(a) * len)} ${f1(y0 + Math.cos(a) * len)}" stroke="${fill}" stroke-width="${wdt}" stroke-linecap="round"/>`;
    };
    const armA = armsUp > 0 ? lerp(-sw, 160, armsUp) : -sw;
    const armB = armsUp > 0 ? lerp(sw, -160, armsUp) : sw;
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f2(s * face)} ${f2(s)})" opacity="${f2(op)}">
      <ellipse cx="0" cy="1" rx="15" ry="4.5" fill="#000" opacity="0.35"/>
      <g transform="translate(0 ${f1(bob)})">
        ${limb(0, -24, 24, sw, 6.5)}${limb(0, -24, 24, -sw, 6.5)}
        ${limb(0, -42, 19, armA, 5.5)}
        <path d="M-6.5 -45 Q 0 -48 6.5 -45 L 5.5 -22 Q 0 -20 -5.5 -22 Z" fill="${fill}" stroke="${line}" stroke-width="2.6" stroke-linejoin="round"/>
        ${limb(0, -42, 19, armB, 5.5)}
        <circle cx="1" cy="-53" r="7.2" fill="${fill}" stroke="${line}" stroke-width="2.6"/>
        ${hat ? `<ellipse cx="1" cy="-58" rx="12.5" ry="2.8" fill="${fill}" stroke="${line}" stroke-width="2.2"/>
          <path d="M-5 -58.5 Q 1 -67 7 -58.5 Z" fill="${fill}" stroke="${line}" stroke-width="2.2"/>
          <path d="M-5 -59.5 L 7 -59.5" stroke="${C.route}" stroke-width="2"/>` : ''}
      </g>
    </g>`;
  }
  function dog(x, y, s, face, ph, o = {}) {
    if (s <= 0.01) return '';
    const op = o.op == null ? 1 : o.op;
    const sw = Math.sin(ph * 1.6) * 24;
    const c = o.ghost ? 'none' : '#262629';
    const line = o.ghost ? 'rgba(255,255,255,0.9)' : '#fff';
    const leg = (hx, k) => {
      const a = (sw * (k ? 1 : -1)) * D2R;
      return `<path d="M${hx} -11 L${f1(hx + Math.sin(a) * 11)} ${f1(-11 + Math.cos(a) * 11)}" stroke="${o.ghost ? line : '#262629'}" stroke-width="3.6" stroke-linecap="round"/>`;
    };
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f2(s * face)} ${f2(s)})" opacity="${f2(op)}">
      ${o.ghost ? '' : '<ellipse cx="0" cy="1" rx="15" ry="4" fill="#000" opacity="0.33"/>'}
      ${leg(-9, 0)}${leg(-5, 1)}${leg(8, 1)}${leg(12, 0)}
      <path d="M-14 -12 C -14 -18 -6 -20 4 -19 L 12 -19 L 15 -26 L 17 -21 L 21 -20 L 23 -15 C 20 -13 17 -12 13 -11 L 10 -9 C 2 -8 -8 -8 -14 -12 Z"
        fill="${c}" stroke="${line}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M-14 -14 Q -20 -20 -18 -27" stroke="${o.ghost ? line : '#262629'}" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${o.ghost ? '' : '<circle cx="11.5" cy="-17.5" r="1.8" fill="#E8322E"/><circle cx="18" cy="-20" r="1.1" fill="#fff"/>'}
    </g>`;
  }
  function cameraIcon(x, y, s, flash = 0) {
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f2(s)})">
      <rect x="-24" y="-34" width="48" height="31" rx="6" fill="#1c1d22" stroke="#fff" stroke-width="3"/>
      <rect x="-9" y="-41" width="18" height="8" rx="2" fill="#1c1d22" stroke="#fff" stroke-width="2.5"/>
      <rect x="-20" y="-31" width="9" height="5" rx="1.5" fill="#cfd6e0"/>
      <circle cx="2" cy="-18.5" r="11" fill="#2f3440" stroke="#9aa3b2" stroke-width="2.5"/>
      <circle cx="2" cy="-18.5" r="5.5" fill="#5c7cff" opacity="0.85"/>
      <circle cx="0" cy="-21" r="2" fill="#fff" opacity="0.9"/>
      ${flash > 0 ? `<g opacity="${f2(flash)}"><circle cx="-15" cy="-28" r="${f1(16 + 30 * flash)}" fill="url(#sunGlow)"/>
        ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M${f1(-15 + Math.cos(a * D2R) * 14)} ${f1(-28 + Math.sin(a * D2R) * 14)} L${f1(-15 + Math.cos(a * D2R) * (24 + 18 * flash))} ${f1(-28 + Math.sin(a * D2R) * (24 + 18 * flash))}" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`).join('')}</g>` : ''}
    </g>`;
  }
  function pressCar(x, y, s, face, hue, ph) {
    const bodyC = ['#f4f4f4', '#d93a33', '#2f6fd6', '#f2c230', '#3aa35c', '#8a55c9'][hue % 6];
    const bounce = Math.sin(ph * 9) * 0.8;
    return `<g transform="translate(${f1(x)} ${f1(y + bounce)}) scale(${f2(s * face)} ${f2(s)})">
      <ellipse cx="0" cy="1" rx="24" ry="4.5" fill="#000" opacity="0.35"/>
      <path d="M-24 -6 L-23 -14 Q -22 -17 -18 -17 L -12 -17 L -6 -25 Q -4 -27 0 -27 L 10 -27 Q 13 -27 15 -24 L 19 -17 L 22 -16 Q 25 -15 25 -11 L 25 -6 Z" fill="${bodyC}" stroke="#15171c" stroke-width="2"/>
      <path d="M-4 -24 L 0 -24 L 0 -18 L -9 -18 Z M 3 -24 L 10 -24 Q 12 -24 13 -22 L 15 -18 L 3 -18 Z" fill="#9fd3ff" stroke="#15171c" stroke-width="1.2"/>
      <rect x="-6" y="-34" width="18" height="7" rx="1.5" fill="#fff" stroke="#15171c" stroke-width="1.2"/>
      <text x="3" y="-28.6" text-anchor="middle" font-family="${F.mont}" font-weight="900" font-size="5.6" fill="#15171c">PRESS</text>
      <circle cx="-13" cy="-5" r="5" fill="#15171c"/><circle cx="-13" cy="-5" r="2" fill="#bbb"/>
      <circle cx="15" cy="-5" r="5" fill="#15171c"/><circle cx="15" cy="-5" r="2" fill="#bbb"/>
    </g>`;
  }
  function magnifier(x, y, s, rot) {
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${f2(s)})" filter="url(#dsS)">
      <path d="M15 15 L 34 34" stroke="#15171c" stroke-width="11" stroke-linecap="round"/>
      <path d="M15 15 L 34 34" stroke="#8b5a2b" stroke-width="7" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="21" fill="rgba(190,230,255,0.28)" stroke="#15171c" stroke-width="9"/>
      <circle cx="0" cy="0" r="21" fill="none" stroke="#e8edf4" stroke-width="5"/>
      <path d="M-11 -8 A 13 13 0 0 1 -3 -13" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
    </g>`;
  }
  function bubble(x, y, s, txt, o = {}) {
    const op = o.op == null ? 1 : o.op;
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f2(s)})" opacity="${f2(op)}" filter="url(#dsS)">
      <path d="M-30 -22 Q -30 -40 -12 -40 L 12 -40 Q 30 -40 30 -22 Q 30 -6 12 -6 L 2 -6 L -6 4 L -6 -6 L -12 -6 Q -30 -6 -30 -22 Z" fill="#fff" stroke="#15171c" stroke-width="3"/>
      <text x="0" y="-12" text-anchor="middle" font-family="${F.anton}" font-size="${o.fs || 30}" fill="${o.col || '#15171c'}">${esc(txt)}</text>
    </g>`;
  }
  function burst(x, y, s, t01, col = '#fff') {
    if (t01 <= 0 || t01 >= 1) return '';
    const r0 = 10 + 30 * easeOut(t01);
    const r1 = r0 + 18 * (1 - t01);
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f2(s)})" opacity="${f2(1 - t01)}">
      ${[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => `<path d="M${f1(Math.cos(a * D2R) * r0)} ${f1(Math.sin(a * D2R) * r0)} L${f1(Math.cos(a * D2R) * r1)} ${f1(Math.sin(a * D2R) * r1)}" stroke="${col}" stroke-width="5" stroke-linecap="round"/>`).join('')}
      <path d="M0 -16 L 5 -5 L 17 -4 L 8 4 L 11 16 L 0 9 L -11 16 L -8 4 L -17 -4 L -5 -5 Z" fill="${C.goldHi}" stroke="#15171c" stroke-width="2.5" transform="scale(${f2(0.6 + 0.6 * easeOut(t01))})"/>
    </g>`;
  }

  // ---------------------------------------------------------------- caravan state
  // head fraction along the route over time (walking beats)
  const HEADK = [
    [44.54, 0.0], [46.9, fU], [48.6, fU + 0.012], [50.7, fD - 0.012], [53.5, fD - 0.002], [55.1, fD + 0.004],
    [57.3, fWb], [61.2, fWb + 0.045], [64.2, fWb + 0.07], [66.25, fC + 0.03], [69.6, fC + 0.048], [72.4, fC + 0.052],
    [76.74, 1.0], [80, 1.0],
  ];
  const headI = mono(HEADK);
  const headAt = (t) => (t < 44.54 ? 0 : headI(t));
  const openF = (t) => fOpen + OPEN_SPEED * (t > 50 ? t - DUR : t);

  function routeDir(f) {
    const a = ROUTE.at(Math.max(0, f - 0.002));
    const b = ROUTE.at(Math.min(1, f + 0.002));
    return [b[0] - a[0], b[1] - a[1]];
  }
  // screen facing (+1 right / −1 left) of travel direction at fraction f
  function faceAt(f, def = -1) {
    const [dx, dy] = routeDir(f);
    const p = ROUTE.at(f);
    const a = projXY(p[0], p[1]);
    const b = projXY(p[0] + dx, p[1] + dy);
    if (!a || !b) return def;
    return b[0] >= a[0] ? 1 : -1;
  }
  // caravan members: positions behind the head at constant screen spacing
  function caravan(t, f, o = {}) {
    const p0 = ROUTE.at(f);
    const sp = projXY(p0[0], p0[1]);
    if (!sp) return [];
    const k = sp[2];
    const unit = CAM.z * k; // px per map unit near the head
    const sz = (o.size || 1) * zs(CAM.z);
    const gapPx = (o.gap || 64) * sz * k;
    const df = gapPx / unit / ROUTE.T;
    const out = [];
    const ph = t * 7.5;
    const walk = o.walk == null ? 1 : o.walk;
    const face = faceAt(f);
    const add = (kind, ff, extra = {}) => {
      const q = ROUTE.at(clamp(ff, 0, 1));
      const sq = projXY(q[0], q[1]);
      if (!sq) return;
      out.push({ kind, x: sq[0], y: sq[1], s: sz * sq[2], face: faceAt(clamp(ff, 0.001, 0.999), face), ph, walk, ...extra });
    };
    add('person', f + df * (o.lead || 0.6));
    const n = o.camels == null ? 4 : o.camels;
    for (let i = 0; i < n; i++) add('camel', f - df * (0.95 + i * 1.05), { ph: ph + i * 1.3 });
    if (o.series) add('series', f - df * (0.95 + n * 1.05 + 0.15), { ph: ph + 0.7, op: o.series });
    return out;
  }
  function drawIcon(it) {
    if (it.kind === 'person') return person(it.x, it.y, it.s, it.face, it.ph, { walk: it.walk, op: it.op, armsUp: it.armsUp });
    if (it.kind === 'elder') return person(it.x, it.y, it.s, it.face, it.ph, { walk: it.walk, op: it.op, fill: '#c3d0dc', hat: false });
    if (it.kind === 'handler') return person(it.x, it.y, it.s, it.face, it.ph, { walk: it.walk, op: it.op, fill: '#b9b9b9', hat: true });
    if (it.kind === 'camel') return camel(it.x, it.y, it.s, it.face, it.ph, { walk: it.walk, op: it.op, wild: it.wild, kick: it.kick, lunge: it.lunge, spit: it.spit });
    if (it.kind === 'series') return camel(it.x, it.y, it.s * 0.82, it.face, it.ph, { walk: it.walk, op: it.op, series: true });
    if (it.kind === 'dog') return dog(it.x, it.y, it.s, it.face, it.ph, { op: it.op, ghost: it.ghost });
    return '';
  }

  // ---------------------------------------------------------------- route drawing
  function routeStroke(d, w, o = {}) {
    if (!d) return '';
    const col = o.col || C.route;
    const core = o.core || C.routeCore;
    const op = o.op == null ? 1 : o.op;
    return `<g opacity="${f2(op)}" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="${d}" stroke="#000" stroke-opacity="0.38" stroke-width="${f1(w + 8)}" transform="translate(0 ${f1(w * 0.55)})" filter="url(#blur6)"/>
      <path d="${d}" stroke="#4a2600" stroke-opacity="0.55" stroke-width="${f1(w + 4)}"/>
      <path d="${d}" stroke="${col}" stroke-width="${f1(w)}"/>
      <path d="${d}" stroke="${core}" stroke-width="${f1(w * 0.36)}" stroke-opacity="0.9"/>
    </g>`;
  }
  function dashed(d, w, op, o = {}) {
    if (!d || op <= 0.001) return '';
    const off = o.flow ? -((o.t || 0) * 40) % 40 : 0;
    return `<g opacity="${f2(op)}" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="${d}" stroke="#000" stroke-opacity="0.45" stroke-width="${f1(w + 4)}" stroke-dasharray="${f1(w * 3)} ${f1(w * 2.6)}" stroke-dashoffset="${f1(off)}"/>
      <path d="${d}" stroke="${o.col || '#fff'}" stroke-width="${f1(w)}" stroke-dasharray="${f1(w * 3)} ${f1(w * 2.6)}" stroke-dashoffset="${f1(off)}"/>
    </g>`;
  }
  function arrowHead(x, y, ang, s, col = '#fff') {
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)}) scale(${f2(s)})">
      <path d="M0 0 L -22 -12 L -16 0 L -22 12 Z" fill="${col}" stroke="#000" stroke-opacity="0.5" stroke-width="2.5" stroke-linejoin="round"/></g>`;
  }
  // screen-space polyline of a route slice (for offsets / arrowheads)
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
  // dimension line running parallel to a path, arrowheads both ends, yellow value
  function dimension(sp, off, txt, op, o = {}) {
    if (op <= 0.001 || sp.length < 2) return '';
    const pts = offsetPolyline(sp, off);
    const a = pts[0];
    const a2 = pts[Math.min(3, pts.length - 1)];
    const b = pts[pts.length - 1];
    const b2 = pts[Math.max(0, pts.length - 4)];
    const angA = (Math.atan2(a[1] - a2[1], a[0] - a2[0]) * 180) / Math.PI;
    const angB = (Math.atan2(b[1] - b2[1], b[0] - b2[0]) * 180) / Math.PI;
    const mid = o.at != null ? pts[Math.round(o.at * (pts.length - 1))] : pts[Math.floor(pts.length / 2)];
    const tick = (p, q) => {
      const dx = q[0] - p[0];
      const dy = q[1] - p[1];
      const L = Math.hypot(dx, dy) || 1;
      const nx = (-dy / L) * 14;
      const ny = (dx / L) * 14;
      return `<path d="M${f1(p[0] - nx)} ${f1(p[1] - ny)} L${f1(p[0] + nx)} ${f1(p[1] + ny)}" stroke="#fff" stroke-width="2.5"/>`;
    };
    return `<g opacity="${f2(op)}">
      <path d="${dPts(pts)}" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="5.5"/>
      <path d="${dPts(pts)}" fill="none" stroke="#fff" stroke-width="2.5"/>
      ${tick(a, a2)}${tick(b, b2)}
      ${arrowHead(a[0], a[1], angA, 0.62)}${arrowHead(b[0], b[1], angB, 0.62)}
      ${callout(txt, mid[0] + (o.dx || 0), mid[1] + (o.dy || 0), { size: o.size || 66, sc: o.sc == null ? 1 : o.sc })}
    </g>`;
  }

  // ---------------------------------------------------------------- the big custom pieces
  // Frame-1 hook card (never spoken)
  function hookCard(t) {
    let sc = 1;
    let op = 1;
    let dy = 0;
    if (t < 5) {
      const p = prog(t, 1.05, 0.38);
      op = 1 - easeIn(p);
      dy = -90 * easeIn(p);
      sc = 1 + 0.06 * p;
    } else {
      const p = prog(t, 95.04, 0.26);
      if (p <= 0) return '';
      sc = lerp(1.7, 1, easeOutBack(p, 1.4));
      op = cl01(p * 3);
    }
    if (op <= 0.001) return '';
    return `<g transform="translate(540 ${f1(570 + dy)}) rotate(-3) scale(${f2(sc * 0.88)})" opacity="${f2(op)}">
      <g filter="url(#ds)">
        <rect x="-420" y="-170" width="840" height="320" rx="26" fill="rgba(9,12,22,0.80)" stroke="${C.gold}" stroke-width="5"/>
        <rect x="-398" y="-148" width="796" height="276" rx="16" fill="none" stroke="#fff" stroke-opacity="0.18" stroke-width="2"/>
      </g>
      <text x="0" y="-16" text-anchor="middle" font-family="${F.anton}" font-size="150" letter-spacing="2" fill="${C.gold}" stroke="#000" stroke-width="10" paint-order="stroke">2,700 km,</text>
      <text x="0" y="118" text-anchor="middle" font-family="${F.anton}" font-size="124" letter-spacing="3" fill="#fff" stroke="#000" stroke-width="9" paint-order="stroke">FOUR camels</text>
    </g>`;
  }

  // Gag 1 — big camel bust turns to camera with a slow side-eye ("have opinions")
  function sideEye(t, ax, ay) {
    const a = 24.56;
    const b = 26.35;
    if (t < a - 0.05 || t > b) return '';
    const pin = easeOutBack(prog(t, a, 0.34), 1.6);
    const out = 1 - easeIn(prog(t, b - 0.3, 0.3));
    const s = pin * out;
    if (s <= 0.01) return '';
    const turn = easeInOut(prog(t, a + 0.12, 0.3)); // profile → facing camera
    const eye = easeInOut(prog(t, a + 0.5, 0.75)); // pupils slide to the side (slowly)
    const lid = easeInOut(prog(t, a + 0.45, 0.6)); // heavy lids drop
    const brow = easeOutBack(prog(t, a + 1.25, 0.25));
    const cx = 610;
    const cy = 760;
    const pupil = (ex) => ex - 9 + eye * 15;
    const eyeG = (ex, ey, flip) => `
      <ellipse cx="${ex}" cy="${ey}" rx="21" ry="17" fill="#fff" stroke="${C.camelLine}" stroke-width="3"/>
      <circle cx="${f1(pupil(ex))}" cy="${f1(ey + 2)}" r="9" fill="#2a1a0c"/>
      <circle cx="${f1(pupil(ex) + 3)}" cy="${f1(ey - 2)}" r="2.6" fill="#fff"/>
      <path d="M${ex - 23} ${ey - 2} Q ${ex} ${f1(ey - 22 + lid * 2)} ${ex + 23} ${ey - 2} L ${ex + 23} ${f1(ey - 2 + lid * 9)} Q ${ex} ${f1(ey - 6 + lid * 10)} ${ex - 23} ${f1(ey - 2 + lid * 9)} Z" fill="${C.sand}" stroke="${C.camelLine}" stroke-width="3"/>
      ${[-14, -4, 6, 16].map((k) => `<path d="M${ex + k} ${f1(ey - 2 + lid * 9 + 1)} l${flip * 2} ${f1(7)}" stroke="${C.camelLine}" stroke-width="2.4" stroke-linecap="round"/>`).join('')}
      <path d="M${ex - 22} ${f1(ey - 26 - brow * 6)} Q ${ex} ${f1(ey - 36 - brow * (flip > 0 ? 10 : 2))} ${ex + 22} ${f1(ey - 28 - brow * 4)}" stroke="${C.camelLine}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
    const front = `
      <path d="M-58 150 C -64 60 -48 10 -40 -20 L 40 -20 C 48 10 62 60 58 150 Z" fill="url(#camelG)" stroke="${C.camelLine}" stroke-width="4"/>
      <ellipse cx="0" cy="-70" rx="92" ry="78" fill="url(#camelG)" stroke="${C.camelLine}" stroke-width="4"/>
      <path d="M-70 -128 l-18 -26 l32 10 z M70 -128 l18 -26 l-32 10 z" fill="${C.sand}" stroke="${C.camelLine}" stroke-width="3.5"/>
      <path d="M-40 -140 q 10 -22 22 -6 q 10 -22 22 -4 q 12 -20 22 -2 q 10 -16 16 4" fill="${C.sandHi}" stroke="${C.camelLine}" stroke-width="3"/>
      <ellipse cx="0" cy="10" rx="70" ry="56" fill="#e9c58c" stroke="${C.camelLine}" stroke-width="4"/>
      <path d="M-26 -8 q 6 -8 12 0 M 14 -8 q 6 -8 12 0" stroke="${C.camelLine}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <path d="M-46 30 Q 0 52 46 30" stroke="${C.camelLine}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <path d="M-40 34 Q -20 64 0 46 Q 20 64 40 34" fill="#d8ab72" stroke="${C.camelLine}" stroke-width="3.5"/>
      ${eyeG(-40, -74, -1)}${eyeG(40, -74, 1)}`;
    const prof = `<g transform="scale(3.2)">${camel(0, 40, 1, -1, 0, { walk: 0 }).replace(/^<g[^>]*>/, '<g>')}</g>`;
    return `<g transform="translate(${f1(lerp(ax, cx, pin))} ${f1(lerp(ay, cy, pin))}) scale(${f2(s * 1.25)})">
      <circle cx="0" cy="-20" r="230" fill="rgba(10,12,20,0.55)" stroke="${C.gold}" stroke-width="5" filter="url(#ds)"/>
      <g opacity="${f2(1 - turn)}" transform="scale(${f2(1 - 0.4 * turn)} 1)">${prof}</g>
      <g opacity="${f2(turn)}" transform="scale(${f2(0.5 + 0.5 * turn)} 1)">${front}</g>
    </g>`;
  }

  // Rick Smolan credibility insert (2009 portrait, CC BY-SA 3.0 — not a trek photo)
  function smolanCard(t) {
    const a = 36.7;
    const b = 38.3;
    if (t < a || t > b + 0.01) return '';
    const p = easeOutBack(prog(t, a, 0.3), 1.4);
    const q = 1 - easeIn(prog(t, b - 0.25, 0.25));
    const s = p * q;
    const wph = 300;
    const hph = (wph * IMG.smolan.h) / IMG.smolan.w;
    return `<g transform="translate(770 560) rotate(${f1(4 - 2 * p)}) scale(${f2(s)})" filter="url(#ds)">
      <rect x="${-wph / 2 - 16}" y="${-hph / 2 - 16}" width="${wph + 32}" height="${hph + 96}" rx="8" fill="#f7f3ea"/>
      <clipPath id="smc"><rect x="${-wph / 2}" y="${-hph / 2}" width="${wph}" height="${hph}" rx="3"/></clipPath>
      <image href="${IMG.smolan.u}" x="${-wph / 2}" y="${-hph / 2}" width="${wph}" height="${hph}" clip-path="url(#smc)" preserveAspectRatio="xMidYMid slice"/>
      <text x="0" y="${f1(hph / 2 + 40)}" text-anchor="middle" font-family="${F.mont}" font-weight="900" font-size="30" letter-spacing="2" fill="#15171c">RICK SMOLAN</text>
      <text x="0" y="${f1(hph / 2 + 66)}" text-anchor="middle" font-family="${F.mont}" font-weight="800" font-size="16" letter-spacing="1.5" fill="#5a5a5a">PHOTOGRAPHER · PICTURED 2009</text>
      <text x="${-wph / 2}" y="${f1(-hph / 2 - 24)}" font-family="${F.mont}" font-weight="800" font-size="13" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">Photo: Aljawad · CC BY-SA 3.0</text>
    </g>`;
  }

  // ---------------------------------------------------------------- overlays per frame
  function overlays(t) {
    let back = ''; // ground-plane graphics (below icons)
    const icons = []; // depth-sorted icons
    let front = ''; // screen-space graphics above icons
    const z = CAM.z;
    const zk = zs(z);

    // --- coast / borders context (subtle; zoomed-out only)
    const ctxOp = 1 - smooth(70, 140, z);
    if (ctxOp > 0.01 && window.GEO) {
      let dC = '';
      for (const r of GEO.coast) dC += pathLL(r, true);
      back += `<path d="${dC}" fill="none" stroke="#fff" stroke-opacity="${f2(0.16 * ctxOp)}" stroke-width="9" stroke-linejoin="round"/>
        <path d="${dC}" fill="none" stroke="#fff" stroke-opacity="${f2(0.55 * ctxOp)}" stroke-width="1.6" stroke-linejoin="round"/>`;
      let dB = '';
      for (const l of GEO.borders) dB += pathLL(l, false);
      back += `<path d="${dB}" fill="none" stroke="#fff" stroke-opacity="${f2(0.28 * ctxOp)}" stroke-width="1.6" stroke-dasharray="7 6"/>`;
    }

    // --- B1/B2: intent route preview + 2,700 km dimension (2.7–5.9) ; photographer gag preview (38–44.7)
    const prevOp = Math.max(win(t, 2.75, 6.1, 0.35, 0.6), win(t, 37.9, 44.8, 0.5, 0.5));
    if (prevOp > 0.01) {
      const reveal = t < 10 ? easeInOut(prog(t, 2.75, 1.5)) : easeInOut(prog(t, 37.9, 1.2));
      const sl = ROUTE.slice(0, reveal);
      back += dashed(pathXY(sl), 5, prevOp * 0.95, { flow: true, t });
      const sp = screenPts(sl);
      if (sp.length > 2 && reveal > 0.98) {
        const e = sp[sp.length - 1];
        const e2 = sp[Math.max(0, sp.length - 4)];
        back += arrowHead(e[0], e[1], (Math.atan2(e[1] - e2[1], e[0] - e2[0]) * 180) / Math.PI, 1, '#fff');
      }
      if (t < 10) {
        const cnt = Math.round(2700 * easeOut(prog(t, 3.3, 1.2)));
        const txt = (cnt >= 1000 ? Math.floor(cnt / 1000) + ',' + String(cnt % 1000).padStart(3, '0') : String(cnt)) + ' KM';
        const dOp = win(t, 3.25, 6.0, 0.3, 0.5);
        back += dimension(screenPts(ROUTE.slice(0, 1)), 38, txt, dOp, { dy: 74, sc: popIn(t, 3.3), at: 0.5 });
      }
    }

    // --- Alice Springs pin + label (9.9–44.8) and in other Alice beats
    const aliceOp = (win(t, 9.95, 44.9, 0.1, 0.5) + win(t, 87.6, 89.9, 0.3, 0.4)) * (1 - win(t, 22.3, 26.5, 0.2, 0.3));
    if (aliceOp > 0.01) {
      const p = proj(...P.alice);
      if (p) {
        back += pin(p[0], p[1], zk * 0.9 * p[2], 10.05, t);
        const big = smooth(150, 260, z);
        const above = smooth(17.8, 18.6, t) * (1 - smooth(43.6, 44.4, t));
        back += label('ALICE SPRINGS', p[0] + lerp(26 * zk, 0, above), p[1] - 70 * zk * p[2] - 10 - 120 * above, {
          size: lerp(30, 42, big), anchor: above > 0.5 ? 'middle' : 'start', op: aliceOp * cl01(popIn(t, 10.3)), sc: popIn(t, 10.3) || 0,
        });
      }
    }

    // --- 1977 spatial year + name chip
    if (t > 5.7 && t < 8.3) {
      const p = popIn(t, 5.84, 0.4);
      const op = 1 - smooth(7.75, 8.2, t);
      const y = 470 - 30 * prog(t, 5.84, 3.6);
      front += `<g transform="translate(540 ${f1(y)}) scale(${f2(p)})" opacity="${f2(op)}">
        ${[8, 6, 4, 2].map((k) => `<text x="${k * 0.6}" y="${k}" text-anchor="middle" font-family="${F.anton}" font-size="230" letter-spacing="6" fill="#7a4a06">1977</text>`).join('')}
        <text x="0" y="0" text-anchor="middle" font-family="${F.anton}" font-size="230" letter-spacing="6" fill="${C.gold}" stroke="#2b1500" stroke-width="5" paint-order="stroke">1977</text></g>`;
    }

    // --- B2 "very middle": crosshair + rings (11.3–14.2)
    const midOp = win(t, 11.35, 14.4, 0.3, 0.5);
    if (midOp > 0.01) {
      const p = proj(...P.alice);
      if (p) {
        const r = 520 * easeOut(prog(t, 11.4, 1.4));
        back += `<g opacity="${f2(midOp)}">
          <path d="M${f1(p[0] - r)} ${f1(p[1])} L${f1(p[0] + r)} ${f1(p[1])} M${f1(p[0])} ${f1(p[1] - r * 1.05)} L${f1(p[0])} ${f1(p[1] + r * 1.05)}" stroke="#fff" stroke-width="2.5" stroke-dasharray="10 8" opacity="0.8"/>
          ${ringPulse(p[0], p[1], t, 11.45, 10, 260, '#fff', 1.2, 3)}
          <circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="9" fill="${C.red}" stroke="#fff" stroke-width="3"/></g>`;
      }
    }
    // --- B2 "walk west until she reaches the ocean": intent arrow Alice → coast (15.2–18.0)
    const arOp = win(t, 15.2, 18.2, 0.2, 0.5);
    if (arOp > 0.01) {
      const a = [mxl(P.alice[0]), myl(P.alice[1])];
      const b = [mxl(113.9), myl(-25.9)];
      const r = easeInOut(prog(t, 15.3, 1.75));
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const u = (i / 40) * r;
        pts.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * 0.9 * 1]);
      }
      const sp = screenPts(pts);
      back += dashed(dPts(sp), 7, arOp, { flow: true, t });
      if (sp.length > 3) {
        const e = sp[sp.length - 1];
        const e2 = sp[sp.length - 3];
        back += arrowHead(e[0], e[1], (Math.atan2(e[1] - e2[1], e[0] - e2[0]) * 180) / Math.PI, 1.3);
      }
    }
    // INDIAN OCEAN label (16.9–18.3) and coast beat (76.7–79.2)
    const ioOp = win(t, 16.95, 18.4, 0.2, 0.4) + win(t, 76.7, 79.0, 0.2, 0.35);
    if (ioOp > 0.01) {
      const p = t < 30 ? proj(108.6, -24.4) : proj(111.6, -26.6);
      if (p) {
        back += `<ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="260" ry="150" fill="url(#oceanGlow)" opacity="${f2(0.5 * ioOp)}"/>`;
        back += label('INDIAN OCEAN', p[0], p[1], { size: 44, ls: 6, op: cl01(ioOp), sc: t < 30 ? popIn(t, 16.98) : popIn(t, 76.74) });
      }
    }

    // --- caravan/person state machine
    const sizeBoost = 1;
    if (t < 4.6 || t > 94.25) {
      // opening / loop march (four camels + Robyn), Indian Ocean glowing far edge
      const op = t < 5 ? 1 - smooth(3.4, 4.5, t) : smooth(94.4, 94.95, t);
      const fo = openF(t);
      for (const it of caravan(t, fo, { size: sizeBoost, gap: 92, lead: 1.0 })) icons.push({ ...it, op });
    } else if (t >= 7.3 && t < 44.54) {
      // Robyn at Alice Springs
      const a = [mxl(P.alice[0]), myl(P.alice[1])];
      const pA = projXY(a[0], a[1]);
      if (pA) {
        const k = pA[2];
        const s = zk * k * 1.25;
        const walkIn = easeOut(prog(t, 7.4, 1.6));
        const baseX = pA[0] + lerp(-260, 0, walkIn) * s + 190 * smooth(17.9, 18.7, t);
        const baseY = pA[1] + 40 * s;
        const pWalk = t < 9.1 ? 1 : 0;
        // recoil hops for bite / kick / spit
        let hop = 0;
        for (const tt of [22.86, 23.54, 24.18]) hop += Math.sin(prog(t, tt, 0.3) * Math.PI) * 26;
        const rx = baseX - (t > 22.7 && t < 24.6 ? 16 * s : 0);
        const ppl = { kind: 'person', x: rx, y: baseY - hop * s, s, face: 1, ph: t * 7, walk: pWalk, op: smooth(7.3, 7.6, t) };
        // camels formed after training: line behind her (to the left)
        const formed = t >= 30.2;
        if (!formed && t > 31) ppl.face = 1;
        icons.push(ppl);
        // chip: ROBYN DAVIDSON (7.6–9.5), small tag later
        if (t < 10.2) {
          const p = popIn(t, 8.1, 0.4);
          const op = 1 - smooth(9.6, 10.1, t);
          front += chip('ROBYN DAVIDSON', rx, baseY - 150 * s - 40, { op: op * cl01(p * 2), sc: p, size: 40 });
        }
        // B3 no camels: ghost slots (18.6–22.4)
        const gOp = win(t, 18.75, 22.45, 0.3, 0.35);
        if (gOp > 0.01) {
          for (let i = 0; i < 4; i++) {
            const gx = rx - (92 + i * 82) * s;
            const pulse = 0.55 + 0.45 * Math.sin(t * 6 + i);
            front += `<g opacity="${f2(gOp * pulse)}">${camel(gx, baseY, s, 1, 0, { walk: 0, op: 1 }).replace(/fill="url\(#camelG\)"/g, 'fill="rgba(255,255,255,0.08)"').replace(/fill="[#a-z0-9]+" stroke="#3A2410"/gi, 'fill="none" stroke="#3A2410"').replace(/stroke="#3A2410"/g, 'stroke="#fff" stroke-dasharray="5 4"')}</g>`;
            front += `<g opacity="${f2(gOp)}"><path d="M${f1(gx - 9 * s)} ${f1(baseY - 92 * s)} l${f1(18 * s)} ${f1(18 * s)} M${f1(gx + 9 * s)} ${f1(baseY - 92 * s)} l${f1(-18 * s)} ${f1(18 * s)}" stroke="${C.red}" stroke-width="${f1(5 * s)}" stroke-linecap="round"/></g>`;
          }
        }
        // B3 "no idea how to handle them": question marks (20.4–22.5)
        [20.55, 20.95, 21.4].forEach((tt, i) => {
          const p = popIn(t, tt, 0.3);
          const op = 1 - smooth(22.2, 22.55, t);
          if (p > 0) front += bubble(rx + (-34 + i * 36) * s, baseY - (98 + (i % 2) * 22) * s, 0.9 * s * p, '?', { op, fs: 34 });
        });
        // B4 wild camel: bite / kick / spit, then Gag 1 side-eye
        const wOp = win(t, 22.35, 26.5, 0.2, 0.3);
        if (wOp > 0.01) {
          const arrive = easeOut(prog(t, 22.35, 0.4));
          const cxw = rx + lerp(260, 74, arrive) * s;
          const flipKick = t > 23.25 && t < 23.95;
          const lunge = Math.sin(prog(t, 22.72, 0.32) * Math.PI);
          const kick = Math.sin(prog(t, 23.42, 0.34) * Math.PI);
          const spit = prog(t, 23.98, 0.35);
          icons.push({ kind: 'camel', wild: true, x: cxw, y: baseY, s: s * 1.05, face: flipKick ? 1 : -1, ph: t * 6, walk: arrive < 1 ? 1 : 0, op: wOp, lunge, kick });
          front += burst(rx + 22 * s, baseY - 62 * s, s * 0.9, prog(t, 22.84, 0.4));
          front += burst(rx + 18 * s, baseY - 30 * s, s * 0.9, prog(t, 23.52, 0.4));
          if (spit > 0 && spit < 1) {
            const sx = lerp(cxw - 48 * s, rx + 4 * s, spit);
            const sy = baseY - 70 * s - Math.sin(spit * Math.PI) * 50 * s;
            front += `<circle cx="${f1(sx)}" cy="${f1(sy)}" r="${f1(7 * s)}" fill="#e6f7ff" stroke="#5fa8c8" stroke-width="2"/>`;
          }
          front += burst(rx + 6 * s, baseY - 58 * s, s * 0.8, prog(t, 24.32, 0.45), '#bff0ff');
          front += sideEye(t, cxw, baseY - 60 * s);
        }
        // B5 two years ring + handlers + wild camels join (26.4–31.2)
        const yrOp = win(t, 26.5, 31.3, 0.3, 0.5);
        if (yrOp > 0.01) {
          const R = 190 * s;
          const lap = easeInOut(prog(t, 26.8, 3.8)) * 2; // two laps = two years
          const ticks = [];
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const lit = lap * 12 > i + (lap > 1 ? 0 : 0) ? 1 : 0.25;
            ticks.push(`<path d="M${f1(pA[0] + Math.cos(a) * R * 0.9)} ${f1(pA[1] + Math.sin(a) * R * 0.9 * 0.62)} L${f1(pA[0] + Math.cos(a) * R)} ${f1(pA[1] + Math.sin(a) * R * 0.62)}" stroke="${lit > 0.5 ? C.gold : '#fff'}" stroke-opacity="${lit}" stroke-width="5" stroke-linecap="round"/>`);
          }
          const ang = lap * Math.PI * 2 - Math.PI / 2;
          const arc = (frac) => {
            const a1 = -Math.PI / 2 + frac * Math.PI * 2 - 0.0001;
            const large = frac > 0.5 ? 1 : 0;
            return `M${f1(pA[0])} ${f1(pA[1] - R * 0.62)} A ${f1(R)} ${f1(R * 0.62)} 0 ${large} 1 ${f1(pA[0] + Math.cos(a1) * R)} ${f1(pA[1] + Math.sin(a1) * R * 0.62)}`;
          };
          back += `<g opacity="${f2(yrOp)}">
            <ellipse cx="${f1(pA[0])}" cy="${f1(pA[1])}" rx="${f1(R)}" ry="${f1(R * 0.62)}" fill="rgba(10,12,20,0.25)" stroke="#fff" stroke-opacity="0.35" stroke-width="3"/>
            ${lap > 0.01 ? `<path d="${arc(Math.min(1, lap))}" fill="none" stroke="${C.gold}" stroke-width="9" stroke-linecap="round"/>` : ''}
            ${lap > 1.01 ? `<path d="${arc(lap - 1)}" fill="none" stroke="${C.goldHi}" stroke-width="15" stroke-linecap="round" opacity="0.85"/>` : ''}
            ${ticks.join('')}
            <path d="M${f1(pA[0])} ${f1(pA[1])} L${f1(pA[0] + Math.cos(ang) * R * 0.8)} ${f1(pA[1] + Math.sin(ang) * R * 0.8 * 0.62)}" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>`;
          const cp = popIn(t, 26.85, 0.4);
          front += callout('~2 YEARS', pA[0], pA[1] - R * 0.62 - 150 * s, { size: 92, op: yrOp * cl01(cp * 2), sc: cp });
          // handlers
          const hOp = win(t, 27.85, 31.2, 0.25, 0.4);
          if (hOp > 0.01) {
            icons.push({ kind: 'handler', x: rx + 70 * s, y: baseY + 12 * s, s: s * 0.95, face: -1, ph: t * 4, walk: 0, op: hOp });
            icons.push({ kind: 'handler', x: rx - 76 * s, y: baseY + 20 * s, s: s * 0.95, face: 1, ph: t * 4, walk: 0, op: hOp });
          }
        }
        // camels: wild ones trot in (29.4–30.6) then the formed caravan (30.6–44.5)
        if (t > 29.2) {
          const lineX = (i) => rx - (90 + i * 84) * s;
          for (let i = 0; i < 4; i++) {
            const t0 = 29.4 + i * 0.22;
            const u = easeInOut(prog(t, t0, 0.85));
            if (u <= 0) continue;
            const from = [[-420, -260], [380, -300], [-460, 120], [420, 160]][i];
            const x = lerp(rx + from[0] * s, lineX(i), u);
            const y = lerp(baseY + from[1] * s, baseY, u);
            const wild = u < 0.98;
            const face = u < 1 ? (lineX(i) > rx + from[0] * s ? 1 : -1) : 1;
            icons.push({ kind: 'camel', x, y, s, face, ph: t * 7 + i, walk: u < 1 ? 1 : 0, wild, op: smooth(t0, t0 + 0.15, t) });
            if (u >= 0.98 && u < 1.0001) front += burst(x, y - 60 * s, s * 0.6, prog(t, t0 + 0.85, 0.35), C.goldHi);
          }
        }
        // B6 money: empty purse + moth, NatGeo chip, coins (31.6–36.4)
        const mOp = win(t, 31.62, 36.45, 0.2, 0.35);
        if (mOp > 0.01) {
          const px = rx + 6 * s;
          const py = baseY - 140 * s;
          const pp = popIn(t, 31.66, 0.35);
          const full = smooth(34.6, 35.3, t);
          const sc = s * pp * (1 + 0.15 * full);
          front += `<g transform="translate(${f1(px)} ${f1(py)}) scale(${f2(sc)})" opacity="${f2(mOp)}" filter="url(#dsS)">
            <path d="M-34 -6 Q -40 34 0 38 Q 40 34 34 -6 Q 22 -16 0 -16 Q -22 -16 -34 -6 Z" fill="#8b5a2b" stroke="#15171c" stroke-width="3"/>
            <path d="M-26 -12 Q 0 ${f1(-30 + 10 * full)} 26 -12" stroke="#15171c" stroke-width="3" fill="none"/>
            <path d="M-12 -18 l -6 -12 M 12 -18 l 6 -12" stroke="#d9b36b" stroke-width="3" stroke-linecap="round"/>
            ${full > 0.5 ? `<text x="0" y="22" text-anchor="middle" font-family="${F.anton}" font-size="30" fill="${C.goldHi}" stroke="#15171c" stroke-width="3" paint-order="stroke">$</text>` : ''}
          </g>`;
          const ng = popIn(t, 33.0, 0.4);
          front += chip('NATIONAL GEOGRAPHIC', 540, 330, { op: win(t, 32.95, 36.6, 0.15, 0.35) * cl01(ng * 2), sc: ng, size: 40 });
          // moth flutters out of the empty purse ("She needs money.")
          const mt = prog(t, 31.95, 1.5);
          if (mt > 0 && mt < 1) {
            const flap = Math.abs(Math.sin(t * 30));
            front += `<g transform="translate(${f1(px + 60 * s * mt + Math.sin(mt * 12) * 10)} ${f1(py - 40 * s - 120 * s * mt)}) scale(${f2(s)})" opacity="${f2(1 - mt)}">
              <ellipse cx="0" cy="0" rx="3" ry="8" fill="#8f8a80"/>
              <path d="M0 -2 Q ${f1(-18 * flap)} -16 ${f1(-16 * flap)} 4 Z M0 -2 Q ${f1(18 * flap)} -16 ${f1(16 * flap)} 4 Z" fill="#cfc8b8" stroke="#6b665c" stroke-width="1.2"/></g>`;
          }
          // coins drop on "pay"
          for (let i = 0; i < 5; i++) {
            const u = prog(t, 34.45 + i * 0.12, 0.42);
            if (u <= 0 || u >= 1) continue;
            const cx2 = px + (-40 + i * 20) * s;
            const cy2 = lerp(py - 260 * s, py - 4 * s, easeIn(u));
            front += `<g transform="translate(${f1(cx2)} ${f1(cy2)}) scale(${f2(s)})"><ellipse rx="13" ry="13" fill="${C.gold}" stroke="#7a4a06" stroke-width="3"/><text y="7" text-anchor="middle" font-family="${F.anton}" font-size="18" fill="#7a4a06">$</text></g>`;
          }
          // "on one condition:" warning badge
          const wp = popIn(t, 35.25, 0.3);
          if (wp > 0) front += `<g transform="translate(${f1(px + 66 * s)} ${f1(py - 40 * s)}) scale(${f2(wp * s)})" opacity="${f2(mOp)}" filter="url(#dsS)">
            <path d="M0 -26 L 24 16 L -24 16 Z" fill="${C.gold}" stroke="#15171c" stroke-width="3" stroke-linejoin="round"/>
            <text x="0" y="11" text-anchor="middle" font-family="${F.anton}" font-size="30" fill="#15171c">!</text></g>`;
        }
        // B7 alone: spotlight (39.6–41.4)
        const spOp = win(t, 39.75, 41.6, 0.4, 0.4);
        if (spOp > 0.01) front += `<radialGradient id="spotU" gradientUnits="userSpaceOnUse" cx="${f1(rx - 90 * s)}" cy="${f1(baseY - 30 * s)}" r="760"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="0.3" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.66"/></radialGradient><rect width="${W}" height="${H}" fill="url(#spotU)" opacity="${f2(spOp)}"/>`;
        // the formed caravan rides along through 30.6–44.5
        if (t >= 30.62 + 0.85) {
          // (icons already pushed above as arrived camels)
        }
      }
    }
    if (t >= 44.54 && t < 79.0) {
      // walking beats: caravan at the route head; dog trots alongside; series camel at the back
      const f = headAt(t);
      const walk = t > 69.5 && t < 72.35 ? 0 : 1;
      const series = smooth(44.6, 45.2, t);
      const cv = caravan(t, f, { walk, series, gap: 62 });
      for (const it of cv) icons.push(it);
      const lead = cv[0];
      if (lead) {
        // dog — trots beside her until the disaster beat
        const dOp = smooth(44.6, 45.0, t) * (1 - smooth(70.3, 72.1, t));
        if (dOp > 0.01) {
          const ghost = t > 69.9;
          icons.push({ kind: 'dog', x: lead.x + 34 * lead.s * lead.face, y: lead.y + 16 * lead.s, s: lead.s, face: lead.face, ph: t * 8 * walk, op: dOp, ghost });
          if (t > 67.6 && t < 72.2) {
            const ro = win(t, 67.7, 72.2, 0.4, 0.8);
            front += `<ellipse cx="${f1(lead.x + 34 * lead.s * lead.face)}" cy="${f1(lead.y + 6 * lead.s)}" rx="${f1(40 * lead.s)}" ry="${f1(16 * lead.s)}" fill="none" stroke="#fff" stroke-width="2.5" opacity="${f2(0.7 * ro)}"/>`;
          }
          // a small light rises gently as the dog fades (no depiction of the act)
          const lu = prog(t, 70.6, 1.8);
          if (lu > 0 && lu < 1) front += `<circle cx="${f1(lead.x + 34 * lead.s * lead.face)}" cy="${f1(lead.y - 20 * lead.s - 90 * lu * lead.s)}" r="${f1(6 * lead.s)}" fill="#fff" opacity="${f2(Math.sin(lu * Math.PI) * 0.8)}"/>`;
        }
        // elder companion: joins near Docker River, walks part of the way, stops at Warburton
        const eIn = smooth(54.1, 54.7, t);
        const eOut = 1 - smooth(57.35, 58.1, t);
        if (eIn * eOut > 0.01) {
          const ef = t < 57.3 ? Math.max(fD - 0.01, f) : fWb;
          const q = ROUTE.at(ef);
          const sq = projXY(q[0], q[1]);
          if (sq) {
            const join = easeOut(prog(t, 54.1, 1.0));
            const sz = zs(z) * sq[2];
            const offY = lerp(-90, -26, join) * sz;
            const offX = lerp(40, 22, join) * sz * lead.face;
            icons.push({ kind: 'elder', x: sq[0] + offX, y: sq[1] + offY, s: sz, face: lead.face, ph: t * 7.5 + 1.1, walk: t < 57.3 ? walk : 0, op: eIn * eOut });
          }
        }
      }
    }

    // --- drawn route (44.5 →), turns red for the series master map
    const rf = t < 44.5 ? 0 : t < 79 ? headAt(t) : 1;
    const routeOp = t < 94.2 ? 1 : 1 - smooth(94.3, 94.75, t);
    if (rf > 0.0005 && routeOp > 0.01) {
      const red = smooth(90.3, 91.2, t);
      const wpx = lerp(11, 7, smooth(30, 120, 300 - z)) * clamp(Math.pow(z / 120, 0.18), 0.75, 1.25);
      const d = pathXY(ROUTE.slice(0, rf));
      back += routeStroke(d, wpx, { op: routeOp });
      if (red > 0.001) {
        const rd = pathXY(ROUTE.slice(0, red));
        back += routeStroke(rd, wpx * 1.05, { col: C.red, core: C.redHi, op: routeOp });
      }
      // glowing leading edge
      if (t > 44.5 && t < 77.2) {
        const q = ROUTE.at(rf);
        const sq = projXY(q[0], q[1]);
        if (sq) back += `<circle cx="${f1(sq[0])}" cy="${f1(sq[1])}" r="${f1(16 + 5 * Math.sin(t * 9))}" fill="url(#sunGlow)" opacity="0.9"/>`;
      }
    }

    // --- B8 Uluru: dimension from Alice, highlight ring + label (45.4–49.8)
    const dOp = win(t, 45.6, 47.6, 0.3, 0.45);
    if (dOp > 0.01) {
      const a = proj(...P.alice);
      const b = proj(...P.uluru);
      if (a && b) {
        const sp = [];
        for (let i = 0; i <= 12; i++) sp.push([lerp(a[0], b[0], i / 12), lerp(a[1], b[1], i / 12)]);
        back += dimension(sp, -95, '~335 KM', dOp, { dy: -46, size: 62, sc: popIn(t, 45.7) });
      }
    }
    const uOp = win(t, 46.6, 50.0, 0.2, 0.5);
    if (uOp > 0.01) {
      const p = proj(...P.uluru);
      if (p) {
        const r = 30 * zk * p[2];
        back += `<g opacity="${f2(uOp)}">${ringPulse(p[0], p[1], t, 46.7, r, r * 3.2, C.gold, 1.1, 2, 0.62)}
          <ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="${f1(r * 1.6)}" ry="${f1(r * 1.0)}" fill="none" stroke="#fff" stroke-width="3"/></g>`;
        back += label('ULURU', p[0] - 30, p[1] + r * 1.6 + 62, { size: lerp(36, 56, smooth(150, 380, z)), ls: 8, op: uOp, sc: popIn(t, 46.84) });
      }
    }
    // --- B8 deep into the desert: Gibson Desert region highlight (49.4–53.3)
    const gOp = win(t, 49.35, 53.4, 0.5, 0.6);
    if (gOp > 0.01 && window.GEO && GEO.regions['Gibson Desert']) {
      let d = '';
      for (const r of GEO.regions['Gibson Desert']) d += pathLL(r, true);
      const pulse = 0.85 + 0.15 * Math.sin(t * 4);
      back += `<g opacity="${f2(gOp)}"><path d="${d}" fill="rgba(255,200,90,${f2(0.16 * pulse)})" stroke="#fff" stroke-width="10" stroke-opacity="0.18" stroke-linejoin="round"/>
        <path d="${d}" fill="none" stroke="#fff" stroke-width="2.6" stroke-dasharray="12 7" stroke-linejoin="round"/></g>`;
      const p = proj(...P.gibsonLbl);
      if (p) back += label('GIBSON DESERT', p[0], p[1], { size: 40, ls: 6, op: gOp, sc: popIn(t, 49.6) });
    }
    // --- B9 language: quiet speech bubbles (51.0–53.6)
    const lgOp = win(t, 51.05, 53.7, 0.3, 0.4);
    if (lgOp > 0.01 && t >= 44.54) {
      const q = ROUTE.at(headAt(t));
      const sq = projXY(q[0], q[1]);
      if (sq) {
        const s = zk * sq[2];
        [51.3, 51.9, 52.5].forEach((tt, i) => {
          const p = popIn(t, tt, 0.3);
          if (p > 0) front += bubble(sq[0] + (-50 + i * 50) * s, sq[1] - (110 + (i % 2) * 26) * s, 0.8 * s * p, '…', { op: lgOp, fs: 36 });
        });
      }
    }
    // --- B9 "part of the way": soft white bracket over the shared stretch (55.3–58.2)
    const pwOp = win(t, 55.4, 58.3, 0.4, 0.6);
    if (pwOp > 0.01) {
      const sp = screenPts(ROUTE.slice(fD, Math.min(headAt(t), fWb)));
      if (sp.length > 2) back += `<path d="${dPts(offsetPolyline(sp, -22))}" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity="${f2(0.85 * pwOp)}"/>`;
    }

    // --- B10 rumours: ripples + "?" around her (57.4–61.4)
    const rmOp = win(t, 57.45, 61.5, 0.3, 0.5);
    if (rmOp > 0.01) {
      const srcs = [[151.2, -33.9], [153.0, -27.5], [145.0, -37.8], [138.6, -34.9], [115.9, -31.95], [130.84, -12.46]];
      srcs.forEach((s, i) => {
        const p = proj(...s);
        if (p) back += `<g opacity="${f2(rmOp)}">${ringPulse(p[0], p[1], t, 57.5 + i * 0.12, 6, 200, '#fff', 1.4, 2, 0.62)}<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="6" fill="#fff"/></g>`;
      });
      const q = ROUTE.at(headAt(t));
      const sq = projXY(q[0], q[1]);
      if (sq) {
        [58.3, 58.6, 58.9, 59.2].forEach((tt, i) => {
          const p = popIn(t, tt, 0.3);
          const ang = i * 1.7 + 0.5;
          if (p > 0) front += bubble(sq[0] + Math.cos(ang) * 120, sq[1] - 60 + Math.sin(ang) * 60, 0.75 * p, '?', { op: rmOp, fs: 32, col: C.red });
        });
      }
    }
    // --- B10 journalists hunting: magnifiers sweep toward her (59.4–66.3)
    const mgOp = win(t, 59.45, 66.35, 0.35, 0.12);
    if (mgOp > 0.01) {
      const q = ROUTE.at(headAt(t));
      const sq = projXY(q[0], q[1]);
      if (sq) {
        for (let i = 0; i < 4; i++) {
          const u = easeInOut(prog(t, 59.5 + i * 0.25, 4.2));
          const st0 = [[1000, 300], [1060, 1250], [700, 160], [980, 760]][i];
          const x = lerp(st0[0], sq[0] + 70 + i * 34, u) + Math.sin(t * 2.4 + i) * 40 * (1 - u);
          const y = lerp(st0[1], sq[1] - 40 + i * 26, u) + Math.cos(t * 2.1 + i) * 30 * (1 - u);
          front += `<g opacity="${f2(mgOp)}">${magnifier(x, y, 1.6, -20 + Math.sin(t * 3 + i) * 18)}</g>`;
        }
      }
    }
    // --- Gag 3 search party of reporters: press-car swarm, her dot edges away (64.25–66.35)
    if (t > 64.2 && t < 66.4) {
      const q = ROUTE.at(headAt(t));
      const sq = projXY(q[0], q[1]);
      if (sq) {
        const N = 40;
        const cut = 1 - smooth(66.3, 66.38, t);
        for (let i = 0; i < N; i++) {
          const t0 = 64.28 + rand(i) * 0.55;
          const u = easeOut(prog(t, t0, 1.35));
          if (u <= 0) continue;
          const ang = Math.PI * (-0.55 + 1.2 * rand(i + 50)); // mostly from the east / north / south
          const R0 = 700 + 300 * rand(i + 9);
          const sx = sq[0] + Math.cos(ang) * R0;
          const sy = sq[1] + Math.sin(ang) * R0 * 0.75;
          const ringR = 90 + 130 * rand(i + 3);
          const tx = sq[0] + 30 + Math.cos(ang) * ringR;
          const ty = sq[1] + Math.sin(ang) * ringR * 0.62;
          const x = lerp(sx, tx, u);
          const y = lerp(sy, ty, u);
          icons.push({ raw: pressCar(x, y, 1.45, tx < sx ? -1 : 1, i, t + i), x, y: y + 0.01 * i, op: cut });
        }
      }
    }

    // --- B13 nine months chip
    const nmOp = win(t, 73.3, 76.6, 0.2, 0.4);
    if (nmOp > 0.01) front += callout('9 MONTHS', 540, 470, { size: 120, op: nmOp, sc: popIn(t, 73.38, 0.4) });
    // --- B13 west coast glow + label, Hamelin Pool pin (77.3–79.3)
    const wcOp = win(t, 77.4, 79.25, 0.3, 0.3);
    if (wcOp > 0.01 && window.GEO) {
      const ring = GEO.coast.reduce((a, r) => (r.length > a.length ? r : a), []);
      const seg = ring.filter(([lo, la]) => lo < 116.2 && la < -21.6 && la > -29.6);
      if (seg.length > 2) {
        const d = pathLL(seg, false).replace(/M/g, (m, i) => (i === 0 ? 'M' : 'L'));
        back += `<g opacity="${f2(wcOp)}" fill="none" stroke-linejoin="round" stroke-linecap="round">
          <path d="${d}" stroke="#fff" stroke-width="16" stroke-opacity="0.25" filter="url(#blur6)"/>
          <path d="${d}" stroke="#fff" stroke-width="4"/></g>`;
      }
      const p = proj(115.0, -23.3);
      if (p) back += label('WEST COAST', p[0], p[1], { size: 42, ls: 6, anchor: 'start', op: wcOp, sc: popIn(t, 77.5) });
      const h = proj(...P.hamelin);
      if (h) {
        back += pin(h[0], h[1], 0.85 * zk, 77.9, t, C.gold);
        back += label('HAMELIN POOL', h[0] + 22, h[1] + 34, { size: 26, ls: 2, anchor: 'start', op: wcOp * cl01(popIn(t, 78.0)) });
      }
    }

    // --- Gag 5 wade into the sea (79.0–89.0)
    if (t >= 79.0 && t < 89.3) {
      const shore = [mxl(P.hamelin[0]), myl(P.hamelin[1])];
      const wOp = 1 - smooth(88.6, 89.25, t);
      const pp = projXY(shore[0] + 0.012 / COS, shore[1] - 0.012);
      if (pp) {
        const s = zk * pp[2] * 1.5;
        icons.push({ kind: 'person', x: pp[0], y: pp[1], s, face: -1, ph: 0, walk: 0, armsUp: smooth(80.2, 80.6, t) * (0.6 + 0.4 * Math.sin(t * 6)), op: wOp });
        const order = [0, 1, 2, 3, 4];
        order.forEach((i) => {
          const t0 = 79.25 + i * 0.3;
          const u = easeInOut(prog(t, t0, 0.75));
          const land = [shore[0] + (0.035 + i * 0.03) / COS, shore[1] + (i % 2 ? 0.006 : -0.005)];
          const isSeries = i === 4;
          const water = isSeries ? [shore[0] + 0.012 / COS, shore[1] + 0.022] : [shore[0] - (0.022 + i * 0.016) / COS, shore[1] + (i - 1.5) * 0.017];
          const X = lerp(land[0], water[0], u);
          const Y = lerp(land[1], water[1], u);
          const sp = projXY(X, Y);
          if (!sp) return;
          const ss = zk * sp[2] * 1.3;
          const sink = isSeries ? 0 : smooth(0.55, 1, u) * 16 * ss;
          const it = { kind: isSeries ? 'series' : 'camel', x: sp[0], y: sp[1], s: ss, face: water[0] < land[0] ? -1 : 1, ph: t * 7 + i, walk: u > 0 && u < 1 ? 1 : 0.15, op: wOp, sink };
          icons.push(it);
          // splash on entry (big for the first camel)
          const sp0 = prog(t, t0 + 0.42, 1.1);
          if (!isSeries && sp0 > 0 && sp0 < 1) {
            const big = i === 0 ? 1.7 : 1;
            const ry = Math.cos(CAM.tilt * D2R);
            for (let k = 0; k < 3; k++) {
              const uu = cl01(sp0 * 1.25 - k * 0.15);
              if (uu <= 0) continue;
              back += `<ellipse cx="${f1(sp[0])}" cy="${f1(sp[1])}" rx="${f1((20 + 150 * uu) * ss * big)}" ry="${f1((20 + 150 * uu) * ss * big * ry)}" fill="none" stroke="#e9fbff" stroke-width="${f1(5 * (1 - uu) + 1)}" opacity="${f2((1 - uu) * 0.9)}"/>`;
            }
            for (let k = 0; k < 14; k++) {
              const a = (k / 14) * Math.PI * 2 + rand(k + i * 20);
              const v = (0.6 + 0.6 * rand(k + 7 + i)) * big;
              const dx = Math.cos(a) * 90 * v * sp0 * ss;
              const dy = -Math.sin(Math.PI * cl01(sp0 * 1.4)) * 120 * v * ss + Math.sin(a) * 30 * sp0 * ss;
              front += `<circle cx="${f1(sp[0] + dx)}" cy="${f1(sp[1] - 30 * ss + dy)}" r="${f1((3 + 4 * rand(k)) * ss)}" fill="#f2fdff" stroke="#7fc8e0" stroke-width="1" opacity="${f2((1 - sp0) * wOp)}"/>`;
            }
            if (sp0 < 0.45) {
              const c = sp0 / 0.45;
              front += `<path d="M${f1(sp[0] - 40 * ss * big)} ${f1(sp[1])} ${[...Array(9)].map((_, k) => `L${f1(sp[0] + (-40 + k * 10) * ss * big)} ${f1(sp[1] - (k % 2 ? 46 : 14) * ss * big * Math.sin(c * Math.PI))}`).join(' ')} L${f1(sp[0] + 50 * ss * big)} ${f1(sp[1])} Z" fill="#effcff" opacity="${f2(0.85 * (1 - c) * wOp)}"/>`;
            }
          }
          // standing ripples once in the water
          if (!isSeries && u >= 1) back += `<g opacity="${f2(wOp)}">${ringPulse(sp[0], sp[1], t, t0 + 1.2 + i * 0.2, 26 * ss, 70 * ss, '#e9fbff', 1.6, 2, Math.cos(CAM.tilt * D2R))}</g>`;
          // surprised "!" (never seen that much water)
          const ep = popIn(t, 81.6 + i * 0.12, 0.3);
          if (!isSeries && ep > 0 && t < 84.2) front += `<g opacity="${f2(1 - smooth(83.8, 84.2, t))}">${bubble(sp[0] + 10 * ss, sp[1] - 130 * ss, 0.7 * ss * ep, '!', { fs: 34, col: C.red })}</g>`;
        });
      }
      // like (86.9–88.4)
      const lp = popIn(t, 86.94, 0.4);
      if (lp > 0 && t < 88.6) {
        const lo = 1 - smooth(88.0, 88.5, t);
        front += `<g transform="translate(540 600) scale(${f2(lp * 1.25)})" opacity="${f2(lo)}" filter="url(#ds)">
          <circle r="92" fill="${C.red}" stroke="#fff" stroke-width="8"/>
          <path d="M-38 -6 L -16 -6 L -16 46 L -38 46 Z M -10 -6 L 6 -40 Q 14 -54 22 -44 Q 26 -38 22 -26 L 18 -12 L 42 -12 Q 54 -10 50 4 L 42 38 Q 38 46 28 46 L -10 46 Z" fill="#fff"/>
        </g>`;
        for (let k = 0; k < 6; k++) {
          const u = prog(t, 87.0 + k * 0.1, 1.1);
          if (u > 0 && u < 1) front += `<path transform="translate(${f1(540 + (-140 + k * 56) + Math.sin(u * 8 + k) * 12)} ${f1(560 - 220 * u)}) scale(${f2(0.9 + 0.4 * rand(k))})" d="M0 6 C -14 -6 -10 -18 0 -10 C 10 -18 14 -6 0 6 Z" fill="${C.redHi}" stroke="#fff" stroke-width="2" opacity="${f2(lo * (1 - u))}"/>`;
        }
      }
    }
    // --- whole route + 2,700 km (87.8–90.2)
    const wrOp = win(t, 87.85, 90.4, 0.35, 0.5);
    if (wrOp > 0.01) back += dimension(screenPts(ROUTE.slice(0, 1)), 40, '2,700 KM', wrOp, { dy: 78, sc: popIn(t, 87.9) });

    // --- Gag 6 master map: earlier episodes' routes, red join, title chip, series camel (89.8–94.4)
    const mmOp = win(t, 89.85, 94.55, 0.4, 0.3);
    if (mmOp > 0.01) {
      const r1 = easeInOut(prog(t, 89.9, 1.2));
      const r2 = easeInOut(prog(t, 90.1, 1.2));
      back += routeStroke(pathXY(LEP1.slice(0, r1)), 6, { col: C.red, core: C.redHi, op: mmOp * 0.95 });
      back += routeStroke(pathXY(LEP2.slice(0, r2)), 6, { col: C.red, core: C.redHi, op: mmOp * 0.95 });
      const tag = (txt, lon, lat, t0) => {
        const p = proj(lon, lat);
        if (!p) return '';
        const s = popIn(t, t0, 0.35);
        return `<g transform="translate(${f1(p[0])} ${f1(p[1])}) scale(${f2(s)})" opacity="${f2(mmOp)}" filter="url(#dsS)">
          <rect x="-46" y="-21" width="92" height="42" rx="21" fill="${C.red}" stroke="#fff" stroke-width="3"/>
          <text y="10" text-anchor="middle" font-family="${F.mont}" font-weight="900" font-size="24" letter-spacing="1" fill="#fff">${txt}</text></g>`;
      };
      const ends = [LEP1.at(1), LEP2.at(1)];
      ends.forEach((e) => {
        const p = projXY(e[0], e[1]);
        if (p) back += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="7" fill="#fff" stroke="${C.red}" stroke-width="3" opacity="${f2(mmOp)}"/>`;
      });
      back += tag('EP. 1', 149.4, -24.6, 90.5) + tag('EP. 2', 112.6, -5.2, 90.7) + tag('EP. 4', 123.0, -28.6, 90.45);
      const h = proj(...P.hamelin);
      if (h) back += `<circle cx="${f1(h[0])}" cy="${f1(h[1])}" r="7" fill="#fff" stroke="${C.red}" stroke-width="3" opacity="${f2(mmOp)}"/>`;
      // next one: dashed red line into the unknown + "?" (92.5–94.4)
      const nx = easeInOut(prog(t, 92.55, 1.0));
      if (nx > 0) {
        back += dashed(pathXY(LNEXT.slice(0, nx)), 5, mmOp, { col: C.red, flow: true, t });
        const e = LNEXT.at(nx);
        const p = projXY(e[0], e[1]);
        if (p && nx > 0.95) back += bubble(p[0], p[1] - 10, popIn(t, 93.5, 0.3) * 1.1, '?', { col: C.red, op: mmOp, fs: 34 });
      }
      // title chip with the series camel walking on it
      const cp = popIn(t, 90.9, 0.4);
      front += chip('IMPOSSIBLE JOURNEYS', 540, 300, { op: mmOp * cl01(cp * 2), sc: cp, size: 46, acc: C.red });
      const sc2 = easeOut(prog(t, 90.3, 1.2));
      front += camel(lerp(260, 470, sc2), 238 + 0, 1.25 * cl01(cp * 2), 1, t * 7, { series: true, op: mmOp, walk: sc2 < 1 ? 1 : 0.35 });
    }

    // --- photographer gag (Gag 2): whack-a-mole camera pops along the dashed route + "click!" flashes
    const pops = [[41.58, 0.36], [42.06, 0.12], [42.4, 0.62], [42.74, 0.24], [43.74, -1]];
    pops.forEach(([tt, fr], i) => {
      if (t < tt - 0.05 || t > tt + 0.85) return;
      let x;
      let y;
      let k = 1;
      if (fr >= 0) {
        const q = ROUTE.at(fr);
        const sq = projXY(q[0], q[1]);
        if (!sq) return;
        x = sq[0];
        y = sq[1];
        k = sq[2];
      } else {
        const a = proj(...P.alice);
        if (!a) return;
        x = a[0] - 150;
        y = a[1] + 30;
        k = 1.2;
      }
      const up = easeOutBack(prog(t, tt, 0.18), 2.4) * (1 - easeIn(prog(t, tt + 0.6, 0.22)));
      const fl = 1 - prog(t, tt + 0.16, 0.22);
      const s = 2.0 * k;
      front += `<g>
        <ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(30 * s)}" ry="${f1(9 * s)}" fill="#1a0f06" opacity="${f2(0.85 * Math.min(1, up * 3))}"/>
        <clipPath id="hole${i}"><rect x="${f1(x - 80 * s)}" y="${f1(y - 160 * s)}" width="${f1(160 * s)}" height="${f1(160 * s)}"/></clipPath>
        <g clip-path="url(#hole${i})">${cameraIcon(x, y + (1 - up) * 50 * s, s, t > tt + 0.16 && fl > 0 ? fl : 0)}</g>
        ${t > tt + 0.16 && fl > 0 ? label('click!', x + 40 * s, y - 70 * s, { font: F.anton, fw: 400, size: 44 * s, ls: 1, op: fl, sc: 0.8 + 0.4 * (1 - fl) }) : ''}
      </g>`;
      if (fr < 0 && t > tt + 0.16 && t < tt + 0.36) front += `<rect width="${W}" height="${H}" fill="#fff" opacity="${f2(0.35 * (1 - prog(t, tt + 0.16, 0.2)))}"/>`;
    });

    // depth-sort icons
    icons.sort((a, b) => a.y - b.y);
    let ic = '';
    for (const it of icons) {
      if (it.raw) {
        ic += it.op == null ? it.raw : `<g opacity="${f2(it.op)}">${it.raw}</g>`;
        continue;
      }
      if (it.op != null && it.op <= 0.01) continue;
      if (it.sink) {
        // clip the legs at the water line, then lay a little waterline ripple
        const id = 'wl' + Math.round(it.x) + '_' + Math.round(it.y);
        ic += `<clipPath id="${id}"><rect x="${f1(it.x - 200)}" y="${f1(it.y - 400)}" width="400" height="${f1(400 - it.sink * 0.15)}"/></clipPath>
          <g clip-path="url(#${id})"><g transform="translate(0 ${f1(it.sink)})">${drawIcon(it)}</g></g>
          <ellipse cx="${f1(it.x)}" cy="${f1(it.y)}" rx="${f1(34 * it.s)}" ry="${f1(8 * it.s)}" fill="none" stroke="#e9fbff" stroke-width="2.5" opacity="0.8"/>`;
      } else ic += drawIcon(it);
    }
    return back + ic + front;
  }

  // ---------------------------------------------------------------- atmosphere (sky, horizon haze, ocean glow)
  function atmosphere(t) {
    let s = '';
    const tl = CAM.tilt * D2R;
    const yh = CAM.fy - (FOCAL * Math.cos(tl)) / Math.max(1e-3, Math.sin(tl));
    if (yh > -500) {
      const yH = Math.min(yh, H);
      s += `<rect x="0" y="0" width="${W}" height="${f1(Math.max(0, yH + 2))}" fill="url(#sky)"/>`;
      s += `<rect x="0" y="${f1(yH - 30)}" width="${W}" height="260" fill="url(#hazeTop)" opacity="0.9" transform="translate(0 0)"/>`;
      s += `<rect x="0" y="${f1(yH - 6)}" width="${W}" height="14" fill="#e4f3ff" opacity="0.45" filter="url(#blur6)"/>`;
    }
    // Indian Ocean glow at the far edge (opening / loop)
    const og = Math.max(1 - smooth(2.6, 4.6, t), smooth(94.5, 95.2, t));
    if (og > 0.01) {
      const p = proj(112.6, -24.0);
      const gx = p ? clamp(p[0], -200, W + 200) : 180;
      const gy = p ? clamp(p[1], yh, yh + 400) : yh + 60;
      s += `<ellipse cx="${f1(gx)}" cy="${f1(gy)}" rx="620" ry="170" fill="url(#oceanGlow)" opacity="${f2(0.75 * og)}"/>`;
      s += `<ellipse cx="${f1(gx + 60)}" cy="${f1(yh + 6)}" rx="420" ry="60" fill="url(#sunGlow)" opacity="${f2(0.55 * og)}"/>`;
    }
    // atmospheric edge haze
    s += `<rect x="0" y="0" width="${W}" height="420" fill="url(#hazeTop)" opacity="${f2(0.65 - 0.4 * smooth(40, 10, CAM.tilt))}"/>`;
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
  // caption nudges where a graphic would sit in the ~70% band
  function capYAt(t) {
    if (t > 79.2 && t < 84.2) return CAP_Y + 60; // wading camels sit just above the band
    return CAP_Y;
  }

  // ---------------------------------------------------------------- frame
  window.renderFrame = function (t) {
    if (!stageEl) return;
    t = clamp(t, 0, DUR - 1e-4);
    CAM = camAt(t);
    const tw = trackW(t);
    if (tw > 0.001) {
      const q = ROUTE.at(headAt(t));
      CAM.cx = lerp(CAM.cx, q[0], tw);
      CAM.cy = lerp(CAM.cy, q[1], tw);
    }
    M = camMatrix(CAM);
    updateMap();
    // Gag 4 — disaster: the map desaturates (music drops out in the mix); colour returns toward the coast
    const desat = smooth(66.32, 67.0, t) * (1 - smooth(72.6, 75.6, t));
    stageEl.style.filter = desat > 0.001 ? `saturate(${f2(1 - 0.94 * desat)}) brightness(${f2(1 - 0.12 * desat)}) contrast(${f2(1 + 0.06 * desat)})` : 'none';
    const gx = Math.floor(rand(Math.floor(t * 30)) * 384);
    const gy = Math.floor(rand(Math.floor(t * 30) + 0.5) * 384);
    ovEl.innerHTML = `${defs()}
      ${atmosphere(t)}
      ${overlays(t)}
      <rect y="${H * 0.62}" width="${W}" height="${H * 0.38}" fill="url(#botShade)" opacity="0.7"/>
      <rect width="${W}" height="${H}" fill="url(#vig)"/>
      <rect width="${W + 384}" height="${H + 384}" fill="url(#grainP)" opacity="0.06" transform="translate(${-gx} ${-gy})" style="mix-blend-mode:overlay"/>
      ${smolanCard(t)}
      ${hookCard(t)}
      ${captions(t, capYAt(t))}`;
  };
})();
