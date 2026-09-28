/* s19 The Emu War — standard Skylab Short (photo underlay + premium MG). NOT map-explainer.
 * SVG + renderFrame(t) + Playwright + ffmpeg. No Remotion. Helpers from shorts/shared/render/engine.js.
 *
 * Layers (frame.html):
 *   #photos — persistent <image> groups: full-bleed WA stills, blurred period fills, framed 1932 prints,
 *             film grain. Each frame we only move / fade / clip / re-order them (no re-creation → no flashes).
 *   #mg     — rebuilt per frame: grade, Lewis-gun blueprint overlays, vector emus, stamps, counters,
 *             newspaper props, chips, karaoke captions (~70 % band).
 * Timing: Whisper (faster-whisper small.en) word timings of the held Atlas VO → ../transcript.json.
 */
(function () {
  const HS = window.HS;
  const { clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic, easeOutElastic } = HS;
  const W = 1080;
  const H = 1920;
  const DUR = 40.92;
  const CAP_Y = 1344; // ~70 % lower-middle caption band (keep MG out of ~1235–1455)

  const GOLD = '#f2c14e';
  const WHEAT = '#e9d49a';
  const KHAKI = '#6f6a3e';
  const OLIVE = '#2d2c1a';
  const INK = '#1b1813';
  const PAPER = '#efe5cc';
  const RED = '#c8322a';
  const SKY = '#8fd3ff';

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const ramp = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const fadeIO = (t, a, b, fi = 0.22, fo = 0.25) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b));
  const pop = (t, a, d = 0.35) => easeOutBack(ramp(t, a, a + d));
  const rnd = (i) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const f2 = (n) => (Math.round(n * 100) / 100).toString();

  // ============================================================ assets
  const A = 'assets/';
  const FULL = { run_fill: [1188, 2112, 'run'], wheatbelt: [1188, 2112], aerial: [1188, 2112], run: [1188, 2112], cape: [1188, 2112], bibb: [1188, 2112], mob: [1188, 2112], stokes_wide: [4523, 1920] };
  const BG = ['resting', 'lewis', 'gunners', 'drink', 'fallow'];
  const PRINT = { resting: [1800, 1044], lewis: [960, 720], gunners: [900, 540], drink: [900, 598], fallow: [900, 598] };

  const groups = {}; // id → { outer, inner }
  let photos;
  let clipSeq = 0;
  const clipPolys = {};

  function mk(tag, attrs, parent) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }

  async function init() {
    photos = document.getElementById('photos');
    const defs = mk('defs', {}, photos);
    for (const name of ['top', 'bot']) {
      const cp = mk('clipPath', { id: 'clip_' + name }, defs);
      clipPolys[name] = mk('polygon', { points: '0,0 1080,0 1080,1920 0,1920' }, cp);
    }
    const urls = [];
    const add = (id, href, w, h, framed) => {
      const outer = mk('g', { id: 'g_' + id, style: 'display:none' }, photos);
      const inner = mk('g', {}, outer);
      if (framed) {
        mk('rect', { x: -w / 2 - 22 + 16, y: -h / 2 - 22 + 22, width: w + 44, height: h + 44, fill: 'rgba(0,0,0,0.5)' }, inner);
        mk('rect', { x: -w / 2 - 22, y: -h / 2 - 22, width: w + 44, height: h + 44, fill: '#f4ecd8' }, inner);
      }
      mk('image', { href, x: -w / 2, y: -h / 2, width: w, height: h, preserveAspectRatio: 'xMidYMid slice' }, inner);
      if (framed) mk('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: 'none', stroke: 'rgba(40,30,20,0.55)', 'stroke-width': 3 }, inner);
      groups[id] = { outer, inner };
      urls.push(href);
    };
    for (const k in FULL) add(k, A + (FULL[k][2] || k) + '.jpg', FULL[k][0], FULL[k][1], false);
    for (const k of BG) add(k + '_bg', A + k + '_bg.jpg', 1080, 1920, false);
    for (const k in PRINT) add(k + '_print', A + k + '_print.jpg', PRINT[k][0], PRINT[k][1], true);
    // film grain (two tiles so the offset can wrap)
    const gOuter = mk('g', { id: 'g_grain', style: 'mix-blend-mode:overlay', opacity: 0.55 }, photos);
    const gInner = mk('g', {}, gOuter);
    for (let i = 0; i < 4; i++) mk('image', { href: A + 'grain.png', x: (i % 2) * 1080, y: Math.floor(i / 2) * 1920, width: 1080, height: 1920 }, gInner);
    groups.grain = { outer: gOuter, inner: gInner };
    urls.push(A + 'grain.png');
    await Promise.all(
      [...new Set(urls)].map((u) => {
        const im = new Image();
        im.src = u;
        return im.decode().catch(() => console.error('decode fail', u));
      })
    );
  }

  // ------------------------------------------------------------ photo placement (per frame)
  let ALPHA = 1; // current shot alpha (crossfades)
  function P(id, o = {}) {
    const g = groups[id];
    if (!g) return;
    const x = o.x != null ? o.x : 540;
    const y = o.y != null ? o.y : 960;
    const s = o.s != null ? o.s : 1;
    const r = o.r || 0;
    const op = (o.op != null ? o.op : 1) * ALPHA;
    if (op <= 0.001) return;
    g.outer.style.display = '';
    g.outer.setAttribute('opacity', f2(op));
    if (o.clip) g.outer.setAttribute('clip-path', `url(#clip_${o.clip})`);
    else g.outer.removeAttribute('clip-path');
    let filt = o.gray != null ? `grayscale(${o.gray}) brightness(${o.bright != null ? o.bright : 1})` : o.bright != null ? `brightness(${o.bright})` : '';
    if (o.blur) filt += ` blur(${o.blur}px)`;
    g.outer.style.filter = filt;
    g.inner.setAttribute('transform', `translate(${f2(x)} ${f2(y)}) rotate(${f2(r)}) scale(${s})`);
    photos.appendChild(g.outer); // z-order = call order
  }
  function clipPoly(name, pts) {
    clipPolys[name].setAttribute('points', pts.map((p) => p.map(f2).join(',')).join(' '));
  }
  // full-bleed 9:16 still with slow drift (underlay motion only)
  function bleed(id, lt, o = {}) {
    const z = o.z0 != null ? lerp(o.z0, o.z1, easeInOutCubic(clamp(lt / (o.dur || 4), 0, 1))) : 0.92;
    P(id, { x: 540 + (o.dx || 0) * lt, y: 960 + (o.dy || 0) * lt, s: z * (o.k || 1), op: o.op, clip: o.clip, gray: o.gray, bright: o.bright });
  }

  // ============================================================ MG primitives
  function grade(dim, warm = 0.18) {
    return `<rect width="${W}" height="${H}" fill="rgba(8,6,3,${dim})"/>
      <rect width="${W}" height="${H}" fill="url(#warm)" opacity="${warm}"/>`;
  }
  function vignette(k = 1) {
    return `<rect width="${W}" height="${H}" fill="url(#vig)" opacity="${k}"/>`;
  }
  const DEFS = `<defs>
    <radialGradient id="vig" cx="50%" cy="46%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.78"/></radialGradient>
    <linearGradient id="warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#5a2a00"/></linearGradient>
    <linearGradient id="gold3d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1c2"/><stop offset="0.45" stop-color="${GOLD}"/><stop offset="1" stop-color="#b9821c"/></linearGradient>
    <linearGradient id="khakiG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4628"/><stop offset="1" stop-color="#23220f"/></linearGradient>
    <linearGradient id="brass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a5a12"/><stop offset="0.5" stop-color="#f6cf6a"/><stop offset="1" stop-color="#9c6a18"/></linearGradient>
    <linearGradient id="capFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="0.5" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <pattern id="halftone" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="2.6" fill="#3a3226"/></pattern>
    <pattern id="halftone2" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="1.4" fill="#3a3226"/></pattern>
    <filter id="rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.35"/><feComposite in="SourceGraphic" operator="in"/></filter>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10"/></filter>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`;

  // bold extruded 3D label (text only for names / places / dates / counts)
  function label3d(text, x, y, o = {}) {
    const size = o.size || 72;
    const depth = o.depth != null ? o.depth : 7;
    const fill = o.fill || 'url(#gold3d)';
    const anchor = o.anchor || 'middle';
    const ls = o.ls != null ? o.ls : 2;
    let ext = '';
    for (let i = depth; i >= 1; i--) {
      ext += `<text x="${x + i * 0.8}" y="${y + i}" text-anchor="${anchor}" font-size="${size}" font-weight="900" fill="${o.side || '#5b3b08'}" letter-spacing="${ls}">${esc(text)}</text>`;
    }
    return `<g ${o.attr || ''}>
      <text x="${x + 6}" y="${y + depth + 10}" text-anchor="${anchor}" font-size="${size}" font-weight="900" fill="rgba(0,0,0,0.55)" letter-spacing="${ls}" filter="url(#soft)">${esc(text)}</text>
      ${ext}
      <text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="900" fill="${fill}" stroke="${o.stroke || '#fff7dc'}" stroke-width="${o.sw != null ? o.sw : 1.2}" letter-spacing="${ls}">${esc(text)}</text>
    </g>`;
  }

  // location / date chip (khaki plate + gold rule)
  function chip(text, x, y, t, t0, o = {}) {
    const k = pop(t, t0, 0.4);
    if (k <= 0) return '';
    const size = o.size || 34;
    const w = o.w || text.length * size * 0.72 + 70;
    const h = size + 34;
    const op = o.op != null ? o.op : 1;
    const wipe = easeOutCubic(ramp(t, t0, t0 + 0.45));
    return `<g opacity="${op}" transform="translate(${x} ${y}) scale(${lerp(0.6, 1, k)})">
      <rect x="${-w / 2 + 5}" y="${-h / 2 + 7}" width="${w}" height="${h}" rx="10" fill="rgba(0,0,0,0.45)"/>
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="10" fill="url(#khakiG)" stroke="${GOLD}" stroke-width="3"/>
      <rect x="${-w / 2 + 12}" y="${h / 2 - 9}" width="${(w - 24) * wipe}" height="3" fill="${GOLD}"/>
      ${o.icon || ''}
      <text x="${o.icon ? 22 : 0}" y="${size * 0.36}" text-anchor="middle" font-size="${size}" font-weight="800" fill="#fff4d6" letter-spacing="4">${esc(text)}</text>
    </g>`;
  }

  // ink rubber stamp (rough edges), slams from 1.6× with a small shake
  function stamp(text, x, y, t, t0, o = {}) {
    if (t < t0) return '';
    const u = ramp(t, t0, t0 + 0.2);
    const s = lerp(o.from || 1.8, 1, easeOutCubic(u));
    const op = Math.min(1, u * 1.6) * (o.op != null ? o.op : 0.92);
    const size = o.size || 110;
    const w = o.w || text.length * size * 0.66 + 70;
    const h = size * 1.18;
    const col = o.color || RED;
    return `<g transform="translate(${x} ${y}) rotate(${o.rot != null ? o.rot : -8}) scale(${s})" opacity="${op}" filter="url(#rough)">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="14" fill="none" stroke="${col}" stroke-width="10"/>
      <rect x="${-w / 2 + 14}" y="${-h / 2 + 14}" width="${w - 28}" height="${h - 28}" rx="8" fill="none" stroke="${col}" stroke-width="3"/>
      <text x="0" y="${size * 0.36}" text-anchor="middle" font-size="${size}" font-weight="900" fill="${col}" letter-spacing="6">${esc(text)}</text>
    </g>`;
  }

  // ------------------------------------------------------------ vector emu (procedural run cycle), faces right
  function emu(x, y, sc, phase, o = {}) {
    const fill = o.fill || INK;
    const stroke = o.stroke || 'none';
    const sw = o.sw || 0;
    const flip = o.flip ? -1 : 1;
    const run = o.run != null ? o.run : 1;
    const bob = -Math.abs(Math.sin(phase)) * 7 * run;
    // shaggy body: ellipse outline with feather fringe along the underside
    let body = '';
    const N = 34;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const under = Math.sin(a) > 0.1 ? 1 : 0;
      const fr = under ? (i % 2 ? 9 : -2) : 0;
      const px = Math.cos(a) * (56 + fr * 0.4);
      const py = Math.sin(a) * (34 + fr);
      body += (i ? 'L' : 'M') + f2(px) + ',' + f2(py);
    }
    const legs = [0, Math.PI].map((off) => {
      const ph = phase + off;
      const a = Math.sin(ph) * 0.75 * run;
      const bend = Math.max(0, Math.cos(ph)) * 1.1 * run + 0.15;
      const hx = 10;
      const hy = -64;
      const kx = hx + Math.sin(a) * 36;
      const ky = hy + Math.cos(a) * 36;
      const ax = kx + Math.sin(a - bend) * 40;
      const ay = ky + Math.cos(a - bend) * 40;
      const fx = ax + 16 * Math.cos(a * 0.6);
      const fy = ay + 2;
      return `M${f2(hx)},${f2(hy)} L${f2(kx)},${f2(ky)} L${f2(ax)},${f2(ay)} L${f2(fx)},${f2(fy)}`;
    });
    const nb = Math.sin(phase * 2) * 3 * run;
    const neck = `M34,${-104} Q${60 + nb},${-128} ${62 + nb},${-168}`;
    return `<g transform="translate(${f2(x)} ${f2(y)}) scale(${f2(sc * flip)} ${f2(sc)})" opacity="${o.op != null ? o.op : 1}">
      <g transform="translate(0 ${f2(bob)})">
        <path d="${legs.join(' ')}" fill="none" stroke="${o.legs || fill}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="${neck}" fill="none" stroke="${o.neck || fill}" stroke-width="12" stroke-linecap="round"/>
        <g transform="translate(-4 -98) rotate(-9)"><path d="${body}Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/></g>
        <ellipse cx="${66 + nb}" cy="-171" rx="11" ry="8" fill="${o.neck || fill}"/>
        <path d="M${74 + nb},-175 L${90 + nb},-170 L${74 + nb},-166Z" fill="${o.beak || fill}"/>
        <circle cx="${68 + nb}" cy="-173" r="2.4" fill="${o.eye || '#fff3cf'}"/>
      </g>
    </g>`;
  }

  // ------------------------------------------------------------ Lewis gun blueprint (side view, faces right, ~620 long)
  // draw: 0→1 (self-drawing strokes), rot: pan-magazine rotation (rad), flash: muzzle flash 0..1
  function lewis(x, y, sc, o = {}) {
    const d = o.draw != null ? o.draw : 1;
    const col = o.color || GOLD;
    const part = (path, i, extra = '') => {
      const p = clamp(d * 7 - i * 0.8, 0, 1);
      if (p <= 0) return '';
      return `<path d="${path}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${f2(1 - p)}" ${extra}/>`;
    };
    const st = `fill="none" stroke="${col}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
    const fillOn = clamp(d * 2 - 1, 0, 1) * 0.16;
    // pan magazine spokes
    const rot = o.rot || 0;
    let spokes = '';
    if (d > 0.5) {
      for (let i = 0; i < 25; i++) {
        const a = rot + (i / 25) * Math.PI * 2;
        const c = Math.cos(a);
        const s = Math.sin(a);
        spokes += `<line x1="${f2(215 + c * 26)}" y1="${f2(-40 + s * 5)}" x2="${f2(215 + c * 84)}" y2="${f2(-40 + s * 16)}" stroke="${col}" stroke-width="2" opacity="${f2(0.35 + 0.65 * Math.max(0, s))}"/>`;
      }
    }
    let fins = '';
    if (d > 0.35) for (let i = 0; i < 17; i++) fins += `<line x1="${290 + i * 14}" y1="-14" x2="${290 + i * 14}" y2="36" stroke="${col}" stroke-width="2" opacity="0.55"/>`;
    const fl = o.flash || 0;
    const flash = fl > 0
      ? `<g transform="translate(628 10) scale(${f2(0.6 + fl * 0.8)})" opacity="${f2(fl)}">
          <path d="M0,0 L60,-10 L22,-2 L70,14 L20,8 L44,40 L6,12 L-6,30 Z" fill="#fff4c4" filter="url(#glow)"/>
          <circle r="16" fill="#fff" opacity="0.8"/></g>`
      : '';
    return `<g transform="translate(${f2(x)} ${f2(y)}) scale(${f2(sc)})" opacity="${o.op != null ? f2(o.op) : 1}">
      <g opacity="0.35" stroke="${col}" stroke-width="16" fill="none" filter="url(#soft)">
        <path d="M0,22 L150,4 L150,34 L0,58 Z M270,-14 H540 V36 H270 Z"/>
      </g>
      <g ${st}>
        ${part('M0,22 L70,8 L150,2 L150,34 L72,44 L0,58 Z', 0, `fill="${col}" fill-opacity="${fillOn}"`)}
        ${part('M150,-6 H272 V34 H150 Z', 1, `fill="${col}" fill-opacity="${fillOn}"`)}
        ${part('M188,34 L214,34 L204,88 L180,88 Z', 2, `fill="${col}" fill-opacity="${fillOn}"`)}
        ${part('M214,40 Q236,40 232,62 L204,62', 2)}
        ${part('M272,-14 H530 Q544,-14 544,0 V22 Q544,36 530,36 H272 Z', 3, `fill="${col}" fill-opacity="${fillOn}"`)}
        ${part('M544,4 H612 V16 H544', 4)}
        ${part('M612,0 L630,-2 L630,22 L612,20 Z', 4)}
        ${part('M131,-40 A84,16 0 1 0 299,-40 A84,16 0 1 0 131,-40 Z', 5, `fill="${col}" fill-opacity="${fillOn * 1.4}"`)}
        ${part('M131,-40 V-30 A84,16 0 0 0 299,-30 V-40', 5)}
        ${part('M500,36 L470,118 M500,36 L530,118', 6)}
        ${part('M468,118 H476 M526,118 H534', 6)}
      </g>
      ${fins}${spokes}
      <circle cx="215" cy="-40" r="${d > 0.6 ? 7 : 0}" fill="${col}"/>
      ${flash}
    </g>`;
  }

  // brass .303 cartridge
  function round303(x, y, r, s = 1) {
    return `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(r)}) scale(${s})">
      <rect x="-6" y="-26" width="12" height="36" rx="2" fill="url(#brass)"/>
      <path d="M-5,-26 Q0,-44 5,-26 Z" fill="#b87333"/>
      <rect x="-7" y="10" width="14" height="4" fill="#7a4d10"/></g>`;
  }

  // archival newspaper prop (stylised — not a reproduction of a real masthead)
  function paper(x, y, r, s, head, sub, date, seed, o = {}) {
    const w = 600;
    const h = 760;
    let lines = '';
    for (let c = 0; c < 3; c++) {
      for (let i = 0; i < 17; i++) {
        const ly = 400 + i * 20;
        const lw = 160 - rnd(seed * 100 + c * 20 + i) * (i % 6 === 5 ? 90 : 16);
        lines += `<rect x="${-w / 2 + 34 + c * 184}" y="${ly - h / 2}" width="${f2(lw)}" height="7" fill="#5b5243" opacity="0.55"/>`;
      }
    }
    return `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(r)}) scale(${f2(s)})" opacity="${o.op != null ? f2(o.op) : 1}">
      <rect x="${-w / 2 + 14}" y="${-h / 2 + 20}" width="${w}" height="${h}" fill="rgba(0,0,0,0.45)" filter="url(#soft)"/>
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${PAPER}"/>
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="url(#halftone2)" opacity="0.07"/>
      <rect x="${-w / 2 + 26}" y="${-h / 2 + 24}" width="${w - 52}" height="4" fill="${INK}"/>
      <text class="serif" x="0" y="${-h / 2 + 86}" text-anchor="middle" font-size="46" font-weight="700" fill="${INK}" letter-spacing="2" style="font-family:'Liberation Serif',serif">${esc(o.mast || '— THE PRESS —')}</text>
      <rect x="${-w / 2 + 26}" y="${-h / 2 + 104}" width="${w - 52}" height="2" fill="${INK}"/>
      <text x="${-w / 2 + 30}" y="${-h / 2 + 128}" font-size="17" font-weight="700" fill="#3b3428" style="font-family:'Liberation Serif',serif">${esc(date)}</text>
      <text x="${w / 2 - 30}" y="${-h / 2 + 128}" text-anchor="end" font-size="17" font-weight="700" fill="#3b3428" style="font-family:'Liberation Serif',serif">PRICE ONE PENNY</text>
      <rect x="${-w / 2 + 26}" y="${-h / 2 + 140}" width="${w - 52}" height="2" fill="${INK}"/>
      <text x="0" y="${-h / 2 + 222}" text-anchor="middle" font-size="${o.hs || 84}" font-weight="700" fill="${INK}" style="font-family:'Liberation Serif',serif" textLength="${o.tl || 520}" lengthAdjust="spacingAndGlyphs">${esc(head)}</text>
      <text x="0" y="${-h / 2 + 272}" text-anchor="middle" font-size="30" font-style="italic" fill="#2f2a22" style="font-family:'Liberation Serif',serif">${esc(sub)}</text>
      <rect x="${-w / 2 + 34}" y="${-h / 2 + 296}" width="${w - 68}" height="84" fill="url(#halftone)" opacity="0.5"/>
      ${lines}
    </g>`;
  }

  // karaoke captions — spoken words only, lower-middle band
  let CAPS = null;
  function captions(t) {
    const ep = window.EPISODE;
    if (!CAPS) CAPS = HS.groupCaptions(ep.words, 4, 0.5).map((c, i, arr) => {
      const ws = ep.words.filter((w) => w.start >= c.start - 0.001 && w.start < c.end);
      return { ...c, ws, end: Math.min(c.end + 0.25, arr[i + 1] ? arr[i + 1].start : c.end + 0.4) };
    });
    const c = CAPS.find((c) => t >= c.start && t < c.end);
    if (!c) return '';
    const k = easeOutBack(ramp(t, c.start, c.start + 0.16));
    const op = 1 - ramp(t, c.end - 0.08, c.end);
    const size = 62;
    // measure roughly (Montserrat 900 ≈ 0.66 em avg upper-case-ish)
    const widths = c.ws.map((w) => w.word.length * size * 0.62 + 18);
    const total = widths.reduce((a, b) => a + b, 0);
    const lines = [];
    if (total > 900) {
      let acc = 0;
      let cut = 0;
      for (let i = 0; i < widths.length; i++) {
        acc += widths[i];
        if (acc > total / 2) { cut = Math.max(1, i); break; }
      }
      lines.push(c.ws.slice(0, cut), c.ws.slice(cut));
    } else lines.push(c.ws);
    let out = '';
    lines.forEach((ln, li) => {
      const y = CAP_Y + (li - (lines.length - 1) / 2) * 78 + 22;
      const spans = ln.map((w) => {
        const on = t >= w.start - 0.02;
        const cur = on && t < w.end + 0.05;
        const fill = cur ? GOLD : on ? '#ffffff' : 'rgba(255,255,255,0.62)';
        return `<tspan fill="${fill}">${esc(w.word)} </tspan>`;
      }).join('');
      out += `<text x="540" y="${y}" text-anchor="middle" font-size="${size}" font-weight="900" stroke="#0a0805" stroke-width="12" stroke-linejoin="round" paint-order="stroke" letter-spacing="0.5">${spans}</text>`;
    });
    return `<g opacity="${f2(op)}">
      <rect x="0" y="${CAP_Y - 120}" width="1080" height="240" fill="url(#capFade)" opacity="0.8"/>
      <g transform="translate(540 ${CAP_Y}) scale(${f2(lerp(0.86, 1, k))}) translate(-540 ${-CAP_Y})">${out}</g></g>`;
  }

  // ------------------------------------------------------------ recurring pieces
  // PROBLEM counter plate (odometer numeral roll 1→2→3)
  function problemPlate(t, n, t0) {
    const k = pop(t, t0, 0.45);
    if (k <= 0) return '';
    const roll = easeOutBack(ramp(t, t0 + 0.05, t0 + 0.4));
    const prev = n - 1;
    const x = 300;
    const y = 330;
    return `<g transform="translate(${x} ${y}) scale(${f2(lerp(0.5, 1, k))})">
      <rect x="-222" y="-78" width="444" height="156" rx="18" fill="rgba(0,0,0,0.5)" transform="translate(8 10)"/>
      <rect x="-222" y="-78" width="444" height="156" rx="18" fill="url(#khakiG)" stroke="${GOLD}" stroke-width="4"/>
      <text x="-196" y="17" font-size="47" font-weight="900" fill="#fff4d6" letter-spacing="3">PROBLEM</text>
      <rect x="92" y="-62" width="112" height="124" rx="12" fill="${INK}" stroke="${GOLD}" stroke-width="3"/>
      <svg x="92" y="-62" width="112" height="124" viewBox="0 0 112 124">
        ${prev > 0 ? `<text x="56" y="${f2(96 - roll * 124)}" text-anchor="middle" font-size="96" font-weight="900" fill="${GOLD}">${prev}</text>` : ''}
        <text x="56" y="${f2(96 + (1 - roll) * 124)}" text-anchor="middle" font-size="96" font-weight="900" fill="${GOLD}">${n}</text>
      </svg>
      <rect x="92" y="-2" width="112" height="3" fill="rgba(0,0,0,0.5)"/>
    </g>`;
  }

  function whiteFlag(x, y, t, t0, sc = 1) {
    const k = easeOutCubic(ramp(t, t0, t0 + 0.4));
    if (k <= 0) return '';
    const wave = (i) => Math.sin(t * 9 + i * 0.9) * 8 * k;
    let d = `M0,0`;
    for (let i = 0; i <= 6; i++) d += ` L${i * 22},${f2(wave(i))}`;
    for (let i = 6; i >= 0; i--) d += ` L${i * 22},${f2(84 + wave(i))}`;
    return `<g transform="translate(${x} ${y + (1 - k) * 220}) scale(${sc})" opacity="${f2(Math.min(1, k * 2))}">
      <rect x="-5" y="-10" width="10" height="260" rx="4" fill="#8b6b3e"/>
      <circle cx="0" cy="-14" r="9" fill="${GOLD}"/>
      <path d="${d}Z" transform="translate(5 0)" fill="#f7f3ea" stroke="#cfc6b0" stroke-width="2"/>
    </g>`;
  }

  // WA locator glyph (brief chip only — this is not a map episode)
  const WA = [[129, -14.9], [128.2, -15.0], [127.0, -13.9], [126.0, -14.2], [125.0, -14.6], [124.4, -15.5], [123.6, -16.3], [122.9, -16.4], [122.2, -17.3], [122.2, -18.0], [121.3, -19.2], [119.5, -20.0], [118.0, -20.4], [116.8, -20.6], [115.5, -21.4], [114.6, -21.8], [114.1, -22.2], [113.7, -23.2], [113.8, -24.5], [113.4, -25.5], [113.9, -26.4], [114.2, -27.7], [114.6, -28.8], [115.0, -29.6], [115.1, -30.8], [115.7, -31.8], [115.7, -33.0], [115.3, -33.6], [115.0, -34.3], [116.0, -34.9], [117.9, -35.1], [119.5, -34.4], [120.8, -33.9], [122.0, -33.9], [123.6, -33.9], [124.5, -33.2], [126.0, -32.3], [127.5, -32.2], [129, -31.7]];
  function waGlyph(x, y, sc, t, t0) {
    const k = easeOutCubic(ramp(t, t0, t0 + 0.6));
    if (k <= 0) return '';
    const pj = ([lon, lat]) => [(lon - 121.2) * 11.5, (-lat - 24.9) * 11.5];
    const d = 'M' + WA.map((p) => pj(p).map(f2).join(',')).join(' L') + ' Z';
    const [mx, my] = pj([118.28, -31.48]); // Merredin (Campion district lies just north-east)
    const pin = easeOutBack(ramp(t, t0 + 0.35, t0 + 0.75));
    return `<g transform="translate(${x} ${y}) scale(${sc})" opacity="${f2(k)}">
      <path d="${d}" fill="rgba(0,0,0,0.45)" transform="translate(6 8)"/>
      <path d="${d}" fill="rgba(233,212,154,0.28)" stroke="#fff" stroke-width="5" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${f2(1 - k)}"/>
      <path d="${d}" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linejoin="round"/>
      <g transform="translate(${f2(mx)} ${f2(my)})">
        <circle r="${f2(26 * pin)}" fill="none" stroke="${GOLD}" stroke-width="3" opacity="${f2(1 - ramp(t, t0 + 0.75, t0 + 1.4))}"/>
        <g transform="translate(0 ${f2(-(1 - pin) * 60)}) scale(${f2(pin)})">
          <path d="M0,0 C-14,-18 -16,-26 -16,-34 A16,16 0 1 1 16,-34 C16,-26 14,-18 0,0Z" fill="${RED}" stroke="#fff" stroke-width="3"/>
          <circle cx="0" cy="-34" r="6" fill="#fff"/></g>
      </g>
    </g>`;
  }

  // ============================================================ SHOTS (timings from transcript.json)
  // words: Australia 0.00 · soldiers 0.96 · machine 1.78 · birds 2.96 · lost 3.78 · 1932 4.66 · About 6.48 · 20,000 6.56
  // emus 7.66 · wrecking 8.32 · Western 9.58 · So 10.90 · army 11.26 · machine 12.70 · Problem 14.12 · split 15.50
  // Problem 17.24 · 40 18.76 · Problem 20.82 · many 21.94 · hit 23.58 · weeks 24.70 · thousands 25.56 · newspapers 26.84
  // pulled 29.30 · officer 30.44 · reportedly 31.36 · army 32.84 · birds 33.38 · world 36.42 · Which 37.16 · lost 40.36
  const shots = [];
  const shot = (start, end, draw, o = {}) => shots.push({ start, end, draw, ...o });

  // ---- 1  HOOK (unspoken frame-1 card: THE EMU WAR) — soldiers + Lewis vs WA emu split
  function hook(t, lt, loop) {
    // lt: local time within hook; loop=true for the reprise (no title card until the very end)
    const seam = 930;
    const tilt = 70;
    const topP = [[0, 0], [1080, 0], [1080, seam - tilt], [0, seam + tilt]];
    const botP = [[0, seam + tilt + 10], [1080, seam - tilt + 10], [1080, 1920], [0, 1920]];
    clipPoly('top', topP);
    clipPoly('bot', botP);
    const lost = loop ? 40.36 : 3.78;
    const birds = loop ? 39.5 : 2.96;
    const sold = loop ? 38.2 : 0.96;
    const lostK = ramp(t, lost, lost + 0.5);
    // top: blurred fill + 1932 Lewis-gun print (period) — sags + greys on "…and lost."
    P('lewis_bg', { clip: 'top', s: 1.05, y: 520 });
    const pr = { y: 470 + lostK * 26, s: 1.02 + 0.05 * ramp(t, sold, sold + 3) - lostK * 0.03, r: -1.5 + lostK * 2.5 };
    P('lewis_print', { clip: 'top', x: 540, y: pr.y, s: pr.s, r: pr.r, bright: 1 - lostK * 0.25 });
    // bottom: WA emu, pushes in on "birds"
    const bk = easeOutCubic(ramp(t, birds - 0.1, birds + 0.5));
    P('bibb', { clip: 'bot', x: 742, y: 2100 - bk * 30, s: 1.25 + bk * 0.05 + 0.02 * ramp(t, 0, 5) });
    let mg = grade(0.12, 0.12);
    // seam: gold slash with glow
    mg += `<path d="M0,${seam + tilt + 5} L1080,${seam - tilt + 5}" stroke="${GOLD}" stroke-width="14" opacity="0.35" filter="url(#soft)"/>
      <path d="M0,${seam + tilt + 5} L1080,${seam - tilt + 5}" stroke="${GOLD}" stroke-width="6"/>`;
    // Lewis-gun overlay traced over the print + muzzle chatter on "machine guns"
    const mgT = loop ? 38.6 : 1.78;
    const fl = t > mgT && t < mgT + 1.0 && !(lostK > 0) ? (Math.floor(t * 30) % 3 === 0 ? 1 : 0.25) : 0;
    // blueprint trace registered on the real 1932 Lewis gun in the print (print-local coords)
    mg += `<g transform="translate(540 ${f2(pr.y)}) rotate(${f2(pr.r)}) scale(${f2(pr.s)})">${lewis(-212, -120, 0.773, { draw: loop ? 1 : lerp(0.35, 1, easeOutCubic(ramp(t, 0.05, 1.6))), rot: t * (lostK > 0 ? 0.5 : 5), flash: fl, op: 0.9 * (1 - lostK * 0.7) })}</g>`;
    const gun = (lx, ly) => { const a = (pr.r * Math.PI) / 180; return [540 + pr.s * (lx * Math.cos(a) - ly * Math.sin(a)), pr.y + pr.s * (lx * Math.sin(a) + ly * Math.cos(a))]; };
    const [ejx, ejy] = gun(-40, -110);
    // shell casings during chatter
    if (fl) for (let i = 0; i < 5; i++) {
      const u = ((t * 3 + i * 0.2) % 1);
      mg += round303(ejx + u * 90 + i * 8, ejy - Math.sin(u * Math.PI) * 120 + u * 200, u * 540 + i * 50, 0.8);
    }
    // VS medallion on the seam
    const vs = pop(t, birds - 0.2, 0.4);
    if (vs > 0) mg += `<g transform="translate(870 ${seam - 44}) scale(${f2(vs)}) rotate(-6)">
        <circle r="70" fill="rgba(0,0,0,0.5)" transform="translate(6 8)"/><circle r="70" fill="${RED}" stroke="#fff" stroke-width="6"/>
        <text y="24" text-anchor="middle" font-size="70" font-weight="900" fill="#fff" font-style="italic">VS</text></g>`;
    // vector emus sprinting through the bottom panel (edge of frame, away from caption band)
    const run = ramp(t, birds, birds + 1.6);
    if (run > 0 && run < 1) {
      for (let i = 0; i < 3; i++) mg += emu(-160 + run * 1450 - i * 190, 1200 - i * 16, 0.82 - i * 0.08, t * 16 + i, { fill: '#241c12', stroke: GOLD, sw: 3, legs: GOLD, neck: '#241c12' });
    }
    // white flag rises from the soldiers' panel on "…and lost."
    mg += whiteFlag(96, 560, t, lost + 0.05, 1.05);
    mg += vignette(0.9);
    return mg;
  }
  function hookTitle(t, k, o = {}) {
    // frame-1 hook card; k: 0..1 visibility (1 = full slam state identical to frame 1)
    if (k <= 0) return '';
    const s = o.s != null ? o.s : 1;
    const y = o.y != null ? o.y : 930;
    const shake = o.shake || 0;
    const sx = Math.sin(t * 91) * shake;
    const sy = Math.cos(t * 77) * shake;
    return `<g opacity="${f2(k)}" transform="translate(${f2(540 + sx)} ${f2(y + sy)}) scale(${f2(s)}) rotate(-4)">
      <rect x="-470" y="-118" width="940" height="236" rx="12" fill="rgba(0,0,0,0.55)" transform="translate(10 14)" filter="url(#soft)"/>
      <rect x="-470" y="-118" width="940" height="236" rx="12" fill="${INK}" stroke="${GOLD}" stroke-width="6"/>
      <rect x="-452" y="-100" width="904" height="200" rx="6" fill="none" stroke="${GOLD}" stroke-width="2" opacity="0.6"/>
      ${label3d('THE EMU WAR', 0, 42, { size: 124, depth: 9, ls: 4 })}
      <text x="-430" y="-66" font-size="26" font-weight="800" fill="${GOLD}" letter-spacing="8">1932</text>
      <text x="430" y="-66" text-anchor="end" font-size="26" font-weight="800" fill="${GOLD}" letter-spacing="8">W.A.</text>
    </g>`;
  }

  shot(0, 4.42, (t, lt) => {
    let mg = hook(t, lt, false);
    // frame 1: card fully slammed; lifts & shrinks into a header after ~1.1 s, gone before the story starts
    const lift = easeInOutCubic(ramp(t, 1.05, 1.55));
    mg += hookTitle(t, 1 - ramp(t, 4.0, 4.3), { s: lerp(1, 0.46, lift), y: lerp(930, 205, lift), shake: t < 0.35 ? 5 * (1 - t / 0.35) : 0 });
    return mg;
  });

  // ---- 2  1932 · wheatbelt + ~20,000 emus marching across the paddock
  shot(4.42, 8.36, (t, lt) => {
    bleed('wheatbelt', lt, { z0: 1.0, z1: 0.93, dur: 4.2, dx: -4 });
    let mg = grade(0.38, 0.2);
    // year stamp slams on "1932", then docks top-left as a date tag
    const dock = easeInOutCubic(ramp(t, 5.9, 6.35));
    if (dock < 1 && t >= 4.62) mg += `<ellipse cx="540" cy="${f2(700 - dock * 300)}" rx="420" ry="200" fill="rgba(0,0,0,0.55)" filter="url(#soft)" opacity="${f2((1 - dock) * ramp(t, 4.62, 4.8))}"/>`;
    if (dock < 1) mg += `<g opacity="${f2(1 - dock)}">${stamp('1932', 540, 700 - dock * 300, t, 4.62, { size: 210, color: GOLD, rot: -6, op: 1 })}</g>`;
    if (t > 5.9) mg += chip('1932', 190, 300, t, 5.95, { size: 40, w: 220 });
    // ~20,000 counter (soft: "about")
    if (t >= 6.45) {
      const c = easeOutCubic(ramp(t, 6.5, 7.7));
      const n = Math.round(c * 20000 / 50) * 50;
      const k = pop(t, 6.45, 0.35);
      mg += `<g transform="translate(540 610) scale(${f2(lerp(0.6, 1, k))})">
        ${label3d('~' + n.toLocaleString('en-AU'), 0, 0, { size: 150, depth: 10, ls: 2 })}
        <g transform="translate(0 70)">${chip('EMUS', 0, 0, t, 7.6, { size: 36, w: 210 })}</g></g>`;
    }
    // flock of vector emus streaming through the wheat (behind the counter, above the caption band)
    const flock = ramp(t, 6.6, 8.4);
    if (flock > 0) {
      for (let i = 0; i < 26; i++) {
        const row = i % 3;
        const sp = 0.8 + rnd(i) * 0.5;
        const x = -200 + (flock * 1500 * sp + rnd(i + 9) * 900) % 1500 - 100;
        const y = 1060 + row * 52 + rnd(i + 3) * 30;
        mg += emu(x, y, 0.36 + row * 0.07, t * 15 + i * 1.7, { fill: `rgba(24,18,10,${0.75 + row * 0.08})` });
      }
    }
    mg += vignette();
    return mg;
  });

  // ---- 3  "wrecking wheat farms" — 1932 period print: fallow damage
  shot(8.36, 9.5, (t, lt) => {
    P('fallow_bg', {});
    const k = easeOutBack(ramp(t, 8.3, 8.75));
    P('fallow_print', { y: 690, s: lerp(1.25, 1.02, k) + lt * 0.02, r: lerp(-7, -2.5, k) });
    let mg = grade(0.0, 0.08);
    // trampled-crop chevrons (emu tracks) racing across the paddock under the print
    for (let i = 0; i < 9; i++) {
      const u = ramp(t, 8.4 + i * 0.06, 9.4);
      const x = 120 + i * 100 + Math.sin(i) * 12;
      const y = 1120 - (i % 2) * 34;
      mg += `<g transform="translate(${x} ${y}) rotate(-80) scale(${f2(easeOutBack(clamp(u * 4, 0, 1)))})" opacity="0.85">
        <path d="M0,0 L-16,-22 M0,0 L0,-26 M0,0 L16,-22 M0,0 L0,10" stroke="${WHEAT}" stroke-width="6" stroke-linecap="round"/></g>`;
    }
    mg += `<g transform="translate(245 405) rotate(-2.5)">${chip('1932', 0, 0, t, 8.55, { size: 30, w: 170 })}</g>`;
    mg += vignette();
    return mg;
  });

  // ---- 4  "in Western Australia" — Merredin wheatbelt aerial + WA chip
  shot(9.5, 10.88, (t, lt) => {
    bleed('aerial', lt, { z0: 1.12, z1: 0.96, dur: 1.6 });
    let mg = grade(0.3, 0.12);
    mg += waGlyph(560, 700, 1.25, t, 9.52);
    mg += chip('WESTERN AUSTRALIA', 540, 300, t, 9.58, { size: 40 });
    mg += chip('WHEATBELT · MERREDIN DISTRICT', 540, 1110, t, 9.95, { size: 28 });
    mg += vignette();
    return mg;
  });

  // ---- 5  "So the army sends soldiers…" — 1932 detachment print (McMurray & O'Halloran)
  shot(10.88, 12.62, (t, lt) => {
    P('gunners_bg', {});
    const k = easeOutCubic(ramp(t, 10.8, 11.4));
    P('gunners_print', { x: lerp(-400, 540, k), y: 640, s: 1.08 + lt * 0.03, r: lerp(-10, -2, k) });
    let mg = grade(0.0, 0.06);
    // unit nameplate (names from the 1932 detachment)
    const n = pop(t, 11.5, 0.4);
    if (n > 0) mg += `<g transform="translate(540 1040) scale(${f2(n)})">
      <rect x="-420" y="-62" width="840" height="124" rx="8" fill="rgba(0,0,0,0.5)" transform="translate(8 10)"/>
      <rect x="-420" y="-62" width="840" height="124" rx="8" fill="url(#brass)"/>
      <rect x="-408" y="-50" width="816" height="100" rx="5" fill="none" stroke="#5b3b08" stroke-width="2"/>
      <text y="-8" text-anchor="middle" font-size="36" font-weight="900" fill="#2b1c05" letter-spacing="3">SGT McMURRAY · GNR O’HALLORAN</text>
      <text y="34" text-anchor="middle" font-size="24" font-weight="700" fill="#3b2708" letter-spacing="5">ROYAL AUSTRALIAN ARTILLERY · 1932</text></g>`;
    mg += vignette();
    return mg;
  });

  // ---- 6  "…with machine guns." — Lewis-gun print + animated blueprint overlay
  shot(12.62, 14.08, (t, lt) => {
    P('lewis_bg', {});
    P('lewis_print', { y: 600, s: 1.02 + lt * 0.04, r: 1.5 });
    let mg = grade(0.05, 0.05);
    const d = easeInOutCubic(ramp(t, 12.62, 13.5));
    const fire = t > 13.15 && t < 13.95;
    mg += lewis(165, 1000, 1.18, { draw: d, rot: t * 7, flash: fire && Math.floor(t * 30) % 3 === 0 ? 1 : 0 });
    if (fire) for (let i = 0; i < 6; i++) {
      const u = (t * 3.2 + i / 6) % 1;
      mg += round303(420 + u * 120, 930 - Math.sin(u * Math.PI) * 160 + u * 160, u * 720 + i * 60, 0.9);
    }
    // callout leader to the gun in the print
    const c = easeOutCubic(ramp(t, 12.8, 13.2));
    if (c > 0) mg += `<path d="M620,560 L760,420 L${760 + 200 * c},420" stroke="${GOLD}" stroke-width="4" fill="none"/>
      <circle cx="620" cy="560" r="10" fill="${GOLD}"/><circle cx="620" cy="560" r="${f2(10 + 30 * ramp(t, 12.8, 13.5))}" fill="none" stroke="${GOLD}" stroke-width="3" opacity="${f2(1 - ramp(t, 12.8, 13.5))}"/>`;
    mg += chip('LEWIS GUN', 840, 360, t, 12.95, { size: 36, w: 330 });
    mg += vignette();
    return mg;
  });

  // ---- 7  PROBLEM 1 — the two WA emus drift apart (pan), silhouettes split & scatter, reticle can't lock
  shot(14.08, 17.18, (t, lt) => {
    // band is 4523 wide; pan from the left emu to the right emu as the flock "splits"
    const pan = easeInOutCubic(ramp(t, 14.2, 16.6));
    P('stokes_wide', { x: lerp(1397, -355, pan), y: 960, s: 1 });
    let mg = grade(0.3, 0.14);
    mg += problemPlate(t, 1, 14.1);
    // scatter burst: a tight mob splits into groups with arrows
    const sp = easeOutCubic(ramp(t, 15.45, 16.4));
    const cx = 560;
    const cy = 480;
    const gk = easeOutBack(ramp(t, 15.1, 15.45));
    const dirs = [[-1, -0.25], [1, -0.35], [-0.6, 0.5], [0.8, 0.45], [0.55, -0.75]];
    for (let g = 0; g < dirs.length; g++) {
      const [dx, dy] = dirs[g];
      const gx = cx + dx * 380 * sp;
      const gy = cy + dy * 260 * sp;
      for (let j = 0; j < 3; j++) {
        const ox = (rnd(g * 7 + j) - 0.5) * 90 * (0.4 + sp);
        const oy = (rnd(g * 5 + j + 2) - 0.5) * 50;
        if (gk > 0) mg += emu(gx + ox, gy + oy + 60, 0.5 * gk, t * 15 + g + j * 2, { fill: 'rgba(242,193,78,0.12)', stroke: GOLD, sw: 4, legs: GOLD, neck: GOLD, beak: GOLD, flip: dx < 0, op: 0.95 });
      }
      if (sp > 0.05) {
        const ax = cx + dx * 150;
        const ay = cy + dy * 110;
        const bx = cx + dx * (150 + 200 * sp);
        const by = cy + dy * (110 + 140 * sp);
        const ang = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
        mg += `<g opacity="${f2(1 - ramp(t, 16.6, 17.1))}"><path d="M${f2(ax)},${f2(ay)} L${f2(bx)},${f2(by)}" stroke="#fff" stroke-width="6" stroke-dasharray="14 10" stroke-linecap="round"/>
          <path d="M0,-14 L22,0 L0,14Z" fill="#fff" transform="translate(${f2(bx)} ${f2(by)}) rotate(${f2(ang)})"/></g>`;
      }
    }
    // reticle hunting between groups
    const targets = [[cx, cy], ...dirs.map(([dx, dy]) => [cx + dx * 380 * sp, cy + dy * 260 * sp + 20])];
    const hop = Math.floor(ramp(t, 15.5, 17.1) * 9);
    const tg = t < 15.5 ? targets[0] : targets[1 + ((hop * 3) % 5)];
    const jitter = t < 15.5 ? 0 : Math.sin(t * 40) * 6;
    mg += `<g transform="translate(${f2(tg[0] + jitter)} ${f2(tg[1])})" opacity="${f2(ramp(t, 14.5, 14.8) * (1 - ramp(t, 16.95, 17.18)))}">
      <circle r="92" fill="none" stroke="${RED}" stroke-width="5"/><circle r="6" fill="${RED}"/>
      <path d="M-130,0 H-60 M60,0 H130 M0,-130 V-60 M0,60 V130" stroke="${RED}" stroke-width="5"/></g>`;
    mg += vignette();
    return mg;
  }, { whip: true });

  // ---- 8  PROBLEM 2 — speed: WA emu + speed streaks + speedo to >40 km/h
  shot(17.18, 20.78, (t, lt) => {
    const shake = t > 18.8 ? Math.sin(t * 60) * 3 : 0;
    const rz = 1.0 + 0.06 * easeInOutCubic(ramp(lt, 0, 3.6));
    P('run_fill', { y: -1000, s: 1.5, blur: 14, bright: 0.85 });
    P('run', { x: 560 - lt * 10, y: 1290, s: rz });
    let mg = grade(0.34, 0.14);
    mg += problemPlate(t, 2, 17.2);
    // speed streaks (emu faces left → streaks trail to the right)
    const sk = ramp(t, 18.1, 18.5);
    for (let i = 0; i < 26; i++) {
      const y = 520 + rnd(i) * 620;
      const len = 180 + rnd(i + 4) * 320;
      const x = ((t * (1600 + rnd(i + 2) * 1400) + rnd(i + 8) * 1400) % 1500) - 200;
      mg += `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(len)}" height="${f2(3 + rnd(i + 1) * 5)}" rx="3" fill="#fff" opacity="${f2(sk * (0.18 + rnd(i + 5) * 0.4))}"/>`;
    }
    // speedometer
    const k = pop(t, 18.2, 0.45);
    if (k > 0) {
      const v = lerp(0, 47, easeOutElastic(ramp(t, 18.55, 19.6))) + (t > 19.6 ? Math.sin(t * 13) * 1.2 : 0);
      const A0 = 150;
      const SW = 240;
      const ang = (val) => ((A0 + (val / 60) * SW) * Math.PI) / 180;
      let ticks = '';
      for (let i = 0; i <= 12; i++) {
        const a = ang(i * 5);
        const r1 = i % 4 === 0 ? 150 : 166;
        ticks += `<line x1="${f2(Math.cos(a) * r1)}" y1="${f2(Math.sin(a) * r1)}" x2="${f2(Math.cos(a) * 184)}" y2="${f2(Math.sin(a) * 184)}" stroke="${i * 5 > 40 ? RED : '#fff'}" stroke-width="${i % 4 === 0 ? 7 : 4}"/>`;
        if (i % 4 === 0) ticks += `<text x="${f2(Math.cos(a) * 118)}" y="${f2(Math.sin(a) * 118 + 12)}" text-anchor="middle" font-size="34" font-weight="800" fill="#fff">${i * 5}</text>`;
      }
      const a1 = ang(40);
      const a2 = ang(60);
      const zone = `M${f2(Math.cos(a1) * 196)},${f2(Math.sin(a1) * 196)} A196,196 0 0 1 ${f2(Math.cos(a2) * 196)},${f2(Math.sin(a2) * 196)}`;
      const na = ang(v);
      mg += `<g transform="translate(${f2(770 + shake)} 1030) scale(${f2(k * 0.74)})">
        <circle r="214" fill="rgba(8,8,6,0.72)" stroke="${GOLD}" stroke-width="6"/>
        <path d="${zone}" stroke="${RED}" stroke-width="16" fill="none" opacity="${f2(0.5 + 0.5 * ramp(t, 18.76, 19.1))}"/>
        ${ticks}
        <line x1="0" y1="0" x2="${f2(Math.cos(na) * 170)}" y2="${f2(Math.sin(na) * 170)}" stroke="${GOLD}" stroke-width="9" stroke-linecap="round"/>
        <circle r="20" fill="${GOLD}"/><circle r="8" fill="${INK}"/>
        <text y="120" text-anchor="middle" font-size="30" font-weight="800" fill="#fff" letter-spacing="4">KM/H</text>
      </g>`;
    }
    if (t > 18.76) mg += `<g transform="translate(700 520)">${label3d('>40 KM/H', 0, 30, { size: 104, depth: 9, attr: `transform="scale(${f2(pop(t, 18.76, 0.4))})"` })}</g>`;
    mg += vignette();
    return mg;
  }, { whip: true });

  // ---- 9  PROBLEM 3 — kept running after being hit (dust puffs, no gore; the emu just keeps going)
  shot(20.78, 24.38, (t, lt) => {
    P('cape', { x: 540, y: 650, s: 1.2 + 0.06 * easeInOutCubic(ramp(lt, 0, 3.6)) });
    let mg = grade(0.36, 0.14);
    mg += problemPlate(t, 3, 20.8);
    // a vector emu sprints across the upper-middle; puffs of dust pop around it, it wobbles and keeps running
    const u = ramp(t, 21.9, 24.3);
    if (u > 0 && u < 1) {
      const ex = lerp(-160, 1180, u);
      const ey = 760;
      const hits = [23.1, 23.35, 23.62, 23.8];
      let wob = 0;
      for (const h of hits) {
        const d = t - h;
        if (d > 0 && d < 0.5) {
          wob += Math.sin(d * 30) * 8 * (1 - d / 0.5);
          const px = lerp(-160, 1180, ramp(h, 21.9, 24.3)) + 40;
          for (let j = 0; j < 7; j++) {
            const a = (j / 7) * Math.PI * 2;
            const r = 20 + d * 160;
            mg += `<circle cx="${f2(px + Math.cos(a) * r)}" cy="${f2(ey - 40 + Math.sin(a) * r * 0.5)}" r="${f2(14 * (1 - d / 0.5) + 4)}" fill="#e2c9a0" opacity="${f2(0.8 * (1 - d / 0.5))}"/>`;
          }
          mg += `<g transform="translate(${f2(px + 60)} ${f2(ey - 180)}) scale(${f2(easeOutBack(clamp(d * 5, 0, 1)))})" opacity="${f2(1 - d / 0.5)}"><path d="M-18,-18 L18,18 M18,-18 L-18,18" stroke="#fff" stroke-width="7" stroke-linecap="round"/></g>`;
        }
      }
      mg += `<ellipse cx="${f2(ex + 10)}" cy="${ey + 6}" rx="80" ry="12" fill="rgba(0,0,0,0.35)"/>`;
      mg += `<g transform="rotate(${f2(wob)} ${f2(ex)} ${ey - 90})">${emu(ex, ey, 1.3, t * 17, { fill: '#2a221a', stroke: GOLD, sw: 3 })}</g>`;
    }
    // "still running" pulse ring on the real emu (resilience badge)
    const rk = ramp(t, 21.1, 21.9);
    if (rk > 0 && t < 22.4) mg += `<circle cx="540" cy="950" r="${f2(60 + rk * 160)}" fill="none" stroke="${GOLD}" stroke-width="5" opacity="${f2(1 - rk)}"/>`;
    mg += vignette();
    return mg;
  }, { whip: true });

  // ---- 10  weeks → thousands of bullets — detachment print, calendar flip, brass rain
  shot(24.38, 26.86, (t, lt) => {
    P('resting_bg', {});
    P('resting_print', { y: 560, s: 0.56 + lt * 0.012, r: -2 });
    let mg = grade(0.0, 0.06);
    // calendar: NOV 1932 → DEC 1932 (the operation ran November–December 1932)
    const ck = pop(t, 24.5, 0.4);
    if (ck > 0) {
      const flip = ramp(t, 25.0, 25.35);
      const m = flip < 0.5 ? 'NOV' : 'DEC';
      const sy = Math.abs(Math.cos(flip * Math.PI));
      mg += `<g transform="translate(750 960) scale(${f2(ck)}) rotate(4)">
        <rect x="-150" y="-150" width="300" height="300" rx="16" fill="rgba(0,0,0,0.5)" transform="translate(8 12)"/>
        <rect x="-150" y="-150" width="300" height="300" rx="16" fill="${PAPER}"/>
        <rect x="-150" y="-150" width="300" height="90" rx="16" fill="${RED}"/><rect x="-150" y="-80" width="300" height="20" fill="${RED}"/>
        <circle cx="-80" cy="-150" r="10" fill="${INK}"/><circle cx="80" cy="-150" r="10" fill="${INK}"/>
        <text y="-88" text-anchor="middle" font-size="44" font-weight="900" fill="#fff" letter-spacing="6">1932</text>
        <g transform="translate(0 50) scale(1 ${f2(sy)})"><text y="36" text-anchor="middle" font-size="110" font-weight="900" fill="${INK}">${m}</text></g>
      </g>`;
    }
    // brass .303 rain into a growing pile + Lewis pan magazines stacking (thousands of rounds)
    const r = ramp(t, 25.5, 26.9);
    if (r > 0) {
      for (let i = 0; i < 70; i++) {
        const t0 = 25.5 + rnd(i) * 1.1;
        const d = t - t0;
        if (d < 0) continue;
        const x = 70 + rnd(i + 3) * 520;
        const land = 1150 - rnd(i + 5) * 30 - Math.max(0, 1 - Math.abs(x - 330) / 260) * 70 * r;
        const y = Math.min(land, -60 + d * d * 2600);
        const rot = y >= land ? 70 + rnd(i + 7) * 40 : d * 900 + i * 40;
        mg += round303(x, y, rot, 1.1);
      }
      for (let i = 0; i < 5; i++) {
        const k = easeOutBack(ramp(t, 25.6 + i * 0.18, 25.9 + i * 0.18));
        if (k <= 0) continue;
        const y = 1160 - i * 30 - (1 - k) * 300;
        mg += `<g transform="translate(${f2(610 + (i % 2) * 8)} ${f2(y)})"><ellipse rx="92" ry="20" fill="#3b3b33" stroke="${GOLD}" stroke-width="3"/><ellipse rx="30" ry="7" fill="#1e1e19"/></g>`;
      }
    }
    mg += vignette();
    return mg;
  });

  // ---- 11  newspapers mocking them — stylised 1932 newsprint props fly in (paper rustle)
  shot(26.86, 28.44, (t, lt) => {
    P('drink_bg', {});
    let mg = grade(0.1, 0.06);
    const specs = [
      [26.84, 330, 720, -9, 'THE EMU WAR', 'Machine guns versus birds', 'NOVEMBER, 1932', 1, { hs: 80 }],
      [27.12, 740, 640, 7, 'EMU WAR', 'Campion district, W.A.', 'NOVEMBER, 1932', 2, { hs: 110, tl: 440 }],
      [27.42, 520, 840, -2, 'THE EMU WAR', 'Guns withdrawn', 'DECEMBER, 1932', 3, { hs: 80 }],
    ];
    for (const [t0, x, y, r, head, sub, date, seed, o] of specs) {
      const k = easeOutCubic(ramp(t, t0, t0 + 0.34));
      if (k <= 0) continue;
      const fx = lerp(x + (x < 540 ? -900 : 900), x, k);
      const fy = lerp(y - 300, y, k);
      mg += paper(fx, fy, r + (1 - k) * (x < 540 ? -40 : 40), lerp(1.3, 0.84, k), head, sub, date, seed, o);
    }
    mg += vignette();
    return mg;
  });

  // ---- 12  "…the soldiers were pulled out." — Lewis blueprint retreats, recall date chip
  shot(28.44, 30.12, (t, lt) => {
    P('gunners_bg', {});
    const out = easeInOutCubic(ramp(t, 29.25, 30.1));
    P('gunners_print', { x: 540 - out * 900, y: 640, s: 1.02, r: -2 - out * 8, gray: 0.2 + out * 0.6 });
    let mg = grade(0.0, 0.06);
    // chevrons pulling left
    for (let i = 0; i < 4; i++) {
      const k = ramp(t, 29.2 + i * 0.08, 29.5 + i * 0.08) * (1 - ramp(t, 29.9, 30.1));
      mg += `<path d="M${780 - i * 110},930 l-70,70 l70,70" fill="none" stroke="${GOLD}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" opacity="${f2(k)}"/>`;
    }
    mg += lewis(300 - out * 1100, 1060, 0.62, { rot: t * 2, op: 0.9 });
    mg += chip('DEC 1932', 540, 330, t, 29.3, { size: 40, w: 300 });
    // dispatch slip prop + recall stamp
    const sk = easeOutBack(ramp(t, 29.3, 29.6));
    if (sk > 0) {
      let rules = '';
      for (let i = 0; i < 6; i++) rules += `<rect x="-270" y="${-80 + i * 34}" width="${f2(540 - rnd(i + 40) * 160)}" height="6" fill="#6b604d" opacity="0.5"/>`;
      mg += `<g transform="translate(560 600) rotate(-4) scale(${f2(sk)})"><rect x="-310" y="-150" width="620" height="300" fill="rgba(0,0,0,0.5)" transform="translate(10 14)" filter="url(#soft)"/>
        <rect x="-310" y="-150" width="620" height="300" fill="${PAPER}"/><rect x="-290" y="-130" width="580" height="4" fill="${INK}"/>${rules}</g>`;
    }
    mg += stamp('RECALLED', 560, 610, t, 29.6, { size: 92, rot: -10, op: 0.92 });
    mg += vignette();
    return mg;
  }, { whip: false });

  // ---- 13  the officer in charge — museum nameplate (no likeness claimed), soft quote gesture
  shot(30.12, 32.8, (t, lt) => {
    P('resting_bg', {});
    P('resting_print', { y: 560, s: 0.56 + lt * 0.02, r: 1.5 });
    let mg = grade(0.06, 0.06);
    // plaque rotates in (plate rotate-in)
    const k = easeOutBack(ramp(t, 30.4, 30.95));
    if (k > 0) mg += `<g transform="translate(540 1040) scale(${f2(k)} 1) ">
      <rect x="-430" y="-110" width="860" height="220" rx="12" fill="rgba(0,0,0,0.55)" transform="translate(10 14)"/>
      <rect x="-430" y="-110" width="860" height="220" rx="12" fill="url(#brass)"/>
      <rect x="-414" y="-94" width="828" height="188" rx="8" fill="none" stroke="#5b3b08" stroke-width="3"/>
      <circle cx="-392" cy="-72" r="7" fill="#6b4a12"/><circle cx="392" cy="-72" r="7" fill="#6b4a12"/><circle cx="-392" cy="72" r="7" fill="#6b4a12"/><circle cx="392" cy="72" r="7" fill="#6b4a12"/>
      <text y="-18" text-anchor="middle" font-size="64" font-weight="900" fill="#2b1c05" letter-spacing="4">MAJOR MEREDITH</text>
      <text y="42" text-anchor="middle" font-size="24" font-weight="800" fill="#3b2708" letter-spacing="3">G.P.W. MEREDITH · ROYAL AUSTRALIAN ARTILLERY</text></g>`;
    // soft quote gesture — oversized quote marks breathe around the (captioned) words; no quote card
    const q = easeOutBack(ramp(t, 31.3, 31.8));
    if (q > 0) mg += `<g opacity="${f2(0.95 * (1 - ramp(t, 32.55, 32.8)))}">
      <text x="${f2(110 - (1 - q) * 80)}" y="1270" font-size="${f2(220 * q)}" font-weight="900" fill="${GOLD}" style="font-family:'Liberation Serif',serif">“</text>
      <text x="${f2(890 + (1 - q) * 80)}" y="1270" font-size="${f2(220 * q)}" font-weight="900" fill="${GOLD}" style="font-family:'Liberation Serif',serif">”</text></g>`;
    mg += vignette();
    return mg;
  });

  // ---- 14  "an army of birds like these" — WA mob, unit IDs lock on, then a marching emu division
  const HEADS = [[226, 648], [432, 486], [670, 486]].map(([x, y]) => [(x - 540) / 0.985, (y - 960) / 0.985]);
  shot(32.8, 37.1, (t, lt) => {
    const mz = lerp(1.0, 0.94, easeInOutCubic(clamp(lt / 4.3, 0, 1)));
    bleed('mob', lt, { z0: 1.0, z1: 0.94, dur: 4.3 });
    let mg = grade(0.28, 0.12);
    // lock-on brackets + chevrons on each real emu head
    HEADS.forEach(([hx, hy], i) => {
      const x = 540 + hx * mz;
      const y = 960 + hy * mz;
      const k = easeOutBack(ramp(t, 33.3 + i * 0.14, 33.6 + i * 0.14));
      if (k <= 0) return;
      const s = 70 * lerp(2, 1, k);
      const fade = 1 - ramp(t, 35.1, 35.5);
      mg += `<g transform="translate(${x} ${y})" opacity="${f2(fade)}">
        <path d="M${-s},${-s + 24} V${-s} H${-s + 24} M${s - 24},${-s} H${s} V${-s + 24} M${s},${s - 24} V${s} H${s - 24} M${-s + 24},${s} H${-s} V${s - 24}" fill="none" stroke="${GOLD}" stroke-width="6"/>
        <g transform="translate(0 ${-s - 38}) scale(${f2(k)})"><path d="M-26,-6 L0,10 L26,-6 M-26,8 L0,24 L26,8" fill="none" stroke="${GOLD}" stroke-width="7" stroke-linejoin="round"/></g></g>`;
    });
    // "…any army in the world": a globe grid rises and an emu division marches in ranks
    const g = easeOutCubic(ramp(t, 35.0, 35.7));
    if (g > 0) {
      mg += `<rect width="1080" height="1920" fill="rgba(10,8,4,${f2(0.45 * g)})"/>`;
      let grid = '';
      for (let i = -3; i <= 3; i++) {
        const rx = Math.abs(Math.cos(((i * 15 + t * 12) % 90) * Math.PI / 180)) * 330;
        grid += `<ellipse cx="0" cy="0" rx="${f2(Math.abs(i) === 0 ? 330 : 330 * Math.abs(Math.sin((i * 26 + t * 14) * Math.PI / 180)))}" ry="330" fill="none" stroke="${GOLD}" stroke-width="2" opacity="0.5"/>`;
        grid += `<line x1="${-f2(Math.sqrt(330 * 330 - (i * 90) ** 2))}" y1="${i * 90}" x2="${f2(Math.sqrt(330 * 330 - (i * 90) ** 2))}" y2="${i * 90}" stroke="${GOLD}" stroke-width="2" opacity="0.45"/>`;
      }
      mg += `<g transform="translate(540 700) scale(${f2(g)})"><circle r="330" fill="rgba(242,193,78,0.07)" stroke="${GOLD}" stroke-width="4"/>${grid}</g>`;
      // marching ranks (in step) across the globe foot, above the caption band
      const ranks = 3;
      for (let r = 0; r < ranks; r++) {
        for (let i = 0; i < 9; i++) {
          const x = ((i * 150 + t * 120 + r * 75) % 1350) - 150;
          const y = 1010 + r * 70;
          mg += emu(x, y, 0.56 + r * 0.08, t * 9 + (i % 2) * 0.2, { fill: '#241c12', stroke: GOLD, sw: 3, legs: GOLD, neck: '#3a2d1c', beak: GOLD, run: 0.6, op: g });
        }
      }
    }
    mg += vignette();
    return mg;
  });

  // ---- 15  LOOP — "Which is how Australia sent soldiers to fight birds… and lost." → frame-1 hook
  shot(37.1, DUR + 0.1, (t, lt) => {
    const back = t >= 40.62; // last frames = frame 1 exactly (match-cut loop)
    let mg = back ? hook(0, 0, false) : hook(t, lt, true);
    if (back) mg += hookTitle(0, 1, { shake: 5 });
    // whip into the loop
    const w = ramp(t, 40.5, 40.62) * (1 - ramp(t, 40.62, 40.72));
    if (w > 0) {
      for (let i = 0; i < 16; i++) mg += `<rect x="0" y="${f2(rnd(i) * 1920)}" width="1080" height="${f2(10 + rnd(i + 1) * 40)}" fill="#fff" opacity="${f2(w * 0.35)}"/>`;
      mg += `<rect width="1080" height="1920" fill="#fff" opacity="${f2(w * 0.5)}"/>`;
    }
    return mg;
  });

  // ============================================================ renderFrame
  const XF = 0.22;
  function renderFrame(t) {
    const mgEl = document.getElementById('mg');
    for (const k in groups) if (k !== 'grain') groups[k].outer.style.display = 'none';
    let body = '';
    for (let i = 0; i < shots.length; i++) {
      const s = shots[i];
      const next = shots[i + 1];
      const inS = t >= s.start && t < s.end;
      const pre = t >= s.start - XF && t < s.start && i > 0; // incoming crossfade
      if (!inS && !pre) continue;
      ALPHA = pre ? easeInOutCubic((t - (s.start - XF)) / XF) : 1;
      if (pre && s.whip) ALPHA = t >= s.start - 0.08 ? 1 : 0; // whip = hard cut with streak flash
      if (ALPHA <= 0) continue;
      const lt = Math.max(0, t - s.start);
      const layer = s.draw(Math.max(t, s.start - XF), lt) || '';
      body += ALPHA < 1 ? `<g opacity="${f2(ALPHA)}">${layer}</g>` : layer;
      if (next && next.whip && t >= next.start - 0.08 && t < next.start + 0.1) {
        const w = 1 - Math.abs(t - next.start) / 0.1;
        let st = '';
        for (let j = 0; j < 14; j++) st += `<rect x="0" y="${f2(rnd(j + i * 20) * 1920)}" width="1080" height="${f2(8 + rnd(j + 3) * 36)}" fill="#fff" opacity="${f2(clamp(w, 0, 1) * 0.3)}"/>`;
        body += st;
      }
    }
    // grain on top of photos (moves every frame)
    const gx = -Math.floor(rnd(Math.floor(t * 30)) * 1080);
    const gy = -Math.floor(rnd(Math.floor(t * 30) + 5) * 1920);
    groups.grain.inner.setAttribute('transform', `translate(${gx} ${gy})`);
    photos.appendChild(groups.grain.outer);
    // subtle safe letterbox shading top (keeps chips readable under the YT header)
    const top = `<rect width="1080" height="260" fill="url(#capFade)" opacity="0" />`;
    mgEl.innerHTML = DEFS + body + top + captions(t);
  }

  window.EPISODE = { duration: DUR, fps: 30, words: [], scenes: [] };
  window.S19 = { init };
  window.renderFrame = renderFrame;
})();
