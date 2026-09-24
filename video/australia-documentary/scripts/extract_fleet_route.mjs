// Extracts a wide world-land silhouette (UK to Australia via the Atlantic,
// Cape of Good Hope and Indian Ocean) from Natural Earth via world-atlas
// (public domain, land-50m — undivided land mask, no country borders), for
// the animated First Fleet voyage map in Chapter 4. Clips each land polygon
// to a bounding box with Sutherland-Hodgman so continent-spanning polygons
// (Eurasia, Africa) don't force the map to zoom out past what the story
// needs. Never draw coastlines freehand.

import * as topojson from "topojson-client";
import world from "world-atlas/land-50m.json" with { type: "json" };
import fs from "node:fs";

const BBOX = { minLon: -75, maxLon: 160, minLat: -58, maxLat: 62 };

function clipPolygon(points, bbox) {
  // Sutherland-Hodgman clip against 4 half-planes, in lon/lat space.
  const edges = [
    { inside: (p) => p[0] >= bbox.minLon, intersect: (a, b) => intersectX(a, b, bbox.minLon) },
    { inside: (p) => p[0] <= bbox.maxLon, intersect: (a, b) => intersectX(a, b, bbox.maxLon) },
    { inside: (p) => p[1] >= bbox.minLat, intersect: (a, b) => intersectY(a, b, bbox.minLat) },
    { inside: (p) => p[1] <= bbox.maxLat, intersect: (a, b) => intersectY(a, b, bbox.maxLat) },
  ];
  let poly = points;
  for (const edge of edges) {
    if (poly.length === 0) break;
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const cur = poly[i];
      const prev = poly[(i - 1 + poly.length) % poly.length];
      const curIn = edge.inside(cur);
      const prevIn = edge.inside(prev);
      if (curIn) {
        if (!prevIn) out.push(edge.intersect(prev, cur));
        out.push(cur);
      } else if (prevIn) {
        out.push(edge.intersect(prev, cur));
      }
    }
    poly = out;
  }
  return poly;
}

function intersectX(a, b, x) {
  const t = (x - a[0]) / (b[0] - a[0]);
  return [x, a[1] + t * (b[1] - a[1])];
}
function intersectY(a, b, y) {
  const t = (y - a[1]) / (b[1] - a[1]);
  return [a[0] + t * (b[0] - a[0]), y];
}

const geo = topojson.feature(world, world.objects.land);
const features = geo.type === "FeatureCollection" ? geo.features : [geo];

const clippedPolys = [];
for (const feature of features) {
  const geomPolys = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  for (const poly of geomPolys) {
    const clippedRings = poly
      .map((ring) => clipPolygon(ring.slice(0, -1), BBOX))
      .filter((r) => r.length >= 3)
      // Drop antimeridian-wraparound artifacts: a ring whose original
      // (unclipped) points span almost the whole bbox longitude range is
      // a polygon that crosses +/-180 degrees, which naive clipping turns
      // into a spurious full-width sliver rather than real coastline.
      .filter((r) => {
        const xs = r.map((p) => p[0]);
        return Math.max(...xs) - Math.min(...xs) < (BBOX.maxLon - BBOX.minLon) * 0.9;
      });
    if (clippedRings.length) clippedPolys.push(clippedRings);
  }
}

const width = 1400;
const lonRange = BBOX.maxLon - BBOX.minLon;
const latRange = BBOX.maxLat - BBOX.minLat;
const scale = width / lonRange;
const height = latRange * scale;

const project = ([lon, lat]) => [(lon - BBOX.minLon) * scale, height - (lat - BBOX.minLat) * scale];

const projected = clippedPolys.map((poly) => poly.map((ring) => ring.map((pt) => project(pt).map((v) => Math.round(v * 100) / 100))));

fs.writeFileSync(
  "style/data/fleet-route-land.json",
  JSON.stringify({
    width,
    height,
    projection: { minLon: BBOX.minLon, minLat: BBOX.minLat, scale, flipHeight: height },
    source: "Natural Earth via world-atlas (land-50m), public domain. Modern coastlines, clipped to bbox.",
    polygons: projected,
  }),
);

console.log(`Extracted ${projected.length} clipped land polygons, bbox ${width.toFixed(0)}x${height.toFixed(0)}, scale=${scale.toFixed(3)}`);
