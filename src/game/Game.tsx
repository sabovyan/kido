import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as d3 from 'd3';
import { loadUserCountry, loadWorld, type Country, type World } from '../countries';
import { Feedback } from '../ui/Feedback';
import { Overlay } from '../ui/Overlay';
import type { Focus } from './board';
import { FlatBoard } from './FlatBoard';
import { GlobeBoard } from './GlobeBoard';
import { HuntEndCard } from './HuntEndCard';
import { HuntFindCard } from './HuntFindCard';
import { formatPercent, HuntHud, HuntStats } from './HuntHud';
import { HuntStartCard } from './HuntStartCard';
import { huntMiss, loadProgress, saveProgress, shuffle } from './learnSession';
import { type Mode, MODES } from './ModePicker';
import type { Paint } from './painter';
import { QuestionDock } from './QuestionDock';
import { buildTargets, chapterOf, sovereignOf, type Target, withPaint } from './targets';

type Phase = 'start' | 'playing' | 'feedback' | 'over';
type Answer = { ok: boolean; title: string; detail: string };
export type GameView = 'map' | 'globe';

const LIVES = 3;
const EARTH_RADIUS_KM = 6371;

// Which countries each mode asks.
const INCLUDES: Record<Mode, (t: Target) => boolean> = {
  easy: t => chapterOf(t) === 0,
  medium: t => chapterOf(t) <= 1,
  hard: () => true,
};

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
  const [feedback, setFeedback] = useState<Answer | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [paints, setPaints] = useState<Map<Country, Paint>>(new Map());
  const [missed, setMissed] = useState<Target[]>([]);
  const [homeCode, setHomeCode] = useState<string | null>(null);
  // The `#game-hud` slot in the app's top bar (desktop).
  const [hudSlot, setHudSlot] = useState<HTMLElement | null>(null);
  const firstRound = useRef(true);
  const timer = useRef<number>(undefined);

  useEffect(() => {
    let cancelled = false;
    setHudSlot(document.getElementById('game-hud'));
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
    () => Object.fromEntries(MODES.map(m => [m.mode, targets.filter(INCLUDES[m.mode])])) as Record<Mode, Target[]>,
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
      // Learn brings the country back for practice. Read fresh, so Learn's latest save is kept.
      const progress = loadProgress();
      const after = huntMiss(progress, target.code, Date.now());
      if (after !== progress) saveProgress(after);
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

  const inGame = phase === 'playing' || phase === 'feedback';

  // On phones the chips sit borderless inside one score bar sticker.
  const chips = <HuntStats lives={lives} maxLives={LIVES} score={score} streak={streak} found={collected.size} total={queue.length} />;

  return (
    // `[&_canvas]` aims the globe's three.js canvas, which the board renders itself.
    // `data-game-active` hides the app's top bar and tab bar on phones while playing.
    <div data-game-active={inGame ? '' : undefined} className={`relative h-full font-body text-fg [&_canvas]:cursor-crosshair ${view === 'globe' ? 'bg-backdrop' : 'bg-map-sea'}`}>
      {/* Desktop: the chips sit in the top bar, only while playing. */}
      {inGame && hudSlot && createPortal(
        <div className="flex flex-wrap justify-end gap-3 font-body text-fg">{chips}</div>,
        hudSlot,
      )}
      {phase !== 'start' && (
        <HuntHud playing={inGame} land={landShare} onStop={stop}>{chips}</HuntHud>
      )}

      {world && (view === 'globe'
        ? <GlobeBoard world={world} paints={paints} focus={focus} onPick={onPick} />
        : <FlatBoard world={world} paints={paints} focus={focus} onPick={onPick} />)}

      {inGame && target && (
        <QuestionDock>
          {/* On phones the feedback takes the question card's place instead of stacking on it. */}
          {feedback && (
            <Feedback tone={feedback.ok ? 'correct' : 'oops'} title={feedback.title} detail={feedback.detail} phoneCard />
          )}
          <HuntFindCard code={target.code} hidden={!!feedback} />
        </QuestionDock>
      )}

      {phase === 'start' && (
        <Overlay>
          <HuntStartCard
            view={view}
            lives={LIVES}
            loading={!world}
            viewSwitch={viewSwitch}
            counts={{ easy: pools.easy?.length, medium: pools.medium?.length, hard: pools.hard?.length }}
            onPick={start}
          />
        </Overlay>
      )}

      {phase === 'over' && (() => {
        // A wrong answer costs a heart and that flag isn't asked again, so a round
        // can end with hearts left but some flags missed.
        const outOfHearts = lives === 0;
        // Stopping early leaves flags unasked, so that isn't a perfect round either.
        const perfect = !outOfHearts && missed.length === 0 && collected.size === queue.length;
        const nextMode = outOfHearts ? undefined : MODES[MODES.findIndex(m => m.mode === mode) + 1]?.mode;
        return (
          <Overlay>
            <HuntEndCard
              view={view}
              outOfHearts={outOfHearts}
              perfect={perfect}
              found={collected.size}
              total={queue.length}
              missed={missed}
              score={score}
              bestStreak={bestStreak}
              land={landShare}
              mode={mode}
              nextMode={nextMode}
              onPlay={start}
              onChangeMode={() => setPhase('start')}
            />
          </Overlay>
        );
      })()}
    </div>
  );
}
