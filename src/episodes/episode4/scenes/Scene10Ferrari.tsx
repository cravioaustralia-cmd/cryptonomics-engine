import { useCurrentFrame, useVideoConfig } from "remotion";
import { SceneShell } from "../../shared/SceneShell";
import { PizzaGuy } from "../../shared/PizzaGuy";
import { PizzaSliceIcon, CarIcon } from "../../shared/icons";
import { useZoomPunch } from "../../shared/motion";
import { getWordLocalFrame } from "../../shared/timing";
import type { SceneProps } from "./types";

const SLICES = 6;

export const Scene10Ferrari: React.FC<SceneProps> = ({ timing, words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ferrariFrame = getWordLocalFrame(words, timing.sceneId, 15, timing.startMs, fps);
  const morphed = frame >= ferrariFrame;
  const punch = useZoomPunch({ triggerFrame: ferrariFrame, peak: 1.18 });

  return (
    <SceneShell>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 50,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 360,
            height: 360,
            transform: frame >= ferrariFrame ? `scale(${punch})` : undefined,
          }}
        >
          {Array.from({ length: SLICES }).map((_, i) => {
            const angle = (i / SLICES) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const r = 110;
            const x = 180 + Math.cos(rad) * r - 45;
            const y = 180 + Math.sin(rad) * r - 45;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  transform: `rotate(${angle + 90}deg)`,
                }}
              >
                {morphed ? (
                  <CarIcon width={90} height={40} />
                ) : (
                  <PizzaSliceIcon size={70} />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ transform: `scale(${morphed ? 1 + Math.min(0.25, (frame - ferrariFrame) * 0.02) : 1})` }}>
          <PizzaGuy expression="shocked" size={380} />
        </div>
      </div>
    </SceneShell>
  );
};
