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

// Wide UK-to-Australia land silhouette (Europe/Africa/Indian Ocean/
// Australia), extracted by scripts/extract_fleet_route.mjs, for the First
// Fleet voyage map. Same {width,height,projection,polygons} shape as the
// Australia coastline, so it works directly with projectLonLat, mapRevealSVG
// and shipRouteSVG below.
let _fleetRouteCache = null;

export async function loadFleetRouteLand() {
  if (_fleetRouteCache) return _fleetRouteCache;
  const res = await fetch("/style/data/fleet-route-land.json");
  _fleetRouteCache = await res.json();
  return _fleetRouteCache;
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

// ---- Wider Sunda-Sahul region (for the first-sea-crossing map) ----
// Real modern coastlines (Australia, Indonesia, Papua New Guinea, Malaysia,
// Philippines, Timor-Leste) from scripts/extract_sahul_region.mjs. The Ice
// Age shelf itself isn't in this dataset, so callers overlay a clearly
// schematic crossing path/marker rather than claiming to show the
// submerged shoreline.

let _regionCache = null;

export async function loadSahulSundaRegion() {
  if (_regionCache) return _regionCache;
  const res = await fetch("/style/data/sahul-sunda-coastline.json");
  _regionCache = await res.json();
  return _regionCache;
}

export function projectRegionLonLat(region, lon, lat) {
  const { minLon, minLat, scale, flipHeight } = region.projection;
  return [(lon - minLon) * scale, flipHeight - (lat - minLat) * scale];
}

export function regionCountryPathD(region, countryNames) {
  return countryNames
    .map((name) => (region.countries[name] || []).map((poly) => poly.map(ringToPath).join(" ")).join(" "))
    .join(" ");
}

/**
 * regionRevealSVG - draws one or more countries' coastlines fading/drawing
 * in together (used for the Sunda-Sahul first-sea-crossing map).
 */
export function regionRevealSVG({ region, countryNames, t, start, drawDuration = 1.4, fillColor = PALETTE.sandstone, strokeColor = PALETTE.cream }) {
  const revealP = progress(t, start, drawDuration, ease.outCubic);
  // Fill only, no stroke: this map spans several adjacent countries (PNG,
  // Indonesia, Timor-Leste, Australia), and stroking each one's full
  // boundary draws their real shared land borders (e.g. the dead-straight
  // 141E PNG/Indonesia line) as visible internal seams. The land/ocean
  // fill contrast alone reads fine without an outline.
  const paths = countryNames
    .map((name) => (region.countries[name] || []).map((poly) => poly.map(ringToPath).join(" ")).join(" "))
    .filter(Boolean)
    .map(
      (d) => `<path d="${d}" fill="${fillColor}" fill-opacity="${(0.85 * revealP).toFixed(3)}" fill-rule="nonzero"/>`,
    );
  return paths.join("");
}

/**
 * crossingPathSVG - an animated dashed line from a Sunda point to a Sahul
 * point, with a small traveling marker (a simple dot/canoe), representing
 * the first sea crossing. Schematic (a straight geodesic-ish curve), never
 * presented as the real Ice Age shoreline.
 */
function quadTravelSVG(x1, y1, x2, y2, t, start, duration, color) {
  const midX = (x1 + x2) / 2 - (y2 - y1) * 0.12;
  const midY = (y1 + y2) / 2 + (x2 - x1) * 0.12;
  const pathD = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;
  const p = progress(t, start, duration, ease.inOutCubic);

  // Approximate point along the quadratic curve at parameter p, for the
  // traveling marker.
  const bx = (1 - p) * (1 - p) * x1 + 2 * (1 - p) * p * midX + p * p * x2;
  const by = (1 - p) * (1 - p) * y1 + 2 * (1 - p) * p * midY + p * p * y2;

  const dashLen = 800;
  const dashOffset = dashLen * (1 - p);

  return `
    <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round"
      stroke-dasharray="6 5" stroke-dashoffset="${dashOffset.toFixed(1)}" opacity="0.9"/>
    <g transform="translate(${bx.toFixed(1)},${by.toFixed(1)})" opacity="${p > 0 && p < 1 ? 1 : 0}">
      <circle r="5" fill="${color}"/>
      <circle r="9" fill="${color}" opacity="0.3"/>
    </g>
  `;
}

export function crossingPathSVG({ region, from, to, t, start, duration, color = PALETTE.sunsetOrange }) {
  const [x1, y1] = projectRegionLonLat(region, from.lon, from.lat);
  const [x2, y2] = projectRegionLonLat(region, to.lon, to.lat);
  return quadTravelSVG(x1, y1, x2, y2, t, start, duration, color);
}

/**
 * shipRouteSVG - same animated dashed-line-with-traveling-marker as
 * crossingPathSVG, but projected against the single-country Australia
 * coastline (loadCoastline) instead of the multi-country region. Used for
 * voyage maps that stay within Australian waters (e.g. Cook's route up the
 * east coast). Schematic, not a literal historic shipping track.
 */
export function shipRouteSVG({ coastline, from, to, t, start, duration, color = PALETTE.sunsetOrange }) {
  const [x1, y1] = projectLonLat(coastline, from.lon, from.lat);
  const [x2, y2] = projectLonLat(coastline, to.lon, to.lat);
  return quadTravelSVG(x1, y1, x2, y2, t, start, duration, color);
}
