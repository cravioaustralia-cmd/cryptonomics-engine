export type Shot = {
  id: string;
  kind: "photo" | "video" | "doc" | "card";
  src?: string;
  from: number;
  to: number;
  fadeIn?: number;
  // photo
  frame?: "full" | "framed" | "framedL" | "framedR";
  fh?: number; // framed photo height px
  move?: "in" | "out" | "panL" | "panR" | "up" | "down" | "none";
  focus?: [number, number];
  zoom?: [number, number];
  // video
  ss?: number;
  rate?: number;
  // doc
  crop?: [number, number, number, number]; // x,y,w,h in source px
  scroll?: number; // px to scroll within the source over the shot
  // card
  card?: { name: string; role?: string; note?: string };
  soft?: number;
  credit?: string;
  honest?: string;
  label?: { title: string; sub?: string; at?: number; to?: number };
};

export type Overlay = {
  type: string;
  from: number;
  to: number;
  props?: Record<string, unknown>;
};

export type Timeline = {
  duration: number;
  shots: Shot[];
  overlays: Overlay[];
  explain: [number, number][];
};
