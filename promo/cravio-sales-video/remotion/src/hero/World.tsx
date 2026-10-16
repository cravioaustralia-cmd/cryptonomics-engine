import React from 'react';
import {C, CUBIC_INOUT, EXPO_IN, EXPO_OUT, FONT_DISPLAY, FONT_UI, GLOW, QUART_INOUT, QUINT_OUT, keys, lerp, ramp, rand, sp, vis} from '../theme';
import {HERO, wordAt} from '../timing';
import {Badge, Callout, Card, Chrome, Pointer, StationTitle, Tag, Words, Letters} from '../components/ui';
import {Icon} from '../brand/Icon';
import {LogoLockup} from '../brand/Logo';
import {Pulses, dash} from '../components/scenery';

const W = (s: number, w: string, n = 0) => wordAt(HERO, s, w, n);
const SW = 1920;
const SH = 1080;
export const Y1 = 930; // level-1 conveyor (world y)
export const Y2 = Y1 - SH; // level-2 conveyor

// ---------------------------------------------------------------------------
// Camera: one continuous move along the production line
// ---------------------------------------------------------------------------
type Move = [number, number, number, number]; // t0, t1, x1, y1
const MOVES: Move[] = [
  [25.75, 27.3, SW * 1, 0],
  [35.6, 36.4, SW * 2, 0],
  [39.95, 40.7, SW * 3, 0],
  [44.05, 44.8, SW * 4, 0],
  [47.45, 48.75, SW * 5, -SH],
  [58.3, 59.2, SW * 6, -SH],
];
export const camAt = (t: number) => {
  let x = 0;
  let y = 0;
  for (const [t0, t1, x1, y1] of MOVES) {
    if (t <= t0) break;
    const p = ramp(t, t0, t1 - t0, QUART_INOUT);
    x = lerp(x, x1, p);
    y = lerp(y, y1, p);
  }
  return {x, y};
};

// Track geometry (world coords). Style from hero.svg layer-assembly-tracks.
const MAIN_R = `M 960 ${Y1} H 9500 Q 9540 ${Y1} 9540 ${Y1 - 40} V ${Y2 + 40} Q 9540 ${Y2} 9580 ${Y2} H 13900`;
const MAIN_L = `M 960 ${Y1} H -300`;
const FEED = `M 960 700 V ${Y1}`;

/** Places children in a station tile (k along the line, level 1 or 2). */
const Tile: React.FC<{k: number; level?: 1 | 2; cam: {x: number; y: number}; children: React.ReactNode}> = ({k, level = 1, cam, children}) => {
  const x = SW * k;
  const y = level === 2 ? -SH : 0;
  if (Math.abs(x - cam.x) > SW * 1.05 || Math.abs(y - cam.y) > SH * 1.05) return null;
  return <div style={{position: 'absolute', left: x, top: y, width: SW, height: SH}}>{children}</div>;
};

/** Item riding the conveyor: small card with an icon. */
const Token: React.FC<{x: number; y: number; icon: string; s?: number; glow?: number; label?: string}> = ({x, y, icon, s = 1, glow = 0.4, label}) => (
  <div style={{position: 'absolute', left: x - 34, top: y - 80, width: 68, height: 68, transform: `scale(${s})`, transformOrigin: '50% 100%'}}>
    <Card glow={glow} style={{inset: 0, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.mist}}>
      <Icon name={icon} size={38} color={C.mist} strokePx={2.6} />
    </Card>
    {label ? (
      <div style={{position: 'absolute', top: 76, left: -40, right: -40, textAlign: 'center', fontFamily: FONT_UI, fontSize: 16, color: C.dim}}>{label}</div>
    ) : null}
  </div>
);

/** Station node on the line (hero agent-node style). */
const Node: React.FC<{x: number; y: number; icon: string; label: string; on: number}> = ({x, y, icon, label, on}) => (
  <div style={{position: 'absolute', left: x - 30, top: y - 30, width: 60, height: 60}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 12,
        background: C.navy,
        border: `2px solid ${on > 0.5 ? C.cyan : 'rgba(244,247,250,0.5)'}`,
        boxShadow: on > 0 ? GLOW(0.5 * on, 22) : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: on > 0.5 ? C.cyan : C.mist,
      }}
    >
      <Icon name={icon} size={30} strokePx={2.2} />
    </div>
    <div style={{position: 'absolute', top: 68, left: -60, right: -60, textAlign: 'center', fontFamily: FONT_UI, fontWeight: 500, fontSize: 17, color: C.dim}}>{label}</div>
  </div>
);

// ---------------------------------------------------------------------------
// Scene 5 — logo reveal + traces become the conveyor (21.0 – 27.0)
// ---------------------------------------------------------------------------
const S = 2.977; // px per logo unit (shared with scene 4)
const LogoReveal: React.FC<{t: number}> = ({t}) => {
  const tMeet = W(5, 'meet');
  const toCentre = ramp(t, tMeet - 0.05, 0.8, QUART_INOUT);
  const left = lerp(960 - 68 * S, 960 - (349.4 * S) / 2, toCentre);
  const shrink = ramp(t, 25.3, 0.8, QUART_INOUT);
  const tTag = W(5, 'ai', 1);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform: `translateY(${-shrink * 150}px) scale(${lerp(1, 0.66, shrink)})`,
        transformOrigin: '960px 470px',
      }}
    >
      <div style={{position: 'absolute', left, top: 470 - 68 * S}}>
        <LogoLockup
          id="s5"
          layout="h"
          width={349.4 * S}
          t0={21.0}
          dur={0.85}
          t={t}
          word={ramp(t, tMeet + 0.1, 0.9, EXPO_OUT)}
          pulseAt={21.95}
          cyanArc={1 - ramp(t, 21.8, 0.7, CUBIC_INOUT)}
        />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 712, display: 'flex', justifyContent: 'center'}}>
        <Letters t={t} text="AI that runs like a factory." at={tTag - 0.05} span={1.0} size={70} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Station 1 — RFQ / quote-draft agent (scene 6)
// ---------------------------------------------------------------------------
const PARTS = [
  {pn: 'EX-2041', qty: '40 ×', desc: 'Earth rod, 1.8 m'},
  {pn: 'EX-3307', qty: '12 ×', desc: 'Rod clamp'},
  {pn: 'EX-5120', qty: '25 ×', desc: 'Earth cable, 6 mm²'},
];
const CAT = [
  {pn: 'EX-2041', desc: 'Earth rod, 1.8 m', m: 0},
  {pn: 'EX-2310', desc: 'Inspection pit', m: -1},
  {pn: 'EX-3307', desc: 'Rod clamp', m: 1},
  {pn: 'EX-5120', desc: 'Earth cable, 6 mm²', m: 2},
];
const Bar: React.FC<{w: number; o?: number}> = ({w, o = 0.18}) => <div style={{width: w, height: 12, borderRadius: 6, background: `rgba(244,247,250,${o})`}} />;

const StationRFQ: React.FC<{t: number}> = ({t}) => {
  const tTitle = W(6, 'one') - 0.3;
  const tEmail = W(6, 'one');
  const tRfq = W(6, 'rfqs');
  const tMatch = W(6, 'matches');
  const tCat = W(6, 'catalog');
  const tPrice = W(6, 'price');
  const tDraft = W(6, 'drafts');
  const tTpl = W(6, 'template');
  const email = {x: 130, y: 250, w: 560, h: 560};
  const cat = {x: 770, y: 290, w: 520, h: 420};
  const quote = {x: 1370, y: 230, w: 430, h: 600};
  const eIn = sp(t, tEmail - 0.05);
  const cIn = sp(t, tMatch - 0.25);
  const qIn = sp(t, tDraft - 0.35);
  const qOut = ramp(t, 35.55, 0.6, EXPO_IN); // doc drops to the line
  const flag = sp(t, tTpl + 0.15, {damping: 12, stiffness: 260, mass: 0.6});
  const partRowY = (i: number) => email.y + 268 + i * 58;
  // opening line-up on "We build and deploy AI agents for your firm"
  const LINEUP = [
    {icon: 'agent-rfq-quote', label: 'RFQ / quotes', at: W(6, 'build')},
    {icon: 'agent-spec-catalogue', label: 'Spec answers', at: W(6, 'deploy')},
    {icon: 'agent-order-status', label: 'Order status', at: W(6, 'agents')},
    {icon: 'agent-lead-research', label: 'Lead research', at: W(6, 'firm')},
  ];
  const lineOut = ramp(t, tEmail - 0.25, 0.45, QUART_INOUT);
  const catRowY = (i: number) => cat.y + 118 + i * 66;
  return (
    <>
      <StationTitle t={t} at={tTitle} kicker="AI agents for your firm" title="RFQ / quote-draft agent" icon="agent-rfq-quote" x={130} y={70} />
      {lineOut < 1
        ? LINEUP.map((a, i) => {
            const p = sp(t, a.at - 0.08);
            const x = 960 + (i - 1.5) * 330;
            const fly = i === 0 ? lineOut : 0;
            return (
              <div
                key={a.icon}
                style={{
                  position: 'absolute',
                  left: lerp(x, 130 + 42, fly) - 85,
                  top: lerp(420, 70 + 42, fly) - 85,
                  width: 170,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 22,
                  transform: `scale(${p * lerp(1, 0.5, fly)}) translateY(${i === 0 ? 0 : lineOut * 60}px)`,
                  opacity: i === 0 ? 1 - fly : 1 - lineOut,
                }}
              >
                <Badge icon={a.icon} size={150} />
                <div style={{fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 28, color: C.mist, whiteSpace: 'nowrap'}}>{a.label}</div>
              </div>
            );
          })
        : null}
      {lineOut < 1 ? (
        <svg width={SW} height={SH} style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 1 - lineOut}}>
          {[0, 1, 2, 3].map((i) => {
            const x = 960 + (i - 1.5) * 330;
            const d = `M ${x} 520 V ${Y1}`;
            return <path key={i} d={d} stroke={C.cyan} strokeWidth={2} opacity={0.5} fill="none" {...dash(d, ramp(t, LINEUP[i].at + 0.05, 0.4, QUINT_OUT))} />;
          })}
        </svg>
      ) : null}
      {/* email */}
      <Card style={{left: email.x, top: email.y, width: email.w, height: email.h, opacity: eIn, transform: `translateY(${(1 - eIn) * 70}px) scale(${lerp(0.94, 1, eIn)})`}}>
        <Chrome title="Inbox · RFQ" />
        <div style={{padding: '24px 30px', fontSize: 22}}>
          <div style={{color: C.dim, fontSize: 19}}>From</div>
          <div style={{fontWeight: 600, marginTop: 4}}>Sample Pty Ltd</div>
          <div style={{color: C.dim, fontSize: 19, marginTop: 16}}>Subject</div>
          <div style={{fontWeight: 600, marginTop: 4}}>RFQ: earthing supplies</div>
          <div style={{marginTop: 26, color: C.dim}}>Hi team, please quote:</div>
        </div>
        {PARTS.map((p, i) => {
          const hl = ramp(t, tRfq + i * 0.12, 0.35, EXPO_OUT);
          return (
            <div key={p.pn} style={{position: 'absolute', left: 30, top: partRowY(i) - email.y - 20, fontSize: 23, display: 'flex', gap: 10, alignItems: 'center'}}>
              <span style={{color: C.dim}}>{p.qty}</span>
              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: `rgba(0,194,178,${0.2 * hl})`,
                  color: hl > 0.5 ? C.cyan : C.mist,
                  fontWeight: 600,
                  boxShadow: hl > 0 ? `inset 0 0 0 1px rgba(0,194,178,${0.6 * hl})` : undefined,
                }}
              >
                Part #{p.pn}
              </span>
            </div>
          );
        })}
        <div style={{position: 'absolute', left: 30, bottom: 30, fontSize: 21, color: C.dim}}>Thanks, Sam</div>
      </Card>
      {/* catalogue + price list */}
      <Card style={{left: cat.x, top: cat.y, width: cat.w, height: cat.h, opacity: cIn, transform: `translateY(${(1 - cIn) * 60}px)`}}>
        <Chrome title="Catalogue + price list" />
        <div style={{display: 'flex', padding: '18px 26px 8px', fontSize: 17, color: C.dim, letterSpacing: 0.4}}>
          <div style={{width: 130}}>PART</div>
          <div style={{flex: 1}}>DESCRIPTION</div>
          <div style={{width: 90, textAlign: 'right'}}>PRICE</div>
        </div>
        {CAT.map((r, i) => {
          const on = r.m >= 0 ? ramp(t, tCat + r.m * 0.18, 0.35, EXPO_OUT) : 0;
          const pr = r.m >= 0 ? ramp(t, tPrice + r.m * 0.12, 0.3) : 0;
          return (
            <div
              key={r.pn}
              style={{
                position: 'absolute',
                left: 12,
                right: 12,
                top: catRowY(i) - cat.y - 28,
                height: 56,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                padding: '0 14px',
                fontSize: 21,
                background: `rgba(0,194,178,${0.1 * on})`,
                boxShadow: on > 0 ? `inset 0 0 0 1px rgba(0,194,178,${0.45 * on})` : undefined,
              }}
            >
              <div style={{width: 130, fontWeight: 600, color: on > 0.5 ? C.cyan : C.mist}}>{r.pn}</div>
              <div style={{flex: 1, color: r.m >= 0 ? C.mist : C.dim}}>{r.desc}</div>
              <div style={{width: 90, display: 'flex', justifyContent: 'flex-end'}}>
                <Bar w={64} o={0.16 + 0.4 * pr} />
              </div>
            </div>
          );
        })}
      </Card>
      {/* match lines email -> catalogue */}
      <svg width={SW} height={SH} style={{position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none'}}>
        {PARTS.map((p, i) => {
          const j = CAT.findIndex((c) => c.pn === p.pn);
          const x0 = email.x + 292;
          const y0 = partRowY(i) - 2;
          const x1 = cat.x + 14;
          const y1 = catRowY(j) - 2;
          const d = `M ${x0} ${y0} C ${x0 + 140} ${y0}, ${x1 - 140} ${y1}, ${x1} ${y1}`;
          const pr = ramp(t, tMatch + i * 0.2, 0.55, QUINT_OUT);
          if (pr <= 0) return null;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={C.cyan} strokeWidth={2.5} opacity={0.85} {...dash(d, pr)} />
              <circle cx={x0} cy={y0} r={5} fill={C.cyan} />
              {pr > 0.98 ? <circle cx={x1} cy={y1} r={5} fill={C.cyan} /> : null}
            </g>
          );
        })}
      </svg>
      <div style={{position: 'absolute', left: cat.x, top: cat.y + cat.h + 28, opacity: ramp(t, tPrice + 0.35, 0.4), transform: `translateY(${(1 - ramp(t, tPrice + 0.35, 0.5)) * 14}px)`}}>
        <Tag tone="cyan" size={24} icon="check">Matched: catalogue + price list</Tag>
      </div>
      {/* quote in the customer's template */}
      <div
        style={{
          position: 'absolute',
          left: quote.x,
          top: quote.y,
          width: quote.w,
          height: quote.h,
          opacity: qIn * (1 - ramp(t, 35.95, 0.2)),
          transform: `translate(${qOut * -100}px, ${qOut * 520}px) scale(${lerp(1, 0.16, qOut)})`,
          transformOrigin: '50% 100%',
        }}
      >
        <Card glow={0.25 * qIn} style={{inset: 0, transform: `translateY(${(1 - qIn) * 60}px)`}}>
          <div style={{padding: '30px 32px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
              <div style={{fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 34, letterSpacing: '0.04em'}}>QUOTE</div>
              <div style={{fontSize: 18, color: C.dim}}>Q-0001 · draft</div>
            </div>
            <div style={{fontSize: 19, color: C.dim, marginTop: 10}}>Customer: Sample Pty Ltd</div>
            <div style={{height: 1, background: C.stroke, margin: '20px 0'}} />
            {PARTS.map((p, i) => {
              const a = ramp(t, tDraft + 0.15 + i * 0.32, 0.35, EXPO_OUT);
              return (
                <div key={p.pn} style={{display: 'flex', alignItems: 'center', height: 64, opacity: a, transform: `translateX(${(1 - a) * 24}px)`, borderBottom: `1px solid ${C.stroke}`}}>
                  <div style={{width: 64, fontSize: 19, color: C.dim}}>{p.qty}</div>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: 20, fontWeight: 600}}>{p.pn}</div>
                    <div style={{fontSize: 16, color: C.dim}}>{p.desc}</div>
                  </div>
                  <Bar w={56} o={0.3} />
                </div>
              );
            })}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, opacity: ramp(t, tDraft + 1.1, 0.3)}}>
              <div style={{fontSize: 19, color: C.dim}}>Total (ex GST)</div>
              <Bar w={90} o={0.4} />
            </div>
            <div style={{marginTop: 28, height: 44, borderRadius: 10, border: `1px dashed ${C.strokeHi}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: C.dim, opacity: ramp(t, tDraft + 1.25, 0.3)}}>
              Drafted in your template
            </div>
          </div>
          {/* amber flag on the clamp line */}
          <div style={{position: 'absolute', right: 22, top: 196 + 64, transform: `scale(${flag})`, transformOrigin: '100% 50%'}}>
            <Tag tone="amber" size={19}>Missing spec</Tag>
          </div>
        </Card>
      </div>
      <Callout t={t} at={tTpl + 0.3} text="Missing spec flagged" size={28} icon="bolt" style={{left: quote.x, top: quote.y + quote.h + 32}} out={35.5} />
    </>
  );
};

// ---------------------------------------------------------------------------
// Station 2 — spec assistant (scene 7a)
// ---------------------------------------------------------------------------
const ChatBubble: React.FC<{side: 'l' | 'r'; children: React.ReactNode; p: number; w?: number; style?: React.CSSProperties}> = ({side, children, p, w, style}) => (
  <div style={{display: 'flex', justifyContent: side === 'r' ? 'flex-end' : 'flex-start', ...style}}>
    <div
      style={{
        maxWidth: w ?? 620,
        padding: '18px 24px',
        borderRadius: 22,
        borderBottomRightRadius: side === 'r' ? 6 : 22,
        borderBottomLeftRadius: side === 'l' ? 6 : 22,
        background: side === 'r' ? 'rgba(244,247,250,0.08)' : 'rgba(0,194,178,0.12)',
        border: `1px solid ${side === 'r' ? C.stroke : 'rgba(0,194,178,0.35)'}`,
        fontSize: 24,
        lineHeight: 1.4,
        opacity: p,
        transform: `translateY(${(1 - p) * 20}px) scale(${lerp(0.96, 1, p)})`,
        transformOrigin: side === 'r' ? '100% 100%' : '0 100%',
      }}
    >
      {children}
    </div>
  </div>
);

const StationSpec: React.FC<{t: number}> = ({t}) => {
  const tA = W(7, 'another');
  const tQ = W(7, 'questions');
  const tDS = W(7, 'data');
  const tCite = W(7, 'citing');
  const typing = t > tQ - 0.1 && t < tDS - 0.15;
  const ans = ramp(t, tDS - 0.15, 0.4, EXPO_OUT);
  const ansWords = 'For clay soil, the datasheet recommends Part #EX-2041 (1.8 m rod).'.split(' ');
  const chip = sp(t, tCite);
  const link = ramp(t, tCite + 0.15, 0.55, QUINT_OUT);
  const pdf = sp(t, tDS - 0.3);
  const chat = sp(t, tA + 0.05);
  const card = {x: 130, y: 250, w: 900, h: 600};
  const pdfBox = {x: 1220, y: 300, w: 470, h: 470};
  const chipPos = {x: card.x + 34, y: card.y + 452};
  const d = `M ${chipPos.x + 318} ${chipPos.y + 22} C ${chipPos.x + 520} ${chipPos.y + 22}, ${pdfBox.x - 160} ${pdfBox.y + 320}, ${pdfBox.x} ${pdfBox.y + 320}`;
  return (
    <>
      <StationTitle t={t} at={tA + 0.15} kicker="Answers from your datasheets" title="Spec assistant" icon="agent-spec-catalogue" x={130} y={70} />
      <Card style={{left: card.x, top: card.y, width: card.w, height: card.h, opacity: chat, transform: `translateY(${(1 - chat) * 60}px)`}}>
        <Chrome title="Spec assistant" />
        <div style={{padding: '30px 34px', display: 'flex', flexDirection: 'column', gap: 22}}>
          <ChatBubble side="r" p={ramp(t, tA + 0.35, 0.4, EXPO_OUT)}>Which earth rod for clay soil?</ChatBubble>
          {typing ? (
            <div style={{display: 'flex', gap: 8, padding: '18px 24px', width: 92, borderRadius: 22, background: 'rgba(0,194,178,0.12)'}}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{width: 11, height: 11, borderRadius: 6, background: C.cyan, opacity: 0.4 + 0.6 * Math.max(0, Math.sin(t * 9 - i * 0.9))}} />
              ))}
            </div>
          ) : (
            <ChatBubble side="l" p={ans} w={700}>
              {ansWords.map((w, i) => (
                <span key={i} style={{opacity: ramp(t, tDS - 0.1 + i * 0.045, 0.2)}}>
                  {w.includes('EX-2041') ? <b style={{color: C.cyan}}>{w}</b> : w}{' '}
                </span>
              ))}
            </ChatBubble>
          )}
        </div>
        <div style={{position: 'absolute', left: 34, top: chipPos.y - card.y, transform: `scale(${chip})`, transformOrigin: '0 50%'}}>
          <Tag tone="cyan" size={22} icon="doc">Source: datasheet p.4</Tag>
        </div>
      </Card>
      <svg width={SW} height={SH} style={{position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none'}}>
        {link > 0 ? (
          <>
            <path d={d} fill="none" stroke={C.cyan} strokeWidth={2.5} {...dash(d, link)} />
            {link > 0.98 ? <circle cx={pdfBox.x} cy={pdfBox.y + 320} r={6} fill={C.cyan} /> : null}
          </>
        ) : null}
      </svg>
      <Card glow={link} style={{left: pdfBox.x, top: pdfBox.y, width: pdfBox.w, height: pdfBox.h, opacity: pdf, transform: `translateY(${(1 - pdf) * 50}px)`}}>
        <div style={{padding: 34, display: 'flex', gap: 22, alignItems: 'center'}}>
          <div style={{color: C.mist}}>
            <Icon name="doc" size={74} />
          </div>
          <div>
            <div style={{fontSize: 24, fontWeight: 600}}>EX-2041 datasheet</div>
            <div style={{fontSize: 18, color: C.dim, marginTop: 4}}>PDF · 6 pages</div>
          </div>
        </div>
        <div style={{margin: '0 34px', padding: 22, borderRadius: 12, background: 'rgba(244,247,250,0.04)', border: `1px solid ${link > 0.9 ? 'rgba(0,194,178,0.6)' : C.stroke}`}}>
          <div style={{fontSize: 17, color: link > 0.9 ? C.cyan : C.dim, marginBottom: 14, fontWeight: 600}}>p.4 · Soil guide</div>
          {[300, 340, 250, 320, 200].map((w, i) => (
            <div key={i} style={{marginBottom: 12}}>
              <Bar w={w} o={i === 2 && link > 0.9 ? 0.55 : 0.15} />
            </div>
          ))}
        </div>
      </Card>
      <Callout t={t} at={tCite + 0.25} text="Cites the source" size={30} icon="check" style={{left: pdfBox.x, top: pdfBox.y + pdfBox.h + 34}} />
    </>
  );
};

// ---------------------------------------------------------------------------
// Station 3 — order status (scene 7b)
// ---------------------------------------------------------------------------
const StationOrders: React.FC<{t: number}> = ({t}) => {
  const tA = W(7, 'another', 1);
  const tOrd = W(7, 'order');
  const tRep = W(7, 'replies');
  const tEsc = W(7, 'escalates');
  const tDel = W(7, 'delays');
  const table = sp(t, tA);
  const reply = sp(t, tRep - 0.15);
  const amber = ramp(t, tDel - 0.1, 0.3);
  const esc = sp(t, tDel + 0.3);
  const rows = [
    {so: 'SO-1182', c: 'Sample Pty Ltd', st: 'Dispatched', tone: 'cyan' as const},
    {so: 'SO-1187', c: 'Example Builders', st: 'In production', tone: 'slate' as const},
    {so: 'SO-1190', c: 'Demo Electrical', st: 'On schedule', tone: 'slate' as const},
  ];
  const sel = ramp(t, tOrd, 0.3);
  return (
    <>
      <StationTitle t={t} at={tA + 0.12} kicker="Replies drafted, delays escalated" title="Order status" icon="agent-order-status" x={130} y={70} />
      <Card style={{left: 130, top: 250, width: 880, height: 400, opacity: table, transform: `translateY(${(1 - table) * 60}px)`}}>
        <Chrome title="Orders" />
        <div style={{display: 'flex', padding: '20px 30px 8px', fontSize: 17, color: C.dim, letterSpacing: 0.4}}>
          <div style={{width: 170}}>ORDER</div>
          <div style={{flex: 1}}>CUSTOMER</div>
          <div style={{width: 230}}>STATUS</div>
        </div>
        {rows.map((r, i) => {
          const isDelay = i === 2 && amber > 0.5;
          const hl = i === 0 ? sel * (1 - ramp(t, tEsc - 0.2, 0.3)) : i === 2 ? amber : 0;
          const col = i === 2 ? C.amber : C.cyan;
          return (
            <div
              key={r.so}
              style={{
                margin: '6px 16px',
                height: 78,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                padding: '0 14px',
                fontSize: 23,
                background: hl > 0 ? `${col}${Math.round(hl * 26).toString(16).padStart(2, '0')}` : undefined,
                boxShadow: hl > 0 ? `inset 0 0 0 1px ${col}${Math.round(hl * 120).toString(16).padStart(2, '0')}` : undefined,
              }}
            >
              <div style={{width: 170, fontWeight: 600}}>{r.so}</div>
              <div style={{flex: 1, color: C.dim}}>{r.c}</div>
              <div style={{width: 230}}>
                <Tag tone={isDelay ? 'amber' : r.tone} size={19}>{isDelay ? 'Delay' : r.st}</Tag>
              </div>
            </div>
          );
        })}
      </Card>
      <Card glow={0.3 * reply} style={{left: 1070, top: 250, width: 720, height: 330, opacity: reply, transform: `translateY(${(1 - reply) * 60}px)`}}>
        <Chrome title="Draft reply · SO-1182" />
        <div style={{padding: '24px 30px', fontSize: 23, lineHeight: 1.5}}>
          {'Hi Sam, good news: order SO-1182 was dispatched today. Tracking details to follow.'.split(' ').map((w, i) => (
            <span key={i} style={{opacity: ramp(t, tRep + i * 0.05, 0.2)}}>{w} </span>
          ))}
        </div>
        <div style={{position: 'absolute', left: 30, bottom: 24}}>
          <Tag tone="cyan" size={19} icon="check">Reply drafted</Tag>
        </div>
      </Card>
      <Card glow={0.2 * esc} style={{left: 1070, top: 620, width: 720, height: 150, opacity: esc, transform: `translateY(${(1 - esc) * 50}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', height: '100%', padding: '0 30px', gap: 18}}>
          <div style={{fontSize: 23, fontWeight: 600}}>SO-1190</div>
          <Tag tone="amber" size={19}>Delay</Tag>
          <div style={{flex: 1, height: 2, background: `linear-gradient(90deg, ${C.amber}88, ${C.cyan})`, transform: `scaleX(${ramp(t, tDel + 0.45, 0.4)})`, transformOrigin: '0 50%'}} />
          <div style={{transform: `scale(${sp(t, tDel + 0.75)})`}}>
            <Tag tone="cyan" size={19} icon="check">Escalated to team</Tag>
          </div>
        </div>
      </Card>
      <Callout t={t} at={tRep + 0.2} text="Order status → reply drafted" size={30} style={{left: 130, top: 700}} />
      <Callout t={t} at={tDel + 0.2} text="Delay → escalated" size={30} style={{left: 130, top: 760}} />
    </>
  );
};

// ---------------------------------------------------------------------------
// Station 4 — lead research & outreach (scene 8)
// ---------------------------------------------------------------------------
const StationLeads: React.FC<{t: number}> = ({t}) => {
  const tA = W(8, 'and');
  const tLeads = W(8, 'leads');
  const tOut = W(8, 'outreach');
  const tRep = W(8, 'rep');
  const companies = [
    {n: 'Builder', chips: ['Region: NSW', 'Size: SME', 'Buys: fittings']},
    {n: 'Contractor', chips: ['Region: VIC', 'Size: SME', 'Buys: cable']},
    {n: 'Distributor', chips: ['Region: QLD', 'Size: mid', 'Buys: bulk']},
  ];
  const mail = sp(t, tOut - 0.2);
  const shield = sp(t, tRep - 0.3);
  return (
    <>
      <StationTitle t={t} at={tA + 0.1} kicker="For your sales rep" title="Lead research & outreach" icon="agent-lead-research" x={130} y={70} />
      {companies.map((c, i) => {
        const a = sp(t, tA + 0.25 + i * 0.1);
        return (
          <Card key={c.n} style={{left: 130, top: 260 + i * 176, width: 620, height: 150, opacity: a, transform: `translateX(${(1 - a) * -60}px)`}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '24px 26px 14px'}}>
              <div style={{color: C.mist}}>
                <Icon name="building" size={40} />
              </div>
              <div style={{fontSize: 26, fontWeight: 600}}>{c.n}</div>
              <div style={{marginLeft: 'auto', fontSize: 17, color: C.dim}}>Lead</div>
            </div>
            <div style={{display: 'flex', gap: 10, padding: '0 26px'}}>
              {c.chips.map((ch, j) => {
                const p = sp(t, tLeads + i * 0.12 + j * 0.08, {damping: 14, stiffness: 240, mass: 0.5});
                return (
                  <div key={ch} style={{transform: `scale(${p})`, transformOrigin: '0 50%', opacity: Math.min(1, p * 2)}}>
                    <Tag tone="cyan" size={17}>{ch}</Tag>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
      <svg width={SW} height={SH} style={{position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none'}}>
        {[0, 1, 2].map((i) => {
          const d = `M 750 ${335 + i * 176} C 800 ${335 + i * 176}, 790 470, 840 470`;
          const p = ramp(t, tOut - 0.3 + i * 0.08, 0.4, QUINT_OUT);
          return p > 0 ? <path key={i} d={d} fill="none" stroke={C.cyan} strokeWidth={2.5} opacity={0.8} {...dash(d, p)} /> : null;
        })}
      </svg>
      <Card glow={0.3 * mail} style={{left: 840, top: 260, width: 600, height: 500, opacity: mail, transform: `translateY(${(1 - mail) * 60}px)`}}>
        <Chrome title="Draft outreach" />
        <div style={{padding: '24px 30px', fontSize: 22}}>
          <div style={{color: C.dim, fontSize: 18}}>To</div>
          <div style={{fontWeight: 600, marginTop: 2}}>Builder · purchasing</div>
          <div style={{height: 1, background: C.stroke, margin: '18px 0'}} />
          {[460, 500, 420, 480, 300].map((w, i) => (
            <div key={i} style={{marginBottom: 16, opacity: ramp(t, tOut + i * 0.12, 0.25)}}>
              <Bar w={w} o={0.2} />
            </div>
          ))}
          <div style={{marginTop: 22, fontSize: 17, color: C.dim, opacity: ramp(t, tOut + 0.7, 0.3)}}>
            Unsubscribe · Why you're receiving this
          </div>
        </div>
        <div style={{position: 'absolute', left: 30, bottom: 22}}>
          <Tag tone="cyan" size={18}>Ready for your sales rep</Tag>
        </div>
      </Card>
      <div style={{position: 'absolute', left: 1490, top: 300, width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, transform: `scale(${shield})`}}>
        <div style={{width: 130, height: 130, borderRadius: 65, border: `2px solid ${C.cyan}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan, boxShadow: GLOW(0.4, 30)}}>
          <Icon name="shield" size={70} />
        </div>
        <div style={{fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 26, textAlign: 'center', color: C.mist}}>Consent + unsubscribe</div>
      </div>
      <Callout t={t} at={tRep - 0.05} text="Spam Act compliant" size={30} icon="check" style={{left: 1490, top: 610}} />
    </>
  );
};

// ---------------------------------------------------------------------------
// Station 5 — content engine (scene 9, level 2)
// ---------------------------------------------------------------------------
const FORMATS = [
  {w: 'linkedin', label: 'LinkedIn post', icon: 'post'},
  {w: 'blogs', label: 'Blog', icon: 'service-content-marketing'},
  {w: 'reels', label: 'Reel', icon: 'reel'},
  {w: 'seo', label: 'SEO page', icon: 'seo'},
  {w: 'newsletters', label: 'Newsletter', icon: 'mail'},
];
const PIPE = ['Research', 'LinkedIn & blog', 'Reels', 'SEO pages', 'Newsletters'];
const pipeAt = (i: number) => [W(9, 'engine') + 0.3, W(9, 'linkedin'), W(9, 'reels'), W(9, 'seo'), W(9, 'newsletters')][i];
export const cardSlot = (i: number) => ({x: 840 + i * 196, y: 470});

const StationContent: React.FC<{t: number}> = ({t}) => {
  const tThen = W(9, 'then');
  const tLaunch = W(9, 'product');
  const tFoot = W(9, 'factory');
  const press = {x: 620, y: 560, w: 200, h: 290};
  const pressIn = sp(t, W(9, 'content') - 0.1, {damping: 13, stiffness: 200, mass: 0.7});
  // inputs ride in along the line, then feed the press
  const inp = (t0: number, i: number) => {
    const p = ramp(t, t0 - 0.1, 0.9, CUBIC_INOUT);
    const feed = ramp(t, W(9, 'become') + i * 0.15, 0.5, EXPO_IN);
    const rest = 40 + i * 260;
    return {x: lerp(-260, rest, p) + feed * (press.x + 20 - rest), o: p * (1 - feed)};
  };
  const a = inp(tLaunch, 0);
  const b = inp(tFoot, 1);
  const toQueue = ramp(t, 57.0, 1.3, QUART_INOUT);
  return (
    <>
      <StationTitle t={t} at={tThen + 0.15} kicker="Marketing on autopilot, approved by you" title="Content engine" icon="agent-content-engine" x={130} y={70} />
      {/* pipeline label */}
      <div style={{position: 'absolute', left: 130, top: 255, display: 'flex', alignItems: 'center', gap: 16, fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 30}}>
        {PIPE.map((p, i) => {
          const on = ramp(t, pipeAt(i) - 0.05, 0.35, EXPO_OUT);
          return (
            <React.Fragment key={p}>
              {i > 0 ? <span style={{color: C.cyan, opacity: on}}>→</span> : null}
              <span style={{color: on > 0.5 ? C.mist : 'rgba(244,247,250,0.25)', opacity: 0.25 + 0.75 * on, transform: `translateY(${(1 - on) * 8}px)`, display: 'inline-block'}}>{p}</span>
            </React.Fragment>
          );
        })}
      </div>
      {/* inputs */}
      <div style={{position: 'absolute', left: a.x, top: Y1 - 200, opacity: a.o}}>
        <Card style={{position: 'relative', width: 230, height: 120, display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px'}}>
          <Icon name="doc" size={44} color={C.mist} />
          <div style={{fontSize: 21, fontWeight: 600, lineHeight: 1.2}}>Product launch</div>
        </Card>
      </div>
      <div style={{position: 'absolute', left: b.x, top: Y1 - 200, opacity: b.o}}>
        <Card style={{position: 'relative', width: 230, height: 120, display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px'}}>
          <Icon name="film" size={44} color={C.mist} />
          <div style={{fontSize: 21, fontWeight: 600, lineHeight: 1.2}}>Factory footage</div>
        </Card>
      </div>
      {/* the press */}
      <div style={{position: 'absolute', left: press.x, top: press.y, width: press.w, height: press.h, opacity: Math.min(1, pressIn * 2), transform: `scale(${pressIn})`, transformOrigin: '50% 100%'}}>
        <Card glow={0.4 + 0.6 * Math.max(0, ...FORMATS.map((f) => 1 - ramp(t, W(9, f.w), 0.4)).map((v, i) => (t > W(9, FORMATS[i].w) ? v : 0)))} style={{inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14}}>
          <div style={{color: C.cyan}}>
            <Icon name="agent-content-engine" size={84} />
          </div>
          <div style={{fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 22, color: C.mist}}>Content engine</div>
        </Card>
      </div>
      {/* five formats stamp out on the beat */}
      {FORMATS.map((f, i) => {
        const tw = W(9, f.w);
        const p = sp(t, tw - 0.12, {damping: 15, stiffness: 260, mass: 0.6});
        if (p <= 0) return null;
        const slot = cardSlot(i);
        const stamp = ramp(t, tw, 0.35, EXPO_OUT);
        const q = ramp(t, 57.0 + i * 0.06, 1.2, QUART_INOUT);
        const x = lerp(lerp(press.x + 40, slot.x, p), 1700 + i * 26, q);
        const y = lerp(slot.y, Y1 - 210 - i * 10, q);
        return (
          <div key={f.w} style={{position: 'absolute', left: x, top: y, width: 176, height: 230, transform: `scale(${lerp(0.6, 1, p) * lerp(1, 0.7, q)})`, transformOrigin: '50% 100%'}}>
            <Card glow={1 - stamp * 0.6} style={{inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18}}>
              <div style={{color: C.mist}}>
                <Icon name={f.icon} size={64} />
              </div>
              <div style={{fontSize: 20, fontWeight: 600, textAlign: 'center'}}>{f.label}</div>
            </Card>
            {/* cyan stamp */}
            <div
              style={{
                position: 'absolute',
                right: -14,
                top: -14,
                width: 48,
                height: 48,
                borderRadius: 24,
                background: C.cyan,
                color: C.navy,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${lerp(2.2, 1, stamp)})`,
                opacity: Math.min(1, stamp * 3),
                boxShadow: GLOW(0.7, 18),
              }}
            >
              <Icon name="check" size={30} strokePx={3.4} />
            </div>
            {stamp < 1 && stamp > 0 ? (
              <div style={{position: 'absolute', inset: -10, borderRadius: 26, border: `3px solid ${C.cyan}`, opacity: 1 - stamp, transform: `scale(${1 + stamp * 0.25})`}} />
            ) : null}
          </div>
        );
      })}
      {/* review queue label */}
      <div style={{position: 'absolute', left: 1620, top: Y1 - 330, opacity: toQueue, fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 28, color: C.mist}}>Review queue</div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Station 6 — the Approve gate (scene 10, the hero moment)
// ---------------------------------------------------------------------------
const QUEUE = ['agent-rfq-quote', 'chat', 'mail', 'post', 'reel', 'seo', 'mail'];
export const GATE = {x: 1000, btnX: 1000, btnY: 505};
const StationGate: React.FC<{t: number}> = ({t}) => {
  const tN = W(10, 'nothing');
  const tYes = W(10, 'yes');
  const click = 63.0;
  const press = Math.max(0, 1 - Math.abs(t - click) / 0.12);
  const clicked = t >= click;
  const open = ramp(t, click + 0.1, 0.45, BACK);
  const lit = ramp(t, click, 0.25, EXPO_OUT);
  // pointer path
  const pp = ramp(t, 62.15, 0.75, QUART_INOUT);
  const px = lerp(1560, GATE.btnX + 6, pp);
  const py = lerp(1060, GATE.btnY + 8, pp) - Math.sin(pp * Math.PI) * 80;
  const headline = [
    {text: 'Nothing', at: tN},
    {text: 'goes', at: W(10, 'goes')},
    {text: 'out', at: W(10, 'out')},
    {text: 'without', at: W(10, 'until')},
    {text: 'a', at: W(10, 'a')},
    {text: 'human', at: W(10, 'person')},
    {text: 'yes.', at: tYes, color: C.cyan},
  ];
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', justifyContent: 'center'}}>
        <Words t={t} size={86} words={headline} />
      </div>
      {/* gate posts + arm on the line */}
      <div style={{position: 'absolute', left: GATE.x - 70, top: Y1 - 230, width: 14, height: 240, borderRadius: 7, background: C.mist, opacity: 0.85}} />
      <div style={{position: 'absolute', left: GATE.x + 56, top: Y1 - 230, width: 14, height: 240, borderRadius: 7, background: C.mist, opacity: 0.85}} />
      <div
        style={{
          position: 'absolute',
          left: GATE.x - 64,
          top: Y1 - 132,
          width: 128,
          height: 14,
          borderRadius: 7,
          background: clicked ? C.cyan : C.mist,
          transform: `rotate(${-82 * open}deg)`,
          transformOrigin: '7px 7px',
          boxShadow: clicked ? GLOW(0.6, 16) : undefined,
        }}
      />
      <div style={{position: 'absolute', left: GATE.x - 120, width: 240, top: Y1 - 290, textAlign: 'center', fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 30, color: clicked ? C.cyan : C.mist}}>Approve</div>
      {/* big approve button */}
      <div
        style={{
          position: 'absolute',
          left: GATE.btnX - 70,
          top: GATE.btnY - 70,
          width: 140,
          height: 140,
          borderRadius: 70,
          border: `3px solid ${C.cyan}`,
          background: `rgba(0,194,178,${0.08 + 0.92 * lit})`,
          color: lit > 0.5 ? C.navy : C.cyan,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${(1 - press * 0.08) * sp(t, 59.6)})`,
          boxShadow: GLOW(0.35 + 0.5 * lit, 40),
        }}
      >
        <Icon name="check" size={78} strokePx={6} />
      </div>
      {lit > 0 && lit < 1 ? (
        <div style={{position: 'absolute', left: GATE.btnX - 70, top: GATE.btnY - 70, width: 140, height: 140, borderRadius: 70, border: `3px solid ${C.cyan}`, transform: `scale(${1 + lit * 0.9})`, opacity: 1 - lit}} />
      ) : null}
      {/* queued items */}
      {QUEUE.map((ic, i) => {
        const arrive = ramp(t, 58.6 + i * 0.07, 1.0, QUINT_OUT);
        const restX = GATE.x - 150 - i * 104;
        const flow = ramp(t, click + 0.3 + i * 0.12, 0.8, CUBIC_INOUT);
        const toBin = i % 2 === 0 ? 1430 : 1710;
        const x = lerp(lerp(restX - 900, restX, arrive), toBin, flow);
        const y = Y1 - Math.sin(flow * Math.PI) * 120 - flow * 150;
        const s = lerp(1, 0.55, flow);
        const o = (t < 58.45 ? 0 : 1) * (1 - ramp(t, click + 0.95 + i * 0.12, 0.15));
        return (
          <div key={i} style={{opacity: o}}>
            <Token x={x} y={y} icon={ic} s={s} glow={0.2 + 0.6 * flow} />
          </div>
        );
      })}
      {/* destinations */}
      {[
        {x: 1430, label: 'Scheduled', icon: 'calendar'},
        {x: 1710, label: 'Sent', icon: 'send'},
      ].map((b, i) => {
        const got = ramp(t, click + 1.0 + i * 0.12, 0.3);
        return (
          <div key={b.label} style={{position: 'absolute', left: b.x - 95, top: Y1 - 380, width: 190, opacity: ramp(t, 59.4, 0.5)}}>
            <Card glow={got} style={{position: 'relative', height: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12}}>
              <div style={{color: got > 0.5 ? C.cyan : C.mist}}>
                <Icon name={b.icon} size={50} />
              </div>
              <div style={{fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 24}}>{b.label}</div>
            </Card>
          </div>
        );
      })}
      {t > 62.0 && t < 64.5 ? <Pointer x={px} y={py} press={press} opacity={1 - ramp(t, 63.9, 0.3)} /> : null}
    </>
  );
};
const BACK = (x: number) => {
  const c1 = 1.2;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

// ---------------------------------------------------------------------------
// The world
// ---------------------------------------------------------------------------
export const World: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t);
  // horizontal motion blur from camera speed
  const c2 = camAt(t + 1 / 30);
  const vx = Math.abs(c2.x - cam.x);
  const vy = Math.abs(c2.y - cam.y);
  const blurX = Math.min(14, vx / 9);
  const blurY = Math.min(14, vy / 9);
  // conveyor draws out of the logo
  const feed = ramp(t, 25.35, 0.3, EXPO_IN);
  const shoot = ramp(t, 25.6, 0.55, EXPO_OUT);
  const rightLen = t < 25.6 ? 0 : t < 26.15 ? shoot * 1500 : 1500 + (t - 26.15) * 9000;
  const trackOn = t >= 25.35;
  const cyanFade = 1 - ramp(t, 26.3, 0.9, CUBIC_INOUT);
  const nodes = [
    {k: 1, icon: 'agent-rfq-quote', label: 'RFQ', on: [29.5, 35.8]},
    {k: 2, icon: 'agent-spec-catalogue', label: 'Specs', on: [36.2, 40.1]},
    {k: 3, icon: 'agent-order-status', label: 'Orders', on: [40.5, 44.3]},
    {k: 4, icon: 'agent-lead-research', label: 'Leads', on: [44.6, 47.6]},
  ];
  // tokens travelling between stations during camera moves
  const travel = (t0: number, x0: number, x1: number, dur = 0.85) => lerp(x0, x1, ramp(t, t0, dur, QUART_INOUT));
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="mblur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={`${blurX} ${blurY}`} />
          </filter>
        </defs>
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(${-cam.x}px, ${-cam.y}px)`,
          filter: blurX + blurY > 0.6 ? 'url(#mblur)' : undefined,
          willChange: 'transform',
        }}
      >
        {/* tracks */}
        {trackOn ? (
          <svg width={14000} height={SH * 2 + 200} viewBox={`-300 ${-SH - 100} 14000 ${SH * 2 + 200}`} style={{position: 'absolute', left: -300, top: -SH - 100, overflow: 'visible'}}>
            <g fill="none" strokeLinecap="round">
              <path d={FEED} stroke={C.cyan} strokeWidth={3} {...dash(FEED, feed)} opacity={0.9} />
              <path d={MAIN_L} stroke={C.mist} strokeOpacity={0.35} strokeWidth={4} strokeDasharray={`${shoot * 1300} 99999`} />
              <path d={MAIN_R} stroke={C.mist} strokeOpacity={0.35} strokeWidth={4} strokeDasharray={`${rightLen} 99999`} />
              {cyanFade > 0 ? (
                <>
                  <path d={MAIN_L} stroke={C.cyan} strokeWidth={3} opacity={cyanFade} strokeDasharray={`${shoot * 1300} 99999`} style={{filter: 'drop-shadow(0 0 6px rgba(0,194,178,0.9))'}} />
                  <path d={MAIN_R} stroke={C.cyan} strokeWidth={3} opacity={cyanFade} strokeDasharray={`${Math.min(rightLen, 2600)} 99999`} style={{filter: 'drop-shadow(0 0 6px rgba(0,194,178,0.9))'}} />
                </>
              ) : null}
              {/* PCB accents (hero layer-circuit-traces style) along the line */}
              {[1, 2, 3, 4].map((k) => {
                const x = SW * k;
                const d1 = `M ${x + 1500} ${Y1} V ${Y1 + 60} H ${x + 1700}`;
                const d2 = `M ${x + 240} ${Y1} V ${Y1 + 70} H ${x + 420} V ${Y1 + 110}`;
                return (
                  <g key={k} stroke={C.cyan} strokeWidth={1.5} opacity={0.45}>
                    <path d={d1} />
                    <path d={d2} />
                    <circle cx={x + 1700} cy={Y1 + 60} r={4} fill={C.cyan} stroke="none" />
                    <circle cx={x + 420} cy={Y1 + 110} r={4} fill={C.cyan} stroke="none" />
                  </g>
                );
              })}
              {/* level-2 accents */}
              {[5, 6].map((k) => {
                const x = SW * k;
                const d1 = `M ${x + 300} ${Y2} V ${Y2 + 70} H ${x + 520}`;
                return (
                  <g key={k} stroke={C.cyan} strokeWidth={1.5} opacity={0.45}>
                    <path d={d1} />
                    <circle cx={x + 520} cy={Y2 + 70} r={4} fill={C.cyan} stroke="none" />
                  </g>
                );
              })}
            </g>
            {t > 26.0 ? <Pulses d={MAIN_R} t={t - 26} speed={340} gap={520} count={26} r={6} opacity={ramp(t, 26.0, 0.5)} white={[3, 11, 19]} /> : null}
            {t > 26.0 ? <Pulses d={MAIN_L} t={t - 26} speed={340} gap={430} count={3} r={6} opacity={ramp(t, 26.0, 0.5)} /> : null}
          </svg>
        ) : null}

        {/* station nodes on the line */}
        {nodes.map((n) => (
          <Node key={n.k} x={SW * n.k + 960} y={Y1} icon={n.icon} label={n.label} on={vis(t, n.on[0], n.on[1], 0.3, 0.4)} />
        ))}
        <Node x={SW * 5 + 585} y={Y2} icon="agent-content-engine" label="Content" on={vis(t, 49.0, 58.3, 0.3, 0.4)} />

        {/* tokens moving between stations */}
        {t > 29.2 && t < 30.3 ? <Token x={travel(29.2, SW * 1 - 200, SW * 1 + 420, 0.8)} y={Y1} icon="mail" /> : null}
        {t > 35.9 && t < 36.9 ? <Token x={travel(35.6, SW * 1 + 1500, SW * 2 + 600, 0.9)} y={Y1} icon="agent-rfq-quote" glow={0.8} /> : null}
        {t > 39.9 && t < 41.0 ? <Token x={travel(39.95, SW * 2 + 1300, SW * 3 + 500, 0.8)} y={Y1} icon="chat" glow={0.8} /> : null}
        {t > 44.0 && t < 45.0 ? <Token x={travel(44.05, SW * 3 + 1400, SW * 4 + 500, 0.8)} y={Y1} icon="mail" glow={0.8} /> : null}

        <Tile k={0} cam={cam}>
          {t < 27.6 ? <LogoReveal t={t} /> : null}
        </Tile>
        <Tile k={1} cam={cam}>
          <StationRFQ t={t} />
        </Tile>
        <Tile k={2} cam={cam}>
          <StationSpec t={t} />
        </Tile>
        <Tile k={3} cam={cam}>
          <StationOrders t={t} />
        </Tile>
        <Tile k={4} cam={cam}>
          <StationLeads t={t} />
        </Tile>
        <Tile k={5} level={2} cam={cam}>
          <StationContent t={t} />
        </Tile>
        <Tile k={6} level={2} cam={cam}>
          <StationGate t={t} />
        </Tile>
      </div>
    </div>
  );
};

/** The big ✓ that wipes the frame cyan at the end of scene 10. */
export const CheckWipe: React.FC<{t: number}> = ({t}) => {
  const t0 = 64.45;
  if (t < t0 || t > 65.6) return null;
  const p = ramp(t, t0, 0.5, EXPO_IN);
  const out = ramp(t, 65.0, 0.5, EXPO_OUT);
  // origin = the approve button on screen (world tile 6, level 2, camera parked there)
  const ox = GATE.btnX;
  const oy = GATE.btnY;
  const r = lerp(70, 2400, p);
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translateY(${-out * 100}%)`}}>
      <div style={{position: 'absolute', left: ox - r, top: oy - r, width: r * 2, height: r * 2, borderRadius: r, background: C.cyan}} />
      <div style={{position: 'absolute', left: ox - 40 - p * 220, top: oy - 40 - p * 220, color: C.navy, opacity: 1 - ramp(t, 64.85, 0.2)}}>
        <Icon name="check" size={80 + p * 440} strokePx={6 + p * 30} />
      </div>
    </div>
  );
};
