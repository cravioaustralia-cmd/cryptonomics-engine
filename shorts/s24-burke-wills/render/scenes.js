/* s24 Burke & Wills — MAP EXPLAINER (kinetic cartography)
 * SVG + renderFrame(t) + Playwright + ffmpeg. No Remotion.
 *
 * Every beat is anchored to a phrase in transcript.json, so the same file
 * drives the held back-half VO (starts "On the way back") and the full script
 * (starts "In 1860"). When the transcript has no "In 1860", beats 1–7 collapse
 * into a 1.4 s route-recap prologue under the frame-1 NINE HOURS hook.
 *
 * Layers (persistent DOM so photos never flash between frames):
 *   cam  : graded NASA topo (Mercator, georeferenced) + map-space vectors
 *   grade: dusk / grief colour states, vignette, grain
 *   scr  : screen-space pins, 3D labels, callouts, icons
 *   cards: brief photo inserts (persistent <image>)
 *   hud  : hook, captions (~70%), whip flash
 */
(function () {
  const HS = window.HS;
  const { W, H, clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic, smoothstep } = HS;
  const TAU = Math.PI * 2;

  /* ---------------- projection (fit on s24_12 coastline: Byron, SE Cape, Dirk Hartog, Cape York) ---------------- */
  const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  const KX = 44.26;
  const X0 = 1877 - 153.64 * KX;
  const KY = -2535.93;
  const Y0 = 882 - KY * merc(-28.64);
  const P = (lon, lat) => [X0 + lon * KX, Y0 + KY * merc(lat)];
  const MAP_W = 1920;
  const MAP_H = 1794;

  /* ---------------- places ---------------- */
  const LL = {
    melb: [144.95, -37.78],
    firstNight: [144.9, -37.72],
    swanHill: [143.55, -35.34],
    balranald: [143.56, -34.64],
    menindee: [142.42, -32.39],
    torowotto: [142.05, -30.05],
    cooper: [141.08, -27.62], // Camp 65 / Dig Tree
    gulf: [140.8, -17.72], // Camp 119 / Little Bynoe, below the mangroves
    gray: [141.35, -26.95],
    innamincka: [140.74, -27.75],
    burke: [140.8, -27.72],
    wills: [140.46, -27.82],
    king: [140.66, -27.77],
  };
  const PT = {};
  for (const k in LL) PT[k] = P(LL[k][0], LL[k][1]);

  const OUT_WP = [
    LL.melb, LL.firstNight, [144.6, -37.0], [144.1, -36.2], LL.swanHill, LL.balranald, [143.0, -33.5],
    LL.menindee, LL.torowotto, [141.7, -28.9], [141.3, -28.1], LL.cooper,
    [140.95, -26.3], [140.6, -24.7], [140.25, -23.1], [140.35, -21.6], [140.55, -20.3], [140.75, -19.0], LL.gulf,
  ];
  const OUT_IDX = { melb: 0, firstNight: 1, menindee: 7, cooper: 11, gulf: 18 };
  const RET_WP = [
    LL.gulf, [140.9, -18.9], [140.7, -20.2], [140.5, -21.6], [140.45, -23.1], [140.75, -24.7], [141.15, -26.1],
    LL.gray, [141.2, -27.35], LL.cooper,
  ];
  const RET_IDX = { gulf: 0, gray: 7, cooper: 9 };

  // straight-line reference for the km ruler (haversine ≈ 1,100 km Cooper → Gulf)
  const KM_COOPER_GULF = '~1,100 KM';

  // state borders (lon/lat) — drawn faint, glow on activation
  const BORDERS = [
    [[129, -14.9], [129, -31.7]],
    [[129, -26], [141, -26]],
    [[138, -16.1], [138, -26]],
    [[141, -26], [141, -38.06]],
    [[141, -29], [148.95, -29], [150.0, -28.6], [151.0, -28.9], [152.0, -28.75], [153.0, -28.3], [153.55, -28.17]],
    [[141, -34.1], [142.16, -34.19], [142.77, -34.58], [143.55, -35.34], [144.75, -36.13], [145.57, -35.81],
      [146.39, -35.99], [146.92, -36.08], [147.6, -36.2], [148.2, -36.8], [149.98, -37.5]],
  ];
  const COOPER_CREEK = [[142.45, -26.45], [142.1, -27.0], [141.7, -27.33], [141.35, -27.55], [141.08, -27.62],
    [140.9, -27.7], [140.74, -27.75], [140.52, -27.8], [140.2, -27.92], [139.85, -28.1], [139.5, -28.3]];
  const GULF_COAST = [[139.9, -17.42], [140.2, -17.46], [140.5, -17.52], [140.84, -17.49], [141.1, -17.35], [141.35, -17.12]];

  /* ---------------- geometry helpers ---------------- */
  function catmull(points, seg = 14) {
    const out = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      for (let s = 0; s < seg; s++) {
        const t = s / seg;
        const t2 = t * t;
        const t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    out.push(points[points.length - 1]);
    return out;
  }
  function makeRoute(wp, seg = 14) {
    const pts = catmull(wp.map((q) => P(q[0], q[1])), seg);
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, cum, len: cum[cum.length - 1], seg, wpDist: (i) => cum[Math.min(pts.length - 1, Math.round(i * seg))] };
  }
  function routeAt(r, d) {
    d = clamp(d, 0, r.len);
    let lo = 0;
    let hi = r.cum.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (r.cum[m] <= d) lo = m;
      else hi = m;
    }
    const segLen = r.cum[hi] - r.cum[lo] || 1;
    const u = (d - r.cum[lo]) / segLen;
    const a = r.pts[lo];
    const b = r.pts[hi];
    return { p: [lerp(a[0], b[0], u), lerp(a[1], b[1], u)], i: lo, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  }
  function routePath(r, d0, d1) {
    if (d1 <= d0 + 0.01) return '';
    const s = routeAt(r, d0);
    const e = routeAt(r, d1);
    let str = `M${s.p[0].toFixed(2)} ${s.p[1].toFixed(2)}`;
    for (let i = s.i + 1; i <= e.i; i++) str += `L${r.pts[i][0].toFixed(2)} ${r.pts[i][1].toFixed(2)}`;
    str += `L${e.p[0].toFixed(2)} ${e.p[1].toFixed(2)}`;
    return str;
  }
  const polyPath = (ll) => ll.map((q, i) => { const p = P(q[0], q[1]); return `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`; }).join('');

  const OUT = makeRoute(OUT_WP);
  const RET = makeRoute(RET_WP);
  const CREEK = makeRoute(COOPER_CREEK, 10);

  /* ---------------- transcript anchors ---------------- */
  const norm = (s) => String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']/g, '');
  let WORDS = [];
  let NW = [];
  function find(phrase, nth = 0) {
    const toks = phrase.split(/\s+/).map(norm);
    let hit = -1;
    for (let i = 0; i + toks.length <= NW.length; i++) {
      let ok = true;
      for (let k = 0; k < toks.length; k++) if (NW[i + k] !== toks[k]) { ok = false; break; }
      if (ok) { if (nth === 0) { hit = i; break; } nth--; }
    }
    if (hit < 0) return null;
    return { s: WORDS[hit].start, e: WORDS[hit + toks.length - 1].end };
  }

  /* ---------------- timeline (built once words are loaded) ---------------- */
  let T = null;
  function buildTimeline() {
    const ep = window.EPISODE;
    WORDS = ep.words || [];
    NW = WORDS.map((w) => norm(w.word));
    const D = ep.duration;
    const F = find('in 1860');
    const A = (ph, n = 0, fb = null) => { const r = find(ph, n); return r ? r.s : fb; };
    const Ae = (ph, n = 0, fb = null) => { const r = find(ph, n); return r ? r.e : fb; };
    const t = { full: !!F, D };
    if (t.full) {
      t.hookNine = A('nine hours', 0, 3);
      t.leader = A('their leader');
      t.irish = A('irish police');
      t.noExp = A('no exploring');
      t.leave = A('they leave melbourne');
      t.camels = A('with camels');
      t.tonnes = A('20 tonnes', 0, A('about 20'));
      t.oak = A('oak table');
      t.wagon = A('but one wagon');
      t.park = A('leave the park');
      t.firstNight = A('by the first night');
      t.edge = A('edge of melbourne');
      t.dump = A('so burke starts');
      t.menindee = A('at menindee');
      t.mostGear = A('most of the gear');
      t.cooperArr = A('at cooper creek');
      t.desert = A('middle of the desert');
      t.split = A('splits the team');
      t.four = A('he tells four');
      t.threeMonths = A('three months');
      t.north = A('races north');
      t.nWills = A('wills king and gray');
      t.nKing = t.nWills != null ? t.nWills + 0.45 : null;
      t.nGray = t.nWills != null ? t.nWills + 0.9 : null;
      { const r = find('wills king and gray'); if (r) { const i = WORDS.findIndex((w) => w.start === r.s); t.nKing = WORDS[i + 1].start; t.nGray = WORDS[i + 3].start; } }
      t.twoMonths = A('after nearly two');
      t.gulfArr = A('gulf of carpentaria');
      t.mangrove = A('thick mangrove');
      t.ocean = A('the ocean');
    } else {
      // prologue recap over the frame-1 hook
      t.hookNine = 0;
    }
    t.back = A('on the way back', 0, 0);
    t.food = A('food runs out', 0, t.back + 1.2);
    t.killing = A('killing their camels', 0, t.back + 3);
    t.grayDies = A('gray dies', 0, t.back + 5);
    t.fourDays = A('four days', 0, t.grayDies + 0.8);
    t.menWaiting = A('the men waiting', 0, t.grayDies + 2.5);
    t.fourMonths = A('over four months', 0, t.menWaiting + 2.2);
    t.giveUp = A('then they give up', 0, t.fourMonths + 1.3);
    t.bury = A('bury food', 0, t.giveUp + 1.2);
    t.carve = A('carve a message', 0, t.bury + 1.8);
    t.dig = A('dig', 0, t.carve + 1.3);
    t.andLeave = A('and leave', 0, t.dig + 0.55);
    t.evening = A('that same evening', 0, t.andLeave + 0.8);
    const ev = find('that same evening');
    let iB = -1;
    if (ev) iB = WORDS.findIndex((w) => w.start > ev.e - 0.01 && norm(w.word) === 'burke');
    t.aBurke = iB >= 0 ? WORDS[iB].start : t.evening + 1.4;
    t.aWills = iB >= 0 ? WORDS[iB + 1].start : t.aBurke + 0.4;
    t.aKing = iB >= 0 ? WORDS[iB + 3].start : t.aBurke + 0.9;
    t.stumble = A('stumble into camp', 0, t.aKing + 0.2);
    t.missed = A('they missed', 0, t.stumble + 1.6);
    const n2 = find('nine hours', t.full ? 1 : 0);
    t.nine = n2 ? n2.s : t.missed + 0.8;
    t.nineE = n2 ? n2.e : t.nine + 0.5;
    t.weak = A('too weak', 0, t.nineE + 1);
    t.creek = A('stay by the creek', 0, t.weak + 1);
    t.bothDie = A('burke and wills both', 0, t.creek + 1.5);
    t.onlyKing = A('only king', 0, t.bothDie + 1.8);
    t.yandru = A('yandruwandha', 0, t.onlyKing + 1.8);
    t.shelter = A('feed and shelter', 0, t.yandru + 1);
    t.rescue = A('a rescue party', 0, t.shelter + 1.4);
    t.findsHim = Ae('finds him', 0, t.rescue + 1.2);
    t.loop = A("and it's why", 0, D - 3.6);
    t.how = A('story of how', 0, D - 1);
    t.howE = Ae('story of how', 0, D - 0.4);
    t.whip = Math.min(D - 0.42, t.howE - 0.1);
    // prologue recap timing (held back-half VO)
    if (!t.full) {
      t.proDraw0 = 0.12;
      t.proDraw1 = Math.max(1.0, Math.min(1.45, t.food - 0.05));
    }
    return t;
  }

  /* ---------------- camera ---------------- */
  const FOCUS = [540, 860]; // action lives above the 70% caption band
  const view = (lon, lat, z, rot = 0) => ({ c: P(lon, lat), z, rot });
  const V = {
    wide: view(134.2, -26.4, 0.56),
    east: view(142.2, -27.6, 0.86),
    melb: view(144.9, -37.55, 3.0),
    melbTight: view(144.93, -37.72, 3.8),
    menindee: view(142.6, -32.6, 1.9),
    cooper: view(141.0, -27.72, 3.6),
    cooperTight: view(140.98, -27.66, 4.5),
    gulf: view(140.75, -17.9, 3.1),
  };
  const trackOut = (z, lead = 0) => (t) => ({ c: routeAt(OUT, outDist(t) + lead).p, z });
  const trackRet = (z, lead = 0) => (t) => ({ c: routeAt(RET, retDist(t) + lead).p, z });
  const mid = (a, b, z, u = 0.5) => ({ c: [lerp(a[0], b[0], u), lerp(a[1], b[1], u)], z });

  let CAMKEYS = null;
  function camKeys() {
    const t = T;
    const k = [];
    const add = (time, v) => { if (time != null) k.push({ t: time, v }); };
    if (t.full) {
      add(0, V.wide);
      add(t.hookNine, { ...V.wide, z: 0.6 });
      add(t.leader, view(145.6, -36.8, 1.6));
      add(t.leave, V.melb);
      add(t.wagon, V.melbTight);
      add(t.firstNight, { ...V.melbTight, z: 4.1 });
      add(t.dump, trackOut(1.9, 20));
      add(t.menindee, V.menindee);
      add(t.cooperArr, trackOut(1.9, 10));
      add(t.split, V.cooper);
      add(t.north, view(141.0, -24.2, 1.35));
      add(t.twoMonths, trackOut(1.45, 30));
      add(t.gulfArr, V.gulf);
      add(t.ocean, { ...V.gulf, z: 3.5, c: P(140.8, -17.62) });
      add(t.back - 0.2, { ...V.gulf, z: 3.3 });
    } else {
      add(0, V.east);
      add(t.proDraw1 - 0.35, { ...V.east, z: 0.95 });
      add(t.proDraw1 + 0.45, { c: P(140.8, -17.95), z: 2.7 });
    }
    add(t.food + 0.3, trackRet(2.6, 25));
    add(t.grayDies, trackRet(2.8, 12));
    add(t.fourDays + 0.3, mid(PT.gray, PT.cooper, 3.2));
    add(t.menWaiting + 0.3, V.cooper);
    add(t.fourMonths, { ...V.cooper, z: 3.9 });
    add(t.giveUp, V.cooperTight);
    add(t.dig, { ...V.cooperTight, z: 5.0, c: P(141.06, -27.62) });
    add(t.andLeave + 0.3, { c: P(141.1, -27.78), z: 4.0 });
    add(t.evening + 0.2, { c: P(141.12, -27.5), z: 3.6 });
    add(t.aBurke, { c: P(141.08, -27.6), z: 4.3 });
    add(t.missed, { c: P(141.1, -27.72), z: 3.7 });
    add(t.nineE + 0.4, { c: P(141.1, -27.72), z: 3.9 });
    add(t.creek, { c: P(140.85, -27.72), z: 4.6 });
    add(t.bothDie + 0.2, { c: P(140.62, -27.76), z: 5.2 });
    add(t.onlyKing, { c: P(140.66, -27.77), z: 5.4 });
    add(t.yandru, { c: P(140.72, -27.74), z: 3.9 });
    add(t.rescue, { c: P(140.95, -28.0), z: 3.1 });
    add(t.findsHim + 0.2, { c: P(140.85, -27.9), z: 2.9 });
    add(t.loop + 0.2, V.east);
    add(t.whip, { ...V.wide, z: 0.62 });
    add(T.D + 0.01, T.full ? V.wide : V.east);
    k.sort((a, b) => a.t - b.t);
    return k;
  }
  function evalView(v, t) { return typeof v === 'function' ? v(t) : v; }
  function camera(t) {
    const k = CAMKEYS;
    let i = 0;
    while (i < k.length - 1 && k[i + 1].t <= t) i++;
    const A = k[i];
    const B = k[Math.min(k.length - 1, i + 1)];
    const va = evalView(A.v, t);
    const vb = evalView(B.v, t);
    const span = Math.max(0.001, B.t - A.t);
    // moves take at most ~1.4 s, then glide
    const moveDur = Math.min(span, 1.4);
    const u = B === A ? 0 : easeInOutCubic(clamp((t - A.t) / moveDur, 0, 1));
    // zoom interpolated in log space (feels like a real dolly)
    const z = Math.exp(lerp(Math.log(va.z), Math.log(vb.z), u));
    let cx = lerp(va.c[0], vb.c[0], u);
    let cy = lerp(va.c[1], vb.c[1], u);
    // always-moving: slow drift + creep, never static
    const creep = 1 + 0.035 * Math.sin(t * 0.31) + 0.012 * ((t - A.t) / Math.max(1, span));
    cx += (Math.sin(t * 0.43) * 7 + Math.sin(t * 0.17) * 5) / z;
    cy += (Math.cos(t * 0.37) * 6) / z;
    const rot = lerp(va.rot || 0, vb.rot || 0, u) + Math.sin(t * 0.21) * 0.6;
    return { cx, cy, z: z * creep, rot };
  }
  function toScreen(cam, p) {
    const dx = (p[0] - cam.cx) * cam.z;
    const dy = (p[1] - cam.cy) * cam.z;
    const a = (cam.rot * Math.PI) / 180;
    return [FOCUS[0] + dx * Math.cos(a) - dy * Math.sin(a), FOCUS[1] + dx * Math.sin(a) + dy * Math.cos(a)];
  }

  /* ---------------- route progress ---------------- */
  function keyed(keys, t, dist) {
    // keys: [[time, waypointIndex]] — eased per leg, steady pace feel
    if (!keys.length || t <= keys[0][0]) return dist(keys.length ? keys[0][1] : 0);
    for (let i = 0; i < keys.length - 1; i++) {
      const [ta, ia] = keys[i];
      const [tb, ib] = keys[i + 1];
      if (t < tb) {
        const u = clamp((t - ta) / Math.max(0.001, tb - ta), 0, 1);
        const e = 0.55 * u + 0.45 * easeInOutCubic(u);
        return lerp(dist(ia), dist(ib), e);
      }
    }
    return dist(keys[keys.length - 1][1]);
  }
  let OUTKEYS = null;
  let RETKEYS = null;
  function outDist(t) { return keyed(OUTKEYS, t, OUT.wpDist); }
  function retDist(t) { return keyed(RETKEYS, t, RET.wpDist); }
  function routeKeys() {
    const t = T;
    if (t.full) {
      OUTKEYS = [
        [t.leave, 0], [t.firstNight, 0], [t.edge, OUT_IDX.firstNight], [t.dump, OUT_IDX.firstNight],
        [t.menindee + 0.2, OUT_IDX.menindee], [t.mostGear, OUT_IDX.menindee], [t.cooperArr + 0.3, OUT_IDX.cooper],
        [t.north, OUT_IDX.cooper], [t.gulfArr + 0.4, OUT_IDX.gulf],
      ];
    } else {
      OUTKEYS = [[t.proDraw0, 0], [t.proDraw1, OUT_IDX.gulf]];
    }
    RETKEYS = [
      [t.back + (t.full ? 0.1 : 0.35), 0], [t.grayDies, RET_IDX.gray], [t.menWaiting, RET_IDX.gray + 0.9],
      [t.evening, RET_IDX.gray + 1.55], [t.aBurke, RET_IDX.cooper],
    ];
  }

  /* ---------------- drawing kit ---------------- */
  const FONT_D = "'Anton', 'Archivo Black', Impact, sans-serif";
  const FONT_B = "'Archivo Black', 'Inter', sans-serif";
  const FONT_I = "'Inter', 'Liberation Sans', sans-serif";
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const f2 = (v) => (+v).toFixed(2);
  const pop = (t, t0, d = 0.35) => clamp((t - t0) / d, 0, 1);
  const fadeWin = (t, a, b, fi = 0.25, fo = 0.3) => (t < a || t > b ? 0 : Math.min(clamp((t - a) / fi, 0, 1), clamp((b - t) / fo, 0, 1)));

  // bold extruded 3D label
  function label3d(text, x, y, o = {}) {
    const size = o.size || 54;
    const depth = o.depth ?? Math.max(3, Math.round(size / 11));
    const fill = o.fill || '#ffffff';
    const side = o.side || '#3a2410';
    const anchor = o.anchor || 'middle';
    const font = o.font || FONT_D;
    const ls = o.ls ?? 1.5;
    const a = o.alpha ?? 1;
    const sc = o.scale ?? 1;
    if (a <= 0.001) return '';
    let s = `<g opacity="${f2(a)}" transform="translate(${f2(x)} ${f2(y)}) rotate(${o.rot || 0}) scale(${f2(sc)})">`;
    s += `<text x="4" y="${depth + 8}" text-anchor="${anchor}" font-family="${font}" font-size="${size}" letter-spacing="${ls}" fill="rgba(0,0,0,.55)" filter="url(#soft)">${esc(text)}</text>`;
    for (let d = depth; d >= 1; d--) s += `<text x="${d * 0.6}" y="${d}" text-anchor="${anchor}" font-family="${font}" font-size="${size}" letter-spacing="${ls}" fill="${side}">${esc(text)}</text>`;
    s += `<text x="0" y="0" text-anchor="${anchor}" font-family="${font}" font-size="${size}" letter-spacing="${ls}" fill="${fill}" stroke="#120b04" stroke-width="${Math.max(2, size / 22)}" paint-order="stroke">${esc(text)}</text>`;
    return s + '</g>';
  }
  // name / fact chip (glass + accent bar)
  function chip(text, x, y, t, t0, o = {}) {
    const k = pop(t, t0, 0.32);
    if (k <= 0) return '';
    const a = (o.alpha ?? 1) * clamp(k * 1.6, 0, 1);
    const s = easeOutBack(k);
    const size = o.size || 34;
    const w = o.w || text.length * size * 0.66 + 58;
    const h = size + 30;
    const acc = o.acc || '#ffc23a';
    return `<g opacity="${f2(a)}" transform="translate(${f2(x)} ${f2(y)}) scale(${f2(s)})">
      <rect x="${-w / 2 + 5}" y="${-h / 2 + 7}" width="${w}" height="${h}" rx="12" fill="rgba(0,0,0,.45)" filter="url(#soft)"/>
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="12" fill="rgba(14,16,22,.86)" stroke="rgba(255,255,255,.85)" stroke-width="2.5"/>
      <rect x="${-w / 2}" y="${-h / 2}" width="12" height="${h}" rx="6" fill="${acc}"/>
      <text x="7" y="${size * 0.36}" text-anchor="middle" font-family="${FONT_B}" font-size="${size}" fill="#fff" letter-spacing="1">${esc(text)}</text>
    </g>`;
  }
  // map pin with drop + ripple
  function pin(x, y, t, t0, o = {}) {
    const k = pop(t, t0, 0.45);
    if (k <= 0) return '';
    const col = o.col || '#ffc23a';
    const drop = (1 - easeOutBack(k)) * -90;
    const rip = clamp((t - t0 - 0.25) / 0.9, 0, 1);
    const sc = o.scale || 1;
    let s = '';
    if (rip > 0 && rip < 1) s += `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(10 + rip * 70 * sc)}" ry="${f2(4 + rip * 26 * sc)}" fill="none" stroke="${col}" stroke-width="${f2(4 * (1 - rip))}" opacity="${f2(1 - rip)}"/>`;
    s += `<ellipse cx="${f2(x)}" cy="${f2(y + 2)}" rx="${9 * sc}" ry="${3.5 * sc}" fill="rgba(0,0,0,.5)"/>`;
    s += `<g transform="translate(${f2(x)} ${f2(y + drop)}) scale(${sc})" opacity="${f2(clamp(k * 3, 0, 1))}">
      <path d="M0 0 C-6 -14 -20 -24 -20 -40 A20 20 0 1 1 20 -40 C20 -24 6 -14 0 0Z" fill="${col}" stroke="#fff" stroke-width="4" filter="url(#glowS)"/>
      <circle cx="0" cy="-40" r="7.5" fill="#1a1206"/></g>`;
    return s;
  }
  // camel (dromedary) glyph, 100×64 box, feet at y=62
  const CAMEL = 'M10 40 C12 30 20 26 28 26 C34 13 47 11 53 22 C57 19 63 19 65 24 C70 24 73 19 75 12 C77 5 86 3 90 8 L95 11 L92 15 L86 15 C84 23 82 32 76 38 L76 62 L72 62 L71 43 L61 45 L59 62 L55 62 L54 45 L34 45 L32 62 L28 62 L27 45 L21 44 L19 62 L15 62 L14 44 C10 44 8 42 10 40Z';
  function camel(x, y, s, a, flip) {
    if (a <= 0.01) return '';
    return `<g opacity="${f2(a)}" transform="translate(${f2(x)} ${f2(y)}) scale(${flip ? -s : s} ${s}) translate(-50 -62)"><path d="${CAMEL}" fill="#f4e6c8" stroke="#1c1207" stroke-width="3.5" stroke-linejoin="round"/></g>`;
  }
  function person(x, y, s, a, col = '#f4e6c8') {
    if (a <= 0.01) return '';
    return `<g opacity="${f2(a)}" transform="translate(${f2(x)} ${f2(y)}) scale(${s})">
      <circle cx="0" cy="-44" r="9" fill="${col}" stroke="#1c1207" stroke-width="3"/>
      <path d="M-11 -31 Q0 -36 11 -31 L13 -8 L7 -8 L6 0 L-6 0 L-7 -8 L-13 -8Z" fill="${col}" stroke="#1c1207" stroke-width="3" stroke-linejoin="round"/></g>`;
  }
  function tree(x, y, s, a) {
    if (a <= 0.01) return '';
    return `<g opacity="${f2(a)}" transform="translate(${f2(x)} ${f2(y)}) scale(${s})">
      <path d="M-5 0 L-4 -30 C-12 -38 -20 -40 -26 -46 M4 0 L3 -30 C10 -40 18 -44 24 -50 M0 -28 L1 -52" stroke="#2b1a0b" stroke-width="7" fill="none" stroke-linecap="round"/>
      <g fill="#5d6b34" stroke="#20260f" stroke-width="3"><circle cx="-26" cy="-54" r="15"/><circle cx="24" cy="-58" r="16"/><circle cx="0" cy="-66" r="19"/><circle cx="-12" cy="-72" r="13"/><circle cx="13" cy="-74" r="13"/></g></g>`;
  }
  function mangrove(x, y, s, a) {
    if (a <= 0.01) return '';
    return `<g opacity="${f2(a)}" transform="translate(${f2(x)} ${f2(y)}) scale(${s})">
      <path d="M0 -18 L0 -30 M0 -20 Q-10 -12 -14 0 M0 -20 Q-4 -10 -5 0 M0 -20 Q5 -10 6 0 M0 -20 Q11 -12 15 0" stroke="#2a1d10" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <ellipse cx="0" cy="-36" rx="17" ry="11" fill="#2f5a2a" stroke="#0f220d" stroke-width="2.5"/><ellipse cx="-7" cy="-40" rx="8" ry="6" fill="#3f7536"/></g>`;
  }
  function crate(x, y, s, a) {
    if (a <= 0.01) return '';
    return `<g opacity="${f2(a)}" transform="translate(${f2(x)} ${f2(y)}) scale(${s})"><rect x="-14" y="-24" width="28" height="24" rx="2" fill="#b98545" stroke="#241507" stroke-width="3"/><path d="M-14 -12 H14 M-6 -24 V0 M6 -24 V0" stroke="#241507" stroke-width="2"/></g>`;
  }
  function wagon(x, y, s, a, broken) {
    if (a <= 0.01) return '';
    return `<g opacity="${f2(a)}" transform="translate(${f2(x)} ${f2(y)}) scale(${s})">
      <path d="M-40 -34 Q0 -64 40 -34 Z" fill="#efe2c2" stroke="#1c1207" stroke-width="3.5"/>
      <rect x="-42" y="-36" width="84" height="18" fill="#8a5a2b" stroke="#1c1207" stroke-width="3.5"/>
      <g transform="rotate(${broken ? 28 : 0} -30 -8)"><circle cx="-26" cy="-8" r="12" fill="none" stroke="#1c1207" stroke-width="5"/></g>
      <circle cx="26" cy="-8" r="12" fill="none" stroke="#1c1207" stroke-width="5"/>
      <path d="M42 -26 L${broken ? 62 : 74} ${broken ? -6 : -26}" stroke="#1c1207" stroke-width="5" stroke-linecap="round"/></g>`;
  }
  function slashX(x, y, r, k, col = '#ff3b2f') {
    if (k <= 0) return '';
    const e = easeOutCubic(k);
    return `<g transform="translate(${f2(x)} ${f2(y)})" filter="url(#glowS)"><circle r="${r}" fill="none" stroke="${col}" stroke-width="9" stroke-dasharray="${f2(TAU * r * e)} 9999" transform="rotate(-90)"/>
      <path d="M${-r * 0.7} ${-r * 0.7} L${f2(-r * 0.7 + 1.4 * r * clamp(k * 2 - 1, 0, 1))} ${f2(-r * 0.7 + 1.4 * r * clamp(k * 2 - 1, 0, 1))}" stroke="${col}" stroke-width="10" stroke-linecap="round"/></g>`;
  }
  function eye(x, y, s, a) {
    if (a <= 0.01) return '';
    return `<g opacity="${f2(a)}" transform="translate(${f2(x)} ${f2(y)}) scale(${s})"><path d="M-34 0 Q0 -28 34 0 Q0 28 -34 0Z" fill="#eaf4ff" stroke="#0b1320" stroke-width="4"/><circle r="11" fill="#1d4b6b" stroke="#0b1320" stroke-width="3"/><circle r="4" fill="#0b1320"/></g>`;
  }
  // circular timer ring
  function ring(x, y, r, frac, o = {}) {
    const col = o.col || '#ffc23a';
    const a = o.alpha ?? 1;
    if (a <= 0.01) return '';
    let s = `<g opacity="${f2(a)}" transform="translate(${f2(x)} ${f2(y)})">`;
    s += `<circle r="${r + 14}" fill="rgba(10,12,18,.78)" stroke="rgba(255,255,255,.9)" stroke-width="3"/>`;
    s += `<circle r="${r}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="12"/>`;
    s += `<circle r="${r}" fill="none" stroke="${col}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${f2(TAU * r * clamp(frac, 0, 1))} 9999" transform="rotate(-90)" filter="url(#glowS)"/>`;
    for (let i = 0; i < 12; i++) { const an = (i / 12) * TAU; s += `<line x1="${f2(Math.sin(an) * (r - 20))}" y1="${f2(-Math.cos(an) * (r - 20))}" x2="${f2(Math.sin(an) * (r - 13))}" y2="${f2(-Math.cos(an) * (r - 13))}" stroke="rgba(255,255,255,.55)" stroke-width="3"/>`; }
    if (o.mark != null) { const an = o.mark * TAU; s += `<line x1="${f2(Math.sin(an) * (r - 24))}" y1="${f2(-Math.cos(an) * (r - 24))}" x2="${f2(Math.sin(an) * (r + 12))}" y2="${f2(-Math.cos(an) * (r + 12))}" stroke="#fff" stroke-width="5"/>`; }
    if (o.hand) { const an = clamp(frac, 0, 1) * TAU; s += `<line x1="0" y1="0" x2="${f2(Math.sin(an) * (r - 28))}" y2="${f2(-Math.cos(an) * (r - 28))}" stroke="#fff" stroke-width="6" stroke-linecap="round"/><circle r="7" fill="#fff"/>`; }
    return s + '</g>';
  }

  /* ---------------- photo cards (persistent DOM) ---------------- */
  const CARDS = [
    { id: 'burke', img: 's24_01_burke.jpg', w: 330, h: 460, x: 250, y: 470, cap: 'ROBERT O’HARA BURKE', key: 'leader', dur: 1.5, full: true },
    { id: 'gill', img: 's24_21_royal_park_departure.jpg', w: 640, h: 410, x: 380, y: 430, cap: 'ROYAL PARK · 1860', key: 'leave', dur: 1.5, full: true },
    { id: 'wills', img: 's24_02_wills.jpg', w: 300, h: 380, x: 230, y: 440, cap: 'WILLS', key: 'nWills', dur: 1.2, full: true },
    { id: 'dig', img: 's24_08_dig_inscription.jpg', w: 360, h: 470, x: 250, y: 470, cap: 'THE DIG TREE', key: 'carve', dur: 1.35 },
    { id: 'arrive', img: 's24_14_longstaff_arrival.jpg', w: 640, h: 425, x: 380, y: 420, cap: 'PAINTING · J. LONGSTAFF', key: 'stumble', dur: 1.45 },
    { id: 'king', img: 's24_20_john_king.jpg', w: 320, h: 470, x: 245, y: 470, cap: 'JOHN KING', key: 'onlyKing', dur: 1.6 },
  ];
  function cardState(c, t) {
    const t0 = T[c.key];
    if (t0 == null || (c.full && !T.full)) return null;
    const a = t0 + 0.05;
    const b = a + c.dur;
    if (t < a - 0.01 || t > b + 0.35) return null;
    const kin = easeOutBack(clamp((t - a) / 0.38, 0, 1));
    const kout = easeInOutCubic(clamp((t - b) / 0.32, 0, 1));
    const x = c.x - 520 * (1 - kin) - 700 * kout;
    const rot = -4 + 6 * (1 - kin) - 8 * kout + Math.sin(t * 1.3) * 0.6;
    const s = 0.96 + 0.05 * clamp((t - a) / c.dur, 0, 1);
    return { tr: `translate(${f2(x)} ${f2(c.y)}) rotate(${f2(rot)}) scale(${f2(s)})`, op: clamp((t - a) / 0.12, 0, 1) * (1 - kout) };
  }
  function buildCardsDom() {
    return CARDS.map((c) => `<g id="card_${c.id}" opacity="0">
      <rect x="${-c.w / 2 + 10}" y="${-c.h / 2 + 16}" width="${c.w}" height="${c.h}" rx="10" fill="rgba(0,0,0,.6)" filter="url(#soft8)"/>
      <rect x="${-c.w / 2 - 10}" y="${-c.h / 2 - 10}" width="${c.w + 20}" height="${c.h + 64}" rx="10" fill="#f3ead8"/>
      <image href="/img/${c.img}" x="${-c.w / 2}" y="${-c.h / 2}" width="${c.w}" height="${c.h}" preserveAspectRatio="xMidYMid slice"/>
      <rect x="${-c.w / 2}" y="${-c.h / 2}" width="${c.w}" height="${c.h}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="2"/>
      <text x="0" y="${c.h / 2 + 38}" text-anchor="middle" font-family="${FONT_B}" font-size="24" fill="#1b1309" letter-spacing="1.5">${esc(c.cap)}</text>
    </g>`).join('');
  }

  /* ---------------- map-space vectors ---------------- */
  function drawMap(t, cam) {
    const z = cam.z;
    const sw = (px) => f2(px / z);
    let s = '';
    // borders — faint, glow near Cooper borderlands
    const bGlow = fadeWin(t, T.menWaiting - 0.4, T.loop, 0.8, 0.8) * 0.5 + (T.full ? fadeWin(t, T.cooperArr, T.north + 1, 0.4, 0.6) * 0.6 : 0);
    for (const b of BORDERS) {
      const d = polyPath(b);
      if (bGlow > 0.02) s += `<path d="${d}" fill="none" stroke="#fff" stroke-width="${sw(10)}" opacity="${f2(bGlow * 0.35)}" filter="url(#blurM)"/>`;
      s += `<path d="${d}" fill="none" stroke="rgba(255,255,255,${f2(0.34 + bGlow * 0.4)})" stroke-width="${sw(2.4)}" stroke-dasharray="${sw(10)} ${sw(7)}"/>`;
    }
    // Yandruwandha country (soft, dignified ochre glow along the creek)
    const yk = T.yandru != null ? fadeWin(t, T.yandru - 0.2, T.loop + 0.6, 0.7, 0.8) : 0;
    if (yk > 0) {
      const c = P(140.75, -27.78);
      const rx = 0.95 * KX;
      const ry = 0.5 * KX * 1.13;
      s += `<ellipse cx="${f2(c[0])}" cy="${f2(c[1])}" rx="${f2(rx * (0.9 + 0.1 * yk))}" ry="${f2(ry * (0.9 + 0.1 * yk))}" fill="rgba(214,122,52,${f2(0.28 * yk)})" stroke="rgba(255,255,255,${f2(0.9 * yk)})" stroke-width="${sw(5)}" filter="url(#glowM)"/>`;
    }
    // Cooper Creek channel (reveals when the story lives there)
    const ck = fadeWin(t, T.menWaiting - 0.3, T.loop + 0.4, 0.8, 0.9) + (T.full ? fadeWin(t, T.cooperArr, T.north, 0.5, 0.5) : 0);
    if (ck > 0.01) {
      const d = routePath(CREEK, 0, CREEK.len);
      s += `<path d="${d}" fill="none" stroke="#6fd3ff" stroke-width="${sw(12)}" opacity="${f2(ck * 0.35)}" filter="url(#blurM)"/>`;
      s += `<path d="${d}" fill="none" stroke="#7fdcff" stroke-width="${sw(4)}" opacity="${f2(ck * 0.95)}" stroke-linecap="round"/>`;
    }
    // Gulf mangrove belt (obstacle) — drawn in map space so it sits on the coast
    const mk = T.full ? fadeWin(t, T.gulfArr - 0.3, T.back + 2.5, 0.5, 0.8) : fadeWin(t, T.proDraw1 - 0.3, T.food + 1.4, 0.3, 0.6);
    if (mk > 0.01) {
      const d = polyPath(GULF_COAST.map((q) => [q[0], q[1] - 0.07]));
      s += `<path d="${d}" fill="none" stroke="#1d4a22" stroke-width="${sw(34)}" stroke-linecap="round" opacity="${f2(0.85 * mk)}" filter="url(#blurS)"/>`;
      s += `<path d="${d}" fill="none" stroke="#3e7a37" stroke-width="${sw(16)}" stroke-linecap="round" opacity="${f2(mk)}" stroke-dasharray="${sw(4)} ${sw(6)}"/>`;
    }
    // ghost of the whole journey (frame-1 tease + loop)
    const gk = T.full ? fadeWin(t, 0, T.leave, 0.01, 0.6) : 0;
    if (gk > 0.01) s += `<path d="${routePath(OUT, 0, OUT.len)}" fill="none" stroke="rgba(255,255,255,${f2(0.55 * gk)})" stroke-width="${sw(3.5)}" stroke-dasharray="${sw(12)} ${sw(10)}"/>`;

    // routes — whip rewinds them for a seamless loop into frame 1
    const rew = 1 - smoothstep(T.whip + 0.05, T.D - 0.05, t);
    const od = outDist(t) * (T.full ? rew : 1);
    const rd = retDist(t) * rew;
    const outFade = T.full ? 1 : 1 - smoothstep(T.whip, T.D - 0.02, t);
    const ret = (t >= RETKEYS[0][0]);
    const lines = [
      { r: OUT, d: od, col: '#ffc23a', dark: '#6b3d00', a: outFade * (ret ? 0.85 : 1) },
      { r: RET, d: ret ? rd : 0, col: '#ff5a2c', dark: '#5a1204', a: 1 },
    ];
    for (const L of lines) {
      if (L.d <= 0.5 || L.a <= 0.01) continue;
      const d = routePath(L.r, 0, L.d);
      s += `<g opacity="${f2(L.a)}">`;
      s += `<path d="${d}" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="${sw(15)}" stroke-linecap="round" stroke-linejoin="round" transform="translate(${sw(4)} ${sw(6)})" filter="url(#blurS)"/>`;
      s += `<path d="${d}" fill="none" stroke="${L.col}" stroke-width="${sw(24)}" opacity=".28" stroke-linecap="round" stroke-linejoin="round" filter="url(#blurM)"/>`;
      s += `<path d="${d}" fill="none" stroke="${L.dark}" stroke-width="${sw(13)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      s += `<path d="${d}" fill="none" stroke="${L.col}" stroke-width="${sw(9)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      s += `<path d="${d}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="${sw(2.2)}" stroke-linecap="round" stroke-linejoin="round" transform="translate(${sw(-1.5)} ${sw(-2)})"/>`;
      s += '</g>';
    }
    return s;
  }

  /* ---------------- screen-space overlays ---------------- */
  function head(cam, r, d, col, t) {
    const h = routeAt(r, d);
    const [x, y] = toScreen(cam, h.p);
    const pulse = (t * 1.6) % 1;
    return `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(12 + pulse * 30)}" fill="none" stroke="${col}" stroke-width="${f2(4 * (1 - pulse))}" opacity="${f2(1 - pulse)}"/>
      <circle cx="${f2(x)}" cy="${f2(y)}" r="13" fill="#fff" stroke="${col}" stroke-width="6" filter="url(#glowS)"/>`;
  }
  const S = (cam, key) => toScreen(cam, PT[key]);
  function placeLabel(cam, key, text, t, t0, o = {}) {
    if (t0 == null || t < t0) return '';
    const [x, y] = S(cam, key);
    const k = pop(t, t0 + 0.12, 0.35);
    const a = (o.alpha ?? 1) * clamp(k * 1.5, 0, 1);
    const lx = x + (o.dx ?? 0);
    const ly = y + (o.dy ?? -70);
    return pin(x, y, t, t0, { col: o.col, scale: o.pinScale || 1 }) +
      label3d(text, lx, ly, { size: o.size || 50, alpha: a, scale: 0.7 + 0.3 * easeOutBack(k), anchor: o.anchor || 'middle', fill: o.fill });
  }
  // keep labels out of the caption band / right-edge UI
  const safeY = (y) => clamp(y, 170, 1175);
  const safeX = (x, w = 0) => clamp(x, 70 + w / 2, 930 - w / 2);

  function drawScreen(t, cam) {
    let s = '';
    const full = T.full;
    const endFade = 1 - smoothstep(T.loop + 0.4, T.whip, t);

    /* --- place pins & labels --- */
    if (full) {
      s += placeLabel(cam, 'melb', 'MELBOURNE', t, T.leader, { dx: 60, dy: 80, size: 54 });
      s += placeLabel(cam, 'menindee', 'MENINDEE', t, T.menindee, { dx: -150, dy: -60 });
      s += placeLabel(cam, 'cooper', 'COOPER CREEK', t, T.cooperArr, { dx: 170, dy: -70 });
      s += placeLabel(cam, 'gulf', 'GULF OF CARPENTARIA', t, T.gulfArr, { dy: 120, size: 48 });
    } else {
      const k = T.proDraw1 - T.proDraw0;
      const at = (i) => T.proDraw0 + k * (OUT.wpDist(i) / OUT.len) - 0.08;
      const lbl = (key, txt, i, o) => { const a = 1 - smoothstep(T.proDraw1 + 0.15, T.proDraw1 + 0.55, t); return placeLabel(cam, key, txt, t, at(i), { ...o, alpha: a, pinScale: 0.75, size: 40 }); };
      s += lbl('melb', 'MELBOURNE', 0, { dx: 40, dy: 58 });
      s += lbl('menindee', 'MENINDEE', OUT_IDX.menindee, { dx: -120, dy: 10 });
      s += lbl('cooper', 'COOPER CREEK', OUT_IDX.cooper, { dx: 150, dy: 16 });
      s += placeLabel(cam, 'gulf', 'GULF OF CARPENTARIA', t, at(OUT_IDX.gulf), { dy: -190, size: 50, alpha: fadeWin(t, 0, T.grayDies - 0.4, 0.01, 0.5) });
    }
    // Cooper depot pin persists through the back half
    const coopA = fadeWin(t, T.menWaiting - 0.2, T.loop + 1.4, 0.3, 0.5);
    if (coopA > 0) {
      const [x, y] = S(cam, 'cooper');
      s += pin(x, y, t, T.menWaiting - 0.2, { col: '#ffc23a' });
      s += label3d('COOPER CREEK', safeX(x - 150, 360), safeY(y + 190), { size: 52, alpha: coopA * (1 - smoothstep(T.carve - 0.3, T.carve, t)) });
    }

    /* --- beats 1–7 (full script only) --- */
    if (full) s += drawFirstHalf(t, cam);

    /* --- beat 8: return, food, camels, Gray --- */
    const retOn = t >= RETKEYS[0][0];
    if (retOn && t < T.aBurke + 0.6) {
      const hd = routeAt(RET, retDist(t));
      const [hx, hy] = toScreen(cam, hd.p);
      // camels walking with the party, fading one by one (no gore — they simply fade)
      const kill = T.killing;
      for (let i = 0; i < 3; i++) {
        const gone = clamp((t - (kill + 0.35 + i * 0.4)) / 0.35, 0, 1);
        const a = clamp((t - RETKEYS[0][0]) / 0.4, 0, 1) * (1 - gone);
        const bob = Math.sin(t * 9 + i * 1.7) * 3;
        s += camel(hx - 95 - i * 92, hy - 40 + bob + i * 10, 0.95, a, false);
        if (gone > 0 && gone < 1) s += `<circle cx="${f2(hx - 95 - i * 92)}" cy="${f2(hy - 70)}" r="${f2(10 + gone * 40)}" fill="none" stroke="#fff" stroke-width="${f2(3 * (1 - gone))}" opacity="${f2(1 - gone)}"/>`;
      }
      // FOOD meter drains
      const fa = fadeWin(t, T.back + 0.2, T.grayDies + 1.2, 0.3, 0.4);
      if (fa > 0) {
        const lev = 1 - smoothstep(T.back + 0.3, T.food + 0.55, t);
        const bx = safeX(hx + 190, 340);
        const by = safeY(hy - 150);
        const blink = lev < 0.05 ? 0.55 + 0.45 * Math.sin(t * 18) : 1;
        s += `<g opacity="${f2(fa)}" transform="translate(${f2(bx)} ${f2(by)}) scale(1.35)">
          <rect x="-125" y="-40" width="250" height="80" rx="14" fill="rgba(12,14,20,.85)" stroke="#fff" stroke-width="2.5"/>
          <text x="-105" y="-8" font-family="${FONT_B}" font-size="24" fill="#fff" letter-spacing="2">FOOD</text>
          <rect x="-105" y="4" width="210" height="20" rx="6" fill="rgba(255,255,255,.15)"/>
          <rect x="-105" y="4" width="${f2(210 * lev)}" height="20" rx="6" fill="${lev > 0.35 ? '#ffc23a' : '#ff3b2f'}" opacity="${f2(blink)}"/>
          ${lev < 0.05 ? `<text x="105" y="-8" text-anchor="end" font-family="${FONT_B}" font-size="24" fill="#ff3b2f" opacity="${f2(blink)}">0</text>` : ''}</g>`;
      }
      s += head(cam, RET, retDist(t), '#ff5a2c', t);
    }
    // km ruler Gulf → Cooper during the return leg
    {
      const a = fadeWin(t, T.food + 0.2, T.grayDies - 0.2, 0.35, 0.35) * (T.full ? 0 : 1);
      if (a > 0) s += kmRuler(cam, PT.gulf, PT.cooper, a, t, T.food + 0.2);
    }
    // Gray: soft memorial ring + name + 4 DAYS bracket
    if (t >= T.grayDies) {
      const [x, y] = S(cam, 'gray');
      const k = pop(t, T.grayDies, 0.5);
      const a = 1 - smoothstep(T.menWaiting + 0.8, T.menWaiting + 1.4, t);
      if (a <= 0.01) { /* gone */ } else {
      s += `<g opacity="${f2(a)}"><circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(18 + 10 * easeOutBack(k))}" fill="rgba(255,255,255,.12)" stroke="#fff" stroke-width="4"/><circle cx="${f2(x)}" cy="${f2(y)}" r="7" fill="#fff"/></g>`;
      s += chip('GRAY', safeX(x - 150, 170), safeY(y - 30), t, T.grayDies + 0.1, { alpha: a, acc: '#cfd6e0' });
      const bk = fadeWin(t, T.fourDays - 0.05, T.menWaiting + 0.6, 0.3, 0.4);
      if (bk > 0) {
        const [cx, cy] = S(cam, 'cooper');
        const mx = (x + cx) / 2 + 120;
        const my = (y + cy) / 2;
        const dash = easeOutCubic(pop(t, T.fourDays - 0.05, 0.5));
        s += `<path d="M${f2(x + 24)} ${f2(y)} Q${f2(mx)} ${f2(my)} ${f2(cx + 24)} ${f2(cy)}" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="14 10" opacity="${f2(bk)}" pathLength="1000" style="stroke-dashoffset:${f2(1000 * (1 - dash))}"/>`;
        s += label3d('4 DAYS', safeX(mx + 40, 200), safeY(my + 18), { size: 64, alpha: bk, scale: 0.8 + 0.2 * easeOutBack(pop(t, T.fourDays, 0.35)), fill: '#ffe08a' });
      }
      }
    }

    /* --- beat 9: depot wait, DIG, leave --- */
    const [dx, dy] = S(cam, 'cooper');
    // four men waiting
    const waitA = fadeWin(t, T.menWaiting, T.andLeave + 1.6, 0.35, 0.4);
    const leaveK = easeInOutCubic(clamp((t - T.andLeave) / 1.6, 0, 1));
    const lvx = 40 * leaveK;
    const lvy = 150 * leaveK;
    for (let i = 0; i < 4; i++) {
      const k = pop(t, T.menWaiting + 0.1 + i * 0.12, 0.3);
      s += person(dx - 70 + i * 34 + lvx, dy + 58 + (i % 2) * 8 + lvy - (1 - easeOutBack(k)) * 30, 0.9, waitA * k);
    }
    // depot-party departure arrow (south, dashed intent)
    const la = fadeWin(t, T.andLeave, T.nineE + 1.6, 0.25, 0.4);
    if (la > 0) {
      const g = easeOutCubic(pop(t, T.andLeave, 0.7));
      const x0 = dx - 10;
      const y0 = dy + 110;
      const x1 = x0 + 60 * g;
      const y1 = y0 + 230 * g;
      s += `<g opacity="${f2(la)}"><path d="M${f2(x0)} ${f2(y0)} L${f2(x1)} ${f2(y1)}" stroke="#fff" stroke-width="7" stroke-dasharray="18 12" stroke-linecap="round"/>
        <path d="M${f2(x1 - 20)} ${f2(y1 - 22)} L${f2(x1 + 4)} ${f2(y1 + 8)} L${f2(x1 + 26)} ${f2(y1 - 20)}" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    }
    // wait ring: 3-month order passes, over four months
    const ra = fadeWin(t, T.menWaiting + 0.35, T.bury + 0.3, 0.35, 0.35);
    if (ra > 0) {
      const fr = 0.95 * smoothstep(T.menWaiting + 0.4, T.fourMonths + 0.9, t);
      const rx = safeX(dx + 250, 260);
      const ry = safeY(dy - 330);
      s += ring(rx, ry, 92, fr, { alpha: ra, mark: 0.72, hand: true, col: fr > 0.72 ? '#ff7a3a' : '#ffc23a' });
      s += label3d(fr > 0.72 ? '4+ MONTHS' : '3 MONTHS', rx, ry + 170, { size: 50, alpha: ra, fill: fr > 0.72 ? '#ffd0a0' : '#ffffff' });
      if (t > T.giveUp) s += slashX(rx, ry, 112, pop(t, T.giveUp, 0.4), '#ff3b2f');
    }
    // Dig Tree + buried cache
    const tA = fadeWin(t, T.bury - 0.3, T.loop + 1.4, 0.35, 0.5);
    if (tA > 0) {
      s += tree(dx + 6, dy - 10, 1.25, tA);
      const sink = clamp((t - T.bury - 0.2) / 0.8, 0, 1);
      if (sink < 1) s += `<g opacity="${f2(tA * (1 - sink))}">${crate(dx - 52, dy + 6 + sink * 24, 1.1, 1)}</g>`;
      if (t > T.bury) s += `<ellipse cx="${f2(dx - 52)}" cy="${f2(dy + 8)}" rx="${f2(26 * easeOutCubic(sink))}" ry="${f2(8 * easeOutCubic(sink))}" fill="#4a2e14" stroke="#f3dca8" stroke-width="2.5" opacity="${f2(tA)}"/>`;
    }
    // DIG blaze slam
    const digK = pop(t, T.dig, 0.28);
    const digA = fadeWin(t, T.dig, T.aBurke + 0.3, 0.05, 0.4);
    if (digA > 0) {
      const shake = t < T.dig + 0.25 ? Math.sin(t * 90) * 6 * (1 - digK) : 0;
      const gx = safeX(dx + 185 - 330 * smoothstep(T.andLeave + 0.2, T.evening, t), 300);
      const gy = safeY(dy - 130 + 60 * smoothstep(T.andLeave + 0.2, T.evening, t));
      const sc = 1.9 - 0.9 * easeOutCubic(digK);
      const small = smoothstep(T.andLeave + 0.2, T.evening, t);
      s += `<g transform="translate(${f2(gx + shake)} ${f2(gy)}) scale(${f2(sc * (1 - 0.45 * small))})" opacity="${f2(digA)}">
        <rect x="-150" y="-104" width="300" height="140" rx="16" fill="#5a3a1c" stroke="#f3dca8" stroke-width="5" transform="rotate(-3)"/>
        ${label3d('DIG', 0, 20, { size: 128, fill: '#f6e4bd', side: '#2a1707', ls: 10 })}</g>`;
    }

    /* --- beat 10: evening arrival, nine hours --- */
    if (t >= T.aBurke - 0.2 && t < T.creek + 0.6) {
      const names = [['BURKE', T.aBurke], ['WILLS', T.aWills], ['KING', T.aKing]];
      const a = fadeWin(t, T.aBurke - 0.1, T.missed + 0.4, 0.2, 0.35);
      names.forEach(([n, tn], i) => {
        s += person(dx + 70 + i * 40, dy - 34 + (i % 2) * 6, 0.95, a * pop(t, tn, 0.3), '#ffd7b0');
        s += chip(n, safeX(dx - 200 + i * 205, 190), safeY(dy - 300 + (i % 2) * 10), t, tn, { alpha: a, acc: '#ff5a2c', size: 36 });
      });
    }
    const nk = fadeWin(t, T.missed, T.nineE + 1.5, 0.25, 0.45);
    if (nk > 0) {
      // 9-hour clock between the two groups
      const cx = safeX(dx - 40, 260);
      const cy = safeY(dy - 330);
      const fr = 0.75 * smoothstep(T.missed + 0.1, T.nine + 0.3, t); // 9 of 12 hours
      s += ring(cx, cy, 100, fr, { alpha: nk, hand: true, col: '#ff3b2f' });
      const sl = pop(t, T.nine, 0.3);
      if (sl > 0) {
        const bump = 1 + 0.35 * (1 - easeOutCubic(sl));
        s += label3d('NINE HOURS', 540, safeY(cy + 205), { size: 118, alpha: nk * clamp(sl * 3, 0, 1), scale: bump, fill: '#ffffff', side: '#7a1206', ls: 3 });
      }
    }

    /* --- beat 11: too weak, creek deaths --- */
    const wk = fadeWin(t, T.weak, T.creek + 0.2, 0.2, 0.4);
    if (wk > 0) {
      // attempt to follow south falters and retracts
      const g = Math.sin(clamp((t - T.weak) / 1.4, 0, 1) * Math.PI) * 0.85;
      const x0 = dx + 30;
      const y0 = dy + 40;
      s += `<path d="M${f2(x0)} ${f2(y0)} L${f2(x0 + 30 * g)} ${f2(y0 + 200 * g)}" stroke="#ff5a2c" stroke-width="7" stroke-dasharray="14 12" stroke-linecap="round" opacity="${f2(wk)}"/>`;
      if (g > 0.3) s += slashX(x0 + 30 * g, y0 + 200 * g + 20, 34, clamp((t - T.weak - 0.5) / 0.4, 0, 1));
    }
    for (const [key, name, off] of [['burke', 'BURKE', 0], ['wills', 'WILLS', 0.28]]) {
      const t0 = T.bothDie + off;
      const a = fadeWin(t, T.creek + 0.2, T.loop + 0.5, 0.5, 0.5);
      if (a <= 0) continue;
      const [x, y] = S(cam, key);
      const dim = smoothstep(t0, t0 + 1.2, t);
      const col = `rgb(${Math.round(lerp(255, 150, dim))},${Math.round(lerp(210, 158, dim))},${Math.round(lerp(170, 168, dim))})`;
      s += `<g opacity="${f2(a)}"><circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(15 + 5 * Math.sin(t * 2) * (1 - dim))}" fill="none" stroke="${col}" stroke-width="4"/><circle cx="${f2(x)}" cy="${f2(y)}" r="6" fill="${col}"/></g>`;
      s += label3d(name, safeX(x + (key === 'wills' ? -40 : 60), 200), safeY(y - (key === 'wills' ? 64 : 110)), { size: 46, alpha: a * pop(t, T.creek + 0.3 + off, 0.35) * (1 - 0.45 * dim), fill: col });
    }

    /* --- beat 12: King survives, Yandruwandha, rescue --- */
    const kA = fadeWin(t, T.onlyKing - 0.1, T.loop + 0.5, 0.3, 0.5);
    if (kA > 0) {
      const [x, y] = S(cam, 'king');
      const pulse = (t * 0.9) % 1;
      s += `<g opacity="${f2(kA)}"><circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(20 + pulse * 60)}" fill="none" stroke="#ffc23a" stroke-width="${f2(5 * (1 - pulse))}" opacity="${f2(1 - pulse)}"/>
        <circle cx="${f2(x)}" cy="${f2(y)}" r="16" fill="#ffc23a" stroke="#fff" stroke-width="5" filter="url(#glowS)"/></g>`;
      s += label3d('KING', safeX(x, 150), safeY(y + 105), { size: 58, alpha: kA * pop(t, T.onlyKing, 0.35), fill: '#ffe08a' });
      // care rings (feed and shelter)
      const cA = fadeWin(t, T.shelter - 0.1, T.loop + 0.3, 0.3, 0.5);
      for (let i = 0; i < 3; i++) {
        const ph = ((t - T.shelter) * 0.6 + i / 3) % 1;
        if (cA > 0 && ph > 0) s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(40 + ph * 120)}" fill="none" stroke="#f2a65a" stroke-width="3" opacity="${f2(cA * (1 - ph) * 0.8)}"/>`;
      }
      // rescue party arrives from the south-east
      const rk = fadeWin(t, T.rescue, T.loop + 0.4, 0.25, 0.5);
      if (rk > 0) {
        const g = easeInOutCubic(clamp((t - T.rescue) / Math.max(0.6, T.findsHim - T.rescue), 0, 1));
        const sx = x + 520;
        const sy = y + 480;
        const ex = lerp(sx, x + 26, g);
        const ey = lerp(sy, y + 22, g);
        s += `<g opacity="${f2(rk)}"><path d="M${f2(sx)} ${f2(sy)} L${f2(ex)} ${f2(ey)}" stroke="#9fe3ff" stroke-width="7" stroke-dasharray="16 11" stroke-linecap="round"/>
          <circle cx="${f2(ex)}" cy="${f2(ey)}" r="11" fill="#9fe3ff" stroke="#fff" stroke-width="4"/></g>`;
      }
    }
    const yA = T.yandru != null ? fadeWin(t, T.yandru - 0.05, T.loop + 0.5, 0.35, 0.5) : 0;
    if (yA > 0) {
      const c = toScreen(cam, P(140.75, -27.78));
      s += label3d('YANDRUWANDHA', safeX(c[0], 560), safeY(c[1] - 190), { size: 68, alpha: yA, scale: 0.85 + 0.15 * easeOutBack(pop(t, T.yandru, 0.4)), fill: '#ffd9a8', side: '#4a2208', ls: 3 });
    }

    /* --- loop: whole journey + 1860 --- */
    const lp = fadeWin(t, T.loop + 0.4, T.whip + 0.05, 0.4, 0.15);
    if (lp > 0) s += chip('1860', 540, 330, t, T.loop + 0.4, { alpha: lp, size: 44 });
    return `<g opacity="${f2(1)}">${s}</g>` + (endFade < 0 ? '' : '');
  }

  function kmRuler(cam, a, b, alpha, t, t0) {
    const [x0, y0] = toScreen(cam, a);
    const [x1, y1] = toScreen(cam, b);
    const g = easeOutCubic(pop(t, t0, 0.6));
    const ox = 150;
    const X0 = x0 + ox;
    const X1 = lerp(x0, x1, g) + ox;
    const Y1 = lerp(y0, y1, g);
    const mx = (X0 + X1) / 2;
    const my = (y0 + Y1) / 2;
    return `<g opacity="${f2(alpha)}"><path d="M${f2(X0)} ${f2(y0)} L${f2(X1)} ${f2(Y1)}" stroke="#fff" stroke-width="4" stroke-dasharray="4 10" stroke-linecap="round"/>
      <path d="M${f2(X0 - 16)} ${f2(y0)} h32 M${f2(X1 - 16)} ${f2(Y1)} h32" stroke="#fff" stroke-width="4"/></g>` +
      label3d(KM_COOPER_GULF, safeX(mx + 30, 300), safeY(my), { size: 58, alpha: alpha * clamp(g * 2, 0, 1), fill: '#ffffff', anchor: 'middle' });
  }

  /* ---------------- beats 1–7 (full script) ---------------- */
  function drawFirstHalf(t, cam) {
    let s = '';
    const [mx, my] = S(cam, 'melb');
    // Burke chip
    s += chip('BURKE', 760, 330, t, T.leader + 0.2, { alpha: fadeWin(t, T.leader, T.leave, 0.2, 0.3), size: 40 });
    s += chip('IRISH POLICE', 760, 420, t, T.irish, { alpha: fadeWin(t, T.irish, T.leave, 0.2, 0.3), acc: '#7fdcff' });
    // departure kit: camels, horses, ~20 t, oak table
    const kitA = fadeWin(t, T.camels, T.wagon + 0.3, 0.25, 0.35);
    if (kitA > 0) {
      for (let i = 0; i < 3; i++) s += camel(safeX(mx + 20 + i * 105, 0), safeY(my + 150 + (i % 2) * 14), 1.0, kitA * pop(t, T.camels + i * 0.12, 0.3), true);
      s += chip('~20 t', safeX(mx + 150, 180), safeY(my - 250), t, T.tonnes, { alpha: kitA });
      s += chip('OAK TABLE', safeX(mx + 120, 260), safeY(my - 150), t, T.oak, { alpha: kitA, acc: '#b98545' });
    }
    // wagon break obstacle
    const wA = fadeWin(t, T.wagon, T.dump, 0.2, 0.3);
    if (wA > 0) {
      const brk = t > T.park;
      const wx = safeX(mx - 40, 200);
      const wy = safeY(my - 140);
      s += wagon(wx, wy, 2.0, wA, brk);
      if (brk) s += slashX(wx + 14, wy - 42, 110, pop(t, T.park, 0.4));
    }
    // first night — barely moved
    if (T.firstNight != null) {
      const [fx, fy] = S(cam, 'firstNight');
      const a = fadeWin(t, T.firstNight, T.dump + 0.5, 0.2, 0.3);
      if (a > 0) {
        s += `<circle cx="${f2(fx)}" cy="${f2(fy)}" r="12" fill="#fff" stroke="#ffc23a" stroke-width="5" opacity="${f2(a)}"/>`;
        s += chip('FIRST NIGHT', safeX(fx - 60, 280), safeY(fy - 110), t, T.firstNight + 0.2, { alpha: a, acc: '#7fdcff' });
        s += chip('EDGE OF MELBOURNE', safeX(fx - 20, 420), safeY(fy + 110), t, T.edge, { alpha: a, acc: '#ffc23a', size: 30 });
      }
    }
    // dumping supplies behind the head
    const dA = fadeWin(t, T.dump, T.cooperArr + 0.4, 0.2, 0.4);
    if (dA > 0) {
      for (let i = 0; i < 6; i++) {
        const td = T.dump + 0.3 + i * ((T.menindee - T.dump) / 6);
        if (t < td) continue;
        const p = routeAt(OUT, outDist(td)).p;
        const [x, y] = toScreen(cam, p);
        s += crate(x + 26, y + 6 - 12 * (1 - easeOutBack(pop(t, td, 0.3))), 0.8, dA * 0.9);
      }
    }
    // Menindee: most gear left behind (crate pile)
    const pA = fadeWin(t, T.mostGear, T.north, 0.25, 0.4);
    if (pA > 0) {
      const [x, y] = S(cam, 'menindee');
      for (let i = 0; i < 7; i++) s += crate(x + 38 + (i % 4) * 26, y + 4 - Math.floor(i / 4) * 22, 0.85, pA * pop(t, T.mostGear + i * 0.06, 0.25));
    }
    // outward head
    if (T.leave != null && t > T.leave && t < T.gulfArr + 0.8) s += head(cam, OUT, outDist(t), '#ffc23a', t);
    // split at Cooper: 4 wait, 3 months badge
    const sA = fadeWin(t, T.four, T.twoMonths, 0.25, 0.4);
    if (sA > 0) {
      const [x, y] = S(cam, 'cooper');
      for (let i = 0; i < 4; i++) s += person(x - 70 + i * 34, y + 58, 0.9, sA * pop(t, T.four + 0.1 + i * 0.1, 0.3));
      s += ring(safeX(x + 250, 260), safeY(y - 180), 70, (3 / 12) * smoothstep(T.threeMonths, T.threeMonths + 0.7, t), { alpha: sA * pop(t, T.threeMonths, 0.3), hand: true });
      s += label3d('3 MONTHS', safeX(x + 250, 260), safeY(y - 50), { size: 46, alpha: sA * pop(t, T.threeMonths, 0.3) });
    }
    // race north: dashed intent + names + km ruler
    const nA = fadeWin(t, T.north, T.gulfArr + 0.4, 0.2, 0.4);
    if (nA > 0) {
      const [x0, y0] = S(cam, 'cooper');
      const [x1, y1] = S(cam, 'gulf');
      const g = easeOutCubic(pop(t, T.north, 0.6));
      s += `<path d="M${f2(x0)} ${f2(y0)} L${f2(lerp(x0, x1, g))} ${f2(lerp(y0, y1, g))}" stroke="#fff" stroke-width="6" stroke-dasharray="18 12" opacity="${f2(nA * 0.9)}"/>`;
      s += kmRuler(cam, PT.cooper, PT.gulf, nA, t, T.north + 0.2);
      [['WILLS', T.nWills], ['KING', T.nKing], ['GRAY', T.nGray]].forEach(([n, tn], i) => {
        if (tn != null) s += chip(n, 200, 360 + i * 90, t, tn, { alpha: nA, acc: '#ff5a2c' });
      });
    }
    // ~2 months
    const mA = fadeWin(t, T.twoMonths, T.gulfArr + 0.2, 0.2, 0.3);
    if (mA > 0) s += chip('~2 MONTHS', 540, 300, t, T.twoMonths, { alpha: mA, size: 40 });
    // mangrove wall + no ocean
    const gA = fadeWin(t, T.mangrove - 0.1, T.back + 0.8, 0.3, 0.4);
    if (gA > 0) {
      const base = GULF_COAST.map((q) => toScreen(cam, P(q[0], q[1] - 0.09)));
      for (let i = 0; i < 16; i++) {
        const u = i / 15;
        const seg = Math.min(base.length - 2, Math.floor(u * (base.length - 1)));
        const f = u * (base.length - 1) - seg;
        const x = lerp(base[seg][0], base[seg + 1][0], f);
        const y = lerp(base[seg][1], base[seg + 1][1], f);
        s += mangrove(x, y + (i % 2) * 14, 1.25, gA * pop(t, T.mangrove + i * 0.03, 0.25));
      }
      const [ex, ey] = toScreen(cam, P(140.8, -17.25));
      s += eye(ex, ey, 1.3, gA * pop(t, T.ocean, 0.3));
      s += slashX(ex, ey, 60, pop(t, T.ocean + 0.1, 0.35));
    }
    return s;
  }

  /* ---------------- hook + loop whip ---------------- */
  function hook(t) {
    const end = T.full ? Math.max(1.8, T.leader - 0.2) : Math.max(1.35, T.proDraw1 + 0.05);
    const a = t < end ? 1 : 1 - clamp((t - end) / 0.3, 0, 1);
    if (a <= 0) return '';
    const k = clamp(t / 0.22, 0, 1);
    const sc = 1.25 - 0.25 * easeOutCubic(k) + 0.02 * Math.sin(t * 3);
    const fly = t > end ? (t - end) / 0.3 : 0;
    return `<g opacity="${f2(a)}" transform="translate(540 ${f2(430 - 120 * fly)}) scale(${f2(sc * (1 - 0.3 * fly))})">
      ${label3d('NINE HOURS', 0, 0, { size: 170, fill: '#ffffff', side: '#7a1206', depth: 14, ls: 4 })}
      <rect x="-330" y="34" width="${f2(660 * easeOutCubic(clamp(t / 0.4, 0, 1)))}" height="12" rx="6" fill="#ff3b2f" filter="url(#glowS)"/>
    </g>` + chip('1860', 540, 225, t, 0, { size: 40 });
  }

  /* ---------------- captions (style kit box, karaoke highlight) ---------------- */
  let CAPS = null;
  function captions(t) {
    if (!CAPS) {
      CAPS = [];
      const g = HS.groupCaptions(WORDS, 4, 0.5);
      let wi = 0;
      for (const c of g) {
        const n = c.text.split(' ').length;
        CAPS.push({ ...c, words: WORDS.slice(wi, wi + n) });
        wi += n;
      }
    }
    const c = CAPS.find((x) => t >= x.start && t <= x.end);
    if (!c) return '';
    const k = clamp((t - c.start) / 0.16, 0, 1);
    const s = easeOutBack(k);
    const op = t > c.end - 0.08 ? clamp((c.end - t) / 0.08, 0, 1) : 1;
    const y = H * 0.7;
    const txt = c.words.map((w) => {
      const on = t >= w.start - 0.03;
      const cur = on && t < w.end + 0.05;
      return `<tspan fill="${cur ? '#ffc23a' : on ? '#ffffff' : 'rgba(255,255,255,.72)'}">${esc(w.word)} </tspan>`;
    }).join('');
    const len = c.text.length;
    const size = Math.min(58, Math.floor(880 / (len * 0.64)));
    const bw = Math.min(980, len * size * 0.64 + 90);
    return `<g opacity="${f2(op)}" transform="translate(540 ${y}) scale(${f2(s)})">
      <rect x="${f2(-bw / 2 + 6)}" y="-48" width="${f2(bw)}" height="104" rx="20" fill="rgba(0,0,0,.35)" filter="url(#soft)"/>
      <rect x="${f2(-bw / 2)}" y="-54" width="${f2(bw)}" height="104" rx="20" fill="rgba(0,0,0,.66)" stroke="rgba(255,220,120,.4)" stroke-width="2.5"/>
      <text x="0" y="${f2(size * 0.35)}" text-anchor="middle" font-family="${FONT_B}" font-size="${size}" stroke="#000" stroke-width="7" paint-order="stroke" letter-spacing=".5">${txt}</text></g>`;
  }

  /* ---------------- persistent DOM ---------------- */
  let DOM = null;
  function initDom() {
    const root = document.getElementById('root');
    root.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>
      @font-face { font-family: 'Anton'; src: url('/ep/render/fonts/anton.woff2') format('woff2'); }
      @font-face { font-family: 'Archivo Black'; src: url('/ep/render/fonts/archivo-black.woff2') format('woff2'); }
      @font-face { font-family: 'Inter'; font-weight: 800; src: url('/ep/render/fonts/inter-800.woff2') format('woff2'); }
      @font-face { font-family: 'Inter'; font-weight: 600; src: url('/ep/render/fonts/inter-600.woff2') format('woff2'); }
    </style>
    <filter id="soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="soft8" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10"/></filter>
    <filter id="blurS" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="blurM" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="glowS" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="glowM" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="whip" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur id="whipBlur" stdDeviation="0 0"/></filter>
    <radialGradient id="vig" cx="50%" cy="44%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".78"/></radialGradient>
    <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1646"/><stop offset=".55" stop-color="#5a2a3a"/><stop offset="1" stop-color="#c2562a"/></linearGradient>
    <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".16" stop-color="#000" stop-opacity="0"/><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></linearGradient>
    <pattern id="grainP" width="480" height="480" patternUnits="userSpaceOnUse"><image id="grainImg" href="/ep/render/assets/grain.png" width="480" height="480"/></pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="#050a12"/>
  <g id="camWrap" filter="url(#whip)"><g id="cam">
    <image href="/ep/render/assets/basemap.jpg" x="0" y="0" width="${MAP_W}" height="${MAP_H}" preserveAspectRatio="none"/>
    <g id="mapvec"></g>
  </g></g>
  <rect id="duskR" width="${W}" height="${H}" fill="url(#dusk)" opacity="0" style="mix-blend-mode:multiply"/>
  <rect id="griefR" width="${W}" height="${H}" fill="#1b2230" opacity="0" style="mix-blend-mode:color"/>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  <rect width="${W}" height="${H}" fill="url(#topShade)"/>
  <g id="scr"></g>
  <g id="cards">${buildCardsDom()}</g>
  <g id="hud"></g>
  <rect id="grainR" width="${W}" height="${H}" fill="url(#grainP)" opacity=".07" style="mix-blend-mode:overlay"/>
  <rect id="flash" width="${W}" height="${H}" fill="#fff" opacity="0"/>
</svg>`;
    const $ = (id) => root.querySelector('#' + id);
    DOM = {
      cam: $('cam'), mapvec: $('mapvec'), scr: $('scr'), hud: $('hud'), dusk: $('duskR'), grief: $('griefR'),
      flash: $('flash'), whipBlur: $('whipBlur'), grainP: $('grainP'),
      cards: CARDS.map((c) => ({ c, el: $('card_' + c.id) })),
    };
  }

  function ensureInit() {
    if (!T) {
      T = buildTimeline();
      CAMKEYS = camKeys();
      routeKeys();
    }
    if (!DOM) initDom();
  }

  window.renderFrame = function (t) {
    if (!window.EPISODE) return;
    ensureInit();
    const cam = camera(t);
    // whip-back loop: last ~0.4 s smear + flash into the frame-1 composition
    const wk = clamp((t - T.whip) / Math.max(0.1, T.D - T.whip), 0, 1);
    const whipAmt = Math.sin(wk * Math.PI);
    const openFlash = 0;
    DOM.cam.setAttribute('transform', `translate(${f2(FOCUS[0])} ${f2(FOCUS[1] - whipAmt * 260)}) rotate(${f2(cam.rot)}) scale(${cam.z.toFixed(4)}) translate(${f2(-cam.cx)} ${f2(-cam.cy)})`);
    DOM.whipBlur.setAttribute('stdDeviation', `${f2(whipAmt * 2)} ${f2(whipAmt * 38)}`);
    DOM.flash.setAttribute('opacity', f2(Math.max(0.85 * Math.pow(whipAmt, 1.5) * (wk > 0.5 ? 1 : wk * 2), 0.55 * openFlash)));
    DOM.mapvec.innerHTML = drawMap(t, cam);
    // environmental state: evening dusk at the depot, grief desaturation by the creek
    const dusk = fadeWin(t, T.evening, T.onlyKing, 0.9, 1.2);
    DOM.dusk.setAttribute('opacity', f2(dusk * 0.55));
    DOM.grief.setAttribute('opacity', f2(fadeWin(t, T.weak + 0.4, T.onlyKing + 0.2, 1.0, 1.0) * 0.45));
    DOM.grainP.setAttribute('x', String(Math.floor((t * 977) % 480)));
    DOM.grainP.setAttribute('y', String(Math.floor((t * 613) % 480)));
    DOM.scr.innerHTML = drawScreen(t, cam);
    for (const { c, el } of DOM.cards) {
      const st = cardState(c, t);
      if (!st) { el.setAttribute('opacity', '0'); continue; }
      el.setAttribute('opacity', f2(st.op));
      el.setAttribute('transform', st.tr);
    }
    DOM.hud.innerHTML = hook(t) + captions(t);
  };

  window.EPISODE = {
    duration: 39.168,
    fps: 30,
    words: [],
    scenes: [],
  };
  // preload fonts + decode every image once, so frame 0 is final quality
  window.EPISODE.ready = (async () => {
    const faces = [
      new FontFace('Anton', "url('/ep/render/fonts/anton.woff2')"),
      new FontFace('Archivo Black', "url('/ep/render/fonts/archivo-black.woff2')"),
      new FontFace('Inter', "url('/ep/render/fonts/inter-800.woff2')", { weight: '800' }),
    ];
    for (const f of faces) { await f.load(); document.fonts.add(f); }
    const imgs = ['/ep/render/assets/basemap.jpg', '/ep/render/assets/grain.png', ...CARDS.map((c) => '/img/' + c.img)];
    await Promise.all(imgs.map((u) => { const im = new Image(); im.src = u; return im.decode().catch(() => {}); }));
  })();
  window.S24 = { P, LL, get T() { return T; } };
})();
