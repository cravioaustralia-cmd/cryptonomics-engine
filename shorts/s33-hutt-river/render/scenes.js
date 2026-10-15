/* s33 Hutt River — "The Farmer Who Quit Australia"
 * SVG + renderFrame(t) motion graphics on real Commons photos. No Remotion.
 * Timing comes from ../transcript.json (Whisper word timestamps on audio/vo.mp3).
 * Images are served from /img/ (render.mjs builds a downscaled cache from ../images).
 */
(function () {
  const W = 1080;
  const H = 1920;
  const HS = window.HS;
  const { clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic, easeOutElastic } = HS;

  // ---------- palette & type ----------
  const C = {
    navy: '#0b1630',
    navy2: '#132447',
    gold: '#f2c14e',
    gold2: '#ffd978',
    cream: '#f6ecd6',
    red: '#d7263d',
    ink: '#101318',
    grey: '#3a414d',
    white: '#ffffff',
    flagBlue: '#000098',
  };
  const F = "Inter, 'Inter Display', 'Liberation Sans', Arial, sans-serif";

  // ---------- images (natural sizes) ----------
  const IM = {
    gate: { src: '/img/hrp3.jpg', w: 1728, h: 1152 },
    views: { src: '/img/oic_hutt_river_views.jpg', w: 1600, h: 1200 },
    paddock: { src: '/img/oic_hutt_river_prince_leonard_statue.jpg', w: 1600, h: 1200 },
    border: { src: '/img/border_of_hutt_river_province.jpg', w: 2816, h: 2112 },
    buildings: { src: '/img/oic_hutt_river_buildings.jpg', w: 1597, h: 1141 },
    bust: { src: '/img/prince_leonard_bust_14389745770_.jpg', w: 4907, h: 3252 },
    portrait: { src: '/img/leonard_casley_at_hutt_river_province_cropped_.jpg', w: 418, h: 542 },
    control: { src: '/img/passport_control_at_hutt_river_province.jpg', w: 2816, h: 2112 },
    controlBlur: { src: '/img/passport_control_at_hutt_river_province_blur.jpg', w: 2816, h: 2112 },
    coin30: { src: '/img/huttriverprovince_brx11_30dollars_1979.jpg', w: 948, h: 478 },
    coin5: { src: '/img/hutt_river_province_five_dollars_coin_1.jpg', w: 4000, h: 3000 },
    ukpass: { src: '/img/uk_passport_with_stamps_from_hutt_river_province.jpg', w: 2964, h: 3936 },
    visa: { src: '/img/visa_stamp_for_principality_of_hutt_river.jpg', w: 3814, h: 2598 },
    flag: { src: '/img/hutt_river_flag.svg', w: 375, h: 260 },
    seal: { src: '/img/hutt_river_seal.svg', w: 0, h: 0 },
  };

  // ---------- generic helpers ----------
  const esc = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const p01 = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const f1 = (n) => (Math.round(n * 10) / 10).toString();

  /** Full-bleed photo, cover-fit around a focal point (fx, fy in 0..1 of the image). */
  function cover(id, o = {}) {
    const im = IM[id];
    const zoom = o.zoom || 1.08;
    const s = Math.max(W / im.w, H / im.h) * zoom;
    const iw = im.w * s;
    const ih = im.h * s;
    let x = W / 2 - (o.fx != null ? o.fx : 0.5) * iw + (o.dx || 0);
    let y = H / 2 - (o.fy != null ? o.fy : 0.5) * ih + (o.dy || 0);
    x = clamp(x, W - iw, 0);
    y = clamp(y, H - ih, 0);
    const dim = o.dim != null ? o.dim : 0.4;
    return `<image href="${im.src}" x="${f1(x)}" y="${f1(y)}" width="${f1(iw)}" height="${f1(ih)}" preserveAspectRatio="none"/>
      ${o.tint ? `<rect width="${W}" height="${H}" fill="${o.tint}"/>` : ''}
      <rect width="${W}" height="${H}" fill="rgba(4,8,18,${dim})"/>
      <rect width="${W}" height="${H}" fill="url(#vig)"/>`;
  }

  /** Crop a normalised rect (rx,ry,rw,rh) of an image into a destination box. */
  function crop(id, r, x, y, w, h, extra = '') {
    const im = IM[id];
    return `<svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}"
      viewBox="${r[0] * im.w} ${r[1] * im.h} ${r[2] * im.w} ${r[3] * im.h}" preserveAspectRatio="xMidYMid slice" ${extra}>
      <image href="${im.src}" width="${im.w}" height="${im.h}"/></svg>`;
  }

  function text(x, y, s, o = {}) {
    return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${o.anchor || 'middle'}" font-family="${F}"
      font-size="${o.size || 48}" font-weight="${o.weight || 900}" fill="${o.fill || '#fff'}"
      ${o.stroke ? `stroke="${o.stroke}" stroke-width="${o.sw || 8}" paint-order="stroke" stroke-linejoin="round"` : ''}
      ${o.ls != null ? `letter-spacing="${o.ls}"` : ''} ${o.opacity != null ? `opacity="${o.opacity}"` : ''}
      ${o.italic ? 'font-style="italic"' : ''}>${esc(s)}</text>`;
  }

  /** Rounded label chip. */
  function chip(x, y, label, o = {}) {
    const size = o.size || 34;
    const w = o.w || label.length * size * 0.66 + 56;
    const h = size + 30;
    const fill = o.fill || C.gold;
    const col = o.color || C.ink;
    return `<g transform="translate(${f1(x)} ${f1(y)})">
      <rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${f1(w)}" height="${h}" rx="${h / 2}" fill="${fill}" filter="url(#sh)"/>
      ${text(0, size * 0.36, label, { size, fill: col, ls: o.ls != null ? o.ls : 1.5 })}
    </g>`;
  }

  /** Scale-pop wrapper. */
  function pop(cx, cy, k, inner, rot = 0) {
    if (k <= 0.001) return '';
    return `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${f1(rot)}) scale(${k.toFixed(3)}) translate(${f1(-cx)} ${f1(-cy)})">${inner}</g>`;
  }
  const popK = (t, at, d = 0.38) => (t < at ? 0 : easeOutBack(p01(t, at, at + d)));

  /** Rubber-stamp impression that slams in. */
  function stamp(cx, cy, lines, t, at, o = {}) {
    if (t < at) return '';
    const u = p01(t, at, at + 0.16);
    const k = lerp(o.from || 2.4, 1, easeOutCubic(u));
    const op = u < 1 ? 0.35 + 0.65 * u : 1;
    const col = o.color || C.red;
    const size = o.size || 72;
    const w = o.w || 640;
    const h = lines.length * size * 1.05 + 54;
    const rot = o.rot != null ? o.rot : -8;
    const tl = lines
      .map((ln, i) => text(0, -h / 2 + 30 + size * 0.86 + i * size * 1.05, ln, { size, fill: col, ls: 4 }))
      .join('');
    return `<g opacity="${op}" transform="translate(${cx} ${cy}) rotate(${rot}) scale(${k.toFixed(3)})" filter="url(#rough)">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="14" fill="none" stroke="${col}" stroke-width="10"/>
      <rect x="${-w / 2 + 16}" y="${-h / 2 + 16}" width="${w - 32}" height="${h - 32}" rx="8" fill="none" stroke="${col}" stroke-width="4"/>
      ${tl}
    </g>`;
  }

  /** Photo card with white border and shadow. */
  function card(id, r, cx, cy, w, h, rot, k = 1, pad = 14) {
    if (k <= 0.001) return '';
    return `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${f1(rot)}) scale(${k.toFixed(3)})">
      <rect x="${f1(-w / 2 - pad)}" y="${f1(-h / 2 - pad)}" width="${f1(w + pad * 2)}" height="${f1(h + pad * 2)}" rx="6" fill="${C.cream}" filter="url(#sh)"/>
      ${crop(id, r, -w / 2, -h / 2, w, h)}
    </g>`;
  }

  /** Tear-off calendar card. */
  function calendar(x, y, month, day, year, k = 1, flip = 1) {
    if (k <= 0.001) return '';
    const w = 270;
    const h = 300;
    return `<g transform="translate(${x + w / 2} ${y}) scale(${k.toFixed(3)}) translate(${-w / 2} 0)" filter="url(#sh)">
      <rect x="0" y="0" width="${w}" height="${h}" rx="16" fill="${C.cream}"/>
      <path d="M0 16 a16 16 0 0 1 16 -16 h${w - 32} a16 16 0 0 1 16 16 v58 h-${w} z" fill="${C.red}"/>
      ${text(w / 2, 52, month, { size: 36, fill: '#fff', ls: 4 })}
      <g transform="translate(0 ${74}) scale(1 ${flip.toFixed(3)})">
        ${text(w / 2, 150, day, { size: 150, fill: C.ink })}
      </g>
      ${text(w / 2, h - 22, year, { size: 38, fill: C.grey, ls: 3 })}
      <circle cx="70" cy="8" r="9" fill="${C.ink}"/><circle cx="${w - 70}" cy="8" r="9" fill="${C.ink}"/>
    </g>`;
  }

  /** Waving flag made of vertical strips (each strip offset on a sine). */
  function wavingFlag(x, y, w, t, amp = 10, opacity = 1) {
    const h = (w * IM.flag.h) / IM.flag.w;
    const N = 14;
    let s = '';
    for (let i = 0; i < N; i++) {
      const u = i / N;
      const off = Math.sin(t * 5.2 - u * 6.5) * amp * u;
      const shade = 0.1 + 0.1 * Math.sin(t * 5.2 - u * 6.5 + 1.2);
      const sw = w / N;
      s += `<svg x="${f1(x + i * sw)}" y="${f1(y + off)}" width="${f1(sw + 0.8)}" height="${f1(h)}"
        viewBox="${(u * IM.flag.w).toFixed(2)} 0 ${(IM.flag.w / N + 0.8).toFixed(2)} ${IM.flag.h}" preserveAspectRatio="none">
        <image href="${IM.flag.src}" width="${IM.flag.w}" height="${IM.flag.h}"/></svg>
        <rect x="${f1(x + i * sw)}" y="${f1(y + off)}" width="${f1(sw + 0.8)}" height="${f1(h)}" fill="rgba(0,0,0,${shade.toFixed(3)})"/>`;
    }
    return `<g opacity="${opacity}" filter="url(#sh)">${s}</g>`;
  }

  function flagpole(x, top, base) {
    return `<rect x="${x - 7}" y="${top}" width="14" height="${base - top}" rx="7" fill="url(#pole)"/>
      <circle cx="${x}" cy="${top - 10}" r="18" fill="${C.gold}" stroke="#a37a1c" stroke-width="3"/>
      <ellipse cx="${x}" cy="${base}" rx="60" ry="12" fill="rgba(0,0,0,0.35)"/>`;
  }

  function topShade(h = 760, a = 0.78) {
    return `<rect x="0" y="0" width="${W}" height="${h}" fill="url(#topfade)" opacity="${a}"/>`;
  }

  // ---------- map ----------
  const MAP = () => window.S33_MAP;
  const KX = 111.32 * Math.cos((-27 * Math.PI) / 180);
  const KY = 110.57;
  const projKm = (lon, lat) => [(lon - 134) * KX, -(lat + 27) * KY];

  function mapGroup(cam, opts = {}) {
    // cam: {cx, cy (km), s (px/km), sx, sy (screen anchor)}
    const m = MAP();
    const tx = cam.sx - cam.cx * cam.s;
    const ty = cam.sy - cam.cy * cam.s;
    const sw = 1.6 / cam.s;
    let states = '';
    for (const [name, d] of Object.entries(m.states)) {
      const wa = name === 'Western Australia';
      const fill = opts.fill ? opts.fill(name) : wa ? '#e7d29e' : '#2b3d58';
      const stroke = opts.stroke ? opts.stroke(name) : wa ? C.gold : '#4a6286';
      states += `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${(wa ? 2.4 : 1.4) / cam.s}" stroke-linejoin="round"/>`;
    }
    return { g: `<g transform="translate(${f1(tx)} ${f1(ty)}) scale(${cam.s.toFixed(5)})">${states}</g>`, tx, ty, sw };
  }
  const toScreen = (cam, km) => [cam.sx + (km[0] - cam.cx) * cam.s, cam.sy + (km[1] - cam.cy) * cam.s];

  function graticule(cam, op = 0.18) {
    let s = '';
    for (let lon = 100; lon <= 160; lon += 2) {
      const a = toScreen(cam, projKm(lon, -5));
      const b = toScreen(cam, projKm(lon, -45));
      s += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}"/>`;
    }
    for (let lat = -6; lat >= -44; lat -= 2) {
      const a = toScreen(cam, projKm(100, lat));
      const b = toScreen(cam, projKm(160, lat));
      s += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}"/>`;
    }
    return `<g stroke="#7fa6d6" stroke-width="1" opacity="${op}">${s}</g>`;
  }

  function pin(x, y, k, col = C.red) {
    if (k <= 0.001) return '';
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${k.toFixed(3)})" filter="url(#sh)">
      <path d="M0 0 C -6 -14 -24 -30 -24 -48 a24 24 0 0 1 48 0 C 24 -30 6 -14 0 0 Z" fill="${col}" stroke="#fff" stroke-width="4"/>
      <circle cx="0" cy="-48" r="9" fill="#fff"/></g>`;
  }

  // ---------- word timings ----------
  let WORDS = [];
  const wAt = (needle, from = 0) => {
    const i = WORDS.findIndex((w, k) => k >= from && w.word.toLowerCase().replace(/[^a-z0-9]/g, '') === needle);
    return i >= 0 ? WORDS[i] : null;
  };

  // ======================================================================
  // SCENES
  // ======================================================================

  // A. Hook — gate photo, frame-1 hook, border ring closes round the farm.
  const GATE_CAM = (l) => ({ zoom: 1.1 + l * 0.01, fx: 0.6, fy: 0.56, dim: 0.22 });
  function hookChip(op, yearOnly = false) {
    const k = 1;
    return `<g opacity="${op}">${chip(540, 640, yearOnly ? '1970' : 'WESTERN AUSTRALIA  ·  1970', { size: 36, fill: C.navy, color: C.gold, w: yearOnly ? 220 : 640 })}</g>`;
  }
  function sceneHook(t, l) {
    const quit = 2.66;
    const out = p01(t, 2.45, 2.85);
    const breathe = 1 + 0.012 * Math.sin(t * 3.2);
    const hookY = -easeInOutCubic(out) * 120;
    const hookOp = 1 - out;
    const under = 0.25 + 0.75 * easeOutCubic(p01(t, 0.0, 0.7));

    // ring around the farm road
    const ringU = easeInOutCubic(p01(t, quit, quit + 0.75));
    const R = 270;
    const cx = 540;
    const cy = 990;
    const circ = 2 * Math.PI * R;
    const maskOp = 0.5 * easeOutCubic(p01(t, quit + 0.3, quit + 1.1));
    const ringBreath = 1 + 0.01 * Math.sin(t * 4);
    let ticks = '';
    if (ringU > 0) {
      const n = 28;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        if (i / n > ringU) break;
        const x1 = cx + Math.cos(a) * (R - 14);
        const y1 = cy + Math.sin(a) * (R - 14);
        const x2 = cx + Math.cos(a) * (R + 14);
        const y2 = cy + Math.sin(a) * (R + 14);
        ticks += `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`;
      }
    }
    const farmLbl = popK(t, 3.75, 0.4);
    return (
      cover('gate', GATE_CAM(t)) +
      topShade(820, 0.85) +
      // outside-the-border darkening
      (maskOp > 0
        ? `<path fill-rule="evenodd" fill="rgba(10,0,0,${maskOp.toFixed(3)})" d="M0 0H${W}V${H}H0Z M${cx - R} ${cy} a${R} ${R} 0 1 0 ${R * 2} 0 a${R} ${R} 0 1 0 ${-R * 2} 0Z"/>`
        : '') +
      (ringU > 0
        ? `<g transform="translate(${cx} ${cy}) scale(${ringBreath}) translate(${-cx} ${-cy})">
          <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.red}" stroke-width="10"
            stroke-dasharray="${f1(circ)}" stroke-dashoffset="${f1(circ * (1 - ringU))}" transform="rotate(-90 ${cx} ${cy})" filter="url(#glow)"/>
          ${ticks}</g>`
        : '') +
      pop(540, cy - R - 2, farmLbl, chip(540, cy - R - 2, 'HIS FARM', { size: 34, fill: C.red, color: '#fff', w: 250 })) +
      (hookOp > 0
        ? `<g opacity="${hookOp}" transform="translate(0 ${hookY}) translate(540 430) scale(${breathe.toFixed(4)}) translate(-540 -430)">
            ${text(540, 380, 'HE LEFT AUSTRALIA.', { size: 84, fill: '#fff', stroke: C.ink, sw: 12, ls: 1 })}
            ${text(540, 496, 'WITHOUT MOVING.', { size: 98, fill: C.gold, stroke: C.ink, sw: 12, ls: 1 })}
            <rect x="${540 - 380 * under}" y="528" width="${760 * under}" height="10" rx="5" fill="${C.red}"/>
          </g>`
        : '') +
      hookChip(1)
    );
  }

  // B. Leonard Casley + 4,000 ha → ~40 ha quota grid.
  function sceneWheat(t, l) {
    const tFour = 6.9;
    const tQuota = 10.66;
    const tForty = 12.42;
    const pk = popK(t, 5.62, 0.5);
    const drop = (1 - easeOutCubic(p01(t, 5.62, 6.1))) * -260;
    const pw = 330;
    const ph = (pw * IM.portrait.h) / IM.portrait.w;
    const portrait =
      pk > 0
        ? `<g transform="translate(540 ${420 + drop}) rotate(${f1(-3 + Math.sin(l * 1.3) * 0.8)})" opacity="${clamp(pk, 0, 1)}">
          <rect x="${-pw / 2 - 18}" y="${-ph / 2 - 18}" width="${pw + 36}" height="${ph + 100}" rx="6" fill="${C.cream}" filter="url(#sh)"/>
          ${crop('portrait', [0, 0, 1, 1], -pw / 2, -ph / 2, pw, ph)}
          ${text(0, ph / 2 + 58, 'LEONARD CASLEY', { size: 36, fill: C.navy, ls: 2 })}
        </g>`
        : '';

    // 10x10 grid
    const gx = 86;
    const gy = 800;
    const cs = 37;
    const gap = 4;
    let cells = '';
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const keep = r === 9 && c === 0;
        const fillAt = tFour + ((r + c) / 18) * 1.0;
        const fu = easeOutCubic(p01(t, fillAt, fillAt + 0.25));
        const greyAt = tQuota + ((18 - (r + c)) / 18) * 0.9;
        const gu = keep ? 0 : easeOutCubic(p01(t, greyAt, greyAt + 0.25));
        const x = gx + c * (cs + gap);
        const y = gy + r * (cs + gap);
        const col = gu > 0 ? `rgb(${Math.round(lerp(242, 58, gu))},${Math.round(lerp(193, 65, gu))},${Math.round(lerp(78, 77, gu))})` : C.gold;
        const glow = keep && t > tQuota + 0.6 ? 0.5 + 0.5 * Math.sin(t * 7) : 0;
        cells += `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" rx="6" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.28)" stroke-width="2"/>`;
        if (fu > 0)
          cells += `<rect x="${f1(x + (cs / 2) * (1 - fu))}" y="${f1(y + (cs / 2) * (1 - fu))}" width="${f1(cs * fu)}" height="${f1(cs * fu)}" rx="6" fill="${col}"
            ${keep && glow ? `stroke="#fff" stroke-width="${f1(2 + glow * 3)}" filter="url(#glow)"` : ''}/>`;
        // wheat stalk glyph
        if (fu > 0.6 && gu < 0.5)
          cells += `<path d="M${x + cs / 2} ${y + cs - 7} V${y + 9} M${x + cs / 2} ${y + 14} l-6 -5 M${x + cs / 2} ${y + 14} l6 -5 M${x + cs / 2} ${y + 21} l-6 -5 M${x + cs / 2} ${y + 21} l6 -5"
            stroke="rgba(110,70,0,0.55)" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
      }
    }
    const gridIn = easeOutCubic(p01(t, 6.6, 7.0));
    const grid = gridIn > 0 ? `<g opacity="${gridIn}" transform="translate(0 ${(1 - gridIn) * 40})">${cells}</g>` : '';

    // counter
    const cU = easeOutCubic(p01(t, tFour, tFour + 1.0));
    const val = Math.round(cU * 4000);
    const q = easeInOutCubic(p01(t, tQuota, tQuota + 0.5));
    const bigY = lerp(990, 878, q);
    const bigS = lerp(124, 66, q);
    const counter =
      t >= tFour - 0.05
        ? `<g opacity="${gridIn}">
          ${text(770, bigY, val.toLocaleString('en-AU'), { size: bigS, fill: q > 0 ? `rgba(242,193,78,${1 - 0.45 * q})` : C.gold, stroke: C.ink, sw: 8 })}
          ${text(770, lerp(1056, 922, q), 'HECTARES OF WHEAT', { size: lerp(38, 26, q), fill: '#fff', ls: 2, stroke: C.ink, sw: 6, opacity: 1 - 0.4 * q })}
          ${q > 0 ? `<line x1="${f1(770 - 170 * q)}" y1="${f1(bigY - 22)}" x2="${f1(770 + 170 * q)}" y2="${f1(bigY - 22)}" stroke="${C.red}" stroke-width="9" stroke-linecap="round"/>` : ''}
        </g>`
        : '';
    const fk = popK(t, tForty, 0.45);
    const forty =
      fk > 0
        ? pop(
            770,
            1050,
            fk,
            `${text(770, 1068, '≈ 40', { size: 132, fill: C.gold, stroke: C.ink, sw: 9 })}
             ${text(770, 1126, 'HECTARES SELLABLE', { size: 34, fill: '#fff', ls: 2, stroke: C.ink, sw: 6 })}`
          ) +
          // leader from the kept cell
          `<path d="M${gx + cs + 4} ${gy + 9 * (cs + gap) + cs / 2} C 560 ${gy + 9 * (cs + gap) + cs / 2}, 560 1050, 600 1040" fill="none" stroke="${C.gold}" stroke-width="4"
            stroke-dasharray="600" stroke-dashoffset="${f1(600 * (1 - easeOutCubic(p01(t, tForty, tForty + 0.5))))}"/>`
        : '';
    const quotaChip = pop(770, 790, popK(t, tQuota, 0.35), chip(770, 790, 'GOVERNMENT QUOTA', { size: 30, fill: C.red, color: '#fff', w: 400 }));

    return (
      cover('views', { zoom: 1.12 + l * 0.006, fx: 0.5, fy: 0.55, dim: 0.55, tint: 'rgba(80,50,0,0.12)' }) +
      portrait +
      grid +
      counter +
      quotaChip +
      forty
    );
  }

  // C. 21 April 1970 — calendar flips, flag rises over the paddock.
  const PADDOCK = (l, extra = {}) => Object.assign({ zoom: 1.32, fx: 0.72, fy: 0.3, dim: 0.3 }, extra);
  function sceneDeclare(t, l) {
    const tDay = 14.0;
    const tDeclared = 15.24;
    const tCountry = 16.24;
    // calendar: 19 → 20 → 21
    const ck = popK(t, 13.5, 0.35);
    const days = ['19', '20', '21'];
    const di = t < 13.75 ? 0 : t < tDay ? 1 : 2;
    const flipStart = di === 0 ? 13.5 : di === 1 ? 13.75 : tDay;
    const flip = di === 0 ? 1 : easeOutBack(p01(t, flipStart, flipStart + 0.18));
    const cal = calendar(70, 210, 'APRIL', days[di], '1970', ck, Math.max(0.05, flip));

    const poleX = 610;
    const top = 380;
    const base = 1180;
    const fw = 340;
    const fh = (fw * IM.flag.h) / IM.flag.w;
    const rise = easeOutCubic(p01(t, tDeclared, tDeclared + 1.1));
    const fy = lerp(base - fh - 10, top + 8, rise);
    const flag = t >= tDeclared - 0.05 ? wavingFlag(poleX + 6, fy, fw, t, 9) : '';

    const rays = easeOutCubic(p01(t, tCountry, tCountry + 0.5));
    let rayG = '';
    if (rays > 0) {
      const cx = poleX + fw / 2;
      const cy = top + fh / 2;
      let r = '';
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * 360 + t * 18;
        r += `<path d="M0 0 L 900 -60 L 900 60 Z" transform="rotate(${f1(a)})"/>`;
      }
      rayG = `<g transform="translate(${cx} ${cy})" fill="${C.gold}" opacity="${(0.16 * rays).toFixed(3)}">${r}</g>`;
    }
    const tag = pop(780, top + fh + 70, popK(t, tCountry, 0.4), chip(780, top + fh + 70, 'HUTT RIVER PROVINCE', { size: 30, fill: C.navy, color: C.gold, w: 440 }));
    return cover('paddock', PADDOCK(l, { zoom: 1.32 + l * 0.01 })) + topShade(600, 0.6) + rayG + flagpole(poleX, top, base) + flag + tag + cal;
  }

  // D. Map — Australia → zoom to WA coast; farm pin, 75 km², ~500 km to Perth.
  function sceneMap(t, l) {
    const m = MAP();
    if (!m) return '';
    const farm = m.pts.farm;
    const perth = m.pts.perth;
    const camA = { cx: 0, cy: 380, s: 0.235, sx: 540, sy: 720 };
    const reg = projKm(115.25, -29.95);
    const camB = { cx: reg[0], cy: reg[1], s: 1.92, sx: 540, sy: 720 };
    const z = easeInOutCubic(p01(t, 18.55, 19.55));
    const s = Math.exp(lerp(Math.log(camA.s), Math.log(camB.s), z));
    const w = (s - camA.s) / (camB.s - camA.s);
    const cam = { cx: lerp(camA.cx, camB.cx, w), cy: lerp(camA.cy, camB.cy, w), s, sx: 540, sy: 720 };

    const mg = mapGroup(cam);
    const fS = toScreen(cam, farm);
    const pS = toScreen(cam, perth);
    const gS = toScreen(cam, m.pts.geraldton);
    const kS = toScreen(cam, m.pts.kalbarri);

    // farm pin + name
    const fk = popK(t, 17.82, 0.45);
    const nameY = fS[1] - 92;
    const name = pop(
      clamp(fS[0] + 250, 330, 760),
      nameY,
      fk,
      chip(clamp(fS[0] + 250, 330, 760), nameY, 'HUTT RIVER PROVINCE', { size: 34, fill: C.gold, color: C.ink, w: 500 })
    );
    // farm area at true scale (circle of equal area, 75 km²) + callout
    const rKm = Math.sqrt(75 / Math.PI);
    const areaU = p01(t, 19.26, 19.6);
    const pulse = 1 + 0.25 * Math.sin(t * 6) * areaU;
    const area =
      z > 0.95
        ? `<circle cx="${f1(fS[0])}" cy="${f1(fS[1])}" r="${f1(rKm * cam.s * pulse)}" fill="${C.red}" stroke="#fff" stroke-width="3" opacity="${0.4 + 0.6 * areaU}"/>`
        : '';
    const areaChip = pop(fS[0] + 150, fS[1] + 70, popK(t, 19.26, 0.4), chip(fS[0] + 150, fS[1] + 70, '75 KM²', { size: 40, fill: '#fff', color: C.ink, w: 220 }));

    // Perth + route line
    const perthK = popK(t, 21.1, 0.45);
    const lineU = easeInOutCubic(p01(t, 21.2, 22.3));
    const len = Math.hypot(pS[0] - fS[0], pS[1] - fS[1]);
    const route =
      lineU > 0
        ? `<line x1="${f1(pS[0])}" y1="${f1(pS[1])}" x2="${f1(lerp(pS[0], fS[0], lineU))}" y2="${f1(lerp(pS[1], fS[1], lineU))}"
          stroke="#fff" stroke-width="6" stroke-dasharray="4 16" stroke-linecap="round"/>`
        : '';
    const mid = [(pS[0] + fS[0]) / 2, (pS[1] + fS[1]) / 2];
    const distK = popK(t, 21.75, 0.4);
    const dist = pop(mid[0] + 190, mid[1], distK, chip(mid[0] + 190, mid[1], '≈ 500 KM', { size: 44, fill: C.navy, color: C.gold, w: 290 }));
    const perthLbl = pop(pS[0] + 150, pS[1] - 30, popK(t, 22.6, 0.35), chip(pS[0] + 150, pS[1] - 30, 'PERTH', { size: 34, fill: '#fff', color: C.ink, w: 180 }));

    // faint context labels once zoomed
    const ctxOp = 0.85 * easeOutCubic(p01(t, 19.4, 19.9));
    const ctx =
      ctxOp > 0
        ? `<g opacity="${ctxOp}">
          <circle cx="${f1(gS[0])}" cy="${f1(gS[1])}" r="7" fill="#fff"/>${text(gS[0] + 18, gS[1] + 10, 'Geraldton', { size: 28, weight: 600, anchor: 'start', fill: '#e9eef7', stroke: C.navy, sw: 5 })}
          
          ${text(200, 900, 'INDIAN OCEAN', { size: 30, weight: 700, fill: '#8fb3e0', ls: 6, italic: true })}
          ${text(860, 520, 'WESTERN', { size: 30, weight: 800, fill: 'rgba(16,19,24,0.55)', ls: 6 })}
          ${text(860, 556, 'AUSTRALIA', { size: 30, weight: 800, fill: 'rgba(16,19,24,0.55)', ls: 6 })}
        </g>`
        : '';
    const waLbl = 1 - easeOutCubic(p01(t, 18.4, 18.8));
    const aus =
      false && waLbl > 0
        ? `<g opacity="${waLbl * easeOutCubic(p01(t, 17.5, 17.8))}">${text(330, 640, 'WA', { size: 60, fill: 'rgba(16,19,24,0.6)', ls: 4 })}</g>`
        : '';
    // compass/scale bar after zoom
    const sb = ctxOp > 0 ? `<g opacity="${ctxOp}" transform="translate(110 1180)">
        <rect x="0" y="0" width="${f1(100 * cam.s)}" height="10" fill="#fff"/><rect x="0" y="0" width="${f1(50 * cam.s)}" height="10" fill="${C.ink}" stroke="#fff" stroke-width="2"/>
        ${text(0, -14, '0', { size: 24, weight: 700, anchor: 'start', fill: '#fff' })}${text(100 * cam.s, -14, '100 km', { size: 24, weight: 700, anchor: 'middle', fill: '#fff' })}</g>` : '';

    return (
      `<rect width="${W}" height="${H}" fill="url(#ocean)"/>` +
      graticule(cam) +
      mg.g +
      `<rect width="${W}" height="${H}" fill="url(#vig)"/>` +
      ctx +
      aus +
      area +
      route +
      pin(pS[0], pS[1], perthK, '#ffffff') +
      pin(fS[0], fS[1], fk) +
      name +
      areaChip +
      dist +
      perthLbl +
      sb
    );
  }

  // E. Prince Leonard — bust, crown drops, brass plaque.
  const CROWN_Y = 560;
  function scenePrince(t, l) {
    const tPrince = 24.76;
    const ck = easeOutCubic(p01(t, tPrince - 0.05, tPrince + 0.35));
    const bounce = t > tPrince + 0.3 ? easeOutElastic(p01(t, tPrince + 0.3, tPrince + 0.9)) : 0;
    const crownY = lerp(-220, 0, ck) + (1 - bounce) * (t > tPrince + 0.3 ? -14 : 0);
    const crown =
      t > tPrince - 0.05
        ? `<g transform="translate(540 ${f1(CROWN_Y + crownY)}) rotate(${f1(-6 + 2 * Math.sin(t * 3))}) scale(1.25)" filter="url(#sh)">
          <path d="M-120 60 L-138 -40 L-70 10 L0 -70 L70 10 L138 -40 L120 60 Z" fill="${C.gold}" stroke="#8a6512" stroke-width="6" stroke-linejoin="round"/>
          <rect x="-124" y="52" width="248" height="34" rx="8" fill="${C.gold2}" stroke="#8a6512" stroke-width="6"/>
          <circle cx="0" cy="-74" r="14" fill="${C.red}" stroke="#8a6512" stroke-width="4"/>
          <circle cx="-138" cy="-44" r="11" fill="#fff" stroke="#8a6512" stroke-width="4"/>
          <circle cx="138" cy="-44" r="11" fill="#fff" stroke="#8a6512" stroke-width="4"/>
          <circle cx="0" cy="69" r="10" fill="${C.flagBlue}"/><circle cx="-62" cy="69" r="8" fill="${C.red}"/><circle cx="62" cy="69" r="8" fill="${C.red}"/>
        </g>`
        : '';
    const pk = popK(t, tPrince + 0.15, 0.45);
    const plaque = pop(
      540,
      250,
      pk,
      `<g filter="url(#sh)"><rect x="170" y="180" width="740" height="140" rx="14" fill="url(#brass)" stroke="#6b4e10" stroke-width="5"/>
        <rect x="186" y="196" width="708" height="108" rx="8" fill="none" stroke="rgba(80,55,10,0.6)" stroke-width="3"/>
        ${text(540, 278, 'PRINCE LEONARD', { size: 68, fill: '#3b2a07', ls: 5 })}</g>`
    );
    const flash = t > tPrince && t < tPrince + 0.25 ? `<rect width="${W}" height="${H}" fill="#fff" opacity="${(0.35 * (1 - p01(t, tPrince, tPrince + 0.25))).toFixed(3)}"/>` : '';
    return cover('bust', { zoom: 1.35 + l * 0.02, fx: 0.415, fy: 0.62, dim: 0.22 }) + topShade(520, 0.6) + crown + plaque + flash;
  }

  // F. Stamps, coins, passports — artefact collage on a blurred passport desk.
  function sceneCollection(t, l) {
    const tStamps = 26.66;
    const tMinted = 27.58;
    const tCoins = 28.18;
    const tIssued = 29.06;
    const tPass = 29.68;
    // stamps card (passport-control desk with postage stamps)
    const sk = popK(t, 25.5, 0.45);
    const sx = lerp(-300, 330, easeOutCubic(p01(t, 25.5, 25.95)));
    const stampsCard = card('control', [0.55, 0.74, 0.36, 0.26], sx, 420, 560, 340, -5, Math.min(1, sk + 0.0001));
    const postmark =
      t >= tStamps
        ? `<g opacity="${(0.85 * p01(t, tStamps, tStamps + 0.08)).toFixed(3)}" transform="translate(470 520) rotate(-14) scale(${f1(lerp(1.8, 1, easeOutCubic(p01(t, tStamps, tStamps + 0.14))))})">
          <circle r="82" fill="none" stroke="${C.ink}" stroke-width="6"/><circle r="64" fill="none" stroke="${C.ink}" stroke-width="3"/>
          ${text(0, -14, 'HUTT RIVER', { size: 22, fill: C.ink, ls: 2 })}${text(0, 16, 'PROVINCE', { size: 22, fill: C.ink, ls: 2 })}
          ${[0, 1, 2, 3].map((i) => `<path d="M95 ${-30 + i * 20} q 30 -14 60 0 t 60 0 t 60 0" fill="none" stroke="${C.ink}" stroke-width="5"/>`).join('')}
        </g>`
        : '';

    // coins (flip in)
    function coin(id, cxN, cyN, rN, x, y, r, at) {
      if (t < at) return '';
      const u = p01(t, at, at + 0.55);
      const sxk = Math.cos((1 - easeOutCubic(u)) * Math.PI * 3);
      const k = easeOutBack(p01(t, at, at + 0.4));
      const im = IM[id];
      const cid = `cc_${id}`;
      const rotY = sxk;
      return `<g transform="translate(${x} ${y + (1 - k) * -120}) scale(${f1(rotY * k)} ${k.toFixed(3)})" filter="url(#sh)">
        <clipPath id="${cid}"><circle r="${r}"/></clipPath>
        <g clip-path="url(#${cid})">${crop(id, [cxN - rN, cyN - (rN * im.w) / im.h, rN * 2, (rN * 2 * im.w) / im.h], -r, -r, r * 2, r * 2)}</g>
        <circle r="${r}" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="4"/>
      </g>`;
    }
    const coins =
      coin('coin30', 0.245, 0.5, 0.236, 800, 560, 175, tMinted) + coin('coin5', 0.522, 0.468, 0.345, 610, 820, 130, tCoins);

    // passport + visa stamp
    const pu = easeOutCubic(p01(t, tIssued, tIssued + 0.5));
    const passport = t >= tIssued ? card('ukpass', [0.05, 0.03, 0.9, 0.94], 400, lerp(1700, 960, pu), 360, 478, 4, 1) : '';
    const vk = t >= tPass ? lerp(2.2, 1, easeOutCubic(p01(t, tPass, tPass + 0.16))) : 0;
    const visa =
      vk > 0
        ? `<g transform="translate(770 1010) rotate(-7) scale(${vk.toFixed(3)})" opacity="${p01(t, tPass, tPass + 0.08)}">
          ${card('visa', [0.27, 0.05, 0.5, 0.34], 0, 0, 380, 250, 0, 1, 10)}</g>`
        : '';
    return (
      cover('controlBlur', { zoom: 1.08 + l * 0.01, fx: 0.5, fy: 0.5, dim: 0.62 }) +
      `<image href="${IM.seal.src}" x="140" y="560" width="800" height="800" opacity="0.07" transform="rotate(${f1(l * 6)} 540 960)"/>` +
      stampsCard +
      postmark +
      coins +
      passport +
      visa
    );
  }

  // G. 1977 war — tiny flag vs the continent; hostilities ceased.
  function sceneWar(t, l) {
    const m = MAP();
    const tWar = 32.38;
    const tOff = 34.1;
    const red = easeOutCubic(p01(t, tWar, tWar + 0.4)) * (1 - easeOutCubic(p01(t, tOff + 0.4, tOff + 1.2)));
    const shake = t > tWar + 0.3 && t < tWar + 0.9 ? Math.sin(t * 90) * 10 * (1 - p01(t, tWar + 0.3, tWar + 0.9)) : 0;
    const cam = { cx: 60, cy: 330, s: 0.205, sx: 560 + shake, sy: 800 };
    const ak = easeOutCubic(p01(t, 31.2, 31.8));
    const mg = mapGroup(cam, {
      fill: () => `rgba(${Math.round(lerp(45, 150, red))},${Math.round(lerp(61, 30, red))},${Math.round(lerp(88, 40, red))},0.92)`,
      stroke: () => 'rgba(255,255,255,0.35)',
    });
    const fS = toScreen(cam, m.pts.farm);
    const dot = `<circle cx="${f1(fS[0])}" cy="${f1(fS[1])}" r="${f1(9 + 3 * Math.sin(t * 8))}" fill="${C.gold}" stroke="#fff" stroke-width="3"/>`;
    const fw = 120;
    const fh = (fw * IM.flag.h) / IM.flag.w;
    const tinyFlag = `<line x1="${f1(fS[0])}" y1="${f1(fS[1])}" x2="${f1(fS[0])}" y2="${f1(fS[1] - 150)}" stroke="#ddd" stroke-width="5"/>` + wavingFlag(fS[0] + 2, fS[1] - 150, fw, t, 4);
    const date = pop(540, 260, popK(t, 30.84, 0.4), chip(540, 260, '2 DECEMBER 1977', { size: 44, fill: C.red, color: '#fff', w: 520 }));
    const vsK = popK(t, tWar + 0.1, 0.4);
    const labels =
      ak > 0
        ? `<g opacity="${ak}">
          ${text(fS[0] + 10, fS[1] + 70, 'HUTT RIVER', { size: 30, fill: C.gold, stroke: C.ink, sw: 7, ls: 2 })}
          <g opacity="${(1 - p01(t, 34.45, 34.65)).toFixed(3)}">${text(650 + shake, 820, 'AUSTRALIA', { size: 54, fill: '#fff', stroke: C.ink, sw: 8, ls: 4 })}</g>
        </g>`
        : '';
    const vs = pop(330, 560, vsK, `<circle cx="330" cy="560" r="62" fill="${C.ink}" stroke="${C.gold}" stroke-width="6"/>${text(330, 580, 'VS', { size: 54, fill: C.gold })}`);
    const ceased = stamp(690, 900, ['HOSTILITIES', 'CEASED'], t, 34.6, { size: 70, w: 660, color: '#ffffff', rot: -9 });
    return (
      cover('buildings', { zoom: 1.1 + l * 0.008, fx: 0.45, fy: 0.5, dim: 0.62, dx: shake }) +
      `<rect width="${W}" height="${H}" fill="rgba(170,0,20,${(0.28 * red).toFixed(3)})"/>` +
      `<g opacity="${ak}" transform="translate(0 ${(1 - ak) * 40})">${mg.g}</g>` +
      (ak > 0 ? dot + tinyFlag : '') +
      labels +
      vs +
      date +
      ceased
    );
  }

  // H. Never recognised (globe 0) → tax counter → UNPAID.
  function globe(cx, cy, r, t, op) {
    let mer = '';
    for (let i = 0; i < 6; i++) {
      const ph = (i / 6) * Math.PI + t * 0.9;
      const rx = Math.abs(Math.cos(ph)) * r;
      mer += `<ellipse cx="${cx}" cy="${cy}" rx="${f1(rx)}" ry="${r}"/>`;
    }
    let par = '';
    for (let j = -2; j <= 2; j++) {
      const y = cy + (j * r) / 3;
      const rx = Math.sqrt(Math.max(0, r * r - ((j * r) / 3) ** 2));
      par += `<ellipse cx="${cx}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(rx * 0.12)}"/>`;
    }
    return `<g opacity="${op}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(11,22,48,0.75)" stroke="#8fb3e0" stroke-width="4"/>
      <g fill="none" stroke="rgba(143,179,224,0.45)" stroke-width="2.5">${mer}${par}</g></g>`;
  }
  function sceneTax(t, l) {
    const tNo = 36.26;
    const tTax = 38.38;
    const tUnpaid = 41.4;
    const gk = popK(t, tNo - 0.05, 0.45);
    const mv = easeInOutCubic(p01(t, tTax - 0.25, tTax + 0.3));
    const gx = 540;
    const gy = lerp(640, 330, mv);
    const gr = lerp(250, 135, mv);
    const zero = gk > 0
      ? pop(gx, gy, gk, globe(gx, gy, gr, t, 1) + text(gx, gy + gr * 0.36, '0', { size: gr * 1.05, fill: C.gold, stroke: C.ink, sw: 10 }))
      : '';
    const lblOp = easeOutCubic(p01(t, tNo + 0.3, tNo + 0.7));
    const lbl =
      lblOp > 0
        ? `<g opacity="${lblOp}">${text(gx, gy + gr + lerp(70, 54, mv), 'COUNTRIES RECOGNISING IT', { size: lerp(40, 30, mv), fill: '#fff', ls: 3, stroke: C.ink, sw: 7 })}</g>`
        : '';

    // tax ledger
    const lk = easeOutCubic(p01(t, tTax, tTax + 0.45));
    let ledger = '';
    if (lk > 0) {
      const u = p01(t, tTax + 0.1, tUnpaid);
      const v = Math.round((Math.pow(u, 2.6) * 2700000) / 1000) * 1000 + (u < 1 ? Math.floor((t * 7919) % 997) : 0);
      const digits = 'A$' + Math.min(2700000, v).toLocaleString('en-AU');
      const done = t >= tUnpaid;
      ledger = `<g opacity="${lk}" transform="translate(0 ${(1 - lk) * 60})">
        <rect x="90" y="610" width="900" height="420" rx="22" fill="rgba(246,236,214,0.97)" filter="url(#sh)"/>
        <rect x="90" y="610" width="900" height="86" rx="22" fill="${C.navy}"/><rect x="90" y="670" width="900" height="26" fill="${C.navy}"/>
        ${text(540, 668, 'TAX OWED', { size: 40, fill: C.gold, ls: 8 })}
        ${[0, 1, 2, 3].map((i) => `<line x1="140" x2="940" y1="${760 + i * 62}" y2="${760 + i * 62}" stroke="rgba(16,19,24,0.08)" stroke-width="3"/>`).join('')}
        ${text(540, 870, digits, { size: 108, fill: done ? C.red : C.ink, ls: 1 })}
        ${done ? text(540, 960, 'LEONARD CASLEY · WA SUPREME COURT, 2017', { size: 28, weight: 700, fill: C.grey, ls: 1 }) : ''}
      </g>`;
    }
    const unpaid = stamp(540, 1150, ['UNPAID'], t, tUnpaid, { size: 96, w: 520, rot: -7 });
    return cover('border', { zoom: 1.1 + l * 0.01, fx: 0.35, fy: 0.45, dim: 0.58, tint: 'rgba(20,40,70,0.25)' }) + zero + lbl + ledger + unpaid;
  }

  // I. 2020 — flag comes down.
  function sceneHandback(t, l) {
    const t2020 = 42.44;
    const tDown = 43.5;
    const poleX = 610;
    const top = 380;
    const base = 1180;
    const fw = 340;
    const fh = (fw * IM.flag.h) / IM.flag.w;
    const dn = easeInOutCubic(p01(t, tDown, tDown + 1.5));
    const fy = lerp(top + 8, base - fh - 10, dn);
    const desat = 0.25 * dn;
    const ck = popK(t, t2020 - 0.1, 0.35);
    const cal = calendar(70, 210, 'AUGUST', '3', '2020', ck, 1);
    return (
      cover('paddock', PADDOCK(l, { zoom: 1.32 + 0.04 + l * 0.006, dim: 0.34 + desat, tint: `rgba(60,60,70,${desat.toFixed(3)})` })) +
      topShade(600, 0.6) +
      flagpole(poleX, top, base) +
      wavingFlag(poleX + 6, fy, fw, t, lerp(9, 3, dn), 1 - 0.35 * dn) +
      cal
    );
  }

  // J. Rewind 2020 → 1970, landing on the frame-1 composition.
  function sceneRewind(t, l) {
    const t0 = 45.35;
    const back = p01(t, 46.15, 46.75); // crossfade to gate
    // background: flag rising back up (rewind) then gate photo
    const poleX = 610;
    const top = 380;
    const base = 1180;
    const fw = 340;
    const fh = (fw * IM.flag.h) / IM.flag.w;
    const ru = easeInOutCubic(p01(t, t0, 46.3));
    const fy = lerp(base - fh - 10, top + 8, ru);
    const bgA =
      back < 1
        ? cover('paddock', PADDOCK(l, { zoom: 1.36, dim: 0.5, tint: 'rgba(60,60,70,0.25)' })) +
          flagpole(poleX, top, base) +
          wavingFlag(poleX + 6, fy, fw, -t * 2, 6, 0.85)
        : '';
    const bgB = back > 0 ? `<g opacity="${back.toFixed(3)}">${cover('gate', GATE_CAM(0))}${topShade(820, 0.85)}</g>` : '';

    // year roller
    const yu = easeInOutCubic(p01(t, 45.5, 47.0));
    const year = Math.round(lerp(2020, 1970, yu));
    const land = easeInOutCubic(p01(t, 47.15, 47.85));
    const yy = lerp(760, 690, land);
    const ys = lerp(230, 36, land);
    const roller = `<g opacity="${(1 - land * 0.0).toFixed(3)}">${text(540, yy + ys * 0.36, String(year), { size: ys, fill: land > 0.95 ? C.gold : '#fff', stroke: C.ink, sw: lerp(14, 0, land), ls: lerp(6, 1.5, land) })}</g>`;
    // chip fades in under the landed year
    const chipOp = p01(t, 47.6, 47.95);
    // VHS rewind lines + icon
    const vhs = 1 - p01(t, 46.6, 47.1);
    let lines = '';
    if (vhs > 0) {
      for (let i = 0; i < 7; i++) {
        const y = (((t * 1900 + i * 397) % H) + H) % H;
        lines += `<rect x="0" y="${f1(y)}" width="${W}" height="${6 + (i % 3) * 5}" fill="rgba(255,255,255,${(0.10 * vhs).toFixed(3)})"/>`;
      }
      lines += `<g opacity="${vhs}" transform="translate(110 230)" filter="url(#sh)">
        <path d="M0 0 L46 -34 V34 Z M46 0 L92 -34 V34 Z" fill="#fff"/>
        ${text(110, 14, 'REWIND', { size: 34, anchor: 'start', fill: '#fff', ls: 4 })}</g>`;
    }
    const plate =
      land < 0.95
        ? `<rect x="0" y="${f1(yy - ys * 0.62)}" width="${W}" height="${f1(ys * 1.2)}" fill="rgba(11,22,48,${(0.55 * (1 - land)).toFixed(3)})"/>`
        : '';
    return (
      bgA +
      bgB +
      lines +
      plate +
      (chipOp > 0 ? hookChip(chipOp) : '') +
      (chipOp < 1 ? roller : '')
    );
  }

  // ---------- scene table ----------
  const SCENES = [
    { id: 'hook', start: 0, end: 5.62, draw: sceneHook },
    { id: 'wheat', start: 5.62, end: 13.45, draw: sceneWheat },
    { id: 'declare', start: 13.45, end: 17.5, draw: sceneDeclare },
    { id: 'map', start: 17.5, end: 23.45, draw: sceneMap },
    { id: 'prince', start: 23.45, end: 25.45, draw: scenePrince },
    { id: 'collection', start: 25.45, end: 30.65, draw: sceneCollection },
    { id: 'war', start: 30.65, end: 36.05, draw: sceneWar },
    { id: 'tax', start: 36.05, end: 42.3, draw: sceneTax },
    { id: 'handback', start: 42.3, end: 45.35, draw: sceneHandback },
    { id: 'rewind', start: 45.35, end: 48.1, draw: sceneRewind },
  ];
  const XF = 0.2; // crossfade length

  // ---------- captions ----------
  let CAPS = null;
  function buildCaps(words) {
    const groups = [];
    let cur = [];
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (cur.length) {
        const prev = cur[cur.length - 1];
        const gap = w.start - prev.end;
        const chars = cur.map((x) => x.word).join(' ').length + w.word.length;
        if (cur.length >= 4 || gap > 0.35 || chars > 22 || /[.…,]$/.test(prev.word)) {
          groups.push(cur);
          cur = [];
        }
      }
      cur.push(w);
    }
    if (cur.length) groups.push(cur);
    return groups.map((g, i) => {
      const next = groups[i + 1];
      const endNat = g[g.length - 1].end + 0.2;
      const end = next ? Math.min(Math.max(endNat, next[0].start - 0.02), next[0].start - 0.02) : g[g.length - 1].end + 0.5;
      return { words: g, start: g[0].start - 0.04, end: Math.max(end, g[g.length - 1].end) };
    });
  }
  function captions(t) {
    if (!CAPS) return '';
    const c = CAPS.find((g) => t >= g.start && t < g.end);
    if (!c) return '';
    const k = easeOutBack(p01(t, c.start, c.start + 0.16));
    const y = 1352;
    const spans = c.words
      .map((w) => {
        const active = t >= w.start - 0.03 && t < w.end + 0.08;
        return `<tspan fill="${active ? C.gold : '#ffffff'}">${esc(w.word)}</tspan>`;
      })
      .join(' ');
    return `<g transform="translate(540 ${y}) scale(${(0.86 + 0.14 * k).toFixed(3)}) translate(-540 ${-y})" opacity="${clamp(k * 1.4, 0, 1).toFixed(3)}">
      <text x="540" y="${y + 24}" text-anchor="middle" font-family="${F}" font-size="66" font-weight="900"
        stroke="${C.ink}" stroke-width="13" stroke-linejoin="round" paint-order="stroke" filter="url(#capsh)">${spans}</text></g>`;
  }

  const DEFS = `<defs>
    <radialGradient id="vig" cx="50%" cy="45%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.6"/></radialGradient>
    <linearGradient id="topfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050a16" stop-opacity="1"/><stop offset="1" stop-color="#050a16" stop-opacity="0"/></linearGradient>
    <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d2c50"/><stop offset="1" stop-color="#061629"/></linearGradient>
    <linearGradient id="pole" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d939c"/><stop offset="0.45" stop-color="#f1f3f6"/><stop offset="1" stop-color="#6c727b"/></linearGradient>
    <linearGradient id="brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dc8c"/><stop offset="0.5" stop-color="#d4a73c"/><stop offset="1" stop-color="#f1d27a"/></linearGradient>
    <filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity="0.5"/></filter>
    <filter id="capsh" x="-10%" y="-40%" width="120%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity="0.6"/></filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="5"/></filter>
  </defs>`;

  function frame(t) {
    let body = '';
    for (let i = 0; i < SCENES.length; i++) {
      const sc = SCENES[i];
      const next = SCENES[i + 1];
      const inS = t >= sc.start && t < sc.end;
      const tail = next && t >= sc.end && t < sc.end + XF; // outgoing scene held under incoming fade
      if (!inS && !tail) continue;
      let layer = sc.draw(t, t - sc.start) || '';
      if (inS && i > 0 && t < sc.start + XF) {
        layer = `<g opacity="${easeInOutCubic(p01(t, sc.start, sc.start + XF)).toFixed(3)}">${layer}</g>`;
        // ensure outgoing scene drawn beneath (handled by tail of previous, drawn first)
      }
      body = tail ? layer + body : body + layer;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      ${DEFS}<rect width="${W}" height="${H}" fill="${C.navy}"/>${body}${captions(t)}</svg>`;
  }

  // ---------- episode contract ----------
  window.EPISODE = {
    duration: 48.048,
    fps: 30,
    words: [],
    scenes: SCENES,
    assetsReady: false,
  };

  // load map data + pre-decode all images before capture begins
  (async function preload() {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = '/render/map_data.js';
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
    await Promise.all(
      Object.values(IM).map(
        (im) =>
          new Promise((res) => {
            const i = new Image();
            i.onload = () => (i.decode ? i.decode().then(res, res) : res());
            i.onerror = () => {
              console.error('image failed', im.src);
              res();
            };
            i.src = im.src;
          })
      )
    );
    window.EPISODE.assetsReady = true;
  })();

  window.renderFrame = function (t) {
    const ep = window.EPISODE;
    if (!CAPS && ep.words && ep.words.length) {
      WORDS = ep.words;
      CAPS = buildCaps(ep.words);
    }
    if (!MAP()) return;
    document.getElementById('root').innerHTML = frame(t);
  };
})();
