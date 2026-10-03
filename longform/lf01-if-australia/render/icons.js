/* lf01 IF AUSTRALIA — SVG motion-graphics kit (pure string builders).
 * War-map language: red = Imperial Japanese movement, blue = Allied, ink + parchment for labels.
 * Every builder takes screen coordinates and a progress/opacity, so the score stays declarative.
 */
(function (G) {
  const { clamp, lerp, ease, sstep } = G.MAP;
  const C = {
    red: '#b0261c', redDk: '#6a120c', redLt: '#e0573f',
    blue: '#1d4f8f', blueDk: '#0e2d57', blueLt: '#4d8bd1',
    ink: '#33261a', inkSoft: '#5b4631', paper: '#f1e6cb', paperDk: '#dccaa3', gold: '#c99a3a',
  };
  const f2 = (v) => (Math.round(v * 100) / 100).toString();
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const op = (o) => (o >= 0.999 ? '' : ` opacity="${f2(clamp(o, 0, 1))}"`);

  /* text with a parchment halo so it reads on any part of the map */
  function label(x, y, text, o = {}) {
    const size = o.size || 30, fill = o.fill || C.ink, font = o.font || 'FellSC';
    const halo = o.halo ?? 'rgba(241,230,203,0.92)', hw = o.hw ?? Math.max(3, size * 0.22);
    const anchor = o.anchor || 'middle', ls = o.ls ?? 1.2, a = o.o ?? 1;
    if (a <= 0.001) return '';
    const tr = o.scale && o.scale !== 1 ? ` transform="translate(${f2(x)} ${f2(y)}) scale(${f2(o.scale)}) translate(${f2(-x)} ${f2(-y)})"` : '';
    return `<text x="${f2(x)}" y="${f2(y)}" text-anchor="${anchor}" font-family="${font}" font-size="${size}" letter-spacing="${ls}"
      fill="${fill}" stroke="${halo}" stroke-width="${f2(hw)}" stroke-linejoin="round" paint-order="stroke"${op(a)}${tr}${o.weight ? ` font-weight="${o.weight}"` : ''}>${esc(text)}</text>`;
  }

  /* map pin: drop (u 0→1 with thunk bounce), optional pulse ring */
  function pin(x, y, o = {}) {
    const u = o.u ?? 1, col = o.color || C.red, s = o.size || 1;
    if (u <= 0) return '';
    const drop = (1 - ease.out(clamp(u / 0.45, 0, 1))) * -90;
    const squash = u > 0.45 && u < 0.75 ? 1 - 0.18 * Math.sin(((u - 0.45) / 0.3) * Math.PI) : 1;
    const a = clamp(u / 0.15, 0, 1) * (o.o ?? 1);
    let ring = '';
    if (u > 0.45) {
      const r = (u - 0.45) / 0.55;
      if (r < 1) ring = `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(10 + 40 * r)}" ry="${f2(4 + 14 * r)}" fill="none" stroke="${col}" stroke-width="${f2(3 * (1 - r))}" opacity="${f2(0.8 * (1 - r))}"/>`;
    }
    if (o.pulse) {
      const p = (o.pulse % 1);
      ring += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(14 + 34 * p)}" fill="none" stroke="${col}" stroke-width="3" opacity="${f2(0.7 * (1 - p))}"/>`;
    }
    return `<g${op(a)}>${ring}
      <ellipse cx="${f2(x)}" cy="${f2(y + 2)}" rx="${f2(9 * s)}" ry="${f2(3.5 * s)}" fill="rgba(40,25,10,0.35)"/>
      <g transform="translate(${f2(x)} ${f2(y + drop)}) scale(${f2(s)} ${f2(s * squash)})">
        <path d="M0 0 C-4 -10 -15 -18 -15 -30 A15 15 0 1 1 15 -30 C15 -18 4 -10 0 0Z" fill="${col}" stroke="${o.stroke || C.ink}" stroke-width="2"/>
        <circle cx="0" cy="-30" r="5.5" fill="${C.paper}"/>
      </g></g>`;
  }

  /* pin flare for the zoom-through: burst of light at the pin (k 0→1) */
  function flare(x, y, k) {
    if (k <= 0 || k >= 1) return '';
    const r = 20 + 520 * ease.in2(k), a = Math.sin(k * Math.PI);
    return `<g opacity="${f2(a)}">
      <circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="url(#gFlare)"/>
      <circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r * 0.42)}" fill="none" stroke="#fff3d2" stroke-width="${f2(6 * (1 - k))}"/>
    </g>`;
  }

  function polyD(pts) { return pts.map((p, i) => (i ? 'L' : 'M') + f2(p[0]) + ' ' + f2(p[1])).join(''); }
  function plen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
  /* cut a polyline at fraction u of its length */
  function cut(pts, u) {
    if (u >= 1) return pts.slice();
    const tot = plen(pts) * Math.max(0, u);
    const out = [pts[0]];
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (acc + d >= tot) { const f = d ? (tot - acc) / d : 0; out.push([lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]); return out; }
      acc += d; out.push(pts[i]);
    }
    return out;
  }
  /* sub-range [a,b] of a polyline (fractions) */
  function sub(pts, a, b) {
    const head = cut(pts, b);
    const L = plen(head), La = plen(pts) * a;
    let acc = 0;
    for (let i = 1; i < head.length; i++) {
      const d = Math.hypot(head[i][0] - head[i - 1][0], head[i][1] - head[i - 1][1]);
      if (acc + d >= La) { const f = d ? (La - acc) / d : 0; return [[lerp(head[i - 1][0], head[i][0], f), lerp(head[i - 1][1], head[i][1], f)], ...head.slice(i)]; }
      acc += d;
    }
    return L ? head.slice(-2) : head;
  }
  /* quadratic bezier from a to b with sideways bend (fraction of length) */
  function curve(a, b, bend = 0.18, n = 40) {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1];
    const cx = mx - dy * bend, cy = my + dx * bend;
    const out = [];
    for (let i = 0; i <= n; i++) { const t = i / n; out.push([(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * cx + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * cy + t * t * b[1]]); }
    return out;
  }

  /* campaign arrow: tapered band + head, draws on with u. style: solid | dotted */
  function arrow(pts, u, o = {}) {
    if (u <= 0.001 || pts.length < 2) return '';
    const col = o.color || C.red, w = o.width || 14, a = o.o ?? 1;
    const p = cut(pts, clamp(u, 0, 1));
    if (p.length < 2) return '';
    const n = p.length, last = p[n - 1];
    let k = n - 2; while (k > 0 && Math.hypot(last[0] - p[k][0], last[1] - p[k][1]) < 6) k--;
    const prev = p[k];
    const ang = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
    const hl = o.head ?? w * 2.1, hw = hl * 0.78;
    const tip = [last[0] + Math.cos(ang) * hl * 0.55, last[1] + Math.sin(ang) * hl * 0.55];
    const bl = [last[0] - Math.cos(ang) * hl * 0.45 + Math.cos(ang + Math.PI / 2) * hw, last[1] - Math.sin(ang) * hl * 0.45 + Math.sin(ang + Math.PI / 2) * hw];
    const br = [last[0] - Math.cos(ang) * hl * 0.45 - Math.cos(ang + Math.PI / 2) * hw, last[1] - Math.sin(ang) * hl * 0.45 - Math.sin(ang + Math.PI / 2) * hw];
    const shaft = cut(p, Math.max(0, 1 - (hl * 0.35) / Math.max(1, plen(p))));
    const dash = o.dotted ? ` stroke-dasharray="${f2(w * 0.2)} ${f2(w * 1.15)}"` : '';
    const glow = o.glow ? `<path d="${polyD(shaft)}" fill="none" stroke="${o.glowColor || col}" stroke-width="${f2(w * 2.6)}" stroke-linecap="round" stroke-linejoin="round" opacity="${f2(0.28 * o.glow)}" filter="url(#fGlow)"/>` : '';
    return `<g${op(a)}>${glow}
      <path d="${polyD(shaft)}" fill="none" stroke="rgba(30,15,5,0.28)" stroke-width="${f2(w + 4)}" stroke-linecap="round" stroke-linejoin="round" transform="translate(3 4)"${dash}/>
      <path d="${polyD(shaft)}" fill="none" stroke="${o.dk || C.redDk}" stroke-width="${f2(w + 3)}" stroke-linecap="round" stroke-linejoin="round"${dash}/>
      <path d="${polyD(shaft)}" fill="none" stroke="${col}" stroke-width="${f2(w)}" stroke-linecap="round" stroke-linejoin="round"${dash}/>
      <path d="M${f2(tip[0])} ${f2(tip[1])}L${f2(bl[0])} ${f2(bl[1])}L${f2(br[0])} ${f2(br[1])}Z" fill="${col}" stroke="${o.dk || C.redDk}" stroke-width="2.5" stroke-linejoin="round"/>
    </g>`;
  }

  /* plain line (rail, road, lifeline) drawing on */
  function line(pts, u, o = {}) {
    if (u <= 0.001) return '';
    const p = o.from != null ? sub(pts, o.from, clamp(u, 0, 1)) : cut(pts, clamp(u, 0, 1));
    if (p.length < 2) return '';
    const col = o.color || C.ink, w = o.width || 4;
    const dash = o.dash ? ` stroke-dasharray="${o.dash}"` : '';
    const under = o.under ? `<path d="${polyD(p)}" fill="none" stroke="${o.under}" stroke-width="${f2(w + (o.underW || 4))}" stroke-linecap="round" stroke-linejoin="round"/>` : '';
    const glow = o.glow ? `<path d="${polyD(p)}" fill="none" stroke="${o.glowColor || col}" stroke-width="${f2(w * 3.2)}" stroke-linecap="round" opacity="${f2(0.35 * o.glow)}" filter="url(#fGlow)"/>` : '';
    return `<g${op(o.o ?? 1)}>${glow}${under}<path d="${polyD(p)}" fill="none" stroke="${col}" stroke-width="${f2(w)}" stroke-linecap="round" stroke-linejoin="round"${dash}/></g>`;
  }
  /* railway: ink line with cross-ties */
  function rail(pts, u, o = {}) {
    if (u <= 0.001) return '';
    const p = cut(pts, clamp(u, 0, 1));
    if (p.length < 2) return '';
    const sp = o.tie || 14;
    let ties = '';
    let acc = 0, next = sp / 2;
    for (let i = 1; i < p.length; i++) {
      const dx = p[i][0] - p[i - 1][0], dy = p[i][1] - p[i - 1][1], d = Math.hypot(dx, dy);
      while (next <= acc + d) {
        const f = (next - acc) / d, x = p[i - 1][0] + dx * f, y = p[i - 1][1] + dy * f, nx = -dy / d * 7, ny = dx / d * 7;
        ties += `M${f2(x - nx)} ${f2(y - ny)}L${f2(x + nx)} ${f2(y + ny)}`;
        next += sp;
      }
      acc += d;
    }
    return `<g${op(o.o ?? 1)}><path d="${polyD(p)}" fill="none" stroke="rgba(241,230,203,0.85)" stroke-width="9" stroke-linecap="round"/>
      <path d="${ties}" stroke="${C.ink}" stroke-width="2.4"/>
      <path d="${polyD(p)}" fill="none" stroke="${C.ink}" stroke-width="3.6" stroke-linecap="round"/></g>`;
  }

  /* ---------------- icons (centred at x,y; s = scale; rot in degrees) ---------------- */
  const wrap = (x, y, s, rot, a, body) =>
    `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(rot || 0)}) scale(${f2(s)})"${op(a ?? 1)}>${body}</g>`;
  function ship(x, y, o = {}) {
    const col = o.color || C.red, dk = o.dk || C.redDk;
    return wrap(x, y, o.s || 1, o.rot, o.o, `
      <path d="M-22 2 L22 2 L16 10 L-17 10 Z" fill="${col}" stroke="${dk}" stroke-width="1.8" stroke-linejoin="round"/>
      <rect x="-9" y="-6" width="14" height="8" fill="${col}" stroke="${dk}" stroke-width="1.6"/>
      <rect x="-3" y="-12" width="4" height="7" fill="${dk}"/>
      ${o.wake ? `<path d="M-24 8 Q-40 5 -58 9" fill="none" stroke="rgba(241,230,203,0.8)" stroke-width="2"/>` : ''}`);
  }
  function plane(x, y, o = {}) {
    const col = o.color || C.red, dk = o.dk || C.redDk;
    return wrap(x, y, o.s || 1, o.rot, o.o, `
      <path d="M0 -20 C3 -18 3 -10 3 -6 L22 4 L22 8 L3 3 L3 13 L9 18 L9 20 L0 18 L-9 20 L-9 18 L-3 13 L-3 3 L-22 8 L-22 4 L-3 -6 C-3 -10 -3 -18 0 -20Z"
        fill="${col}" stroke="${dk}" stroke-width="1.6" stroke-linejoin="round"/>`);
  }
  function sub_(x, y, o = {}) {
    const col = o.color || C.blue, dk = o.dk || C.blueDk;
    return wrap(x, y, o.s || 1, o.rot, o.o, `
      <path d="M-26 2 Q-26 -5 -16 -5 L18 -5 Q28 -5 28 2 Q28 8 18 8 L-16 8 Q-26 8 -26 2Z" fill="${col}" stroke="${dk}" stroke-width="1.8"/>
      <rect x="-5" y="-13" width="12" height="9" rx="2" fill="${col}" stroke="${dk}" stroke-width="1.6"/>
      <line x1="2" y1="-13" x2="2" y2="-20" stroke="${dk}" stroke-width="2"/>`);
  }
  function truck(x, y, o = {}) {
    const col = o.color || C.blue, dk = o.dk || C.blueDk;
    return wrap(x, y, o.s || 1, o.rot, o.o, `
      <rect x="-16" y="-9" width="20" height="13" fill="${col}" stroke="${dk}" stroke-width="1.6"/>
      <path d="M4 -5 L12 -5 L16 0 L16 4 L4 4Z" fill="${col}" stroke="${dk}" stroke-width="1.6"/>
      <circle cx="-9" cy="6" r="3.6" fill="${C.ink}"/><circle cx="10" cy="6" r="3.6" fill="${C.ink}"/>`);
  }
  /* infantry unit symbol (rectangle with saltire), period map convention */
  function unit(x, y, o = {}) {
    const col = o.color || C.red, dk = o.dk || C.redDk;
    return wrap(x, y, o.s || 1, 0, o.o, `
      <rect x="-15" y="-10" width="30" height="20" fill="${o.fill || C.paper}" stroke="${col}" stroke-width="3"/>
      <path d="M-15 -10 L15 10 M15 -10 L-15 10" stroke="${col}" stroke-width="2.6"/>
      <rect x="-15" y="-10" width="30" height="20" fill="none" stroke="${dk}" stroke-width="1"/>`);
  }
  /* soldier figure (simple, no face) */
  function soldier(x, y, o = {}) {
    const col = o.color || C.blue, dk = o.dk || C.blueDk;
    return wrap(x, y, o.s || 1, 0, o.o, `
      <ellipse cx="0" cy="-17" rx="8" ry="3" fill="${dk}"/>
      <circle cx="0" cy="-13" r="5" fill="${col}" stroke="${dk}" stroke-width="1.4"/>
      <path d="M-7 -6 L7 -6 L6 8 L3 8 L2 18 L-2 18 L-3 8 L-6 8Z" fill="${col}" stroke="${dk}" stroke-width="1.4" stroke-linejoin="round"/>`);
  }
  function anchorIcon(x, y, o = {}) {
    const col = o.color || C.red;
    return wrap(x, y, o.s || 1, o.rot, o.o, `
      <circle cx="0" cy="-34" r="9" fill="none" stroke="${col}" stroke-width="7"/>
      <line x1="0" y1="-25" x2="0" y2="38" stroke="${col}" stroke-width="9" stroke-linecap="round"/>
      <line x1="-20" y1="-12" x2="20" y2="-12" stroke="${col}" stroke-width="8" stroke-linecap="round"/>
      <path d="M-36 14 Q-30 42 0 44 Q30 42 36 14" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round"/>
      <path d="M-42 20 L-36 8 L-28 20Z M42 20 L36 8 L28 20Z" fill="${col}"/>`);
  }
  function helmetIcon(x, y, o = {}) {
    const col = o.color || C.red;
    return wrap(x, y, o.s || 1, o.rot, o.o, `
      <path d="M-44 14 Q-44 -38 0 -40 Q44 -38 44 14 Z" fill="${col}"/>
      <rect x="-54" y="12" width="108" height="12" rx="6" fill="${col}"/>
      <path d="M-30 -8 Q0 -26 30 -8" fill="none" stroke="rgba(255,240,210,0.35)" stroke-width="5"/>`);
  }
  function smoke(x, y, t, o = {}) {
    const a = o.o ?? 1;
    let s = '';
    for (let i = 0; i < 6; i++) {
      const ph = ((t * 0.55 + i / 6) % 1);
      const px = x + Math.sin(i * 2.3 + t) * 4 + ph * 22, py = y - ph * 70;
      s += `<circle cx="${f2(px)}" cy="${f2(py)}" r="${f2(7 + ph * 18)}" fill="${o.color || '#4a4038'}" opacity="${f2(a * 0.55 * (1 - ph))}"/>`;
    }
    return `<g>${s}</g>`;
  }
  /* small fire/damage mark (non-graphic) */
  function damage(x, y, t, o = {}) {
    const fl = 1 + 0.12 * Math.sin(t * 13 + x);
    return wrap(x, y, (o.s || 1) * fl, 0, o.o, `
      <path d="M0 -16 C6 -8 10 -4 8 4 C7 10 -7 10 -8 4 C-10 -3 -4 -6 0 -16Z" fill="#c4521d" stroke="${C.redDk}" stroke-width="1.4"/>
      <path d="M0 -6 C3 -2 4 1 3 4 C2 7 -3 7 -3 4 C-4 1 -1 -2 0 -6Z" fill="#f0b040"/>`);
  }
  function burst(x, y, k, o = {}) {
    if (k <= 0 || k >= 1) return '';
    const r = (o.r || 26) * (0.4 + ease.out(k)), a = 1 - k;
    let rays = '';
    for (let i = 0; i < 10; i++) {
      const an = (i / 10) * Math.PI * 2 + (o.seed || 0);
      rays += `M${f2(x + Math.cos(an) * r * 0.45)} ${f2(y + Math.sin(an) * r * 0.45)}L${f2(x + Math.cos(an) * r * (i % 2 ? 0.9 : 1.25))} ${f2(y + Math.sin(an) * r * (i % 2 ? 0.9 : 1.25))}`;
    }
    return `<g opacity="${f2(a)}"><circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r * 0.5)}" fill="#e8a33a" stroke="${C.redDk}" stroke-width="2"/>
      <path d="${rays}" stroke="${o.color || C.redDk}" stroke-width="3.5" stroke-linecap="round"/></g>`;
  }
  /* battle mark: crossed swords */
  function battle(x, y, o = {}) {
    const col = o.color || C.ink;
    return wrap(x, y, o.s || 1, 0, o.o, `
      <circle cx="0" cy="0" r="27" fill="rgba(241,230,203,0.85)" stroke="${col}" stroke-width="2.5"/>
      <path d="M-15 -15 L15 15 M15 -15 L-15 15" stroke="${col}" stroke-width="5" stroke-linecap="round"/>
      <path d="M-15 7 L-7 15 M15 7 L7 15" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`);
  }
  function airfield(x, y, o = {}) {
    const col = o.color || C.red;
    return wrap(x, y, o.s || 1, 0, o.o, `
      <circle cx="0" cy="0" r="16" fill="${C.paper}" stroke="${col}" stroke-width="3"/>
      <path d="M-11 4 L11 -4 M-8 -8 L8 8" stroke="${col}" stroke-width="3.4" stroke-linecap="round"/>`);
  }
  function blockIcon(x, y, o = {}) { // ship-block: barrier bar across a sea lane
    const col = o.color || C.red;
    return wrap(x, y, o.s || 1, o.rot, o.o, `
      <rect x="-26" y="-7" width="52" height="14" rx="3" fill="${col}" stroke="${C.redDk}" stroke-width="2"/>
      <path d="M-18 -7 L-26 7 M-6 -7 L-14 7 M6 -7 L-2 7 M18 -7 L10 7 M26 -3 L22 7" stroke="${C.paper}" stroke-width="3"/>`);
  }
  function rangeRing(x, y, r, o = {}) {
    if (r <= 0) return '';
    const col = o.color || C.red;
    return `<g${op(o.o ?? 1)}><circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="${o.fill || 'rgba(176,38,28,0.10)'}" stroke="${col}" stroke-width="${o.w || 3}" stroke-dasharray="${o.dash || '12 9'}"/></g>`;
  }

  /* paper tag counter: "Population: ~7 million" etc. typewriter text, reveal u */
  function tag(x, y, text, u, o = {}) {
    if (u <= 0) return '';
    const size = o.size || 30;
    const shown = o.type === false ? text : text.slice(0, Math.ceil(text.length * clamp(u * 1.6, 0, 1)));
    const w = Math.max(80, text.length * size * 0.56 + 36), h = size * 1.7;
    const sc = ease.back(clamp(u / 0.35, 0, 1));
    const rot = o.rot ?? -1.2;
    return `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${rot}) scale(${f2(sc)})"${op(o.o ?? 1)}>
      <rect x="${f2(-w / 2 + 4)}" y="${f2(-h / 2 + 5)}" width="${f2(w)}" height="${f2(h)}" fill="rgba(40,25,10,0.28)"/>
      <rect x="${f2(-w / 2)}" y="${f2(-h / 2)}" width="${f2(w)}" height="${f2(h)}" fill="${C.paper}" stroke="${o.edge || C.inkSoft}" stroke-width="1.5"/>
      <rect x="${f2(-w / 2)}" y="${f2(-h / 2)}" width="7" height="${f2(h)}" fill="${o.accent || C.red}"/>
      <text x="${f2(-w / 2 + 22)}" y="${f2(size * 0.36)}" font-family="Elite" font-size="${size}" fill="${C.ink}">${esc(shown)}</text>
    </g>`;
  }
  /* rubber stamp (REJECTED, dates, verdicts): slams in with overshoot, ink texture */
  function stamp(x, y, text, u, o = {}) {
    if (u <= 0) return '';
    const k = clamp(u / 0.22, 0, 1);
    const sc = k < 1 ? lerp(2.6, 1, ease.in2(k)) : 1 + 0.04 * Math.exp(-(u - 0.22) * 18) * Math.sin((u - 0.22) * 60);
    const size = o.size || 96, col = o.color || C.red;
    const w = text.length * size * (o.wf || 0.62) + size * 0.7, h = size * 1.35;
    return `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${o.rot ?? -8}) scale(${f2(sc)})" opacity="${f2(clamp(k * 1.5, 0, 1) * (o.o ?? 1) * 0.92)}">
      <g filter="url(#fStamp)">
        <rect x="${f2(-w / 2)}" y="${f2(-h / 2)}" width="${f2(w)}" height="${f2(h)}" rx="${f2(size * 0.12)}" fill="none" stroke="${col}" stroke-width="${f2(size * 0.09)}"/>
        <rect x="${f2(-w / 2 + size * 0.14)}" y="${f2(-h / 2 + size * 0.14)}" width="${f2(w - size * 0.28)}" height="${f2(h - size * 0.28)}" rx="${f2(size * 0.06)}" fill="none" stroke="${col}" stroke-width="${f2(size * 0.03)}"/>
        <text x="0" y="${f2(size * 0.35)}" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="${size}" letter-spacing="${f2(size * 0.06)}" fill="${col}">${esc(text)}</text>
      </g></g>`;
  }
  /* big scenario numeral slamming onto the map */
  function numeral(x, y, n, u, o = {}) {
    if (u <= 0) return '';
    const k = clamp(u / 0.16, 0, 1);
    const sc = k < 1 ? lerp(3.2, 1, ease.in2(k)) : 1 + 0.05 * Math.exp(-(u - 0.16) * 14) * Math.sin((u - 0.16) * 55);
    const a = (o.o ?? 1) * clamp(k * 2, 0, 1);
    const shake = k >= 1 ? Math.exp(-(u - 0.16) * 20) * 10 * Math.sin(u * 90) : 0;
    return `<g transform="translate(${f2(x + shake)} ${f2(y)}) scale(${f2(sc)})" opacity="${f2(a)}">
      <circle cx="0" cy="0" r="170" fill="rgba(241,230,203,0.86)" stroke="${C.ink}" stroke-width="6"/>
      <circle cx="0" cy="0" r="152" fill="none" stroke="${C.red}" stroke-width="4" stroke-dasharray="4 10"/>
      <text x="0" y="96" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="290" fill="${C.red}" stroke="${C.redDk}" stroke-width="5">${n}</text>
    </g>`;
  }
  /* verdict card: SCENARIO 1: STUCK */
  function verdict(x, y, text, u, o = {}) {
    if (u <= 0) return '';
    const sc = ease.back(clamp(u / 0.3, 0, 1));
    const w = text.length * 46 + 120;
    return `<g transform="translate(${f2(x)} ${f2(y)}) rotate(-2) scale(${f2(sc)})"${op(o.o ?? 1)}>
      <rect x="${f2(-w / 2 + 8)}" y="-62" width="${f2(w)}" height="140" fill="rgba(40,25,10,0.32)"/>
      <rect x="${f2(-w / 2)}" y="-70" width="${f2(w)}" height="140" fill="${C.paper}" stroke="${C.ink}" stroke-width="4"/>
      <rect x="${f2(-w / 2 + 10)}" y="-60" width="${f2(w - 20)}" height="120" fill="none" stroke="${C.red}" stroke-width="2"/>
      <text x="0" y="26" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="76" letter-spacing="4" fill="${C.ink}">${esc(text)}</text>
    </g>`;
  }
  /* newspaper icon unfolding (u) — no headline text, column rules only */
  function newspaper(x, y, u, o = {}) {
    if (u <= 0) return '';
    const k = ease.out(clamp(u, 0, 1));
    const w = 150, h = 190;
    let cols = '';
    for (let c = 0; c < 3; c++) for (let r = 0; r < 9; r++) cols += `<rect x="${f2(-w / 2 + 14 + c * 44)}" y="${f2(-h / 2 + 62 + r * 13)}" width="36" height="4" fill="#8a7a63"/>`;
    return `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(lerp(-30, 5, k))}) scale(${f2(lerp(0.2, 1, k))} ${f2(lerp(0.05, 1, ease.out(clamp((u - 0.15) / 0.85, 0, 1))))})"${op(o.o ?? 1)}>
      <rect x="${-w / 2 + 6}" y="${-h / 2 + 7}" width="${w}" height="${h}" fill="rgba(40,25,10,0.3)"/>
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#ece3cf" stroke="${C.inkSoft}" stroke-width="1.5"/>
      <rect x="${-w / 2 + 12}" y="${-h / 2 + 12}" width="${w - 24}" height="22" fill="#3d3328"/>
      <rect x="${-w / 2 + 12}" y="${-h / 2 + 40}" width="${w - 24}" height="10" fill="#6d604e"/>
      ${cols}
      <line x1="0" y1="${-h / 2}" x2="0" y2="${h / 2}" stroke="rgba(60,40,20,0.25)" stroke-width="2"/>
    </g>`;
  }
  /* archive photo card pinned to the map. href = image (or null → empty archive frame) */
  function photoCard(x, y, u, o = {}) {
    if (u <= 0) return '';
    const k = ease.back(clamp(u, 0, 1));
    const w = o.w || 300, h = o.h || 360;
    const img = o.href
      ? `<image href="${o.href}" x="${-w / 2 + 16}" y="${-h / 2 + 16}" width="${w - 32}" height="${h - 72}" preserveAspectRatio="xMidYMid slice" filter="url(#fArchive)"/>`
      : `<rect x="${-w / 2 + 16}" y="${-h / 2 + 16}" width="${w - 32}" height="${h - 72}" fill="#9b9384"/>
         <text x="0" y="0" text-anchor="middle" font-family="Elite" font-size="20" fill="#3d362d">ARCHIVE PHOTO</text>
         <text x="0" y="28" text-anchor="middle" font-family="Elite" font-size="20" fill="#3d362d">PENDING</text>`;
    return `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(o.rot ?? 3)}) scale(${f2(k)})"${op(o.o ?? 1)}>
      <rect x="${-w / 2 + 9}" y="${-h / 2 + 11}" width="${w}" height="${h}" fill="rgba(30,18,6,0.35)"/>
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#f4ecd8" stroke="#8b7a5c" stroke-width="1.5"/>
      ${img}
      <text x="0" y="${h / 2 - 22}" text-anchor="middle" font-family="FellSC" font-size="27" fill="${C.ink}">${esc(o.caption || '')}</text>
      <rect x="-34" y="${-h / 2 - 14}" width="68" height="26" fill="rgba(226,214,180,0.85)" transform="rotate(-4)"/>
    </g>`;
  }
  /* treaty document with a pen signing it (u) */
  function treaty(x, y, u, o = {}) {
    if (u <= 0) return '';
    const k = ease.back(clamp(u / 0.3, 0, 1)), sig = clamp((u - 0.3) / 0.55, 0, 1);
    const w = 170, h = 220;
    let rules = '';
    for (let r = 0; r < 8; r++) rules += `<rect x="${-w / 2 + 20}" y="${-h / 2 + 46 + r * 15}" width="${w - 40 - (r % 3) * 18}" height="4" fill="#9a8a70"/>`;
    const sp = [];
    for (let i = 0; i <= 40; i++) { const tt = i / 40; sp.push([-50 + tt * 100, 72 + Math.sin(tt * 18) * 7 * Math.sin(tt * Math.PI) - tt * 6]); }
    const drawn = cut(sp, sig);
    const tip = drawn[drawn.length - 1];
    return `<g transform="translate(${f2(x)} ${f2(y)}) rotate(-3) scale(${f2(k)})"${op(o.o ?? 1)}>
      <rect x="${-w / 2 + 7}" y="${-h / 2 + 8}" width="${w}" height="${h}" fill="rgba(40,25,10,0.3)"/>
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#f4ecd6" stroke="${C.inkSoft}" stroke-width="1.5"/>
      <rect x="${-w / 2 + 30}" y="${-h / 2 + 18}" width="${w - 60}" height="10" fill="#6b5a44"/>
      ${rules}
      <line x1="-55" y1="84" x2="55" y2="84" stroke="#8a7a60" stroke-width="1.5"/>
      ${drawn.length > 1 ? `<path d="${polyD(drawn)}" fill="none" stroke="#1f2f5a" stroke-width="2.6" stroke-linecap="round"/>` : ''}
      ${sig > 0 && sig < 1 ? `<g transform="translate(${f2(tip[0])} ${f2(tip[1])}) rotate(-35)"><rect x="-4" y="-70" width="8" height="64" rx="3" fill="#2a2a2a"/><path d="M-4 -6 L4 -6 L0 4Z" fill="#c9a24a"/></g>` : ''}
    </g>`;
  }
  /* rolling counter digits (odometer feel) */
  function fmtInt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* defs used by the overlay */
  const DEFS = `<defs>
    <radialGradient id="gFlare"><stop offset="0" stop-color="#fff7e0" stop-opacity="1"/><stop offset="0.35" stop-color="#ffe2a8" stop-opacity="0.85"/><stop offset="1" stop-color="#ffcf80" stop-opacity="0"/></radialGradient>
    <filter id="fGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="fSoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="fStamp"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.6" result="m"/>
      <feComposite in="SourceGraphic" in2="m" operator="in"/></filter>
    <filter id="fArchive"><feColorMatrix type="matrix" values="0.36 0.52 0.12 0 0.03  0.33 0.5 0.12 0 0.02  0.28 0.44 0.1 0 0  0 0 0 1 0"/></filter>
    <pattern id="pHatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="14" height="14" fill="rgba(176,38,28,0.16)"/><line x1="0" y1="0" x2="0" y2="14" stroke="rgba(150,28,20,0.42)" stroke-width="3"/></pattern>
  </defs>`;

  G.FX = { C, f2, esc, label, pin, flare, polyD, plen, cut, sub, curve, arrow, line, rail, ship, plane, sub_, truck, unit, soldier,
    anchorIcon, helmetIcon, smoke, damage, burst, battle, airfield, blockIcon, rangeRing, tag, stamp, numeral, verdict, newspaper,
    photoCard, treaty, fmtInt, DEFS };
})(typeof window !== 'undefined' ? window : globalThis);
