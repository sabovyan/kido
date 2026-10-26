import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Polygon } from 'geojson';
import { flagUrl, loadWorld, type Country, type World } from '../countries';
import type { Focus } from './board';
import { FlatBoard } from './FlatBoard';
import { GlobeBoard } from './GlobeBoard';
import type { Paint } from './painter';
import { FLAG_RECOGNITION } from './recognition';

type Phase = 'start' | 'playing' | 'feedback' | 'over';
type Mode = 'easy' | 'medium' | 'hard';
type Feedback = { ok: boolean; text: string };
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

const MODES: { mode: Mode; label: string; includes: (t: Target) => boolean }[] = [
  { mode: 'easy', label: 'Easy', includes: t => (FLAG_RECOGNITION[t.code] ?? 0) >= 75 && t.area >= EASY_MIN_AREA },
  { mode: 'medium', label: 'Medium', includes: t => (FLAG_RECOGNITION[t.code] ?? 0) >= 60 },
  { mode: 'hard', label: 'Hard', includes: () => true },
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

export function Game({ view }: { view: GameView }) {
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
  const timer = useRef<number>(undefined);

  useEffect(() => {
    let cancelled = false;
    loadWorld().then(w => {
      if (!cancelled) setWorld(w);
    });
    return () => { cancelled = true; window.clearTimeout(timer.current); };
  }, []);

  const targets = useMemo(() => (world ? buildTargets(world) : []), [world]);
  const target = queue[index];

  const pools = useMemo(
    () => Object.fromEntries(MODES.map(m => [m.mode, targets.filter(m.includes)])) as Record<Mode, Target[]>,
    [targets],
  );

  const start = (m: Mode) => {
    if (!world) return;
    const pool = pools[m];
    setPaints(new Map());
    setMode(m);
    setQueue(shuffle(pool));
    setIndex(0);
    setLives(LIVES);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCollected(new Set());
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

  const onPick = (clicked: Country, lonLat: [number, number]) => {
    if (phase !== 'playing' || !target) return;

    setPhase('feedback');
    if (sovereignOf(clicked.properties.code) === target.code) {
      const newStreak = streak + 1;
      setPaints(withPaint(paints, target.features, 'flag'));
      setCollected(new Set(collected).add(target.code));
      setScore(score + 10 + (newStreak - 1) * 2);
      setStreak(newStreak);
      setBestStreak(Math.max(bestStreak, newStreak));
      setFeedback({ ok: true, text: `Correct! ${target.name}` });
      timer.current = window.setTimeout(() => next(lives), 1000);
    } else {
      const km = Math.round(d3.geoDistance(lonLat, target.center) * EARTH_RADIUS_KM);
      const livesLeft = lives - 1;
      const shown = withPaint(withPaint(paints, [clicked], 'wrong'), target.features, 'answer');
      setPaints(shown);
      setFocus({ lonLat: target.center, features: target.features, id: Date.now() });
      setLives(livesLeft);
      setStreak(0);
      setFeedback({
        ok: false,
        text: `That's ${clicked.properties.name}, ${km.toLocaleString()} km away. It was ${target.name}.`,
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
    <div className="game">
      {phase !== 'start' && (
        <div className="stats">
          <span className="lives">{'♥'.repeat(lives)}<span className="lost">{'♥'.repeat(LIVES - lives)}</span></span>
          <span>Score <b>{score}</b></span>
          <span>Streak <b>{streak}</b></span>
          <span>Flags <b>{collected.size}</b>/{queue.length}</span>
        </div>
      )}

      {world && (view === 'globe'
        ? <GlobeBoard world={world} paints={paints} focus={focus} onPick={onPick} />
        : <FlatBoard world={world} paints={paints} focus={focus} onPick={onPick} />)}

      {(phase === 'playing' || phase === 'feedback') && target && (
        <div className="prompt">
          <img src={flagUrl(target.code)} alt="Flag to find" />
          <div>
            <div className="prompt-label">Find this country</div>
            {feedback && <div className={`feedback ${feedback.ok ? 'ok' : 'bad'}`}>{feedback.text}</div>}
          </div>
        </div>
      )}

      {phase === 'start' && (
        <div className="overlay">
          <div className="card">
            <h2>Flag Hunt</h2>
            <p>A flag appears. Click its country on the {view === 'globe' ? 'globe' : 'map'}. Each correct answer paints the flag onto the world. You have {LIVES} lives.</p>
            {!world && <p>Loading map…</p>}
            <div className="actions">
              {MODES.map(m => (
                <button type="button" key={m.mode} disabled={!world} onClick={() => start(m.mode)}>
                  {m.label} · {pools[m.mode]?.length ?? 0} flags
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === 'over' && (
        <div className="overlay">
          <div className="card">
            <h2>{lives > 0 ? 'You found them all!' : 'Game over'}</h2>
            <p>Score <b>{score}</b> · Flags collected <b>{collected.size}</b>/{queue.length} · Best streak <b>{bestStreak}</b></p>
            <div className="actions">
              <button type="button" onClick={() => start(mode)}>Play again</button>
              <button type="button" className="secondary" onClick={() => setPhase('start')}>Change mode</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
