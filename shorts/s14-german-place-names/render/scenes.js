/* s14 — German Place Names (SA WWI wipe)
 * Photo underlay / 3D textured-satellite map + SVG motion graphics. SVG + renderFrame(t) only (no Remotion).
 * The 3D map (render/map3d.js, served at /ep/map3d.js) drapes Sentinel-2 true colour over exaggerated
 * AWS Terrain Tiles elevation as an extruded slab; pins are projected from real town coordinates.
 * Beat times come from transcript.json (faster-whisper word timings on audio/vo.mp3).
 * On-screen text: frame-1 hook + names / places / key facts / prop text only. No VO-echo titles.
 * Soft facts: Ambleside is shown only as the new name (never tied to a general); Hahn = Danish-born;
 * Queen Adelaide = German-born; Birdwood (ex-Blumberg) is the "never restored" example.
 * Caption band (~70%, y≈1250–1440), the bottom UI zone and the right edge are kept clear of graphics.
 */
(function () {
  const HS = window.HS;
  const { W, H, clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic } = HS;

  const IMG = {
    stpauls: ['/img/s14_01_hahndorf_st_pauls_church.jpg', 3840, 2551],
    main: ['/img/s14_02_hahndorf_main_street.jpg', 1600, 1200],
    lobethal: ['/img/s14_03_lobethal_lutheran_church.jpg', 1842, 1474],
    klemzig: ['/img/s14_04_klemzig_early_painting.jpg', 3264, 2448],
    birdwood: ['/img/s14_05_birdwood_aerial_2023.jpg', 3840, 2550],
    queen: ['/img/s14_06_queen_adelaide_beechey.jpg', 2400, 3131],
    general: ['/img/s14_07_general_birdwood_gallipoli_1915.jpg', 640, 529],
    skyline: ['/img/s14_08_adelaide_skyline_2022.jpg', 2048, 983],
    hahn: ['/img/s14_09_captain_dirk_meinerts_hahn.jpg', 647, 899],
    tweed: ['/img/s14_10_tweedvale_lobethal_bush_scene.jpg', 3264, 2448],
  };
  const SAT = '/img/s14_12_sentinel2_adelaide_hills.jpg';
  const DEM = '/img/s14_13_terrain_dem_adelaide_hills.png';

  // Town positions in the satellite mosaic (u east, v south), from WGS84 coords → UTM 54S.
  const TOWN = {
    adelaide: [0.1977, 0.5151], // Victoria Square
    klemzig: [0.2637, 0.3966],
    hahndorf: [0.5863, 0.7435],
    lobethal: [0.7015, 0.4422],
    birdwood: [0.8533, 0.2553], // ex-Blumberg
  };

  const DISPLAY = `'DejaVu Sans', 'Liberation Sans', sans-serif`;
  const SERIF = `'DejaVu Serif', 'Liberation Serif', serif`;
  const MONO = `'DejaVu Sans Mono', 'Liberation Mono', monospace`;
  const YELLOW = '#ffcc33';
  const GOLD = '#ffd45a';
  const RED = '#e8322b';
  const GREEN = '#3fcf7a';
  const INK = '#15171a';
  const PAPER = '#efe4c8';
  const SEPIA = '#5a3d22';

  // ---------- helpers ----------
  const p01 = (t, t0, d) => clamp((t - t0) / d, 0, 1);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let uid = 0;
  let pre = '';
  const nid = (k) => k + pre + uid++;

  function shake(t, t0, amp = 22, dur = 0.45) {
    const k = p01(t, t0, dur);
    if (k <= 0 || k >= 1) return { x: 0, y: 0 };
    const a = amp * Math.pow(1 - k, 2);
    return { x: Math.sin(t * 91) * a, y: Math.cos(t * 77) * a };
  }

  /** Full-bleed cover crop: image point (u,v) lands on screen (sx,sy) at the given zoom. */
  function photo(key, o = {}) {
    const [url, iw, ih] = IMG[key];
    const base = Math.max(W / iw, H / ih);
    const s = base * (o.zoom || 1);
    const w = iw * s;
    const h = ih * s;
    let x = (o.sx != null ? o.sx : W / 2) - (o.u != null ? o.u : 0.5) * w;
    let y = (o.sy != null ? o.sy : H / 2) - (o.v != null ? o.v : 0.5) * h;
    x = clamp(x, W - w, 0);
    y = clamp(y, H - h, 0);
    const filt = o.filter ? ` filter="url(#${o.filter})"` : '';
    return `<image href="${url}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"${filt}/>
      ${o.tint ? `<rect width="${W}" height="${H}" fill="${o.tint}"/>` : ''}
      <rect width="${W}" height="${H}" fill="rgba(0,0,0,${o.dim != null ? o.dim : 0.45})"/>`;
  }

  /** Framed photo card (paper border, drop shadow) centred at (cx,cy); pops/rotates in with p. */
  function card(key, cx, cy, w, h, p, o = {}) {
    if (p <= 0) return '';
    const [url, iw, ih] = IMG[key];
    const k = easeOutBack(clamp(p / 0.5, 0, 1));
    const rot = lerp(o.rot0 != null ? o.rot0 : -14, o.rot != null ? o.rot : -3, easeOutCubic(clamp(p / 0.6, 0, 1)));
    const s = Math.max(w / iw, h / ih) * (o.zoom || 1);
    const pw = iw * s;
    const ph = ih * s;
    const x = clamp(-(o.u != null ? o.u : 0.5) * pw + w / 2, w - pw, 0);
    const y = clamp(-(o.v != null ? o.v : 0.5) * ph + h / 2, h - ph, 0);
    const id = nid('cc');
    const b = o.border != null ? o.border : 16;
    return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${k})" opacity="${clamp(p * 4, 0, 1) * (o.opacity != null ? o.opacity : 1)}">
      <rect x="${-w / 2 - b}" y="${-h / 2 - b}" width="${w + 2 * b}" height="${h + 2 * b + (o.foot || 0)}" rx="6" fill="${o.frame || PAPER}" filter="url(#fShadow)"/>
      <clipPath id="${id}"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}"/></clipPath>
      <g clip-path="url(#${id})">
        <image href="${url}" x="${-w / 2 + x}" y="${-h / 2 + y}" width="${pw}" height="${ph}" preserveAspectRatio="none"${o.filter ? ` filter="url(#${o.filter})"` : ''}/>
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="url(#gLens)"/>
      </g>
      ${o.caption ? `<text x="0" y="${h / 2 + b + (o.foot || 0) / 2 + 6}" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="${o.capSize || 34}" fill="${INK}" letter-spacing="2">${esc(o.caption)}</text>` : ''}
    </g>`;
  }

  const DEFS = `
    <defs>
      <filter id="fSepia" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.45 0.6 0.15 0 0.02  0.36 0.55 0.12 0 0  0.25 0.4 0.1 0 0  0 0 0 1 0"/>
      </filter>
      <filter id="fWar" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.5 0.55 0.1 0 0.03  0.3 0.45 0.08 0 0  0.22 0.32 0.06 0 0  0 0 0 1 0"/>
      </filter>
      <filter id="fStamp" x="-10%" y="-20%" width="120%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="5"/>
        <feComponentTransfer><feFuncA type="discrete" tableValues="0 1 1 1 1 1"/></feComponentTransfer>
      </filter>
      <filter id="fShadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#000" flood-opacity="0.65"/>
      </filter>
      <filter id="fGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="7" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="fGrain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0.09 0"/>
      </filter>
      <radialGradient id="gVig" cx="50%" cy="42%" r="75%">
        <stop offset="55%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.82"/>
      </radialGradient>
      <linearGradient id="gTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0.72"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="gBot" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="#000" stop-opacity="0.7"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="gRight" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.7"/>
      </linearGradient>
      <radialGradient id="gLens" cx="35%" cy="30%" r="80%">
        <stop offset="0" stop-color="#fff" stop-opacity="0.12"/>
        <stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.35"/>
      </radialGradient>
      <linearGradient id="gSweep" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${RED}" stop-opacity="0"/>
        <stop offset="0.8" stop-color="${RED}" stop-opacity="0.35"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0.9"/>
      </linearGradient>
    </defs>`;

  const vignette = () =>
    `<rect width="${W}" height="${H}" fill="url(#gVig)"/><rect width="${W}" height="520" fill="url(#gTop)"/>
     <rect y="${H - 420}" width="${W}" height="420" fill="url(#gBot)"/>`;
  const grain = () => `<rect width="${W}" height="${H}" filter="url(#fGrain)"/>`;

  // ---------- motion-graphic parts (shared history kit, as s13) ----------

  /** Kinetic label: bar wipes in, text rises. Anchored at left x. */
  function label(text, x, y, p, o = {}) {
    if (p <= 0) return '';
    const size = o.size || 46;
    const padX = 26;
    const w = o.w || text.length * (size * 0.7 + 2) + padX * 2 + 8;
    const h = size + 30;
    const bar = easeOutCubic(clamp(p / 0.6, 0, 1));
    const tp = easeOutCubic(clamp((p - 0.25) / 0.75, 0, 1));
    const cid = nid('lc');
    return `
      <g opacity="${o.opacity != null ? o.opacity : 1}" filter="url(#fShadow)">
        <clipPath id="${cid}"><rect x="${x}" y="${y - h / 2}" width="${w * bar}" height="${h}"/></clipPath>
        <rect x="${x}" y="${y - h / 2}" width="${w * bar}" height="${h}" rx="6" fill="${o.bg || YELLOW}"/>
        <rect x="${x}" y="${y - h / 2}" width="10" height="${h}" fill="${o.accent || RED}"/>
        <g clip-path="url(#${cid})">
          <text x="${x + padX + 4}" y="${y + size * 0.36 + (1 - tp) * 40}" font-family="${o.font || DISPLAY}" font-weight="900"
            font-size="${size}" fill="${o.fg || INK}" letter-spacing="2">${esc(text)}</text>
        </g>
      </g>`;
  }

  /** Small pill chip centred at (x,y) that pops in. */
  function chip(text, x, y, p, o = {}) {
    if (p <= 0) return '';
    const size = o.size || 36;
    const w = o.w || text.length * size * 0.7 + 48 + (o.icon ? size * 1.5 : 0);
    const h = size + 24;
    const k = easeOutBack(clamp(p / 0.45, 0, 1));
    const tx = o.icon ? size * 0.75 : 0;
    return `<g transform="translate(${x} ${y}) scale(${k})" opacity="${clamp(p * 4, 0, 1) * (o.opacity != null ? o.opacity : 1)}" filter="url(#fShadow)">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${o.bg || INK}" stroke="${o.stroke || '#fff'}" stroke-width="4"/>
      ${o.icon ? `<g transform="translate(${-w / 2 + size * 0.95} 0)">${o.icon(size)}</g>` : ''}
      <text x="${tx}" y="${size * 0.36}" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="${size}"
        fill="${o.fg || '#fff'}" letter-spacing="1.5">${esc(text)}</text>
    </g>`;
  }

  /** Rubber stamp slam. */
  function stamp(text, cx, cy, p, o = {}) {
    if (p <= 0) return '';
    const size = o.size || 110;
    const color = o.color || RED;
    const k = clamp(p / 0.35, 0, 1);
    const sc = lerp(2.4, 1, easeOutCubic(k));
    const op = clamp(k * 1.6, 0, 1) * (o.opacity != null ? o.opacity : 1);
    const w = o.w || text.length * size * 0.66 + 70;
    const h = size + 50;
    return `
      <g transform="translate(${cx} ${cy}) rotate(${o.rot != null ? o.rot : -8}) scale(${sc})" opacity="${op}" filter="url(#fStamp)">
        ${o.fill ? `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="14" fill="${o.fill}"/>` : ''}
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="14" fill="none" stroke="${color}" stroke-width="12"/>
        <rect x="${-w / 2 + 16}" y="${-h / 2 + 16}" width="${w - 32}" height="${h - 32}" rx="8" fill="none" stroke="${color}" stroke-width="4"/>
        <text x="0" y="${size * 0.36}" text-anchor="middle" font-family="${o.font || DISPLAY}" font-weight="900" font-size="${size}"
          fill="${color}" letter-spacing="4">${esc(text)}</text>
      </g>`;
  }

  /** Big year slam (serif, gold) with a ruled underline. */
  function yearSlam(text, cx, cy, p, t, o = {}) {
    if (p <= 0) return '';
    const k = clamp(p / 0.3, 0, 1);
    const sc = lerp(1.9, 1, easeOutCubic(k)) * (1 + Math.sin(t * 4) * 0.004);
    const bar = easeOutCubic(clamp((p - 0.2) / 0.5, 0, 1));
    const size = o.size || 190;
    return `<g opacity="${clamp(k * 1.8, 0, 1) * (o.opacity != null ? o.opacity : 1)}" filter="url(#fShadow)">
      <g transform="translate(${cx} ${cy}) scale(${sc})">
        <text x="0" y="${size * 0.35}" text-anchor="middle" font-family="${SERIF}" font-weight="900" font-size="${size}"
          fill="${o.fill || GOLD}" stroke="${INK}" stroke-width="10" paint-order="stroke" letter-spacing="6">${esc(text)}</text>
      </g>
      <rect x="${cx - 230 * bar}" y="${cy + size * 0.5}" width="${460 * bar}" height="10" rx="5" fill="${o.bar || RED}"/>
    </g>`;
  }

  /** Corner lock-on brackets. */
  function brackets(cx, cy, w, h, p, color = YELLOW) {
    if (p <= 0) return '';
    const k = easeOutBack(clamp(p / 0.5, 0, 1));
    const ww = lerp(w * 1.6, w, k) / 2;
    const hh = lerp(h * 1.6, h, k) / 2;
    const L = 56;
    const op = clamp(p * 3, 0, 1);
    const c = (sx, sy) =>
      `<path d="M${cx + sx * ww} ${cy + sy * hh - sy * L} L${cx + sx * ww} ${cy + sy * hh} L${cx + sx * ww - sx * L} ${cy + sy * hh}"
        fill="none" stroke="${color}" stroke-width="7" stroke-linecap="square"/>`;
    return `<g opacity="${op}" filter="url(#fGlow)">${c(-1, -1)}${c(1, -1)}${c(-1, 1)}${c(1, 1)}</g>`;
  }

  /** Ring flash burst. */
  function ringBurst(cx, cy, t, t0, r0 = 60, r1 = 360, color = YELLOW) {
    const k = p01(t, t0, 0.6);
    if (k <= 0 || k >= 1) return '';
    const e = easeOutCubic(k);
    return `<circle cx="${cx}" cy="${cy}" r="${lerp(r0, r1, e)}" fill="none" stroke="${color}" stroke-width="${lerp(18, 2, e)}" opacity="${1 - k}"/>`;
  }

  // ---------- place-name tags on the 3D map ----------

  /** Ground marker + stem at projected point (x,y). */
  function pinStem(x, y, p, stem, color = RED) {
    if (p <= 0) return '';
    const k = easeOutCubic(clamp(p / 0.4, 0, 1));
    return `<g opacity="${clamp(p * 4, 0, 1)}">
      <ellipse cx="${x}" cy="${y}" rx="${22 * k}" ry="${9 * k}" fill="none" stroke="${color}" stroke-width="4" filter="url(#fGlow)"/>
      <circle cx="${x}" cy="${y}" r="${7 * k}" fill="#fff" stroke="${INK}" stroke-width="3"/>
      <line x1="${x}" y1="${y - 8}" x2="${x}" y2="${y - 8 - stem * k}" stroke="#fff" stroke-width="4" filter="url(#fShadow)"/>
    </g>`;
  }

  /**
   * Period name tag sitting on a stem above ground point (x,y).
   * o.strike 0..1 draws a red strike-through; o.fall 0..1 drops + fades the tag (wiped off the map).
   */
  function nameTag(text, x, y, p, o = {}) {
    if (p <= 0) return '';
    const stem = o.stem != null ? o.stem : 110;
    const size = o.size || 42;
    const w = text.length * size * 0.8 + 48;
    const h = size + 28;
    const drop = easeOutBack(clamp(p / 0.5, 0, 1));
    const fall = o.fall ? easeInOutCubic(clamp(o.fall, 0, 1)) : 0;
    const ty = y - 8 - stem - h / 2 - (1 - drop) * 60 + fall * 90;
    const op = clamp(p * 3, 0, 1) * (1 - fall);
    const st = clamp(o.strike || 0, 0, 1);
    const tx = clamp(x, w / 2 + 40, (o.maxX || 900) - w / 2);
    return `${fall < 1 ? pinStem(x, y, p, stem * (1 - fall), o.pin || RED) : ''}
      <g opacity="${op}" transform="rotate(${fall * 9} ${tx} ${ty})" filter="url(#fShadow)">
        <rect x="${tx - w / 2}" y="${ty - h / 2}" width="${w}" height="${h}" rx="8" fill="${o.bg || PAPER}" stroke="${o.stroke || SEPIA}" stroke-width="3"/>
        <circle cx="${tx - w / 2 + 16}" cy="${ty}" r="6" fill="${o.stroke || SEPIA}"/>
        <text x="${tx + 8}" y="${ty + size * 0.36}" text-anchor="middle" font-family="${o.font || SERIF}" font-weight="900" font-size="${size}"
          fill="${o.fg || INK}" letter-spacing="2">${esc(text)}</text>
        ${st > 0 ? `<line x1="${tx - w / 2 + 6}" y1="${ty + 2}" x2="${tx - w / 2 + 6 + (w - 12) * easeOutCubic(st)}" y2="${ty - 4}" stroke="${RED}" stroke-width="9" stroke-linecap="round"/>` : ''}
      </g>`;
  }

  /** New wartime name typed onto a gold stamp tag above the old tag. */
  function newName(text, x, y, p, o = {}) {
    if (p <= 0) return '';
    const stem = (o.stem != null ? o.stem : 110) + 88;
    const size = o.size || 50;
    const w = text.length * size * 0.8 + 56;
    const h = size + 30;
    const k = easeOutBack(clamp(p / 0.4, 0, 1));
    const n = Math.round(clamp(p / 0.55, 0, 1) * text.length);
    const tx = clamp(x, w / 2 + 40, (o.maxX || 900) - w / 2);
    const ty = y - 8 - stem - h / 2;
    return `<g transform="translate(${tx} ${ty}) scale(${k}) rotate(-3)" opacity="${clamp(p * 4, 0, 1)}" filter="url(#fShadow)">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="8" fill="${o.bg || YELLOW}" stroke="${INK}" stroke-width="4"/>
      <rect x="${-w / 2}" y="${-h / 2}" width="12" height="${h}" fill="${RED}"/>
      <text x="6" y="${size * 0.36}" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="${size}"
        fill="${INK}" letter-spacing="3">${esc(text.slice(0, n))}<tspan fill-opacity="0">${esc(text.slice(n))}</tspan></text>
    </g>`;
  }

  // ---------- 3D map layer ----------
  function lerpCam(a, b, k) {
    const o = {};
    for (const key of Object.keys(a)) o[key] = lerp(a[key], b[key], k);
    return o;
  }
  /** Camera along eased keyframes [[t, cam], ...]. Cameras rounded so identical frames hit the render cache. */
  function camAt(t, keys) {
    let c = keys[0][1];
    if (t >= keys[keys.length - 1][0]) c = keys[keys.length - 1][1];
    else
      for (let i = 0; i < keys.length - 1; i++) {
        const [t0, a] = keys[i];
        const [t1, b] = keys[i + 1];
        if (t >= t0 && t < t1) {
          c = lerpCam(a, b, easeInOutCubic((t - t0) / (t1 - t0)));
          break;
        }
      }
    const r = {};
    for (const k of Object.keys(c)) r[k] = Math.round(c[k] * 10000) / 10000;
    return r;
  }
  function mapLayer(cam, look = {}) {
    const r = window.MAP3D.render(cam, look);
    return { svg: `<image href="${r.url}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none"/>`, at: (k, lift) => r.project(TOWN[k][0], TOWN[k][1], lift) };
  }

  // ---------- hook composition (frame 1 and loop end are identical) ----------
  const HOOK_CAM = { u: 0.54, v: 0.4, dist: 140, heading: 38, pitch: 36, fov: 30 };
  const HOOK_TAGS = [
    ['KLEMZIG', 'klemzig', 90],
    ['HAHNDORF', 'hahndorf', 90],
    ['LOBETHAL', 'lobethal', 90],
    ['BLUMBERG', 'birdwood', 60],
  ];

  function hookText(p, t, erase = 0) {
    if (p <= 0) return '';
    const k = clamp(p, 0, 1);
    const pulse = 1 + Math.sin(t * 5) * 0.006;
    const bar = easeOutCubic(k);
    const e = easeInOutCubic(clamp(erase, 0, 1));
    const ex = lerp(40, 1060, e);
    return `<g opacity="${k}">
      <clipPath id="hookClip${pre}"><rect x="${ex}" y="120" width="${1100}" height="520"/></clipPath>
      <g clip-path="url(#hookClip${pre})" transform="translate(540 360) scale(${pulse}) translate(-540 -360)" filter="url(#fShadow)">
        <text x="540" y="400" text-anchor="middle" font-family="${SERIF}" font-weight="900" font-size="300"
          fill="${GOLD}" stroke="${INK}" stroke-width="16" paint-order="stroke" letter-spacing="8">69</text>
        <text x="540" y="545" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="120"
          fill="#fff" stroke="${INK}" stroke-width="12" paint-order="stroke" letter-spacing="14">NAMES</text>
        <rect x="${540 - 300 * bar}" y="578" width="${600 * bar}" height="12" rx="6" fill="${RED}"/>
      </g>
      ${e > 0 && e < 1 ? `<rect x="${ex - 16}" y="130" width="28" height="500" rx="10" fill="${RED}" filter="url(#fGlow)"/>
        <rect x="${ex - 260}" y="130" width="260" height="500" fill="url(#gSweep)" opacity="0.8"/>` : ''}
    </g>`;
  }

  /** Map + German-name tags for the hook / loop. wipe: 0..1 sweep that knocks the tags off. */
  function hookMap(t, cam, o = {}) {
    const m = mapLayer(cam, { fogK: 0.004 });
    const wipeX = o.wipe != null ? lerp(-80, 1160, o.wipe) : -999;
    let tags = '';
    HOOK_TAGS.forEach(([name, key, stem], i) => {
      const [x, y] = m.at(key);
      const p = o.tagP != null ? clamp(o.tagP - i * 0.12, 0, 1) : 1;
      const hit = o.wipe != null ? clamp((wipeX - x) / 160, 0, 1) : 0;
      tags += nameTag(name, x, y, p, { stem, size: 38, strike: hit * 2, fall: clamp(hit * 1.6 - 0.6, 0, 1) });
    });
    const sweep = o.wipe != null && o.wipe > 0 && o.wipe < 1
      ? `<rect x="${wipeX - 300}" y="640" width="300" height="600" fill="url(#gSweep)" opacity="0.55"/>
         <rect x="${wipeX - 5}" y="640" width="10" height="600" fill="#fff" opacity="0.8" filter="url(#fGlow)"/>` : '';
    return `${m.svg}${vignette()}${tags}${sweep}`;
  }

  // ---------- scenes ----------
  // Seams (s): hook 0 · missed 5.35 · 1838 7.8 · towns 12.55 · war 16.6 · renames 21.0 · Hahn 28.6 ·
  // capital 32.05 · queen 35.75 · 1935 38.25 · never 41.15 · loop 42.75
  const X = 0.3; // crossfade overlap
  const scenes = [
    {
      // 1 — hook: 69 NAMES over the 3D satellite slab; German names pinned; "wiped" erases the hook,
      // "off the map" sweeps the tags off.
      id: 'hook',
      start: 0,
      end: 5.35 + X,
      draw(t) {
        const cam = camAt(t, [[0, HOOK_CAM], [5.7, { u: 0.54, v: 0.41, dist: 126, heading: 42, pitch: 37, fov: 30 }]]);
        const sk = shake(t, 2.3, 16, 0.4);
        return `<g transform="translate(${sk.x} ${sk.y})">
          ${hookMap(t, cam, { wipe: p01(t, 4.3, 0.85) })}
          ${hookText(1, t, p01(t, 2.22, 0.5))}
          ${chip('SOUTH AUSTRALIA', 540, 250, p01(t, 2.9, 0.5) * (1 - p01(t, 5.1, 0.3)), { size: 40, bg: 'rgba(15,17,20,0.85)' })}
          ${chip('1914–1918', 540, 340, p01(t, 3.15, 0.5) * (1 - p01(t, 5.1, 0.3)), { size: 36, bg: RED })}
          ${grain()}
        </g>`;
      },
    },
    {
      // 2 — missed one: the capital, locked in brackets but not yet named
      id: 'missed',
      start: 5.35,
      end: 7.8 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 5.35, X));
        const zoom = lerp(1.0, 1.1, easeInOutCubic(p01(t, 5.35, 2.8)));
        const lock = p01(t, 5.9, 0.6);
        const pulse = 1 + 0.04 * Math.sin(t * 9);
        return `<g opacity="${fi}">
          ${photo('skyline', { u: 0.56, v: 0.42, zoom, dim: 0.4 })}${vignette()}
          <g transform="translate(560 800) scale(${pulse}) translate(-560 -800)">${brackets(560, 800, 520, 420, lock)}</g>
          ${chip('?', 560, 800, p01(t, 6.95, 0.5), { size: 110, w: 150, bg: RED })}
          ${ringBurst(560, 800, t, 6.95, 60, 340, YELLOW)}
          ${grain()}
        </g>`;
      },
    },
    {
      // 3 — 1838: settlers arrive; ship crosses a dotted route over the Klemzig painting
      id: 'y1838',
      start: 7.8,
      end: 12.55 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 7.8, X));
        const zoom = lerp(1.0, 1.12, easeInOutCubic(p01(t, 7.8, 5)));
        const route = easeInOutCubic(p01(t, 8.4, 2.4));
        const x0 = 90, x1 = 820, y = 640;
        const sx = lerp(x0, x1, route);
        const bob = Math.sin(t * 6) * 5;
        const ship = `<g transform="translate(${sx} ${y - 30 + bob}) scale(1.8)" filter="url(#fGlow)">
            <path d="M-60 0 L60 0 L44 26 L-48 26Z" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>
            <line x1="-10" y1="0" x2="-10" y2="-96" stroke="${INK}" stroke-width="5"/>
            <line x1="26" y1="0" x2="26" y2="-76" stroke="${INK}" stroke-width="5"/>
            <path d="M-8 -90 Q22 -64 -8 -38Z" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
            <path d="M-8 -34 Q26 -18 -8 -4Z" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
            <path d="M28 -70 Q52 -50 28 -30Z" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
          </g>`;
        return `<g opacity="${fi}">
          ${photo('klemzig', { u: 0.42, v: 0.36, zoom: zoom * 1.35, dim: 0.35, filter: 'fSepia' })}${vignette()}
          <line x1="${x0}" y1="${y}" x2="${lerp(x0, x1, route)}" y2="${y}" stroke="${PAPER}" stroke-width="6" stroke-dasharray="4 18" stroke-linecap="round" opacity="0.9"/>
          ${route > 0 ? ship : ''}
          ${yearSlam('1838', 540, 330, p01(t, 9.36, 0.7), t)}
          ${label('KLEMZIG', 90, 1080, p01(t, 10.8, 0.7), { size: 44, bg: PAPER, font: SERIF })}
          ${grain()}
        </g>`;
      },
    },
    {
      // 4 — the towns: 3D map, pins drop on Hahndorf, Lobethal, Klemzig; photo cards swap in
      id: 'towns',
      start: 12.55,
      end: 16.6 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 12.55, X));
        const cam = camAt(t, [
          [12.55, { u: 0.53, v: 0.43, dist: 134, heading: 32, pitch: 37, fov: 30 }],
          [16.9, { u: 0.53, v: 0.42, dist: 122, heading: 40, pitch: 38, fov: 30 }],
        ]);
        const m = mapLayer(cam, { fogK: 0.005 });
        const towns = [
          ['HAHNDORF', 'hahndorf', 13.76, 'stpauls', { u: 0.3, v: 0.4 }],
          ['LOBETHAL', 'lobethal', 14.9, 'lobethal', { u: 0.4, v: 0.45 }],
          ['KLEMZIG', 'klemzig', 15.84, 'klemzig', { u: 0.42, v: 0.36, zoom: 1.35, filter: 'fSepia' }],
        ];
        let pins = '';
        let cards = '';
        towns.forEach(([name, key, t0, img, co], i) => {
          const [x, y] = m.at(key);
          pins += nameTag(name, x, y, p01(t, t0, 0.6), { stem: 90, size: 40 });
          pins += ringBurst(x, y, t, t0, 20, 160, YELLOW);
          const next = towns[i + 1] ? towns[i + 1][2] : 99;
          const cp = p01(t, t0, 0.55) * (1 - p01(t, next - 0.05, 0.25));
          cards += card(img, 540, 370, 600, 360, cp, { ...co, rot0: i % 2 ? 12 : -12, rot: i % 2 ? 2.5 : -2.5 });
        });
        return `<g opacity="${fi}">${m.svg}${vignette()}${pins}${cards}${grain()}</g>`;
      },
    },
    {
      // 5 — war comes; 1918; the gazette list of 69 names is struck out line by line
      id: 'war',
      start: 16.6,
      end: 21.0 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 16.6, X));
        const sk = shake(t, 17.2, 26, 0.5);
        const zoom = lerp(1.05, 1.18, easeInOutCubic(p01(t, 16.6, 4.6)));
        const flash = Math.max(0, 1 - p01(t, 17.2, 0.5)) * (t >= 17.2 ? 1 : 0);
        // gazette card
        const g = p01(t, 19.3, 0.5);
        const gy = lerp(1300, 560, easeOutCubic(g));
        const cols = 3, rows = 23;
        let lines = '';
        for (let c = 0; c < cols; c++)
          for (let r = 0; r < rows; r++) {
            const i = c * rows + r;
            const lx = 60 + c * 200, ly = 150 + r * 21;
            const lw = 110 + ((i * 37) % 60);
            const s = p01(t, 19.7 + i * 0.013, 0.12);
            lines += `<rect x="${lx}" y="${ly}" width="${lw}" height="7" rx="2" fill="${SEPIA}" opacity="0.55"/>`;
            if (s > 0) lines += `<rect x="${lx - 4}" y="${ly - 5}" width="${(lw + 8) * s}" height="16" rx="3" fill="${INK}"/>`;
          }
        const gz = g > 0 ? `<g transform="translate(${540 - 330} ${gy}) rotate(${lerp(6, -2, easeOutCubic(g))} 330 330)" filter="url(#fShadow)">
            <rect width="660" height="660" rx="6" fill="${PAPER}"/>
            <rect x="20" y="20" width="620" height="620" fill="none" stroke="${SEPIA}" stroke-width="2"/>
            <text x="330" y="80" text-anchor="middle" font-family="${SERIF}" font-weight="900" font-size="34" fill="${INK}" letter-spacing="2">GOVERNMENT GAZETTE</text>
            <text x="330" y="120" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="28" fill="${SEPIA}">10 January 1918</text>
            <line x1="60" y1="134" x2="600" y2="134" stroke="${SEPIA}" stroke-width="3"/>
            ${lines}
          </g>` : '';
        const cnt = Math.round(69 * clamp((t - 19.7) / (68 * 0.013 + 0.12), 0, 1));
        return `<g opacity="${fi}" transform="translate(${sk.x} ${sk.y})">
          ${photo('tweed', { u: 0.5, v: 0.45, zoom, dim: 0.42, filter: 'fWar' })}${vignette()}
          <rect width="${W}" height="${H}" fill="${RED}" opacity="${0.28 * flash}"/>
          ${yearSlam('1918', 540, 290, p01(t, 18.24, 0.7), t)}
          ${gz}
          ${cnt > 0 ? chip(String(cnt), 860, gy - 10, 1, { size: 56, w: 150, bg: RED }) : ''}
          ${grain()}
        </g>`;
      },
    },
    {
      // 6 — the renames on the 1918-graded 3D map: Hahndorf→Ambleside, Klemzig→Gaza, Blumberg→Birdwood;
      // then General Birdwood at Gallipoli
      id: 'renames',
      start: 21.0,
      end: 28.6 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 21.0, X));
        const cam = camAt(t, [
          [21.0, { u: 0.585, v: 0.755, dist: 22, heading: 58, pitch: 40, fov: 36 }],
          [22.9, { u: 0.575, v: 0.74, dist: 18, heading: 50, pitch: 42, fov: 36 }],
          [23.35, { u: 0.264, v: 0.41, dist: 18, heading: 50, pitch: 42, fov: 36 }],
          [25.0, { u: 0.27, v: 0.4, dist: 16, heading: 44, pitch: 44, fov: 36 }],
          [25.35, { u: 0.852, v: 0.268, dist: 18, heading: 40, pitch: 42, fov: 36 }],
          [26.5, { u: 0.852, v: 0.262, dist: 19, heading: 38, pitch: 43, fov: 36 }],
          [27.1, { u: 0.852, v: 0.225, dist: 21, heading: 36, pitch: 44, fov: 36 }],
          [28.9, { u: 0.852, v: 0.22, dist: 23, heading: 34, pitch: 44, fov: 36 }],
        ]);
        const m = mapLayer(cam, { sepia: 0.72, fogK: 0.007, fog: [0.55, 0.48, 0.38] });
        const R = [
          ['HAHNDORF', 'AMBLESIDE', 'hahndorf', 21.3, 21.62, 22.02, 23.3],
          ['KLEMZIG', 'GAZA', 'klemzig', 23.4, 23.8, 24.22, 25.3],
          ['BLUMBERG', 'BIRDWOOD', 'birdwood', 25.38, 25.72, 26.16, 99],
        ];
        let tags = '';
        for (const [oldN, newN, key, tIn, tStrike, tNew, tOut] of R) {
          if (t < tIn - 0.4 || t > tOut + 0.2) continue;
          const [x, y] = m.at(key);
          const o = 1 - p01(t, tOut - 0.1, 0.2);
          tags += `<g opacity="${o}">
            ${nameTag(oldN, x, y, p01(t, tIn - 0.3, 0.5), { stem: 110, size: 42, strike: p01(t, tStrike, 0.35) })}
            ${newName(newN, x, y, p01(t, tNew, 0.6), { stem: 110 })}
            ${ringBurst(x, y - 260, t, tNew, 40, 260, YELLOW)}
          </g>`;
        }
        const gp = p01(t, 26.75, 0.6);
        return `<g opacity="${fi}">
          ${m.svg}${vignette()}
          ${tags}
          ${chip('1918', 540, 150, p01(t, 21.1, 0.5) * (1 - p01(t, 26.5, 0.3)), { size: 40, bg: RED })}
          ${card('general', 540, 480, 520, 380, gp, { u: 0.5, v: 0.42, zoom: 1.08, rot0: -12, rot: -2, foot: 50, caption: 'GALLIPOLI · 1915', capSize: 34 })}
          ${label('GEN. WILLIAM BIRDWOOD', 110, 128, p01(t, 27.3, 0.6), { size: 40 })}
          ${grain()}
        </g>`;
      },
    },
    {
      // 7 — irony: Hahndorf named after a Danish-born sea captain
      id: 'hahn',
      start: 28.6,
      end: 32.05 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 28.6, X));
        const zoom = lerp(1.0, 1.08, easeInOutCubic(p01(t, 28.6, 3.8)));
        const split = p01(t, 29.3, 0.6);
        const hx = lerp(0, -26, easeOutCubic(split));
        const dx = lerp(0, 26, easeOutCubic(split));
        const dim = lerp(1, 0.35, split);
        const flag = (s) => `<g transform="translate(${-s * 0.5} ${-s * 0.35})">
            <rect width="${s}" height="${s * 0.7}" rx="3" fill="#c8102e"/>
            <rect x="${s * 0.3}" width="${s * 0.12}" height="${s * 0.7}" fill="#fff"/>
            <rect y="${s * 0.29}" width="${s}" height="${s * 0.12}" fill="#fff"/>
          </g>`;
        return `<g opacity="${fi}">
          ${photo('main', { u: 0.5, v: 0.5, zoom: 1.1, dim: 0.62 })}${vignette()}
          <g opacity="${p01(t, 28.8, 0.4)}" filter="url(#fShadow)">
            <text x="${540 + hx}" y="250" text-anchor="end" font-family="${SERIF}" font-weight="900" font-size="120"
              fill="${GOLD}" stroke="${INK}" stroke-width="10" paint-order="stroke" letter-spacing="4">HAHN</text>
            <text x="${540 + dx}" y="250" text-anchor="start" font-family="${SERIF}" font-weight="900" font-size="120"
              fill="#fff" fill-opacity="${dim}" stroke="${INK}" stroke-width="10" paint-order="stroke" letter-spacing="4">DORF</text>
            <rect x="${540 + hx - 360 * easeOutCubic(split)}" y="275" width="${360 * easeOutCubic(split)}" height="10" rx="5" fill="${RED}"/>
          </g>
          ${card('hahn', 540, 700, 420, 540, p01(t, 29.4, 0.6) * zoom, { u: 0.5, v: 0.42, zoom: 1.25, rot0: 10, rot: 2, filter: 'fSepia' })}
          ${label('CAPT. DIRK HAHN', 150, 1060, p01(t, 29.7, 0.6), { size: 44, bg: PAPER, font: SERIF })}
          ${chip('DANISH-BORN', 540, 1160, p01(t, 30.46, 0.5), { size: 40, icon: flag, bg: INK })}
          ${grain()}
        </g>`;
      },
    },
    {
      // 8 — the capital: fly back over the hills to the city; ADELAIDE locks on
      id: 'capital',
      start: 32.05,
      end: 35.75 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 32.05, X));
        const cam = camAt(t, [
          [32.05, { u: 0.5, v: 0.44, dist: 128, heading: 40, pitch: 38, fov: 30 }],
          [34.2, { u: 0.23, v: 0.51, dist: 52, heading: 24, pitch: 46, fov: 32 }],
          [36.1, { u: 0.2, v: 0.515, dist: 26, heading: 14, pitch: 52, fov: 34 }],
        ]);
        const spot = p01(t, 34.1, 0.6);
        const m = mapLayer(cam, { fogK: 0.005, spot: [TOWN.adelaide[0], TOWN.adelaide[1], 0.035, spot], dim: 0.35 * spot });
        const [x, y] = m.at('adelaide');
        const pulse = 1 + 0.03 * Math.sin(t * 8);
        // hunting reticle: sweeps over the hills, then settles on the city centre as the camera arrives
        const hunt = p01(t, 32.3, 1.9);
        const hx = lerp(lerp(760, 300, hunt), x, easeInOutCubic(p01(t, 33.4, 0.8))) + Math.sin(t * 5.3) * 60 * (1 - hunt);
        const hy = lerp(lerp(820, 1000, hunt), y, easeInOutCubic(p01(t, 33.4, 0.8))) + Math.cos(t * 4.1) * 40 * (1 - hunt);
        const ret = p01(t, 32.25, 0.4) * (1 - p01(t, 34.1, 0.25));
        const reticle = ret > 0 ? `<g opacity="${ret}" filter="url(#fGlow)">
            <circle cx="${hx}" cy="${hy}" r="90" fill="none" stroke="${YELLOW}" stroke-width="5" stroke-dasharray="30 14" transform="rotate(${t * 90} ${hx} ${hy})"/>
            <line x1="${hx - 130}" y1="${hy}" x2="${hx - 40}" y2="${hy}" stroke="${YELLOW}" stroke-width="4"/>
            <line x1="${hx + 40}" y1="${hy}" x2="${hx + 130}" y2="${hy}" stroke="${YELLOW}" stroke-width="4"/>
            <line x1="${hx}" y1="${hy - 130}" x2="${hx}" y2="${hy - 40}" stroke="${YELLOW}" stroke-width="4"/>
            <line x1="${hx}" y1="${hy + 40}" x2="${hx}" y2="${hy + 130}" stroke="${YELLOW}" stroke-width="4"/>
          </g>` : '';
        return `<g opacity="${fi}">
          ${m.svg}${vignette()}
          ${reticle}
          <g transform="translate(${x} ${y}) scale(${pulse}) translate(${-x} ${-y})">${brackets(x, y, 300, 220, spot)}</g>
          ${ringBurst(x, y, t, 35.22, 60, 420, GOLD)}
          ${nameTag('ADELAIDE', x, y, p01(t, 35.2, 0.5), { stem: 170, size: 64, bg: GOLD, stroke: INK, pin: GOLD })}
          ${chip('CAPITAL', 540, 330, p01(t, 34.2, 0.5), { size: 40, bg: RED })}
          ${grain()}
        </g>`;
      },
    },
    {
      // 9 — Queen Adelaide: German-born queen (museum plaque)
      id: 'queen',
      start: 35.75,
      end: 38.25 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 35.75, X));
        const zoom = lerp(1.15, 1.28, easeInOutCubic(p01(t, 35.75, 2.8)));
        const pl = p01(t, 36.0, 0.6);
        const plaque = pl > 0 ? `<g transform="translate(540 ${lerp(1200, 1110, easeOutCubic(pl))})" opacity="${clamp(pl * 3, 0, 1)}" filter="url(#fShadow)">
            <rect x="-330" y="-62" width="660" height="124" rx="10" fill="#b8913a" stroke="#6b4f16" stroke-width="5"/>
            <rect x="-314" y="-46" width="628" height="92" rx="6" fill="none" stroke="#f3dc93" stroke-width="2"/>
            <text x="0" y="18" text-anchor="middle" font-family="${SERIF}" font-weight="900" font-size="52" fill="#2b1d07" letter-spacing="4">QUEEN ADELAIDE</text>
          </g>` : '';
        return `<g opacity="${fi}">
          ${photo('queen', { u: 0.5, v: 0.3, zoom, dim: 0.22 })}${vignette()}
          ${plaque}
          ${chip('GERMAN-BORN', 540, 300, p01(t, 36.62, 0.5), { size: 44, bg: INK })}
          ${grain()}
        </g>`;
      },
    },
    {
      // 10 — 1935: Hahndorf gets its name back (tag flips Ambleside → Hahndorf)
      id: 'y1935',
      start: 38.25,
      end: 41.15 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 38.25, X));
        const zoom = lerp(1.0, 1.12, easeInOutCubic(p01(t, 38.25, 3.2)));
        const flip = p01(t, 38.9, 0.5);
        const sy = Math.abs(Math.cos(flip * Math.PI));
        const front = flip < 0.5;
        const tagTxt = front ? 'AMBLESIDE' : 'HAHNDORF';
        const tag = `<g transform="translate(540 1030) scale(1 ${Math.max(sy, 0.02)})" filter="url(#fShadow)">
            <rect x="-300" y="-58" width="600" height="116" rx="10" fill="${front ? YELLOW : PAPER}" stroke="${INK}" stroke-width="5"/>
            <text x="0" y="20" text-anchor="middle" font-family="${front ? DISPLAY : SERIF}" font-weight="900" font-size="64" fill="${INK}" letter-spacing="4">${tagTxt}</text>
            ${front ? `<line x1="-270" y1="4" x2="${-270 + 540 * p01(t, 38.5, 0.35)}" y2="-2" stroke="${RED}" stroke-width="10" stroke-linecap="round"/>` : ''}
          </g>`;
        return `<g opacity="${fi}">
          ${photo('stpauls', { u: 0.46, v: 0.4, zoom, dim: 0.4 })}${vignette()}
          ${yearSlam('1935', 540, 300, p01(t, 39.74, 0.7), t, { bar: GREEN })}
          ${p01(t, 38.35, 0.3) > 0 ? `<g opacity="${p01(t, 38.35, 0.3)}">${tag}</g>` : ''}
          ${stamp('RESTORED', 540, 820, p01(t, 40.2, 0.6), { size: 84, rot: -6, color: GREEN, fill: 'rgba(0,0,0,0.45)' })}
          ${grain()}
        </g>`;
      },
    },
    {
      // 11 — many never did: Birdwood (ex-Blumberg) today
      id: 'never',
      start: 41.15,
      end: 42.75 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 41.15, X));
        const zoom = lerp(1.15, 1.3, easeInOutCubic(p01(t, 41.15, 1.9)));
        return `<g opacity="${fi}">
          ${photo('birdwood', { u: 0.55, v: 0.45, zoom, dim: 0.35 })}${vignette()}
          ${label('BIRDWOOD', 110, 330, p01(t, 41.3, 0.5), { size: 56 })}
          ${label('BLUMBERG', 110, 440, p01(t, 41.45, 0.5), { size: 38, bg: PAPER, font: SERIF, opacity: 0.9 })}
          <line x1="140" y1="440" x2="${140 + 330 * p01(t, 41.6, 0.3)}" y2="436" stroke="${RED}" stroke-width="8" stroke-linecap="round"/>
          ${stamp('NEVER RESTORED', 540, 820, p01(t, 41.78, 0.6), { size: 72, rot: -7, color: RED, fill: 'rgba(0,0,0,0.5)' })}
          ${grain()}
        </g>`;
      },
    },
    {
      // 12 — loop: fly back out to the hook composition; German names return; 69 NAMES re-slams
      // (settles by ~44.85 s so the last muxed frame == frame 1)
      id: 'loop',
      start: 42.75,
      end: 45.0 + 0.2,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 42.75, X));
        const cam = camAt(t, [
          [42.75, { u: 0.8, v: 0.3, dist: 30, heading: 40, pitch: 46, fov: 36 }],
          [44.65, HOOK_CAM],
        ]);
        const hp = p01(t, 44.0, 0.45);
        return `<g opacity="${fi}">
          ${hookMap(t, cam, { tagP: p01(t, 43.95, 0.7) * 1.36 })}
          ${hookText(easeOutCubic(hp), t)}
          ${grain()}
        </g>`;
      },
    },
  ];

  // Prepend shared defs to every scene layer (duplicates during crossfade are harmless).
  for (const sc of scenes) {
    const d = sc.draw;
    sc.draw = (t, lt, hs) => {
      uid = 0;
      pre = sc.id;
      return DEFS + d(t, lt, hs);
    };
  }

  // Load the 3D map module + assets before the first frame.
  const ready = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = '/ep/map3d.js';
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  }).then(() => window.MAP3D.init(SAT, DEM));

  window.EPISODE = {
    duration: 45.0,
    fps: 30,
    images: Object.fromEntries(Object.entries(IMG).map(([k, v]) => [k, v[0]])),
    words: [],
    scenes,
    ready,
  };

  // renderFrame returns a promise that resolves once every <image> in the new frame has loaded
  // (the map is a fresh data URL each frame), so capture never grabs a half-decoded frame.
  const base = window.renderFrame;
  window.renderFrame = function (t) {
    base(t);
    const imgs = Array.from(document.querySelectorAll('#root image'));
    return Promise.all(
      imgs.map(
        (im) =>
          new Promise((r) => {
            im.addEventListener('load', r, { once: true });
            im.addEventListener('error', r, { once: true });
            setTimeout(r, 4000);
          })
      )
    ).then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  };
})();
