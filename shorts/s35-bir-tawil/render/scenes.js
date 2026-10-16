/* s35-bir-tawil — "The Land No Country Wants"
 * SVG + renderFrame(t) + Playwright + ffmpeg. No Remotion.
 * Reuses shared engine helpers (window.HS); overrides renderFrame for map camera,
 * per-beat caption placement and word-highlight captions.
 * Geography: render/geo.json (Natural Earth 10m, public domain). Timing: ../transcript.json.
 */
(function () {
  const HS = window.HS;
  const { clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic, easeOutElastic, smoothstep } = HS;
  const W = 1080, H = 1920;

  // ---------- data ----------
  const xhr = new XMLHttpRequest();
  xhr.open('GET', '/geo.json', false);
  xhr.send(null);
  const GEO = JSON.parse(xhr.responseText);

  const IMG = {
    hookBg: '/img/nubian_desert_01.jpg',
    sat: '/img/satellite_bir_tawil.jpg',
    warOffice: '/img/war_office_wadi_halfa_sheet.jpg',
    redSea: '/img/halaib_red_sea_coast_02.jpg',
    flagBg: '/img/nubian_desert_wadi_halfa.jpg',
    texture: '/img/nubian_desert_nasa.jpg',
  };

  const FONT = "'Inter Display', Inter, 'DejaVu Sans', sans-serif";
  const SERIF = "'DejaVu Serif', 'Liberation Serif', serif";
  const MONO = "'DejaVu Sans Mono', 'Liberation Mono', monospace";
  const C = {
    gold: '#f4b63f',
    goldDeep: '#c98a17',
    teal: '#3cc8c8',
    tealDeep: '#1d8f96',
    coral: '#ff5b4a',
    sea: '#0b1b2c',
    sea2: '#122a40',
    land: '#c2ab84',
    landDark: '#6f5b42',
    ink: '#0d0d12',
    paper: '#f3e6c8',
  };

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const ramp = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const fade = (t, a, b, c, d) => Math.min(ramp(t, a, b), 1 - ramp(t, c, d));

  function text(x, y, s, o = {}) {
    const size = o.size || 48;
    const attrs = [
      `x="${x}"`, `y="${y}"`,
      `text-anchor="${o.anchor || 'middle'}"`,
      `font-family="${o.family || FONT}"`,
      `font-size="${size}"`,
      `font-weight="${o.weight || 900}"`,
      `fill="${o.fill || '#fff'}"`,
      o.italic ? 'font-style="italic"' : '',
      o.ls ? `letter-spacing="${o.ls}"` : '',
      o.stroke ? `stroke="${o.stroke}" stroke-width="${o.sw || 6}" paint-order="stroke" stroke-linejoin="round"` : '',
      o.op != null ? `opacity="${o.op}"` : '',
      o.filter ? `filter="url(#${o.filter})"` : '',
    ].join(' ');
    return `<text ${attrs}>${esc(s)}</text>`;
  }

  function fullBleed(url, o = {}) {
    // cover-fit an image with zoom + drift; o.cx/o.cy = focal point 0..1
    return HS.stillLayer(url, { dim: o.dim ?? 0.45, scale: o.scale ?? 1.1, driftX: o.dx || 0, driftY: o.dy || 0 });
  }

  function vignette(strength = 0.55) {
    return `<rect width="${W}" height="${H}" fill="url(#vig)" opacity="${strength}"/>`;
  }

  // ---------- map projection + camera ----------
  const K = 100;
  const COSL = Math.cos((22 * Math.PI) / 180);
  const MAPCY = 760;
  const mx = (lon) => (lon - 30) * K * COSL;
  const my = (lat) => (30 - lat) * K;

  const CAM_KEYS = [
    // t, lon, lat, w (degrees of longitude across the frame)
    [7.3, 33.65, 21.87, 2.3],
    [7.55, 33.65, 21.87, 2.3],
    [9.8, 31.6, 23.3, 17.5],
    [10.4, 31.55, 23.25, 17.0],
    [12.35, 31.4, 22.6, 14.6],
    [16.25, 31.3, 22.55, 13.6],
    [17.75, 34.55, 22.35, 6.4],
    [21.25, 34.75, 22.4, 6.2],
    [27.85, 34.95, 22.45, 5.9],
    [29.5, 34.95, 22.45, 5.9],
    [33.2, 35.0, 22.4, 5.7],
    [34.2, 34.75, 22.2, 5.0],
    [38.9, 34.8, 22.2, 4.7],
  ];
  function camAt(t) {
    let a = CAM_KEYS[0], b = CAM_KEYS[CAM_KEYS.length - 1];
    if (t <= a[0]) b = a;
    else if (t >= b[0]) a = b;
    else {
      for (let i = 0; i < CAM_KEYS.length - 1; i++) {
        if (t >= CAM_KEYS[i][0] && t <= CAM_KEYS[i + 1][0]) { a = CAM_KEYS[i]; b = CAM_KEYS[i + 1]; break; }
      }
    }
    const u = a === b ? 0 : easeInOutCubic((t - a[0]) / (b[0] - a[0]));
    const lw = Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), u));
    const cam = { lon: lerp(a[1], b[1], u), lat: lerp(a[2], b[2], u), w: lw };
    cam.z = W / (cam.w * K * COSL);
    cam.ox = W / 2 - mx(cam.lon) * cam.z;
    cam.oy = MAPCY - my(cam.lat) * cam.z;
    return cam;
  }
  const P = (cam, lon, lat) => [cam.ox + mx(lon) * cam.z, cam.oy + my(lat) * cam.z];
  function ringD(cam, ring) {
    let d = '';
    for (let i = 0; i < ring.length; i++) {
      const [x, y] = P(cam, ring[i][0], ring[i][1]);
      d += (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1);
    }
    return d + 'Z';
  }
  const ringsD = (cam, rings) => rings.map((r) => ringD(cam, r)).join('');
  function partialLine(cam, pts, f) {
    const sp = pts.map((p) => P(cam, p[0], p[1]));
    let total = 0;
    const seg = [];
    for (let i = 1; i < sp.length; i++) {
      const l = Math.hypot(sp[i][0] - sp[i - 1][0], sp[i][1] - sp[i - 1][1]);
      seg.push(l);
      total += l;
    }
    let want = total * clamp(f, 0, 1);
    let d = `M${sp[0][0].toFixed(1)},${sp[0][1].toFixed(1)}`;
    let tip = sp[0];
    for (let i = 1; i < sp.length; i++) {
      if (want <= 0) break;
      const l = seg[i - 1];
      if (want >= l) {
        d += `L${sp[i][0].toFixed(1)},${sp[i][1].toFixed(1)}`;
        tip = sp[i];
        want -= l;
      } else {
        const u = want / l;
        tip = [lerp(sp[i - 1][0], sp[i][0], u), lerp(sp[i - 1][1], sp[i][1], u)];
        d += `L${tip[0].toFixed(1)},${tip[1].toFixed(1)}`;
        want = 0;
      }
    }
    return { d, tip };
  }
  function centroid(ring) {
    let x = 0, y = 0;
    for (const p of ring) { x += p[0]; y += p[1]; }
    return [x / ring.length, y / ring.length];
  }
  const BT = GEO.birtawil_fine;
  const HA_MAIN = GEO.halaib.reduce((a, b) => (b.length > a.length ? b : a));
  const BT_C = [33.62, 21.86];
  const HA_C = [35.45, 22.55];

  // Local km-space outline (for the ACT size comparison and the flag plate)
  function kmShape(ring) {
    const c = centroid(ring);
    const kx = 111.32 * Math.cos((c[1] * Math.PI) / 180);
    const pts = ring.map((p) => [(p[0] - c[0]) * kx, -(p[1] - c[1]) * 110.57]);
    let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    for (const [x, y] of pts) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
    const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
    return { pts: pts.map(([x, y]) => [x - cx, y - cy]), w: maxx - minx, h: maxy - miny };
  }
  const BT_KM = kmShape(BT);
  const ACT_KM = kmShape(GEO.act);
  const CANBERRA_KM = (() => {
    const c = centroid(GEO.act);
    const kx = 111.32 * Math.cos((c[1] * Math.PI) / 180);
    // offset of Canberra from ACT bbox centre
    const xs = GEO.act.map((p) => p[0]), ys = GEO.act.map((p) => p[1]);
    const bx = (Math.min(...xs) + Math.max(...xs)) / 2, by = (Math.min(...ys) + Math.max(...ys)) / 2;
    return [(149.13 - bx) * kx, -(-35.28 - by) * 110.57];
  })();
  function kmPath(shape, cx, cy, pxPerKm) {
    return shape.pts.map((p, i) => `${i ? 'L' : 'M'}${(cx + p[0] * pxPerKm).toFixed(1)},${(cy + p[1] * pxPerKm).toFixed(1)}`).join('') + 'Z';
  }

  // ---------- shared defs ----------
  function defs(cam) {
    const tex = cam
      ? `<pattern id="landTex" patternUnits="userSpaceOnUse" x="-1200" y="-700" width="2800" height="3400"
           patternTransform="translate(${cam.ox.toFixed(1)} ${cam.oy.toFixed(1)}) scale(${cam.z.toFixed(4)})">
           <image href="${IMG.texture}" width="2800" height="3400" preserveAspectRatio="none"/></pattern>`
      : '';
    return `<defs>
      <radialGradient id="vig" cx="50%" cy="45%" r="75%">
        <stop offset="55%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="1"/>
      </radialGradient>
      <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.sea2}"/><stop offset="1" stop-color="${C.sea}"/>
      </linearGradient>
      <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0.75"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="botShade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.8"/>
      </linearGradient>
      <pattern id="hatch" patternUnits="userSpaceOnUse" width="26" height="26" patternTransform="rotate(45)">
        <rect width="13" height="26" fill="${C.gold}"/><rect x="13" width="13" height="26" fill="${C.teal}"/>
      </pattern>
      <pattern id="grid" patternUnits="userSpaceOnUse" width="60" height="60">
        <path d="M60 0H0V60" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
      </pattern>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="7" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="14"/>
      </filter>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.65"/>
      </filter>
      <filter id="blurBg"><feGaussianBlur stdDeviation="28"/></filter>
      <filter id="sepia"><feColorMatrix type="matrix"
        values="0.50 0.45 0.15 0 0.02  0.40 0.42 0.13 0 0.01  0.28 0.30 0.10 0 0  0 0 0 1 0"/></filter>
      ${tex}
    </defs>`;
  }

  // Small rounded tag / chip
  function chip(x, y, label, o = {}) {
    const size = o.size || 30;
    const w = o.w || label.length * size * 0.68 + 48 + (o.dot ? size * 1.1 : 0);
    const h = size * 1.7;
    const fill = o.fill || 'rgba(8,10,16,0.82)';
    const col = o.color || '#fff';
    const s = o.scale ?? 1;
    return `<g transform="translate(${x} ${y}) scale(${s})" opacity="${o.op ?? 1}" filter="url(#shadow)">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}"
        stroke="${o.stroke || 'rgba(255,255,255,0.18)'}" stroke-width="2"/>
      ${o.dot ? `<circle cx="${-w / 2 + h * 0.55}" cy="0" r="${size * 0.3}" fill="${o.dot}"/>` : ''}
      ${text(o.dot ? size * 0.55 : 0, size * 0.36, label, { size, fill: col, ls: o.ls ?? 2 })}
    </g>`;
  }

  // Year stamp at top band
  function yearStamp(t, t0, year, sub, o = {}) {
    const a = ramp(t, t0, t0 + 0.35);
    if (a <= 0) return '';
    const s = easeOutBack(a);
    const out = o.out ? 1 - ramp(t, o.out, o.out + 0.3) : 1;
    const y = o.y || 300;
    return `<g opacity="${out}">
      <g transform="translate(540 ${y}) scale(${(0.6 + 0.4 * s).toFixed(3)})" opacity="${a}">
        ${text(0, 0, year, { size: o.size || 170, fill: o.color || C.gold, stroke: '#000', sw: 10, ls: 6 })}
      </g>
      ${sub ? text(540, y + 66, sub, { size: 34, fill: '#f3ead6', weight: 700, ls: 3, op: ramp(t, t0 + 0.3, t0 + 0.7), stroke: '#000', sw: 6 }) : ''}
    </g>`;
  }

  // ---------- map layer ----------
  function mapLayer(t, st) {
    const cam = camAt(t);
    const punch = st.punch || 0;
    let g = `<rect width="${W}" height="${H}" fill="url(#seaGrad)"/>`;
    g += `<rect width="${W}" height="${H}" fill="url(#grid)"/>`;
    // graticule every 2 degrees
    let grat = '';
    for (let lat = 4; lat <= 36; lat += 2) {
      const [x0, y] = P(cam, 16, lat);
      const [x1] = P(cam, 48, lat);
      grat += `M${x0.toFixed(0)},${y.toFixed(1)}L${x1.toFixed(0)},${y.toFixed(1)}`;
    }
    for (let lon = 16; lon <= 48; lon += 2) {
      const [x, y0] = P(cam, lon, 36);
      const [, y1] = P(cam, lon, 4);
      grat += `M${x.toFixed(1)},${y0.toFixed(0)}L${x.toFixed(1)},${y1.toFixed(0)}`;
    }
    g += `<path d="${grat}" stroke="rgba(160,200,230,0.10)" stroke-width="1.5" fill="none"/>`;

    const others = ringsD(cam, GEO.others);
    const egypt = ringsD(cam, GEO.egypt);
    const sudan = ringsD(cam, GEO.sudan);
    const halaib = ringsD(cam, GEO.halaib);
    const bt = ringD(cam, BT);
    // coast glow
    g += `<path d="${others}${egypt}${sudan}${halaib}${bt}" fill="none" stroke="rgba(120,190,230,0.25)" stroke-width="10" filter="url(#softGlow)" fill-rule="evenodd"/>`;
    // land base
    g += `<path d="${others}" fill="${C.landDark}" fill-rule="evenodd"/>`;
    g += `<path d="${egypt}${sudan}${halaib}${bt}" fill="${C.land}" fill-rule="evenodd"/>`;
    // satellite texture over everything on land
    g += `<path d="${others}${egypt}${sudan}${halaib}${bt}" fill="url(#landTex)" opacity="0.3" style="mix-blend-mode:multiply" fill-rule="evenodd"/>`;
    g += `<path d="${others}" fill="#1a1712" opacity="0.38" fill-rule="evenodd"/>`;
    // country tints
    if (st.egypt) g += `<path d="${egypt}" fill="${C.gold}" opacity="${st.egypt}" fill-rule="evenodd"/>`;
    if (st.sudan) g += `<path d="${sudan}" fill="${C.teal}" opacity="${st.sudan}" fill-rule="evenodd"/>`;
    // water
    g += `<path d="${ringsD(cam, GEO.nasser)}" fill="#2f7fb8" opacity="0.95" fill-rule="evenodd"/>`;
    const rv = GEO.rivers.map((r) => r.map((p, i) => { const q = P(cam, p[0], p[1]); return (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join('')).join('');
    g += `<path d="${rv}" stroke="#3f95cf" stroke-width="${clamp(cam.z * 2.2, 2, 5)}" fill="none" stroke-linejoin="round"/>`;
    // borders
    g += `<path d="${others}" fill="none" stroke="rgba(0,0,0,0.45)" stroke-width="2"/>`;
    g += `<path d="${egypt}${sudan}" fill="none" stroke="rgba(30,20,10,0.35)" stroke-width="2"/>`;

    // Halaib fills
    if (st.haGold) g += `<path d="${halaib}" fill="${C.gold}" opacity="${st.haGold}"/>`;
    if (st.haTeal) g += `<path d="${halaib}" fill="${C.teal}" opacity="${st.haTeal}"/>`;
    if (st.haHatch) g += `<path d="${halaib}" fill="url(#hatch)" opacity="${st.haHatch}"/>`;
    if (st.haGrey) g += `<path d="${halaib}" fill="#5a5a5e" opacity="${st.haGrey}"/>`;
    if (st.haOutline) g += `<path d="${halaib}" fill="none" stroke="#fff" stroke-width="3" opacity="${st.haOutline}" stroke-dasharray="10 7"/>`;

    // Bir Tawil
    const btPulse = st.btPulse ? 0.5 + 0.5 * Math.sin(t * 6) : 0;
    const btCol = st.btColor || C.coral;
    g += `<path d="${bt}" fill="${btCol}" opacity="${(st.btFill ?? 0.85) * (0.8 + 0.2 * btPulse)}"/>`;
    g += `<path d="${bt}" fill="none" stroke="${btCol}" stroke-width="${6 + 6 * btPulse}" opacity="${0.55 * (st.btGlow ?? 1)}" filter="url(#softGlow)"/>`;
    g += `<path d="${bt}" fill="none" stroke="#fff" stroke-width="3" opacity="${st.btOutline ?? 0.9}"/>`;

    // boundary lines
    const lineDraw = (pts, f, col, o = {}) => {
      if (f <= 0) return '';
      const { d, tip } = partialLine(cam, pts, f);
      const op = o.op ?? 1;
      const glow = o.glow || 0;
      let s = '';
      if (glow > 0) s += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${18}" opacity="${0.55 * glow * op}" filter="url(#softGlow)" stroke-linejoin="round"/>`;
      s += `<path d="${d}" fill="none" stroke="#000" stroke-width="${(o.w || 6) + 4}" opacity="${0.5 * op}" stroke-linejoin="round" stroke-linecap="round"/>`;
      s += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${o.w || 6}" opacity="${op}" stroke-linejoin="round" stroke-linecap="round" ${o.dash ? `stroke-dasharray="${o.dash}"` : ''}/>`;
      if (o.pen && f < 1) {
        s += `<circle cx="${tip[0]}" cy="${tip[1]}" r="16" fill="${col}" opacity="0.5" filter="url(#softGlow)"/>`;
        s += `<circle cx="${tip[0]}" cy="${tip[1]}" r="8" fill="#fff"/>`;
      }
      return s;
    };
    if (st.l1899) g += lineDraw(GEO.line1899, st.l1899.f, C.gold, st.l1899);
    if (st.l1902) g += lineDraw(GEO.line1902, st.l1902.f, C.teal, st.l1902);

    // punch zoom for "Here's the catch"
    if (punch) {
      const s = 1 + 0.04 * punch;
      g = `<g transform="translate(540 ${MAPCY}) scale(${s}) translate(-540 ${-MAPCY})">${g}</g>`;
    }
    return { svg: g, cam };
  }

  // Map labels anchored to geography
  function geoLabel(cam, lon, lat, label, o = {}) {
    const [x, y] = P(cam, lon, lat);
    return text(x, y, label, Object.assign({ size: 44, ls: 10, fill: '#fff', stroke: 'rgba(0,0,0,0.7)', sw: 8 }, o));
  }

  // ---------- scenes ----------
  // S1 hook — Bir Tawil vs ACT, same km scale. Frame 1 carries the on-screen hook.
  function btPlate(t, local, o = {}) {
    // Bir Tawil outline plate with desert texture, drawn in km space
    const ppk = o.ppk || 6.2;
    const cx = o.cx ?? 540, cy = o.cy ?? 820;
    const d = kmPath(BT_KM, cx, cy, ppk);
    const pulse = 0.5 + 0.5 * Math.sin(local * 4);
    return `
      <clipPath id="btClip${o.id || ''}"><path d="${d}"/></clipPath>
      <path d="${d}" fill="${C.coral}" opacity="${0.35 + 0.1 * pulse}" filter="url(#softGlow)"/>
      <g clip-path="url(#btClip${o.id || ''})">
        <image href="${IMG.texture}" x="${cx - 420}" y="${cy - 300}" width="840" height="576" preserveAspectRatio="xMidYMid slice"/>
        <rect x="0" y="0" width="${W}" height="${H}" fill="${C.coral}" opacity="0.22"/>
      </g>
      <path d="${d}" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>
      <path d="${d}" fill="none" stroke="${C.coral}" stroke-width="12" opacity="${0.35 + 0.25 * pulse}" stroke-linejoin="round" filter="url(#softGlow)"/>`;
  }

  function sHook(t, local) {
    let s = fullBleed(IMG.hookBg, { dim: 0.5, scale: 1.16 + local * 0.006, dx: -local * 4 });
    s += `<rect width="${W}" height="700" fill="url(#topShade)"/>`;
    // compare phase: 1.7 → 3.6 plate shifts left, ACT appears on the right at the same km scale
    const cmpIn = easeInOutCubic(ramp(t, 1.6, 2.2));
    const cmpOut = easeInOutCubic(ramp(t, 3.55, 4.05));
    const cmp = cmpIn * (1 - cmpOut);
    const ppkBig = 7.6, ppkCmp = 5.6;
    const ppk = lerp(ppkBig, ppkCmp, cmp);
    const btX = lerp(540, 360, cmp);
    const btY = 820;
    s += btPlate(t, local, { cx: btX, cy: btY, ppk, id: 'h' });
    // labels under BT
    const lab = fade(t, 2.2, 2.5, 3.5, 3.8);
    s += `<g opacity="${lab}">
      ${text(btX, btY + BT_KM.h * ppk / 2 + 300, 'BIR TAWIL', { size: 40, ls: 4, stroke: '#000', sw: 7 })}
      ${text(btX, btY + BT_KM.h * ppk / 2 + 348, '≈ 2,060 km²', { size: 34, weight: 700, fill: '#ffd9a8', stroke: '#000', sw: 6 })}
    </g>`;
    // ACT
    if (cmp > 0.001) {
      const ax = lerp(1180, 820, cmpIn) + lerp(0, 380, cmpOut), ay = btY;
      const d = kmPath(ACT_KM, ax, ay, ppkCmp);
      const draw = ramp(t, 1.9, 2.6);
      s += `<g opacity="${cmp}">
        <path d="${d}" fill="rgba(80,140,255,0.22)" stroke="#9cc3ff" stroke-width="5" stroke-linejoin="round"
          stroke-dasharray="${2400 * draw} 2400"/>
        <circle cx="${ax + CANBERRA_KM[0] * ppkCmp}" cy="${ay + CANBERRA_KM[1] * ppkCmp}" r="8" fill="#fff" opacity="${ramp(t, 2.4, 2.6)}"/>
        ${text(ax + CANBERRA_KM[0] * ppkCmp + 16, ay + CANBERRA_KM[1] * ppkCmp + 9, 'Canberra', { size: 24, anchor: 'start', weight: 700, op: ramp(t, 2.4, 2.6), stroke: '#000', sw: 5 })}
        <g opacity="${lab}">
          ${text(ax, btY + 300 + BT_KM.h * ppk / 2, 'ACT', { size: 40, ls: 4, stroke: '#000', sw: 7, fill: '#cfe0ff' })}
          ${text(ax, btY + 348 + BT_KM.h * ppk / 2, '2,358 km²', { size: 34, weight: 700, fill: '#cfe0ff', stroke: '#000', sw: 6 })}
        </g>
        ${text(590, 545, 'SAME SCALE', { size: 26, ls: 6, weight: 700, fill: 'rgba(255,255,255,0.75)', op: lab })}
      </g>`;
    }
    // coordinates tag after compare
    const coord = fade(t, 4.0, 4.3, 9, 9);
    s += text(540, 1060, '21.87° N · 33.74° E', { size: 30, family: MONO, weight: 700, fill: '#ffe2b8', op: coord, stroke: '#000', sw: 5 });
    // UNCLAIMED stamp on "claim it"
    const st = ramp(t, 4.7, 4.95);
    if (st > 0) {
      const sc = lerp(2.2, 1, easeOutCubic(st));
      s += `<g transform="translate(540 820) rotate(-9) scale(${sc})" opacity="${Math.min(1, st * 1.4)}">
        <rect x="-300" y="-66" width="600" height="132" rx="14" fill="rgba(0,0,0,0.25)" stroke="${C.coral}" stroke-width="10"/>
        <rect x="-284" y="-50" width="568" height="100" rx="8" fill="none" stroke="${C.coral}" stroke-width="3"/>
        ${text(0, 26, 'UNCLAIMED', { size: 84, fill: C.coral, ls: 8 })}
      </g>`;
    }
    // Frame-1 hook (not spoken)
    const hk = 1 - easeInOutCubic(ramp(t, 3.0, 3.4));
    if (hk > 0) {
      const pop = 1 + 0.015 * Math.sin(t * 5);
      s += `<g opacity="${hk}" transform="translate(540 ${330 - 60 * (1 - hk)}) scale(${pop})">
        ${text(0, -40, 'NO COUNTRY WILL', { size: 92, fill: C.gold, stroke: '#000', sw: 12, ls: 1 })}
        ${text(0, 62, 'CLAIM THIS LAND', { size: 92, fill: '#fff', stroke: '#000', sw: 12, ls: 1 })}
      </g>`;
    }
    return s + vignette(0.6);
  }

  // S2 — Landsat view of Bir Tawil (outline is in the source image)
  function sSat(t, local) {
    const z = 1 + local * 0.045;
    const w = 1560 * z, h = (1560 * 1901 / 3840) * z;
    let s = `<g filter="url(#blurBg)"><image href="${IMG.sat}" x="-600" y="-200" width="2280" height="2320" preserveAspectRatio="xMidYMid slice"/></g>
      <rect width="${W}" height="${H}" fill="rgba(0,0,0,0.55)"/>`;
    s += `<g filter="url(#shadow)"><image href="${IMG.sat}" x="${540 - w / 2 - 40}" y="${790 - h / 2}" width="${w}" height="${h}" preserveAspectRatio="none"/></g>`;
    s += `<rect x="0" y="${790 - h / 2}" width="${W}" height="${h}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>`;
    // name + coordinate ticker
    const a = easeOutBack(ramp(t, 5.75, 6.15));
    s += `<g transform="translate(540 330) scale(${0.7 + 0.3 * a})" opacity="${ramp(t, 5.75, 6.0)}">
      ${text(0, 0, 'BIR TAWIL', { size: 120, ls: 10, stroke: '#000', sw: 12 })}
    </g>`;
    const coord = '21.87° N · 33.74° E';
    const n = Math.floor(ramp(t, 6.3, 6.9) * coord.length);
    s += text(540, 405, coord.slice(0, n), { size: 34, family: MONO, weight: 700, fill: '#ffe2b8', stroke: '#000', sw: 5 });
    s += text(540, 790 + h / 2 + 50, 'LANDSAT 8', { size: 22, family: MONO, weight: 700, fill: 'rgba(255,255,255,0.6)', ls: 4 });
    return s + vignette(0.5);
  }

  // S3 — pull back to Egypt and Sudan
  function sPullback(t, local) {
    const egyptA = ramp(t, 8.6, 9.0), sudanA = ramp(t, 9.25, 9.65);
    const { svg, cam } = mapLayer(t, { egypt: 0.34 * egyptA, sudan: 0.3 * sudanA, btPulse: 1 });
    let s = svg;
    const wide = ramp(t, 8.3, 8.8);
    s += geoLabel(cam, 29.0, 26.6, 'EGYPT', { size: 64, op: egyptA, fill: '#ffe2a0', ls: 16 });
    s += geoLabel(cam, 30.0, 16.6, 'SUDAN', { size: 64, op: sudanA, fill: '#bff3f3', ls: 16 });
    s += geoLabel(cam, 38.3, 21.0, 'Red Sea', { size: 34, op: wide * 0.85, italic: true, weight: 600, ls: 4, fill: '#9fd2f0', family: SERIF });
    s += geoLabel(cam, 32.0, 23.15, 'Lake Nasser', { size: 24, op: wide * 0.8, italic: true, weight: 600, ls: 1, fill: '#bfe3ff', family: SERIF, anchor: 'end' });
    // Bir Tawil callout
    const [bx, by] = P(cam, BT_C[0], BT_C[1]);
    const ca = ramp(t, 7.4, 7.8);
    const lx = bx + lerp(120, 170, wide), ly = by + lerp(170, 120, wide);
    s += `<g opacity="${ca}">
      <path d="M${bx},${by}L${lx - 8},${ly - 26}" stroke="#fff" stroke-width="3"/>
      <circle cx="${bx}" cy="${by}" r="7" fill="#fff"/>
      ${chip(lx + 120, ly, 'BIR TAWIL', { size: 30, dot: C.coral })}
    </g>`;
    return s + vignette(0.45);
  }

  // S4 — 1899: period War Office sheet underlay
  function s1899Period(t, local) {
    const z = 1.0 + local * 0.03;
    const h = 1920 * 1.15 * z, w = h * (3840 / 3159);
    const x = 540 - w * lerp(0.42, 0.47, local / 2.1), y = 960 - h * 0.43;
    let s = `<g filter="url(#sepia)"><image href="${IMG.warOffice}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/></g>
      <rect width="${W}" height="${H}" fill="rgba(20,12,4,0.45)"/>`;
    s += `<rect width="${W}" height="760" fill="url(#topShade)"/>`;
    s += yearStamp(t, 10.45, '1899', 'ANGLO-EGYPTIAN AGREEMENT');
    // two parties
    const pa = ramp(t, 11.75, 12.0), pb = ramp(t, 12.1, 12.3);
    s += chip(380, 520, 'BRITAIN', { size: 32, op: pa, scale: 0.8 + 0.2 * easeOutBack(pa) });
    s += chip(700, 520, 'EGYPT', { size: 32, op: pb, scale: 0.8 + 0.2 * easeOutBack(pb), dot: C.gold });
    return s + vignette(0.6);
  }

  // S5 — the 1899 line drawn dead straight along 22° N
  function s1899Line(t, local) {
    const f = easeInOutCubic(ramp(t, 12.95, 14.55));
    const { svg, cam } = mapLayer(t, { egypt: 0.22, sudan: 0.22, l1899: { f, pen: true, glow: 1, w: 7 }, btFill: 0.55, btOutline: 0.6, btGlow: 0.4 });
    let s = svg;
    // ruler riding the line
    const [x0, y0] = P(cam, 25, 22), [x1] = P(cam, 36.884, 22);
    const rA = fade(t, 12.7, 13.0, 14.6, 15.0);
    s += `<g opacity="${rA}">
      <rect x="${x0 - 20}" y="${y0 - 64}" width="${x1 - x0 + 40}" height="50" rx="6" fill="rgba(240,226,190,0.88)" stroke="#5b4a2c" stroke-width="2"/>
      ${Array.from({ length: 41 }, (_, i) => { const x = x0 + (i / 40) * (x1 - x0); return `<line x1="${x}" y1="${y0 - 14}" x2="${x}" y2="${y0 - (i % 5 ? 28 : 40)}" stroke="#3b2f1c" stroke-width="2"/>`; }).join('')}
    </g>`;
    s += geoLabel(cam, 29.0, 26.0, 'EGYPT', { size: 60, fill: '#ffe2a0', ls: 16 });
    s += geoLabel(cam, 30.0, 17.4, 'SUDAN', { size: 60, fill: '#bff3f3', ls: 16 });
    // 22°N tag at the end of the line
    const la = easeOutBack(ramp(t, 14.65, 15.0));
    const [lx, ly] = P(cam, 27.2, 22);
    s += chip(lx, ly + 62, '22° N', { size: 38, color: C.gold, scale: la, op: ramp(t, 14.65, 14.8), stroke: C.gold });
    s += chip(540, 260, '1899', { size: 40, color: C.gold, op: 1 - ramp(t, 16.0, 16.25), stroke: C.gold, ls: 6 });
    return s + vignette(0.45);
  }

  // S6 — 1902: a second line, drawn from who used the land
  function s1902(t, local) {
    const f = easeInOutCubic(ramp(t, 17.9, 20.4));
    const { svg, cam } = mapLayer(t, { egypt: 0.2, sudan: 0.2, l1899: { f: 1, op: 0.55, w: 5 }, l1902: { f, pen: true, glow: 1, w: 7 }, btFill: 0.6 });
    let s = svg;
    s += chip(540, 260, '1902', { size: 40, color: C.teal, op: ramp(t, 16.35, 16.6), scale: 0.8 + 0.2 * easeOutBack(ramp(t, 16.35, 16.7)), stroke: C.teal, ls: 6 });
    s += chip(540, 340, 'BRITISH ADMINISTRATIVE LINE', { size: 24, op: ramp(t, 17.4, 17.7), ls: 3 });
    // legend: gold = 1899, teal = 1902
    // grazing routes ("which tribes used the land")
    const tr = ramp(t, 19.4, 20.4);
    if (tr > 0) {
      const [ax, ay] = P(cam, 32.9, 24.09);
      const [bx, by] = P(cam, 33.55, 21.87);
      const [cx, cy] = P(cam, 35.9, 20.2);
      const [dx, dy] = P(cam, 35.7, 22.65);
      const dash = `stroke-dasharray="4 14" stroke-dashoffset="${-t * 40}"`;
      s += `<g opacity="${tr}">
        <circle cx="${ax}" cy="${ay}" r="8" fill="#fff"/>
        ${text(ax - 16, ay + 8, 'Aswan', { size: 28, anchor: 'end', weight: 700, stroke: '#000', sw: 5 })}
        <path d="M${ax},${ay} Q${ax - 90},${(ay + by) / 2} ${bx},${by - 12}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" ${dash}/>
        <path d="M${cx},${cy} Q${cx + 110},${(cy + dy) / 2} ${dx},${dy + 10}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" ${dash}/>
        ${chip(ax + 30, (ay + by) / 2 + 10, 'ABABDA', { size: 26, dot: C.gold, op: tr })}
        ${chip(cx + 40, cy + 40, 'BISHARI', { size: 26, dot: C.teal, op: tr })}
      </g>`;
    }
    return s + vignette(0.45);
  }

  // S7 — Egypt goes by the first line → Halaib Triangle, ten times bigger
  function sEgypt(t, local) {
    const eg = ramp(t, 22.6, 23.0);
    const ha = ramp(t, 25.1, 25.6);
    const punch = Math.max(0, 1 - Math.abs(t - 21.55) / 0.25) * ramp(t, 21.3, 21.4);
    const { svg, cam } = mapLayer(t, {
      egypt: 0.2 + 0.25 * eg, sudan: 0.2 - 0.1 * eg,
      l1899: { f: 1, op: 0.55 + 0.45 * eg, w: 5 + 3 * eg, glow: eg },
      l1902: { f: 1, op: 1 - 0.7 * eg, w: 6 - 2 * eg },
      haGold: 0.85 * ha, haOutline: ramp(t, 24.9, 25.2), btFill: 0.6, punch,
    });
    let s = svg;
    s += chip(540, 260, 'EGYPT’S CLAIM', { size: 36, dot: C.gold, op: eg, scale: 0.8 + 0.2 * easeOutBack(eg) });
    s += chip(540, 336, '1899 LINE', { size: 24, color: C.gold, op: eg, ls: 4 });
    // Halaib label
    const [hx, hy] = P(cam, HA_C[0], HA_C[1] + 0.05);
    const hl = easeOutBack(ha);
    s += `<g transform="translate(${hx} ${hy}) scale(${0.6 + 0.4 * hl})" opacity="${ha}">
      ${text(0, -8, 'HALAIB', { size: 46, stroke: '#000', sw: 8, ls: 4 })}
      ${text(0, 34, 'TRIANGLE', { size: 30, stroke: '#000', sw: 6, ls: 6, weight: 800 })}
    </g>`;
    const [bx, by] = P(cam, BT_C[0], BT_C[1]);
    s += text(bx - 10, by + 70, 'BIR TAWIL', { size: 28, stroke: '#000', sw: 6, ls: 3, op: ha });
    // ten-times panel
    const tp = ramp(t, 26.6, 26.85);
    if (tp > 0) {
      const y0 = 1060;
      let tiles = '';
      for (let i = 0; i < 10; i++) {
        const a = easeOutBack(ramp(t, 26.75 + i * 0.06, 27.0 + i * 0.06));
        const x = 130 + i * 82;
        tiles += `<g transform="translate(${x + 40} ${y0 + 100}) scale(${a})">
          <path d="${kmPath(BT_KM, 0, 0, 0.8)}" fill="${C.gold}" stroke="#fff" stroke-width="2"/></g>`;
      }
      s += `<g opacity="${tp}">
        <rect x="90" y="${y0}" width="900" height="210" rx="22" fill="rgba(6,8,14,0.82)" stroke="rgba(255,255,255,0.15)" stroke-width="2" filter="url(#shadow)"/>
        ${text(120, y0 + 50, 'HALAIB', { size: 30, anchor: 'start', ls: 3, fill: C.gold })}
        ${text(960, y0 + 50, '20,580 km²', { size: 30, anchor: 'end', fill: '#fff' })}
        ${tiles}
        <path d="${kmPath(BT_KM, 0, 0, 0.8)}" transform="translate(170 ${y0 + 170})" fill="${C.coral}" stroke="#fff" stroke-width="2"/>
        ${text(230, y0 + 180, 'BIR TAWIL', { size: 24, anchor: 'start', ls: 2, fill: '#ffd0c8' })}
        ${text(960, y0 + 180, '2,060 km²', { size: 24, anchor: 'end', fill: '#ddd', weight: 700 })}
      </g>`;
    }
    return s + vignette(0.45);
  }

  // S8 — Halaib coast, right on the Red Sea (real photo)
  function sRedSea(t, local) {
    let s = fullBleed(IMG.redSea, { dim: 0.25, scale: 1.08 + local * 0.03, dy: -local * 10 });
    s += `<rect width="${W}" height="620" fill="url(#topShade)"/>`;
    const a = easeOutBack(ramp(t, 28.0, 28.35));
    s += `<g transform="translate(540 300) scale(${0.7 + 0.3 * a})" opacity="${ramp(t, 27.95, 28.15)}">
      ${text(0, 0, 'RED SEA', { size: 110, ls: 12, stroke: '#000', sw: 12 })}
    </g>`;
    s += chip(540, 390, 'HALAIB COAST', { size: 30, dot: C.gold, op: ramp(t, 28.3, 28.6) });
    return s + vignette(0.5);
  }

  // S9 — Sudan goes by the second line → Halaib too (both claim it)
  function sSudan(t, local) {
    const su = ramp(t, 29.6, 30.0);
    const both = ramp(t, 31.85, 32.3);
    const { svg, cam } = mapLayer(t, {
      egypt: 0.2, sudan: 0.18 + 0.27 * su,
      l1899: { f: 1, op: 1 - 0.65 * su, w: 5 },
      l1902: { f: 1, op: 0.4 + 0.6 * su, w: 5 + 3 * su, glow: su },
      haGold: 0.85 * (1 - both), haHatch: 0.85 * both, haOutline: 1, btFill: 0.6,
    });
    let s = svg;
    s += chip(540, 260, 'SUDAN’S CLAIM', { size: 36, dot: C.teal, op: su, scale: 0.8 + 0.2 * easeOutBack(su) });
    s += chip(540, 336, '1902 LINE', { size: 24, color: C.teal, op: su, ls: 4 });
    const [hx, hy] = P(cam, HA_C[0], HA_C[1] + 0.05);
    s += `<g transform="translate(${hx} ${hy})">
      ${text(0, -8, 'HALAIB', { size: 46, stroke: '#000', sw: 8, ls: 4 })}
      ${text(0, 34, 'TRIANGLE', { size: 30, stroke: '#000', sw: 6, ls: 6, weight: 800 })}
    </g>`;
    // claimants pointing in
    const ca = ramp(t, 32.0, 32.4);
    if (ca > 0) {
      const [ex, ey] = P(cam, 34.4, 23.75);
      const [sx, sy] = P(cam, 35.2, 21.1);
      s += `<g opacity="${ca}">
        <path d="M${ex + 70},${ey + 26} Q${hx - 60},${ey + 40} ${hx - 30},${hy - 60}" fill="none" stroke="${C.gold}" stroke-width="5" marker-end="url(#none)"/>
        <path d="M${sx + 60},${sy - 26} Q${hx + 40},${sy - 30} ${hx + 20},${hy + 50}" fill="none" stroke="${C.teal}" stroke-width="5"/>
        ${chip(ex, ey, 'EGYPT', { size: 30, dot: C.gold })}
        ${chip(sx, sy, 'SUDAN', { size: 30, dot: C.teal })}
      </g>`;
    }
    const [bx, by] = P(cam, BT_C[0], BT_C[1]);
    s += text(bx - 10, by + 70, 'BIR TAWIL', { size: 28, stroke: '#000', sw: 6, ls: 3 });
    return s + vignette(0.45);
  }

  // S10 — each line hands Bir Tawil to the other; claim it, lose Halaib
  function sPotato(t, local) {
    // phase A (34.2–35.3): Egypt's line → BT is Sudan's.  phase B (35.3–36.5): Sudan's line → BT is Egypt's.
    const pA = fade(t, 34.15, 34.45, 35.2, 35.45);
    const pB = fade(t, 35.3, 35.6, 36.4, 36.65);
    const claim = ramp(t, 36.55, 36.85);
    const lose = ramp(t, 37.45, 38.1);
    const btColor = pA > 0.5 ? C.teal : pB > 0.5 ? C.gold : claim > 0 ? '#ffffff' : C.coral;
    const { svg, cam } = mapLayer(t, {
      egypt: 0.2, sudan: 0.2,
      l1899: { f: 1, op: 0.45 + 0.55 * pA, w: 5 + 3 * pA, glow: pA },
      l1902: { f: 1, op: 0.45 + 0.55 * pB, w: 5 + 3 * pB, glow: pB },
      haHatch: 0.85 * (1 - lose), haGrey: 0.9 * lose, haOutline: 1,
      btColor, btFill: claim > 0 ? 0.55 + 0.35 * claim : 0.85, btPulse: claim > 0 ? 1 : 0,
    });
    let s = svg;
    const [bx, by] = P(cam, BT_C[0], BT_C[1]);
    const [ex, ey] = P(cam, 33.0, 23.35);
    const [sx, sy] = P(cam, 33.4, 20.85);
    s += chip(ex, ey, 'EGYPT', { size: 34, dot: C.gold, op: 0.55 + 0.45 * pB });
    s += chip(sx, sy, 'SUDAN', { size: 34, dot: C.teal, op: 0.55 + 0.45 * pA });
    // hand-off arrows
    const arrow = (x0, y0, x1, y1, col, a) => {
      const k = easeOutCubic(a);
      const xe = lerp(x0, x1, k), ye = lerp(y0, y1, k);
      const ang = Math.atan2(y1 - y0, x1 - x0);
      const hx = (s) => xe - 26 * Math.cos(ang + s), hy = (s) => ye - 26 * Math.sin(ang + s);
      return `<g opacity="${a}"><path d="M${x0},${y0}L${xe},${ye}" stroke="${col}" stroke-width="8" stroke-linecap="round" filter="url(#glow)"/>
        <path d="M${xe},${ye}L${hx(0.5)},${hy(0.5)}M${xe},${ye}L${hx(-0.5)},${hy(-0.5)}" stroke="${col}" stroke-width="8" stroke-linecap="round"/></g>`;
    };
    s += arrow(bx, by + 30, sx + 10, sy - 42, C.teal, pA);
    s += arrow(bx - 10, by - 30, ex + 20, ey + 42, C.gold, pB);
    s += chip(540, 260, pB > pA ? 'SUDAN’S LINE' : 'EGYPT’S LINE', { size: 32, dot: pB > pA ? C.teal : C.gold, op: Math.max(pA, pB) });
    // claim it → lose Halaib
    if (claim > 0) {
      const r = 40 + 60 * ((t * 1.6) % 1);
      s += `<circle cx="${bx}" cy="${by}" r="${r}" fill="none" stroke="#fff" stroke-width="4" opacity="${claim * (1 - ((t * 1.6) % 1))}"/>`;
      s += text(bx, by + 78, 'BIR TAWIL', { size: 30, stroke: '#000', sw: 6, ls: 3, op: claim });
    }
    const [hx, hy] = P(cam, HA_C[0], HA_C[1] + 0.05);
    s += `<g transform="translate(${hx} ${hy})">
      ${text(0, -8, 'HALAIB', { size: 46, stroke: '#000', sw: 8, ls: 4, fill: lose > 0.5 ? '#bbb' : '#fff' })}
    </g>`;
    if (lose > 0) {
      // dust particles drifting off Halaib
      let parts = '';
      for (let i = 0; i < 26; i++) {
        const seed = (i * 73.13) % 1;
        const lon = 34.6 + ((i * 37) % 100) / 100 * 1.9, lat = 22.1 + ((i * 53) % 100) / 100 * 0.9;
        const [px, py] = P(cam, lon, lat);
        const k = clamp((t - 37.5 - seed * 0.4) / 1.2, 0, 1);
        parts += `<rect x="${px + k * 90}" y="${py - k * 160}" width="10" height="10" fill="${C.gold}" opacity="${(1 - k) * 0.9}" transform="rotate(${k * 200 + i * 20} ${px + k * 90} ${py - k * 160})"/>`;
      }
      s += parts;
      const la = ramp(t, 37.6, 37.9);
      s += text(hx, hy + 70, '−20,580 km²', { size: 44, fill: '#ff6b5e', stroke: '#000', sw: 8, op: la });
    }
    return s + vignette(0.45);
  }

  // S11/12 — 2014: a flag on the Bir Tawil outline (graphic only, no photo of the person)
  function sFlag(t, local) {
    const grey = ramp(t, 44.3, 44.9);
    let s = `<g style="filter:saturate(${1 - 0.85 * grey})">`;
    s += fullBleed(IMG.flagBg, { dim: 0.45 + 0.15 * grey, scale: 1.14 + local * 0.006, dx: local * 3 });
    s += `<rect width="${W}" height="620" fill="url(#topShade)"/>`;
    s += yearStamp(t, 38.95, '2014', null, { y: 310, out: 43.95 });
    // ground plate in perspective
    const plateA = ramp(t, 39.0, 39.5);
    const ppk = 8.4;
    const d = kmPath(BT_KM, 0, 0, ppk);
    s += `<g transform="translate(540 990) scale(1 ${lerp(0.9, 0.5, easeInOutCubic(plateA))})" opacity="${plateA}">
      <clipPath id="flagPlate"><path d="${d}"/></clipPath>
      <path d="${d}" fill="#000" opacity="0.5" transform="translate(0 30)" filter="url(#softGlow)"/>
      <g clip-path="url(#flagPlate)"><image href="${IMG.texture}" x="-450" y="-320" width="900" height="617" preserveAspectRatio="xMidYMid slice"/></g>
      <path d="${d}" fill="none" stroke="#fff" stroke-width="5"/>
      <path d="${d}" fill="none" stroke="${C.coral}" stroke-width="14" opacity="0.5" filter="url(#softGlow)"/>
    </g>`;
    s += text(540, 1120, 'BIR TAWIL', { size: 32, ls: 6, stroke: '#000', sw: 6, op: plateA * (1 - grey * 0.5) });
    // flag drop + plant at 40.74
    const plantT = 40.74;
    const fallK = ramp(t, 40.3, plantT);
    if (t >= 40.3) {
      const baseY = 990;
      const dropY = t < plantT ? lerp(-900, 0, fallK * fallK) : 0;
      const bounce = t >= plantT ? Math.sin(clamp((t - plantT) / 0.35, 0, 1) * Math.PI) * -14 * (1 - ramp(t, plantT, plantT + 0.35)) : 0;
      const droop = ramp(t, 44.4, 45.4);
      const lean = droop * 9;
      const amp = lerp(1, 0.25, droop);
      // cloth
      const poleH = 360;
      let cloth = 'M0,0';
      const fw = 230, fh = 150, N = 14;
      const wave = (x, k) => Math.sin(x * 0.03 - t * 7 + k) * 10 * amp * (x / fw) + droop * x * 0.55;
      for (let i = 0; i <= N; i++) { const x = (i / N) * fw; cloth += `L${x.toFixed(1)},${wave(x, 0).toFixed(1)}`; }
      for (let i = N; i >= 0; i--) { const x = (i / N) * fw; cloth += `L${x.toFixed(1)},${(fh + wave(x, 0.6)).toFixed(1)}`; }
      cloth += 'Z';
      s += `<g transform="translate(540 ${baseY + dropY + bounce}) rotate(${lean})">
        <ellipse cx="0" cy="4" rx="60" ry="14" fill="#000" opacity="0.35"/>
        <rect x="-6" y="${-poleH}" width="12" height="${poleH}" rx="5" fill="#e9e3d6" stroke="#333" stroke-width="2"/>
        <circle cx="0" cy="${-poleH - 6}" r="12" fill="${C.gold}" stroke="#333" stroke-width="2"/>
        <g transform="translate(6 ${-poleH + 4})">
          <path d="${cloth}" fill="#c8322b" stroke="#5a1210" stroke-width="3"/>
          <path d="${cloth}" fill="url(#none)"/>
        </g>
      </g>`;
      // dust burst on plant
      if (t >= plantT) {
        const k = ramp(t, plantT, plantT + 0.9);
        let dust = '';
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          const r = 30 + k * (90 + (i % 4) * 30);
          dust += `<circle cx="${540 + Math.cos(a) * r * 1.4}" cy="${baseY + Math.sin(a) * r * 0.35 - k * 30}" r="${10 + k * 18}" fill="#d8b98a" opacity="${(1 - k) * 0.55}"/>`;
        }
        s += dust;
      }
      // kingdom name tag
      const ka = ramp(t, 41.5, 41.9) * (1 - grey * 0.4);
      s += chip(540, 1190, '“KINGDOM OF NORTH SUDAN”', { size: 28, op: ka, ls: 1, scale: 0.85 + 0.15 * easeOutBack(ramp(t, 41.5, 41.9)) });
    }
    // crown for "a real princess"
    const cr = ramp(t, 42.85, 43.25);
    if (cr > 0) {
      const fall = ramp(t, 44.6, 45.6);
      const y = lerp(470, 560, easeOutBack(cr)) + fall * 360;
      const op = cr * (1 - fall);
      const sp = 0.5 + 0.5 * Math.sin(t * 9);
      s += `<g transform="translate(700 ${y}) rotate(${fall * 40})" opacity="${op}" filter="url(#shadow)">
        <path d="M-70,30 L-80,-40 L-40,-5 L0,-60 L40,-5 L80,-40 L70,30 Z" fill="${C.gold}" stroke="#7a5200" stroke-width="5" stroke-linejoin="round"/>
        <rect x="-72" y="28" width="144" height="22" rx="6" fill="${C.goldDeep}" stroke="#7a5200" stroke-width="4"/>
        <circle cx="0" cy="-60" r="9" fill="#fff"/><circle cx="-80" cy="-40" r="8" fill="#fff"/><circle cx="80" cy="-40" r="8" fill="#fff"/>
        <circle cx="0" cy="39" r="7" fill="${C.coral}"/>
        <path d="M110,-70 l6,16 16,6 -16,6 -6,16 -6,-16 -16,-6 16,-6Z" fill="#fff" opacity="${sp}"/>
        <path d="M-120,-20 l5,12 12,5 -12,5 -5,12 -5,-12 -12,-5 12,-5Z" fill="#fff" opacity="${1 - sp}"/>
      </g>`;
    }
    s += '</g>';
    // governments: a ring of seals, each crossed out
    const gv = ramp(t, 44.2, 44.5);
    if (gv > 0) {
      const n = 9;
      let seals = '';
      for (let i = 0; i < n; i++) {
        const x = 540 + (i - (n - 1) / 2) * 108;
        const y = 300 + Math.abs(i - (n - 1) / 2) * 6;
        const a = easeOutBack(ramp(t, 44.2 + i * 0.04, 44.45 + i * 0.04));
        const xk = ramp(t, 44.75 + i * 0.07, 44.95 + i * 0.07);
        seals += `<g transform="translate(${x} ${y}) scale(${a})">
          <circle r="47" fill="#e7e2d6" stroke="#4b4b4b" stroke-width="4"/>
          <path d="M-24,-8 L0,-24 L24,-8 Z" fill="#555"/>
          <rect x="-22" y="-6" width="6" height="22" fill="#555"/><rect x="-9" y="-6" width="6" height="22" fill="#555"/>
          <rect x="4" y="-6" width="6" height="22" fill="#555"/><rect x="17" y="-6" width="6" height="22" fill="#555"/>
          <rect x="-26" y="17" width="52" height="6" fill="#555"/>
          <g opacity="${xk}"><path d="M-30,-30 L${-30 + 60 * xk},${-30 + 60 * xk}M30,-30 L${30 - 60 * xk},${-30 + 60 * xk}" stroke="${C.coral}" stroke-width="10" stroke-linecap="round"/></g>
        </g>`;
      }
      // the year stamp yields to the seals
      s += `<rect x="0" y="180" width="${W}" height="250" fill="rgba(0,0,0,${0.55 * gv})"/>`;
      s += `<g opacity="${gv}">${seals}</g>`;
    }
    return s + vignette(0.55);
  }

  // S13 — loop: return to the frame-1 composition
  function sLoop(t, local) {
    // matches sHook at t=0: same photo framing, same plate, no hook text
    const k = easeInOutCubic(ramp(t, 46.05, 47.2));
    let s = fullBleed(IMG.hookBg, { dim: 0.5, scale: lerp(1.24, 1.16, k), dx: 0 });
    s += `<rect width="${W}" height="700" fill="url(#topShade)"/>`;
    s += btPlate(t, local, { cx: 540, cy: 820, ppk: lerp(9.5, 7.6, k), id: 'l' });
    return s + vignette(0.6);
  }

  const SCENES = [
    { id: 'hook', start: 0, end: 5.55, draw: sHook, x: 0 },
    { id: 'sat', start: 5.55, end: 7.3, draw: sSat, x: 0.12 },
    { id: 'pullback', start: 7.3, end: 10.38, draw: sPullback, x: 0.3 },
    { id: 'p1899', start: 10.38, end: 12.4, draw: s1899Period, x: 0.25 },
    { id: 'l1899', start: 12.4, end: 16.25, draw: s1899Line, x: 0.3 },
    { id: 'l1902', start: 16.25, end: 21.25, draw: s1902, x: 0 },
    { id: 'egypt', start: 21.25, end: 27.85, draw: sEgypt, x: 0 },
    { id: 'redsea', start: 27.85, end: 29.55, draw: sRedSea, x: 0.2 },
    { id: 'sudan', start: 29.55, end: 33.2, draw: sSudan, x: 0.25 },
    { id: 'potato', start: 33.2, end: 38.85, draw: sPotato, x: 0 },
    { id: 'flag', start: 38.85, end: 46.05, draw: sFlag, x: 0.3 },
    { id: 'loop', start: 46.05, end: 47.736, draw: sLoop, x: 0.3 },
  ];

  // ---------- captions ----------
  function buildCaptions(words) {
    const groups = [];
    let cur = [];
    const flush = () => { if (cur.length) groups.push(cur); cur = []; };
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (cur.length) {
        const gap = w.start - cur[cur.length - 1].end;
        if (gap > 0.6 || cur.length >= 4) flush();
      }
      cur.push(w);
      if (/[.,…?!]$/.test(w.word)) flush();
    }
    flush();
    // fold a one-word tail ("Sea.", "too.") back into the previous group when it follows closely
    for (let i = groups.length - 1; i > 0; i--) {
      const g = groups[i], prev = groups[i - 1];
      if (g.length === 1 && prev.length <= 4 && g[0].start - prev[prev.length - 1].end < 0.45 && !/[.…]$/.test(prev[prev.length - 1].word)) {
        groups[i - 1] = prev.concat(g);
        groups.splice(i, 1);
      }
    }
    return groups.map((g, i) => {
      const next = groups[i + 1];
      const end = next ? Math.min(g[g.length - 1].end + 0.35, next[0].start) : g[g.length - 1].end + 0.5;
      return { words: g, start: g[0].start - 0.04, end };
    });
  }

  function captionAt(t, caps) {
    const c = caps.find((c) => t >= c.start && t < c.end);
    if (!c) return '';
    const y = 1350;
    const size = 64;
    const pop = easeOutBack(ramp(t, c.start, c.start + 0.14));
    const op = 1 - ramp(t, c.end - 0.08, c.end);
    // measure roughly; shrink if too wide
    const raw = c.words.map((w) => w.word).join(' ');
    const est = raw.length * size * 0.58;
    const fs = est > 920 ? (size * 920) / est : size;
    const spans = c.words
      .map((w, i) => {
        const active = t >= w.start - 0.02;
        const now = t >= w.start - 0.02 && t < w.end + 0.05;
        const fill = now ? C.gold : active ? '#ffffff' : 'rgba(255,255,255,0.55)';
        return `<tspan fill="${fill}">${esc(w.word)}${i < c.words.length - 1 ? ' ' : ''}</tspan>`;
      })
      .join('');
    return `<g opacity="${op}" transform="translate(540 ${y}) scale(${0.85 + 0.15 * pop}) translate(-540 ${-y})">
      <text x="540" y="${y}" text-anchor="middle" font-family="${FONT}" font-weight="900" font-size="${fs.toFixed(1)}"
        stroke="#000" stroke-width="14" stroke-linejoin="round" paint-order="stroke" filter="url(#shadow)" xml:space="preserve">${spans}</text>
    </g>`;
  }

  window.EPISODE = {
    duration: 47.736,
    fps: 30,
    images: IMG,
    words: [],
    scenes: SCENES,
  };

  window.renderFrame = function (t) {
    const ep = window.EPISODE;
    if (!ep._caps) ep._caps = buildCaptions(ep.words || []);
    let body = '';
    // active scene + optional crossfade from previous
    const idx = SCENES.findIndex((s) => t >= s.start && t < s.end);
    const i = idx < 0 ? SCENES.length - 1 : idx;
    const sc = SCENES[i];
    const local = t - sc.start;
    const x = sc.x || 0;
    if (x > 0 && local < x && i > 0) {
      const prev = SCENES[i - 1];
      body += prev.draw(t, t - prev.start, HS);
      body += `<g opacity="${easeInOutCubic(local / x)}">${sc.draw(t, local, HS)}</g>`;
    } else {
      body += sc.draw(t, local, HS);
    }
    const mapCam = ['pullback', 'l1899', 'l1902', 'egypt', 'sudan', 'potato'].includes(sc.id) ? camAt(t) : null;
    document.getElementById('root').innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
        ${defs(mapCam || camAt(t))}
        <rect width="${W}" height="${H}" fill="#07080c"/>
        ${body}
        ${captionAt(t, ep._caps)}
      </svg>`;
  };
})();
