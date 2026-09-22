import { useCurrentFrame } from "remotion";
import { SceneShell } from "../../shared/SceneShell";
import { BitcoinCoin } from "../../shared/icons";
import { COLORS } from "../../shared/theme";
import { displayFont } from "../../shared/fonts";
import { usePopIn } from "../../shared/motion";
import type { SceneProps } from "./types";

export const Scene03Title: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const titlePop = usePopIn(0, { damping: 11 });
  const badgePop = usePopIn(14, { damping: 12 });
  const spin = frame * 6;

  return (
    <SceneShell>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 48,
        }}
      >
        <div style={{ transform: `scale(${0.4 + titlePop * 0.6})` }}>
          <BitcoinCoin size={190} rotateDeg={spin} />
        </div>

        <div
          style={{
            fontFamily: displayFont,
            fontWeight: 900,
            fontSize: 78,
            color: COLORS.white,
            textAlign: "center",
            lineHeight: 1.08,
            opacity: titlePop,
            transform: `translateY(${(1 - titlePop) * 30}px)`,
            textShadow: `0 0 40px ${COLORS.orange}66`,
          }}
        >
          Cryptonomics
          <br />
          <span style={{ color: COLORS.orange }}>with Abhi</span>
        </div>

        <div
          style={{
            opacity: badgePop,
            transform: `scale(${0.7 + badgePop * 0.3})`,
            backgroundColor: COLORS.panel,
            border: `3px solid ${COLORS.orange}`,
            borderRadius: 999,
            padding: "16px 36px",
          }}
        >
          <span
            style={{
              fontFamily: displayFont,
              fontWeight: 800,
              fontSize: 34,
              color: COLORS.gold,
              letterSpacing: 2,
            }}
          >
            BITCOIN SERIES • EP 4
          </span>
        </div>
      </div>
    </SceneShell>
  );
};
