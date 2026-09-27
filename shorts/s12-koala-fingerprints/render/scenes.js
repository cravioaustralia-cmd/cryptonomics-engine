/* s12 — Koala Fingerprints
 * Photo underlay + SVG motion graphics. SVG + renderFrame(t) only (no Remotion).
 * Beat times come from transcript.json (faster-whisper word timings on audio/vo.mp3).
 * On-screen text: frame-1 hook + names / facts / prop marks only. No VO-echo titles.
 * Soft facts: crime-scene beat is a theoretical print-card motif (no case file, no court stamp);
 * microscope still is a generic lab proxy; ridge drawings are stylised SVG, not koala micrographs.
 * Caption band (~70%, y≈1260–1430), the bottom UI zone and the right edge are kept clear of graphics.
 */
(function () {
  const HS = window.HS;
  const { W, H, clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic } = HS;

  const IMG = {
    otway: ['/img/s12_01_cape_otway_koala.jpg', 1280, 1280],
    lofty: ['/img/s12_02_mount_lofty_koala.jpg', 1280, 853],
    foot: ['/img/s12_03_koala_foot_underside.jpg', 1000, 667],
    loopw: ['/img/s12_04_fingerprint_loop_whorl.jpg', 1024, 1280],
    plainw: ['/img/s12_05_fingerprint_plain_whorl.jpg', 1024, 1280],
    nist: ['/img/s12_06_nist_fingerprints.jpg', 589, 582],
    scope: ['/img/s12_07_lab_microscope.jpg', 1280, 1752],
    claws: ['/img/s12_08_koala_claws.jpg', 1280, 853],
    climb: ['/img/s12_09_koala_climbing.jpg', 1132, 1113],
    euc: ['/img/s12_10_koala_eucalyptus.jpg', 1280, 960],
    bono: ['/img/s12_11_bonorong_koala.jpg', 1121, 1732],
    sydney: ['/img/s12_12_sydney_koala.jpg', 1280, 943],
  };

  const DISPLAY = `'DejaVu Sans', 'Liberation Sans', sans-serif`;
  const YELLOW = '#ffcc33';
  const RED = '#e8322b';
  const INK = '#15171a';
  const EUC = '#9fd3b0'; // eucalyptus grey-green
  const PAPER = '#efe7d4';
  const RIDGE = '#f4f1e6';

  // ---------- helpers ----------
  const p01 = (t, t0, d) => clamp((t - t0) / d, 0, 1);
  const rnd = (i) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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

  /** Image fitted (cover) into a box, clipped — for cards. */
  function boxImage(key, bx, by, bw, bh, o = {}) {
    const [url, iw, ih] = IMG[key];
    const s = Math.max(bw / iw, bh / ih) * (o.zoom || 1);
    const w = iw * s;
    const h = ih * s;
    const x = clamp(bx + bw / 2 - (o.fx != null ? o.fx : 0.5) * w, bx + bw - w, bx);
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

  /** Circular lens showing image point (u,v) at a pixel scale. `inner` is extra SVG drawn inside the clip. */
  function lens(key, cx, cy, r, u, v, scale, p, o = {}) {
    if (p <= 0) return '';
    const k = o.noPop ? 1 : easeOutBack(clamp(p / 0.5, 0, 1));
    const id = o.id || 'ln' + Math.round(cx) + '_' + Math.round(cy);
    const circ = 2 * Math.PI * (r + 14);
    const ring = easeOutCubic(clamp(p / 0.7, 0, 1));
    let img = '';
    if (key) {
      const [url, iw, ih] = IMG[key];
      const w = iw * scale;
      const h = ih * scale;
      img = `<image href="${url}" x="${cx - u * w}" y="${cy - v * h}" width="${w}" height="${h}" preserveAspectRatio="none"${o.filter ? ` filter="url(#${o.filter})"` : ''}/>`;
    }
    return `<g transform="translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})" opacity="${o.opacity != null ? o.opacity : 1}">
      <circle cx="${cx}" cy="${cy + 18}" r="${r + 10}" fill="rgba(0,0,0,0.55)" filter="url(#fSoft)"/>
      <clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
      <g clip-path="url(#${id})">
        <rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" fill="${o.bg || '#101418'}"/>
        ${img}
        ${o.inner || ''}
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#gLens)"/>
      </g>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#fff" stroke-width="8"/>
      <circle cx="${cx}" cy="${cy}" r="${r + 14}" fill="none" stroke="${o.ring || YELLOW}" stroke-width="6"
        stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - ring)}" transform="rotate(-90 ${cx} ${cy})"/>
    </g>`;
  }

  // ---------- procedural friction-ridge drawings (stylised, not micrographs) ----------

  /** Whorl: near-concentric wobbly rings with small ridge breaks. Returns array of path d strings (inner first). */
  function whorlPaths(cx, cy, rx, ry, n, seed = 1) {
    const out = [];
    for (let i = 1; i <= n; i++) {
      const f = (i - 0.35) / n;
      const gap = rnd(seed * 17 + i) < 0.45 ? 0.18 + rnd(seed * 23 + i) * 0.4 : 0.03;
      const a0 = rnd(seed * 31 + i) * Math.PI * 2;
      const span = Math.PI * 2 - gap;
      // core drifts a little so rings read as a whorl, not a target
      const ox = Math.sin(i * 0.5 + seed) * rx * 0.05 * (1 - f);
      const oy = -ry * 0.08 * (1 - f);
      let d = '';
      const N = 64;
      for (let k = 0; k <= N; k++) {
        const a = a0 + (span * k) / N;
        const wob = 1 + 0.045 * Math.sin(3 * a + seed + i * 0.35) + 0.025 * Math.sin(5 * a + i * 0.7 + seed * 2);
        const x = cx + ox + Math.cos(a) * rx * f * wob;
        const y = cy + oy + Math.sin(a) * ry * f * wob;
        d += (k ? ' L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      }
      out.push(d);
    }
    return out;
  }

  /** Loop: nested hairpins opening to lower-left, then arching ridges over the top. */
  function loopPaths(cx, cy, rx, ry, n, seed = 2) {
    const out = [];
    const rot = -28 * (Math.PI / 180);
    const tr = (x, y) => {
      const dx = x - cx;
      const dy = y - cy;
      return [cx + dx * Math.cos(rot) - dy * Math.sin(rot), cy + dx * Math.sin(rot) + dy * Math.cos(rot)];
    };
    const legs = ry * 1.6;
    for (let i = 1; i <= n; i++) {
      const a = (rx * 0.92 * i) / n;
      const pts = [];
      for (let k = 0; k <= 12; k++) pts.push([cx - a, cy + legs - (legs * k) / 12]);
      for (let k = 0; k <= 24; k++) {
        const th = Math.PI + (Math.PI * k) / 24;
        pts.push([cx + Math.cos(th) * a, cy + Math.sin(th) * a * 1.15]);
      }
      for (let k = 0; k <= 12; k++) pts.push([cx + a, cy + (legs * 0.9 * k) / 12]);
      out.push(
        pts
          .map(([x, y], k) => {
            const [X, Y] = tr(x + Math.sin(y * 0.03 + seed + i) * 3, y);
            return (k ? 'L' : 'M') + X.toFixed(1) + ' ' + Y.toFixed(1);
          })
          .join(' ')
      );
    }
    // arching ridges beyond the loop
    for (let j = 1; j <= Math.round(n * 0.7); j++) {
      const y0 = cy + ry * 0.3 - j * (ry / n) * 1.25;
      const bump = ry * 0.55 + j * 4;
      const x1 = cx - rx * 1.4;
      const x2 = cx + rx * 1.4;
      out.push(`M${x1} ${y0 + ry * 0.4} Q${cx} ${y0 - bump} ${x2} ${y0 + ry * 0.2}`);
    }
    return out;
  }

  /** Straight-ish parallel ridges with one bifurcation and one ending ("ridges"). */
  function ridgePaths(cx, cy, rx, ry, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const y = cy - ry + ((i + 0.5) * 2 * ry) / n;
      let d = '';
      for (let k = 0; k <= 30; k++) {
        const x = cx - rx * 1.2 + (rx * 2.4 * k) / 30;
        const yy = y - Math.sin(((x - cx) / rx) * 1.4) * ry * 0.25 + Math.sin(k * 0.5 + i) * 2;
        d += (k ? ' L' : 'M') + x.toFixed(1) + ' ' + yy.toFixed(1);
      }
      out.push(d);
    }
    // bifurcation
    out.push(`M${cx - 10} ${cy + 4} Q${cx + 30} ${cy + 14} ${cx + rx} ${cy + 20}`);
    return out;
  }

  /** Fingertip drawing clipped to an oval; `p` sweeps ridges in, inner first. */
  function fingerprint(type, cx, cy, rx, ry, p, o = {}) {
    if (p <= 0) return '';
    const n = o.n || 13;
    const paths =
      type === 'loop' ? loopPaths(cx, cy + ry * 0.1, rx * 0.72, ry * 0.5, n, o.seed || 2)
      : type === 'ridge' ? ridgePaths(cx, cy, rx, ry, n)
      : whorlPaths(cx, cy, rx, ry, n, o.seed || 1);
    const id = o.id || 'fp' + Math.round(cx) + '_' + Math.round(cy);
    const sw = o.sw || Math.max(3, rx / n / 1.5);
    const color = o.color || RIDGE;
    let s = '';
    paths.forEach((d, i) => {
      const k = easeOutCubic(clamp(p * 1.6 - (i / paths.length) * 0.6, 0, 1));
      if (k <= 0) return;
      s += `<path d="${d}" pathLength="1" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"
        stroke-dasharray="1 1" stroke-dashoffset="${1 - k}"/>`;
    });
    return `<clipPath id="${id}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath>
      <g clip-path="url(#${id})" opacity="${o.opacity != null ? o.opacity : 1}">
        ${o.bg ? `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${o.bg}"/>` : ''}
        ${s}
      </g>`;
  }

  const DEFS = `
    <defs>
      <filter id="fBlur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="16"/></filter>
      <filter id="fFocus" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="10"/></filter>
      <filter id="fGray" color-interpolation-filters="sRGB">
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncR type="linear" slope="1.25" intercept="-0.08"/><feFuncG type="linear" slope="1.25" intercept="-0.08"/><feFuncB type="linear" slope="1.25" intercept="-0.08"/></feComponentTransfer>
      </filter>
      <filter id="fBright" color-interpolation-filters="sRGB">
        <feComponentTransfer><feFuncR type="linear" slope="1.3" intercept="0.02"/><feFuncG type="linear" slope="1.3" intercept="0.02"/><feFuncB type="linear" slope="1.25" intercept="0.02"/></feComponentTransfer>
      </filter>
      <filter id="fSoft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
      <filter id="fStamp" x="-10%" y="-20%" width="120%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="5"/>
        <feComponentTransfer><feFuncA type="discrete" tableValues="0 1 1 1 1 1"/></feComponentTransfer>
      </filter>
      <filter id="fDust" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="3" result="n"/>
        <feComposite in="SourceGraphic" in2="n" operator="in"/>
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
      <radialGradient id="gEye" cx="50%" cy="50%" r="50%">
        <stop offset="0.72" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.9"/>
      </radialGradient>
      <radialGradient id="gWarm" cx="82%" cy="12%" r="85%">
        <stop offset="0" stop-color="#ffc56b" stop-opacity="0.55"/>
        <stop offset="0.45" stop-color="#ff9a3c" stop-opacity="0.14"/>
        <stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="gScan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${YELLOW}" stop-opacity="0"/>
        <stop offset="0.85" stop-color="${YELLOW}" stop-opacity="0.22"/>
        <stop offset="1" stop-color="#fff6d8" stop-opacity="0.95"/>
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

  /** Small plain sub-label (white text with stroke). */
  function sub(text, x, y, p, o = {}) {
    if (p <= 0) return '';
    const k = easeOutCubic(clamp(p / 0.5, 0, 1));
    return `<text x="${x}" y="${y + (1 - k) * 20}" opacity="${k}" text-anchor="${o.anchor || 'start'}" font-family="${DISPLAY}"
      font-weight="700" font-size="${o.size || 32}" fill="${o.fill || '#fff'}" stroke="${INK}" stroke-width="6" paint-order="stroke"
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
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="14" fill="none" stroke="${color}" stroke-width="12"/>
        <rect x="${-w / 2 + 16}" y="${-h / 2 + 16}" width="${w - 32}" height="${h - 32}" rx="8" fill="none" stroke="${color}" stroke-width="4"/>
        <text x="0" y="${size * 0.36}" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="${size}"
          fill="${color}" letter-spacing="4">${esc(text)}</text>
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

  /** Scan beam sweeping down a circle region. */
  function scanCircle(t, cx, cy, r, t0, dur, op = 1, id = 'scn') {
    if (t < t0 || op <= 0) return '';
    const k = ((t - t0) % dur) / dur;
    const sy = cy - r + easeInOutCubic(k) * 2 * r;
    return `<g opacity="${op}">
      <clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
      <g clip-path="url(#${id})">
        <rect x="${cx - r}" y="${sy - 140}" width="${2 * r}" height="140" fill="url(#gScan)"/>
        <rect x="${cx - r}" y="${sy - 2}" width="${2 * r}" height="4" fill="#fff6d8" filter="url(#fGlow)"/>
      </g>
    </g>`;
  }

  /** Frame-1 hook lock-up (also re-forms at the loop end). Sits below the koala, above the caption band. */
  function hook(p, t) {
    if (p <= 0) return '';
    const k = clamp(p, 0, 1);
    const pulse = 1 + Math.sin(t * 5) * 0.006;
    const bar = easeOutCubic(k);
    return `<g opacity="${k}" transform="translate(540 1110) scale(${pulse}) translate(-540 -1110)" filter="url(#fShadow)">
      <text x="540" y="1064" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="112"
        fill="#fff" stroke="${INK}" stroke-width="12" paint-order="stroke" letter-spacing="4">ALMOST</text>
      <text x="540" y="1184" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="112"
        fill="${YELLOW}" stroke="${INK}" stroke-width="13" paint-order="stroke" letter-spacing="2">IDENTICAL</text>
      <rect x="${540 - 330 * bar}" y="1208" width="${660 * bar}" height="12" rx="6" fill="${RED}"/>
    </g>`;
  }

  /** Ring flash burst. */
  function ringBurst(cx, cy, t, t0, r0 = 60, r1 = 360, color = YELLOW) {
    const k = p01(t, t0, 0.6);
    if (k <= 0 || k >= 1) return '';
    const e = easeOutCubic(k);
    return `<circle cx="${cx}" cy="${cy}" r="${lerp(r0, r1, e)}" fill="none" stroke="${color}" stroke-width="${lerp(18, 2, e)}" opacity="${1 - k}"/>`;
  }

  /** Location pin tag (place name). */
  function placeTag(text, x, y, p) {
    if (p <= 0) return '';
    const drop = easeOutBack(clamp(p / 0.5, 0, 1));
    return `<g transform="translate(${x} ${y - (1 - drop) * 60})" opacity="${clamp(p * 3, 0, 1)}" filter="url(#fShadow)">
      <path d="M0 0 C-6 -18 -26 -32 -26 -52 A26 26 0 1 1 26 -52 C26 -32 6 -18 0 0Z" fill="${RED}" stroke="#fff" stroke-width="4"/>
      <circle cx="0" cy="-52" r="10" fill="#fff"/>
    </g>${sub(text, x + 42, y - 30, clamp((p - 0.2) / 0.6, 0, 1), { size: 34 })}`;
  }

  /** Evidence tent marker (prop). */
  function tent(x, y, n, p) {
    if (p <= 0) return '';
    const k = easeOutBack(clamp(p / 0.45, 0, 1));
    return `<g transform="translate(${x} ${y - (1 - k) * 120}) " opacity="${clamp(p * 4, 0, 1)}" filter="url(#fShadow)">
      <path d="M-70 0 L-40 -130 L40 -130 L70 0Z" fill="${YELLOW}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M-40 -130 L40 -130 L46 -104 L-46 -104Z" fill="#e0aa18"/>
      <text x="0" y="-26" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="78" fill="${INK}">${n}</text>
    </g>`;
  }

  /** Brush (dusting) icon. */
  function brush(x, y, rot) {
    return `<g transform="translate(${x} ${y}) rotate(${rot})" filter="url(#fShadow)">
      <rect x="-12" y="-230" width="24" height="170" rx="10" fill="#3b2a1a" stroke="#fff" stroke-width="3"/>
      <rect x="-20" y="-70" width="40" height="26" rx="4" fill="#b9bfc5"/>
      <path d="M-34 -44 Q0 -60 34 -44 L28 30 Q0 44 -28 30Z" fill="#2a2a2a"/>
      ${[-22, -11, 0, 11, 22].map((d) => `<line x1="${d}" y1="-40" x2="${d * 1.1}" y2="30" stroke="#555" stroke-width="3"/>`).join('')}
    </g>`;
  }

  /** Magnifier icon. */
  function magnifier(x, y, r) {
    return `<g transform="translate(${x} ${y})" filter="url(#fShadow)">
      <circle r="${r}" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="10"/>
      <line x1="${r * 0.72}" y1="${r * 0.72}" x2="${r * 1.55}" y2="${r * 1.55}" stroke="#3b2a1a" stroke-width="26" stroke-linecap="round"/>
    </g>`;
  }

  /** Paw icon (branch grip). */
  function pawIcon(cx, cy, s, fill = '#fff') {
    return `<g transform="translate(${cx} ${cy}) scale(${s})">
      <ellipse cx="0" cy="14" rx="30" ry="24" fill="${fill}"/>
      <ellipse cx="-34" cy="-16" rx="11" ry="15" fill="${fill}" transform="rotate(-25 -34 -16)"/>
      <ellipse cx="-12" cy="-32" rx="11" ry="15" fill="${fill}"/>
      <ellipse cx="14" cy="-32" rx="11" ry="15" fill="${fill}"/>
      <ellipse cx="36" cy="-14" rx="11" ry="15" fill="${fill}" transform="rotate(25 36 -14)"/>
    </g>`;
  }

  /** Leaf icon. */
  function leafIcon(cx, cy, s, rot, fill = EUC) {
    return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})">
      <path d="M0 -60 C26 -30 26 30 0 60 C-26 30 -26 -30 0 -60Z" fill="${fill}"/>
      <path d="M0 -56 L0 58" stroke="#3f6b4c" stroke-width="4"/>
    </g>`;
  }

  // ---------- scenes ----------
  const Z0 = 1.0; // hook framing — also the loop's final framing
  const HOOK = { fx: 0.5, fy: 0.36 };
  const KOALA1 = [0.5, 0.36]; // Cape Otway koala body centre (image-relative)
  const X = 0.3; // crossfade length

  /** Whorl centred on the Cape Otway koala (hook + loop). */
  function hookWhorl(ph, p, op, scale = 1) {
    if (p <= 0 || op <= 0) return '';
    const [kx, ky] = ph.at(KOALA1[0], KOALA1[1]);
    return `<g opacity="${op}" transform="translate(${kx} ${ky}) scale(${scale}) translate(${-kx} ${-ky})">
      ${fingerprint('whorl', kx, ky, 390, 470, p, { n: 16, sw: 5, color: 'rgba(255,236,170,0.62)', id: 'fpHook', seed: 4 })}
    </g>`;
  }

  const scenes = [
    {
      // 1 — frame-1 hook over the Cape Otway koala; ridges draw around it; fly into the print on "yours"
      id: 'hook',
      start: 0,
      end: 3.5 + X,
      draw(t) {
        const zoom = lerp(Z0, Z0 + 0.16, easeInOutCubic(p01(t, 0, 3.6)));
        const ph = photo('otway', { fx: HOOK.fx, fy: HOOK.fy, zoom, dim: 0.3 });
        const hk = 1 - p01(t, 1.1, 0.35);
        const wp = p01(t, 0.15, 2.3);
        const fly = easeInOutCubic(p01(t, 2.95, 0.6));
        const [kx, ky] = ph.at(KOALA1[0], KOALA1[1]);
        return `${ph.svg}${vignette()}
          ${hookWhorl(ph, wp, 1 - fly * 0.4, 1 + fly * 1.6)}
          ${ringBurst(kx, ky, t, 2.92, 80, 520)}
          ${placeTag('CAPE OTWAY, VIC', 90, 250, p01(t, 1.5, 0.6) * (1 - p01(t, 3.1, 0.3)))}
          ${hook(hk, t)}`;
      },
    },
    {
      // 2 — koala pad lens vs human print lens; ∼ struck out → ≈; loops / whorls / ridges tiles
      id: 'compare',
      start: 3.5,
      end: 8.85 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 3.5, X));
        const bg = photo('lofty', { fx: 0.4, fy: 0.55, zoom: lerp(1.1, 1.18, p01(t, 3.5, 5.6)), filter: 'fBlur', dim: 0.58 });
        const L = [285, 560];
        const R = [795, 560];
        const r = 210;
        const lp = p01(t, 3.62, 0.7);
        const rp = p01(t, 3.9, 0.7);
        const sync = p01(t, 4.9, 1.0);
        const trace = fingerprint('whorl', R[0], R[1], r * 0.9, r * 1.0, sync, { n: 12, sw: 3, color: 'rgba(255,204,51,0.55)', id: 'fpTrR', seed: 6 });
        const traceL = fingerprint('ridge', L[0], L[1], r * 0.9, r * 0.9, sync, { n: 12, sw: 3, color: 'rgba(255,204,51,0.5)', id: 'fpTrL' });
        // centre glyph: ∼ struck through ("not similar") → ≈ ("almost identical")
        const g1 = p01(t, 3.85, 0.3) * (1 - p01(t, 4.85, 0.12));
        const strike = p01(t, 4.12, 0.3);
        const g2 = p01(t, 4.9, 0.4);
        const gy = 575;
        const glyph =
          (g1 > 0
            ? `<g opacity="${g1}" filter="url(#fShadow)">
                <text x="540" y="${gy + 34}" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="130" fill="#fff" stroke="${INK}" stroke-width="8" paint-order="stroke">∼</text>
                <line x1="490" y1="${gy + 40}" x2="${lerp(490, 590, strike)}" y2="${lerp(gy + 40, gy - 30, strike)}" stroke="${RED}" stroke-width="12" stroke-linecap="round"/>
              </g>`
            : '') +
          (g2 > 0
            ? `<g transform="translate(540 ${gy}) scale(${easeOutBack(clamp(g2 / 0.6, 0, 1)) * 1.08})" filter="url(#fShadow)">
                <circle r="62" fill="${INK}" stroke="${YELLOW}" stroke-width="6"/>
                <text x="0" y="36" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="104" fill="${YELLOW}">≈</text>
              </g>`
            : '');
        // pattern tiles
        const tiles = [
          ['loop', 'LOOPS', 190, 6.8],
          ['whorl', 'WHORLS', 480, 7.68],
          ['ridge', 'RIDGES', 770, 8.14],
        ]
          .map(([type, txt, x, t0]) => {
            const tp = p01(t, t0, 0.8);
            if (tp <= 0) return '';
            const k = easeOutBack(clamp(tp / 0.45, 0, 1));
            const cy = 1010;
            return `<g transform="translate(${x} ${cy}) scale(${k}) translate(${-x} ${-cy})" filter="url(#fShadow)">
                <circle cx="${x}" cy="${cy}" r="104" fill="rgba(16,20,24,0.9)" stroke="${YELLOW}" stroke-width="5"/>
              </g>
              <g transform="translate(${x} ${cy}) scale(${k}) translate(${-x} ${-cy})">
                ${fingerprint(type, x, cy, 88, 92, p01(t, t0, 0.9), { n: 9, sw: 4, id: 'fpT' + type })}
              </g>
              ${label(txt, x - (txt.length * 17 + 36), 1164, p01(t, t0 + 0.05, 0.5), { size: 32 })}`;
          })
          .join('');
        const pulse = ringBurst(L[0], L[1], t, 4.9, r, r + 90) + ringBurst(R[0], R[1], t, 4.9, r, r + 90);
        return `<g opacity="${fi}">
          ${bg.svg}${vignette()}
          ${lens('foot', L[0], L[1], r, 0.64, 0.46, 1.45, lp, { id: 'lnPad', inner: traceL, filter: 'fBright' })}
          ${lens('loopw', R[0], R[1], r, 0.5, 0.42, 0.62, rp, { id: 'lnHum', inner: trace })}
          ${scanCircle(t, L[0], L[1], r, 4.9, 0.9, 1 - p01(t, 5.8, 0.3), 'scL')}
          ${scanCircle(t, R[0], R[1], r, 4.9, 0.9, 1 - p01(t, 5.8, 0.3), 'scR')}
          ${pulse}
          ${glyph}
          ${label('KOALA', 150, 846, p01(t, 3.72, 0.5), { size: 40 })}
          ${label('HUMAN', 662, 846, p01(t, 3.98, 0.5), { size: 40, bg: '#fff' })}
          ${tiles}
        </g>`;
      },
    },
    {
      // 3 — microscope (generic lab proxy): eyepiece iris + focus pull, then the shell game
      id: 'scope',
      start: 8.85,
      end: 14.6 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 8.85, X));
        const zoom = lerp(1.02, 1.16, easeInOutCubic(p01(t, 8.85, 5.8)));
        const ph = photo('scope', { fx: 0.52, fy: 0.42, zoom, dim: 0.42 + p01(t, 10.2, 0.5) * 0.2 });
        const E = [540, 720];
        const R0 = 330;
        const iris = easeOutCubic(p01(t, 10.24, 0.6)) * (1 - easeInOutCubic(p01(t, 11.5, 0.45)));
        const focus = p01(t, 10.6, 0.6);
        let eye = '';
        if (iris > 0) {
          const r = R0 * iris;
          const [url, iw, ih] = IMG.plainw;
          const s = 0.95;
          const img = (f) =>
            `<image href="${url}" x="${E[0] - 0.5 * iw * s}" y="${E[1] - 0.45 * ih * s}" width="${iw * s}" height="${ih * s}" preserveAspectRatio="none" filter="url(#${f})"/>`;
          eye = `<g filter="url(#fShadow)">
            <circle cx="${E[0]}" cy="${E[1]}" r="${r + 22}" fill="#0b0d10"/>
            <clipPath id="eyeC"><circle cx="${E[0]}" cy="${E[1]}" r="${r}"/></clipPath>
            <g clip-path="url(#eyeC)">
              <rect x="${E[0] - r}" y="${E[1] - r}" width="${2 * r}" height="${2 * r}" fill="#0b0d10"/>
              <g opacity="${1 - focus}">${img('fFocus')}</g>
              <g opacity="${focus}">${img('fGray')}</g>
              <line x1="${E[0] - r}" y1="${E[1]}" x2="${E[0] + r}" y2="${E[1]}" stroke="${YELLOW}" stroke-opacity="0.55" stroke-width="3"/>
              <line x1="${E[0]}" y1="${E[1] - r}" x2="${E[0]}" y2="${E[1] + r}" stroke="${YELLOW}" stroke-opacity="0.55" stroke-width="3"/>
              ${Array.from({ length: 9 }, (_, i) => `<line x1="${E[0] - 120 + i * 30}" y1="${E[1] - 12}" x2="${E[0] - 120 + i * 30}" y2="${E[1] + 12}" stroke="${YELLOW}" stroke-opacity="0.6" stroke-width="3"/>`).join('')}
              <circle cx="${E[0]}" cy="${E[1]}" r="${r}" fill="url(#gEye)"/>
            </g>
            <circle cx="${E[0]}" cy="${E[1]}" r="${r + 10}" fill="none" stroke="#c9cfd4" stroke-width="16"/>
            <circle cx="${E[0]}" cy="${E[1]}" r="${r + 22}" fill="none" stroke="#6d757c" stroke-width="8"/>
          </g>`;
        }
        // shell game: two stylised prints (koala / human) swap until you can't tell which is which
        const gp = p01(t, 11.56, 0.5);
        let game = '';
        if (gp > 0) {
          const A = [300, 720];
          const B = [780, 720];
          const r = 170;
          // two swaps: 12.34→12.84 and 12.9→13.4
          const s1 = easeInOutCubic(p01(t, 12.34, 0.5));
          const s2 = easeInOutCubic(p01(t, 12.9, 0.5));
          const pos = (who) => {
            // who 0 starts at A, 1 at B
            let u = who === 0 ? 0 : 1;
            let arc = 0;
            const legs = [s1, s2];
            for (const s of legs) {
              const from = u;
              const to = 1 - u;
              if (s > 0 && s < 1) arc = Math.sin(s * Math.PI) * (from === 0 ? -170 : 170);
              u = s >= 1 ? to : from + (to - from) * s;
              if (s < 1) break;
            }
            return [lerp(A[0], B[0], u), lerp(A[1], B[1], u) + arc];
          };
          const unknown = p01(t, 12.4, 0.3);
          const item = (who) => {
            const [x, y] = pos(who);
            const k = easeOutBack(clamp(gp / 0.5, 0, 1));
            const name = who === 0 ? 'KOALA' : 'HUMAN';
            const fp = fingerprint('whorl', x, y, r * 0.86, r * 0.96, p01(t, 11.6, 0.8), { n: 12, sw: 5, id: 'fpG' + who, seed: who === 0 ? 3 : 5, bg: '#1a1d21' });
            return `<g transform="translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})">
                <circle cx="${x}" cy="${y}" r="${r + 14}" fill="#0b0d10" stroke="#c9cfd4" stroke-width="10" filter="url(#fShadow)"/>
                ${fp}
              </g>
              <g opacity="${1 - unknown}">${sub(name, x, y + r + 70, p01(t, 11.7, 0.4), { anchor: 'middle', size: 38 })}</g>
              <g opacity="${unknown}">${sub('?', x, y + r + 78, unknown, { anchor: 'middle', size: 64, fill: YELLOW })}</g>`;
          };
          game = `<g opacity="${clamp(gp * 2, 0, 1)}">${item(0)}${item(1)}</g>`;
        }
        return `<g opacity="${fi}">
          ${ph.svg}${vignette()}
          ${eye}
          ${game}
          ${label('MICROSCOPE', 70, 200, p01(t, 10.66, 0.55), { size: 50 })}
        </g>`;
      },
    },
    {
      // 4 — theoretical crime scene: print card, IN THEORY stamp, dusting brush reveals a print, tent marker
      id: 'theory',
      start: 14.6,
      end: 19.85 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 14.6, X));
        const bg = photo('nist', { zoom: 1.2, filter: 'fBlur', dim: 0.72, tint: 'rgba(10,20,40,0.35)' });
        const cin = easeOutBack(p01(t, 14.7, 0.6));
        const cx0 = 110;
        const cy0 = 250;
        const cw = 860;
        const ch = 720;
        const sA = [cx0 + 60, cy0 + 150, 340, 420];
        const sB = [cx0 + 460, cy0 + 150, 340, 420];
        const nistA = boxImage('nist', sA[0], sA[1], sA[2], sA[3], { zoom: 1.9, fx: 0.76, fy: 0.76, id: 'slotA' });
        // B: dust reveal of a stylised print (radial wipe following the brush)
        const dust = p01(t, 17.2, 1.1);
        const bcx = sB[0] + sB[2] / 2;
        const bcy = sB[1] + sB[3] / 2;
        const bx = lerp(sB[0] - 30, sB[0] + sB[2] + 10, easeInOutCubic(dust));
        const by = bcy + Math.sin(dust * Math.PI * 4) * 90;
        const reveal = `<clipPath id="dustC"><circle cx="${bcx}" cy="${bcy}" r="${easeOutCubic(dust) * 280}"/></clipPath>
          <g clip-path="url(#dustC)">
            ${fingerprint('whorl', bcx, bcy + 10, 140, 180, 1, { n: 14, sw: 7, color: '#1d1d1d', id: 'fpDust', seed: 9 })}
          </g>`;
        const mag = p01(t, 18.5, 1.2);
        const mx = lerp(sA[0] + 170, sB[0] + 170, easeInOutCubic(mag));
        const my = sA[1] + 200 - Math.sin(mag * Math.PI) * 60;
        const link = p01(t, 19.08, 0.45);
        const sh = shake(t, 15.35, 16, 0.35);
        return `<g opacity="${fi}">
          ${bg.svg}${vignette()}
          <g transform="translate(${sh.x} ${sh.y})">
            <g transform="translate(540 ${cy0 + ch / 2 + (1 - cin) * 200}) rotate(${lerp(6, -1.2, cin)}) translate(-540 ${-(cy0 + ch / 2)})">
              <rect x="${cx0}" y="${cy0}" width="${cw}" height="${ch}" rx="6" fill="${PAPER}" filter="url(#fShadow)"/>
              ${[0, 1, 2, 3].map((i) => `<line x1="${cx0 + 60}" y1="${cy0 + 60 + i * 20}" x2="${cx0 + (i === 0 ? 520 : 800)}" y2="${cy0 + 60 + i * 20}" stroke="#b9ae96" stroke-width="3"/>`).join('')}
              <rect x="${sA[0] - 6}" y="${sA[1] - 6}" width="${sA[2] + 12}" height="${sA[3] + 12}" fill="none" stroke="#7d735f" stroke-width="4"/>
              ${nistA.svg}
              <rect x="${sB[0] - 6}" y="${sB[1] - 6}" width="${sB[2] + 12}" height="${sB[3] + 12}" fill="none" stroke="#7d735f" stroke-width="4"/>
              <rect x="${sB[0]}" y="${sB[1]}" width="${sB[2]}" height="${sB[3]}" fill="#e6dcc4"/>
              ${reveal}
              ${[['A', sA], ['B', sB]].map(([n, s]) => `<text x="${s[0] + s[2] / 2}" y="${s[1] + s[3] + 70}" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="46" fill="#5a5140">${n}</text>`).join('')}
              ${stamp('IN THEORY', 540, cy0 + 110, p01(t, 15.3, 0.9), { size: 84, rot: -7 })}
            </g>
            ${dust > 0 && dust < 1 ? brush(bx + 10, by + 20, 28) : ''}
            ${mag > 0 ? `<g opacity="${clamp(mag * 4, 0, 1) * (1 - p01(t, 19.6, 0.25))}">${magnifier(mx, my, 110)}</g>` : ''}
            ${link > 0 ? `<g transform="translate(540 ${sA[1] + 210}) scale(${easeOutBack(clamp(link / 0.6, 0, 1))})" filter="url(#fShadow)">
                <circle r="56" fill="${INK}" stroke="${YELLOW}" stroke-width="6"/>
                <text x="0" y="32" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="92" fill="${YELLOW}">≈</text>
              </g>` : ''}
          </g>
          ${lens('sydney', 250, 1090, 110, 0.58, 0.5, 0.3, p01(t, 16.3, 0.6), { id: 'lnSus', ring: YELLOW })}
          ${tent(820, 1170, 1, p01(t, 17.76, 0.6))}
        </g>`;
      },
    },
    {
      // 5 — the twist: warm grade on the climbing koala, split family-tree fork, prints evolve separately
      id: 'fork',
      start: 19.85,
      end: 26.35 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 19.85, X));
        const snap = easeOutCubic(p01(t, 20.48, 0.35));
        const zoom = lerp(1.08, 1.2, snap) - 0.1 * easeInOutCubic(p01(t, 21.2, 5));
        const ph = photo('climb', { fx: 0.5, fy: 0.3, zoom, dim: 0.34 + p01(t, 21.3, 0.6) * 0.14 });
        const warm = p01(t, 19.95, 1.0);
        // fork geometry
        const node = [540, 960];
        const root = [540, 1120];
        const tipL = [250, 690];
        const tipR = [830, 690];
        const grow = easeInOutCubic(p01(t, 21.32, 1.0));
        const spread = easeOutCubic(p01(t, 21.9, 0.9));
        const tl = [lerp(node[0], tipL[0] + (1 - spread) * 90, grow), lerp(node[1], tipL[1], grow)];
        const trr = [lerp(node[0], tipR[0] - (1 - spread) * 90, grow), lerp(node[1], tipR[1], grow)];
        const trunk = easeOutCubic(p01(t, 21.32, 0.4));
        const glowL = p01(t, 24.24, 0.4);
        const glowR = p01(t, 24.86, 0.4);
        const branch = (a, b, glow) => {
          const midx = (a[0] + b[0]) / 2;
          return `<path d="M${a[0]} ${a[1]} C${a[0]} ${a[1] - 120} ${midx} ${b[1] + 60} ${b[0]} ${b[1]}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
            ${glow > 0 ? `<path d="M${a[0]} ${a[1]} C${a[0]} ${a[1] - 120} ${midx} ${b[1] + 60} ${b[0]} ${b[1]}" fill="none" stroke="${YELLOW}" stroke-width="9" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${1 - easeInOutCubic(glow)}" filter="url(#fGlow)"/>` : ''}`;
        };
        const tip = (p, glow, x, y, id, seed) => {
          if (grow < 0.98) return '';
          const k = easeOutBack(clamp(p01(t, 22.2, 0.4), 0, 1));
          return `<g transform="translate(${x} ${y}) scale(${k})" filter="url(#fShadow)">
              <circle r="64" fill="rgba(16,20,24,0.9)" stroke="${glow > 0 ? YELLOW : '#fff'}" stroke-width="6"/>
            </g>
            ${glow > 0 ? fingerprint('whorl', x, y, 52, 56, glow * 1.2, { n: 8, sw: 4, id, seed, color: YELLOW }) + ringBurst(x, y, t, id === 'fpTipL' ? 24.24 : 24.86, 64, 200) : ''}`;
        };
        const fork = `<g opacity="${clamp(trunk * 2, 0, 1)}" filter="url(#fShadow)">
            <line x1="${root[0]}" y1="${root[1]}" x2="${root[0]}" y2="${lerp(root[1], node[1], trunk)}" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
            ${grow > 0 ? branch(node, tl, glowL) + branch(node, trr, glowR) : ''}
            <circle cx="${node[0]}" cy="${node[1]}" r="${trunk * 14}" fill="${YELLOW}" stroke="${INK}" stroke-width="4"/>
          </g>
          ${tip(0, glowL, tl[0], tl[1], 'fpTipL', 3)}${tip(0, glowR, trr[0], trr[1], 'fpTipR', 5)}`;
        const lab = p01(t, 22.2, 0.5);
        return `<g opacity="${fi}">
          ${ph.svg}
          <rect width="${W}" height="${H}" fill="url(#gWarm)" opacity="${warm}"/>
          <rect width="${W}" height="${H}" fill="rgba(255,170,70,${0.07 * warm})"/>
          ${vignette()}
          <rect x="0" y="560" width="${W}" height="680" fill="rgba(0,0,0,${0.35 * trunk})"/>
          ${fork}
          ${label('KOALA', 80, 585, lab, { size: 40 })}
          ${sub('marsupial', 96, 800, p01(t, 22.4, 0.5), { size: 32 })}
          ${label('HUMAN', 660, 585, p01(t, 22.3, 0.5), { size: 40, bg: '#fff' })}
          ${sub('primate', 830, 800, p01(t, 22.5, 0.5), { size: 32, anchor: 'middle' })}
          ${sub('~70–100 MILLION YEARS', 540, 1190, p01(t, 22.6, 0.5), { size: 34, anchor: 'middle', fill: YELLOW })}
          ${label('CONVERGENT EVOLUTION', 70, 200, p01(t, 25.46, 0.6), { size: 44 })}
        </g>`;
      },
    },
    {
      // 6 — grip: claws on a branch (brackets), leaves lens
      id: 'grip',
      start: 26.35,
      end: 28.8 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 26.35, X));
        const zoom = lerp(1.0, 1.14, easeInOutCubic(p01(t, 26.35, 2.8)));
        const ph = photo('claws', { fx: 0.22, fy: 0.6, zoom, dim: 0.3, tint: 'rgba(255,160,60,0.08)' });
        const [cx, cy] = ph.at(0.11, 0.56);
        const br = p01(t, 27.16, 0.5);
        return `<g opacity="${fi}">
          ${ph.svg}${vignette()}
          ${brackets(cx, cy, 300, 220, br)}
          ${label('GRIP', 70, 200, p01(t, 27.16, 0.45), { size: 58 })}
          ${label('BRANCHES', 70, 300, p01(t, 27.44, 0.45), { size: 40, bg: '#fff' })}
          ${lens('euc', 690, 470, 190, 0.85, 0.72, 0.62, p01(t, 28.1, 0.6), { id: 'lnLeaf', ring: EUC })}
          ${label('LEAVES', 560, 730, p01(t, 28.18, 0.45), { size: 40, bg: EUC, accent: '#3f6b4c' })}
        </g>`;
      },
    },
    {
      // 7 — punchline: koala card vs human card split apart, then the same whorl draws on both and links
      id: 'same',
      start: 28.8,
      end: 32.75 + X,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 28.8, X));
        const bg = photo('bono', { fx: 0.45, fy: 0.3, zoom: 1.2, filter: 'fBlur', dim: 0.6 });
        const inA = easeOutBack(p01(t, 29.0, 0.55));
        const inB = easeOutBack(p01(t, 29.3, 0.55));
        const apart = easeInOutCubic(p01(t, 30.18, 0.5)) * (1 - easeInOutCubic(p01(t, 31.46, 0.4)));
        const same = p01(t, 31.46, 0.8);
        const cw = 780;
        const chh = 420;
        const ax = 110;
        const ay = 200;
        const by = 720;
        const A = boxImage('bono', ax, ay, cw, chh, { fx: 0.46, fy: 0.24, zoom: 1.0, id: 'cardA' });
        const B = boxImage('loopw', ax, by, cw, chh, { fx: 0.5, fy: 0.42, zoom: 1.0, id: 'cardB', filter: 'fBright' });
        const iA = [ax + cw - 150, ay + chh / 2];
        const iB = [ax + cw - 150, by + chh / 2];
        const inset = (c, id) =>
          same > 0
            ? `<g transform="translate(${c[0]} ${c[1]}) scale(${easeOutBack(clamp(same / 0.4, 0, 1))}) translate(${-c[0]} ${-c[1]})">
                <circle cx="${c[0]}" cy="${c[1]}" r="128" fill="#101418" stroke="${YELLOW}" stroke-width="7"/>
                ${fingerprint('whorl', c[0], c[1], 110, 118, same, { n: 11, sw: 5, id, seed: 8, color: RIDGE })}
              </g>`
            : '';
        const card = (img, x, y, k, rot, dx, name, bgc, inner) => `
          <g transform="translate(${x + cw / 2 + dx + (1 - k) * (dx < 0 ? -900 : 900)} ${y + chh / 2}) rotate(${rot}) translate(${-(x + cw / 2)} ${-(y + chh / 2)})">
            <rect x="${x - 12}" y="${y - 12}" width="${cw + 24}" height="${chh + 24}" rx="6" fill="${PAPER}" filter="url(#fShadow)"/>
            ${img.svg}
            ${inner}
            ${label(name, x + 24, y + 56, clamp(k, 0, 1), { size: 38, bg: bgc })}
          </g>`;
        const link = p01(t, 31.7, 0.5);
        const crack = apart;
        let zz = `M${ax - 10} 670`;
        for (let i = 1; i <= 12; i++) zz += ` L${ax - 10 + (i * (cw + 20)) / 12} ${670 + (i % 2 ? -18 : 18)}`;
        return `<g opacity="${fi}">
          ${bg.svg}${vignette()}
          ${crack > 0 ? `<path d="${zz}" fill="none" stroke="${RED}" stroke-width="8" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${1 - crack}" filter="url(#fGlow)"/>` : ''}
          ${card(A, ax, ay, inA, lerp(0, -4, apart), -apart * 40, 'KOALA', YELLOW, inset(iA, 'fpSA'))}
          ${card(B, ax, by, inB, lerp(0, 4, apart), apart * 40, 'HUMAN', '#fff', inset(iB, 'fpSB'))}
          ${link > 0 ? `<g filter="url(#fGlow)">
              <line x1="${iA[0]}" y1="${iA[1] + 128}" x2="${iA[0]}" y2="${lerp(iA[1] + 128, iB[1] - 128, easeOutCubic(link))}" stroke="${YELLOW}" stroke-width="10" stroke-linecap="round"/>
            </g>
            <g transform="translate(${iA[0]} 670) scale(${easeOutBack(clamp((link - 0.3) / 0.7, 0, 1))})" filter="url(#fShadow)">
              <circle r="48" fill="${INK}" stroke="${YELLOW}" stroke-width="6"/>
              <text x="0" y="26" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="80" fill="${YELLOW}">=</text>
            </g>` : ''}
          ${ringBurst(iA[0], iA[1], t, 31.5, 128, 300)}${ringBurst(iB[0], iB[1], t, 31.5, 128, 300)}
        </g>`;
      },
    },
    {
      // 8 — loop: back to the Cape Otway koala; whorl redraws; framing returns to frame 1; hook re-forms
      id: 'loop',
      start: 32.75,
      end: 37.08 + 0.1,
      draw(t) {
        const fi = easeInOutCubic(p01(t, 32.75, 0.35));
        const zoom = lerp(Z0 + 0.22, Z0, easeInOutCubic(p01(t, 32.75, 4.0)));
        const ph = photo('otway', { fx: HOOK.fx, fy: HOOK.fy, zoom, dim: 0.3 });
        const [kx, ky] = ph.at(KOALA1[0], KOALA1[1]);
        const wp = p01(t, 33.0, 2.2);
        const wOut = 1 - p01(t, 36.0, 0.55);
        const hk = p01(t, 36.45, 0.4);
        return `<g opacity="${fi}">
          ${ph.svg}${vignette()}
          ${hookWhorl(ph, wp, wOut)}
          ${ringBurst(kx, ky, t, 34.56, 80, 520)}
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
    duration: 37.08,
    fps: 30,
    images: Object.fromEntries(Object.entries(IMG).map(([k, v]) => [k, v[0]])),
    words: [],
    scenes,
  };
})();
