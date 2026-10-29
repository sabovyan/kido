// Pure session logic for Learn (Learn.tsx): who joins a session, what gets asked on the map,
// how answers change a country's sticker level (0 new, 1 met, 2 known, 3 mastered),
// and when each country comes back.

// How a country is asked: find it with its name shown, find it from its flag only,
// or pick its flag while the country is highlighted.
export type Kind = 'name' | 'flag' | 'pick';
export type Asked<T> = { target: T; kind: Kind; retry?: boolean };

// Countries that join a session besides the new ones, unless there are more reviews than this.
export const MAX_EXTRAS = 2;
// New countries per session, at most.
export const BATCH = 4;
// The memory game takes up to 6 countries, so new ones plus reviews stay within this.
export const SESSION_MAX = 6;
// New countries a session keeps room for, however many reviews are due.
const MIN_NEW = 2;

// Days until a country comes back, by the level it just reached. A right answer while it
// was already Mastered waits the last one.
export const INTERVAL_DAYS = [0, 1, 3, 7, 21];

// A country's sticker level, when it was last answered and when it's due again (ms).
export type Card = { level: number; lastSeen: number; due: number };
export type Progress = Record<string, Card>;

export const levelOf = (progress: Progress, code: string) => progress[code]?.level ?? 0;

// Midnight at the start of the day `days` after `now`, so a country met in the evening
// is ready the next morning.
export function addDays(now: number, days: number) {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days).getTime();
}

// Saves used to keep a bare level per code: those become cards that are due now.
export function readProgress(saved: unknown, now: number): Progress {
  if (!saved || typeof saved !== 'object') return {};
  const progress: Progress = {};
  for (const [code, value] of Object.entries(saved)) {
    if (typeof value === 'number') {
      if (value > 0) progress[code] = { level: value, lastSeen: now, due: now };
    } else if (value && typeof value.level === 'number' && typeof value.due === 'number') {
      progress[code] = { level: value.level, lastSeen: value.lastSeen ?? value.due, due: value.due };
    }
  }
  return progress;
}

// The card after an answer that leaves the country at `level`. A miss is due now. A level up
// waits that level's interval; so does a right answer on a due country. A right answer on one
// that isn't due yet (asked again in the same session) keeps its date.
export function schedule(card: Card | undefined, level: number, ok: boolean, now: number): Card {
  const before = card?.level ?? 0;
  if (!ok) return { level, lastSeen: now, due: now };
  if (level > before) return { level, lastSeen: now, due: addDays(now, INTERVAL_DAYS[level]) };
  if (card && card.due <= now) {
    const days = before === 3 && level === 3 ? INTERVAL_DAYS[4] : INTERVAL_DAYS[level];
    return { level, lastSeen: now, due: addDays(now, days) };
  }
  return { level, lastSeen: now, due: card?.due ?? now };
}

// Countries met before that are due, most overdue first (learn order on a tie).
export function dueTargets<T extends { code: string }>(order: T[], progress: Progress, now: number) {
  return order
    .filter(t => levelOf(progress, t.code) > 0 && progress[t.code].due <= now)
    .sort((a, b) => progress[a.code].due - progress[b.code].due);
}

// Due reviews first, then new countries, SESSION_MAX in all. The more are due, the fewer new
// ones join (never fewer than MIN_NEW while there are any); due ones that don't fit wait.
export function pickSession<T>(due: T[], fresh: T[]) {
  const newCount = Math.min(fresh.length, BATCH, Math.max(MIN_NEW, SESSION_MAX - due.length));
  return { fresh: fresh.slice(0, newCount), reviews: due.slice(0, SESSION_MAX - newCount) };
}

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

// A miss in Flag Hunt counts like a Learn miss: a country met before drops to Met and is due
// now. New ones stay new, so Learn still meets them first. Right answers change nothing: one
// lucky tap in a game shouldn't skip meeting a country.
export function huntMiss(progress: Progress, code: string, now: number): Progress {
  const level = levelOf(progress, code);
  if (!level) return progress;
  return { ...progress, [code]: schedule(progress[code], levelAfter(level, 'flag', false), false, now) };
}

// The `codes` search param ("fr,de"): lowercase flag codes, each once, in order.
export function parseCodes(param: unknown) {
  if (typeof param !== 'string') return [];
  const codes = param.toLowerCase().split(',').map(c => c.trim()).filter(c => /^[a-z]{2}(-[a-z]+)?$/.test(c));
  return [...new Set(codes)];
}

// The countries with these codes, in the codes' order, SESSION_MAX at most (the memory game's limit).
export function pickCodes<T extends { code: string }>(items: T[], codes: string[]) {
  return codes.flatMap(code => items.filter(t => t.code === code)).slice(0, SESSION_MAX);
}

// Saved progress, shared by Learn and Flag Hunt.
const STORAGE_KEY = 'flag-map:learn';

export function loadProgress(): Progress {
  try {
    return readProgress(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'), Date.now());
  } catch {
    return {};
  }
}

export function saveProgress(progress: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage blocked: progress lasts for this visit only.
  }
}
