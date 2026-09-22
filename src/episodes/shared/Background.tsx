import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS } from "./theme";

/**
 * Dark navy backdrop with a slowly drifting grid and a flickering grain
 * layer. Cheap to render (pure CSS/SVG, no images) and never fully static,
 * so even "quiet" moments keep a tiny bit of motion.
 */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const gridShiftY = (frame * 0.35) % 80;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.navyBg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${COLORS.navyBgLight} 0%, ${COLORS.navyBg} 65%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${COLORS.panelBorder}22 1px, transparent 1px), linear-gradient(90deg, ${COLORS.panelBorder}22 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          backgroundPosition: `0px ${gridShiftY}px`,
          opacity: 0.5,
        }}
      />
      <Grain />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 45%, transparent 45%, ${COLORS.navyBg}CC 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  // Flicker the noise seed a few times per second instead of every frame —
  // reads as film grain rather than a smooth crossfade.
  const seed = Math.floor(frame / 3);

  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity: 0.05 }}
    >
      <filter id="grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves={2}
          seed={seed}
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
};
