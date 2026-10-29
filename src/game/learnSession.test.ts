import { describe, expect, it } from 'vitest';
import {
  addDays,
  buildQuestions,
  type Card,
  dueTargets,
  levelAfter,
  MAX_EXTRAS,
  pickSession,
  readProgress,
  schedule,
  SESSION_MAX,
  sessionExtras,
  shuffle,
} from './learnSession';

const c = (...codes: string[]) => codes.map(code => ({ code }));
const codes = (items: { code: string }[]) => items.map(i => i.code);
// Tuesday 29 October 2026, 6 pm local time.
const NOW = new Date(2026, 9, 29, 18).getTime();
const day = (d: number) => new Date(2026, 9, d).getTime();

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

describe('addDays', () => {
  it('lands on midnight of the day', () => {
    expect(addDays(NOW, 1)).toBe(day(30));
    expect(addDays(NOW, 7)).toBe(new Date(2026, 10, 5).getTime());
  });
});

describe('readProgress', () => {
  it('turns an old bare level into a card that is due now', () => {
    expect(readProgress({ fr: 2, jp: 3 }, NOW)).toEqual({
      fr: { level: 2, lastSeen: NOW, due: NOW },
      jp: { level: 3, lastSeen: NOW, due: NOW },
    });
  });

  it('keeps cards as they are', () => {
    const fr: Card = { level: 2, lastSeen: day(20), due: day(23) };
    expect(readProgress({ fr }, NOW)).toEqual({ fr });
  });

  it('drops new countries and anything it cannot read', () => {
    expect(readProgress({ fr: 0, jp: 'x', ca: null, br: {} }, NOW)).toEqual({});
    expect(readProgress(null, NOW)).toEqual({});
    expect(readProgress(4, NOW)).toEqual({});
  });
});

describe('schedule', () => {
  it('brings a met country back the next day', () => {
    expect(schedule(undefined, 1, true, NOW)).toEqual({ level: 1, lastSeen: NOW, due: day(30) });
  });

  it('waits the new level\'s interval after a level up', () => {
    const met: Card = { level: 1, lastSeen: NOW, due: day(30) };
    expect(schedule(met, 2, true, NOW).due).toBe(addDays(NOW, 3));
    const known: Card = { level: 2, lastSeen: day(26), due: day(29) };
    expect(schedule(known, 3, true, NOW).due).toBe(addDays(NOW, 7));
  });

  it('waits 21 days when a due Mastered country is right again', () => {
    const mastered: Card = { level: 3, lastSeen: day(22), due: day(29) };
    expect(schedule(mastered, 3, true, NOW)).toEqual({ level: 3, lastSeen: NOW, due: addDays(NOW, 21) });
  });

  it('waits its level\'s interval when a due country stays at its level', () => {
    const met: Card = { level: 1, lastSeen: day(28), due: day(29) };
    expect(schedule(met, 1, true, NOW).due).toBe(day(30));
  });

  it('keeps the date of a country that is not due yet', () => {
    const mastered: Card = { level: 3, lastSeen: NOW, due: addDays(NOW, 7) };
    expect(schedule(mastered, 3, true, NOW + 1000)).toEqual({ level: 3, lastSeen: NOW + 1000, due: addDays(NOW, 7) });
  });

  it('makes a miss due now', () => {
    const mastered: Card = { level: 3, lastSeen: day(1), due: addDays(NOW, 10) };
    expect(schedule(mastered, 1, false, NOW)).toEqual({ level: 1, lastSeen: NOW, due: NOW });
  });
});

describe('dueTargets', () => {
  it('takes due countries of any level, most overdue first', () => {
    const progress = {
      fr: { level: 1, lastSeen: day(27), due: day(28) },
      jp: { level: 3, lastSeen: day(1), due: day(8) },
      ca: { level: 2, lastSeen: NOW, due: addDays(NOW, 3) },
      br: { level: 2, lastSeen: day(26), due: day(29) },
    };
    expect(codes(dueTargets(c('fr', 'jp', 'ca', 'br', 'am'), progress, NOW))).toEqual(['jp', 'fr', 'br']);
  });

  it('brings a Mastered country back once its 7 days are up', () => {
    const progress = { jp: schedule({ level: 2, lastSeen: NOW, due: NOW }, 3, true, NOW) };
    expect(dueTargets(c('jp'), progress, addDays(NOW, 6))).toEqual([]);
    expect(codes(dueTargets(c('jp'), progress, addDays(NOW, 7)))).toEqual(['jp']);
  });
});

describe('pickSession', () => {
  const fresh = c('n1', 'n2', 'n3', 'n4', 'n5');

  it('takes 4 new countries when nothing is due', () => {
    const { fresh: f, reviews } = pickSession([], fresh);
    expect(codes(f)).toEqual(['n1', 'n2', 'n3', 'n4']);
    expect(reviews).toEqual([]);
  });

  it('adds due countries first and fits them in the session', () => {
    const { fresh: f, reviews } = pickSession(c('d1', 'd2', 'd3'), fresh);
    expect(codes(reviews)).toEqual(['d1', 'd2', 'd3']);
    expect(codes(f)).toEqual(['n1', 'n2', 'n3']);
  });

  it('takes fewer new countries when many are due, and the rest wait', () => {
    const { fresh: f, reviews } = pickSession(c('d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'), fresh);
    expect(f).toHaveLength(2);
    expect(codes(reviews)).toEqual(['d1', 'd2', 'd3', 'd4']);
  });

  it('fills the session with reviews when there are no new countries', () => {
    const { fresh: f, reviews } = pickSession(c('d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'), []);
    expect(f).toEqual([]);
    expect(reviews).toHaveLength(SESSION_MAX);
  });
});
