/* s13 — The Wrong Border (SA–Vic)
 * Photo / period-map underlay + SVG motion graphics. SVG + renderFrame(t) only (no Remotion).
 * Beat times come from transcript.json (faster-whisper word timings on audio/vo.mp3).
 * On-screen text: frame-1 hook + names / places / facts / prop text only. No VO-echo titles.
 * Soft facts: offset shown as `~3 km`, area as `~1,300 km²`; the Guildhall is labelled
 * `LONDON` / `PRIVY COUNCIL` only (modern JCPC seat, not a 1914 photo); Todd = remeasurement.
 * The true-vs-surveyed gap is exaggerated for legibility and marked NOT TO SCALE.
 * Caption band (~70%, y≈1250–1440), the bottom UI zone and the right edge are kept clear of graphics.
 */
(function () {
  const HS = window.HS;
  const { W, H, clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic } = HS;

  const IMG = {
    kink: ['/img/s13_01_vic_sa_nsw_border_1883.jpg', 1200, 1200],
    m141: ['/img/s13_03_141st_meridian_aus.svg', 1955, 1794.5],
    court: ['/img/s13_05_middlesex_guildhall.jpg', 6016, 4000],
    todd: ['/img/s13_06_charles_todd_portrait.jpg', 2448, 3264],
    anom: ['/img/s13_07_border_anomaly_map.jpg', 1665, 1571],
    globe: ['/img/s13_08_sa_colony_handbook_map.jpg', 592, 582],
    svc: ['/img/s13_09_serviceton_aerial.jpg', 2156, 1363],
  };

  const DISPLAY = `'DejaVu Sans', 'Liberation Sans', sans-serif`;
  const SERIF = `'DejaVu Serif', 'Liberation Serif', serif`;
  const YELLOW = '#ffcc33';
  const GOLD = '#ffd45a';
  const RED = '#e8322b';
  const INK = '#15171a';
  const PAPER = '#efe4c8';
  const SEPIA = '#5a3d22';
  const TEAL = '#7fe0d0';

  // ---------- geometry of the stills (normalised u,v in image space) ----------
  // 141st meridian SVG: the drawn red meridian runs (0.68914,0.45882) → (0.66990,0.81906).
  const m141u = (v) => 0.68914 - 0.05341 * (v - 0.45882);
  const M_JUNC = 0.697; // Murray / NSW–Vic corner on the meridian
  const M_COAST = 0.815;
  // 1883 map: SA–NSW line (upper) and SA–Vic line (lower), pixel centres in the 1200px scan.
  const kUpper = (y) => (624 + (y - 40) * 0.0475) / 1200;
  const kLower = (y) => (568 + (y - 600) * 0.034) / 1200;
  const K_MURRAY = 530 / 1200;

  // ---------- helpers ----------
  const p01 = (t, t0, d) => clamp((t - t0) / d, 0, 1);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rnd = (i) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

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
    if (!o.free) {
      x = clamp(x, W - w, 0);
      y = clamp(y, H - h, 0);
    }
    const filt = o.filter ? ` filter="url(#${o.filter})"` : '';
    return {
      x, y, w, h,
      svg: `${o.bg ? `<rect width="${W}" height="${H}" fill="${o.bg}"/>` : ''}
        <image href="${url}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"${filt}/>
        ${o.tint ? `<rect width="${W}" height="${H}" fill="${o.tint}"/>` : ''}
        <rect width="${W}" height="${H}" fill="rgba(0,0,0,${o.dim != null ? o.dim : 0.45})"/>`,
      at: (u, v) => [x + u * w, y + v * h],
    };
  }

  const DEFS = `
    <defs>
      <filter id="fBlur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="14"/></filter>
      <filter id="fGray" color-interpolation-filters="sRGB">
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncR type="linear" slope="1.15" intercept="-0.05"/><feFuncG type="linear" slope="1.15" intercept="-0.05"/><feFuncB type="linear" slope="1.15" intercept="-0.05"/></feComponentTransfer>
      </filter>
      <filter id="fCool" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.75 0.1 0.05 0 0  0.08 0.82 0.1 0 0  0.1 0.15 0.95 0 0.03  0 0 0 1 0"/>
      </filter>
      <filter id="fSepia" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.45 0.6 0.15 0 0.02  0.36 0.55 0.12 0 0  0.25 0.4 0.1 0 0  0 0 0 1 0"/>
      </filter>
      <filter id="fSoft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
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
        <stop offset="0" stop-color="#000" stop-opacity="0.7"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="gRight" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.75"/>
      </linearGradient>
      <linearGradient id="gLeft" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.8"/>
      </linearGradient>
      <radialGradient id="gWarm" cx="20%" cy="10%" r="85%">
        <stop offset="0" stop-color="#ffc56b" stop-opacity="0.35"/>
        <stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="gLens" cx="35%" cy="30%" r="80%">
        <stop offset="0" stop-color="#fff" stop-opacity="0.14"/>
        <stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.4"/>
      </radialGradient>
      <pattern id="pHatch" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
        <rect width="18" height="18" fill="${RED}" fill-opacity="0.38"/>
        <rect width="7" height="18" fill="${RED}" fill-opacity="0.85"/>
      </pattern>
    </defs>`;

  const vignette = () =>
    `<rect width="${W}" height="${H}" fill="url(#gVig)"/><rect width="${W}" height="520" fill="url(#gTop)"/>`;
  const grain = () => `<rect width="${W}" height="${H}" filter="url(#fGrain)"/>`;

  // ---------- reusable motion-graphic parts ----------

  /** Kinetic label: bar wipes in, text rises. Anchored at left x. */
  function label(text, x, y, p, o = {}) {
    if (p <= 0) return '';
    const size = o.size || 46;
    const padX = 26;
    const w = o.w || text.length * (size * 0.7 + 2) + padX * 2 + 8;
    const h = size + 30;
    const bar = easeOutCubic(clamp(p / 0.6, 0, 1));
    const tp = easeOutCubic(clamp((p - 0.25) / 0.75, 0, 1));
    const cid = 'lc' + Math.round(x) + '_' + Math.round(y) + (o.id || '');
    return `
      <g opacity="${o.opacity != null ? o.opacity : 1}" filter="url(#fShadow)">
        <clipPath id="${cid}"><rect x="${x}" y="${y - h / 2}" width="${w * bar}" height="${h}"/></clipPath>
        <rect x="${x}" y="${y - h / 2}" width="${w * bar}" height="${h}" rx="6" fill="${o.bg || YELLOW}"/>
        <rect x="${x}" y="${y - h / 2}" width="10" height="${h}" fill="${o.accent || RED}"/>
        <g clip-path="url(#${cid})">
          <text x="${x + padX + 4}" y="${y + size * 0.36 + (1 - tp) * 40}" font-family="${DISPLAY}" font-weight="900"
            font-size="${size}" fill="${o.fg || INK}" letter-spacing="2">${esc(text)}</text>
        </g>
      </g>`;
  }

  /** Small pill chip centred at (x,y) that pops in. */
  function chip(text, x, y, p, o = {}) {
    if (p <= 0) return '';
    const size = o.size || 36;
    const w = o.w || text.length * size * 0.66 + 44;
    const h = size + 24;
    const k = easeOutBack(clamp(p / 0.45, 0, 1));
    return `<g transform="translate(${x} ${y}) scale(${k})" opacity="${clamp(p * 4, 0, 1) * (o.opacity != null ? o.opacity : 1)}" filter="url(#fShadow)">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${o.bg || INK}" stroke="${o.stroke || '#fff'}" stroke-width="4"/>
      <text x="0" y="${size * 0.36}" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="${size}"
        fill="${o.fg || '#fff'}" letter-spacing="1.5">${esc(text)}</text>
    </g>`;
  }

  /** Small plain sub-label (white text with stroke). */
  function sub(text, x, y, p, o = {}) {
    if (p <= 0) return '';
    const k = easeOutCubic(clamp(p / 0.5, 0, 1));
    return `<text x="${x}" y="${y + (1 - k) * 20}" opacity="${k * (o.opacity != null ? o.opacity : 1)}" text-anchor="${o.anchor || 'start'}" font-family="${DISPLAY}"
      font-weight="700" font-size="${o.size || 30}" fill="${o.fill || '#fff'}" stroke="${INK}" stroke-width="6" paint-order="stroke"
      letter-spacing="1.5">${esc(text)}</text>`;
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
      <rect x="${cx - 230 * bar}" y="${cy + size * 0.5}" width="${460 * bar}" height="10" rx="5" fill="${RED}"/>
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

  /** Location pin tag (place name). */
  function placeTag(text, x, y, p, o = {}) {
    if (p <= 0) return '';
    const drop = easeOutBack(clamp(p / 0.5, 0, 1));
    return `<g transform="translate(${x} ${y - (1 - drop) * 70})" opacity="${clamp(p * 3, 0, 1)}" filter="url(#fShadow)">
      <path d="M0 0 C-6 -18 -26 -32 -26 -52 A26 26 0 1 1 26 -52 C26 -32 6 -18 0 0Z" fill="${RED}" stroke="#fff" stroke-width="4"/>
      <circle cx="0" cy="-52" r="10" fill="#fff"/>
    </g>${sub(text, x + (o.left ? -42 : 42), y - 36, clamp((p - 0.2) / 0.6, 0, 1), { size: o.size || 38, anchor: o.left ? 'end' : 'start' })}`;
  }

  /** Stroke-draw a path (0..1). */
  function drawPath(d, p, o = {}) {
    if (p <= 0) return '';
    const dash = o.dash
      ? `stroke-dasharray="${o.dash}"`
      : `pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${1 - clamp(p, 0, 1)}"`;
    return `<path d="${d}" fill="none" stroke="${o.color || RED}" stroke-width="${o.w || 10}" stroke-linecap="round" stroke-linejoin="round"
      ${dash} opacity="${o.opacity != null ? o.opacity : 1}"${o.glow ? ' filter="url(#fGlow)"' : ''}/>`;
  }

  /** Dashed line from a to b revealed up to fraction p. */
  function dashedLine(ax, ay, bx, by, p, o = {}) {
    if (p <= 0) return '';
    const e = clamp(p, 0, 1);
    const ex = lerp(ax, bx, e);
    const ey = lerp(ay, by, e);
    return `<g filter="url(#fGlow)" opacity="${o.opacity != null ? o.opacity : 1}">
      <line x1="${ax}" y1="${ay}" x2="${ex}" y2="${ey}" stroke="${INK}" stroke-width="${(o.w || 8) + 6}" stroke-linecap="round" opacity="0.5"/>
      <line x1="${ax}" y1="${ay}" x2="${ex}" y2="${ey}" stroke="${o.color || GOLD}" stroke-width="${o.w || 8}" stroke-dasharray="${o.dash || '26 18'}" stroke-linecap="round"/>
    </g>`;
  }

  /** Measuring arrow between two x positions at height y, with end ticks. */
  function measure(x1, x2, y, p, color = '#fff') {
    if (p <= 0) return '';
    const k = easeOutCubic(clamp(p / 0.5, 0, 1));
    const mid = (x1 + x2) / 2;
    const a = lerp(mid, x1, k);
    const b = lerp(mid, x2, k);
    return `<g filter="url(#fGlow)" opacity="${clamp(p * 4, 0, 1)}">
      <line x1="${a}" y1="${y}" x2="${b}" y2="${y}" stroke="${color}" stroke-width="6"/>
      <path d="M${a + 18} ${y - 14} L${a} ${y} L${a + 18} ${y + 14}" fill="none" stroke="${color}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M${b - 18} ${y - 14} L${b} ${y} L${b - 18} ${y + 14}" fill="none" stroke="${color}" stroke-width="6" stroke-linejoin="round"/>
      <line x1="${x1}" y1="${y - 30}" x2="${x1}" y2="${y + 30}" stroke="${color}" stroke-width="5" opacity="${k}"/>
      <line x1="${x2}" y1="${y - 30}" x2="${x2}" y2="${y + 30}" stroke="${color}" stroke-width="5" opacity="${k}"/>
    </g>`;
  }

  // ---------- survey-mark icons (ink on paper badges) ----------
  function iconTree(s) {
    return `<g transform="scale(${s})">
      <rect x="-9" y="-6" width="18" height="46" fill="${SEPIA}"/>
      <path d="M-9 8 L0 18 L9 8 L9 22 L0 30 L-9 22Z" fill="${PAPER}"/>
      <circle cx="0" cy="-26" r="26" fill="#3e5a2a"/><circle cx="-20" cy="-12" r="18" fill="#4b6b33"/><circle cx="20" cy="-12" r="18" fill="#4b6b33"/>
    </g>`;
  }
  function iconMound(s) {
    return `<g transform="scale(${s})">
      <path d="M-44 30 Q-30 -26 0 -28 Q30 -26 44 30Z" fill="#8a6038"/>
      ${[-24, -8, 8, 24].map((x) => `<line x1="${x}" y1="28" x2="${x * 0.6}" y2="-14" stroke="#5e3f22" stroke-width="3"/>`).join('')}
      <rect x="-3" y="-50" width="6" height="30" fill="${INK}"/><path d="M3 -50 L24 -43 L3 -36Z" fill="${RED}"/>
    </g>`;
  }
  function iconCairn(s) {
    const st = [[-26, 22, 20, 12], [0, 24, 22, 13], [26, 22, 19, 12], [-13, 2, 19, 12], [13, 2, 19, 12], [0, -18, 17, 11], [0, -35, 11, 8]];
    return `<g transform="scale(${s})">${st
      .map(([x, y, rx, ry], i) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${['#9a9387', '#b2ab9e', '#8b857a'][i % 3]}" stroke="${INK}" stroke-width="3"/>`)
      .join('')}</g>`;
  }
  /** Marker badge popping at (x,y) with a leader to the line at (lx,ly). */
  function markBadge(kind, x, y, lx, ly, p, r = 70) {
    if (p <= 0) return '';
    const k = easeOutBack(clamp(p / 0.45, 0, 1));
    const icon = kind === 'tree' ? iconTree(r / 70) : kind === 'mound' ? iconMound(r / 70) : iconCairn(r / 70);
    const lead = easeOutCubic(clamp(p / 0.3, 0, 1));
    return `<g opacity="${clamp(p * 4, 0, 1)}">
      <line x1="${lx}" y1="${ly}" x2="${lerp(lx, x, lead)}" y2="${lerp(ly, y, lead)}" stroke="#fff" stroke-width="4" stroke-dasharray="8 7"/>
      <circle cx="${lx}" cy="${ly}" r="${10 * k}" fill="${YELLOW}" stroke="${INK}" stroke-width="3"/>
      <g transform="translate(${x} ${y}) scale(${k})" filter="url(#fShadow)">
        <circle r="${r}" fill="${PAPER}" stroke="${RED}" stroke-width="7"/>
        <circle r="${r - 10}" fill="none" stroke="${SEPIA}" stroke-width="2" stroke-dasharray="4 5"/>
        <g transform="translate(0 ${r * 0.08})">${icon}</g>
      </g>
    </g>`;
  }

  /** Gavel that swings down onto (x,y); p=0 raised, p≥1 struck. */
  function gavel(x, y, p, s = 1) {
    if (p <= 0) return '';
    const lift = 1 - easeInOutCubic(clamp(p, 0, 1));
    const ang = lerp(0, -48, lift);
    return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#fShadow)">
      <ellipse cx="0" cy="12" rx="120" ry="22" fill="#3a2414"/>
      <rect x="-95" y="-12" width="190" height="26" rx="8" fill="#6b4122" stroke="${INK}" stroke-width="4"/>
      <g transform="translate(150 -30) rotate(${ang}) translate(-150 30)">
        <rect x="-18" y="-66" width="36" height="236" rx="14" fill="#7a4a24" stroke="${INK}" stroke-width="5" transform="rotate(62 0 -30) translate(0 0)"/>
        <g transform="rotate(62 0 -30)">
          <rect x="-58" y="-100" width="116" height="70" rx="12" fill="#8b5a2b" stroke="${INK}" stroke-width="5"/>
          <rect x="-66" y="-100" width="14" height="70" rx="5" fill="${GOLD}" stroke="${INK}" stroke-width="3"/>
          <rect x="52" y="-100" width="14" height="70" rx="5" fill="${GOLD}" stroke="${INK}" stroke-width="3"/>
        </g>
      </g>
    </g>`;
  }

  /** Padlock; shackle drops closed as p → 1. */
  function padlock(x, y, p, s = 1) {
    if (p <= 0) return '';
    const k = easeOutBack(clamp(p / 0.35, 0, 1));
    const close = easeOutCubic(clamp((p - 0.35) / 0.3, 0, 1));
    const sh = lerp(-34, 0, close);
    return `<g transform="translate(${x} ${y}) scale(${s * k})" filter="url(#fShadow)">
      <path d="M-30 ${-10 + sh} L-30 ${-44 + sh} A30 30 0 0 1 30 ${-44 + sh} L30 ${-10 + (close < 1 ? sh : 0)}" fill="none" stroke="#d8d8d8" stroke-width="14" stroke-linecap="round"/>
      <rect x="-50" y="-16" width="100" height="84" rx="14" fill="${GOLD}" stroke="${INK}" stroke-width="6"/>
      <circle cx="0" cy="18" r="11" fill="${INK}"/><rect x="-4" y="20" width="8" height="26" fill="${INK}"/>
    </g>`;
  }

  // ---------- the hook composition (frame 1 and loop end are identical) ----------
  const HOOK = { u: m141u(M_JUNC), v: 0.735, sx: 540, sy: 900, zoom: 2.35 };
  const OFFX = 34; // exaggerated on-screen west offset of the surveyed line (not to scale)

  /** Map-space line points for the border on the 141 map at a given photo placement. */
  function borderPts(ph) {
    const [nx, ny] = ph.at(m141u(0.47), 0.47);
    const [jx, jy] = ph.at(m141u(M_JUNC), M_JUNC);
    const [cx, cy] = ph.at(m141u(M_COAST), M_COAST);
    return { nx, ny, jx, jy, cx, cy };
  }
  /** Kinked red border: on 141° north of the Murray, then jogs west and runs to the coast. */
  function redBorder(b, p, o = {}) {
    const d = `M${b.nx} ${b.ny} L${b.jx} ${b.jy} L${b.jx - OFFX} ${b.jy + 6} L${b.cx - OFFX} ${b.cy}`;
    return `<g ${o.glow === false ? '' : 'filter="url(#fGlow)"'}>
      ${drawPath(d, p, { color: INK, w: (o.w || 12) + 8, opacity: 0.55 })}
      ${drawPath(d, p, { color: RED, w: o.w || 12 })}
    </g>`;
  }

  function hookText(p, t) {
    if (p <= 0) return '';
    const k = clamp(p, 0, 1);
    const pulse = 1 + Math.sin(t * 5) * 0.006;
    const bar = easeOutCubic(k);
    return `<g opacity="${k}" transform="translate(540 380) scale(${pulse}) translate(-540 -380)" filter="url(#fShadow)">
      <text x="540" y="330" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="150"
        fill="#fff" stroke="${INK}" stroke-width="14" paint-order="stroke" letter-spacing="6">WRONG</text>
      <text x="540" y="480" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="150"
        fill="${RED}" stroke="#fff" stroke-width="8" paint-order="stroke" letter-spacing="10">LINE</text>
      <rect x="${540 - 300 * bar}" y="512" width="${600 * bar}" height="12" rx="6" fill="${YELLOW}"/>
    </g>`;
  }

  function hookMap(zoomMul = 1, dim = 0.38) {
    return photo('m141', { ...HOOK, zoom: HOOK.zoom * zoomMul, bg: '#0f2a3a', dim, free: true });
  }

  // ---------- scenes ----------
  // Seams (s): hook 0 · London 4.40 · 1836 7.25 · survey 13.15 · hundreds 16.95 · Todd 19.95 ·
  // offset 21.85 · strip 23.62 · decades 28.45 · 1914 31.55 · today 36.72 · loop 37.86
  const scenes = [
    {
      // 1 — hook: WRONG LINE on the 141° map; kinked border; true meridian slides in; legal tick
      id: 'hook',
      start: 0,
      end: 4.7,
      draw(t) {
        const zoom = lerp(1, 1.06, easeInOutCubic(p01(t, 0, 4.4)));
        const ph = hookMap(zoom);
        const b = borderPts(ph);
        const hk = 1 - p01(t, 2.0, 0.35);
        const gold = dashedLine(b.jx, b.jy, b.cx, b.cy, 1, { w: 8 + 6 * p01(t, 2.26, 0.2) * (1 - p01(t, 2.6, 0.4)) });
        const kinkPulse = p01(t, 2.5, 0.5);
        const sk = shake(t, 3.36, 10, 0.35);
        const tick = p01(t, 3.36, 0.5);
        const [tx, ty] = [b.jx - OFFX - 120, lerp(b.jy, b.cy, 0.35)];
        return `<g transform="translate(${sk.x} ${sk.y})">
          ${ph.svg}<rect x="640" width="440" height="${H}" fill="url(#gRight)"/>${vignette()}
          ${gold}
          ${redBorder(b, 1)}
          ${ringBurst(b.jx - OFFX / 2, b.jy, t, 2.5, 30, 220, RED)}
          ${chip('141°E', b.jx + 120, b.jy + 170, p01(t, 2.6, 0.5), { bg: GOLD, fg: INK, stroke: INK })}
          ${chip('SA', b.jx - 260, b.jy - 120, p01(t, 2.9, 0.5), { size: 40 })}
          ${chip('NSW', b.jx + 200, b.jy - 180, p01(t, 3.0, 0.5), { size: 40 })}
          ${chip('VIC', b.jx + 190, b.jy + 330, p01(t, 3.1, 0.5), { size: 40 })}
          ${kinkPulse > 0 && kinkPulse < 1 ? `<circle cx="${b.jx - OFFX / 2}" cy="${b.jy}" r="${lerp(20, 90, kinkPulse)}" fill="none" stroke="${RED}" stroke-width="6" opacity="${1 - kinkPulse}"/>` : ''}
          ${tick > 0 ? `<g transform="translate(${tx} ${ty}) scale(${easeOutBack(clamp(tick / 0.4, 0, 1))})" filter="url(#fShadow)">
              <circle r="54" fill="#1f9d55" stroke="#fff" stroke-width="7"/>
              <path d="M-24 2 L-6 20 L26 -18" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
            </g>${ringBurst(tx, ty, t, 3.36, 54, 200, '#7cf0a8')}` : ''}
          ${hookText(hk, t)}
        </g>`;
      },
    },
    {
      // 2 — London: Guildhall push-in; appeal arc from Australia; LONDON pin + PRIVY COUNCIL
      id: 'london',
      start: 4.4,
      end: 7.55,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 4.4, 0.3));
        const zoom = lerp(1.0, 1.14, easeInOutCubic(p01(t, 4.4, 3.2)));
        const ph = photo('court', { u: 0.455, v: 0.45, zoom, dim: 0.42, filter: 'fCool' });
        const [tx, ty] = ph.at(0.52, 0.16);
        const arc = easeInOutCubic(p01(t, 4.55, 1.1));
        const ax0 = -60, ay0 = 1150, ax1 = tx - 40, ay1 = ty + 140;
        const qx = 120, qy = 380;
        const bez = (u) => [
          (1 - u) * (1 - u) * ax0 + 2 * (1 - u) * u * qx + u * u * ax1,
          (1 - u) * (1 - u) * ay0 + 2 * (1 - u) * u * qy + u * u * ay1,
        ];
        const [dx, dy] = bez(arc);
        const docOp = arc > 0 && arc < 1 ? 1 : arc >= 1 ? 1 - p01(t, 5.7, 0.3) : 0;
        return `<g opacity="${fi}">
          ${ph.svg}<rect x="700" width="380" height="${H}" fill="url(#gRight)"/>${vignette()}
          ${arc > 0 ? `<path d="M${ax0} ${ay0} Q${qx} ${qy} ${ax1} ${ay1}" fill="none" stroke="${YELLOW}" stroke-width="6" stroke-dasharray="18 14"
              pathLength="1000" stroke-dashoffset="0" opacity="${0.85 * (1 - p01(t, 6.4, 0.5))}" style="stroke-dasharray:${arc * 1000} 1000"/>` : ''}
          ${docOp > 0 ? `<g transform="translate(${dx} ${dy}) rotate(${lerp(-20, 8, arc)})" opacity="${docOp}" filter="url(#fShadow)">
              <rect x="-38" y="-48" width="76" height="96" rx="6" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>
              ${[-26, -12, 2, 16].map((yy) => `<line x1="-24" y1="${yy}" x2="24" y2="${yy}" stroke="${SEPIA}" stroke-width="4"/>`).join('')}
              <circle cx="16" cy="32" r="11" fill="${RED}"/>
            </g>` : ''}
          ${brackets(tx, ty + 260, 360, 640, p01(t, 5.05, 0.6))}
          ${placeTag('LONDON', 150, 300, p01(t, 5.5, 0.6), { size: 46 })}
          ${label('PRIVY COUNCIL', 110, 1080, p01(t, 5.9, 0.7), { size: 48 })}
        </g>`;
      },
    },
    {
      // 3 — 1836: engraved colonial globe; year slam; Letters Patent seal; 141°E meridian draws
      id: 'y1836',
      start: 7.25,
      end: 13.45,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 7.25, 0.3));
        const bg = photo('globe', { zoom: 1.2, dim: 0.55, filter: 'fBlur' });
        // sharp globe card
        const G = { cx: 540, cy: 760, r: 420 };
        const gs = (2 * G.r) / (237 * 2); // image px → screen (globe radius ≈ 237px in the scan)
        const spin = lerp(0, 1, easeInOutCubic(p01(t, 7.25, 6)));
        const zoomG = lerp(1.0, 1.08, spin);
        const gx = G.cx - 296 * gs * zoomG;
        const gy = G.cy - 290 * gs * zoomG;
        const toS = (px, py) => [gx + px * gs * zoomG, gy + py * gs * zoomG];
        const orbit = t * 0.9;
        // meridian between South Australia and NSW on the engraving (image px)
        const mTop = toS(283, 204);
        const mMid = toS(279, 268);
        const mBot = toS(272, 332);
        const mer = easeInOutCubic(p01(t, 11.1, 0.9));
        const merD = `M${mTop[0]} ${mTop[1]} Q${mMid[0] + 4} ${mMid[1]} ${mBot[0]} ${mBot[1]}`;
        const lp = p01(t, 8.62, 0.55);
        const lpOut = 1 - easeInOutCubic(p01(t, 10.8, 0.4));
        const seal = p01(t, 9.3, 0.4);
        return `<g opacity="${fi}">
          ${bg.svg}<rect width="${W}" height="${H}" fill="url(#gWarm)"/>${vignette()}
          <g filter="url(#fShadow)">
            <circle cx="${G.cx}" cy="${G.cy}" r="${G.r + 18}" fill="#1c1a12" opacity="0.6"/>
          </g>
          <clipPath id="gClip"><circle cx="${G.cx}" cy="${G.cy}" r="${G.r}"/></clipPath>
          <g clip-path="url(#gClip)">
            <rect x="${G.cx - G.r}" y="${G.cy - G.r}" width="${2 * G.r}" height="${2 * G.r}" fill="#caa21a"/>
            <image href="${IMG.globe[0]}" x="${gx}" y="${gy}" width="${592 * gs * zoomG}" height="${582 * gs * zoomG}" preserveAspectRatio="none"/>
            <circle cx="${G.cx}" cy="${G.cy}" r="${G.r}" fill="url(#gLens)"/>
            ${mer > 0 ? `<rect x="${G.cx - G.r}" y="${G.cy - G.r}" width="${2 * G.r}" height="${2 * G.r}" fill="#000" opacity="${0.25 * mer}"/>` : ''}
            ${drawPath(merD, mer, { color: INK, w: 22, opacity: 0.6 })}
            ${drawPath(merD, mer, { color: RED, w: 11, glow: true })}
          </g>
          <circle cx="${G.cx}" cy="${G.cy}" r="${G.r + 16}" fill="none" stroke="${GOLD}" stroke-width="4"
            stroke-dasharray="6 16" transform="rotate(${orbit * 20} ${G.cx} ${G.cy})"/>
          <circle cx="${G.cx}" cy="${G.cy}" r="${G.r}" fill="none" stroke="${PAPER}" stroke-width="6"/>
          ${[0, 1].map((i) => {
            const a = orbit + i * Math.PI;
            return `<circle cx="${G.cx + Math.cos(a) * (G.r + 16)}" cy="${G.cy + Math.sin(a) * (G.r + 16)}" r="9" fill="${GOLD}" filter="url(#fGlow)"/>`;
          }).join('')}
          ${yearSlam('1836', 540, 210, p01(t, 7.46, 0.6), t, { size: 170 })}
          ${ringBurst(540, 210, t, 7.46, 80, 420, GOLD)}
          ${lp > 0 && lpOut > 0 ? `<g opacity="${lpOut}" transform="translate(${lerp(-400, 0, easeOutCubic(clamp(lp / 0.6, 0, 1)))} 0) rotate(-5 250 1030)" filter="url(#fShadow)">
              <rect x="80" y="900" width="420" height="260" rx="8" fill="${PAPER}" stroke="${SEPIA}" stroke-width="5"/>
              <rect x="96" y="916" width="388" height="228" rx="4" fill="none" stroke="${SEPIA}" stroke-width="2"/>
              <text x="290" y="975" text-anchor="middle" font-family="${SERIF}" font-weight="900" font-size="38" fill="${INK}" letter-spacing="2">LETTERS PATENT</text>
              ${[1010, 1040, 1070, 1100].map((yy, i) => `<line x1="120" y1="${yy}" x2="${i === 3 ? 300 : 460}" y2="${yy}" stroke="${SEPIA}" stroke-width="4" opacity="0.6"/>`).join('')}
              ${seal > 0 ? `<g transform="translate(420 1100) scale(${lerp(1.8, 1, easeOutCubic(clamp(seal / 0.5, 0, 1)))})" opacity="${clamp(seal * 3, 0, 1)}">
                  <circle r="46" fill="#9e1b1b" stroke="#6a0f0f" stroke-width="5"/>
                  <circle r="32" fill="none" stroke="#e6a0a0" stroke-width="3" stroke-dasharray="5 5"/>
                  <path d="M-14 -8 L0 -20 L14 -8 L10 12 L-10 12Z" fill="#e6a0a0"/>
                </g>` : ''}
            </g>` : ''}
          ${chip('141°E', mTop[0] + 150, mTop[1] - 10, p01(t, 11.6, 0.5), { bg: GOLD, fg: INK, stroke: INK, size: 44 })}
          ${ringBurst(mMid[0], mMid[1], t, 12.14, 30, 260, RED)}
        </g>`;
      },
    },
    {
      // 4 — survey: 1883 plan, camera climbs the SA–Vic line; tree / mound / stone-pile marks pop in time
      id: 'survey',
      start: 13.15,
      end: 17.25,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 13.15, 0.3));
        const k = easeInOutCubic(p01(t, 13.15, 3.9));
        const vCam = (760 - lerp(-1340, -1150, k)) / 3264; // image bottom stays below frame edge
        const ph = photo('kink', { u: kLower(vCam * 1200), v: vCam, sx: 470, sy: 760, zoom: 1.7, dim: 0.3, filter: 'fSepia', free: true });
        const line = (y) => ph.at(kLower(y), y / 1200);
        const [bx, by] = line(1190);
        const [topx, topy] = line(560);
        const reveal = easeInOutCubic(p01(t, 13.3, 3.2));
        const [ex, ey] = [lerp(bx, topx, reveal), lerp(by, topy, reveal)];
        const marks = [
          ['tree', 14.46, 830, -1],
          ['mound', 15.32, 700, 1],
          ['cairn', 15.98, 590, -1],
        ];
        let mk = '';
        for (const [kind, at, yy, side] of marks) {
          const [lx, ly] = line(yy);
          mk += markBadge(kind, lx + side * 230, ly - 10, lx, ly, p01(t, at - 0.08, 0.6), 80);
          mk += ringBurst(lx, ly, t, at - 0.05, 12, 90, YELLOW);
        }
        // theodolite reticle riding the survey head
        const ret = `<g transform="translate(${ex} ${ey})" opacity="${reveal > 0 && reveal < 1 ? clamp(Math.abs(ey - 1340) / 60 - 2.2, 0, 1) : 0}">
          <circle r="46" fill="none" stroke="#fff" stroke-width="4"/>
          <line x1="-64" y1="0" x2="64" y2="0" stroke="#fff" stroke-width="3"/><line x1="0" y1="-64" x2="0" y2="64" stroke="#fff" stroke-width="3"/>
          <circle r="7" fill="${RED}"/>
        </g>`;
        return `<g opacity="${fi}">
          ${ph.svg}${grain()}${vignette()}
          <line x1="${bx}" y1="${by}" x2="${ex}" y2="${ey}" stroke="${INK}" stroke-width="18" opacity="0.5"/>
          <line x1="${bx}" y1="${by}" x2="${ex}" y2="${ey}" stroke="${YELLOW}" stroke-width="9" stroke-dasharray="30 10 6 10" filter="url(#fGlow)"/>
          ${ret}
          ${mk}
          ${label('SURVEY', 90, 250, p01(t, 13.45, 0.7), { size: 50 })}
        </g>`;
      },
    },
    {
      // 5 — hundreds of kilometres / years: line races coast → Murray; mark ticks; sun/moon year dial
      id: 'hundreds',
      start: 16.95,
      end: 20.25,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 16.95, 0.3));
        const zoom = lerp(2.2, 1.85, easeInOutCubic(p01(t, 16.95, 3.2)));
        const ph = photo('m141', { u: m141u(0.755), v: 0.755, sx: 520, sy: 720, zoom, bg: '#0f2a3a', dim: 0.4, free: true });
        const [cx, cy] = ph.at(m141u(M_COAST), M_COAST);
        const [jx, jy] = ph.at(m141u(M_JUNC), M_JUNC);
        const run = easeInOutCubic(p01(t, 17.1, 2.2));
        const ex = lerp(cx - OFFX, jx - OFFX, run);
        const ey = lerp(cy, jy, run);
        let ticks = '';
        const N = 16;
        for (let i = 0; i <= N; i++) {
          const f = i / N;
          if (f > run) break;
          const x = lerp(cx - OFFX, jx - OFFX, f);
          const y = lerp(cy, jy, f);
          const kind = i % 3;
          const pop = easeOutBack(clamp((run - f) * 8, 0, 1));
          ticks += `<g transform="translate(${x + (i % 2 ? 26 : -26)} ${y}) scale(${pop * 0.34})">${kind === 0 ? iconTree(1) : kind === 1 ? iconMound(1) : iconCairn(1)}</g>`;
        }
        // year dial: sun & moon orbit, 12 ticks light up per revolution
        const D = { x: 760, y: 300, r: 90 };
        const spin = p01(t, 18.9, 1.1) * 3 + p01(t, 17.1, 1.8) * 0.5;
        const ang = spin * Math.PI * 2 - Math.PI / 2;
        let dial = '';
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const lit = spin * 12 >= i + 1 || spin >= 1;
          dial += `<line x1="${D.x + Math.cos(a) * (D.r - 18)}" y1="${D.y + Math.sin(a) * (D.r - 18)}" x2="${D.x + Math.cos(a) * (D.r - 2)}" y2="${D.y + Math.sin(a) * (D.r - 2)}"
            stroke="${lit ? YELLOW : '#8899aa'}" stroke-width="6" stroke-linecap="round"/>`;
        }
        const years = Math.floor(spin);
        let pips = '';
        for (let i = 0; i < 3; i++) pips += `<circle cx="${D.x - 36 + i * 36}" cy="${D.y + D.r + 40}" r="11" fill="${i < years ? YELLOW : 'none'}" stroke="${YELLOW}" stroke-width="4"/>`;
        const dialOp = p01(t, 17.3, 0.4);
        return `<g opacity="${fi}">
          ${ph.svg}${vignette()}
          <line x1="${cx - OFFX}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="${INK}" stroke-width="20" opacity="0.5"/>
          <line x1="${cx - OFFX}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="${RED}" stroke-width="11" filter="url(#fGlow)"/>
          ${ticks}
          <circle cx="${ex}" cy="${ey}" r="${14 + Math.sin(t * 20) * 3}" fill="${YELLOW}" stroke="${INK}" stroke-width="4" filter="url(#fGlow)"/>
          ${dialOp > 0 ? `<g opacity="${dialOp}" filter="url(#fShadow)">
              <circle cx="${D.x}" cy="${D.y}" r="${D.r + 14}" fill="rgba(10,16,24,0.78)" stroke="#fff" stroke-width="4"/>
              ${dial}
              <circle cx="${D.x + Math.cos(ang) * 52}" cy="${D.y + Math.sin(ang) * 52}" r="20" fill="${YELLOW}" filter="url(#fGlow)"/>
              <g transform="translate(${D.x - Math.cos(ang) * 52} ${D.y - Math.sin(ang) * 52})">
                <circle r="16" fill="#dfe8f5"/><circle cx="7" cy="-5" r="14" fill="rgba(10,16,24,1)"/>
              </g>
              ${pips}
            </g>` : ''}
        </g>`;
      },
    },
    {
      // 6 — better instruments: Sir Charles Todd; transit reticle locks a star; telegraph pulse
      id: 'todd',
      start: 19.95,
      end: 22.15,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 19.95, 0.3));
        const zoom = lerp(1.05, 1.18, easeInOutCubic(p01(t, 19.95, 2.2)));
        const ph = photo('todd', { u: 0.45, v: 0.5, sy: 900, zoom, dim: 0.32, filter: 'fGray' });
        const R = { x: 700, y: 470, r: 140 };
        const lk = p01(t, 20.72, 0.5);
        const star = [lerp(R.x + 110, R.x, easeInOutCubic(lk)), lerp(R.y - 90, R.y, easeInOutCubic(lk))];
        const rot = t * 40;
        let tk = '';
        for (let i = 0; i < 36; i++) {
          const a = (i / 36) * Math.PI * 2;
          const L = i % 3 === 0 ? 18 : 9;
          tk += `<line x1="${R.x + Math.cos(a) * (R.r + 6)}" y1="${R.y + Math.sin(a) * (R.r + 6)}" x2="${R.x + Math.cos(a) * (R.r + 6 + L)}" y2="${R.y + Math.sin(a) * (R.r + 6 + L)}" stroke="${TEAL}" stroke-width="3"/>`;
        }
        const retOp = easeOutBack(p01(t, 20.3, 0.5));
        // telegraph pulse (dot-dash) scrolling
        const pulseOp = p01(t, 20.5, 0.4);
        const code = [1, 0, 3, 0, 1, 0, 1, 0, 0, 3, 0, 3, 0, 1, 0, 0, 1, 0, 3, 0, 1, 0, 1, 0, 0, 3, 0, 1];
        let d = 'M0 0';
        let x = 0;
        const off = (t * 420) % 560;
        for (let rep = 0; rep < 3; rep++) {
          for (const c of code) {
            const w = c === 0 ? 20 : c * 20;
            if (c) d += ` L${x} 0 L${x} -34 L${x + w} -34 L${x + w} 0`;
            x += w;
          }
        }
        d += ` L${x} 0`;
        return `<g opacity="${fi}">
          ${ph.svg}${vignette()}
          ${retOp > 0 ? `<g opacity="${clamp(retOp, 0, 1)}" filter="url(#fShadow)">
              <circle cx="${R.x}" cy="${R.y}" r="${R.r}" fill="rgba(6,12,20,0.82)" stroke="#fff" stroke-width="6"/>
              ${[...Array(18)].map((_, i) => `<circle cx="${R.x - R.r * 0.8 + rnd(i) * R.r * 1.6}" cy="${R.y - R.r * 0.8 + rnd(i + 40) * R.r * 1.6}" r="${1.5 + rnd(i + 9) * 2}" fill="#dfe8f5" opacity="${0.4 + rnd(i + 3) * 0.5}"/>`).join('')}
              <g transform="rotate(${rot} ${R.x} ${R.y})">${tk}</g>
              <line x1="${R.x - R.r}" y1="${R.y}" x2="${R.x + R.r}" y2="${R.y}" stroke="${TEAL}" stroke-width="3"/>
              <line x1="${R.x}" y1="${R.y - R.r}" x2="${R.x}" y2="${R.y + R.r}" stroke="${TEAL}" stroke-width="3"/>
              ${[-1, 1].map((s) => `<line x1="${R.x + s * 40}" y1="${R.y - R.r}" x2="${R.x + s * 40}" y2="${R.y + R.r}" stroke="${TEAL}" stroke-width="1.5" opacity="0.7"/>`).join('')}
              <circle cx="${star[0]}" cy="${star[1]}" r="9" fill="#fff" filter="url(#fGlow)"/>
              <circle cx="${R.x}" cy="${R.y}" r="${lerp(60, 22, easeOutCubic(lk))}" fill="none" stroke="${YELLOW}" stroke-width="5" opacity="${lk}"/>
            </g>${ringBurst(R.x, R.y, t, 21.2, 22, 210, YELLOW)}` : ''}
          ${pulseOp > 0 ? `<g opacity="${pulseOp}">
              <clipPath id="tgClip"><rect x="70" y="170" width="440" height="80"/></clipPath>
              <g clip-path="url(#tgClip)" filter="url(#fGlow)">
                <path d="${d}" transform="translate(${80 - off} 230)" fill="none" stroke="${YELLOW}" stroke-width="5" stroke-linejoin="round"/>
              </g>
              <line x1="70" y1="232" x2="510" y2="232" stroke="#fff" stroke-width="2" opacity="0.5"/>
            </g>` : ''}
          ${label('SIR CHARLES TODD', 80, 1100, p01(t, 20.35, 0.7), { size: 44, bg: '#fff' })}
        </g>`;
      },
    },
    {
      // 7 — off by a few kilometres: 1883 plan kink; true 141°E extended; ~3 km measure; OFF stamp
      id: 'offset',
      start: 21.85,
      end: 23.92,
      draw(t) {
        const snap = easeOutCubic(p01(t, 21.85, 0.35));
        const zoom = lerp(2.3, 1.9, snap) + p01(t, 22.2, 1.4) * 0.08;
        const sk = shake(t, 21.94, 16, 0.4);
        const ph = photo('kink', { u: 0.5, v: 0.5, sx: 540, sy: 700, zoom, dim: 0.22, free: true });
        const up = (y) => ph.at(kUpper(y), y / 1200);
        const lo = (y) => ph.at(kLower(y), y / 1200);
        const [u0x, u0y] = up(240);
        const [u1x, u1y] = up(530);
        const [t2x, t2y] = up(900); // true meridian extended south along the upper line's bearing
        const [l0x, l0y] = lo(540);
        const [l1x, l1y] = lo(900);
        const tr = easeInOutCubic(p01(t, 22.0, 0.55));
        const my = lerp(u1y, t2y, 0.45);
        const mxL = lerp(l0x, l1x, (my - l0y) / (l1y - l0y));
        const mxT = lerp(u1x, t2x, (my - u1y) / (t2y - u1y));
        return `<g opacity="${clamp(snap * 3, 0, 1)}" transform="translate(${sk.x} ${sk.y})">
          ${ph.svg}${vignette()}
          <line x1="${u0x}" y1="${u0y}" x2="${u1x}" y2="${u1y}" stroke="${GOLD}" stroke-width="8" opacity="0.9" filter="url(#fGlow)"/>
          ${dashedLine(u1x, u1y, t2x, t2y, tr)}
          <line x1="${l0x}" y1="${l0y}" x2="${l1x}" y2="${l1y}" stroke="${RED}" stroke-width="12" filter="url(#fGlow)" opacity="${0.4 + 0.6 * p01(t, 22.1, 0.3)}"/>
          ${measure(mxL, mxT, my, p01(t, 22.45, 0.6))}
          ${chip('~3 km', (mxL + mxT) / 2, my + 80, p01(t, 22.6, 0.5), { bg: '#fff', fg: INK, stroke: INK, size: 44 })}
          ${chip('141°E', u0x + 130, u0y + 40, p01(t, 22.05, 0.5), { bg: GOLD, fg: INK, stroke: INK })}
          ${chip('NSW', u1x + 110, u1y - 170, p01(t, 22.15, 0.5), { size: 38 })}
          ${chip('VIC', mxT + 110, my + 150, p01(t, 22.25, 0.5), { size: 38 })}
          ${chip('SA', mxL - 250, my - 170, p01(t, 22.35, 0.5), { size: 38 })}
          ${stamp('OFF', 300, 300, p01(t, 22.18, 0.6), { size: 120, rot: -10 })}
          ${sub('NOT TO SCALE · 1883 PLAN', 90, 1165, p01(t, 22.4, 0.5), { size: 24, opacity: 0.85 })}
        </g>`;
      },
    },
    {
      // 8 — the strip: anomaly map; hatched strip between true 141°E and the surveyed line; ~1,300 km²
      id: 'strip',
      start: 23.62,
      end: 28.75,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 23.62, 0.3));
        const k = easeInOutCubic(p01(t, 23.62, 5));
        const ph = photo('anom', { u: 0.378, v: 0.56, sx: 560, sy: 600, zoom: lerp(1.9, 2.1, k), dim: 0.42, free: true });
        const [jx, jy] = ph.at(0.378, 0.458);
        const [cx, cy] = ph.at(0.378, 0.70);
        const OX = 70; // exaggerated strip width (not to scale)
        const grow = easeInOutCubic(p01(t, 24.02, 0.9));
        const yb = lerp(jy, cy, grow);
        const flash = p01(t, 25.26, 0.3) * (1 - p01(t, 25.9, 0.6));
        const wrong = p01(t, 27.3, 0.5);
        const lift = easeOutBack(clamp(wrong / 0.6, 0, 1));
        const sx = -lift * 0; // strip stays put; the VIC tag snaps onto it
        const strip = grow > 0 ? `<g transform="translate(${sx} 0)">
            <rect x="${jx - OX}" y="${jy}" width="${OX}" height="${yb - jy}" fill="url(#pHatch)" stroke="${RED}" stroke-width="5"/>
            ${flash > 0 ? `<rect x="${jx - OX}" y="${jy}" width="${OX}" height="${yb - jy}" fill="#fff" opacity="${flash * 0.5}"/>` : ''}
          </g>` : '';
        const tagY = lerp(jy, cy, 0.5);
        return `<g opacity="${fi}">
          ${ph.svg}<rect width="330" height="${H}" fill="url(#gLeft)"/>${vignette()}
          ${dashedLine(jx, jy - 520, jx, cy, 1, { opacity: 0.95 })}
          ${strip}
          <line x1="${jx - OX}" y1="${jy}" x2="${jx - OX}" y2="${yb}" stroke="${RED}" stroke-width="10" filter="url(#fGlow)"/>
          ${chip('141°E', jx + 130, jy + 70, p01(t, 23.8, 0.5), { bg: GOLD, fg: INK, stroke: INK })}
          ${stamp('~1,300 km²', 540, 120, p01(t, 25.3, 0.6), { size: 72, rot: -4, fill: 'rgba(0,0,0,0.55)' })}
          ${ringBurst(jx - OX / 2, tagY, t, 25.3, 40, 300, RED)}
          ${chip('SA', jx - 300, tagY - 140, p01(t, 24.3, 0.5), { size: 44 })}
          ${chip('VIC', jx + 210, tagY + 40, p01(t, 24.45, 0.5), { size: 44 })}
          ${wrong > 0 ? `<g opacity="${clamp(wrong * 3, 0, 1)}" filter="url(#fGlow)">
              <path d="M${jx + 150} ${tagY + 40} Q${jx + 40} ${tagY + 120} ${jx - OX / 2} ${tagY + 30}" fill="none" stroke="#fff" stroke-width="7"
                pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${1 - easeOutCubic(clamp(wrong / 0.6, 0, 1))}"/>
            </g>
            <g transform="translate(${jx - OX / 2} ${tagY}) scale(${lift})">
              <circle r="44" fill="${INK}" stroke="#fff" stroke-width="5"/>
              <path d="M-16 -16 L16 16 M16 -16 L-16 16" stroke="${RED}" stroke-width="10" stroke-linecap="round"/>
            </g>` : ''}
          ${sub('NOT TO SCALE', 90, 1170, p01(t, 24.3, 0.5), { size: 24, opacity: 0.85 })}
        </g>`;
      },
    },
    {
      // 9 — decades: tug-of-war over the strip; split-flap decade counter; SOUTH AUSTRALIA v VICTORIA
      id: 'decades',
      start: 28.45,
      end: 31.85,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 28.45, 0.3));
        const ph = photo('kink', { u: 0.5, v: 0.62, zoom: 1.25, dim: 0.62, filter: 'fBlur' });
        const decades = ['1860s', '1870s', '1880s', '1890s', '1900s', '1910s'];
        const dp = p01(t, 29.3, 1.9);
        const di = Math.min(decades.length - 1, Math.floor(dp * decades.length));
        const flip = (dp * decades.length) % 1;
        const tug = Math.sin((t - 28.6) * 5.2) * 60 * (1 - p01(t, 31.2, 0.4) * 0.6);
        const ropeY = 800;
        const kx = 540 + tug;
        const inL = easeOutBack(p01(t, 28.62, 0.5));
        const inR = easeOutBack(p01(t, 28.8, 0.5));
        const sag = 26 + Math.abs(Math.sin((t - 28.6) * 5.2)) * 10;
        const team = (text, x, k, dir) => `<g transform="translate(${x + dir * (1 - k) * 500} ${ropeY}) rotate(${dir * -6})" filter="url(#fShadow)">
            <rect x="-125" y="-62" width="250" height="124" rx="20" fill="${dir < 0 ? PAPER : INK}" stroke="${dir < 0 ? RED : '#fff'}" stroke-width="7"/>
            <text x="0" y="24" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="66" fill="${dir < 0 ? RED : '#fff'}" letter-spacing="3">${text}</text>
          </g>`;
        return `<g opacity="${fi}">
          ${ph.svg}${grain()}${vignette()}
          <path d="M${215 + tug} ${ropeY} Q${kx} ${ropeY + sag} ${800 + tug} ${ropeY}" fill="none" stroke="#c9a46a" stroke-width="18" stroke-linecap="round"/>
          <path d="M${215 + tug} ${ropeY} Q${kx} ${ropeY + sag} ${800 + tug} ${ropeY}" fill="none" stroke="#8a6a3a" stroke-width="18" stroke-dasharray="10 12" stroke-linecap="round"/>
          <g transform="translate(${kx} ${ropeY + sag / 2})" filter="url(#fShadow)">
            <line x1="0" y1="0" x2="0" y2="110" stroke="#fff" stroke-width="6"/>
            <rect x="-22" y="30" width="44" height="90" fill="url(#pHatch)" stroke="${RED}" stroke-width="5"/>
          </g>
          <line x1="540" y1="${ropeY - 120}" x2="540" y2="${ropeY + 160}" stroke="#fff" stroke-width="4" stroke-dasharray="12 10" opacity="0.7"/>
          ${team('SA', 215 + tug, inL, -1)}
          ${team('VIC', 800 + tug, inR, 1)}
          ${dp > 0 ? `<g filter="url(#fShadow)" transform="translate(540 390)">
              <rect x="-230" y="-100" width="460" height="200" rx="18" fill="#12141a" stroke="${GOLD}" stroke-width="5"/>
              <line x1="-230" y1="0" x2="230" y2="0" stroke="#000" stroke-width="5"/>
              <g transform="scale(1 ${di < decades.length - 1 ? lerp(1, 0.2, Math.pow(flip, 6)) : 1})">
                <text x="0" y="52" text-anchor="middle" font-family="${SERIF}" font-weight="900" font-size="150" fill="${GOLD}">${decades[di]}</text>
              </g>
            </g>` : ''}
          ${label('SOUTH AUSTRALIA v VICTORIA', 70, 1090, p01(t, 29.9, 0.7), { size: 38, bg: '#fff' })}
        </g>`;
      },
    },
    {
      // 10 — 1914: Privy Council; year slam; gavel strikes on "rules"; the wrong line locks
      id: 'y1914',
      start: 31.55,
      end: 37.02,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 31.55, 0.3));
        const sk = shake(t, 34.3, 24, 0.5);
        const zoom = lerp(1.25, 1.42, easeInOutCubic(p01(t, 31.55, 5.2)));
        const ph = photo('court', { u: 0.5, v: 0.42, zoom, dim: 0.5, filter: 'fCool' });
        const yr = p01(t, 31.76, 0.6);
        const yrOut = 1 - p01(t, 34.8, 0.4);
        const gv = p01(t, 33.9, 0.4);
        const gvOut = 1 - p01(t, 35.0, 0.35);
        // locked-line map card
        const card = p01(t, 35.0, 0.5);
        const C = { x: 150, y: 500, w: 780, h: 640 };
        const map = photo('m141', { u: m141u(M_JUNC), v: 0.73, sx: C.x + C.w / 2, sy: C.y + C.h / 2 - 20, zoom: 1.6, bg: '#0f2a3a', dim: 0.25, free: true });
        const b = borderPts(map);
        const lock = p01(t, 35.55, 0.8);
        const cardSvg = card > 0 ? `<g transform="translate(540 ${C.y + C.h / 2}) scale(${easeOutBack(clamp(card / 0.6, 0, 1))}) rotate(${lerp(-8, -2, card)}) translate(-540 ${-(C.y + C.h / 2)})" filter="url(#fShadow)">
            <rect x="${C.x - 14}" y="${C.y - 14}" width="${C.w + 28}" height="${C.h + 28}" rx="8" fill="${PAPER}"/>
            <clipPath id="lockClip"><rect x="${C.x}" y="${C.y}" width="${C.w}" height="${C.h}"/></clipPath>
            <g clip-path="url(#lockClip)">
              ${map.svg}
              ${redBorder(b, 1, { w: 10 })}
            </g>
          </g>` : '';
        const lx = b.jx - OFFX;
        const ly = lerp(b.jy, b.cy, 0.42);
        return `<g opacity="${fi}" transform="translate(${sk.x} ${sk.y})">
          ${ph.svg}<rect x="700" width="380" height="${H}" fill="url(#gRight)"/>${vignette()}
          ${yearSlam('1914', 540, 250, yr, t, { opacity: yrOut })}
          ${ringBurst(540, 250, t, 31.76, 80, 460, GOLD)}
          ${label('PRIVY COUNCIL', 110, 470, p01(t, 33.3, 0.7), { size: 50, opacity: 1 - p01(t, 34.85, 0.35) })}
          ${gvOut > 0 ? `<g opacity="${gvOut}">${gavel(540, 900, gv, 1.5)}</g>${ringBurst(560, 900, t, 34.28, 60, 380, YELLOW)}` : ''}
          ${cardSvg}
          ${card > 0 ? `${padlock(lx, ly, lock, 1.1)}${ringBurst(lx, ly, t, 35.92, 50, 300, GOLD)}` : ''}
          ${card > 0 ? label('PRIVY COUNCIL · 1914', 110, 410, p01(t, 35.1, 0.6), { size: 40, bg: '#fff' }) : ''}
        </g>`;
      },
    },
    {
      // 11 — to this day: Serviceton, the disputed strip that stayed in Victoria
      id: 'today',
      start: 36.72,
      end: 38.16,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 36.72, 0.3));
        const zoom = lerp(1.2, 1.32, easeInOutCubic(p01(t, 36.72, 1.4)));
        const ph = photo('svc', { u: 0.56, v: 0.42, zoom, dim: 0.3 });
        return `<g opacity="${fi}">
          ${ph.svg}${vignette()}
          ${placeTag('SERVICETON, VIC', 170, 420, p01(t, 36.9, 0.6), { size: 44 })}
          ${stamp('STILL LEGAL', 540, 820, p01(t, 37.22, 0.6), { size: 96, rot: -7, color: GOLD, fill: 'rgba(0,0,0,0.5)' })}
        </g>`;
      },
    },
    {
      // 12 — loop: whip back to the frame-1 hook composition (last frame == frame 1)
      id: 'loop',
      start: 37.86,
      end: 38.376 + 0.2,
      draw(t) {
        const k = easeOutCubic(p01(t, 37.86, 0.32)); // settles by 38.18 s so the last muxed frame == frame 1
        const whip = (1 - k) * 700;
        const ph = hookMap(lerp(1.25, 1, k), 0.38);
        const b = borderPts(ph);
        return `<g transform="translate(0 ${-whip})" opacity="${clamp((t - 37.86) / 0.12, 0, 1)}">
          ${ph.svg}<rect x="640" width="440" height="${H}" fill="url(#gRight)"/>${vignette()}
          ${dashedLine(b.jx, b.jy, b.cx, b.cy, 1)}
          ${redBorder(b, 1)}
          ${hookText(1, t)}
        </g>`;
      },
    },
  ];

  // Prepend shared defs to every scene layer (duplicates during crossfade are harmless).
  for (const sc of scenes) {
    const d = sc.draw;
    sc.draw = (t, lt, hs) => DEFS + d(t, lt, hs);
  }

  window.EPISODE = {
    duration: 38.376,
    fps: 30,
    images: Object.fromEntries(Object.entries(IMG).map(([k, v]) => [k, v[0]])),
    words: [],
    scenes,
  };
})();
