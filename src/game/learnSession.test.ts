import { describe, expect, it } from 'vitest';
import { buildQuestions, levelAfter, MAX_EXTRAS, sessionExtras, shuffle } from './learnSession';

const c = (...codes: string[]) => codes.map(code => ({ code }));
const codes = (items: { code: string }[]) => items.map(i => i.code);

describe('sessionExtras', () => {
  it('fills the free spots with countries the kid knew in the check', () => {
    const { extras, repeats } = sessionExtras(c('fr'), c('jp', 'ca', 'br'));
    expect(codes(extras)).toEqual(['fr', 'jp']);
    expect(codes(repeats)).toEqual(['jp']);
  });

  it('adds up to MAX_EXTRAS repeats when there are no reviews', () => {
    const { extras, repeats } = sessionExtras([], c('jp', 'ca', 'br'));
    expect(extras).toHaveLength(MAX_EXTRAS);
    expect(repeats).toEqual(extras);
  });

  it('keeps every review and adds no repeats when reviews fill the spots', () => {
    const { extras, repeats } = sessionExtras(c('fr', 'de', 'it'), c('jp'));
    expect(codes(extras)).toEqual(['fr', 'de', 'it']);
    expect(repeats).toEqual([]);
  });

  it('never repeats a country that is already a review', () => {
    const { repeats } = sessionExtras(c('jp'), c('jp', 'ca'));
    expect(codes(repeats)).toEqual(['ca']);
  });
});

describe('buildQuestions', () => {
  it('asks every country to pick its flag first, then to find it from the flag', () => {
    const qs = buildQuestions(c('am', 'jp', 'ca'));
    expect(qs).toHaveLength(6);
    expect(qs.slice(0, 3).every(q => q.kind === 'pick')).toBe(true);
    expect(qs.slice(3).every(q => q.kind === 'flag')).toBe(true);
    expect(new Set(qs.slice(0, 3).map(q => q.target.code))).toEqual(new Set(['am', 'jp', 'ca']));
    expect(new Set(qs.slice(3).map(q => q.target.code))).toEqual(new Set(['am', 'jp', 'ca']));
  });

  it('has nothing to ask for no countries', () => {
    expect(buildQuestions([])).toEqual([]);
  });
});

describe('levelAfter', () => {
  it('drops any miss to Met', () => {
    expect(levelAfter(3, 'flag', false)).toBe(1);
    expect(levelAfter(2, 'pick', false, true)).toBe(1);
  });

  it('keeps a new country at Met after picking its flag', () => {
    expect(levelAfter(1, 'pick', true)).toBe(1);
  });

  it('makes a country Known when found from its flag alone', () => {
    expect(levelAfter(1, 'flag', true)).toBe(2);
    expect(levelAfter(3, 'flag', true)).toBe(3);
  });

  it('makes a Known country Mastered when its flag is picked', () => {
    expect(levelAfter(2, 'pick', true)).toBe(3);
  });

  it("doesn't change a repeat's level on a right answer", () => {
    expect(levelAfter(2, 'pick', true, true)).toBe(2);
    expect(levelAfter(2, 'flag', true, true)).toBe(2);
  });
});

describe('shuffle', () => {
  it('keeps every item and leaves the input alone', () => {
    const items = [1, 2, 3, 4];
    const out = shuffle(items, () => 0);
    expect([...out].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4]);
  });
});
