import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, CUBIC_INOUT, EXPO_IN, EXPO_OUT, FONT_DISPLAY, FONT_UI, GLOW, QUART_INOUT, QUINT_OUT, keys, lerp, ramp, rand, sp} from '../theme';
import {SOCIAL, wordAt} from '../timing';
import {Background, Pulses, dash} from '../components/scenery';
import {Card, Chrome, Letters, Pointer, Tag, Typewriter, Words} from '../components/ui';
import {Icon} from '../brand/Icon';
import {LogoLockup, LogoMark} from '../brand/Logo';

// 1080 x 1920. Key type stays between y=288 (top 15%) and y=1536 (bottom 20%).
const W = (s: number, w: string, n = 0) => wordAt(SOCIAL, s, w, n);
const VW = 1080;
const VH = 1920;

// ---------------------------------------------------------------------------
// 1 — inbox + "Any update?" (0 – 3)
// ---------------------------------------------------------------------------
const S1: React.FC<{t: number}> = ({t}) => {
  const slam = sp(t, 0, {damping: 19, stiffness: 300, mass: 0.7});
  const days = t < 0.4 ? 1 : t < 0.8 ? 2 : 3;
  const tLand = W(1, 'customers') + 0.05;
  const drop = t < tLand - 0.25 ? 0 : keys(t, [tLand - 0.25, tLand], [0, 1], EXPO_IN);
  const d = t - tLand;
  const shake = d > 0 ? Math.exp(-d * 7) * Math.sin(d * 55) : 0;
  const l1 = ['Your', 'quotes', 'are', 'waiting.'].map((w) => ({text: w, at: W(1, w.replace('.', ''))}));
  const l2 = ['Your', 'customers', "aren't."].map((w, i) => ({text: w, at: i === 0 ? W(1, 'your', 1) : W(1, w.replace('.', '')), color: i > 0 ? C.cyan : undefined}));
  const rows = [
    ['Sample Pty Ltd', 'RFQ: 40 × Part #EX-2041'],
    ['Example Builders', 'Re: delivery window'],
    ['Demo Electrical', 'Spec sheet request'],
    ['Sample Pty Ltd', 'Order SO-1182'],
  ];
  return (
    <AbsoluteFill style={{transform: `translate(${shake * 12}px, ${shake * 8}px)`}}>
      <Card style={{left: 70, top: 300, width: 940, height: 640, transform: `translateY(${(1 - slam) * -50}px) scale(${lerp(1.15, 1, slam)})`, opacity: Math.min(1, t * 12)}}>
        <Chrome title="Inbox" h={58} />
        {rows.map(([f, s], i) => (
          <div
            key={i}
            style={{
              height: 144,
              padding: '0 34px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 10,
              borderBottom: `1px solid ${C.stroke}`,
              background: i === 0 ? 'linear-gradient(90deg, rgba(0,194,178,0.12), transparent 70%)' : undefined,
              boxShadow: i === 0 ? `inset 5px 0 0 ${C.cyan}` : undefined,
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{fontSize: 30, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? C.mist : C.dim}}>{f}</div>
              {i === 0 ? <Tag tone="red" size={24}>{`Waiting ${days} day${days > 1 ? 's' : ''}`}</Tag> : null}
            </div>
            <div style={{fontSize: 27, color: i === 0 ? C.mist : 'rgba(244,247,250,0.4)'}}>{s}</div>
          </div>
        ))}
      </Card>
      {drop > 0 ? (
        <Card glow={0.25} style={{left: 110, top: lerp(-300, 560, drop), width: 860, height: 230, transform: `rotate(${lerp(-5, 0, drop) + shake * 2}deg)`}}>
          <div style={{padding: '30px 36px'}}>
            <div style={{fontSize: 27, color: C.dim}}>Sample Pty Ltd · Re: RFQ</div>
            <div style={{fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 84, letterSpacing: '-0.02em', marginTop: 14}}>Any update?</div>
          </div>
        </Card>
      ) : null}
      <div style={{position: 'absolute', left: 80, right: 80, top: 1060, display: 'flex', flexDirection: 'column', gap: 18}}>
        <Words t={t} size={96} words={l1} />
        <Words t={t} size={96} words={l2} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 2 — logo flash, vertical conveyor, three ✓ stamps (3 – 9)
// ---------------------------------------------------------------------------
const ITEMS = [
  {w: 'quotes', icon: 'agent-rfq-quote', label: 'Quote draft', line: 'Draft quotes.'},
  {w: 'answer', icon: 'agent-spec-catalogue', label: 'Spec answer', line: 'Answer specs.'},
  {w: 'reply', icon: 'agent-order-status', label: 'Order reply', line: 'Reply on orders.'},
];
const TRACK_X = 540;
const STAMP_Y = 820;
const S2: React.FC<{t: number}> = ({t}) => {
  const flash = ramp(t, 3.55, 0.55, QUART_INOUT); // big mark -> header
  const whip = ramp(t, 8.7, 0.32, EXPO_IN);
  const trackD = `M ${TRACK_X} 470 V 1170`;
  const trackP = ramp(t, 3.7, 0.5, EXPO_OUT);
  return (
    <AbsoluteFill style={{transform: `translateY(${-whip * VH}px)`, filter: whip > 0.02 ? `blur(${whip * 10}px)` : undefined}}>
      {/* C logo flash then header */}
      <div style={{position: 'absolute', left: lerp(VW / 2 - 170, VW / 2 - 60, flash), top: lerp(560, 300, flash)}}>
        <LogoMark size={lerp(340, 120, flash)} t0={3.0} dur={0.5} t={t} cyanArc={1 - ramp(t, 3.4, 0.5)} />
      </div>
      <svg width={VW} height={VH} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <path d={trackD} stroke={C.mist} strokeOpacity={0.35} strokeWidth={5} fill="none" strokeLinecap="round" {...dash(trackD, trackP)} />
        {t > 4.0 ? <Pulses d={trackD} t={t - 4} speed={520} gap={180} count={4} r={7} /> : null}
        {/* stamp station rails */}
        <path d={`M ${TRACK_X - 240} ${STAMP_Y} H ${TRACK_X - 190} M ${TRACK_X + 190} ${STAMP_Y} H ${TRACK_X + 240}`} stroke={C.cyan} strokeWidth={3} opacity={trackP} />
      </svg>
      {ITEMS.map((it, i) => {
        const tw = W(2, it.w) + 0.25; // stamp time
        // fast move down the line, easing through the stamp
        const y = keys(t, [tw - 0.7, tw - 0.08, tw + 0.15, tw + 0.75], [380, STAMP_Y - 4, STAMP_Y + 4, 1080], QUINT_OUT);
        const o = Math.min(ramp(t, tw - 0.75, 0.15), 1 - ramp(t, tw + 0.35, 0.25));
        const st = ramp(t, tw, 0.3, EXPO_OUT);
        if (o <= 0) return null;
        return (
          <div key={i} style={{position: 'absolute', left: TRACK_X - 180, top: y - 95, width: 360, height: 190, opacity: o}}>
            <Card glow={st} style={{inset: 0, display: 'flex', alignItems: 'center', gap: 24, padding: '0 34px'}}>
              <div style={{color: C.mist}}>
                <Icon name={it.icon} size={76} />
              </div>
              <div style={{fontSize: 32, fontWeight: 600}}>{it.label}</div>
            </Card>
            <div
              style={{
                position: 'absolute',
                right: -22,
                top: -22,
                width: 64,
                height: 64,
                borderRadius: 32,
                background: C.cyan,
                color: C.navy,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${lerp(2.4, 1, st)})`,
                opacity: Math.min(1, st * 3),
                boxShadow: GLOW(0.7, 22),
              }}
            >
              <Icon name="check" size={40} strokePx={4.5} />
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 80, right: 80, top: 1230, display: 'flex', flexDirection: 'column', gap: 10}}>
        {ITEMS.map((it, i) => (
          <Words key={i} t={t} size={84} words={it.line.split(' ').map((w, j) => ({text: w, at: W(2, it.w) + j * 0.12}))} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 3 — content formats + Approve (9 – 13)
// ---------------------------------------------------------------------------
const FMT = [
  {l: 'Posts', icon: 'post', w: 'plus'},
  {l: 'Reels', icon: 'reel', w: 'content'},
  {l: 'SEO', icon: 'seo', w: 'that'},
  {l: 'Newsletters', icon: 'mail', w: 'runs'},
];
const BTN = {x: 540, y: 1150};
const S3: React.FC<{t: number}> = ({t}) => {
  const enter = ramp(t, 8.85, 0.4, EXPO_OUT);
  const click = W(3, 'human') - 0.08;
  const press = Math.max(0, 1 - Math.abs(t - click) / 0.12);
  const lit = ramp(t, click, 0.25, EXPO_OUT);
  const pp = ramp(t, click - 0.75, 0.7, QUART_INOUT);
  const px = lerp(980, BTN.x + 40, pp);
  const py = lerp(1560, BTN.y + 10, pp) - Math.sin(pp * Math.PI) * 60;
  const human = ['✓', 'Human', 'approves', 'every', 'output'].map((w, i) => ({text: w, at: click + 0.1 + i * 0.08, color: i === 0 ? C.cyan : undefined}));
  return (
    <AbsoluteFill style={{transform: `translateY(${(1 - enter) * VH * 0.6}px)`}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', justifyContent: 'center'}}>
        <Words
          t={t}
          size={50}
          weight={500}
          gap={0.3}
          words={FMT.flatMap((f, i) => [...(i ? [{text: '·', at: W(3, f.w), color: C.cyan}] : []), {text: f.l, at: W(3, f.w)}])}
        />
      </div>
      {FMT.map((f, i) => {
        const p = sp(t, W(3, f.w) - 0.05, {damping: 15, stiffness: 230, mass: 0.6});
        const flow = ramp(t, click + 0.3 + i * 0.06, 0.6, CUBIC_INOUT);
        return (
          <div
            key={f.l}
            style={{
              position: 'absolute',
              left: 220 + i * 40,
              top: lerp(2150, 470 + i * 70, p) - flow * 40,
              width: 560,
              height: 300,
              transform: `rotate(${(i - 1.5) * 2.2 * (1 - flow)}deg)`,
              opacity: 1 - flow * 0.4,
            }}
          >
            <Card glow={i === 3 ? 0.3 : 0} style={{inset: 0, display: 'flex', alignItems: 'center', gap: 30, padding: '0 44px'}}>
              <div style={{color: C.mist}}>
                <Icon name={f.icon} size={96} />
              </div>
              <div style={{fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 52}}>{f.l}</div>
              {flow > 0 ? (
                <div style={{marginLeft: 'auto', color: C.cyan, opacity: flow}}>
                  <Icon name="check" size={56} strokePx={5} />
                </div>
              ) : null}
            </Card>
          </div>
        );
      })}
      {/* approve button */}
      <div
        style={{
          position: 'absolute',
          left: BTN.x - 220,
          top: BTN.y - 60,
          width: 440,
          height: 120,
          borderRadius: 60,
          border: `3px solid ${C.cyan}`,
          background: `rgba(0,194,178,${0.1 + 0.9 * lit})`,
          color: lit > 0.5 ? C.navy : C.cyan,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: 52,
          transform: `scale(${(1 - press * 0.08) * sp(t, 10.2)})`,
          boxShadow: GLOW(0.35 + 0.5 * lit, 40),
        }}
      >
        <Icon name="check" size={54} strokePx={5} />
        Approve
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, top: 1270, display: 'flex', justifyContent: 'center'}}>
        <Words t={t} size={72} words={human} style={{justifyContent: 'center'}} />
      </div>
      {t > click - 0.8 && t < 12.6 ? <Pointer x={px} y={py} press={press} scale={1.3} /> : null}
    </AbsoluteFill>
  );
};

const Wipe: React.FC<{t: number}> = ({t}) => {
  const t0 = 12.55;
  if (t < t0 || t > 13.6) return null;
  const p = ramp(t, t0, 0.45, EXPO_IN);
  const out = ramp(t, 13.0, 0.45, EXPO_OUT);
  const r = lerp(60, 2300, p);
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translateY(${-out * 100}%)`}}>
      <div style={{position: 'absolute', left: BTN.x - r, top: BTN.y - r, width: r * 2, height: r * 2, borderRadius: r, background: C.cyan}} />
      <div style={{position: 'absolute', left: BTN.x - 40 - p * 200, top: BTN.y - 40 - p * 200, color: C.navy, opacity: 1 - ramp(t, 12.9, 0.15)}}>
        <Icon name="check" size={80 + p * 400} strokePx={6 + p * 28} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 4 — stacked logo, CTA (13 – 18.2)
// ---------------------------------------------------------------------------
const PHONE = '+61 478 953 337';
const S4: React.FC<{t: number}> = ({t}) => {
  const tUrl = W(4, 'kravioai');
  const tUrlEnd = wordAt(SOCIAL, 4, '.com', 0, 'e') - 0.2;
  const offer = [
    {text: 'Free', at: W(4, 'free')},
    {text: '30-min', at: W(4, 'free') + 0.12},
    {text: 'AI', at: W(4, 'ai'), color: C.cyan},
    {text: 'audit', at: W(4, 'audit')},
  ];
  const phoneAt = tUrlEnd - 0.1;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: VW / 2 - 200, top: 330}}>
        <LogoLockup id="soc" layout="s" width={400} t0={13.15} dur={0.85} t={t} word={ramp(t, 13.75, 0.7, EXPO_OUT)} pulseAt={14.05} cyanArc={1 - ramp(t, 13.9, 0.5)} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 870, display: 'flex', justifyContent: 'center'}}>
        <Letters t={t} text="AI that runs like a factory." at={13.55} span={0.7} size={56} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1030, display: 'flex', justifyContent: 'center'}}>
        <Words t={t} size={70} words={offer} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1150, display: 'flex', justifyContent: 'center', fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 116, letterSpacing: '-0.02em', color: C.cyan}}>
        <Typewriter t={t} text="cravioai.com" at={tUrl} end={tUrlEnd} hideCursorAfter={tUrlEnd + 0.3} style={{textShadow: '0 0 30px rgba(0,194,178,0.35)'}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1320, display: 'flex', justifyContent: 'center', fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 66, color: C.mist, whiteSpace: 'pre'}}>
        {PHONE.split('').map((ch, i) => {
          const p = ramp(t, phoneAt + i * 0.025, 0.25, EXPO_OUT);
          return (
            <span key={i} style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 0.35}em)`}}>
              {ch}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Social: React.FC = () => {
  const t = useCurrentFrame() / 30;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Background w={VW} h={VH} camY={t * 40} />
      {t < 3.0 ? <S1 t={t} /> : null}
      {t >= 3.0 && t < 9.05 ? <S2 t={t} /> : null}
      {t >= 8.85 && t < 13.05 ? <S3 t={t} /> : null}
      {t >= 12.95 ? <S4 t={t} /> : null}
      <Wipe t={t} />
    </AbsoluteFill>
  );
};
