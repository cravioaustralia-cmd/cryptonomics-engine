/* s17 — New Australia (Paraguay colony) / Mary Gilmore on the $10
 * Photo underlay + SVG motion graphics. SVG + renderFrame(t) + Playwright + ffmpeg only (no Remotion).
 * Beat times come from ../transcript.json (faster-whisper small.en word timings on the held Atlas VO,
 * seams checked against silencedetect).
 * On-screen text: the frame-1 hook `NEW AUSTRALIA` plus names, places, key facts and prop text only.
 * No VO-echo titles.
 * Maps (locked style): real satellite/topo basemaps (NASA Blue Marble topo+bathy; NASA MODIS Paraguay 2003,
 * georeferenced) with parchment fills, thick white outer glow, soft shadows and bold 3D labels.
 * Only Australia (Sydney) <-> Paraguay / New Australia (Nueva Londres) / Cosme is shown. Layers are built by
 * build-map-layers.py.
 * Soft facts (fact-check.md): `OVER 200` colonists; the war beat shows no casualty number; the rules beat
 * shows the rules only (no "why it failed" claim); split -> Cosme; `ABOUT 2,000` descendants; the $10 is a
 * stylised polymer-note frame (never the paper-series note) around a later Gilmore portrait.
 * Caption band (~70%, y≈1240–1450), the bottom UI zone and the right edge are kept clear of graphics.
 */
(function () {
  const HS = window.HS;
  const { W, H, clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic } = HS;

  const IMG = {
    sydney: ['/img/s17_04_sydney_cove_circular_quay_c1890.jpg', 1920, 1467],
    tar: ['/img/s17_05_royal_tar_ship.jpg', 1000, 761],
    strike: ['/img/s17_01_shearers_strike_hughenden_1891.jpg', 1000, 520],
    sketch: ['/img/s17_02_shearers_strike_sketches_1891.jpg', 724, 1000],
    lane: ['/img/s17_03_william_lane_portrait.jpg', 500, 748],
    plaza: ['/img/s17_10_nueva_londres_plaza.jpg', 1920, 1434],
    dawn: ['/img/s17_11_nueva_londres_landscape.jpg', 1280, 960],
    g1891: ['/img/s17_13_mary_gilmore_1891.jpg', 1920, 2311],
    dame: ['/img/s17_14_dame_mary_gilmore.jpg', 1920, 2605],
    colony: ['/img/s17_16_new_australia_colony_photo.jpg', 283, 226],
  };

  // ---------- maps (see build-map-layers.py / map-meta.json) ----------
  const VOY = {
    base: '/img/s17_20_voy_base.jpg',
    au: '/img/s17_21_voy_parch_au.png',
    py: '/img/s17_22_voy_parch_py.png',
    glow: '/img/s17_23_voy_glow.png',
    lon0: 138.0, lat0: -2.0, ppx: 30, ppy: 30 / Math.cos((32 * Math.PI) / 180), w: 5400, h: 3042,
  };
  const vxy = (lon, lat) => {
    const L = lon < 0 ? lon + 360 : lon;
    return [(L - VOY.lon0) * VOY.ppx, (VOY.lat0 - lat) * VOY.ppy];
  };
  const COL = {
    base: '/img/s17_24_col_base.jpg',
    parch: '/img/s17_25_col_parch.png',
    glow: '/img/s17_26_col_glow.png',
    w: 1920, h: 2052,
    cl: [-63.085403461357366, 0.004564232107414275, 0.00012597208278356559],
    ca: [-19.01253767185865, -1.9831683551998092e-5, -0.004251305256117307],
  };
  const cxy = (() => {
    const [a, b, c] = COL.cl;
    const [d, e, f] = COL.ca;
    const det = b * f - c * e;
    return (lon, lat) => {
      const u = lon - a;
      const v = lat - d;
      return [(f * u - c * v) / det, (-e * u + b * v) / det];
    };
  })();

  const PLACE = {
    sydney: [151.21, -33.86],
    newAus: [-56.53, -25.42], // Nueva Londres (New Australia), Caaguazú
    cosme: [-56.28, -26.32], // Colonia Cosme, Caazapá
    asuncion: [-57.63, -25.28],
  };
  // Royal Tar, July–Sept 1893: Sydney → south of New Zealand → Cape Horn → River Plate → up the Paraná /
  // Paraguay rivers to Asunción → overland to the colony. Approximate track (lon wrapped east of 180°).
  const ROUTE = [
    [151.21, -33.86], [153.8, -36.2], [158.5, -41], [164.5, -46.2], [170.5, -49.3], [180, -52], [200, -54.6],
    [230, -56.2], [260, -57.1], [280, -57.5], [290, -57.4], [293.4, -56.8], [296.2, -55.4], [299, -52.6],
    [301.2, -48.6], [303.4, -43.6], [304.9, -39.4], [304.6, -35.9], [303.2, -34.9], [301.6, -34.0],
    [300.2, -32.9], [299.5, -31.6], [300.3, -29.6], [301.2, -27.5], [301.9, -26.6], [302.37, -25.28],
    [303.47, -25.42],
  ];

  const DISPLAY = `'Oswald', 'DejaVu Sans Condensed', 'DejaVu Sans', sans-serif`;
  const SERIF = `'DejaVu Serif', 'Liberation Serif', serif`;
  const GOLD = '#ffc247';
  const RUST = '#c4541c';
  const CREAM = '#fff4dc';
  const INK = '#1a0f08';
  const RED = '#e8322a';
  const PAPER = '#f1e6c8';
  const NOTE = '#1d6fb8';
  const NOTE_D = '#0b3a6a';

  // ---------- VO beat times (s), from transcript.json ----------
  const T = {
    hundreds: 0.04, sailed: 1.58, south: 2.14, america: 2.32, build: 3.24, newW: 3.6, australia: 3.8,
    and: 4.94, ended: 5.5, ausMoney: 6.16, money: 6.82,
    y1893: 7.7, recession: 10.08, striking: 11.22, shearers: 11.46, beaten: 12.2,
    journalist: 13.26, william: 13.98, promises: 14.28, socialist: 15.08, paradise: 15.46, jungles: 16.56,
    paraguay1: 17.2,
    pwants: 18.24, settlers: 18.84, war: 19.82, wiped: 20.28, many: 20.74, men: 21.34,
    july: 22.27, jul1893: 22.66, ship: 24.4, royal: 24.64, leaves: 25.38, sydney: 25.72, over: 26.36,
    n200: 26.64, colonists: 27.12,
    but: 28.38, bans: 28.76, alcohol: 29.18, bans2: 30.26, mixing: 30.56, paraguayans: 31.16, only: 32.36,
    british: 32.56, allowed: 33.28,
    it: 34.22, splits: 34.28, year: 35.02, yet: 35.78, about: 35.86, n2000: 36.1, descendants: 36.88,
    still: 37.28, paraguay2: 38.02,
    one: 39.14, colonist: 39.26, poet: 40.02, mary: 40.3, gilmore: 40.66, whos: 41.62, onNote: 41.98,
    ausNote: 42.18, ten: 42.84, note: 43.12,
    because: 44.12,
    end: 44.856,
  };
  const LOOP_AT = 44.0;

  // ---------- helpers ----------
  const p01 = (t, t0, d) => clamp((t - t0) / d, 0, 1);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let uid = 0;
  const nid = (k) => k + uid++;
  const rnd = (i, k = 0) => {
    const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const f1 = (v) => v.toFixed(1);
  function shake(t, t0, amp = 22, dur = 0.45) {
    const k = p01(t, t0, dur);
    if (k <= 0 || k >= 1) return { x: 0, y: 0 };
    const a = amp * Math.pow(1 - k, 2);
    return { x: Math.sin(t * 91) * a, y: Math.cos(t * 77) * a };
  }

  /** Full-bleed cover crop: image px (fx,fy) lands at screen (sx,sy) at the given zoom (clamped to cover). */
  function photoGeom(key, o) {
    const [, iw, ih] = IMG[key];
    const s = Math.max(W / iw, H / ih) * (o.zoom || 1);
    const w = iw * s;
    const h = ih * s;
    const x = clamp((o.sx != null ? o.sx : W / 2) - (o.fx != null ? o.fx : iw / 2) * s, W - w, 0);
    const y = clamp((o.sy != null ? o.sy : H / 2) - (o.fy != null ? o.fy : ih / 2) * s, H - h, 0);
    return { x, y, w, h, s };
  }
  function photo(key, o = {}) {
    const g = photoGeom(key, o);
    const filt = o.filter ? ` filter="url(#${o.filter})"` : '';
    return `<image href="${IMG[key][0]}" x="${f1(g.x)}" y="${f1(g.y)}" width="${f1(g.w)}" height="${f1(g.h)}" preserveAspectRatio="none"${filt}/>
      ${o.tint ? `<rect width="${W}" height="${H}" fill="${o.tint}"/>` : ''}
      <rect width="${W}" height="${H}" fill="rgba(0,0,0,${o.dim != null ? o.dim : 0.45})"/>`;
  }

  /** Bold 3D/extruded label with drop shadow. */
  function text3d(str, x, y, o = {}) {
    const size = o.size || 96;
    const depth = o.depth != null ? o.depth : Math.round(size / 11);
    const fill = o.fill || '#ffffff';
    const side = o.side || '#5a3410';
    const anchor = o.anchor || 'middle';
    const ls = o.ls != null ? o.ls : 2;
    const fam = o.family || DISPLAY;
    const wt = o.weight || 700;
    let s = '';
    for (let i = depth; i >= 1; i--) {
      s += `<text x="${x + i * 0.9}" y="${y + i}" text-anchor="${anchor}" font-family="${fam}" font-weight="${wt}" font-size="${size}" letter-spacing="${ls}" fill="${side}">${esc(str)}</text>`;
    }
    s += `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${fam}" font-weight="${wt}" font-size="${size}" letter-spacing="${ls}" fill="${fill}" stroke="${o.stroke || INK}" stroke-width="${o.sw != null ? o.sw : size / 22}" paint-order="stroke">${esc(str)}</text>`;
    return `<g filter="url(#fDrop)"${o.opacity != null ? ` opacity="${o.opacity}"` : ''}>${s}</g>`;
  }
  /** Map label: 3D text over a thick white outer glow (locked map style). Drops in with p (0..1). */
  function mapLabel(str, x, y, p, o = {}) {
    if (p <= 0) return '';
    const k = easeOutBack(clamp(p / 0.7, 0, 1));
    const size = o.size || 64;
    const ls = o.ls != null ? o.ls : 5;
    const drop = (1 - easeOutCubic(clamp(p / 0.6, 0, 1))) * -60;
    return `<g transform="translate(${x} ${y + drop}) scale(${k}) translate(${-x} ${-y})" opacity="${clamp(p * 3, 0, 1)}">
      <text x="${x}" y="${y}" text-anchor="${o.anchor || 'middle'}" font-family="${DISPLAY}" font-weight="700" font-size="${size}" letter-spacing="${ls}" fill="none" stroke="#fff" stroke-width="${size / 4}" stroke-linejoin="round" opacity="0.92" filter="url(#fGlowS)">${esc(str)}</text>
      ${text3d(str, x, y, { size, ls, anchor: o.anchor, side: o.side || '#5a3410', fill: o.fill || CREAM, depth: o.depth })}
    </g>`;
  }
  /** Rounded chip that pops in with p (0..1). */
  function chip(label, x, y, p, o = {}) {
    if (p <= 0) return '';
    const size = o.size || 40;
    const w = o.w || label.length * size * 0.56 + size * 1.3;
    const h = size * 1.55;
    const k = easeOutBack(clamp(p / 0.6, 0, 1));
    return `<g transform="translate(${x} ${y}) scale(${k})" opacity="${clamp(p * 3, 0, 1)}" filter="url(#fDrop)">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h * 0.22}" fill="${o.fill || GOLD}" stroke="${o.stroke || 'rgba(255,255,255,0.9)'}" stroke-width="3"/>
      <text x="${o.dx || 0}" y="${size * 0.36}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="${size}" letter-spacing="2" fill="${o.color || INK}">${esc(label)}</text>
    </g>`;
  }
  /** Framed photo card (paper border, drop shadow), centred at (cx,cy). */
  function card(key, cx, cy, w, h, p, o = {}) {
    if (p <= 0) return '';
    const [url, iw, ih] = IMG[key];
    const k = easeOutBack(clamp(p / 0.5, 0, 1));
    const rot = lerp(o.rot0 != null ? o.rot0 : -10, o.rot != null ? o.rot : -2, easeOutCubic(clamp(p / 0.6, 0, 1)));
    const s = Math.max(w / iw, h / ih) * (o.zoom || 1);
    const pw = iw * s;
    const ph = ih * s;
    const x = clamp(-(o.fx != null ? o.fx : iw / 2) * s + w / 2, w - pw, 0);
    const y = clamp(-(o.fy != null ? o.fy : ih / 2) * s + h / 2, h - ph, 0);
    const id = nid('cc');
    const b = o.border != null ? o.border : 14;
    const filt = o.filter ? ` filter="url(#${o.filter})"` : '';
    return `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${rot.toFixed(2)}) scale(${(k * (o.scale || 1)).toFixed(4)})" opacity="${(clamp(p * 4, 0, 1) * (o.opacity != null ? o.opacity : 1)).toFixed(3)}">
      <rect x="${-w / 2 - b}" y="${-h / 2 - b}" width="${w + 2 * b}" height="${h + 2 * b}" rx="6" fill="${o.frame || PAPER}" filter="url(#fShadow)"/>
      <clipPath id="${id}"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}"/></clipPath>
      <g clip-path="url(#${id})">
        <image href="${url}" x="${f1(-w / 2 + x)}" y="${f1(-h / 2 + y)}" width="${f1(pw)}" height="${f1(ph)}" preserveAspectRatio="none"${filt}/>
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="url(#gLens)"/>
        ${o.inner || ''}
      </g>
      ${o.tag ? `<g transform="translate(0 ${h / 2 + b})">${chip(o.tag, 0, 0, 1, { size: 30, fill: INK, color: CREAM, stroke: GOLD })}</g>` : ''}
    </g>`;
  }
  /** Red rubber stamp that slams down at t0. */
  function stamp(label, x, y, t, t0, o = {}) {
    const p = p01(t, t0, 0.22);
    if (p <= 0) return '';
    const sc = lerp(2.6, 1, easeOutCubic(p));
    const size = o.size || 72;
    const w = label.length * size * 0.6 + 60;
    const col = o.color || RED;
    return `<g transform="translate(${x} ${y}) rotate(${o.rot != null ? o.rot : -8}) scale(${sc})" opacity="${clamp(p * 2, 0, 1) * 0.95}">
      ${o.plate ? `<rect x="${-w / 2 - 10}" y="${-size * 0.78 - 10}" width="${w + 20}" height="${size * 1.4 + 20}" rx="14" fill="${o.plate}" filter="url(#fDrop)"/>` : ''}
      <rect x="${-w / 2}" y="${-size * 0.78}" width="${w}" height="${size * 1.4}" rx="10" fill="none" stroke="${col}" stroke-width="9"/>
      <rect x="${-w / 2 + 12}" y="${-size * 0.78 + 12}" width="${w - 24}" height="${size * 1.4 - 24}" rx="6" fill="none" stroke="${col}" stroke-width="3"/>
      <text x="0" y="${size * 0.36}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="${size}" letter-spacing="6" fill="${col}" filter="url(#fStampInk)">${esc(label)}</text>
    </g>`;
  }
  /** Map pin: drops in with a bounce at t0, ground shadow + pulse rings. */
  function pin(x, y, t, t0, o = {}) {
    const p = p01(t, t0, 0.5);
    if (p <= 0) return '';
    const col = o.color || RED;
    const s = o.size || 1;
    const dy = (1 - easeOutBack(p)) * -140;
    let rings = '';
    for (let i = 0; i < 2; i++) {
      const q = ((t - t0 - 0.3 - i * 0.6) % 1.2) / 1.2;
      if (t - t0 - 0.3 - i * 0.6 < 0) continue;
      rings += `<ellipse cx="0" cy="0" rx="${20 + q * 70}" ry="${(20 + q * 70) * 0.45}" fill="none" stroke="#fff" stroke-width="${4 * (1 - q)}" opacity="${(1 - q) * 0.9}"/>`;
    }
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s})">
      ${rings}
      <ellipse cx="4" cy="3" rx="${18 * clamp(p * 1.4, 0, 1)}" ry="7" fill="#000" opacity="0.45" filter="url(#fBlur6)"/>
      <g transform="translate(0 ${f1(dy)})" filter="url(#fDrop)">
        <path d="M0 0 C -8 -22, -34 -40, -34 -66 A34 34 0 1 1 34 -66 C 34 -40, 8 -22, 0 0 Z" fill="${col}" stroke="#fff" stroke-width="5"/>
        <circle cx="0" cy="-66" r="13" fill="#fff"/>
      </g>
    </g>`;
  }

  // ---------- route geometry (Catmull-Rom densified in voyage-map px) ----------
  const ROUTE_PX = (() => {
    const P = ROUTE.map(([lo, la]) => vxy(lo, la));
    const out = [];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)];
      const p1 = P[i];
      const p2 = P[i + 1];
      const p3 = P[Math.min(P.length - 1, i + 2)];
      for (let k = 0; k < 12; k++) {
        const u = k / 12;
        const u2 = u * u;
        const u3 = u2 * u;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(P[P.length - 1]);
    const L = [0];
    for (let i = 1; i < out.length; i++) L.push(L[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
    return { pts: out, L, total: L[L.length - 1] };
  })();
  /** Point on the route at fraction f (0..1), in voyage-map px. */
  function routeAt(f) {
    const d = clamp(f, 0, 1) * ROUTE_PX.total;
    const { pts, L } = ROUTE_PX;
    let i = 1;
    while (i < L.length - 1 && L[i] < d) i++;
    const u = (d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
    return [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u), i];
  }
  /** Fraction of the route whose x first reaches map-x (for camera-follow). */
  function routePath(pr, f) {
    const [hx, hy, i] = routeAt(f);
    const pts = ROUTE_PX.pts.slice(0, i).concat([[hx, hy]]);
    return pts.map((p, k) => `${k ? 'L' : 'M'}${f1(pr.tx + p[0] * pr.s)} ${f1(pr.ty + p[1] * pr.s)}`).join(' ');
  }
  // fraction of route at the Paraguay river arrival (for pacing)
  const F_CAPEHORN = (() => {
    const tgt = vxy(293.4, -56.8);
    let best = 0;
    let bd = 1e9;
    for (let k = 0; k <= 400; k++) {
      const [x, y] = routeAt(k / 400);
      const d = Math.hypot(x - tgt[0], y - tgt[1]);
      if (d < bd) { bd = d; best = k / 400; }
    }
    return best;
  })();

  // ---------- voyage map ----------
  /** cam: {x (map px at screen centre), s, lat57y (screen y for lat −57.5)} */
  function voyProj(cam) {
    const s = cam.s;
    const tx = clamp(W / 2 - cam.x * s, W - VOY.w * s, 0);
    const y57 = vxy(0, -57.5)[1];
    const ty = clamp(cam.yMap != null ? cam.sy - cam.yMap * s : (cam.y57 != null ? cam.y57 : 1180) - y57 * s, H - VOY.h * s, 0);
    return { tx, ty, s, P: (lon, lat) => { const [x, y] = vxy(lon, lat); return [tx + x * s, ty + y * s]; } };
  }
  function voyMap(pr, o = {}) {
    const g = `transform="translate(${f1(pr.tx)} ${f1(pr.ty)}) scale(${pr.s.toFixed(4)})"`;
    const wh = `width="${VOY.w}" height="${VOY.h}"`;
    return `<g ${g}>
      <image href="${VOY.base}" ${wh}/>
      <image href="${VOY.glow}" ${wh}/>
      <image href="${VOY.au}" ${wh} opacity="${o.au != null ? o.au : 1}"/>
      <image href="${VOY.py}" ${wh} opacity="${o.py != null ? o.py : 1}"/>
    </g>
    <rect width="${W}" height="${H}" fill="url(#gVig)"/>`;
  }
  /** A barque silhouette (the Royal Tar was a sailing ship) at (x,y), facing right. */
  function shipIcon(x, y, s, t) {
    const bob = Math.sin(t * 6) * 3;
    const roll = Math.sin(t * 4.2) * 3;
    return `<g transform="translate(${f1(x)} ${f1(y + bob)}) rotate(${roll.toFixed(2)}) scale(${s})" filter="url(#fDrop)">
      <path d="M-52 -4 L50 -4 L38 16 L-40 16 Z" fill="${INK}" stroke="#fff" stroke-width="3"/>
      <line x1="-22" y1="-4" x2="-22" y2="-70" stroke="${INK}" stroke-width="4"/>
      <line x1="4" y1="-4" x2="4" y2="-84" stroke="${INK}" stroke-width="4"/>
      <line x1="28" y1="-4" x2="28" y2="-62" stroke="${INK}" stroke-width="4"/>
      <path d="M-40 -62 Q-22 -54 -4 -62 L-6 -24 Q-22 -18 -38 -24 Z" fill="${CREAM}" stroke="${INK}" stroke-width="2"/>
      <path d="M-14 -78 Q4 -70 22 -78 L20 -40 Q4 -34 -12 -40 Z" fill="${CREAM}" stroke="${INK}" stroke-width="2"/>
      <path d="M-12 -34 Q4 -28 20 -34 L18 -12 Q4 -8 -10 -12 Z" fill="${CREAM}" stroke="${INK}" stroke-width="2"/>
      <path d="M32 -56 L58 -8 L32 -8 Z" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>
      <path d="M4 -84 L22 -80 L4 -76 Z" fill="${RED}"/>
    </g>`;
  }
  function routeLayer(pr, f, t, o = {}) {
    if (f <= 0) return '';
    const d = routePath(pr, f);
    const [hx, hy] = routeAt(f);
    const sx = pr.tx + hx * pr.s;
    const sy = pr.ty + hy * pr.s;
    const dash = -((t * 60) % 40);
    return `<path d="${d}" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" transform="translate(5 8)" filter="url(#fBlur6)"/>
      <path d="${d}" fill="none" stroke="#fff" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" opacity="0.95" filter="url(#fGlowS)"/>
      <path d="${d}" fill="none" stroke="${RUST}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="22 18" stroke-dashoffset="${dash}"/>
      ${o.ship ? shipIcon(sx, sy - 6, o.shipScale || 0.9, t) : `<circle cx="${f1(sx)}" cy="${f1(sy)}" r="13" fill="${GOLD}" stroke="#fff" stroke-width="5" filter="url(#fGlow)"/>`}`;
  }

  // ---------- colony map ----------
  function colProj(cam) {
    const s = cam.s;
    const [cx, cy] = cxy(cam.lon, cam.lat);
    // free: the continental underlay fills beyond the image edges, so no cover clamp is needed
    const tx = cam.free ? (cam.sx != null ? cam.sx : W / 2) - cx * s : clamp((cam.sx != null ? cam.sx : W / 2) - cx * s, W - COL.w * s, 0);
    const ty = cam.free ? (cam.sy != null ? cam.sy : H / 2) - cy * s : clamp((cam.sy != null ? cam.sy : H / 2) - cy * s, H - COL.h * s, 0);
    return { tx, ty, s, P: (lon, lat) => { const [x, y] = cxy(lon, lat); return [tx + x * s, ty + y * s]; } };
  }
  function colMap(pr, o = {}) {
    const g = `transform="translate(${f1(pr.tx)} ${f1(pr.ty)}) scale(${pr.s.toFixed(4)})"`;
    const wh = `width="${COL.w}" height="${COL.h}"`;
    // parchment wipe: reveal west→east with a soft edge
    const wipe = o.wipe != null ? o.wipe : 1;
    const id = nid('cw');
    const parch = wipe <= 0 ? '' : wipe >= 1
      ? `<image href="${COL.parch}" ${wh}/>`
      : `<clipPath id="${id}"><rect x="0" y="0" width="${COL.w * wipe}" height="${COL.h}"/></clipPath><image href="${COL.parch}" ${wh} clip-path="url(#${id})"/>`;
    // continental underlay: the voyage basemap (Blue Marble) aligned to the colony image's georeference,
    // softened; the MODIS still is feathered into it at its edges
    let under = '';
    let mask = '';
    if (o.under) {
      const b = COL.cl[1];
      const f = -COL.ca[2];
      const kx = pr.s / (VOY.ppx * b);
      const ky = pr.s / (VOY.ppy * f);
      const ox = pr.tx + (pr.s * (VOY.lon0 - 360 - COL.cl[0])) / b;
      const oy = pr.ty + (pr.s * (COL.ca[0] - VOY.lat0)) / f;
      under = `<g transform="translate(${f1(ox)} ${f1(oy)}) scale(${kx.toFixed(5)} ${ky.toFixed(5)})" filter="url(#fSoft)"><image href="${VOY.base}" width="${VOY.w}" height="${VOY.h}"/></g>
        <rect width="${W}" height="${H}" fill="rgba(6,4,2,0.35)"/>`;
      mask = ` mask="url(#mColFeather)"`;
    }
    return `${under}<g ${g}>
      <g${mask}><image href="${COL.base}" ${wh}/></g>
      <g opacity="${o.glow != null ? o.glow : 1}"><image href="${COL.glow}" ${wh}/></g>
      ${parch}
    </g>
    <rect width="${W}" height="${H}" fill="url(#gVig)"/>`;
  }

  // ---------- props ----------
  /** Hook "NEW AUSTRALIA" block (frame 1). k: 0..1 entrance (1 = settled). */
  function hookBlock(k, t, o = {}) {
    if (k <= 0) return '';
    const sc = (o.scale || 1) * lerp(1.35, 1, easeOutBack(k));
    const sheen = ((t * 0.55) % 1.6) - 0.3; // light sweep across the letters
    const id = nid('hk');
    return `<g transform="translate(540 610) scale(${sc.toFixed(4)}) translate(-540 -610)" opacity="${clamp(k * 3, 0, 1) * (o.opacity != null ? o.opacity : 1)}">
      <text x="540" y="560" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="130" letter-spacing="26" fill="none" stroke="#fff" stroke-width="30" stroke-linejoin="round" opacity="0.5" filter="url(#fGlow)">NEW</text>
      <text x="540" y="740" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="178" letter-spacing="6" fill="none" stroke="#fff" stroke-width="34" stroke-linejoin="round" opacity="0.5" filter="url(#fGlow)">AUSTRALIA</text>
      ${text3d('NEW', 540, 560, { size: 130, ls: 26, fill: CREAM, side: '#6b3a12', depth: 12 })}
      ${text3d('AUSTRALIA', 540, 740, { size: 178, ls: 6, fill: GOLD, side: '#6b3a12', depth: 16 })}
      <clipPath id="${id}"><text x="540" y="740" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="178" letter-spacing="6">AUSTRALIA</text></clipPath>
      <rect x="${f1(100 + sheen * 900)}" y="560" width="90" height="220" fill="#fff" opacity="0.45" transform="skewX(-20)" clip-path="url(#${id})"/>
      <g transform="translate(540 820)">
        <line x1="-300" y1="0" x2="-60" y2="0" stroke="${GOLD}" stroke-width="4"/>
        <line x1="60" y1="0" x2="300" y2="0" stroke="${GOLD}" stroke-width="4"/>
        <path d="M-34 0 L0 -14 L34 0 L0 14 Z" fill="${GOLD}" stroke="${INK}" stroke-width="3"/>
      </g>
    </g>`;
  }
  /** Stylised polymer $10 frame (not a reproduction of the RBA note): blue guilloché, clear window,
   * oval portrait window. `portrait` is an SVG string drawn inside the oval. */
  function noteFrame(cx, cy, w, h, p, t, o = {}) {
    if (p <= 0) return '';
    const k = easeOutBack(clamp(p / 0.6, 0, 1));
    const rot = lerp(-14, o.rot != null ? o.rot : -3, easeOutCubic(clamp(p / 0.7, 0, 1)));
    const id = nid('nf');
    let guil = '';
    for (let j = 0; j < 14; j++) {
      let d = '';
      for (let x = -w / 2; x <= w / 2; x += 12) {
        const y = Math.sin(x / 38 + j * 0.45 + t * 0.6) * 18 + Math.sin(x / 91 - j) * 10 + (j - 7) * (h / 15);
        d += `${x === -w / 2 ? 'M' : 'L'}${x.toFixed(0)} ${y.toFixed(1)}`;
      }
      guil += `<path d="${d}" fill="none" stroke="#9fd0ff" stroke-width="1.6" opacity="0.28"/>`;
    }
    let rose = '';
    for (let j = 0; j < 36; j++) {
      rose += `<ellipse cx="0" cy="0" rx="${h * 0.3}" ry="${h * 0.11}" transform="rotate(${j * 5 + t * 8})" fill="none" stroke="#bfe2ff" stroke-width="1.3" opacity="0.35"/>`;
    }
    const ow = h * 0.62;
    const oh = h * 0.78;
    const ox = -w / 2 + w * 0.3;
    const shimmer = ((t * 0.7) % 2) - 0.5;
    return `<g transform="translate(${cx} ${cy}) rotate(${rot.toFixed(2)}) scale(${(k * (o.scale || 1)).toFixed(4)})" opacity="${clamp(p * 4, 0, 1)}">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="22" fill="url(#gNote)" stroke="#e8f4ff" stroke-width="4" filter="url(#fShadow)"/>
      <clipPath id="${id}"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="22"/></clipPath>
      <g clip-path="url(#${id})">
        ${guil}
        <g transform="translate(${w * 0.22} 0)">${rose}</g>
        <rect x="${w / 2 - w * 0.2}" y="${-h / 2 + 30}" width="${w * 0.13}" height="${h * 0.44}" rx="16" fill="#dff3ff" opacity="0.28" stroke="#fff" stroke-width="2"/>
        <rect x="${f1(-w / 2 + shimmer * w)}" y="${-h / 2}" width="${w * 0.12}" height="${h}" fill="#fff" opacity="0.16" transform="skewX(-18)"/>
      </g>
      <g>
        <ellipse cx="${ox}" cy="0" rx="${ow / 2 + 10}" ry="${oh / 2 + 10}" fill="${NOTE_D}" stroke="#cfe9ff" stroke-width="4"/>
        <clipPath id="${id}o"><ellipse cx="${ox}" cy="0" rx="${ow / 2}" ry="${oh / 2}"/></clipPath>
        <g clip-path="url(#${id}o)">${o.portrait ? o.portrait(ox, 0, ow, oh) : ''}</g>
      </g>
      <text x="${w / 2 - 36}" y="${-h / 2 + 98}" text-anchor="end" font-family="${DISPLAY}" font-weight="700" font-size="96" fill="#fff" stroke="${NOTE_D}" stroke-width="5" paint-order="stroke">10</text>
      <text x="${w / 2 - 36}" y="${h / 2 - 30}" text-anchor="end" font-family="${DISPLAY}" font-weight="700" font-size="64" fill="#cfe9ff" opacity="0.85">10</text>
      ${o.extra || ''}
    </g>`;
  }
  /** Sepia-toned image clipped into the note's oval. */
  const ovalImg = (key, fx, fy, zoom, filt) => (ox, oy, ow, oh) => {
    const [url, iw, ih] = IMG[key];
    const s = Math.max(ow / iw, oh / ih) * zoom;
    const x = ox - fx * s;
    const y = oy - fy * s;
    return `<image href="${url}" x="${f1(x)}" y="${f1(y)}" width="${f1(iw * s)}" height="${f1(ih * s)}" preserveAspectRatio="none"${filt ? ` filter="url(#${filt})"` : ''}/>`;
  };
  /** Recession line: plunging red line graph (no labels). */
  function plunge(x0, y0, w, h, p) {
    if (p <= 0) return '';
    const n = 26;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const fall = u < 0.35 ? u * 0.25 : 0.0875 + Math.pow((u - 0.35) / 0.65, 1.5) * 0.85;
      const jag = (rnd(i, 4) - 0.5) * 0.09 * (1 - u * 0.4);
      pts.push([x0 + u * w, y0 + (fall + jag + 0.04) * h]);
    }
    const m = Math.max(1, Math.floor(p * n));
    const u = p * n - m;
    const show = pts.slice(0, m + 1);
    if (m < n) show.push([lerp(pts[m][0], pts[m + 1][0], u), lerp(pts[m][1], pts[m + 1][1], u)]);
    const d = show.map((q, i) => `${i ? 'L' : 'M'}${f1(q[0])} ${f1(q[1])}`).join(' ');
    const last = show[show.length - 1];
    const prev = show[show.length - 2] || last;
    const ang = (Math.atan2(last[1] - prev[1], last[0] - prev[0]) * 180) / Math.PI;
    let grid = '';
    for (let i = 0; i <= 4; i++) grid += `<line x1="${x0}" y1="${y0 + (i * h) / 4}" x2="${x0 + w}" y2="${y0 + (i * h) / 4}" stroke="#fff" stroke-opacity="0.12" stroke-width="2"/>`;
    const area = `${d} L${f1(last[0])} ${y0 + h} L${x0} ${y0 + h} Z`;
    return `<g>
      <rect x="${x0 - 30}" y="${y0 - 30}" width="${w + 60}" height="${h + 60}" rx="18" fill="rgba(12,6,2,0.66)" stroke="rgba(255,194,71,0.4)" stroke-width="2"/>
      ${grid}
      <path d="${area}" fill="url(#gRed)" opacity="0.5"/>
      <path d="${d}" fill="none" stroke="${RED}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round" filter="url(#fGlowS)"/>
      <g transform="translate(${f1(last[0])} ${f1(last[1])}) rotate(${ang.toFixed(1)})"><path d="M-6 -20 L26 0 L-6 20 Z" fill="${RED}" stroke="#fff" stroke-width="3"/></g>
    </g>`;
  }
  /** Tear-off calendar pad: months flip until JULY, then 1893. */
  function calendar(cx, cy, t, t0) {
    const months = ['MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY'];
    const p = p01(t, t0 - 0.35, 0.4);
    if (p <= 0) return '';
    const k = easeOutBack(p);
    const flipDur = 0.09;
    const idx = clamp(Math.floor((t - (t0 - 0.35)) / flipDur), 0, months.length - 1);
    const u = ((t - (t0 - 0.35)) / flipDur) % 1;
    const tearing = idx < months.length - 1 ? u : 1;
    const w = 520;
    const h = 600;
    const page = (m, extra = '') => `
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="14" fill="${PAPER}" stroke="#b39a70" stroke-width="3"/>
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="150" rx="14" fill="${RED}"/>
      <rect x="${-w / 2}" y="${-h / 2 + 120}" width="${w}" height="30" fill="${RED}"/>
      <text x="0" y="${-h / 2 + 108}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="92" letter-spacing="10" fill="#fff">${m}</text>
      ${extra}`;
    const yp = p01(t, T.jul1893, 0.3);
    const year = yp > 0 ? `<g transform="translate(0 ${60 + (1 - easeOutBack(yp)) * 40})" opacity="${clamp(yp * 3, 0, 1)}">
        <text x="0" y="90" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="250" letter-spacing="4" fill="${INK}">1893</text></g>` : '';
    let rings = '';
    for (let i = 0; i < 7; i++) rings += `<rect x="${-w / 2 + 50 + i * 70}" y="${-h / 2 - 22}" width="16" height="44" rx="8" fill="#6b6b6b" stroke="#222" stroke-width="2"/>`;
    const under = page(months[idx], idx === months.length - 1 ? year : '');
    const top = tearing < 1 && idx < months.length - 1
      ? `<g transform="translate(0 ${-h / 2}) rotate(${-tearing * 70}) translate(0 ${h / 2})" opacity="${1 - tearing}">${page(months[idx])}</g>`
      : '';
    return `<g transform="translate(${cx} ${cy}) rotate(-3) scale(${k})" filter="url(#fShadow)">
      <rect x="${-w / 2 + 12}" y="${-h / 2 + 12}" width="${w}" height="${h}" rx="14" fill="#cbbd9a"/>
      ${idx === months.length - 1 ? under : page(months[idx + 1] || months[idx], '')}
      ${idx < months.length - 1 ? `<g>${page(months[idx])}</g>` : ''}
      ${top}
      ${rings}
    </g>`;
  }
  /** A small person glyph. */
  function person(x, y, s, fill, o = {}) {
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s})" opacity="${o.opacity != null ? o.opacity : 1}">
      <circle cx="0" cy="-46" r="15" fill="${fill}" stroke="${o.stroke || 'none'}" stroke-width="3"/>
      <path d="M-20 -24 Q0 -32 20 -24 L24 18 L12 18 L10 50 L-10 50 L-12 18 L-24 18 Z" fill="${fill}" stroke="${o.stroke || 'none'}" stroke-width="3"/>
    </g>`;
  }
  /** Round rule medallion; slash slams at tSlash. */
  function medallion(x, y, t, tIn, tSlash, icon) {
    const p = p01(t, tIn, 0.4);
    if (p <= 0) return '';
    const k = easeOutBack(p);
    const sp = p01(t, tSlash, 0.2);
    const sh = shake(t, tSlash, 10, 0.3);
    return `<g transform="translate(${x + sh.x} ${y + sh.y}) scale(${k})" filter="url(#fDrop)">
      <circle r="118" fill="${PAPER}" stroke="#6b4a22" stroke-width="6"/>
      <circle r="102" fill="none" stroke="#b39a70" stroke-width="3" stroke-dasharray="6 6"/>
      ${icon}
      ${sp > 0 ? `<g opacity="${clamp(sp * 2, 0, 1)}" transform="scale(${lerp(1.8, 1, easeOutCubic(sp))})">
        <circle r="92" fill="none" stroke="${RED}" stroke-width="18"/>
        <line x1="-64" y1="64" x2="64" y2="-64" stroke="${RED}" stroke-width="18" stroke-linecap="round"/></g>` : ''}
    </g>`;
  }
  const ICON_BOTTLE = `<g transform="translate(0 6)">
      <path d="M-14 -70 L14 -70 L14 -44 Q34 -30 34 -6 L34 58 Q34 66 26 66 L-26 66 Q-34 66 -34 58 L-34 -6 Q-34 -30 -14 -44 Z" fill="#3f6b3a" stroke="${INK}" stroke-width="5"/>
      <rect x="-24" y="-2" width="48" height="34" rx="4" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
      <rect x="-16" y="-82" width="32" height="14" rx="3" fill="#8a5a2a" stroke="${INK}" stroke-width="3"/></g>`;
  const ICON_MIX = `${person(-42, 22, 1.0, '#6b4a22')}${person(42, 22, 1.0, '#b36a2a')}
      <path d="M-14 -4 Q0 -14 14 -4" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
  function iconGate(t) {
    const c = easeInOutCubic(p01(t, T.allowed, 0.35));
    const a = lerp(62, 0, c);
    return `<g>
      <rect x="-76" y="-70" width="10" height="130" fill="#6b4a22"/><rect x="66" y="-70" width="10" height="130" fill="#6b4a22"/>
      <g transform="translate(-66 0) scale(${Math.cos((a * Math.PI) / 180).toFixed(3)} 1)">
        <rect x="0" y="-60" width="66" height="110" fill="none" stroke="${INK}" stroke-width="6"/>
        <line x1="0" y1="-5" x2="66" y2="-5" stroke="${INK}" stroke-width="5"/><line x1="0" y1="50" x2="66" y2="-60" stroke="${INK}" stroke-width="4"/></g>
      <g transform="translate(66 0) scale(${-Math.cos((a * Math.PI) / 180).toFixed(3)} 1)">
        <rect x="0" y="-60" width="66" height="110" fill="none" stroke="${INK}" stroke-width="6"/>
        <line x1="0" y1="-5" x2="66" y2="-5" stroke="${INK}" stroke-width="5"/><line x1="0" y1="50" x2="66" y2="-60" stroke="${INK}" stroke-width="4"/></g>
    </g>`;
  }
  /** Sea-spray / dust motes (kept out of the caption band). */
  function motes(t, n = 36, o = {}) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const sp = 14 + rnd(i, 1) * 40;
      const x = (((rnd(i, 2) * W + t * sp * (o.dir || 1)) % W) + W) % W;
      const y = rnd(i, 3) * 1180 + Math.sin(t * 0.8 + i) * 18;
      const r = 1 + rnd(i, 4) * 2.4;
      s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r.toFixed(1)}" fill="${o.col || '#fff1d2'}" opacity="${((0.15 + rnd(i, 5) * 0.4) * (o.alpha != null ? o.alpha : 1)).toFixed(2)}"/>`;
    }
    return s;
  }
  /** Horizontal speed streaks for fast map pans (kept above the caption band). */
  function speedLines(t) {
    let s = '';
    for (let i = 0; i < 22; i++) {
      const y = 120 + rnd(i, 71) * 1060;
      const len = 180 + rnd(i, 72) * 360;
      const x = W - ((t * (1800 + rnd(i, 73) * 1400) + rnd(i, 74) * 3000) % (W + len + 400));
      s += `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x + len)}" y2="${f1(y)}" stroke="#fff" stroke-width="${(2 + rnd(i, 75) * 4).toFixed(1)}" stroke-linecap="round" opacity="${(0.2 + rnd(i, 76) * 0.35).toFixed(2)}"/>`;
    }
    return s;
  }
  /** Sun-ray burst (paradise promise). */
  function rays(cx, cy, t, p) {
    if (p <= 0) return '';
    let s = '';
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * 360 + t * 6;
      s += `<path d="M0 0 L1400 -70 L1400 70 Z" transform="rotate(${a.toFixed(1)})" fill="#ffd98a" opacity="${(0.07 + (i % 2) * 0.05).toFixed(2)}"/>`;
    }
    return `<g transform="translate(${cx} ${cy}) scale(${easeOutCubic(p)})" opacity="${clamp(p * 2, 0, 1)}">${s}<circle r="150" fill="#ffe7b0" opacity="0.35" filter="url(#fBlur14)"/></g>`;
  }
  /** Descendant dots blooming around (x,y). */
  function bloom(x, y, t, t0, n, spread) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const tt = t0 + rnd(i, 21) * 1.4;
      const p = p01(t, tt, 0.35);
      if (p <= 0) continue;
      const a = rnd(i, 22) * Math.PI * 2;
      const r = Math.sqrt(rnd(i, 23)) * spread;
      s += `<circle cx="${f1(x + Math.cos(a) * r)}" cy="${f1(y + Math.sin(a) * r * 0.8)}" r="${(5 * easeOutBack(p)).toFixed(1)}" fill="${GOLD}" stroke="#fff" stroke-width="2" opacity="0.9"/>`;
    }
    return `<g filter="url(#fGlowS)">${s}</g>`;
  }

  // ---------- scenes ----------
  const scenes = [];
  const scene = (id, start, end, draw, tin) => scenes.push({ id, start, end, draw, tin });

  // 1 · frame-1 hook: Sydney Cove c.1890 + NEW AUSTRALIA (exact state re-used by the loop)
  function openFrame(t, look = 1) {
    const z = 1.14 + t * 0.03;
    return `${photo('sydney', { zoom: z, fx: 1150, fy: 820, sx: 540, sy: 960, dim: 0.42, filter: 'fWarm' })}
      <rect width="${W}" height="${H}" fill="url(#gTop)" opacity="0.8"/>
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      ${motes(t, 30, { alpha: 0.7 })}
      ${hookBlock(1, t, { opacity: look })}`;
  }
  scene('open', 0, 1.35, (t) => {
    const out = p01(t, 1.08, 0.27);
    return `${openFrame(t)}${out > 0 ? `<rect width="${W}" height="${H}" fill="#fff" opacity="${(out * 0.25).toFixed(3)}"/>` : ''}`;
  });

  // 2 · voyage tease: fast pan Sydney → across the Pacific → Paraguay; NEW AUSTRALIA pin
  scene('tease', 1.35, 4.75, (t) => {
    const u = easeInOutCubic(p01(t, 1.4, 1.55));
    const zi = easeInOutCubic(p01(t, T.build - 0.3, 1.2));
    const [sx0] = vxy(...PLACE.sydney);
    const [sx1, sy1] = vxy(301.5, -27);
    const s0 = lerp(0.8, 0.84, u) + Math.sin(u * Math.PI) * -0.02;
    const pr0 = voyProj({ x: lerp(sx0 + 180, sx1, u), s: s0, y57: 1150 });
    const s = lerp(s0, 1.5, zi);
    const pr = zi <= 0 ? pr0 : voyProj({ x: sx1, s, yMap: sy1, sy: lerp(pr0.ty + sy1 * s0, 700, zi) });
    const vel = Math.sin(p01(t, 1.4, 1.55) * Math.PI);
    const f = clamp(easeInOutCubic(p01(t, 1.45, 1.6)), 0, 1);
    const [nx, ny] = pr.P(...PLACE.newAus);
    const [pyx, pyy] = pr.P(-58.4, -22.8);
    const [syx, syy] = pr.P(...PLACE.sydney);
    const pyGlow = p01(t, T.america, 0.4);
    return `${voyMap(pr, { py: pyGlow })}
      ${routeLayer(pr, f, t)}
      ${pin(syx, syy, t, 1.45, { color: RUST, size: 0.8 })}
      ${(() => { const [ax, ay] = pr.P(-65.5, -36.5); return mapLabel('SOUTH AMERICA', clamp(ax, 280, 800), clamp(ay, 300, 1120), p01(t, T.south, 0.5) * (1 - zi), { size: 58, ls: 6 }); })()}
      ${vel > 0.05 ? `<g opacity="${(vel * 0.8).toFixed(2)}">${speedLines(t)}</g>` : ''}
      ${pin(nx, ny, t, T.build, { color: RED })}
      ${mapLabel('PARAGUAY', clamp(pyx, 300, 780), pyy - 30, p01(t, T.newW - 0.35, 0.5), { size: 60, ls: 8, fill: CREAM })}
      ${mapLabel('NEW AUSTRALIA', clamp(nx + 20, 330, 760), ny + 150, p01(t, T.newW, 0.5), { size: 74, fill: GOLD })}
      ${motes(t, 18, { alpha: 0.4 })}`;
  }, { type: 'whip', d: 0.24 });

  // 3 · money tease: stylised polymer $10 with a silhouetted portrait + "?"
  scene('money', 4.75, 7.45, (t) => {
    const p = p01(t, T.and - 0.05, 0.5);
    const tp = p01(t, T.ausMoney, 0.4);
    const q = p01(t, T.ended, 0.35);
    const sh = shake(t, T.money, 14, 0.35);
    const sil = (ox, oy, ow, oh) => `${ovalImg('g1891', 1000, 1250, 1.25, 'fSil')(ox, oy, ow, oh)}
      <rect x="${ox - ow / 2}" y="${oy - oh / 2}" width="${ow}" height="${oh}" fill="url(#gRim)"/>
      ${q > 0 ? `<text x="${ox}" y="${oy + 70}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="${200 * easeOutBack(q)}" fill="${GOLD}" stroke="${INK}" stroke-width="8" paint-order="stroke">?</text>` : ''}`;
    let cash = '';
    for (let i = 0; i < 14; i++) {
      const tt = T.money + rnd(i, 31) * 0.3;
      const pp = p01(t, tt, 0.9);
      if (pp <= 0 || pp >= 1) continue;
      const a = -Math.PI / 2 + (rnd(i, 32) - 0.5) * 2.6;
      const r = pp * (260 + rnd(i, 33) * 260);
      cash += `<text x="${f1(540 + Math.cos(a) * r)}" y="${f1(640 + Math.sin(a) * r + pp * pp * 260)}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="${44 + rnd(i, 34) * 30}" fill="${GOLD}" stroke="${INK}" stroke-width="4" paint-order="stroke" opacity="${(1 - pp).toFixed(2)}" transform="rotate(${((rnd(i, 35) - 0.5) * 50).toFixed(0)} ${f1(540 + Math.cos(a) * r)} ${f1(640 + Math.sin(a) * r)})">$</text>`;
    }
    return `${photo('sydney', { zoom: 1.5, fx: 700, fy: 900, dim: 0.6, filter: 'fBlurSepia' })}
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      ${rays(540, 640, t, p * 0.7)}
      <g transform="translate(${sh.x} ${sh.y})">
        ${noteFrame(540, 640, 900, 470, p, t, { portrait: sil })}
        ${chip('$10', 540, 1010, tp, { size: 76, w: 250, fill: GOLD })}
      </g>
      ${cash}`;
  }, { type: 'whip', d: 0.22 });

  // 4 · 1893: shearers' strike photo, 1893 stamp, plunging recession line; sketches for "beaten"
  scene('y1893', 7.45, 13.05, (t) => {
    const swap = p01(t, T.striking - 0.25, 0.5);
    const cp = p01(t, 7.5, 0.5);
    const beat = p01(t, T.beaten, 0.8);
    const dimB = 0.5 + beat * 0.15;
    const sh = shake(t, T.y1893, 16, 0.35);
    const photoA = photo('strike', { zoom: 1.0 + (t - 7.45) * 0.01, dim: 0.62, filter: 'fBlurSepia' });
    const photoB = photo('sketch', { zoom: 1.05 + (t - 11) * 0.015, fy: 420, dim: dimB, filter: 'fBlurSepia' });
    const cardA = swap < 1 ? card('strike', 540, 480, 900, 468, cp, { rot0: -8, rot: -2, filter: 'fSepia', opacity: 1 - swap, inner: '' }) : '';
    const cardB = swap > 0 ? card('sketch', 540 + (1 - easeOutCubic(swap)) * 700, 610, 600, 828, swap, { rot0: 10, rot: 2.5, filter: 'fSepia', scale: lerp(1, 0.97, beat) }) : '';
    return `${photoA}
      ${swap > 0 ? `<g opacity="${swap}">${photoB}</g>` : ''}
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      ${motes(t, 26, { alpha: 0.5 })}
      <g transform="translate(${sh.x} ${sh.y})">
        ${cardA}
        ${swap < 1 ? `<g opacity="${1 - swap}">${stamp('1893', 780, 690, t, T.y1893, { size: 104, rot: -10, plate: 'rgba(250,240,215,0.9)' })}</g>` : ''}
        ${swap < 1 ? `<g opacity="${1 - swap}">${plunge(150, 860, 780, 250, easeInOutCubic(p01(t, 9.1, 1.6)))}</g>` : ''}
      </g>
      ${cardB}
      ${beat > 0 ? `<rect width="${W}" height="${H}" fill="#000" opacity="${(beat * 0.18).toFixed(3)}"/>` : ''}`;
  }, { type: 'fade', d: 0.3 });

  // 5 · William Lane: Worker portrait card over a Paraguay dawn; paradise sun burst
  scene('lane', 13.05, 16.75, (t) => {
    const cp = p01(t, T.journalist - 0.1, 0.5);
    const out = p01(t, T.jungles - 0.1, 0.5);
    const r = p01(t, T.paradise - 0.2, 0.6);
    const z = 1.08 + (t - 13) * 0.02;
    return `${photo('dawn', { zoom: z, fx: 800, fy: 560, sy: 1000, dim: lerp(0.62, 0.38, r), filter: 'fWarm' })}
      <rect width="${W}" height="${H}" fill="url(#gTop)" opacity="0.7"/>
      ${rays(760, 1000, t, r)}
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      ${motes(t, 24, { alpha: 0.6, col: '#ffe7b0' })}
      <g transform="translate(${-easeInOutCubic(out) * 900} 0)">
        ${card('lane', 390, 560, 470, 703, cp, { rot0: -12, rot: -3, fy: 330 })}
        ${mapLabel('WILLIAM LANE', 390, 1070, p01(t, T.william, 0.45), { size: 76, fill: CREAM })}
      </g>`;
  }, { type: 'fade', d: 0.3 });

  // 6 · colony map (whole Paraguay): PARAGUAY label, parchment wipe + glow, settlers stream, war figures
  function paraguayWhole(t, t0) {
    // push in on the forest ("jungles") then pull back to the whole country on "Paraguay wants settlers"
    const push = easeOutCubic(p01(t, t0, 1.4));
    const back = easeInOutCubic(p01(t, T.pwants - 0.3, 1.3));
    const s = lerp(lerp(1.35, 1.05, push), 0.53, back);
    return colProj({ lon: lerp(-55.9, -58.4, back), lat: lerp(-25.2, -23.3, back), s, sx: 540, sy: lerp(760, 820, back), free: true });
  }
  scene('pymap', 16.75, 22.05, (t) => {
    const pr = paraguayWhole(t, 16.75);
    const wipe = easeInOutCubic(p01(t, T.pwants, 0.9));
    const glow = p01(t, T.paraguay1 - 0.2, 0.6);
    const [lx, ly] = pr.P(-58.2, -23.6);
    // settlers stream in from the east (Atlantic side) toward eastern Paraguay
    let flow = '';
    const [ex, ey] = pr.P(-56.4, -25.2);
    for (let i = 0; i < 16; i++) {
      const tt = T.settlers + i * 0.06;
      const pp = p01(t, tt, 0.9);
      if (pp <= 0 || pp >= 1) continue;
      const y0 = 240 + rnd(i, 41) * 820;
      const x = lerp(1180, ex + (rnd(i, 42) - 0.5) * 80, easeInOutCubic(pp));
      const y = lerp(y0, ey + (rnd(i, 43) - 0.5) * 80, easeInOutCubic(pp));
      flow += `<circle cx="${f1(x)}" cy="${f1(y)}" r="9" fill="${GOLD}" stroke="#fff" stroke-width="3" opacity="${(Math.sin(pp * Math.PI) * 0.95).toFixed(2)}"/>`;
    }
    // war: a panel of figures; a dark sweep leaves many of them as faint outlines (no number shown)
    const wp = p01(t, T.war - 0.15, 0.45);
    let figs = '';
    if (wp > 0) {
      const cols = 9;
      const rows = 3;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const x = 170 + c * 92;
          const y = 300 + r * 118;
          const gone = rnd(i, 51) < 0.62;
          const tw = T.wiped + (c / cols) * 0.9 + rnd(i, 52) * 0.2;
          const fade = gone ? p01(t, tw, 0.35) : 0;
          figs += fade < 1
            ? person(x, y, 0.95, CREAM, { opacity: 1 - fade * 0.8, stroke: INK })
            : person(x, y, 0.95, 'rgba(0,0,0,0)', { stroke: 'rgba(255,244,220,0.35)' });
        }
      }
      const sweep = p01(t, T.wiped, 1.2);
      figs = `<g opacity="${clamp(wp * 3, 0, 1)}" transform="translate(0 ${(1 - easeOutCubic(wp)) * -60})">
        <rect x="100" y="210" width="880" height="400" rx="20" fill="rgba(14,8,4,0.78)" stroke="rgba(255,194,71,0.45)" stroke-width="3" filter="url(#fShadow)"/>
        ${figs}
        ${sweep > 0 && sweep < 1 ? `<rect x="${f1(100 + sweep * 880 - 60)}" y="214" width="60" height="392" fill="${RED}" opacity="0.35" filter="url(#fBlur6)"/>` : ''}
      </g>`;
    }
    return `${colMap(pr, { wipe, glow, under: true })}
      ${mapLabel('PARAGUAY', clamp(lx, 300, 780), clamp(ly, 700, 1080), p01(t, T.paraguay1 - 0.05, 0.5), { size: 104, ls: 10, fill: CREAM })}
      <g filter="url(#fGlowS)">${flow}</g>
      ${figs}`;
  }, { type: 'fade', d: 0.45 });

  // 7 · July 1893: calendar pad over Sydney Cove
  scene('july', 22.05, 24.2, (t) => {
    const z = 1.3 + (t - 22) * 0.04;
    return `${photo('sydney', { zoom: z, fx: 1500, fy: 900, sx: 700, sy: 1000, dim: 0.45, filter: 'fWarm' })}
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      ${motes(t, 24, { alpha: 0.6 })}
      ${calendar(540, 640, t, T.july)}
      ${chip('SYDNEY', 540, 1060, p01(t, 22.9, 0.4), { size: 44, fill: INK, color: CREAM, stroke: GOLD })}`;
  }, { type: 'whip', d: 0.22 });

  // 8 · Royal Tar: the ship photo slams in; ROYAL TAR label
  scene('tar', 24.2, 25.55, (t) => {
    const cp = p01(t, 24.22, 0.4);
    const sh = shake(t, T.royal, 18, 0.35);
    return `${photo('sydney', { zoom: 1.6, fx: 1500, fy: 700, dim: 0.62, filter: 'fBlurSepia' })}
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      <g transform="translate(${sh.x} ${sh.y})">
        ${card('tar', 540, 590, 940, 715, cp, { rot0: 6, rot: -2, filter: 'fSepia', zoom: 1.02 })}
        ${mapLabel('ROYAL TAR', 540, 1100, p01(t, T.royal, 0.4), { size: 104, ls: 10, fill: GOLD })}
      </g>`;
  }, { type: 'cut' });

  // 9 · voyage: SYDNEY pin, ship follows the route across the South Pacific; OVER 200
  scene('voyage', 25.55, 28.25, (t) => {
    const f = easeInOutCubic(p01(t, 25.75, 2.3));
    const [hx] = routeAt(f);
    const [sx0] = vxy(...PLACE.sydney);
    const camX = Math.max(sx0 + 140, hx + 120);
    const pr = voyProj({ x: camX, s: 0.8, y57: 1150 });
    const [syx, syy] = pr.P(...PLACE.sydney);
    const [nx, ny] = pr.P(...PLACE.newAus);
    const op = p01(t, T.over, 0.4);
    const n = Math.round(clamp((t - T.n200) / 0.5, 0, 1) * 200);
    let crowd = '';
    for (let i = 0; i < 20; i++) {
      const pp = p01(t, T.over + i * 0.035, 0.3);
      if (pp <= 0) continue;
      crowd += person(290 + (i % 10) * 55 + (i >= 10 ? 27 : 0), 250 + (i >= 10 ? 62 : 0), 0.52 * easeOutBack(pp), i % 3 ? CREAM : GOLD, { stroke: INK });
    }
    return `${voyMap(pr, { py: p01(t, 27.3, 0.5) })}
      ${routeLayer(pr, f, t, { ship: true, shipScale: 0.95 })}
      ${pin(syx, syy, t, T.sydney - 0.15, { color: RUST })}
      ${mapLabel('SYDNEY', syx, syy - 120, p01(t, T.sydney - 0.1, 0.45), { size: 70 })}
      ${pin(nx, ny, t, 27.7, { color: RED, size: 0.8 })}
      ${op > 0 ? `<g opacity="${clamp(op * 3, 0, 1)}" transform="translate(0 ${(1 - easeOutBack(op)) * -40})">
        <rect x="200" y="140" width="680" height="290" rx="22" fill="rgba(14,8,4,0.82)" stroke="${GOLD}" stroke-width="3" filter="url(#fShadow)"/>
        ${text3d('OVER 200', 540, 238, { size: 88, ls: 6, fill: GOLD })}
        <g transform="translate(0 70)">${crowd}</g>
      </g>` : ''}`;
  }, { type: 'whip', d: 0.24 });

  // 10 · colony rules: New Australia photo + three rule medallions
  scene('rules', 28.25, 34.1, (t) => {
    const cp = p01(t, 28.3, 0.5);
    const z = 1.1 + (t - 28) * 0.012;
    return `${photo('colony', { zoom: z, dim: 0.55, filter: 'fBlurSepia' })}
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      ${motes(t, 22, { alpha: 0.45 })}
      ${card('colony', 540, 450, 620, 495, cp, { rot0: -8, rot: -2, filter: 'fSepia', tag: 'NEW AUSTRALIA' })}
      ${medallion(210, 1030, t, T.bans - 0.2, T.alcohol + 0.1, ICON_BOTTLE)}
      ${medallion(540, 1030, t, T.bans2 - 0.2, T.mixing + 0.15, ICON_MIX)}
      ${medallion(870, 1030, t, T.only - 0.15, 99, iconGate(t))}
      ${stamp('BRITISH ONLY', 540, 610, t, T.british, { size: 80, rot: -7, plate: 'rgba(250,240,215,0.92)' })}`;
  }, { type: 'fade', d: 0.35 });

  // 11 · split: colony map zoomed on the colonies; New Australia pin cracks, COSME branch; about 2,000
  scene('split', 34.1, 38.95, (t) => {
    const push = easeInOutCubic(p01(t, 34.1, 1.1));
    const s = lerp(1.6, 2.4, push);
    const pr = colProj({ lon: -56.45, lat: -25.87, s, sx: 560, sy: 830 });
    const [nx, ny] = pr.P(...PLACE.newAus);
    const [cx, cy] = pr.P(...PLACE.cosme);
    const cr = p01(t, T.splits, 0.3);
    const br = easeInOutCubic(p01(t, T.splits + 0.2, 0.7));
    const bx = lerp(nx, cx, br);
    const by = lerp(ny, cy, br) + Math.sin(br * Math.PI) * 0;
    const crack = cr > 0 ? `<path d="M${nx - 6} ${ny - 110} L${nx + 8} ${ny - 86} L${nx - 6} ${ny - 64} L${nx + 6} ${ny - 40} L${nx} ${ny - 14}" fill="none" stroke="#fff" stroke-width="${6 * cr}" stroke-linejoin="round" filter="url(#fGlowS)"/>` : '';
    const branch = br > 0 ? `<path d="M${f1(nx)} ${f1(ny)} Q${f1(nx - 60)} ${f1((ny + cy) / 2)} ${f1(bx)} ${f1(by)}" fill="none" stroke="#fff" stroke-width="15" stroke-linecap="round" opacity="0.95" filter="url(#fGlowS)"/>
      <path d="M${f1(nx)} ${f1(ny)} Q${f1(nx - 60)} ${f1((ny + cy) / 2)} ${f1(bx)} ${f1(by)}" fill="none" stroke="${RUST}" stroke-width="7" stroke-linecap="round" stroke-dasharray="20 16" stroke-dashoffset="${-(t * 60) % 36}"/>` : '';
    const ap = p01(t, T.about - 0.1, 0.45);
    const count = Math.round(easeOutCubic(p01(t, T.n2000 - 0.1, 0.8)) * 2000);
    const num = count >= 1000 ? `${Math.floor(count / 1000)},${String(count % 1000).padStart(3, '0')}` : String(count);
    const plz = p01(t, T.still - 0.1, 0.45);
    return `${colMap(pr)}
      ${bloom(nx, ny, t, T.descendants - 0.4, 34, 150)}
      ${bloom(cx, cy, t, T.descendants - 0.2, 18, 110)}
      ${branch}
      ${pin(nx, ny, t, 34.1, { color: RED })}
      ${crack}
      ${pin(cx, cy, t, T.year - 0.1, { color: RUST })}
      ${mapLabel('NEW AUSTRALIA', clamp(nx + 30, 330, 760), ny - 140, 1, { size: 64, fill: GOLD })}
      ${mapLabel('COSME', clamp(cx + 150, 200, 880), cy - 40, p01(t, T.year - 0.05, 0.45), { size: 72, fill: CREAM })}
      ${ap > 0 ? `<g opacity="${clamp(ap * 3, 0, 1)}" transform="translate(0 ${(1 - easeOutBack(ap)) * -40})">
        <rect x="190" y="130" width="700" height="170" rx="24" fill="rgba(14,8,4,0.82)" stroke="${GOLD}" stroke-width="3" filter="url(#fShadow)"/>
        <text x="540" y="186" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="40" letter-spacing="12" fill="${CREAM}">ABOUT</text>
        ${text3d(num, 540, 276, { size: 96, ls: 4, fill: GOLD })}
      </g>` : ''}
      ${card('plaza', 280, 810, 360, 270, plz, { rot0: -10, rot: -4, tag: 'NUEVA LONDRES' })}`;
  }, { type: 'fade', d: 0.4 });

  // 12 · Mary Gilmore: 1891 portrait + name, then into the stylised polymer $10 (later portrait)
  scene('gilmore', 38.95, 44.0, (t) => {
    const cp = p01(t, T.one - 0.1, 0.5);
    const toNote = easeInOutCubic(p01(t, T.whos - 0.15, 0.6));
    const np = p01(t, T.whos - 0.05, 0.6);
    const tp = p01(t, T.ten - 0.05, 0.4);
    const sh = shake(t, T.ten, 12, 0.35);
    const z = 1.1 + (t - 39) * 0.015;
    const portrait = (ox, oy, ow, oh) => `${ovalImg('dame', 820, 900, 1.9, 'fNoteTone')(ox, oy, ow, oh)}`;
    let spark = '';
    for (let i = 0; i < 16; i++) {
      const pp = p01(t, T.ten + rnd(i, 61) * 0.6, 0.6);
      if (pp <= 0 || pp >= 1) continue;
      const x = 140 + rnd(i, 62) * 800;
      const y = 380 + rnd(i, 63) * 520;
      const r = 14 * Math.sin(pp * Math.PI);
      spark += `<path d="M${f1(x)} ${f1(y - r * 2)} L${f1(x + r * 0.4)} ${f1(y)} L${f1(x)} ${f1(y + r * 2)} L${f1(x - r * 0.4)} ${f1(y)} Z M${f1(x - r * 2)} ${f1(y)} L${f1(x)} ${f1(y + r * 0.4)} L${f1(x + r * 2)} ${f1(y)} L${f1(x)} ${f1(y - r * 0.4)} Z" fill="#fff"/>`;
    }
    // quill flourish under the name on "poet"
    const qp = easeInOutCubic(p01(t, T.poet - 0.05, 0.6));
    const flourish = qp > 0 ? `<path d="M250 1112 C 380 1150, 520 1080, 640 1120 S 820 1140, 830 1100" fill="none" stroke="${GOLD}" stroke-width="6" stroke-linecap="round" stroke-dasharray="900" stroke-dashoffset="${900 * (1 - qp)}" opacity="${1 - toNote}"/>` : '';
    return `${photo('g1891', { zoom: z, fx: 1000, fy: 1100, dim: 0.66, filter: 'fBlurSepia' })}
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      ${motes(t, 22, { alpha: 0.5 })}
      ${toNote < 1 ? `<g opacity="${1 - toNote}" transform="translate(540 610) scale(${lerp(1, 0.6, toNote)}) translate(-540 -610)">
        ${card('g1891', 540, 590, 600, 722, cp, { rot0: -10, rot: -2, fx: 1000, fy: 1180, zoom: 1.35 })}</g>` : ''}
      <g transform="translate(${sh.x} ${sh.y})">
        ${noteFrame(540, 620, 940, 490, np, t, { portrait, rot: -3 })}
        ${chip('$10', 540, 950, tp, { size: 84, w: 270, fill: GOLD })}
      </g>
      ${mapLabel('MARY GILMORE', 540, lerp(1060, 1120, toNote), p01(t, T.mary, 0.45), { size: 86, fill: CREAM })}
      ${flourish}
      <g filter="url(#fGlowS)">${spark}</g>`;
  }, { type: 'fade', d: 0.35 });

  // 13 · loop: whip back to the exact frame-1 composition on "Because"
  scene('loop', LOOP_AT, 99, (t) => {
    // lands on the exact t=0 frame (frame-1 motion clock held at 0) so the cut back to the open is seamless
    return openFrame(0, easeOutCubic(p01(t, LOOP_AT, 0.5)));
  }, { type: 'whip', d: 0.24 });

  // ---------- defs ----------
  const DEFS = `
    <defs>
      <filter id="fShadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#000" flood-opacity="0.7"/>
      </filter>
      <filter id="fDrop" x="-20%" y="-40%" width="140%" height="180%">
        <feDropShadow dx="4" dy="10" stdDeviation="8" flood-color="#000" flood-opacity="0.75"/>
      </filter>
      <filter id="fGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="9" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="fGlowS" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="fBlur6" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="fBlur14"><feGaussianBlur stdDeviation="14"/></filter>
      <filter id="fWarm" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="1.08 0.08 0 0 0.02  0.04 0.98 0 0 0.01  0 0.05 0.82 0 0  0 0 0 1 0"/>
      </filter>
      <filter id="fSepia" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.45 0.6 0.15 0 0.03  0.38 0.55 0.13 0 0.02  0.28 0.42 0.1 0 0  0 0 0 1 0"/>
      </filter>
      <filter id="fBlurSepia" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="10" edgeMode="duplicate"/>
        <feColorMatrix type="matrix" values="0.45 0.6 0.15 0 0.02  0.38 0.55 0.13 0 0.01  0.28 0.42 0.1 0 0  0 0 0 1 0"/>
      </filter>
      <filter id="fSil" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0 0 0 0 0.02  0 0 0 0 0.05  0 0 0 0 0.1  0 0 0 1 0"/>
      </filter>
      <filter id="fNoteTone" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.3 0.45 0.1 0 0.05  0.3 0.5 0.12 0 0.1  0.3 0.5 0.2 0 0.18  0 0 0 1 0"/>
      </filter>
      <filter id="fStampInk" x="-10%" y="-20%" width="120%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.75" result="m"/>
        <feComposite in="SourceGraphic" in2="m" operator="in"/>
      </filter>
      <filter id="fGrain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="3" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0.09 0"/>
      </filter>
      <filter id="fSoft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="fFeather" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="45"/></filter>
      <mask id="mColFeather" maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="2052">
        <rect x="90" y="90" width="1740" height="1872" fill="#fff" filter="url(#fFeather)"/>
      </mask>
      <radialGradient id="gVig" cx="50%" cy="42%" r="75%">
        <stop offset="55%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.72"/>
      </radialGradient>
      <radialGradient id="gRim" cx="50%" cy="40%" r="60%">
        <stop offset="70%" stop-color="#9fd0ff" stop-opacity="0"/>
        <stop offset="100%" stop-color="#9fd0ff" stop-opacity="0.55"/>
      </radialGradient>
      <radialGradient id="gLens" cx="50%" cy="45%" r="75%">
        <stop offset="60%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#2a1606" stop-opacity="0.45"/>
      </radialGradient>
      <linearGradient id="gTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0.7"/>
        <stop offset="0.5" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="gRed" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${RED}" stop-opacity="0.7"/>
        <stop offset="1" stop-color="${RED}" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="gNote" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#3d8fd6"/>
        <stop offset="0.55" stop-color="${NOTE}"/>
        <stop offset="1" stop-color="${NOTE_D}"/>
      </linearGradient>
    </defs>`;

  // ---------- compositor (true crossfades, whip) ----------
  function drawScene(sc, t) {
    return sc.draw(t, Math.max(0, t - sc.start), HS) || '';
  }
  function composite(t) {
    let idx = scenes.findIndex((s) => t >= s.start && t < s.end);
    if (idx < 0) idx = scenes.length - 1;
    const sc = scenes[idx];
    const prev = scenes[idx - 1];
    const tin = sc.tin || { type: 'cut' };
    const d = tin.d || 0.3;
    const u = clamp((t - sc.start) / d, 0, 1);
    if (!prev || tin.type === 'cut' || u >= 1) {
      if (tin.type === 'cut' && prev && t - sc.start < 0.12) {
        return `${drawScene(sc, t)}<rect width="${W}" height="${H}" fill="#fff" opacity="${(0.5 * (1 - (t - sc.start) / 0.12)).toFixed(3)}"/>`;
      }
      return drawScene(sc, t);
    }
    const e = easeInOutCubic(u);
    if (tin.type === 'whip') {
      const dx = (1 - e) * W;
      return `<g transform="translate(${f1(-e * W * 0.6)} 0)" opacity="${(1 - e * 0.6).toFixed(3)}">${drawScene(prev, t)}</g>
        <g transform="translate(${f1(dx)} 0)">${drawScene(sc, t)}</g>
        <rect width="${W}" height="${H}" fill="#fff" opacity="${(Math.sin(e * Math.PI) * 0.22).toFixed(3)}"/>`;
    }
    return `${drawScene(prev, t)}<g opacity="${e.toFixed(3)}">${drawScene(sc, t)}</g>`;
  }

  window.EPISODE = {
    duration: T.end,
    fps: 30,
    images: Object.fromEntries([
      ...Object.entries(IMG).map(([k, v]) => [k, v[0]]),
      ['voyBase', VOY.base], ['voyAu', VOY.au], ['voyPy', VOY.py], ['voyGlow', VOY.glow],
      ['colBase', COL.base], ['colParch', COL.parch], ['colGlow', COL.glow],
    ]),
    words: [],
    scenes,
    ready: (async () => {
      const f = new FontFace('Oswald', 'url(/ep/Oswald-VF.ttf)', { weight: '200 700' });
      await f.load();
      document.fonts.add(f);
    })(),
  };

  window.renderFrame = function (t) {
    const ep = window.EPISODE;
    uid = 0;
    if (!ep._caps) ep._caps = HS.groupCaptions(ep.words, 4, 0.45);
    let caps = '';
    for (const c of ep._caps) {
      if (t >= c.start && t <= c.end) {
        caps = HS.captionSvg(c.text, t, c.start, c.end);
        break;
      }
    }
    // film grain: static frame-1 seed so the loop lands on an identical frame
    const gs = t > LOOP_AT + 0.5 || t < 0.001 ? 0 : Math.floor(t * 30);
    const gx = Math.floor(rnd(gs, 1) * 200);
    const gy = Math.floor(rnd(gs, 2) * 200);
    document.getElementById('root').innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
        ${DEFS}
        <rect width="${W}" height="${H}" fill="#0a0704"/>
        ${composite(t)}
        <rect x="${-gx}" y="${-gy}" width="${W + 200}" height="${H + 200}" filter="url(#fGrain)"/>
        ${caps}
      </svg>`;
    return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  };
})();
