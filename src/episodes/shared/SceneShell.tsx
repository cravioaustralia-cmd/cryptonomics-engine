import { AbsoluteFill } from "remotion";
import { useZoomPunch } from "./motion";
import { SAFE_ZONE } from "./theme";

/**
 * Common wrapper for every scene: gives it a punchy entrance (a quick
 * zoom-in-and-settle instead of a fade, so frame 1 of any scene already
 * looks alive) and keeps content inside the Shorts-safe area.
 */
export const SceneShell: React.FC<{
  children: React.ReactNode;
  zoomPeak?: number;
}> = ({ children, zoomPeak = 1.06 }) => {
  const scale = useZoomPunch({ triggerFrame: 0, peak: zoomPeak });

  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: 1920 - SAFE_ZONE.bottom,
          paddingRight: 1080 - SAFE_ZONE.right,
          paddingLeft: SAFE_ZONE.sidePadding,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
