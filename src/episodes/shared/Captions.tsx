import { useMemo } from "react";
import { Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, SAFE_ZONE } from "./theme";
import { displayFont } from "./fonts";
import {
  buildCaptionPages,
  type CaptionPage,
  type EpisodeCaptionWord,
} from "./captionTypes";

const BASE_FONT_SIZE = 100;
const MONEY_FONT_SIZE = 116;

/**
 * Attention-locking, TikTok/Shorts-style word captions. Reusable across
 * episodes: feed it a flat, time-ordered list of `EpisodeCaptionWord`s and
 * it groups them into 2-4 word pages, pops each word in as it's spoken, and
 * applies the channel's keyword styling (money words in gold, punch words
 * with a zoom).
 */
export const Captions: React.FC<{ words: EpisodeCaptionWord[] }> = ({
  words,
}) => {
  const { fps } = useVideoConfig();
  const pages = useMemo(() => buildCaptionPages(words), [words]);

  return (
    <>
      {pages.map((page, i) => {
        const startFrame = Math.round((page.startMs / 1000) * fps);
        const endFrame = Math.round((page.endMs / 1000) * fps);
        const durationInFrames = Math.max(1, endFrame - startFrame);

        return (
          <Sequence
            key={`${page.sceneId}-${i}`}
            from={startFrame}
            durationInFrames={durationInFrames}
            layout="none"
          >
            <CaptionPageView page={page} />
          </Sequence>
        );
      })}
    </>
  );
};

const CaptionPageView: React.FC<{ page: CaptionPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const absoluteMs = page.startMs + (frame / fps) * 1000;

  // Rough safeguard against overflow: scale the whole page down a touch if
  // the combined text is long (e.g. a page with a long number + unit).
  const totalChars = page.words.reduce((n, w) => n + w.word.length, 0);
  const overflowScale = totalChars > 22 ? 22 / totalChars : 1;

  let emojiShown = false;

  return (
    <div
      style={{
        position: "absolute",
        top: "34%",
        left: SAFE_ZONE.sidePadding,
        right: 1080 - SAFE_ZONE.right,
        display: "flex",
        justifyContent: "center",
        alignItems: "baseline",
        flexWrap: "nowrap",
        gap: 18,
        transform: `scale(${overflowScale})`,
        transformOrigin: "center top",
      }}
    >
      {page.words.map((word, i) => {
        const isActive = absoluteMs >= word.startMs && absoluteMs < word.endMs;
        const isMoney = word.emphasis === "money";
        const isPunch = word.emphasis === "punch";

        const wordStartFrame = Math.round(((word.startMs - page.startMs) / 1000) * fps);
        const localFrame = frame - wordStartFrame;

        const popSpring =
          localFrame < 0
            ? 0
            : spring({
                frame: localFrame,
                fps,
                config: { damping: 10, mass: 0.5, stiffness: 260 },
              });
        // 0.7 -> 1.0 base scale, spring's natural overshoot carries it
        // slightly past 1.0 before settling.
        const popScale = 0.7 + 0.3 * popSpring;

        const activeBump = isActive ? 1.08 : 1;

        const punchSpring =
          isPunch && localFrame >= 0
            ? spring({
                frame: localFrame,
                fps,
                config: { damping: 8, mass: 0.5, stiffness: 300 },
                durationInFrames: 14,
              })
            : 0;
        const punchScale = isPunch ? 1 + 0.35 * punchSpring * (1 - Math.min(1, localFrame / 14)) : 1;

        const shakeX = isMoney && localFrame >= 0 ? Math.sin(localFrame * 2.4) * 2.4 : 0;
        const shakeY = isMoney && localFrame >= 0 ? Math.cos(localFrame * 2.1) * 1.6 : 0;

        const showEmoji = Boolean(word.emoji) && !emojiShown && localFrame >= 0;
        if (showEmoji) emojiShown = true;

        const fontSize = isMoney ? MONEY_FONT_SIZE : BASE_FONT_SIZE;
        const color = isMoney ? COLORS.gold : isActive ? COLORS.orange : COLORS.white;

        return (
          <span
            key={i}
            style={{
              fontFamily: displayFont,
              fontWeight: 800,
              fontSize,
              color,
              whiteSpace: "pre",
              WebkitTextStroke: `3px ${COLORS.navyBg}`,
              paintOrder: "stroke fill",
              textShadow: "0 6px 18px rgba(0,0,0,0.55)",
              display: "inline-block",
              transform: `translate(${shakeX}px, ${shakeY}px) scale(${popScale * activeBump * punchScale})`,
              transformOrigin: "center bottom",
            }}
          >
            {word.word}
            {showEmoji ? ` ${word.emoji}` : ""}
          </span>
        );
      })}
    </div>
  );
};
