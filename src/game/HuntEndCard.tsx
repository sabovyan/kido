import { Link } from '@tanstack/react-router';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { ArrowRightIcon, StarIcon } from '../ui/icons';
import { formatPercent } from './HuntHud';
import { type Mode, MODES } from './ModePicker';

type Missed = { code: string; name: string };

function listNames(targets: Missed[], max = 5) {
  const names = targets.slice(0, max).map(t => t.name).join(', ');
  return targets.length > max ? `${names} and ${targets.length - max} more` : names;
}

// Flag Hunt's end card. `nextMode`: offered after a round that ended with hearts left.
export function HuntEndCard({ view, outOfHearts, perfect, found, total, missed, score, bestStreak, land, mode, nextMode, onPlay, onChangeMode }: {
  view: 'map' | 'globe';
  outOfHearts: boolean;
  perfect: boolean;
  found: number;
  total: number;
  missed: Missed[];
  score: number;
  bestStreak: number;
  land: number;
  mode: Mode;
  nextMode?: Mode;
  onPlay: (mode: Mode) => void;
  onChangeMode: () => void;
}) {
  const modeLabel = MODES.find(m => m.mode === mode)?.label;
  const nextLabel = MODES.find(m => m.mode === nextMode)?.label;
  return (
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
        {outOfHearts ? 'Nice try! ' : ''}You found <b className="tabular-nums">{found}</b> of <b className="tabular-nums">{total}</b> flags{perfect ? '. Amazing!' : '.'}
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
        <Chip size="sm" tone="tint-correct">{found} flags</Chip>
        <Chip size="sm" tone="tint-reward">Best streak {bestStreak}</Chip>
        <Chip size="sm" tone="sunk">{formatPercent(land)} land</Chip>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-3 max-md:flex-col">
        {nextMode ? (
          <>
            <Button variant="main" fill onClick={() => onPlay(nextMode)}>
              Try {nextLabel} <ArrowRightIcon />
            </Button>
            <Button fill onClick={() => onPlay(mode)}>Play {modeLabel} again</Button>
          </>
        ) : (
          <Button variant="main" fill onClick={() => onPlay(mode)}>
            {outOfHearts ? 'Try again' : 'Play again'}
          </Button>
        )}
        <Button fill onClick={onChangeMode}>Change mode</Button>
      </div>
    </Card>
  );
}
