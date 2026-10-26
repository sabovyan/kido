import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Polygon } from 'geojson';
import { flagUrl, loadUserCountry, loadWorld, type Country, type World } from '../countries';
import type { Focus } from './board';
import { FlatBoard } from './FlatBoard';
import { GlobeBoard } from './GlobeBoard';
import type { Paint } from './painter';
import { FLAG_RECOGNITION } from './recognition';

type Phase = 'start' | 'playing' | 'feedback' | 'over';
type Mode = 'easy' | 'medium' | 'hard';
type Feedback = { ok: boolean; title: string; detail: string };
export type GameView = 'map' | 'globe';

type Target = {
  code: string;
  name: string;
  features: Country[];
  center: [number, number];
  area: number;
};

const LIVES = 3;
const EARTH_RADIUS_KM = 6371;
// ~5,000 km², in steradians. Keeps hard-to-click specks out of Easy.
const EASY_MIN_AREA = 5_000 / 40_589_000;

// `phone`: on phones Easy is the one main (sun) action and the others are plain rows.
const MODES: { mode: Mode; label: string; blurb: string; tint: string; phone: string; includes: (t: Target) => boolean }[] = [
  { mode: 'easy', label: 'Easy', blurb: 'Big countries, famous flags', tint: 'bg-tint-correct text-on-tint-correct', phone: 'max-md:border-on-sun max-md:bg-sun-400 max-md:text-on-sun', includes: t => (FLAG_RECOGNITION[t.code] ?? 0) >= 75 && t.area >= EASY_MIN_AREA },
  { mode: 'medium', label: 'Medium', blurb: 'More flags to spot', tint: 'bg-tint-hint text-on-tint-hint', phone: 'max-md:bg-surface max-md:text-fg', includes: t => (FLAG_RECOGNITION[t.code] ?? 0) >= 60 },
  { mode: 'hard', label: 'Hard', blurb: 'Every flag, tiny islands too', tint: 'bg-tint-oops text-on-tint-oops', phone: 'max-md:bg-surface max-md:text-fg', includes: () => true },
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

// Groups features by flag code; the biggest feature with that exact code names the
// country (e.g. "au" is Australia, not Ashmore and Cartier Is.; "dk" is Denmark, not Greenland).
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

function formatPercent(share: number) {
  const pct = share * 100;
  return `${pct.toFixed(pct > 0 && pct < 1 ? 2 : 1)}%`;
}

const BUTTON = 'inline-flex h-tap-main items-center gap-2.5 rounded-md border-3 border-outline px-7 font-display text-title-2 shadow-drop-md transition-transform duration-(--dur-tap) hover:-translate-y-0.5 active:translate-y-[5px] active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500 max-md:box-border max-md:w-full max-md:justify-center';
const MAIN_BUTTON = `${BUTTON} bg-sun-400 text-on-sun active:bg-sun-600`;
const OTHER_BUTTON = `${BUTTON} bg-surface text-fg`;

// Stable keys for the heart and star rows.
const HEARTS = Array.from({ length: LIVES }, (_, i) => `heart-${i}`);
const STARS = ['star-1', 'star-2', 'star-3'];

const CHIP = 'flex h-tap-min items-center gap-2 rounded-pill border-3 px-4';
// On phones the chips sit borderless inside one score bar sticker.
const IN_BAR = 'max-md:h-auto max-md:border-0 max-md:bg-transparent max-md:px-0';
const MODE_CARD = 'max-md:min-h-18 max-md:flex-row max-md:items-center max-md:gap-3 max-md:px-4 max-md:py-3 max-md:disabled:border-outline max-md:disabled:bg-surface-sunk max-md:disabled:text-fg-muted flex cursor-pointer flex-col items-start gap-2 rounded-lg border-3 border-outline p-[18px] text-left font-body shadow-drop-lg transition-transform duration-(--dur-tap) hover:-translate-y-0.5 active:translate-y-[5px] active:shadow-none motion-reduce:transition-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500 disabled:cursor-default disabled:border-dashed disabled:bg-surface-sunk disabled:text-fg-muted disabled:shadow-none disabled:hover:translate-y-0';

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function HeartIcon({ lost }: { lost: boolean }) {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinejoin="round" className={lost ? 'fill-surface-sunk stroke-fg-muted' : 'fill-coral-500 stroke-on-coral'}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
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

function FlameIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinejoin="round" className="fill-sun-400 stroke-on-sun">
      <path d="M12 21c-4 0-7-2.7-7-6.5 0-3.5 3-5.5 4-9.5 2 1.5 3 3.5 3 5.5 1-1 1.5-2 1.5-3.5 2.5 2 5.5 4.5 5.5 7.5 0 3.8-3 6.5-7 6.5z" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
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

function listNames(targets: Target[], max = 5) {
  const names = targets.slice(0, max).map(t => t.name).join(', ');
  return targets.length > max ? `${names} and ${targets.length - max} more` : names;
}

function withPaint(paints: Map<Country, Paint>, features: Country[], paint: Paint | null) {
  const next = new Map(paints);
  for (const f of features) {
    if (paint) next.set(f, paint);
    else next.delete(f);
  }
  return next;
}

function shuffle<T>(items: T[]) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Game({ view, viewSwitch }: { view: GameView; viewSwitch?: ReactNode }) {
  const [world, setWorld] = useState<World | null>(null);

  const [phase, setPhase] = useState<Phase>('start');
  const [mode, setMode] = useState<Mode>('easy');
  const [queue, setQueue] = useState<Target[]>([]);
  const [index, setIndex] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [paints, setPaints] = useState<Map<Country, Paint>>(new Map());
  const [missed, setMissed] = useState<Target[]>([]);
  const [homeCode, setHomeCode] = useState<string | null>(null);
  const firstRound = useRef(true);
  const timer = useRef<number>(undefined);

  useEffect(() => {
    let cancelled = false;
    loadWorld().then(w => {
      if (!cancelled) setWorld(w);
    });
    loadUserCountry().then(code => {
      if (!cancelled) setHomeCode(sovereignOf(code));
    });
    return () => { cancelled = true; window.clearTimeout(timer.current); };
  }, []);

  const targets = useMemo(() => (world ? buildTargets(world) : []), [world]);
  const target = queue[index];

  // Land share: each collected country counts by its area out of all land on the map.
  const totalLand = useMemo(() => (world ? d3.sum(world.features, f => d3.geoArea(f)) : 0), [world]);
  const knownLand = useMemo(
    () => d3.sum(queue, t => (collected.has(t.code) ? t.area : 0)),
    [queue, collected],
  );
  const landShare = totalLand ? knownLand / totalLand : 0;

  const pools = useMemo(
    () => Object.fromEntries(MODES.map(m => [m.mode, targets.filter(m.includes)])) as Record<Mode, Target[]>,
    [targets],
  );

  const start = (m: Mode) => {
    if (!world) return;
    let pool = pools[m];
    // The first round always asks for the player's own country, even if the mode leaves it out.
    const home = targets.find(t => t.code === homeCode);
    if (firstRound.current && home && !pool.includes(home)) pool = [...pool, home];
    firstRound.current = false;
    setPaints(new Map());
    setMode(m);
    setQueue(shuffle(pool));
    setIndex(0);
    setLives(LIVES);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCollected(new Set());
    setMissed([]);
    setFeedback(null);
    setPhase('playing');
  };

  const next = (livesLeft: number) => {
    setFeedback(null);
    if (livesLeft === 0 || index + 1 >= queue.length) {
      setPhase('over');
    } else {
      setIndex(index + 1);
      setPhase('playing');
    }
  };

  // Ends the round early and shows the end card.
  const stop = () => {
    window.clearTimeout(timer.current);
    setFeedback(null);
    setPhase('over');
  };

  const onPick = (clicked: Country, lonLat: [number, number]) => {
    if (phase !== 'playing' || !target) return;

    setPhase('feedback');
    if (sovereignOf(clicked.properties.code) === target.code) {
      const newStreak = streak + 1;
      const points = 10 + (newStreak - 1) * 2;
      setPaints(withPaint(paints, target.features, 'flag'));
      setCollected(new Set(collected).add(target.code));
      setScore(score + points);
      setStreak(newStreak);
      setBestStreak(Math.max(bestStreak, newStreak));
      setFeedback({
        ok: true,
        title: `Yes! ${target.name}`,
        detail: `+${points} points · +${formatPercent(target.area / totalLand)} land painted`,
      });
      timer.current = window.setTimeout(() => next(lives), 1000);
    } else {
      const km = Math.round(d3.geoDistance(lonLat, target.center) * EARTH_RADIUS_KM);
      const livesLeft = lives - 1;
      const shown = withPaint(withPaint(paints, [clicked], 'wrong'), target.features, 'answer');
      setPaints(shown);
      setFocus({ lonLat: target.center, features: target.features, id: Date.now() });
      setLives(livesLeft);
      setMissed(m => [...m, target]);
      setStreak(0);
      setFeedback({
        ok: false,
        title: `Oops, that's ${clicked.properties.name}`,
        detail: `${target.name} is the yellow one, ${km.toLocaleString()} km away.`,
      });
      timer.current = window.setTimeout(() => {
        const code = sovereignOf(clicked.properties.code);
        const restored = withPaint(shown, [clicked], code && collected.has(code) ? 'flag' : null);
        setPaints(withPaint(restored, target.features, null));
        next(livesLeft);
      }, 2600);
    }
  };

  return (
    // `[&_canvas]` aims the globe's three.js canvas, which the board renders itself.
    // `data-game-active` hides the app's top bar and tab bar on phones while playing.
    <div data-game-active={phase === 'playing' || phase === 'feedback' ? '' : undefined} className={`relative h-full font-body text-fg [&_canvas]:cursor-crosshair ${view === 'globe' ? 'bg-backdrop' : 'bg-map-sea'}`}>
      {phase !== 'start' && (
        <div className="absolute top-4 right-4 z-1 flex flex-wrap justify-end gap-3 max-md:top-3 max-md:right-3 max-md:left-3 max-md:flex-nowrap max-md:justify-start">
          {(phase === 'playing' || phase === 'feedback') && (
            <button type="button" aria-label="Stop game" onClick={stop} className="grid size-tap-icon shrink-0 cursor-pointer place-items-center rounded-md border-3 border-outline bg-surface p-0 text-fg shadow-drop-sm transition-transform duration-(--dur-tap) active:translate-y-1 active:shadow-none motion-reduce:transition-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500 md:hidden">
              <XIcon />
            </button>
          )}
          <div className="contents max-md:box-border max-md:flex max-md:h-tap-icon max-md:min-w-0 max-md:flex-1 max-md:items-center max-md:justify-between max-md:rounded-pill max-md:border-3 max-md:border-outline max-md:bg-surface max-md:px-4 max-md:shadow-drop-sm">
            <div role="img" aria-label={`${lives} of ${LIVES} hearts left`} className={`${CHIP} gap-1 border-outline bg-surface ${IN_BAR}`}>
              {HEARTS.map((key, i) => <HeartIcon key={key} lost={i >= lives} />)}
            </div>
            <div className={`${CHIP} border-outline bg-surface ${IN_BAR}`}>
              <StarIcon />
              <span className="font-display text-title-3 font-extrabold tabular-nums">{score}</span>
              <span className="sr-only">points</span>
            </div>
            {/* Brand fills keep an ink edge in both themes. */}
            <div className={`${CHIP} border-on-sun bg-grape-500 text-on-grape max-md:hidden`}>
              <FlameIcon />
              <span className="font-display text-title-3 font-extrabold tabular-nums">×{streak}</span>
              <span className="sr-only">streak</span>
            </div>
            <div className={`${CHIP} border-outline bg-surface text-label tabular-nums ${IN_BAR}`}>
              <FlagIcon />
              {collected.size} / {queue.length}
              <span className="sr-only">flags</span>
            </div>
          </div>
          <div className={`${CHIP} border-outline bg-surface text-label tabular-nums max-md:hidden`}>
            Land {formatPercent(landShare)}
            <span className="block h-3 w-20 overflow-hidden rounded-pill border-2 border-outline bg-surface-sunk">
              <span className="block h-full bg-leaf-500 transition-[width] duration-(--dur-pop) motion-reduce:transition-none" style={{ width: `${landShare * 100}%` }} />
            </span>
          </div>
        </div>
      )}

      {world && (view === 'globe'
        ? <GlobeBoard world={world} paints={paints} focus={focus} onPick={onPick} />
        : <FlatBoard world={world} paints={paints} focus={focus} onPick={onPick} />)}

      {(phase === 'playing' || phase === 'feedback') && target && (
        <div className="absolute bottom-6 left-1/2 flex w-[560px] max-w-[calc(100%-32px)] -translate-x-1/2 flex-col gap-3 max-md:right-3 max-md:bottom-[max(16px,env(safe-area-inset-bottom))] max-md:left-3 max-md:w-auto max-md:max-w-none max-md:translate-x-0">
          {/* On phones the feedback takes the question card's place instead of stacking on it. */}
          {feedback && (
            <output className={`flex items-center gap-3 rounded-md border-3 border-outline px-4 py-3 max-md:min-h-16 max-md:gap-4 max-md:rounded-lg max-md:px-[18px] max-md:py-3.5 max-md:shadow-drop-lg ${feedback.ok ? 'bg-tint-correct text-on-tint-correct' : 'bg-tint-oops text-on-tint-oops'}`}>
              <span className={`grid size-10 shrink-0 place-items-center rounded-pill border-3 ${feedback.ok ? 'border-on-leaf bg-leaf-500 text-on-leaf' : 'border-on-coral bg-coral-500 text-on-coral'}`}>
                {feedback.ok ? <CheckIcon /> : <XIcon />}
              </span>
              <span className="flex flex-col">
                <span className="font-display text-title-3 font-extrabold">{feedback.title}</span>
                <span className="text-caption">{feedback.detail}</span>
              </span>
            </output>
          )}
          <div className={`flex items-center gap-4 rounded-lg border-3 border-outline bg-surface px-[18px] py-3.5 shadow-drop-lg ${feedback ? 'max-md:hidden' : ''}`}>
            <img src={flagUrl(target.code)} alt="Flag to find" className="block h-16 w-24 shrink-0 rounded-[10px] border-3 border-outline object-cover" />
            <span className="flex flex-col gap-0.5">
              <span className="font-display text-title-2">Find this country</span>
              <span className="text-body font-bold text-fg-muted max-md:hidden">
                {view === 'globe' ? 'Tap it on the globe. Drag to spin.' : 'Tap it on the map. Drag to move.'}
              </span>
              <span className="text-body font-bold text-fg-muted md:hidden">Pinch to zoom, then tap.</span>
            </span>
          </div>
        </div>
      )}

      {phase === 'start' && (
        <div className="absolute inset-0 z-2 grid place-items-center bg-scrim p-4 max-md:grid-cols-1">
          <section className="box-border flex w-[760px] max-w-full flex-col gap-[18px] rounded-lg border-3 border-outline bg-surface p-7 text-fg shadow-drop-lg max-md:max-h-full max-md:gap-4 max-md:overflow-y-auto max-md:p-5">
            <div className="flex flex-col gap-1.5 text-center">
              <h2 className="m-0 font-display text-title-1">Flag Hunt</h2>
              <p className="m-0 text-body-lg text-fg-muted">
                A flag pops up. Tap its country<span className="max-md:hidden"> on the {view === 'globe' ? 'globe' : 'map'}</span>. You have {LIVES} hearts.
              </p>
              {!world && <p className="m-0 text-body text-fg-muted">Loading map…</p>}
            </div>
            {viewSwitch && (
              <div className="flex items-center justify-center gap-3 md:hidden">
                <span className="text-label">Play on</span>
                {viewSwitch}
              </div>
            )}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 max-md:grid-cols-1 max-md:gap-3">
              {MODES.map((m, i) => (
                <button type="button" key={m.mode} disabled={!world} onClick={() => start(m.mode)} className={`${MODE_CARD} ${m.tint} ${m.phone}`}>
                  <span className="flex gap-0.5 max-md:w-[70px] max-md:shrink-0">
                    {STARS.slice(0, i + 1).map(key => <StarIcon key={key} size={22} />)}
                  </span>
                  <span className="flex flex-col gap-2 max-md:min-w-0 max-md:flex-1 max-md:gap-0">
                    <span className="font-display text-title-2 font-extrabold max-md:text-title-3">{m.label}</span>
                    <span className="text-caption">{m.blurb}<span className="max-md:hidden"> · {pools[m.mode]?.length ?? 0} flags</span></span>
                  </span>
                  <span className="shrink-0 text-caption tabular-nums md:hidden">{pools[m.mode]?.length ?? 0} flags</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {phase === 'over' && (() => {
        // A wrong answer costs a heart and that flag isn't asked again, so a round
        // can end with hearts left but some flags missed.
        const outOfHearts = lives === 0;
        // Stopping early leaves flags unasked, so that isn't a perfect round either.
        const perfect = !outOfHearts && missed.length === 0 && collected.size === queue.length;
        const modeLabel = MODES.find(m => m.mode === mode)?.label;
        const nextMode = outOfHearts ? undefined : MODES[MODES.findIndex(m => m.mode === mode) + 1];
        return (
          <div className="absolute inset-0 z-2 grid place-items-center bg-scrim p-4 max-md:grid-cols-1">
            <section className="flex max-w-[560px] flex-col gap-4 rounded-lg border-3 border-outline bg-surface p-7 text-center text-fg shadow-drop-lg max-md:box-border max-md:max-h-full max-md:overflow-y-auto max-md:p-5">
              {!outOfHearts && (
                <div className="flex items-end justify-center gap-1.5">
                  <StarIcon size={44} /><StarIcon size={60} /><StarIcon size={44} />
                </div>
              )}
              <h2 className="m-0 font-display text-title-1">
                {outOfHearts ? 'Out of hearts' : perfect ? 'You found them all!' : 'Round done!'}
              </h2>
              <p className="m-0 text-body-lg">
                {outOfHearts ? 'Nice try! ' : ''}You found <b className="tabular-nums">{collected.size}</b> of <b className="tabular-nums">{queue.length}</b> flags{perfect ? '. Amazing!' : '.'}
              </p>
              {missed.length > 0 && (
                <p className="m-0 text-body text-fg-muted">Try these next time: {listNames(missed)}</p>
              )}
              <div className="flex flex-wrap justify-center gap-2 text-caption tabular-nums">
                <span className="rounded-pill border-2 border-outline bg-tint-hint px-3 py-1.5 text-on-tint-hint">{score} points</span>
                <span className="rounded-pill border-2 border-outline bg-tint-correct px-3 py-1.5 text-on-tint-correct">{collected.size} flags</span>
                <span className="rounded-pill border-2 border-outline bg-tint-reward px-3 py-1.5 text-on-tint-reward">Best streak {bestStreak}</span>
                <span className="rounded-pill border-2 border-outline bg-surface-sunk px-3 py-1.5">{formatPercent(landShare)} land</span>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-3 max-md:flex-col">
                {nextMode ? (
                  <>
                    <button type="button" className={MAIN_BUTTON} onClick={() => start(nextMode.mode)}>
                      Try {nextMode.label} <ArrowRightIcon />
                    </button>
                    <button type="button" className={OTHER_BUTTON} onClick={() => start(mode)}>Play {modeLabel} again</button>
                  </>
                ) : (
                  <button type="button" className={MAIN_BUTTON} onClick={() => start(mode)}>
                    {outOfHearts ? 'Try again' : 'Play again'}
                  </button>
                )}
                <button type="button" className={OTHER_BUTTON} onClick={() => setPhase('start')}>Change mode</button>
              </div>
            </section>
          </div>
        );
      })()}
    </div>
  );
}
