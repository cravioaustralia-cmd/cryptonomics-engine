import { useCurrentFrame, useVideoConfig } from "remotion";
import { SceneShell } from "../../shared/SceneShell";
import { LikeIcon, BellIcon, BitcoinCoin } from "../../shared/icons";
import { COLORS } from "../../shared/theme";
import { displayFont } from "../../shared/fonts";
import { usePopIn } from "../../shared/motion";
import { getWordLocalFrame } from "../../shared/timing";
import type { SceneProps } from "./types";

const tapScale = (frame: number, tapFrame: number) => {
  const local = frame - tapFrame;
  if (local < 0) return 1;
  if (local < 5) return 1 - (local / 5) * 0.18;
  if (local < 12) return 0.82 + ((local - 5) / 7) * 0.18;
  return 1;
};

export const Scene15CTA: React.FC<SceneProps> = ({ timing, words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const likeFrame = getWordLocalFrame(words, timing.sceneId, 8, timing.startMs, fps);
  const subFrame = getWordLocalFrame(words, timing.sceneId, 14, timing.startMs, fps);
  const rowPop = usePopIn(0, { damping: 12 });

  const pulse = 1 + Math.sin(frame / 8) * 0.04;
  const logoPop = usePopIn(Math.round(fps * 4), { damping: 11 });

  return (
    <SceneShell>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 54,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 60,
            opacity: rowPop,
            transform: `translateY(${(1 - rowPop) * 30}px)`,
          }}
        >
          <div style={{ transform: `scale(${tapScale(frame, likeFrame)})`, textAlign: "center" }}>
            <LikeIcon size={110} />
            <div style={{ fontFamily: displayFont, fontWeight: 800, fontSize: 26, color: COLORS.offWhite, marginTop: 8 }}>
              LIKE
            </div>
          </div>
          <div style={{ transform: `scale(${tapScale(frame, subFrame)})`, textAlign: "center" }}>
            <BellIcon size={110} />
            <div style={{ fontFamily: displayFont, fontWeight: 800, fontSize: 26, color: COLORS.offWhite, marginTop: 8 }}>
              SUBSCRIBE
            </div>
          </div>
        </div>

        <div
          style={{
            transform: `scale(${pulse})`,
            backgroundColor: "#229ED9",
            borderRadius: 16,
            padding: "18px 36px",
            boxShadow: "0 0 30px #229ED966",
          }}
        >
          <span style={{ fontFamily: displayFont, fontWeight: 800, fontSize: 34, color: COLORS.white }}>
            ✈️ Link in bio
          </span>
        </div>

        <div
          style={{
            opacity: logoPop,
            transform: `scale(${0.8 + logoPop * 0.2})`,
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <BitcoinCoin size={70} />
          <span style={{ fontFamily: displayFont, fontWeight: 900, fontSize: 42, color: COLORS.white }}>
            Cryptonomics <span style={{ color: COLORS.orange }}>with Abhi</span>
          </span>
        </div>
      </div>
    </SceneShell>
  );
};
