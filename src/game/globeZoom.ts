import * as d3 from 'd3';
import type { Polygon } from 'geojson';
import type { Country } from '../countries';

// How much of the narrower half of the screen a focused country's mainland fills.
export const FILL = 0.5;

// Angle (radians) from `center` to the farthest point of the biggest polygon of the
// biggest feature, so far-off islands (France's, Norway's...) don't keep the camera away.
export function mainlandRadius(center: [number, number], features: Country[]) {
  const main = d3.greatest(features, f => d3.geoArea(f));
  if (!main) return 0;
  const geom = main.geometry;
  const polys: Polygon[] = geom.type === 'MultiPolygon'
    ? geom.coordinates.map(coordinates => ({ type: 'Polygon', coordinates }))
    : [geom];
  const land = d3.greatest(polys, p => d3.geoArea(p));
  return d3.max(land?.coordinates[0] ?? [], p => d3.geoDistance(center, p as [number, number])) ?? 0;
}

// Camera distance from the globe's centre (radius 1) at which a cap of `radius` radians
// around the middle of the view reaches FILL of the way to the nearer screen edge.
export function focusDistance(radius: number, fov: number, aspect: number) {
  const r = Math.min(radius, Math.PI / 2);
  const half = Math.tan((fov * Math.PI) / 360) * Math.min(1, aspect);
  return Math.cos(r) + Math.sin(r) / (FILL * half);
}
