/* lf09 long-form engine: HTML/SVG per frame, driven by film time t. No CSS animation; every value is a pure function of t. */
(function () {
  const W = 1920, H = 1080, FPS = 30;
  const C = {
    bg: '#121212', paper: '#F4EFE6', on: '#F28C28', lab: '#D62828', coal: '#1F4E9E', grn: '#2E9E4F',
    gold: '#D4A017', thread: '#C0161E', grey: '#8A8A8A', yellow: '#FFD60A', ink: '#1b1b1b', blue: '#3B7DD8',
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const eio = (t) => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const back = (t) => { t = clamp(t, 0, 1); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const P = (t, t0, d, ease = eo) => ease(clamp((t - t0) / (d || 0.0001), 0, 1));
  const lin = (t, t0, d) => clamp((t - t0) / (d || 0.0001), 0, 1);
  const vis = (t, t0, t1) => t >= t0 && (t1 == null || t < t1);
  const fade = (t, t0, t1, fi = 0.25, fo = 0.25) => clamp(Math.min((t - t0) / fi, t1 == null ? 1 : (t1 - t) / fo), 0, 1);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const hash = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
  const fmt = (n) => Math.round(n).toLocaleString('en-AU');

  // ---------- frame state (camera shake etc.) ----------
  const S = { shakeX: 0, shakeY: 0, t: 0, hideCounter: false };
  function shake(t, t0, amp = 4, dur = 0.28) {
    if (t < t0 || t > t0 + dur) return;
    const k = 1 - (t - t0) / dur, f = Math.floor((t - t0) * FPS);
    S.shakeX += (hash(f + t0 * 7) - 0.5) * 2 * amp * k; S.shakeY += (hash(f * 3 + t0) - 0.5) * 2 * amp * k;
  }

  // ---------- media ----------
  let CLIPN = {};
  function clipSrc(id, t, t0, o = {}) {
    const n = CLIPN[id] || 1; const speed = o.speed || 1; const off = o.offset || 0;
    let f = Math.floor((off + Math.max(0, t - t0) * speed) * FPS);
    // ping-pong instead of freezing if the clip is shorter than the shot
    const per = 2 * (n - 1); f = per > 0 ? f % per : 0; if (f >= n) f = per - f;
    return `/clips/${id}/${String(f + 1).padStart(5, '0')}.jpg`;
  }
  // full-bleed moving footage with a slow push
  function clip(id, t, t0, o = {}) {
    const d = o.dur || 6, p = lin(t, t0, d);
    const z = lerp(o.z0 || 1.04, o.z1 || 1.12, p);
    const x = lerp(o.x0 || 0, o.x1 || 0, p), y = lerp(o.y0 || 0, o.y1 || 0, p);
    const op = o.opacity == null ? 1 : o.opacity;
    const filt = o.filter ? `filter:${o.filter};` : '';
    return `<div class="abs full" style="opacity:${op};overflow:hidden;${o.clip ? 'clip-path:' + o.clip + ';' : ''}">
      <img src="${clipSrc(id, t, t0, o)}" class="abs full cover" style="transform:translate(${x}px,${y}px) scale(${z});${filt}"/></div>`;
  }
  function still(src, t, t0, o = {}) {
    const d = o.dur || 6, p = lin(t, t0, d);
    const z = lerp(o.z0 || 1.04, o.z1 || 1.14, p), x = lerp(o.x0 || 0, o.x1 || 0, p), y = lerp(o.y0 || 0, o.y1 || 0, p);
    return `<div class="abs full" style="opacity:${o.opacity == null ? 1 : o.opacity};overflow:hidden"><img src="${src}" class="abs full cover" style="object-position:${o.pos || '50% 50%'};transform:translate(${x}px,${y}px) scale(${z});${o.filter ? 'filter:' + o.filter : ''}"/></div>`;
  }
  const dim = (a) => `<div class="abs full" style="background:rgba(10,10,10,${a})"></div>`;
  const grad = (css) => `<div class="abs full" style="background:${css}"></div>`;

  // ---------- photos ----------
  const PH = {
    albanese: { src: 'IMG_albanese_dfat', fx: 50, fy: 22, name: 'Anthony Albanese', role: 'Prime Minister', year: 'official portrait', credit: 'Photo: David Foote (AUSPIC/DPS) via DFAT · CC BY 4.0' },
    hanson: { src: 'IMG_hanson_cc0', fx: 58, fy: 30, name: 'Pauline Hanson', role: 'One Nation leader', year: '2016', credit: 'Photo: jfish92 · CC0' },
    burke: { src: 'IMG_burke', fx: 48, fy: 28, name: 'Tony Burke', role: 'Home Affairs Minister', year: '2025', credit: 'Photo: UK Home Office · CC BY 4.0' },
    taylor: { src: 'IMG_taylor', fx: 42, fy: 32, name: 'Angus Taylor', role: 'Opposition Leader', year: '2018', credit: 'Photo: DCCEEW · CC BY 4.0' },
    joyce: { src: 'IMG_joyce', fx: 50, fy: 30, name: 'Barnaby Joyce', role: 'One Nation MP', year: '2017', credit: 'Photo: David Foote, Australian Government · CC BY 3.0 AU' },
    dutton: { src: 'IMG_dutton', fx: 50, fy: 30, name: 'Peter Dutton', role: 'Opposition Leader, 2025', year: '2024', credit: 'Photo: Presidential Communications Office (PH) · Public domain' },
    oneil: { src: 'IMG_oneil', fx: 50, fy: 30, name: 'Clare O’Neil', role: 'Home Affairs Minister, 2023', year: '2023', credit: 'Photo: DFAT · CC BY 4.0' },
    watt: { src: 'IMG_watt', fx: 50, fy: 34, name: 'Murray Watt', role: 'Environment Minister', year: '2026', credit: 'Photo: Yu Chu Chin · CC BY-SA 4.0' },
    gorman: { src: 'IMG_gorman', fx: 50, fy: 38, name: 'Patrick Gorman', role: 'Labor', year: '2022', credit: 'Photo: Dept of the Prime Minister and Cabinet · CC BY 4.0' },
    haines: { src: 'IMG_haines', fx: 55, fy: 30, name: 'Helen Haines', role: 'Independent MP', year: '2022', credit: 'Photo: Alison Newman · CC0' },
    bragg: { src: 'IMG_bragg', fx: 50, fy: 30, name: 'Andrew Bragg', role: 'Shadow Housing Minister', year: 'official portrait', credit: 'Photo: David Foote (AUSPIC) · CC BY-SA 4.0' },
  };
  // polaroid photo card. o: x,y (centre), w, h (image area), rot, z (inner zoom), sepia, caption (bool), credit (bool), move {type,t0}
  function photo(key, t, o = {}) {
    const ph = PH[key] || { url: key, fx: o.fx || 50, fy: o.fy || 50, name: o.name || '', role: o.role || '', year: '' }; const w = o.w || 360, h = o.h || 440, pad = o.pad == null ? 14 : o.pad, capH = o.caption === false ? pad : 64;
    let x = o.x || 960, y = o.y || 540, rot = o.rot || 0, sc = 1, op = 1, shadow = 0.55;
    const m = o.move || {}; const t0 = m.t0 || 0;
    if (m.type === 'drop') { const p = P(t, t0, 0.32, back); sc = lerp(1.35, 1, p); op = P(t, t0, 0.12, eo); rot = lerp(rot - 9, rot, p); y = lerp(y - 50, y, p); }
    if (m.type === 'splitL') { const p = P(t, t0, 0.4, eo); x = lerp(-w, x, p); }
    if (m.type === 'splitR') { const p = P(t, t0, 0.4, eo); x = lerp(W + w, x, p); }
    if (m.type === 'fade') { op = P(t, t0, m.d || 0.6, eio); }
    if (m.type === 'rise') { const p = P(t, t0, 0.45, eo); y = lerp(y + 80, y, p); op = p; }
    if (m.out != null) op *= 1 - P(t, m.out, 0.3, eo);
    if (m.pinTo) { const p = P(t, m.pinTo.t0, 0.35, eio); x = lerp(x, m.pinTo.x, p); y = lerp(y, m.pinTo.y, p); sc *= lerp(1, m.pinTo.s, p); rot = lerp(rot, m.pinTo.rot || 0, p); }
    // continuous drift so no photo ever sits still
    const drift = o.still ? 0 : 1; const dt = t - t0;
    const iz = (o.z || 1.0) * (1 + 0.035 * drift * clamp(dt / 6, 0, 1.4));
    x += drift * Math.sin(dt * 0.5) * 3; y += drift * Math.cos(dt * 0.4) * 2;
    const filt = o.sepia ? `filter:sepia(${o.sepia}) contrast(1.05) brightness(0.95);` : '';
    const total = h + pad + capH;
    return `<div class="abs" style="left:${x - (w + 2 * pad) / 2}px;top:${y - total / 2}px;width:${w + 2 * pad}px;height:${total}px;opacity:${op};transform:rotate(${rot}deg) scale(${sc});transform-origin:50% 50%;">
      <div class="abs" style="inset:0;background:#f7f4ee;box-shadow:0 18px 40px rgba(0,0,0,${shadow}),0 2px 6px rgba(0,0,0,.4);"></div>
      <div class="abs" style="left:${pad}px;top:${pad}px;width:${w}px;height:${h}px;overflow:hidden;background:#222">
        <img src="${ph.url || '/photos/' + ph.src + '.jpg'}" class="abs cover" style="left:0;top:0;width:100%;height:100%;object-position:${ph.fx}% ${ph.fy}%;transform:scale(${iz});transform-origin:${ph.fx}% ${ph.fy}%;${filt}"/>
        <div class="abs" style="inset:0;box-shadow:inset 0 0 60px rgba(0,0,0,.35)"></div>
      </div>
      ${o.caption === false ? '' : `<div class="abs" style="left:${pad}px;right:${pad}px;top:${h + pad + 8}px;font:700 ${w > 300 ? 21 : 17}px Inter;color:#1b1b1b;letter-spacing:.2px;white-space:nowrap;overflow:hidden">${esc(o.name || ph.name)}</div>
      <div class="abs" style="left:${pad}px;right:${pad}px;top:${h + pad + 34}px;font:500 ${w > 300 ? 15 : 13}px Inter;color:#666;white-space:nowrap;overflow:hidden">${esc(o.role || ph.role)}${ph.year ? ' · ' + esc(ph.year) : ''}</div>`}
      ${o.knot ? knotAt((w + 2 * pad) / 2, 2, o.knot) : ''}
    </div>`;
  }
  const photoCredit = (key, op = 1) => credit(PH[key].credit, op);
  function credit(text, op = 1, side = 'right') {
    return `<div class="abs" style="${side}:28px;bottom:18px;font:500 14px Inter;color:rgba(255,255,255,.62);opacity:${op};text-shadow:0 1px 3px #000;letter-spacing:.3px">${esc(text)}</div>`;
  }
  // name card fallback (no silhouette, no drawn face)
  function nameCard(name, role, party, t, o = {}) {
    const col = { on: C.on, lab: C.lab, coal: C.coal, ind: '#7a7a7a' }[party] || C.grey;
    const p = o.t0 != null ? P(t, o.t0, 0.35, back) : 1;
    return `<div class="abs" style="left:${(o.x || 960) - 230}px;top:${(o.y || 540) - 80}px;width:460px;height:160px;background:#1d1d1d;border:1px solid #333;box-shadow:0 18px 40px rgba(0,0,0,.6);opacity:${clamp(p, 0, 1)};transform:scale(${lerp(0.85, 1, p)}) rotate(${o.rot || 0}deg)">
      <div class="abs" style="left:0;top:0;bottom:0;width:12px;background:${col}"></div>
      <div class="abs" style="left:40px;top:34px;font:800 40px Inter;color:#fff">${esc(name)}</div>
      <div class="abs" style="left:40px;top:94px;font:500 22px Inter;color:#9a9a9a">${esc(role)}</div></div>`;
  }

  // ---------- labels / tags ----------
  function tag(kind, o = {}) {
    const k = kind.toUpperCase(); const s = o.s || 1;
    const st = {
      FACT: 'background:#fff;color:#111;border:2px solid #fff;',
      CLAIM: `background:rgba(18,18,18,.85);color:${C.on};border:2px solid ${C.on};`,
      ANALYSIS: `background:${C.blue};color:#fff;border:2px solid ${C.blue};`,
      SPECULATION: 'background:rgba(30,30,30,.85);color:#bbb;border:2px dashed #9a9a9a;',
    }[k] || '';
    const pos = o.inline ? 'position:relative;display:inline-block;' : `position:absolute;${o.right != null ? 'right:' + o.right + 'px;' : 'left:' + (o.x || 0) + 'px;'}top:${o.y || 0}px;`;
    return `<div style="${pos}${st}font:800 ${15 * s}px Inter;letter-spacing:${1.6 * s}px;padding:${5 * s}px ${10 * s}px;border-radius:3px;opacity:${o.op == null ? 1 : o.op}">${k}${o.note ? `<span style="font-weight:500;letter-spacing:.2px;opacity:.85"> · ${esc(o.note)}</span>` : ''}</div>`;
  }

  // ---------- evidence card ----------
  // o: x,y,w, outlet, date, head (html allowed with {{hl}} marker), hl (text to highlight), hlP (0..1), label, src, t0 (entrance), sub
  function card(t, o) {
    const w = o.w || 820; const p = o.t0 != null ? P(t, o.t0, 0.32, back) : 1; const op = o.t0 != null ? P(t, o.t0, 0.15) : 1;
    let head = esc(o.head);
    if (o.hl) {
      const i = head.indexOf(esc(o.hl));
      if (i >= 0) {
        const hp = clamp(o.hlP || 0, 0, 1);
        head = head.slice(0, i) + `<span style="background:linear-gradient(90deg,rgba(255,214,10,.75) ${hp * 100}%,transparent ${hp * 100}%);padding:0 4px;margin:0 -4px;-webkit-box-decoration-break:clone;box-decoration-break:clone">${esc(o.hl)}</span>` + head.slice(i + esc(o.hl).length);
      }
    }
    const fs = o.fs || 40;
    const outOp = o.out != null ? 1 - P(t, o.out, 0.3) : 1;
    return `<div class="abs" style="left:${(o.x || 960) - w / 2}px;top:${o.y || 300}px;width:${w}px;opacity:${op * outOp};transform:translateY(${(1 - p) * 40}px) rotate(${o.rot || 0}deg) scale(${lerp(0.94, 1, p)});">
      <div style="background:${C.paper};padding:30px 36px 26px;box-shadow:0 22px 50px rgba(0,0,0,.6);position:relative;background-image:url(${TEX.paper});">
        <div style="font:700 16px Inter;letter-spacing:2.4px;color:#6b6257;font-variant:small-caps;text-transform:uppercase">${esc(o.outlet)}${o.date ? ' · ' + esc(o.date) : ''}</div>
        <div style="font:${o.quote ? 'italic ' : ''}600 ${fs}px/${1.22} 'Source Serif 4';color:#161616;margin-top:14px">${head}</div>
        ${o.sub ? `<div style="font:500 20px/1.35 Inter;color:#4b4540;margin-top:14px">${esc(o.sub)}</div>` : ''}
        ${o.src ? `<div style="font:500 15px/1.35 Inter;color:#7a7066;margin-top:16px;border-top:1px solid #d8d0c4;padding-top:10px">Source: ${esc(o.src)}</div>` : ''}
        ${o.label ? tag(o.label, { right: 18, y: 18, note: o.note }) : ''}
        <div style="position:absolute;left:28px;top:-26px;background:${C.paper};font:800 12px Inter;letter-spacing:2px;color:#8a7f72;padding:6px 12px 8px;border-radius:4px 4px 0 0;background-image:url(${TEX.paper})">SOURCE</div>
      </div></div>`;
  }
  // quote card (serif, exact words, speaker/source/date)
  function quote(t, o) {
    return card(t, Object.assign({}, o, { head: o.q, quote: true, fs: o.fs || 46 }));
  }
  function pollCard(t, o) {
    // o: pollster, when, rows [{party,val,col}], n, src, label FACT
    const rows = o.rows.map((r) => `<div style="display:flex;align-items:center;margin:6px 0"><div style="width:16px;height:16px;background:${r.col};margin-right:12px"></div><div style="font:600 30px 'Source Serif 4';color:#161616;flex:1">${esc(r.party)}</div><div style="font:800 34px Inter;color:#161616">${esc(r.val)}</div></div>`).join('');
    const w = o.w || 560; const p = o.t0 != null ? P(t, o.t0, 0.3, back) : 1;
    const outOp = o.out != null ? 1 - P(t, o.out, 0.3) : 1;
    return `<div class="abs" style="left:${o.x - w / 2}px;top:${o.y}px;width:${w}px;opacity:${clamp(P(t, o.t0 || -9, 0.12), 0, 1) * outOp};transform:translateY(${(1 - p) * -60}px) scale(${lerp(1.25, 1, p)}) rotate(${o.rot || 0}deg)">
      <div style="background:${C.paper};background-image:url(${TEX.paper});padding:26px 30px 20px;box-shadow:0 22px 50px rgba(0,0,0,.6);position:relative">
        <div style="font:800 22px Inter;letter-spacing:2.6px;color:#111">${esc(o.pollster)}</div>
        <div style="font:600 15px Inter;letter-spacing:1.2px;color:#6b6257;margin:4px 0 10px;text-transform:uppercase">${esc(o.when)}${o.n ? ' · ' + esc(o.n) : ''}</div>
        ${rows}
        <div style="font:italic 500 18px 'Source Serif 4';color:#5a524a;margin-top:12px">“One poll is a snapshot, not a verdict.”</div>
        <div style="font:500 13px/1.35 Inter;color:#7a7066;margin-top:8px;border-top:1px solid #d8d0c4;padding-top:8px">Source: ${esc(o.src)}</div>
        ${tag(o.label || 'FACT', { right: 16, y: 18, s: 0.85 })}
      </div></div>`;
  }

  // ---------- kinetic type / titles ----------
  function typeText(str, p) { const n = Math.floor(str.length * clamp(p, 0, 1) + 0.0001); return esc(str.slice(0, n)); }
  function title(t, text, o = {}) {
    const p = o.t0 != null ? lin(t, o.t0, o.d || 0.6) : 1;
    const s = o.type ? typeText(text, p) : esc(text);
    return `<div class="abs" style="left:0;right:0;top:${o.y || 470}px;text-align:center;font:900 ${o.fs || 96}px/${1.05} Inter;letter-spacing:${o.ls || -1}px;color:${o.color || '#fff'};${o.stroke ? `-webkit-text-stroke:${o.stroke};paint-order:stroke fill;` : ''}text-shadow:${o.shadow || '0 6px 30px rgba(0,0,0,.6)'};opacity:${o.op == null ? 1 : o.op};text-transform:uppercase">${s}</div>`;
  }
  function lowerThird(t, t0, name, role, o = {}) {
    const p = P(t, t0, 0.35), q = o.out != null ? 1 - P(t, o.out, 0.3) : 1;
    return `<div class="abs" style="left:${o.x || 90}px;top:${o.y || 880}px;opacity:${p * q};transform:translateX(${(1 - p) * -40}px)">
      <div style="display:flex;align-items:stretch"><div style="width:8px;background:${o.col || C.thread}"></div>
      <div style="background:rgba(14,14,14,.86);padding:14px 26px 14px 20px"><div style="font:800 34px Inter;color:#fff">${esc(name)}</div>
      <div style="font:500 22px Inter;color:#bdbdbd;margin-top:2px">${esc(role)}</div></div></div></div>`;
  }
  function aiLabel(t, t0, d = 2.4) {
    const op = fade(t, t0, t0 + d, 0.2, 0.3);
    return `<div class="abs" style="left:34px;bottom:30px;opacity:${op};font:600 16px Inter;letter-spacing:1.5px;color:#eee;background:rgba(0,0,0,.55);padding:6px 12px;border-left:3px solid #ddd">DRAMATISED RECONSTRUCTION · AI-GENERATED SCENE</div>`;
  }

  // ---------- number rolls ----------
  function odometer(v, o = {}) {
    // v may be fractional; renders digits with rolling columns
    const digits = o.digits || Math.max(1, String(Math.floor(Math.abs(o.max || v))).length);
    const h = o.h || 80; const fs = o.fs || h * 0.9; const col = o.color || '#fff';
    let html = ''; const sep = o.sep == null ? ',' : o.sep;
    for (let k = digits - 1; k >= 0; k--) {
      const pow = Math.pow(10, k); const q = v / pow; const base = Math.floor(q) % 10;
      let frac;
      if (k === 0) frac = q - Math.floor(q);
      else { const lower = v % pow; frac = clamp(lower - (pow - 1), 0, 1); }
      const pos = base + frac;
      let col_ = ''; for (let d = 0; d <= 10; d++) col_ += `<div style="height:${h}px;line-height:${h}px">${d % 10}</div>`;
      html += `<div style="display:inline-block;height:${h}px;overflow:hidden;vertical-align:top;width:${fs * 0.62}px;text-align:center"><div style="transform:translateY(${-pos * h}px)">${col_}</div></div>`;
      if (sep && k % 3 === 0 && k > 0) html += `<div style="display:inline-block;height:${h}px;line-height:${h}px;width:${fs * 0.28}px;text-align:center">${sep}</div>`;
    }
    return `<div style="display:inline-block;font:800 ${fs}px Inter;color:${col};font-variant-numeric:tabular-nums;${o.style || ''}">${html}</div>`;
  }
  function rollTo(t, t0, d, to, from = 0) { return lerp(from, to, P(t, t0, d, eio)); }

  // ---------- stamps ----------
  function stamp(t, t0, text, o = {}) {
    if (t < t0) return '';
    const p = P(t, t0, 0.2, eo); if (!o.noShake) shake(t, t0, o.amp || 4);
    const col = o.color || C.thread; const dashed = o.dashed ? 'dashed' : 'solid';
    const op = (o.out != null ? 1 - P(t, o.out, 0.3) : 1) * clamp(p * 1.4, 0, 1) * (o.op == null ? 1 : o.op);
    return `<div class="abs" style="left:${o.x || 960}px;top:${o.y || 540}px;transform:translate(-50%,-50%) rotate(${o.rot == null ? -8 : o.rot}deg) scale(${lerp(2.2, 1, p)});opacity:${op}">
      <div style="border:${o.bw || 6}px ${dashed} ${col};color:${col};font:900 ${o.fs || 64}px Inter;letter-spacing:${o.ls || 4}px;padding:${o.pad || '10px 26px'};white-space:nowrap;background:${o.bg || 'rgba(0,0,0,0)'};text-align:center;line-height:1.1;mix-blend-mode:${o.blend || 'normal'};box-shadow:${o.glow ? '0 0 30px ' + col : 'none'}">${o.html ? text : esc(text)}${o.sub ? `<div style="font:700 ${(o.fs || 64) * 0.32}px Inter;letter-spacing:2px;margin-top:4px">${esc(o.sub)}</div>` : ''}</div></div>`;
  }

  // ---------- split-flap ----------
  const FLAPCH = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·-+';
  function splitFlap(t, t0, from, to, o = {}) {
    const n = Math.max(from.length, to.length); const cw = o.cw || 64, ch = o.ch || 92; const dur = o.d || 0.9;
    let cells = '';
    for (let i = 0; i < n; i++) {
      const a = (from[i] || ' '), b = (to[i] || ' ');
      const local = clamp((t - t0 - i * 0.05) / dur, 0, 1);
      let c = local >= 1 || t < t0 ? (t < t0 ? a : b) : FLAPCH[Math.floor(hash(i * 31 + Math.floor((t - t0) * 24)) * FLAPCH.length)];
      if (a === b) c = b;
      const flip = local > 0 && local < 1 && a !== b ? Math.abs(Math.sin((t - t0) * 24 * Math.PI)) : 1;
      cells += `<div style="position:relative;display:inline-block;width:${cw}px;height:${ch}px;margin:0 3px;background:#1c1c1c;border-radius:6px;box-shadow:inset 0 0 0 1px #333,0 6px 14px rgba(0,0,0,.5);overflow:hidden">
        <div style="position:absolute;inset:0;font:800 ${ch * 0.7}px/${ch}px Inter;color:#f2f2f2;text-align:center;transform:scaleY(${0.35 + 0.65 * flip})">${esc(c)}</div>
        <div style="position:absolute;left:0;right:0;top:${ch / 2 - 1}px;height:2px;background:#0b0b0b"></div></div>`;
    }
    return `<div class="abs" style="left:${o.x || 960}px;top:${o.y || 540}px;transform:translate(-50%,-50%) scale(${o.s || 1});white-space:nowrap;opacity:${o.op == null ? 1 : o.op}">${cells}</div>`;
  }

  // ---------- red thread ----------
  function threadPath(pts, sag = 0.12) {
    let d = `M${pts[0][0]},${pts[0][1]}`; let len = 0;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const dx = x1 - x0, dy = y1 - y0; const L = Math.hypot(dx, dy);
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + L * sag; d += ` Q${cx},${cy} ${x1},${y1}`; len += L * (1 + sag * sag * 2.6);
    }
    return { d, len };
  }
  function thread(pts, p = 1, o = {}) {
    if (p <= 0) return '';
    const { d, len } = threadPath(pts, o.sag == null ? 0.08 : o.sag);
    const col = o.color || C.thread; const sw = o.w || 4;
    const knots = (o.knots === false || p < 0.999) ? '' : pts.filter((_, i) => i > 0 || o.knotStart).map(([x, y]) => `<g transform="translate(${x},${y})"><circle r="7" fill="${col}"/><path d="M-9,-6 L9,6 M-9,6 L9,-6" stroke="${col}" stroke-width="3"/></g>`).join('');
    return `<svg class="abs full" viewBox="0 0 ${W} ${H}" style="overflow:visible;opacity:${o.op == null ? 1 : o.op}"><path d="${d}" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="${sw + 2}" transform="translate(2,4)" stroke-dasharray="${len}" stroke-dashoffset="${len * (1 - p)}"/>
      <path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${len}" stroke-dashoffset="${len * (1 - p)}" ${o.glow ? `style="filter:drop-shadow(0 0 ${o.glow}px ${col})"` : ''}/>${knots}</svg>`;
  }
  function knotAt(x, y, col) { return `<svg class="abs" style="left:${x - 14}px;top:${y - 14}px;overflow:visible" width="28" height="28"><circle cx="14" cy="14" r="7" fill="${col === true ? C.thread : col}"/><path d="M5,8 L23,20 M5,20 L23,8" stroke="${col === true ? C.thread : col}" stroke-width="3"/></svg>`; }

  // ---------- icons (simple line icons, 24 grid) ----------
  const IC = {
    plane: 'M2 16 L22 9 L20 7 L13 9 L7 3 L5 4 L9 10 L4 12 L2 10 L1 11 Z',
    planeDep: 'M2 19 H22 M3 14 L21 7 L19.5 5 L13 7.5 L7 3 L5 4 L9 9 L4.5 11 L2.5 9.5 L1.5 10.5 Z',
    planeArr: 'M2 19 H22 M4 6 L21 13 L21 15.5 L14 13.5 L10 19 L8 18.5 L10 12.5 L5 11 L3.5 13 L2.5 12.5 Z',
    house: 'M3 11 L12 3 L21 11 M5 9.5 V21 H19 V9.5 M10 21 V14 H14 V21',
    crane: 'M6 22 V3 H20 M6 3 L3 6 M6 6 H20 M17 6 V12 M15 12 H19 V15 H15 Z M3 22 H10',
    cap: 'M2 9 L12 4 L22 9 L12 14 Z M6 11 V16 C9 19 15 19 18 16 V11 M22 9 V15',
    coffee: 'M4 9 H16 V15 C16 18 14 20 11 20 H9 C6 20 4 18 4 15 Z M16 11 H18 C20 11 20 15 18 15 H16 M8 3 C7 5 9 5 8 7 M12 3 C11 5 13 5 12 7',
    calendar: 'M4 6 H20 V21 H4 Z M4 10 H20 M8 3 V8 M16 3 V8',
    padlock: 'M6 11 H18 V21 H6 Z M8.5 11 V7.5 C8.5 3.5 15.5 3.5 15.5 7.5 V11 M12 15 V17',
    ticket: 'M3 7 H21 V10 C19.5 10 19.5 14 21 14 V17 H3 V14 C4.5 14 4.5 10 3 10 Z M9 7 V17',
    receipt: 'M5 3 H19 V21 L17 19.5 L15 21 L13 19.5 L11 21 L9 19.5 L7 21 L5 19.5 Z M8 8 H16 M8 12 H16 M8 16 H13',
    hospital: 'M4 21 V5 H20 V21 Z M12 8 V14 M9 11 H15 M10 21 V17 H14 V21',
    coin: 'M12 3 A9 9 0 1 0 12.01 3 Z M12 7 V17 M9.5 9.5 C9.5 8 14.5 8 14.5 10 C14.5 12 9.5 12 9.5 14 C9.5 16 14.5 16 14.5 14.5',
    backpack: 'M7 8 C7 5 17 5 17 8 V20 H7 Z M10 5 V3.5 H14 V5 M7 13 H17 M10 13 V15 H14 V13',
    suitcase: 'M4 8 H20 V20 H4 Z M9 8 V5 H15 V8 M8 8 V20 M16 8 V20',
    glasses: 'M2 12 C2 9 9 9 9 12 C9 15.5 2 15.5 2 12 Z M15 12 C15 9 22 9 22 12 C22 15.5 15 15.5 15 12 Z M9 12 C10.5 10.8 13.5 10.8 15 12 M2 11 L1 8 M22 11 L23 8',
    mirror: 'M3 7 H21 V14 H3 Z M12 14 V20 M9 20 H15',
    chat: 'M3 5 H21 V15 H10 L5 19 V15 H3 Z',
    ballot: 'M4 10 H20 V21 H4 Z M7 10 L9 3 H15 L17 10 M10 6 H14',
    clock: 'M12 3 A9 9 0 1 0 12.01 3 Z M12 7 V12 L15 14',
    ship: 'M3 15 H21 L18 20 H6 Z M6 15 V10 H18 V15 M10 10 V6 H14 V10',
    gauge: 'M3 17 A9 9 0 0 1 21 17 M12 17 L16 10',
    quotes: 'M4 18 V12 C4 8 6 6 9 5.5 M4 12 H9 V18 H4 M13 18 V12 C13 8 15 6 18 5.5 M13 12 H18 V18 H13',
    hash: 'M9 3 L7 21 M17 3 L15 21 M4 9 H21 M3 15 H20',
    pin: 'M12 22 C12 22 5 14 5 9 A7 7 0 0 1 19 9 C19 14 12 22 12 22 Z M12 7 A2 2 0 1 0 12.01 7',
    chartDip: 'M3 20 H21 M4 8 L9 11 L13 9 L20 17 M20 17 V13 M20 17 H16',
    tree: 'M12 21 V13 M12 13 C6 13 5 9 7 7 C7 3 13 2 14 5 C18 4 20 9 17 11 C16 13 13 13 12 13 M9 9 A.6 .6 0 1 0 9.01 9 M15 8 A.6 .6 0 1 0 15.01 8',
    beer: 'M6 6 H16 V20 H6 Z M16 9 H19 V16 H16 M6 9 H16 M8 3 C9 4 11 4 12 3 C13 4 15 4 16 3',
    bed: 'M3 19 V7 M3 13 H21 V19 M3 16 H21 M6 13 V10 H11 V13',
    peak: 'M3 20 L10 6 L14 13 L16 10 L21 20 Z',
    arrowDown: 'M12 4 V20 M6 14 L12 20 L18 14',
    raffle: 'M12 3 A8 8 0 1 0 12.01 3 Z M12 3 V19 M4 11 H20 M6.3 5.3 L17.7 16.7 M17.7 5.3 L6.3 16.7 M12 19 V22 M8 22 H16',
    family: 'M3 9 H10 V19 H3 Z M5 9 V7 H8 V9 M13 11 H18 V19 H13 Z M14.5 11 V9.5 H16.5 V11 M19 14 H22 V19 H19 Z',
    swatch: 'M4 4 H20 V20 H4 Z',
    export: 'M3 15 H21 L18 20 H6 Z M6 15 V10 H18 V15 M8 7 L12 4 L16 7 L12 9 Z',
    people3: 'M5 21 V17 M12 21 V17 M19 21 V17',
    scale: 'M12 3 V21 M7 21 H17 M4 7 H20 M4 7 L1 14 H7 Z M20 7 L17 14 H23 Z',
  };
  function icon(name, o = {}) {
    const s = o.s || 64; const col = o.color || '#fff'; const sw = o.sw || 1.7;
    const fill = o.fill ? col : 'none';
    return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="${o.style || ''}"><path d="${IC[name]}" fill="${fill}" stroke="${col}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  }
  function iconAt(name, x, y, o = {}) { const s = o.s || 64; return `<div class="abs" style="left:${x - s / 2}px;top:${y - s / 2}px;opacity:${o.op == null ? 1 : o.op};transform:scale(${o.sc == null ? 1 : o.sc}) rotate(${o.rot || 0}deg)">${icon(name, o)}</div>`; }

  // ---------- map ----------
  let GEO = null;
  const STATES = ['Western Australia', 'Northern Territory', 'South Australia', 'Queensland', 'New South Wales', 'Victoria', 'Tasmania', 'Australian Capital Territory', 'Jervis Bay Territory'];
  function ausMap(o = {}) {
    // o: x,y (top-left), s (scale; base width 1000), fill, stroke, hi {state:color}, op, cities [{name, glow}], borders
    const s = o.s || 0.8; const fill = o.fill || 'rgba(255,255,255,.06)'; const stroke = o.stroke || 'rgba(255,255,255,.55)';
    let paths = '';
    for (const st of STATES) {
      const d = GEO[st]; if (!d) continue;
      const f = (o.hi && o.hi[st]) || fill;
      paths += `<path d="${d}" fill="${f}" stroke="${o.borders === false ? f : stroke}" stroke-width="${(o.sw || 1.4) / s}" stroke-linejoin="round"/>`;
    }
    if (o.outline) { // heavier outer outline: draw all paths again with thick stroke behind
      let back = ''; for (const st of STATES) if (GEO[st]) back += `<path d="${GEO[st]}" fill="none" stroke="${o.outline}" stroke-width="${(o.osw || 4) / s}" stroke-linejoin="round"/>`;
      paths = back + paths;
    }
    let extra = o.extra || '';
    return `<svg class="abs" style="left:${o.x || 0}px;top:${o.y || 0}px;overflow:visible;opacity:${o.op == null ? 1 : o.op}" width="${GEO._size[0] * s}" height="${GEO._size[1] * s}" viewBox="0 0 ${GEO._size[0]} ${GEO._size[1]}">${o.filter || ''}<g ${o.gfilter ? `filter="${o.gfilter}"` : ''}>${paths}</g>${extra}</svg>`;
  }
  const city = (n) => GEO._cities[n];

  // ---------- 800/DAY counter ----------
  function counter800(tView, o = {}) {
    const n = Math.floor(tView / 108);
    const since = tView - n * 108; const pulse = since < 0.6 && n > 0 ? 1 - since / 0.6 : 0;
    const op = o.op == null ? 0.6 : o.op;
    return `<div class="abs" style="right:34px;top:28px;opacity:${op};text-align:right;transform:scale(${1 + pulse * 0.08});transform-origin:100% 0">
      <div style="font:900 40px Inter;color:#fff;letter-spacing:1px;text-shadow:0 0 ${8 + pulse * 20}px rgba(255,255,255,${0.2 + pulse * 0.5})">800 <span style="font-weight:600;font-size:24px;color:#ddd">/ DAY</span></div>
      <div style="font:600 13px Inter;letter-spacing:1.4px;color:#ddd;margin-top:2px">SINCE YOU STARTED WATCHING: <b style="color:#fff">+${n}</b></div>
      <div style="font:500 12px Inter;color:#aaa;margin-top:2px">+1 every 1m 48s (our calculation)</div></div>`;
  }

  // ---------- generic bars ----------
  function hbar(o) { // o: x,y,w (max),h,val (0..1),col,label,valText
    return `<div class="abs" style="left:${o.x}px;top:${o.y}px;height:${o.h}px;width:${Math.max(0, o.w * o.val)}px;background:${o.col};box-shadow:0 0 24px ${o.glow ? o.col : 'transparent'}"></div>
      ${o.label ? `<div class="abs" style="left:${o.x - 20}px;top:${o.y}px;height:${o.h}px;line-height:${o.h}px;transform:translateX(-100%);font:800 ${o.fs || 30}px Inter;color:#fff;white-space:nowrap">${esc(o.label)}</div>` : ''}
      ${o.valText != null ? `<div class="abs" style="left:${o.x + o.w * o.val + 18}px;top:${o.y}px;height:${o.h}px;line-height:${o.h}px;font:900 ${o.vfs || 44}px Inter;color:${o.vcol || '#fff'};white-space:nowrap">${o.valText}</div>` : ''}`;
  }

  // ---------- textures ----------
  const TEX = { paper: '', grain: [], board: '', vig: '' };
  function makeTextures() {
    const mk = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); fn(g, w, h); return c.toDataURL('image/png'); };
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    TEX.paper = mk(256, 256, (g, w, h) => { const im = g.createImageData(w, h); for (let i = 0; i < w * h; i++) { const v = 236 + (rnd() - 0.5) * 18; im.data[i * 4] = v + 8; im.data[i * 4 + 1] = v + 3; im.data[i * 4 + 2] = v - 6; im.data[i * 4 + 3] = 255; } g.putImageData(im, 0, 0); });
    TEX.board = mk(512, 512, (g, w, h) => { const im = g.createImageData(w, h); for (let i = 0; i < w * h; i++) { const v = 18 + (rnd() - 0.5) * 7; im.data[i * 4] = v; im.data[i * 4 + 1] = v; im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; } g.putImageData(im, 0, 0);
      g.globalAlpha = 0.05; for (let k = 0; k < 400; k++) { g.strokeStyle = rnd() > 0.5 ? '#fff' : '#000'; g.beginPath(); const x = rnd() * w, y = rnd() * h; g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 60, y + (rnd() - 0.5) * 8); g.stroke(); } });
    for (let k = 0; k < 8; k++) TEX.grain.push(mk(384, 384, (g, w, h) => { const im = g.createImageData(w, h); for (let i = 0; i < w * h; i++) { const v = rnd() * 255; im.data[i * 4] = v; im.data[i * 4 + 1] = v; im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; } g.putImageData(im, 0, 0); }));
  }
  function boardBg() { return `<div class="abs full" style="background:#121212 url(${TEX.board});"></div>`; }

  // generic transform wrapper
  function wrap(html, o = {}) {
    return `<div class="abs full" style="transform:translate(${o.x || 0}px,${o.y || 0}px) scale(${o.s == null ? 1 : o.s}) rotate(${o.rot || 0}deg);transform-origin:${o.ox == null ? 960 : o.ox}px ${o.oy == null ? 540 : o.oy}px;opacity:${o.op == null ? 1 : o.op};${o.filter ? 'filter:' + o.filter + ';' : ''}">${html}</div>`;
  }
  // pattern-board node card. o: x,y (centre), date, title, col, label, p (entrance 0..1), thumb (photo key), w, glow, sepia, op
  function node(o) {
    const w = o.w || 300; const p = o.p == null ? 1 : o.p; const col = o.col || C.on;
    if (p <= 0) return '';
    const sc = o.stampIn ? lerp(1.6, 1, back(p)) : lerp(0.8, 1, back(p));
    const thumb = o.thumb ? `<div style="position:absolute;right:12px;top:42px;width:64px;height:76px;overflow:hidden;border:3px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.4)"><img src="${PH[o.thumb] ? '/photos/' + PH[o.thumb].src + '.jpg' : o.thumb}" style="width:100%;height:100%;object-fit:cover;object-position:${PH[o.thumb] ? PH[o.thumb].fx + '% ' + PH[o.thumb].fy + '%' : '50% 50%'};${o.sepia ? 'filter:sepia(.9)' : ''}"/></div>` : '';
    return `<div class="abs" style="left:${o.x - w / 2}px;top:${o.y - 70}px;width:${w}px;opacity:${clamp(p * 2, 0, 1) * (o.op == null ? 1 : o.op)};transform:scale(${sc}) rotate(${o.rot || 0}deg);${o.sepia ? 'filter:sepia(.85) brightness(.85);' : ''}">
      <div style="background:${C.paper};background-image:url(${TEX.paper});border-top:8px solid ${col};padding:12px 14px 14px;min-height:140px;position:relative;box-shadow:0 12px 26px rgba(0,0,0,.55)${o.glow ? ',0 0 ' + (24 * o.glow) + 'px ' + col : ''}">
        <div style="font:800 15px Inter;letter-spacing:1.8px;color:${col === C.paper ? '#555' : col};text-transform:uppercase;filter:brightness(.8)">${esc(o.date)}</div>
        <div style="font:700 ${o.fs || 21}px/1.2 Inter;color:#161616;margin-top:6px;${o.thumb ? 'padding-right:78px;' : ''}">${esc(o.title)}</div>
        ${o.label ? `<div style="margin-top:10px">${tag(o.label, { inline: true, s: 0.72, note: o.note })}</div>` : ''}
        ${thumb}
      </div></div>`;
  }
  // big hand-drawn question mark (stroke reveal)
  function qmark(x, y, s, p, o = {}) {
    const d = 'M-30,-40 C-30,-80 40,-85 40,-40 C40,-10 0,-5 0,25 L0,40';
    const L = 260;
    return `<svg class="abs" style="left:${x - 60 * s}px;top:${y - 100 * s}px;overflow:visible;opacity:${o.op == null ? 1 : o.op}" width="${120 * s}" height="${200 * s}" viewBox="-60 -100 120 200">
      <path d="${d}" fill="none" stroke="${o.color || C.thread}" stroke-width="${o.sw || 12}" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - clamp(p, 0, 1))}" style="filter:drop-shadow(0 4px 10px rgba(0,0,0,.6))"/>
      ${p > 0.95 ? `<circle cx="0" cy="72" r="${(o.sw || 12) * 0.8}" fill="${o.color || C.thread}"/>` : ''}</svg>`;
  }
  // torn-paper reveal: a paper sheet with a jagged edge slides off to the right
  function torn(p, o = {}) {
    if (p >= 1) return '';
    let pts = ''; const n = 28; for (let i = 0; i <= n; i++) { const y = (i / n) * 1080; pts += `${(hash(i * 7.1) - 0.5) * 50},${y} `; }
    const x = lerp(o.x0 == null ? 0 : o.x0, 2100, eio(p));
    const b = o.box; const cp = b ? `clip-path:inset(${b[1]}px ${1920 - b[0] - b[2]}px ${1080 - b[1] - b[3]}px ${b[0]}px);` : '';
    return `<svg class="abs full" viewBox="0 0 1920 1080" style="${cp}"><g transform="translate(${x},0)"><polygon points="${pts} 2400,1080 2400,0" fill="${o.col || '#e9e2d6'}"/><polygon points="${pts} 2400,1080 2400,0" fill="url(#)" opacity="0"/></g></svg>`;
  }

  window.E = { wrap, node, qmark, torn, W, H, FPS, C, clamp, lerp, eo, eio, back, P, lin, vis, fade, esc, hash, fmt, S, shake, clip, clipSrc, still, dim, grad, photo, photoCredit, credit, nameCard, PH,
    tag, card, quote, pollCard, typeText, title, lowerThird, aiLabel, odometer, rollTo, stamp, splitFlap, thread, threadPath, knotAt, icon, iconAt, IC, ausMap, city,
    counter800, hbar, TEX, makeTextures, boardBg,
    setData(clipn, geo) { CLIPN = clipn; GEO = geo; } };
})();
