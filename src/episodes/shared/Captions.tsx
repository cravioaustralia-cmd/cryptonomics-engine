import { useLayoutEffect, useMemo, useRef, useState } from "react";
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
// Sits in the top band, clear of every scene's vertically-centered graphic
// (SceneShell centers content well below this point).
const CAPTION_TOP = "7%";
// Generous enough to absorb a word's pop-in/emphasis overshoot (words can
// transiently scale up ~15-20%) without two adjacent words visually touching.
const WORD_GAP = 32;
// left/right safe-zone inset, matching the row's own left/right below.
const ROW_MAX_WIDTH = SAFE_ZONE.right - SAFE_ZONE.sidePadding;

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

  // Safeguard against overflow: scale the whole page down if the combined
  // text (words + any emoji) is wider than the safe zone. Measured against a
  // hidden, unanimated copy rather than estimated from character count,
  // since a character-count heuristic can't account for emoji width or real
  // font metrics and was letting wide pages (e.g. a 4-word page with an
  // emoji) clip off both edges of the screen.
  const measureRef = useRef<HTMLDivElement>(null);
  const [overflowScale, setOverflowScale] = useState(1);
  useLayoutEffect(() => {
    const width = measureRef.current?.scrollWidth ?? 0;
    setOverflowScale(width > ROW_MAX_WIDTH ? ROW_MAX_WIDTH / width : 1);
  }, [page]);

  let emojiShown = false;

  return (
    <>
      <div
        ref={measureRef}
        aria-hidden
        style={{
          position: "absolute",
          top: -9999,
          left: 0,
          visibility: "hidden",
          display: "flex",
          alignItems: "baseline",
          flexWrap: "nowrap",
          gap: WORD_GAP,
        }}
      >
        {page.words.map((word, i) => (
          <span
            key={i}
            style={{
              fontFamily: displayFont,
              fontWeight: 800,
              fontSize: word.emphasis === "money" ? MONEY_FONT_SIZE : BASE_FONT_SIZE,
              whiteSpace: "pre",
            }}
          >
            {word.word}
            {word.emoji ? ` ${word.emoji}` : ""}
          </span>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          top: CAPTION_TOP,
          left: SAFE_ZONE.sidePadding,
          right: 1080 - SAFE_ZONE.right,
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          flexWrap: "nowrap",
          gap: WORD_GAP,
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
    </>
  );
};
