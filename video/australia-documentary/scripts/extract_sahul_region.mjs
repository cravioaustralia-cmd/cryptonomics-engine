// Extracts real coastlines for the Sunda-Sahul region (Australia, Indonesia,
// Papua New Guinea, Malaysia, Philippines, Timor-Leste) from Natural Earth
// via world-atlas (public domain), for the animated "first sea crossing"
// map in Chapter 2. Real modern coastlines only — the Ice Age shelf itself
// isn't in this dataset, so the render adds a clearly-labeled schematic
// crossing path/marker on top rather than claiming to show the submerged
// shoreline. Never draw coastlines freehand.

import * as topojson from "topojson-client";
import world from "world-atlas/countries-50m.json" with { type: "json" };
import fs from "node:fs";

const WANTED = ["Australia", "Indonesia", "Papua New Guinea", "Timor-Leste"];

const geo = topojson.feature(world, world.objects.countries);
const countries = geo.features.filter((f) => f.properties && WANTED.includes(f.properties.name));

const byCountry = {};
let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;

for (const feature of countries) {
  const name = feature.properties.name;
  const geomPolys = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  const polys = geomPolys
    .map((poly) => poly.map((ring) => ring.map(([lon, lat]) => [lon, lat])))
    .filter((poly) => poly[0].length >= 6);
  byCountry[name] = polys;
  for (const poly of polys) for (const ring of poly) for (const [lon, lat] of ring) {
    minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
  }
}

const lonRange = maxLon - minLon;
const latRange = maxLat - minLat;
const width = 1400;
const scale = width / lonRange;
const height = latRange * scale;

const project = ([lon, lat]) => [(lon - minLon) * scale, height - (lat - minLat) * scale];

const projected = {};
for (const [name, polys] of Object.entries(byCountry)) {
  projected[name] = polys.map((poly) =>
    poly.map((ring) => ring.map((pt) => project(pt).map((v) => Math.round(v * 100) / 100))),
  );
}

fs.writeFileSync(
  "style/data/sahul-sunda-coastline.json",
  JSON.stringify({
    width,
    height,
    projection: { minLon, minLat, scale, flipHeight: height },
    source: "Natural Earth via world-atlas (countries-50m), public domain. Modern coastlines.",
    countries: projected,
  }),
);

console.log(`Extracted ${Object.keys(projected).length} countries, bbox ${width.toFixed(0)}x${height.toFixed(0)}, scale=${scale.toFixed(3)}`);
for (const [name, polys] of Object.entries(projected)) {
  console.log(`  ${name}: ${polys.length} polygon(s)`);
}
