import React from 'react';
import {C, EXPO_OUT, FONT_DISPLAY, FONT_UI, GLOW, QUINT_OUT, SHADOW, ramp, sp} from '../theme';
import {Icon} from '../brand/Icon';

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------
export const Card: React.FC<{
  style?: React.CSSProperties;
  children?: React.ReactNode;
  glow?: number;
  pad?: number;
}> = ({style, children, glow = 0, pad = 0}) => (
  <div
    style={{
      position: 'absolute',
      borderRadius: 18,
      background: `linear-gradient(180deg, ${C.panelHi} 0%, ${C.panel} 22%, ${C.panel2} 100%)`,
      border: `1px solid ${glow > 0 ? `rgba(0,194,178,${0.25 + 0.55 * glow})` : C.stroke}`,
      boxShadow: `${SHADOW}${glow > 0 ? `, ${GLOW(0.35 * glow, 36)}` : ''}, inset 0 1px 0 rgba(255,255,255,0.05)`,
      padding: pad,
      boxSizing: 'border-box',
      fontFamily: FONT_UI,
      color: C.mist,
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </div>
);

/** Window chrome strip for UI mockups (no third-party branding). */
export const Chrome: React.FC<{title?: string; h?: number}> = ({title, h = 44}) => (
  <div
    style={{
      height: h,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 18px',
      borderBottom: `1px solid ${C.stroke}`,
      background: 'rgba(255,255,255,0.02)',
    }}
  >
    {[0, 1, 2].map((i) => (
      <div key={i} style={{width: 10, height: 10, borderRadius: 5, background: 'rgba(244,247,250,0.16)'}} />
    ))}
    {title ? (
      <div style={{marginLeft: 14, fontFamily: FONT_UI, fontSize: 17, fontWeight: 500, color: C.dim, letterSpacing: 0.1}}>{title}</div>
    ) : null}
  </div>
);

type Tone = 'cyan' | 'amber' | 'red' | 'slate' | 'mist';
const toneCol = (t: Tone) =>
  t === 'cyan' ? C.cyan : t === 'amber' ? C.amber : t === 'red' ? C.red : t === 'mist' ? C.mist : '#94A3B8';

/** Small status pill. Amber/red only where the brief allows. */
export const Tag: React.FC<{tone?: Tone; children: React.ReactNode; size?: number; style?: React.CSSProperties; icon?: string}> = ({
  tone = 'cyan',
  children,
  size = 18,
  style,
  icon,
}) => {
  const col = toneCol(tone);
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.4,
        padding: `${size * 0.32}px ${size * 0.7}px`,
        borderRadius: 999,
        fontFamily: FONT_UI,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1,
        color: col,
        background: `${col}1F`,
        border: `1px solid ${col}66`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {icon ? <Icon name={icon} size={size * 1.05} strokePx={2} /> : <div style={{width: size * 0.42, height: size * 0.42, borderRadius: 99, background: col}} />}
      {children}
    </div>
  );
};

/** Station badge: icon tile styled like the hero's agent nodes. */
export const Badge: React.FC<{icon: string; size?: number; glow?: number; style?: React.CSSProperties}> = ({icon, size = 84, glow = 1, style}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.22,
      background: C.panel,
      border: `2px solid ${C.cyan}`,
      boxShadow: `${GLOW(0.45 * glow, size * 0.4)}, inset 0 0 ${size * 0.25}px rgba(0,194,178,0.12)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: C.cyan,
      boxSizing: 'border-box',
      ...style,
    }}
  >
    <Icon name={icon} size={size * 0.56} />
  </div>
);

// ---------------------------------------------------------------------------
// Kinetic type
// ---------------------------------------------------------------------------
export type WordCue = {text: string; at: number; color?: string; weight?: number};

/**
 * Word-level mask reveal: each word rises out of a mask (y-offset + opacity)
 * at its cue time. `out` slides the whole line up and away.
 */
export const Words: React.FC<{
  t: number;
  words: WordCue[];
  size: number;
  color?: string;
  weight?: number;
  font?: string;
  out?: number;
  dur?: number;
  style?: React.CSSProperties;
  track?: number;
  gap?: number;
}> = ({t, words, size, color = C.mist, weight = 700, font = FONT_DISPLAY, out, dur = 0.55, style, track = -0.02, gap = 0.26}) => {
  const o = out !== undefined ? ramp(t, out, 0.4, EXPO_OUT) : 0;
  return (
    <div
      style={{
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: `${track}em`,
        color,
        display: 'flex',
        flexWrap: 'wrap',
        columnGap: size * gap,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const p = ramp(t, w.at - 0.05, dur, EXPO_OUT);
        const y = (1 - p) * 105 - o * 105;
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', paddingBottom: size * 0.14, marginBottom: -size * 0.14}}>
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${y}%)`,
                opacity: Math.min(p * 1.4, 1 - o),
                color: w.color ?? color,
                fontWeight: w.weight ?? weight,
              }}
            >
              {w.text}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** Per-letter reveal (tagline only). */
export const Letters: React.FC<{
  t: number;
  text: string;
  at: number;
  span: number;
  size: number;
  color?: string;
  weight?: number;
  style?: React.CSSProperties;
}> = ({t, text, at, span, size, color = C.mist, weight = 700, style}) => {
  const n = text.length;
  return (
    <div style={{fontFamily: FONT_DISPLAY, fontWeight: weight, fontSize: size, letterSpacing: '-0.02em', color, whiteSpace: 'pre', lineHeight: 1.1, ...style}}>
      {text.split('').map((ch, i) => {
        const p = ramp(t, at + (span * i) / n, 0.5, EXPO_OUT);
        return (
          <span key={i} style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 0.45}em)`, filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined}}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** Typewriter with a blinking block cursor. */
export const Typewriter: React.FC<{
  t: number;
  text: string;
  at: number;
  end: number;
  style?: React.CSSProperties;
  cursorColor?: string;
  hideCursorAfter?: number;
}> = ({t, text, at, end, style, cursorColor = C.cyan, hideCursorAfter}) => {
  const n = Math.max(0, Math.min(text.length, Math.floor(((t - at) / (end - at)) * text.length + 0.0001)));
  const shown = t < at ? '' : text.slice(0, n);
  const blink = Math.floor(t * 2.2) % 2 === 0 || (t > at && t < end);
  const cursorOn = t >= at - 0.4 && (hideCursorAfter === undefined || t < hideCursorAfter);
  return (
    <div style={{whiteSpace: 'pre', display: 'inline-flex', alignItems: 'center', ...style}}>
      <span>{shown}</span>
      <span style={{visibility: 'hidden', width: 0}}>{text.slice(n) || '.'}</span>
      {cursorOn ? (
        <span style={{display: 'inline-block', width: '0.08em', height: '1.0em', marginLeft: '0.06em', background: cursorColor, opacity: blink ? 1 : 0}} />
      ) : null}
    </div>
  );
};

/** Arrow pointer (not a hand). Tip at (0,0). */
export const Pointer: React.FC<{x: number; y: number; press?: number; scale?: number; opacity?: number}> = ({x, y, press = 0, scale = 1, opacity = 1}) => (
  <svg
    width={44 * scale}
    height={56 * scale}
    viewBox="0 0 22 28"
    style={{position: 'absolute', left: x, top: y, overflow: 'visible', opacity, transform: `scale(${1 - press * 0.12})`, transformOrigin: '0 0', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.45))'}}
  >
    <path d="M1 1 L1 22 L6.5 17 L10.2 25.5 L13.6 24 L10 15.8 L17.5 15.8 Z" fill={C.mist} stroke={C.navy} strokeWidth={1.4} strokeLinejoin="round" />
  </svg>
);

/** Kicker label + title used for station headers. */
export const StationTitle: React.FC<{
  t: number;
  at: number;
  kicker: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  size?: number;
  out?: number;
}> = ({t, at, kicker, title, icon, x, y, size = 54, out}) => {
  const b = sp(t, at);
  const k = ramp(t, at + 0.1, 0.6, QUINT_OUT);
  const o = out !== undefined ? ramp(t, out, 0.35, EXPO_OUT) : 0;
  return (
    <div style={{position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 26, opacity: 1 - o, transform: `translateY(${-o * 30}px)`}}>
      <div style={{transform: `scale(${b})`}}>
        <Badge icon={icon} size={size * 1.55} />
      </div>
      <div>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 500,
            fontSize: size * 0.4,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: C.cyan,
            opacity: k,
            transform: `translateX(${(1 - k) * -16}px)`,
            marginBottom: 6,
          }}
        >
          {kicker}
        </div>
        <Words t={t} size={size} words={title.split(' ').map((w, i) => ({text: w, at: at + 0.12 + i * 0.07}))} />
      </div>
    </div>
  );
};

/** Big callout line (burned-in key text). */
export const Callout: React.FC<{t: number; at: number; text: string; size?: number; color?: string; style?: React.CSSProperties; icon?: string; out?: number}> = ({
  t,
  at,
  text,
  size = 30,
  color = C.mist,
  style,
  icon,
  out,
}) => {
  const p = ramp(t, at, 0.5, EXPO_OUT);
  const o = out !== undefined ? ramp(t, out, 0.3, EXPO_OUT) : 0;
  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        fontFamily: FONT_DISPLAY,
        fontWeight: 500,
        fontSize: size,
        color,
        opacity: p * (1 - o),
        transform: `translateY(${(1 - p) * 18}px)`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {icon ? (
        <div style={{color: C.cyan}}>
          <Icon name={icon} size={size * 1.1} strokePx={2.6} />
        </div>
      ) : null}
      {text}
    </div>
  );
};
