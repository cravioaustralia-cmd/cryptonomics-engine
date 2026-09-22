import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "./theme";

const HEIGHT = 8;

/** Thin orange bar at the very top that grows across the whole episode. */
export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = Math.min(1, frame / (durationInFrames - 1));

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: HEIGHT,
        backgroundColor: `${COLORS.panelBorder}55`,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress * 100}%`,
          background: `linear-gradient(90deg, ${COLORS.orangeDim}, ${COLORS.orange})`,
          boxShadow: `0 0 16px ${COLORS.orange}AA`,
        }}
      />
    </div>
  );
};
