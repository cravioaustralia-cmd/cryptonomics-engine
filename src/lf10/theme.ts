import { staticFile } from "remotion";

export const FPS = 30;
export const W = 1920;
export const H = 1080;

export const C = {
  navy: "#0E1A2B",
  navyDeep: "#08111E",
  navyMid: "#16263D",
  parchment: "#EFE6D2",
  parchmentDark: "#D9CBAE",
  gold: "#C9A227",
  goldLight: "#E8CC6E",
  red: "#B3261E",
  teal: "#1FA3A3",
  ink: "#1B1B1B",
  white: "#F7F4EC",
  grey: "#9AA3AF",
};

export const SERIF = "'Playfair Display', Georgia, serif";
export const SANS = "Inter, 'Helvetica Neue', Arial, sans-serif";

export const fontCss = staticFile("lf10/fonts/fonts.css");

export const sec = (s: number) => Math.round(s * FPS);
