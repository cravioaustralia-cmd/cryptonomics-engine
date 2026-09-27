/* s15 — Irukandji (smaller than your fingernail)
 * Photo underlay + SVG motion graphics, SVG + renderFrame(t) only (no Remotion).
 * Beat times come from ../transcript.json (faster-whisper small.en word timings on audio/vo.mp3).
 * On-screen text is limited to the frame-1 hook plus names, places, key facts and prop text. There are no VO-echo titles.
 * Map: the NASA MODIS basemap (s15_12, crop of s15_04) carries the locked-style layers built by
 * build-map-layers.py from its own pixels: parchment fill (s15_13), shadow + thick white glow (s15_14),
 * and the tropical-north coastal waters band (s15_15). Northern Australia / Cape York / GBR only.
 * Soft facts: ~1–2 cm bell; onset shown as "~30 MIN"; the ECG is mood only; "RARE DEATHS" is restrained.
 * No gore and no wound stills. The Munch painting is an abstract proxy for "doom".
 * Caption band (~70%, y≈1250–1440), the bottom UI zone and the right edge are kept clear of graphics.
 */
(function () {
  const HS = window.HS;
  const { W, H, clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic } = HS;

  const IMG = {
    macro: ['/img/s15_01_carukia_barnesi_gershwin.jpg', 1394, 1536],
    vial: ['/img/s15_02_irukandji_tube_queensland.jpg', 2221, 1606],
    stingers: ['/img/s15_08_marine_stingers_vinegar_depot.jpg', 946, 1352],
    hosp: ['/img/s15_09_mater_hospital_townsville.jpg', 2592, 1944],
    ecg: ['/img/s15_10_ecg_12_lead.jpg', 3507, 2300],
    munch: ['/img/s15_11_munch_scream_doom_mood.jpg', 3223, 4000],
  };
  const MAP = {
    base: '/img/s15_12_map_basemap.jpg',
    parch: '/img/s15_13_map_parchment.png',
    glow: '/img/s15_14_map_glow.png',
    waters: '/img/s15_15_map_waters.png',
    w: 2800,
    h: 3959,
  };
  // Places in basemap crop px (checked against the MODIS pixels: tip of Cape York, Princess Charlotte Bay, outer reef).
  const PLACE = { capeYork: [470, 150], reefA: [1330, 1030], reefB: [2060, 2150] };
  // Sampled inside the waters band (s15_15 alpha > 0.43), crop px.
  const WATER_PTS = [[1208,1078],[404,132],[1210,1290],[2366,3128],[1030,852],[2286,3132],[216,980],[1704,1682],[724,292],[1274,1682],[1194,1512],[2306,3276],[294,562],[2020,2144],[1180,1520],[914,578],[1522,1596],[114,2566],[2026,2316],[1060,818],[2002,2432],[2512,3772],[106,2504],[242,788],[2010,2136],[1206,1126],[2294,3308],[400,108],[1910,2090],[2398,3688],[1156,952],[1206,1564],[400,314],[852,456],[1212,1470],[1856,1850],[2114,2688],[238,892],[726,306],[970,678],[2464,3592],[1936,1864],[1972,2096],[1982,2158],[270,584],[1970,2420],[596,8],[346,526],[1012,612],[1870,1860],[1188,1358],[1164,1054],[2472,3564],[162,1988],[208,1602],[8,2740],[112,2274],[154,856],[192,1940],[136,1676],[1346,1608],[2458,3648],[286,998],[396,114],[754,142],[2022,2618],[842,356],[132,2254],[2580,3828],[716,268]];

  const DISPLAY = `'Oswald', 'DejaVu Sans Condensed', 'DejaVu Sans', sans-serif`;
  const SANS = `'DejaVu Sans', 'Liberation Sans', sans-serif`;
  const MONO = `'DejaVu Sans Mono', 'Liberation Mono', monospace`;
  const CYAN = '#5fe8ff';
  const ICE = '#d9fbff';
  const RED = '#ff3b30';
  const AMBER = '#ffb627';
  const GREEN = '#39e58c';
  const INK = '#071418';
  const PAPER = '#f1e6c8';

  // ---------- helpers ----------
  const p01 = (t, t0, d) => clamp((t - t0) / d, 0, 1);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let uid = 0;
  const nid = (k) => k + uid++;
  // deterministic pseudo-random
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

  /** Full-bleed cover crop: image px (fx,fy) lands at screen (sx,sy) at the given zoom (clamped to cover). */
  function photo(key, o = {}) {
    const [url, iw, ih] = IMG[key];
    const base = Math.max(W / iw, H / ih);
    const s = base * (o.zoom || 1);
    const w = iw * s;
    const h = ih * s;
    let x = (o.sx != null ? o.sx : W / 2) - (o.fx != null ? o.fx : iw / 2) * s;
    let y = (o.sy != null ? o.sy : H / 2) - (o.fy != null ? o.fy : ih / 2) * s;
    x = clamp(x, W - w, 0);
    y = clamp(y, H - h, 0);
    const filt = o.filter ? ` filter="url(#${o.filter})"` : '';
    return `<image href="${url}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"${filt}/>
      ${o.tint ? `<rect width="${W}" height="${H}" fill="${o.tint}"/>` : ''}
      <rect width="${W}" height="${H}" fill="rgba(0,0,0,${o.dim != null ? o.dim : 0.45})"/>`;
  }
  /** Screen position of image px (fx,fy) for the same photo() options. */
  function photoPt(key, o, px, py) {
    const [, iw, ih] = IMG[key];
    const s = Math.max(W / iw, H / ih) * (o.zoom || 1);
    const w = iw * s;
    const h = ih * s;
    const x = clamp((o.sx != null ? o.sx : W / 2) - (o.fx != null ? o.fx : iw / 2) * s, W - w, 0);
    const y = clamp((o.sy != null ? o.sy : H / 2) - (o.fy != null ? o.fy : ih / 2) * s, H - h, 0);
    return [x + px * s, y + py * s, s];
  }

  /** Bold 3D/extruded label with drop shadow. */
  function text3d(str, x, y, o = {}) {
    const size = o.size || 96;
    const depth = o.depth != null ? o.depth : Math.round(size / 11);
    const fill = o.fill || '#ffffff';
    const side = o.side || '#0b3a44';
    const anchor = o.anchor || 'middle';
    const ls = o.ls != null ? o.ls : 2;
    const fam = o.family || DISPLAY;
    const wt = o.weight || 700;
    let s = '';
    for (let i = depth; i >= 1; i--) {
      s += `<text x="${x + i * 0.9}" y="${y + i}" text-anchor="${anchor}" font-family="${fam}" font-weight="${wt}" font-size="${size}" letter-spacing="${ls}" fill="${side}">${esc(str)}</text>`;
    }
    const stroke = o.stroke || INK;
    s += `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${fam}" font-weight="${wt}" font-size="${size}" letter-spacing="${ls}" fill="${fill}" stroke="${stroke}" stroke-width="${o.sw != null ? o.sw : size / 22}" paint-order="stroke">${esc(str)}</text>`;
    return `<g filter="url(#fDrop)"${o.opacity != null ? ` opacity="${o.opacity}"` : ''}>${s}</g>`;
  }

  /** Rounded label chip that pops in with p (0..1). */
  function chip(label, x, y, p, o = {}) {
    if (p <= 0) return '';
    const size = o.size || 40;
    const w = o.w || label.length * size * 0.58 + size * 1.3;
    const h = size * 1.55;
    const k = easeOutBack(clamp(p / 0.6, 0, 1));
    const fill = o.fill || AMBER;
    const col = o.color || INK;
    return `<g transform="translate(${x} ${y}) scale(${k})" opacity="${clamp(p * 3, 0, 1)}" filter="url(#fDrop)">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h * 0.22}" fill="${fill}" stroke="${o.stroke || 'rgba(255,255,255,0.85)'}" stroke-width="3"/>
      ${o.icon || ''}
      <text x="${o.icon ? size * 0.55 : 0}" y="${size * 0.36}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="${size}" letter-spacing="2" fill="${col}">${esc(label)}</text>
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
    return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${k * (o.scale || 1)})" opacity="${clamp(p * 4, 0, 1)}">
      <rect x="${-w / 2 - b}" y="${-h / 2 - b}" width="${w + 2 * b}" height="${h + 2 * b}" rx="6" fill="${o.frame || PAPER}" filter="url(#fShadow)"/>
      <clipPath id="${id}"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}"/></clipPath>
      <g clip-path="url(#${id})">
        <image href="${url}" x="${-w / 2 + x}" y="${-h / 2 + y}" width="${pw}" height="${ph}" preserveAspectRatio="none"/>
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="url(#gLens)"/>
        ${o.inner ? o.inner(-w / 2 + x, -h / 2 + y, s) : ''}
      </g>
    </g>`;
  }

  /** Marine-snow particles drifting through the frame. */
  function snow(t, n = 60, o = {}) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const sp = 14 + rnd(i, 1) * 40;
      const x = (rnd(i, 2) * W + Math.sin(t * 0.7 + i) * 18 + t * (o.dx || 6)) % W;
      const y = (((rnd(i, 3) * H - t * sp) % H) + H) % H;
      const r = 1.2 + rnd(i, 4) * 3.2;
      const a = (0.18 + rnd(i, 5) * 0.5) * (o.alpha != null ? o.alpha : 1);
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${o.color || ICE}" opacity="${a.toFixed(2)}"/>`;
    }
    return `<g>${s}</g>`;
  }

  /** Tiny translucent box-jelly glyph (bell + four trailing tentacles). */
  function jellyGlyph(x, y, r, t, o = {}) {
    const pulse = 1 + 0.08 * Math.sin(t * 5 + (o.ph || 0));
    const c = o.color || ICE;
    const a = o.alpha != null ? o.alpha : 0.9;
    let tent = '';
    for (let k = 0; k < 4; k++) {
      const bx = x + (k - 1.5) * r * 0.5;
      const sway = Math.sin(t * 2.4 + k + (o.ph || 0)) * r * 0.5;
      tent += `<path d="M${bx} ${y + r * 0.5} q${sway} ${r * 1.2} ${sway * 0.4} ${r * 2.6}" stroke="${c}" stroke-width="${Math.max(1, r * 0.12)}" fill="none" opacity="${a * 0.7}"/>`;
    }
    return `<g>${tent}<path d="M${x - r * pulse} ${y + r * 0.5} Q${x - r * pulse} ${y - r * 1.1} ${x} ${y - r * 1.1} Q${x + r * pulse} ${y - r * 1.1} ${x + r * pulse} ${y + r * 0.5} Z" fill="${c}" fill-opacity="${a * 0.35}" stroke="${c}" stroke-width="${Math.max(1.2, r * 0.14)}" opacity="${a}"/></g>`;
  }

  // ---------- body scan figure (front / back) ----------
  function catmull(pts, closed = true) {
    const n = pts.length;
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = pts[(i - 1 + n) % n];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const p3 = pts[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
    }
    return d + (closed ? ' Z' : '');
  }
  const HALF_BODY = [[16,-176],[22,-158],[36,-148],[72,-138],[100,-126],[114,-104],[122,-70],[128,-14],[136,46],[144,104],[150,152],[152,180],[140,194],[128,184],[124,156],[114,106],[104,48],[96,-4],[90,-50],[84,-60],[84,-20],[80,26],[80,64],[88,104],[92,146],[88,210],[80,284],[72,344],[68,398],[74,420],[62,434],[32,434],[34,410],[32,340],[28,262],[18,182],[6,152]];
  const BODY_PATH = catmull([...HALF_BODY, [0, 150], ...HALF_BODY.slice().reverse().map(([x, y]) => [-x, y]), [0, -180]]);

  function figure(cx, cy, sc, t, zones, o = {}) {
    const id = nid('fb');
    let z = '';
    for (const zn of zones) {
      if (zn.p <= 0) continue;
      const pul = 0.75 + 0.25 * Math.sin(t * (zn.rate || 7) + (zn.ph || 0));
      z += `<ellipse cx="${zn.x}" cy="${zn.y}" rx="${zn.rx * (0.7 + 0.3 * zn.p)}" ry="${zn.ry * (0.7 + 0.3 * zn.p)}" fill="url(#${zn.grad || 'gHeat'})" opacity="${(zn.p * pul).toFixed(3)}"/>`;
    }
    const scanY = -280 + ((t * 420) % 760);
    return `<g transform="translate(${cx} ${cy}) scale(${sc})">
      <clipPath id="${id}"><path d="${BODY_PATH}"/><circle cx="0" cy="-226" r="52"/></clipPath>
      <g clip-path="url(#${id})">
        <rect x="-200" y="-300" width="400" height="760" fill="rgba(20,70,90,0.42)"/>
        ${z}
        <rect x="-200" y="${scanY}" width="400" height="26" fill="url(#gScan)" opacity="0.7"/>
        ${Array.from({ length: 24 }, (_, i) => `<line x1="-200" x2="200" y1="${-290 + i * 32}" y2="${-290 + i * 32}" stroke="${CYAN}" stroke-opacity="0.08" stroke-width="2"/>`).join('')}
      </g>
      <path d="${BODY_PATH}" fill="none" stroke="${CYAN}" stroke-width="4" filter="url(#fGlowS)"/>
      <circle cx="0" cy="-226" r="52" fill="none" stroke="${CYAN}" stroke-width="4" filter="url(#fGlowS)"/>
      ${o.back ? `<path d="M0 -168 L0 120" stroke="${CYAN}" stroke-opacity="0.45" stroke-width="3" stroke-dasharray="10 10"/>` : `<path d="M-40 -150 Q0 -130 40 -150" stroke="${CYAN}" stroke-opacity="0.4" stroke-width="3" fill="none"/>`}
    </g>`;
  }

  // ---------- BP dial ----------
  function bpDial(cx, cy, r, val, t, p) {
    if (p <= 0) return '';
    const k = easeOutBack(clamp(p / 0.5, 0, 1));
    const a0 = 135;
    const span = 270;
    const ang = (v) => ((a0 + (v / 300) * span) * Math.PI) / 180;
    let ticks = '';
    for (let v = 0; v <= 300; v += 10) {
      const a = ang(v);
      const big = v % 50 === 0;
      const r1 = r - (big ? 44 : 24);
      ticks += `<line x1="${Math.cos(a) * r1}" y1="${Math.sin(a) * r1}" x2="${Math.cos(a) * (r - 8)}" y2="${Math.sin(a) * (r - 8)}" stroke="${v >= 180 ? RED : '#1b2a30'}" stroke-width="${big ? 7 : 3}"/>`;
      if (big) ticks += `<text x="${Math.cos(a) * (r - 80)}" y="${Math.sin(a) * (r - 80) + 13}" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="36" fill="#1b2a30">${v}</text>`;
    }
    const arcR = r - 14;
    const aR0 = ang(180);
    const aR1 = ang(300);
    const redArc = `<path d="M${Math.cos(aR0) * arcR} ${Math.sin(aR0) * arcR} A${arcR} ${arcR} 0 0 1 ${Math.cos(aR1) * arcR} ${Math.sin(aR1) * arcR}" stroke="${RED}" stroke-opacity="0.35" stroke-width="30" fill="none"/>`;
    const jitter = val > 180 ? Math.sin(t * 60) * 2.5 : 0;
    const na = ang(val + jitter);
    const hot = clamp((val - 170) / 60, 0, 1);
    return `<g transform="translate(${cx} ${cy}) scale(${k})" filter="url(#fShadow)">
      <circle r="${r + 26}" fill="#c9ced1"/>
      <circle r="${r + 14}" fill="#8e979b"/>
      <circle r="${r}" fill="#f4f1ea"/>
      ${redArc}${ticks}
      <text y="${r * 0.42}" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="34" fill="#44525a">mmHg</text>
      <circle r="${r}" fill="${RED}" opacity="${(hot * (0.12 + 0.1 * Math.sin(t * 14))).toFixed(3)}"/>
      <line x1="${-Math.cos(na) * 40}" y1="${-Math.sin(na) * 40}" x2="${Math.cos(na) * (r - 30)}" y2="${Math.sin(na) * (r - 30)}" stroke="${RED}" stroke-width="10" stroke-linecap="round"/>
      <circle r="24" fill="#1b2a30"/><circle r="9" fill="#c9ced1"/>
      <ellipse cx="${-r * 0.3}" cy="${-r * 0.45}" rx="${r * 0.55}" ry="${r * 0.22}" fill="#fff" opacity="0.18" transform="rotate(-25)"/>
    </g>`;
  }

  // ---------- ECG trace ----------
  function ecgPath(x0, x1, y, t, o = {}) {
    const bpm = o.bpm || 70;
    const amp = o.amp || 90;
    const per = 60 / bpm;
    const speed = o.speed || 520; // px per second
    const pts = [];
    const head = x0 + ((t * speed) % (x1 - x0 + 200));
    for (let x = x0; x <= Math.min(x1, head); x += 4) {
      const tt = (x - x0) / speed;
      const ph = (tt % per) / per;
      let v = 0;
      if (ph > 0.1 && ph < 0.16) v = 0.12 * Math.sin(((ph - 0.1) / 0.06) * Math.PI);
      else if (ph > 0.22 && ph < 0.25) v = -0.18 * ((ph - 0.22) / 0.03);
      else if (ph >= 0.25 && ph < 0.28) v = -0.18 + 1.18 * ((ph - 0.25) / 0.03);
      else if (ph >= 0.28 && ph < 0.31) v = 1 - 1.35 * ((ph - 0.28) / 0.03);
      else if (ph >= 0.31 && ph < 0.34) v = -0.35 + 0.35 * ((ph - 0.31) / 0.03);
      else if (ph > 0.45 && ph < 0.6) v = 0.22 * Math.sin(((ph - 0.45) / 0.15) * Math.PI);
      if (o.flat) v *= o.flat;
      pts.push(`${x.toFixed(0)},${(y - v * amp).toFixed(1)}`);
    }
    if (pts.length < 2) return '';
    const last = pts[pts.length - 1].split(',');
    const col = o.color || GREEN;
    return `<polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="${o.width || 6}" stroke-linejoin="round" filter="url(#fGlowS)" opacity="${o.opacity != null ? o.opacity : 1}"/>
      <circle cx="${last[0]}" cy="${last[1]}" r="9" fill="#fff" filter="url(#fGlowS)" opacity="${o.opacity != null ? o.opacity : 1}"/>`;
  }

  // ---------- locked-style map ----------
  function mapLayer(t, cam, o = {}) {
    const s = cam.s;
    const tx = W / 2 - cam.x * s;
    const ty = H / 2 - cam.y * s;
    const P = (x, y) => [tx + x * s, ty + y * s];
    const rev = o.reveal != null ? o.reveal : 1;
    const clipId = nid('mr');
    const revY = rev * (MAP.h + 200);
    let dots = '';
    if (o.waters > 0) {
      WATER_PTS.forEach(([x, y], i) => {
        const [sx, sy] = P(x + Math.sin(t * 0.8 + i) * 18, y + Math.cos(t * 0.6 + i * 1.3) * 14);
        if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) return;
        const a = o.waters * clamp((o.waters * 70 - i) / 6, 0, 1);
        if (a <= 0) return;
        dots += jellyGlyph(sx, sy, 7 + rnd(i, 9) * 4, t, { alpha: 0.85 * a, ph: i });
      });
    }
    const shimmer = 0.78 + 0.22 * Math.sin(t * 3.1);
    return `<g>
      <rect width="${W}" height="${H}" fill="#050c1a"/>
      <g transform="translate(${tx} ${ty}) scale(${s})">
        <image href="${MAP.base}" x="0" y="0" width="${MAP.w}" height="${MAP.h}" preserveAspectRatio="none"/>
        <image href="${MAP.waters}" x="0" y="0" width="${MAP.w}" height="${MAP.h}" preserveAspectRatio="none" opacity="${((o.waters || 0) * shimmer).toFixed(3)}"/>
        <clipPath id="${clipId}"><rect x="-100" y="-100" width="${MAP.w + 200}" height="${revY}"/></clipPath>
        <g clip-path="url(#${clipId})">
          <image href="${MAP.glow}" x="0" y="0" width="${MAP.w}" height="${MAP.h}" preserveAspectRatio="none"/>
          <image href="${MAP.parch}" x="0" y="0" width="${MAP.w}" height="${MAP.h}" preserveAspectRatio="none"/>
        </g>
        ${rev > 0 && rev < 1 ? `<rect x="-100" y="${revY - 110}" width="${MAP.w + 200}" height="12" fill="#fff" opacity="0.85" filter="url(#fGlow)"/>` : ''}
      </g>
      ${dots}
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
    </g>`;
  }

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
      <filter id="fBlur12"><feGaussianBlur stdDeviation="14"/></filter>
      <filter id="fCold" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.55 0.3 0.1 0 0  0.3 0.6 0.15 0 0  0.3 0.4 0.45 0 0.03  0 0 0 1 0"/>
      </filter>
      <filter id="fRedGrade" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.7 0.3 0.1 0 0.05  0.1 0.25 0.05 0 0  0.1 0.2 0.1 0 0  0 0 0 1 0"/>
      </filter>
      <filter id="fDoom" x="0" y="0" width="100%" height="100%">
        <feTurbulence id="doomTurb" type="fractalNoise" baseFrequency="0.004 0.009" numOctaves="2" seed="11" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="60" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="fNausea" x="0" y="0" width="100%" height="100%">
        <feTurbulence id="nauTurb" type="turbulence" baseFrequency="0.006 0.012" numOctaves="1" seed="4" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="0" id="nauMap" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <radialGradient id="gVig" cx="50%" cy="45%" r="72%">
        <stop offset="55%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.78"/>
      </radialGradient>
      <radialGradient id="gVigRed" cx="50%" cy="45%" r="70%">
        <stop offset="40%" stop-color="#3a0000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#3a0000" stop-opacity="0.9"/>
      </radialGradient>
      <radialGradient id="gHeat">
        <stop offset="0" stop-color="#fff2c0" stop-opacity="1"/>
        <stop offset="0.3" stop-color="#ff5a2a" stop-opacity="0.95"/>
        <stop offset="1" stop-color="#ff1a1a" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="gSick">
        <stop offset="0" stop-color="#eaffb0" stop-opacity="1"/>
        <stop offset="0.35" stop-color="#9be23a" stop-opacity="0.9"/>
        <stop offset="1" stop-color="#5fae1a" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="gBell">
        <stop offset="0" stop-color="${CYAN}" stop-opacity="0.35"/>
        <stop offset="1" stop-color="${CYAN}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="gScan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${CYAN}" stop-opacity="0"/>
        <stop offset="0.8" stop-color="${CYAN}" stop-opacity="0.7"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0.9"/>
      </linearGradient>
      <linearGradient id="gTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0.7"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="gLens" cx="35%" cy="30%" r="80%">
        <stop offset="0" stop-color="#fff" stop-opacity="0.1"/>
        <stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.3"/>
      </radialGradient>
      <filter id="fGrain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="2"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.07 0"/>
      </filter>
    </defs>`;

  // ---------- beat times (transcript.json) ----------
  const T = {
    small: 1.28, // "smaller than your fingernail"
    and1: 3.0, // "and it can make you feel like you're about to die."
    die1: 4.88,
    its: 5.62, // "It's the Irukandji"
    iruk: 6.08,
    waters: 7.58,
    north: 8.22,
    sting: 9.5, // "The sting is so small…"
    barely: 11.32,
    then: 12.72, // "Then, about half an hour later…"
    half: 13.5,
    hits: 14.88,
    crush: 15.78, // "Crushing pain in your back and chest."
    back: 16.96,
    chest: 17.42,
    vomit: 18.2,
    bp: 19.16, // "Your blood pressure spikes."
    spikes: 19.86,
    and2: 20.72, // "And one of the strangest symptoms doctors describe?"
    over: 23.72, // "An overwhelming feeling of doom."
    doom: 25.24,
    people: 25.9, // "People become convinced they're going to die."
    most: 28.0, // "Most survive with fast hospital treatment,"
    hospital: 29.72,
    but: 30.9, // "but deaths have been recorded."
    deaths: 31.16,
    all: 32.78, // "All from a jellyfish… smaller than your fingernail."
    smaller2: 33.96,
    nail2: 34.98,
    end: 35.64,
  };
  const LOOP_AT = 35.18; // whip back into the frame-1 composition

  // ---------- scenes ----------
  function hookTitle(t, t0, o = {}) {
    // t0 = when the title lands. At t0 the title is fully readable (frame-1 hook); a flash decays over it.
    const k = p01(t, t0, 0.5);
    const sc = o.fromBig ? lerp(1.6, 1, easeOutCubic(p01(t, t0 - 0.12, 0.12))) : 1 + 0.06 * (1 - easeOutCubic(k));
    const flash = (1 - k) * 0.9;
    const y = 470;
    return `<g transform="translate(540 ${y}) scale(${sc}) translate(-540 ${-y})">
      <text x="540" y="${y}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="196" letter-spacing="10" fill="${CYAN}" opacity="${(0.35 + flash * 0.6).toFixed(3)}" filter="url(#fGlow)">IRUKANDJI</text>
      ${text3d('IRUKANDJI', 540, y, { size: 196, ls: 10, depth: 16, side: '#07343d', fill: '#ffffff', sw: 7 })}
    </g>`;
  }

  function macroHook(t, local, o = {}) {
    const zoom = 1.02 + 0.05 * clamp(local / 3, 0, 1);
    const po = { zoom, fx: 900, fy: 700, sx: 560, sy: 1020, dim: 0.22 };
    const [bx, by] = photoPt('macro', po, 950, 560);
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.4);
    return `${photo('macro', po)}
      <circle cx="${bx}" cy="${by}" r="${460 + pulse * 30}" fill="url(#gBell)" opacity="${0.6 + pulse * 0.3}"/>
      ${snow(t, 55, { alpha: 0.7 })}
      <rect width="${W}" height="620" fill="url(#gTop)"/>
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>`;
  }

  const scenes = [];
  const scene = (id, start, end, draw, tin) => scenes.push({ id, start, end, draw, tin });

  // 1 — frame-1 hook: IRUKANDJI over the Carukia barnesi macro
  scene('hook', 0, T.small - 0.08, (t, local) => {
    const sh = shake(t, 0, 16, 0.4);
    return `<g transform="translate(${sh.x} ${sh.y})">${macroHook(t, local)}${hookTitle(t, 0)}</g>`;
  });

  // 2 — fingernail scale: the jelly in the vial beside a fingertip
  function vialBeat(t, local, t0, o = {}) {
    const p = p01(t, t0, 0.55);
    const cw = 980;
    const ch = Math.round((cw * 1606) / 2221);
    const cy = 640;
    const zoomIn = o.zoomIn || 0;
    const underlay = photo('vial', { zoom: 1.6 + 0.1 * clamp(local / 3, 0, 1), fx: 1300, fy: 760, dim: 0.5, filter: 'fBlur12' });
    // card-local coordinates (card is centred at 540,cy; image covers the card exactly)
    const s = cw / 2221;
    const nail = [(-cw / 2) + 672 * s, (-ch / 2) + 622 * s];
    const jel = [(-cw / 2) + 1322 * s, (-ch / 2) + 752 * s];
    const m = p01(t, t0 + 0.35, 0.5);
    const cal = easeOutCubic(p01(t, t0 + 0.55, 0.5));
    const jw = 88 * cal;
    const readout = p01(t, t0 + 0.8, 0.4);
    const inner = () => `
      <ellipse cx="${nail[0]}" cy="${nail[1]}" rx="${66}" ry="${34}" transform="rotate(-6 ${nail[0]} ${nail[1]})" fill="none" stroke="${AMBER}" stroke-width="5" stroke-dasharray="${(m * 330).toFixed(0)} 400" filter="url(#fGlowS)"/>
      <circle cx="${jel[0]}" cy="${jel[1]}" r="${64 + 6 * Math.sin(t * 6)}" fill="none" stroke="${CYAN}" stroke-width="5" opacity="${m}" filter="url(#fGlowS)"/>
      <g opacity="${cal}">
        <line x1="${jel[0] - jw}" x2="${jel[0] + jw}" y1="${jel[1] + 104}" y2="${jel[1] + 104}" stroke="#fff" stroke-width="5"/>
        <line x1="${jel[0] - jw}" x2="${jel[0] - jw}" y1="${jel[1] + 84}" y2="${jel[1] + 124}" stroke="#fff" stroke-width="5"/>
        <line x1="${jel[0] + jw}" x2="${jel[0] + jw}" y1="${jel[1] + 84}" y2="${jel[1] + 124}" stroke="#fff" stroke-width="5"/>
      </g>`;
    const zk = easeInOutCubic(zoomIn);
    const zs = 1 + zk * 5.5;
    const jx = 540 + jel[0];
    const jy = cy + jel[1];
    const [jgx, jgy] = [jx, jy];
    return `<g transform="translate(${jgx} ${jgy}) scale(${zs}) translate(${-jgx} ${-jgy})">
      ${underlay}
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      ${card('vial', 540, cy, cw, ch, p, { rot0: -8, rot: -1.5, inner })}
      ${chip('~1–2 CM', 540 + jel[0] + 40, cy + jel[1] + 270, readout * (1 - clamp(zoomIn * 4, 0, 1)), { fill: CYAN, size: 46 })}
      ${snow(t, 22, { alpha: 0.35 })}
    </g>`;
  }
  scene('scale', T.small - 0.08, T.and1 - 0.02, (t, local) => vialBeat(t, local, T.small - 0.08), { type: 'whip', d: 0.22 });

  // 3 — "…feel like you're about to die": push onto the bell, red heartbeat closes in
  scene('dread', T.and1 - 0.02, T.its - 0.1, (t, local) => {
    const zoom = 1.25 + 0.35 * easeInOutCubic(clamp(local / 2.6, 0, 1));
    const po = { zoom, fx: 950, fy: 560, sx: 540, sy: 820, dim: 0.3 };
    const [bx, by] = photoPt('macro', po, 950, 560);
    const bpm = lerp(70, 150, clamp(local / 2.4, 0, 1));
    const beat = ((t - T.and1) * bpm) / 60;
    const ph = beat - Math.floor(beat);
    const thump = Math.exp(-ph * 7);
    const red = clamp((t - T.and1) / 1.6, 0, 1);
    let rings = '';
    for (let i = 0; i < 3; i++) {
      const q = (ph + i / 3) % 1;
      rings += `<circle cx="${bx}" cy="${by}" r="${200 + q * 520}" fill="none" stroke="${RED}" stroke-width="${6 * (1 - q)}" opacity="${(0.6 * (1 - q) * red).toFixed(3)}"/>`;
    }
    const sc = 1 + thump * 0.012 * red;
    return `<g transform="translate(540 960) scale(${sc}) translate(-540 -960)">
      ${photo('macro', po)}
      ${rings}
      ${snow(t, 40, { alpha: 0.5 })}
      <rect width="${W}" height="${H}" fill="url(#gVigRed)" opacity="${(red * (0.55 + 0.45 * thump)).toFixed(3)}"/>
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
    </g>`;
  }, { type: 'fade', d: 0.3 });

  // 4 — map: Irukandji waters of northern Australia (locked map style)
  scene('map', T.its - 0.1, T.sting - 0.06, (t, local) => {
    const k = easeInOutCubic(clamp(local / 3.8, 0, 1));
    const cam = { s: lerp(0.5, 0.6, k), x: lerp(1330, 1480, k), y: lerp(1880, 1980, k) };
    const P = (x, y) => [W / 2 + (x - cam.x) * cam.s, H / 2 + (y - cam.y) * cam.s];
    const reveal = easeInOutCubic(p01(t, T.its, 1.1));
    const waters = easeOutCubic(p01(t, T.waters - 0.3, 0.9));
    const nameP = p01(t, T.iruk, 0.5);
    const northP = p01(t, T.north - 0.1, 0.45);
    const [cyx, cyy] = P(...PLACE.capeYork);
    const [ax, ay] = P(...PLACE.reefA);
    const [bx, by] = P(...PLACE.reefB);
    const reefAng = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
    const reefP = p01(t, T.waters + 0.2, 0.5);
    const capeP = p01(t, T.its + 0.5, 0.4);
    const sl = easeOutBack(clamp(northP / 0.7, 0, 1));
    const [nx, ny] = P(1150, 1950); // inland, clear of the caption band
    return `${mapLayer(t, cam, { reveal, waters })}
      <g opacity="${capeP}">
        <circle cx="${cyx}" cy="${cyy}" r="${10 + 4 * Math.sin(t * 5)}" fill="${AMBER}" stroke="#fff" stroke-width="4"/>
        ${text3d('CAPE YORK', cyx + 26, cyy + 14, { size: 42, anchor: 'start', side: '#4a2c0c', depth: 5, ls: 3 })}
      </g>
      <g opacity="${reefP}" transform="translate(${(ax + bx) / 2 + 50} ${(ay + by) / 2 - 20}) rotate(${reefAng})">
        ${text3d('GREAT BARRIER REEF', 0, 0, { size: 44, side: '#063a44', depth: 5, ls: 6, fill: ICE })}
      </g>
      ${northP > 0 ? `<g transform="translate(${nx} ${ny}) scale(${sl}) translate(${-nx} ${-ny})" opacity="${clamp(northP * 3, 0, 1)}">
        ${text3d('NORTHERN', nx, ny - 20, { size: 104, side: '#5a3410', depth: 11, ls: 6, fill: '#fff6dc' })}
        ${text3d('AUSTRALIA', nx, ny + 88, { size: 104, side: '#5a3410', depth: 11, ls: 6, fill: '#fff6dc' })}
      </g>` : ''}
      ${chip('IRUKANDJI', 540, 190, nameP, { fill: 'rgba(8,30,38,0.88)', color: ICE, stroke: CYAN, size: 44, w: 380, icon: jellyGlyph(-128, 6, 16, t, { alpha: 1 }) })}`;
  }, { type: 'fade', d: 0.35 });

  // 5 — "The sting is so small…": loupe on the tentacle beads, stinging threads fire
  scene('sting', T.sting - 0.06, T.then - 0.08, (t, local) => {
    const zoom = 1.55 + 0.25 * clamp(local / 3.2, 0, 1);
    const po = { zoom, fx: 640, fy: 1130, sx: 520, sy: 820, dim: 0.35 };
    const [lx, ly] = [560, 720];
    const lr = 250;
    const lp = easeOutBack(p01(t, T.sting + 0.3, 0.5));
    const [px, py, ps] = photoPt('macro', po, 640, 1130);
    const lz = 2.6;
    const lid = nid('lp');
    // stinging threads from beads inside the loupe
    let threads = '';
    for (let i = 0; i < 9; i++) {
      const fire = p01(t, T.sting + 0.9 + i * 0.12, 0.25);
      if (fire <= 0) continue;
      const a = rnd(i, 7) * Math.PI * 2;
      const len = (90 + rnd(i, 8) * 120) * easeOutCubic(fire);
      const ox = lx + Math.cos(a) * 40 * rnd(i, 3);
      const oy = ly + Math.sin(a) * 40 * rnd(i, 4);
      threads += `<path d="M${ox} ${oy} q${Math.cos(a + 0.5) * len * 0.3} ${Math.sin(a + 0.5) * len * 0.3} ${Math.cos(a) * len} ${Math.sin(a) * len}" stroke="${ICE}" stroke-width="3" fill="none" opacity="${0.9 - fire * 0.4}" filter="url(#fGlowS)"/>
        <circle cx="${ox + Math.cos(a) * len}" cy="${oy + Math.sin(a) * len}" r="4" fill="#fff"/>`;
    }
    // "barely notice it": a pin-prick flash
    const prick = p01(t, T.barely + 0.2, 0.9);
    const pr = prick > 0 && prick < 1 ? `<circle cx="${lx + 150}" cy="${ly + 360}" r="${4 + prick * 60}" fill="none" stroke="${RED}" stroke-width="${3 * (1 - prick)}" opacity="${1 - prick}"/><circle cx="${lx + 150}" cy="${ly + 360}" r="4" fill="${RED}" opacity="${1 - prick * 0.6}"/>` : '';
    const scale = lz * ps;
    return `${photo('macro', po)}
      ${snow(t, 40, { alpha: 0.5 })}
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      ${lp > 0 ? `<g transform="translate(${lx} ${ly}) scale(${lp}) translate(${-lx} ${-ly})">
        <line x1="${px}" y1="${py}" x2="${lx - lr * 0.7}" y2="${ly + lr * 0.7}" stroke="${CYAN}" stroke-width="3" opacity="0.7"/>
        <circle cx="${px}" cy="${py}" r="46" fill="none" stroke="${CYAN}" stroke-width="4" opacity="0.8"/>
        <clipPath id="${lid}"><circle cx="${lx}" cy="${ly}" r="${lr}"/></clipPath>
        <circle cx="${lx}" cy="${ly}" r="${lr + 14}" fill="#0b1b20" filter="url(#fShadow)"/>
        <g clip-path="url(#${lid})">
          <image href="${IMG.macro[0]}" x="${lx - 640 * scale}" y="${ly - 1130 * scale}" width="${1394 * scale}" height="${1536 * scale}" preserveAspectRatio="none"/>
          <rect x="${lx - lr}" y="${ly - lr}" width="${lr * 2}" height="${lr * 2}" fill="rgba(0,20,30,0.25)"/>
          ${threads}
        </g>
        <circle cx="${lx}" cy="${ly}" r="${lr}" fill="none" stroke="${CYAN}" stroke-width="8" filter="url(#fGlowS)"/>
        <circle cx="${lx}" cy="${ly}" r="${lr + 14}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="3"/>
        <text x="${lx + lr - 20}" y="${ly - lr + 30}" font-family="${MONO}" font-weight="700" font-size="30" fill="${CYAN}">×40</text>
      </g>` : ''}
      ${pr}`;
  }, { type: 'fade', d: 0.3 });

  // 6 — "…about half an hour later… it hits": stinger-season beach, onset timer
  scene('timer', T.then - 0.08, T.hits + 0.18, (t, local) => {
    const po = { zoom: 1.08 + 0.04 * clamp(local / 2.4, 0, 1), fx: 400, fy: 620, sx: 540, sy: 640, dim: 0.42 };
    const run = easeInOutCubic(p01(t, T.then + 0.3, 1.75));
    const mins = Math.round(run * 30);
    const cx = 330;
    const cy = 1010;
    const r = 120;
    const ap = easeOutBack(p01(t, T.then, 0.45));
    const a = run * Math.PI * 2;
    const ex = cx + Math.sin(a) * r;
    const ey = cy - Math.cos(a) * r;
    const large = a > Math.PI ? 1 : 0;
    const arc = run > 0.001 ? `<path d="M${cx} ${cy - r} A${r} ${r} 0 ${large} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}" stroke="${AMBER}" stroke-width="22" fill="none" stroke-linecap="round" filter="url(#fGlowS)"/>` : '';
    const chipP = p01(t, T.half, 0.45);
    const sh = shake(t, T.hits, 30, 0.35);
    const flash = t >= T.hits ? Math.exp(-(t - T.hits) * 9) : 0;
    let ticks = '';
    for (let i = 0; i < 60; i++) {
      const ta = (i / 60) * Math.PI * 2;
      const r1 = i % 5 === 0 ? r + 26 : r + 34;
      ticks += `<line x1="${cx + Math.sin(ta) * r1}" y1="${cy - Math.cos(ta) * r1}" x2="${cx + Math.sin(ta) * (r + 44)}" y2="${cy - Math.cos(ta) * (r + 44)}" stroke="#fff" stroke-width="${i % 5 === 0 ? 5 : 2}" opacity="0.8"/>`;
    }
    return `<g transform="translate(${sh.x} ${sh.y})">
      ${photo('stingers', po)}
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      <g transform="translate(${cx} ${cy}) scale(${ap}) translate(${-cx} ${-cy})" filter="url(#fDrop)">
        <circle cx="${cx}" cy="${cy}" r="${r + 60}" fill="rgba(6,16,20,0.78)" stroke="rgba(255,255,255,0.6)" stroke-width="4"/>
        ${ticks}
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="22"/>
        ${arc}
        <text x="${cx}" y="${cy + 26}" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="62" fill="#fff">${String(mins).padStart(2, '0')}:00</text>
        <rect x="${cx - 28}" y="${cy - r - 104}" width="56" height="34" rx="6" fill="#dfe6e8"/>
      </g>
      ${chip('~30 MIN', 770, cy, chipP, { fill: AMBER, size: 56 })}
      <rect width="${W}" height="${H}" fill="${RED}" opacity="${(flash * 0.55).toFixed(3)}"/>
    </g>`;
  }, { type: 'fade', d: 0.3 });

  // 7 — symptoms: body scan (back + chest), nausea wobble, BP dial spike — over the ECG, red-graded
  scene('symptoms', T.hits + 0.18, T.and2 - 0.1, (t, local) => {
    const sh = shake(t, T.hits + 0.18, 26, 0.5);
    const po = { zoom: 1.1 + 0.05 * clamp(local / 5, 0, 1), fx: 1750, fy: 1150, dim: 0.62, filter: 'fRedGrade' };
    const figP = easeOutBack(p01(t, T.hits + 0.2, 0.5));
    const backP = p01(t, T.back - 0.1, 0.4);
    const chestP = p01(t, T.chest - 0.1, 0.4);
    const sickP = p01(t, T.vomit - 0.05, 0.3) * (1 - p01(t, T.bp - 0.2, 0.3));
    const bpOn = p01(t, T.bp - 0.2, 0.4);
    const figOut = easeInOutCubic(p01(t, T.bp - 0.3, 0.45));
    const val = lerp(118, 262, easeOutCubic(p01(t, T.spikes - 0.35, 0.6))) + (t < T.spikes - 0.35 ? Math.sin(t * 8) * 3 : 0);
    const naus = sickP;
    const fy = 700;
    const figs = figP > 0 ? `<g opacity="${1 - figOut}" transform="translate(0 ${-figOut * 120})">
      <g transform="translate(540 ${fy}) scale(${figP}) translate(-540 ${-fy})">
        ${figure(330, fy, 0.95, t, [
          { x: 0, y: -92, rx: 90, ry: 62, p: chestP, rate: 8 },
          { x: 0, y: 8, rx: 70, ry: 50, p: sickP, grad: 'gSick', rate: 5 },
        ])}
        ${figure(750, fy, 0.95, t, [
          { x: 0, y: -96, rx: 100, ry: 64, p: backP, rate: 8, ph: 1 },
          { x: 0, y: 30, rx: 70, ry: 46, p: backP * 0.85, rate: 8, ph: 2 },
        ], { back: true })}
      </g>
      ${chip('CHEST', 330, 1160, chestP, { fill: RED, color: '#fff', size: 40 })}
      ${chip('BACK', 750, 1160, backP, { fill: RED, color: '#fff', size: 40 })}
    </g>` : '';
    const nauScale = (naus * 26).toFixed(1);
    return `<g transform="translate(${sh.x} ${sh.y})">
      <g filter="url(#fNausea)" data-naus="${nauScale}">
        ${photo('ecg', po)}
        <rect width="${W}" height="${H}" fill="#6fae1a" opacity="${(naus * 0.18).toFixed(3)}"/>
        ${ecgPath(0, W, 1560, t - T.hits, { bpm: 128, amp: 70, color: RED, speed: 700, opacity: 0.45, width: 5 })}
        ${figs}
      </g>
      ${bpDial(540, 720, 300, val, t, bpOn)}
      ${chip('BP ↑', 540, 1120, p01(t, T.spikes - 0.1, 0.4), { fill: RED, color: '#fff', size: 50 })}
      <rect width="${W}" height="${H}" fill="url(#gVigRed)" opacity="0.7"/>
    </g>`;
  }, { type: 'flash', d: 0.18, color: '#ff2a1a' });

  // 8 — "…strangest symptoms doctors describe?": case-notes clipboard over the doom painting
  function notes(t, t0, pOut) {
    const p = easeOutBack(p01(t, t0, 0.5));
    if (p <= 0 || pOut >= 1) return '';
    const lines = [
      ['PAIN — BACK / CHEST', t0 + 0.5],
      ['VOMITING', t0 + 0.8],
      ['BLOOD PRESSURE ↑', t0 + 1.1],
    ];
    const x0 = 180;
    let body = '';
    lines.forEach(([txt, ts], i) => {
      const q = p01(t, ts, 0.3);
      const y = 380 + i * 110;
      body += `<g opacity="${q}"><text x="${x0 + 70}" y="${y}" font-family="${SANS}" font-weight="700" font-size="42" fill="#1d2326">${esc(txt)}</text>
        <path d="M${x0} ${y - 14} l14 16 l28 -34" stroke="#1f8a4c" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="70" stroke-dashoffset="${70 * (1 - q)}"/></g>`;
    });
    const qm = p01(t, t0 + 1.6, 0.3);
    const y4 = 380 + 3 * 110;
    body += `<g opacity="${qm}"><rect x="${x0 - 6}" y="${y4 - 46}" width="46" height="46" rx="6" fill="none" stroke="#1d2326" stroke-width="5"/>
      <text x="${x0 + 70}" y="${y4}" font-family="${SANS}" font-weight="700" font-size="54" fill="${RED}">? ? ?</text></g>`;
    const out = easeInOutCubic(pOut);
    return `<g transform="translate(${out * -900} ${out * 60}) rotate(${-3 - out * 8} 540 560) translate(540 560) scale(${p}) translate(-540 -560)" filter="url(#fShadow)">
      <rect x="110" y="200" width="860" height="720" rx="20" fill="#7a5a35"/>
      <rect x="130" y="240" width="820" height="660" rx="8" fill="#f6f2e8"/>
      ${Array.from({ length: 7 }, (_, i) => `<line x1="150" x2="930" y1="${400 + i * 110 - 60}" y2="${400 + i * 110 - 60}" stroke="#9fb7d0" stroke-width="2" opacity="0.6"/>`).join('')}
      <rect x="420" y="178" width="240" height="70" rx="14" fill="#b9bec2" stroke="#6d7479" stroke-width="4"/>
      <text x="${x0 - 10}" y="300" font-family="${SANS}" font-weight="700" font-size="30" letter-spacing="4" fill="#6d7479">SYMPTOMS</text>
      ${body}
    </g>`;
  }
  scene('doctors', T.and2 - 0.1, T.over - 0.1, (t, local) => {
    const po = { zoom: 1.0 + 0.06 * clamp(local / 3, 0, 1), fx: 1650, fy: 2000, dim: 0.6, filter: 'fCold' };
    return `${photo('munch', po)}
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      ${notes(t, T.and2, 0)}`;
  }, { type: 'fade', d: 0.35 });

  // 9 — "…an overwhelming feeling of doom. People become convinced…": The Scream, warped, tunnel closes
  scene('doom', T.over - 0.1, T.most - 0.12, (t, local) => {
    const k = easeInOutCubic(clamp(local / 4.3, 0, 1));
    const po = { zoom: lerp(1.08, 1.75, k), fx: 1650, fy: 2280, sx: 540, sy: 900, dim: lerp(0.3, 0.5, k) };
    const doomP = p01(t, T.doom - 0.12, 0.45);
    const tunnel = p01(t, T.people, 2.0);
    const beat = (t * 88) / 60;
    const thump = Math.exp(-(beat - Math.floor(beat)) * 6);
    const notesOut = p01(t, T.over - 0.1, 0.5);
    const sl = easeOutBack(clamp(doomP / 0.6, 0, 1));
    const [fx, fy] = photoPt('munch', po, 1650, 2300);
    return `<g filter="url(#fDoom)">${photo('munch', po)}</g>
      <radialGradient id="gTun" gradientUnits="userSpaceOnUse" cx="${fx}" cy="${fy}" r="${lerp(1500, 620, easeInOutCubic(tunnel))}">
        <stop offset="0.35" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="${(0.55 + tunnel * 0.4 + thump * 0.05).toFixed(3)}"/>
      </radialGradient>
      <rect width="${W}" height="${H}" fill="url(#gTun)"/>
      <rect width="${W}" height="${H}" fill="url(#gVigRed)" opacity="${(0.35 + 0.25 * thump * tunnel).toFixed(3)}"/>
      ${notesOut < 1 ? notes(t, T.and2, notesOut) : ''}
      ${doomP > 0 ? `<g transform="translate(540 330) scale(${sl}) rotate(${-4 * (1 - sl)}) translate(-540 -330)" opacity="${clamp(doomP * 3, 0, 1)}">
        ${text3d('SENSE OF DOOM', 540, 360, { size: 118, ls: 6, depth: 12, fill: '#ffe9e0', side: '#4a0000', stroke: '#1a0000' })}
      </g>` : ''}`;
  }, { type: 'cut' });

  // 10 — "Most survive with fast hospital treatment, but deaths have been recorded."
  scene('hospital', T.most - 0.12, T.all - 0.1, (t, local) => {
    const k = clamp(local / 4.8, 0, 1);
    const cold = p01(t, T.but, 0.6);
    const po = { zoom: 1.02 + 0.08 * k, fx: 1250, fy: 950, sx: 560, sy: 820, dim: lerp(0.3, 0.5, cold) };
    const crossP = easeOutBack(p01(t, T.hospital - 0.2, 0.5));
    const hosP = p01(t, T.hospital - 0.05, 0.45);
    const tagP = p01(t, T.most + 0.3, 0.5);
    const rareP = p01(t, T.deaths, 0.5);
    const cx = 540;
    const cy = 470;
    return `${photo('hosp', po)}
      <rect width="${W}" height="${H}" fill="#123040" opacity="${(cold * 0.35).toFixed(3)}"/>
      <rect width="${W}" height="620" fill="url(#gTop)"/>
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      <g opacity="${tagP}" transform="translate(${lerp(-40, 0, easeOutCubic(tagP))} 0)">
        <rect x="56" y="96" width="560" height="62" rx="10" fill="rgba(0,0,0,0.6)"/>
        <circle cx="90" cy="127" r="11" fill="${AMBER}"/>
        <text x="114" y="139" font-family="${SANS}" font-weight="700" font-size="32" fill="#fff">Townsville · Queensland</text>
      </g>
      ${crossP > 0 ? `<g transform="translate(${cx} ${cy}) scale(${crossP * (1 + 0.03 * Math.sin(t * 5))})" filter="url(#fDrop)" opacity="${1 - cold * 0.45}">
        <circle r="120" fill="rgba(255,255,255,0.92)"/>
        <path d="M-30 -80 h60 v50 h50 v60 h-50 v50 h-60 v-50 h-50 v-60 h50 Z" fill="${GREEN}" stroke="#0d5a33" stroke-width="5"/>
      </g>` : ''}
      ${chip('HOSPITAL', cx, cy + 200, hosP, { fill: GREEN, color: INK, size: 48 })}
      <rect x="0" y="930" width="${W}" height="220" fill="rgba(0,0,0,0.45)"/>
      ${ecgPath(0, W, 1040, t - T.most, { bpm: lerp(96, 66, k), amp: 70, color: GREEN, speed: 520, opacity: 1 - cold * 0.55, width: 6 })}
      ${chip('RARE DEATHS', cx, 860, rareP, { fill: 'rgba(235,238,240,0.95)', color: '#1d2326', size: 42 })}`;
  }, { type: 'fade', d: 0.35 });

  // 11 — loop: "All from a jellyfish… smaller than your fingernail." → whip back into the frame-1 hook
  scene('loop', T.all - 0.1, LOOP_AT, (t, local) => {
    const zin = p01(t, LOOP_AT - 0.34, 0.34);
    return vialBeat(t, local, T.all - 0.1, { zoomIn: zin });
  }, { type: 'fade', d: 0.3 });
  scene('loopHook', LOOP_AT, 99, (t, local) => {
    return `${macroHook(t, local)}${hookTitle(t, LOOP_AT + 0.12, { fromBig: true })}`;
  }, { type: 'flash', d: 0.14, color: '#dffbff' });

  // ---------- compositor (true crossfades, whip, flash) ----------
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
      let body = drawScene(sc, t);
      if (tin.type === 'flash' && u < 1) body += `<rect width="${W}" height="${H}" fill="${tin.color || '#fff'}" opacity="${(1 - u) * 0.8}"/>`;
      return body;
    }
    const e = easeInOutCubic(u);
    if (tin.type === 'whip') {
      const dx = (1 - e) * W;
      return `<g transform="translate(${-e * W * 0.6} 0)" opacity="${1 - e * 0.6}">${drawScene(prev, t)}</g>
        <g transform="translate(${dx} 0)">${drawScene(sc, t)}</g>
        <rect width="${W}" height="${H}" fill="#fff" opacity="${(Math.sin(e * Math.PI) * 0.25).toFixed(3)}"/>`;
    }
    if (tin.type === 'flash') {
      return `${drawScene(sc, t)}<rect width="${W}" height="${H}" fill="${tin.color || '#fff'}" opacity="${((1 - u) * 0.85).toFixed(3)}"/>`;
    }
    return `${drawScene(prev, t)}<g opacity="${e.toFixed(3)}">${drawScene(sc, t)}</g>`;
  }

  window.EPISODE = {
    duration: 35.64,
    fps: 30,
    images: Object.fromEntries([
      ...Object.entries(IMG).map(([k, v]) => [k, v[0]]),
      ['mapBase', MAP.base],
      ['mapParch', MAP.parch],
      ['mapGlow', MAP.glow],
      ['mapWaters', MAP.waters],
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
        <rect width="${W}" height="${H}" fill="#03080c"/>
        ${composite(t)}
        <rect x="${-gx}" y="${-gy}" width="${W + 200}" height="${H + 200}" filter="url(#fGrain)" opacity="0.6"/>
        ${caps}
      </svg>`;
    // animate filter params that SVG attributes can't express per-frame via template alone
    const doom = document.getElementById('doomTurb');
    if (doom) doom.setAttribute('baseFrequency', `${(0.004 + 0.0012 * Math.sin(t * 0.9)).toFixed(5)} ${(0.009 + 0.002 * Math.cos(t * 0.7)).toFixed(5)}`);
    const nm = document.getElementById('nauMap');
    const nd = document.querySelector('[data-naus]');
    if (nm) nm.setAttribute('scale', nd ? nd.getAttribute('data-naus') : '0');
    const nt = document.getElementById('nauTurb');
    if (nt) nt.setAttribute('seed', String(Math.floor(t * 12) % 50));
    // let the new SVG paint (images are pre-decoded by frame.html) before the screenshot
    return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  };
})();
