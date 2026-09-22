import { useCurrentFrame, useVideoConfig } from "remotion";
import { SceneShell } from "../../shared/SceneShell";
import { BitcoinCoin, PersonIcon } from "../../shared/icons";
import { COLORS } from "../../shared/theme";
import { displayFont } from "../../shared/fonts";
import type { SceneProps } from "./types";

export const Scene04Y2010: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calendar-flip: a quick rotateX flip settling flat.
  const flipProgress = Math.min(1, frame / (fps * 0.5));
  const flipAngle = (1 - flipProgress) * 90;

  const walkers = [0, 1, 2].map((i) => {
    const start = 20 + i * 18;
    const x = ((frame - start) * 4) % 1000;
    return { x: x - 100, opacity: frame > start ? 1 : 0, i };
  });

  return (
    <SceneShell>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 64,
          width: "100%",
        }}
      >
        <div
          style={{
            perspective: 800,
          }}
        >
          <div
            style={{
              transform: `rotateX(${flipAngle}deg)`,
              backgroundColor: COLORS.panel,
              border: `4px solid ${COLORS.panelBorder}`,
              borderRadius: 20,
              padding: "24px 48px",
            }}
          >
            <div
              style={{
                fontFamily: displayFont,
                fontWeight: 900,
                fontSize: 110,
                color: COLORS.white,
              }}
            >
              2010
            </div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            width: 780,
            height: 220,
            borderBottom: `3px solid ${COLORS.panelBorder}`,
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: 340,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              opacity: Math.min(1, Math.max(0, (frame - 30) / 15)),
            }}
          >
            <BitcoinCoin size={90} />
            <span style={{ fontSize: 40 }}>🥱</span>
          </div>

          {walkers.map((w) => (
            <div
              key={w.i}
              style={{
                position: "absolute",
                bottom: 20,
                left: w.x,
                opacity: w.opacity,
              }}
            >
              <PersonIcon size={46} color={COLORS.muted} />
            </div>
          ))}

          <div
            style={{
              position: "absolute",
              bottom: 130,
              left: 420,
              fontSize: 46,
              opacity: Math.min(1, Math.max(0, (frame - 50) / 15)),
            }}
          >
            ❓
          </div>
        </div>
      </div>
    </SceneShell>
  );
};
