/* lf01 IF AUSTRALIA… Episode 1 — map choreography. SVG + renderFrame(t). No Remotion.
 * One continuous parchment terrain map; camera keyframed on Whisper word times (timeline.json).
 * Screen space 1920x1080. Map units: u = (lon + 15) * cos25°, v = 62 - lat.
 * B-roll clips are NOT drawn here: ffmpeg composites them at timeline.broll (zoom-through iris at
 * frame centre, where the camera parks each pin). This page draws the pin flare under them. */
(function () {
  const W = 1920, H = 1080, CX = W / 2, CY = H / 2;
  const DEG = Math.PI / 180, COS = Math.cos(25 * DEG), LON0 = -15, LAT0 = 62;
  const MAPW = 270 * COS, MAPH = 114;
  const { clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic } = window.HS;
  const easeInCubic = (x) => x * x * x;
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const U = (lon) => (lon - LON0) * COS;
  const V = (lat) => LAT0 - lat;

  const RED = '#b3261e', RED_D = '#4f110c', BLUE = '#2f63ad', BLUE_D = '#132b52';
  const INK = '#2e2216', PAPER = '#efe4c8', GOLD = '#c8962e', AMBER = '#d4892a';

  let TL, LAYERS, GEO, BR;

  // ------------------------------------------------------------------ places
  const P = {
    tokyo: [139.69, 35.69], darwin: [130.84, -12.46], singapore: [103.82, 1.35], hongkong: [114.17, 22.3],
    malaya: [101.9, 4.3], pearl: [202.03, 21.36], midway: [182.63, 28.21], sf: [237.58, 37.77],
    brisbane: [153.03, -27.47], sydney: [151.21, -33.87], melbourne: [144.96, -37.81], newcastle: [151.78, -32.93],
    perth: [115.86, -31.95], adelaide: [138.6, -34.93], canberra: [149.13, -35.28],
    moresby: [147.18, -9.44], kokoda: [147.74, -8.88], milnebay: [150.45, -10.33], coralsea: [155.0, -15.0],
    fiji: [178.2, -17.8], samoa: [187.75, -13.8], newcal: [165.9, -21.6], rabaul: [152.2, -4.2], truk: [151.8, 7.4],
    melville: [130.95, -11.6], crash: [130.42, -11.42], birdum: [133.21, -15.65], alice: [133.88, -23.7],
    portaugusta: [137.77, -32.49], wellington: [174.78, -41.29], mideast: [36.0, 31.0], china: [112.0, 30.0],
    britain: [-2.0, 53.0], queensland: [144.5, -21.0],
  };

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
  const B = (id) => BR.find((b) => b.id === id);
  // fade window: 0 before a, 1 between a+fi and b-fo, 0 after b
  const win = (t, a, b, fi = 0.35, fo = 0.45) => (t < a || t > b ? 0 : Math.min(sstep(a, a + fi, t), 1 - sstep(b - fo, b, t)));

  function track(keys) {
    // keys [[t, v], ...] — smooth between successive keys
    return (t) => {
      if (t <= keys[0][0]) return keys[0][1];
      for (let i = 1; i < keys.length; i++) {
        if (t <= keys[i][0]) {
          const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
          return lerp(v0, v1, sstep(t0, t1, t));
        }
      }
      return keys[keys.length - 1][1];
    };
  }

  // ------------------------------------------------------------------ camera
  function interpZoom(p0, p1, rho = 1.35) {
    const [ux0, uy0, w0] = p0, [ux1, uy1, w1] = p1;
    const dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy, rho2 = rho * rho, rho4 = rho2 * rho2;
    if (d2 < 1e-10) {
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
    // 1 inside zoom-through windows (camera must sit exactly on the pin), 0 elsewhere
    let q = 0;
    for (const b of BR) q = Math.max(q, win(t, b.tIn - 0.7, b.tOut + 0.35, 0.3, 0.3));
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
    // perpetual slow breathing: the camera never stops (silenced inside zoom-throughs)
    const q = 1 - brollQuiet(t);
    z *= 1 + q * 0.018 * Math.sin((2 * Math.PI * t) / 13.0);
    u += (q * 7 * Math.sin((2 * Math.PI * t) / 17.0)) / z;
    v += (q * 5 * Math.sin((2 * Math.PI * t) / 11.0 + 1.3)) / z;
    // keep the view on the map
    const hw = W / 2 / z, hh = H / 2 / z;
    u = MAPW > 2 * hw ? clamp(u, hw, MAPW - hw) : MAPW / 2;
    v = MAPH > 2 * hh ? clamp(v, hh, MAPH - hh) : MAPH / 2;
    return { u, v, z };
  }

  let CAM = { u: 0, v: 0, z: 10 }, CAMB = null;
  const proj = (ll, cam = CAM) => [(U(ll[0]) - cam.u) * cam.z + CX, (V(ll[1]) - cam.v) * cam.z + CY];
  const projUV = (p, cam = CAM) => [(p[0] - cam.u) * cam.z + CX, (p[1] - cam.v) * cam.z + CY];
  const onScreen = (p, m = 200) => p[0] > -m && p[0] < W + m && p[1] > -m && p[1] < H + m;

  // ------------------------------------------------------------------ geometry
  function curveUV(a, b, bend = 0.18, n = 56) {
    const ax = U(a[0]), ay = V(a[1]), bx = U(b[0]), by = V(b[1]);
    const mx = (ax + bx) / 2, my = (ay + by) / 2, dx = bx - ax, dy = by - ay;
    const cx = mx - dy * bend, cy = my + dx * bend;
    const out = [];
    for (let i = 0; i <= n; i++) {
      const s = i / n, o = 1 - s;
      out.push([o * o * ax + 2 * o * s * cx + s * s * bx, o * o * ay + 2 * o * s * cy + s * s * by]);
    }
    return out;
  }
  function splineUV(lls, n = 18) {
    const p = lls.map((l) => [U(l[0]), V(l[1])]);
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
  function cut(pts, p0, p1 = null) {
    // sub-polyline from fraction a to b of length
    let a = 0, b = p0;
    if (p1 != null) { a = p0; b = p1; }
    const L = [0];
    for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const tot = L[L.length - 1], ta = a * tot, tb = b * tot;
    const at = (d) => {
      for (let i = 1; i < pts.length; i++) if (L[i] >= d) {
        const s = (d - L[i - 1]) / Math.max(1e-9, L[i] - L[i - 1]);
        return [lerp(pts[i - 1][0], pts[i][0], s), lerp(pts[i - 1][1], pts[i][1], s)];
      }
      return pts[pts.length - 1];
    };
    const out = [at(ta)];
    for (let i = 1; i < pts.length - 1; i++) if (L[i] > ta && L[i] < tb) out.push(pts[i]);
    out.push(at(tb));
    return out;
  }
  const plen = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };
  const pstr = (pts) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const scr = (uv, cam = CAM) => uv.map((p) => projUV(p, cam));

  function taper(pts, w0, w1, headL, headW) {
    // tapered body + arrowhead polygon along a screen polyline
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
    const hL = [base[0] - ty * hw, base[1] + tx * hw], hR = [base[0] + ty * hw, base[1] - tx * hw];
    const poly = [...L, hL, tip, hR, ...R.reverse()];
    return 'M' + poly.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L') + 'Z';
  }

  function arrow(uv, p, o = {}) {
    if (p <= 0.002) return '';
    const pts = scr(cut(uv, o.from || 0, p));
    const d = taper(pts, o.w0 || 6, o.w1 || 16, o.headL || 34, o.headW || 40);
    const col = o.col || RED, dk = o.dk || RED_D;
    const op = o.op == null ? 1 : o.op;
    const glow = o.glow ? `<path d="${d}" fill="${o.glowCol || '#ff5a3c'}" opacity="${0.55 * o.glow * op}" filter="url(#glow)"/>` : '';
    return `<g opacity="${op.toFixed(3)}">${glow}<path d="${d}" fill="${col}" stroke="${dk}" stroke-width="2.2" stroke-linejoin="round" filter="url(#drop)"/></g>`;
  }

  function dotted(uv, p, o = {}) {
    if (p <= 0.002) return '';
    const pts = scr(cut(uv, 0, p));
    const col = o.col || RED, w = o.w || 6, op = o.op == null ? 1 : o.op;
    const tip = pts[pts.length - 1], pre = cut(pts, 0, 0.97).pop();
    const ang = Math.atan2(tip[1] - pre[1], tip[0] - pre[0]) / DEG;
    const hs = o.head || 16;
    const glow = o.glow ? `<polyline points="${pstr(pts)}" fill="none" stroke="#ff4a2a" stroke-width="${w * 3.2}" stroke-linecap="round" opacity="${0.5 * o.glow}" filter="url(#glow)"/>` : '';
    return `<g opacity="${op.toFixed(3)}">${glow}
      <polyline points="${pstr(pts)}" fill="none" stroke="${o.dk || RED_D}" stroke-width="${w + 3}" stroke-dasharray="${o.dash || '2 14'}" stroke-linecap="round" opacity="0.55"/>
      <polyline points="${pstr(pts)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-dasharray="${o.dash || '2 14'}" stroke-linecap="round"/>
      <path d="M${hs},0 L${-hs * 0.8},${-hs * 0.75} L${-hs * 0.45},0 L${-hs * 0.8},${hs * 0.75}Z" transform="translate(${tip[0].toFixed(1)} ${tip[1].toFixed(1)}) rotate(${ang.toFixed(1)})" fill="${col}" stroke="${o.dk || RED_D}" stroke-width="2"/>
    </g>`;
  }

  function line(uv, p, o = {}) {
    if (p <= 0.002) return '';
    const pts = scr(cut(uv, o.from || 0, p));
    const op = o.op == null ? 1 : o.op;
    let s = '';
    if (o.under) s += `<polyline points="${pstr(pts)}" fill="none" stroke="${o.under}" stroke-width="${(o.w || 4) + (o.underW || 4)}" stroke-linecap="round" stroke-linejoin="round" ${o.dash ? `stroke-dasharray="${o.dash}"` : ''} opacity="${o.underOp || 0.6}"/>`;
    if (o.glow) s += `<polyline points="${pstr(pts)}" fill="none" stroke="${o.glowCol || o.col}" stroke-width="${(o.w || 4) * 3}" stroke-linecap="round" opacity="${0.45 * o.glow}" filter="url(#glow)"/>`;
    s += `<polyline points="${pstr(pts)}" fill="none" stroke="${o.col || INK}" stroke-width="${o.w || 4}" stroke-linecap="round" stroke-linejoin="round" ${o.dash ? `stroke-dasharray="${o.dash}" stroke-dashoffset="${o.dashOff || 0}"` : ''}/>`;
    return `<g opacity="${op.toFixed(3)}">${s}</g>`;
  }

  // ------------------------------------------------------------------ text
  const cv = document.createElement('canvas').getContext('2d');
  function tw(text, font, size, ls = 0) { cv.font = `${size}px ${font}`; return cv.measureText(text).width + ls * text.length; }
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function plate(x, y, text, o = {}) {
    // parchment label plate centred at x, y (screen)
    const size = o.size || 26, font = o.font || 'Fell', ls = o.ls != null ? o.ls : 1.5;
    const w = tw(text, font, size, ls) + (o.padX || 22) * 2, h = size * 1.45 + (o.padY || 4) * 2;
    const op = o.op == null ? 1 : o.op, sc = o.scale || 1;
    const fill = o.fill || 'rgba(244,236,214,0.93)', stroke = o.stroke || INK, col = o.col || INK;
    return `<g opacity="${op.toFixed(3)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sc.toFixed(3)})">
      <rect x="${(-w / 2).toFixed(1)}" y="${(-h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="1.6" filter="url(#drop)"/>
      <rect x="${(-w / 2 + 4).toFixed(1)}" y="${(-h / 2 + 4).toFixed(1)}" width="${(w - 8).toFixed(1)}" height="${(h - 8).toFixed(1)}" rx="2" fill="none" stroke="${stroke}" stroke-width="0.7" opacity="0.6"/>
      <text x="0" y="${(size * 0.36).toFixed(1)}" text-anchor="middle" font-family="${font}" font-size="${size}" letter-spacing="${ls}" fill="${col}">${esc(text)}</text>
    </g>`;
  }
  function mapText(x, y, text, o = {}) {
    // label lettered straight onto the map (no plate): seas, regions
    const size = o.size || 28, op = o.op == null ? 1 : o.op;
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" font-family="${o.font || 'FellItalic'}" font-size="${size}" letter-spacing="${o.ls || 3}" fill="${o.col || INK}" opacity="${op.toFixed(3)}" stroke="rgba(244,236,214,0.75)" stroke-width="4" paint-order="stroke">${esc(text)}</text>`;
  }
  function placeLabel(ll, text, t0, o = {}) {
    const t = NOW;
    const a = (o.until != null ? win(t, t0, o.until, 0.3, 0.5) : sstep(t0, t0 + 0.3, t)) * (o.op == null ? 1 : o.op);
    if (a <= 0) return '';
    const p = proj(ll, o.cam);
    if (!onScreen(p)) return '';
    const dx = o.dx || 0, dy = o.dy == null ? -58 : o.dy;
    const sc = 0.85 + 0.15 * easeOutBack(clamp((t - t0) / 0.35, 0, 1));
    return plate(p[0] + dx, p[1] + dy, text, { ...o, op: a, scale: sc });
  }

  // ------------------------------------------------------------------ icons
  function pin(ll, t0, o = {}) {
    const t = NOW;
    if (t < t0) return '';
    const a = o.until != null ? 1 - sstep(o.until - 0.4, o.until, t) : 1;
    if (a <= 0) return '';
    const p = proj(ll, o.cam);
    if (!onScreen(p)) return '';
    const u = clamp((t - t0) / 0.42, 0, 1);
    const drop = (1 - easeOutBack(u)) * -70;
    const col = o.col || INK, sc = o.scale || 1;
    const ring = u < 1 || t - t0 < 0.9 ? (() => {
      const r = clamp((t - t0 - 0.3) / 0.6, 0, 1);
      return r > 0 && r < 1 ? `<circle cx="0" cy="0" r="${(8 + 40 * r).toFixed(1)}" fill="none" stroke="${o.ringCol || col}" stroke-width="${3 * (1 - r)}" opacity="${(1 - r).toFixed(3)}"/>` : '';
    })() : '';
    const lit = o.lit ? `<circle cx="0" cy="-30" r="${22 + 4 * Math.sin(t * 5)}" fill="${o.litCol || '#7fb2ff'}" opacity="${0.55 * o.lit}" filter="url(#glow)"/>` : '';
    return `<g opacity="${a.toFixed(3)}" transform="translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) scale(${sc})">
      <ellipse cx="0" cy="2" rx="${9 * (0.5 + 0.5 * u)}" ry="3.2" fill="rgba(0,0,0,0.35)"/>
      ${ring}
      <g transform="translate(0 ${drop.toFixed(1)})">${lit}
        <path d="M0,0 C-6,-10 -14,-18 -14,-29 A14,14 0 1,1 14,-29 C14,-18 6,-10 0,0Z" fill="${col}" stroke="${o.dk || '#140d07'}" stroke-width="1.6"/>
        <circle cx="0" cy="-29" r="5.5" fill="${PAPER}"/>
      </g>
    </g>`;
  }
  function flare(tIn) {
    // pin flare that dissolves into the clip (0.3 s); ffmpeg's iris opens on top of this
    const t = NOW;
    const u = (t - (tIn - 0.12)) / 0.5;
    if (u < 0 || u > 1) return '';
    const r = 10 + 260 * easeOutCubic(u), a = 1 - u;
    return `<g transform="translate(${CX} ${CY - 29})">
      <circle r="${r.toFixed(1)}" fill="#fff2c8" opacity="${(0.55 * a).toFixed(3)}" filter="url(#glow)"/>
      <circle r="${(r * 0.45).toFixed(1)}" fill="#fffaf0" opacity="${(0.8 * a).toFixed(3)}"/>
      ${[0, 45, 90, 135].map((g) => `<rect x="${-r * 1.4}" y="-1.5" width="${r * 2.8}" height="3" fill="#fff6dc" opacity="${(0.6 * a).toFixed(3)}" transform="rotate(${g + u * 30})"/>`).join('')}
    </g>`;
  }
  const SHIP = 'M-15,1 L15,1 L11,7 L-12,7 Z M-5,-4 L5,-4 L5,1 L-5,1Z M-1,-9 L2,-9 L2,-4 L-1,-4Z M-11,-1 L-7,-1 L-7,1 L-11,1Z';
  const SUB = 'M-16,2 C-16,-2 -10,-3 0,-3 C10,-3 16,-1 17,1 C16,3 10,4 0,4 C-10,4 -16,4 -16,2Z M-3,-3 L-2,-8 L4,-8 L5,-3Z';
  const PLANE = 'M0,-14 C2,-14 2,-9 2,-5 L15,1 L15,4 L2,1 L1.5,9 L5,12 L5,14 L0,12.5 L-5,14 L-5,12 L-1.5,9 L-2,1 L-15,4 L-15,1 L-2,-5 C-2,-9 -2,-14 0,-14Z';
  const TRUCK = 'M-14,-6 L4,-6 L4,4 L-14,4Z M5,-3 L11,-3 L14,1 L14,4 L5,4Z M-10,4 A3,3 0 1,0 -9.9,4Z M9,4 A3,3 0 1,0 9.1,4Z';
  function icon(path, x, y, o = {}) {
    const s = o.s || 1, r = o.rot || 0, op = o.op == null ? 1 : o.op;
    return `<path d="${path}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(1)}) scale(${s.toFixed(3)})" fill="${o.col || RED}" stroke="${o.dk || RED_D}" stroke-width="${(1.3 / s).toFixed(2)}" opacity="${op.toFixed(3)}" filter="url(#drop)"/>`;
  }
  function unit(x, y, o = {}) {
    // NATO-style infantry unit symbol (box with X) — a map symbol, never a person
    const s = o.s || 1, op = o.op == null ? 1 : o.op;
    const col = o.col || RED, fill = o.fill || (col === RED ? '#f1c9bf' : '#c9d8f0');
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})" opacity="${op.toFixed(3)}">
      <rect x="-15" y="-10" width="30" height="20" fill="${fill}" stroke="${col}" stroke-width="2.6" filter="url(#drop)"/>
      <path d="M-15,-10 L15,10 M15,-10 L-15,10" stroke="${col}" stroke-width="2.2"/></g>`;
  }
  function burst(x, y, s, op, col = '#e2562b') {
    const pts = [];
    for (let i = 0; i < 16; i++) { const r = i % 2 ? 0.45 : 1; const a = (i / 16) * 2 * Math.PI; pts.push([Math.cos(a) * r * s, Math.sin(a) * r * s]); }
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" opacity="${op.toFixed(3)}"><path d="M${pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join('L')}Z" fill="${col}" stroke="#5a1a08" stroke-width="1.5"/><circle r="${(s * 0.3).toFixed(1)}" fill="#ffd27a"/></g>`;
  }
  function smoke(x, y, t, t0, s = 1, op = 1) {
    let g = '';
    for (let i = 0; i < 7; i++) {
      const ph = ((t - t0) * 0.55 + i / 7) % 1;
      const r = (6 + 16 * ph) * s, dx = Math.sin(i * 2.1 + ph * 2) * 6 * s + ph * 14 * s, dy = -ph * 60 * s;
      g += `<circle cx="${(x + dx).toFixed(1)}" cy="${(y + dy).toFixed(1)}" r="${r.toFixed(1)}" fill="#3b3631" opacity="${(op * 0.55 * (1 - ph) * sstep(0, 0.1, ph)).toFixed(3)}"/>`;
    }
    return g;
  }
  function circleRange(ll, rDeg, p, o = {}) {
    const c = proj(ll);
    const r = rDeg * CAM.z * p;
    if (r < 1) return '';
    return `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${r.toFixed(1)}" fill="${o.fill || 'rgba(179,38,30,0.08)'}" stroke="${o.col || RED}" stroke-width="${o.w || 2.5}" stroke-dasharray="${o.dash || '10 9'}" opacity="${(o.op == null ? 1 : o.op).toFixed(3)}"/>`;
  }

  function counter(x, y, label, value, o = {}) {
    // screen-anchored counter card: small typewriter label + bold figure
    const op = o.op == null ? 1 : o.op;
    if (op <= 0) return '';
    const ls = 26, vs = o.vsize || 44;
    const w = Math.max(tw(label, 'Elite', ls), tw(value, 'Oswald', vs, 1)) + 52, h = ls + vs + 34;
    const sc = o.scale || 1;
    return `<g opacity="${op.toFixed(3)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sc.toFixed(3)})">
      <rect x="0" y="0" width="${w.toFixed(1)}" height="${h}" fill="rgba(244,236,214,0.94)" stroke="${INK}" stroke-width="1.8" filter="url(#drop)"/>
      <rect x="0" y="0" width="7" height="${h}" fill="${o.accent || RED}"/>
      <text x="26" y="${ls + 8}" font-family="Elite" font-size="${ls}" fill="${INK}">${esc(label)}</text>
      <text x="26" y="${ls + vs + 16}" font-family="Oswald" font-weight="700" font-size="${vs}" letter-spacing="1" fill="${o.vcol || INK}">${esc(value)}</text>
    </g>`;
  }
  function stamp(x, y, text, t0, o = {}) {
    const t = NOW;
    if (t < t0) return '';
    const u = clamp((t - t0) / 0.2, 0, 1);
    const sc = lerp(o.from || 2.4, 1, easeOutCubic(u)) * (o.scale || 1);
    const shake = u >= 1 && t - t0 < 0.45 ? Math.sin((t - t0) * 90) * 5 * (1 - (t - t0) / 0.45) : 0;
    const op = (o.op == null ? 1 : o.op) * sstep(0, 0.25, u);
    const size = o.size || 96, col = o.col || RED, font = o.font || 'Stamp';
    const w = tw(text, font, size, 4) + 60, h = size * 1.3;
    return `<g opacity="${op.toFixed(3)}" transform="translate(${(x + shake).toFixed(1)} ${y.toFixed(1)}) rotate(${o.rot == null ? -8 : o.rot}) scale(${sc.toFixed(3)})" filter="url(#grunge)">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="10" fill="none" stroke="${col}" stroke-width="8"/>
      <rect x="${-w / 2 + 12}" y="${-h / 2 + 12}" width="${w - 24}" height="${h - 24}" rx="6" fill="none" stroke="${col}" stroke-width="3"/>
      <text x="0" y="${size * 0.36}" text-anchor="middle" font-family="${font}" font-size="${size}" letter-spacing="4" fill="${col}">${esc(text)}</text>
    </g>`;
  }
  function bigNumeral(n, t0) {
    const t = NOW;
    const a = win(t, t0, t0 + 1.55, 0.05, 0.45);
    if (a <= 0) return '';
    const u = clamp((t - t0) / 0.2, 0, 1);
    const sc = lerp(2.8, 1, easeOutCubic(u)) * (1 + 0.04 * clamp((t - t0 - 0.2) / 1.3, 0, 1));
    const shake = t - t0 > 0.2 && t - t0 < 0.55 ? Math.sin((t - t0) * 80) * 7 * (1 - (t - t0 - 0.2) / 0.35) * (0.6 + 0.2 * n) : 0;
    return `<g opacity="${a.toFixed(3)}" transform="translate(${CX + shake} ${CY + 20}) scale(${sc.toFixed(3)})">
      <circle r="190" fill="rgba(244,236,214,0.86)" stroke="${INK}" stroke-width="5" filter="url(#drop)"/>
      <circle r="172" fill="none" stroke="${RED}" stroke-width="3"/>
      <text x="0" y="118" text-anchor="middle" font-family="Playfair" font-weight="900" font-size="330" fill="${INK}">${n}</text>
    </g>`;
  }
  function dimAll(op) { return op > 0 ? `<rect width="${W}" height="${H}" fill="#140e08" opacity="${op.toFixed(3)}"/>` : ''; }

  // ------------------------------------------------------------------ static defs
  const DEFS = `<defs>
    <filter id="drop" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2.5" stdDeviation="2.2" flood-color="#1a1008" flood-opacity="0.45"/></filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
    <filter id="grunge" x="-20%" y="-30%" width="140%" height="160%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.45" result="m"/>
      <feComposite in="SourceGraphic" in2="m" operator="in"/>
    </filter>
    <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="10" height="10" fill="rgba(179,38,30,0.16)"/><line x1="0" y1="0" x2="0" y2="10" stroke="rgba(150,28,20,0.55)" stroke-width="2.4"/></pattern>
  </defs>`;

  // ------------------------------------------------------------------ DOM
  let NOW = 0;
  const root = document.getElementById('root');
  const maps = {};
  function buildMap(id) {
    const div = document.createElement('div');
    div.className = 'map';
    div.id = id;
    let imgs = '';
    for (const [k, L] of Object.entries(LAYERS)) imgs += `<image data-k="${k}" href="/ep/assets/${L.file}" x="${L.x}" y="${L.y}" width="${L.w}" height="${L.h}" preserveAspectRatio="none"/>`;
    div.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <rect width="${W}" height="${H}" fill="#a3b3ac"/>
      <g class="cam">${imgs}
        <path class="ausfx" d="${GEO.aus}" fill="none"/>
        <path class="coast" d="${GEO.coast}" fill="none" stroke="#2e2216" stroke-opacity="0.6" stroke-width="1.1" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
      </g></svg>
      <div class="tint night" style="background:#0a1630;mix-blend-mode:multiply;opacity:0"></div>
      <div class="tint warm" style="background:#f0a860;mix-blend-mode:soft-light;opacity:0"></div>`;
    root.appendChild(div);
    maps[id] = {
      div, cam: div.querySelector('.cam'), coast: div.querySelector('.coast'), aus: div.querySelector('.ausfx'),
      night: div.querySelector('.night'), warm: div.querySelector('.warm'),
      imgs: [...div.querySelectorAll('image')].map((el) => ({ el, L: LAYERS[el.dataset.k], k: el.dataset.k })),
    };
  }
  function updateMap(m, cam, g) {
    m.cam.setAttribute('transform', `translate(${CX} ${CY}) scale(${cam.z.toFixed(5)}) translate(${(-cam.u).toFixed(5)} ${(-cam.v).toFixed(5)})`);
    const hw = W / 2 / cam.z, hh = H / 2 / cam.z;
    for (const { el, L, k } of m.imgs) {
      if (k === 'base') continue;
      const vis = cam.z > 14 && L.x < cam.u + hw && L.x + L.w > cam.u - hw && L.y < cam.v + hh && L.y + L.h > cam.v - hh;
      el.style.display = vis ? '' : 'none';
    }
    m.coast.setAttribute('stroke-width', clamp(0.55 + cam.z / 60, 0.7, 1.7).toFixed(2));
    // Australia effects: pale / dim / bright
    let fill = 'none', fop = 0;
    if (g.dimAus > 0.001) { fill = '#120c06'; fop = 0.26 * g.dimAus; }
    else if (g.paleAus > 0.001) { fill = '#fbf3df'; fop = 0.42 * g.paleAus; }
    else if (g.brightAus > 0.001) { fill = '#fff1c4'; fop = 0.32 * g.brightAus; }
    m.aus.setAttribute('fill', fill);
    m.aus.setAttribute('fill-opacity', fop.toFixed(3));
    const sat = (1 - 0.85 * g.desat) * (1 - 0.35 * g.night) * (1 + 0.12 * g.warm);
    const bri = (1 - 0.12 * g.desat) * (1 - 0.12 * g.night) * (1 - 0.1 * g.iso) * (1 + 0.03 * g.warm);
    m.div.style.filter = `saturate(${(sat * (1 + 0.1 * g.warm)).toFixed(3)}) brightness(${bri.toFixed(3)}) sepia(${(0.06 * g.warm + 0.12 * g.desat).toFixed(3)})`;
    m.night.style.opacity = (0.5 * g.night).toFixed(3);
    m.warm.style.opacity = (0.42 * g.warm).toFixed(3);
  }

  // ------------------------------------------------------------------ build all choreography
  let G = {}; // grade tracks
  let ROUTES = {};
  let OVER = []; // overlay painters (t) => svg

  function setup() {
    BR = TL.broll;
    const b = Object.fromEntries(BR.map((x) => [x.id, x]));
    KEYS = [];
    const Z = (ll, zz, t, e) => K(t, ll, zz, e);
    // zoom-through camera: arrive on the pin at tIn, push in hidden, pull back after tOut
    function zt(bb, approachFrom, zIn, pullTo, pullZ, pullDur = 1.1) {
      const ll = [bb.lon, bb.lat];
      if (approachFrom) K(bb.tIn - 0.55, ll, approachFrom, 'io');
      K(bb.tIn, ll, zIn, 'in');
      K(bb.tOut, ll, zIn * 1.35, 'lin');
      K(bb.tOut + pullDur, pullTo || ll, pullZ, 'out');
    }

    // ===== COLD OPEN =====
    K(0, [128, 12], 9.7);
    K(A('V01', 'tokyo'), P.tokyo, 62, 'io');
    zt(b.B01, 80, 520, P.tokyo, 48, 1.0);
    K(A('V02', 'real'), [136, 13], 15.2, 'io');
    K(E('V02'), [137, 12.5], 15.8, 'lin');
    K(E('V03'), [140, 11], 15.0, 'io');
    K(A('V04', 'three'), [148, 5.5], 12.9, 'io');
    K(S('V05'), [150, 5], 12.5, 'lin');
    // ===== ACT 1 =====
    K(A('V05', 'pearl'), [160, 15], 16.0, 'io');
    K(A('V05', 'southeast'), [142, 12], 17.5, 'io');
    K(A('V05', 'hong'), [114, 12], 30, 'io');
    K(A('V05', 'singapore'), [104.5, 2.5], 58, 'io');
    K(S('V06') + 0.2, P.singapore, 75, 'io');
    zt(b.B02, null, 430, [106, 0], 55, 1.6);
    K(A('V07', 'japan'), [122, 2], 22, 'io');
    K(A('V07', 'australia'), [128, -13], 17, 'io');
    K(A('V07', 'most'), [129, -13], 17.6, 'lin');
    K(A('V07', 'world'), [94, 8], 9.7, 'io');
    K(A('V08', 'japanese'), [131, -12.2], 70, 'io');
    zt(b.B03, 110, 480, [131.2, -12.8], 70, 1.4);
    K(A('V09', 'prime'), [136, -27], 23.5, 'io');
    K(A('V09', 'look'), [137, -26], 24.5, 'lin');
    K(A('V09', 'america') + 1.6, [190, 0], 9.6, 'io');
    K(S('V10'), [191, 1], 9.3, 'lin');
    K(A('V10', 'tokyo') + 0.3, [139.69, 35.2], 52, 'io');
    K(A('V10', 'most'), [139.69, 35.2], 56, 'lin');
    K(A('V10', 'china') + 0.4, [120, 18], 12.5, 'io');
    K(S('V11') + 0.3, [121, 18], 12.8, 'lin');
    K(A('V11', 'march'), P.tokyo, 46, 'io');
    K(A('V11', 'decision') + 0.2, [147, 5.5], 12.9, 'io');
    K(TL.marks.slam1, [148, 5], 13.3, 'lin');
    // ===== ACT 2 =====
    K(S('V12'), [138, -2], 18, 'io');
    K(A('V12', 'idea'), [131.6, -13.2], 66, 'io');
    K(A('V12', 'picture'), [131.2, -12.7], 88, 'io');
    zt(b.B04, 140, 500, [131.6, -13.6], 48, 1.2);
    K(A('V13', 'darwin'), [130.9, -12.6], 160, 'io');
    K(A('V13', 'civilians') - 0.6, [131.6, -14.6], 62, 'io');
    K(A('V14', 'thousands'), [134, -21], 30, 'io');
    K(A('V14', 'railway'), [132.2, -14.1], 70, 'io');
    K(A('V14', 'line'), [135, -26.5], 44, 'io');
    K(A('V14', 'between', 0, 0.2), [133.8, -18.4], 38, 'io');
    K(A('V15', 'that', 1, -0.6), [133.55, -19.6], 60, 'io');
    zt(b.B05, null, 470, [133.6, -19.4], 46, 1.2);
    K(A('V16', 'stewart'), [133.6, -19.2], 48, 'lin');
    K(A('V16', 'so'), [131.4, -13.9], 60, 'io');
    K(A('V16', 'facing'), [132.2, -14.6], 48, 'io');
    K(A('V16', 'supply') + 0.3, [134, 11], 12.5, 'io');
    K(E('V16'), [133, 9], 12.8, 'lin');
    K(A('V17', 'empty'), [130.9, -11.6], 150, 'io');
    K(A('V17', 'japanese'), [130.6, -11.5], 300, 'io');
    K(A('V17', 'widely'), [130.5, -11.47], 360, 'lin');
    K(A('V18', 'verdict') + 0.4, [132, -14.5], 40, 'io');
    K(TL.marks.slam2, [132.5, -14.6], 38, 'lin');
    // ===== ACT 3 =====
    K(S('V19'), [146, -6], 16, 'io');
    zt(b.B06, 40, 330, [152, -22], 21, 1.0);
    K(A('V20', 'melbourne') + 0.6, [151, -27], 21.5, 'io');
    K(A('V20', 'then'), [149, -6], 13.2, 'io');
    K(b.B07.tIn - 0.55, [149.5, 6], 30, 'io');
    zt(b.B07, null, 330, [148, -3], 13, 1.0);
    K(A('V21', 'battle'), [152.5, -12.5], 30, 'io');
    K(A('V21', 'one'), [151.5, -11.8], 33, 'lin');
    K(A('V21', 'midway') + 0.05, P.midway, 64, 'io');
    zt(b.B08, null, 470, [176, 14], 12, 1.2);
    K(A('V22', 'some'), [172, 10], 11.5, 'io');
    K(A('V22', 'by'), [120, 4], 9.7, 'io');
    K(E('V22'), [121, 3], 9.9, 'lin');
    K(A('V23', 'possibly'), [151.21, -33.87], 70, 'io');
    zt(b.B09, 110, 470, [120, 6], 11.5, 1.6);
    K(A('V24', 'continent'), [136, -27], 24, 'io');
    K(A('V24', 'very'), [136, -27], 25.5, 'lin');
    K(A('V24', 'instead'), [148, 5.5], 12.9, 'io');
    K(TL.marks.slam3, [149, 5], 13.3, 'lin');
    // ===== ACT 4 =====
    K(S('V25'), [165, 0], 13, 'io');
    K(A('V25', 'lifeline'), [185, 3], 11, 'io');
    K(A('V25', 'take'), [180, 0], 11.6, 'lin');
    K(A('V25', 'wanted'), [148, -13], 30, 'io');
    K(E('V25'), [146, -15.5], 27, 'lin');
    K(A('V26', 'american'), [182, -4], 12.2, 'io');
    K(A('V26', 'supplies') + 0.5, [178, -6], 12.6, 'lin');
    K(A('V26', 'australia', 1), [140, -6], 12.4, 'io');
    K(S('V27'), [139, -7], 12.9, 'lin');
    K(A('V27', 'and'), [137, -14], 17, 'sio');
    K(A('V27', 'japanese', 0, -0.4), [151.3, -33.75], 140, 'io');
    zt(b.B10, 300, 820, [151.5, -33.35], 170, 1.0);
    K(A('V28', 'japanese') - 0.2, [151.5, -33.4], 175, 'lin');
    K(b.B11.tIn - 0.55, [147.6, -9.1], 190, 'io');
    zt(b.B11, null, 520, [147.55, -9.1], 140, 0.9);
    K(E('V28') + 1.0, [147.6, -9.1], 150, 'lin');
    K(A('V29', 'coral') - 0.2, [166, 7], 13.2, 'io');
    K(A('V29', 'after'), [168, 6], 13.6, 'lin');
    K(A('V29', 'canceled') - 0.3, [181, -4], 12.5, 'io');
    K(A('V29', 'lifeline'), [182, -5], 12.8, 'lin');
    K(S('V31'), [170, 4], 9.7, 'io');
    // ===== ACT 5 =====
    K(A('V31', 'zealand'), [190, -6], 9.8, 'io');
    K(S('V32'), [190, -7], 10.2, 'lin');
    K(A('V32', 'continent'), [141, -30], 24, 'io');
    K(b.B12.tIn - 0.55, [144.93, -37.84], 150, 'io');
    zt(b.B12, null, 700, [144.9, -37.7], 80, 1.0);
    K(A('V33', 'millions'), [82, 6], 9.7, 'io');
    K(A('V33', 'so'), [92, 2], 9.9, 'lin');
    K(A('V33', 'alliances') - 0.5, [134, -27], 23.5, 'io');
    K(S('V34'), [134, -27], 24.5, 'lin');
    K(A('V34', 'one'), [138, -24], 20, 'io');
    K(A('V34', 'follow'), [138, -24], 21, 'lin');
    K(TL.marks.endScreen, [148, -20], 12.5, 'io');
    K(TL.duration, [151, -21], 13.2, 'lin');
    KEYS.sort((x, y) => x.t - y.t);

    // ===== grade tracks =====
    const b3 = b.B03;
    G.night = track([[0, 1], [E('V02'), 1], [S('V03') + 4.5, 0]]);
    G.desat = track([
      [S('V06') - 0.4, 0], [S('V06') + 0.4, 0.7], [E('V06') + 1.6, 0.7], [S('V07') + 0.8, 0],
      [b3.tOut, 0], [b3.tOut + 0.6, 0.75], [S('V09') + 1.2, 0.75], [A('V09', 'prime') + 0.6, 0],
      [A('V13', 'hammered') - 0.3, 0], [A('V13', 'hammered') + 0.5, 0.45], [A('V13', 'geography') - 0.3, 0.45], [A('V13', 'geography') + 0.6, 0],
      [S('V23') - 0.3, 0], [A('V23', 'cities'), 0.88], [S('V24') + 0.6, 0.88], [A('V24', 'mainland'), 0],
      [A('V26', 'fewer') - 0.2, 0], [A('V26', 'australia', 1), 0.48], [A('V27', 'japanese'), 0.48], [A('V27', 'japanese') + 0.8, 0.35], [E('V28'), 0.35], [A('V29', 'after'), 0.25], [A('V29', 'lifeline') + 0.2, 0], [A('V29', 'lifeline') + 1.0, 0],
    ]);
    G.paleAus = track([[A('V07', 'australia') - 0.3, 0], [A('V07', 'australia') + 0.5, 1], [S('V08'), 1], [A('V08', 'japanese'), 0]]);
    G.dimAus = track([[A('V26', 'australia', 1) - 0.3, 0], [A('V26', 'alone') + 0.4, 1], [A('V29', 'lifeline'), 1], [A('V29', 'lifeline') + 0.6, 0]]);
    G.iso = track([[A('V26', 'australia', 1) - 0.3, 0], [A('V26', 'alone') + 0.4, 1], [A('V27', 'japanese'), 1], [A('V27', 'japanese') + 0.6, 0.15], [A('V29', 'lifeline'), 0.15], [A('V29', 'lifeline') + 0.6, 0]]);
    G.brightAus = track([[A('V29', 'lifeline') + 0.1, 0], [A('V29', 'lifeline') + 0.7, 1], [S('V31'), 0.6], [A('V31', 'forever'), 0]]);
    G.warm = track([[A('V31', 'invasion'), 0], [A('V31', 'america'), 1], [TL.duration, 1]]);

    // ===== routes (map units) =====
    ROUTES.main = curveUV(P.tokyo, [131.5, -13.5], -0.16);
    ROUTES.s1 = curveUV(P.tokyo, [131.2, -11.6], -0.2);
    ROUTES.s2 = curveUV(P.tokyo, [153.5, -26], -0.08);
    ROUTES.s3 = curveUV(P.tokyo, [176, -15.5], 0.1);
    ROUTES.toUSA = curveUV(P.sydney, [236.5, 37.2], 0.12);
    ROUTES.supplyJ = curveUV(P.darwin, [138.5, 34.5], -0.12);
    ROUTES.rail1 = splineUV([P.darwin, [131.1, -13.24], [131.82, -13.82], [132.26, -14.47], [133.07, -14.92], P.birdum], 6);
    ROUTES.rail2 = splineUV([P.portaugusta, [138.04, -31.6], [138.06, -29.65], [136.6, -28.4], [135.45, -27.55], [134.58, -25.57], [134.2, -24.6], P.alice], 6);
    ROUTES.gap = splineUV([P.birdum, [133.37, -16.25], [133.79, -18.32], [134.19, -19.65], [133.89, -21.53], P.alice], 8);
    ROUTES.road = [...ROUTES.gap].reverse();
    ROUTES.lifeline = splineUV([[236.8, 37.4], [214, 12], P.samoa, P.fiji, P.newcal, [154.0, -27.2]], 20);
    ROUTES.supplyE = splineUV([[139.2, 34.6], [146, 22], [150, 10], [154, -4], [156.5, -16], [154.5, -26.6]], 16);
    ROUTES.kokoda = splineUV([[148.39, -8.67], [148.0, -8.8], P.kokoda, [147.66, -9.15], [147.56, -9.24], [147.49, -9.29]], 10);
    ROUTES.coralRed = splineUV([P.rabaul, [153.3, -7], [153.4, -10.3], [151.0, -11.6], [148.6, -10.6]], 10);
    ROUTES.coralBack = splineUV([[150.4, -11.3], [152.6, -10.9], [153.6, -8.6], [153.1, -6.0]], 10);
  }

  // ------------------------------------------------------------------ overlays (screen space)
  function overlays(t) {
    const b = Object.fromEntries(BR.map((x) => [x.id, x]));
    let s = '';
    const add = (x) => { if (x) s += x; };

    // ---------- red tide (Act 1) ----------
    const tide = tideSvg(t);
    add(tide);

    // ---------- COLD OPEN ----------
    add(pin(P.tokyo, A('V01', 'tokyo') - 0.15, { col: RED, until: S('V05') + 1.2 }));
    add(placeLabel(P.tokyo, 'TOKYO', A('V01', 'tokyo') + 0.3, { until: b.B01.tIn - 0.2 }));
    add(placeLabel(P.tokyo, 'TOKYO', b.B01.tOut + 0.6, { until: S('V05') + 1.0 }));
    add(flare(b.B01.tIn));
    // main red arrow: V02 draw → hover → retract on "rejected"; V03 re-extend; V04 split
    {
      let p = 0, op = 1;
      const d0 = A('V02', 'idea'), d1 = A('V02', 'weeks') + 0.3, rj = A('V02', 'rejected');
      if (t >= d0 && t < rj) p = easeInOutCubic(clamp((t - d0) / (d1 - d0), 0, 1));
      if (t >= rj && t < rj + 0.5) p = 1 - easeInCubic(clamp((t - rj - 0.05) / 0.45, 0, 1));
      const e0 = S('V03') + 0.2, e1 = A('V03', 'been') + 0.5, sp = A('V04', 'three');
      if (t >= e0 && t < sp + 0.8) p = easeInOutCubic(clamp((t - e0) / (e1 - e0), 0, 1));
      if (t >= sp) op = 1 - sstep(sp, sp + 0.8, t);
      // V11: the plan returns for a moment, then vanishes on "No invasion"
      const r0 = A('V11', 'decision') + 0.6, nv = A('V11', 'no');
      if (t >= r0 && t < nv + 0.5) { p = 1; op = sstep(r0, r0 + 0.5, t) * (1 - sstep(nv, nv + 0.45, t)); }
      const hover = t >= d1 && t < rj ? 0.5 + 0.5 * Math.sin(t * 6) : 0;
      if (p > 0 && op > 0) add(arrow(ROUTES.main, p, { w0: 7, w1: 20, headL: 42, headW: 52, op, glow: hover * 0.6 }));
    }
    // ships fill the sea (V03), drifting south; gone when the arrow splits
    {
      const s0 = A('V03', 'actually') - 0.2, s1 = A('V03', 'australia') + 0.3;
      const out = A('V04', 'three') + 0.6;
      if (t > s0 && t < out + 0.6) {
        for (let i = 0; i < 34; i++) {
          const ti = s0 + (i / 34) * (s1 - s0);
          const a = sstep(ti, ti + 0.3, t) * (1 - sstep(out, out + 0.6, t));
          if (a <= 0) continue;
          const f = ((i * 0.618) % 1) * 0.66 + 0.16, side = (((i * 0.381) % 1) - 0.5) * 22;
          const base = cut(ROUTES.main, 0, f).pop();
          const drift = (t - ti) * 0.18;
          const p = projUV([base[0] + side * 0.9 * (0.4 + f), base[1] + drift + side * 0.12]);
          add(icon(SHIP, p[0], p[1], { s: 0.95, op: a, rot: 0 }));
        }
      }
    }
    add(stamp(1010, 560, 'REJECTED', A('V02', 'rejected'), { op: 1 - sstep(S('V03') + 0.1, S('V03') + 0.7, t), size: 104 }));
    // three dotted scenario arrows
    {
      const sp = A('V04', 'three');
      const vis = Math.max(win(t, sp, S('V05') + 1.3, 0.3, 0.8), win(t, A('V11', 'what') - 0.2, TL.marks.slam1 + 0.6, 0.4, 0.5), win(t, A('V24', 'instead') - 0.3, TL.marks.slam3 + 0.6, 0.4, 0.5));
      if (vis > 0) {
        const grow = (k) => {
          if (t < S('V11')) return easeOutCubic(clamp((t - sp - k * 0.18) / 1.2, 0, 1));
          if (t < S('V25')) { const t0 = t < S('V24') ? A('V11', 'what') - 0.2 : A('V24', 'instead') - 0.3; return easeOutCubic(clamp((t - t0 - k * 0.15) / 0.9, 0, 1)); }
          return 1;
        };
        const pulse = (t0, dur = 1.3) => (t >= t0 && t < t0 + dur ? Math.sin(((t - t0) / dur) * Math.PI) : 0);
        const loop = (t0) => (t >= t0 ? 0.5 + 0.5 * Math.sin((t - t0) * 5.5) : 0);
        const pul = [
          Math.max(pulse(A('V04', 'small')), t > S('V11') && t < S('V24') ? loop(A('V11', 'what')) : 0),
          pulse(A('V04', 'full')),
          Math.max(pulse(A('V04', 'plan')), t > S('V24') ? loop(A('V24', 'plan')) : 0),
        ];
        const glow3 = t < S('V05') + 1.5 ? sstep(A('V04', 'most'), A('V04', 'most') + 0.4, t) : 0;
        const rs = [ROUTES.s1, ROUTES.s2, ROUTES.s3];
        rs.forEach((r, k) => {
          const g = grow(k);
          const red3 = k === 2 ? Math.max(glow3, pul[2]) : 0;
          add(dotted(r, g, { op: vis * (0.85 + 0.15 * pul[k]), w: 6 + 3 * pul[k], head: 18 + 5 * pul[k], glow: Math.max(pul[k] * 0.8, red3), col: k === 2 && red3 > 0.1 ? '#d8261a' : RED }));
          if (g > 0.95) {
            const tip = projUV(r[r.length - 1]);
            const sc = 1 + 0.25 * pul[k];
            add(`<g opacity="${vis.toFixed(3)}" transform="translate(${(tip[0] + 30).toFixed(1)} ${(tip[1] - 26).toFixed(1)}) scale(${sc.toFixed(3)})"><circle r="21" fill="${PAPER}" stroke="${k === 2 && red3 > 0.1 ? '#d8261a' : INK}" stroke-width="3" filter="url(#drop)"/><text y="10" text-anchor="middle" font-family="Playfair" font-weight="900" font-size="28" fill="${INK}">${k + 1}</text></g>`);
          }
        });
      }
    }
    // series title build in the V04 gap
    add(titleSvg(t, E('V04') + 0.12, S('V05') + 0.9));

    // ---------- ACT 1 ----------
    {
      const pp = A('V05', 'pearl');
      add(pin(P.pearl, pp - 0.2, { col: RED, until: A('V07', 'japan') }));
      if (t > pp) { const q = proj(P.pearl); add(smoke(q[0] + 6, q[1] - 10, t, pp, 0.9, 1 - sstep(A('V07', 'japan') - 0.5, A('V07', 'japan'), t))); }
      add(placeLabel(P.pearl, 'PEARL HARBOR', pp + 0.2, { until: A('V07', 'japan'), dx: 0, dy: 34 }));
      for (const [ll, w, nm, dx, dy] of [[P.hongkong, 'hong', 'HONG KONG', 0, -58], [P.malaya, 'malaya', 'MALAYA', -96, -14], [P.singapore, 'singapore', 'SINGAPORE', 0, 34]]) {
        add(pin(ll, A('V05', w) - 0.25, { col: RED, until: S('V08') }));
        add(placeLabel(ll, nm, A('V05', w), { until: S('V07') + 1.0, dx, dy }));
      }
      add(flare(b.B02.tIn));
      // date labels on the tide
      add(placeLabel([116, 18], 'DECEMBER 1941', A('V05', 'december'), { until: S('V08'), font: 'Elite', size: 24, ls: 1, dy: 0, fill: 'rgba(179,38,30,0.9)', col: '#fff3e0', stroke: RED_D }));
      add(placeLabel([108, -6], 'FEBRUARY 1942', A('V05', 'february'), { until: S('V08'), font: 'Elite', size: 24, ls: 1, dy: 0, fill: 'rgba(179,38,30,0.9)', col: '#fff3e0', stroke: RED_D }));
      // V07 counters
      const cOut = A('V08', 'japanese');
      add(counter(110, 640, 'Population', '~7 million', { op: win(t, A('V07', 'seven') - 0.2, cOut, 0.3, 0.5), accent: BLUE }));
      add(counter(110, 790, 'Coastline', '30,000+ km', { op: win(t, A('V07', 'coastline'), cOut, 0.3, 0.5), accent: BLUE }));
      add(placeLabel([134, -25], 'AUSTRALIA', A('V07', 'australia'), { until: A('V07', 'world') + 0.6, dy: 0, size: 30, ls: 6 }));
      // blue soldier (unit) icons far away in the Middle East
      const me = A('V07', 'other');
      const meOp = win(t, me, A('V08', 'japanese') + 0.4, 0.3, 0.6);
      if (meOp > 0) {
        const c = proj(P.mideast);
        [[-34, -20], [0, -26], [34, -20], [-20, 8], [16, 8], [50, 6]].forEach(([dx, dy], i) => add(unit(c[0] + dx, c[1] + dy, { col: BLUE, s: 0.85, op: meOp * sstep(me + i * 0.08, me + i * 0.08 + 0.25, t) })));
        add(placeLabel(P.mideast, 'MIDDLE EAST', me + 0.3, { until: A('V08', 'japanese') + 0.4, dy: 52, size: 22 }));
      }
      // V08 planes onto Darwin
      const pl0 = A('V08', 'japanese') - 0.1, pl1 = A('V08', 'darwin') + 0.2;
      add(pin(P.darwin, A('V08', 'darwin') - 0.7, { col: INK, until: S('V10') }));
      add(placeLabel(P.darwin, 'DARWIN', A('V08', 'darwin') - 0.4, { until: b.B03.tIn - 0.15 }));
      add(placeLabel(P.darwin, 'DARWIN', b.B03.tOut + 0.9, { until: A('V09', 'prime'), dy: 34 }));
      if (t > pl0 && t < pl1 + 0.6) {
        const u = clamp((t - pl0) / (pl1 - pl0), 0, 1);
        const op = 1 - sstep(pl1, pl1 + 0.5, t);
        for (let i = 0; i < 9; i++) {
          const row = Math.floor(i / 3), col = i % 3;
          const from = [126.2 + col * 0.55 - row * 0.2, -8.6 + row * 0.5 - col * 0.15];
          const to = [130.6 + col * 0.18, -12.25 - row * 0.12];
          const e = easeInOutCubic(clamp(u * 1.08 - i * 0.008, 0, 1));
          const ll = [lerp(from[0], to[0], e), lerp(from[1], to[1], e)];
          const q = proj(ll);
          const ang = Math.atan2(V(to[1]) - V(from[1]), U(to[0]) - U(from[0])) / DEG + 90;
          add(icon(PLANE, q[0], q[1], { s: 1.7, rot: ang, op, col: RED }));
        }
      }
      add(flare(b.B03.tIn));
      if (t > b.B03.tOut && t < A('V09', 'prime') + 1) {
        const q = proj(P.darwin);
        const so = 1 - sstep(A('V09', 'prime'), A('V09', 'prime') + 1, t);
        add(smoke(q[0] - 14, q[1] - 6, t, b.B03.tOut, 1.1, so));
        add(smoke(q[0] + 16, q[1] - 2, t, b.B03.tOut + 0.4, 0.9, so));
      }
      // V09 Curtin archive card + newspaper; blue line to the USA on "look to America"
      add(curtinCard(t));
      const la = A('V09', 'look');
      add(line(ROUTES.toUSA, easeInOutCubic(clamp((t - la) / 1.9, 0, 1)), { col: BLUE, w: 5, under: BLUE_D, underW: 4, op: win(t, la, A('V10', 'tokyo') + 0.6, 0.1, 0.6), glow: 0.6 }));
      add(placeLabel([244, 40], 'UNITED STATES', la + 1.5, { until: A('V10', 'tokyo') + 0.6, dy: 0, size: 24 }));
      // V10 Navy vs Army, counters, China
      add(navyArmy(t));
      add(counter(1250, 700, 'Divisions needed', '10–12', { op: win(t, A('V10', '10') - 0.1, A('V10', 'most'), 0.3, 0.5) }));
      add(counter(1250, 840, 'Shipping needed', 'up to 2,000,000 tons', { op: win(t, A('V10', '2') - 0.1, A('V10', 'most'), 0.3, 0.5) }));
      add(chinaCluster(t));
      // V11 date stamp onto Tokyo
      {
        const ds = A('V11', 'march') + 0.15;
        if (t > ds) {
          const q = proj(P.tokyo);
          add(stamp(q[0] - 10, q[1] + 120, '4 MARCH 1942', ds, { size: 46, font: 'Elite', rot: -5, col: RED, op: 1 - sstep(A('V11', 'no') + 1.0, A('V11', 'no') + 1.6, t), from: 2.0 }));
        }
      }
    }

    // ---------- ACT 2 ----------
    add(bigNumeral(1, TL.marks.slam1));
    {
      const lt = A('V12', 'picture');
      const out12 = A('V14', 'thousands');
      const land = [[[129.4, -9.8], [130.75, -12.3]], [[132.6, -9.6], [132.4, -11.4]], [[128.2, -12.6], [129.75, -13.9]]];
      land.forEach(([a, z], i) => add(arrow(curveUV(a, z, 0.1, 20), easeOutCubic(clamp((t - lt - i * 0.25) / 0.8, 0, 1)), { w0: 5, w1: 12, headL: 24, headW: 30, op: win(t, lt, b.B04.tIn + 0.2, 0.1, 0.3) + win(t, b.B04.tOut, out12, 0.3, 0.6) * 0.8 })));
      add(pin([b.B04.lon, b.B04.lat], lt + 0.3, { col: INK, until: b.B04.tIn + 0.4 }));
      add(flare(b.B04.tIn));
      // after B04: airfields + bombing-range circles; ship-block icons in the sea lanes
      const af = b.B04.tOut + 0.6;
      [[130.87, -12.41], [131.03, -13.05], [132.26, -14.47]].forEach((ll, i) => {
        const a = win(t, af + i * 0.2, out12, 0.25, 0.6);
        if (a <= 0) return;
        add(circleRange(ll, 3.2, easeOutCubic(clamp((t - af - i * 0.2) / 1.0, 0, 1)), { op: a * 0.8, fill: 'rgba(179,38,30,0.035)' }));
        const q = proj(ll);
        add(`<g opacity="${a.toFixed(3)}" transform="translate(${q[0].toFixed(1)} ${q[1].toFixed(1)})"><circle r="15" fill="${PAPER}" stroke="${RED}" stroke-width="3" filter="url(#drop)"/><path d="M-10,0 L10,0 M0,-10 L0,10" stroke="${RED}" stroke-width="4"/></g>`);
      });
      const sb = Math.max(A('V12', 'bases') - 0.1, af + 0.6);
      [[127.6, -9.4], [134.0, -9.6], [138.6, -10.2], [125.0, -11.8]].forEach((ll, i) => {
        const a = win(t, sb + i * 0.18, out12, 0.25, 0.6);
        if (a <= 0) return;
        const q = proj(ll);
        add(`<g opacity="${a.toFixed(3)}" transform="translate(${q[0].toFixed(1)} ${q[1].toFixed(1)})">${icon(SHIP, 0, 0, { s: 0.9, col: '#6b7b88', dk: '#2b3238' })}<circle r="20" fill="none" stroke="${RED}" stroke-width="3.5"/><path d="M-14,-14 L14,14" stroke="${RED}" stroke-width="3.5"/></g>`);
      });
      // V13 Darwin damage + civilians south
      const hm = A('V13', 'hammered');
      add(pin(P.darwin, S('V12') + 1.0, { col: INK, until: A('V17', 'empty') }));
      add(placeLabel(P.darwin, 'DARWIN', A('V12', 'idea'), { until: b.B04.tIn - 0.4, dx: -70, dy: 0 }));
      add(placeLabel(P.darwin, 'DARWIN', A('V13', 'darwin') - 0.2, { until: A('V17', 'empty'), dx: -78, dy: 0 }));
      if (t > hm && t < out12 + 0.6) {
        const q = proj(P.darwin);
        [[-30, -20], [24, -30], [36, 18], [-18, 26], [4, -4]].forEach(([dx, dy], i) => {
          const a = sstep(hm + i * 0.15, hm + i * 0.15 + 0.2, t) * (1 - sstep(out12, out12 + 0.6, t));
          add(burst(q[0] + dx, q[1] + dy, 16 * (0.8 + 0.2 * Math.sin(t * 9 + i)), a * 0.9));
        });
      }
      const cv0 = A('V13', 'civilians');
      for (let i = 0; i < 6; i++) {
        const a0 = [130.9 + (i % 3) * 0.25, -12.7 - Math.floor(i / 3) * 0.2];
        const a1 = [131.1 + (i % 3) * 0.35 + i * 0.05, -15.2 - (i % 2) * 0.4];
        add(arrow(curveUV(a0, a1, 0.05 * (i % 2 ? 1 : -1), 12), easeOutCubic(clamp((t - cv0 - i * 0.12) / 1.1, 0, 1)), { w0: 2, w1: 5, headL: 12, headW: 14, col: '#7a6c5a', dk: '#3b3125', op: win(t, cv0, out12, 0.2, 0.6) }));
      }
      // V14 railways, gap glow, counter
      const r1 = A('V14', 'railway'), r1e = A('V14', 'bird') + 0.2, r2 = A('V14', 'line'), r2e = A('V14', 'alice') + 0.3;
      const railOff = A('V17', 'empty');
      const rail = (uv, p) => line(uv, p, { col: '#1e1610', w: 5, under: PAPER, underW: 5, underOp: 0.85, op: 1 - sstep(railOff - 0.5, railOff, t) }) + line(uv, p, { col: PAPER, w: 2.2, dash: '6 8', op: 1 - sstep(railOff - 0.5, railOff, t) });
      if (t > r1) add(rail(ROUTES.rail1, easeInOutCubic(clamp((t - r1) / (r1e - r1), 0, 1))));
      if (t > r2) add(rail(ROUTES.rail2, easeInOutCubic(clamp((t - r2) / (r2e - r2), 0, 1))));
      add(pin(P.birdum, A('V14', 'bird') - 0.1, { col: INK, until: railOff }));
      add(placeLabel(P.birdum, 'BIRDUM', A('V14', 'bird'), { until: railOff, dx: 86, dy: -10 }));
      add(pin(P.alice, A('V14', 'alice') - 0.1, { col: INK, until: railOff }));
      add(placeLabel(P.alice, 'ALICE SPRINGS', A('V14', 'alice'), { until: railOff, dx: 120, dy: 0 }));
      const gb = A('V14', 'between');
      const gop = win(t, gb, A('V16', 'push') + 0.8, 0.4, 0.8);
      if (gop > 0) add(line(ROUTES.gap, 1, { col: '#ff7a2a', w: 7, dash: '3 13', glow: 0.6 + 0.4 * Math.sin(t * 4.5), glowCol: '#ff9a3a', op: gop }));
      add(counter(1230, 760, 'Between Birdum and Alice Springs', '~1,000 km of NO railway', { op: win(t, A('V14', 'thousand', 1) - 0.2, b.B05.tIn - 0.3, 0.3, 0.4), vcol: RED }));
      add(pin([b.B05.lon, b.B05.lat], S('V15') + 0.5, { col: '#c4521c', until: b.B05.tIn + 0.4 }));
      add(flare(b.B05.tIn));
      // V16 road + trucks + label; red force stuck; blue counterattacks; supply line frays
      const rd0 = A('V16', 'push'), rd1 = A('V16', 'gap') + 0.4, rOff = A('V17', 'empty');
      if (t > rd0) {
        const p = easeInOutCubic(clamp((t - rd0) / (rd1 - rd0), 0, 1));
        add(line(ROUTES.road, p, { col: '#7b4a22', w: 6, under: PAPER, underW: 4, op: 1 - sstep(rOff - 0.5, rOff, t) }));
        const top = 1 - sstep(A('V16', 'so') + 1.5, A('V16', 'so') + 2.5, t);
        for (let i = 0; i < 5; i++) {
          const f = ((t - rd0) * 0.06 + i / 5) % 1;
          if (f > p || top <= 0) continue;
          const pt = cut(ROUTES.road, 0, Math.max(0.001, f));
          const q = projUV(pt.pop()), q0 = projUV(pt.length ? pt.pop() : ROUTES.road[0]);
          const ang = Math.atan2(q[1] - q0[1], q[0] - q0[0]) / DEG;
          add(icon(TRUCK, q[0], q[1], { s: 0.95, rot: Math.abs(ang) > 90 ? ang + 180 : ang, col: '#4f6a3a', dk: '#1e2a14', op: top * sstep(0, 0.05, f) }));
        }
      }
      add(placeLabel([134.2, -19.0], '→ Stuart Highway', A('V16', 'stewart'), { until: A('V16', 'so') + 2.5, dx: 150, dy: 0, font: 'FellItalic', size: 28, ls: 1 }));
      const rf = A('V16', 'so');
      const fOff = A('V17', 'empty');
      if (t > rf) {
        const q = proj(P.darwin);
        [[-26, 40], [10, 44], [46, 40], [-8, 72], [28, 74]].forEach(([dx, dy], i) => add(unit(q[0] + dx, q[1] + dy, { s: 0.85, op: sstep(rf + i * 0.1, rf + i * 0.1 + 0.25, t) * (1 - sstep(fOff - 0.5, fOff, t)) })));
      }
      // marching south? stalls and recoils
      {
        const m0 = A('V16', 'marching'), m1 = A('V16', 'impossible') + 0.3;
        if (t > m0 && t < m1 + 0.8) {
          const p = t < m1 ? 0.55 * easeOutCubic(clamp((t - m0) / 1.2, 0, 1)) : 0.55 * (1 - easeInCubic(clamp((t - m1) / 0.6, 0, 1)));
          add(dotted(curveUV([131.2, -13.4], [133.3, -20.5], 0.06), p, { w: 6, op: 1 - sstep(m1 + 0.4, m1 + 0.8, t) }));
        }
      }
      const ca = A('V16', 'facing');
      [[[134.6, -16.6], [131.9, -13.6]], [[136.2, -13.4], [132.0, -12.8]], [[133.2, -10.6], [131.3, -12.0]]].forEach(([a, z], i) => add(arrow(curveUV(a, z, -0.12, 20), easeOutCubic(clamp((t - ca - i * 0.3) / 0.9, 0, 1)), { col: BLUE, dk: BLUE_D, w0: 6, w1: 14, headL: 28, headW: 34, op: win(t, ca, fOff, 0.1, 0.6) })));
      const sl = A('V16', 'supply'), fr = A('V16', 'exactly');
      if (t > sl) {
        const p = easeInOutCubic(clamp((t - sl) / 1.6, 0, 1));
        const fray = sstep(fr - 0.5, fr + 2.5, t);
        const flick = 1 - fray * (0.45 + 0.45 * Math.abs(Math.sin(t * 13.7) * Math.sin(t * 7.3)));
        add(line(ROUTES.supplyJ, p, { col: RED, w: 5 - 1.5 * fray, dash: fray > 0.02 ? `${(22 - 14 * fray).toFixed(1)} ${(6 + 22 * fray).toFixed(1)}` : null, dashOff: -t * 30, under: RED_D, underW: 2, op: flick * (1 - sstep(fOff - 0.5, fOff, t)) }));
      }
      // V17 Melville Island, plane spirals onto the beach, label only
      add(placeLabel([130.95, -11.25], 'MELVILLE ISLAND', A('V17', 'melville'), { until: A('V18', 'verdict') + 0.5, dy: -40, size: 28 }));
      {
        const s0 = A('V17', 'japanese'), s1 = A('V17', 'island') + 0.1;
        const off = A('V18', 'verdict') + 0.5;
        if (t > s0 - 0.3 && t < off) {
          const u = clamp((t - s0) / (s1 - s0), 0, 1);
          const c = proj(P.crash);
          const R = 190 * (1 - easeInOutCubic(u)), ang = u * 3.2 * Math.PI;
          const x = c[0] + Math.cos(ang) * R, y = c[1] + Math.sin(ang) * R * 0.6 - 0;
          const head = (ang / DEG + 180) % 360;
          const op = sstep(s0 - 0.3, s0, t) * (1 - sstep(off - 0.5, off, t));
          if (u >= 1) {
            add(`<ellipse cx="${c[0]}" cy="${c[1] + 6}" rx="30" ry="7" fill="rgba(60,40,20,0.35)" opacity="${op}"/>`);
            const puff = clamp((t - s1) / 1.2, 0, 1);
            if (puff < 1) add(`<circle cx="${c[0]}" cy="${c[1]}" r="${10 + 40 * puff}" fill="#d9c9a5" opacity="${(0.6 * (1 - puff) * op).toFixed(3)}"/>`);
          }
          add(icon(PLANE, x, y, { s: lerp(1.6, 1.05, u), rot: u >= 1 ? 70 : head, col: RED, op }));
        }
        const lab = A('V17', 'captured');
        const lo = win(t, lab, off, 0.4, 0.5);
        if (lo > 0) {
          const c = proj(P.crash);
          add(`<line x1="${c[0]}" y1="${c[1] + 8}" x2="${c[0] - 40}" y2="${c[1] + 92}" stroke="${INK}" stroke-width="1.6" opacity="${lo}"/>`);
          add(plate(c[0] - 40, c[1] + 120, 'Captured by Matthias Ulungura, Tiwi man', { op: lo, font: 'Baskerville', size: 27, ls: 0.3, scale: 0.9 + 0.1 * sstep(lab, lab + 0.4, t) }));
        }
      }
      // V18 verdict card
      add(verdict(t));
    }

    // ---------- ACT 3 ----------
    add(bigNumeral(2, TL.marks.slam2));
    {
      add(pin([b.B06.lon, b.B06.lat], S('V19') + 1.0, { col: INK, until: b.B06.tIn + 0.4 }));
      add(flare(b.B06.tIn));
      const cityOff = A('V21', 'battle');
      const arr = [[[160.5, -9], P.brisbane, 'brisbane', 'BRISBANE'], [[161, -11], P.sydney, 'sydney', 'SYDNEY'], [[161.5, -13], P.melbourne, 'melbourne', 'MELBOURNE']];
      const a0 = A('V20', 'landings');
      arr.forEach(([from, to, w, nm], i) => {
        const tEnd = A('V20', w) + 0.15, tSt = Math.min(a0 + i * 0.35, tEnd - 0.9);
        add(arrow(curveUV(from, to, -0.22 - i * 0.03), easeInOutCubic(clamp((t - tSt) / (tEnd - tSt), 0, 1)), { w0: 10, w1: 30, headL: 56, headW: 70, op: win(t, tSt, cityOff, 0.1, 0.6) }));
        add(pin(to, tEnd - 0.15, { col: INK, until: cityOff }));
        add(placeLabel(to, nm, tEnd, { until: cityOff, dx: -100, dy: 0 }));
      });
      // shipping counter climbs
      const sc0 = A('V20', '2') - 0.2;
      if (t > sc0) {
        const v = Math.round(2000000 * easeOutCubic(clamp((t - sc0) / 1.6, 0, 1)) / 1000) * 1000;
        add(counter(110, 700, 'Shipping needed', `up to ${v.toLocaleString('en-AU')} tons`, { op: win(t, sc0, A('V20', 'every'), 0.3, 0.5) }));
      }
      // non-stop stream of ships along the supply route; subs pick them off after B07
      const st0 = A('V20', 'then');
      const out = A('V21', 'battle') - 0.2;
      if (t > st0 && t < out + 0.6) {
        const rop = 1 - sstep(out, out + 0.6, t);
        add(line(ROUTES.supplyE, easeInOutCubic(clamp((t - st0) / 1.2, 0, 1)), { col: RED, w: 3, dash: '10 8', op: 0.8 * rop }));
        const kill0 = b.B07.tOut + 0.35;
        for (let i = 0; i < 9; i++) {
          const f = ((t - st0) * 0.045 + i / 9) % 1;
          const appear = sstep(st0 + i * 0.12, st0 + i * 0.12 + 0.3, t);
          const victim = i % 2 === 0 && i < 8;
          const kt = kill0 + (i / 2) * 0.55;
          const dead = victim ? clamp((t - kt) / 0.7, 0, 1) : 0;
          const ff = victim && t > kt ? ((kt - st0) * 0.045 + i / 9) % 1 : f;
          const q = projUV(cut(ROUTES.supplyE, 0, Math.max(0.002, ff)).pop());
          if (dead > 0) add(burst(q[0], q[1], 22 * Math.sin(Math.PI * Math.min(1, dead * 1.4)), (1 - dead) * rop, '#f07a2a'));
          add(icon(SHIP, q[0], q[1] + dead * 8, { s: 1.0, op: appear * (1 - dead) * rop, col: RED }));
          if (victim && t > kt - 0.5 && t < kt + 0.8) {
            const sub = [q[0] + (i % 4 < 2 ? -70 : 70), q[1] + 40];
            const sa = sstep(kt - 0.5, kt - 0.2, t) * (1 - sstep(kt + 0.4, kt + 0.8, t));
            add(icon(SUB, sub[0], sub[1], { s: 1.3, col: BLUE, dk: BLUE_D, op: sa * rop }));
            const tp = clamp((t - (kt - 0.25)) / 0.25, 0, 1);
            if (tp > 0 && tp < 1) add(`<line x1="${sub[0]}" y1="${sub[1]}" x2="${lerp(sub[0], q[0], tp)}" y2="${lerp(sub[1], q[1], tp)}" stroke="${BLUE_D}" stroke-width="2.5" stroke-dasharray="6 4"/>`);
          }
        }
      }
      add(flare(b.B07.tIn));
      // V21 Coral Sea battle icons, invasion force turned back from Port Moresby; Midway
      const cs = A('V21', 'coral');
      const csOff = A('V21', 'one') + 0.3;
      if (t > cs - 0.2 && t < csOff + 0.6) {
        const q = proj(P.coralsea);
        const op = sstep(cs - 0.2, cs + 0.2, t) * (1 - sstep(csOff, csOff + 0.6, t));
        [[-60, -30], [40, -50], [10, 30], [-30, 50], [70, 20]].forEach(([dx, dy], i) => add(burst(q[0] + dx, q[1] + dy, 14 + 7 * Math.abs(Math.sin(t * 7 + i * 1.7)), op * (0.5 + 0.5 * Math.abs(Math.sin(t * 5 + i))))));
        add(icon(PLANE, q[0] - 90 + 40 * Math.sin(t), q[1] - 70, { s: 1.0, rot: 120, col: BLUE, dk: BLUE_D, op }));
        add(icon(PLANE, q[0] + 80, q[1] + 60 + 20 * Math.sin(t * 1.3), { s: 1.0, rot: -60, col: RED, op }));
      }
      add(placeLabel(P.coralsea, 'Coral Sea', cs, { until: csOff + 0.6, dy: 100, font: 'FellItalic', size: 30, ls: 2 }));
      {
        const r0 = A('V21', 'battle'), tb = A('V21', 'turns'), bk = A('V21', 'back') + 0.1;
        const p = t < tb ? 0.85 * easeInOutCubic(clamp((t - r0) / (tb - r0), 0, 1)) : 0.85 * (1 - easeInCubic(clamp((t - bk) / 0.7, 0, 1)));
        const op = win(t, r0, csOff, 0.1, 0.6);
        add(arrow(ROUTES.coralRed, p, { w0: 6, w1: 15, headL: 30, headW: 36, op }));
        add(arrow(ROUTES.coralBack, easeOutCubic(clamp((t - bk - 0.3) / 0.8, 0, 1)), { w0: 4, w1: 10, headL: 22, headW: 26, op: op * 0.85 }));
        add(pin(P.moresby, A('V21', 'port') - 0.2, { col: INK, until: csOff + 0.6 }));
        add(placeLabel(P.moresby, 'PORT MORESBY', A('V21', 'port'), { until: csOff + 0.6, dx: -40, dy: 40 }));
      }
      add(pin(P.midway, A('V21', 'midway') - 0.25, { col: INK, until: b.B08.tOut + 2.2 }));
      add(placeLabel(P.midway, 'MIDWAY', A('V21', 'midway') - 0.1, { until: b.B08.tIn - 0.2, dy: 36 }));
      add(flare(b.B08.tIn));
      // V22 outcome arrows flicker; reinforcements from the Middle East and the USA
      {
        const node = [166, 14];
        const fl = (k) => 0.55 + 0.45 * Math.abs(Math.sin(t * (7.3 + k)) * Math.sin(t * (3.1 + k * 0.7) + k));
        const ew = A('V22', 'might'), fc = A('V22', 'collapse') - 0.4, off = A('V22', 'on');
        const o1 = win(t, ew, off, 0.3, 0.5) * fl(0), o2 = win(t, fc, off, 0.3, 0.5) * fl(2);
        const r1 = curveUV(node, [186, 30], -0.15, 30), r2 = curveUV(node, [180, -6], 0.18, 30);
        add(arrow(r1, easeOutCubic(clamp((t - ew) / 0.9, 0, 1)), { w0: 5, w1: 13, headL: 26, headW: 32, op: o1 }));
        add(arrow(r2, easeOutCubic(clamp((t - fc) / 0.9, 0, 1)), { w0: 5, w1: 13, headL: 26, headW: 32, op: o2 }));
        const e1 = projUV(r1[r1.length - 1]), e2 = projUV(r2[r2.length - 1]);
        if (o1 > 0) add(plate(e1[0] + 20, e1[1] - 44, 'Early wins?', { op: o1, font: 'Elite', size: 30, ls: 0.5 }));
        if (o2 > 0) add(plate(e2[0] + 20, e2[1] + 46, 'Faster collapse?', { op: o2, font: 'Elite', size: 30, ls: 0.5 }));
        const tr = A('V22', 'troops') - 0.3, us = A('V22', 'american'), po = A('V22', 'pouring');
        const rOff = A('V23', 'possibly');
        add(arrow(curveUV(P.mideast, [116, -28], -0.25), easeInOutCubic(clamp((t - tr) / 1.6, 0, 1)), { col: BLUE, dk: BLUE_D, w0: 6, w1: 16, headL: 34, headW: 40, op: win(t, tr, rOff, 0.1, 0.5) }));
        add(placeLabel(P.mideast, 'MIDDLE EAST', tr, { until: rOff, dy: -50, size: 22 }));
        const gr = A('V22', 'growing') - 0.3;
        [[133, -24], [145, -30], [147, -21], [138, -31], [120, -28], [140, -18]].forEach((ll, i) => {
          const q = proj(ll);
          add(unit(q[0], q[1], { col: BLUE, s: 0.75, op: win(t, gr + i * 0.12, rOff, 0.2, 0.5) }));
        });
        add(arrow(curveUV([236, 36], [153.5, -27], 0.14), easeInOutCubic(clamp((t - us) / 1.5, 0, 1)), { col: BLUE, dk: BLUE_D, w0: 6, w1: 16, headL: 34, headW: 40, op: win(t, us, rOff, 0.1, 0.5) }));
        [P.brisbane, P.sydney, P.melbourne, [146.8, -19.26]].forEach((ll, i) => {
          const t0 = po + i * 0.2;
          if (t < t0 - 0.6 || t > rOff) return;
          const q = proj(ll);
          const u = clamp((t - (t0 - 0.6)) / 0.6, 0, 1);
          const op = sstep(t0 - 0.6, t0 - 0.4, t) * (1 - sstep(rOff - 0.4, rOff, t));
          add(icon(PLANE, q[0] + 60 * (1 - u), q[1] - 50 * (1 - u), { s: 0.8, rot: 230, col: BLUE, dk: BLUE_D, op }));
          if (u >= 1) add(unit(q[0] + 16, q[1] + 14, { col: BLUE, s: 0.55, op }));
        });
      }
      // V23 city pin
      add(pin([b.B09.lon, b.B09.lat], A('V23', 'cities') - 0.2, { col: INK, until: b.B09.tIn + 0.4 }));
      add(flare(b.B09.tIn));
      // V24 the mainland United States slides over Australia
      {
        const s0 = A('V24', 'mainland') - 0.3, s1 = A('V24', 'states') + 0.5, off = A('V24', 'very') + 0.4;
        const op = win(t, s0, off, 0.3, 0.6);
        if (op > 0) {
          const e = easeInOutCubic(clamp((t - s0) / (s1 - s0), 0, 1));
          const c = proj([134.2, -25.6]);
          const x = lerp(c[0] + 1100, c[0], e);
          add(`<g opacity="${op.toFixed(3)}" transform="translate(${x.toFixed(1)} ${c[1].toFixed(1)}) scale(${CAM.z.toFixed(4)})">
            <path d="${GEO.usa}" fill="rgba(47,99,173,0.22)" stroke="${BLUE_D}" stroke-width="${(3 / CAM.z).toFixed(4)}" stroke-dasharray="${(10 / CAM.z).toFixed(3)} ${(7 / CAM.z).toFixed(3)}"/></g>`);
          add(mapText(x, c[1] - 30, 'MAINLAND UNITED STATES', { op, font: 'Fell', size: 30, col: BLUE_D }));
          add(mapText(c[0], c[1] + 70, 'AUSTRALIA', { op: op * e, font: 'Fell', size: 30 }));
        }
      }
    }

    // ---------- ACT 4 ----------
    add(bigNumeral(3, TL.marks.slam3));
    {
      // lifeline: draw, fray, snap; redraw solid on "The lifeline held"
      const l0 = A('V25', 'lifeline'), fr0 = A('V26', 'american'), sn = A('V26', 'supplies') + 0.25;
      const held = A('V29', 'lifeline');
      const fadeWar = A('V31', 'invasion') + 3.0;
      const pl = win(t, l0, fadeWar + 1.0, 0.05, 1.2);
      if (pl > 0) {
        if (t < sn) {
          const p = easeInOutCubic(clamp((t - l0) / 2.2, 0, 1));
          const fray = sstep(fr0, sn, t);
          const jit = fray * 2.5 * Math.sin(t * 40);
          add(line(ROUTES.lifeline, p, { col: BLUE, w: 10 - 4 * fray, under: BLUE_D, underW: 4, glow: 0.5 * (1 - fray), dash: fray > 0.05 ? `${(30 - 20 * fray).toFixed(1)} ${(2 + 16 * fray + jit).toFixed(1)}` : null, op: pl }));
        } else if (t < held) {
          const u = clamp((t - sn) / 0.9, 0, 1);
          const gapA = 0.62 - 0.2 * easeOutCubic(u), gapB = 0.62 + 0.18 * easeOutCubic(u);
          const op = pl * (1 - 0.35 * u);
          add(line(ROUTES.lifeline, gapA, { col: BLUE, w: 6, under: BLUE_D, underW: 3, dash: '18 14', op }));
          add(line(ROUTES.lifeline, 1, { from: gapB, col: BLUE, w: 6, under: BLUE_D, underW: 3, dash: '18 14', op }));
          if (u < 1) { const q = projUV(cut(ROUTES.lifeline, 0, 0.62).pop()); add(burst(q[0], q[1], 26 * (1 - u), 1 - u, '#9cc4ff')); }
        } else {
          const p = easeInOutCubic(clamp((t - held) / 1.3, 0, 1));
          const op = pl * (t > A('V31', 'invasion') ? 1 - 0.6 * sstep(A('V31', 'invasion'), fadeWar, t) : 1);
          add(line(ROUTES.lifeline, 1, { col: BLUE, w: 4, dash: '18 14', op: op * 0.5 * (1 - p) }));
          add(line(ROUTES.lifeline, p, { col: BLUE, w: 11, under: BLUE_D, underW: 4, glow: 0.9, op }));
        }
      }
      const isl = [['samoa', P.samoa, 'SAMOA', 0, 40], ['fiji', P.fiji, 'FIJI', 0, 40], ['new', P.newcal, 'NEW CALEDONIA', -40, 44]];
      const islOff = A('V26', 'australia', 1);
      isl.forEach(([w, ll, nm, dx, dy]) => {
        add(pin(ll, A('V25', w) - 0.15, { col: INK, until: islOff }));
        add(placeLabel(ll, nm, A('V25', w), { until: islOff, dx, dy, size: 22 }));
      });
      // red arrows reach for each island; cancelled after Midway (V29)
      const pt = A('V25', 'planned');
      const can = A('V29', 'canceled') + 0.2;
      [[P.truk, [186.4, -12.6]], [P.truk, [177.2, -16.6]], [P.rabaul, [165.0, -20.6]]].forEach(([a, z], i) => {
        const uv = curveUV(a, z, -0.15);
        const p = 0.94 * easeOutCubic(clamp((t - pt - i * 0.3) / 1.1, 0, 1));
        add(arrow(uv, p, { w0: 5, w1: 12, headL: 26, headW: 30, op: win(t, pt, A('V26', 'australia', 1) + 1.2, 0.1, 0.8) }));
        if (i < 2) {
          // V29: Fiji and Samoa reach redrawn, then struck out
          const r0 = A('V29', 'after') - 0.2;
          const o = win(t, r0, can + 1.2, 0.3, 0.5);
          if (o > 0) {
            add(arrow(uv, 0.94, { w0: 5, w1: 12, headL: 26, headW: 30, op: o * (1 - 0.6 * sstep(can, can + 0.4, t)) }));
            const m = projUV(uv[Math.floor(uv.length * 0.7)]);
            const x = clamp((t - can - i * 0.15) / 0.3, 0, 1);
            if (x > 0) add(`<g opacity="${o}" transform="translate(${m[0]} ${m[1]})"><path d="M-22,-22 L${-22 + 44 * x},${-22 + 44 * x} M22,-22 L${22 - 44 * x},${-22 + 44 * x}" stroke="${BLUE_D}" stroke-width="7" stroke-linecap="round"/></g>`);
          }
        }
      });
      const pm = A('V25', 'wanted');
      const pmOff = A('V26', 'australia', 1) + 1.0;
      add(arrow(curveUV(P.rabaul, [147.6, -9.2], 0.25), easeOutCubic(clamp((t - pm) / 1.0, 0, 1)), { w0: 6, w1: 14, headL: 28, headW: 34, op: win(t, pm, pmOff, 0.1, 0.8) }));
      add(pin(P.moresby, A('V25', 'port') - 0.1, { col: RED, until: pmOff }));
      add(placeLabel(P.moresby, 'PORT MORESBY', A('V25', 'port') + 0.1, { until: pmOff, dx: -110, dy: -12 }));
      const bb = A('V25', 'bombers') - 0.2;
      add(circleRange(P.moresby, 9.5, easeOutCubic(clamp((t - bb) / 1.4, 0, 1)), { op: win(t, bb, pmOff, 0.1, 0.8), w: 3 }));
      add(placeLabel(P.queensland, 'QUEENSLAND', A('V25', 'queensland'), { until: pmOff, dy: 0, size: 26 }));
      // V26 isolation vignette around Australia
      const iso = G.iso(t);
      if (iso > 0.01) {
        const c = proj([134, -26]);
        add(`<radialGradient id="isoG" cx="${c[0]}" cy="${c[1]}" r="${(30 * CAM.z).toFixed(1)}" gradientUnits="userSpaceOnUse"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0d0905" stop-opacity="${(0.3 * iso).toFixed(3)}"/></radialGradient><rect width="${W}" height="${H}" fill="url(#isoG)"/>`);
      }
      // V27 Sydney Harbour pin
      add(pin([b.B10.lon, b.B10.lat], A('V27', 'japanese') + 0.3, { col: INK, until: b.B10.tIn + 0.4 }));
      add(placeLabel(P.sydney, 'SYDNEY HARBOUR', A('V27', 'japanese') + 0.4, { until: b.B10.tIn - 0.2, dy: 40 }));
      add(flare(b.B10.tIn));
      // V28 shell bursts at Sydney and Newcastle
      const sh = A('V28', 'shelled') - 0.2;
      const shOff = A('V28', 'japanese') + 0.4;
      [[P.sydney, 'SYDNEY', 0], [P.newcastle, 'NEWCASTLE', 0.35]].forEach(([ll, nm, d]) => {
        const q = proj(ll);
        for (let i = 0; i < 4; i++) {
          const t0 = sh + d + i * 0.22;
          const u = clamp((t - t0) / 0.55, 0, 1);
          if (u > 0 && u < 1 && t < shOff + 0.3) add(burst(q[0] + [-26, 18, -6, 30][i], q[1] + [-14, 12, 22, -20][i], 26 * Math.sin(Math.PI * u), 1 - u * 0.6));
        }
        add(placeLabel(ll, nm, sh + d, { until: shOff, dx: -110, dy: 0 }));
      });
      // V28 Kokoda: red line crawls toward Port Moresby, distance counter stops at ~40 km
      {
        const k0 = b.B11.tOut + 0.25, k1 = k0 + 1.5;
        const off = A('V29', 'coral') + 0.3;
        add(pin(P.moresby, b.B11.tOut + 0.1, { col: INK, until: off }));
        add(placeLabel(P.moresby, 'PORT MORESBY', b.B11.tOut + 0.2, { until: off, dx: -60, dy: 38 }));
        add(placeLabel(P.kokoda, 'KOKODA', b.B11.tOut + 0.3, { until: off, dx: 70, dy: -30 }));
        if (t > k0) {
          const p = easeOutCubic(clamp((t - k0) / (k1 - k0), 0, 1));
          const op = 1 - sstep(off - 0.5, off, t);
          add(line(ROUTES.kokoda, p, { col: RED, w: 7, under: RED_D, underW: 3, op }));
          const tipUV = cut(ROUTES.kokoda, 0, Math.max(0.01, p)).pop();
          const tip = projUV(tipUV), pmq = proj(P.moresby);
          add(`<line x1="${tip[0]}" y1="${tip[1]}" x2="${pmq[0]}" y2="${pmq[1]}" stroke="${INK}" stroke-width="2" stroke-dasharray="4 6" opacity="${op}"/>`);
          const tipLL = [tipUV[0] / COS + LON0, LAT0 - tipUV[1]];
          const km = Math.max(40, Math.round(haversine(tipLL, P.moresby) / 5) * 5);
          add(counter(1240, 760, 'Distance to Port Moresby', `~${p >= 0.999 ? 40 : km} km`, { op, vcol: RED }));
        }
      }
      add(flare(b.B11.tIn));
      // V29 four pins light up in turn
      const lop = 1 - sstep(S('V31') + 0.5, A('V31', 'forever'), t);
      [['coral', P.coralsea, 'CORAL SEA', 0, 40], ['midway', P.midway, 'MIDWAY', 0, 40], ['kokoda', P.kokoda, 'KOKODA', -80, -20], ['millan', P.milnebay, 'MILNE BAY', 70, 40]].forEach(([w, ll, nm, dx, dy]) => {
        const t0 = A('V29', w) - 0.15;
        add(pin(ll, t0, { col: BLUE, dk: BLUE_D, lit: sstep(t0 + 0.3, t0 + 0.6, t) * lop, ringCol: '#7fb2ff', until: A('V31', 'forever') }));
        add(placeLabel(ll, nm, t0 + 0.2, { until: A('V31', 'forever'), dx, dy, size: 22 }));
      });
    }

    // ---------- ACT 5 ----------
    {
      // years tick past
      const y0 = A('V31', 'invasion'), y1 = A('V31', 'forever'), y2 = A('V31', '1951');
      const yOff = A('V32', 'and') + 0.6;
      const year = t < y1 ? '1942' : t < y2 ? '1945' : '1951';
      const ty = t < y1 ? y0 : t < y2 ? y1 : y2;
      const yo = win(t, y0, yOff, 0.3, 0.5);
      if (yo > 0) {
        const flip = clamp((t - ty) / 0.25, 0, 1);
        add(`<g opacity="${yo.toFixed(3)}" transform="translate(${CX} 150)">
          <rect x="-150" y="-62" width="300" height="112" fill="rgba(244,236,214,0.94)" stroke="${INK}" stroke-width="2" filter="url(#drop)"/>
          <text x="0" y="${(28 - 30 * (1 - easeOutCubic(flip))).toFixed(1)}" text-anchor="middle" font-family="Elite" font-size="86" fill="${INK}" opacity="${flip.toFixed(3)}">${year}</text></g>`);
      }
      // treaty document, animated pen, ANZUS triangle
      const doc0 = A('V31', 'zealand') - 0.3, sg = A('V31', 'signed'), anz = A('V31', 'anzus');
      const off = A('V32', 'continent');
      const dop = win(t, doc0, off, 0.4, 0.6);
      if (dop > 0) add(treaty(t, sg, dop));
      const tri = [P.canberra, P.wellington, [240, 39]];
      const top = win(t, anz - 0.3, off, 0.2, 0.6);
      if (top > 0) {
        const p = easeInOutCubic(clamp((t - anz + 0.3) / 1.1, 0, 1));
        const pts = scr([...tri, tri[0]].map((l) => [U(l[0]), V(l[1])]));
        add(`<polygon points="${pstr(pts.slice(0, 3))}" fill="rgba(47,99,173,${(0.16 * p).toFixed(3)})" opacity="${top}"/>`);
        add(line(cut([...tri, tri[0]].map((l) => [U(l[0]), V(l[1])]), 0, 1), p, { col: BLUE, w: 6, under: BLUE_D, underW: 3, op: top, glow: 0.4 }));
        for (const [ll, nm, dx, dy] of [[P.canberra, 'AUSTRALIA', -110, 10], [P.wellington, 'NEW ZEALAND', 0, 46], [[240, 39], 'USA', 0, -40]]) add(placeLabel(ll, nm, anz, { until: off, dx, dy, size: 22 }));
        const cen = pts.slice(0, 3).reduce((a, q) => [a[0] + q[0] / 3, a[1] + q[1] / 3], [0, 0]);
        add(plate(cen[0], cen[1] + 10, 'ANZUS 1951', { op: top * sstep(anz + 0.6, anz + 1.0, t), font: 'Playfair', size: 40, ls: 4, scale: 0.9 + 0.1 * easeOutBack(clamp((t - anz - 0.6) / 0.4, 0, 1)) }));
      }
      // V32 harbour pin
      add(pin([b.B12.lon, b.B12.lat], b.B12.tIn - 1.0, { col: GOLD, dk: '#5b3d0e', until: b.B12.tIn + 0.4 }));
      add(flare(b.B12.tIn));
      // V33 migration arrows, glowing cities, population counter climbing
      const br = A('V33', 'first') + 0.1, lt = A('V33', 'later') - 0.1;
      const mOff = S('V34') + 0.6;
      const mig = (from, to, t0, i) => add(arrow(curveUV(from, to, (i % 2 ? 0.16 : -0.16)), easeInOutCubic(clamp((t - t0) / 1.4, 0, 1)), { col: AMBER, dk: '#5b3410', w0: 3, w1: 10, headL: 22, headW: 26, op: win(t, t0, mOff, 0.1, 0.6) * 0.92 }));
      [[P.britain, P.melbourne], [P.britain, P.sydney], [[12, 47], P.adelaide], [[22, 40], P.melbourne], [[14, 42], P.perth]].forEach(([a, z], i) => mig(a, z, br + i * 0.15, i));
      [[[78, 22], P.perth], [[115, 30], P.sydney], [[106, 16], P.melbourne], [[121, 14], P.brisbane], [[35, 33], P.sydney], [[28, -26], P.perth], [[174.7, -37], P.sydney], [[236, 36], P.brisbane], [[125, 37], P.melbourne]].forEach(([a, z], i) => mig(a, z, lt + i * 0.13, i + 1));
      const gl = A('V33', 'so');
      const cityGlow = (cam, scale) => {
        let g = '';
        [P.sydney, P.melbourne, P.brisbane, P.perth, P.adelaide].forEach((ll, i) => {
          const q = proj(ll, cam);
          g += `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${(8 + 20 * scale + 3 * Math.sin(t * 3 + i)).toFixed(1)}" fill="#ffcf6a" opacity="${(0.55 * scale).toFixed(3)}" filter="url(#glow)"/><circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${(4 + 4 * scale).toFixed(1)}" fill="#fff0c0" opacity="${(0.9 * scale).toFixed(3)}"/>`;
        });
        return g;
      };
      const cg = sstep(br, gl + 4, t) * (1 - sstep(TL.marks.endScreen + 2, TL.marks.endScreen + 4, t));
      if (cg > 0 && t < A('V34', 'one')) add(cityGlow(CAM, cg));
      const pc = A('V33', 'millions') - 0.2;
      const pcOp = win(t, pc, A('V33', 'so') + 1.2, 0.3, 0.8);
      if (pcOp > 0) {
        const span = A('V33', 'so') + 1.2 - pc;
        const v = 7000000 + 12000000 * Math.pow(clamp((t - pc) / span, 0, 1), 1.6);
        add(counter(110, 780, 'Population', Math.round(v / 1000).toLocaleString('en-AU') + ',000', { op: pcOp, accent: AMBER }));
      }
      // V34 split: alternate 1942 (left) beside the real modern map (right)
      if (CAMB) {
        const sp = A('V34', 'one');
        const lop = 1;
        let L = '';
        // left: red arrows into Australia, cut lifeline, red tide
        const camL = CAM;
        const arrows = [[[128.5, -6.5], [131.0, -13.0]], [[160, -12], [152.6, -27.4]], [[162, -16], [151.0, -33.6]]];
        arrows.forEach(([a, z], i) => {
          const uv = curveUV(a, z, -0.15);
          L += arrow(uv, easeOutCubic(clamp((t - sp - 0.3 - i * 0.2) / 0.8, 0, 1)), { w0: 7, w1: 20, headL: 40, headW: 48, op: lop });
        });
        L += line(ROUTES.lifeline, 0.55, { col: BLUE, w: 6, dash: '18 14', under: BLUE_D, underW: 3, op: 0.8 });
        L += line(ROUTES.lifeline, 1, { from: 0.8, col: BLUE, w: 6, dash: '18 14', under: BLUE_D, underW: 3, op: 0.8 });
        const cutp = projUV(cut(ROUTES.lifeline, 0, 0.67).pop(), camL);
        L += `<g transform="translate(${cutp[0]} ${cutp[1]})"><path d="M-16,-16 L16,16 M16,-16 L-16,16" stroke="${RED}" stroke-width="7" stroke-linecap="round"/></g>`;
        L += plate(480, 150, '1942', { font: 'Elite', size: 56, ls: 3, col: RED, stroke: RED_D });
        let R = '';
        R += cityGlow(CAMB, 1);
        R += plate(1440, 150, 'TODAY', { font: 'Elite', size: 56, ls: 3, col: BLUE_D });
        const so = splitOpen(t);
        add(`<clipPath id="clipL"><rect x="0" y="0" width="${(CX - 0).toFixed(1)}" height="${H}"/></clipPath><clipPath id="clipR"><rect x="${CX}" y="0" width="${CX}" height="${H}"/></clipPath>`);
        add(`<g clip-path="url(#clipL)" opacity="${so.toFixed(3)}">${L}</g><g clip-path="url(#clipR)" opacity="${so.toFixed(3)}">${R}</g>`);
        add(`<g opacity="${so.toFixed(3)}"><rect x="${CX - 4}" y="0" width="8" height="${H}" fill="${PAPER}"/><rect x="${CX - 1.5}" y="0" width="3" height="${H}" fill="${INK}"/></g>`);
      }
    }
    // end screen title
    add(endTitle(t));
    return s;
  }

  function haversine(a, b) {
    const R = 6371, dLat = (b[1] - a[1]) * DEG, dLon = (b[0] - a[0]) * DEG;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * DEG) * Math.cos(b[1] * DEG) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // ------------------------------------------------------------------ composite pieces
  function tideSvg(t) {
    const t5 = S('V05');
    const off = TL.marks.slam1 + 0.8;
    const base = win(t, t5 + 0.2, off, 0.8, 0.8);
    if (base <= 0) return '';
    const st = (w, k = 'V05', occ = 0) => A(k, w, occ);
    const blobs = [
      // already held before Dec 1941 (fades in with the scene)
      [[138, 36], 5.5, t5 + 0.2], [[127.5, 37.5], 4, t5 + 0.3], [[125, 43], 6, t5 + 0.4], [[118, 36], 5.5, t5 + 0.5], [[114, 29], 5, t5 + 0.6],
      [[121, 24], 2.6, t5 + 0.6], [[106, 17], 4, t5 + 0.7], [[107, 11.5], 3, t5 + 0.8], [[112, 24], 4, t5 + 0.6],
      // strikes across Southeast Asia
      [[122, 14], 4, st('strikes')], [[125, 8], 3.2, st('strikes') + 0.2], [[100.5, 14.5], 3.5, st('across')], [[115, 2.5], 4.2, st('southeast')], [[118, 6], 3, st('southeast') + 0.2],
      [[114.2, 22.3], 2.2, st('hong')], [[102, 4.5], 3.2, st('malaya')], [[103.8, 1.3], 2.0, st('singapore')],
      // racing south (V07)
      [[101, -1], 4, A('V07', 'japan')], [[105, -5], 3.5, A('V07', 'empire')], [[110.5, -7], 3.5, A('V07', 'racing')], [[121, -2], 3.5, A('V07', 'racing') + 0.2],
      [[128, -3.5], 3, A('V07', 'south')], [[125, -9.3], 2.4, A('V07', 'south') + 0.2], [[151.5, -5], 3, A('V07', 'south') + 0.3], [[145.5, -5.5], 2.4, A('V07', 'south') + 0.5], [[133, -3], 2.2, A('V07', 'south') + 0.4],
    ];
    let c = '';
    for (const [ll, r, t0] of blobs) {
      const g = easeOutCubic(clamp((t - t0) / 1.1, 0, 1));
      if (g <= 0) continue;
      const q = proj(ll);
      c += `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${(r * CAM.z * g * (1 + 0.02 * Math.sin(t * 2 + r))).toFixed(1)}"/>`;
    }
    const strong = (1 - 0.75 * sstep(A('V08', 'japanese'), A('V08', 'japanese') + 1.2, t)) * clamp(48 / CAM.z, 0.15, 1);
    return `<g opacity="${(0.34 * base * strong).toFixed(3)}" fill="#a3221a" filter="url(#soft)">${c}</g><g opacity="${(0.5 * base * strong).toFixed(3)}" fill="url(#hatch)">${c}</g>`;
  }

  function titleSvg(t, t0, t1) {
    const a = win(t, t0, t1, 0.05, 0.6);
    if (a <= 0) return '';
    const txt = 'IF AUSTRALIA…';
    let x = 0;
    const size = 128;
    const total = tw(txt, 'Playfair', size, 10);
    let g = '';
    for (let i = 0; i < txt.length; i++) {
      const ch = txt[i];
      const w = tw(ch, 'Playfair', size, 10);
      const ti = t0 + 0.12 + i * 0.075;
      const u = clamp((t - ti) / 0.22, 0, 1);
      if (u > 0 && ch !== ' ') g += `<text x="${(x - total / 2 + w / 2).toFixed(1)}" y="${(size * 0.35 - 40 * (1 - easeOutBack(u))).toFixed(1)}" text-anchor="middle" font-family="Playfair" font-weight="900" font-size="${size}" fill="${INK}" opacity="${u.toFixed(3)}">${esc(ch)}</text>`;
      x += w;
    }
    const rule = easeOutCubic(clamp((t - t0) / 0.6, 0, 1));
    const sc = 1 + 0.03 * clamp((t - t0) / (t1 - t0), 0, 1);
    return `<g opacity="${a.toFixed(3)}" transform="translate(${CX} ${CY}) scale(${sc.toFixed(3)})">
      <rect x="${(-total / 2 - 60).toFixed(1)}" y="-120" width="${(total + 120).toFixed(1)}" height="220" fill="rgba(244,236,214,0.88)" stroke="${INK}" stroke-width="3" filter="url(#drop)"/>
      <rect x="${(-total / 2 - 46).toFixed(1)}" y="-106" width="${(total + 92).toFixed(1)}" height="192" fill="none" stroke="${INK}" stroke-width="1.2"/>
      <rect x="${(-(total / 2) * rule).toFixed(1)}" y="64" width="${(total * rule).toFixed(1)}" height="7" fill="${RED}"/>
      ${g}</g>`;
  }

  function curtinCard(t) {
    const t0 = A('V09', 'prime'), off = A('V09', 'america') + 1.4;
    const a = win(t, t0, off, 0.4, 0.9);
    if (a <= 0) return '';
    const pinp = proj(P.canberra);
    const u = easeOutBack(clamp((t - t0) / 0.5, 0, 1));
    const shrink = 1 - 0.45 * sstep(A('V09', 'america'), off, t);
    const cx = pinp[0] + 210, cy = pinp[1] - 250;
    const hasPhoto = !!window.__curtin;
    const photo = hasPhoto
      ? `<image href="/ep/archive/curtin.jpg" x="-120" y="-150" width="240" height="250" preserveAspectRatio="xMidYMid slice" style="filter:sepia(0.35) contrast(0.95)"/><rect x="-120" y="-150" width="240" height="250" fill="none" stroke="${INK}" stroke-width="1.5"/>`
      : `<rect x="-120" y="-150" width="240" height="250" fill="#e6dcc2" stroke="${INK}" stroke-width="1.2"/><path d="M-96,-60 L96,-60 M-96,40 L96,40" stroke="${INK}" stroke-width="1" opacity="0.5"/><text x="0" y="-8" text-anchor="middle" font-family="Elite" font-size="22" fill="#5a4630">PRIME MINISTER</text><text x="0" y="16" text-anchor="middle" font-family="Elite" font-size="22" fill="#5a4630">OF AUSTRALIA</text>`;
    let s = `<g opacity="${a.toFixed(3)}">
      <line x1="${pinp[0]}" y1="${pinp[1] - 10}" x2="${cx - 100}" y2="${cy + 140}" stroke="${INK}" stroke-width="2"/>
      <circle cx="${pinp[0]}" cy="${pinp[1]}" r="7" fill="${RED}" stroke="${INK}" stroke-width="2"/>
      <g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${(u * shrink).toFixed(3)}) rotate(-2.5)">
        <rect x="-140" y="-170" width="280" height="${hasPhoto ? 384 : 350}" fill="#f4ecd8" stroke="${INK}" stroke-width="2" filter="url(#drop)"/>
        ${photo}
        <text x="0" y="140" text-anchor="middle" font-family="Fell" font-size="32" letter-spacing="2" fill="${INK}">JOHN CURTIN</text>
        ${hasPhoto ? `<text x="0" y="164" text-anchor="middle" font-family="Elite" font-size="19" fill="#5a4630">Prime Minister</text><text x="0" y="198" text-anchor="middle" font-family="Elite" font-size="12" fill="#5a4630">Mitchell Library, State Library of NSW</text>` : ''}
        <rect x="-36" y="-186" width="72" height="26" fill="rgba(220,205,160,0.75)" transform="rotate(4)"/>
      </g></g>`;
    // newspaper icon unfolding beside it (greeked columns, no invented headline)
    const n0 = A('V09', 'wrote') - 0.1;
    const na = win(t, n0, off, 0.3, 0.9);
    if (na > 0) {
      const f = easeOutCubic(clamp((t - n0) / 0.6, 0, 1));
      const nx = cx + 250 * shrink, ny = cy + 60;
      let cols = '';
      for (let c = 0; c < 3; c++) for (let r = 0; r < 9; r++) cols += `<rect x="${-88 + c * 60}" y="${-28 + r * 13}" width="${50 - (r % 4 === 3 ? 18 : 0)}" height="5" fill="#6d5c45" opacity="0.6"/>`;
      s += `<g opacity="${na.toFixed(3)}" transform="translate(${nx.toFixed(1)} ${ny.toFixed(1)}) scale(${(f * shrink).toFixed(3)} ${shrink.toFixed(3)}) rotate(3)">
        <rect x="-100" y="-90" width="200" height="200" fill="#ece3cc" stroke="${INK}" stroke-width="1.8" filter="url(#drop)"/>
        <rect x="-88" y="-78" width="176" height="26" fill="${INK}" opacity="0.85"/>
        <rect x="-88" y="-46" width="176" height="3" fill="${INK}"/>
        ${cols}
        <line x1="0" y1="-90" x2="0" y2="110" stroke="#b9a988" stroke-width="1.2" opacity="${(1 - f).toFixed(3)}"/>
      </g>`;
    }
    return s;
  }

  function navyArmy(t) {
    const n0 = A('V10', 'navy'), a0 = A('V10', 'army'), off = A('V10', 'most');
    const na = win(t, n0, off, 0.3, 0.5), aa = win(t, a0, off, 0.3, 0.5);
    let s = '';
    const disc = (x, y, op, u, glyph, label, col) => `<g opacity="${op.toFixed(3)}" transform="translate(${x} ${y}) scale(${(0.6 + 0.4 * easeOutBack(u)).toFixed(3)})">
      <circle r="92" fill="rgba(244,236,214,0.95)" stroke="${INK}" stroke-width="3" filter="url(#drop)"/><circle r="82" fill="none" stroke="${col}" stroke-width="2"/>
      ${glyph}<text y="128" text-anchor="middle" font-family="Fell" font-size="32" letter-spacing="4" fill="${INK}">${label}</text></g>`;
    const anchor = `<g fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"><circle cx="0" cy="-42" r="11"/><path d="M0,-31 L0,48 M-28,-12 L28,-12 M-48,18 C-44,46 -20,54 0,50 C20,54 44,46 48,18"/><path d="M-48,18 L-56,30 M48,18 L56,30"/></g>`;
    const helmet = `<g fill="${INK}"><path d="M-56,16 C-56,-30 -28,-50 0,-50 C28,-50 56,-30 56,16 Z"/><rect x="-70" y="14" width="140" height="11" rx="5"/><path d="M-40,26 L-34,44 L34,44 L40,26Z" opacity="0.55"/></g>`;
    if (na > 0) s += disc(760, 400, na, clamp((t - n0) / 0.4, 0, 1), anchor, 'NAVY', BLUE);
    if (aa > 0) s += disc(1160, 400, aa, clamp((t - a0) / 0.4, 0, 1), helmet, 'ARMY', RED);
    if (aa > 0 && na > 0) {
      const k = clamp((t - a0 - 0.2) / 2.5, 0, 1);
      if (k > 0 && k < 1) {
        let d = 'M860,400';
        for (let i = 1; i <= 8; i++) d += ` L${860 + i * 25},${400 + (i % 2 ? -1 : 1) * (10 + 14 * Math.abs(Math.sin(t * 31 + i * 2.3)))}`;
        s += `<path d="${d}" fill="none" stroke="#f2b02a" stroke-width="5" stroke-linejoin="bevel" opacity="${(Math.abs(Math.sin(t * 23)) * 0.9 * (1 - k * 0.3)).toFixed(3)}" filter="url(#drop)"/>`;
      }
    }
    return s;
  }

  function chinaCluster(t) {
    const c0 = A('V10', 'locked') - 0.4, near = A('V10', 'china') - 0.2, off = A('V11', 'decision');
    const a = win(t, c0, off, 0.3, 0.6);
    if (a <= 0) return '';
    let s = '';
    for (let i = 0; i < 30; i++) {
      const ll = [104 + (i % 6) * 3.0 + ((i * 7) % 3) * 0.6, 37 - Math.floor(i / 6) * 3.0 - (i % 2) * 0.8];
      const q = proj(ll);
      s += unit(q[0], q[1], { s: 0.72, op: a * sstep(c0 + i * 0.04, c0 + i * 0.04 + 0.2, t) });
    }
    s += placeLabel([112, 22.5], 'Tied down in China', c0 + 0.6, { until: off, dy: 0, font: 'FellItalic', size: 30, ls: 1 });
    [[131, -6], [136, -5], [141, -6]].forEach((ll, i) => { const q = proj(ll); s += unit(q[0], q[1], { s: 0.72, op: a * sstep(near + i * 0.15, near + i * 0.15 + 0.2, t) }); });
    return s;
  }

  function verdict(t) {
    const v0 = A('V18', 'verdict') + 0.2, st = A('V18', 'stuck') - 0.05, off = TL.marks.slam2 + 0.1;
    const a = win(t, v0, off, 0.3, 0.4);
    if (a <= 0) return '';
    const u = easeOutBack(clamp((t - v0) / 0.45, 0, 1));
    let s = `<g opacity="${a.toFixed(3)}" transform="translate(${CX} ${CY + 220}) scale(${(0.7 + 0.3 * u).toFixed(3)})">
      <rect x="-380" y="-90" width="760" height="180" fill="rgba(244,236,214,0.96)" stroke="${INK}" stroke-width="3" filter="url(#drop)"/>
      <rect x="-366" y="-76" width="732" height="152" fill="none" stroke="${INK}" stroke-width="1.2"/>
      <text x="-330" y="22" font-family="Elite" font-size="58" fill="${INK}">SCENARIO 1:</text></g>`;
    if (t > st) s += `<g opacity="${a.toFixed(3)}">${stamp(CX + 200, CY + 220, 'STUCK', st, { size: 78, rot: -6 })}</g>`;
    return s;
  }

  function treaty(t, sg, op) {
    const x = 1560, y = 790;
    const pen = clamp((t - sg) / 1.1, 0, 1);
    const sig = 'M-70,40 C-60,20 -50,55 -38,34 C-30,22 -22,48 -10,36 C0,26 6,44 18,34 C28,26 36,44 52,30 C60,24 66,36 74,32';
    const L = 240;
    const tip = [lerp(-70, 74, pen), 36 + 8 * Math.sin(pen * 20)];
    return `<g opacity="${op.toFixed(3)}" transform="translate(${x} ${y}) rotate(-3)">
      <rect x="-110" y="-120" width="220" height="210" fill="#f2e8cf" stroke="${INK}" stroke-width="1.8" filter="url(#drop)"/>
      ${[0, 1, 2, 3, 4, 5].map((r) => `<rect x="-86" y="${-96 + r * 18}" width="${r === 5 ? 90 : 172}" height="5" fill="#6d5c45" opacity="0.55"/>`).join('')}
      <circle cx="70" cy="58" r="16" fill="#9b2a20" opacity="0.85"/>
      <path d="${sig}" fill="none" stroke="#1b2f5a" stroke-width="3" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${(L * (1 - pen)).toFixed(1)}"/>
      ${pen > 0 && pen < 1 ? `<g transform="translate(${tip[0]} ${tip[1]}) rotate(35)"><rect x="-4" y="-70" width="8" height="66" rx="3" fill="#2a2018"/><path d="M-4,-4 L4,-4 L0,6Z" fill="#c9a24a"/></g>` : ''}
    </g>`;
  }

  function splitOpen(t) {
    const sp = A('V34', 'one'), cl = A('V34', 'follow');
    return win(t, sp, cl + 0.6, 0.8, 0.8);
  }

  function endTitle(t) {
    const t0 = TL.marks.endScreen;
    const a = sstep(t0, t0 + 0.6, t);
    if (a <= 0) return '';
    const size = 104, txt = 'IF AUSTRALIA…';
    const w = tw(txt, 'Playfair', size, 8);
    const u = easeOutBack(clamp((t - t0) / 0.6, 0, 1));
    return `<g opacity="${a.toFixed(3)}" transform="translate(${CX} 250) scale(${(0.85 + 0.15 * u).toFixed(3)})">
      <rect x="${(-w / 2 - 56).toFixed(1)}" y="-100" width="${(w + 112).toFixed(1)}" height="182" fill="rgba(244,236,214,0.9)" stroke="${INK}" stroke-width="3" filter="url(#drop)"/>
      <rect x="${(-w / 2 - 42).toFixed(1)}" y="-86" width="${(w + 84).toFixed(1)}" height="154" fill="none" stroke="${INK}" stroke-width="1.2"/>
      <text x="0" y="${size * 0.32}" text-anchor="middle" font-family="Playfair" font-weight="900" font-size="${size}" letter-spacing="8" fill="${INK}">${txt}</text>
      <rect x="${(-w / 2).toFixed(1)}" y="52" width="${w.toFixed(1)}" height="6" fill="${RED}"/></g>`;
  }

  // ------------------------------------------------------------------ frame
  let fx, paper;
  window.renderFrame = function (t) {
    NOW = t;
    CAM = camAt(t);
    const g = {
      night: G.night(t), desat: G.desat(t), paleAus: G.paleAus(t), dimAus: G.dimAus(t), iso: G.iso(t),
      brightAus: G.brightAus(t), warm: G.warm(t),
    };
    // V34 split: left = alternate 1942 (grim), right = modern (warm)
    const so = TL ? splitOpen(t) : 0;
    if (so > 0.001) {
      const z = CAM.z;
      CAMB = { u: CAM.u - (W / 4) / z, v: CAM.v, z };
      const camL = { u: CAM.u + (W / 4) / z, v: CAM.v, z };
      const camR = CAMB;
      // blend camera offsets in as the split opens
      const mix = easeInOutCubic(so);
      const cL = { u: lerp(CAM.u, camL.u, mix), v: CAM.v, z }, cR = { u: lerp(CAM.u, camR.u, mix), v: CAM.v, z };
      updateMap(maps.mapA, cL, { ...g, warm: g.warm * (1 - so), desat: Math.max(g.desat, 0.75 * so) });
      updateMap(maps.mapB, cR, g);
      maps.mapA.div.style.clipPath = `inset(0 ${(W - CX * 1).toFixed(0)}px 0 0)`;
      maps.mapA.div.style.clipPath = `inset(0 ${(CX * so).toFixed(1)}px 0 0)`;
      maps.mapB.div.style.display = '';
      CAM = cL;
      CAMB = cR;
    } else {
      CAMB = null;
      updateMap(maps.mapA, CAM, g);
      maps.mapA.div.style.clipPath = '';
      maps.mapB.div.style.display = 'none';
    }
    fx.innerHTML = DEFS + overlays(t);
  };

  async function boot() {
    const [tl, layers] = await Promise.all([fetch('/ep/timeline.json').then((r) => r.json()), fetch('/ep/assets/layers.json').then((r) => r.json())]);
    TL = tl; LAYERS = layers;
    await new Promise((res, rej) => { const s = document.createElement('script'); s.src = '/ep/assets/geo.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    GEO = window.GEO;
    // optional archive still (only if a documented free-licence file is present)
    window.__curtin = await fetch('/ep/archive/curtin.jpg', { method: 'HEAD' }).then((r) => r.ok).catch(() => false);
    buildMap('mapB');
    buildMap('mapA');
    root.appendChild(maps.mapA.div); // mapA above mapB
    fx = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    fx.setAttribute('id', 'fx'); fx.setAttribute('width', W); fx.setAttribute('height', H); fx.setAttribute('viewBox', `0 0 ${W} ${H}`);
    root.appendChild(fx);
    paper = document.createElement('img');
    paper.id = 'paper'; paper.src = '/ep/assets/paper.jpg';
    root.appendChild(paper);
    setup();
    await document.fonts.ready;
    await Promise.all(['Fell', 'FellItalic', 'Elite', 'Oswald', 'Playfair', 'Stamp', 'Baskerville'].map((f) => document.fonts.load(`40px ${f}`)));
    await Promise.all(Object.values(LAYERS).map((L) => { const im = new Image(); im.src = '/ep/assets/' + L.file; return im.decode().catch(() => {}); }));
    await new Promise((r) => { if (paper.complete) r(); else paper.onload = r; });
  }

  window.EPISODE = { fps: 30 };
  window.EPISODE_READY = boot().then(() => { window.EPISODE.duration = TL.duration; window.renderFrame(0); });
})();
