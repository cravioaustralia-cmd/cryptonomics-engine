import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, Easing } from "remotion";
import { C, FPS, SANS, SERIF } from "./theme";
import type { Overlay } from "./types";
import maps from "./maps.json";
import { LowerThird } from "./Shots";

type P = Record<string, any>;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const easeOut = Easing.out(Easing.cubic);
const sp = (t: number, delay = 0, damping = 14) => spring({ frame: Math.max(0, (t - delay) * FPS), fps: FPS, config: { damping, mass: 0.8 } });
const fadeIO = (t: number, from: number, to: number, fi = 0.35, fo = 0.3) =>
  interpolate(t, [from, from + fi, to - fo, to], [0, 1, 1, 0], clamp);
const beatA = (t: number, at: number, d = 0.35) => interpolate(t, [at, at + d], [0, 1], { ...clamp, easing: easeOut });

// ---------- icons ----------
export const Crown: React.FC<{ size?: number; color?: string; glow?: boolean }> = ({ size = 120, color = C.gold, glow = true }) => (
  <svg width={size} height={size * 0.72} viewBox="0 0 100 72" style={{ filter: glow ? `drop-shadow(0 0 ${size / 8}px rgba(232,204,110,0.6))` : undefined }}>
    <path d="M6 60 L12 18 L32 40 L50 6 L68 40 L88 18 L94 60 Z" fill={color} stroke="#7a5f10" strokeWidth="2" strokeLinejoin="round" />
    <rect x="6" y="60" width="88" height="10" rx="2" fill={color} stroke="#7a5f10" strokeWidth="2" />
    <circle cx="12" cy="17" r="4.5" fill={C.goldLight} />
    <circle cx="50" cy="6" r="5" fill={C.goldLight} />
    <circle cx="88" cy="17" r="4.5" fill={C.goldLight} />
    <circle cx="50" cy="48" r="5" fill={C.red} />
  </svg>
);

const Icon: React.FC<{ name: string; size?: number; color?: string }> = ({ name, size = 90, color = C.navy }) => {
  const s = { width: size, height: size };
  const sw = { stroke: color, strokeWidth: 5, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;
  switch (name) {
    case "paper":
      return (
        <svg viewBox="0 0 100 100" style={s}>
          <rect x="14" y="16" width="72" height="68" rx="4" {...sw} />
          <line x1="24" y1="30" x2="76" y2="30" {...sw} strokeWidth={8} />
          <line x1="24" y1="46" x2="48" y2="46" {...sw} />
          <line x1="24" y1="58" x2="48" y2="58" {...sw} />
          <line x1="24" y1="70" x2="48" y2="70" {...sw} />
          <rect x="56" y="44" width="20" height="28" {...sw} />
        </svg>
      );
    case "tv":
      return (
        <svg viewBox="0 0 100 100" style={s}>
          <rect x="12" y="26" width="76" height="54" rx="8" {...sw} />
          <line x1="36" y1="10" x2="50" y2="26" {...sw} />
          <line x1="64" y1="10" x2="50" y2="26" {...sw} />
          <line x1="34" y1="88" x2="66" y2="88" {...sw} />
        </svg>
      );
    case "pick":
      return (
        <svg viewBox="0 0 100 100" style={s}>
          <path d="M18 34 Q50 8 82 34" {...sw} strokeWidth={7} />
          <line x1="50" y1="22" x2="50" y2="88" {...sw} strokeWidth={7} />
        </svg>
      );
    case "door":
      return (
        <svg viewBox="0 0 100 100" style={s}>
          <rect x="26" y="12" width="48" height="78" {...sw} />
          <circle cx="64" cy="54" r="3.5" fill={color} />
          <line x1="12" y1="90" x2="88" y2="90" {...sw} />
        </svg>
      );
    case "ballot":
      return (
        <svg viewBox="0 0 100 100" style={s}>
          <rect x="16" y="44" width="68" height="44" rx="3" {...sw} />
          <line x1="38" y1="44" x2="62" y2="44" stroke={C.parchment} strokeWidth={7} />
          <path d="M36 50 L36 14 L64 14 L64 50" {...sw} />
          <path d="M42 30 L48 36 L58 22" {...sw} />
        </svg>
      );
    case "people":
      return (
        <svg viewBox="0 0 100 100" style={s}>
          <circle cx="30" cy="36" r="10" {...sw} />
          <circle cx="70" cy="36" r="10" {...sw} />
          <circle cx="50" cy="30" r="11" {...sw} />
          <path d="M14 82 Q30 54 46 82" {...sw} />
          <path d="M54 82 Q70 54 86 82" {...sw} />
          <path d="M32 78 Q50 46 68 78" {...sw} />
        </svg>
      );
    case "book":
      return (
        <svg viewBox="0 0 100 100" style={s}>
          <path d="M50 24 Q32 14 12 18 L12 80 Q32 76 50 86 Q68 76 88 80 L88 18 Q68 14 50 24 Z" {...sw} />
          <line x1="50" y1="24" x2="50" y2="86" {...sw} />
        </svg>
      );
    case "person":
      return (
        <svg viewBox="0 0 100 100" style={s}>
          <circle cx="50" cy="28" r="14" fill={color} />
          <path d="M22 92 Q24 52 50 50 Q76 52 78 92 Z" fill={color} />
        </svg>
      );
    case "chair":
      return (
        <svg viewBox="0 0 100 100" style={s}>
          <rect x="22" y="12" width="56" height="44" rx="10" fill={color} />
          <rect x="12" y="50" width="76" height="18" rx="6" fill={color} />
          <rect x="18" y="66" width="10" height="22" rx="3" fill={color} />
          <rect x="72" y="66" width="10" height="22" rx="3" fill={color} />
        </svg>
      );
    case "coin":
      return (
        <svg viewBox="0 0 100 100" style={s}>
          <circle cx="50" cy="50" r="40" fill={C.gold} stroke="#7a5f10" strokeWidth="4" />
          <text x="50" y="64" fontSize="42" textAnchor="middle" fontFamily="Inter" fontWeight="800" fill="#7a5f10">$</text>
        </svg>
      );
    default:
      return null;
  }
};

// ---------- generic panels ----------
const Panel: React.FC<{ children: React.ReactNode; w?: number; style?: React.CSSProperties; tone?: "parchment" | "navy" }> = ({ children, w, style, tone = "parchment" }) => (
  <div
    style={{
      width: w,
      background: tone === "parchment" ? `linear-gradient(160deg, #f8f1e1, ${C.parchment})` : "rgba(8,17,30,0.88)",
      border: `2px solid ${C.gold}`,
      boxShadow: "0 24px 70px rgba(0,0,0,0.55)",
      color: tone === "parchment" ? C.navy : C.white,
      ...style,
    }}
  >
    {children}
  </div>
);

const Source: React.FC<{ text?: string; a?: number }> = ({ text, a = 1 }) =>
  text ? (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 74, textAlign: "center", opacity: a }}>
      <span style={{ fontFamily: SANS, fontSize: 21, fontWeight: 600, color: C.white, background: "rgba(8,17,30,0.72)", padding: "6px 14px", letterSpacing: 0.5 }}>
        {text}
      </span>
    </div>
  ) : null;

// Big centred statement / stat
const Big: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  const lines: P[] = p.lines;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: p.y === "low" ? "flex-end" : "center", paddingBottom: p.y === "low" ? 190 : 0, opacity: a }}>
      <div style={{ textAlign: "center" }}>
        {lines.map((l, i) => {
          const la = beatA(t, (l.at as number) ?? o.from + i * 0.25);
          const sc = interpolate(la, [0, 1], [0.9, 1]);
          return (
            <div
              key={i}
              style={{
                fontFamily: l.font === "sans" ? SANS : SERIF,
                fontWeight: l.font === "sans" ? 800 : 800,
                fontSize: l.size ?? 120,
                color: l.color ?? C.white,
                letterSpacing: l.font === "sans" ? 3 : 0,
                lineHeight: 1.12,
                opacity: la,
                transform: `scale(${sc})`,
                textShadow: "0 6px 30px rgba(0,0,0,0.7)",
                marginTop: l.gap ?? 0,
              }}
            >
              {l.t}
            </div>
          );
        })}
      </div>
      <Source text={p.source} a={a} />
    </AbsoluteFill>
  );
};

// Bar chart (vertical bars), with optional chairs row, cap line, rocket bar
const Bars: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  const bars: P[] = p.bars;
  const max: number = p.max;
  const H0 = p.h ?? 520;
  const bw = p.bw ?? 170;
  const gap = p.gap ?? 70;
  const total = bars.length * bw + (bars.length - 1) * gap;
  const x0 = 960 - total / 2;
  const base = p.base ?? 800;
  const cap = p.cap as P | undefined;
  return (
    <AbsoluteFill style={{ opacity: a }}>
      {p.title ? (
        <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center", fontFamily: SERIF, fontWeight: 700, fontSize: 60, color: C.white, textShadow: "0 4px 24px rgba(0,0,0,0.7)" }}>
          {p.title}
        </div>
      ) : null}
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <line x1={x0 - 50} x2={x0 + total + 50} y1={base} y2={base} stroke={C.parchment} strokeWidth={3} opacity={0.8} />
        {bars.map((b, i) => {
          const at = (b.at as number) ?? o.from + 0.3 + i * 0.35;
          const g = b.rocket
            ? interpolate(t, [at, at + 0.25, at + 1.2], [0.02, 0.05, 1], { ...clamp, easing: Easing.in(Easing.cubic) })
            : beatA(t, at, 0.9);
          const v = (b.value as number) / max;
          const h = Math.max(4, H0 * v * g);
          const x = x0 + i * (bw + gap);
          const col = (b.color as string) ?? C.gold;
          return (
            <g key={i}>
              <rect x={x} y={base - h} width={bw} height={h} fill={col} opacity={b.dim ? 0.45 : 1} stroke={b.highlight ? C.goldLight : "none"} strokeWidth={4} />
              <text x={x + bw / 2} y={base - h - 18} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={b.vsize ?? 40} fill={C.white} opacity={g > 0.6 ? 1 : 0}>
                {b.valueLabel}
              </text>
              <text x={x + bw / 2} y={base + 46} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={b.lsize ?? 30} fill={C.parchment}>
                {b.label}
              </text>
              {b.sub ? (
                <text x={x + bw / 2} y={base + 82} textAnchor="middle" fontFamily="Inter" fontWeight={500} fontSize={24} fill={C.grey}>
                  {b.sub}
                </text>
              ) : null}
            </g>
          );
        })}
        {cap ? (() => {
          const ca = beatA(t, cap.at as number, 0.5);
          const y = base - H0 * ((cap.value as number) / max);
          return (
            <g opacity={ca}>
              <line x1={x0 - 60} x2={x0 + total + 60} y1={y} y2={y} stroke={C.red} strokeWidth={5} strokeDasharray="18 12" />
              <text x={x0 + total + 60} y={y - 14} textAnchor="end" fontFamily="Inter" fontWeight={800} fontSize={30} fill="#ff8a80">
                {cap.label}
              </text>
            </g>
          );
        })() : null}
      </svg>
      {bars.map((b, i) =>
        b.chairs !== undefined ? (
          <div key={`c${i}`} style={{ position: "absolute", left: x0 + i * (bw + gap), width: bw, top: base + 100, textAlign: "center", opacity: beatA(t, (b.chairsAt as number) ?? o.from + 1) }}>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 22, color: C.grey, letterSpacing: 2 }}>SEATS</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 4, minHeight: 50, alignItems: "center" }}>
              {b.chairs === 0 ? (
                <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 44, color: C.white }}>0</span>
              ) : (
                Array.from({ length: b.chairs as number }).map((_, k) => <Icon key={k} name="chair" size={50} color={C.goldLight} />)
              )}
            </div>
          </div>
        ) : null,
      )}
      <Source text={p.source} a={a} />
    </AbsoluteFill>
  );
};

// Stacked horizontal bar (mining campaign spend)
const Stack: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  const parts: P[] = p.parts;
  const total = parts.reduce((s, x) => s + (x.value as number), 0);
  const W0 = 1400;
  let acc = 0;
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <div style={{ position: "absolute", top: 210, width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 150, color: C.goldLight, textShadow: "0 6px 30px rgba(0,0,0,0.7)", opacity: beatA(t, p.headAt) }}>{p.head}</div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, letterSpacing: 6, color: C.white, opacity: beatA(t, p.subAt) }}>{p.sub}</div>
      </div>
      <div style={{ position: "absolute", left: 260, top: 580, width: W0, height: 110, display: "flex", background: "rgba(255,255,255,0.08)", border: `2px solid ${C.parchment}` }}>
        {parts.map((x, i) => {
          const w = (W0 * (x.value as number)) / total;
          acc += w;
          const g = beatA(t, x.at as number, 0.8);
          return (
            <div key={i} style={{ width: w * g, background: x.color as string, height: "100%", borderRight: g > 0.98 ? "2px solid rgba(0,0,0,0.3)" : undefined }} />
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 260, top: 712, width: W0, display: "flex" }}>
        {parts.map((x, i) => (
          <div key={i} style={{ width: (W0 * (x.value as number)) / total, opacity: beatA(t, (x.at as number) + 0.5), fontFamily: SANS, color: C.white }}>
            <div style={{ fontWeight: 800, fontSize: x.small ? 22 : 34, whiteSpace: "nowrap" }}>{x.valueLabel}</div>
            <div style={{ fontWeight: 500, fontSize: x.small ? 18 : 24, color: C.parchment, whiteSpace: "nowrap" }}>{x.label}</div>
          </div>
        ))}
      </div>
      <Source text={p.source} a={a} />
    </AbsoluteFill>
  );
};

// Generic row/grid of cards appearing on beats
const Cards: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  const items: P[] = p.items;
  const cols = (p.cols as number) ?? items.length;
  const cw = (p.cw as number) ?? Math.min(420, 1600 / cols - 30);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: a }}>
      {p.title ? (
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 58, color: C.white, marginBottom: 46, textShadow: "0 4px 24px rgba(0,0,0,0.7)", textAlign: "center" }}>{p.title}</div>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 30, justifyContent: "center", width: cols * (cw + 30) }}>
        {items.map((it, i) => {
          const at = (it.at as number) ?? o.from + 0.2 + i * 0.4;
          const s = sp(t, at);
          const hl = it.hlAt !== undefined ? beatA(t, it.hlAt as number) : 0;
          return (
            <div key={i} style={{ opacity: Math.min(1, s * 1.4), transform: `translateY(${(1 - s) * 40}px) scale(${0.92 + 0.08 * s})` }}>
              <Panel w={cw} style={{ padding: "30px 26px", textAlign: "center", minHeight: p.minH ?? 0, borderColor: hl > 0 ? C.red : C.gold, borderWidth: 2 + hl * 3 }}>
                {it.icon ? <div style={{ marginBottom: 12 }}><Icon name={it.icon as string} size={70} /></div> : null}
                {it.kicker ? <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: C.red }}>{it.kicker}</div> : null}
                <div style={{ fontFamily: it.sans ? SANS : SERIF, fontWeight: 800, fontSize: (it.size as number) ?? 46, lineHeight: 1.12, marginTop: it.kicker ? 8 : 0 }}>{it.title}</div>
                {it.sub ? <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 26, color: "#3b4656", marginTop: 10 }}>{it.sub}</div> : null}
              </Panel>
            </div>
          );
        })}
      </div>
      <Source text={p.source} a={a} />
    </AbsoluteFill>
  );
};

// ---------- case board ----------
const SUSPECTS = [
  { n: 1, name: "THE PRESS BARON", icon: "paper" },
  { n: 2, name: "THE TV TYCOON", icon: "tv" },
  { n: 3, name: "THE MINING MONEY", icon: "pick" },
  { n: 4, name: "THE FACELESS MEN", icon: "door" },
  { n: 5, name: "THE PREFERENCE WHISPERER", icon: "ballot" },
  { n: 6, name: "THE NEW KINGMAKERS", icon: "people" },
];
const slot = (i: number) => ({ x: 330 + (i % 3) * 630, y: i < 3 ? 330 : 760 });

const Board: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to, 0.45, 0.4);
  const filled: number[] = p.filled ?? [];
  const newCard: number | undefined = p.newCard;
  const strings: [number, number][] = p.strings ?? [];
  const newString: [number, number] | undefined = p.newString;
  const crownOn: number | undefined = p.crownOn;
  const extra = p.extra as P | undefined;
  const t0 = o.from;
  const teal = p.teal as boolean;
  const allStr: [number, number][] = [...strings, ...(newString ? [newString] : [])];
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <AbsoluteFill style={{ background: "rgba(14,26,43,0.35)" }} />
      <div style={{ position: "absolute", top: 48, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 700, letterSpacing: 10, fontSize: 30, color: C.goldLight }}>
        THE CASE BOARD
      </div>
      {SUSPECTS.map((s, i) => {
        const { x, y } = slot(i);
        const isFilled = filled.includes(s.n) || newCard === s.n;
        const pinA = newCard === s.n ? sp(t, (p.cardAt as number) ?? t0 + 0.5, 11) : isFilled ? 1 : 0;
        const appear = p.appear ? sp(t, t0 + 0.2 + i * 0.18) : 1;
        const tealCard = teal && s.n === 6;
        return (
          <div key={s.n} style={{ position: "absolute", left: x - 240, top: y - 150, width: 480, height: 300, opacity: appear, transform: `scale(${0.9 + 0.1 * appear})` }}>
            <div style={{ position: "absolute", inset: 0, border: `3px dashed rgba(232,204,110,0.55)`, background: "rgba(8,17,30,0.35)" }} />
            <div style={{ position: "absolute", left: 18, top: 14, fontFamily: SANS, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: C.goldLight }}>SUSPECT #{s.n}</div>
            {pinA > 0.01 ? (
              <div
                style={{
                  position: "absolute",
                  inset: 10,
                  background: `linear-gradient(160deg, #f8f1e1, ${C.parchment})`,
                  boxShadow: "0 18px 40px rgba(0,0,0,0.5)",
                  transform: `rotate(${(i % 2 ? 1.5 : -1.5) * pinA}deg) scale(${0.6 + 0.4 * pinA})`,
                  opacity: Math.min(1, pinA * 1.5),
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderTop: `8px solid ${tealCard ? C.teal : C.gold}`,
                }}
              >
                <div style={{ position: "absolute", top: -14, width: 26, height: 26, borderRadius: 13, background: C.red, boxShadow: "0 3px 6px rgba(0,0,0,0.5)" }} />
                <Icon name={s.icon} size={86} color={tealCard ? C.teal : C.navy} />
                <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 21, letterSpacing: 3, color: C.red, marginTop: 10 }}>SUSPECT #{s.n}</div>
                <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: s.name.length > 18 ? 30 : 36, color: C.navy, textAlign: "center", padding: "0 14px" }}>{s.name}</div>
              </div>
            ) : null}
          </div>
        );
      })}
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        {allStr.map(([i, j], k) => {
          const A = slot(i - 1);
          const B = slot(j - 1);
          const isNew = newString && k === allStr.length - 1;
          const g = isNew ? beatA(t, (p.stringAt as number) ?? t0 + 1.2, 0.9) : 1;
          const mx = (A.x + B.x) / 2;
          const my = (A.y + B.y) / 2 - 40 + Math.abs(A.x - B.x) * 0.12;
          return (
            <path
              key={k}
              d={`M ${A.x} ${A.y - 138} Q ${mx} ${my} ${B.x} ${B.y - 138}`}
              stroke={C.red}
              strokeWidth={5}
              fill="none"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - g}
            />
          );
        })}
      </svg>
      {crownOn !== undefined ? (() => {
        const { x, y } = slot(crownOn - 1);
        const mode = p.crownMode as string;
        const ca = beatA(t, (p.crownAt as number) ?? t0 + 0.6, 0.6);
        let dx = 0;
        let dy = -(1 - ca) * 120;
        let op = ca;
        let rot = 0;
        const tt = t - ((p.crownAt as number) ?? t0 + 0.6);
        if (mode === "wobble") {
          rot = Math.sin(tt * 7) * 10 * Math.min(1, tt);
          const leave = interpolate(t, [(p.leaveAt as number) ?? o.to - 1.6, ((p.leaveAt as number) ?? o.to - 1.6) + 1.2], [0, 1], clamp);
          dx = leave * 260;
          dy += -leave * 220;
          op = ca * (1 - leave);
        }
        if (mode === "slide") {
          const leave = interpolate(t, [(p.leaveAt as number) ?? o.to - 1.6, ((p.leaveAt as number) ?? o.to - 1.6) + 1.0], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
          dx = leave * 140;
          dy += leave * 260;
          rot = leave * 40;
          op = ca * (1 - leave);
        }
        return (
          <div style={{ position: "absolute", left: x - 70 + dx, top: y - 260 + dy, opacity: op, transform: `rotate(${rot}deg)` }}>
            <Crown size={140} />
          </div>
        );
      })() : null}
      {extra ? (() => {
        const ea = sp(t, (extra.at as number) ?? t0 + 0.5, 11);
        return (
          <div style={{ position: "absolute", left: 960 - 230, top: 545 - 115, width: 460, height: 230, transform: `scale(${0.4 + 0.6 * ea}) rotate(${-2 * ea}deg)`, opacity: Math.min(1, ea * 1.5) }}>
            <div style={{ position: "absolute", inset: 0, background: C.navy, border: `4px solid ${C.goldLight}`, boxShadow: "0 24px 60px rgba(0,0,0,0.7)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", top: -14, width: 26, height: 26, borderRadius: 13, background: C.red }} />
              <Icon name="book" size={80} color={C.goldLight} />
              <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 46, color: C.goldLight }}>{extra.title as string}</div>
            </div>
          </div>
        );
      })() : null}
    </AbsoluteFill>
  );
};

// ---------- chapter / title ----------
const Chapter: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to, 0.5, 0.45);
  const k = sp(t, o.from + 0.15);
  const k2 = sp(t, o.from + 0.45);
  const teal = p.teal as boolean;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: a }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(8,17,30,0.25), rgba(8,17,30,0.75))" }} />
      <div style={{ textAlign: "center", position: "relative" }}>
        {p.crown ? <div style={{ opacity: k, transform: `translateY(${(1 - k) * -30}px)`, marginBottom: 10 }}><Crown size={110} /></div> : null}
        <div style={{ fontFamily: SANS, fontWeight: 800, letterSpacing: 14, fontSize: 38, color: teal ? "#7fe3e3" : C.goldLight, opacity: k }}>{p.kicker}</div>
        <div style={{ height: 4, width: 520 * k2, background: teal ? C.teal : C.gold, margin: "26px auto" }} />
        <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: (p.size as number) ?? 104, color: C.white, opacity: k2, transform: `translateY(${(1 - k2) * 24}px)`, textShadow: "0 8px 40px rgba(0,0,0,0.8)", maxWidth: 1600, lineHeight: 1.1 }}>
          {p.title}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Title: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const a = fadeIO(t, o.from, o.to, 0.5, 0.5);
  const k = sp(t, o.from + 0.1, 16);
  const u = interpolate(t, [o.from + 0.6, o.from + 1.6], [0, 1], { ...clamp, easing: easeOut });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: a }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(8,17,30,0.2), rgba(8,17,30,0.8))" }} />
      <div style={{ textAlign: "center" }}>
        <div style={{ opacity: k, transform: `translateY(${(1 - k) * -60}px)` }}><Crown size={150} /></div>
        <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 132, color: C.white, letterSpacing: 2, marginTop: 20, opacity: k, textShadow: "0 8px 40px rgba(0,0,0,0.8)" }}>
          WHO REALLY RUNS
        </div>
        <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 150, color: C.goldLight, letterSpacing: 3, opacity: k, textShadow: "0 8px 40px rgba(0,0,0,0.8)" }}>
          AUSTRALIA?
        </div>
        <div style={{ height: 6, width: 980 * u, background: C.gold, margin: "18px auto 26px" }} />
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 38, letterSpacing: 12, color: C.parchment, opacity: u }}>THE HUNT FOR THE KINGMAKER</div>
      </div>
    </AbsoluteFill>
  );
};

const Tag: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to, 0.45, 0.4);
  const x = interpolate(a, [0, 1], [-60, 0]);
  const teal = p.teal as boolean;
  return (
    <div style={{ position: "absolute", left: 90, bottom: 110, opacity: a, transform: `translateX(${x}px)`, display: "flex", alignItems: "center", gap: 18, background: "rgba(8,17,30,0.88)", padding: "14px 28px 14px 18px", borderLeft: `6px solid ${teal ? C.teal : C.gold}` }}>
      <Crown size={58} glow={false} />
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: 4, color: C.white }}>
        <span style={{ color: teal ? "#7fe3e3" : C.goldLight }}>SUSPECT #{p.n}</span> · {p.name}
      </div>
    </div>
  );
};

// ---------- crown descend ----------
const CrownOv: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to, 0.5, 0.6);
  const g = interpolate(t, [o.from, o.to - 0.5], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const [x, y0, y1] = (p.path as number[]) ?? [960, 60, 240];
  const size = (p.size as number) ?? 260;
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y0 + (y1 - y0) * g, opacity: a * 0.92 }}>
      <Crown size={size} />
    </div>
  );
};

// ---------- world route ----------
const Route: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  const cities = maps.world.cities as Record<string, number[]>;
  const order: string[] = ["Adelaide", "Sydney", "London", "New York"];
  const beats: number[] = p.beats;
  const pts = order.map((c) => cities[c]);
  // arcs between consecutive points
  const arcs = pts.slice(1).map((b, i) => {
    const A = pts[i];
    const mx = (A[0] + b[0]) / 2;
    const my = Math.min(A[1], b[1]) - 160;
    return `M ${A[0]} ${A[1]} Q ${mx} ${my} ${b[0]} ${b[1]}`;
  });
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <path d={maps.world.land} fill="rgba(239,230,210,0.16)" stroke="rgba(232,204,110,0.45)" strokeWidth={1.2} />
        {arcs.map((d, i) => (
          <path key={i} d={d} stroke={C.goldLight} strokeWidth={5} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - beatA(t, beats[i + 1] - 0.6, 0.9)} />
        ))}
        {order.map((c, i) => {
          const [x, y] = cities[c];
          const ca = beatA(t, beats[i]);
          const dx = c === "Sydney" ? 18 : c === "Adelaide" ? -18 : 0;
          const anchor = c === "Adelaide" ? "end" : c === "Sydney" ? "start" : "middle";
          const ty = c === "London" || c === "New York" ? y - 26 : y + 52;
          return (
            <g key={c} opacity={ca}>
              <circle cx={x} cy={y} r={11} fill={C.gold} stroke={C.white} strokeWidth={3} />
              <circle cx={x} cy={y} r={11 + 22 * ((t * 1.2) % 1)} fill="none" stroke={C.goldLight} strokeWidth={2} opacity={1 - ((t * 1.2) % 1)} />
              <text x={x + dx} y={ty} textAnchor={anchor} fontFamily="Inter" fontWeight={800} fontSize={34} fill={C.white} stroke="rgba(8,17,30,0.8)" strokeWidth={6} paintOrder="stroke">
                {c.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ---------- Australia map ----------
const LBL: Record<string, [number, number, string]> = {
  Adelaide: [-34, 4, "end"],
  Sydney: [36, 0, "start"],
  Melbourne: [-34, 22, "end"],
  Hobart: [0, 54, "middle"],
  Brisbane: [36, 0, "start"],
  Perth: [-34, 4, "end"],
  Darwin: [0, -46, "middle"],
};
const AusMap: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  const cities = maps.aus.cities as Record<string, number[]>;
  const list: string[] = p.cities ?? ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Hobart", "Darwin"];
  const beats: number[] = p.beats ?? list.map((_, i) => o.from + 0.4 + i * 0.25);
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <path d={maps.aus.outline} fill="rgba(239,230,210,0.14)" stroke={C.goldLight} strokeWidth={3} />
        {list.map((c, i) => {
          const [x, y] = cities[c];
          const ca = sp(t, beats[i], 12);
          return (
            <g key={c} opacity={Math.min(1, ca * 1.4)} transform={`translate(${x} ${y}) scale(${0.5 + 0.5 * ca})`}>
              <rect x={-26} y={-34} width={52} height={44} rx={4} fill={C.parchment} stroke={C.gold} strokeWidth={3} />
              <line x1={-18} x2={18} y1={-24} y2={-24} stroke={C.navy} strokeWidth={5} />
              <line x1={-18} x2={4} y1={-12} y2={-12} stroke={C.navy} strokeWidth={3} />
              <line x1={-18} x2={4} y1={-2} y2={-2} stroke={C.navy} strokeWidth={3} />
              <circle cx={0} cy={18} r={6} fill={C.gold} />
              <text x={LBL[c]?.[0] ?? 0} y={LBL[c]?.[1] ?? 52} textAnchor={(LBL[c]?.[2] as "start" | "end" | "middle") ?? "middle"} fontFamily="Inter" fontWeight={800} fontSize={26} fill={C.white} stroke="rgba(8,17,30,0.85)" strokeWidth={6} paintOrder="stroke">
                {c.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
      <Source text={p.source} a={a} />
    </AbsoluteFill>
  );
};

// ---------- passport flip ----------
const Passport: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  const flip = interpolate(t, [p.flipAt as number, (p.flipAt as number) + 0.8], [0, 180], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const face = (label: string, color: string, back: boolean) => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: color,
        borderRadius: 18,
        border: `3px solid ${C.gold}`,
        backfaceVisibility: "hidden",
        transform: back ? "rotateY(180deg)" : undefined,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "60px 30px",
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
      }}
    >
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: 6, color: C.goldLight, textAlign: "center" }}>{label}</div>
      <div style={{ width: 150, height: 150, borderRadius: 75, border: `4px solid ${C.goldLight}`, opacity: 0.7 }} />
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 10, color: C.goldLight }}>PASSPORT</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: a, alignItems: "center", justifyContent: "center", perspective: 1600 }}>
      <div style={{ width: 460, height: 640, position: "relative", transformStyle: "preserve-3d", transform: `rotateY(${flip}deg)` }}>
        {face("AUSTRALIA", "#0d3b2e", false)}
        {face("UNITED STATES", "#13254a", true)}
      </div>
    </AbsoluteFill>
  );
};

// ---------- letter with 75 marks ----------
const Letter: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  const s = sp(t, o.from + 0.1);
  const t0 = p.marksFrom as number;
  const t1 = p.marksTo as number;
  const n = Math.round(interpolate(t, [t0, t1], [0, 75], clamp));
  return (
    <AbsoluteFill style={{ opacity: a, alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `translateY(${(1 - s) * 60}px) rotate(-1.2deg)`, width: 900, height: 860, background: `linear-gradient(170deg, #f9f2e2, ${C.parchmentDark})`, boxShadow: "0 30px 90px rgba(0,0,0,0.6)", padding: "56px 70px", position: "relative" }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: 4, fontSize: 22, color: C.red }}>RECREATION · NOT THE ORIGINAL TEXT</div>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ height: 14, background: "rgba(27,27,27,0.16)", marginTop: 22, width: `${[96, 92, 98, 88, 95, 90, 97, 70, 50][i]}%`, borderRadius: 7 }} />
        ))}
        <div style={{ position: "absolute", left: 70, right: 70, top: 470, display: "grid", gridTemplateColumns: "repeat(15, 1fr)", rowGap: 22 }}>
          {Array.from({ length: 75 }).map((_, i) => (
            <svg key={i} width={44} height={26} viewBox="0 0 44 26" style={{ opacity: i < n ? 1 : 0 }}>
              <path d={`M2 ${16 + (i % 3)} C 8 ${4 + (i % 5)}, 14 24, 20 ${12 + (i % 4)} S 32 ${6 + (i % 3)}, 42 ${14 + (i % 5)}`} stroke="#1c2c5a" strokeWidth={2.4} fill="none" />
            </svg>
          ))}
        </div>
        <div style={{ position: "absolute", right: 70, bottom: 40, fontFamily: SERIF, fontWeight: 800, fontSize: 64, color: C.navy }}>{n}</div>
      </div>
      <div style={{ position: "absolute", bottom: 74 }}>
        <span style={{ fontFamily: SANS, fontSize: 24, fontWeight: 700, color: C.white, background: "rgba(8,17,30,0.8)", padding: "8px 18px" }}>{p.caption as string}</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------- counter ----------
const Counter: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  const v = Math.round(interpolate(t, [o.from + 0.3, p.landAt as number], [0, p.target as number], { ...clamp, easing: Easing.out(Easing.quad) }));
  return (
    <AbsoluteFill style={{ opacity: a, alignItems: "center", justifyContent: "center" }}>
      <Panel tone="navy" style={{ padding: "50px 90px", textAlign: "center" }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: 8, fontSize: 30, color: C.goldLight }}>{p.kicker as string}</div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 170, color: C.white, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{v.toLocaleString("en-AU")}</div>
        <div style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: 8, fontSize: 30, color: C.parchment }}>{p.unit as string}</div>
      </Panel>
      <Source text={p.source as string} a={a} />
    </AbsoluteFill>
  );
};

// ---------- family tree ----------
const Tree: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  const g1 = beatA(t, o.from + 0.3, 0.6);
  const g2 = beatA(t, p.branchAt as number, 0.8);
  const gl = beatA(t, p.goldAt as number, 0.6);
  const st = sp(t, p.stampAt as number, 10);
  const node = (x: number, y: number, title: string, sub: string, gold: number, op: number) => (
    <div style={{ position: "absolute", left: x - 230, top: y - 70, width: 460, height: 140, opacity: op, background: gold > 0 ? `rgba(201,162,39,${0.25 + 0.6 * gold})` : "rgba(8,17,30,0.85)", border: `3px solid ${C.gold}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: gold > 0 ? `0 0 ${50 * gold}px rgba(232,204,110,0.7)` : undefined }}>
      <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 46, color: C.white }}>{title}</div>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 24, color: C.parchment, letterSpacing: 2 }}>{sub}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <path d="M 960 400 L 960 520 L 960 640" stroke={C.gold} strokeWidth={6} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - g2} />
      </svg>
      {node(960, 330, "Rupert Murdoch", "CHAIRMAN UNTIL 2023", 0, g1)}
      {node(960, 710, "Lachlan Murdoch", "IN CONTROL", gl, g2)}
      <div style={{ position: "absolute", left: 1260, top: 640, transform: `rotate(-12deg) scale(${2 - st})`, opacity: Math.min(1, st * 1.3), border: `6px solid ${C.red}`, padding: "6px 26px", fontFamily: SANS, fontWeight: 800, fontSize: 70, color: "#ff6b5e", letterSpacing: 6 }}>
        2050
      </div>
      <Source text={p.source as string} a={a} />
    </AbsoluteFill>
  );
};

// ---------- stamp ----------
const Stamp: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to, 0.05, 0.3);
  const s = sp(t, o.from, 9);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: a }}>
      <div style={{ transform: `rotate(-8deg) scale(${2.4 - 1.4 * s})`, opacity: Math.min(1, s * 1.6), border: `10px solid ${C.gold}`, padding: "18px 60px", fontFamily: SERIF, fontWeight: 800, fontSize: 170, color: C.goldLight, letterSpacing: 8, background: "rgba(8,17,30,0.35)", textShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>
        {p.text as string}
      </div>
    </AbsoluteFill>
  );
};

// ---------- explainer chain voter -> MP -> party room -> leader ----------
const Chain: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  const beats: number[] = p.beats;
  const steps = [
    { title: "YOU", sub: "vote for your local MP", icon: "ballot" },
    { title: "LOCAL MP", sub: "most seats forms government", icon: "chair" },
    { title: "PARTY ROOM", sub: "picks the leader", icon: "people" },
    { title: "LEADER", sub: "Prime Minister", icon: "person" },
  ];
  const swap = interpolate(t, [p.swapAt as number, (p.swapAt as number) + 1.0], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ opacity: a }}>
      {steps.map((s, i) => {
        const x = 270 + i * 460;
        const sa = sp(t, beats[i]);
        return (
          <React.Fragment key={i}>
            {i > 0 ? (
              <svg width={1920} height={1080} style={{ position: "absolute" }}>
                <path d={`M ${x - 290} 520 L ${x - 175} 520`} stroke={C.goldLight} strokeWidth={6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - beatA(t, beats[i] - 0.2, 0.5)} />
                <path d={`M ${x - 190} 505 L ${x - 172} 520 L ${x - 190} 535`} stroke={C.goldLight} strokeWidth={6} fill="none" opacity={beatA(t, beats[i] + 0.2)} />
              </svg>
            ) : null}
            <div style={{ position: "absolute", left: x - 165, top: 360, width: 330, opacity: Math.min(1, sa * 1.4), transform: `translateY(${(1 - sa) * 40}px)` }}>
              <Panel style={{ padding: "26px 16px", textAlign: "center", height: 300, position: "relative", overflow: "hidden" }}>
                {i === 3 ? (
                  <div style={{ position: "relative", height: 100 }}>
                    <div style={{ position: "absolute", left: 115, transform: `translateX(${-swap * 260}px)`, opacity: 1 - swap }}><Icon name="person" size={100} color={C.navy} /></div>
                    <div style={{ position: "absolute", left: 115, transform: `translateX(${(1 - swap) * 260}px)`, opacity: swap }}><Icon name="person" size={100} color={C.red} /></div>
                  </div>
                ) : (
                  <Icon name={s.icon} size={100} />
                )}
                <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 38, letterSpacing: 2, marginTop: 14 }}>{s.title}</div>
                <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 24, color: "#3b4656", marginTop: 8 }}>{s.sub}</div>
              </Panel>
            </div>
          </React.Fragment>
        );
      })}
      {swap > 0 ? (
        <div style={{ position: "absolute", top: 720, left: 0, right: 0, textAlign: "center", opacity: swap, fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: 4, color: C.goldLight }}>
          REPLACEABLE BY A PARTY-ROOM VOTE · AT ANY TIME
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- faceless silhouettes ----------
const Faceless: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const a = fadeIO(t, o.from, o.to, 0.8, 0.5);
  const pos = [
    [220, 300, 1.0],
    [520, 240, 0.8],
    [1400, 250, 0.85],
    [1700, 320, 1.0],
    [360, 620, 1.15],
    [1560, 640, 1.1],
  ];
  return (
    <AbsoluteFill style={{ opacity: a }}>
      {pos.map(([x, y, s], i) => {
        const f = beatA(t, o.from + 0.2 + i * 0.25, 1.2);
        return (
          <div key={i} style={{ position: "absolute", left: x - 110 * s, top: y - 120 * s + Math.sin(t * 0.8 + i) * 6, opacity: f * 0.55, filter: "blur(2px)" }}>
            <svg width={220 * s} height={300 * s} viewBox="0 0 220 300">
              <ellipse cx="110" cy="80" rx="55" ry="64" fill="#02060c" />
              <path d="M10 300 Q20 150 110 150 Q200 150 210 300 Z" fill="#02060c" />
            </svg>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- seat tiles ----------
const Seats: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  const mode = p.mode as string;
  const named: P[] = p.named ?? [];
  const cols = 12;
  const rows = 5;
  const tw = 104;
  const th = 92;
  const x0 = 960 - (cols * (tw + 14)) / 2;
  const y0 = 300;
  const tiles = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const nm = named.find((n) => n.i === idx);
      let fill = "rgba(239,230,210,0.13)";
      let stroke = "rgba(232,204,110,0.35)";
      let extra: React.ReactNode = null;
      const safe = [3, 8, 14, 19, 27, 33, 38, 44, 50, 57];
      if (mode === "presel" && safe.includes(idx)) {
        const k = safe.indexOf(idx);
        const at = (p.dropAt as number) + k * 0.18;
        const d = interpolate(t, [at, at + 0.45], [-120, 0], { ...clamp, easing: Easing.in(Easing.quad) });
        const op = beatA(t, at, 0.2);
        stroke = C.goldLight;
        fill = "rgba(201,162,39,0.25)";
        extra = (
          <div style={{ position: "absolute", left: 6, right: 6, top: 28 + d, height: 34, opacity: op, background: C.parchment, border: `2px solid ${C.red}`, fontFamily: SANS, fontWeight: 800, fontSize: 12, color: C.red, display: "flex", alignItems: "center", justifyContent: "center", letterSpacing: 0.5 }}>
            PRESELECTION
          </div>
        );
      }
      if (nm) {
        const k = beatA(t, nm.at as number, 0.6);
        const col = (nm.color as string) ?? C.teal;
        fill = k > 0 ? col : fill;
        stroke = C.white;
        extra = (
          <div style={{ position: "absolute", left: -60, right: -60, top: th + 6, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 24, color: C.white, opacity: 0.4 + 0.6 * k, textShadow: "0 2px 8px #000" }}>
            {nm.name as string}
          </div>
        );
        tiles.push(
          <div key={idx} style={{ position: "absolute", left: x0 + c * (tw + 14), top: y0 + r * (th + 34), width: tw, height: th, background: fill, opacity: 1, border: `3px solid ${stroke}`, transform: `rotateY(${(1 - Math.abs(1 - 2 * k)) * 0}deg) scale(${1 + 0.12 * k})`, zIndex: 2 }}>
            <div style={{ position: "absolute", inset: 0, background: nm.from as string, opacity: 1 - k }} />
            {extra}
          </div>,
        );
        continue;
      }
      tiles.push(
        <div key={idx} style={{ position: "absolute", left: x0 + c * (tw + 14), top: y0 + r * (th + 34), width: tw, height: th, background: fill, border: `2px solid ${stroke}` }}>
          {extra}
        </div>,
      );
    }
  return (
    <AbsoluteFill style={{ opacity: a }}>
      {p.title ? <div style={{ position: "absolute", top: 160, width: "100%", textAlign: "center", fontFamily: SERIF, fontWeight: 700, fontSize: 58, color: C.white, textShadow: "0 4px 24px rgba(0,0,0,0.7)" }}>{p.title as string}</div> : null}
      {tiles}
      {p.note ? <div style={{ position: "absolute", bottom: 74, width: "100%", textAlign: "center" }}><span style={{ fontFamily: SANS, fontSize: 21, fontWeight: 600, color: C.white, background: "rgba(8,17,30,0.72)", padding: "6px 14px" }}>{p.note as string}</span></div> : null}
    </AbsoluteFill>
  );
};

// ---------- preference flow ----------
const Flow: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  const boxes = ["1st choice", "2nd choice", "3rd choice", "4th choice"];
  const xs = [330, 750, 1170, 1590];
  const t0 = p.startAt as number;
  const hop = 1.1;
  const k = Math.max(0, (t - t0) / hop);
  const idx = Math.min(3, Math.floor(k));
  const fr = Math.min(1, k - Math.floor(k));
  const x = idx >= 3 ? xs[3] : xs[idx] + (xs[idx + 1] - xs[idx]) * Easing.inOut(Easing.cubic)(fr);
  const ticket = beatA(t, p.ticketAt as number);
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        {xs.slice(0, 3).map((x0, i) => (
          <g key={i}>
            <line x1={x0 + 130} x2={xs[i + 1] - 130} y1={520} y2={520} stroke={C.goldLight} strokeWidth={5} />
            <path d={`M ${xs[i + 1] - 150} 505 L ${xs[i + 1] - 130} 520 L ${xs[i + 1] - 150} 535`} stroke={C.goldLight} strokeWidth={5} fill="none" />
          </g>
        ))}
      </svg>
      {boxes.map((b, i) => {
        const out = i < idx && t > t0 ? 1 : 0;
        return (
          <div key={i} style={{ position: "absolute", left: xs[i] - 130, top: 430, width: 260, height: 180 }}>
            <Panel style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", opacity: out ? 0.45 : 1 }}>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 30 }}>{b.toUpperCase()}</div>
              {out ? <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 22, color: C.red, marginTop: 8 }}>CAN'T WIN</div> : null}
            </Panel>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: x - 34, top: 340, width: 68, height: 68, borderRadius: 34, background: C.gold, border: `4px solid ${C.white}`, boxShadow: "0 0 30px rgba(232,204,110,0.8)", opacity: beatA(t, t0 - 0.3), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize: 30, color: C.navy }}>
        1
      </div>
      <div style={{ position: "absolute", top: 700, width: "100%", textAlign: "center", opacity: ticket }}>
        <Panel tone="navy" style={{ display: "inline-block", padding: "20px 40px" }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 3, color: C.goldLight }}>SENATE BEFORE 2016: TICK ONE BOX ABOVE THE LINE</div>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 26, color: C.parchment, marginTop: 8 }}>preferences flow by deals the parties made</div>
        </Panel>
      </div>
    </AbsoluteFill>
  );
};

// ---------- micro-party web with snowball ----------
const Web: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  const n = 12;
  const nodes = Array.from({ length: n }).map((_, i) => {
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [960 + Math.cos(ang) * 400, 540 + Math.sin(ang) * 330];
  });
  const shapes = ["circle", "square", "tri", "diamond"];
  const sStart = p.snowAt as number;
  const sDur = Math.max(1, ((p.snowTo as number) ?? sStart + 4) - sStart);
  const sp1 = Math.max(0, Math.min(1, (t - sStart) / sDur));
  const seg = sp1 * (n - 1);
  const i0 = Math.min(n - 2, Math.floor(seg));
  const fr = seg - i0;
  const sx = nodes[i0][0] + (nodes[i0 + 1][0] - nodes[i0][0]) * fr;
  const sy = nodes[i0][1] + (nodes[i0 + 1][1] - nodes[i0][1]) * fr;
  const r = 14 + 60 * sp1;
  const crossed = beatA(t, sStart + sDur, 0.4);
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        {nodes.map((A, i) =>
          nodes.map((B, j) =>
            j > i && (j - i) % 3 !== 0 ? (
              <line key={`${i}-${j}`} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke="rgba(232,204,110,0.35)" strokeWidth={2} opacity={beatA(t, o.from + 0.3 + i * 0.08)} />
            ) : null,
          ),
        )}
        {nodes.map(([x, y], i) => {
          const na = sp(t, o.from + 0.2 + i * 0.07);
          const sh = shapes[i % 4];
          const col = ["#c75b4a", "#4a8fc7", "#7bbf6a", "#c7a24a", "#9a6ac7", "#c76aa0"][i % 6];
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(${na})`}>
              {sh === "circle" ? <circle r={34} fill={col} stroke={C.white} strokeWidth={3} /> : null}
              {sh === "square" ? <rect x={-30} y={-30} width={60} height={60} fill={col} stroke={C.white} strokeWidth={3} /> : null}
              {sh === "tri" ? <path d="M0 -36 L34 28 L-34 28 Z" fill={col} stroke={C.white} strokeWidth={3} /> : null}
              {sh === "diamond" ? <path d="M0 -38 L34 0 L0 38 L-34 0 Z" fill={col} stroke={C.white} strokeWidth={3} /> : null}
            </g>
          );
        })}
        {t > sStart ? <circle cx={sx} cy={sy} r={r} fill={C.white} opacity={0.92} stroke={C.goldLight} strokeWidth={4} /> : null}
        <g opacity={crossed}>
          <line x1={760} x2={1160} y1={540} y2={540} stroke={C.goldLight} strokeWidth={4} strokeDasharray="12 10" />
          <text x={960} y={520} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={30} fill={C.goldLight}>QUOTA</text>
        </g>
      </svg>
      <div style={{ position: "absolute", bottom: 74, width: "100%", textAlign: "center" }}>
        <span style={{ fontFamily: SANS, fontSize: 21, fontWeight: 600, color: C.white, background: "rgba(8,17,30,0.72)", padding: "6px 14px" }}>Illustrative: invented parties, not real logos</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------- coins into pot ----------
const Coins: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  const inAt = p.inAt as number;
  const outAt = p.outAt as number;
  const N = 18;
  const coins = Array.from({ length: N }).map((_, i) => {
    const sx = 160 + ((i * 97) % 1600);
    const sy = 120 + ((i * 53) % 160);
    const at = inAt + i * 0.09;
    const g = interpolate(t, [at, at + 0.9], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
    return { x: sx + (960 - sx) * g, y: sy + (560 - sy) * g, op: g < 1 ? beatA(t, at - 0.2) : 0 };
  });
  const cands = [430, 740, 1180, 1490];
  return (
    <AbsoluteFill style={{ opacity: a }}>
      {coins.map((c, i) => (
        <div key={i} style={{ position: "absolute", left: c.x - 26, top: c.y - 26, opacity: c.op }}>
          <Icon name="coin" size={52} />
        </div>
      ))}
      <div style={{ position: "absolute", left: 960 - 150, top: 520, width: 300, height: 170, background: C.navy, border: `4px solid ${C.gold}`, borderRadius: "0 0 90px 90px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize: 34, color: C.goldLight, letterSpacing: 2, opacity: beatA(t, o.from + 0.2) }}>
        CLIMATE 200
      </div>
      <div style={{ position: "absolute", top: 160, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: 4, color: C.white, opacity: beatA(t, inAt) }}>
        THOUSANDS OF DONORS
      </div>
      {cands.map((x, i) => {
        const at = outAt + i * 0.2;
        const g = interpolate(t, [at, at + 0.8], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
        const cx = 960 + (x - 960) * g;
        const cy = 640 + 220 * g;
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: cx - 22, top: cy - 22, opacity: g > 0 && g < 1 ? 1 : 0 }}><Icon name="coin" size={44} /></div>
            <div style={{ position: "absolute", left: x - 70, top: 830, width: 140, textAlign: "center", opacity: beatA(t, at + 0.6) }}>
              <Icon name="person" size={90} color={C.teal} />
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 20, color: C.white, letterSpacing: 1 }}>INDEPENDENT</div>
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- gauges ----------
const Gauges: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  const g = (cx: number, label: string, val: string, frac: number, at: number) => {
    const k = beatA(t, at, 1.0);
    const ang = -180 + 180 * frac * k;
    const r = 220;
    const rad = (ang * Math.PI) / 180;
    return (
      <g opacity={beatA(t, at - 0.3)}>
        <path d={`M ${cx - r} 640 A ${r} ${r} 0 0 1 ${cx + r} 640`} stroke="rgba(239,230,210,0.25)" strokeWidth={34} fill="none" />
        <path d={`M ${cx - r} 640 A ${r} ${r} 0 0 1 ${cx + r} 640`} stroke={C.gold} strokeWidth={34} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - frac * k} />
        <line x1={cx} y1={640} x2={cx + Math.cos(rad) * (r - 40)} y2={640 + Math.sin(rad) * (r - 40)} stroke={C.white} strokeWidth={8} strokeLinecap="round" />
        <circle cx={cx} cy={640} r={16} fill={C.white} />
        <text x={cx} y={740} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={80} fill={C.white}>{val}</text>
        <text x={cx} y={800} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={30} fill={C.goldLight} letterSpacing={3}>{label}</text>
      </g>
    );
  };
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: 6, color: C.white, opacity: beatA(t, o.from + 0.2) }}>
        NATIONAL ELECTION SPENDING CAPS
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        {g(620, "POLITICAL PARTIES", "$90M", 0.9, p.partyAt as number)}
        {g(1300, "OUTSIDE GROUPS", "$11M", 0.11, p.thirdAt as number)}
      </svg>
      <Source text={p.source as string} a={a} />
    </AbsoluteFill>
  );
};

// ---------- turnout dots ----------
const Turnout: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  return (
    <AbsoluteFill style={{ opacity: a, alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, letterSpacing: 6, fontSize: 36, color: C.goldLight, marginBottom: 30 }}>ENROLLED AUSTRALIANS WHO VOTE</div>
      <div style={{ display: "flex", gap: 26 }}>
        {Array.from({ length: 10 }).map((_, i) => {
          const at = (p.dotsAt as number) + i * 0.12;
          const s = sp(t, at);
          return (
            <div key={i} style={{ transform: `scale(${s})`, opacity: i < 9 ? 1 : 0.35 }}>
              <Icon name="person" size={120} color={i < 9 ? C.gold : C.grey} />
            </div>
          );
        })}
      </div>
      <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 110, color: C.white, marginTop: 20, opacity: beatA(t, p.nineAt as number), textShadow: "0 6px 30px rgba(0,0,0,0.7)" }}>
        AROUND 9 IN 10
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 38, color: C.parchment, letterSpacing: 2, marginTop: 6, opacity: beatA(t, p.ukAt as number) }}>
        Far more than in the United States or the United Kingdom
      </div>
      <Source text={p.source as string} a={a} />
    </AbsoluteFill>
  );
};

// ---------- voter with cards flying in ----------
const Voter: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  const items = ["PRESS", "TV", "MONEY", "FACTIONS", "PREFERENCES", "TEALS"];
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <div style={{ position: "absolute", left: 960 - 90, top: 400, opacity: beatA(t, o.from + 0.2) }}>
        <Icon name="person" size={180} color={C.goldLight} />
      </div>
      {items.map((it, i) => {
        const ang = (i / items.length) * Math.PI * 2 - Math.PI / 2;
        const R = 380;
        const at = (p.flyAt as number) + i * 0.15;
        const g = interpolate(t, [at, at + 0.8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        const x = 960 + Math.cos(ang) * R * (2.4 - 1.4 * g);
        const y = 490 + Math.sin(ang) * R * 0.75 * (2.4 - 1.4 * g);
        return (
          <div key={it} style={{ position: "absolute", left: x - 130, top: y - 45, width: 260, opacity: g }}>
            <Panel style={{ padding: "18px 10px", textAlign: "center" }}>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 3 }}>{it}</div>
            </Panel>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- four PMs ----------
const FourPMs: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  const pms: P[] = p.pms;
  return (
    <AbsoluteFill style={{ opacity: a, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: 44 }}>
        {pms.map((pm, i) => {
          const s = sp(t, o.from + 0.1 + i * 0.12);
          const v = beatA(t, pm.at as number, 0.5);
          return (
            <div key={i} style={{ width: 330, opacity: s, transform: `translateY(${(1 - s) * 40}px)` }}>
              <div style={{ position: "relative", width: 330, height: 420, overflow: "hidden", border: `3px solid ${C.gold}`, boxShadow: "0 20px 50px rgba(0,0,0,0.6)" }}>
                <Img src={staticFile(`lf10/img/${pm.src}`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 20%" }} />
                <div style={{ position: "absolute", inset: 0, background: `rgba(30,34,40,${0.62 * v})` }} />
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 20, textAlign: "center", opacity: v, fontFamily: SANS, fontWeight: 800, fontSize: 64, color: C.white, textShadow: "0 3px 12px #000" }}>{pm.year as string}</div>
              </div>
              <div style={{ textAlign: "center", fontFamily: SANS, fontWeight: 700, fontSize: 28, color: C.white, marginTop: 14, letterSpacing: 2 }}>{(pm.name as string).toUpperCase()}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 34, fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 5, color: C.goldLight, opacity: beatA(t, p.captionAt as number) }}>{p.caption as string}</div>
      <div style={{ position: "absolute", left: 34, bottom: 26, fontFamily: SANS, fontSize: 16, color: "rgba(247,244,236,0.85)", background: "rgba(8,17,30,0.62)", padding: "6px 12px", borderLeft: `2px solid ${C.gold}`, maxWidth: 1000 }}>{p.credit as string}</div>
    </AbsoluteFill>
  );
};

// ---------- crack over framed photo (glass, not the person) ----------
const Crack: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const g = interpolate(t, [o.from, o.from + 0.5], [0, 1], { ...clamp, easing: easeOut });
  const dim = interpolate(t, [o.from + 0.4, o.to - 0.2], [0, 0.55], clamp);
  const a = interpolate(t, [o.to - 0.25, o.to], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <AbsoluteFill style={{ background: `rgba(0,0,0,${dim})` }} />
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <path d={(p.d as string) ?? "M 668 55 L 700 210 L 664 380 L 708 560 L 672 730 L 712 900 L 690 1025"} stroke="rgba(255,255,255,0.85)" strokeWidth={3} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - g} />
        <path d="M 700 210 L 760 236 M 708 560 L 660 590 M 712 900 L 770 922" stroke="rgba(255,255,255,0.6)" strokeWidth={2} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - g} />
      </svg>
    </AbsoluteFill>
  );
};

const Lower: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  return <LowerThird title={p.title as string} sub={p.sub as string | undefined} a={fadeIO(t, o.from, o.to, 0.4, 0.35)} />;
};

// side bar text for "balanced" beats (two equal panels)
const Panels2: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = fadeIO(t, o.from, o.to);
  const side = (x: number, title: string, body: string, at: number, color: string) => {
    const s = sp(t, at);
    return (
      <div style={{ position: "absolute", left: x, top: 270, width: 740, opacity: Math.min(1, s * 1.4), transform: `translateY(${(1 - s) * 40}px)` }}>
        <Panel style={{ padding: "44px 40px", minHeight: 420, borderTop: `10px solid ${color}` }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 26, letterSpacing: 4, color }}>{p.kickerL && x < 900 ? (p.kickerL as string) : p.kickerR && x > 900 ? (p.kickerR as string) : ""}</div>
          <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 56, lineHeight: 1.1, marginTop: 10 }}>{title}</div>
          <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 30, lineHeight: 1.35, color: "#2b3646", marginTop: 20 }}>{body}</div>
        </Panel>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ opacity: a }}>
      {side(190, p.lt as string, p.lb as string, p.lAt as number, (p.lc as string) ?? C.navy)}
      {side(990, p.rt as string, p.rb as string, p.rAt as number, (p.rc as string) ?? C.red)}
      {p.footer ? <div style={{ position: "absolute", top: 760, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 700, fontSize: 30, color: C.white, opacity: beatA(t, p.footerAt as number) }}>{p.footer as string}</div> : null}
    </AbsoluteFill>
  );
};

const EndScreen: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const p = o.props as P;
  const a = p.cont ? interpolate(t, [o.to - 1.2, o.to], [1, 0], clamp) : interpolate(t, [o.from, o.from + 0.6], [0, 1], clamp);
  const s = p.cont ? 1 : sp(t, o.from + 0.3);
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <div style={{ position: "absolute", left: 160, top: 250, width: 960, height: 540, border: `4px solid ${C.gold}`, background: "rgba(8,17,30,0.75)", transform: `scale(${0.9 + 0.1 * s})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, letterSpacing: 8, fontSize: 30, color: C.goldLight }}>WATCH NEXT</div>
        <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 70, color: C.white, textAlign: "center", marginTop: 20, lineHeight: 1.1 }}>The Full History<br />of Australia</div>
      </div>
      <div style={{ position: "absolute", left: 1240, top: 330, width: 520, textAlign: "center", opacity: s }}>
        <Crown size={150} />
        <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 52, color: C.white, marginTop: 20 }}>Who holds the power?</div>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.parchment, marginTop: 14 }}>Tell us in the comments</div>
      </div>
    </AbsoluteFill>
  );
};

const REG: Record<string, React.FC<{ t: number; o: Overlay }>> = {
  big: Big,
  bars: Bars,
  stack: Stack,
  cards: Cards,
  board: Board,
  chapter: Chapter,
  title: Title,
  tag: Tag,
  crown: CrownOv,
  route: Route,
  ausmap: AusMap,
  passport: Passport,
  letter: Letter,
  counter: Counter,
  tree: Tree,
  stamp: Stamp,
  chain: Chain,
  faceless: Faceless,
  seats: Seats,
  flow: Flow,
  web: Web,
  coins: Coins,
  gauges: Gauges,
  turnout: Turnout,
  voter: Voter,
  fourpms: FourPMs,
  crack: Crack,
  lower: Lower,
  panels2: Panels2,
  endscreen: EndScreen,
};

export const OverlayView: React.FC<{ t: number; o: Overlay }> = ({ t, o }) => {
  const Comp = REG[o.type];
  if (!Comp) throw new Error(`unknown overlay ${o.type}`);
  return <Comp t={t} o={o} />;
};
