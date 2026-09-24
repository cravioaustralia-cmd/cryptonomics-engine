// Original flat-2D characters for "The Entire History of Australia".
// Every character is built from separate head / arms (or wings) / legs
// groups so poses can be driven purely by t (no freehand per-frame art).
// The recurring emu mascot is the one every chapter reuses.

import { PALETTE, ease, clamp01 } from "./style.js";

// blinkAmount(t, period, closedFraction) -> 0 (open) .. 1 (closed)
// A gentle periodic blink so the mascot reads as alive without any timers.
export function blinkAmount(t, period = 3.2, closedFraction = 0.12) {
  const phase = (t % period) / period;
  if (phase > closedFraction) return 0;
  // quick close-open within the closed window, eased
  const p = phase / closedFraction; // 0..1 across the blink
  const shape = p < 0.5 ? p * 2 : (1 - p) * 2;
  return ease.outQuad(clamp01(shape));
}

// legPhase(t, speed) -> -1..1 walk-cycle phase for simple leg animation.
export function legPhase(t, speed = 4) {
  return Math.sin(t * speed);
}

/**
 * emuSVG - draws the emu mascot as a self-contained SVG group.
 * @param {object} p
 * @param {number} p.x - center x in local units
 * @param {number} p.y - ground y (feet) in local units
 * @param {number} p.scale
 * @param {number} p.t - current time (seconds), drives blink/legs
 * @param {number} [p.neckBend] - -1..1, tilts the head/neck (curiosity/smug tilt)
 * @param {boolean} [p.walking] - animate legs via legPhase(t)
 * @param {boolean} [p.blinking] - animate eyes via blinkAmount(t)
 * @param {number} [p.mood] - 0..1, 0 = neutral, 1 = extra smug (raised brow, smaller eye)
 */
export function emuSVG({
  x,
  y,
  scale = 1,
  t = 0,
  neckBend = 0.15,
  walking = false,
  blinking = true,
  mood = 0.5,
}) {
  const blink = blinking ? blinkAmount(t) : 0;
  const eyeScaleY = 1 - blink * 0.92;
  const lp = walking ? legPhase(t) : 0;
  const body = PALETTE.ink === "#1a1410" ? "#3b332a" : PALETTE.ink; // body brown, independent of ink
  const bodyBrown = "#4a3f33";
  const bodyBrownDark = "#372e25";
  const legColor = "#c9a25a";
  const beakColor = "#2c2620";

  // Legs (separate group, behind body) — simple two-segment legs with a
  // walk-cycle swing driven by lp. All parts below are in local units
  // around the origin (feet at 0,0); the outer group applies x/y/scale.
  const legSwingL = lp * 10;
  const legSwingR = -lp * 10;
  const legs = `
    <g>
      <g transform="rotate(${legSwingL})">
        <rect x="-4" y="0" width="8" height="34" rx="3" fill="${legColor}"/>
        <path d="M -4 34 L -12 44 M 0 34 L 0 46 M 4 34 L 12 44" stroke="${legColor}" stroke-width="4" stroke-linecap="round" fill="none"/>
      </g>
      <g transform="translate(14,0) rotate(${legSwingR})">
        <rect x="-4" y="0" width="8" height="34" rx="3" fill="${legColor}"/>
        <path d="M -4 34 L -12 44 M 0 34 L 0 46 M 4 34 L 12 44" stroke="${legColor}" stroke-width="4" stroke-linecap="round" fill="none"/>
      </g>
    </g>
  `;

  // Body: rounded oval torso + shaggy feather texture via short strokes.
  const bodyY = -70;
  const body_ = `
    <g transform="translate(7,${bodyY})">
      <ellipse cx="0" cy="0" rx="46" ry="58" fill="${bodyBrown}"/>
      <ellipse cx="0" cy="0" rx="46" ry="58" fill="none" stroke="${bodyBrownDark}" stroke-width="1" opacity="0.4"/>
      ${featherStrokes(bodyBrownDark)}
      <!-- tiny vestigial wing -->
      <path d="M 34 -6 q 18 4 16 26 q -14 -4 -20 -18 Z" fill="${bodyBrownDark}"/>
    </g>
  `;

  // Neck + head, tilted by neckBend (smug/curious tilt).
  const neckAngle = neckBend * 18;
  const headGroup = `
    <g transform="translate(18,${bodyY - 48}) rotate(${neckAngle})">
      <path d="M -8 0 C -6 -40, 4 -70, 10 -92" stroke="${bodyBrown}" stroke-width="20" stroke-linecap="round" fill="none"/>
      <g transform="translate(10,-96)">
        <ellipse cx="0" cy="0" rx="17" ry="15" fill="${bodyBrown}"/>
        <!-- beak -->
        <path d="M 14 -2 L 34 3 L 14 9 Z" fill="${beakColor}"/>
        <!-- big expressive eye -->
        <g transform="translate(6,-4)">
          <ellipse cx="0" cy="0" rx="9" ry="${(9 * eyeScaleY).toFixed(2)}" fill="#fff"/>
          <ellipse cx="1.5" cy="0" rx="5" ry="${(5 * eyeScaleY).toFixed(2)}" fill="#20160f"/>
          <circle cx="3" cy="-2" r="1.6" fill="#fff" opacity="${(1 - blink).toFixed(2)}"/>
        </g>
        <!-- smug brow: a short raised line above the eye, more raised as mood increases -->
        <path d="M -2 ${(-10 - mood * 4).toFixed(1)} Q 6 ${(-15 - mood * 5).toFixed(1)}, 13 ${(-9 - mood * 3).toFixed(1)}"
          stroke="${bodyBrownDark}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </g>
    </g>
  `;

  return `<g class="emu" transform="translate(${x},${y}) scale(${scale})">${legs}${body_}${headGroup}</g>`;
}

// featherStrokes - a handful of short deterministic strokes suggesting
// shaggy emu plumage without any per-frame randomness (fixed pattern).
function featherStrokes(color) {
  const strokes = [
    [-20, -30, -14, -18],
    [-6, -40, -2, -26],
    [12, -36, 16, -22],
    [-24, -6, -18, 8],
    [0, -4, 2, 12],
    [20, -8, 24, 6],
    [-16, 24, -10, 36],
    [10, 26, 14, 38],
  ];
  return strokes
    .map(([x1, y1, x2, y2]) => `<path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="${color}" stroke-width="2" opacity="0.35" stroke-linecap="round"/>`)
    .join("");
}

/**
 * soldierSilhouetteSVG - simple flat-2D figure used for the hook's 1930s
 * soldiers and similar comic-historical scenes. Separate head/arms/legs
 * so poses can change per beat.
 */
export function soldierSilhouetteSVG({ x, y, scale = 1, armAngle = -20, legAngle = 0, color = "#2f3b2a" }) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <!-- legs -->
      <rect x="-10" y="0" width="9" height="30" rx="3" fill="${color}" transform="rotate(${legAngle})"/>
      <rect x="1" y="0" width="9" height="30" rx="3" fill="${color}" transform="rotate(${-legAngle})"/>
      <!-- torso -->
      <rect x="-13" y="-46" width="26" height="48" rx="6" fill="${color}"/>
      <!-- arm -->
      <rect x="-13" y="-42" width="8" height="30" rx="3" fill="${color}" transform="rotate(${armAngle} -9 -42)"/>
      <rect x="5" y="-42" width="8" height="30" rx="3" fill="${color}" transform="rotate(${-armAngle} 9 -42)"/>
      <!-- head -->
      <circle cx="0" cy="-56" r="11" fill="${color}"/>
      <!-- helmet brim -->
      <ellipse cx="0" cy="-60" rx="14" ry="4" fill="${color}"/>
    </g>
  `;
}

/**
 * machineGunSVG - a simple flat-2D Lewis-gun-style mounted machine gun on
 * a tripod, for the hook's Emu War cold open.
 */
export function machineGunSVG({ x, y, scale = 1, color = "#3a3a38" }) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <!-- tripod legs -->
      <path d="M 0 0 L -26 30 M 0 0 L 26 30 M 0 0 L 0 32" stroke="${color}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <!-- body -->
      <rect x="-6" y="-10" width="46" height="12" rx="4" fill="${color}"/>
      <!-- barrel -->
      <rect x="38" y="-8" width="34" height="6" rx="2" fill="${color}"/>
      <!-- drum magazine -->
      <circle cx="6" cy="-18" r="10" fill="${color}"/>
      <!-- handle -->
      <path d="M -6 2 L -10 16" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    </g>
  `;
}

/**
 * wheatFieldSVG - flat-2D 1930s wheat field backdrop with a soft dusk sky,
 * for the hook's cold open. Rows are deterministic (fixed pattern), no
 * per-frame randomness.
 */
export function wheatFieldSVG({ w, h, skyTop = "#caa15a", skyBottom = "#e7c27a", wheatColor = "#c9a338", wheatDark = "#a3801f" }) {
  const horizon = h * 0.62;
  let rows = "";
  const rowCount = 10;
  for (let i = 0; i < rowCount; i++) {
    const rowY = horizon + (i / rowCount) * (h - horizon);
    const stalks = Math.round(18 + i * 3);
    let stalkPath = "";
    for (let s = 0; s < stalks; s++) {
      const sx = (s / stalks) * w + (i % 2 === 0 ? 6 : 0);
      stalkPath += `M ${sx.toFixed(1)} ${rowY + 14} L ${(sx + 2).toFixed(1)} ${rowY - 6} `;
    }
    rows += `<path d="${stalkPath}" stroke="${i % 2 === 0 ? wheatColor : wheatDark}" stroke-width="2.2" opacity="0.85"/>`;
  }
  return `
    <linearGradient id="wheatSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${skyTop}"/>
      <stop offset="100%" stop-color="${skyBottom}"/>
    </linearGradient>
    <rect x="0" y="0" width="${w}" height="${horizon}" fill="url(#wheatSky)"/>
    <rect x="0" y="${horizon}" width="${w}" height="${h - horizon}" fill="${wheatColor}"/>
    ${rows}
  `;
}

/**
 * campfireSVG - a small animated flame (2-3 flicker layers) over simple
 * logs, driven by t so the flicker is deterministic.
 */
export function campfireSVG({ x, y, scale = 1, t = 0 }) {
  const flick1 = 1 + 0.08 * Math.sin(t * 9);
  const flick2 = 1 + 0.12 * Math.sin(t * 13 + 1.3);
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <ellipse cx="0" cy="4" rx="16" ry="4" fill="#2a1c12"/>
      <rect x="-14" y="-2" width="28" height="5" rx="2" fill="#5a3a20" transform="rotate(-6)"/>
      <rect x="-14" y="-2" width="28" height="5" rx="2" fill="#4a2f19" transform="rotate(10)"/>
      <g transform="scale(${flick1.toFixed(3)})">
        <path d="M 0 4 C -8 -6, -6 -16, 0 -26 C 6 -16, 8 -6, 0 4 Z" fill="${PALETTE.sunsetOrange}"/>
      </g>
      <g transform="scale(${flick2.toFixed(3)})">
        <path d="M 0 2 C -4 -6, -3 -12, 0 -18 C 3 -12, 4 -6, 0 2 Z" fill="#ffd27a"/>
      </g>
    </g>
  `;
}

// ---- Small flat icons for the "map fills with icons" hook beat ----

export function iconLizardSVG({ x, y, scale = 1, color = PALETTE.eucalyptusGreenDeep }) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <path d="M -20 4 C -14 -6, -2 -8, 6 -3 C 12 -7, 20 -6, 26 -1 L 22 2 C 16 -1, 12 0, 8 3 C 2 8, -10 9, -20 4 Z" fill="${color}"/>
      <path d="M -20 4 L -30 -2 M -18 6 L -27 4 M -14 8 L -20 14" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M 2 -6 L 4 -10 M 8 -6 L 10 -10 M -4 -7 L -3 -11" stroke="${color}" stroke-width="1.6" fill="none"/>
    </g>
  `;
}

export function iconShipSVG({ x, y, scale = 1, hullColor = "#5a3a24", sailColor = PALETTE.cream }) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <path d="M -18 6 L 18 6 L 12 14 L -12 14 Z" fill="${hullColor}"/>
      <rect x="-1" y="-24" width="2" height="30" fill="${hullColor}"/>
      <path d="M 1 -22 L 1 4 L 17 3 Z" fill="${sailColor}"/>
      <path d="M -1 -18 L -1 4 L -13 3 Z" fill="${sailColor}" opacity="0.9"/>
    </g>
  `;
}

export function iconGoldNuggetSVG({ x, y, scale = 1, color = "#e8b23a" }) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <path d="M -12 2 C -14 -8, -4 -14, 4 -12 C 14 -10, 14 0, 8 6 C 2 12, -8 10, -12 2 Z" fill="${color}"/>
      <path d="M -6 -4 L -2 -2 M 2 -6 L 5 -3 M -4 4 L 0 5" stroke="#fff3c9" stroke-width="1.6" opacity="0.7" fill="none"/>
    </g>
  `;
}

export function iconOperaHouseSVG({ x, y, scale = 1, color = PALETTE.cream }) {
  const shells = [0, 1, 2, 3].map((i) => {
    const dx = i * 9 - 13;
    const h = 22 - i * 2.5;
    return `<path d="M ${dx} 8 C ${dx - 6} ${8 - h * 0.4}, ${dx - 2} ${8 - h}, ${dx + 6} 8 Z" fill="${color}"/>`;
  });
  return `<g transform="translate(${x},${y}) scale(${scale})">${shells.join("")}<rect x="-20" y="8" width="46" height="4" fill="${color}"/></g>`;
}
