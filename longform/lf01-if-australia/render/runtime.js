/* lf01 runtime: DOM tile layer + renderFrame(t). Score (choreography) lives in score.js. */
(function () {
  const { W, H, TS, clamp, scale } = window.MAP;
  const stage = document.getElementById('stage');
  let MANIFEST = {};
  const HAVE = {};

  function el(tag, cls, parent) { const e = document.createElement(tag); if (cls) e.className = cls; parent.appendChild(e); return e; }

  function makeView() {
    const v = el('div', 'view', stage);
    const tiles = el('div', 'tiles', v);
    const night = el('div', 'tint', v);
    night.style.background = '#2b3a66';
    night.style.mixBlendMode = 'multiply';
    const warm = el('div', 'tint', v);
    warm.style.background = '#ffae5a';
    warm.style.mixBlendMode = 'soft-light';
    return { v, tiles, night, warm, pool: new Map(), tick: 0 };
  }
  const views = [makeView(), makeView()];
  const paper = el('div', '', stage); paper.id = 'paper';
  const svgNS = 'http://www.w3.org/2000/svg';
  const ov = document.createElementNS(svgNS, 'svg');
  ov.setAttribute('id', 'ov'); ov.setAttribute('width', W); ov.setAttribute('height', H);
  ov.setAttribute('viewBox', `0 0 ${W} ${H}`);
  stage.appendChild(ov);
  const vig = el('div', '', stage); vig.id = 'vignette';
  const haze = el('div', '', stage); haze.id = 'haze';

  function levelFor(z) { return clamp(Math.ceil(z - 0.35), 2, 10); }

  function drawTiles(view, c, pending) {
    view.tick++;
    const k = scale(c);
    const cx = c.cx ?? W / 2, cy = c.cy ?? H / 2;
    const x0 = c.x - cx / k, x1 = c.x + (W - cx) / k;
    const y0 = c.y - cy / k, y1 = c.y + (H - cy) / k;
    const Lt = levelFor(c.z);
    let zi = 1;
    for (let L = Math.max(2, Lt - 3); L <= Lt; L++) {
      const n = 1 << L;
      const have = HAVE[L];
      if (!have) continue;
      const s = Math.pow(2, c.z - L);
      const fade = L === Lt && L > 2 ? clamp((c.z - (Lt - 1.35)) / 0.4, 0, 1) : 1;
      const ix0 = Math.floor(x0 * n), ix1 = Math.floor(x1 * n);
      const iy0 = Math.max(0, Math.floor(y0 * n)), iy1 = Math.min(n - 1, Math.floor(y1 * n));
      for (let ix = ix0; ix <= ix1; ix++) {
        const wx = ((ix % n) + n) % n;
        for (let iy = iy0; iy <= iy1; iy++) {
          if (!have.has(wx * 4096 + iy)) continue;
          const key = `${L}/${ix}/${iy}`;
          let img = view.pool.get(key);
          if (!img) {
            img = document.createElement('img');
            img.decoding = 'sync';
            img.src = `/tiles/${L}/${wx}_${iy}.jpg`;
            view.tiles.appendChild(img);
            view.pool.set(key, img);
            pending.push(img.decode().catch(() => {}));
          }
          img._tick = view.tick;
          const sx = (ix / n - c.x) * k + cx, sy = (iy / n - c.y) * k + cy;
          const ss = (TS * s + 0.75) / TS; // hide hairline seams
          img.style.transform = `translate(${sx.toFixed(2)}px,${sy.toFixed(2)}px) scale(${ss.toFixed(5)})`;
          img.style.opacity = fade.toFixed(3);
          img.style.zIndex = String(zi + L);
          img.style.display = '';
        }
      }
    }
    // retire unused
    for (const [key, img] of view.pool) {
      if (img._tick !== view.tick) {
        if (view.tick - img._tick > 90) { img.remove(); view.pool.delete(key); }
        else img.style.display = 'none';
      }
    }
  }

  function applyLook(view, L) {
    const n = L.night || 0, d = L.desat || 0, wm = L.warm || 0, dim = L.dim || 0;
    let b = (1 - 0.46 * n) * (1 - 0.1 * d) * (1 + 0.04 * wm) * (1 - dim);
    let s = (1 - 0.45 * n) * (1 - 0.85 * d) * (1 + 0.28 * wm);
    const f = `brightness(${b.toFixed(3)}) saturate(${s.toFixed(3)}) contrast(${(1 - 0.08 * d + 0.03 * wm).toFixed(3)}) sepia(${(0.2 * wm).toFixed(3)})`;
    view.tiles.style.filter = f;
    view.night.style.opacity = (0.42 * n).toFixed(3);
    view.warm.style.opacity = (0.3 * wm).toFixed(3);
  }

  window.renderFrame = async function (t) {
    const st = window.SCORE.frame(t);
    const pending = [];
    for (let i = 0; i < views.length; i++) {
      const vw = views[i], spec = st.views[i];
      if (!spec) { vw.v.style.display = 'none'; continue; }
      vw.v.style.display = '';
      vw.v.style.clipPath = spec.clip ? `inset(0px ${W - spec.clip[1]}px 0px ${spec.clip[0]}px)` : 'none';
      drawTiles(vw, spec.cam, pending);
      applyLook(vw, spec.look || {});
    }
    paper.style.opacity = String(st.paper ?? 0.55);
    ov.innerHTML = st.svg || '';
    if (pending.length) await Promise.all(pending);
    // let fonts/images in the overlay settle on first use
    const imgs = ov.querySelectorAll('image');
    if (imgs.length) await Promise.all([...imgs].map((im) => (im.decode ? im.decode().catch(() => {}) : null)));
  };

  (async function boot() {
    const [manifest, timeline, geo] = await Promise.all([
      fetch('/tiles/manifest.json').then((r) => r.json()),
      fetch('/ep/timeline.json').then((r) => r.json()),
      fetch('/ep/geo/geo.json').then((r) => r.json()),
    ]);
    MANIFEST = manifest;
    for (const [L, list] of Object.entries(MANIFEST)) HAVE[L] = new Set(list.map(([x, y]) => x * 4096 + y));
    await document.fonts.ready;
    await Promise.all(['Oswald', 'Elite', 'Fell', 'FellSC', 'FellIt'].map((f) => document.fonts.load(`40px ${f}`)));
    window.CURTIN_IMG = '/img/curtin.jpg';
    window.SCORE = window.buildScore(timeline, geo);
    window.EPISODE = { duration: window.SCORE.duration, fps: 30 };
    window.__ready = true;
  })();
})();
