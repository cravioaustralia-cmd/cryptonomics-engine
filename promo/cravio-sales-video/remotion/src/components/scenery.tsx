import React from 'react';
import {AbsoluteFill} from 'remotion';
import {getLength, getPointAtLength} from '@remotion/paths';
import {C} from '../theme';

/** Navy -> #12263F ground with the hero's 80px grid, parallaxed by the camera. */
export const Background: React.FC<{camX?: number; camY?: number; w: number; h: number; grid?: number; haze?: number}> = ({
  camX = 0,
  camY = 0,
  w,
  h,
  grid = 1,
  haze = 1,
}) => {
  const cell = 80;
  const ox = -((camX * 0.35) % cell);
  const oy = -((camY * 0.35) % cell);
  return (
    <AbsoluteFill style={{background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navy} 35%, ${C.navy2} 100%)`}}>
      <AbsoluteFill
        style={{
          opacity: 0.075 * grid,
          backgroundImage: `linear-gradient(${C.mist} 1px, transparent 1px), linear-gradient(90deg, ${C.mist} 1px, transparent 1px)`,
          backgroundSize: `${cell}px ${cell}px`,
          backgroundPosition: `${ox}px ${oy}px`,
        }}
      />
      {/* very soft cyan haze for depth (the hero's glow, not a new hue) */}
      <AbsoluteFill
        style={{
          opacity: 0.5 * haze,
          background: `radial-gradient(ellipse ${w * 0.55}px ${h * 0.45}px at 50% 42%, rgba(0,194,178,0.07), transparent 70%)`,
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(4,10,20,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

/** Draw-on path helper: returns dash props for progress p of a path. */
export const dash = (d: string, p: number, from: 'start' | 'end' = 'start') => {
  const L = getLength(d);
  return {
    strokeDasharray: `${L} ${L + 10}`,
    strokeDashoffset: from === 'start' ? L * (1 - p) : -L * (1 - p),
  };
};

/** Glowing data pulse dot (layer-data-pulses style). */
export const PulseDot: React.FC<{x: number; y: number; r?: number; color?: string; opacity?: number}> = ({x, y, r = 7, color = C.cyan, opacity = 1}) => (
  <g opacity={opacity}>
    <circle cx={x} cy={y} r={r * 2.4} fill={color} opacity={0.22} style={{filter: 'blur(5px)'}} />
    <circle cx={x} cy={y} r={r} fill={color} />
  </g>
);

/** Pulses travelling along a path at a speed (px/s), spaced by `gap` px. */
export const Pulses: React.FC<{d: string; t: number; speed?: number; gap?: number; count?: number; offset?: number; r?: number; opacity?: number; white?: number[]}> = ({
  d,
  t,
  speed = 260,
  gap = 420,
  count = 6,
  offset = 0,
  r = 6,
  opacity = 1,
  white = [],
}) => {
  const L = getLength(d);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const s = (((t * speed + offset + i * gap) % L) + L) % L;
    const p = getPointAtLength(d, s)!;
    const edge = Math.min(1, s / 60, (L - s) / 60);
    out.push(<PulseDot key={i} x={p.x} y={p.y} r={r} opacity={opacity * edge} color={white.includes(i) ? C.mist : C.cyan} />);
  }
  return <>{out}</>;
};

export const pointAt = (d: string, frac: number) => {
  const L = getLength(d);
  return getPointAtLength(d, Math.max(0, Math.min(1, frac)) * L)!;
};
