/* s05-shark-arm-case — photo underlay + SVG motion graphics (no Remotion).
 *
 * One compositor scene drives eight beats so seams can be real crossfades / masked
 * wipes (both beats drawn), and captions are drawn here (word-highlight, phrase
 * chunks) instead of the engine default. Timings come from ../transcript.json.
 */
(function () {
  const W = 1080;
  const H = 1920;
  const CAP_Y = H * 0.7; // caption centre — lower-middle band

  // Palette — case-file noir over archival photos.
  const C = {
    ink: '#0b0f14',
    bone: '#f1e7d0',
    paper: '#e9dcbc',
    red: '#d3202f',
    amber: '#f2b134',
    teal: '#7fd6d0',
    marker: '#ffd21f',
  };
  const F = {
    display: "'Bebas Neue', 'Oswald', Impact, sans-serif",
    label: "'Oswald', 'Liberation Sans', sans-serif",
    type: "'Special Elite', 'Courier 10 Pitch', monospace",
  };

  // Source stills (px sizes used for cover/focal mapping).
  const IMG = {
    coogee: { url: '/img/s05_01_coogee_pier_1929.jpg', w: 3000, h: 2198 },
    shark: { url: '/img/s05_02_tiger_shark.jpg', w: 2303, h: 1708 },
    boxers: { url: '/img/s05_03_two_boxers.jpg', w: 3200, h: 2319 },
    police: { url: '/img/s05_04_police_court_sydney.jpg', w: 3648, h: 2736 },
    quay: { url: '/img/s05_05_circular_quay_1930.jpg', w: 1150, h: 1600 },
    sedan: { url: '/img/s05_06_1935_sedan.jpg', w: 1600, h: 1356 },
    court: { url: '/img/s05_07_darlinghurst_court.jpg', w: 2300, h: 1307 },
    shark2: { url: '/img/s05_08_tiger_shark_loop.jpg', w: 2861, h: 1896 },
  };

  // ---------- math ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const prog = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const eOut = (u) => 1 - Math.pow(1 - u, 3);
  const eInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const eBack = (u) => {
    const c1 = 1.70158;
    return 1 + (c1 + 1) * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
  };
  const rnd = (i) => {
    const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return s - Math.floor(s);
  };
  // in/out envelope: 0 → 1 over [a, a+fi], 1 → 0 over [b-fo, b]
  const env = (t, a, b, fi = 0.25, fo = 0.25) =>
    Math.min(eOut(prog(t, a, a + fi)), 1 - eInOut(prog(t, b - fo, b)));
  const esc = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const f1 = (n) => Math.round(n * 10) / 10;

  // Text measurement (fonts are loaded before __ready).
  const mctx = document.createElement('canvas').getContext('2d');
  function measure(text, font, ls = 0) {
    mctx.font = font;
    return mctx.measureText(text).width + ls * Math.max(0, text.length - 1);
  }

  // Unique ids per frame for clip paths / masks.
  let uid = 0;
  const nid = (p) => `${p}${uid++}`;
  let defs = '';

  // ---------- photo underlay ----------
  // Cover-fit a still so source point (cx, cy) sits at screen (540, 960), clamped so it
  // always fills the frame. Returns SVG and a source→screen mapper for pinning MG.
  function cam(img, cx, cy, zoom = 1, ox = 0, oy = 0) {
    const s = Math.max(W / img.w, H / img.h) * zoom;
    const dw = img.w * s;
    const dh = img.h * s;
    const x = clamp(540 + ox - cx * s, W - dw, 0);
    const y = clamp(960 + oy - cy * s, H - dh, 0);
    return { x, y, s, dw, dh, map: (sx, sy) => [x + sx * s, y + sy * s] };
  }
  function photo(img, c, filter = '', opacity = 1) {
    return `<image href="${img.url}" x="${f1(c.x)}" y="${f1(c.y)}" width="${f1(c.dw)}" height="${f1(c.dh)}"
      preserveAspectRatio="none" ${filter ? `filter="url(#${filter})"` : ''} opacity="${opacity}"/>`;
  }
  function dim(a) {
    return `<rect width="${W}" height="${H}" fill="${C.ink}" opacity="${a}"/>`;
  }

  // ---------- MG kit ----------
  // Photo slug: small archival chip, top-left. Says what the photo is (era / present-day).
  function slug(text, t, a, b) {
    const o = env(t, a, b, 0.35, 0.3);
    if (o <= 0) return '';
    const font = `500 25px ${F.label}`;
    const w = measure(text.toUpperCase(), font, 3) + 44;
    const slide = (1 - eOut(prog(t, a, a + 0.45))) * -30;
    return `<g opacity="${o}" transform="translate(${60 + slide} 150)">
      <rect x="0" y="0" width="${w}" height="44" rx="4" fill="rgba(11,15,20,0.72)" stroke="rgba(241,231,208,0.35)" stroke-width="1.5"/>
      <rect x="0" y="0" width="6" height="44" rx="2" fill="${C.red}"/>
      <text x="24" y="31" font-family="${F.label}" font-weight="500" font-size="25" letter-spacing="3"
        fill="${C.bone}">${esc(text.toUpperCase())}</text>
    </g>`;
  }

  // Big display lock-up with masked upward reveal + accent rule.
  function lockup(text, x, y, t, a, b, o = {}) {
    const size = o.size || 150;
    const anchor = o.anchor || 'start';
    const u = eOut(prog(t, a, a + 0.5));
    const out = b != null ? eInOut(prog(t, b - 0.35, b)) : 0;
    if (u <= 0 || out >= 1) return '';
    const font = `400 ${size}px ${F.display}`;
    const ls = o.ls != null ? o.ls : size * 0.03;
    const w = measure(text, font, ls);
    const x0 = anchor === 'middle' ? x - w / 2 : x;
    const id = nid('lk');
    defs += `<clipPath id="${id}"><rect x="${x0 - 20}" y="${y - size * 0.95}" width="${w + 40}" height="${size * 1.08}"/></clipPath>`;
    const dy = (1 - u) * size * 0.9 - out * size * 0.9;
    const rule = o.rule === false ? '' : `<rect x="${x0}" y="${y + 18}" width="${w * eOut(prog(t, a + 0.15, a + 0.7)) * (1 - out)}" height="8" fill="${o.ruleColor || C.red}"/>`;
    const sub = o.sub
      ? `<text x="${anchor === 'middle' ? x : x0 + 4}" y="${y + 68}" text-anchor="${anchor}" font-family="${F.label}" font-weight="${o.subWeight || 500}"
          font-size="${o.subSize || 34}" letter-spacing="${o.subLs != null ? o.subLs : 6}" fill="${o.subColor || C.bone}"
          ${o.subItalic ? 'font-style="italic"' : ''}
          opacity="${eOut(prog(t, a + 0.3, a + 0.8)) * (1 - out)}">${esc(o.sub)}</text>`
      : '';
    return `<g>
      <g clip-path="url(#${id})"><text x="${x}" y="${y + dy}" text-anchor="${anchor}" font-family="${F.display}"
        font-size="${size}" letter-spacing="${ls}" fill="${o.fill || C.bone}"
        style="filter: drop-shadow(0 6px 18px rgba(0,0,0,0.55))">${esc(text)}</text></g>
      ${rule}${sub}
    </g>`;
  }

  // Rubber stamp slam: overshoot scale-in, roughened ink edge.
  function stamp(text, cx, cy, t, a, o = {}) {
    if (t < a) return '';
    const size = o.size || 130;
    const col = o.color || C.red;
    const rot = o.rot != null ? o.rot : -8;
    const u = prog(t, a, a + 0.22);
    const sc = u < 1 ? lerp(2.1, 1, eOut(u)) : 1 + 0.012 * Math.exp(-(t - a - 0.22) * 6) * Math.sin((t - a) * 50);
    const op = eOut(prog(t, a, a + 0.08)) * (o.fade != null ? o.fade : 1);
    const font = `400 ${size}px ${F.display}`;
    const ls = size * 0.06;
    const w = measure(text, font, ls) + size * 0.55;
    const h = size * 1.12;
    return `<g opacity="${op}" transform="translate(${cx} ${cy}) rotate(${rot}) scale(${sc})" filter="url(#rough)">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="10" fill="none" stroke="${col}" stroke-width="9"/>
      <rect x="${-w / 2 + 14}" y="${-h / 2 + 14}" width="${w - 28}" height="${h - 28}" rx="6" fill="none" stroke="${col}" stroke-width="3"/>
      <text x="0" y="${size * 0.34}" text-anchor="middle" font-family="${F.display}" font-size="${size}"
        letter-spacing="${ls}" fill="${col}">${esc(text)}</text>
    </g>`;
  }

  // Typewriter tag on a paper strip; returns '' before start.
  function typed(text, x, y, t, a, o = {}) {
    if (t < a) return '';
    const size = o.size || 40;
    const cps = o.cps || 16;
    const n = Math.min(text.length, Math.floor((t - a) * cps) + 1);
    const shown = text.slice(0, n);
    const font = `400 ${size}px ${F.type}`;
    const full = measure(text, font, 2);
    const caret = n < text.length || Math.floor(t * 2.4) % 2 === 0 ? '▌' : '';
    const op = o.opacity != null ? o.opacity : 1;
    const paper = o.paper === false ? '' :
      `<rect x="${x - 18}" y="${y - size * 0.95}" width="${full + 60}" height="${size * 1.45}" fill="${o.bg || C.paper}" opacity="0.94"
        transform="rotate(${o.rot || 0} ${x} ${y})"/>`;
    return `<g opacity="${op}">${paper}
      <text x="${x}" y="${y}" font-family="${F.type}" font-size="${size}" letter-spacing="2" fill="${o.color || C.ink}"
        transform="rotate(${o.rot || 0} ${x} ${y})">${esc(shown)}<tspan fill="${C.red}">${caret}</tspan></text></g>`;
  }

  // Red strike-through drawn left→right.
  function strike(x, y, w, t, a) {
    const u = eOut(prog(t, a, a + 0.25));
    if (u <= 0) return '';
    return `<line x1="${x - 10}" y1="${y + 4}" x2="${x - 10 + (w + 20) * u}" y2="${y - 6}" stroke="${C.red}" stroke-width="9" stroke-linecap="round"/>`;
  }

  // Forensic evidence tent marker (yellow A-frame with number).
  function marker(num, x, y, t, a, scale = 1) {
    if (t < a) return '';
    const u = prog(t, a, a + 0.35);
    const drop = (1 - eBack(u)) * -60;
    const op = eOut(prog(t, a, a + 0.12));
    return `<g opacity="${op}" transform="translate(${x} ${y + drop}) scale(${scale})">
      <ellipse cx="0" cy="6" rx="62" ry="12" fill="rgba(0,0,0,0.45)"/>
      <path d="M-52,0 L-34,-104 L34,-104 L52,0 Z" fill="${C.marker}" stroke="#1a1a1a" stroke-width="3"/>
      <path d="M-34,-104 L34,-104 L28,-114 L-28,-114 Z" fill="#e6b800" stroke="#1a1a1a" stroke-width="3"/>
      <text x="0" y="-26" text-anchor="middle" font-family="${F.display}" font-size="78" fill="#111">${num}</text>
    </g>`;
  }

  // Map-style location pin drop with ripple.
  function pin(x, y, t, a, col = C.red) {
    if (t < a) return '';
    const u = prog(t, a, a + 0.5);
    const drop = (1 - eBack(u)) * -120;
    const rip = prog(t, a + 0.35, a + 1.2);
    return `<g>
      <ellipse cx="${x}" cy="${y}" rx="${20 + rip * 70}" ry="${(20 + rip * 70) * 0.35}" fill="none" stroke="${col}" stroke-width="4" opacity="${(1 - rip) * 0.9}"/>
      <g transform="translate(${x} ${y + drop})" opacity="${eOut(prog(t, a, a + 0.1))}">
        <path d="M0,0 C0,0 -34,-44 -34,-68 C-34,-88 -18,-104 0,-104 C18,-104 34,-88 34,-68 C34,-44 0,0 0,0 Z" fill="${col}" stroke="${C.bone}" stroke-width="4"/>
        <circle cx="0" cy="-68" r="12" fill="${C.bone}"/>
      </g></g>`;
  }

  // Camera AF brackets that hunt then lock onto a target.
  function brackets(cx, cy, size, t, a, col = C.bone, lockAt = null) {
    if (t < a) return '';
    const u = eOut(prog(t, a, a + 0.6));
    const hunt = (1 - u) * 90 + Math.sin((t - a) * 17) * 6 * (1 - u);
    const s = size + hunt;
    const L = 38;
    const locked = lockAt != null && t >= lockAt;
    const c = locked ? C.red : col;
    const pulse = locked ? 1 + 0.06 * Math.exp(-(t - lockAt) * 5) : 1;
    const hs = (s / 2) * pulse;
    const corner = (sx, sy) =>
      `<path d="M${cx + sx * hs},${cy + sy * (hs - L)} L${cx + sx * hs},${cy + sy * hs} L${cx + sx * (hs - L)},${cy + sy * hs}"
        fill="none" stroke="${c}" stroke-width="6" stroke-linecap="square"/>`;
    return `<g opacity="${eOut(prog(t, a, a + 0.15))}">${corner(-1, -1)}${corner(1, -1)}${corner(1, 1)}${corner(-1, 1)}
      <circle cx="${cx}" cy="${cy}" r="5" fill="${c}"/></g>`;
  }

  // Hand-inked ellipse drawn on (for circling detail in a photo).
  function inkRing(cx, cy, rx, ry, t, a, dur = 0.6, col = C.amber, rot = -6) {
    if (t < a) return '';
    const u = eOut(prog(t, a, a + dur));
    const len = 2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2) * 1.08;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${col}" stroke-width="10"
      stroke-linecap="round" stroke-dasharray="${len}" stroke-dashoffset="${len * (1 - u)}"
      transform="rotate(${rot} ${cx} ${cy})" filter="url(#rough)"/>`;
  }

  // Rising bubbles / drifting motes.
  function particles(t, n, o = {}) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const x0 = rnd(i + (o.seed || 0)) * W;
      const sp = (o.speed || 60) * (0.5 + rnd(i * 3.1));
      const r = (o.r || 4) * (0.4 + rnd(i * 7.7));
      const ph = rnd(i * 5.3) * (H + 200);
      const y = o.up === false ? ((ph + t * sp) % (H + 200)) - 100 : H + 100 - ((ph + t * sp) % (H + 200));
      const x = x0 + Math.sin(t * (0.6 + rnd(i) * 0.8) + i) * (o.sway || 14);
      const a = (o.alpha || 0.35) * (0.4 + rnd(i * 2.2) * 0.6);
      s += o.ring
        ? `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="none" stroke="rgba(220,245,255,${a})" stroke-width="1.6"/>`
        : `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="rgba(255,244,220,${a})"/>`;
    }
    return s;
  }

  // Underwater god-rays.
  function rays(t, alpha = 0.12) {
    let s = '';
    for (let i = 0; i < 6; i++) {
      const x = 80 + i * 190 + Math.sin(t * 0.5 + i * 1.7) * 60;
      const w = 60 + rnd(i) * 90;
      const a = alpha * (0.5 + 0.5 * Math.sin(t * 0.8 + i * 2.1));
      s += `<polygon points="${x},0 ${x + w},0 ${x + w * 2.6 + 180},${H} ${x + 120},${H}" fill="url(#rayG)" opacity="${f1(a * 100) / 100}"/>`;
    }
    return s;
  }

  // Rain streaks for the night car beat.
  function rain(t, n = 70) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const sp = 1500 + rnd(i * 4.4) * 900;
      const y = ((rnd(i * 9.1) * (H + 300) + t * sp) % (H + 300)) - 150;
      const x = rnd(i * 1.3) * (W + 200) - 100 - (y * 0.12);
      const l = 40 + rnd(i * 2.9) * 60;
      s += `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x - l * 0.12)}" y2="${f1(y + l)}" stroke="rgba(200,220,255,${f1((0.12 + rnd(i) * 0.18) * 100) / 100})" stroke-width="2"/>`;
    }
    return s;
  }

  // Camera shake offset for an impact at time a.
  function shake(t, a, amp = 18, decay = 7) {
    if (t < a) return [0, 0];
    const k = Math.exp(-(t - a) * decay) * amp;
    return [Math.sin((t - a) * 83) * k, Math.cos((t - a) * 67) * k];
  }

  function flash(t, a, col = '#fff', peak = 0.7, dur = 0.18) {
    if (t < a || t > a + dur) return '';
    return `<rect width="${W}" height="${H}" fill="${col}" opacity="${peak * (1 - prog(t, a, a + dur))}"/>`;
  }

  // Top / bottom legibility gradients.
  function grades(top = 0.55, bottom = 0.6) {
    return `<rect width="${W}" height="${H * 0.42}" fill="url(#topG)" opacity="${top}"/>
      <rect y="${H * 0.52}" width="${W}" height="${H * 0.48}" fill="url(#botG)" opacity="${bottom}"/>`;
  }

  // ---------- beats ----------
  // Beat 1 — Coogee, hook + 1935 + place.
  function hookText(t, o = 1) {
    const out = eInOut(prog(t, 2.25, 2.7));
    if (out >= 1 || o <= 0) return '';
    const id = nid('hk');
    defs += `<clipPath id="${id}"><rect x="0" y="${170 - out * 520}" width="${W}" height="620"/></clipPath>`;
    const pulse = 1 + 0.012 * Math.sin(t * 3.2);
    const hookW = measure('A HUMAN ARM', `400 200px ${F.display}`, 6);
    return `<g opacity="${o}" clip-path="url(#${id})"><g transform="translate(0 ${-out * 460})">
      <g transform="translate(540 440) scale(${pulse}) translate(-540 -440)">
        <text x="540" y="345" text-anchor="middle" font-family="${F.display}" font-size="132" letter-spacing="4"
          fill="${C.bone}" style="filter: drop-shadow(0 8px 20px rgba(0,0,0,0.7))">A SHARK COUGHED UP</text>
        <g transform="rotate(-2.5 540 500)">
          <rect x="${540 - hookW / 2 - 34}" y="392" width="${hookW + 68}" height="206" fill="${C.red}"/>
          <text x="540" y="563" text-anchor="middle" font-family="${F.display}" font-size="200" letter-spacing="6"
            fill="${C.bone}">A HUMAN ARM</text>
        </g>
      </g></g></g>`;
  }

  function beatCoogee(t) {
    const push = eInOut(prog(t, 0, 5.4));
    const c = cam(IMG.coogee, 1560, 1180, 1.02 + push * 0.12, lerp(20, -30, push), 0);
    const [sx, sy] = shake(t, 0, 10, 6);
    let s = `<g transform="translate(${sx} ${sy})">${photo(IMG.coogee, c, 'sepia')}</g>`;
    s += particles(t, 26, { speed: 18, r: 3, alpha: 0.28, up: false, seed: 11 });
    s += grades(0.8, 0.55);
    // 1935 — outlined numerals draw on, then fill.
    if (t >= 0.28) {
      const u = prog(t, 0.28, 0.95);
      const fillU = eOut(prog(t, 0.7, 1.2));
      const len = 1600;
      s += `<g transform="translate(90 ${1090 + (1 - eOut(prog(t, 0.28, 0.6))) * 40})">
        <text x="0" y="0" font-family="${F.display}" font-size="330" letter-spacing="10"
          fill="${C.bone}" fill-opacity="${fillU * 0.92}" stroke="${C.bone}" stroke-width="4"
          stroke-dasharray="${len}" stroke-dashoffset="${len * (1 - eOut(u))}"
          style="filter: drop-shadow(0 10px 24px rgba(0,0,0,0.6))">1935</text>
        <rect x="6" y="36" width="${520 * eOut(prog(t, 0.9, 1.4))}" height="10" fill="${C.red}"/>
      </g>`;
    }
    s += hookText(t);
    // Place lock-up after hook clears.
    s += pin(118, 432, t, 2.95);
    s += lockup('COOGEE', 170, 430, t, 3.05, null, { size: 170, sub: 'SYDNEY · NSW', subLs: 10 });
    s += slug('Photo · Coogee Beach & pier c.1929', t, 2.8, 6);
    return s;
  }

  // Beat 2 — tiger shark, the shock.
  function beatShark(t) {
    const u = prog(t, 5.0, 10.3);
    const c = cam(IMG.shark, lerp(1250, 1780, eInOut(u)), 800, 1.08 - u * 0.04);
    const [sx, sy] = shake(t, 5.32, 26, 5.5);
    let s = `<g transform="translate(${sx} ${sy})">${photo(IMG.shark, c, 'deep')}</g>`;
    s += rays(t);
    s += particles(t, 34, { speed: 110, r: 7, alpha: 0.5, ring: true, seed: 3, sway: 20 });
    s += grades(0.7, 0.55);
    // Shock rings from the mouth on "threw up".
    const [mx, my] = c.map(2050, 900);
    for (let k = 0; k < 3; k++) {
      const r = prog(t, 5.32 + k * 0.12, 6.3 + k * 0.12);
      if (r > 0 && r < 1)
        s += `<circle cx="${mx + sx}" cy="${my + sy}" r="${60 + r * 560}" fill="none" stroke="${C.bone}" stroke-width="${10 * (1 - r) + 1}" opacity="${(1 - r) * 0.7}"/>`;
    }
    s += flash(t, 5.32, C.bone, 0.55, 0.2);
    s += lockup('TIGER SHARK', 80, 390, t, 5.65, null, {
      size: 168, sub: 'Galeocerdo cuvier', subItalic: true, subLs: 2, subSize: 40, subWeight: 400, subColor: C.teal, ruleColor: C.teal,
    });
    s += slug('Present-day photo · tiger shark', t, 5.5, 10.4);
    // "In front of everyone" — the crowd snaps back in as a pinned print.
    if (t >= 7.7) {
      const pu = eBack(prog(t, 7.7, 8.2));
      const pw = 470;
      const ph = 340;
      const id = nid('pc');
      // Crop the crowd area of the Coogee still into the print.
      const sc = pw / 1400;
      defs += `<clipPath id="${id}"><rect x="-${pw / 2}" y="-${ph / 2}" width="${pw}" height="${ph}"/></clipPath>`;
      s += `<g transform="translate(${lerp(-300, 330, pu)} 880) rotate(${lerp(-18, -5, pu)})">
        <rect x="${-pw / 2 - 16}" y="${-ph / 2 - 16}" width="${pw + 32}" height="${ph + 70}" fill="${C.bone}"
          style="filter: drop-shadow(0 16px 30px rgba(0,0,0,0.6))"/>
        <g clip-path="url(#${id})">
          <image href="${IMG.coogee.url}" x="${-900 * sc - pw / 2}" y="${-1000 * sc - ph / 2}" width="${IMG.coogee.w * sc}" height="${IMG.coogee.h * sc}"
            preserveAspectRatio="none" filter="url(#sepia)"/>
        </g>
        <text x="${-pw / 2}" y="${ph / 2 + 40}" font-family="${F.type}" font-size="26" fill="${C.ink}">COOGEE · CROWD</text>
        <rect x="-60" y="${-ph / 2 - 34}" width="120" height="36" fill="rgba(241,231,208,0.7)" transform="rotate(4)"/>
      </g>`;
    }
    return s;
  }

  // Beat 3 — two boxers: the two clues, bitten vs cut.
  function beatBoxers(t) {
    const zin = eInOut(prog(t, 9.8, 14.2));
    const zin2 = eInOut(prog(t, 14.2, 20.4));
    const c = cam(IMG.boxers, lerp(1500, 1480, zin), lerp(1150, 1000, zin), 1.02 + zin * 0.14 + zin2 * 0.1);
    const [sx, sy] = shake(t, 17.38, 22, 6);
    let s = `<g transform="translate(${sx} ${sy})">${photo(IMG.boxers, c, 'mono')}</g>`;
    s += particles(t, 22, { speed: 14, r: 3, alpha: 0.22, up: false, seed: 29 });
    // cold forensic tint after "cut off"
    s += `<rect width="${W}" height="${H}" fill="#0b2a3a" opacity="${0.25 * eOut(prog(t, 17.3, 18))}"/>`;
    s += grades(0.75, 0.6);
    s += slug('Photo · boxers in the ring, 1920s', t, 10.1, 20.3);
    // Evidence markers 1 & 2 on "two things".
    s += marker('1', 150, 470, t, 10.84, 0.9);
    s += marker('2', 150, 700, t, 11.1, 0.9);
    // Clue 1 — tattoo of two boxers: ink rings on the two fighters, tag.
    const [b1x, b1y] = c.map(1165, 950);
    const [b2x, b2y] = c.map(1795, 950);
    s += `<g transform="translate(${sx} ${sy})">`;
    s += inkRing(b1x, b1y, 120, 170, t, 12.85, 0.5, C.amber, -8);
    s += inkRing(b2x, b2y, 120, 170, t, 13.25, 0.5, C.amber, 6);
    s += `</g>`;
    s += typed('TATTOO: TWO BOXERS', 250, 452, t, 12.8, { size: 40, cps: 22 });
    // Clue 2 — "bitten off" struck, "CUT OFF" stamp.
    const bw = measure('BITTEN OFF', `400 40px ${F.type}`, 2);
    s += typed('BITTEN OFF', 250, 682, t, 15.3, { size: 40, cps: 22 });
    s += strike(250, 668, bw, t, 15.75);
    s += stamp('CUT OFF', 600, 1060, t, 17.38, { size: 150, rot: -7 });
    // "With a knife" — a clean forensic cut line with blade glint + label.
    if (t >= 18.4) {
      const u = eOut(prog(t, 18.4, 18.75));
      const x1 = -40;
      const y1 = 880;
      const x2 = 1120;
      const y2 = 760;
      const xe = lerp(x1, x2, u);
      const ye = lerp(y1, y2, u);
      s += `<line x1="${x1}" y1="${y1}" x2="${xe}" y2="${ye}" stroke="${C.bone}" stroke-width="4" opacity="0.95"/>
        <line x1="${x1}" y1="${y1 + 10}" x2="${xe}" y2="${ye + 10}" stroke="${C.teal}" stroke-width="1.5" stroke-dasharray="4 10" opacity="0.8"/>`;
      if (u < 1) s += `<circle cx="${xe}" cy="${ye}" r="26" fill="url(#glint)"/>`;
      s += typed('FORENSICS: KNIFE', 96, 930, t, 19.1, { size: 36, cps: 24, bg: C.bone, rot: -6 });
    }
    return s;
  }

  // Beat 4 — Police courts: James Smith file.
  function beatPolice(t) {
    const u = eInOut(prog(t, 19.9, 25.2));
    const c = cam(IMG.police, 1560, 1500, 1.04 + u * 0.12, 0, lerp(40, -20, u));
    let s = photo(IMG.police, c, 'cool');
    s += grades(0.8, 0.6);
    s += dim(0.12);
    s += lockup('WATER POLICE COURTS', 80, 360, t, 20.45, null, { size: 104, sub: 'SYDNEY', subLs: 10 });
    s += slug('Present-day photo · Justice & Police Museum', t, 20.3, 25.0);
    // Missing-person file card slides in; name types on as it's spoken.
    const cu = eOut(prog(t, 20.6, 21.2));
    if (cu > 0) {
      const cx = lerp(-700, 90, cu);
      s += `<g transform="translate(${cx} 560) rotate(-2.5)">
        <rect x="0" y="0" width="760" height="520" rx="6" fill="${C.paper}" style="filter: drop-shadow(0 18px 34px rgba(0,0,0,0.6))"/>
        <rect x="0" y="0" width="760" height="70" rx="6" fill="#cdbd96"/>
        <text x="30" y="48" font-family="${F.label}" font-weight="600" font-size="30" letter-spacing="6" fill="${C.ink}">NSW POLICE · FILE</text>
        <line x1="30" y1="190" x2="730" y2="190" stroke="#9b8a66" stroke-width="2"/>
        <line x1="30" y1="330" x2="730" y2="330" stroke="#9b8a66" stroke-width="2"/>
        <text x="30" y="118" font-family="${F.label}" font-size="24" letter-spacing="4" fill="#6b5b3c">NAME</text>
        <text x="30" y="258" font-family="${F.label}" font-size="24" letter-spacing="4" fill="#6b5b3c">FORMERLY</text>
        <path d="M660,-30 L700,-30 L700,70 Q700,90 680,90 Q660,90 660,70 L660,0" fill="none" stroke="#8a8f96" stroke-width="6"/>
      </g>`;
      s += `<g transform="translate(${cx} 560) rotate(-2.5)">
        ${typed('JAMES SMITH', 30, 172, t, 21.72, { size: 64, cps: 18, paper: false })}
        ${typed('BOXER', 30, 312, t, 23.1, { size: 58, cps: 16, paper: false })}
      </g>`;
      s += stamp('MISSING', cx + 470, 1000, t, 24.05, { size: 112, rot: -10 });
    }
    return s;
  }

  // Beat 5 — Circular Quay c.1930: not an attack — murder; the "delivery" route.
  function beatQuay(t) {
    const u = eInOut(prog(t, 24.4, 30.8));
    const c = cam(IMG.quay, 575, 800, 1.02 + u * 0.1, 0, lerp(60, -40, u));
    const [sx, sy] = shake(t, 26.95, 20, 6);
    let s = `<g transform="translate(${sx} ${sy})">${photo(IMG.quay, c, 'sepia')}</g>`;
    s += particles(t, 20, { speed: 16, r: 3, alpha: 0.25, up: false, seed: 41 });
    // Vignette darkens on "delivery service".
    s += `<rect width="${W}" height="${H}" fill="url(#vig)" opacity="${0.5 + 0.5 * eOut(prog(t, 27.7, 29.2))}"/>`;
    s += grades(0.8, 0.6);
    s += slug('Photo · Circular Quay, Sydney c.1930', t, 25.0, 30.5);
    // "SHARK ATTACK" typed and struck; "MURDER" stamp.
    const w = measure('SHARK ATTACK', `400 46px ${F.type}`, 2);
    s += typed('SHARK ATTACK', 90, 330, t, 25.5, { size: 46, cps: 24 });
    s += strike(90, 314, w, t, 26.05);
    // "Delivery service": a fin glides across the harbour trailing a dashed wake.
    const pts = [[120, 700], [380, 660], [640, 640], [900, 600], [1130, 560]].map(([x, y]) => c.map(x, y));
    const d = 'M' + pts.map((p) => p.map(f1).join(',')).join(' L');
    const ru = eInOut(prog(t, 27.8, 29.9));
    if (ru > 0) {
      const mid = nid('rm');
      defs += `<mask id="${mid}"><path d="${d}" fill="none" stroke="#fff" stroke-width="40" pathLength="1000"
        stroke-dasharray="1000" stroke-dashoffset="${f1(1000 * (1 - ru))}"/></mask>`;
      const seg = ru * (pts.length - 1);
      const i = Math.min(pts.length - 2, Math.floor(seg));
      const f = seg - i;
      const fx = lerp(pts[i][0], pts[i + 1][0], f);
      const fy = lerp(pts[i][1], pts[i + 1][1], f);
      s += `<g transform="translate(${sx} ${sy})">
        <path d="${d}" fill="none" stroke="${C.red}" stroke-width="6" stroke-dasharray="18 14" mask="url(#${mid})"/>
        <g transform="translate(${f1(fx)} ${f1(fy)})"><path d="M-30,6 Q-6,-8 4,-52 Q14,-18 34,6 Z" fill="${C.ink}" stroke="${C.bone}" stroke-width="3"/>
          <path d="M-50,10 Q0,0 50,10" fill="none" stroke="${C.bone}" stroke-width="3" opacity="0.8"/></g></g>`;
    }
    s += stamp('MURDER', 540, 1040, t, 26.95, { size: 190, rot: -9 });
    return s;
  }

  // Beat 6 — period sedan at night: suspect, key witness, lights out.
  function beatSedan(t) {
    const u = eInOut(prog(t, 30.0, 38.2));
    const c = cam(IMG.sedan, 800, 700, 1.0 + u * 0.08);
    const out = t >= 35.95; // "shot dead" — the lights cut
    const [sx, sy] = shake(t, 35.95, 16, 5);
    let s = `<g transform="translate(${sx} ${sy})">${photo(IMG.sedan, c, 'night')}`;
    // Headlight glows.
    const [h1x, h1y] = c.map(462, 600);
    const [h2x, h2y] = c.map(1148, 600);
    const on = out ? 0 : 0.75 + 0.15 * Math.sin(t * 9) * Math.sin(t * 3.7);
    const flick = t > 35.7 && t < 35.95 ? (Math.floor(t * 30) % 2 ? 0.2 : 1) : 1;
    const ramp = eOut(prog(t, 30.6, 31.2));
    if (on > 0) {
      for (const [hx, hy] of [[h1x, h1y], [h2x, h2y]]) {
        s += `<circle cx="${hx}" cy="${hy}" r="260" fill="url(#headG)" opacity="${on * flick * ramp}"/>`;
      }
      s += `<polygon points="${h1x},${h1y} ${h2x},${h2y} ${h2x + 400},${H} ${h1x - 400},${H}" fill="url(#beamG)" opacity="${0.35 * on * flick * ramp}"/>`;
    }
    s += `</g>`;
    s += rain(t);
    // Keep the present-day number plate out of the frame language.
    s += `<rect y="1560" width="${W}" height="360" fill="url(#plateG)"/>`;
    s += `<rect width="${W}" height="${H}" fill="${C.ink}" opacity="${out ? 0.35 * eOut(prog(t, 35.95, 36.6)) : 0}"/>`;
    s += grades(0.8, 0.65);
    s += slug('Present-day photo · 1934–35 Buick sedan', t, 30.6, 37.8);
    // Suspect / witness tags.
    const wDim = out ? 1 - 0.65 * eOut(prog(t, 35.95, 36.4)) : 1;
    s += typed('SUSPECT: ARRESTED', 90, 330, t, 31.0, { size: 44, cps: 24 });
    s += `<g opacity="${wDim}">${typed('KEY WITNESS', 90, 440, t, 32.6, { size: 44, cps: 20, bg: C.amber })}</g>`;
    if (out) {
      const ww = measure('KEY WITNESS', `400 44px ${F.type}`, 2);
      s += strike(90, 425, ww, t, 36.05);
    }
    s += flash(t, 35.95, '#000', 0.9, 0.35);
    return s;
  }

  // Beat 7 — Darlinghurst Court House: acquitted, never found.
  function beatCourt(t) {
    const u = eInOut(prog(t, 37.4, 43.4));
    const c = cam(IMG.court, 1600, 700, 1.22 - u * 0.2, 0, 30);
    const [sx, sy] = shake(t, 39.36, 14, 6);
    let s = `<g transform="translate(${sx} ${sy})">${photo(IMG.court, c, 'warmnight')}</g>`;
    s += particles(t, 18, { speed: 12, r: 3, alpha: 0.2, up: false, seed: 57 });
    s += grades(0.85, 0.65);
    s += slug('Present-day photo · Darlinghurst Court House', t, 38.0, 43.4);
    s += lockup('DARLINGHURST', 80, 350, t, 38.05, null, { size: 140, sub: 'COURT HOUSE · SYDNEY', subLs: 8 });
    s += stamp('ACQUITTED', 540, 820, t, 39.36, { size: 150, rot: -6, color: C.amber });
    s += typed('BODY: NEVER FOUND', 210, 1080, t, 40.5, { size: 46, cps: 14 });
    return s;
  }

  // Beat 8 — the only witness: brackets lock onto the shark's eye; loops to frame 1.
  function beatLoop(t) {
    const u = eInOut(prog(t, 42.8, 47.3));
    const c = cam(IMG.shark2, lerp(1600, 1640, u), 900, 1.05 + u * 0.12);
    const [sx, sy] = shake(t, 46.5, 16, 6);
    let s = `<g transform="translate(${sx} ${sy})">${photo(IMG.shark2, c, 'deep')}</g>`;
    s += rays(t, 0.1);
    s += particles(t, 30, { speed: 90, r: 6, alpha: 0.45, ring: true, seed: 71, sway: 18 });
    s += grades(0.7, 0.6);
    s += slug('Present-day photo · tiger shark', t, 43.2, 46.6);
    const [ex, ey] = c.map(1552, 862);
    s += brackets(ex + sx, ey + sy, 230, t, 44.05, C.bone, 46.5);
    // Tag leader from brackets to a typed label.
    if (t >= 44.3) {
      const lu = eOut(prog(t, 44.3, 44.7));
      const lx = Math.max(ex + sx - 140, 420);
      const ly = ey + sy - 170;
      s += `<path d="M${ex + sx - 115},${ey + sy - 115} L${lerp(ex + sx - 115, lx, lu)},${lerp(ey + sy - 115, ly, lu)} L${lx - 260 * lu},${ly}"
        fill="none" stroke="${t >= 46.5 ? C.red : C.bone}" stroke-width="4"/>`;
      s += typed('WITNESS 01', Math.max(80, lx - 300), ly - 20, t, 44.5, { size: 44, cps: 18, bg: t >= 46.5 ? C.amber : C.paper });
    }
    s += flash(t, 46.5, C.bone, 0.35, 0.16);
    return s;
  }

  // Beat list (seams retuned to Whisper word timings).
  const BEATS = [
    { start: 0, draw: beatCoogee },
    { start: 5.02, draw: beatShark, tin: 0.45, wipe: 'water' },
    { start: 9.95, draw: beatBoxers, tin: 0.4, wipe: 'fade' },
    { start: 20.2, draw: beatPolice, tin: 0.4, wipe: 'slide' },
    { start: 24.82, draw: beatQuay, tin: 0.4, wipe: 'fade' },
    { start: 30.42, draw: beatSedan, tin: 0.4, wipe: 'slide' },
    { start: 37.72, draw: beatCourt, tin: 0.5, wipe: 'fade' },
    { start: 43.05, draw: beatLoop, tin: 0.45, wipe: 'water' },
  ];
  const DUR = 47.208;
  const LOOP_FADE = 0.25; // last frames dissolve into the frame-1 look

  function transition(kind, u, inner) {
    if (kind === 'fade') return `<g opacity="${eInOut(u)}">${inner}</g>`;
    const id = nid('tm');
    if (kind === 'water') {
      // Wavy tide line rising from the bottom.
      const e = eInOut(u);
      const base = H + 120 - e * (H + 260);
      let d = `M0,${H + 10} L0,${base}`;
      for (let x = 0; x <= W; x += 40) d += ` L${x},${f1(base + Math.sin(x / 90 + u * 9) * 40 * (1 - e * 0.5))}`;
      d += ` L${W},${H + 10} Z`;
      defs += `<mask id="${id}"><path d="${d}" fill="#fff"/></mask>`;
      return `<g mask="url(#${id})">${inner}</g>
        <path d="${d.replace(/ L\d+,\d+ Z$/, '')}" fill="none" stroke="rgba(220,245,255,0.6)" stroke-width="5" opacity="${1 - e}"/>`;
    }
    // 'slide' — diagonal masked wipe with a red leading edge.
    const e = eInOut(u);
    const x = -500 + e * (W + 1000);
    defs += `<mask id="${id}"><polygon points="-600,0 ${x},0 ${x - 400},${H} -600,${H}" fill="#fff"/></mask>`;
    return `<g mask="url(#${id})">${inner}</g>
      <line x1="${x}" y1="0" x2="${x - 400}" y2="${H}" stroke="${C.red}" stroke-width="10" opacity="${e < 1 ? 1 : 0}"/>`;
  }

  // ---------- captions ----------
  const CHUNKS = [2, 3, 3, 4, 4, 3, 1, 4, 4, 3, 5, 4, 2, 5, 3, 5, 2, 3, 3, 5, 4, 3, 5, 4, 3, 4, 3, 3, 4, 4, 5, 3, 5, 3];
  let caps = null;
  function buildCaps(words) {
    const out = [];
    let i = 0;
    for (const n of CHUNKS) {
      const ws = words.slice(i, i + n);
      i += n;
      if (!ws.length) break;
      out.push({ words: ws, start: ws[0].start - 0.06 });
    }
    for (; i < words.length; i++) out.push({ words: [words[i]], start: words[i].start - 0.06 });
    out.forEach((c, k) => {
      const last = c.words[c.words.length - 1].end + 0.4;
      c.end = k + 1 < out.length ? Math.min(last, out[k + 1].start) : Math.min(last, DUR - LOOP_FADE);
    });
    return out;
  }
  function captions(t) {
    const ep = window.EPISODE;
    if (!caps && ep.words && ep.words.length) caps = buildCaps(ep.words);
    if (!caps) return '';
    const cap = caps.find((c) => t >= c.start && t < c.end);
    if (!cap) return '';
    const size = 66;
    const font = `600 ${size}px ${F.label}`;
    const words = cap.words.map((w) => ({ ...w, txt: w.word.toUpperCase() }));
    const space = measure(' ', font);
    // wrap to ≤ 820px lines
    const lines = [[]];
    let lw = 0;
    for (const w of words) {
      w.w = measure(w.txt, font, 1);
      if (lines[lines.length - 1].length && lw + space + w.w > 820) {
        lines.push([]);
        lw = 0;
      }
      lw += (lines[lines.length - 1].length ? space : 0) + w.w;
      lines[lines.length - 1].push(w);
    }
    const lh = 84;
    const u = prog(t, cap.start, cap.start + 0.14);
    const sc = lerp(0.92, 1, eBack(u));
    const op = eOut(u) * (1 - prog(t, cap.end - 0.08, cap.end));
    let s = '';
    lines.forEach((ln, li) => {
      const total = ln.reduce((a, w, k) => a + w.w + (k ? space : 0), 0);
      let x = 540 - total / 2;
      const y = CAP_Y + (li - (lines.length - 1) / 2) * lh + size * 0.36;
      for (const w of ln) {
        const active = t >= w.start - 0.04 && t < w.end + 0.08;
        const said = t >= w.start - 0.04;
        const fill = active ? C.amber : said ? '#ffffff' : 'rgba(255,255,255,0.78)';
        s += `<text x="${f1(x)}" y="${f1(y)}" font-family="${F.label}" font-weight="600" font-size="${size}" letter-spacing="1"
          fill="${fill}" stroke="#05070a" stroke-width="11" stroke-linejoin="round" paint-order="stroke">${esc(w.txt)}</text>`;
        x += w.w + space;
      }
    });
    return `<g opacity="${op}" transform="translate(540 ${CAP_Y}) scale(${sc}) translate(-540 ${-CAP_Y})"
      style="filter: drop-shadow(0 6px 14px rgba(0,0,0,0.55))">${s}</g>`;
  }

  // ---------- shared defs ----------
  function staticDefs(frame) {
    return `
      <linearGradient id="topG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#05070a" stop-opacity="0.95"/><stop offset="1" stop-color="#05070a" stop-opacity="0"/></linearGradient>
      <linearGradient id="botG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#05070a" stop-opacity="0"/><stop offset="0.45" stop-color="#05070a" stop-opacity="0.75"/>
        <stop offset="1" stop-color="#05070a" stop-opacity="0.95"/></linearGradient>
      <radialGradient id="vig" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/></radialGradient>
      <radialGradient id="headG"><stop offset="0" stop-color="#fff8dc" stop-opacity="1"/><stop offset="0.18" stop-color="#ffe9a8" stop-opacity="0.8"/>
        <stop offset="1" stop-color="#ffcf6b" stop-opacity="0"/></radialGradient>
      <linearGradient id="beamG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8" stop-opacity="0.6"/>
        <stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></linearGradient>
      <linearGradient id="rayG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cff6ff" stop-opacity="1"/>
        <stop offset="1" stop-color="#cff6ff" stop-opacity="0"/></linearGradient>
      <linearGradient id="plateG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070a" stop-opacity="0"/>
        <stop offset="0.35" stop-color="#05070a" stop-opacity="0.97"/><stop offset="1" stop-color="#05070a" stop-opacity="1"/></linearGradient>
      <radialGradient id="glint"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#bff" stop-opacity="0"/></radialGradient>
      <filter id="sepia" color-interpolation-filters="sRGB"><feColorMatrix type="matrix"
        values="0.36 0.62 0.12 0 0.02  0.30 0.56 0.10 0 0.01  0.22 0.42 0.08 0 0  0 0 0 1 0"/>
        <feComponentTransfer><feFuncR type="linear" slope="1.08" intercept="-0.04"/><feFuncG type="linear" slope="1.08" intercept="-0.04"/><feFuncB type="linear" slope="1.08" intercept="-0.04"/></feComponentTransfer></filter>
      <filter id="mono" color-interpolation-filters="sRGB"><feColorMatrix type="matrix"
        values="0.30 0.55 0.12 0 0  0.29 0.54 0.12 0 0  0.28 0.52 0.12 0 0.01  0 0 0 1 0"/>
        <feComponentTransfer><feFuncR type="linear" slope="1.15" intercept="-0.06"/><feFuncG type="linear" slope="1.15" intercept="-0.06"/><feFuncB type="linear" slope="1.15" intercept="-0.05"/></feComponentTransfer></filter>
      <filter id="deep" color-interpolation-filters="sRGB"><feColorMatrix type="matrix"
        values="0.75 0.1 0 0 -0.03  0 0.9 0.1 0 0  0 0.1 0.95 0 0.03  0 0 0 1 0"/></filter>
      <filter id="cool" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0.45"/>
        <feColorMatrix type="matrix" values="0.85 0 0 0 0  0 0.92 0 0 0.01  0 0 1.02 0 0.03  0 0 0 1 0"/></filter>
      <filter id="night" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0.35"/>
        <feColorMatrix type="matrix" values="0.42 0 0 0 0  0 0.5 0 0 0.01  0 0 0.72 0 0.04  0 0 0 1 0"/></filter>
      <filter id="warmnight" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0.7"/>
        <feColorMatrix type="matrix" values="0.85 0 0 0 0  0 0.8 0 0 0  0 0 0.85 0 0.02  0 0 0 1 0"/></filter>
      <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="5" result="d"/>
        <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="1" seed="3" result="n2"/>
        <feColorMatrix in="n2" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.4 2.75" result="holes"/>
        <feComposite in="d" in2="holes" operator="in"/></filter>
      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="${frame % 12}" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.4 -0.45"/></filter>`;
  }

  function compose(t) {
    uid = 0;
    defs = '';
    let i = 0;
    for (let k = 0; k < BEATS.length; k++) if (t >= BEATS[k].start) i = k;
    const b = BEATS[i];
    let body = '';
    if (i > 0 && b.tin && t < b.start + b.tin) {
      body += BEATS[i - 1].draw(t);
      body += transition(b.wipe, prog(t, b.start, b.start + b.tin), b.draw(t));
    } else {
      body += b.draw(t);
    }
    // Loop: dissolve into the opening frame (Coogee + hook) so the replay is seamless.
    if (t > DUR - LOOP_FADE) {
      const u = eInOut(prog(t, DUR - LOOP_FADE, DUR - 1 / 30));
      const c = cam(IMG.coogee, 1560, 1180, 1.02, 20, 0);
      body += `<g opacity="${u}">${photo(IMG.coogee, c, 'sepia')}${grades(0.8, 0.55)}${hookText(0)}</g>`;
    }
    return body;
  }

  // Decode every still up front so no frame is captured before its underlay is ready.
  const keep = [];
  const ready = Promise.all(
    Object.values(IMG).map((im) => {
      const el = new Image();
      el.src = im.url;
      keep.push(el);
      return el.decode().catch(() => null);
    })
  );

  window.EPISODE = {
    ready,
    duration: DUR,
    fps: 30,
    words: [],
    _caps: [], // engine captions disabled; drawn by this file
    scenes: [
      {
        id: 'compositor',
        start: 0,
        end: DUR + 1,
        draw: (t) => {
          const frame = Math.round(t * 30);
          const body = compose(t);
          const cap = captions(t);
          return `<defs>${staticDefs(frame)}${defs}</defs>${body}
            <rect width="${W}" height="${H}" fill="url(#vig)" opacity="0.45"/>
            <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.07"/>
            ${cap}`;
        },
      },
    ],
  };
})();
