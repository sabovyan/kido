import * as d3 from 'd3';
import type { MultiPolygon, Position } from 'geojson';
import type { Country } from '../countries';

export type MemoryCountry = { code: string; name: string; features: Country[] };
export type MemoryCard = { id: string; code: string; name: string; face: 'flag' | 'shape' };
// Indexes of the cards turned up but not matched yet, and the codes of the pairs found.
export type MemoryState = { open: number[]; matched: string[] };

export const MEMORY_START: MemoryState = { open: [], matched: [] };

// A flag card and a country card per country, shuffled.
export function buildDeck(countries: MemoryCountry[], random = Math.random): MemoryCard[] {
  const deck = countries.flatMap(({ code, name }) => [
    { id: `${code}-flag`, code, name, face: 'flag' as const },
    { id: `${code}-shape`, code, name, face: 'shape' as const },
  ]);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export const isPair = (a: MemoryCard, b: MemoryCard) => a.code === b.code && a.face !== b.face;

export const isDone = (deck: MemoryCard[], state: MemoryState) => state.matched.length * 2 === deck.length;

// Turns card i face up. A pair stays up; a tap while a miss still shows turns the miss back first.
// Returns the same state when the tap does nothing (matched or already open card).
export function flip(deck: MemoryCard[], state: MemoryState, i: number): MemoryState {
  const card = deck[i];
  if (!card || state.matched.includes(card.code) || state.open.includes(i)) return state;
  const open = state.open.length === 2 ? [i] : [...state.open, i];
  if (open.length === 2 && isPair(deck[open[0]], deck[open[1]])) {
    return { open: [], matched: [...state.matched, card.code] };
  }
  return { ...state, open };
}

// SVG path of a country fitted into a width × height box. The fit uses the mainland (the largest
// polygon plus any at least a quarter its size, like Hokkaido) so far-off islands don't shrink it;
// the rest is drawn too and cropped by the box.
export function outlinePath(features: Country[], width: number, height: number, pad = 6) {
  const polygons: Position[][][] = features.flatMap(f => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates));
  const areas = polygons.map(coordinates => d3.geoArea({ type: 'Polygon', coordinates }));
  const top = Math.max(...areas);
  const mainland: MultiPolygon = { type: 'MultiPolygon', coordinates: polygons.filter((_, i) => areas[i] >= top / 4) };
  const [lon, lat] = d3.geoCentroid(mainland);
  // Looking straight down at the country, like on the globe, so shapes far from the equator aren't stretched.
  const projection = d3.geoAzimuthalEqualArea()
    .rotate([-lon, -lat])
    .fitExtent([[pad, pad], [width - pad, height - pad]], mainland);
  return d3.geoPath(projection)({ type: 'FeatureCollection', features }) ?? '';
}
