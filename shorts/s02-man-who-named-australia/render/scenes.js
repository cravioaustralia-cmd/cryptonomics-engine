/* s02-man-who-named-australia — premium rebuild (Issue #6)
   Stack: SVG + renderFrame(t) + Playwright + ffmpeg. No Remotion.
   Look: full-bleed photo underlay on EVERY beat (graded, focal-point Ken Burns) + designed SVG motion graphics.
   On-screen text ONLY: names, places, key facts, artifact text, frame-1 hook "200 YEARS".
   Captions (engine, transcript.json) sit at ~70%; all MG lives in y 150–1200 so the caption band stays clear.
   All timings below are absolute seconds, synced to transcript.json word starts. */
(function () {
  const W = 1080;
  const H = 1920;

  // ---------------------------------------------------------------- assets
  const IMG = {
    portrait: '/img/s02_01_matthew_flinders.jpg', // 1941×2500 PD portrait of Flinders
    chart: '/img/s02_02_flinders_general.jpg', // 1827×2500 Flinders' "Chart of Terra Australis" (1802-3)
    investigator: '/img/s02_03_hms_investigator.jpg', // 1024×683 HMS Investigator model
    statue: '/img/s02_04_trim_cat_statue.jpg', // 1875×2500 Flinders + Trim statue
    portLouis: '/img/s02_06_mauritius_coast.jpg', // 1024×768 Port Louis harbour, Mauritius
    book: '/img/s02_07_voyage_terra.jpg', // 2500×1380 A Voyage to Terra Australis binding
    euston: '/img/s02_08_euston_station.jpg', // 1024×690 London Euston platform
    dig: '/img/s02_09_archaeological.jpg', // 683×1024 urban excavation trench
    village: '/img/s02_10_english_village.jpg', // 640×430 flat Lincolnshire parish
  };
  const SIZE = {
    portrait: [1941, 2500],
    chart: [1827, 2500],
    investigator: [1024, 683],
    statue: [1875, 2500],
    portLouis: [1024, 768],
    book: [2500, 1380],
    euston: [1024, 690],
    dig: [683, 1024],
    village: [640, 430],
  };

  // ---------------------------------------------------------------- palette + type
  const C = {
    ink: '#07101c',
    navy: '#0d1b2e',
    gold: '#e7b85a',
    goldHi: '#ffd98a',
    parchment: '#efe2c2',
    red: '#b3262d',
    redInk: '#c8323a',
    sea: '#7cc6d8',
    white: '#f7f3ea',
  };
  const F = {
    bebas: "'Bebas Neue', 'Arial Narrow', sans-serif",
    serif: "'Cormorant Garamond', Georgia, serif",
    cinzel: "Cinzel, 'Cormorant Garamond', serif",
    mono: "'IBM Plex Mono', 'DejaVu Sans Mono', monospace",
    sans: "Montserrat, 'Liberation Sans', sans-serif",
  };

  // ---------------------------------------------------------------- math
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const prog = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const eOut = (u) => 1 - Math.pow(1 - u, 3);
  const eOut5 = (u) => 1 - Math.pow(1 - u, 5);
  const eIn = (u) => u * u * u;
  const eInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const eBack = (u) => {
    const c1 = 1.70158;
    return 1 + (c1 + 1) * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
  };
  const eElastic = (u) =>
    u === 0 || u === 1 ? u : Math.pow(2, -10 * u) * Math.sin((u * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  // window: 0 before a, ramps to 1 by a+inD, holds, ramps to 0 over outD ending at b
  const win = (t, a, b, inD = 0.4, outD = 0.4) => Math.min(eOut(prog(t, a, a + inD)), 1 - eInOut(prog(t, b - outD, b)));
  function rand(i) {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  // decaying camera shake
  function shake(t, t0, dur, amp) {
    if (t < t0 || t > t0 + dur) return [0, 0];
    const k = 1 - (t - t0) / dur;
    return [Math.sin(t * 91) * amp * k * k, Math.cos(t * 77) * amp * k * k];
  }
  let _uid = 0;
  const uid = (p) => `${p}${++_uid}`;
  const f1 = (n) => Math.round(n * 10) / 10;

  // ---------------------------------------------------------------- photo layers
  /** Full-bleed photo with focal-point framing: image point (fx,fy) lands on screen (tx,ty). */
  function photo(key, o = {}) {
    const [iw, ih] = SIZE[key];
    const zoom = o.zoom || 1;
    const s = Math.max(W / iw, H / ih) * zoom;
    const w = iw * s;
    const h = ih * s;
    let x = (o.tx != null ? o.tx : 540) - (o.fx != null ? o.fx : 0.5) * w;
    let y = (o.ty != null ? o.ty : 960) - (o.fy != null ? o.fy : 0.5) * h;
    x = clamp(x, W - w, 0);
    y = clamp(y, H - h, 0);
    const filt = o.grade ? ` filter="url(#g-${o.grade}${o.blur ? '-blur' : ''})"` : '';
    const dim = o.dim != null ? o.dim : 0.45;
    return `<g opacity="${o.opacity != null ? o.opacity : 1}">
      <image href="${IMG[key]}" x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" preserveAspectRatio="none"${filt}/>
      ${dim > 0 ? `<rect width="${W}" height="${H}" fill="${o.tint || '#000'}" opacity="${dim}"/>` : ''}
    </g>`;
  }
  /**
   * Low-res landscape stills: blurred full-bleed fill + a sharper feathered band on top,
   * so the frame is photographic edge-to-edge without a mushy 3× upscale.
   */
  function photoBand(key, o = {}) {
    const [iw, ih] = SIZE[key];
    const fw = o.fgW || 1700;
    const fh = (fw * ih) / iw;
    const fx = o.fx != null ? o.fx : 0.5;
    const x = clamp((o.tx != null ? o.tx : 540) - fx * fw, W - fw, 0);
    const y = (o.bandY != null ? o.bandY : 760) - fh / 2;
    const grade = o.grade || 'cool';
    return `${photo(key, { zoom: o.bgZoom || 1.08, fx, fy: o.fy, grade, blur: true, dim: 0, tx: o.tx, ty: o.bandY })}
      <image href="${IMG[key]}" x="${f1(x)}" y="${f1(y)}" width="${f1(fw)}" height="${f1(fh)}"
        preserveAspectRatio="none" filter="url(#g-${grade})" mask="url(#fadeV)"/>
      <rect width="${W}" height="${H}" fill="${o.tint || '#000'}" opacity="${o.dim != null ? o.dim : 0.45}"/>`;
  }

  // ---------------------------------------------------------------- type components
  /** Masked slide-up reveal of any markup inside a clip box. */
  function reveal(inner, x, y, w, h, p, fromY = 1) {
    if (p <= 0) return '';
    const id = uid('rv');
    const dy = (1 - eOut5(p)) * h * fromY;
    return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>
      <g clip-path="url(#${id})"><g transform="translate(0 ${f1(dy)})">${inner}</g></g>`;
  }

  /** Lower-third nameplate: hairline rule + mono kicker + big serif name (left aligned). */
  function nameplate(kicker, name, x, y, t, t0, opts = {}) {
    const size = opts.size || 92;
    const out = opts.tOut != null ? 1 - eInOut(prog(t, opts.tOut, opts.tOut + 0.45)) : 1;
    if (t < t0 || out <= 0) return '';
    const rule = eOut5(prog(t, t0, t0 + 0.6));
    const pk = prog(t, t0 + 0.1, t0 + 0.6);
    const pn = prog(t, t0 + 0.22, t0 + 0.85);
    const ruleW = opts.ruleW || 560;
    return `<g opacity="${out}">
      <rect x="${x}" y="${y}" width="${f1(ruleW * rule)}" height="3" fill="${C.gold}"/>
      <rect x="${x}" y="${y - 6}" width="3" height="${f1(15 * rule)}" fill="${C.gold}"/>
      ${reveal(`<text x="${x}" y="${y - 22}" font-family="${F.mono}" font-weight="600" font-size="28" letter-spacing="9" fill="${C.goldHi}">${kicker}</text>`, x - 4, y - 60, 900, 50, pk)}
      ${reveal(`<text x="${x - 4}" y="${y + size * 0.92}" font-family="${F.serif}" font-weight="700" font-size="${size}" fill="${C.white}" style="filter:url(#softShadow)">${name}</text>`, x - 10, y + 6, 1000, size * 1.18, pn)}
    </g>`;
  }

  /** Location tag: map pin pops, Bebas label wipes up, hairline underline draws. */
  function placeTag(label, x, y, t, t0, opts = {}) {
    const out = opts.tOut != null ? 1 - eInOut(prog(t, opts.tOut, opts.tOut + 0.4)) : 1;
    if (t < t0 || out <= 0) return '';
    const pin = eBack(prog(t, t0, t0 + 0.45));
    const pl = prog(t, t0 + 0.12, t0 + 0.7);
    const line = eOut5(prog(t, t0 + 0.25, t0 + 0.9));
    const size = opts.size || 72;
    const lw = opts.lineW || label.length * size * 0.42 + 40;
    const col = opts.color || C.white;
    const sub = opts.sub
      ? reveal(`<text x="${x + 64}" y="${y + 58}" font-family="${F.mono}" font-weight="500" font-size="24" letter-spacing="7" fill="${C.goldHi}">${opts.sub}</text>`, x + 60, y + 30, 900, 40, prog(t, t0 + 0.4, t0 + 1.0))
      : '';
    return `<g opacity="${out}">
      <g transform="translate(${x + 22} ${y - size * 0.34}) scale(${f1(pin * 100) / 100})">
        <path d="M0,-30 C-17,-30 -26,-17 -26,-5 C-26,13 0,34 0,34 C0,34 26,13 26,-5 C26,-17 17,-30 0,-30 Z" fill="${C.gold}"/>
        <circle cx="0" cy="-6" r="9" fill="${C.ink}"/>
      </g>
      ${reveal(`<text x="${x + 64}" y="${y}" font-family="${F.bebas}" font-size="${size}" letter-spacing="6" fill="${col}" style="filter:url(#softShadow)">${label}</text>`, x + 60, y - size, 1000, size * 1.08, pl)}
      <rect x="${x + 64}" y="${y + 14}" width="${f1(lw * line)}" height="2" fill="${C.gold}" opacity="0.9"/>
      ${sub}
    </g>`;
  }

  /** Big numeral slam with echo ghosts and a shock ring. */
  function slamText(text, cx, cy, t, t0, opts = {}) {
    if (t < t0 - 0.001) return '';
    const size = opts.size || 220;
    const p = prog(t, t0, t0 + (opts.dur || 0.42));
    const sc = lerp(opts.from || 1.9, 1, eOut5(p));
    const op = clamp(p * 3, 0, 1);
    const ring = prog(t, t0 + 0.12, t0 + 0.9);
    const col = opts.color || C.goldHi;
    const ghosts = [0.18, 0.1]
      .map(
        (g, i) =>
          `<text x="${cx}" y="${cy}" text-anchor="middle" font-family="${F.bebas}" font-size="${size}" letter-spacing="${opts.ls || 4}" fill="none" stroke="${col}" stroke-width="2" opacity="${f1((1 - p) * g * 10) / 10}" transform="translate(${cx} ${cy - size * 0.35}) scale(${1 + (i + 1) * 0.08 * (1 - p) * 3}) translate(${-cx} ${-(cy - size * 0.35)})">${text}</text>`
      )
      .join('');
    return `<g opacity="${op}">
      ${ring > 0 && ring < 1 ? `<ellipse cx="${cx}" cy="${cy - size * 0.35}" rx="${f1(200 + ring * 420)}" ry="${f1(60 + ring * 130)}" fill="none" stroke="${col}" stroke-width="${f1(6 * (1 - ring))}" opacity="${f1((1 - ring) * 0.8 * 100) / 100}"/>` : ''}
      ${ghosts}
      <g transform="translate(${cx} ${cy - size * 0.35}) scale(${sc}) translate(${-cx} ${-(cy - size * 0.35)})">
        <text x="${cx}" y="${cy}" text-anchor="middle" font-family="${F.bebas}" font-size="${size}" letter-spacing="${opts.ls || 4}" fill="${col}" style="filter:url(#glowGold)">${text}</text>
      </g>
    </g>`;
  }

  /** Rubber ink stamp: impact scale-down, rough ink edges, splatter. */
  function inkStamp(text, cx, cy, rot, t, t0, opts = {}) {
    if (t < t0) return '';
    const p = prog(t, t0, t0 + 0.2);
    const sc = lerp(2.4, 1, eIn(p)) + (p >= 1 ? 0.04 * Math.exp(-(t - t0 - 0.2) * 14) * Math.sin((t - t0) * 60) : 0);
    const size = opts.size || 130;
    const col = opts.color || C.redInk;
    const w = opts.w || text.length * size * 0.5 + 90;
    const h = size * 1.12;
    const splat = [];
    if (p >= 1) {
      const sp = prog(t, t0 + 0.2, t0 + 0.55);
      for (let i = 0; i < 16; i++) {
        const a = rand(i + 3) * Math.PI * 2;
        const d = (w * 0.5 + 20 + rand(i + 9) * 120) * eOut(sp);
        splat.push(`<circle cx="${f1(Math.cos(a) * d)}" cy="${f1(Math.sin(a) * d * 0.45)}" r="${f1(2 + rand(i) * 7)}" fill="${col}" opacity="${f1(0.75 * 100) / 100}"/>`);
      }
    }
    return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${f1(sc * 1000) / 1000})" opacity="${clamp(p * 4, 0, 1)}">
      <g style="filter:url(#roughInk)">
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="10" fill="none" stroke="${col}" stroke-width="10"/>
        <rect x="${-w / 2 + 16}" y="${-h / 2 + 16}" width="${w - 32}" height="${h - 32}" rx="6" fill="none" stroke="${col}" stroke-width="3"/>
        <text x="0" y="${size * 0.35}" text-anchor="middle" font-family="${F.bebas}" font-size="${size}" letter-spacing="8" fill="${col}">${text}</text>
      </g>
      ${splat.join('')}
    </g>`;
  }

  /** Focus reticle: corner brackets converge, tick ring spins. */
  function reticle(cx, cy, r, t, t0, opts = {}) {
    if (t < t0) return '';
    const p = eOut5(prog(t, t0, t0 + 0.55));
    const out = opts.tOut != null ? 1 - prog(t, opts.tOut, opts.tOut + 0.35) : 1;
    const rr = r * lerp(1.8, 1, p);
    const col = opts.color || C.goldHi;
    const L = r * 0.38;
    const corners = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]
      .map(
        ([sx, sy]) =>
          `<path d="M${sx * rr},${sy * (rr - L)} L${sx * rr},${sy * rr} L${sx * (rr - L)},${sy * rr}" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`
      )
      .join('');
    const ticks = [];
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const r1 = rr * 0.82;
      const r2 = r1 - (i % 4 === 0 ? 14 : 6);
      ticks.push(`M${f1(Math.cos(a) * r1)},${f1(Math.sin(a) * r1)} L${f1(Math.cos(a) * r2)},${f1(Math.sin(a) * r2)}`);
    }
    return `<g transform="translate(${cx} ${cy})" opacity="${p * out}">
      ${corners}
      <g transform="rotate(${f1((t - t0) * 24)})"><path d="${ticks.join(' ')}" stroke="${col}" stroke-width="2" opacity="0.7"/></g>
      <circle r="${f1(rr * 0.82)}" fill="none" stroke="${col}" stroke-width="1.5" opacity="0.5" stroke-dasharray="3 9"/>
    </g>`;
  }

  /** Floating dust motes lit by the scene. */
  function motes(t, n, seed, opts = {}) {
    const out = [];
    const col = opts.color || '#ffe6b0';
    const y0 = opts.y0 != null ? opts.y0 : 120;
    const y1 = opts.y1 != null ? opts.y1 : 1250;
    for (let i = 0; i < n; i++) {
      const r = rand(i + seed);
      const x = (rand(i * 3 + seed) * 1200 - 60 + Math.sin(t * 0.4 + i) * 30 + t * (opts.wind || 8)) % 1140;
      const span = y1 - y0;
      const y = y0 + ((rand(i * 7 + seed) * span - t * (12 + r * 18)) % span + span) % span;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.8 + r) + i));
      out.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(1.2 + r * 2.6)}" fill="${col}" opacity="${f1(tw * (opts.alpha || 0.5) * 100) / 100}"/>`);
    }
    return out.join('');
  }

  // ---------------------------------------------------------------- geography
  // Simplified Australian coastline (lon, lat), clockwise from Cape York.
  const AUS = [
    [142.5, -10.7], [143.5, -12.5], [143.8, -14.0], [145.3, -14.9], [145.5, -16.3], [146.1, -18.3],
    [146.9, -19.2], [148.8, -20.3], [149.5, -22.3], [150.8, -22.6], [151.3, -24.0], [153.1, -25.3],
    [153.2, -26.6], [153.6, -28.2], [153.1, -30.3], [152.5, -32.3], [151.3, -33.8], [150.8, -35.0],
    [150.1, -36.3], [149.9, -37.5], [148.2, -37.8], [146.4, -39.1], [145.0, -38.5], [144.0, -38.4],
    [142.4, -38.4], [140.9, -38.0], [139.8, -37.3], [139.6, -36.1], [138.5, -35.6], [138.1, -34.2],
    [137.8, -35.1], [136.9, -35.3], [137.4, -34.0], [137.8, -32.6], [136.0, -34.0], [135.6, -34.9],
    [135.2, -34.5], [134.2, -33.0], [133.5, -32.2], [131.2, -31.5], [129.0, -31.7], [126.0, -32.3],
    [124.0, -33.0], [123.5, -33.9], [121.9, -33.8], [119.9, -34.0], [117.9, -35.1], [116.5, -35.0],
    [115.0, -34.3], [115.6, -33.3], [115.7, -32.0], [115.0, -30.0], [114.6, -28.8], [114.2, -26.3],
    [113.4, -25.6], [113.7, -24.0], [113.7, -22.7], [114.1, -21.8], [116.0, -20.8], [117.8, -20.6],
    [119.0, -20.0], [121.0, -19.5], [122.2, -18.0], [122.9, -16.4], [124.4, -15.5], [125.2, -14.5],
    [126.5, -13.9], [127.8, -14.3], [128.1, -14.9], [129.5, -14.9], [130.0, -13.5], [130.6, -12.4],
    [132.2, -11.3], [133.5, -11.8], [135.0, -12.2], [136.0, -12.0], [136.8, -12.2], [136.4, -13.3],
    [135.4, -15.0], [137.0, -15.9], [138.3, -16.8], [139.3, -17.4], [140.8, -17.4], [141.4, -16.0],
    [141.6, -14.0], [141.6, -12.6], [142.0, -11.0],
  ];
  const TAS = [
    [144.6, -40.7], [146.6, -41.1], [148.3, -40.9], [148.3, -42.2], [147.9, -43.2], [146.9, -43.6],
    [146.0, -43.5], [145.2, -42.2], [144.7, -41.0],
  ];
  const COS = Math.cos((26 * Math.PI) / 180);
  function projector(cx, cy, k, lon0 = 133.5, lat0 = -26) {
    return ([lo, la]) => [cx + (lo - lon0) * COS * k, cy - (la - lat0) * k];
  }
  function polyD(pts, proj, close = true) {
    return pts.map((p, i) => {
      const [x, y] = proj(p);
      return `${i ? 'L' : 'M'}${f1(x)},${f1(y)}`;
    }).join('') + (close ? 'Z' : '');
  }
  // Flinders' 1802-03 circumnavigation: anticlockwise from Cape Leeuwin, pushed offshore.
  const ROUTE = (() => {
    const start = AUS.findIndex((p) => p[0] === 115.0 && p[1] === -34.3);
    const pts = [];
    for (let i = 0; i <= AUS.length; i += 1) {
      const p = AUS[(start - i + AUS.length * 2) % AUS.length];
      if (i % 2 === 0 || i === AUS.length) pts.push(p);
    }
    const c = [134, -25.5];
    return pts.map(([lo, la]) => [c[0] + (lo - c[0]) * 1.09, c[1] + (la - c[1]) * 1.09]);
  })();
  function polyLen(xy) {
    const acc = [0];
    for (let i = 1; i < xy.length; i++) acc.push(acc[i - 1] + Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]));
    return acc;
  }
  function alongPoly(xy, acc, u) {
    const L = acc[acc.length - 1] * clamp(u, 0, 1);
    let i = 1;
    while (i < acc.length - 1 && acc[i] < L) i++;
    const a = xy[i - 1];
    const b = xy[i];
    const seg = acc[i] - acc[i - 1] || 1;
    const k = (L - acc[i - 1]) / seg;
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), Math.atan2(b[1] - a[1], b[0] - a[0])];
  }
  function partialD(xy, acc, u) {
    const L = acc[acc.length - 1] * clamp(u, 0, 1);
    let d = `M${f1(xy[0][0])},${f1(xy[0][1])}`;
    for (let i = 1; i < xy.length; i++) {
      if (acc[i] <= L) d += `L${f1(xy[i][0])},${f1(xy[i][1])}`;
      else {
        const k = (L - acc[i - 1]) / (acc[i] - acc[i - 1] || 1);
        d += `L${f1(lerp(xy[i - 1][0], xy[i][0], k))},${f1(lerp(xy[i - 1][1], xy[i][1], k))}`;
        break;
      }
    }
    return d;
  }

  // ---------------------------------------------------------------- props
  /** Side-on square-rigger silhouette (HMS Investigator-style sloop), origin at waterline centre. */
  function shipIcon(col = C.white) {
    return `<g>
      <path d="M-34,0 L36,0 L28,10 L-28,10 Z" fill="${col}"/>
      <path d="M-34,0 L-40,-6 L-30,-2 Z" fill="${col}"/>
      <path d="M-14,-2 L-14,-40 M6,-2 L6,-46 M24,-2 L24,-34" stroke="${col}" stroke-width="2.4"/>
      <path d="M-24,-34 Q-14,-30 -4,-34 L-5,-12 Q-14,-9 -23,-12 Z M-4,-40 Q6,-36 16,-40 L15,-14 Q6,-11 -3,-14 Z M16,-29 Q24,-26 32,-29 L31,-10 Q24,-8 17,-10 Z" fill="${col}" opacity="0.92"/>
      <path d="M6,-46 L10,-43 L6,-40" fill="${C.redInk}"/>
    </g>`;
  }

  /** Trim — black ship's cat with white paws and a white star on his breast (per Flinders' own tribute). */
  function trimCat(opts = {}) {
    const rim = opts.rim || C.gold;
    return `<g>
      <path d="M150,238 C200,236 214,178 188,150 C176,138 166,146 176,158 C194,178 184,214 150,222 Z" fill="#0b0b0e" stroke="${rim}" stroke-width="2" stroke-opacity="0.7"/>
      <path d="M62,92 C22,118 14,214 36,246 L154,246 C178,212 166,128 110,92 Z" fill="#0b0b0e" stroke="${rim}" stroke-width="2.5" stroke-opacity="0.8"/>
      <path d="M40,58 L46,10 L74,34 Z M86,32 L112,8 L114,58 Z" fill="#0b0b0e" stroke="${rim}" stroke-width="2.5" stroke-opacity="0.8"/>
      <ellipse cx="78" cy="64" rx="44" ry="40" fill="#0b0b0e" stroke="${rim}" stroke-width="2.5" stroke-opacity="0.8"/>
      <ellipse cx="62" cy="60" rx="6" ry="${opts.blink ? 1 : 7}" fill="#d8c24a"/>
      <ellipse cx="94" cy="60" rx="6" ry="${opts.blink ? 1 : 7}" fill="#d8c24a"/>
      <path d="M78,128 L83,140 L96,141 L86,149 L90,162 L78,154 L66,162 L70,149 L60,141 L73,140 Z" fill="#fff"/>
      <ellipse cx="62" cy="244" rx="20" ry="8" fill="#fff"/>
      <ellipse cx="104" cy="244" rx="20" ry="8" fill="#fff"/>
    </g>`;
  }

  function pawPrint(x, y, rot, op) {
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot})" opacity="${f1(op * 100) / 100}" fill="${C.goldHi}">
      <ellipse cx="0" cy="6" rx="11" ry="9"/>
      <circle cx="-11" cy="-8" r="4.5"/><circle cx="-4" cy="-14" r="4.5"/><circle cx="4" cy="-14" r="4.5"/><circle cx="11" cy="-8" r="4.5"/>
    </g>`;
  }

  // ================================================================= SCENES
  // 1 · HOOK (0–7.10) — Euston platform; "200 YEARS" on frame 1; ground-radar cutaway finds a coffin.
  function sHook(t) {
    const zoom = lerp(1.42, 1.2, eOut(prog(t, 0, 7.1)));
    const [sx, sy] = shake(t, 0, 0.5, 14);
    const cutIn = eOut5(prog(t, 1.0, 1.9));
    const scanU = eInOut(prog(t, 2.0, 4.7));
    const scanX = lerp(90, 990, scanU);
    const found = prog(t, 5.15, 5.6);
    const gy = 880; // ground line
    // strata bands
    const strata = [
      [gy, 44, '#2a2119', 0.9],
      [gy + 44, 70, '#3a2d20', 0.86],
      [gy + 114, 90, '#2d2319', 0.9],
      [gy + 204, 110, '#211a13', 0.92],
    ];
    const clipId = uid('cut');
    const scanClip = uid('scan');
    const coffinX = 610;
    const coffinY = gy + 205;
    const coffin = `<path d="M${coffinX - 150},${coffinY} L${coffinX - 120},${coffinY - 34} L${coffinX + 150},${coffinY - 26} L${coffinX + 170},${coffinY} L${coffinX + 150},${coffinY + 26} L${coffinX - 120},${coffinY + 34} Z"`;
    // GPR hyperbola echoes centred on the coffin
    const hyp = [0, 1, 2]
      .map((k) => {
        const pts = [];
        for (let i = -20; i <= 20; i++) {
          const x = coffinX + i * 22;
          const y = coffinY - 60 + k * 26 + Math.sqrt(900 + (i * 22) * (i * 22)) * 0.55 - 16;
          pts.push(`${i === -20 ? 'M' : 'L'}${x},${f1(y)}`);
        }
        return `<path d="${pts.join('')}" fill="none" stroke="${C.sea}" stroke-width="${3 - k}" opacity="${0.8 - k * 0.2}"/>`;
      })
      .join('');
    const pulse = found > 0 ? 1 + 0.06 * Math.sin((t - 5.15) * 10) * (1 - prog(t, 5.6, 6.6)) : 1;
    const endFade = 1 - eInOut(prog(t, 6.6, 7.1));
    return `<g transform="translate(${f1(sx)} ${f1(sy)})">
      ${photoBand('euston', { fx: 0.26, tx: 520, bandY: 700, fgW: lerp(2050, 1780, eOut(prog(t, 0, 7.1))), grade: 'cool', dim: 0.5 })}
      <rect width="${W}" height="${H}" fill="url(#topShade)"/>
      <g opacity="${endFade}">
        <!-- hook: frame-1 legible -->
        <g transform="translate(540 380) scale(${f1(lerp(1.14, 1, eOut5(prog(t, 0, 0.4))) * 1000) / 1000}) translate(-540 -380)">
          <text x="540" y="470" text-anchor="middle" font-family="${F.bebas}" font-size="300" letter-spacing="6" fill="${C.goldHi}" style="filter:url(#glowGold)">200</text>
          <text x="540" y="560" text-anchor="middle" font-family="${F.bebas}" font-size="110" letter-spacing="38" fill="${C.white}" style="filter:url(#softShadow)">YEARS</text>
        </g>
        ${placeTag('LONDON', 300, 700, t, 3.3, { size: 60, lineW: 190 })}
        <!-- ground-radar cutaway -->
        <g opacity="${cutIn}">
          <clipPath id="${clipId}"><rect x="60" y="${gy - 4}" width="960" height="${f1(330 * cutIn)}" rx="8"/></clipPath>
          <g clip-path="url(#${clipId})">
            ${strata.map(([y, h, c, o]) => `<rect x="60" y="${y}" width="960" height="${h}" fill="${c}" opacity="${o}"/>`).join('')}
            ${Array.from({ length: 70 }, (_, i) => `<circle cx="${f1(70 + rand(i) * 940)}" cy="${f1(gy + 50 + rand(i + 40) * 270)}" r="${f1(2 + rand(i + 80) * 5)}" fill="#5a4632" opacity="0.7"/>`).join('')}
            <clipPath id="${scanClip}"><rect x="60" y="${gy}" width="${f1(scanX - 60)}" height="340"/></clipPath>
            <g clip-path="url(#${scanClip})">${hyp}
              ${coffin} fill="rgba(124,198,216,0.12)" stroke="${C.sea}" stroke-width="3" stroke-dasharray="10 6"/>
            </g>
            ${found > 0 ? `<g transform="translate(${coffinX} ${coffinY}) scale(${pulse}) translate(${-coffinX} ${-coffinY})">${coffin} fill="rgba(231,184,90,${f1(0.25 * found * 100) / 100})" stroke="${C.goldHi}" stroke-width="4" style="filter:url(#glowGold)"/></g>` : ''}
            ${scanU > 0 && scanU < 1 ? `<rect x="${f1(scanX - 2)}" y="${gy}" width="4" height="340" fill="${C.sea}"/><rect x="${f1(scanX - 60)}" y="${gy}" width="60" height="340" fill="url(#scanGlow)"/>` : ''}
          </g>
          <rect x="60" y="${gy - 4}" width="960" height="6" fill="${C.parchment}" opacity="0.85"/>
          <rect x="60" y="${gy - 4}" width="960" height="${f1(330 * cutIn)}" rx="8" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
        </g>
      </g>
    </g>`;
  }

  // 2 · FLINDERS (7.10–9.40) — portrait push-in, museum frame line draws, nameplate.
  function sPortrait(t) {
    const u = prog(t, 7.1, 9.4);
    const frame = eInOut(prog(t, 7.2, 8.2));
    const per = 2 * (900 + 1060);
    return `${photo('portrait', { zoom: lerp(1.08, 1.2, eOut(u)), fx: 0.4, fy: 0.33, tx: 540, ty: lerp(600, 580, u), grade: 'warm', dim: 0.22 })}
      <rect width="${W}" height="${H}" fill="url(#bottomShade)"/>
      <rect x="90" y="160" width="900" height="1060" fill="none" stroke="${C.gold}" stroke-width="2" stroke-dasharray="${per}" stroke-dashoffset="${f1(per * (1 - frame))}" opacity="0.8"/>
      ${nameplate('CAPTAIN', 'Matthew Flinders', 110, 1010, t, 7.25, { size: 100, ruleW: 520 })}`;
  }

  // 3 · CIRCUMNAVIGATION (9.40–12.25) — Investigator photo underlay; chart-style Australia with ship loop.
  function sVoyage(t) {
    const k = 17.5;
    const cx = 540;
    const cy = 560;
    const proj = projector(cx, cy, k);
    const mapIn = eOut5(prog(t, 9.4, 10.0));
    const routeXY = ROUTE.map(proj);
    const acc = polyLen(routeXY);
    const u = eInOut(prog(t, 9.55, 11.45));
    const [shx, shy, ang] = alongPoly(routeXY, acc, u);
    const flip = Math.cos(ang) < 0 ? -1 : 1;
    const coastDraw = eInOut(prog(t, 9.4, 10.3));
    const gridLines = [];
    for (let lo = 110; lo <= 160; lo += 10) {
      const [x] = proj([lo, -26]);
      gridLines.push(`<line x1="${f1(x)}" y1="210" x2="${f1(x)}" y2="920"/>`);
    }
    for (let la = -10; la >= -45; la -= 10) {
      const [, y] = proj([133, la]);
      gridLines.push(`<line x1="90" y1="${f1(y)}" x2="990" y2="${f1(y)}"/>`);
    }
    const labelP = prog(t, 10.9, 11.4);
    const cardIn = eOut5(prog(t, 9.9, 10.5));
    return `${photoBand('investigator', { fx: 0.52, tx: 560, bandY: 1090, fgW: lerp(1500, 1620, prog(t, 9.4, 12.25)), grade: 'cool', dim: 0.58 })}
      <rect width="${W}" height="${H}" fill="url(#topShade)"/>
      <g opacity="${mapIn}" transform="translate(0 ${f1((1 - mapIn) * 40)})">
        <rect x="90" y="190" width="900" height="720" rx="18" fill="rgba(7,16,28,0.72)" stroke="rgba(231,184,90,0.55)" stroke-width="2"/>
        <g stroke="rgba(124,198,216,0.16)" stroke-width="1.2">${gridLines.join('')}</g>
        <path d="${polyD(AUS, proj)}" fill="rgba(239,226,194,${f1(0.14 * coastDraw * 100) / 100})" stroke="${C.parchment}" stroke-width="3" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${f1((1 - coastDraw) * 1000) / 1000}" stroke-linejoin="round"/>
        <path d="${polyD(TAS, proj)}" fill="rgba(239,226,194,${f1(0.14 * coastDraw * 100) / 100})" stroke="${C.parchment}" stroke-width="3" opacity="${coastDraw}"/>
        <path d="${partialD(routeXY, acc, u)}" fill="none" stroke="${C.gold}" stroke-width="4" stroke-dasharray="12 9" stroke-linecap="round" style="filter:url(#glowGold)"/>
        ${u > 0 ? `<circle cx="${f1(routeXY[0][0])}" cy="${f1(routeXY[0][1])}" r="8" fill="${C.gold}"/>` : ''}
        ${u > 0 && u < 1 ? `<g transform="translate(${f1(shx)} ${f1(shy)}) scale(${0.9 * flip} 0.9)"><circle r="46" fill="rgba(231,184,90,0.18)"/>${shipIcon(C.white)}</g>` : ''}
        ${u >= 1 ? `<circle cx="${f1(routeXY[0][0])}" cy="${f1(routeXY[0][1])}" r="${f1(10 + 40 * prog(t, 11.45, 12.1))}" fill="none" stroke="${C.goldHi}" stroke-width="3" opacity="${f1(1 - prog(t, 11.45, 12.1))}"/>` : ''}
        ${reveal(`<text x="540" y="${cy + 30}" text-anchor="middle" font-family="${F.bebas}" font-size="96" letter-spacing="18" fill="${C.white}" style="filter:url(#softShadow)">AUSTRALIA</text>`, 200, cy - 60, 700, 110, labelP)}
      </g>
      <g opacity="${cardIn}" transform="translate(0 ${f1((1 - cardIn) * 30)})">
        ${placeTag('HMS INVESTIGATOR', 100, 1015, t, 10.0, { size: 58, lineW: 430 })}
      </g>`;
  }

  // 4 · TRIM (12.25–16.25) — statue push toward the bronze cat; paw trail; reticle; TRIM collar tag.
  function sTrim(t) {
    const u = eInOut(prog(t, 12.25, 15.6));
    const zoom = lerp(1.05, 2.35, u);
    const fx = lerp(0.5, 0.65, u);
    const fy = lerp(0.45, 0.535, u);
    const ty = lerp(760, 720, u);
    // screen position of the bronze cat after framing
    const [iw, ih] = SIZE.statue;
    const s = Math.max(W / iw, H / ih) * zoom;
    let x0 = clamp(540 - fx * iw * s, W - iw * s, 0);
    let y0 = clamp(ty - fy * ih * s, H - ih * s, 0);
    const catX = x0 + 0.65 * iw * s;
    const catY = y0 + 0.535 * ih * s;
    const paws = [];
    for (let i = 0; i < 9; i++) {
      const tp = 12.4 + i * 0.17;
      if (t < tp) continue;
      const op = Math.min(prog(t, tp, tp + 0.15), 1 - prog(t, 14.2, 14.8));
      paws.push(pawPrint(140 + i * 95, 330 + (i % 2) * 44 - i * 6, 90, op * 0.85));
    }
    const tagP = prog(t, 15.15, 15.6);
    const swing = 14 * Math.exp(-(t - 15.15) * 3.2) * Math.cos((t - 15.15) * 9);
    return `${photo('statue', { zoom, fx, fy, tx: 540, ty, grade: 'warm', dim: 0.32 })}
      <rect width="${W}" height="${H}" fill="url(#topShade)"/>
      ${paws.join('')}
      ${reticle(catX, catY, 150, t, 14.3, { tOut: 15.9 })}
      ${t >= 15.15 ? `<g transform="translate(300 200) rotate(${f1(swing)})" opacity="${eOut(tagP)}">
        <line x1="0" y1="-80" x2="0" y2="0" stroke="${C.gold}" stroke-width="3"/>
        <circle r="92" cy="80" fill="url(#brass)" stroke="${C.goldHi}" stroke-width="4" style="filter:url(#softShadow)"/>
        <circle r="78" cy="80" fill="none" stroke="rgba(60,40,10,0.45)" stroke-width="2"/>
        <text y="97" text-anchor="middle" font-family="${F.cinzel}" font-weight="700" font-size="48" letter-spacing="2" fill="#3a2608">TRIM</text>
      </g>` : ''}`;
  }

  // 5 · MAURITIUS (16.25–24.15) — Port Louis; route map; bars slam; tally 6½ years; Trim fades away.
  function sMauritius(t) {
    const [sx, sy] = shake(t, 18.22, 0.55, 22);
    // mini map: Indian Ocean, Sydney → Torres Strait → Timor → Mauritius
    const mk = 8.6;
    const proj = projector(0, 0, mk, 103, -25);
    const mapX = 540;
    const mapY = 400;
    const mp = (p) => {
      const [x, y] = proj(p);
      return [mapX + x, mapY + y];
    };
    const legs = [[151.2, -33.9], [153.4, -27], [146.5, -18.5], [142.2, -10.5], [131, -9.5], [124.5, -10.2], [110, -14], [85, -19], [70, -20.5], [57.6, -20.2]];
    const legXY = legs.map(mp);
    const acc = polyLen(legXY);
    const mapIn = eOut5(prog(t, 16.3, 16.9));
    const mapDim = 1 - 0.55 * prog(t, 18.0, 18.4);
    const u = eInOut(prog(t, 16.5, 19.5));
    const [shx, shy] = alongPoly(legXY, acc, u);
    const [mx, my] = mp([57.5, -20.2]);
    const ping = prog(t, 19.5, 20.3);
    // bars
    const barsP = prog(t, 18.05, 18.3);
    const barsY = lerp(-1500, 0, eIn(barsP)) + (barsP >= 1 ? -18 * Math.exp(-(t - 18.3) * 9) * Math.cos((t - 18.3) * 30) : 0);
    const bars = [];
    for (let i = 0; i < 7; i++) {
      const x = 70 + i * 157;
      bars.push(`<rect x="${x - 20}" y="0" width="40" height="1290" fill="url(#ironBar)"/>
        <rect x="${x + 20}" y="0" width="14" height="1290" fill="rgba(0,0,0,0.35)"/>`);
    }
    const rivets = [];
    for (let i = 0; i < 7; i++) {
      for (const yy of [212, 1062]) rivets.push(`<circle cx="${70 + i * 157}" cy="${yy + 20}" r="9" fill="#9aa3ab" stroke="#2c3136" stroke-width="3"/>`);
    }
    // tally marks 6 + a half
    const tally = [];
    for (let i = 0; i < 7; i++) {
      const tp = 20.28 + i * 0.12;
      const p = eOut(prog(t, tp, tp + 0.14));
      const half = i === 6;
      const x = 330 + i * 62;
      const y1 = 640;
      const len = half ? 70 : 140;
      tally.push(`<line x1="${x}" y1="${y1}" x2="${f1(x + 6)}" y2="${f1(y1 + len * p)}" stroke="#fff6e0" stroke-width="14" stroke-linecap="round" opacity="${p > 0 ? 1 : 0}" style="filter:url(#glowGold)"/>`);
    }
    const tallyOut = 1 - prog(t, 22.0, 22.4);
    // Trim fades into particles
    const catIn = eOut(prog(t, 21.9, 22.3));
    const dissolve = prog(t, 22.6, 23.9);
    const specks = [];
    if (dissolve > 0) {
      for (let i = 0; i < 60; i++) {
        const d = dissolve * (0.6 + rand(i) * 0.8);
        specks.push(`<circle cx="${f1(740 + rand(i + 5) * 220 - 110 + d * (60 + rand(i + 2) * 180))}" cy="${f1(930 + rand(i + 11) * 240 - 120 - d * (200 + rand(i + 7) * 260))}" r="${f1(2 + rand(i + 1) * 4)}" fill="${C.gold}" opacity="${f1(clamp(1 - d, 0, 1) * 0.9 * 100) / 100}"/>`);
      }
    }
    const blink = Math.abs(t - 22.45) < 0.06;
    return `<g transform="translate(${f1(sx)} ${f1(sy)})">
      ${photoBand('portLouis', { fx: 0.45, tx: 540, bandY: 720, fgW: lerp(1560, 1700, prog(t, 16.25, 24.15)), grade: 'cool', dim: lerp(0.4, 0.62, prog(t, 18, 18.4)) })}
      <rect width="${W}" height="${H}" fill="url(#topShade)"/>
      <g opacity="${mapIn * mapDim * (1 - prog(t, 20.0, 20.3))}">
        <rect x="90" y="190" width="900" height="400" rx="18" fill="rgba(7,16,28,0.74)" stroke="rgba(231,184,90,0.55)" stroke-width="2"/>
        <clipPath id="mmc"><rect x="90" y="190" width="900" height="400" rx="18"/></clipPath>
        <g clip-path="url(#mmc)">
          <path d="${polyD(AUS, mp)}" fill="rgba(239,226,194,0.16)" stroke="${C.parchment}" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="${polyD(TAS, mp)}" fill="rgba(239,226,194,0.16)" stroke="${C.parchment}" stroke-width="2.5"/>
          <path d="${partialD(legXY, acc, u)}" fill="none" stroke="${C.gold}" stroke-width="3.5" stroke-dasharray="10 8" stroke-linecap="round"/>
          ${u > 0 && u < 1 ? `<g transform="translate(${f1(shx)} ${f1(shy)}) scale(-0.7 0.7)">${shipIcon(C.white)}</g>` : ''}
          <circle cx="${f1(mx)}" cy="${f1(my)}" r="9" fill="${C.redInk}" opacity="${prog(t, 19.3, 19.5)}"/>
          ${ping > 0 && ping < 1 ? `<circle cx="${f1(mx)}" cy="${f1(my)}" r="${f1(10 + ping * 60)}" fill="none" stroke="${C.redInk}" stroke-width="3" opacity="${f1(1 - ping)}"/>` : ''}
        </g>
      </g>
      ${barsP > 0 ? `<g transform="translate(0 ${f1(barsY)})">
        <rect x="0" y="0" width="${W}" height="1290" fill="url(#cellShade)"/>
        ${bars.join('')}
        <rect x="0" y="212" width="${W}" height="40" fill="url(#ironBarH)"/>
        <rect x="0" y="1062" width="${W}" height="40" fill="url(#ironBarH)"/>
        ${rivets.join('')}
        <rect x="0" y="1270" width="${W}" height="30" fill="url(#barFloor)"/>
      </g>` : ''}
      ${placeTag('MAURITIUS', 120, 150, t, 19.45, { size: 78, lineW: 330 })}
      <g opacity="${tallyOut}">
        ${t >= 20.28 ? `<rect x="280" y="600" width="520" height="230" rx="10" fill="rgba(7,16,28,0.86)" stroke="rgba(231,184,90,0.5)" stroke-width="2"/>` : ''}
        ${tally.join('')}
        ${slamText('6½ YEARS', 540, 1010, t, 21.0, { size: 150, from: 1.6, color: C.white })}
      </g>
      ${catIn > 0 ? `<g transform="translate(640 800) scale(1.05)" opacity="${f1(catIn * (1 - dissolve) * 100) / 100}">${trimCat({ blink })}</g>` : ''}
      ${specks.join('')}
    </g>`;
  }

  // 6 · THE NAME (24.15–29.45) — Flinders' own chart: "TERRA AUSTRALIS" → struck → AUSTRALIA stamp.
  function sName(t) {
    const u = prog(t, 24.15, 29.45);
    const zoom = lerp(1.35, 2.15, eInOut(prog(t, 24.15, 27.0)));
    // title block of the chart sits at ~(0.52, 0.27) of the image
    const [iw, ih] = SIZE.chart;
    const s = Math.max(W / iw, H / ih) * zoom;
    const tx = 540;
    const ty = 560;
    const x0 = clamp(tx - 0.52 * iw * s, W - iw * s, 0);
    const y0 = clamp(ty - 0.27 * ih * s, H - ih * s, 0);
    const titleL = x0 + 0.39 * iw * s;
    const titleR = x0 + 0.654 * iw * s;
    const titleY = y0 + 0.27 * ih * s;
    const hl = eOut5(prog(t, 25.6, 26.3));
    const strike = eInOut(prog(t, 26.6, 27.3));
    const [sx, sy] = shake(t, 28.18, 0.45, 18);
    return `<g transform="translate(${f1(sx)} ${f1(sy)})">
      ${photo('chart', { zoom, fx: 0.52, fy: 0.27, tx, ty, grade: 'parchment', dim: lerp(0.18, 0.34, u) })}
      <rect width="${W}" height="${H}" fill="url(#topShade)"/>
      ${placeTag('ENGLAND', 110, 190, t, 24.4, { size: 66, lineW: 250, tOut: 27.8 })}
      ${hl > 0 ? `<rect x="${f1(titleL - 18)}" y="${f1(titleY - 46)}" width="${f1((titleR - titleL + 36) * hl)}" height="70" fill="rgba(231,184,90,0.28)" stroke="${C.gold}" stroke-width="2"/>` : ''}
      ${strike > 0 ? `<path d="M${f1(titleL - 24)},${f1(titleY - 8)} L${f1(lerp(titleL - 24, titleR + 24, strike))},${f1(titleY - 14)}" stroke="${C.redInk}" stroke-width="9" stroke-linecap="round" style="filter:url(#roughInk)"/>` : ''}
      ${inkStamp('AUSTRALIA', 540, 860, -7, t, 28.18, { size: 150 })}
    </g>`;
  }

  // 7 · THE BOOK (29.45–33.20) — the real 1814 binding: spine label → title card → JULY 1814 stamp.
  function sBook(t) {
    const u = eInOut(prog(t, 29.45, 33.2));
    const fy = lerp(0.3, 0.42, u);
    const zoom = lerp(2.6, 2.1, u);
    const card = eOut5(prog(t, 29.6, 30.2));
    const cardY = lerp(1300, 0, card);
    const typeP = prog(t, 30.72, 31.3);
    const dateText = 'JULY 1814'.slice(0, Math.round(typeP * 9));
    return `${photo('book', { zoom, fx: 0.5, fy, tx: 540, ty: 700, grade: 'warm', dim: 0.4 })}
      <rect width="${W}" height="${H}" fill="url(#topShade)"/>
      <g transform="translate(0 ${f1(cardY)}) rotate(${f1(lerp(6, -2, card))} 540 700)" opacity="${card}">
        <rect x="200" y="300" width="680" height="800" rx="4" fill="url(#paper)" style="filter:url(#softShadow)"/>
        <rect x="230" y="330" width="620" height="740" fill="none" stroke="rgba(90,60,20,0.55)" stroke-width="2"/>
        <text x="540" y="470" text-anchor="middle" font-family="${F.cinzel}" font-weight="600" font-size="34" letter-spacing="6" fill="#3b2a14">A VOYAGE</text>
        <text x="540" y="520" text-anchor="middle" font-family="${F.serif}" font-style="italic" font-weight="600" font-size="34" fill="#3b2a14">to</text>
        <text x="540" y="600" text-anchor="middle" font-family="${F.cinzel}" font-weight="700" font-size="60" letter-spacing="3" fill="#2a1b08">TERRA</text>
        <text x="540" y="672" text-anchor="middle" font-family="${F.cinzel}" font-weight="700" font-size="60" letter-spacing="3" fill="#2a1b08">AUSTRALIS</text>
        <path d="M380,720 L700,720 M430,732 L650,732" stroke="#6b4a1e" stroke-width="2"/>
        <text x="540" y="800" text-anchor="middle" font-family="${F.serif}" font-style="italic" font-weight="600" font-size="30" fill="#3b2a14">by</text>
        <text x="540" y="850" text-anchor="middle" font-family="${F.cinzel}" font-weight="600" font-size="36" letter-spacing="4" fill="#2a1b08">MATTHEW FLINDERS</text>
        <text x="540" y="1010" text-anchor="middle" font-family="${F.cinzel}" font-weight="600" font-size="28" letter-spacing="8" fill="#3b2a14">LONDON</text>
      </g>
      ${t >= 30.72 ? `<g>
        <rect x="560" y="1030" width="400" height="92" rx="6" fill="rgba(7,16,28,0.86)" stroke="${C.gold}" stroke-width="2"/>
        <text x="760" y="1094" text-anchor="middle" font-family="${F.mono}" font-weight="600" font-size="54" letter-spacing="6" fill="${C.goldHi}">${dateText}${typeP < 1 && Math.floor(t * 6) % 2 ? '▌' : ''}</text>
      </g>` : ''}
      ${inkStamp('1814', 330, 1000, -12, t, 31.35, { size: 96, w: 260 })}`;
  }

  // 8 · THE NEXT DAY (33.20–35.85) — portrait drains to mono; a candle gutters out; smoke. No text.
  function sCandle(t) {
    const out = prog(t, 34.72, 34.95);
    const lit = 1 - out;
    const flick = 1 + 0.06 * Math.sin(t * 23) + 0.04 * Math.sin(t * 37 + 1);
    const lean = 3 * Math.sin(t * 5.3);
    const cx = 540;
    const top = 760;
    const smoke = [];
    if (t > 34.8) {
      for (let k = 0; k < 4; k++) {
        const age = t - 34.8 - k * 0.12;
        if (age <= 0) continue;
        const pts = [];
        for (let i = 0; i <= 18; i++) {
          const yy = top - 40 - i * 22 * Math.min(1, age * 1.4);
          const xx = cx + Math.sin(i * 0.55 + t * 2.4 + k) * (6 + i * 2.2) + k * 4;
          pts.push(`${i ? 'L' : 'M'}${f1(xx)},${f1(yy)}`);
        }
        smoke.push(`<path d="${pts.join('')}" fill="none" stroke="rgba(220,220,225,${f1(clamp(0.5 - age * 0.28, 0, 0.5) * 100) / 100})" stroke-width="${5 + k * 2}" stroke-linecap="round" style="filter:url(#blur4)"/>`);
      }
    }
    const glowR = 360 * flick;
    return `${photo('portrait', { zoom: lerp(1.25, 1.34, prog(t, 33.2, 35.85)), fx: 0.4, fy: 0.3, tx: 540, ty: 520, grade: 'mono', dim: lerp(0.5, 0.78, prog(t, 34.6, 35.6)) })}
      <circle cx="${cx}" cy="${top - 60}" r="${f1(glowR)}" fill="url(#candleGlow)" opacity="${f1(lit * 0.9 * 100) / 100}"/>
      <g>
        <ellipse cx="${cx}" cy="1170" rx="190" ry="34" fill="url(#brass)"/>
        <ellipse cx="${cx}" cy="1160" rx="160" ry="24" fill="#6b4a1e"/>
        <path d="M${cx - 34},1160 L${cx - 34},1120 Q${cx},1108 ${cx + 34},1120 L${cx + 34},1160 Z" fill="url(#brass)"/>
        <rect x="${cx - 70}" y="${top}" width="140" height="380" rx="8" fill="url(#wax)"/>
        <path d="M${cx - 70},${top + 10} Q${cx - 74},${top + 60} ${cx - 64},${top + 90} Q${cx - 58},${top + 40} ${cx - 50},${top + 12} Z M${cx + 34},${top + 6} Q${cx + 40},${top + 70} ${cx + 48},${top + 120} Q${cx + 56},${top + 60} ${cx + 58},${top + 8} Z" fill="#efe6d2"/>
        <ellipse cx="${cx}" cy="${top + 4}" rx="70" ry="12" fill="#f6efe0"/>
        <path d="M${cx},${top + 2} q-3,-14 1,-26" stroke="#1b140c" stroke-width="5" fill="none" stroke-linecap="round"/>
        ${lit > 0 ? `<g transform="translate(${cx} ${top - 22}) rotate(${f1(lean)}) scale(${f1(lit * 0.9 + 0.1)} ${f1(lit * flick)})">
          <path d="M0,-150 C22,-96 40,-50 30,-14 C22,10 -22,10 -30,-14 C-40,-50 -22,-96 0,-150 Z" fill="url(#flame)" style="filter:url(#blur2)"/>
          <path d="M0,-90 C10,-60 16,-34 12,-16 C8,-2 -8,-2 -12,-16 C-16,-34 -10,-60 0,-90 Z" fill="#fffbe8"/>
          <ellipse cx="0" cy="-10" rx="10" ry="14" fill="rgba(90,150,255,0.55)"/>
        </g>` : ''}
        ${smoke.join('')}
      </g>`;
  }

  // 9 · LONDON (35.85–46.50) — burial ground (sepia) → terraces rise → headstone lifted → Euston swallows it.
  function sLondon(t) {
    const colourIn = eInOut(prog(t, 40.75, 41.6));
    const horizon = 820;
    const [sx, sy] = shake(t, 43.45, 0.5, 10);
    // headstone rows in perspective
    const stones = [];
    const sink = eIn(prog(t, 41.2, 42.5));
    for (let r = 0; r < 4; r++) {
      const z = r / 3; // 0 far → 1 near
      const y = lerp(horizon + 30, 1180, z);
      const sc = lerp(0.42, 1.2, z);
      const n = 7 - r;
      for (let i = 0; i < n; i++) {
        const isFl = r === 2 && i === 2;
        const x = 540 + (i - (n - 1) / 2) * lerp(120, 230, z) + (rand(r * 10 + i) - 0.5) * 30;
        const rise = eBack(prog(t, 35.95 + r * 0.12 + i * 0.05, 36.4 + r * 0.12 + i * 0.05));
        let lift = 0;
        let op = 1;
        if (isFl) {
          lift = eInOut(prog(t, 39.25, 40.2)) * 300;
          op = 1 - prog(t, 39.8, 40.3);
        }
        const h = 120 * sc;
        const w = 64 * sc;
        const dy = y - h * rise + sink * h * 1.1 - lift;
        const tilt = (rand(r * 7 + i) - 0.5) * 10;
        stones.push(`<g transform="translate(${f1(x)} ${f1(dy)}) rotate(${f1(tilt + (isFl ? lift * 0.04 : 0))})" opacity="${f1(op * 100) / 100}">
          <path d="M${-w / 2},${h} L${-w / 2},${w * 0.5} A${w / 2},${w / 2} 0 0 1 ${w / 2},${w * 0.5} L${w / 2},${h} Z" fill="${isFl ? '#2a2418' : '#15130f'}" stroke="${isFl ? C.goldHi : 'rgba(231,184,90,0.35)'}" stroke-width="${isFl ? 4 : 1.5}"/>
          <path d="M${-w * 0.2},${w * 0.55} L${w * 0.2},${w * 0.55} M0,${w * 0.35} L0,${w * 0.85}" stroke="rgba(231,184,90,0.4)" stroke-width="${f1(2 * sc)}"/>
        </g>`);
      }
    }
    // London terraces rising behind
    const bld = [];
    for (let i = 0; i < 12; i++) {
      const bw = 70 + rand(i + 50) * 60;
      const bx = 20 + i * 88 + rand(i) * 16;
      const bh = 180 + rand(i + 20) * 240;
      const p = eOut5(prog(t, 38.1 + i * 0.07, 38.8 + i * 0.07));
      const y = horizon - bh * p;
      const win = [];
      for (let wy = 0; wy < Math.floor(bh / 44); wy++)
        for (let wx = 0; wx < Math.floor(bw / 26); wx++) {
          const on = rand(i * 100 + wy * 10 + wx) > 0.55 && t > 38.6 + rand(wy + wx + i) * 1.2;
          win.push(`<rect x="${f1(bx + 8 + wx * 26)}" y="${f1(y + 18 + wy * 44)}" width="12" height="20" fill="${on ? '#f4c872' : 'rgba(255,255,255,0.06)'}"/>`);
        }
      bld.push(`<rect x="${f1(bx)}" y="${f1(y)}" width="${f1(bw)}" height="${f1(bh * p)}" fill="#0e1119" stroke="rgba(231,184,90,0.18)"/>
        <rect x="${f1(bx + bw * 0.2)}" y="${f1(y - 26 * p)}" width="14" height="${f1(26 * p)}" fill="#0e1119"/>
        <rect x="${f1(bx + bw * 0.62)}" y="${f1(y - 20 * p)}" width="12" height="${f1(20 * p)}" fill="#0e1119"/>
        ${p > 0.9 ? win.join('') : ''}`);
    }
    // station canopy + tracks slide in
    const st = eOut5(prog(t, 40.8, 41.9));
    const vpx = 540;
    const vpy = 700;
    const rails = [];
    for (let i = -5; i <= 5; i++) {
      rails.push(`<line x1="${vpx}" y1="${vpy}" x2="${f1(vpx + i * 260)}" y2="1300" stroke="rgba(200,215,230,0.5)" stroke-width="${3 + Math.abs(i) * 0.5}"/>`);
    }
    const girders = [];
    for (let i = 0; i < 7; i++) {
      const z = Math.pow(i / 6, 1.6);
      const y = lerp(vpy - 20, 150, z);
      const hw = lerp(40, 620, z);
      girders.push(`<path d="M${vpx - hw},${f1(y)} L${vpx + hw},${f1(y)}" stroke="rgba(230,235,245,0.55)" stroke-width="${f1(2 + z * 6)}"/>`);
    }
    const searchP = prog(t, 43.4, 45.6);
    const searchX = 540 + Math.sin(searchP * Math.PI * 2.4) * 280;
    const searchOp = Math.min(prog(t, 43.4, 43.7), 1 - prog(t, 45.6, 46.1));
    const clipId = uid('st');
    return `<g transform="translate(${f1(sx)} ${f1(sy)})">
      ${photoBand('euston', { fx: 0.62, tx: 540, bandY: 820, fgW: lerp(1800, 1950, prog(t, 35.85, 46.5)), grade: 'sepia', dim: 0.52 })}
      ${colourIn > 0 ? `<g opacity="${colourIn}">${photoBand('euston', { fx: 0.62, tx: 540, bandY: 820, fgW: lerp(1800, 1950, prog(t, 35.85, 46.5)), grade: 'cool', dim: 0.5 })}</g>` : ''}
      <rect width="${W}" height="${H}" fill="url(#topShade)"/>
      <g opacity="${1 - colourIn * 0.85}">
        ${bld.join('')}
        <rect x="0" y="${horizon}" width="${W}" height="430" fill="url(#groundFade)"/>
      </g>
      <clipPath id="${clipId}"><rect x="0" y="0" width="${W}" height="1240"/></clipPath>
      <g clip-path="url(#${clipId})" opacity="${1 - sink * 0.9}">${stones.join('')}</g>
      ${st > 0 ? `<g opacity="${st * 0.9}" transform="translate(0 ${f1((1 - st) * -300)})">${girders.join('')}</g>
        <g opacity="${st * 0.8}" clip-path="url(#${clipId})">${rails.join('')}</g>` : ''}
      ${placeTag('LONDON', 110, 200, t, 36.6, { size: 72, lineW: 230, tOut: 40.4 })}
      ${placeTag('EUSTON STATION', 110, 200, t, 41.25, { size: 72, lineW: 470 })}
      ${searchOp > 0 ? `<g opacity="${searchOp}">
        ${reticle(searchX, 1010, 110, t, 43.4, { color: 'rgba(255,255,255,0.85)' })}
        <circle cx="${f1(searchX)}" cy="1010" r="6" fill="#fff"/>
      </g>` : ''}
    </g>`;
  }

  // 10 · THE DIG (46.50–56.80) — excavation; 2019 slam; 40,000 burials dot-matrix; lead plate reveal.
  function sDig(t) {
    const [sx, sy] = shake(t, 46.56, 0.45, 16);
    const u = prog(t, 46.5, 56.8);
    const plateMode = prog(t, 53.1, 53.6);
    // dirt bursts from the trench
    const dirt = [];
    for (const b of [48.6, 49.5, 50.4]) {
      const a = t - b;
      if (a < 0 || a > 1.3) continue;
      for (let i = 0; i < 26; i++) {
        const ang = -Math.PI / 2 + (rand(i + b * 10) - 0.5) * 1.8;
        const v = 500 + rand(i + 3 + b) * 520;
        const x = 470 + Math.cos(ang) * v * a;
        const y = 1080 + Math.sin(ang) * v * a + 900 * a * a;
        dirt.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${f1(6 + rand(i) * 12)}" height="${f1(5 + rand(i + 1) * 9)}" transform="rotate(${f1(a * 400 + i * 30)} ${f1(x)} ${f1(y)})" fill="${i % 3 ? '#6b5238' : '#8a6c4a'}" opacity="${f1((1 - a / 1.3) * 100) / 100}"/>`);
      }
    }
    // 40,000 counter + dot matrix (400 dots × 100)
    const cp = eOut(prog(t, 50.95, 52.3));
    const count = Math.round(cp * 40000);
    const countStr = count.toLocaleString('en-AU');
    const dots = [];
    const lit = Math.floor(cp * 400);
    if (t > 50.9) {
      for (let i = 0; i < 400; i++) {
        const col = i % 25;
        const row = Math.floor(i / 25);
        dots.push(`<circle cx="${230 + col * 25}" cy="${560 + row * 25}" r="${i < lit ? 7.5 : 3}" fill="${i < lit ? C.parchment : 'rgba(255,255,255,0.18)'}"/>`);
      }
    }
    const countOut = 1 - prog(t, 52.9, 53.3);
    // lead plate
    const flip = eOut5(prog(t, 53.3, 54.3));
    const sxp = Math.max(0.02, Math.abs(Math.cos((1 - flip) * Math.PI * 0.5)));
    const px = 540;
    const py = 760;
    const engrave1 = prog(t, 54.4, 54.85);
    const engrave2 = prog(t, 54.85, 55.8);
    const glint = prog(t, 55.9, 56.6);
    const plateId = uid('pl');
    const e1 = uid('e1');
    const e2 = uid('e2');
    const platePath = `M${px - 330},${py - 190} Q${px},${py - 236} ${px + 330},${py - 190} L${px + 344},${py + 150} Q${px},${py + 214} ${px - 344},${py + 150} Z`;
    return `<g transform="translate(${f1(sx)} ${f1(sy)})">
      ${photo('dig', { zoom: lerp(1.12, 1.28, u), fx: 0.5, fy: 0.62, tx: 540, ty: 1000, grade: 'warm', dim: lerp(0.42, 0.72, plateMode) })}
      ${t < 46.8 ? `<rect width="${W}" height="${H}" fill="#fff" opacity="${f1((1 - prog(t, 46.5, 46.8)) * 0.8 * 100) / 100}"/>` : ''}
      <rect width="${W}" height="${H}" fill="url(#topShade)"/>
      ${dirt.join('')}
      <g opacity="${1 - prog(t, 50.6, 50.95)}">${slamText('2019', 540, 480, t, 46.56, { size: 300 })}</g>
      ${t > 50.9 ? `<g opacity="${countOut}">
        <rect x="190" y="220" width="700" height="630" rx="18" fill="rgba(7,16,28,0.72)" stroke="rgba(231,184,90,0.5)" stroke-width="2"/>
        <text x="540" y="410" text-anchor="middle" font-family="${F.bebas}" font-size="190" letter-spacing="4" fill="${C.goldHi}" style="filter:url(#glowGold)">${countStr}</text>
        <text x="540" y="480" text-anchor="middle" font-family="${F.mono}" font-weight="600" font-size="34" letter-spacing="16" fill="${C.parchment}">BURIALS</text>
        <g transform="translate(0 20)">${dots.join('')}</g>
      </g>` : ''}
      ${flip > 0 ? `<g transform="translate(${px} ${py}) scale(${f1(sxp * 1000) / 1000} 1) rotate(${f1((1 - flip) * -8)}) translate(${-px} ${-py})">
        <clipPath id="${plateId}"><path d="${platePath}"/></clipPath>
        <path d="${platePath}" fill="url(#lead)" style="filter:url(#softShadow)"/>
        <g clip-path="url(#${plateId})">
          <rect x="${px - 360}" y="${py - 240}" width="720" height="460" fill="#fff" opacity="0.08" style="filter:url(#patina)"/>
          ${glint > 0 && glint < 1 ? `<rect x="${f1(lerp(px - 700, px + 500, glint))}" y="${py - 300}" width="120" height="600" fill="url(#glint)" transform="rotate(18 ${px} ${py})"/>` : ''}
        </g>
        <path d="${platePath}" fill="none" stroke="#c9ced3" stroke-width="3" opacity="0.6"/>
        ${[[-300, -170], [300, -170], [-312, 128], [312, 128]].map(([dx, dy]) => `<circle cx="${px + dx}" cy="${py + dy}" r="9" fill="#3b4045" stroke="#9aa1a8" stroke-width="2"/>`).join('')}
        <clipPath id="${e1}"><rect x="${px - 330}" y="${py - 140}" width="${f1(660 * engrave1)}" height="120"/></clipPath>
        <clipPath id="${e2}"><rect x="${px - 340}" y="${py - 10}" width="${f1(680 * engrave2)}" height="150"/></clipPath>
        <g clip-path="url(#${e1})">
          <text x="${px}" y="${py - 44}" text-anchor="middle" font-family="${F.cinzel}" font-weight="700" font-size="84" letter-spacing="10" fill="#e8ecef" opacity="0.35" transform="translate(1.5 2)">CAPTAIN</text>
          <text x="${px}" y="${py - 44}" text-anchor="middle" font-family="${F.cinzel}" font-weight="700" font-size="84" letter-spacing="10" fill="#23272b">CAPTAIN</text>
        </g>
        <g clip-path="url(#${e2})">
          <text x="${px}" y="${py + 80}" text-anchor="middle" font-family="${F.cinzel}" font-weight="700" font-size="52" letter-spacing="3" fill="#e8ecef" opacity="0.35" transform="translate(1.5 2)">MATTHEW FLINDERS</text>
          <text x="${px}" y="${py + 80}" text-anchor="middle" font-family="${F.cinzel}" font-weight="700" font-size="52" letter-spacing="3" fill="#23272b">MATTHEW FLINDERS</text>
        </g>
        ${engrave1 > 0 && engrave1 < 1 ? `<circle cx="${f1(px - 330 + 660 * engrave1)}" cy="${py - 72}" r="10" fill="${C.goldHi}" style="filter:url(#glowGold)"/>` : ''}
        ${engrave2 > 0 && engrave2 < 1 ? `<circle cx="${f1(px - 340 + 680 * engrave2)}" cy="${py + 60}" r="10" fill="${C.goldHi}" style="filter:url(#glowGold)"/>` : ''}
      </g>` : ''}
      ${plateMode > 0 ? motes(t, 30, 7, { alpha: 0.45 * plateMode, y0: 380, y1: 1150 }) : ''}
    </g>`;
  }

  // 11 · HOME (56.80–64.968) — Lincolnshire fields; 2024; DONINGTON; Australia outline closes the loop.
  function sHome(t) {
    const u = prog(t, 56.8, 64.968);
    const loopP = prog(t, 61.3, 62.9);
    const cardOut = 1 - eInOut(prog(t, 61.1, 61.7));
    const card = eOut5(prog(t, 57.0, 57.8));
    const proj = projector(540, 610, 15.5);
    const loopFade = 1 - eInOut(prog(t, 64.3, 64.968));
    const birds = [];
    for (let i = 0; i < 5; i++) {
      const bt = t - 57.2 - i * 0.35;
      if (bt < 0) continue;
      const x = -60 + bt * (110 + i * 14);
      const y = 300 + i * 28 - bt * 8 + Math.sin(bt * 2 + i) * 10;
      const flap = Math.sin(bt * 9 + i) * 8;
      birds.push(`<path d="M${f1(x - 14)},${f1(y - flap)} Q${f1(x - 6)},${f1(y - 4)} ${f1(x)},${f1(y)} Q${f1(x + 6)},${f1(y - 4)} ${f1(x + 14)},${f1(y - flap)}" stroke="#1b1a18" stroke-width="3" fill="none" opacity="${f1((1 - loopP) * 0.8 * 100) / 100}"/>`);
    }
    return `<g opacity="${loopFade}">
      ${photoBand('village', { fx: 0.5, tx: 540, bandY: 760, fgW: lerp(1400, 1560, u), grade: 'golden', dim: lerp(0.18, 0.62, loopP), bgZoom: 1.12 })}
      <circle cx="840" cy="210" r="520" fill="url(#sunFlare)" opacity="${f1((0.7 - loopP * 0.5) * 100) / 100}"/>
      <rect width="${W}" height="${H}" fill="url(#topShade)"/>
      ${birds.join('')}
      <g opacity="${cardOut}">
        ${slamText('2024', 540, 440, t, 56.98, { size: 250, from: 1.5 })}
        ${placeTag('DONINGTON', 110, 1080, t, 58.2, { size: 84, lineW: 330, sub: 'LINCOLNSHIRE · ENGLAND' })}
      </g>
      ${card > 0 && cardOut > 0 ? motes(t, 26, 21, { alpha: 0.55 * cardOut, color: '#fff2c8' }) : ''}
      ${loopP > 0 ? `<g>
        <path d="${polyD(AUS, proj)}" fill="rgba(231,184,90,${f1(0.18 * loopP * 100) / 100})" stroke="${C.goldHi}" stroke-width="4" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${f1((1 - eInOut(loopP)) * 1000) / 1000}" stroke-linejoin="round" style="filter:url(#glowGold)"/>
        <path d="${polyD(TAS, proj)}" fill="rgba(231,184,90,0.18)" stroke="${C.goldHi}" stroke-width="4" opacity="${f1(prog(t, 62.4, 62.9) * 100) / 100}"/>
        ${reveal(`<text x="540" y="1110" text-anchor="middle" font-family="${F.bebas}" font-size="130" letter-spacing="26" fill="${C.white}" style="filter:url(#softShadow)">AUSTRALIA</text>`, 60, 990, 960, 150, prog(t, 62.55, 63.2))}
      </g>` : ''}
    </g>`;
  }

  // ---------------------------------------------------------------- global defs + finishing layer
  function gradeMatrix(kind) {
    switch (kind) {
      case 'cool':
        return '0.62 0.22 0.06 0 -0.02  0.14 0.66 0.14 0 0  0.12 0.26 0.72 0 0.04  0 0 0 1 0';
      case 'warm':
        return '0.95 0.12 0.02 0 0.02  0.06 0.86 0.06 0 0.01  0.02 0.08 0.72 0 -0.01  0 0 0 1 0';
      case 'golden':
        return '1.02 0.14 0.02 0 0.05  0.1 0.88 0.08 0 0.03  0.02 0.1 0.62 0 -0.02  0 0 0 1 0';
      case 'parchment':
        return '0.95 0.1 0.03 0 0.0  0.08 0.86 0.05 0 -0.01  0.05 0.08 0.62 0 -0.04  0 0 0 1 0';
      case 'sepia':
        return '0.39 0.77 0.19 0 0  0.35 0.69 0.17 0 0  0.27 0.53 0.13 0 0  0 0 0 1 0';
      case 'mono':
        return '0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 1 0';
      default:
        return '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0';
    }
  }
  const GRADES = ['cool', 'warm', 'golden', 'parchment', 'sepia', 'mono'];
  const DEFS = `<defs>
    ${GRADES.map((g) => `<filter id="g-${g}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${gradeMatrix(g)}"/></filter>
      <filter id="g-${g}-blur" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="14"/><feColorMatrix type="matrix" values="${gradeMatrix(g)}"/></filter>`).join('')}
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="0.75"/></filter>
    <filter id="glowGold" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="14" result="b"/><feFlood flood-color="#e7b85a" flood-opacity="0.55"/><feComposite in2="b" operator="in" result="g"/><feDropShadow in="SourceGraphic" dx="0" dy="5" stdDeviation="6" flood-color="#000" flood-opacity="0.7" result="s"/><feMerge><feMergeNode in="g"/><feMergeNode in="s"/></feMerge></filter>
    <filter id="roughInk" x="-10%" y="-20%" width="120%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="d"/><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="9" result="n2"/><feColorMatrix in="n2" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.25" result="holes"/><feComposite in="d" in2="holes" operator="in"/></filter>
    <filter id="patina" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="2"/><feColorMatrix type="matrix" values="0 0 0 0 0.85  0 0 0 0 0.9  0 0 0 0 0.92  0 0 0 1.6 -0.6"/></filter>
    <filter id="blur2"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="blur4" x="-50%" y="-10%" width="200%" height="120%"><feGaussianBlur stdDeviation="4"/></filter>
    <linearGradient id="fadeVGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="0.16" stop-color="#fff"/><stop offset="0.84" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
    <mask id="fadeV" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#fadeVGrad)"/></mask>
    <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="0.14" stop-color="#000" stop-opacity="0"/><stop offset="0.62" stop-color="#000" stop-opacity="0"/><stop offset="0.8" stop-color="#000" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0.7"/></linearGradient>
    <linearGradient id="bottomShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="0.62" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0.8"/></linearGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/></radialGradient>
    <linearGradient id="scanGlow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7cc6d8" stop-opacity="0"/><stop offset="1" stop-color="#7cc6d8" stop-opacity="0.35"/></linearGradient>
    <linearGradient id="ironBar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a1d21"/><stop offset="0.35" stop-color="#6e767e"/><stop offset="0.5" stop-color="#9aa3ab"/><stop offset="0.7" stop-color="#3a4046"/><stop offset="1" stop-color="#121417"/></linearGradient>
    <linearGradient id="ironBarH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1d21"/><stop offset="0.4" stop-color="#7d868e"/><stop offset="0.6" stop-color="#4a5157"/><stop offset="1" stop-color="#121417"/></linearGradient>
    <linearGradient id="barFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <radialGradient id="cellShade" cx="0.5" cy="0.45" r="0.7"><stop offset="0.3" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/></radialGradient>
    <radialGradient id="brass" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#ffe3a0"/><stop offset="0.45" stop-color="#d4a24a"/><stop offset="1" stop-color="#7a5418"/></radialGradient>
    <linearGradient id="wax" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9ab90"/><stop offset="0.3" stop-color="#f3ead6"/><stop offset="0.55" stop-color="#fbf5e8"/><stop offset="1" stop-color="#a8997c"/></linearGradient>
    <radialGradient id="flame" cx="0.5" cy="0.7" r="0.6"><stop offset="0" stop-color="#fff6c8"/><stop offset="0.45" stop-color="#ffc24a"/><stop offset="0.85" stop-color="#ff7a1a" stop-opacity="0.7"/><stop offset="1" stop-color="#ff5a00" stop-opacity="0"/></radialGradient>
    <radialGradient id="candleGlow"><stop offset="0" stop-color="#ffcf7a" stop-opacity="0.55"/><stop offset="0.5" stop-color="#ff9a3a" stop-opacity="0.16"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient>
    <linearGradient id="groundFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c0a08" stop-opacity="0.55"/><stop offset="1" stop-color="#0c0a08" stop-opacity="0.9"/></linearGradient>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4ead0"/><stop offset="0.6" stop-color="#e9dbb6"/><stop offset="1" stop-color="#d6c294"/></linearGradient>
    <linearGradient id="lead" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8e969c"/><stop offset="0.35" stop-color="#b5bcc1"/><stop offset="0.6" stop-color="#7c848a"/><stop offset="1" stop-color="#565d63"/></linearGradient>
    <linearGradient id="glint" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="sunFlare"><stop offset="0" stop-color="#ffe7a8" stop-opacity="0.7"/><stop offset="0.35" stop-color="#ffb65c" stop-opacity="0.22"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></radialGradient>
    <radialGradient id="leak" cx="0.2" cy="0.3" r="0.9"><stop offset="0" stop-color="#ffd48a" stop-opacity="0.9"/><stop offset="0.5" stop-color="#ff8a3a" stop-opacity="0.25"/><stop offset="1" stop-color="#ff6a2a" stop-opacity="0"/></radialGradient>
  </defs>`;

  const CUTS = [7.1, 9.4, 12.25, 16.25, 24.15, 29.45, 33.2, 35.85, 46.5, 56.8];

  window.EPISODE = {
    duration: 64.968,
    fps: 30,
    words: [],
    images: IMG,
    transition: 'crossfade',
    xfade: 0.32,
    captionStyle: {
      font: "Montserrat, 'Liberation Sans', sans-serif",
      highlight: '#ffd98a',
      box: 'rgba(7,16,28,0.72)',
      stroke: 'rgba(231,184,90,0.55)',
    },
    scenes: [
      { id: 'hook', start: 0.0, end: 7.1, draw: sHook },
      { id: 'portrait', start: 7.1, end: 9.4, draw: sPortrait },
      { id: 'voyage', start: 9.4, end: 12.25, draw: sVoyage },
      { id: 'trim', start: 12.25, end: 16.25, draw: sTrim },
      { id: 'mauritius', start: 16.25, end: 24.15, draw: sMauritius },
      { id: 'name', start: 24.15, end: 29.45, draw: sName },
      { id: 'book', start: 29.45, end: 33.2, draw: sBook },
      { id: 'candle', start: 33.2, end: 35.85, draw: sCandle },
      { id: 'london', start: 35.85, end: 46.5, draw: sLondon },
      { id: 'dig', start: 46.5, end: 56.8, draw: sDig },
      { id: 'home', start: 56.8, end: 64.968, draw: sHome },
    ],
    // finishing layer (under captions): defs, light-leak on cuts, vignette, film grain
    overlay(t) {
      let leak = 0;
      for (const c of CUTS) leak = Math.max(leak, Math.exp(-Math.pow((t - c) / 0.16, 2)));
      const seed = Math.floor(t * 30) % 6;
      return `${DEFS}
        ${leak > 0.02 ? `<rect width="${W}" height="${H}" fill="url(#leak)" opacity="${f1(leak * 0.45 * 100) / 100}" style="mix-blend-mode:screen"/>` : ''}
        <rect width="${W}" height="${H}" fill="url(#vignette)"/>
        <filter id="grain${seed}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="${seed + 1}" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 -0.35"/></filter>
        <rect width="${W}" height="${H}" filter="url(#grain${seed})" opacity="0.07" style="mix-blend-mode:overlay"/>`;
    },
  };
})();
