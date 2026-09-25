/* Shared history-Shorts engine — SVG + renderFrame(t). No Remotion. */
(function () {
  const W = 1080;
  const H = 1920;
  const CAPTION_Y = H * 0.70; // lower-middle: between centre and bottom, above YT UI

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function easeOutElastic(t) {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  }
  function smoothstep(e0, e1, x) {
    const t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function groupCaptions(words, maxWords = 5, maxGap = 0.55) {
    const groups = [];
    let cur = [];
    for (const w of words || []) {
      if (!cur.length) {
        cur.push(w);
        continue;
      }
      const prev = cur[cur.length - 1];
      const gap = w.start - prev.end;
      if (cur.length >= maxWords || gap > maxGap) {
        groups.push(cur);
        cur = [w];
      } else {
        cur.push(w);
      }
    }
    if (cur.length) groups.push(cur);
    return groups.map((g) => ({
      text: g.map((x) => x.word).join(' ').replace(/\s+([.,!?])/g, '$1'),
      start: g[0].start,
      end: g[g.length - 1].end + 0.12,
    }));
  }

  function stillLayer(url, opts = {}) {
    const dim = opts.dim != null ? opts.dim : 0.45;
    const scale = opts.scale != null ? opts.scale : 1.08;
    const driftX = opts.driftX || 0;
    const driftY = opts.driftY || 0;
    return `
      <image href="${url}" x="${(W - W * scale) / 2 + driftX}" y="${(H - H * scale) / 2 + driftY}"
        width="${W * scale}" height="${H * scale}" preserveAspectRatio="xMidYMid slice"/>
      <rect x="0" y="0" width="${W}" height="${H}" fill="rgba(0,0,0,${dim})"/>
    `;
  }

  function captionSvg(text, t, start, end) {
    if (!text || t < start - 0.05 || t > end) return '';
    const local = clamp((t - start) / 0.18, 0, 1);
    const s = easeOutBack(local);
    const opacity = t > end - 0.1 ? clamp((end - t) / 0.1, 0, 1) : 1;
    const escaped = String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    // wrap ~28 chars
    const words = escaped.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const next = line ? line + ' ' + w : w;
      if (next.length > 28 && line) {
        lines.push(line);
        line = w;
      } else line = next;
    }
    if (line) lines.push(line);
    const lineH = 64;
    const blockH = lines.length * lineH + 36;
    const y0 = CAPTION_Y - blockH / 2;
    const spans = lines
      .map(
        (ln, i) =>
          `<tspan x="540" dy="${i === 0 ? 0 : lineH}">${ln}</tspan>`
      )
      .join('');
    return `
      <g opacity="${opacity}" transform="translate(540 ${y0 + blockH / 2}) scale(${s}) translate(-540 ${-(y0 + blockH / 2)})">
        <rect x="70" y="${y0}" width="940" height="${blockH}" rx="18"
          fill="rgba(0,0,0,0.62)" stroke="rgba(255,220,120,0.35)" stroke-width="2"/>
        <text x="540" y="${y0 + 48}" text-anchor="middle"
          font-family="Arial Black, Helvetica, sans-serif" font-size="44" font-weight="900"
          fill="#fff" stroke="#000" stroke-width="6" paint-order="stroke"
          style="letter-spacing:0.5px">${spans}</text>
      </g>`;
  }

  function badge(label, x, y, opts = {}) {
    const fill = opts.fill || '#f5c842';
    const color = opts.color || '#111';
    const w = opts.w || Math.max(160, label.length * 18 + 40);
    return `
      <g transform="translate(${x},${y})">
        <rect x="${-w / 2}" y="-28" width="${w}" height="56" rx="12" fill="${fill}"/>
        <text text-anchor="middle" y="8" font-family="Arial Black, Helvetica, sans-serif"
          font-size="28" font-weight="900" fill="${color}">${label}</text>
      </g>`;
  }

  window.HS = {
    W,
    H,
    CAPTION_Y,
    clamp,
    lerp,
    easeOutBack,
    easeOutCubic,
    easeInOutCubic,
    easeOutElastic,
    smoothstep,
    groupCaptions,
    stillLayer,
    captionSvg,
    badge,
  };

  window.renderFrame = function (t) {
    const ep = window.EPISODE;
    if (!ep) return;
    const root = document.getElementById('root');
    const scenes = ep.scenes || [];
    const XFADE = 0.28; // soft crossfade at scene seams
    let body = '';
    for (let i = 0; i < scenes.length; i++) {
      const sc = scenes[i];
      const next = scenes[i + 1];
      // draw scene if inside, or during outgoing crossfade into next
      const inScene = t >= sc.start - 0.001 && t < sc.end;
      const outgoing = next && t >= sc.end - XFADE && t < sc.end + 0.001;
      if (!inScene && !outgoing) continue;
      const localT = Math.max(0, t - sc.start);
      let layer = sc.draw(t, localT, window.HS) || '';
      if (next && t >= next.start - XFADE && t < next.start + XFADE) {
        // blend: fade current out as next starts
        const u = clamp((t - (next.start - XFADE)) / (XFADE * 2), 0, 1);
        if (t < next.start) {
          const fade = 1 - easeInOutCubic(clamp((t - (sc.end - XFADE)) / XFADE, 0, 1));
          layer = `<g opacity="${fade}">${layer}</g>`;
        }
      }
      body += layer;
    }
    // captions
    if (!ep._caps) ep._caps = groupCaptions(ep.words);
    let caps = '';
    for (const c of ep._caps) {
      if (t >= c.start && t <= c.end) {
        caps += captionSvg(c.text, t, c.start, c.end);
        break;
      }
    }
    root.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
        <rect width="${W}" height="${H}" fill="#0a0a12"/>
        ${body}
        ${caps}
      </svg>`;
  };
})();
