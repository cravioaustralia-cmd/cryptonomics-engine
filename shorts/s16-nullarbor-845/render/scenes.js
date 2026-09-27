/* s16 — Nullarbor +8:45 (unofficial Central Western Time)
 * Photo underlay + SVG motion graphics, SVG + renderFrame(t) only (no Remotion).
 * Beat times come from ../transcript.json (faster-whisper small.en word timings on audio/vo.mp3).
 * On-screen text: the frame-1 hook `+8:45` plus names, places, key facts and prop text only. No VO-echo titles.
 * Map (locked style): real topo (AWS Terrain Tiles) × real NASA satellite colour (s16_02), georeferenced,
 * with parchment WA / SA fills, thick white outer glow, soft shadow and bold 3D labels. Only the
 * Nullarbor / WA–SA border / Eucla–Eyre Highway corridor is ever shown. Layers built by build-map-layers.py.
 * Soft facts (fact-check.md): UTC+8:45 is unofficial (no statute); only Eucla and Border Village are named
 * on the map, other roadhouses are unlabelled dots; "one of the only" quarter-hour offsets (not "the only");
 * origin year is never stated. Perth +8 / Adelaide +9:30 are standard-time offsets.
 * Caption band (~70%, y≈1240–1450), the bottom UI zone and the right edge are kept clear of graphics.
 */
(function () {
  const HS = window.HS;
  const { W, H, clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic } = HS;

  const IMG = {
    road: ['/img/s16_04_eyre_highway_nullarbor.jpg', 4032, 3024],
    golden: ['/img/s16_06_nullarbor_plain.jpg', 4032, 3024],
    caiguna: ['/img/s16_05_eyre_highway_caiguna.jpg', 4032, 3024],
    sign: ['/img/s16_01_entering_cwst_sign.jpg', 2048, 1536],
    sat: ['/img/s16_02_nullarbor_satellite.jpg', 1280, 672],
    eucla: ['/img/s16_08_eucla_hotel_motel.jpg', 4601, 2531],
    border: ['/img/s16_09_border_village_checkpoint.jpg', 4928, 3264],
    sawa: ['/img/s16_10_sa_wa_border_sign.jpg', 4032, 3024],
    perth: ['/img/s16_11_perth_skyline.jpg', 3840, 2880],
    adelaide: ['/img/s16_12_adelaide_skyline.jpg', 2048, 983],
    mundra: ['/img/s16_13_mundrabilla_highway_sign.jpg', 1920, 1272],
  };
  const MAP = {
    base: '/img/s16_15_map_basemap.jpg',
    wa: '/img/s16_16_map_parch_wa.png',
    sa: '/img/s16_17_map_parch_sa.png',
    glow: '/img/s16_18_map_glow.png',
    bglow: '/img/s16_19_map_border_glow.png',
    w: 2160,
    h: 2644,
    lon0: 122.0,
    lat0: -27.0,
    ppx: 180,
    ppy: 180 / Math.cos((31.7 * Math.PI) / 180),
  };
  const mxy = (lon, lat) => [(lon - MAP.lon0) * MAP.ppx, (MAP.lat0 - lat) * MAP.ppy];
  // Eyre Highway (approx. through the roadhouses), WGS84
  const HWY = [
    [122.0, -32.22], [123.62, -32.35], [125.49, -32.27], [126.09, -32.04], [127.02, -31.9],
    [127.85, -31.84], [128.88, -31.69], [129.005, -31.638], [130.9, -31.45], [131.83, -31.48],
    [132.22, -31.79], [133.01, -31.93], [133.68, -32.13],
  ];
  const TOWN = {
    caiguna: [125.49, -32.27],
    cockle: [126.09, -32.04],
    madura: [127.02, -31.9],
    mundra: [127.85, -31.84],
    eucla: [128.883, -31.677],
    bv: [129.005, -31.638],
  };

  const DISPLAY = `'Oswald', 'DejaVu Sans Condensed', 'DejaVu Sans', sans-serif`;
  const SANS = `'DejaVu Sans', 'Liberation Sans', sans-serif`;
  const MONO = `'DejaVu Sans Mono', 'Liberation Mono', monospace`;
  const SUN = '#ffb627';
  const RUST = '#c4541c';
  const CREAM = '#fff4dc';
  const INK = '#1a0f08';
  const RED = '#ff3b30';
  const TEAL = '#5fe8ff';
  const GREEN = '#39e58c';
  const PAPER = '#f1e6c8';
  const SIGN = '#0f6b3a';

  // ---------- helpers ----------
  const p01 = (t, t0, d) => clamp((t - t0) / d, 0, 1);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let uid = 0;
  const nid = (k) => k + uid++;
  const rnd = (i, k = 0) => {
    const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  function shake(t, t0, amp = 22, dur = 0.45) {
    const k = p01(t, t0, dur);
    if (k <= 0 || k >= 1) return { x: 0, y: 0 };
    const a = amp * Math.pow(1 - k, 2);
    return { x: Math.sin(t * 91) * a, y: Math.cos(t * 77) * a };
  }
  const pop = (t, t0, d = 0.45) => easeOutBack(p01(t, t0, d));

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
    return `<image href="${IMG[key][0]}" x="${g.x.toFixed(1)}" y="${g.y.toFixed(1)}" width="${g.w.toFixed(1)}" height="${g.h.toFixed(1)}" preserveAspectRatio="none"${filt}/>
      ${o.tint ? `<rect width="${W}" height="${H}" fill="${o.tint}"/>` : ''}
      <rect width="${W}" height="${H}" fill="rgba(0,0,0,${o.dim != null ? o.dim : 0.45})"/>`;
  }
  function photoPt(key, o, px, py) {
    const g = photoGeom(key, o);
    return [g.x + px * g.s, g.y + py * g.s, g.s];
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
  /** Map label: 3D text with a thick white outer glow (locked map style). */
  function mapLabel(str, x, y, p, o = {}) {
    if (p <= 0) return '';
    const k = easeOutBack(clamp(p / 0.7, 0, 1));
    const size = o.size || 64;
    const drop = (1 - easeOutCubic(clamp(p / 0.6, 0, 1))) * -60;
    return `<g transform="translate(${x} ${y + drop}) scale(${k}) translate(${-x} ${-y})" opacity="${clamp(p * 3, 0, 1)}">
      <text x="${x}" y="${y}" text-anchor="${o.anchor || 'middle'}" font-family="${DISPLAY}" font-weight="700" font-size="${size}" letter-spacing="${o.ls != null ? o.ls : 6}" fill="none" stroke="#fff" stroke-width="${size / 4.2}" stroke-linejoin="round" opacity="0.9" filter="url(#fGlowS)">${esc(str)}</text>
      ${text3d(str, x, y, { size, ls: o.ls != null ? o.ls : 6, anchor: o.anchor, side: o.side || '#5a3410', fill: o.fill || CREAM, depth: o.depth })}
    </g>`;
  }
  /** Rounded label chip that pops in with p (0..1). */
  function chip(label, x, y, p, o = {}) {
    if (p <= 0) return '';
    const size = o.size || 40;
    const w = o.w || label.length * size * 0.56 + size * 1.3;
    const h = size * 1.55;
    const k = easeOutBack(clamp(p / 0.6, 0, 1));
    return `<g transform="translate(${x} ${y}) scale(${k})" opacity="${clamp(p * 3, 0, 1)}" filter="url(#fDrop)">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h * 0.22}" fill="${o.fill || SUN}" stroke="${o.stroke || 'rgba(255,255,255,0.9)'}" stroke-width="3"/>
      ${o.icon || ''}
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
    return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${k * (o.scale || 1)})" opacity="${clamp(p * 4, 0, 1) * (o.opacity != null ? o.opacity : 1)}">
      <rect x="${-w / 2 - b}" y="${-h / 2 - b}" width="${w + 2 * b}" height="${h + 2 * b}" rx="6" fill="${o.frame || PAPER}" filter="url(#fShadow)"/>
      <clipPath id="${id}"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}"/></clipPath>
      <g clip-path="url(#${id})">
        <image href="${url}" x="${-w / 2 + x}" y="${-h / 2 + y}" width="${pw}" height="${ph}" preserveAspectRatio="none"/>
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="url(#gLens)"/>
        ${o.inner ? o.inner(-w / 2 + x, -h / 2 + y, s) : ''}
      </g>
      ${o.caption ? `<text x="0" y="${h / 2 + b + 40}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="34" letter-spacing="3" fill="${CREAM}" stroke="${INK}" stroke-width="5" paint-order="stroke">${esc(o.caption)}</text>` : ''}
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
    return `<g transform="translate(${x} ${y}) rotate(${o.rot != null ? o.rot : -8}) scale(${sc})" opacity="${clamp(p * 2, 0, 1) * 0.92}">
      <rect x="${-w / 2}" y="${-size * 0.78}" width="${w}" height="${size * 1.4}" rx="10" fill="none" stroke="${col}" stroke-width="9"/>
      <rect x="${-w / 2 + 12}" y="${-size * 0.78 + 12}" width="${w - 24}" height="${size * 1.4 - 24}" rx="6" fill="none" stroke="${col}" stroke-width="3"/>
      <text x="0" y="${size * 0.36}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="${size}" letter-spacing="6" fill="${col}" filter="url(#fStampInk)">${esc(label)}</text>
    </g>`;
  }

  // ---------- flip-clock tiles (the +8:45 hook) ----------
  /** One flip tile. p: 0..1 flip-in progress. */
  function flipTile(ch, x, y, w, h, p, o = {}) {
    if (p <= 0) return '';
    const k = easeOutBack(clamp(p, 0, 1));
    const flash = (1 - clamp(p * 1.4, 0, 1)) * 0.8;
    const depth = o.depth != null ? o.depth : 14;
    const fs = h * 0.8;
    const isColon = ch === ':';
    if (isColon) {
      const r = w * 0.13;
      return `<g transform="translate(${x} ${y}) scale(1 ${k})" opacity="${clamp(p * 3, 0, 1)}">
        <circle cx="${depth * 0.6}" cy="${-h * 0.16 + depth * 0.6}" r="${r}" fill="#5a3410"/><circle cx="${depth * 0.6}" cy="${h * 0.16 + depth * 0.6}" r="${r}" fill="#5a3410"/>
        <circle cx="0" cy="${-h * 0.16}" r="${r}" fill="${o.digit || CREAM}" stroke="${INK}" stroke-width="4"/><circle cx="0" cy="${h * 0.16}" r="${r}" fill="${o.digit || CREAM}" stroke="${INK}" stroke-width="4"/>
      </g>`;
    }
    const id = nid('ft');
    return `<g transform="translate(${x} ${y}) scale(1 ${k})" opacity="${clamp(p * 3, 0, 1)}">
      <rect x="${-w / 2 + depth}" y="${-h / 2 + depth}" width="${w}" height="${h}" rx="${w * 0.12}" fill="#3b2208"/>
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${w * 0.12}" fill="url(#gTile)" stroke="rgba(255,236,190,0.55)" stroke-width="3"/>
      <clipPath id="${id}"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${w * 0.12}"/></clipPath>
      <g clip-path="url(#${id})">
        <text x="0" y="${fs * 0.36}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="${fs}" fill="${o.digit || CREAM}">${esc(ch)}</text>
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h / 2}" fill="#fff" opacity="0.06"/>
        <rect x="${-w / 2}" y="${-3}" width="${w}" height="6" fill="#120a03" opacity="0.85"/>
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#fff" opacity="${flash.toFixed(3)}"/>
      </g>
      <circle cx="${-w / 2 + 6}" cy="0" r="5" fill="#8a6a3a"/><circle cx="${w / 2 - 6}" cy="0" r="5" fill="#8a6a3a"/>
    </g>`;
  }
  /** "+8:45" as a flip-clock row. prog(i) gives each char's flip progress. */
  function flipRow(str, cx, cy, h, prog, o = {}) {
    const w = h * 0.68;
    const cw = h * 0.3;
    const gap = h * 0.07;
    const widths = [...str].map((c) => (c === ':' ? cw : w));
    const total = widths.reduce((a, b) => a + b, 0) + gap * (str.length - 1);
    let x = cx - total / 2;
    let s = '';
    [...str].forEach((c, i) => {
      s += flipTile(c, x + widths[i] / 2, cy, widths[i], h, prog(i), o);
      x += widths[i] + gap;
    });
    return `<g filter="url(#fDrop)">${s}</g>`;
  }

  // ---------- analogue clock ----------
  function clockFace(cx, cy, r, hh, mm, o = {}) {
    const ha = ((hh % 12) + mm / 60) * 30;
    const ma = mm * 6;
    let ticks = '';
    for (let i = 0; i < 60; i++) {
      const a = (i * 6 * Math.PI) / 180;
      const big = i % 5 === 0;
      const r1 = r * (big ? 0.8 : 0.88);
      ticks += `<line x1="${Math.sin(a) * r1}" y1="${-Math.cos(a) * r1}" x2="${Math.sin(a) * r * 0.94}" y2="${-Math.cos(a) * r * 0.94}" stroke="${INK}" stroke-width="${big ? r * 0.035 : r * 0.012}"/>`;
    }
    let nums = '';
    if (o.numbers !== false) {
      for (let i = 1; i <= 12; i++) {
        const a = (i * 30 * Math.PI) / 180;
        nums += `<text x="${Math.sin(a) * r * 0.66}" y="${-Math.cos(a) * r * 0.66 + r * 0.075}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="${r * 0.2}" fill="${INK}">${i}</text>`;
      }
    }
    const wedge = o.wedge
      ? (() => {
          const [m0, m1] = o.wedge;
          const a0 = (m0 * 6 * Math.PI) / 180;
          const a1 = (m1 * 6 * Math.PI) / 180;
          const large = m1 - m0 > 30 ? 1 : 0;
          const rr = r * 0.93;
          return `<path d="M0 0 L${Math.sin(a0) * rr} ${-Math.cos(a0) * rr} A${rr} ${rr} 0 ${large} 1 ${Math.sin(a1) * rr} ${-Math.cos(a1) * rr} Z" fill="${o.wedgeCol || SUN}" opacity="0.75"/>`;
        })()
      : '';
    const trail = o.trail
      ? (() => {
          const [m0, m1] = o.trail;
          if (m1 - m0 < 0.5) return '';
          const a0 = (m0 * 6 * Math.PI) / 180;
          const a1 = (m1 * 6 * Math.PI) / 180;
          const rr = r * 0.72;
          const large = m1 - m0 > 30 ? 1 : 0;
          return `<path d="M${Math.sin(a0) * rr} ${-Math.cos(a0) * rr} A${rr} ${rr} 0 ${large} 1 ${Math.sin(a1) * rr} ${-Math.cos(a1) * rr}" fill="none" stroke="${SUN}" stroke-width="${r * 0.1}" stroke-linecap="round" opacity="0.8"/>`;
        })()
      : '';
    return `<g transform="translate(${cx} ${cy})${o.scale != null ? ` scale(${o.scale})` : ''}" filter="url(#fShadow)">
      <circle r="${r * 1.1}" fill="${o.rim || '#b8801f'}"/>
      <circle r="${r * 1.04}" fill="#5a3410"/>
      <circle r="${r}" fill="url(#gDial)"/>
      ${wedge}${trail}${ticks}${nums}
      <line x1="0" y1="0" x2="${Math.sin((ha * Math.PI) / 180) * r * 0.5}" y2="${-Math.cos((ha * Math.PI) / 180) * r * 0.5}" stroke="${INK}" stroke-width="${r * 0.07}" stroke-linecap="round"/>
      <line x1="${-Math.sin((ma * Math.PI) / 180) * r * 0.14}" y1="${Math.cos((ma * Math.PI) / 180) * r * 0.14}" x2="${Math.sin((ma * Math.PI) / 180) * r * 0.8}" y2="${-Math.cos((ma * Math.PI) / 180) * r * 0.8}" stroke="${o.hand || RUST}" stroke-width="${r * 0.04}" stroke-linecap="round"/>
      <circle r="${r * 0.06}" fill="${INK}"/><circle r="${r * 0.025}" fill="${SUN}"/>
      <ellipse cx="${-r * 0.3}" cy="${-r * 0.45}" rx="${r * 0.55}" ry="${r * 0.2}" fill="#fff" opacity="0.16" transform="rotate(-25)"/>
      ${o.label ? `<text y="${r * 0.36}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="${r * 0.16}" letter-spacing="3" fill="${RUST}">${esc(o.label)}</text>` : ''}
    </g>`;
  }

  /** Dust motes drifting across the frame (outback heat). */
  function dust(t, n = 40, o = {}) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const sp = 20 + rnd(i, 1) * 60;
      const x = (((rnd(i, 2) * W + t * sp * (o.dir || 1)) % W) + W) % W;
      const y = rnd(i, 3) * H + Math.sin(t * 0.8 + i) * 20;
      if (y > 1200 && y < 1480) continue;
      const r = 1 + rnd(i, 4) * 2.6;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#ffe2b0" opacity="${((0.15 + rnd(i, 5) * 0.4) * (o.alpha != null ? o.alpha : 1)).toFixed(2)}"/>`;
    }
    return `<g>${s}</g>`;
  }
  /** Heat-shimmer speed streaks toward a vanishing point. */
  function streaks(t, vx, vy, n = 18, alpha = 0.5) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const ang = (rnd(i, 7) - 0.5) * 2.6 + (rnd(i, 8) > 0.5 ? 0 : Math.PI);
      const q = (t * (0.5 + rnd(i, 9)) + rnd(i, 10)) % 1;
      const r0 = 120 + q * 900;
      const r1 = r0 + 80 + q * 260;
      const x0 = vx + Math.cos(ang) * r0;
      const y0 = vy + Math.sin(ang) * r0 * 0.6;
      const x1 = vx + Math.cos(ang) * r1;
      const y1 = vy + Math.sin(ang) * r1 * 0.6;
      if (Math.max(y0, y1) > 1200) continue;
      s += `<line x1="${x0.toFixed(0)}" y1="${y0.toFixed(0)}" x2="${x1.toFixed(0)}" y2="${y1.toFixed(0)}" stroke="#fff3d6" stroke-width="${(1 + q * 3).toFixed(1)}" opacity="${(alpha * Math.sin(q * Math.PI)).toFixed(2)}"/>`;
    }
    return s;
  }

  // ---------- locked-style map ----------
  /** cam: {lon, lat, s, sx, sy} — (lon,lat) lands at screen (sx,sy) at scale s. */
  function mapProj(cam) {
    const [cx, cy] = mxy(cam.lon, cam.lat);
    const tx = clamp((cam.sx != null ? cam.sx : W / 2) - cx * cam.s, W - MAP.w * cam.s, 0);
    const ty = clamp((cam.sy != null ? cam.sy : H / 2) - cy * cam.s, H - MAP.h * cam.s, 0);
    return { tx, ty, s: cam.s, P: (lon, lat) => { const [x, y] = mxy(lon, lat); return [tx + x * cam.s, ty + y * cam.s]; } };
  }
  function hwyPath(pr, upto = 1, fromLon = -999, toLon = 999) {
    const pts = HWY.filter(([lo]) => lo >= fromLon - 1e-6 && lo <= toLon + 1e-6).map(([lo, la]) => pr.P(lo, la));
    return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  }
  function hwyLen(pr, fromLon = -999, toLon = 999) {
    const pts = HWY.filter(([lo]) => lo >= fromLon - 1e-6 && lo <= toLon + 1e-6).map(([lo, la]) => pr.P(lo, la));
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return L;
  }
  /** o: {wa, sa, border, glow} reveal amounts 0..1 */
  function mapLayer(t, cam, o = {}) {
    const pr = mapProj(cam);
    const { tx, ty, s } = pr;
    const bx = (129 - MAP.lon0) * MAP.ppx;
    const waW = bx * clamp(o.wa || 0, 0, 1);
    const saW = (MAP.w - bx) * clamp(o.sa || 0, 0, 1);
    const cW = nid('cw');
    const cS = nid('cs');
    const cB = nid('cb');
    const bY = MAP.h * clamp(o.border || 0, 0, 1);
    const wipeEdge = (x, p) => (p > 0 && p < 1 ? `<rect x="${x - 5}" y="0" width="10" height="${MAP.h}" fill="#fff" opacity="0.8" filter="url(#fGlow)"/>` : '');
    return `<g>
      <rect width="${W}" height="${H}" fill="#06101f"/>
      <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})">
        <image href="${MAP.base}" x="0" y="0" width="${MAP.w}" height="${MAP.h}" preserveAspectRatio="none"/>
        <image href="${MAP.glow}" x="0" y="0" width="${MAP.w}" height="${MAP.h}" preserveAspectRatio="none" opacity="${o.glow != null ? o.glow : 1}"/>
        <clipPath id="${cW}"><rect x="0" y="0" width="${waW}" height="${MAP.h}"/></clipPath>
        <clipPath id="${cS}"><rect x="${MAP.w - saW}" y="0" width="${saW}" height="${MAP.h}"/></clipPath>
        <clipPath id="${cB}"><rect x="0" y="0" width="${MAP.w}" height="${bY}"/></clipPath>
        <image href="${MAP.wa}" x="0" y="0" width="${MAP.w}" height="${MAP.h}" preserveAspectRatio="none" clip-path="url(#${cW})"/>
        <image href="${MAP.sa}" x="0" y="0" width="${MAP.w}" height="${MAP.h}" preserveAspectRatio="none" clip-path="url(#${cS})"/>
        ${wipeEdge(waW, o.wa)}${wipeEdge(MAP.w - saW, o.sa)}
        <image href="${MAP.bglow}" x="0" y="0" width="${MAP.w}" height="${MAP.h}" preserveAspectRatio="none" clip-path="url(#${cB})" filter="url(#fGlowS)"/>
      </g>
    </g>`;
  }
  /** CWST corridor: parchment-gold strip along the Eyre Hwy, white outer glow + soft shadow. */
  function corridor(pr, p, t) {
    if (p <= 0) return '';
    const d = hwyPath(pr, 1, 125.49, 129.005);
    const L = hwyLen(pr, 125.49, 129.005);
    const wpx = 0.34 * MAP.ppy * pr.s;
    const dash = `stroke-dasharray="${(L * easeInOutCubic(p)).toFixed(1)} ${L + 10}"`;
    const shimmer = 0.85 + 0.15 * Math.sin(t * 4);
    return `<g>
      <path d="${d}" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="${wpx + 10}" stroke-linecap="round" stroke-linejoin="round" transform="translate(8 14)" filter="url(#fBlur6)" ${dash}/>
      <path d="${d}" fill="none" stroke="#fff" stroke-width="${wpx + 26}" stroke-linecap="round" stroke-linejoin="round" filter="url(#fGlow)" ${dash}/>
      <path d="${d}" fill="none" stroke="url(#pParch)" stroke-width="${wpx}" stroke-linecap="round" stroke-linejoin="round" opacity="${(0.92 * shimmer).toFixed(3)}" ${dash}/>
      <path d="${d}" fill="none" stroke="${SUN}" stroke-width="${wpx}" stroke-linecap="round" stroke-linejoin="round" opacity="0.28" ${dash}/>
    </g>`;
  }
  function highway(pr, p, fromLon, toLon, o = {}) {
    if (p <= 0) return '';
    const d = hwyPath(pr, 1, fromLon, toLon);
    const L = hwyLen(pr, fromLon, toLon);
    const dash = `stroke-dasharray="${(L * p).toFixed(1)} ${L + 10}"`;
    return `<g>
      <path d="${d}" fill="none" stroke="#1d1206" stroke-width="${(o.w || 9) + 6}" stroke-linecap="round" stroke-linejoin="round" ${dash} opacity="0.85"/>
      <path d="${d}" fill="none" stroke="${o.col || '#fff'}" stroke-width="${o.w || 9}" stroke-linecap="round" stroke-linejoin="round" ${dash}/>
      <path d="${d}" fill="none" stroke="${SUN}" stroke-width="${(o.w || 9) * 0.3}" stroke-dasharray="14 12" stroke-linecap="round" opacity="${p >= 1 ? 0.9 : 0}"/>
    </g>`;
  }
  function pin(x, y, p, t, o = {}) {
    if (p <= 0) return '';
    const drop = (1 - easeOutCubic(clamp(p / 0.5, 0, 1))) * -120;
    const bounce = easeOutBack(clamp(p / 0.6, 0, 1));
    const ring = p01(p, 0.35, 0.65);
    const col = o.col || RUST;
    const sz = o.size || 1;
    return `<g>
      ${ring > 0 && ring < 1 ? `<ellipse cx="${x}" cy="${y}" rx="${ring * 70 * sz}" ry="${ring * 28 * sz}" fill="none" stroke="#fff" stroke-width="4" opacity="${1 - ring}"/>` : ''}
      <ellipse cx="${x}" cy="${y}" rx="${14 * sz}" ry="${5 * sz}" fill="#000" opacity="${0.4 * clamp(p * 2, 0, 1)}"/>
      <g transform="translate(${x} ${y + drop}) scale(${bounce * sz})" filter="url(#fDrop)">
        <path d="M0 0 C-10 -22 -26 -34 -26 -52 A26 26 0 1 1 26 -52 C26 -34 10 -22 0 0 Z" fill="${col}" stroke="#fff" stroke-width="4"/>
        <circle cx="0" cy="-52" r="10" fill="#fff"/>
      </g>
    </g>`;
  }
  function dot(x, y, p, o = {}) {
    if (p <= 0) return '';
    const k = easeOutBack(clamp(p / 0.6, 0, 1));
    return `<g transform="translate(${x} ${y}) scale(${k})" filter="url(#fDrop)">
      <circle r="${o.r || 12}" fill="${o.col || CREAM}" stroke="${INK}" stroke-width="4"/>
      <circle r="${(o.r || 12) * 0.4}" fill="${RUST}"/>
    </g>`;
  }

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
        <feColorMatrix type="matrix" values="1.1 0.1 0 0 0.02  0.05 0.95 0 0 0.01  0 0.05 0.75 0 0  0 0 0 1 0"/>
      </filter>
      <filter id="fSepia" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.45 0.6 0.15 0 0.02  0.38 0.55 0.13 0 0.01  0.28 0.42 0.1 0 0  0 0 0 1 0"/>
      </filter>
      <filter id="fStampInk" x="-10%" y="-20%" width="120%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.6" result="m"/>
        <feComposite in="SourceGraphic" in2="m" operator="in"/>
      </filter>
      <filter id="fRGB" x="-10%" y="-10%" width="120%" height="120%">
        <feOffset id="rgbR" in="SourceGraphic" dx="0" dy="0" result="r0"/>
        <feColorMatrix in="r0" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>
        <feOffset id="rgbB" in="SourceGraphic" dx="0" dy="0" result="b0"/>
        <feColorMatrix in="b0" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/>
        <feBlend in="r" in2="b" mode="screen"/>
      </filter>
      <radialGradient id="gVig" cx="50%" cy="45%" r="72%">
        <stop offset="55%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.78"/>
      </radialGradient>
      <linearGradient id="gTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0.72"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="gBot" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.75"/>
      </linearGradient>
      <linearGradient id="gTile" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3a2a1a"/>
        <stop offset="0.5" stop-color="#23170c"/>
        <stop offset="1" stop-color="#150d05"/>
      </linearGradient>
      <radialGradient id="gDial" cx="45%" cy="40%" r="70%">
        <stop offset="0" stop-color="#fffaf0"/>
        <stop offset="0.8" stop-color="#f1e2c0"/>
        <stop offset="1" stop-color="#d8c095"/>
      </radialGradient>
      <radialGradient id="gLens" cx="35%" cy="30%" r="80%">
        <stop offset="0" stop-color="#fff" stop-opacity="0.1"/>
        <stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.3"/>
      </radialGradient>
      <radialGradient id="gSun" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="${SUN}" stop-opacity="0.55"/>
        <stop offset="1" stop-color="${SUN}" stop-opacity="0"/>
      </radialGradient>
      <pattern id="pParch" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <rect width="24" height="24" fill="#f4dfae"/>
        <rect width="10" height="24" fill="#e9c77f"/>
      </pattern>
      <filter id="fGrain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="2"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.07 0"/>
      </filter>
    </defs>`;

  // ---------- beat times (transcript.json) ----------
  const T = {
    strip: 0.54, // "There's a strip of Australia…"
    time1: 2.74,
    no: 3.58, // "…that no law ever created."
    law: 3.92,
    created: 4.5,
    and1: 5.5, // "And the time it runs on is bizarre."
    bizarre: 6.98,
    the: 8.0, // "The Nullarbor Plain."
    nullarbor: 8.16,
    western: 9.64, // "Where Western Australia meets South Australia."
    meets: 10.6,
    south: 10.92,
    south2: 11.26,
    perth: 12.44, // "Perth is eight hours ahead of world time."
    eight1: 12.9,
    world: 14.0,
    adelaide: 15.22, // "Adelaide is nine and a half."
    nine: 15.64,
    half: 16.44,
    so: 17.12, // "So a few roadhouses in between just… split the difference."
    roadhouses: 17.74,
    between: 18.62,
    split: 19.36,
    diff: 20.14,
    plus: 21.04, // "Plus eight hours and 45 minutes."
    eight2: 21.3,
    fortyfive: 22.2,
    minutes: 22.68,
    one: 23.56, // "One of the only places on Earth with a quarter-hour offset."
    only: 23.98,
    earth: 24.96,
    quarter: 25.54,
    offset: 26.18,
    there: 27.38, // "There are signs on the highway telling drivers to change their clocks."
    signs: 27.72,
    highway: 28.42,
    change: 29.76,
    clocks: 30.32,
    no2: 31.16, // "No government ever made it official."
    government: 31.46,
    official: 32.56,
    and2: 33.5, // "And nobody's sure exactly when it began."
    exactly: 34.24,
    began: 35.12,
    yet: 35.98, // "Yet to this day,"
    day: 36.5,
    end: 37.08,
  };
  const LOOP_AT = 35.62; // whip back into the frame-1 composition

  // ---------- 1 · hook: +8:45 over the Eyre Highway ----------
  const HOOK_Y = 560;
  function roadUnder(t, k) {
    // k: 0 → frame-1 framing; >0 pushes down the road
    const zoom = 1.32 + 0.14 * k;
    const po = { zoom, fx: 2016, fy: 1250, sx: 540, sy: 980, dim: 0.28, filter: 'fWarm' };
    return `${photo('road', po)}
      <rect width="${W}" height="760" fill="url(#gTop)"/>
      <rect y="${H - 560}" width="${W}" height="560" fill="url(#gBot)"/>
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>`;
  }
  function hookDigits(prog, y = HOOK_Y, h = 250) {
    return `<g>
      <ellipse cx="540" cy="${y}" rx="520" ry="220" fill="url(#gSun)"/>
      ${flipRow('+8:45', 540, y, h, prog)}
    </g>`;
  }
  const scenes = [];
  const scene = (id, start, end, draw, tin) => scenes.push({ id, start, end, draw, tin });

  scene('hook', 0, T.and1 - 0.12, (t, local) => {
    const k = easeInOutCubic(clamp(local / 5, 0, 1));
    // hook holds big, then settles up into a badge as the VO gets going
    const settle = easeInOutCubic(p01(t, 1.35, 0.6));
    const y = lerp(HOOK_Y, 250, settle);
    const h = lerp(250, 150, settle);
    // the "strip": a glowing parchment ribbon draws along the horizon
    const ribbon = easeInOutCubic(p01(t, T.strip, 0.9));
    const vy = 862;
    const law = p01(t, T.no, 0.4);
    const strike = easeOutCubic(p01(t, T.law, 0.35));
    const sh = shake(t, T.law + 0.05, 10, 0.35);
    const lawY = 1000;
    return `<g transform="translate(${sh.x} ${sh.y})">
      ${roadUnder(t, k)}
      ${streaks(t, 540, vy, 16, 0.35)}
      <g opacity="${ribbon}">
        <path d="M${540 - 560 * ribbon} ${vy + 10} L${540 + 560 * ribbon} ${vy + 10}" stroke="#fff" stroke-width="44" stroke-linecap="round" opacity="0.55" filter="url(#fGlow)"/>
        <path d="M${540 - 560 * ribbon} ${vy + 10} L${540 + 560 * ribbon} ${vy + 10}" stroke="url(#pParch)" stroke-width="20" stroke-linecap="round"/>
        <path d="M${540 - 560 * ribbon} ${vy + 10} L${540 + 560 * ribbon} ${vy + 10}" stroke="${SUN}" stroke-width="20" stroke-linecap="round" opacity="0.35"/>
      </g>
      ${dust(t, 30, { alpha: 0.6 })}
      ${hookDigits(() => 1, y, h)}
      ${law > 0 ? `<g transform="translate(540 ${lawY}) scale(${easeOutBack(clamp(law / 0.7, 0, 1))})" opacity="${clamp(law * 3, 0, 1)}" filter="url(#fDrop)">
        <circle r="118" fill="rgba(20,10,4,0.72)" stroke="${CREAM}" stroke-width="6"/>
        <g transform="rotate(-35)">
          <rect x="-58" y="-26" width="116" height="52" rx="10" fill="${CREAM}"/>
          <rect x="-66" y="-34" width="18" height="68" rx="6" fill="${SUN}"/>
          <rect x="48" y="-34" width="18" height="68" rx="6" fill="${SUN}"/>
          <rect x="-8" y="26" width="16" height="72" rx="6" fill="${CREAM}"/>
        </g>
        <line x1="-84" y1="84" x2="84" y2="-84" stroke="${RED}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${(240 * strike).toFixed(0)} 300"/>
        <circle r="118" fill="none" stroke="${RED}" stroke-width="14" stroke-dasharray="${(742 * strike).toFixed(0)} 800" transform="rotate(-90)"/>
      </g>` : ''}
      ${chip('NO LAW', 540, lawY + 178, p01(t, T.law + 0.1, 0.45), { fill: RED, color: '#fff', size: 44 })}
    </g>`;
  });

  // ---------- 2 · "the time it runs on is bizarre": the clock that won't sit on the hour ----------
  scene('bizarre', T.and1 - 0.12, T.the - 0.1, (t, local) => {
    const po = { zoom: 1.12 + 0.05 * clamp(local / 2.5, 0, 1), fx: 2016, fy: 1500, dim: 0.42 };
    // minute hand spins, hour hand drifts; locks at 8:45 on "bizarre"
    const lock = p01(t, T.bizarre, 0.35);
    const spin = (t - T.and1) * 900; // minutes
    const mm = lock > 0 ? lerp(spin % 60, 45, easeOutBack(lock)) : spin % 60;
    const hh = lock > 0 ? 8 : 3 + ((t - T.and1) * 3.2) % 12;
    const glitch = lock > 0 && lock < 1 ? 1 - lock : 0;
    const sh = shake(t, T.bizarre, 18, 0.45);
    const p = pop(t, T.and1 - 0.1, 0.5);
    const cy = 700;
    const q = (n) => Math.sin(t * 57 + n) * 16 * glitch;
    return `${photo('golden', po)}
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      ${dust(t, 36)}
      <g transform="translate(${sh.x} ${sh.y})">
        <g transform="translate(540 ${cy}) scale(${p}) translate(-540 ${-cy})">
          ${glitch > 0 ? `<g opacity="${0.6 * glitch}" transform="translate(${q(1)} 0)" style="mix-blend-mode:screen">${clockFace(540, cy, 330, hh, mm, { hand: '#ff2a2a', rim: '#ff2a2a' })}</g>
          <g opacity="${0.6 * glitch}" transform="translate(${-q(2)} 0)" style="mix-blend-mode:screen">${clockFace(540, cy, 330, hh, mm, { hand: TEAL, rim: TEAL })}</g>` : ''}
          ${clockFace(540, cy, 330, hh, mm)}
        </g>
        ${chip('? : ??', 540, cy + 460, p01(t, T.and1 + 0.3, 0.4) * (1 - lock), { fill: 'rgba(20,10,4,0.85)', color: CREAM, stroke: SUN, size: 48, w: 280 })}
        ${chip('8:45', 540, cy + 460, lock, { fill: SUN, size: 56, w: 240 })}
      </g>`;
  }, { type: 'whip', d: 0.24 });

  // ---------- 3 · map: the Nullarbor, where WA meets SA ----------
  function mapCam3(t) {
    const k = easeInOutCubic(p01(t, T.the - 0.1, 4.3));
    return { lon: lerp(127.3, 128.4, k), lat: lerp(-31.3, -31.4, k), s: lerp(0.76, 0.98, k), sx: 540, sy: 760 };
  }
  scene('map', T.the - 0.1, T.perth - 0.14, (t) => {
    const cam = mapCam3(t);
    const pr = mapProj(cam);
    const wa = easeInOutCubic(p01(t, T.western, 0.9));
    const sa = easeInOutCubic(p01(t, T.south, 0.9));
    const border = easeInOutCubic(p01(t, T.meets - 0.1, 0.7));
    const [nx, ny] = pr.P(127.9, -30.35);
    const [wx, wy] = pr.P(126.1, -29.4);
    const [sx, sy] = pr.P(130.1, -29.4);
    const [bvx, bvy] = pr.P(...TOWN.bv);
    const cardP = p01(t, T.south2 + 0.1, 0.45);
    return `${mapLayer(t, cam, { wa, sa, border })}
      ${mapLabel('NULLARBOR PLAIN', nx, ny, p01(t, T.nullarbor, 0.55), { size: 78, ls: 8 })}
      ${mapLabel('WA', wx, wy, p01(t, T.western + 0.15, 0.5), { size: 120, side: '#6a3a10', fill: '#ffe7b8' })}
      ${mapLabel('SA', sx, sy, p01(t, T.south + 0.15, 0.5), { size: 120, side: '#4a3a20', fill: '#fff6dc' })}
      ${pin(bvx, bvy, p01(t, T.meets + 0.2, 0.7), t, { col: RUST, size: 1.2 })}
      ${card('sawa', 600, 1010, 440, 250, cardP, { fx: 2800, fy: 1150, zoom: 1.0, rot0: 12, rot: 3, caption: 'WA–SA BORDER' })}
      <rect width="${W}" height="${H}" fill="url(#gVig)" opacity="0.8"/>`;
  }, { type: 'fade', d: 0.3 });

  // ---------- 4 · Perth +8 | Adelaide +9:30 ----------
  scene('cities', T.perth - 0.14, T.so - 0.12, (t, local) => {
    const split = easeInOutCubic(p01(t, T.adelaide - 0.2, 0.5));
    const seam = lerp(W + 80, 540, split);
    const perthPo = { zoom: 1.25 + 0.05 * clamp(local / 4, 0, 1), fx: 1500, fy: 1100, sx: lerp(540, 300, split), sy: 700, dim: 0.35 };
    const adlPo = { zoom: 1.0, fx: 1180, fy: 470, sx: 810, sy: 720, dim: 0.35 };
    const clipA = nid('ca');
    const clipP = nid('cp');
    const perthCx = lerp(540, 285, split);
    const pClock = pop(t, T.eight1 - 0.1, 0.5);
    const aClock = pop(t, T.nine - 0.1, 0.5);
    const clockR = lerp(200, 160, split);
    const utc = p01(t, T.world - 0.05, 0.45);
    const aHalf = easeInOutCubic(p01(t, T.half - 0.1, 0.4)); // minute hand swings to :30 on "half"
    const adlLabel = aHalf > 0.5 ? '+9:30' : '+9';
    return `<g clip-path="url(#${clipP})">
        <clipPath id="${clipP}"><path d="M0 0 L${seam + 60} 0 L${seam - 60} ${H} L0 ${H} Z"/></clipPath>
        ${photo('perth', perthPo)}
        <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      </g>
      ${split > 0 ? `<g clip-path="url(#${clipA})">
        <clipPath id="${clipA}"><path d="M${seam + 60} 0 L${W} 0 L${W} ${H} L${seam - 60} ${H} Z"/></clipPath>
        ${photo('adelaide', adlPo)}
        <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      </g>
      <path d="M${seam + 60} 0 L${seam - 60} ${H}" stroke="#fff" stroke-width="10" filter="url(#fGlowS)"/>` : ''}
      <rect width="${W}" height="420" fill="url(#gTop)"/>
      ${chip('UTC', 540, 150, utc, { fill: 'rgba(10,20,34,0.9)', color: '#fff', stroke: TEAL, size: 46, w: 190 })}
      ${clockFace(perthCx, 620, clockR, 8, 0, { scale: pClock, label: 'AWST' })}
      ${mapLabel('PERTH', perthCx, 940, p01(t, T.perth, 0.5), { size: lerp(104, 78, split), ls: 4 })}
      ${chip('+8', perthCx, 1060, p01(t, T.eight1, 0.4), { fill: SUN, size: 64, w: 150 })}
      ${split > 0 ? `${clockFace(790, 620, 160, 9, 30 * aHalf, { scale: aClock, label: 'ACST' })}
      ${mapLabel('ADELAIDE', 790, 940, p01(t, T.adelaide, 0.5), { size: 78, ls: 4 })}
      ${chip(adlLabel, 790, 1060, p01(t, T.nine, 0.4), { fill: SUN, size: 64, w: 210 })}` : ''}`;
  }, { type: 'whip', d: 0.26 });

  // ---------- 5 · roadhouses split the difference: corridor on the map ----------
  function mapCam5(t) {
    const k = easeInOutCubic(p01(t, T.so - 0.12, 3.8));
    return { lon: lerp(127.25, 127.35, k), lat: -31.95, s: lerp(1.2, 1.3, k), sx: 540, sy: 860 };
  }
  scene('corridor', T.so - 0.12, T.plus - 0.14, (t) => {
    const cam = mapCam5(t);
    const pr = mapProj(cam);
    const hw = easeInOutCubic(p01(t, T.so, 1.0));
    const dots = [TOWN.caiguna, TOWN.cockle, TOWN.madura, TOWN.mundra];
    let d = '';
    dots.forEach((tw, i) => {
      const [x, y] = pr.P(...tw);
      d += dot(x, y, p01(t, T.roadhouses - 0.1 + i * 0.12, 0.4), { r: 11 });
    });
    const [ex, ey] = pr.P(...TOWN.eucla);
    const [bx, by] = pr.P(...TOWN.bv);
    const corr = p01(t, T.split - 0.05, 0.9);
    // offset slider: +8 ——●—— +9:30, knob snaps to the middle on "split"
    const sl = p01(t, T.between - 0.2, 0.45);
    const knob = easeOutBack(p01(t, T.split, 0.55));
    const x0 = 170;
    const x1 = 870;
    const kx = lerp(x0, (x0 + x1) / 2, knob);
    const sy = 300;
    const mid = p01(t, T.diff, 0.45);
    const cards = p01(t, T.roadhouses, 0.45) * (1 - p01(t, T.between - 0.35, 0.3));
    const [cxm, cym] = pr.P(127.5, -31.3);
    return `${mapLayer(t, cam, { wa: 1, sa: 1, border: 1 })}
      ${corridor(pr, corr, t)}
      ${highway(pr, hw, 122.0, 130.9, { w: 8 })}
      ${d}
      ${pin(ex, ey, p01(t, T.roadhouses + 0.4, 0.6), t, { col: RUST })}
      ${pin(bx, by, p01(t, T.roadhouses + 0.55, 0.6), t, { col: RUST })}
      ${mapLabel('EUCLA', ex - 20, ey - 150, p01(t, T.roadhouses + 0.5, 0.5), { size: 56, ls: 4 })}
      ${mapLabel('BORDER VILLAGE', bx - 140, ey + 130, p01(t, T.roadhouses + 0.65, 0.5), { size: 42, ls: 3 })}
      ${mapLabel('EYRE HWY', pr.P(125.1, -32.0)[0], pr.P(125.1, -32.0)[1], p01(t, T.so + 0.3, 0.5), { size: 40, ls: 3, fill: '#fff' })}
      ${mapLabel('CWST', cxm, cym, p01(t, T.diff + 0.1, 0.5), { size: 70, ls: 8, fill: '#ffe39a', side: '#6a3a10' })}
      ${card('eucla', 330, 380, 420, 260, cards, { fx: 3300, fy: 1100, rot0: -12, rot: -4, caption: 'EUCLA' })}
      ${card('border', 760, 420, 400, 260, cards * p01(t, T.roadhouses + 0.2, 0.3), { fx: 2400, fy: 1700, rot0: 10, rot: 4, caption: 'BORDER VILLAGE' })}
      ${sl > 0 ? `<g opacity="${clamp(sl * 3, 0, 1)}" transform="translate(0 ${(1 - easeOutCubic(sl)) * -60})" filter="url(#fDrop)">
        <rect x="${x0 - 110}" y="${sy - 80}" width="${x1 - x0 + 220}" height="160" rx="30" fill="rgba(20,10,4,0.82)" stroke="${SUN}" stroke-width="3"/>
        <line x1="${x0}" y1="${sy}" x2="${x1}" y2="${sy}" stroke="${CREAM}" stroke-width="10" stroke-linecap="round"/>
        <line x1="${(x0 + x1) / 2}" y1="${sy - 22}" x2="${(x0 + x1) / 2}" y2="${sy + 22}" stroke="${CREAM}" stroke-width="5" opacity="0.7"/>
        <text x="${x0 - 30}" y="${sy + 72}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="40" fill="${CREAM}">+8</text>
        <text x="${x1 + 20}" y="${sy + 72}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="40" fill="${CREAM}">+9:30</text>
        <text x="${x0 - 30}" y="${sy - 36}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="26" letter-spacing="2" fill="${SUN}">PERTH</text>
        <text x="${x1 + 20}" y="${sy - 36}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="26" letter-spacing="2" fill="${SUN}">ADELAIDE</text>
        <circle cx="${kx}" cy="${sy}" r="30" fill="${SUN}" stroke="#fff" stroke-width="6"/>
        ${mid > 0 ? `<g transform="translate(${kx} ${sy - 118}) scale(${easeOutBack(clamp(mid / 0.7, 0, 1))})"><rect x="-120" y="-44" width="240" height="88" rx="18" fill="${SUN}" stroke="#fff" stroke-width="4"/><text y="28" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="72" fill="${INK}">+8:45</text></g>` : ''}
      </g>` : ''}
      <rect width="${W}" height="${H}" fill="url(#gVig)" opacity="0.7"/>`;
  }, { type: 'whip', d: 0.26 });

  // ---------- 6 · deadpan: +8:45 flips in at Eucla ----------
  scene('offset', T.plus - 0.14, T.one - 0.14, (t, local) => {
    const po = { zoom: 1.0 + 0.04 * clamp(local / 2.4, 0, 1), fx: 3400, fy: 1250, dim: 0.46 };
    const at = [T.plus, T.eight2, T.fortyfive - 0.12, T.fortyfive, T.fortyfive + 0.12];
    const prog = (i) => p01(t, at[i], 0.28);
    const punch = 1 + 0.05 * Math.exp(-Math.max(0, t - T.fortyfive) * 6) * (t > T.fortyfive ? 1 : 0);
    const cy = 700;
    return `${photo('eucla', po)}
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      ${dust(t, 24, { alpha: 0.6 })}
      <g transform="translate(540 ${cy}) scale(${punch}) translate(-540 ${-cy})">${hookDigits(prog, cy, 270)}</g>
      ${chip('UTC+8:45', 540, cy + 250, p01(t, T.minutes, 0.4), { fill: SUN, size: 50, w: 330 })}
      ${chip('EUCLA', 540, 250, p01(t, T.plus, 0.45), { fill: 'rgba(20,10,4,0.85)', color: CREAM, stroke: SUN, size: 44, w: 240 })}`;
  }, { type: 'fade', d: 0.28 });

  // ---------- 7 · rarity: the UTC-offset dial (whole / half / quarter-hour) ----------
  const OFFS = (() => {
    const whole = [];
    for (let h = -12; h <= 14; h++) whole.push(h);
    const half = [-9.5, -3.5, 3.5, 4.5, 5.5, 6.5, 9.5, 10.5];
    const quarter = [5.75, 8.75, 12.75];
    return { whole, half, quarter };
  })();
  scene('dial', T.one - 0.14, T.there - 0.14, (t, local) => {
    const po = { zoom: 1.0, fx: 820, fy: 420, dim: 0.62, filter: 'fBlur14' };
    const cx = 540;
    const cy = 700;
    const R = 380;
    const ring = easeInOutCubic(p01(t, T.one - 0.1, 0.6));
    const dimWhole = p01(t, T.only, 0.5);
    // bezel spins like the Earth, then parks +8:45 at the top
    const spin = easeInOutCubic(p01(t, T.one, 1.6));
    const rot = lerp(-200, -((8.75 / 24) * 360), spin);
    let ticks = '';
    const tickAt = (off, len, col, w, op) => {
      const a = ((off / 24) * 360 * Math.PI) / 180;
      const r0 = R - len;
      return `<line x1="${Math.sin(a) * r0}" y1="${-Math.cos(a) * r0}" x2="${Math.sin(a) * R}" y2="${-Math.cos(a) * R}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
    };
    OFFS.whole.forEach((o, i) => { ticks += tickAt(o, 50, CREAM, 6, (0.9 - 0.6 * dimWhole) * p01(t, T.one + i * 0.015, 0.2)); });
    OFFS.half.forEach((o, i) => { ticks += tickAt(o, 70, TEAL, 8, (0.95 - 0.35 * p01(t, T.quarter, 0.4)) * p01(t, T.only + 0.1 + i * 0.03, 0.25)); });
    const qp = p01(t, T.earth - 0.1, 0.4);
    const pulse = 0.75 + 0.25 * Math.sin(t * 9);
    OFFS.quarter.forEach((o) => { ticks += tickAt(o, 110, SUN, 14, qp * (o === 8.75 ? 1 : 0.85 * pulse)); });
    const lab = p01(t, T.offset, 0.45);
    const mini = pop(t, T.quarter - 0.05, 0.5);
    const wedgeK = easeInOutCubic(p01(t, T.quarter + 0.1, 0.6));
    return `${photo('sat', po)}
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      <g transform="translate(${cx} ${cy})" opacity="${ring}">
        <circle r="${R + 40}" fill="rgba(10,16,26,0.55)" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
        <circle r="${R + 6}" fill="none" stroke="${CREAM}" stroke-width="4" stroke-dasharray="${(2 * Math.PI * (R + 6) * ring).toFixed(0)} 4000" transform="rotate(-90)"/>
        <g transform="rotate(${rot.toFixed(2)})">${ticks}</g>
        <path d="M0 ${-R - 60} l-22 -34 h44 z" fill="${SUN}" stroke="#fff" stroke-width="3" opacity="${qp}"/>
        <text x="0" y="${-R + 150}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="30" letter-spacing="4" fill="${CREAM}" opacity="${0.8 * ring * (1 - mini)}">UTC OFFSETS</text>
      </g>
      ${clockFace(cx, cy + 20, 170, 0, 0, { scale: mini, numbers: false, wedge: [0, Math.max(0.01, 15 * wedgeK)], label: '¼ HOUR' })}
      ${chip('UTC+8:45', cx, cy - R - 150, lab, { fill: SUN, size: 52, w: 340 })}
      <g opacity="${p01(t, T.only + 0.2, 0.4) * 0.9}" font-family="${DISPLAY}" font-weight="700" font-size="30" letter-spacing="2">
        <circle cx="210" cy="${cy + R + 110}" r="9" fill="${CREAM}"/><text x="230" y="${cy + R + 121}" fill="${CREAM}">HOUR</text>
        <circle cx="430" cy="${cy + R + 110}" r="9" fill="${TEAL}"/><text x="450" y="${cy + R + 121}" fill="${TEAL}">HALF</text>
        <circle cx="630" cy="${cy + R + 110}" r="9" fill="${SUN}" opacity="${qp}"/><text x="650" y="${cy + R + 121}" fill="${SUN}" opacity="${qp}">QUARTER</text>
      </g>`;
  }, { type: 'fade', d: 0.3 });

  // ---------- 8 · the highway sign: advance clocks 45 min ----------
  scene('sign', T.there - 0.14, T.no2 - 0.14, (t, local) => {
    const po = { zoom: 1.1, fx: 1000, fy: 700, dim: 0.55, filter: 'fBlur14' };
    const cp = p01(t, T.there - 0.1, 0.6);
    const push = 1 + 0.06 * easeInOutCubic(clamp(local / 3.6, 0, 1));
    const cw = 960;
    const ch = 720;
    const cy = 600;
    // sign-local (image px): "45 min" line ≈ (700, 830); sign board ≈ x 240–1170, y 340–940
    const lock = p01(t, T.signs, 0.5);
    const ring = easeInOutCubic(p01(t, T.highway + 0.1, 0.5));
    const inner = (ox, oy, s) => {
      const bx0 = ox + 240 * s;
      const by0 = oy + 345 * s;
      const bx1 = ox + 1170 * s;
      const by1 = oy + 935 * s;
      const L = 60 * lock;
      const a = 1 - lock;
      const off = 30 * a;
      const br = (x, y, dx, dy) => `<path d="M${x + dx * L} ${y} L${x} ${y} L${x} ${y + dy * L}" fill="none" stroke="${SUN}" stroke-width="8" stroke-linecap="round"/>`;
      const [rx, ry] = [ox + 700 * s, oy + 870 * s];
      return `<g opacity="${lock}" filter="url(#fGlowS)">
          ${br(bx0 - off, by0 - off, 1, 1)}${br(bx1 + off, by0 - off, -1, 1)}${br(bx0 - off, by1 + off, 1, -1)}${br(bx1 + off, by1 + off, -1, -1)}
        </g>
        <ellipse cx="${rx}" cy="${ry}" rx="${150}" ry="${52}" fill="none" stroke="${RED}" stroke-width="8" stroke-dasharray="${(700 * ring).toFixed(0)} 800" transform="rotate(-4 ${rx} ${ry})"/>`;
    };
    // the dashboard clock: minute hand advances 45 min on "change their clocks"
    const adv = easeInOutCubic(p01(t, T.change, 0.9));
    const mm = 45 * adv;
    const clockP = pop(t, T.telling || T.highway + 0.3, 0.5);
    return `${photo('sign', po)}
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      <g transform="translate(540 ${cy}) scale(${push}) translate(-540 ${-cy})">
        ${card('sign', 540, cy, cw, ch, cp, { fx: 800, fy: 700, zoom: 1.0, rot0: -9, rot: -1.5, inner })}
      </g>
      ${chip('EYRE HWY', 540, 150, p01(t, T.highway, 0.45), { fill: SIGN, color: '#fff', size: 44, w: 280 })}
      ${clockFace(300, 1080, 120, 8, mm, { scale: pop(t, T.highway + 0.4, 0.5), numbers: false, trail: [0, mm] })}
      ${chip('+45 MIN', 610, 1080, p01(t, T.clocks, 0.4), { fill: SUN, size: 52, w: 290 })}`;
  }, { type: 'whip', d: 0.26 });

  // ---------- 9 · no statute; origin unknown ----------
  scene('official', T.no2 - 0.14, LOOP_AT, (t, local) => {
    const later = easeInOutCubic(p01(t, T.and2 - 0.2, 0.5));
    const poA = { zoom: 1.06 + 0.04 * clamp(local / 2.5, 0, 1), fx: 2300, fy: 1650, dim: 0.5 };
    const poB = { zoom: 1.4, fx: 2016, fy: 1300, dim: 0.5, filter: 'fSepia' };
    // register card
    const cp = p01(t, T.no2 - 0.1, 0.5);
    const cardOut = later;
    const cx = 540;
    const cy = lerp(620, -500, cardOut);
    const rows = [
      ['AWST', 'UTC+8', T.government - 0.05, true],
      ['ACST', 'UTC+9:30', T.government + 0.25, true],
      ['CWST', 'UTC+8:45', T.official - 0.5, false],
    ];
    let r = '';
    rows.forEach(([a, b, t0, ok], i) => {
      const p = p01(t, t0, 0.35);
      const y = -130 + i * 130;
      const mark = ok
        ? `<path d="M270 ${y - 10} l22 24 l40 -48" fill="none" stroke="${GREEN}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${(110 * p01(t, t0 + 0.15, 0.25)).toFixed(0)} 200"/>`
        : `<line x1="270" y1="${y}" x2="330" y2="${y}" stroke="#8a7a60" stroke-width="10" stroke-linecap="round" opacity="${p01(t, t0 + 0.2, 0.2)}"/>`;
      r += `<g opacity="${p}" transform="translate(${(1 - easeOutCubic(p)) * -40} 0)">
        <text x="-330" y="${y + 18}" font-family="${DISPLAY}" font-weight="700" font-size="56" letter-spacing="3" fill="${INK}">${a}</text>
        <text x="-130" y="${y + 18}" font-family="${MONO}" font-weight="700" font-size="46" fill="#4a3620">${b}</text>
        ${mark}
        <line x1="-340" y1="${y + 56}" x2="350" y2="${y + 56}" stroke="#b39a70" stroke-width="2"/>
      </g>`;
    });
    const k = easeOutBack(clamp(cp / 0.6, 0, 1));
    const regCard = cp > 0 && cardOut < 1 ? `<g transform="translate(${cx} ${cy}) rotate(${lerp(-8, -2, easeOutCubic(cp))}) scale(${k})" filter="url(#fShadow)">
        <rect x="-400" y="-300" width="800" height="560" rx="10" fill="${PAPER}"/>
        <rect x="-384" y="-284" width="768" height="528" rx="6" fill="none" stroke="#b39a70" stroke-width="3"/>
        <text x="0" y="-222" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="44" letter-spacing="10" fill="#4a3620">TIME ZONES</text>
        ${r}
        ${stamp('UNOFFICIAL', 0, 208, t, T.official, { size: 54, rot: -5 })}
      </g>` : '';
    // "when it began": year counter that never settles
    const yp = p01(t, T.and2 + 0.1, 0.45);
    const fast = t > T.exactly ? 2.2 : 1;
    const settle = p01(t, T.began, 0.3);
    const digit = (i) => (settle > 0 ? '?' : String(Math.floor(rnd(Math.floor(t * 14 * fast) + i * 7, i) * 10)));
    const tiles = yp > 0 ? flipRow(`${digit(0)}${digit(1)}${digit(2)}${digit(3)}`, 540, 760, 210, () => 1) : '';
    const sh = shake(t, T.began, 12, 0.3);
    return `${photo('border', poA)}
      <g opacity="${later}">${photo('caiguna', poB)}</g>
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      ${dust(t, 24, { alpha: 0.5 })}
      ${regCard}
      ${yp > 0 ? `<g opacity="${clamp(yp * 3, 0, 1)}" transform="translate(${sh.x} ${sh.y + (1 - easeOutCubic(yp)) * 80})">
        ${chip('BEGAN', 540, 540, yp, { fill: 'rgba(20,10,4,0.85)', color: CREAM, stroke: SUN, size: 46, w: 250 })}
        ${tiles}
      </g>` : ''}
      ${chip('NO STATUTE', 540, 1080, p01(t, T.official + 0.35, 0.4) * (1 - later), { fill: RED, color: '#fff', size: 46, w: 330 })}`;
  }, { type: 'fade', d: 0.28 });

  // ---------- 10 · loop: whip back to the frame-1 composition ----------
  scene('loop', LOOP_AT, 99, (t) => {
    // Converges on the exact frame-1 state (road k=0, +8:45 big) by the last word.
    const k = 0.15 * (1 - easeInOutCubic(p01(t, LOOP_AT, 0.9)));
    const at = [T.yet - 0.1, T.yet + 0.06, T.day - 0.26, T.day - 0.14, T.day - 0.02];
    const prog = (i) => p01(t, at[i], 0.3);
    return `${roadUnder(t, k)}
      ${streaks(t, 540, 862, 16, 0.35)}
      ${dust(t, 30, { alpha: 0.6 })}
      ${hookDigits(prog)}`;
  }, { type: 'whip', d: 0.22 });

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
    if (!prev || tin.type === 'cut' || u >= 1) return drawScene(sc, t);
    const e = easeInOutCubic(u);
    if (tin.type === 'whip') {
      const dx = (1 - e) * W;
      return `<g transform="translate(${-e * W * 0.6} 0)" opacity="${1 - e * 0.6}">${drawScene(prev, t)}</g>
        <g transform="translate(${dx} 0)">${drawScene(sc, t)}</g>
        <rect width="${W}" height="${H}" fill="#fff" opacity="${(Math.sin(e * Math.PI) * 0.22).toFixed(3)}"/>`;
    }
    return `${drawScene(prev, t)}<g opacity="${e.toFixed(3)}">${drawScene(sc, t)}</g>`;
  }

  window.EPISODE = {
    duration: T.end,
    fps: 30,
    images: Object.fromEntries([
      ...Object.entries(IMG).map(([k, v]) => [k, v[0]]),
      ['mapBase', MAP.base],
      ['mapWa', MAP.wa],
      ['mapSa', MAP.sa],
      ['mapGlow', MAP.glow],
      ['mapBorder', MAP.bglow],
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
    const gx = Math.floor(rnd(Math.floor(t * 30), 1) * 200);
    const gy = Math.floor(rnd(Math.floor(t * 30), 2) * 200);
    document.getElementById('root').innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
        ${DEFS}
        <rect width="${W}" height="${H}" fill="#0a0704"/>
        ${composite(t)}
        <rect x="${-gx}" y="${-gy}" width="${W + 200}" height="${H + 200}" filter="url(#fGrain)" opacity="0.6"/>
        ${caps}
      </svg>`;
    return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  };
})();
