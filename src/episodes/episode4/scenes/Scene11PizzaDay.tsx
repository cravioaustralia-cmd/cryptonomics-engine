import { useCurrentFrame, useVideoConfig, random } from "remotion";
import { SceneShell } from "../../shared/SceneShell";
import { COLORS } from "../../shared/theme";
import { displayFont } from "../../shared/fonts";
import { usePopIn } from "../../shared/motion";
import { getWordLocalFrame } from "../../shared/timing";
import type { SceneProps } from "./types";

const CONFETTI = 22;

export const Scene11PizzaDay: React.FC<SceneProps> = ({ timing, words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dateFrame = getWordLocalFrame(words, timing.sceneId, 3, timing.startMs, fps);
  const datePop = frame >= dateFrame ? 1 : 0;
  const bannerPop = usePopIn(Math.round(fps * 1.6), { damping: 11 });

  return (
    <SceneShell>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 44,
          position: "relative",
        }}
      >
        {frame >= dateFrame &&
          Array.from({ length: CONFETTI }).map((_, i) => {
            const seed = `confetti-${i}`;
            const x = (random(`${seed}-x`) - 0.5) * 700;
            const fallSpeed = 3 + random(`${seed}-s`) * 3;
            const startY = -400 - random(`${seed}-d`) * 300;
            const y = startY + (frame - dateFrame) * fallSpeed;
            const rotate = (frame - dateFrame) * (4 + random(`${seed}-r`) * 6);
            const color = [COLORS.orange, COLORS.gold, COLORS.white][i % 3];
            if (y > 500) return null;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 300 + x,
                  top: y,
                  width: 12,
                  height: 12,
                  backgroundColor: color,
                  transform: `rotate(${rotate}deg)`,
                }}
              />
            );
          })}

        <div
          style={{
            transform: `scale(${0.6 + datePop * 0.4})`,
            opacity: datePop,
            backgroundColor: COLORS.panel,
            border: `4px solid ${COLORS.orange}`,
            borderRadius: 20,
            padding: "20px 44px",
          }}
        >
          <span
            style={{
              fontFamily: displayFont,
              fontWeight: 900,
              fontSize: 72,
              color: COLORS.white,
            }}
          >
            22 MAY
          </span>
        </div>

        {/* Simplified globe */}
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: "50%",
            border: `4px solid ${COLORS.muted}`,
            backgroundColor: COLORS.navyBgLight,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: 4,
              backgroundColor: `${COLORS.muted}66`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "50%",
              width: 4,
              backgroundColor: `${COLORS.muted}66`,
            }}
          />
          {[0, 1, 2].map((i) => {
            const angle = (i / 3) * Math.PI * 2 + frame / 40;
            const x = 100 + Math.cos(angle) * 70 - 16;
            const y = 100 + Math.sin(angle) * 30 - 16;
            return (
              <div key={i} style={{ position: "absolute", left: x, top: y, fontSize: 32 }}>
                🍕
              </div>
            );
          })}
        </div>

        <div
          style={{
            opacity: bannerPop,
            transform: `scale(${0.7 + bannerPop * 0.3})`,
            backgroundColor: COLORS.orange,
            borderRadius: 16,
            padding: "18px 32px",
          }}
        >
          <span
            style={{
              fontFamily: displayFont,
              fontWeight: 800,
              fontSize: 42,
              color: COLORS.navyBg,
              whiteSpace: "nowrap",
            }}
          >
            🍕 BITCOIN PIZZA DAY 🍕
          </span>
        </div>
      </div>
    </SceneShell>
  );
};
