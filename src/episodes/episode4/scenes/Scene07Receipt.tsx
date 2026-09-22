import { useCurrentFrame, useVideoConfig } from "remotion";
import { SceneShell } from "../../shared/SceneShell";
import { PizzaGuy } from "../../shared/PizzaGuy";
import { getWordLocalFrame } from "../../shared/timing";
import type { SceneProps } from "./types";

export const Scene07Receipt: React.FC<SceneProps> = ({ timing, words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const billFrame = getWordLocalFrame(
    words,
    timing.sceneId,
    17, // "bill."
    timing.startMs,
    fps,
  );

  const printProgress = Math.min(1, frame / (fps * 1.6));
  const maxHeight = 260;

  return (
    <SceneShell>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
        }}
      >
        <div
          style={{
            width: 360,
            height: maxHeight * printProgress,
            overflow: "hidden",
            backgroundColor: "#F4EEDD",
            borderRadius: "4px 4px 0 0",
            boxShadow: "0 16px 30px rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              padding: "24px 20px",
              fontFamily: "monospace",
              fontSize: 24,
              color: "#1B2340",
              textAlign: "center",
              lineHeight: 1.7,
            }}
          >
            ***RECEIPT***
            <br />
            2x Pizza
            <br />
            10,000 ₿
            <br />
            = ~₹2,000
            <br />
            ✅ Normal bill
            <br />
            ------------------
          </div>
        </div>

        <div
          style={{
            opacity: frame >= billFrame ? 1 : 0,
            transform: `scale(${frame >= billFrame ? 1 : 0.8})`,
          }}
        >
          <PizzaGuy expression="happy" size={340} />
        </div>
      </div>
    </SceneShell>
  );
};
