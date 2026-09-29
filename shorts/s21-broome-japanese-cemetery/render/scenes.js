/* s21-broome-japanese-cemetery — Skylab photo-underlay + SVG motion graphics.
 * SVG + renderFrame(t) + Playwright + ffmpeg (shared/render). No Remotion.
 * Beat seams come from transcript.json (faster-whisper word timings on audio/vo.mp3).
 * Soft facts (fact-check.md): OVER 900 · >1 IN 10 = historians' estimate · 1896 consulate = TOWNSVILLE, never Broome.
 */
(function () {
  const HS = window.HS;
  const { W, H, clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic } = HS;
  const DUR = 39.816;
  const CAP_Y = HS.CAPTION_Y; // 1344 — lower-middle band

  const IMG = {
    plaque: { src: '/img/s21_01_history_plaque.jpg', w: 1920, h: 1080 },
    restore: { src: '/img/s21_02_restoration_plaque.jpg', w: 1920, h: 1080 },
    path: { src: '/img/s21_03_cemetery_path.jpg', w: 1920, h: 1080 },
    rows: { src: '/img/s21_04_cemetery_rows.jpg', w: 1920, h: 1080 },
    graves: { src: '/img/s21_06_japanese_graves.jpg', w: 1600, h: 1200 },
    memorial: { src: '/img/s21_08_cemetery_1969.jpg', w: 1201, h: 1792 },
    luggers: { src: '/img/s21_09_pearling_luggers.jpg', w: 600, h: 504, crop: [10, 10, 580, 466] },
    beach: { src: '/img/s21_10_cable_beach.jpg', w: 1920, h: 1440 },
    shore: { src: '/img/s21_12_roebuck_bay_mudflat.jpg', w: 1920, h: 1080 },
    iss: { src: '/img/s21_13_roebuck_bay_iss.jpg', w: 1920, h: 1280 },
    suit: { src: '/img/s21_14_broome_diving_suit_1936.png', w: 1024, h: 1373 },
  };

  const F_DISPLAY = "Anton, 'Archivo Black', 'Liberation Sans', sans-serif";
  const F_LABEL = "Oswald, 'Liberation Sans', sans-serif";
  const F_CAP = "'Archivo Black', 'Liberation Sans', sans-serif";

  const GOLD = '#f2c46d';
  const INK_RED = '#b8261d';
  const PEARL = '#f7f1e6';

  // ---------- small helpers ----------
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const easeInCubic = (x) => x * x * x;
  const easeOutQuint = (x) => 1 - Math.pow(1 - x, 5);
  const hash = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const esc = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const f2 = (v) => (Math.round(v * 100) / 100).toString();

  let _ctx = null;
  function measure(str, size, family, weight = 400, ls = 0) {
    if (!_ctx) _ctx = document.createElement('canvas').getContext('2d');
    _ctx.font = `${weight} ${size}px ${family}`;
    return _ctx.measureText(str).width + ls * Math.max(0, str.length - 1);
  }

  // Per-frame dynamic <defs> (filters whose values animate).
  let DYN = [];
  function dyn(s) {
    DYN.push(s);
  }

  // Photo with source-pixel camera: cx/cy = source focus, zoom ≥ 1 = tighter. Cover-fits dest rect.
  function photo(im, o = {}) {
    const dx = o.x ?? 0;
    const dy = o.y ?? 0;
    const dw = o.w ?? W;
    const dh = o.h ?? H;
    const c = im.crop || [0, 0, im.w, im.h];
    const A = dw / dh;
    let vw = Math.min(c[2], c[3] * A);
    let vh = vw / A;
    const z = Math.max(1, o.zoom ?? 1);
    vw /= z;
    vh /= z;
    const cx = o.cx ?? c[0] + c[2] / 2;
    const cy = o.cy ?? c[1] + c[3] / 2;
    const vx = clamp(cx - vw / 2, c[0], c[0] + c[2] - vw);
    const vy = clamp(cy - vh / 2, c[1], c[1] + c[3] - vh);
    const filt = o.filter ? ` filter="url(#${o.filter})"` : '';
    let s = `<svg x="${f2(dx)}" y="${f2(dy)}" width="${f2(dw)}" height="${f2(dh)}" viewBox="${f2(vx)} ${f2(vy)} ${f2(vw)} ${f2(vh)}" preserveAspectRatio="none" overflow="hidden"><image href="${im.src}" x="0" y="0" width="${im.w}" height="${im.h}"${filt}/></svg>`;
    if (o.dim) s += `<rect x="${f2(dx)}" y="${f2(dy)}" width="${f2(dw)}" height="${f2(dh)}" fill="#000" opacity="${f2(o.dim)}"/>`;
    return s;
  }

  function grade(color, opacity, blend = 'multiply') {
    return `<rect width="${W}" height="${H}" fill="${color}" opacity="${f2(opacity)}" style="mix-blend-mode:${blend}"/>`;
  }
  function topShade(h = 900, a = 0.6) {
    return `<rect width="${W}" height="${h}" fill="url(#topShade)" opacity="${f2(a)}"/>`;
  }

  // Extruded 3D label (bold face + stacked depth + soft shadow).
  function text3d(str, x, y, size, o = {}) {
    const depth = o.depth ?? Math.max(4, Math.round(size * 0.055));
    const family = o.family || F_DISPLAY;
    const weight = o.weight || 400;
    const ls = o.ls ?? 0;
    const anchor = o.anchor || 'middle';
    const common = `text-anchor="${anchor}" font-family="${family}" font-weight="${weight}" font-size="${size}" letter-spacing="${ls}"`;
    let layers = '';
    for (let i = depth; i >= 1; i--) {
      layers += `<text x="${f2(x + i * 0.55)}" y="${f2(y + i)}" ${common} fill="${o.side || '#2a1508'}">${esc(str)}</text>`;
    }
    const stroke = o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw ?? 2}" paint-order="stroke"` : '';
    return `<g filter="url(#${o.shadow || 'shadow'})">${layers}<text x="${f2(x)}" y="${f2(y)}" ${common} fill="${o.face || 'url(#sandstone)'}"${stroke}>${esc(str)}</text></g>`;
  }

  // Label chip (pill) — names/places/dates only.
  function chip(label, x, y, o = {}) {
    const size = o.size || 38;
    const ls = o.ls ?? 5;
    const tw = measure(label, size, F_LABEL, 600, ls);
    const padX = o.padX ?? 30;
    const dot = o.dot !== false;
    const w = tw + padX * 2 + (dot ? 34 : 0);
    const h = size * 1.62;
    const x0 = o.anchor === 'start' ? x : o.anchor === 'end' ? x - w : x - w / 2;
    const accent = o.accent || GOLD;
    return `<g filter="url(#shadowSoft)">
      <rect x="${f2(x0)}" y="${f2(y - h / 2)}" width="${f2(w)}" height="${f2(h)}" rx="${f2(h / 2)}" fill="${o.fill || 'rgba(10,11,16,0.8)'}" stroke="${accent}" stroke-width="2.5"/>
      ${dot ? `<circle cx="${f2(x0 + padX + 8)}" cy="${f2(y)}" r="8" fill="${accent}"/>` : ''}
      <text x="${f2(x0 + padX + (dot ? 34 : 0))}" y="${f2(y + size * 0.36)}" font-family="${F_LABEL}" font-weight="600" font-size="${size}" letter-spacing="${ls}" fill="${o.color || PEARL}">${esc(label)}</text>
    </g>`;
  }

  function popIn(t, at, dur = 0.35) {
    const p = seg(t, at, at + dur);
    return { p, s: p <= 0 ? 0 : easeOutBack(p), o: clamp(p * 3, 0, 1) };
  }
  function around(cx, cy, s, inner, extra = '') {
    return `<g transform="translate(${f2(cx)} ${f2(cy)}) scale(${f2(s)}) translate(${f2(-cx)} ${f2(-cy)})" ${extra}>${inner}</g>`;
  }

  // Deterministic floating motes (dust / ash / plankton).
  function motes(t, n, o = {}) {
    const col = o.color || '#ffe9c7';
    const spd = o.speed ?? 40;
    let s = '';
    for (let i = 0; i < n; i++) {
      const r = (o.rMin ?? 1.5) + hash(i + 3) * (o.rVar ?? 3.5);
      const x0 = hash(i + 11) * W;
      const y0 = hash(i + 29) * H;
      const y = (((y0 - t * spd * (0.5 + hash(i + 7))) % H) + H) % H;
      const x = x0 + Math.sin(t * 0.7 + i) * 18;
      const a = (o.alpha ?? 0.45) * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.3 + i * 2.1)));
      s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="${col}" opacity="${f2(a)}"/>`;
    }
    return s;
  }

  function bubbles(t, n, x, y, spread, o = {}) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const life = 1.6 + hash(i + 50) * 1.2;
      const ph = (t + hash(i + 70) * life) % life;
      const k = ph / life;
      const bx = x + (hash(i + 90) - 0.5) * spread + Math.sin(ph * 5 + i) * 10;
      const by = y - k * (o.rise ?? 520);
      const r = (o.r ?? 5) + hash(i + 110) * (o.rVar ?? 9);
      s += `<circle cx="${f2(bx)}" cy="${f2(by)}" r="${f2(r)}" fill="none" stroke="#dff6ff" stroke-width="2" opacity="${f2((1 - k) * (o.alpha ?? 0.7))}"/>`;
    }
    return s;
  }

  // Rubber stamp (ink texture via #stampInk).
  function stamp(label, x, y, t, at, o = {}) {
    const p = seg(t, at, at + 0.16);
    if (p <= 0) return '';
    const size = o.size || 84;
    const tw = measure(label, size, F_DISPLAY, 400, 4);
    const w = tw + 70;
    const h = size * 1.45;
    const s = lerp(2.3, 1, easeInCubic(p));
    const rot = o.rot ?? -9;
    const col = o.color || INK_RED;
    return `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${rot}) scale(${f2(s)})" opacity="${f2(clamp(p * 1.4, 0, 0.93))}">
      <g filter="url(#stampInk)">
        <rect x="${f2(-w / 2)}" y="${f2(-h / 2)}" width="${f2(w)}" height="${f2(h)}" rx="14" fill="none" stroke="${col}" stroke-width="9"/>
        <rect x="${f2(-w / 2 + 14)}" y="${f2(-h / 2 + 14)}" width="${f2(w - 28)}" height="${f2(h - 28)}" rx="8" fill="none" stroke="${col}" stroke-width="3"/>
        <text x="0" y="${f2(size * 0.36)}" text-anchor="middle" font-family="${F_DISPLAY}" font-size="${size}" letter-spacing="4" fill="${col}">${esc(label)}</text>
      </g>
    </g>`;
  }

  function impactShake(t, at, amp = 14, dur = 0.35) {
    const k = seg(t, at, at + dur);
    if (k <= 0 || k >= 1) return [0, 0];
    const a = amp * (1 - k);
    return [Math.sin(t * 95) * a, Math.cos(t * 83) * a * 0.7];
  }

  // Film treatment for archival stills: scratches + flicker.
  function filmFx(t, strength = 1) {
    let s = '';
    const fr = Math.floor(t * 30);
    for (let i = 0; i < 3; i++) {
      if (hash(fr * 7 + i) > 0.55) continue;
      const x = hash(fr * 13 + i * 5) * W;
      s += `<rect x="${f2(x)}" y="0" width="${f2(1 + hash(fr + i) * 2)}" height="${H}" fill="#fff" opacity="${f2(0.05 * strength + hash(fr * 3 + i) * 0.06 * strength)}"/>`;
    }
    const flick = (hash(fr * 17) - 0.5) * 0.06 * strength;
    s += `<rect width="${W}" height="${H}" fill="${flick > 0 ? '#fff' : '#000'}" opacity="${f2(Math.abs(flick))}"/>`;
    return s;
  }

  // ---------- hook card (frame 1 unspoken: 900 GRAVES) ----------
  function hookCard(scale, alpha, lift = 0) {
    const gw = measure('GRAVES', 112, F_LABEL, 700, 30);
    const ruleY = 862 + lift;
    const inner = `
      ${text3d('900', 540, 790 + lift, 380, { depth: 18, face: 'url(#sandstone)', side: '#3b1a07', stroke: '#fff4dc', sw: 3 })}
      <line x1="${f2(540 - gw / 2 - 150)}" y1="${ruleY}" x2="${f2(540 - gw / 2 - 30)}" y2="${ruleY}" stroke="${GOLD}" stroke-width="5"/>
      <line x1="${f2(540 + gw / 2 + 30)}" y1="${ruleY}" x2="${f2(540 + gw / 2 + 150)}" y2="${ruleY}" stroke="${GOLD}" stroke-width="5"/>
      ${text3d('GRAVES', 540 + 15, 902 + lift, 112, { family: F_LABEL, weight: 700, ls: 30, depth: 6, face: PEARL, side: '#1c120b' })}`;
    return `<g opacity="${f2(alpha)}">${around(540, 720 + lift, scale, inner)}</g>`;
  }

  function rowsUnderlay(t, zoom) {
    return (
      photo(IMG.rows, { cx: 800, cy: 540, zoom, dim: 0.4 }) +
      grade('#4a220a', 0.22) +
      topShade(1000, 0.75) +
      motes(t, 26, { speed: 22, alpha: 0.35 })
    );
  }

  // ---------- scenes ----------
  // A · 0.00 hook — cemetery rows + 900 GRAVES (fully visible on frame 1)
  function sHook(t, lt) {
    const z = 1.15 + 0.1 * (lt / 3.1);
    const settle = lt < 0.35 ? lerp(1.06, 1, easeOutCubic(lt / 0.35)) : 1;
    const out = seg(lt, 2.55, 3.1);
    const e = easeInCubic(out);
    const ring = seg(lt, 0, 0.7);
    let burst = '';
    if (lt < 1.0) {
      for (let i = 0; i < 26; i++) {
        const ang = hash(i + 200) * Math.PI * 2;
        const d = (120 + hash(i + 230) * 380) * easeOutCubic(seg(lt, 0, 1.0));
        burst += `<circle cx="${f2(540 + Math.cos(ang) * d * 1.3)}" cy="${f2(690 + Math.sin(ang) * d * 0.7)}" r="${f2(2 + hash(i + 260) * 4)}" fill="#ffe2b0" opacity="${f2(0.8 * (1 - lt))}"/>`;
      }
    }
    return (
      rowsUnderlay(t, z) +
      `<circle cx="540" cy="690" r="${f2(200 + easeOutCubic(ring) * 700)}" fill="none" stroke="${GOLD}" stroke-width="${f2(8 * (1 - ring))}" opacity="${f2(0.8 * (1 - ring))}"/>` +
      burst +
      `<g transform="translate(0 ${f2(-70 * e)})">${hookCard(settle * (1 + 0.04 * e), 1 - e)}</g>`
    );
  }

  // B · 3.10 "small Australian beach town" — split wipe cemetery ↔ Cable Beach
  function sBeach(t, lt) {
    const up1 = easeInOutCubic(seg(lt, 0.0, 0.5));
    const up2 = easeInOutCubic(seg(lt, 1.35, 1.9));
    const yS = lerp(H, 960, up1) - 960 * up2;
    const z = 1.25 + 0.05 * (lt / 2.4);
    let glints = '';
    for (let i = 0; i < 22; i++) {
      const gx = hash(i + 400) * W;
      const gy = 900 + hash(i + 430) * 160;
      const a = Math.max(0, Math.sin(t * (3 + hash(i) * 4) + i * 1.7));
      const len = 20 + hash(i + 460) * 60;
      glints += `<rect x="${f2(gx - len / 2 + Math.sin(t + i) * 12)}" y="${f2(gy)}" width="${f2(len)}" height="3" rx="1.5" fill="#fff" opacity="${f2(a * 0.7)}"/>`;
    }
    const sun = 0.75 + 0.25 * Math.sin(t * 2.2);
    const beach =
      photo(IMG.beach, { cx: 1020, cy: 760, zoom: 1.05 + 0.04 * (lt / 2.4), dim: 0.18 }) +
      grade('#ffb46b', 0.1, 'soft-light') +
      glints +
      `<circle cx="900" cy="150" r="${f2(150 * sun)}" fill="url(#sunGlow)"/>
       <circle cx="690" cy="430" r="26" fill="#fff6d8" opacity="0.14"/><circle cx="600" cy="560" r="14" fill="#fff6d8" opacity="0.12"/>`;
    return (
      `<g filter="url(#desatHalf)">${rowsUnderlay(t, z)}</g><rect width="${W}" height="${H}" fill="#000" opacity="0.15"/>` +
      `<clipPath id="beachClip"><rect x="0" y="${f2(yS)}" width="${W}" height="${f2(H - yS + 2)}"/></clipPath>` +
      `<g clip-path="url(#beachClip)">${beach}</g>` +
      (yS > 40 && yS < H - 2
        ? `<rect x="0" y="${f2(yS - 3)}" width="${W}" height="6" fill="${GOLD}" filter="url(#glowGold)"/>
           <g transform="translate(540 ${f2(yS)}) rotate(45)"><rect x="-13" y="-13" width="26" height="26" fill="${GOLD}" stroke="#2a1508" stroke-width="3"/></g>`
        : '')
    );
  }

  // C · 5.45 "the story behind it is heartbreaking" — 1969 memorial, draining colour
  function sMemorial(t, lt) {
    const k = lt / 2.9;
    const sat = lerp(0.85, 0.12, easeInOutCubic(clamp(k, 0, 1)));
    dyn(`<filter id="memSat" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="${f2(sat)}"/></filter>`);
    const beat = Math.exp(-Math.pow((t - 7.35) / 0.18, 2)) * 0.25;
    let rays = '';
    for (let i = 0; i < 3; i++) {
      const sw = Math.sin(t * 0.6 + i * 1.3) * 3;
      rays += `<polygon points="${120 + i * 170},-40 ${260 + i * 170},-40 ${760 + i * 150},1500 ${520 + i * 150},1500" fill="url(#rayGrad)" opacity="${f2(0.22 - i * 0.05)}" transform="rotate(${f2(sw)} 540 0)"/>`;
    }
    return (
      photo(IMG.memorial, { cx: 600, cy: 830, zoom: 1.0 + 0.2 * k, filter: 'memSat', dim: lerp(0.3, 0.5, k) }) +
      grade('#2b1b10', 0.25) +
      `<g style="mix-blend-mode:screen">${rays}</g>` +
      motes(t, 30, { speed: 18, color: '#fff5e6', alpha: 0.3, rMin: 1, rVar: 2.5 }) +
      `<rect width="${W}" height="${H}" fill="url(#vig)" opacity="${f2(0.5 + beat + 0.25 * k)}"/>`
    );
  }

  // D · 8.30 "Broome, Western Australia" — ISS orbital view + HUD + 3D label
  function sOrbit(t, lt) {
    const z = 1.0 + 0.42 * easeInOutCubic(clamp(lt / 2.2, 0, 1));
    const rot = lerp(-3, 1, lt / 2.2);
    const box = easeOutCubic(seg(lt, 0.05, 0.6));
    const bx0 = lerp(40, 230, box);
    const by0 = lerp(260, 560, box);
    const bx1 = W - bx0;
    const by1 = lerp(1500, 1120, box);
    const L = 70;
    const corner = (x, y, sx, sy) =>
      `<path d="M${f2(x)} ${f2(y + sy * L)} L${f2(x)} ${f2(y)} L${f2(x + sx * L)} ${f2(y)}" fill="none" stroke="#bfe9ff" stroke-width="6" stroke-linecap="round"/>`;
    const scanY = lerp(by0, by1, (lt * 0.8) % 1);
    const lb = popIn(t, 8.5, 0.4);
    const wa = popIn(t, 9.25, 0.35);
    return (
      `<g transform="rotate(${f2(rot)} 540 960) scale(1.12) translate(${f2(-540 * 0.12 / 1.12)} ${f2(-960 * 0.12 / 1.12)})">` +
      photo(IMG.iss, { cx: 960, cy: 640, zoom: z, dim: 0.28 }) +
      `</g>` +
      grade('#0b3a5c', 0.35, 'soft-light') +
      topShade(820, 0.7) +
      `<g opacity="${f2(clamp(lt * 4, 0, 1))}">
        ${corner(bx0, by0, 1, 1)}${corner(bx1, by0, -1, 1)}${corner(bx0, by1, 1, -1)}${corner(bx1, by1, -1, -1)}
        <line x1="${f2(bx0)}" y1="${f2(scanY)}" x2="${f2(bx1)}" y2="${f2(scanY)}" stroke="#bfe9ff" stroke-width="2" opacity="0.45"/>
        <circle cx="540" cy="${f2((by0 + by1) / 2)}" r="${f2(150 + 20 * Math.sin(t * 2))}" fill="none" stroke="#bfe9ff" stroke-width="2.5" stroke-dasharray="6 14" opacity="0.6" transform="rotate(${f2(t * 25)} 540 ${f2((by0 + by1) / 2)})"/>
      </g>` +
      (lb.p > 0
        ? `<g opacity="${f2(lb.o)}">${around(540, 430, lerp(1.5, 1, easeOutCubic(lb.p)) * (0.94 + 0.06 * lb.s), text3d('BROOME', 540, 470, 200, { face: 'url(#pearlFace)', side: '#0c2233', depth: 12, shadow: 'glowWhite' }))}</g>`
        : '') +
      (wa.p > 0 ? `<g opacity="${f2(wa.o)}">${around(540, 540, wa.s, chip('WESTERN AUSTRALIA', 540, 545, { size: 40 }))}</g>` : '')
    );
  }

  // E · 10.25 "Late 1800s" — period luggers print + LATE 1800s stamp
  function sEra(t, lt) {
    const inn = easeOutBack(seg(lt, 0, 0.5));
    const rot = lerp(-7, -1.5, inn);
    const cy = lerp(1100, 820, easeOutCubic(seg(lt, 0, 0.45)));
    const [shx, shy] = impactShake(t, 10.58, 10);
    const card = `<g transform="translate(${f2(540 + shx)} ${f2(cy + shy)}) rotate(${f2(rot)}) scale(${f2(lerp(0.9, 1, inn))})">
        <rect x="-498" y="-400" width="996" height="800" rx="6" fill="#efe6d2" filter="url(#shadow)"/>
        <g transform="translate(-480 -382)">${photo(IMG.luggers, { w: 960, h: 764, zoom: 1.02 + lt * 0.02, filter: 'sepia' })}</g>
      </g>`;
    return (
      photo(IMG.luggers, { zoom: 1.25, filter: 'blurSepia', dim: 0.5 }) +
      card +
      filmFx(t, 1) +
      stamp('LATE 1800s', 745, 470, t, 10.5, { size: 86, rot: -9 })
    );
  }

  // Pearl-shell (Pinctada maxima) glyph: straight hinge, round body, gold lip.
  function shell(cx, cy, r, flip, t, o = {}) {
    const d = `M${-0.6 * r},${-0.5 * r} L${0.6 * r},${-0.5 * r} C${0.98 * r},${-0.28 * r} ${1.02 * r},${0.36 * r} ${0.64 * r},${0.72 * r} C${0.3 * r},${1.02 * r} ${-0.3 * r},${1.02 * r} ${-0.64 * r},${0.72 * r} C${-1.02 * r},${0.36 * r} ${-0.98 * r},${-0.28 * r} ${-0.6 * r},${-0.5 * r} Z`;
    const inside = flip >= 0;
    let lines = '';
    for (let i = 1; i <= 5; i++) {
      const rr = r * (0.3 + i * 0.16);
      lines += `<path d="M${f2(-rr * 0.9)},${f2(-0.5 * r + rr * 0.2)} Q0,${f2(-0.5 * r + rr * 1.55)} ${f2(rr * 0.9)},${f2(-0.5 * r + rr * 0.2)}" fill="none" stroke="${inside ? 'rgba(255,255,255,0.35)' : 'rgba(60,40,20,0.45)'}" stroke-width="${f2(r * 0.012 + 1)}"/>`;
    }
    const id = `sc${o.id || 0}`;
    return `<g transform="translate(${f2(cx)} ${f2(cy)}) rotate(${f2(o.rot || 0)}) scale(${f2(Math.max(0.02, Math.abs(flip)))} 1)" opacity="${f2(o.alpha ?? 1)}">
      <clipPath id="${id}"><path d="${d}"/></clipPath>
      <path d="${d}" fill="${inside ? 'url(#nacre)' : 'url(#shellOut)'}" stroke="${inside ? '#d8ad5c' : '#5c4a31'}" stroke-width="${f2(r * 0.07)}" filter="url(#shadowSoft)"/>
      <g clip-path="url(#${id})">${lines}${inside ? `<rect x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" fill="url(#shine)"/>` : ''}</g>
    </g>`;
  }

  // F · 11.85 "The sea here is full of pearl shell" — underwater light + shells rise, hero flips
  function sShell(t, lt) {
    const shine = ((t * 0.45) % 1.6) - 0.3;
    dyn(`<linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="${f2(shine - 0.18)}" stop-color="#fff" stop-opacity="0"/>
      <stop offset="${f2(shine)}" stop-color="#fff" stop-opacity="0.3"/>
      <stop offset="${f2(shine + 0.18)}" stop-color="#fff" stop-opacity="0"/></linearGradient>`);
    let caus = '';
    for (let i = 0; i < 7; i++) {
      let pts = '';
      for (let x = -40; x <= W + 40; x += 60) {
        const y = 140 + i * 150 + Math.sin(x * 0.01 + t * (1.1 + i * 0.13) + i) * 26 + Math.sin(x * 0.023 - t * 0.8) * 12;
        pts += `${x},${f2(y)} `;
      }
      caus += `<polyline points="${pts}" fill="none" stroke="#bff3ff" stroke-width="${2 + (i % 3)}" opacity="${f2(0.12 + 0.05 * Math.sin(t * 2 + i))}"/>`;
    }
    const small = [
      [190, 520, 70, 12.1, -18],
      [890, 470, 62, 12.25, 14],
      [160, 980, 78, 12.4, 10],
      [905, 1010, 66, 12.55, -12],
      [330, 300, 48, 12.7, 22],
      [750, 1170, 54, 12.85, -6],
    ];
    let shells = '';
    small.forEach(([x, y, r, at, rot], i) => {
      const p = easeOutCubic(seg(t, at, at + 0.9));
      if (p <= 0) return;
      const yy = lerp(1600, y, p) + Math.sin(t * 1.4 + i) * 10;
      shells += shell(x, yy, r, Math.cos(t * 1.1 + i * 1.7), t, { id: i + 1, rot: rot + Math.sin(t + i) * 6, alpha: 0.95 });
    });
    const hp = seg(t, 12.2, 12.95);
    const hy = lerp(1500, 760, easeOutCubic(hp));
    const flipP = easeInOutCubic(seg(t, 13.12, 13.62));
    const flip = Math.cos(Math.PI * (1 - flipP)); // −1 (outside) → 1 (nacre)
    const hero = hp > 0 ? shell(540, hy + Math.sin(t * 1.2) * 8, 230, flip, t, { id: 9, rot: -4 }) : '';
    const halo = flipP > 0 ? `<circle cx="540" cy="${f2(hy)}" r="${f2(330 * flipP)}" fill="url(#pearlHalo)" opacity="${f2(flipP * 0.45)}"/>` : '';
    return (
      photo(IMG.beach, { cx: 1000, cy: 790, zoom: 2.3 + lt * 0.05, dim: 0.35 }) +
      `<rect width="${W}" height="${H}" fill="url(#seaGrad)" opacity="0.82"/>` +
      `<g style="mix-blend-mode:screen">${caus}</g>` +
      bubbles(t, 18, 540, 1500, 900, { rise: 1300, alpha: 0.45 }) +
      halo +
      shells +
      hero
    );
  }

  // Quadratic route helpers
  function qpt(p0, c, p1, u) {
    const a = (1 - u) * (1 - u);
    const b = 2 * (1 - u) * u;
    const d = u * u;
    return [a * p0[0] + b * c[0] + d * p1[0], a * p0[1] + b * c[1] + d * p1[1]];
  }
  function qtan(p0, c, p1, u) {
    return [2 * (1 - u) * (c[0] - p0[0]) + 2 * u * (p1[0] - c[0]), 2 * (1 - u) * (c[1] - p0[1]) + 2 * u * (p1[1] - c[1])];
  }

  // G · 14.15 "Divers from Japan arrive, many from villages in Wakayama" — north→south arrival route
  function sArrive(t, lt) {
    const J = [800, 420];
    const B = [300, 1040];
    const C = [990, 900];
    const draw = easeInOutCubic(seg(t, 14.45, 15.6));
    const N = 48;
    let d = '';
    for (let i = 0; i <= N; i++) {
      const [x, y] = qpt(J, C, B, (i / N) * draw);
      d += (i ? 'L' : 'M') + f2(x) + ' ' + f2(y) + ' ';
    }
    const [sx, sy] = qpt(J, C, B, draw);
    const [tx, ty] = qtan(J, C, B, Math.max(0.01, draw));
    const ang = (Math.atan2(ty, tx) * 180) / Math.PI;
    const ship =
      draw > 0 && draw < 1
        ? `<g transform="translate(${f2(sx)} ${f2(sy)}) rotate(${f2(ang - 90)})"><circle r="30" fill="${GOLD}" opacity="0.25"/>
            <path d="M0,-26 L10,8 L0,4 L-10,8 Z" fill="${PEARL}" stroke="#1a1208" stroke-width="3"/></g>`
        : '';
    let stream = '';
    const sp = seg(t, 15.95, 16.2);
    if (sp > 0) {
      for (let i = 0; i < 16; i++) {
        const u = (t * 0.32 + i / 16) % 1;
        const [x, y] = qpt(J, C, B, u);
        const a = Math.sin(u * Math.PI) * sp;
        stream += `<circle cx="${f2(x)}" cy="${f2(y)}" r="7" fill="${PEARL}" opacity="${f2(a)}" filter="url(#glowGold)"/>`;
      }
    }
    const jp = popIn(t, 14.78, 0.35);
    const bp = popIn(t, 15.5, 0.45);
    const wk = popIn(t, 17.12, 0.4);
    const ripple = seg(t, 15.55, 16.3);
    const pinY = lerp(-300, 0, easeOutCubic(bp.p));
    const node = (x, y, a) =>
      `<circle cx="${x}" cy="${y}" r="${f2(26 + 6 * Math.sin(t * 4))}" fill="none" stroke="${GOLD}" stroke-width="4" opacity="${f2(a)}"/><circle cx="${x}" cy="${y}" r="12" fill="${GOLD}" opacity="${f2(a)}"/>`;
    return (
      photo(IMG.shore, { cx: 1150 - lt * 30, cy: 540, zoom: 1.08, dim: 0.5 }) +
      grade('#1b2d3a', 0.35) +
      `<rect width="${W}" height="${H}" fill="url(#vig)" opacity="0.6"/>` +
      // compass: north up (Japan lies north of Broome)
      `<g transform="translate(120 330)" opacity="${f2(clamp(lt * 3, 0, 1))}"><circle r="46" fill="rgba(10,11,16,0.6)" stroke="${GOLD}" stroke-width="2"/>
        <path d="M0,-34 L12,6 L0,0 L-12,6 Z" fill="${GOLD}"/><path d="M0,34 L12,-6 L0,0 L-12,-6 Z" fill="#8a8a8a"/>
        <text y="-54" text-anchor="middle" font-family="${F_LABEL}" font-weight="700" font-size="30" fill="${PEARL}">N</text></g>` +
      `<path d="${d}" fill="none" stroke="${PEARL}" stroke-width="6" stroke-dasharray="4 16" stroke-linecap="round" opacity="0.9"/>` +
      stream +
      ship +
      (jp.p > 0 ? node(J[0], J[1], jp.o) : '') +
      (jp.p > 0 && wk.p <= 0 ? `<g opacity="${f2(jp.o)}">${around(J[0], 330, jp.s, chip('JAPAN', J[0], 330))}</g>` : '') +
      (wk.p > 0
        ? `<g opacity="${f2(wk.o)}">${around(J[0] - 70, 250, lerp(1.4, 1, easeOutCubic(wk.p)), text3d('WAKAYAMA', J[0] - 70, 290, 104, { face: 'url(#pearlFace)', side: '#2a1508', depth: 8 }))}</g>
           <g opacity="${f2(wk.o)}">${chip('JAPAN', J[0] - 70, 350, { size: 32 })}</g>`
        : '') +
      (bp.p > 0
        ? `<circle cx="${B[0]}" cy="${B[1]}" r="${f2(20 + ripple * 110)}" fill="none" stroke="${GOLD}" stroke-width="4" opacity="${f2(1 - ripple)}"/>
           <g transform="translate(${B[0]} ${f2(B[1] + pinY)})" opacity="${f2(bp.o)}"><path d="M0,0 C-10,-26 -38,-44 -38,-74 A38,38 0 1 1 38,-74 C38,-44 10,-26 0,0 Z" fill="${INK_RED}" stroke="${PEARL}" stroke-width="4" filter="url(#shadowSoft)"/><circle cy="-74" r="14" fill="${PEARL}"/></g>
           <g opacity="${f2(bp.o)}">${chip('BROOME', B[0] + 20, B[1] + 80)}</g>`
        : '')
    );
  }

  // Vector hard-hat helmet (copper dome, faceplate, bolts).
  function helmet(cx, cy, s) {
    let bolts = '';
    for (let i = 0; i < 8; i++) {
      const x = -118 + i * 33.7;
      bolts += `<circle cx="${f2(x)}" cy="118" r="7" fill="#f6d49a" stroke="#6b3413" stroke-width="2"/>`;
    }
    let grille = '';
    for (let i = -2; i <= 2; i++) grille += `<line x1="${i * 16}" y1="-40" x2="${i * 16}" y2="40" stroke="#6b3413" stroke-width="5"/>`;
    return `<g transform="translate(${f2(cx)} ${f2(cy)}) scale(${f2(s)})" filter="url(#shadow)">
      <path d="M-150,150 C-150,95 -110,78 -60,70 L60,70 C110,78 150,95 150,150 Z" fill="url(#copper)" stroke="#5a2a0e" stroke-width="5"/>
      <circle cx="0" cy="-20" r="112" fill="url(#copperDome)" stroke="#5a2a0e" stroke-width="5"/>
      <circle cx="0" cy="-8" r="58" fill="#9ed2e0" stroke="#e8b56c" stroke-width="12"/>
      <circle cx="0" cy="-8" r="58" fill="url(#glass)"/>
      <g transform="translate(0 -8)">${grille}</g>
      <circle cx="-92" cy="-40" r="26" fill="#9ed2e0" stroke="#e8b56c" stroke-width="8"/>
      <circle cx="92" cy="-40" r="26" fill="#9ed2e0" stroke="#e8b56c" stroke-width="8"/>
      <rect x="-24" y="-150" width="48" height="26" rx="6" fill="#e8b56c" stroke="#5a2a0e" stroke-width="4"/>
      ${bolts}
    </g>`;
  }

  // H · 18.05 "They dive deep in heavy copper helmets and lead boots" — 1936 Broome diving dress, submerge
  function sDive(t, lt) {
    const ph = 1448; // 1024×1373 fitted to width
    const py = 60;
    const push = easeInOutCubic(seg(t, 20.55, 21.4));
    const [shx, shy] = impactShake(t, 20.65, 12);
    const bootX = 548;
    const bootY = py + 1300 * (1080 / 1024);
    const wl = lerp(H + 60, -80, easeInOutCubic(seg(t, 18.36, 19.3)));
    let wave = `M0 ${f2(wl)} `;
    for (let x = 0; x <= W; x += 40) wave += `L${x} ${f2(wl + Math.sin(x * 0.02 + t * 5) * 14)} `;
    wave += `L${W} ${H} L0 ${H} Z`;
    const hp = seg(t, 19.5, 19.95);
    const hy = lerp(-260, 330, easeOutBack(hp));
    const lead = easeOutCubic(seg(t, 19.95, 20.4));
    const neck = [540, py + 700 * (1080 / 1024)];
    const bp = seg(t, 20.62, 21.0);
    const ringLen = 2 * Math.PI * 175;
    const scroll = (t * 140) % 60;
    let ticks = '';
    for (let y = 280 - scroll; y < 1180; y += 60) ticks += `<line x1="48" y1="${f2(y)}" x2="${y % 120 < 60 ? 78 : 66}" y2="${f2(y)}" stroke="#bfe9ff" stroke-width="3" opacity="0.7"/>`;
    const depthOn = seg(t, 18.4, 18.8);
    const photoGroup =
      photo(IMG.suit, { x: 0, y: py, w: W, h: ph, filter: 'sepia' }) +
      `<rect x="0" y="${py}" width="${W}" height="120" fill="url(#fadeDown)"/>` +
      `<rect x="0" y="${py + ph - 170}" width="${W}" height="170" fill="url(#fadeUp)"/>`;
    return (
      photo(IMG.suit, { zoom: 1.3, filter: 'blurSepia', dim: 0.55 }) +
      `<g transform="translate(${f2(shx)} ${f2(shy)})">${around(bootX, bootY, 1 + 0.06 * (lt / 3.4) + 0.1 * push, photoGroup)}</g>` +
      filmFx(t, 0.7) +
      `<path d="${wave}" fill="#0c4a5e" opacity="0.42" style="mix-blend-mode:multiply"/>` +
      `<path d="${wave}" fill="none" stroke="#bfefff" stroke-width="3" opacity="0.5"/>` +
      bubbles(t, 14, neck[0], neck[1] - 40, 90, { rise: 700, alpha: 0.6 * depthOn }) +
      `<g opacity="${f2(depthOn)}"><rect x="40" y="270" width="6" height="920" rx="3" fill="#bfe9ff" opacity="0.5"/>${ticks}
        <path d="M92 ${f2(lerp(300, 1150, seg(t, 18.4, 21.4)))} l22 -14 v28 Z" fill="${GOLD}"/></g>` +
      (hp > 0
        ? helmet(800, hy, 0.95) +
          `<path d="M705 ${f2(hy + 150)} Q640 ${f2((hy + neck[1]) / 2 + 40)} ${neck[0] + 30} ${neck[1] - 20}" fill="none" stroke="${GOLD}" stroke-width="4" stroke-dasharray="10 10" opacity="${f2(lead)}"/>` +
          `<g opacity="${f2(lead)}">${chip('COPPER HELMET', 800, 530, { size: 34 })}</g>`
        : '') +
      (bp > 0
        ? `<ellipse cx="${bootX}" cy="${f2(bootY - 10)}" rx="190" ry="78" fill="none" stroke="${GOLD}" stroke-width="7" stroke-dasharray="${f2(ringLen)}" stroke-dashoffset="${f2(ringLen * (1 - easeOutCubic(bp)))}" filter="url(#glowGold)"/>` +
          `<g opacity="${f2(clamp(bp * 3, 0, 1))}">${chip('LEAD BOOTS', 200, bootY - 150, { size: 34 })}</g>`
        : '')
    );
  }

  // Hazard medallion icons
  function medallion(kind, x, y, t, at, label) {
    const p = popIn(t, at, 0.4);
    if (p.p <= 0) return '';
    let icon = '';
    if (kind === 'bends') {
      for (let i = 0; i < 9; i++) {
        const k = (t * 0.9 + hash(i + 700)) % 1;
        icon += `<circle cx="${f2((hash(i + 720) - 0.5) * 70)}" cy="${f2(40 - k * 90)}" r="${f2(5 + hash(i + 740) * 10)}" fill="none" stroke="${PEARL}" stroke-width="3.5" opacity="${f2(1 - k * 0.7)}"/>`;
      }
    } else if (kind === 'drown') {
      for (let i = 0; i < 3; i++) {
        let pts = '';
        for (let xx = -50; xx <= 50; xx += 5) pts += `${xx},${f2(-30 + i * 18 + Math.sin(xx * 0.12 + t * 5 + i) * 5)} `;
        icon += `<polyline points="${pts}" fill="none" stroke="${PEARL}" stroke-width="4" stroke-linecap="round" opacity="${1 - i * 0.25}"/>`;
      }
      const dy = (t * 30) % 20;
      icon += `<path d="M0 ${f2(18 + dy * 0.3)} v22 m-12 -10 l12 12 l12 -12" fill="none" stroke="${PEARL}" stroke-width="4" stroke-linecap="round"/>`;
    } else {
      let d = '';
      for (let a = 0; a <= 4 * Math.PI; a += 0.2) {
        const r = 4 + a * 4;
        d += `${a ? 'L' : 'M'}${f2(Math.cos(a) * r)} ${f2(Math.sin(a) * r)} `;
      }
      icon = `<g transform="rotate(${f2(-t * 240)})"><path d="${d}" fill="none" stroke="${PEARL}" stroke-width="5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${PEARL}" stroke-width="5" stroke-linecap="round" transform="rotate(180)"/></g>`;
    }
    return `<g opacity="${f2(p.o)}">${around(x, y, p.s, `
      <circle cx="${x}" cy="${y}" r="78" fill="rgba(20,8,8,0.88)" stroke="${INK_RED}" stroke-width="6" filter="url(#shadowSoft)"/>
      <clipPath id="md${kind}"><circle cx="${x}" cy="${y}" r="70"/></clipPath>
      <g clip-path="url(#md${kind})"><g transform="translate(${x} ${y})">${icon}</g></g>
      <text x="${x}" y="${y + 128}" text-anchor="middle" font-family="${F_LABEL}" font-weight="700" font-size="34" letter-spacing="3" fill="${PEARL}" stroke="#000" stroke-width="6" paint-order="stroke">${label}</text>`)}</g>`;
  }

  // I · 21.50 "The bends, drowning, cyclones" — on-site history plaque, highlighted lines + hazard medallions
  function sHazard(t, lt) {
    const cardX = 40;
    const cardY = 470;
    const s = 1000 / 990;
    const src = (x, y) => [cardX + (x - 380) * s, cardY + (y - 425) * s];
    const inP = easeOutBack(seg(lt, 0, 0.45));
    const light = Math.max(Math.exp(-Math.pow((t - 23.34) / 0.05, 2)), 0.7 * Math.exp(-Math.pow((t - 23.52) / 0.04, 2)));
    const [shx, shy] = impactShake(t, 23.3, 9, 0.5);
    const hl = (x0, y0, x1, y1, at) => {
      const p = easeOutCubic(seg(t, at, at + 0.22));
      if (p <= 0) return '';
      const [a, b] = src(x0 - 8, y0 - 6);
      const [c, d] = src(x1 + 8, y1 + 6);
      return `<rect x="${f2(a)}" y="${f2(b)}" width="${f2((c - a) * p)}" height="${f2(d - b)}" rx="6" fill="#ffc446" opacity="0.32"/>
        <rect x="${f2(a)}" y="${f2(d - 2)}" width="${f2((c - a) * p)}" height="5" fill="#ffc446" filter="url(#glowGold)"/>`;
    };
    let rain = '';
    for (let i = 0; i < 70; i++) {
      const x = hash(i + 900) * (W + 400) - 200;
      const sp = 1400 + hash(i + 930) * 900;
      const y = ((hash(i + 960) * H + t * sp) % (H + 200)) - 100;
      rain += `<line x1="${f2(x)}" y1="${f2(y)}" x2="${f2(x - 28)}" y2="${f2(y + 70)}" stroke="#cfe3ff" stroke-width="2" opacity="${f2(0.1 + 0.15 * seg(t, 22.9, 23.4))}"/>`;
    }
    const card = `<g transform="translate(${f2(540 + shx)} ${f2(cardY + 205 + shy)}) scale(1 ${f2(lerp(0.2, 1, inP))}) translate(-540 ${-(cardY + 205)})">
        <rect x="${cardX - 10}" y="${cardY - 10}" width="1020" height="429" rx="10" fill="#1b140f" stroke="#7a5534" stroke-width="3" filter="url(#shadow)"/>
        ${photo(IMG.plaque, { x: cardX, y: cardY, w: 1000, h: 409, cx: 875, cy: 627.5, zoom: 1920 / 990 })}
        ${hl(398, 532, 628, 568, 21.74)}
        ${hl(1072, 486, 1212, 522, 22.55)}
        ${hl(908, 582, 1117, 618, 23.27)}
        ${hl(1163, 630, 1305, 666, 23.37)}
      </g>`;
    return (
      photo(IMG.plaque, { cx: 870, cy: 560, zoom: 1.2, filter: 'blurbg', dim: 0.62 }) +
      grade('#2a0806', 0.45) +
      rain +
      `<rect width="${W}" height="${H}" fill="url(#vig)" opacity="0.8"/>` +
      card +
      medallion('bends', 210, 1040, t, 21.78, 'THE BENDS') +
      medallion('drown', 540, 1040, t, 22.58, 'DROWNING') +
      medallion('cyclone', 870, 1040, t, 23.3, 'CYCLONES') +
      `<rect width="${W}" height="${H}" fill="#e8f1ff" opacity="${f2(light * 0.55)}"/>`
    );
  }

  // Small diver-helmet glyph for the 1-in-10 grid.
  function diverGlyph(x, y, s, o = {}) {
    const col = o.color || PEARL;
    const hollow = o.hollow;
    const fill = hollow ? 'none' : col;
    return `<g transform="translate(${f2(x)} ${f2(y)}) scale(${f2(s)})" opacity="${f2(o.alpha ?? 1)}">
      <path d="M-58,62 C-58,34 -40,26 -20,24 L20,24 C40,26 58,34 58,62 Z" fill="${fill}" stroke="${col}" stroke-width="5"/>
      <circle cx="0" cy="-12" r="44" fill="${fill}" stroke="${col}" stroke-width="5"/>
      <circle cx="0" cy="-8" r="20" fill="${hollow ? 'none' : '#1a2530'}" stroke="${hollow ? col : 'none'}" stroke-width="3"/>
      <circle cx="-34" cy="-22" r="9" fill="${hollow ? 'none' : '#1a2530'}"/><circle cx="34" cy="-22" r="9" fill="${hollow ? 'none' : '#1a2530'}"/>
    </g>`;
  }
  function headstone(x, y, s, alpha) {
    return `<g transform="translate(${f2(x)} ${f2(y)}) scale(${f2(s)})" opacity="${f2(alpha)}" filter="url(#glowGold)">
      <rect x="-30" y="-70" width="60" height="96" rx="4" fill="url(#sandstone)" stroke="#3b1a07" stroke-width="3"/>
      <rect x="-46" y="26" width="92" height="22" fill="#c9824a" stroke="#3b1a07" stroke-width="3"/>
      <line x1="0" y1="-52" x2="0" y2="8" stroke="#3b1a07" stroke-width="4" opacity="0.55"/></g>`;
  }

  // J · 24.25 "Historians estimate more than one in ten Japanese divers died each year"
  function sOneInTen(t, lt) {
    const cols = [200, 370, 540, 710, 880];
    const rows = [790, 1010];
    const lost = 7; // bottom row, 3rd glyph
    const dp = easeInOutCubic(seg(t, 27.35, 27.95));
    let grid = '';
    for (let i = 0; i < 10; i++) {
      const at = 24.95 + i * 0.125;
      const p = popIn(t, at, 0.3);
      if (p.p <= 0) continue;
      const x = cols[i % 5];
      const y = rows[Math.floor(i / 5)];
      if (i === lost && dp > 0) {
        grid += diverGlyph(x, y, 0.95, { hollow: true, alpha: lerp(1, 0.35, dp), color: '#cfc7bb' });
        grid += headstone(x, y + lerp(40, 0, dp), 0.9, dp);
      } else {
        grid += diverGlyph(x, y, 0.95 * p.s, { alpha: p.o * (1 - 0.35 * dp) });
      }
    }
    const est = popIn(t, 24.5, 0.35);
    const big = popIn(t, 25.82, 0.4);
    const yr = popIn(t, 27.72, 0.35);
    return (
      photo(IMG.graves, { cx: 820, cy: 620, zoom: 1.05 + lt * 0.035, filter: 'desat', dim: 0.6 }) +
      grade('#10141c', 0.3) +
      `<rect width="${W}" height="${H}" fill="url(#vig)" opacity="0.6"/>` +
      (est.p > 0 ? `<g opacity="${f2(est.o)}">${chip("HISTORIANS' ESTIMATE", 540, 330, { size: 32, accent: '#cfc7bb' })}</g>` : '') +
      (big.p > 0 ? `<g opacity="${f2(big.o)}">${around(540, 480, lerp(1.6, 1, easeOutCubic(big.p)), text3d('>1 IN 10', 540, 540, 170, { face: 'url(#pearlFace)', side: '#2a1508', depth: 10 }))}</g>` : '') +
      (yr.p > 0 ? `<g opacity="${f2(yr.o)}">${around(540, 632, yr.s, chip('EACH YEAR', 540, 632, { size: 34, dot: false }))}</g>` : '') +
      `<rect x="100" y="690" width="880" height="440" rx="24" fill="rgba(8,10,14,0.45)" stroke="rgba(242,196,109,0.35)" stroke-width="2" opacity="${f2(seg(t, 24.8, 25.1))}"/>` +
      grid
    );
  }

  // K · 28.70 "Over 900 people now rest in Broome's Japanese cemetery" — counter + 900-marker field
  const RANK = (() => {
    const idx = Array.from({ length: 900 }, (_, i) => i);
    idx.sort((a, b) => hash(a + 5000) - hash(b + 5000));
    const r = new Array(900);
    idx.forEach((v, k) => (r[v] = k));
    return r;
  })();
  function sNineHundred(t, lt) {
    const cp = easeOutCubic(seg(t, 28.92, 29.66));
    const n = Math.round(900 * cp);
    const glow = 0.5 + 0.5 * Math.sin(t * 3);
    const px = 120;
    const py = 700;
    const cw = 840 / 45;
    const chh = 330 / 20;
    let field = '';
    for (let i = 0; i < 900; i++) {
      if (RANK[i] >= n) continue;
      const c = i % 45;
      const r = Math.floor(i / 45);
      const dark = hash(i + 9000) < 0.22;
      const age = clamp((cp * 900 - RANK[i]) / 60, 0, 1);
      const shimmer = 0.75 + 0.25 * Math.sin(t * 2.5 + c * 0.3 + r * 0.5);
      field += `<rect x="${f2(px + c * cw + 4)}" y="${f2(py + r * chh + 2)}" width="${f2(cw - 8)}" height="${f2(chh - 4)}" rx="2" fill="${dark ? '#2f3036' : hash(i + 9100) < 0.5 ? '#e9c89a' : '#d9a066'}" stroke="${dark ? '#8b8f99' : 'none'}" stroke-width="1" opacity="${f2((0.55 + 0.45 * (1 - age)) * shimmer)}"/>`;
    }
    const over = popIn(t, 28.9, 0.3);
    const place = popIn(t, 30.86, 0.4);
    return (
      photo(IMG.path, { cx: 1010, cy: 420, zoom: 1.0 + 0.28 * easeInOutCubic(clamp(lt / 3.85, 0, 1)), dim: 0.45 }) +
      grade('#4a220a', 0.2) +
      topShade(700, 0.7) +
      (over.p > 0 ? `<g opacity="${f2(over.o)}">${chip('OVER', 540, 310, { size: 34, dot: false })}</g>` : '') +
      `<g opacity="${f2(clamp(cp * 4, 0, 1))}">${around(540, 520, 1 + 0.02 * glow * (cp >= 1 ? 1 : 0), text3d(String(n), 540, 600, 250, { depth: 14 }))}</g>` +
      `<rect x="${px - 20}" y="${py - 22}" width="880" height="374" rx="20" fill="rgba(8,8,12,0.55)" stroke="rgba(242,196,109,0.4)" stroke-width="2" opacity="${f2(seg(t, 28.75, 29.0))}"/>` +
      field +
      (place.p > 0 ? `<g opacity="${f2(place.o)}">${around(540, 1110, place.s, chip('BROOME JAPANESE CEMETERY', 540, 1110, { size: 36 }))}</g>` : '')
    );
  }

  // L · 32.55 "The pearling boom is one reason" — luggers + multiplying fleet glyphs
  function sBoom(t, lt) {
    const inn = easeOutCubic(seg(lt, 0, 0.45));
    let fleet = '';
    const count = Math.floor(lerp(0, 15, easeInCubic(seg(t, 32.8, 34.2)) ** 0.7));
    for (let i = 0; i < 15; i++) {
      if (i >= count) continue;
      const p = popIn(t, 32.8 + i * 0.09, 0.25);
      const x = 120 + (i % 8) * 120 + (i >= 8 ? 60 : 0);
      const y = i >= 8 ? 420 : 330;
      fleet += `<g transform="translate(${x} ${y}) scale(${f2(p.s)})" opacity="${f2(p.o)}">
        <path d="M-30,22 L30,22 L22,34 L-22,34 Z" fill="${GOLD}"/>
        <path d="M-4,20 L-4,-40 L26,16 Z" fill="${PEARL}" stroke="${GOLD}" stroke-width="2"/>
        <path d="M-8,20 L-8,-30 L-30,16 Z" fill="${PEARL}" opacity="0.85"/></g>`;
    }
    return (
      photo(IMG.luggers, { zoom: 1.3, filter: 'blurSepia', dim: 0.45 }) +
      `<g transform="translate(0 ${f2(lerp(120, 0, inn))})" opacity="${f2(inn)}">
        <rect x="52" y="522" width="976" height="660" rx="8" fill="#efe6d2" filter="url(#shadow)"/>
        ${photo(IMG.luggers, { x: 64, y: 534, w: 952, h: 636, cx: 300, cy: 230, zoom: 1.12 + lt * 0.05, filter: 'sepia' })}
      </g>` +
      filmFx(t, 0.8) +
      fleet
    );
  }

  // M · 34.35 "Japan opened its first consulate in Australia, in 1896" — document + seal (Townsville, never Broome)
  function sConsulate(t, lt) {
    const inn = easeOutCubic(seg(lt, 0.05, 0.6));
    const docY = lerp(1500, 0, inn);
    const rot = lerp(6, -1.5, inn);
    const [shx, shy] = impactShake(t, 37.5, 12, 0.4);
    const type = seg(t, 35.35, 36.2);
    const line1 = 'FIRST JAPANESE';
    const line2 = 'CONSULATE';
    const n1 = Math.round(line1.length * clamp(type * 1.6, 0, 1));
    const n2 = Math.round(line2.length * clamp((type - 0.55) / 0.45, 0, 1));
    const tv = popIn(t, 36.42, 0.4);
    let splat = '';
    const sp = seg(t, 37.5, 37.9);
    if (sp > 0) {
      for (let i = 0; i < 14; i++) {
        const a = hash(i + 1200) * Math.PI * 2;
        const d = 130 + hash(i + 1230) * 70 * easeOutCubic(sp);
        splat += `<circle cx="${f2(Math.cos(a) * d)}" cy="${f2(Math.sin(a) * d)}" r="${f2(2 + hash(i + 1260) * 6)}" fill="${INK_RED}" opacity="${f2(0.8 * (1 - sp * 0.3))}"/>`;
      }
    }
    const seal = seg(t, 37.44, 37.6);
    const sealS = lerp(2.4, 1, easeInCubic(seal));
    const doc = `<g transform="translate(${f2(540 + shx)} ${f2(800 + docY + shy)}) rotate(${f2(rot)})">
      <rect x="-430" y="-330" width="860" height="660" rx="8" fill="url(#parch)" filter="url(#shadow)"/>
      <rect x="-430" y="-330" width="860" height="660" rx="8" fill="#000" opacity="0.06" filter="url(#paperTex)"/>
      <rect x="-400" y="-300" width="800" height="600" fill="none" stroke="#6b4a2a" stroke-width="3"/>
      <rect x="-388" y="-288" width="776" height="576" fill="none" stroke="#6b4a2a" stroke-width="1.5"/>
      <text x="0" y="-150" text-anchor="middle" font-family="${F_LABEL}" font-weight="700" font-size="70" letter-spacing="6" fill="#2b2118">${esc(line1.slice(0, n1))}</text>
      <text x="0" y="-60" text-anchor="middle" font-family="${F_LABEL}" font-weight="700" font-size="92" letter-spacing="10" fill="#2b2118">${esc(line2.slice(0, n2))}</text>
      <line x1="-300" y1="0" x2="300" y2="0" stroke="#6b4a2a" stroke-width="3" opacity="${f2(clamp(type * 2, 0, 1))}"/>
      <g opacity="${f2(tv.o)}" transform="translate(-150 110) scale(${f2(tv.s)})">
        <path d="M0,0 C-6,-16 -24,-28 -24,-46 A24,24 0 1 1 24,-46 C24,-28 6,-16 0,0 Z" fill="${INK_RED}"/><circle cy="-46" r="9" fill="#f3e6c8"/>
      </g>
      <text x="-110" y="100" font-family="${F_LABEL}" font-weight="600" font-size="52" letter-spacing="4" fill="#2b2118" opacity="${f2(tv.o)}">TOWNSVILLE, QLD</text>
      ${
        seal > 0
          ? `<g transform="translate(250 210) rotate(-8) scale(${f2(sealS)})" opacity="${f2(clamp(seal * 1.5, 0, 0.94))}">
              ${splat}
              <g filter="url(#stampInk)"><rect x="-120" y="-78" width="240" height="156" rx="16" fill="${INK_RED}"/>
              <rect x="-106" y="-64" width="212" height="128" rx="10" fill="none" stroke="#f3e6c8" stroke-width="4"/>
              <text x="0" y="36" text-anchor="middle" font-family="${F_DISPLAY}" font-size="104" letter-spacing="4" fill="#f3e6c8">1896</text></g></g>`
          : ''
      }
    </g>`;
    return (
      photo(IMG.restore, { cx: 800, cy: 420, zoom: 1.15 + lt * 0.03, dim: 0.62 }) +
      grade('#2a1a0c', 0.3) +
      `<rect width="${W}" height="${H}" fill="url(#vig)" opacity="0.6"/>` +
      doc
    );
  }

  // N · 38.85 "That's why" — whip back to the open; hook slams in to match frame 1 (loop)
  function sLoop(t, lt) {
    const z = lerp(1.1, 1.15, clamp(lt / 0.96, 0, 1));
    const p = seg(t, 39.42, DUR);
    const s = lerp(2.3, 1.065, easeInCubic(p));
    let lines = '';
    const lp = seg(t, 39.3, DUR);
    if (lp > 0) {
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2 + hash(i) * 0.2;
        const r0 = lerp(900, 380, lp) + hash(i + 40) * 120;
        const r1 = r0 + 160 + hash(i + 80) * 200;
        lines += `<line x1="${f2(540 + Math.cos(a) * r0)}" y1="${f2(700 + Math.sin(a) * r0)}" x2="${f2(540 + Math.cos(a) * r1)}" y2="${f2(700 + Math.sin(a) * r1)}" stroke="#fff3da" stroke-width="3" opacity="${f2(0.35 * lp)}"/>`;
      }
    }
    return rowsUnderlay(t, z) + lines + (p > 0 ? hookCard(s, clamp(p * 2.5, 0, 1)) : '');
  }

  // ---------- timeline (seams from transcript.json) ----------
  const SCENES = [
    { id: 'hook', start: 0.0, draw: sHook },
    { id: 'beach', start: 3.1, draw: sBeach, tin: 'cut' },
    { id: 'memorial', start: 5.45, draw: sMemorial, tin: 'fade', xf: 0.4 },
    { id: 'orbit', start: 8.3, draw: sOrbit, tin: 'zoom', xf: 0.3 },
    { id: 'era', start: 10.25, draw: sEra, tin: 'flash', xf: 0.22 },
    { id: 'shell', start: 11.85, draw: sShell, tin: 'fade', xf: 0.3 },
    { id: 'arrive', start: 14.15, draw: sArrive, tin: 'whip', xf: 0.3 },
    { id: 'dive', start: 18.05, draw: sDive, tin: 'fade', xf: 0.3 },
    { id: 'hazard', start: 21.5, draw: sHazard, tin: 'dip', xf: 0.3 },
    { id: 'oneinten', start: 24.25, draw: sOneInTen, tin: 'fade', xf: 0.35 },
    { id: 'ninehundred', start: 28.7, draw: sNineHundred, tin: 'zoom', xf: 0.3 },
    { id: 'boom', start: 32.55, draw: sBoom, tin: 'whip', xf: 0.3 },
    { id: 'consulate', start: 34.35, draw: sConsulate, tin: 'fade', xf: 0.25 },
    { id: 'loop', start: 38.85, draw: sLoop, tin: 'whip', xf: 0.28 },
  ];

  function transitionIn(kind, p, layer) {
    if (p >= 1) return layer;
    const e = easeOutCubic(p);
    if (kind === 'cut') return layer;
    if (kind === 'whip') {
      const blur = 60 * (1 - p);
      dyn(`<filter id="whipIn" x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation="${f2(blur)} 0"/></filter>`);
      return `<g transform="translate(${f2(W * 0.9 * (1 - e))} 0)" filter="url(#whipIn)" opacity="${f2(clamp(p * 2.5, 0, 1))}">${layer}</g>`;
    }
    if (kind === 'zoom') {
      return `<g opacity="${f2(e)}">${around(540, 900, lerp(1.35, 1, e), layer)}</g>`;
    }
    if (kind === 'dip') {
      return `<g opacity="${f2(easeInOutCubic(p))}">${layer}</g>`;
    }
    return `<g opacity="${f2(easeInOutCubic(p))}">${layer}</g>`;
  }
  function transitionOut(kind, p, layer) {
    if (p <= 0) return layer;
    if (kind === 'whip') {
      const e = easeInCubic(p);
      dyn(`<filter id="whipOut" x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation="${f2(50 * p)} 0"/></filter>`);
      return `<g transform="translate(${f2(-W * 0.6 * e)} 0)" filter="url(#whipOut)">${layer}</g>`;
    }
    if (kind === 'dip') return `<g opacity="${f2(1 - easeInOutCubic(clamp(p * 1.6, 0, 1)))}">${layer}</g>`;
    return layer;
  }

  // ---------- karaoke captions ----------
  const FORCE_BREAK = [3.06, 19.2, 20.3, 25.82, 30.86, 34.4];
  function buildCaps(words) {
    const groups = [];
    let cur = [];
    const flush = () => {
      if (cur.length) groups.push(cur);
      cur = [];
    };
    words.forEach((w, i) => {
      const prev = words[i - 1];
      if (cur.length) {
        const gap = w.start - prev.end;
        const chars = cur.map((x) => x.word).join(' ').length + w.word.length;
        const forced = FORCE_BREAK.some((ft) => Math.abs(ft - w.start) < 0.02);
        if (/[.,!?…]$/.test(prev.word) || cur.length >= 4 || gap > 0.35 || chars > 22 || forced) flush();
      }
      cur.push(w);
    });
    flush();
    return groups.map((g, i) => ({ words: g, start: g[0].start, end: g[g.length - 1].end, idx: i }));
  }

  function capY(t) {
    if (t >= 20.2 && t <= 21.6) return 1010; // "and lead boots" — boots callout owns the lower band
    return CAP_Y;
  }

  function captions(t) {
    const ep = window.EPISODE;
    if (!ep._caps) ep._caps = buildCaps(ep.words || []);
    const caps = ep._caps;
    let g = null;
    for (let i = 0; i < caps.length; i++) {
      const c = caps[i];
      const next = caps[i + 1];
      const until = next ? Math.min(c.end + 0.35, next.start - 0.02) : DUR + 1;
      if (t >= c.start - 0.06 && t < until) {
        g = { ...c, until };
        break;
      }
    }
    if (!g) return '';
    const size = 62;
    const space = measure(' ', size, F_CAP, 400) + 16; // room for the active-word pop
    const items = g.words.map((w) => {
      const txt = w.word.toUpperCase().replace(/’/g, "'");
      return { w, txt, width: measure(txt, size, F_CAP, 400) };
    });
    const lines = [[]];
    let lw = 0;
    items.forEach((it) => {
      const add = (lines[lines.length - 1].length ? space : 0) + it.width;
      if (lw + add > 900 && lines[lines.length - 1].length) {
        lines.push([it]);
        lw = it.width;
      } else {
        lines[lines.length - 1].push(it);
        lw += add;
      }
    });
    const lh = 78;
    const y0 = capY(t) - ((lines.length - 1) * lh) / 2 + size * 0.36;
    const inP = easeOutBack(seg(t, g.start - 0.06, g.start + 0.12));
    const outA = t > g.until - 0.08 ? clamp((g.until - t) / 0.08, 0, 1) : 1;
    let s = '';
    lines.forEach((ln, li) => {
      const total = ln.reduce((a, it, k) => a + it.width + (k ? space : 0), 0);
      let x = 540 - total / 2;
      ln.forEach((it) => {
        const active = t >= it.w.start - 0.03 && t < it.w.end + 0.05;
        const past = t >= it.w.end + 0.05;
        const pop = active ? 1 + 0.12 * Math.sin(Math.PI * clamp((t - it.w.start + 0.03) / 0.22, 0, 1)) : 1;
        const cx = x + it.width / 2;
        const cy = y0 + li * lh - size * 0.36;
        const fill = active ? '#ffcf5a' : past ? '#ffffff' : 'rgba(255,255,255,0.88)';
        s += `<text x="${f2(cx)}" y="${f2(y0 + li * lh)}" text-anchor="middle" font-family="${F_CAP}" font-size="${size}" fill="${fill}" stroke="#000" stroke-width="11" stroke-linejoin="round" paint-order="stroke" transform="translate(${f2(cx)} ${f2(cy)}) scale(${f2(pop)}) translate(${f2(-cx)} ${f2(-cy)})">${esc(it.txt)}</text>`;
        x += it.width + space;
      });
    });
    const cy = capY(t);
    return `<g opacity="${f2(outA)}">
      <ellipse cx="540" cy="${cy}" rx="600" ry="${lines.length > 1 ? 150 : 110}" fill="url(#capShade)"/>
      <g filter="url(#capShadow)">${around(540, cy, lerp(0.86, 1, inP), s)}</g></g>`;
  }

  // ---------- static defs ----------
  const STATIC_DEFS = `
    <filter id="sepia" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.393 0.769 0.189 0 0.02 0.349 0.686 0.168 0 0.01 0.272 0.534 0.131 0 0 0 0 0 1 0"/></filter>
    <filter id="desat" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0.3"/></filter>
    <filter id="desatHalf" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0.45"/></filter>
    <filter id="blurbg" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="18"/></filter>
    <filter id="blurSepia" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="16"/><feColorMatrix type="matrix" values="0.393 0.769 0.189 0 0 0.349 0.686 0.168 0 0 0.272 0.534 0.131 0 0 0 0 0 1 0"/></filter>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#000" flood-opacity="0.7"/></filter>
    <filter id="shadowSoft" x="-20%" y="-30%" width="140%" height="170%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.6"/></filter>
    <filter id="capShadow" x="-10%" y="-40%" width="120%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity="0.75"/></filter>
    <filter id="glowWhite" x="-20%" y="-40%" width="140%" height="180%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="7" result="d"/><feGaussianBlur in="d" stdDeviation="7" result="b"/>
      <feFlood flood-color="#ffffff" flood-opacity="0.95"/><feComposite in2="b" operator="in" result="g"/>
      <feDropShadow in="SourceGraphic" dx="0" dy="10" stdDeviation="10" flood-color="#000" flood-opacity="0.6" result="s"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="s"/></feMerge></filter>
    <filter id="glowGold" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="stampInk" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.75" result="m"/>
      <feComposite in="SourceGraphic" in2="m" operator="in"/></filter>
    <filter id="paperTex" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="3"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.9"/></feComponentTransfer></filter>
    <linearGradient id="sandstone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3dc"/><stop offset="0.5" stop-color="#efbf7c"/><stop offset="1" stop-color="#c06f33"/></linearGradient>
    <linearGradient id="pearlFace" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.6" stop-color="#f3ece0"/><stop offset="1" stop-color="#d7c6a8"/></linearGradient>
    <linearGradient id="copper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7b27a"/><stop offset="0.5" stop-color="#c8662b"/><stop offset="1" stop-color="#7a3212"/></linearGradient>
    <radialGradient id="copperDome" cx="0.36" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffd7ae"/><stop offset="0.35" stop-color="#e38a4a"/><stop offset="0.8" stop-color="#9b4518"/><stop offset="1" stop-color="#5e260b"/></radialGradient>
    <radialGradient id="glass" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffffff" stop-opacity="0.7"/><stop offset="0.4" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
    <radialGradient id="nacre" cx="0.45" cy="0.3" r="0.8"><stop offset="0" stop-color="#f4f7f6"/><stop offset="0.25" stop-color="#cfe3ea"/><stop offset="0.45" stop-color="#e6cde0"/><stop offset="0.62" stop-color="#bfe0d2"/><stop offset="0.8" stop-color="#e8cf9c"/><stop offset="1" stop-color="#b8863a"/></radialGradient>
    <radialGradient id="shellOut" cx="0.5" cy="0.3" r="0.8"><stop offset="0" stop-color="#9c8a63"/><stop offset="1" stop-color="#4b3d27"/></radialGradient>
    <radialGradient id="pearlHalo"><stop offset="0" stop-color="#e9fbff" stop-opacity="0.55"/><stop offset="1" stop-color="#e9fbff" stop-opacity="0"/></radialGradient>
    <radialGradient id="sunGlow"><stop offset="0" stop-color="#fffbe8" stop-opacity="0.95"/><stop offset="0.3" stop-color="#ffe8b0" stop-opacity="0.45"/><stop offset="1" stop-color="#ffe8b0" stop-opacity="0"/></radialGradient>
    <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f7f93"/><stop offset="0.5" stop-color="#0b3c55"/><stop offset="1" stop-color="#04121f"/></linearGradient>
    <linearGradient id="rayGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2d6" stop-opacity="0.9"/><stop offset="1" stop-color="#fff2d6" stop-opacity="0"/></linearGradient>
    <linearGradient id="parch" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6ead0"/><stop offset="1" stop-color="#dcc79c"/></linearGradient>
    <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.85"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="fadeDown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a130c" stop-opacity="1"/><stop offset="1" stop-color="#1a130c" stop-opacity="0"/></linearGradient>
    <linearGradient id="fadeUp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a130c" stop-opacity="0"/><stop offset="1" stop-color="#1a130c" stop-opacity="1"/></linearGradient>
    <radialGradient id="vig" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/></radialGradient>
    <radialGradient id="capShade"><stop offset="0" stop-color="#000" stop-opacity="0.42"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`;

  function grain(t) {
    const seed = Math.floor(t * 30) % 211;
    dyn(`<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="${seed}" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>`);
    return `<rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.07" style="mix-blend-mode:overlay"/>`;
  }

  window.renderFrame = function (t) {
    t = clamp(t, 0, DUR);
    DYN = [];
    let body = '';
    for (let i = 0; i < SCENES.length; i++) {
      const sc = SCENES[i];
      const nx = SCENES[i + 1];
      const visEnd = nx ? nx.start + (nx.tin === 'cut' ? 0 : nx.xf || 0.3) : DUR + 1;
      if (t < sc.start || t >= visEnd) continue;
      let layer = sc.draw(t, t - sc.start);
      if (i > 0 && sc.tin !== 'cut') layer = transitionIn(sc.tin, clamp((t - sc.start) / (sc.xf || 0.3), 0, 1), layer);
      if (nx && t >= nx.start && nx.tin !== 'cut') layer = transitionOut(nx.tin, clamp((t - nx.start) / (nx.xf || 0.3), 0, 1), layer);
      body += layer;
    }
    // flash transitions (warm white pop at seam)
    let flash = '';
    SCENES.forEach((sc) => {
      if (sc.tin === 'flash') {
        const k = Math.exp(-Math.pow((t - sc.start - 0.04) / 0.07, 2));
        if (k > 0.01) flash += `<rect width="${W}" height="${H}" fill="#fff6e4" opacity="${f2(k * 0.8)}"/>`;
      }
    });
    const overlay = `<rect width="${W}" height="${H}" fill="url(#vig)" opacity="0.45"/>` + grain(t) + flash;
    const caps = captions(t);
    document.getElementById('root').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>${STATIC_DEFS}${DYN.join('')}</defs>
      <rect width="${W}" height="${H}" fill="#07080c"/>
      ${body}${overlay}${caps}</svg>`;
  };

  // ---------- preload: fonts + image decode (awaited by capture.mjs) ----------
  const KEEP = [];
  const FONTS = [
    ['Anton', '/fonts/Anton-Regular.ttf', {}],
    ['Archivo Black', '/fonts/ArchivoBlack-Regular.ttf', {}],
    ['Oswald', '/fonts/Oswald-Variable.ttf', { weight: '200 700' }],
  ];
  const ready = (async () => {
    await Promise.all(
      FONTS.map(async ([fam, url, desc]) => {
        const f = new FontFace(fam, `url(${url})`, desc);
        await f.load();
        document.fonts.add(f);
      })
    );
    await Promise.all(
      Object.values(IMG).map(
        (im) =>
          new Promise((res) => {
            const i = new Image();
            i.onload = () => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()).then(res);
            i.onerror = res;
            i.src = im.src;
            KEEP.push(i);
          })
      )
    );
  })();

  window.EPISODE = {
    duration: DUR,
    fps: 30,
    images: Object.fromEntries(Object.entries(IMG).map(([k, v]) => [k, v.src])),
    words: [],
    scenes: SCENES,
    ready,
  };
})();
