import * as d3 from 'd3';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';

export type CountryProps = { name: string; code: string | null };
export type Country = Feature<Polygon | MultiPolygon, CountryProps>;
export type World = FeatureCollection<Polygon | MultiPolygon, CountryProps>;

export const flagUrl = (code: string) => `https://flagcdn.com/${code}.svg`;
export const flagPngUrl = (code: string) => `https://flagcdn.com/w640/${code}.png`;

let worldPromise: Promise<World> | null = null;

export function loadWorld(): Promise<World> {
  worldPromise ??= d3.json<World>('/countries.geojson').then(w => w!);
  return worldPromise;
}

// Bounds of the largest polygon, so flags of countries with far-off islands
// (USA, France, Norway...) are fitted to the mainland.
export function mainBounds(path: d3.GeoPath<any, any>, feature: Country) {
  const geom = feature.geometry;
  if (geom.type !== 'MultiPolygon') return path.bounds(feature);
  let best: Polygon | null = null;
  let bestArea = -1;
  for (const coords of geom.coordinates) {
    const poly: Polygon = { type: 'Polygon', coordinates: coords };
    const area = path.area(poly);
    if (area > bestArea) { bestArea = area; best = poly; }
  }
  return path.bounds(best!);
}
