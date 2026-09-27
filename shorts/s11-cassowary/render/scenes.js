/* s11 — The Cassowary
 * Photo underlay + SVG motion graphics. SVG + renderFrame(t) only (no Remotion).
 * Beat times come from transcript.json (faster-whisper word timings on audio/vo.mp3).
 * On-screen text: frame-1 hook + names / places / facts only. No VO-echo titles. No gore.
 * Caption band (~70%, y≈1230–1450), the bottom UI zone and the right edge are kept clear of graphics.
 */
(function () {
  const HS = window.HS;
  const { W, H, clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic } = HS;

  const IMG = {
    portrait: ['/img/s11_01_cassowary_portrait.jpg', 1280, 1919],
    kuranda: ['/img/s11_03_kuranda_cassowary.jpg', 1280, 938],
    claw: ['/img/s11_04_claw_foot.png', 1195, 1109],
    cook: ['/img/s11_05_cook_highway_1920s.jpg', 1000, 571],
    rain: ['/img/s11_06_rainforest_cassowary.jpg', 1282, 1024],
    seeds: ['/img/s11_07_seed_dropping.jpg', 1280, 960],
    canopy: ['/img/s11_08_daintree_rainforest.jpg', 1280, 1707],
    etty: ['/img/s11_09_etty_bay.jpg', 960, 1440],
  };

  const DISPLAY = `'DejaVu Sans', 'Liberation Sans', sans-serif`;
  const YELLOW = '#ffcc33';
  const RED = '#e8322b';
  const INK = '#15171a';
  const TEAL = '#43c6f0'; // casque-neck blue
  const PAPER = '#efe7d4';
  const LEAF = '#9bd65a';

  // ---------- helpers ----------
  const p01 = (t, t0, d) => clamp((t - t0) / d, 0, 1);
  const rnd = (i) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fid = (p, t) => p + Math.round(t * 30);

  function shake(t, t0, amp = 22, dur = 0.45) {
    const k = p01(t, t0, dur);
    if (k <= 0 || k >= 1) return { x: 0, y: 0 };
    const a = amp * Math.pow(1 - k, 2);
    return { x: Math.sin(t * 91) * a, y: Math.cos(t * 77) * a };
  }

  /** Full-bleed cover crop with a focus point, zoom and drift. */
  function photo(key, o = {}) {
    const [url, iw, ih] = IMG[key];
    const base = Math.max(W / iw, H / ih);
    const s = base * (o.zoom || 1);
    const w = iw * s;
    const h = ih * s;
    let x = W / 2 - (o.fx != null ? o.fx : 0.5) * w + (o.dx || 0);
    let y = H / 2 - (o.fy != null ? o.fy : 0.5) * h + (o.dy || 0);
    x = clamp(x, W - w, 0);
    y = clamp(y, H - h, 0);
    const filt = o.filter ? ` filter="url(#${o.filter})"` : '';
    return {
      x, y, w, h,
      svg: `<image href="${url}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"${filt}/>
        ${o.tint ? `<rect width="${W}" height="${H}" fill="${o.tint}"/>` : ''}
        <rect width="${W}" height="${H}" fill="rgba(0,0,0,${o.dim != null ? o.dim : 0.45})"/>`,
      at: (u, v) => [x + u * w, y + v * h],
    };
  }

  /** Image fitted (cover) into a box, clipped — for print cards and wide frames. */
  function boxImage(key, bx, by, bw, bh, o = {}) {
    const [url, iw, ih] = IMG[key];
    const s = Math.max(bw / iw, bh / ih) * (o.zoom || 1);
    const w = iw * s;
    const h = ih * s;
    const x = clamp(bx + bw / 2 - (o.fx != null ? o.fx : 0.5) * w + (o.dx || 0), bx + bw - w, bx);
    const y = clamp(by + bh / 2 - (o.fy != null ? o.fy : 0.5) * h, by + bh - h, by);
    const id = o.id || 'bx' + Math.round(bx) + '_' + Math.round(by);
    return {
      x, y, w, h,
      at: (u, v) => [x + u * w, y + v * h],
      svg: `<clipPath id="${id}"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}"/></clipPath>
        <g clip-path="url(#${id})"><image href="${url}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"${o.filter ? ` filter="url(#${o.filter})"` : ''}/>
        ${o.dim ? `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="rgba(0,0,0,${o.dim})"/>` : ''}</g>`,
    };
  }

  /** Circular lens showing an image point (u,v) at a given pixel scale. */
  function lens(key, cx, cy, r, u, v, scale, p, o = {}) {
    if (p <= 0) return '';
    const [url, iw, ih] = IMG[key];
    const k = easeOutBack(clamp(p / 0.5, 0, 1));
    const w = iw * scale;
    const h = ih * scale;
    const id = o.id || 'ln' + Math.round(cx);
    const circ = 2 * Math.PI * (r + 14);
    const ring = easeOutCubic(clamp(p / 0.7, 0, 1));
    return `<g transform="translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})">
      <circle cx="${cx}" cy="${cy + 18}" r="${r + 10}" fill="rgba(0,0,0,0.55)" filter="url(#fSoft)"/>
      <clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
      <g clip-path="url(#${id})">
        <image href="${url}" x="${cx - u * w + (o.dx || 0)}" y="${cy - v * h + (o.dy || 0)}" width="${w}" height="${h}" preserveAspectRatio="none"${o.filter ? ` filter="url(#${o.filter})"` : ''}/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#gLens)"/>
      </g>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#fff" stroke-width="8"/>
      <circle cx="${cx}" cy="${cy}" r="${r + 14}" fill="none" stroke="${o.ring || YELLOW}" stroke-width="6"
        stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - ring)}" transform="rotate(-90 ${cx} ${cy})"/>
    </g>`;
  }

  const DEFS = `
    <defs>
      <filter id="fSepia" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.39 0.77 0.19 0 0  0.35 0.69 0.17 0 0  0.27 0.53 0.13 0 0  0 0 0 1 0"/>
      </filter>
      <filter id="fBlur" x="-5%" y="-5%" width="110%" height="110%">
        <feGaussianBlur stdDeviation="16"/>
      </filter>
      <filter id="fBlurSepia" x="-5%" y="-5%" width="110%" height="110%">
        <feColorMatrix type="matrix" values="0.39 0.77 0.19 0 0  0.35 0.69 0.17 0 0  0.27 0.53 0.13 0 0  0 0 0 1 0"/>
        <feGaussianBlur stdDeviation="14"/>
      </filter>
      <filter id="fDrain" color-interpolation-filters="sRGB">
        <feColorMatrix type="saturate" values="0.35"/>
      </filter>
      <filter id="fBright" color-interpolation-filters="sRGB">
        <feComponentTransfer><feFuncR type="linear" slope="1.45" intercept="0.02"/><feFuncG type="linear" slope="1.4" intercept="0.02"/><feFuncB type="linear" slope="1.35" intercept="0.02"/></feComponentTransfer>
      </filter>
      <filter id="fSoft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
      <filter id="fLeafBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>
      <filter id="fStamp" x="-10%" y="-20%" width="120%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="5"/>
        <feComponentTransfer><feFuncA type="discrete" tableValues="0 1 1 1 1 1"/></feComponentTransfer>
      </filter>
      <filter id="fShadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#000" flood-opacity="0.65"/>
      </filter>
      <filter id="fGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="8" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <radialGradient id="gVig" cx="50%" cy="45%" r="75%">
        <stop offset="55%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.8"/>
      </radialGradient>
      <linearGradient id="gTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0.65"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="gLens" cx="35%" cy="30%" r="80%">
        <stop offset="0" stop-color="#fff" stop-opacity="0.16"/>
        <stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.35"/>
      </radialGradient>
      <radialGradient id="gWarm" cx="82%" cy="12%" r="85%">
        <stop offset="0" stop-color="#ffc56b" stop-opacity="0.55"/>
        <stop offset="0.45" stop-color="#ff9a3c" stop-opacity="0.14"/>
        <stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="gScan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${TEAL}" stop-opacity="0"/>
        <stop offset="0.85" stop-color="${TEAL}" stop-opacity="0.28"/>
        <stop offset="1" stop-color="#e9fbff" stop-opacity="0.95"/>
      </linearGradient>
      <linearGradient id="gSteel" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#e9edf0"/><stop offset="0.5" stop-color="#a3acb4"/><stop offset="1" stop-color="#f4f6f8"/>
      </linearGradient>
      <linearGradient id="gSea" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#15384f"/><stop offset="1" stop-color="#0c2536"/>
      </linearGradient>
    </defs>`;

  const vignette = () =>
    `<rect width="${W}" height="${H}" fill="url(#gVig)"/><rect width="${W}" height="480" fill="url(#gTop)"/>`;

  // ---------- reusable motion-graphic parts ----------

  /** Kinetic label: bar wipes in, text rises. Anchored at left x. */
  function label(text, x, y, p, o = {}) {
    if (p <= 0) return '';
    const size = o.size || 46;
    const padX = 26;
    const w = o.w || text.length * (size * 0.72 + 2) + padX * 2 + 8;
    const h = size + 30;
    const bar = easeOutCubic(clamp(p / 0.6, 0, 1));
    const tp = easeOutCubic(clamp((p - 0.25) / 0.75, 0, 1));
    const cid = 'lc' + Math.round(x) + '_' + Math.round(y);
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
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="14" fill="none" stroke="${color}" stroke-width="12"/>
        <rect x="${-w / 2 + 16}" y="${-h / 2 + 16}" width="${w - 32}" height="${h - 32}" rx="8" fill="none" stroke="${color}" stroke-width="4"/>
        <text x="0" y="${size * 0.36}" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="${size}"
          fill="${color}" letter-spacing="4">${esc(text)}</text>
      </g>`;
  }

  function easeOutBounce(x) {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (x < 1 / d1) return n1 * x * x;
    if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
    if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }

  /** Corner lock-on brackets. */
  function brackets(cx, cy, w, h, p, color = TEAL) {
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

  /** Scan beam sweeping down a box (the "specimen scan" on the casque). */
  function scan(t, x, y, w, h, t0, dur, op = 1) {
    const k = ((t - t0) % dur) / dur;
    if (t < t0 || op <= 0) return '';
    const sy = y + easeInOutCubic(k) * h;
    const id = fid('sc', t) + Math.round(x);
    return `<g opacity="${op}">
      <clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>
      <g clip-path="url(#${id})">
        <rect x="${x}" y="${sy - 160}" width="${w}" height="160" fill="url(#gScan)"/>
        <rect x="${x}" y="${sy - 2}" width="${w}" height="4" fill="#effcff" filter="url(#fGlow)"/>
        ${[0.2, 0.4, 0.6, 0.8].map((f) => `<line x1="${x + f * w}" y1="${y}" x2="${x + f * w}" y2="${y + h}" stroke="${TEAL}" stroke-opacity="0.18" stroke-width="2"/>`).join('')}
        ${[0.25, 0.5, 0.75].map((f) => `<line x1="${x}" y1="${y + f * h}" x2="${x + w}" y2="${y + f * h}" stroke="${TEAL}" stroke-opacity="0.18" stroke-width="2"/>`).join('')}
      </g>
    </g>`;
  }

  /** Three claw-scratch slashes ripping across the frame (graphic marks only, no blood). */
  function slashes(t, t0) {
    const k0 = p01(t, t0, 1.0);
    if (k0 <= 0 || k0 >= 1) return '';
    const fade = 1 - p01(t, t0 + 0.55, 0.45);
    let s = '';
    for (let i = 0; i < 3; i++) {
      const d = p01(t, t0 + i * 0.05, 0.16);
      if (d <= 0) continue;
      const x1 = 180 + i * 190;
      const y1 = 230 + i * 40;
      const x2 = 620 + i * 190;
      const y2 = 1080 + i * 30;
      const len = Math.hypot(x2 - x1, y2 - y1);
      const path = `M${x1} ${y1} Q${(x1 + x2) / 2 + 60} ${(y1 + y2) / 2 - 40} ${x2} ${y2}`;
      s += `<path d="${path}" fill="none" stroke="${YELLOW}" stroke-opacity="0.55" stroke-width="44" stroke-linecap="round"
          stroke-dasharray="${len * 1.1}" stroke-dashoffset="${len * 1.1 * (1 - d)}" filter="url(#fSoft)"/>
        <path d="${path}" fill="none" stroke="#fffbe8" stroke-width="16" stroke-linecap="round"
          stroke-dasharray="${len * 1.1}" stroke-dashoffset="${len * 1.1 * (1 - d)}"/>
        <path d="${path}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" opacity="0.6"
          stroke-dasharray="${len * 1.1}" stroke-dashoffset="${len * 1.1 * (1 - d)}" transform="translate(10 6)"/>`;
    }
    const fl = 1 - p01(t, t0, 0.14);
    return `<g opacity="${fade}">${s}</g>${fl > 0 ? `<rect width="${W}" height="${H}" fill="rgba(255,250,230,${fl * 0.35})"/>` : ''}`;
  }

  /** Frame-1 hook lock-up (also re-forms at the loop end). Sits on the dark plumage, above the caption band. */
  function hook(p, t) {
    if (p <= 0) return '';
    const k = clamp(p, 0, 1);
    const pulse = 1 + Math.sin(t * 5) * 0.006;
    const bar = easeOutCubic(k);
    return `<g opacity="${k}" transform="translate(540 1080) scale(${pulse}) translate(-540 -1080)" filter="url(#fShadow)">
      <text x="540" y="1000" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="104"
        fill="#fff" stroke="${INK}" stroke-width="12" paint-order="stroke" letter-spacing="3">LOOKS LIKE</text>
      <text x="540" y="1132" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="120"
        fill="${YELLOW}" stroke="${INK}" stroke-width="13" paint-order="stroke" letter-spacing="2">A DINOSAUR</text>
      <rect x="${540 - 360 * bar}" y="1158" width="${720 * bar}" height="12" rx="6" fill="${RED}"/>
    </g>`;
  }

  /** Vertical height ruler that grows from ground up to top (0 → ~2 m). */
  function ruler(x, yGround, yTop, p, t) {
    if (p <= 0) return '';
    const k = easeInOutCubic(clamp(p, 0, 1));
    const yNow = lerp(yGround, yTop, k);
    let ticks = '';
    for (let i = 0; i <= 8; i++) {
      const yy = lerp(yGround, yTop, i / 8);
      if (yy < yNow - 1) continue;
      const major = i % 4 === 0;
      ticks += `<line x1="${x - (major ? 34 : 20)}" y1="${yy}" x2="${x}" y2="${yy}" stroke="#fff" stroke-width="${major ? 6 : 4}"/>`;
      if (i === 4) ticks += `<text x="${x + 18}" y="${yy + 12}" font-family="${DISPLAY}" font-weight="700" font-size="32" fill="#fff" stroke="${INK}" stroke-width="5" paint-order="stroke">1 m</text>`;
    }
    return `<g filter="url(#fShadow)">
      <line x1="${x}" y1="${yGround}" x2="${x}" y2="${yNow}" stroke="#fff" stroke-width="8" stroke-linecap="round"/>
      ${ticks}
      <circle cx="${x}" cy="${yNow}" r="12" fill="${YELLOW}" stroke="${INK}" stroke-width="4"/>
    </g>`;
  }

  /** Icon badge — jump (hop arc) or swim (waves). Icon only, no text. */
  function iconBadge(kind, cx, cy, p, t, t0) {
    if (p <= 0) return '';
    const k = easeOutBack(clamp(p / 0.4, 0, 1));
    const r = 84;
    const lt = t - t0;
    let icon = '';
    if (kind === 'jump') {
      const hop = (lt * 1.3) % 1;
      const hx = lerp(-44, 44, hop);
      const hy = 30 - Math.sin(hop * Math.PI) * 72;
      icon = `<line x1="-56" y1="36" x2="56" y2="36" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
        <path d="M-44 30 Q0 -114 44 30" fill="none" stroke="${YELLOW}" stroke-width="5" stroke-dasharray="10 9"/>
        <circle cx="${hx}" cy="${hy}" r="13" fill="#fff"/>
        <path d="M0 -12 L0 -52 M-14 -38 L0 -54 L14 -38" fill="none" stroke="${YELLOW}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
    } else {
      const wave = (dy, ph) => {
        let d = `M-60 ${dy}`;
        for (let x = -60; x <= 60; x += 6) d += ` L${x} ${dy + Math.sin(x / 13 + lt * 5 + ph) * 7}`;
        return `<path d="${d}" fill="none" stroke="${TEAL}" stroke-width="7" stroke-linecap="round"/>`;
      };
      icon = `<circle cx="0" cy="${-16 + Math.sin(lt * 4) * 5}" r="16" fill="#fff"/>
        ${wave(8, 0)}${wave(32, 1.4)}`;
    }
    return `<g transform="translate(${cx} ${cy}) scale(${k})" filter="url(#fShadow)">
      <circle r="${r}" fill="rgba(15,20,26,0.82)" stroke="${YELLOW}" stroke-width="6"/>
      ${icon}
    </g>`;
  }

  /** Dagger outline drawn on, with glint. */
  function dagger(cx, top, len, p, t, glintT) {
    if (p <= 0) return '';
    const d = easeInOutCubic(clamp(p, 0, 1));
    const bw = 44;
    const bladeTop = top + 150;
    const tip = top + len;
    const blade = `M${cx - bw / 2} ${bladeTop} L${cx + bw / 2} ${bladeTop} L${cx + bw / 2 - 4} ${tip - 120} Q${cx + 6} ${tip - 30} ${cx} ${tip} Q${cx - 6} ${tip - 30} ${cx - bw / 2 + 4} ${tip - 120}Z`;
    const guard = `M${cx - 86} ${bladeTop - 22} L${cx + 86} ${bladeTop - 22} L${cx + 86} ${bladeTop} L${cx - 86} ${bladeTop}Z`;
    const grip = `M${cx - 18} ${top + 20} L${cx + 18} ${top + 20} L${cx + 18} ${bladeTop - 22} L${cx - 18} ${bladeTop - 22}Z`;
    const perim = 2 * len + 400;
    const fill = clamp((p - 0.6) / 0.4, 0, 1);
    const g = p01(t, glintT, 0.5);
    const gy = lerp(bladeTop, tip, g);
    return `<g filter="url(#fShadow)">
      <path d="${blade}" fill="url(#gSteel)" fill-opacity="${fill * 0.9}" stroke="#fff" stroke-width="6" stroke-linejoin="round"
        stroke-dasharray="${perim}" stroke-dashoffset="${perim * (1 - d)}"/>
      <line x1="${cx}" y1="${bladeTop + 10}" x2="${cx}" y2="${tip - 60}" stroke="#6f7880" stroke-width="3" opacity="${fill}"/>
      <path d="${guard}" fill="${YELLOW}" fill-opacity="${fill}" stroke="#fff" stroke-width="5" stroke-dasharray="500" stroke-dashoffset="${500 * (1 - d)}"/>
      <path d="${grip}" fill="#3b2a1a" fill-opacity="${fill}" stroke="#fff" stroke-width="5" stroke-dasharray="400" stroke-dashoffset="${400 * (1 - d)}"/>
      <circle cx="${cx}" cy="${top + 14}" r="18" fill="${YELLOW}" fill-opacity="${fill}" stroke="#fff" stroke-width="5"/>
      ${g > 0 && g < 1 ? `<path transform="translate(${cx} ${gy}) scale(${Math.sin(g * Math.PI) * 1.3})" d="M0 -40 L8 -8 L40 0 L8 8 L0 40 L-8 8 L-40 0 L-8 -8Z" fill="#fff" filter="url(#fGlow)"/>` : ''}
    </g>`;
  }

  /** Measure bracket (vertical) with a value chip. */
  function measure(x, y1, y2, p, text) {
    if (p <= 0) return '';
    const k = easeOutCubic(clamp(p / 0.5, 0, 1));
    const mid = (y1 + y2) / 2;
    const a = lerp(mid, y1, k);
    const b = lerp(mid, y2, k);
    const chip = clamp((p - 0.35) / 0.5, 0, 1);
    return `<g filter="url(#fShadow)">
      <line x1="${x}" y1="${a}" x2="${x}" y2="${b}" stroke="${YELLOW}" stroke-width="6"/>
      <line x1="${x - 22}" y1="${a}" x2="${x + 22}" y2="${a}" stroke="${YELLOW}" stroke-width="6"/>
      <line x1="${x - 22}" y1="${b}" x2="${x + 22}" y2="${b}" stroke="${YELLOW}" stroke-width="6"/>
      <path d="M${x} ${a} l-12 20 M${x} ${a} l12 20 M${x} ${b} l-12 -20 M${x} ${b} l12 -20" stroke="${YELLOW}" stroke-width="5" fill="none"/>
    </g>
    ${label(text, x - 150, y2 + 90, chip, { size: 58 })}`;
  }

  /** Three-toed cassowary track (one print). */
  function track(x, y, rot, s, op) {
    if (op <= 0) return '';
    return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" opacity="${op}" fill="rgba(20,14,8,0.85)">
      <ellipse cx="0" cy="8" rx="11" ry="9"/>
      <path d="M-4 0 L-26 -38 L-18 -41 L2 -4Z"/>
      <path d="M-5 0 L-3 -52 L5 -52 L6 0Z"/>
      <path d="M4 -2 L24 -36 L31 -31 L8 4Z"/>
    </g>`;
  }

  /** Schematic coastline inset: Cairns → Mossman (MG only, not to scale). */
  function mapInset(x, y, w, h, p, t) {
    if (p <= 0) return '';
    const k = easeOutCubic(clamp(p / 0.5, 0, 1));
    const coast = `M${w * 0.62} 0 C${w * 0.6} ${h * 0.12} ${w * 0.7} ${h * 0.2} ${w * 0.64} ${h * 0.32}
      C${w * 0.6} ${h * 0.4} ${w * 0.74} ${h * 0.44} ${w * 0.7} ${h * 0.5} C${w * 0.66} ${h * 0.58} ${w * 0.56} ${h * 0.62} ${w * 0.6} ${h * 0.74}
      C${w * 0.64} ${h * 0.84} ${w * 0.58} ${h * 0.92} ${w * 0.6} ${h}`;
    const land = `${coast} L0 ${h} L0 0Z`;
    const mos = [w * 0.46, h * 0.28];
    const cns = [w * 0.5, h * 0.82];
    const pinP = clamp((p - 0.3) / 0.6, 0, 1);
    const drop = easeOutBounce(pinP);
    const rip = clamp((p - 0.7) / 0.8, 0, 1);
    const road = clamp((p - 0.2) / 0.7, 0, 1);
    const id = 'map' + Math.round(x);
    return `<g transform="translate(${x} ${y + (1 - k) * 60})" opacity="${k}" filter="url(#fShadow)">
      <clipPath id="${id}"><rect width="${w}" height="${h}" rx="18"/></clipPath>
      <g clip-path="url(#${id})">
        <rect width="${w}" height="${h}" fill="url(#gSea)"/>
        ${[1, 2, 3, 4].map((i) => `<path d="${coast}" transform="translate(${i * 20} 0)" fill="none" stroke="#2e6f8f" stroke-opacity="${0.5 - i * 0.1}" stroke-width="2"/>`).join('')}
        <path d="${land}" fill="#2f3b22"/>
        <path d="${coast}" fill="none" stroke="#c8d8a8" stroke-width="4"/>
        <path d="M${cns[0]} ${cns[1]} C${w * 0.58} ${h * 0.62} ${w * 0.62} ${h * 0.46} ${mos[0]} ${mos[1]}" fill="none" stroke="${YELLOW}"
          stroke-width="5" stroke-dasharray="12 10" opacity="${road}"/>
        <circle cx="${cns[0]}" cy="${cns[1]}" r="11" fill="#fff" stroke="${INK}" stroke-width="4"/>
        <text x="${cns[0] - 22}" y="${cns[1] + 8}" text-anchor="end" font-family="${DISPLAY}" font-weight="700" font-size="28" fill="#e9e3d2">CAIRNS</text>
        <ellipse cx="${mos[0]}" cy="${mos[1]}" rx="${20 + rip * 60}" ry="${7 + rip * 20}" fill="none" stroke="${YELLOW}" stroke-width="4" opacity="${(1 - rip) * 0.9 * (pinP > 0 ? 1 : 0)}"/>
        ${pinP > 0 ? `<g transform="translate(${mos[0]} ${lerp(mos[1] - 200, mos[1], drop)})">
          <path d="M0 0 C-7 -22 -32 -40 -32 -66 A32 32 0 1 1 32 -66 C32 -40 7 -22 0 0Z" fill="${RED}" stroke="#fff" stroke-width="4"/>
          <circle cx="0" cy="-66" r="12" fill="#fff"/></g>` : ''}
        <text x="${mos[0]}" y="${mos[1] + 52}" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="34" fill="#fff" opacity="${clamp((p - 0.6) / 0.3, 0, 1)}">MOSSMAN</text>
        <g transform="translate(${w - 46} 50)" opacity="0.85">
          <path d="M0 -26 L12 8 L0 2 L-12 8Z" fill="#fff"/>
          <text x="0" y="36" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="24" fill="#fff">N</text>
        </g>
      </g>
      <rect width="${w}" height="${h}" rx="18" fill="none" stroke="${PAPER}" stroke-width="5"/>
    </g>`;
  }

  /** Soft foreground foliage (out-of-focus leaves closing in on the bird). */
  function foliage(side, p, t) {
    if (p <= 0) return '';
    const k = easeInOutCubic(clamp(p, 0, 1));
    const dir = side === 'L' ? 1 : -1;
    const baseX = side === 'L' ? -260 : W + 260;
    let s = '';
    for (let i = 0; i < 5; i++) {
      const y = 260 + i * 190 + rnd(i * 7 + (side === 'L' ? 1 : 9)) * 60;
      const reach = (200 + rnd(i * 13 + (side === 'L' ? 3 : 5)) * 170) * k;
      const x = baseX + dir * reach;
      const rot = dir * (-25 + rnd(i * 17) * 50) + Math.sin(t * 1.3 + i) * 3;
      const sc = 1.1 + rnd(i * 19) * 0.8;
      s += `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc * dir} ${sc})">
        <path d="M-200 0 C-120 -70 60 -80 170 0 C60 70 -120 70 -200 0Z" fill="${i % 2 ? '#10240f' : '#183414'}"/>
        <path d="M-190 0 L160 0" stroke="#2c4e22" stroke-width="5"/>
      </g>`;
    }
    return `<g filter="url(#fLeafBlur)" opacity="0.94">${s}</g>`;
  }

  /** Seed arc flight from a source point to a landing point, then a sprout grows. */
  function seedFlight(t, i, sx, sy, t0) {
    const lx = 110 + rnd(i * 31) * 800;
    const ly = 1010 + rnd(i * 37) * 150;
    const k = p01(t, t0, 0.8);
    if (k <= 0) return { seed: '', sprout: '' };
    const e = easeInOutCubic(k);
    const peak = Math.min(sy, ly) - 180 - rnd(i * 41) * 200;
    const cx = (sx + lx) / 2;
    const bx = (u) => (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * cx + u * u * lx;
    const by = (u) => (1 - u) * (1 - u) * sy + 2 * (1 - u) * u * peak + u * u * ly;
    const trailOp = (1 - p01(t, t0 + 1.2, 0.8)) * 0.55;
    const trail = `<path d="M${sx} ${sy} Q${cx} ${peak} ${lx} ${ly}" fill="none" stroke="#f7e7b0" stroke-width="3" stroke-dasharray="8 10"
      pathLength="100" stroke-dashoffset="0" opacity="${trailOp}" style="stroke-dasharray:${e * 100} 100"/>`;
    const seed = `${trail}<ellipse cx="${bx(e)}" cy="${by(e)}" rx="${11 + rnd(i) * 6}" ry="${8 + rnd(i) * 4}" fill="#7a3b1c" stroke="#f0c98a" stroke-width="2.5"
      transform="rotate(${k * 360 + i * 40} ${bx(e)} ${by(e)})"/>`;
    const g = p01(t, t0 + 0.8, 1.1);
    let sprout = '';
    if (g > 0) {
      const hgt = (46 + rnd(i * 43) * 50) * easeOutCubic(g);
      const lf = easeOutBack(clamp((g - 0.35) / 0.65, 0, 1));
      const sway = Math.sin(t * 2 + i) * 4;
      sprout = `<g transform="translate(${lx} ${ly})">
        <path d="M0 0 Q${sway} ${-hgt / 2} ${sway * 1.5} ${-hgt}" stroke="${LEAF}" stroke-width="6" fill="none" stroke-linecap="round"/>
        <g transform="translate(${sway * 1.5} ${-hgt}) scale(${lf})">
          <path d="M0 0 C-10 -24 -38 -26 -46 -10 C-30 -2 -12 0 0 0Z" fill="${LEAF}"/>
          <path d="M0 0 C10 -24 38 -26 46 -10 C30 -2 12 0 0 0Z" fill="#7fc24a"/>
        </g>
      </g>`;
    }
    return { seed: g < 1 ? seed : '', sprout };
  }

  // ---------- scenes ----------
  const Z0 = 1.04; // hook framing — also the loop's final framing
  const HOOK_FX = 0.5;
  const HOOK_FY = 0.3;
  const HEAD = [0.49, 0.2]; // etty-bay head + casque centre (image-relative)
  const X = 0.3; // crossfade length

  const scenes = [
    {
      // 1 — frame-1 hook, specimen scan, claw-slash on "fight like one"
      id: 'hook',
      start: 0,
      end: 4.3 + X,
      draw(t) {
        const zoom = lerp(Z0, Z0 + 0.14, easeInOutCubic(p01(t, 0, 4.4)));
        const hit = p01(t, 3.08, 0.5);
        const ph = photo('etty', { fx: HOOK_FX, fy: HOOK_FY, zoom, dim: 0.3 + hit * 0.12 });
        const sh = shake(t, 3.1, 26, 0.5);
        const [hx, hy] = ph.at(HEAD[0], HEAD[1]);
        const hk = 1 - p01(t, 1.15, 0.35);
        const br = p01(t, 0.25, 0.6) * (1 - p01(t, 3.0, 0.2));
        return `<g transform="translate(${sh.x} ${sh.y})">
          ${ph.svg}${vignette()}
          ${scan(t, hx - 310, hy - 300, 520, 560, 0.25, 1.4, br)}
          ${brackets(hx - 50, hy - 20, 520, 560, br)}
          ${slashes(t, 3.08)}
          ${hook(hk, t)}
        </g>`;
      },
    },
    {
      // 2 — species name + height ruler on a specimen card (full-body Mt Hypipamee bird)
      id: 'height',
      start: 4.3,
      end: 7.7 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 4.3, X));
        const bg = photo('portrait', { zoom: 1.12, filter: 'fBlur', dim: 0.55 });
        const cin = easeOutBack(p01(t, 4.3, 0.55));
        const cx = 150;
        const cy = 250;
        const cw = 600;
        const ch = 900;
        const rot = lerp(7, -1.2, cin);
        const card = boxImage('portrait', cx, cy, cw, ch, { zoom: lerp(1.0, 1.05, p01(t, 4.3, 3.7)), fy: 0.5, id: 'cardP' });
        // casque top ≈ v 0.085, feet ≈ v 0.945 on this still
        const yTop = card.at(0, 0.085)[1];
        const yGround = card.at(0, 0.945)[1];
        const rp = p01(t, 5.98, 1.0);
        const guide = clamp((rp - 0.8) / 0.2, 0, 1);
        return `<g opacity="${fi}">
          ${bg.svg}${vignette()}
          <g transform="translate(${cx + cw / 2} ${cy + ch / 2 + (1 - cin) * 120}) rotate(${rot}) translate(${-(cx + cw / 2)} ${-(cy + ch / 2)})">
            <rect x="${cx - 14}" y="${cy - 14}" width="${cw + 28}" height="${ch + 28}" rx="6" fill="${PAPER}" filter="url(#fShadow)"/>
            ${card.svg}
            <line x1="${cx}" y1="${yTop}" x2="${cx + cw + 110}" y2="${yTop}" stroke="${YELLOW}" stroke-width="4" stroke-dasharray="14 10" opacity="${guide}"/>
            <line x1="${cx}" y1="${yGround}" x2="${cx + cw + 110}" y2="${yGround}" stroke="#fff" stroke-width="4" stroke-dasharray="14 10" opacity="${clamp(rp * 4, 0, 1) * 0.8}"/>
            ${ruler(cx + cw + 110, yGround, yTop, rp, t)}
          </g>
          ${label('CASSOWARY', 70, 168, p01(t, 4.54, 0.55), { size: 56 })}
          ${label('~2 m', 720, yTop - 70, p01(t, 6.76, 0.5), { size: 50 })}
        </g>`;
      },
    },
    {
      // 3 — speed / jump / swim on a wide frame of the Kuranda bird
      id: 'speed',
      start: 7.7,
      end: 11.62 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 7.7, 0.22));
        const bg = photo('kuranda', { fx: 0.6, zoom: 1.05, filter: 'fBlur', dim: 0.6 });
        const fy0 = 330;
        const fh = 792;
        const slide = easeOutCubic(p01(t, 7.7, 0.45));
        const pan = lerp(-40, 40, p01(t, 7.7, 4.2));
        const fr = boxImage('kuranda', 0, fy0, W, fh, { zoom: 1.12, fx: 0.52, dx: pan, id: 'wideK' });
        const sp = p01(t, 8.4, 0.5);
        const n = Math.round(50 * easeOutCubic(sp));
        const run = p01(t, 7.95, 0.4) * (1 - p01(t, 10.0, 0.5));
        let streaks = '';
        for (let i = 0; i < 22; i++) {
          const y = fy0 + 40 + rnd(i * 3) * (fh - 80);
          const len = 120 + rnd(i * 5) * 320;
          const spd = 1800 + rnd(i * 7) * 1400;
          const x = W + 200 - ((t * spd + rnd(i * 11) * 1600) % (W + 700));
          streaks += `<line x1="${x}" y1="${y}" x2="${x + len}" y2="${y}" stroke="#fff" stroke-opacity="${0.18 + rnd(i) * 0.3}" stroke-width="${2 + rnd(i * 13) * 5}" stroke-linecap="round"/>`;
        }
        return `<g opacity="${fi}">
          ${bg.svg}
          <g transform="translate(${(1 - slide) * 700} 0)">
            <rect x="0" y="${fy0 - 10}" width="${W}" height="${fh + 20}" fill="${PAPER}" filter="url(#fShadow)"/>
            ${fr.svg}
            <rect x="0" y="${fy0}" width="${W}" height="${fh}" fill="rgba(0,0,0,0.12)"/>
            <g opacity="${run}">${streaks}</g>
          </g>
          ${sp > 0 ? `<g transform="translate(70 ${250 - (1 - easeOutBack(clamp(sp / 0.4, 0, 1))) * 60})" opacity="${clamp(sp * 3, 0, 1)}" filter="url(#fShadow)">
              <text x="0" y="0" font-family="${DISPLAY}" font-weight="900" font-size="170" fill="${YELLOW}" stroke="${INK}" stroke-width="12" paint-order="stroke" font-style="italic">~${n}</text>
              <text x="${n >= 10 ? 378 : 262}" y="0" font-family="${DISPLAY}" font-weight="900" font-size="72" fill="#fff" stroke="${INK}" stroke-width="9" paint-order="stroke" font-style="italic">km/h</text>
              <rect x="6" y="26" width="${560 * easeOutCubic(sp)}" height="12" rx="6" fill="${RED}"/>
            </g>` : ''}
          ${iconBadge('jump', 170, 1010, p01(t, 10.14, 0.6), t, 10.14)}
          ${iconBadge('swim', 370, 1010, p01(t, 10.98, 0.6), t, 10.98)}
        </g>`;
      },
    },
    {
      // 4 — the claw: lens on the foot, dagger outline, >10 cm measure. No blood, ever.
      id: 'claw',
      start: 11.62,
      end: 16.3 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 11.62, X));
        const zoom = lerp(1.02, 1.2, easeInOutCubic(p01(t, 11.62, 4.8)));
        const ph = photo('claw', { fx: 0.66, fy: 0.62, zoom, dim: 0.42, tint: 'rgba(90,20,10,0.16)' });
        const lp = p01(t, 12.5, 0.8);
        const dp = p01(t, 13.1, 0.9);
        const mp = p01(t, 14.6, 0.9);
        const sh = shake(t, 13.95, 12, 0.35);
        return `<g opacity="${fi}" transform="translate(${sh.x} ${sh.y})">
          ${ph.svg}${vignette()}
          ${lens('claw', 350, 560, 260, 0.64, 0.8, 1.35, lp, { id: 'lnClaw', ring: RED, filter: 'fBright' })}
          ${dagger(800, 250, 600, dp, t, 13.9)}
          ${measure(690, 400, 850, mp, '>10 cm')}
        </g>`;
      },
    },
    {
      // 5 — 1926, Queensland. Period print (era/region proxy), stamp, tracks, map pin. No victim, no wound.
      id: 'y1926',
      start: 16.3,
      end: 26.35 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 16.3, X));
        const drain = p01(t, 21.0, 1.6);
        const bg = photo('cook', { zoom: 1.1, filter: 'fBlurSepia', dim: 0.62 + drain * 0.15 });
        const cin = easeOutBack(p01(t, 16.3, 0.6));
        const px = 90;
        const py = 250;
        const pw = 900;
        const pht = 514;
        const pr = boxImage('cook', px, py, pw, pht, { zoom: lerp(1.0, 1.12, p01(t, 16.3, 10)), fx: 0.45, fy: 0.55, filter: 'fSepia', id: 'cookP', dim: 0.05 + drain * 0.32 });
        const trackPts = [
          [0.2, 0.97], [0.27, 0.93], [0.29, 0.88], [0.35, 0.85], [0.36, 0.8], [0.41, 0.78], [0.42, 0.74], [0.46, 0.72],
        ];
        let tracks = '';
        trackPts.forEach(([u, v], i) => {
          const [tx, ty] = pr.at(u, v);
          const op = p01(t, 20.9 + i * 0.2, 0.18) * (1 - p01(t, 25.6, 0.6));
          tracks += track(tx, ty, 58 + (i % 2 ? 8 : -8), lerp(0.95, 0.55, i / 7), op);
        });
        const sh = shake(t, 16.6, 18, 0.4);
        return `<g opacity="${fi}">
          ${bg.svg}${vignette()}
          <g transform="translate(${sh.x} ${sh.y})">
            <g transform="translate(540 ${py + pht / 2 + (1 - cin) * 160}) rotate(${lerp(5, -1.5, cin)}) translate(-540 ${-(py + pht / 2)})">
              <rect x="${px - 18}" y="${py - 18}" width="${pw + 36}" height="${pht + 36}" fill="${PAPER}" filter="url(#fShadow)"/>
              ${pr.svg}
              <g clip-path="url(#cookP)">${tracks}</g>
              <rect x="${px + 30}" y="${py - 36}" width="150" height="46" fill="rgba(240,230,200,0.75)" transform="rotate(-6 ${px + 105} ${py - 13})"/>
              <rect x="${px + pw - 180}" y="${py - 36}" width="150" height="46" fill="rgba(240,230,200,0.75)" transform="rotate(5 ${px + pw - 105} ${py - 13})"/>
              ${stamp('1926', px + pw - 190, py + pht - 90, p01(t, 16.58, 0.9), { size: 104, rot: -9 })}
            </g>
          </g>
          ${label('QUEENSLAND', 70, 880, p01(t, 18.84, 0.6), { size: 50 })}
          ${mapInset(590, 830, 350, 350, p01(t, 22.95, 1.6), t)}
        </g>`;
      },
    },
    {
      // 6 — the twist: warm grade, soft pull-back, foliage closes in (shy)
      id: 'shy',
      start: 26.35,
      end: 29.9 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 26.35, 0.4));
        const zoom = lerp(1.2, 1.04, easeInOutCubic(p01(t, 26.35, 3.6)));
        const ph = photo('rain', { fx: 0.5, fy: 0.45, zoom, dim: 0.26 });
        const warm = p01(t, 26.4, 1.2);
        const fol = p01(t, 28.7, 1.0);
        const rays = [0, 1, 2, 3]
          .map((i) => {
            const a = -0.9 + i * 0.13 + Math.sin(t * 0.6 + i) * 0.02;
            return `<path d="M${W + 40} -60 L${W + 40 + Math.cos(Math.PI / 2 + a) * 2400 - 70} ${Math.sin(Math.PI / 2 + a) * 2400} L${W + 40 + Math.cos(Math.PI / 2 + a) * 2400 + 70} ${Math.sin(Math.PI / 2 + a) * 2400}Z"
              fill="#ffe2a8" opacity="${0.06 * warm}"/>`;
          })
          .join('');
        return `<g opacity="${fi}">
          ${ph.svg}
          <rect width="${W}" height="${H}" fill="url(#gWarm)" opacity="${warm}"/>
          <rect width="${W}" height="${H}" fill="rgba(255,170,70,${0.08 * warm})"/>
          ${rays}
          ${vignette()}
          ${foliage('L', fol, t)}${foliage('R', fol * 0.8, t)}
          ${label('SHY', 70, 200, p01(t, 29.06, 0.5), { size: 56, bg: '#fff3d6' })}
        </g>`;
      },
    },
    {
      // 7 — rainforest gardener: seeds lens → seed arcs → sprouts across the canopy
      id: 'garden',
      start: 29.9,
      end: 35.2 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 29.9, X));
        const zoom = lerp(1.04, 1.16, p01(t, 29.9, 5.6));
        const ph = photo('canopy', { fx: 0.5, fy: 0.45, zoom, dim: 0.42, tint: 'rgba(40,90,20,0.12)' });
        const lp = p01(t, 30.15, 0.8);
        const lx = 330;
        const ly = 470;
        let seeds = '';
        let sprouts = '';
        for (let i = 0; i < 14; i++) {
          const f = seedFlight(t, i, lx + (rnd(i * 3) - 0.5) * 120, ly + 60 + (rnd(i * 5) - 0.5) * 80, 31.6 + i * 0.12);
          seeds += f.seed;
          sprouts += f.sprout;
        }
        const lensOut = 1 - p01(t, 34.4, 0.5) * 0.25;
        return `<g opacity="${fi}">
          ${ph.svg}
          <rect width="${W}" height="${H}" fill="url(#gWarm)" opacity="${0.55 * (1 - p01(t, 29.9, 2))}"/>
          ${vignette()}
          ${sprouts}
          <g opacity="${lensOut}">${lens('seeds', lx, ly, 230, 0.52, 0.52, 0.62, lp, { id: 'lnSeed', ring: LEAF })}</g>
          ${seeds}
          ${label('SEED DISPERSAL', 70, 820, p01(t, 31.6, 0.6), { size: 48, bg: LEAF, accent: '#2d5a17' })}
        </g>`;
      },
    },
    {
      // 8 — loop: respect beat, framing returns to frame 1, hook re-forms after the last word
      id: 'loop',
      start: 35.2,
      end: 39.408 + 0.1,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 35.2, 0.35));
        const zoom = lerp(Z0 + 0.2, Z0, easeInOutCubic(p01(t, 35.2, 3.75)));
        const ph = photo('etty', { fx: HOOK_FX, fy: HOOK_FY, zoom, dim: 0.3 });
        const [hx, hy] = ph.at(HEAD[0], HEAD[1]);
        const warm = 1 - p01(t, 36.6, 1.8);
        const br = p01(t, 35.5, 0.6) * (1 - p01(t, 38.55, 0.35));
        const hk = p01(t, 39.03, 0.2);
        const sh = shake(t, 39.03, 12, 0.3);
        return `<g opacity="${fi}" transform="translate(${sh.x} ${sh.y})">
          ${ph.svg}
          <rect width="${W}" height="${H}" fill="url(#gWarm)" opacity="${0.6 * warm}"/>
          ${vignette()}
          ${scan(t, hx - 310, hy - 300, 520, 560, 36.46, 1.4, br)}
          ${brackets(hx - 50, hy - 20, 520, 560, br)}
          ${hook(hk, t)}
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
    duration: 39.408,
    fps: 30,
    images: Object.fromEntries(Object.entries(IMG).map(([k, v]) => [k, v[0]])),
    words: [],
    scenes,
  };
})();
