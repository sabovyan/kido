import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { World } from '../countries';
import { COUNTRY_FACTS, factsOf } from './facts';

const CONTINENTS = ['Africa', 'Antarctica', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'];
// Same grouping as buildTargets in src/game/Game.tsx and Learn.tsx.
const SOVEREIGN: Record<string, string> = { gl: 'dk' };

const world: World = JSON.parse(readFileSync(new URL('../../public/countries.geojson', import.meta.url), 'utf8'));
const gameCodes = [...new Set(world.features.map(f => f.properties.code).filter(c => c !== null).map(c => SOVEREIGN[c] ?? c))].sort();

describe('country facts', () => {
  it('has an entry for every code the games can ask about, and no others', () => {
    expect(Object.keys(COUNTRY_FACTS).sort()).toEqual(gameCodes);
  });

  it('counts Greenland as Denmark', () => {
    expect(factsOf('gl')).toBeUndefined();
    expect(factsOf('dk')?.capital).toBe('Copenhagen');
  });

  it.each(gameCodes)('%s has the right shape', code => {
    const f = COUNTRY_FACTS[code];
    expect(CONTINENTS).toContain(f.continent);
    expect(f.flag.trim()).toBe(f.flag);
    expect(f.flag.length).toBeGreaterThan(0);
    expect(f.flag.length).toBeLessThanOrEqual(80);
    if (f.capital !== undefined) expect(f.capital.trim()).not.toBe('');
    if (f.population !== undefined) {
      expect(Number.isInteger(f.population)).toBe(true);
      expect(f.population).toBeGreaterThan(0);
    }
    if (f.languages !== undefined) {
      expect(f.languages.length).toBeGreaterThan(0);
      for (const l of f.languages) expect(l.trim()).not.toBe('');
    }
  });

  it.each(gameCodes)('%s neighbours are game codes that list it back', code => {
    const { neighbours } = COUNTRY_FACTS[code];
    expect(neighbours).toEqual([...new Set(neighbours)].sort());
    expect(neighbours).not.toContain(code);
    for (const n of neighbours) {
      expect(gameCodes).toContain(n);
      expect(COUNTRY_FACTS[n].neighbours).toContain(code);
    }
  });
});
