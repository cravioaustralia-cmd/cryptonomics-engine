// Shared style kit for "The Entire History of Australia".
// Reused by every chapter so the whole film looks and moves consistently.
// Pure functions only — no timers, no CSS animation. Everything is driven
// by an explicit time value t (seconds) so renderFrame(t) stays deterministic.

export const PALETTE = {
  redOchre: "#a8481f",
  redOchreDeep: "#7a3216",
  eucalyptusGreen: "#4d6b52",
  eucalyptusGreenDeep: "#33473a",
  sandstone: "#d9b98a",
  sandstoneLight: "#efe0c3",
  outbackNightIndigo: "#141b2e",
  outbackNightIndigoDeep: "#0a0e1a",
  sunsetOrange: "#e0793a",
  cream: "#f6ecd9",
  ink: "#1a1410",
};

export const FONTS = {
  serif: '"Playfair Display", Georgia, serif',
  sans: '"Source Sans 3", "Helvetica Neue", Arial, sans-serif',
};

// ---- Easing --------------------------------------------------------------
// All take progress p in [0,1], return eased progress in [0,1].
export const ease = {
  linear: (p) => p,
  inOutCubic: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  outCubic: (p) => 1 - Math.pow(1 - p, 3),
  inCubic: (p) => p * p * p,
  outQuad: (p) => 1 - (1 - p) * (1 - p),
  outBack: (p) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
  },
};

// clamp01(x) restricts x to [0,1] — used before feeding progress into ease fns.
export function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

// progress(t, start, duration) -> eased [0,1] progress of an event that
// begins at `start` seconds and lasts `duration` seconds.
export function progress(t, start, duration, easeFn = ease.inOutCubic) {
  return easeFn(clamp01((t - start) / duration));
}

// ---- Camera helpers -------------------------------------------------------
// Each returns a CSS transform string for a <g> or <image> wrapping element.
// Coordinates are in the element's own local space (apply as transform-origin
// center, i.e. wrap the image in a group sized to the viewBox).

export function pushIn(t, { start, duration, from = 1, to = 1.12, easeFn = ease.inOutCubic }) {
  const p = progress(t, start, duration, easeFn);
  const s = from + (to - from) * p;
  return `scale(${s})`;
}

export function pan(t, { start, duration, fromX = 0, toX = 0, fromY = 0, toY = 0, easeFn = ease.inOutCubic }) {
  const p = progress(t, start, duration, easeFn);
  const x = fromX + (toX - fromX) * p;
  const y = fromY + (toY - fromY) * p;
  return `translate(${x}px, ${y}px)`;
}

// pushPan combines a push-in and a pan in one transform (most "documentary"
// image moves are both at once, e.g. push-in while drifting left).
export function pushPan(t, opts) {
  const s = pushIn(t, opts);
  const p = pan(t, opts);
  return `${p} ${s}`;
}

// parallax(t, depth, opts) - depth in [0,1], 0 = background (moves least),
// 1 = foreground (moves most). Used to split a 2.5D image into layers.
export function parallax(t, depth, { start, duration, distance = 40, easeFn = ease.inOutCubic }) {
  const p = progress(t, start, duration, easeFn);
  const x = -distance * depth * p;
  return `translate(${x}px, 0)`;
}

// ---- Grain + vignette -------------------------------------------------------
// Call once per page to inject the reusable SVG filter/gradient defs, then
// reference by id on any layer.
export function styleDefsSVG() {
  return `
    <filter id="filmGrain" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="noise" stitchTiles="stitch"/>
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0"/>
      <feComposite operator="over" in2="SourceGraphic"/>
    </filter>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.45"/>
    </radialGradient>
    <linearGradient id="warmGrade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${PALETTE.sunsetOrange}" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="${PALETTE.redOchreDeep}" stop-opacity="0.08"/>
    </linearGradient>
    <filter id="portraitBlur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="22"/>
    </filter>
    <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  `;
}

// ---- Images: landscape cover-crop, or portrait framed on a blurred backdrop ----
// Per the style bible: never stretch images or crop faces. Landscape images
// (or anything wide enough to already cover the frame) get a simple cover
// crop. True portrait images are shown centered at full height over a
// blurred, darkened copy of themselves, so nothing is stretched or cropped.
export function pictureLayerSVG({ href, imgW, imgH, frameW, frameH, darken = 0.5 }) {
  const imgAspect = imgW / imgH;
  const frameAspect = frameW / frameH;
  if (imgAspect >= frameAspect * 0.98) {
    return `<image href="${href}" x="0" y="0" width="${frameW}" height="${frameH}" preserveAspectRatio="xMidYMid slice"/>`;
  }
  const fgW = frameH * imgAspect;
  const fgX = (frameW - fgW) / 2;
  return `
    <g>
      <image href="${href}" x="0" y="0" width="${frameW}" height="${frameH}" preserveAspectRatio="xMidYMid slice" filter="url(#portraitBlur)"/>
      <rect x="0" y="0" width="${frameW}" height="${frameH}" fill="#000" opacity="${darken}"/>
      <image href="${href}" x="${fgX}" y="0" width="${fgW}" height="${frameH}" preserveAspectRatio="xMidYMid meet"/>
    </g>
  `;
}

// ---- Starfield ----
// Deterministic pseudo-random stars (fixed seed, no Math.random) so every
// render of the same t produces the same frame. Gentle horizontal drift +
// per-star twinkle.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function starsSVG({ w, h, t, count = 90, seed = 42, driftPxPerSec = 2.5, maxY = null }) {
  const rand = mulberry32(seed);
  const stars = [];
  const limitY = maxY ?? h;
  for (let i = 0; i < count; i++) {
    const x0 = rand() * w;
    const y = rand() * limitY;
    const r = 0.6 + rand() * 1.6;
    const phase = rand() * Math.PI * 2;
    const twinkleSpeed = 0.5 + rand() * 1.2;
    const x = ((x0 + t * driftPxPerSec) % (w + 20)) - 10;
    const opacity = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(t * twinkleSpeed + phase));
    stars.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${PALETTE.cream}" opacity="${opacity.toFixed(2)}"/>`);
  }
  return stars.join("");
}

// vignetteOverlayRect(w,h) - a full-frame rect using the vignette gradient.
export function vignetteOverlayRect(w, h) {
  return `<rect x="0" y="0" width="${w}" height="${h}" fill="url(#vignette)" pointer-events="none"/>`;
}

export function warmGradeOverlayRect(w, h) {
  return `<rect x="0" y="0" width="${w}" height="${h}" fill="url(#warmGrade)" pointer-events="none"/>`;
}

// ---- Text reveal -------------------------------------------------------
// wordRevealSpans(text, t, start, perWordDelay) -> HTML string of <tspan>s
// that fade + rise in one word at a time, for title cards.
export function wordRevealSpans(text, t, start, { perWordDelay = 0.12, riseDuration = 0.5, y = 0 } = {}) {
  const words = text.split(" ");
  return words
    .map((word, i) => {
      const wStart = start + i * perWordDelay;
      const p = progress(t, wStart, riseDuration, ease.outCubic);
      const dy = (1 - p) * 14;
      const opacity = p;
      return `<tspan x="50%" dy="0" dx="${i === 0 ? 0 : 6}" style="opacity:${opacity.toFixed(3)}" transform="translate(0,${dy.toFixed(2)})">${escapeXML(word)}</tspan>`;
    })
    .join(" ");
}

// simple fade-in helper for a whole block (subtitles, labels).
export function fadeIn(t, start, duration = 0.4) {
  return progress(t, start, duration, ease.outCubic);
}

// ---- Subtitles ----
// buildCaptionLines groups transcript words (from transcript.json) into
// short 1-2 line captions, breaking on sentence-ending punctuation or a
// max word count, whichever comes first.
export function buildCaptionLines(words, { maxWords = 8 } = {}) {
  const lines = [];
  let cur = [];
  for (const w of words) {
    cur.push(w);
    const endsSentence = /[.!?]$/.test(w.text);
    if (cur.length >= maxWords || endsSentence) {
      lines.push({ text: cur.map((x) => x.text).join(" "), start: cur[0].start, end: cur[cur.length - 1].end });
      cur = [];
    }
  }
  if (cur.length) {
    lines.push({ text: cur.map((x) => x.text).join(" "), start: cur[0].start, end: cur[cur.length - 1].end });
  }
  return lines;
}

// findActiveCaption - binary-search-free linear scan is fine at our line
// counts; returns the line active at time t, or null.
export function findActiveCaption(lines, t, trailing = 0.15) {
  for (const line of lines) {
    if (t >= line.start && t <= line.end + trailing) return line;
  }
  return null;
}

export function captionBarSVG({ w, h, text, fontSize = 30 }) {
  if (!text) return "";
  const maxCharsPerLine = 42;
  const words = text.split(" ");
  const rows = [];
  let row = "";
  for (const word of words) {
    if ((row + " " + word).trim().length > maxCharsPerLine) {
      rows.push(row.trim());
      row = word;
    } else {
      row = (row + " " + word).trim();
    }
  }
  if (row) rows.push(row);
  const lineHeight = fontSize * 1.3;
  const boxHeight = rows.length * lineHeight + 24;
  const boxY = h - boxHeight - 48;
  const textLines = rows
    .map((r, i) => `<tspan x="50%" dy="${i === 0 ? 0 : lineHeight}">${escapeXML(r)}</tspan>`)
    .join("");
  return `
    <rect x="${w / 2 - 620}" y="${boxY}" width="1240" height="${boxHeight}" rx="10" fill="#000" opacity="0.55"/>
    <text x="50%" y="${boxY + fontSize + 6}" text-anchor="middle" font-family="${FONTS.sans}" font-weight="600"
      font-size="${fontSize}" fill="${PALETTE.cream}">${textLines}</text>
  `;
}

export function escapeXML(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// ---- Chapter title card -------------------------------------------------
// Standard "CHAPTER N" label + large serif title + thin ochre underline,
// used at the start of every chapter (~2.5s reveal per PROMPT.md).
export function chapterTitleCardSVG({ w, h, t, start, chapterLabel, title }) {
  const labelP = fadeIn(t, start, 0.4);
  const titleP = progress(t, start + 0.25, 0.7, ease.outCubic);
  const underlineP = progress(t, start + 0.7, 0.5, ease.outCubic);
  const titleY = h / 2 + 10;
  const underlineWidth = 260 * underlineP;
  return `
    <rect x="0" y="0" width="${w}" height="${h}" fill="${PALETTE.outbackNightIndigoDeep}"/>
    <text x="50%" y="${titleY - 70}" text-anchor="middle" font-family="${FONTS.sans}"
      font-size="26" letter-spacing="8" fill="${PALETTE.sunsetOrange}" opacity="${labelP.toFixed(3)}">
      ${escapeXML(chapterLabel.toUpperCase())}
    </text>
    <text x="50%" y="${titleY}" text-anchor="middle" font-family="${FONTS.serif}"
      font-size="64" fill="${PALETTE.cream}" opacity="${titleP.toFixed(3)}"
      transform="translate(0, ${(1 - titleP) * 18})">
      ${escapeXML(title)}
    </text>
    <rect x="${w / 2 - underlineWidth / 2}" y="${titleY + 34}" width="${underlineWidth}" height="3" fill="${PALETTE.redOchre}"/>
  `;
}
