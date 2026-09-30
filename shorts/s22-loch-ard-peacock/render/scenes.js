/* s22-loch-ard-peacock — Skylab photo-underlay + premium SVG motion graphics.
 * SVG + renderFrame(t) + Playwright + ffmpeg (shared/render). No Remotion.
 * All seams are keyed to Whisper word timings in ../transcript.json (Atlas VO, 40.200 s).
 * On-screen text = names / places / dates / counts only (no VO-echo titles).
 */
(function () {
  const HS = window.HS;
  const { W, H, clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic, easeOutElastic } = HS;
  const DUR = 40.2;
  const CAP_Y = HS.CAPTION_Y; // 1344 — lower-middle band (~70%)

  // ---------- palette ----------
  const C = {
    ink: '#060d16',
    gold: '#f0c46a',
    goldHi: '#ffe3a1',
    goldLo: '#9a6a22',
    teal: '#3ec9b8',
    peacock: '#1fa383',
    cream: '#fff4e2',
    red: '#e0493c',
    sea: '#7fd3ff',
  };
  const F = {
    anton: "'Anton', 'Arial Black', sans-serif",
    mont: "'Montserrat', 'Arial Black', sans-serif",
    play: "'Playfair Display', Georgia, serif",
  };

  // ---------- assets ----------
  const IMG = {
    peacock: { u: '/img/s22_01_peacock.jpg', w: 1536, h: 2048 },
    arch: { u: '/img/s22_02_gorge_valued.jpg', w: 2388, h: 1512 },
    beach: { u: '/img/s22_03_gorge_beach.jpg', w: 4272, h: 2848 },
    gorgeSea: { u: '/img/s22_04_gorge_gor.jpg', w: 2592, h: 1944 },
    gorgeSand: { u: '/img/s22_05_gorge_in_australia.jpg', w: 5472, h: 3648 },
    mutton: { u: '/img/s22_07_mutton_bird_island.jpg', w: 1920, h: 969 },
    ship: { u: '/img/s22_08_ship_slv.jpg', w: 3200, h: 2283 },
    shipTug: { u: '/img/s22_09_ship_tugboat.jpg', w: 990, h: 652 },
    churn: { u: '/img/s22_15_gor_gorge.jpg', w: 1920, h: 1440 },
    gorgeWarm: { u: '/img/s22_16_gorge_vic.jpg', w: 1920, h: 1164 },
    pano: { u: '/img/s22_17_gorge_panorama.jpg', w: 1920, h: 634 },
    gorgeDark: { u: '/img/s22_20_great_ocean_road_gorge.jpg', w: 1920, h: 1146 },
    flagstaff: { u: '/img/s22_22_flagstaff_village.jpg', w: 1280, h: 853 },
  };

  // fonts (OFL, render/fonts) + image preload so no frame renders blank
  const FONT_CSS = `
    @font-face{font-family:'Anton';src:url(/ep/fonts/Anton-Regular.ttf) format('truetype');font-weight:400;}
    @font-face{font-family:'Montserrat';src:url(/ep/fonts/Montserrat-800.ttf) format('truetype');font-weight:800;}
    @font-face{font-family:'Montserrat';src:url(/ep/fonts/Montserrat-900.ttf) format('truetype');font-weight:900;}
    @font-face{font-family:'Playfair Display';src:url(/ep/fonts/PlayfairDisplay-900.ttf) format('truetype');font-weight:900;}
    @font-face{font-family:'Playfair Display';src:url(/ep/fonts/PlayfairDisplay-700i.ttf) format('truetype');font-weight:700;font-style:italic;}`;
  const st = document.createElement('style');
  st.textContent = FONT_CSS;
  document.head.appendChild(st);
  const GRAIN = '/ep/assets/grain.png';
  window.EPISODE_READY = Promise.all([
    document.fonts.load("400 100px 'Anton'"),
    document.fonts.load("800 40px 'Montserrat'"),
    document.fonts.load("900 40px 'Montserrat'"),
    document.fonts.load("900 40px 'Playfair Display'"),
    document.fonts.load("italic 700 40px 'Playfair Display'"),
    ...Object.values(IMG).map((im) => {
      const i = new Image();
      i.src = im.u;
      return i.decode().catch(() => {});
    }),
    (() => {
      const i = new Image();
      i.src = GRAIN;
      return i.decode().catch(() => {});
    })(),
  ]);

  // ---------- small utils ----------
  const cl01 = (v) => clamp(v, 0, 1);
  const prog = (t, a, d) => cl01((t - a) / d);
  const rand = (i) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const easeInCubic = (x) => x * x * x;
  const fmt = (n) => (Math.round(n * 100) / 100).toString();

  /** Full-bleed photo with focal point, zoom and drift; always covers frame. */
  function photo(key, o = {}) {
    const im = IMG[key];
    const zoom = o.zoom || 1;
    const s = Math.max(W / im.w, H / im.h) * zoom;
    const iw = im.w * s;
    const ih = im.h * s;
    const fx = o.fx != null ? o.fx : 0.5;
    const fy = o.fy != null ? o.fy : 0.5;
    const x = clamp(W / 2 - fx * iw + (o.dx || 0), W - iw, 0);
    const y = clamp(H / 2 - fy * ih + (o.dy || 0), H - ih, 0);
    const filt = o.grade ? ` filter="url(#${o.grade})"` : '';
    const dim = o.dim != null ? o.dim : 0.4;
    return `<image href="${im.u}" x="${fmt(x)}" y="${fmt(y)}" width="${fmt(iw)}" height="${fmt(ih)}" preserveAspectRatio="none"${filt}/>
      <rect width="${W}" height="${H}" fill="${o.tint || '#000'}" opacity="${dim}"/>`;
  }
  /** Screen position of an image point for a photo() call (to anchor MG on real geography). */
  function photoPt(key, o, px, py) {
    const im = IMG[key];
    const zoom = o.zoom || 1;
    const s = Math.max(W / im.w, H / im.h) * zoom;
    const iw = im.w * s;
    const ih = im.h * s;
    const x = clamp(W / 2 - (o.fx != null ? o.fx : 0.5) * iw + (o.dx || 0), W - iw, 0);
    const y = clamp(H / 2 - (o.fy != null ? o.fy : 0.5) * ih + (o.dy || 0), H - ih, 0);
    return [x + px * iw, y + py * ih];
  }

  // ---------- shared defs ----------
  function defs() {
    return `<defs>
      <filter id="gCold" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.72 0.12 0.06 0 0  0.08 0.82 0.12 0 0.01  0.08 0.16 0.95 0 0.04  0 0 0 1 0"/></filter>
      <filter id="gNight" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.25 0.2 0.08 0 0  0.12 0.35 0.16 0 0.01  0.12 0.3 0.55 0 0.06  0 0 0 1 0"/></filter>
      <filter id="gSepia" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.42 0.72 0.18 0 0  0.35 0.64 0.16 0 0  0.26 0.5 0.13 0 0  0 0 0 1 0"/></filter>
      <filter id="gWarm" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1.08 0.06 0 0 0.02  0.02 1.0 0 0 0.01  0 0 0.82 0 0  0 0 0 1 0"/></filter>
      <filter id="gPop" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="1.35"/><feComponentTransfer><feFuncR type="linear" slope="1.35" intercept="0.02"/><feFuncG type="linear" slope="1.35" intercept="0.02"/><feFuncB type="linear" slope="1.25" intercept="0.02"/></feComponentTransfer></filter>
      <filter id="gMute" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0.35"/></filter>
      <filter id="gDeep" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.6 0.15 0.05 0 0  0.1 0.7 0.12 0 0  0.1 0.2 0.85 0 0.03  0 0 0 1 0"/></filter>
      <filter id="blurX" x="-20%" y="0" width="140%" height="100%"><feGaussianBlur stdDeviation="46 0"/></filter>
      <filter id="soft"><feGaussianBlur stdDeviation="10"/></filter>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="glowS" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity="0.65"/></filter>
      <linearGradient id="goldG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c2"/><stop offset="0.45" stop-color="${C.gold}"/><stop offset="1" stop-color="#b07a2a"/></linearGradient>
      <linearGradient id="goldH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b07a2a" stop-opacity="0"/><stop offset="0.5" stop-color="${C.goldHi}"/><stop offset="1" stop-color="#b07a2a" stop-opacity="0"/></linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101c2a" stop-opacity="0.9"/><stop offset="1" stop-color="#050a12" stop-opacity="0.88"/></linearGradient>
      <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.72"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
      <linearGradient id="botShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.78"/></linearGradient>
      <radialGradient id="vig" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.72"/></radialGradient>
      <radialGradient id="dawn" cx="0.5" cy="1" r="0.8"><stop offset="0" stop-color="#ff9a5c" stop-opacity="0.55"/><stop offset="0.5" stop-color="#8a4f7a" stop-opacity="0.2"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <radialGradient id="spot" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff2cf" stop-opacity="0.55"/><stop offset="1" stop-color="#fff2cf" stop-opacity="0"/></radialGradient>
      <radialGradient id="tealSpot" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${C.teal}" stop-opacity="0.5"/><stop offset="1" stop-color="${C.teal}" stop-opacity="0"/></radialGradient>
      <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b98450"/><stop offset="1" stop-color="#7a4f28"/></linearGradient>
      <linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c9"/><stop offset="0.35" stop-color="${C.gold}"/><stop offset="0.7" stop-color="#a86e1f"/><stop offset="1" stop-color="#ffe29a"/></linearGradient>
      <pattern id="grainP" patternUnits="userSpaceOnUse" width="384" height="384"><image href="${GRAIN}" width="384" height="384"/></pattern>
    </defs>`;
  }

  // ---------- design components ----------
  function chip(label, x, y, p, o = {}) {
    if (p <= 0) return '';
    const e = easeOutBack(cl01(p));
    const fs = o.fs || 30;
    const w = o.w || label.length * (fs * 0.72 + 3) + (o.icon === false ? 64 : 116);
    const icon =
      o.icon === false
        ? ''
        : `<g transform="translate(${-w / 2 + 44} 0)">
            <path d="M0,-20 C-12,-20 -18,-11 -18,-3 C-18,9 0,22 0,22 C0,22 18,9 18,-3 C18,-11 12,-20 0,-20 Z" fill="${o.accent || C.gold}"/>
            <circle cx="0" cy="-4" r="6" fill="${C.ink}"/></g>`;
    const tx = o.icon === false ? 0 : 26;
    return `<g transform="translate(${x} ${y}) scale(${fmt(e)})" opacity="${cl01(p * 3)}" filter="url(#shadow)">
      <rect x="${-w / 2}" y="-38" width="${w}" height="76" rx="38" fill="url(#glass)" stroke="${o.accent || C.gold}" stroke-width="3"/>
      ${icon}
      <text x="${tx}" y="${fs * 0.36}" text-anchor="middle" font-family="${F.mont}" font-weight="900" font-size="${fs}"
        fill="${C.cream}" letter-spacing="3">${esc(label)}</text>
    </g>`;
  }

  /** Period name card: Playfair name + gold rule + role line. */
  function nameCard(name, sub, x, y, p, o = {}) {
    if (p <= 0) return '';
    const e = easeOutCubic(cl01(p / 0.6));
    const rule = easeInOutCubic(prog(p, 0.25, 0.5));
    const subA = prog(p, 0.45, 0.4);
    const w = o.w || 700;
    const out = o.out != null ? o.out : 1;
    return `<g transform="translate(${x + (1 - e) * -80} ${y})" opacity="${e * out}" filter="url(#shadow)">
      <rect x="0" y="-96" width="${w}" height="168" rx="10" fill="url(#glass)" opacity="0.92"/>
      <rect x="0" y="-96" width="10" height="168" fill="${o.accent || C.gold}"/>
      <text x="44" y="-12" font-family="${F.play}" font-weight="900" font-size="${o.fs || 76}" fill="${C.cream}">${esc(name)}</text>
      <rect x="44" y="12" width="${(w - 90) * rule}" height="4" fill="url(#goldH)"/>
      <text x="46" y="52" font-family="${F.mont}" font-weight="800" font-size="26" letter-spacing="7" fill="${o.accent || C.gold}" opacity="${subA}">${esc(sub)}</text>
    </g>`;
  }

  function personIcon(variant, fill) {
    // dignified generic silhouettes (no likeness implied)
    if (variant === 'eva') {
      return `<g fill="${fill}"><path d="M-34,-30 C-36,-66 36,-66 34,-30 C40,-8 30,8 22,14 L-22,14 C-30,8 -40,-8 -34,-30 Z" opacity="0.85"/>
        <circle cx="0" cy="-30" r="27"/><path d="M-62,70 C-60,24 -30,12 0,12 C30,12 60,24 62,70 Z"/></g>`;
    }
    return `<g fill="${fill}"><circle cx="0" cy="-30" r="28"/><path d="M-26,-44 C-20,-66 22,-66 28,-44 L28,-38 C14,-50 -12,-50 -28,-38 Z" opacity="0.9"/>
      <path d="M-62,70 C-60,24 -30,12 0,12 C30,12 60,24 62,70 Z"/></g>`;
  }

  /** Three survivor medallions: appear[i], fill[i] times (s). q = question pulse on slot 3. */
  function medallions(t, o) {
    const r = o.r || 118;
    const xs = o.xs || [250, 540, 830];
    const y = o.y || 780;
    let s = '';
    for (let i = 0; i < 3; i++) {
      const a = prog(t, o.appear[i], 0.35);
      if (a <= 0) continue;
      const sc = easeOutBack(a) * (o.scale ? o.scale[i] || 1 : 1);
      const f = o.fill ? prog(t, o.fill[i], 0.3) : 0;
      const cx = o.pos ? o.pos[i][0] : xs[i];
      const cy = o.pos ? o.pos[i][1] : y;
      const pulse = o.pulse ? 1 + 0.04 * Math.sin((t - o.pulse) * 9) * prog(t, o.pulse, 0.2) * (1 - prog(t, o.pulse + 1.2, 0.3)) : 1;
      const id = `md${o.key || ''}${i}`;
      let inner = '';
      if (f > 0) {
        if (i < 2) {
          inner = `<g opacity="${f}" transform="translate(0 ${fmt((1 - easeOutCubic(f)) * 40 + 18)})">${personIcon(i === 1 ? 'eva' : 'tom', C.cream)}</g>`;
        } else {
          // real peacock photo crop inside the third medallion
          const ps = 0.42;
          inner = `<g opacity="${f}"><image href="${IMG.peacock.u}" x="${-1536 * ps * 0.43}" y="${-2048 * ps * 0.52}" width="${1536 * ps}" height="${2048 * ps}" preserveAspectRatio="none"/></g>`;
        }
      }
      const q =
        i === 2 && o.q && f < 1
          ? `<text y="44" text-anchor="middle" font-family="${F.anton}" font-size="130" fill="${C.gold}" opacity="${(1 - f) * (0.7 + 0.3 * Math.sin(t * 8))}" filter="url(#glowS)">?</text>`
          : '';
      const burst = f > 0 && f < 1 ? `<circle r="${r + 30 * f}" fill="none" stroke="${C.goldHi}" stroke-width="${6 * (1 - f)}" opacity="${1 - f}"/>` : '';
      s += `<g transform="translate(${fmt(cx)} ${fmt(cy)}) scale(${fmt(sc * pulse)})" opacity="${cl01(a * 2) * (o.alpha != null ? o.alpha : 1)}">
        <clipPath id="${id}"><circle r="${r - 8}"/></clipPath>
        <circle r="${r + 16}" fill="url(#tealSpot)" opacity="${0.5 + 0.5 * f}"/>
        <circle r="${r}" fill="rgba(6,13,22,0.78)" stroke="url(#ringG)" stroke-width="7" filter="url(#shadow)"/>
        <circle r="${r - 16}" fill="none" stroke="${C.gold}" stroke-width="1.5" stroke-dasharray="4 8" opacity="${0.6 * (1 - f)}"/>
        <g clip-path="url(#${id})">${inner}</g>
        ${q}${burst}
      </g>`;
    }
    return s;
  }

  /** Big 3D-extruded Anton type. */
  function slabText(txt, x, y, size, o = {}) {
    const depth = o.depth || 10;
    let ext = '';
    for (let d = depth; d > 0; d--) {
      ext += `<text x="${x + d * 0.9}" y="${y + d * 1.1}" text-anchor="middle" font-family="${F.anton}" font-size="${size}" fill="${o.ext || '#3b2508'}" letter-spacing="${o.ls || 0}">${esc(txt)}</text>`;
    }
    return `<g>${ext}<text x="${x}" y="${y}" text-anchor="middle" font-family="${F.anton}" font-size="${size}" fill="${o.fill || 'url(#goldG)'}" stroke="${o.stroke || '#1a0f02'}" stroke-width="${o.sw || 3}" paint-order="stroke" letter-spacing="${o.ls || 0}">${esc(txt)}</text></g>`;
  }

  /** Frame-1 hook card: THREE SURVIVORS (unspoken). s = scale, a = alpha. */
  function hookCard(s, a, shimmer) {
    if (a <= 0) return '';
    const sh = shimmer != null ? shimmer : 0;
    return `<g opacity="${a}" transform="translate(540 400) scale(${fmt(s)}) translate(-540 -400)">
      <rect x="0" y="0" width="${W}" height="700" fill="url(#topShade)"/>
      <text x="540" y="222" text-anchor="middle" font-family="${F.mont}" font-weight="900" font-size="30" letter-spacing="12" fill="${C.goldHi}">LOCH ARD · 1878</text>
      <rect x="250" y="240" width="580" height="3" fill="url(#goldH)"/>
      ${slabText('THREE', 540, 438, 206, { depth: 12, ls: 6 })}
      <rect x="${170 + sh * 740}" y="270" width="60" height="180" fill="#fff" opacity="${0.25 * Math.sin(Math.PI * sh)}" transform="skewX(-20)"/>
      ${slabText('SURVIVORS', 540, 560, 118, { depth: 8, ls: 10, fill: C.cream, ext: '#111' })}
    </g>`;
  }

  function particlesDust(t, n, seed, o = {}) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const r1 = rand(i + seed);
      const r2 = rand(i * 3.7 + seed);
      const r3 = rand(i * 7.1 + seed);
      const sp = o.speed || 30;
      const x = (r1 * W + Math.sin(t * 0.6 + i) * 20 + (o.dx || 0) * t) % W;
      const y = (((r2 * H - t * sp * (0.5 + r3)) % H) + H) % H;
      const rr = 1.5 + r3 * (o.size || 3);
      s += `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt(rr)}" fill="${o.color || C.goldHi}" opacity="${fmt((o.alpha || 0.5) * (0.4 + 0.6 * r2))}"/>`;
    }
    return s;
  }

  function burst(cx, cy, p, n, o = {}) {
    if (p <= 0 || p >= 1) return '';
    let s = '';
    const e = easeOutCubic(p);
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + rand(i + (o.seed || 0)) * 0.4;
      const d = (o.r || 220) * e * (0.6 + 0.4 * rand(i * 2 + (o.seed || 0)));
      const x = cx + Math.cos(ang) * d;
      const y = cy + Math.sin(ang) * d + (o.grav || 0) * p * p;
      s += `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt((o.size || 6) * (1 - p) + 1)}" fill="${o.color || C.goldHi}" opacity="${fmt(1 - p)}"/>`;
    }
    return s;
  }

  function shock(cx, cy, p, o = {}) {
    if (p <= 0 || p >= 1) return '';
    const e = easeOutCubic(p);
    return `<circle cx="${cx}" cy="${cy}" r="${(o.r || 400) * e}" fill="none" stroke="${o.color || '#fff'}" stroke-width="${(o.w || 14) * (1 - p)}" opacity="${1 - p}"/>`;
  }

  // ======================================================================
  // SCENES — times from transcript.json
  // ======================================================================
  const PEA = { zoom: 1.14, fx: 0.45, fy: 0.0 };

  // S1 0.00–2.05 · HOOK: THREE SURVIVORS over the Loch Ard Peacock (frame 1 = full card)
  function sHook(t, l) {
    const z = PEA.zoom - l * 0.012;
    const settle = 1.06 - 0.06 * easeOutCubic(prog(l, 0, 0.5));
    const exit = easeInCubic(prog(l, 1.72, 0.33));
    const chipP = prog(l, 1.1, 0.35) * (1 - exit);
    return (
      photo('peacock', { ...PEA, zoom: z, dim: 0.22, grade: 'gPop' }) +
      `<rect width="${W}" height="${H}" fill="url(#spot)" opacity="0.35" transform="translate(0 -300)"/>` +
      particlesDust(l, 40, 3, { speed: 22, alpha: 0.45 }) +
      shock(540, 400, prog(l, 0.0, 0.7), { r: 700, color: C.goldHi, w: 18 }) +
      `<g transform="translate(0 ${-exit * 700})">${hookCard(settle, 1 - exit * 0.8, prog(l, 0.2, 0.9))}</g>` +
      chip('SHIPWRECK COAST · VICTORIA', 540, 1120, chipP, { fs: 28 })
    );
  }

  // S2 2.05–6.44 · three slots → two teenagers + the peacock
  function sThree(t, l) {
    return (
      photo('churn', { zoom: 1.08 + l * 0.012, fx: 0.5, fy: 0.55, dim: 0.5, grade: 'gCold' }) +
      `<rect width="${W}" height="${H}" fill="${C.ink}" opacity="${0.15 + 0.1 * prog(t, 4.2, 1)}"/>` +
      particlesDust(l, 30, 11, { speed: 40, alpha: 0.35, color: '#cfefff' }) +
      medallions(t, { appear: [2.42, 2.62, 2.82], fill: [4.3, 4.62, 5.56], pulse: 3.2, key: 'a' }) +
      burst(830, 780, prog(t, 5.56, 0.8), 26, { r: 260, seed: 5 }) +
      shock(830, 780, prog(t, 5.56, 0.6), { r: 320, color: C.goldHi })
    );
  }

  // S3 6.44–8.90 · 1878 slam + LOCH ARD brass plate over period ship photo
  function sYear(t, l) {
    const slam = prog(t, 6.86, 0.32);
    const sc = slam > 0 ? lerp(2.4, 1, easeOutCubic(slam)) : 2.4;
    const up = easeInOutCubic(prog(t, 7.95, 0.4));
    const plate = prog(t, 8.04, 0.45);
    const shake = slam > 0 && slam < 1 ? Math.sin(l * 90) * 10 * (1 - slam) : 0;
    const yy = lerp(760, 560, up);
    const ysc = lerp(1, 0.72, up);
    return (
      photo('ship', { zoom: 1.02 + l * 0.02, fx: 0.52, fy: 0.5, dx: -l * 14, dim: 0.35, grade: 'gSepia' }) +
      `<rect width="${W}" height="${H}" fill="#2a1a08" opacity="0.28"/>` +
      `<g transform="translate(${shake} 0)">` +
      (slam > 0
        ? `<g opacity="${cl01(slam * 3)}" transform="translate(540 ${yy}) scale(${fmt(sc * ysc)}) translate(-540 ${-yy})">
            <text x="540" y="${yy - 200}" text-anchor="middle" font-family="${F.play}" font-style="italic" font-weight="700" font-size="54" fill="${C.goldHi}" opacity="${prog(t, 7.1, 0.4)}">1 June</text>
            ${slabText('1878', 540, yy + 110, 330, { depth: 16, ls: 8 })}
          </g>`
        : '') +
      shock(540, 700, prog(t, 6.9, 0.6), { r: 620, color: C.goldHi, w: 20 }) +
      (plate > 0
        ? `<g transform="translate(540 ${lerp(1200, 900, easeOutBack(plate))})" opacity="${cl01(plate * 2.5)}" filter="url(#shadow)">
            <rect x="-330" y="-92" width="660" height="184" rx="20" fill="url(#goldG)" stroke="#5a3a0a" stroke-width="6"/>
            <rect x="-310" y="-72" width="620" height="144" rx="12" fill="none" stroke="#7a5214" stroke-width="3"/>
            ${[-290, 290].map((x) => `<circle cx="${x}" cy="-60" r="8" fill="#7a5214"/><circle cx="${x}" cy="60" r="8" fill="#7a5214"/>`).join('')}
            <text y="36" text-anchor="middle" font-family="${F.play}" font-weight="900" font-size="104" fill="#3a2406" letter-spacing="10">LOCH ARD</text>
            <rect x="${-400 + 760 * prog(t, 8.3, 0.5)}" y="-92" width="110" height="184" fill="url(#sheen)" transform="skewX(-18)"/>
          </g>`
        : '') +
      `</g>`
    );
  }

  // S4 8.90–10.45 · hits rocks before dawn — Mutton Bird Island, night grade, impact on "rocks"
  const MUT = { zoom: 1.0, fx: 0.42, fy: 0.5 };
  function sRocks(t, l) {
    const hit = prog(t, 8.98, 0.5);
    const shake = hit > 0 && hit < 1 ? (1 - hit) * 26 : 0;
    const sx = Math.sin(l * 70) * shake;
    const sy = Math.cos(l * 53) * shake * 0.6;
    const dawn = prog(t, 9.4, 1.0);
    const [ix, iy] = photoPt('mutton', MUT, 0.36, 0.52);
    let cracks = '';
    if (hit > 0) {
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + rand(i) * 0.5;
        const len = (140 + rand(i + 4) * 180) * easeOutCubic(prog(t, 8.98, 0.25));
        const mx = ix + Math.cos(a) * len * 0.5 + (rand(i + 9) - 0.5) * 30;
        const my = iy + Math.sin(a) * len * 0.5 + (rand(i + 13) - 0.5) * 30;
        cracks += `<path d="M${fmt(ix)},${fmt(iy)} L${fmt(mx)},${fmt(my)} L${fmt(ix + Math.cos(a) * len)},${fmt(iy + Math.sin(a) * len)}" stroke="#fff" stroke-width="${4 * (1 - hit) + 1}" fill="none" opacity="${1 - hit * 0.8}"/>`;
      }
    }
    let stars = '';
    for (let i = 0; i < 50; i++) {
      stars += `<circle cx="${fmt(rand(i + 40) * W)}" cy="${fmt(rand(i + 90) * 520 + 80)}" r="${fmt(1 + rand(i + 7) * 2)}" fill="#fff" opacity="${fmt((0.3 + 0.6 * rand(i + 3)) * (1 - dawn * 0.8) * (0.7 + 0.3 * Math.sin(t * 3 + i)))}"/>`;
    }
    const pinP = prog(t, 9.35, 0.6);
    const reticle = prog(t, 8.9, 0.25);
    return (
      `<g transform="translate(${fmt(sx)} ${fmt(sy)})">` +
      photo('mutton', { ...MUT, zoom: 1.0 + l * 0.03, dim: 0.25, grade: 'gNight' }) +
      stars +
      `<rect width="${W}" height="${H}" fill="url(#dawn)" opacity="${dawn}"/>` +
      // drifting sea mist
      `<g opacity="0.35">${[0, 1, 2].map((k) => `<ellipse cx="${fmt(((l * (40 + k * 15) + k * 400) % (W + 800)) - 400)}" cy="${1000 + k * 90}" rx="520" ry="70" fill="#cfe3ff" filter="url(#soft)"/>`).join('')}</g>` +
      // target reticle locks on the reef
      (reticle > 0
        ? `<g transform="translate(${fmt(ix)} ${fmt(iy)}) rotate(${fmt((1 - easeOutCubic(reticle)) * 90)}) scale(${fmt(lerp(2.2, 1, easeOutCubic(reticle)))})" opacity="${reticle}">
            <circle r="90" fill="none" stroke="${C.red}" stroke-width="5" stroke-dasharray="28 14"/>
            <path d="M-130,0 L-100,0 M100,0 L130,0 M0,-130 L0,-100 M0,100 L0,130" stroke="${C.red}" stroke-width="6"/>
          </g>`
        : '') +
      cracks +
      shock(ix, iy, hit, { r: 520, w: 22 }) +
      burst(ix, iy, prog(t, 8.98, 1.0), 40, { r: 300, color: '#e8f4ff', size: 7, grav: 160, seed: 21 }) +
      `<rect width="${W}" height="${H}" fill="#fff" opacity="${hit > 0 ? 0.75 * Math.pow(1 - prog(t, 8.98, 0.22), 2) : 0}"/>` +
      `</g>` +
      chip('MUTTON BIRD ISLAND', 540, 300, pinP, { accent: C.red })
    );
  }

  // S5 10.45–12.45 · 54 aboard: icon grid counts up, then 52 dim / 2 glow (respectful)
  const GRID = { cols: 9, rows: 6, x0: 540 - 4 * 98, y0: 700, dx: 98, dy: 100 };
  const SURV = [22, 31]; // two highlighted figures (row 2 col 4, row 3 col 4)
  function sAboard(t, l) {
    const n = Math.round(54 * easeOutCubic(prog(t, 10.66, 0.9)));
    const dimP = easeInOutCubic(prog(t, 11.95, 0.4));
    let g = '';
    for (let i = 0; i < 54; i++) {
      const r = Math.floor(i / GRID.cols);
      const c = i % GRID.cols;
      const at = 10.66 + (i / 54) * 0.9;
      const a = prog(t, at, 0.18);
      if (a <= 0) continue;
      const surv = SURV.includes(i);
      const op = surv ? 1 : lerp(1, 0.16, dimP);
      const sc = easeOutBack(a) * (surv ? 1 + 0.3 * dimP : 1) * 0.5;
      const fill = surv ? (dimP > 0 ? C.gold : C.cream) : C.cream;
      g += `<g transform="translate(${GRID.x0 + c * GRID.dx} ${GRID.y0 + r * GRID.dy}) scale(${fmt(sc)})" opacity="${fmt(op)}">${personIcon('tom', fill)}</g>`;
      if (surv && dimP > 0) g += `<circle cx="${GRID.x0 + c * GRID.dx}" cy="${GRID.y0 + r * GRID.dy + 4}" r="${58 + 8 * Math.sin(t * 8)}" fill="none" stroke="${C.goldHi}" stroke-width="3" opacity="${dimP * 0.8}" filter="url(#glowS)"/>`;
    }
    const cnt = prog(t, 10.6, 0.3);
    return (
      photo('shipTug', { zoom: 1.0 + l * 0.02, fx: 0.5, fy: 0.5, dim: 0.62, grade: 'gSepia' }) +
      `<rect width="${W}" height="${H}" fill="${C.ink}" opacity="0.35"/>` +
      (cnt > 0
        ? `<g opacity="${cnt}" transform="translate(540 520) scale(${fmt(easeOutBack(cnt))}) translate(-540 -520)">
            ${slabText(String(n), 450, 575, 230, { depth: 10 })}
            <text x="600" y="505" font-family="${F.mont}" font-weight="900" font-size="54" fill="${C.cream}" letter-spacing="6">ABOARD</text>
            <rect x="602" y="528" width="${250 * prog(t, 11.2, 0.4)}" height="5" fill="url(#goldH)"/>
          </g>`
        : '') +
      g
    );
  }

  // S6 12.45–16.30 · TOM PEARCE — washed into the gorge (current path + pin drop)
  const G4 = { zoom: 1.0, fx: 0.62, fy: 0.5 };
  function sTom(t, l) {
    const o = { ...G4, zoom: 1.05 + l * 0.015 };
    const [ex, ey] = photoPt('gorgeSea', o, 0.76, 0.43); // gorge mouth / open sea
    const [px, py] = photoPt('gorgeSea', o, 0.6, 0.58); // inside the gorge
    const d = `M${fmt(ex)},${fmt(ey)} C${fmt(ex + 140)},${fmt(ey + 220)} ${fmt(px + 260)},${fmt(py - 140)} ${fmt(px)},${fmt(py)}`;
    const wash = easeInOutCubic(prog(t, 14.72, 1.1));
    const LEN = 900;
    const pinP = prog(t, 15.62, 0.7);
    const pinY = lerp(-300, 0, easeOutElastic(cl01(pinP * 1.2)));
    let waves = '';
    for (let k = 0; k < 6; k++) {
      const ph = (l * 0.8 + k / 6) % 1;
      waves += `<path d="M${fmt(ex - 200 + ph * 60)},${fmt(ey + 60 + ph * 420)} q60,-26 120,0 t120,0 t120,0" stroke="#e8fbff" stroke-width="4" fill="none" opacity="${fmt(0.5 * Math.sin(Math.PI * ph) * prog(t, 12.7, 0.6))}"/>`;
    }
    // dot rides the current
    const pt = (u) => {
      const a = [ex, ey];
      const b = [ex + 140, ey + 220];
      const c = [px + 260, py - 140];
      const e = [px, py];
      const v = 1 - u;
      return [
        v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * e[0],
        v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * e[1],
      ];
    };
    const [dx, dy] = pt(wash);
    return (
      photo('gorgeSea', { ...o, dim: 0.36, grade: 'gCold' }) +
      waves +
      (wash > 0
        ? `<path d="${d}" stroke="${C.goldHi}" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="${LEN}" stroke-dashoffset="${LEN * (1 - wash)}" filter="url(#glowS)" opacity="0.95"/>
           <path d="${d}" stroke="#fff" stroke-width="3" fill="none" stroke-dasharray="14 18" stroke-dashoffset="${-l * 80}" opacity="${0.8 * wash}"/>
           <circle cx="${fmt(dx)}" cy="${fmt(dy)}" r="16" fill="${C.goldHi}" filter="url(#glow)"/>`
        : '') +
      (pinP > 0
        ? `<g transform="translate(${fmt(px)} ${fmt(py + pinY)})">
            <ellipse cx="0" cy="6" rx="${30 * cl01(pinP * 2)}" ry="9" fill="#000" opacity="0.4"/>
            <path d="M0,0 C-10,-22 -44,-52 -44,-88 C-44,-116 -22,-134 0,-134 C22,-134 44,-116 44,-88 C44,-52 10,-22 0,0 Z" fill="${C.gold}" stroke="#5a3a0a" stroke-width="4"/>
            <circle cx="0" cy="-88" r="16" fill="${C.ink}"/>
          </g>` + shock(px, py, prog(t, 15.85, 0.6), { r: 160, color: C.goldHi, w: 8 })
        : '') +
      nameCard('TOM PEARCE', "SHIP'S APPRENTICE", 90, 330, prog(t, 12.58, 0.9)) +
      chip('LOCH ARD GORGE', 540, 560, prog(t, 15.7, 0.4))
    );
  }

  // S7 16.30–21.95 · screaming → EVA CARMICHAEL; loss held with dignity (desaturate, falling light)
  const G20 = { zoom: 1.0, fx: 0.52, fy: 0.5 };
  function sEva(t, l) {
    const o = { ...G20, zoom: 1.04 + l * 0.01 };
    const [sx, sy] = photoPt('gorgeDark', o, 0.55, 0.5);
    const loss = easeInOutCubic(prog(t, 20.3, 1.2));
    let rings = '';
    for (let k = 0; k < 7; k++) {
      const st0 = 17.0 + k * 0.32;
      const p = prog(t, st0, 1.3);
      if (p <= 0 || p >= 1) continue;
      rings += `<circle cx="${fmt(sx)}" cy="${fmt(sy)}" r="${fmt(30 + 290 * easeOutCubic(p))}" fill="none" stroke="${C.cream}" stroke-width="${fmt(6 * (1 - p))}" opacity="${fmt((1 - p) * 0.9)}"/>`;
    }
    // audio waveform bar across the water on the scream
    const wv = prog(t, 17.05, 0.2) * (1 - prog(t, 18.2, 0.5));
    let wave = '';
    if (wv > 0) {
      let dd = `M120,${sy}`;
      for (let x = 120; x <= 960; x += 12) {
        const env = Math.sin(((x - 120) / 840) * Math.PI);
        dd += ` L${x},${fmt(sy + Math.sin(x * 0.09 + t * 30) * 60 * env * wv * rand(Math.floor(x / 12) + Math.floor(t * 20)))}`;
      }
      wave = `<path d="${dd}" stroke="${C.teal}" stroke-width="4" fill="none" opacity="${wv * 0.7}" filter="url(#glowS)"/>`;
    }
    return (
      photo('gorgeDark', { ...o, dim: 0.42 + 0.12 * loss, grade: loss > 0.5 ? 'gMute' : 'gCold' }) +
      `<rect width="${W}" height="${H}" fill="#0b1830" opacity="${0.18 + 0.25 * loss}"/>` +
      rings +
      wave +
      `<circle cx="${fmt(sx)}" cy="${fmt(sy)}" r="${12 + 4 * Math.sin(t * 10)}" fill="${C.cream}" opacity="${prog(t, 16.9, 0.3) * (1 - loss * 0.5)}" filter="url(#glow)"/>` +
      (loss > 0 ? `<g opacity="${loss}">${particlesDust(l, 45, 77, { speed: -26, alpha: 0.5, color: '#dfe8ff', size: 2.5 })}</g>` : '') +
      nameCard('EVA CARMICHAEL', 'PASSENGER', 90, 330, prog(t, 18.3, 0.9), { w: 820, accent: C.teal, out: 1 - 0.25 * loss })
    );
  }

  // S8 21.95–24.70 · swims back out & drags her to shore (rescue path)
  const B3 = { zoom: 1.0, fx: 0.5, fy: 0.5 };
  function sRescue(t, l) {
    const o = { ...B3, zoom: 1.04 + l * 0.02 };
    const [shx, shy] = photoPt('beach', o, 0.5, 0.585); // waterline / sand edge
    const [evx, evy] = photoPt('beach', o, 0.56, 0.4); // out in the gorge mouth
    const out = easeInOutCubic(prog(t, 22.3, 0.85));
    const back = easeInOutCubic(prog(t, 23.5, 0.78));
    const pOut = `M${fmt(shx - 60)},${fmt(shy)} C${fmt(shx - 260)},${fmt(shy - 180)} ${fmt(evx - 220)},${fmt(evy + 60)} ${fmt(evx)},${fmt(evy)}`;
    const pBack = `M${fmt(evx)},${fmt(evy)} C${fmt(evx + 240)},${fmt(evy + 80)} ${fmt(shx + 260)},${fmt(shy - 200)} ${fmt(shx + 40)},${fmt(shy)}`;
    const bez = (a, b, c, d, u) => {
      const v = 1 - u;
      return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * d;
    };
    const tomOut = [bez(shx - 60, shx - 260, evx - 220, evx, out), bez(shy, shy - 180, evy + 60, evy, out)];
    const both = [bez(evx, evx + 240, shx + 260, shx + 40, back), bez(evy, evy + 80, shy - 200, shy, back)];
    const tom = back > 0 ? both : tomOut;
    const landed = prog(t, 24.2, 0.7);
    const L = 1000;
    return (
      photo('beach', { ...o, dim: 0.32, grade: 'gWarm' }) +
      `<rect width="${W}" height="${H}" fill="#3a1e00" opacity="0.12"/>` +
      `<path d="${pOut}" stroke="${C.goldHi}" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - out)}" opacity="0.9" filter="url(#glowS)"/>` +
      (back > 0
        ? `<path d="${pBack}" stroke="${C.teal}" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - back)}" filter="url(#glowS)"/>`
        : '') +
      // Eva's marker (teal) waits, then travels with Tom
      `<circle cx="${fmt(back > 0 ? both[0] + 18 : evx)}" cy="${fmt(back > 0 ? both[1] + 8 : evy)}" r="15" fill="${C.teal}" filter="url(#glow)" opacity="${prog(t, 21.95, 0.3)}"/>` +
      `<circle cx="${fmt(tom[0])}" cy="${fmt(tom[1])}" r="15" fill="${C.goldHi}" filter="url(#glow)" opacity="${prog(t, 22.1, 0.3)}"/>` +
      shock(shx + 40, shy, landed, { r: 300, color: C.goldHi, w: 12 }) +
      burst(shx + 40, shy, landed, 30, { r: 240, seed: 44 }) +
      tag('TOM', tom[0] - (back > 0 ? 52 : 0), tom[1] - 34, prog(t, 22.1, 0.3), C.goldHi) +
      tag('EVA', (back > 0 ? both[0] + 74 : evx), (back > 0 ? both[1] + 8 : evy) - 34, prog(t, 22.0, 0.3), C.teal)
    );
  }

  function tag(txt, x, y, a, col) {
    if (a <= 0) return '';
    return `<text x="${fmt(x)}" y="${fmt(y)}" text-anchor="middle" font-family="${F.mont}" font-weight="900" font-size="30" letter-spacing="3"
      fill="${col}" stroke="#000" stroke-width="7" paint-order="stroke" opacity="${a}">${txt}</text>`;
  }

  // S9 24.70–27.38 · the country wanted a wedding → rings snap apart on "didn't"
  function ringSvg(x, y, rot, a) {
    return `<g transform="translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(rot)})" opacity="${a}">
      <ellipse rx="96" ry="96" fill="none" stroke="#5a3a0a" stroke-width="30" opacity="0.5" transform="translate(6 10)"/>
      <ellipse rx="96" ry="96" fill="none" stroke="url(#ringG)" stroke-width="26"/>
      <path d="M-70,-66 A96,96 0 0 1 40,-88" stroke="#fff" stroke-width="6" fill="none" opacity="0.7" stroke-linecap="round"/>
    </g>`;
  }
  function heart(x, y, s, op, fill) {
    return `<path transform="translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})" d="M0,10 C-14,-4 -28,-12 -28,-26 C-28,-38 -18,-46 -8,-46 C-2,-46 0,-42 0,-38 C0,-42 2,-46 8,-46 C18,-46 28,-38 28,-26 C28,-12 14,-4 0,10 Z" fill="${fill}" opacity="${fmt(op)}"/>`;
  }
  function sMarry(t, l) {
    const come = easeOutCubic(prog(t, 25.05, 1.3));
    const snap = prog(t, 26.98, 0.6);
    const se = easeOutCubic(snap);
    const cy = 780;
    const lx = lerp(-160, 470, come) - se * 190;
    const rx = lerp(W + 160, 610, come) + se * 190;
    const lrot = -se * 28;
    const rrot = se * 28;
    const cool = prog(t, 26.98, 0.5);
    let hearts = '';
    for (let i = 0; i < 36; i++) {
      const born = 25.05 + rand(i + 60) * 1.6;
      const p = (t - born) / 2.2;
      if (p <= 0) continue;
      const x = rand(i + 70) * 900 + 90 + Math.sin(t * 2 + i) * 20;
      const fall = snap > 0 ? (t - 26.98) * (t - 26.98) * 700 : 0;
      const y = 1180 - p * 700 + fall;
      const op = Math.min(1, p * 4) * (1 - snap) * 0.75;
      if (op <= 0.01) continue;
      hearts += heart(x, y, 0.6 + rand(i + 80) * 0.7, op, i % 3 ? '#ff7a8a' : C.goldHi);
    }
    const interlock = come >= 0.999 && snap <= 0 ? `<path d="M${fmt(lx + 60)},${fmt(cy - 75)} A96,96 0 0 1 ${fmt(lx + 96)},${fmt(cy)}" stroke="url(#ringG)" stroke-width="26" fill="none"/>` : '';
    return (
      photo('gorgeWarm', { zoom: 1.04 + l * 0.015, fx: 0.42, fy: 0.5, dim: 0.42 + 0.15 * cool, grade: cool > 0.5 ? 'gMute' : 'gWarm' }) +
      `<rect width="${W}" height="${H}" fill="#2a1200" opacity="${0.18 * (1 - cool)}"/>` +
      `<rect width="${W}" height="${H}" fill="#0b1830" opacity="${0.3 * cool}"/>` +
      hearts +
      `<circle cx="540" cy="${cy}" r="${260 * come}" fill="url(#spot)" opacity="${0.8 * (1 - snap)}"/>` +
      ringSvg(lx, cy, lrot, cl01(come * 3)) +
      ringSvg(rx, cy, rrot, cl01(come * 3)) +
      interlock +
      burst(540, cy, prog(t, 26.36, 0.7), 22, { r: 200, seed: 90 }) +
      shock(540, cy, snap, { r: 480, color: '#fff', w: 20 }) +
      burst(540, cy, prog(t, 26.98, 0.9), 34, { r: 340, color: '#fff', seed: 91, grav: 200 }) +
      `<text x="${fmt(lx)}" y="${cy + 200}" text-anchor="middle" font-family="${F.play}" font-weight="900" font-size="64" fill="${C.cream}" opacity="${prog(t, 25.6, 0.4)}" filter="url(#shadow)">Tom</text>` +
      `<text x="${fmt(rx)}" y="${cy + 200}" text-anchor="middle" font-family="${F.play}" font-weight="900" font-size="64" fill="${C.cream}" opacity="${prog(t, 25.7, 0.4)}" filter="url(#shadow)">Eva</text>` +
      `<rect width="${W}" height="${H}" fill="#fff" opacity="${snap > 0 ? 0.5 * Math.pow(1 - prog(t, 26.98, 0.2), 2) : 0}"/>`
    );
  }

  // S10 27.38–31.05 · "third survivor?" → iris reveal of the peacock, MINTON chip, size rule
  const PEA2 = { zoom: 1.06, fx: 0.45, fy: 0.3 };
  function sReveal(t, l) {
    const move = easeInOutCubic(prog(t, 27.95, 0.9));
    const iris = easeInOutCubic(prog(t, 29.28, 0.75));
    const pos = [
      [lerp(250, 200, move), lerp(780, 1060, move)],
      [lerp(540, 400, move), lerp(780, 1060, move)],
      [lerp(830, 540, move), lerp(780, 700, move)],
    ];
    const med = medallions(t, {
      appear: [27.3, 27.3, 27.3],
      fill: [0, 0, 999],
      q: true,
      pos,
      scale: [lerp(1, 0.55, move), lerp(1, 0.55, move), lerp(1, 1.5, move)],
      key: 'r',
      alpha: 1 - prog(t, 29.28, 0.25),
    });
    // after reveal: peacock hero with rising height rule
    const ruleP = easeInOutCubic(prog(t, 29.55, 0.8));
    const [hx, hy] = photoPt('peacock', { ...PEA2, zoom: PEA2.zoom + l * 0.008 }, 0.3, 0.26);
    const [, fy] = photoPt('peacock', { ...PEA2, zoom: PEA2.zoom + l * 0.008 }, 0.3, 0.87);
    let rule = '';
    if (ruleP > 0) {
      const top = lerp(fy, hy, ruleP);
      rule = `<g opacity="${cl01(ruleP * 3)}" filter="url(#shadow)">
        <line x1="130" y1="${fmt(fy)}" x2="130" y2="${fmt(top)}" stroke="${C.gold}" stroke-width="6"/>
        ${Array.from({ length: 13 }, (_, k) => {
          const yy = fy - ((fy - hy) * k) / 12;
          return yy >= top - 1 ? `<line x1="130" y1="${fmt(yy)}" x2="${k % 3 === 0 ? 172 : 154}" y2="${fmt(yy)}" stroke="${C.gold}" stroke-width="4"/>` : '';
        }).join('')}
        <path d="M110,${fmt(top)} L150,${fmt(top)}" stroke="${C.goldHi}" stroke-width="8"/>
      </g>`;
    }
    return (
      photo('pano', { zoom: 1.0, fx: 0.55, fy: 0.5, dim: 0.72, grade: 'gDeep' }) +
      med +
      (iris > 0
        ? `<clipPath id="irisC"><circle cx="540" cy="700" r="${fmt(lerp(177, 1500, iris))}"/></clipPath>
           <g clip-path="url(#irisC)">${photo('peacock', { ...PEA2, zoom: PEA2.zoom + l * 0.008, dim: 0.12, grade: 'gPop' })}
             <rect width="${W}" height="${H}" fill="url(#spot)" opacity="0.3" transform="translate(0 -400)"/></g>
           <circle cx="540" cy="700" r="${fmt(lerp(177, 1500, iris))}" fill="none" stroke="url(#ringG)" stroke-width="${10 * (1 - iris) + 2}" opacity="${1 - iris}"/>`
        : '') +
      burst(540, 700, prog(t, 29.28, 1.0), 40, { r: 480, seed: 120, size: 8 }) +
      rule +
      chip('MINTON MAJOLICA', 540, 250, prog(t, 30.25, 0.4), { icon: false, fs: 32, accent: C.teal })
    );
  }

  // S11 31.05–34.30 · washed ashore in its crate → lid pops → condition scan
  const G5 = { zoom: 1.0, fx: 0.55, fy: 0.62 };
  function crateSvg(lidOff, lidRot) {
    const planks = [0, 1, 2, 3].map((k) => `<rect x="-150" y="${-110 + k * 55}" width="300" height="50" fill="url(#wood)" stroke="#4a2c10" stroke-width="3"/><path d="M-140,${-96 + k * 55} q70,6 140,0 t140,2 M-120,${-80 + k * 55} q60,-4 120,0 t120,-2" stroke="#6a4020" stroke-width="2" fill="none" opacity="0.6"/>`).join('');
    return `<g filter="url(#shadow)">${planks}
      <path d="M-150,-110 L150,110 M150,-110 L-150,110" stroke="#5a3616" stroke-width="16" opacity="0.85"/>
      <rect x="-160" y="-116" width="320" height="232" fill="none" stroke="#3a220b" stroke-width="10" rx="4"/>
      ${[-140, 140].map((x) => [-100, 100].map((y) => `<circle cx="${x}" cy="${y}" r="5" fill="#2a1a08"/>`).join('')).join('')}
      <g transform="translate(${lidOff * 260} ${-130 - lidOff * 420}) rotate(${lidRot})"><rect x="-166" y="-16" width="332" height="32" fill="url(#wood)" stroke="#3a220b" stroke-width="5"/></g>
    </g>`;
  }
  function sCrate(t, l) {
    const o = { ...G5, zoom: 1.06 + l * 0.012 };
    const ride = easeOutCubic(prog(t, 31.05, 1.1));
    const land = prog(t, 32.1, 0.35);
    const x = lerp(-260, 540, ride);
    const bob = ride < 1 ? Math.sin(l * 9) * 26 * (1 - land) : 0;
    const y = lerp(900, 1070, easeOutCubic(prog(t, 31.6, 0.55))) + bob;
    const rot = (1 - ride) * -24 + (ride < 1 ? Math.sin(l * 7) * 8 : 0);
    const squash = land > 0 && land < 1 ? 1 - 0.12 * Math.sin(Math.PI * land) : 1;
    const lid = easeOutCubic(prog(t, 32.8, 0.55));
    const rise = easeOutBack(prog(t, 32.95, 0.6));
    const scan = prog(t, 33.08, 0.85);
    const insetY = lerp(1000, 640, rise);
    let foam = '';
    for (let k = 0; k < 5; k++) {
      const ph = (l * 0.9 + k * 0.21) % 1;
      foam += `<path d="M${fmt(-200 + ph * 1400)},${1080 + k * 26} q80,-30 160,0 t160,0" stroke="#fff" stroke-width="5" fill="none" opacity="${fmt(0.45 * Math.sin(Math.PI * ph) * (1 - land))}"/>`;
    }
    const inset =
      rise > 0
        ? `<g transform="translate(540 ${fmt(insetY)}) scale(${fmt(rise)})">
            <clipPath id="insetC"><circle r="190"/></clipPath>
            ${Array.from({ length: 12 }, (_, k) => `<path d="M0,0 L${fmt(Math.cos((k / 12) * Math.PI * 2 + l) * 420)},${fmt(Math.sin((k / 12) * Math.PI * 2 + l) * 420)}" stroke="${C.goldHi}" stroke-width="18" opacity="0.10"/>`).join('')}
            <circle r="206" fill="rgba(6,13,22,0.8)" stroke="url(#ringG)" stroke-width="8" filter="url(#shadow)"/>
            <g clip-path="url(#insetC)">
              <image href="${IMG.peacock.u}" x="${-1536 * 0.5 * 0.44}" y="${-2048 * 0.5 * 0.55}" width="${1536 * 0.5}" height="${2048 * 0.5}" preserveAspectRatio="none"/>
              ${scan > 0 && scan < 1 ? `<rect x="-200" y="${fmt(-200 + scan * 400)}" width="400" height="10" fill="${C.teal}" opacity="0.9" filter="url(#glowS)"/><rect x="-200" y="-200" width="400" height="${fmt(scan * 400)}" fill="${C.teal}" opacity="0.10"/>` : ''}
            </g>
            ${scan >= 1 ? `<circle r="${fmt(206 + 30 * prog(t, 33.93, 0.4))}" fill="none" stroke="${C.teal}" stroke-width="5" opacity="${1 - prog(t, 33.93, 0.4)}"/>` : ''}
          </g>`
        : '';
    return (
      photo('gorgeSand', { ...o, dim: 0.34, grade: 'gWarm' }) +
      foam +
      `<g transform="translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(rot)}) scale(${fmt(0.82 / squash)} ${fmt(0.82 * squash)})">${crateSvg(lid, lid * 60)}</g>` +
      burst(540, 1150, land, 28, { r: 230, color: '#f1d9a8', size: 7, grav: 120, seed: 150 }) +
      inset
    );
  }

  // S12 34.30–36.25 · Flagstaff Hill (Warrnambool) museum plaque; soft insurance value
  function sValue(t, l) {
    const card = easeOutBack(prog(t, 34.85, 0.55));
    const val = prog(t, 35.45, 0.4);
    const n = Math.round(4 * easeOutCubic(val));
    return (
      photo('flagstaff', { zoom: 1.02 + l * 0.02, fx: 0.46, fy: 0.5, dim: 0.42, grade: 'gWarm' }) +
      chip('FLAGSTAFF HILL · WARRNAMBOOL', 540, 280, prog(t, 34.36, 0.4), { fs: 27 }) +
      (card > 0
        ? `<g transform="translate(540 ${fmt(lerp(1300, 800, card))})" opacity="${cl01(card * 2)}" filter="url(#shadow)">
            <rect x="-400" y="-250" width="800" height="440" rx="16" fill="#0d1622" stroke="url(#ringG)" stroke-width="6"/>
            <rect x="-380" y="-230" width="760" height="400" rx="10" fill="none" stroke="${C.goldLo}" stroke-width="2"/>
            <clipPath id="plaqC"><circle cx="0" cy="-250" r="120"/></clipPath>
            <circle cx="0" cy="-250" r="130" fill="#0d1622" stroke="url(#ringG)" stroke-width="6"/>
            <g clip-path="url(#plaqC)"><image href="${IMG.peacock.u}" x="${-1536 * 0.3 * 0.43}" y="${-250 - 2048 * 0.3 * 0.5}" width="${1536 * 0.3}" height="${2048 * 0.3}" preserveAspectRatio="none"/></g>
            <text y="-60" text-anchor="middle" font-family="${F.play}" font-weight="900" font-size="58" fill="${C.cream}">Loch Ard Peacock</text>
            <rect x="-250" y="-38" width="500" height="3" fill="url(#goldH)"/>
            <text y="4" text-anchor="middle" font-family="${F.mont}" font-weight="800" font-size="22" letter-spacing="5" fill="${C.gold}">INSURED AT ABOUT</text>
            ${val > 0 ? slabText(`A$${n}M`, 0, 128, 124, { depth: 8 }) : ''}
            <text y="162" text-anchor="middle" font-family="${F.play}" font-style="italic" font-weight="700" font-size="28" fill="${C.goldHi}" opacity="${prog(t, 35.6, 0.35)}">insurance valuation</text>
          </g>`
        : '') +
      burst(540, 900, val, 26, { r: 300, seed: 170 })
    );
  }

  // S13 36.25–40.20 · incomplete loop — slots refill, THREE SURVIVORS slams back to match frame 1
  function sLoop(t, l) {
    const z = lerp(PEA.zoom + 0.045, PEA.zoom, prog(t, 36.25, 3.95)); // lands exactly on frame-1 framing
    const cardP = prog(t, 39.72, 0.48);
    const s = lerp(1.6, 1.06, easeOutCubic(cardP));
    const medA = 1 - prog(t, 39.72, 0.3);
    return (
      photo('peacock', { ...PEA, zoom: z, dim: 0.22 + 0.08 * (1 - cardP), grade: 'gPop' }) +
      `<rect width="${W}" height="${H}" fill="url(#spot)" opacity="0.35" transform="translate(0 -300)"/>` +
      particlesDust(l, 40, 3, { speed: 22, alpha: 0.45 }) +
      medallions(t, { appear: [36.58, 36.78, 36.98], fill: [38.3, 38.6, 39.56], pulse: 37.3, key: 'l', alpha: medA }) +
      burst(830, 780, prog(t, 39.56, 0.6), 26, { r: 260, seed: 5 }) +
      hookCard(s, cl01(cardP * 1.4), 0)
    );
  }

  const SCENES = [
    { id: 'hook', start: 0.0, end: 2.05, draw: sHook },
    { id: 'three', start: 2.05, end: 6.44, draw: sThree, tin: { type: 'whip', d: 0.3 } },
    { id: 'year', start: 6.44, end: 8.9, draw: sYear, tin: { type: 'flash', d: 0.3 } },
    { id: 'rocks', start: 8.9, end: 10.45, draw: sRocks, tin: { type: 'whip', d: 0.2 } },
    { id: 'aboard', start: 10.45, end: 12.45, draw: sAboard, tin: { type: 'fade', d: 0.3 } },
    { id: 'tom', start: 12.45, end: 16.3, draw: sTom, tin: { type: 'zoom', d: 0.4, cx: GRID.x0 + 4 * GRID.dx, cy: GRID.y0 + 2.5 * GRID.dy } },
    { id: 'eva', start: 16.3, end: 21.95, draw: sEva, tin: { type: 'fade', d: 0.35 } },
    { id: 'rescue', start: 21.95, end: 24.7, draw: sRescue, tin: { type: 'whip', d: 0.28 } },
    { id: 'marry', start: 24.7, end: 27.38, draw: sMarry, tin: { type: 'fade', d: 0.3 } },
    { id: 'reveal', start: 27.38, end: 31.05, draw: sReveal, tin: { type: 'flash', d: 0.25 } },
    { id: 'crate', start: 31.05, end: 34.3, draw: sCrate, tin: { type: 'whip', d: 0.28 } },
    { id: 'value', start: 34.3, end: 36.25, draw: sValue, tin: { type: 'fade', d: 0.3 } },
    { id: 'loop', start: 36.25, end: 40.2, draw: sLoop, tin: { type: 'whip', d: 0.3 } },
  ];

  // ---------- karaoke captions (from Whisper word timings) ----------
  function buildCaptionGroups(words) {
    const groups = [];
    let cur = [];
    const flush = () => {
      if (cur.length) groups.push(cur);
      cur = [];
    };
    for (const w of words) {
      const chars = cur.reduce((n, x) => n + x.word.length + 1, 0) + w.word.length;
      if (cur.length && (cur.length >= 4 || chars > 19)) flush();
      cur.push(w);
      if (/[.?!,…]$/.test(w.word)) flush();
    }
    flush();
    return groups.map((g, i) => ({ words: g, start: g[0].start, end: g[g.length - 1].end }));
  }
  function captions(t, ep) {
    if (!ep._kgroups) ep._kgroups = buildCaptionGroups(ep.words || []);
    const gs = ep._kgroups;
    let gi = -1;
    for (let i = 0; i < gs.length; i++) {
      const next = gs[i + 1];
      const until = next ? Math.min(next.start - 0.02, gs[i].end + 0.6) : gs[i].end + 0.6;
      if (t >= gs[i].start - 0.06 && t < until) {
        gi = i;
        break;
      }
    }
    if (gi < 0) return '';
    const g = gs[gi];
    const pop = easeOutBack(prog(t, g.start - 0.06, 0.16));
    const txt = g.words.map((w) => w.word.toUpperCase()).join(' ');
    const fs = Math.min(70, 880 / (txt.length * 0.74));
    const spans = g.words
      .map((w, k) => {
        const active = t >= w.start - 0.03 && (t < w.end + 0.08 || (k === g.words.length - 1 && t >= w.start));
        const said = t >= w.end;
        const fill = active ? C.goldHi : said ? '#ffffff' : 'rgba(255,255,255,0.92)';
        return `<tspan fill="${fill}">${esc(w.word.toUpperCase())}${k < g.words.length - 1 ? ' ' : ''}</tspan>`;
      })
      .join('');
    return `<g transform="translate(540 ${CAP_Y}) scale(${fmt(0.85 + 0.15 * pop)})" opacity="${cl01(pop * 2)}">
      <text x="0" y="${fs * 0.36}" text-anchor="middle" font-family="${F.mont}" font-weight="900" font-size="${fmt(fs)}"
        stroke="#000" stroke-width="${fmt(fs * 0.2)}" stroke-linejoin="round" paint-order="stroke" filter="url(#shadow)" letter-spacing="1">${spans}</text>
    </g>`;
  }

  // ---------- compositor with designed transitions ----------
  function drawScene(sc, t) {
    return sc.draw(t, Math.max(0, t - sc.start)) || '';
  }
  function composite(t) {
    let i = SCENES.findIndex((s) => t >= s.start && t < s.end);
    if (i < 0) i = SCENES.length - 1;
    const cur = SCENES[i];
    const tin = cur.tin;
    if (!tin || i === 0 || t >= cur.start + tin.d) return drawScene(cur, t);
    const prev = SCENES[i - 1];
    const p = cl01((t - cur.start) / tin.d);
    const A = drawScene(prev, t);
    const B = drawScene(cur, t);
    switch (tin.type) {
      case 'flash':
        return `${B}<rect width="${W}" height="${H}" fill="#fff" opacity="${fmt(0.85 * Math.pow(1 - p, 2))}"/>`;
      case 'whip': {
        const e = easeInOutCubic(p);
        const off = e * W;
        const streak = Math.sin(Math.PI * p);
        return `<g transform="translate(${fmt(-off)} 0)" filter="url(#blurX)">${A}</g>
          <g transform="translate(${fmt(W - off)} 0)" filter="${p < 0.85 ? 'url(#blurX)' : 'none'}">${B}</g>
          <rect width="${W}" height="${H}" fill="#fff" opacity="${fmt(0.18 * streak)}"/>`;
      }
      case 'zoom': {
        const e = easeInOutCubic(p);
        const cx = tin.cx || 540;
        const cy = tin.cy || 960;
        return `<g transform="translate(${cx} ${cy}) scale(${fmt(1 + e * 2.5)}) translate(${-cx} ${-cy})" opacity="${fmt(1 - e)}">${A}</g>
          <g opacity="${fmt(e)}" transform="translate(540 960) scale(${fmt(1.25 - 0.25 * e)}) translate(-540 -960)">${B}</g>`;
      }
      default:
        return `${A}<g opacity="${fmt(easeInOutCubic(p))}">${B}</g>`;
    }
  }

  window.EPISODE = {
    duration: DUR,
    fps: 30,
    images: Object.fromEntries(Object.entries(IMG).map(([k, v]) => [k, v.u])),
    words: [],
    scenes: SCENES,
  };

  window.renderFrame = function (t) {
    const ep = window.EPISODE;
    const root = document.getElementById('root');
    t = clamp(t, 0, DUR - 1e-4);
    const gx = Math.floor(rand(Math.floor(t * 30)) * 384);
    const gy = Math.floor(rand(Math.floor(t * 30) + 0.5) * 384);
    root.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      ${defs()}
      <rect width="${W}" height="${H}" fill="${C.ink}"/>
      ${composite(t)}
      <rect y="${H * 0.6}" width="${W}" height="${H * 0.4}" fill="url(#botShade)" opacity="0.8"/>
      <rect width="${W}" height="${H}" fill="url(#vig)"/>
      <rect width="${W + 384}" height="${H + 384}" fill="url(#grainP)" opacity="0.07" transform="translate(${-gx} ${-gy})" style="mix-blend-mode:overlay"/>
      ${captions(t, ep)}
    </svg>`;
  };
})();
