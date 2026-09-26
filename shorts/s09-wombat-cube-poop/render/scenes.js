/* s09-wombat-cube-poop — photo underlay + SVG motion graphics (no Remotion).
 *
 * Beat seams are cut to the Whisper word timings in ../transcript.json
 * (held Atlas VO, 33.792 s). Fast, excited delivery → hard cube-grid wipes
 * between beats (no dip to black), camera punches on key words, and every MG
 * hit lands on the spoken word it belongs to.
 *
 * Layout guard: captions live in the lower-middle band (~1250–1440 px). All MG
 * sits above y≈1200; credits sit top-left clear of the Shorts UI.
 */
(function () {
  const HS = window.HS;
  const { W, H, clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic, easeOutElastic } = HS;

  const FONT = "'DejaVu Sans', 'Arial Black', Helvetica, sans-serif";
  const C = {
    yellow: '#FFD23F',
    cream: '#FFF4D6',
    ink: '#16110B',
    teal: '#2EC4B6',
    pink: '#FF6B9A',
    red: '#E63946',
    poo: '#8A5A2E',
    pooL: '#B7834F',
    pooD: '#573617',
    gold: '#F2C14E',
    night: '#0B1846',
  };

  const IMG = {
    hook: { url: '/img/s09_01_cube_scat_certified.jpg', w: 1920, h: 1447 },
    wombat: { url: '/img/s09_02_common_wombat_maria.jpg', w: 1920, h: 1280 },
    face: { url: '/img/s09_03_common_wombat_side.jpg', w: 1920, h: 1275 },
    museum: { url: '/img/s09_04_cube_scat_close.jpg', w: 1920, h: 1581 },
    gut: { url: '/img/s09_05_digestive_diagram.png', w: 1280, h: 1809 },
    burrow: { url: '/img/s09_06_burrow_narawntapu.jpg', w: 1920, h: 1440 },
    cradle: { url: '/img/s09_07_cube_scat_cradle.jpg', w: 1495, h: 1211 },
    medal: { url: '/img/s09_08_science_medal.jpg', w: 1472, h: 1456 },
  };

  const CREDIT = {
    hook: 'Photo: Bjørn Christian Tørrissen · CC BY-SA 3.0',
    wombat: 'Photo: Charles J. Sharp / sharpphotography.co.uk · CC BY-SA 4.0',
    face: 'Photo: Dmitry Brant · CC BY-SA 4.0',
    museum: 'Photo: PooMuseum · CC BY-SA 4.0',
    gut: 'Diagram: Mariana Ruiz (LadyofHats) · Public domain',
    burrow: 'Photo: DiverDave · CC BY-SA 3.0',
    cradle: 'Photo: SojournerRL · CC0',
    medal: 'Medal art: U.S. Government · Public domain',
  };

  // ---------- timing (seconds, from transcript.json) ----------
  const S = {
    hook: 0,
    wombat: 4.45,
    count: 5.92,
    hole: 9.15,
    gut: 12.3,
    tube: 14.85,
    why: 20.22,
    roll: 25.6,
    prize: 27.42,
    loop: 31.3,
    end: 33.792,
  };

  // ---------- small helpers ----------
  const p01 = (t, a, d) => clamp((t - a) / d, 0, 1);
  const pop = (t, a, d = 0.32) => (t < a ? 0 : easeOutBack(p01(t, a, d)));
  const bump = (t, a, amp = 0.06, k = 9) => (t < a ? 0 : amp * Math.exp(-(t - a) * k));
  function shake(t, a, amp = 14, dur = 0.35) {
    if (t < a || t > a + dur) return [0, 0];
    const f = 1 - (t - a) / dur;
    return [Math.sin((t - a) * 90) * amp * f, Math.cos((t - a) * 73) * amp * 0.7 * f];
  }
  function rnd(i) {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  const f1 = (n) => n.toFixed(1);

  // Full-bleed photo placed so image point (fx,fy) lands on screen (sx,sy),
  // clamped so the frame is always covered. Returns svg + a mapper for MG anchors.
  function photo(key, o = {}) {
    const im = IMG[key];
    const s = (o.fitWidth ? W / im.w : Math.max(W / im.w, H / im.h)) * (o.zoom || 1);
    const iw = im.w * s;
    const ih = im.h * s;
    // fitWidth (schematics on paper) keeps every label in frame; paper fills the rest.
    const x = o.fitWidth ? 0 : clamp((o.sx ?? 540) - (o.fx ?? 0.5) * iw, W - iw, 0);
    const y = o.fitWidth ? (o.sy ?? 960) - (o.fy ?? 0.5) * ih : clamp((o.sy ?? 960) - (o.fy ?? 0.5) * ih, H - ih, 0);
    const blur = o.blur
      ? `<defs><filter id="pblur${o.blur}" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${o.blur}"/></filter></defs>`
      : '';
    const dim = o.dim ?? 0.45;
    const svg =
      (o.paper ? `<rect width="${W}" height="${H}" fill="${o.paper}"/>` : '') +
      blur +
      `<image href="${im.url}" x="${f1(x)}" y="${f1(y)}" width="${f1(iw)}" height="${f1(ih)}" preserveAspectRatio="none"${o.blur ? ` filter="url(#pblur${o.blur})"` : ''}/>` +
      (o.tint ? `<rect width="${W}" height="${H}" fill="${o.tint}" opacity="${o.tintOp ?? 0.3}"/>` : '') +
      `<rect width="${W}" height="${H}" fill="#000" opacity="${dim}"/>`;
    return { svg, map: (px, py) => [x + px * iw, y + py * ih] };
  }

  function camera(inner, scale, cx = 540, cy = 960, dx = 0, dy = 0, rot = 0) {
    return `<g transform="translate(${f1(cx + dx)} ${f1(cy + dy)}) rotate(${rot.toFixed(2)}) scale(${scale.toFixed(4)}) translate(${-cx} ${-cy})">${inner}</g>`;
  }

  const vignette = () =>
    `<defs><radialGradient id="vig" cx="50%" cy="45%" r="75%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.6"/></radialGradient></defs>
     <rect width="${W}" height="${H}" fill="url(#vig)"/>`;

  function credit(key) {
    return `<text x="40" y="118" font-family="${FONT}" font-size="21" fill="rgba(255,255,255,0.78)"
      stroke="rgba(0,0,0,0.75)" stroke-width="4" paint-order="stroke">${esc(CREDIT[key])}</text>`;
  }

  // Cube-grid wipe: the incoming beat is revealed through a grid of squares
  // that grow in a sweep (direction = unit vector the sweep travels along).
  const WIPE = 0.34;
  function wipeIn(inner, t, start, id, dir = [1, 1]) {
    const lt = t - start;
    if (lt >= WIPE) return inner;
    const cell = 120;
    const cols = 9;
    const rows = 16;
    let rects = '';
    let edges = '';
    const len = Math.hypot(dir[0], dir[1]) || 1;
    const dx = dir[0] / len;
    const dy = dir[1] / len;
    const proj = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) proj.push((c + 0.5) * cell * dx + (r + 0.5) * cell * dy);
    const lo = Math.min(...proj);
    const hi = Math.max(...proj);
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const k = (proj[i++] - lo) / (hi - lo || 1);
        const p = easeOutCubic(clamp((lt - k * 0.19) / 0.15, 0, 1));
        if (p <= 0) continue;
        const sz = cell * 1.04 * p;
        const cx = (c + 0.5) * cell;
        const cy = (r + 0.5) * cell;
        rects += `<rect x="${f1(cx - sz / 2)}" y="${f1(cy - sz / 2)}" width="${f1(sz)}" height="${f1(sz)}"/>`;
        if (p < 1)
          edges += `<rect x="${f1(cx - sz / 2)}" y="${f1(cy - sz / 2)}" width="${f1(sz)}" height="${f1(sz)}"
            fill="none" stroke="${C.yellow}" stroke-width="4" opacity="${(1 - p).toFixed(2)}"/>`;
      }
    }
    return `<defs><clipPath id="wipe-${id}">${rects}</clipPath></defs>
      <g clip-path="url(#wipe-${id})">${inner}</g>${edges}`;
  }

  // Label chip with hard drop shadow (sparse MG labels only).
  function chip(text, x, y, o = {}) {
    const size = o.size || 64;
    const w = o.w || text.length * size * 0.74 + size * 0.9;
    const h = size * 1.45;
    const s = o.scale ?? 1;
    const fill = o.fill || C.yellow;
    const color = o.color || C.ink;
    const rot = o.rot ?? -3;
    if (s <= 0.001) return '';
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot}) scale(${s.toFixed(3)})" opacity="${o.opacity ?? 1}">
      <rect x="${-w / 2 + 10}" y="${-h / 2 + 12}" width="${w}" height="${h}" rx="${size * 0.28}" fill="rgba(0,0,0,0.55)"/>
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${size * 0.28}" fill="${fill}"
        stroke="${C.ink}" stroke-width="5"/>
      <text y="${size * 0.36}" text-anchor="middle" font-family="${FONT}" font-weight="700"
        font-size="${size}" fill="${color}" style="letter-spacing:${o.ls ?? 2}px">${esc(text)}</text>
    </g>`;
  }

  // Ink stamp slam: scales down from 2.3× with a rotation settle.
  function stamp(text, x, y, t, at, o = {}) {
    if (t < at) return '';
    const p = easeOutCubic(p01(t, at, 0.2));
    const s = lerp(2.3, 1, p) + bump(t, at + 0.2, 0.05, 10);
    const size = o.size || 96;
    const color = o.color || C.red;
    const w = text.length * size * 0.74 + size * 0.8;
    const h = size * 1.5;
    return `<g transform="translate(${x} ${y}) rotate(${lerp(-18, o.rot ?? -8, p).toFixed(2)}) scale(${s.toFixed(3)})" opacity="${p.toFixed(3)}">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="14" fill="rgba(255,244,214,0.9)"
        stroke="${color}" stroke-width="10"/>
      <rect x="${-w / 2 + 14}" y="${-h / 2 + 14}" width="${w - 28}" height="${h - 28}" rx="8" fill="none"
        stroke="${color}" stroke-width="4"/>
      <text y="${size * 0.36}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="${size}"
        fill="${color}" style="letter-spacing:4px">${esc(text)}</text>
    </g>`;
  }

  // Radial particle burst.
  function burst(x, y, t, at, o = {}) {
    const lt = t - at;
    const dur = o.dur || 0.5;
    if (lt < 0 || lt > dur) return '';
    const n = o.n || 12;
    const dist = o.dist || 160;
    const p = easeOutCubic(lt / dur);
    let out = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (o.spin || 0);
      const r0 = dist * 0.35 * p + (o.r0 || 0);
      const r1 = dist * p + (o.r0 || 0);
      out += `<line x1="${f1(x + Math.cos(a) * r0)}" y1="${f1(y + Math.sin(a) * r0)}"
        x2="${f1(x + Math.cos(a) * r1)}" y2="${f1(y + Math.sin(a) * r1)}"
        stroke="${o.color || C.yellow}" stroke-width="${o.w || 8}" stroke-linecap="round" opacity="${(1 - p).toFixed(2)}"/>`;
    }
    return out;
  }

  function sparkle(x, y, r, op, color = C.cream) {
    if (op <= 0) return '';
    const q = r * 0.22;
    return `<path d="M${x} ${y - r} Q${x + q} ${y - q} ${x + r} ${y} Q${x + q} ${y + q} ${x} ${y + r}
      Q${x - q} ${y + q} ${x - r} ${y} Q${x - q} ${y - q} ${x} ${y - r}Z" fill="${color}" opacity="${op.toFixed(2)}"/>`;
  }

  // Superellipse |x/r|^n + |y/r|^n = 1 — n=2 circle, n≈5 rounded square.
  function superPts(cx, cy, r, n, steps = 96, rot = 0) {
    const pts = [];
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      let x = r * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
      let y = r * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
      if (rot) {
        const cr = Math.cos(rot);
        const sr = Math.sin(rot);
        [x, y] = [x * cr - y * sr, x * sr + y * cr];
      }
      pts.push([cx + x, cy + y, a]);
    }
    return pts;
  }
  const ptsPath = (pts, close = true) =>
    'M' + pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join(' L') + (close ? ' Z' : '');

  // 3D wireframe cube (orthographic). a = half edge; yaw/pitch in degrees.
  function wireCube(cx, cy, a, yaw, pitch, o = {}) {
    const ya = (yaw * Math.PI) / 180;
    const pa = (pitch * Math.PI) / 180;
    const V = [];
    for (const x of [-1, 1])
      for (const y of [-1, 1])
        for (const z of [-1, 1]) {
          const x1 = x * Math.cos(ya) + z * Math.sin(ya);
          const z1 = -x * Math.sin(ya) + z * Math.cos(ya);
          const y2 = y * Math.cos(pa) - z1 * Math.sin(pa);
          const z2 = y * Math.sin(pa) + z1 * Math.cos(pa);
          V.push([cx + a * x1, cy + a * y2, z2]);
        }
    let far = 0;
    V.forEach((v, i) => {
      if (v[2] > V[far][2]) far = i;
    });
    const E = [];
    for (let i = 0; i < 8; i++)
      for (let j = i + 1; j < 8; j++) {
        const d = i ^ j;
        if (d === 1 || d === 2 || d === 4) E.push([i, j]);
      }
    const prog = o.progress ?? 1;
    let back = '';
    let glow = '';
    let front = '';
    E.forEach(([i, j], k) => {
      const pk = clamp((prog - (k / E.length) * 0.55) / 0.45, 0, 1);
      if (pk <= 0) return;
      const hidden = i === far || j === far;
      const d = `M${f1(V[i][0])} ${f1(V[i][1])} L${f1(V[j][0])} ${f1(V[j][1])}`;
      const dash = `pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${(1 - pk).toFixed(3)}"`;
      if (hidden) {
        back += `<path d="${d}" ${pk < 1 ? dash : ''} stroke="${C.cream}" stroke-width="4" opacity="0.45" stroke-dasharray="${pk < 1 ? '' : '14 12'}"/>`;
      } else {
        glow += `<path d="${d}" ${dash} stroke="${o.color || C.yellow}" stroke-width="22" opacity="0.28" stroke-linecap="round"/>`;
        front += `<path d="${d}" ${dash} stroke="${o.color || C.yellow}" stroke-width="9" stroke-linecap="round"/>`;
      }
    });
    let dots = '';
    const dp = o.dots ?? 0;
    if (dp > 0)
      V.forEach((v, i) => {
        if (i === far) return;
        dots += `<circle cx="${f1(v[0])}" cy="${f1(v[1])}" r="${f1(15 * dp)}" fill="${C.cream}" stroke="${C.ink}" stroke-width="4"/>`;
      });
    return `<g fill="none">${back}${glow}${front}</g>${dots}`;
  }

  // Solid isometric poo-cube (slightly rounded joins — real scats are cuboid, not machined).
  function isoCube(cx, cy, s, o = {}) {
    const k = 0.866 * s;
    const top = `M${cx} ${cy - s} L${cx + k} ${cy - s / 2} L${cx} ${cy} L${cx - k} ${cy - s / 2}Z`;
    const left = `M${cx - k} ${cy - s / 2} L${cx} ${cy} L${cx} ${cy + s} L${cx - k} ${cy + s / 2}Z`;
    const right = `M${cx} ${cy} L${cx + k} ${cy - s / 2} L${cx + k} ${cy + s / 2} L${cx} ${cy + s}Z`;
    const sw = Math.max(2, s * 0.08);
    return `<g stroke-linejoin="round" stroke="${C.ink}" stroke-width="${f1(sw)}" opacity="${o.opacity ?? 1}">
      <path d="${top}" fill="${o.top || C.pooL}"/>
      <path d="${left}" fill="${o.left || C.poo}"/>
      <path d="${right}" fill="${o.right || C.pooD}"/>
    </g>`;
  }

  function qmark(x, y, size, s, rot = 0) {
    if (s <= 0.001) return '';
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot.toFixed(1)}) scale(${s.toFixed(3)})">
      <text y="${size * 0.36}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="${size}"
        fill="${C.yellow}" stroke="${C.ink}" stroke-width="${size * 0.08}" paint-order="stroke">?</text></g>`;
  }

  // ---------- hook title (frame-1 hook and loop closer share exactly this) ----------
  function hookTitle(sPerfect, sCubes, op = 1, dy = 0) {
    if (op <= 0) return '';
    return `<g opacity="${op.toFixed(3)}" transform="translate(0 ${f1(dy)})">
      <g transform="translate(540 262) rotate(-4) scale(${sPerfect.toFixed(3)})">
        <text y="0" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="104"
          fill="${C.cream}" stroke="${C.ink}" stroke-width="16" paint-order="stroke" style="letter-spacing:6px">PERFECT</text>
      </g>
      <g transform="translate(540 430) rotate(-4) scale(${sCubes.toFixed(3)})">
        <text x="10" y="12" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="178"
          fill="${C.ink}" opacity="0.6" style="letter-spacing:8px">CUBES</text>
        <text y="0" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="178"
          fill="${C.yellow}" stroke="${C.ink}" stroke-width="18" paint-order="stroke" style="letter-spacing:8px">CUBES</text>
      </g>
    </g>`;
  }

  const ISO_PITCH = 35.264;
  const HOOK_CUBE = { cx: 540, cy: 872, a: 232 };
  function hookPhoto() {
    return photo('hook', { fx: 0.52, fy: 0.47, sx: 540, sy: 880, dim: 0.3 });
  }

  // ---------- beats ----------

  // 1 · 0–4.45 — frame-1 hook, wire cube wraps the real scat, spin on "weirder"
  function sHook(t) {
    const ph = hookPhoto();
    const push = 1 + 0.1 * easeInOutCubic(p01(t, 0, 4.4)) + bump(t, 1.68, 0.035) + bump(t, 3.8, 0.04);
    const [sx, sy] = shake(t, 3.8, 16, 0.4);
    const yaw = 45 + 90 * easeInOutCubic(p01(t, 3.72, 0.6));
    const cube = wireCube(HOOK_CUBE.cx, HOOK_CUBE.cy, HOOK_CUBE.a, yaw, ISO_PITCH, {
      progress: 1,
      dots: pop(t, 1.62, 0.3) * (t < 3.7 ? 1 : 1 - p01(t, 3.7, 0.2)),
    });
    const titleOut = p01(t, 2.35, 0.35);
    const title = hookTitle(
      1 + bump(t, 1.18, 0.1, 10),
      1 + bump(t, 1.68, 0.14, 9),
      1 - titleOut,
      -140 * easeInOutCubic(titleOut)
    );
    return (
      camera(ph.svg + vignette(), push, 540, 880, sx, sy) +
      camera(cube, push, 540, 880, sx, sy) +
      burst(HOOK_CUBE.cx, HOOK_CUBE.cy, t, 1.68, { n: 14, dist: 470, r0: 150, w: 10 }) +
      title +
      credit('hook')
    );
  }

  // 2 · 4.45–5.92 — species reveal
  function sWombat(t) {
    const lt = t - S.wombat;
    const ph = photo('wombat', { fx: 0.58, fy: 0.56, sx: 560, sy: 980, dim: 0.28 });
    const push = 1 + 0.12 * easeOutCubic(p01(lt, 0, 1.5)) + bump(t, 5.08, 0.05);
    const head = ph.map(0.66, 0.6);
    const sChip = pop(t, 5.02, 0.34);
    const arrowP = easeOutCubic(p01(t, 5.2, 0.3));
    const sub = easeOutCubic(p01(t, 5.28, 0.25));
    const hx = 540 + (head[0] - 540) * push;
    const hy = 980 + (head[1] - 980) * push;
    const inner =
      camera(ph.svg, push, 540, 980) +
      vignette() +
      `<path d="M610 560 Q ${f1(hx + 40)} 600 ${f1(hx)} ${f1(hy - 90)}" fill="none" stroke="${C.cream}" stroke-width="8"
        stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${(1 - arrowP).toFixed(3)}"/>` +
      (arrowP > 0.95
        ? `<circle cx="${f1(hx)}" cy="${f1(hy - 90)}" r="${f1(14 + bump(t, 5.5, 20, 7))}" fill="${C.yellow}" stroke="${C.ink}" stroke-width="4"/>`
        : '') +
      chip('WOMBAT', 520, 420, { size: 118, scale: sChip, rot: -4, ls: 6 }) +
      `<text x="540" y="560" text-anchor="middle" font-family="${FONT}" font-style="italic" font-size="40"
        fill="${C.cream}" stroke="${C.ink}" stroke-width="7" paint-order="stroke" opacity="${sub.toFixed(2)}">Vombatus ursinus</text>` +
      credit('wombat');
    return wipeIn(inner, t, S.wombat, 'wombat', [1, 0.6]);
  }

  // 3 · 5.92–9.15 — ~100 counter, cube pile, night falls on "every single night"
  const PILE = (() => {
    const out = [];
    const rowsN = [7, 6, 5, 4, 3];
    const s = 34;
    const step = 2 * 0.866 * s + 4;
    let idx = 0;
    rowsN.forEach((n, r) => {
      for (let i = 0; i < n; i++) {
        out.push({ x: 540 + (i - (n - 1) / 2) * step, y: 1060 - r * s * 1.52, idx: idx++ });
      }
    });
    return out;
  })();
  function sCount(t) {
    const lt = t - S.count;
    const ph = photo('museum', { fx: 0.52, fy: 0.55, sx: 540, sy: 1000, dim: 0.55 });
    const push = 1.02 + 0.06 * easeInOutCubic(p01(lt, 0, 3.2)) + bump(t, 6.46, 0.03) + bump(t, 8.5, 0.035);
    const nightP = easeInOutCubic(p01(t, 7.7, 0.7));
    const n = Math.round(100 * easeOutCubic(p01(t, 6.05, 1.05)));
    const numS = t < 6.05 ? pop(t, 5.98, 0.25) : 1 + bump(t, 7.1, 0.12, 8);
    const shown = Math.floor((n / 100) * PILE.length);
    let pile = '';
    for (let i = 0; i < shown; i++) {
      const c = PILE[i];
      const at = 6.05 + (i / PILE.length) * 1.05;
      const fp = easeOutBack(p01(t, at, 0.28));
      const y = lerp(c.y - 700, c.y, fp);
      pile += isoCube(c.x, y, 34);
    }
    let stars = '';
    for (let i = 0; i < 26; i++) {
      const x = 60 + rnd(i) * 960;
      const y = 160 + rnd(i + 50) * 620;
      const tw = 0.5 + 0.5 * Math.sin(t * 5 + i * 1.7);
      stars += sparkle(x, y, 6 + rnd(i + 9) * 9, nightP * (0.35 + 0.65 * tw));
    }
    const moonS = easeOutBack(p01(t, 7.85, 0.4));
    const moon =
      moonS > 0
        ? `<g transform="translate(850 300) scale(${moonS.toFixed(3)})">
            <circle r="78" fill="${C.cream}"/><circle cx="34" cy="-22" r="70" fill="${C.night}" opacity="0.96"/></g>`
        : '';
    const night = `<rect width="${W}" height="${H}" fill="${C.night}" opacity="${(0.55 * nightP).toFixed(3)}"/>`;
    const nightChip = chip('/ NIGHT', 540, 612, { size: 70, scale: pop(t, 8.46, 0.32), fill: C.cream, rot: 3, ls: 4 });
    const counter = `<g transform="translate(540 430) scale(${numS.toFixed(3)})">
        <text x="12" y="84" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="240"
          fill="${C.ink}" opacity="0.55">~${n}</text>
        <text y="72" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="240"
          fill="${C.yellow}" stroke="${C.ink}" stroke-width="18" paint-order="stroke">~${n}</text></g>`;
    const inner =
      camera(ph.svg, push, 540, 1000) + night + stars + moon + vignette() + pile + counter + nightChip + credit('museum');
    return wipeIn(inner, t, S.count, 'count', [-1, 0.5]);
  }

  // 4 · 9.15–12.3 — the round-hole puzzle (pure shape MG, no fake anatomy)
  function sHole(t) {
    const lt = t - S.hole;
    const ph = photo('face', { fx: 0.4, fy: 0.52, sx: 540, sy: 1060, dim: 0.42 });
    const push = 1 + 0.14 * easeInOutCubic(p01(lt, 0, 3.1)) + bump(t, 11.28, 0.04);
    const tilt = -2.5 * easeInOutCubic(p01(lt, 0, 3.1));
    // cube pops on "cube", slides right on "round"
    const cubeS = pop(t, 10.22, 0.34);
    const slide = easeInOutCubic(p01(t, 11.0, 0.3));
    const cubeX = lerp(540, 790, slide);
    const wob = Math.sin(t * 7) * 4 * (1 - slide);
    const cube =
      cubeS > 0
        ? `<g transform="translate(${f1(cubeX)} 560) rotate(${wob.toFixed(2)}) scale(${cubeS.toFixed(3)})">${isoCube(0, 0, 96)}</g>`
        : '';
    // circle "hole" pops on "round"
    const ringS = pop(t, 11.0, 0.3);
    const ring =
      ringS > 0
        ? `<g transform="translate(290 560) scale(${ringS.toFixed(3)})">
            <circle r="108" fill="rgba(10,8,6,0.72)" stroke="${C.cream}" stroke-width="12"/>
            <circle r="108" fill="none" stroke="${C.yellow}" stroke-width="26" opacity="${(0.25 + bump(t, 11.28, 0.5, 6)).toFixed(2)}"/></g>`
        : '';
    const arrowP = easeOutCubic(p01(t, 11.12, 0.28));
    const arrow =
      arrowP > 0
        ? `<g stroke="${C.cream}" stroke-width="10" stroke-linecap="round" fill="none">
            <path d="M420 560 L${f1(lerp(420, 640, arrowP))} 560"/>
            ${arrowP > 0.9 ? `<path d="M612 532 L644 560 L612 588"/>` : ''}</g>`
        : '';
    const q = qmark(535, 400, 190, pop(t, 11.42, 0.36), Math.sin(t * 9) * 6);
    const inner =
      camera(ph.svg, push, 540, 1060, 0, 0, tilt) +
      vignette() +
      ring +
      arrow +
      cube +
      q +
      credit('face');
    return wipeIn(inner, t, S.hole, 'hole', [0, 1]);
  }

  // 5a · 12.3–14.85 — "scientists studied intestines": magnifier over the PD schematic
  const GUT = { fitWidth: true, fx: 0.5, fy: 0.7, sx: 540, sy: 870 };
  function sGut(t) {
    const lt = t - S.gut;
    const push = 1 + 0.05 * easeInOutCubic(p01(lt, 0, 2.6));
    const ph = photo('gut', { ...GUT, dim: 0.08, paper: '#F1E7D2' });
    const lens = easeOutBack(p01(t, 12.45, 0.35));
    const u = p01(t, 12.5, 2.2);
    const lx = 540 + Math.sin(u * Math.PI * 1.6) * 190;
    const ly = 800 + Math.sin(u * Math.PI * 1.1 + 0.4) * 150 - 40;
    const lr = 150 * lens * (1 + bump(t, 13.8, 0.12, 8));
    const mag = 1.8;
    const lensSvg =
      lens > 0
        ? `<defs><clipPath id="lensclip"><circle cx="${f1(lx)}" cy="${f1(ly)}" r="${f1(lr)}"/></clipPath></defs>
          <g clip-path="url(#lensclip)">
            <g transform="translate(${f1(lx)} ${f1(ly)}) scale(${mag}) translate(${f1(-lx)} ${f1(-ly)})">${camera(ph.svg, push, 540, 800)}</g>
            <rect width="${W}" height="${H}" fill="${C.teal}" opacity="0.08"/></g>
          <circle cx="${f1(lx)}" cy="${f1(ly)}" r="${f1(lr)}" fill="none" stroke="${C.ink}" stroke-width="16"/>
          <circle cx="${f1(lx)}" cy="${f1(ly)}" r="${f1(lr - 10)}" fill="none" stroke="${C.cream}" stroke-width="4" opacity="0.8"/>
          <path d="M${f1(lx + lr * 0.72)} ${f1(ly + lr * 0.72)} L${f1(lx + lr * 1.25)} ${f1(ly + lr * 1.25)}"
            stroke="${C.ink}" stroke-width="30" stroke-linecap="round"/>`
        : '';
    const tag = chip('GUT DIAGRAM · ILLUSTRATIVE', 300, 190, {
      size: 30,
      scale: pop(t, 12.4, 0.3),
      fill: C.ink,
      color: C.cream,
      rot: 0,
      ls: 1,
    });
    const inner = camera(ph.svg, push, 540, 800) + lensSvg + tag + credit('gut');
    return wipeIn(inner, t, S.gut, 'gut', [1, -0.4]);
  }

  // 5b · 14.85–20.22 — stiff / stretchy walls squeeze the poo into corners
  const TUBE = { x0: 90, x1: 990, cy: 590, R: 92, segs: 6 };
  const XS = { cx: 540, cy: 1010, R: 150 };
  function stiffAt(a) {
    // cross-section: stiff at the four faces, stretchy at the four corners
    const m = ((a % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2);
    return m < Math.PI / 8 || m > (3 * Math.PI) / 8;
  }
  function sTube(t) {
    const lt = t - S.tube;
    const ph = photo('gut', { ...GUT, dim: 0.3, paper: '#F1E7D2', tint: '#0E1A33', tintOp: 0.66, blur: 7 });
    const draw = easeInOutCubic(p01(t, S.tube + 0.05, 0.55));
    const stretchyLive = p01(t, 16.9, 0.25);
    const squeeze = p01(t, 18.15, 1.3);
    const shapeN = lerp(2, 5.2, easeInOutCubic(squeeze));
    const { x0, x1, cy, R, segs } = TUBE;
    const segW = (x1 - x0) / segs;
    const blobX = lerp(-120, 640, easeInOutCubic(p01(t, 17.95, 1.55))) + 90 * p01(t, 19.5, 0.8);
    const cornersHit = t >= 19.38;
    // tube walls
    let walls = '';
    for (let i = 0; i < segs; i++) {
      const stiff = i % 2 === 0;
      const sx0 = x0 + i * segW;
      for (const side of [-1, 1]) {
        let d = '';
        const steps = 24;
        for (let k = 0; k <= steps; k++) {
          const x = sx0 + (k / steps) * segW;
          let y = cy + side * R;
          if (!stiff) {
            const amp = 7 + 13 * stretchyLive;
            y += side * amp * Math.sin((k / steps) * Math.PI) * (0.7 + 0.3 * Math.sin(t * 13 + i));
            // stretchy walls bulge out around the passing blob
            const near = Math.exp(-Math.pow((x - blobX) / 90, 2));
            y += side * near * 26;
          }
          d += (k ? ' L' : 'M') + f1(x) + ' ' + f1(y);
        }
        walls += `<path d="${d}" fill="none" stroke="${stiff ? C.teal : C.pink}" stroke-width="${stiff ? 18 : 10}" stroke-linecap="round"/>`;
      }
    }
    const tube = `<defs><clipPath id="tubeclip"><rect x="0" y="0" width="${f1(x0 - 20 + (x1 - x0 + 40) * draw)}" height="${H}"/></clipPath></defs>
      <g clip-path="url(#tubeclip)">
        <rect x="${x0}" y="${cy - R}" width="${x1 - x0}" height="${2 * R}" fill="rgba(255,107,154,0.10)"/>
        ${walls}
        <path d="${ptsPath(superPts(blobX, cy, 62, shapeN, 64))}" fill="url(#pooGrad)" stroke="${C.ink}" stroke-width="5"/>
      </g>`;
    // slice guide from the tube to the cross-section
    const guideOp = easeOutCubic(p01(t, 15.2, 0.3)) * 0.6;
    const guide = `<g stroke="${C.cream}" stroke-width="3" stroke-dasharray="10 10" opacity="${guideOp.toFixed(2)}">
      <line x1="540" y1="${cy - R - 20}" x2="540" y2="${cy + R + 20}"/>
      <line x1="540" y1="${cy + R + 20}" x2="${XS.cx - XS.R}" y2="${XS.cy - XS.R + 10}"/>
      <line x1="540" y1="${cy + R + 20}" x2="${XS.cx + XS.R}" y2="${XS.cy - XS.R + 10}"/></g>`;
    // cross-section ring: stiff faces stay flat, stretchy corners give → squares off
    const xsS = easeOutBack(p01(t, 15.25, 0.35));
    let xs = '';
    if (xsS > 0) {
      const ringN = lerp(2, 4.6, easeInOutCubic(squeeze));
      const pts = superPts(0, 0, XS.R, ringN, 128, 0);
      let run = [];
      let runStiff = stiffAt(pts[0][2]);
      const pieces = [];
      pts.concat([pts[0]]).forEach((p) => {
        const st = stiffAt(p[2]);
        if (st !== runStiff && run.length) {
          run.push(p);
          pieces.push([runStiff, run]);
          run = [p];
          runStiff = st;
        } else run.push(p);
      });
      if (run.length > 1) pieces.push([runStiff, run]);
      const ring = pieces
        .map(
          ([st, r]) =>
            `<path d="${ptsPath(r, false)}" fill="none" stroke="${st ? C.teal : C.pink}" stroke-width="${st ? 22 : 12}" stroke-linecap="round"/>`
        )
        .join('');
      const blobS = easeOutBack(p01(t, 18.1, 0.3));
      const blob =
        blobS > 0
          ? `<path d="${ptsPath(superPts(0, 0, 112 * blobS, shapeN, 96))}" fill="url(#pooGrad)" stroke="${C.ink}" stroke-width="6"/>` +
            Array.from({ length: 22 }, (_, i) => {
              const a = rnd(i) * Math.PI * 2;
              const r = Math.sqrt(rnd(i + 30)) * 85 * blobS;
              return `<circle cx="${f1(Math.cos(a) * r)}" cy="${f1(Math.sin(a) * r)}" r="${f1(2 + rnd(i + 70) * 3)}" fill="${C.pooD}" opacity="0.7"/>`;
            }).join('')
          : '';
      let corners = '';
      if (cornersHit) {
        const cp = easeOutBack(p01(t, 19.38, 0.3));
        const off = 128 + bump(t, 19.38, 30, 7);
        for (const [sx, sy] of [
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ]) {
          const x = sx * off;
          const y = sy * off;
          corners += `<path d="M${f1(x - sx * 44 * cp)} ${f1(y)} L${f1(x)} ${f1(y)} L${f1(x)} ${f1(y - sy * 44 * cp)}"
            fill="none" stroke="${C.yellow}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`;
        }
      }
      const s = xsS * (1 + bump(t, 19.38, 0.07, 8));
      xs =
        `<g transform="translate(${XS.cx} ${XS.cy}) scale(${s.toFixed(3)})">
          <circle r="${XS.R + 26}" fill="rgba(8,12,24,0.55)"/>${ring}${blob}</g>` +
        (cornersHit ? `<g transform="translate(${XS.cx} ${XS.cy})">${corners}</g>` : '') +
        (cornersHit
          ? [
              [-1, -1],
              [1, -1],
              [1, 1],
              [-1, 1],
            ]
              .map(([sx, sy]) => burst(XS.cx + sx * 150, XS.cy + sy * 150, t, 19.38, { n: 6, dist: 80, w: 6 }))
              .join('')
          : '');
    }
    const stiffChip = chip('STIFF', x0 + segW * 2.5, cy - R - 95, {
      size: 58,
      scale: pop(t, 15.5, 0.32),
      fill: C.teal,
      rot: -3,
      ls: 4,
    });
    const stretchChip = chip('STRETCHY', x0 + segW * 3.5, cy + R + 95, {
      size: 58,
      scale: pop(t, 16.9, 0.32),
      fill: C.pink,
      rot: 3,
      ls: 4,
    });
    const push = 1 + bump(t, 15.54, 0.03) + bump(t, 16.94, 0.03) + bump(t, 19.38, 0.05);
    const [shx, shy] = shake(t, 19.38, 10, 0.3);
    const defs = `<defs><radialGradient id="pooGrad" cx="40%" cy="35%" r="75%">
      <stop offset="0%" stop-color="${C.pooL}"/><stop offset="100%" stop-color="${C.pooD}"/></radialGradient></defs>`;
    const inner =
      defs +
      camera(ph.svg, 1.04 + 0.03 * p01(lt, 0, 5.4), 540, 800) +
      vignette() +
      camera(tube + guide + xs + stiffChip + stretchChip, push, 540, 800, shx, shy) +
      chip('GUT DIAGRAM · ILLUSTRATIVE', 300, 190, { size: 30, fill: C.ink, color: C.cream, rot: 0, ls: 1 }) +
      credit('gut');
    return wipeIn(inner, t, S.tube, 'tube', [0, -1]);
  }

  // 6 · 20.22–25.6 — why cubes? one theory → territory pin at the burrow
  function sWhy(t) {
    const lt = t - S.why;
    const ph = photo('burrow', { fx: 0.3, fy: 0.45, sx: 540, sy: 860, dim: 0.42 });
    const push = 1 + 0.08 * easeInOutCubic(p01(lt, 0, 5.4)) + bump(t, 23.96, 0.04) + bump(t, 24.7, 0.03);
    const pin0 = ph.map(0.26, 0.43);
    const pin = [540 + (pin0[0] - 540) * push, 860 + (pin0[1] - 860) * push];
    // "why cubes?" — spinning cube + orbiting question marks, clears for the theory
    const whyOut = p01(t, 21.75, 0.3);
    const cubeS = pop(t, 20.6, 0.34) * (1 - whyOut);
    let why = '';
    if (cubeS > 0.001) {
      why += `<g transform="translate(540 520) rotate(${(Math.sin(t * 4) * 8).toFixed(1)}) scale(${cubeS.toFixed(3)})">${isoCube(0, 0, 90)}</g>`;
      [20.78, 20.92, 21.06].forEach((at, i) => {
        const a = t * 1.8 + (i * Math.PI * 2) / 3;
        why += qmark(540 + Math.cos(a) * 220, 520 + Math.sin(a) * 110, 110, pop(t, at, 0.3) * (1 - whyOut), Math.sin(t * 8 + i) * 10);
      });
    }
    // hedge: this is a theory
    const theory = chip('THEORY', 540, 330, {
      size: 40,
      scale: pop(t, 21.8, 0.3),
      fill: C.cream,
      rot: -2,
      ls: 6,
    });
    // pin drop on "rocks"
    const drop = easeOutElastic(p01(t, 23.9, 0.7));
    const pinY = pin[1] - 520 * (1 - drop);
    const pinSvg =
      t >= 23.9
        ? `<g transform="translate(${f1(pin[0])} ${f1(pinY)})">
            <ellipse cx="0" cy="4" rx="${f1(26 * drop)}" ry="${f1(9 * drop)}" fill="rgba(0,0,0,0.45)"/>
            <path d="M0 0 C-10 -34 -50 -58 -50 -100 C-50 -132 -26 -152 0 -152 C26 -152 50 -132 50 -100 C50 -58 10 -34 0 0Z"
              fill="${C.red}" stroke="${C.ink}" stroke-width="6"/>
            <circle cx="0" cy="-102" r="20" fill="${C.cream}" stroke="${C.ink}" stroke-width="4"/></g>`
        : '';
    // "wombats leave them…" — three little cubes land on the burrow mound
    let left = '';
    [
      [23.26, -150, 70],
      [23.42, 120, 95],
      [23.58, -20, 140],
    ].forEach(([at, ox, oy]) => {
      if (t < at) return;
      const d = easeOutBack(p01(t, at, 0.3));
      left += isoCube(pin[0] + ox, pin[1] + oy - 260 * (1 - d), 38, { opacity: clamp(d * 2, 0, 1) });
    });
    // territory ring + scent pulses on "mark territory"
    const ringP = easeOutCubic(p01(t, 24.45, 0.6));
    let ring = '';
    if (ringP > 0) {
      ring += `<ellipse cx="${f1(pin[0])}" cy="${f1(pin[1])}" rx="${f1(340 * ringP)}" ry="${f1(125 * ringP)}"
        fill="rgba(255,210,63,0.10)" stroke="${C.yellow}" stroke-width="7" stroke-dasharray="26 16"
        stroke-dashoffset="${f1(-t * 60)}"/>`;
      for (let i = 0; i < 3; i++) {
        const ph2 = ((t - 24.45) * 0.9 + i / 3) % 1;
        ring += `<ellipse cx="${f1(pin[0])}" cy="${f1(pin[1])}" rx="${f1(60 + 280 * ph2)}" ry="${f1(22 + 103 * ph2)}"
          fill="none" stroke="${C.cream}" stroke-width="4" opacity="${(0.6 * (1 - ph2) * ringP).toFixed(2)}"/>`;
      }
    }
    const terr = chip('TERRITORY', 540, 440, { size: 82, scale: pop(t, 24.66, 0.34), rot: -3, ls: 4 });
    const inner =
      camera(ph.svg, push, 540, 860) +
      vignette() +
      ring +
      left +
      pinSvg +
      burst(pin[0], pin[1], t, 24.0, { n: 10, dist: 120, w: 6, color: C.cream }) +
      why +
      theory +
      terr +
      credit('burrow');
    return wipeIn(inner, t, S.why, 'why', [1, 0]);
  }

  // 7 · 25.6–27.42 — ball rolls off, cube stays: DON'T ROLL
  function sRoll(t) {
    const lt = t - S.roll;
    const ph = photo('cradle', { fx: 0.48, fy: 0.52, sx: 540, sy: 1060, dim: 0.42 });
    const push = 1.02 + 0.06 * easeInOutCubic(p01(lt, 0, 1.9)) + bump(t, 26.48, 0.04);
    const A = { x: 110, y: 560 };
    const B = { x: 1080, y: 790 };
    const ang = Math.atan2(B.y - A.y, B.x - A.x);
    const rampAt = (x) => A.y + (x - A.x) * Math.tan(ang);
    const nx = Math.sin(ang);
    const ny = -Math.cos(ang);
    const rampP = easeOutCubic(p01(t, S.roll + 0.05, 0.3));
    const ramp = `<g opacity="${rampP.toFixed(2)}">
      <path d="M${A.x} ${A.y} L${f1(lerp(A.x, B.x, rampP))} ${f1(lerp(A.y, B.y, rampP))}" stroke="${C.cream}" stroke-width="14" stroke-linecap="round"/>
      <path d="M${A.x} ${A.y} L${B.x} ${B.y} L${B.x} ${B.y + 40} L${A.x} ${A.y + 40}Z" fill="rgba(255,244,214,0.16)"/></g>`;
    const land = easeOutBack(p01(t, 25.72, 0.3));
    // cube: sits flat on the slope, tiny settle wobble
    const cx0 = 360;
    const cs = 118;
    const cubeBase = [cx0, rampAt(cx0)];
    const cubeC = [cubeBase[0] + nx * (cs / 2 + 7), cubeBase[1] + ny * (cs / 2 + 7) - 420 * (1 - land)];
    const wob = Math.sin((t - 26.2) * 26) * 3 * Math.exp(-Math.max(0, t - 26.2) * 5) * (t > 26.2 ? 1 : 0);
    const cube =
      land > 0
        ? `<g transform="translate(${f1(cubeC[0])} ${f1(cubeC[1])}) rotate(${((ang * 180) / Math.PI + wob).toFixed(2)})">
            <rect x="${-cs / 2}" y="${-cs / 2}" width="${cs}" height="${cs}" rx="16" fill="url(#pooGrad2)" stroke="${C.ink}" stroke-width="7"/>
            <rect x="${-cs / 2 + 14}" y="${-cs / 2 + 12}" width="${cs - 40}" height="14" rx="7" fill="${C.pooL}" opacity="0.7"/></g>`
        : '';
    // ball: rolls from "cubes" (25.82) off the right edge
    const rollP = p01(t, 25.84, 0.95);
    const dist = 900 * rollP * rollP;
    const br = 58;
    const bx0 = 690;
    const bx = bx0 + dist * Math.cos(ang);
    const by = rampAt(bx) + ny * (br + 7) - 420 * (1 - land);
    const spin = ((dist / br) * 180) / Math.PI;
    let streaks = '';
    if (rollP > 0.1 && rollP < 1)
      for (let i = 0; i < 3; i++)
        streaks += `<line x1="${f1(bx - 80 - i * 26)}" y1="${f1(by - 30 + i * 30 - 20)}" x2="${f1(bx - 150 - i * 30)}"
          y2="${f1(by - 30 + i * 30 - 36)}" stroke="${C.cream}" stroke-width="6" stroke-linecap="round" opacity="0.7"/>`;
    const ball =
      land > 0 && bx < 1200
        ? `${streaks}<g transform="translate(${f1(bx)} ${f1(by)}) rotate(${spin.toFixed(1)})">
            <circle r="${br}" fill="url(#pooGrad2)" stroke="${C.ink}" stroke-width="7"/>
            <path d="M${-br + 10} 0 L${br - 10} 0 M0 ${-br + 10} L0 ${br - 10}" stroke="${C.pooD}" stroke-width="6" opacity="0.6"/></g>`
        : '';
    const check =
      t >= 26.55
        ? `<g transform="translate(${f1(cubeC[0] + 6)} ${f1(cubeC[1] - 120)}) scale(${pop(t, 26.55, 0.3).toFixed(3)})">
            <circle r="40" fill="${C.teal}" stroke="${C.ink}" stroke-width="6"/>
            <path d="M-18 2 L-5 16 L20 -14" fill="none" stroke="${C.ink}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></g>`
        : '';
    const defs = `<defs><radialGradient id="pooGrad2" cx="35%" cy="30%" r="80%">
      <stop offset="0%" stop-color="${C.pooL}"/><stop offset="100%" stop-color="${C.pooD}"/></radialGradient></defs>`;
    const inner =
      defs +
      camera(ph.svg, push, 540, 1060) +
      vignette() +
      ramp +
      ball +
      cube +
      check +
      stamp("DON'T ROLL", 540, 330, t, 26.46, { size: 84, color: C.teal, rot: -6 }) +
      credit('cradle');
    return wipeIn(inner, t, S.roll, 'roll', [-1, -0.3]);
  }

  // 8 · 27.42–31.3 — prize: gold medal flip-in, PRIZE stamp, wire cube sets up the loop
  const MEDAL = { cx: 540, cy: 740, D: 660 };
  function sPrize(t) {
    const lt = t - S.prize;
    const flip = easeOutCubic(p01(t, S.prize + 0.02, 0.75));
    const ang = lerp(540, 0, flip);
    const sx = Math.max(0.04, Math.abs(Math.cos((ang * Math.PI) / 180)));
    const exit = easeInOutCubic(p01(t, 29.95, 0.9));
    const ms = lerp(0.65, 1, flip) * lerp(1, 0.55, exit) * (1 + bump(t, 28.86, 0.06, 8));
    const my = lerp(MEDAL.cy, 400, exit);
    const { D } = MEDAL;
    const clipR = D * 0.355;
    // light rays
    let rays = '';
    for (let i = 0; i < 18; i++) {
      const a0 = (i / 18) * Math.PI * 2 + t * 0.35;
      const a1 = a0 + 0.09;
      const L = 1300;
      rays += `<path d="M0 0 L${f1(Math.cos(a0) * L)} ${f1(Math.sin(a0) * L)} L${f1(Math.cos(a1) * L)} ${f1(Math.sin(a1) * L)}Z"/>`;
    }
    const raysOp = 0.1 * easeOutCubic(p01(lt, 0.2, 0.5));
    const medal = `
      <g transform="translate(540 ${f1(my)})">
        <g fill="${C.gold}" opacity="${raysOp.toFixed(3)}">${rays}</g>
        <g transform="scale(${(ms * sx).toFixed(3)} ${ms.toFixed(3)})">
          <path d="M-150 150 L-230 470 L-150 430 L-100 500 L-40 200Z" fill="${C.red}" stroke="${C.ink}" stroke-width="6"/>
          <path d="M150 150 L230 470 L150 430 L100 500 L40 200Z" fill="${C.teal}" stroke="${C.ink}" stroke-width="6"/>
          <circle r="${f1(clipR + 44)}" fill="#3A2A0A" stroke="${C.gold}" stroke-width="18"/>
          <circle r="${f1(clipR + 20)}" fill="#1B1405" stroke="${C.gold}" stroke-width="5" opacity="0.9"/>
          <g clip-path="url(#medalclip)">
            <image href="${IMG.medal.url}" x="${-D / 2}" y="${-D / 2}" width="${D}" height="${D}" filter="url(#goldline)"/>
          </g>
          <circle r="${f1(clipR + 44)}" fill="url(#medalShine)"/>
        </g>
      </g>`;
    let sparks = '';
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.3;
      const r = 330 + rnd(i) * 80;
      const tw = Math.max(0, Math.sin(t * 6 + i * 2.1));
      sparks += sparkle(540 + Math.cos(a) * r * ms, my + Math.sin(a) * r * ms * 0.9, 12 + 14 * tw, tw * flip, C.gold);
    }
    const stampY = lerp(1060, 690, exit);
    const stampS = lerp(1, 0.7, exit);
    const prizeStamp =
      t >= 28.8
        ? `<g transform="translate(540 ${f1(stampY)}) scale(${stampS.toFixed(3)}) translate(-540 ${-stampY})">${stamp('PRIZE', 540, stampY, t, 28.8, { size: 120, color: C.red, rot: -7 })}</g>`
        : '';
    const defs = `<defs>
      <radialGradient id="prizeBg" cx="50%" cy="40%" r="75%">
        <stop offset="0%" stop-color="#3B2A6B"/><stop offset="100%" stop-color="#0B0E24"/></radialGradient>
      <radialGradient id="medalShine" cx="35%" cy="28%" r="70%">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.28"/><stop offset="45%" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <clipPath id="medalclip"><circle r="${f1(clipR)}"/></clipPath>
      <filter id="goldline" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0 0 0 0 0.98  0 0 0 0 0.80  0 0 0 0 0.36  -0.4 -0.4 -0.4 0 1.15"/>
      </filter></defs>`;
    const inner =
      defs +
      `<rect width="${W}" height="${H}" fill="url(#prizeBg)"/>` +
      medal +
      sparks +
      burst(540, MEDAL.cy, t, 28.86, { n: 16, dist: 520, r0: 300, w: 10, color: C.gold }) +
      prizeStamp +
      credit('medal');
    return wipeIn(inner, t, S.prize, 'prize', [0, 1]);
  }

  // 9 · 31.3–33.792 — loop: wire cube + hook title reassemble; last frame = frame 1
  function sLoop(t) {
    const lt = t - S.loop;
    const ph = hookPhoto();
    const settle = easeInOutCubic(p01(t, S.loop, S.end - S.loop - 0.05));
    const push = lerp(1.1, 1, settle) + bump(t, 32.9, 0.05);
    const [sx, sy] = shake(t, 32.9, 14, 0.35);
    const prog = easeOutCubic(p01(lt, 0.05, 0.7));
    const yaw = 45 + 120 * (1 - easeOutCubic(p01(lt, 0, 1.3)));
    const scaleIn = lerp(0.8, 1, easeOutCubic(p01(lt, 0, 0.6)));
    const cube = wireCube(HOOK_CUBE.cx, HOOK_CUBE.cy, HOOK_CUBE.a * scaleIn, yaw, ISO_PITCH, {
      progress: prog,
      // dots clear before the end so the last frame matches frame 1 exactly
      dots: pop(t, 32.88, 0.3) * (1 - p01(t, 33.4, 0.3)),
    });
    const sP = t < 32.5 ? 0 : easeOutBack(p01(t, 32.5, 0.28));
    const sC = t < 32.88 ? 0 : easeOutBack(p01(t, 32.88, 0.28)) + bump(t, 33.1, 0.06, 9);
    const title = hookTitle(sP, sC, 1, 0);
    const inner =
      camera(ph.svg + vignette(), push, 540, 880, sx, sy) +
      camera(cube, push, 540, 880, sx, sy) +
      burst(HOOK_CUBE.cx, HOOK_CUBE.cy, t, 32.9, { n: 14, dist: 470, r0: 150, w: 10 }) +
      title +
      credit('hook');
    return wipeIn(inner, t, S.loop, 'loop', [0, 0.01]);
  }

  // ---------- captions: short phrase chunks for the fast delivery ----------
  function phraseCaptions(words) {
    // 1) phrases: break on punctuation or a breath gap
    const phrases = [];
    let cur = [];
    words.forEach((w, i) => {
      cur.push(w);
      const next = words[i + 1];
      if (/[.,?!…:]$/.test(w.word) || !next || next.start - w.end > 0.35) {
        phrases.push(cur);
        cur = [];
      }
    });
    // 2) long phrases split into char-balanced chunks (no orphan last word)
    const MAX = 24;
    const groups = [];
    for (const ph of phrases) {
      const len = (g) => g.map((w) => w.word).join(' ').length;
      const k = Math.ceil(len(ph) / MAX);
      if (k <= 1) {
        groups.push(ph);
        continue;
      }
      const target = len(ph) / k;
      let chunk = [];
      for (const w of ph) {
        if (chunk.length && len(chunk.concat(w)) > target + 4 && groups.length < 999) {
          groups.push(chunk);
          chunk = [];
        }
        chunk.push(w);
      }
      if (chunk.length) groups.push(chunk);
    }
    return groups.map((g, i) => {
      const nextG = groups[i + 1];
      const lastEnd = g[g.length - 1].end;
      let end = lastEnd + 0.25;
      if (nextG) end = nextG[0].start - lastEnd < 0.3 ? nextG[0].start - 0.02 : Math.min(end, nextG[0].start - 0.02);
      return { text: g.map((x) => x.word).join(' '), start: g[0].start, end: Math.max(end, lastEnd) };
    });
  }

  const scenes = [
    ['hook', S.hook, S.wombat, sHook],
    ['wombat', S.wombat, S.count, sWombat],
    ['count', S.count, S.hole, sCount],
    ['hole', S.hole, S.gut, sHole],
    ['gut', S.gut, S.tube, sGut],
    ['tube', S.tube, S.why, sTube],
    ['why', S.why, S.roll, sWhy],
    ['roll', S.roll, S.prize, sRoll],
    ['prize', S.prize, S.loop, sPrize],
    ['loop', S.loop, S.end + 0.1, sLoop],
  ].map(([id, start, next, fn]) => ({
    id,
    start,
    // overlap the next beat so the engine never dips to black — the incoming
    // beat's cube-grid wipe reveals over this one instead.
    end: next + WIPE + 0.02,
    draw: (t) => fn(t),
  }));

  window.EPISODE = {
    duration: S.end,
    fps: 30,
    images: Object.fromEntries(Object.entries(IMG).map(([k, v]) => [k, v.url])),
    words: [],
    scenes,
    preload: Promise.all(
      Object.values(IMG).map((im) => {
        const el = new Image();
        el.src = im.url;
        return el.decode().catch(() => null);
      })
    ),
  };

  // Use phrase captions (engine falls back to its own grouping otherwise).
  const baseRender = window.renderFrame;
  let capsReady = false;
  window.renderFrame = function (t) {
    const ep = window.EPISODE;
    if (!capsReady && ep.words && ep.words.length) {
      ep._caps = phraseCaptions(ep.words);
      capsReady = true;
    }
    baseRender(t);
  };
})();
