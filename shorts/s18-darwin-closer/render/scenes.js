/* s18 Darwin Closer — MAP EXPLAINER (kinetic cartography).
 * SVG + renderFrame(t) + Playwright + ffmpeg. No Remotion.
 *
 * Layers (see frame.html):
 *   #plane  — the map itself: a 3D-tilted SVG plane (CSS perspective) holding the
 *             satellite/topo basemaps, parchment fills, white-glow borders and the
 *             self-drawing routes. Camera = centre (map units) + zoom + tilt.
 *   #fx     — grade: haze, vignette, danger tint, flashes.
 *   #photos — brief credibility inserts (persistent <image>s so they never flash).
 *   #ui     — upright graphics projected from the plane: pins, 3D labels, km
 *             callouts, chips, ladder, aircraft, bars, captions.
 * Map units: X = lon * K, Y = -lat (K = cos 20°). Pearl Harbor is wrapped to +360.
 * Timing is from Whisper word timings of the held Atlas VO (transcript.json).
 */
(function () {
  const HS = window.HS;
  const { clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic, smoothstep } = HS;
  const G = window.S18GEO;
  const K = G.K;
  const W = 1080;
  const H = 1920;
  const OX = 540;
  const OY = 1010; // tilt pivot on screen
  const PERSP = 2000;
  const PW = 1800;
  const PH = 3400;
  const CAP_Y = 1344; // ~70% caption band
  const DUR = 45.336;

  const GOLD = '#ffc933';
  const CYAN = '#3fe4ff';
  const RED = '#ff3b2f';
  const NAVY = '#0a1c2e';

  const P = {};
  for (const k in G.places) P[k] = [G.places[k][0] * K, -G.places[k][1]];
  const ll = (lon, lat) => [lon * K, -lat];

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const win = (t, a, b) => t >= a && t <= b;
  const ramp = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const fadeIO = (t, a, b, fi = 0.25, fo = 0.3) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b));
  const fmt = (n) => Math.round(n).toLocaleString('en-AU');

  // ---------------------------------------------------------------- projection
  function toPlane(X, Y, c) {
    return [(X - c.x) * c.z, (Y - c.y) * c.z];
  }
  function toScreen(X, Y, c) {
    const [px, py] = toPlane(X, Y, c);
    const a = (c.tilt * Math.PI) / 180;
    const s = PERSP / (PERSP - py * Math.sin(a));
    return [OX + px * s, OY + py * Math.cos(a) * s, s];
  }

  function fitCam(pts, box, tilt) {
    let cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
    let cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    let z = 20;
    for (let i = 0; i < 40; i++) {
      const c = { x: cx, y: cy, z, tilt };
      const sp = pts.map((p) => toScreen(p[0], p[1], c));
      const xs = sp.map((p) => p[0]);
      const ys = sp.map((p) => p[1]);
      const bw = Math.max(1, Math.max(...xs) - Math.min(...xs));
      const bh = Math.max(1, Math.max(...ys) - Math.min(...ys));
      const r = Math.min((box[1] - box[0]) / bw, (box[3] - box[2]) / bh);
      z *= Math.pow(r, 0.6);
      const mx = (Math.max(...xs) + Math.min(...xs)) / 2;
      const my = (Math.max(...ys) + Math.min(...ys)) / 2;
      cx += (mx - (box[0] + box[1]) / 2) / z * 0.7;
      cy += (my - (box[2] + box[3]) / 2) / (z * Math.cos((tilt * Math.PI) / 180)) * 0.7;
    }
    return { x: cx, y: cy, z, tilt };
  }

  // ---------------------------------------------------------------- camera track
  const AUS_BOX = [ll(113.5, -21.8), ll(153.6, -28.2), ll(131.0, -11.2), ll(146.5, -39.0), ll(142.5, -10.7)];
  const shot = {
    hook: fitCam([P.jakarta, P.moresby, P.canberra, P.darwin], [50, 1030, 620, 1190], 22),
    tease: { x: 128.4 * K, y: 11.2, z: 58, tilt: 24 },
    darwinIn: { x: 130.88 * K, y: 12.42, z: 330, tilt: 30 },
    darwinIn2: { x: 130.98 * K, y: 12.55, z: 250, tilt: 28 },
    topEnd: { x: 133.4 * K, y: 17.6, z: 40, tilt: 22 },
    arcStart: { x: 134.0 * K, y: 19.0, z: 32, tilt: 20 },
    canberra: fitCam([P.darwin, P.canberra], [200, 860, 560, 1080], 22),
    dili: fitCam([P.darwin, P.dili], [220, 760, 650, 1060], 26),
    moresby: fitCam([P.darwin, P.moresby], [170, 870, 680, 1080], 24),
    wide: fitCam([P.jakarta, P.moresby, P.canberra, P.darwin, P.dili], [60, 1020, 640, 1190], 22),
    danger: { x: 129.6 * K, y: 11.9, z: 72, tilt: 26 },
    danger2: { x: 129.9 * K, y: 12.0, z: 84, tilt: 28 },
    raidA: { x: 128.9 * K, y: 11.0, z: 56, tilt: 26 },
    raidB: { x: 130.2 * K, y: 11.9, z: 110, tilt: 28 },
    raidC: { x: 130.86 * K, y: 12.46, z: 250, tilt: 30 },
    pacific: fitCam([P.darwin, P.pearl], [170, 860, 700, 1120], 16),
    aus: fitCam(AUS_BOX, [60, 1020, 470, 1180], 24),
  };
  const zm = (s, m, dx = 0, dy = 0) => ({ x: s.x + dx, y: s.y + dy, z: s.z * m, tilt: s.tilt });
  const KF = [
    [0.0, shot.hook],
    [4.3, zm(shot.hook, 1.16, 1.2, -1.4)],
    [7.45, shot.tease],
    [8.05, shot.darwinIn],
    [8.75, shot.darwinIn2],
    [9.95, shot.topEnd],
    [10.6, shot.arcStart],
    [12.9, shot.canberra],
    [13.75, zm(shot.canberra, 1.05, -0.4, -0.3)],
    [14.55, shot.dili],
    [17.0, zm(shot.dili, 1.07, 0.2, 0)],
    [18.0, shot.moresby],
    [20.3, zm(shot.moresby, 1.05, 0.3, 0)],
    [21.4, shot.wide],
    [22.95, zm(shot.wide, 1.04, 0.3, -0.3)],
    [24.5, shot.danger],
    [26.6, shot.danger2],
    [27.5, shot.raidA],
    [29.7, shot.raidB],
    [31.45, shot.raidC],
    [32.95, shot.pacific],
    [36.2, zm(shot.pacific, 1.05, -1.0, 0.5)],
    [40.2, zm(shot.pacific, 1.1, -2.0, 1.0)],
    [41.7, shot.aus],
    [44.25, zm(shot.aus, 1.05, 0.1, -0.2)],
    [45.15, shot.hook],
    [DUR + 0.3, zm(shot.hook, 1.012, 0.02, -0.03)],
  ].map(([t, s]) => ({ t, v: [s.x, s.y, Math.log(s.z), s.tilt] }));

  // Monotone cubic (Fritsch–Carlson) per channel: continuous velocity, no overshoot.
  const TAN = (function () {
    const n = KF.length;
    const out = KF.map(() => [0, 0, 0, 0]);
    for (let j = 0; j < 4; j++) {
      const d = [];
      for (let i = 0; i < n - 1; i++) d.push((KF[i + 1].v[j] - KF[i].v[j]) / (KF[i + 1].t - KF[i].t));
      for (let i = 0; i < n; i++) {
        if (i === 0 || i === n - 1) { out[i][j] = 0; continue; }
        const a = d[i - 1];
        const b = d[i];
        if (a * b <= 0) { out[i][j] = 0; continue; }
        const h0 = KF[i].t - KF[i - 1].t;
        const h1 = KF[i + 1].t - KF[i].t;
        const w1 = 2 * h1 + h0;
        const w2 = h1 + 2 * h0;
        out[i][j] = (w1 + w2) / (w1 / a + w2 / b);
      }
    }
    return out;
  })();

  function camAt(t) {
    t = clamp(t, 0, KF[KF.length - 1].t);
    let i = 0;
    while (i < KF.length - 2 && t > KF[i + 1].t) i++;
    const a = KF[i];
    const b = KF[i + 1];
    const h = b.t - a.t;
    const u = (t - a.t) / h;
    const ma = TAN[i];
    const mb = TAN[i + 1];
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1;
    const h10 = u ** 3 - 2 * u ** 2 + u;
    const h01 = -2 * u ** 3 + 3 * u ** 2;
    const h11 = u ** 3 - u ** 2;
    const v = a.v.map((av, j) => h00 * av + h10 * h * ma[j] + h01 * b.v[j] + h11 * h * mb[j]);
    // living-map drift so the frame is never static
    const dz = Math.exp(v[2]);
    return {
      x: v[0] + (Math.sin(t * 0.7) * 6) / dz,
      y: v[1] + (Math.cos(t * 0.53) * 5) / dz,
      z: dz,
      tilt: v[3],
    };
  }

  // ---------------------------------------------------------------- arcs
  function arcCurve(A, B, bow) {
    const mx = (A[0] + B[0]) / 2;
    const my = (A[1] + B[1]) / 2;
    const dx = B[0] - A[0];
    const dy = B[1] - A[1];
    const cx = mx - dy * bow;
    const cy = my + dx * bow;
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const u = i / 80;
      pts.push([
        (1 - u) * (1 - u) * A[0] + 2 * (1 - u) * u * cx + u * u * B[0],
        (1 - u) * (1 - u) * A[1] + 2 * (1 - u) * u * cy + u * u * B[1],
      ]);
    }
    return pts;
  }
  function partial(pts, p) {
    if (p <= 0) return [pts[0]];
    const f = p * (pts.length - 1);
    const i = Math.floor(f);
    const out = pts.slice(0, i + 1);
    if (i < pts.length - 1) {
      const a = pts[i];
      const b = pts[i + 1];
      const r = f - i;
      out.push([lerp(a[0], b[0], r), lerp(a[1], b[1], r)]);
    }
    return out;
  }
  const ARCS = {
    canberra: arcCurve(P.darwin, P.canberra, -0.16),
    dili: arcCurve(P.darwin, P.dili, 0.22),
    moresby: arcCurve(P.darwin, P.moresby, -0.2),
    jakarta: arcCurve(P.darwin, P.jakarta, -0.14),
    pearl: arcCurve(P.pearl, P.darwin, -0.2),
  };

  // ---------------------------------------------------------------- DOM
  let el = {};
  async function init() {
    const plane = document.getElementById('plane');
    plane.style.left = OX - PW / 2 + 'px';
    plane.style.top = OY - PH / 2 + 'px';
    plane.style.width = PW + 'px';
    plane.style.height = PH + 'px';
    const stage = document.getElementById('mapwrap');
    stage.style.perspective = PERSP + 'px';
    stage.style.perspectiveOrigin = `${OX}px ${OY}px`;
    const L = G.layers;
    const img = (k) => {
      const l = L[k];
      return `<image id="L_${k}" href="${l.src}" x="${l.lon0 * K}" y="${-l.lat0}" width="${(l.lon1 - l.lon0) * K}" height="${l.lat0 - l.lat1}" preserveAspectRatio="none"/>`;
    };
    plane.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}" viewBox="${-PW / 2} ${-PH / 2} ${PW} ${PH}" style="overflow:visible">
        <defs>
          <pattern id="parch" patternUnits="userSpaceOnUse" width="6" height="6"><image href="assets/parchment.jpg" width="6" height="6" preserveAspectRatio="none"/></pattern>
          <filter id="pxGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>
          <filter id="pxShadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
          <g id="mapdefs"></g>
        </defs>
        <g id="mb">
          <rect x="${-PW}" y="${-PH}" width="${PW * 2}" height="${PH * 2}" fill="#06213a"/>
          <g id="camg">${img('topo')}${img('timor')}${img('vdg')}<g id="fills"></g></g>
          <g id="arcs"></g>
        </g>
      </svg>`;
    el = {
      plane,
      camg: document.getElementById('camg'),
      mb: document.getElementById('mb'),
      fills: document.getElementById('fills'),
      arcs: document.getElementById('arcs'),
      mapdefs: document.getElementById('mapdefs'),
      Lt: document.getElementById('L_timor'),
      Lv: document.getElementById('L_vdg'),
      fx: document.getElementById('fx'),
      ui: document.getElementById('ui'),
      photos: document.getElementById('photos'),
    };
    // persistent photo inserts
    el.photos.innerHTML = `
      <defs>
        <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="18" stdDeviation="16" flood-opacity="0.55"/></filter>
        <clipPath id="clipA"><rect x="-300" y="-205" width="600" height="410" rx="6"/></clipPath>
        <clipPath id="clipB"><rect x="-260" y="-185" width="520" height="370" rx="6"/></clipPath>
      </defs>
      ${photoCard('cardA', '../images/s18_11_darwin_raid_preston.jpg', 600, 410, 'clipA', 'DARWIN HARBOUR · 1942')}
      ${photoCard('cardB', '../images/s18_14_pearl_arizona.jpg', 520, 370, 'clipB', 'PEARL HARBOR')}`;
    el.cardA = document.getElementById('cardA');
    el.cardB = document.getElementById('cardB');
    const urls = [L.topo.src, L.timor.src, L.vdg.src, 'assets/parchment.jpg', '../images/s18_11_darwin_raid_preston.jpg', '../images/s18_14_pearl_arizona.jpg'];
    await Promise.all(
      urls.map((u) => {
        const im = new Image();
        im.src = u;
        return im.decode().catch(() => {});
      })
    );
  }

  function photoCard(id, href, w, h, clip, caption) {
    return `
      <g id="${id}" opacity="0" filter="url(#cardShadow)">
        <rect x="${-w / 2 - 16}" y="${-h / 2 - 16}" width="${w + 32}" height="${h + 88}" rx="10" fill="#f4ecdc"/>
        <g clip-path="url(#${clip})"><image href="${href}" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" style="filter:sepia(0.25) contrast(1.08)"/></g>
        <text x="0" y="${h / 2 + 50}" text-anchor="middle" font-size="30" font-weight="800" fill="#2a2016" letter-spacing="3">${caption}</text>
      </g>`;
  }

  // ---------------------------------------------------------------- UI helpers
  function label3D(text, x, y, size, o = {}) {
    const k = o.k != null ? o.k : 1;
    if (k <= 0) return '';
    const face = o.face || '#ffffff';
    const ext = o.ext || NAVY;
    const depth = o.depth != null ? o.depth : Math.max(3, Math.round(size * 0.09));
    const anchor = o.anchor || 'middle';
    const ls = o.ls != null ? o.ls : size * 0.04;
    const pop = o.pop != null ? o.pop : easeOutBack(clamp(k, 0, 1));
    const d = Math.round(depth * clamp(k * 1.4, 0, 1));
    let s = '';
    for (let i = d; i >= 1; i--) {
      s += `<text x="${i * 0.7}" y="${i}" text-anchor="${anchor}" font-size="${size}" font-weight="900" letter-spacing="${ls}" fill="${ext}" stroke="${ext}" stroke-width="${size * 0.1}" stroke-linejoin="round">${esc(text)}</text>`;
    }
    s += `<text x="0" y="0" text-anchor="${anchor}" font-size="${size}" font-weight="900" letter-spacing="${ls}" fill="${face}" stroke="${ext}" stroke-width="${size * 0.1}" stroke-linejoin="round" paint-order="stroke">${esc(text)}</text>`;
    s += `<text x="0" y="0" text-anchor="${anchor}" font-size="${size}" font-weight="900" letter-spacing="${ls}" fill="url(#faceSheen)" opacity="0.55">${esc(text)}</text>`;
    return `<g transform="translate(${x} ${y}) scale(${pop})" opacity="${clamp(k * 3, 0, 1) * (o.alpha != null ? o.alpha : 1)}" filter="url(#dropS)">${s}</g>`;
  }

  function pill(text, x, y, o = {}) {
    const size = o.size || 40;
    const w = o.w || text.length * size * 0.66 + 56;
    const col = o.col || GOLD;
    const k = o.k != null ? o.k : 1;
    if (k <= 0) return '';
    const sc = easeOutBack(clamp(k, 0, 1));
    return `<g transform="translate(${x} ${y}) scale(${sc})" opacity="${clamp(k * 3, 0, 1)}" filter="url(#dropS)">
      <rect x="${-w / 2}" y="${-size * 0.95}" width="${w}" height="${size * 1.9}" rx="${size * 0.95}" fill="rgba(6,16,28,0.9)" stroke="${col}" stroke-width="4"/>
      <text x="0" y="${size * 0.36}" text-anchor="middle" font-size="${size}" font-weight="900" fill="#fff" letter-spacing="1.5">${esc(text)}</text>
    </g>`;
  }

  function avoidBand(y, half = 50) {
    const top = CAP_Y - 115 - half;
    const bot = CAP_Y + 105 + half;
    if (y > top && y < bot) return y - top < bot - y ? top : bot;
    return y;
  }

  // Pins: ground shadow + pulse rings + upright marker.
  function pin(kind, X, Y, c, k, t) {
    if (k <= 0) return '';
    const [x, y, s0] = toScreen(X, Y, c);
    const s = clamp(s0, 0.75, 1.3);
    const drop = easeOutBack(clamp(k, 0, 1));
    const lift = (1 - clamp(k * 1.3, 0, 1)) * 160;
    const ct = Math.cos((c.tilt * Math.PI) / 180);
    let g = '';
    const ringCol = kind === 'darwin' ? RED : kind === 'aus' ? GOLD : CYAN;
    for (let r = 0; r < 2; r++) {
      const ph = ((t * 0.9 + r * 0.5) % 1);
      g += `<ellipse cx="${x}" cy="${y}" rx="${(18 + ph * 70) * s}" ry="${(18 + ph * 70) * s * ct}" fill="none" stroke="${ringCol}" stroke-width="${4 * (1 - ph)}" opacity="${(1 - ph) * 0.9 * clamp(k, 0, 1)}"/>`;
    }
    g += `<ellipse cx="${x}" cy="${y + 2}" rx="${16 * s}" ry="${7 * s}" fill="rgba(0,0,0,0.45)" opacity="${clamp(k, 0, 1)}"/>`;
    const py = y - lift;
    if (kind === 'darwin') {
      g += `<g transform="translate(${x} ${py}) scale(${s * drop})" filter="url(#dropS)">
        <path d="M0,0 C-10,-22 -34,-40 -34,-66 A34,34 0 1 1 34,-66 C34,-40 10,-22 0,0 Z" fill="${RED}" stroke="#fff" stroke-width="6"/>
        <path d="M-20,-78 A24,24 0 0 1 14,-92" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="6" stroke-linecap="round"/>
        <circle cx="0" cy="-66" r="13" fill="#fff"/>
      </g>`;
    } else {
      const col = kind === 'aus' ? GOLD : CYAN;
      g += `<g transform="translate(${x} ${py - 24 * s}) scale(${s * drop})" filter="url(#dropS)">
        <line x1="0" y1="0" x2="0" y2="24" stroke="#fff" stroke-width="5"/>
        <circle r="23" fill="${col}" stroke="#fff" stroke-width="6"/>
        <path d="${starPath(12, 5.2)}" fill="${NAVY}"/>
      </g>`;
    }
    return g;
  }
  function starPath(R, r) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(2) + ',' + (Math.sin(a) * rr).toFixed(2);
    }
    return d + 'Z';
  }

  function plane(x, y, ang, sc, col) {
    return `<g transform="translate(${x} ${y}) rotate(${ang}) scale(${sc})">
      <path d="M16,0 L6,-2.4 L-1,-15 L-4.5,-15 L-1,-2.4 L-10,-2 L-14,-7 L-16.5,-7 L-14,0 L-16.5,7 L-14,7 L-10,2 L-1,2.4 L-4.5,15 L-1,15 L6,2.4 Z" fill="${col}" stroke="${col === '#000' ? 'none' : 'rgba(255,215,200,0.9)'}" stroke-width="1.1" stroke-linejoin="round"/>
    </g>`;
  }

  const _mc = {};
  let _ctx = null;
  function measure(text, size, weight) {
    const key = weight + '|' + size + '|' + text;
    if (_mc[key] != null) return _mc[key];
    if (!_ctx) _ctx = document.createElement('canvas').getContext('2d');
    _ctx.font = `${weight} ${size}px Mont`;
    return (_mc[key] = _ctx.measureText(text).width + text.length * size * 0.04);
  }

  // ---------------------------------------------------------------- captions
  const CAPS = [];
  function buildCaps(words) {
    let cur = [];
    const flush = () => {
      if (cur.length) CAPS.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
      cur = [];
    };
    for (const w of words) {
      cur.push(w);
      const len = cur.map((x) => x.word).join(' ').length;
      if (/[.,?!:]$/.test(w.word) || cur.length >= 3 || len > 16) flush();
    }
    flush();
    for (let i = 0; i < CAPS.length; i++) {
      const nx = CAPS[i + 1];
      CAPS[i].hide = nx ? Math.min(nx.start, CAPS[i].end + 0.45) : CAPS[i].end + 0.5;
    }
  }
  function captions(t) {
    const c = CAPS.find((g) => t >= g.start - 0.04 && t < g.hide);
    if (!c) return '';
    const k = clamp((t - c.start + 0.04) / 0.16, 0, 1);
    const sc = 0.82 + 0.18 * easeOutBack(k);
    const size = 70;
    const ws = c.words.map((w) => w.word.toUpperCase());
    const widths = ws.map((w) => measure(w, size, 900));
    const gap = 22;
    const total = widths.reduce((a, b) => a + b, 0) + gap * (ws.length - 1);
    let x = W / 2 - total / 2;
    let s = '';
    ws.forEach((w, i) => {
      const on = t >= c.words[i].start - 0.02;
      const col = on ? (t < c.words[i].end + 0.05 ? GOLD : '#ffffff') : 'rgba(255,255,255,0.55)';
      s += `<text x="${x + widths[i] / 2}" y="0" text-anchor="middle" font-size="${size}" font-weight="900" fill="${col}" stroke="#05080d" stroke-width="16" stroke-linejoin="round" paint-order="stroke">${esc(w)}</text>`;
      x += widths[i] + gap;
    });
    const fitS = Math.min(1, 980 / total);
    return `<g transform="translate(540 ${CAP_Y + 24}) scale(${sc * fitS}) translate(-540 0)" filter="url(#capShadow)">${s}</g>`;
  }

  // ---------------------------------------------------------------- map fills (map units)
  function fillsSvg(t, c) {
    const z = c.z;
    el.mapdefs.innerHTML = `
      <filter id="mGlow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${(7 / z).toFixed(4)}"/></filter>
      <filter id="mGlowBig" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${(16 / z).toFixed(4)}"/></filter>`;
    const Pth = G.paths;
    const nsc = 'vector-effect="non-scaling-stroke"';
    const glowShape = (d, a, o = {}) => {
      if (a <= 0.01) return '';
      const fill = o.fill
        ? o.blend
          ? `<path d="${d}" fill="${o.fill}" opacity="${a * (o.fillA || 0.5)}" style="mix-blend-mode:${o.blend}"/>`
          : `<path d="${d}" fill="${o.fill}" opacity="${a * 0.5}"/><path d="${d}" fill="${o.fill}" opacity="${a * 0.9}" style="mix-blend-mode:overlay"/>
             <path d="${d}" fill="none" stroke="#5a3a17" stroke-width="10" ${nsc} opacity="${a * 0.45}" filter="url(#mGlow)"/>`
        : '';
      return `${fill}
        <path d="${d}" fill="none" stroke="#fff" stroke-width="${o.gw || 14}" ${nsc} opacity="${a * 0.85}" filter="url(#mGlow)" stroke-linejoin="round"/>
        <path d="${d}" fill="none" stroke="#fff" stroke-width="${o.w || 3.5}" ${nsc} opacity="${a}" stroke-linejoin="round"/>`;
    };
    let s = '';
    const ausPath = z > 120 ? Pth.ausFine : Pth.aus;
    // Base Australia coastline glow (always, stronger in the wide finale)
    const ausA = 0.55 + 0.45 * fadeIO(t, 40.9, 44.6, 0.8, 0.5);
    s += glowShape(ausPath, ausA, { w: 3, gw: 16 });
    // Finale: parchment Australia sweep
    const fin = fadeIO(t, 41.0, 44.7, 1.0, 0.5);
    if (fin > 0) s += `<path d="${Pth.aus}" fill="url(#parch)" opacity="${fin * 0.55}" style="mix-blend-mode:multiply"/>`;
    // NT parchment (Top of Australia)
    const ntA = fadeIO(t, 8.8, 13.2, 0.6, 0.8) + 0.0;
    s += glowShape(Pth.nt, ntA, { fill: 'url(#parch)', fillA: 0.8, gw: 12, w: 3 });
    // Danger: NT smoulders red 1942 → raid
    const dA = fadeIO(t, 23.4, 31.6, 0.8, 0.6);
    if (dA > 0) {
      const pulse = 0.6 + 0.4 * Math.sin(t * 5);
      s += `<path d="${ausPath}" fill="${RED}" opacity="${dA * 0.28 * pulse}" style="mix-blend-mode:screen"/>`;
      s += `<path d="${ausPath}" fill="none" stroke="${RED}" stroke-width="18" ${nsc} opacity="${dA * 0.8}" filter="url(#mGlowBig)"/>`;
    }
    // ACT
    s += glowShape(Pth.act, fadeIO(t, 12.3, 23.2, 0.4, 0.6), { fill: GOLD, fillA: 0.9, blend: 'normal', gw: 10, w: 2.5 });
    // Timor-Leste, PNG, Java — parchment + glow as each capital lights
    s += glowShape(Pth.tls, fadeIO(t, 14.2, 23.2, 0.5, 0.6), { fill: 'url(#parch)', fillA: 0.85, gw: 12, w: 3 });
    s += glowShape(Pth.png, fadeIO(t, 17.6, 23.2, 0.5, 0.6), { fill: 'url(#parch)', fillA: 0.8, gw: 12, w: 3 });
    s += glowShape(Pth.java, fadeIO(t, 20.8, 23.2, 0.4, 0.6), { fill: 'url(#parch)', fillA: 0.8, gw: 12, w: 3 });
    // Hawaii (Pearl Harbor compare)
    s += glowShape(Pth.hawaii, fadeIO(t, 33.0, 40.6, 0.5, 0.5), { fill: 'url(#parch)', fillA: 0.8, gw: 12, w: 3 });
    el.fills.innerHTML = s;
  }

  // ---------------------------------------------------------------- routes (plane px)
  function route(pts, c, p, col, o = {}) {
    if (p <= 0) return '';
    const pp = partial(pts, clamp(p, 0, 1)).map((q) => toPlane(q[0], q[1], c));
    const d = 'M' + pp.map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('L');
    const a = o.alpha != null ? o.alpha : 1;
    const w = o.w || 11;
    const dash = o.dash ? `stroke-dasharray="${o.dash}"` : '';
    let s = `<g opacity="${a}">
      <path d="${d}" transform="translate(6 12)" fill="none" stroke="rgba(0,0,0,0.55)" stroke-width="${w + 4}" stroke-linecap="round" filter="url(#pxShadow)"/>
      <path d="${d}" fill="none" stroke="#fff" stroke-width="${w + 14}" stroke-linecap="round" opacity="0.75" filter="url(#pxGlow)"/>
      <path d="${d}" fill="none" stroke="#fff" stroke-width="${w + 6}" stroke-linecap="round" stroke-linejoin="round" ${dash}/>
      <path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${dash}/>
      <path d="${d}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="${w * 0.28}" stroke-linecap="round" transform="translate(-1 -2)" ${dash}/>`;
    if (p < 1 && !o.noHead) {
      const h = pp[pp.length - 1];
      s += `<circle cx="${h[0]}" cy="${h[1]}" r="${w * 2.4}" fill="${col}" opacity="0.35" filter="url(#pxGlow)"/>
        <circle cx="${h[0]}" cy="${h[1]}" r="${w * 0.95}" fill="#fff" stroke="${col}" stroke-width="5"/>`;
    }
    return s + '</g>';
  }
  function headScreen(pts, p, c) {
    const q = partial(pts, clamp(p, 0.001, 1));
    const h = q[q.length - 1];
    return toScreen(h[0], h[1], c);
  }

  // ---------------------------------------------------------------- distance legs
  const LEGS = [
    { key: 'canberra', col: GOLD, draw: [10.55, 12.5], val: 3100, final: 'OVER 3,100 KM', end: 24.0, tickTo: 12.5, place: 'aus' },
    { key: 'dili', col: CYAN, draw: [14.15, 15.75], val: 700, final: '~700 KM', end: 17.8, tickTo: 16.3 },
    { key: 'moresby', col: CYAN, draw: [17.65, 19.2], val: 1800, final: '~1,800 KM', end: 20.9, tickTo: 19.6 },
    { key: 'jakarta', col: CYAN, draw: [20.8, 21.9], val: 2700, final: '~2,700 KM', end: 24.0, tickTo: 22.0 },
  ];

  // ---------------------------------------------------------------- aircraft (raid)
  const RAID = [];
  (function buildRaid() {
    const origins = [ll(126.2, -8.6), ll(127.6, -7.9), ll(125.7, -10.4), ll(129.0, -8.2), ll(126.3, -11.9)];
    const targets = [ll(130.84, -12.46), ll(130.88, -12.43), ll(130.9, -12.49), ll(130.81, -12.44), ll(130.95, -12.42)];
    origins.forEach((o, i) => RAID.push({ pts: arcCurve(o, targets[i], (i % 2 ? 1 : -1) * 0.12), delay: i * 0.18 }));
  })();

  // ---------------------------------------------------------------- frame
  function renderFrame(t) {
    const c = camAt(t);
    // motion speed for whip blur
    const c2 = camAt(t + 1 / 30);
    const [sx0, sy0] = toScreen(c.x, c.y, c2);
    const speed = Math.hypot(sx0 - OX, sy0 - OY) + Math.abs(Math.log(c2.z / c.z)) * 900;
    const blur = clamp((speed - 45) / 9, 0, 6);

    el.plane.style.transform = `rotateX(${c.tilt.toFixed(3)}deg)`;
    el.camg.setAttribute('transform', `translate(${(-c.x * c.z).toFixed(2)} ${(-c.y * c.z).toFixed(2)}) scale(${c.z.toFixed(4)})`);
    el.Lt.setAttribute('opacity', smoothstep(24, 50, c.z).toFixed(3));
    el.Lv.setAttribute('opacity', smoothstep(100, 190, c.z).toFixed(3));
    fillsSvg(t, c);
    el.mapdefs.innerHTML += blur > 0.3 ? `<filter id="mbF" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${blur.toFixed(2)}"/></filter>` : '';
    el.mb.setAttribute('filter', blur > 0.3 ? 'url(#mbF)' : '');

    // ---------- routes on the plane
    let arcs = '';
    const legOut = fadeIO(t, 0, 24.0, 0.01, 1.0);
    for (const L of LEGS) {
      const p = easeInOutCubic(ramp(t, L.draw[0], L.draw[1]));
      if (p <= 0) continue;
      let alpha = legOut;
      // the Canberra route dims while foreign legs play, then returns for the compare
      if (L.key === 'canberra') alpha *= 1 - 0.55 * fadeIO(t, 13.9, 21.9, 0.4, 0.5);
      arcs += route(ARCS[L.key], c, p, L.col, { alpha, w: L.key === 'canberra' ? 12 : 10 });
    }
    // hook teaser links (dashed, faint)
    const hookLinks = fadeIO(t, 2.5, 7.2, 0.5, 1.0);
    if (hookLinks > 0) {
      const ks = [['dili', 2.5], ['moresby', 2.7], ['jakarta', 2.9], ['canberra', 3.9]];
      for (const [k, t0] of ks) {
        const p = easeOutCubic(ramp(t, t0, t0 + 0.7));
        arcs += route(ARCS[k], c, p, k === 'canberra' ? GOLD : CYAN, { alpha: hookLinks * 0.7, w: 5, dash: '2 14', noHead: true });
      }
    }
    // raid approach trails
    const raidA = fadeIO(t, 27.4, 31.9, 0.4, 0.5);
    if (raidA > 0) {
      for (const r of RAID) {
        const p = easeInOutCubic(ramp(t, 27.6 + r.delay, 30.8 + r.delay * 0.4));
        arcs += route(r.pts, c, p, RED, { alpha: raidA * 0.85, w: 4, dash: '10 12', noHead: true });
      }
    }
    // same commander link
    const pa = easeInOutCubic(ramp(t, 32.5, 34.4));
    if (pa > 0) arcs += route(ARCS.pearl, c, pa, RED, { alpha: fadeIO(t, 32.5, 40.6, 0.1, 0.5), w: 9, dash: '26 16' });
    el.arcs.innerHTML = arcs;

    // ---------- grade / fx
    const danger = fadeIO(t, 23.3, 31.7, 0.6, 0.5);
    const flash =
      0.55 * Math.max(0, 1 - Math.abs(t - 8.02) / 0.12) +
      0.42 * Math.max(0, 1 - Math.abs(t - 30.95) / 0.14) +
      0.35 * Math.max(0, 1 - Math.abs(t - 23.44) / 0.1) +
      0.5 * Math.max(0, 1 - Math.abs(t - 45.02) / 0.12);
    el.fx.innerHTML = `
      <defs>
        <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0b1a2c" stop-opacity="0.92"/>
          <stop offset="0.16" stop-color="#16324c" stop-opacity="0.45"/>
          <stop offset="0.34" stop-color="#16324c" stop-opacity="0"/>
          <stop offset="0.86" stop-color="#000" stop-opacity="0"/>
          <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
        </linearGradient>
        <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
          <stop offset="1" stop-color="#000" stop-opacity="0.6"/>
        </radialGradient>
        <radialGradient id="dvig" cx="0.5" cy="0.5" r="0.72">
          <stop offset="0.4" stop-color="#3a0000" stop-opacity="0"/>
          <stop offset="1" stop-color="#5a0600" stop-opacity="0.75"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#haze)"/>
      <rect width="${W}" height="${H}" fill="url(#vig)"/>
      ${danger > 0 ? `<rect width="${W}" height="${H}" fill="#2a0806" opacity="${danger * 0.28}" style="mix-blend-mode:multiply"/><rect width="${W}" height="${H}" fill="url(#dvig)" opacity="${danger}"/>` : ''}
      <rect width="${W}" height="${H}" fill="#fff" opacity="${clamp(flash, 0, 1)}"/>`;

    // ---------- photos
    const cardA = fadeIO(t, 29.85, 31.35, 0.22, 0.25);
    const kA = easeOutBack(ramp(t, 29.85, 30.2));
    el.cardA.setAttribute('opacity', cardA.toFixed(3));
    el.cardA.setAttribute('transform', `translate(${540 + (1 - kA) * -400 + (t - 29.85) * 14} 520) rotate(${-4 + (1 - kA) * -10}) scale(${0.96 + (t - 29.85) * 0.03})`);
    const cardB = fadeIO(t, 34.0, 35.45, 0.22, 0.25);
    const kB = easeOutBack(ramp(t, 34.0, 34.35));
    el.cardB.setAttribute('opacity', cardB.toFixed(3));
    el.cardB.setAttribute('transform', `translate(${310 + (1 - kB) * -380 + (t - 34) * 12} 330) rotate(${3 + (1 - kB) * 10}) scale(${0.96 + (t - 34) * 0.03})`);

    // ---------- UI
    let u = `<defs>
      <filter id="dropS" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#000" flood-opacity="0.55"/></filter>
      <filter id="capShadow" x="-10%" y="-40%" width="120%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity="0.7"/></filter>
      <linearGradient id="faceSheen" x1="0" y1="-1" x2="0" y2="0.2" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#ffe7a8"/></linearGradient>
      <radialGradient id="boom"><stop offset="0" stop-color="#fff6d0"/><stop offset="0.35" stop-color="#ffb53a"/><stop offset="0.7" stop-color="#ff4a1c" stop-opacity="0.7"/><stop offset="1" stop-color="#ff2a00" stop-opacity="0"/></radialGradient>
    </defs>`;

    // pins
    const endFade = 1 - ramp(t, 44.3, 44.9); // clear the board for the loop
    const dk = t < 44.3 ? 1 : 1; // Darwin pin always on (hook + loop)
    u += pin('darwin', P.darwin[0], P.darwin[1], c, dk, t);
    const capK = (t0, t1) => (t < t0 ? 0 : ramp(t, t0, t0 + 0.4)) * endFade * (t1 ? 1 - ramp(t, t1, t1 + 0.4) : 1);
    u += pin('aus', P.canberra[0], P.canberra[1], c, capK(3.9), t);
    u += pin('cap', P.dili[0], P.dili[1], c, capK(2.45), t);
    u += pin('cap', P.moresby[0], P.moresby[1], c, capK(2.65), t);
    u += pin('cap', P.jakarta[0], P.jakarta[1], c, capK(2.85), t);
    u += pin('cap', P.pearl[0], P.pearl[1], c, capK(33.6, 40.6), t);

    // place labels (upright, 3D)
    const lab = (key, text, t0, t1, size, o = {}) => {
      const k = t < t0 ? 0 : ramp(t, t0, t0 + 0.35) * (t1 ? 1 - ramp(t, t1, t1 + 0.35) : 1);
      if (k <= 0) return '';
      const [x, y] = toScreen(P[key][0], P[key][1], c);
      if (x < -40 || x > W + 40 || y < 60 || y > H - 120) return '';
      let lx = x + (o.dx || 0);
      let ly = avoidBand(y + (o.dy || -80), size * 0.6);
      const tw = measure(text, size, 900) * 1.04;
      if (o.anchor === 'end') lx = clamp(lx, 50 + tw, 1000);
      else if (o.anchor === 'start') lx = clamp(lx, 50, 1000 - tw);
      else lx = clamp(lx, 50 + tw / 2, 1010 - tw / 2);
      ly = clamp(ly, 150, 1700);
      let s = label3D(text, lx, ly, size, { k, anchor: o.anchor, face: o.face });
      if (o.sub) s += label3D(o.sub, lx + (o.subDx || 0), ly + size * 0.62, size * 0.46, { k: clamp(k * 1.2 - 0.2, 0, 1), anchor: o.anchor, face: '#ffe29a', depth: 3 });
      return s;
    };
    // DARWIN hero label appears on the spoken "Darwin" and stays through the distance legs
    u += lab('darwin', 'DARWIN', 8.0, 10.35, 96, { dy: -120 });
    u += lab('darwin', 'DARWIN', 10.35, 20.55, 58, { dy: -100 });
    u += lab('darwin', 'DARWIN', 30.9, 36.6, 64, { dy: -110 });
    u += lab('darwin', 'DARWIN', 36.6, 40.5, 56, { dy: 95 });
    u += lab('darwin', 'DARWIN', 40.5, 44.3, 64, { dy: -110 });
    u += lab('canberra', 'CANBERRA', 12.35, 13.75, 64, { dy: 90, sub: 'ACT' });
    u += lab('canberra', 'CANBERRA', 22.2, 23.6, 64, { dy: 90, sub: 'ACT' });
    u += lab('dili', 'DILI', 14.1, 17.5, 64, { dy: -86, sub: 'TIMOR-LESTE' });
    u += lab('moresby', 'PORT MORESBY', 17.6, 20.55, 52, { dy: -86, anchor: 'end', dx: 40, sub: 'PAPUA NEW GUINEA', subDx: 0 });
    u += lab('jakarta', 'JAKARTA', 21.0, 23.6, 56, { dy: 95, dx: -10, anchor: 'start', sub: 'INDONESIA' });
    u += lab('pearl', 'PEARL HARBOR', 33.76, 36.6, 54, { dy: -86, anchor: 'end', dx: 10 });
    u += lab('pearl', 'PEARL HARBOR', 36.6, 40.6, 48, { dy: 95, anchor: 'end', dx: 30 });

    // km callouts following route heads
    for (const L of LEGS) {
      if (t < L.draw[0] || t > L.end - 0.1) continue;
      const pr = ramp(t, L.draw[0], L.draw[1]);
      const pe = easeInOutCubic(pr);
      const [hx, hy] = headScreen(ARCS[L.key], Math.max(pe, 0.02), c);
      const [mx, my] = headScreen(ARCS[L.key], 0.55, c);
      const settle = easeInOutCubic(ramp(t, L.draw[1], L.draw[1] + 0.45));
      const valT = easeOutCubic(ramp(t, L.draw[0], L.tickTo));
      const done = t >= L.tickTo;
      const txt = done ? L.final : fmt(Math.round((L.val * valT) / 10) * 10) + ' KM';
      let x = lerp(hx + 20, mx, settle);
      let y = lerp(hy - 70, my - 60, settle);
      y = avoidBand(y, 40);
      x = clamp(x, 200, 860);
      const k = ramp(t, L.draw[0] + 0.25, L.draw[0] + 0.5) * (1 - ramp(t, Math.min(23.3, L.end - 0.4), Math.min(23.7, L.end)));
      const dimmed = L.key === 'canberra' ? 1 - fadeIO(t, 13.7, 21.95, 0.3, 0.4) : 1;
      if (dimmed <= 0.01) continue;
      const pulse = done ? 1 + 0.08 * Math.max(0, 1 - (t - L.tickTo) / 0.25) : 1;
      u += `<g opacity="${dimmed}" transform="translate(${x} ${y}) scale(${pulse}) translate(${-x} ${-y})">${pill(txt, x, y, { k, col: L.col, size: L.key === 'canberra' ? 46 : 40 })}</g>`;
    }

    // ---------- hook title (frame 1 + loop re-entry)
    const hookK = t < 2.6 ? 1 - ramp(t, 2.05, 2.5) : ramp(t, 44.95, 45.2);
    if (hookK > 0) {
      const inLoop = t > 44;
      const sc = inLoop ? 1 + (1 - easeOutBack(ramp(t, 44.95, 45.2))) * 0.6 : 1 + 0.03 * Math.sin(t * 3);
      const yOff = t < 2.6 ? -ramp(t, 2.05, 2.5) * 120 : 0;
      u += `<g transform="translate(540 ${400 + yOff}) scale(${sc}) translate(-540 ${-400})" opacity="${hookK}">
        ${label3D('CLOSER THAN', 540, 330, 78, { depth: 6, pop: 1 })}
        ${label3D('CANBERRA', 540, 480, 150, { face: GOLD, depth: 12, pop: 1 })}
      </g>`;
    }

    // ---------- distance ladder (compare)
    const ladK = fadeIO(t, 20.75, 23.4, 0.3, 0.35);
    if (ladK > 0) {
      const rows = [
        ['DILI', 700, CYAN, 20.8],
        ['PORT MORESBY', 1800, CYAN, 20.95],
        ['JAKARTA', 2700, CYAN, 21.1],
        ['CANBERRA', 3100, GOLD, 22.28],
      ];
      let g = `<rect x="70" y="150" width="940" height="${rows.length * 86 + 40}" rx="26" fill="rgba(5,14,24,0.82)" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>`;
      rows.forEach(([name, km, col, t0], i) => {
        const k = ramp(t, t0, t0 + 0.35);
        if (k <= 0) return;
        const y = 210 + i * 86;
        const bw = 400 * (km / 3100) * easeOutCubic(k);
        const hi = name === 'JAKARTA' ? fadeIO(t, 21.7, 23.4, 0.2, 0.3) : 0;
        g += `<g opacity="${clamp(k * 2, 0, 1)}">
          <text x="100" y="${y + 13}" font-size="34" font-weight="900" fill="#fff" letter-spacing="1">${name}</text>
          <rect x="400" y="${y - 16}" width="${Math.max(bw, 2)}" height="32" rx="16" fill="${col}"/>
          ${hi > 0 ? `<rect x="394" y="${y - 22}" width="${bw + 12}" height="44" rx="22" fill="none" stroke="#fff" stroke-width="4" opacity="${hi}"/>` : ''}
          <text x="${412 + bw}" y="${y + 12}" font-size="32" font-weight="800" fill="${col}">${name === 'CANBERRA' ? '3,100+' : '~' + fmt(km)}</text>
        </g>`;
      });
      u += `<g opacity="${ladK}" transform="translate(0 ${(1 - easeOutCubic(ramp(t, 20.75, 21.1))) * -60})" filter="url(#dropS)">${g}</g>`;
    }

    // ---------- 1942 / date / 188 chips
    if (win(t, 23.35, 31.9)) {
      const k42 = ramp(t, 23.4, 23.62);
      const toDate = ramp(t, 27.02, 27.14);
      const out = 1 - ramp(t, 31.5, 31.85);
      if (toDate < 1) u += label3D('1942', 540, 360, 190, { k: k42 * (1 - toDate) * out, face: '#ffe1d6', ext: '#3a0a06', depth: 14 });
      if (toDate > 0) u += label3D('19 FEB 1942', 540, 320, 104, { k: toDate * out, face: '#ffffff', ext: '#3a0a06', depth: 9 });
      const k188 = ramp(t, 28.5, 28.8) * out;
      if (k188 > 0) {
        const n = Math.round(188 * easeOutCubic(ramp(t, 28.5, 29.2)));
        u += `<g opacity="${clamp(k188 * 2, 0, 1)}" transform="translate(540 455) scale(${easeOutBack(k188)})" filter="url(#dropS)">
          <rect x="-190" y="-54" width="380" height="108" rx="54" fill="rgba(40,6,4,0.9)" stroke="${RED}" stroke-width="5"/>
          ${plane(-110, 0, -90, 2.2, '#ffd9cf')}
          <text x="40" y="26" text-anchor="middle" font-size="76" font-weight="900" fill="#fff">${n}</text>
        </g>`;
      }
    }

    // ---------- aircraft formations
    if (win(t, 27.5, 31.4)) {
      for (const r of RAID) {
        const base = ramp(t, 27.6 + r.delay, 30.8 + r.delay * 0.4);
        for (let j = 0; j < 5; j++) {
          const p = easeInOutCubic(clamp(base, 0, 1));
          if (p <= 0.01 || p >= 0.995) continue;
          const q = partial(r.pts, p);
          const a = q[q.length - 1];
          const b = q[Math.max(0, q.length - 3)];
          const [x0, y0, s] = toScreen(a[0], a[1], c);
          const [bx, by] = toScreen(b[0], b[1], c);
          const ang = (Math.atan2(y0 - by, x0 - bx) * 180) / Math.PI;
          // V formation laid out in screen space around the path point
          const side = j === 0 ? 0 : j % 2 ? 1 : -1;
          const rank = Math.ceil(j / 2);
          const ar = (ang * Math.PI) / 180;
          const back = rank * 34 * s;
          const lat = side * rank * 40 * s;
          const x = x0 - Math.cos(ar) * back - Math.sin(ar) * lat;
          const y = y0 - Math.sin(ar) * back + Math.cos(ar) * lat;
          const sc = clamp(1.7 + c.z / 150, 1.7, 3.0) * s;
          const fade = 1 - ramp(p, 0.9, 0.99);
          u += `<g opacity="${fade}"><g transform="translate(10 22)" opacity="0.35">${plane(x, y, ang, sc, '#000')}</g>${plane(x, y, ang, sc, '#20242b')}</g>`;
        }
      }
    }
    // bursts over Darwin harbour
    if (win(t, 30.3, 32.2)) {
      const seeds = [[0.0, 0.0], [0.05, -0.03], [-0.04, 0.02], [0.02, 0.05], [-0.06, -0.04], [0.07, 0.03], [-0.02, -0.07], [0.04, -0.06]];
      seeds.forEach(([dx, dy], i) => {
        const t0 = 30.35 + i * 0.13;
        const k = ramp(t, t0, t0 + 0.7);
        if (k <= 0 || k >= 1) return;
        const [x, y, s] = toScreen(P.darwin[0] + dx * K, P.darwin[1] + dy, c);
        const r = (20 + 110 * easeOutCubic(k)) * s;
        u += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#boom)" opacity="${1 - k}"/>
          <circle cx="${x}" cy="${y}" r="${r * 1.3}" fill="none" stroke="#fff3c4" stroke-width="${6 * (1 - k)}" opacity="${(1 - k) * 0.8}"/>`;
      });
    }

    // ---------- danger rings from Darwin (1942)
    if (win(t, 23.5, 27.2)) {
      const [x, y, s] = toScreen(P.darwin[0], P.darwin[1], c);
      const ct = Math.cos((c.tilt * Math.PI) / 180);
      for (let r = 0; r < 3; r++) {
        const ph = ((t - 23.5) * 0.7 + r / 3) % 1;
        const R = (60 + ph * 520) * s;
        u += `<ellipse cx="${x}" cy="${y}" rx="${R}" ry="${R * ct}" fill="none" stroke="${RED}" stroke-width="${6 * (1 - ph)}" opacity="${(1 - ph) * 0.8 * fadeIO(t, 23.5, 27.2, 0.3, 0.4)}"/>`;
      }
    }

    // ---------- SAME COMMANDER + 10 WEEKS
    if (win(t, 32.6, 36.4)) {
      const [ax, ay] = headScreen(ARCS.pearl, 0.5, c);
      const k = ramp(t, 32.62, 32.95) * (1 - ramp(t, 36.0, 36.35));
      u += label3D('SAME COMMANDER', clamp(ax - 30, 330, 700), avoidBand(ay - 70, 50), 60, { k, face: '#ffd9cf', ext: '#3a0a06', depth: 7 });
      const kw = ramp(t, 34.72, 34.95) * (1 - ramp(t, 36.0, 36.35));
      if (kw > 0) u += pill('10 WEEKS', clamp(ax - 30, 330, 700), avoidBand(ay + 30, 40), { k: kw, col: RED, size: 38 });
    }

    // ---------- bomb-count compare columns (soft: "by many accounts")
    if (win(t, 36.9, 40.9)) {
      const out = 1 - ramp(t, 40.4, 40.85);
      const cols = [
        ['darwin', 330, 37.7, RED],
        ['pearl', 250, 39.45, '#8fa7bf'],
      ];
      for (const [key, hMax, t0, col] of cols) {
        const k = easeOutCubic(ramp(t, t0, t0 + 0.7)) * out;
        if (k <= 0) continue;
        const [x, y] = toScreen(P[key][0], P[key][1], c);
        const bx = clamp(x, 140, 900);
        const by = y - 60;
        const h = hMax * k;
        u += `<g filter="url(#dropS)" opacity="${clamp(k * 3, 0, 1)}">
          <path d="M${bx - 44},${by} L${bx + 44},${by} L${bx + 64},${by - 16} L${bx + 64},${by - 16 - h} L${bx + 44},${by - h} L${bx - 44},${by - h} Z" fill="rgba(0,0,0,0.35)"/>
          <rect x="${bx - 44}" y="${by - h}" width="88" height="${h}" fill="${col}"/>
          <path d="M${bx + 44},${by} L${bx + 64},${by - 16} L${bx + 64},${by - 16 - h} L${bx + 44},${by - h} Z" fill="rgba(0,0,0,0.35)"/>
          <path d="M${bx - 44},${by - h} L${bx + 44},${by - h} L${bx + 64},${by - 16 - h} L${bx - 24},${by - 16 - h} Z" fill="rgba(255,255,255,0.45)"/>`;
        const nb = Math.floor(h / 36);
        for (let i = 0; i < nb; i++) u += bomb(bx, by - 22 - i * 36, 0.9);
        // falling bomb into the column
        const fall = ((t - t0) * 2.4) % 1;
        if (k < out * 0.999) u += bomb(bx, by - h - 160 + fall * 150, 1, 1 - fall);
        u += '</g>';
      }
      const kn = ramp(t, 37.0, 37.4) * out;
      if (kn > 0) u += `<g opacity="${kn}" filter="url(#dropS)"><rect x="300" y="178" width="480" height="64" rx="32" fill="rgba(5,14,24,0.85)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>${bomb(350, 210, 1.1)}<text x="560" y="222" text-anchor="middle" font-size="32" font-weight="800" fill="#fff" letter-spacing="2">BOMBS DROPPED*</text></g>
        <text x="540" y="276" text-anchor="middle" font-size="26" font-weight="700" fill="rgba(255,255,255,0.85)" opacity="${kn}" filter="url(#dropS)">*by many accounts</text>`;
    }

    // ---------- finale medallion
    if (win(t, 41.9, 44.8)) {
      const k = ramp(t, 42.0, 42.35) * (1 - ramp(t, 44.3, 44.7));
      const [x, y] = toScreen(P.darwin[0], P.darwin[1], c);
      const mx = clamp(x + 250, 170, 800);
      const my = avoidBand(y - 250, 90);
      const sc = easeOutBack(clamp(k, 0, 1));
      u += `<g transform="translate(${mx} ${my}) scale(${sc}) rotate(${(1 - k) * -30})" opacity="${clamp(k * 3, 0, 1)}" filter="url(#dropS)">
        <circle r="112" fill="${RED}" stroke="#fff" stroke-width="8"/>
        <circle r="92" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="3" stroke-dasharray="6 8"/>
        <text y="12" text-anchor="middle" font-size="84" font-weight="900" fill="#fff" stroke="#5a0600" stroke-width="6" paint-order="stroke">No.1</text>
        <text y="58" text-anchor="middle" font-size="22" font-weight="900" fill="#fff" letter-spacing="2">FOREIGN ATTACK</text>
        <text y="-58" text-anchor="middle" font-size="24" font-weight="900" fill="#ffe29a" letter-spacing="3">1942</text>
      </g>
      <line x1="${mx - 80}" y1="${my + 80}" x2="${x + 20}" y2="${y - 80}" stroke="#fff" stroke-width="4" stroke-dasharray="4 8" opacity="${k}"/>`;
      // shockwave rings from Darwin
      const ct = Math.cos((c.tilt * Math.PI) / 180);
      for (let r = 0; r < 2; r++) {
        const ph = ((t - 41.9) * 0.8 + r / 2) % 1;
        const R = 40 + ph * 300;
        u += `<ellipse cx="${x}" cy="${y}" rx="${R}" ry="${R * ct}" fill="none" stroke="${GOLD}" stroke-width="${5 * (1 - ph)}" opacity="${(1 - ph) * k}"/>`;
      }
    }

    u += captions(t);
    el.ui.innerHTML = u;
  }

  function bomb(x, y, s, a = 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})" opacity="${a}">
      <ellipse rx="9" ry="15" fill="#1d2127" stroke="#fff" stroke-width="2"/>
      <path d="M-8,-12 L-10,-22 L10,-22 L8,-12 Z" fill="#1d2127" stroke="#fff" stroke-width="2"/>
    </g>`;
  }

  window.EPISODE = { duration: DUR, fps: 30, words: [], scenes: [] };
  window.S18 = {
    init: async () => {
      await init();
      buildCaps(window.EPISODE.words);
    },
    camAt,
    toScreen,
  };
  window.renderFrame = renderFrame;
})();
