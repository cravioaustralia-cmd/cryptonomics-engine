/* lf09 runtime: block sequencing, transitions, counter overlay, grain, SFX cue collection. */
(function () {
  const SCENES = {};
  const RT = { SCENES, warn: [], ready: false };
  let TL = null, BLOCKS = [], counterStart = 1e9, counterEnd = 1e9;
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  function wordTime(seg, key, n = 1, field = 's') {
    const S = TL.segments[seg]; const k = norm(key); let c = 0;
    for (const w of S.words) { const nw = norm(w.w); if (nw === k) { c++; if (c === n) return w[field]; } }
    RT.warn.push(`${seg}:${key}#${n}`); return S.vo_start;
  }
  RT.wordTime = wordTime;
  RT.scene = (id, fn) => { SCENES[id] = fn; };
  function ctx(b, t, tView, collect, sfxList) {
    const c = { t, tView, b, lt: t - b.start, start: b.start, end: b.end, collect: !!collect, master: RT.master };
    if (b.type === 'seg') { c.seg = TL.segments[b.id]; c.vo = b.vo_start; c.voEnd = b.vo_end; c.w = (k, n = 1) => wordTime(b.id, k, n); c.we = (k, n = 1) => wordTime(b.id, k, n, 'e'); c.ws = (seg, k, n = 1) => wordTime(seg, k, n); }
    c.sfx = (name, time, gain = 0) => { if (collect) sfxList.push({ name, t: +time.toFixed(3), gain, block: b.id }); };
    c.prevBlock = BLOCKS[BLOCKS.indexOf(b) - 1]; c.nextBlock = BLOCKS[BLOCKS.indexOf(b) + 1];
    return c;
  }
  function renderBlock(i, t, tView) {
    const b = BLOCKS[i]; let fn = SCENES[b.id] || SCENES[b.type];
    if (b.type === 'midroll') { // hold the previous segment's final picture (still drifting), music out
      const pb = BLOCKS[i - 1]; fn = SCENES[pb.id]; return fn(ctx(pb, t, tView));
    }
    if (!fn) return `<div class="abs full" style="background:#300;color:#fff;font:40px Inter;padding:40px">MISSING SCENE ${b.id}</div>`;
    return fn(ctx(b, t, tView));
  }
  const XF = 0.4;
  const HIDE_COUNTER = new Set(['S12', 'S14', 'S43', 'END']);
  RT.renderFrame = async function (t, tView) {
    if (tView == null) tView = t;
    E.S.shakeX = 0; E.S.shakeY = 0; E.S.hideCounter = false; E.S.t = t;
    let i = BLOCKS.findIndex((b) => t >= b.start && t < b.end); if (i < 0) i = BLOCKS.length - 1;
    const b = BLOCKS[i];
    let html = renderBlock(i, t, tView);
    const noXf = b.type === 'midroll' || (BLOCKS[i - 1] && BLOCKS[i - 1].type === 'midroll' && b.type === 'seg' && false);
    if (i > 0 && t < b.start + XF && !noXf) {
      const hc = E.S.hideCounter; const prev = renderBlock(i - 1, t, tView); E.S.hideCounter = hc;
      const a = E.eio((t - b.start) / XF);
      html = `<div class="abs full">${prev}</div><div class="abs full" style="opacity:${a}">${html}</div>`;
    }
    const blk = b.type === 'midroll' ? b.id : b.id;
    const showCounter = t >= counterStart && t < counterEnd && !HIDE_COUNTER.has(b.id) && b.type !== 'midroll' && !E.S.hideCounter;
    const cOp = showCounter ? Math.min(1, (t - counterStart) / 0.4) * 0.6 : 0;
    const frame = Math.round(t * 30);
    const root = document.getElementById('root');
    root.innerHTML = `<div class="abs full" style="transform:translate(${E.S.shakeX}px,${E.S.shakeY}px)">${html}</div>
      ${cOp > 0 ? E.counter800(tView, { op: cOp }) : ''}
      <div class="abs full" style="background:radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.38) 100%);pointer-events:none"></div>
      <div class="abs full" style="background:url(${E.TEX.grain[frame % 8]});opacity:.055;mix-blend-mode:overlay"></div>`;
    const imgs = [...root.querySelectorAll('img')];
    await Promise.all(imgs.map((im) => (im.complete && im.naturalWidth) ? null : im.decode().catch(() => { RT.warn.push('img:' + im.src); })));
    return true;
  };
  RT.collect = function () {
    const list = [];
    for (const b of BLOCKS) { const fn = SCENES[b.id] || SCENES[b.type]; if (fn && b.type !== 'midroll') { try { fn(ctx(b, b.start, b.start, true, list)); } catch (e) { RT.warn.push('collect ' + b.id + ' ' + e.message); } } }
    // counter ticks (film-time visibility windows)
    const hidden = BLOCKS.filter((b) => HIDE_COUNTER.has(b.id) || b.type === 'midroll').map((b) => [b.start, b.end]);
    return { sfx: list, counter: { start: counterStart, end: counterEnd, hidden, payoff: RT.payoff || null }, warn: RT.warn };
  };
  RT.boot = async function () {
    const q = new URLSearchParams(location.search); RT.master = q.get('master') === '1';
    const [tl, cn, geo] = await Promise.all(['/data/timeline.json', '/cache/clip_frames.json', '/assets/geo/aus.json'].map((u) => fetch(u).then((r) => r.json())));
    TL = tl; BLOCKS = tl.blocks; RT.TL = tl; RT.BLOCKS = BLOCKS;
    E.setData(cn, geo); E.makeTextures();
    counterStart = wordTime('S07', 'every', 1) + 0.0; counterEnd = BLOCKS.find((b) => b.id === 'END').start;
    RT.counterStart = counterStart;
    await document.fonts.load('600 40px "Source Serif 4"'); await document.fonts.load('italic 600 40px "Source Serif 4"'); await document.fonts.load('400 40px "Source Serif 4"'); await document.fonts.load('800 40px Inter');
    await document.fonts.ready;
    RT.ready = true;
  };
  window.RT = RT;
})();
