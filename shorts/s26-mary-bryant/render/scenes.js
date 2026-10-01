/* s26 Mary Bryant — MAP EXPLAINER (Impossible Journeys ep.1)
 * SVG + renderFrame(t) + Playwright + ffmpeg. No Remotion.
 *
 * One continuous kinetic map: a persistent SVG holds the satellite basemap layers
 * (built by tools/build_basemap.py) under an always-moving eased camera; every frame
 * re-projects routes, coast glows, pins, gags, HUD and karaoke captions on top.
 * All seams come from transcript.json (faster-whisper word timings on the held VO).
 */
(function () {
  'use strict';
  const HS = window.HS;
  const W = 1080, H = 1920, FY = 860; // camera focus sits above the ~70% caption band
  const CAP_Y = Math.round(H * 0.70);
  const WU = 100000; // world units per normalised Mercator unit (image placement)

  window.__assetsReady = false;
  const EP = (window.EPISODE = { duration: 96.12, fps: 30, words: [], scenes: [] });

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
  const pop = (t, a, d = 0.35) => E.back(seg(t, a, a + d));
  const fade = (t, a, b, d = 0.2) => Math.min(seg(t, a, a + d), 1 - seg(t, b - d, b));
  const f2 = (n) => (Math.round(n * 100) / 100).toString();
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // deterministic noise
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };

  // ------------------------------------------------------------- projection
  const mu = (lon) => (lon + 180) / 360;
  const mv = (lat) => { const r = (clamp(lat, -85, 85) * Math.PI) / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2; };
  const hav = (a, b) => {
    const R = 6371, la1 = (a[1] * Math.PI) / 180, la2 = (b[1] * Math.PI) / 180, dl = ((b[0] - a[0]) * Math.PI) / 180;
    const h = Math.sin((la2 - la1) / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dl / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  let CAM = { u: 0.5, v: 0.5, S: 1000, span: 40 };
  const P = (lon, lat) => [540 + (mu(lon) - CAM.u) * CAM.S, FY + (mv(lat) - CAM.v) * CAM.S];
  const PU = (u, v) => [540 + (u - CAM.u) * CAM.S, FY + (v - CAM.v) * CAM.S];
  const onScreen = (x, y, m = 200) => x > -m && x < W + m && y > -m && y < H + m;

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
    const pts = [wp[0]], km = [0];
    for (let i = 1; i < wp.length; i++) {
      const a = wp[i - 1], b = wp[i], d = hav(a, b), n = Math.max(1, Math.ceil(d / step));
      for (let k = 1; k <= n; k++) {
        const p = [lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)];
        km.push(km[km.length - 1] + d / n); pts.push(p);
      }
    }
    const r = { name, pts, km, total: km[km.length - 1], u: pts.map((p) => mu(p[0])), v: pts.map((p) => mv(p[1])) };
    r.prog = monotone(table);
    R[name] = r;
    return r;
  }
  function idxAtKm(r, k) {
    let lo = 0, hi = r.km.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (r.km[m] <= k) lo = m; else hi = m; }
    return lo;
  }
  function atKm(r, k) { // → {u, v, lon, lat, dir:[dx,dy] in mercator}
    k = clamp(k, 0, r.total);
    const i = idxAtKm(r, k), j = Math.min(i + 1, r.km.length - 1);
    const f = r.km[j] > r.km[i] ? (k - r.km[i]) / (r.km[j] - r.km[i]) : 0;
    const u = lerp(r.u[i], r.u[j], f), v = lerp(r.v[i], r.v[j], f);
    // heading from a short look-back/look-ahead window
    const a = idxAtKm(r, k - 25), b = idxAtKm(r, Math.min(r.total, k + 25)) + 1;
    const bb = Math.min(b, r.km.length - 1);
    let dx = r.u[bb] - r.u[a], dy = r.v[bb] - r.v[a];
    const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
    return { u, v, lon: lerp(r.pts[i][0], r.pts[j][0], f), lat: lerp(r.pts[i][1], r.pts[j][1], f), dx, dy };
  }
  const head = (name, t) => atKm(R[name], R[name].prog(t));
  // screen path of a route between km a..b (skips sub-pixel steps)
  function routePath(r, kA, kB) {
    kA = clamp(kA, 0, r.total); kB = clamp(kB, 0, r.total);
    if (kB <= kA) return '';
    const i0 = idxAtKm(r, kA), i1 = idxAtKm(r, kB);
    const s = atKm(r, kA), e = atKm(r, kB);
    let [x, y] = PU(s.u, s.v);
    let d = `M${f2(x)} ${f2(y)}`, lx = x, ly = y;
    for (let i = i0 + 1; i <= i1; i++) {
      [x, y] = PU(r.u[i], r.v[i]);
      if (Math.abs(x - lx) + Math.abs(y - ly) < 1.6) continue;
      d += `L${f2(x)} ${f2(y)}`; lx = x; ly = y;
    }
    [x, y] = PU(e.u, e.v);
    return d + `L${f2(x)} ${f2(y)}`;
  }
  function ringPath(ring) {
    let d = '', lx = 1e9, ly = 1e9;
    for (let i = 0; i < ring.length; i++) {
      const [x, y] = P(ring[i][0], ring[i][1]);
      if (i && Math.abs(x - lx) + Math.abs(y - ly) < 1.4) continue;
      d += (d ? 'L' : 'M') + f2(x) + ' ' + f2(y); lx = x; ly = y;
    }
    return d + 'Z';
  }

  // ------------------------------------------------------------------ camera
  // keys: {t, c:[lon,lat] | 'route-name' (follow its head), s: span° of longitude across 1080 px, e: ease, lead}
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
    // always-moving camera: slow breathing drift layered on every move
    const dr = 0.018 * Math.sin(t * 0.61) + 0.012 * Math.sin(t * 1.37 + 1.1);
    const sp = span * (1 + dr);
    u += (span / 360) * 0.012 * Math.sin(t * 0.43 + 0.7);
    v += (span / 360) * 0.010 * Math.sin(t * 0.52 + 2.1);
    return { u, v, span: sp, S: (W * 360) / sp };
  }
  function camShake(t, a, b, amp) {
    const k = fade(t, a, b, 0.08) * amp;
    return [noise1(t * 31) * k, noise1(t * 29 + 7) * k];
  }

  // ------------------------------------------------------------------ DOM
  let BASE, GEO, svg, camG, layerEls = {}, desatM, blurF, mapG, gradeG, routeG, ovG, capG, measureCtx;
  const LAYER_ORDER = ['world', 'region', 'uk', 'torres', 'kupang', 'sydney'];
  const LAYER_MAX_SPAN = { world: 1e9, region: 95, uk: 40, torres: 16, kupang: 7, sydney: 1.7 };

  function buildDom() {
    const root = document.getElementById('root');
    root.innerHTML = `
<svg id="S" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <clipPath id="stern"><rect x="-200" y="-300" width="400" height="318"/></clipPath>
    <filter id="desat" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feColorMatrix id="desatM" type="saturate" values="1"/>
    </filter>
    <filter id="mblur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur id="mblurB" stdDeviation="0 0"/></filter>
    <filter id="ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#020814" flood-opacity="0.65"/></filter>
    <filter id="ds2" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#020814" flood-opacity="0.7"/></filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="glow4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="soft2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="cloud" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
    <radialGradient id="vig" cx="50%" cy="46%" r="75%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#01050f" stop-opacity="0.78"/>
    </radialGradient>
    <radialGradient id="pinG" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ff8a5c"/><stop offset="1" stop-color="#c3261a"/></radialGradient>
    <radialGradient id="pinY" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#e08a00"/></radialGradient>
    <radialGradient id="pinGrey" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#e8ecf1"/><stop offset="1" stop-color="#8a93a0"/></radialGradient>
    <radialGradient id="coinG" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff2b0"/><stop offset="0.55" stop-color="#f2c230"/><stop offset="1" stop-color="#a87400"/></radialGradient>
    <linearGradient id="hullG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6630"/><stop offset="1" stop-color="#4e2c10"/></linearGradient>
    <linearGradient id="navyHull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2a30"/><stop offset="1" stop-color="#0d0d12"/></linearGradient>
    <linearGradient id="sailG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#e2cfa4"/></linearGradient>
    <linearGradient id="paperG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6ead0"/><stop offset="1" stop-color="#dcc79c"/></linearGradient>
    <linearGradient id="chipG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14233d" stop-opacity="0.94"/><stop offset="1" stop-color="#070f1e" stop-opacity="0.94"/></linearGradient>
    <linearGradient id="goldG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a3"/><stop offset="1" stop-color="#e3a419"/></linearGradient>
    <linearGradient id="camelG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7b56c"/><stop offset="1" stop-color="#c18a42"/></linearGradient>
    <linearGradient id="skyFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030a1a" stop-opacity="0.55"/><stop offset="0.25" stop-color="#030a1a" stop-opacity="0"/><stop offset="0.78" stop-color="#030a1a" stop-opacity="0"/><stop offset="1" stop-color="#030a1a" stop-opacity="0.6"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#040e26"/>
  <g id="mapG" filter="url(#desat)">
    <g id="blurG">
      <g id="camG"></g>
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
      el.setAttribute('opacity', '1');
      loads.push(new Promise((res) => { el.addEventListener('load', res, { once: true }); el.addEventListener('error', res, { once: true }); }));
      camG.appendChild(el);
      layerEls[name] = el;
    }
    return Promise.all(loads);
  }

  function placeLayers() {
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

  // ---------------------------------------------------------------- captions
  let PHRASES = null;
  function buildPhrases(words) {
    const out = [];
    let cur = [];
    const flush = () => { if (cur.length) out.push(cur); cur = []; };
    for (let i = 0; i < words.length; i++) {
      const w = words[i], prev = cur[cur.length - 1];
      if (prev && (w.start - prev.end > 0.42 || /[.?!…,]$/.test(prev.word) || cur.length >= 4)) flush();
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
  // Big 3D extruded label (Anton) — bold white face, navy extrusion, soft drop shadow
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
  // map place label (smaller 3D style, Montserrat)
  function placeLabel(text, x, y, t, t0, o = {}) {
    if (t < t0) return '';
    const k = pop(t, t0, 0.4), op = seg(t, t0, t0 + 0.15) * (o.op != null ? o.op : 1) * (o.until ? 1 - seg(t, o.until - 0.25, o.until) : 1);
    if (op <= 0) return '';
    return label3d(text, x, y, o.size || 46, { font: 'Montserrat', weight: 900, scale: 0.6 + 0.4 * k, op, depth: o.depth || 3, ls: o.ls != null ? o.ls : 3, fill: o.fill, rot: o.rot });
  }
  // chip — rounded HUD pill (names, counts, facts)
  function chip(text, x, y, o = {}) {
    const size = (o.size || 38) * 1.18, padX = o.padX || 32, h = size * 1.7;
    const wd = measure(text, size, 800, 2) + padX * 2 + (o.icon ? h * 0.85 : 0);
    const sc = o.scale != null ? o.scale : 1, op = o.op != null ? o.op : 1;
    const acc = o.accent || '#FFC233';
    let icon = '';
    if (o.icon) icon = `<g transform="translate(${f2(-wd / 2 + padX * 0.55 + h * 0.36)} 0) scale(${f2(h / 100)})">${o.icon}</g>`;
    const tx = o.icon ? -wd / 2 + padX * 0.55 + h * 0.85 + (wd - padX * 0.55 - h * 0.85 - padX) / 2 : 0;
    return `<g transform="translate(${f2(x)} ${f2(y)}) scale(${f2(sc)})" opacity="${f2(op)}" filter="url(#ds)">
      <rect x="${f2(-wd / 2)}" y="${f2(-h / 2)}" width="${f2(wd)}" height="${f2(h)}" rx="${f2(h / 2)}" fill="${o.bg || 'url(#chipG)'}" stroke="${acc}" stroke-width="3"/>
      ${icon}
      <text x="${f2(tx)}" y="${f2(size * 0.35)}" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="${size}" letter-spacing="2" fill="${o.color || '#fff'}">${esc(text)}</text></g>`;
  }
  // classic map pin with drop + bounce + ripple
  function pin(x, y, t, t0, o = {}) {
    if (t < t0) return '';
    const sz = o.size || 1, g = o.grad || 'pinG';
    const d = seg(t, t0, t0 + 0.28), drop = (1 - E.i(d)) * -160 * sz;
    const sq = t > t0 + 0.28 ? 1 - 0.18 * Math.sin(seg(t, t0 + 0.28, t0 + 0.5) * Math.PI) : 1;
    const rp = seg(t, t0 + 0.26, t0 + 0.95);
    const op = o.op != null ? o.op : 1;
    return `<g transform="translate(${f2(x)} ${f2(y)})" opacity="${f2(op)}">
      ${rp > 0 && rp < 1 ? `<ellipse rx="${f2(10 + 70 * sz * E.o(rp))}" ry="${f2((10 + 70 * sz * E.o(rp)) * 0.42)}" fill="none" stroke="#fff" stroke-width="${f2(4 * (1 - rp))}" opacity="${f2(1 - rp)}"/>` : ''}
      <ellipse rx="${f2(14 * sz)}" ry="${f2(5 * sz)}" fill="#000" opacity="${f2(0.35 * d)}"/>
      <g transform="translate(0 ${f2(drop)}) scale(${f2(sz / sq * 0.95)} ${f2(sz * sq)})" filter="url(#ds2)">
        <path d="M0,0 C-5,-12 -21,-22 -21,-40 A21,21 0 1 1 21,-40 C21,-22 5,-12 0,0 Z" fill="url(#${g})" stroke="#fff" stroke-width="3.5"/>
        <circle cy="-40" r="8" fill="#fff"/>
        ${o.inner || ''}
      </g></g>`;
  }
  function smallPin(x, y, t, t0, sz = 0.55, g = 'pinY') { return pin(x, y, t, t0, { size: sz, grad: g }); }

  // people glyphs (white, used in chips / HUD)
  const ICON_PERSON = `<g fill="#fff"><circle cx="0" cy="-22" r="13"/><path d="M-22,22 C-22,-2 22,-2 22,22 Z"/></g>`;
  const ICON_MOTHER = `<g fill="#fff"><circle cx="0" cy="-26" r="12"/><circle cx="8" cy="-36" r="7"/><path d="M-20,26 C-20,4 -12,-12 0,-12 C12,-12 20,4 20,26 Z"/></g>`;
  const ICON_TODDLER = `<g fill="#fff"><circle cx="0" cy="-10" r="10"/><path d="M-14,26 C-14,8 14,8 14,26 Z"/></g>`;
  const ICON_BABY = `<g fill="#fff"><ellipse cx="0" cy="10" rx="20" ry="13"/><circle cx="-13" cy="4" r="9"/><circle cx="-13" cy="4" r="5" fill="#f2d2b0"/></g>`;
  const ICON_QUILL = `<g><path d="M24,-30 C4,-26 -12,-6 -18,22 L-14,24 C-6,0 10,-18 24,-30 Z" fill="#fff"/><path d="M-18,22 L-22,32" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>`;
  const ICON_LINK = `<g fill="none" stroke="#FFC233" stroke-width="6"><circle cx="-9" cy="0" r="13"/><circle cx="9" cy="0" r="13"/></g>`;

  // governor's cutter — side view, facing +x
  function boat(o = {}) {
    const heads = o.heads != null ? o.heads : 11;
    const face = o.faces || 0; // 0 dots → 1 sad faces
    let hs = '';
    for (let i = 0; i < heads; i++) {
      const hx = -40 + i * (78 / Math.max(1, heads - 1)), hy = -2 - (i % 2) * 3;
      const r = 4.6 + 2.6 * face;
      hs += `<circle cx="${f2(hx)}" cy="${f2(hy)}" r="${f2(r)}" fill="${i % 3 === 0 ? '#3b2416' : i % 3 === 1 ? '#5a3a22' : '#2a1a10'}"/>`;
      if (face > 0.05) {
        const fy = hy + 0.6;
        hs += `<circle cx="${f2(hx)}" cy="${f2(hy)}" r="${f2(r - 1.6)}" fill="#f0c9a0" opacity="${f2(face)}"/>
          <g opacity="${f2(face)}" stroke="#2a1508" stroke-width="1.3" fill="none" stroke-linecap="round">
          <path d="M${f2(hx - 2.6)},${f2(fy - 1.8)} l1.4,0.9 M${f2(hx + 2.6)},${f2(fy - 1.8)} l-1.4,0.9"/>
          ${o.shock ? `<circle cx="${f2(hx)}" cy="${f2(fy + 2.6)}" r="1.4" fill="#2a1508"/>` : `<path d="M${f2(hx - 2.4)},${f2(fy + 3.6)} q2.4,-2.4 4.8,0"/>`}</g>
          ${o.tears && i % 2 === 0 ? `<path d="M${f2(hx + 3.2)},${f2(fy + 0.5)} q1.4,3 0,4.2 q-1.4,-1.2 0,-4.2 Z" fill="#7fd0ff" opacity="${f2(face)}"/>` : ''}`;
      }
    }
    const crown = o.crown ? `<g transform="translate(6 -92) scale(${f2(o.crown)})"><path d="M-14,8 L-16,-8 L-7,0 L0,-12 L7,0 L16,-8 L14,8 Z" fill="url(#goldG)" stroke="#7a5200" stroke-width="2"/><circle cy="-13" r="3" fill="#e0312b"/></g>` : '';
    const sail = o.noSail ? '' : `<path d="M8,-84 L58,-64 L52,-6 L8,-6 Z" fill="url(#sailG)" stroke="#6b5434" stroke-width="2"/>
      <path d="M2,-80 L-42,-6 L2,-6 Z" fill="#f0e3c3" stroke="#6b5434" stroke-width="2"/>
      <path d="M8,-82 L8,-8" stroke="#3b2412" stroke-width="5"/>
      <path d="M8,-86 l18,4 -18,4 Z" fill="${o.flag || '#d8342a'}"/>`;
    return `<g>
      ${sail}${crown}${o.camel ? `<g clip-path="url(#stern)">${camelPeek(o.camel, o.blink)}</g>` : ''}${hs}
      <path d="M-62,2 L64,2 Q56,22 32,27 L-46,27 Q-60,20 -62,2 Z" fill="url(#hullG)" stroke="#24130a" stroke-width="3"/>
      <path d="M-58,7 L60,7" stroke="#f0c67a" stroke-width="3"/>
      ${o.chains ? o.chains : ''}
    </g>`;
  }
  function wake(t, speed, sc) {
    let s = '';
    const n = 6;
    for (let i = 0; i < n; i++) {
      const ph = ((t * 2.6 * (0.6 + speed) + i / n) % 1);
      const x = -70 - ph * 150 * (0.5 + speed), y = 18 + (i % 3 - 1) * 12;
      s += `<path d="M${f2(x)},${f2(y)} l${f2(-40 - 60 * speed)},0" stroke="#fff" stroke-width="${f2(5 * (1 - ph))}" stroke-linecap="round" opacity="${f2((1 - ph) * (0.25 + 0.6 * speed))}"/>`;
    }
    s += `<path d="M64,18 q10,6 22,4 M64,22 q10,10 26,10" stroke="#fff" stroke-width="3" fill="none" opacity="${f2(0.4 + 0.4 * speed)}"/>`;
    return s;
  }
  // series camel (vector MG gag) — peeks from behind the stern
  function camelPeek(k, blink) { // head + neck rising from inside the stern (hull drawn over the neck base)
    const y = lerp(78, 0, k);
    return `<g transform="translate(-50 ${f2(y)})" stroke="#7a5122" stroke-width="2.5" stroke-linejoin="round">
      <path d="M-12,40 C-12,8 -9,-22 -3,-42 L15,-42 C11,-20 11,10 11,40 Z" fill="url(#camelG)"/>
      <path d="M-4,-44 C-6,-60 6,-66 18,-64 C30,-62 44,-58 50,-50 C56,-42 52,-32 42,-32 C32,-32 22,-34 12,-34 C2,-34 -4,-36 -4,-44 Z" fill="url(#camelG)"/>
      <path d="M2,-58 l-8,-14 13,7 Z" fill="#c18a42"/>
      <path d="M8,-63 q4,-8 10,-2 q4,-7 9,0" fill="none" stroke-width="2"/>
      <ellipse cx="17" cy="-52" rx="3.6" ry="${blink ? 0.6 : 4}" fill="#2a1508" stroke="none"/>
      <circle cx="18.2" cy="-53.4" r="1.2" fill="#fff" stroke="none" opacity="${blink ? 0 : 1}"/>
      <path d="M11,-58 q6,-4 12,-1" fill="none" stroke-width="2"/>
      <ellipse cx="46" cy="-47" rx="1.8" ry="2.4" fill="#7a5122" stroke="none"/>
      <path d="M36,-38 q6,4 12,-1" fill="none" stroke-width="2.2"/>
    </g>`;
  }
  function camelFull(walk, wave) { // master-map mascot
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
      ${wave ? `<g transform="translate(66 -40) rotate(${f2(-20 + Math.sin(wave) * 25)})"><path d="M0,0 L-30,-30" stroke-width="7" stroke="#c18a42"/></g>` : ''}
    </g>`;
  }
  // Dutch Republic tricolour pin (nods)
  function flagPin(nod, wave) {
    let top = '', mid = '', bot = '';
    const pts = (y0) => { let a = ''; for (let i = 0; i <= 8; i++) { const x = i * 9; a += `${i ? 'L' : 'M'}${x},${f2(y0 + Math.sin(wave + i * 0.7) * 2.6 * (i / 8))}`; } return a; };
    const band = (y0, y1, c) => {
      let d = pts(y0);
      for (let i = 8; i >= 0; i--) { const x = i * 9; d += `L${x},${f2(y1 + Math.sin(wave + i * 0.7) * 2.6 * (i / 8))}`; }
      return `<path d="${d}Z" fill="${c}"/>`;
    };
    top = band(-110, -96, '#c8102e'); mid = band(-96, -82, '#ffffff'); bot = band(-82, -68, '#21468b');
    return `<g transform="rotate(${f2(nod)})" filter="url(#ds2)">
      <path d="M0,0 L0,-112" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round"/>
      <g transform="translate(2 0)">${top}${mid}${bot}<path d="${pts(-110)}" stroke="#00000033" fill="none"/></g>
      <circle cy="-114" r="5" fill="url(#goldG)"/></g>`;
  }
  // Royal Navy frigate (HMS Pandora) — side view
  function frigate() {
    const sq = (x, y, w, h) => `<path d="M${x - w / 2},${y} L${x + w / 2},${y} L${x + w / 2 - 3},${y + h} L${x - w / 2 + 3},${y + h} Z" fill="url(#sailG)" stroke="#6b5434" stroke-width="1.5"/>`;
    let sails = '';
    for (const [mx, top] of [[-40, -96], [4, -116], [44, -88]]) {
      sails += `<path d="M${mx},0 L${mx},${top}" stroke="#2b1a0e" stroke-width="4"/>`;
      sails += sq(mx, top + 8, 40, 26) + sq(mx, top + 38, 48, 30) + (top < -100 ? sq(mx, top + 72, 54, 30) : sq(mx, top + 72, 50, 22));
    }
    return `<g>${sails}
      <path d="M-84,-2 L-70,-14 L-70,-2 Z" fill="#7a1010"/>
      <path d="M-78,0 L86,0 L100,-12 Q96,18 70,28 L-62,28 Q-80,18 -78,0 Z" fill="url(#navyHull)" stroke="#000" stroke-width="2.5"/>
      <path d="M-74,9 L90,9" stroke="#e0b33c" stroke-width="6"/>
      ${[-56, -36, -16, 4, 24, 44, 64].map((x) => `<rect x="${x}" y="6" width="7" height="6" fill="#1a1a1a"/>`).join('')}
      <path d="M86,0 L120,-18" stroke="#2b1a0e" stroke-width="3"/>
      <path d="M-40,-96 l-26,-6 0,12 Z" fill="#c8102e"/></g>`;
  }
  function lifeboat(oar) {
    return `<g><path d="M-26,0 L26,0 Q20,12 10,14 L-14,14 Q-24,10 -26,0 Z" fill="url(#hullG)" stroke="#24130a" stroke-width="2.5"/>
      <circle cx="-10" cy="-3" r="4" fill="#3b2416"/><circle cx="2" cy="-4" r="4" fill="#2a1a10"/><circle cx="13" cy="-3" r="4" fill="#5a3a22"/>
      <path d="M-4,4 l${f2(-16 + 8 * Math.sin(oar))},14 M8,4 l${f2(12 - 8 * Math.sin(oar))},14" stroke="#c9a16a" stroke-width="3" stroke-linecap="round"/></g>`;
  }
  function bicorne() {
    return `<g><path d="M-26,0 C-20,-16 20,-16 26,0 C14,-4 -14,-4 -26,0 Z" fill="#141414" stroke="#e0b33c" stroke-width="2"/><circle cx="0" cy="-9" r="3" fill="#e0b33c"/></g>`;
  }
  function poster(flap) {
    return `<g transform="skewY(${f2(flap)})" filter="url(#ds2)">
      <rect x="-80" y="-100" width="160" height="200" rx="4" fill="url(#paperG)" stroke="#8a6a3a" stroke-width="3"/>
      <text y="-52" text-anchor="middle" font-family="Anton" font-size="46" fill="#3a2410" letter-spacing="2">WANTED</text>
      <path d="M-56,-36 L56,-36 M-56,64 L56,64" stroke="#8a6a3a" stroke-width="2"/>
      <g transform="translate(0 6) scale(0.42)">${frigate()}</g>
      <text y="56" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="17" fill="#3a2410" letter-spacing="1">BOUNTY MUTINEERS</text>
      <text y="84" text-anchor="middle" font-family="Montserrat" font-weight="700" font-size="14" fill="#6a4a20" letter-spacing="1">REWARD</text></g>`;
  }
  // speech bubble with a broken-ship pictogram (the cover story); crack → halves fall
  function storyBubble(crack, fallT) {
    const pic = `<g transform="translate(0 4)">
      <path d="M-46,0 L-6,0 L-10,12 L-40,12 Z" fill="#6b4520" stroke="#24130a" stroke-width="2.5" transform="rotate(-14 -26 6)"/>
      <path d="M6,0 L46,0 L40,12 L10,12 Z" fill="#6b4520" stroke="#24130a" stroke-width="2.5" transform="rotate(16 26 6)"/>
      <path d="M-22,-4 L-26,-40 M24,-2 L30,-34" stroke="#3b2412" stroke-width="3.5"/>
      <path d="M-26,-38 L-6,-30 L-24,-12 Z M30,-32 L48,-22 L28,-12 Z" fill="#f0e3c3" stroke="#6b5434" stroke-width="1.5"/>
      <path d="M-56,22 q10,-6 20,0 t20,0 t20,0 t20,0 t20,0" stroke="#7fd0ff" stroke-width="3" fill="none"/></g>`;
    const body = (clip) => `<g clip-path="url(#${clip})"><rect x="-90" y="-62" width="180" height="120" rx="26" fill="#fff" stroke="#0b1a33" stroke-width="4"/>
      <path d="M-30,56 L-48,92 L-6,58" fill="#fff" stroke="#0b1a33" stroke-width="4" stroke-linejoin="round"/>${pic}</g>`;
    if (crack <= 0) return `<g filter="url(#ds2)">${body('bubAll')}</g>`;
    const ft = fallT;
    const crackPath = `M0,-64 L-8,-30 L8,-6 L-6,20 L6,60`;
    return `<g filter="url(#ds2)">
      <g transform="translate(${f2(-ft * 60)} ${f2(ft * ft * 420)}) rotate(${f2(-ft * 28)})" opacity="${f2(1 - ft)}">${body('bubL')}</g>
      <g transform="translate(${f2(ft * 60)} ${f2(ft * ft * 460)}) rotate(${f2(ft * 32)})" opacity="${f2(1 - ft)}">${body('bubR')}</g>
      ${ft < 0.05 ? `<path d="${crackPath}" stroke="#0b1a33" stroke-width="4" fill="none" stroke-dasharray="200" stroke-dashoffset="${f2(200 * (1 - crack))}"/>` : ''}</g>`;
  }
  function hourglass(k) { // k = sand drained 0..1
    return `<g filter="url(#ds2)"><rect x="-26" y="-44" width="52" height="8" rx="3" fill="#7a5122"/><rect x="-26" y="36" width="52" height="8" rx="3" fill="#7a5122"/>
      <path d="M-20,-36 L20,-36 L4,0 L20,36 L-20,36 L-4,0 Z" fill="#dff3ff" fill-opacity="0.55" stroke="#fff" stroke-width="3"/>
      <path d="M${f2(-16 * (1 - k))},${f2(-32 + 30 * k)} L${f2(16 * (1 - k))},${f2(-32 + 30 * k)} L0,0 Z" fill="#f2c230"/>
      <path d="M${f2(-16 * k)},${f2(32 - 28 * k)} L${f2(16 * k)},${f2(32 - 28 * k)} L16,32 L-16,32 Z" fill="#f2c230"/>
      <path d="M0,0 L0,32" stroke="#f2c230" stroke-width="2" opacity="${k < 1 ? 1 : 0}"/></g>`;
  }
  function chainArc(n, k, rx, ry) { // links laid along an ellipse, revealed by k
    let s = '';
    const m = Math.floor(n * k);
    for (let i = 0; i < m; i++) {
      const a = Math.PI * 0.95 - (i / (n - 1)) * Math.PI * 1.9;
      const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      const rot = (a * 180) / Math.PI + 90;
      s += `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)})"><rect x="-9" y="-5" width="18" height="10" rx="5" fill="none" stroke="${i % 2 ? '#c5ccd6' : '#8d97a5'}" stroke-width="4"/></g>`;
    }
    return s;
  }
  function padlock(closed) {
    const sh = closed ? 0 : -12;
    return `<g filter="url(#ds2)"><path d="M-14,${-4 + sh} L-14,${-18 + sh} A14,14 0 0 1 14,${-18 + sh} L14,${-4 + sh}" fill="none" stroke="#c5ccd6" stroke-width="7"/>
      <rect x="-22" y="-6" width="44" height="36" rx="6" fill="#8d97a5" stroke="#4a525e" stroke-width="3"/><circle cy="10" r="5" fill="#2b2f36"/><rect x="-2" y="12" width="4" height="10" fill="#2b2f36"/></g>`;
  }
  function memorial(k, r) { // dignified soft marker — white ring + glow, no text
    return `<g opacity="${f2(k)}"><circle r="${f2(r * 2.2)}" fill="#fff" opacity="0.18" filter="url(#glow4)"/>
      <circle r="${f2(r)}" fill="none" stroke="#fff" stroke-width="3"/><circle r="${f2(r * 0.38)}" fill="#fff"/></g>`;
  }
  function gavel(rot) {
    return `<g filter="url(#ds2)"><rect x="-46" y="40" width="92" height="14" rx="4" fill="#4a2a12"/>
      <g transform="rotate(${f2(rot)} 30 -10)"><rect x="-6" y="-60" width="12" height="80" rx="5" fill="#7a4a22" transform="rotate(-50 0 -20)"/>
      <rect x="-40" y="-40" width="56" height="28" rx="7" fill="#5a3214" stroke="#2e1606" stroke-width="3" transform="rotate(-50 -12 -26)"/></g></g>`;
  }
  function caseFile(o = {}) {
    return `<g filter="url(#ds)"><path d="M-150,-100 L-60,-100 L-44,-118 L40,-118 L56,-100 L150,-100 L150,110 L-150,110 Z" fill="#d9b46a" stroke="#8a6a2a" stroke-width="3"/>
      <rect x="-136" y="-84" width="272" height="182" fill="url(#paperG)" stroke="#a88b55" stroke-width="2"/>
      <text x="0" y="-44" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="20" fill="#6a4a20" letter-spacing="3">CASE OF</text>
      <text x="0" y="6" text-anchor="middle" font-family="Anton" font-size="48" fill="#2e1c08" letter-spacing="2">MARY BRYANT</text>
      <path d="M-110,34 L110,34 M-110,56 L60,56 M-110,78 L90,78" stroke="#b39a6a" stroke-width="3"/></g>`;
  }
  function stamp(text, k) { // slam + settle
    const sc = lerp(2.4, 1, E.o5(k)), op = seg(k, 0, 0.25);
    return `<g transform="rotate(-12) scale(${f2(sc)})" opacity="${f2(op)}">
      <rect x="-170" y="-48" width="340" height="96" rx="10" fill="none" stroke="#d3262c" stroke-width="9"/>
      <rect x="-160" y="-38" width="320" height="76" rx="6" fill="none" stroke="#d3262c" stroke-width="3"/>
      <text y="22" text-anchor="middle" font-family="Anton" font-size="66" letter-spacing="6" fill="#d3262c">${esc(text)}</text></g>`;
  }
  function coin(spin) {
    const sx = Math.abs(Math.cos(spin)) * 0.85 + 0.15;
    return `<g transform="scale(${f2(sx)} 1)"><circle r="17" fill="url(#coinG)" stroke="#8a5e00" stroke-width="2.5"/>
      <text y="7" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="20" fill="#8a5e00">£</text></g>`;
  }
  function thumbs(k) {
    return `<g filter="url(#ds)"><circle r="78" fill="#ff2d55"/><circle r="78" fill="none" stroke="#fff" stroke-width="5"/>
      <g transform="scale(${f2(0.9 + 0.1 * k)})" fill="#fff">
      <path d="M-34,-6 L-14,-6 L-14,40 L-34,40 Z"/>
      <path d="M-8,40 L-8,-6 C2,-14 8,-26 8,-40 C8,-48 22,-48 24,-34 C26,-24 22,-14 20,-8 L40,-8 C50,-8 52,0 48,8 C52,12 50,20 44,22 C48,28 44,34 38,34 C40,40 36,44 28,44 L-2,44 Z"/></g></g>`;
  }
  function cloud(x, y, s, op) {
    return `<g transform="translate(${f2(x)} ${f2(y)}) scale(${f2(s)})" opacity="${f2(op)}">
      <g filter="url(#cloud)" fill="#1b2433"><circle cx="-60" cy="10" r="60"/><circle cx="0" cy="-16" r="76"/><circle cx="64" cy="8" r="58"/><circle cx="10" cy="30" r="60"/></g>
      <g fill="#3a4658" opacity="0.85"><circle cx="-50" cy="0" r="44"/><circle cx="4" cy="-22" r="56"/><circle cx="58" cy="0" r="42"/><rect x="-90" y="0" width="190" height="40" rx="20"/></g>
      <g fill="#5d6b80" opacity="0.6"><circle cx="-8" cy="-36" r="34"/><circle cx="-52" cy="-8" r="24"/></g></g>`;
  }
  function bolt(op) {
    return `<path d="M0,-70 L-26,4 L-4,4 L-20,74 L28,-14 L4,-14 L20,-70 Z" fill="#fff6c2" stroke="#ffd23f" stroke-width="3" opacity="${f2(op)}" filter="url(#ds2)"/>`;
  }
  function moon(k) { // HUD moon fading to an empty outline: "moonless"
    return `<g><circle r="30" fill="none" stroke="#c9d6ff" stroke-width="3" stroke-dasharray="6 6" opacity="${f2(0.4 + 0.6 * k)}"/>
      <path d="M8,-28 A30,30 0 1 0 8,28 A22,22 0 1 1 8,-28 Z" fill="#f4f1d0" opacity="${f2(1 - k)}"/></g>`;
  }
  function ration(k) { // grain sack / ration bar draining
    return `<g filter="url(#ds2)">
      <path d="M-30,-30 C-34,-48 -20,-50 -16,-42 C-8,-52 8,-52 16,-42 C20,-50 34,-48 30,-30 C40,-10 40,30 22,38 L-22,38 C-40,30 -40,-10 -30,-30 Z" fill="#c9a46a" stroke="#6b4d22" stroke-width="3"/>
      <path d="M-18,-30 L18,-30" stroke="#6b4d22" stroke-width="3"/>
      <rect x="60" y="-14" width="200" height="28" rx="14" fill="#0b1a33" stroke="#fff" stroke-width="3"/>
      <rect x="66" y="-8" width="${f2(188 * (1 - k))}" height="16" rx="8" fill="${k > 0.6 ? '#e5484d' : '#FFC233'}"/></g>`;
  }
  function hut() {
    return `<g filter="url(#ds2)"><path d="M-26,4 L0,-20 L26,4 Z" fill="#8a5a2b" stroke="#2e1a0a" stroke-width="3"/><rect x="-20" y="4" width="40" height="26" fill="#d8c39a" stroke="#2e1a0a" stroke-width="3"/><rect x="-6" y="14" width="12" height="16" fill="#5a3a1a"/></g>`;
  }
  function tallShip() { // First Fleet transport (side view, small)
    return `<g><path d="M-36,0 L38,0 Q32,14 18,16 L-24,16 Q-34,10 -36,0 Z" fill="url(#hullG)" stroke="#24130a" stroke-width="2.5"/>
      ${[-14, 8, 26].map((x, i) => `<path d="M${x},0 L${x},${-44 + i * 6}" stroke="#2b1a0e" stroke-width="3"/><path d="M${x - 13},${-38 + i * 6} L${x + 13},${-38 + i * 6} L${x + 11},${-18 + i * 4} L${x - 11},${-18 + i * 4} Z" fill="url(#sailG)" stroke="#6b5434" stroke-width="1.2"/>`).join('')}
      </g>`;
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
  function dashedRoute(path, w, t, o = {}) {
    if (!path) return '';
    const off = -t * (o.flow != null ? o.flow : 40);
    return `<g opacity="${f2(o.op != null ? o.op : 1)}">
      <path d="${path}" fill="none" stroke="#020a18" stroke-opacity="0.45" stroke-width="${f2(w + 6)}" stroke-dasharray="${f2(w * 3.2)} ${f2(w * 2.4)}" stroke-dashoffset="${f2(off)}" stroke-linecap="round" transform="translate(0 4)"/>
      <path d="${path}" fill="none" stroke="${o.color || '#ffffff'}" stroke-width="${f2(w)}" stroke-dasharray="${f2(w * 3.2)} ${f2(w * 2.4)}" stroke-dashoffset="${f2(off)}" stroke-linecap="round"/></g>`;
  }
  function arrowHead(x, y, dx, dy, s, color = '#fff', op = 1) {
    const a = (Math.atan2(dy, dx) * 180) / Math.PI;
    return `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(a)}) scale(${f2(s)})" opacity="${f2(op)}" filter="url(#ds2)">
      <path d="M14,0 L-12,-14 L-6,0 L-12,14 Z" fill="${color}" stroke="#0b1a33" stroke-width="2.5" stroke-linejoin="round"/></g>`;
  }
  function coastGlow(rings, op, w = 3) {
    if (op <= 0.01) return '';
    let d = '';
    for (const r of rings) {
      // cull rings fully off-screen (bbox in screen space)
      let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
      for (let i = 0; i < r.length; i += 8) { const [x, y] = P(r[i][0], r[i][1]); minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
      if (maxx < -300 || minx > W + 300 || maxy < -300 || miny > H + 300) continue;
      if (maxx - minx < 6 && maxy - miny < 6) continue;
      d += ringPath(r);
    }
    if (!d) return '';
    return `<g opacity="${f2(op)}" fill="none" stroke-linejoin="round">
      <path d="${d}" stroke="#ffffff" stroke-opacity="0.35" stroke-width="${f2(w * 5)}" filter="url(#glow4)"/>
      <path d="${d}" stroke="#ffffff" stroke-opacity="0.9" stroke-width="${f2(w)}"/></g>`;
  }
  function regionFill(rings, op, color) {
    if (op <= 0.01) return '';
    let d = '';
    for (const r of rings) d += ringPath(r);
    return `<path d="${d}" fill="${color}" fill-opacity="${f2(op)}" stroke="#fff" stroke-opacity="${f2(op * 2.2)}" stroke-width="3.5" stroke-linejoin="round"/>`;
  }

  // ============================================================ TIMELINE
  // Seams (s) from transcript.json — faster-whisper word timings on audio/vo.mp3
  const T = {
    mother: 0.18, toddler: 1.04, baby: 1.92, stolen: 3.16, boat0: 3.46, escaping: 4.44, kmWord: 6.34, sea: 7.32,
    y1791: 8.30, name: 10.0, mary: 10.84, highway: 12.34, england: 13.70, sydney: 15.88,
    colony: 16.80, starving: 17.50, husband: 18.44, william: 18.90, convict: 19.94, decides: 20.90, staying: 21.86,
    so: 22.72, aBoat: 24.16, theySteal: 24.66, governors: 25.46, gBoat: 25.98,
    one: 26.68, moonless: 26.96, slip: 28.10, harbour: 29.00, eleven: 30.02, people: 30.22, openBoat: 31.26,
    sail: 32.34, north: 32.94, coast: 34.70, australia1: 35.16, storms: 36.26, swamp: 37.04,
    squeeze: 38.30, reef: 39.20, round: 41.16, tip: 41.72, outAcross: 43.14, openSea: 43.76,
    d69: 45.12, land: 46.84, timor: 47.98, over: 48.70, km2: 49.00, every: 51.04, alive: 52.14,
    cover: 52.94, survivors: 54.58, dutch: 56.48, believe: 57.10, forAWhile: 57.74,
    then: 59.22, real: 59.54, crew: 60.22, british: 61.52, captain: 62.14, hunting: 62.96, bounty: 64.30,
    falls: 65.62, arrested: 66.94, chains: 68.44, onTheWay: 69.30, babySon: 70.24, husband2: 72.02, daughter: 73.44,
    reaches: 74.62, london: 75.00, alone: 75.38, death: 77.14, but: 79.00, boswell: 80.46, takesUp: 80.92,
    pardoned: 82.70, money: 84.18, life: 85.24, like: 87.36, nerve: 88.02, doWhat: 89.24,
    episode: 90.78, impossible: 91.48, follow: 93.08, nextOne: 93.96, andItAll: 94.84, startedWith: 95.66, end: 96.12,
  };

  const PLACES = {
    sydneyCove: [151.211, -33.856], sydney: [151.21, -33.86], kupang: [123.585, -10.168], timorLabel: [125.2, -9.25],
    pandora: [143.94, -11.38], batavia: [106.8, -6.12], london: [-0.12, 51.5], fowey: [-4.64, 50.34], portsmouth: [-1.1, 50.8],
    reefLabel: [149.6, -17.2], torresLabel: [142.25, -10.05], arafuraLabel: [134.6, -9.1], tipPin: [142.53, -10.69], england: [-1.6, 52.6],
    jetty: [151.272, -33.845],
  };
  const ESCAPE_STOPS = [168, 655, 1103, 1746, 2310, 2624, 3086, 3835, 4819];

  function setupTimeline() {
    makeRoute('escape', GEO.routes.escape, [
      [0, 0], [T.gBoat, 0], [T.gBoat + 0.25, 2.2], [27.8, 2.4], [29.5, 12], [31.9, 26], [32.6, 40],
      [35.72, 1110], [37.8, 1900], [40.88, 2930], [42.66, 3300], [44.54, 4420], [45.8, 4980], [47.1, 5242],
    ], 2);
    makeRoute('preview', GEO.routes.escape, [[0, 0], [1, 1]], 4);
    makeRoute('firstFleet', GEO.routes.firstFleet, [[0, 0], [8.75, 0], [12.2, 13000], [15.9, 27854]], 12);
    makeRoute('pandora', GEO.routes.pandora, [[0, 0], [60.95, 0], [62.5, 700], [64.35, 2328]], 3);
    makeRoute('return', GEO.routes.return, [
      [0, 0], [68.45, 0], [70.45, 2413], [70.95, 2730], [72.55, 12146], [73.3, 14250], [74.95, 23928],
    ], 6);
    const S0 = { t: 0, c: [137.2, -22.8], s: 44 };
    KEYS = [
      S0,
      { t: 1.2, c: [138.6, -24.5], s: 39, e: 'io' },
      { t: 3.05, c: [151.24, -33.86], s: 0.9, e: 'io5' },
      { t: 4.35, c: [151.25, -33.855], s: 0.75, e: 'io' },
      { t: 6.4, c: [137.6, -22.5], s: 42, e: 'io5' },
      { t: 7.85, c: [136.8, -22.0], s: 40, e: 'io' },
      { t: 8.55, c: [-3.0, 49.8], s: 38, e: 'io5' },
      { t: 9.4, c: [-4.5, 47.5], s: 44, e: 'io' },
      { t: 10.3, c: 'firstFleet', s: 54, e: 'io', lead: 0.12 },
      { t: 12.0, c: 'firstFleet', s: 54, e: 'l', lead: 0.12, oy: -0.1 },
      { t: 14.9, c: 'firstFleet', s: 50, e: 'l', lead: 0.12, oy: -0.14 },
      { t: 16.25, c: [151.0, -33.4], s: 14, e: 'io' },
      { t: 18.2, c: [151.1, -33.6], s: 7, e: 'io' },
      { t: 21.0, c: [151.4, -33.2], s: 6.2, e: 'io' },
      { t: 22.4, c: [151.6, -32.9], s: 7.5, e: 'io' },
      { t: 23.4, c: [151.268, -33.848], s: 0.5, e: 'io5' },
      { t: 24.55, c: [151.262, -33.85], s: 0.46, e: 'io' },
      { t: 25.4, c: [151.218, -33.856], s: 0.36, e: 'io' },
      { t: 26.6, c: [151.226, -33.854], s: 0.4, e: 'io' },
      { t: 27.7, c: [151.245, -33.85], s: 0.5, e: 'io' },
      { t: 29.4, c: 'escape', s: 0.9, e: 'io', lead: 0.05 },
      { t: 31.9, c: 'escape', s: 1.3, e: 'io', lead: 0.05 },
      { t: 33.7, c: 'escape', s: 11, e: 'io', lead: 0.12, oy: -0.02 },
      { t: 35.8, c: 'escape', s: 13, e: 'l', lead: 0.12 },
      { t: 37.8, c: 'escape', s: 10.5, e: 'l', lead: 0.12 },
      { t: 39.4, c: 'escape', s: 8.5, e: 'io', lead: 0.12, ox: 0.06 },
      { t: 40.9, c: 'escape', s: 6.5, e: 'io', lead: 0.12 },
      { t: 41.9, c: 'escape', s: 3.6, e: 'io', lead: 0.06 },
      { t: 42.8, c: 'escape', s: 5, e: 'io', lead: 0.12 },
      { t: 44.5, c: 'escape', s: 19, e: 'io', lead: 0.18 },
      { t: 46.2, c: [124.6, -10.0], s: 7.5, e: 'io' },
      { t: 47.9, c: [124.4, -10.0], s: 6.5, e: 'io' },
      { t: 50.0, c: [137.4, -22.3], s: 42, e: 'io5' },
      { t: 52.4, c: [136.6, -21.6], s: 39, e: 'io' },
      { t: 53.7, c: [123.72, -10.12], s: 2.1, e: 'io5' },
      { t: 58.9, c: [123.7, -10.13], s: 1.75, e: 'io' },
      { t: 59.5, c: [123.7, -10.13], s: 1.6, e: 'io' },
      { t: 60.5, c: [143.7, -11.2], s: 4.2, e: 'io5' },
      { t: 61.4, c: [143.3, -11.0], s: 5.5, e: 'io' },
      { t: 62.6, c: 'pandora', s: 16, e: 'io', lead: 0.1 },
      { t: 63.7, c: 'pandora', s: 14, e: 'io', lead: 0.06 },
      { t: 64.9, c: [123.72, -10.12], s: 2.1, e: 'io' },
      { t: 68.4, c: [123.65, -10.12], s: 1.8, e: 'io' },
      { t: 69.6, c: 'return', s: 28, e: 'io5', lead: 0.06 },
      { t: 70.7, c: [108.0, -6.5], s: 30, e: 'io' },
      { t: 72.2, c: [82.0, -14.0], s: 78, e: 'io' },
      { t: 73.45, c: [22.0, -12.0], s: 80, e: 'io' },
      { t: 74.95, c: [-1.6, 51.2], s: 11, e: 'io5' },
      { t: 78.5, c: [-1.2, 51.35], s: 9.5, e: 'io' },
      { t: 80.6, c: [-2.0, 51.1], s: 10.5, e: 'io' },
      { t: 85.6, c: [-2.6, 51.0], s: 9.5, e: 'io' },
      { t: 89.9, c: [-2.0, 49.0], s: 30, e: 'io' },
      { t: 91.3, c: [114.0, 4.0], s: 108, e: 'io5' },
      { t: 94.75, c: [116.0, 2.0], s: 100, e: 'io' },
      { t: 95.95, c: [137.2, -22.8], s: 44, e: 'io5' },
      { t: 97.0, c: [137.2, -22.8], s: 44, e: 'io' },
    ];
  }

  // Shared state for the escape boat: where is it, which way does it face
  function escapeBoatPos(t) {
    if (t < T.gBoat) return { lon: PLACES.sydneyCove[0], lat: PLACES.sydneyCove[1], dx: 1, dy: 0 };
    const h = head('escape', t);
    return h;
  }

  // ================================================================ FRAME
  let READY = false;
  window.renderFrame = function (t) {
    if (!READY) return;
    CAM = camAt(t);
    // record-scratch jolt + storm shake
    const sh1 = camShake(t, T.real - 0.05, T.real + 0.45, 14), sh2 = camShake(t, 36.2, 37.8, 4);
    const shx = sh1[0] + sh2[0], shy = sh1[1] + sh2[1];
    CAM.u -= shx / CAM.S; CAM.v -= shy / CAM.S;
    placeLayers();

    // whip motion blur from camera velocity
    const c2 = camAt(t + 1 / 30);
    const vx = (c2.u - CAM.u) * CAM.S, vy = (c2.v - CAM.v) * CAM.S, vz = Math.abs(Math.log(c2.span / CAM.span)) * 900;
    const bx = clamp(Math.abs(vx) * 0.12 + vz * 0.05, 0, 6), by = clamp(Math.abs(vy) * 0.12 + vz * 0.05, 0, 6);
    const blurOn = bx > 1.5 || by > 1.5;
    document.getElementById('blurG').setAttribute('filter', blurOn ? 'url(#mblur)' : '');
    if (blurOn) blurF.setAttribute('stdDeviation', `${f2(bx)} ${f2(by)}`);

    // grade: desaturate on chains, warm return on Boswell
    const desat = lerp(1, 0.1, E.io(seg(t, 67.3, 68.9))) + (1 - 0.1) * E.io(seg(t, T.but, 80.7)) * (t > 67 ? 1 : 0);
    const sat = t < 67 ? 1 : clamp(desat, 0.16, 1.08);
    mapG.setAttribute('filter', Math.abs(sat - 1) > 0.01 ? 'url(#desat)' : '');
    desatM.setAttribute('values', f2(sat));

    routeG.innerHTML = drawMapLayer(t);
    gradeG.innerHTML = drawGrade(t);
    ovG.innerHTML = drawOverlay(t);
    capG.innerHTML = drawCaptions(t);
  };

  // ---------------------------------------------------- map-space vectors
  function drawMapLayer(t) {
    let s = '';
    const span = CAM.span;
    // Australia coast glow — the stage for most of the film
    const ausOp = fade(t, -1, 66.9, 0.4) * (t > 7.9 && t < 15.6 ? 0.25 : 1) + fade(t, 89.9, 99, 0.5) * 0.9;
    s += coastGlow(span > 18 ? GEO.coast.australiaLo : GEO.coast.australia, clamp(ausOp, 0, 1) * (span < 1.5 ? 0 : 1) * 0.9, span > 30 ? 2.2 : 3);
    // GB glow (1791 + London beats)
    s += coastGlow(GEO.coast.greatBritain, fade(t, 8.2, 10.6, 0.4) + fade(t, 74.3, 90.4, 0.5) * 0.85, 2.6);
    // Timor activation on landing / Kupang beats
    const timorOp = fade(t, T.land - 0.2, 69.0, 0.4);
    if (timorOp > 0) s += regionFill(GEO.coast.timor, 0.16 * timorOp, '#FFC233');
    // Great Barrier Reef — shimmer during the squeeze, and under the Pandora wreck
    const reefOp = fade(t, 37.7, 44.2, 0.5) + fade(t, 59.6, 62.8, 0.4) * 0.8;
    if (reefOp > 0.01) {
      let d = '';
      for (const ln of GEO.reefs) {
        let p = '', lx = 1e9, ly = 1e9;
        for (const q of ln) { const [x, y] = P(q[0], q[1]); if (Math.abs(x - lx) + Math.abs(y - ly) < 1.5) continue; p += (p ? 'L' : 'M') + f2(x) + ' ' + f2(y); lx = x; ly = y; }
        d += p;
      }
      const sh = 0.75 + 0.25 * Math.sin(t * 6);
      s += `<g opacity="${f2(reefOp)}" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="${d}" stroke="#5ff2ff" stroke-opacity="${f2(0.35 * sh)}" stroke-width="16" filter="url(#glow4)"/>
        <path d="${d}" stroke="#bafcff" stroke-width="3.2"/></g>`;
    }

    // ---- dashed preview of the escape (hook + loop) ----
    const pv = R.preview;
    const preOp = (1 - seg(t, 7.6, 8.1)) * (t < 8.1 ? 1 : 0) + seg(t, 95.0, 95.6);
    if (preOp > 0.01) {
      const w = clamp(5.5 * (40 / span) ** 0.25, 4, 9);
      s += dashedRoute(routePath(pv, 0, pv.total), w, t, { op: preOp });
      const e = atKm(pv, pv.total); const [ex, ey] = PU(e.u, e.v);
      s += arrowHead(ex, ey, e.dx, e.dy, 1.4, '#fff', preOp);
    }
    // ---- First Fleet (soft white dashed arc England→Sydney) ----
    if (t > 8.6 && t < 22) {
      const ff = R.firstFleet, k = ff.prog(t);
      const op = 1 - seg(t, 17.5, 18.5);
      s += dashedRoute(routePath(ff, 0, k), 5, t, { op: op * 0.95, flow: 30 });
    }
    // ---- escape route (thick yellow/orange, self-drawing) ----
    const esc_ = R.escape;
    const ek = esc_.prog(t);
    if (t > 27.5 && ek > 0.5) {
      const w = clamp(7.5 * (10 / span) ** 0.22, 6, 13);
      const red = E.io(seg(t, 90.6, 91.6)) * (1 - seg(t, 95.0, 95.6));
      const vis = 1 - seg(t, 95.0, 95.5) * 1;
      const col = red > 0 ? mixHex('#FFC21A', '#ff2b3a', red) : '#FFC21A';
      const dark = red > 0 ? mixHex('#a54d00', '#7a0010', red) : '#a54d00';
      s += solidRoute(routePath(esc_, 0, ek), w, { color: col, dark, glow: 0.25 + 0.45 * red + (t > 47 && t < 52 ? 0.25 : 0), op: vis });
      // pin-drops at stops
      ESCAPE_STOPS.forEach((km, i) => {
        if (ek < km || t > 67) return;
        const p = atKm(esc_, km); const [x, y] = PU(p.u, p.v);
        if (!onScreen(x, y)) return;
        const tt = esc_t_at_km(km);
        s += smallPin(x, y, t, tt, 0.5 + (span < 8 ? 0.15 : 0));
      });
    }
    // ---- Pandora lifeboats' dotted path ----
    if (t > 60.9 && t < 69) {
      const pr = R.pandora, k = pr.prog(t);
      const op = 1 - seg(t, 66.4, 67.2);
      s += dashedRoute(routePath(pr, 0, k), 4.5, t, { op: op * 0.9, color: '#dfe9ff', flow: 26 });
    }
    // ---- grey return route (in chains) ----
    if (t > 68.4) {
      const rr = R.return, k = rr.prog(t);
      const op = 1 - seg(t, 89.5, 90.6);
      const w = clamp(6 * (30 / span) ** 0.2, 4.5, 9);
      s += solidRoute(routePath(rr, 0, k), w, { color: '#b9c1cc', dark: '#4b525c', hi: '#ffffff', op });
    }
    return s;
  }
  // when does the escape head pass km (inverse of prog) — sampled once
  const _kmT = {};
  function esc_t_at_km(km) {
    if (_kmT[km] != null) return _kmT[km];
    let lo = 27, hi = 47.2;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (R.escape.prog(m) < km) lo = m; else hi = m; }
    return (_kmT[km] = hi);
  }
  function mixHex(a, b, k) {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], k)).toString(16).padStart(2, '0')).join('');
  }

  // ------------------------------------------------------------ grade
  function drawGrade(t) {
    let s = '';
    // colony darkens (starving)
    const dark = fade(t, 17.2, 22.6, 0.6) * 0.32;
    // moonless night
    const night = fade(t, 26.7, 32.9, 0.7);
    // London / death-sentence sobriety
    const sober = fade(t, 75.6, 79.6, 0.6) * 0.28;
    // deaths beat
    const grief = fade(t, 69.2, 74.4, 0.5) * 0.06;
    const k = Math.max(dark, sober, grief);
    if (k > 0.001) s += `<rect width="${W}" height="${H}" fill="#020611" opacity="${f2(k)}"/>`;
    if (night > 0.001) {
      s += `<rect width="${W}" height="${H}" fill="#06123a" opacity="${f2(night * 0.58)}" style="mix-blend-mode:multiply"/>`;
      s += `<rect width="${W}" height="${H}" fill="#0a1d5c" opacity="${f2(night * 0.22)}"/>`;
    }
    // storm darkening + lightning
    const storm = fade(t, 36.0, 37.9, 0.35);
    if (storm > 0) {
      s += `<rect width="${W}" height="${H}" fill="#0b1220" opacity="${f2(storm * 0.38)}"/>`;
      const fl = Math.max(flash(t, 36.38), flash(t, 37.12) * 0.7);
      if (fl > 0) s += `<rect width="${W}" height="${H}" fill="#e8f0ff" opacity="${f2(fl * 0.55)}"/>`;
    }
    // warm Boswell grade
    const warm = fade(t, T.but, 90.6, 0.9) * 0.22;
    if (warm > 0) s += `<rect width="${W}" height="${H}" fill="#ffb347" opacity="${f2(warm)}" style="mix-blend-mode:soft-light"/>`;
    // record-scratch flash
    const rs = flash(t, T.real - 0.02) * 0.5;
    if (rs > 0) s += `<rect width="${W}" height="${H}" fill="#ffffff" opacity="${f2(rs)}"/>`;
    s += `<rect width="${W}" height="${H}" fill="url(#vig)" opacity="${f2(0.75 + 0.25 * Math.max(night, storm, sober * 3))}"/>`;
    return s;
  }
  function flash(t, a) { const x = t - a; return x < 0 || x > 0.35 ? 0 : Math.exp(-x * 14) * (x < 0.03 ? x / 0.03 : 1); }

  // ------------------------------------------------------------ overlays
  function drawOverlay(t) {
    let s = '';
    s += beatHook(t);
    s += beatFirstFleet(t);
    s += beatColony(t);
    s += beatGovernor(t);
    s += beatNight(t);
    s += beatVoyage(t);
    s += beatTimor(t);
    s += beatCover(t);
    s += beatPandora(t);
    s += beatChains(t);
    s += beatReturn(t);
    s += beatLondon(t);
    s += beatBoswell(t);
    s += beatCTA(t);
    s += beatSeries(t);
    s += beatLoop(t);
    return s;
  }

  // 0–8.3 — frame-1 hook `5,000 KM`, family, stolen boat, preview counter
  function beatHook(t) {
    if (t > 8.4) return '';
    let s = '';
    const [sx, sy] = P(...PLACES.sydneyCove);
    // hook slam: lands on frame 1 already at full size (loop continuity), settles, docks away
    const hk = 1 - E.io(seg(t, 1.05, 1.55));
    if (hk > 0) {
      const settle = 1 + 0.06 * Math.exp(-t * 9) * Math.cos(t * 30);
      s += label3d('5,000 KM', 540, lerp(960, 780, 1 - hk), 250, { fill: '#FFD23F', side: '#7a3b00', edge: '#3a1a00', scale: settle * lerp(0.55, 1, hk), op: hk, depth: 12, ls: 6 });
    }
    // Sydney & Timor end pins on the preview
    if (t < 1.6 || (t > 4.3 && t < 8.2)) {
      const op = t < 1.6 ? 1 - seg(t, 1.3, 1.6) : seg(t, 4.3, 4.6) * (1 - seg(t, 7.8, 8.2));
      const [kx, ky] = P(...PLACES.kupang);
      s += `<g opacity="${f2(op)}">${pin(sx, sy, t, -1, { size: 0.8 })}${pin(kx, ky, t, -1, { size: 0.8 })}
        ${placeLabel('SYDNEY', sx - 20, sy + 62, t, -1, { size: 38 })}${placeLabel('TIMOR', kx, ky - 92, t, -1, { size: 38 })}</g>`;
    }
    // family row → hops into the boat on "stolen boat"
    if (t < 4.6) {
      const icons = [[ICON_MOTHER, T.mother], [ICON_TODDLER, T.toddler], [ICON_BABY, T.baby]];
      const hop = E.io(seg(t, T.stolen + 0.05, T.stolen + 0.6));
      const [bx, by] = P(...PLACES.sydneyCove);
      icons.forEach(([ic, t0], i) => {
        if (t < t0) return;
        const k = pop(t, t0, 0.4);
        const x0 = 540 + (i - 1) * 190, y0 = 300;
        const x = lerp(x0, bx + 20 + (i - 1) * 26, hop), y = lerp(y0, by - 30, hop) - Math.sin(hop * Math.PI) * 160;
        const sc = lerp(1, 0.28, hop) * (0.4 + 0.6 * k);
        s += `<g transform="translate(${f2(x)} ${f2(y)}) scale(${f2(sc)})" opacity="${f2(1 - seg(hop, 0.85, 1))}" filter="url(#ds)">
          <circle r="74" fill="url(#chipG)" stroke="#FFC233" stroke-width="5"/><g transform="scale(1.6)">${ic}</g></g>`;
      });
    }
    // the boat appears at the cove with a yank-wobble on "stolen boat"
    if (t > T.stolen - 0.1 && t < 4.6) {
      const k = pop(t, T.stolen - 0.1, 0.4);
      const wob = Math.sin((t - T.stolen) * 18) * 10 * Math.exp(-(t - T.stolen) * 4);
      const sc = (0.75 + 0.25 * k) * clamp(0.9 / CAM.span, 0.6, 1.25);
      s += `<g transform="translate(${f2(sx + 28)} ${f2(sy - 6)}) rotate(${f2(wob)}) scale(${f2(sc)})" filter="url(#ds)">${boat({ heads: 3 })}</g>`;
    }
    // 4.4–7.7 "Escaping across 5,000 kilometres": comet + counter along the dashed preview
    if (t > T.escaping - 0.1 && t < 8.2) {
      const pv = R.preview, p = E.io(seg(t, 5.0, T.kmWord + 0.25));
      const h = atKm(pv, p * pv.total); const [hx, hy] = PU(h.u, h.v);
      const op = seg(t, 4.9, 5.2) * (1 - seg(t, 7.8, 8.2));
      s += `<g opacity="${f2(op)}"><circle cx="${f2(hx)}" cy="${f2(hy)}" r="26" fill="#FFD23F" opacity="0.45" filter="url(#glow4)"/><circle cx="${f2(hx)}" cy="${f2(hy)}" r="10" fill="#fff"/></g>`;
      const km = Math.round((p * 5000) / 10) * 10;
      const fin = seg(t, T.kmWord, T.kmWord + 0.3);
      s += label3d(`${km.toLocaleString('en-AU')} KM`, 540, 960, 150 + 30 * E.back(fin) * (1 - seg(t, 7.0, 7.6)), { fill: '#FFD23F', side: '#7a3b00', edge: '#3a1a00', op, depth: 8, ls: 4 });
    }
    return s;
  }

  // 8.3–16.3 — 1791, Mary Bryant, First Fleet arc England → Sydney
  function beatFirstFleet(t) {
    if (t < 8.1 || t > 18.6) return '';
    let s = '';
    const yk = pop(t, T.y1791 - 0.05, 0.4), yop = seg(t, 8.25, 8.4) * (1 - seg(t, 10.4, 10.8));
    if (yop > 0) s += label3d('1791', 540, lerp(520, 420, seg(t, 8.3, 10.6)), 260, { fill: '#ffffff', side: '#0b1a33', scale: 0.7 + 0.3 * yk, op: yop, depth: 12, ls: 8 });
    const [ex, ey] = P(...PLACES.england);
    s += placeLabel('ENGLAND', ex + 40, ey + 150, t, 8.55, { size: 50, until: 10.9 });
    // tall ship riding the head
    if (t > 8.75 && t < 16.1) {
      const h = head('firstFleet', t); const [hx, hy] = PU(h.u, h.v);
      const flip = h.dx < 0 ? -1 : 1;
      s += `<g transform="translate(${f2(hx)} ${f2(hy - 10)}) scale(${f2(flip * 1.25)} 1.25)" filter="url(#ds2)">${tallShip()}</g>`;
    }
    // name chips (HUD) — Mary Bryant · highway robber
    const nOp = seg(t, T.mary - 0.1, T.mary + 0.1) * (1 - seg(t, 16.0, 16.4));
    if (nOp > 0) {
      s += chip('MARY BRYANT', 540, 250, { size: 46, scale: 0.7 + 0.3 * pop(t, T.mary - 0.1), op: nOp, icon: ICON_MOTHER, accent: '#FFC233' });
      const hOp = seg(t, T.highway, T.highway + 0.15) * nOp;
      if (hOp > 0) s += chip('HIGHWAY ROBBER', 540, 350, { size: 30, scale: 0.7 + 0.3 * pop(t, T.highway), op: hOp, accent: '#ffffff' });
    }
    // Sydney arrival pin
    const [sx, sy] = P(...PLACES.sydney);
    if (t > T.sydney - 0.3) {
      s += pin(sx, sy, t, T.sydney - 0.25, { size: 1.1, inner: '' });
      s += placeLabel('SYDNEY', sx - 40, sy + 70, t, T.sydney - 0.1, { size: 52, until: 22.6 });
    }
    return s;
  }

  // 16.3–22.6 — colony starving; William; not staying
  function beatColony(t) {
    if (t < 16.2 || t > 23.2) return '';
    let s = '';
    const [sx, sy] = P(...PLACES.sydney);
    const op = seg(t, 16.3, 16.6) * (1 - seg(t, 22.7, 23.1));
    s += `<g opacity="${f2(op)}">`;
    s += pin(sx, sy, t, 15.65, { size: 1.1 });
    s += `<g transform="translate(${f2(sx - 110)} ${f2(sy - 70)}) scale(1.6)">${hut()}</g>`;
    // ration sack + bar draining on "starving"
    const rk = E.io(seg(t, T.starving - 0.2, T.starving + 0.8));
    const rOp = seg(t, 16.8, 17.1) * (1 - seg(t, 18.3, 18.7));
    if (rOp > 0) s += `<g transform="translate(330 300) scale(1.7)" opacity="${f2(rOp)}">${ration(rk)}</g>`;
    // Mary + William chips with link ring
    const wOp = seg(t, T.husband - 0.1, T.husband + 0.1);
    if (wOp > 0) {
      const k = pop(t, T.husband - 0.1);
      s += chip('MARY BRYANT', 540, 250, { size: 40, op: wOp, scale: 0.85 + 0.15 * k, icon: ICON_MOTHER });
      s += chip('WILLIAM BRYANT', 540, 358, { size: 40, op: seg(t, T.william - 0.15, T.william), scale: 0.7 + 0.3 * pop(t, T.william - 0.15), icon: ICON_PERSON });
      s += `<g transform="translate(540 304) scale(${f2(0.9 * pop(t, T.william))})" opacity="${f2(seg(t, T.william, T.william + 0.1))}">${ICON_LINK}</g>`;
      const cOp = seg(t, T.convict - 0.05, T.convict + 0.1);
      if (cOp > 0) s += chip('CONVICTS', 540, 450, { size: 26, op: cOp, scale: 0.7 + 0.3 * pop(t, T.convict - 0.05), accent: '#ffffff' });
    }
    // "decides they're not staying": white dashed intent arrow up the coast
    if (t > T.decides - 0.1) {
      const k = E.io(seg(t, T.decides, T.staying + 0.3));
      const pts = [[151.33, -33.83], [151.8, -33.1], [152.4, -32.7], [152.9, -31.9], [153.25, -30.9]];
      let d = '';
      const n = 40;
      for (let i = 0; i <= n * k; i++) {
        const q = i / n * (pts.length - 1), a = Math.floor(q), f = q - a, b = Math.min(a + 1, pts.length - 1);
        const [x, y] = P(lerp(pts[a][0], pts[b][0], f), lerp(pts[a][1], pts[b][1], f));
        d += (i ? 'L' : 'M') + f2(x) + ' ' + f2(y);
      }
      if (d) s += dashedRoute(d, 6, t, {});
      const q = k * (pts.length - 1), a = Math.min(Math.floor(q), pts.length - 2), f = q - a;
      const [x, y] = P(lerp(pts[a][0], pts[a + 1][0], f), lerp(pts[a][1], pts[a + 1][1], f));
      const [x2, y2] = P(pts[a + 1][0], pts[a + 1][1]);
      if (k > 0.02) s += arrowHead(x, y, x2 - x, y2 - y, 1.5);
    }
    s += '</g>';
    return s;
  }

  // 22.6–26.7 — Gag 1: not just a boat — the GOVERNOR'S boat, yanked off the harbour pin
  function beatGovernor(t) {
    if (t < 22.5 || t > 27.2) return '';
    let s = '';
    const sc = clamp(0.5 / CAM.span, 0.8, 1.6);
    // a plain rowboat at a jetty: "they don't just steal a boat"
    const [jx, jy] = P(...PLACES.jetty);
    const rOp = seg(t, 22.7, 23.0) * (1 - seg(t, T.theySteal - 0.1, T.theySteal + 0.15));
    if (rOp > 0) {
      const bob = Math.sin(t * 3) * 3;
      s += `<g opacity="${f2(rOp)}" transform="translate(${f2(jx)} ${f2(jy + bob)}) scale(${f2(sc * 2.6)})" filter="url(#ds2)">${lifeboat(t * 2)}</g>`;
      const xk = seg(t, T.aBoat - 0.1, T.aBoat + 0.15);
      if (xk > 0) s += `<g opacity="${f2(rOp)}" transform="translate(${f2(jx)} ${f2(jy - 6)})"><path d="M-70,-70 L70,70 M70,-70 L-70,70" stroke="#ff3b3b" stroke-width="14" stroke-linecap="round" stroke-dasharray="200" stroke-dashoffset="${f2(200 * (1 - xk))}" filter="url(#ds2)"/></g>`;
    }
    // harbour pin + governor's cutter with crown + plaque
    const [px, py] = P(...PLACES.sydneyCove);
    const gOp = seg(t, T.theySteal - 0.15, T.theySteal + 0.1);
    if (gOp <= 0) return s;
    const yank = t > T.gBoat ? E.o5(seg(t, T.gBoat, T.gBoat + 0.22)) : 0;
    const pre = t > T.gBoat - 0.35 && t < T.gBoat ? Math.sin((t - T.gBoat + 0.35) * 40) * 3 : 0;
    const h = head('escape', Math.max(t, T.gBoat));
    const [hx, hy] = PU(h.u, h.v);
    const bx = lerp(px + 40 * sc, hx + 6, yank), by = lerp(py - 4, hy - 4, yank);
    s += `<g opacity="${f2(gOp)}">`;
    s += pin(px, py, t, T.theySteal - 0.15, { size: 1.15 });
    // rope from pin to boat — snaps on the yank
    if (t > T.governors - 0.15) s += `<path d="M${f2(px - 120)},${f2(py - 250)} L${f2(px)},${f2(py - 60)}" stroke="#d9c08a" stroke-width="3" opacity="${f2(1 - yank)}"/>`;
    if (yank < 0.08) s += `<path d="M${f2(px)},${f2(py - 40)} Q${f2((px + bx) / 2)},${f2(py - 10)} ${f2(bx - 50 * sc)},${f2(by + 2)}" stroke="#d9c08a" stroke-width="4" fill="none"/>`;
    else s += `<path d="M${f2(px)},${f2(py - 40)} q${f2(10 - 20 * yank)},${f2(20 + 20 * yank)} ${f2(-6)},${f2(40)}" stroke="#d9c08a" stroke-width="4" fill="none"/>`;
    // plaque on the pin — swings after the yank
    const sw = t > T.gBoat ? Math.sin((t - T.gBoat) * 9) * 28 * Math.exp(-(t - T.gBoat) * 1.6) : 0;
    const pk = pop(t, T.governors - 0.15, 0.45);
    if (t > T.governors - 0.15) {
      s += `<g transform="translate(${f2(px - 120)} ${f2(py - 250)}) rotate(${f2(sw)}) scale(${f2(pk * 1.15)})" filter="url(#ds2)">
        <path d="M0,0 L-70,60 M0,0 L70,60" stroke="#d9c08a" stroke-width="3"/>
        <rect x="-150" y="58" width="300" height="70" rx="8" fill="url(#paperG)" stroke="#7a5200" stroke-width="4"/>
        <g transform="translate(-122 92) scale(0.9)"><path d="M-14,8 L-16,-8 L-7,0 L0,-12 L7,0 L16,-8 L14,8 Z" fill="url(#goldG)" stroke="#7a5200" stroke-width="2"/></g>
        <text x="16" y="88" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="23" fill="#3a2410" letter-spacing="1">GOVERNOR –</text>
        <text x="16" y="116" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="23" fill="#c3261a" letter-spacing="1">DO NOT TOUCH</text></g>`;
    }
    // the boat
    const flip = 1;
    const wob = pre + (t > T.gBoat ? Math.sin((t - T.gBoat) * 16) * 12 * Math.exp(-(t - T.gBoat) * 3.5) : Math.sin(t * 2.2) * 2);
    s += `<g transform="translate(${f2(bx)} ${f2(by)}) rotate(${f2(wob)}) scale(${f2(flip * sc * 1.05)} ${f2(sc * 1.05)})" filter="url(#ds)">
      ${yank > 0 && yank < 1 ? `<g opacity="${f2(1 - yank)}">${wake(t, 1, 1)}</g>` : ''}${boat({ heads: 0, crown: pop(t, T.governors - 0.1, 0.45) })}</g>`;
    if (t > T.gBoat && t < T.gBoat + 0.4) {
      const k = seg(t, T.gBoat, T.gBoat + 0.4);
      s += `<g transform="translate(${f2(px + 30)} ${f2(py - 20)})" opacity="${f2(1 - k)}">${[0, 1, 2, 3, 4].map((i) => `<path d="M${f2(-30 - i * 12)},${f2(-20 + i * 10)} l${f2(-50 * k - 20)},0" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`).join('')}</g>`;
    }
    s += '</g>';
    return s;
  }

  // 26.7–32.4 — moonless night slip-out; Gag 2: 11 → 12? + series camel stowaway
  function beatNight(t) {
    if (t < 26.4 || t > 33.2) return '';
    let s = '';
    // HUD moon disappearing on "moonless"
    const mOp = fade(t, 26.7, 32.6, 0.3);
    s += `<g transform="translate(540 270) scale(${f2(1.6 * pop(t, 26.7))})" opacity="${f2(mOp)}">${moon(E.io(seg(t, T.moonless, T.moonless + 0.6)))}</g>`;
    const nightK = fade(t, 26.7, 32.9, 0.7);
    if (nightK > 0.02 && R.escape.prog(t) > 1) {
      const w = clamp(7.5 * (10 / CAM.span) ** 0.22, 6, 13);
      s += solidRoute(routePath(R.escape, 0, R.escape.prog(t)), w, { glow: 0.5, op: nightK * 0.85 });
    }
    // stars twinkle above (top of frame is open sea at night)
    const night = fade(t, 26.7, 32.9, 0.7);
    for (let i = 0; i < 26; i++) {
      const x = hash(i * 3.1) * W, y = 120 + hash(i * 7.7) * 700, tw = 0.5 + 0.5 * Math.sin(t * (2 + hash(i) * 3) + i);
      s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(1.2 + hash(i * 2.3) * 1.8)}" fill="#fff" opacity="${f2(night * tw * 0.7)}"/>`;
    }
    return s;
  }

  // the escape boat (27–47.2) + Gag 2 + Gag 3 (coast race / storm / reef squeeze / day counter)
  function beatVoyage(t) {
    if (t < 26.6 || t > 53.0) return '';
    let s = '';
    const h = escapeBoatPos(t);
    const [bx, by] = P(h.lon, h.lat);
    const span = CAM.span;
    const flip = h.dx < -0.25 ? -1 : 1;
    const speed = clamp((R.escape.prog(t + 0.1) - R.escape.prog(t)) * 10 / (span * 111) * 0.35, 0, 1); // screen speed
    const sc = clamp(1.25 * Math.pow(1.2 / span, 0.12), 0.85, 1.35);
    // storm bob / squeeze squash
    const storm = fade(t, 36.1, 37.9, 0.25);
    const tilt = storm * (Math.sin(t * 9) * 14 + Math.sin(t * 5.3) * 6) + Math.sin(t * 2.4) * 2.5;
    const sq = Math.sin(seg(t, T.squeeze - 0.05, T.squeeze + 0.55) * Math.PI);
    const sx = 1 - 0.22 * sq, sy = 1 + 0.14 * sq;
    const fadeOut = 1 - seg(t, 52.5, 52.95);
    if (t >= T.gBoat + 0.25 && t < 52.95) {
      const showHeads = t > 29.9 ? 11 : 0;
      s += `<g transform="translate(${f2(bx)} ${f2(by - 6)}) rotate(${f2(tilt)}) scale(${f2(flip * sc * sx)} ${f2(sc * sy)})" filter="url(#ds)" opacity="${f2(fadeOut)}">
        ${wake(t, clamp(speed * 3 + (t > 32.5 && t < 47 ? 0.5 : 0), 0, 1), 1)}
        ${boat({ heads: showHeads, camel: t > 30.4 && t < 31.8 ? E.back(seg(t, 30.45, 30.75)) * (1 - E.i(seg(t, 31.4, 31.75))) : 0, blink: Math.sin(t * 8) > 0.92 })}</g>`;
    }
    // head-count chip: 11 → 12? flicker (Gag 2)
    if (t > T.eleven - 0.05 && t < 32.7) {
      const k = pop(t, T.eleven - 0.05);
      const twelve = t > 30.55 && t < 31.45 && (Math.floor(t * 9) % 3 !== 0);
      const op = 1 - seg(t, 32.3, 32.7);
      s += `<g opacity="${f2(op)}">${chip(twelve ? '12?' : '11', bx - 10, by - 230, { size: 72, scale: 0.6 + 0.4 * k, icon: ICON_PERSON, accent: twelve ? '#ff5a5a' : '#FFC233', color: twelve ? '#ff8a8a' : '#fff' })}</g>`;
    }
    // speed lines across the frame during the coast race
    const race = fade(t, 32.6, 47.0, 0.4) * (0.35 + 0.65 * fade(t, 42.7, 44.9, 0.3));
    if (race > 0.02) {
      let ls = '';
      for (let i = 0; i < 9; i++) {
        const ph = (t * 1.8 + hash(i * 5.3)) % 1;
        const ang = Math.atan2(-h.dy, -h.dx);
        const r0 = 90 + ph * 260, len = 60 + 120 * hash(i);
        const off = (hash(i * 9.1) - 0.5) * 140;
        const cx = bx + Math.cos(ang) * r0 - Math.sin(ang) * off, cy = by + Math.sin(ang) * r0 + Math.cos(ang) * off;
        ls += `<path d="M${f2(cx)},${f2(cy)} l${f2(Math.cos(ang) * len)},${f2(Math.sin(ang) * len)}" stroke="#fff" stroke-width="${f2(3.5 * (1 - ph))}" stroke-linecap="round" opacity="${f2((1 - ph) * race * 0.8)}"/>`;
      }
      s += ls;
    }
    // storm clouds + rain + bolts
    if (storm > 0) {
      const dr = (t - 36) * 40;
      s += cloud(bx - 160 + dr, by - 230, 1.3, storm * 0.95) + cloud(bx + 170 - dr * 0.6, by - 260, 1.1, storm * 0.9) + cloud(bx + 30, by - 330, 0.9, storm * 0.8);
      let rain = '';
      for (let i = 0; i < 46; i++) {
        const ph = (t * 2.4 + hash(i * 1.7)) % 1;
        const x = bx - 330 + hash(i * 4.4) * 660 - ph * 60, y = by - 260 + ph * 420;
        rain += `<path d="M${f2(x)},${f2(y)} l-14,40" stroke="#cfe3ff" stroke-width="2.4" opacity="${f2(storm * 0.55)}"/>`;
      }
      s += rain;
      const b1 = flash(t, 36.38), b2 = flash(t, 37.12);
      if (b1 > 0) s += `<g transform="translate(${f2(bx + 120)} ${f2(by - 170)}) scale(1.3)">${bolt(b1 * 1.6)}</g>`;
      if (b2 > 0) s += `<g transform="translate(${f2(bx - 140)} ${f2(by - 160)}) scale(1.1) rotate(10)">${bolt(b2 * 1.6)}</g>`;
    }
    // squeeze brackets: coast ⟷ reef
    const sqOp = fade(t, T.squeeze - 0.2, 40.9, 0.25);
    if (sqOp > 0) {
      const g = 120 - 40 * E.io(seg(t, T.squeeze - 0.2, T.squeeze + 0.4));
      const ang = Math.atan2(h.dy, h.dx) * 180 / Math.PI;
      s += `<g transform="translate(${f2(bx)} ${f2(by - 10)}) rotate(${f2(ang + 90)})" opacity="${f2(sqOp)}" filter="url(#ds2)">
        <path d="M${f2(-g - 26)},-40 L${f2(-g)},0 L${f2(-g - 26)},40" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M${f2(g + 26)},-40 L${f2(g)},0 L${f2(g + 26)},40" stroke="#5ff2ff" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    }
    // place labels on the run
    const [rx, ry] = P(...PLACES.reefLabel);
    s += placeLabel('GREAT BARRIER REEF', clamp(rx, 330, 750), ry, t, T.reef - 0.1, { size: 44, until: 41.3, fill: '#d9fdff', rot: -8 });
    const [tx, ty] = P(...PLACES.torresLabel);
    s += placeLabel('TORRES STRAIT', tx, ty - 40, t, T.tip - 0.25, { size: 44, until: 43.4 });
    const [cx, cy] = P(...PLACES.tipPin);
    if (t > 41.4 && t < 44) s += pin(cx, cy, t, 41.55, { size: 0.9, grad: 'pinY' });
    const [ax, ay] = P(...PLACES.arafuraLabel);
    s += placeLabel('ARAFURA SEA', ax, ay, t, T.openSea - 0.3, { size: 48, until: 46.0 });
    // DAY counter (HUD) — ticks with distance sailed
    if (t > 27.8 && t < 45.6) {
      const day = clamp(1 + Math.floor((68 * R.escape.prog(t)) / R.escape.total), 1, 69);
      const op = seg(t, 27.8, 28.1) * (1 - seg(t, 45.15, 45.5));
      const bump = 1 + 0.06 * Math.exp(-((R.escape.prog(t) * 68 / R.escape.total) % 1) * 6);
      s += `<g opacity="${f2(op)}">${chip(`DAY ${day}`, 540, 250, { size: 52, scale: bump, accent: '#FFC233' })}</g>`;
    }
    return s;
  }

  // 45.1–52.9 — 69 DAYS · TIMOR · 5,000 KM · all eleven alive
  function beatTimor(t) {
    if (t < 44.9 || t > 53.1) return '';
    let s = '';
    const d = pop(t, T.d69 - 0.04, 0.35), dOp = seg(t, T.d69 - 0.04, T.d69 + 0.05) * (1 - seg(t, 48.15, 48.55));
    if (dOp > 0) s += label3d('69 DAYS', 540, 380, 200, { fill: '#FFD23F', side: '#7a3b00', edge: '#3a1a00', scale: lerp(1.5, 1, d), op: dOp, depth: 10, ls: 5 });
    const [kx, ky] = P(...PLACES.kupang);
    if (t > 46.9) s += pin(kx, ky, t, 47.0, { size: 1.15 });
    const [lx, ly] = P(...PLACES.timorLabel);
    s += placeLabel('TIMOR', lx, ly - 30, t, T.timor - 0.25, { size: 66, until: 49.3 });
    s += placeLabel('KUPANG', kx - 20, ky + 64, t, 47.25, { size: 34, until: 49.3 });
    // full-route distance callout
    if (t > T.over - 0.1) {
      const p = E.io(seg(t, T.over, 50.4));
      const op = seg(t, T.over - 0.1, T.over + 0.15) * (1 - seg(t, 52.6, 52.95));
      const mid = atKm(R.escape, 2650); const [mx, my] = PU(mid.u, mid.v);
      const km = Math.round((p * 5000) / 10) * 10;
      s += `<g opacity="${f2(op)}"><path d="M${f2(mx + 30)},${f2(my)} L${f2(mx + 110)},${f2(my - 130)}" stroke="#fff" stroke-width="4"/>
        <circle cx="${f2(mx)}" cy="${f2(my)}" r="12" fill="#fff" stroke="#0b1a33" stroke-width="3"/></g>`;
      s += label3d(`${km.toLocaleString('en-AU')} KM`, Math.min(mx + 60, 760), my - 150, 120, { fill: '#FFD23F', side: '#7a3b00', edge: '#3a1a00', op, depth: 7, ls: 3, scale: 0.8 + 0.2 * pop(t, T.over), anchor: 'middle' });
    }
    // every single one alive — 11 figures light up
    if (t > T.every - 0.1) {
      const op = seg(t, T.every - 0.1, T.every + 0.1) * (1 - seg(t, 52.6, 52.95));
      let g = '';
      for (let i = 0; i < 11; i++) {
        const t0 = T.every + i * 0.1, k = pop(t, t0, 0.3), lit = seg(t, t0, t0 + 0.1);
        const x = 540 + (i - 5) * 90;
        g += `<g transform="translate(${f2(x)} 300) scale(${f2(1.18 * (0.6 + 0.4 * k))})" opacity="${f2(0.35 + 0.65 * lit)}">
          <circle r="34" fill="${lit > 0.5 ? '#1f8f4e' : 'url(#chipG)'}" stroke="#fff" stroke-width="3"/><g transform="scale(0.85) translate(0 4)">${ICON_PERSON}</g></g>`;
      }
      s += `<g opacity="${f2(op)}" filter="url(#ds2)">${g}</g>`;
    }
    return s;
  }

  // 52.9–59.2 — Gag 4: cover story (shipwreck bubble), sad faces, Dutch flag nods, for a while
  function beatCover(t) {
    if (t < 52.7 || t > 69.6) return '';
    let s = '';
    const [kx, ky] = P(...PLACES.kupang);
    const sc = clamp(2.3 * Math.pow(2 / CAM.span, 0.3), 1.6, 2.8);
    // boat parked at Kupang with the eleven
    const bop = seg(t, 52.75, 53.1);
    const faces = E.io(seg(t, T.survivors - 0.2, T.survivors + 0.2)) * (1 - seg(t, 66.6, 67.0));
    const shock = t > T.falls - 0.1;
    const chainK = E.io(seg(t, 66.95, 67.9));
    const locked = t > T.chains - 0.15;
    const bx = kx + 110, by = ky + 50;
    let chains = '';
    if (chainK > 0) chains = `<g transform="translate(0 -6)">${chainArc(18, chainK, 78, 46)}</g>`;
    s += `<g opacity="${f2(bop * (1 - seg(t, 69.0, 69.5)))}" transform="translate(${f2(bx)} ${f2(by)}) scale(${f2(sc)})" filter="url(#ds)">${boat({ heads: 11, faces, tears: !shock, shock, chains, noSail: false })}
      ${chainK > 0.95 ? `<g transform="translate(0 6) scale(${f2(0.9 + 0.1 * pop(t, T.chains - 0.15))})">${padlock(locked)}</g>` : ''}</g>`;
    // Dutch flag pin planted at Kupang; nods on "believe it"
    if (t > 53.0) {
      const plant = E.back(seg(t, 53.0, 53.35));
      let nod = 0;
      if (t > T.believe - 0.35 && t < 58.4) { const k = seg(t, T.believe - 0.35, 58.4); nod = Math.sin(k * Math.PI * 4) * 16 * (1 - k * 0.3); }
      const fx = kx - 150, fy = ky - 20;
      const op = 1 - seg(t, 69.0, 69.5);
      s += `<g transform="translate(${f2(fx)} ${f2(fy)}) scale(${f2(1.35 * plant)})" opacity="${f2(op)}">${flagPin(nod, t * 5)}</g>`;
    }
    // speech bubble — the shipwreck story; cracks + falls on "falls apart"
    const bubOp = seg(t, 53.15, 53.4);
    if (bubOp > 0 && t < 67.2) {
      const crack = E.io(seg(t, T.falls - 0.35, T.falls));
      const fallT = E.i(seg(t, T.falls, T.falls + 0.9));
      s += `<g transform="translate(${f2(bx + 90)} ${f2(by - 330)}) scale(${f2(1.6 * pop(t, 53.15))})" opacity="${f2(bubOp)}">${storyBubble(crack, fallT)}</g>`;
    }
    // hourglass "for a while"
    if (t > T.forAWhile - 0.1 && t < 59.6) {
      const k = E.io(seg(t, T.forAWhile, 59.2));
      s += `<g transform="translate(${f2(kx - 250)} ${f2(ky - 200)}) scale(${f2(1.4 * pop(t, T.forAWhile - 0.1))})" opacity="${f2(1 - seg(t, 59.3, 59.6))}">${hourglass(k)}</g>`;
    }
    if (t < 59.4) {
      s += placeLabel('KUPANG', kx - 40, ky + 150, t, 53.2, { size: 42, until: 59.3 });
    }
    return s;
  }

  // 59.2–64.9 — Gag 5: real shipwreck crew — Pandora sinks on the reef, lifeboats crawl to Timor
  function beatPandora(t) {
    if (t < 59.3 || t > 65.4) return '';
    let s = '';
    const [px, py] = P(...PLACES.pandora);
    const sink = E.i(seg(t, 60.55, 61.75));
    const op = 1 - seg(t, 62.0, 62.4);
    if (op > 0) {
      const sc = 1.9;
      s += `<g transform="translate(${f2(px)} ${f2(py)})" opacity="${f2(op)}">
        <ellipse rx="120" ry="34" fill="#5ff2ff" opacity="0.3" filter="url(#glow4)"/>
        <defs><clipPath id="water"><rect x="-300" y="-400" width="600" height="${f2(400 + 14)}"/></clipPath></defs>
        <g clip-path="url(#water)"><g transform="translate(0 ${f2(sink * 150)}) rotate(${f2(sink * 24 + Math.sin(t * 20) * 2 * (1 - sink))}) scale(${f2(sc)})" filter="url(#ds)">${frigate()}</g></g>
        ${sink > 0.05 ? [0, 1, 2, 3, 4, 5].map((i) => { const ph = (t * 1.6 + i / 6) % 1; return `<circle cx="${f2(-40 + i * 16 + Math.sin(i + t * 4) * 6)}" cy="${f2(10 - ph * 80)}" r="${f2(4 + 4 * ph)}" fill="none" stroke="#e8fbff" stroke-width="2.5" opacity="${f2((1 - ph) * sink)}"/>`; }).join('') : ''}
        <ellipse rx="${f2(60 + 80 * sink)}" ry="${f2(16 + 20 * sink)}" fill="none" stroke="#fff" stroke-width="3" opacity="${f2(0.6 * sink * (1 - sink))}"/></g>`;
      s += placeLabel('PANDORA', px, py - 300, t, 60.3, { size: 64, until: 62.3 });
    }
    // lifeboats queue along the route to Timor
    if (t > 60.95) {
      const pr = R.pandora, k = pr.prog(t);
      for (let i = 0; i < 4; i++) {
        const kk = k - i * 14 * (CAM.span / 6);
        if (kk < 0) continue;
        const h = atKm(pr, kk); const [x, y] = PU(h.u, h.v);
        const flip = h.dx < 0 ? -1 : 1;
        s += `<g transform="translate(${f2(x)} ${f2(y - 4)}) scale(${f2(flip * 1.9)} 1.9)" filter="url(#ds2)">${lifeboat(t * 7 + i)}
          ${i === 0 && t > T.british - 0.1 ? `<g transform="translate(0 -22) scale(${f2(pop(t, T.british - 0.1))})">${bicorne()}</g>` : ''}</g>`;
        if (i === 0 && t > T.hunting - 0.1) {
          const pk = pop(t, T.hunting - 0.1, 0.45);
          s += `<g transform="translate(${f2(x + (flip < 0 ? -40 : 40))} ${f2(y - 260)}) scale(${f2(1.3 * pk)}) rotate(${f2(Math.sin(t * 3) * 3)})" opacity="${f2(1 - seg(t, 64.1, 64.5))}">${poster(Math.sin(t * 6) * 2)}</g>`;
        }
      }
    }
    return s;
  }

  // chains → handled in beatCover (boat) ; here the arrest chip
  function beatChains(t) {
    return '';
  }

  // 68.4–74.6 — grey route home; three soft markers (no text) for the children and William
  function beatReturn(t) {
    if (t < 68.3 || t > 90.6) return '';
    let s = '';
    const rr = R.return;
    if (t < 75.1) {
      const h = head('return', t); const [hx, hy] = PU(h.u, h.v);
      const flip = h.dx < 0 ? -1 : 1;
      s += `<g transform="translate(${f2(hx)} ${f2(hy - 8)}) scale(${f2(flip * 1.2)} 1.2)" opacity="${f2(seg(t, 68.5, 68.8) * (1 - seg(t, 74.9, 75.1)))}" filter="url(#ds2)">${tallShip()}
        <g transform="translate(0 2) scale(0.55)">${chainArc(14, 1, 60, 22)}</g></g>`;
    }
    const mk = (lon, lat, t0, r) => {
      const [x, y] = P(lon, lat);
      const k = seg(t, t0, t0 + 0.6) * (1 - seg(t, 89.6, 90.4));
      return k > 0 ? `<g transform="translate(${f2(x)} ${f2(y)})">${memorial(k, r)}</g>` : '';
    };
    s += mk(106.55, -5.95, T.babySon + 0.25, 15);
    s += mk(107.05, -6.25, T.husband2, 19);
    const cp = atKm(rr, 14250);
    s += mk(cp.lon, cp.lat, T.daughter - 0.15, 16);
    return s;
  }

  // 74.6–79 — London, ALONE, possible death sentence
  function beatLondon(t) {
    if (t < 74.4 || t > 90.6) return '';
    let s = '';
    const [lx, ly] = P(...PLACES.london);
    s += pin(lx, ly, t, 74.95, { size: 1.15, grad: t > 80 ? 'pinG' : 'pinGrey' });
    s += placeLabel('LONDON', lx + 20, ly + 70, t, T.london - 0.05, { size: 56, until: 85.8 });
    const aOp = seg(t, T.alone - 0.05, T.alone + 0.1) * (1 - seg(t, 78.8, 79.2));
    if (aOp > 0) s += chip('ALONE', 540, 300, { size: 46, op: aOp, scale: 0.8 + 0.2 * pop(t, T.alone - 0.05), accent: '#b9c1cc', icon: ICON_MOTHER });
    // gavel taps once on "death"
    if (t > 76.0 && t < 79.3) {
      const k = seg(t, 76.0, 76.4);
      const rot = t < T.death ? -30 * E.io(seg(t, 76.3, T.death - 0.05)) : -30 + 30 * E.back(seg(t, T.death - 0.05, T.death + 0.08));
      const ring = seg(t, T.death, T.death + 0.8);
      s += `<g transform="translate(${f2(lx + 150)} ${f2(ly - 170)}) scale(1.35)" opacity="${f2(k * (1 - seg(t, 78.9, 79.3)))}">
        ${ring > 0 && ring < 1 ? `<circle cx="-10" cy="44" r="${f2(30 + 90 * ring)}" fill="none" stroke="#e5484d" stroke-width="${f2(5 * (1 - ring))}" opacity="${f2(1 - ring)}"/>` : ''}${gavel(rot)}</g>`;
    }
    return s;
  }

  // 79–85.9 — warm return; JAMES BOSWELL; case file; PARDONED stamp; coins to Mary for life
  function beatBoswell(t) {
    if (t < 78.9 || t > 86.4) return '';
    let s = '';
    const [lx, ly] = P(...PLACES.london);
    const [fx, fy] = P(...PLACES.fowey);
    const bOp = seg(t, 79.4, 79.6) * (1 - seg(t, 85.9, 86.3));
    if (bOp > 0) {
      s += `<g transform="translate(${f2(lx + 60)} ${f2(ly - 120)}) scale(${f2(1.3 * pop(t, 79.4))})" opacity="${f2(bOp)}" filter="url(#ds2)"><circle r="36" fill="url(#chipG)" stroke="#FFC233" stroke-width="4"/><g transform="scale(0.8)">${ICON_QUILL}</g></g>`;
      s += chip('JAMES BOSWELL', 540, 250, { size: 44, op: bOp, scale: 0.8 + 0.2 * pop(t, 79.4), icon: ICON_QUILL });
    }
    // case file slides up; PARDONED slams
    const cfIn = E.o5(seg(t, T.takesUp - 0.1, T.takesUp + 0.35));
    const cfOp = seg(t, T.takesUp - 0.1, T.takesUp + 0.1) * (1 - seg(t, 83.6, 84.0));
    if (cfOp > 0) {
      s += `<g transform="translate(540 ${f2(lerp(900, 560, cfIn))}) rotate(${f2(lerp(8, -3, cfIn))}) scale(1.35)" opacity="${f2(cfOp)}">${caseFile()}
        ${t > T.pardoned - 0.12 ? `<g transform="translate(0 66)">${stamp('PARDONED', seg(t, T.pardoned - 0.12, T.pardoned + 0.12))}</g>` : ''}</g>`;
    }
    // Mary home (soft pin) + coins arcing for the rest of his life
    if (t > 83.2) {
      const mOp = seg(t, 83.2, 83.4) * (1 - seg(t, 85.9, 86.3));
      s += `<g opacity="${f2(mOp)}">${pin(fx, fy, t, 83.2, { size: 0.95, grad: 'pinY' })}
        <g transform="translate(${f2(fx)} ${f2(fy - 130)}) scale(${f2(0.9 * pop(t, 83.3))})" filter="url(#ds2)"><circle r="36" fill="url(#chipG)" stroke="#FFC233" stroke-width="4"/><g transform="scale(0.85)">${ICON_MOTHER}</g></g></g>`;
      for (let i = 0; i < 9; i++) {
        const t0 = 83.45 + i * 0.25;
        const k = seg(t, t0, t0 + 0.8);
        if (k <= 0 || k >= 1) continue;
        const x = lerp(lx + 60, fx, k), y = lerp(ly - 120, fy - 130, k) - Math.sin(k * Math.PI) * 220;
        s += `<g transform="translate(${f2(x)} ${f2(y)}) scale(2.1)" opacity="${f2(Math.min(1, (1 - k) * 4) * mOp)}" filter="url(#ds2)">${coin(t * 9 + i)}</g>`;
      }
    }
    return s;
  }

  // 85.9–90.3 — like CTA (soft pulse; map keeps moving)
  function beatCTA(t) {
    if (t < 85.8 || t > 90.6) return '';
    const op = seg(t, 85.9, 86.2) * (1 - seg(t, 90.1, 90.5));
    const k = pop(t, 85.95, 0.45);
    const pulse = 1 + 0.12 * Math.exp(-Math.max(0, t - T.like) * 5) * (t > T.like ? 1 : 0) + 0.04 * Math.sin(t * 6);
    let s = `<g transform="translate(540 430) scale(${f2(k * pulse * 1.15)})" opacity="${f2(op)}">${thumbs(1)}</g>`;
    const b = seg(t, T.like, T.like + 0.7);
    if (b > 0 && b < 1) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2, r = 110 + 140 * E.o(b);
        s += `<circle cx="${f2(540 + Math.cos(a) * r)}" cy="${f2(430 + Math.sin(a) * r)}" r="${f2(9 * (1 - b))}" fill="${i % 2 ? '#FFD23F' : '#ff2d55'}" opacity="${f2(1 - b)}"/>`;
      }
    }
    // a tap on "you know what to do"
    const tap = seg(t, T.doWhat - 0.35, T.doWhat + 0.4);
    if (tap > 0 && tap < 1) {
      const y = 600 - 120 * E.io(Math.min(1, tap * 1.6)) + (tap > 0.62 ? 12 * Math.sin((tap - 0.62) * 16) : 0);
      s += `<g transform="translate(600 ${f2(y)}) rotate(-18)" opacity="${f2(op * (1 - seg(tap, 0.85, 1)))}" filter="url(#ds2)">
        <path d="M0,0 C-6,-10 -6,-50 2,-56 C10,-60 14,-50 14,-40 L14,-12 C20,-20 32,-16 32,-8 C38,-14 48,-10 48,-2 C54,-8 64,-4 64,6 L64,40 C64,70 40,84 18,84 C-6,84 -18,66 -24,50 L-36,20 C-40,10 -28,4 -20,12 Z" fill="#fff" stroke="#0b1a33" stroke-width="4"/></g>`;
    }
    return s;
  }

  // 90.3–94.8 — Gag 7: red route joins the IMPOSSIBLE JOURNEYS master map; camel mascot; next one?
  function beatSeries(t) {
    if (t < 90.2 || t > 95.4) return '';
    let s = '';
    const op = seg(t, 90.4, 90.8) * (1 - seg(t, 94.9, 95.3));
    // master-map frame: thin gold border + grid ticks
    if (op > 0) {
      s += `<g opacity="${f2(op * 0.9)}"><rect x="40" y="150" width="1000" height="1080" rx="26" fill="none" stroke="#FFC233" stroke-width="4" stroke-dasharray="${f2(4160 * E.io(seg(t, 90.4, 91.4)))} 4160"/>
        ${[0, 1, 2, 3].map((i) => `<path d="M${40 + i * 333},150 l0,14 M${40 + i * 333},1230 l0,-14" stroke="#FFC233" stroke-width="3"/>`).join('')}</g>`;
      s += chip('IMPOSSIBLE JOURNEYS', 540, 220, { size: 44, op, scale: 0.8 + 0.2 * pop(t, T.impossible - 0.2), accent: '#ff3b4a' });
      // EP. 1 tag on the red route
      const mid = atKm(R.escape, 2600); const [mx, my] = PU(mid.u, mid.v);
      const k = pop(t, T.episode, 0.4);
      s += `<g opacity="${f2(op * seg(t, T.episode, T.episode + 0.1))}"><path d="M${f2(mx)},${f2(my)} L${f2(mx + 60)},${f2(my - 90)}" stroke="#fff" stroke-width="3"/></g>`;
      s += chip('EP. 1', mx + 110, my - 120, { size: 36, op: op * seg(t, T.episode, T.episode + 0.1), scale: 0.6 + 0.4 * k, bg: '#c4122f', accent: '#ffffff' });
      // next one? — pulsing dashed slot elsewhere on the master map
      if (t > T.follow - 0.1) {
        const nk = seg(t, T.follow - 0.1, T.nextOne + 0.4);
        const pts = [[78, 28], [88, 38], [100, 46]];
        let d = '';
        for (let i = 0; i <= 30 * nk; i++) {
          const q = (i / 30) * (pts.length - 1), a = Math.floor(q), f = q - a, b = Math.min(a + 1, pts.length - 1);
          const [x, y] = P(lerp(pts[a][0], pts[b][0], f), lerp(pts[a][1], pts[b][1], f));
          d += (i ? 'L' : 'M') + f2(x) + ' ' + f2(y);
        }
        if (d) s += dashedRoute(d, 5, t, { color: '#ff6b78', op });
        const [qx, qy] = P(100, 46);
        const pk = pop(t, T.nextOne - 0.2, 0.4) * (1 + 0.06 * Math.sin(t * 8));
        s += `<g transform="translate(${f2(qx)} ${f2(qy)}) scale(${f2(pk)})" opacity="${f2(op)}" filter="url(#ds)"><circle r="44" fill="#c4122f" stroke="#fff" stroke-width="4"/>
          <text y="20" text-anchor="middle" font-family="Anton" font-size="58" fill="#fff">?</text></g>`;
        s += chip('EP. 2', qx, qy + 86, { size: 30, op: op * seg(t, T.nextOne - 0.1, T.nextOne + 0.1), bg: '#2a0a12', accent: '#ff6b78' });
      }
      // series camel mascot walks in, waves
      const ck = E.o(seg(t, 91.6, 92.8));
      s += `<g transform="translate(${f2(lerp(-160, 230, ck))} 1060) scale(1.15)" opacity="${f2(op)}" filter="url(#ds)">${camelFull(t * 9 * (1 - seg(t, 92.7, 92.9)), t > 92.8 ? t * 10 : 0)}</g>`;
    }
    return s;
  }

  // 94.8–96.12 — incomplete loop: whip back to the frame-1 hook
  function beatLoop(t) {
    if (t < 95.0) return '';
    let s = '';
    const [sx, sy] = P(...PLACES.sydneyCove), [kx, ky] = P(...PLACES.kupang);
    const op = seg(t, 95.3, 95.7);
    s += `<g opacity="${f2(op)}">${pin(sx, sy, t, -1, { size: 0.8 })}${pin(kx, ky, t, -1, { size: 0.8 })}
      ${placeLabel('SYDNEY', sx - 20, sy + 62, t, -1, { size: 38 })}${placeLabel('TIMOR', kx, ky - 92, t, -1, { size: 38 })}</g>`;
    const k = E.o5(seg(t, 95.62, 96.1));
    if (k > 0) s += label3d('5,000 KM', 540, 960, 250, { fill: '#FFD23F', side: '#7a3b00', edge: '#3a1a00', scale: lerp(2.2, 1.06, k), op: seg(t, 95.62, 95.8), depth: 12, ls: 6 });
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
    // decode every basemap layer once so frame 1 never paints blank
    await Promise.all(LAYER_ORDER.map((n) => { const im = new Image(); im.src = '/img/' + BASE[n].file; return im.decode().catch(() => {}); }));
    READY = true;
    window.renderFrame(0);
    window.__assetsReady = true;
  })();
})();
