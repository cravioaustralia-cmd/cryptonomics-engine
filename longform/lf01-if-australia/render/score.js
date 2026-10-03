/* lf01 IF AUSTRALIA — the score: camera, looks, overlays, B-roll zoom-throughs, SFX and music cues.
 * Pure (no DOM): the browser calls SCORE.frame(t); Node reads SCORE.broll / .sfx / .music / .anchors.
 *
 * Source of truth: script/script.md Part 2. Every beat below quotes its Part 2 map line.
 * Timing: A(id, phrase, frac) returns the Whisper start of a phrase the script says is spoken
 * (Part 2 cue words), or — until VO lands — the provisional fraction `frac` of that chunk's window.
 * Each anchor is logged to SCORE.anchors so the retune report can show heard / provisional.
 */
(function (G) {
  const M = G.MAP, X = G.FX;
  const { P, camTrack, track, clamp, lerp, sstep, ease, km, gc, scale } = M;
  const { C, f2 } = X;

  /* ---------------------------------------------------------------- places (lon, lat) */
  const PL = {
    tokyo: [139.69, 35.69], darwin: [130.84, -12.46], darwinCoast: [130.93, -12.33], singapore: [103.82, 1.35],
    hongKong: [114.17, 22.3], malaya: [102.1, 3.9], pearl: [-157.95, 21.36], sydney: [151.21, -33.87],
    sydneyHarbour: [151.245, -33.848], brisbane: [153.03, -27.47], melbourne: [144.96, -37.81], newcastle: [151.78, -32.93],
    perth: [115.86, -31.95], adelaide: [138.6, -34.93], birdum: [133.21, -15.65], alice: [133.88, -23.7], portAugusta: [137.77, -32.49],
    gap: [133.62, -19.6], melville: [130.95, -11.6], melvilleBeach: [130.64, -11.42], moresby: [147.18, -9.44], kokoda: [147.74, -8.88],
    milneBay: [150.45, -10.35], coralSea: [154.6, -15.4], midway: [-177.37, 28.21], fiji: [178.2, -17.9], samoa: [-171.9, -13.9],
    newCaledonia: [165.7, -21.4], sanFrancisco: [-122.42, 37.77], usa: [-99, 39.5], washington: [-77.04, 38.9], canberra: [149.13, -35.28],
    wellington: [174.78, -41.29], middleEast: [36.0, 31.0], britain: [-1.5, 52.6], europe: [12.5, 45.5], rabaul: [152.2, -4.2],
    truk: [151.8, 7.4], ocean: [158.5, -19.5], supplyPin: [156.6, -18.2], cityPin: [151.21, -33.87], harbourPin: [151.245, -33.848],
    northAus: [132.5, -14.5], hawaii: [-157.9, 21.3], timor: [125.6, -9.3], newGuinea: [143.5, -6.0], china: [114, 31],
  };

  /* Japanese-held sphere, early 1942 (approximate wash, land and sea), revealed from Tokyo outward */
  const EMPIRE = [[119, 53.5], [128, 52], [135, 49], [143, 47.5], [150, 48], [156, 50], [160, 44], [163, 32], [167, 20], [173, 10],
    [177, 1.5], [174, -2.5], [162, -4.5], [156, -6.8], [152.5, -6.6], [148.5, -7.5], [146, -6.2], [141, -3.2], [135, -4.4], [131, -8.2],
    [127.5, -10.3], [122, -10.8], [116, -9.6], [106, -8.3], [101.5, -5.4], [96.2, -1.2], [94, 4.5], [92.6, 10.5], [94.6, 16.5], [97, 19.6],
    [100, 21.2], [103.5, 23.2], [107.5, 25.5], [111.5, 30.5], [112.2, 35.5], [115.5, 40], [117.5, 44], [118.5, 49]];

  /* rail and road: approximate alignments (North Australia Railway to Birdum, Central Australia
     Railway to Alice Springs, the north–south road through the gap) */
  const RAIL_N = [[130.84, -12.46], [130.98, -12.69], [131.1, -13.22], [131.45, -13.45], [131.83, -13.82], [132.26, -14.47], [132.7, -14.75], [133.07, -14.92], [133.2, -15.3], [133.21, -15.65]];
  const RAIL_S = [[137.77, -32.49], [138.03, -32.35], [138.42, -31.89], [138.32, -30.6], [138.06, -29.65], [137.0, -28.9], [136.2, -28.0], [135.45, -27.55], [134.9, -26.5], [134.58, -25.57], [134.3, -24.7], [133.88, -23.7]];
  const ROAD = [[133.88, -23.7], [133.95, -22.4], [134.4, -21.5], [134.19, -19.65], [133.7, -18.6], [133.4, -17.6], [133.37, -16.25], [133.21, -15.65]];
  const LIFELINE = [[-122.42, 37.77], [-140, 30.5], [-157.9, 21.3], [-166, 4], [-171.9, -13.9], [178.2, -17.9], [165.7, -21.4], [153.03, -27.47]];
  const KOKODA = [[148.25, -8.66], [148.0, -8.78], [147.74, -8.88], [147.7, -8.98], [147.66, -9.12], [147.58, -9.2], [147.5, -9.26], [147.42, -9.29], [147.32, -9.36]];

  function geoCircle(c, rKm, n = 120) {
    const out = [], R = 6371, d = rKm / R, la1 = c[1] * Math.PI / 180, lo1 = c[0] * Math.PI / 180;
    for (let i = 0; i <= n; i++) {
      const b = (i / n) * 2 * Math.PI;
      const la2 = Math.asin(Math.sin(la1) * Math.cos(d) + Math.cos(la1) * Math.sin(d) * Math.cos(b));
      const lo2 = lo1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la1), Math.cos(d) - Math.sin(la1) * Math.sin(la2));
      out.push([lo2 * 180 / Math.PI, Math.max(-84, Math.min(84, la2 * 180 / Math.PI))]);
    }
    return out;
  }
  function gcPath(a, b, n = 48) { const o = []; for (let i = 0; i <= n; i++) o.push(gc(a[0], a[1], b[0], b[1], i / n)); return o; }
  function densify(pts, n = 8) { const o = []; for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < n; k++) o.push(gc(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], k / n)); o.push(pts[pts.length - 1]); return o; }

  function buildScore(T, GEO) {
    const S = Object.fromEntries(T.segments.map((s) => [s.id, s]));
    const CK = [], LK = { night: [], desat: [], warm: [], dim: [] }, ITEMS = [], BROLL = [], SFX = [], MUS = [], ANCH = [];
    const key = (t, ll, z, o = {}) => CK.push({ t, lon: ll[0], lat: ll[1], z, ...o });
    const look = (ch, t, v, e) => LK[ch].push({ t, v, ease: e });
    const add = (t0, t1, draw, z = 0) => ITEMS.push({ t0, t1, draw, z });
    const sfx = (name, t, db = 0, o = {}) => SFX.push({ name, t: +t.toFixed(3), db, ...o });
    const mus = (t, cue, o = {}) => MUS.push({ t: +t.toFixed(3), cue, ...o });

    /* --- anchors ---------------------------------------------------------------------- */
    const norm = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
    function A(id, phrase, frac, opt = false) {
      const s = S[id];
      const toks = norm(phrase);
      if (s.words && s.words.length) {
        const stream = [];
        s.words.forEach((w, wi) => norm(w.w).forEach((tk) => stream.push({ tk, wi })));
        for (let i = 0; i + toks.length <= stream.length; i++) {
          if (toks.every((tk, j) => stream[i + j].tk === tk)) {
            const t = s.words[stream[i].wi].s;
            ANCH.push({ id, phrase, t, how: 'heard' });
            return t;
          }
        }
        if (opt) { ANCH.push({ id, phrase, t: null, how: 'not heard (skipped)' }); return null; }
        const t = s.start + frac * s.dur;
        ANCH.push({ id, phrase, t, how: 'not heard: fraction fallback' });
        return t;
      }
      if (opt) { ANCH.push({ id, phrase, t: null, how: 'provisional: optional cue skipped' }); return null; }
      const t = s.start + frac * s.dur;
      ANCH.push({ id, phrase, t, how: 'provisional fraction' });
      return t;
    }
    const F = (id, frac) => S[id].start + frac * S[id].dur; // un-worded positions inside a chunk

    /* --- shared drawing helpers --------------------------------------------------------- */
    const fio = (t, t0, t1, fi = 0.4, fo = 0.4) => clamp(Math.min((t - t0) / fi, (t1 - t) / fo), 0, 1);
    const prog = (t, t0, d) => clamp((t - t0) / d, 0, 1);
    function pathD(ctx, ring, close = true) {
      let d = '', prev = null;
      for (const ll of ring) {
        const p = ctx.P(ll);
        if (prev && Math.abs(p[0] - prev[0]) > M.scale(ctx.c) * 0.5) { d += `M${f2(p[0])} ${f2(p[1])}`; }
        else d += (d ? 'L' : 'M') + f2(p[0]) + ' ' + f2(p[1]);
        prev = p;
      }
      return d + (close ? 'Z' : '');
    }
    const scr = (ctx, pts) => pts.map((ll) => ctx.P(ll));
    const ausPath = (ctx) => GEO.aus.map((r) => pathD(ctx, r)).join('');
    function placeLabel(ll, text, t0, t1, o = {}) {
      add(t0, t1, (ctx) => { const p = ctx.P(ll); return X.label(p[0] + (o.dx || 0), p[1] + (o.dy ?? 40), text, { size: o.size || 26, o: fio(ctx.t, t0, t1, 0.35, 0.45) * (o.o ?? 1), font: o.font, fill: o.fill, anchor: o.anchor }); }, o.z || 5);
    }
    function dropPin(ll, t0, t1, o = {}) {
      add(t0, t1, (ctx) => { const p = ctx.P(ll); return X.pin(p[0], p[1], { u: prog(ctx.t, t0, 0.7), color: o.color, o: fio(ctx.t, t0, t1, 0.05, 0.4), size: o.size, pulse: o.pulse ? (ctx.t - t0) * 0.8 : 0 }); }, o.z || 6);
      if (o.thunk !== false) sfx('thunk', t0 + 0.3, o.db ?? -8);
    }
    function zoomThrough(id, ll, tIn, dur, hold, out, o = {}) {
      // 1. camera zooms fast into the pin  2. pin flares (0.3 s) into the clip  3. clip plays  4. shrinks back, camera pulls out
      const zPin = o.zPin || 9.4, appr = o.appr || 0.95;
      key(tIn - appr, hold.ll, hold.z, { mode: 'glide', ease: 'io2' });
      key(tIn, ll, zPin, { mode: 'fly', ease: 'in2', rho: 1.2 });
      key(tIn + dur - 0.4, ll, zPin + 0.45, { mode: 'glide', ease: 'lin' });
      key(tIn + dur + (out.d || 1.3), out.ll, out.z, { mode: 'fly', ease: 'out', rho: 1.2 });
      add(tIn - 0.25, tIn + 0.4, (ctx) => { const p = ctx.P(ll); return X.flare(p[0], p[1], (ctx.t - (tIn - 0.25)) / 0.65); }, 40);
      add(tIn + dur - 0.35, tIn + dur + 0.35, (ctx) => { const p = ctx.P(ll); return X.flare(p[0], p[1], 1 - (ctx.t - (tIn + dur - 0.35)) / 0.7); }, 40);
      BROLL.push({ id, t: +tIn.toFixed(3), dur, ll, beat: o.beat });
      sfx('zoom_in', tIn - appr + 0.1, -16);
      return tIn + dur;
    }
    const VIEW = {
      night: { ll: [142, 22], z: 1.75 }, japan: { ll: [139.0, 35.6], z: 6.3 }, japanAus: { ll: [137, 10], z: 3.65 },
      threeArrows: { ll: [152, 6], z: 3.45 }, asiaPac: { ll: [152, 12], z: 3.5 }, seAsia: { ll: [113, 8], z: 4.35 },
      northIslands: { ll: [128, -8], z: 4.3 }, mideast: { ll: [88, 6], z: 3.15 }, topEnd: { ll: [131.6, -11.9], z: 6.6 },
      aus: { ll: [137, -25.5], z: 4.55 }, pacificUS: { ll: [190, 2], z: 2.85 }, tokyo: { ll: [139.7, 35.2], z: 6.0 },
      china: { ll: [123, 12], z: 3.6 }, pacificJA: { ll: [142, 10], z: 3.6 }, topEnd2: { ll: [131.8, -12.3], z: 6.4 },
      topEndWide: { ll: [131.8, -11.2], z: 5.6 }, interior: { ll: [134.2, -22.0], z: 4.95 }, interiorN: { ll: [133.4, -17.5], z: 5.25 },
      melville: { ll: [130.85, -11.55], z: 8.1 }, eastCoast: { ll: [150, -26], z: 4.55 }, coral: { ll: [151, -12], z: 5.0 },
      world: { ll: [112, 5], z: 2.3 }, ausMid: { ll: [137, -26.5], z: 4.45 }, pacificWhole: { ll: [195, -4], z: 2.85 },
      pngQld: { ll: [147.5, -14], z: 4.85 }, isolated: { ll: [152, -12], z: 2.85 }, sydNew: { ll: [151.45, -33.4], z: 7.7 },
      png: { ll: [147.75, -9.05], z: 8.35 }, pacificWin: { ll: [178, 5], z: 2.75 }, worldMig: { ll: [108, 8], z: 2.2 },
    };
    const Vk = (t, v, o = {}) => key(t, v.ll, v.z, o);

    /* =============================================================== COLD OPEN */
    // V01 Map: frame 1 is already moving. The camera dives from space onto a night map of Japan and a pin drops on
    // Tokyo. On "admirals", a zoom-through into B01. Sound: low drone from frame 1, deep boom on "invade Australia".
    {
      const s = S.V01;
      look('night', 0, 1); look('desat', 0, 0); look('warm', 0, 0); look('dim', 0, 0);
      key(0, [150, 18], 1.55, { mode: 'glide' });
      key(0.6, [146, 26], 2.2, { mode: 'glide', ease: 'in2' });
      Vk(s.start + 2.3, VIEW.japan, { mode: 'fly', ease: 'out', rho: 1.1 });
      // altitude: dark space vignette + clouds rushing past
      add(0, 2.6, (ctx) => {
        const t = ctx.t, k = clamp(t / 2.4, 0, 1);
        const clouds = [0, 1].map((i) => {
          const sc = lerp(0.9 + i * 0.5, 4.2 + i * 2.4, ease.in2(k)), a = (1 - k) * (i ? 0.75 : 0.95) * clamp(t / 0.01, 0, 1);
          const w = 2400 * sc, h = 1600 * sc;
          return `<image href="/ep/assets/clouds.png" x="${f2(960 - w / 2 + (i ? -120 : 140) * sc)}" y="${f2(540 - h / 2 + (i ? 80 : -60) * sc)}" width="${f2(w)}" height="${f2(h)}" opacity="${f2(a)}"/>`;
        }).join('');
        return `<rect width="1920" height="1080" fill="url(#gSpace)" opacity="${f2(1 - ease.out(k))}"/>${clouds}`;
      }, 50);
      const tPin = s.start + 2.0;
      dropPin(PL.tokyo, tPin, s.start + 6.5, { db: -10 });
      placeLabel(PL.tokyo, 'Tokyo', tPin + 0.3, s.start + 6.5, { size: 30, fill: '#f1e6cb', dy: 46 });
      const tB = A('V01', 'admirals', 0.45);
      zoomThrough('B01', PL.tokyo, Math.max(tB, s.start + 2.6), 4, VIEW.japan, { ...VIEW.japanAus, d: 1.6 }, { beat: 'V01' });
      sfx('drone', 0, -4, { len: S.V03.gapEnd + 0.5, fadeOut: 1.2 });
      sfx('boom', A('V01', 'invade Australia', 0.82), -2);
      mus(0, 'tension', { level: 'bed' });
    }

    // V02 Map: a red arrow draws from Tokyo south across the Pacific and hovers over northern Australia. On
    // "rejected", a red "REJECTED" stamp slams onto the map and the arrow retracts. Music cuts out, stamp thud.
    const MAIN = () => [PL.tokyo, PL.northAus];
    const mainPts = (ctx) => X.curve(ctx.P(PL.tokyo), ctx.P(PL.northAus), -0.22, 60);
    {
      const s = S.V02;
      Vk(s.start + 0.8, VIEW.japanAus, { mode: 'glide', ease: 'out' });
      Vk(s.gapEnd, { ll: [137.5, 7], z: 3.72 }, { mode: 'glide', ease: 'lin' });
      const tR = A('V02', 'rejected', 0.86);
      const tA = Math.min(s.start + 0.3, tR - 3);
      add(tA, tR + 0.9, (ctx) => {
        const t = ctx.t;
        const u = t < tR + 0.25 ? ease.io(prog(t, tA, 2.6)) : 1 - ease.in2(prog(t, tR + 0.25, 0.6));
        const hover = t > tA + 2.6 && t < tR ? 0.5 + 0.5 * Math.sin((t - tA) * 5) : 0;
        return X.arrow(mainPts(ctx), u, { width: 16, glow: hover * 0.8 });
      }, 10);
      add(tR, S.V03.start + 0.6, (ctx) => X.stamp(960, 520, 'REJECTED', ctx.t - tR, { size: 120, o: fio(ctx.t, tR - 1, S.V03.start + 0.6, 0.1, 0.5) }), 30);
      sfx('stamp', tR, -1);
      mus(tR, 'cut');
    }

    // V03 Map: the arrow re-extends, and dozens of small ship icons fill the sea between Japan and Australia.
    // Edit gap 1.5 s: the music swells back in.
    const SHIPS = [];
    {
      let seed = 7;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const boxes = [[128.5, 14, 144, 30, 14], [140, 1, 160, 13, 14], [133, 3, 147, 13, 6], [148, 14, 160, 26, 6]];
      for (const [w, s_, e, n, cnt] of boxes) for (let i = 0; i < cnt; i++) SHIPS.push([lerp(w, e, rnd()), lerp(s_, n, rnd()), rnd()]);
    }
    {
      const s = S.V03;
      Vk(s.gapEnd + 0.5, { ll: [140, 9], z: 3.85 }, { mode: 'glide', ease: 'lin' });
      add(s.start, S.V04.start + 0.2 * S.V04.dur + 0.4, (ctx) => {
        const t = ctx.t;
        const u = ease.io(prog(t, s.start + 0.15, 1.6));
        const fade = 1 - prog(t, S.V04.start + 0.2 * S.V04.dur, 0.4);
        return X.arrow(mainPts(ctx), u, { width: 16, o: fade });
      }, 10);
      const t0 = s.start + 1.2, t1 = S.V04.gapEnd + 0.6;
      add(t0, t1, (ctx) => {
        let o = '';
        SHIPS.forEach(([lo, la, r], i) => {
          const ti = t0 + (i / SHIPS.length) * Math.min(3.2, s.dur - 1.4);
          if (ctx.t < ti) return;
          const drift = (ctx.t - ti) * 0.07;
          const p = ctx.P([lo - drift * 0.7, la - drift]);
          const k = ease.back(prog(ctx.t, ti, 0.35));
          o += X.ship(p[0], p[1], { s: 0.62 * k, rot: -28 + r * 10, o: fio(ctx.t, ti, t1, 0.15, 0.6) * 0.95, wake: true });
        });
        return o;
      }, 8);
      mus(s.end, 'swell', { cue: 'tension', fade: 1.4 });
    }

    // V04 Map: the arrow splits into three dotted arrows labelled 1, 2 and 3, each pulsing as it's mentioned.
    // Arrow 3 glows red on "most dangerous of all" (ONLY if Whisper hears it; otherwise pulse on the title gap).
    // Edit gap 2.5 s: the "IF AUSTRALIA…" title builds on the map with the series sting.
    const SPLIT = [138.5, 0.5];
    const ARR = { 1: [PL.darwin[0] + 0.6, PL.darwin[1] - 0.6], 2: [152.9, -27.6], 3: [174, -16.5] };
    const arrowSet = (ctx, which, u, o = {}) => {
      const a = ctx.P(SPLIT), b = ctx.P(ARR[which]);
      const bend = { 1: 0.12, 2: -0.1, 3: -0.18 }[which];
      const pts = X.curve(a, b, bend, 40);
      let s = X.arrow(pts, u, { width: 11, dotted: true, glow: o.glow || 0, o: o.o ?? 1, color: o.color, dk: o.dk });
      if (u > 0.95) {
        const q = pts[pts.length - 1], pul = o.pulse || 0;
        const r = 26 * (1 + 0.25 * pul);
        s += `<g opacity="${f2((o.o ?? 1) * clamp((u - 0.95) / 0.05, 0, 1))}"><circle cx="${f2(q[0])}" cy="${f2(q[1] - 44)}" r="${f2(r)}" fill="${C.paper}" stroke="${C.red}" stroke-width="${f2(3 + 3 * pul)}"/>
          <text x="${f2(q[0])}" y="${f2(q[1] - 33)}" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="${f2(32 * (1 + 0.2 * pul))}" fill="${C.redDk}">${which}</text></g>`;
      }
      return s;
    };
    const stemPts = (ctx) => X.curve(ctx.P(PL.tokyo), ctx.P(SPLIT), -0.12, 30);
    {
      const s = S.V04;
      Vk(s.start + 2.2, VIEW.threeArrows, { mode: 'glide', ease: 'io' });
      Vk(s.end, { ll: [151, 3], z: 3.55 }, { mode: 'glide', ease: 'lin' });
      Vk(s.gapEnd, { ll: [150, 2], z: 3.62 }, { mode: 'glide', ease: 'lin' });
      const tS = s.start + 0.2 * s.dur;
      const pulses = { 1: F('V04', 0.42), 2: F('V04', 0.56), 3: F('V04', 0.7) };
      const tDanger = A('V04', 'most dangerous of all', 0, true);
      const tGlow3 = tDanger ?? s.end + 0.3; // fallback: pulse arrow 3 on the title gap, no words invented
      const tEnd = S.V05.start + 1.2;
      add(tS - 0.2, tEnd, (ctx) => {
        const t = ctx.t, fade = 1 - prog(t, s.end + 0.2, 0.9) * 0.55 - prog(t, S.V05.start, 1.0) * 0.45;
        let o = X.arrow(stemPts(ctx), 1, { width: 13, o: fade, head: 0.001 });
        for (const n of [1, 2, 3]) {
          const u = ease.io(prog(t, tS + (n - 1) * 0.35, 1.5));
          const pu = Math.max(0, Math.sin(clamp((t - pulses[n]) / 1.2, 0, 1) * Math.PI));
          const g3 = n === 3 ? Math.max(0, Math.sin(clamp((t - tGlow3) / 2.2, 0, 1) * Math.PI)) : 0;
          o += arrowSet(ctx, n, u, { o: fade, pulse: Math.max(pu, g3), glow: Math.max(pu * 0.6, g3 * 1.4) });
        }
        return o;
      }, 10);
      // series title build in the gap (the badge mark, not a recap of narration)
      const tT = s.end + 0.05, tTend = S.V05.start + 0.9;
      add(tT, tTend, (ctx) => titleBuild(ctx.t - tT, fio(ctx.t, tT, tTend, 0.05, 0.6), 1), 60);
      look('night', s.end, 1); look('night', s.gapEnd + 0.3, 0, 'io2');
      sfx('sting_series', tT, -3);
      mus(s.end, 'duck', { to: -30, fade: 0.4 });
    }

    /* ---- series title: "IF AUSTRALIA…" stamped letter by letter, rule draws, ellipsis dots pop */
    function titleBuild(lt, a, size) {
      if (a <= 0) return '';
      const word1 = 'IF', word2 = 'AUSTRALIA';
      let s = `<g opacity="${f2(a)}" transform="translate(960 470) scale(${f2(size)})">`;
      const plate = ease.out(clamp(lt / 0.35, 0, 1));
      s += `<rect x="${f2(-560 * plate)}" y="-120" width="${f2(1120 * plate)}" height="230" fill="rgba(241,230,203,0.82)" stroke="${C.ink}" stroke-width="3"/>
            <rect x="${f2(-544 * plate)}" y="-104" width="${f2(1088 * plate)}" height="198" fill="none" stroke="${C.red}" stroke-width="2"/>`;
      const letters = (word1 + ' ' + word2).split('');
      const adv = 74, x0 = -((letters.length - 1) * adv) / 2 - 40;
      letters.forEach((ch, i) => {
        if (ch === ' ') return;
        const ti = 0.25 + i * 0.075, k = clamp((lt - ti) / 0.12, 0, 1);
        if (k <= 0) return;
        const sc = lerp(2.2, 1, ease.in2(k));
        s += `<text x="0" y="0" transform="translate(${f2(x0 + i * adv)} 44) scale(${f2(sc)})" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="128" fill="${i < 2 ? C.red : C.ink}" opacity="${f2(k)}">${ch}</text>`;
      });
      for (let d = 0; d < 3; d++) {
        const k = clamp((lt - 1.25 - d * 0.12) / 0.12, 0, 1);
        if (k > 0) s += `<circle cx="${f2(x0 + 11 * adv - 10 + d * 30)}" cy="34" r="${f2(9 * ease.back(k))}" fill="${C.red}"/>`;
      }
      const rule = ease.io(clamp((lt - 1.0) / 0.6, 0, 1));
      s += `<line x1="${f2(-420 * rule)}" y1="78" x2="${f2(420 * rule)}" y2="78" stroke="${C.ink}" stroke-width="3"/>`;
      return s + '</g>';
    }

    /* =============================================================== ACT 1 */
    // V05 Map: pull back to Asia and the Pacific. A red tide spreads south with date labels. A Pearl Harbor pin with
    // an animated smoke icon, then pins dropping with a thunk on Hong Kong, Malaya and Singapore.
    // (The "Hong Kong falls. Malaya falls." words are not in the visible script; the MAP line asks for the pins.)
    const tideR = track([]); // placeholder, replaced below
    const TIDE = [];
    const tideAt = (t) => { let r = 0; for (const k of TIDE) if (t >= k.t) r = k.r; return r; };
    {
      const s = S.V05;
      Vk(s.start + 2.0, VIEW.asiaPac, { mode: 'fly', ease: 'io' });
      const tPH = A('V05', 'Pearl Harbor', 0.22);
      const tHK = A('V05', 'Hong Kong', 0.5), tMY = A('V05', 'Malaya', 0.6), tSG = A('V05', 'Singapore', 0.8);
      Vk(tPH + 2.4, { ll: [148, 13], z: 3.6 }, { mode: 'glide', ease: 'io' });
      Vk(tHK - 0.6, VIEW.seAsia, { mode: 'fly', ease: 'io' });
      Vk(s.end + 0.3, { ll: [110, 5], z: 4.6 }, { mode: 'glide', ease: 'io' });
      // tide radius (km from Tokyo): grows through the beat
      const tideKeys = [{ t: s.start + 0.6, v: 2800 }, { t: tPH + 0.6, v: 3300 }, { t: tHK + 0.4, v: 3900, ease: 'io2' }, { t: tSG + 0.3, v: 5450, ease: 'io2' },
        { t: S.V07.start + 1.5, v: 5450 }, { t: S.V07.start + 0.35 * S.V07.dur, v: 6900, ease: 'io' }];
      const tr = track(tideKeys, 0);
      add(s.start + 0.6, S.V07.end, (ctx) => tide(ctx, tr(ctx.t), fio(ctx.t, s.start + 0.6, S.V07.end, 0.8, 1.0)), 2);
      add(S.V08.start, S.V10.end, (ctx) => tide(ctx, 6900, 0.75 * fio(ctx.t, S.V08.start, S.V10.end, 0.6, 1.0)), 2);
      dropPin(PL.pearl, tPH, S.V06.start, { size: 0.9 });
      add(tPH + 0.4, S.V06.start, (ctx) => { const p = ctx.P(PL.pearl); return X.smoke(p[0] + 4, p[1] - 30, ctx.t, { o: fio(ctx.t, tPH + 0.4, S.V06.start, 0.5, 0.5) }); }, 7);
      placeLabel(PL.pearl, 'Pearl Harbor', tPH + 0.3, S.V06.start, { dy: 36 });
      add(tPH + 0.6, S.V06.start, (ctx) => { const p = ctx.P(PL.pearl); return X.tag(p[0], p[1] + 92, 'DEC 1941', prog(ctx.t, tPH + 0.6, 0.8), { size: 24, o: fio(ctx.t, tPH + 0.6, S.V06.start, 0.1, 0.4) }); }, 8);
      dropPin(PL.hongKong, tHK, S.V07.start + 1.0);
      placeLabel(PL.hongKong, 'Hong Kong', tHK + 0.3, S.V07.start + 1.0, { dy: 36 });
      dropPin(PL.malaya, tMY, S.V07.start + 1.0);
      placeLabel(PL.malaya, 'Malaya', tMY + 0.3, S.V07.start + 1.0, { dx: -70, dy: 6 });
      dropPin(PL.singapore, tSG, S.V07.start + 1.0, { db: -6 });
      placeLabel(PL.singapore, 'Singapore', tSG + 0.3, S.V07.start + 1.0, { dy: 38 });
      add(tSG + 0.8, S.V06.start + 1.0, (ctx) => { const p = ctx.P(PL.singapore); return X.tag(p[0] + 150, p[1] + 20, 'FEB 1942', prog(ctx.t, tSG + 0.8, 0.8), { size: 24, o: fio(ctx.t, tSG + 0.8, S.V06.start + 1.0, 0.1, 0.4) }); }, 8);
      mus(s.start - 0.2, 'act1', { level: 'bed' });
    }
    function tide(ctx, rKm, a) {
      if (a <= 0 || rKm <= 0) return '';
      const circ = pathD(ctx, geoCircle(PL.tokyo, rKm, 160));
      const poly = pathD(ctx, EMPIRE);
      return `<defs><clipPath id="cTide"><path d="${circ}"/></clipPath><clipPath id="cEmp"><path d="${poly}"/></clipPath></defs>
        <g opacity="${f2(a)}">
          <path d="${poly}" fill="url(#pHatch)" stroke="${C.red}" stroke-width="2.5" stroke-dasharray="10 6" clip-path="url(#cTide)"/>
          <path d="${circ}" fill="none" stroke="${C.red}" stroke-width="7" opacity="0.55" filter="url(#fGlow)" clip-path="url(#cEmp)"/>
          <path d="${circ}" fill="none" stroke="${C.redDk}" stroke-width="2.5" clip-path="url(#cEmp)"/>
        </g>`;
    }

    // V06 Map: zoom-through into the Singapore pin. B02 (4 s). Sound: the music drops to a single low note.
    // Edit gap 2 s (B02 finishes, then pull back to the map). Grim beat → desaturate.
    {
      const s = S.V06;
      const tIn = Math.max(s.start + 0.8, s.gapEnd - 0.7 - 4);
      zoomThrough('B02', PL.singapore, tIn, 4, { ll: [106, 3], z: 5.2 }, { ...VIEW.northIslands, d: 1.6 }, { beat: 'V06' });
      look('desat', s.start, 0); look('desat', s.start + 0.8, 0.7); look('desat', s.gapEnd, 0.7); look('desat', S.V07.start + 1.4, 0);
      mus(s.start, 'lownote');
    }

    // V07 Map: the red tide reaches the islands north of Australia, which sits pale below. Counters appear one by
    // one: "Population: ~7 million", "Coastline: 30,000+ km". Small blue soldier icons far away in the Middle East.
    {
      const s = S.V07;
      Vk(s.start + 0.45 * s.dur, { ll: [131, -16], z: 4.15 }, { mode: 'glide', ease: 'io' });
      Vk(s.start + 0.72 * s.dur, VIEW.mideast, { mode: 'fly', ease: 'io' });
      Vk(s.end, { ll: [92, 2], z: 3.2 }, { mode: 'glide', ease: 'lin' });
      add(s.start, S.V08.start + 1.5, (ctx) => {
        const a = fio(ctx.t, s.start + 0.8, S.V08.start + 1.5, 1.2, 0.8);
        return `<path d="${ausPath(ctx)}" fill="rgba(250,244,226,0.55)" stroke="rgba(250,244,226,0.9)" stroke-width="5" opacity="${f2(a)}"/>`;
      }, 3);
      const tc1 = F('V07', 0.38), tc2 = F('V07', 0.52), tEndC = s.start + 0.7 * s.dur;
      add(tc1, tEndC, (ctx) => { const p = ctx.P([133.5, -22.5]); return X.tag(p[0], p[1] - 40, 'Population: ~7 million', prog(ctx.t, tc1, 1.0), { size: 30, o: fio(ctx.t, tc1, tEndC, 0.1, 0.5) }); }, 20);
      add(tc2, tEndC, (ctx) => { const p = ctx.P([133.5, -22.5]); return X.tag(p[0] + 20, p[1] + 40, 'Coastline: 30,000+ km', prog(ctx.t, tc2, 1.0), { size: 30, o: fio(ctx.t, tc2, tEndC, 0.1, 0.5), rot: 1.0 }); }, 20);
      const tMe = s.start + 0.7 * s.dur;
      add(tMe, S.V08.start + 1.2, (ctx) => {
        let o = '';
        const pos = [[33.2, 30.6], [35.0, 31.6], [36.6, 33.2], [34.2, 29.2], [37.8, 31.0], [31.6, 30.3]];
        pos.forEach((ll, i) => { const p = ctx.P(ll); o += X.soldier(p[0], p[1], { s: 0.95 * ease.back(prog(ctx.t, tMe + 0.4 + i * 0.12, 0.35)), o: fio(ctx.t, tMe, S.V08.start + 1.2, 0.2, 0.4) }); });
        return o;
      }, 9);
      placeLabel(PL.middleEast, 'Middle East', tMe + 0.6, S.V08.start + 1.2, { dy: 70, size: 30 });
    }

    // V08 Map: plane icons sweep down onto Darwin, then a zoom-through into the Darwin pin. B03 (5 s).
    // Sound: air-raid siren fades in and peaks, distant explosions (no screams).
    // Edit gap 2.5 s: the siren fades as the camera pulls back; the map desaturates briefly.
    {
      const s = S.V08;
      Vk(s.start + 1.6, VIEW.topEnd, { mode: 'fly', ease: 'io' });
      const tD = A('V08', 'Darwin', 0.32);
      const tPl = s.start + 0.9;
      add(tPl, tD + 2.2, (ctx) => {
        let o = '';
        for (let i = 0; i < 9; i++) {
          const row = Math.floor(i / 3), col = i % 3;
          const f = ease.io(prog(ctx.t, tPl + row * 0.2, (tD + 0.6) - tPl));
          const from = [126.2 + col * 0.8 - row * 0.5, -8.4 - row * 0.5 + col * 0.25], to = [130.6 + col * 0.25, -12.3 - row * 0.12];
          const ll = [lerp(from[0], to[0], f), lerp(from[1], to[1], f)];
          const p = ctx.P(ll);
          o += X.plane(p[0], p[1], { s: 0.9, rot: 128, o: fio(ctx.t, tPl, tD + 2.2, 0.3, 0.6) });
        }
        return o;
      }, 12);
      dropPin(PL.darwin, tD, S.V09.start, { db: -7 });
      placeLabel(PL.darwin, 'Darwin', tD + 0.3, S.V09.start, { dy: 40, size: 32 });
      for (let i = 0; i < 6; i++) {
        const tb = tD + 0.7 + i * 0.22, ll = [130.8 + ((i * 37) % 7) * 0.05, -12.42 + ((i * 53) % 5) * 0.025];
        add(tb, tb + 0.9, (ctx) => { const p = ctx.P(ll); return X.burst(p[0], p[1], (ctx.t - tb) / 0.9, { seed: i, r: 30 }); }, 11);
      }
      const tIn = Math.max(tD + 2.0, s.gapEnd - 1.4 - 5);
      zoomThrough('B03', PL.darwin, tIn, 5, VIEW.topEnd, { ...VIEW.aus, d: 2.0 }, { beat: 'V08', zPin: 9.6 });
      sfx('siren', s.start + 0.6, -6, { len: (tIn + 5 + 1.0) - (s.start + 0.6), fadeIn: 1.8, fadeOut: 1.8 });
      [0.6, 1.7, 2.6, 3.8].forEach((d, i) => sfx('explosion_far', tIn + d, -9 - i, { v: i }));
      look('desat', tIn + 4.8, 0); look('desat', tIn + 5.4, 0.8); look('desat', s.gapEnd + 0.2, 0.8); look('desat', S.V09.start + 1.6, 0);
      mus(s.start, 'duck', { to: -9, fade: 1.0 });
    }

    // V09 Map: an ARCHIVE photo of John Curtin pops up as a framed card pinned to Australia, with a newspaper icon
    // unfolding beside it. On "look to America", a blue line draws across the Pacific to the United States.
    {
      const s = S.V09;
      const tAm = A('V09', 'look to America', 0.7);
      Vk(tAm - 0.3, { ll: [140, -24], z: 4.4 }, { mode: 'glide', ease: 'lin' });
      Vk(tAm + 2.2, VIEW.pacificUS, { mode: 'fly', ease: 'io' });
      Vk(s.gapEnd, { ll: [186, 4], z: 2.95 }, { mode: 'glide', ease: 'lin' });
      const tc = s.start + 0.3;
      dropPin(PL.canberra, tc - 0.2, s.gapEnd + 0.3, { color: C.blue, size: 0.8 });
      add(tc, s.gapEnd + 0.4, (ctx) => {
        const p = ctx.P(PL.canberra), z = ctx.c.z, k = clamp(Math.pow(2, (z - 4.4) * 0.55), 0.5, 1);
        const a = fio(ctx.t, tc, s.gapEnd + 0.4, 0.1, 0.5);
        const card = X.photoCard(0, 0, prog(ctx.t, tc, 0.6), { href: G.CURTIN_IMG || null, caption: 'John Curtin', w: 300, h: 370, o: a });
        const paper = X.newspaper(250, 40, prog(ctx.t, tc + 0.8, 0.9), { o: a });
        return `<g transform="translate(${f2(p[0] - 250 * k)} ${f2(p[1] - 270 * k)}) scale(${f2(k)})">${card}${paper}</g>
          <line x1="${f2(p[0])}" y1="${f2(p[1] - 30)}" x2="${f2(p[0] - 250 * k)}" y2="${f2(p[1] - 90 * k)}" stroke="${C.ink}" stroke-width="2" opacity="${f2(a * 0.7)}" stroke-dasharray="4 4"/>`;
      }, 25);
      const line = gcPath(PL.sydney, PL.usa, 60);
      add(tAm, S.V10.start + 1.0, (ctx) => X.line(scr(ctx, line), ease.io(prog(ctx.t, tAm, 2.0)), { color: C.blue, width: 7, under: 'rgba(241,230,203,0.8)', glow: 0.8, o: fio(ctx.t, tAm, S.V10.start + 1.0, 0.1, 0.6) }), 15);
      placeLabel(PL.usa, 'United States', tAm + 1.6, S.V10.start + 1.0, { dy: 6, size: 30 });
      mus(s.start - 0.3, 'story', { level: 'bed' });
    }

    // V10 Map: zoom back to Tokyo. Two icons, an anchor (Navy) and a helmet (Army), with a crackle between them.
    // Counters: "Divisions needed: 10–12", "Shipping needed: up to 2,000,000 tons". On "China", a big cluster of red
    // unit icons labelled "Tied down in China", with only a small handful left near Australia.
    {
      const s = S.V10;
      Vk(s.start + 1.8, VIEW.tokyo, { mode: 'fly', ease: 'io' });
      const tCh = A('V10', 'China', 0.84);
      Vk(tCh - 1.0, { ll: [139.4, 35.0], z: 6.25 }, { mode: 'glide', ease: 'lin' });
      Vk(tCh + 1.0, VIEW.china, { mode: 'fly', ease: 'io' });
      Vk(s.end, { ll: [124, 9], z: 3.65 }, { mode: 'glide', ease: 'lin' });
      dropPin(PL.tokyo, s.start + 1.2, tCh + 0.6, { db: -10 });
      const t0 = s.start + 0.12 * s.dur, t1 = tCh - 0.4;
      look('dim', s.start + 1.6, 0); look('dim', t0 + 0.4, 0.28); look('dim', t1, 0.28); look('dim', t1 + 0.8, 0);
      add(t0, t1, (ctx) => {
        const t = ctx.t, a = fio(t, t0, t1, 0.4, 0.5);
        const ka = ease.back(prog(t, t0, 0.5)), kh = ease.back(prog(t, t0 + 0.35, 0.5));
        let crack = '';
        if (t > t0 + 0.9) {
          let d = 'M820 400', seed = Math.floor(t * 14);
          for (let i = 1; i <= 8; i++) { seed = (seed * 9301 + 49297) % 233280; d += `L${820 + i * 35} ${400 + (seed / 233280 - 0.5) * 70}`; }
          crack = `<path d="${d}" fill="none" stroke="#ffd98a" stroke-width="5" opacity="${f2(0.5 + 0.5 * Math.abs(Math.sin(t * 23)))}" filter="url(#fSoft)"/><path d="${d}" fill="none" stroke="#fff3cf" stroke-width="2"/>`;
        }
        return `<g opacity="${f2(a)}">
          <rect x="560" y="250" width="800" height="330" fill="rgba(241,230,203,0.78)" stroke="${C.ink}" stroke-width="3"/>
          <line x1="960" y1="270" x2="960" y2="560" stroke="${C.ink}" stroke-width="2" stroke-dasharray="6 6"/>
          ${X.anchorIcon(740, 395, { s: 1.7 * ka })}${X.helmetIcon(1180, 410, { s: 1.6 * kh })}${crack}
          ${X.label(740, 545, 'NAVY', { size: 34, font: 'Oswald', ls: 6, o: ka })}${X.label(1180, 545, 'ARMY', { size: 34, font: 'Oswald', ls: 6, o: kh })}
        </g>`;
      }, 30);
      const td = F('V10', 0.36), tsn = F('V10', 0.5);
      add(td, t1, (ctx) => X.tag(760, 680, 'Divisions needed: 10–12', prog(ctx.t, td, 1.1), { size: 34, o: fio(ctx.t, td, t1, 0.1, 0.5) }), 31);
      add(tsn, t1, (ctx) => {
        const n = 2000000 * ease.out(prog(ctx.t, tsn + 0.4, 2.2));
        return X.tag(1010, 770, `Shipping needed: up to ${X.fmtInt(n)} tons`, prog(ctx.t, tsn, 0.35) + 1, { size: 34, o: fio(ctx.t, tsn, t1, 0.1, 0.5), type: false, rot: 0.8 });
      }, 31);
      // cluster in China, handful near Australia
      const cluster = [];
      { let sd = 11; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
        for (let i = 0; i < 34; i++) cluster.push([lerp(108.5, 120.5, r()), lerp(23.5, 39.5, r())]); }
      const few = [[130.5, -5.6], [148.6, -5.2], [152.0, -4.5]];
      add(tCh, S.V11.start + 2.2, (ctx) => {
        const a = fio(ctx.t, tCh, S.V11.start + 2.2, 0.2, 0.6);
        let o = '';
        cluster.forEach((ll, i) => { const p = ctx.P(ll); o += X.unit(p[0], p[1], { s: 0.72 * ease.back(prog(ctx.t, tCh + i * 0.025, 0.3)), o: a }); });
        few.forEach((ll, i) => { const p = ctx.P(ll); o += X.unit(p[0], p[1], { s: 0.72 * ease.back(prog(ctx.t, tCh + 1.2 + i * 0.15, 0.3)), o: a }); });
        const pc = ctx.P([114.5, 31.5]);
        o += X.tag(pc[0] - 30, pc[1] - 150, 'Tied down in China', prog(ctx.t, tCh + 0.5, 0.9), { size: 32, o: a });
        return o;
      }, 14);
      sfx('crackle', t0 + 0.9, -14, { len: Math.max(1.5, t1 - t0 - 1.2) });
    }

    // V11 Map: a date label stamps "4 MARCH 1942" onto Tokyo. On "No invasion", the arrow vanishes. The three dotted
    // arrows return and arrow 1 pulses. Sound: a cliffhanger sting. Edit gap 1.5 s. Then the first mid-roll hold.
    {
      const s = S.V11;
      Vk(s.start + 1.6, VIEW.japanAus, { mode: 'fly', ease: 'io' });
      const tDate = A('V11', 'fourth of March', 0.06) + 1.0;
      const tNo = A('V11', 'No invasion', 0.34);
      Vk(tNo + 1.4, VIEW.threeArrows, { mode: 'glide', ease: 'io' });
      Vk(s.gapEnd + 0.9, { ll: [146, 0], z: 3.75 }, { mode: 'glide', ease: 'lin' });
      add(tDate, s.gapEnd, (ctx) => { const p = ctx.P(PL.tokyo); return X.stamp(p[0] - 10, p[1] - 90, '4 MARCH 1942', ctx.t - tDate, { size: 54, wf: 0.5, o: fio(ctx.t, tDate, s.gapEnd, 0.05, 0.5), rot: -6 }); }, 30);
      sfx('stamp', tDate, -5);
      add(s.start + 0.6, tNo + 1.2, (ctx) => {
        const t = ctx.t, u = t < tNo ? ease.io(prog(t, s.start + 0.6, 1.6)) : 1;
        const dis = prog(t, tNo, 0.9);
        return `<g opacity="${f2(1 - dis)}" transform="translate(0 ${f2(dis * 12)})">${X.arrow(mainPts(ctx), u, { width: 16 })}</g>`;
      }, 10);
      const tRet = tNo + 1.3, tP1 = s.start + 0.72 * s.dur;
      add(tRet, S.V12.start + 0.6, (ctx) => {
        const t = ctx.t, a = fio(t, tRet, S.V12.start + 0.6, 0.2, 0.5);
        let o = X.arrow(stemPts(ctx), 1, { width: 13, o: a * 0.8, head: 0.001 });
        for (const n of [1, 2, 3]) {
          const u = ease.io(prog(t, tRet + (n - 1) * 0.25, 1.2));
          const pul = n === 1 && t > tP1 ? 0.5 + 0.5 * Math.sin((t - tP1) * 4.2 - Math.PI / 2) : 0;
          o += arrowSet(ctx, n, u, { o: a * (n === 1 ? 1 : 0.6), pulse: pul, glow: pul });
        }
        return o;
      }, 10);
      sfx('sting_cliff', s.end - 0.1, -3);
      mus(s.end - 0.2, 'out', { fade: 1.2 });
    }

    /* =============================================================== ACT 2 */
    // Edit gap 1 s. A big "1" slams onto the map, with a whoosh and a drum hit.
    function bigNumeral(id, n, hit) {
      const s = S[id], t0 = s.preStart + 0.12;
      add(t0, s.start + 0.9, (ctx) => X.numeral(960, 520, n, ctx.t - t0, { o: fio(ctx.t, t0, s.start + 0.9, 0.02, 0.45) }), 60);
      sfx('whoosh', t0 - 0.28, -9);
      sfx(hit, t0, -1);
    }
    bigNumeral('V12', '1', 'drum_1');
    // V12 Map: zoom to the Top End. Red landing arrows hit the coast. On "landings", a zoom-through into the Darwin
    // coast pin. B04 (4 s). After the B-roll: airfield icons with dotted bombing-range circles, ship-block icons.
    {
      const s = S.V12;
      Vk(s.start + 1.0, VIEW.topEnd2, { mode: 'fly', ease: 'io' });
      const tL = A('V12', 'landings', 0.42);
      const LAND_ARR = [[[129.0, -10.6], [130.55, -12.25]], [[130.6, -10.4], [130.95, -12.3]], [[132.2, -10.5], [131.75, -11.95]], [[128.6, -11.8], [130.2, -12.65]]];
      const ta = s.start + 1.0;
      add(ta, s.end + 1.0, (ctx) => LAND_ARR.map(([a, b], i) => X.arrow(X.curve(ctx.P(a), ctx.P(b), 0.12 * (i % 2 ? 1 : -1), 24), ease.io(prog(ctx.t, ta + i * 0.3, 1.4)), { width: 12, o: fio(ctx.t, ta, s.end + 1.0, 0.1, 0.6) })).join(''), 10);
      dropPin(PL.darwinCoast, tL - 1.3, tL + 0.5, { thunk: false });
      const tIn = Math.max(tL, ta + 2.2);
      const after = zoomThrough('B04', PL.darwinCoast, tIn, 4, VIEW.topEnd2, { ...VIEW.topEndWide, d: 1.5 }, { beat: 'V12' });
      const AIR = [[130.87, -12.41], [131.0, -13.05], [132.38, -14.52]];
      add(after + 0.6, S.V13.start + 1.4, (ctx) => {
        const a = fio(ctx.t, after + 0.6, S.V13.start + 1.4, 0.2, 0.6);
        let o = '';
        AIR.forEach((ll, i) => {
          const p = ctx.P(ll), k = prog(ctx.t, after + 0.8 + i * 0.35, 1.2);
          o += X.rangeRing(p[0], p[1], ease.out(k) * 520 * M.pxPerKm(ctx.c, ll[1]), { o: a * 0.9, fill: 'rgba(176,38,28,0.05)' });
          o += X.airfield(p[0], p[1], { s: ease.back(prog(ctx.t, after + 0.6 + i * 0.35, 0.35)), o: a });
        });
        [[127.4, -10.6, -20], [134.6, -9.8, 10], [129.8, -9.2, -40]].forEach(([lo, la, r], i) => { const p = ctx.P([lo, la]); o += X.blockIcon(p[0], p[1], { s: 1.1 * ease.back(prog(ctx.t, after + 2.0 + i * 0.3, 0.35)), rot: r, o: a }); });
        return o;
      }, 12);
      mus(s.start - 0.3, 'north', { level: 'bed' });
    }
    // V13 Map: Darwin with damage icons; small civilian arrows stream south. Sound: lighter, curious on "geography".
    {
      const s = S.V13;
      Vk(s.start + 1.2, { ll: [131.3, -13.1], z: 6.5 }, { mode: 'glide', ease: 'io' });
      const tG = A('V13', 'geography', 0.86);
      Vk(tG + 0.2, { ll: [131.8, -13.8], z: 6.0 }, { mode: 'glide', ease: 'io2' });
      add(s.start, s.gapEnd + 0.6, (ctx) => {
        const a = fio(ctx.t, s.start, s.gapEnd + 0.6, 0.3, 0.6);
        let o = '';
        [[130.84, -12.46], [130.88, -12.43], [130.82, -12.42], [130.9, -12.47], [130.86, -12.38]].forEach((ll, i) => { const p = ctx.P(ll); o += X.damage(p[0] + i * 6, p[1], ctx.t, { s: 1.1 * ease.back(prog(ctx.t, s.start + 0.2 + i * 0.12, 0.3)), o: a }); });
        for (let i = 0; i < 5; i++) {
          const t0 = s.start + 1.6 + i * 0.5;
          const pts = scr(ctx, [[130.9 + i * 0.05, -12.55], [131.05 + i * 0.03, -13.2], [131.5, -13.6 - i * 0.04], [131.9, -14.1 - i * 0.05]]);
          o += X.arrow(pts, ease.io(prog(ctx.t, t0, 2.4)), { width: 5, color: '#6b6151', dk: '#3e372c', head: 13, o: a * 0.95 });
        }
        return o;
      }, 12);
      mus(tG, 'curious', { fade: 1.2 });
    }
    // V14 Map: the camera pulls south across a vast orange interior. A railway line draws from Darwin and stops at
    // "Birdum". Another draws up from the south and stops at "Alice Springs". The gap between them glows, with a
    // counter: "~1,000 km of NO railway".
    {
      const s = S.V14;
      Vk(s.start + 0.45 * s.dur, VIEW.interior, { mode: 'fly', ease: 'io', rho: 1.0 });
      Vk(s.end, { ll: [134.0, -20.8], z: 5.1 }, { mode: 'glide', ease: 'lin' });
      const tn = F('V14', 0.1), ts = F('V14', 0.38), tg = F('V14', 0.62), tc = F('V14', 0.72);
      const tEnd = S.V16.start + 2.0;
      add(tn, tEnd, (ctx) => X.rail(scr(ctx, RAIL_N), ease.io(prog(ctx.t, tn, 2.2)), { o: fio(ctx.t, tn, tEnd, 0.1, 0.6) }), 12);
      placeLabel(PL.darwin, 'Darwin', tn, tEnd, { dy: -26, size: 30 });
      placeLabel(PL.birdum, 'Birdum', tn + 2.0, tEnd, { dx: 18, dy: 10, anchor: 'start', size: 32 });
      add(ts, tEnd, (ctx) => X.rail(scr(ctx, RAIL_S), ease.io(prog(ctx.t, ts, 2.6)), { o: fio(ctx.t, ts, tEnd, 0.1, 0.6) }), 12);
      placeLabel(PL.alice, 'Alice Springs', ts + 2.4, tEnd, { dx: 22, dy: 10, anchor: 'start', size: 32 });
      add(tg, S.V15.gapEnd + 0.4, (ctx) => {
        const a = fio(ctx.t, tg, S.V15.gapEnd + 0.4, 0.6, 0.5);
        const pts = scr(ctx, gcPath(PL.birdum, PL.alice, 20));
        const pul = 0.7 + 0.3 * Math.sin(ctx.t * 3.4);
        return `<g opacity="${f2(a)}">${X.line(pts, 1, { color: '#f0b54a', width: 10, glow: 1.6 * pul, glowColor: '#ffb43c', o: 0.75 })}${X.line(pts, 1, { color: '#7a4b12', width: 3, dash: '10 10' })}</g>`;
      }, 11);
      add(tc, S.V15.start + 1.0, (ctx) => { const p = ctx.P([134.0, -19.6]); return X.tag(p[0] + 230, p[1], '~1,000 km of NO railway', prog(ctx.t, tc, 1.1), { size: 34, o: fio(ctx.t, tc, S.V15.start + 1.0, 0.1, 0.5) }); }, 20);
    }
    // V15 Map: zoom-through into the glowing gap. B05 (4 s). Sound: a single gust of desert wind (a comic beat).
    {
      const s = S.V15;
      const tIn = Math.max(s.start + 1.2, s.gapEnd - 0.6 - 4);
      dropPin(PL.gap, tIn - 1.3, tIn + 0.4, { color: '#c27a1c', thunk: false });
      zoomThrough('B05', PL.gap, tIn, 4, { ll: [134.0, -20.6], z: 5.2 }, { ...VIEW.interiorN, d: 1.5 }, { beat: 'V15', zPin: 9.3 });
      sfx('wind_gust', tIn + 0.25, -6);
    }
    // V16 Map: a road line draws through the gap with small army truck icons moving north, labelled
    // "→ Stuart Highway". Then the red force sits stuck in Darwin, blue counterattack arrows push in, and a long
    // red supply line stretches back to Japan, flickering and fraying.
    {
      const s = S.V16;
      const tr = s.start + 0.4, tStuck = F('V16', 0.42), tSup = F('V16', 0.66);
      Vk(tStuck - 0.6, VIEW.interiorN, { mode: 'glide', ease: 'lin' });
      Vk(tStuck + 0.8, { ll: [131.6, -13.4], z: 6.1 }, { mode: 'fly', ease: 'io' });
      Vk(tSup + 1.6, VIEW.pacificJA, { mode: 'fly', ease: 'io' });
      Vk(s.end, { ll: [140, 8], z: 3.5 }, { mode: 'glide', ease: 'lin' });
      const road = densify(ROAD, 6);
      add(tr, tSup + 1.0, (ctx) => {
        const a = fio(ctx.t, tr, tSup + 1.0, 0.1, 0.6);
        const pts = scr(ctx, road), u = ease.io(prog(ctx.t, tr, 2.4));
        let o = X.line(pts, u, { color: C.blue, width: 6, under: 'rgba(241,230,203,0.85)', underW: 5, dash: '18 7', o: a });
        if (u >= 1) for (let i = 0; i < 6; i++) {
          const f = ((ctx.t - tr - 2.4) * 0.07 + i / 6) % 1;
          const seg = X.cut(pts, f), p = seg[seg.length - 1], q = seg[Math.max(0, seg.length - 2)];
          o += X.truck(p[0], p[1], { s: 0.85, rot: Math.atan2(p[1] - q[1], p[0] - q[0]) * 180 / Math.PI + (p[0] < q[0] ? 180 : 0), o: a });
        }
        return o;
      }, 13);
      add(tr + 1.6, tStuck + 0.4, (ctx) => { const p = ctx.P([134.5, -19.8]); return X.label(p[0] + 26, p[1], '→ Stuart Highway', { anchor: 'start', size: 34, fill: C.blueDk, o: fio(ctx.t, tr + 1.6, tStuck + 0.4, 0.4, 0.4) }); }, 14);
      add(tStuck, tSup + 1.6, (ctx) => {
        const t = ctx.t, a = fio(t, tStuck, tSup + 1.6, 0.3, 0.6);
        let o = '';
        [[130.86, -12.45], [130.97, -12.52], [130.78, -12.56], [131.06, -12.45], [130.93, -12.62]].forEach((ll, i) => {
          const p = ctx.P(ll), j = Math.sin(t * 9 + i) * 2.2;
          o += X.unit(p[0] + j, p[1], { s: 0.95 * ease.back(prog(t, tStuck + i * 0.08, 0.3)), o: a });
        });
        [[[132.4, -14.6], [131.2, -12.9]], [[131.0, -14.4], [130.95, -12.85]], [[129.9, -13.9], [130.65, -12.8]]].forEach(([b, e2], i) => {
          o += X.arrow(X.curve(ctx.P(b), ctx.P(e2), 0.1, 20), ease.io(prog(t, tStuck + 1.0 + i * 0.3, 1.4)), { color: C.blue, dk: C.blueDk, width: 12, o: a });
        });
        return o;
      }, 13);
      add(tSup, s.end + 1.0, (ctx) => {
        const t = ctx.t, a = fio(t, tSup, s.end + 1.0, 0.2, 0.6);
        const pts = scr(ctx, gcPath(PL.tokyo, PL.darwin, 80));
        const u = ease.io(prog(t, tSup, 1.8));
        const fray = prog(t, tSup + 2.2, s.end - tSup - 2.2);
        let o = '';
        const N = 22;
        for (let i = 0; i < N; i++) {
          const a0 = i / N, a1 = (i + 0.72) / N;
          if (a0 > u) break;
          const seed = Math.sin(i * 12.9898) * 43758.5453 % 1;
          const flick = 0.55 + 0.45 * Math.sin(t * (11 + (i % 5) * 3) + i);
          const gone = fray > Math.abs(seed) * 1.05 ? 1 : 0;
          const shrink = 1 - fray * 0.45 * Math.abs(Math.sin(i * 7.7));
          o += X.line(X.sub(pts, a0, Math.min(u, a0 + (a1 - a0) * shrink)), 1, { color: C.red, width: 5, o: a * flick * (1 - gone) });
        }
        return o;
      }, 13);
    }
    // V17 Map: zoom to Melville Island. A small plane icon spirals down and lands on the beach. Label:
    // "Captured by Matthias Ulungura, Tiwi man". (Map only, no AI person.)
    {
      const s = S.V17;
      Vk(s.start + 2.2, VIEW.melville, { mode: 'fly', ease: 'io' });
      Vk(s.end, { ll: [130.78, -11.5], z: 8.35 }, { mode: 'glide', ease: 'lin' });
      placeLabel([130.95, -11.62], 'Melville Island', s.start + 1.6, s.end + 0.8, { dy: 0, size: 38, font: 'FellSC', fill: '#4a3a28' });
      const tp = F('V17', 0.24), tl = F('V17', 0.5), tlab = F('V17', 0.58);
      add(tp, s.end + 0.8, (ctx) => {
        const t = ctx.t, u = prog(t, tp, tl - tp);
        const b = PL.melvilleBeach;
        const ang = u * Math.PI * 3.2, rad = (1 - ease.out(u)) * 0.32;
        const ll = [b[0] + Math.cos(ang) * rad * 1.1, b[1] - 0.05 * (1 - u) + Math.sin(ang) * rad * 0.7];
        const p = ctx.P(ll);
        const rot = (ang * 180 / Math.PI) + 90;
        const sz = lerp(1.25, 0.75, ease.out(u));
        const a = fio(t, tp, s.end + 0.8, 0.3, 0.6);
        const shadow = ctx.P(b);
        return `<ellipse cx="${f2(lerp(p[0], shadow[0], 0.6))}" cy="${f2(shadow[1] + 6)}" rx="${f2(16 * (0.4 + u))}" ry="${f2(5 * (0.4 + u))}" fill="rgba(40,25,10,${f2(0.3 * u * a)})"/>` + X.plane(p[0], p[1], { s: sz, rot: u >= 1 ? 200 : rot, o: a });
      }, 14);
      add(tlab, s.end + 0.8, (ctx) => {
        const p = ctx.P(PL.melvilleBeach), a = fio(ctx.t, tlab, s.end + 0.8, 0.6, 0.6);
        const k = ease.out(prog(ctx.t, tlab, 0.8));
        return `<g opacity="${f2(a)}"><line x1="${f2(p[0])}" y1="${f2(p[1] - 14)}" x2="${f2(p[0] + 60)}" y2="${f2(p[1] - 120)}" stroke="${C.ink}" stroke-width="2"/>
          <rect x="${f2(p[0] + 60)}" y="${f2(p[1] - 168)}" width="${f2(640 * k)}" height="78" fill="rgba(241,230,203,0.94)" stroke="${C.inkSoft}" stroke-width="1.5"/>
          <rect x="${f2(p[0] + 60)}" y="${f2(p[1] - 168)}" width="6" height="78" fill="${C.gold}"/>
          ${X.label(p[0] + 84, p[1] - 117, 'Captured by Matthias Ulungura, Tiwi man', { anchor: 'start', size: 33, font: 'Fell', halo: 'none', hw: 0, o: k })}</g>`;
      }, 20);
      mus(s.start, 'warm_respect', { fade: 2.0 });
    }
    // V18 Map: a verdict card on the map: "SCENARIO 1: STUCK".
    {
      const s = S.V18;
      Vk(s.start + 1.8, { ll: [131.8, -13.6], z: 5.7 }, { mode: 'fly', ease: 'io' });
      Vk(s.gapEnd, { ll: [132.2, -14.2], z: 5.6 }, { mode: 'glide', ease: 'lin' });
      const tv = A('V18', 'stuck', 0.5);
      add(tv, s.gapEnd + 0.2, (ctx) => X.verdict(960, 520, 'SCENARIO 1: STUCK', ctx.t - tv, { o: fio(ctx.t, tv, s.gapEnd + 0.2, 0.05, 0.4) }), 40);
      sfx('stamp', tv, -6);
      mus(s.gapEnd - 0.6, 'out', { fade: 1.0 });
    }

    /* =============================================================== ACT 3 */
    bigNumeral('V19', '2', 'drum_2');
    // V19 Map: zoom-through into the open ocean. B06 (4 s).
    {
      const s = S.V19;
      Vk(s.preStart, { ll: [140, -12], z: 4.2 }, { mode: 'fly', ease: 'io' });
      const tAll = A('V19', 'all in', 0.55);
      const tIn = Math.max(s.start + 1.3, tAll + 0.2);
      dropPin(PL.ocean, tIn - 1.2, tIn + 0.3, { thunk: false });
      zoomThrough('B06', PL.ocean, tIn, 4, { ll: [152, -16], z: 4.4 }, { ...VIEW.eastCoast, d: 1.5 }, { beat: 'V19', zPin: 8.6 });
      mus(s.start - 0.4, 'invasion', { level: 'bed' });
    }
    // V20 Map: huge red arrows sweep down the east coast to Brisbane, Sydney and Melbourne. A shipping counter
    // climbs. On "submarines", a quick cut to B07 (3 s) — it still enters and leaves through the pin.
    // After: blue submarine icons pick off red ship icons along the supply line, one by one. Two sonar pings.
    {
      const s = S.V20;
      const tSub = A('V20', 'submarines', 0.66);
      const ta = s.start + 0.3;
      const EC = [[PL.brisbane, [161, -16]], [PL.sydney, [163, -22]], [PL.melbourne, [158, -30]]];
      add(ta, s.gapEnd + 0.5, (ctx) => {
        const a = fio(ctx.t, ta, s.gapEnd + 0.5, 0.2, 0.6);
        return EC.map(([to, from], i) => X.arrow(X.curve(ctx.P(from), ctx.P([to[0] + 0.5, to[1]]), -0.22, 40), ease.io(prog(ctx.t, ta + i * 0.45, 1.8)), { width: 24, head: 52, o: a })).join('');
      }, 12);
      [['Brisbane', PL.brisbane, -1], ['Sydney', PL.sydney, -1], ['Melbourne', PL.melbourne, 1]].forEach(([n, ll], i) => placeLabel(ll, n, ta + 1.2 + i * 0.45, s.gapEnd + 0.5, { dx: -24, dy: 8, anchor: 'end', size: 30 }));
      const supply = gcPath([150, -2], [156.5, -27], 40);
      const shipsAt = [0.12, 0.27, 0.42, 0.57, 0.72, 0.87];
      const tAfter = tSub + 3 + 1.3;
      add(ta + 1.2, s.gapEnd + 0.5, (ctx) => {
        const t = ctx.t, a = fio(t, ta + 1.2, s.gapEnd + 0.5, 0.3, 0.6);
        const pts = scr(ctx, supply);
        let o = X.line(pts, ease.io(prog(t, ta + 1.2, 1.5)), { color: C.red, width: 4, dash: '14 9', o: a * 0.9 });
        shipsAt.forEach((f, i) => {
          const sp = X.cut(pts, f), p = sp[sp.length - 1];
          const tk = tAfter + 0.4 + i * 0.42;
          const sunk = prog(t, tk, 0.5);
          o += X.ship(p[0], p[1] + sunk * 10, { s: 0.85, rot: 74, o: a * (1 - sunk) * clamp((t - ta - 1.5 - i * 0.15) / 0.3, 0, 1) });
          if (t > tk - 0.3 && t < tk + 0.9) o += X.burst(p[0], p[1], (t - tk + 0.3) / 1.2, { r: 24, color: C.blueDk });
          if (t > tAfter) {
            const ps = [p[0] + 70 - 10 * Math.sin(i), p[1] + 34];
            o += X.sub_(ps[0], ps[1], { s: 0.85 * ease.back(prog(t, tAfter + i * 0.42, 0.35)), o: a });
          }
        });
        return o;
      }, 13);
      const tc = s.start + 0.28 * s.dur;
      add(tc, tSub + 0.2, (ctx) => X.tag(330, 840, `Shipping: ${X.fmtInt(2000000 * ease.io(prog(ctx.t, tc + 0.3, Math.max(1.5, tSub - tc - 1.2))))} tons`, 2, { size: 34, type: false, o: fio(ctx.t, tc, tSub + 0.2, 0.3, 0.3), rot: -0.8 }), 30);
      const pinB07 = PL.supplyPin;
      dropPin(pinB07, tSub - 1.1, tSub + 0.3, { thunk: false, color: C.blue });
      Vk(tSub - 1.0, { ll: [153.5, -24], z: 4.75 }, { mode: 'glide', ease: 'lin' });
      zoomThrough('B07', pinB07, tSub, 3, { ll: [153.5, -24], z: 4.75 }, { ll: [154.5, -21], z: 4.55, d: 1.2 }, { beat: 'V20', appr: 0.7, zPin: 8.6 });
      sfx('sonar', tSub + 0.35, -6);
      sfx('sonar', tAfter + 0.1, -8);
    }
    // V21 Map: battle icons flash in the Coral Sea, with a red arrow toward Port Moresby turned back. Then a pull-out
    // to the Midway pin and a zoom-through. B08 (4 s).
    {
      const s = S.V21;
      Vk(s.start + 1.4, VIEW.coral, { mode: 'fly', ease: 'io' });
      const tCS = A('V21', 'Coral Sea', 0.2), tMid = A('V21', 'Midway', 0.55);
      placeLabel(PL.coralSea, 'Coral Sea', tCS + 0.2, tMid + 0.2, { dy: 64, size: 34, font: 'FellIt' });
      add(tCS, tMid + 0.2, (ctx) => {
        const t = ctx.t, a = fio(t, tCS, tMid + 0.2, 0.15, 0.5);
        let o = '';
        [[154.2, -15.0], [156.2, -13.8], [152.6, -16.3]].forEach((ll, i) => { const p = ctx.P(ll); const fl = 0.75 + 0.25 * Math.sin(t * 8 + i * 2); o += X.battle(p[0], p[1], { s: ease.back(prog(t, tCS + i * 0.25, 0.3)) * fl, o: a }); });
        // arrow toward Port Moresby, turned back
        const via = [[152.5, -4.6], [153.0, -8.5], [152.4, -11.3], [150.2, -11.9]];
        const back = [[150.2, -11.9], [151.8, -12.6], [153.6, -11.0]];
        const u1 = ease.io(prog(t, tCS + 0.6, 1.8)), u2 = ease.io(prog(t, tCS + 2.6, 1.4));
        if (u2 <= 0) o += X.arrow(scr(ctx, densify(via, 6)), u1, { width: 12, o: a });
        else {
          o += X.line(scr(ctx, densify(via, 6)), 1, { color: C.red, width: 12, o: a * 0.45 });
          o += X.arrow(scr(ctx, densify(back, 6)), u2, { width: 12, o: a });
        }
        return o;
      }, 13);
      dropPin(PL.moresby, tCS + 0.4, tMid, { color: C.blue, thunk: false, size: 0.8 });
      placeLabel(PL.moresby, 'Port Moresby', tCS + 0.6, tMid, { dy: 36 });
      Vk(tMid + 0.5, VIEW.pacificWin, { mode: 'fly', ease: 'io' });
      dropPin(PL.midway, tMid + 0.4, tMid + 3.5);
      placeLabel(PL.midway, 'Midway', tMid + 0.6, tMid + 3.5, { dy: 38, size: 32 });
      const tIn = Math.max(tMid + 2.2, s.gapEnd - 0.6 - 4);
      zoomThrough('B08', PL.midway, tIn, 4, VIEW.pacificWin, { ...VIEW.world, d: 1.6 }, { beat: 'V21', zPin: 9.6 });
    }
    // V22 Map: two outcome arrows branch and flicker: "Early wins?" and "Faster collapse?". Then blue troop arrows from
    // the Middle East to Australia, and from the USA, with plane and soldier icons landing on Australian cities.
    {
      const s = S.V22;
      Vk(s.start + 0.6, { ll: [160, 8], z: 3.15 }, { mode: 'glide', ease: 'io' });
      const tb = s.start + 0.6, tTroops = F('V22', 0.45), tLand = F('V22', 0.75);
      add(tb, tTroops + 0.4, (ctx) => {
        const t = ctx.t, a = fio(t, tb, tTroops + 0.4, 0.2, 0.5);
        const o0 = ctx.P([165, 18]);
        const e1 = ctx.P([150, -8]), e2 = ctx.P([176, -6]);
        const fl1 = 0.55 + 0.45 * Math.sin(t * 5.5), fl2 = 0.55 + 0.45 * Math.sin(t * 5.5 + Math.PI);
        const u = ease.io(prog(t, tb, 1.4));
        return X.arrow(X.curve(o0, e1, 0.15, 30), u, { width: 14, o: a * fl1, glow: fl1 * 0.6 }) + X.arrow(X.curve(o0, e2, -0.15, 30), u, { width: 14, dotted: true, o: a * fl2, glow: fl2 * 0.6 })
          + X.tag(e1[0] - 40, e1[1] + 70, 'Early wins?', prog(t, tb + 1.2, 0.6) + 1, { size: 32, type: false, o: a * (0.6 + 0.4 * fl1) })
          + X.tag(e2[0] + 30, e2[1] + 70, 'Faster collapse?', prog(t, tb + 1.4, 0.6) + 1, { size: 32, type: false, o: a * (0.6 + 0.4 * fl2), rot: 1.4 });
      }, 14);
      Vk(tTroops + 0.2, VIEW.world, { mode: 'fly', ease: 'io' });
      const fromME = densify([[35, 30], [43, 13], [62, -2], [90, -18], [114, -33], [140, -38], [144.9, -37.9]], 6);
      const fromUS = densify([[-118, 34], [-157.9, 21.3], [-172, -2], [178, -18], [153.1, -27.5]], 8);
      add(tTroops, tLand + 3.0, (ctx) => {
        const a = fio(ctx.t, tTroops, tLand + 3.0, 0.2, 0.6);
        return X.arrow(scr(ctx, fromME), ease.io(prog(ctx.t, tTroops + 0.3, 2.2)), { color: C.blue, dk: C.blueDk, width: 14, o: a })
          + X.arrow(scr(ctx, fromUS), ease.io(prog(ctx.t, tTroops + 0.8, 2.2)), { color: C.blue, dk: C.blueDk, width: 14, o: a });
      }, 13);
      placeLabel(PL.middleEast, 'Middle East', tTroops + 0.3, tLand, { dy: -30 });
      placeLabel(PL.usa, 'USA', tTroops + 0.8, tLand, { dy: 6, size: 30 });
      Vk(tLand + 0.3, VIEW.eastCoast, { mode: 'fly', ease: 'io' });
      Vk(s.end, { ll: [148, -29], z: 4.65 }, { mode: 'glide', ease: 'lin' });
      add(tLand, S.V23.start + 1.6, (ctx) => {
        const t = ctx.t, a = fio(t, tLand, S.V23.start + 1.6, 0.2, 0.6);
        let o = '';
        [PL.brisbane, PL.sydney, PL.melbourne].forEach((ll, i) => {
          const p = ctx.P(ll);
          const k = prog(t, tLand + 0.5 + i * 0.4, 1.0);
          o += X.plane(p[0] + 160 * (1 - ease.out(k)), p[1] - 160 * (1 - ease.out(k)) - 30, { s: 0.9, rot: 225, o: a * clamp(k * 3, 0, 1) });
          for (let j = 0; j < 3; j++) o += X.soldier(p[0] - 46 + j * 22, p[1] + 34, { s: 0.75 * ease.back(prog(t, tLand + 1.2 + i * 0.4 + j * 0.1, 0.3)), o: a });
        });
        return o;
      }, 13);
      mus(tTroops, 'build', { fade: 1.5 });
    }
    // V23 Map: the map desaturates heavily, then a zoom-through into a city pin. B09 (5 s). Sound: strings only.
    {
      const s = S.V23;
      look('desat', s.start, 0); look('desat', s.start + 1.2, 0.95); look('desat', s.gapEnd + 0.3, 0.95); look('desat', S.V24.start + 1.6, 0);
      const tIn = Math.max(s.start + 2.4, s.gapEnd - 0.6 - 5);
      dropPin(PL.cityPin, tIn - 1.4, tIn + 0.3, { thunk: false, color: '#5a5048' });
      zoomThrough('B09', PL.cityPin, tIn, 5, { ll: [149.5, -31.5], z: 5.2 }, { ...VIEW.ausMid, d: 1.6 }, { beat: 'V23', zPin: 9.8 });
      mus(s.start - 0.2, 'strings', { fade: 1.2 });
    }
    // V24 Map: an outline of the mainland United States slides over Australia; almost the same size. Arrow 3 pulses red.
    // Sound: the cliffhanger sting. Edit gap 1.5 s. Then the second mid-roll hold.
    {
      const s = S.V24;
      const t0 = s.start + 0.6, t3 = F('V24', 0.72);
      Vk(t3 - 0.2, { ll: [137.5, -26.5], z: 4.5 }, { mode: 'glide', ease: 'lin' });
      Vk(t3 + 1.6, VIEW.threeArrows, { mode: 'fly', ease: 'io' });
      Vk(s.gapEnd + 0.9, { ll: [154, 3], z: 3.55 }, { mode: 'glide', ease: 'lin' });
      // US outline as km offsets from its centroid, laid on Australia's centroid at the same ground scale
      const us = GEO.usa[0];
      let cx = 0, cy = 0; us.forEach(([lo, la]) => { cx += lo; cy += la; }); cx /= us.length; cy /= us.length;
      const off = us.map(([lo, la]) => [(lo - cx) * 111.32 * Math.cos(la * Math.PI / 180), (la - cy) * 110.57]);
      const AUSC = [134.4, -25.6];
      add(t0, t3 + 1.0, (ctx) => {
        const t = ctx.t, a = fio(t, t0, t3 + 1.0, 0.3, 0.6);
        const slide = 1 - ease.io(prog(t, t0, 2.4));
        const c0 = ctx.P(AUSC), ppk = M.pxPerKm(ctx.c, AUSC[1]);
        const d = off.map(([x, y], i) => `${i ? 'L' : 'M'}${f2(c0[0] + x * ppk + slide * 1300)} ${f2(c0[1] - y * ppk)}`).join('') + 'Z';
        return `<g opacity="${f2(a)}"><path d="${d}" fill="rgba(29,79,143,0.18)" stroke="${C.blue}" stroke-width="4" stroke-dasharray="14 8"/>
          ${X.label(c0[0] + slide * 1300, c0[1] - 300 * ppk / 1, 'United States', { size: 34, fill: C.blueDk, o: 1 })}</g>`;
      }, 15);
      add(t3, s.gapEnd + 0.9, (ctx) => {
        const t = ctx.t, a = fio(t, t3, s.gapEnd + 0.9, 0.3, 0.5);
        let o = X.arrow(stemPts(ctx), 1, { width: 13, o: a * 0.6, head: 0.001 });
        for (const n of [1, 2, 3]) {
          const pul = n === 3 && t > t3 + 1.6 ? 0.5 + 0.5 * Math.sin((t - t3 - 1.6) * 4.4 - Math.PI / 2) : 0;
          o += arrowSet(ctx, n, ease.io(prog(t, t3 + (n - 1) * 0.2, 1.2)), { o: a * (n === 3 ? 1 : 0.45), pulse: pul, glow: pul * 1.3 });
        }
        return o;
      }, 12);
      sfx('sting_cliff', s.end - 0.1, -3);
      mus(s.end - 0.2, 'out', { fade: 1.2 });
    }

    /* =============================================================== ACT 4 */
    bigNumeral('V25', '3', 'drum_3');
    // V25 Map: pull out to the whole Pacific. A thick blue "lifeline" draws from the USA to Australia past Fiji, Samoa
    // and New Caledonia, and red arrows reach for each island. Then a red arrow to Port Moresby, and a bomber-range
    // circle expands from it over Queensland.
    const life = densify(LIFELINE, 10);
    {
      const s = S.V25;
      Vk(s.start + 1.2, VIEW.pacificWhole, { mode: 'fly', ease: 'io' });
      const tl = s.start + 0.8, tr = F('V25', 0.4), tPM = F('V25', 0.64);
      const tQ = A('V25', 'Queensland', 0.92);
      Vk(tPM - 0.4, { ll: [190, -6], z: 2.95 }, { mode: 'glide', ease: 'lin' });
      Vk(tPM + 1.2, VIEW.pngQld, { mode: 'fly', ease: 'io' });
      Vk(s.end, { ll: [147.5, -15], z: 4.75 }, { mode: 'glide', ease: 'lin' });
      add(tl, S.V26.start + 2, (ctx) => X.line(scr(ctx, life), ease.io(prog(ctx.t, tl, 3.2)), { color: C.blue, width: 11, under: C.blueDk, underW: 5, glow: 1.0 }), 11);
      [['Fiji', PL.fiji, 30, 36], ['Samoa', PL.samoa, 0, -30], ['New Caledonia', PL.newCaledonia, -14, 40]].forEach(([n, ll, dx, dy], i) => placeLabel(ll, n, tl + 1.6 + i * 0.4, s.end, { dx, dy, size: 30 }));
      placeLabel(PL.usa, 'USA', tl, s.start + 0.6 * s.dur, { dy: 6, size: 30 });
      add(tr, S.V26.start + 2.5, (ctx) => {
        const a = fio(ctx.t, tr, S.V26.start + 2.5, 0.2, 0.6);
        return [[PL.truk, [176.6, -16.2]], [PL.truk, [-173.5, -12.6]], [PL.rabaul, [164.3, -19.6]]].map(([f, to], i) =>
          X.arrow(X.curve(ctx.P(f), ctx.P(to), 0.12, 30), ease.io(prog(ctx.t, tr + i * 0.4, 1.6)), { width: 12, o: a })).join('');
      }, 12);
      add(tPM, S.V26.start + 1.0, (ctx) => {
        const t = ctx.t, a = fio(t, tPM, S.V26.start + 1.0, 0.2, 0.6);
        const pm = ctx.P(PL.moresby);
        let o = X.arrow(X.curve(ctx.P(PL.rabaul), ctx.P([147.6, -9.1]), 0.18, 30), ease.io(prog(t, tPM + 0.6, 1.4)), { width: 14, o: a });
        const tc = tQ - 1.2;
        o += X.rangeRing(pm[0], pm[1], ease.out(prog(t, tc, 1.6)) * 1150 * M.pxPerKm(ctx.c, -14), { o: a, w: 4 });
        return o;
      }, 13);
      placeLabel(PL.moresby, 'Port Moresby', tPM + 0.6, S.V26.start + 1.0, { dy: 40 });
      placeLabel([144.5, -21.5], 'Queensland', tQ - 0.6, S.V26.start + 1.0, { dy: 0, size: 34, font: 'FellSC' });
      mus(s.start - 0.4, 'cutoff', { level: 'bed' });
    }
    // V26 Map: the blue lifeline frays and snaps, and Australia dims and isolates.
    // Sound: a snapping cable, then near silence with a low wind tone. Edit gap 2 s.
    {
      const s = S.V26;
      Vk(s.start + 1.2, { ll: [178, -14], z: 3.05 }, { mode: 'fly', ease: 'io' });
      const tSnap = s.start + 0.45 * s.dur;
      Vk(s.gapEnd + 1.0, VIEW.isolated, { mode: 'glide', ease: 'io' });
      const SNAP = 0.62; // fraction along the lifeline (near Samoa / Fiji)
      add(S.V26.start + 0.8, S.V29.start + 2.0, (ctx) => {
        const t = ctx.t;
        const pts = scr(ctx, life);
        if (t < tSnap) {
          const fray = prog(t, s.start + 0.8, tSnap - s.start - 0.8);
          let o = X.line(pts, 1, { color: C.blue, width: 11 * (1 - 0.5 * fray), under: C.blueDk, underW: 4 });
          const near = X.sub(pts, SNAP - 0.04, SNAP + 0.04);
          for (let k = 0; k < 5; k++) o += X.line(near.map(([x, y], i) => [x + Math.sin(i + k * 2 + t * 30) * 9 * fray, y + Math.cos(i * 1.3 + k + t * 27) * 9 * fray]), 1, { color: '#7fb0e6', width: 1.6, o: fray });
          return o;
        }
        const r = ease.out(prog(t, tSnap, 0.7));
        const a = 1 - 0.55 * prog(t, tSnap + 0.5, 1.5);
        const left = X.cut(pts, SNAP - 0.06 * r), right = X.sub(pts, SNAP + 0.06 * r, 1);
        return X.line(left, 1, { color: C.blue, width: 6, o: a }) + X.line(right, 1, { color: C.blue, width: 6, o: a });
      }, 11);
      sfx('snap', tSnap, -2);
      sfx('wind_low', tSnap + 0.4, -10, { len: S.V27.start + 3.5 - tSnap, fadeIn: 1.5, fadeOut: 2.0 });
      look('dim', tSnap, 0); look('dim', tSnap + 1.5, 0.38); look('dim', S.V27.start + 0.5 * S.V27.dur, 0.38); look('dim', S.V27.start + 0.7 * S.V27.dur, 0);
      add(tSnap, S.V27.start + 0.7 * S.V27.dur, (ctx) => {
        const a = fio(ctx.t, tSnap + 0.3, S.V27.start + 0.7 * S.V27.dur, 1.4, 1.0);
        const c = ctx.P([134, -26]);
        return `<defs><radialGradient id="gIso" cx="${f2(c[0])}" cy="${f2(c[1])}" r="900" gradientUnits="userSpaceOnUse"><stop offset="0.18" stop-color="#0b0a10" stop-opacity="0"/><stop offset="1" stop-color="#0b0a10" stop-opacity="0.72"/></radialGradient></defs>
          <rect width="1920" height="1080" fill="url(#gIso)" opacity="${f2(a)}"/>
          <path d="${ausPath(ctx)}" fill="rgba(20,16,22,0.22)" stroke="rgba(241,230,203,0.6)" stroke-width="2" opacity="${f2(a)}"/>`;
      }, 4);
      mus(tSnap, 'cut');
    }
    // V27 Map: hold on isolated Australia, then a zoom-through into the Sydney Harbour pin. B10 (4 s).
    {
      const s = S.V27;
      const tMid = A('V27', 'midget submarines', 0.72);
      const tIn = Math.min(Math.max(tMid, s.start + 3.5), s.end - 0.6);
      Vk(tIn - 2.0, { ll: [150, -20], z: 3.3 }, { mode: 'glide', ease: 'lin' });
      dropPin(PL.harbourPin, tIn - 1.8, tIn + 0.3, { thunk: true, db: -12 });
      zoomThrough('B10', PL.harbourPin, tIn, 4, { ll: [151, -30], z: 4.6 }, { ...VIEW.sydNew, d: 1.2 }, { beat: 'V27', zPin: 10.2, appr: 1.3 });
      mus(s.start + 0.5, 'serious', { fade: 2.0 });
    }
    // V28 Map: shell-burst icons at Sydney and Newcastle. Then a zoom to New Guinea and a zoom-through. B11 (5 s).
    // After: a red line crawls over New Guinea's mountains toward Port Moresby while a distance counter falls and
    // stops at "~40 km".
    {
      const s = S.V28;
      const b10end = BROLL.find((b) => b.id === 'B10');
      const tShell = Math.max(s.start + 0.2, b10end.t + b10end.dur + 0.3);
      for (let i = 0; i < 7; i++) {
        const ll = i % 2 ? [151.29 + (i % 3) * 0.03, -33.87 + i * 0.01] : [151.8 + (i % 3) * 0.02, -32.93 - i * 0.006];
        const tb = tShell + 0.3 + i * 0.32;
        add(tb, tb + 1.0, (ctx) => { const p = ctx.P(ll); return X.burst(p[0], p[1], ctx.t - tb, { seed: i * 3, r: 28 }); }, 12);
        if (i % 3 === 0) sfx('explosion_far', tb, -15, { v: i % 4 });
      }
      placeLabel(PL.sydney, 'Sydney', tShell, tShell + 3.2, { dy: 44, size: 32 });
      placeLabel(PL.newcastle, 'Newcastle', tShell, tShell + 3.2, { dy: 44, size: 32 });
      const tNG = tShell + 3.0;
      Vk(tNG + 1.8, VIEW.png, { mode: 'fly', ease: 'io' });
      dropPin(PL.kokoda, tNG + 1.6, tNG + 3.0, { thunk: false });
      placeLabel(PL.kokoda, 'Kokoda', tNG + 1.8, tNG + 3.0, { dy: 38 });
      const tIn = Math.max(tNG + 2.6, A('V28', 'Port Moresby', 0.35) - 2.0);
      const after = zoomThrough('B11', PL.kokoda, tIn, 5, VIEW.png, { ...VIEW.png, d: 1.3 }, { beat: 'V28', zPin: 10.0 });
      // crawl, stopping where the straight-line distance to Port Moresby reaches 40 km
      const path = densify(KOKODA, 12);
      let stop = path.length - 1;
      for (let i = 0; i < path.length; i++) if (km(path[i][0], path[i][1], PL.moresby[0], PL.moresby[1]) <= 40) { stop = i; break; }
      const crawl = path.slice(0, stop + 1);
      const tc = after + 1.4, tcEnd = Math.max(tc + 3.0, s.end - 0.6);
      Vk(s.gapEnd, { ll: [147.65, -9.1], z: 8.5 }, { mode: 'glide', ease: 'lin' });
      add(after + 1.0, S.V29.start + 1.2, (ctx) => {
        const t = ctx.t, a = fio(t, after + 1.0, S.V29.start + 1.2, 0.3, 0.6);
        const u = ease.io2(prog(t, tc, tcEnd - tc));
        const pts = scr(ctx, crawl);
        const head = X.cut(pts, u);
        const hp = head[head.length - 1];
        const idx = Math.min(crawl.length - 1, Math.round(u * (crawl.length - 1)));
        const dd = u >= 1 ? 40 : Math.max(40, Math.round(km(crawl[idx][0], crawl[idx][1], PL.moresby[0], PL.moresby[1]) / 5) * 5);
        const pm = ctx.P(PL.moresby);
        return `<g opacity="${f2(a)}">${X.pin(pm[0], pm[1], { color: C.blue, size: 0.9 })}${X.label(pm[0], pm[1] + 40, 'Port Moresby', { size: 30 })}
          ${X.line(pts, u, { color: C.red, width: 7, under: 'rgba(241,230,203,0.8)', underW: 5 })}
          <circle cx="${f2(hp[0])}" cy="${f2(hp[1])}" r="9" fill="${C.red}" stroke="${C.redDk}" stroke-width="2"/>
          ${X.tag(hp[0] + 160, hp[1] - 80, `~${dd} km`, 2, { size: 40, type: false })}</g>`;
      }, 14);
      mus(tShell, 'tense', { fade: 1.0 });
    }
    // V29 Map: four pins light up in turn with a thunk each: Coral Sea, Midway, Kokoda, Milne Bay. On "The lifeline
    // held", the blue lifeline redraws, solid again, and Australia brightens. Sound: the music lifts.
    {
      const s = S.V29;
      Vk(s.start + 1.6, VIEW.pacificWin, { mode: 'fly', ease: 'io' });
      const tp = [A('V29', 'Coral Sea', 0.16), A('V29', 'Midway', 0.28), A('V29', 'Kokoda', 0.42), A('V29', 'Milne Bay', 0.58)];
      const tLH = A('V29', 'The lifeline held', 0.84);
      Vk(tLH - 0.3, { ll: [180, 0], z: 2.8 }, { mode: 'glide', ease: 'lin' });
      [[PL.coralSea, 'Coral Sea'], [PL.midway, 'Midway'], [PL.kokoda, 'Kokoda'], [PL.milneBay, 'Milne Bay']].forEach(([ll, n], i) => {
        const tEnd = S.V30.gapEnd - 0.4;
        add(tp[i], tEnd, (ctx) => { const p = ctx.P(ll); const glow = Math.exp(-(ctx.t - tp[i]) * 1.4); return `<circle cx="${f2(p[0])}" cy="${f2(p[1] - 30)}" r="${f2(30 + 30 * glow)}" fill="#ffe2a0" opacity="${f2(0.55 * glow)}" filter="url(#fGlow)"/>` + X.pin(p[0], p[1], { u: prog(ctx.t, tp[i], 0.7), color: C.gold, stroke: C.ink, o: fio(ctx.t, tp[i], tEnd, 0.05, 0.5) }); }, 16);
        placeLabel(ll, n, tp[i] + 0.3, S.V30.gapEnd - 0.4, { dy: 38, size: 30, dx: i === 3 ? 60 : i === 2 ? -60 : 0 });
        sfx('thunk', tp[i] + 0.3, -7);
      });
      add(tLH, S.V31.start + 0.3 * S.V31.dur, (ctx) => {
        const a = fio(ctx.t, tLH, S.V31.start + 0.3 * S.V31.dur, 0.1, 1.0);
        return X.line(scr(ctx, life), ease.io(prog(ctx.t, tLH, 1.6)), { color: C.blue, width: 13, under: C.blueDk, underW: 5, glow: 1.4, glowColor: '#7fb7f0', o: a });
      }, 12);
      add(tLH + 0.6, S.V31.start + 1.0, (ctx) => `<path d="${ausPath(ctx)}" fill="rgba(255,236,190,0.42)" stroke="rgba(255,236,190,0.9)" stroke-width="4" opacity="${f2(fio(ctx.t, tLH + 0.6, S.V31.start + 1.0, 1.0, 1.0))}" filter="url(#fSoft)"/>`, 5);
      look('dim', tLH, 0); look('dim', tLH + 1.2, -0.06); look('dim', S.V31.start + 1, 0);
      mus(tp[0] - 0.3, 'lift', { fade: 1.5 });
    }
    // V30 Map: a slow pull-out over the whole Pacific with the lifeline intact. Sound: music resolves and holds. Gap 2 s.
    {
      const s = S.V30;
      Vk(s.gapEnd, { ll: [182, -2], z: 2.45 }, { mode: 'glide', ease: 'io2' });
      mus(s.end, 'resolve');
    }

    /* =============================================================== ACT 5 */
    // V31 Map: years tick past (1942, 1945, 1951) as the war map fades into a modern map and the colour warms. A
    // treaty-document icon appears with an animated pen signature, and a blue triangle joins Australia, New Zealand
    // and the USA, labelled "ANZUS 1951".
    {
      const s = S.V31;
      Vk(s.end, { ll: [195, -3], z: 2.55 }, { mode: 'glide', ease: 'lin' });
      const ty = [F('V31', 0.06), F('V31', 0.2), F('V31', 0.34)];
      look('warm', ty[0], 0); look('warm', ty[2] + 0.8, 1, 'io2');
      add(ty[0], ty[2] + 2.2, (ctx) => {
        const t = ctx.t, a = fio(t, ty[0], ty[2] + 2.2, 0.2, 0.6);
        const yr = t >= ty[2] ? '1951' : t >= ty[1] ? '1945' : '1942';
        const tk = t >= ty[2] ? ty[2] : t >= ty[1] ? ty[1] : ty[0];
        const k = ease.back(prog(t, tk, 0.25));
        return `<g opacity="${f2(a)}" transform="translate(960 190) scale(${f2(0.7 + 0.3 * k)})">
          <rect x="-170" y="-78" width="340" height="120" fill="rgba(241,230,203,0.9)" stroke="${C.ink}" stroke-width="3"/>
          <text x="0" y="22" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="104" fill="${C.ink}" letter-spacing="6">${yr}</text></g>`;
      }, 30);
      add(ty[1], S.V34.start, (ctx) => {
        const a = prog(ctx.t, ty[1], 2.5) * (1 - prog(ctx.t, S.V32.start + 0.6, 0.8)) + prog(ctx.t, S.V33.start, 1.2) * 0.9;
        if (a <= 0.01) return '';
        return `<g opacity="${f2(Math.min(0.85, a))}">` + GEO.borders.map((r) => `<path d="${pathD(ctx, r)}" fill="none" stroke="#7a6248" stroke-width="1.3"/>`).join('') + '</g>';
      }, 3);
      const tt = F('V31', 0.42), tri = F('V31', 0.64), tA = A('V31', 'Anzus', 0.8);
      add(tt, s.end + 0.6, (ctx) => X.treaty(960, 560, prog(ctx.t, tt, 2.6), { o: fio(ctx.t, tt, s.end + 0.6, 0.1, 0.6) }), 31);
      const triPts = [PL.canberra, PL.wellington, PL.washington, PL.canberra];
      add(tri, S.V32.start + 1.2, (ctx) => {
        const a = fio(ctx.t, tri, S.V32.start + 1.2, 0.1, 0.6);
        const pts = scr(ctx, densify(triPts, 24));
        let o = X.line(pts, ease.io(prog(ctx.t, tri, 2.0)), { color: C.blue, width: 6, under: 'rgba(241,230,203,0.85)', underW: 4, glow: 0.8, o: a });
        [PL.canberra, PL.wellington, PL.washington].forEach((ll) => { const p = ctx.P(ll); o += `<circle cx="${f2(p[0])}" cy="${f2(p[1])}" r="9" fill="${C.blue}" stroke="${C.paper}" stroke-width="3" opacity="${f2(a)}"/>`; });
        const c = ctx.P([200, -8]);
        o += X.tag(c[0], c[1] + 30, 'ANZUS 1951', prog(ctx.t, tA, 0.8), { size: 40, accent: C.blue, o: a });
        return o;
      }, 20);
      mus(s.start - 0.3, 'warm', { level: 'bed', fade: 2.5 });
    }
    // V32 Map: a zoom-through into a harbour pin. B12 (5 s, warm palette). Edit gap 1 s.
    {
      const s = S.V32;
      const tIn = Math.max(s.start + 1.6, s.gapEnd - 0.5 - 5);
      Vk(tIn - 1.6, { ll: [151, -31], z: 4.8 }, { mode: 'fly', ease: 'io' });
      dropPin(PL.harbourPin, tIn - 1.4, tIn + 0.3, { thunk: false, color: '#c4622a' });
      zoomThrough('B12', PL.harbourPin, tIn, 5, { ll: [151, -31], z: 4.8 }, { ...VIEW.worldMig, d: 1.8 }, { beat: 'V32', zPin: 10.0, appr: 1.2 });
    }
    // V33 Map: migration arrows flow in from Britain and Europe, then from all over the world. The cities glow
    // brighter as a population counter climbs.
    {
      const s = S.V33;
      Vk(s.gapEnd, { ll: [112, 3], z: 2.3 }, { mode: 'glide', ease: 'lin' });
      const t1 = s.start + 0.3, t2 = F('V33', 0.38);
      const AU = { syd: PL.sydney, mel: PL.melbourne, per: PL.perth, bri: PL.brisbane, ade: PL.adelaide };
      const routesEU = [
        [[-1.5, 52.6], [-9, 44], [-6, 36], [5, 37.5], [20, 34.5], [32.5, 31.5], [33.5, 27], [43, 12.5], [65, 2], [100, -20], [AU.per[0], AU.per[1]]],
        [[12.5, 45.5], [15, 40], [20, 34.5], [32.5, 31.5], [33.5, 27], [43, 12.5], [72, -8], [120, -38], [AU.mel[0], AU.mel[1]]],
        [[22, 39.5], [28, 34], [32.5, 31.5], [33.5, 27], [43, 12.5], [80, -12], [130, -40], [AU.ade[0], AU.ade[1]]],
        [[-1.5, 52.6], [-12, 40], [-12, 20], [12, -34], [60, -38], [130, -42], [AU.syd[0], AU.syd[1]]],
      ];
      const routesW = [[[78, 22], [85, -10], [AU.per[0], AU.per[1]]], [[106, 16], [120, -10], [AU.syd[0], AU.syd[1]]], [[116, 32], [135, 0], [AU.bri[0], AU.bri[1]]],
        [[122, 13], [140, -12], [AU.syd[0], AU.syd[1]]], [[44, 33], [70, -15], [AU.mel[0], AU.mel[1]]], [[28, -8], [70, -30], [AU.per[0], AU.per[1]]],
        [[-100, 40], [-150, 0], [AU.syd[0], AU.syd[1]]], [[-65, -20], [-140, -30], [AU.mel[0], AU.mel[1]]]];
      const draw = (ctx, list, t0, col, w) => list.map((r, i) => X.arrow(scr(ctx, densify(r, 8)), ease.io(prog(ctx.t, t0 + i * 0.3, 2.2)), { width: w, color: col, dk: '#7a3a12', head: w * 2.6 })).join('');
      add(t1, S.V34.start + 0.4, (ctx) => {
        const a = fio(ctx.t, t1, S.V34.start + 0.4, 0.2, 0.5);
        return `<g opacity="${f2(a)}">${draw(ctx, routesEU, t1, '#c8642a', 7)}${draw(ctx, routesW, t2, '#d98c3a', 6)}</g>`;
      }, 13);
      placeLabel(PL.britain, 'Britain', t1, t2 + 1, { dy: -22 });
      placeLabel(PL.europe, 'Europe', t1 + 0.3, t2 + 1, { dy: -22 });
      add(t1 + 1.6, S.V34.start + 0.4, (ctx) => {
        const a = fio(ctx.t, t1 + 1.6, S.V34.start + 0.4, 0.4, 0.5);
        const g = prog(ctx.t, t1 + 1.6, s.dur);
        return Object.values(AU).map((ll, i) => { const p = ctx.P(ll); const r = 6 + 22 * g + 3 * Math.sin(ctx.t * 3 + i); return `<circle cx="${f2(p[0])}" cy="${f2(p[1])}" r="${f2(r * 2.2)}" fill="#ffd27a" opacity="${f2(0.35 * a)}" filter="url(#fGlow)"/><circle cx="${f2(p[0])}" cy="${f2(p[1])}" r="${f2(r * 0.45)}" fill="#fff0c4" opacity="${f2(a)}"/>`; }).join('');
      }, 14);
      // population counter: starts at the script's ~7 million and climbs as a spinning odometer (never settles)
      const tc = F('V33', 0.18);
      add(tc, S.V34.start + 0.4, (ctx) => popCounter(ctx.t - tc, fio(ctx.t, tc, S.V34.start + 0.4, 0.2, 0.5)), 30);
    }
    function popCounter(lt, a) {
      if (a <= 0) return '';
      const x = 1380, y = 860;
      const spin = clamp((lt - 1.4) / 0.6, 0, 1);
      let digits = '';
      if (spin <= 0) digits = `<text x="${x - 150}" y="${y + 14}" font-family="Elite" font-size="38" fill="${C.ink}">Population: ~7 million</text>`;
      else {
        digits = `<text x="${x - 150}" y="${y + 14}" font-family="Elite" font-size="38" fill="${C.ink}">Population:</text>`;
        for (let i = 0; i < 8; i++) {
          const speed = (8 - i) * (0.6 + spin * 2.6);
          const v = (lt * speed + i * 0.37 + (i === 0 ? 7 : 0)) % 10;
          const dx = x + 115 + i * 30 + (i > 1 ? 10 : 0) + (i > 4 ? 10 : 0);
          for (let k = -1; k <= 1; k++) {
            const d = (Math.floor(v) + k + 10) % 10, off = (v % 1) - k;
            digits += `<text x="${dx}" y="${f2(y + 14 - off * 40)}" font-family="Elite" font-size="38" fill="${C.ink}" opacity="${f2(clamp(1 - Math.abs(off) * 0.9, 0, 1))}" filter="url(#fBlurY)">${d}</text>`;
          }
        }
        digits += `<text x="${x + 410}" y="${y + 14}" font-family="Oswald" font-weight="700" font-size="40" fill="#c8642a">▲</text>`;
      }
      return `<g opacity="${f2(a)}"><rect x="${x - 176}" y="${y - 44}" width="${spin > 0 ? 640 : 520}" height="84" fill="${C.paper}" stroke="${C.inkSoft}" stroke-width="1.5"/><rect x="${x - 176}" y="${y - 44}" width="7" height="84" fill="#c8642a"/>
        <clipPath id="cPop"><rect x="${x - 170}" y="${y - 40}" width="630" height="76"/></clipPath><g clip-path="url(#cPop)">${digits}</g></g>`;
    }
    // V34 Map: split screen: the alternate 1942 map (red arrows, a cut lifeline) beside the real modern map.
    // End screen (10 s): the "IF AUSTRALIA…" badge on the map, space for subscribe and one suggested video. Music outro.
    const SPLIT_T = { t0: S.V34.start + 0.2, t1: T.endScreen.start + 0.6 };
    {
      const s = S.V34;
      mus(T.endScreen.start - 0.5, 'outro', { fade: 1.0 });
    }
    const endT = T.endScreen;

    /* =============================================================== frame() */
    CK.sort((a, b) => a.t - b.t);
    const camAt = camTrack(CK);
    const LT = Object.fromEntries(Object.entries(LK).map(([k, v]) => [k, track(v, 0)]));
    ITEMS.sort((a, b) => a.z - b.z);

    function overlays(t, c, extraFilter) {
      const ctx = { t, c, P: (ll) => P(c, ll[0], ll[1]) };
      let s = '';
      for (const it of ITEMS) if (t >= it.t0 && t <= it.t1 && (!extraFilter || extraFilter(it))) s += it.draw(ctx) || '';
      return s;
    }
    const DEFS2 = X.DEFS.replace('</defs>', `<radialGradient id="gSpace" cx="50%" cy="50%" r="75%"><stop offset="0.25" stop-color="#05060c" stop-opacity="0.15"/><stop offset="1" stop-color="#020308" stop-opacity="1"/></radialGradient>
      <filter id="fBlurY"><feGaussianBlur stdDeviation="0 1.6"/></filter></defs>`);

    function drift(c, t, amp = 1) {
      const k = scale(c);
      return { ...c, x: c.x + amp * (Math.sin(t * 0.17) * 6 + Math.sin(t * 0.071 + 1) * 4) / k, y: c.y + amp * (Math.cos(t * 0.13) * 4) / k, z: c.z + amp * 0.012 * Math.sin(t * 0.21) };
    }
    function lookAt(t) { return { night: LT.night(t), desat: LT.desat(t), warm: LT.warm(t), dim: LT.dim(t) }; }

    function splitFrame(t) {
      const k = ease.io(prog(t, SPLIT_T.t0, 1.4));
      const out = 1 - ease.io(prog(t, SPLIT_T.t1 - 0.9, 0.9));
      const xDiv = lerp(1920, 960, k * out);
      const base = { ll: [150, -14], z: 3.15 };
      const cL = { ...M.cam(base.ll[0], base.ll[1], base.z + 0.04 * Math.sin(t * 0.3)), cx: lerp(960, 480, k * out) };
      const cR = { ...M.cam(base.ll[0] + 2, base.ll[1], base.z + 0.06 * prog(t, SPLIT_T.t0, 8)), cx: lerp(960, 1440, k * out) };
      const ctxL = { t, c: cL, P: (ll) => P(cL, ll[0], ll[1]) }, ctxR = { t, c: cR, P: (ll) => P(cR, ll[0], ll[1]) };
      // left: alternate 1942 (red arrows to the north, the east coast and the islands; the cut lifeline)
      const ptsL = scr(ctxL, life);
      let L = X.line(X.cut(ptsL, 0.56), 1, { color: C.blue, width: 6, o: 0.7 }) + X.line(X.sub(ptsL, 0.68, 1), 1, { color: C.blue, width: 6, o: 0.7 });
      [[PL.tokyo, [131, -12.8], 0.14], [PL.tokyo, [152.9, -27.8], -0.1], [PL.truk, [176.6, -16.2], -0.12]].forEach(([a, b, bd], i) => {
        L += X.arrow(X.curve(ctxL.P(a), ctxL.P(b), bd, 36), ease.io(prog(t, SPLIT_T.t0 + 0.4 + i * 0.3, 1.2)), { width: 12 });
      });
      L += X.label(250, 120, '1942', { size: 64, font: 'Oswald', fill: C.redDk, ls: 6, o: k * out });
      // right: the real modern map (warm, ANZUS triangle, glowing cities)
      let R = GEO.borders.map((r) => `<path d="${pathD(ctxR, r)}" fill="none" stroke="#7a6248" stroke-width="1.2" opacity="0.8"/>`).join('');
      R += X.line(scr(ctxR, densify([PL.canberra, PL.wellington, PL.washington, PL.canberra], 24)), 1, { color: C.blue, width: 5, o: 0.85 });
      [PL.sydney, PL.melbourne, PL.brisbane, PL.perth, PL.adelaide].forEach((ll, i) => { const p = ctxR.P(ll); R += `<circle cx="${f2(p[0])}" cy="${f2(p[1])}" r="${f2(22 + 3 * Math.sin(t * 3 + i))}" fill="#ffd27a" opacity="0.4" filter="url(#fGlow)"/><circle cx="${f2(p[0])}" cy="${f2(p[1])}" r="8" fill="#fff0c4"/>`; });
      const lookL = { desat: 0.55, night: 0.12, warm: 0, dim: 0.05 }, lookR = { warm: 1, desat: 0, night: 0, dim: -0.03 };
      const torn = `<path d="M${f2(xDiv)} -10 ${Array.from({ length: 28 }, (_, i) => `L${f2(xDiv + Math.sin(i * 2.7) * 7)} ${i * 40}`).join(' ')} L${f2(xDiv)} 1100" fill="none" stroke="${C.paper}" stroke-width="8"/><path d="M${f2(xDiv)} -10 ${Array.from({ length: 28 }, (_, i) => `L${f2(xDiv + Math.sin(i * 2.7) * 7)} ${i * 40}`).join(' ')} L${f2(xDiv)} 1100" fill="none" stroke="${C.ink}" stroke-width="2" opacity="0.6"/>`;
      const svg = `${DEFS2}<clipPath id="cL"><rect x="0" y="0" width="${f2(xDiv)}" height="1080"/></clipPath><clipPath id="cR"><rect x="${f2(xDiv)}" y="0" width="${f2(1920 - xDiv)}" height="1080"/></clipPath>
        <g clip-path="url(#cL)">${L}</g><g clip-path="url(#cR)">${R}</g>${xDiv < 1919 ? torn : ''}`;
      const prev = camAt(SPLIT_T.t0);
      const views = k * out < 0.001 ? [{ cam: drift(t < SPLIT_T.t0 + 1 ? prev : cR, t), look: lookAt(t) }]
        : [{ cam: cL, look: lookL, clip: [0, xDiv] }, { cam: cR, look: lookR, clip: [xDiv, 1920] }];
      return { views, svg };
    }

    function endFrame(t) {
      const lt = t - endT.start;
      const c = drift(M.cam(146 + lt * 0.25, -20, 3.3 + lt * 0.012), t, 0.6);
      const a = clamp(lt / 0.8, 0, 1);
      const svg = `${DEFS2}<rect width="1920" height="1080" fill="rgba(30,20,10,0.18)"/>
        <g transform="translate(-370 30)">${titleBuild(2.2, a, 0.72)}</g>`;
      return { views: [{ cam: c, look: { warm: 1, desat: 0, night: 0, dim: 0.06 } }], svg };
    }

    function frame(t) {
      if (t >= endT.start) return endFrame(t);
      if (t >= SPLIT_T.t0) return splitFrame(t);
      const c = drift(camAt(t), t);
      return { views: [{ cam: c, look: lookAt(t) }], svg: DEFS2 + overlays(t, c) };
    }

    return { duration: T.duration, frame, broll: BROLL, sfx: SFX.sort((a, b) => a.t - b.t), music: MUS.sort((a, b) => a.t - b.t), anchors: ANCH, camKeys: CK, timeline: T };
  }

  G.buildScore = buildScore;
  G.SCORE_PLACES = PL;
})(typeof window !== 'undefined' ? window : globalThis);
