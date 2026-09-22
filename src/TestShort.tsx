import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const TestShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title "pops in": scales up with a springy bounce and fades in.
  const titleSpring = spring({
    frame,
    fps,
    config: {
      damping: 12,
      mass: 0.5,
      stiffness: 200,
    },
  });
  const titleScale = interpolate(titleSpring, [0, 1], [0.5, 1]);
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle "slides up": starts after the title has popped in.
  const subtitleStartFrame = 45;
  const subtitleSpring = spring({
    frame: frame - subtitleStartFrame,
    fps,
    config: {
      damping: 14,
      mass: 0.6,
      stiffness: 180,
    },
  });
  const subtitleY = interpolate(subtitleSpring, [0, 1], [80, 0]);
  const subtitleOpacity = interpolate(
    frame,
    [subtitleStartFrame, subtitleStartFrame + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0b0b12",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
          padding: "0 80px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 96,
            fontWeight: 900,
            color: "#ffffff",
            margin: 0,
            lineHeight: 1.15,
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            textShadow: "0 0 40px rgba(124, 58, 237, 0.6)",
          }}
        >
          Cryptonomics with Abhi
        </h1>
        <h2
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 56,
            fontWeight: 700,
            color: "#a78bfa",
            margin: 0,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
          }}
        >
          Test video
        </h2>
      </div>
    </AbsoluteFill>
  );
};
