import React from 'react';
import {C, CUBIC_INOUT, EXPO_OUT, ramp, sp} from '../theme';
import {WORDMARK_H, WORDMARK_S} from './assets.gen';

// Circuit Track C geometry (120-unit icon box), copied from the logo files:
//   arc  M 87.227 35.895 A 37.5 37.5 0 1 0 87.227 84.105   stroke 13.5
// centre (58.5, 60), r 37.5, from -40deg counter-clockwise through the left to +40deg.
export const MARK = {cx: 58.5, cy: 60, r: 37.5, sw: 13.5, a0: -40, sweep: 280};
const ARC_LEN = (Math.PI * 2 * MARK.r * MARK.sweep) / 360;

const pt = (a: number, r = MARK.r) => {
  const rad = (a * Math.PI) / 180;
  return [MARK.cx + r * Math.cos(rad), MARK.cy + r * Math.sin(rad)];
};

/** Arc in mark space from angle a0 going counter-clockwise by `sweep` degrees. */
export const arcPath = (a0: number, sweep: number, r = MARK.r) => {
  const s = Math.max(0.01, Math.min(359.9, sweep));
  const [x0, y0] = pt(a0, r);
  const [x1, y1] = pt(a0 - s, r);
  return `M ${x0.toFixed(3)} ${y0.toFixed(3)} A ${r} ${r} 0 ${s > 180 ? 1 : 0} 0 ${x1.toFixed(3)} ${y1.toFixed(3)}`;
};

// Exact static path from the files (used whenever the arc is fully drawn).
const ARC_D = 'M 87.227 35.895 A 37.5 37.5 0 1 0 87.227 84.105';

// Nodes and the fraction of the arc at which the drawing trace reaches them.
const NODES = [
  {f: 0.0, el: 'endTop'},
  {f: 50 / 280, el: 'top'},
  {f: 140 / 280, el: 'left'},
  {f: 230 / 280, el: 'bottom'},
  {f: 1.0, el: 'endBottom'},
] as const;

export type MarkAnim = {
  /** time the draw starts; undefined = static, fully drawn */
  t0?: number;
  /** draw duration (s) */
  dur?: number;
  /** current time */
  t?: number;
  /** time of a one-off pulse ring on the nodes */
  pulseAt?: number;
  /** 0..1 cyan overlay on the drawing trace (settles to 0 = exact logo) */
  cyanArc?: number;
};

const easeArc = (t: number, t0: number, dur: number) => ramp(t, t0, dur, CUBIC_INOUT);

/** First time at which the eased arc progress reaches f (numeric inverse). */
const reachTime = (f: number, t0: number, dur: number) => {
  for (let i = 0; i <= 60; i++) {
    const tt = t0 + (dur * i) / 60;
    if (easeArc(tt, t0, dur) >= f - 1e-4) return tt;
  }
  return t0 + dur;
};

/** The mark as an SVG <g> in 120-unit space. */
export const MarkG: React.FC<MarkAnim> = ({t0, dur = 0.9, t = 0, pulseAt, cyanArc = 0}) => {
  const animated = t0 !== undefined;
  const p = animated ? easeArc(t, t0!, dur) : 1;
  const pop = (f: number, extra = 0) => {
    if (!animated) return 1;
    const tr = reachTime(f, t0!, dur) + extra;
    return sp(t, tr, {damping: 15, mass: 0.6, stiffness: 220});
  };
  const sNode = (i: number) => pop(NODES[i].f, 0.02);
  const chip = pop(1, 0.12);
  const pulse = pulseAt !== undefined ? ramp(t, pulseAt, 0.7, EXPO_OUT) : 0;
  const pulseOn = pulseAt !== undefined && t >= pulseAt && t < pulseAt + 0.7;

  const node = (cx: number, cy: number, r: number, fill: string, s: number) => (
    <circle cx={cx} cy={cy} r={r * s} fill={fill} />
  );
  return (
    <g>
      {p >= 0.999 ? (
        <path d={ARC_D} fill="none" stroke={C.track} strokeWidth={MARK.sw} strokeLinecap="round" strokeLinejoin="round" />
      ) : p > 0.002 ? (
        <path
          d={ARC_D}
          fill="none"
          stroke={C.track}
          strokeWidth={MARK.sw}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${ARC_LEN} ${ARC_LEN + 40}`}
          strokeDashoffset={ARC_LEN * (1 - p)}
        />
      ) : null}
      {cyanArc > 0.001 && p > 0.002 ? (
        <path
          d={ARC_D}
          fill="none"
          stroke={C.cyan}
          strokeWidth={MARK.sw}
          strokeLinecap="round"
          opacity={cyanArc}
          strokeDasharray={`${ARC_LEN} ${ARC_LEN + 40}`}
          strokeDashoffset={ARC_LEN * (1 - p)}
          style={{filter: 'drop-shadow(0 0 4px rgba(0,194,178,0.9))'}}
        />
      ) : null}
      {/* drawing head glow while the trace is moving */}
      {animated && p > 0.01 && p < 0.995 ? (
        <circle
          cx={pt(MARK.a0 - MARK.sweep * p)[0]}
          cy={pt(MARK.a0 - MARK.sweep * p)[1]}
          r={9}
          fill={C.cyan}
          opacity={0.55}
          style={{filter: 'blur(4px)'}}
        />
      ) : null}
      {node(58.5, 22.5, 3.8, C.cyan, sNode(1))}
      {node(21.0, 60.0, 3.8, C.cyan, sNode(2))}
      {node(58.5, 97.5, 3.8, C.cyan, sNode(3))}
      {node(87.23, 35.9, 6.4, C.cyan, sNode(0))}
      {node(87.23, 84.1, 6.4, C.track, sNode(4))}
      {node(87.23, 84.1, 3.0, C.cyan, sNode(4))}
      <g transform={`translate(58.5 60) scale(${chip}) translate(-58.5 -60)`}>
        <rect x="53.3" y="54.8" width="10.4" height="10.4" rx="1.8" transform="rotate(45 58.5 60.0)" fill={C.cyan} />
      </g>
      {pulseOn
        ? [
            [58.5, 22.5],
            [21, 60],
            [58.5, 97.5],
            [87.23, 35.9],
            [87.23, 84.1],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={4 + 14 * pulse} fill="none" stroke={C.cyan} strokeWidth={1.6} opacity={0.8 * (1 - pulse)} />
          ))
        : null}
    </g>
  );
};

/** Icon-only mark at a pixel size. */
export const LogoMark: React.FC<MarkAnim & {size: number; style?: React.CSSProperties}> = ({size, style, ...a}) => (
  <svg width={size} height={size} viewBox="0 0 120 120" style={{overflow: 'visible', ...style}}>
    <MarkG {...a} />
  </svg>
);

/**
 * Logo lockups built from the exact colour-on-dark geometry.
 * `word` (0..1) wipes the outlined wordmark in; at 1 the render matches the file.
 */
export const LogoLockup: React.FC<
  MarkAnim & {layout: 'h' | 's'; width: number; word?: number; id: string; style?: React.CSSProperties}
> = ({layout, width, word = 1, id, style, ...a}) => {
  const h = layout === 'h';
  const vb = h ? [349.4, 136] : [161.32, 182.16];
  const markT = h ? 'translate(8 8)' : 'translate(20.66 8)';
  const wm = h ? WORDMARK_H : WORDMARK_S;
  const wx = h ? 8 + wm.x : wm.x;
  const wy = h ? 8 + wm.y : wm.y;
  const ww = h ? 200 : 150;
  const wp = Math.max(0, Math.min(1, word));
  return (
    <svg width={width} height={(width * vb[1]) / vb[0]} viewBox={`0 0 ${vb[0]} ${vb[1]}`} style={{overflow: 'visible', ...style}}>
      <defs>
        <clipPath id={`wm-${id}`}>
          <rect x={wx - 4} y={wy - 40} width={(ww + 8) * wp} height={h ? 200 : 60} />
        </clipPath>
      </defs>
      <g transform={markT}>
        <MarkG {...a} />
      </g>
      {wp > 0 ? (
        <g clipPath={wp < 1 ? `url(#wm-${id})` : undefined}>
          <g
            transform={`translate(${wx + (1 - wp) * -14} ${wy})`}
            opacity={Math.min(1, wp * 1.6)}
            dangerouslySetInnerHTML={{__html: wm.inner}}
          />
        </g>
      ) : null}
    </svg>
  );
};
