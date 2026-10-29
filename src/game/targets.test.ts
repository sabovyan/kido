import * as d3 from 'd3';
import type { Position } from 'geojson';
import { describe, expect, it } from 'vitest';
import type { Country, World } from '../countries';
import type { Paint } from './painter';
import { buildTargets, chapterOf, EASY_MIN_AREA, largestPolygon, sovereignOf, type Target, withPaint } from './targets';

// A clockwise lon/lat square, the winding d3 reads as the small side.
const square = (lon: number, lat: number, size: number): Position[] =>
  [[lon, lat], [lon, lat + size], [lon + size, lat + size], [lon + size, lat], [lon, lat]];
const country = (code: string | null, name: string, ...squares: Position[][]): Country => ({
  type: 'Feature',
  properties: { code, name },
  geometry: squares.length === 1
    ? { type: 'Polygon', coordinates: [squares[0]] }
    : { type: 'MultiPolygon', coordinates: squares.map(s => [s]) },
});
const world = (...features: Country[]): World => ({ type: 'FeatureCollection', features });
const target = (code: string, area: number): Target => ({ code, name: code, features: [], center: [0, 0], area });

describe('sovereignOf', () => {
  it('counts Greenland for Denmark and keeps other codes', () => {
    expect(sovereignOf('gl')).toBe('dk');
    expect(sovereignOf('fr')).toBe('fr');
    expect(sovereignOf(null)).toBeNull();
  });
});

describe('largestPolygon', () => {
  it('returns a plain polygon as it is', () => {
    const f = country('fr', 'France', square(0, 40, 5));
    expect(largestPolygon(f)).toBe(f.geometry);
  });

  it('picks the biggest part of a multipolygon', () => {
    const f = country('cl', 'Chile', square(0, 0, 1), square(10, 0, 4), square(20, 0, 2));
    expect(largestPolygon(f).coordinates).toEqual([square(10, 0, 4)]);
  });
});

describe('buildTargets', () => {
  const dk = country('dk', 'Denmark', square(8, 54, 3));
  const gl = country('gl', 'Greenland', square(-50, 60, 20));
  const fr = country('fr', 'France', square(0, 43, 5));
  const none = country(null, 'Somewhere', square(100, 0, 1));

  it('groups features by flag and names the country after its own biggest feature', () => {
    const targets = buildTargets(world(dk, fr, gl, none));
    expect(targets.map(t => t.code)).toEqual(['dk', 'fr']);
    const denmark = targets[0];
    expect(denmark.name).toBe('Denmark');
    expect(denmark.features).toEqual([dk, gl]);
    expect(denmark.area).toBeCloseTo(d3.geoArea(dk) + d3.geoArea(gl));
    expect(denmark.center[0]).toBeCloseTo(9.5, 1);
    expect(denmark.center[1]).toBeCloseTo(55.5, 1);
  });

  it('falls back to the territory when the country itself is missing', () => {
    const [only] = buildTargets(world(gl));
    expect(only.code).toBe('dk');
    expect(only.name).toBe('Greenland');
  });
});

describe('chapterOf', () => {
  it('puts big countries with famous flags in Easy', () => {
    expect(chapterOf(target('jp', EASY_MIN_AREA))).toBe(0);
  });

  it('moves tiny countries with famous flags to Medium', () => {
    expect(chapterOf(target('jp', EASY_MIN_AREA / 2))).toBe(1);
  });

  it('puts less known flags in Medium or Hard', () => {
    expect(chapterOf(target('ec', 1))).toBe(1);
    expect(chapterOf(target('xx', 1))).toBe(2);
  });
});

describe('withPaint', () => {
  const a = country('fr', 'France', square(0, 0, 1));
  const b = country('de', 'Germany', square(2, 0, 1));

  it('paints and clears features in a new map', () => {
    const before = new Map<Country, Paint>([[a, 'flag']]);
    const painted = withPaint(before, [b], 'wrong');
    expect([...painted]).toEqual([[a, 'flag'], [b, 'wrong']]);
    expect(before.size).toBe(1);
    expect([...withPaint(painted, [a, b], null)]).toEqual([]);
  });
});
