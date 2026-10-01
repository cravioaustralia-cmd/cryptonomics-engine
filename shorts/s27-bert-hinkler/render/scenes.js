/* s27 Bert Hinkler — MAP EXPLAINER (Impossible Journeys ep.2)
 * SVG + renderFrame(t) + Playwright + ffmpeg. No Remotion.
 *
 * One continuous kinetic map. A persistent SVG holds the satellite basemap layers
 * (tools/build_basemap.py) and two pre-rendered orthographic globes. One eased camera
 * blends between them: every overlay point is projected through BOTH the flat Mercator
 * camera and the globe camera, and mixed by the camera's globe weight `g`. Routes and
 * pins therefore morph between flat map and globe as the camera dives or pulls out.
 * All seams come from transcript.json (faster-whisper word timings on the held VO).
 */
(function () {
  'use strict';
  const W = 1080, H = 1920, FY = 860; // camera focus sits above the ~70% caption band
  const CAP_Y = Math.round(H * 0.70);
  const WU = 100000; // world units per normalised Mercator unit (image placement)
  const DUR = 91.248;

  window.__assetsReady = false;
  const EP = (window.EPISODE = { duration: DUR, fps: 30, words: [], scenes: [] });

  // ------------------------------------------------------------------ maths
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const E = {
    l: (x) => x,
    i: (x) => x * x * x,
    o: (x) => 1 - Math.pow(1 - x, 3),
    io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    io5: (x) => (x < 0.5 ? 16 * Math.pow(x, 5) : 1 - Math.pow(-2 * x + 2, 5) / 2),
    o5: (x) => 1 - Math.pow(1 - x, 5),
    back: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    el: (x) => (x === 0 || x === 1 ? x : Math.pow(2, -9 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3.2)) + 1),
  };
  const sstep = (x) => x * x * (3 - 2 * x);
  const pop = (t, a, d = 0.35) => E.back(seg(t, a, a + d));
  const fade = (t, a, b, d = 0.2) => Math.min(seg(t, a, a + d), 1 - seg(t, b - d, b));
  const f2 = (n) => (Math.round(n * 100) / 100).toString();
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };
  const D2R = Math.PI / 180;

  // ------------------------------------------------------------- projection
  const mu = (lon) => (lon + 180) / 360;
  const mv = (lat) => { const r = clamp(lat, -85, 85) * D2R; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2; };
  const latOfV = (v) => Math.atan(Math.sinh(Math.PI * (1 - 2 * v))) / D2R;
  const hav = (a, b) => {
    const R = 6371, la1 = a[1] * D2R, la2 = b[1] * D2R, dl = (b[0] - a[0]) * D2R;
    const h = Math.sin((la2 - la1) / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dl / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  // orthographic globes (pre-rendered images, see build_basemap.py)
  const GL = { intro: { lon0: 14, lat0: 39, key: 'globe' }, over: { lon0: 85, lat0: 10, key: 'globe-over' } };
  function orth(lon, lat, G) {
    const l = (lon - G.lon0) * D2R, p = lat * D2R, p0 = G.lat0 * D2R;
    return [Math.cos(p) * Math.sin(l), Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l),
      Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l)];
  }
  let CAM = { u: 0.5, v: 0.5, S: 1000, span: 40, g: 0, gl: 'intro', R: 500, gcx: 540, gcy: FY };
  const Pm = (lon, lat) => [540 + (mu(lon) - CAM.u) * CAM.S, FY + (mv(lat) - CAM.v) * CAM.S];
  const Pg = (lon, lat) => { const o = orth(lon, lat, GL[CAM.gl]); return [CAM.gcx + CAM.R * o[0], CAM.gcy - CAM.R * o[1], o[2]]; };
  // blended projection → [x, y, z]  (z < 0: behind the globe)
  function P(lon, lat) {
    const g = CAM.g;
    if (g <= 0.001) { const m = Pm(lon, lat); m.push(1); return m; }
    const q = Pg(lon, lat);
    if (g >= 0.999) return q;
    const m = Pm(lon, lat);
    return [lerp(m[0], q[0], g), lerp(m[1], q[1], g), g > 0.5 ? q[2] : 1];
  }
  const onScreen = (x, y, m = 200) => x > -m && x < W + m && y > -m && y < H + m;
  // screen-space scale factor of the map at a point (for map-anchored props)
  const zoomK = () => lerp(1, 0.75, CAM.g);

  // monotone cubic (Fritsch–Carlson) through [[t, value], ...]
  function monotone(pts) {
    const n = pts.length, xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const d = [], m = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
      const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
      if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
    }
    return (x) => {
      if (x <= xs[0]) return ys[0];
      if (x >= xs[n - 1]) return ys[n - 1];
      let i = 0; while (x > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
    };
  }

  // ------------------------------------------------------------------ routes
  const R = {}; // name → {pts:[[lon,lat]], km:[], total, prog(t)}
  function makeRoute(name, wp, table, step = 3) {
    const pts = [wp[0]], km = [0], wpKm = [0];
    for (let i = 1; i < wp.length; i++) {
      const a = wp[i - 1], b = wp[i], d = hav(a, b), n = Math.max(1, Math.ceil(d / step));
      for (let k = 1; k <= n; k++) {
        pts.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]);
        km.push(km[km.length - 1] + d / n);
      }
      wpKm.push(km[km.length - 1]);
    }
    const r = { name, pts, km, wpKm, total: km[km.length - 1] };
    r.prog = monotone(table || [[0, 0], [1, r.total]]);
    R[name] = r;
    return r;
  }
  function idxAtKm(r, k) {
    let lo = 0, hi = r.km.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (r.km[m] <= k) lo = m; else hi = m; }
    return lo;
  }
  function atKm(r, k) { // → {lon, lat, u, v, dx, dy (mercator heading)}
    k = clamp(k, 0, r.total);
    const i = idxAtKm(r, k), j = Math.min(i + 1, r.km.length - 1);
    const f = r.km[j] > r.km[i] ? (k - r.km[i]) / (r.km[j] - r.km[i]) : 0;
    const lon = lerp(r.pts[i][0], r.pts[j][0], f), lat = lerp(r.pts[i][1], r.pts[j][1], f);
    const a = r.pts[idxAtKm(r, k - 30)], b = r.pts[Math.min(r.km.length - 1, idxAtKm(r, Math.min(r.total, k + 30)) + 1)];
    let dx = mu(b[0]) - mu(a[0]), dy = mv(b[1]) - mv(a[1]);
    const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
    return { lon, lat, u: mu(lon), v: mv(lat), dx, dy };
  }
  const head = (name, t) => atKm(R[name], R[name].prog(t));
  // screen heading of a route at km (through the blended projection)
  function screenDir(r, k) {
    const a = atKm(r, k - 12), b = atKm(r, k + 12);
    const pa = P(a.lon, a.lat), pb = P(b.lon, b.lat);
    return Math.atan2(pb[1] - pa[1], pb[0] - pa[0]) / D2R;
  }
  // screen path of a route between km a..b (breaks where the globe hides it)
  function routePath(r, kA, kB) {
    kA = clamp(kA, 0, r.total); kB = clamp(kB, 0, r.total);
    if (kB <= kA) return '';
    const i0 = idxAtKm(r, kA), i1 = idxAtKm(r, kB);
    const s = atKm(r, kA), e = atKm(r, kB);
    const pts = [[s.lon, s.lat]];
    for (let i = i0 + 1; i <= i1; i++) pts.push(r.pts[i]);
    pts.push([e.lon, e.lat]);
    return polyPath(pts, false);
  }
  function polyPath(pts, close) {
    let d = '', lx = 1e9, ly = 1e9, pen = false;
    for (let i = 0; i < pts.length; i++) {
      const [x, y, z] = P(pts[i][0], pts[i][1]);
      if (z < 0.02) { pen = false; continue; }
      if (pen && Math.abs(x - lx) + Math.abs(y - ly) < 1.5 && i < pts.length - 1) continue;
      d += (pen ? 'L' : 'M') + f2(x) + ' ' + f2(y); lx = x; ly = y; pen = true;
    }
    return d && close ? d + 'Z' : d;
  }

  // ------------------------------------------------------------------ camera
  // keys: {t, c:[lon,lat] | 'route' (follow its head), s: span° of longitude across 1080 px,
  //        g: globe weight 0..1, gl: which globe, e: ease, lead}
  let KEYS = [];
  function keyCenter(k, t) {
    if (typeof k.c === 'string') {
      const h = head(k.c, t), lead = (k.lead != null ? k.lead : 0.1) * (k.s / 360);
      return [h.u + h.dx * lead + (k.ox || 0) * (k.s / 360), h.v + h.dy * lead + (k.oy || 0) * (k.s / 360)];
    }
    return [mu(k.c[0]), mv(k.c[1])];
  }
  function camAt(t) {
    let i = 0;
    while (i < KEYS.length - 2 && t >= KEYS[i + 1].t) i++;
    const k0 = KEYS[i], k1 = KEYS[i + 1];
    const raw = clamp((t - k0.t) / (k1.t - k0.t), 0, 1);
    const p = (E[k1.e || 'io'])(raw);
    const c0 = keyCenter(k0, t), c1 = keyCenter(k1, t);
    const ls0 = Math.log(k0.s), ls1 = Math.log(k1.s);
    const span = Math.exp(lerp(ls0, ls1, p));
    let w = p;
    if (Math.abs(ls1 - ls0) > 0.7) w = (span - k0.s) / (k1.s - k0.s); // zoom-aware pan (target stays framed)
    let u = lerp(c0[0], c1[0], w), v = lerp(c0[1], c1[1], w);
    // globe weight follows the log-zoom so the hand-off lands mid-dive
    const g0 = k0.g || 0, g1 = k1.g || 0;
    let g = g0;
    if (g0 !== g1) {
      const zp = Math.abs(ls1 - ls0) > 0.3 ? (Math.log(span) - ls0) / (ls1 - ls0) : p;
      g = lerp(g0, g1, sstep(clamp((zp - 0.25) / 0.5, 0, 1)));
    }
    const gl = g1 > 0 ? k1.gl || k0.gl || 'over' : k0.gl || 'over';
    // always-moving camera: slow breathing drift layered on every move
    const dr = 0.018 * Math.sin(t * 0.61) + 0.012 * Math.sin(t * 1.37 + 1.1);
    const sp = span * (1 + dr);
    u += (span / 360) * 0.012 * Math.sin(t * 0.43 + 0.7);
    v += (span / 360) * 0.010 * Math.sin(t * 0.52 + 2.1);
    const flon = u * 360 - 180, flat = latOfV(v);
    const Rg = (W * 180) / (Math.PI * sp * Math.cos(flat * D2R));
    const o = orth(flon, flat, GL[gl]);
    return { u, v, span: sp, S: (W * 360) / sp, g, gl, R: Rg, gcx: 540 - Rg * o[0], gcy: FY + Rg * o[1] };
  }
  function camShake(t, a, b, amp) {
    const k = fade(t, a, b, 0.06) * amp;
    return [noise1(t * 31) * k, noise1(t * 29 + 7) * k];
  }

  // ------------------------------------------------------------------ DOM
  let BASE, GEO, svg, camG, globeEl, globeG, starsG, layerEls = {}, desatM, blurF, mapG, routeG, gradeG, ovG, capG, measureCtx;
  const LAYER_ORDER = ['world', 'route', 'europe', 'aus', 'italy', 'london', 'darwin', 'tuscany', 'bundaberg'];
  const LAYER_MAX_SPAN = { world: 1e9, route: 80, europe: 34, aus: 34, italy: 9, london: 7, darwin: 5, tuscany: 2.4, bundaberg: 1.3 };

  function stars() {
    let s = '';
    for (let i = 0; i < 260; i++) {
      const x = hash(i * 3.1) * W, y = hash(i * 7.7 + 1) * H, r = 0.6 + 1.8 * Math.pow(hash(i * 1.3 + 5), 3);
      s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="#fff" opacity="${f2(0.25 + 0.7 * hash(i * 9.1))}"/>`;
    }
    return s;
  }

  function buildDom() {
    const root = document.getElementById('root');
    root.innerHTML = `
<svg id="S" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="desat" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feColorMatrix id="desatM" type="saturate" values="1"/>
    </filter>
    <filter id="mblur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur id="mblurB" stdDeviation="0 0"/></filter>
    <filter id="ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#020814" flood-opacity="0.65"/></filter>
    <filter id="ds2" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#020814" flood-opacity="0.7"/></filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="glow4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="soft3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="atmo" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18"/></filter>
    <filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.6 0 0 0 2.05" result="m"/>
      <feComposite in="SourceGraphic" in2="m" operator="in"/>
    </filter>
    <filter id="sepia" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="0.39 0.72 0.17 0 0.02  0.35 0.66 0.15 0 0.01  0.27 0.52 0.12 0 0  0 0 0 1 0"/>
    </filter>
    <mask id="bite" maskUnits="userSpaceOnUse" x="-80" y="-80" width="160" height="160">
      <rect x="-80" y="-80" width="160" height="160" fill="#fff"/>
      <circle cx="17" cy="-4" r="11" fill="#000"/><circle cx="8" cy="-13" r="9" fill="#000"/>
    </mask>
    <image id="phSLQ" href="/img/s27_01_bert_hinkler_aviator_slq.jpg" x="-180" y="-235" width="360" height="470" preserveAspectRatio="xMidYMin slice"/>
    <image id="ph27" href="/img/s27_02_bert_hinkler_aged_27.jpg" x="-170" y="-226" width="340" height="460" preserveAspectRatio="xMidYMid slice"/>
    <image id="phAvian" href="/img/s27_03_bert_hinkler_avro_avian_1928.jpg" x="0" y="0" width="244" height="190" preserveAspectRatio="xMidYMid slice"/>
    <clipPath id="ovalC"><ellipse rx="160" ry="214"/></clipPath>
    <clipPath id="frameClip"><rect x="40" y="150" width="1000" height="1080" rx="26"/></clipPath>
    <clipPath id="stampClip"><rect x="-200" y="-400" width="400" height="352"/></clipPath>
    <radialGradient id="vig" cx="50%" cy="46%" r="75%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#01050f" stop-opacity="0.78"/>
    </radialGradient>
    <radialGradient id="spot" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#01050f" stop-opacity="0"/><stop offset="0.35" stop-color="#01050f" stop-opacity="0"/><stop offset="1" stop-color="#01050f" stop-opacity="0.82"/>
    </radialGradient>
    <radialGradient id="atmoG" cx="50%" cy="50%" r="50%">
      <stop offset="0.86" stop-color="#5fb4ff" stop-opacity="0"/><stop offset="0.93" stop-color="#6fc1ff" stop-opacity="0.55"/><stop offset="1" stop-color="#6fc1ff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="pinG" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ff8a5c"/><stop offset="1" stop-color="#c3261a"/></radialGradient>
    <radialGradient id="pinY" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#e08a00"/></radialGradient>
    <radialGradient id="pinGrey" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#f4f6f8"/><stop offset="1" stop-color="#9aa3ae"/></radialGradient>
    <radialGradient id="sandG" cx="40%" cy="20%" r="90%"><stop offset="0" stop-color="#f6e6b8"/><stop offset="0.6" stop-color="#e2c486"/><stop offset="1" stop-color="#b8935a"/></radialGradient>
    <radialGradient id="desertG" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffcf7a" stop-opacity="0.55"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
    <radialGradient id="seaG" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#67e8ff" stop-opacity="0.5"/><stop offset="1" stop-color="#67e8ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="paperG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4ead2"/><stop offset="1" stop-color="#dccaa0"/></linearGradient>
    <linearGradient id="newsG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1e8d2"/><stop offset="0.6" stop-color="#e6d9b8"/><stop offset="1" stop-color="#d2c095"/></linearGradient>
    <linearGradient id="chipG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14233d" stop-opacity="0.94"/><stop offset="1" stop-color="#070f1e" stop-opacity="0.94"/></linearGradient>
    <linearGradient id="goldG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a3"/><stop offset="1" stop-color="#e3a419"/></linearGradient>
    <linearGradient id="camelG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7b56c"/><stop offset="1" stop-color="#c18a42"/></linearGradient>
    <linearGradient id="wingG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f4efe2"/><stop offset="1" stop-color="#d8d0bc"/></linearGradient>
    <linearGradient id="cardG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c99b5e"/><stop offset="1" stop-color="#a87a42"/></linearGradient>
    <linearGradient id="bpG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1d4f9c"/><stop offset="1" stop-color="#123a78"/></linearGradient>
    <linearGradient id="skyFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030a1a" stop-opacity="0.55"/><stop offset="0.22" stop-color="#030a1a" stop-opacity="0"/><stop offset="0.78" stop-color="#030a1a" stop-opacity="0"/><stop offset="1" stop-color="#030a1a" stop-opacity="0.6"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#020818"/>
  <g id="mapG" filter="url(#desat)">
    <g id="blurG">
      <g id="starsG">${stars()}</g>
      <g id="camG"></g>
      <g id="globeG"><circle id="atmo" fill="url(#atmoG)"/><image id="globeImg" preserveAspectRatio="none"/></g>
      <g id="routeG"></g>
    </g>
  </g>
  <g id="gradeG"></g>
  <g id="ovG"></g>
  <rect width="${W}" height="${H}" fill="url(#skyFade)" pointer-events="none"/>
  <g id="capG"></g>
  <text id="measure" x="-9999" y="-9999" font-family="Montserrat" visibility="hidden"></text>
</svg>`;
    svg = document.getElementById('S');
    camG = document.getElementById('camG');
    globeG = document.getElementById('globeG');
    globeEl = document.getElementById('globeImg');
    starsG = document.getElementById('starsG');
    mapG = document.getElementById('mapG');
    desatM = document.getElementById('desatM');
    blurF = document.getElementById('mblurB');
    routeG = document.getElementById('routeG');
    gradeG = document.getElementById('gradeG');
    ovG = document.getElementById('ovG');
    capG = document.getElementById('capG');
    const loads = [];
    for (const name of LAYER_ORDER) {
      const b = BASE[name];
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      el.setAttribute('href', '/img/' + b.file);
      el.setAttribute('x', b.u0 * WU); el.setAttribute('y', b.v0 * WU);
      el.setAttribute('width', (b.u1 - b.u0) * WU); el.setAttribute('height', (b.v1 - b.v0) * WU);
      el.setAttribute('preserveAspectRatio', 'none');
      loads.push(new Promise((res) => { el.addEventListener('load', res, { once: true }); el.addEventListener('error', res, { once: true }); }));
      camG.appendChild(el);
      layerEls[name] = el;
    }
    return Promise.all(loads);
  }

  let curGlobe = '';
  function placeLayers() {
    const g = CAM.g;
    const mercOp = 1 - sstep(seg(g, 0.45, 1));
    const globeOp = sstep(seg(g, 0, 0.55));
    camG.style.display = mercOp > 0.001 ? '' : 'none';
    camG.setAttribute('opacity', f2(mercOp));
    if (mercOp > 0.001) {
      const s = CAM.S / WU;
      camG.setAttribute('transform', `matrix(${s} 0 0 ${s} ${540 - CAM.u * CAM.S} ${FY - CAM.v * CAM.S})`);
      const vu0 = CAM.u - 540 / CAM.S, vu1 = CAM.u + 540 / CAM.S, vv0 = CAM.v - FY / CAM.S, vv1 = CAM.v + (H - FY) / CAM.S;
      for (const name of LAYER_ORDER) {
        const b = BASE[name];
        const vis = !(b.u1 < vu0 || b.u0 > vu1 || b.v1 < vv0 || b.v0 > vv1);
        const max = LAYER_MAX_SPAN[name];
        const op = name === 'world' ? 1 : clamp((max - CAM.span) / (max * 0.3), 0, 1);
        layerEls[name].setAttribute('opacity', vis ? f2(op) : '0');
        layerEls[name].style.display = vis && op > 0.001 ? '' : 'none';
      }
    }
    globeG.style.display = globeOp > 0.001 ? '' : 'none';
    starsG.style.display = globeOp > 0.001 ? '' : 'none';
    if (globeOp > 0.001) {
      const want = BASE[GL[CAM.gl].key].file;
      if (curGlobe !== want) { globeEl.setAttribute('href', '/img/' + want); curGlobe = want; }
      const Rr = CAM.R;
      globeEl.setAttribute('x', f2(CAM.gcx - Rr)); globeEl.setAttribute('y', f2(CAM.gcy - Rr));
      globeEl.setAttribute('width', f2(2 * Rr)); globeEl.setAttribute('height', f2(2 * Rr));
      const at = document.getElementById('atmo');
      at.setAttribute('cx', f2(CAM.gcx)); at.setAttribute('cy', f2(CAM.gcy)); at.setAttribute('r', f2(Rr * 1.09));
      globeG.setAttribute('opacity', f2(globeOp));
      starsG.setAttribute('opacity', f2(globeOp * (1 - 0.5 * seg(Rr, 900, 1800))));
      starsG.setAttribute('transform', `translate(${f2(-CAM.u * 120 % 40)} ${f2(-CAM.v * 90 % 30)})`);
    }
  }

  // ---------------------------------------------------------------- captions
  let PHRASES = null;
  function buildPhrases(words) {
    const out = [];
    let cur = [];
    const flush = () => { if (cur.length) out.push(cur); cur = []; };
    for (let i = 0; i < words.length; i++) {
      const w = words[i], prev = cur[cur.length - 1];
      if (prev && (w.start - prev.end > 0.42 || /[.?!…,”]$/.test(prev.word) || cur.length >= 4)) flush();
      cur.push(w);
    }
    flush();
    return out.map((g, i) => {
      const next = out[i + 1];
      const end = Math.min(next ? next[0].start - 0.02 : g[g.length - 1].end + 0.5, g[g.length - 1].end + 0.55);
      return { words: g, start: g[0].start - 0.06, end };
    });
  }
  const _mcache = {};
  function measure(text, size, weight = 900, ls = 1.2) {
    const key = text + '|' + size + '|' + weight + '|' + ls;
    if (_mcache[key] != null) return _mcache[key];
    measureCtx.setAttribute('font-size', size); measureCtx.setAttribute('font-weight', weight); measureCtx.setAttribute('letter-spacing', ls);
    measureCtx.textContent = text;
    return (_mcache[key] = measureCtx.getComputedTextLength());
  }
  function drawCaptions(t) {
    if (!PHRASES || PHRASES._n !== (EP.words || []).length) { PHRASES = buildPhrases(EP.words || []); PHRASES._n = (EP.words || []).length; }
    const ph = PHRASES.find((p) => t >= p.start && t < p.end);
    if (!ph) return '';
    const size = 62, maxW = 900, gapW = 30, lineH = 78;
    const toks = ph.words.map((w) => ({ w, s: w.word.toUpperCase(), wd: measure(w.word.toUpperCase(), size) }));
    const lines = [[]]; let lw = 0;
    for (const tk of toks) {
      if (lw + tk.wd > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
      lines[lines.length - 1].push(tk); lw += tk.wd + gapW;
    }
    const k = E.back(seg(t, ph.start, ph.start + 0.16));
    const op = seg(t, ph.start, ph.start + 0.08) * (1 - seg(t, ph.end - 0.06, ph.end));
    const y0 = CAP_Y - ((lines.length - 1) * lineH) / 2;
    let s = `<g opacity="${f2(op)}" transform="translate(540 ${CAP_Y}) scale(${f2(0.9 + 0.1 * k)}) translate(-540 ${-CAP_Y})">`;
    lines.forEach((ln, li) => {
      const tot = ln.reduce((a, b) => a + b.wd, 0) + gapW * (ln.length - 1);
      let x = 540 - tot / 2;
      const y = y0 + li * lineH + size * 0.36;
      for (const tk of ln) {
        const active = t >= tk.w.start - 0.03 && t < tk.w.end + 0.06;
        const said = t >= tk.w.start - 0.03;
        const ak = active ? E.back(seg(t, tk.w.start - 0.03, tk.w.start + 0.1)) : 0;
        const sc = 1 + 0.045 * ak;
        const cx = x + tk.wd / 2;
        const fill = active ? '#FFD23F' : said ? '#FFFFFF' : '#E8EDF5';
        s += `<text x="${f2(cx)}" y="${f2(y)}" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="${size}" letter-spacing="1.2"
          transform="translate(${f2(cx)} ${f2(y - size * 0.35)}) scale(${f2(sc)}) translate(${f2(-cx)} ${f2(-(y - size * 0.35))})"
          fill="${fill}" stroke="#060b17" stroke-width="11" stroke-linejoin="round" paint-order="stroke" filter="url(#ds2)">${esc(tk.s)}</text>`;
        x += tk.wd + gapW;
      }
    });
    return s + '</g>';
  }

  // ===================================================================== ART
  function label3d(text, x, y, size, o = {}) {
    const depth = o.depth != null ? o.depth : Math.max(3, Math.round(size / 18));
    const face = o.fill || '#ffffff', side = o.side || '#0b1a33', edge = o.edge || '#0b1a33';
    const sc = o.scale != null ? o.scale : 1, op = o.op != null ? o.op : 1, rot = o.rot || 0;
    const ls = o.ls != null ? o.ls : size * 0.02;
    const font = o.font || 'Anton', weight = o.weight || 400;
    let ex = '';
    for (let d = depth; d >= 1; d--) ex += `<text x="${d * 0.8}" y="${d}" fill="${side}">${esc(text)}</text>`;
    return `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)}) scale(${f2(sc)})" opacity="${f2(op)}" filter="url(#ds)"
      font-family="${font}" font-weight="${weight}" font-size="${size}" text-anchor="${o.anchor || 'middle'}" letter-spacing="${f2(ls)}">
      ${ex}<text x="0" y="0" fill="${face}" stroke="${edge}" stroke-width="${f2(size / 26)}" paint-order="stroke">${esc(text)}</text></g>`;
  }
  function placeLabel(text, x, y, t, t0, o = {}) {
    if (t < t0) return '';
    const k = pop(t, t0, 0.4), op = seg(t, t0, t0 + 0.15) * (o.op != null ? o.op : 1) * (o.until ? 1 - seg(t, o.until - 0.25, o.until) : 1);
    if (op <= 0) return '';
    return label3d(text, x, y, o.size || 46, { font: 'Montserrat', weight: 900, scale: 0.6 + 0.4 * k, op, depth: o.depth || 3, ls: o.ls != null ? o.ls : 3, fill: o.fill, rot: o.rot });
  }
  function chip(text, x, y, o = {}) {
    const size = (o.size || 38) * 1.18, padX = o.padX || 32, h = size * 1.7;
    const wd = measure(text, size, 800, 2) + padX * 2 + (o.icon ? h * 0.85 : 0);
    const sc = o.scale != null ? o.scale : 1, op = o.op != null ? o.op : 1;
    if (op <= 0.001) return '';
    const acc = o.accent || '#FFC233';
    let icon = '';
    if (o.icon) icon = `<g transform="translate(${f2(-wd / 2 + padX * 0.55 + h * 0.36)} 0) scale(${f2(h / 100)})">${o.icon}</g>`;
    const tx = o.icon ? -wd / 2 + padX * 0.55 + h * 0.85 + (wd - padX * 0.55 - h * 0.85 - padX) / 2 : 0;
    return `<g transform="translate(${f2(x)} ${f2(y)}) scale(${f2(sc)})" opacity="${f2(op)}" filter="url(#ds)">
      <rect x="${f2(-wd / 2)}" y="${f2(-h / 2)}" width="${f2(wd)}" height="${f2(h)}" rx="${f2(h / 2)}" fill="${o.bg || 'url(#chipG)'}" stroke="${acc}" stroke-width="3"/>
      ${icon}
      <text x="${f2(tx)}" y="${f2(size * 0.35)}" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="${size}" letter-spacing="2" fill="${o.color || '#fff'}">${esc(text)}</text></g>`;
  }
  function pin(x, y, t, t0, o = {}) {
    if (t < t0) return '';
    const sz = o.size || 1, g = o.grad || 'pinG';
    const d = seg(t, t0, t0 + 0.28), drop = (1 - E.i(d)) * -160 * sz;
    const sq = t > t0 + 0.28 ? 1 - 0.18 * Math.sin(seg(t, t0 + 0.28, t0 + 0.5) * Math.PI) : 1;
    const rp = seg(t, t0 + 0.26, t0 + 0.95);
    const op = o.op != null ? o.op : 1;
    if (op <= 0.001) return '';
    return `<g transform="translate(${f2(x)} ${f2(y)})" opacity="${f2(op)}">
      ${rp > 0 && rp < 1 ? `<ellipse rx="${f2(10 + 70 * sz * E.o(rp))}" ry="${f2((10 + 70 * sz * E.o(rp)) * 0.42)}" fill="none" stroke="#fff" stroke-width="${f2(4 * (1 - rp))}" opacity="${f2(1 - rp)}"/>` : ''}
      <ellipse rx="${f2(14 * sz)}" ry="${f2(5 * sz)}" fill="#000" opacity="${f2(0.35 * d)}"/>
      <g transform="translate(0 ${f2(drop)}) scale(${f2(sz / sq * 0.95)} ${f2(sz * sq)})" filter="url(#ds2)">
        <path d="M0,0 C-5,-12 -21,-22 -21,-40 A21,21 0 1 1 21,-40 C21,-22 5,-12 0,0 Z" fill="url(#${g})" stroke="#fff" stroke-width="3.5"/>
        <circle cy="-40" r="8" fill="#fff"/>
        ${o.inner || ''}
      </g></g>`;
  }
  // pin anchored at a lon/lat (hidden behind the globe)
  function mapPin(ll, t, t0, o = {}) {
    const [x, y, z] = P(ll[0], ll[1]);
    if (z < 0.05 || !onScreen(x, y)) return '';
    return pin(x, y, t, t0, o);
  }
  const ICON_PERSON = `<g fill="#fff"><circle cx="0" cy="-22" r="13"/><path d="M-22,22 C-22,-2 22,-2 22,22 Z"/></g>`;

  // --- Avro Avian, top-down, facing +x (~112 units nose to tail) -----------------
  function planeTop(o = {}) {
    const wing = o.wing || 'url(#wingG)', body = o.body || '#e6dfcd', line = o.line || '#2b2620';
    const prop = o.prop != null ? o.prop : 0;
    const blade = Math.cos(prop);
    const twin = o.twin;
    const heads = o.heads || 1;
    let hd = '';
    for (let i = 0; i < heads; i++) {
      const hx = twin ? -2 - i * 9 : -14, hy = twin ? (i % 2 ? 3.5 : -3.5) : 0;
      hd += `<circle cx="${hx}" cy="${hy}" r="${twin ? 3.6 : 4.4}" fill="#5b3b22" stroke="#1d130b" stroke-width="1.2"/>`;
    }
    const span = twin ? 84 : 64, chord = twin ? 24 : 20;
    return `<g stroke="${line}" stroke-linejoin="round">
      <path d="M-40,-22 L-50,-22 Q-56,-22 -56,-16 L-56,16 Q-56,22 -50,22 L-40,22 L-37,4 L-37,-4 Z" fill="${wing}" stroke-width="2"/>
      <path d="M-4,${-span + 2} L${chord - 6},${-span + 2} L${chord - 6},${span - 2} L-4,${span - 2} Z" fill="#a69d88" stroke-width="1.6"/>
      ${twin ? `<rect x="10" y="-36" width="26" height="12" rx="5" fill="#6b6f74" stroke-width="1.6"/><rect x="10" y="24" width="26" height="12" rx="5" fill="#6b6f74" stroke-width="1.6"/>` : ''}
      <path d="M50,-6 C54,-6 57,-3 57,0 C57,3 54,6 50,6 L-38,4.5 L-58,2 L-58,-2 L-38,-4.5 Z" fill="${body}" stroke-width="2.2"/>
      <path d="M57,0 L44,0" stroke="#8d939a" stroke-width="7" stroke-linecap="round"/>
      <path d="M2,${-span} Q0,${-span} 0,${-span + 6} L0,${span - 6} Q0,${span} 2,${span} L${chord},${span} Q${chord + 3},${span} ${chord + 3},${span - 6} L${chord + 3},${-span + 6} Q${chord + 3},${-span} ${chord},${-span} Z" fill="${wing}" stroke-width="2.2"/>
      ${[-48, -32, -16, 16, 32, 48].filter((y) => Math.abs(y) < span - 4).map((y) => `<path d="M3,${y} L${chord},${y}" stroke="#bdb39c" stroke-width="1.2"/>`).join('')}
      <circle cx="${chord * 0.45}" cy="${-span * 0.62}" r="2.2" fill="${line}" stroke="none"/><circle cx="${chord * 0.45}" cy="${span * 0.62}" r="2.2" fill="${line}" stroke="none"/>
      ${o.reg ? `<text x="${chord * 0.5}" y="${span * 0.42}" transform="rotate(-90 ${chord * 0.5} ${span * 0.42})" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="9" fill="#2b2620" stroke="none" letter-spacing="1">G-EBOV</text>` : ''}
      <ellipse cx="${twin ? -6 : -14}" cy="0" rx="${twin ? 16 : 8}" ry="${twin ? 8 : 5.5}" fill="#2d2016" stroke-width="1.5"/>
      ${hd}
      <path d="M-50,0 L-58,0" stroke="${line}" stroke-width="3"/>
      <ellipse cx="59" cy="0" rx="2.4" ry="18" fill="#fff" opacity="0.28" stroke="none"/>
      <path d="M59,${f2(-17 * blade)} L59,${f2(17 * blade)}" stroke="#3a2f25" stroke-width="3.2" stroke-linecap="round"/>
      ${twin ? `<ellipse cx="38" cy="-30" rx="2" ry="13" fill="#fff" opacity="0.28" stroke="none"/><ellipse cx="38" cy="30" rx="2" ry="13" fill="#fff" opacity="0.28" stroke="none"/>` : ''}
    </g>`;
  }
  function planeShadow(o = {}) {
    const span = o.twin ? 84 : 64, chord = o.twin ? 24 : 20;
    return `<g fill="#000"><path d="M50,-6 C56,-6 57,0 57,0 C57,0 56,6 50,6 L-58,2 L-58,-2 Z"/>
      <rect x="0" y="${-span}" width="${chord + 3}" height="${2 * span}" rx="5"/><rect x="-56" y="-22" width="18" height="44" rx="5"/></g>`;
  }
  // plane at screen (x, y) heading `ang`°, scale `sc`, altitude `alt` (shadow offset px)
  function planeAt(x, y, ang, sc, alt, t, o = {}) {
    const op = o.op != null ? o.op : 1;
    if (op <= 0.001) return '';
    const so = alt * 0.9;
    return `<g opacity="${f2(op)}">
      <g transform="translate(${f2(x + so * 0.55)} ${f2(y + so)}) rotate(${f2(ang)}) scale(${f2(sc * (1 - Math.min(0.25, alt * 0.004)))})" opacity="${f2(0.32 - Math.min(0.14, alt * 0.0025))}" filter="url(#soft3)">${planeShadow(o)}</g>
      <g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(ang)}) scale(${f2(sc)})" filter="url(#ds2)">${planeTop({ ...o, prop: t * 70 })}</g></g>`;
  }

  // --- gag props ---------------------------------------------------------------
  function bird(flap, s = 1) { // ibis-ish, white with dark wingtips, facing +x
    const f = Math.sin(flap);
    return `<g transform="scale(${f2(s)})" stroke-linecap="round" stroke-linejoin="round">
      <path d="M-24,${f2(-14 * f)} Q-10,${f2(-6 - 10 * f)} 0,0 Q10,${f2(-6 - 10 * f)} 24,${f2(-14 * f)}" fill="none" stroke="#f8f8f4" stroke-width="5"/>
      <path d="M-24,${f2(-14 * f)} L-17,${f2(-10 * f - 3)} M24,${f2(-14 * f)} L17,${f2(-10 * f - 3)}" stroke="#1a1a1a" stroke-width="5"/>
      <ellipse cx="2" cy="1" rx="10" ry="4.5" fill="#f8f8f4"/><circle cx="12" cy="-1" r="3.6" fill="#222"/>
      <path d="M14,0 Q22,2 26,9" fill="none" stroke="#222" stroke-width="2.2"/></g>`;
  }
  // young Bert with cardboard wings (side view, facing +x, feet at 0, ~120 units tall)
  function wingKid(o = {}) {
    const flap = o.flap || 0, run = o.run || 0, crouch = o.crouch || 0, look = o.look || 0;
    const ly = crouch * 14;
    const legA = Math.sin(run) * 26, legB = -legA;
    const wingRot = -20 + flap;
    const wingS = `<g transform="rotate(${f2(wingRot)})"><path d="M0,0 L-82,-14 L-90,18 L-6,16 Z" fill="url(#cardG)" stroke="#5a3d1c" stroke-width="2.5"/>
      ${[-70, -52, -34, -16].map((x) => `<path d="M${x},${f2(-12 + (x + 90) * 0.02)} L${x - 3},${f2(17)}" stroke="#7e5a2c" stroke-width="1.6"/>`).join('')}
      <path d="M-30,-6 L-34,15" stroke="#e9e2cc" stroke-width="3"/></g>`;
    return `<g stroke-linejoin="round" stroke-linecap="round">
      <g transform="translate(-4 ${f2(-76 + ly)})">${wingS}</g>
      <g transform="translate(0 ${f2(-40 + ly)})">
        <path d="M0,0 L${f2(Math.sin(legA * D2R) * 34)},${f2(Math.cos(legA * D2R) * 34 - ly * 0.6)}" stroke="#3b3f52" stroke-width="10"/>
        <path d="M0,0 L${f2(Math.sin(legB * D2R) * 34)},${f2(Math.cos(legB * D2R) * 34 - ly * 0.6)}" stroke="#2c3040" stroke-width="10"/></g>
      <rect x="-15" y="${f2(-84 + ly)}" width="30" height="48" rx="11" fill="#e9eef5" stroke="#3b3f52" stroke-width="2.5"/>
      <path d="M-15,${f2(-50 + ly)} L15,${f2(-50 + ly)}" stroke="#7a5d3a" stroke-width="4"/>
      <g transform="translate(2 ${f2(-100 + ly)}) rotate(${f2(-look * 22)})">
        <circle r="17" fill="#eec29a" stroke="#6b4a2f" stroke-width="2.2"/>
        <path d="M-17,-4 Q-15,-22 2,-22 Q18,-22 18,-8 L28,-6 Q22,-1 14,-3 Z" fill="#5b4632" stroke="#3a2a1a" stroke-width="2"/>
        <circle cx="8" cy="0" r="2.3" fill="#2a1a10" stroke="none"/>
        <path d="M4,9 Q9,11 13,8" fill="none" stroke="#6b4a2f" stroke-width="2"/></g>
      <g transform="translate(4 ${f2(-74 + ly)})">${wingS}</g>
    </g>`;
  }
  function dune() {
    return `<g>
      <ellipse cx="20" cy="44" rx="350" ry="34" fill="#000" opacity="0.28" filter="url(#glow4)"/>
      <path d="M-300,40 C-220,10 -120,-120 -10,-150 C60,-168 120,-150 170,-90 C210,-40 260,10 320,40 Z" fill="url(#sandG)" stroke="#a88552" stroke-width="3"/>
      <path d="M-10,-150 C40,-120 90,-60 120,40 L320,40 C260,10 210,-40 170,-90 C120,-150 60,-168 -10,-150 Z" fill="#a8844f" opacity="0.35"/>
      ${[0, 1, 2, 3, 4].map((i) => `<path d="M${-250 + i * 40},${f2(28 - i * 26)} q${40 + i * 6},-14 ${90 + i * 10},-6" fill="none" stroke="#c9a868" stroke-width="2.5" opacity="0.7"/>`).join('')}
      <path d="M-10,-150 C40,-120 90,-60 120,40" fill="none" stroke="#fff3cf" stroke-opacity="0.7" stroke-width="4"/>
      ${[[-200, 10], [-150, -30], [230, 12], [-60, -110], [190, -20]].map(([x, y]) => `<path d="M${x},${y} l-6,-18 M${x},${y} l2,-22 M${x},${y} l9,-16" stroke="#6f8a3a" stroke-width="3" stroke-linecap="round"/>`).join('')}
    </g>`;
  }
  function sandwich(bitten) {
    return `<g ${bitten ? 'mask="url(#bite)"' : ''} stroke-linejoin="round">
      <path d="M-30,16 L30,16 L0,-26 Z" fill="#c98a43" stroke="#6e4214" stroke-width="3"/>
      <path d="M-24,12 L24,12 L0,-19 Z" fill="#f3dfae"/>
      <path d="M-27,17 q5,6 10,0 q5,6 10,0 q5,6 10,0 q5,6 10,0 q5,6 10,0 q5,6 10,0" fill="#5fae3a" stroke="#2f6a1c" stroke-width="2"/>
      <rect x="-20" y="16" width="40" height="5" rx="2" fill="#e0482f"/>
      <path d="M-31,22 L31,22 L28,28 L-28,28 Z" fill="#c98a43" stroke="#6e4214" stroke-width="3"/></g>`;
  }
  // round "not this" badge with an icon and a red slash
  function noBadge(icon, k) {
    return `<g transform="scale(${f2(k)})" filter="url(#ds)"><circle r="56" fill="url(#chipG)" stroke="#fff" stroke-width="4"/>
      ${icon}<circle r="44" fill="none" stroke="#ff3347" stroke-width="9"/><path d="M-31,-31 L31,31" stroke="#ff3347" stroke-width="9" stroke-linecap="round"/></g>`;
  }
  const ICON_ROBOT = `<g fill="#dfe8f5" stroke="#0b1a33" stroke-width="2"><path d="M0,-34 L0,-24" stroke="#dfe8f5" stroke-width="4"/><circle cy="-36" r="4"/>
    <rect x="-22" y="-24" width="44" height="34" rx="9"/><circle cx="-9" cy="-8" r="5" fill="#2bd3ff"/><circle cx="9" cy="-8" r="5" fill="#2bd3ff"/>
    <rect x="-16" y="14" width="32" height="14" rx="4"/></g>`;
  const ICON_SEAT = `<g fill="#dfe8f5" stroke="#0b1a33" stroke-width="2"><circle cx="2" cy="-22" r="10"/><path d="M-18,24 C-18,0 18,-6 20,24 Z"/></g>`;
  // passport stamp: shapes + ink texture, paper backing so it reads on the satellite map
  function passStamp(st, k, t) {
    const sc = lerp(2.5, 1, E.o5(k)), op = seg(k, 0, 0.18);
    const ink = st.ink, w = st.w || 300, h = 112;
    let frame = '';
    if (st.shape === 'rect') frame = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="8" fill="#f6efdc" fill-opacity="0.9" stroke="${ink}" stroke-width="7"/><rect x="${-w / 2 + 9}" y="${-h / 2 + 9}" width="${w - 18}" height="${h - 18}" rx="4" fill="none" stroke="${ink}" stroke-width="2.5"/>`;
    else if (st.shape === 'oval') frame = `<ellipse rx="${w / 2}" ry="${h / 2 + 8}" fill="#f6efdc" fill-opacity="0.9" stroke="${ink}" stroke-width="7"/><ellipse rx="${w / 2 - 10}" ry="${h / 2 - 2}" fill="none" stroke="${ink}" stroke-width="2.5" stroke-dasharray="7 5"/>`;
    else if (st.shape === 'hex') { const a = w / 2, b = h / 2 + 4; frame = `<path d="M${-a},0 L${-a + 30},${-b} L${a - 30},${-b} L${a},0 L${a - 30},${b} L${-a + 30},${b} Z" fill="#f6efdc" fill-opacity="0.9" stroke="${ink}" stroke-width="7"/><path d="M${-a + 14},0 L${-a + 38},${-b + 9} L${a - 38},${-b + 9} L${a - 14},0 L${a - 38},${b - 9} L${-a + 38},${b - 9} Z" fill="none" stroke="${ink}" stroke-width="2.5"/>`; }
    else frame = `<circle r="${w / 2.6}" fill="#f6efdc" fill-opacity="0.9" stroke="${ink}" stroke-width="7"/><circle r="${w / 2.6 - 11}" fill="none" stroke="${ink}" stroke-width="2.5"/>`;
    const fs = st.fs || 40;
    return `<g transform="rotate(${st.rot}) scale(${f2(sc * (st.sc || 1))})" opacity="${f2(op)}">
      <g filter="url(#ds2)">${frame}</g>
      <g filter="url(#ink)">
        <text y="${st.shape === 'circle' ? -4 : 6}" text-anchor="middle" font-family="Anton" font-size="${fs}" letter-spacing="3" fill="${ink}">${esc(st.name)}</text>
        <text y="${st.shape === 'circle' ? 30 : 36}" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="17" letter-spacing="4" fill="${ink}">★ FEB 1928 ★</text>
        ${st.shape === 'circle' ? '' : `<text y="-30" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="13" letter-spacing="5" fill="${ink}">ARRIVED</text>`}
      </g></g>`;
  }
  function camelPeek(k, blink) { // head + neck rising from behind a stamp
    const y = lerp(90, 0, k);
    return `<g transform="translate(-60 ${f2(y - 52)}) scale(1.1)" stroke="#7a5122" stroke-width="2.5" stroke-linejoin="round">
      <path d="M-12,40 C-12,8 -9,-22 -3,-42 L15,-42 C11,-20 11,10 11,40 Z" fill="url(#camelG)"/>
      <path d="M-4,-44 C-6,-60 6,-66 18,-64 C30,-62 44,-58 50,-50 C56,-42 52,-32 42,-32 C32,-32 22,-34 12,-34 C2,-34 -4,-36 -4,-44 Z" fill="url(#camelG)"/>
      <path d="M2,-58 l-8,-14 13,7 Z" fill="#c18a42"/>
      <path d="M8,-63 q4,-8 10,-2 q4,-7 9,0" fill="none" stroke-width="2"/>
      <ellipse cx="17" cy="-52" rx="3.6" ry="${blink ? 0.6 : 4}" fill="#2a1508" stroke="none"/>
      <circle cx="18.2" cy="-53.4" r="1.2" fill="#fff" stroke="none" opacity="${blink ? 0 : 1}"/>
      <ellipse cx="46" cy="-47" rx="1.8" ry="2.4" fill="#7a5122" stroke="none"/>
      <path d="M36,-38 q6,4 12,-1" fill="none" stroke-width="2.2"/>
    </g>`;
  }
  function camelFull(walk, wave) {
    const lg = (ph) => `rotate(${f2(Math.sin(walk + ph) * 18)})`;
    return `<g stroke="#7a5122" stroke-width="3" stroke-linejoin="round">
      <g transform="translate(-34 30) ${lg(0)}"><path d="M-4,0 L-6,52 L2,52 L4,0 Z" fill="#c18a42"/></g>
      <g transform="translate(30 30) ${lg(Math.PI)}"><path d="M-4,0 L-6,52 L2,52 L4,0 Z" fill="#c18a42"/></g>
      <g transform="translate(-20 30) ${lg(Math.PI)}"><path d="M-4,0 L-6,52 L2,52 L4,0 Z" fill="#d9a55b"/></g>
      <g transform="translate(44 30) ${lg(0)}"><path d="M-4,0 L-6,52 L2,52 L4,0 Z" fill="#d9a55b"/></g>
      <path d="M-50,30 C-56,6 -40,-6 -26,-8 C-18,-40 10,-40 16,-12 C26,-14 40,-8 52,4 C60,-26 66,-50 80,-58 C92,-64 104,-58 104,-50 C104,-42 96,-40 88,-42 C82,-30 76,-6 66,30 Z" fill="url(#camelG)"/>
      <ellipse cx="94" cy="-54" rx="3" ry="3.4" fill="#2a1508" stroke="none"/>
      <path d="M84,-64 l4,-10 5,8" fill="#c18a42"/>
      <path d="M-50,22 q-14,-2 -16,14" fill="none"/>
      <path d="M-30,-14 q8,-10 20,-2" fill="#c4122f" stroke="#7a0010"/>
      ${wave ? `<g transform="translate(66 -40) rotate(${f2(-20 + Math.sin(wave) * 25)})"><path d="M0,0 L-30,-30" stroke-width="7" stroke="#c18a42"/></g>` : ''}
    </g>`;
  }
  function thumbsStamp(k) { // vintage rubber-stamp thumbs-up, red ink
    const sc = lerp(2.6, 1, E.o5(k)), op = seg(k, 0, 0.15);
    return `<g transform="rotate(-14) scale(${f2(sc)})" opacity="${f2(op)}">
      <circle r="92" fill="#f6efdc" fill-opacity="0.92" filter="url(#ds2)"/>
      <g filter="url(#ink)" fill="none" stroke="#c4122f">
        <circle r="84" stroke-width="9"/><circle r="70" stroke-width="3" stroke-dasharray="6 6"/>
        <g fill="#c4122f" stroke="none" transform="translate(-4 4) scale(1.05)">
          <path d="M-36,-6 L-16,-6 L-16,40 L-36,40 Z"/>
          <path d="M-10,40 L-10,-6 C0,-14 6,-26 6,-40 C6,-48 20,-48 22,-34 C24,-24 20,-14 18,-8 L38,-8 C48,-8 50,0 46,8 C50,12 48,20 42,22 C46,28 42,34 36,34 C38,40 34,44 26,44 L-4,44 Z"/></g>
        ${[0, 1, 2, 3, 4].map((i) => { const a = (-150 + i * 30) * D2R; return `<path d="M${f2(Math.cos(a) * 77)},${f2(Math.sin(a) * 77)} l0,0" stroke-width="9" stroke-linecap="round"/>`; }).join('')}
      </g></g>`;
  }
  // 1920s newspaper with the real 1928 photo of Bert and his Avro Avian
  function newspaper(k, hk) {
    const w = 600, h = 440;
    const lines = (x, y, n, wd) => { let s = ''; for (let i = 0; i < n; i++) s += `<rect x="${x}" y="${y + i * 13}" width="${f2(wd * (i % 5 === 4 ? 0.6 : 0.92 + 0.08 * hash(i + x)))}" height="5" rx="2" fill="#5b5346" opacity="0.55"/>`; return s; };
    return `<g filter="url(#ds)">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="url(#newsG)" stroke="#9c8a62" stroke-width="2"/>
      <text x="0" y="${-h / 2 + 52}" text-anchor="middle" font-family="Anton" font-size="46" letter-spacing="10" fill="#1d1a15">EXTRA</text>
      <path d="M${-w / 2 + 20},${-h / 2 + 66} L${w / 2 - 20},${-h / 2 + 66} M${-w / 2 + 20},${-h / 2 + 72} L${w / 2 - 20},${-h / 2 + 72}" stroke="#1d1a15" stroke-width="2"/>
      <text x="${-w / 2 + 24}" y="${-h / 2 + 90}" font-family="Montserrat" font-weight="700" font-size="13" letter-spacing="3" fill="#3a342a">FEBRUARY 1928</text>
      <text x="${w / 2 - 24}" y="${-h / 2 + 90}" text-anchor="end" font-family="Montserrat" font-weight="700" font-size="13" letter-spacing="3" fill="#3a342a">LATE EDITION</text>
      <g transform="translate(0 ${-h / 2 + 168}) scale(${f2(0.55 + 0.45 * hk)})" opacity="${f2(seg(hk, 0, 0.2))}">
        <text x="0" y="0" text-anchor="middle" font-family="Anton" font-size="78" letter-spacing="2" fill="#151310">“HUSTLING HINKLER”</text></g>
      <text x="0" y="${-h / 2 + 202}" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="19" letter-spacing="3" fill="#2a251d">ENGLAND TO AUSTRALIA IN 15 DAYS</text>
      <g transform="translate(${-w / 2 + 24} ${-h / 2 + 222})">
        <rect width="250" height="196" fill="#2a251d"/>
        <use href="#phAvian" x="3" y="3" filter="url(#sepia)"/></g>
      ${lines(-w / 2 + 290, -h / 2 + 228, 14, 136)}${lines(-w / 2 + 440, -h / 2 + 228, 14, 136)}
    </g>`;
  }
  function portraitCard(href, k, o = {}) {
    const w = o.w || 360, h = o.h || 514;
    const op = seg(k, 0, 0.15);
    const rot = lerp(o.rot0 != null ? o.rot0 : -14, o.rot || -3, E.back(k));
    const sc = lerp(0.6, 1, E.back(k));
    return `<g transform="rotate(${f2(rot)}) scale(${f2(sc)})" opacity="${f2(op * (o.op != null ? o.op : 1))}" filter="url(#ds)">
      <rect x="${-w / 2 - 18}" y="${-h / 2 - 18}" width="${w + 36}" height="${h + 70}" rx="6" fill="url(#paperG)"/>
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#1b1712"/>
      <use href="${href}" filter="url(#sepia)"/>
      <rect x="-60" y="${-h / 2 - 34}" width="120" height="36" fill="#f2e7b8" opacity="0.78" transform="rotate(4)"/>
      ${o.caption ? `<text x="0" y="${h / 2 + 38}" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="24" letter-spacing="4" fill="#3a2f22">${esc(o.caption)}</text>` : ''}
    </g>`;
  }
  // oval memorial portrait (dignified)
  function ovalPortrait(href, k) {
    const op = seg(k, 0, 0.3), sc = lerp(0.9, 1, E.o(k));
    return `<g transform="scale(${f2(sc)})" opacity="${f2(op)}" filter="url(#ds)">
      <ellipse rx="176" ry="230" fill="url(#goldG)"/><ellipse rx="164" ry="218" fill="#1b1712"/>
      <g clip-path="url(#ovalC)"><use href="${href}" filter="url(#sepia)"/></g>
      <ellipse rx="160" ry="214" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="10"/></g>`;
  }
  function glider(k) { // blueprint card of a home-made glider, lines self-draw
    const dash = (len) => `stroke-dasharray="${len}" stroke-dashoffset="${f2(len * (1 - k))}"`;
    return `<g filter="url(#ds)"><rect x="-170" y="-110" width="340" height="220" rx="10" fill="url(#bpG)" stroke="#cfe2ff" stroke-width="3"/>
      ${[-120, -60, 0, 60, 120].map((x) => `<path d="M${x},-104 L${x},104" stroke="#9ec2ff" stroke-opacity="0.18" stroke-width="1.5"/>`).join('')}
      ${[-60, 0, 60].map((y) => `<path d="M-164,${y} L164,${y}" stroke="#9ec2ff" stroke-opacity="0.18" stroke-width="1.5"/>`).join('')}
      <g fill="none" stroke="#eaf3ff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-140,-10 Q0,-62 140,-10 L130,6 Q0,-40 -130,6 Z" ${dash(640)}/>
        <path d="M-60,-30 L-30,60 M60,-30 L30,60 M-30,60 L30,60 M0,-40 L0,60" ${dash(320)}/>
        <path d="M0,60 L0,84 M-24,84 L24,84" ${dash(120)}/>
      </g></g>`;
  }
  function calendar(month, big, flipK, o = {}) { // tear-off calendar HUD
    const sc = o.scale != null ? o.scale : 1;
    const fy = lerp(0, -40, E.i(flipK)), fo = 1 - flipK;
    return `<g transform="scale(${f2(sc)})" filter="url(#ds)">
      <rect x="-92" y="-96" width="184" height="192" rx="16" fill="#f6f1e6" stroke="#0b1a33" stroke-width="3"/>
      <path d="M-92,-50 L-92,-80 Q-92,-96 -76,-96 L76,-96 Q92,-96 92,-80 L92,-50 Z" fill="#c4122f"/>
      <text x="0" y="-60" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="30" letter-spacing="4" fill="#fff">${esc(month)}</text>
      <circle cx="-50" cy="-96" r="7" fill="#0b1a33"/><circle cx="50" cy="-96" r="7" fill="#0b1a33"/>
      <g transform="translate(0 ${f2(fy)})" opacity="${f2(fo)}"><text x="0" y="${o.yearMode ? 46 : 58}" text-anchor="middle" font-family="Anton" font-size="${o.yearMode ? 74 : 110}" fill="#151310">${esc(big)}</text></g>
      ${o.next != null ? `<g opacity="${f2(flipK)}"><text x="0" y="${o.yearMode ? 46 : 58}" text-anchor="middle" font-family="Anton" font-size="${o.yearMode ? 74 : 110}" fill="#151310">${esc(o.next)}</text></g>` : ''}
    </g>`;
  }
  function stopwatch(a) {
    return `<g filter="url(#ds)"><rect x="-10" y="-74" width="20" height="16" rx="4" fill="#dfe8f5"/><circle r="56" fill="#f6f1e6" stroke="#0b1a33" stroke-width="5"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => `<path d="M0,-46 L0,-38" transform="rotate(${i * 30})" stroke="#0b1a33" stroke-width="4"/>`).join('')}
      <path d="M0,6 L0,-40" transform="rotate(${f2(a)})" stroke="#c4122f" stroke-width="6" stroke-linecap="round"/><circle r="7" fill="#0b1a33"/></g>`;
  }
  function wreath(k) {
    let s = '';
    for (let i = 0; i < 22; i++) {
      if (i / 22 > k) break;
      const a = (-90 + i * (330 / 22)) * D2R, r = 46;
      s += `<ellipse cx="${f2(Math.cos(a) * r)}" cy="${f2(Math.sin(a) * r)}" rx="13" ry="6" transform="rotate(${f2(a / D2R + 60)} ${f2(Math.cos(a) * r)} ${f2(Math.sin(a) * r)})" fill="${i % 2 ? '#4f8a3a' : '#6aa64a'}" stroke="#244a16" stroke-width="1.6"/>`;
    }
    return `<g filter="url(#ds)">${s}${k > 0.95 ? `<path d="M-14,44 L-24,76 L-10,68 L-2,80 L2,46 Z M14,44 L24,76 L10,68 L2,80" fill="url(#goldG)" stroke="#7a5200" stroke-width="2"/>` : ''}</g>`;
  }
  function honourGuard(k, t) { // two rows of saluting soldiers flanking the pin
    let s = '';
    for (let i = 0; i < 4; i++) {
      for (const side of [-1, 1]) {
        const kk = seg(k, i * 0.12, i * 0.12 + 0.4);
        if (kk <= 0) continue;
        s += `<g transform="translate(${side * (78 + i * 46)} 0) scale(${f2(1.15 * E.back(kk))})" opacity="${f2(kk)}" filter="url(#ds2)">
          <ellipse cy="27" rx="12" ry="3.5" fill="#000" opacity="0.35"/>
          <path d="M-7,10 L-7,26 M7,10 L7,26" stroke="#141c2a" stroke-width="6" stroke-linecap="round"/>
          <path d="M-12,-20 L12,-20 L10,12 L-10,12 Z" fill="#2c3b52" stroke="#e8ecf1" stroke-width="1.5"/>
          <circle cy="-30" r="8.5" fill="#d9b48f"/><path d="M-10,-36 L10,-36 L8,-44 L-8,-44 Z" fill="#141c2a"/>
          <path d="M${side * -10},-16 L${side * -5},-34" stroke="#2c3b52" stroke-width="5" stroke-linecap="round"/>
          <path d="M${side * 12},-18 L${side * 14},18" stroke="#6b4a2f" stroke-width="3"/></g>`;
      }
    }
    return s;
  }
  function house(k) {
    return `<g transform="scale(${f2(E.back(k))})" filter="url(#ds)"><circle r="44" fill="#ffcf5a" opacity="0.25" filter="url(#glow4)"/>
      <path d="M-26,4 L0,-22 L26,4 L20,4 L20,26 L-20,26 L-20,4 Z" fill="#f6f1e6" stroke="#0b1a33" stroke-width="3.5" stroke-linejoin="round"/>
      <rect x="-6" y="10" width="12" height="16" fill="#c4122f"/></g>`;
  }
  function memorial(k, r) {
    return `<g opacity="${f2(k)}"><circle r="${f2(r * 1.4)}" fill="#fff" opacity="0.10" filter="url(#glow)"/>
      <circle r="${f2(r)}" fill="none" stroke="#fff" stroke-width="3" opacity="0.9"/><circle r="5" fill="#fff"/></g>`;
  }

  // ------------------------------------------------------------- route drawing
  function solidRoute(path, w, o = {}) {
    if (!path) return '';
    const c = o.color || '#FFC21A', dark = o.dark || '#a54d00', hi = o.hi || '#fff1b8';
    return `<g opacity="${f2(o.op != null ? o.op : 1)}">
      <path d="${path}" fill="none" stroke="#020a18" stroke-opacity="0.5" stroke-width="${f2(w + 10)}" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 6)" filter="url(#glow4)"/>
      ${o.glow ? `<path d="${path}" fill="none" stroke="${c}" stroke-opacity="${f2(o.glow)}" stroke-width="${f2(w * 3.2)}" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>` : ''}
      <path d="${path}" fill="none" stroke="${dark}" stroke-width="${f2(w + 5)}" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${path}" fill="none" stroke="${c}" stroke-width="${f2(w)}" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${path}" fill="none" stroke="${hi}" stroke-opacity="0.75" stroke-width="${f2(Math.max(1.5, w * 0.22))}" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 ${f2(-w * 0.18)})"/></g>`;
  }
  function dottedRoute(path, w, t, o = {}) { // round-dot line (red tease / ghost)
    if (!path) return '';
    const off = -t * (o.flow != null ? o.flow : 40);
    const gap = o.gap || w * 2.3;
    return `<g opacity="${f2(o.op != null ? o.op : 1)}" fill="none" stroke-linecap="round">
      <path d="${path}" stroke="#020a18" stroke-opacity="0.5" stroke-width="${f2(w + 5)}" stroke-dasharray="0.1 ${f2(gap)}" stroke-dashoffset="${f2(off)}" transform="translate(0 4)"/>
      <path d="${path}" stroke="${o.color || '#ff2b3a'}" stroke-width="${f2(w)}" stroke-dasharray="0.1 ${f2(gap)}" stroke-dashoffset="${f2(off)}"/></g>`;
  }
  function dashedRoute(path, w, t, o = {}) {
    if (!path) return '';
    const off = -t * (o.flow != null ? o.flow : 40);
    return `<g opacity="${f2(o.op != null ? o.op : 1)}">
      <path d="${path}" fill="none" stroke="#020a18" stroke-opacity="0.45" stroke-width="${f2(w + 6)}" stroke-dasharray="${f2(w * 3.2)} ${f2(w * 2.4)}" stroke-dashoffset="${f2(off)}" stroke-linecap="round" transform="translate(0 4)"/>
      <path d="${path}" fill="none" stroke="${o.color || '#ffffff'}" stroke-width="${f2(w)}" stroke-dasharray="${f2(w * 3.2)} ${f2(w * 2.4)}" stroke-dashoffset="${f2(off)}" stroke-linecap="round"/></g>`;
  }
  function arrowHead(x, y, ang, s, color = '#fff', op = 1) {
    return `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(ang)}) scale(${f2(s)})" opacity="${f2(op)}" filter="url(#ds2)">
      <path d="M14,0 L-12,-14 L-6,0 L-12,14 Z" fill="${color}" stroke="#0b1a33" stroke-width="2.5" stroke-linejoin="round"/></g>`;
  }
  function coastGlow(rings, op, w = 3) {
    if (op <= 0.01) return '';
    let d = '';
    for (const r of rings) d += polyPath(r, true);
    if (!d) return '';
    return `<g opacity="${f2(op)}" fill="none" stroke-linejoin="round">
      <path d="${d}" stroke="#ffffff" stroke-opacity="0.35" stroke-width="${f2(w * 5)}" filter="url(#glow4)"/>
      <path d="${d}" stroke="#ffffff" stroke-opacity="0.9" stroke-width="${f2(w)}"/></g>`;
  }
  function regionFill(rings, op, color) {
    if (op <= 0.01) return '';
    let d = '';
    for (const r of rings) d += polyPath(r, true);
    return `<g><path d="${d}" fill="${color}" fill-opacity="${f2(op * 0.22)}" stroke="#fff" stroke-opacity="${f2(op * 0.35)}" stroke-width="12" stroke-linejoin="round" filter="url(#glow4)"/>
      <path d="${d}" fill="none" stroke="#fff" stroke-opacity="${f2(op * 0.95)}" stroke-width="3.5" stroke-linejoin="round"/></g>`;
  }
  function mixHex(a, b, k) {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], k)).toString(16).padStart(2, '0')).join('');
  }
  function flash(t, a) { const x = t - a; return x < 0 || x > 0.35 ? 0 : Math.exp(-x * 14) * (x < 0.03 ? x / 0.03 : 1); }
  function burst(x, y, t, t0, o = {}) { // ink/impact ring burst
    const b = seg(t, t0, t0 + (o.d || 0.5));
    if (b <= 0 || b >= 1) return '';
    let s = '';
    const n = o.n || 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (o.rot || 0.13), r0 = (o.r0 || 60) + (o.r1 || 120) * 0.55 * E.o(b), r1 = (o.r0 || 60) + (o.r1 || 120) * E.o(Math.min(1, b * 1.4));
      s += `<path d="M${f2(x + Math.cos(a) * r0)},${f2(y + Math.sin(a) * r0)} L${f2(x + Math.cos(a) * r1)},${f2(y + Math.sin(a) * r1)}" stroke="${i % 2 ? o.color || '#fff' : o.color2 || '#FFD23F'}" stroke-width="${f2(9 * (1 - b) + 1)}" stroke-linecap="round" opacity="${f2(1 - b * b)}"/>`;
    }
    return s;
  }

  // ============================================================ TIMELINE
  // Seams (s) from transcript.json — faster-whisper word timings on audio/vo.mp3
  const T = {
    plane: 2.28, england: 3.30, australia: 3.84, alone: 4.76, y1928: 6.30, his: 7.80, bert: 8.44, grew: 9.82, small: 10.52,
    town: 11.36, watching: 12.02, birds: 12.58, building: 13.32, gliders: 14.16, basically: 15.36, watches: 16.26,
    then: 17.24, tries: 17.78, become: 18.32, one2: 18.62, nobody: 19.46, far: 21.06, fastest: 22.22, crew: 24.98,
    d28: 25.86, autopilot: 27.54, copilot: 28.72, noOne: 29.88, eats: 31.18, sandwich: 31.58, feb7: 32.70,
    takes: 34.04, london: 34.76, italy: 35.66, med: 36.58, nafrica: 37.68, deserts: 39.0, middle: 39.64, india: 40.54,
    burma: 41.46, singapore: 42.22, islands: 43.22, indonesia: 44.30, feb22: 45.40, lands: 46.82, darwin: 47.32,
    about: 48.20, km18: 48.40, kms: 49.49, d15: 50.54, almost: 52.20, halved: 52.56, newspapers: 54.30, hustling: 55.64,
    give: 57.24, like: 58.00, earned: 58.50, five: 59.54, tries2: 60.74, faster: 61.74, takes2: 62.74, london2: 63.46,
    disappears: 64.36, forOver: 65.44, months: 66.18, nobodyKnows: 66.90, then2: 68.68, body: 69.08, found: 69.60,
    crashed: 70.44, mountain: 71.88, italy2: 72.44, and: 73.38, dictator: 74.08, mussolini: 75.06, orders: 76.02,
    funeral: 76.56, military: 77.46, honours: 78.00, so: 79.06, boy: 79.28, buried: 81.44, florence: 81.98, other: 83.20,
    world: 83.92, home: 84.38, thats: 85.34, two: 85.96, impossible: 86.58, follow: 88.22, nextOne: 89.10,
    all: 89.98, started: 90.40, with: 90.76,
  };
  let PL; // places (from geo.json)
  const STAMPS = [
    { name: 'ITALY', at: [13.6, 43.6], t: 35.66, shape: 'rect', ink: '#c4122f', rot: -8, w: 260, fs: 52 },
    { name: 'MEDITERRANEAN', at: [18.2, 35.0], t: 36.58, shape: 'oval', ink: '#1f4fbf', rot: 6, w: 380, fs: 40 },
    { name: 'NORTH AFRICA', at: [23.0, 27.6], t: 37.68, shape: 'hex', ink: '#127a4a', rot: -5, w: 360, fs: 42 },
    { name: 'MIDDLE EAST', at: [47.5, 26.4], t: 39.64, shape: 'rect', ink: '#b35a00', rot: 9, w: 330, fs: 44 },
    { name: 'INDIA', at: [77.5, 18.2], t: 40.54, shape: 'circle', ink: '#6a2a9a', rot: -10, w: 300, fs: 50 },
    { name: 'BURMA', at: [97.5, 19.5], t: 41.46, shape: 'oval', ink: '#c4122f', rot: 7, w: 260, fs: 46 },
    { name: 'SINGAPORE', at: [107.5, 3.2], t: 42.22, shape: 'rect', ink: '#1f4fbf', rot: -6, w: 320, fs: 44 },
    { name: 'INDONESIA', at: [118.5, -3.2], t: 44.30, shape: 'hex', ink: '#127a4a', rot: 5, w: 330, fs: 46 },
  ];
  const STOP_T = [34.06, 35.72, 36.62, 37.72, 39.0, 39.66, 40.08, 40.56, 40.86, 41.16, 41.5, 41.86, 42.26, 43.3, 44.34, 47.3];

  function setupTimeline() {
    PL = GEO.places;
    // 1928 flight: arrival time at each stop
    const fl = makeRoute('flight', GEO.routes.flight, null, 6);
    const stopKm = GEO.stops.map((s) => {
      let best = 0, bd = 1e9;
      GEO.routes.flight.forEach((p, i) => { const d = Math.hypot(p[0] - s.lon, p[1] - s.lat); if (d < bd) { bd = d; best = i; } });
      return fl.wpKm[best];
    });
    R.flight.stopKm = stopKm;
    R.flight.prog = monotone([[0, 0], ...STOP_T.map((t, i) => [t, stopKm[i]])]);
    // red dotted tease London → Darwin (the same route)
    makeRoute('tease', GEO.routes.flight, [[0, 0], [2.85, 0], [4.35, 1], [99, 1]].map(([t, k]) => [t, k * R.flight.total]), 8);
    R.tease.prog = monotone([[0, 0], [2.85, 0], [4.35, R.tease.total], [99, R.tease.total + 0.001]]);
    makeRoute('teaseLoop', GEO.routes.flight, [[0, 0], [90.5, 0], [91.25, 0.22 * R.flight.total], [99, 0.22 * R.flight.total + 0.001]], 8);
    makeRoute('crew', GEO.routes.crew1919, null, 8);
    R.crew.prog = monotone([[0, 0], [22.3, 0], [26.0, R.crew.total], [99, R.crew.total + 0.001]]);
    makeRoute('f1933', GEO.routes.f1933, null, 4);
    R.f1933.prog = monotone([[0, 0], [62.95, 0], [64.4, 0.55 * R.f1933.total], [64.8, 0.58 * R.f1933.total], [99, 0.58 * R.f1933.total + 0.001]]);
    makeRoute('home', GEO.routes.home, null, 20);
    R.home.prog = monotone([[0, 0], [82.95, 0], [84.35, R.home.total], [99, R.home.total + 0.001]]);
    makeRoute('maryEscape', GEO.mary.escape, null, 6);
    makeRoute('maryReturn', GEO.mary.return, null, 12);
    makeRoute('funeral', [PL.pratomagno, [11.45, 43.74], PL.florence], null, 0.5);
    R.funeral.prog = monotone([[0, 0], [76.0, 0], [77.6, R.funeral.total], [99, R.funeral.total + 0.001]]);

    const LON = PL.london, MON = [152.428, -24.806];
    KEYS = [
      { t: 0, c: [14, 36], s: 150, g: 1, gl: 'intro' },
      { t: 0.8, c: [10, 41], s: 112, g: 1, gl: 'intro', e: 'io' },
      { t: 1.6, c: [LON[0] + 0.25, LON[1] - 0.1], s: 7, g: 0, gl: 'intro', e: 'io5' },
      { t: 2.75, c: [LON[0] + 0.45, LON[1] - 0.25], s: 4.3, e: 'io' },
      { t: 4.35, c: [84, 15], s: 136, g: 1, gl: 'over', e: 'io5' },
      { t: 6.45, c: [86, 14], s: 130, g: 1, gl: 'over', e: 'io' },
      { t: 7.75, c: [135, -26], s: 46, e: 'io5' },
      { t: 9.9, c: [139, -25], s: 40, e: 'io' },
      { t: 11.55, c: [151.6, -24.9], s: 8, e: 'io5' },
      { t: 15.3, c: [152.0, -24.85], s: 5.6, e: 'io' },
      { t: 16.25, c: MON, s: 0.3, e: 'io5' },
      { t: 19.3, c: [MON[0] + 0.004, MON[1] - 0.002], s: 0.27, e: 'io' },
      { t: 21.1, c: [84, 14], s: 134, g: 1, gl: 'over', e: 'io5' },
      { t: 26.95, c: [87, 13], s: 126, g: 1, gl: 'over', e: 'io' },
      { t: 27.95, c: [19.2, 33.6], s: 11, e: 'io5' },
      { t: 32.55, c: [20.0, 33.3], s: 10, e: 'io' },
      { t: 33.1, c: [10, 43], s: 30, e: 'io' },
      { t: 33.65, c: [LON[0] + 0.5, LON[1] - 0.45], s: 6, e: 'io' },
      { t: 34.4, c: [LON[0] + 0.7, LON[1] - 0.6], s: 5.4, e: 'io' },
      { t: 35.3, c: 'flight', s: 13, lead: 0.12, e: 'io' },
      { t: 36.7, c: 'flight', s: 21, lead: 0.15, e: 'l' },
      { t: 38.1, c: 'flight', s: 29, lead: 0.15, e: 'l' },
      { t: 39.8, c: 'flight', s: 38, lead: 0.15, e: 'l' },
      { t: 41.5, c: 'flight', s: 43, lead: 0.15, e: 'l' },
      { t: 43.4, c: 'flight', s: 40, lead: 0.15, e: 'l' },
      { t: 45.2, c: 'flight', s: 26, lead: 0.12, e: 'io' },
      { t: 46.6, c: [130.9, -12.6], s: 6.5, e: 'io' },
      { t: 48.0, c: [130.86, -12.48], s: 3.8, e: 'io' },
      { t: 49.15, c: [84, 14], s: 132, g: 1, gl: 'over', e: 'io5' },
      { t: 54.0, c: [87, 13], s: 125, g: 1, gl: 'over', e: 'io' },
      { t: 55.05, c: [131.4, -10.6], s: 24, e: 'io5' },
      { t: 59.45, c: [131.6, -10.8], s: 21, e: 'io' },
      { t: 60.55, c: [80, 18], s: 134, g: 1, gl: 'over', e: 'io5' },
      { t: 61.95, c: [3.0, 48.6], s: 16, e: 'io5' },
      { t: 62.75, c: [LON[0] + 0.8, LON[1] - 0.9], s: 8.5, e: 'io' },
      { t: 63.55, c: 'f1933', s: 11, lead: 0.1, e: 'io' },
      { t: 64.6, c: 'f1933', s: 12.5, lead: 0.04, e: 'io' },
      { t: 65.7, c: [6.6, 46.4], s: 17, e: 'io' },
      { t: 68.45, c: [8.6, 45.6], s: 19, e: 'l' },
      { t: 69.65, c: [11.55, 43.75], s: 4.6, e: 'io5' },
      { t: 70.6, c: [11.62, 43.7], s: 1.5, e: 'io' },
      { t: 71.85, c: [11.62, 43.69], s: 1.35, e: 'io' },
      { t: 72.95, c: [12.1, 43.1], s: 9.5, e: 'io' },
      { t: 74.05, c: [11.43, 43.71], s: 1.3, e: 'io5' },
      { t: 78.6, c: [11.36, 43.73], s: 1.12, e: 'io' },
      { t: 82.6, c: [11.26, 43.75], s: 0.88, e: 'io' },
      { t: 84.3, c: [82, 11], s: 146, g: 1, gl: 'over', e: 'io5' },
      { t: 85.35, c: [84, 10], s: 138, g: 1, gl: 'over', e: 'io' },
      { t: 86.45, c: [68, -36], s: 172, e: 'io5' },
      { t: 89.92, c: [69, -35.5], s: 168, e: 'io' },
      { t: 90.62, c: [14, 36], s: 150, g: 1, gl: 'intro', e: 'io5' },
      { t: 99, c: [14, 36], s: 150, g: 1, gl: 'intro', e: 'io' },
    ];
  }
  const kmTCache = {};
  function tAtKm(name, km, lo, hi) { // inverse of prog
    const key = name + km;
    if (kmTCache[key] != null) return kmTCache[key];
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (R[name].prog(m) < km) lo = m; else hi = m; }
    return (kmTCache[key] = hi);
  }

  // ================================================================ FRAME
  let READY = false;
  window.renderFrame = function (t) {
    if (!READY) return;
    CAM = camAt(t);
    const sh = [camShake(t, T.d28, T.d28 + 0.3, 7), camShake(t, T.d15, T.d15 + 0.3, 7), camShake(t, T.like + 0.02, T.like + 0.3, 8),
      camShake(t, 0, 0.25, 6), camShake(t, 90.78, 91.0, 6), camShake(t, 18.82, 19.05, 5)];
    for (const st of STAMPS) sh.push(camShake(t, st.t, st.t + 0.16, 4));
    let shx = 0, shy = 0; for (const s of sh) { shx += s[0]; shy += s[1]; }
    CAM.u -= shx / CAM.S; CAM.v -= shy / CAM.S; CAM.gcx += shx; CAM.gcy += shy;
    placeLayers();

    // whip motion blur from camera velocity
    const c2 = camAt(t + 1 / 30);
    const vx = (c2.u - CAM.u) * CAM.S * (1 - CAM.g) + (c2.gcx - CAM.gcx) * CAM.g, vy = (c2.v - CAM.v) * CAM.S * (1 - CAM.g) + (c2.gcy - CAM.gcy) * CAM.g;
    const vz = Math.abs(Math.log(c2.span / CAM.span)) * 900;
    const bx = clamp(Math.abs(vx) * 0.1 + vz * 0.045, 0, 7), by = clamp(Math.abs(vy) * 0.1 + vz * 0.045, 0, 7);
    const blurOn = bx > 1.4 || by > 1.4;
    document.getElementById('blurG').setAttribute('filter', blurOn ? 'url(#mblur)' : '');
    if (blurOn) blurF.setAttribute('stdDeviation', `${f2(bx)} ${f2(by)}`);

    // grade: map greys when he disappears, colour returns on "home"
    const grey = E.io(seg(t, 64.4, 65.4)) * (1 - E.io(seg(t, 82.9, 84.4)));
    const sat = 1 - 0.84 * grey;
    mapG.setAttribute('filter', Math.abs(sat - 1) > 0.01 ? 'url(#desat)' : '');
    desatM.setAttribute('values', f2(sat));

    routeG.innerHTML = drawMapLayer(t);
    gradeG.innerHTML = drawGrade(t, grey);
    ovG.innerHTML = drawOverlay(t, grey);
    capG.innerHTML = drawCaptions(t);
  };

  // ---------------------------------------------------- map-space vectors
  function routeW(base) { return clamp(base * Math.pow(30 / CAM.span, 0.22), base * 0.6, base * 1.7) * lerp(1, 0.8, CAM.g); }
  function drawMapLayer(t) {
    let s = '';
    // region activations
    s += coastGlow(GEO.coast.australiaLo, fade(t, 9.4, 12.6, 0.4) * 0.85, 2.4);
    s += regionFill(GEO.coast.italy, fade(t, T.italy - 0.05, 38.3, 0.25), '#FFC233');
    s += regionFill(GEO.coast.nafrica, fade(t, T.nafrica - 0.05, 40.0, 0.25), '#FFC233');
    s += regionFill(GEO.coast.india, fade(t, T.india - 0.05, 42.4, 0.25), '#FFC233');
    s += regionFill(GEO.coast.burma, fade(t, T.burma - 0.05, 43.2, 0.2), '#FFC233');
    s += regionFill(GEO.coast.indonesia, fade(t, T.islands - 0.05, 46.4, 0.3), '#FFC233');
    s += coastGlow(GEO.coast.italy, fade(t, 72.3, 74.2, 0.35) * 0.9, 2.6);
    // Mediterranean shimmer + desert heat glow
    const med = fade(t, T.med - 0.05, 38.6, 0.3);
    if (med > 0) { const [x, y] = P(18, 35.2); s += `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(260 * 21 / CAM.span)}" ry="${f2(120 * 21 / CAM.span)}" fill="url(#seaG)" opacity="${f2(med * (0.8 + 0.2 * Math.sin(t * 9)))}"/>`; }
    const des = fade(t, T.deserts - 0.05, 41.2, 0.3);
    if (des > 0) {
      const [x, y] = P(42, 30.5);
      const r = 330 * 38 / CAM.span;
      s += `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(r)}" ry="${f2(r * 0.6)}" fill="url(#desertG)" opacity="${f2(des)}"/>`;
      for (let i = 0; i < 5; i++) {
        const yy = y - r * 0.3 + i * r * 0.15, ph = t * 5 + i;
        s += `<path d="M${f2(x - r * 0.5)},${f2(yy)} q${f2(r * 0.125)},${f2(-8 * Math.sin(ph))} ${f2(r * 0.25)},0 t${f2(r * 0.25)},0 t${f2(r * 0.25)},0 t${f2(r * 0.25)},0" fill="none" stroke="#fff3d0" stroke-width="2.5" opacity="${f2(des * 0.45)}"/>`;
      }
    }
    const sg = fade(t, T.singapore - 0.05, 43.6, 0.2);
    if (sg > 0) {
      const [x, y] = P(103.82, 1.35);
      for (let i = 0; i < 2; i++) { const r = seg((t - T.singapore + i * 0.4) % 0.8, 0, 0.8); s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(14 + 60 * r)}" fill="none" stroke="#fff" stroke-width="${f2(4 * (1 - r))}" opacity="${f2(sg * (1 - r))}"/>`; }
    }

    // ---- red dotted tease (frame-1 route shooting SE) ----
    const teaseOp = fade(t, 2.8, 8.0, 0.3) + fade(t, 19.5, 27.5, 0.5) * 0.85;
    if (teaseOp > 0.01) {
      const k = t < 9 ? R.tease.prog(t) : R.tease.total;
      const w = routeW(7.5);
      s += dottedRoute(routePath(R.tease, 0, k), w, t, { op: teaseOp, gap: w * 2.1 });
      if (t < 9 && k > 5) {
        const e = atKm(R.tease, k); const [x, y, z] = P(e.lon, e.lat);
        if (z > 0.05 && k < R.tease.total - 1) s += arrowHead(x, y, screenDir(R.tease, k), 1.3, '#ff2b3a', teaseOp);
      }
    }
    if (t > 90.4) {
      const k = R.teaseLoop.prog(t);
      s += dottedRoute(routePath(R.teaseLoop, 0, k), 7, t, { op: seg(t, 90.4, 90.7) });
    }
    // ---- 1919 full-crew route (white dashed) ----
    if (t > 22.2 && t < 28.2) {
      const k = R.crew.prog(t), op = 1 - seg(t, 27.2, 28.0);
      s += dashedRoute(routePath(R.crew, 0, k), routeW(5.5), t, { op: op * 0.95, flow: 30 });
    }
    // ---- 1928 flight (thick yellow, self-drawing) ----
    const fl = R.flight, fk = fl.prog(t);
    if (t > T.takes && t < 59.9) {
      const red = 0;
      const w = routeW(8.5);
      const glow = 0.2 + (t > 48.2 && t < 54 ? 0.45 * fade(t, 48.2, 54, 0.4) : 0);
      s += solidRoute(routePath(fl, 0, fk), w, { glow, op: 1 - seg(t, 59.3, 59.9) });
      // stop dots
      fl.stopKm.forEach((km, i) => {
        if (i === 0 || i === fl.stopKm.length - 1 || fk < km) return;
        const p = atKm(fl, km); const [x, y, z] = P(p.lon, p.lat);
        if (z < 0.05) return;
        const k = pop(t, STOP_T[i], 0.3);
        s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(7 * k * lerp(1, 0.7, CAM.g))}" fill="#fff" stroke="#a54d00" stroke-width="3"/>`;
      });
    }
    // ghost of 1928 while he tries again (five years later)
    if (t > 60.2 && t < 65.6) s += solidRoute(routePath(fl, 0, fl.total), routeW(6), { op: 0.35 * fade(t, 60.2, 65.6, 0.5), color: '#ffe08a', dark: '#6b5a2a' });
    // ---- 1933 attempt (orange, stops dead where he vanished) ----
    if (t > 62.9 && t < 69.8) {
      const k = R.f1933.prog(t), op = 1 - seg(t, 68.6, 69.6);
      const w = routeW(7);
      const vanish = seg(t, T.disappears, T.disappears + 0.6);
      s += solidRoute(routePath(R.f1933, 0, k), w, { op, color: mixHex('#ff9a2b', '#c9ced6', vanish), dark: mixHex('#8a3b00', '#59606a', vanish) });
      if (vanish > 0) { // fading dashes past the vanishing point
        const k2 = Math.min(R.f1933.total, k + 260 * vanish);
        s += dashedRoute(routePath(R.f1933, k, k2), w * 0.6, t, { op: op * 0.6 * (1 - seg(t, 66.5, 68.5)), color: '#e8ecf1', flow: 0 });
      }
    }
    // ---- funeral procession line (Pratomagno → Florence) ----
    if (t > 76.0 && t < 85.0) s += dashedRoute(routePath(R.funeral, 0, R.funeral.prog(t)), 4.5, t, { op: 0.85 * (1 - seg(t, 82.6, 83.4)), color: '#f4f1e8', flow: 18 });
    // ---- home arc Florence → Bundaberg ----
    if (t > 82.9 && t < 85.8) {
      const k = R.home.prog(t);
      s += dashedRoute(routePath(R.home, 0, k), routeW(5), t, { op: 1 - seg(t, 85.3, 85.8), color: '#fff3c4', flow: 30 });
    }
    // ---- master map (series) ----
    if (t > 85.3 && t < 90.6) {
      const op = seg(t, 85.4, 85.9) * (1 - seg(t, 90.1, 90.55));
      const w = routeW(6.5);
      const redB = E.io(seg(t, T.two, T.two + 0.8));
      s += `<g clip-path="url(#frameClip)">`;
      s += solidRoute(routePath(R.maryEscape, 0, R.maryEscape.total), w * 0.85, { color: '#ff2b3a', dark: '#7a0010', op: op * 0.9, glow: 0.2 });
      s += solidRoute(routePath(R.maryReturn, 0, R.maryReturn.total), w * 0.7, { color: '#ff6b78', dark: '#7a0010', op: op * 0.7 });
      s += solidRoute(routePath(fl, 0, fl.total), w, { color: mixHex('#FFC21A', '#ff2b3a', redB), dark: mixHex('#a54d00', '#7a0010', redB), op, glow: 0.25 + 0.45 * redB });
      s += `</g>`;
    }
    return s;
  }

  // ------------------------------------------------------------ grade
  function drawGrade(t, grey) {
    let s = '';
    // "completely alone": spotlight on the tiny plane
    const alone = fade(t, T.alone - 0.1, 6.35, 0.35);
    if (alone > 0) {
      const p = planeState(t);
      if (p) s += `<rect width="${W}" height="${H}" fill="url(#spot)" opacity="${f2(alone)}" transform="translate(${f2(p.x - 1100)} ${f2(p.y - 1100)}) scale(${f2(2200 / W)} ${f2(2200 / H)})"/>`;
    }
    const dark = Math.max(grey * 0.16, fade(t, 85.5, 90.5, 0.5) * 0);
    if (dark > 0.001) s += `<rect width="${W}" height="${H}" fill="#020611" opacity="${f2(dark)}"/>`;
    // master map: darken outside the gold frame
    const mm = fade(t, 85.5, 90.5, 0.5);
    if (mm > 0) s += `<path d="M0,0 H${W} V${H} H0 Z M66,150 A26,26 0 0 0 40,176 V1204 A26,26 0 0 0 66,1230 H1014 A26,26 0 0 0 1040,1204 V176 A26,26 0 0 0 1014,150 Z" fill-rule="evenodd" fill="#030918" opacity="${f2(mm * 0.82)}"/>`;
    // disappear flash
    const fl = flash(t, T.disappears + 0.02) * 0.35;
    if (fl > 0) s += `<rect width="${W}" height="${H}" fill="#ffffff" opacity="${f2(fl)}"/>`;
    s += `<rect width="${W}" height="${H}" fill="url(#vig)" opacity="${f2(0.75 + 0.25 * grey)}"/>`;
    return s;
  }

  // the one plane: where is it, which way, how high
  function planeState(t) {
    let lon, lat, ang, sc, alt = 0, op = 1, wob = 0;
    const L = PL.london;
    if (t < 1.4 || t > 90.5) { // parked at London on the globe
      const [x, y, z] = P(L[0], L[1]);
      if (z < 0.05) return null;
      return { x, y, ang: -30, sc: 0.32, alt: 0, op: 1 };
    }
    if (t < 2.9) { // lift-off over London
      const k = E.io(seg(t, 1.45, 2.85));
      lon = L[0] + 0.55 * k; lat = L[1] - 0.32 * k;
      const [x, y] = P(lon, lat);
      return { x, y, ang: 30 + 6 * Math.sin(t * 3), sc: lerp(0.75, 1.15, k), alt: lerp(0, 46, k), op: 1 };
    }
    if (t < 7.2) { // rides the red dotted tease, far slower than the line
      const km = lerp(0, 0.34 * R.tease.total, E.io(seg(t, 2.9, 7.1)));
      const p = atKm(R.tease, km); const [x, y, z] = P(p.lon, p.lat);
      if (z < 0.05) return null;
      return { x, y, ang: screenDir(R.tease, km), sc: lerp(0.62, 0.42, CAM.g), alt: 18, op: 1 - seg(t, 6.6, 7.1) };
    }
    if (t > 27.7 && t < 32.75) { // close-up over the desert: no autopilot, no co-pilot, sandwich
      const ph = t - 27.7;
      wob = fade(t, T.noOne - 0.1, 32.4, 0.3);
      const [x0, y0] = P(19.9, 33.4);
      const x = x0 + 18 * Math.sin(ph * 1.3) + wob * 22 * Math.sin(ph * 7.5);
      const y = y0 - 140 + 10 * Math.sin(ph * 2.1) + wob * 10 * Math.sin(ph * 5.3);
      return { x, y, ang: -8 + wob * 16 * Math.sin(ph * 6.2), sc: 2.5, alt: 80, op: seg(t, 27.7, 27.95) * (1 - seg(t, 32.5, 32.75)) };
    }
    if (t >= 33.5 && t < 59.6) { // 7 Feb take-off → Darwin, parked there
      const fl = R.flight, k = fl.prog(t);
      const p = atKm(fl, k); const [x, y, z] = P(p.lon, p.lat);
      if (z < 0.05) return null;
      const lift = E.io(seg(t, T.takes, T.takes + 0.8)), land = E.io(seg(t, 46.6, 47.32));
      alt = 52 * lift * (1 - land);
      sc = lerp(0.95, 1.1, lift * (1 - land)) * lerp(1, 0.55, CAM.g);
      ang = t < T.takes ? -40 : screenDir(fl, Math.min(k, fl.total - 15));
      return { x, y, ang, sc, alt, op: seg(t, 33.5, 33.8) * (1 - seg(t, 59.2, 59.6)) * (t > 48.6 && t < 55 ? 0 : 1) };
    }
    if (t > 62.4 && t < 65.2) { // 1933: lifts off and disappears
      const r = R.f1933, k = r.prog(t);
      const p = atKm(r, k); const [x, y] = P(p.lon, p.lat);
      const lift = E.io(seg(t, T.takes2, T.takes2 + 0.6));
      const v = seg(t, T.disappears, T.disappears + 0.45);
      return { x, y, ang: k < 5 ? -50 : screenDir(r, k), sc: lerp(1.0, 1.15, lift) * (1 - 0.35 * v), alt: 50 * lift, op: seg(t, 62.4, 62.7) * (1 - v), vanish: v };
    }
    return null;
  }

  // ------------------------------------------------------------ overlays
  function drawOverlay(t, grey) {
    let s = '';
    s += beatHook(t);
    s += beatPlane(t);
    s += beatIntro(t);
    s += beatBundaberg(t);
    s += beatRecord(t);
    s += beatSandwich(t);
    s += beatFlight(t);
    s += beatDarwin(t);
    s += beatNews(t);
    s += beatAgain(t, grey);
    s += beatFound(t);
    s += beatFlorence(t);
    s += beatSeries(t);
    return s;
  }

  function drawPlane(t) {
    const p = planeState(t);
    if (!p || p.op <= 0.001) return '';
    let s = planeAt(p.x, p.y, p.ang, p.sc, p.alt, t, { op: p.op, reg: p.sc > 1.4 });
    if (p.vanish > 0 && p.vanish < 1) { // dissolve into a few grey motes
      for (let i = 0; i < 12; i++) {
        const a = hash(i * 3.3) * Math.PI * 2, r = 20 + 90 * E.o(p.vanish) * (0.5 + hash(i));
        s += `<circle cx="${f2(p.x + Math.cos(a) * r)}" cy="${f2(p.y + Math.sin(a) * r)}" r="${f2(5 * (1 - p.vanish))}" fill="#e8ecf1" opacity="${f2(1 - p.vanish)}"/>`;
      }
    }
    return s;
  }
  function beatPlane(t) { return drawPlane(t); }

  // 0–2.7 + loop — frame-1 hook `15 DAYS`, London pin on the globe
  function beatHook(t) {
    let s = '';
    if (t < 2.2 || t > 90.3) {
      // London pin + glow on the globe / during the dive
      const [x, y, z] = P(...PL.london);
      if (z > 0.05) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 6);
        s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(26 + 10 * pulse)}" fill="#ff2b3a" opacity="${f2(0.25 + 0.15 * pulse)}" filter="url(#glow4)"/>`;
        s += pin(x, y, t, t > 90 ? 90.45 : -1, { size: 0.8, op: t < 2.2 ? 1 - seg(t, 1.2, 1.6) : 1 });
        s += placeLabel('LONDON', x - 10, y + 62, t, t > 90 ? 90.5 : -1, { size: 40, op: t < 2.2 ? 1 - seg(t, 1.0, 1.4) : 1 });
      }
    }
    // hook card: on frame 1 already slammed (burst decays); flies off on the dive
    let hk = 0, hop = 0, hy = 300;
    if (t < 1.6) { hk = 1; hop = 1 - seg(t, 0.95, 1.4); hy = 300 - 220 * E.i(seg(t, 0.95, 1.4)); }
    if (t > 90.6) { hk = E.o5(seg(t, T.with, T.with + 0.38)); hop = seg(t, T.with, T.with + 0.12); }
    if (hop > 0) {
      const sc = t > 90 ? lerp(2.3, 1, hk) : 1 + 0.06 * Math.exp(-t * 6);
      s += label3d('15 DAYS', 540, hy, 236, { fill: '#FFD23F', side: '#7a3b00', edge: '#3a1a00', scale: sc, op: hop, depth: 12, ls: 6 });
      if (t > 90.7) s += burst(540, hy - 80, t, T.with + 0.2, { r0: 160, r1: 260, n: 14 });
    }
    return s;
  }

  // 2.7–15.3 — England to Australia, alone, 1928, the real Bert, Bundaberg, birds, gliders
  function beatIntro(t) {
    if (t < 3.0 || t > 15.6) return '';
    let s = '';
    // ENGLAND / AUSTRALIA labels as the tease shoots across
    if (t < 7.2) {
      const [ex, ey, ez] = P(-1.5, 52.6), [ax, ay, az] = P(134, -24);
      const op = 1 - seg(t, 6.6, 7.0);
      if (ez > 0.05) s += pin(...P(...PL.london).slice(0, 2), t, T.england - 0.15, { size: 0.6, op }) + placeLabel('ENGLAND', ex, ey - 64, t, T.england, { size: 38, op });
      if (az > 0.05) s += pin(...P(...PL.darwin).slice(0, 2), t, T.australia - 0.2, { size: 0.6, op }) + placeLabel('AUSTRALIA', ax - 60, ay + 10, t, T.australia, { size: 40, op });
    }
    // 1928 slam → year chip
    if (t > T.y1928 - 0.05 && t < 15.4) {
      const k = E.o5(seg(t, T.y1928, T.y1928 + 0.3));
      const m = E.io(seg(t, 7.0, 7.6));
      const x = lerp(540, 190, m), y = lerp(560, 250, m), sc = lerp(lerp(2.2, 1, k), 0.38, m);
      const op = seg(t, T.y1928, T.y1928 + 0.08) * (1 - seg(t, 15.0, 15.4));
      s += label3d('1928', x, y, 220, { fill: '#FFD23F', side: '#7a3b00', edge: '#3a1a00', scale: sc, op, depth: 11, ls: 6 });
      if (t < 7.0) s += burst(540, 480, t, T.y1928 + 0.18, { r0: 120, r1: 220 });
    }
    // the real Bert Hinkler (State Library of Queensland, signed portrait)
    if (t > 8.0 && t < 10.0) {
      const k = seg(t, 8.05, 8.5), out = seg(t, 9.6, 9.95);
      s += `<g transform="translate(${f2(540 + 700 * E.i(out))} ${f2(640)})">${portraitCard('#phSLQ', k, { w: 360, h: 470, rot: -3 })}</g>`;
      s += chip('BERT HINKLER', 540 + 700 * E.i(out), 1010, { size: 40, scale: 0.6 + 0.4 * pop(t, T.bert - 0.05), op: seg(t, T.bert - 0.05, T.bert + 0.1) * (1 - out) });
    }
    // Bundaberg pin (the small Australian town)
    if (t > T.town - 0.3) {
      const [x, y] = P(...PL.bundaberg);
      s += pin(x, y, t, T.town - 0.25, { size: 0.9 });
      s += placeLabel('BUNDABERG', x - 120, y - 110, t, T.town, { size: 46, until: 15.5 });
    }
    // watching birds: a flock of ibis crosses the town
    if (t > T.watching - 0.2 && t < 14.4) {
      const [x, y] = P(...PL.bundaberg);
      const k = seg(t, T.watching - 0.2, 14.3);
      for (let i = 0; i < 6; i++) {
        const bx = lerp(-160, 1240, k) - i * 70 + (i % 2) * 30, by = y - 260 + Math.sin(k * 6 + i) * 24 + (i % 3) * 46;
        s += `<g transform="translate(${f2(bx)} ${f2(by)})">${bird(t * 14 + i * 1.7, 1.25)}</g>`;
      }
    }
    // building his own gliders: blueprint card draws itself
    if (t > T.building - 0.1 && t < 15.6) {
      const [x, y] = P(...PL.bundaberg);
      const k = seg(t, T.building, 14.7), op = seg(t, T.building - 0.1, T.building + 0.1) * (1 - seg(t, 15.2, 15.55));
      s += `<g transform="translate(${f2(x - 260)} ${f2(y + 210)}) rotate(-4) scale(${f2(0.7 + 0.3 * pop(t, T.building - 0.1))})" opacity="${f2(op)}">${glider(E.io(k))}</g>`;
    }
    return s;
  }

  // 15.3–19.4 — Gag 1: Mon Repos sand dune, cardboard wings
  function beatBundaberg(t) {
    if (t < 15.6 || t > 20.6) return '';
    let s = '';
    const op = seg(t, 15.7, 16.1) * (1 - seg(t, 19.6, 20.2));
    const [dx, dy] = P(152.392, -24.818);
    const ks = 1.55 * clamp(0.3 / CAM.span, 0.2, 1.35);
    s += `<g transform="translate(${f2(dx)} ${f2(dy)}) scale(${f2(ks)})" opacity="${f2(op)}">${dune()}`;
    // the kid: stands on the crest watching birds, crouches, hops, flaps, plops into the sand
    let kx = -10, ky = -150, look = 0, run = 0, crouch = 0, flap = 0, rot = 0;
    const hopT = T.tries + 0.12;
    look = fade(t, 15.9, 17.6, 0.3);
    if (t > T.then && t < hopT) { crouch = seg(t, T.then, hopT); }
    if (t >= hopT) {
      const j = seg(t, hopT, 18.85);
      kx = lerp(-10, 250, j); ky = -150 - 70 * Math.sin(j * Math.PI * 0.85) + 190 * Math.pow(j, 2.2);
      flap = Math.sin(t * 34) * 38 * (1 - seg(t, 18.6, 18.85)); run = t * 18; rot = lerp(-8, 24, j);
    }
    if (t > 18.85) { kx = 250; ky = 40; rot = 70 + 4 * Math.sin(t * 20) * (1 - seg(t, 18.85, 19.3)); flap = -40; }
    s += `<g transform="translate(${f2(kx)} ${f2(ky)}) rotate(${f2(rot)})">${wingKid({ look, crouch, flap, run })}</g>`;
    // sand puff on landing
    const pf = seg(t, 18.85, 19.6);
    if (pf > 0 && pf < 1) for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i / 8) * Math.PI, r = 20 + 90 * E.o(pf);
      s += `<circle cx="${f2(250 + Math.cos(a) * r)}" cy="${f2(40 + Math.sin(a) * r * 0.6)}" r="${f2(16 * (1 - pf) + 4)}" fill="#ecd8a4" opacity="${f2(0.8 * (1 - pf))}"/>`;
    }
    s += `</g>`;
    // birds overhead (he watches them)
    if (t < 18.4) {
      const k = seg(t, 15.6, 18.4);
      for (let i = 0; i < 4; i++) {
        const bx = lerp(1200, -200, k) + i * 90, by = dy - 700 + i * 40 + Math.sin(k * 8 + i) * 18;
        s += `<g transform="translate(${f2(bx)} ${f2(by)}) scale(-1 1)" opacity="${f2(op)}">${bird(t * 13 + i, 1.5)}</g>`;
      }
    }
    s += placeLabel('BUNDABERG', 540, 300, t, 15.9, { size: 46, until: 19.6 });
    return s;
  }

  // 19.4–27.6 — nobody this far alone · full crew, 28 days
  function beatRecord(t) {
    if (t < 19.9 || t > 28.2) return '';
    let s = '';
    const op = 1 - seg(t, 27.3, 27.9);
    // endpoints on the globe
    s += mapPin(PL.london, t, 20.5, { size: 0.65, op });
    s += mapPin(PL.darwin, t, 20.7, { size: 0.65, op });
    // "this far": a measuring bracket sweeps along the dotted line
    const far = fade(t, T.far - 0.2, 22.4, 0.3);
    if (far > 0) {
      const k = E.io(seg(t, T.far - 0.2, 22.1));
      const p = atKm(R.tease, R.tease.total * k); const [x, y] = P(p.lon, p.lat);
      s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="16" fill="#fff" opacity="${f2(far)}" filter="url(#ds2)"/><circle cx="${f2(x)}" cy="${f2(y)}" r="30" fill="none" stroke="#fff" stroke-width="3" opacity="${f2(far * 0.6)}"/>`;
    }
    // the 1919 crew plane crawls the white dashed route; day counter ticks
    if (t > 22.2) {
      const k = R.crew.prog(t), p = atKm(R.crew, k); const [x, y, z] = P(p.lon, p.lat);
      if (z > 0.05) s += planeAt(x, y, screenDir(R.crew, Math.min(k, R.crew.total - 20)), 0.78, 20, t, { twin: true, heads: 4, op: op * seg(t, 22.2, 22.5), body: '#c9ccd2', wing: '#e3e6ea' });
      const day = Math.max(1, Math.min(28, 1 + Math.floor(27 * (k / R.crew.total))));
      const crewIcons = [0, 1, 2, 3].map((i) => `<g transform="translate(${-63 + i * 42} 0) scale(0.62)">${ICON_PERSON}</g>`).join('');
      const cop = seg(t, 22.4, 22.7) * (1 - seg(t, T.d28 - 0.1, T.d28 + 0.1));
      s += `<g transform="translate(540 300) scale(${f2(pop(t, 22.4))})" opacity="${f2(cop)}" filter="url(#ds)">
        <rect x="-250" y="-58" width="500" height="116" rx="58" fill="url(#chipG)" stroke="#fff" stroke-width="3"/>
        <g transform="translate(-130 4)">${crewIcons}</g>
        <text x="118" y="22" text-anchor="middle" font-family="Anton" font-size="64" letter-spacing="3" fill="#fff">DAY ${day}</text></g>`;
      if (t > T.d28 - 0.05) {
        const k2 = E.o5(seg(t, T.d28, T.d28 + 0.32));
        s += label3d('28 DAYS', 540, 360, 190, { scale: lerp(2.2, 1, k2), op: seg(t, T.d28, T.d28 + 0.08) * op, depth: 10, ls: 5 });
        s += burst(540, 300, t, T.d28 + 0.15, { r0: 120, r1: 200 });
      }
    }
    return s;
  }

  // 27.4–32.7 — Gag 2: no autopilot, no co-pilot, the sandwich
  function beatSandwich(t) {
    if (t < 27.5 || t > 32.8) return '';
    let s = '';
    const op = 1 - seg(t, 32.4, 32.75);
    const p = planeState(t);
    if (t > T.autopilot - 0.1) s += `<g transform="translate(230 400)" opacity="${f2(op)}">${noBadge(ICON_ROBOT, 1.55 * pop(t, T.autopilot - 0.05, 0.4))}</g>`;
    if (t > T.copilot - 0.1) s += `<g transform="translate(820 400)" opacity="${f2(op)}">${noBadge(ICON_SEAT, 1.55 * pop(t, T.copilot - 0.05, 0.4))}</g>`;
    // the sandwich floats out of the open cockpit
    if (p && t > T.eats - 0.15) {
      const k = seg(t, T.eats - 0.15, 32.6);
      const cx = p.x - 14 * 2.5 * Math.cos(p.ang * D2R), cy = p.y - 14 * 2.5 * Math.sin(p.ang * D2R);
      const sx = cx + 120 * E.o(k) + 20 * Math.sin(t * 3), sy = cy - 190 * E.o(k) + 10 * Math.sin(t * 4.2);
      const bitten = t > T.sandwich + 0.2;
      s += `<g transform="translate(${f2(sx)} ${f2(sy)}) rotate(${f2(-20 + 60 * k + 8 * Math.sin(t * 5))}) scale(${f2(2.3 * pop(t, T.eats - 0.15, 0.4))})" opacity="${f2(op)}" filter="url(#ds)">${sandwich(bitten)}</g>`;
      if (bitten) for (let i = 0; i < 6; i++) {
        const c = seg(t, T.sandwich + 0.2 + i * 0.05, T.sandwich + 0.9 + i * 0.05);
        if (c <= 0 || c >= 1) continue;
        s += `<rect x="${f2(sx + 10 + i * 6 - 18)}" y="${f2(sy + 20 + 160 * c * c)}" width="7" height="6" rx="2" fill="#c98a43" opacity="${f2(1 - c)}"/>`;
      }
    }
    // wobble lines
    if (p && t > T.noOne) {
      const w = fade(t, T.noOne, 32.5, 0.2);
      s += `<g opacity="${f2(w * op)}" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none">
        <path d="M${f2(p.x - 170)},${f2(p.y - 40)} q-14,16 0,32 M${f2(p.x - 196)},${f2(p.y - 52)} q-18,26 0,52"/>
        <path d="M${f2(p.x + 170)},${f2(p.y - 40)} q14,16 0,32 M${f2(p.x + 196)},${f2(p.y - 52)} q18,26 0,52"/></g>`;
    }
    return s;
  }

  // 32.7–47.3 — 7 February, London take-off, accelerating passport stamps, camel
  function dayAt(t) {
    if (t < T.takes) return 7;
    const fk = R.flight.prog(t), sk = R.flight.stopKm;
    let d = 7; GEO.stops.forEach((st, i) => { if (fk >= sk[i] - 1) d = st.day; });
    return d;
  }
  function beatFlight(t) {
    let s = '';
    // calendar HUD (Feb 1928)
    if (t > T.feb7 - 0.1 && t < 50.6) {
      const d = dayAt(t);
      let d0 = d, flip = 0;
      // short flip animation when the day changes
      const dPrev = dayAt(t - 0.14);
      if (dPrev !== d) { d0 = dPrev; flip = seg(t - 0.14, 0, 0.14) || 0.5; }
      const op = seg(t, T.feb7 - 0.1, T.feb7 + 0.1) * (1 - seg(t, 50.2, 50.55));
      const big = t > 47.6 ? 22 : d;
      s += `<g transform="translate(170 290) rotate(-4)" opacity="${f2(op)}">${calendar('FEB 1928', String(big), 0, { scale: 0.95 * pop(t, T.feb7 - 0.1, 0.4) })}</g>`;
    }
    if (t < 33.4 || t > 54.6) return s;
    // London take-off label
    if (t < 36.4) {
      const [x, y] = P(...PL.london);
      s += pin(x, y, t, 33.75, { size: 0.85, op: 1 - seg(t, 35.8, 36.3) });
      s += placeLabel('LONDON', x - 20, y + 66, t, T.london - 0.05, { size: 44, until: 36.3 });
    }
    // speed lines behind the leading edge
    if (t > T.takes + 0.4 && t < 46.6) {
      const p = planeState(t);
      if (p) {
        const a = p.ang * D2R;
        for (let i = 0; i < 5; i++) {
          const ph = (t * 3.2 + i / 5) % 1, off = (i - 2) * 16;
          const x0 = p.x - Math.cos(a) * (70 + ph * 110) - Math.sin(a) * off, y0 = p.y - Math.sin(a) * (70 + ph * 110) + Math.cos(a) * off;
          s += `<path d="M${f2(x0)},${f2(y0)} l${f2(-Math.cos(a) * 60)},${f2(-Math.sin(a) * 60)}" stroke="#fff" stroke-width="${f2(4 * (1 - ph))}" stroke-linecap="round" opacity="${f2(0.6 * (1 - ph))}"/>`;
        }
      }
    }
    // passport stamps: slam on each place, faster and faster; they stay on the map
    const stampOp = 1 - seg(t, 53.9, 54.5);
    STAMPS.forEach((st, i) => {
      if (t < st.t - 0.02) return;
      const [x, y, z] = P(st.at[0], st.at[1]);
      if (z < 0.05) return;
      const dur = lerp(0.34, 0.16, i / (STAMPS.length - 1));
      const k = seg(t, st.t - 0.02, st.t - 0.02 + dur);
      const zs = clamp(Math.pow(28 / CAM.span, 0.35), 0.48, 1.1) * lerp(1, 0.85, CAM.g);
      let g = '';
      if (st.name === 'INDONESIA' && t > 43.25) { // Gag 7: the series camel peeks out from behind the stamp
        const ck = E.back(seg(t, 43.3, 43.75)) * (1 - E.io(seg(t, 45.3, 45.7)));
        g += `<g transform="rotate(${st.rot}) translate(${f2(st.w * 0.22)} -40)"><g clip-path="url(#stampClip)">${camelPeek(ck, t > 44.0 && t < 44.12)}</g></g>`;
      }
      s += `<g transform="translate(${f2(x)} ${f2(y)}) scale(${f2(zs)})" opacity="${f2(stampOp)}">${g}${passStamp(st, k, t)}</g>`;
      s += burst(x, y, t, st.t + dur * 0.6, { r0: 70 * zs, r1: 120 * zs, color: st.ink, color2: '#fff', d: 0.4 });
    });
    return s;
  }

  // 45.4–54.3 — 22 February, Darwin, 18,000 km, 15 days, almost halved
  function beatDarwin(t) {
    if (t < 46.4 || t > 56) return '';
    let s = '';
    const [x, y, z] = P(...PL.darwin);
    if (z > 0.05) {
      s += pin(x, y, t, T.darwin - 0.05, { size: 1, grad: 'pinY', op: 1 - seg(t, 54.6, 55.2) });
      s += placeLabel('DARWIN', x - 40, y + 70, t, T.darwin, { size: 52, until: 48.8 });
      s += burst(x, y, t, T.darwin + 0.2, { r0: 50, r1: 140, color: '#FFD23F' });
    }
    // overview: 18,000 KM callout counts up on the globe
    if (t > T.about - 0.1 && t < 52.2) {
      const op = seg(t, T.about, T.about + 0.2) * (1 - seg(t, 51.8, 52.2));
      const p = atKm(R.flight, R.flight.total * 0.47); const [cx, cy] = P(p.lon, p.lat);
      const n = Math.round(18000 * E.o(seg(t, T.km18 - 0.1, T.kms)) / 100) * 100;
      const txt = n.toLocaleString('en-AU') + ' KM';
      s += `<g opacity="${f2(op)}"><path d="M${f2(cx)},${f2(cy)} L${f2(cx + 40)},${f2(cy - 170)}" stroke="#FFD23F" stroke-width="4"/><circle cx="${f2(cx)}" cy="${f2(cy)}" r="9" fill="#FFD23F" stroke="#0b1a33" stroke-width="3"/></g>`;
      s += label3d(txt, cx + 40, cy - 190, 104, { fill: '#FFD23F', side: '#7a3b00', edge: '#3a1a00', op, scale: 0.6 + 0.4 * pop(t, T.about - 0.1), depth: 7, ls: 3 });
    }
    // 15 DAYS slam, then the record bars (28 vs 15 — almost halved)
    if (t > T.d15 - 0.05 && t < 54.4) {
      const k = E.o5(seg(t, T.d15, T.d15 + 0.32));
      const m = E.io(seg(t, 51.7, 52.2));
      const op = seg(t, T.d15, T.d15 + 0.08) * (1 - seg(t, 54.0, 54.4));
      s += label3d('15 DAYS', 540, lerp(300, 214, m), 200, { fill: '#FFD23F', side: '#7a3b00', edge: '#3a1a00', scale: lerp(2.3, 1, k) * lerp(1, 0.55, m), op, depth: 11, ls: 5 });
      if (t < 51.6) s += burst(540, 240, t, T.d15 + 0.15, { r0: 150, r1: 240 });
      if (t > 51.8) {
        const bk = E.io(seg(t, 51.9, 52.9)), ck = E.io(seg(t, T.halved, T.halved + 0.7));
        const full = 760, half = full * 15 / 28;
        s += `<g transform="translate(160 300)" opacity="${f2(op * seg(t, 51.8, 52.0))}" filter="url(#ds)">
          <rect x="-24" y="-30" width="${full + 48}" height="196" rx="22" fill="url(#chipG)" stroke="#fff" stroke-opacity="0.5" stroke-width="2"/>
          <rect x="0" y="0" width="${f2(full * bk)}" height="56" rx="12" fill="#cfd6e0"/>
          <text x="20" y="40" font-family="Anton" font-size="38" letter-spacing="2" fill="#0b1a33" opacity="${f2(seg(bk, 0.3, 0.6))}">28 DAYS · FULL CREW</text>
          <rect x="0" y="82" width="${f2(half * bk)}" height="56" rx="12" fill="#FFC21A"/>
          <text x="20" y="122" font-family="Anton" font-size="38" letter-spacing="2" fill="#3a1a00" opacity="${f2(seg(bk, 0.3, 0.6))}">15 DAYS · SOLO</text>
          <path d="M${full / 2},-14 L${full / 2},150" stroke="#ff3347" stroke-width="4" stroke-dasharray="10 8" opacity="${f2(ck)}"/>
          <g opacity="${f2(ck)}" transform="translate(${full / 2 + 14} 148)"><text font-family="Anton" font-size="34" fill="#ff3347">½</text></g></g>`;
      }
    }
    return s;
  }

  // 54.3–59.5 — Gag 4 newspaper over Darwin · Gag 5 vintage thumbs-up stamp
  function beatNews(t) {
    if (t < 54.2 || t > 60.2) return '';
    let s = '';
    const op = 1 - seg(t, 59.5, 60.0);
    const [x, y] = P(...PL.darwin);
    s += pin(x, y, t, 54.9, { size: 1, grad: 'pinY', op });
    s += placeLabel('DARWIN', x - 20, y + 74, t, 55.0, { size: 44, op });
    const k = seg(t, T.newspapers, T.newspapers + 0.55);
    const sp = E.o5(k);
    const hk = seg(t, T.hustling - 0.05, T.hustling + 0.35);
    s += `<g transform="translate(540 ${f2(lerp(980, 480, sp))}) rotate(${f2(lerp(540, -4, sp))}) scale(${f2(lerp(0.08, 1, sp))})" opacity="${f2(seg(k, 0, 0.1) * op)}">${newspaper(k, E.back(hk))}</g>`;
    // leader from the paper to Darwin
    if (sp > 0.9) s += `<path d="M${f2(x)},${f2(y - 30)} L540,705" stroke="#FFD23F" stroke-width="4" stroke-dasharray="10 8" opacity="${f2(op * 0.9)}"/>`;
    // thumbs-up stamp lands on Darwin
    if (t > T.like - 0.12) {
      const sk = seg(t, T.like - 0.1, T.like + 0.12);
      const pulse = t > T.earned ? 1 + 0.06 * Math.sin((t - T.earned) * 14) * (1 - seg(t, T.earned, 59.2)) : 1;
      s += `<g transform="translate(${f2(x + 40)} ${f2(y - 60)}) scale(${f2(1.05 * pulse)})" opacity="${f2(op)}">${thumbsStamp(sk)}</g>`;
      s += burst(x + 40, y - 60, t, T.like + 0.1, { r0: 90, r1: 150, color: '#c4122f', color2: '#FFD23F' });
    }
    return s;
  }

  // 59.5–68.6 — five years later · faster · London · disappears · greys · three months
  function beatAgain(t, grey) {
    if (t < 59.5 || t > 69.2) return '';
    let s = '';
    // calendar: 1928 → 1933 flip, then JAN → APR during "three months"
    const op = seg(t, 59.55, 59.8) * (1 - seg(t, 68.7, 69.1));
    let month = 'FEB', big = '1928', next = null, flip = 0;
    const years = ['1928', '1929', '1930', '1931', '1932', '1933'];
    const yk = seg(t, 59.7, 60.5);
    const yi = Math.min(5, Math.floor(yk * 5.999));
    big = years[yi]; if (yi < 5) { next = years[yi + 1]; flip = (yk * 5.999) % 1; }
    if (yk >= 1) { month = 'JAN'; next = null; flip = 0; big = '1933'; }
    const months = ['JAN', 'FEB', 'MAR', 'APR'];
    if (t > T.forOver) {
      const mk = seg(t, T.forOver + 0.1, 68.1);
      month = months[Math.min(3, Math.floor(mk * 3.999))];
    }
    s += `<g transform="translate(170 290) rotate(-4)" opacity="${f2(op)}">${calendar(month, big, flip, { yearMode: true, next, scale: 0.95 })}</g>`;
    // stopwatch: "even faster"
    if (t > T.tries2 - 0.1 && t < 63.0) {
      const k = pop(t, T.tries2 - 0.1);
      s += `<g transform="translate(900 300) scale(${f2(k * 0.95)})" opacity="${f2(1 - seg(t, 62.6, 63.0))}">${stopwatch((t - T.tries2) * 900)}</g>`;
    }
    // London pin + label for the 1933 take-off
    if (t > 62.3 && t < 64.6) {
      const [x, y] = P(...PL.london);
      s += pin(x, y, t, 62.35, { size: 0.85, op: 1 - seg(t, 64.1, 64.5) });
      s += placeLabel('LONDON', x - 20, y + 66, t, T.london2 - 0.1, { size: 44, until: 64.5 });
    }
    // three months of searching: rings and question marks across the Alps / France / sea
    if (t > 64.9 && t < 68.8) {
      const spots = [[4.5, 47.0], [7.0, 45.6], [9.5, 44.6], [6.0, 43.4], [3.0, 45.0], [8.2, 46.6], [10.8, 45.6]];
      const so = seg(t, 64.9, 65.3) * (1 - seg(t, 68.3, 68.8));
      spots.forEach((sp, i) => {
        const [x, y] = P(sp[0], sp[1]);
        const ph = ((t - 64.9) * 0.7 + i * 0.37) % 1;
        s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(10 + 90 * ph)}" fill="none" stroke="#e8ecf1" stroke-width="${f2(3.5 * (1 - ph))}" opacity="${f2(so * (1 - ph))}"/>`;
        const qk = fade(t, 65.2 + i * 0.35, 66.9 + i * 0.3, 0.25);
        if (qk > 0) s += `<text x="${f2(x)}" y="${f2(y - 16)}" text-anchor="middle" font-family="Anton" font-size="${f2(56 * (0.8 + 0.2 * qk))}" fill="#f1f3f6" stroke="#0b1a33" stroke-width="3" paint-order="stroke" opacity="${f2(so * qk * 0.95)}" filter="url(#ds2)">?</text>`;
      });
    }
    return s;
  }

  // 68.6–73.4 — body found beside the crashed plane, on a mountain in Italy (dignity)
  function beatFound(t) {
    if (t < 69.4 || t > 74.4) return '';
    let s = '';
    const op = 1 - seg(t, 73.9, 74.3);
    const [x, y] = P(...PL.pratomagno);
    // a quiet grey plane silhouette, tilted, beside the pin
    if (t > T.crashed - 0.15) {
      const k = seg(t, T.crashed - 0.15, T.crashed + 0.5);
      const ks = clamp(1.5 / CAM.span, 0.3, 1.1);
      s += `<g transform="translate(${f2(x + 70 * ks)} ${f2(y + 24 * ks)}) rotate(28) scale(${f2(0.85 * ks)})" opacity="${f2(k * 0.85 * op)}">${planeTop({ wing: '#b9bfc8', body: '#a7aeb8', line: '#3a4049' })}</g>`;
    }
    s += pin(x, y, t, T.found + 0.05, { size: 1, grad: 'pinGrey', op });
    s += placeLabel('PRATOMAGNO', x, y - 120, t, T.mountain, { size: 44, until: 73.0, op });
    if (t > T.italy2 - 0.1) {
      const [ix, iy] = P(12.6, 42.6);
      s += placeLabel('ITALY', ix + 40, iy, t, T.italy2, { size: 60, until: 74.2 });
    }
    return s;
  }

  // 73.4–85.3 — Mussolini orders full military honours · buried in Florence · home
  function beatFlorence(t) {
    if (t < 73.9 || t > 85.6) return '';
    let s = '';
    const [fx, fy, fz] = P(...PL.florence);
    const [px, py] = P(...PL.pratomagno);
    const op = 1 - seg(t, 85.0, 85.5);
    const near = 1 - seg(t, 82.9, 83.4); // close-up props fade as we pull out
    if (t < 83.6) {
      s += pin(px, py, t, 73.95, { size: 0.8, grad: 'pinGrey', op: near * (1 - seg(t, 79.2, 79.8)) });
      s += chip('BENITO MUSSOLINI', 540, 290, { size: 36, op: seg(t, T.mussolini - 0.1, T.mussolini + 0.1) * (1 - seg(t, 78.6, 79.0)), scale: 0.7 + 0.3 * pop(t, T.mussolini - 0.1), accent: '#d8dde5' });
    }
    if (fz > 0.05) {
      s += pin(fx, fy, t, T.orders - 0.05, { size: 1, grad: 'pinGrey', op: op });
      s += placeLabel('FLORENCE', fx - 10, fy + 74, t, T.orders + 0.05, { size: 48, until: 85.4, op: lerp(1, 0.9, 1 - near) });
      // full military honours: an honour guard forms, a wreath settles
      if (t > T.military - 0.2 && t < 83.6) s += `<g transform="translate(${f2(fx)} ${f2(fy + 6)}) scale(1.15)" opacity="${f2(near)}">${honourGuard(seg(t, T.military - 0.2, T.honours + 0.4), t)}</g>`;
      if (t > T.honours - 0.1 && t < 83.6) s += `<g transform="translate(${f2(fx + 230)} ${f2(fy - 170)}) scale(${f2(1.6 * pop(t, T.honours - 0.1))})" opacity="${f2(near)}">${wreath(seg(t, T.honours - 0.1, T.honours + 0.5))}</g>`;
      // buried in Florence: soft memorial ring
      if (t > T.buried - 0.1) s += `<g transform="translate(${f2(fx)} ${f2(fy)})">${memorial(fade(t, T.buried - 0.1, 85.4, 0.4) * 0.9, 34 + 4 * Math.sin(t * 2))}</g>`;
    }
    // the boy from a small Australian town — the real Bert, aged 27
    if (t > T.boy - 0.15 && t < 82.8) {
      const k = seg(t, T.boy - 0.15, T.boy + 0.6);
      s += `<g transform="translate(540 560)" opacity="${f2(1 - seg(t, 82.3, 82.75))}">${ovalPortrait('#ph27', k)}</g>`;
    }
    // other side of the world: Bundaberg, home
    if (t > 83.2) {
      const [bx, by, bz] = P(...PL.bundaberg);
      if (bz > 0.05) {
        s += `<g transform="translate(${f2(bx)} ${f2(by - 48)})" opacity="${f2(op)}">${house(seg(t, T.home - 0.15, T.home + 0.3))}</g>`;
        s += placeLabel('BUNDABERG', bx - 70, by + 64, t, 83.7, { size: 40, op, until: 85.4 });
      }
    }
    return s;
  }

  // 85.3–91.25 — Gag 7: master map, EP. 2, camel, next one, incomplete loop
  function beatSeries(t) {
    if (t < 85.6 || t > 90.6) return '';
    let s = '';
    const op = seg(t, 85.7, 86.1) * (1 - seg(t, 90.1, 90.5));
    s += `<g opacity="${f2(op * 0.95)}"><rect x="40" y="150" width="1000" height="1080" rx="26" fill="none" stroke="#FFC233" stroke-width="4" stroke-dasharray="${f2(4160 * E.io(seg(t, 85.7, 86.7)))} 4160"/>
      ${[0, 1, 2, 3].map((i) => `<path d="M${40 + i * 333},150 l0,14 M${40 + i * 333},1230 l0,-14" stroke="#FFC233" stroke-width="3"/>`).join('')}</g>`;
    s += chip('IMPOSSIBLE JOURNEYS', 540, 220, { size: 44, op, scale: 0.8 + 0.2 * pop(t, T.impossible - 0.2), accent: '#ff3b4a' });
    // EP. 1 (Mary Bryant) and EP. 2 (this one)
    const m1 = atKm(R.maryEscape, R.maryEscape.total * 0.5); const [m1x, m1y] = P(m1.lon, m1.lat);
    s += chip('EP. 1', m1x - 40, m1y + 120, { size: 30, op: op * seg(t, 85.9, 86.2), scale: 0.6 + 0.4 * pop(t, 85.9, 0.4), bg: '#5a0a16', accent: '#ff8a96' });
    const m2 = atKm(R.flight, R.flight.total * 0.42); const [m2x, m2y] = P(m2.lon, m2.lat);
    const k2 = pop(t, T.two - 0.05, 0.4);
    s += `<path d="M${f2(m2x)},${f2(m2y)} L${f2(m2x + 30)},${f2(m2y - 100)}" stroke="#fff" stroke-width="3" opacity="${f2(op * seg(t, T.two, T.two + 0.1))}"/>`;
    s += chip('EP. 2', m2x + 60, m2y - 130, { size: 40, op: op * seg(t, T.two - 0.05, T.two + 0.1), scale: 0.6 + 0.4 * k2, bg: '#c4122f', accent: '#ffffff' });
    // next one? — pulsing slot elsewhere on the master map
    if (t > T.follow - 0.1) {
      const [qx, qy] = P(22, 6);
      const pk = pop(t, T.follow + 0.2, 0.4) * (1 + 0.06 * Math.sin(t * 8));
      s += `<g transform="translate(${f2(qx + 40)} ${f2(qy)}) scale(${f2(pk)})" opacity="${f2(op)}" filter="url(#ds)"><circle r="44" fill="#c4122f" stroke="#fff" stroke-width="4"/>
        <text y="20" text-anchor="middle" font-family="Anton" font-size="58" fill="#fff">?</text></g>`;
      s += chip('EP. 3', qx + 40, qy + 86, { size: 30, op: op * seg(t, T.nextOne - 0.2, T.nextOne), bg: '#2a0a12', accent: '#ff6b78' });
    }
    // series camel mascot walks in and waves
    const ck = E.o(seg(t, 86.9, 88.0));
    s += `<g transform="translate(${f2(lerp(-160, 250, ck))} 1080) scale(1.15)" opacity="${f2(op)}" filter="url(#ds)">${camelFull(t * 9 * (1 - seg(t, 87.9, 88.1)), t > 88.0 ? t * 10 : 0)}</g>`;
    return s;
  }

  // ------------------------------------------------------------- boot
  (async function boot() {
    const style = document.createElement('style');
    style.textContent = `
      @font-face { font-family: 'Anton'; src: url('/ep/render/fonts/anton-latin-400-normal.woff2') format('woff2'); font-weight: 400; }
      @font-face { font-family: 'Montserrat'; src: url('/ep/render/fonts/montserrat-latin-700-normal.woff2') format('woff2'); font-weight: 700; }
      @font-face { font-family: 'Montserrat'; src: url('/ep/render/fonts/montserrat-latin-800-normal.woff2') format('woff2'); font-weight: 800; }
      @font-face { font-family: 'Montserrat'; src: url('/ep/render/fonts/montserrat-latin-900-normal.woff2') format('woff2'); font-weight: 900; }
      svg text { font-kerning: normal; }`;
    document.head.appendChild(style);
    const [b, g] = await Promise.all([fetch('/ep/render/basemap.json').then((r) => r.json()), fetch('/ep/render/geo.json').then((r) => r.json())]);
    BASE = b; GEO = g;
    await Promise.all(['400 40px Anton', '700 40px Montserrat', '800 40px Montserrat', '900 40px Montserrat'].map((f) => document.fonts.load(f)));
    setupTimeline();
    const domReady = buildDom();
    measureCtx = document.getElementById('measure');
    await domReady;
    // decode every basemap layer, globe and photo once so no frame paints blank
    const imgs = [...LAYER_ORDER.map((n) => BASE[n].file), BASE.globe.file, BASE['globe-over'].file,
      's27_01_bert_hinkler_aviator_slq.jpg', 's27_02_bert_hinkler_aged_27.jpg', 's27_03_bert_hinkler_avro_avian_1928.jpg'];
    await Promise.all(imgs.map((f) => { const im = new Image(); im.src = '/img/' + f; return im.decode().catch(() => {}); }));
    READY = true;
    window.renderFrame(0);
    window.__assetsReady = true;
  })();
})();
