/* s34-pheasant-island — "The Island That Changes Country"
 * SVG + renderFrame(t) on the shared engine (shorts/shared/render). No Remotion.
 * Photo underlay + SVG motion graphics on every beat. Captions carry the spoken words.
 */
(function () {
  const W = 1080;
  const H = 1920;
  const CAP_Y = 1344; // ~70% lower-middle caption band
  // Keep every graphic out of this band (captions only):
  // y 1234..1460.

  const P = (f) => '/img/_render/' + f + '.jpg';
  // native aspect only matters (render copies keep aspect)
  const IMG = {
    bridge: { url: P('island_from_bridge_es_left_fr_right'), w: 3538, h: 1727 },
    wide: { url: P('island_wide'), w: 3538, h: 1727 },
    irun1: { url: P('island_from_irun_01'), w: 1598, h: 1092 },
    behobia: { url: P('konpantzia_behobia_2025'), w: 2500, h: 1618 },
    upstream: { url: P('island_upstream_view'), w: 2816, h: 2112 },
    memorial: { url: P('monument_treaty_memorial'), w: 1920, h: 2560 },
    rijks: { url: P('meeting_rijksmuseum_print'), w: 3840, h: 3189 },
    treaty: { url: P('treaty_document_archives_nationales'), w: 1432, h: 2020 },
    meeting: { url: P('meeting_louis_philip_1660_beaulieu'), w: 3774, h: 2592 },
    louis: { url: P('portrait_louis_xiv_mignard'), w: 3840, h: 5107 },
    maria: { url: P('portrait_maria_theresa_velazquez'), w: 848, h: 1125 },
    planHalf: { url: P('plan_half_france_half_spain'), w: 3840, h: 5845 },
  };

  // ---------- palette / type ----------
  const C = {
    navy: '#0b1424',
    ink: '#101828',
    gold: '#f2c14e',
    cream: '#f4ead2',
    frBlue: '#0055a4',
    frRed: '#ef4135',
    esRed: '#c60b1e',
    esGold: '#ffc400',
    water: '#123f5c',
    waterEdge: '#3f7fa3',
    land: '#1a2436',
  };
  const SANS = "Inter, 'Liberation Sans', Arial, sans-serif";
  const SERIF = "Caladea, 'Liberation Serif', Georgia, serif";
  const MONO = "'DejaVu Sans Mono', 'Liberation Mono', monospace";

  // ---------- math ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const eOut = (x) => 1 - Math.pow(1 - x, 3);
  const eIn = (x) => x * x * x;
  const eIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const eBack = (x) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  };
  const eElastic = (x) =>
    x === 0 || x === 1 ? x : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  const f1 = (v) => Math.round(v * 10) / 10;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // deterministic pseudo-random
  const rnd = (i) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  // ---------- photo underlay ----------
  // Cover-fit an image into frame (x,y,w,h); focus point (fx,fy) lands on (ax,ay) inside frame; edges clamped.
  function photoGeom(id, o = {}) {
    const im = IMG[id];
    const x = o.x || 0, y = o.y || 0, w = o.w || W, h = o.h || H;
    const s = Math.max(w / im.w, h / im.h) * (o.zoom || 1);
    const dw = im.w * s, dh = im.h * s;
    const ax = o.ax != null ? o.ax : w / 2;
    const ay = o.ay != null ? o.ay : h / 2;
    let px = ax - (o.fx != null ? o.fx : 0.5) * dw + (o.dx || 0);
    let py = ay - (o.fy != null ? o.fy : 0.5) * dh + (o.dy || 0);
    px = clamp(px, w - dw, 0);
    py = clamp(py, h - dh, 0);
    return { x, y, w, h, px, py, dw, dh, map: (u, v) => [x + px + u * dw, y + py + v * dh] };
  }
  function photo(id, o = {}) {
    const g = photoGeom(id, o);
    const filt = o.filter ? ` filter="url(#${o.filter})"` : '';
    const img = `<image href="${IMG[id].url}" x="${f1(g.px)}" y="${f1(g.py)}" width="${f1(g.dw)}" height="${f1(g.dh)}" preserveAspectRatio="none"${filt}/>`;
    const dim = o.dim != null ? o.dim : 0.35;
    const tint = o.tint || '0,0,0';
    const inner = `${img}<rect x="0" y="0" width="${g.w}" height="${g.h}" fill="rgba(${tint},${dim})"/>`;
    if (o.x || o.y || (o.w && o.w !== W) || (o.h && o.h !== H)) {
      return `<svg x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" overflow="hidden">${inner}</svg>`;
    }
    return inner;
  }

  // ---------- flags ----------
  function flagFR(x, y, w, h) {
    return `<rect x="${x}" y="${y}" width="${w / 3 + 0.5}" height="${h}" fill="${C.frBlue}"/>
      <rect x="${x + w / 3}" y="${y}" width="${w / 3 + 0.5}" height="${h}" fill="#ffffff"/>
      <rect x="${x + (2 * w) / 3}" y="${y}" width="${w / 3}" height="${h}" fill="${C.frRed}"/>`;
  }
  function flagES(x, y, w, h) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h / 4 + 0.5}" fill="${C.esRed}"/>
      <rect x="${x}" y="${y + h / 4}" width="${w}" height="${h / 2 + 0.5}" fill="${C.esGold}"/>
      <rect x="${x}" y="${y + (3 * h) / 4}" width="${w}" height="${h / 4}" fill="${C.esRed}"/>`;
  }
  // flag disc that flips about its vertical axis. side: continuous; integer part even = FR, odd = ES.
  function flagDisc(cx, cy, r, flip, o = {}) {
    // flip: 0 = France face, 1 = Spain face, 2 = France... fractional = mid-turn
    const ang = flip * Math.PI;
    const sx = Math.max(0.02, Math.abs(Math.cos(ang)));
    const showES = Math.round(flip) % 2 === 1;
    const face = showES ? flagES(-1.2, -1, 2.4, 2) : flagFR(-1.2, -1, 2.4, 2);
    const ring = o.ring != null ? o.ring : 1;
    return `<g transform="translate(${f1(cx)} ${f1(cy)})">
      <ellipse cx="0" cy="${r * 0.08 + 10}" rx="${r * sx * 1.02}" ry="${r * 1.02}" fill="rgba(0,0,0,0.45)"/>
      <g transform="scale(${f1(r * sx * 100) / 100} ${r})">
        <g clip-path="url(#unitDisc)">${face}
          <rect x="-1.2" y="-1" width="2.4" height="2" fill="url(#discShade)"/></g>
      </g>
      <ellipse cx="0" cy="0" rx="${f1(r * sx)}" ry="${r}" fill="none" stroke="${C.gold}" stroke-width="${6 * ring}"/>
    </g>`;
  }

  // ---------- text helpers ----------
  function txt(x, y, s, o = {}) {
    const size = o.size || 40;
    const st = o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || size * 0.12}" paint-order="stroke" stroke-linejoin="round"` : '';
    return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${o.anchor || 'middle'}" font-family="${o.family || SANS}"
      font-size="${size}" font-weight="${o.weight || 800}" fill="${o.fill || '#fff'}"${st}
      letter-spacing="${o.ls || 0}" ${o.italic ? 'font-style="italic"' : ''} opacity="${o.op != null ? o.op : 1}">${esc(s)}</text>`;
  }
  // label chip with optional flag swatch
  function chip(x, y, label, o = {}) {
    const size = o.size || 34;
    const pad = 22;
    const flagW = o.flag ? size * 1.25 : 0;
    const tw = label.length * size * (o.cw || 0.66) + (o.ls || 3) * label.length;
    const w = tw + pad * 2 + (flagW ? flagW + 14 : 0);
    const h = size * 1.7;
    const sc = o.scale != null ? o.scale : 1;
    let flag = '';
    if (o.flag) {
      const fx = -w / 2 + pad, fy = -size * 0.42;
      flag = (o.flag === 'FR' ? flagFR(fx, fy, flagW, size * 0.84) : flagES(fx, fy, flagW, size * 0.84)) +
        `<rect x="${fx}" y="${fy}" width="${flagW}" height="${size * 0.84}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>`;
    }
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${sc})" opacity="${o.op != null ? o.op : 1}">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${o.bg || 'rgba(11,20,36,0.86)'}"
        stroke="${o.border || C.gold}" stroke-width="3"/>
      ${flag}
      <text x="${flagW ? (flagW + 14) / 2 : 0}" y="${size * 0.36}" text-anchor="middle" font-family="${SANS}" font-size="${size}"
        font-weight="900" fill="${o.fill || '#fff'}" letter-spacing="${o.ls || 3}">${esc(label)}</text>
    </g>`;
  }
  function plaque(cx, cy, title, sub, o = {}) {
    const w = o.w || 860;
    const h = sub ? 150 : 104;
    const p = o.p != null ? o.p : 1; // reveal
    const rule = w * 0.5 * eOut(p);
    return `<g opacity="${clamp(p * 2, 0, 1)}" transform="translate(${cx} ${cy})">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="10" fill="rgba(14,12,8,0.82)" stroke="rgba(242,193,78,0.55)" stroke-width="2"/>
      <line x1="${-rule}" y1="${-h / 2 + 14}" x2="${rule}" y2="${-h / 2 + 14}" stroke="${C.gold}" stroke-width="3"/>
      <line x1="${-rule}" y1="${h / 2 - 14}" x2="${rule}" y2="${h / 2 - 14}" stroke="${C.gold}" stroke-width="3"/>
      ${txt(0, sub ? -2 : 18, title, { family: SERIF, size: o.size || 54, weight: 700, fill: C.cream, ls: 2 })}
      ${sub ? txt(0, 50, sub, { family: SERIF, size: 32, weight: 400, fill: C.gold, italic: true, ls: 1 }) : ''}
    </g>`;
  }
  function pinRipple(x, y, t0, t, col) {
    let out = '';
    for (let k = 0; k < 3; k++) {
      const u = ((t - t0 - k * 0.45) % 1.35) / 1.35;
      if (t - t0 - k * 0.45 < 0) continue;
      out += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(14 + u * 90)}" fill="none" stroke="${col || C.gold}" stroke-width="${f1(4 * (1 - u) + 0.5)}" opacity="${f1((1 - u) * 100) / 100}"/>`;
    }
    return out;
  }
  function brackets(x0, y0, x1, y1, len, col, sw) {
    const L = len || 60;
    const s = `stroke="${col || C.gold}" stroke-width="${sw || 6}" fill="none" stroke-linecap="round"`;
    return `<path d="M${x0} ${y0 + L} V${y0} H${x0 + L}" ${s}/>
      <path d="M${x1 - L} ${y0} H${x1} V${y0 + L}" ${s}/>
      <path d="M${x0} ${y1 - L} V${y1} H${x0 + L}" ${s}/>
      <path d="M${x1 - L} ${y1} H${x1} V${y1 - L}" ${s}/>`;
  }
  // HUD readout panel (top area)
  function hud(label, value, o = {}) {
    const y = o.y || 300;
    const p = o.p != null ? o.p : 1;
    const w = o.w || 560;
    return `<g opacity="${clamp(p * 1.6, 0, 1)}" transform="translate(540 ${y + (1 - eOut(p)) * -30})">
      <rect x="${-w / 2}" y="-118" width="${w}" height="236" rx="18" fill="rgba(6,12,22,0.8)" stroke="${o.col || C.gold}" stroke-width="3"/>
      ${txt(0, -62, label, { family: MONO, size: 32, weight: 700, fill: o.col || C.gold, ls: 6 })}
      ${txt(0, 78, value, { size: o.vsize || 130, weight: 900, fill: o.vfill || '#fff', ls: -2 })}
    </g>`;
  }

  // ============================================================
  // SCENES
  // ============================================================

  // --- 1. Hook (0 – 4.15): island from the international bridge; flag disc flips ---
  function hookText(op, dy) {
    return `<g opacity="${op}" transform="translate(0 ${dy || 0})">
      <rect x="0" y="0" width="${W}" height="620" fill="url(#topShade)"/>
      ${txt(540, 300, 'IT CHANGES COUNTRY.', { size: 80, weight: 900, fill: '#fff', ls: -1, stroke: '#000', sw: 10 })}
      ${txt(540, 404, 'EVERY SIX MONTHS.', { size: 80, weight: 900, fill: C.gold, ls: -1, stroke: '#000', sw: 10 })}
    </g>`;
  }
  function islandDiscScene(t, zoom, flip, discOp, extra) {
    const g = photoGeom('bridge', { fx: 0.5, fy: 0.5, zoom });
    const [ix, iy] = g.map(0.505, 0.555);
    const dy = 690;
    return (
      photo('bridge', { fx: 0.5, fy: 0.5, zoom, dim: 0.28 }) +
      `<g opacity="${discOp}">
        <line x1="${f1(ix)}" y1="${dy + 125}" x2="${f1(ix)}" y2="${f1(iy - 40)}" stroke="${C.gold}" stroke-width="4" stroke-dasharray="10 10"/>
        <circle cx="${f1(ix)}" cy="${f1(iy - 34)}" r="9" fill="${C.gold}"/>
        ${pinRipple(ix, iy - 34, 0, t, C.gold)}
        ${flagDisc(ix, dy, 118, flip)}
      </g>` + (extra || '')
    );
  }
  function sHook(t) {
    // flips: FR at start, -> ES on "country" (1.38), -> FR on "months" (2.94)
    const flip = eIO(seg(t, 1.3, 1.75)) + eIO(seg(t, 2.85, 3.3));
    const zoom = 1 + 0.06 * eIO(seg(t, 0, 4.2));
    const punch = 1.035 - 0.035 * eOut(seg(t, 0, 0.3));
    const out = eIn(seg(t, 3.55, 4.05));
    return (
      islandDiscScene(t, zoom, flip, 1) +
      `<g transform="translate(540 350) scale(${punch}) translate(-540 -350)">${hookText(1 - out, -out * 60)}</g>`
    );
  }

  // --- 2. Name card (4.15 – 5.3) ---
  function sName(t) {
    const L = t - 4.15;
    const p = seg(L, 0.0, 0.45);
    const g = photoGeom('irun1', { fx: 0.53, fy: 0.5, zoom: 1.0 + 0.05 * L });
    const [ix, iy] = g.map(0.53, 0.42);
    return (
      photo('irun1', { fx: 0.53, fy: 0.5, zoom: 1.0 + 0.05 * L, dim: 0.3 }) +
      `<rect width="${W}" height="700" fill="url(#topShade)"/>` +
      plaque(540, 330, 'PHEASANT ISLAND', 'Île des Faisans · Isla de los Faisanes · Konpantzia', { p, w: 960, size: 66 }) +
      `<g opacity="${eOut(seg(L, 0.3, 0.7))}">
        <line x1="540" y1="410" x2="${f1(ix)}" y2="${f1(iy - 120)}" stroke="${C.gold}" stroke-width="3"/>
        <circle cx="${f1(ix)}" cy="${f1(iy - 120)}" r="10" fill="${C.gold}"/>
      </g>`
    );
  }

  // --- 3. Map (5.3 – 10.45): schematic Bidasoa estuary from given coordinates ---
  const LAT0 = 43.355, LON0 = -1.77;
  const KY = 15000, KX = 15000 * Math.cos((43.35 * Math.PI) / 180);
  const pj = (lat, lon) => [(lon - LON0) * KX, (LAT0 - lat) * KY];
  const ptsD = (arr, close) =>
    arr.map((p, i) => { const [x, y] = pj(p[0], p[1]); return (i ? 'L' : 'M') + f1(x) + ' ' + f1(y); }).join(' ') + (close ? ' Z' : '');
  const ISLAND = [43.3425, -1.7653], HENDAYE = [43.3586, -1.7744], IRUN = [43.339, -1.7894];
  // river centreline (border) from the open sea through Txingudi bay and upstream past the island
  const BORDER = [
    [43.46, -1.784], [43.379, -1.784], [43.371, -1.786], [43.363, -1.785], [43.357, -1.7805],
    [43.351, -1.7805], [43.347, -1.779], [43.3445, -1.775], [43.343, -1.769], [43.3425, -1.7653],
    [43.3418, -1.7600], [43.3395, -1.7555], [43.335, -1.7525], [43.329, -1.751], [43.320, -1.749],
    [43.300, -1.745], [43.26, -1.738],
  ];
  const RIVER = BORDER.slice(4);
  const SPAIN_POLY = BORDER.concat([[43.26, -1.98], [43.46, -1.98]]);
  const SEA = [
    [43.381, -1.95], [43.386, -1.86], [43.391, -1.82], [43.395, -1.798], [43.388, -1.79], [43.380, -1.789],
    [43.379, -1.779], [43.378, -1.770], [43.377, -1.758], [43.382, -1.746], [43.387, -1.725], [43.392, -1.69],
    [43.48, -1.69], [43.48, -1.95],
  ];
  const BAY = [
    [43.381, -1.7895], [43.373, -1.796], [43.365, -1.797], [43.36, -1.790], [43.356, -1.7835], [43.354, -1.778],
    [43.357, -1.7745], [43.363, -1.7745], [43.370, -1.776], [43.376, -1.778], [43.381, -1.7785],
  ];
  function mapCam(t) {
    const K = [
      { t: 5.3, lat: 43.362, lon: -1.776, z: 0.95 },
      { t: 5.8, lat: 43.360, lon: -1.775, z: 1.05 },
      { t: 6.9, lat: 43.3428, lon: -1.7665, z: 4.4 },
      { t: 8.0, lat: 43.3475, lon: -1.7765, z: 2.45 },
      { t: 10.5, lat: 43.3475, lon: -1.7765, z: 2.6 },
    ];
    let a = K[0], b = K[K.length - 1];
    for (let i = 0; i < K.length - 1; i++) if (t >= K[i].t && t <= K[i + 1].t) { a = K[i]; b = K[i + 1]; }
    if (t < K[0].t) b = a;
    const u = b === a ? 0 : eIO(seg(t, a.t, b.t));
    // zoom interpolated in log space
    return { lat: lerp(a.lat, b.lat, u), lon: lerp(a.lon, b.lon, u), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), u)) };
  }
  const MAP_AY = 720;
  function sMap(t) {
    const cam = mapCam(t);
    const [cx, cy] = pj(cam.lat, cam.lon);
    const z = cam.z;
    const toS = (lat, lon) => { const [x, y] = pj(lat, lon); return [540 + (x - cx) * z, MAP_AY + (y - cy) * z]; };
    const frT = eOut(seg(t, 8.9, 9.4));
    const esT = eOut(seg(t, 9.5, 10.0));
    const borderT = seg(t, 7.8, 9.0);
    // world layer
    const sw = (px) => f1(px / z * 100) / 100; // constant screen width
    let world = `<g transform="translate(540 ${MAP_AY}) scale(${z}) translate(${f1(-cx)} ${f1(-cy)})">
      <rect x="-3000" y="-3000" width="6000" height="6000" fill="${C.land}"/>
      <rect x="-3000" y="-3000" width="6000" height="6000" fill="${C.frBlue}" opacity="${0.42 * frT}"/>
      <path d="${ptsD(SPAIN_POLY, true)}" fill="${C.land}"/>
      <path d="${ptsD(SPAIN_POLY, true)}" fill="${C.esRed}" opacity="${0.42 * esT}"/>
      <path d="${ptsD(SPAIN_POLY, true)}" fill="url(#esHatch)" opacity="${0.28 * esT}"/>
      <path d="${ptsD(SEA, true)}" fill="${C.water}" stroke="${C.waterEdge}" stroke-width="${sw(3)}"/>
      <path d="${ptsD(BAY, true)}" fill="${C.water}" stroke="${C.waterEdge}" stroke-width="${sw(3)}"/>
      <path d="${ptsD(RIVER)}" fill="none" stroke="${C.waterEdge}" stroke-width="26" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="${ptsD(RIVER)}" fill="none" stroke="${C.water}" stroke-width="22" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="${ptsD(BAY, true)}" fill="${C.water}"/>`;
    // island (exaggerated slightly for legibility)
    const [ix, iy] = pj(ISLAND[0], ISLAND[1]);
    world += `<ellipse cx="${f1(ix)}" cy="${f1(iy)}" rx="22" ry="15" fill="${C.water}"/>
      <ellipse cx="${f1(ix)}" cy="${f1(iy)}" rx="14" ry="4.2" transform="rotate(-12 ${f1(ix)} ${f1(iy)})" fill="#7fae5a" stroke="#cfe6a8" stroke-width="${sw(2)}"/>`;
    // graticule
    for (let k = -6; k <= 6; k++) {
      world += `<line x1="${k * 120}" y1="-3000" x2="${k * 120}" y2="3000" stroke="rgba(255,255,255,0.05)" stroke-width="${sw(1.5)}"/>`;
      world += `<line x1="-3000" y1="${k * 120}" x2="3000" y2="${k * 120}" stroke="rgba(255,255,255,0.05)" stroke-width="${sw(1.5)}"/>`;
    }
    // border line drawing along river (pathLength normalised)
    world += `<path d="${ptsD(BORDER)}" fill="none" stroke="#fff" stroke-width="${sw(5)}" stroke-dasharray="0.012 0.008"
        pathLength="1" opacity="${borderT > 0 ? 0.95 : 0}" stroke-dashoffset="0"
        style="clip-path: none" mask="url(#borderMask)"/>`;
    world += '</g>';
    // border reveal mask: grow a circle from island outward
    const [six, siy] = toS(ISLAND[0], ISLAND[1]);
    const maskR = eIO(borderT) * 1600;
    const defs = `<defs><mask id="borderMask" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000">
      <g transform="translate(${f1(cx)} ${f1(cy)}) scale(${1 / z}) translate(-540 ${-MAP_AY})">
        <circle cx="${f1(six)}" cy="${f1(siy)}" r="${f1(maskR)}" fill="#fff"/></g></mask></defs>`;

    // screen-space labels
    let ui = '';
    const seaA = seg(t, 5.3, 5.6) * (1 - seg(t, 6.2, 6.6));
    const [sx, sy] = toS(43.405, -1.79);
    ui += txt(sx, sy, 'BAY OF BISCAY', { family: SERIF, size: 40, weight: 400, italic: true, fill: '#9cc3dc', ls: 6, op: f1(seaA * 100) / 100 });
    // island pin
    const pinIn = eElastic(seg(t, 5.34, 6.2));
    ui += pinRipple(six, siy, 5.6, t, C.gold);
    ui += `<g transform="translate(${f1(six)} ${f1(siy)}) scale(${pinIn})">
      <path d="M0 0 C-8 -18 -26 -30 -26 -52 A26 26 0 1 1 26 -52 C26 -30 8 -18 0 0 Z" fill="${C.gold}" stroke="#1a1408" stroke-width="3"/>
      <circle cx="0" cy="-52" r="10" fill="#1a1408"/></g>`;
    const labA = eOut(seg(t, 5.5, 5.9));
    ui += chip(six + 10, siy - 120, 'PHEASANT ISLAND', { size: 30, op: labA, scale: 0.9 + 0.1 * labA });
    // river label
    const rA = eOut(seg(t, 6.85, 7.25));
    const [rx, ry] = toS(43.3465, -1.7745);
    ui += `<g opacity="${rA}">${txt(rx - 34, ry + 6, 'BIDASOA', { family: SERIF, size: 38, weight: 700, italic: true, fill: '#bfe3f7', ls: 8, anchor: 'end', stroke: '#0b1424', sw: 6 })}
      ${txt(rx - 34, ry + 44, 'river', { family: SERIF, size: 28, weight: 400, italic: true, fill: '#bfe3f7', ls: 4, anchor: 'end', stroke: '#0b1424', sw: 5 })}</g>`;
    // towns
    const tA = eOut(seg(t, 8.1, 8.5));
    for (const [pt, nm, side] of [[HENDAYE, 'HENDAYE', 'start'], [IRUN, 'IRUN', 'start']]) {
      const [x, y] = toS(pt[0], pt[1]);
      ui += `<g opacity="${tA}"><circle cx="${f1(x)}" cy="${f1(y)}" r="9" fill="#fff" stroke="#0b1424" stroke-width="3"/>
        ${txt(x + 18, y + 12, nm, { size: 30, weight: 800, fill: '#fff', ls: 4, anchor: side, stroke: '#0b1424', sw: 6 })}</g>`;
    }
    // country labels
    ui += chip(800, 470, 'FRANCE', { flag: 'FR', size: 44, op: frT, scale: 0.7 + 0.3 * eBack(seg(t, 8.9, 9.3)) });
    ui += chip(300, 1110, 'SPAIN', { flag: 'ES', size: 44, op: esT, scale: 0.7 + 0.3 * eBack(seg(t, 9.5, 9.9)) });
    return defs + world + ui + `<rect width="${W}" height="${H}" fill="url(#vignette)"/>`;
  }

  // --- 4. No pheasants (10.45 – 12.65): viewfinder scan ---
  function sNoPheasants(t) {
    const L = t - 10.45;
    const zoom = 1.08 + 0.04 * L;
    const g = photoGeom('behobia', { fx: 0.52, fy: 0.45, zoom });
    const scan = eIO(seg(t, 10.5, 11.45));
    const cx = lerp(330, 560, scan) + (t > 11.45 ? 0 : Math.sin(t * 9) * 6);
    const cy = 760;
    const fw = 440, fh = 330;
    const hit = seg(t, 11.48, 11.6);
    const col = hit > 0 ? (Math.floor((t - 11.48) * 8) % 2 ? C.gold : '#ff5a4f') : C.gold;
    const zeroPunch = 1 + 0.25 * (1 - eOut(seg(t, 11.48, 11.8))) * (hit > 0 ? 1 : 0);
    const blink = Math.floor(t * 3) % 2 === 0;
    const hudP = eOut(seg(t, 10.5, 10.85));
    return (
      photo('behobia', { fx: 0.52, fy: 0.45, zoom, dim: 0.3 }) +
      `<rect x="0" y="0" width="${W}" height="${H}" fill="rgba(20,40,20,0.12)"/>` +
      `<g transform="translate(${f1(cx)} ${cy})">
        ${brackets(-fw / 2, -fh / 2, fw / 2, fh / 2, 56, col, 6)}
        <line x1="-26" y1="0" x2="26" y2="0" stroke="${col}" stroke-width="3"/>
        <line x1="0" y1="-26" x2="0" y2="26" stroke="${col}" stroke-width="3"/>
        <circle cx="0" cy="0" r="60" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="6 8"/>
      </g>` +
      `<g opacity="${hudP}">
        <rect x="200" y="170" width="680" height="250" rx="18" fill="rgba(6,12,22,0.82)" stroke="${C.gold}" stroke-width="3"/>
        <circle cx="250" cy="216" r="11" fill="#ff3b30" opacity="${blink ? 1 : 0.25}"/>
        ${txt(274, 227, hit > 0 ? 'SCAN COMPLETE' : 'SCANNING…', { family: MONO, size: 28, weight: 700, fill: '#c9d6e8', anchor: 'start', ls: 3 })}
        ${txt(540, 290, 'PHEASANTS SPOTTED', { family: MONO, size: 36, weight: 700, fill: C.gold, ls: 5 })}
        <g transform="translate(540 392) scale(${zeroPunch}) translate(-540 -392)">
          ${txt(540, 400, '0', { size: 120, weight: 900, fill: hit > 0 ? '#ff5a4f' : '#fff' })}</g>
      </g>`
    );
  }

  // --- 5. 1659: the meeting on the river (12.65 – 18.25) ---
  function banner(x, y, kind, s, wave) {
    // pole + swallowtail banner
    const fw = 150, fh = 100;
    const clip = kind === 'FR' ? 'bannerClipFR' : 'bannerClipES';
    const flag = kind === 'FR' ? flagFR(0, 0, fw, fh) : flagES(0, 0, fw, fh);
    const dir = kind === 'FR' ? 1 : -1;
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s * dir} ${s})">
      <rect x="-5" y="-30" width="10" height="250" rx="4" fill="#d9b25f" stroke="#2a1d08" stroke-width="2"/>
      <circle cx="0" cy="-34" r="11" fill="${C.gold}" stroke="#2a1d08" stroke-width="2"/>
      <g transform="translate(5 -20) skewY(${f1(wave)})">
        <g clip-path="url(#${clip})">${flag}</g>
        <path d="M0 0 H${fw} L${fw - 26} ${fh / 2} L${fw} ${fh} H0 Z" fill="none" stroke="#2a1d08" stroke-width="3"/>
      </g></g>`;
  }
  function swords(cx, cy, p, op) {
    // two crossed sabres drawn on
    const blade = 'M0 0 C 40 -120 70 -260 70 -400';
    const one = (rot) => `<g transform="translate(${cx} ${cy}) rotate(${rot}) translate(0 170)">
      <path d="${blade}" fill="none" stroke="#e7e2d6" stroke-width="14" stroke-linecap="round" pathLength="1"
        stroke-dasharray="1 1" stroke-dashoffset="${f1((1 - p) * 100) / 100}"/>
      <path d="${blade}" fill="none" stroke="#7d7768" stroke-width="3" stroke-linecap="round" pathLength="1"
        stroke-dasharray="1 1" stroke-dashoffset="${f1((1 - p) * 100) / 100}" transform="translate(4 0)"/>
      <rect x="-50" y="-8" width="100" height="16" rx="6" fill="${C.gold}" stroke="#2a1d08" stroke-width="3" opacity="${p > 0.1 ? 1 : 0}"/>
      <rect x="-9" y="0" width="18" height="70" rx="6" fill="#5b3a1a" stroke="#2a1d08" stroke-width="3" opacity="${p > 0.1 ? 1 : 0}"/>
    </g>`;
    return `<g opacity="${op}">${one(-38)}${one(38)}</g>`;
  }
  function s1659(t) {
    const L = t - 12.65;
    const zoom = 1.25 + 0.55 * eIO(seg(t, 12.65, 18.3));
    const o = { fx: 0.53, fy: 0.63, zoom, ay: 860 };
    const g = photoGeom('rijks', o);
    const [px, py] = g.map(0.535, 0.635);
    // year slam then dock to top-left
    const slam = seg(t, 12.86, 13.2);
    const dock = eIO(seg(t, 15.4, 16.0));
    const ys = lerp(lerp(2.4, 1, eOut(slam)), 0.42, dock);
    const yx = lerp(540, 200, dock), yy = lerp(560, 250, dock);
    const shake = slam > 0 && slam < 1 ? 0 : (t > 13.2 && t < 13.5 ? Math.sin(t * 90) * 8 * (1 - seg(t, 13.2, 13.5)) : 0);
    const yearOp = slam > 0 ? clamp(slam * 3, 0, 1) : 0;
    // war swords
    const sw = eOut(seg(t, 14.1, 14.8));
    const swOp = seg(t, 14.1, 14.3) * (1 - seg(t, 15.4, 15.8));
    // banners converge on the pavilion
    const meet = eIO(seg(t, 15.75, 16.9));
    const wave = Math.sin(t * 5) * 6;
    const frX = lerp(-140, px - 200, meet), esX = lerp(W + 140, px + 200, meet);
    const by = py - 280;
    const hereP = seg(t, 16.7, 17.1);
    return (
      photo('rijks', { ...o, dim: 0.18, filter: 'sepia' }) +
      `<rect width="${W}" height="${H}" fill="url(#vignette)"/>` +
      `<rect width="${W}" height="${H}" fill="rgba(40,10,0,${0.25 * swOp})"/>` +
      swords(540, 900, sw, swOp) +
      (meet > 0 ? banner(frX, by, 'FR', 1, wave) + banner(esX, by, 'ES', 1, -wave) : '') +
      (hereP > 0 ? `<circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(30 + 20 * Math.sin(t * 6))}" fill="none" stroke="${C.gold}" stroke-width="5" opacity="${hereP}"/>` +
        pinRipple(px, py, 16.75, t, C.gold) : '') +
      (meet > 0.95 ? chip(px, py + 120, 'ISLE DES FAISANS', { size: 28, op: seg(t, 16.8, 17.1), bg: 'rgba(30,20,8,0.85)' }) : '') +
      `<g opacity="${yearOp}" transform="translate(${f1(yx + shake)} ${f1(yy)}) scale(${f1(ys * 100) / 100})">
        ${txt(0, 80, '1659', { family: SERIF, size: 250, weight: 700, fill: C.gold, ls: 6, stroke: '#1a1004', sw: 14 })}
      </g>`
    );
  }

  // --- 6. Treaty signed (18.25 – 20.45) ---
  const SIG_D = 'M205 1040 C 235 930, 290 930, 272 1012 S 250 1082, 302 1030 C 340 982, 362 950, 382 1002 C 396 1042, 422 1050, 442 990 C 456 950, 472 960, 482 1012 C 492 1052, 522 1040, 542 980 C 556 935, 576 930, 586 992 C 593 1042, 602 1060, 642 1000 C 672 955, 702 940, 722 992 C 737 1032, 762 1032, 792 962 C 802 937, 822 930, 845 952 M 228 1078 C 400 1104, 650 1098, 872 1040';
  let SIG_EL = null, SIG_LEN = 1;
  function sigPoint(u) {
    if (!SIG_EL) {
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('style', 'position:absolute;width:0;height:0');
      SIG_EL = document.createElementNS(ns, 'path');
      SIG_EL.setAttribute('d', SIG_D);
      svg.appendChild(SIG_EL);
      document.body.appendChild(svg);
      SIG_LEN = SIG_EL.getTotalLength();
    }
    const q = SIG_EL.getPointAtLength(u * SIG_LEN);
    return [q.x, q.y];
  }
  function sTreaty(t) {
    const zoom = 1.04 + 0.1 * eIO(seg(t, 18.25, 20.6));
    const p = eIO(seg(t, 18.5, 19.95));
    const tip = sigPoint(p);
    const plq = eOut(seg(t, 18.4, 18.9));
    return (
      photo('treaty', { fx: 0.5, fy: 0.42, zoom, dim: 0.12 }) +
      `<rect width="${W}" height="${H}" fill="url(#vignette)"/>` +
      `<rect x="150" y="860" width="780" height="260" rx="16" fill="rgba(244,234,210,${0.78 * eOut(seg(t, 18.3, 18.6))})"/>` +
      `<path d="${SIG_D}" fill="none" stroke="#1d1408" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${(1 - p).toFixed(4)}"/>` +
      (p > 0 && p < 1 ? `<g transform="translate(${f1(tip[0])} ${f1(tip[1])}) rotate(-35)">
          <path d="M0 0 L-10 -30 L0 -200 L10 -30 Z" fill="#f7f1e2" stroke="#3a2a12" stroke-width="3"/>
          <path d="M0 -60 C -40 -110 -30 -190 0 -240 C 30 -190 40 -110 0 -60 Z" fill="#efe7d4" stroke="#3a2a12" stroke-width="2" opacity="0.95"/>
        </g>` : '') +
      plaque(540, 300, 'TREATY OF THE PYRENEES', '1659', { p: plq, w: 900, size: 58 })
    );
  }

  // --- 7. Marriage seals the peace (20.45 – 23.55) ---
  function frame(x, y, w, h, id, o, name, sub, p, fromLeft) {
    const slide = (1 - eOut(p)) * (fromLeft ? -700 : 700);
    const rot = (1 - eOut(p)) * (fromLeft ? -10 : 10);
    return `<g opacity="${clamp(p * 3, 0, 1)}" transform="translate(${f1(slide)} 0) rotate(${f1(rot)} ${x + w / 2} ${y + h / 2})">
      <rect x="${x - 22}" y="${y - 22}" width="${w + 44}" height="${h + 44}" rx="6" fill="#3b2a10" stroke="${C.gold}" stroke-width="6"/>
      <rect x="${x - 9}" y="${y - 9}" width="${w + 18}" height="${h + 18}" fill="none" stroke="#c9a14a" stroke-width="3"/>
      ${photo(id, { ...o, x, y, w, h, dim: 0.02 })}
      <g transform="translate(${x + w / 2} ${y + h + 78})">
        <rect x="${-w / 2 - 10}" y="-42" width="${w + 20}" height="${sub ? 104 : 70}" rx="8" fill="rgba(14,12,8,0.88)" stroke="rgba(242,193,78,0.6)" stroke-width="2"/>
        ${txt(0, 2, name, { family: SERIF, size: 38, weight: 700, fill: C.cream, ls: 2 })}
        ${sub ? txt(0, 44, sub, { family: SERIF, size: 26, weight: 400, fill: C.gold, italic: true, ls: 1 }) : ''}
      </g></g>`;
  }
  function waxSeal(cx, cy, r, s, t) {
    let blob = '';
    const N = 28;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const rr = r * (1 + 0.07 * Math.sin(a * 5 + 1) + 0.04 * Math.sin(a * 11));
      blob += (i ? 'L' : 'M') + f1(Math.cos(a) * rr) + ' ' + f1(Math.sin(a) * rr);
    }
    return `<g transform="translate(${cx} ${cy}) scale(${f1(s * 100) / 100})">
      <path d="${blob} Z" fill="#9e1b1b" stroke="#5c0c0c" stroke-width="4"/>
      <circle r="${r * 0.72}" fill="#b42424" stroke="#6e0f0f" stroke-width="4"/>
      <circle r="${r * 0.6}" fill="none" stroke="#e0a0a0" stroke-width="2" opacity="0.5"/>
      ${txt(0, 16, '1659', { family: SERIF, size: r * 0.46, weight: 700, fill: '#f3c6c6', ls: 1 })}
      <ellipse cx="${-r * 0.3}" cy="${-r * 0.38}" rx="${r * 0.22}" ry="${r * 0.1}" fill="rgba(255,255,255,0.25)" transform="rotate(-30)"/>
    </g>`;
  }
  function sMarriage(t) {
    const pL = seg(t, 20.5, 21.1);
    const pR = seg(t, 21.8, 22.4);
    const cord = eIO(seg(t, 22.35, 22.9));
    const sealT = seg(t, 22.88, 23.1);
    const sealS = sealT > 0 ? lerp(2.2, 1, eOut(sealT)) : 0;
    const bgZoom = 1.15 + 0.05 * seg(t, 20.45, 23.6);
    let specks = '';
    if (t > 22.98) {
      const u = seg(t, 22.98, 23.5);
      for (let i = 0; i < 14; i++) {
        const a = rnd(i) * Math.PI * 2;
        const d = 80 + 120 * eOut(u) * (0.5 + rnd(i + 9));
        specks += `<circle cx="${f1(540 + Math.cos(a) * d)}" cy="${f1(1095 + Math.sin(a) * d * 0.6)}" r="${f1(5 * (1 - u) + 1)}" fill="${C.gold}" opacity="${f1((1 - u) * 100) / 100}"/>`;
      }
    }
    const cordD = `M300 1035 Q 540 ${f1(1035 + 110 * cord)} 780 1035`;
    return (
      photo('meeting', { fx: 0.5, fy: 0.55, zoom: bgZoom, dim: 0.62, filter: 'sepia' }) +
      `<rect width="${W}" height="${H}" fill="url(#vignette)"/>` +
      (cord > 0 ? `<path d="${cordD}" fill="none" stroke="${C.gold}" stroke-width="8" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${f1((1 - cord) * 100) / 100}"/>` : '') +
      frame(90, 260, 400, 540, 'louis', { fx: 0.38, fy: 0.27, zoom: 2.0 }, 'LOUIS XIV', 'King of France', pL, true) +
      frame(590, 260, 400, 540, 'maria', { fx: 0.47, fy: 0.27, zoom: 1.9 }, 'MARIA THERESA', 'Infanta of Spain', pR, false) +
      (sealS > 0 ? waxSeal(540, 1095, 78, sealS, t) : '') + specks
    );
  }

  // --- 8. Who got the island? (23.55 – 26.75): 1659-era plan, half France half Spain ---
  function flagPin(x, y, kind, s, tilt) {
    const fw = 92, fh = 62;
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(tilt)}) scale(${f1(s * 100) / 100})">
      <ellipse cx="0" cy="4" rx="22" ry="7" fill="rgba(0,0,0,0.35)"/>
      <rect x="-4" y="-190" width="8" height="192" fill="#2a1d08"/>
      <g transform="translate(4 -188)">${kind === 'FR' ? flagFR(0, 0, fw, fh) : flagES(0, 0, fw, fh)}
        <rect x="0" y="0" width="${fw}" height="${fh}" fill="none" stroke="#1a1408" stroke-width="3"/></g>
      <circle cx="0" cy="-194" r="9" fill="${C.gold}" stroke="#1a1408" stroke-width="2"/>
    </g>`;
  }
  function sWho(t) {
    const zoom = 1.18 + 0.1 * eIO(seg(t, 23.55, 26.8));
    const o = { fx: 0.5, fy: 0.53, zoom, ay: 760 };
    const g = photoGeom('planHalf', o);
    const [ax, ay] = g.map(0.5, 0.5);
    // France pin lands first, Spain pin knocks it aside, then both stand off
    const frDrop = eOut(seg(t, 24.3, 24.6));
    const esDrop = eOut(seg(t, 24.72, 25.02));
    const knock = eOut(seg(t, 24.95, 25.4));
    const settle = eIO(seg(t, 25.3, 25.9));
    const frX = lerp(ax, lerp(ax - 210, ax - 150, settle), knock);
    const frTilt = lerp(0, lerp(-28, -8, settle), knock) + (t > 25.9 ? Math.sin(t * 7) * 3 : 0);
    const esX = lerp(ax, ax + 150, settle);
    const esTilt = t > 25.9 ? Math.sin(t * 7 + 1.5) * 3 : 0;
    const frY = lerp(-300, ay + 60, frDrop), esY = lerp(-300, ay + 30, esDrop);
    const q = eBack(seg(t, 26.05, 26.4));
    const qPulse = 1 + 0.04 * Math.sin(t * 9);
    return (
      photo('planHalf', { ...o, dim: 0.12 }) +
      `<rect width="${W}" height="${H}" fill="url(#vignette)"/>` +
      (frDrop > 0 ? flagPin(frX, frY, 'FR', 1, frTilt) : '') +
      (esDrop > 0 ? flagPin(esX, esY, 'ES', 1, esTilt) : '') +
      (q > 0 ? `<g transform="translate(540 380) scale(${f1(q * qPulse * 100) / 100})">
          <circle r="110" fill="rgba(14,12,8,0.82)" stroke="${C.gold}" stroke-width="5"/>
          ${txt(0, 62, '?', { family: SERIF, size: 190, weight: 700, fill: C.gold })}</g>` : '')
    );
  }

  // --- 9. Shared: the six-month dial (26.75 – 33.7) ---
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  function arc(cx, cy, r0, r1, a0, a1) {
    const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const [x0, y0] = p(r1, a0), [x1, y1] = p(r1, a1), [x2, y2] = p(r0, a1), [x3, y3] = p(r0, a0);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M${f1(x0)} ${f1(y0)} A${r1} ${r1} 0 ${large} 1 ${f1(x1)} ${f1(y1)} L${f1(x2)} ${f1(y2)} A${r0} ${r0} 0 ${large} 0 ${f1(x3)} ${f1(y3)} Z`;
  }
  function sDial(t) {
    const cx = 540, cy = 790, R1 = 372, R0 = 252;
    const appear = (i) => eBack(seg(t, 27.45 + i * 0.04, 27.85 + i * 0.04));
    // Spain fills FEB..JUL across "February to July"; France fills AUG..JAN across "August to January"
    const esFill = (i) => (i >= 1 && i <= 6 ? seg(t, 29.95 + (i - 1) * 0.2, 30.15 + (i - 1) * 0.2) : 0);
    const frFill = (i) => {
      const k = i === 0 ? 5 : i - 7;
      return i >= 7 || i === 0 ? seg(t, 32.5 + k * 0.2, 32.7 + k * 0.2) : 0;
    };
    let segs = '';
    for (let i = 0; i < 12; i++) {
      const a0 = -Math.PI / 2 + (i * Math.PI) / 6 + 0.012, a1 = a0 + Math.PI / 6 - 0.024;
      const ap = appear(i);
      if (ap <= 0) continue;
      const am = (a0 + a1) / 2;
      const es = esFill(i), fr = frFill(i);
      const col = fr > 0 ? C.frBlue : es > 0 ? C.esRed : '#24324b';
      const pop = 1 + 0.06 * Math.sin(Math.PI * Math.max(es, fr));
      segs += `<g transform="translate(${cx} ${cy}) scale(${f1(ap * pop * 1000) / 1000}) translate(${-cx} ${-cy})">
        <path d="${arc(cx, cy, R0, R1, a0, a1)}" fill="#24324b" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>
        ${es > 0 || fr > 0 ? `<path d="${arc(cx, cy, R0, R0 + (R1 - R0) * eOut(Math.max(es, fr)), a0, a1)}" fill="${col}"/>` : ''}
        ${es > 0 && fr <= 0 ? `<path d="${arc(cx, cy, R0 + 34, R0 + 86, a0 + 0.02, a1 - 0.02)}" fill="${C.esGold}" opacity="${eOut(es)}"/>` : ''}
        ${txt(cx + Math.cos(am) * (R0 + R1) / 2, cy + Math.sin(am) * (R0 + R1) / 2 + 13, MONTHS[i], { size: 36, weight: 900, fill: '#fff', ls: 1, stroke: 'rgba(0,0,0,0.55)', sw: 5 })}
      </g>`;
    }
    // hand: jumps to Feb start on "Still do", sweeps with each fill
    const handA = (() => {
      let m = 0;
      m += 1 * eIO(seg(t, 28.2, 28.9));
      m += 6 * seg(t, 29.95, 31.15);
      m += 6 * seg(t, 32.5, 33.7);
      return -Math.PI / 2 + (m * Math.PI) / 6;
    })();
    const handOp = seg(t, 28.15, 28.4);
    const hx = cx + Math.cos(handA) * (R1 + 26), hy = cy + Math.sin(handA) * (R1 + 26);
    // centre disc: split half/half on "shared it", then shows the current holder
    const splitP = eBack(seg(t, 27.3, 27.75));
    const flip = 1 + eIO(seg(t, 31.6, 32.05)); // 1 = Spain, 2 = France
    const showFlip = t >= 29.3;
    const flipIn = eIO(seg(t, 29.25, 29.6));
    let centre;
    if (!showFlip || flipIn < 1) {
      const gap = 10 * splitP;
      centre = `<g transform="translate(${cx} ${cy}) scale(${f1(splitP * 100) / 100})" opacity="${1 - flipIn}">
        <g clip-path="url(#halfL)" transform="translate(${-gap} 0)"><g transform="scale(210)"><g clip-path="url(#unitDisc)">${flagFR(-1.2, -1, 2.4, 2)}</g></g></g>
        <g clip-path="url(#halfR)" transform="translate(${gap} 0)"><g transform="scale(210)"><g clip-path="url(#unitDisc)">${flagES(-1.2, -1, 2.4, 2)}</g></g></g>
        <circle r="212" fill="none" stroke="${C.gold}" stroke-width="6"/>
      </g>`;
    } else centre = '';
    if (showFlip) centre += `<g opacity="${flipIn}">${flagDisc(cx, cy, 200, flip)}</g>`;
    const legendA = eOut(seg(t, 27.5, 27.9));
    const esOn = t >= 29.3 && t < 31.65 ? 1 : 0.45;
    const frOn = t >= 31.65 ? 1 : 0.45;
    return (
      photo('wide', { fx: 0.5, fy: 0.5, zoom: 1.05 + 0.04 * seg(t, 26.75, 33.7), dim: 0.66 }) +
      `<rect width="${W}" height="${H}" fill="rgba(11,20,36,0.35)"/>` +
      segs + centre +
      (handOp > 0 ? `<g opacity="${handOp}"><line x1="${cx}" y1="${cy}" x2="${f1(hx)}" y2="${f1(hy)}" stroke="${C.gold}" stroke-width="0"/>
        <path d="M${f1(hx)} ${f1(hy)} L${f1(cx + Math.cos(handA - 0.06) * (R1 + 62))} ${f1(cy + Math.sin(handA - 0.06) * (R1 + 62))} L${f1(cx + Math.cos(handA + 0.06) * (R1 + 62))} ${f1(cy + Math.sin(handA + 0.06) * (R1 + 62))} Z" fill="${C.gold}" stroke="#1a1408" stroke-width="3"/></g>` : '') +
      chip(330, 250, 'SPAIN', { flag: 'ES', size: 36, op: legendA * esOn, scale: t >= 29.3 && t < 29.8 ? 1 + 0.12 * Math.sin(Math.PI * seg(t, 29.3, 29.8)) : 1 }) +
      chip(750, 250, 'FRANCE', { flag: 'FR', size: 36, op: legendA * frOn, scale: t >= 31.65 && t < 32.15 ? 1 + 0.12 * Math.sin(Math.PI * seg(t, 31.65, 32.15)) : 1 })
    );
  }

  // --- 10. Nobody lives there / no visitors / ~7,000 m² (33.7 – 38.85) ---
  function padlock(cx, cy, s, shackle) {
    return `<g transform="translate(${cx} ${cy}) scale(${f1(s * 100) / 100})">
      <path d="M-34 ${-10 - shackle * 30} V${-48 - shackle * 30} A34 34 0 0 1 34 ${-48 - shackle * 30} V-10" fill="none" stroke="#e8e8e8" stroke-width="14" stroke-linecap="round"/>
      <rect x="-56" y="-14" width="112" height="92" rx="14" fill="#d23b2f" stroke="#fff" stroke-width="5"/>
      <circle cx="0" cy="22" r="11" fill="#fff"/><rect x="-4" y="22" width="8" height="26" fill="#fff"/>
    </g>`;
  }
  function sNobody(t) {
    const zoom = 1.04 + 0.16 * eIO(seg(t, 33.7, 38.9));
    const o = { fx: 0.52, fy: 0.42, zoom, ay: 780 };
    const g = photoGeom('upstream', o);
    const [icx, icy] = g.map(0.53, 0.42);
    const popP = seg(t, 34.15, 34.5);
    const areaP = seg(t, 36.7, 36.95);
    const count = Math.round(7000 * eOut(seg(t, 36.98, 37.8)) / 10) * 10;
    // perimeter + lock (not allowed to visit)
    const per = eIO(seg(t, 35.4, 36.0));
    const rx = 430, ry = 250;
    const lock = eBack(seg(t, 35.6, 35.95));
    const shackle = 1 - eOut(seg(t, 35.95, 36.15));
    const lockOut = seg(t, 36.6, 36.9);
    // grid fill (area)
    const gridP = seg(t, 36.98, 37.9);
    let grid = '';
    if (gridP > 0) {
      const cell = 56;
      let k = 0;
      for (let gy = icy - ry; gy < icy + ry; gy += cell) {
        for (let gx = icx - rx; gx < icx + rx; gx += cell) {
          const ccx = gx + cell / 2, ccy = gy + cell / 2;
          const inside = Math.pow((ccx - icx) / rx, 2) + Math.pow((ccy - icy) / ry, 2) < 1;
          if (!inside) continue;
          const order = ((ccx - (icx - rx)) / (2 * rx)) * 0.7 + rnd(k++) * 0.3;
          const a = seg(gridP, order * 0.75, order * 0.75 + 0.25);
          if (a <= 0) continue;
          grid += `<rect x="${f1(gx + 3)}" y="${f1(gy + 3)}" width="${cell - 6}" height="${cell - 6}" rx="4" fill="rgba(242,193,78,${f1(0.32 * a * 100) / 100})" stroke="rgba(242,193,78,${f1(0.85 * a * 100) / 100})" stroke-width="2"/>`;
        }
      }
    }
    const outro = seg(t, 38.55, 38.85);
    const perCol = areaP > 0 ? C.gold : '#ff5a4f';
    return (
      photo('upstream', { ...o, dim: 0.3 }) +
      `<rect width="${W}" height="${H}" fill="url(#vignette)"/>` +
      `<g opacity="${1 - outro}">` +
      (per > 0 ? `<ellipse cx="${f1(icx)}" cy="${f1(icy)}" rx="${rx}" ry="${ry}" fill="${areaP > 0 ? 'none' : 'rgba(255,60,50,0.08)'}" stroke="${perCol}" stroke-width="6"
          stroke-dasharray="22 14" stroke-dashoffset="${f1(-t * 60)}" pathLength="${f1(per * 2000 + 0.01)}" opacity="${per}"/>` : '') +
      grid +
      (lock > 0 && lockOut < 1 ? `<g opacity="${1 - lockOut}">${padlock(icx, icy - 10, lock, shackle)}</g>` : '') +
      (areaP <= 0 ? hud('POPULATION', '0', { p: popP, y: 330 }) :
        hud('AREA', '≈ ' + count.toLocaleString('en-AU') + ' m²', { p: 1, y: 330, w: 760, vsize: 104 })) +
      `</g>`
    );
  }

  // --- 11. The stone monument (38.85 – 40.6) ---
  function sMonument(t) {
    const zoom = 1.06 + 0.12 * eIO(seg(t, 38.6, 40.8));
    const snap = eOut(seg(t, 39.4, 39.75));
    const pad = lerp(90, 0, snap);
    const x0 = 170 - pad, x1 = 910 + pad, y0 = 360 - pad, y1 = 1150 + pad * 0.3;
    return (
      photo('memorial', { fx: 0.5, fy: 0.5, zoom, ay: 820, dim: 0.22 }) +
      `<rect width="${W}" height="${H}" fill="url(#vignette)"/>` +
      `<g opacity="${snap}">${brackets(x0, y0, x1, Math.min(y1, 1190), 70, C.gold, 7)}</g>` +
      plaque(540, 230, 'TREATY OF THE PYRENEES', 'memorial stone', { p: eOut(seg(t, 39.45, 39.9)), w: 860, size: 52 })
    );
  }

  // --- 12. Loop (40.6 – 43.56): back on the island; six-month ring; flips to France to meet frame 1 ---
  function sLoop(t) {
    const zoom = lerp(1.12, 1.0, eIO(seg(t, 40.4, 43.56)));
    const discIn = eOut(seg(t, 40.7, 41.1));
    const flip = 1 + eIO(seg(t, 42.75, 43.2)); // Spain -> France (France is frame-1 state)
    const ring = eIO(seg(t, 40.86, 42.8));
    const g = photoGeom('bridge', { fx: 0.5, fy: 0.5, zoom });
    const [ix] = g.map(0.505, 0.555);
    const hookBack = eOut(seg(t, 43.2, 43.5));
    const r = 150;
    const ringD = arc(ix, 690, r - 10, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.001, ring) - 0.0001);
    const extra =
      `<g opacity="${discIn * (1 - hookBack * 0)}">
        <circle cx="${f1(ix)}" cy="690" r="${r - 5}" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="10"/>
        ${ring > 0 ? `<path d="${ringD}" fill="${C.gold}"/>` : ''}
      </g>` +
      `<g opacity="${hookBack}">${hookText(1, (1 - hookBack) * -40)}</g>`;
    return islandDiscScene(t, zoom, flip, discIn, extra);
  }

  // ============================================================
  // timeline
  // ============================================================
  const SCENES = [
    { s: 0, e: 4.15, draw: sHook },
    { s: 4.15, e: 5.3, draw: sName, x: 'push', d: 0.3 },
    { s: 5.3, e: 10.45, draw: sMap, d: 0.3 },
    { s: 10.45, e: 12.65, draw: sNoPheasants, x: 'push', d: 0.28 },
    { s: 12.65, e: 18.25, draw: s1659, d: 0.25 },
    { s: 18.25, e: 20.45, draw: sTreaty, d: 0.25 },
    { s: 20.45, e: 23.55, draw: sMarriage, d: 0.25 },
    { s: 23.55, e: 26.75, draw: sWho, x: 'push', d: 0.3 },
    { s: 26.75, e: 33.7, draw: sDial, d: 0.3 },
    { s: 33.7, e: 38.85, draw: sNobody, x: 'push', d: 0.3 },
    { s: 38.85, e: 40.6, draw: sMonument, d: 0.3 },
    { s: 40.6, e: 43.6, draw: sLoop, d: 0.3 },
  ];

  // ============================================================
  // captions (script spelling; word timings from transcript.json)
  // ============================================================
  const GROUPS = [
    [0, 2], [3, 5], [6, 8],
    [9, 10], [11, 15], [16, 19], [20, 24],
    [25, 28], [29, 32],
    [33, 34], [35, 38], [39, 43], [44, 47],
    [48, 49], [50, 54], [55, 57], [58, 61], [62, 65],
    [66, 68], [69, 72],
    [73, 76], [77, 78], [79, 81], [82, 85], [86, 88], [89, 92],
    [93, 95], [96, 100], [101, 103], [104, 107], [108, 111],
    [112, 116], [117, 121],
  ];
  let CAPS = null;
  function buildCaps(words) {
    CAPS = GROUPS.map(([a, b], gi) => ({ a, b, start: words[a].start - 0.06, words: words.slice(a, b + 1) }));
    for (let i = 0; i < CAPS.length; i++) {
      const c = CAPS[i], n = CAPS[i + 1];
      const lastEnd = c.words[c.words.length - 1].end;
      c.end = n ? Math.min(n.start, lastEnd + 0.7) : lastEnd + 0.6;
    }
  }
  function captionLayer(t) {
    const ep = window.EPISODE;
    if (!ep.words || !ep.words.length) return '';
    if (!CAPS) buildCaps(ep.words);
    const c = CAPS.find((k) => t >= k.start && t < k.end);
    if (!c) return '';
    const size = 62;
    const cw = size * 0.6;
    const full = c.words.map((w) => w.word).join(' ');
    // split into <= 2 balanced lines when long
    let lines = [c.words];
    if (full.length > 20 && c.words.length > 1) {
      let best = 1, bestD = 1e9;
      for (let k = 1; k < c.words.length; k++) {
        const l1 = c.words.slice(0, k).map((w) => w.word).join(' ').length;
        const l2 = c.words.slice(k).map((w) => w.word).join(' ').length;
        const d = Math.max(l1, l2);
        if (d < bestD) { bestD = d; best = k; }
      }
      lines = [c.words.slice(0, best), c.words.slice(best)];
    }
    const pop = eBack(seg(t, c.start, c.start + 0.16));
    const fade = 1 - seg(t, c.end - 0.08, c.end);
    const lh = size * 1.15;
    const y0 = CAP_Y - ((lines.length - 1) * lh) / 2 + size * 0.36;
    let out = '';
    lines.forEach((ln, li) => {
      const spans = ln.map((w) => {
        const active = t >= w.start - 0.04 && t < w.end + 0.08;
        const said = t >= w.start - 0.04;
        const fill = active ? C.gold : said ? '#ffffff' : 'rgba(255,255,255,0.72)';
        return `<tspan fill="${fill}">${esc(w.word)}</tspan>`;
      }).join(' ');
      out += `<text x="540" y="${f1(y0 + li * lh)}" text-anchor="middle" font-family="${SANS}" font-size="${size}" font-weight="900"
        stroke="#05080f" stroke-width="12" stroke-linejoin="round" paint-order="stroke" letter-spacing="-0.5">${spans}</text>`;
    });
    return `<g opacity="${f1(fade * 100) / 100}" transform="translate(540 ${CAP_Y}) scale(${f1((0.86 + 0.14 * pop) * 1000) / 1000}) translate(-540 ${-CAP_Y})">${out}</g>`;
  }

  // ============================================================
  // frame
  // ============================================================
  const DEFS = `<defs>
    <clipPath id="unitDisc"><circle cx="0" cy="0" r="1"/></clipPath>
    <clipPath id="halfL"><rect x="-260" y="-260" width="260" height="520"/></clipPath>
    <clipPath id="halfR"><rect x="0" y="-260" width="260" height="520"/></clipPath>
    <clipPath id="bannerClipFR"><path d="M0 0 H150 L124 50 L150 100 H0 Z"/></clipPath>
    <clipPath id="bannerClipES"><path d="M0 0 H150 L124 50 L150 100 H0 Z"/></clipPath>
    <radialGradient id="discShade" cx="0.35" cy="0.3" r="0.9">
      <stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.35"/></radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/></radialGradient>
    <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.7"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="capShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="0.5" stop-color="#000" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <pattern id="esHatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="8" height="16" fill="${C.esGold}" opacity="0.25"/></pattern>
    <filter id="sepia" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="0.42 0.72 0.18 0 0  0.35 0.64 0.16 0 0  0.27 0.5 0.13 0 0  0 0 0 1 0"/></filter>
  </defs>`;

  function sceneLayer(i, t) {
    const sc = SCENES[i];
    let layer = sc.draw(t) || '';
    if (i > 0) {
      const u = eIO(seg(t, sc.s, sc.s + (sc.d || 0.25)));
      if (u < 1) {
        if (sc.x === 'push') {
          const dx = (1 - u) * W;
          layer = `<g transform="translate(${f1(dx)} 0)">${layer}</g>`;
        } else layer = `<g opacity="${f1(u * 1000) / 1000}">${layer}</g>`;
      }
    }
    return layer;
  }

  // Preload + decode every still so the first frame of each scene never renders blank.
  window.__preload = Promise.all(
    Object.values(IMG).map((im) => {
      const el = new Image();
      el.src = im.url;
      (window.__keep = window.__keep || []).push(el);
      return el.decode().catch(() => {});
    })
  );

  window.EPISODE = { duration: 43.56, fps: 30, words: [], scenes: [] };
  window.renderFrame = function (t) {
    const root = document.getElementById('root');
    let body = '';
    for (let i = 0; i < SCENES.length; i++) {
      const sc = SCENES[i];
      const next = SCENES[i + 1];
      const until = next ? next.s + (next.d || 0.25) : sc.e + 1;
      if (t < sc.s || t >= until) continue;
      let layer = sceneLayer(i, t);
      if (next && next.x === 'push' && t >= next.s) {
        const u = eIO(seg(t, next.s, next.s + next.d));
        layer = `<g transform="translate(${f1(-u * W * 0.35)} 0)" opacity="${f1((1 - u * 0.6) * 100) / 100}">${layer}</g>`;
      }
      body += layer;
    }
    root.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      ${DEFS}
      <rect width="${W}" height="${H}" fill="${C.navy}"/>
      ${body}
      <rect x="0" y="1180" width="${W}" height="330" fill="url(#capShade)"/>
      ${captionLayer(t)}
    </svg>`;
  };
})();
