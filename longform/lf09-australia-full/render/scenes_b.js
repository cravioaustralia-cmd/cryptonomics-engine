/* lf09 scenes B: chapter 3 (rise), chapter 4 (pattern), chapter 5 (case against "copying"): S16-S32. */
(function () {
  const { C, P, lin, clamp, lerp, eo, eio, back, fade, esc, fmt } = E;
  const sc = RT.scene;
  const D = (y, m, d = 1) => (Date.UTC(y, m - 1, d) - Date.UTC(2023, 11, 1)) / 86400000;
  const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const TRACK = { on: ['ONE NATION', C.on], lab: ['LABOR GOVERNMENT', C.lab], coal: ['COALITION', C.coal], grey: ['LABOR 2023–24', C.grey] };

  // ---------- pattern board ----------
  // o: cam {c (day), ppd}, ys {on,lab,coal,grey}, show {on,lab,coal,grey: 0..1}, draw (0..1 line draw), nodes [], links [], ruler bool, op, labelX
  function board(t, o) {
    const ppd = o.cam.ppd, cx = o.cam.c; const X = (d) => 960 + (d - cx) * ppd;
    const ys = Object.assign({ on: 300, lab: 560, coal: 820, grey: 560 }, o.ys || {});
    const show = Object.assign({ on: 1, lab: 0, coal: 0, grey: 0 }, o.show || {});
    const draw = o.draw == null ? 1 : o.draw;
    let h = '';
    // grey (2023-24) section backdrop
    if (show.grey > 0) { const x0 = X(D(2023, 11, 20)), x1 = X(D(2025, 1, 1)); h += `<div class="abs" style="left:${x0}px;top:${(o.ys && o.ys.top) || 150}px;width:${x1 - x0}px;height:${(o.ys && o.ys.bottom || 900) - ((o.ys && o.ys.top) || 150)}px;background:rgba(138,138,138,${0.12 * show.grey});border:2px dashed rgba(138,138,138,${0.5 * show.grey})"></div><div class="abs" style="left:${x0 + 20}px;top:${((o.ys && o.ys.top) || 150) + 14}px;font:900 64px Inter;color:rgba(160,160,160,${0.45 * show.grey})">2023</div>`; }
    for (const k of ['on', 'lab', 'coal', 'grey']) {
      if (!(show[k] > 0)) continue;
      const y = ys[k]; const [nm, col] = TRACK[k];
      const xa = k === 'grey' ? X(D(2023, 11, 20)) : Math.max(0, X(o.from || D(2025, 11, 1)) - 40);
      const xb = k === 'grey' ? X(D(2025, 1, 1)) : X(o.to || D(2026, 10, 31)) + 40;
      const w = (xb - xa) * (k === 'grey' ? show.grey : draw);
      h += `<div class="abs" style="left:${xa}px;top:${y - 2}px;width:${w}px;height:4px;background:${col};opacity:${0.75 * show[k]};box-shadow:0 0 12px ${col}88"></div>`;
      if (k !== 'grey') h += `<div class="abs" style="left:${o.labelX == null ? 40 : o.labelX}px;top:${y - 44}px;font:800 20px Inter;letter-spacing:3px;color:${col};opacity:${show[k]};filter:brightness(1.25);text-shadow:0 2px 8px #000">${nm}</div>`;
    }
    // ruler
    if (o.ruler) {
      const ry = o.rulerY || 985; let r = '';
      for (let y = 2023; y <= 2026; y++) for (let m = 1; m <= 12; m++) {
        const d = D(y, m, 1); if (d < (o.rFrom == null ? -40 : o.rFrom) || d > (o.rTo == null ? 1100 : o.rTo)) continue; const x = X(d); if (x < -50 || x > 1970) continue;
        const rp = o.rulerP == null ? 1 : clamp((o.rulerP * 2000 - x) / 200, 0, 1);
        r += `<div class="abs" style="left:${x}px;top:${ry - 10}px;width:2px;height:${m === 1 ? 26 : 14}px;background:#888;opacity:${rp}"></div>`;
        if (ppd * 30 > 70 || m === 1 || m % 3 === 1) r += `<div class="abs" style="left:${x + 6}px;top:${ry + 6}px;font:700 16px Inter;color:#999;letter-spacing:1.5px;opacity:${rp}">${MON[m - 1]}${m === 1 || ppd * 30 > 70 ? ' ' + String(y).slice(2) : ''}</div>`;
      }
      h += `<div class="abs" style="left:0;top:${ry - 2}px;width:1920px;height:2px;background:#555"></div>` + r;
    }
    // links (threads) between nodes with gap pills
    const pos = {}; (o.nodes || []).forEach((n) => { pos[n.id] = [X(n.day) + (n.dx || 0), ys[n.track] + (n.dy || 0)]; });
    (o.links || []).forEach((l) => {
      if (!(l.p > 0)) return; const a = pos[l.a], b = pos[l.b]; if (!a || !b) return;
      h += E.thread([a, b], l.p, { sag: l.sag == null ? 0.1 : l.sag, color: l.color, glow: l.glow, w: l.w || 4 });
      if (l.gap && l.gapP > 0) { const mx = (a[0] + b[0]) / 2 + (l.gx || 0), my = (a[1] + b[1]) / 2 + Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.05 + (l.gy || 0); const pu = l.pulse ? 1 + 0.07 * Math.sin(t * 9) : 1; h += `<div class="abs" style="left:${mx}px;top:${my}px;transform:translate(-50%,-50%) scale(${back(l.gapP) * pu});background:#fff;color:#111;font:900 ${l.gfs || 26}px Inter;letter-spacing:2px;padding:6px 18px;border-radius:30px;white-space:nowrap;box-shadow:0 0 ${l.glowPill ? 30 : 10}px rgba(255,255,255,${l.glowPill ? 0.7 : 0.3})">${l.gap}</div>`; }
    });
    (o.nodes || []).forEach((n) => { const [x, y] = pos[n.id]; h += E.node(Object.assign({}, n, { x, y, col: TRACK[n.track][1] })); });
    return E.wrap(h, { op: o.op == null ? 1 : o.op, s: o.scale || 1, ox: 960, oy: o.oy || 540, y: o.y || 0 });
  }
  E.board = board; E.D = D;
  const pill = (text, x, y, p, o = {}) => `<div class="abs" style="left:${x}px;top:${y}px;transform:translate(-50%,-50%) scale(${back(p)});background:${o.bg || '#fff'};color:${o.col || '#111'};font:900 ${o.fs || 28}px Inter;letter-spacing:2px;padding:6px 18px;border-radius:30px;white-space:nowrap">${text}</div>`;
  const panel = (y, h, op = 0.88) => `<div class="abs" style="left:0;top:${y}px;width:1920px;height:${h}px;background:linear-gradient(180deg,rgba(14,14,14,0),rgba(14,14,14,${op}) 60px)"></div>`;

  // Chapter 3 compact strip (top) with nodes added as the chapter goes
  const CH3 = [
    { id: 'nov', day: D(2025, 11, 15), track: 'on', date: 'NOV 2025', title: 'First rated best on immigration · 27%', label: 'FACT', note: 'AFR poll' },
    { id: 'jan', day: D(2026, 1, 15), track: 'on', date: 'JAN 2026', title: 'Level with Coalition · 23%', label: 'FACT', note: 'DemosAU' },
    { id: 'mar', day: D(2026, 3, 21), track: 'on', date: 'MAR 2026', title: 'SA election · 22.9% · 4 seats', label: 'FACT', note: 'ECSA' },
    { id: 'may', day: D(2026, 5, 9), track: 'on', date: '9 MAY 2026', title: 'Farrer: first House seat', label: 'FACT', note: 'AEC' },
    { id: 'jun', day: D(2026, 6, 15), track: 'on', date: 'JUN 2026', title: 'Newspoll: One Nation 31', label: 'FACT', note: 'Newspoll' },
    { id: 'aug', day: D(2026, 8, 1), track: 'on', date: 'LATE JUL–AUG 2026', title: 'Best on immigration · ≈40%', label: 'FACT', note: 'RedBridge' },
  ];
  function ch3Strip(t, upto, o = {}) {
    const nodes = CH3.slice(0, upto).map((n, i) => Object.assign({}, n, { w: 230, fs: 17, dy: (i % 2 ? 46 : -46), p: i === upto - 1 && o.newT != null ? P(t, o.newT, 0.4) : 1, glow: i === upto - 1 ? 0.6 : 0 }));
    const cam = o.cam || { c: lerp(D(2025, 11, 1), D(2026, 4, 1), 0) , ppd: 4.3 };
    return board(t, { cam, ys: { on: 175, lab: 330 }, show: { on: 1, lab: o.lab || 0 }, draw: o.draw == null ? 1 : o.draw, nodes, from: D(2025, 10, 20), to: D(2026, 10, 31), labelX: 30 });
  }
  const ch3Cam = { c: D(2026, 4, 10), ppd: 4.35 };

  // ---------------- S16 ----------------
  sc('S16', (c) => {
    const { t } = c; const tSix = c.w('six'), tNew = c.w('new'), tFirst = c.w('first'), tBest = c.w('best'), tSome = c.w('something');
    c.sfx('split_flap', c.start, -6); c.sfx('pen', tSome, -6); c.sfx('stamp', tFirst, -3); c.sfx('whoosh', tBest, -6);
    let h = E.boardBg();
    const drawP = P(t, tSome - 0.1, 1.3, eio);
    // months-after-election counter before the board is born
    const pre = 1 - P(t, tSome - 0.2, 0.5);
    if (pre > 0) { h += E.splitFlap(t, c.start + 0.05, 'MAY 2025', 'NOV 2025', { x: 960, y: 380, cw: 70, ch: 100, op: pre }); h += `<div class="abs" style="left:0;right:0;top:500px;text-align:center;font:800 40px Inter;color:#ddd;letter-spacing:4px;opacity:${pre * P(t, tSix - 0.2, 0.3)}">+${Math.round(E.rollTo(t, tSix - 0.2, 0.6, 6))} MONTHS AFTER THE ELECTION</div>`; }
    if (t >= tSome - 0.2) {
      h += ch3Strip(t, t >= tSome + 0.6 ? 1 : 0, { cam: ch3Cam, draw: drawP, newT: tSome + 0.6 });
      h += E.stamp(t, tFirst, 'FIRST', { x: 960 + (CH3[0].day - ch3Cam.c) * ch3Cam.ppd + 120, y: 70, fs: 40, rot: -10 });
      // issue ranking chart
      const ov = P(t, tBest, 0.8, eio);
      let g = `<div class="abs" style="left:300px;top:430px;font:800 30px Inter;color:#fff;letter-spacing:3px">BEST PARTY TO HANDLE IMMIGRATION · NOV 2025</div>`;
      const rows = [['LABOR', C.lab, 0, 1, null], ['COALITION', C.coal, 1, 2, null], ['ONE NATION', C.on, 2, 0, 27]];
      rows.forEach(([n, col, r0, r1, v]) => {
        const r = lerp(r0, r1, ov); const y = 510 + r * 120;
        g += `<div class="abs" style="left:300px;top:${y}px;width:80px;height:90px;font:900 56px/90px Inter;color:#666">${Math.round(r) + 1}</div>`;
        g += `<div class="abs" style="left:400px;top:${y}px;width:300px;height:90px;font:800 30px/90px Inter;color:#fff">${n}</div>`;
        if (v) g += `<div class="abs" style="left:720px;top:${y + 15}px;width:${600 * P(t, tFirst - 0.5, 0.8, eio) * (27 / 30)}px;height:60px;background:${col};box-shadow:0 0 30px ${col}"></div><div class="abs" style="left:${740 + 540 * P(t, tFirst - 0.5, 0.8, eio)}px;top:${y}px;font:900 56px/90px Inter;color:#fff">27%</div>`;
        else g += `<div class="abs" style="left:720px;top:${y + 34}px;font:500 22px Inter;color:#888">ranked lower · figure not shown</div><div class="abs" style="left:700px;top:${y + 15}px;width:8px;height:60px;background:${col}"></div>`;
      });
      g += E.tag('FACT', { x: 1360, y: 428, note: 'AFR poll, reported via Poll Bludger' });
      h += `<div class="abs full" style="opacity:${P(t, tSome + 0.8, 0.5)}">${g}</div>`;
    }
    return h;
  });

  // ---------------- S17 ----------------
  sc('S17', (c) => {
    const { t } = c; const tDrew = c.w('drew'), t23 = c.w('23'), tMar = c.w('March'), tAlm = c.w('almost'), tSouth = c.w('South'), tFour = c.w('four');
    c.sfx('glass_clink', tDrew + 0.5, -4); c.sfx('tick_roll', tAlm, -6); [0, 0.22, 0.44, 0.66].forEach((d) => c.sfx('ping', tFour + d, -8)); c.sfx('whoosh', tMar - 0.2, -10);
    let h = E.boardBg();
    const second = t >= tMar - 0.3;
    h += ch3Strip(t, second ? 3 : 2, { cam: ch3Cam, newT: second ? tMar - 0.3 : c.start });
    if (!second) {
      const meet = P(t, tDrew, 0.6, eio);
      h += `<div class="abs" style="left:250px;top:420px;font:800 28px Inter;letter-spacing:3px;color:#fff">NATIONAL POLL · JAN 2026</div>`;
      [['ONE NATION', C.on, 470], ['COALITION', C.coal, 600]].forEach(([n, col, y], i) => {
        const v = 23 * (i === 0 ? P(t, c.start + 0.3, Math.max(0.6, tDrew + 0.6 - c.start - 0.3), eio) : P(t, c.start + 0.3, 0.7, eio));
        h += E.hbar({ x: 500, y, w: 900, h: 90, val: v / 32, col, label: n, valText: Math.round(v) + '%', fs: 28, vfs: 60 });
      });
      if (t > tDrew + 0.5) h += `<div class="abs" style="left:${500 + 900 * 23 / 32 - 3}px;top:450px;width:6px;height:260px;background:#fff;opacity:${1 - lin(t, tDrew + 0.5, 1.2) * 0.6};box-shadow:0 0 20px #fff"></div>`;
      h += E.pollCard(t, { x: 1500, y: 680, w: 520, t0: t23 + 0.3, pollster: 'DEMOSAU · JAN 2026', when: 'for Capital Brief', rows: [{ party: 'One Nation', val: '23', col: C.on }, { party: 'Coalition', val: '23', col: C.coal }], src: 'DemosAU for Capital Brief, reported by the Canberra Times, Jan 2026', rot: 2 });
    } else {
      // SA map with four seats lighting + Adelaide still behind
      h += `<div class="abs" style="left:0;top:380px;width:1920px;height:700px;opacity:${0.35 * P(t, tSouth - 0.4, 0.6)};overflow:hidden">${E.still('/stills/BR_STOCK_adelaide_skyline.jpg', t, tSouth - 0.4, { dur: 4, z0: 1.05, z1: 1.12, pos: '50% 60%' })}</div>`;
      const ms = 1.25; const sx = 520 - 290 * ms, sy = 580 - 410 * ms;
      h += E.ausMap({ x: sx, y: sy, s: ms, op: P(t, tMar - 0.2, 0.5), fill: 'rgba(255,255,255,.02)', stroke: 'rgba(255,255,255,.18)', hi: { 'South Australia': 'rgba(242,140,40,.28)' } });
      h += `<div class="abs" style="left:0;top:0;width:1920px;height:1080px;pointer-events:none"></div>`;
      h += `<div class="abs" style="left:900px;top:420px;font:800 28px Inter;letter-spacing:3px;color:#fff;opacity:${P(t, tMar, 0.4)}">SOUTH AUSTRALIAN STATE ELECTION · 21 MAR 2026</div>`;
      h += `<div class="abs" style="left:900px;top:470px;opacity:${P(t, tAlm - 0.2, 0.3)}"><span style="font:900 130px Inter;color:${C.on}">${E.rollTo(t, tAlm, 0.8, 22.9).toFixed(1)}%</span><span style="font:700 28px Inter;color:#ddd;margin-left:16px">ONE NATION VOTE</span></div>`;
      for (let i = 0; i < 4; i++) { const p = P(t, tFour + i * 0.22, 0.3, back); h += `<div class="abs" style="left:${900 + i * 130}px;top:690px;width:110px;height:110px;border:3px solid ${C.on};background:${p > 0.5 ? C.on : 'transparent'};transform:scale(${0.6 + 0.4 * p});box-shadow:${p > 0.5 ? '0 0 30px ' + C.on : 'none'};font:900 40px/104px Inter;color:#fff;text-align:center">${p > 0.5 ? i + 1 : ''}</div>`; }
      h += `<div class="abs" style="left:900px;top:820px;font:800 26px Inter;color:#ddd;letter-spacing:2px;opacity:${P(t, tFour, 0.3)}">4 HOUSE OF ASSEMBLY SEATS</div>`;
      h += E.tag('FACT', { x: 900, y: 870, note: 'Electoral Commission SA results', op: P(t, tMar, 0.4) });
      h += E.credit(E.clipCredit.BR_STOCK_adelaide_skyline, P(t, tSouth - 0.4, 0.4));
    }
    return h;
  });

  // ---------------- S18 ----------------
  sc('S18', (c) => {
    const { t } = c; const tDav = c.w('David'), tFirst = c.w('first'), tThat = c.w('that'), t31 = c.w('31'), t30 = c.w('30');
    c.sfx('stamp', tFirst, -2); c.sfx('whoosh', tThat, -4); c.sfx('bass_impact', t31, -6); c.sfx('bass_impact', t30, -6); c.sfx('shutter', tDav, -8);
    let h = E.boardBg();
    const second = t >= tThat - 0.5;
    h += ch3Strip(t, second ? 5 : 4, { cam: ch3Cam, newT: second ? tThat - 0.4 : c.start });
    if (!second) {
      // Farrer: NSW highlight + pin near Albury
      const ms = 1.15; const ox = 620 - 820 * ms, oy = 640 - 640 * ms;
      h += E.ausMap({ x: ox, y: oy, s: ms, op: P(t, c.start, 0.5), fill: 'rgba(255,255,255,.02)', stroke: 'rgba(255,255,255,.18)', hi: { 'New South Wales': 'rgba(242,140,40,.18)' } });
      const [ax, ay] = E.city('Albury'); const px = ox + ax * ms, py = oy + ay * ms; const pp = P(t, tDav, 0.4, back);
      h += `<div class="abs" style="left:${px - 32}px;top:${py - 64 - (1 - pp) * 60}px;opacity:${pp}">${E.icon('pin', { s: 64, color: C.on, fill: false, sw: 2 })}</div><div class="abs" style="left:${px - 70}px;top:${py - 6}px;width:140px;height:140px;border-radius:50%;background:radial-gradient(circle,${C.on}66,transparent 70%);opacity:${pp}"></div>`;
      h += `<div class="abs" style="left:${px + 30}px;top:${py - 30}px;font:800 26px Inter;color:#fff;opacity:${pp}">FARRER (NSW)</div>`;
      h += E.nameCard('David Farley', 'One Nation · won Farrer, 9 May 2026', 'on', t, { x: 1350, y: 520, t0: tDav - 0.1 });
      h += `<div class="abs" style="left:1120px;top:640px;font:600 24px Inter;color:#ddd;width:600px;opacity:${P(t, tFirst - 0.4, 0.4)}">First One Nation candidate ever elected to the House of Representatives</div>`;
      h += E.tag('FACT', { x: 1120, y: 720, note: 'AEC results', op: P(t, tFirst - 0.4, 0.4) });
      h += E.stamp(t, tFirst, 'FIRST', { x: 1600, y: 420, fs: 70, rot: -10 });
    } else {
      const fly = P(t, tThat - 0.5, 0.5, eo);
      h += E.wrap(E.pollCard(t, { x: 560, y: 450, w: 560, pollster: 'NEWSPOLL · JUNE 2026', when: 'Published 16 Jun 2026', n: 'n ≈ 1,240', rows: [{ party: 'One Nation', val: '31', col: C.on }, { party: 'Labor', val: '30', col: C.lab }, { party: 'Coalition', val: '18', col: C.coal }], src: 'Newspoll / The Australian, as reported by AAP (CityNews, 16 Jun 2026)' }), { x: lerp(-1200, 0, fly), rot: lerp(-20, -2, fly), ox: 560, oy: 650 });
      const on = t >= t31 ? 31 * P(t, t31, 0.18, eo) : 0, lab = t >= t30 ? 30 * P(t, t30, 0.18, eo) : 0;
      if (t >= t31) E.shake(t, t31, 5); if (t >= t30) E.shake(t, t30, 5);
      h += E.scoreboard({ on: t >= t31 - 0.05 ? on : null, lab: t >= t30 - 0.05 ? lab : null, x: 1120, y: 920, bw: 180, gap: 70, maxH: 420 });
      // thread loops back to the S01 knot
      h += E.thread([[560, 450], [300, 260], [lerp(300, 120, fly), 120]], fly, { sag: 0.2 });
    }
    return h;
  });

  // ---------------- S19 ----------------
  sc('S19', (c) => {
    const { t } = c; const tFour = c.w('4'), tBelow = c.w('below'), tFr = c.w('fringe'), tFront = c.w('front'), tGov = c.w('government'), tRed = c.w('Redbridge');
    [0, 0.12, 0.24, 0.36].forEach((d) => c.sfx('click', tFour + d, -6)); c.sfx('thud', tBelow, -4); c.sfx('marker', tFr, -4); c.sfx('type_thud', tFront, -4); c.sfx('pulse', tGov, -6);
    let h = E.boardBg();
    const redP = P(t, tGov, 0.8, eio);
    h += ch3Strip(t, 6, { cam: ch3Cam, newT: tRed - 0.3, lab: redP });
    if (redP > 0) { const x = 960 + (D(2026, 6, 15) - ch3Cam.c) * ch3Cam.ppd; const blink = Math.floor((t - tGov) * 2.5) % 2 === 0 ? 1 : 0.15; h += `<div class="abs" style="left:${x - 3}px;top:${305}px;width:6px;height:50px;background:${C.lab};opacity:${blink * redP}"></div><div class="abs" style="left:${x - 60}px;top:360px;font:800 16px Inter;letter-spacing:2px;color:${C.lab};opacity:${redP}">JUN 2026</div>`; }
    const kin = P(t, tFr - 1.0, 0.4); const chartOut = kin;
    // issue chart
    let g = `<div class="abs" style="left:240px;top:400px;font:800 28px Inter;letter-spacing:3px;color:#fff">BEST PARTY ON IMMIGRATION · REDBRIDGE · LATE JUL 2026</div>`;
    [['ONE NATION', C.on, 40, tRed], ['LABOR', C.lab, 17, tBelow - 0.6], ['LIBERAL', C.coal, 16, tBelow - 0.4]].forEach(([n, col, v, t0], i) => { const p = P(t, t0, 0.7, eio); g += E.hbar({ x: 480, y: 470 + i * 120, w: 1000, h: 84, val: (v / 45) * p, col, label: n, valText: p > 0 ? Math.round(v * p) : null, fs: 26, vfs: 56 }); });
    if (t >= tBelow) { const dp = P(t, tBelow, 0.5); const x = 480 + 1000 * 20 / 45; g += `<div class="abs" style="left:${x}px;top:${460}px;width:0;height:${380 * dp}px;border-left:4px dashed #fff"></div><div class="abs" style="left:${x - 30}px;top:860px;font:800 22px Inter;color:#fff;opacity:${dp}">20%</div>`; }
    // 4 of 10 tiles
    for (let i = 0; i < 10; i++) { const on = i < 4 && t >= tFour + i * 0.12; g += `<div class="abs" style="left:${1530 + (i % 5) * 64}px;top:${470 + Math.floor(i / 5) * 64}px;width:54px;height:54px;background:${on ? C.on : '#2b2b2b'};box-shadow:${on ? '0 0 16px ' + C.on : 'none'};opacity:${P(t, tFour - 0.4, 0.3)}"></div>`; }
    g += `<div class="abs" style="left:1530px;top:610px;font:800 24px Inter;color:#fff;opacity:${P(t, tFour, 0.3)}">≈ 4 IN 10</div>`;
    g += E.pollCard(t, { x: 1650, y: 680, w: 440, t0: tBelow + 0.8, pollster: 'REDBRIDGE · LATE JUL 2026', when: 'Best party on immigration', rows: [{ party: 'One Nation', val: '40', col: C.on }, { party: 'Labor', val: '17', col: C.lab }, { party: 'Liberal', val: '16', col: C.coal }], src: 'RedBridge, reported by MacroBusiness, Aug 2026 (39% in the August wave)', rot: 2 });
    h += `<div class="abs full" style="opacity:${1 - chartOut}">${g}</div>`;
    if (kin > 0) {
      const st = P(t, tFr, 0.35, eio);
      h += `<div class="abs" style="left:0;right:0;top:450px;text-align:center;opacity:${kin}"><span style="position:relative;font:900 150px Inter;color:#777;letter-spacing:4px">FRINGE<span style="position:absolute;left:-20px;top:50%;height:16px;width:${(100 + 6) * st}%;background:${C.thread};transform:rotate(-4deg);border-radius:8px"></span></span></div>`;
      h += `<div class="abs" style="left:0;right:0;top:660px;text-align:center;font:900 150px Inter;color:${C.on};letter-spacing:4px;text-shadow:0 0 40px ${C.on}66">${E.typeText('IN FRONT', lin(t, tFront - 0.1, 0.4))}</div>`;
    }
    return h;
  });

  // ---------------- Chapter 4: the full board ----------------
  const N = {
    jun_on: { id: 'jun_on', day: D(2026, 6, 15), track: 'on', date: 'JUN 2026', title: 'Newspoll: One Nation 31', label: 'FACT' },
    jun_lab: { id: 'jun_lab', day: D(2026, 6, 15), track: 'lab', date: 'SAME DAY', title: '225,000 pledge', label: 'FACT', thumb: 'albanese' },
    jul: { id: 'jul', day: D(2026, 7, 15), track: 'lab', date: 'JUL 2026', title: 'Working holiday visas paused/slowed · Direction 119', label: 'FACT', note: 'ABC', fs: 18 },
    aug: { id: 'aug', day: D(2026, 8, 15), track: 'lab', date: 'AUG 2026', title: 'Migration speech postponed', label: 'FACT' },
    sep_on: { id: 'sep_on', day: D(2026, 9, 14), track: 'on', date: '14 SEP 2026', title: 'One Nation plan', label: 'CLAIM', note: 'policy', thumb: 'hanson' },
    sep_lab: { id: 'sep_lab', day: D(2026, 9, 17), track: 'lab', date: '17 SEP 2026', title: 'Burke migration speech', label: 'FACT', thumb: 'burke' },
    oct_coal: { id: 'oct_coal', day: D(2026, 10, 6), track: 'coal', date: '6 OCT 2026', title: 'Coalition plan', label: 'CLAIM', note: 'policy', thumb: 'taylor' },
  };
  const ch4Full = { c: D(2026, 8, 12), ppd: 13.2 };
  function ch4Board(t, keys, o = {}) {
    const nodes = keys.map((k) => Object.assign({ w: 270, fs: 19 }, N[k], (o.np || {})[k] || {}));
    return board(t, Object.assign({ cam: o.cam || ch4Full, ys: o.ys || { on: 260, lab: 540, coal: 820 }, show: { on: 1, lab: 1, coal: 1, grey: o.grey || 0 }, nodes, links: o.links || [], ruler: true, rulerP: o.rulerP, from: D(2026, 5, 20), to: D(2026, 10, 25), rFrom: D(2026, 5, 1), rTo: D(2026, 10, 31) }, o.extra || {}));
  }
  E.ch4Board = ch4Board; E.N4 = N;
  const camTo = (t, t0, d, a, b) => { const p = P(t, t0, d, eio); return { c: lerp(a.c, b.c, p), ppd: lerp(a.ppd, b.ppd, p) }; };
  const zoomJun = { c: D(2026, 6, 28), ppd: 17 };

  // ---------------- S20 ----------------
  sc('S20', (c) => {
    const { t } = c; const tWatch = c.w('Watch'), tTops = c.w('tops'), t225 = c.w('225'), tAnth = c.w('Anthony');
    c.sfx('clock', tWatch, -6); c.sfx('pulse', tTops, -6); c.sfx('stamp', t225, -3); c.sfx('thread_snap', t225 + 0.15, -6); c.sfx('pop', t225 + 0.35, -6); c.sfx('shutter', tAnth, -8);
    let h = E.boardBg();
    const cam = camTo(t, c.start + 2.6, 1.4, ch4Full, zoomJun);
    const glowOn = t > tTops ? 0.6 + 0.4 * Math.sin((t - tTops) * 8) : 0;
    h += ch4Board(t, ['jun_on', 'jun_lab'], { cam, rulerP: lin(t, tWatch - 0.2, 1.2), np: { jun_on: { p: P(t, c.start + 0.8, 0.4), glow: glowOn, dy: 0 }, jun_lab: { p: P(t, t225, 0.3), stampIn: true, thumb: null } }, links: [{ a: 'jun_on', b: 'jun_lab', p: P(t, t225 + 0.1, 0.35, eio), gap: '+0 DAYS', gapP: P(t, t225 + 0.35, 0.3), gx: 150, sag: 0.02 }] });
    // PIN Albanese photo onto the red node
    if (t >= tAnth) {
      const X = 960 + (N.jun_lab.day - cam.c) * cam.ppd;
      h += E.photo('albanese', t, { x: 1380, y: 640, w: 260, h: 320, rot: 3, move: { type: 'drop', t0: tAnth, pinTo: { t0: t225 + 0.5, x: X + 100, y: 560, s: 0.32, rot: 6 } } });
      h += E.photoCredit('albanese', 0.8);
    }
    return h;
  });

  // ---------------- S21 ----------------
  sc('S21', (c) => {
    const { t } = c; const tPause = c.w('pauses'), tTony = c.w('Tony'), tNew = c.w('new'), tBack = c.w('back'), tMore = c.w('more');
    c.sfx('switch', tPause, -4); c.sfx('paper_slide', tBack - 0.3, -2); c.sfx('creak', tMore, -8); c.sfx('shutter', tTony, -6); c.sfx('shutter', tTony + 1.2, -8);
    let h = E.boardBg();
    const cam = camTo(t, c.start, 1.0, zoomJun, { c: D(2026, 7, 20), ppd: 15 });
    h += E.wrap(ch4Board(t, ['jun_on', 'jun_lab', 'jul'], { cam, ys: { on: 140, lab: 330, coal: 520 }, np: { jul: { p: P(t, c.start + 0.3, 0.35), stampIn: true, w: 330 } }, links: [{ a: 'jun_on', b: 'jun_lab', p: 1, gap: '+0 DAYS', gapP: 1, gx: 150, sag: 0.02 }], extra: { rulerY: 2000 } }), {});
    h += panel(560, 520, 0.92);
    // STACK: Burke + passport
    h += E.photo('burke', t, { x: 230, y: 790, w: 240, h: 290, rot: -4, move: { type: 'drop', t0: tTony } });
    h += E.photo(E.clipSrc('BR_STOCK_passport_desk_generic', t, tTony + 1.2, { offset: 1 }), t, { x: 520, y: 800, w: 330, h: 220, rot: 3, move: { type: 'drop', t0: tTony + 1.2 }, caption: false, pad: 12 });
    if (t >= tTony) h += E.lowerThird(t, tTony + 0.2, 'Tony Burke', 'Home Affairs Minister', { x: 40, y: 975, col: C.lab });
    // PAUSED toggle on a backpack
    const sw = P(t, tPause, 0.25);
    h += `<div class="abs" style="left:760px;top:620px;opacity:${P(t, tPause - 0.4, 0.3)}">${E.icon('backpack', { s: 110, color: C.paper, sw: 1.4 })}<div style="position:absolute;left:120px;top:30px;width:120px;height:56px;border-radius:28px;background:${sw > 0.5 ? C.lab : '#444'}"><div style="position:absolute;top:6px;left:${lerp(6, 70, sw)}px;width:44px;height:44px;border-radius:50%;background:#fff"></div></div><div style="position:absolute;left:250px;top:38px;font:900 34px Inter;color:${sw > 0.5 ? C.lab : '#888'}">PAUSED</div><div style="font:700 18px Inter;color:#aaa;margin-top:6px;letter-spacing:1px">WORKING HOLIDAY VISAS</div></div>`;
    // queue of tickets: skilled visa applied from overseas slides to the back
    const qp = P(t, tBack - 0.4, 0.9, eio); const qOp = P(t, tNew - 0.2, 0.4);
    let q = '';
    for (let i = 0; i < 6; i++) { const x = 1240 + i * 100 - (i > 0 ? qp * 100 : 0); q += `<div class="abs" style="left:${x}px;top:640px">${E.icon('ticket', { s: 90, color: '#bbb', sw: 1.3 })}</div>`; }
    const sx = lerp(1150, 1240 + 5 * 100 + 30, qp), sy = 640 - Math.sin(qp * Math.PI) * 120;
    q += `<div class="abs" style="left:${sx}px;top:${sy}px">${E.icon('ticket', { s: 90, color: C.lab, sw: 1.8 })}<div style="position:absolute;left:-40px;top:88px;width:170px;text-align:center;font:800 13px Inter;color:#fff;background:${C.lab};padding:3px">SKILLED VISA · APPLIED FROM OVERSEAS</div></div>`;
    q += `<div class="abs" style="left:1150px;top:600px;font:700 18px Inter;color:#888;letter-spacing:2px">FRONT</div><div class="abs" style="left:1800px;top:600px;font:700 18px Inter;color:#888;letter-spacing:2px">BACK</div>`;
    // wait bar
    const wb = P(t, tMore - 0.3, 1.0, eio);
    q += `<div class="abs" style="left:1150px;top:850px;font:700 20px Inter;color:#ccc;letter-spacing:2px">WAIT: SOME APPLICANTS</div><div class="abs" style="left:1150px;top:885px;width:${lerp(80, 700, wb)}px;height:40px;background:linear-gradient(90deg,#999,${C.lab})"></div><div class="abs" style="left:1150px;top:935px;font:800 22px Inter;color:#fff">DAYS</div><div class="abs" style="left:${1150 + lerp(80, 700, wb) - 100}px;top:935px;font:900 22px Inter;color:${C.lab};opacity:${wb}">1 YEAR+</div>`;
    h += `<div class="abs full" style="opacity:${qOp}">${q}</div>`;
    h += E.credit('Photo: UK Home Office · CC BY 4.0 · Footage: RDNE Stock project / Pexels (blurred)');
    return h;
  });

  // ---------------- S22 ----------------
  sc('S22', (c) => {
    const { t } = c; const tMaj = c.w('major'), tAbr = c.w('abruptly'), tPost = c.w('postponed'), tDis = c.w('disagreements');
    c.sfx('hum', tMaj, -10); c.sfx('switch', tPost, -2); c.sfx('stamp', tPost + 0.15, -3); c.sfx('clash', tDis, -6);
    let h = '';
    // stand-in for the empty lectern: the empty hall's stage microphone (AI B-roll), lights up then cut
    const lightUp = P(t, tMaj - 0.3, 0.8), cut = t >= tPost ? 1 : 0;
    const bright = cut ? 0.25 : lerp(0.55, 1.05, lightUp);
    h += E.clip('BR_AI_election_night_empty_hall', t, c.start, { dur: 9, offset: 4, z0: 1.9, z1: 2.05, x0: -120, x1: -150, y0: 120, y1: 120, filter: `brightness(${bright})` });
    if (!cut) h += `<div class="abs full" style="background:radial-gradient(ellipse at 50% 40%,rgba(255,230,170,${0.25 * lightUp}),transparent 60%)"></div>`;
    h += E.aiLabel(t, c.start + 0.1, 2.2);
    h += E.node({ x: 1500, y: 170, w: 340, date: 'AUG 2026', title: 'Migration speech postponed', col: C.lab, label: 'FACT', p: P(t, c.start + 0.4, 0.4) });
    h += E.stamp(t, tPost + 0.15, 'POSTPONED', { x: 960, y: 470, color: '#bdbdbd', fs: 100, rot: -8 });
    if (t >= tAbr) {
      h += E.card(t, { x: 960, y: 640, w: 980, t0: tPost + 0.6, outlet: 'ABC News', date: '17 Sep 2026', head: 'Migration speech postponed in August amid reported disagreement between ministers', hl: 'reported disagreement between ministers', hlP: lin(t, tDis, 0.8), label: 'FACT', note: 'as reported', src: 'ABC News, 17 Sep 2026', fs: 34 });
      const cl = P(t, tDis, 0.35, back);
      h += E.iconAt('chat', lerp(1300, 1395, cl), 610, { s: 70, color: C.lab, fill: true, op: P(t, tDis - 0.2, 0.2) }) + E.iconAt('chat', lerp(1560, 1465, cl), 610, { s: 70, color: '#ddd', fill: true, op: P(t, tDis - 0.2, 0.2), rot: 0 });
      if (cl > 0.95 && t < tDis + 0.8) h += `<div class="abs" style="left:1405px;top:560px;font:900 50px Inter;color:${C.yellow}">✶</div>`;
    }
    return h;
  });

  // ---------------- S23 ----------------
  sc('S23', (c) => {
    const { t } = c; const tPaul = c.w('Pauline'), t750 = c.w('750'), tNet = c.w('net'), tMore = c.w('more', 2), tLeave = c.w('leaving');
    c.sfx('shutter', tPaul, -6); c.sfx('shutter', tPaul + 1.0, -8); c.sfx('slot_roll', t750 - 0.2, -8); c.sfx('paper_slide', t750 + 0.5, -6); c.sfx('needle', tNet, -4); c.sfx('jet', tLeave - 0.2, -6);
    let h = E.boardBg();
    const cam = { c: D(2026, 9, 1), ppd: 15 };
    h += ch4Board(t, ['jun_on', 'jun_lab', 'jul', 'aug', 'sep_on'], { cam, ys: { on: 140, lab: 330, coal: 520 }, np: { sep_on: { p: P(t, c.start + 0.2, 0.4), stampIn: true, glow: 0.5 } }, links: [{ a: 'jun_on', b: 'jun_lab', p: 1, gap: '+0 DAYS', gapP: 1, gx: 150, sag: 0.02 }], extra: { rulerY: 2000 } });
    h += panel(470, 610, 0.94);
    h += E.photo('hanson', t, { x: 200, y: 760, w: 250, h: 300, rot: -4, move: { type: 'drop', t0: tPaul } });
    h += E.photo('joyce', t, { x: 330, y: 800, w: 220, h: 270, rot: 5, move: { type: 'drop', t0: tPaul + 1.0 } });
    if (t >= tPaul + 1.0) h += E.lowerThird(t, tPaul + 1.2, 'Barnaby Joyce', 'One Nation MP', { x: 40, y: 975, col: C.on, out: t750 + 3 });
    // card E11 with 750,000 roll
    h += E.card(t, { x: 1040, y: 540, w: 760, t0: t750 - 0.4, outlet: 'One Nation statement', date: '14 Sep 2026', head: 'One Nation plan: 750,000+ temporary visas cut over 3 years · net negative migration · then a 130,000 ceiling', hl: 'net negative migration', hlP: lin(t, tNet, 0.6), label: 'CLAIM', note: 'policy', src: 'One Nation statement, 14 Sep 2026; Times Higher Education and ABC, 14 Sep 2026', fs: 30 });
    if (t >= t750 - 0.4) { const v = E.rollTo(t, t750 - 0.2, 0.9, 750000); h += `<div class="abs" style="left:640px;width:800px;top:470px;text-align:center;opacity:${1 - P(t, tNet - 0.5, 0.4)}">${E.odometer(v, { h: 64, fs: 60, color: C.on, max: 999999 })}<span style="font:900 60px Inter;color:${C.on}">+</span></div>`; }
    for (let i = 0; i < 6; i++) { const f = P(t, t750 + 0.4 + i * 0.1, 0.6, eio); if (t > t750) h += E.iconAt('ticket', 1500 + i * 8, 520 - i * 10 + f * 300, { s: 60, color: C.paper, op: 1 - f, rot: f * (i % 2 ? 50 : -50) }); }
    // equation returns: departures outgrow arrivals, needle swings below zero
    const eqP = P(t, tNet - 0.6, 0.4);
    if (eqP > 0) {
      const big = P(t, tLeave - 0.2, 0.6, eio);
      let g = `<div class="abs" style="left:1460px;top:640px;text-align:center;width:180px">${E.icon('planeArr', { s: 90, sw: 1.4 })}<div style="font:800 16px Inter;letter-spacing:2px;color:#ccc">ARRIVALS</div></div>`;
      g += `<div class="abs" style="left:1640px;top:${lerp(640, 600, big)}px;text-align:center;width:${lerp(180, 260, big)}px">${E.icon('planeDep', { s: lerp(90, 160, big), sw: 1.4, color: big > 0.5 ? C.on : '#fff' })}<div style="font:800 16px Inter;letter-spacing:2px;color:#ccc">DEPARTURES</div></div>`;
      // gauge
      const ang = lerp(-40, 70, P(t, tNet, 0.8, back));
      g += `<svg class="abs" style="left:1480px;top:820px" width="380" height="200" viewBox="0 0 380 200"><path d="M30 180 A160 160 0 0 1 350 180" fill="none" stroke="#444" stroke-width="16"/><path d="M190 20 A160 160 0 0 1 350 180" fill="none" stroke="${C.on}" stroke-width="16" opacity=".8"/><text x="190" y="14" fill="#aaa" font-family="Inter" font-size="16" text-anchor="middle">0</text><line x1="190" y1="180" x2="${190 + Math.sin(ang * Math.PI / 180) * 140}" y2="${180 - Math.cos(ang * Math.PI / 180) * 140}" stroke="#fff" stroke-width="6" stroke-linecap="round"/><circle cx="190" cy="180" r="10" fill="#fff"/></svg>`;
      g += `<div class="abs" style="left:1500px;top:1030px;width:340px;text-align:center;font:900 30px Inter;color:${C.on};letter-spacing:3px;opacity:${P(t, tNet + 0.3, 0.3)}">NET NEGATIVE</div>`;
      g += `<div class="abs" style="left:700px;top:930px;width:720px;font:600 26px Inter;color:#fff;opacity:${P(t, tMore - 0.2, 0.4)}">Net negative = more people leaving Australia than arriving</div>`;
      h += `<div class="abs full" style="opacity:${eqP}">${g}</div>`;
    }
    h += E.credit('Photos: jfish92 · CC0 / David Foote, Australian Government · CC BY 3.0 AU', 0.85, 'left');
    return h;
  });

  // ---------------- S24 ----------------
  sc('S24', (c) => {
    const { t } = c; const tThree = c.w('three'), tTony = c.w('Tony'), tTight = c.w('Tighter'), tBal = c.w('ballot'), tFam = c.w('families');
    c.sfx('pop', tThree, -6); c.sfx('pop', tThree + 0.35, -6); c.sfx('thread_snap', c.start + 0.6, -6); c.sfx('tick', tTight, -4); c.sfx('tick', tBal, -4); c.sfx('spin', tBal + 0.1, -8); c.sfx('tick', tFam, -4); c.sfx('fade_tone', tFam + 0.2, -10);
    let h = E.boardBg();
    const cam = { c: D(2026, 9, 10), ppd: 15 };
    const flash = t > tThree && t < tThree + 0.7 ? (Math.floor((t - tThree) / 0.175) % 2 === 0 ? 1 : 0.35) : 1;
    h += ch4Board(t, ['jun_on', 'jun_lab', 'jul', 'aug', 'sep_on', 'sep_lab'], { cam, ys: { on: 140, lab: 330, coal: 520 }, np: { sep_lab: { p: P(t, c.start + 0.3, 0.4), stampIn: true, dx: 90, glow: 0.4 }, sep_on: { dx: -90 } }, links: [{ a: 'jun_on', b: 'jun_lab', p: 1, gap: '+0 DAYS', gapP: 1, gx: 150, sag: 0.02 }, { a: 'sep_on', b: 'sep_lab', p: P(t, c.start + 0.5, 0.4, eio), gap: '+3 DAYS', gapP: P(t, c.start + 0.8, 0.3) * flash, pulse: true, gy: -20, sag: 0.05 }], extra: { rulerY: 2000 } });
    h += panel(470, 610, 0.94);
    h += E.photo('burke', t, { x: 250, y: 790, w: 300, h: 360, rot: -2, move: { type: 'rise', t0: tTony - 0.2 } });
    if (t >= tTony) h += E.lowerThird(t, tTony + 0.3, 'Tony Burke', 'Home Affairs Minister · speech, 17 Sep 2026', { x: 470, y: 960, col: C.lab });
    // E12 checklist
    const items = [['Tighter rules on temporary visas', '(family members, switching visas, extending stays)', tTight, 'ticket'], ['Working holiday visa ballot', '', tBal, 'raffle'], ['Student family visas restricted', '(as reported)', tFam, 'family']];
    let g = `<div style="background:${C.paper};background-image:url(${E.TEX.paper});padding:24px 30px 18px;box-shadow:0 22px 50px rgba(0,0,0,.6);position:relative"><div style="font:700 16px Inter;letter-spacing:2.4px;color:#6b6257;text-transform:uppercase">Labor · 17 Sep 2026 · measures as reported</div>`;
    items.forEach(([a, b, t0, ic]) => {
      const p = P(t, t0, 0.25, back); const spin = ic === 'raffle' ? lerp(0, 360, P(t, t0 + 0.1, 0.8, eio)) : 0; const grey = ic === 'family' ? P(t, t0 + 0.2, 0.6) : 0;
      g += `<div style="display:flex;align-items:center;margin-top:16px"><div style="width:44px;height:44px;border:3px solid #333;border-radius:6px;position:relative;flex:none">${p > 0 ? `<div style="position:absolute;left:4px;top:-12px;font:900 44px Inter;color:${C.lab};transform:scale(${p})">✓</div>` : ''}</div>
        <div style="margin-left:18px;flex:1"><div style="font:600 30px 'Source Serif 4';color:#161616">${a}</div>${b ? `<div style="font:500 18px Inter;color:#6b6257">${b}</div>` : ''}</div><div style="opacity:${P(t, t0, 0.3) * (1 - grey * 0.75)};transform:rotate(${spin}deg);filter:grayscale(${grey})">${E.icon(ic, { s: 56, color: ic === 'family' ? '#7a5a2e' : '#333', sw: 1.6 })}</div></div>`;
    });
    g += `<div style="font:500 15px Inter;color:#7a7066;margin-top:16px;border-top:1px solid #d8d0c4;padding-top:8px">Source: ABC News, 16–17 Sep 2026; SmartCompany, 17 Sep 2026</div>${E.tag('FACT', { right: 18, y: 18, note: 'as reported' })}</div>`;
    h += `<div class="abs" style="left:900px;top:530px;width:900px;opacity:${P(t, tTight - 0.6, 0.4)};transform:translateY(${(1 - P(t, tTight - 0.6, 0.4)) * 30}px)">${g}</div>`;
    h += E.credit(E.PH.burke.credit);
    return h;
  });

  // ---------------- S25 ----------------
  sc('S25', (c) => {
    const { t } = c; const tAng = c.w('Angus'), t100 = c.w('100'), tLarg = c.w('largest'), tLink = c.w('linked');
    c.sfx('shutter', tAng, -6); c.sfx('tick_roll', t100 - 0.2, -6); c.sfx('snap', tLarg, -4); c.sfx('chain_rattle', tLink, -8); c.sfx('glass_clink', tLink + 0.4, -8);
    let h = E.boardBg();
    const cam = camTo(t, c.start, 1.0, { c: D(2026, 9, 10), ppd: 15 }, { c: D(2026, 9, 18), ppd: 15 });
    h += ch4Board(t, ['jun_on', 'jun_lab', 'jul', 'aug', 'sep_on', 'sep_lab', 'oct_coal'], { cam, ys: { on: 140, lab: 330, coal: 470 }, np: { oct_coal: { p: P(t, c.start + 0.4, 0.4), stampIn: true, glow: 0.4, dx: 60 }, sep_lab: { dx: 90 }, sep_on: { dx: -90 } }, links: [{ a: 'sep_on', b: 'sep_lab', p: 1, gap: '+3 DAYS', gapP: 1, gy: -20, sag: 0.05 }, { a: 'sep_on', b: 'oct_coal', p: P(t, c.start + 0.7, 0.6, eio), gap: '+22 DAYS', gapP: P(t, c.start + 1.2, 0.3), gx: 40, sag: 0.08 }], extra: { rulerY: 2000 } });
    h += panel(560, 520, 0.94);
    h += E.photo('taylor', t, { x: 210, y: 800, w: 260, h: 320, rot: -3, move: { type: 'drop', t0: tAng } });
    if (t >= tAng) h += E.lowerThird(t, tAng + 0.2, 'Angus Taylor', 'Opposition Leader', { x: 40, y: 975, col: C.coal });
    // blue bars
    const yrs = [['2028–29', 100000], ['2029–30', 100000], ['then', 130000], ['2031–32', 160000]];
    let g = `<div class="abs" style="left:450px;top:600px;font:800 24px Inter;letter-spacing:3px;color:#fff">COALITION PLAN · NET MIGRATION</div>`;
    yrs.forEach(([y, v], i) => { const p = P(t, t100 - 0.2 + i * 0.35, 0.6, eio); const hh = (v / 170000) * 300 * p; g += `<div class="abs" style="left:${470 + i * 150}px;top:${960 - hh}px;width:110px;height:${hh}px;background:${C.coal};box-shadow:0 0 20px ${C.coal}"></div><div class="abs" style="left:${450 + i * 150}px;top:${930 - hh}px;width:150px;text-align:center;font:900 26px Inter;color:#fff;opacity:${p}">${fmt(v * p)}</div><div class="abs" style="left:${450 + i * 150}px;top:975px;width:150px;text-align:center;font:600 18px Inter;color:#aaa">${y}</div>`; });
    g += E.tag('CLAIM', { x: 450, y: 640, note: 'policy' });
    h += `<div class="abs full" style="opacity:${P(t, t100 - 0.6, 0.4)}">${g}</div>`;
    // phrase + CLAIM tag snap
    if (t >= tLarg - 0.3) { const sp = P(t, tLarg + 0.4, 0.25, back); h += `<div class="abs" style="left:1100px;top:620px;width:760px;opacity:${P(t, tLarg - 0.3, 0.3)}"><div style="font:600 34px/1.25 'Source Serif 4';color:#F4EFE6">Taylor calls it the largest cut in Australian history</div><div style="margin-top:12px;transform:scale(${sp});transform-origin:0 50%">${E.tag('CLAIM', { inline: true, note: 'his description', s: 1.1 })}</div><div style="font:500 16px Inter;color:#999;margin-top:10px">Source: ABC News and The Conversation, 6 Oct 2026</div></div>`; }
    // house chained to a plane
    if (t >= tLink - 0.3) { const ch = P(t, tLink, 0.5, eio); h += `<div class="abs" style="left:1200px;top:850px;opacity:${P(t, tLink - 0.3, 0.3)}">${E.icon('house', { s: 90, color: C.paper })}</div><div class="abs" style="left:1520px;top:850px;opacity:${P(t, tLink - 0.3, 0.3)}">${E.icon('plane', { s: 90, color: C.paper })}</div><svg class="abs" style="left:1290px;top:870px" width="240" height="60"><path d="M0 30 L${230 * ch} 30" stroke="#ccc" stroke-width="6" stroke-dasharray="18 8"/></svg><div class="abs" style="left:1260px;top:950px;font:700 22px Inter;color:#ddd;opacity:${ch}">linked to homes built</div>`; }
    h += E.credit(E.PH.taylor.credit);
    return h;
  });

  // ---------------- S26 ----------------
  sc('S26', (c) => {
    const { t } = c; const tStr = c.w('strangest'), tAcc = c.w('accused'), tEven = c.w('even'), tBarn = c.w('Barnaby');
    c.sfx('hmm', tStr, -6); c.sfx('creak', tAcc, -6); c.sfx('rustle', tEven, -6); c.sfx('whoosh', c.start, -8); c.sfx('shutter', c.start + 0.4, -8);
    const tilt = P(t, tStr, 0.6, eio) * 3 * (1 - P(t, tEven + 1.2, 0.6));
    let h = E.boardBg();
    h += E.photo('joyce', t, { x: 330, y: 470, w: 330, h: 410, rot: -3, move: { type: 'splitL', t0: c.start } });
    h += E.photo('taylor', t, { x: 1590, y: 470, w: 330, h: 410, rot: 3, move: { type: 'splitR', t0: c.start + 0.15 } });
    // claim thread: orange from Joyce to the blue (Coalition) side
    const tp = P(t, tAcc - 0.2, 0.7, eio); const taut = P(t, tAcc + 0.4, 0.4);
    if (t >= tEven) {
      // tangle: three threads cross and wobble, then untangle
      const tg = Math.sin(clamp((t - tEven) / 1.4, 0, 1) * Math.PI);
      [[C.on, 380], [C.lab, 470], [C.coal, 560]].forEach(([col, y], i) => { const pts = [[520, y], [760, y + Math.sin(t * 6 + i) * 120 * tg + (1 - i) * 90 * tg], [1160, y - Math.sin(t * 5 + i * 2) * 120 * tg - (1 - i) * 90 * tg], [1400, y]]; h += E.thread(pts, 1, { color: col, sag: 0.02, knots: false, w: 5 }); });
    } else h += E.thread([[520, 470], [1400, 470]], tp, { sag: lerp(0.12, 0.0, taut), color: C.on, w: 5 });
    h += `<div class="abs" style="left:560px;top:560px;width:800px;text-align:center;opacity:${P(t, tAcc, 0.4) * (1 - P(t, tEven, 0.3))}"><div style="display:inline-block;border:3px solid ${C.on};padding:16px 22px;background:rgba(18,18,18,.85)"><div style="font:600 30px/1.3 'Source Serif 4';color:#F4EFE6">Joyce says the Coalition adopted One Nation’s policy</div><div style="margin-top:10px">${E.tag('CLAIM', { inline: true, note: 'reported 7 Oct 2026' })}</div></div></div>`;
    h += `<div class="abs" style="left:0;right:0;top:640px;text-align:center;font:900 96px Inter;color:${C.yellow};-webkit-text-stroke:4px ${C.thread};paint-order:stroke fill;opacity:${P(t, tEven + 0.2, 0.3)}">${E.typeText('WHO’S COPYING WHO?', lin(t, tEven + 0.2, 0.7))}</div>`;
    h += E.credit('Photos: David Foote, Australian Government · CC BY 3.0 AU / DCCEEW · CC BY 4.0');
    return E.wrap(h, { rot: tilt });
  });

  // ---------------- S27 ----------------
  sc('S27', (c) => {
    const { t } = c; const tSide = c.w('side'), tSeem = c.w('seemed'), tProof = c.w('pattern', 2), tVery = c.w('very');
    [0, 0.2, 0.4].forEach((d) => c.sfx('pop', tSide + d, -6)); c.sfx('riser', tSeem, -8); c.sfx('stamp', tProof + 0.2, -1); c.sfx('paper_slide', tVery, -2);
    let h = E.boardBg();
    const glow = P(t, tSeem, 0.8);
    const slide = P(t, tVery, 1.0, eio);
    const cam = ch4Full;
    const lc = glow > 0 ? `rgb(${lerp(242, 214, glow)},${lerp(140, 40, glow)},${lerp(40, 40, glow)})` : C.thread;
    const shudder = t > tVery && t < tVery + 0.3 ? Math.sin((t - tVery) * 80) * 4 : 0;
    h += `<div class="abs" style="left:${-470 + slide * 470}px;top:120px;width:440px;height:800px;background:rgba(138,138,138,.10);border:2px dashed rgba(138,138,138,.45)"><div style="position:absolute;left:24px;top:16px;font:900 90px Inter;color:rgba(170,170,170,.45)">2023</div><div style="position:absolute;left:24px;top:130px;font:700 20px Inter;letter-spacing:2px;color:rgba(170,170,170,.6)">LABOR · EARLIER MOVES</div></div>`;
    h += E.wrap(ch4Board(t, ['jun_on', 'jun_lab', 'jul', 'aug', 'sep_on', 'sep_lab', 'oct_coal'], { cam, np: { jun_on: { glow: 0.5 + glow * 0.5 }, sep_on: { glow: 0.5 + glow * 0.5, dx: -70 }, sep_lab: { dx: 70 } }, links: [
      { a: 'jun_on', b: 'jun_lab', p: 1, gap: '+0 DAYS', gapP: P(t, tSide, 0.25), gx: 150, sag: 0.02, color: lc, glow: glow * 10, glowPill: glow > 0 },
      { a: 'sep_on', b: 'sep_lab', p: 1, gap: '+3 DAYS', gapP: P(t, tSide + 0.2, 0.25), color: lc, glow: glow * 10, glowPill: glow > 0 },
      { a: 'sep_on', b: 'oct_coal', p: 1, gap: '+22 DAYS', gapP: P(t, tSide + 0.4, 0.25), color: lc, glow: glow * 10, glowPill: glow > 0, gx: 30 }], extra: { scale: lerp(1, 0.94, P(t, c.start, 1)) } }), { x: slide * 470 + shudder, s: lerp(1, 0.82, slide), ox: 1920, oy: 540 });
    h += E.stamp(t, tProof + 0.2, 'PATTERN ≠ PROOF', { x: 960, y: 520, color: '#c8c8c8', dashed: true, fs: 96, rot: -6, bg: 'rgba(18,18,18,.82)', amp: 6 });
    if (t >= tProof + 0.2) h += E.tag('ANALYSIS', { x: 1290, y: 600 });
    return h;
  });

  // ---------------- S28 ----------------
  sc('S28', (c) => {
    const { t } = c; const tDec = c.w('December'), tLong = c.w('long'), tAnth = c.w('Anthony'), tSus = c.w('sustainable'), tHis = c.w('His'), tPost = c.w('post');
    c.sfx('split_flap', tDec - 0.1, -4); c.sfx('zip', tLong, -4); c.sfx('marker', tSus, -8); c.sfx('descend', tPost, -8); c.sfx('shutter', tAnth, -8); c.sfx('shutter', tHis, -8);
    let h = E.boardBg();
    const cam = { c: D(2024, 11, 1), ppd: 1.45 };
    const dec = { id: 'dec', day: D(2023, 12, 12), track: 'grey', date: 'DEC 2023', title: 'Migration Strategy', label: 'FACT', w: 270, p: P(t, tDec, 0.4), stampIn: true };
    const nov = { id: 'nov', day: D(2025, 11, 15), track: 'on', date: 'NOV 2025', title: 'First rated best on immigration', label: 'FACT', w: 250, fs: 17 };
    h += board(t, { cam, ys: { on: 170, lab: 290, coal: 410, grey: 290, top: 60, bottom: 360 }, show: { on: 1, lab: 1, coal: 0, grey: 1 }, nodes: [dec, nov], from: D(2025, 10, 1), to: D(2026, 10, 31), labelX: 40 });
    // ruler from DEC 2023 to NOV 2025
    const X = (d) => 960 + (d - cam.c) * cam.ppd; const rp = P(t, tLong, 0.9, eio);
    if (rp > 0) { const x0 = X(dec.day), x1 = lerp(x0, X(nov.day), rp); h += `<div class="abs" style="left:${x0}px;top:380px;width:${x1 - x0}px;height:34px;background:repeating-linear-gradient(90deg,${C.yellow} 0 2px,transparent 2px 24px),${C.yellow}22;border-top:3px solid ${C.yellow}"></div><div class="abs" style="left:${(x0 + x1) / 2}px;top:424px;transform:translateX(-50%);font:900 30px Inter;color:${C.yellow};letter-spacing:3px;opacity:${rp}">23 MONTHS EARLIER</div>`; }
    h += E.splitFlap(t, tDec - 0.1, 'NOV 2025', 'DEC 2023', { x: 1500, y: 500, cw: 46, ch: 66, d: 0.6, op: 1 - P(t, tAnth - 0.5, 0.4) });
    h += panel(480, 600, 0.92);
    // STACK Albanese + O'Neil
    h += E.photo('albanese', t, { x: 230, y: 780, w: 260, h: 320, rot: -4, move: { type: 'drop', t0: tAnth } });
    h += E.photo('oneil', t, { x: 400, y: 810, w: 230, h: 290, rot: 4, move: { type: 'drop', t0: tHis } });
    if (t >= tHis) h += E.lowerThird(t, tHis + 0.2, 'Clare O’Neil', 'Home Affairs Minister, 2023', { x: 40, y: 985, col: C.lab });
    h += E.quote(t, { x: 1100, y: 560, w: 900, t0: tAnth - 0.2, outlet: 'Reported Dec 2023', date: 'Fox News, 12 Dec 2023', q: '“sustainable level.”', hl: 'sustainable level.', hlP: lin(t, tSus, 0.6), sub: 'Anthony Albanese · Dec 2023 · on bringing migration back down', label: 'FACT', note: 'his words', src: 'Reported Dec 2023 (Fox News, 12 Dec 2023)', fs: 56 });
    if (t >= tPost - 0.3) { const p = P(t, tPost - 0.3, 0.4); const dn = P(t, tPost + 0.3, 0.6, eio); h += `<div class="abs" style="left:1600px;top:870px;opacity:${p}">${E.icon('peak', { s: 110, color: '#ddd', sw: 1.4 })}</div><div class="abs" style="left:1720px;top:${840 + dn * 40}px;opacity:${p}">${E.icon('arrowDown', { s: 90, color: C.lab, sw: 2.4 })}</div><div class="abs" style="left:1560px;top:990px;font:700 20px Inter;color:#ccc;opacity:${p}">POST-COVID PEAK</div>`; }
    h += E.credit('Photos: David Foote (AUSPIC/DPS) via DFAT · CC BY 4.0 / DFAT · CC BY 4.0');
    return h;
  });

  // ---------------- S29 ----------------
  sc('S29', (c) => {
    const { t } = c; const tDid = c.w('did'), t45 = c.w('45'), tBef = c.w('before'), tFell = c.w('fell');
    c.sfx('descend', tDid, -6); c.sfx('pop', t45, -4); c.sfx('sweep', tBef, -6);
    let h = E.boardBg();
    const ch = E.nomChart(t, { x: 230, y: 180, w: 1300, h: 560, gate: 1, rise: 1, fall: P(t, tDid, 1.6, eio), xMax: 2027.0 });
    h += ch.svg;
    // One Nation polling line on a second axis (election result + polls cited in this film)
    const onP = P(t, tFell, 1.5, eio);
    const Y2 = (v) => 180 + 560 - (v / 40) * 560;
    const pts = [[2025.37, 6.4], [2026.04, 23], [2026.45, 31], [2026.71, 30], [2026.77, 28]].map(([x, v]) => [ch.X(x), Y2(v)]);
    let pth = `M${pts[0][0]},${pts[0][1]}`; pts.slice(1).forEach((p) => (pth += ` L${p[0]},${p[1]}`));
    h += `<svg class="abs full" viewBox="0 0 1920 1080" style="opacity:${onP}"><path d="${pth}" fill="none" stroke="${C.on}" stroke-width="5" stroke-dasharray="1000" stroke-dashoffset="${1000 * (1 - onP)}"/>${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${C.on}"/>`).join('')}
      ${[0, 10, 20, 30, 40].map((v) => `<text x="${230 + 1300 + 16}" y="${Y2(v) + 7}" fill="${C.on}" font-family="Inter" font-size="18">${v}%</text>`).join('')}</svg>`;
    h += `<div class="abs" style="left:1580px;top:180px;width:300px;font:700 18px/1.3 Inter;color:${C.on};opacity:${onP}">ONE NATION PRIMARY VOTE<br><span style="font-weight:500;color:#c9a27a">2025 election 6.4% · polls cited in this film (Jan, Jun, Sep, Oct 2026)</span></div>`;
    // shaded band: most of the fall
    const bp = P(t, tBef, 0.8, eio);
    if (bp > 0) { const x0 = ch.X(2023.5), x1 = ch.X(2025.5); h += `<div class="abs" style="left:${x0}px;top:180px;width:${(x1 - x0) * bp}px;height:560px;background:rgba(212,160,23,.14);border-left:2px solid ${C.gold}"></div><div class="abs" style="left:${x0 + 16}px;top:640px;font:900 26px Inter;color:${C.gold};letter-spacing:2px;opacity:${bp}">MOST OF THE FALL</div>`; h += E.tag('ANALYSIS', { x: x0 + 16, y: 680, note: 'timing comparison, our chart', op: bp }); }
    if (t >= t45) h += `<div class="abs" style="left:${ch.X(2024.3)}px;top:${ch.Y(450000)}px;transform:scale(${back(P(t, t45, 0.3))});font:900 64px Inter;color:#fff;text-shadow:0 4px 20px #000">≈ −45%</div>`;
    h += E.card(t, { x: 960, y: 830, w: 1300, t0: tFell, outlet: 'ABS via Business Today (18 Jun 2026); AAP', date: '14 Sep 2026', head: 'Net overseas migration 530,620 (2023) → 301,000 (2025) · about −45% from the post-COVID peak', hl: 'about −45%', hlP: lin(t, t45, 0.5), label: 'FACT', fs: 28 });
    return h;
  });

  // ---------------- S30 ----------------
  sc('S30', (c) => {
    const { t } = c; const tFore = c.w('forecast'), tTarget = c.w('target'), tGap = c.w('gap'), t225 = c.w('225', 2), t100 = c.w('100'), tNeg = c.w('negative');
    c.sfx('page_turn', tFore - 0.2, -4); c.sfx('stamp', tTarget, -2); c.sfx('tick_roll', t225 - 0.2, -6); c.sfx('tick_roll', t100 - 0.2, -6); c.sfx('swoop', tNeg, -4);
    let h = E.boardBg();
    const phase2 = t >= tGap - 0.2;
    if (!phase2) {
      const z = P(t, tFore - 0.2, 0.6, eio) * (1 - P(t, tTarget + 1.2, 0.5, eio));
      let cd = E.card(t, { x: 960, y: 330, w: 1200, t0: c.start + 0.1, outlet: 'ABC News', date: '6 Oct 2026', head: 'Budget forecast → government target: 245,000 by June 2027 · 225,000 by mid-2028', hl: 'forecast', hlP: lin(t, tFore, 0.4), label: 'FACT', src: 'ABC News, 6 Oct 2026', fs: 46 });
      h += E.wrap(cd, { s: lerp(1, 1.9, z), ox: 640, oy: 400 });
      h += E.stamp(t, tTarget, 'TARGET', { x: 960, y: 560, fs: 110, rot: -8 });
      h += `<div class="abs" style="left:0;right:0;top:860px;text-align:center;font:600 30px Inter;color:#ddd;opacity:${P(t, tTarget + 0.5, 0.4)}">Labor’s 225,000 first appeared as a budget forecast, then became the target</div>`;
    } else {
      const base = 640, sc_ = 360 / 225000;
      let g = `<div class="abs" style="left:0;right:0;top:110px;text-align:center;font:800 32px Inter;letter-spacing:4px;color:#fff">THREE PLANS · NET OVERSEAS MIGRATION</div><div class="abs" style="left:260px;top:${base}px;width:1400px;height:3px;background:#bbb"></div><div class="abs" style="left:200px;top:${base - 12}px;font:700 20px Inter;color:#aaa">0</div>`;
      const bars = [['LABOR', C.lab, 225000, t225, '225,000', 'by mid-2028'], ['COALITION', C.coal, 100000, t100, '100,000', 'first two years'], ['ONE NATION', C.on, -60000, tNeg, 'BELOW ZERO', 'net negative · 3 years · figure not specified']];
      bars.forEach(([n, col, v, t0, txt, sub], i) => {
        const p = P(t, t0 - 0.2, 0.7, eio); const hh = Math.abs(v) * sc_ * p; const x = 420 + i * 420;
        g += v > 0 ? `<div class="abs" style="left:${x}px;top:${base - hh}px;width:220px;height:${hh}px;background:${col};box-shadow:0 0 30px ${col}66"></div>` : `<div class="abs" style="left:${x}px;top:${base + 3}px;width:220px;height:${hh}px;background:repeating-linear-gradient(180deg,${col} 0 14px,${col}88 14px 22px);box-shadow:0 0 30px ${col}66"></div>`;
        g += `<div class="abs" style="left:${x - 90}px;width:400px;text-align:center;top:${v > 0 ? base - hh - 70 : base + hh + 14}px;font:900 44px Inter;color:#fff;opacity:${p}">${v > 0 ? fmt(v * p) : txt}</div>`;
        g += `<div class="abs" style="left:${x - 90}px;width:400px;text-align:center;top:${v > 0 ? base + 20 : base - 96}px;font:800 26px Inter;color:${col};filter:brightness(1.3);letter-spacing:2px;opacity:${P(t, tGap, 0.4)}">${n}</div><div class="abs" style="left:${x - 90}px;width:400px;text-align:center;top:${v > 0 ? base + 56 : base - 60}px;font:500 19px Inter;color:#aaa;opacity:${P(t, tGap, 0.4)}">${sub}</div>`;
        g += `<div class="abs" style="left:${x + 40}px;top:${v > 0 ? base + 92 : base + Math.abs(v) * sc_ + 70}px;opacity:${p}">${E.tag('CLAIM', { inline: true, note: 'policy', s: 0.75 })}</div>`;
      });
      g += `<div class="abs" style="left:260px;top:1000px;font:500 17px Inter;color:#999">Sources: ABC News, 6 Oct 2026 (Labor target); ABC / The Conversation, 6 Oct 2026 (Coalition); One Nation, 14 Sep 2026</div>`;
      h += `<div class="abs full" style="opacity:${P(t, tGap - 0.2, 0.4)}">${g}</div>`;
    }
    return h;
  });

  // ---------------- S31 ----------------
  sc('S31', (c) => {
    const { t } = c; const tHead = c.w('head'), tMur = c.w('Murray'), tRec = c.w('recession'), tPat = c.w('Patrick'), tWith = c.w('within'), tTony = c.w('Tony'), tAbs = c.w('absurd');
    c.sfx('card_fan', tHead, -4); c.sfx('dip', tRec, -6); c.sfx('clock_whirr', tWith, -6); c.sfx('marker', tAbs, -8); c.sfx('shutter', tMur, -8); c.sfx('shutter', tPat, -8); c.sfx('shutter', tTony, -8);
    let h = E.boardBg();
    const fan = P(t, tHead - 0.2, 0.6, back);
    const cols = [
      { key: 'watt', t0: tMur, x: 330, rot: -4, card: { outlet: 'ABC News', date: '17 Sep 2026', q: '“probably drive the Australian economy into recession.”', sub: 'Murray Watt · Environment Minister', label: 'FACT', note: 'his words', src: 'ABC News, 17 Sep 2026', hlt: tRec, hl: 'recession.”' } },
      { key: 'gorman', t0: tPat, x: 960, rot: 0, card: { outlet: 'AAP', date: '14 Sep 2026', head: 'Patrick Gorman (Labor) mocked the plan, saying it took 30 years to write and fell apart within half an hour', label: 'CLAIM', note: 'paraphrase', src: 'AAP, 14 Sep 2026', hlt: tWith, hl: 'within half an hour' } },
      { key: 'burke', t0: tTony, x: 1590, rot: 4, card: { outlet: 'SmartCompany', date: '17 Sep 2026', q: '“absurd claims” that Australia is a nation of mass migration.', sub: 'Tony Burke · 17 Sep 2026', label: 'FACT', note: 'his words', src: 'SmartCompany, 17 Sep 2026', hlt: tAbs, hl: '“absurd claims”' } },
    ];
    cols.forEach((k, i) => {
      const flip = P(t, k.t0 - 0.2, 0.45, eio); const active = t >= k.t0 && (i === 2 || t < cols[i + 1].t0);
      const x = lerp(960, k.x, fan), rot = lerp(0, k.rot, fan) * (1 - flip);
      if (fan <= 0) return;
      const back_ = `<div class="abs" style="left:${x - 280}px;top:180px;width:560px;height:760px;background:#5a1014;border:6px solid #e9e2d6;box-shadow:0 20px 40px rgba(0,0,0,.6);transform:rotate(${rot}deg) scaleX(${Math.max(0, 1 - flip * 2)});display:flex;align-items:center;justify-content:center"><div style="font:900 160px Inter;color:#e9e2d6;opacity:.4">?</div></div>`;
      if (flip < 0.5) { h += back_; return; }
      const sx = (flip - 0.5) * 2;
      let face = E.photo(k.key, t, { x, y: 330, w: 230, h: 280, rot: 0, move: { t0: k.t0 } });
      const cardO = Object.assign({ x, y: 540, w: 560, fs: k.card.q ? 30 : 26 }, k.card); cardO.hlP = lin(t, k.hlt, 0.6);
      face += k.card.q ? E.quote(t, Object.assign(cardO, { fs: 30 })) : E.card(t, cardO);
      if (i === 0) face += `<div class="abs" style="left:${x + 120}px;top:220px;opacity:${P(t, tRec, 0.3)}">${E.icon('chartDip', { s: 80, color: t > tRec ? C.lab : '#fff', sw: 2 })}</div>`;
      if (i === 1) { const a = lerp(0, 180, P(t, tWith, 0.9, eio)); face += `<div class="abs" style="left:${x + 120}px;top:220px;opacity:${P(t, tWith - 0.2, 0.3)}"><svg width="80" height="80" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="1.7"/><path d="M12 12 L12 5" stroke="#fff" stroke-width="1.7"/><path d="M12 12 L${12 + Math.sin(a * Math.PI / 180) * 7} ${12 - Math.cos(a * Math.PI / 180) * 7}" stroke="${C.yellow}" stroke-width="2"/><path d="M12 3 A9 9 0 ${a > 180 ? 1 : 0} 1 ${12 + Math.sin(a * Math.PI / 180) * 9} ${12 - Math.cos(a * Math.PI / 180) * 9}" fill="none" stroke="${C.yellow}" stroke-width="2.5"/></svg></div>`; }
      h += `<div class="abs full" style="transform-origin:${x}px 540px;transform:scaleX(${sx}) scale(${active ? 1.0 : 0.94});opacity:${active ? 1 : 0.72}">${face}</div>`;
    });
    h += E.credit('Photos: Yu Chu Chin · CC BY-SA 4.0 / PM&C · CC BY 4.0 / UK Home Office · CC BY 4.0');
    return h;
  });

  // ---------------- S32 ----------------
  sc('S32', (c) => {
    const { t } = c; const tCopy = c.w('copying'), tFin = c.w('finishing'), tVot = c.w('voters'), tPay = c.w('pay');
    c.sfx('tone_a', tCopy, -8); c.sfx('tone_b', tFin, -8); c.sfx('chord', tVot, -8); c.sfx('receipt', tPay - 0.1, -4);
    let h = E.boardBg();
    const a = P(t, tCopy, 0.5), b = P(t, tFin, 0.5);
    const togg = t < tFin ? a : (t < tVot ? 1 - P(t, tFin, 0.4) * 0.7 : 1);
    const cam = { c: D(2025, 3, 1), ppd: 1.32 };
    const nodes = [
      { id: 'dec', day: D(2023, 12, 12), track: 'grey', date: 'DEC 2023', title: 'Migration Strategy', label: 'FACT', w: 220, fs: 16, glow: b },
      { id: 'nov', day: D(2025, 11, 15), track: 'on', date: 'NOV 2025', title: 'Best on immigration', label: 'FACT', w: 200, fs: 16, glow: a },
      { id: 'jun_on', day: D(2026, 6, 15), track: 'on', date: 'JUN 2026', title: 'Newspoll 31', label: 'FACT', w: 190, fs: 16, glow: a, dx: -30 },
      { id: 'jun_lab', day: D(2026, 6, 15), track: 'lab', date: 'JUN 2026', title: '225,000 pledge', label: 'FACT', w: 190, fs: 16, dx: -30 },
      { id: 'sep_on', day: D(2026, 9, 14), track: 'on', date: '14 SEP', title: 'ON plan', label: 'CLAIM', w: 170, fs: 16, glow: a, dx: 60 },
      { id: 'sep_lab', day: D(2026, 9, 17), track: 'lab', date: '17 SEP', title: 'Burke speech', label: 'FACT', w: 170, fs: 16, dx: 60 },
    ];
    const glowCol = (k) => k * 12;
    h += board(t, { cam, ys: { on: 240, lab: 520, coal: 800, grey: 520, top: 120, bottom: 700 }, show: { on: 1, lab: 1, grey: 1 }, nodes, from: D(2025, 9, 1), to: D(2026, 10, 31), labelX: 1500,
      links: [{ a: 'jun_on', b: 'jun_lab', p: 1, color: C.on, glow: glowCol(togg) }, { a: 'sep_on', b: 'sep_lab', p: 1, color: C.on, glow: glowCol(togg) }, { a: 'dec', b: 'jun_lab', p: b, color: '#bbb', glow: glowCol(b), sag: 0.03 }] });
    h += `<div class="abs" style="left:120px;top:770px;font:900 64px Inter;color:${C.on};opacity:${0.25 + 0.75 * a};text-shadow:0 0 ${30 * a}px ${C.on}">COPYING?</div>`;
    h += `<div class="abs" style="left:780px;top:770px;font:900 64px Inter;color:#d0d0d0;opacity:${0.25 + 0.75 * b};text-shadow:0 0 ${30 * b}px #fff">FINISHING THE JOB?</div>`;
    // receipt prints from the bottom
    if (t >= tPay - 0.2) { const rp = P(t, tPay - 0.1, 1.0, eo); h += `<div class="abs" style="left:1500px;top:${1080 - 300 * rp}px;width:300px;height:420px;background:#f5f3ee;box-shadow:0 -10px 30px rgba(0,0,0,.5);font:700 26px 'DejaVu Sans Mono',monospace;color:#222;padding:24px;text-align:center">- - - - - - - -<br><br>COST: ?<br><br>- - - - - - - -</div>`; }
    return h;
  });
})();
