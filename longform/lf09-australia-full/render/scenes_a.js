/* lf09 scenes A: opening, chapter 1, chapter 2 (S01-S15) + chapter bumpers. */
(function () {
  const { C, P, lin, clamp, lerp, eo, eio, back, fade, esc, fmt } = E;
  const sc = RT.scene;
  const clipCredit = {
    BR_STOCK_melbourne_aerial_dusk: 'Footage: Tetrakis Sphericon / Pexels',
    BR_STOCK_airport_arrivals_board: 'Footage: Taryn Elliott / Pexels',
    BR_STOCK_plane_landing_sydney: 'Footage: Wittylama · CC BY-SA 4.0',
    BR_STOCK_sydney_street_timelapse: 'Footage: Jowel Balcita · CC BY 3.0',
    BR_STOCK_house_sold_sign: 'Photo: Orderinchaos · CC BY-SA 4.0',
    BR_STOCK_rental_inspection_keys: 'Footage: Jakub Zerdzicki / Pexels',
    BR_STOCK_hospital_corridor_empty: 'Footage: Enrique Silva / Pexels',
    BR_STOCK_motorway_traffic_aus: 'Footage: Mixkit (illustrative, not Australian)',
    BR_STOCK_construction_worker_scaffold: 'Footage: MixailMixail / Pixabay',
    BR_STOCK_nurse_corridor_back: 'Footage: Pavel Danilyuk / Pexels',
    BR_STOCK_adelaide_skyline: 'Photo: Ardash Muradian · CC BY-SA 2.0',
    BR_STOCK_parliament_house_canberra: 'Footage: Jared Drennan · CC BY 3.0',
    BR_STOCK_passport_desk_generic: 'Footage: RDNE Stock project / Pexels',
    BR_STOCK_apartment_cranes: 'Footage: Kiwi and Camera / Pexels',
    BR_STOCK_university_campus_aerial: 'Photo: Toby Hudson · CC BY-SA',
    BR_STOCK_lecture_hall_empty: 'Footage: Pavel Danilyuk / Pexels',
  };
  E.clipCredit = clipCredit;
  const cc = (id, op = 1) => E.credit(clipCredit[id], op);
  const frameOf = (id, t, t0, off = 0) => E.clipSrc(id, t, t0, { offset: off });

  // shared: scoreboard of three party columns (orange, red, blue). vals 0..40 scale
  function scoreboard(o) {
    const bw = o.bw || 150, gap = o.gap || 60, maxH = o.maxH || 420, base = o.y || 820, x0 = o.x || 960 - (bw * 3 + gap * 2) / 2;
    const cols = [['ONE NATION', C.on, o.on], ['LABOR', C.lab, o.lab], ['COALITION', C.coal, o.coal]];
    let h = '';
    cols.forEach(([n, col, v], i) => {
      if (v == null) return; const x = x0 + i * (bw + gap); const hh = (v / (o.scale || 40)) * maxH;
      h += `<div class="abs" style="left:${x}px;top:${base - hh}px;width:${bw}px;height:${hh}px;background:${col};box-shadow:0 0 30px ${col}55"></div>
        <div class="abs" style="left:${x - 20}px;width:${bw + 40}px;top:${base + 14}px;text-align:center;font:800 22px Inter;letter-spacing:1.5px;color:#ddd">${n}</div>
        <div class="abs" style="left:${x - 40}px;width:${bw + 80}px;top:${base - hh - 86}px;text-align:center;font:900 70px Inter;color:#fff">${Math.round(v)}<span style="font-size:36px">%</span></div>`;
    });
    h += `<div class="abs" style="left:${x0 - 30}px;top:${base}px;width:${bw * 3 + gap * 2 + 60}px;height:3px;background:#777"></div>`;
    return h;
  }
  E.scoreboard = scoreboard;

  // ---------------- chapter bumper ----------------
  sc('bumper', (c) => {
    const { t } = c; const b = c.b; const lt = t - b.start;
    c.sfx('split_flap', b.start + 0.1, -4); c.sfx('whoosh', b.start, -6);
    const p = P(t, b.start + 0.05, 0.6, eio);
    let h = E.boardBg();
    h += E.thread([[-40, 600], [lerp(-40, 1960, p), 600]], 1, { sag: 0, knots: false, w: 3 });
    h += E.splitFlap(t, b.start + 0.1, ' '.repeat(b.label.length), b.label, { x: 960, y: 470, cw: 52, ch: 76, d: 0.5 });
    h += `<div class="abs" style="left:0;right:0;top:${560}px;text-align:center;font:600 64px 'Source Serif 4';color:#F4EFE6;opacity:${P(t, b.start + 0.45, 0.4)};transform:translateY(${(1 - P(t, b.start + 0.45, 0.4)) * 20}px)">${esc(b.title)}</div>`;
    return E.wrap(h, { s: 1 + lt * 0.015 });
  });

  // ---------------- S01 ----------------
  sc('S01', (c) => {
    const { t } = c; const tNews = c.w('news'), tBomb = c.w('bomb'), t31 = c.w('31'), t30 = c.w('30'), tLab = c.w('Labour'), tPaul = c.w('Pauline'), tAnth = c.w('Anthony');
    c.sfx('bass_impact', tNews, -2); c.sfx('whoosh', tBomb, -3); c.sfx('tick_roll', t31 - 0.1, -6); c.sfx('tick_roll', t30 - 0.1, -6); c.sfx('shutter', tLab, -6);
    c.sfx('whoosh', tPaul - 0.1, -10); c.sfx('whoosh', tAnth - 0.1, -10); c.sfx('drone_low', c.start, -14);
    let h = '';
    if (t < tBomb + 0.25) {
      h += E.clip('BR_AI_canberra_dawn_fog', t, c.start, { dur: 8, z0: 1.02, z1: 1.16, offset: 1.5 });
      h += E.grad('linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.35))');
      h += E.aiLabel(t, c.start + 0.15, 2.6);
    }
    const fogOut = P(t, tBomb, 0.25);
    if (t >= tBomb) h += `<div class="abs full" style="opacity:${fogOut}">${E.boardBg()}</div>`;
    // poll card E01: slams centre over the fog, then parks top-left as the thread origin
    if (t >= tNews) {
      E.shake(t, tNews, 6, 0.35);
      const park = P(t, tBomb + 0.6, 0.6, eio);
      const card = E.pollCard(t, { x: 960, y: 250, w: 600, t0: tNews, pollster: 'NEWSPOLL · JUNE 2026', when: 'Published 16 Jun 2026', n: 'n ≈ 1,240', rows: [{ party: 'One Nation', val: '31', col: C.on }, { party: 'Labor', val: '30', col: C.lab }, { party: 'Coalition', val: '18', col: C.coal }], src: 'Newspoll / The Australian, as reported by AAP (CityNews, 16 Jun 2026)' });
      h += E.wrap(card, { x: lerp(0, -655, park), y: lerp(0, -205, park), s: lerp(1, 0.5, park), ox: 960, oy: 250 });
      // dust burst
      const dp = lin(t, tNews, 0.8);
      if (dp > 0 && dp < 1) for (let i = 0; i < 26; i++) { const a = E.hash(i) * Math.PI * 2, r = 120 + dp * (260 + E.hash(i + 9) * 220); h += `<div class="abs" style="left:${960 + Math.cos(a) * r * 1.4}px;top:${520 + Math.sin(a) * r * 0.6}px;width:${4 + E.hash(i * 3) * 6}px;height:${4 + E.hash(i * 3) * 6}px;border-radius:50%;background:rgba(230,220,200,${0.6 * (1 - dp)})"></div>`; }
    }
    if (t >= tBomb + 0.3) {
      // split photos behind the bars (thumbnail composition)
      h += E.photo('albanese', t, { x: 330, y: 560, w: 360, h: 450, rot: -3, move: { type: 'splitL', t0: tAnth } });
      h += E.photo('hanson', t, { x: 1590, y: 560, w: 360, h: 450, rot: 3, move: { type: 'splitR', t0: tPaul } });
      if (t >= tLab) { const k = P(t, tLab, 0.15); h += `<div class="abs" style="left:132px;top:300px;width:396px;height:540px;border:4px solid ${C.lab};opacity:${(1 - lin(t, tLab + 0.15, 0.6)) * k}"></div>`; }
      const on = E.rollTo(t, t31 - 0.15, 0.7, 31), lab = E.rollTo(t, t30 - 0.15, 0.75, 30);
      h += scoreboard({ on: t >= tPaul ? on : null, lab: t >= tAnth ? lab : null, coal: t >= tPaul + 0.5 ? E.rollTo(t, tPaul + 0.5, 0.6, 18) : null, x: 690, y: 880, bw: 140, gap: 50, maxH: 460 });
      h += E.tag('FACT', { x: 1188, y: 870, note: 'Newspoll, June 2026', s: 0.9 });
      if (t >= tAnth) h += E.credit('Photos: David Foote (AUSPIC/DPS) via DFAT · CC BY 4.0 / jfish92 · CC0');
    }
    return h;
  });

  // ---------------- S02 ----------------
  sc('S02', (c) => {
    const { t } = c; const tDay = c.w('day'), tPrime = c.w('prime'), t225 = c.w('225'), tWe = c.w('We'), tRight = c.w('right'), tSaid = c.w('said'), tCo = c.w('Coincidence'), tMay = c.w('Maybe');
    c.sfx('thread_snap', tDay, -4); c.sfx('slot_roll', t225 - 0.2, -6); c.sfx('marker', tRight, -8); c.sfx('marker', tCo, -4); c.sfx('glitch', tMay, -8); c.sfx('shutter', tPrime, -8);
    let h = E.boardBg();
    // two nodes on top row
    const n1 = { x: 620, y: 175 }, n2 = { x: 1300, y: 175 };
    h += E.node({ x: n1.x, y: n1.y, date: 'JUN 2026 · NEWSPOLL', title: 'One Nation 31 · Labor 30', col: C.on, label: 'FACT' });
    const tp = P(t, c.start, Math.max(0.3, tDay - c.start), eio);
    h += E.thread([[n1.x + 150, n1.y], [lerp(n1.x + 150, n2.x - 150, tp), n1.y]], 1, { sag: 0.05, knots: tp >= 1 });
    h += E.node({ x: n2.x, y: n2.y, date: 'SAME DAY', title: 'PM: net migration to come down to 225,000', col: C.lab, label: 'FACT', p: P(t, tDay - 0.1, 0.35), stampIn: true });
    // Albanese photo PAN + lower third
    h += E.photo('albanese', t, { x: 360, y: 610, w: 330, h: 410, rot: -2, move: { type: 'drop', t0: tPrime - 0.2 } });
    if (t >= tPrime) h += E.lowerThird(t, tPrime + 0.2, 'Anthony Albanese', 'Prime Minister', { x: 70, y: 920, col: C.lab });
    // number roll -> quote card
    const outN = P(t, tWe - 0.3, 0.3);
    if (t >= t225 - 0.6 && t < tWe + 0.2) {
      const v = E.rollTo(t, t225 - 0.3, 0.9, 225000);
      h += `<div class="abs" style="left:620px;width:1240px;top:430px;text-align:center;opacity:${P(t, t225 - 0.6, 0.25) * (1 - outN)};transform:translateY(${-outN * 40}px)">
        ${E.odometer(v, { h: 150, fs: 140, color: C.gold, max: 999999 })}
        <div style="font:800 30px Inter;letter-spacing:4px;color:#e9d9a8;margin-top:10px">NET OVERSEAS MIGRATION</div></div>`;
    }
    if (t >= tWe - 0.2) h += E.quote(t, { x: 1240, y: 420, w: 1040, t0: tWe - 0.2, outlet: 'Reuters/Bloomberg via South China Morning Post', date: 'June 2026', q: '“We think that is the right number.”', hl: 'the right number.', hlP: lin(t, tRight - 0.05, 0.6), sub: 'Anthony Albanese · Canberra · June 2026', label: 'FACT', note: 'his words', src: 'Reuters/Bloomberg, via the South China Morning Post, June 2026' });
    // red question mark across both nodes
    if (t >= tCo) {
      let op = 1; const mt = t - tMay; if (mt > 0 && mt < 0.25) op = mt < 0.08 || (mt > 0.14 && mt < 0.19) ? 0.15 : 1;
      h += E.qmark(960, 230, 2.4, lin(t, tCo, 0.55), { op, sw: 11 });
    }
    h += E.photoCredit('albanese', 0.9);
    return h;
  });

  // ---------------- S03 ----------------
  sc('S03', (c) => {
    const { t } = c; const tPaul = c.w('Pauline'), t750 = c.w('750'), tThree2 = c.w('Three', 2), tThat = c.w('that'), tLab = c.w('Labor'), tCrack = c.w('crackdown');
    c.sfx('split_flap', c.start, -4); c.sfx('slot_roll', t750 - 0.2, -8); c.sfx('paper_slide', t750 + 0.4, -6); c.sfx('shutter', tPaul, -6); c.sfx('shutter', tLab, -6);
    [0, 0.33, 0.66].forEach((d) => c.sfx('paper_slide', tThree2 + 0.2 + d, -10)); c.sfx('stamp', tCrack, -3); c.sfx('pop', tCrack + 0.25, -6);
    let h = E.boardBg();
    h += E.splitFlap(t, c.start + 0.05, 'JUN 2026', 'SEP 2026', { x: 960, y: 110, cw: 54, ch: 78, d: 0.7 });
    const o = { x: 560, y: 600 }, r = { x: 1360, y: 600 };
    h += E.node({ x: o.x, y: o.y, w: 360, date: '14 SEP 2026', title: 'One Nation: 750,000 visas cut', col: C.on, label: 'CLAIM', note: 'policy', p: P(t, tPaul - 0.3, 0.4), fs: 25 });
    h += E.photo('hanson', t, { x: o.x - 40, y: 330, w: 220, h: 260, rot: -5, move: { type: 'drop', t0: tPaul } });
    // 750,000 roll + visa stack collapsing
    if (t >= t750 - 0.4) {
      const v = E.rollTo(t, t750 - 0.2, 1.0, 750000);
      h += `<div class="abs" style="left:${o.x - 300}px;width:600px;top:770px;text-align:center;opacity:${P(t, t750 - 0.4, 0.2)}">${E.odometer(v, { h: 86, fs: 80, color: C.on, max: 999999 })}<div style="font:700 20px Inter;letter-spacing:3px;color:#f7c79a">TEMPORARY VISAS · CLAIM</div></div>`;
      for (let i = 0; i < 7; i++) { const fall = P(t, t750 + 0.3 + i * 0.08, 0.5, eio); h += E.iconAt('ticket', o.x + 230 + i * 6, 330 - i * 14 + fall * (420 + i * 20), { s: 70, color: '#f4efe6', op: 1 - fall * 0.9, rot: fall * (i % 2 ? 40 : -40) }); }
    }
    // calendar flips 14 -> 17
    if (t >= tThree2 - 0.3) {
      const k = Math.min(3, Math.floor(Math.max(0, t - tThree2 - 0.2) / 0.33 + 1e-6)); const day = 14 + (t >= tThree2 + 0.2 ? Math.min(3, k + 1) : 0);
      const flip = ((t - tThree2 - 0.2) % 0.33) / 0.33;
      h += `<div class="abs" style="left:885px;top:330px;width:150px;height:170px;opacity:${P(t, tThree2 - 0.3, 0.25)}"><div style="background:#f4efe6;height:170px;border-top:34px solid ${C.thread};text-align:center;font:900 96px/136px Inter;color:#161616;box-shadow:0 10px 24px rgba(0,0,0,.5);transform:scaleY(${t < tThree2 + 1.25 && t > tThree2 + 0.2 ? 0.6 + 0.4 * eo(flip) : 1})">${day}</div><div style="position:absolute;top:4px;left:0;right:0;text-align:center;font:800 18px Inter;color:#fff;letter-spacing:2px">SEP</div></div>`;
    }
    if (t >= tLab - 0.4) {
      h += E.photo('burke', t, { x: r.x + 40, y: 330, w: 220, h: 260, rot: 4, move: { type: 'drop', t0: tLab } });
      h += E.node({ x: r.x, y: r.y, w: 360, date: '17 SEP 2026', title: 'Labor crackdown', col: C.lab, label: 'FACT', p: P(t, tCrack, 0.3), stampIn: true, fs: 25 });
      if (t >= tCrack) E.shake(t, tCrack, 4);
      h += E.thread([[o.x + 180, o.y], [r.x - 180, r.y]], P(t, tCrack, 0.3, eio), { sag: 0.06 });
      if (t >= tCrack + 0.2) { const pu = 1 + 0.06 * Math.sin((t - tCrack) * 8); h += `<div class="abs" style="left:960px;top:${o.y + 50}px;transform:translate(-50%,0) scale(${back(P(t, tCrack + 0.2, 0.3)) * pu});background:#fff;color:#111;font:900 30px Inter;letter-spacing:2px;padding:8px 22px;border-radius:30px;box-shadow:0 0 30px rgba(255,255,255,.4)">+3 DAYS</div>`; }
    }
    h += E.credit('Photos: jfish92 · CC0 / UK Home Office · CC BY 4.0');
    return h;
  });

  // ---------------- S04 ----------------
  sc('S04', (c) => {
    const { t } = c; const tCopy = c.w('copying'), tSome = c.w('something'), tHapp = c.w('happening'), tBoth = c.w('both'), tReact = c.w('reacting');
    c.sfx('type_thud', tCopy, -4); c.sfx('type_thud', tCopy + 0.18, -6); c.sfx('swell', tSome - 0.2, -6); c.sfx('creak', tBoth, -8);
    const pull = P(t, tSome, 1.4, eio);
    let h = E.boardBg();
    // timelapse under the map (motion-blur streets, no faces)
    h += E.clip('BR_STOCK_sydney_street_timelapse', t, tHapp - 0.3, { opacity: 0.55 * P(t, tHapp - 0.3, 0.5) * (1 - P(t, tHapp + 2.0, 0.6)), z0: 1.05, z1: 1.12, dur: 3, speed: 1.5 });
    const ms = lerp(1.6, 0.92, pull);
    h += E.ausMap({ x: 960 - 500 * ms, y: 560 - 450 * ms, s: ms, op: 0.35 * pull, fill: 'rgba(255,255,255,.05)', stroke: 'rgba(255,255,255,.35)' });
    if (pull > 0) h += E.qmark(960, 560, 1.4, P(t, tSome + 0.4, 0.6), { color: '#fff', sw: 9, op: 0.85 });
    const ps = lerp(1, 0.62, pull);
    h += E.wrap(E.photo('albanese', t, { x: 360, y: 600, w: 360, h: 450, rot: -3, move: { t0: c.start } }), { s: ps, ox: 360, oy: 600, x: lerp(0, -40, pull) });
    h += E.wrap(E.photo('hanson', t, { x: 1560, y: 600, w: 360, h: 450, rot: 3, move: { t0: c.start } }), { s: ps, ox: 1560, oy: 600, x: lerp(0, 40, pull) });
    if (t >= tBoth) { const p = P(t, tBoth, 0.9, eio); h += E.thread([[440, 520], [lerp(440, 900, p), lerp(520, 520, p)]], 1, { knots: p >= 1, sag: 0.12 }); h += E.thread([[1480, 520], [lerp(1480, 1020, p), 520]], 1, { knots: p >= 1, sag: 0.12 }); }
    // kinetic title in thumbnail typography
    const up = P(t, tSome, 0.6, eio);
    const tOp = 1 - P(t, tBoth + 0.4, 0.5) * 0.85;
    h += `<div class="abs" style="left:0;right:0;top:${lerp(330, 70, up)}px;text-align:center;transform:scale(${lerp(1, 0.62, up)});opacity:${tOp}">
      <div style="font:900 110px/1 Inter;color:#fff;-webkit-text-stroke:5px ${C.thread};paint-order:stroke fill;text-shadow:0 8px 0 ${C.thread},0 14px 40px #000;letter-spacing:-1px;opacity:${P(t, c.start, 0.3)}">IS ALBANESE</div>
      <div style="font:900 128px/1.1 Inter;color:${C.yellow};-webkit-text-stroke:6px ${C.thread};paint-order:stroke fill;text-shadow:0 9px 0 ${C.thread},0 14px 40px #000;letter-spacing:-1px;min-height:140px">${E.typeText('COPYING', lin(t, tCopy, 0.35))}${t > tCopy + 0.35 ? E.typeText(' HANSON?', lin(t, tCopy + 0.4, 0.5)) : ''}</div></div>`;
    h += E.credit(t >= tHapp - 0.3 && t < tHapp + 2.6 ? E.clipCredit.BR_STOCK_sydney_street_timelapse : 'Photos: David Foote (AUSPIC/DPS) via DFAT · CC BY 4.0 / jfish92 · CC0');
    return h;
  });

  // ---------------- S05 ----------------
  sc('S05', (c) => {
    const { t } = c; const tD = c.w('dates'), tN = c.w('numbers'), tQ = c.w('quotes'), tOrd = c.w('order'), tPat = c.w('pattern'), tNob = c.w('nobody'), tBut = c.w('But'), tIs = c.w('Is'), tFull = c.w('full');
    c.sfx('click', tD, -4); c.sfx('click', tN, -4); c.sfx('click', tQ, -4); c.sfx('paper_slide', tOrd, -8); c.sfx('chain_rattle', tPat, -6); c.sfx('shimmer', tNob, -6); c.sfx('drone_low', tIs - 0.3, -6); c.sfx('bass_impact', tFull, -3);
    let h = E.boardBg();
    h += `<div class="abs full" style="opacity:${1 - P(t, tBut, 0.6)}">${E.ghostBoard(0.16)}</div>`;
    // disclaimer lower third (short version)
    const dOp = fade(t, c.start + 0.2, c.start + 3.4, 0.3, 0.4);
    if (dOp > 0) h += `<div class="abs" style="left:50%;top:880px;transform:translateX(-50%);opacity:${dOp};background:rgba(244,239,230,.95);color:#161616;font:600 25px Inter;padding:14px 28px;border-left:8px solid ${C.thread};white-space:nowrap">Independent documentary · Not affiliated with any party · Every source on screen and in the description.</div>`;
    // three icons
    const icons = [['calendar', 'DATES', tD], ['hash', 'NUMBERS', tN], ['quotes', 'QUOTES', tQ]];
    const line = P(t, tOrd, 0.5, eio); const iconsOut = P(t, tBut, 0.5);
    icons.forEach(([ic, lab, t0], i) => {
      if (t < t0) { const g = P(t, c.start + 0.3 + i * 0.25, 0.5) * (1 - iconsOut); h += `<div class="abs" style="left:${960 + (i - 1) * 320 - 110}px;top:310px;width:220px;text-align:center;opacity:${0.22 * g}">${E.icon(ic, { s: 130, sw: 1.4 })}<div style="font:800 30px Inter;letter-spacing:4px;color:#fff;margin-top:8px">${lab}</div></div>`; return; }
      const p = P(t, t0, 0.3, back);
      const x = lerp(960 + (i - 1) * 320, 560 + i * 400, line), y = lerp(420, 300, line);
      h += `<div class="abs" style="left:${x - 110}px;top:${y - 110}px;width:220px;text-align:center;transform:scale(${p});opacity:${1 - iconsOut}">${E.icon(ic, { s: 130, sw: 1.4 })}<div style="font:800 30px Inter;letter-spacing:4px;color:#fff;margin-top:8px">${lab}</div></div>`;
    });
    if (line > 0) h += `<div class="abs" style="left:460px;top:${300 + 125}px;width:${1000 * line}px;height:3px;background:${C.thread};opacity:${1 - iconsOut}"></div>`;
    // padlocked chart
    if (t >= tPat - 0.2) {
      const p = P(t, tPat - 0.2, 0.5, eo), out = P(t, tBut + 0.2, 0.5);
      const rattle = t > tPat && t < tPat + 0.6 ? Math.sin((t - tPat) * 60) * 5 * (1 - (t - tPat) / 0.6) : 0;
      h += padlockChart(t, { x: 960, y: lerp(1300, 700, p) + out * 600, rattle, glint: lin(t, tNob, 0.7) });
    }
    // title card over a map outline with points of light
    if (t >= tBut) {
      const mp = P(t, tBut, 1.0, eio);
      h += E.ausMap({ x: 960 - 470, y: 140, s: 0.94, op: 0.8 * mp, fill: 'rgba(255,255,255,.03)', stroke: 'rgba(255,255,255,.5)', sw: 1.6 });
      h += cityLights(t, tBut + 0.4, { x: 960 - 470, y: 140, s: 0.94, glow: P(t, tIs, 1.2) });
      h += `<div class="abs" style="left:0;right:0;top:430px;text-align:center;font:900 132px Inter;color:#fff;letter-spacing:2px;text-shadow:0 6px 40px #000,0 0 2px #000">${E.typeText('IS AUSTRALIA FULL?', lin(t, tIs, Math.max(0.5, tFull + 0.3 - tIs)))}</div>`;
    }
    return h;
  });
  function padlockChart(t, o) {
    const unlocked = o.unlocked || 0;
    let bars = '';
    const pts = [[0, 120], [1, 110], [2, 100], [3, 140], [4, 90], [5, 150]];
    pts.forEach(([i, v], k) => { bars += `<div class="abs" style="left:${60 + i * 90}px;bottom:50px;width:56px;height:${v}px;background:${[C.on, C.lab, C.coal][k % 3]};opacity:.85"></div>`; });
    const blur = lerp(10, 0, unlocked);
    return `<div class="abs" style="left:${o.x - 330 + (o.rattle || 0)}px;top:${o.y - 190}px;width:660px;height:380px;transform:rotate(${(o.rattle || 0) * 0.3}deg)">
      <div class="abs" style="inset:0;background:#1b1b1b;border:2px solid #333;box-shadow:0 20px 50px rgba(0,0,0,.6);overflow:hidden"><div class="abs" style="inset:0;filter:blur(${blur}px)">${bars}<div class="abs" style="left:40px;top:40px;font:800 26px Inter;color:#aaa;letter-spacing:3px">POLLS</div></div></div>
      ${unlocked < 1 ? `<div class="abs" style="left:250px;top:90px;opacity:${1 - unlocked}">${E.icon('padlock', { s: 160, color: '#e8e8e8', sw: 1.6 })}</div>
      <div class="abs" style="left:250px;top:90px;width:160px;height:160px;background:linear-gradient(115deg,transparent ${lerp(-20, 120, o.glint || 0) - 12}%,rgba(255,255,255,.85) ${lerp(-20, 120, o.glint || 0)}%,transparent ${lerp(-20, 120, o.glint || 0) + 12}%);mix-blend-mode:overlay;opacity:${(o.glint > 0 && o.glint < 1) ? 1 : 0}"></div>
      <div class="abs" style="right:-20px;top:-18px;background:${C.yellow};color:#111;font:900 24px Inter;letter-spacing:3px;padding:6px 16px;transform:rotate(6deg);opacity:${1 - unlocked}">LATER</div>` : ''}</div>`;
  }
  E.padlockChart = padlockChart;
  function cityLights(t, t0, o) {
    const names = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Hobart', 'Darwin', 'Gold Coast', 'Newcastle', 'Wollongong', 'Geelong', 'Townsville', 'Cairns', 'Toowoomba', 'Ballarat', 'Bendigo', 'Albury', 'Launceston', 'Mackay', 'Rockhampton', 'Bunbury', 'Sunshine Coast', 'Wagga Wagga', 'Alice Springs', 'Mildura', 'Kalgoorlie', 'Port Hedland', 'Shepparton', 'Bundaberg', 'Orange', 'Dubbo', 'Tamworth', 'Mount Gambier'];
    const big = { Sydney: 1, Melbourne: 1, Brisbane: 0.8, Perth: 0.7, Adelaide: 0.6 };
    let h = '';
    names.forEach((n, i) => {
      const p = P(t, t0 + i * 0.05, 0.4); if (p <= 0) return; const [x, y] = E.city(n); const r = (big[n] ? 6 + 10 * big[n] : 3) * (1 + (o.glow || 0) * 0.5);
      h += `<div class="abs" style="left:${o.x + x * o.s - r}px;top:${o.y + y * o.s - r}px;width:${2 * r}px;height:${2 * r}px;border-radius:50%;background:rgba(255,255,255,.8);box-shadow:0 0 ${r * 2 + 10 * (o.glow || 0)}px rgba(255,255,255,.9);opacity:${p}"></div>`;
    });
    return h;
  }
  E.cityLights = cityLights;

  // ---------------- S06 ----------------
  sc('S06', (c) => {
    const { t } = c; const t27 = c.w('27'), tIn = c.w('In'), t392 = c.w('392'), tThree = c.w('three'), tFour = c.w('four');
    c.sfx('tick_roll', t27 - 0.2, -6); c.sfx('stamp', t392 + 0.4, -4); c.sfx('swipe', tThree, -6); c.sfx('pop', tFour + 0.2, -6);
    let h = '';
    if (t < tIn + 0.4) {
      h += E.clip('BR_STOCK_melbourne_aerial_dusk', t, c.start, { dur: 6, z0: 1.0, z1: 1.1 }) + E.dim(0.35);
      const v = E.rollTo(t, c.start + 0.6, Math.max(1, t27 + 1.3 - c.start - 0.6), 27921200, 27000000);
      h += `<div class="abs" style="left:0;right:0;top:350px;text-align:center"><div style="font:800 30px Inter;letter-spacing:6px;color:#fff;text-shadow:0 2px 10px #000">AUSTRALIA’S POPULATION · 31 MAR 2026</div>
        <div style="margin-top:14px;text-shadow:0 4px 30px #000">${E.odometer(v, { h: 160, fs: 150, max: 99999999 })}</div>
        <div style="font:600 34px Inter;color:#eee;margin-top:6px;opacity:${P(t, t27 + 1.2, 0.4)}">≈ 27.9 million</div></div>`;
      h += E.tag('FACT', { x: 1430, y: 340, note: 'ABS, 17 Sep 2026' });
      h += E.credit(E.clipCredit.BR_STOCK_melbourne_aerial_dusk);
    }
    if (t >= tIn) {
      let g = E.boardBg();
      g += E.card(t, { x: 960, y: 110, w: 1180, t0: tIn + 0.05, outlet: 'ABS media release', date: '17 Sep 2026', head: 'Population 27.9 million at 31 March 2026 · +392,700 in 12 months (1.4%)', hl: '+392,700 in 12 months', hlP: lin(t, t392, 0.8), label: 'FACT', src: 'Australian Bureau of Statistics, 17 Sep 2026', fs: 40 });
      g += E.stamp(t, t392 + 0.4, '+392,700', { x: 1520, y: 440, color: C.grn, fs: 70, rot: -6 });
      // stacked bar
      const by = 680, bx = 260, bw = 1400;
      const fill = P(t, tThree, 0.8, eio);
      g += `<div class="abs" style="left:${bx}px;top:${by - 70}px;font:800 30px Inter;letter-spacing:4px;color:#fff;opacity:${P(t, tIn + 0.8, 0.4)}">WHERE THE GROWTH CAME FROM</div>
        <div class="abs" style="left:${bx}px;top:${by}px;width:${bw}px;height:110px;background:#2a2a2a;opacity:${P(t, tIn + 0.8, 0.4)}"></div>
        <div class="abs" style="left:${bx}px;top:${by}px;width:${bw * 0.74 * fill}px;height:110px;background:${C.gold}"></div>
        <div class="abs" style="left:${bx + bw * 0.74}px;top:${by}px;width:${bw * 0.26 * P(t, tThree + 0.6, 0.5)}px;height:110px;background:#7d7d7d"></div>
        <div class="abs" style="left:${bx + 24}px;top:${by + 24}px;font:900 56px Inter;color:#161616;transform:scale(${back(P(t, tFour + 0.2, 0.3))});transform-origin:0 50%">74%</div>
        <div class="abs" style="left:${bx}px;top:${by + 130}px;font:700 26px Inter;color:${C.gold};opacity:${fill}">NET OVERSEAS MIGRATION</div>
        <div class="abs" style="left:${bx + bw * 0.74 + 16}px;top:${by + 24}px;font:900 56px Inter;color:#fff;opacity:${P(t, tThree + 0.9, 0.4)}">26%</div>
        <div class="abs" style="left:${bx + bw * 0.74 + 16}px;top:${by + 130}px;font:700 26px Inter;color:#bbb;opacity:${P(t, tThree + 0.9, 0.4)}">BIRTHS MINUS DEATHS</div>`;
      if (fill > 0) g += E.tag('FACT', { x: bx + bw - 230, y: by - 66, note: 'ABS; The Nightly' });
      h += `<div class="abs full" style="opacity:${P(t, tIn, 0.35)}">${g}</div>`;
    }
    return h;
  });

  // ---------------- S07 ----------------
  sc('S07', (c) => {
    const { t } = c; const tArr = c.w('arriving'), tMinus = c.w('minus'), t292 = c.w('292'), tOver = c.w('over'), t800 = c.w('800'), tEvery = c.w('every');
    c.sfx('jet', tArr, -8); c.sfx('whoosh', tMinus, -6); c.sfx('tick_roll', t292 - 0.2, -6); c.sfx('bass_impact', t800, -2); c.sfx('click', tEvery + 0.45, -4);
    let h = E.boardBg();
    h += E.clip('BR_STOCK_airport_arrivals_board', t, c.start, { opacity: 0.2, dur: 15, z0: 1.15, z1: 1.25, speed: 0.6 });
    // equation row
    const eqOut = P(t, tOver, 0.4);
    const arr = P(t, tArr - 0.2, 0.5, eo), dep = P(t, tMinus, 0.5, eo);
    let eq = '';
    eq += `<div class="abs" style="left:${lerp(-300, 260, arr)}px;top:150px;width:300px;text-align:center">${E.icon('planeArr', { s: 150, sw: 1.3 })}<div style="font:800 28px Inter;letter-spacing:4px;color:#fff">ARRIVALS</div></div>`;
    eq += `<div class="abs" style="left:620px;top:190px;font:900 110px Inter;color:${C.thread};opacity:${dep}">−</div>`;
    eq += `<div class="abs" style="left:${lerp(760, 820, dep)}px;top:${lerp(150, 120, 0)}px;width:300px;text-align:center;opacity:${dep}">${E.icon('planeDep', { s: 150, sw: 1.3 })}<div style="font:800 28px Inter;letter-spacing:4px;color:#fff">DEPARTURES</div></div>`;
    eq += `<div class="abs" style="left:1140px;top:190px;font:900 110px Inter;color:#fff;opacity:${P(t, tMinus + 0.5, 0.3)}">=</div>`;
    eq += `<div class="abs" style="left:1260px;top:200px;width:520px;font:900 46px/1.1 Inter;color:${C.gold};opacity:${P(t, tMinus + 0.7, 0.4)}">NET OVERSEAS MIGRATION</div>`;
    h += `<div class="abs full" style="opacity:${1 - eqOut * 0.0};transform:translateY(${-eqOut * 40}px)">${eq}</div>`;
    if (t >= t292 - 0.5) {
      const v = E.rollTo(t, t292 - 0.3, 1.0, 292100);
      h += `<div class="abs" style="left:0;right:0;top:440px;text-align:center;opacity:${P(t, t292 - 0.5, 0.3)}">${E.odometer(v, { h: 130, fs: 120, color: C.gold, max: 999999 })}</div>`;
      h += E.card(t, { x: 960, y: 640, w: 1220, t0: t292 + 0.2, outlet: 'ABS', date: '17 Sep 2026', head: 'Net overseas migration 292,100, year to 31 March 2026 · about 74% of population growth', hl: '292,100', hlP: lin(t, t292 + 0.5, 0.5), label: 'FACT', src: 'ABS, 17 Sep 2026; The Nightly, Sep 2026 (74.4%, about 800 a day)', fs: 36 });
    }
    // arrivals board B-roll (2 s)
    const bOp = fade(t, tOver - 0.1, t800 - 0.05, 0.25, 0.15);
    if (bOp > 0) h += `<div class="abs full" style="opacity:${bOp}">${E.clip('BR_STOCK_airport_arrivals_board', t, tOver - 0.1, { dur: 3, z0: 1.05, z1: 1.12 })}${E.credit(E.clipCredit.BR_STOCK_airport_arrivals_board)}</div>`;
    // 800 / DAY slam -> corner
    if (t >= t800) {
      E.shake(t, t800, 6, 0.3);
      const fly = P(t, tEvery + 0.1, 0.45, eio); const s = lerp(1, 0.22, fly);
      const x = lerp(960, 1760, fly), y = lerp(500, 75, fly);
      h += `<div class="abs full" style="background:rgba(10,10,10,${0.75 * (1 - fly)})"></div>`;
      for (let i = 0; i < 60; i++) { const p = P(t, t800 + E.hash(i) * 0.8, 0.5); const a = E.hash(i + 3) * 6.28, r = 250 + E.hash(i + 7) * 300; h += `<div class="abs" style="left:${960 + Math.cos(a) * r * 1.6}px;top:${500 + Math.sin(a) * r * 0.75}px;width:6px;height:6px;border-radius:50%;background:#fff;opacity:${0.8 * p * (1 - fly)};box-shadow:0 0 10px #fff"></div>`; }
      h += `<div class="abs" style="left:${x}px;top:${y}px;transform:translate(-50%,-50%) scale(${s * back(P(t, t800, 0.25))});text-align:center;opacity:${1 - P(t, tEvery + 0.5, 0.1)}">
        <div style="font:900 230px/1 Inter;color:#fff;text-shadow:0 0 50px rgba(255,255,255,.5)">800<span style="font-size:110px;font-weight:700"> / DAY</span></div>
        <div style="font:600 36px Inter;color:#ddd;margin-top:16px">+1 every 1m 48s (our calculation)</div></div>`;
      h += E.tag('ANALYSIS', { x: 860, y: 790, note: '86,400 s ÷ 800', op: 1 - fly });
    }
    return h;
  });

  // ---------------- S08 (line chart, reused in S29) ----------------
  function nomChart(t, o) {
    // o: x,y,w,h; reveal flags with times
    const X = (yr) => o.x + ((yr - 2015) / ((o.xMax || 2026.6) - 2015)) * o.w, Y = (v) => o.y + o.h - (v / 600000) * o.h;
    let s = `<svg class="abs full" viewBox="0 0 1920 1080">`;
    for (let v = 0; v <= 600000; v += 100000) s += `<line x1="${o.x}" x2="${o.x + o.w}" y1="${Y(v)}" y2="${Y(v)}" stroke="rgba(255,255,255,${v === 0 ? 0.5 : 0.08})" stroke-width="${v === 0 ? 2 : 1}"/><text x="${o.x - 14}" y="${Y(v) + 8}" fill="#888" font-family="Inter" font-size="20" text-anchor="end">${v ? v / 1000 + 'k' : '0'}</text>`;
    for (let yr = 2015; yr <= 2026; yr++) s += `<text x="${X(yr + 0.5)}" y="${o.y + o.h + 34}" fill="#888" font-family="Inter" font-size="20" text-anchor="middle">${yr}</text>`;
    // borders closed band (gate lifts)
    const gate = o.gate || 0;
    s += `<rect x="${X(2020.2)}" y="${o.y + gate * -o.h * 0.15}" width="${X(2022.0) - X(2020.2)}" height="${o.h}" fill="rgba(140,140,140,${0.28 * (1 - gate * 0.6)})"/><text x="${(X(2020.2) + X(2022)) / 2}" y="${o.y + 40 - gate * 30}" fill="rgba(220,220,220,${1 - gate * 0.5})" font-family="Inter" font-weight="800" font-size="22" text-anchor="middle" letter-spacing="2">BORDERS CLOSED</text>`;
    // pre-COVID average
    s += `<line x1="${X(2015.1)}" x2="${X(2019.9)}" y1="${Y(205000)}" y2="${Y(205000)}" stroke="#bbb" stroke-width="4" stroke-dasharray="12 8"/><text x="${X(2015.2)}" y="${Y(205000) - 18}" fill="#ccc" font-family="Inter" font-size="22" font-weight="600">Pre-COVID average: just over 200,000</text>`;
    const p23 = o.rise == null ? 1 : o.rise; const pts = [[2023.5, 530620], [2025.5, 301000], [2026.25, 292100]];
    const y23 = lerp(Y(0), Y(530620), eo(p23));
    const fall = o.fall == null ? 1 : o.fall;
    const xEnd = lerp(X(2023.5), X(2026.25), fall);
    // line 2023 -> 2025 -> Mar26 (drawn by fall progress when rising complete)
    if (p23 >= 1) {
      const path = `M${X(2023.5)},${Y(530620)} L${X(2025.5)},${Y(301000)} L${X(2026.25)},${Y(292100)}`;
      const L = 900; s += `<path d="${path}" fill="none" stroke="${C.gold}" stroke-width="6" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - fall)}"/>`;
    } else if (o.preline) { s += `<path d="M${X(2025.5)},${Y(301000)} L${X(2026.25)},${Y(292100)}" stroke="${C.gold}" stroke-width="6" fill="none"/>`; }
    if (p23 > 0) s += `<line x1="${X(2023.5)}" x2="${X(2023.5)}" y1="${Y(0)}" y2="${y23}" stroke="${C.gold}" stroke-width="3" opacity=".4"/><circle cx="${X(2023.5)}" cy="${y23}" r="11" fill="${C.gold}"/><text x="${X(2023.5)}" y="${y23 - 24}" fill="#fff" font-family="Inter" font-weight="900" font-size="34" text-anchor="middle">${fmt(lerp(0, 530620, eo(p23)))}</text>`;
    if (fall > 0.6 || o.preline) { s += `<circle cx="${X(2025.5)}" cy="${Y(301000)}" r="10" fill="${C.gold}"/><text x="${X(2025.5)}" y="${Y(301000) - 22}" fill="#fff" font-family="Inter" font-weight="800" font-size="28" text-anchor="middle">301,000</text>`; }
    if (fall > 0.95 || o.preline) { s += `<circle cx="${X(2026.25)}" cy="${Y(292100)}" r="10" fill="#fff"/><text x="${X(2026.25) + 6}" y="${Y(292100) + 50}" fill="#fff" font-family="Inter" font-weight="800" font-size="26" text-anchor="middle">292,100</text><text x="${X(2026.25) + 6}" y="${Y(292100) + 76}" fill="#aaa" font-family="Inter" font-size="18" text-anchor="middle">yr to Mar 2026</text>`; }
    if (o.circle) { const L = 300; s += `<ellipse cx="${X(2026.25) + 4}" cy="${Y(292100) + 20}" rx="62" ry="70" fill="none" stroke="${C.thread}" stroke-width="6" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - o.circle)}" transform="rotate(-12 ${X(2026.25)} ${Y(292100)})"/>`; }
    s += `<text x="${o.x}" y="${o.y - 30}" fill="#fff" font-family="Inter" font-weight="800" font-size="30" letter-spacing="3">NET OVERSEAS MIGRATION</text></svg>`;
    return { svg: s, X, Y };
  }
  E.nomChart = nomChart;
  sc('S08', (c) => {
    const { t } = c; const tLow = c.w('low'), tReo = c.w('reopened'), tHalf = c.w('half'), tHigh = c.w('highest');
    c.sfx('marker', tLow, -6); c.sfx('creak', tReo, -10); c.sfx('riser', tHalf - 0.3, -6); c.sfx('stamp', tHigh + 0.3, -2);
    let h = E.boardBg();
    h += E.clip('BR_STOCK_plane_landing_sydney', t, c.start, { opacity: 0.22, dur: 10, z0: 1.05, z1: 1.15 });
    const ch = nomChart(t, { x: 230, y: 200, w: 1450, h: 640, gate: P(t, tReo, 0.8, eio), rise: P(t, tHalf - 0.1, 0.9, eo), fall: 1, preline: true, circle: P(t, tLow, 0.5) });
    h += ch.svg;
    h += E.stamp(t, tHigh + 0.3, 'RECORD', { x: ch.X(2023.5), y: ch.Y(530620) - 110, fs: 54, rot: -10 });
    h += E.tag('FACT', { x: 1530, y: 140, note: 'ABS' });
    h += `<div class="abs" style="left:230px;top:930px;font:500 17px Inter;color:#999">Sources: ABS (2023 calendar year 530,620, via Business Today; 2025: 301,000; yr to Mar 2026: 292,100) · pre-COVID average: The Australian, Dec 2023</div>`;
    h += E.credit(E.clipCredit.BR_STOCK_plane_landing_sydney, 0.8);
    return h;
  });

  // ---------------- S09 ----------------
  sc('S09', (c) => {
    const { t } = c; const tEmp = c.w('emptiest'), tThree = c.w('three'), tIs = c.w('is', 2), tHomes = c.w('homes'), tRents = c.w('rents'), tHosp = c.w('hospital'), tTraf = c.w('traffic');
    c.sfx('wind', c.start, -10); [0, 0.25, 0.5].forEach((d) => c.sfx('ping', tThree + d, -10)); c.sfx('bass_impact', tIs, -8);
    [tHomes, tRents, tHosp, tTraf].forEach((x) => c.sfx('shutter', x, -6));
    let h = '';
    if (t < tHomes - 0.2) {
      // outback, camera rising (zoom out)
      h += E.clip('BR_AI_outback_aerial_empty', t, c.start, { dur: 9, z0: 1.25, z1: 1.0 });
      h += E.aiLabel(t, c.start + 0.1, 2.2);
      if (t >= tThree - 0.3) {
        const gp = P(t, tThree - 0.3, 0.6, eio);
        const L = 1080;
        h += `<svg class="abs full" viewBox="0 0 1920 1080"><rect x="760" y="300" width="400" height="400" fill="rgba(0,0,0,.25)" stroke="#fff" stroke-width="4" stroke-dasharray="${1600}" stroke-dashoffset="${1600 * (1 - gp)}"/></svg>`;
        [[880, 420], [1040, 470], [930, 600]].forEach(([x, y], i) => { const p = P(t, tThree + i * 0.25, 0.25, back); h += `<div class="abs" style="left:${x - 14}px;top:${y - 14}px;width:28px;height:28px;border-radius:50%;background:#fff;box-shadow:0 0 18px #fff;transform:scale(${p})"></div>`; });
        h += `<div class="abs" style="left:760px;top:250px;font:700 24px Inter;color:#fff;letter-spacing:2px;opacity:${gp}">1 km²</div>`;
        h += `<div class="abs" style="left:0;right:0;top:740px;text-align:center;opacity:${P(t, tThree + 0.6, 0.4)}"><div style="font:900 84px Inter;color:#fff;text-shadow:0 4px 30px #000">≈3.6 people per km²</div><div style="font:500 26px Inter;color:#eee;margin-top:6px;text-shadow:0 2px 8px #000">27.9 million ÷ 7.69 million km² (our calculation)</div></div>`;
        h += E.tag('ANALYSIS', { x: 1180, y: 300, note: 'our calculation' });
      }
      const fl = fade(t, tIs - 0.05, tIs + 1.05, 0.08, 0.2);
      if (fl > 0) h += `<div class="abs full" style="background:rgba(12,12,12,${0.85 * fl})"></div><div class="abs" style="left:0;right:0;top:450px;text-align:center;font:900 130px Inter;color:#fff;opacity:${fl}">IS AUSTRALIA FULL?</div>`;
    } else {
      h += E.boardBg();
      const items = [['/stills/BR_STOCK_house_sold_sign.jpg', 'Homes.', tHomes, 'BR_STOCK_house_sold_sign', -6], [null, 'Rents.', tRents, 'BR_STOCK_rental_inspection_keys', 4], [null, 'Hospital waiting lists.', tHosp, 'BR_STOCK_hospital_corridor_empty', -3], [null, 'Traffic on the M1.', tTraf, 'BR_STOCK_motorway_traffic_aus', 5]];
      let last = items[0];
      items.forEach(([src, word, t0, id, rot], i) => {
        if (t < t0 - 0.05) return; last = items[i];
        const s = src || frameOf(id, t, t0, 1.0);
        h += E.photo(s, t, { x: 560 + i * 26, y: 520 + (i % 2) * 14, w: 640, h: 400, rot, move: { type: 'drop', t0 }, caption: false, pad: 16, fx: 50, fy: i === 0 ? 78 : 50 });
      });
      items.forEach(([src, word, t0], i) => { if (t < t0) return; const act = last[2] === t0; h += `<div class="abs" style="left:1060px;top:${260 + i * 130}px;font:900 ${act ? 74 : 60}px Inter;color:${act ? '#fff' : '#777'};white-space:nowrap">${E.typeText(word, lin(t, t0, 0.3))}</div>`; });
      h += E.credit(E.clipCredit[last[3]]);
    }
    return h;
  });

  // ---------------- S10 ----------------
  sc('S10', (c) => {
    const { t } = c; const tAnd = c.w('Andrew'), t170 = c.w('170'), tFar = c.w('far'), tSup = c.w('Supporters'), tBuild = c.w('build'), tStaff = c.w('staff'), tPay = c.w('pay');
    c.sfx('shutter', tAnd, -6); c.sfx('tick_roll', t170 - 0.2, -6); c.sfx('whoosh', tFar, -6); c.sfx('shutter', tSup, -6); c.sfx('shutter', tSup + 0.5, -6); c.sfx('whirr', tBuild, -8); c.sfx('pop', tStaff, -6); c.sfx('pop', tPay, -6);
    let h = E.boardBg();
    h += `<div class="abs" style="left:0;right:0;top:40px;text-align:center;font:900 40px Inter;letter-spacing:6px;color:#fff">SAME NUMBERS · TWO READINGS</div><div class="abs" style="left:958px;top:120px;width:4px;height:900px;background:#333"></div>
      <div class="abs" style="left:60px;top:110px;font:800 22px Inter;letter-spacing:3px;color:${C.coal};filter:brightness(1.6)">THE COALITION’S READING</div><div class="abs" style="left:1010px;top:110px;font:800 22px Inter;letter-spacing:3px;color:${C.gold}">SUPPORTERS’ READING</div>`;
    // LEFT: Bragg
    h += E.photo('bragg', t, { x: 210, y: 360, w: 230, h: 280, rot: -3, move: { type: 'drop', t0: tAnd } });
    if (t >= t170 - 0.4) {
      const hv = E.rollTo(t, t170 - 0.2, 0.8, 170000); const nv = P(t, tFar, 0.6, eio);
      h += `<div class="abs" style="left:400px;top:210px;font:700 22px Inter;color:#ccc;letter-spacing:2px">HOME COMPLETIONS / YEAR</div>`;
      h += `<div class="abs" style="left:400px;top:244px">${E.icon('house', { s: 54, color: C.paper })}</div>`;
      h += E.hbar({ x: 470, y: 248, w: 440, h: 50, val: hv / 300000, col: C.paper });
      h += `<div class="abs" style="left:470px;top:304px;font:900 40px Inter;color:#fff">≈${fmt(hv)}</div>`;
      if (nv > 0) { h += `<div class="abs" style="left:400px;top:368px;font:700 22px Inter;color:${C.gold};letter-spacing:2px;opacity:${nv}">NET OVERSEAS MIGRATION</div><div class="abs" style="left:400px;top:400px">${E.icon('plane', { s: 54, color: C.gold })}</div>`; h += E.hbar({ x: 470, y: 404, w: 440, h: 50, val: (292100 / 300000) * nv, col: C.gold }); h += `<div class="abs" style="left:470px;top:460px;font:900 40px Inter;color:${C.gold};opacity:${nv}">292,100</div>`; }
    }
    h += E.card(t, { x: 480, y: 600, w: 860, t0: tAnd + 0.4, outlet: 'The Nightly', date: 'Sep 2026', head: 'Andrew Bragg: net migration is still well above about 170,000 home completions a year', hl: 'about 170,000 home completions', hlP: lin(t, t170, 0.8), label: 'CLAIM', note: 'Shadow Housing Minister', src: 'The Nightly, Sep 2026', fs: 31 });
    // RIGHT: supporters
    if (t >= tSup - 0.1) {
      h += E.photo(frameOf('BR_STOCK_construction_worker_scaffold', t, tSup, 2), t, { x: 1220, y: 380, w: 330, h: 230, rot: -4, move: { type: 'drop', t0: tSup }, caption: false });
      h += E.photo(frameOf('BR_STOCK_nurse_corridor_back', t, tSup + 0.5, 1), t, { x: 1560, y: 380, w: 330, h: 230, rot: 3, move: { type: 'drop', t0: tSup + 0.5 }, caption: false });
      // icons: crane lifts house, hospital, coin
      const lift = P(t, tBuild, 0.9, eio);
      h += E.iconAt('crane', 1150, 160 + 0, { s: 70, color: C.paper, op: P(t, tBuild - 0.2, 0.2) });
      h += E.iconAt('house', 1205, lerp(260, 160, lift), { s: 46, color: C.gold, op: P(t, tBuild - 0.2, 0.2) });
      h += E.iconAt('hospital', 1560, 170, { s: 70, color: C.paper, sc: back(P(t, tStaff, 0.3)) });
      h += E.iconAt('coin', 1760, 170, { s: 70, color: C.gold, sc: back(P(t, tPay, 0.3)) });
      h += E.card(t, { x: 1440, y: 600, w: 860, t0: tSup + 0.4, outlet: 'AAP', date: '15 Oct 2026', head: 'Supporters, including the Prime Minister: migrants work across the economy and pay taxes', hl: 'migrants work across the economy and pay taxes', hlP: lin(t, tBuild, 3), label: 'CLAIM', note: 'supporters of migration', src: 'AAP, 15 Oct 2026 (Albanese speech to FECCA)', fs: 31 });
    }
    h += E.credit(t >= tSup ? 'Footage: MixailMixail / Pixabay · Pavel Danilyuk / Pexels' : E.PH.bragg.credit);
    return h;
  });

  // ---------------- S11 ----------------
  sc('S11', (c) => {
    const { t } = c; const tSame = c.w('same'), tDiff = c.w('differently'), t30 = c.w('30'), tOne = c.w('one'), tWay = c.w('way');
    c.sfx('whoosh', tSame, -6); c.sfx('glass_clink', tDiff, -4); c.sfx('split_flap', t30 - 0.1, -2); c.sfx('paper_rip', tOne, -4); c.sfx('thread_snap', tWay, -3);
    const yank = P(t, t30 - 0.6, 0.6, eio);
    let h = E.boardBg();
    // merge into one number then split colours
    const merge = P(t, c.start, Math.max(0.4, tSame - c.start + 0.3), eio); const split = P(t, tDiff, 0.5, eio);
    let num = `<div class="abs" style="left:0;right:0;top:360px;text-align:center;font:900 190px Inter;letter-spacing:-2px">`;
    num += `<span style="background:linear-gradient(90deg,${split > 0 ? C.coal : '#fff'} 0 50%, ${split > 0 ? C.gold : '#fff'} 50% 100%);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 0 ${split * 30}px rgba(255,255,255,.25))">292,100</span></div>`;
    num += `<div class="abs" style="left:${lerp(-200, 330, merge)}px;top:560px;width:600px;height:20px;background:${C.paper};opacity:${1 - merge}"></div><div class="abs" style="left:${lerp(2000, 990, merge)}px;top:560px;width:600px;height:20px;background:${C.gold};opacity:${1 - merge}"></div>`;
    if (split > 0) num += `<div class="abs" style="left:520px;top:620px;font:800 28px Inter;color:#7aa3e8;letter-spacing:3px;opacity:${split}">BRAGG’S READING</div><div class="abs" style="left:1020px;top:620px;font:800 28px Inter;color:${C.gold};letter-spacing:3px;opacity:${split}">SUPPORTERS’ READING</div>`;
    h += E.wrap(num, { x: yank * 1900, op: 1 - yank * 0.5 });
    // split-flap year board + torn reveal of sepia portrait
    if (t >= t30 - 0.6) {
      let g = E.splitFlap(t, t30 - 0.1, '2026', '1996', { x: 1350, y: 200, cw: 90, ch: 128, d: 1.2 });
      g += `<div class="abs" style="left:1240px;top:290px;font:700 22px Inter;letter-spacing:3px;color:#aaa;opacity:${P(t, t30 + 0.5, 0.4)}">30 YEARS BACK</div>`;
      g += E.photo('hanson', t, { x: 620, y: 560, w: 520, h: 600, rot: -2, sepia: 0.85, move: { t0: tOne }, knot: t >= tWay ? true : false, name: 'Pauline Hanson', role: 'One Nation' });
      g += E.torn(P(t, tOne, 0.7), { x0: 300, box: [340, 215, 560, 690] });
      h += E.wrap(g, { x: lerp(-1900, 0, yank) });
      h += E.thread([[1960, 120], [lerp(1960, 620, P(t, t30 - 0.6, Math.max(0.5, tWay - t30 + 0.6), eio)), 250]], 1, { sag: 0.15, knots: t >= tWay });
    }
    if (t >= tOne) h += E.photoCredit('hanson');
    return h;
  });

  // ---------------- S12 (quiet moment) ----------------
  sc('S12', (c) => {
    const { t } = c; const tShe = c.w('She');
    E.S.hideCounter = true;
    let h = E.boardBg();
    h += E.photo('hanson', t, { x: 520, y: 520, w: 560, h: 660, rot: -1.5, sepia: 0.85, move: { type: 'fade', t0: c.start, d: 1.0 }, name: 'Pauline Hanson', role: 'pictured in 2016' });
    h += `<div class="abs" style="left:980px;top:170px;width:820px;opacity:${P(t, c.start + 0.6, 1.0, eio)}"><div style="font:800 22px Inter;letter-spacing:4px;color:#c9b99a">10 SEPTEMBER 1996</div><div style="font:600 46px/1.25 'Source Serif 4';color:#F4EFE6;margin-top:10px">First speech · House of Representatives</div><div style="font:500 24px Inter;color:#9a9a9a;margin-top:10px">Newly elected MP from Ipswich, Queensland</div><div style="margin-top:14px">${E.tag('FACT', { inline: true, note: 'Hansard', s: 0.85 })}</div></div>`;
    if (t >= tShe - 0.3) h += `<div class="abs full" style="opacity:${P(t, tShe - 0.3, 0.9, eio)}">${E.quote(t, { x: 1390, y: 470, w: 820, outlet: 'Hansard · House of Representatives', date: '10 Sep 1996', q: '“…in danger of being swamped by Asians.”', sub: 'Pauline Hanson · 10 Sep 1996', label: 'FACT', note: 'her words', src: 'Hansard, House of Representatives, 10 Sep 1996', fs: 48 })}</div>`;
    h += E.photoCredit('hanson', 0.8);
    return E.wrap(h, { s: 1 + (t - c.start) * 0.004 });
  });

  // ---------------- S13 ----------------
  sc('S13', (c) => {
    const { t } = c; const tFam = c.w('famous'), tUnt = c.w('untouchable'), tPref = c.w('preferenced'), tComm = c.w('Commentators'), tRac = c.w('racist'), tPois = c.w('poison');
    c.sfx('shutter', tFam, -4); c.sfx('shutter', tFam + 0.15, -6); c.sfx('shutter', tFam + 0.32, -8); c.sfx('hum', tUnt, -10); c.sfx('paper_slide', tPref, -6); c.sfx('hum', tPois, -8);
    let h = '';
    if (t < tFam + 0.2) { h += E.clip('BR_AI_1990s_lounge_tv_glow', t, c.start, { dur: 5, z0: 1.02, z1: 1.1 }) + E.aiLabel(t, c.start + 0.1, 1.6); }
    else {
      h += E.boardBg();
      const px = 560, py = 540;
      // neighbouring cards slide away
      const away = P(t, tUnt, 0.9, eio);
      [['MAJOR PARTIES', -1, -1], ['COMMENTATORS', 1, -1], ['VOTERS', -1, 1]].forEach(([n, dx, dy], i) => { h += `<div class="abs" style="left:${px + dx * (270 + away * 260) - 110}px;top:${py + dy * (250 + away * 120) - 30}px;width:220px;padding:14px;background:#2a2a2a;color:#bbb;font:800 18px Inter;letter-spacing:2px;text-align:center;opacity:${0.9 - away * 0.4};transform:rotate(${dx * 4}deg)">${n}</div>`; });
      h += E.photo('hanson', t, { x: px, y: py, w: 360, h: 430, rot: -2, sepia: 0.85, move: { t0: tFam }, role: 'pictured in 2016' });
      // camera flash bursts
      [0, 0.15, 0.32].forEach((d, i) => { const f = lin(t, tFam + d, 0.25); if (f > 0 && f < 1) h += `<div class="abs" style="left:${px - 300 + i * 240}px;top:${py - 260 + (i % 2) * 380}px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,${0.95 * (1 - f)}),transparent 70%)"></div>`; });
      // keep-out ring
      if (t >= tUnt) { const rp = P(t, tUnt, 0.8, eio); const pulse = t > tPois ? 1 + 0.05 * Math.sin((t - tPois) * 10) : 1; const L = 2 * Math.PI * 330; h += `<svg class="abs full" viewBox="0 0 1920 1080"><circle cx="${px}" cy="${py}" r="${330 * pulse}" fill="none" stroke="${C.thread}" stroke-width="8" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - rp)}" opacity=".9" transform="rotate(-90 ${px} ${py})"/></svg>`; }
      // 1998 node + ballot icons
      h += E.node({ x: 1380, y: 260, w: 560, date: '1998 federal election', title: 'Major parties put One Nation last on preferences', col: C.grey, label: 'FACT', p: P(t, tPref - 0.6, 0.4), fs: 26 });
      if (t >= tPref - 0.3) {
        const order = P(t, tPref, 0.6, eio);
        const boxes = [[C.lab, 0, 0], [C.coal, 1, 1], [C.on, 2, 3], ['#7a7a7a', 3, 2]];
        boxes.forEach(([col, i0, i1]) => { const y = lerp(i0, i1, order); h += `<div class="abs" style="left:1700px;top:${380 + y * 46}px;width:120px;height:36px;background:${C.paper};border-left:16px solid ${col};font:800 18px Inter;color:#333;padding-left:10px;line-height:36px">${Math.round(lerp(i0, i1, order)) + 1}</div>`; });
        h += `<div class="abs" style="left:1700px;top:345px;font:700 16px Inter;color:#aaa;letter-spacing:2px">HOW-TO-VOTE ORDER</div>`;
      }
      h += E.card(t, { x: 1340, y: 640, w: 640, t0: tComm - 0.2, outlet: 'Commentators', date: '1996–98', head: 'Widely criticised as racist.', hl: 'racist.', hlP: lin(t, tRac, 0.5), label: 'ANALYSIS', fs: 44 });
      h += E.photoCredit('hanson', 0.8);
    }
    return h;
  });

  // ---------------- S14 (quiet moment for the 2016 return, then the staircase) ----------------
  sc('S14', (c) => {
    const { t } = c; const t2018 = c.w('2018'), t75 = c.w('75'), t130 = c.w('130');
    c.sfx('tick_roll', t75 - 0.2, -6); c.sfx('tick_roll', t130 - 0.2, -6); c.sfx('thread_snap', t75 + 0.6, -10); c.sfx('thread_snap', t130 + 0.6, -10);
    E.S.hideCounter = true;
    let h = E.boardBg();
    const out = P(t, t2018 - 0.4, 0.5);
    if (out < 1) {
      let q = E.photo('hanson', t, { x: 560, y: 520, w: 520, h: 600, rot: 0, move: { type: 'fade', t0: c.start, d: 0.6 }, still: false, name: 'Pauline Hanson', role: 'One Nation leader' });
      q += `<div class="abs" style="left:980px;top:330px;width:800px;opacity:${P(t, c.start + 0.3, 0.8)}"><div style="font:800 24px Inter;letter-spacing:4px;color:${C.on}">2016</div><div style="font:600 54px/1.2 'Source Serif 4';color:#F4EFE6;margin-top:8px">Pauline Hanson returns to the Senate</div><div style="margin-top:18px">${E.tag('FACT', { inline: true, note: '2016 federal election', s: 0.85 })}</div></div>`;
      q += E.photoCredit('hanson', 0.8);
      h += `<div class="abs full" style="opacity:${1 - out}">${q}</div>`;
    }
    if (t >= t2018 - 0.4) {
      const s1 = P(t, t75 - 0.2, 0.6, eio), s2 = P(t, t130 - 0.2, 0.6, eio);
      let g = `<div class="abs" style="left:240px;top:120px;font:800 30px Inter;letter-spacing:4px;color:#fff">HANSON’S MIGRATION TARGETS</div>`;
      g += E.tag('CLAIM', { x: 240, y: 170, note: 'her policy' });
      // steps
      const step = (x, y, w, hh, p, year, val, col) => `<div class="abs" style="left:${x}px;top:${y + hh * (1 - p)}px;width:${w}px;height:${hh * p}px;background:${col};box-shadow:0 0 30px ${col}55"></div>
        <div class="abs" style="left:${x}px;top:${y - 120}px;width:${w}px;text-align:center;opacity:${p}"><div style="font:800 26px Inter;color:#f7c79a;letter-spacing:3px">${year}</div><div style="font:900 64px Inter;color:#fff">${fmt(val)}</div></div>`;
      g += step(420, 640, 460, 220, s1, '2018 · CAP', E.rollTo(t, t75 - 0.2, 0.7, 75000), C.on);
      g += step(940, 470, 460, 390, s2, '2025 · TARGET', E.rollTo(t, t130 - 0.2, 0.7, 130000), C.on);
      g += `<div class="abs" style="left:300px;top:860px;width:1200px;height:3px;background:#666"></div>`;
      g += `<div class="abs" style="left:420px;top:640px;width:460px;height:220px;border:3px dashed #8a6a4a;background:rgba(242,140,40,.13)"></div><div class="abs" style="left:940px;top:470px;width:460px;height:390px;border:3px dashed #8a6a4a;background:rgba(242,140,40,.13)"></div>`;
      g += E.thread([[180, 640], [650, 640], [1170, 470]], P(t, t75, Math.max(0.6, t130 - t75 + 0.6), eio), { sag: 0.05 });
      g += `<div class="abs" style="left:240px;top:900px;font:500 18px Inter;color:#999">Source: Wikipedia, “Hansonism”, and its cited sources</div>`;
      h += `<div class="abs full" style="opacity:${P(t, t2018 - 0.4, 0.5)}">${g}</div>`;
    }
    return h;
  });

  // ---------------- S15 ----------------
  sc('S15', (c) => {
    const { t } = c; const tCoal = c.w('coalition'), tLost = c.w('lost'), t94 = c.w('94'), tNot = c.w('not'), tStory = c.w('story'), tSurp = c.w('surprised'), tOne = c.w('One');
    c.sfx('shutter', tCoal, -6); c.sfx('rumble', tLost, -4); c.sfx('tick_roll', t94 - 0.3, -6); c.sfx('bass_impact', t94 + 0.4, -6); c.sfx('stamp', tNot, -4); c.sfx('tape_stop', tStory, -6); c.sfx('heartbeat', tSurp, -2); c.sfx('heartbeat', tSurp + 0.9, -4);
    let h = '';
    if (t < tCoal - 0.3) { h += E.clip('BR_AI_election_night_empty_hall', t, c.start, { dur: 5, z0: 1.02, z1: 1.12, x0: 0, x1: -40 }) + E.aiLabel(t, c.start + 0.1, 2.2); return h; }
    h += E.boardBg();
    h += E.ausMap({ x: 520, y: 140, s: 0.88, op: 0.18, fill: 'rgba(255,255,255,.04)', stroke: 'rgba(255,255,255,.25)' });
    // Dutton + tag
    const fall = P(t, tLost + 0.2, 0.9, eio);
    h += E.wrap(E.photo('dutton', t, { x: 250, y: 420, w: 260, h: 320, rot: -4, move: { type: 'drop', t0: tCoal - 0.2 } }) + `<div class="abs" style="left:110px;top:640px;width:300px;background:${C.coal};color:#fff;font:800 20px Inter;padding:10px 14px;transform:rotate(-3deg)">Coalition 2025: cut migration<div style="margin-top:6px">${E.tag('FACT', { inline: true, s: 0.7 })}</div></div>`, { y: fall * 900, rot: fall * 14, op: 1 - fall });
    // 150-seat hemicycle
    const cx = 1060, cy = 760; const lit = Math.round(E.rollTo(t, t94 - 0.3, 1.1, 94)); let dots = '';
    let k = 0; const rows = [[300, 24], [345, 28], [390, 31], [435, 33], [480, 34]];
    const seats = [];
    rows.forEach(([r, n]) => { for (let i = 0; i < n; i++) { const a = Math.PI - (i / (n - 1)) * Math.PI; seats.push([cx + Math.cos(a) * r, cy - Math.sin(a) * r, a]); } });
    seats.sort((a, b) => b[2] - a[2]);
    seats.forEach(([x, y], i) => { const on = i < lit; dots += `<circle cx="${x}" cy="${y}" r="14" fill="${on ? C.lab : '#3a3a3a'}"/>`; });
    h += `<svg class="abs full" viewBox="0 0 1920 1080" style="opacity:${P(t, tLost, 0.5)}">${dots}</svg>`;
    h += `<div class="abs" style="left:${cx - 200}px;width:400px;top:${cy - 150}px;text-align:center;opacity:${P(t, t94 - 0.4, 0.3)}"><div style="font:900 120px Inter;color:#fff">${lit}</div><div style="font:800 24px Inter;letter-spacing:3px;color:${C.lab}">LABOR SEATS</div></div>`;
    h += `<div class="abs" style="left:${cx - 300}px;top:120px;width:600px;text-align:center;font:800 26px Inter;color:#fff;letter-spacing:4px;opacity:${P(t, tLost, 0.4)}">MAY 2025 FEDERAL ELECTION</div>`;
    h += E.tag('FACT', { x: cx + 260, y: 116, note: 'AEC', op: P(t, tLost, 0.4) });
    // One Nation tile
    if (t >= tOne - 0.3) {
      const grey = P(t, tNot, 0.6);
      h += `<div class="abs" style="left:1520px;top:300px;width:320px;padding:22px;background:${grey > 0 ? `rgb(${lerp(242, 90, grey)},${lerp(140, 90, grey)},${lerp(40, 90, grey)})` : C.on};color:#fff;opacity:${P(t, tOne - 0.3, 0.4)}"><div style="font:800 22px Inter;letter-spacing:3px">ONE NATION</div><div style="font:900 64px Inter">6.4%</div><div style="font:700 24px Inter">0 House seats</div></div>`;
      h += E.stamp(t, tNot, '0', { x: 1790, y: 300, fs: 110, rot: -12, color: '#fff', bw: 8, pad: '0 30px' });
    }
    // Hanson node fades to sepia, then an orange pulse runs down the thread
    if (t >= tStory - 1.2) {
      const sep = P(t, tStory, 0.8);
      h += E.photo('hanson', t, { x: 1680, y: 760, w: 200, h: 230, rot: 3, sepia: sep * 0.9, move: { type: 'rise', t0: tStory - 1.2 }, caption: false });
      if (t >= tSurp - 0.6) {
        h += E.thread([[1680, 620], [1880, 200], [1960, -40]], 1, { sag: 0.05, knots: false, w: 3 });
        const pp = lin(t, tSurp, 1.0); if (pp > 0 && pp < 1) { const x = lerp(1960, 1680, pp), y = lerp(-40, 640, pp); h += `<div class="abs" style="left:${x - 20}px;top:${y - 20}px;width:40px;height:40px;border-radius:50%;background:${C.on};box-shadow:0 0 40px 10px ${C.on}"></div>`; }
        if (t > tSurp + 1) h += `<div class="abs" style="left:1560px;top:630px;width:240px;height:270px;box-shadow:0 0 ${40 + 20 * Math.sin((t - tSurp) * 6)}px ${C.on};opacity:.7"></div>`;
      }
    }
    h += E.credit('Photos: Presidential Communications Office (PH) · Public domain / jfish92 · CC0');
    return h;
  });
})();
