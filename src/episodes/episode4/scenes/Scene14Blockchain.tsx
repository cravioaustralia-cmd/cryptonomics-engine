import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { SceneShell } from "../../shared/SceneShell";
import { TrainCoachIcon } from "../../shared/icons";
import { COLORS } from "../../shared/theme";
import { displayFont } from "../../shared/fonts";
import { usePopIn, useShake } from "../../shared/motion";
import { getWordLocalFrame } from "../../shared/timing";
import type { SceneProps } from "./types";

export const Scene14Blockchain: React.FC<SceneProps> = ({ timing, words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dropFrame = getWordLocalFrame(words, timing.sceneId, 3, timing.startMs, fps);
  const trainFrame = getWordLocalFrame(words, timing.sceneId, 9, timing.startMs, fps);

  const badgePop = usePopIn(0, { damping: 12 });

  const dropLocal = frame - dropFrame;
  const dropVisible = dropLocal >= 0;
  const dropSpring = dropVisible
    ? spring({ frame: dropLocal, fps, config: { damping: 7, mass: 1.4, stiffness: 220 } })
    : 0;
  const dropY = dropVisible ? -500 * (1 - dropSpring) : -500;
  const thudShake = useShake({ triggerFrame: dropFrame + 8, durationInFrames: 10, intensity: 12 });

  const trainVisible = frame >= trainFrame;

  return (
    <SceneShell>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 46,
        }}
      >
        <div
          style={{
            opacity: badgePop,
            transform: `scale(${0.7 + badgePop * 0.3})`,
            backgroundColor: COLORS.panel,
            border: `3px solid ${COLORS.orange}`,
            borderRadius: 999,
            padding: "12px 30px",
          }}
        >
          <span
            style={{
              fontFamily: displayFont,
              fontWeight: 800,
              fontSize: 28,
              color: COLORS.orange,
              letterSpacing: 2,
            }}
          >
            NEXT EPISODE
          </span>
        </div>

        {!trainVisible && dropVisible && (
          <div
            style={{
              transform: `translateY(${dropY}px) translate(${thudShake.x}px, ${thudShake.y}px)`,
              fontFamily: displayFont,
              fontWeight: 900,
              fontSize: 92,
              color: COLORS.white,
              textAlign: "center",
            }}
          >
            BLOCKCHAIN
          </div>
        )}

        {trainVisible && (
          <div style={{ display: "flex", alignItems: "center" }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <TrainCoachIcon width={120} height={94} color={i === 0 ? COLORS.orange : COLORS.panel} />
                {i < 3 && (
                  <div
                    style={{
                      width: 18,
                      height: 6,
                      backgroundColor: COLORS.muted,
                      marginInline: -4,
                    }}
                  />
                )}
              </div>
            ))}
            <span style={{ fontSize: 60, marginLeft: 10 }}>🚆</span>
          </div>
        )}
      </div>
    </SceneShell>
  );
};
