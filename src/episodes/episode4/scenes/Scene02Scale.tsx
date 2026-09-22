import { useCurrentFrame, useVideoConfig } from "remotion";
import { SceneShell } from "../../shared/SceneShell";
import { PizzaSliceIcon, PhoneIcon } from "../../shared/icons";
import { COLORS } from "../../shared/theme";
import { displayFont } from "../../shared/fonts";
import { getWordLocalFrame } from "../../shared/timing";
import type { SceneProps } from "./types";

const PIVOT = { x: 350, y: 462 };
const ARM_LENGTH = 260;
const STRING_LENGTH = 40;

const rotate = (x: number, y: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return {
    x: x * Math.cos(rad) - y * Math.sin(rad),
    y: x * Math.sin(rad) + y * Math.cos(rad),
  };
};

export const Scene02Scale: React.FC<SceneProps> = ({ timing, words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stampFrame = getWordLocalFrame(
    words,
    timing.sceneId,
    12, // "Bina"
    timing.startMs,
    fps,
  );

  // Beam tips further toward the (heavier) phones side as the scene plays.
  const tiltProgress = Math.min(1, frame / (fps * 2.2));
  const angle = -6 - tiltProgress * 20 + Math.sin(frame / 14) * 1.5;

  const stampLocal = frame - stampFrame;
  const stampVisible = stampLocal >= 0;
  const stampSpring = stampVisible ? Math.min(1, (stampLocal / 6) ** 0.5) : 0;
  const stampOvershoot = stampVisible
    ? 1 + Math.max(0, 0.25 - stampLocal * 0.03)
    : 1;

  const left = rotate(-ARM_LENGTH, 0, angle);
  const right = rotate(ARM_LENGTH, 0, angle);

  return (
    <SceneShell>
      <div style={{ position: "relative", width: 700, height: 620 }}>
        {/* Fulcrum */}
        <div
          style={{
            position: "absolute",
            left: PIVOT.x - 34,
            top: PIVOT.y,
            width: 0,
            height: 0,
            borderLeft: "34px solid transparent",
            borderRight: "34px solid transparent",
            borderTop: `120px solid ${COLORS.panel}`,
          }}
        />

        {/* Beam */}
        <div
          style={{
            position: "absolute",
            left: PIVOT.x - ARM_LENGTH,
            top: PIVOT.y - 5,
            width: ARM_LENGTH * 2,
            height: 10,
            backgroundColor: COLORS.offWhite,
            borderRadius: 6,
            transformOrigin: "center",
            transform: `rotate(${angle}deg)`,
          }}
        />

        <Pan x={PIVOT.x + left.x} y={PIVOT.y + left.y + STRING_LENGTH}>
          <div style={{ display: "flex", gap: 6 }}>
            <PizzaSliceIcon size={70} />
            <PizzaSliceIcon size={70} />
          </div>
        </Pan>

        <Pan x={PIVOT.x + right.x} y={PIVOT.y + right.y + STRING_LENGTH}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 3,
            }}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <PhoneIcon key={i} width={26} height={52} glow={COLORS.orange} />
            ))}
          </div>
        </Pan>

        {stampVisible && (
          <div
            style={{
              position: "absolute",
              top: "30%",
              left: "50%",
              transform: `translate(-50%, -50%) rotate(-6deg) scale(${stampSpring * stampOvershoot})`,
              backgroundColor: COLORS.danger,
              border: `6px solid ${COLORS.white}`,
              borderRadius: 16,
              padding: "18px 34px",
              boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                fontFamily: displayFont,
                fontWeight: 900,
                fontSize: 56,
                color: COLORS.white,
                letterSpacing: 1,
                whiteSpace: "nowrap",
              }}
            >
              BINA JAANE 😳
            </div>
          </div>
        )}
      </div>
    </SceneShell>
  );
};

const Pan: React.FC<{ x: number; y: number; children: React.ReactNode }> = ({
  x,
  y,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: "translate(-50%, 0)",
      width: 140,
      height: 76,
      borderRadius: "0 0 44px 44px",
      border: `6px solid ${COLORS.panelBorder}`,
      borderTop: "none",
      backgroundColor: COLORS.panel,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
    }}
  >
    {children}
  </div>
);
