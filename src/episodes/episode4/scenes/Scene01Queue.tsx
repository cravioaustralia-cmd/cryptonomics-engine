import { useCurrentFrame, useVideoConfig } from "remotion";
import { SceneShell } from "../../shared/SceneShell";
import { PersonIcon, PhoneIcon } from "../../shared/icons";
import { COLORS } from "../../shared/theme";
import { displayFont } from "../../shared/fonts";
import { usePopIn } from "../../shared/motion";
import type { SceneProps } from "./types";

const PEOPLE = 6;

export const Scene01Queue: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const labelPop = usePopIn(10, { damping: 12 });

  return (
    <SceneShell>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 90,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
          {Array.from({ length: PEOPLE }).map((_, i) => {
            const delay = i * 4;
            const pop = Math.min(
              1,
              Math.max(0, (frame - delay) / (fps * 0.35)),
            );
            const eased = pop * pop * (3 - 2 * pop); // smoothstep
            const scale = 0.62 + i * 0.06;
            return (
              <div
                key={i}
                style={{
                  opacity: eased,
                  transform: `translateY(${(1 - eased) * 40}px) scale(${scale})`,
                }}
              >
                <PersonIcon
                  size={54}
                  color={i === PEOPLE - 1 ? COLORS.offWhite : COLORS.muted}
                />
              </div>
            );
          })}

          <div
            style={{
              marginLeft: 24,
              transform: `scale(${0.85 + labelPop * 0.15})`,
              opacity: labelPop,
              filter: `drop-shadow(0 0 ${18 + Math.sin(frame / 6) * 6}px ${COLORS.orange}AA)`,
            }}
          >
            <PhoneIcon width={110} height={220} glow={COLORS.orange} />
          </div>
        </div>

        <div
          style={{
            fontFamily: displayFont,
            fontWeight: 800,
            fontSize: 44,
            color: COLORS.white,
            letterSpacing: 1,
            opacity: labelPop,
            transform: `translateY(${(1 - labelPop) * 20}px)`,
            textAlign: "center",
          }}
        >
          "iPhone 18 Pro"
        </div>
      </div>
    </SceneShell>
  );
};
