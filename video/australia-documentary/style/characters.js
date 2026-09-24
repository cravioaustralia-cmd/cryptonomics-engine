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
 * blighSVG - flat-2D naval-governor figure (bicorne hat, tailed coat), for
 * the Chapter 5 "Bligh: zero for two" comedy beats (Mutiny on the Bounty,
 * then the Rum Rebellion). Pivots from the feet so callers can tip him
 * overboard with a simple rotate.
 */
export function blighSVG({
  x, y, scale = 1, rotate = 0, armAngleL, armAngleR, armAngle = -15, legAngle = 0, hatOn = true, color = "#1c2540",
}) {
  const aL = armAngleL ?? armAngle;
  const aR = armAngleR ?? armAngle;
  return `
    <g transform="translate(${x},${y}) rotate(${rotate}) scale(${scale})">
      <rect x="-10" y="-30" width="9" height="30" rx="3" fill="${color}" transform="rotate(${legAngle} -6 -30)"/>
      <rect x="1" y="-30" width="9" height="30" rx="3" fill="${color}" transform="rotate(${-legAngle} 6 -30)"/>
      <path d="M -13 -76 L 13 -76 L 16 -28 L 6 -28 L 6 -50 L -6 -50 L -6 -28 L -16 -28 Z" fill="${color}"/>
      <rect x="-13" y="-72" width="8" height="30" rx="3" fill="${color}" transform="rotate(${aL} -9 -72)"/>
      <rect x="5" y="-72" width="8" height="30" rx="3" fill="${color}" transform="rotate(${-aR} 9 -72)"/>
      <circle cx="0" cy="-86" r="11" fill="${PALETTE.sandstone}"/>
      ${hatOn ? `<path d="M -17 -90 Q 0 -103 17 -90 Q 0 -95 -17 -90 Z" fill="${color}"/>` : ""}
    </g>
  `;
}

/**
 * bicorneHatSVG - Bligh's hat, drawn standalone so it can be sent flying
 * off on its own arc during the "thrown overboard" gag.
 */
export function bicorneHatSVG({ x, y, scale = 1, rotate = 0, color = "#1c2540" }) {
  return `
    <g transform="translate(${x},${y}) rotate(${rotate}) scale(${scale})">
      <path d="M -17 0 Q 0 -13 17 0 Q 0 -5 -17 0 Z" fill="${color}"/>
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

/**
 * megalaniaSVG - the animated Megalania (giant monitor lizard) used for
 * Chapter 1's megafauna beat, per the style bible ("flat 2D animation
 * carries the funny moments... the megalania"). Separate body/legs/tail/
 * head so the pose can shift from dramatic (mouth open, roaring) to the
 * comedic "downgrade" beat against the modern huntsman spider.
 * All coordinates are local to the origin (feet/ground at y=0); the
 * outer group applies x/y/scale.
 */
export function megalaniaSVG({
  x,
  y,
  scale = 1,
  t = 0,
  mouthOpen = 0,
  tongueFlick = false,
  walking = false,
  facing = -1, // -1 = facing left, 1 = facing right
}) {
  const skinColor = "#5b6b4a";
  const skinDark = "#3d4a32";
  const bellyColor = "#8a9670";
  const sway = walking ? Math.sin(t * 3) * 4 : Math.sin(t * 1.2) * 1.5;
  const tailSway = Math.sin(t * 1.4 + 0.6) * 14;
  const tongueP = tongueFlick ? Math.max(0, Math.sin(t * 10)) : 0;

  const legWalk = walking ? Math.sin(t * 6) * 12 : 0;

  const legs = [-55, -18, 25, 60]
    .map((lx, i) => {
      const swing = i % 2 === 0 ? legWalk : -legWalk;
      return `<g transform="translate(${lx},-6) rotate(${swing})">
        <path d="M 0 0 L -6 16 L 8 16 Z" fill="${skinDark}"/>
      </g>`;
    })
    .join("");

  const tail = `
    <path d="M 70 -20 C 100 ${-24 + tailSway * 0.3}, 130 ${-10 + tailSway}, 150 ${2 + tailSway}"
      stroke="${skinColor}" stroke-width="16" stroke-linecap="round" fill="none"/>
    <path d="M 70 -20 C 100 ${-24 + tailSway * 0.3}, 130 ${-10 + tailSway}, 150 ${2 + tailSway}"
      stroke="${skinDark}" stroke-width="16" stroke-linecap="round" fill="none" opacity="0.15"/>
  `;

  const spots = [
    [-40, -30], [-10, -34], [20, -30], [45, -26], [-25, -20], [5, -22],
  ]
    .map(([sx, sy]) => `<circle cx="${sx}" cy="${sy}" r="3.5" fill="${skinDark}" opacity="0.45"/>`)
    .join("");

  const jawOpenDeg = mouthOpen * 34;
  const head = `
    <g transform="translate(-70,-24)">
      <!-- lower jaw -->
      <g transform="rotate(${jawOpenDeg} -6 4)">
        <path d="M -6 4 L -46 12 L -30 16 L -4 8 Z" fill="${skinDark}"/>
      </g>
      <!-- upper head -->
      <path d="M -6 -4 L -50 -6 L -42 4 L -6 4 Z" fill="${skinColor}"/>
      <!-- teeth row (visible more as jaw opens) -->
      <g opacity="${mouthOpen.toFixed(2)}">
        <path d="M -44 -5 L -42 0 L -40 -5 M -34 -5 L -32 0 L -30 -5 M -24 -5 L -22 0 L -20 -5"
          stroke="${PALETTE.cream}" stroke-width="1.6" fill="none"/>
      </g>
      <!-- tongue flick -->
      <g opacity="${tongueP.toFixed(2)}">
        <path d="M -48 -4 L -${(58 + tongueP * 14).toFixed(1)} -4" stroke="#c94b4b" stroke-width="1.6"/>
        <path d="M -${(58 + tongueP * 14).toFixed(1)} -4 L -${(62 + tongueP * 14).toFixed(1)} -6 M -${(58 + tongueP * 14).toFixed(1)} -4 L -${(62 + tongueP * 14).toFixed(1)} -2"
          stroke="#c94b4b" stroke-width="1.4"/>
      </g>
      <!-- eye -->
      <circle cx="-14" cy="-3" r="4.5" fill="${PALETTE.ink}"/>
      <circle cx="-15" cy="-4.5" r="1.4" fill="${PALETTE.cream}"/>
    </g>
  `;

  const body = `
    <g transform="translate(0,${sway.toFixed(2)})">
      <ellipse cx="0" cy="-22" rx="80" ry="24" fill="${skinColor}"/>
      <ellipse cx="0" cy="-10" rx="70" ry="12" fill="${bellyColor}" opacity="0.8"/>
      ${spots}
      ${tail}
      ${legs}
      ${head}
    </g>
  `;

  return `<g class="megalania" transform="translate(${x},${y}) scale(${facing * scale},${scale})">${body}</g>`;
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
