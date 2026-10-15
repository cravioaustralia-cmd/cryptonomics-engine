/* lf09 scenes C: chapter 6 (who pays), chapter 7 (twist), closing, end screen: S33-S44 + END. */
(function () {
  const { C, P, lin, clamp, lerp, eo, eio, back, fade, esc, fmt } = E;
  const sc = RT.scene;

  // receipt that prints the "WHO PAYS?" list (S32 -> S35)
  function receipt(t, lines, o = {}) {
    let rows = '';
    lines.forEach(([txt, t0]) => { if (t < t0) return; rows += `<div style="margin-top:14px;font:700 26px 'DejaVu Sans Mono',monospace;color:#222;white-space:nowrap">${esc(E.typeText(txt, lin(t, t0, 0.4)))}${t > t0 + 0.4 ? '<span style="float:right">?</span>' : ''}</div>`; });
    const n = lines.filter(([, t0]) => t >= t0).length;
    const hgt = 200 + n * 52;
    return `<div class="abs" style="left:${o.x || 1500}px;top:${1080 - hgt}px;width:360px;height:${hgt + 20}px;background:#f5f3ee;box-shadow:0 -10px 30px rgba(0,0,0,.5);padding:26px 26px;transform:rotate(${o.rot || 0}deg);transform-origin:50% 100%">
      <div style="font:900 34px 'DejaVu Sans Mono',monospace;color:#111;text-align:center">WHO PAYS?</div><div style="border-top:3px dashed #999;margin-top:12px"></div>${rows}</div>`;
  }

  // ---------------- S33 ----------------
  sc('S33', (c) => {
    const { t } = c; const tLands = c.w('lands'), tUni = c.w('Universities'), tUni2 = c.w('Universities', 2), tLuke = c.w('Luke'), tRace = c.w('race'), tExp = c.w('export');
    c.sfx('receipt', tLands, -6); c.sfx('descend', tRace, -6); c.sfx('pop', tExp, -6); c.sfx('shutter', tUni + 0.6, -8);
    let h = E.boardBg();
    const lines = [['UNIVERSITIES', tLands]];
    // campus still (push in) then lecture hall stack
    if (t < tUni2 + 0.4) {
      h += `<div class="abs" style="left:0;top:0;width:1440px;height:1080px;overflow:hidden">${E.clip('BR_STOCK_university_campus_aerial', t, c.start, { dur: 6, z0: 1.05, z1: 1.18 })}</div>`;
      h += E.credit(E.clipCredit.BR_STOCK_university_campus_aerial, 1, 'left');
    } else {
      h += E.photo(E.clipSrc('BR_STOCK_university_campus_aerial', t, c.start), t, { x: 420, y: 330, w: 520, h: 300, rot: -4, caption: false, move: { t0: tUni2 } });
      h += E.photo(E.clipSrc('BR_STOCK_lecture_hall_empty', t, tUni + 0.6, { offset: 1 }), t, { x: 520, y: 380, w: 520, h: 300, rot: 3, caption: false, move: { type: 'drop', t0: tUni2 + 0.4 } });
      h += E.card(t, { x: 560, y: 610, w: 900, t0: tLuke - 0.3, outlet: 'Times Higher Education', date: '14 Sep 2026', head: 'Universities Australia: all three parties are in a political race to the bottom on international students', hl: 'race to the bottom', hlP: lin(t, tRace, 0.6), label: 'CLAIM', note: 'Luke Sheehy, chief executive', src: 'Times Higher Education, 14 Sep 2026 (Luke Sheehy)', fs: 32 });
      // three party bars race downward
      const rp = P(t, tRace, 1.1, eio);
      [[C.on, 0], [C.lab, 1], [C.coal, 2]].forEach(([col, i]) => { const hh = lerp(220, 40, clamp(rp * (1 + i * 0.15), 0, 1)); h += `<div class="abs" style="left:${1110 + i * 90}px;top:${120}px;width:60px;height:${hh}px;background:${col};opacity:${P(t, tRace - 0.3, 0.3)}"></div>`; });
      h += `<div class="abs" style="left:1100px;top:360px;font:800 18px Inter;color:#aaa;letter-spacing:2px;opacity:${P(t, tRace - 0.3, 0.3)}">RACE TO THE BOTTOM ↓</div>`;
      const ep = P(t, tExp, 0.35, back);
      h += `<div class="abs" style="left:1090px;top:430px;transform:scale(${ep});transform-origin:0 50%"><div style="display:flex;align-items:center">${E.icon('ship', { s: 70 })}${E.icon('cap', { s: 60, color: C.gold })}</div><div style="font:700 22px Inter;color:#fff;width:330px;margin-top:6px">International education: a major export</div><div style="margin-top:6px">${E.tag('FACT', { inline: true, s: 0.75 })}</div></div>`;
      h += E.credit('Photo: Toby Hudson · CC BY-SA · Footage: Pavel Danilyuk / Pexels', 0.9, 'left');
    }
    h += receipt(t, lines);
    return h;
  });

  // regional map with icon groups
  function regionMap(t, o) {
    let h = E.ausMap({ x: o.x, y: o.y, s: o.s, op: o.op == null ? 1 : o.op, fill: 'rgba(255,255,255,.035)', stroke: 'rgba(255,255,255,.35)' });
    const spots = [['tree', 'Mildura', o.tPick], ['tree', 'Bundaberg', o.tPick], ['beer', 'Broken Hill', o.tPour], ['beer', 'Kalgoorlie', o.tPour], ['bed', 'Alice Springs', o.tFill], ['bed', 'Port Hedland', o.tFill]];
    spots.forEach(([ic, cty, t0]) => {
      const [cx, cy] = E.city(cty); const on = t0 != null ? P(t, t0, 0.25) * (1 - 0.7 * P(t, t0 + 0.5, 0.6)) : 0.3;
      h += `<div class="abs" style="left:${o.x + cx * o.s - 28}px;top:${o.y + cy * o.s - 28}px;width:56px;height:56px;border-radius:50%;background:rgba(${on > 0.4 ? '242,140,40' : '60,60,60'},${0.25 + on * 0.5});box-shadow:0 0 ${on * 30}px ${C.on};display:flex;align-items:center;justify-content:center;opacity:${o.op == null ? 1 : o.op}">${E.icon(ic, { s: 34, color: on > 0.4 ? '#fff' : '#999' })}</div>`;
    });
    return h;
  }

  // ---------------- S34 ----------------
  sc('S34', (c) => {
    const { t } = c; const t40 = c.w('40'), tThen = c.w('Then'), tReg = c.w('regional'), tPick = c.w('pick'), tPour = c.w('pour'), tFill = c.w('fill'), tHel = c.w('Helen'), tParl = c.w('Parliament'), tAcc = c.w('Accommodation');
    c.sfx('receipt', c.start, -6); c.sfx('receipt', tReg, -6); c.sfx('tick_roll', t40 - 0.2, -6); c.sfx('ping', tPick, -8); c.sfx('ping', tPour, -8); c.sfx('ping', tFill, -8); c.sfx('whoosh', tParl - 0.4, -6); c.sfx('shutter', tHel, -8);
    let h = E.boardBg();
    const lines = [['UNIVERSITIES', -1], ['HOSPITALITY', c.start + 0.1], ['REGIONS', tReg]];
    if (t < tThen) {
      h += `<div class="abs" style="left:0;top:0;width:1440px;height:1080px;overflow:hidden;opacity:${1 - P(t, tAcc + 0.3, 0.5) * 0.75}">${E.clip('BR_AI_cafe_empty_morning', t, c.start, { dur: 8, z0: 1.02, z1: 1.14 })}</div>`;
      h += E.aiLabel(t, c.start + 0.1, 2.2);
      if (t >= tAcc) {
        const v = E.rollTo(t, t40 - 0.2, 0.8, 40000);
        h += `<div class="abs" style="left:120px;top:200px;opacity:${P(t, tAcc, 0.3)}"><span style="font:900 150px Inter;color:#fff;text-shadow:0 6px 30px #000">${fmt(v)}+</span><div style="font:800 30px Inter;color:#fff;letter-spacing:3px;text-shadow:0 2px 10px #000">UNFILLED HOSPITALITY JOBS</div></div>`;
        h += E.card(t, { x: 720, y: 560, w: 1100, t0: tAcc + 0.4, outlet: 'Accommodation Australia', date: '12 Aug 2026', head: '40,000+ hospitality job vacancies · cutting skilled workers “only going to make a bad situation worse”', hl: '“only going to make a bad situation worse”', hlP: lin(t, t40 + 4.5, 0.8), label: 'CLAIM', note: 'James Goodwin', src: 'Accommodation Australia, 12 Aug 2026 (James Goodwin)', fs: 32 });
      }
    } else if (t < tHel - 0.3) {
      h += `<div class="abs" style="left:0;top:0;width:1440px;height:1080px;overflow:hidden;opacity:.35">${E.clip('BR_AI_outback_aerial_empty', t, tThen, { dur: 10, offset: 5, z0: 1.1, z1: 1.2 })}</div>`;
      h += `<div class="abs" style="left:120px;top:110px;font:800 30px Inter;letter-spacing:4px;color:#fff;opacity:${P(t, tThen, 0.4)}">REGIONAL AUSTRALIA</div>`;
      h += regionMap(t, { x: 180, y: 170, s: 0.95, op: P(t, tThen, 0.5), tPick, tPour, tFill });
      [['PICK FRUIT', tPick], ['POUR BEERS', tPour], ['FILL MOTEL ROOMS', tFill]].forEach(([w, t0], i) => { h += `<div class="abs" style="left:1080px;top:${360 + i * 90}px;font:900 50px Inter;color:${t > t0 + 0.6 ? '#777' : '#fff'};opacity:${P(t, t0, 0.25)}">${w}</div>`; });
      h += E.aiLabel(t, tThen + 0.1, 2.0);
    } else {
      h += regionMap(t, { x: 180, y: 170, s: 0.95, op: 0.35, tPick, tPour, tFill });
      h += E.photo('haines', t, { x: 380, y: 520, w: 330, h: 410, rot: -3, move: { type: 'drop', t0: tHel } });
      h += E.card(t, { x: 960, y: 380, w: 780, t0: tHel + 0.3, outlet: 'ABC News', date: '17 Sep 2026', head: 'Independent MP Helen Haines raised the damage to the regions from slowed working holiday visas in Question Time', hl: 'damage to the regions', hlP: lin(t, tParl - 0.6, 0.6), label: 'FACT', note: 'as reported', src: 'ABC News, 17 Sep 2026 (Haines question in Question Time)', fs: 31 });
      h += E.photoCredit('haines', 0.9);
    }
    h += receipt(t, lines);
    return h;
  });

  // ---------------- S35 ----------------
  sc('S35', (c) => {
    const { t } = c; const tTw = c.w('twist'), tPaul = c.w('Pauline'), tStar = c.w('starving'), tWrong = c.w('wrong'), tSo = c.w('So');
    c.sfx('twist', tTw, -6); c.sfx('shutter', c.start + 0.2, -6); c.sfx('marker', tStar, -8); c.sfx('rope', tWrong, -4);
    const roll = P(t, tTw, 0.7, eio) * 5 * (1 - P(t, tPaul + 1.0, 0.8, eio));
    let h = E.boardBg();
    h += regionMap(t, { x: 120, y: 150, s: 0.9, op: 0.45 });
    h += E.photo('hanson', t, { x: 520, y: 520, w: 320, h: 380, rot: -4, move: { type: 'drop', t0: c.start + 0.2 } });
    h += E.card(t, { x: 1340, y: 160, w: 860, t0: tPaul + 0.6, outlet: 'ABC News', date: '17 Sep 2026', head: 'Pauline Hanson accuses Labor of “starving” regional Australia of workers and tourists', hl: '“starving”', hlP: lin(t, tStar, 0.4), label: 'CLAIM', note: 'Hanson statement, as reported', src: 'Hanson statement, reported by ABC News, 17 Sep 2026', fs: 36 });
    // two arrows twist into a knot on the red thread
    if (t >= tSo - 0.3) {
      const k = P(t, tWrong, 0.8, eio); const op = P(t, tSo - 0.3, 0.4);
      const y = 720;
      h += E.thread([[940, y + 140], [1820, y + 140]], 1, { sag: 0.02, knots: false });
      h += `<div class="abs" style="left:${lerp(960, 1180, k)}px;top:${lerp(y - 40, y + 70, k)}px;transform:rotate(${lerp(0, 18, k)}deg);opacity:${op};background:${C.on};color:#111;font:900 30px Inter;padding:14px 50px 14px 22px;clip-path:polygon(0 0,88% 0,100% 50%,88% 100%,0 100%)">LESS MIGRATION</div>`;
      h += `<div class="abs" style="left:${lerp(1440, 1260, k)}px;top:${lerp(y + 40, y + 70, k)}px;transform:rotate(${lerp(0, -18, k)}deg);opacity:${op};background:#ddd;color:#111;font:900 30px Inter;padding:14px 22px 14px 50px;clip-path:polygon(12% 0,100% 0,100% 100%,12% 100%,0 50%)">NOT THESE CUTS</div>`;
      if (k > 0.9) h += E.knotAt(1330, y + 140, true) + `<div class="abs" style="left:1230px;top:${y + 170}px;font:700 22px Inter;color:#aaa">criticised the government for cutting the wrong kind</div>`;
    }
    h += E.photoCredit('hanson', 0.9);
    return E.wrap(h, { rot: roll });
  });

  // ---------------- S36 ----------------
  sc('S36', (c) => {
    const { t } = c; const tOne = c.w('one'), tHead = c.w('headline'), tHous = c.w('housing'), tWag = c.w('wages'), tEco = c.w('economy'), tWhat = c.w('what', 2), tPolls = c.w('polls'), tSo = c.w('So');
    c.sfx('needle', tHead, -6); c.sfx('stamp', tHous, -6); c.sfx('stamp', tWag, -6); c.sfx('stamp', tEco, -6); c.sfx('chain_rattle', tWhat, -2); c.sfx('shimmer', tPolls, -4); c.sfx('bass_impact', tPolls + 0.1, -6);
    let h = E.boardBg();
    const out = P(t, tSo - 0.2, 0.5);
    let g = E.card(t, { x: 960, y: 70, w: 1200, t0: c.start + 0.2, outlet: 'The Conversation', date: 'Oct 2026', head: 'Migration experts: none of the three parties’ plans is properly based on evidence', hl: 'properly based on evidence', hlP: lin(t, c.w('evidence') - 0.6, 0.7), label: 'ANALYSIS', src: 'The Conversation, Oct 2026', fs: 38 });
    // big gauge + arrows
    const gp = P(t, c.start + 1.0, 0.6) * lerp(0.45, 1, P(t, tOne - 0.3, 0.4));
    const ang = lerp(-60, 50, P(t, tHead, 1.0, back)) + Math.sin(t * 3) * 2;
    g += `<div class="abs full" style="opacity:${gp}"><svg class="abs" style="left:610px;top:430px" width="700" height="380" viewBox="0 0 700 380"><path d="M50 340 A300 300 0 0 1 650 340" fill="none" stroke="#444" stroke-width="26"/><path d="M50 340 A300 300 0 0 1 650 340" fill="none" stroke="${C.gold}" stroke-width="26" stroke-dasharray="942" stroke-dashoffset="${942 * (1 - P(t, tHead, 1))}"/><line x1="350" y1="340" x2="${350 + Math.sin(ang * Math.PI / 180) * 260}" y2="${340 - Math.cos(ang * Math.PI / 180) * 260}" stroke="#fff" stroke-width="10" stroke-linecap="round"/><circle cx="350" cy="340" r="18" fill="#fff"/></svg>
      <div class="abs" style="left:610px;width:700px;top:830px;text-align:center;font:900 34px Inter;color:#fff;letter-spacing:3px">NET OVERSEAS MIGRATION</div>`;
    [[C.on, 360, 520], [C.lab, 300, 700], [C.coal, 1560, 610]].forEach(([col, x, y], i) => { const p = P(t, tOne + i * 0.15, 0.4, eo); g += `<div class="abs" style="left:${x}px;top:${y}px;width:${lerp(0, 230, p)}px;height:10px;background:${col};transform:rotate(${x > 960 ? 180 + (y - 610) * 0.05 : (650 - y) * -0.05}deg);transform-origin:${x > 960 ? '0 50%' : '0 50%'}"></div>`; });
    g += `</div>`;
    // small gauges stamped NO MODELLING
    [['HOUSING', tHous], ['WAGES', tWag], ['ECONOMY', tEco]].forEach(([n, t0], i) => {
      const x = 330 + i * 640 + (i === 1 ? 0 : 0); const y = 930; if (t < tHead) return;
      g += `<div class="abs" style="left:${i === 0 ? 130 : i === 1 ? 1380 : 1640}px;top:${i === 0 ? 860 : 860}px;width:240px;text-align:center;opacity:${P(t, tHead + 0.4, 0.4)}"><svg width="160" height="90" viewBox="0 0 160 90"><path d="M10 80 A70 70 0 0 1 150 80" fill="none" stroke="#555" stroke-width="12"/><line x1="80" y1="80" x2="40" y2="40" stroke="#777" stroke-width="5"/></svg><div style="font:800 22px Inter;color:#999;letter-spacing:2px">${n}</div></div>`;
      g += E.stamp(t, t0, 'NO MODELLING', { x: (i === 0 ? 250 : i === 1 ? 1500 : 1760), y: 900, fs: 22, rot: -10, color: '#bdbdbd', bw: 3, pad: '4px 10px', ls: 2, amp: 2 });
    });
    h += `<div class="abs full" style="opacity:${1 - out}">${g}</div>`;
    if (out > 0) {
      const p = P(t, tSo - 0.2, 0.6, eo);
      const rattle = t > tWhat && t < tWhat + 0.9 ? Math.sin((t - tWhat) * 70) * 9 * (1 - (t - tWhat) / 0.9) : 0;
      h += E.padlockChart(t, { x: 960, y: lerp(1400, 540, p), rattle, glint: lin(t, tPolls, 0.7) });
      h += `<div class="abs" style="left:0;right:0;top:820px;text-align:center;font:600 40px 'Source Serif 4';color:#ddd;opacity:${P(t, tPolls - 1.0, 0.6)}">The answer might be in the polls.</div>`;
    }
    return h;
  });

  // ---------------- S37 ----------------
  sc('S37', (c) => {
    const { t } = c; const tHere = c.w('Here'), t30 = c.w('30'), t27 = c.w('27'), tThree = c.w('Three'), tRis = c.w('risen'), tDrop = c.w('dropped'), t20 = c.w('20'), tAll = c.w('all');
    c.sfx('padlock_break', tHere, -2); c.sfx('bass_impact', tHere + 0.05, -4); c.sfx('click', t30, -4); c.sfx('click', t27, -4); c.sfx('drop', tThree, -4); c.sfx('whoosh', tRis, -6); c.sfx('flash', tDrop + 0.3, -6); c.sfx('click', t20, -6); c.sfx('stamp', tAll, -1);
    let h = E.boardBg();
    if (t < tHere + 0.9) {
      const un = P(t, tHere, 0.5, eio);
      h += E.padlockChart(t, { x: 960, y: 540, unlocked: un, rattle: t < tHere ? Math.sin(t * 60) * 3 : 0 });
      if (t >= tHere) { for (let i = 0; i < 14; i++) { const p = lin(t, tHere, 0.8); const a = E.hash(i) * 6.28; h += `<div class="abs" style="left:${960 + Math.cos(a) * p * 400}px;top:${480 + Math.sin(a) * p * 300 + p * p * 200}px;width:16px;height:6px;background:#ddd;transform:rotate(${a * 90}deg);opacity:${1 - p}"></div>`; } }
      h = E.wrap(h, { s: lerp(1, 2.6, P(t, tHere + 0.3, 0.6, eio)), op: 1 - P(t, tHere + 0.6, 0.3) });
    }
    const cp = P(t, tHere + 0.5, 0.5);
    if (cp > 0) {
      const X0 = 260, Xw = 1100, Y = (v) => 860 - ((v - 15) / 20) * 620;
      const xs = 0.12, xo = 0.92; const X = (f) => X0 + f * Xw;
      let s = `<div class="abs" style="left:${X0}px;top:${Y(35)}px;width:${Xw}px;height:${Y(15) - Y(35)}px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)"></div><svg class="abs full" viewBox="0 0 1920 1080">`;
      for (let v = 15; v <= 35; v += 5) s += `<line x1="${X0}" x2="${X0 + Xw}" y1="${Y(v)}" y2="${Y(v)}" stroke="rgba(255,255,255,${v === 20 ? 0.35 : 0.08})" stroke-width="${v === 20 ? 2 : 1}" ${v === 20 ? 'stroke-dasharray="8 6"' : ''}/><text x="${X0 - 16}" y="${Y(v) + 8}" fill="#888" font-family="Inter" font-size="20" text-anchor="end">${v}%</text>`;
      s += `<text x="${X(xs)}" y="900" fill="#aaa" font-family="Inter" font-size="20" text-anchor="middle">14–17 SEP 2026</text><text x="${X(xo)}" y="900" fill="#aaa" font-family="Inter" font-size="20" text-anchor="middle">5–8 OCT 2026</text>`;
      // marker 17 Sep (speech)
      const mp = P(t, tThree, 0.5, back); const mx = X(xs + 0.07);
      if (mp > 0.01) s += `<line x1="${mx}" x2="${mx}" y1="${lerp(200, 240, 1 - mp)}" y2="${lerp(240, 870, mp)}" stroke="${C.lab}" stroke-width="3" stroke-dasharray="10 6"/><text x="${mx + 10}" y="232" fill="${C.lab}" font-family="Inter" font-weight="800" font-size="20">17 SEP · Burke speech</text>`;
      const lines = [[C.on, 30, 28, t30, tDrop, 'ONE NATION'], [C.lab, 27, 29, t27, tRis, 'LABOR'], [C.coal, 19, 20, t30 + 0.4, t20, 'COALITION']];
      lines.forEach(([col, a, b, ta, tb, n]) => {
        const pa = P(t, ta, 0.3, back), pb = P(t, tb - 0.2, 0.7, eio);
        if (pa > 0) s += `<circle cx="${X(xs)}" cy="${Y(a)}" r="${11 * pa}" fill="${col}"/><text x="${X(xs) - 22}" y="${Y(a) + 9}" fill="${col}" font-family="Inter" font-weight="900" font-size="30" text-anchor="end" opacity="${pa}">${a}</text>`;
        if (pb > 0) { const x2 = lerp(X(xs), X(xo), pb), y2 = lerp(Y(a), Y(b), pb); s += `<line x1="${X(xs)}" y1="${Y(a)}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="6"/><circle cx="${x2}" cy="${y2}" r="11" fill="${col}"/>`; if (pb > 0.98) s += `<text x="${X(xo) + 22}" y="${Y(b) + 10}" fill="${col}" font-family="Inter" font-weight="900" font-size="34">${b} <tspan font-size="20" font-weight="700">${n}</tspan></text>`; }
      });
      s += `</svg>`;
      // crossing flash
      const fl = lin(t, tDrop + 0.3, 0.5);
      if (fl > 0 && fl < 1) s += `<div class="abs" style="left:${X(0.5) - 120}px;top:${Y(28.5) - 120}px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,${1 - fl}),transparent 65%)"></div>`;
      h += `<div class="abs full" style="opacity:${cp}">${s}<div class="abs" style="left:260px;top:120px;font:800 30px Inter;letter-spacing:3px;color:#fff">NEWSPOLL · PRIMARY VOTE</div>
        ${E.pollCard(t, { x: 1640, y: 250, w: 470, t0: tHere + 0.9, pollster: 'NEWSPOLL · 5–8 OCT 2026', when: 'vs 14–17 Sep 2026', n: 'n = 1,241', rows: [{ party: 'Labor', val: '29 (27)', col: C.lab }, { party: 'One Nation', val: '28 (30)', col: C.on }, { party: 'Coalition', val: '20 (19)', col: C.coal }, { party: 'Greens', val: '14', col: C.grn }], src: 'Newspoll / The Australian, via The Conversation (11 Oct 2026) and The New Daily (12 Oct 2026); Sep figures from the previous film’s register' })}</div>`;
      h += E.stamp(t, tAll, 'ALL THREE IN THE 20s', { x: 820, y: 560, fs: 70, rot: -6, sub: 'FIRST TIME ON RECORD', bg: 'rgba(18,18,18,.85)', amp: 5 });
      if (t >= tAll) h += E.tag('FACT', { x: 1100, y: 640, note: 'Newspoll' });
    }
    return h;
  });

  // ---------------- S38 ----------------
  sc('S38', (c) => {
    const { t } = c; const tRes = c.w('Resolve'), tSame = c.w('same'), tDoes = c.w('doesn\'t'), tBut = c.w('But'), tNot = c.w('notice'), tYou = c.w('you\'d');
    { const a = Math.min(tSame - 0.6, c.start + 0.2), st = Math.max(0.3, (tSame - c.start - 0.2) / 3); [0, 1, 2].forEach((i) => c.sfx('click', a + i * st, -6)); } c.sfx('stamp', tDoes, -1); c.sfx('lamp', tYou, -2);
    let h = E.boardBg();
    const out = P(t, tBut - 0.3, 0.4);
    let g = '';
    const cards = [
      { pollster: 'NEWSPOLL · 5–8 OCT 2026', when: 'n = 1,241', rows: [{ party: 'Labor', val: '29', col: C.lab }, { party: 'One Nation', val: '28', col: C.on }, { party: 'Coalition', val: '20', col: C.coal }], src: 'Newspoll / The Australian, via The Conversation, 11 Oct 2026' },
      { pollster: 'RESOLVE · 6–10 OCT 2026', when: 'n = 2,250 · for Nine', rows: [{ party: 'Labor', val: '29', col: C.lab }, { party: 'One Nation', val: '25', col: C.on }, { party: 'Coalition', val: '23', col: C.coal }], src: 'Resolve Political Monitor for Nine, via The Conversation, 11 Oct 2026' },
      { pollster: 'DEMOSAU · OCT 2026', when: 'One Nation −4 on the previous quarter', rows: [{ party: 'Labor', val: '27', col: C.lab }, { party: 'One Nation', val: '26', col: C.on }], src: 'Yahoo News Australia, 12 Oct 2026' },
    ];
    cards.forEach((k, i) => { const t0 = Math.min(tSame - 0.6, c.start + 0.2) + i * Math.max(0.3, (tSame - c.start - 0.2) / 3); g += E.pollCard(t, Object.assign({ x: 420 + i * 540, y: 200 + i * 30, w: 480, t0, rot: (i - 1) * 3 }, k)); g += `<div class="abs" style="left:${560 + i * 540}px;top:${150 + i * 30}px;opacity:${P(t, t0 + 0.2, 0.3)}">${E.icon('arrowDown', { s: 60, color: C.on, sw: 3 })}</div>`; });
    g += E.stamp(t, tDoes, 'CORRELATION ≠ CAUSATION', { x: 960, y: 760, color: '#c8c8c8', dashed: true, fs: 72, rot: -5, bg: 'rgba(18,18,18,.85)' });
    if (t >= tDoes) g += E.tag('ANALYSIS', { x: 1340, y: 830 });
    h += `<div class="abs full" style="opacity:${1 - out}">${g}</div>`;
    if (out > 0) {
      const lamp = t >= tYou ? 1 : 0;
      h += `<div class="abs full" style="opacity:${out}">${E.clip('BR_AI_strategy_room_whiteboard', t, tBut - 0.3, { dur: 5, z0: 1.02, z1: 1.1, filter: `brightness(${lamp ? 1.15 : 0.7})` })}${lamp ? `<div class="abs full" style="background:radial-gradient(ellipse at 34% 68%,rgba(255,220,150,${0.35 * (1 - lin(t, tYou, 2) * 0.4)}),transparent 45%)"></div>` : ''}${E.aiLabel(t, tBut - 0.2, 2.0)}</div>`;
    }
    return h;
  });

  // ---------------- S39 ----------------
  sc('S39', (c) => {
    const { t } = c; const tOther = c.w('other'), tMono = c.w('monoculture'), tSpec = c.w('spec'), tHe = c.w('He'), tIn = c.w('In');
    c.sfx('reverse_whoosh', tOther - 0.2, -4); c.sfx('tone', tMono, -8); c.sfx('pop', tSpec, -4);
    let h = E.boardBg();
    h += E.photo('albanese', t, { x: 330, y: 520, w: 400, h: 500, rot: -2, move: { type: 'rise', t0: c.start } });
    // red node slides in from the right, opposite to the board's flow
    const np = P(t, tOther - 0.3, 0.7, eo);
    h += E.node({ x: lerp(2200, 1500, np), y: 150, w: 380, date: '15 OCT 2026', title: 'Multiculturalism speech', col: C.lab, label: 'FACT', p: np > 0 ? 1 : 0, fs: 26 });
    if (np > 0) h += `<div class="abs" style="left:${lerp(2400, 1700, np)}px;top:250px;font:900 40px Inter;color:${C.lab};opacity:${np}">←</div>`;
    h += E.card(t, { x: 1080, y: 300, w: 900, t0: tIn, outlet: 'AAP', date: '15 Oct 2026', head: 'Pauline Hanson has previously said Australia should be a monoculture', hl: 'a monoculture', hlP: lin(t, tMono, 0.6), label: 'FACT', note: 'as reported', src: 'AAP, 15 Oct 2026', fs: 36, out: tSpec - 1.6 });
    if (t >= tMono) h += `<div class="abs" style="left:1440px;top:270px;width:60px;height:60px;background:#9a9a9a;border:3px solid #fff;opacity:${P(t, tMono, 0.3) * (1 - P(t, tSpec - 1.6, 0.3))}"></div>`;
    h += E.quote(t, { x: 1110, y: 520, w: 920, t0: tSpec - 1.4, outlet: 'AAP', date: '15 Oct 2026 · speech to FECCA', q: '“…get themselves down to the nearest Specsavers.”', hl: 'the nearest Specsavers.”', hlP: lin(t, tSpec - 0.3, 0.6), sub: 'Anthony Albanese · 15 Oct 2026', label: 'FACT', note: 'his words', src: 'AAP, 15 Oct 2026 (speech to FECCA)', fs: 44 });
    h += `<div class="abs" style="left:1500px;top:850px;opacity:${P(t, tSpec - 1.0, 0.3)}">${E.icon('mirror', { s: 90, color: '#ccc' })}</div><div class="abs" style="left:1620px;top:850px;transform:scale(${back(P(t, tSpec, 0.3))})">${E.icon('glasses', { s: 110, color: C.yellow, sw: 1.8 })}</div>`;
    h += E.photoCredit('albanese', 0.9);
    return h;
  });

  // ---------------- S40 ----------------
  sc('S40', (c) => {
    const { t } = c; const tCut = c.w('cut'), tBal = c.w('ballot'), tTar = c.w('target'), tFight = c.w('fighting'), tCopy = c.w('copying'), tTak = c.w('taking');
    c.sfx('click', tCut, -6); c.sfx('click', tBal, -6); c.sfx('click', tTar, -6); c.sfx('bass_impact', tFight, -6); c.sfx('type_thud', tCopy, -4); c.sfx('type_thud', tTak, -4); c.sfx('shimmer', tTak + 0.3, -8);
    let h = E.boardBg();
    const kin = P(t, tCopy - 0.4, 0.4);
    let g = `<div class="abs" style="left:958px;top:110px;width:4px;height:640px;background:#333"></div><div class="abs" style="left:160px;top:110px;font:900 40px Inter;letter-spacing:6px;color:${C.lab}">ACTIONS</div><div class="abs" style="left:1060px;top:110px;font:900 40px Inter;letter-spacing:6px;color:#ddd">WORDS</div>`;
    [['225,000 target', tTar, 'JUN 2026'], ['Working holiday ballot', tBal, '17 SEP 2026'], ['Visa tightening', tCut, 'JUL–SEP 2026']].forEach(([n, t0, d], i) => { g += E.node({ x: 470, y: 250 + i * 70 + (2 - i) * 70, w: 560, date: d, title: n, col: C.lab, label: 'FACT', p: t < t0 - 0.1 && i !== 2 ? 0 : (t < t0 - 0.1 ? 1 : P(t, t0 - 0.1, 0.35)), op: t < t0 - 0.1 ? 0.22 : 1, rot: (i - 1) * 1.5, fs: 26 }); });
    g += E.node({ x: 1440, y: 360, w: 600, date: '15 OCT 2026', title: 'Speech defending multiculturalism', col: C.lab, label: 'FACT', p: t < tFight ? 1 : P(t, tFight, 0.3), op: t < tFight ? 0.22 : 1, stampIn: t >= tFight, fs: 30 });
    if (t >= tFight) E.shake(t, tFight, 5);
    h += `<div class="abs full" style="opacity:${1 - kin * 0.75}">${g}</div>`;
    if (kin > 0) h += `<div class="abs" style="left:0;right:0;top:640px;text-align:center"><div style="font:900 104px Inter;color:#fff;-webkit-text-stroke:4px ${C.thread};paint-order:stroke fill;min-height:120px">${E.typeText('COPYING HER?', lin(t, tCopy, 0.5))}</div><div style="font:900 104px Inter;color:${C.yellow};-webkit-text-stroke:4px ${C.thread};paint-order:stroke fill;min-height:120px">${E.typeText('OR TAKING HER ISSUE?', lin(t, tTak, 0.7))}</div></div>`;
    return h;
  });

  // ---------------- S41 ----------------
  sc('S41', (c) => {
    const { t } = c; const tPat = c.w('pattern'), tBack = c.w('back'), tCount = c.w('counter'), tThats = c.w('That\'s');
    c.sfx('thunk', tThats, -4); c.sfx('tone', tBack, -8); c.sfx('thunk', c.w('That\'s', 2), -4); c.sfx('settle', tCount + 0.3, -6);
    let h = E.boardBg();
    const dip = P(t, tThats, 0.6, back) * (1 - P(t, c.w('That\'s', 2), 0.9, eio));
    const ang = -8 * dip;
    const gl = P(t, tThats - 0.5, 0.5), gr = P(t, tBack, 0.6);
    // top: mini board left (pattern) and grey/bars right (counter-pattern)
    h += `<div class="abs" style="left:150px;top:120px;width:640px;height:300px;opacity:${0.4 + 0.6 * gl}">
      <div class="abs" style="left:0;top:60px;width:640px;height:4px;background:${C.on}"></div><div class="abs" style="left:0;top:200px;width:640px;height:4px;background:${C.lab}"></div>
      ${[[120, '+0'], [430, '+3']].map(([x, g]) => `<div class="abs" style="left:${x}px;top:62px;width:6px;height:140px;background:${C.thread};box-shadow:0 0 ${gl * 20}px ${C.thread}"></div><div class="abs" style="left:${x - 30}px;top:110px;background:#fff;color:#111;font:900 20px Inter;padding:4px 10px;border-radius:20px">${g} DAYS</div>`).join('')}
      <div class="abs" style="left:0;top:250px;font:800 22px Inter;color:#ccc;letter-spacing:2px">ONE NATION MOVED · LABOR MOVED AFTER</div></div>`;
    h += `<div class="abs" style="left:1130px;top:120px;width:640px;height:300px;opacity:${0.4 + 0.6 * gr}">
      <div class="abs" style="left:0;top:20px;width:240px;height:110px;border:2px dashed #999;background:rgba(138,138,138,${0.1 + 0.2 * gr});box-shadow:0 0 ${gr * 30}px rgba(255,255,255,.3)"><div style="font:900 50px Inter;color:#bbb;padding:10px 16px">2023</div></div>
      ${[[C.lab, 225], [C.coal, 100]].map(([col, v], i) => `<div class="abs" style="left:${320 + i * 110}px;top:${200 - v * 0.6}px;width:80px;height:${v * 0.6}px;background:${col}"></div>`).join('')}<div class="abs" style="left:540px;top:200px;width:80px;height:40px;background:${C.on};opacity:.8"></div><div class="abs" style="left:300px;top:200px;width:340px;height:2px;background:#bbb"></div>
      <div class="abs" style="left:0;top:250px;font:800 22px Inter;color:#ccc;letter-spacing:2px">CUTS FROM 2023 · TARGETS FAR HIGHER</div></div>`;
    // balance scale
    const cx = 960, cy = 560, L = 520;
    const ex = Math.cos(ang * Math.PI / 180) * L, ey = Math.sin(ang * Math.PI / 180) * L;
    const lx = cx - ex, ly = cy - ey, rx = cx + ex, ry = cy + ey;
    h += `<svg class="abs full" viewBox="0 0 1920 1080"><path d="M${cx} ${cy} L${cx} 960 M${cx - 120} 960 L${cx + 120} 960" stroke="#bbb" stroke-width="10" stroke-linecap="round"/><path d="M${cx} ${cy - 30} L${cx - 26} ${cy + 20} L${cx + 26} ${cy + 20} Z" fill="#bbb"/>
      <line x1="${lx}" y1="${ly}" x2="${rx}" y2="${ry}" stroke="#ddd" stroke-width="12" stroke-linecap="round"/>
      ${[[lx, ly], [rx, ry]].map(([x, y]) => `<path d="M${x} ${y} L${x - 150} ${y + 190} M${x} ${y} L${x + 150} ${y + 190}" stroke="#999" stroke-width="3"/><path d="M${x - 180} ${y + 190} L${x + 180} ${y + 190} Q${x} ${y + 260} ${x - 180} ${y + 190} Z" fill="#2a2a2a" stroke="#bbb" stroke-width="3"/>`).join('')}</svg>`;
    h += `<div class="abs" style="left:${lx - 200}px;top:${ly + 110}px;width:400px;text-align:center;opacity:${gl}"><div style="font:900 50px Inter;color:${C.on};text-shadow:0 0 ${gl * 30}px ${C.on}">PATTERN</div><div style="margin-top:4px">${E.tag('FACT', { inline: true, note: 'dates', s: 0.8 })}</div></div>`;
    h += `<div class="abs" style="left:${rx - 220}px;top:${ry + 110}px;width:440px;text-align:center;opacity:${P(t, tCount - 0.4, 0.4)}"><div style="font:900 46px Inter;color:#e0e0e0;text-shadow:0 0 30px rgba(255,255,255,.4)">COUNTER-PATTERN</div><div style="margin-top:4px">${E.tag('FACT', { inline: true, s: 0.8 })}</div></div>`;
    return h;
  });

  // ---------------- S42 ----------------
  sc('S42', (c) => {
    const { t } = c; const tIs = c.w('Is'), tLand = c.w('land'), tHous = c.w('housing'), tPol = c.w('politics'), tEvery = c.w('every');
    c.sfx('bass_impact', tIs, -2); c.sfx('stamp', tLand + 0.2, -3); c.sfx('stamp', tHous + 0.2, -3); c.sfx('stamp', tPol + 0.2, -3); c.sfx('click', tEvery, -4);
    let h = E.boardBg();
    const fly = P(t, tEvery, 0.7, eio);
    if (t >= tEvery) E.S.hideCounter = true;
    h += E.ausMap({ x: 960 - 470, y: 120, s: 0.94, op: 0.35, fill: 'rgba(255,255,255,.03)', stroke: 'rgba(255,255,255,.4)' });
    h += E.cityLights(t, c.start, { x: 960 - 470, y: 120, s: 0.94, glow: 0.3 });
    const tp = P(t, tIs - 0.1, 0.5, back);
    h += `<div class="abs" style="left:0;right:0;top:${lerp(380, 120, P(t, tLand - 0.2, 0.5, eio))}px;text-align:center;font:900 ${lerp(140, 90, P(t, tLand - 0.2, 0.5, eio))}px Inter;color:#fff;letter-spacing:2px;text-shadow:0 6px 40px #000;transform:scale(${tp});opacity:${1 - fly * 0.6}">IS AUSTRALIA FULL?</div>`;
    const st = [['BY LAND: NO', '≈3.6 people per km²', 'ANALYSIS', tLand + 0.2], ['BY HOUSING: MANY FEEL YES', '', 'ANALYSIS', tHous + 0.2], ['BY POLITICS: EVERY PARTY IS SLOWING IT', '', 'FACT', tPol + 0.2]];
    let g = '';
    st.forEach(([a, b, lab, t0], i) => { g += E.stamp(t, t0, a, { x: 960, y: 330 + i * 170, fs: 52, rot: (i - 1) * 3, sub: b || undefined, color: i === 2 ? '#fff' : C.yellow, bg: 'rgba(18,18,18,.88)', amp: 4 }); if (t >= t0) g += E.tag(lab, { x: 1450, y: 300 + i * 170, s: 0.9 }); });
    h += `<div class="abs full" style="opacity:${1 - fly * 0.85}">${g}</div>`;
    if (fly > 0) {
      const n = Math.floor(c.tView / 108); RT.payoff = n;
      const x = lerp(1760, 960, fly), y = lerp(75, 560, fly), s = lerp(0.3, 1, fly);
      h += `<div class="abs full" style="background:rgba(10,10,10,${0.6 * fly})"></div><div class="abs" style="left:${x}px;top:${y}px;transform:translate(-50%,-50%) scale(${s});text-align:center">
        <div style="font:900 200px/1 Inter;color:#fff;text-shadow:0 0 50px rgba(255,255,255,.5)">800<span style="font-size:90px;font-weight:700"> / DAY</span></div>
        <div style="font:800 46px Inter;color:#ddd;letter-spacing:3px;margin-top:22px">SINCE YOU STARTED WATCHING: <span style="color:#fff;font-size:70px">+${n}</span></div>
        <div style="font:500 26px Inter;color:#aaa;margin-top:10px">net arrivals at 800 a day · +1 every 1m 48s (our calculation)</div></div>`;
      h += E.tag('ANALYSIS', { x: 860, y: 790, note: 'our calculation', op: fly });
    }
    return h;
  });

  // ---------------- S43 (quiet moment) ----------------
  sc('S43', (c) => {
    const { t } = c; const tToday = c.w('Today'), tMay2 = c.w('Maybe', 2), tSet = c.w('setting'), tMay1 = c.w('Maybe');
    E.S.hideCounter = true;
    let h = E.boardBg();
    const lt = t - c.start;
    // left: 1996 (Hansard date card, sepia) ; right: three 2026 photos
    h += `<div class="abs full" style="opacity:${P(t, c.start, 1.2, eio)};filter:sepia(.7);transform:translateY(${-lt * 1.5}px)">${E.card(t, { x: 380, y: 280, w: 540, outlet: 'Hansard · House of Representatives', date: '10 Sep 1996', head: 'Pauline Hanson’s first speech', sub: 'Thirty years ago: treated as the outsider of Australian politics', fs: 40 })}</div>`;
    h += `<div class="abs" style="left:120px;top:150px;font:900 60px Inter;color:#c9b99a;opacity:${P(t, c.start + 0.4, 1)}">1996</div>`;
    const keys = [['albanese', 'Prime Minister'], ['taylor', 'Opposition Leader'], ['hanson', 'One Nation']];
    keys.forEach(([k, role], i) => { h += E.photo(k, t, { x: 1080 + i * 300, y: 520, w: 240, h: 300, rot: (i - 1) * 2, role, move: { type: 'fade', t0: tToday - 0.3 + i * 0.5, d: 1.2 } }); });
    h += `<div class="abs" style="left:940px;top:220px;font:900 60px Inter;color:#fff;opacity:${P(t, tToday, 1)}">2026</div>`;
    // the thread runs slowly from 1996 to the 2026 row
    h += E.thread([[390, 470], [800, 700], [1080, 360], [1380, 360], [1680, 360]], P(t, tToday - 0.5, 6.0, eio), { sag: 0.06 });
    // SPECULATION cards
    const sp = (txt, t0, x) => `<div class="abs" style="left:${x}px;top:850px;opacity:${P(t, t0, 1.5, eio)};border:3px dashed #9a9a9a;background:rgba(30,30,30,.85);padding:16px 26px;font:800 34px Inter;color:#ddd;letter-spacing:3px">${txt}<div style="margin-top:8px">${E.tag('SPECULATION', { inline: true, s: 0.75 })}</div></div>`;
    h += sp('AUSTRALIA CHANGED', tMay2, 360) + sp('SETTING THE AGENDA', tSet, 1060);
    h += E.credit('Photos: David Foote (AUSPIC/DPS) via DFAT · CC BY 4.0 / DCCEEW · CC BY 4.0 / jfish92 · CC0');
    return E.wrap(h, { s: 1 + lt * 0.003 });
  });

  // ---------------- S44 + END: thumbnail composition ----------------
  function thumbScene(t, t0, o = {}) {
    const lt = t - t0;
    let h = '';
    // Parliament House, graded to a red-orange sunset, along the bottom
    h += `<div class="abs" style="left:0;top:560px;width:1920px;height:520px;overflow:hidden">${E.clip('BR_STOCK_parliament_house_canberra', t, t0, { dur: 15, z0: 1.15, z1: 1.25, y0: -60, y1: -80, filter: 'sepia(.6) saturate(2.4) hue-rotate(-25deg) brightness(.75) contrast(1.15)' })}<div class="abs full" style="background:linear-gradient(180deg,#121212 0%,rgba(18,18,18,.2) 35%,rgba(120,30,10,.25) 100%)"></div></div>`;
    // cracked dark map with glowing counter
    const mp = o.p == null ? 1 : o.p;
    h += E.ausMap({ x: 960 - 330, y: 90, s: 0.66, op: mp, fill: '#1c1c1c', stroke: 'rgba(255,255,255,.5)', sw: 2 });
    h += `<svg class="abs" style="left:630px;top:90px" width="660" height="600" viewBox="0 0 660 600" opacity="${0.5 * mp}"><path d="M120 180 L240 260 L300 240 L380 330 L470 300 M300 240 L330 120 M380 330 L360 450 L420 520" stroke="#000" stroke-width="3" fill="none"/></svg>`;
    h += `<div class="abs" style="left:960px;top:340px;transform:translate(-50%,-50%);font:900 76px Inter;color:#ff3b30;text-shadow:0 0 30px #ff3b30,0 0 60px #ff3b30;opacity:${mp};letter-spacing:2px">800 / DAY</div>`;
    // four pinned polaroids linked by red string
    const pol = [[E.clipSrc('BR_STOCK_airport_arrivals_board', t, t0), 640, 160, -6], ['/stills/BR_STOCK_house_sold_sign.jpg', 1280, 170, 5], [E.clipSrc('BR_STOCK_apartment_cranes', t, t0, { offset: 3 }), 650, 520, 4], [E.clipSrc('BR_STOCK_university_campus_aerial', t, t0), 1270, 530, -5]];
    pol.forEach(([src, x, y, r], i) => { h += E.photo(src, t, { x, y, w: 170, h: 120, rot: r, caption: false, pad: 8, move: { type: 'drop', t0: t0 + 0.2 + i * 0.15 }, fy: i === 1 ? 78 : 50 }); });
    h += E.thread([[640, 160], [1280, 170], [1270, 530], [650, 520], [640, 160]], P(t, t0 + 0.8, 1.0, eio), { sag: 0.05, knots: false, w: 3 });
    // portraits
    h += E.photo('albanese', t, { x: 290, y: 520, w: 400, h: 520, rot: -3, caption: false, move: { type: 'splitL', t0 } });
    h += E.photo('hanson', t, { x: 1630, y: 520, w: 400, h: 520, rot: 3, caption: false, move: { type: 'splitR', t0 } });
    return h;
  }
  sc('S44', (c) => {
    const { t } = c; const tNow = c.w('now'), tOut = c.w('outmaneuvering'), tTell = c.w('Tell');
    c.sfx('swell', c.start, -6); c.sfx('shimmer', tOut, -6); c.sfx('pop', tTell, -4);
    let h = E.boardBg();
    h += thumbScene(t, c.start, { p: P(t, c.start, 0.8) });
    const glow = P(t, tOut, 0.5);
    h += `<div class="abs" style="left:0;right:0;top:${730}px;text-align:center;opacity:${P(t, tNow, 0.5)}">
      <div style="font:900 96px/1 Inter;color:#fff;-webkit-text-stroke:5px ${C.thread};paint-order:stroke fill;text-shadow:0 7px 0 ${C.thread},0 12px 30px #000">IS ALBANESE</div>
      <div style="font:900 112px/1.08 Inter;color:${C.yellow};-webkit-text-stroke:6px ${C.thread};paint-order:stroke fill;text-shadow:0 8px 0 ${C.thread},0 0 ${glow * 50}px ${C.yellow}">COPYING HANSON?</div></div>`;
    const bp = P(t, tTell, 0.35, back);
    h += `<div class="abs" style="left:780px;top:640px;transform:scale(${bp});transform-origin:0 50%;display:flex;align-items:center;gap:14px;background:rgba(18,18,18,.85);padding:12px 20px;border:2px solid #fff">${E.icon('chat', { s: 54, color: C.yellow, fill: false, sw: 2 })}<span style="font:900 30px Inter;color:#fff">IS AUSTRALIA FULL?</span></div>`;
    h += E.credit('Photos: DFAT · CC BY 4.0 / jfish92 · CC0 · Footage: Jared Drennan · CC BY 3.0', 0.8);
    return h;
  });
  sc('END', (c) => {
    const { t } = c; const p = P(t, c.start, 0.8, eio);
    let h = E.boardBg();
    h += `<div class="abs full" style="filter:blur(${8 * p}px) brightness(${1 - 0.55 * p})">${thumbScene(t, c.start - 10.7)}</div>`;
    const slot = (x, y, title) => `<div class="abs" style="left:${x}px;top:${y}px;width:720px;height:405px;border:4px solid #fff;background:rgba(18,18,18,.55);opacity:${p};box-shadow:0 20px 50px rgba(0,0,0,.6)"><div style="position:absolute;left:0;right:0;bottom:-70px;text-align:center;font:800 32px Inter;color:#fff">${title}</div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:900 90px Inter;color:rgba(255,255,255,.25)">▶</div></div>`;
    h += slot(150, 200, 'Can Albanese Stop Pauline Hanson?') + slot(1050, 200, 'The Pauline Hanson Story');
    h += `<div class="abs" style="left:50%;top:780px;transform:translateX(-50%) scale(${back(P(t, c.start + 0.5, 0.4))});background:${C.thread};color:#fff;font:900 40px Inter;letter-spacing:3px;padding:20px 60px;border-radius:8px">SUBSCRIBE</div>`;
    h += `<div class="abs" style="left:0;right:0;top:930px;text-align:center;font:500 22px Inter;color:#bbb;opacity:${P(t, c.start + 1, 0.6)}">Sources and media credits are in the description. Some background scenes are AI-generated reconstructions. No real person has been AI-generated or altered.</div>`;
    return h;
  });
})();
