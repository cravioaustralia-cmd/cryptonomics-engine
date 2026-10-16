import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, CUBIC_INOUT, EXPO_IN, EXPO_OUT, FONT_DISPLAY, FONT_UI, GLOW, QUART_INOUT, QUINT_OUT, lerp, ramp, rand, sp} from '../theme';
import {HERO, wordAt} from '../timing';
import {Callout, Card, StationTitle, Typewriter, Words, Letters} from '../components/ui';
import {Icon} from '../brand/Icon';
import {LogoLockup, arcPath, MARK} from '../brand/Logo';
import {Pulses, dash, pointAt} from '../components/scenery';

const W = (s: number, w: string, n = 0) => wordAt(HERO, s, w, n);

// ---------------------------------------------------------------------------
// Scene 11 — custom AI, machined to fit (65.0 – 69.5)
// ---------------------------------------------------------------------------
const P_PATH = 'M0 0 H360 V70 H300 L260 120 C230 150 230 190 270 205 L300 230 H360 V300 H0 Z';
const K_PATH = 'M300 70 H520 V230 H300 L270 205 C230 190 230 150 260 120 Z';
const TOOLS = ['Xero', 'MYOB', 'HubSpot', 'Gmail', 'Outlook'];

const Scene11: React.FC<{t: number}> = ({t}) => {
  const tProb = W(11, 'problem');
  const tBox = W(11, 'box');
  const tBuild = W(11, 'build');
  const lock = 68.05;
  const G = {x: 250, y: 290, s: 1.85}; // puzzle group origin + scale
  const pIn = sp(t, tProb - 0.15);
  // a plain box tries to fit and bounces off
  const boxDrop = ramp(t, tBox - 0.45, 0.35, EXPO_IN);
  const boxBounce = ramp(t, tBox - 0.1, 0.6, EXPO_OUT);
  const boxX = 300;
  const boxY = lerp(-420, 70, boxDrop) - boxBounce * 180;
  const boxRot = boxBounce * 28;
  const boxO = 1 - ramp(t, tBox + 0.25, 0.3);
  // machining
  const mach = ramp(t, tBuild - 0.15, 0.75, CUBIC_INOUT);
  const fill = ramp(t, tBuild + 0.55, 0.25);
  const slide = ramp(t, lock - 0.4, 0.4, QUART_INOUT);
  const kx = lerp(300, 0, slide);
  const locked = t >= lock;
  const flash = locked ? 1 - ramp(t, lock, 0.4, EXPO_OUT) : 0;
  const tool = pointAt(K_PATH, mach);
  // pull back into the aerial view
  const pull = ramp(t, 69.0, 0.6, QUART_INOUT);
  const fadeIn = ramp(t, 65.0, 0.2);
  return (
    <AbsoluteFill style={{opacity: fadeIn * (1 - ramp(t, 69.25, 0.3)), transform: `scale(${lerp(1, 0.3, pull)})`, transformOrigin: '600px 300px'}}>
      <StationTitle t={t} at={65.15} kicker="Doesn't fit a box?" title="Custom AI solutions" icon="service-custom-solutions" x={130} y={70} />
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <g transform={`translate(${G.x} ${G.y}) scale(${G.s})`}>
          {/* your problem */}
          <g opacity={pIn} transform={`translate(0 ${(1 - pIn) * 40})`}>
            <path d={P_PATH} fill={C.panel} stroke={C.mist} strokeOpacity={0.8} strokeWidth={2.4} strokeLinejoin="round" />
            <text x={34} y={168} fontFamily={FONT_DISPLAY} fontWeight={500} fontSize={30} fill={C.mist}>
              Your problem
            </text>
          </g>
          {/* the box that doesn't fit */}
          {boxO > 0 && boxDrop > 0 ? (
            <g opacity={boxO} transform={`translate(${boxX} ${boxY}) rotate(${boxRot} 80 80)`}>
              <rect x={0} y={0} width={160} height={160} rx={8} fill="none" stroke={C.dim} strokeWidth={2.4} strokeDasharray="10 8" />
            </g>
          ) : null}
          {/* custom piece, machined then slid in */}
          <g transform={`translate(${kx} 0)`}>
            {fill > 0 ? <path d={K_PATH} fill={C.cyan} fillOpacity={0.16 * fill + 0.3 * flash} /> : null}
            {mach > 0 ? <path d={K_PATH} fill="none" stroke={C.cyan} strokeWidth={2.6} strokeLinejoin="round" {...dash(K_PATH, mach)} style={{filter: 'drop-shadow(0 0 5px rgba(0,194,178,0.8))'}} /> : null}
            {mach > 0 && mach < 1 ? (
              <g>
                <circle cx={tool.x} cy={tool.y} r={14} fill={C.cyan} opacity={0.35} style={{filter: 'blur(4px)'}} />
                <circle cx={tool.x} cy={tool.y} r={5} fill={C.mist} />
              </g>
            ) : null}
            <text x={350} y={160} fontFamily={FONT_DISPLAY} fontWeight={500} fontSize={24} fill={C.cyan} opacity={fill}>
              Custom AI
            </text>
          </g>
          {locked ? <path d={P_PATH} fill="none" stroke={C.cyan} strokeWidth={2.6} opacity={flash} /> : null}
        </g>
        {/* integrations: plain text labels joined by traces */}
        {TOOLS.map((name, i) => {
          const y = 300 + i * 118;
          const x0 = G.x + 520 * G.s;
          const y0 = G.y + 150 * G.s;
          const d = `M ${x0} ${y0} H ${x0 + 140} V ${y} H 1420`;
          const p = ramp(t, lock + 0.15 + i * 0.09, 0.45, QUINT_OUT);
          return p > 0 ? (
            <g key={name}>
              <path d={d} fill="none" stroke={C.cyan} strokeWidth={2} opacity={0.75} {...dash(d, p)} />
              <circle cx={x0} cy={y0} r={5} fill={C.cyan} opacity={p} />
            </g>
          ) : null;
        })}
      </svg>
      {TOOLS.map((name, i) => {
        const p = sp(t, lock + 0.45 + i * 0.09);
        return (
          <div
            key={name}
            style={{
              position: 'absolute',
              left: 1420,
              top: 300 + i * 118 - 32,
              height: 64,
              padding: '0 28px',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              background: C.panel,
              border: `1px solid ${C.strokeHi}`,
              fontFamily: FONT_UI,
              fontWeight: 600,
              fontSize: 26,
              color: C.mist,
              transform: `scale(${p})`,
              transformOrigin: '0 50%',
            }}
          >
            {name}
          </div>
        );
      })}
      <Callout t={t} at={lock + 0.5} text="Connected to the tools you already use" size={32} style={{left: 250, top: 900}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 12 — aerial: the line network forms the C (69.5 – 73.0)
// ---------------------------------------------------------------------------
const Scene12: React.FC<{t: number}> = ({t}) => {
  const k = 7.6; // px per mark unit
  const ox = 470 - MARK.cx * k;
  const oy = 540 - MARK.cy * k;
  const draw = ramp(t, 69.25, 1.1, CUBIC_INOUT);
  const tilt = lerp(38, 0, ramp(t, 69.2, 2.4, QUART_INOUT));
  const zoom = lerp(1.25, 1, ramp(t, 69.2, 3.6, QUINT_OUT));
  const fadeOut = ramp(t, 72.55, 0.45, CUBIC_INOUT);
  const arc = arcPath(MARK.a0, MARK.sweep);
  const stations = [
    {f: 0, icon: 'agent-rfq-quote'},
    {f: 50 / 280, icon: 'agent-spec-catalogue'},
    {f: 140 / 280, icon: 'agent-order-status'},
    {f: 230 / 280, icon: 'agent-lead-research'},
    {f: 1, icon: 'agent-content-engine'},
  ];
  const tBuilt = W(12, 'built');
  const tPriced = W(12, 'priced');
  const l1 = ['Built', 'by', 'a', 'manufacturing', 'family.'].map((w) => ({text: w, at: W(12, w.replace('.', ''))}));
  const l2 = ['Priced', 'to', 'your', 'needs.'].map((w) => ({text: w, at: W(12, w.replace('.', '')), color: C.cyan}));
  return (
    <AbsoluteFill style={{opacity: ramp(t, 69.25, 0.3) * (1 - fadeOut)}}>
      <div style={{position: 'absolute', inset: 0, perspective: 1600}}>
        <div style={{position: 'absolute', inset: 0, transform: `rotateX(${tilt}deg) scale(${zoom})`, transformOrigin: '470px 540px'}}>
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
            {/* fine grid of feeder traces (the factory floor seen from above) */}
            {Array.from({length: 9}).map((_, i) => {
              const a = (-40 - (i * 280) / 8) * (Math.PI / 180);
              const x0 = ox + (MARK.cx + Math.cos(a) * (MARK.r + 6)) * k;
              const y0 = oy + (MARK.cy + Math.sin(a) * (MARK.r + 6)) * k;
              const x1 = ox + (MARK.cx + Math.cos(a) * (MARK.r + 20)) * k;
              const y1 = oy + (MARK.cy + Math.sin(a) * (MARK.r + 20)) * k;
              const d = `M ${x0} ${y0} L ${x1} ${y1} H ${x1 + (Math.cos(a) > 0 ? 60 : -60)}`;
              const p = ramp(t, 69.6 + i * 0.06, 0.5, QUINT_OUT);
              return <path key={i} d={d} fill="none" stroke={C.cyan} strokeWidth={1.5} opacity={0.45} {...dash(d, p)} />;
            })}
            <g transform={`translate(${ox} ${oy}) scale(${k})`}>
              <path d={arc} fill="none" stroke={C.mist} strokeOpacity={0.35} strokeWidth={4 / k} />
              <path d={arc} fill="none" stroke={C.cyan} strokeWidth={3 / k} {...dash(arc, draw)} style={{filter: 'drop-shadow(0 0 0.6px rgba(0,194,178,0.9))'}} />
              {/* inner rail */}
              <path d={arcPath(MARK.a0, MARK.sweep, MARK.r - 5)} fill="none" stroke={C.mist} strokeOpacity={0.18} strokeWidth={2 / k} {...dash(arcPath(MARK.a0, MARK.sweep, MARK.r - 5), draw)} />
            </g>
            {t > 69.6 ? (
              <g transform={`translate(${ox} ${oy}) scale(${k})`}>
                <Pulses d={arc} t={t - 69.6} speed={34} gap={40} count={6} r={0.9} opacity={ramp(t, 69.9, 0.4)} />
              </g>
            ) : null}
            {/* the approval chip at the centre */}
            <g transform={`translate(${ox + MARK.cx * k} ${oy + MARK.cy * k}) scale(${sp(t, 70.3)}) rotate(45)`}>
              <rect x={-30} y={-30} width={60} height={60} rx={8} fill={C.cyan} style={{filter: 'drop-shadow(0 0 12px rgba(0,194,178,0.7))'}} />
            </g>
          </svg>
          <div style={{position: 'absolute', left: ox + MARK.cx * k - 22, top: oy + MARK.cy * k - 22, color: C.navy, transform: `scale(${sp(t, 70.4)})`}}>
            <Icon name="check" size={44} strokePx={4} />
          </div>
          {stations.map((s, i) => {
            const pt = pointAt(arc, s.f);
            const p = sp(t, 69.35 + s.f * 1.1);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: ox + pt.x * k - 36,
                  top: oy + pt.y * k - 36,
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  background: C.navy,
                  border: `2px solid ${C.cyan}`,
                  boxShadow: GLOW(0.45, 24),
                  color: C.cyan,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${p})`,
                }}
              >
                <Icon name={s.icon} size={38} strokePx={2.4} />
              </div>
            );
          })}
        </div>
      </div>
      <div style={{position: 'absolute', left: 980, top: 360, width: 860, display: 'flex', flexDirection: 'column', gap: 34}}>
        <Words t={t} size={70} words={l1} />
        <Words t={t} size={70} words={l2} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 13 — CTA end card (73.0 – 84.5)
// ---------------------------------------------------------------------------
const Digit: React.FC<{ch: string; at: number; t: number; i: number}> = ({ch, at, t, i}) => {
  const p = ramp(t, at, 0.28, EXPO_OUT);
  if (t < at) return <span style={{opacity: 0}}>{ch}</span>;
  const rolling = /\d/.test(ch) && p < 1;
  const shown = rolling ? String(Math.floor(rand(i * 13 + Math.floor(t * 30)) * 10)) : ch;
  return (
    <span style={{display: 'inline-block', opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 0.35}em)`, color: rolling ? C.cyan : undefined, width: /\d/.test(ch) ? '0.62em' : undefined, textAlign: 'center'}}>
      {shown}
    </span>
  );
};

const PHONE = '+61 478 953 337';
const Scene13: React.FC<{t: number}> = ({t}) => {
  const head = [
    {text: 'Book', at: W(13, 'book')},
    {text: 'a', at: W(13, 'your')},
    {text: 'free', at: W(13, 'free')},
    {text: '30-minute', at: W(13, '30')},
    {text: 'AI', at: W(13, 'ai'), color: C.cyan},
    {text: 'audit', at: W(13, 'audit')},
  ];
  const tUrl = W(13, 'crevioai');
  const tUrlEnd = wordAt(HERO, 13, '.com', 0, 'e') - 0.15;
  const tCall = W(13, 'or');
  const g1 = W(13, '0478');
  const g2 = W(13, '-953');
  const g3 = W(13, '-337');
  const digitAt = (i: number) => {
    if (i <= 6) return g1 + i * 0.1; // "+61 478"
    if (i <= 10) return g2 + (i - 7) * 0.12;
    return g3 + (i - 11) * 0.13;
  };
  const logoIn = sp(t, 73.15, {damping: 18, stiffness: 140, mass: 0.9});
  const lineP = ramp(t, 73.3, 0.9, EXPO_OUT);
  const black = t >= 84.0;
  const fadeIn = ramp(t, 72.9, 0.3);
  return (
    <AbsoluteFill style={{opacity: fadeIn}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 130, display: 'flex', justifyContent: 'center'}}>
        <Words t={t} size={88} words={head} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 290, display: 'flex', justifyContent: 'center', fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 128, letterSpacing: '-0.02em', color: C.cyan}}>
        <Typewriter t={t} text="cravioai.com" at={tUrl} end={tUrlEnd} hideCursorAfter={tCall + 0.2} style={{textShadow: '0 0 30px rgba(0,194,178,0.35)'}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 470, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 22}}>
        <span style={{fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 40, color: C.slate === '#64748B' ? '#94A3B8' : C.slate, opacity: ramp(t, tCall - 0.05, 0.4)}}>or call</span>
        <span style={{fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 72, letterSpacing: '-0.01em', color: C.mist, whiteSpace: 'pre'}}>
          {PHONE.split('').map((ch, i) => (
            <Digit key={i} ch={ch} at={digitAt(i)} t={t} i={i} />
          ))}
        </span>
      </div>
      {/* divider trace */}
      <div style={{position: 'absolute', left: 960 - 300 * lineP, width: 600 * lineP, top: 640, height: 2, background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)`, opacity: 0.6}} />
      {/* logo settles bottom-centre */}
      <div style={{position: 'absolute', left: 960 - 260, top: 690, transform: `translateY(${(1 - logoIn) * 40}px)`, opacity: Math.min(1, logoIn * 1.5)}}>
        <LogoLockup id="s13" layout="h" width={520} t0={73.2} dur={0.8} t={t} word={ramp(t, 73.75, 0.8, EXPO_OUT)} pulseAt={81.0} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 932, display: 'flex', justifyContent: 'center'}}>
        <Letters t={t} text="AI that runs like a factory." at={74.0} span={0.8} size={40} weight={500} />
      </div>
      {black ? <AbsoluteFill style={{background: '#000'}} /> : null}
    </AbsoluteFill>
  );
};

export const Finale: React.FC<{t: number}> = ({t}) => (
  <>
    {t >= 64.95 && t < 69.6 ? <Scene11 t={t} /> : null}
    {t >= 69.2 && t < 73.05 ? <Scene12 t={t} /> : null}
    {t >= 72.9 ? <Scene13 t={t} /> : null}
  </>
);
