import { useCurrentFrame, useVideoConfig } from "remotion";
import { SceneShell } from "../../shared/SceneShell";
import { COLORS } from "../../shared/theme";
import { displayFont } from "../../shared/fonts";
import { usePopIn } from "../../shared/motion";
import { getWordLocalFrame } from "../../shared/timing";
import type { SceneProps } from "./types";

export const Scene06Order: React.FC<SceneProps> = ({ timing, words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const screenPop = usePopIn(0, { damping: 12 });
  const boxPop = usePopIn(Math.round(fps * 0.5), { damping: 9 });

  const priceFrame = getWordLocalFrame(
    words,
    timing.sceneId,
    8, // "10,000"
    timing.startMs,
    fps,
  );
  const priceLocal = frame - priceFrame;
  const priceVisible = priceLocal >= 0;
  const priceSpring = priceVisible ? Math.min(1, (priceLocal / 7) ** 0.5) : 0;

  return (
    <SceneShell>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 56,
        }}
      >
        {/* Retro CRT monitor */}
        <div
          style={{
            opacity: screenPop,
            transform: `scale(${0.85 + screenPop * 0.15})`,
            width: 560,
            borderRadius: 24,
            border: `10px solid ${COLORS.panel}`,
            backgroundColor: "#0F1730",
            padding: 28,
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 30,
              color: COLORS.green,
              lineHeight: 1.6,
            }}
          >
            {"> ORDER CONFIRMED"}
            <br />
            {"> 2x PIZZA"}
            <br />
            {"> PAYMENT: BITCOIN"}
            <br />
            <span style={{ opacity: Math.abs(Math.sin(frame / 10)) }}>_</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 30,
            opacity: boxPop,
            transform: `translateY(${(1 - boxPop) * 60}px)`,
          }}
        >
          <PizzaBox />
          <PizzaBox />
        </div>

        {priceVisible && (
          <div
            style={{
              transform: `scale(${priceSpring})`,
              backgroundColor: COLORS.orange,
              borderRadius: 18,
              padding: "20px 44px",
              boxShadow: `0 0 40px ${COLORS.orange}88`,
            }}
          >
            <span
              style={{
                fontFamily: displayFont,
                fontWeight: 900,
                fontSize: 58,
                color: COLORS.navyBg,
              }}
            >
              10,000 ₿
            </span>
          </div>
        )}
      </div>
    </SceneShell>
  );
};

const PizzaBox: React.FC = () => (
  <div
    style={{
      width: 130,
      height: 130,
      backgroundColor: "#D9B27C",
      border: "4px solid #8A5A2E",
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 56,
      boxShadow: "0 10px 24px rgba(0,0,0,0.4)",
    }}
  >
    🍕
  </div>
);
