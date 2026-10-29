// The countries Flag Hunt and Learn ask about: one target per flag, and how hard each one is.
import * as d3 from 'd3';
import type { Polygon } from 'geojson';
import type { Country, World } from '../countries';
import type { Paint } from './painter';
import { FLAG_RECOGNITION } from './recognition';

export type Target = {
  code: string;
  name: string;
  features: Country[];
  center: [number, number];
  area: number;
};

// ~5,000 km², in steradians. Keeps hard-to-click specks out of Easy.
export const EASY_MIN_AREA = 5_000 / 40_589_000;

// Territories whose clicks count for their sovereign country's flag.
const SOVEREIGN: Record<string, string> = { gl: 'dk' };
export const sovereignOf = (code: string | null) => (code && SOVEREIGN[code]) ?? code;

export function largestPolygon(f: Country): Polygon {
  if (f.geometry.type === 'Polygon') return f.geometry;
  let best: Polygon = { type: 'Polygon', coordinates: f.geometry.coordinates[0] };
  for (const coords of f.geometry.coordinates) {
    const poly: Polygon = { type: 'Polygon', coordinates: coords };
    if (d3.geoArea(poly) > d3.geoArea(best)) best = poly;
  }
  return best;
}

// Groups features by flag code; the biggest feature with that exact code names the
// country (e.g. "au" is Australia, not Ashmore and Cartier Is.; "dk" is Denmark, not Greenland).
export function buildTargets(world: World) {
  const byCode = new Map<string, Country[]>();
  for (const f of world.features) {
    const code = sovereignOf(f.properties.code);
    if (!code) continue;
    byCode.set(code, [...(byCode.get(code) ?? []), f]);
  }
  return [...byCode].map(([code, features]): Target => {
    const own = features.filter(f => f.properties.code === code);
    const main = d3.greatest(own.length ? own : features, f => d3.geoArea(f))!;
    return {
      code,
      features,
      name: main.properties.name,
      center: d3.geoCentroid(largestPolygon(main)),
      area: d3.sum(features, f => d3.geoArea(f)),
    };
  });
}

// Flag Hunt's Easy (0), Medium (1) and Hard (2) cut: big countries with famous flags,
// then well-known flags, then the rest. Each mode asks its own chapter and the ones before it.
export function chapterOf(t: Target) {
  const known = FLAG_RECOGNITION[t.code] ?? 0;
  if (known >= 75 && t.area >= EASY_MIN_AREA) return 0;
  return known >= 60 ? 1 : 2;
}

export function withPaint(paints: Map<Country, Paint>, features: Country[], paint: Paint | null) {
  const next = new Map(paints);
  for (const f of features) {
    if (paint) next.set(f, paint);
    else next.delete(f);
  }
  return next;
}
