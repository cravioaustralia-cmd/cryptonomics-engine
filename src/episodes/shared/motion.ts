import { random, spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * A deterministic camera-shake offset, active for a short window after
 * `triggerFrame`. Uses Remotion's seeded `random()` (never Math.random())
 * so every render produces the identical shake.
 */
export const useShake = ({
  triggerFrame,
  durationInFrames = 10,
  intensity = 8,
  seed = "shake",
}: {
  triggerFrame: number;
  durationInFrames?: number;
  intensity?: number;
  seed?: string;
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - triggerFrame;

  if (localFrame < 0 || localFrame > durationInFrames) {
    return { x: 0, y: 0 };
  }

  const decay = 1 - localFrame / durationInFrames;
  const x = (random(`${seed}-x-${localFrame}`) - 0.5) * 2 * intensity * decay;
  const y = (random(`${seed}-y-${localFrame}`) - 0.5) * 2 * intensity * decay;

  return { x, y };
};

/** Spring-based "punch in": quick scale-up on a reveal, then settle to 1. */
export const useZoomPunch = ({
  triggerFrame,
  peak = 1.12,
}: {
  triggerFrame: number;
  peak?: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - triggerFrame;

  if (localFrame < 0) return 1;

  const punch = spring({
    frame: localFrame,
    fps,
    config: { damping: 9, mass: 0.4, stiffness: 220 },
    durationInFrames: 18,
  });

  // Overshoot to `peak`, then settle back to 1.
  const settle = spring({
    frame: localFrame - 6,
    fps,
    config: { damping: 14, mass: 0.5, stiffness: 150 },
  });

  const upscale = 1 + (peak - 1) * punch;
  return localFrame < 6 ? upscale : upscale - (peak - 1) * settle;
};

/** Standard "pop in" spring used for titles, stat callouts, badges, etc. */
export const usePopIn = (
  triggerFrame: number,
  config: { damping?: number; mass?: number; stiffness?: number } = {},
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - triggerFrame;
  if (localFrame < 0) return 0;

  return spring({
    frame: localFrame,
    fps,
    config: {
      damping: config.damping ?? 11,
      mass: config.mass ?? 0.5,
      stiffness: config.stiffness ?? 200,
    },
  });
};
