import React from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FPS, sec } from "./theme";
import { ShotChrome, ShotView } from "./Shots";
import { OverlayView } from "./Overlays";
import type { Timeline } from "./types";
import timelineJson from "./timeline.json";

const timeline = timelineJson as unknown as Timeline;

const FONTS: [string, string, string, string][] = [
  ["Playfair Display", "PlayfairDisplay-600.woff2", "600", "normal"],
  ["Playfair Display", "PlayfairDisplay-700.woff2", "700", "normal"],
  ["Playfair Display", "PlayfairDisplay-800.woff2", "800", "normal"],
  ["Playfair Display", "PlayfairDisplay-600i.woff2", "600", "italic"],
  ["Inter", "Inter-400.woff2", "400", "normal"],
  ["Inter", "Inter-500.woff2", "500", "normal"],
  ["Inter", "Inter-600.woff2", "600", "normal"],
  ["Inter", "Inter-700.woff2", "700", "normal"],
  ["Inter", "Inter-800.woff2", "800", "normal"],
];

if (typeof document !== "undefined") {
  const handle = delayRender("lf10 fonts");
  Promise.all(
    FONTS.map(([fam, file, weight, style]) =>
      new FontFace(fam, `url(${staticFile(`lf10/fonts/${file}`)})`, { weight, style }).load().then((f) => {
        document.fonts.add(f);
      }),
    ),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
}

const RAMP = 0.33;
const explainAmount = (t: number) => {
  let e = 0;
  for (const [a, b] of timeline.explain) {
    if (b - a < 0.05 || t < a - RAMP || t > b + RAMP) continue;
    const v = interpolate(t, [a - RAMP, a, b, b + RAMP], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    e = Math.max(e, v);
  }
  return e;
};

export const Lf10: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const e = explainAmount(t);
  const active = timeline.shots.filter((s) => t >= s.from && t < s.to);
  const top = active[active.length - 1];
  return (
    <AbsoluteFill style={{ backgroundColor: C.navyDeep, fontVariantNumeric: "lining-nums" }}>
      <AbsoluteFill style={{ filter: e > 0.001 ? `blur(${14 * e}px) brightness(${1 - 0.3 * e})` : undefined, transform: e > 0.001 ? `scale(${1 + 0.03 * e})` : undefined }}>
        {timeline.shots.map((s) => (
          <Sequence key={s.id} from={sec(s.from)} durationInFrames={Math.max(1, sec(s.to) - sec(s.from))} layout="none">
            <AbsoluteFill>
              <ShotView shot={s} />
            </AbsoluteFill>
          </Sequence>
        ))}
      </AbsoluteFill>
      {top ? <ShotChrome shot={top} t={t} explain={e > 0.5} /> : null}
      {timeline.overlays
        .filter((o) => t >= o.from && t < o.to)
        .map((o, i) => (
          <OverlayView key={`${o.type}-${o.from}-${i}`} t={t} o={o} />
        ))}
    </AbsoluteFill>
  );
};

export const lf10Composition = {
  id: "LF10",
  component: Lf10,
  durationInFrames: Math.round(timeline.duration * FPS),
  fps: FPS,
  width: 1920,
  height: 1080,
};
