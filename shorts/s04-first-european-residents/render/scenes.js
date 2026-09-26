/* s04 — Australia's First European Residents (Batavia 1629 / Wouter Loos & Jan Pelgrom)
 * Photo underlay every beat + SVG motion graphics. SVG + renderFrame(t) + Playwright + ffmpeg.
 * All beat timings are pinned to transcript.json word times (faster-whisper medium.en).
 */
(function () {
  const HS = window.HS;
  const { W, H, clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic } = HS;
  const DURATION = 61.56;

  // ---------------------------------------------------------------- palette / type
  const C = {
    gold: '#F2C14E',
    goldDeep: '#C8932B',
    ink: '#0B1620',
    navy: '#0E2A3B',
    sea: '#7FD6E0',
    red: '#C8372D',
    wax: '#8E1B16',
    bone: '#F3E9D2',
    white: '#FFFFFF',
  };
  const F = {
    cond: "'Oswald', 'Liberation Sans Narrow', 'Arial Narrow', sans-serif",
    serif: "'Playfair', 'DejaVu Serif', Georgia, serif",
  };

  // ---------------------------------------------------------------- images (native sizes)
  const IMG = {
    replica: { f: 's04_01_batavia_replica.jpg', w: 1920, h: 1440 },
    reef: { f: 's04_02_abrolhos_islands.jpg', w: 1920, h: 1367 },
    plate: { f: 's04_03_ongeluckige_voyagie.jpg', w: 1920, h: 1473 },
    fort: { f: 's04_04_wiebbe_hayes_fort.jpg', w: 1920, h: 1440 },
    timbers: { f: 's04_05_batavia_timbers.jpg', w: 1920, h: 1280 },
    beacon: { f: 's04_06_beacon_island.jpg', w: 1920, h: 1286 },
    kalbarri: { f: 's04_07_kalbarri_coast.jpg', w: 1920, h: 1280 },
    wreck: { f: 's04_08_batavia_wreck_site.jpg', w: 1920, h: 1270 },
  };

  // ---------------------------------------------------------------- small utils
  const ease = easeInOutCubic;
  const sat = (x) => clamp(x, 0, 1);
  const prog = (t, a, b) => sat((t - a) / (b - a));
  const inOut = (t, a, b, fi = 0.3, fo = 0.3) => Math.min(prog(t, a, a + fi), 1 - prog(t, b - fo, b));
  const f2 = (n) => Math.round(n * 100) / 100;
  function hash(n) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let uid = 0;
  const id = (p) => `${p}${++uid}`;

  function text(str, x, y, o = {}) {
    const attrs = [
      `x="${f2(x)}"`,
      `y="${f2(y)}"`,
      `font-family="${o.font || F.cond}"`,
      `font-size="${o.size || 40}"`,
      `font-weight="${o.weight || 600}"`,
      `fill="${o.fill || C.white}"`,
      `text-anchor="${o.anchor || 'middle'}"`,
    ];
    if (o.ls != null) attrs.push(`letter-spacing="${o.ls}"`);
    if (o.opacity != null) attrs.push(`opacity="${f2(o.opacity)}"`);
    if (o.italic) attrs.push('font-style="italic"');
    if (o.stroke) attrs.push(`stroke="${o.stroke}" stroke-width="${o.sw || 6}" paint-order="stroke" stroke-linejoin="round"`);
    if (o.filter) attrs.push(`filter="${o.filter}"`);
    if (o.extra) attrs.push(o.extra);
    return `<text ${attrs.join(' ')}>${o.raw ? str : esc(str)}</text>`;
  }

  // per-letter reveal via tspan opacity (no manual glyph positioning needed)
  function letterReveal(str, p) {
    const n = str.length;
    return str
      .split('')
      .map((ch, i) => `<tspan fill-opacity="${f2(sat(p * (n + 3) - i) / 1)}">${esc(ch)}</tspan>`)
      .join('');
  }
  function typeReveal(str, p) {
    const n = Math.round(str.length * sat(p));
    return esc(str.slice(0, n));
  }

  // ---------------------------------------------------------------- camera / photo placement
  // cover-fit the image, then zoom about a focal point (fx, fy in 0..1); never shows edges.
  function camera(img, cam) {
    const base = Math.max(W / img.w, H / img.h);
    const s = base * (cam.z || 1);
    const iw = img.w * s;
    const ih = img.h * s;
    let ox = W / 2 - cam.fx * iw + (cam.dx || 0);
    let oy = H / 2 - cam.fy * ih + (cam.dy || 0);
    if (!cam.free) {
      ox = clamp(ox, W - iw, 0);
      oy = clamp(oy, H - ih, 0);
    }
    return {
      s,
      ox,
      oy,
      pt: (u, v) => [ox + u * iw, oy + v * ih],
    };
  }
  function photo(key, cam, o = {}) {
    const img = IMG[key];
    const c = camera(img, cam);
    const filt = o.filter ? ` filter="${o.filter}"` : '';
    let s = `<use href="#im-${key}" transform="translate(${f2(c.ox)} ${f2(c.oy)}) scale(${c.s.toFixed(5)})"${filt}/>`;
    if (o.grade) s += `<rect width="${W}" height="${H}" fill="${o.grade}" opacity="${o.gradeOp ?? 0.35}" style="mix-blend-mode:${o.blend || 'multiply'}"/>`;
    if (o.dim) s += `<rect width="${W}" height="${H}" fill="#000" opacity="${f2(o.dim)}"/>`;
    return { svg: s, cam: c };
  }
  // camera keyframes: [{t, fx, fy, z}]
  function camAt(keys, t) {
    if (t <= keys[0].t) return keys[0];
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i];
      const b = keys[i + 1];
      if (t <= b.t) {
        const u = ease((t - a.t) / (b.t - a.t));
        return { fx: lerp(a.fx, b.fx, u), fy: lerp(a.fy, b.fy, u), z: lerp(a.z, b.z, u) };
      }
    }
    return keys[keys.length - 1];
  }
  const legibility = (top = 0.55, bottom = 0.5) =>
    `<rect width="${W}" height="${H}" fill="url(#gTop)" opacity="${top}"/>` +
    `<rect width="${W}" height="${H}" fill="url(#gBottom)" opacity="${bottom}"/>`;

  // ---------------------------------------------------------------- map projection
  // Simplified Australian coastline (lon, lat), generalised from real coordinates.
  const AUS = [
    [115.0, -34.3], [115.0, -33.6], [115.6, -33.3], [115.7, -32.6], [115.7, -31.95], [115.3, -31.0],
    [115.0, -30.3], [114.93, -29.25], [114.61, -28.78], [114.43, -28.38], [114.25, -28.19], [114.22, -28.07],
    [114.16, -27.71], [113.87, -27.3], [113.5, -26.6], [113.16, -26.15], [113.6, -26.6], [113.8, -26.0],
    [113.4, -25.2], [113.65, -24.9], [113.4, -24.3], [113.6, -23.3], [113.8, -22.5], [114.15, -21.8],
    [114.3, -22.4], [114.6, -21.8], [115.4, -21.5], [116.7, -20.6], [117.9, -20.6], [118.6, -20.3],
    [119.6, -20.0], [121.0, -19.5], [121.7, -18.6], [122.2, -18.0], [122.4, -17.2], [122.9, -16.4],
    [123.6, -17.2], [123.9, -16.4], [124.4, -15.9], [125.1, -15.0], [125.6, -14.4], [126.2, -14.1],
    [126.9, -13.8], [127.8, -14.3], [128.1, -15.0], [128.4, -14.8], [129.4, -14.9], [129.7, -14.0],
    [130.3, -12.9], [130.8, -12.4], [131.5, -12.2], [132.2, -11.3], [132.7, -11.6], [133.4, -11.8],
    [134.0, -11.9], [135.0, -12.2], [135.9, -11.9], [136.9, -12.3], [136.5, -13.2], [135.9, -13.3],
    [135.5, -14.9], [136.4, -15.6], [137.8, -16.4], [139.2, -17.4], [140.8, -17.5], [141.5, -15.6],
    [141.6, -13.5], [141.9, -12.2], [142.2, -11.0], [142.5, -10.7], [143.2, -11.9], [143.5, -12.6],
    [143.8, -14.0], [144.5, -14.2], [145.3, -15.0], [145.4, -16.0], [145.8, -16.9], [146.1, -18.2],
    [146.8, -19.3], [148.2, -20.0], [149.2, -21.1], [150.0, -22.2], [150.8, -22.8], [151.3, -23.8],
    [152.4, -24.9], [153.2, -25.4], [153.1, -26.2], [153.4, -27.4], [153.6, -28.6], [153.1, -30.3],
    [152.9, -31.4], [152.5, -32.4], [151.8, -32.9], [151.3, -33.9], [150.9, -34.4], [150.8, -35.1],
    [150.2, -36.1], [149.9, -37.1], [149.9, -37.5], [148.0, -37.9], [147.0, -38.5], [146.4, -39.1],
    [145.9, -38.6], [145.2, -38.5], [144.9, -38.3], [144.6, -38.3], [143.5, -38.8], [142.5, -38.4],
    [141.6, -38.35], [140.9, -38.05], [139.8, -37.2], [139.3, -35.9], [138.6, -35.6], [138.1, -35.6],
    [138.5, -34.9], [138.1, -34.2], [137.8, -35.0], [137.0, -35.2], [137.5, -34.0], [137.8, -32.6],
    [137.2, -33.6], [135.9, -34.7], [135.3, -33.9], [134.2, -32.8], [133.7, -32.1], [132.2, -32.0],
    [131.1, -31.5], [128.9, -31.7], [127.0, -32.3], [125.0, -32.8], [123.9, -33.6], [121.9, -33.9],
    [120.1, -33.95], [119.0, -34.4], [117.9, -35.0], [116.7, -35.0], [115.6, -34.8], [115.0, -34.3],
  ];
  function projector(box) {
    // box: {lon0, lon1, lat0 (north), lat1 (south), x, y, w}
    const k = box.w / ((box.lon1 - box.lon0) * Math.cos(((box.lat0 + box.lat1) / 2) * Math.PI / 180));
    const kx = k * Math.cos(((box.lat0 + box.lat1) / 2) * Math.PI / 180);
    const h = (box.lat0 - box.lat1) * k;
    return {
      h,
      p: (lon, lat) => [box.x + (lon - box.lon0) * kx, box.y + (box.lat0 - lat) * k],
    };
  }
  const polyPath = (pts, close) =>
    pts.map((q, i) => `${i ? 'L' : 'M'}${f2(q[0])} ${f2(q[1])}`).join(' ') + (close ? ' Z' : '');
  function smoothPath(pts) {
    // Catmull-Rom → cubic Bézier
    let d = `M${f2(pts[0][0])} ${f2(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${f2(c1[0])} ${f2(c1[1])} ${f2(c2[0])} ${f2(c2[1])} ${f2(p2[0])} ${f2(p2[1])}`;
    }
    return d;
  }
  // point + heading at fraction p along a polyline
  function along(pts, p) {
    const seg = [];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      seg.push(l);
      total += l;
    }
    let d = sat(p) * total;
    for (let i = 0; i < seg.length; i++) {
      if (d <= seg[i] || i === seg.length - 1) {
        const u = seg[i] ? d / seg[i] : 0;
        const a = pts[i];
        const b = pts[i + 1];
        return { x: lerp(a[0], b[0], u), y: lerp(a[1], b[1], u), ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
      }
      d -= seg[i];
    }
    return { x: pts[0][0], y: pts[0][1], ang: 0 };
  }
  // densify a polyline with Catmull-Rom so `along()` follows the drawn curve
  function densify(pts, n = 12) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      for (let j = 0; j < n; j++) {
        const t = j / n;
        const t2 = t * t;
        const t3 = t2 * t;
        const f = (a, b, c, d) =>
          0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  // ---------------------------------------------------------------- reusable MG parts
  // place / fact chip: gold bar grows, then label wipes in
  function chip(label, x, y, p, o = {}) {
    if (p <= 0) return '';
    const size = o.size || 30;
    const w = o.w || Math.max(label.length * size * 0.56, o.sub ? o.sub.length * size * 0.4 : 0) + 56;
    const hgt = o.sub ? size * 2.35 : size * 1.6;
    const cid = id('chip');
    const bar = easeOutCubic(prog(p, 0, 0.35));
    const wipe = easeOutCubic(prog(p, 0.2, 1));
    const out = o.out != null ? 1 - o.out : 1;
    return `
      <g opacity="${f2(out)}" transform="translate(${f2(x)} ${f2(y)})">
        <clipPath id="${cid}"><rect x="0" y="${-hgt / 2}" width="${f2(w * wipe)}" height="${hgt}"/></clipPath>
        <rect x="0" y="${-hgt / 2}" width="${f2(w * wipe)}" height="${hgt}" fill="rgba(8,16,24,0.72)"/>
        <rect x="-8" y="${f2(-hgt / 2 + (hgt * (1 - bar)) / 2)}" width="6" height="${f2(hgt * bar)}" fill="${o.accent || C.gold}"/>
        <g clip-path="url(#${cid})">
          ${text(label, 22, o.sub ? -hgt / 2 + size * 1.1 : size * 0.36, { size, anchor: 'start', ls: o.ls ?? 4, weight: 500, fill: o.fill || C.white })}
          ${o.sub ? text(o.sub, 22, -hgt / 2 + size * 1.95, { size: size * 0.62, anchor: 'start', ls: 3, weight: 400, fill: o.accent || C.gold }) : ''}
        </g>
      </g>`;
  }

  // pin drop with bounce + ripples
  function pin(x, y, p, o = {}) {
    if (p <= 0) return '';
    const drop = easeOutBack(prog(p, 0, 0.35));
    const yy = y - (1 - drop) * 120;
    const col = o.color || C.red;
    let rip = '';
    for (let i = 0; i < 3; i++) {
      const q = ((o.t || 0) * 0.8 + i / 3) % 1;
      if (p > 0.3) rip += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(10 + q * 70)}" fill="none" stroke="${col}" stroke-width="3" opacity="${f2((1 - q) * 0.7)}"/>`;
    }
    return `${rip}
      <g transform="translate(${f2(x)} ${f2(yy)})">
        <ellipse cx="0" cy="${f2(y - yy + 4)}" rx="12" ry="4" fill="rgba(0,0,0,0.45)"/>
        <path d="M0 0 C -22 -28 -26 -44 -26 -56 A 26 26 0 1 1 26 -56 C 26 -44 22 -28 0 0 Z" fill="${col}" stroke="#fff" stroke-width="3"/>
        <circle cx="0" cy="-56" r="9" fill="#fff"/>
      </g>`;
  }

  // VOC-style retourschip, side silhouette, centred on waterline (≈120px wide at scale 1)
  function shipIcon(x, y, scale = 1, rot = 0, fill = C.bone, op = 1) {
    return `
      <g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)}) scale(${f2(scale)})" opacity="${f2(op)}">
        <path d="M-60 -6 L-52 -22 L-40 -20 L40 -18 L50 -30 L62 -30 L58 -14 L48 4 L-44 4 Z" fill="${fill}"/>
        <path d="M-22 -20 L-22 -92 M8 -18 L8 -104 M34 -18 L34 -80" stroke="${fill}" stroke-width="3"/>
        <path d="M-42 -84 Q-22 -70 -2 -84 L-4 -58 Q-22 -50 -40 -58 Z M-40 -52 Q-22 -42 -4 -52 L-6 -30 Q-22 -24 -38 -30 Z" fill="${fill}" opacity="0.92"/>
        <path d="M-14 -96 Q8 -80 30 -96 L28 -66 Q8 -58 -12 -66 Z M-12 -60 Q8 -50 28 -60 L26 -32 Q8 -26 -10 -32 Z" fill="${fill}" opacity="0.92"/>
        <path d="M22 -74 Q34 -66 48 -74 L46 -52 Q34 -46 24 -52 Z" fill="${fill}" opacity="0.92"/>
        <path d="M48 -24 L78 -40" stroke="${fill}" stroke-width="2.5"/>
        <path d="M8 -104 L24 -100 L8 -96 Z" fill="${C.red}"/>
      </g>`;
  }

  // small longboat icon
  function boatIcon(x, y, scale = 1, fill = C.bone) {
    return `<g transform="translate(${f2(x)} ${f2(y)}) scale(${f2(scale)})">
      <path d="M-26 -4 Q0 10 26 -4 L22 4 Q0 14 -22 4 Z" fill="${fill}"/>
      <path d="M0 -4 L0 -30" stroke="${fill}" stroke-width="2"/>
      <path d="M1 -28 Q14 -18 1 -8 Z" fill="${fill}" opacity="0.9"/>
    </g>`;
  }

  // wax seal with VOC monogram (artifact prop text)
  function vocSeal(x, y, r, p, t) {
    if (p <= 0) return '';
    const land = prog(p, 0, 1);
    const sc = lerp(2.6, 1, easeOutCubic(land));
    const op = sat(land * 3);
    let edge = [];
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const rr = r * (1 + (hash(i * 3.1) - 0.5) * 0.09);
      edge.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    const ringId = id('ring');
    const tr = r * 0.78;
    return `
      <g transform="translate(${f2(x)} ${f2(y)}) scale(${f2(sc)}) rotate(${f2(-8 + (1 - land) * 20)})" opacity="${f2(op)}">
        <path d="${polyPath(edge, true)}" fill="${C.wax}" stroke="#5e0f0b" stroke-width="4" filter="url(#softShadow)"/>
        <circle r="${f2(r * 0.9)}" fill="none" stroke="#b8453a" stroke-width="3" opacity="0.8"/>
        <circle r="${f2(r * 0.64)}" fill="none" stroke="#b8453a" stroke-width="2" opacity="0.7"/>
        <path id="${ringId}" d="M ${-tr} 0 A ${tr} ${tr} 0 1 1 ${tr} 0 A ${tr} ${tr} 0 1 1 ${-tr} 0" fill="none"/>
        <text font-family="${F.serif}" font-size="${f2(r * 0.14)}" font-weight="700" fill="#e7b3a6" letter-spacing="2">
          <textPath href="#${ringId}" startOffset="2%">VEREENIGDE · OOST-INDISCHE · COMPAGNIE ·</textPath></text>
        ${text('V', 0, r * 0.3, { font: F.serif, size: r * 0.95, weight: 800, fill: '#f0c3b8' })}
        ${text('O', -r * 0.3, r * 0.02, { font: F.serif, size: r * 0.42, weight: 800, fill: '#f0c3b8' })}
        ${text('C', r * 0.3, r * 0.02, { font: F.serif, size: r * 0.42, weight: 800, fill: '#f0c3b8' })}
      </g>`;
  }

  // dust burst on impact
  function burst(x, y, p, n = 18, col = C.bone, spread = 180) {
    if (p <= 0 || p >= 1) return '';
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = hash(i + 11) * Math.PI * 2;
      const d = easeOutCubic(p) * spread * (0.5 + hash(i + 3) * 0.7);
      s += `<circle cx="${f2(x + Math.cos(a) * d)}" cy="${f2(y + Math.sin(a) * d * 0.7)}" r="${f2(2 + hash(i + 7) * 5)}" fill="${col}" opacity="${f2((1 - p) * 0.8)}"/>`;
    }
    return s;
  }

  function hairFrame(x, y, w, h, p, col = C.gold) {
    // corner brackets drawing in
    const L = 36 * easeOutCubic(p);
    const c = (cx, cy, sx, sy) => `<path d="M${cx} ${cy + sy * L} L${cx} ${cy} L${cx + sx * L} ${cy}" fill="none" stroke="${col}" stroke-width="3"/>`;
    return c(x, y, 1, 1) + c(x + w, y, -1, 1) + c(x, y + h, 1, -1) + c(x + w, y + h, -1, -1);
  }

  // ================================================================= BEATS
  // Word anchors (s): 159@2.86 · punishment@7.60 · 1629@9.94 · Batavia@11.88 · smashes@12.56 · reef@14.10
  // commander@16.42 · Jeronimus@19.08 · Cornelisz@19.98 · killing@23.12 · hundred@24.80 · Wiebbe@27.66
  // island@30.54 · stone walls@31.82 · oldest@35.20 · rescue@38.76 · caught@41.46 · executed@43.46
  // two young@45.32 · dumped@48.26 · mainland@48.90 · Wouter Loos@52.32 · Jan Pelgrom@53.46
  // never seen@55.18 · residents@58.60 · nobody knows@59.88 · them@61.26

  // ---- 1. HOOK: replica ship, 159-year span, VOC seal (0 – 9.0)
  function sHook(t) {
    const cam = { fx: 0.47, fy: 0.5, z: lerp(1.0, 1.1, ease(prog(t, 0, 9))) };
    const ph = photo('replica', cam, { grade: '#0d2a3d', gradeOp: 0.35, dim: 0.28 });
    let s = ph.svg + legibility(0.8, 0.45);

    // hook block — fully legible on frame 1, then docks to the top at 2.6s
    const dock = ease(prog(t, 2.55, 3.2));
    const hs = lerp(1, 0.52, dock);
    const hy = lerp(0, -452, dock);
    const settle = 1 + 0.035 * (1 - easeOutCubic(prog(t, 0, 0.7)));
    const ul = easeOutCubic(prog(t, 0.1, 0.9));
    s += `
      <g transform="translate(540 ${f2(700 + hy)}) scale(${f2(hs * settle)}) translate(-540 -700)">
        ${text('159', 540, 700, { size: 380, weight: 700, fill: C.gold, ls: -4, stroke: 'rgba(0,0,0,0.45)', sw: 10 })}
        ${text('YEARS BEFORE THE', 540, 800, { size: 62, weight: 500, ls: 12, stroke: 'rgba(0,0,0,0.5)', sw: 6 })}
        ${text('FIRST FLEET', 540, 930, { size: 132, weight: 700, ls: 4, stroke: 'rgba(0,0,0,0.5)', sw: 8 })}
        <rect x="${f2(540 - 330 * ul)}" y="958" width="${f2(660 * ul)}" height="6" fill="${C.gold}"/>
      </g>`;

    // 1629 → 1788 timeline with counter (the 159-year gap)
    const tl = prog(t, 2.9, 3.4);
    if (tl > 0) {
      const x0 = 150;
      const x1 = 930;
      const y = 640;
      const line = easeOutCubic(tl);
      const fill = ease(prog(t, 3.3, 5.7));
      const head = lerp(x0, x1, fill);
      const year = Math.round(1629 + 159 * fill);
      const done = prog(t, 5.7, 6.1);
      const fade = 1 - 0.35 * prog(t, 6.6, 7.2);
      s += `<g opacity="${f2(fade)}">
        <rect x="${x0}" y="${y - 3}" width="${f2((x1 - x0) * line)}" height="6" fill="rgba(255,255,255,0.35)"/>
        <rect x="${x0}" y="${y - 5}" width="${f2(head - x0)}" height="10" fill="${C.gold}"/>
        <rect x="${x0 - 3}" y="${y - 26}" width="6" height="52" fill="${C.gold}" opacity="${f2(line)}"/>
        <rect x="${x1 - 3}" y="${y - 26}" width="6" height="52" fill="#fff" opacity="${f2(line)}"/>
        ${text('1629', x0, y + 78, { size: 54, weight: 700, fill: C.gold, anchor: 'start', opacity: line, stroke: 'rgba(0,0,0,0.5)' })}
        ${text('1788', x1, y + 78, { size: 54, weight: 700, anchor: 'end', opacity: line, stroke: 'rgba(0,0,0,0.5)' })}
        ${fill > 0 && fill < 1 ? `<circle cx="${f2(head)}" cy="${y}" r="13" fill="#fff"/>` + text(String(year), head, y - 36, { size: 44, weight: 600, stroke: 'rgba(0,0,0,0.6)' }) : ''}
        ${done > 0 ? `<circle cx="${x1}" cy="${y}" r="${f2(14 + done * 50)}" fill="none" stroke="${C.gold}" stroke-width="4" opacity="${f2(1 - done)}"/>` : ''}
      </g>`;
    }

    // VOC seal slams on "punishment" (7.60)
    const sealP = prog(t, 7.3, 7.6);
    s += vocSeal(540, 920, 150, sealP, t);
    s += burst(540, 920, prog(t, 7.6, 8.3), 22, '#e6b0a0', 230);

    s += chip('BATAVIA REPLICA', 80, 1168, prog(t, 0.6, 1.4), { size: 26, sub: 'PRESENT-DAY SHIP', out: prog(t, 8.4, 8.9) });
    return s;
  }

  // ---- 2. WRECK: 1629, route to the Abrolhos, strike on the reef (9.0 – 15.55)
  const MAP2 = { lon0: 104, lon1: 124, lat0: -19.5, lat1: -35.5, x: 130, y: 430, w: 820 };
  function sWreck(t) {
    const cam = { fx: 0.34, fy: 0.56, z: lerp(1.12, 1.25, ease(prog(t, 9, 15.6))) };
    const ph = photo('reef', cam, { grade: '#0a2f4a', gradeOp: 0.3, dim: 0.3 });
    let s = ph.svg + legibility(0.7, 0.45);

    // 1629 slam
    const y29 = prog(t, 9.9, 10.1);
    if (y29 > 0) {
      const sc = lerp(1.7, 1, easeOutBack(y29));
      const rule = easeOutCubic(prog(t, 10.05, 10.6));
      s += `<g transform="translate(540 330) scale(${f2(sc)})" opacity="${f2(sat(y29 * 2))}">
          ${text('1629', 0, 80, { size: 230, weight: 700, fill: C.gold, ls: 6, stroke: 'rgba(0,0,0,0.5)', sw: 10 })}
        </g>
        <rect x="${f2(250 - 170 * rule)}" y="330" width="${f2(170 * rule)}" height="4" fill="${C.gold}"/>
        <rect x="830" y="330" width="${f2(170 * rule)}" height="4" fill="${C.gold}"/>`;
      s += burst(540, 330, prog(t, 9.94, 10.5), 16, C.gold, 260);
    }

    // locator map panel
    const panel = prog(t, 10.35, 10.85);
    const panelOut = prog(t, 13.9, 14.4);
    if (panel > 0 && panelOut < 1) {
      const P = projector(MAP2);
      const mh = P.h;
      const cid = id('map');
      const coast = AUS.map(([lo, la]) => P.p(lo, la));
      const draw = ease(prog(t, 10.5, 11.7));
      const landOp = prog(t, 11.2, 11.8);
      const sc = lerp(0.96, 1, easeOutCubic(panel)) * lerp(1, 0.9, panelOut);
      const route = [[104.5, -34.6], [108, -33.8], [111.4, -31.6], [113.0, -29.6], [113.8, -28.5]].map(([a, b]) => P.p(a, b));
      const rd = densify(route);
      const rp = ease(prog(t, 10.9, 12.56));
      const ship = along(rd, rp);
      const hit = prog(t, 12.56, 13.4);
      const abro = P.p(113.8, -28.5);
      const shake = hit > 0 && hit < 1 ? Math.sin(t * 90) * 5 * (1 - hit) : 0;
      // intended course to Java (ghost) — no label, just direction of travel
      const ghost = [P.p(113.8, -28.5), P.p(112.6, -24.5), P.p(111.2, -19.5)];
      let cracks = '';
      if (hit > 0) {
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2 + 0.3;
          const L = 30 + hash(i) * 50;
          const p1 = [abro[0] + Math.cos(a) * 14, abro[1] + Math.sin(a) * 14];
          const pm = [abro[0] + Math.cos(a + 0.25) * L * 0.55, abro[1] + Math.sin(a + 0.25) * L * 0.55];
          const p2 = [abro[0] + Math.cos(a) * L, abro[1] + Math.sin(a) * L];
          cracks += `<path d="${polyPath([p1, pm, p2])}" stroke="#fff" stroke-width="3" fill="none" opacity="${f2(sat(1.4 - hit * 1.4))}" stroke-dasharray="1" stroke-dashoffset="${f2(1 - easeOutCubic(sat(hit * 4)))}" pathLength="1"/>`;
        }
      }
      s += `<g opacity="${f2(sat(panel * 1.5) * (1 - panelOut))}" transform="translate(540 ${f2(MAP2.y + mh / 2)}) scale(${f2(sc)}) translate(-540 ${f2(-(MAP2.y + mh / 2))})">
        <clipPath id="${cid}"><rect x="${MAP2.x}" y="${MAP2.y}" width="${MAP2.w}" height="${f2(mh)}" rx="18"/></clipPath>
        <rect x="${MAP2.x}" y="${MAP2.y}" width="${MAP2.w}" height="${f2(mh)}" rx="18" fill="rgba(6,22,34,0.78)" stroke="rgba(242,193,78,0.55)" stroke-width="2"/>
        <g clip-path="url(#${cid})" transform="translate(${f2(shake)} 0)">
          <g opacity="0.18">${gridLines(P, 104, 124, -35.5, -19.5, 5)}</g>
          <path d="${polyPath(coast, true)}" fill="#1d3a2f" opacity="${f2(landOp * 0.9)}"/>
          <path d="${polyPath(coast, true)}" fill="none" stroke="${C.gold}" stroke-width="3" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${f2(1 - draw)}"/>
          ${text('WESTERN', ...P.p(119.8, -26.4), { size: 34, weight: 500, ls: 8, fill: C.bone, opacity: landOp * 0.85 })}
          ${text('AUSTRALIA', ...P.p(119.8, -27.6), { size: 34, weight: 500, ls: 8, fill: C.bone, opacity: landOp * 0.85 })}
          ${text('INDIAN OCEAN', ...P.p(108.2, -24.5), { font: F.serif, italic: true, size: 30, weight: 500, fill: C.sea, opacity: landOp * 0.8, ls: 3 })}
          <path d="${smoothPath(ghost)}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="4 12" opacity="${f2(0.4 * prog(t, 11.3, 11.8) * (1 - hit))}"/>
          <path d="${smoothPath(route)}" fill="none" stroke="${C.gold}" stroke-width="5" stroke-dasharray="14 10" opacity="0.95" mask="url(#${cid}m)"/>
          <mask id="${cid}m"><path d="${smoothPath(route)}" fill="none" stroke="#fff" stroke-width="14" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${f2(1 - rp)}"/></mask>
          ${hit > 0 ? `<circle cx="${f2(abro[0])}" cy="${f2(abro[1])}" r="${f2(20 + hit * 140)}" fill="${C.red}" opacity="${f2((1 - hit) * 0.45)}"/>` : ''}
          ${cracks}
          ${shipIcon(ship.x, ship.y - 4, 0.62, hit > 0 ? 22 * easeOutBack(sat(hit * 3)) : Math.sin(t * 5) * 2, C.bone)}
          ${text('Batavia', ship.x, ship.y - 82, { font: F.serif, italic: true, size: 40, weight: 700, fill: '#fff', stroke: 'rgba(0,0,0,0.6)', sw: 6, opacity: prog(t, 11.7, 12.1) })}
          ${pin(abro[0], abro[1] + 2, prog(t, 12.5, 13.3), { t, color: C.red })}
        </g>
        ${chip('HOUTMAN ABROLHOS', abro[0] + 70, abro[1] + 70, prog(t, 12.8, 13.5), { size: 28 })}
      </g>`;
    }

    // reef annotation directly on the photo (the real surf line)
    const ann = prog(t, 14.05, 14.8);
    if (ann > 0) {
      const pts = [[0.0, 0.6], [0.1, 0.585], [0.2, 0.57], [0.35, 0.55], [0.45, 0.53], [0.57, 0.49]].map(([u, v]) => ph.cam.pt(u, v));
      s += `<path d="${smoothPath(pts)}" fill="none" stroke="${C.gold}" stroke-width="6" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${f2(1 - ease(ann))}" filter="url(#glow)"/>`;
      const mid = ph.cam.pt(0.3, 0.557);
      s += chip('MORNING REEF', 90, mid[1] - 130, prog(t, 14.3, 15.0), { size: 30 });
    }
    return s;
  }
  function gridLines(P, lo0, lo1, la0, la1, step) {
    let g = '';
    for (let lo = Math.ceil(lo0 / step) * step; lo <= lo1; lo += step) {
      const a = P.p(lo, la1);
      const b = P.p(lo, la0);
      g += `<path d="M${f2(a[0])} ${f2(a[1])} L${f2(b[0])} ${f2(b[1])}" stroke="#9fd" stroke-width="1"/>`;
    }
    for (let la = Math.ceil(la0 / step) * step; la <= la1; la += step) {
      const a = P.p(lo0, la);
      const b = P.p(lo1, la);
      g += `<path d="M${f2(a[0])} ${f2(a[1])} L${f2(b[0])} ${f2(b[1])}" stroke="#9fd" stroke-width="1"/>`;
    }
    return g;
  }

  // ---- 3. MUTINY: 1647 plate, commander leaves, Cornelisz, 100+ lives (15.55 – 26.2)
  function sMutiny(t) {
    const cam = camAt(
      [
        { t: 15.5, fx: 0.6, fy: 0.5, z: 1.02 },
        { t: 18.1, fx: 0.6, fy: 0.5, z: 1.06 },
        { t: 21.0, fx: 0.3, fy: 0.6, z: 1.16 },
        { t: 26.3, fx: 0.33, fy: 0.62, z: 1.3 },
      ],
      t
    );
    const red = prog(t, 21.9, 23.6);
    const ph = photo('plate', cam, { grade: '#b88a4a', gradeOp: 0.55, dim: 0.22 + 0.25 * red, filter: 'url(#sepia)' });
    let s = ph.svg;
    s += `<rect width="${W}" height="${H}" fill="#6a0f0b" opacity="${f2(0.5 * red)}" style="mix-blend-mode:multiply"/>`;
    s += `<rect width="${W}" height="${H}" fill="url(#vignette)" opacity="${f2(0.6 + 0.4 * red)}"/>`;
    s += legibility(0.75, 0.5);
    s += chip('SHIPWRECK PLATE', 80, 1168, prog(t, 15.8, 16.5), { size: 26, sub: 'ONGELUCKIGE VOYAGIE · 1647', out: prog(t, 21.4, 21.9) });

    // the commander's longboat leaves for help
    const lb = prog(t, 15.9, 16.5);
    const lbOut = prog(t, 18.0, 18.6);
    if (lb > 0 && lbOut < 1) {
      const [bx, by] = ph.cam.pt(0.62, 0.49);
      const r = 105 * easeOutBack(lb);
      const route = [[bx + 60, by - 30], [bx + 190, by - 150], [W + 40, by - 420]];
      const rp = ease(prog(t, 16.5, 17.8));
      s += `<g opacity="${f2(1 - lbOut)}">
        <ellipse cx="${f2(bx)}" cy="${f2(by)}" rx="${f2(r * 1.35)}" ry="${f2(r * 0.72)}" fill="none" stroke="${C.gold}" stroke-width="5" filter="url(#glow)"/>
        <path d="${smoothPath(route)}" fill="none" stroke="${C.gold}" stroke-width="5" stroke-dasharray="3 14" stroke-linecap="round" mask="url(#lbm)"/>
        <mask id="lbm"><path d="${smoothPath(route)}" fill="none" stroke="#fff" stroke-width="20" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${f2(1 - rp)}"/></mask>
        ${chip('THE COMMANDER', bx - 250, by - 140, prog(t, 16.3, 17.0), { size: 28 })}
      </g>`;
    }

    // name lock-up: Jeronimus Cornelisz, VOC merchant
    const nm = prog(t, 18.9, 19.3);
    if (nm > 0) {
      const out = prog(t, 25.9, 26.3);
      const first = easeOutCubic(prog(t, 19.05, 19.7));
      const lastP = prog(t, 19.95, 20.9);
      const sub = prog(t, 20.6, 21.2);
      const cid = id('nm');
      s += `<g opacity="${f2(sat(nm * 2) * (1 - out))}">
        <clipPath id="${cid}"><rect x="0" y="230" width="${f2(W * first)}" height="100"/></clipPath>
        <g clip-path="url(#${cid})">${text('JERONIMUS', 540, 300, { size: 48, weight: 500, ls: 22, fill: C.bone, stroke: 'rgba(0,0,0,0.6)', sw: 5 })}</g>
        ${text(letterReveal('CORNELISZ', lastP), 540, 440, { raw: true, font: F.serif, size: 132, weight: 800, fill: '#fff', ls: 2, stroke: 'rgba(0,0,0,0.55)', sw: 8 })}
        <rect x="${f2(540 - 200 * sub)}" y="470" width="${f2(400 * sub)}" height="3" fill="${C.red}"/>
        ${text('VOC MERCHANT', 540, 522, { size: 32, weight: 500, ls: 10, fill: C.gold, opacity: sub })}
      </g>`;
    }

    // 110 lights: more than a hundred people die (dignified abstraction, no imagery of violence)
    const g0 = prog(t, 22.2, 22.9);
    if (g0 > 0) {
      const cols = 11;
      const rows = 10;
      const sp = 60;
      const gx = 540 - ((cols - 1) * sp) / 2;
      const gy = 610;
      const out = prog(t, 25.9, 26.3);
      let dots = '';
      for (let i = 0; i < cols * rows; i++) {
        const cx = gx + (i % cols) * sp;
        const cy = gy + Math.floor(i / cols) * sp;
        const appear = sat(g0 * 2.2 - (i / (cols * rows)) * 1.2);
        const order = hash(i * 7.3);
        const gone = easeOutCubic(prog(t, 23.1 + order * 2.1, 23.1 + order * 2.1 + 0.35));
        const r = 11 * appear;
        dots += `<circle cx="${cx}" cy="${cy}" r="${f2(r)}" fill="${C.bone}" opacity="${f2(appear * (1 - gone) * 0.95)}"/>`;
        dots += `<circle cx="${cx}" cy="${cy}" r="${f2(r)}" fill="none" stroke="${C.red}" stroke-width="2.5" opacity="${f2(appear * gone * 0.85)}"/>`;
      }
      const cnt = prog(t, 24.75, 25.1);
      s += `<g opacity="${f2(1 - out)}">${dots}
        ${cnt > 0 ? `<ellipse cx="540" cy="880" rx="300" ry="150" fill="url(#darkBlob)" opacity="${f2(cnt)}"/>
          <g transform="translate(540 880) scale(${f2(lerp(1.4, 1, easeOutBack(cnt)))})" opacity="${f2(cnt)}">
          ${text('100+', 0, 70, { size: 200, weight: 700, fill: '#fff', stroke: 'rgba(0,0,0,0.6)', sw: 10 })}</g>` : ''}
      </g>`;
    }
    return s;
  }

  // ---- 4. WIEBBE HAYES: fort on West Wallabi, stone wall trace, oldest structures (26.2 – 38.3)
  function sHayes(t) {
    const cam = camAt(
      [
        { t: 26.0, fx: 0.3, fy: 0.46, z: 1.04 },
        { t: 31.4, fx: 0.3, fy: 0.46, z: 1.12 },
        { t: 34.0, fx: 0.55, fy: 0.48, z: 1.16 },
        { t: 38.4, fx: 0.62, fy: 0.5, z: 1.22 },
      ],
      t
    );
    const ph = photo('fort', cam, { grade: '#ffb347', gradeOp: 0.3, blend: 'soft-light', dim: 0.3 });
    let s = ph.svg;
    // warm counter-light sweeping across
    const lx = lerp(-200, 1300, prog(t, 26.2, 38.3));
    s += `<ellipse cx="${f2(lx)}" cy="300" rx="700" ry="520" fill="url(#leak)" opacity="0.55" style="mix-blend-mode:screen"/>`;
    s += legibility(0.75, 0.5);
    s += chip('PRESENT DAY', 80, 1168, prog(t, 26.6, 27.3), { size: 26, sub: 'SURVIVING STONE WALLS', out: prog(t, 37.8, 38.3) });

    // name lock-up
    const nm = prog(t, 27.4, 27.8);
    const nmOut = prog(t, 33.5, 34.0);
    if (nm > 0 && nmOut < 1) {
      const first = easeOutCubic(prog(t, 27.45, 28.0));
      const lastP = prog(t, 27.7, 28.6);
      const cid = id('nm');
      s += `<g opacity="${f2(sat(nm * 2) * (1 - nmOut))}" transform="translate(0 ${f2(-30 * nmOut)})">
        <clipPath id="${cid}"><rect x="0" y="240" width="${f2(W * first)}" height="80"/></clipPath>
        <g clip-path="url(#${cid})">${text('SOLDIER', 540, 300, { size: 40, weight: 500, ls: 22, fill: C.gold, stroke: 'rgba(0,0,0,0.6)', sw: 5 })}</g>
        ${text(letterReveal('WIEBBE HAYES', lastP), 540, 430, { raw: true, font: F.serif, size: 116, weight: 800, fill: '#fff', ls: 1, stroke: 'rgba(0,0,0,0.55)', sw: 8 })}
        ${hairFrame(110, 230, 860, 250, prog(t, 28.0, 28.7))}
      </g>`;
      s += chip('WEST WALLABI ISLAND', 80, 560, prog(t, 30.1, 30.8), { size: 32, out: nmOut });
    }

    // hold out: defensive perimeter holds, pressure arrows are pushed back
    const per = prog(t, 29.2, 29.8);
    const perOut = prog(t, 31.3, 31.8);
    if (per > 0 && perOut < 1) {
      const [fx, fy] = ph.cam.pt(0.36, 0.42);
      const R = 250 * easeOutBack(per);
      let arrows = '';
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.55 + Math.PI;
        const push = Math.sin(prog(t, 29.6 + i * 0.08, 31.2) * Math.PI);
        const d = R + 150 - push * 110;
        const x = fx + Math.cos(a) * d;
        const y = fy + Math.sin(a) * d * 0.7;
        const rot = (a * 180) / Math.PI + 180;
        arrows += `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)})" opacity="${f2(0.9 * per)}"><path d="M-22 -16 L6 0 L-22 16" fill="none" stroke="${C.red}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>`;
      }
      s += `<g opacity="${f2(1 - perOut)}">
        <ellipse cx="${f2(fx)}" cy="${f2(fy)}" rx="${f2(R)}" ry="${f2(R * 0.7)}" fill="rgba(242,193,78,0.08)" stroke="${C.gold}" stroke-width="4" stroke-dasharray="18 12" transform="rotate(${f2(t * 12)} ${f2(fx)} ${f2(fy)})"/>
        ${arrows}</g>`;
    }

    // stone wall line-draw along the real wall in the photo
    const wd = prog(t, 31.6, 33.9);
    if (wd > 0) {
      const wall = [[0.05, 0.37], [0.2, 0.32], [0.35, 0.35], [0.5, 0.36], [0.63, 0.37], [0.76, 0.43], [0.86, 0.52]].map(([u, v]) => ph.cam.pt(u, v));
      const wall2 = [[0.72, 0.67], [0.85, 0.62], [0.98, 0.62]].map(([u, v]) => ph.cam.pt(u, v));
      const glow = 0.75 + 0.25 * Math.sin(t * 4);
      const p1 = ease(prog(t, 31.6, 33.3));
      const p2 = ease(prog(t, 33.0, 33.9));
      const d1 = densify(wall);
      const head = along(d1, p1);
      s += `<g opacity="${f2(glow)}">
        <path d="${smoothPath(wall)}" fill="none" stroke="${C.gold}" stroke-width="7" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${f2(1 - p1)}" filter="url(#glow)"/>
        <path d="${smoothPath(wall2)}" fill="none" stroke="${C.gold}" stroke-width="7" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${f2(1 - p2)}" filter="url(#glow)"/>
      </g>`;
      if (p1 < 1) s += `<circle cx="${f2(head.x)}" cy="${f2(head.y)}" r="12" fill="#fff" filter="url(#glow)"/>` + burst(head.x, head.y, (t * 3) % 1, 8, C.bone, 50);
    }

    // compact fact tag
    const ft = prog(t, 34.3, 35.0);
    if (ft > 0) {
      const out = prog(t, 37.9, 38.3);
      s += `<g opacity="${f2(1 - out)}">
        ${chip('OLDEST EUROPEAN STRUCTURES', 80, 300, ft, { size: 44, sub: 'IN AUSTRALIA · 1629', ls: 3 })}
      </g>`;
    }
    return s;
  }

  // ---- 5. RESCUE: Beacon Island, ship arrives, mutineers caught (38.3 – 42.35)
  function sRescue(t) {
    const cam = { fx: 0.68, fy: 0.5, z: lerp(1.0, 1.08, ease(prog(t, 38.3, 42.4))) };
    const ph = photo('beacon', cam, { grade: '#0c2438', gradeOp: 0.35, dim: 0.35 });
    let s = ph.svg + legibility(0.7, 0.45);
    s += chip('BEACON ISLAND', 80, 300, prog(t, 38.5, 39.2), { size: 36, sub: 'SURVIVORS’ CAMP', out: prog(t, 42.0, 42.4) });

    // rescue ship sails in from the north
    const sp = ease(prog(t, 38.6, 40.4));
    const path = [[820, 380], [800, 520], [740, 650], [690, 720]];
    const d = densify(path);
    const pos = along(d, sp);
    let wake = '';
    for (let i = 1; i <= 8; i++) {
      const q = along(d, sp - i * 0.035);
      if (sp - i * 0.035 > 0) wake += `<ellipse cx="${f2(q.x)}" cy="${f2(q.y)}" rx="${f2(10 + i * 3)}" ry="${f2(4 + i)}" fill="none" stroke="#fff" stroke-width="2" opacity="${f2(0.5 - i * 0.05)}"/>`;
    }
    s += wake + `<path d="${smoothPath(path)}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="4 12" opacity="0.35"/>`;
    s += shipIcon(pos.x, pos.y, 0.9 + 0.1 * sp, Math.sin(t * 3) * 2, C.bone, sat(prog(t, 38.55, 38.9)));

    // mutineers (red markers) — ring closes on "caught"
    const [ix, iy] = ph.cam.pt(0.63, 0.47);
    const caught = prog(t, 40.8, 41.5);
    const lock = prog(t, 41.45, 41.7);
    const dp = prog(t, 39.6, 40.1);
    let dots = '';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + hash(i) * 0.6;
      const rr = lerp(120, 50, easeOutCubic(caught)) * (0.5 + hash(i + 4) * 0.6);
      const jit = (1 - lock) * 8;
      const x = ix + Math.cos(a + t * 0.8 * (1 - lock)) * rr + Math.sin(t * 7 + i) * jit;
      const y = iy + Math.sin(a + t * 0.8 * (1 - lock)) * rr * 0.6 + Math.cos(t * 6 + i) * jit;
      dots += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(11 * dp)}" fill="${C.red}" stroke="#fff" stroke-width="2.5" opacity="${f2(dp * (1 - 0.35 * lock))}"/>`;
    }
    s += dots;
    if (caught > 0) {
      const R = lerp(260, 120, easeOutCubic(caught));
      s += `<ellipse cx="${f2(ix)}" cy="${f2(iy)}" rx="${f2(R)}" ry="${f2(R * 0.62)}" fill="none" stroke="${C.gold}" stroke-width="${f2(4 + 3 * lock)}" stroke-dasharray="${lock > 0 ? '0' : '16 10'}" opacity="${f2(sat(caught * 3))}"/>`;
      s += hairFrame(ix - 170, iy - 110, 340, 220, lock, C.gold);
    }
    return s;
  }

  // ---- 6. VERDICT: Batavia timbers (museum), Cornelisz struck through (42.35 – 44.95)
  function sVerdict(t) {
    const cam = { fx: 0.62, fy: 0.55, z: lerp(1.06, 1.14, ease(prog(t, 42.3, 45))) };
    const ph = photo('timbers', cam, { grade: '#1a1f2a', gradeOp: 0.45, dim: 0.5, filter: 'url(#desat)' });
    let s = ph.svg + `<rect width="${W}" height="${H}" fill="url(#vignette)" opacity="0.9"/>` + legibility(0.5, 0.4);
    s += chip('BATAVIA TIMBERS', 80, 1168, prog(t, 42.6, 43.3), { size: 26, sub: 'WA SHIPWRECKS MUSEUM' });
    const nm = prog(t, 42.35, 42.8);
    const strike = ease(prog(t, 43.45, 43.8));
    const grey = prog(t, 43.5, 44.0);
    const col = `rgb(${Math.round(lerp(255, 150, grey))},${Math.round(lerp(255, 150, grey))},${Math.round(lerp(255, 150, grey))})`;
    s += `<g opacity="${f2(nm)}" transform="translate(0 ${f2(20 * (1 - easeOutCubic(nm)))})">
      ${text('JERONIMUS', 540, 470, { size: 44, weight: 500, ls: 22, fill: C.bone, opacity: 0.8 })}
      ${text('CORNELISZ', 540, 600, { font: F.serif, size: 132, weight: 800, fill: col, stroke: 'rgba(0,0,0,0.55)', sw: 8 })}
      <rect x="150" y="556" width="${f2(780 * strike)}" height="12" fill="${C.red}" transform="rotate(-2 540 562)"/>
      ${text('1629', 540, 690, { size: 40, weight: 500, ls: 14, fill: C.gold, opacity: grey })}
    </g>`;
    s += burst(150 + 780 * strike, 560, prog(t, 43.5, 44.2), 12, C.red, 120);
    return s;
  }

  // ---- 7. MAROONED: Abrolhos → mainland WA (44.95 – 51.0)
  const MAP7 = { lon0: 112.95, lon1: 115.15, lat0: -27.35, lat1: -29.35, x: 130, y: 350, w: 820 };
  function sMaroon(t) {
    const cam = { fx: 0.5, fy: 0.62, z: lerp(1.05, 1.15, ease(prog(t, 44.9, 51.1))) };
    const ph = photo('kalbarri', cam, { grade: '#2a1a10', gradeOp: 0.3, dim: 0.45 });
    let s = ph.svg + legibility(0.6, 0.45);
    const P = projector(MAP7);
    const mh = P.h;
    const panel = prog(t, 45.0, 45.45);
    const panelOut = prog(t, 50.6, 51.0);
    const cid = id('map');
    const coastLL = [
      [113.6, -26.8], [113.87, -27.3], [114.0, -27.5], [114.16, -27.71], [114.17, -27.9], [114.22, -28.07],
      [114.25, -28.19], [114.43, -28.38], [114.52, -28.5], [114.57, -28.55], [114.61, -28.78], [114.66, -28.95],
      [114.85, -29.15], [114.93, -29.25], [115.05, -29.6],
    ];
    const coast = coastLL.map(([a, b]) => P.p(a, b));
    const land = [...coast, [MAP7.x + MAP7.w + 40, MAP7.y + mh + 60], [MAP7.x + MAP7.w + 40, MAP7.y - 60]];
    const draw = ease(prog(t, 45.1, 46.1));
    const landOp = prog(t, 45.7, 46.3);
    // Houtman Abrolhos island groups (markers, not coastlines)
    const isl = [
      [113.7, -28.47, 30, 10, -30], [113.74, -28.42, 18, 7, -40], [113.79, -28.48, 7, 5, 0],
      [113.78, -28.71, 26, 8, -20], [113.97, -28.93, 34, 9, -40],
    ].map(([lo, la, rx, ry, r]) => ({ q: P.p(lo, la), rx, ry, r }));
    const islP = prog(t, 45.5, 46.0);
    const beacon = P.p(113.79, -28.48);
    const landing = P.p(114.21, -28.08);
    const boatPath = [beacon, P.p(113.95, -28.36), P.p(114.1, -28.2), [landing[0] - 14, landing[1] + 4]];
    const bd = densify(boatPath);
    const bp = ease(prog(t, 47.85, 49.0));
    const boat = along(bd, bp);
    const two = prog(t, 45.3, 45.7);
    const ashore = prog(t, 48.95, 49.4);
    const walk = ease(prog(t, 49.1, 50.4));
    const pair = (x, y, o) =>
      `<circle cx="${f2(x - 9)}" cy="${f2(y)}" r="9" fill="#fff" opacity="${f2(o)}"/><circle cx="${f2(x + 9)}" cy="${f2(y)}" r="9" fill="#fff" opacity="${f2(o)}"/>`;
    let figures = '';
    if (bp <= 0) figures = pair(beacon[0], beacon[1] - 22, two) + `<circle cx="${f2(beacon[0])}" cy="${f2(beacon[1] - 22)}" r="${f2(26 + ((t * 1.2) % 1) * 30)}" fill="none" stroke="#fff" stroke-width="2" opacity="${f2(two * (1 - ((t * 1.2) % 1)))}"/>`;
    else if (ashore <= 0) figures = boatIcon(boat.x, boat.y, 1.1) + pair(boat.x, boat.y - 14, 1);
    else {
      const lx = landing[0] + 24 + walk * 60;
      const ly = landing[1] - 10 - walk * 26;
      figures = pair(lx, ly, 1) + boatIcon(landing[0] - 20, landing[1] + 6, 1.1, 'rgba(243,233,210,0.6)');
    }
    const zone = prog(t, 49.2, 49.8);
    s += `<g opacity="${f2(sat(panel * 1.6) * (1 - panelOut))}">
      <clipPath id="${cid}"><rect x="${MAP7.x}" y="${MAP7.y}" width="${MAP7.w}" height="${f2(mh)}" rx="18"/></clipPath>
      <rect x="${MAP7.x}" y="${MAP7.y}" width="${MAP7.w}" height="${f2(mh)}" rx="18" fill="rgba(6,22,34,0.78)" stroke="rgba(242,193,78,0.55)" stroke-width="2"/>
      <g clip-path="url(#${cid})">
        <g opacity="0.16">${gridLines(P, 112.95, 115.15, -29.35, -27.35, 0.5)}</g>
        <path d="${polyPath(land, true)}" fill="#3a2a1c" opacity="${f2(landOp * 0.95)}"/>
        <path d="${polyPath(coast)}" fill="none" stroke="${C.gold}" stroke-width="4" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${f2(1 - draw)}"/>
        ${text('WESTERN', ...P.p(114.85, -28.62), { size: 34, weight: 500, ls: 8, fill: C.bone, opacity: landOp * 0.85 })}
        ${text('AUSTRALIA', ...P.p(114.85, -28.74), { size: 34, weight: 500, ls: 8, fill: C.bone, opacity: landOp * 0.85 })}
        ${text('MAINLAND', ...P.p(114.85, -28.84), { size: 24, weight: 400, ls: 8, fill: C.gold, opacity: landOp * 0.85 })}
        ${isl.map((i) => `<ellipse cx="${f2(i.q[0])}" cy="${f2(i.q[1])}" rx="${f2(i.rx * easeOutBack(islP))}" ry="${f2(i.ry * easeOutBack(islP))}" transform="rotate(${i.r} ${f2(i.q[0])} ${f2(i.q[1])})" fill="${C.sea}" opacity="0.85"/>`).join('')}
        ${text('HOUTMAN', ...[isl[0].q[0] - 10, isl[0].q[1] - 64], { size: 26, weight: 500, ls: 6, fill: C.sea, opacity: islP })}
        ${text('ABROLHOS', ...[isl[0].q[0] - 10, isl[0].q[1] - 34], { size: 26, weight: 500, ls: 6, fill: C.sea, opacity: islP })}
        <path d="${smoothPath(boatPath)}" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="3 12" stroke-linecap="round" opacity="0.8" mask="url(#${cid}m)"/>
        <mask id="${cid}m"><path d="${smoothPath(boatPath)}" fill="none" stroke="#fff" stroke-width="20" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${f2(1 - bp)}"/></mask>
        ${zone > 0 ? `<circle cx="${f2(landing[0] + 40)}" cy="${f2(landing[1] - 20)}" r="${f2(90 * easeOutBack(zone))}" fill="rgba(255,255,255,0.06)" stroke="#fff" stroke-width="2.5" stroke-dasharray="8 8" transform="rotate(${f2(t * 20)} ${f2(landing[0] + 40)} ${f2(landing[1] - 20)})"/>` : ''}
        ${figures}
        ${ashore > 0 ? burst(landing[0], landing[1], prog(t, 48.95, 49.6), 10, C.bone, 60) : ''}
      </g>
    </g>`;
    return s;
  }

  // ---- 8. NAMES: Wouter Loos & Jan Pelgrom — never seen again (51.0 – 56.9)
  function sNames(t) {
    const cam = { fx: 0.3, fy: 0.38, z: lerp(1.2, 1.32, ease(prog(t, 50.8, 57))) };
    const ph = photo('kalbarri', cam, { grade: '#ff8a3d', gradeOp: 0.28, blend: 'soft-light', dim: 0.42 });
    let s = ph.svg + `<rect width="${W}" height="${H}" fill="url(#vignette)" opacity="0.75"/>` + legibility(0.6, 0.45);
    s += chip('MAINLAND WA', 80, 1168, prog(t, 51.2, 51.9), { size: 26, sub: 'PRESENT-DAY COAST', out: prog(t, 56.3, 56.8) });

    const fade = prog(t, 55.0, 56.4);
    const card = (label, x, y, p, key) => {
      if (p <= 0) return '';
      const ghost = 1 - 0.72 * fade;
      const fr = easeOutCubic(prog(p, 0, 0.4));
      return `<g opacity="${f2(ghost)}" transform="translate(0 ${f2(-14 * fade)})">
        <rect x="${f2(x - 390 * fr)}" y="${y - 88}" width="${f2(780 * fr)}" height="130" fill="rgba(8,16,24,0.55)"/>
        ${hairFrame(150, y - 88, 780, 130, fr, C.gold)}
        ${text(typeReveal(label, prog(p, 0.1, 1)), x, y + 8, { raw: true, font: F.serif, size: 88, weight: 800, fill: '#fff', ls: 2, stroke: 'rgba(0,0,0,0.5)', sw: 6 })}
      </g>`;
    };
    s += card('WOUTER LOOS', 540, 420, prog(t, 52.2, 53.1), 'a');
    s += card('JAN PELGROM', 540, 600, prog(t, 53.4, 54.4), 'b');

    // two sets of footprints heading inland, then fading into the coast
    let fp = '';
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < 9; i++) {
        const appear = prog(t, 51.6 + i * 0.35 + k * 0.12, 51.9 + i * 0.35 + k * 0.12);
        const vanish = prog(t, 54.95 + i * 0.12, 55.6 + i * 0.12);
        const o = appear * (1 - vanish);
        if (o <= 0) continue;
        const u = i / 8;
        const x = lerp(260 + k * 110, 700 + k * 110, u) + (i % 2 ? 16 : -16);
        const y = lerp(1130, 780, u);
        const rot = 52;
        fp += `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${rot})" opacity="${f2(o * 0.85)}">
          <ellipse cx="0" cy="0" rx="9" ry="17" fill="${C.bone}"/>
          <circle cx="-6" cy="-22" r="3.2" fill="${C.bone}"/><circle cx="0" cy="-24" r="3.4" fill="${C.bone}"/><circle cx="6" cy="-22" r="3" fill="${C.bone}"/>
        </g>`;
      }
    }
    s += fp;
    return s;
  }

  // ---- 9. LOOP: Batavia wreck site marked on Morning Reef → back to the opening (56.9 – 61.56)
  function sLoop(t) {
    // marker sits low in the source frame: lift the photo (free camera) so the site reads above captions,
    // and feather the exposed bottom edge into the dark base under the YouTube UI zone
    const z = lerp(1.28, 1.38, ease(prog(t, 56.7, 61.6)));
    const cam = { fx: 0.526, fy: 0.763, z, dy: 1060 - 960, free: true };
    const ph = photo('wreck', cam, { grade: '#0a2f4a', gradeOp: 0.3, dim: 0.32 });
    const edge = ph.cam.oy + IMG.wreck.h * ph.cam.s;
    let s = ph.svg + `<rect x="0" y="${f2(edge - 260)}" width="${W}" height="${f2(H - edge + 262)}" fill="url(#edgeFade)"/>` + legibility(0.7, 0.45);
    const [mx, my] = ph.cam.pt(0.526, 0.763);
    const mk = prog(t, 57.0, 57.5);
    if (mk > 0) {
      for (let i = 0; i < 3; i++) {
        const q = ((t - 57) * 0.7 + i / 3) % 1;
        s += `<circle cx="${f2(mx)}" cy="${f2(my)}" r="${f2(20 + q * 150)}" fill="none" stroke="${C.gold}" stroke-width="3" opacity="${f2((1 - q) * 0.8 * mk)}"/>`;
      }
      s += `<circle cx="${f2(mx)}" cy="${f2(my)}" r="${f2(14 * easeOutBack(mk))}" fill="${C.gold}"/>`;
      s += `<path d="M${f2(mx)} ${f2(my - 24)} L${f2(mx)} ${f2(my - 170 * easeOutCubic(mk))}" stroke="${C.gold}" stroke-width="3"/>`;
    }
    s += chip('BATAVIA WRECK SITE', 80, 300, prog(t, 57.1, 57.8), { size: 38, sub: 'MORNING REEF · HOUTMAN ABROLHOS' });
    // 1629 → ? : the opening timeline, left unfinished
    const tl = prog(t, 59.7, 60.3);
    if (tl > 0) {
      const x0 = 150;
      const x1 = 930;
      const y = 560;
      const run = ease(prog(t, 59.9, 60.9));
      const head = lerp(x0, x1 - 60, run);
      s += `<g opacity="${f2(tl)}">
        <rect x="${x0}" y="${y - 3}" width="${x1 - x0}" height="6" fill="rgba(255,255,255,0.25)" stroke-dasharray="4 4"/>
        <rect x="${x0}" y="${y - 5}" width="${f2(head - x0)}" height="10" fill="${C.gold}"/>
        <rect x="${x0 - 3}" y="${y - 26}" width="6" height="52" fill="${C.gold}"/>
        ${text('1629', x0, y + 78, { size: 54, weight: 700, fill: C.gold, anchor: 'start', stroke: 'rgba(0,0,0,0.5)' })}
        ${text('?', x1, y + 30, { size: 120, weight: 700, anchor: 'end', opacity: prog(t, 60.4, 60.8), stroke: 'rgba(0,0,0,0.5)', sw: 8 })}
      </g>`;
    }
    return s;
  }

  // ================================================================= timeline
  // transitions: `in` describes how a scene enters (type, duration centred on its start)
  const SCENES = [
    { id: 'hook', start: 0, end: 9.0, draw: sHook },
    { id: 'wreck', start: 9.0, end: 15.55, draw: sWreck, in: { type: 'wipe', d: 0.5 } },
    { id: 'mutiny', start: 15.55, end: 26.2, draw: sMutiny, in: { type: 'fade', d: 0.5 } },
    { id: 'hayes', start: 26.2, end: 38.3, draw: sHayes, in: { type: 'flash', d: 0.45 } },
    { id: 'rescue', start: 38.3, end: 42.35, draw: sRescue, in: { type: 'wipe', d: 0.45 } },
    { id: 'verdict', start: 42.35, end: 44.95, draw: sVerdict, in: { type: 'fade', d: 0.35 } },
    { id: 'maroon', start: 44.95, end: 51.0, draw: sMaroon, in: { type: 'flash', d: 0.25 } },
    { id: 'names', start: 51.0, end: 56.9, draw: sNames, in: { type: 'fade', d: 0.7 } },
    { id: 'loop', start: 56.9, end: DURATION, draw: sLoop, in: { type: 'fade', d: 0.6 } },
  ];

  // camera-shake impulses [time, amplitude px]
  const IMPACTS = [[7.6, 16], [9.94, 10], [12.56, 22], [41.46, 7], [43.46, 10]];
  function shakeAt(t) {
    let x = 0;
    let y = 0;
    for (const [at, amp] of IMPACTS) {
      const dt = t - at;
      if (dt < 0 || dt > 0.6) continue;
      const k = amp * Math.exp(-dt * 8);
      x += Math.sin(dt * 71) * k;
      y += Math.cos(dt * 53) * k;
    }
    return [x, y];
  }

  // ================================================================= captions (lower-middle, ~70%)
  function buildCaptions(words) {
    const groups = [];
    let cur = [];
    const flush = () => cur.length && groups.push(cur) && (cur = []);
    for (const w of words || []) {
      const prev = cur[cur.length - 1];
      const chars = cur.reduce((n, x) => n + x.word.length + 1, 0) + w.word.length;
      if (prev && (cur.length >= 4 || chars > 22 || /[.,!?;:…]$/.test(prev.word) || w.start - prev.end > 0.45)) flush();
      cur.push(w);
    }
    flush();
    return groups.map((g, i) => ({
      words: g,
      start: g[0].start,
      end: Math.min(g[g.length - 1].end + 0.35, groups[i + 1] ? groups[i + 1][0].start : Infinity),
    }));
  }
  function captions(t) {
    const ep = window.EPISODE;
    if (!ep._caps) ep._caps = buildCaptions(ep.words);
    const c = ep._caps.find((g) => t >= g.start - 0.04 && t < g.end);
    if (!c) return '';
    const inP = easeOutBack(prog(t, c.start - 0.04, c.start + 0.12));
    const outP = prog(t, c.end - 0.08, c.end);
    const spans = c.words
      .map((w, i) => {
        const active = t >= w.start - 0.03 && (t < w.end + 0.05 || i === c.words.length - 1);
        const said = t >= w.start - 0.03;
        const fill = active ? C.gold : said ? '#fff' : 'rgba(255,255,255,0.92)';
        return `<tspan fill="${fill}">${esc(w.word.toUpperCase())}</tspan>`;
      })
      .join(' ');
    const y = HS.CAPTION_Y + 22;
    return `<g opacity="${f2(1 - outP)}" transform="translate(540 ${y}) scale(${f2(lerp(0.86, 1, inP))}) translate(-540 ${-y})">
      ${text(spans, 540, y, { raw: true, size: 70, weight: 700, ls: 1, stroke: 'rgba(0,0,0,0.85)', sw: 12, filter: 'url(#capShadow)' })}
    </g>`;
  }

  // ================================================================= defs, preload, compositor
  function staticDefs() {
    const imgs = Object.entries(IMG)
      .map(([k, v]) => `<image id="im-${k}" href="/img/${v.f}" width="${v.w}" height="${v.h}" preserveAspectRatio="none"/>`)
      .join('');
    return `
      ${imgs}
      <linearGradient id="gTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0.85"/><stop offset="0.32" stop-color="#000" stop-opacity="0"/></linearGradient>
      <linearGradient id="gBottom" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="0.72" stop-color="#000" stop-opacity="0.75"/><stop offset="1" stop-color="#000" stop-opacity="0.9"/></linearGradient>
      <linearGradient id="edgeFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#05090d" stop-opacity="0"/><stop offset="0.6" stop-color="#05090d" stop-opacity="1"/></linearGradient>
      <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/></radialGradient>
      <radialGradient id="leak" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ffcf7a" stop-opacity="0.9"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>
      <radialGradient id="darkBlob" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#000" stop-opacity="0.8"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity="0.6"/></filter>
      <filter id="capShadow" x="-10%" y="-40%" width="120%" height="180%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.7"/></filter>
      <filter id="sepia"><feColorMatrix type="matrix" values="0.39 0.77 0.19 0 0  0.35 0.69 0.17 0 0  0.27 0.53 0.13 0 0  0 0 0 1 0"/></filter>
      <filter id="desat"><feColorMatrix type="saturate" values="0.45"/></filter>
      <pattern id="grain" width="256" height="256" patternUnits="userSpaceOnUse"><image id="grainImg" width="256" height="256" href=""/></pattern>`;
  }

  async function preload() {
    const faces = [
      new FontFace('Oswald', 'url(/fonts/Oswald-VF.ttf)', { weight: '200 700' }),
      new FontFace('Playfair', 'url(/fonts/PlayfairDisplay-VF.ttf)', { weight: '400 900' }),
      new FontFace('Playfair', 'url(/fonts/PlayfairDisplay-Italic-VF.ttf)', { weight: '400 900', style: 'italic' }),
    ];
    for (const f of faces) {
      try {
        document.fonts.add(await f.load());
      } catch (e) {
        console.warn('font failed', e);
      }
    }
    await Promise.all(
      Object.values(IMG).map((v) => {
        const im = new Image();
        im.src = '/img/' + v.f;
        return im.decode().catch(() => {});
      })
    );
    // film grain tile
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const cx = cv.getContext('2d');
    const d = cx.createImageData(256, 256);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.floor(hash(i * 0.37) * 255);
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    cx.putImageData(d, 0, 0);
    grainUrl = cv.toDataURL('image/png');
    ensureRoot(true);
  }

  let grainUrl = '';
  let stage = null;
  function ensureRoot(force) {
    if (stage && !force) return;
    const root = document.getElementById('root');
    root.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>${staticDefs()}</defs><g id="stage"></g></svg>`;
    stage = root.querySelector('#stage');
    const g = root.querySelector('#grainImg');
    if (g && grainUrl) g.setAttribute('href', grainUrl);
  }

  function sceneLayer(sc, t) {
    return sc.draw(t);
  }

  function compose(t) {
    let body = '';
    for (let i = 0; i < SCENES.length; i++) {
      const sc = SCENES[i];
      const next = SCENES[i + 1];
      const tin = sc.in ? sc.in.d / 2 : 0;
      const tout = next && next.in ? next.in.d / 2 : 0;
      if (t < sc.start - tin || t >= sc.end + tout) continue;
      let layer = sceneLayer(sc, t);
      if (sc.in && t < sc.start + tin) {
        const u = ease(prog(t, sc.start - tin, sc.start + tin));
        if (sc.in.type === 'wipe') {
          // diagonal wipe from the left, soft gold edge
          const x = lerp(-400, W + 400, u);
          layer = `<clipPath id="wipe${i}"><path d="M-400 0 L${f2(x)} 0 L${f2(x - 360)} ${H} L-400 ${H} Z"/></clipPath>
            <g clip-path="url(#wipe${i})">${layer}</g>
            <path d="M${f2(x)} 0 L${f2(x - 360)} ${H}" stroke="${C.gold}" stroke-width="6" opacity="${f2(Math.sin(u * Math.PI))}" filter="url(#glow)"/>`;
        } else {
          layer = `<g opacity="${f2(u)}">${layer}</g>`;
        }
      }
      body += layer;
    }
    // flash transitions
    for (const sc of SCENES) {
      if (!sc.in || sc.in.type !== 'flash') continue;
      const dt = Math.abs(t - sc.start);
      if (dt < sc.in.d) body += `<rect width="${W}" height="${H}" fill="#fff4dc" opacity="${f2(0.55 * (1 - dt / sc.in.d) ** 2)}"/>`;
    }
    // loop hand-off: last 0.55s crossfades into frame 1 of the hook
    const loopP = prog(t, DURATION - 0.6, DURATION - 0.04);
    if (loopP > 0) body += `<g opacity="${f2(ease(loopP))}">${sHook(0)}</g>`;
    return body;
  }

  window.EPISODE = {
    duration: DURATION,
    fps: 30,
    images: Object.fromEntries(Object.entries(IMG).map(([k, v]) => [k, '/img/' + v.f])),
    words: [],
    scenes: SCENES,
    preload,
  };

  window.renderFrame = function (t) {
    ensureRoot(false);
    uid = 0;
    const [sx, sy] = shakeAt(t);
    // grain re-seeds at 12 fps (filmic, and keeps the encode bitrate sane)
    const gf = Math.floor(t * 12);
    const gx = Math.floor(hash(gf) * 256);
    const gy = Math.floor(hash(gf + 0.5) * 256);
    stage.innerHTML = `
      <rect width="${W}" height="${H}" fill="#05090d"/>
      <g transform="translate(${f2(sx)} ${f2(sy)}) scale(${sx || sy ? 1.02 : 1})" transform-origin="540 960">${compose(t)}</g>
      <rect x="-256" y="-256" width="${W + 512}" height="${H + 512}" fill="url(#grain)" opacity="0.05"
        transform="translate(${-gx} ${-gy})" style="mix-blend-mode:overlay"/>
      ${captions(t)}`;
  };
})();
