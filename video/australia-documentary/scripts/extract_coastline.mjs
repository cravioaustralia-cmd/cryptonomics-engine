import * as topojson from "topojson-client";
import world from "world-atlas/countries-50m.json" with { type: "json" };
import fs from "node:fs";

const geo = topojson.feature(world, world.objects.countries);
const australia = geo.features.find((f) => f.properties && f.properties.name === "Australia");

const polygons = australia.geometry.coordinates
  .map((poly) => poly.map((ring) => ring.map(([lon, lat]) => [lon, lat])))
  .filter((poly) => poly[0].length >= 15);

let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
for (const poly of polygons) for (const ring of poly) for (const [lon, lat] of ring) {
  minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
  minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
}
const lonRange = maxLon - minLon;
const latRange = maxLat - minLat;
const width = 1000;
const scale = width / lonRange;
const height = latRange * scale;

const project = ([lon, lat]) => [(lon - minLon) * scale, height - (lat - minLat) * scale];

const projected = polygons.map((poly) => poly.map((ring) => ring.map(project)));

fs.writeFileSync(
  "style/data/australia-coastline.json",
  JSON.stringify({
    width,
    height,
    projection: { minLon, minLat, scale, flipHeight: height },
    source: "Natural Earth via world-atlas (countries-50m), public domain",
    polygons: projected.map((poly) =>
      poly.map((ring) => ring.map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100])),
    ),
  }),
);

console.log(`Extracted ${projected.length} polygon(s), bbox ${width.toFixed(0)}x${height.toFixed(0)}, scale=${scale.toFixed(3)}`);
