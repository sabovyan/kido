import * as d3 from 'd3';
import { describe, expect, it } from 'vitest';
import type { Country } from '../countries';
import { FILL, focusDistance, mainlandRadius } from './globeZoom';

// A lon/lat box as a closed ring, wound so d3 treats its inside as the small side.
const box = (lon: number, lat: number, size: number) => [
  [lon - size, lat - size], [lon - size, lat + size], [lon + size, lat + size], [lon + size, lat - size], [lon - size, lat - size],
];

const country = (...rings: number[][][]): Country => ({
  type: 'Feature',
  properties: { name: 'Test', code: 'tt' },
  geometry: rings.length === 1
    ? { type: 'Polygon', coordinates: [rings[0]] }
    : { type: 'MultiPolygon', coordinates: rings.map(r => [r]) },
});

// Where the edge of a cap of `radius` lands, as a share of the way from the middle to the screen edge.
const edgeShare = (radius: number, distance: number, fov: number) =>
  Math.sin(radius) / (distance - Math.cos(radius)) / Math.tan((fov * Math.PI) / 360);

describe('mainlandRadius', () => {
  it('reaches the farthest corner of a single polygon', () => {
    expect(mainlandRadius([0, 0], [country(box(0, 0, 1))])).toBeCloseTo(d3.geoDistance([0, 0], [1, 1]), 9);
  });

  it('ignores far-off islands', () => {
    const withIsland = country(box(0, 0, 2), box(60, 0, 0.5));
    expect(mainlandRadius([0, 0], [withIsland])).toBeCloseTo(d3.geoDistance([0, 0], [2, 2]), 9);
  });

  it('uses the biggest of several features', () => {
    const farthest = Math.max(...box(10, 10, 3).map(p => d3.geoDistance([10, 10], p as [number, number])));
    expect(mainlandRadius([10, 10], [country(box(40, 0, 0.5)), country(box(10, 10, 3))])).toBeCloseTo(farthest, 9);
  });
});

describe('focusDistance', () => {
  it.each([0.03, 0.1, 0.4])('puts the edge of the country FILL of the way to the screen edge (radius %d)', radius => {
    expect(edgeShare(radius, focusDistance(radius, 45, 1.6), 45)).toBeCloseTo(FILL, 9);
  });

  it('uses the narrower side on a portrait screen', () => {
    const d = focusDistance(0.1, 45, 0.5);
    expect(edgeShare(0.1, d, 45) / 0.5).toBeCloseTo(FILL, 9);
    expect(d).toBeGreaterThan(focusDistance(0.1, 45, 1.6));
  });

  it('comes in closer than the zoom limit for a small country like Armenia', () => {
    expect(focusDistance(0.03, 45, 1.6)).toBeLessThan(1.2);
  });

  it('stays further than the starting distance for a huge country like Russia', () => {
    expect(focusDistance(1, 45, 1.6)).toBeGreaterThan(3);
  });
});
