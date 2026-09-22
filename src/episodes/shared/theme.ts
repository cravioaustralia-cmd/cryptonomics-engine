// Shared visual language for the "Cryptonomics with Abhi" channel.
// Reused across episodes so every video feels like the same show.

export const COLORS = {
  navyBg: "#0A0E1A",
  navyBgLight: "#121830",
  panel: "#161D36",
  panelBorder: "#2A3560",
  orange: "#F7931A",
  orangeDim: "#C97612",
  white: "#FFFFFF",
  offWhite: "#E7EAF5",
  muted: "#8892B0",
  gold: "#F5C518",
  danger: "#FF4757",
  green: "#2ED573",
} as const;

export const SAFE_ZONE = {
  // Keep text/characters out of the bottom 20% (Shorts UI: caption/description)
  // and right 12% (like/comment/share rail).
  bottom: 1920 * 0.8, // y must stay above this
  right: 1080 * 0.88, // x must stay left of this
  sidePadding: 64,
} as const;

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;
