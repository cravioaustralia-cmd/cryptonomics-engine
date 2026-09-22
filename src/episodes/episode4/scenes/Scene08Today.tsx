import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SceneShell } from "../../shared/SceneShell";
import { BitcoinCoin } from "../../shared/icons";
import { COLORS } from "../../shared/theme";
import { displayFont } from "../../shared/fonts";
import { useShake } from "../../shared/motion";
import { getWordLocalFrame } from "../../shared/timing";
import type { SceneProps } from "./types";

export const Scene08Today: React.FC<SceneProps> = ({ timing, words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const aajFrame = getWordLocalFrame(words, timing.sceneId, 0, timing.startMs, fps);
  const lakhFrame = getWordLocalFrame(words, timing.sceneId, 4, timing.startMs, fps);
  const croreFrame = getWordLocalFrame(words, timing.sceneId, 16, timing.startMs, fps);

  const aajVisible = frame >= aajFrame;
  const lakhVisible = frame >= lakhFrame;
  const croreVisible = frame >= croreFrame;

  const croreLocal = frame - croreFrame;
  const counterProgress = croreVisible
    ? Math.min(1, croreLocal / (fps * 1.2))
    : 0;
  const counterValue = Math.round(
    interpolate(counterProgress, [0, 1], [0, 8000], { extrapolateRight: "clamp" }),
  );

  const shake = useShake({ triggerFrame: croreFrame, durationInFrames: 16, intensity: 10 });

  return (
    <SceneShell>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 36,
        }}
      >
        <div
          style={{
            opacity: aajVisible ? 1 : 0,
            transform: `scale(${aajVisible ? 1 : 0.6})`,
            fontFamily: displayFont,
            fontWeight: 900,
            fontSize: 96,
            color: COLORS.white,
          }}
        >
          AAJ?
        </div>

        <div
          style={{
            opacity: lakhVisible ? 1 : 0,
            transform: `translateY(${lakhVisible ? 0 : 20}px)`,
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontFamily: displayFont,
            fontWeight: 800,
            fontSize: 52,
            color: COLORS.offWhite,
          }}
        >
          <BitcoinCoin size={64} />
          <span>= ₹85 LAKH</span>
        </div>

        {croreVisible && (
          <div
            style={{
              transform: `translate(${shake.x}px, ${shake.y}px)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                fontFamily: displayFont,
                fontWeight: 900,
                fontSize: 76,
                color: COLORS.gold,
                textShadow: `0 0 30px ${COLORS.gold}AA`,
              }}
            >
              ₹{counterValue.toLocaleString("en-IN")}+ CRORE
            </div>
            <CoinBurst active={croreLocal >= 0 && croreLocal < 30} />
          </div>
        )}
      </div>
    </SceneShell>
  );
};

const CoinBurst: React.FC<{ active: boolean }> = ({ active }) => {
  const frame = useCurrentFrame();
  if (!active) return null;
  const coins = Array.from({ length: 6 });
  return (
    <div style={{ position: "relative", width: 1, height: 1 }}>
      {coins.map((_, i) => {
        const angle = (i / coins.length) * Math.PI * 2;
        const dist = Math.min(90, frame * 6);
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist - dist * 0.4;
        const opacity = Math.max(0, 1 - frame / 24);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              transform: `translate(${x}px, ${y}px)`,
              opacity,
            }}
          >
            <BitcoinCoin size={34} />
          </div>
        );
      })}
    </div>
  );
};
