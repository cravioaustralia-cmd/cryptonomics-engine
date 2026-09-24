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
  // walk-cycle swing driven by lp.
  const legSwingL = lp * 10;
  const legSwingR = -lp * 10;
  const legs = `
    <g transform="translate(${x},${y})">
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
  const bodyY = y - 70;
  const body_ = `
    <g transform="translate(${x + 7},${bodyY})">
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
    <g transform="translate(${x + 18},${bodyY - 48}) rotate(${neckAngle})">
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

  return `<g class="emu">${legs}${body_}${headGroup}</g>`;
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
