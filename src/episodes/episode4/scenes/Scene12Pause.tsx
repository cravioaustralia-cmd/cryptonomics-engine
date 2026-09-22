import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneShell } from "../../shared/SceneShell";
import { COLORS } from "../../shared/theme";
import { displayFont } from "../../shared/fonts";
import { getWordLocalFrame } from "../../shared/timing";
import type { SceneProps } from "./types";

export const Scene12Pause: React.FC<SceneProps> = ({ timing, words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pauseFrame = getWordLocalFrame(words, timing.sceneId, 1, timing.startMs, fps);
  const visible = frame >= pauseFrame;
  const local = frame - pauseFrame;
  const scale = visible ? Math.min(1, (local / 6) ** 0.5) : 0;

  return (
    <SceneShell>
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.navyBg,
          opacity: visible ? 0.55 : 0,
        }}
      />
      {visible && (
        <div
          style={{
            transform: `scale(${scale})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div style={{ fontSize: 90 }}>⏸</div>
          <div
            style={{
              fontFamily: displayFont,
              fontWeight: 900,
              fontSize: 84,
              color: COLORS.danger,
              letterSpacing: 2,
              textAlign: "center",
            }}
          >
            EK SECOND
          </div>
        </div>
      )}
    </SceneShell>
  );
};
