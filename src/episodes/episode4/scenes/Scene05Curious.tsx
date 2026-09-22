import { useVideoConfig } from "remotion";
import { SceneShell } from "../../shared/SceneShell";
import { PizzaGuy } from "../../shared/PizzaGuy";
import { COLORS } from "../../shared/theme";
import { displayFont } from "../../shared/fonts";
import { usePopIn } from "../../shared/motion";
import type { SceneProps } from "./types";

export const Scene05Curious: React.FC<SceneProps> = () => {
  const { fps } = useVideoConfig();
  const bouncePop = usePopIn(0, { damping: 8, stiffness: 180 });
  const bubblePop = usePopIn(Math.round(fps * 0.35), { damping: 12 });

  return (
    <SceneShell>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            opacity: bubblePop,
            transform: `translateY(${(1 - bubblePop) * 24}px) scale(${0.85 + bubblePop * 0.15})`,
            backgroundColor: COLORS.white,
            borderRadius: 28,
            padding: "22px 30px",
            maxWidth: 620,
            position: "relative",
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontFamily: displayFont,
              fontWeight: 800,
              fontSize: 42,
              color: COLORS.navyBg,
              lineHeight: 1.25,
            }}
          >
            ₿ se kuch khareed sakte hain? 🤔
          </span>
          <div
            style={{
              position: "absolute",
              bottom: -18,
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "18px solid transparent",
              borderRight: "18px solid transparent",
              borderTop: `20px solid ${COLORS.white}`,
            }}
          />
        </div>

        <div
          style={{
            transform: `translateY(${(1 - bouncePop) * 260}px) scale(${0.75 + bouncePop * 0.25})`,
          }}
        >
          <PizzaGuy expression="curious" size={460} />
        </div>
      </div>
    </SceneShell>
  );
};
