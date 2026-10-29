import { describe, expect, it } from 'vitest';
import type { Country } from '../countries';
import { buildDeck, flip, isDone, isPair, MEMORY_START, type MemoryCard, type MemoryState, outlinePath } from './memory';

// Clockwise ring (d3's winding for an outer ring) around a lon/lat box.
const box = (x0: number, y0: number, x1: number, y1: number) => [[[x0, y0], [x0, y1], [x1, y1], [x1, y0], [x0, y0]]];
const country = (code: string, ...polygons: number[][][][]): Country => ({
  type: 'Feature',
  properties: { name: code, code },
  geometry: { type: 'MultiPolygon', coordinates: polygons },
});
const countries = (...codes: string[]) => codes.map(code => ({ code, name: code.toUpperCase(), features: [country(code, box(0, 0, 1, 1))] }));

// Fixed order for the game tests: am-flag, am-shape, jp-flag, jp-shape, ...
const ordered = (...codes: string[]) => buildDeck(countries(...codes), () => 0.999999).sort((a, b) => a.id.localeCompare(b.id));
const at = (deck: MemoryCard[], id: string) => deck.findIndex(c => c.id === id);
const play = (deck: MemoryCard[], ...ids: string[]) => ids.reduce<MemoryState>((s, id) => flip(deck, s, at(deck, id)), MEMORY_START);

describe('buildDeck', () => {
  it.each([2, 4, 6])('makes a flag card and a country card for each of %d countries', n => {
    const codes = ['am', 'ru', 'us', 'jp', 'cl', 'fr'].slice(0, n);
    const deck = buildDeck(countries(...codes));
    expect(deck).toHaveLength(n * 2);
    expect(new Set(deck.map(c => c.id)).size).toBe(n * 2);
    for (const code of codes) {
      expect(deck.filter(c => c.code === code).map(c => c.face).sort()).toEqual(['flag', 'shape']);
    }
  });

  it('keeps the country name on both cards', () => {
    expect(buildDeck(countries('am', 'jp')).every(c => c.name === c.code.toUpperCase())).toBe(true);
  });

  it('shuffles with the given random source', () => {
    let seed = 1;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const ids = buildDeck(countries('am', 'ru', 'us', 'jp', 'cl', 'fr'), random).map(c => c.id);
    expect(ids).not.toEqual([...ids].sort());
    seed = 1;
    expect(buildDeck(countries('am', 'ru', 'us', 'jp', 'cl', 'fr'), random).map(c => c.id)).toEqual(ids);
  });
});

describe('isPair', () => {
  const deck = ordered('am', 'jp');
  it('pairs a flag with its own country', () => {
    expect(isPair(deck[at(deck, 'am-flag')], deck[at(deck, 'am-shape')])).toBe(true);
  });
  it('does not pair different countries or the same card twice', () => {
    expect(isPair(deck[at(deck, 'am-flag')], deck[at(deck, 'jp-shape')])).toBe(false);
    expect(isPair(deck[at(deck, 'am-flag')], deck[at(deck, 'am-flag')])).toBe(false);
  });
});

describe('flip', () => {
  const deck = ordered('am', 'jp', 'us');

  it('opens the first card', () => {
    expect(play(deck, 'am-flag')).toEqual({ open: [at(deck, 'am-flag')], matched: [] });
  });

  it('keeps a pair up and clears the open cards', () => {
    expect(play(deck, 'am-flag', 'am-shape')).toEqual({ open: [], matched: ['am'] });
    expect(play(deck, 'am-shape', 'am-flag')).toEqual({ open: [], matched: ['am'] });
  });

  it('leaves a miss open so it can be shown before flipping back', () => {
    expect(play(deck, 'am-flag', 'jp-shape')).toEqual({ open: [at(deck, 'am-flag'), at(deck, 'jp-shape')], matched: [] });
  });

  it('turns a miss back when a third card is tapped', () => {
    expect(play(deck, 'am-flag', 'jp-shape', 'us-flag')).toEqual({ open: [at(deck, 'us-flag')], matched: [] });
  });

  it('ignores taps on an open or matched card', () => {
    const open = play(deck, 'am-flag');
    expect(flip(deck, open, at(deck, 'am-flag'))).toBe(open);
    const matched = play(deck, 'am-flag', 'am-shape');
    expect(flip(deck, matched, at(deck, 'am-shape'))).toBe(matched);
  });

  it('adds each pair once and is done after the last one', () => {
    const s = play(deck, 'am-flag', 'jp-shape', 'jp-flag', 'jp-shape', 'jp-shape', 'am-shape', 'am-flag', 'us-flag', 'us-flag', 'us-shape');
    expect(s.matched).toEqual(['jp', 'am', 'us']);
    expect(isDone(deck, s)).toBe(true);
    expect(isDone(deck, play(deck, 'am-flag', 'am-shape'))).toBe(false);
  });
});

describe('outlinePath', () => {
  const numbers = (d: string) => (d.match(/-?\d+(\.\d+)?(e-?\d+)?/g) ?? []).map(Number);
  const xs = (d: string) => numbers(d).filter((_, i) => i % 2 === 0);
  const ys = (d: string) => numbers(d).filter((_, i) => i % 2 === 1);

  it('fits the country inside the box with padding', () => {
    const d = outlinePath([country('am', box(43, 38, 47, 41))], 100, 70, 6);
    expect(Math.min(...xs(d))).toBeGreaterThanOrEqual(6 - 1e-6);
    expect(Math.max(...xs(d))).toBeLessThanOrEqual(94 + 1e-6);
    expect(Math.min(...ys(d))).toBeGreaterThanOrEqual(6 - 1e-6);
    expect(Math.max(...ys(d))).toBeLessThanOrEqual(64 + 1e-6);
  });

  it('fits to the mainland, not to small far-off islands', () => {
    const withIsland = outlinePath([country('xx', box(0, 0, 10, 10), box(60, 30, 61, 31))], 100, 70, 6);
    const alone = outlinePath([country('xx', box(0, 0, 10, 10))], 100, 70, 6);
    expect(withIsland.startsWith(alone)).toBe(true);
  });

  it('keeps big islands in the fit', () => {
    const d = outlinePath([country('xx', box(0, 0, 10, 10), box(12, 0, 20, 8))], 100, 70, 6);
    expect(Math.max(...xs(d))).toBeCloseTo(94, 3);
  });
});
