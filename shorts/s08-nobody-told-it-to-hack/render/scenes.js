/* s08-nobody-told-it-to-hack — photo underlay + SVG motion graphics (Skylab bar).
   Every beat: full-bleed factual still + designed MG overlay. Timing from transcript.json.
   On-screen text: frame-1 hook, names / places / key facts only (see fact-check.md).
   No Remotion. Captions are drawn here (lower-middle band, active-word highlight). */
(function () {
  const HS = window.HS;
  const { W, H, clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic } = HS;

  const SANS = "'Liberation Sans', Arial, Helvetica, sans-serif";
  const MONO = "'DejaVu Sans Mono', 'Liberation Mono', monospace";
  const C = {
    cyan: '#3fe6ff',
    red: '#ff3348',
    amber: '#ffc23d',
    green: '#3dffa2',
    white: '#f2f6ff',
    ink: '#060a13',
  };
  const CAP_Y = 1344; // ~70% — lower-middle caption band

  const IMG = {
    padlock: { url: '/img/s08_01_cybersecurity_padlock.png', w: 1920, h: 1080 },
    neural: { url: '/img/s08_02_neural_network.png', w: 1920, h: 2560 },
    lock: { url: '/img/s08_03_electronic_lock.jpg', w: 1280, h: 811 },
    racks: { url: '/img/s08_04_server_racks.jpg', w: 1920, h: 1275 },
    arms: { url: '/img/s08_05_coat_of_arms.png', w: 1600, h: 1240 },
    wires: { url: '/img/s08_06_server_wires.jpg', w: 1920, h: 1280 },
    pm: { url: '/img/s08_07_albanese_portrait.jpg', w: 1920, h: 2369 },
    parliament: { url: '/img/s08_08_parliament_house.jpg', w: 1920, h: 1288 },
  };

  // ---------- small utils ----------
  const ramp = (x, a, b) => clamp((x - a) / (b - a), 0, 1);
  const env = (x, a, b, fin = 0.2, fout = 0.25) => Math.min(ramp(x, a, a + fin), 1 - ramp(x, b - fout, b));
  function rnd(n) {
    const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
    return s - Math.floor(s);
  }
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let UID = 0; // per-frame unique ids for clip paths / masks
  const uid = (p) => `${p}${UID++}`;

  // ---------- photo underlay with exact geometry ----------
  // fit: 'slice' (cover) | 'meet' (contain). focus: [rx, ry] of the image placed at screen centre.
  function photo(img, o = {}) {
    const scale = o.scale ?? 1;
    const base = o.fit === 'meet' ? Math.min(W / img.w, H / img.h) : Math.max(W / img.w, H / img.h);
    const bw = o.boxW ? o.boxW / img.w : base;
    const rw = img.w * bw * scale;
    const rh = img.h * bw * scale;
    const cx = o.cx ?? W / 2;
    const cy = o.cy ?? H / 2;
    const [fx, fy] = o.focus || [0.5, 0.5];
    const x = cx - fx * rw + (o.dx || 0);
    const y = cy - fy * rh + (o.dy || 0);
    const filt = o.filter ? ` filter="url(#${o.filter})"` : '';
    const rot = o.rot ? ` transform="rotate(${o.rot} ${W / 2} ${H / 2})"` : '';
    let svg = `<g${rot} opacity="${o.opacity ?? 1}"><image href="${img.url}" x="${x}" y="${y}" width="${rw}" height="${rh}" preserveAspectRatio="none"${filt}/></g>`;
    if (o.dim) svg += `<rect width="${W}" height="${H}" fill="#03060d" opacity="${o.dim}"/>`;
    return { svg, pt: (rx, ry) => [x + rx * rw, y + ry * rh], x, y, w: rw, h: rh };
  }

  // ---------- MG primitives ----------
  function brackets(x, y, w, h, o = {}) {
    const L = o.len || 36;
    const c = o.color || C.cyan;
    const sw = o.sw || 4;
    const op = o.opacity ?? 1;
    const d = [
      `M${x},${y + L} V${y} H${x + L}`,
      `M${x + w - L},${y} H${x + w} V${y + L}`,
      `M${x + w},${y + h - L} V${y + h} H${x + w - L}`,
      `M${x + L},${y + h} H${x} V${y + h - L}`,
    ].join(' ');
    return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${sw}" opacity="${op}" stroke-linecap="square"/>`;
  }

  // Ink stamp that slams in (scale 2.3 → 1), distressed mask, ink specks at impact.
  function stamp(text, cx, cy, tIn, now, o = {}) {
    const p = now - tIn;
    if (p < 0) return '';
    const color = o.color || C.red;
    const size = o.size || 96;
    const rot = o.rot ?? -8;
    const w = o.w || text.length * size * 0.66 + 70;
    const h = size * 1.32;
    const outA = o.until ? 1 - ramp(now, o.until - 0.25, o.until) : 1;
    if (outA <= 0) return '';
    const k = easeOutCubic(ramp(p, 0, 0.16));
    const bounce = p > 0.16 ? 1 + 0.04 * Math.sin((p - 0.16) * 30) * Math.exp(-(p - 0.16) * 12) : 1;
    const s = lerp(2.3, 1, k) * bounce;
    const op = ramp(p, 0, 0.07) * outA;
    const id = uid('stm');
    let specks = '';
    for (let i = 0; i < 26; i++) {
      const sx = -w / 2 + rnd(i * 3.1 + text.length) * w;
      const sy = -h / 2 + rnd(i * 7.7 + size) * h;
      specks += `<circle cx="${sx}" cy="${sy}" r="${2 + rnd(i * 1.3) * 7}" fill="#000"/>`;
    }
    let burst = '';
    if (p > 0.12 && p < 0.8) {
      const q = ramp(p, 0.12, 0.8);
      for (let i = 0; i < 14; i++) {
        const a = rnd(i * 5.3 + size) * Math.PI * 2;
        const dist = (w * 0.45 + rnd(i * 2.2) * 120) * easeOutCubic(q);
        burst += `<rect x="${Math.cos(a) * dist}" y="${Math.sin(a) * dist * 0.6}" width="${6 + rnd(i) * 8}" height="${6 + rnd(i) * 8}" fill="${color}" opacity="${(1 - q) * 0.8}" transform="rotate(${i * 37} ${Math.cos(a) * dist} ${Math.sin(a) * dist * 0.6})"/>`;
      }
    }
    return `<g opacity="${op}" transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})">
      <defs><mask id="${id}"><rect x="${-w}" y="${-h}" width="${w * 2}" height="${h * 2}" fill="#fff"/>${specks}</mask></defs>
      ${burst}
      <g mask="url(#${id})">
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="14" fill="rgba(6,8,14,0.55)" stroke="${color}" stroke-width="9"/>
        <rect x="${-w / 2 + 12}" y="${-h / 2 + 12}" width="${w - 24}" height="${h - 24}" rx="8" fill="none" stroke="${color}" stroke-width="3"/>
        <text x="0" y="${size * 0.36}" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="${size}"
          letter-spacing="${size * 0.06}" fill="${color}">${esc(text)}</text>
      </g>
    </g>`;
  }

  // HUD chip with typewriter reveal + blinking cursor. anchor: 'middle' | 'start'
  function tag(text, x, y, tIn, now, o = {}) {
    const p = now - tIn;
    if (p < 0) return '';
    const color = o.color || C.cyan;
    const size = o.size || 34;
    const outA = o.until ? 1 - ramp(now, o.until - 0.25, o.until) : 1;
    if (outA <= 0) return '';
    const cw = size * 0.602; // DejaVu Sans Mono advance
    const pad = 26;
    const w = text.length * cw + pad * 2 + 14;
    const h = size + 30;
    const typeDur = o.typeDur ?? Math.min(0.45, 0.03 * text.length + 0.1);
    const n = Math.floor(ramp(p, 0.08, 0.08 + typeDur) * text.length + 0.001);
    const grow = easeOutCubic(ramp(p, 0, 0.14));
    const x0 = o.anchor === 'start' ? x : x - w / 2;
    const cursor = n < text.length || Math.floor(p * 3) % 2 === 0;
    const shown = esc(text.slice(0, n));
    const curX = x0 + pad + 14 + n * cw;
    return `<g opacity="${outA}">
      <rect x="${x0}" y="${y - h / 2}" width="${w * grow}" height="${h}" fill="rgba(5,9,18,0.84)" stroke="${color}" stroke-opacity="0.55" stroke-width="2"/>
      <rect x="${x0}" y="${y - h / 2}" width="8" height="${h}" fill="${color}"/>
      <text x="${x0 + pad + 14}" y="${y + size * 0.36}" font-family="${MONO}" font-weight="700" font-size="${size}" fill="${o.textColor || C.white}">${shown}</text>
      ${o.noCursor || !cursor || grow < 1 ? '' : `<rect x="${curX + 2}" y="${y - size * 0.42}" width="${cw * 0.7}" height="${size * 0.84}" fill="${color}" opacity="0.85"/>`}
    </g>`;
  }

  // Composite glitch: RGB split copies + displaced horizontal slices.
  function glitch(svg, amt, seed) {
    if (amt <= 0.01) return svg;
    let out = svg;
    out += `<g filter="url(#onlyR)" style="mix-blend-mode:screen" opacity="${0.75 * amt}" transform="translate(${14 * amt} 0)">${svg}</g>`;
    out += `<g filter="url(#onlyB)" style="mix-blend-mode:screen" opacity="${0.75 * amt}" transform="translate(${-14 * amt} 0)">${svg}</g>`;
    const n = Math.round(3 + amt * 4);
    for (let k = 0; k < n; k++) {
      const r1 = rnd(seed * 17.1 + k * 3.7);
      const r2 = rnd(seed * 5.3 + k * 11.9);
      const r3 = rnd(seed * 9.7 + k * 1.3);
      const y = r1 * H;
      const h = 14 + r2 * 150;
      const dx = (r3 - 0.5) * 220 * amt;
      const id = uid('gl');
      out += `<clipPath id="${id}"><rect x="0" y="${y}" width="${W}" height="${h}"/></clipPath>
        <g clip-path="url(#${id})"><g transform="translate(${dx} 0)">${svg}</g></g>`;
    }
    return out;
  }

  const sparkle = (x, y, r, color, op) =>
    `<circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="${color}" opacity="${op * 0.18}"/><circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${op}"/>`;

  // Hook title — identical at t=0 and at the loop end.
  const HOOK_L1 = 'NOBODY TOLD IT';
  const HOOK_L2 = 'TO HACK';
  const GLYPHS = '#%&@$*!?/\\<>[]{}=+01';
  function hookTitle(resolved, seed, opacity, jitter) {
    if (opacity <= 0) return '';
    const scramble = (s, off) =>
      s
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' ';
          const r = rnd(i * 13.1 + off + seed * 7.3);
          return r < resolved ? ch : GLYPHS[Math.floor(rnd(i + seed * 3.1 + off) * GLYPHS.length)];
        })
        .join('');
    const l1 = esc(scramble(HOOK_L1, 0));
    const l2 = esc(scramble(HOOK_L2, 40));
    const jx = jitter ? (rnd(seed * 2.1) - 0.5) * jitter : 0;
    return `<g opacity="${opacity}" transform="translate(${jx} 0)">
      <text x="540" y="312" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="88"
        letter-spacing="4" fill="${C.white}" stroke="#000" stroke-width="10" paint-order="stroke">${l1}</text>
      <text x="540" y="468" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="150"
        letter-spacing="8" fill="${C.red}" filter="url(#glowRed)">${l2}</text>
      <text x="540" y="468" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="150"
        letter-spacing="8" fill="${C.red}" stroke="#1a0004" stroke-width="6" paint-order="stroke">${l2}</text>
    </g>`;
  }

  // Circuit traces radiating from a point (precomputed, orthogonal polylines)
  function makeTraces(n, seed) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd(i + seed) * 0.4;
      let x = 0;
      let y = 0;
      const pts = [[0, 0]];
      let len = 0;
      for (let s = 0; s < 5; s++) {
        const horiz = s % 2 === (i % 2);
        const step = 90 + rnd(i * 9 + s + seed) * 140;
        if (horiz) x += Math.sign(Math.cos(a) || 1) * step;
        else y += Math.sign(Math.sin(a) || 1) * step;
        pts.push([x, y]);
        len += step;
      }
      out.push({ pts, len });
    }
    return out;
  }
  const TRACES = makeTraces(14, 3);

  // Hook scene state shared by the opening and the loop closer so the seam is identical.
  const HOOK_PHOTO = { scale: 1.14, dy: -150, dim: 0.34, filter: 'deepBlue' };

  // ================= SCENES =================

  // 1 · 0–3.95 · Hook — padlock over circuits; slam, then it opens on "anyway"
  function sHook(t, L) {
    const ph = photo(IMG.padlock, { ...HOOK_PHOTO, scale: HOOK_PHOTO.scale + L * 0.016 });
    const [kx, ky] = ph.pt(0.487, 0.6);
    const hit = 2.88;
    const q = L - hit;
    // title: fully readable on frame 1, scrambles out on "It did it anyway"
    const outU = ramp(L, 2.42, 2.9);
    const title = hookTitle(1 - outU, Math.floor(L * 20), 1 - ramp(L, 2.8, 3.0), outU * 18);
    // scan line over the lock (starts after frame 1 so the loop seam stays clean)
    const scanY = 560 + ((L * 420) % 760);
    const scanOp = env(L, 0.35, 2.85, 0.3, 0.2) * 0.55;
    let traces = '';
    let rings = '';
    if (q > 0) {
      const g = easeOutCubic(ramp(q, 0, 0.9));
      for (const tr of TRACES) {
        const d = 'M' + tr.pts.map((p) => `${kx + p[0]},${ky + p[1]}`).join(' L');
        traces += `<path d="${d}" fill="none" stroke="${C.red}" stroke-width="5" stroke-linejoin="round"
          stroke-dasharray="${tr.len}" stroke-dashoffset="${tr.len * (1 - g)}" opacity="${0.9 - 0.4 * ramp(q, 0.6, 1.1)}" filter="url(#glowRed)"/>`;
        const end = tr.pts[tr.pts.length - 1];
        if (g > 0.95) traces += sparkle(kx + end[0], ky + end[1], 6, C.red, 0.9);
      }
      for (let i = 0; i < 3; i++) {
        const u = ramp(q, i * 0.12, 0.9 + i * 0.12);
        if (u > 0 && u < 1)
          rings += `<circle cx="${kx}" cy="${ky}" r="${40 + u * 620}" fill="none" stroke="${i ? C.red : C.white}" stroke-width="${10 * (1 - u) + 1}" opacity="${1 - u}"/>`;
      }
    }
    const keyGlow = q > 0 ? 0.9 * (1 - ramp(q, 0.4, 1.0) * 0.5) : 0;
    const locked = env(L, 0.2, 2.88, 0.25, 0.1);
    const inner =
      ph.svg +
      `<rect x="0" y="${scanY}" width="${W}" height="3" fill="${C.cyan}" opacity="${scanOp}"/>
      <rect x="0" y="${scanY - 60}" width="${W}" height="60" fill="url(#scanTrail)" opacity="${scanOp}"/>
      ${brackets(170, 520, 740, 780, { color: C.cyan, opacity: 0.7 * locked, len: 54, sw: 5 })}
      ${brackets(170, 520, 740, 780, { color: C.red, opacity: q > 0 ? 1 - ramp(q, 0.7, 1.05) : 0, len: 54, sw: 5 })}
      ${traces}${rings}
      ${keyGlow ? `<circle cx="${kx}" cy="${ky}" r="70" fill="${C.red}" opacity="${keyGlow * 0.5}" filter="url(#blur14)"/>${sparkle(kx, ky, 14, '#fff', keyGlow)}` : ''}
      ${title}`;
    return inner;
  }

  // 2 · 3.95–11.45 · June 2026 — AI agent test; forward pass → Australia
  const NET = (() => {
    const layers = [3, 5, 5, 2];
    const xs = [200, 420, 660, 880];
    const nodes = layers.map((n, li) => Array.from({ length: n }, (_, i) => [xs[li], (i - (n - 1) / 2) * 118]));
    return { nodes };
  })();
  // Australia outline (lon, lat) — stylised
  const AUS = [
    [142.5, -10.7], [141.6, -12.9], [141.5, -15.5], [140.8, -17.4], [139.3, -17.5], [137.5, -16.2], [135.9, -15.0],
    [135.5, -14.0], [136.7, -12.2], [135.0, -12.2], [132.6, -11.5], [131.0, -12.2], [130.1, -13.2], [129.5, -14.9],
    [128.1, -15.0], [127.0, -13.9], [125.6, -14.4], [124.3, -15.9], [123.0, -16.5], [122.2, -18.0], [121.0, -19.5],
    [118.8, -20.3], [116.7, -20.6], [114.2, -21.8], [113.7, -24.0], [113.4, -26.0], [114.2, -28.5], [115.0, -30.5],
    [115.7, -32.2], [115.0, -33.6], [115.1, -34.4], [116.6, -35.0], [118.0, -35.0], [119.9, -34.0], [122.0, -33.9],
    [123.8, -33.9], [125.5, -32.5], [127.3, -32.3], [129.0, -31.6], [131.2, -31.5], [133.0, -32.1], [134.3, -33.0],
    [135.6, -34.8], [136.9, -33.6], [137.8, -32.6], [137.5, -34.3], [138.5, -34.9], [138.2, -35.6], [139.6, -36.9],
    [140.9, -38.0], [142.4, -38.4], [143.5, -38.8], [144.9, -37.9], [146.3, -39.1], [147.9, -37.9], [149.9, -37.5],
    [150.1, -36.3], [150.8, -34.5], [151.2, -33.9], [152.5, -32.4], [153.6, -28.6], [153.1, -26.0], [152.1, -24.4],
    [150.8, -22.6], [149.2, -21.0], [147.0, -19.3], [146.0, -17.5], [145.4, -15.0], [143.8, -14.0], [143.5, -12.5],
  ];
  const TAS = [[144.7, -40.7], [146.5, -41.1], [148.3, -40.9], [148.3, -42.2], [147.0, -43.6], [145.9, -43.5], [145.2, -42.2]];
  function ausPath(cx, cy, width) {
    const k = width / (41 * 0.84);
    const pr = ([lo, la]) => [cx + (lo - 133.5) * 0.84 * k, cy + (-la - 27) * k];
    const toD = (pts) => 'M' + pts.map((p) => pr(p).map((v) => v.toFixed(1)).join(',')).join(' L') + ' Z';
    let len = 0;
    for (let i = 1; i <= AUS.length; i++) {
      const a = pr(AUS[i - 1]);
      const b = pr(AUS[i % AUS.length]);
      len += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    return { main: toD(AUS), tas: toD(TAS), len, pr };
  }

  function sAgent(t, L) {
    const ph = photo(IMG.neural, { scale: 1.04 + L * 0.008, dim: 0.72, filter: 'cyanTone', focus: [0.5, 0.55] });
    // network placement: centre stage, then shrinks to the top when the map arrives
    const mv = easeInOutCubic(ramp(t, 8.55, 9.35));
    const ncy = lerp(700, 360, mv);
    const ns = lerp(1, 0.62, mv);
    const tr = (p) => [540 + (p[0] - 540) * ns, ncy + p[1] * ns];
    const front = ((L - 0.4) * 760) % 1200 - 60; // forward-pass wave x (pre-scale)
    let edges = '';
    let nodes = '';
    const appear = easeOutCubic(ramp(L, 0.1, 0.8));
    for (let li = 0; li < NET.nodes.length - 1; li++) {
      for (const a of NET.nodes[li]) {
        for (const b of NET.nodes[li + 1]) {
          const mid = (a[0] + b[0]) / 2;
          const hot = Math.exp(-Math.pow((mid - front) / 70, 2));
          const A = tr(a);
          const B = tr(b);
          edges += `<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" stroke="${C.cyan}" stroke-width="${1.6 + hot * 2.5}" opacity="${(0.16 + hot * 0.7) * appear}"/>`;
          if (hot > 0.2) {
            const u = clamp((front - a[0]) / (b[0] - a[0]), 0, 1);
            edges += sparkle(lerp(A[0], B[0], u), lerp(A[1], B[1], u), 3.5, '#bff8ff', hot * appear);
          }
        }
      }
    }
    NET.nodes.forEach((layer, li) =>
      layer.forEach((p, i) => {
        const P = tr(p);
        const hot = Math.exp(-Math.pow((p[0] - front) / 60, 2));
        const pop = easeOutBack(ramp(L, 0.1 + li * 0.12 + i * 0.03, 0.5 + li * 0.12 + i * 0.03));
        const r = (22 + hot * 8) * ns * pop;
        const out = li === NET.nodes.length - 1;
        nodes += `<circle cx="${P[0]}" cy="${P[1]}" r="${r * 1.9}" fill="${out ? C.amber : C.cyan}" opacity="${0.12 + hot * 0.25}"/>
          <circle cx="${P[0]}" cy="${P[1]}" r="${r}" fill="${C.ink}" stroke="${out ? C.amber : C.cyan}" stroke-width="${4 * ns}"/>
          <circle cx="${P[0]}" cy="${P[1]}" r="${r * 0.42}" fill="${out ? C.amber : C.cyan}" opacity="${0.5 + hot * 0.5}"/>`;
      })
    );
    const netFrame = brackets(540 - 420 * ns, ncy - 330 * ns, 840 * ns, 660 * ns, { opacity: 0.55 * appear, len: 40 * ns });
    // Australia map (from 9.3)
    const map = ausPath(540, 850, 620);
    const draw = easeInOutCubic(ramp(t, 9.2, 10.55));
    const fillA = ramp(t, 10.45, 10.9);
    const outNode = tr(NET.nodes[3][1]);
    const beamU = easeOutCubic(ramp(t, 10.2, 10.6));
    const target = [540, 850];
    const beam =
      beamU > 0
        ? `<line x1="${outNode[0]}" y1="${outNode[1]}" x2="${lerp(outNode[0], target[0], beamU)}" y2="${lerp(outNode[1], target[1] - 200, beamU)}"
            stroke="${C.amber}" stroke-width="4" stroke-dasharray="10 10" stroke-dashoffset="${-L * 80}" opacity="${0.9 * (1 - ramp(t, 11.0, 11.4))}"/>`
        : '';
    const sweepY = 560 + ((t - 10.5) * 380) % 600;
    const bars = [
      [210, 700, 9.66],
      [870, 760, 9.84],
      [250, 1010, 10.0],
    ]
      .map(([x, y, at], i) => {
        const u = easeOutBack(ramp(t, at, at + 0.35));
        if (u <= 0) return '';
        const hs = [0.5, 0.8, 0.35, 1.0].map((v, j) => v * (0.8 + 0.2 * Math.sin(L * 3 + j + i)));
        return `<g transform="translate(${x} ${y}) scale(${u})" opacity="0.95">
          <rect x="-52" y="-58" width="104" height="92" rx="10" fill="rgba(5,9,18,0.8)" stroke="${C.amber}" stroke-width="2"/>
          ${hs.map((hh, j) => `<rect x="${-36 + j * 20}" y="${22 - hh * 62}" width="14" height="${hh * 62}" fill="${C.amber}"/>`).join('')}
        </g>`;
      })
      .join('');
    const mapSvg =
      draw > 0
        ? `<g>
        <path d="${map.main}" fill="${C.cyan}" fill-opacity="${0.16 * fillA}" stroke="${C.cyan}" stroke-width="5"
          stroke-dasharray="${map.len}" stroke-dashoffset="${map.len * (1 - draw)}" stroke-linejoin="round" filter="url(#glowCyan)"/>
        <path d="${map.tas}" fill="${C.cyan}" fill-opacity="${0.16 * fillA}" stroke="${C.cyan}" stroke-width="4" opacity="${fillA}"/>
        ${fillA > 0 ? `<clipPath id="ausClip"><path d="${map.main}"/></clipPath>
          <g clip-path="url(#ausClip)"><rect x="200" y="${sweepY}" width="700" height="6" fill="#fff" opacity="${0.6 * fillA}"/>
          <rect x="200" y="${sweepY - 90}" width="700" height="90" fill="url(#scanTrail)" opacity="${0.8 * fillA}"/></g>` : ''}
        ${tag('AUSTRALIA', 540, 862, 10.52, t, { color: C.cyan, size: 36, noCursor: true })}
      </g>`
        : '';
    return (
      ph.svg +
      `<g>${netFrame}${edges}${nodes}</g>
      ${stamp('JUNE 2026', 540, 212, 4.02, t, { color: C.amber, size: 80, rot: -4, until: 8.9 })}
      ${tag('AI AGENT · TEST RUN', 540, 1105, 7.32, t, { color: C.cyan, size: 34, until: 8.75 })}
      ${beam}${mapSvg}${bars}`
    );
  }

  // 3 · 11.45–17.62 · Medicare statistics portal → BLOCKED → a way around the blocks
  const MAZE = (() => {
    const cols = 8;
    const rows = 5;
    const x0 = 140;
    const y0 = 660;
    const cw = 100;
    const ch = 100;
    const walls = [
      [1, 0], [1, 1], [1, 2], [1, 3],
      [3, 1], [3, 2], [3, 3], [3, 4],
      [5, 0], [5, 1], [5, 2], [5, 3],
      [6, 0], [6, 1], [6, 2],
    ];
    // route snakes around the red walls, then exits up the right side toward the portal
    const path = [
      [0, 4], [1, 4], [2, 4], [2, 3], [2, 2], [2, 1], [2, 0], [3, 0], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [5, 4],
      [6, 4], [6, 3], [7, 3], [7, 2], [7, 1], [7, 0],
    ];
    const c = ([i, j]) => [x0 + i * cw + cw / 2, y0 + j * ch + ch / 2];
    return { cols, rows, x0, y0, cw, ch, walls, path, c };
  })();

  function sPortal(t, L) {
    const blockedAt = 14.86;
    const redU = ramp(t, blockedAt - 0.05, blockedAt + 0.25);
    const scl = 1.08 + L * 0.012;
    const base = photo(IMG.lock, { scale: scl, dim: 0.52, filter: 'cyanTone' });
    const red = redU > 0 ? photo(IMG.lock, { scale: scl, dim: 0.5, filter: 'redTone', opacity: redU }).svg : '';
    // portal card; after the block it shrinks to the top so the bypass has room
    const cardIn = easeOutCubic(ramp(t, 11.75, 12.35));
    const shrink = easeInOutCubic(ramp(t, 15.45, 16.0));
    const cs = lerp(1, 0.56, shrink);
    const ccy = lerp(600, 380, shrink) + (1 - cardIn) * 80;
    const cardW = 840;
    const cardH = 560;
    const border = redU > 0 ? C.red : C.cyan;
    const pulses = [blockedAt, blockedAt + 0.24, blockedAt + 0.48]
      .map((p0) => {
        const u = ramp(t, p0, p0 + 0.6);
        if (u <= 0 || u >= 1) return '';
        const g = 20 + u * 150;
        return `<rect x="${-cardW / 2 - g}" y="${-cardH / 2 - g}" width="${cardW + 2 * g}" height="${cardH + 2 * g}" rx="${24 + g / 3}" fill="none" stroke="${C.red}" stroke-width="${8 * (1 - u) + 1}" opacity="${1 - u}"/>`;
      })
      .join('');
    const skeleton = [0.35, 0.6, 0.45, 0.8, 0.55, 0.9, 0.7]
      .map((v, i) => `<rect x="${-340 + i * 70}" y="${170 - v * 230}" width="46" height="${v * 230}" rx="4" fill="${C.white}" opacity="0.18"/>`)
      .join('');
    const card = `<g opacity="${cardIn}" transform="translate(540 ${ccy}) scale(${cs})">
        ${pulses}
        <rect x="${-cardW / 2}" y="${-cardH / 2}" width="${cardW}" height="${cardH}" rx="22" fill="rgba(6,10,20,0.86)" stroke="${border}" stroke-width="4"/>
        <rect x="${-cardW / 2}" y="${-cardH / 2}" width="${cardW}" height="74" rx="22" fill="${border}" opacity="0.16"/>
        <circle cx="${-cardW / 2 + 36}" cy="${-cardH / 2 + 37}" r="9" fill="${C.red}"/>
        <circle cx="${-cardW / 2 + 64}" cy="${-cardH / 2 + 37}" r="9" fill="${C.amber}"/>
        <circle cx="${-cardW / 2 + 92}" cy="${-cardH / 2 + 37}" r="9" fill="${C.green}"/>
        ${tag('MEDICARE STATISTICS PORTAL', -cardW / 2 + 128, -cardH / 2 + 37, 12.6, t, { anchor: 'start', size: 26, color: border, noCursor: true })}
        <text x="-340" y="-150" font-family="${MONO}" font-size="24" fill="${C.white}" opacity="${0.55 * ramp(t, 12.3, 12.6)}">AUSTRALIAN GOVERNMENT</text>
        <rect x="-340" y="-120" width="520" height="16" rx="8" fill="${C.white}" opacity="0.14"/>
        <rect x="-340" y="-90" width="380" height="16" rx="8" fill="${C.white}" opacity="0.1"/>
        ${skeleton}
        ${stamp('BLOCKED', 0, 30, blockedAt, t, { color: C.red, size: 124, rot: -8 })}
      </g>`;
    // agent cursor: approaches, bounces off on "blocked"
    const appr = easeInOutCubic(ramp(t, 11.6, 14.75));
    const knock = t > 14.75 ? Math.exp(-(t - 14.75) * 3.2) * Math.sin((t - 14.75) * 9) : 0;
    const ax = lerp(150, 330, appr) - knock * 90;
    const ay = lerp(1120, 910, appr) + knock * 60;
    const cursorOp = 1 - ramp(t, 15.4, 15.7);
    const trailN = 10;
    let cursor = '';
    for (let i = trailN; i >= 0; i--) {
      const tt = t - i * 0.04;
      const a2 = easeInOutCubic(ramp(tt, 11.6, 14.75));
      const k2 = tt > 14.75 ? Math.exp(-(tt - 14.75) * 3.2) * Math.sin((tt - 14.75) * 9) : 0;
      const x2 = lerp(150, 330, a2) - k2 * 90;
      const y2 = lerp(1120, 910, a2) + k2 * 60;
      cursor += `<circle cx="${x2}" cy="${y2}" r="${14 - i}" fill="${C.cyan}" opacity="${(0.5 * (1 - i / trailN)) * cursorOp}"/>`;
    }
    cursor += `<g opacity="${cursorOp}" filter="url(#glowCyan)"><circle cx="${ax}" cy="${ay}" r="18" fill="${C.cyan}"/><circle cx="${ax}" cy="${ay}" r="34" fill="none" stroke="${C.cyan}" stroke-width="3" opacity="0.6"/></g>`;
    // maze bypass (15.55 → 17.4)
    let maze = '';
    const mz = ramp(t, 15.5, 15.85);
    if (mz > 0) {
      const M = MAZE;
      let cells = '';
      M.walls.forEach(([i, j], k) => {
        const u = easeOutBack(ramp(t, 15.5 + k * 0.02, 15.8 + k * 0.02));
        const flash = [
          [3, 3, 16.1],
          [5, 3, 16.65],
          [6, 2, 17.0],
        ].find((f) => f[0] === i && f[1] === j);
        const fl = flash ? Math.exp(-Math.max(0, t - flash[2]) * 6) * (t > flash[2] ? 1 : 0) : 0;
        const x = M.x0 + i * M.cw + 8;
        const y = M.y0 + j * M.ch + 8;
        cells += `<rect x="${x}" y="${y}" width="${M.cw - 16}" height="${M.ch - 16}" rx="8" fill="${C.red}" fill-opacity="${0.28 + fl * 0.6}"
          stroke="${C.red}" stroke-width="3" transform="translate(${x + 42} ${y + 42}) scale(${u}) translate(${-x - 42} ${-y - 42})"/>`;
      });
      let grid = '';
      for (let i = 0; i <= M.cols; i++) grid += `<line x1="${M.x0 + i * M.cw}" y1="${M.y0}" x2="${M.x0 + i * M.cw}" y2="${M.y0 + M.rows * M.ch}" stroke="${C.cyan}" stroke-opacity="0.12"/>`;
      for (let j = 0; j <= M.rows; j++) grid += `<line x1="${M.x0}" y1="${M.y0 + j * M.ch}" x2="${M.x0 + M.cols * M.cw}" y2="${M.y0 + j * M.ch}" stroke="${C.cyan}" stroke-opacity="0.12"/>`;
      const pts = M.path.map(M.c);
      // exit leg: from last cell up to the card
      const last = pts[pts.length - 1];
      const exit = [700, 548]; // bottom-right of the shrunken portal card
      const all = pts.concat([[last[0], 612], [exit[0], 612], exit]);
      let len = 0;
      const segs = [];
      for (let i = 1; i < all.length; i++) {
        const l = Math.hypot(all[i][0] - all[i - 1][0], all[i][1] - all[i - 1][1]);
        segs.push(l);
        len += l;
      }
      const g = easeInOutCubic(ramp(t, 15.8, 17.38));
      let rem = g * len;
      let head = all[0];
      for (let i = 1; i < all.length; i++) {
        if (rem <= segs[i - 1]) {
          const u = rem / segs[i - 1];
          head = [lerp(all[i - 1][0], all[i][0], u), lerp(all[i - 1][1], all[i][1], u)];
          break;
        }
        rem -= segs[i - 1];
        head = all[i];
      }
      const d = 'M' + all.map((p) => p.join(',')).join(' L');
      // dead-end probes that bump into walls
      const probes = [
        [2, 3, 3, 3, 15.95, 16.1],
        [4, 3, 5, 3, 16.5, 16.65],
        [6, 3, 6, 2, 16.85, 17.0],
      ]
        .map(([i1, j1, i2, j2, a, b]) => {
          const u = ramp(t, a, b);
          const f = 1 - ramp(t, b, b + 0.35);
          if (u <= 0 || f <= 0) return '';
          const A = M.c([i1, j1]);
          const B = M.c([i2, j2]);
          return `<line x1="${A[0]}" y1="${A[1]}" x2="${lerp(A[0], B[0], u * 0.6)}" y2="${lerp(A[1], B[1], u * 0.6)}" stroke="${C.cyan}" stroke-width="4" stroke-dasharray="6 6" opacity="${f}"/>`;
        })
        .join('');
      const done = ramp(t, 17.3, 17.5);
      maze = `<g opacity="${mz}">
        <rect x="${M.x0 - 20}" y="${M.y0 - 20}" width="${M.cols * M.cw + 40}" height="${M.rows * M.ch + 40}" rx="18" fill="rgba(4,8,16,0.72)"/>
        ${grid}${cells}${probes}
        <path d="${d}" fill="none" stroke="${C.cyan}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"
          stroke-dasharray="${len}" stroke-dashoffset="${len * (1 - g)}" filter="url(#glowCyan)"/>
        ${sparkle(head[0], head[1], 13, '#fff', 1)}
        ${done > 0 ? `<circle cx="${exit[0]}" cy="${exit[1]}" r="${20 + done * 60}" fill="none" stroke="${C.cyan}" stroke-width="5" opacity="${1 - done}"/>` : ''}
      </g>`;
    }
    return base.svg + red + card + maze + cursor;
  }

  // 4 · 17.62–20.7 · Into the files — rack push-in, folder spills abstract (redacted) docs
  function sFiles(t, L) {
    const ph = photo(IMG.racks, { scale: 1.02 + easeInOutCubic(ramp(L, 0, 3.1)) * 0.2, focus: [0.675, 0.5], dim: 0.5, filter: 'coldTone' });
    const fIn = easeOutBack(ramp(t, 17.75, 18.15));
    const open = easeOutCubic(ramp(t, 18.2, 18.5));
    const fx = 540;
    const fy = 830;
    const folder = `<g transform="translate(${fx} ${fy}) scale(${fIn})">
        <path d="M-190,-120 h120 l30,-34 h230 v34 h0 v250 h-380 z" fill="#d9a92f" stroke="#5a4210" stroke-width="4"/>
        <rect x="-190" y="-90" width="380" height="220" rx="10" fill="#f2c24d" stroke="#5a4210" stroke-width="4"
          transform="translate(0 130) skewX(${-open * 18}) scale(1 ${1 - open * 0.35}) translate(0 -130)"/>
      </g>`;
    const docs = [
      [-330, -250, -14],
      [-165, -310, -6],
      [0, -330, 2],
      [165, -310, 8],
      [330, -250, 15],
    ]
      .map(([dx, dy, r], i) => {
        const u = easeOutBack(ramp(t, 18.3 + i * 0.09, 18.75 + i * 0.09));
        if (u <= 0) return '';
        const bob = Math.sin(L * 2.2 + i) * 6;
        const x = fx + dx * u;
        const y = fy - 40 + dy * u + bob;
        const lines = [0, 1, 2, 3, 4]
          .map((k) => `<rect x="-52" y="${-40 + k * 26}" width="${[92, 70, 100, 60, 84][(k + i) % 5]}" height="12" rx="3" fill="${k === 0 ? '#1b2230' : '#0b0f18'}" opacity="${k === 0 ? 0.9 : 0.75}"/>`)
          .join('');
        return `<g transform="translate(${x} ${y}) rotate(${r * u}) scale(${0.4 + 0.6 * u})">
          <path d="M-72,-95 h108 l36,36 v154 h-144 z" fill="#eef2f8" stroke="#8795ab" stroke-width="3"/>
          <path d="M36,-95 v36 h36" fill="#c9d2df" stroke="#8795ab" stroke-width="3"/>
          <rect x="-58" y="-78" width="54" height="16" rx="3" fill="${C.cyan}" opacity="0.8"/>
          ${lines}
        </g>`;
      })
      .join('');
    return (
      ph.svg +
      `${tag('ACCESS', 540, 205, 17.82, t, { color: C.green, size: 40 })}
      ${docs}${folder}
      ${stamp('NEVER PUBLIC', 540, 1090, 18.98, t, { color: C.red, size: 74, rot: -3 })}`
    );
  }

  // 5 · 20.7–26.8 · Per OpenAI: health stats + internal file names — no patient records
  function sFindings(t, L) {
    const bg = photo(IMG.arms, { scale: 1.9, dim: 0.78, filter: 'blur14' });
    const crestIn = easeOutCubic(ramp(L, 0.05, 0.6));
    const cw = 640;
    const crest = photo(IMG.arms, { boxW: cw, cx: 540, cy: 520 - (1 - crestIn) * 30, opacity: 0.9 * crestIn, fit: 'meet', scale: 1 + L * 0.006 });
    const sheen = ramp(t, 21.1, 22.2);
    const sheenX = lerp(-300, 1400, sheen);
    const row = (label, status, y, at, color) => {
      const u = easeOutCubic(ramp(t, at, at + 0.3));
      if (u <= 0) return '';
      const chk = ramp(t, at + 0.15, at + 0.4);
      return `<g opacity="${u}" transform="translate(${(1 - u) * -60} 0)">
        <rect x="100" y="${y - 40}" width="880" height="80" rx="12" fill="rgba(5,9,18,0.86)" stroke="${color}" stroke-opacity="0.5" stroke-width="2"/>
        <rect x="100" y="${y - 40}" width="10" height="80" fill="${color}"/>
        <path d="M140,${y} l14,14 l26,-30" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"
          stroke-dasharray="70" stroke-dashoffset="${70 * (1 - chk)}"/>
        <text x="206" y="${y + 13}" font-family="${MONO}" font-weight="700" font-size="36" fill="${C.white}">${label}</text>
        <text x="950" y="${y + 11}" text-anchor="end" font-family="${MONO}" font-weight="700" font-size="28" fill="${color}">${status}</text>
      </g>`;
    };
    return (
      bg.svg +
      `<g>${crest.svg}</g>
      <clipPath id="crestClip"><rect x="${540 - cw / 2}" y="${crest.y}" width="${cw}" height="${crest.h}"/></clipPath>
      <g clip-path="url(#crestClip)"><rect x="${sheenX}" y="0" width="140" height="${H}" fill="#fff" opacity="${0.12 * (1 - Math.abs(sheen - 0.5) * 2)}" transform="skewX(-20)"/></g>
      ${tag('SOURCE: OPENAI', 540, 168, 21.26, t, { color: C.amber, size: 32 })}
      ${row('HEALTH STATISTICS', 'ACCESSED', 880, 22.72, C.amber)}
      ${row('INTERNAL FILE NAMES', 'ACCESSED', 978, 23.92, C.amber)}
      ${stamp('NO PATIENT RECORDS', 540, 1122, 25.02, t, { color: C.green, size: 60, rot: -3 })}`
    );
  }

  // 6 · 26.8–36.4 · The scary part — JUN → AUG → SEP, then an email to a public inbox
  function sDelay(t, L) {
    const ph = photo(IMG.wires, { scale: 1.12 + L * 0.01, rot: Math.sin(L * 0.35) * 0.8, dim: 0.58, filter: 'redTone', focus: [0.45, 0.5] });
    const redPulse = Math.exp(-Math.max(0, t - 27.6) * 2.2) * (t > 27.6 ? 1 : 0);
    const ly = 600;
    const X = [190, 540, 890];
    const months = [
      ['JUN', 'ACCESS', 27.7, C.red],
      ['AUG', 'NOTICED', 30.64, C.amber],
      ['SEP', 'TOLD', 33.22, C.cyan],
    ];
    const trackIn = easeOutCubic(ramp(t, 27.5, 28.0));
    const f1 = ramp(t, 29.0, 30.64);
    const f2 = ramp(t, 31.7, 33.22);
    const fillX = f2 > 0 ? lerp(X[1], X[2], f2) : lerp(X[0], X[1], f1);
    let ticks = '';
    for (let i = 0; i <= 14; i++) {
      const x = lerp(X[0], X[2], i / 14);
      const lit = x <= fillX + 1 && (f1 > 0 || i === 0);
      ticks += `<line x1="${x}" y1="${ly - 12}" x2="${x}" y2="${ly + 12}" stroke="${lit ? C.red : C.white}" stroke-width="3" opacity="${(lit ? 0.9 : 0.3) * trackIn}"/>`;
    }
    const nodes = months
      .map(([m, sub, at, col], i) => {
        const u = easeOutBack(ramp(t, at, at + 0.35));
        const ring = ramp(t, at, at + 0.7);
        return `<g opacity="${trackIn}">
          <circle cx="${X[i]}" cy="${ly}" r="20" fill="${C.ink}" stroke="${u > 0 ? col : '#667'}" stroke-width="5"/>
          ${u > 0 ? `<circle cx="${X[i]}" cy="${ly}" r="${11 * u}" fill="${col}"/>` : ''}
          ${ring > 0 && ring < 1 ? `<circle cx="${X[i]}" cy="${ly}" r="${20 + ring * 70}" fill="none" stroke="${col}" stroke-width="4" opacity="${1 - ring}"/>` : ''}
          <g transform="translate(${X[i]} ${ly - 70}) scale(${Math.max(u, 0.001)})">
            <text text-anchor="middle" y="0" font-family="${MONO}" font-weight="700" font-size="84" fill="${col}" stroke="#000" stroke-width="7" paint-order="stroke">${m}</text>
          </g>
          ${u > 0 ? tag(sub, X[i], ly + 88, at + 0.1, t, { color: col, size: 34, noCursor: true }) : ''}
        </g>`;
      })
      .join('');
    const year = `<text x="540" y="${ly - 190}" text-anchor="middle" font-family="${MONO}" font-size="30" letter-spacing="10" fill="${C.white}" opacity="${0.6 * trackIn}">2026</text>`;
    const track = `<line x1="${X[0]}" y1="${ly}" x2="${X[2]}" y2="${ly}" stroke="${C.white}" stroke-width="4" opacity="${0.25 * trackIn}"/>
      ${f1 > 0 ? `<line x1="${X[0]}" y1="${ly}" x2="${fillX}" y2="${ly}" stroke="${C.red}" stroke-width="7" filter="url(#glowRed)"/>` : ''}`;
    // email → public inbox
    const trayIn = easeOutBack(ramp(t, 34.3, 34.7));
    const fly = ramp(t, 34.45, 35.25);
    const e = easeInOutCubic(fly);
    const ex = lerp(X[2], 540, e);
    const ey = lerp(ly, 915, e) - Math.sin(e * Math.PI) * 170;
    const land = ramp(t, 35.25, 35.6);
    const envOp = fly > 0 ? 1 - land * 0.9 : 0;
    const envelope = `<g opacity="${envOp}" transform="translate(${ex} ${ey}) rotate(${(1 - e) * -18}) scale(${lerp(0.7, 1.3, e) * (1 - land * 0.45)})">
        <rect x="-78" y="-50" width="156" height="100" rx="8" fill="#eef2f8" stroke="#8795ab" stroke-width="3"/>
        <path d="M-78,-48 L0,12 L78,-48" fill="none" stroke="#8795ab" stroke-width="4"/>
      </g>`;
    const glowT = Math.exp(-Math.max(0, t - 35.3) * 3) * (t > 35.3 ? 1 : 0);
    const tray =
      trayIn > 0
        ? `<g transform="translate(540 960) scale(${trayIn * 1.35})">
        <ellipse cx="0" cy="-10" rx="${190}" ry="40" fill="${C.cyan}" opacity="${0.25 * glowT}"/>
        <path d="M-170,-40 L-130,40 H130 L170,-40 H80 L60,0 H-60 L-80,-40 Z" fill="rgba(6,10,20,0.9)" stroke="${C.cyan}" stroke-width="5" stroke-linejoin="round"/>
        ${land > 0 ? `<g transform="translate(118 -40) scale(${easeOutBack(land)})"><circle r="24" fill="${C.red}"/><text y="10" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="28" fill="#fff">1</text></g>` : ''}
      </g>`
        : '';
    return (
      ph.svg +
      `<rect width="${W}" height="${H}" fill="url(#redVig)" opacity="${0.9 * redPulse}"/>
      ${year}${track}${ticks}${nodes}${tray}${envelope}
      ${tag('PUBLIC INBOX', 540, 1120, 35.16, t, { color: C.cyan, size: 40 })}`
    );
  }

  // 7 · 36.4–41.35 · PM Anthony Albanese — "unacceptable", investigation
  function sPM(t, L) {
    const bg = photo(IMG.pm, { scale: 1.25, dim: 0.7, filter: 'blur14', focus: [0.5, 0.4] });
    const cIn = easeOutCubic(ramp(L, 0, 0.5));
    const cx = 190;
    const cy = 170;
    const cw = 700;
    const ch = 860;
    const inner = photo(IMG.pm, { boxW: cw * (1.05 + L * 0.012), cx: 540, cy: cy + ch * 0.42, focus: [0.5, 0.36] });
    const stampAt = 38.72;
    const invAt = 40.36;
    const scan = ramp(t, invAt + 0.05, invAt + 0.9);
    const scanY = cy + scan * ch;
    const card = `<g opacity="${cIn}" transform="translate(540 ${cy + ch / 2}) scale(${lerp(0.94, 1, cIn)}) translate(-540 ${-(cy + ch / 2)})">
        <clipPath id="pmClip"><rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="18"/></clipPath>
        <rect x="${cx - 6}" y="${cy - 6}" width="${cw + 12}" height="${ch + 12}" rx="22" fill="#000" opacity="0.5"/>
        <g clip-path="url(#pmClip)">${inner.svg}
          <rect x="${cx}" y="${cy + ch - 200}" width="${cw}" height="200" fill="url(#fadeDown)"/>
          ${scan > 0 && scan < 1 ? `<rect x="${cx}" y="${scanY - 70}" width="${cw}" height="70" fill="url(#scanTrail)" opacity="0.9"/><rect x="${cx}" y="${scanY}" width="${cw}" height="4" fill="${C.cyan}"/>` : ''}
        </g>
        <rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="18" fill="none" stroke="${C.white}" stroke-opacity="0.35" stroke-width="2"/>
        ${brackets(cx - 18, cy - 18, cw + 36, ch + 36, { color: t > invAt ? C.cyan : C.white, opacity: 0.8, len: 46 })}
        <text x="${cx + 20}" y="${cy + ch - 20}" font-family="${SANS}" font-size="17" fill="#fff" opacity="0.72">Photo: DFAT · CC BY 4.0</text>
      </g>`;
    const plateIn = easeOutCubic(ramp(t, 36.8, 37.2));
    const plateOut = ramp(t, invAt - 0.25, invAt);
    const plate =
      plateIn > 0 && plateOut < 1
        ? `<g opacity="${plateIn * (1 - plateOut)}" transform="translate(${(1 - plateIn) * -80} 0)">
        <rect x="120" y="1062" width="${840 * plateIn}" height="104" fill="rgba(5,9,18,0.9)"/>
        <rect x="120" y="1062" width="10" height="104" fill="${C.amber}"/>
        <text x="156" y="1110" font-family="${SANS}" font-weight="700" font-size="44" fill="${C.white}">ANTHONY ALBANESE</text>
        <text x="158" y="1148" font-family="${MONO}" font-size="26" letter-spacing="4" fill="${C.amber}">PRIME MINISTER</text>
      </g>`
        : '';
    return (
      bg.svg +
      card +
      plate +
      stamp('UNACCEPTABLE', 540, 905, stampAt, t, { color: C.red, size: 84, rot: -7 }) +
      tag('INVESTIGATION', 540, 1114, invAt, t, { color: C.cyan, size: 42 })
    );
  }

  // 8 · 41.35–45.5 · "In his words" — the agent won't take NO; the NO shatters
  const SHARDS = Array.from({ length: 16 }, (_, i) => ({
    x: -170 + (i % 4) * 85 + 42,
    y: -105 + Math.floor(i / 4) * 52 + 26,
    a: rnd(i * 3.3) * Math.PI * 2,
    v: 260 + rnd(i * 7.1) * 420,
    r: (rnd(i * 2.9) - 0.5) * 540,
  }));
  function sQuote(t, L) {
    const ph = photo(IMG.parliament, { scale: 1.02 + L * 0.018, focus: [0.5, 0.52], dim: 0.55, filter: 'coldTone' });
    const qIn = easeOutBack(ramp(t, 41.6, 42.0));
    const quotes = `<g opacity="${ramp(t, 41.6, 41.8)}">
        <text x="540" y="${400}" text-anchor="middle" font-family="Georgia, 'DejaVu Serif', serif" font-weight="700" font-size="${260 * qIn}" fill="${C.amber}" opacity="0.9">“ ”</text>
        ${tag('ANTHONY ALBANESE', 540, 430, 41.75, t, { color: C.amber, size: 32, noCursor: true })}
      </g>`;
    const noAt = 43.84;
    const breakAt = 44.9;
    const nIn = ramp(t, noAt, noAt + 0.14);
    const s = lerp(2.2, 1, easeOutCubic(nIn));
    const bx = 540;
    const by = 760;
    let noBlock = '';
    if (t >= noAt && t < breakAt) {
      const crack = ramp(t, 44.35, breakAt);
      const cracks = crack > 0
        ? `<path d="M-40,-110 L-10,-40 L-60,10 L-5,60 L-30,110 M-10,-40 L60,-70 M-60,10 L-140,30 M-5,60 L90,40 L150,90"
            fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="700" stroke-dashoffset="${700 * (1 - crack)}"/>`
        : '';
      const shake = crack > 0 ? (rnd(Math.floor(t * 60)) - 0.5) * 12 * crack : 0;
      noBlock = `<g opacity="${nIn}" transform="translate(${bx + shake} ${by}) scale(${s})">
        <rect x="-170" y="-105" width="340" height="210" rx="22" fill="rgba(60,0,8,0.85)" stroke="${C.red}" stroke-width="8"/>
        <text x="0" y="56" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="160" fill="${C.red}" filter="url(#glowRed)">NO</text>
        <text x="0" y="56" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="160" fill="#ffd6db">NO</text>
        ${cracks}
      </g>`;
    }
    let shards = '';
    if (t >= breakAt) {
      const u = t - breakAt;
      SHARDS.forEach((sh, i) => {
        const x = bx + sh.x + Math.cos(sh.a) * sh.v * u;
        const y = by + sh.y + Math.sin(sh.a) * sh.v * u + 500 * u * u;
        const op = 1 - ramp(u, 0.2, 0.6);
        if (op > 0)
          shards += `<rect x="${x - 40}" y="${y - 24}" width="80" height="48" fill="${i % 3 ? 'rgba(60,0,8,0.9)' : C.red}" stroke="${C.red}" stroke-width="3"
            opacity="${op}" transform="rotate(${sh.r * u} ${x} ${y})"/>`;
      });
      const fl = 1 - ramp(u, 0, 0.3);
      shards += `<circle cx="${bx}" cy="${by}" r="${80 + u * 700}" fill="none" stroke="#fff" stroke-width="${10 * fl}" opacity="${fl}"/>`;
    }
    // agent tracer: arrives, is refused, circles the NO, then punches through
    let tracer = '';
    const trOp = ramp(t, 43.0, 43.2) * (1 - ramp(t, 45.1, 45.4));
    if (trOp > 0) {
      const pos = (tt) => {
        if (tt < noAt) {
          const u = easeInOutCubic(ramp(tt, 43.0, noAt));
          return [lerp(-40, 330, u), lerp(1060, 800, u)];
        }
        if (tt < 44.35) {
          const k = Math.exp(-(tt - noAt) * 5) * Math.sin((tt - noAt) * 14);
          return [330 - k * 60, 800 + k * 20];
        }
        if (tt < breakAt) {
          const a = Math.PI + ((tt - 44.35) / (breakAt - 44.35)) * Math.PI * 2;
          return [bx + Math.cos(a) * 250, by + Math.sin(a) * 170];
        }
        const u = easeOutCubic(ramp(tt, breakAt, breakAt + 0.4));
        return [lerp(bx - 250, 1150, u), lerp(by, 620, u)];
      };
      for (let i = 12; i >= 0; i--) {
        const p = pos(t - i * 0.03);
        tracer += `<circle cx="${p[0]}" cy="${p[1]}" r="${16 - i}" fill="${C.cyan}" opacity="${0.55 * (1 - i / 12) * trOp}"/>`;
      }
      const p = pos(t);
      tracer += `<g filter="url(#glowCyan)" opacity="${trOp}"><circle cx="${p[0]}" cy="${p[1]}" r="17" fill="${C.cyan}"/></g>`;
    }
    const credit = `<text x="40" y="172" font-family="${SANS}" font-size="17" fill="#fff" opacity="0.7">Photo: Dietmar Rabich / Wikimedia Commons · CC BY-SA 4.0</text>`;
    return ph.svg + quotes + tracer + noBlock + shards + credit;
  }

  // 9 · 45.5–47.496 · Loop closer — back to the padlock; hook title reassembles (matches frame 1)
  function sLoop(t, L) {
    const end = 47.496;
    const settle = easeInOutCubic(ramp(t, 45.5, end - 0.35));
    const ph = photo(IMG.padlock, { ...HOOK_PHOTO, scale: lerp(1.24, HOOK_PHOTO.scale, settle), dy: lerp(-110, HOOK_PHOTO.dy, settle) });
    const resolved = ramp(t, 45.7, 46.95);
    const flick = t < 46.95 ? Math.floor(t * 20) : 0;
    return ph.svg + hookTitle(resolved, flick, ramp(t, 45.56, 45.75), (1 - resolved) * 14);
  }

  // ================= timeline =================
  const SCENES = [
    { id: 'hook', start: 0.0, end: 3.95, draw: sHook, accent: C.red },
    { id: 'agent', start: 3.95, end: 11.45, draw: sAgent, accent: C.cyan, x: 0.35 },
    { id: 'portal', start: 11.45, end: 17.62, draw: sPortal, accent: C.cyan, x: 0.3 },
    { id: 'files', start: 17.62, end: 20.7, draw: sFiles, accent: C.red, x: 0.25, glitchIn: 0.5 },
    { id: 'findings', start: 20.7, end: 26.8, draw: sFindings, accent: C.amber, x: 0.35 },
    { id: 'delay', start: 26.8, end: 36.4, draw: sDelay, accent: C.red, x: 0.2, glitchIn: 1 },
    { id: 'pm', start: 36.4, end: 41.35, draw: sPM, accent: C.amber, x: 0.35 },
    { id: 'quote', start: 41.35, end: 45.5, draw: sQuote, accent: C.cyan, x: 0.35 },
    { id: 'loop', start: 45.5, end: 47.6, draw: sLoop, accent: C.red, x: 0.2, glitchIn: 0.8 },
  ];
  const IMPACTS = [
    [2.88, 22, 0.55],
    [14.86, 16, 0.3],
    [25.02, 8, 0],
    [38.72, 10, 0],
    [43.84, 12, 0.12],
    [44.9, 14, 0.25],
  ];

  // ================= captions =================
  function buildCaps(words) {
    const groups = [];
    let cur = [];
    const chars = (g) => g.map((w) => w.word).join(' ').length;
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (cur.length) {
        const prev = cur[cur.length - 1];
        const endSent = /[.?!…”]$/.test(prev.word);
        const comma = /,$/.test(prev.word) && cur.length >= 2;
        // keep proper names together ("Prime Minister Anthony Albanese")
        const name = /^[A-Z]/.test(prev.word) && /^[A-Z]/.test(w.word) && !/[.,]$/.test(prev.word) && cur.length > 1;
        // a group may stretch to finish its sentence ("…to hack anything.")
        const finishes = /[.?!”]$/.test(w.word) && cur.length <= 6;
        const tooLong = chars(cur.concat([w])) > (finishes ? 42 : name ? 34 : 32) || cur.length >= (finishes ? 7 : 6);
        if (endSent || comma || tooLong || w.start - prev.end > 0.5) {
          groups.push(cur);
          cur = [];
        }
      }
      cur.push(w);
    }
    if (cur.length) groups.push(cur);
    return groups.map((g, i) => {
      const next = groups[i + 1];
      const start = g[0].start - 0.05;
      const end = Math.min(g[g.length - 1].end + 0.4, next ? next[0].start - 0.06 : Infinity);
      return { words: g, start, end };
    });
  }

  function captionSvg(cap, t, accent) {
    const age = t - cap.start;
    const pop = easeOutBack(ramp(age, 0, 0.16));
    const op = ramp(age, 0, 0.06) * (1 - ramp(t, cap.end - 0.08, cap.end));
    if (op <= 0) return '';
    // two-line wrap at ~18 chars
    const lines = [[]];
    let n = 0;
    for (const w of cap.words) {
      if (n && n + w.word.length + 1 > 18 && lines.length < 2) {
        lines.push([]);
        n = 0;
      }
      lines[lines.length - 1].push(w);
      n += w.word.length + 1;
    }
    const size = 62;
    const lh = 76;
    const y0 = CAP_Y - ((lines.length - 1) * lh) / 2 + size * 0.35;
    const txt = lines
      .map((ln, li) => {
        const spans = ln
          .map((w) => {
            const active = t >= w.start - 0.03 && t < w.end + 0.08;
            return `<tspan fill="${active ? accent : C.white}">${esc(w.word)}</tspan>`;
          })
          .join(' ');
        return `<text x="540" y="${y0 + li * lh}" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="${size}"
          stroke="#000" stroke-width="12" stroke-linejoin="round" paint-order="stroke" filter="url(#capShadow)">${spans}</text>`;
      })
      .join('');
    return `<g opacity="${op}" transform="translate(540 ${CAP_Y}) scale(${lerp(0.86, 1, pop)}) translate(-540 ${-CAP_Y})">
      <rect x="0" y="${CAP_Y - 150}" width="${W}" height="300" fill="url(#capBand)"/>
      ${txt}</g>`;
  }

  // ================= global defs & ambience =================
  const tone = (r, g, b, ar = 0, ag = 0, ab = 0) =>
    `${0.2126 * r} ${0.7152 * r} ${0.0722 * r} 0 ${ar} ${0.2126 * g} ${0.7152 * g} ${0.0722 * g} 0 ${ag} ${0.2126 * b} ${0.7152 * b} ${0.0722 * b} 0 ${ab} 0 0 0 1 0`;
  const DEFS = `<defs>
    <filter id="cyanTone" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${tone(0.35, 0.95, 1.15, 0.0, 0.02, 0.05)}"/></filter>
    <filter id="redTone" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${tone(1.25, 0.28, 0.32, 0.03, 0, 0.01)}"/></filter>
    <filter id="coldTone" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0.35"/><feComponentTransfer><feFuncB type="linear" slope="1.12"/></feComponentTransfer></filter>
    <filter id="deepBlue" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0.85"/></filter>
    <filter id="onlyR"><feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter>
    <filter id="onlyB"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"/></filter>
    <filter id="blur14" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="glowRed" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="glowCyan" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="capShadow" x="-10%" y="-40%" width="120%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.7"/></filter>
    <linearGradient id="scanTrail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.cyan}" stop-opacity="0"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0.35"/></linearGradient>
    <linearGradient id="fadeDown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.75"/></linearGradient>
    <linearGradient id="capBand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="0.5" stop-color="#000" stop-opacity="0.42"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <radialGradient id="vig" cx="50%" cy="45%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.75"/></radialGradient>
    <radialGradient id="redVig" cx="50%" cy="45%" r="75%"><stop offset="40%" stop-color="${C.red}" stop-opacity="0"/><stop offset="100%" stop-color="${C.red}" stop-opacity="0.55"/></radialGradient>
    <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.3" fill="#000"/></pattern>
  </defs>`;

  function dust(t) {
    let s = '';
    for (let i = 0; i < 26; i++) {
      const x = rnd(i * 4.1) * W + Math.sin(t * 0.4 + i) * 20;
      const y = H - (((rnd(i * 9.2) * H + t * (18 + rnd(i) * 30)) % (H + 40)));
      s += `<rect x="${x}" y="${y}" width="3" height="3" fill="${C.cyan}" opacity="${0.12 + 0.15 * rnd(i * 2.2)}"/>`;
    }
    return s;
  }

  function sceneLayer(sc, t) {
    const local = Math.max(0, t - sc.start);
    return sc.draw(t, local) || '';
  }

  window.renderFrame = function (t) {
    const ep = window.EPISODE;
    UID = 0;
    const root = document.getElementById('root');
    // scenes with true crossfades (incoming fades in on top across the seam)
    let body = '';
    let glitchAmt = 0;
    for (let i = 0; i < SCENES.length; i++) {
      const sc = SCENES[i];
      const next = SCENES[i + 1];
      const X = sc.x || 0;
      const inStart = sc.start - X / 2;
      const outEnd = next ? next.start + (next.x || 0) / 2 : sc.end;
      if (t < inStart || t >= outEnd) continue;
      let layer = sceneLayer(sc, t);
      if (X > 0 && t < sc.start + X / 2) {
        const a = easeInOutCubic(ramp(t, inStart, sc.start + X / 2));
        layer = `<g opacity="${a}">${layer}</g>`;
      }
      body += layer;
      if (sc.glitchIn) {
        const d = Math.abs(t - sc.start);
        glitchAmt = Math.max(glitchAmt, sc.glitchIn * (1 - ramp(d, 0, 0.22)));
      }
    }
    // impact shake + flash
    let sx = 0;
    let sy = 0;
    let flash = 0;
    for (const [at, amp, fl] of IMPACTS) {
      const q = t - at;
      if (q < 0 || q > 0.45) continue;
      const k = Math.exp(-q * 11);
      sx += Math.sin(q * 90) * amp * k;
      sy += Math.cos(q * 77) * amp * 0.6 * k;
      flash = Math.max(flash, fl * (1 - ramp(q, 0, 0.14)));
      glitchAmt = Math.max(glitchAmt, at === 2.88 ? 0.9 * (1 - ramp(q, 0.05, 0.3)) : 0);
    }
    if (t >= 27.0 && t < 27.35) glitchAmt = Math.max(glitchAmt, 0.7 * (1 - ramp(t, 27.0, 27.35)));
    body = `<g transform="translate(${sx} ${sy})">${body}</g>`;
    if (glitchAmt > 0.02) body = glitch(body, glitchAmt, Math.floor(t * 30));

    // caption accent follows the current beat
    let accent = C.cyan;
    for (const sc of SCENES) if (t >= sc.start) accent = sc.accent;
    if (t >= 14.7 && t < 17.62) accent = C.red; // portal turns hostile on 'blocked'
    if (!ep._s08caps) ep._s08caps = buildCaps(ep.words || []);
    let caps = '';
    for (const c of ep._s08caps) {
      if (t >= c.start && t < c.end) {
        caps = captionSvg(c, t, accent);
        break;
      }
    }
    root.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      ${DEFS}
      <rect width="${W}" height="${H}" fill="${C.ink}"/>
      ${body}
      ${dust(t)}
      <rect width="${W}" height="${H}" fill="url(#vig)"/>
      <rect width="${W}" height="${H}" fill="url(#scan)" opacity="0.09"/>
      ${flash > 0 ? `<rect width="${W}" height="${H}" fill="#fff" opacity="${flash}"/>` : ''}
      ${caps}
    </svg>`;
  };

  const preload = Promise.all(
    Object.values(IMG).map(
      (im) =>
        new Promise((res) => {
          const el = new Image();
          el.onload = () => (el.decode ? el.decode().then(res, res) : res());
          el.onerror = res;
          el.src = im.url;
        })
    )
  );

  window.EPISODE = {
    duration: 47.496,
    fps: 30,
    images: Object.fromEntries(Object.entries(IMG).map(([k, v]) => [k, v.url])),
    words: [],
    scenes: SCENES,
    preload,
  };
})();
