/* s03-buckleys-chance — photo underlay + SVG motion graphics (no Remotion).
 * Timing from transcript.json (faster-whisper word stamps). Captions ~70% via engine.
 * Keep every overlay out of the caption band (~y 1270–1420) and the right-edge YT rail.
 */
(function () {
  const W = 1080;
  const H = 1920;
  const DUR = 57.456;
  const BAND_TOP = 1262; // caption band guard

  // Palette — ochre / parchment / ink
  const C = {
    ochre: '#E9B04B',
    ochreDeep: '#C9862B',
    parchment: '#F4E7C9',
    ink: '#16100A',
    red: '#C8472B',
    gum: '#9CC3A5',
    white: '#FFF8EA',
  };
  const F = {
    display: "'Anton', 'Oswald', Impact, sans-serif",
    label: "'Oswald', 'Liberation Sans', sans-serif",
    serif: "'Playfair Display', 'DejaVu Serif', serif",
  };

  const IM = {
    portrait: { url: '/img/s03_01_william_buckley_portrait.jpg', w: 2400, h: 3102 },
    chart: { url: '/img/s03_02_port_phillip_1803_chart.jpg', w: 1280, h: 1598 },
    kulin: { url: '/img/s03_03_kulin_wadawurrung_map.png', w: 1800, h: 1782 },
    yangs: { url: '/img/s03_04_you_yangs_panorama.jpg', w: 1800, h: 724 },
    woodhouse: { url: '/img/s03_05_first_settlers_discover_buckley.jpg', w: 1800, h: 1174 },
    huts: { url: '/img/s03_06_indented_head_huts_1835.png', w: 1800, h: 960 },
  };

  // ---------- fonts + preload ----------
  const style = document.createElement('style');
  style.textContent = `
    @font-face { font-family: 'Anton'; src: url('/fonts/Anton-Regular.ttf'); }
    @font-face { font-family: 'Oswald'; src: url('/fonts/Oswald-Variable.ttf'); font-weight: 200 700; }
    @font-face { font-family: 'Playfair Display'; src: url('/fonts/PlayfairDisplay-Variable.ttf'); font-weight: 400 900; }
    @font-face { font-family: 'Playfair Display'; font-style: italic; src: url('/fonts/PlayfairDisplay-Italic-Variable.ttf'); font-weight: 400 900; }
  `;
  document.head.appendChild(style);
  const ready = Promise.all([
    document.fonts.load("80px 'Anton'"),
    document.fonts.load("500 40px 'Oswald'"),
    document.fonts.load("700 40px 'Oswald'"),
    document.fonts.load("italic 600 40px 'Playfair Display'"),
    document.fonts.load("700 40px 'Playfair Display'"),
    ...Object.values(IM).map((m) => {
      const i = new Image();
      i.src = m.url;
      return i.decode().catch(() => {});
    }),
  ]);

  // ---------- math ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const eOut = (t) => 1 - Math.pow(1 - t, 3);
  const eOut5 = (t) => 1 - Math.pow(1 - t, 5);
  const eIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const eBack = (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  const esc = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  // deterministic pseudo-random
  const rnd = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  let uid = 0;
  const id = (p) => `${p}${uid++}`;

  const ctx2d = document.createElement('canvas').getContext('2d');
  function textW(text, font, spacing = 0) {
    ctx2d.font = font;
    return ctx2d.measureText(text).width + spacing * Math.max(0, text.length - 1);
  }

  // ---------- image underlay with focal point ----------
  // Places image point (fx,fy) at screen (sx,sy); clamps so the frame stays covered.
  function cover(key, o = {}) {
    const im = IM[key];
    const base = Math.max(W / im.w, H / im.h);
    const s = base * (o.zoom || 1);
    const sx = o.sx != null ? o.sx : W / 2;
    const sy = o.sy != null ? o.sy : H / 2;
    let x = sx - (o.fx != null ? o.fx : im.w / 2) * s;
    let y = sy - (o.fy != null ? o.fy : im.h / 2) * s;
    if (!o.noClamp) {
      x = clamp(x, W - im.w * s, 0);
      y = clamp(y, H - im.h * s, 0);
    }
    const map = (ix, iy) => [x + ix * s, y + iy * s];
    const filt = o.filter ? ` filter="url(#${o.filter})"` : '';
    const svg = (o.bg ? `<rect width="${W}" height="${H}" fill="${o.bg}"/>` : '') + `<image href="${im.url}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(im.w * s).toFixed(2)}" height="${(im.h * s).toFixed(2)}" preserveAspectRatio="none"${filt}/>`
      + (o.dim ? `<rect width="${W}" height="${H}" fill="rgba(10,6,3,${o.dim})"/>` : '');
    return { svg, map, s };
  }

  // ---------- shared MG pieces ----------
  // legibility gradients (top credit zone, lower third above captions)
  function scrims(top = 0.55, low = 0.5) {
    return `<rect width="${W}" height="420" fill="url(#gTop)" opacity="${top}"/>
      <rect y="${H - 1100}" width="${W}" height="1100" fill="url(#gLow)" opacity="${low}"/>`;
  }

  // Archival credit line (top-left, small, dignified)
  function credit(text, t, a, b) {
    const p = eOut(prog(t, a, a + 0.6)) * (b != null ? 1 - prog(t, b - 0.4, b) : 1);
    if (p <= 0) return '';
    const w = textW(text, "italic 500 25px 'Playfair Display'", 0.3);
    return `<g opacity="${(p * 0.92).toFixed(3)}">
      <rect x="48" y="168" width="${(w + 46).toFixed(1)}" height="50" rx="25" fill="rgba(14,9,4,0.62)"/>
      <rect x="62" y="180" width="3" height="26" fill="${C.ochre}"/>
      <text x="76" y="200" font-family="${F.serif}" font-style="italic" font-weight="500" font-size="25" fill="${C.parchment}"
        style="letter-spacing:0.3px">${esc(text)}</text></g>`;
  }

  // Place / name tag: ochre rule + spaced caps; wipes in from the rule.
  function tag(x, y, text, t, a, o = {}) {
    const p = eOut5(prog(t, a, a + 0.55));
    const out = o.out != null ? 1 - eIO(prog(t, o.out, o.out + 0.35)) : 1;
    if (p <= 0 || out <= 0) return '';
    const size = o.size || 40;
    const sp = o.spacing != null ? o.spacing : size * 0.16;
    const font = `${o.weight || 600} ${size}px Oswald`;
    const w = textW(text, font, sp);
    const align = o.align || 'left';
    const x0 = align === 'center' ? x - w / 2 : x;
    const cid = id('tc');
    const sub = o.sub
      ? `<text x="${align === 'center' ? x : x0}" y="${y + size * 0.95}" text-anchor="${align === 'center' ? 'middle' : 'start'}"
          font-family="${F.serif}" font-style="italic" font-weight="500" font-size="${o.subSize || 26}" fill="${C.parchment}"
          opacity="${eOut(prog(t, a + 0.3, a + 0.9)).toFixed(3)}">${esc(o.sub)}</text>`
      : '';
    return `<g opacity="${out.toFixed(3)}">
      <clipPath id="${cid}"><rect x="${x0 - 30}" y="${y - size * 1.2}" width="${((w + 60) * p).toFixed(1)}" height="${size * 1.6}"/></clipPath>
      <rect x="${x0 - 22}" y="${y - size * 0.86}" width="7" height="${size * 1.02}" fill="${o.color || C.ochre}"
        transform="translate(0 ${(1 - p) * 20})" opacity="${p}"/>
      <g clip-path="url(#${cid})">
        <text x="${x0}" y="${y}" font-family="${F.label}" font-weight="${o.weight || 600}" font-size="${size}"
          fill="${o.fill || C.white}" style="letter-spacing:${sp}px" stroke="${o.stroke || (o.fill === C.ink ? 'rgba(244,231,201,0.85)' : 'rgba(0,0,0,0.55)')}" stroke-width="${size * 0.1}"
          paint-order="stroke">${esc(text)}</text>
      </g>${sub}</g>`;
  }

  // Map pin with drop + ripple
  function pin(x, y, t, a, o = {}) {
    const p = prog(t, a, a + 0.5);
    if (p <= 0) return '';
    const drop = eBack(p);
    const col = o.color || C.red;
    const yy = y - (1 - drop) * 160;
    let rings = '';
    for (let k = 0; k < 3; k++) {
      const rp = ((t - a - 0.35 - k * 0.55) % 1.8) / 1.8;
      if (t - a - 0.35 - k * 0.55 < 0) continue;
      rings += `<ellipse cx="${x}" cy="${y}" rx="${10 + rp * 80}" ry="${4 + rp * 30}" fill="none" stroke="${col}"
        stroke-width="3" opacity="${((1 - rp) * 0.8).toFixed(3)}"/>`;
    }
    return `${rings}
      <ellipse cx="${x}" cy="${y + 2}" rx="${14 * drop}" ry="${5 * drop}" fill="rgba(0,0,0,0.45)"/>
      <g transform="translate(${x} ${yy.toFixed(1)}) scale(${o.scale || 1})">
        <path d="M0 0 C -8 -18 -26 -30 -26 -52 A 26 26 0 1 1 26 -52 C 26 -30 8 -18 0 0 Z" fill="${col}" stroke="${C.ink}" stroke-width="3"/>
        <circle cx="0" cy="-52" r="10" fill="${C.parchment}"/>
      </g>`;
  }

  // Rough ink stamp (slam from 1.8x)
  function stamp(x, y, text, t, a, o = {}) {
    const p = prog(t, a, a + 0.28);
    if (p <= 0) return '';
    const out = o.out != null ? 1 - prog(t, o.out, o.out + 0.4) : 1;
    const s = lerp(1.9, 1, eOut(p));
    const size = o.size || 84;
    const font = `${size}px Anton`;
    const sp = size * 0.08;
    const w = textW(text, font, sp) + size * 0.7;
    const h = size * 1.35;
    const col = o.color || C.red;
    const shake = p < 1 ? 0 : Math.max(0, 1 - (t - a - 0.28) / 0.25) * Math.sin((t - a) * 90) * 6;
    return `<g transform="translate(${x + shake} ${y}) rotate(${o.rot || -8}) scale(${s})" opacity="${(Math.min(1, p * 2.5) * out * (o.opacity || 0.92)).toFixed(3)}"
        filter="url(#rough)">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="10" fill="none" stroke="${col}" stroke-width="${size * 0.09}"/>
      <rect x="${-w / 2 + 12}" y="${-h / 2 + 12}" width="${w - 24}" height="${h - 24}" rx="6" fill="none" stroke="${col}" stroke-width="${size * 0.03}"/>
      <text x="0" y="${size * 0.36}" text-anchor="middle" font-family="${F.display}" font-size="${size}" fill="${col}"
        style="letter-spacing:${sp}px">${esc(text)}</text>
      ${o.sub ? `<text x="0" y="${size * 0.36 + size * 0.5}" text-anchor="middle" font-family="${F.label}" font-weight="600" font-size="${size * 0.26}" fill="${col}" style="letter-spacing:4px">${esc(o.sub)}</text>` : ''}
    </g>`;
  }

  // Polyline helpers (for route traces)
  function polyLen(pts) {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return L;
  }
  function pointAt(pts, d) {
    for (let i = 1; i < pts.length; i++) {
      const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (d <= seg) {
        const u = seg ? d / seg : 0;
        return [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])];
      }
      d -= seg;
    }
    const n = pts.length - 1;
    return [pts[n][0], pts[n][1], Math.atan2(pts[n][1] - pts[n - 1][1], pts[n][0] - pts[n - 1][0])];
  }
  // Catmull-Rom smoothing → dense polyline
  function smooth(pts, steps = 10) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < steps; k++) {
        const u = k / steps;
        const u2 = u * u;
        const u3 = u2 * u;
        out.push([0, 1].map((j) =>
          0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3)
        ));
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  const dStr = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

  // Animated route: dashed ink trail + footprints + walker head
  function route(pts, p, o = {}) {
    if (p <= 0) return '';
    const L = polyLen(pts);
    const d = L * p;
    const col = o.color || C.red;
    let feet = '';
    const step = o.step || 34;
    for (let s = step, k = 0; s < d; s += step, k++) {
      const [fx, fy, ang] = pointAt(pts, s);
      const side = k % 2 ? 1 : -1;
      const nx = -Math.sin(ang) * 9 * side;
      const ny = Math.cos(ang) * 9 * side;
      const age = clamp((d - s) / (L * 0.5), 0, 1);
      feet += `<ellipse cx="${(fx + nx).toFixed(1)}" cy="${(fy + ny).toFixed(1)}" rx="7" ry="4.2"
        transform="rotate(${((ang * 180) / Math.PI).toFixed(1)} ${(fx + nx).toFixed(1)} ${(fy + ny).toFixed(1)})"
        fill="${col}" opacity="${(0.95 - age * 0.45).toFixed(2)}"/>`;
    }
    const [hx, hy] = pointAt(pts, d);
    return `<path d="${dStr(pts)}" fill="none" stroke="${C.ink}" stroke-opacity="0.35" stroke-width="10" stroke-linecap="round"
        stroke-dasharray="${d.toFixed(1)} ${(L + 10).toFixed(1)}"/>
      <path d="${dStr(pts)}" fill="none" stroke="${col}" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"
        opacity="0.8"/>
      ${feet}
      ${o.head === false ? '' : `<circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="13" fill="${C.parchment}" stroke="${col}" stroke-width="5"/>
      <circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="${(22 + 8 * Math.sin(p * 40)).toFixed(1)}" fill="none" stroke="${C.parchment}" stroke-width="2" opacity="0.6"/>`}`;
  }

  // Floating dust / pollen motes
  function motes(t, n, o = {}) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const sp = 12 + rnd(i) * 30;
      const x = (rnd(i + 11) * W + Math.sin(t * 0.4 + i) * 30 + t * sp * (o.dx || 0.6)) % W;
      const y = (rnd(i + 37) * H - t * sp * (o.dy || 1) + H * 4) % H;
      const r = 1.2 + rnd(i + 5) * 3.2;
      const a = 0.2 + 0.4 * (0.5 + 0.5 * Math.sin(t * 1.3 + i * 2.1));
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${o.color || '#FFE7B0'}" opacity="${(a * (o.alpha || 1)).toFixed(3)}"/>`;
    }
    return s;
  }

  // Height ruler (feet), grows to 6'6"
  function ruler(x, yFoot, yHead, t, a, o = {}) {
    const p = eOut(prog(t, a, a + 1.1));
    if (p <= 0) return '';
    const out = o.out != null ? 1 - prog(t, o.out, o.out + 0.4) : 1;
    const per = (yFoot - yHead) / 6.5; // px per foot
    const topY = yFoot - (yFoot - yHead) * p;
    let ticks = '';
    for (let f = 0; f <= 6.5 + 1e-6; f += 0.5) {
      const ty = yFoot - f * per;
      if (ty < topY - 1) break;
      const major = Math.abs(f - Math.round(f)) < 1e-6;
      ticks += `<line x1="${x}" y1="${ty.toFixed(1)}" x2="${x + (major ? 34 : 18)}" y2="${ty.toFixed(1)}" stroke="${C.parchment}" stroke-width="${major ? 3 : 2}"/>`;
      if (major && f > 0) ticks += `<text x="${x + 44}" y="${(ty + 9).toFixed(1)}" font-family="${F.label}" font-weight="500" font-size="24" fill="${C.parchment}" opacity="0.85">${f}′</text>`;
    }
    const fin = eBack(prog(t, a + 1.0, a + 1.45));
    const readout = fin > 0
      ? `<g transform="translate(${x + 4} ${yHead - 34}) scale(${fin.toFixed(3)})">
          <text x="0" y="0" font-family="${F.display}" font-size="92" fill="${C.ochre}" stroke="${C.ink}" stroke-width="7" paint-order="stroke">6′6″</text>
          <text x="4" y="40" font-family="${F.label}" font-weight="600" font-size="28" fill="${C.parchment}" style="letter-spacing:4px" stroke="${C.ink}" stroke-width="4" paint-order="stroke">≈ 198 CM</text>
        </g>`
      : '';
    return `<g opacity="${out.toFixed(3)}">
      <line x1="${x}" y1="${yFoot}" x2="${x}" y2="${topY.toFixed(1)}" stroke="${C.parchment}" stroke-width="4"/>
      ${ticks}
      <line x1="${x - 10}" y1="${topY.toFixed(1)}" x2="${x + 90}" y2="${topY.toFixed(1)}" stroke="${C.ochre}" stroke-width="5"/>
      ${readout}</g>`;
  }

  // Self-fade for incoming scenes (engine draws the next scene on top → true crossfade)
  function fadeIn(svg, local, d = 0.32) {
    const a = eIO(clamp(local / d, 0, 1));
    return a >= 1 ? svg : `<g opacity="${a.toFixed(3)}">${svg}</g>`;
  }

  // =====================================================================
  // Beat 1 — Hook + portrait (0 → 10.35)
  // =====================================================================
  const HOOK_END = 2.35;
  function hookLockup(t, alpha = 1, intro = false) {
    // intro=false → fully formed on frame 1 (thumbnail frame)
    const out = intro ? 1 : 1 - eIO(prog(t, HOOK_END, HOOK_END + 0.45));
    const a = alpha * out;
    if (a <= 0) return '';
    const lift = intro ? 0 : -eIO(prog(t, HOOK_END, HOOK_END + 0.45)) * 60;
    const breathe = 1 + 0.012 * Math.sin(t * 2.2);
    const cy = 1050 + lift;
    const w1 = textW('BUCKLEY’S', '150px Anton', 6);
    return `<g opacity="${a.toFixed(3)}" transform="translate(540 ${cy}) scale(${breathe.toFixed(4)}) translate(-540 ${-cy})">
      <line x1="${540 - w1 / 2}" y1="${cy - 210}" x2="${540 + w1 / 2}" y2="${cy - 210}" stroke="${C.ochre}" stroke-width="3"/>
      <text x="540" y="${cy - 234}" text-anchor="middle" font-family="${F.label}" font-weight="600" font-size="30" fill="${C.parchment}" style="letter-spacing:12px">AN AUSSIE PHRASE</text>
      <text x="540" y="${cy - 60}" text-anchor="middle" font-family="${F.display}" font-size="150" fill="${C.white}" style="letter-spacing:6px"
        stroke="${C.ink}" stroke-width="10" paint-order="stroke">BUCKLEY’S</text>
      <text x="540" y="${cy + 130}" text-anchor="middle" font-family="${F.display}" font-size="196" fill="${C.ochre}" style="letter-spacing:10px"
        stroke="${C.ink}" stroke-width="12" paint-order="stroke">CHANCE</text>
      <line x1="${540 - w1 / 2}" y1="${cy + 166}" x2="${540 + w1 / 2}" y2="${cy + 166}" stroke="${C.ochre}" stroke-width="3"/>
    </g>`;
  }

  function portraitCover(t, zoom, sy, dim) {
    return cover('portrait', { fx: 1140, fy: 880, sx: 540, sy, zoom, dim, filter: 'warm' });
  }

  function beatHook(t, local) {
    // push-in; darken while he "walks into the bush"; revive on his name
    const zoom = 1.02 + 0.22 * eIO(prog(t, 0, 10.4));
    const sy = lerp(640, 600, prog(t, 0, 10));
    const vanish = eIO(prog(t, 3.0, 6.4)) * (1 - eIO(prog(t, 7.5, 8.3)));
    const dim = 0.18 + 0.55 * vanish;
    const base = portraitCover(t, zoom, sy, dim);
    const [, headTop] = base.map(1140, 290);

    // Year chip 1803 (lands with the first word)
    const yp = eBack(prog(t, 0.22, 0.6));
    const yOut = 1 - prog(t, 7.2, 7.6);
    const year = yp > 0
      ? `<g transform="translate(540 236) scale(${yp.toFixed(3)})" opacity="${yOut.toFixed(3)}">
          <text x="0" y="0" text-anchor="middle" font-family="${F.display}" font-size="120" fill="${C.parchment}" style="letter-spacing:14px"
            stroke="${C.ink}" stroke-width="8" paint-order="stroke">1803</text>
          <line x1="-150" y1="26" x2="150" y2="26" stroke="${C.ochre}" stroke-width="4"/>
        </g>`
      : '';

    // Eucalypt shadow sweep as he vanishes into the bush
    const leaves = vanish > 0.01
      ? `<g opacity="${(vanish * 0.75).toFixed(3)}">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const x = -200 + i * 180 + Math.sin(t * 0.6 + i) * 30 + (t - 3) * 40;
          const y = 180 + rnd(i + 3) * 1000;
          const r = 20 + rnd(i) * 30;
          return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(r * 4).toFixed(1)}" ry="${r.toFixed(1)}" fill="#0b0703"
            transform="rotate(${(-30 + rnd(i + 9) * 60).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" filter="url(#soft)"/>`;
        }).join('')}</g>`
      : '';

    const missing = stamp(540, 1000, 'MISSING', t, 6.55, { rot: -9, size: 118, out: 7.55 });

    const name = tag(540, 1128, 'WILLIAM BUCKLEY', t, 7.78, {
      size: 62, align: 'center', weight: 700, spacing: 8, sub: 'later portrait · State Library Victoria', out: 10.1,
    });
    const r = ruler(96, 1188, Math.max(260, headTop), t, 8.8, { out: 10.1 });

    // frame 1 must be fully formed (thumbnail / loop target) — no fade-in here
    return base.svg + leaves + scrims(0.6, 0.55) + motes(t, 26, { alpha: 0.6 }) + year + hookLockup(t) + missing + name + r;
  }

  // =====================================================================
  // Beat 2 — 1803 chart: Sullivan Bay → around the bay (10.35 → 16.95)
  // =====================================================================
  // Route (chart image px): Sullivan Bay anchorage → east shore → head of bay → west shore → Bellarine
  const ROUTE_IMG = smooth([
    [612, 1165], [700, 1172], [800, 1160], [880, 1120], [980, 1000], [1070, 860], [1130, 700], [1150, 580],
    [1080, 420], [960, 320], [820, 300], [700, 360], [600, 470], [535, 600], [520, 720], [505, 830], [470, 900], [410, 960],
  ], 8);

  function chartCam(t, t0, t1) {
    // zoomed on settlement → pull out to whole bay while walking
    const pz = eIO(prog(t, t0, t1));
    return {
      zoom: lerp(1.9, 1.07, pz),
      fx: lerp(640, 805, pz),
      fy: lerp(1150, 735, pz),
      sy: lerp(900, 690, pz),
    };
  }

  function beatChart(t, local) {
    const cam = chartCam(t, 11.5, 13.4);
    const base = cover('chart', { ...cam, sx: 540, dim: 0.14, filter: 'parch', noClamp: true, bg: '#E6D8BC' });
    const m = base.map;
    const [px, py] = m(612, 1165);
    const walk = eIO(prog(t, 13.65, 16.9));
    const pts = ROUTE_IMG.map(([x, y]) => m(x, y));
    const [bx, by] = m(820, 700);

    // settlement pin + FAILED cross
    const cross = eOut(prog(t, 11.05, 11.45));
    const crossSvg = cross > 0
      ? `<g transform="translate(${px} ${py - 52})" opacity="${(1 - prog(t, 13.6, 14.0)).toFixed(3)}">
          <line x1="-40" y1="-40" x2="${-40 + 80 * cross}" y2="${-40 + 80 * cross}" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>
          <line x1="40" y1="-40" x2="${40 - 80 * clamp(cross * 1.4 - 0.4, 0, 1)}" y2="${-40 + 80 * clamp(cross * 1.4 - 0.4, 0, 1)}" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>
        </g>`
      : '';

    // tally marks for days walked (weeks, unspoken count)
    const days = Math.floor(walk * 42);
    let tally = '';
    for (let i = 0; i < days; i++) {
      const g = Math.floor(i / 5);
      const k = i % 5;
      const gx = 64 + (g % 9) * 62;
      const gy = 262;
      if (k < 4) tally += `<line x1="${gx + k * 11}" y1="${gy}" x2="${gx + k * 11 + 2}" y2="${gy + 44}" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>`;
      else tally += `<line x1="${gx - 6}" y1="${gy + 34}" x2="${gx + 44}" y2="${gy + 8}" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/>`;
    }

    return fadeIn(
      base.svg +
      `<rect width="${W}" height="${H}" fill="url(#vig)" opacity="0.7"/>` +
      pin(px, py, t, 10.95) + crossSvg +
      tag(px + 46, py - 96, 'SULLIVAN BAY', t, 11.0, { size: 40, fill: C.ink, out: 12.7 }) +
      tag(bx - 210, by, 'PORT PHILLIP BAY', t, 12.6, { size: 46, fill: C.ink, weight: 700 }) +
      route(pts, walk, { color: C.red }) +
      (days ? `<g opacity="${(1 - prog(t, 16.6, 16.95)).toFixed(3)}">${tally}</g>` : '') +
      credit('Admiralty chart of Port Phillip, published 1803', t, 10.5, 13.6),
      local
    );
  }

  // =====================================================================
  // Beat 3 — Wadawurrung Country on the Kulin map (16.95 → 23.0)
  // =====================================================================
  // Wathaurong (= Wadawurrung) region outline, map image px (approximate trace)
  const WADA = [
    [100, 575], [135, 548], [280, 490], [400, 512], [505, 565], [640, 520], [700, 640], [760, 760], [820, 880], [850, 910],
    [800, 950], [735, 1000], [690, 1000], [655, 1015], [700, 1030], [800, 1020], [830, 1080], [790, 1110], [700, 1110],
    [610, 1150], [530, 1200], [480, 1150], [420, 1090], [505, 990], [485, 900], [455, 855], [405, 855], [345, 890],
    [290, 870], [180, 830], [145, 790], [140, 700], [100, 660],
  ];

  function beatMap(t, local) {
    const z = lerp(1.08, 1.24, eIO(prog(t, 16.95, 23.2)));
    const base = cover('kulin', { fx: lerp(560, 480, prog(t, 17, 23)), fy: 840, sx: 540, sy: 780, zoom: z, dim: 0.12, filter: 'mapTone' });
    const m = base.map;
    const poly = WADA.map(([x, y]) => m(x, y));
    const L = polyLen([...poly, poly[0]]);
    const draw = eIO(prog(t, 17.4, 18.9));
    const fill = eOut(prog(t, 18.4, 19.4));
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    const [cx, cy] = m(430, 760);
    const [gx, gy] = m(560, 1030); // Bellarine / Geelong side: where the walker arrives
    const polyD = dStr(poly) + ' Z';

    // Warm welcome ripples at the arrival point (found / taken in)
    let ripples = '';
    const rs = 19.4;
    if (t > rs) {
      for (let k = 0; k < 4; k++) {
        const rp = ((t - rs - k * 0.7) % 2.8) / 2.8;
        if (t - rs - k * 0.7 < 0) continue;
        ripples += `<circle cx="${gx}" cy="${gy}" r="${(20 + rp * 260).toFixed(1)}" fill="none" stroke="${C.ochre}" stroke-width="${(5 - rp * 4).toFixed(2)}" opacity="${((1 - rp) * 0.85).toFixed(3)}"/>`;
      }
    }
    const warm = eOut(prog(t, 19.4, 21));

    return fadeIn(
      base.svg +
      `<rect width="${W}" height="${H}" fill="url(#vig)" opacity="0.85"/>` +
      `<path d="${polyD}" fill="${C.ochre}" fill-opacity="${(fill * (0.32 + 0.08 * pulse)).toFixed(3)}" stroke="none"/>` +
      `<path d="${polyD}" fill="none" stroke="${C.ochre}" stroke-width="7" stroke-linejoin="round"
          stroke-dasharray="${(L * draw).toFixed(1)} ${L.toFixed(1)}" filter="url(#glow)"/>` +
      `<circle cx="${gx}" cy="${gy}" r="${(150 * warm).toFixed(1)}" fill="url(#warmGlow)" opacity="${(0.9 * warm).toFixed(3)}"/>` +
      ripples +
      `<circle cx="${gx}" cy="${gy}" r="13" fill="${C.parchment}" stroke="${C.red}" stroke-width="5" opacity="${eOut(prog(t, 16.95, 17.4)).toFixed(3)}"/>` +
      tag(cx - 250, cy - 220, 'WADAWURRUNG', t, 18.0, {
        size: 78, weight: 700, spacing: 10, fill: C.white, sub: 'Country of the Wadawurrung people · Kulin nation',
      }) +
      credit('Kulin language map · labels “Wathaurong”', t, 17.1),
      local
    );
  }

  // =====================================================================
  // Beat 4 — Wadawurrung Country landscape + 32 YEARS (23.0 → 35.75)
  // =====================================================================
  function icon(kind, s) {
    const st = `fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`;
    switch (kind) {
      case 'language': // speech waves
        return `<path d="M-26 -14 h52 a8 8 0 0 1 8 8 v22 a8 8 0 0 1 -8 8 h-30 l-14 12 v-12 h-8 a8 8 0 0 1 -8 -8 v-22 a8 8 0 0 1 8 -8z" ${st}/>
          <path d="M-14 6 q7 -12 14 0 t14 0" ${st}/>`;
      case 'law': // circle of meeting (people around a centre)
        return `<circle cx="0" cy="0" r="9" ${st}/>${[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2;
          return `<circle cx="${(Math.cos(a) * 26).toFixed(1)}" cy="${(Math.sin(a) * 26).toFixed(1)}" r="5" fill="${C.ink}"/>`;
        }).join('')}`;
      case 'country': // hills + river
        return `<path d="M-32 14 L-12 -12 L0 2 L12 -18 L32 14 Z" ${st}/><path d="M-30 26 q10 -6 20 0 t20 0 t20 0" ${st}/>`;
      case 'family': // three figures
        return [[-20, 1], [0, 1.2], [20, 0.8]].map(([x, k]) =>
          `<circle cx="${x}" cy="${-14 * k}" r="${6 * k}" fill="${C.ink}"/><path d="M${x - 9 * k} ${22} q${9 * k} ${-30 * k} ${18 * k} 0" ${st}/>`
        ).join('');
      default:
        return '';
    }
  }

  function beatCountry(t, local) {
    const pan = eIO(prog(t, 23.0, 35.9));
    const base = cover('yangs', { fx: lerp(560, 1250, pan), fy: 362, sx: 540, sy: 960, zoom: 1.0 + 0.04 * pan, dim: 0.16, filter: 'golden' });
    // light leak sweep on "took him in"
    const leak = prog(t, 25.3, 27.4);
    const leakSvg = leak > 0 && leak < 1
      ? `<rect x="${(-900 + leak * 2400).toFixed(1)}" y="-200" width="700" height="2400" fill="url(#leak)" opacity="${(Math.sin(leak * Math.PI) * 0.8).toFixed(3)}"
          transform="rotate(14 540 960)"/>`
      : '';

    // 32-year ring
    const ringIn = eBack(prog(t, 28.6, 29.2));
    const ringOut = 1 - eIO(prog(t, 35.1, 35.6));
    const cnt = eIO(prog(t, 28.9, 29.78));
    const year = Math.round(lerp(1803, 1835, cnt));
    const R = 230;
    const cx = 540;
    const cy = 700;
    const circ = 2 * Math.PI * R;
    let ticks = '';
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2 - Math.PI / 2;
      const lit = i < cnt * 32;
      ticks += `<line x1="${(cx + Math.cos(a) * (R + 18)).toFixed(1)}" y1="${(cy + Math.sin(a) * (R + 18)).toFixed(1)}"
        x2="${(cx + Math.cos(a) * (R + 36)).toFixed(1)}" y2="${(cy + Math.sin(a) * (R + 36)).toFixed(1)}"
        stroke="${lit ? C.ochre : 'rgba(255,248,234,0.35)'}" stroke-width="5" stroke-linecap="round"/>`;
    }
    const land = eBack(prog(t, 29.72, 30.1));
    const icons = [
      ['language', 31.5, -Math.PI / 2 - 0.9],
      ['law', 32.34, -Math.PI / 2 + 0.9],
      ['country', 33.12, Math.PI / 2 + 0.9],
      ['family', 34.42, Math.PI / 2 - 0.9],
    ]
      .map(([k, at, a]) => {
        const p = eBack(prog(t, at, at + 0.35));
        if (p <= 0) return '';
        const ix = cx + Math.cos(a) * (R + 118);
        const iy = cy + Math.sin(a) * (R + 118);
        return `<g transform="translate(${ix.toFixed(1)} ${iy.toFixed(1)}) scale(${p.toFixed(3)})">
          <circle r="58" fill="${C.parchment}" stroke="${C.ochre}" stroke-width="5"/>${icon(k)}</g>`;
      })
      .join('');
    const ring = ringIn > 0
      ? `<g opacity="${ringOut.toFixed(3)}" transform="translate(${cx} ${cy}) scale(${ringIn.toFixed(3)}) translate(${-cx} ${-cy})">
          <circle cx="${cx}" cy="${cy}" r="${R}" fill="rgba(18,11,5,0.62)" stroke="rgba(255,248,234,0.25)" stroke-width="3"/>
          <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.ochre}" stroke-width="12" stroke-linecap="round"
            stroke-dasharray="${(circ * cnt).toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>
          ${ticks}
          <text x="${cx}" y="${cy - 118}" text-anchor="middle" font-family="${F.label}" font-weight="500" font-size="38" fill="${C.parchment}" style="letter-spacing:8px">${year}</text>
          <g transform="translate(${cx} ${cy + 50}) scale(${(0.6 + 0.4 * land).toFixed(3)})">
            <text x="0" y="0" text-anchor="middle" font-family="${F.display}" font-size="150" fill="${land > 0 ? C.ochre : C.white}"
              stroke="${C.ink}" stroke-width="8" paint-order="stroke">${Math.round(cnt * 32)}</text>
          </g>
          <text x="${cx}" y="${cy + 112}" text-anchor="middle" font-family="${F.label}" font-weight="700" font-size="38" fill="${C.white}" style="letter-spacing:14px"
            opacity="${clamp(land, 0, 1).toFixed(3)}">YEARS</text>
        </g>${icons}`
      : '';

    return fadeIn(
      base.svg + leakSvg + scrims(0.6, 0.45) + motes(t, 34, { alpha: 0.9, dy: 0.5, dx: 1.2 }) +
      tag(80, 300, 'WADAWURRUNG COUNTRY', t, 23.4, { size: 48, weight: 700, spacing: 8, out: 28.4 }) +
      ring +
      credit('You Yangs (Wurdi Youang) · present day · BobTanGo, CC BY 4.0', t, 23.3),
      local
    );
  }

  // =====================================================================
  // Beat 5 — 1835 camp at Indented Head (35.75 → 40.35)
  // =====================================================================
  function beatCamp(t, local) {
    const bg = cover('huts', { fx: lerp(1000, 1160, prog(t, 35.75, 40.7)), fy: 520, zoom: 1.05, dim: 0.55, filter: 'blurTone' });
    // Sketch sheet card
    const inP = eOut5(prog(t, 35.75, 36.4));
    const push = eIO(prog(t, 36.2, 40.6));
    const sheetW = 1180;
    const sheetH = (sheetW * 960) / 1800;
    const rot = lerp(-6, -1.5, inP);
    const scale = lerp(0.9, 1, inP) * lerp(1, 1.18, push);
    const cx = lerp(540, 500, push);
    const cy = 610 + (1 - inP) * 140;
    const sx = cx - sheetW / 2;
    const sy = cy - sheetH / 2;
    const toS = (ix, iy) => [sx + (ix / 1800) * sheetW, sy + (iy / 960) * sheetH];
    const [h1x, h1y] = toS(893, 500);
    const [h2x, h2y] = toS(1160, 505);
    const [c1x, c1y] = toS(862, 438);
    const [c2x, c2y] = toS(1128, 446);
    const glow = eOut(prog(t, 39.1, 39.7));
    let smoke = '';
    if (t > 38.8) {
      for (const [x0, y0] of [[c1x, c1y], [c2x, c2y]]) {
        for (let k = 0; k < 6; k++) {
          const ph = ((t - 38.8) * 0.45 + k / 6) % 1;
          smoke += `<circle cx="${(x0 + Math.sin(ph * 6 + k) * 10 + ph * 30).toFixed(1)}" cy="${(y0 - ph * 110).toFixed(1)}" r="${(4 + ph * 16).toFixed(1)}"
            fill="#5a5048" opacity="${(0.4 * (1 - ph) * prog(t, 38.8, 39.6)).toFixed(3)}"/>`;
        }
      }
    }
    // registration corner marks
    const reg = eOut(prog(t, 36.0, 36.6));
    const regMarks = [[sx, sy, 1, 1], [sx + sheetW, sy, -1, 1], [sx, sy + sheetH, 1, -1], [sx + sheetW, sy + sheetH, -1, -1]]
      .map(([x, y, dx, dy]) => `<path d="M${x - dx * 16} ${y + dy * 54 * reg} V${y - dy * 16} H${x + dx * 54 * reg}" fill="none" stroke="${C.ochre}" stroke-width="4"/>`)
      .join('');
    const sheet = `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${scale}) translate(${-cx} ${-cy})" opacity="${inP.toFixed(3)}">
        <rect x="${sx + 14}" y="${sy + 22}" width="${sheetW}" height="${sheetH}" fill="rgba(0,0,0,0.55)" filter="url(#soft)"/>
        <image href="${IM.huts.url}" x="${sx}" y="${sy}" width="${sheetW}" height="${sheetH}" preserveAspectRatio="none" filter="url(#paper)"/>
        ${glow > 0 ? `<circle cx="${h1x}" cy="${h1y}" r="${(70 * glow).toFixed(1)}" fill="url(#warmGlow)" opacity="${(0.75 * glow).toFixed(3)}"/>
          <circle cx="${h2x}" cy="${h2y}" r="${(70 * glow).toFixed(1)}" fill="url(#warmGlow)" opacity="${(0.75 * glow).toFixed(3)}"/>` : ''}
        ${smoke}
        ${regMarks}
      </g>`;

    // Tasmania → Port Phillip schematic crossing (no drawn coastlines)
    const cross = eIO(prog(t, 37.5, 39.0));
    const A = [160, 1150];
    const B = [900, 1050];
    const ctrl = [520, 1040];
    const q = (u) => [
      (1 - u) * (1 - u) * A[0] + 2 * (1 - u) * u * ctrl[0] + u * u * B[0],
      (1 - u) * (1 - u) * A[1] + 2 * (1 - u) * u * ctrl[1] + u * u * B[1],
    ];
    const arc = [];
    for (let i = 0; i <= 40; i++) arc.push(q((i / 40) * cross));
    const [shx, shy] = q(cross);
    const crossing = cross > 0
      ? `<g opacity="${(1 - prog(t, 40.0, 40.35)).toFixed(3)}">
          <path d="${dStr(arc)}" fill="none" stroke="${C.parchment}" stroke-width="4" stroke-dasharray="14 12"/>
          <circle cx="${A[0]}" cy="${A[1]}" r="10" fill="${C.ochre}"/>
          <circle cx="${B[0]}" cy="${B[1]}" r="${(10 * prog(t, 38.8, 39.1)).toFixed(1)}" fill="${C.ochre}"/>
          <g transform="translate(${shx.toFixed(1)} ${shy.toFixed(1)})">
            <path d="M-22 4 h44 l-8 12 h-28 z" fill="${C.parchment}"/><path d="M0 2 v-34 l18 26 z" fill="${C.parchment}"/>
          </g>
        </g>`
      : '';

    return fadeIn(
      bg.svg + scrims(0.5, 0.3) + sheet +
      stamp(810, 350, '1835', t, 36.05, { rot: 7, size: 104 }) +
      tag(A[0] - 40, A[1] + 62, 'TASMANIA', t, 37.64, { size: 40, weight: 700, out: 40.0 }) +
      tag(B[0] - 330, B[1] + 62, 'PORT PHILLIP', t, 38.9, { size: 40, weight: 700, out: 40.0 }) +
      crossing +
      credit('J. H. Wedge, Indented Head huts, sketch, August 1835', t, 35.9),
      local
    );
  }

  // =====================================================================
  // Beat 6 — Woodhouse 1861: the settlers meet Buckley (40.35 → 47.55)
  // =====================================================================
  const BUCK = { x: 1545, y: 690, top: 480, foot: 885 }; // painting px

  function woodCam(t) {
    // settle on settlers, then whip-pan right to Buckley on "huge"
    const whip = eIO(prog(t, 40.45, 41.05));
    const push = eIO(prog(t, 41.0, 47.8));
    return {
      fx: lerp(900, BUCK.x - 40, whip),
      fy: lerp(700, BUCK.y, whip),
      zoom: lerp(1.05, 1.28, whip) + 0.1 * push,
      sy: 800,
    };
  }

  function beatContact(t, local) {
    const cam = woodCam(t);
    const blur = prog(t, 40.45, 40.75) * (1 - prog(t, 40.75, 41.05));
    const base = cover('woodhouse', { ...cam, sx: 540, dim: 0.1, filter: blur > 0.05 ? 'motion' : 'oil' });
    const m = base.map;
    const [bx, bTop] = m(BUCK.x, BUCK.top);
    const [, bFoot] = m(BUCK.x, BUCK.foot);
    const spot = eOut(prog(t, 40.9, 41.6));
    const sid = id('sp');
    const spotSvg = spot > 0
      ? `<radialGradient id="${sid}" cx="${bx}" cy="${(bTop + bFoot) / 2}" r="${(560 - 120 * spot).toFixed(1)}" gradientUnits="userSpaceOnUse">
          <stop offset="0.35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${(0.72 * spot).toFixed(3)}"/>
        </radialGradient><rect width="${W}" height="${H}" fill="url(#${sid})"/>`
      : '';
    // sunburnt rim glow
    const sun = eOut(prog(t, 41.0, 41.8));
    const sunSvg = sun > 0
      ? `<ellipse cx="${bx}" cy="${(bTop + bFoot) / 2 - 40}" rx="${150 + 10 * Math.sin(t * 2)}" ry="${(bFoot - bTop) / 2 + 60}" fill="url(#sunGlow)" opacity="${(0.55 * sun).toFixed(3)}"
          style="mix-blend-mode:screen"/>`
      : '';
    // height brackets (echo of the ruler motif)
    const br = eOut(prog(t, 41.2, 41.9));
    const bxL = bx - 190;
    const brSvg = br > 0
      ? `<g opacity="${(br * (1 - prog(t, 46.9, 47.4))).toFixed(3)}">
          <line x1="${bxL}" y1="${bTop}" x2="${bxL}" y2="${lerp(bTop, bFoot, br)}" stroke="${C.parchment}" stroke-width="4"/>
          <line x1="${bxL - 16}" y1="${bTop}" x2="${bxL + 30}" y2="${bTop}" stroke="${C.ochre}" stroke-width="5"/>
          <line x1="${bxL - 16}" y1="${lerp(bTop, bFoot, br)}" x2="${bxL + 30}" y2="${lerp(bTop, bFoot, br)}" stroke="${C.ochre}" stroke-width="5"/>
          <text x="${bxL - 26}" y="${(bTop + bFoot) / 2}" text-anchor="end" font-family="${F.display}" font-size="64" fill="${C.ochre}"
            stroke="${C.ink}" stroke-width="6" paint-order="stroke" opacity="${eOut(prog(t, 41.6, 42.0))}">6′6″</text>
        </g>`
      : '';

    return fadeIn(
      base.svg + spotSvg + sunSvg + scrims(0.55, 0.3) + brSvg +
      tag(bxL - 330, bTop - 70, 'WILLIAM BUCKLEY', t, 41.82, { size: 50, weight: 700, spacing: 6, out: 47.2 }) +
      tag(80, 300, '1835', t, 40.6, { size: 56, weight: 700, spacing: 10, out: 41.7 }) +
      credit('F. W. Woodhouse, The first settlers discover Buckley, 1861', t, 40.6),
      local
    );
  }

  // =====================================================================
  // Beat 7 — The phrase (47.55 → 54.0)
  // =====================================================================
  function beatPhrase(t, local) {
    const z = lerp(2.0, 2.3, eIO(prog(t, 47.55, 54.3)));
    const base = cover('woodhouse', { fx: 1560, fy: 600, sx: 540, sy: 1000, zoom: z, dim: 0.5, filter: 'oil' });
    const tagP = eOut(prog(t, 48.84, 49.3));
    // hand-lettered "Buckley’s" draws on (clip wipe), then CHANCE slams
    const w1 = eIO(prog(t, 49.5, 50.3));
    const cid = id('ph');
    const slam = eBack(prog(t, 50.36, 50.7));
    const swash = eIO(prog(t, 50.6, 51.3));
    const glint = prog(t, 51.3, 52.2);
    const cy = 560;
    const outP = 1 - eIO(prog(t, 53.6, 54.0));
    const lock = `<g opacity="${outP.toFixed(3)}">
      <g opacity="${tagP.toFixed(3)}" transform="translate(0 ${(1 - tagP) * 14})">
        <rect x="${540 - 170}" y="${cy - 300}" width="340" height="56" rx="28" fill="none" stroke="${C.ochre}" stroke-width="3"/>
        <text x="540" y="${cy - 262}" text-anchor="middle" font-family="${F.label}" font-weight="600" font-size="28" fill="${C.ochre}" style="letter-spacing:10px">AUSSIE PHRASE</text>
      </g>
      <clipPath id="${cid}"><rect x="${120}" y="${cy - 230}" width="${(860 * w1).toFixed(1)}" height="200"/></clipPath>
      <g clip-path="url(#${cid})">
        <text x="540" y="${cy - 70}" text-anchor="middle" font-family="${F.serif}" font-style="italic" font-weight="700" font-size="150"
          fill="${C.parchment}" stroke="${C.ink}" stroke-width="8" paint-order="stroke">Buckley’s</text>
      </g>
      ${slam > 0 ? `<g transform="translate(540 ${cy + 120}) scale(${slam.toFixed(3)})">
          <text x="0" y="0" text-anchor="middle" font-family="${F.display}" font-size="210" fill="${C.ochre}" style="letter-spacing:14px"
            stroke="${C.ink}" stroke-width="12" paint-order="stroke">CHANCE</text>
        </g>` : ''}
      <path d="M180 ${cy + 172} C 380 ${cy + 150}, 700 ${cy + 200}, 900 ${cy + 158}" fill="none" stroke="${C.red}" stroke-width="9" stroke-linecap="round"
        stroke-dasharray="${(780 * swash).toFixed(1)} 900"/>
      ${glint > 0 && glint < 1 ? `<rect x="${(120 + glint * 900).toFixed(1)}" y="${cy - 40}" width="60" height="240" fill="url(#glint)" transform="skewX(-18)" opacity="0.8"/>` : ''}
    </g>`;
    return fadeIn(base.svg + scrims(0.5, 0.35) + motes(t, 18, { alpha: 0.7 }) + lock, local);
  }

  // =====================================================================
  // Beat 8 — Loop: back to 1803, the odds (54.0 → end), fade into frame 1
  // =====================================================================
  function beatLoop(t, local) {
    const pull = eIO(prog(t, 54.0, 57.2));
    const base = cover('chart', {
      fx: lerp(805, 640, pull), fy: lerp(735, 1120, pull), sx: 540, sy: lerp(712, 1180, pull), zoom: lerp(1.0, 1.7, pull),
      dim: 0.3, filter: 'parch', noClamp: true, bg: '#E6D8BC',
    });
    const m = base.map;
    // route rewinds to the settlement
    const back = 1 - eIO(prog(t, 54.0, 55.0));
    const pts = ROUTE_IMG.map(([x, y]) => m(x, y));
    // odds gauge
    const gIn = eBack(prog(t, 54.8, 55.3));
    const needleP = prog(t, 55.2, 56.85);
    const wob = Math.sin(t * 9) * 0.06 * (1 - needleP);
    const val = t < 56.8 ? lerp(0.62, 0.08, eIO(needleP)) + wob : Math.max(0, 0.08 * Math.exp(-(t - 56.8) * 14) * Math.cos((t - 56.8) * 40));
    const gx = 540;
    const gy = 1010;
    const R = 280;
    const ang = Math.PI + val * Math.PI; // left (0) → right (1)
    const hit = t >= 56.8 ? Math.max(0, 1 - (t - 56.8) / 0.3) : 0;
    let tk = '';
    for (let i = 0; i <= 20; i++) {
      const a = Math.PI + (i / 20) * Math.PI;
      const L = i % 5 === 0 ? 34 : 18;
      tk += `<line x1="${(gx + Math.cos(a) * R).toFixed(1)}" y1="${(gy + Math.sin(a) * R).toFixed(1)}" x2="${(gx + Math.cos(a) * (R - L)).toFixed(1)}" y2="${(gy + Math.sin(a) * (R - L)).toFixed(1)}"
        stroke="${C.ink}" stroke-width="${i % 5 ? 3 : 5}"/>`;
    }
    const arcD = `M${gx - R} ${gy} A ${R} ${R} 0 0 1 ${gx + R} ${gy}`;
    const gauge = gIn > 0
      ? `<g transform="translate(${gx + hit * Math.sin(t * 80) * 10} ${gy}) scale(${gIn.toFixed(3)}) translate(${-gx} ${-gy})" opacity="${(1 - prog(t, 57.05, 57.4)).toFixed(3)}">
          <path d="${arcD} Z" fill="rgba(244,231,201,0.92)" stroke="${C.ink}" stroke-width="6"/>
          <path d="M${gx - R + 26} ${gy} A ${R - 26} ${R - 26} 0 0 1 ${gx - (R - 26) * Math.cos(Math.PI * 0.2)} ${gy - (R - 26) * Math.sin(Math.PI * 0.2)}"
            fill="none" stroke="${C.red}" stroke-width="18"/>
          ${tk}
          <text x="${gx - R + 50}" y="${gy - 18}" font-family="${F.label}" font-weight="700" font-size="30" fill="${C.ink}">0</text>
          <text x="${gx + R - 50}" y="${gy - 18}" text-anchor="end" font-family="${F.label}" font-weight="700" font-size="30" fill="${C.ink}">100</text>
          <text x="${gx}" y="${gy - 120}" text-anchor="middle" font-family="${F.label}" font-weight="700" font-size="30" fill="${C.ink}" style="letter-spacing:8px">ODDS · 1803</text>
          <line x1="${gx}" y1="${gy}" x2="${(gx + Math.cos(ang) * (R - 40)).toFixed(1)}" y2="${(gy + Math.sin(ang) * (R - 40)).toFixed(1)}"
            stroke="${C.red}" stroke-width="9" stroke-linecap="round"/>
          <circle cx="${gx}" cy="${gy}" r="20" fill="${C.ink}"/>
          ${t >= 56.8 ? `<text x="${gx}" y="${gy + 96}" text-anchor="middle" font-family="${F.display}" font-size="${(92 * (1 + hit * 0.4)).toFixed(1)}" fill="${C.red}"
            stroke="${C.parchment}" stroke-width="6" paint-order="stroke">0%</text>` : ''}
        </g>`
      : '';
    // loop: portrait + hook bloom back in over the final ~0.4 s (matches frame 1)
    const loopA = eIO(prog(t, 57.0, DUR));
    const loop = loopA > 0
      ? `<g opacity="${loopA.toFixed(3)}">${portraitCover(0, 1.02, 640, 0.18).svg}${scrims(0.6, 0.55)}${hookLockup(0, 1, true)}</g>`
      : '';
    return fadeIn(
      base.svg + `<rect width="${W}" height="${H}" fill="url(#vig)" opacity="0.8"/>` +
      route(pts, back, { color: C.red }) +
      tag(80, 300, '1803', t, 54.9, { size: 64, weight: 700, spacing: 12, fill: C.ink, out: 57.0 }) +
      gauge + loop,
      local,
      0.25
    );
  }

  // =====================================================================
  // Globals: defs (first) + grain/vignette (last)
  // =====================================================================
  function defs(t) {
    uid = 0;
    return `<defs>
      <linearGradient id="gTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.85"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
      <linearGradient id="gLow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="0.55" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0.8"/></linearGradient>
      <radialGradient id="vig" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="#1a0f05" stop-opacity="0"/><stop offset="1" stop-color="#1a0f05" stop-opacity="0.85"/></radialGradient>
      <radialGradient id="warmGlow"><stop offset="0" stop-color="#FFD58A" stop-opacity="0.95"/><stop offset="0.5" stop-color="#E9B04B" stop-opacity="0.35"/><stop offset="1" stop-color="#E9B04B" stop-opacity="0"/></radialGradient>
      <radialGradient id="sunGlow"><stop offset="0" stop-color="#FF9A4A" stop-opacity="0.8"/><stop offset="0.6" stop-color="#E9602B" stop-opacity="0.25"/><stop offset="1" stop-color="#E9602B" stop-opacity="0"/></radialGradient>
      <linearGradient id="leak" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFC56B" stop-opacity="0"/><stop offset="0.5" stop-color="#FFD9A0" stop-opacity="0.7"/><stop offset="1" stop-color="#FFC56B" stop-opacity="0"/></linearGradient>
      <linearGradient id="glint" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <filter id="warm" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1.08 0.05 0 0 0.01  0.02 1.0 0 0 0  0 0 0.88 0 0  0 0 0 1 0"/></filter>
      <filter id="oil" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1.05 0.04 0 0 0  0.02 1.0 0 0 0  0 0.02 0.9 0 0  0 0 0 1 0"/></filter>
      <filter id="parch" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1.02 0.06 0 0 0.0  0.02 0.98 0.02 0 -0.01  0 0.04 0.84 0 -0.03  0 0 0 1 0"/></filter>
      <filter id="mapTone" color-interpolation-filters="sRGB">
        <feColorMatrix type="saturate" values="0.12"/>
        <feColorMatrix type="matrix" values="0.95 0.1 0.05 0 0.02  0.85 0.1 0.05 0 0.0  0.62 0.1 0.05 0 -0.05  0 0 0 1 0"/>
      </filter>
      <filter id="golden" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1.12 0.06 0 0 0.02  0.03 1.02 0 0 0.0  0 0 0.8 0 -0.01  0 0 0 1 0"/></filter>
      <filter id="blurTone" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="5"/><feColorMatrix type="matrix" values="0.95 0.1 0 0 0.02  0.8 0.15 0 0 -0.02  0.55 0.1 0.05 0 -0.08  0 0 0 1 0"/></filter>
      <filter id="paper" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.98 0.04 0 0 0.02  0.02 0.94 0 0 0.0  0 0 0.82 0 -0.02  0 0 0 1 0"/></filter>
      <filter id="motion" x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation="28 0"/></filter>
      <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="rough" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" result="d"/>
        <feComponentTransfer in="n" result="m"><feFuncA type="discrete" tableValues="1 1 0.55 1 1 0.4 1 1"/></feComponentTransfer>
        <feComposite in="d" in2="m" operator="in"/>
      </filter>
      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="${Math.floor(t * 30) % 97}" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
    </defs>`;
  }

  function finish(t) {
    // film grain + flicker (subtle)
    const fl = 0.035 + 0.02 * rnd(Math.floor(t * 30));
    return `<rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.07" style="mix-blend-mode:overlay"/>
      <rect width="${W}" height="${H}" fill="#000" opacity="${fl.toFixed(3)}"/>`;
  }

  // Scene seams: each scene overlaps the next by OV; the incoming scene fades itself in on top.
  const OV = 0.32;
  const beats = [
    [0, 10.35, beatHook],
    [10.35, 16.95, beatChart],
    [16.95, 23.0, beatMap],
    [23.0, 35.75, beatCountry],
    [35.75, 40.35, beatCamp],
    [40.35, 47.55, beatContact],
    [47.55, 54.0, beatPhrase],
    [54.0, DUR, beatLoop],
  ];
  const scenes = [{ id: 'defs', start: 0, end: DUR + 1, draw: (t) => defs(t) }];
  beats.forEach(([s, e, fn], i) => {
    scenes.push({ id: fn.name, start: s, end: i === beats.length - 1 ? DUR + 1 : e + OV, draw: fn });
  });
  scenes.push({ id: 'finish', start: 0, end: DUR + 1, draw: (t) => finish(t) });

  window.EPISODE = {
    duration: DUR,
    fps: 30,
    ready,
    words: [],
    scenes,
    _bandTop: BAND_TOP,
  };
})();
