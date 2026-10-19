import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  Easing,
} from "remotion";
import { C, FPS, SANS, SERIF } from "./theme";
import type { Shot } from "./types";

const ease = Easing.inOut(Easing.sin);

const imgSrc = (src: string) => staticFile(`lf10/img/${src}`);

// Navy textured backdrop used behind framed photos, docs and cards.
export const Backdrop: React.FC<{ drift?: number; tone?: "navy" | "parchment" }> = ({ drift = 0, tone = "navy" }) => {
  const navy = tone === "navy";
  return (
    <AbsoluteFill
      style={{
        background: navy
          ? `radial-gradient(ellipse at ${50 + drift * 8}% 40%, #1d3352 0%, ${C.navy} 45%, ${C.navyDeep} 100%)`
          : `radial-gradient(ellipse at ${50 + drift * 8}% 40%, #f6efdf 0%, ${C.parchment} 50%, ${C.parchmentDark} 100%)`,
      }}
    >
      <svg width="1920" height="1080" style={{ position: "absolute", opacity: navy ? 0.16 : 0.22 }}>
        <defs>
          <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse" patternTransform={`translate(${drift * 40} ${drift * 18})`}>
            <path d="M 64 0 L 0 0 0 64" fill="none" stroke={navy ? C.gold : "#8a7650"} strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="1920" height="1080" fill="url(#grid)" />
      </svg>
      <AbsoluteFill style={{ boxShadow: "inset 0 0 260px rgba(0,0,0,0.55)" }} />
    </AbsoluteFill>
  );
};

const moveTransform = (shot: Shot, p: number) => {
  const move = shot.move ?? "in";
  const [z0, z1] = shot.zoom ?? (move === "out" ? [1.14, 1.04] : move === "in" ? [1.04, 1.14] : [1.12, 1.12]);
  const s = z0 + (z1 - z0) * p;
  let tx = 0;
  let ty = 0;
  const d = 3.2; // percent travel
  if (move === "panL") tx = d - 2 * d * p;
  if (move === "panR") tx = -d + 2 * d * p;
  if (move === "up") ty = d - 2 * d * p;
  if (move === "down") ty = -d + 2 * d * p;
  return `scale(${s}) translate(${tx}%, ${ty}%)`;
};

const PhotoShot: React.FC<{ shot: Shot; p: number }> = ({ shot, p }) => {
  const frame = shot.frame ?? "full";
  const focus = shot.focus ?? [0.5, 0.4];
  if (frame === "full") {
    return (
      <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.navyDeep }}>
        <Img
          src={imgSrc(shot.src!)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${focus[0] * 100}% ${focus[1] * 100}%`,
            transform: moveTransform(shot, p),
            transformOrigin: `${focus[0] * 100}% ${focus[1] * 100}%`,
          }}
        />
      </AbsoluteFill>
    );
  }
  // framed: photo on a textured backdrop, two-layer parallax
  const fh = shot.fh ?? 900;
  const xc = frame === "framedL" ? 600 : frame === "framedR" ? 1320 : 960;
  const s = 1.0 + 0.06 * p;
  const dx = (frame === "framedL" ? 1 : -1) * 18 * p;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop drift={p} />
      <div
        style={{
          position: "absolute",
          left: xc,
          top: 540,
          transform: `translate(-50%, -50%) translateX(${dx}px) scale(${s})`,
        }}
      >
        <Img
          src={imgSrc(shot.src!)}
          style={{
            height: fh,
            display: "block",
            border: `3px solid ${C.gold}`,
            boxShadow: "0 30px 80px rgba(0,0,0,0.65)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const VideoShot: React.FC<{ shot: Shot; p: number }> = ({ shot, p }) => {
  const z = shot.zoom ?? [1.0, 1.05];
  const s = z[0] + (z[1] - z[0]) * p;
  const f = shot.focus ?? [0.5, 0.5];
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.navyDeep }}>
      <OffthreadVideo
        src={staticFile(`lf10/v/${shot.src}.mp4`)}
        startFrom={Math.round((shot.ss ?? 0) * FPS)}
        playbackRate={shot.rate ?? 1}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s})`, transformOrigin: `${f[0] * 100}% ${f[1] * 100}%` }}
      />
    </AbsoluteFill>
  );
};

const DocShot: React.FC<{ shot: Shot; p: number }> = ({ shot, p }) => {
  const [cx, cy, cw, ch] = shot.crop ?? [0, 0, 1920, 1080];
  const scroll = (shot.scroll ?? 0) * ease(p);
  const boxW = 1500;
  const scale = boxW / cw;
  const boxH = Math.min(ch * scale, 900);
  const s = 1.0 + 0.04 * p;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop drift={p} />
      <div
        style={{
          position: "absolute",
          left: 960,
          top: 540,
          width: boxW,
          height: boxH,
          overflow: "hidden",
          transform: `translate(-50%, -50%) scale(${s})`,
          boxShadow: "0 30px 90px rgba(0,0,0,0.6)",
          borderTop: `6px solid ${C.gold}`,
          backgroundColor: "white",
        }}
      >
        <Img
          src={imgSrc(shot.src!)}
          style={{
            position: "absolute",
            left: -cx * scale,
            top: -(cy + scroll) * scale,
            width: undefined,
            transformOrigin: "0 0",
            transform: `scale(${scale})`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const CardShot: React.FC<{ shot: Shot; p: number }> = ({ shot, p }) => {
  const c = shot.card!;
  const s = 1.0 + 0.05 * p;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop drift={p} />
      <div
        style={{
          position: "absolute",
          left: 960,
          top: 540,
          transform: `translate(-50%, -50%) scale(${s})`,
          width: 1100,
          padding: "70px 80px",
          background: `linear-gradient(160deg, #f7f0df, ${C.parchment})`,
          border: `3px solid ${C.gold}`,
          boxShadow: "0 30px 90px rgba(0,0,0,0.6)",
          textAlign: "center",
        }}
      >
        <div style={{ height: 3, width: 140, background: C.gold, margin: "0 auto 30px" }} />
        <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 104, color: C.navy, lineHeight: 1.05 }}>{c.name}</div>
        {c.role ? (
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 34, color: "#3b4656", marginTop: 26, letterSpacing: 1 }}>{c.role}</div>
        ) : null}
        {c.note ? (
          <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 22, color: "#6b6b6b", marginTop: 22 }}>{c.note}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export const ShotView: React.FC<{ shot: Shot }> = ({ shot }) => {
  const frame = useCurrentFrame();
  const dur = (shot.to - shot.from) * FPS;
  const p = Math.min(1, Math.max(0, frame / Math.max(1, dur)));
  const fadeF = (shot.fadeIn ?? 0) * FPS;
  const opacity = fadeF > 0 ? interpolate(frame, [0, fadeF], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  let body: React.ReactNode = null;
  if (shot.kind === "photo") body = <PhotoShot shot={shot} p={p} />;
  if (shot.kind === "video") body = <VideoShot shot={shot} p={p} />;
  if (shot.kind === "doc") body = <DocShot shot={shot} p={p} />;
  if (shot.kind === "card") body = <CardShot shot={shot} p={p} />;
  return <AbsoluteFill style={{ opacity, filter: shot.soft ? `blur(${shot.soft}px)` : undefined }}>{body}</AbsoluteFill>;
};

// Small corner credit + honesty label + witness lower-third, drawn sharp above the blur layer.
export const ShotChrome: React.FC<{ shot: Shot; t: number; explain: boolean }> = ({ shot, t, explain }) => {
  const local = t - shot.from;
  const inA = interpolate(local, [0, 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = interpolate(shot.to - t, [0, 0.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const a = inA * out;
  const lbl = shot.label;
  let lblA = 0;
  if (lbl) {
    const la = lbl.at ?? shot.from + 0.3;
    const lb = lbl.to ?? Math.min(shot.to, la + 4.2);
    const span = Math.max(0.1, lb - la);
    const fi = Math.min(0.4, span * 0.3);
    const fo = Math.min(0.35, span * 0.3);
    lblA = interpolate(t, [la, la + fi, la + span - fo, la + span], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  }
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {shot.credit ? (
        <div
          style={{
            position: "absolute",
            right: 34,
            bottom: 26,
            maxWidth: 820,
            padding: "6px 12px",
            background: "rgba(8,17,30,0.62)",
            color: "rgba(247,244,236,0.92)",
            fontFamily: SANS,
            fontSize: 17,
            fontWeight: 500,
            letterSpacing: 0.2,
            opacity: a * (explain ? 0.75 : 1),
            borderLeft: `2px solid ${C.gold}`,
          }}
        >
          {shot.credit}
        </div>
      ) : null}
      {shot.honest ? (
        <div
          style={{
            position: "absolute",
            left: 34,
            top: 30,
            padding: "7px 14px",
            background: "rgba(8,17,30,0.7)",
            color: C.goldLight,
            fontFamily: SANS,
            fontSize: 19,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            opacity: a,
          }}
        >
          {shot.honest}
        </div>
      ) : null}
      {lbl && lblA > 0 ? <LowerThird title={lbl.title} sub={lbl.sub} a={lblA} /> : null}
    </AbsoluteFill>
  );
};

export const LowerThird: React.FC<{ title: string; sub?: string; a: number }> = ({ title, sub, a }) => {
  const x = interpolate(a, [0, 1], [-40, 0]);
  return (
    <div style={{ position: "absolute", left: 90, bottom: 110, opacity: a, transform: `translateX(${x}px)` }}>
      <div style={{ width: 70 * a + 10, height: 4, background: C.gold, marginBottom: 12 }} />
      <div
        style={{
          display: "inline-block",
          background: "rgba(8,17,30,0.86)",
          padding: "14px 24px 14px 22px",
          borderLeft: `5px solid ${C.gold}`,
        }}
      >
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 38, color: C.white, letterSpacing: 1.5 }}>{title}</div>
        {sub ? <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 26, color: C.goldLight, marginTop: 6, letterSpacing: 1 }}>{sub}</div> : null}
      </div>
    </div>
  );
};
