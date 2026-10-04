/* lf02 IF AUSTRALIA… Episode 2 — What If Australia Had WON at Gallipoli? Map choreography.
 * SVG + renderFrame(t). No Remotion. One continuous parchment terrain map (Mercator); camera keyframed on
 * Whisper word times (timeline.json). Screen space 1920x1080. Map units: u = lon + 15, v = Y0 - mercator(lat) in degrees.
 * B-roll clips are NOT drawn here: ffmpeg composites them at timeline.broll (zoom-through iris at frame centre,
 * where the camera parks each pin). Full-screen Ken Burns photos, map cards and PIPs ARE drawn here.
 * Colour lock: BLUE = Allied, RED = Ottoman / Central Powers, GOLD DOTTED = what-if only. */
(function () {
  const W = 1920, H = 1080, CX = W / 2, CY = H / 2;
  const DEG = Math.PI / 180, LON0 = -15;
  const mdeg = (lat) => Math.log(Math.tan((45 + Math.max(-85, Math.min(85, lat)) / 2) * DEG)) / DEG;
  const Y0 = mdeg(72);
  const MAPW = 197, MAPH = Y0 - mdeg(-48);
  const { clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic } = window.HS;
  const easeInCubic = (x) => x * x * x;
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const U = (lon) => lon - LON0;
  const V = (lat) => Y0 - mdeg(lat);

  const RED = '#b3261e', RED_D = '#4f110c', BLUE = '#2f63ad', BLUE_D = '#132b52';
  const INK = '#2e2216', PAPER = '#efe4c8', GOLD = '#c8962e', GOLD_D = '#6b4a10', GOLD_L = '#e8bf52', GREY = '#7d776c';

  let TL, LAYERS, GEO, BR, KBS, IMG19;

  // ------------------------------------------------------------------ places [lon, lat]
  const P = {
    cove: [26.2775, 40.2465], plateau: [26.2830, 40.2510], chunuk: [26.3135, 40.2705], nek: [26.3010, 40.2620],
    lonepine: [26.2885, 40.2305], quinns: [26.2930, 40.2560], gabatepe: [26.2690, 40.2270], boghali: [26.335, 40.245],
    maidos: [26.357, 40.184], kilitbahir: [26.378, 40.149], canakkale: [26.405, 40.146], kepez: [26.37, 40.10],
    erenkoy: [26.335, 40.075], entrance: [26.215, 40.02], seddul: [26.180, 40.045], kumkale: [26.195, 40.005],
    nara: [26.40, 40.205], gallipolitown: [26.67, 40.41], marmara: [27.6, 40.68], suvla: [26.27, 40.31],
    mudros: [25.27, 39.87], imbros: [25.85, 40.17], constantinople: [28.975, 41.01], bosphorus: [29.06, 41.15],
    london: [-0.12, 51.5], gibraltar: [-5.35, 36.0], malta: [14.5, 35.9], ankara: [32.85, 39.93], sofia: [23.32, 42.70],
    berlin: [13.4, 52.5], odessa: [30.73, 46.48], petrograd: [30.31, 59.94], moscow: [37.6, 55.75], ukraine: [33.0, 48.5],
    anatolia: [32.0, 39.6], damascus: [36.3, 33.5], baghdad: [44.4, 33.3], mideast: [38.5, 31.5],
    canberra: [149.13, -35.28], sydney: [151.21, -33.87], nsw: [149.58, -33.42], wellington: [174.78, -41.29],
    australia: [134.0, -25.5], nz: [173.0, -41.5], russia: [24.0, 53.0], rail: [37.6, 55.75],
  };
  const FRONT = [[2.75, 51.13], [2.88, 50.85], [2.95, 50.55], [2.78, 50.29], [2.70, 50.0], [2.85, 49.75], [3.0, 49.58], [3.32, 49.40],
    [3.75, 49.32], [4.03, 49.26], [4.6, 49.2], [5.05, 49.15], [5.38, 49.18], [5.54, 48.90], [6.05, 48.90], [6.45, 48.65], [6.85, 48.40],
    [7.0, 48.10], [7.12, 47.80], [7.17, 47.50]];

  // ------------------------------------------------------------------ time helpers
  const S = (k) => TL.chunks[k].start;
  const E = (k) => TL.chunks[k].end;
  const nrm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  function A(k, word, occ = 0, off = 0) {
    const c = TL.chunks[k];
    if (typeof word === 'number') return c.start + word + off;
    let n = 0;
    for (const w of c.words) if (nrm(w.w).startsWith(nrm(word)) && n++ === occ) return w.s + off;
    throw new Error(`word not found ${k} ${word} #${occ}`);
  }
  function Ae(k, word, occ = 0, off = 0) {
    let n = 0;
    for (const w of TL.chunks[k].words) if (nrm(w.w).startsWith(nrm(word)) && n++ === occ) return w.e + off;
    throw new Error(`word not found ${k} ${word} #${occ}`);
  }
  const win = (t, a, b, fi = 0.35, fo = 0.45) => (t < a || t > b ? 0 : Math.min(sstep(a, a + fi, t), 1 - sstep(b - fo, b, t)));
  const prog = (t, a, b, e = easeInOutCubic) => e(clamp((t - a) / (b - a), 0, 1));

  // ------------------------------------------------------------------ cues (exported so the mix hits the same frames)
  const CUES = [];
  function cue(kind, t, label, extra = {}) { CUES.push({ kind, t: +t.toFixed(3), label, ...extra }); return t; }

  // ------------------------------------------------------------------ camera
  function interpZoom(p0, p1, rho = 1.35) {
    const [ux0, uy0, w0] = p0, [ux1, uy1, w1] = p1;
    const dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy, rho2 = rho * rho, rho4 = rho2 * rho2;
    if (d2 < 1e-12) {
      const Sx = Math.log(w1 / w0) / rho;
      return (s) => [ux0 + s * dx, uy0 + s * dy, w0 * Math.exp(rho * s * Sx)];
    }
    const d1 = Math.sqrt(d2);
    const b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1);
    const b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1);
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
    const Sx = (r1 - r0) / rho;
    return (s) => {
      const ss = s * Sx, ch = Math.cosh(r0);
      const u = (w0 / (rho2 * d1)) * (ch * Math.tanh(rho * ss + r0) - Math.sinh(r0));
      return [ux0 + u * dx, uy0 + u * dy, (w0 * ch) / Math.cosh(rho * ss + r0)];
    };
  }
  const EASE = { io: easeInOutCubic, in: easeInCubic, out: easeOutCubic, lin: (x) => x, sio: (x) => sstep(0, 1, x) };
  let KEYS = [];
  function K(t, ll, z, e = 'io') { KEYS.push({ t, u: U(ll[0]), v: V(ll[1]), z, e }); }

  function brollQuiet(t) {
    let q = 0;
    for (const b of BR) {
      const a = b.entry === 'iris' ? b.tIn - 0.7 : b.tIn;
      const z = b.exit === 'iris' ? b.tOut + 0.35 : b.tOut;
      q = Math.max(q, win(t, a, z, 0.3, 0.3));
    }
    return q;
  }
  function camAt(t) {
    let k0 = KEYS[0], k1 = KEYS[0];
    if (t <= KEYS[0].t) k1 = KEYS[0];
    else if (t >= KEYS[KEYS.length - 1].t) k0 = k1 = KEYS[KEYS.length - 1];
    else for (let i = 1; i < KEYS.length; i++) if (t <= KEYS[i].t) { k0 = KEYS[i - 1]; k1 = KEYS[i]; break; }
    let u, v, z;
    if (k0 === k1) { u = k1.u; v = k1.v; z = k1.z; }
    else {
      const s = EASE[k1.e]((t - k0.t) / (k1.t - k0.t));
      const f = interpZoom([k0.u, k0.v, W / k0.z], [k1.u, k1.v, W / k1.z]);
      const r = f(s); u = r[0]; v = r[1]; z = W / r[2];
    }
    // the camera never stops: slow breathing drift (silenced inside zoom-throughs so the pin stays dead centre)
    const q = 1 - brollQuiet(t);
    z *= 1 + q * 0.02 * Math.sin((2 * Math.PI * t) / 13.0);
    u += (q * 9 * Math.sin((2 * Math.PI * t) / 17.0)) / z;
    v += (q * 6 * Math.sin((2 * Math.PI * t) / 11.0 + 1.3)) / z;
    const hw = W / 2 / z, hh = H / 2 / z;
    u = MAPW > 2 * hw ? clamp(u, hw, MAPW - hw) : MAPW / 2;
    v = MAPH > 2 * hh ? clamp(v, hh, MAPH - hh) : MAPH / 2;
    return { u, v, z };
  }

  let CAM = { u: 0, v: 0, z: 10 };
  const proj = (ll, cam = CAM) => [(U(ll[0]) - cam.u) * cam.z + CX, (V(ll[1]) - cam.v) * cam.z + CY];
  const projUV = (p, cam = CAM) => [(p[0] - cam.u) * cam.z + CX, (p[1] - cam.v) * cam.z + CY];
  const onScreen = (p, m = 260) => p[0] > -m && p[0] < W + m && p[1] > -m && p[1] < H + m;
  const llUV = (ll) => [U(ll[0]), V(ll[1])];

  // ------------------------------------------------------------------ geometry (UV polylines)
  function splineUV(lls, n = 18) {
    const p = lls.map(llUV);
    const out = [];
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
      for (let j = 0; j < n; j++) {
        const s = j / n, s2 = s * s, s3 = s2 * s;
        out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * s + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * s2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * s3)));
      }
    }
    out.push(p[p.length - 1]);
    return out;
  }
  function curveUV(a, b, bend = 0.18, n = 56) {
    const [ax, ay] = llUV(a), [bx, by] = llUV(b);
    const mx = (ax + bx) / 2, my = (ay + by) / 2, dx = bx - ax, dy = by - ay;
    const cx = mx - dy * bend, cy = my + dx * bend;
    const out = [];
    for (let i = 0; i <= n; i++) { const s = i / n, o = 1 - s; out.push([o * o * ax + 2 * o * s * cx + s * s * bx, o * o * ay + 2 * o * s * cy + s * s * by]); }
    return out;
  }
  function cut(pts, p0, p1 = null) {
    let a = 0, b = p0;
    if (p1 != null) { a = p0; b = p1; }
    const L = [0];
    for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const tot = L[L.length - 1], ta = a * tot, tb = b * tot;
    const at = (d) => {
      for (let i = 1; i < pts.length; i++) if (L[i] >= d) {
        const s = (d - L[i - 1]) / Math.max(1e-12, L[i] - L[i - 1]);
        return [lerp(pts[i - 1][0], pts[i][0], s), lerp(pts[i - 1][1], pts[i][1], s)];
      }
      return pts[pts.length - 1];
    };
    const out = [at(ta)];
    for (let i = 1; i < pts.length - 1; i++) if (L[i] > ta && L[i] < tb) out.push(pts[i]);
    out.push(at(tb));
    return out;
  }
  const pointAt = (pts, f) => cut(pts, 0, clamp(f, 0.0001, 1)).pop();
  const headingAt = (pts, f) => { const a = pointAt(pts, Math.max(0.0001, f - 0.01)), b = pointAt(pts, Math.min(1, f + 0.01)); return Math.atan2(b[1] - a[1], b[0] - a[0]) / DEG; };
  const plen = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };
  const pstr = (pts) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const scr = (uv, cam = CAM) => uv.map((p) => projUV(p, cam));

  function taper(pts, w0, w1, headL, headW) {
    if (pts.length < 2) return '';
    const tot = plen(pts);
    if (tot < 2) return '';
    const hl = Math.min(headL, tot * 0.6);
    const body = cut(pts, 0, Math.max(0, (tot - hl * 0.85) / tot));
    const L = [], R = [];
    let acc = 0;
    for (let i = 0; i < body.length; i++) {
      if (i > 0) acc += Math.hypot(body[i][0] - body[i - 1][0], body[i][1] - body[i - 1][1]);
      const a = body[Math.max(0, i - 1)], b = body[Math.min(body.length - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const n = Math.hypot(tx, ty) || 1; tx /= n; ty /= n;
      const w = lerp(w0, w1, acc / tot) / 2;
      L.push([body[i][0] - ty * w, body[i][1] + tx * w]);
      R.push([body[i][0] + ty * w, body[i][1] - tx * w]);
    }
    const tip = pts[pts.length - 1];
    const base = cut(pts, 0, Math.max(0, (tot - hl) / tot)).pop();
    let tx = tip[0] - base[0], ty = tip[1] - base[1];
    const n = Math.hypot(tx, ty) || 1; tx /= n; ty /= n;
    const hw = headW / 2;
    const poly = [...L, [base[0] - ty * hw, base[1] + tx * hw], tip, [base[0] + ty * hw, base[1] - tx * hw], ...R.reverse()];
    return 'M' + poly.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L') + 'Z';
  }
  function arrow(uv, p, o = {}) {
    if (p <= 0.002) return '';
    const pts = scr(cut(uv, o.from || 0, p));
    const d = taper(pts, o.w0 || 6, o.w1 || 16, o.headL || 34, o.headW || 40);
    const col = o.col || RED, dk = o.dk || RED_D;
    const op = o.op == null ? 1 : o.op;
    const glow = o.glow ? `<path d="${d}" fill="${o.glowCol || col}" opacity="${(0.5 * o.glow * op).toFixed(3)}" filter="url(#glow)"/>` : '';
    return `<g opacity="${op.toFixed(3)}">${glow}<path d="${d}" fill="${col}" stroke="${dk}" stroke-width="2.2" stroke-linejoin="round" filter="url(#drop)"/></g>`;
  }
  // GOLD DOTTED = what-if only. dotted() defaults to gold; the only other caller passes red mines.
  function dotted(uv, p, o = {}) {
    if (p <= 0.002) return '';
    const pts = scr(cut(uv, o.from || 0, p));
    const col = o.col || GOLD, dk = o.dk || GOLD_D, w = o.w || 7, op = o.op == null ? 1 : o.op;
    const tip = pts[pts.length - 1], pre = cut(pts, 0, 0.97).pop();
    const ang = Math.atan2(tip[1] - pre[1], tip[0] - pre[0]) / DEG;
    const hs = o.head || 17;
    const glow = o.glow ? `<polyline points="${pstr(pts)}" fill="none" stroke="${GOLD_L}" stroke-width="${w * 3.4}" stroke-linecap="round" opacity="${(0.45 * o.glow).toFixed(3)}" filter="url(#glow)"/>` : '';
    const head = o.noHead ? '' : `<path d="M${hs},0 L${-hs * 0.8},${-hs * 0.75} L${-hs * 0.45},0 L${-hs * 0.8},${hs * 0.75}Z" transform="translate(${tip[0].toFixed(1)} ${tip[1].toFixed(1)}) rotate(${ang.toFixed(1)})" fill="${col}" stroke="${dk}" stroke-width="2"/>`;
    return `<g opacity="${op.toFixed(3)}">${glow}
      <polyline points="${pstr(pts)}" fill="none" stroke="${dk}" stroke-width="${w + 3}" stroke-dasharray="${o.dash || '2 15'}" stroke-dashoffset="${o.dashOff || 0}" stroke-linecap="round" opacity="0.55"/>
      <polyline points="${pstr(pts)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-dasharray="${o.dash || '2 15'}" stroke-dashoffset="${o.dashOff || 0}" stroke-linecap="round"/>${head}</g>`;
  }
  function line(uv, p, o = {}) {
    if (p <= 0.002) return '';
    const pts = scr(cut(uv, o.from || 0, p));
    const op = o.op == null ? 1 : o.op;
    let s = '';
    if (o.under) s += `<polyline points="${pstr(pts)}" fill="none" stroke="${o.under}" stroke-width="${(o.w || 4) + (o.underW || 4)}" stroke-linecap="round" stroke-linejoin="round" ${o.dash ? `stroke-dasharray="${o.dash}"` : ''} opacity="${o.underOp || 0.6}"/>`;
    if (o.glow) s += `<polyline points="${pstr(pts)}" fill="none" stroke="${o.glowCol || o.col}" stroke-width="${(o.w || 4) * 3}" stroke-linecap="round" opacity="${(0.45 * o.glow).toFixed(3)}" filter="url(#glow)"/>`;
    s += `<polyline points="${pstr(pts)}" fill="none" stroke="${o.col || INK}" stroke-width="${o.w || 4}" stroke-linecap="round" stroke-linejoin="round" ${o.dash ? `stroke-dasharray="${o.dash}" stroke-dashoffset="${o.dashOff || 0}"` : ''}/>`;
    return `<g opacity="${op.toFixed(3)}">${s}</g>`;
  }
  // geo path (UV "d" string) drawn through the camera
  function geoPath(d, attrs, cam = CAM) {
    return `<g transform="translate(${(CX - cam.u * cam.z).toFixed(2)} ${(CY - cam.v * cam.z).toFixed(2)}) scale(${cam.z.toFixed(4)})"><path d="${d}" ${attrs} vector-effect="non-scaling-stroke"/></g>`;
  }

  // ------------------------------------------------------------------ text
  const cv = document.createElement('canvas').getContext('2d');
  function tw(text, font, size, ls = 0) { cv.font = `${size}px ${font}`; return cv.measureText(text).width + ls * text.length; }
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function plate(x, y, text, o = {}) {
    const size = o.size || 26, font = o.font || 'Fell', ls = o.ls != null ? o.ls : 1.5;
    const w = tw(text, font, size, ls) + (o.padX || 22) * 2, h = size * 1.45 + (o.padY || 4) * 2;
    const op = o.op == null ? 1 : o.op, sc = o.scale || 1;
    const fill = o.fill || 'rgba(244,236,214,0.93)', stroke = o.stroke || INK, col = o.col || INK;
    return `<g opacity="${op.toFixed(3)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${o.rot || 0}) scale(${sc.toFixed(3)})">
      <rect x="${(-w / 2).toFixed(1)}" y="${(-h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="${o.sw || 1.6}" filter="url(#drop)"/>
      <rect x="${(-w / 2 + 4).toFixed(1)}" y="${(-h / 2 + 4).toFixed(1)}" width="${(w - 8).toFixed(1)}" height="${(h - 8).toFixed(1)}" rx="2" fill="none" stroke="${stroke}" stroke-width="0.7" opacity="0.6"/>
      <text x="0" y="${(size * 0.36).toFixed(1)}" text-anchor="middle" font-family="${font}" font-size="${size}" letter-spacing="${ls}" fill="${col}">${esc(text)}</text>
    </g>`;
  }
  const goldPlate = (x, y, text, o = {}) => plate(x, y, text, { fill: 'rgba(250,238,205,0.95)', stroke: GOLD_D, col: '#5a3d0a', sw: 2.2, ...o });
  function mapText(x, y, text, o = {}) {
    const size = o.size || 28, op = o.op == null ? 1 : o.op;
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" font-family="${o.font || 'FellItalic'}" font-size="${size}" letter-spacing="${o.ls || 3}" fill="${o.col || INK}" opacity="${op.toFixed(3)}" stroke="rgba(244,236,214,0.75)" stroke-width="4" paint-order="stroke">${esc(text)}</text>`;
  }
  function geoText(ll, text, a, o = {}) {
    if (a <= 0) return '';
    const p = proj(ll);
    if (!onScreen(p)) return '';
    return mapText(p[0] + (o.dx || 0), p[1] + (o.dy || 0), text, { ...o, op: a });
  }
  function placeLabel(ll, text, t0, o = {}) {
    const t = NOW;
    const a = (o.until != null ? win(t, t0, o.until, 0.3, 0.5) : sstep(t0, t0 + 0.3, t)) * (o.op == null ? 1 : o.op);
    if (a <= 0) return '';
    const p = proj(ll);
    if (!onScreen(p)) return '';
    const sc = 0.85 + 0.15 * easeOutBack(clamp((t - t0) / 0.35, 0, 1));
    const f = o.gold ? goldPlate : plate;
    return f(p[0] + (o.dx || 0), p[1] + (o.dy == null ? -58 : o.dy), text, { ...o, op: a, scale: sc * (o.scale || 1) });
  }

  // ------------------------------------------------------------------ icons
  function pinG(x, y, t0, o = {}) {
    const t = NOW;
    const u = clamp((t - t0) / 0.42, 0, 1);
    const drop = (1 - easeOutBack(u)) * -70;
    const col = o.col || INK, sc = o.scale || 1, a = o.op == null ? 1 : o.op;
    const r = clamp((t - t0 - 0.3) / 0.6, 0, 1);
    const ring = r > 0 && r < 1 ? `<circle cx="0" cy="0" r="${(8 + 40 * r).toFixed(1)}" fill="none" stroke="${o.ringCol || col}" stroke-width="${(3 * (1 - r)).toFixed(2)}" opacity="${(1 - r).toFixed(3)}"/>` : '';
    const lit = o.lit ? `<circle cx="0" cy="-29" r="${(22 + 4 * Math.sin(t * 5)).toFixed(1)}" fill="${o.litCol || '#ffe7a6'}" opacity="${(0.6 * o.lit).toFixed(3)}" filter="url(#glow)"/>` : '';
    return `<g opacity="${a.toFixed(3)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sc})">
      <ellipse cx="0" cy="2" rx="${(9 * (0.5 + 0.5 * u)).toFixed(1)}" ry="3.2" fill="rgba(0,0,0,0.35)"/>${ring}
      <g transform="translate(0 ${drop.toFixed(1)})">${lit}
        <path d="M0,0 C-6,-10 -14,-18 -14,-29 A14,14 0 1,1 14,-29 C14,-18 6,-10 0,0Z" fill="${col}" stroke="${o.dk || '#140d07'}" stroke-width="1.6"/>
        <circle cx="0" cy="-29" r="5.5" fill="${PAPER}"/></g></g>`;
  }
  function pin(ll, t0, o = {}) {
    const t = NOW;
    if (t < t0) return '';
    const a = (o.until != null ? 1 - sstep(o.until - 0.4, o.until, t) : 1) * (o.op == null ? 1 : o.op);
    if (a <= 0) return '';
    const p = proj(ll);
    if (!onScreen(p)) return '';
    return pinG(p[0], p[1], t0, { ...o, op: a });
  }
  function flare(tIn) {
    const t = NOW;
    const u = (t - (tIn - 0.12)) / 0.5;
    if (u < 0 || u > 1) return '';
    const r = 10 + 260 * easeOutCubic(u), a = 1 - u;
    return `<g transform="translate(${CX} ${CY - 29})">
      <circle r="${r.toFixed(1)}" fill="#fff2c8" opacity="${(0.5 * a).toFixed(3)}" filter="url(#glow)"/>
      <circle r="${(r * 0.45).toFixed(1)}" fill="#fffaf0" opacity="${(0.75 * a).toFixed(3)}"/></g>`;
  }
  const SHIP = 'M-15,1 L15,1 L11,7 L-12,7 Z M-5,-4 L5,-4 L5,1 L-5,1Z M-1,-9 L2,-9 L2,-4 L-1,-4Z M-11,-1 L-7,-1 L-7,1 L-11,1Z';
  const SUB = 'M-16,2 C-16,-2 -10,-3 0,-3 C10,-3 16,-1 17,1 C16,3 10,4 0,4 C-10,4 -16,4 -16,2Z M-3,-3 L-2,-8 L4,-8 L5,-3Z';
  const CRATE = 'M-8,-7 L8,-7 L8,7 L-8,7Z M-8,-7 L8,7 M8,-7 L-8,7';
  const WHEAT = 'M0,9 L0,-9 M0,-6 C-4,-8 -5,-11 -4,-12 C-1,-11 0,-8 0,-6 M0,-6 C4,-8 5,-11 4,-12 C1,-11 0,-8 0,-6 M0,-1 C-4,-3 -5,-6 -4,-7 C-1,-6 0,-3 0,-1 M0,-1 C4,-3 5,-6 4,-7 C1,-6 0,-3 0,-1 M0,4 C-4,2 -5,-1 -4,-2 C-1,-1 0,2 0,4 M0,4 C4,2 5,-1 4,-2 C1,-1 0,2 0,4';
  const FORT = 'M-12,8 L-12,-4 L-8,-4 L-8,-8 L-4,-8 L-4,-4 L4,-4 L4,-8 L8,-8 L8,-4 L12,-4 L12,8Z';
  function icon(path, x, y, o = {}) {
    const s = o.s || 1, r = o.rot || 0, op = o.op == null ? 1 : o.op;
    return `<path d="${path}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(1)}) scale(${s.toFixed(3)})" fill="${o.col || RED}" stroke="${o.dk || RED_D}" stroke-width="${(1.3 / s).toFixed(2)}" opacity="${op.toFixed(3)}" ${o.noDrop ? '' : 'filter="url(#drop)"'}/>`;
  }
  function stroked(path, x, y, o = {}) {
    const s = o.s || 1, op = o.op == null ? 1 : o.op;
    return `<path d="${path}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(o.rot || 0).toFixed(1)}) scale(${s.toFixed(3)})" fill="none" stroke="${o.col || INK}" stroke-width="${((o.w || 1.8) / s).toFixed(2)}" stroke-linecap="round" opacity="${op.toFixed(3)}"/>`;
  }
  function counter(x, y, label, value, o = {}) {
    const op = o.op == null ? 1 : o.op;
    if (op <= 0) return '';
    const ls = o.lsize || 26, vs = o.vsize || 46;
    const w = Math.max(label ? tw(label, 'Elite', ls) : 0, tw(value, 'Oswald', vs, 1)) + 52, h = (label ? ls + 8 : 0) + vs + 26;
    const sc = o.scale || 1;
    const ax = o.anchor === 'right' ? -w : o.anchor === 'middle' ? -w / 2 : 0;
    return `<g opacity="${op.toFixed(3)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sc.toFixed(3)}) translate(${ax.toFixed(1)} 0)">
      <rect x="0" y="0" width="${w.toFixed(1)}" height="${h}" fill="rgba(244,236,214,0.95)" stroke="${INK}" stroke-width="1.8" filter="url(#drop)"/>
      <rect x="0" y="0" width="7" height="${h}" fill="${o.accent || INK}"/>
      ${label ? `<text x="26" y="${ls + 8}" font-family="Elite" font-size="${ls}" fill="${INK}">${esc(label)}</text>` : ''}
      <text x="26" y="${(label ? ls + 8 : 0) + vs + 6}" font-family="Oswald" font-weight="700" font-size="${vs}" letter-spacing="1" fill="${o.vcol || INK}">${esc(value)}</text></g>`;
  }
  function dimAll(op, col = '#140e08') { return op > 0.001 ? `<rect width="${W}" height="${H}" fill="${col}" opacity="${op.toFixed(3)}"/>` : ''; }

  const DEFS = `<defs>
    <filter id="drop" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2.5" stdDeviation="2.2" flood-color="#1a1008" flood-opacity="0.45"/></filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
    <pattern id="hatchR" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="12" height="12" fill="rgba(179,38,30,0.13)"/><line x1="0" y1="0" x2="0" y2="12" stroke="rgba(150,28,20,0.45)" stroke-width="2.2"/></pattern>
    <pattern id="hatchG" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="12" height="12" fill="rgba(125,119,108,0.16)"/><line x1="0" y1="0" x2="0" y2="12" stroke="rgba(95,90,82,0.45)" stroke-width="2.2"/></pattern>
  </defs>`;

  // ------------------------------------------------------------------ photos (HTML layer: map cards, PIPs, Ken Burns)
  const PH = {
    IMG01: { cap: 'Anzac Cove, 25 April 1915', credit: 'State Library of NSW, Mitchell Library' },
    IMG02: { cap: 'Churchill, Portsmouth, February 1915', credit: 'Agence Rol / BnF' },
    IMG03: { cap: 'HMS Irresistible, 18 March 1915. Real photo.', credit: 'Royal Navy / Library of Congress' },
    IMG05: { cap: 'Nusret, 1912', credit: 'Turkish General Staff' },
    IMG06: { cap: 'Mustafa Kemal, Gallipoli, 1915', credit: 'Turkish General Staff' },
    IMG07: { cap: 'AE2, Sydney, 1914', credit: 'Australian War Memorial H11559' },
    IMG09: { cap: 'Lone Pine, 6 August 1915', credit: 'Australian War Memorial A02022' },
    IMG10: { cap: 'The real “drip rifle”.', credit: 'Australian War Memorial G01291' },
    IMG11: { cap: 'Anzac Beach, December 1915', credit: 'Australian War Memorial H03482' },
    IMG12: { cap: 'Ottoman trench, Gallipoli', credit: 'Turkish General Staff' },
    IMG13: { cap: 'Petrograd, 1917. Real photo.', credit: 'J. M. Pringle / Library of Congress' },
    IMG14: { cap: 'The Referee, Sydney, 12 May 1915', credit: 'The Referee (public domain)' },
    IMG15: { cap: 'Anzac Day, 1916.', credit: 'Photo attrib. George Bell' },
    IMG16: { cap: 'Atatürk, 1923', credit: 'Agence Rol / BnF' },
    IMG17: { cap: 'Memorial at Arı Burnu, 2012', credit: 'Jorge Láscar, CC BY 2.0' },
    IMG18: { cap: 'Lone Pine Cemetery, Gallipoli, 2012', credit: 'Jorge Láscar, CC BY 2.0' },
    IMG20: { cap: 'Le Hamel, Somme, 9 August 1915', credit: 'Stéphane Passet / Musée Albert-Kahn, CC0' },
    IMG21: { cap: 'Bulgarian troops, 1915', credit: 'Unknown author' },
    IMG22: { cap: 'Anzac Cove, 2012', credit: 'Jorge Láscar, CC BY 2.0' },
  };
  let photoLayer, topSvg;
  const POOL = {};
  let DRAWS = [];          // photo draws this frame
  let CREDITS = [];        // tiny credits this frame
  function credit(id, op) { if (op > 0.05 && !CREDITS.find((c) => c.id === id)) CREDITS.push({ id, op }); }

  // map card: real photo, thin white border, drop shadow, pinned at a screen point, slight 3D tilt
  function card(key, id, x, y, w, op, o = {}) {
    if (op <= 0.003) return;
    DRAWS.push({ kind: 'card', key, id, x, y, w, op, ...o });
    if (!o.noCredit) credit(Array.isArray(id) ? id.join('+') : id, op * (o.grey ? 1 - o.grey : 1));
  }
  function geoCard(key, id, ll, t0, t1, w, o = {}) {
    const t = NOW;
    const a = win(t, t0, t1, 0.4, 0.45);
    if (a <= 0) return;
    const p = proj(ll);
    const u = easeOutBack(clamp((t - t0) / 0.55, 0, 1));
    const sc = (0.6 + 0.4 * u) * (o.scale || 1);
    card(key, id, p[0] + (o.dx || 0), p[1] + (o.dy || 0), w, a, { ...o, scale: sc, pinAt: p, dropY: (1 - u) * -40 });
  }
  function pip(key, id, side, t0, t1, w, o = {}) {
    const t = NOW;
    const a = win(t, t0, t1, 0.05, 0.4);
    if (a <= 0) return;
    const u = easeOutCubic(clamp((t - t0) / 0.6, 0, 1)), v = easeInCubic(clamp((t - (t1 - 0.45)) / 0.45, 0, 1));
    const off = (1 - u + v) * (w + 120);
    const y = o.y || 560;
    const x = side === 'left' ? (o.x || 80) + w / 2 - off : W - (o.x || 80) - w / 2 + off;
    DRAWS.push({ ...o, kind: 'card', key, id, x, y, w, op: Math.min(1, a * 1.5), pip: true, rot: side === 'left' ? -1.5 : 1.5, center: true });
    credit(id, a);
  }
  // full-screen Ken Burns: (fx0,fy0,s0) -> (fx1,fy1,s1): focus point (fraction of the image) and scale over the frame's cover size
  function kb(key, id, t0, t1, from, to, o = {}) {
    const t = NOW;
    if (t < t0 || t > t1) return;
    const u = clamp((t - t0) / (t1 - t0), 0, 1), e = sstep(0, 1, u);
    const fx = lerp(from[0], to[0], e), fy = lerp(from[1], to[1], e), s = lerp(from[2], to[2], e);
    const op = o.fadeIn ? sstep(t0, t0 + o.fadeIn, t) : 1;
    const opOut = o.fadeOut ? 1 - sstep(t1 - o.fadeOut, t1, t) : 1;
    DRAWS.push({ kind: 'kb', key, id, fx, fy, s, op: op * opOut, rect: o.rect ? o.rect(t) : null, capOp: o.capOp == null ? 1 : o.capOp(t) });
    credit(id, op * opOut * (o.capOp ? o.capOp(t) : 1));
  }

  function syncPhotos() {
    const seen = new Set();
    for (const d of DRAWS) {
      seen.add(d.key);
      let el = POOL[d.key];
      if (!el) {
        el = document.createElement('div');
        el.className = d.kind === 'kb' ? 'kb' : 'card';
        const ids = Array.isArray(d.id) ? d.id : [d.id];
        if (d.kind === 'kb') {
          el.innerHTML = `<img src="/ep/photos/${ids[0]}.jpg"/><div class="grain"></div><div class="kbcap"><span>${esc(PH[ids[0]].cap)}</span></div>`;
        } else {
          el.innerHTML = `<div class="row">${ids.map((i) => `<div class="cell"><img src="/ep/photos/${i}.jpg"/><div class="cap">${esc(d.capText ? d.capText[i] || PH[i].cap : PH[i].cap)}</div></div>`).join('')}</div><div class="pinhead"></div>`;
        }
        photoLayer.appendChild(el);
        POOL[d.key] = el;
      }
      el.style.display = '';
      if (d.kind === 'kb') {
        const img = el.firstChild, nat = SIZES[Array.isArray(d.id) ? d.id[0] : d.id];
        const R = d.rect || { x: 0, y: 0, w: W, h: H };
        const cover = Math.max(R.w / nat.w, R.h / nat.h) * d.s;
        const iw = nat.w * cover, ih = nat.h * cover;
        let ix = R.w / 2 - d.fx * iw, iy = R.h / 2 - d.fy * ih;
        ix = clamp(ix, R.w - iw, 0); iy = clamp(iy, R.h - ih, 0);
        el.style.left = R.x + 'px'; el.style.top = R.y + 'px'; el.style.width = R.w + 'px'; el.style.height = R.h + 'px';
        el.style.opacity = d.op.toFixed(3);
        el.style.borderWidth = d.rect ? `${clamp(10 * (1 - R.w / W) * 1.6, 0, 9).toFixed(1)}px` : '0px';
        img.style.width = iw.toFixed(1) + 'px'; img.style.height = ih.toFixed(1) + 'px';
        img.style.transform = `translate(${ix.toFixed(1)}px, ${iy.toFixed(1)}px)`;
        el.querySelector('.grain').style.backgroundPosition = `${(Math.floor(NOW * 24) * 137) % 512}px ${(Math.floor(NOW * 24) * 311) % 512}px`;
        el.querySelector('.kbcap').style.opacity = (d.capOp * (d.rect ? 0 : 1)).toFixed(3);
      } else {
        const ids = Array.isArray(d.id) ? d.id : [d.id];
        const cells = el.querySelectorAll('.cell img');
        ids.forEach((i, j) => { const nat = SIZES[i]; const cw = d.w / ids.length; cells[j].style.width = cw + 'px'; cells[j].style.height = (cw * nat.h / nat.w).toFixed(1) + 'px'; });
        const tiltX = d.pip ? 0 : (d.tiltX == null ? 7 : d.tiltX), tiltY = d.pip ? 0 : (d.tiltY == null ? -9 : d.tiltY);
        const rot = d.rot == null ? -2 : d.rot;
        const ty = d.center ? '-50%' : '-100%';
        // keep every card fully on screen (the pin still marks the true place)
        const cw = d.w + 18, ch = ids.reduce((m, i) => Math.max(m, (d.w / ids.length) * SIZES[i].h / SIZES[i].w), 0) + (d.noCap ? 9 : 60);
        const sc = (d.scale || 1);
        let cx = d.x, cy = d.y;
        if (!d.pip) {
          const hw = (cw * sc) / 2 + 24, top = (d.center ? (ch * sc) / 2 : ch * sc + 18) + 24, bot = d.center ? (ch * sc) / 2 + 24 : 24;
          cx = clamp(cx, hw, W - hw); cy = clamp(cy, top, H - bot);
        }
        el.style.left = cx.toFixed(1) + 'px'; el.style.top = (cy + (d.dropY || 0)).toFixed(1) + 'px';
        el.style.transform = `translate(-50%, ${ty}) translate(0, ${d.center ? 0 : -18}px) perspective(1400px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotate(${rot}deg) scale(${((d.scale || 1) * (d.sx == null ? 1 : d.sx)).toFixed(3)}, ${(d.scale || 1).toFixed(3)})`;
        el.style.opacity = Math.min(1, d.op).toFixed(3);
        el.style.filter = d.grey ? `grayscale(${d.grey.toFixed(2)}) brightness(${(1 - 0.25 * d.grey).toFixed(2)})` : '';
        el.querySelector('.pinhead').style.display = d.pip ? 'none' : '';
        el.querySelectorAll('.cap').forEach((c) => { c.style.display = d.noCap ? 'none' : ''; });
        el.style.zIndex = d.z || 1;
      }
    }
    for (const [k, el] of Object.entries(POOL)) if (!seen.has(k)) el.style.display = 'none';
  }
  function creditsSvg() {
    if (!CREDITS.length) return '';
    let s = '', y = H - 30;
    for (const c of CREDITS.slice().reverse()) {
      const ids = c.id.split('+');
      for (const id of ids.slice().reverse()) {
        const txt = PH[id].credit;
        const w = tw(txt, 'Elite', 16) + 18;
        s += `<g opacity="${(0.92 * c.op).toFixed(3)}"><rect x="${(W - 34 - w).toFixed(1)}" y="${y - 17}" width="${w.toFixed(1)}" height="23" rx="2" fill="rgba(20,14,8,0.5)"/><text x="${(W - 34 - w + 9).toFixed(1)}" y="${y}" font-family="Elite" font-size="16" fill="#f1e6cc">${esc(txt)}</text></g>`;
        y -= 27;
      }
    }
    return s;
  }

  // ------------------------------------------------------------------ DOM: maps
  let NOW = 0;
  const root = document.getElementById('root');
  const maps = {};
  const SHOW_AT = { europe: 20, aus: 16, aegean: 80, strait: 480, anzac: 2600 };
  function buildMap(id) {
    const div = document.createElement('div');
    div.className = 'map';
    div.id = id;
    let imgs = '';
    for (const [k, L] of Object.entries(LAYERS)) imgs += `<image data-k="${k}" href="/ep/assets/${L.file}" x="${L.x}" y="${L.y}" width="${L.w}" height="${L.h}" preserveAspectRatio="none"/>`;
    div.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <rect width="${W}" height="${H}" fill="#a9b8b0"/>
      <g class="cam">${imgs}
        <path class="coast" d="${GEO.coast}" fill="none" stroke="#2e2216" stroke-opacity="0.55" stroke-width="1.1" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
      </g></svg>
      <div class="tint warm" style="background:#e8b04a;mix-blend-mode:soft-light;opacity:0"></div>`;
    root.appendChild(div);
    maps[id] = {
      div, cam: div.querySelector('.cam'), coast: div.querySelector('.coast'), warm: div.querySelector('.warm'),
      imgs: [...div.querySelectorAll('image')].map((el) => ({ el, L: LAYERS[el.dataset.k], k: el.dataset.k })),
    };
  }
  function updateMap(m, cam, g) {
    m.cam.setAttribute('transform', `translate(${CX} ${CY}) scale(${cam.z.toFixed(5)}) translate(${(-cam.u).toFixed(6)} ${(-cam.v).toFixed(6)})`);
    const hw = W / 2 / cam.z, hh = H / 2 / cam.z;
    for (const { el, L, k } of m.imgs) {
      if (k === 'base') continue;
      const vis = cam.z > SHOW_AT[k] && L.x < cam.u + hw && L.x + L.w > cam.u - hw && L.y < cam.v + hh && L.y + L.h > cam.v - hh;
      el.style.display = vis ? '' : 'none';
    }
    // vector coast is for regional views; close-up layers carry their own terrain-derived coast
    m.coast.setAttribute('stroke-opacity', (0.55 * (1 - sstep(110, 240, cam.z))).toFixed(3));
    m.coast.setAttribute('stroke-width', clamp(0.55 + cam.z / 60, 0.7, 1.6).toFixed(2));
    const sat = (1 - 0.8 * g.desat) * (1 - 0.15 * g.gold);
    const bri = (1 - 0.14 * g.desat) * (1 - 0.06 * g.gold) * (1 - 0.35 * g.dim);
    m.div.style.filter = `saturate(${sat.toFixed(3)}) brightness(${bri.toFixed(3)}) sepia(${(0.22 * g.gold + 0.1 * g.desat).toFixed(3)})`;
    m.warm.style.opacity = (0.38 * g.gold).toFixed(3);
  }

  // ------------------------------------------------------------------ build all choreography
  let G = {};
  let R = {};      // routes (UV polylines)
  let T = {};      // named beat times (shared with the cue export)
  const Bx = (id) => BR.find((b) => b.id === id);
  const KBx = (id) => KBS.find((k) => k.id === id);
  function track(keys) {
    return (t) => {
      if (t <= keys[0][0]) return keys[0][1];
      for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return lerp(v0, v1, sstep(t0, t1, t)); }
      return keys[keys.length - 1][1];
    };
  }

  function setup() {
    BR = TL.broll; KBS = TL.kb;
    KEYS = [];
    const b = Object.fromEntries(BR.map((x) => [x.id, x]));
    const ll = (id) => [b[id].lon, b[id].lat];
    // zoom-through: arrive on the pin at tIn (pin tip parked at frame centre), push in hidden, pull back after tOut
    function zIn(id, approachZ, z) { const x = b[id]; if (approachZ) K(x.tIn - 0.6, ll(id), approachZ, 'io'); K(x.tIn, ll(id), z, 'in'); K(x.tOut, ll(id), z * 1.3, 'lin'); }
    function zOut(id, to, z, dur = 1.3) { K(b[id].tOut + dur, to, z, 'out'); }
    function zt(id, approachZ, z, to, zz, dur) { zIn(id, approachZ, z); zOut(id, to, zz, dur); }

    // ===== COLD OPEN =====
    zIn('B01', null, 22000);                                      // frame 1 is B01; plate parked on the cove pin
    zOut('B01', [26.33, 40.235], 2600, 1.7);
    K(A('V02', 'eight'), [26.37, 40.23], 1500);
    K(b.B02.tIn - 1.6, [26.33, 40.235], 1650, 'lin');
    zt('B02', 7000, 24000, [26.36, 40.24], 1500, 1.2);
    K(A('V03', 'what', 1), [26.5, 40.32], 1000);
    K(A('V03', 'worked') + 0.4, [27.6, 40.6], 300);
    // M03: pull out to Europe
    K(A('V04', 'empire'), [27, 43.5], 46);
    K(A('V04', 'early') + 0.3, [24, 46], 25);
    K(b.B03.tIn - 1.4, [25, 44], 27, 'lin');
    zt('B03', 1400, 9000, [24.5, 46], 25, 1.7);
    K(E('V04'), [24.0, 46.3], 26, 'lin');
    K(S('V05'), [23.0, 46.6], 27.5, 'lin');
    // ===== ACT 1 =====
    K(A('V05', 'map') + 0.4, [10, 48], 33);
    K(A('V05', 'france'), [5.5, 49.3], 64);
    K(A('V05', 'switzerland') + 0.3, [5.2, 49.0], 70, 'lin');
    zt('B04', 600, 12000, [5, 47], 30, 1.3);
    K(A('V06', 'churchill') + 0.4, [3, 48], 30);
    K(A('V06', 'front'), [6, 46], 25);
    K(E('V06') + 0.3, [12, 42], 19);
    K(A('V07', 'dardanelles'), [26.3, 40.35], 250);
    K(A('V07', 'turkey') + 0.6, [27.5, 40.3], 330);
    K(A('V07', 'push'), [27.6, 40.45], 380, 'lin');
    K(A('V07', 'istanbul') + 0.4, [28.0, 40.7], 400);
    zt('B05', 1600, 12000, [31, 43], 55, 1.6);
    K(A('V08', 'collapse'), [33, 40.5], 46);
    K(A('V08', 'sea'), [31.5, 44], 40);
    K(A('V08', 'wheat'), [30.5, 44.5], 38);
    K(E('V08') + 0.3, [29, 43], 50, 'lin');
    zt('B06', 700, 12000, [26.30, 40.08], 3000, 1.3);
    K(S('V10') + 2.0, [26.31, 40.08], 3200, 'lin');
    zt('B07', 7000, 26000, [26.32, 40.085], 4600, 1.2);
    K(E('V10') + 0.2, [26.32, 40.08], 4900, 'lin');
    zIn('B08', 9500, 28000);                                         // exits by dissolve to IMG03 (camera moves hidden)
    K(KBx('IMG03').t0 + 0.6, [26.30, 40.075], 3500, 'io');
    K(KBx('IMG03').t1, [26.30, 40.075], 3500, 'lin');
    K(E('V11') + 1.1, [26.33, 40.10], 3300, 'lin');
    zt('B09', 8000, 30000, [26.37, 40.13], 5200, 1.3);
    K(A('V12', 'historians'), [26.36, 40.135], 5000, 'lin');
    K(A('V12', 'army'), [26.27, 40.17], 1700);
    K(E('V12') + 0.5, [26.26, 40.19], 1800, 'lin');
    // ===== ACT 2 =====
    K(A('V13', 'april'), [26.25, 40.24], 3800);
    K(A('V13', '16'), [26.255, 40.243], 6000);
    zIn('B10', 9000, 22000);                                         // B10 -> B11 dissolve -> IMG01 full-screen -> morph to its pin
    K(KBx('IMG01').t0 + 0.4, [26.285, 40.243], 9500, 'io');
    K(KBx('IMG01').t1, [26.285, 40.243], 9500, 'lin');
    K(A('V15', 'race'), [26.30, 40.250], 8200);
    K(A('V15', 'peninsula'), [26.32, 40.225], 3000);
    K(E('V15') + 0.3, [26.31, 40.235], 3300, 'lin');
    K(A('V16', 'mustafa'), [26.31, 40.258], 9000);
    zt('B12', 15000, 26000, [26.300, 40.255], 10500, 1.2);
    K(E('V16') + 0.3, [26.30, 40.252], 10000, 'lin');
    K(A('V16b', 'water'), [26.27, 40.06], 2600);
    K(A('V16b', 'sneaks'), [26.33, 40.11], 2800);
    K(b.B12b.tIn - 1.0, [26.55, 40.33], 2600);
    zt('B12b', 6000, 24000, [26.31, 40.248], 5200, 1.4);
    K(A('V16b', 'dig'), [26.284, 40.246], 9500);
    K(A('V16b', 'five'), [26.42, 40.29], 2200);
    K(E('V16b') + 0.7, [26.46, 40.30], 2000, 'lin');
    zt('B13', 12000, 30000, [26.293, 40.256], 20000, 1.0);
    K(b.B14.tIn - 0.7, [26.293, 40.256], 22000, 'lin');
    zt('B14', null, 34000, [26.298, 40.252], 12500, 1.2);
    K(A('V18', 'lone'), [26.297, 40.251], 12500);
    K(A('V18', 'choonukbaya'), [26.301, 40.254], 12000);
    zt('B15', 20000, 32000, [26.305, 40.262], 15000, 1.2);
    K(E('V18') + 0.6, [26.30, 40.26], 14000, 'lin');
    K(S('V19') + 1.2, [26.27, 40.25], 8500);
    zIn('B16', 12000, 20000);
    K(b.B18.tIn, ll('B18'), 26000, 'io');                            // hidden under B16 / B17 / IMG10
    K(b.B18.tOut, ll('B18'), 30000, 'lin');
    zOut('B18', [26.21, 40.27], 4200, 1.3);
    K(E('V20') + 0.1, [26.22, 40.27], 4400, 'lin');
    zIn('B19', 9000, 26000);                                         // -> IMG18 -> M21
    K(KBx('IMG18').t0 + 0.6, [26.33, 40.20], 1700, 'io');
    K(S('V22'), [26.32, 40.21], 1800, 'lin');
    // ===== ACT 3 (gold leads) =====
    K(A('V22', 'august'), [26.30, 40.25], 5200);
    K(A('V22', 'forts'), [26.36, 40.15], 4600);
    zIn('B20', 9000, 24000);
    K(b.B21.tIn, ll('B21'), 20000, 'io');                            // hidden under B20
    K(b.B21.tOut, ll('B21'), 26000, 'lin');
    zOut('B21', [34, 37.5], 40, 1.7);
    K(E('V23') + 0.2, [33, 38], 42, 'lin');
    K(A('V24', 'map'), [25, 42.4], 135);
    K(E('V24') + 0.3, [25.4, 42.6], 150, 'lin');
    K(A('V25', 'russia') + 0.3, [33, 47.5], 31);
    zIn('B22', 260, 3000);                                           // -> IMG13 -> M26
    K(KBx('IMG13').t0 + 0.6, [35, 51], 29, 'io');
    K(A('V26', 'problems'), [36, 51.5], 33, 'lin');
    zIn('B23', 300, 6000);
    K(b.B24.tIn, ll('B24'), 4200, 'io');                             // hidden under B23
    K(b.B24.tOut, ll('B24'), 5400, 'lin');
    zOut('B24', [40, 31.5], 72, 1.4);
    K(E('V27') + 1.5, [40.3, 31.6], 74, 'lin');                      // hold through mid-roll 2
    // ===== ACT 4 =====
    K(b.B25.tIn - 0.75, [40.2, 31.6], 74, 'lin');
    zIn('B25', null, 20000);
    zOut('B25', [80, 15], 9, 2.0);
    K(A('V29', '14') + 0.2, [134, -27], 36);
    K(A('V29', 'gallipoli'), [139, -29], 42);
    K(b.B26.tIn - 1.5, [146, -32], 70);
    zIn('B26', 500, 9000);                                           // -> IMG15 -> B27 -> iris out at Canberra
    K(b.B27.tIn, ll('B27'), 20000, 'io');
    K(b.B27.tOut, ll('B27'), 26000, 'lin');
    zOut('B27', [148, -33], 30, 1.4);
    K(S('V31') + 0.6, [146, -32], 30, 'lin');
    K(b.B28.tIn - 1.6, [146, -32], 33, 'lin');
    zt('B28', 300, 9000, [80, 15], 9, 2.0);
    K(A('V32', 'other') + 0.5, [33, 39.4], 88);
    K(A('V32', 'founded'), [32.5, 39.4], 100);
    zt('B29', 700, 9000, [28, 40.5], 280, 1.6);
    K(A('V33', '1985'), [26.32, 40.25], 3200);
    K(A('V33', 'anzac'), [26.282, 40.245], 9500);
    K(b.B30.tIn - 1.5, [26.280, 40.2465], 11000, 'lin');
    zIn('B30', 14000, 24000);                                        // -> IMG17 -> B31 -> iris out at the cove
    K(b.B31.tIn, ll('B31'), 22000, 'io');
    K(b.B31.tOut, ll('B31'), 26000, 'lin');
    zOut('B31', [88, 3], 11.0, 2.4);
    K(E('V34') + 1.5, [88, 2], 11.3, 'lin');
    // M35 split (each half offsets its own camera from this one)
    K(S('V35') + 0.8, [30, 41], 30);
    K(b.B32.tIn - 1.6, [28, 41], 34, 'lin');
    zt('B32', 1600, 20000, [26.6, 40.6], 300, 1.6);
    K(S('V36') + 3, [27.5, 40.8], 260, 'lin');
    K(TL.duration, [28.5, 41.0], 220, 'lin');

    KEYS.sort((a, c) => a.t - c.t);
    for (let i = 1; i < KEYS.length; i++) if (KEYS[i].t - KEYS[i - 1].t < 0.05) KEYS[i].t = KEYS[i - 1].t + 0.05;

    // grade tracks
    const g0 = S('V22') - 0.2, g1 = TL.marks.midroll2 - 0.4;
    G.gold = (t) => Math.max(win(t, g0, g1, 0.9, 0.6), win(t, A('V31', 'if') - 0.1, b.B28.tIn + 0.3, 0.8, 0.3));
    G.desat = track([[0, 0], [A('V21', 'defeat'), 0], [A('V21', 'defeat') + 1, 0.0], [KBx('IMG18').t1, 0.75], [S('V22') - 0.3, 0.75], [S('V22') + 0.6, 0]]);
    G.dim = track([[0, 0], [TL.marks.endScreen - 13, 0], [TL.marks.endScreen - 12, 0]]);

    // routes
    R.m02 = splineUV([P.cove, [26.31, 40.225], P.maidos, [26.43, 40.24], [26.62, 40.39], [26.95, 40.52], [27.6, 40.75], [28.4, 40.92], [28.9, 41.0]]);
    R.collapse = curveUV(P.constantinople, [35.5, 38.8], -0.2);
    R.russia = splineUV([P.constantinople, P.bosphorus, [30.2, 42.6], [31.0, 44.5], P.odessa, [33.5, 50.0]]);
    R.early = curveUV(P.constantinople, [14.0, 51.0], -0.22);
    R.front = splineUV(FRONT, 8).map((p, i) => [p[0] + (i % 2 ? 0.07 : -0.07) * Math.cos(i * 0.7), p[1] + (i % 3 - 1) * 0.05]);
    R.backdoor = splineUV([[-1.5, 50.4], [-5.5, 48.2], [-9.8, 43.0], [-9.6, 38.6], [-6.3, 36.0], [0, 37.0], [10, 37.6], [14.6, 35.6], [20.5, 36.4], [24.5, 38.8], [26.15, 40.0]]);
    R.searoute = splineUV([[24.0, 38.6], [26.0, 39.9], P.kepez, P.kilitbahir, P.nara, [26.62, 40.39], [27.5, 40.72], [28.9, 40.96], P.bosphorus, [30.0, 42.4], [31.3, 44.6], [30.9, 46.2]]);
    R.wheat = splineUV([[33.5, 47.6], [31.6, 46.0], [30.4, 43.6], P.bosphorus, [28.4, 40.88], [26.8, 40.45], P.kilitbahir, [26.1, 39.9], [24.5, 38.0]]);
    R.fleetIn = splineUV([[26.12, 39.97], P.entrance, [26.28, 40.05], [26.33, 40.085]]);
    R.mines = splineUV([[26.355, 40.098], [26.338, 40.083], [26.322, 40.068], [26.306, 40.058]]);
    R.pushGold = splineUV([[26.31, 40.07], P.kepez, P.kilitbahir, P.nara, [26.50, 40.30]]);
    R.toArmy = splineUV([P.mudros, [25.7, 40.05], [26.05, 40.22], [26.24, 40.245]]);
    R.landing = splineUV([[26.10, 40.215], [26.18, 40.235], [26.24, 40.245], [26.272, 40.2462]]);
    R.ridges = [splineUV([P.cove, [26.290, 40.252], [26.302, 40.262], P.chunuk]), splineUV([P.cove, [26.285, 40.243], [26.293, 40.238], [26.305, 40.236]]), splineUV([[26.272, 40.240], [26.280, 40.232], P.lonepine])];
    R.goal = splineUV([P.chunuk, [26.33, 40.23], [26.35, 40.20], P.maidos]);
    R.redUp = [splineUV([P.boghali, [26.325, 40.260], [26.318, 40.267]]), splineUV([[26.34, 40.235], [26.315, 40.238], [26.302, 40.239]])];
    R.sub = splineUV([[26.13, 39.98], P.entrance, [26.28, 40.055], P.kepez, P.kilitbahir, P.nara, [26.55, 40.33], [26.70, 40.42], [26.95, 40.50]]);
    R.subMines = [[[26.31, 40.112], [26.395, 40.085]], [[26.335, 40.125], [26.41, 40.105]], [[26.355, 40.138], [26.415, 40.125]]];
    R.trenchA = splineUV([[26.2875, 40.2610], [26.2900, 40.2590], [26.2920, 40.2572], [26.2938, 40.2556], [26.2958, 40.2536], [26.2978, 40.2512]], 10).map((p, i) => [p[0] + (i % 2 ? 0.0003 : -0.0003), p[1]]);
    R.trenchR = splineUV([[26.2885, 40.2618], [26.2911, 40.2598], [26.2931, 40.2580], [26.2949, 40.2564], [26.2969, 40.2544], [26.2989, 40.2520]], 10).map((p, i) => [p[0] + (i % 2 ? -0.0003 : 0.0003), p[1]]);
    R.evac = [splineUV([P.cove, [26.22, 40.24], [26.05, 40.22], [25.85, 40.17]]), splineUV([[26.27, 40.30], [26.18, 40.30], [25.98, 40.25]]), splineUV([[26.278, 40.236], [26.20, 40.215], [25.95, 40.12]])];
    R.goldShips = splineUV([[26.22, 40.03], [26.30, 40.07], P.kepez, P.kilitbahir, P.nara, [26.55, 40.33]]);
    R.surrender = curveUV(P.constantinople, [29.6, 42.6], 0.25);
    R.asia = curveUV(P.constantinople, [34.0, 39.6], -0.18);
    R.goldRussia = splineUV([[26.0, 39.6], P.kilitbahir, [26.9, 40.5], [28.9, 40.96], P.bosphorus, [31.0, 43.5], [32.6, 45.8], [35.5, 49.5], [37.6, 54.5]]);
    R.ausTr = curveUV([149.13, -35.28], [26.3, 40.2], 0.16, 96);
  }

  // ------------------------------------------------------------------ named beat times + cue export
  function times() {
    const b = Object.fromEntries(BR.map((x) => [x.id, x]));
    const kbx = Object.fromEntries(KBS.map((x) => [x.id, x]));
    T = {
      // cold open
      cnt1: A('V02', 'eight'), cnt2: A('V02', '8'), img01: A('V02', '8') + 0.3,
      m02a: A('V03', 'what', 1) - 0.1, m02b: A('V03', 'worked') + 0.7, flip: A('V03', 'what', 1) + 0.5,
      arCollapse: A('V04', 'empire') - 0.4, arRussia: A('V04', 'russia') - 0.3, arEarly: A('V04', 'early') - 0.6,
      pulse0: b.B03.tOut + 0.3, freeze: E('V04') - 0.2, title: TL.marks.title,
      // act 1
      eur: A('V05', 'map') + 0.4, front0: A('V05', 'stretch') - 0.9, front1: A('V05', 'switzerland') + 0.3,
      img20: A('V05', 'switzerland') - 0.3, img02: A('V06', 'churchill'), frontDoor: A('V06', 'front'),
      back0: A('V06', 'go') - 0.1, back1: E('V06') + 1.0, dard: A('V07', 'dardanelles'), ott: A('V07', 'ottoman'),
      turk: A('V07', 'turkey'), push0: A('V07', 'push'), push1: A('V07', 'constantinople') + 0.3, const: A('V07', 'constantinople'),
      ist: A('V07', 'istanbul'), empire: A('V08', 'ottoman') - 0.2, crack: A('V08', 'collapse'), sea0: A('V08', 'sea'), sea1: A('V08', 'opens') + 0.5,
      crates: A('V08', 'weapons'), wheat: A('V08', 'wheat') - 0.2,
      fleet0: b.B06.tOut + 0.2, fleet1: b.B06.tOut + 2.2, date18: b.B06.tOut + 0.25,
      mines: b.B07.tOut + 0.25, img05: b.B07.tOut + 0.7,
      sink: [kbx.IMG03.t1 + 0.25, kbx.IMG03.t1 + 0.75, kbx.IMG03.t1 + 1.25], retract: A('V11', 'never') - 0.3,
      shells: b.B09.tOut + 0.25, img02b: b.B09.tOut + 0.7, gold0: A('V12', 'push') - 0.4, goldFade: A('V12', 'historians') + 0.2,
      army0: A('V12', 'army') - 0.9, army1: A('V12', 'army') + 0.5,
      // act 2
      land0: A('V13', 'april') - 0.3, land1: A('V13', 'dawn') + 0.6, cnt16: A('V13', '16') - 0.1,
      morph0: kbx.IMG01.t1 - 1.05, morph1: kbx.IMG01.t1, planned: kbx.IMG01.t1 + 0.15, landed: kbx.IMG01.t1 + 0.45,
      race0: A('V15', 'race') - 0.2, race1: A('V15', 'high') + 0.5, goal0: A('V15', 'cut'), goal1: A('V15', 'peninsula') + 0.7,
      img06: A('V16', 'mustafa'), red0: b.B12.tOut + 0.2, stop: A('V16', 'hold'),
      subMines: A('V16b', 'water') - 0.4, sub0: A('V16b', 'sneaks') - 0.8, sub1: b.B12b.tIn - 0.35, img07: A('V16b', 'ae'),
      subLabel: A('V16b', 'minefields') + 0.2, stay: b.B12b.tOut + 0.35, dig: A('V16b', 'dig'),
      trench: b.B13.tOut + 0.15, hot: A('V17', 'scorching') - 0.2, cold: A('V17', 'freezing'), pipL: b.B13.tOut + 0.5, pipR: b.B13.tOut + 0.8,
      lone: A('V18', 'lone'), nek: A('V18', 'neck'), chunuk: A('V18', 'choonukbaya'), flag: b.B15.tOut + 0.2, pushed: A('V18', 'pushed') - 0.2,
      evac: b.B18.tOut + 0.3, none: A('V20', 'almost'), img11: b.B18.tOut + 0.6,
      mem: kbx.IMG18.t1 + 0.1,
      // act 3
      gFlags: A('V22', 'anzacs'), grey: A('V22', 'forts'), gShips0: A('V22', 'fleet') - 1.6, gShips1: b.B20.tIn + 0.2,
      surr: b.B21.tOut + 0.25, asia: A('V23', 'others') - 0.2, bul: A('V24', 'bulgaria'), joined: A('V24', 'joined') - 0.3,
      img21: A('V24', 'bulgaria') + 0.3, flick: A('V24', 'might'), gRus0: A('V25', 'sea') - 0.3, gRus1: A('V25', 'opens') + 0.6,
      rev: kbx.IMG13.t1 + 0.25, revQ: A('V25', 'revolution') - 0.1, arg0: A('V26', 'barely'), arg1: A('V26', 'problems'),
      thin0: A('V26', 'fantasy'), thin1: A('V26', 'route'), bord0: A('V27', 'borders') - 0.3, bord1: A('V27', 'region') + 0.7, wob: A('V27', 'could') - 0.1,
      // act 4
      nation: A('V29', '14') - 0.3, img14: A('V29', 'gallipoli'), cal: b.B27.tOut + 0.45, calFlip: b.B27.tOut + 1.0, img15c: b.B27.tOut + 0.6,
      goldIf: A('V31', 'if') - 0.1, slide: A('V31', 'if') + 0.3, list: A('V31', 'date') - 0.4,
      img16: A('V32', 'mustafa'), img06b: A('V32', 'mustafa') + 0.5, rep: A('V32', 'founded'),
      ari: A('V33', '1985') + 0.4, koyu: A('V33', 'named'), split: A('V33', 'cove') + 0.3,
      p34a: b.B31.tOut + 0.9, p34b: b.B31.tOut + 1.3, gl0: A('V34', 'both') - 0.7, gl1: A('V34', 'both') + 1.3,
      sp0: S('V35') + 0.2, sp1: b.B32.tIn - 1.25, ep0: S('V36') + 0.3, endS: TL.marks.endScreen,
    };
    // cues for the mix: pin drops, label clicks, counter ticks, line draws
    const pinT = [];
    for (const x of BR) if (x.entry === 'iris') pinT.push([x.tIn - 1.15, `zoom-through pin ${x.id}`]);
    pinT.push([T.cnt1 - 0.6, 'cove pin'], [T.planned, 'pin Planned?'], [T.landed, 'pin Landed'], [T.stay - 0.1, 'beach pin'],
      [T.lone, 'pin Lone Pine'], [T.nek, 'pin The Nek'], [T.chunuk, 'pin Chunuk Bair'], [T.p34a, 'pin Australia'], [T.p34b, 'pin Türkiye']);
    for (const [t, l] of pinT) cue('pin', t, l);
    for (const [t, l] of [[T.cnt1, 'Counter: 8 months'], [T.cnt2, 'Counter: 8,700+ Australians killed'], [T.cnt16, 'Counter: ~16,000'],
      [T.hot, 'Counter: +35°'], [T.cold, 'Counter flips: −10°'], [T.none, 'Counter: casualties in the escape'], [T.nation, 'Counter: Nation since 1901'],
      [T.date18, 'Date: 18 MARCH 1915'], [T.calFlip, 'Calendar flips: 25 APRIL']]) cue('tick', t, l);
    for (const [t, l] of [[T.img01, 'card IMG01'], [T.img02, 'card IMG02'], [T.img02b, 'card IMG02 back'], [T.img06, 'card IMG06'], [T.img07, 'card IMG07'],
      [T.img11, 'card IMG11'], [T.img14, 'card IMG14'], [T.img16, 'card IMG16'], [T.split, 'split card'], [T.img21, 'card IMG21'],
      [T.frontDoor, 'FRONT DOOR'], [T.const, 'CONSTANTINOPLE'], [T.turk, 'Türkiye'], [T.shells, 'Almost out of shells?'], [T.koyu, 'Anzac Koyu label'],
      [T.joined, "Joined Germany's side"], [T.rep, '1923 label'], [T.arg0, 'argument line 1'], [T.arg1, 'argument line 2'],
      [T.arCollapse + 1.0, 'Empire collapses?'], [T.arRussia + 1.0, 'Russia saved?'], [T.arEarly + 1.0, 'War ends early?'],
      [T.surr + 0.9, 'Surrender?'], [T.asia + 1.1, 'Fight on from Asia?'], [T.army1, 'Send the army'], [T.subLabel, 'AE2 label']]) cue('click', t, l);
    for (const [a, z, l] of [[T.m02a, T.m02b, 'gold arrow through the strait'], [T.front0, T.front1, 'trench line North Sea to Switzerland'],
      [T.back0, T.back1, 'BACK DOOR arrow'], [T.push0, T.push1, 'arrow to Constantinople'], [T.sea0, T.sea1, 'sea route to Russia'],
      [T.land0, T.land1, 'landing arrow'], [T.race0, T.race1, 'arrows up the ridges'], [T.goal0, T.goal1, 'gold line to the strait'],
      [T.sub0, T.sub1, 'AE2 through the mine lines'], [T.evac, T.evac + 1.4, 'evacuation arrows'], [T.gRus0, T.gRus1, 'gold route to Russia'],
      [T.bord0, T.bord1, 'post-war borders'], [T.gl0, T.gl1, 'gold line Australia–Türkiye']]) cue('draw', a, l, { t1: +z.toFixed(3) });
    CUES.sort((a, c) => a.t - c.t);
  }

  // ------------------------------------------------------------------ overlays (one SVG per frame + photo draws)
  function shipAt(uv, f, o = {}) {
    const p = projUV(pointAt(uv, f));
    return icon(SHIP, p[0], p[1], { col: o.col || BLUE, dk: o.dk || BLUE_D, s: o.s || 1.2, rot: o.rot != null ? o.rot : headingAt(uv, f) * 0 , op: o.op });
  }
  function questionMark(x, y, a, s = 1, col = GOLD) {
    if (a <= 0) return '';
    return `<g opacity="${a.toFixed(3)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})"><circle r="30" fill="rgba(250,238,205,0.95)" stroke="${GOLD_D}" stroke-width="3" filter="url(#drop)"/><text y="16" text-anchor="middle" font-family="Playfair" font-weight="900" font-size="46" fill="${col}">?</text></g>`;
  }
  function zpins(t) {
    // the pin each zoom-through dives into (and that each clip shrinks back into)
    let s = '';
    for (const x of BR) {
      const ll = [x.lon, x.lat];
      if (x.entry === 'iris') s += pin(ll, x.tIn - 1.15, { until: x.tIn + 0.15, col: INK }) + flare(x.tIn);
      if (x.exit === 'iris') { if (t >= x.tOut - 0.1 && t < x.tOut + 1.6) s += pin(ll, x.tOut - 0.5, { until: x.tOut + 1.6, col: INK }); }
    }
    return s;
  }
  function frontLine(p, op) {
    if (p <= 0) return '';
    return line(R.front, p, { col: '#3a2716', w: 5.5, under: 'rgba(244,236,214,0.8)', underW: 5, op }) +
      line(R.front, p, { col: RED, w: 13, dash: '2.5 9', op: op * 0.9 });
  }
  function fortIcons(t, greyU) {
    let s = '';
    for (const ll of [P.kilitbahir, P.canakkale, [26.39, 40.175], [26.35, 40.12], [26.205, 40.04], [26.19, 40.008]]) {
      const p = proj(ll);
      if (!onScreen(p)) continue;
      const col = greyU > 0 ? GREY : RED;
      s += icon(FORT, p[0], p[1], { s: 1.3, col: greyU > 0.5 ? GREY : col, dk: greyU > 0.5 ? '#3d3a34' : RED_D, op: 1 });
    }
    return s;
  }
  function calendarCard(x, y, t, mode) {
    // mode: 'flip' (to 25 APRIL) or 'list' (25 APRIL becomes one ordinary date in a list)
    const a = win(t, T.cal, T.slide + 5.4 > T.list + 3 ? T.list + 3.2 : T.list + 3.2, 0.4, 0.5);
    if (a <= 0) return '';
    const fu = clamp((t - T.calFlip) / 0.5, 0, 1);
    const lu = sstep(T.list, T.list + 1.2, t);
    let body = '';
    const w = 300, h = 300;
    body += `<rect x="${-w / 2}" y="0" width="${w}" height="${h}" fill="#f6efdc" stroke="${INK}" stroke-width="2" filter="url(#drop)"/>`;
    body += `<rect x="${-w / 2}" y="0" width="${w}" height="54" fill="${lerp(0, 1, lu) > 0.5 ? '#b08a3a' : RED}"/>`;
    for (let i = 0; i < 5; i++) body += `<circle cx="${-100 + i * 50}" cy="0" r="7" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>`;
    // date face: 24 -> flips -> 25 APRIL
    const faceOp = 1 - lu;
    const sq = fu < 0.5 ? 1 - fu * 2 : (fu - 0.5) * 2;
    const day = fu < 0.5 ? '24' : '25';
    body += `<g opacity="${faceOp.toFixed(3)}" transform="translate(0 ${54 + 125}) scale(1 ${Math.max(0.02, sq).toFixed(3)})">
      <text y="40" text-anchor="middle" font-family="Playfair" font-weight="900" font-size="150" fill="${INK}">${day}</text></g>
      <text x="0" y="40" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="34" letter-spacing="6" fill="${PAPER}" opacity="${faceOp.toFixed(3)}">APRIL</text>`;
    if (lu > 0) {
      const rows = ['3 MARCH', '17 JUNE', '25 APRIL', '9 OCTOBER', '28 NOVEMBER'];
      body += `<g opacity="${lu.toFixed(3)}">` + rows.map((r, i) => `<text x="${-w / 2 + 34}" y="${92 + i * 44}" font-family="Elite" font-size="28" fill="${INK}">${r}</text><line x1="${-w / 2 + 30}" x2="${w / 2 - 30}" y1="${104 + i * 44}" y2="${104 + i * 44}" stroke="${INK}" stroke-opacity="0.25"/>`).join('') + '</g>';
    }
    const big = fu >= 0.5 && lu < 0.05 ? 'APRIL' : '';
    return `<g opacity="${a.toFixed(3)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(-3)">${body}</g>` + (big && false ? '' : '');
  }

  function overlays(t) {
    const iz = (1 / CAM.z).toFixed(6);
    let s = `<defs><pattern id="hatchRg" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="scale(${iz}) rotate(35)"><rect width="12" height="12" fill="rgba(179,38,30,0.13)"/><line x1="0" y1="0" x2="0" y2="12" stroke="rgba(150,28,20,0.45)" stroke-width="2.2"/></pattern><pattern id="hatchGg" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="scale(${iz}) rotate(-35)"><rect width="12" height="12" fill="rgba(125,119,108,0.16)"/><line x1="0" y1="0" x2="0" y2="12" stroke="rgba(95,90,82,0.45)" stroke-width="2.2"/></pattern></defs>`;
    const add = (x) => { if (x) s += x; };
    const b = Object.fromEntries(BR.map((x) => [x.id, x]));
    const kbx = Object.fromEntries(KBS.map((x) => [x.id, x]));
    add(zpins(t));

    // ================= COLD OPEN =================
    // cove pin + counters + IMG01 card (M01)
    add(pin(P.cove, T.cnt1 - 0.6, { col: BLUE, dk: BLUE_D, until: b.B02.tIn - 0.4 }));
    add(placeLabel(P.cove, 'Anzac Cove', T.cnt1 - 0.4, { until: b.B02.tIn - 0.5, dy: 34, size: 24 }));
    add(geoText(P.cove, 'GALLIPOLI', win(t, b.B01.tOut + 0.8, b.B02.tIn - 0.5), { dx: 230, dy: -260, size: 40, ls: 10 }));
    add(counter(1420, 120, '', '8 months', { op: win(t, T.cnt1, b.B02.tIn - 0.4, 0.25, 0.4), scale: 0.9 + 0.1 * easeOutBack(clamp((t - T.cnt1) / 0.35, 0, 1)) }));
    add(counter(1420, 222, '', '8,700+ Australians killed', { op: win(t, T.cnt2, b.B02.tIn - 0.4, 0.25, 0.4), vsize: 40, scale: 0.9 + 0.1 * easeOutBack(clamp((t - T.cnt2) / 0.35, 0, 1)) }));
    geoCard('img01', 'IMG01', P.cove, T.img01, b.B02.tIn - 0.4, 340, { dx: -230, dy: -40 });
    // M02: gold dotted arrow across the peninsula and through the strait to Constantinople; IMG01 flips to a gold "?"
    {
      const p = prog(t, T.m02a, T.m02b);
      const op = 1 - sstep(b.B03.tIn - 0.8, b.B03.tIn - 0.2, t);
      add(dotted(R.m02, p, { glow: 0.6 + 0.4 * Math.sin(t * 4), op, w: 8 }));
      add(placeLabel(P.constantinople, 'Constantinople', T.m02b - 0.3, { until: T.arCollapse + 0.2, dy: 40 }));
      // card flip: front (real photo) narrows to 0, back (gold "?") opens — the photo face never sits on the what-if arrow
      const c0 = b.B02.tOut + 0.4, c1 = A('V04', 'empire') - 1.2;
      if (t > c0 && t < c1) {
        const pc = proj(P.cove);
        const fu = clamp((t - T.flip) / 0.5, 0, 1);
        const a = win(t, c0, c1, 0.4, 0.4);
        if (fu < 0.5) card('img01b', 'IMG01', pc[0] - 230, pc[1] - 40, 300, a, { sx: 1 - fu * 2 });
        else {
          const sx = (fu - 0.5) * 2;
          add(`<g opacity="${a.toFixed(3)}" transform="translate(${(pc[0] - 230).toFixed(1)} ${(pc[1] - 40 - 130).toFixed(1)}) rotate(-2) scale(${sx.toFixed(3)} 1)">
            <rect x="-160" y="-118" width="320" height="236" fill="#f4e6bf" stroke="${GOLD_D}" stroke-width="4" filter="url(#drop)"/>
            <rect x="-148" y="-106" width="296" height="212" fill="none" stroke="${GOLD}" stroke-width="2" stroke-dasharray="3 7"/>
            <text y="52" text-anchor="middle" font-family="Playfair" font-weight="900" font-size="150" fill="${GOLD}">?</text></g>`);
        }
      }
    }
    // M03 / M04: gold what-if arrows across Europe, pulse, then freeze under the title
    {
      const op = win(t, T.arCollapse, S('V05') + 0.4, 0.2, 0.6) * (1 - win(t, b.B03.tIn - 0.3, b.B03.tOut + 0.3, 0.2, 0.2));
      if (op > 0) {
        const pulse = t > T.pulse0 && t < T.freeze ? 0.5 + 0.5 * Math.sin((t - T.pulse0) * 5.5) : 0.35;
        const sc = t > T.pulse0 && t < T.freeze ? 1 + 0.04 * Math.sin((t - T.pulse0) * 5.5) : 1;
        for (const [r, t0, lbl, end] of [[R.collapse, T.arCollapse, 'Empire collapses?', [35.5, 38.8]], [R.russia, T.arRussia, 'Russia saved?', [33.5, 50.0]], [R.early, T.arEarly, 'War ends early?', [14.0, 51.0]]]) {
          add(dotted(r, prog(t, t0, t0 + 1.0), { glow: pulse, op, w: 8 }));
          const pe = proj(end);
          if (t > t0 + 0.8) add(goldPlate(pe[0], pe[1] - 44, lbl, { op: op * sstep(t0 + 0.8, t0 + 1.1, t), scale: sc, size: 28 }));
        }
        add(placeLabel(P.constantinople, 'Constantinople', T.arCollapse + 0.2, { until: S('V05') + 0.3, dy: 40, op }));
      }
    }
    // title: "IF AUSTRALIA…" builds on the map in the 2.5 s gap
    {
      const t0 = T.title, a = win(t, t0, S('V05') + 0.15, 0.25, 0.4);
      if (a > 0) {
        add(dimAll(0.28 * a));
        const txt = 'IF AUSTRALIA…', size = 120, w = tw(txt, 'Playfair', size, 8);
        const u = easeOutBack(clamp((t - t0) / 0.55, 0, 1));
        const rev = clamp((t - t0 - 0.1) / 0.9, 0, 1);
        add(`<clipPath id="tclip"><rect x="${(-w / 2 - 70).toFixed(1)}" y="-120" width="${((w + 140) * rev).toFixed(1)}" height="240"/></clipPath>
          <g opacity="${a.toFixed(3)}" transform="translate(${CX} ${CY}) scale(${(0.82 + 0.18 * u).toFixed(3)})">
          <rect x="${(-w / 2 - 60).toFixed(1)}" y="-108" width="${(w + 120).toFixed(1)}" height="200" fill="rgba(244,236,214,0.93)" stroke="${INK}" stroke-width="3" filter="url(#drop)"/>
          <rect x="${(-w / 2 - 46).toFixed(1)}" y="-94" width="${(w + 92).toFixed(1)}" height="172" fill="none" stroke="${INK}" stroke-width="1.2"/>
          <g clip-path="url(#tclip)"><text x="0" y="${size * 0.32}" text-anchor="middle" font-family="Playfair" font-weight="900" font-size="${size}" letter-spacing="8" fill="${INK}">${txt}</text>
          <rect x="${(-w / 2).toFixed(1)}" y="58" width="${w.toFixed(1)}" height="6" fill="${RED}"/></g></g>`);
      }
    }

    // ================= ACT 1: THE BACK DOOR =================
    {
      const a = win(t, T.eur, b.B04.tIn - 0.2, 0.6, 0.3) + win(t, b.B04.tOut + 0.3, T.dard, 0.5, 0.6);
      if (a > 0) {
        for (const [ll, n] of [[[2.5, 46.6], 'FRANCE'], [[10.5, 51.0], 'GERMANY'], [[-2.0, 52.6], 'BRITAIN'], [[16.0, 47.6], 'AUSTRIA-HUNGARY'], [[33, 53.5], 'RUSSIA'], [[33, 39.2], 'OTTOMAN EMPIRE'], [[3.5, 55.4], 'North Sea']])
          add(geoText(ll, n, a * 0.85, { size: n === 'North Sea' ? 26 : 30, ls: n === 'North Sea' ? 3 : 6, font: n === 'North Sea' ? 'FellItalic' : 'Fell' }));
        add(placeLabel([-6, 54.5], 'EUROPE, 1915', A('V05', '1915'), { until: b.B04.tIn - 0.3, dy: 0, font: 'Elite', size: 30 }));
      }
      // trench line from the North Sea to the Swiss border
      const fop = win(t, T.front0, T.dard + 0.5, 0.1, 0.6) * (1 - win(t, b.B04.tIn - 0.2, b.B04.tOut + 0.2, 0.1, 0.2));
      add(frontLine(prog(t, T.front0, T.front1, (x) => x), fop));
      if (t > T.front1 - 0.2) add(placeLabel([7.6, 46.9], 'Switzerland', T.front1 - 0.2, { until: b.B04.tIn - 0.3, dy: 10, size: 22 }));
      pip('img20', 'IMG20', 'right', T.img20, b.B04.tIn - 0.55, 330, { y: 600, x: 110 });
      // Churchill card on London, then it follows the BACK DOOR arrow's start
      {
        const c0 = T.img02, c1 = T.dard - 0.3;
        if (t > c0 && t < c1) {
          const f = 0.13 * prog(t, T.back0, T.back0 + 1.2);
          const anchorUV = f > 0 ? pointAt(R.backdoor, f) : llUV(P.london);
          const pl = projUV(anchorUV), plo = proj(P.london);
          const p = [lerp(plo[0], pl[0], f / 0.13), lerp(plo[1], pl[1], f / 0.13)];
          const a = win(t, c0, c1, 0.4, 0.4), u = easeOutBack(clamp((t - c0) / 0.55, 0, 1));
          card('img02', 'IMG02', p[0] - 120, p[1] + 330, 300, a, { scale: 0.6 + 0.4 * u, dropY: (1 - u) * -40 });
          add(pin(P.london, c0 - 0.1, { until: c1, col: BLUE, dk: BLUE_D }));
        }
      }
      add(placeLabel([4.6, 49.6], 'FRONT DOOR', T.frontDoor, { until: T.dard - 0.2, dy: 0, fill: 'rgba(250,228,220,0.95)', stroke: RED_D, col: RED, size: 30, font: 'Oswald', ls: 3 }));
      {
        const op = 1 - sstep(T.dard - 0.2, T.dard + 0.6, t);
        add(arrow(R.backdoor, prog(t, T.back0, T.back1), { col: BLUE, dk: BLUE_D, w0: 6, w1: 15, op }));
        if (t > T.back0 + 0.6) { const pm = projUV(pointAt(R.backdoor, 0.55)); add(plate(pm[0], pm[1] + 52, 'BACK DOOR', { op: op * sstep(T.back0 + 0.6, T.back0 + 0.9, t), fill: 'rgba(222,232,248,0.95)', stroke: BLUE_D, col: BLUE_D, size: 30, font: 'Oswald', ls: 3 })); }
      }
    }
    // M07: zoom to the Dardanelles; IMG19 as a faint texture; Türkiye, Constantinople / Istanbul
    {
      const ta = win(t, T.dard + 0.3, T.push0 + 0.6, 1.0, 1.0);
      if (ta > 0) {
        const m = IMG19.matrix;
        add(`<g opacity="${(0.16 * ta).toFixed(3)}" style="mix-blend-mode:multiply" transform="translate(${(CX - CAM.u * CAM.z).toFixed(2)} ${(CY - CAM.v * CAM.z).toFixed(2)}) scale(${CAM.z.toFixed(4)})"><image href="/ep/photos/IMG19_tex.jpg" width="${IMG19.w}" height="${IMG19.h}" transform="matrix(${m.join(' ')})"/></g>`);
      }
      const a7 = win(t, T.dard, b.B05.tIn - 0.3, 0.4, 0.3);
      add(geoText([26.36, 40.07], 'DARDANELLES', a7, { size: 30, ls: 8, dx: 60 }));
      add(geoText([28.4, 39.6], 'OTTOMAN EMPIRE', win(t, T.ott, b.B05.tIn - 0.3), { size: 34, ls: 8, font: 'Fell' }));
      add(placeLabel([28.6, 39.95], 'Türkiye', T.turk, { until: b.B05.tIn - 0.3, dy: 30, font: 'FellItalic', size: 28 }));
      add(placeLabel(P.constantinople, 'Constantinople', T.const, { until: b.B05.tIn - 0.3, dy: -54 }));
      add(placeLabel(P.constantinople, 'today: Istanbul', T.ist, { until: b.B05.tIn - 0.3, dy: -10, size: 20, font: 'FellItalic' }));
      add(pin(P.constantinople, T.const - 0.15, { until: b.B05.tIn - 0.3, col: RED, dk: RED_D }));
      add(arrow(splineUV([[25.9, 39.85], P.entrance, P.kilitbahir, P.nara, [26.9, 40.52], [28.2, 40.9], [28.85, 40.98]]), prog(t, T.push0, T.push1), { col: BLUE, dk: BLUE_D, w0: 5, w1: 12, headL: 26, headW: 30, op: 1 - sstep(b.B05.tIn - 0.5, b.B05.tIn - 0.1, t) }));
    }
    // M08: three effects
    {
      const a = win(t, T.empire, b.B06.tIn - 0.4, 0.6, 0.4);
      if (a > 0) {
        add(`<g opacity="${(a * 0.95).toFixed(3)}">${geoPath(GEO.ottoman, `fill="url(#hatchRg)" stroke="${RED}" stroke-width="2.4"`)}</g>`);
        add(geoText([37, 37.2], 'OTTOMAN EMPIRE', a, { size: 30, ls: 7, font: 'Fell', col: RED_D }));
        const cr = prog(t, T.crack, T.crack + 0.9, easeOutCubic);
        for (const c of [[[27.2, 41.6], [28.6, 40.6], [29.6, 40.1], [31.0, 39.3], [32.4, 39.1], [33.6, 38.0], [35.2, 37.7], [37.0, 36.6]], [[33.6, 38.0], [34.4, 36.9], [36.0, 35.4], [36.6, 33.6]], [[31.0, 39.3], [31.4, 40.6], [32.2, 41.6]], [[37.0, 36.6], [39.5, 35.8], [42.5, 34.6]]])
          add(line(c.map(llUV), cr, { col: '#1d130a', w: 3.5, under: '#f6eed8', underW: 3 }));
        add(line(R.searoute, prog(t, T.sea0, T.sea1), { col: BLUE, w: 6, dash: '16 10', under: BLUE_D, underW: 3, op: a }));
        add(placeLabel([38, 55], 'RUSSIA', A('V08', 'russia'), { until: b.B06.tIn - 0.4, dy: 0, size: 30 }));
        add(geoText([34.5, 43.2], 'Black Sea', a, { size: 26 }));
        if (t > T.crates) for (let i = 0; i < 6; i++) { const f = ((t - T.crates) * 0.11 + i / 6) % 1; const p = projUV(pointAt(R.searoute, 0.05 + f * 0.95)); add(icon(CRATE, p[0], p[1], { col: '#8a6a3e', dk: BLUE_D, s: 1.4, op: a * sstep(T.crates, T.crates + 0.4, t) * sstep(0, 0.08, f) * (1 - sstep(0.9, 1, f)) })); }
        if (t > T.wheat) for (let i = 0; i < 8; i++) { const f = ((t - T.wheat) * 0.13 + i / 8) % 1; const p = projUV(pointAt(R.wheat, f)); add(stroked(WHEAT, p[0], p[1], { col: '#7a5520', s: 1.5, w: 2.2, op: a * sstep(T.wheat, T.wheat + 0.4, t) * sstep(0, 0.08, f) * (1 - sstep(0.9, 1, f)) })); }
      }
    }
    // M09-M11: the fleet, the mines, the sinking
    {
      const fa = win(t, T.fleet0 - 0.1, E('V11') + 1.0, 0.3, 0.6) * (1 - win(t, b.B07.tIn - 0.3, b.B07.tOut + 0.3, 0.2, 0.2)) * (1 - win(t, b.B08.tIn - 0.3, kbx.IMG03.t1, 0.2, 0.2));
      const forts = win(t, T.fleet0 - 0.2, b.B12.tIn, 0.4, 0.4) * (1 - win(t, b.B09.tIn - 0.3, b.B09.tOut + 0.2, 0.2, 0.2));
      if (forts > 0 && t < b.B10.tIn) add(`<g opacity="${forts.toFixed(3)}">${fortIcons(t, 0)}</g>`);
      if (fa > 0) {
        const adv = prog(t, T.fleet0, T.fleet1, easeOutCubic);
        const ret = prog(t, T.retract, T.retract + 1.6);
        add(arrow(R.fleetIn, (adv * 0.98) * (1 - ret), { col: BLUE, dk: BLUE_D, w0: 8, w1: 22, headL: 40, headW: 50, op: fa * 0.55 }));
        for (let i = 0; i < 16; i++) {
          const col = i % 2, row = Math.floor(i / 2);
          const f0 = clamp(0.92 - row * 0.085, 0, 1) * adv * (1 - ret * 0.85);
          const base = projUV(pointAt(R.fleetIn, Math.max(0.0001, f0)));
          const hd = headingAt(R.fleetIn, Math.max(0.02, f0)) * DEG;
          const off = (col ? 1 : -1) * 16;
          let x = base[0] - Math.sin(hd) * off, y = base[1] + Math.cos(hd) * off;
          let op = fa * sstep(0, 0.05, f0 + 0.04), rot = 0, sc = 1.15;
          const k = [3, 6, 9].indexOf(i);
          if (k >= 0) {
            const st = T.sink[k], u = clamp((t - st) / 0.9, 0, 1);
            if (t > st) { rot = 28 * u; sc = 1.15 * (1 - 0.5 * u); op *= 1 - u; y += 6 * u;
              const rr = clamp((t - st) / 1.2, 0, 1); add(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(6 + 34 * rr).toFixed(1)}" fill="none" stroke="#f6eed8" stroke-width="${(2.5 * (1 - rr)).toFixed(2)}" opacity="${(fa * (1 - rr)).toFixed(3)}"/>`); }
          }
          if (op > 0.01) add(icon(SHIP, x, y, { col: BLUE, dk: BLUE_D, s: sc, rot: rot + hd / DEG, op }));
        }
        add(placeLabel(P.kilitbahir, 'The Narrows', T.fleet0 + 0.5, { until: E('V11') + 0.8, dy: -50, size: 22, op: fa }));
        add(placeLabel([26.33, 40.0], '18 MARCH 1915', T.date18, { until: b.B07.tIn - 0.4, dy: 0, font: 'Elite', size: 30 }));
      }
      // mines (Ottoman, red) glowing where the ships will turn
      const ma = win(t, T.mines, E('V11') + 1.0, 0.4, 0.6) * (1 - win(t, b.B08.tIn - 0.3, kbx.IMG03.t1, 0.2, 0.2));
      if (ma > 0) {
        const pts = scr(R.mines);
        for (let i = 0; i <= 12; i++) { const p = projUV(pointAt(R.mines, i / 12)); const g = 0.6 + 0.4 * Math.sin(t * 6 + i);
          add(`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="14" fill="#ff5a3c" opacity="${(0.35 * g * ma).toFixed(3)}" filter="url(#glow)"/><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="6.5" fill="${RED}" stroke="${RED_D}" stroke-width="1.5" opacity="${ma.toFixed(3)}"/>`); }
        const pm = projUV(pointAt(R.mines, 0.5));
        add(plate(pm[0] + 150, pm[1] + 40, 'Nusret', { op: ma * sstep(T.img05, T.img05 + 0.3, t) * (1 - sstep(b.B08.tIn - 0.6, b.B08.tIn - 0.2, t)), font: 'FellItalic', size: 26, stroke: RED_D, col: RED_D }));
      }
      pip('img05', 'IMG05', 'right', T.img05, b.B08.tIn - 0.5, 380, { y: 330, x: 90 });
    }
    // M12: the first what-if
    {
      const a = win(t, T.shells, T.army0 + 0.2, 0.3, 0.5);
      if (a > 0) {
        const pf = [1150, 520];
        add(`<g opacity="${a.toFixed(3)}" transform="translate(${(pf[0] + 30).toFixed(1)} ${(pf[1] - 210).toFixed(1)}) rotate(2) scale(${(0.85 + 0.15 * easeOutBack(clamp((t - T.shells) / 0.4, 0, 1))).toFixed(3)})">
          <rect x="-230" y="-56" width="460" height="112" fill="rgba(250,238,205,0.96)" stroke="${GOLD_D}" stroke-width="3" filter="url(#drop)"/>
          <text x="-40" y="14" text-anchor="middle" font-family="Elite" font-size="34" fill="${INK}">Almost out of shells?</text></g>`);
        add(questionMark(pf[0] + 225, pf[1] - 210, a, 1.2));
        card('img02b', 'IMG02', pf[0] + 460, pf[1] - 120, 300, a * sstep(T.img02b, T.img02b + 0.3, t), { scale: 0.7 + 0.3 * easeOutBack(clamp((t - T.img02b) / 0.5, 0, 1)), rot: 3 });
      }
      const gp = prog(t, T.gold0, T.gold0 + 1.3);
      add(dotted(R.pushGold, gp, { glow: 0.5, op: 1 - sstep(T.goldFade, T.goldFade + 1.0, t), w: 8 }));
      add(arrow(R.toArmy, prog(t, T.army0, T.army1), { col: BLUE, dk: BLUE_D, w0: 7, w1: 18, op: 1 - sstep(E('V12') + 0.4, S('V13') + 0.9, t) }));
      if (t > T.army1 - 0.3) { const pe = projUV(pointAt(R.toArmy, 0.55)); add(plate(pe[0], pe[1] - 60, 'Send the army', { op: sstep(T.army1 - 0.3, T.army1, t) * (1 - sstep(E('V12') + 0.4, S('V13') + 0.9, t)), fill: 'rgba(222,232,248,0.95)', stroke: BLUE_D, col: BLUE_D, size: 30, font: 'Oswald', ls: 2 })); }
    }

    // ================= ACT 2: THE LANDING =================
    {
      add(arrow(R.landing, prog(t, T.land0, T.land1), { col: BLUE, dk: BLUE_D, w0: 8, w1: 20, op: 1 - sstep(b.B10.tIn - 0.5, b.B10.tIn - 0.1, t) }));
      add(counter(1460, 120, '', '~16,000', { op: win(t, T.cnt16, b.B10.tIn - 0.4, 0.25, 0.3), vsize: 54, accent: BLUE }));
      add(pin(P.cove, T.land1 - 0.2, { until: b.B10.tIn, col: BLUE, dk: BLUE_D }));
      // IMG01: full-screen Ken Burns, then the photo shrinks into its pin (photo-to-map morph)
      const k1 = kbx.IMG01;
      kb('kb01', 'IMG01', k1.t0, k1.t1, [0.45, 0.45, 1.05], [0.5, 0.42, 1.18], {
        rect: (tt) => {
          const u = easeInOutCubic(clamp((tt - T.morph0) / (T.morph1 - T.morph0), 0, 1));
          if (u <= 0) return null;
          const pc = proj(P.cove), w = 300, h = 300 * 1450 / 2400;
          const ex = pc[0] - w / 2, ey = pc[1] - 18 - h - 16;
          return { x: lerp(0, ex, u), y: lerp(0, ey, u), w: lerp(W, w, u), h: lerp(H, h, u) };
        },
        capOp: (tt) => 1 - sstep(T.morph0, T.morph0 + 0.3, tt),
      });
      // M14: the card stays pinned at the cove; "Planned?" and "Landed" with a "?" between
      geoCard('img01c', 'IMG01', P.cove, T.morph1, T.race0 + 0.4, 300, { scale: 1, tiltX: 0, tiltY: 0, rot: 0 });
      if (t > T.morph1 - 0.05 && t < T.morph1 + 0.5) DRAWS[DRAWS.length - 1] && (DRAWS[DRAWS.length - 1].scale = 1, DRAWS[DRAWS.length - 1].dropY = 0, DRAWS[DRAWS.length - 1].op = 1);
      const e14 = T.race0 + 0.6;
      add(pin(P.gabatepe, T.planned, { until: e14, col: GREY }));
      add(pin(P.cove, T.landed, { until: e14, col: BLUE, dk: BLUE_D }));
      add(placeLabel(P.gabatepe, 'Planned?', T.planned + 0.1, { until: e14, dy: 40, size: 24 }));
      add(placeLabel(P.cove, 'Landed', T.landed + 0.1, { until: e14, dy: 34, dx: -90, size: 24 }));
      if (t > T.landed + 0.3 && t < e14) { const pa = proj(P.gabatepe), pb = proj(P.cove); add(questionMark((pa[0] + pb[0]) / 2 + 60, (pa[1] + pb[1]) / 2, win(t, T.landed + 0.3, e14, 0.3, 0.4), 0.9, INK)); }
    }
    // M15 / M16: race up the ridges, gold dotted goal, Kemal card, red holds the heights
    {
      const a = 1 - sstep(E('V16') + 0.1, E('V16') + 0.7, t);
      const hid = win(t, b.B12.tIn - 0.3, b.B12.tOut + 0.2, 0.2, 0.2);
      if (t > T.race0 && a > 0) {
        for (const r of R.ridges) add(arrow(r, prog(t, T.race0, T.race1) * (t > T.stop ? 0.97 : 1), { col: BLUE, dk: BLUE_D, w0: 6, w1: 15, headL: 28, headW: 32, op: a * (1 - hid) }));
        add(dotted(R.goal, prog(t, T.goal0, T.goal1), { glow: 0.4, op: a * (1 - hid) * (1 - sstep(T.red0, T.red0 + 1.2, t) * 0.6), w: 7 }));
        if (t > T.goal1 - 0.2) { const pg = proj(P.maidos); add(goldPlate(pg[0] + 20, pg[1] + 50, 'the strait?', { op: a * (1 - hid) * sstep(T.goal1 - 0.2, T.goal1 + 0.1, t) * (1 - sstep(T.red0, T.red0 + 1, t)), size: 22 })); }
      }
      geoCard('img06', 'IMG06', P.chunuk, T.img06, b.B12.tIn - 0.35, 230, { dx: 160, dy: -10 });
      add(pin(P.chunuk, T.img06 - 0.1, { until: b.B12.tIn - 0.2, col: RED, dk: RED_D }));
      if (t > T.red0 && a > 0) {
        for (const r of R.redUp) add(arrow(r, prog(t, T.red0, T.red0 + 1.1), { col: RED, dk: RED_D, w0: 6, w1: 15, headL: 28, headW: 32, op: a }));
        if (t > T.stop) for (const r of R.ridges) { const tip = projUV(pointAt(r, 0.97)); const u = easeOutBack(clamp((t - T.stop) / 0.4, 0, 1));
          add(`<g transform="translate(${tip[0].toFixed(1)} ${tip[1].toFixed(1)}) scale(${u.toFixed(3)})" opacity="${a.toFixed(3)}"><rect x="-16" y="-4" width="32" height="8" fill="${RED}" stroke="${RED_D}" stroke-width="1.5" transform="rotate(${headingAt(r, 0.95) + 90})"/></g>`); }
      }
    }
    // M16b / M16c: AE2 through the mine lines into the Sea of Marmara; "Stay or evacuate?" -> "Dig in"
    {
      const a = win(t, T.subMines, S('V17') + 0.2, 0.5, 0.6) * (1 - win(t, b.B12b.tIn - 0.3, b.B12b.tOut + 0.2, 0.2, 0.2));
      if (a > 0) {
        for (const ml of R.subMines) { const uv = ml.map(llUV); for (let i = 0; i <= 9; i++) { const p = projUV(pointAt(uv, i / 9)); add(`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="11" fill="#ff5a3c" opacity="${(0.3 * a * (0.6 + 0.4 * Math.sin(t * 5 + i))).toFixed(3)}" filter="url(#glow)"/><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5" fill="${RED}" opacity="${a.toFixed(3)}"/>`); } }
        const f = t < b.B12b.tIn ? 0.86 * prog(t, T.sub0, T.sub1, (x) => sstep(0, 1, x)) : lerp(0.86, 1, prog(t, b.B12b.tOut, b.B12b.tOut + 3));
        add(line(R.sub, f, { col: BLUE, w: 3, dash: '6 6', op: a * 0.8 }));
        const ps = projUV(pointAt(R.sub, Math.max(0.001, f)));
        if (f > 0) add(icon(SUB, ps[0], ps[1], { col: BLUE, dk: BLUE_D, s: 1.8, rot: headingAt(R.sub, Math.max(0.02, f)), op: a }));
        if (t > T.subLabel) add(plate(ps[0], ps[1] + 48, 'AE2, first Allied sub through', { op: a * sstep(T.subLabel, T.subLabel + 0.3, t), fill: 'rgba(222,232,248,0.95)', stroke: BLUE_D, col: BLUE_D, size: 22 }));
        if (t < b.B12b.tIn) card('img07', 'IMG07', ps[0] - 230, ps[1] + 330, 300, a * sstep(T.img07, T.img07 + 0.4, t), { scale: 0.7 + 0.3 * easeOutBack(clamp((t - T.img07) / 0.5, 0, 1)) });
        add(geoText([27.25, 40.66], 'Sea of Marmara', a * sstep(T.sub0, T.sub0 + 1, t), { size: 26 }));
      }
      const pa = win(t, T.stay, E('V16b') + 1.0, 0.3, 0.5) * (1 - win(t, b.B13.tIn - 0.3, b.B13.tOut, 0.2, 0.2));
      if (pa > 0) {
        add(pin(P.cove, T.stay - 0.1, { col: BLUE, dk: BLUE_D, op: pa }));
        const dig = t > T.dig;
        add(placeLabel(P.cove, dig ? 'Dig in' : 'Stay or evacuate?', dig ? T.dig : T.stay, { dy: -66, op: pa, size: 28, font: dig ? 'Oswald' : 'Fell', fill: dig ? 'rgba(222,232,248,0.96)' : undefined, col: dig ? BLUE_D : INK, stroke: dig ? BLUE_D : INK }));
      }
    }
    // M17: two trench lines metres apart; +35° -> −10°; both sides as PIPs
    {
      const a = win(t, T.trench, b.B14.tIn - 0.2, 0.3, 0.2);
      if (a > 0) {
        add(line(R.trenchA, prog(t, T.trench, T.trench + 0.9), { col: BLUE, w: 9, under: BLUE_D, underW: 3, op: a }));
        add(line(R.trenchR, prog(t, T.trench + 0.2, T.trench + 1.1), { col: RED, w: 9, under: RED_D, underW: 3, op: a }));
        const hot = t < T.cold;
        add(counter(CX, 90, '', hot ? '+35°' : '−10°', { op: a * sstep(T.hot, T.hot + 0.25, t), vsize: 64, anchor: 'middle', accent: hot ? '#a5552a' : '#5a7a9a', scale: 1 + 0.06 * Math.exp(-Math.max(0, t - (hot ? T.hot : T.cold)) * 6) }));
      }
      pip('img09', 'IMG09', 'left', T.pipL, b.B14.tIn - 0.5, 300, { y: 600, x: 70 });
      pip('img12', 'IMG12', 'right', T.pipR, b.B14.tIn - 0.5, 400, { y: 600, x: 70 });
    }
    // M18 / M19: August pins; the flag on Chunuk Bair
    {
      const a = win(t, T.lone - 0.3, S('V19') + 2.0, 0.2, 0.6) * (1 - win(t, b.B15.tIn - 0.3, b.B15.tOut + 0.2, 0.2, 0.2));
      if (a > 0) {
        for (const [ll, n, t0, dy] of [[P.lonepine, 'Lone Pine', T.lone, 40], [P.nek, 'The Nek', T.nek, -60], [P.chunuk, 'Chunuk Bair', T.chunuk, 40]]) {
          add(pin(ll, t0, { col: BLUE, dk: BLUE_D, op: a, lit: sstep(t0, t0 + 0.2, t) * (1 - sstep(t0 + 0.5, t0 + 1.4, t)) }));
          add(placeLabel(ll, n, t0 + 0.1, { dy, op: a, size: 26 }));
        }
      }
      const fa = win(t, T.flag, S('V19') + 2.0, 0.3, 0.6);
      if (fa > 0) {
        const pc = proj(P.chunuk), u = prog(t, T.pushed, T.pushed + 1.2);
        const wob = Math.sin(t * 9) * (6 + 10 * (t > T.pushed - 1.5 ? 1 : 0)) * (1 - u);
        const x = pc[0] - 160 * u, y = pc[1] + 90 * u;
        add(`<g opacity="${(fa * (1 - 0.5 * u)).toFixed(3)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(wob - 25 * u).toFixed(1)})"><line x1="0" y1="0" x2="0" y2="-70" stroke="${INK}" stroke-width="4"/><path d="M0,-70 L42,-60 L0,-48Z" fill="${BLUE}" stroke="${BLUE_D}" stroke-width="2"/></g>`);
        if (t > T.pushed - 0.6) add(arrow(splineUV([[26.33, 40.275], [26.322, 40.272], [26.312, 40.268]]), prog(t, T.pushed - 0.6, T.pushed + 0.4), { col: RED, dk: RED_D, w0: 6, w1: 16, op: fa }));
      }
    }
    // M20: the escape
    {
      const a = win(t, T.evac, b.B19.tIn - 0.3, 0.3, 0.2);
      if (a > 0) {
        R.evac.forEach((r, i) => add(arrow(r, prog(t, T.evac + i * 0.25, T.evac + 1.2 + i * 0.25), { col: BLUE, dk: BLUE_D, w0: 5, w1: 13, headL: 26, headW: 30, op: a })));
        add(counter(1300, 110, 'Casualties in the escape:', 'almost none', { op: a * sstep(T.none, T.none + 0.25, t), vsize: 48, accent: BLUE }));
      }
      geoCard('img11', 'IMG11', P.cove, T.img11, b.B19.tIn - 0.3, 330, { dx: 210, dy: 40 });
    }
    // M21: memorial counters, nation by nation, side by side, no colours
    {
      const a = win(t, T.mem, S('V22') + 0.2, 0.5, 0.5);
      if (a > 0) {
        add(dimAll(0.42 * a));
        const cols = [['Australia', '~8,700'], ['New Zealand', 'nearly 3,000'], ['Britain', ''], ['France', ''], ['India', ''], ['Ottoman Empire', '']];
        const x0 = 150, cw = 270, y = 470;
        cols.forEach(([n, v], i) => {
          const ai = a * sstep(T.mem + 0.25 * i, T.mem + 0.25 * i + 0.4, t);
          add(`<g opacity="${ai.toFixed(3)}" transform="translate(${x0 + i * cw + cw / 2} ${y})"><rect x="${-cw / 2 + 12}" y="-70" width="${cw - 24}" height="${v ? 170 : 110}" fill="rgba(244,236,214,0.93)" stroke="${INK}" stroke-width="1.6"/>
            <text y="-24" text-anchor="middle" font-family="Fell" font-size="30" letter-spacing="1" fill="${INK}">${esc(n)}</text>
            ${v ? `<text y="52" text-anchor="middle" font-family="Oswald" font-weight="500" font-size="44" fill="${INK}">${esc(v)}</text>` : ''}</g>`);
        });
        const ab = a * sstep(T.mem + 1.0, T.mem + 1.5, t);
        add(`<g opacity="${ab.toFixed(3)}"><path d="M${x0 + 2 * cw + 24},${y + 60} L${x0 + 2 * cw + 24},${y + 84} L${x0 + 6 * cw - 24},${y + 84} L${x0 + 6 * cw - 24},${y + 60}" fill="none" stroke="${INK}" stroke-width="2"/>
          <text x="${x0 + 4 * cw}" y="${y + 134}" text-anchor="middle" font-family="Oswald" font-weight="500" font-size="44" fill="#f1e6cc">tens of thousands</text></g>`);
      }
    }

    // ================= ACT 3: WHAT IF THEY'D WON? (gold leads) =================
    {
      const a = win(t, S('V22') - 0.2, E('V22') + 0.8, 0.6, 0.4) * (1 - win(t, b.B20.tIn - 0.3, E('V23') + 1, 0.2, 0.2));
      if (a > 0) {
        add(`<g opacity="${a.toFixed(3)}">${fortIcons(t, sstep(T.grey, T.grey + 0.5, t))}</g>`);
        for (const [ll, i] of [[P.chunuk, 0], [[26.317, 40.276], 1], [[26.330, 40.282], 2]]) {
          const t0 = T.gFlags + 0.2 * i, u = easeOutBack(clamp((t - t0) / 0.45, 0, 1));
          if (t < t0) continue;
          const p = proj(ll);
          add(`<g opacity="${a.toFixed(3)}" transform="translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) scale(${u.toFixed(3)}) rotate(${(Math.sin(t * 4 + i) * 3).toFixed(1)})"><line x1="0" y1="0" x2="0" y2="-70" stroke="${GOLD_D}" stroke-width="4"/><path d="M0,-70 L44,-60 L0,-48Z" fill="${GOLD_L}" stroke="${GOLD_D}" stroke-width="2"/><circle r="22" cy="-58" fill="${GOLD_L}" opacity="0.35" filter="url(#glow)"/></g>`);
        }
        const gp = prog(t, T.gShips0, T.gShips1 + 1.5, (x) => x);
        add(dotted(R.goldShips, gp, { op: a * 0.8, w: 6, noHead: true }));
        for (let i = 0; i < 6; i++) { const f = clamp(gp - i * 0.06, 0, 1); if (f <= 0) continue; const p = projUV(pointAt(R.goldShips, f));
          add(icon(SHIP, p[0], p[1], { col: GOLD_L, dk: GOLD_D, s: 1.3, rot: headingAt(R.goldShips, Math.max(0.02, f)), op: a })); }
      }
      // M23: gold branches from Constantinople
      const a3 = win(t, b.B21.tOut + 0.1, E('V23') + 0.6, 0.3, 0.5);
      if (a3 > 0) {
        add(`<g opacity="${(a3 * 0.55).toFixed(3)}">${geoPath(GEO.ottoman, `fill="url(#hatchRg)" stroke="${RED}" stroke-width="2"`)}</g>`);
        add(dotted(R.surrender, prog(t, T.surr, T.surr + 0.9), { glow: 0.5, op: a3 }));
        add(dotted(R.asia, prog(t, T.asia, T.asia + 1.1), { glow: 0.5, op: a3 }));
        if (t > T.surr + 0.8) { const p = proj([29.6, 42.6]); add(goldPlate(p[0], p[1] - 40, 'Surrender?', { op: a3 * sstep(T.surr + 0.8, T.surr + 1.1, t), size: 30 })); }
        if (t > T.asia + 1.0) { const p = proj([34.0, 39.6]); add(goldPlate(p[0], p[1] + 46, 'Fight on from Asia?', { op: a3 * sstep(T.asia + 1.0, T.asia + 1.3, t), size: 30 })); }
        add(placeLabel(P.constantinople, 'Constantinople', b.B21.tOut + 0.3, { until: E('V23') + 0.5, dy: 44, size: 22 }));
      }
      // M24: Bulgaria
      const a4 = win(t, T.bul - 0.4, E('V24') + 0.6, 0.4, 0.5);
      if (a4 > 0) {
        const fl = t > T.flick && t < T.flick + 0.7 ? (Math.floor((t - T.flick) * 14) % 2) : (t >= T.flick + 0.7 ? 1 : 0);
        const fill = fl ? 'url(#hatchGg)' : 'url(#hatchRg)', stroke = fl ? GREY : RED;
        add(`<g opacity="${a4.toFixed(3)}">${geoPath(GEO.bulgaria, `fill="${fill}" stroke="${stroke}" stroke-width="3"`)}</g>`);
        add(geoText([25.3, 42.75], 'BULGARIA', a4, { size: 32, ls: 6, font: 'Fell' }));
        add(placeLabel([25.8, 43.9], "Joined Germany's side, Oct 1915", T.joined, { until: T.flick + 0.2, dy: 0, fill: 'rgba(250,228,220,0.96)', stroke: RED_D, col: RED, size: 26 }));
        if (t > T.flick + 0.5) { const p = proj([25.4, 42.6]); add(questionMark(p[0], p[1] + 60, a4 * sstep(T.flick + 0.5, T.flick + 0.8, t), 1.3)); }
        add(placeLabel(P.constantinople, 'Constantinople', T.bul - 0.3, { until: E('V24') + 0.5, dy: 40, size: 22 }));
        // IMG21 sits on the real red state only; it leaves before the flicker to the gold "?"
        geoCard('img21', 'IMG21', P.sofia, T.img21, T.flick - 0.15, 330, { dx: -200, dy: -30 });
        add(pin(P.sofia, T.img21 - 0.1, { until: T.flick - 0.1, col: RED, dk: RED_D }));
      }
      // M25 / M26 / M27: the sea road to Russia
      const a5 = win(t, T.gRus0, b.B23.tIn - 0.2, 0.4, 0.3) * (1 - win(t, b.B22.tIn - 0.3, kbx.IMG13.t1, 0.2, 0.3));
      if (a5 > 0) {
        const thin = prog(t, T.thin0, T.thin1);
        add(dotted(R.goldRussia, prog(t, T.gRus0, T.gRus1), { glow: 0.5 * (1 - thin), op: a5 * (1 - 0.55 * thin), w: 8 - 5 * thin, head: 17 - 7 * thin }));
        add(placeLabel([40, 56.5], 'RUSSIA', T.gRus0, { dy: 0, op: a5, size: 30 }));
        add(geoText([34.5, 43.2], 'Black Sea', a5, { size: 24 }));
        if (t > T.gRus1 - 0.4 && t < b.B22.tIn) for (let i = 0; i < 7; i++) { const f = ((t - T.gRus1) * 0.16 + i / 7) % 1; const p = projUV(pointAt(R.goldRussia, f));
          add(icon(CRATE, p[0], p[1], { col: GOLD_L, dk: GOLD_D, s: 1.3, op: a5 * sstep(0, 0.1, f) * (1 - sstep(0.9, 1, f)) })); }
        if (t > T.rev - 0.1) {
          const pr = proj([42, 57.5]), q = sstep(T.revQ, T.revQ + 0.8, t);
          add(plate(pr[0], pr[1], '1917 REVOLUTION', { op: a5 * sstep(T.rev, T.rev + 0.3, t) * (1 - q), font: 'Stamp', size: 34, ls: 3, col: RED, stroke: RED_D, rot: -6 }));
          add(questionMark(pr[0], pr[1], a5 * q, 1.5));
        }
        const ac = win(t, T.arg0 - 0.2, b.B23.tIn - 0.3, 0.3, 0.3);
        if (ac > 0) add(`<g opacity="${ac.toFixed(3)}" transform="translate(1320 640) rotate(-1.5)"><rect x="-300" y="-110" width="600" height="220" fill="rgba(244,236,214,0.96)" stroke="${INK}" stroke-width="2" filter="url(#drop)"/>
          <text x="-260" y="-26" font-family="Elite" font-size="34" fill="${INK}" opacity="${sstep(T.arg0, T.arg0 + 0.3, t).toFixed(3)}">Not enough weapons to spare</text>
          <text x="-260" y="54" font-family="Elite" font-size="34" fill="${INK}" opacity="${sstep(T.arg1, T.arg1 + 0.3, t).toFixed(3)}">Problems ran deeper</text></g>`);
      }
      // M28: the post-war borders, then their wobbling gold what-if alternatives
      const a8 = win(t, T.bord0 - 0.2, b.B25.tIn - 0.3, 0.3, 0.3);
      if (a8 > 0) {
        const p = prog(t, T.bord0, T.bord1, (x) => x), w = sstep(T.wob, T.wob + 1.2, t);
        GEO.meborders.forEach((bd, i) => {
          const uv = bd.pts;
          add(line(uv, p, { col: INK, w: 4, op: a8 * (1 - w) }));
          if (w > 0) {
            const wob = uv.map(([x, y], j) => [x + 0.5 * Math.sin(t * 1.6 + j * 1.3 + i) + 0.6 * Math.sin(j * 2.1 + i * 3), y + 0.5 * Math.cos(t * 1.3 + j * 0.9 + i * 2) + 0.5 * Math.cos(j * 1.7 + i)]);
            add(dotted(wob, 1, { op: a8 * w, w: 5, noHead: true, dash: '2 12' }));
          }
        });
        for (const [ll, k] of [[[39.0, 34.8], 0], [[42.5, 31.2], 1], [[36.6, 30.4], 2]]) { const pq = proj(ll); add(questionMark(pq[0], pq[1], a8 * sstep(T.wob + 0.6 + 0.2 * k, T.wob + 0.9 + 0.2 * k, t), 0.9)); }
        add(geoText([43.5, 37.4], 'Middle East', a8 * 0.9, { size: 28 }));
      }
    }

    // ================= ACT 4: THE TWIST =================
    {
      const a9 = win(t, T.nation - 0.6, b.B26.tIn - 0.3, 0.4, 0.3);
      if (a9 > 0) {
        add(`<g opacity="${(a9 * 0.9).toFixed(3)}">${geoPath(GEO.aus, `fill="rgba(255,238,190,0.22)" stroke="${INK}" stroke-width="2.4"`)}</g>`);
        add(counter(140, 760, 'Nation since 1901', '14 years old', { op: a9 * sstep(T.nation, T.nation + 0.3, t), vsize: 50 }));
      }
      // IMG14: the newspaper card on Australia, slowly pushing into the headline
      if (t > T.img14 && t < b.B26.tIn) {
        const p = proj([137, -24]), u = easeOutBack(clamp((t - T.img14) / 0.55, 0, 1)), z = 1 + 0.22 * prog(t, T.img14 + 0.5, b.B26.tIn - 0.5, (x) => x);
        card('img14', 'IMG14', p[0] + 160, p[1] + 330 + 120 * (z - 1), 330 * z, win(t, T.img14, b.B26.tIn - 0.35, 0.4, 0.4), { scale: 0.6 + 0.4 * u, dropY: (1 - u) * -40, tiltX: 4, tiltY: -6 });
        add(pin(P.australia, T.img14 - 0.1, { until: b.B26.tIn - 0.2, col: BLUE, dk: BLUE_D }));
      }
      // IMG15 Ken Burns (full-screen) between B26 and B27
      const k15 = kbx.IMG15; kb('kb15', 'IMG15', k15.t0, k15.t1, [0.5, 0.55, 1.05], [0.42, 0.45, 1.2]);
      // M30 / M31: the calendar on Australia and New Zealand; gold what-if turns 25 April into an ordinary date
      const pc = proj([160, -36]);
      add(calendarCard(pc[0], pc[1] - 160, t));
      if (t > T.cal - 0.2 && t < b.B28.tIn) {
        add(geoText([134, -25.5], 'AUSTRALIA', win(t, T.cal, b.B28.tIn - 0.3), { size: 30, ls: 8, font: 'Fell' }));
        add(geoText([172.5, -41.0], 'NEW ZEALAND', win(t, T.cal, b.B28.tIn - 0.3), { size: 24, ls: 5, font: 'Fell', dy: 60 }));
        const sl = prog(t, T.slide, T.slide + 1.4), gr = sstep(T.slide - 0.1, T.slide + 0.6, t);
        const pa = proj([140, -30]);
        card('img15c', 'IMG15', pa[0] - 360 * easeInCubic(sl) - 40, pa[1] - 40, 300, win(t, T.img15c, T.slide + 1.4, 0.4, 0.5), { grey: gr, rot: -3 });
      }
      // V32: Atatürk on Ankara, Kemal 1915 beside him; Türkiye 1923
      const a2 = win(t, T.img16 - 0.4, b.B29.tIn - 0.3, 0.4, 0.3);
      if (a2 > 0) {
        add(`<g opacity="${(a2 * sstep(T.rep - 0.3, T.rep + 0.4, t)).toFixed(3)}">${geoPath(GEO.turkey, `fill="rgba(255,238,190,0.25)" stroke="${INK}" stroke-width="2.6"`)}</g>`);
        add(placeLabel([35, 41.6], '1923: Republic of Turkey founded', T.rep, { until: b.B29.tIn - 0.3, dy: 0, size: 30, font: 'Fell' }));
        const pk = proj(P.ankara);
        add(pin(P.ankara, T.img16 - 0.1, { until: b.B29.tIn - 0.3, col: INK }));
        add(placeLabel(P.ankara, 'Ankara', T.img16, { until: b.B29.tIn - 0.3, dy: 34, size: 22 }));
        card('img16', 'IMG16', pk[0] + 130, pk[1] + 420, 190, win(t, T.img16, b.B29.tIn - 0.35, 0.4, 0.4), { scale: 0.6 + 0.4 * easeOutBack(clamp((t - T.img16) / 0.55, 0, 1)), rot: 2 });
        card('img06b', 'IMG06', pk[0] - 130, pk[1] + 420, 190, win(t, T.img06b, b.B29.tIn - 0.35, 0.4, 0.4), { scale: 0.6 + 0.4 * easeOutBack(clamp((t - T.img06b) / 0.55, 0, 1)), rot: -3 });
      }
      // M33: Arı Burnu -> Anzac Koyu (Anzac Cove), 1985; 1915 / 2012 split card on the cove pin
      const a3 = win(t, T.ari - 0.3, b.B30.tIn - 0.3, 0.3, 0.3);
      if (a3 > 0) {
        add(pin(P.cove, T.ari - 0.2, { col: INK, op: a3 }));
        const sw = sstep(T.koyu, T.koyu + 0.6, t);
        if (sw < 1) add(placeLabel(P.cove, 'Arı Burnu', T.ari, { dy: 40, op: a3 * (1 - sw), size: 28 }));
        if (sw > 0) add(placeLabel(P.cove, 'Anzac Koyu (Anzac Cove), 1985', T.koyu, { dy: 40, op: a3 * sw, size: 28 }));
        geoCard('split', ['IMG01', 'IMG22'], P.cove, T.split, b.B30.tIn - 0.35, 640, { dx: 0, dy: -50, tiltX: 4, tiltY: -4, rot: -1 });
      }
      // M34: Australia and Türkiye joined by a soft, solid gold line (real; never dotted)
      const a4 = win(t, T.p34a - 0.2, S('V35') + 0.6, 0.3, 0.5);
      if (a4 > 0) {
        add(pin(P.canberra, T.p34a, { col: INK, op: a4 }));
        add(pin(P.cove, T.p34b, { col: INK, op: a4 }));
        add(placeLabel(P.canberra, 'Australia', T.p34a + 0.1, { dy: 40, op: a4, size: 24 }));
        add(placeLabel(P.cove, 'Türkiye', T.p34b + 0.1, { dy: 40, op: a4, size: 24 }));
        add(line(R.ausTr, prog(t, T.gl0, T.gl1), { col: GOLD_L, w: 5, glow: 0.8, glowCol: GOLD_L, op: a4 * 0.95 }));
      }
    }
    // M35: split screen — gold what-if map | real map with the real photos as a scrapbook
    add(splitScreen(t));
    // M36 + end screen
    add(endCard(t));
    // gold what-if frame
    const gd = G.gold(t);
    if (gd > 0.001) add(goldFrame(gd, 0, W));
    return s;
  }

  function goldFrame(a, x0, x1) {
    return `<g opacity="${a.toFixed(3)}"><rect x="${x0 + 14}" y="14" width="${x1 - x0 - 28}" height="${H - 28}" fill="none" stroke="${GOLD}" stroke-width="10"/>
      <rect x="${x0 + 28}" y="28" width="${x1 - x0 - 56}" height="${H - 56}" fill="none" stroke="${GOLD_L}" stroke-width="2" stroke-dasharray="3 9"/>
      <rect x="${x0}" y="0" width="${x1 - x0}" height="${H}" fill="none" stroke="rgba(120,80,10,0.35)" stroke-width="60" filter="url(#soft)"/></g>`;
  }
  let SPLIT = 0;
  function splitScreen(t) {
    const so = win(t, T.sp0, T.sp1, 0.7, 0.6);
    SPLIT = so;
    if (so <= 0.001) return '';
    let s = '';
    // left half: gold what-if (camera offset handled in renderFrame); right half: the real map
    const camL = { ...CAM, u: CAM.u + (W / 4) / CAM.z };
    const prevCam = CAM;
    CAM = camL;
    let L = '';
    for (const [r, end] of [[R.collapse, [35.5, 38.8]], [R.russia, [33.5, 50.0]], [R.early, [14.0, 51.0]], [R.m02, null]]) L += dotted(r, prog(t, T.sp0 + 0.3, T.sp0 + 1.5), { glow: 0.5, w: 7 });
    for (const ll of [[35.5, 38.8], [33.5, 50.0], [14.0, 51.0]]) { const p = proj(ll); L += questionMark(p[0], p[1] - 44, sstep(T.sp0 + 1.3, T.sp0 + 1.6, t), 0.9); }
    CAM = prevCam;
    s += `<clipPath id="clipL"><rect x="0" y="0" width="${CX}" height="${H}"/></clipPath><g clip-path="url(#clipL)" opacity="${so.toFixed(3)}">${L}${goldFrame(1, 0, CX)}</g>`;
    s += `<g opacity="${so.toFixed(3)}"><rect x="${CX - 4}" y="0" width="8" height="${H}" fill="${PAPER}"/><rect x="${CX - 1.5}" y="0" width="3" height="${H}" fill="${INK}"/></g>`;
    // scrapbook: every real photo in the episode, small cards along the real map (right half only)
    const ids = ['IMG01', 'IMG02', 'IMG03', 'IMG05', 'IMG06', 'IMG07', 'IMG09', 'IMG10', 'IMG11', 'IMG12', 'IMG13', 'IMG14', 'IMG15', 'IMG16', 'IMG17', 'IMG18', 'IMG20', 'IMG21', 'IMG22'];
    ids.forEach((id, i) => {
      const col = i % 5, row = Math.floor(i / 5);
      const x = CX + 120 + col * 175 + (row % 2) * 40, y = 250 + row * 215;
      const t0 = T.sp0 + 0.6 + i * 0.12;
      const u = easeOutBack(clamp((t - t0) / 0.45, 0, 1));
      card('sb' + id, id, x, y, 140, so * sstep(t0, t0 + 0.2, t), { scale: 0.5 + 0.5 * u, rot: ((i * 37) % 9) - 4, tiltX: 0, tiltY: 0, noCap: true, noCredit: true, z: 2 });
    });
    return s;
  }
  function endCard(t) {
    const a = win(t, T.ep0, TL.duration + 1, 0.8, 0.1);
    if (a <= 0) return '';
    let s = dimAll(0.22 * a);
    const e = sstep(T.endS - 0.8, T.endS, t);   // end screen: the side-by-side maps clear, leaving clean space
    const size = 96, txt = 'IF AUSTRALIA…', w = tw(txt, 'Playfair', size, 7);
    const u = easeOutBack(clamp((t - T.ep0) / 0.6, 0, 1));
    const ty = lerp(230, 170, e);
    s += `<g opacity="${a.toFixed(3)}" transform="translate(${CX} ${ty}) scale(${((0.85 + 0.15 * u) * lerp(1, 0.8, e)).toFixed(3)})">
      <rect x="${(-w / 2 - 54).toFixed(1)}" y="-92" width="${(w + 108).toFixed(1)}" height="168" fill="rgba(244,236,214,0.93)" stroke="${INK}" stroke-width="3" filter="url(#drop)"/>
      <rect x="${(-w / 2 - 40).toFixed(1)}" y="-78" width="${(w + 80).toFixed(1)}" height="140" fill="none" stroke="${INK}" stroke-width="1.2"/>
      <text x="0" y="${size * 0.32}" text-anchor="middle" font-family="Playfair" font-weight="900" font-size="${size}" letter-spacing="7" fill="${INK}">${txt}</text>
      <rect x="${(-w / 2).toFixed(1)}" y="48" width="${w.toFixed(1)}" height="5" fill="${RED}"/></g>`;
    const ma = a * (1 - e);
    if (ma > 0.001) {
      [['ep1', 'EPISODE 1', CX - 440], ['ep2', 'EPISODE 2', CX + 440]].forEach(([f, lbl, x], i) => {
        const t0 = T.ep0 + 0.5 + i * 0.35, uu = easeOutBack(clamp((t - t0) / 0.5, 0, 1));
        s += `<g opacity="${(ma * sstep(t0, t0 + 0.25, t)).toFixed(3)}" transform="translate(${x} 640) rotate(${i ? 1.5 : -1.5}) scale(${(0.7 + 0.3 * uu).toFixed(3)})">
          <rect x="-372" y="-220" width="744" height="440" fill="#f7f1e2" filter="url(#drop)"/>
          <image href="/ep/assets/${f}.jpg" x="-356" y="-204" width="712" height="400" preserveAspectRatio="xMidYMid slice"/>
          <rect x="-356" y="-204" width="712" height="400" fill="none" stroke="${INK}" stroke-width="1.5"/></g>`;
        s += plate(x, 905, lbl, { op: ma * sstep(t0 + 0.2, t0 + 0.5, t), font: 'Elite', size: 30, ls: 4 });
      });
    }
    return s;
  }

  // ------------------------------------------------------------------ frame
  let fx, paper;
  const SIZES = {};
  window.renderFrame = function (t) {
    NOW = t;
    CAM = camAt(t);
    DRAWS = []; CREDITS = [];
    const g = { gold: G.gold(t), desat: G.desat(t), dim: G.dim(t) };
    const svg = overlays(t);
    if (SPLIT > 0.001) {
      const z = CAM.z, so = easeInOutCubic(SPLIT);
      const cL = { u: CAM.u + (W / 4) / z * so, v: CAM.v, z }, cR = { u: CAM.u - (W / 4) / z * so, v: CAM.v, z };
      updateMap(maps.mapA, cL, { ...g, gold: Math.max(g.gold, so) });
      updateMap(maps.mapB, cR, g);
      maps.mapA.div.style.clipPath = `inset(0 ${(CX * so).toFixed(1)}px 0 0)`;
      maps.mapB.div.style.display = '';
    } else {
      updateMap(maps.mapA, CAM, g);
      maps.mapA.div.style.clipPath = '';
      maps.mapB.div.style.display = 'none';
    }
    fx.innerHTML = DEFS + svg;
    syncPhotos();
    topSvg.innerHTML = creditsSvg();
    const pend = [...root.querySelectorAll('#photos img')].filter((im) => im.offsetParent !== null && !(im.complete && im.naturalWidth));
    const imgs = [...fx.querySelectorAll('image')];
    return Promise.all([...pend.map((im) => im.decode().catch(() => {})), ...[...root.querySelectorAll('#photos img')].filter((im) => im.offsetParent !== null).map((im) => im.decode().catch(() => {}))]).then(() => (imgs.length ? new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))) : null));
  };

  async function boot() {
    const [tl, layers, i19] = await Promise.all(['/ep/timeline.json', '/ep/assets/layers.json', '/ep/assets/img19.json'].map((u) => fetch(u).then((r) => r.json())));
    TL = tl; LAYERS = layers; IMG19 = i19;
    await new Promise((res, rej) => { const s = document.createElement('script'); s.src = '/ep/assets/geo.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    GEO = window.GEO;
    buildMap('mapB');
    buildMap('mapA');
    root.appendChild(maps.mapA.div);
    fx = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    fx.setAttribute('id', 'fx'); fx.setAttribute('width', W); fx.setAttribute('height', H); fx.setAttribute('viewBox', `0 0 ${W} ${H}`);
    root.appendChild(fx);
    paper = document.createElement('img');
    paper.id = 'paper'; paper.src = '/ep/assets/paper.jpg';
    root.appendChild(paper);
    photoLayer = document.createElement('div'); photoLayer.id = 'photos'; root.appendChild(photoLayer);
    topSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    topSvg.setAttribute('id', 'top'); topSvg.setAttribute('width', W); topSvg.setAttribute('height', H);
    root.appendChild(topSvg);
    setup();
    times();
    window.CUES = CUES;
    await document.fonts.ready;
    await Promise.all(['Fell', 'FellItalic', 'Elite', 'Oswald', 'Playfair', 'Stamp'].map((f) => document.fonts.load(`40px ${f}`)));
    const ids = Object.keys(PH);
    await Promise.all(ids.map((id) => { const im = new Image(); im.src = `/ep/photos/${id}.jpg`; return im.decode().then(() => { SIZES[id] = { w: im.naturalWidth, h: im.naturalHeight }; }); }));
    await Promise.all([...Object.values(LAYERS).map((L) => '/ep/assets/' + L.file), '/ep/photos/IMG19_tex.jpg', '/ep/assets/ep1.jpg', '/ep/assets/ep2.jpg', '/ep/assets/grain.png']
      .map((u) => { const im = new Image(); im.src = u; return im.decode().catch(() => {}); }));
    await new Promise((r) => { if (paper.complete) r(); else paper.onload = r; });
  }

  window.EPISODE = { fps: 30 };
  window.EPISODE_READY = boot().then(() => { window.EPISODE.duration = TL.duration; window.renderFrame(0); });
})();
