import React from 'react';
import {ICONS} from './assets.gen';

const A = 'stroke="currentColor" stroke-width="__SW__" stroke-linecap="round" stroke-linejoin="round" fill="none"';
const D = (d: string) => `<path d="${d}" ${A}/>`;

// Extra glyphs drawn on the same 24px grid / 1.75 stroke / round-cap system
// as the Cravio icon set, for objects the set doesn't cover.
const GLYPHS: Record<string, string> = {
  box: D('M4 8 L12 4 L20 8 V16.5 L12 20.5 L4 16.5 Z') + D('M4 8 L12 12 L20 8 M12 12 V20.5 M8 6 L16 10'),
  invoice: D('M6 3.5 H18 V20.5 L16 19 L14 20.5 L12 19 L10 20.5 L8 19 L6 20.5 Z') + D('M9 8 H15 M9 11 H15 M9 14.5 H12.5'),
  post:
    `<rect x="3.5" y="4" width="17" height="16" rx="2" ${A}/>` +
    `<circle cx="7.5" cy="8" r="1.6" ${A}/>` +
    D('M10.8 7.2 H16.5 M10.8 9.4 H14') +
    `<rect x="6.5" y="12.5" width="11" height="4.5" rx="1" ${A}/>`,
  doc: D('M6 3.5 H14 L18 7.5 V20.5 H6 Z') + D('M14 3.5 V7.5 H18') + D('M9 12 H15 M9 15 H15 M9 18 H12'),
  shield: D('M12 3.5 L19 6 V11.5 C19 15.8 16 18.8 12 20.5 C8 18.8 5 15.8 5 11.5 V6 Z') + D('M9 12 L11.2 14.2 L15.2 10'),
  film:
    `<rect x="3.5" y="5" width="17" height="14" rx="1.5" ${A}/>` +
    D('M7 5 V19 M17 5 V19 M3.5 9.5 H7 M3.5 14.5 H7 M17 9.5 H20.5 M17 14.5 H20.5') +
    D('M10.5 10 L13.8 12 L10.5 14 Z'),
  check: D('M5 12.5 L10 17.5 L19 7.5'),
  mail: `<rect x="3.5" y="6" width="17" height="12" rx="1.5" ${A}/>` + D('M4.5 7.5 L12 13 L19.5 7.5'),
  reel: `<rect x="7" y="3.5" width="10" height="17" rx="2" ${A}/>` + D('M10.7 9.6 L14 12 L10.7 14.4 Z'),
  seo: `<circle cx="10.5" cy="10.5" r="5.5" ${A}/>` + D('M14.6 14.6 L19.5 19.5 M8 10.5 H13'),
  calendar: `<rect x="4" y="5.5" width="16" height="14" rx="2" ${A}/>` + D('M4 10 H20 M8.5 3.5 V7 M15.5 3.5 V7'),
  send: D('M20.5 3.5 L10.2 13.8 M20.5 3.5 L14 20.5 L10.2 13.8 L3.5 10 Z'),
  chat: D('M4 6.5 C4 5.4 4.9 4.5 6 4.5 H18 C19.1 4.5 20 5.4 20 6.5 V14 C20 15.1 19.1 16 18 16 H10 L6 19.5 V16 C4.9 16 4 15.1 4 14 Z'),
  browser: `<rect x="3" y="4.5" width="18" height="15" rx="2" ${A}/>` + D('M3 8.5 H21'),
  building: D('M4 20 V9 L10 5 V20 M10 20 V8 H20 V20 M3 20 H21 M13 11.5 H17 M13 14.5 H17'),
  truck: D('M3.5 7 H14 V16 H3.5 Z M14 10 H18 L20.5 13 V16 H14') + `<circle cx="7" cy="17.5" r="1.6" ${A}/><circle cx="17" cy="17.5" r="1.6" ${A}/>`,
  bolt: D('M13 3.5 L6 13.5 H11.5 L10.5 20.5 L18 10 H12.5 Z'),
};

export const iconMarkup = (name: string) => ICONS[name] ?? GLYPHS[name];

/**
 * 24px line icon scaled as a vector. The stroke is re-weighted so it renders at
 * `strokePx` regardless of size (keeps the set visually consistent when large).
 */
export const Icon: React.FC<{
  name: string;
  size: number;
  color?: string;
  strokePx?: number;
  style?: React.CSSProperties;
}> = ({name, size, color = 'currentColor', strokePx, style}) => {
  const m = iconMarkup(name);
  if (!m) throw new Error(`icon ${name}`);
  const px = strokePx ?? Math.max(2, Math.min(4.2, size * 0.055));
  const sw = ((px * 24) / size).toFixed(3);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{color, display: 'block', overflow: 'visible', ...style}}
      dangerouslySetInnerHTML={{__html: m.replace(/__SW__/g, sw)}}
    />
  );
};
