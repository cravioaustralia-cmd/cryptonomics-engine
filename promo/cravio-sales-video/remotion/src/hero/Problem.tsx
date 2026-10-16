import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {C, CUBIC_INOUT, EXPO_IN, EXPO_OUT, FONT_DISPLAY, FONT_UI, QUART_INOUT, QUINT_OUT, keys, lerp, ramp, rand, sp, vis} from '../theme';
import {HERO, wordAt} from '../timing';
import {Card, Chrome, Tag, Words} from '../components/ui';
import {Icon} from '../brand/Icon';
import {MARK, arcPath} from '../brand/Logo';

const W = (s: number, w: string, n = 0) => wordAt(HERO, s, w, n);

// Logo placement shared with scene 5 (mark box top-left + px per mark unit).
export const LOGO_S = 2.977;
export const LOGO_BOX = {x: 960 - 60 * LOGO_S, y: 470 - 60 * LOGO_S};

// ---------------------------------------------------------------------------
// Scene 1 — inbox slam (0.0 – 3.0)
// ---------------------------------------------------------------------------
const InboxRow: React.FC<{from: string; subject: string; preview: string; unread?: boolean; right?: React.ReactNode; y: number}> = ({
  from,
  subject,
  preview,
  unread,
  right,
  y,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      top: y,
      height: 104,
      display: 'flex',
      alignItems: 'center',
      padding: '0 36px 0 30px',
      borderBottom: `1px solid ${C.stroke}`,
      background: unread ? 'linear-gradient(90deg, rgba(0,194,178,0.10), rgba(0,194,178,0.0) 60%)' : undefined,
      boxShadow: unread ? `inset 4px 0 0 ${C.cyan}` : undefined,
      fontFamily: FONT_UI,
    }}
  >
    <div style={{width: 12, height: 12, borderRadius: 6, background: unread ? C.cyan : 'transparent', marginRight: 22}} />
    <div style={{width: 300, fontSize: 25, fontWeight: unread ? 600 : 400, color: unread ? C.mist : C.dim}}>{from}</div>
    <div style={{flex: 1, overflow: 'hidden', whiteSpace: 'nowrap'}}>
      <span style={{fontSize: 25, fontWeight: unread ? 600 : 400, color: unread ? C.mist : C.dim}}>{subject}</span>
      <span style={{fontSize: 23, color: 'rgba(244,247,250,0.38)'}}>{'  —  ' + preview}</span>
    </div>
    <div style={{marginLeft: 20}}>{right}</div>
  </div>
);

const Scene1: React.FC<{t: number}> = ({t}) => {
  const slam = sp(t, 0, {damping: 19, stiffness: 300, mass: 0.7});
  const days = t < 0.45 ? 1 : t < 0.85 ? 2 : 3;
  const tick = (d: number) => ramp(t, d === 2 ? 0.45 : 0.85, 0.25, EXPO_OUT);
  const tagScale = days === 1 ? 1 : 1 + 0.12 * (1 - tick(days));
  const tLand = W(1, "aren't") - 0.02;
  const drop = t < tLand - 0.28 ? 0 : keys(t, [tLand - 0.28, tLand], [0, 1], EXPO_IN);
  const shakeT = t - tLand;
  const shake = shakeT > 0 ? Math.exp(-shakeT * 7) * Math.sin(shakeT * 55) : 0;
  const capA = vis(t, W(1, 'waiting') - 0.1, tLand + 0.05, 0.3, 0.12);
  const capB = ramp(t, tLand + 0.02, 0.35, EXPO_OUT);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${shake * 14}px, ${shake * 8}px) rotate(${shake * 0.5}deg)`,
        }}
      >
        <Card
          style={{
            left: 170,
            top: 96,
            width: 1580,
            height: 700,
            transform: `translateY(${(1 - slam) * -60}px) scale(${lerp(1.16, 1, slam)})`,
            opacity: Math.min(1, t * 12),
          }}
        >
          <Chrome title="Inbox" h={54} />
          <div style={{position: 'absolute', top: 54, bottom: 0, left: 0, width: 250, borderRight: `1px solid ${C.stroke}`, padding: '28px 0'}}>
            {['Inbox', 'Quotes', 'Orders', 'Sent', 'Drafts'].map((s, i) => (
              <div
                key={s}
                style={{
                  padding: '14px 30px',
                  fontSize: 23,
                  fontWeight: i === 0 ? 600 : 400,
                  color: i === 0 ? C.mist : C.dim,
                  background: i === 0 ? 'rgba(244,247,250,0.05)' : undefined,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>{s}</span>
                {i === 0 ? <span style={{color: C.cyan}}>12</span> : null}
              </div>
            ))}
          </div>
          <div style={{position: 'absolute', top: 54, left: 250, right: 0, bottom: 0}}>
            <InboxRow
              y={0}
              unread
              from="Sample Pty Ltd"
              subject="RFQ: 40 × Part #EX-2041"
              preview="Hi, could you please quote…"
              right={
                <div style={{transform: `scale(${tagScale})`}}>
                  <Tag tone="red" size={22}>{`Waiting ${days} day${days > 1 ? 's' : ''}`}</Tag>
                </div>
              }
            />
            <InboxRow y={104} from="Example Builders" subject="Re: delivery window" preview="Following up on…" />
            <InboxRow y={208} from="Demo Electrical" subject="Spec sheet request" preview="Can you send the…" />
            <InboxRow y={312} from="Sample Pty Ltd" subject="Order SO-1182" preview="Where is my order…" />
            <InboxRow y={416} from="Marketing" subject="LinkedIn post (draft)" preview="Not started" />
            <InboxRow y={520} from="Website" subject="Contact form" preview="New enquiry…" />
          </div>
        </Card>
        {/* second email drops on "aren't" */}
        {drop > 0 ? (
          <Card
            glow={0.2}
            style={{
              left: 520,
              top: lerp(-320, 230, drop),
              width: 980,
              height: 230,
              transform: `rotate(${lerp(-4, 0, drop) + shake * 2}deg)`,
            }}
          >
            <div style={{padding: '30px 38px', fontFamily: FONT_UI}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                <div style={{width: 12, height: 12, borderRadius: 6, background: C.cyan}} />
                <div style={{fontSize: 25, fontWeight: 600}}>Sample Pty Ltd</div>
                <div style={{fontSize: 22, color: C.dim}}>· Re: RFQ: 40 × Part #EX-2041</div>
              </div>
              <div style={{marginTop: 26, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 64, letterSpacing: '-0.02em'}}>Any update?</div>
            </div>
          </Card>
        ) : null}
      </div>
      {/* burned-in caption */}
      <div style={{position: 'absolute', left: 170, top: 858, height: 120}}>
        <div style={{position: 'absolute', opacity: capA, transform: `translateY(${(1 - capA) * 20}px)`, whiteSpace: 'nowrap'}}>
          <span style={{fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 84, letterSpacing: '-0.02em', color: C.mist}}>RFQ waiting…</span>
        </div>
        <div style={{position: 'absolute', opacity: capB, transform: `translateY(${(1 - capB) * 30}px)`, whiteSpace: 'nowrap'}}>
          <span style={{fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 84, letterSpacing: '-0.02em', color: C.mist}}>
            Customer: <span style={{color: C.cyan}}>“Any update?”</span>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 2 — one team, four jobs (3.0 – 9.5)
// ---------------------------------------------------------------------------
const TILES = [
  {icon: 'agent-rfq-quote', word: 'quoting', label: 'Quote.'},
  {icon: 'box', word: 'packing', label: 'Pack.'},
  {icon: 'invoice', word: 'chasing', label: 'Chase.'},
  {icon: 'post', word: 'posting', label: 'Post.'},
];

const Scene2: React.FC<{t: number}> = ({t}) => {
  const base = {x: 600, y: 846}; // centre of the "Your team" circle
  const circle = sp(t, 3.05, {damping: 13, stiffness: 200, mass: 0.6});
  const lands = TILES.map((x) => W(2, x.word) + 0.12);
  // wobble: each landing kicks a decaying oscillation, growing with weight
  let ang = 0;
  lands.forEach((tl, k) => {
    const d = t - tl;
    if (d > 0) ang += (1.1 + k * 1.1) * Math.exp(-d * 2.2) * Math.sin(d * 9 + k);
  });
  const sway = t > lands[3] ? Math.sin((t - lands[3]) * 6.2) * Math.min(1, (t - lands[3]) / 0.8) * 3.2 : 0;
  const topple = 8.8;
  const fall = t > topple ? keys(t, [topple, topple + 0.75], [0, 1], EXPO_IN) : 0;
  const rot = ang + sway + fall * 78;
  const words = TILES.map((x) => ({text: x.label.replace('.', ''), at: W(2, x.word)}));
  const out = ramp(t, 9.3, 0.3, EXPO_OUT);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 140, top: 150, opacity: 1 - out}}>
        <Words t={t} size={58} color={C.dim} words={['You', 'run', 'lean.'].map((w, i) => ({text: w, at: [W(2, 'you'), W(2, 'run'), W(2, 'lean')][i]}))} />
      </div>
      {/* the stack */}
      <div
        style={{
          position: 'absolute',
          left: base.x,
          top: base.y - 46,
          width: 0,
          height: 0,
          transform: `rotate(${rot}deg) translate(${fall * 120}px, ${fall * fall * 260}px)`,
          transformOrigin: '0 0',
          opacity: 1 - ramp(t, 9.35, 0.25, CUBIC_INOUT),
        }}
      >
        {TILES.map((tile, k) => {
          const tl = lands[k];
          const p = t < tl - 0.5 ? 0 : sp(t, tl - 0.5, {damping: 14, stiffness: 190, mass: 0.7});
          if (p <= 0) return null;
          const yRest = -70 - k * 140;
          const squash = t > tl ? 1 - 0.07 * Math.exp(-(t - tl) * 9) * Math.cos((t - tl) * 20) : 1;
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: -66 + (k % 2 ? 6 : -4),
                top: lerp(-1100, yRest, p) - 66,
                width: 132,
                height: 132,
                transform: `scale(${2 - squash}, ${squash}) rotate(${(k % 2 ? 1 : -1) * 1.5}deg)`,
                transformOrigin: '50% 100%',
              }}
            >
              <Card style={{inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.mist}} glow={0.15}>
                <Icon name={tile.icon} size={70} color={C.mist} />
              </Card>
            </div>
          );
        })}
      </div>
      {/* "Your team" */}
      <div
        style={{
          position: 'absolute',
          left: base.x - 46,
          top: base.y - 46,
          width: 92,
          height: 92,
          borderRadius: 46,
          background: C.cyan,
          boxShadow: `0 0 40px rgba(0,194,178,0.55)`,
          transform: `scale(${circle}) scaleY(${1 - 0.025 * lands.filter((x) => t > x).length})`,
          transformOrigin: '50% 100%',
          opacity: 1 - out,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: base.x - 150,
          width: 300,
          top: base.y + 62,
          textAlign: 'center',
          fontFamily: FONT_DISPLAY,
          fontWeight: 500,
          fontSize: 30,
          color: C.mist,
          opacity: ramp(t, 3.2, 0.4) * (1 - out),
        }}
      >
        Your team
      </div>
      {/* Quote. Pack. Chase. Post. */}
      <div style={{position: 'absolute', left: 1060, top: 250, opacity: 1 - out}}>
        {words.map((w, i) => (
          <Words key={i} t={t} size={124} words={[{text: w.text, at: w.at}, {text: '.', at: w.at + 0.05, color: C.cyan}]} gap={0} style={{marginBottom: 8}} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 3 — questions pile up, website gathers dust (9.5 – 14.0)
// ---------------------------------------------------------------------------
const Bubble: React.FC<{text: string; x: number; y: number; s: number; size?: number; dim?: number; tail?: 'l' | 'r'}> = ({text, x, y, s, size = 30, dim = 0, tail = 'l'}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(-50%,-50%) scale(${s})`,
      padding: `${size * 0.62}px ${size * 0.9}px`,
      borderRadius: size * 0.9,
      borderBottomLeftRadius: tail === 'l' ? size * 0.2 : size * 0.9,
      borderBottomRightRadius: tail === 'r' ? size * 0.2 : size * 0.9,
      background: `linear-gradient(180deg, ${C.panelHi}, ${C.panel})`,
      border: `1px solid ${C.strokeHi}`,
      boxShadow: '0 18px 40px rgba(0,0,0,.35)',
      fontFamily: FONT_UI,
      fontWeight: 500,
      fontSize: size,
      color: C.mist,
      whiteSpace: 'nowrap',
      opacity: (1 - dim * 0.5) * Math.min(1, s * 2),
    }}
  >
    {text}
  </div>
);

const GRID_Q = [
  "Where's my order?",
  'Spec sheet for #EX-2041?',
  'Any update?',
  'Is EX-3307 in stock?',
  "Where's my order?",
  'Which rod for clay soil?',
  'ETA on SO-1190?',
  'Lead time?',
  "Where's my order?",
  'Any update?',
  'Spec for EX-5120?',
  "Where's my order?",
];

const Scene3: React.FC<{t: number}> = ({t}) => {
  const tA = W(3, 'spec');
  const tB = W(3, "where's");
  const tWeb = W(3, 'website');
  const tGrid = tB + 0.55;
  const g = ramp(t, tGrid, 0.6, QUART_INOUT); // big bubbles -> grid
  const iris = ramp(t, 13.5, 0.5, EXPO_IN);
  const irisR = lerp(1300, 12, iris);
  const grey = ramp(t, W(3, 'nobodys') - 0.1, 1.2, CUBIC_INOUT);
  const fallIn = ramp(t, 9.5, 0.35, EXPO_OUT);
  return (
    <AbsoluteFill style={{clipPath: `circle(${irisR}px at 960px 540px)`}}>
      {/* small grid of repeating questions */}
      {GRID_Q.map((q, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const at = tGrid + 0.08 * i + rand(i) * 0.05;
        const s = sp(t, at, {damping: 14, stiffness: 240, mass: 0.5});
        return <Bubble key={i} text={q} x={170 + col * 290 + (row % 2) * 60} y={250 + row * 150} s={s * 0.8} size={24} dim={0.4} tail={i % 2 ? 'r' : 'l'} />;
      })}
      <Bubble text="Which earth rod for clay soil?" x={lerp(560, 300, g)} y={lerp(360, 820, g)} s={sp(t, tA - 0.05, {damping: 13, stiffness: 230, mass: 0.6}) * lerp(1.25, 0.95, g)} size={36} />
      <Bubble text="Where's my order?" x={lerp(700, 420, g)} y={lerp(560, 930, g)} s={sp(t, tB - 0.05, {damping: 13, stiffness: 230, mass: 0.6}) * lerp(1.35, 0.95, g)} size={36} tail="r" />
      {/* browser mockup */}
      {t > tWeb - 0.4 ? (
        <div style={{position: 'absolute', left: 1080, top: 240, width: 700, height: 560, transform: `translateY(${(1 - sp(t, tWeb - 0.15)) * 60}px)`, opacity: ramp(t, tWeb - 0.2, 0.3)}}>
          <Card style={{inset: 0, filter: `grayscale(${grey}) brightness(${1 - grey * 0.25})`}}>
            <div style={{height: 52, display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', borderBottom: `1px solid ${C.stroke}`}}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{width: 10, height: 10, borderRadius: 5, background: 'rgba(244,247,250,0.16)'}} />
              ))}
              <div style={{marginLeft: 14, flex: 1, height: 28, borderRadius: 8, background: 'rgba(244,247,250,0.06)', fontSize: 16, color: C.dim, display: 'flex', alignItems: 'center', padding: '0 12px'}}>
                your website
              </div>
            </div>
            <div style={{padding: 34}}>
              <div style={{width: 360, height: 26, borderRadius: 6, background: 'rgba(244,247,250,0.22)'}} />
              <div style={{width: 260, height: 18, borderRadius: 6, background: 'rgba(244,247,250,0.12)', marginTop: 16}} />
              <div style={{width: 150, height: 40, borderRadius: 10, background: C.cyan, marginTop: 28, opacity: 0.85}} />
              <div style={{display: 'flex', gap: 18, marginTop: 40}}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{flex: 1, height: 130, borderRadius: 12, background: 'rgba(244,247,250,0.06)', border: `1px solid ${C.stroke}`}} />
                ))}
              </div>
            </div>
          </Card>
          <div style={{position: 'absolute', left: 34, bottom: 30, fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 32, color: C.mist, opacity: ramp(t, W(3, 'nobodys'), 0.4)}}>
            Website: <span style={{color: C.dim}}>last updated…</span>
          </div>
          {/* dust settling */}
          {Array.from({length: 46}).map((_, i) => {
            const st = W(3, 'nobodys') + rand(i) * 1.2;
            const p = ramp(t, st, 1.6 + rand(i + 9), QUINT_OUT);
            if (p <= 0) return null;
            const x = rand(i + 3) * 700;
            const yEnd = 52 + rand(i + 5) * 500;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: x + Math.sin(t * 2 + i) * 6,
                  top: lerp(yEnd - 120, yEnd, p),
                  width: 2 + rand(i + 7) * 3,
                  height: 2 + rand(i + 7) * 3,
                  borderRadius: 3,
                  background: C.mist,
                  opacity: 0.35 * Math.min(1, p * 3),
                }}
              />
            );
          })}
        </div>
      ) : null}
      {/* iris leaves a dot that becomes the clock centre */}
      <div style={{position: 'absolute', inset: 0, opacity: iris, background: C.navy}} />
      <div
        style={{
          position: 'absolute',
          left: 960 - 10,
          top: 540 - 10,
          width: 20,
          height: 20,
          borderRadius: 10,
          background: C.cyan,
          opacity: iris,
          boxShadow: `0 0 24px rgba(0,194,178,0.8)`,
        }}
      />
      <div style={{position: 'absolute', inset: 0, background: C.navy, opacity: 1 - fallIn, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 — no hours; clock -> spinner -> C (14.0 – 21.0)
// ---------------------------------------------------------------------------
const Scene4: React.FC<{t: number}> = ({t}) => {
  const grow = ramp(t, 14.0, 0.6, EXPO_OUT);
  const tHours = W(4, 'hours');
  const toSpinner = ramp(t, tHours - 0.1, 0.6, CUBIC_INOUT);
  const textOut = 17.75;
  // clock sits above the type, then glides to the logo position
  const move = ramp(t, 18.0, 1.6, QUART_INOUT);
  const clockC = {x: 960, y: 300};
  const r0 = 120; // px radius of the clock
  const rLogo = MARK.r * LOGO_S;
  const r = lerp(r0, rLogo, move);
  const cx = lerp(clockC.x, LOGO_BOX.x + MARK.cx * LOGO_S, move);
  const cy = lerp(clockC.y, LOGO_BOX.y + MARK.cy * LOGO_S, move);
  // hands: minute hand speeds up, both collapse into a spinner arc
  const spin = t < 14 ? 0 : (t - 14) * 300 + Math.pow(Math.max(0, t - 14), 2) * 220;
  // spinner: clockwise rotation + breathing sweep that never completes, then a
  // Hermite deceleration that parks the head exactly on the C's start (-40deg).
  const OMEGA = 520;
  const tS = 19.4;
  const dS = 1.45;
  const th0 = OMEGA * (tS - 14);
  const thT = (() => {
    const want = th0 + (OMEGA * dS) / 2;
    const k = Math.round((want - 320) / 360);
    let v = 320 + 360 * k;
    if (v - th0 < (OMEGA * dS) / 3) v += 360;
    return v;
  })();
  const theta = (() => {
    if (t <= tS) return OMEGA * (t - 14);
    if (t >= tS + dS) return thT;
    const s = (t - tS) / dS;
    const h00 = 2 * s ** 3 - 3 * s ** 2 + 1;
    const h10 = s ** 3 - 2 * s ** 2 + s;
    const h01 = -2 * s ** 3 + 3 * s ** 2;
    return h00 * th0 + h10 * OMEGA * dS + h01 * thT;
  })();
  const breathe = 60 + 190 * (0.5 + 0.5 * Math.sin((t - 16.8) * 4.2));
  const sweep = lerp(breathe, 0.5, ramp(t, 20.1, 0.75, CUBIC_INOUT));
  const sw = lerp(5, MARK.sw, move) / (r / MARK.r); // stroke in mark units
  const col = C.cyan;
  const words1 = ['You', 'know', 'you', 'should', 'be', 'using', 'AI.'].map((w, i) => ({
    text: w,
    at: W(4, w.replace('.', ''), w === 'you' ? 1 : 0),
    color: w === 'AI.' ? C.cyan : undefined,
  }));
  words1[0].at = W(4, 'you', 0);
  const words2 = ['You', 'just', "don't", 'have', 'the', 'hours.'].map((w) => ({
    text: w,
    at: w === 'You' ? W(4, 'you', 2) : W(4, w.replace('.', '')),
  }));
  const clockFace = 1 - toSpinner;
  const dotP = ramp(t, 20.75, 0.25, EXPO_OUT);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
        <Words t={t} size={80} words={words1} out={textOut} />
        <Words t={t} size={80} words={words2} out={textOut + 0.08} />
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <g opacity={grow}>
          {/* clock face */}
          <g opacity={clockFace}>
            <circle cx={cx} cy={cy} r={r * grow} fill="none" stroke={C.mist} strokeWidth={6} opacity={0.9} />
            {Array.from({length: 12}).map((_, i) => {
              const a = (i * 30 * Math.PI) / 180;
              return (
                <line
                  key={i}
                  x1={cx + Math.cos(a) * r * 0.8 * grow}
                  y1={cy + Math.sin(a) * r * 0.8 * grow}
                  x2={cx + Math.cos(a) * r * 0.9 * grow}
                  y2={cy + Math.sin(a) * r * 0.9 * grow}
                  stroke={C.mist}
                  strokeWidth={4}
                  strokeLinecap="round"
                  opacity={0.5}
                />
              );
            })}
            <line x1={cx} y1={cy} x2={cx + Math.cos(((spin - 90) * Math.PI) / 180) * r * 0.72} y2={cy + Math.sin(((spin - 90) * Math.PI) / 180) * r * 0.72} stroke={C.mist} strokeWidth={6} strokeLinecap="round" />
            <line x1={cx} y1={cy} x2={cx + Math.cos(((spin / 12 - 90) * Math.PI) / 180) * r * 0.48} y2={cy + Math.sin(((spin / 12 - 90) * Math.PI) / 180) * r * 0.48} stroke={C.mist} strokeWidth={7} strokeLinecap="round" />
          </g>
          {/* centre dot (carried from the scene 3 iris) */}
          <circle cx={cx} cy={cy} r={10 * clockFace} fill={C.cyan} />
          {/* spinner */}
          {toSpinner > 0 && t < 21.0 ? (
            <g transform={`translate(${cx - MARK.cx * (r / MARK.r)} ${cy - MARK.cy * (r / MARK.r)}) scale(${r / MARK.r})`} opacity={toSpinner}>
              <path
                d={arcPath(theta, sweep * toSpinner)}
                fill="none"
                stroke={col}
                strokeWidth={sw}
                strokeLinecap="round"
                style={{filter: `drop-shadow(0 0 ${6 / (r / MARK.r)}px rgba(0,194,178,0.8))`}}
              />
            </g>
          ) : null}
          {/* the spinner collapses to a glowing point at the C's start */}
          {dotP > 0 && t < 21.05 ? (
            <circle cx={LOGO_BOX.x + 87.227 * LOGO_S} cy={LOGO_BOX.y + 35.895 * LOGO_S} r={10 + 6 * dotP} fill={C.cyan} opacity={0.9} style={{filter: 'blur(1px)'}} />
          ) : null}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const Problem: React.FC<{t: number}> = ({t}) => (
  <>
    {t < 3.0 ? <Scene1 t={t} /> : null}
    {t >= 3.0 && t < 9.85 ? <Scene2 t={t} /> : null}
    {t >= 9.5 && t < 14.05 ? <Scene3 t={t} /> : null}
    {t >= 14.0 && t < 21.05 ? <Scene4 t={t} /> : null}
  </>
);
