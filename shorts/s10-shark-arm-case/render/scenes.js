/* s10 — The Shark Arm Case (fast Atlas rebuild)
 * Photo underlay + SVG motion graphics. SVG + renderFrame(t) only (no Remotion).
 * Beat times come from transcript.json (faster-whisper word timings on audio/vo.mp3).
 * On-screen text: frame-1 hook + names / places / facts / prop text only. No gore.
 * Caption band (~70%, y≈1230–1450) and the right edge are kept clear of graphics.
 */
(function () {
  const HS = window.HS;
  const { W, H, clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic, easeOutElastic } = HS;

  const IMG = {
    coogee: ['/img/s10_01_coogee_pier_1929.jpg', 3000, 2198],
    shark: ['/img/s10_02_tiger_shark.jpg', 2303, 1708],
    boxers: ['/img/s10_03_two_boxers.jpg', 3200, 2319],
    police: ['/img/s10_04_police_court_sydney.jpg', 3648, 2736],
    quay: ['/img/s10_05_circular_quay_1930.jpg', 1150, 1600],
    sedan: ['/img/s10_06_1935_sedan.jpg', 1600, 1356],
    court: ['/img/s10_07_darlinghurst_court.jpg', 2300, 1307],
    shark2: ['/img/s10_08_tiger_shark_loop.jpg', 2861, 1896],
  };

  const DISPLAY = `'DejaVu Sans', 'Liberation Sans', sans-serif`;
  const MONO = `'DejaVu Sans Mono', 'Liberation Mono', monospace`;
  const YELLOW = '#ffcc33';
  const RED = '#e8322b';
  const INK = '#1b1b1f';
  const PAPER = '#efe4c8';

  // ---------- helpers ----------
  const p01 = (t, t0, d) => clamp((t - t0) / d, 0, 1);
  const rnd = (i) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fadeInOut = (t, a, b, fi = 0.25, fo = 0.25) => Math.min(p01(t, a, fi), 1 - p01(t, b - fo, fo));

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
      x, y, w, h, s,
      svg: `<image href="${url}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"${filt}/>
        ${o.tint ? `<rect width="${W}" height="${H}" fill="${o.tint}"/>` : ''}
        <rect width="${W}" height="${H}" fill="rgba(0,0,0,${o.dim != null ? o.dim : 0.45})"/>`,
      // map image-relative coords (0..1) to screen
      at: (u, v) => [x + u * w, y + v * h],
    };
  }

  const DEFS = `
    <defs>
      <filter id="fSepia" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.39 0.77 0.19 0 0  0.35 0.69 0.17 0 0  0.27 0.53 0.13 0 0  0 0 0 1 0"/>
      </filter>
      <filter id="fMono" color-interpolation-filters="sRGB">
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncR type="linear" slope="1.15" intercept="-0.04"/><feFuncG type="linear" slope="1.12" intercept="-0.04"/><feFuncB type="linear" slope="1.1" intercept="-0.02"/></feComponentTransfer>
      </filter>
      <filter id="fCool" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.25 0.45 0.1 0 0  0.25 0.5 0.15 0 0.02  0.3 0.55 0.3 0 0.08  0 0 0 1 0"/>
      </filter>
      <filter id="fNight" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.2 0.35 0.08 0 0  0.18 0.4 0.12 0 0.01  0.25 0.45 0.35 0 0.07  0 0 0 1 0"/>
      </filter>
      <filter id="fInk" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.1 0.2 0.05 0 0.02  0.2 0.4 0.1 0 0.1  0.3 0.5 0.15 0 0.2  0 0 0 1 0"/>
      </filter>
      <filter id="fBlur" x="-5%" y="-5%" width="110%" height="110%">
        <feColorMatrix type="saturate" values="0.2"/>
        <feGaussianBlur stdDeviation="9"/>
      </filter>
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
        <stop offset="0" stop-color="#000" stop-opacity="0.7"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="gWater" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#7fd3ff" stop-opacity="0.18"/>
        <stop offset="1" stop-color="#0a3a5a" stop-opacity="0.0"/>
      </linearGradient>
      <linearGradient id="gSteel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f4f6f8"/><stop offset="0.5" stop-color="#9aa3ab"/><stop offset="1" stop-color="#e3e7ea"/>
      </linearGradient>
    </defs>`;

  const vignette = () =>
    `<rect width="${W}" height="${H}" fill="url(#gVig)"/><rect width="${W}" height="520" fill="url(#gTop)"/>`;

  // ---------- reusable motion-graphic parts ----------

  /** Kinetic label: yellow bar wipes in, text rises. Anchored at left x. */
  function label(text, x, y, p, o = {}) {
    if (p <= 0) return '';
    const size = o.size || 46;
    const padX = 26;
    const w = o.w || text.length * (size * 0.74 + 2) + padX * 2 + 8;
    const h = size + 30;
    const bar = easeOutCubic(clamp(p / 0.6, 0, 1));
    const tp = easeOutCubic(clamp((p - 0.25) / 0.75, 0, 1));
    const bg = o.bg || YELLOW;
    const fg = o.fg || INK;
    const cid = 'lc' + Math.round(x) + '_' + Math.round(y);
    return `
      <g opacity="${o.opacity != null ? o.opacity : 1}" filter="url(#fShadow)">
        <clipPath id="${cid}"><rect x="${x}" y="${y - h / 2}" width="${w * bar}" height="${h}"/></clipPath>
        <rect x="${x}" y="${y - h / 2}" width="${w * bar}" height="${h}" rx="6" fill="${bg}"/>
        <rect x="${x}" y="${y - h / 2}" width="10" height="${h}" fill="${o.accent || RED}"/>
        <g clip-path="url(#${cid})">
          <text x="${x + padX + 4}" y="${y + size * 0.36 + (1 - tp) * 40}" font-family="${DISPLAY}" font-weight="900"
            font-size="${size}" fill="${fg}" letter-spacing="2">${esc(text)}</text>
        </g>
      </g>`;
  }

  /** Rubber stamp slam. */
  function stamp(text, cx, cy, p, o = {}) {
    if (p <= 0) return '';
    const size = o.size || 110;
    const color = o.color || RED;
    const rot = o.rot != null ? o.rot : -8;
    const k = clamp(p / 0.35, 0, 1);
    const sc = lerp(2.4, 1, easeOutCubic(k));
    const op = clamp(k * 1.6, 0, 1) * (o.opacity != null ? o.opacity : 1);
    const w = o.w || text.length * size * 0.7 + 70;
    const h = size + 50;
    return `
      <g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${sc})" opacity="${op}" filter="url(#fStamp)">
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="14" fill="none" stroke="${color}" stroke-width="12"/>
        <rect x="${-w / 2 + 16}" y="${-h / 2 + 16}" width="${w - 32}" height="${h - 32}" rx="8" fill="none" stroke="${color}" stroke-width="4"/>
        <text x="0" y="${size * 0.36}" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="${size}"
          fill="${color}" letter-spacing="4">${esc(text)}</text>
      </g>`;
  }

  /** Map pin drop with ripple. */
  function pin(x, y, p, text) {
    if (p <= 0) return '';
    const d = easeOutBounce(clamp(p / 0.5, 0, 1));
    const py = lerp(y - 260, y, d);
    const rip = clamp((p - 0.4) / 0.8, 0, 1);
    const lab = text ? label(text, x + 50, y - 130, clamp((p - 0.35) / 0.6, 0, 1), { size: 40 }) : '';
    return `
      <ellipse cx="${x}" cy="${y}" rx="${30 + rip * 90}" ry="${10 + rip * 30}" fill="none" stroke="${YELLOW}" stroke-width="4" opacity="${(1 - rip) * 0.9}"/>
      <ellipse cx="${x}" cy="${y}" rx="22" ry="8" fill="rgba(0,0,0,0.5)"/>
      <g transform="translate(${x} ${py})" filter="url(#fShadow)">
        <path d="M0 0 C-10 -30 -46 -58 -46 -96 A46 46 0 1 1 46 -96 C46 -58 10 -30 0 0Z" fill="${RED}" stroke="#fff" stroke-width="5"/>
        <circle cx="0" cy="-96" r="17" fill="#fff"/>
      </g>
      ${lab}`;
  }
  function easeOutBounce(x) {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (x < 1 / d1) return n1 * x * x;
    if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
    if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }

  /** Rising aquarium bubbles in a region. */
  function bubbles(t, n, rx, ry, rw, rh, seed = 1, alpha = 0.55) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const sp = 60 + rnd(seed + i * 3) * 140;
      const r = 4 + rnd(seed + i * 7) * 12;
      const y = ry + rh - ((t * sp + rnd(seed + i * 11) * rh) % rh);
      const x = rx + rnd(seed + i * 5) * rw + Math.sin(t * 2.2 + i) * 10;
      const fade = clamp((y - ry) / 120, 0, 1);
      s += `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(200,240,255,0.08)" stroke="rgba(220,245,255,${alpha * fade})" stroke-width="2.5"/>
            <circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.22}" fill="rgba(255,255,255,${0.7 * fade})"/>`;
    }
    return s;
  }

  /** Bubble burst radiating from a point (the "threw up" hit). */
  function burst(t, t0, cx, cy, n = 44, spread = 1) {
    const k = p01(t, t0, 1.6);
    if (k <= 0 || k >= 1) return '';
    let s = '';
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI * (0.05 + rnd(i * 13) * 0.9) * spread - 0.2;
      const dist = easeOutCubic(k) * (140 + rnd(i * 17) * 380);
      const x = cx + Math.cos(ang) * dist;
      const y = cy + Math.sin(ang) * dist - k * k * 160;
      const r = 5 + rnd(i * 19) * 16;
      s += `<circle cx="${x}" cy="${y}" r="${r * (0.6 + k * 0.6)}" fill="rgba(200,240,255,0.12)" stroke="rgba(230,250,255,${(1 - k) * 0.9})" stroke-width="3"/>`;
    }
    // shock ring
    const rr = easeOutCubic(clamp(k * 2, 0, 1));
    s += `<circle cx="${cx}" cy="${cy}" r="${40 + rr * 320}" fill="none" stroke="rgba(255,255,255,${(1 - rr) * 0.8})" stroke-width="${10 * (1 - rr) + 1}"/>`;
    return s;
  }

  /** Crowd silhouettes along the bottom of the graphics zone, with 1930s flashbulbs. */
  function crowd(t, p, baseY) {
    if (p <= 0) return '';
    const rise = easeOutCubic(p);
    let s = `<g transform="translate(0 ${(1 - rise) * 260})">`;
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 9; i++) {
        const x = 30 + i * 118 + row * 58 + rnd(i + row * 40) * 20;
        const hy = baseY + row * 60 - rnd(i * 3 + row) * 30 + Math.sin(t * 3 + i) * 3;
        const hat = rnd(i * 9 + row) > 0.45;
        const c = row === 0 ? '#07121a' : '#030809';
        s += `<g fill="${c}">
            <circle cx="${x}" cy="${hy}" r="36"/>
            ${hat ? `<rect x="${x - 50}" y="${hy - 30}" width="100" height="10" rx="5"/><rect x="${x - 32}" y="${hy - 64}" width="64" height="38" rx="10"/>` : ''}
            <path d="M${x - 78} ${hy + 160} Q${x - 70} ${hy + 44} ${x} ${hy + 40} Q${x + 70} ${hy + 44} ${x + 78} ${hy + 160}Z"/>
          </g>`;
      }
    }
    s += '</g>';
    // flashbulbs
    const flashes = [5.2, 5.55, 5.9, 36.0, 36.4];
    for (let i = 0; i < flashes.length; i++) {
      const k = p01(t, flashes[i], 0.35);
      if (k > 0 && k < 1) {
        const x = 150 + rnd(i * 23) * 700;
        const y = baseY - 30 + rnd(i * 29) * 40;
        s += `<circle cx="${x}" cy="${y}" r="${30 + k * 90}" fill="rgba(255,255,240,${(1 - k) * 0.9})" filter="url(#fGlow)"/>
              <rect width="${W}" height="${H}" fill="rgba(255,255,255,${(1 - k) * 0.12})"/>`;
      }
    }
    return s;
  }

  /** Corner lock-on brackets. */
  function brackets(cx, cy, w, h, p, color = YELLOW) {
    if (p <= 0) return '';
    const k = easeOutBack(clamp(p / 0.5, 0, 1));
    const ww = lerp(w * 1.6, w, k) / 2;
    const hh = lerp(h * 1.6, h, k) / 2;
    const L = 60;
    const op = clamp(p * 3, 0, 1);
    const c = (sx, sy) =>
      `<path d="M${cx + sx * ww} ${cy + sy * hh - sy * L} L${cx + sx * ww} ${cy + sy * hh} L${cx + sx * ww - sx * L} ${cy + sy * hh}"
        fill="none" stroke="${color}" stroke-width="8" stroke-linecap="square"/>`;
    return `<g opacity="${op}">${c(-1, -1)}${c(1, -1)}${c(-1, 1)}${c(1, 1)}</g>`;
  }

  /** Aquarium glass frame (tank edge + glare streaks). */
  function tankGlass(t, p) {
    if (p <= 0) return '';
    const op = clamp(p * 2, 0, 1);
    const g = ((t * 0.25) % 1) * 1400 - 300;
    return `<g opacity="${op}">
      <rect x="28" y="130" width="${W - 56}" height="1050" rx="26" fill="url(#gWater)" stroke="rgba(190,235,255,0.55)" stroke-width="6"/>
      <path d="M${g} 130 L${g + 90} 130 L${g - 160} 1180 L${g - 250} 1180Z" fill="rgba(255,255,255,0.06)"/>
      <path d="M${g + 140} 130 L${g + 170} 130 L${g - 80} 1180 L${g - 110} 1180Z" fill="rgba(255,255,255,0.05)"/>
      <path d="M28 ${190 + Math.sin(t * 2) * 6} Q 290 ${170 + Math.sin(t * 2 + 1) * 10} 540 ${190} T ${W - 28} ${188 + Math.sin(t * 2 + 2) * 6}"
        fill="none" stroke="rgba(220,245,255,0.5)" stroke-width="4"/>
    </g>`;
  }

  /** Numbered evidence tent marker. */
  function evidenceMarker(n, x, y, p) {
    if (p <= 0) return '';
    const k = easeOutBack(clamp(p / 0.4, 0, 1));
    return `<g transform="translate(${x} ${y}) scale(${k})" filter="url(#fShadow)">
      <path d="M-70 60 L-44 -70 L44 -70 L70 60Z" fill="${YELLOW}" stroke="${INK}" stroke-width="5"/>
      <path d="M-44 -70 L44 -70 L50 -40 L-50 -40Z" fill="rgba(0,0,0,0.12)"/>
      <text x="0" y="40" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="96" fill="${INK}">${n}</text>
    </g>`;
  }

  /** Magnifying glass with a zoomed view of the underlay inside the lens. */
  function magnifier(ph, key, cx, cy, r, zoom, filter) {
    const [url] = IMG[key];
    const w = ph.w * zoom;
    const h = ph.h * zoom;
    // keep the lens content centred on the same image point
    const u = (cx - ph.x) / ph.w;
    const v = (cy - ph.y) / ph.h;
    const x = cx - u * w;
    const y = cy - v * h;
    const id = 'mag' + Math.round(cx);
    return `
      <clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
      <g clip-path="url(#${id})">
        <image href="${url}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none" ${filter ? `filter="url(#${filter})"` : ''}/>
        <rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" fill="rgba(0,0,0,0.1)"/>
        <path d="M${cx - r * 0.7} ${cy - r * 0.2} A ${r * 0.75} ${r * 0.75} 0 0 1 ${cx - r * 0.1} ${cy - r * 0.72}" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="14" stroke-linecap="round"/>
      </g>
      <g filter="url(#fShadow)">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#2a2a2e" stroke-width="26"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#c9a458" stroke-width="10"/>
        <line x1="${cx + r * 0.72}" y1="${cy + r * 0.72}" x2="${cx + r * 1.35}" y2="${cy + r * 1.35}" stroke="#3b2414" stroke-width="44" stroke-linecap="round"/>
      </g>`;
  }

  /** Silhouette head & shoulders (never a real likeness). */
  function silhouette(cx, cy, s, fill) {
    return `<g transform="translate(${cx} ${cy}) scale(${s})" fill="${fill}">
      <circle cx="0" cy="-40" r="62"/>
      <path d="M-120 120 Q-112 20 0 18 Q112 20 120 120Z"/>
    </g>`;
  }

  /** Typewriter reveal. */
  function typed(text, x, y, p, o = {}) {
    if (p <= 0) return '';
    const n = Math.floor(text.length * clamp(p, 0, 1));
    const cursor = p < 1 && Math.floor(p * 20) % 2 === 0 ? '▌' : '';
    return `<text x="${x}" y="${y}" font-family="${MONO}" font-weight="700" font-size="${o.size || 44}"
      fill="${o.fill || INK}" ${o.anchor ? `text-anchor="${o.anchor}"` : ''} letter-spacing="${o.ls || 2}">${esc(text.slice(0, n))}${cursor}</text>`;
  }

  /** Two-glove tattoo medallion (tattoo-flash style frame around a crop of the boxers still). */
  function tattooRing(cx, cy, r, p, t, ph) {
    if (p <= 0) return '';
    const k = easeOutCubic(clamp(p / 0.7, 0, 1));
    const circ = 2 * Math.PI * r;
    const id = 'tat' + Math.round(cx) + Math.round(r);
    let inner = '';
    if (ph) {
      const [url] = IMG.boxers;
      inner = `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r - 8}"/></clipPath>
        <g clip-path="url(#${id})" opacity="${k}">
          <image href="${url}" x="${ph.x}" y="${ph.y}" width="${ph.w}" height="${ph.h}" preserveAspectRatio="none" filter="url(#fInk)"/>
          <rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" fill="rgba(20,60,90,0.25)"/>
        </g>`;
    }
    const stars = [0, 1, 2, 3, 4, 5, 6, 7]
      .map((i) => {
        const a = (i / 8) * Math.PI * 2 + t * 0.15;
        const sx = cx + Math.cos(a) * (r + 44);
        const sy = cy + Math.sin(a) * (r + 44);
        return `<path transform="translate(${sx} ${sy}) scale(${k})" d="M0 -14 L4 -4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4 -4Z" fill="${YELLOW}"/>`;
      })
      .join('');
    return `${inner}
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1d5f7a" stroke-width="18"
        stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - k)}" transform="rotate(-90 ${cx} ${cy})"/>
      <circle cx="${cx}" cy="${cy}" r="${r + 16}" fill="none" stroke="${INK}" stroke-width="6"
        stroke-dasharray="${circ * 1.05}" stroke-dashoffset="${circ * 1.05 * (1 - k)}" transform="rotate(-90 ${cx} ${cy})"/>
      <circle cx="${cx}" cy="${cy}" r="${r - 16}" fill="none" stroke="${RED}" stroke-width="4" stroke-dasharray="14 12" opacity="${k}"/>
      ${stars}`;
  }

  /** Tattoo-flash ribbon banner. */
  function ribbon(text, cx, cy, p) {
    if (p <= 0) return '';
    const k = easeOutBack(clamp(p / 0.45, 0, 1));
    const w = 640;
    return `<g transform="translate(${cx} ${cy}) scale(${k} ${Math.min(1, k * 1.2)})" filter="url(#fShadow)">
      <path d="M${-w / 2 - 70} -20 L${-w / 2} -20 L${-w / 2} 60 L${-w / 2 - 70} 60 L${-w / 2 - 40} 20Z" fill="#9c1f1a"/>
      <path d="M${w / 2 + 70} -20 L${w / 2} -20 L${w / 2} 60 L${w / 2 + 70} 60 L${w / 2 + 40} 20Z" fill="#9c1f1a"/>
      <path d="M${-w / 2} -46 Q0 -76 ${w / 2} -46 L${w / 2} 40 Q0 10 ${-w / 2} 40Z" fill="${RED}" stroke="${INK}" stroke-width="6"/>
      <text x="0" y="10" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="62" fill="#fff"
        stroke="${INK}" stroke-width="3" paint-order="stroke" letter-spacing="4">${esc(text)}</text>
    </g>`;
  }

  /** Knife silhouette (steel icon only, no blood). */
  function knife(x, y, rot, s = 1) {
    return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" filter="url(#fShadow)">
      <path d="M0 -14 L230 -14 Q300 -10 330 14 L0 14Z" fill="url(#gSteel)" stroke="#5d656c" stroke-width="3"/>
      <rect x="-150" y="-20" width="150" height="40" rx="12" fill="#3b2414"/>
      <circle cx="-110" cy="0" r="6" fill="#c9a458"/><circle cx="-40" cy="0" r="6" fill="#c9a458"/>
      <rect x="-8" y="-26" width="14" height="52" rx="4" fill="#8d949a"/>
    </g>`;
  }

  /** Hook lock-up (frame 1 + loop end). */
  function hook(p, t) {
    if (p <= 0) return '';
    const pulse = 1 + Math.sin(t * 5) * 0.008;
    const op = clamp(p, 0, 1);
    return `<g opacity="${op}" transform="translate(540 380) scale(${pulse}) translate(-540 -380)">
      <g transform="translate(540 0) scale(0.9 1) translate(-540 0)" filter="url(#fShadow)">
        <text x="540" y="360" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="150"
          fill="#fff" stroke="${INK}" stroke-width="14" paint-order="stroke" letter-spacing="2">THROWN UP</text>
        <text x="540" y="520" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="150"
          fill="${YELLOW}" stroke="${INK}" stroke-width="14" paint-order="stroke" letter-spacing="2">BY A SHARK</text>
      </g>
      <rect x="170" y="552" width="740" height="12" rx="6" fill="${RED}"/>
    </g>`;
  }

  /** Year badge used on frame 1 and the loop end. */
  function yearBadge(p) {
    if (p <= 0) return '';
    const k = easeOutBack(clamp(p, 0, 1));
    return `<g transform="translate(96 700) scale(${k})" filter="url(#fShadow)">
      <rect x="0" y="-48" width="250" height="96" rx="14" fill="${INK}" stroke="${YELLOW}" stroke-width="5"/>
      <text x="125" y="26" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="68" fill="${YELLOW}" letter-spacing="4">1935</text>
    </g>`;
  }

  /** Small "present-day photo" provenance tag for modern stills. */
  const modernTag = (op = 1) =>
    `<g opacity="${op * 0.85}"><rect x="44" y="1160" width="300" height="44" rx="8" fill="rgba(0,0,0,0.55)"/>
      <text x="62" y="1190" font-family="${DISPLAY}" font-weight="700" font-size="24" fill="#d9e3ea" letter-spacing="2">PRESENT-DAY PHOTO</text></g>`;

  // ---------- scenes ----------
  const scenes = [
    {
      // 0 — Hook: Coogee, 1935
      id: 'hook',
      start: 0,
      end: 3.0,
      draw(t) {
        const ph = photo('coogee', { fx: 0.42, fy: 0.55, zoom: lerp(1.0, 1.1, easeInOutCubic(p01(t, 0, 3))), filter: 'fMono', dim: 0.42 });
        const sh = shake(t, 0, 16, 0.4);
        const hookOut = 1 - p01(t, 2.55, 0.35);
        const [px, py] = [380, 1010];
        return `<g transform="translate(${sh.x} ${sh.y})">
          ${ph.svg}${vignette()}
          ${bubbles(t, 16, 60, 620, 960, 600, 3, 0.4)}
          ${hook(hookOut, t)}
          ${yearBadge(1)}
          ${pin(px, py, p01(t, 2.3, 1.1), 'COOGEE · SYDNEY')}
        </g>`;
      },
    },
    {
      // 1 — shark throws up (no arm depicted) in front of a crowd
      id: 'shark',
      start: 3.0,
      end: 6.5,
      draw(t) {
        const punch = lerp(1.22, 1.0, easeOutCubic(p01(t, 3.0, 0.5))) + p01(t, 3.5, 3) * 0.06;
        const ph = photo('shark', { fx: 0.74, fy: 0.5, zoom: punch, dim: 0.28 });
        const sh = shake(t, 3.0, 30, 0.55);
        const [mx, my] = ph.at(0.88, 0.6); // mouth
        const [hx, hy] = ph.at(0.8, 0.55); // head
        return `<g transform="translate(${sh.x} ${sh.y})">
          ${ph.svg}${vignette()}
          ${tankGlass(t, p01(t, 3.0, 0.4))}
          ${bubbles(t, 18, 60, 200, 960, 900, 8, 0.45)}
          ${burst(t, 3.02, clamp(mx, 120, 900), clamp(my, 300, 1000))}
          ${brackets(clamp(hx, 300, 760), clamp(hy, 400, 900), 560, 420, p01(t, 3.3, 0.8))}
          ${label('TIGER SHARK', 96, 300, p01(t, 3.4, 0.7), { size: 54 })}
          ${modernTag(p01(t, 3.5, 0.4))}
          ${crowd(t, p01(t, 4.85, 0.6), 1010)}
        </g>`;
      },
    },
    {
      // 2 — Police noticed two things
      id: 'police',
      start: 6.5,
      end: 8.45,
      draw(t) {
        const ph = photo('police', { fx: 0.52, fy: 0.5, zoom: lerp(1.05, 1.14, p01(t, 6.5, 2)), filter: 'fCool', dim: 0.5 });
        const k = easeInOutCubic(p01(t, 6.5, 0.8));
        const mx = lerp(-200, 560, k);
        const my = lerp(460, 560, k);
        return `${ph.svg}${vignette()}
          ${magnifier(ph, 'police', mx, my, 190, 1.9, 'fCool')}
          ${evidenceMarker(1, 300, 1030, p01(t, 7.16, 0.5))}
          ${evidenceMarker(2, 720, 1030, p01(t, 7.54, 0.5))}
          ${label('SYDNEY POLICE', 96, 220, p01(t, 6.6, 0.6), { size: 44 })}`;
      },
    },
    {
      // 3 — the tattoo: two boxers
      id: 'tattoo',
      start: 8.45,
      end: 10.45,
      draw(t) {
        const ph = photo('boxers', { fx: 0.55, fy: 0.45, zoom: lerp(1.0, 1.08, p01(t, 8.45, 2)), filter: 'fMono', dim: 0.62 });
        const ring = p01(t, 8.55, 0.9);
        return `${ph.svg}${vignette()}
          ${tattooRing(540, 660, 360, ring, t, ph)}
          ${ribbon('TWO BOXERS', 540, 1110, p01(t, 9.3, 0.6))}`;
      },
    },
    {
      // 4 — not bitten: cut. With a knife. (forensic diagram only)
      id: 'forensic',
      start: 10.45,
      end: 15.3,
      draw(t) {
        const ph = photo('police', { fx: 0.78, fy: 0.45, zoom: lerp(1.15, 1.25, p01(t, 10.45, 5)), filter: 'fCool', dim: 0.62 });
        const card = easeOutCubic(p01(t, 10.45, 0.5));
        const cy0 = 260 + (1 - card) * 80;
        const L = 360; // column line length
        const colY = cy0 + 190;
        // left: jagged (bitten) line draws on
        const jag = p01(t, 11.78, 0.35);
        let jd = `M250 ${colY}`;
        const steps = 12;
        for (let i = 1; i <= steps; i++) {
          const yy = colY + (L * i) / steps;
          const xx = 250 + (i % 2 ? 44 : -44) * (0.6 + rnd(i) * 0.6);
          jd += ` L${xx} ${yy}`;
        }
        const jagLen = 1100;
        // right: straight clean line
        const cut = p01(t, 13.26, 0.3);
        const kn = p01(t, 14.4, 0.7);
        const knY = lerp(colY - 90, colY + L + 60, easeInOutCubic(kn));
        const glint = p01(t, 14.55, 0.4);
        const xP = p01(t, 12.08, 0.4);
        const okP = p01(t, 13.54, 0.4);
        return `${ph.svg}${vignette()}
          <g opacity="${card}" filter="url(#fShadow)">
            <rect x="90" y="${cy0}" width="900" height="${L + 330}" rx="22" fill="rgba(8,18,28,0.82)" stroke="rgba(160,220,255,0.5)" stroke-width="3"/>
            ${Array.from({ length: 17 }, (_, i) => `<line x1="${130 + i * 51}" y1="${cy0 + 24}" x2="${130 + i * 51}" y2="${cy0 + (i % 2 ? 40 : 54)}" stroke="rgba(160,220,255,0.6)" stroke-width="3"/>`).join('')}
            <line x1="540" y1="${cy0 + 90}" x2="540" y2="${cy0 + L + 290}" stroke="rgba(160,220,255,0.25)" stroke-width="2" stroke-dasharray="10 10"/>
          </g>
          <g opacity="${card}">
            <path d="${jd}" fill="none" stroke="#ffb199" stroke-width="10" stroke-linejoin="miter"
              stroke-dasharray="${jagLen}" stroke-dashoffset="${jagLen * (1 - jag)}" opacity="${jag > 0 ? 1 : 0}"/>
            <line x1="${760}" y1="${colY}" x2="${760}" y2="${colY + L * cut}" stroke="#bfefff" stroke-width="10" stroke-linecap="round" opacity="${cut > 0 ? 1 : 0}"/>
            ${label('BITTEN', 130, cy0 + L + 250, p01(t, 11.78, 0.5), { size: 40, bg: '#ffffff' })}
            ${label('CUT OFF', 580, cy0 + L + 250, p01(t, 13.3, 0.5), { size: 40 })}
          </g>
          ${xP > 0 ? `<g transform="translate(250 ${colY + L / 2}) scale(${easeOutBack(xP)})" opacity="${Math.min(1, xP * 3)}">
              <path d="M-90 -90 L90 90 M90 -90 L-90 90" stroke="${RED}" stroke-width="26" stroke-linecap="round" filter="url(#fShadow)"/></g>` : ''}
          ${okP > 0 ? `<g transform="translate(900 ${colY + 40}) scale(${easeOutBack(okP)})">
              <circle r="52" fill="#2fb36a" stroke="#fff" stroke-width="6"/>
              <path d="M-24 2 L-6 20 L26 -18" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></g>` : ''}
          ${kn > 0 && kn < 1 ? knife(760 - 12, knY, 90, 0.8) : ''}
          ${glint > 0 && glint < 1 ? `<path transform="translate(770 ${colY + L * 0.4}) scale(${Math.sin(glint * Math.PI) * 1.6})" d="M0 -40 L8 -8 L40 0 L8 8 L0 40 L-8 8 L-40 0 L-8 -8Z" fill="#fff" filter="url(#fGlow)"/>` : ''}`;
      },
    },
    {
      // 5 — tattoo matched missing ex-boxer James Smith
      id: 'missing',
      start: 15.3,
      end: 18.85,
      draw(t) {
        const ph = photo('boxers', { fx: 0.4, fy: 0.45, zoom: 1.2, filter: 'fBlur', dim: 0.55 });
        const drop = easeOutBack(p01(t, 15.3, 0.55));
        const rot = lerp(-12, -2.5, drop);
        const py = lerp(-900, 0, drop);
        const match = p01(t, 16.0, 0.6);
        // mini tattoo medallion flies into poster corner
        const mk = easeInOutCubic(match);
        const tx = lerp(1180, 760, mk);
        const ty = lerp(260, 520, mk);
        const miniPh = photo('boxers', { fx: 0.55, fy: 0.45, zoom: 1.0 });
        // shrink medallion: draw in its own transform (map 540,660 r360 → tx,ty r110)
        const s = 110 / 360;
        return `${ph.svg}${vignette()}
          <g transform="translate(0 ${py}) rotate(${rot} 540 700)" filter="url(#fShadow)">
            <rect x="170" y="200" width="700" height="980" rx="6" fill="${PAPER}"/>
            <rect x="170" y="200" width="700" height="980" rx="6" fill="none" stroke="rgba(90,60,20,0.35)" stroke-width="3"/>
            <circle cx="520" cy="228" r="16" fill="${RED}" stroke="#7a1512" stroke-width="3"/>
            <text x="520" y="350" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="112" fill="${INK}" letter-spacing="8">MISSING</text>
            <line x1="220" y1="380" x2="820" y2="380" stroke="${INK}" stroke-width="5"/>
            <rect x="330" y="420" width="380" height="420" fill="#d4c7a6" stroke="${INK}" stroke-width="4"/>
            ${silhouette(520, 700, 1.25, '#6d6250')}
            <text x="520" y="690" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="120" fill="${PAPER}" opacity="0.85">?</text>
            ${typed('EX-BOXER', 520, 930, p01(t, 16.8, 0.5), { anchor: 'middle', size: 46, fill: '#5a4a2a' })}
            ${typed('JAMES SMITH', 520, 1040, p01(t, 17.9, 0.55), { anchor: 'middle', size: 66 })}
            <line x1="240" y1="1080" x2="800" y2="1080" stroke="rgba(0,0,0,0.25)" stroke-width="3"/>
          </g>
          ${match > 0 ? `<g transform="translate(${tx} ${ty}) scale(${s}) translate(-540 -660)">${tattooRing(540, 660, 360, 1, t, miniPh)}</g>` : ''}
          ${match >= 1 ? `<g transform="translate(${tx + 96} ${ty + 96}) scale(${easeOutBack(p01(t, 16.6, 0.35))})">
              <circle r="40" fill="#2fb36a" stroke="#fff" stroke-width="5"/>
              <path d="M-18 2 L-4 16 L20 -14" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></g>` : ''}`;
      },
    },
    {
      // 6 — murder · shark as delivery · suspect arrested
      id: 'quay',
      start: 18.85,
      end: 24.2,
      draw(t) {
        const ph = photo('quay', { fx: 0.5, fy: 0.45, zoom: lerp(1.0, 1.12, p01(t, 18.85, 5.3)), filter: 'fSepia', dim: 0.45 });
        const sh = shake(t, 19.38, 26, 0.5);
        const murderOp = 1 - p01(t, 20.1, 0.3);
        // delivery route
        const route = 'M 70 1120 C 260 1150 300 900 480 930 S 760 820 800 700';
        const rLen = 1000;
        const rp = easeInOutCubic(p01(t, 20.5, 1.2));
        const routeOp = 1 - p01(t, 22.25, 0.3);
        // fin position along a sampled cubic approximation
        const fin = sampleRoute(rp);
        const box = p01(t, 21.7, 0.5);
        // mugshot
        const mug = easeOutCubic(p01(t, 22.5, 0.45));
        const cuff = p01(t, 23.36, 0.35);
        return `<g transform="translate(${sh.x} ${sh.y})">
          ${ph.svg}${vignette()}
          ${label('SYDNEY HARBOUR', 96, 1150, p01(t, 18.95, 0.6) * (1 - p01(t, 22.3, 0.3)), { size: 40 })}
          <g opacity="${murderOp}">${stamp('MURDER', 520, 560, p01(t, 19.38, 0.6), { size: 128, rot: -9 })}</g>
          <g opacity="${routeOp}">
            <path d="${route}" fill="none" stroke="${YELLOW}" stroke-width="8" stroke-dasharray="22 16"
              stroke-dashoffset="0" opacity="${rp > 0 ? 1 : 0}" style="clip-path: inset(0 ${(1 - rp) * 100}% 0 0)"/>
            ${rp > 0 && rp < 1 ? `<g transform="translate(${fin[0]} ${fin[1]})">
                <path d="M-40 0 Q-10 -8 0 -70 Q18 -20 44 0Z" fill="#2c3a44" stroke="#fff" stroke-width="4"/>
                <path d="M-80 6 Q-40 -4 0 6 Q40 16 80 6" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="4"/></g>` : ''}
            ${box > 0 ? `<g transform="translate(800 680) scale(${easeOutBack(clamp(box / 0.6, 0, 1))})" filter="url(#fShadow)">
                <path d="M-80 -40 L0 -80 L80 -40 L0 0Z" fill="#d9a55b" stroke="${INK}" stroke-width="5"/>
                <path d="M-80 -40 L0 0 L0 90 L-80 50Z" fill="#b8843f" stroke="${INK}" stroke-width="5"/>
                <path d="M80 -40 L0 0 L0 90 L80 50Z" fill="#c8944c" stroke="${INK}" stroke-width="5"/>
                <path d="M-40 -60 L40 -20 L40 70" fill="none" stroke="#f2e2b0" stroke-width="12"/></g>` : ''}
          </g>
          ${mug > 0 ? `<g transform="translate(0 ${(1 - mug) * -700})" filter="url(#fShadow)">
              <rect x="250" y="200" width="580" height="700" rx="10" fill="#1a1d22" stroke="#6b737c" stroke-width="4"/>
              ${Array.from({ length: 11 }, (_, i) => `<line x1="270" y1="${250 + i * 60}" x2="${i % 2 ? 330 : 360}" y2="${250 + i * 60}" stroke="#9aa3ab" stroke-width="3"/>
                <line x1="810" y1="${250 + i * 60}" x2="${i % 2 ? 750 : 720}" y2="${250 + i * 60}" stroke="#9aa3ab" stroke-width="3"/>`).join('')}
              ${silhouette(540, 560, 1.7, '#4a525b')}
              <rect x="360" y="760" width="360" height="110" rx="6" fill="#0c0e11" stroke="#9aa3ab" stroke-width="3"/>
              <text x="540" y="835" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="58" fill="#e8ecef" letter-spacing="10">1935</text>
            </g>` : ''}
          ${cuff > 0 ? handcuffs(540, 1030, cuff) : ''}
        </g>`;
      },
    },
    {
      // 7 — key witness found shot dead in his car (no body / wound; flatline only)
      id: 'witness',
      start: 24.2,
      end: 27.35,
      draw(t) {
        const ph = photo('sedan', { fx: 0.5, fy: 0.55, zoom: lerp(1.0, 1.1, p01(t, 24.2, 3.1)), filter: 'fNight', dim: 0.4 });
        const card = easeOutCubic(p01(t, 24.6, 0.45));
        const dead = p01(t, 25.66, 0.6);
        const flash = p01(t, 25.66, 0.3);
        // pulse line: beats, then flat
        let pl = 'M 300 760';
        for (let x = 0; x <= 480; x += 6) {
          const tt = t * 2.4 - x / 160;
          const beat = Math.exp(-Math.pow(((tt % 1) + 1) % 1 - 0.5, 2) * 260) * 60;
          const amp = 1 - dead;
          pl += ` L ${300 + x} ${760 - beat * amp * (Math.floor(tt) % 2 ? 1 : -0.4)}`;
        }
        const carBr = p01(t, 26.55, 0.6);
        const [cx, cy] = ph.at(0.5, 0.58);
        return `${ph.svg}${vignette()}
          ${modernTag(1 - p01(t, 26.9, 0.3))}
          <g opacity="${card}" transform="translate(0 ${(1 - card) * -120})" filter="url(#fShadow)">
            <rect x="250" y="250" width="580" height="580" rx="20" fill="rgba(10,14,20,0.86)" stroke="${lerpColor(dead)}" stroke-width="6"/>
            <circle cx="540" cy="470" r="170" fill="rgba(255,255,255,0.05)" stroke="${lerpColor(dead)}" stroke-width="6"/>
            ${silhouette(540, 500, 1.2, dead > 0 ? `rgba(120,128,136,${1 - dead * 0.5})` : '#8b95a0')}
            <path d="${pl}" fill="none" stroke="${dead > 0.5 ? '#9aa3ab' : '#43e08a'}" stroke-width="6" stroke-linejoin="round" filter="url(#fGlow)"/>
          </g>
          ${label('KEY WITNESS', 250, 190, p01(t, 24.84, 0.6), { size: 48 })}
          ${brackets(clamp(cx, 300, 780), clamp(cy, 700, 1080), 640, 300, carBr, '#ffffff')}
          ${flash > 0 && flash < 1 ? `<rect width="${W}" height="${H}" fill="rgba(255,255,255,${(1 - flash) * 0.45})"/>` : ''}`;
      },
    },
    {
      // 8 — suspect walked free; body never found (Darlinghurst Court)
      id: 'court',
      start: 27.35,
      end: 30.85,
      draw(t) {
        const ph = photo('court', { fx: 0.34, fy: 0.5, zoom: lerp(1.0, 1.08, p01(t, 27.35, 3.5)), dim: 0.45 });
        const file = easeOutCubic(p01(t, 27.4, 0.5));
        const acq = p01(t, 28.1, 0.6);
        const search = p01(t, 29.6, 1.3);
        return `${ph.svg}${vignette()}
          ${modernTag(1)}
          ${label('DARLINGHURST COURT', 44, 1100, p01(t, 27.5, 0.6), { size: 40 })}
          <g transform="translate(${(1 - file) * -900} 0) rotate(-2 540 560)" filter="url(#fShadow)">
            <path d="M150 250 L420 250 L450 210 L620 210 L650 250 L930 250 L930 880 L150 880Z" fill="#d8b778"/>
            <rect x="150" y="270" width="780" height="610" rx="4" fill="#e7cd92"/>
            <text x="190" y="340" font-family="${MONO}" font-weight="700" font-size="34" fill="#5a4320" letter-spacing="3">CASE FILE · 1935</text>
            <line x1="190" y1="365" x2="890" y2="365" stroke="#5a4320" stroke-width="3"/>
            ${typed('SUSPECT ..........', 190, 460, p01(t, 27.5, 0.5), { size: 40, fill: '#3c2c12' })}
            ${typed('BODY .............', 190, 690, p01(t, 29.16, 0.5), { size: 40, fill: '#3c2c12' })}
            ${typed('NOT FOUND', 190, 760, p01(t, 29.8, 0.4), { size: 56, fill: RED })}
          </g>
          ${stamp('ACQUITTED', 560, 550, acq, { size: 84, rot: -7, color: '#1f5fbf' })}
          ${search > 0 ? searchRings(760, 710, search) : ''}`;
      },
    },
    {
      // 9 — the only witness who saw the evidence… was a shark
      id: 'sole-witness',
      start: 30.85,
      end: 34.25,
      draw(t) {
        const ph = photo('shark2', { fx: 0.62, fy: 0.46, zoom: lerp(1.0, 1.12, easeInOutCubic(p01(t, 30.85, 3.4))), dim: 0.25 });
        const sh = shake(t, 33.35, 24, 0.5);
        const [ex, ey] = ph.at(0.54, 0.46); // eye
        const eyeX = clamp(ex, 200, 860);
        const eyeY = clamp(ey, 400, 1050);
        // spotlight iris closes on the shark as the line builds
        const iris = lerp(1400, 470, easeInOutCubic(p01(t, 31.2, 2.0)));
        const badge = p01(t, 33.3, 1.0);
        const swing = Math.sin((t - 33.3) * 7) * 16 * Math.exp(-(t - 33.3) * 2.2);
        const gl = p01(t, 33.45, 0.5);
        const mid = `iris${Math.round(t * 30)}`;
        return `<g transform="translate(${sh.x} ${sh.y})">
          ${ph.svg}
          <mask id="${mid}"><rect width="${W}" height="${H}" fill="#fff"/><circle cx="${eyeX + 40}" cy="${eyeY + 40}" r="${iris}" fill="#000"/></mask>
          <rect width="${W}" height="${H}" fill="rgba(0,0,0,0.7)" mask="url(#${mid})"/>
          ${vignette()}
          ${bubbles(t, 12, 60, 200, 900, 900, 21, 0.35)}
          ${modernTag(1)}
          ${gl > 0 && gl < 1 ? `<path transform="translate(${eyeX} ${eyeY}) scale(${Math.sin(gl * Math.PI) * 1.4})" d="M0 -46 L9 -9 L46 0 L9 9 L0 46 L-9 9 L-46 0 L-9 -9Z" fill="#fff" filter="url(#fGlow)"/>` : ''}
          ${badge > 0 ? `<g transform="translate(300 ${lerp(-300, 200, easeOutBack(clamp(badge / 0.5, 0, 1)))}) rotate(${swing})" filter="url(#fShadow)">
              <line x1="0" y1="-260" x2="0" y2="40" stroke="${RED}" stroke-width="10"/>
              <rect x="-24" y="30" width="48" height="30" rx="6" fill="#9aa3ab"/>
              <rect x="-190" y="56" width="380" height="250" rx="22" fill="#fff" stroke="${INK}" stroke-width="6"/>
              <rect x="-190" y="56" width="380" height="80" rx="22" fill="${RED}"/>
              <rect x="-190" y="110" width="380" height="26" fill="${RED}"/>
              <text x="0" y="112" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="46" fill="#fff" letter-spacing="4">SOLE</text>
              <text x="0" y="236" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="62" fill="${INK}" letter-spacing="3">WITNESS</text>
            </g>` : ''}
        </g>`;
      },
    },
    {
      // 10 — loop back to Coogee; ends frame-matched to frame 1
      id: 'loop',
      start: 34.25,
      end: 37.9,
      draw(t) {
        const zoom = lerp(1.12, 1.0, easeInOutCubic(p01(t, 34.25, 3.05)));
        const ph = photo('coogee', { fx: 0.42, fy: 0.55, zoom, filter: 'fMono', dim: 0.42 });
        const sh = shake(t, 37.3, 16, 0.4);
        const hk = p01(t, 37.3, 0.12);
        return `<g transform="translate(${sh.x} ${sh.y})">
          ${ph.svg}${vignette()}
          ${bubbles(t, 16, 60, 620, 960, 600, 3, 0.4)}
          ${crowd(t, p01(t, 35.6, 0.5) * (1 - p01(t, 37.0, 0.3)), 1010)}
          ${yearBadge(p01(t, 34.4, 0.4))}
          ${pin(380, 1010, p01(t, 35.35, 1.1) * (1 - p01(t, 37.1, 0.2)), 'COOGEE · SYDNEY')}
          ${hook(hk, t)}
        </g>`;
      },
    },
  ];

  // cubic path sampler for the delivery route (same control points as the SVG path)
  function sampleRoute(u) {
    const segs = [
      [[70, 1120], [260, 1150], [300, 900], [480, 930]],
      [[480, 930], [660, 960], [760, 820], [800, 700]],
    ];
    const s = u < 0.5 ? segs[0] : segs[1];
    const k = u < 0.5 ? u * 2 : (u - 0.5) * 2;
    const b = (a, b2, c, d) => Math.pow(1 - k, 3) * a + 3 * Math.pow(1 - k, 2) * k * b2 + 3 * (1 - k) * k * k * c + k * k * k * d;
    return [b(s[0][0], s[1][0], s[2][0], s[3][0]), b(s[0][1], s[1][1], s[2][1], s[3][1])];
  }

  function handcuffs(cx, cy, p) {
    const k = easeOutBack(clamp(p / 0.6, 0, 1));
    const close = easeOutCubic(clamp(p / 0.4, 0, 1));
    const gap = lerp(140, 70, close);
    const ring = (x) => `<circle cx="${x}" cy="0" r="62" fill="none" stroke="url(#gSteel)" stroke-width="20"/>
      <circle cx="${x}" cy="0" r="62" fill="none" stroke="#5d656c" stroke-width="3"/>`;
    return `<g transform="translate(${cx} ${cy}) scale(${k})" filter="url(#fShadow)">
      <path d="M${-gap + 50} -8 Q0 -40 ${gap - 50} -8" fill="none" stroke="#8d949a" stroke-width="10" stroke-dasharray="14 6"/>
      ${ring(-gap)}${ring(gap)}
    </g>`;
  }

  function searchRings(cx, cy, p) {
    let s = '';
    for (let i = 0; i < 3; i++) {
      const k = clamp(p * 1.4 - i * 0.2, 0, 1);
      if (k <= 0 || k >= 1) continue;
      s += `<circle cx="${cx}" cy="${cy}" r="${30 + k * 200}" fill="none" stroke="${RED}" stroke-width="5" opacity="${1 - k}"/>`;
    }
    const q = easeOutBack(clamp(p * 2, 0, 1));
    s += `<g transform="translate(${cx} ${cy}) scale(${q})"><circle r="44" fill="${RED}" stroke="#fff" stroke-width="5"/>
      <text y="22" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="62" fill="#fff">?</text></g>`;
    return s;
  }

  function lerpColor(k) {
    const a = [67, 224, 138];
    const b = [120, 128, 136];
    const c = a.map((v, i) => Math.round(lerp(v, b[i], clamp(k, 0, 1))));
    return `rgb(${c.join(',')})`;
  }

  // Prepend shared defs to every scene layer (identical defs; duplicates during crossfade are harmless).
  for (const sc of scenes) {
    const d = sc.draw;
    sc.draw = (t, lt, hs) => DEFS + d(t, lt, hs);
  }

  window.EPISODE = {
    duration: 37.9,
    fps: 30,
    images: Object.fromEntries(Object.entries(IMG).map(([k, v]) => [k, v[0]])),
    words: [],
    scenes,
  };
})();
