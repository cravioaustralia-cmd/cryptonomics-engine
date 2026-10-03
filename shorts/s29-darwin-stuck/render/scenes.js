/* s29 Darwin Stuck — MAP EXPLAINER (kinetic cartography).
 * SVG + renderFrame(t) + Playwright + ffmpeg. No Remotion.
 *
 * Layers (bottom → top):
 *   #map    satellite mip chain (asia5/aus6/aus7/nt8) + soft overlays (NT fill, desert glow),
 *           placed in Web Mercator world space and moved by one eased camera
 *   #fx     map-space vector graphics (rails, arrows, pins, labels, gags) — projected every frame
 *   #haze   atmospheric edge haze + vignette
 *   #ui     screen-space UI (hook card, chips, envelopes, Related arrow, captions)
 *
 * Every time below comes from transcript.json (Whisper on the held Atlas VO).
 */
(function () {
  'use strict';
  const W = 1080, H = 1920, FPS = 30;
  const T_END = 51.9; // VO = 51.816 s; last frame match-cuts back to frame 1

  /* ------------------------------------------------------------------ math */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ss = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const eio = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const eoc = (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
  const eob = (u) => { u = clamp(u, 0, 1); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
  const eel = (u) => { u = clamp(u, 0, 1); if (u === 0 || u === 1) return u; return Math.pow(2, -9 * u) * Math.sin((u * 10 - 0.75) * (2 * Math.PI / 3)) + 1; };
  const bounceOut = (u) => {
    u = clamp(u, 0, 1); const n = 7.5625, d = 2.75;
    if (u < 1 / d) return n * u * u;
    if (u < 2 / d) return n * (u -= 1.5 / d) * u + 0.75;
    if (u < 2.5 / d) return n * (u -= 2.25 / d) * u + 0.9375;
    return n * (u -= 2.625 / d) * u + 0.984375;
  };
  // in/out window: rises over [a, a+ri], falls over [b-fo, b]
  const win = (t, a, b, ri = 0.25, fo = 0.3) => Math.min(ss(a, a + ri, t), 1 - ss(b - fo, b, t));
  const f2 = (v) => (Math.round(v * 100) / 100);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function hash(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  /* ------------------------------------------------------------------ geography (lat, lon) */
  const P = {
    darwin: [-12.4634, 130.8456],
    birdum: [-15.650, 133.217],
    alice: [-23.698, 133.880],
    adelaide: [-34.928, 138.600],
    melbourne: [-37.814, 144.963],
    sydney: [-33.869, 151.209],
    brisbane: [-27.470, 153.026],
    perth: [-31.952, 115.861],
    tokyo: [35.68, 139.69],
  };
  // North Australia Railway, Darwin → Birdum (1942 southern terminus)
  const RAIL_N = [
    [-12.462, 130.845], [-12.47, 130.90], [-12.52, 130.98], [-12.63, 131.06], [-12.86, 131.10],
    [-13.06, 131.10], [-13.236, 131.106], [-13.40, 131.30], [-13.50, 131.44], [-13.66, 131.66],
    [-13.823, 131.835], [-14.02, 131.94], [-14.20, 132.05], [-14.465, 132.264], [-14.62, 132.55],
    [-14.78, 132.85], [-14.923, 133.067], [-15.20, 133.14], [-15.42, 133.19], [-15.575, 133.215],
    [-15.650, 133.217],
  ];
  // Central Australian Railway, arriving at Alice Springs from the south (drawn northward)
  const RAIL_S = [
    [-29.65, 138.06], [-29.35, 137.30], [-28.91, 136.34], [-28.45, 135.95], [-27.55, 135.45],
    [-27.02, 135.15], [-26.13, 134.85], [-25.57, 134.58], [-25.10, 134.30], [-24.55, 134.12],
    [-23.97, 133.94], [-23.698, 133.880],
  ];
  const NT_COAST = { w: -14.995, e: -16.539 }; // where 129°E / 138°E meet the north coast (from the basemap land mask)

  function haversine(a, b) {
    const R = 6371, r = Math.PI / 180;
    const dp = (b[0] - a[0]) * r, dl = (b[1] - a[1]) * r;
    const h = Math.sin(dp / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dl / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  const kmLabel = (km, step) => (Math.round(km / step) * step).toLocaleString('en-AU') + ' km';
  const KM_ADL = kmLabel(haversine(P.darwin, P.adelaide), 100);   // 2,600 km
  const KM_JPN = kmLabel(haversine(P.darwin, P.tokyo), 100);      // 5,400 km

  /* ------------------------------------------------------------------ projection + camera */
  const mx = (lon) => (lon + 180) / 360 * 256;
  const my = (lat) => (1 - Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) / Math.PI) / 2 * 256;
  const cam = { x: 0, y: 0, z: 6, sx: 0, sy: 0 };
  function S(ll) { // [lat, lon] → screen [x, y]
    const k = Math.pow(2, cam.z);
    return [(mx(ll[1]) - cam.x) * k + W / 2 + cam.sx, (my(ll[0]) - cam.y) * k + H / 2 + cam.sy];
  }

  // camera key: fit points into a screen rect (keeps graphics above the caption band)
  function fit(pts, rect, dz = 0) {
    rect = rect || {};
    const x0 = rect.x0 ?? 90, x1 = rect.x1 ?? 990, y0 = rect.y0 ?? 210, y1 = rect.y1 ?? 1170;
    const xs = pts.map((p) => mx(p[1])), ys = pts.map((p) => my(p[0]));
    const bx0 = Math.min(...xs), bx1 = Math.max(...xs), by0 = Math.min(...ys), by1 = Math.max(...ys);
    const z = Math.log2(Math.min((x1 - x0) / Math.max(bx1 - bx0, 1e-6), (y1 - y0) / Math.max(by1 - by0, 1e-6))) + dz;
    const k = Math.pow(2, z);
    return { x: (bx0 + bx1) / 2 - ((x0 + x1) / 2 - W / 2) / k, y: (by0 + by1) / 2 - ((y0 + y1) / 2 - H / 2) / k, z };
  }
  function at(ll, z, sx = 540, sy = 700) { // put lat/lon at screen (sx, sy) at zoom z
    const k = Math.pow(2, z);
    return { x: mx(ll[1]) - (sx - W / 2) / k, y: my(ll[0]) - (sy - H / 2) / k, z };
  }

  // Opening composition (also the loop target)
  const K0 = at(P.darwin, 7.85, 610, 880);
  const K0b = at(P.darwin, 8.10, 600, 860);
  const KAUS = fit([[-10.6, 113.2], [-39.0, 153.6]], { y0: 230, y1: 1190 });
  const KNORTH = fit([[-10.8, 122.5], [-27.5, 145.8]], { y0: 260, y1: 1200 });
  const KGAP = fit([[-14.6, 131.6], [-24.4, 135.4]], { y0: 230, y1: 1190 });
  const KTRAP = fit([[-6.5, 120.0], [-21.5, 143.0]], { y0: 230, y1: 1200 });
  const KJPN = fit([[37.5, 128.0], [-14.5, 142.5], [-13.0, 117.0]], { y0: 170, y1: 1190 });
  const KSC = fit([[-9.0, 116.0], [-30.0, 150.0]], { y0: 520, y1: 1220 });

  const KEYS = [
    [0.00, K0],
    [1.80, at(P.darwin, 7.95, 606, 872)],
    [4.40, K0b],
    [4.95, at(P.darwin, 7.85, 600, 860)],
    [6.20, at(P.darwin, 7.45, 560, 700)],
    [7.80, fit([[-10.8, 124.0], [-24.5, 141.0]], { y0: 260, y1: 1200 })],
    [9.30, KNORTH],
    [10.30, at(P.darwin, 7.55, 540, 740)],
    [12.80, at(P.darwin, 7.80, 560, 760)],
    [14.10, at([-12.40, 130.60], 8.05, 560, 760)],
    [15.90, at([-12.45, 130.72], 8.18, 560, 760)],
    [16.30, at([-12.60, 130.90], 8.00, 560, 760)],
    [17.70, KAUS],
    [20.90, { x: KAUS.x + 0.6, y: KAUS.y + 0.35, z: KAUS.z + 0.12 }],
    [21.90, fit([P.darwin, [-14.2, 132.6]], { y0: 300, y1: 1080 }, -0.15)],
    [24.40, fit([[-13.6, 131.6], [-16.2, 133.6]], { y0: 300, y1: 1100 }, -0.35)],
    [25.30, fit([[-15.0, 132.6], [-17.8, 134.4]], { y0: 300, y1: 1100 }, -0.30)],
    [25.95, fit([[-24.8, 133.3], [-28.4, 136.2]], { y0: 260, y1: 1160 }, -0.10)],
    [27.55, fit([[-23.0, 133.0], [-26.0, 135.4]], { y0: 260, y1: 1160 }, -0.10)],
    [29.20, KGAP],
    [30.30, { x: KGAP.x, y: KGAP.y - 0.05, z: KGAP.z + 0.06 }],
    [31.05, at([-15.10, 133.05], 7.85, 540, 640)],
    [32.60, at([-15.30, 133.12], 7.95, 540, 620)],
    [34.30, { x: KGAP.x, y: KGAP.y + 0.04, z: KGAP.z + 0.10 }],
    [36.60, { x: KGAP.x, y: KGAP.y + 0.20, z: KGAP.z + 0.04 }],
    [38.20, KTRAP],
    [40.20, { x: KTRAP.x, y: KTRAP.y - 0.15, z: KTRAP.z - 0.12 }],
    [43.30, KJPN],
    [45.00, { x: KJPN.x, y: KJPN.y + 0.4, z: KJPN.z + 0.06 }],
    [46.70, KSC],
    [50.30, { x: KSC.x + 0.25, y: KSC.y + 0.2, z: KSC.z + 0.10 }],
    [50.95, { x: KSC.x + 0.3, y: KSC.y + 0.24, z: KSC.z + 0.12 }],
    [T_END, K0],
  ];

  // non-uniform Catmull-Rom (Hermite) → camera never stops between keys
  function camAt(t) {
    const n = KEYS.length;
    if (t <= KEYS[0][0]) return KEYS[0][1];
    if (t >= KEYS[n - 1][0]) return KEYS[n - 1][1];
    let i = 0;
    while (i < n - 2 && t > KEYS[i + 1][0]) i++;
    const [t0, p0] = KEYS[i], [t1, p1] = KEYS[i + 1];
    const pm = KEYS[Math.max(0, i - 1)], pn = KEYS[Math.min(n - 1, i + 2)];
    const u = (t - t0) / (t1 - t0), h = t1 - t0;
    const out = {};
    for (const k of ['x', 'y', 'z']) {
      // tangents scaled by segment length; zero at the ends of the timeline
      let m0 = i === 0 ? 0 : (p1[k] - pm[1][k]) / (t1 - pm[0]);
      let m1 = i + 1 === n - 1 ? 0 : (pn[1][k] - p0[k]) / (pn[0] - t0);
      // limit tangents to avoid overshoot on whips (Fritsch–Carlson style)
      const d = (p1[k] - p0[k]) / h;
      if (d === 0) { m0 = 0; m1 = 0; } else {
        if (Math.sign(m0) !== Math.sign(d)) m0 = 0;
        if (Math.sign(m1) !== Math.sign(d)) m1 = 0;
        const a = m0 / d, b = m1 / d, s = a * a + b * b;
        if (s > 9) { const tau = 3 / Math.sqrt(s); m0 = tau * a * d; m1 = tau * b * d; }
      }
      const u2 = u * u, u3 = u2 * u;
      out[k] = (2 * u3 - 3 * u2 + 1) * p0[k] + (u3 - 2 * u2 + u) * h * m0 + (-2 * u3 + 3 * u2) * p1[k] + (u3 - u2) * h * m1;
    }
    return out;
  }

  /* ------------------------------------------------------------------ DOM scaffold */
  let META = null;
  const allImgs = [];
  let mapFull, fxEl, uiEl, sheetEl, hazeEl, curlEl, borderEl;

  function css(el, o) { Object.assign(el.style, o); return el; }
  function makeMapLayer() {
    const d = css(document.createElement('div'), { position: 'absolute', left: '0', top: '0', width: W + 'px', height: H + 'px', overflow: 'hidden' });
    const list = META.canvases.map((c) => ({ ...c, kind: 'base' }));
    const g = META.overlay_grid;
    list.push({ ...g, name: 'nt_fill', file: 'map/nt_fill.webp', kind: 'ov' });
    list.push({ ...g, name: 'desert', file: 'map/desert.webp', kind: 'ov' });
    const els = {};
    for (const c of list) {
      const im = document.createElement('img');
      im.src = '/img/' + c.file;
      css(im, { position: 'absolute', left: '0', top: '0', width: c.w + 'px', height: c.h + 'px', transformOrigin: '0 0', display: 'none' });
      im.decoding = 'sync';
      d.appendChild(im);
      els[c.name] = { el: im, c };
      allImgs.push(im);
    }
    d._els = els;
    return d;
  }

  function build() {
    const root = document.getElementById('root');
    root.innerHTML = '';
    const style = document.createElement('style');
    style.textContent = `
      @font-face{font-family:'MontX';font-weight:700;src:url(/img/fonts/montserrat-latin-700-normal.woff2) format('woff2');}
      @font-face{font-family:'MontX';font-weight:800;src:url(/img/fonts/montserrat-latin-800-normal.woff2) format('woff2');}
      @font-face{font-family:'MontX';font-weight:900;src:url(/img/fonts/montserrat-latin-900-normal.woff2) format('woff2');}
      @font-face{font-family:'AntonX';font-weight:400;src:url(/img/fonts/anton-latin-400-normal.woff2) format('woff2');}
      #stage{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:radial-gradient(ellipse at 50% 40%,#0b1a30 0%,#040a14 75%);}
      #stage svg text{font-family:'MontX',sans-serif;}
    `;
    document.head.appendChild(style);
    const stage = css(document.createElement('div'), {}); stage.id = 'stage';
    sheetEl = css(document.createElement('div'), { position: 'absolute', left: '0', top: '0', width: W + 'px', height: H + 'px', transformOrigin: '540px 900px' });
    mapFull = makeMapLayer();
    sheetEl.appendChild(mapFull);
    fxEl = css(document.createElement('div'), { position: 'absolute', left: '0', top: '0', width: W + 'px', height: H + 'px' });
    sheetEl.appendChild(fxEl);
    curlEl = css(document.createElement('div'), { position: 'absolute', left: '0', top: '0', width: W + 'px', height: H + 'px', display: 'none',
      background: 'radial-gradient(circle at 0% 0%, rgba(255,250,235,0.55) 0%, rgba(255,250,235,0.18) 9%, rgba(0,0,0,0.28) 15%, rgba(0,0,0,0) 26%),'
        + 'radial-gradient(circle at 100% 0%, rgba(255,250,235,0.55) 0%, rgba(255,250,235,0.18) 9%, rgba(0,0,0,0.28) 15%, rgba(0,0,0,0) 26%)' });
    sheetEl.appendChild(curlEl);
    borderEl = css(document.createElement('div'), { position: 'absolute', left: '0', top: '0', width: W + 'px', height: H + 'px', display: 'none' });
    sheetEl.appendChild(borderEl);
    stage.appendChild(sheetEl);
    hazeEl = css(document.createElement('div'), {
      position: 'absolute', left: '0', top: '0', width: W + 'px', height: H + 'px', pointerEvents: 'none',
      background: [
        'radial-gradient(ellipse 78% 62% at 50% 44%, rgba(0,0,0,0) 58%, rgba(150,185,220,0.06) 82%, rgba(170,200,230,0.14) 100%)',
        'radial-gradient(ellipse 95% 80% at 50% 46%, rgba(0,0,0,0) 60%, rgba(2,8,20,0.34) 100%)',
        'linear-gradient(180deg, rgba(2,8,20,0.30) 0%, rgba(2,8,20,0) 8%, rgba(2,8,20,0) 84%, rgba(2,8,20,0.34) 100%)',
      ].join(','),
    });
    stage.appendChild(hazeEl);
    uiEl = css(document.createElement('div'), { position: 'absolute', left: '0', top: '0', width: W + 'px', height: H + 'px' });
    stage.appendChild(uiEl);
    root.appendChild(stage);
  }

  /* ------------------------------------------------------------------ map layer placement */
  const LAYER_FADE = { asia5: null, aus6: [4.15, 4.55], aus7: [5.55, 5.95], nt8: [6.85, 7.25] };
  function placeLayer(layer, extra) {
    const k = Math.pow(2, cam.z);
    const els = layer._els;
    // opacity per mip by zoom; hide anything fully covered by an opaque layer above
    const order = ['asia5', 'aus6', 'aus7', 'nt8'];
    const op = {};
    for (const n of order) op[n] = LAYER_FADE[n] ? ss(LAYER_FADE[n][0], LAYER_FADE[n][1], cam.z) : 1;
    const covers = (n) => {
      const c = els[n].c, s = k / Math.pow(2, c.z), f = 90 * s; // feather margin in screen px
      const left = (c.X0 / Math.pow(2, c.z) - cam.x) * k + W / 2 + cam.sx;
      const top = (c.Y0 / Math.pow(2, c.z) - cam.y) * k + H / 2 + cam.sy;
      return left + f < -60 && top + f < -60 && left + c.w * s - f > W + 60 && top + c.h * s - f > H + 60;
    };
    let hideBelow = -1;
    for (let i = order.length - 1; i >= 0; i--) if (op[order[i]] >= 0.999 && covers(order[i])) { hideBelow = i; break; }
    order.forEach((n, i) => {
      const { el, c } = els[n];
      const vis = op[n] > 0.001 && i >= hideBelow;
      if (!vis) { el.style.display = 'none'; return; }
      const s = k / Math.pow(2, c.z);
      const tx = (c.X0 / Math.pow(2, c.z) - cam.x) * k + W / 2 + cam.sx;
      const ty = (c.Y0 / Math.pow(2, c.z) - cam.y) * k + H / 2 + cam.sy;
      el.style.display = 'block';
      el.style.opacity = op[n].toFixed(3);
      el.style.transform = `matrix(${s},0,0,${s},${tx},${ty})`;
    });
    for (const n of ['nt_fill', 'desert']) {
      const { el, c } = els[n];
      const o = extra[n] || 0;
      if (o <= 0.002) { el.style.display = 'none'; continue; }
      const s = k / Math.pow(2, c.z);
      const tx = (c.X0 / Math.pow(2, c.z) - cam.x) * k + W / 2 + cam.sx;
      const ty = (c.Y0 / Math.pow(2, c.z) - cam.y) * k + H / 2 + cam.sy;
      el.style.display = 'block';
      el.style.opacity = o.toFixed(3);
      el.style.transform = `matrix(${s},0,0,${s},${tx},${ty})`;
    }
  }

  /* ------------------------------------------------------------------ SVG primitives */
  const DEFS = `
    <defs>
      <filter id="ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.75"/></filter>
      <filter id="dsl" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="2" dy="7" stdDeviation="7" flood-color="#000" flood-opacity="0.55"/></filter>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="glowY" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur in="SourceAlpha" stdDeviation="14" result="b"/><feFlood flood-color="#ffd23f" flood-opacity="0.95"/><feComposite in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="grunge" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.7" result="m"/>
        <feComposite in="SourceGraphic" in2="m" operator="in"/>
      </filter>
      <linearGradient id="railG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd23f"/><stop offset="1" stop-color="#ff9f1c"/></linearGradient>
      <radialGradient id="pinG" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ff7a5c"/><stop offset="1" stop-color="#c62828"/></radialGradient>
      <radialGradient id="envGlow"><stop offset="0" stop-color="#ffe680" stop-opacity="0.85"/><stop offset="1" stop-color="#ffb000" stop-opacity="0"/></radialGradient>
      <marker id="ah" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L12,6 L0,12 L3,6 Z" fill="#fff"/></marker>
    </defs>`;

  const pts2d = (arr) => arr.map((p) => p.map(f2).join(',')).join(' ');
  function polyPath(arr) { return arr.length ? 'M' + arr.map((p) => f2(p[0]) + ',' + f2(p[1])).join('L') : ''; }
  function polyLen(arr) { let L = 0; for (let i = 1; i < arr.length; i++) L += Math.hypot(arr[i][0] - arr[i - 1][0], arr[i][1] - arr[i - 1][1]); return L; }
  function partial(arr, frac) { // returns {pts, head, ang}
    if (arr.length < 2) return { pts: arr, head: arr[0], ang: 0 };
    const L = polyLen(arr) * clamp(frac, 0, 1);
    let acc = 0; const out = [arr[0]];
    for (let i = 1; i < arr.length; i++) {
      const a = arr[i - 1], b = arr[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (acc + d >= L) {
        const u = d ? (L - acc) / d : 0;
        const p = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
        out.push(p);
        return { pts: out, head: p, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
      }
      acc += d; out.push(b);
    }
    const a = arr[arr.length - 2], b = arr[arr.length - 1];
    return { pts: out, head: b, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  }
  function densify(ll, n = 8) { // lat/lon polyline → denser (for smooth projection)
    const out = [];
    for (let i = 0; i < ll.length - 1; i++) for (let j = 0; j < n; j++) { const u = j / n; out.push([lerp(ll[i][0], ll[i + 1][0], u), lerp(ll[i][1], ll[i + 1][1], u)]); }
    out.push(ll[ll.length - 1]);
    return out;
  }
  function smoothLL(ll, it = 2) { // Chaikin smoothing for hand-traced rail alignments
    let p = ll;
    for (let k = 0; k < it; k++) {
      const o = [p[0]];
      for (let i = 0; i < p.length - 1; i++) {
        const a = p[i], b = p[i + 1];
        o.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]]);
        o.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
      }
      o.push(p[p.length - 1]);
      p = o;
    }
    return p;
  }
  function bezLL(a, c, b, n = 48) { // quadratic bezier in world space between lat/lon points
    const out = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, v = 1 - u;
      out.push([v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]]);
    }
    return out;
  }
  const RAIL_N_S = smoothLL(RAIL_N, 2);
  const RAIL_S_S = smoothLL(RAIL_S, 2);
  const GAP_LL = densify([P.birdum, P.alice], 24);
  const INTENT_LL = bezLL([-10.15, 128.25], [-10.75, 130.05], [-12.33, 130.76], 40);
  const LANDING_LL = bezLL([-11.55, 129.85], [-11.75, 130.65], [-12.40, 130.80], 30);
  const SUPPLY_LL = bezLL(P.darwin, [14.0, 121.0], [34.3, 136.4], 80);
  const ROADTRY_LL = RAIL_N_S.concat(densify([P.birdum, [-19.4, 133.55]], 12));

  let capActive = false;
  const bandFade = (y) => (capActive ? 1 - Math.min(ss(1180, 1235, y), 1 - ss(1450, 1505, y)) : 1);
  function label(text, x, y, o = {}) {
    const size = o.size || 46, sc = o.sc ?? 1, anchor = o.anchor || 'middle';
    const op = (o.op ?? 1) * bandFade(y);
    if (op <= 0.01 || sc <= 0.01) return '';
    const fill = o.fill || '#fff';
    return `<g opacity="${f2(op)}" transform="translate(${f2(x)} ${f2(y)}) scale(${f2(sc)})" filter="url(#ds)">
      <text text-anchor="${anchor}" y="${size * 0.36}" font-size="${size}" font-weight="900" fill="${fill}"
        stroke="#0b0f18" stroke-width="${o.sw ?? size * 0.16}" paint-order="stroke" stroke-linejoin="round"
        letter-spacing="${o.ls ?? 2}">${esc(text)}</text></g>`;
  }
  function kmCallout(text, x, y, sc, op) {
    op *= bandFade(y);
    if (op <= 0.01) return '';
    return `<g opacity="${f2(op)}" transform="translate(${f2(x)} ${f2(y)}) scale(${f2(sc)}) rotate(-3)" filter="url(#ds)">
      <text text-anchor="middle" y="22" font-size="64" font-weight="900" fill="#ffd23f" stroke="#1b1200" stroke-width="11"
        paint-order="stroke" stroke-linejoin="round" letter-spacing="1">${esc(text)}</text></g>`;
  }
  function dot(x, y, r, op = 1) {
    return `<g opacity="${f2(op)}"><circle cx="${f2(x)}" cy="${f2(y)}" r="${r + 4}" fill="#0b0f18" opacity="0.65"/><circle cx="${f2(x)}" cy="${f2(y)}" r="${r}" fill="#fff"/></g>`;
  }
  function pin(x, y, t0, t) { // teardrop pin drop with bounce + shadow + pulse
    const u = clamp((t - t0) / 0.55, 0, 1);
    if (u <= 0) return '';
    const drop = (1 - bounceOut(u)) * -220;
    const sq = u > 0.45 ? 1 + 0.12 * Math.sin((u - 0.45) * 18) * (1 - u) : 1;
    const pulse = ((t - t0) % 1.6) / 1.6;
    return `<g>
      <ellipse cx="${f2(x)}" cy="${f2(y + 2)}" rx="${f2(18 * (0.5 + 0.5 * u))}" ry="6" fill="#000" opacity="${f2(0.4 * u)}"/>
      <circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(14 + 46 * pulse)}" fill="none" stroke="#ff6b4a" stroke-width="${f2(4 * (1 - pulse))}" opacity="${f2((1 - pulse) * u)}"/>
      <g transform="translate(${f2(x)} ${f2(y + drop)}) scale(${f2(1 / sq)} ${f2(sq)})" filter="url(#dsl)">
        <path d="M0,0 C-8,-16 -26,-30 -26,-50 A26,26 0 1 1 26,-50 C26,-30 8,-16 0,0 Z" fill="url(#pinG)" stroke="#5a0d0d" stroke-width="3"/>
        <circle cx="0" cy="-51" r="10" fill="#fff"/>
      </g></g>`;
  }
  function rail(screenPts, frac, op = 1) {
    if (frac <= 0 || op <= 0.01) return { svg: '', head: null };
    const p = partial(screenPts, frac);
    const d = polyPath(p.pts);
    const svg = `<g opacity="${f2(op)}">
      <path d="${d}" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" transform="translate(3 6)" filter="url(#soft)"/>
      <path d="${d}" fill="none" stroke="#2a1606" stroke-width="22" stroke-dasharray="3 9" stroke-linejoin="round"/>
      <path d="${d}" fill="none" stroke="#5a2e00" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${d}" fill="none" stroke="url(#railG)" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${d}" fill="none" stroke="#fff6c8" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(-1 -1.5)"/>
    </g>`;
    return { svg, head: p.head, ang: p.ang };
  }
  function headGlow(h, t, op = 1) {
    if (!h) return '';
    const r = 13 + 3 * Math.sin(t * 14);
    return `<g opacity="${f2(op)}"><circle cx="${f2(h[0])}" cy="${f2(h[1])}" r="${f2(r * 2.2)}" fill="#ffd23f" opacity="0.25" filter="url(#soft)"/><circle cx="${f2(h[0])}" cy="${f2(h[1])}" r="${f2(r * 0.6)}" fill="#fff8d6"/></g>`;
  }
  function bufferStop(x, y, ang, sc, op = 1) {
    if (sc <= 0.01) return '';
    const deg = ang * 180 / Math.PI;
    return `<g opacity="${f2(op)}" transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(deg)}) scale(${f2(sc)})" filter="url(#ds)">
      <rect x="-4" y="-22" width="12" height="44" rx="3" fill="#d62828" stroke="#2b0505" stroke-width="3"/>
      <rect x="-1" y="-22" width="6" height="44" fill="#fff" opacity="0.85" />
      <rect x="-1" y="-10" width="6" height="8" fill="#d62828"/><rect x="-1" y="6" width="6" height="8" fill="#d62828"/>
    </g>`;
  }

  /* ---------------------------------------------------------------- gag art */
  function deadEndSign(x, y, t0, t) {
    const u = clamp((t - t0) / 0.7, 0, 1);
    if (u <= 0) return '';
    const s = eel(u);
    const wob = Math.sin((t - t0) * 9) * 7 * Math.exp(-(t - t0) * 2.2);
    return `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(wob)}) scale(${f2(s * 1.35)})" filter="url(#dsl)">
      <rect x="-5" y="-150" width="10" height="150" fill="#9aa3ad" stroke="#2e333a" stroke-width="2.5"/>
      <g transform="translate(0 -205) rotate(45)">
        <rect x="-50" y="-50" width="100" height="100" rx="10" fill="#ffd23f" stroke="#111" stroke-width="5"/>
        <rect x="-43" y="-43" width="86" height="86" rx="7" fill="none" stroke="#111" stroke-width="2.5"/>
      </g>
      <g transform="translate(0 -205)">
        <rect x="-8" y="-6" width="16" height="44" fill="#111"/>
        <rect x="-34" y="-30" width="68" height="16" fill="#111"/>
      </g>
      <g transform="translate(0 -112)">
        <rect x="-84" y="-22" width="168" height="44" rx="6" fill="#ffd23f" stroke="#111" stroke-width="4"/>
        <text text-anchor="middle" y="10" font-size="27" font-weight="900" fill="#111" letter-spacing="1">DEAD END</text>
      </g>
    </g>`;
  }

  function train(x, y, ang, t, moving, sad) {
    // small cartoon steam loco (gag colour — not a historical depiction)
    let dir = Math.cos(ang) >= 0 ? 1 : -1;
    let tilt = clamp((dir > 0 ? ang : Math.PI - ang) * 180 / Math.PI, -24, 24) * dir;
    const bob = moving ? Math.sin(t * 26) * 1.6 : 0;
    const wheelRot = moving ? (t * 720) % 360 : 0;
    const droop = sad;
    const wheel = (wx) => `<g transform="translate(${wx} 18) rotate(${f2(wheelRot)})"><circle r="10" fill="#1d1d1f" stroke="#f6c344" stroke-width="2.5"/><path d="M-9,0H9M0,-9V9" stroke="#f6c344" stroke-width="2"/></g>`;
    return `<g transform="translate(${f2(x)} ${f2(y)}) scale(1.45) rotate(${f2(tilt)}) scale(${dir} 1) translate(0 ${f2(-30 + bob)}) scale(1 ${f2(1 - 0.06 * droop)})" filter="url(#dsl)">
      <rect x="-52" y="-30" width="34" height="40" rx="4" fill="#b8322a" stroke="#1b1b1b" stroke-width="3"/>
      <rect x="-46" y="-24" width="20" height="14" rx="2" fill="#ffe9a8" opacity="${f2(1 - 0.6 * droop)}"/>
      <rect x="-58" y="-38" width="46" height="9" rx="3" fill="#2d3436" stroke="#1b1b1b" stroke-width="3"/>
      <rect x="-20" y="-16" width="62" height="26" rx="12" fill="#2d3436" stroke="#1b1b1b" stroke-width="3"/>
      <rect x="-12" y="-16" width="6" height="26" fill="#f6c344"/><rect x="14" y="-16" width="6" height="26" fill="#f6c344"/>
      <path d="M26,-16 L24,-36 L40,-36 L36,-16 Z" fill="#2d3436" stroke="#1b1b1b" stroke-width="3"/>
      <path d="M42,10 L56,22 L42,22 Z" fill="#b8322a" stroke="#1b1b1b" stroke-width="2.5"/>
      <circle cx="44" cy="-4" r="5" fill="${droop ? '#7a6a3a' : '#fff3b0'}" stroke="#1b1b1b" stroke-width="2"/>
      <rect x="-56" y="8" width="108" height="6" rx="2" fill="#1b1b1b"/>
      ${wheel(-40)}${wheel(-16)}${wheel(10)}${wheel(34)}
    </g>`;
  }
  function puffs(x, y, t, t0, t1, rate = 7, sad = false) {
    let s = '';
    const n = Math.floor((Math.min(t, t1) - t0) * rate);
    for (let i = Math.max(0, n - 10); i <= n; i++) {
      const born = t0 + i / rate; const age = t - born;
      if (age < 0 || age > 1.3) continue;
      const k = age / 1.3;
      const px = x - 20 * age - 6 * hash(i);
      const py = y - 55 - 70 * age;
      s += `<circle cx="${f2(px)}" cy="${f2(py)}" r="${f2(9 + 22 * k)}" fill="#f4f1ea" opacity="${f2(0.75 * (1 - k))}"/>`;
    }
    return s;
  }
  function sadPuff(x, y, t, t0) { // the "toot": one long steam plume that wilts
    const a = t - t0;
    if (a < 0 || a > 2.2) return '';
    const k = clamp(a / 2.2, 0, 1);
    const rise = eoc(clamp(a / 0.5, 0, 1)) * 70;
    const wilt = ss(0.5, 1.6, a) * 55;
    const op = (1 - ss(1.4, 2.2, a)) * 0.92;
    const lines = [0, 1, 2].map((i) => {
      const w = 26 + i * 16;
      return `<path d="M${f2(x + 28 + w * 0.2)},${f2(y - 92 - i * 14 - rise * 0.2)} q${f2(w * 0.5)},${f2(-10 + wilt * 0.4)} ${f2(w)},${f2(wilt * 0.7)}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="${f2(op * (1 - i * 0.2))}"/>`;
    }).join('');
    return `<g filter="url(#ds)">
      <ellipse cx="${f2(x + 32 + wilt * 0.25)}" cy="${f2(y - 80 - rise + wilt)}" rx="${f2(26 + 30 * k)}" ry="${f2(20 + 8 * k)}" fill="#f4f1ea" opacity="${f2(op)}"/>
      ${lines}</g>`;
  }
  function tumbleweed(x, y, rot, sc, op) {
    if (op <= 0.01) return '';
    let s = '';
    for (let i = 0; i < 16; i++) {
      const a0 = hash(i) * Math.PI * 2, r = 16 + hash(i + 50) * 22;
      const a1 = a0 + 1.6 + hash(i + 9) * 2.2;
      const x0 = Math.cos(a0) * r, y0 = Math.sin(a0) * r, x1 = Math.cos(a1) * (r * 0.9), y1 = Math.sin(a1) * (r * 0.9);
      const cx = Math.cos((a0 + a1) / 2) * (r * 1.5), cy = Math.sin((a0 + a1) / 2) * (r * 1.5);
      const dpath = `M${f2(x0)},${f2(y0)} Q${f2(cx)},${f2(cy)} ${f2(x1)},${f2(y1)}`;
      s += `<path d="${dpath}" fill="none" stroke="#2a1a08" stroke-width="${i % 4 ? 5.5 : 7}" stroke-linecap="round"/>`;
      s += `<path d="${dpath}" fill="none" stroke="${i % 3 ? '#e2c48a' : '#b48a4a'}" stroke-width="${i % 4 ? 2.4 : 3.4}" stroke-linecap="round"/>`;
    }
    return `<g opacity="${f2(op)}" transform="translate(${f2(x)} ${f2(y)}) scale(${f2(sc)})">
      <g transform="rotate(${f2(rot)})" filter="url(#ds)"><circle r="34" fill="#7a5a30" opacity="0.18"/>${s}</g></g>`;
  }
  function soldiers(x, y, t0, t) {
    const u = clamp((t - t0) / 0.6, 0, 1);
    if (u <= 0) return '';
    const fig = (dx, dy, k) => {
      const s = eob(clamp((t - t0 - k * 0.12) / 0.5, 0, 1));
      const sway = Math.sin(t * 3 + k) * 3;
      return `<g transform="translate(${dx} ${dy}) scale(${f2(s)}) rotate(${f2(sway)})">
        <rect x="-11" y="-30" width="22" height="30" rx="8" fill="#5b6b3a" stroke="#1c2410" stroke-width="3"/>
        <circle cx="0" cy="-40" r="10" fill="#e3c39b" stroke="#1c2410" stroke-width="2.5"/>
        <path d="M-14,-42 A14,12 0 0 1 14,-42 Z" fill="#4a5a2c" stroke="#1c2410" stroke-width="2.5"/>
      </g>`;
    };
    const q = clamp((t - t0 - 0.5) / 0.4, 0, 1);
    const bob = Math.sin(t * 4) * 4;
    return `<g transform="translate(${f2(x)} ${f2(y)}) scale(1.5)" filter="url(#dsl)">
      <path d="M-78,0 L-50,-48 L-22,0 Z" fill="#7d8a52" stroke="#1c2410" stroke-width="3" transform="scale(${f2(eob(u))})"/>
      ${fig(-4, 0, 0)}${fig(26, 4, 1)}${fig(54, -2, 2)}
      <g opacity="${f2(q)}" transform="translate(30 ${f2(-92 + bob)}) scale(${f2(eob(q))})">
        <path d="M-26,-20 h52 a10,10 0 0 1 10,10 v22 a10,10 0 0 1 -10,10 h-18 l-8,12 l-4,-12 h-22 a10,10 0 0 1 -10,-10 v-22 a10,10 0 0 1 10,-10 Z" fill="#fff" stroke="#111" stroke-width="3"/>
        <text text-anchor="middle" y="13" font-size="34" font-weight="900" fill="#111">?</text>
      </g>
    </g>`;
  }
  function noStamp(x, y, t0, t) {
    const a = t - t0;
    if (a < -0.12) return '';
    const u = clamp((a + 0.12) / 0.16, 0, 1);
    const s = lerp(2.4, 1, eoc(u)) * 1.35;
    const op = u * (1 - ss(1.9, 2.6, a));
    if (op <= 0.01) return '';
    return `<g opacity="${f2(op)}" transform="translate(${f2(x)} ${f2(y)}) rotate(-13) scale(${f2(s)})">
      <g filter="url(#grunge)">
        <rect x="-150" y="-92" width="300" height="184" rx="22" fill="rgba(214,40,40,0.10)" stroke="#e02c2c" stroke-width="14"/>
        <rect x="-130" y="-72" width="260" height="144" rx="12" fill="none" stroke="#e02c2c" stroke-width="4"/>
        <text text-anchor="middle" y="58" font-family="AntonX" font-size="168" fill="#e02c2c" letter-spacing="10">NO</text>
      </g></g>`;
  }
  function envelope(x, y, num, t0, t, glow) {
    const a = t - t0;
    if (a < 0) return '';
    const drop = (1 - bounceOut(clamp(a / 0.75, 0, 1))) * -520;
    const bob = a > 0.75 ? Math.sin((a - 0.75) * 4.2 + num) * 9 : 0;
    const rot = a > 0.75 ? Math.sin((a - 0.75) * 3 + num) * 4 : 0;
    const gl = 0.55 + 0.45 * glow;
    return `<g transform="translate(${f2(x)} ${f2(y + drop + bob)}) rotate(${f2(rot)})">
      <circle r="${f2(120 + 20 * glow)}" fill="url(#envGlow)" opacity="${f2(gl)}"/>
      <g filter="url(#glowY)">
        <rect x="-82" y="-56" width="164" height="112" rx="10" fill="#fff6dc" stroke="#3a2a10" stroke-width="4"/>
        <path d="M-82,-52 L0,8 L82,-52" fill="none" stroke="#3a2a10" stroke-width="4" stroke-linejoin="round"/>
        <path d="M-82,56 L-20,4 M82,56 L20,4" stroke="#3a2a10" stroke-width="3" opacity="0.5"/>
        <circle cx="0" cy="10" r="30" fill="#d62828" stroke="#5a0b0b" stroke-width="3"/>
        <text text-anchor="middle" y="24" font-size="42" font-weight="900" fill="#fff">${num}</text>
      </g></g>`;
  }
  function hookCard(t) {
    if (t > 2.1) return '';
    const inU = clamp(t / 0.22, 0, 1);
    const s = lerp(1.14, 1, eoc(inU)) * (1 - 0.06 * ss(1.55, 1.9, t));
    const op = 1 - ss(1.6, 1.95, t);
    const y = 318 - 140 * ss(1.6, 2.0, t) * ss(1.6, 2.0, t);
    const shake = t < 0.35 ? Math.sin(t * 90) * 8 * (1 - t / 0.35) : 0;
    return `<g opacity="${f2(op)}" transform="translate(${f2(540 + shake)} ${f2(y)}) rotate(-2.5) scale(${f2(s)})" filter="url(#dsl)">
      <rect x="-396" y="-150" width="792" height="300" rx="34" fill="#0d6b3c" stroke="#06331c" stroke-width="6"/>
      <rect x="-376" y="-130" width="752" height="260" rx="22" fill="none" stroke="#fff" stroke-width="9"/>
      <text text-anchor="middle" y="-14" font-size="112" font-weight="900" fill="#fff" letter-spacing="4">ROAD TO</text>
      <text text-anchor="middle" y="100" font-size="112" font-weight="900" fill="#fff" letter-spacing="4">NOWHERE</text>
    </g>`;
  }
  function chip(text, x, y, t0, t, t1, hi) {
    const u = clamp((t - t0) / 0.45, 0, 1);
    const op = u * (1 - ss(t1 - 0.3, t1, t));
    if (op <= 0.01) return '';
    const s = eob(u);
    const w = tw(text + (hi || ''), 48) + 8 * (text.length + (hi || '').length) + 80;
    return `<g opacity="${f2(op)}" transform="translate(${f2(x)} ${f2(y)}) scale(${f2(s)})" filter="url(#dsl)">
      <rect x="${-w / 2}" y="-44" width="${w}" height="88" rx="44" fill="rgba(10,14,24,0.88)" stroke="#ffd23f" stroke-width="5"/>
      <text text-anchor="middle" y="17" font-size="48" font-weight="900" fill="#fff" letter-spacing="3">${esc(text)}${hi ? `<tspan fill="#ffd23f">${esc(hi)}</tspan>` : ''}</text>
    </g>`;
  }
  function downArrow(x, y, t0, t, t1) {
    const u = clamp((t - t0) / 0.4, 0, 1);
    const op = u * (1 - ss(t1 - 0.3, t1, t));
    if (op <= 0.01) return '';
    const b = Math.abs(Math.sin((t - t0) * 6.5)) * 34;
    const trail = [0, 1, 2].map((i) => {
      const ph = ((t - t0) * 1.6 + i / 3) % 1;
      return `<path d="M-36,${f2(-80 + ph * 150)} l36,30 l36,-30" fill="none" stroke="#ffd23f" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="${f2((1 - ph) * 0.8)}"/>`;
    }).join('');
    return `<g opacity="${f2(op)}" transform="translate(${f2(x)} ${f2(y + b)}) scale(${f2(eob(u))})">
      <g filter="url(#glowY)">
        <path d="M-30,-150 h60 v130 h46 l-76,96 l-76,-96 h46 Z" fill="#ffd23f" stroke="#1b1200" stroke-width="7" stroke-linejoin="round"/>
      </g>
      <g transform="translate(0 130)">${trail}</g>
    </g>`;
  }

  /* ---------------------------------------------------------------- captions (lower-middle ~70%) */
  let CAPS = null;
  function buildCaps(words) {
    const groups = []; let cur = [];
    for (const w of words) {
      if (cur.length) {
        const prev = cur[cur.length - 1];
        const brk = cur.length >= 4 || (w.start - prev.end) > 0.42 || /[.?!:]$/.test(prev.word) || (/,$/.test(prev.word) && cur.length >= 2);
        if (brk) { groups.push(cur); cur = []; }
      }
      cur.push(w);
    }
    if (cur.length) groups.push(cur);
    return groups.map((g, i) => ({ words: g, start: g[0].start, end: Math.min(g[g.length - 1].end + 0.35, groups[i + 1] ? groups[i + 1][0].start : 99) }));
  }
  const CAP_Y = Math.round(H * 0.70);
  let measureCtx = null;
  function tw(txt, size) {
    if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
    measureCtx.font = `900 ${size}px MontX`;
    return measureCtx.measureText(txt).width + txt.length * 1.0; // + letter-spacing
  }
  function captions(t) {
    if (!CAPS) return '';
    const c = CAPS.find((g) => t >= g.start - 0.04 && t < g.end);
    if (!c) return '';
    const u = c.start < 0.05 ? 1 : clamp((t - c.start + 0.04) / 0.16, 0, 1);
    const s = lerp(0.86, 1, eob(u));
    const op = Math.min(u * 1.6, 1 - ss(c.end - 0.08, c.end, t));
    let size = 60;
    const up = (w) => w.word.toUpperCase();
    const space = tw(' ', size);
    let lines = [c.words];
    if (tw(c.words.map(up).join(' '), size) > 900) { // two balanced lines
      let best = 1, bestD = 1e9;
      for (let k = 1; k < c.words.length; k++) {
        const d = Math.abs(tw(c.words.slice(0, k).map(up).join(' '), size) - tw(c.words.slice(k).map(up).join(' '), size));
        if (d < bestD) { bestD = d; best = k; }
      }
      lines = [c.words.slice(0, best), c.words.slice(best)];
    }
    const measure = () => lines.map((ln) => tw(ln.map(up).join(' '), size));
    let lineW = measure();
    while (Math.max(...lineW) > 930 && size > 40) { size -= 2; lineW = measure(); }
    const sp = tw(' ', size);
    const lh = size * 1.16;
    let out = '';
    lines.forEach((ln, li) => {
      let x = -lineW[li] / 2;
      const y = (li - (lines.length - 1) / 2) * lh;
      for (const w of ln) {
        const txt = up(w);
        const on = t >= w.start - 0.02;
        const now = on && t < w.end + 0.05;
        out += `<text x="${f2(x)}" y="${f2(y + size * 0.36)}" font-size="${size}" font-weight="900" letter-spacing="1"
          fill="${now ? '#ffd23f' : '#fff'}" opacity="${on ? 1 : 0.6}" stroke="#05070c" stroke-width="12" paint-order="stroke" stroke-linejoin="round">${esc(txt)}</text>`;
        x += tw(txt, size) + sp;
      }
    });
    void space;
    const bw = Math.max(...lineW) + 64, bh = lines.length * lh + 34;
    return `<g opacity="${f2(op)}" transform="translate(540 ${CAP_Y}) scale(${f2(s)})">
      <rect x="${f2(-bw / 2)}" y="${f2(-bh / 2)}" width="${f2(bw)}" height="${f2(bh)}" rx="22" fill="rgba(4,8,16,0.58)" stroke="rgba(255,210,63,0.35)" stroke-width="2"/>
      ${out}
    </g>`;
  }

  /* ---------------------------------------------------------------- the shrug (gag 1) */
  function shrugAmount(t) {
    // up on "Blame" (5.12), hold through "the map", settle by ~6.25 with a little rebound
    const up = eob(clamp((t - 4.80) / 0.42, 0, 1));
    const down = eoc(clamp((t - 5.78) / 0.40, 0, 1));
    const reb = Math.sin(clamp((t - 6.05) / 0.35, 0, 1) * Math.PI) * 0.12;
    return clamp(up * (1 - down) + reb * (t > 6.05 ? 1 : 0), 0, 1.2);
  }
  function sheetScale(t) { return 1 - 0.14 * win(t, 4.62, 6.45, 0.35, 0.45); }
  let warpScaleEl = null;
  function buildWarp() {
    // displacement map: G > 0.5 pulls content UP; strongest at the outer top corners (shoulders), zero at centre
    const cw = 108, ch = 192, pad = 0.25; // map covers the filter region (element ±25 %)
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const g = cv.getContext('2d'); const id = g.createImageData(cw, ch);
    for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
      const x = (i / (cw - 1)) * (1 + 2 * pad) - pad, y = (j / (ch - 1)) * (1 + 2 * pad) - pad; // element-relative
      const side = Math.pow(clamp(Math.abs(x - 0.5) * 2, 0, 1.3), 1.7);       // 0 centre → 1 edges
      const top = 1 - clamp(y, 0, 1) * 0.75;                                   // shoulders: the top lifts most
      const dy = clamp(side * top, 0, 1);
      const dx = clamp((x - 0.5) * 2, -1, 1) * side * 0.18 * top;              // shoulders hunch inward a touch
      const o = (j * cw + i) * 4;
      id.data[o] = Math.round(255 * (0.5 + 0.5 * dx));
      id.data[o + 1] = Math.round(255 * (0.5 + 0.5 * dy));
      id.data[o + 2] = 128; id.data[o + 3] = 255;
    }
    g.putImageData(id, 0, 0);
    const url = cv.toDataURL('image/png');
    const holder = document.createElement('div');
    holder.innerHTML = `<svg width="0" height="0" style="position:absolute"><filter id="shrugWarp" filterUnits="userSpaceOnUse" x="${-W * pad}" y="${-H * pad}" width="${W * (1 + 2 * pad)}" height="${H * (1 + 2 * pad)}" color-interpolation-filters="sRGB">
      <feImage href="${url}" x="${-W * pad}" y="${-H * pad}" width="${W * (1 + 2 * pad)}" height="${H * (1 + 2 * pad)}" preserveAspectRatio="none" result="m"/>
      <feDisplacementMap in="SourceGraphic" in2="m" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`;
    document.body.appendChild(holder);
    warpScaleEl = holder.querySelector('feDisplacementMap');
  }


  /* ---------------------------------------------------------------- frame */
  function renderFrameImpl(t) {
    if (!META) return;
    t = clamp(t, 0, T_END);
    const c = camAt(t);
    cam.x = c.x; cam.y = c.y; cam.z = c.z;
    // impact shakes: hook slam, dead-end, NO stamp
    let sh = 0;
    for (const [t0, amp, d] of [[0, 10, 0.35], [24.36, 5, 0.3], [44.42, 14, 0.45]]) {
      const a = t - t0;
      if (a >= 0 && a < d) sh += amp * (1 - a / d);
    }
    cam.sx = Math.sin(t * 83) * sh; cam.sy = Math.cos(t * 71) * sh;

    // ---- map layers + soft overlays
    const ntFill = Math.max(win(t, 8.2, 10.4, 0.5, 0.6) * 0.95, win(t, 37.4, 44.9, 0.5, 0.6) * 0.8);
    const desert = Math.max(
      0.35 * (1 - ss(2.6, 4.4, t)) + 0.35 * ss(50.9, T_END, t),            // first-frame hint (+ loop)
      win(t, 18.7, 21.9, 0.8, 0.8) * (0.62 + 0.12 * Math.sin(t * 3.1)),       // "thousands of km of desert"
      win(t, 21.5, 37.6, 0.8, 0.8) * 0.32
    );
    const shr = shrugAmount(t);
    const sc = sheetScale(t);
    sheetEl.style.transform = sc < 0.9995 ? `scale(${sc})` : 'none';
    sheetEl.style.boxShadow = sc < 0.9995 ? `0 30px 80px rgba(0,0,0,${f2(0.7 * (1 - sc) / 0.13)})` : 'none';
    const bo = clamp((1 - sc) / 0.14, 0, 1);
    borderEl.style.display = bo > 0.01 ? 'block' : 'none';
    borderEl.style.boxShadow = `inset 0 0 0 ${f2(12 * bo)}px rgba(255,248,230,${f2(0.95 * bo)}), inset 0 0 40px rgba(0,0,0,${f2(0.5 * bo)})`;
    const extra = { nt_fill: ntFill, desert };
    placeLayer(mapFull, extra);
    if (shr > 0.002) {
      warpScaleEl.setAttribute('scale', f2(260 * shr));
      sheetEl.style.filter = 'url(#shrugWarp)';
      curlEl.style.display = 'block';
      curlEl.style.opacity = f2(clamp(shr, 0, 1));
    } else {
      sheetEl.style.filter = 'none';
      curlEl.style.display = 'none';
    }

    // ---- map-space graphics
    capActive = !!(CAPS && CAPS.find((g) => t >= g.start - 0.1 && t < g.end + 0.1));
    let fx = '';
    const sD = S(P.darwin), sB = S(P.birdum), sA = S(P.alice);

    // NT state borders (crisp vector over the soft fill)
    if (ntFill > 0.01) {
      const bl = densify([[NT_COAST.w, 129.0], [-26.0, 129.0], [-26.0, 138.0], [NT_COAST.e, 138.0]], 10).map(S);
      const dr = clamp((t - 8.2) / 0.9, 0, 1) || (t > 37 ? 1 : 0);
      const p = partial(bl, t > 37 ? clamp((t - 37.4) / 0.8, 0, 1) : dr);
      fx += `<g opacity="${f2(ntFill)}"><path d="${polyPath(p.pts)}" fill="none" stroke="#fff" stroke-width="12" opacity="0.22" filter="url(#soft)"/>
        <path d="${polyPath(p.pts)}" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="${t > 37 ? '14 9' : 'none'}" stroke-linecap="round"/></g>`;
    }
    // Region label
    {
      const op = win(t, 8.35, 10.6, 0.35, 0.4);
      if (op > 0.01) { const q = S([-19.6, 133.4]); fx += label('NORTHERN AUSTRALIA', q[0], q[1], { size: 44, op, sc: eob(clamp((t - 8.35) / 0.45, 0, 1)), ls: 4 }); }
    }

    // Japanese intent arrow (frame 1 + loop) — bold white dashed with arrowhead
    {
      const pr = Math.max(lerp(0.55, 1, eoc(clamp(t / 1.3, 0, 1))) * (1 - ss(6.0, 6.6, t)), ss(50.9, T_END, t) * 0.55);
      const op = Math.max(1 - ss(6.0, 6.6, t), ss(50.9, 51.3, t));
      if (pr > 0.01 && op > 0.01) {
        const sp = INTENT_LL.map(S);
        const p = partial(sp, pr);
        const d = polyPath(p.pts);
        const off = -t * 46;
        const h = p.head, a = p.ang;
        fx += `<g opacity="${f2(op)}">
          <path d="${d}" fill="none" stroke="#c81e1e" stroke-width="20" opacity="0.35" filter="url(#soft)"/>
          <path d="${d}" fill="none" stroke="#0b0f18" stroke-width="13" stroke-dasharray="30 18" stroke-dashoffset="${f2(off)}" stroke-linecap="round" opacity="0.6"/>
          <path d="${d}" fill="none" stroke="#fff" stroke-width="8" stroke-dasharray="30 18" stroke-dashoffset="${f2(off)}" stroke-linecap="round"/>
          <g transform="translate(${f2(h[0])} ${f2(h[1])}) rotate(${f2(a * 180 / Math.PI)})" filter="url(#ds)"><path d="M14,0 L-26,-22 L-16,0 L-26,22 Z" fill="#fff" stroke="#0b0f18" stroke-width="3"/></g>
        </g>`;
      }
    }

    // Darwin marker: small dot+label in the open/loop; pin drop at "Darwin" (9.96)
    {
      const opDot = Math.max(1 - ss(9.7, 10.0, t), ss(50.9, 51.4, t)) * (t < 6.0 || t > 50.9 ? 1 : 1 - ss(6.0, 6.3, t) + ss(6.3, 6.4, t) * (t < 9.9 ? 1 : 0));
      if (opDot > 0.01) {
        fx += dot(sD[0], sD[1], 9, opDot);
        fx += label('DARWIN', sD[0] + 22, sD[1] - 34, { size: 46, op: opDot, anchor: 'start' });
      }
      const pinOp = win(t, 9.9, 24.0, 0.05, 0.4) || win(t, 37.5, 45.4, 0.3, 0.5);
      if (t >= 9.9 && t < 45.4 && !(t > 24.0 && t < 37.5)) {
        const t0 = t < 37.5 ? 9.96 : 37.6;
        fx += `<g opacity="${f2(pinOp)}">${pin(sD[0], sD[1], t0, t)}</g>`;
        const lop = pinOp * (t < 17.4 || t > 37.5 ? 1 : 1);
        fx += label('DARWIN', sD[0] + 34, sD[1] - 70, { size: t > 17 && t < 22 ? 36 : 46, op: lop * clamp((t - t0 - 0.25) / 0.3, 0, 1), anchor: 'start' });
      }
    }
    // "had already been bombed" — soft shock rings (no gore)
    if (t > 10.95 && t < 12.6) {
      for (let i = 0; i < 3; i++) {
        const a = (t - 10.98 - i * 0.22) / 0.9;
        if (a <= 0 || a >= 1) continue;
        fx += `<circle cx="${f2(sD[0] + [-40, 30, -6][i])}" cy="${f2(sD[1] + [16, -10, 40][i])}" r="${f2(12 + 90 * eoc(a))}" fill="rgba(255,120,40,${f2(0.22 * (1 - a))})" stroke="#ffb347" stroke-width="${f2(5 * (1 - a))}" opacity="${f2(1 - a)}"/>`;
      }
    }
    // 1942 chip beside Darwin
    {
      const op = win(t, 10.25, 16.2, 0.3, 0.4);
      if (op > 0.01) {
        const s = eob(clamp((t - 10.25) / 0.45, 0, 1));
        fx += `<g opacity="${f2(op)}" transform="translate(${f2(sD[0] - 150)} ${f2(sD[1] - 150)}) scale(${f2(s)}) rotate(-4)" filter="url(#ds)">
          <rect x="-82" y="-36" width="164" height="72" rx="14" fill="#ffd23f" stroke="#1b1200" stroke-width="5"/>
          <text text-anchor="middle" y="17" font-size="48" font-weight="900" fill="#111" letter-spacing="2">1942</text></g>`;
      }
    }
    // "Most of its people were gone" — town dots drift away and fade
    if (t > 10.2 && t < 14.2) {
      const app = ss(10.4, 10.9, t);
      for (let i = 0; i < 46; i++) {
        const a0 = hash(i) * Math.PI * 2, r0 = 12 + hash(i + 7) * 58;
        const go = ss(12.3 + hash(i + 3) * 0.5, 13.4 + hash(i + 3) * 0.5, t);
        const dirA = 0.9 + hash(i + 11) * 1.5; // mostly southward/eastward (evacuation)
        const x = sD[0] + Math.cos(a0) * r0 + Math.cos(dirA) * 260 * go;
        const y = sD[1] + Math.sin(a0) * r0 * 0.7 + Math.sin(dirA) * 260 * go;
        fx += `<circle cx="${f2(x)}" cy="${f2(y)}" r="7.5" fill="#ffe7b0" stroke="#3a2a10" stroke-width="2" opacity="${f2(app * (1 - go))}"/>`;
      }
    }
    // Landing arrow (13.7 → 15.0) + landing craft chevrons; fades on the whip south
    {
      const pr = eio(clamp((t - 13.70) / 0.85, 0, 1));
      const op = (1 - ss(16.2, 16.8, t)) * (pr > 0 ? 1 : 0);
      if (op > 0.01) {
        const sp = LANDING_LL.map(S);
        const p = partial(sp, pr);
        const d = polyPath(p.pts), h = p.head;
        fx += `<g opacity="${f2(op)}">
          <path d="${d}" fill="none" stroke="#000" stroke-width="30" opacity="0.35" filter="url(#soft)" transform="translate(4 8)"/>
          <path d="${d}" fill="none" stroke="#7a0d0d" stroke-width="26" stroke-linecap="round"/>
          <path d="${d}" fill="none" stroke="#e8402f" stroke-width="18" stroke-linecap="round"/>
          <path d="${d}" fill="none" stroke="#ffb0a0" stroke-width="4" stroke-linecap="round" opacity="0.7" transform="translate(-2 -3)"/>
          <g transform="translate(${f2(h[0])} ${f2(h[1])}) rotate(${f2(p.ang * 180 / Math.PI)})" filter="url(#ds)"><path d="M30,0 L-22,-34 L-10,0 L-22,34 Z" fill="#e8402f" stroke="#7a0d0d" stroke-width="5" stroke-linejoin="round"/></g>`;
        for (let i = 0; i < 3; i++) {
          const q = partial(sp, clamp(pr - 0.18 - i * 0.16 + ((t * 0.35) % 0.16), 0, 1));
          if (pr < 0.25 + i * 0.16) continue;
          fx += `<g transform="translate(${f2(q.head[0])} ${f2(q.head[1])}) rotate(${f2(q.ang * 180 / Math.PI)})"><path d="M-10,-12 L4,0 L-10,12" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
        }
        fx += '</g>';
        if (pr >= 1) { // beach ripples
          for (let i = 0; i < 2; i++) {
            const a = ((t - 14.55 - i * 0.45) % 0.9) / 0.9;
            if (t < 14.55 + i * 0.45) continue;
            fx += `<circle cx="${f2(h[0])}" cy="${f2(h[1])}" r="${f2(14 + 44 * a)}" fill="none" stroke="#fff" stroke-width="${f2(4 * (1 - a))}" opacity="${f2(op * (1 - a))}"/>`;
          }
        }
      }
    }

    // ---- "Thousands of kilometres of desert … and the cities"
    {
      const pr = eio(clamp((t - 19.2) / 1.2, 0, 1));
      const op = win(t, 19.2, 21.7, 0.1, 0.5);
      if (op > 0.01 && pr > 0) {
        const a = sD, b = S(P.adelaide);
        const e = [lerp(a[0], b[0], pr), lerp(a[1], b[1], pr)];
        fx += `<g opacity="${f2(op)}"><line x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(e[0])}" y2="${f2(e[1])}" stroke="#000" stroke-opacity="0.5" stroke-width="7"/>
          <line x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(e[0])}" y2="${f2(e[1])}" stroke="#fff" stroke-width="3.5" marker-start="url(#ah)" ${pr >= 1 ? 'marker-end="url(#ah)"' : ''}/></g>`;
        const m = [lerp(a[0], b[0], 0.5), lerp(a[1], b[1], 0.5)];
        const ku = clamp((t - 19.95) / 0.45, 0, 1);
        fx += kmCallout(KM_ADL, m[0] + 120, m[1] - 10, eob(ku), op * ku);
      }
      const cities = [['ADELAIDE', P.adelaide, 0, 'end'], ['MELBOURNE', P.melbourne, 0.12, 'end'], ['SYDNEY', P.sydney, 0.24, 'end'], ['BRISBANE', P.brisbane, 0.36, 'end'], ['PERTH', P.perth, 0.18, 'start']];
      for (const [nm, ll, dl, anc] of cities) {
        const t0 = 20.62 + dl;
        const op2 = win(t, t0, 21.75, 0.2, 0.45);
        if (op2 <= 0.01) continue;
        const q = S(ll);
        const u = eob(clamp((t - t0) / 0.35, 0, 1));
        fx += `<g opacity="${f2(op2)}"><circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="${f2(26 * u)}" fill="none" stroke="#ffd23f" stroke-width="3" opacity="${f2(1 - clamp((t - t0) / 0.8, 0, 1))}"/></g>`;
        fx += dot(q[0], q[1], 8 * u, op2);
        fx += label(nm, q[0] + (anc === 'end' ? -16 : 16), q[1] - 28, { size: 32, op: op2, sc: u, anchor: anc, ls: 1.5 });
      }
    }

    // ---- Railways (gag 2) — self-draw Darwin → Birdum, Alice Springs stub from the south
    const railOp = 1 - ss(37.4, 38.4, t);
    const nPts = RAIL_N_S.map(S);
    const nFrac = eio(clamp((t - 21.70) / 2.62, 0, 1));
    if (t > 21.6 && t < 38.5) {
      const r = rail(nPts, nFrac, railOp);
      fx += r.svg;
      if (nFrac < 1) fx += headGlow(r.head, t, railOp);
      const bu = clamp((t - 24.30) / 0.3, 0, 1);
      if (bu > 0) fx += bufferStop(sB[0], sB[1] + 12, Math.PI / 2, eob(bu), railOp);
    }
    const sPts = RAIL_S_S.map(S);
    const sFrac = eio(clamp((t - 25.45) / 1.70, 0, 1));
    if (t > 25.4 && t < 38.5) {
      const r = rail(sPts, sFrac, railOp);
      fx += r.svg;
      if (sFrac < 1) fx += headGlow(r.head, t, railOp);
      const bu = clamp((t - 27.10) / 0.3, 0, 1);
      if (bu > 0) fx += bufferStop(sA[0], sA[1] - 12, -Math.PI / 2, eob(bu), railOp);
    }
    // place labels
    {
      const opB = win(t, 24.38, 38.4, 0.25, 0.6);
      if (opB > 0.01) fx += label('BIRDUM', sB[0] - 26, sB[1] + 4, { size: 46, op: opB, sc: eob(clamp((t - 24.38) / 0.4, 0, 1)), anchor: 'end' });
      const opA = win(t, 27.12, 38.4, 0.25, 0.6);
      if (opA > 0.01) fx += label('ALICE SPRINGS', sA[0] - 26, sA[1] + 40, { size: 46, op: opA, sc: eob(clamp((t - 27.12) / 0.4, 0, 1)), anchor: 'end' });
    }
    // dead-end sign at Birdum (24.34)
    if (t > 24.3 && t < 38.4) fx += `<g opacity="${f2(railOp)}">${deadEndSign(sB[0] + 150, sB[1] + 30, 24.34, t)}</g>`;

    // ---- "In between?" gap pulse + distance line + ~1,000 km (gag 3 setup)
    {
      const op = win(t, 27.9, 37.6, 0.4, 0.8);
      if (op > 0.01) {
        const pulse = 0.5 + 0.5 * Math.sin((t - 27.9) * 5);
        const gp = GAP_LL.map(S);
        const d = polyPath(gp);
        fx += `<path d="${d}" fill="none" stroke="#ff5a3c" stroke-width="${f2(46 + 14 * pulse)}" stroke-linecap="round" opacity="${f2(op * (0.16 + 0.1 * pulse) * (1 - ss(29.6, 30.2, t) * 0.5))}" filter="url(#soft)"/>`;
        const lp = eio(clamp((t - 29.55) / 0.8, 0, 1));
        if (lp > 0) {
          const g2 = [[sB[0] + 0, sB[1] + 40], [sA[0], sA[1] - 40]];
          const e = [lerp(g2[0][0], g2[1][0], lp), lerp(g2[0][1], g2[1][1], lp)];
          fx += `<g opacity="${f2(op)}"><line x1="${f2(g2[0][0])}" y1="${f2(g2[0][1])}" x2="${f2(e[0])}" y2="${f2(e[1])}" stroke="#000" stroke-opacity="0.5" stroke-width="7"/>
            <line x1="${f2(g2[0][0])}" y1="${f2(g2[0][1])}" x2="${f2(e[0])}" y2="${f2(e[1])}" stroke="#fff" stroke-width="3.5" stroke-dasharray="16 10" marker-start="url(#ah)" ${lp >= 1 ? 'marker-end="url(#ah)"' : ''}/></g>`;
          // callout sits on the visible part of the line, clear of the caption band
          let my_ = lerp(g2[0][1], g2[1][1], 0.5);
          my_ = clamp(my_, Math.min(g2[0][1] + 140, 1120), 1120);
          const u = (my_ - g2[0][1]) / Math.max(1, g2[1][1] - g2[0][1]);
          const mx_ = lerp(g2[0][0], g2[1][0], clamp(u, 0, 1));
          const ku = clamp((t - 29.95) / 0.45, 0, 1);
          fx += kmCallout('~1,000 km', mx_ + 190, my_, eob(ku), op * ku);
        }
      }
    }
    // Train (gag 3): chugs out from up the line, rolls through Birdum to the end of track, stops, sad toot
    if (t > 30.75 && t < 38.4) {
      const tr0 = 30.85, tr1 = 32.15;
      const startFrac = 0.66; // ≈ Katherine
      const u = clamp((t - tr0) / (tr1 - tr0), 0, 1);
      const ef = u < 1 ? u * u * (3 - 2 * u) * 0.25 + u * 0.75 : 1; // steady chug, slight ease
      const fr = lerp(startFrac, 1, ef);
      const p = partial(nPts, fr);
      const moving = t < tr1;
      const jolt = t > tr1 && t < tr1 + 0.25 ? Math.sin((t - tr1) * 40) * 3 * (1 - (t - tr1) / 0.25) : 0;
      const sad = ss(32.3, 32.9, t);
      const op = clamp((t - 30.75) / 0.2, 0, 1) * railOp;
      fx += `<g opacity="${f2(op)}">`;
      fx += puffs(p.head[0], p.head[1] - 20, t, tr0, moving ? t : tr1, 7);
      fx += train(p.head[0] + jolt, p.head[1], p.ang, t, moving, sad);
      fx += sadPuff(p.head[0] + 10, p.head[1] - 30, t, 32.30);
      fx += '</g>';
    }
    // "That's not a road into Australia" — a dashed road-intent tries to push south and fizzles in the gap
    {
      const pr = eio(clamp((t - 32.9) / 1.3, 0, 1));
      const op = win(t, 32.9, 34.9, 0.2, 0.6);
      if (op > 0.01) {
        const sp = ROADTRY_LL.map(S);
        const p = partial(sp, pr);
        fx += `<path d="${polyPath(p.pts)}" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="18 14" stroke-dashoffset="${f2(-t * 60)}" stroke-linecap="round" opacity="${f2(op * 0.9)}"/>`;
        if (pr > 0.86) { // fizzle: the head breaks into fading specks
          const k = clamp((pr - 0.86) / 0.14, 0, 1);
          for (let i = 0; i < 9; i++) {
            const a = hash(i + 40) * Math.PI * 2, r = 8 + 50 * k * hash(i + 80);
            fx += `<circle cx="${f2(p.head[0] + Math.cos(a) * r)}" cy="${f2(p.head[1] + Math.sin(a) * r)}" r="${f2(4 * (1 - k) + 1)}" fill="#fff" opacity="${f2(op * (1 - k))}"/>`;
          }
        }
      }
    }
    // Tumbleweed (gag 4) across the gap
    {
      const t0 = 34.75, t1 = 37.2;
      if (t > t0 && t < t1 + 0.4) {
        const u = clamp((t - t0) / (t1 - t0), 0, 1);
        const a = [sB[0] + 30, sB[1] + 70], b = [sA[0] + 30, sA[1] - 80];
        const x = lerp(a[0], b[0], u) + Math.sin(u * 9) * 26;
        const hop = Math.abs(Math.sin(u * Math.PI * 5)) * 36;
        const y = lerp(a[1], b[1], u);
        const op = clamp((t - t0) / 0.2, 0, 1) * (1 - ss(t1, t1 + 0.35, t));
        fx += `<ellipse cx="${f2(x)}" cy="${f2(y + 60)}" rx="${f2(56 - hop * 0.5)}" ry="7" fill="#000" opacity="${f2(0.3 * op)}"/>`;
        for (let i = 0; i < 4; i++) { // wind streaks
          const ph = ((t * 1.3 + i * 0.27) % 1);
          const yy = y - 60 + i * 30 - 40 * ph;
          fx += `<path d="M${f2(x - 120 + i * 20)},${f2(yy)} q40,-10 90,0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="${f2(op * 0.5 * Math.sin(ph * Math.PI))}"/>`;
        }
        fx += tumbleweed(x, y - hop * 1.6, u * 1080, 2.1, op);
      }
    }

    // ---- The trap: generals saw it (ring tightens on the north), stranded army, supply arc to Japan
    {
      const op = win(t, 37.7, 44.9, 0.3, 0.5);
      if (op > 0.01) {
        const c0 = S([-14.5, 132.2]);
        const k = Math.pow(2, cam.z);
        const r0 = 1.25 * k * 3.8; // ~ NT-sized ring
        const u = eoc(clamp((t - 37.95) / 0.5, 0, 1));
        const r = lerp(r0 * 1.9, r0, u);
        const spin = t * 30;
        fx += `<g opacity="${f2(op * (0.4 + 0.6 * u))}"><circle cx="${f2(c0[0])}" cy="${f2(c0[1])}" r="${f2(r)}" fill="none" stroke="#ff4d3a" stroke-width="7" stroke-dasharray="26 16" transform="rotate(${f2(spin)} ${f2(c0[0])} ${f2(c0[1])})"/>
          <circle cx="${f2(c0[0])}" cy="${f2(c0[1])}" r="${f2(r)}" fill="rgba(255,60,40,${f2(0.10 * u)})" stroke="#ff4d3a" stroke-width="18" opacity="0.25" filter="url(#soft)"/></g>`;
      }
    }
    if (t > 38.8 && t < 45.4) {
      const op = 1 - ss(44.9, 45.4, t);
      fx += `<g opacity="${f2(op)}">${soldiers(sD[0] - 70, sD[1] + 150, 38.86, t)}</g>`;
    }
    {
      const pr = eio(clamp((t - 40.55) / 2.55, 0, 1));
      const op = win(t, 40.5, 46.4, 0.2, 0.7);
      if (op > 0.01 && pr > 0) {
        const sp = SUPPLY_LL.map(S);
        const p = partial(sp, pr);
        const d = polyPath(p.pts);
        fx += `<g opacity="${f2(op)}">
          <path d="${d}" fill="none" stroke="#000" stroke-width="12" opacity="0.35" filter="url(#soft)"/>
          <path d="${d}" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="22 14" stroke-dashoffset="${f2(t * 40)}" stroke-linecap="round"/>`;
        // thinning supply crates heading south along the line
        for (let i = 0; i < 5; i++) {
          const ph = ((t - 41.0) * 0.18 + i / 5) % 1;
          if (ph > pr || t < 41.0) continue;
          const q = partial(sp, 1 - ph);
          if ((1 - ph) > pr) continue;
          const fade = (ph < 0.15 ? ph / 0.15 : 1) * (1 - ph * 0.85);
          fx += `<g transform="translate(${f2(q.head[0])} ${f2(q.head[1])})" opacity="${f2(fade)}"><rect x="-11" y="-11" width="22" height="22" rx="3" fill="#c98b3c" stroke="#3a2306" stroke-width="3"/><path d="M-11,0H11M0,-11V11" stroke="#3a2306" stroke-width="2"/></g>`;
        }
        if (pr < 1) fx += headGlow(p.head, t);
        else fx += `<g transform="translate(${f2(p.head[0])} ${f2(p.head[1])}) rotate(${f2(p.ang * 180 / Math.PI)})"><path d="M14,0 L-20,-18 L-12,0 L-20,18 Z" fill="#fff" stroke="#0b0f18" stroke-width="3"/></g>`;
        fx += '</g>';
        const mid = partial(sp, 0.5).head;
        const ku = clamp((t - 42.2) / 0.45, 0, 1);
        fx += kmCallout(KM_JPN, mid[0] - 170, mid[1] + 10, eob(ku), op * ku);
      }
      const jop = win(t, 42.95, 46.4, 0.25, 0.6);
      if (jop > 0.01) {
        const j = S([36.4, 138.4]);
        fx += label('JAPAN', j[0] - 80, j[1] + 6, { size: 50, op: jop, sc: eob(clamp((t - 42.95) / 0.4, 0, 1)), anchor: 'end', ls: 5 });
      }
    }
    // "So they said no." — stamp on the north
    if (t > 44.2 && t < 47.2) {
      const q = S([-8.0, 128.0]);
      fx += noStamp(clamp(q[0], 280, 760), clamp(q[1], 420, 1000), 44.42, t);
    }

    fxEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS}${fx}</svg>`;

    // ---- screen-space UI
    let ui = '';
    ui += hookCard(t);
    ui += chip('SCENARIO ', 300, 270, 45.72, t, 51.15, '1');
    ui += envelope(250, 520, 2, 47.30, t, ss(47.9, 48.2, t) * (0.6 + 0.4 * Math.sin(t * 8)));
    ui += envelope(520, 520, 3, 47.48, t, ss(47.95, 48.25, t) * (0.6 + 0.4 * Math.cos(t * 8)));
    if (t > 51.0) ui = ui.replace(/^/, `<g opacity="${f2(1 - ss(51.0, 51.4, t))}">`) + '</g>';
    ui += downArrow(330, 1560, 49.70, t, 51.2);
    ui += captions(t);
    uiEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS}${ui}</svg>`;
  }

  /* ---------------------------------------------------------------- episode contract + readiness */
  window.EPISODE = {
    duration: T_END,
    fps: FPS,
    images: {},
    words: [],
    scenes: [
      { id: 'b01-hook-darwin', start: 0, end: 4.6 }, { id: 'b02-map-shrug', start: 4.6, end: 6.3 },
      { id: 'b03-north-bombed-gone', start: 6.3, end: 13.6 }, { id: 'b04-landing', start: 13.6, end: 16.1 },
      { id: 'b05-look-south', start: 16.1, end: 17.9 }, { id: 'b06-desert-cities', start: 17.9, end: 21.5 },
      { id: 'b07-rails-birdum-alice', start: 21.5, end: 27.9 }, { id: 'b08-gap-train-toot', start: 27.9, end: 34.6 },
      { id: 'b09-tumbleweed', start: 34.6, end: 36.6 }, { id: 'b10-trap-supply-no', start: 36.6, end: 45.0 },
      { id: 'b11-scenario-envelopes', start: 45.0, end: 48.9 }, { id: 'b12-related-arrow', start: 48.9, end: 50.9 },
      { id: 'b13-loop', start: 50.9, end: T_END },
    ],
  };

  let realReady = false, assetsReady = false;
  try {
    Object.defineProperty(window, '__ready', {
      configurable: true,
      get() { return realReady && assetsReady; },
      set(v) { realReady = !!v; },
    });
  } catch (e) { /* noop */ }

  window.renderFrame = function (t) {
    if (!assetsReady) return;
    if (!CAPS && window.EPISODE.words && window.EPISODE.words.length) CAPS = buildCaps(window.EPISODE.words);
    renderFrameImpl(t);
  };

  (async function boot() {
    META = await (await fetch('/img/map/meta.json')).json();
    build();
    buildWarp();
    const fonts = ['700 20px MontX', '800 20px MontX', '900 20px MontX', '400 20px AntonX'].map((f) => document.fonts.load(f));
    await Promise.all([...fonts, ...allImgs.map((im) => im.decode().catch(() => null))]);
    await document.fonts.ready;
    assetsReady = true;
    if (window.EPISODE.words && window.EPISODE.words.length) CAPS = buildCaps(window.EPISODE.words);
    renderFrameImpl(0);
  })();
})();
