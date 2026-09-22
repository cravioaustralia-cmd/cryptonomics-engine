import { useCurrentFrame, useVideoConfig } from "remotion";
import { SceneShell } from "../../shared/SceneShell";
import { PhoneIcon } from "../../shared/icons";
import { COLORS } from "../../shared/theme";
import { displayFont } from "../../shared/fonts";
import { getWordLocalFrame } from "../../shared/timing";
import type { SceneProps } from "./types";

const FALLING = 10;

export const Scene09Phones: React.FC<SceneProps> = ({ timing, words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const countFrame = getWordLocalFrame(words, timing.sceneId, 4, timing.startMs, fps);
  const stampFrame = getWordLocalFrame(words, timing.sceneId, 15, timing.startMs, fps);

  const countVisible = frame >= countFrame;
  const stampVisible = frame >= stampFrame;
  const stampLocal = frame - stampFrame;
  const stampScale = stampVisible ? Math.min(1, (stampLocal / 6) ** 0.5) : 0;

  return (
    <SceneShell>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 30,
        }}
      >
        <div style={{ position: "relative", width: 480, height: 380 }}>
          {Array.from({ length: FALLING }).map((_, i) => {
            const col = i % 5;
            const row = Math.floor(i / 5);
            const targetX = 60 + col * 90;
            const targetY = 380 - 46 - row * 70;
            const startDelay = i * 3;
            const fallProgress = Math.min(1, Math.max(0, (frame - startDelay) / 14));
            const eased = fallProgress * fallProgress * (3 - 2 * fallProgress);
            const y = -80 + eased * (targetY + 80);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: targetX,
                  top: y,
                  opacity: fallProgress > 0 ? 1 : 0,
                }}
              >
                <PhoneIcon width={70} height={130} glow={COLORS.orange} />
              </div>
            );
          })}
        </div>

        {countVisible && (
          <div
            style={{
              fontFamily: displayFont,
              fontWeight: 900,
              fontSize: 64,
              color: COLORS.gold,
            }}
          >
            5,00,000 📱
          </div>
        )}

        {stampVisible && (
          <div
            style={{
              transform: `rotate(4deg) scale(${stampScale})`,
              backgroundColor: COLORS.green,
              border: `5px solid ${COLORS.white}`,
              borderRadius: 14,
              padding: "12px 28px",
            }}
          >
            <span
              style={{
                fontFamily: displayFont,
                fontWeight: 900,
                fontSize: 40,
                color: COLORS.navyBg,
              }}
            >
              BINA EMI ✅
            </span>
          </div>
        )}
      </div>
    </SceneShell>
  );
};
