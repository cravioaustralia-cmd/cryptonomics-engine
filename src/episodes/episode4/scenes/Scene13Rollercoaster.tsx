import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneShell } from "../../shared/SceneShell";
import { BitcoinCoin } from "../../shared/icons";
import { COLORS } from "../../shared/theme";
import { displayFont } from "../../shared/fonts";
import { getWordLocalFrame } from "../../shared/timing";
import type { SceneProps } from "./types";

// A zig-zag price line: up, up, big crash, up, small dip, up.
const POINTS: [number, number][] = [
  [0, 260],
  [90, 140],
  [180, 200],
  [280, 60],
  [370, 300],
  [470, 220],
  [560, 90],
  [650, 150],
  [740, 40],
];

const pathD = POINTS.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
const PATH_LENGTH = POINTS.reduce((sum, p, i) => {
  if (i === 0) return 0;
  const [px, py] = POINTS[i - 1];
  return sum + Math.hypot(p[0] - px, p[1] - py);
}, 0);

const pointAt = (t: number): [number, number] => {
  const target = t * PATH_LENGTH;
  let acc = 0;
  for (let i = 1; i < POINTS.length; i++) {
    const [px, py] = POINTS[i - 1];
    const [cx, cy] = POINTS[i];
    const segLen = Math.hypot(cx - px, cy - py);
    if (acc + segLen >= target) {
      const localT = segLen === 0 ? 0 : (target - acc) / segLen;
      return [px + (cx - px) * localT, py + (cy - py) * localT];
    }
    acc += segLen;
  }
  return POINTS[POINTS.length - 1];
};

export const Scene13Rollercoaster: React.FC<SceneProps> = ({ timing, words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const warnFrame = getWordLocalFrame(words, timing.sceneId, 11, timing.startMs, fps);
  const warnVisible = frame >= warnFrame;

  const drawProgress = Math.min(1, frame / (fps * 2.4));
  const coinT = Math.min(0.98, drawProgress);
  const [cx, cy] = pointAt(coinT);

  return (
    <SceneShell>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
        }}
      >
        <div style={{ position: "relative", width: 740, height: 340 }}>
          <svg width={740} height={340} viewBox="0 0 740 340">
            <path
              d={pathD}
              fill="none"
              stroke={COLORS.panelBorder}
              strokeWidth={10}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={pathD}
              fill="none"
              stroke={COLORS.green}
              strokeWidth={10}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={PATH_LENGTH}
              strokeDashoffset={interpolate(drawProgress, [0, 1], [PATH_LENGTH, 0])}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              left: cx - 30,
              top: cy - 30,
            }}
          >
            <BitcoinCoin size={60} />
          </div>
        </div>

        {warnVisible && (
          <div
            style={{
              backgroundColor: COLORS.panel,
              border: `3px solid ${COLORS.danger}`,
              borderRadius: 16,
              padding: "16px 30px",
              maxWidth: 700,
            }}
          >
            <span
              style={{
                fontFamily: displayFont,
                fontWeight: 800,
                fontSize: 36,
                color: COLORS.offWhite,
              }}
            >
              ⚠️ Value hamesha ek jaisi nahi rehti
            </span>
          </div>
        )}
      </div>
    </SceneShell>
  );
};
