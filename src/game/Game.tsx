import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@tanstack/react-router';
import * as d3 from 'd3';
import { loadUserCountry, loadWorld, type Country, type World } from '../countries';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { Feedback } from '../ui/Feedback';
import { Flag } from '../ui/Flag';
import { FOCUS_RING } from '../ui/focus';
import { IconButton } from '../ui/IconButton';
import { ArrowRightIcon, FlagIcon, FlameIcon, HeartIcon, StarIcon, XIcon } from '../ui/icons';
import { Overlay } from '../ui/Overlay';
import { ProgressBar } from '../ui/ProgressBar';
import type { Focus } from './board';
import { FlatBoard } from './FlatBoard';
import { GlobeBoard } from './GlobeBoard';
import { huntMiss, loadProgress, saveProgress, shuffle } from './learnSession';
import type { Paint } from './painter';
import { buildTargets, chapterOf, sovereignOf, type Target, withPaint } from './targets';

type Phase = 'start' | 'playing' | 'feedback' | 'over';
type Mode = 'easy' | 'medium' | 'hard';
type Answer = { ok: boolean; title: string; detail: string };
export type GameView = 'map' | 'globe';

const LIVES = 3;
const EARTH_RADIUS_KM = 6371;

// `phone`: on phones Easy is the one main (sun) action and the others are plain rows.
const MODES: { mode: Mode; label: string; blurb: string; tint: string; phone: string; includes: (t: Target) => boolean }[] = [
  { mode: 'easy', label: 'Easy', blurb: 'Big countries, famous flags', tint: 'bg-tint-correct text-on-tint-correct', phone: 'max-md:border-on-sun max-md:bg-sun-400 max-md:text-on-sun', includes: t => chapterOf(t) === 0 },
  { mode: 'medium', label: 'Medium', blurb: 'More flags to spot', tint: 'bg-tint-hint text-on-tint-hint', phone: 'max-md:bg-surface max-md:text-fg', includes: t => chapterOf(t) <= 1 },
  { mode: 'hard', label: 'Hard', blurb: 'Every flag, tiny islands too', tint: 'bg-tint-oops text-on-tint-oops', phone: 'max-md:bg-surface max-md:text-fg', includes: () => true },
];

function formatPercent(share: number) {
  const pct = share * 100;
  return `${pct.toFixed(pct > 0 && pct < 1 ? 2 : 1)}%`;
}

// Stable keys for the heart and star rows.
const HEARTS = Array.from({ length: LIVES }, (_, i) => `heart-${i}`);
const STARS = ['star-1', 'star-2', 'star-3'];

const MODE_CARD = `max-md:min-h-18 max-md:flex-row max-md:items-center max-md:gap-3 max-md:px-4 max-md:py-3 max-md:disabled:border-outline max-md:disabled:bg-surface-sunk max-md:disabled:text-fg-muted flex cursor-pointer flex-col items-start gap-2 rounded-lg border-3 border-outline p-[18px] text-left font-body shadow-drop-lg transition-transform duration-(--dur-tap) hover:-translate-y-0.5 active:translate-y-[5px] active:shadow-none motion-reduce:transition-none ${FOCUS_RING} disabled:cursor-default disabled:border-dashed disabled:bg-surface-sunk disabled:text-fg-muted disabled:shadow-none disabled:hover:translate-y-0`;

function listNames(targets: Target[], max = 5) {
  const names = targets.slice(0, max).map(t => t.name).join(', ');
  return targets.length > max ? `${names} and ${targets.length - max} more` : names;
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
  const chips = (
    <>
      <Chip phone="bar" role="img" aria-label={`${lives} of ${LIVES} hearts left`} render={<div />}>
        {HEARTS.map((key, i) => <HeartIcon key={key} lost={i >= lives} />)}
      </Chip>
      <Chip phone="bar" render={<div />}>
        <StarIcon />
        <span className="font-display text-title-3 font-extrabold tabular-nums">{score}</span>
        <span className="sr-only">points</span>
      </Chip>
      <Chip tone="reward" className="max-md:hidden" render={<div />}>
        <FlameIcon />
        <span className="font-display text-title-3 font-extrabold tabular-nums">×{streak}</span>
        <span className="sr-only">streak</span>
      </Chip>
      <Chip phone="bar" render={<div />}>
        <FlagIcon size={22} />
        {collected.size} / {queue.length}
        <span className="sr-only">flags</span>
      </Chip>
    </>
  );

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
        <div className="absolute top-4 right-4 z-1 flex flex-wrap justify-end gap-3 max-md:top-3 max-md:right-3 max-md:left-3 max-md:flex-nowrap max-md:justify-start">
          {inGame && (
            <IconButton aria-label="Stop game" onClick={stop} className="md:hidden">
              <XIcon size={22} strokeWidth="3" />
            </IconButton>
          )}
          {/* Phones: one score bar over the globe. */}
          <div className="contents md:hidden max-md:box-border max-md:flex max-md:h-tap-icon max-md:min-w-0 max-md:flex-1 max-md:items-center max-md:justify-between max-md:rounded-pill max-md:border-3 max-md:border-outline max-md:bg-surface max-md:px-4 max-md:shadow-drop-sm">
            {chips}
          </div>
          <Chip className="max-md:hidden" render={<div />}>
            Land {formatPercent(landShare)}
            <ProgressBar value={landShare} label="Land painted" />
          </Chip>
        </div>
      )}

      {world && (view === 'globe'
        ? <GlobeBoard world={world} paints={paints} focus={focus} onPick={onPick} />
        : <FlatBoard world={world} paints={paints} focus={focus} onPick={onPick} />)}

      {inGame && target && (
        <div className="absolute bottom-6 left-1/2 flex w-[560px] max-w-[calc(100%-32px)] -translate-x-1/2 flex-col gap-3 max-md:right-3 max-md:bottom-[max(16px,env(safe-area-inset-bottom))] max-md:left-3 max-md:w-auto max-md:max-w-none max-md:translate-x-0">
          {/* On phones the feedback takes the question card's place instead of stacking on it. */}
          {feedback && (
            <Feedback tone={feedback.ok ? 'correct' : 'oops'} title={feedback.title} detail={feedback.detail} phoneCard />
          )}
          {/* On phones the card is just the flag, centred; the alt text carries the instruction. */}
          <Card padding="sm" className={`flex items-center gap-4 max-md:self-center max-md:p-2.5 ${feedback ? 'max-md:hidden' : ''}`}>
            <Flag code={target.code} alt="Find the country with this flag" className="max-md:h-20 max-md:w-30" />
            <span className="flex flex-col gap-0.5 max-md:hidden">
              <span className="font-display text-title-2">Find this country</span>
            </span>
          </Card>
        </div>
      )}

      {phase === 'start' && (
        <Overlay>
          <Card render={<section />} className="box-border flex w-[760px] max-w-full flex-col gap-[18px] max-md:max-h-full max-md:gap-4 max-md:overflow-y-auto">
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
          </Card>
        </Overlay>
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
          <Overlay>
            <Card render={<section />} className="flex max-w-[560px] flex-col gap-4 text-center max-md:box-border max-md:max-h-full max-md:overflow-y-auto">
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
                <>
                  <p className="m-0 text-body text-fg-muted">Try these next time: {listNames(missed)}</p>
                  {/* Learn takes the first 6 (its memory game's limit). */}
                  <Button
                    size="md"
                    fill
                    className="self-center"
                    render={<Link to="/country/learn" search={{ ...(view === 'map' ? { view: 'map' } : {}), codes: missed.map(t => t.code).join(',') }} />}
                  >
                    Learn {missed.length === 1 ? 'this one' : 'these'} <ArrowRightIcon />
                  </Button>
                </>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                <Chip size="sm" tone="tint-hint">{score} points</Chip>
                <Chip size="sm" tone="tint-correct">{collected.size} flags</Chip>
                <Chip size="sm" tone="tint-reward">Best streak {bestStreak}</Chip>
                <Chip size="sm" tone="sunk">{formatPercent(landShare)} land</Chip>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-3 max-md:flex-col">
                {nextMode ? (
                  <>
                    <Button variant="main" fill onClick={() => start(nextMode.mode)}>
                      Try {nextMode.label} <ArrowRightIcon />
                    </Button>
                    <Button fill onClick={() => start(mode)}>Play {modeLabel} again</Button>
                  </>
                ) : (
                  <Button variant="main" fill onClick={() => start(mode)}>
                    {outOfHearts ? 'Try again' : 'Play again'}
                  </Button>
                )}
                <Button fill onClick={() => setPhase('start')}>Change mode</Button>
              </div>
            </Card>
          </Overlay>
        );
      })()}
    </div>
  );
}
