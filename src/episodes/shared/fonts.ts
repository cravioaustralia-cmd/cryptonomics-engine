import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";

// Montserrat ExtraBold (800) for all display text: titles, captions, stat
// callouts. One weight, used consistently, keeps the channel's look unified.
const { fontFamily } = loadMontserrat("normal", {
  weights: ["700", "800", "900"],
  subsets: ["latin"],
});

export const displayFont = fontFamily;
