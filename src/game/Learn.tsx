import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import * as d3 from 'd3';
import type { Polygon } from 'geojson';
import { flagUrl, loadUserCountry, loadWorld, type Country, type World } from '../countries';
import { SoundToggle } from '../SoundToggle';
import { speak } from '../speech';
import type { Focus } from './board';
import { FlagJigsaw } from './FlagJigsaw';
import { FlatBoard } from './FlatBoard';
import { GlobeBoard } from './GlobeBoard';
import { type Asked, buildQuestions, levelAfter, sessionExtras, shuffle } from './learnSession';
import { MemoryMatch } from './MemoryMatch';
import type { Paint } from './painter';
import { FLAG_RECOGNITION } from './recognition';

// Each new country: meet it on the map, then build its flag. Then a memory game with every
// country in the session, then practice on the map.
type Phase = 'start' | 'check' | 'meet' | 'build' | 'match' | 'practice' | 'done';
type Feedback = { tone: 'correct' | 'oops' | 'hint'; title: string; detail: string };
// Sticker level per flag code: 0 new, 1 met, 2 known, 3 mastered.
type Progress = Record<string, number>;
export type LearnView = 'map' | 'globe';

type Target = {
  code: string;
  name: string;
  features: Country[];
  center: [number, number];
  area: number;
};

type Question = Asked<Target>;

const BATCH = 4;
const REVIEWS = 2;
// The quick check keeps asking new flags until BATCH are unknown, up to this many.
const MAX_CHECKS = 8;
const STORAGE_KEY = 'flag-map:learn';
// ~5,000 km², in steradians. Same cut as Flag Hunt's Easy mode.
const EASY_MIN_AREA = 5_000 / 40_589_000;

const LEVELS = [
  { label: 'New', tint: 'bg-surface-sunk text-fg' },
  { label: 'Met', tint: 'bg-tint-hint text-on-tint-hint' },
  { label: 'Known', tint: 'bg-tint-correct text-on-tint-correct' },
  { label: 'Mastered', tint: 'bg-tint-reward text-on-tint-reward' },
];

// Territories whose clicks count for their sovereign country's flag.
const SOVEREIGN: Record<string, string> = { gl: 'dk' };
const sovereignOf = (code: string | null) => (code && SOVEREIGN[code]) ?? code;

function largestPolygon(f: Country): Polygon {
  if (f.geometry.type === 'Polygon') return f.geometry;
  let best: Polygon = { type: 'Polygon', coordinates: f.geometry.coordinates[0] };
  for (const coords of f.geometry.coordinates) {
    const poly: Polygon = { type: 'Polygon', coordinates: coords };
    if (d3.geoArea(poly) > d3.geoArea(best)) best = poly;
  }
  return best;
}

// Groups features by flag code, like Flag Hunt does.
function buildTargets(world: World) {
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

// Flag Hunt's Easy, Medium, Hard pools in that order.
function chapterOf(t: Target) {
  const known = FLAG_RECOGNITION[t.code] ?? 0;
  if (known >= 75 && t.area >= EASY_MIN_AREA) return 0;
  return known >= 60 ? 1 : 2;
}

// The player's own country first, then Easy → Medium → Hard, best-known flags first.
function learnOrder(targets: Target[], homeCode: string | null) {
  return [...targets].sort((a, b) =>
    Number(b.code === homeCode) - Number(a.code === homeCode)
    || chapterOf(a) - chapterOf(b)
    || (FLAG_RECOGNITION[b.code] ?? 0) - (FLAG_RECOGNITION[a.code] ?? 0)
    || b.area - a.area);
}

// The next new countries, plus a few met ones that need practice (lowest level first).
function nextBatch(order: Target[], progress: Progress) {
  const fresh = order.filter(t => !progress[t.code]).slice(0, BATCH);
  const review = order
    .filter(t => (progress[t.code] ?? 0) > 0 && progress[t.code] < 3)
    .sort((a, b) => progress[a.code] - progress[b.code])
    .slice(0, fresh.length ? REVIEWS : BATCH + REVIEWS);
  return { fresh, review };
}

// Two other flags from countries of about the same fame.
function flagChoices(order: Target[], target: Target) {
  // By code: `order` is rebuilt when the home country loads, so the objects can differ.
  const i = order.findIndex(t => t.code === target.code);
  const near = order.slice(Math.max(0, i - 12), i + 13).filter(t => t.code !== target.code);
  return shuffle([target, ...shuffle(near).slice(0, 2)]);
}

// Known countries show their flags; the ones being learned stay blank until found.
function knownPaints(order: Target[], progress: Progress, skip: Set<string>) {
  const paints = new Map<Country, Paint>();
  for (const t of order) {
    if (skip.has(t.code) || (progress[t.code] ?? 0) < 2) continue;
    for (const f of t.features) paints.set(f, 'flag');
  }
  return paints;
}

function loadProgress(): Progress {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage blocked: progress lasts for this visit only.
  }
}

const countries = (n: number) => (n === 1 ? 'country' : 'countries');

function withPaint(paints: Map<Country, Paint>, features: Country[], paint: Paint | null) {
  const next = new Map(paints);
  for (const f of features) {
    if (paint) next.set(f, paint);
    else next.delete(f);
  }
  return next;
}

const BUTTON = 'inline-flex h-tap-main items-center gap-2.5 rounded-md border-3 border-outline px-7 font-display text-title-2 no-underline shadow-drop-md transition-transform duration-(--dur-tap) hover:-translate-y-0.5 active:translate-y-[5px] active:shadow-none motion-reduce:transition-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500 max-md:box-border max-md:w-full max-md:justify-center';
const MAIN_BUTTON = `${BUTTON} cursor-pointer bg-sun-400 text-on-sun active:bg-sun-600`;
const OTHER_BUTTON = `${BUTTON} bg-surface text-fg`;
const CARD_BUTTON = 'inline-flex h-tap-min shrink-0 cursor-pointer items-center gap-2 rounded-md border-3 border-outline px-5 font-display text-title-3 shadow-drop-sm transition-transform duration-(--dur-tap) active:translate-y-1 active:shadow-none motion-reduce:transition-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500 disabled:cursor-default disabled:border-dashed disabled:bg-surface-sunk disabled:text-fg-muted disabled:shadow-none max-md:box-border max-md:w-full max-md:justify-center';
const NEXT_BUTTON = `${CARD_BUTTON} bg-ocean-500 text-on-ocean active:bg-ocean-700`;
const SKIP_BUTTON = `${CARD_BUTTON} bg-surface text-fg`;
const FLAG_CHOICE = 'grid cursor-pointer place-items-center rounded-md border-3 border-outline bg-surface p-2 shadow-drop-md transition-transform duration-(--dur-tap) hover:-translate-y-0.5 active:translate-y-[5px] active:shadow-none motion-reduce:transition-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500 disabled:cursor-default disabled:shadow-none disabled:hover:translate-y-0';
const CARD = 'flex items-center gap-4 rounded-lg border-3 border-outline bg-surface px-[18px] py-3.5 shadow-drop-lg';
const CHIP = 'flex h-tap-min items-center gap-2 rounded-pill border-3 px-4';
const FLAG_IMG = 'block h-16 w-24 shrink-0 rounded-sm border-3 border-outline object-cover';

const TONES = {
  correct: { box: 'bg-tint-correct text-on-tint-correct', badge: 'border-on-leaf bg-leaf-500 text-on-leaf' },
  oops: { box: 'bg-tint-oops text-on-tint-oops', badge: 'border-on-coral bg-coral-500 text-on-coral' },
  hint: { box: 'bg-tint-hint text-on-tint-hint', badge: 'border-on-sun bg-sun-400 text-on-sun' },
};

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function StarIcon({ size = 24 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" strokeWidth="2.5" strokeLinejoin="round" className="fill-sun-400 stroke-on-sun">
      <path d="M12 3l2.7 5.6 6.1.8-4.4 4.2 1.1 6.1L12 16.8l-5.5 2.9 1.1-6.1-4.4-4.2 6.1-.8z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function BulbIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z" />
    </svg>
  );
}

// The progress chip's word for each step of a session.
const STEP_LABELS: Partial<Record<Phase, string>> = { check: 'Check', meet: 'Meet', build: 'Build', match: 'Match', practice: 'Practice' };

const TONE_ICONS ={ correct: <CheckIcon />, oops: <XIcon />, hint: <BulbIcon /> };

function LevelChip({ level }: { level: number }) {
  const { label, tint } = LEVELS[level] ?? LEVELS[0];
  return (
    <span className={`inline-flex items-center gap-1 rounded-pill border-2 border-outline px-3 py-1 text-caption ${tint}`}>
      {level === 3 && <StarIcon size={16} />}
      {label}
    </span>
  );
}

export function Learn({ view, viewSwitch }: { view: LearnView; viewSwitch?: ReactNode }) {
  const [world, setWorld] = useState<World | null>(null);
  const [homeCode, setHomeCode] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>({});

  const [phase, setPhase] = useState<Phase>('start');
  // Quick check: new countries in order, how many of them get asked, and the answers so far.
  const [candidates, setCandidates] = useState<Target[]>([]);
  const [checkCount, setCheckCount] = useState(0);
  const [checkIndex, setCheckIndex] = useState(0);
  const [unknown, setUnknown] = useState<Target[]>([]);
  const [knew, setKnew] = useState<Target[]>([]);
  const [review, setReview] = useState<Target[]>([]);
  const [fresh, setFresh] = useState<Target[]>([]);
  const [session, setSession] = useState<Target[]>([]);
  // Codes of countries the kid knew in the check that join just to repeat them.
  const [repeats, setRepeats] = useState<Set<string>>(new Set());
  const [meetIndex, setMeetIndex] = useState(0);
  const [matches, setMatches] = useState(0);
  // Bumped each session so the memory game deals new cards.
  const [round, setRound] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [paints, setPaints] = useState<Map<Country, Paint>>(new Map());
  const [focus, setFocus] = useState<Focus | null>(null);
  const timer = useRef<number>(undefined);

  useEffect(() => {
    let cancelled = false;
    setProgress(loadProgress());
    loadWorld().then(w => {
      if (!cancelled) setWorld(w);
    });
    loadUserCountry().then(code => {
      if (!cancelled) setHomeCode(sovereignOf(code));
    });
    return () => { cancelled = true; window.clearTimeout(timer.current); };
  }, []);

  const order = useMemo(() => (world ? learnOrder(buildTargets(world), homeCode) : []), [world, homeCode]);
  const batch = useMemo(() => nextBatch(order, progress), [order, progress]);
  const counts = useMemo(() => {
    const c = [0, 0, 0, 0];
    for (const t of order) c[progress[t.code] ?? 0]++;
    return c;
  }, [order, progress]);

  const question = phase === 'practice' ? questions[index] : undefined;
  const choices = useMemo(() => (question?.kind === 'pick' ? flagChoices(order, question.target) : []), [order, question]);
  const board = view === 'globe' ? 'globe' : 'map';

  // Between sessions the map shows every known flag.
  useEffect(() => {
    if (phase === 'start') setPaints(knownPaints(order, progress, new Set()));
  }, [phase, order, progress]);

  // A pick question lights its country up and turns to it.
  useEffect(() => {
    if (question?.kind !== 'pick') return;
    const { target } = question;
    setPaints(p => withPaint(p, target.features, 'answer'));
    setFocus({ lonLat: target.center, features: target.features, id: Date.now() });
  }, [question]);

  // Functional, so a level set from a timer doesn't drop one set just before.
  const setLevel = (code: string, level: number) => {
    setProgress(p => {
      const next = { ...p, [code]: level };
      saveProgress(next);
      return next;
    });
  };

  const meet = (i: number, batchFresh: Target[]) => {
    const t = batchFresh[i];
    setMeetIndex(i);
    setFeedback(null);
    setPaints(p => withPaint(p, t.features, 'flag'));
    setFocus({ lonLat: t.center, features: t.features, id: Date.now() });
    speak(t.name);
  };

  // The countries being practiced go blank so their flags don't give them away.
  const startPractice = (sessionTargets: Target[]) => {
    setPaints(p => withPaint(p, sessionTargets.flatMap(t => t.features), null));
    setFeedback(null);
    setIndex(0);
    setPhase('practice');
  };

  // The memory game needs at least 2 countries.
  const afterBuilding = (sessionTargets: Target[]) => {
    setFeedback(null);
    if (sessionTargets.length >= 2) setPhase('match');
    else startPractice(sessionTargets);
  };

  // After the check: meet and build what the kid didn't know; reviews and a few countries
  // they knew join for the memory game and the map.
  const beginLearning = (missed: Target[], reviews: Target[], known: Target[]) => {
    const { extras, repeats: again } = sessionExtras(reviews, known);
    const all = [...missed, ...extras];
    setFresh(missed);
    setSession(all);
    setRepeats(new Set(again.map(t => t.code)));
    setQuestions(buildQuestions(all));
    setMatches(0);
    setRound(r => r + 1);
    if (missed.length) {
      setPhase('meet');
      meet(0, missed);
    } else if (all.length) {
      afterBuilding(all);
    } else {
      setPhase('done');
    }
  };

  const start = () => {
    const { fresh: f, review: r } = batch;
    if (!f.length && !r.length) return;
    window.clearTimeout(timer.current);
    setFeedback(null);
    setReview(r);
    setKnew([]);
    setUnknown([]);
    if (!f.length) {
      beginLearning([], r, []);
      return;
    }
    const pool = order.filter(t => !progress[t.code]);
    setCandidates(pool);
    setCheckCount(Math.min(BATCH, pool.length));
    setCheckIndex(0);
    setPaints(knownPaints(order, progress, new Set(r.map(t => t.code))));
    setPhase('check');
  };

  // A flag the kid already knows becomes Known and the check asks one more;
  // an unknown one is kept for the meet step. No penalty either way.
  const answerCheck = (ok: boolean, miss?: Feedback) => {
    const t = candidates[checkIndex];
    const missed = ok ? unknown : [...unknown, t];
    const known = ok ? [...knew, t] : knew;
    const count = ok ? Math.min(checkCount + 1, MAX_CHECKS, candidates.length) : checkCount;
    if (ok) {
      setLevel(t.code, 2);
      setKnew(known);
      setPaints(p => withPaint(p, t.features, 'flag'));
    }
    setUnknown(missed);
    setCheckCount(count);
    setFeedback(ok ? { tone: 'correct', title: `Yes! You know ${t.name}`, detail: 'No need to learn it again.' } : (miss ?? null));
    timer.current = window.setTimeout(() => {
      setFeedback(null);
      if (missed.length >= BATCH || checkIndex + 1 >= count) beginLearning(missed, review, known);
      else setCheckIndex(checkIndex + 1);
    }, ok ? 1200 : 1500);
  };

  // Met: on to building its flag.
  const nextMeet = () => {
    window.clearTimeout(timer.current);
    const t = fresh[meetIndex];
    setLevel(t.code, Math.max(progress[t.code] ?? 0, 1));
    setFeedback(null);
    setPhase('build');
  };

  // Flag built: say its name, give it a moment, then meet the next country.
  const builtFlag = () => {
    speak(fresh[meetIndex].name);
    timer.current = window.setTimeout(() => {
      if (meetIndex + 1 < fresh.length) {
        setPhase('meet');
        meet(meetIndex + 1, fresh);
      } else {
        afterBuilding(session);
      }
    }, 1200);
  };

  const matched = (code: string) => {
    const t = session.find(s => s.code === code);
    if (t) speak(t.name);
    setMatches(m => m + 1);
  };

  // Moves on; a country that will be asked again goes blank so its flag doesn't give it away.
  const nextQuestion = (qs: Question[], clear: Target | null) => {
    setFeedback(null);
    if (clear) setPaints(p => withPaint(p, clear.features, null));
    if (index + 1 >= qs.length) setPhase('done');
    else setIndex(index + 1);
  };

  const answer = (ok: boolean, wrongName: string, clicked?: Country) => {
    if (!question) return;
    const { target: t, kind } = question;
    const before = progress[t.code] ?? 0;
    const level = levelAfter(before, kind, ok, repeats.has(t.code));
    setLevel(t.code, level);

    if (ok) {
      const askedAgain = questions.slice(index + 1).some(q => q.target === t);
      setPaints(p => withPaint(p, t.features, 'flag'));
      setFeedback({
        tone: 'correct',
        title: `Yes! ${t.name}`,
        detail: level > before && level >= 2 ? `${t.name} is now ${LEVELS[level].label}!` : 'Flag painted.',
      });
      timer.current = window.setTimeout(() => nextQuestion(questions, askedAgain ? t : null), 1200);
      return;
    }

    // A miss shows the right answer, then asks the same thing again later.
    const qs = question.retry ? questions : [...questions, { ...question, retry: true }];
    setQuestions(qs);
    const clickedBefore = clicked ? (paints.get(clicked) ?? null) : null;
    setPaints(p => {
      const shown = clicked ? withPaint(p, [clicked], 'wrong') : p;
      return withPaint(shown, t.features, kind === 'pick' ? 'flag' : 'answer');
    });
    setFocus({ lonLat: t.center, features: t.features, id: Date.now() });
    setFeedback({
      tone: 'oops',
      title: kind === 'pick' ? `Oops, that's the flag of ${wrongName}` : `Oops, that's ${wrongName}`,
      detail: kind === 'pick'
        ? `This is ${t.name}. Look at its flag! We'll try again soon.`
        : `${t.name} is the yellow one. We'll try again soon.`,
    });
    timer.current = window.setTimeout(() => {
      if (clicked) setPaints(p => withPaint(p, [clicked], clickedBefore));
      nextQuestion(qs, t);
    }, 2800);
  };

  const onPick = (clicked: Country) => {
    const code = sovereignOf(clicked.properties.code);

    if (phase === 'check') {
      if (feedback) return;
      if (code === candidates[checkIndex].code) answerCheck(true);
      else answerCheck(false, { tone: 'hint', title: `That's ${clicked.properties.name}`, detail: "No problem, let's meet this one!" });
      return;
    }

    if (feedback && feedback.tone !== 'hint') return;

    if (phase === 'meet') {
      const t = fresh[meetIndex];
      window.clearTimeout(timer.current);
      if (code === t.code) {
        setFeedback({ tone: 'correct', title: `Hi, ${t.name}!`, detail: 'Nice to meet you.' });
        timer.current = window.setTimeout(nextMeet, 1000);
      } else {
        setFeedback({ tone: 'hint', title: `That's ${clicked.properties.name}`, detail: `${t.name} is the one with its flag on.` });
        timer.current = window.setTimeout(() => setFeedback(null), 2000);
      }
      return;
    }

    if (!question || question.kind === 'pick') return;
    answer(code === question.target.code, clicked.properties.name, clicked);
  };

  const stop = () => {
    window.clearTimeout(timer.current);
    setFeedback(null);
    setPhase('start');
  };

  const stepLabel = STEP_LABELS[phase];
  const inSession = stepLabel !== undefined;
  // Meet and build go one new country at a time.
  const perCountry = phase === 'meet' || phase === 'build';
  const step = phase === 'check' ? checkIndex + 1 : perCountry ? meetIndex + 1 : phase === 'match' ? matches : index + 1;
  const steps = phase === 'check' ? checkCount : perCountry ? fresh.length : phase === 'match' ? session.length : questions.length;
  const checking = phase === 'check' ? candidates[checkIndex] : undefined;
  const meeting = phase === 'meet' ? fresh[meetIndex] : undefined;
  const hasNext = batch.fresh.length + batch.review.length > 0;

  return (
    // `[&_canvas]` aims the globe's three.js canvas, which the board renders itself.
    // `data-game-active` hides the app's top bar and tab bar on phones during a session.
    <div data-game-active={inSession ? '' : undefined} className={`relative h-full font-body text-fg [&_canvas]:cursor-crosshair ${view === 'globe' ? 'bg-backdrop' : 'bg-map-sea'}`}>
      {inSession && (
        // Above the build and match overlays, so Stop and the sound switch stay in reach.
        <div className="absolute top-4 right-4 z-3 flex items-center gap-3 max-md:top-3 max-md:right-3 max-md:left-3">
          <button type="button" aria-label="Stop learning" onClick={stop} className="grid size-tap-icon shrink-0 cursor-pointer place-items-center rounded-md border-3 border-outline bg-surface p-0 text-fg shadow-drop-sm transition-transform duration-(--dur-tap) active:translate-y-1 active:shadow-none motion-reduce:transition-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500 md:order-last">
            <XIcon />
          </button>
          <SoundToggle />
          <div className={`${CHIP} border-outline bg-surface text-label tabular-nums md:order-first max-md:h-tap-icon max-md:min-w-0 max-md:flex-1 max-md:box-border max-md:shadow-drop-sm`}>
            <span className="shrink-0">{stepLabel} {step} / {steps}</span>
            <span className="block h-3 w-20 overflow-hidden rounded-pill border-2 border-outline bg-surface-sunk max-md:w-auto max-md:flex-1">
              <span className="block h-full bg-leaf-500 transition-[width] duration-(--dur-pop) motion-reduce:transition-none" style={{ width: `${(step / steps) * 100}%` }} />
            </span>
          </div>
        </div>
      )}

      {world && (view === 'globe'
        ? <GlobeBoard world={world} paints={paints} focus={focus} onPick={onPick} />
        : <FlatBoard world={world} paints={paints} focus={focus} onPick={onPick} />)}

      {inSession && (
        <div className="absolute bottom-6 left-1/2 flex w-[560px] max-w-[calc(100%-32px)] -translate-x-1/2 flex-col gap-3 max-md:right-3 max-md:bottom-[max(16px,env(safe-area-inset-bottom))] max-md:left-3 max-md:w-auto max-md:max-w-none max-md:translate-x-0">
          {feedback && (
            <output className={`flex items-center gap-3 rounded-md border-3 border-outline px-4 py-3 shadow-drop-sm ${TONES[feedback.tone].box}`}>
              <span className={`grid size-10 shrink-0 place-items-center rounded-pill border-3 ${TONES[feedback.tone].badge}`}>
                {TONE_ICONS[feedback.tone]}
              </span>
              <span className="flex flex-col">
                <span className="font-display text-title-3 font-extrabold">{feedback.title}</span>
                <span className="text-caption">{feedback.detail}</span>
              </span>
            </output>
          )}

          {checking && (
            <div className={`${CARD} max-md:flex-wrap`}>
              <img src={flagUrl(checking.code)} alt="Flag to find" className={FLAG_IMG} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-display text-title-2">Do you know this one?</span>
                <span className="text-body text-fg-muted">Tap its country on the {board}.</span>
              </span>
              <button type="button" className={SKIP_BUTTON} disabled={!!feedback} onClick={() => answerCheck(false, { tone: 'hint', title: 'No problem!', detail: "Let's meet this one." })}>
                Not yet
              </button>
            </div>
          )}

          {meeting && (
            <div className={`${CARD} max-md:flex-wrap`}>
              <img src={flagUrl(meeting.code)} alt={`Flag of ${meeting.name}`} className={FLAG_IMG} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-display text-title-2">This is {meeting.name}</span>
                <span className="text-body text-fg-muted">Tap it on the {board} to say hi.</span>
              </span>
              <button type="button" className={NEXT_BUTTON} disabled={feedback?.tone === 'correct'} onClick={nextMeet}>
                Next <ArrowRightIcon />
              </button>
            </div>
          )}

          {question && question.kind !== 'pick' && (
            <div className={CARD}>
              <img src={flagUrl(question.target.code)} alt="Flag to find" className={FLAG_IMG} />
              <span className="flex flex-col gap-0.5">
                <span className="font-display text-title-2">{question.kind === 'name' ? `Find ${question.target.name}` : 'Find this country'}</span>
                <span className="text-body text-fg-muted">{question.kind === 'name' ? `Tap it on the ${board}.` : 'No name this time!'}</span>
              </span>
            </div>
          )}

          {question?.kind === 'pick' && (
            <div className={`${CARD} flex-col items-stretch`}>
              <span className="flex flex-col gap-0.5">
                <span className="font-display text-title-2">Which flag is this country's?</span>
                <span className="text-body text-fg-muted">Look at the yellow country.</span>
              </span>
              <div className="grid grid-cols-3 gap-3">
                {choices.map(c => (
                  <button
                    type="button"
                    key={c.code}
                    aria-label={`Flag of ${c.name}`}
                    disabled={!!feedback}
                    onClick={() => answer(c.code === question.target.code, c.name)}
                    className={FLAG_CHOICE}
                  >
                    <img src={flagUrl(c.code)} alt="" className="block aspect-[3/2] w-full rounded-sm border-2 border-outline object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Build and match sit over the map; the top padding keeps them clear of the progress chip. */}
      {phase === 'build' && fresh[meetIndex] && (
        <div className="absolute inset-0 z-2 grid place-items-center overflow-y-auto bg-scrim p-4 pt-20 max-md:grid-cols-1">
          <div className="w-[480px] max-w-full">
            <FlagJigsaw key={fresh[meetIndex].code} code={fresh[meetIndex].code} name={fresh[meetIndex].name} onDone={builtFlag} />
          </div>
        </div>
      )}

      {phase === 'match' && (
        <div className="absolute inset-0 z-2 grid place-items-center overflow-y-auto bg-scrim p-4 pt-20 max-md:grid-cols-1">
          <section className="box-border flex w-[680px] max-w-full flex-col items-center gap-4 rounded-lg border-3 border-outline bg-surface p-5 text-fg shadow-drop-lg">
            <div className="flex flex-col gap-0.5 text-center">
              <h2 className="m-0 font-display text-title-2">Find the pairs</h2>
              <p className="m-0 text-body text-fg-muted">Match each flag with its country.</p>
            </div>
            <MemoryMatch key={round} countries={session} onMatch={matched} onDone={() => startPractice(session)} />
          </section>
        </div>
      )}

      {phase === 'start' && (
        <div className="absolute inset-0 z-2 grid place-items-center bg-scrim p-4 max-md:grid-cols-1">
          <section className="box-border flex w-[640px] max-w-full flex-col gap-[18px] rounded-lg border-3 border-outline bg-surface p-7 text-fg shadow-drop-lg max-md:max-h-full max-md:gap-4 max-md:overflow-y-auto max-md:p-5">
            <div className="flex flex-col gap-1.5 text-center">
              <h2 className="m-0 font-display text-title-1">Learn flags</h2>
              <p className="m-0 text-body-lg text-fg-muted">
                First a quick check. Then meet new flags, build them, play a memory game and find them on the {board}.
              </p>
              {!world && <p className="m-0 text-body text-fg-muted">Loading map…</p>}
            </div>
            {viewSwitch && (
              <div className="flex items-center justify-center gap-3 md:hidden">
                <span className="text-label">Learn on</span>
                {viewSwitch}
              </div>
            )}
            {world && (
              <div className="flex flex-wrap justify-center gap-2 tabular-nums">
                {LEVELS.slice(1).map((l, i) => (
                  <span key={l.label} className="inline-flex items-center gap-2">
                    <LevelChip level={i + 1} />
                    <span className="text-caption">{counts[i + 1]}</span>
                  </span>
                ))}
              </div>
            )}
            {batch.review.length > 0 && (
              <p className="m-0 text-center text-body text-fg-muted">
                {batch.fresh.length ? `Plus ${batch.review.length} to practice again.` : `Let's practice ${batch.review.length} you already met.`}
              </p>
            )}
            {world && !hasNext && (
              <p className="m-0 text-center text-body-lg">You know every flag. Amazing!</p>
            )}
            <div className="flex flex-wrap justify-center gap-3 max-md:flex-col">
              {hasNext && (
                <button type="button" disabled={!world} className={MAIN_BUTTON} onClick={start}>
                  {counts[1] + counts[2] + counts[3] ? 'Keep learning' : 'Start learning'} <ArrowRightIcon />
                </button>
              )}
              <Link to="/country/games" className={OTHER_BUTTON}>Play Flag Hunt</Link>
            </div>
          </section>
        </div>
      )}

      {phase === 'done' && (
        <div className="absolute inset-0 z-2 grid place-items-center bg-scrim p-4 max-md:grid-cols-1">
          <section className="box-border flex w-[560px] max-w-full flex-col gap-4 rounded-lg border-3 border-outline bg-surface p-7 text-center text-fg shadow-drop-lg max-h-full overflow-y-auto max-md:p-5">
            <div className="flex items-end justify-center gap-1.5">
              <StarIcon size={44} /><StarIcon size={60} /><StarIcon size={44} />
            </div>
            <h2 className="m-0 font-display text-title-1">Great job!</h2>
            <p className="m-0 text-body-lg">
              {knew.length > 0 && `You already knew ${knew.length}! `}
              {fresh.length ? `You met ${fresh.length} new ${countries(fresh.length)}.` : session.length ? `You practiced ${session.length} ${countries(session.length)}.` : ''}
            </p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-left">
              {/* Countries known in the check that also repeated are listed once. */}
              {[...knew.filter(k => !session.some(s => s.code === k.code)), ...session].map(t => (
                <li key={t.code} className="flex items-center gap-3 rounded-md border-3 border-outline bg-surface-sunk px-3 py-2">
                  <img src={flagUrl(t.code)} alt="" className="block h-10 w-15 shrink-0 rounded-sm border-2 border-outline object-cover" />
                  <span className="min-w-0 flex-1 text-body font-bold">{t.name}</span>
                  <LevelChip level={progress[t.code] ?? 0} />
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap justify-center gap-3 max-md:flex-col">
              {hasNext && (
                <button type="button" className={MAIN_BUTTON} onClick={start}>
                  Learn {batch.fresh.length || BATCH} more <ArrowRightIcon />
                </button>
              )}
              <Link to="/country/games" className={OTHER_BUTTON}>Play Flag Hunt</Link>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
