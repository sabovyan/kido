// Pure session logic for Learn (Learn.tsx): who joins a session, what gets asked on the map,
// and how answers change a country's sticker level (0 new, 1 met, 2 known, 3 mastered).

// How a country is asked: find it with its name shown, find it from its flag only,
// or pick its flag while the country is highlighted.
export type Kind = 'name' | 'flag' | 'pick';
export type Asked<T> = { target: T; kind: Kind; retry?: boolean };

// Countries that join a session besides the new ones, unless there are more reviews than this.
export const MAX_EXTRAS = 2;

export function shuffle<T>(items: T[], random = Math.random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Reviews first, then countries the kid knew in the quick check as repeats, until there
// are MAX_EXTRAS. Repeats skip meeting and building; they only play the memory game and the map.
export function sessionExtras<T extends { code: string }>(reviews: T[], knew: T[]) {
  const room = Math.max(0, MAX_EXTRAS - reviews.length);
  const repeats = knew.filter(k => !reviews.some(r => r.code === k.code)).slice(0, room);
  return { extras: [...reviews, ...repeats], repeats };
}

// Every country is asked twice on the map: first pick its flag while it's lit up,
// then find it from the flag only.
export function buildQuestions<T>(targets: T[], random = Math.random): Asked<T>[] {
  const first = shuffle(targets.map((target): Asked<T> => ({ target, kind: 'pick' })), random);
  const second = shuffle(targets.map((target): Asked<T> => ({ target, kind: 'flag' })), random);
  return [...first, ...second];
}

// A repeat is practice only: a right answer keeps its level, a miss still drops it to Met.
export function levelAfter(level: number, kind: Kind, ok: boolean, repeat = false) {
  if (!ok) return 1;
  if (repeat) return level;
  if (kind === 'name') return Math.max(level, 1);
  if (kind === 'flag') return Math.max(level, 2);
  // Picking the flag is the easy step for a new country; for a known one it means mastered.
  return level >= 2 ? 3 : Math.max(level, 1);
}
