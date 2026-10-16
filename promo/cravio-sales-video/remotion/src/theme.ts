import {Easing, interpolate, spring} from 'remotion';

// ---- Brand tokens (brand-kit.md) ------------------------------------------
export const C = {
  navy: '#0A1628',
  navy2: '#12263F',
  cyan: '#00C2B2',
  mist: '#F4F7FA',
  slate: '#64748B',
  line: '#E2E8F0',
  track: '#E8EEF4', // logo track colour in the *-colour-on-dark files
  // UI surfaces on navy (navy tints only, no new hues)
  panel: '#11223A',
  panel2: '#0E1C31',
  panelHi: '#16304F',
  stroke: 'rgba(244,247,250,0.10)',
  strokeHi: 'rgba(244,247,250,0.18)',
  dim: 'rgba(244,247,250,0.55)',
  // status colours, allowed only for tags per the brief
  amber: '#F5A524',
  red: '#EF4444',
};

export const FONT_DISPLAY = '"Space Grotesk", system-ui, sans-serif';
export const FONT_UI = '"Inter", system-ui, sans-serif';

export const SHADOW = '0 30px 60px rgba(0,0,0,.35), 0 8px 18px rgba(0,0,0,.25)';
export const GLOW = (a = 0.55, r = 24) => `0 0 ${r}px rgba(0,194,178,${a})`;

// ---- Easing -----------------------------------------------------------------
export const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const QUINT_OUT = Easing.bezier(0.22, 1, 0.36, 1);
export const QUART_INOUT = Easing.bezier(0.76, 0, 0.24, 1);
export const CUBIC_INOUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EXPO_IN = Easing.bezier(0.7, 0, 0.84, 0);
export const BACK_OUT = Easing.bezier(0.34, 1.36, 0.64, 1); // ~5% overshoot

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 0..1 progress of an eased move that starts at t0 and lasts dur seconds. */
export const ramp = (t: number, t0: number, dur: number, ease = EXPO_OUT) =>
  interpolate(t, [t0, t0 + dur], [0, 1], {...clamp, easing: ease});

/** Map t through keyframes [t...] -> [v...] with one easing for every leg. */
export const keys = (t: number, ts: number[], vs: number[], ease = CUBIC_INOUT) =>
  interpolate(t, ts, vs, {...clamp, easing: ease});

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/**
 * Spring starting at t0. Default config overshoots ~5% (damping ratio ~0.69).
 */
export const sp = (
  t: number,
  t0: number,
  cfg: {damping?: number; mass?: number; stiffness?: number} = {},
  fps = 30,
) => {
  if (t < t0) return 0;
  return spring({
    frame: (t - t0) * fps,
    fps,
    config: {damping: 16, mass: 0.8, stiffness: 170, ...cfg},
  });
};

/** In/out visibility envelope: fades in over fin at a, out over fout ending at b. */
export const vis = (t: number, a: number, b: number, fin = 0.25, fout = 0.25) =>
  Math.min(ramp(t, a, fin, QUINT_OUT), 1 - ramp(t, b - fout, fout, CUBIC_INOUT));

/** Deterministic pseudo-random in [0,1). */
export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
