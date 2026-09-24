// Animated maps built from real coastline data (Natural Earth via the
// world-atlas package, public domain), extracted once by
// scripts/extract_coastline.mjs into style/data/australia-coastline.json.
// Never draw coastlines freehand — always go through this loader.

import { PALETTE, progress, ease, fadeIn } from "./style.js";

let _coastlineCache = null;

export async function loadCoastline() {
  if (_coastlineCache) return _coastlineCache;
  const res = await fetch("/style/data/australia-coastline.json");
  _coastlineCache = await res.json();
  return _coastlineCache;
}

// project(lon, lat) -> [x, y] in the same local unit space as the coastline
// polygons, using the projection recorded at extraction time.
export function projectLonLat(coastline, lon, lat) {
  const { minLon, minLat, scale, flipHeight } = coastline.projection;
  return [(lon - minLon) * scale, flipHeight - (lat - minLat) * scale];
}

// Well-known place markers (lon, lat), for reveal animations.
export const PLACES = {
  sydney: { lon: 151.2093, lat: -33.8688, label: "SYDNEY" },
  uluru: { lon: 131.0369, lat: -25.3444, label: "ULURU" },
  darwin: { lon: 130.8456, lat: -12.4634, label: "DARWIN" },
  melbourne: { lon: 144.9631, lat: -37.8136, label: "MELBOURNE" },
  botanyBay: { lon: 151.1852, lat: -34.0, label: "BOTANY BAY" },
  gallipoli: { lon: 26.2833, lat: 40.2167, label: "GALLIPOLI" },
};

function ringToPath(ring) {
  return ring.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ") + " Z";
}

export function coastlinePathD(coastline) {
  return coastline.polygons.map((poly) => poly.map(ringToPath).join(" ")).join(" ");
}

/**
 * mapRevealSVG - draws the coastline fading/drawing in, with an optional
 * pulsing place marker. Returns an SVG fragment string to drop inside a
 * <g> that already has the right transform for the scene.
 */
export function mapRevealSVG({
  coastline,
  t,
  start,
  drawDuration = 1.4,
  fillColor = PALETTE.sandstone,
  strokeColor = PALETTE.cream,
  place = null, // { lon, lat, label } or null
  markerStart = null,
}) {
  const revealP = progress(t, start, drawDuration, ease.outCubic);
  const d = coastlinePathD(coastline);
  const land = `
    <path d="${d}" fill="${fillColor}" fill-opacity="${(0.85 * revealP).toFixed(3)}"
      stroke="${strokeColor}" stroke-width="1.5" stroke-opacity="${revealP.toFixed(3)}"
      fill-rule="evenodd"/>
  `;

  let marker = "";
  if (place && markerStart != null) {
    const [mx, my] = projectLonLat(coastline, place.lon, place.lat);
    const markerP = progress(t, markerStart, 0.5, ease.outBack);
    const pulse = 1 + 0.15 * Math.sin((t - markerStart) * 4);
    const labelOpacity = fadeIn(t, markerStart + 0.15, 0.4);
    marker = `
      <g transform="translate(${mx},${my})" opacity="${markerP.toFixed(3)}">
        <circle r="${(6 * pulse).toFixed(2)}" fill="${PALETTE.sunsetOrange}" opacity="0.35"/>
        <circle r="4.5" fill="${PALETTE.sunsetOrange}" stroke="${PALETTE.cream}" stroke-width="1.5"/>
        <text x="10" y="4" font-family="Source Sans 3, sans-serif" font-size="15" letter-spacing="2"
          fill="${PALETTE.cream}" opacity="${labelOpacity.toFixed(3)}">${escapeXML(place.label)}</text>
      </g>
    `;
  }

  return land + marker;
}

function escapeXML(s) {
  return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
