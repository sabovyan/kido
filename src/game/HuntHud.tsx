import type { ReactNode } from 'react';
import { Chip } from '../ui/Chip';
import { IconButton } from '../ui/IconButton';
import { FlagIcon, FlameIcon, HeartIcon, StarIcon, XIcon } from '../ui/icons';
import { ProgressBar } from '../ui/ProgressBar';

export function formatPercent(share: number) {
  const pct = share * 100;
  return `${pct.toFixed(pct > 0 && pct < 1 ? 2 : 1)}%`;
}

// Hearts, points, streak and flags found. On phones the chips sit borderless inside one
// score bar sticker; on desktop they sit in the app's top bar.
export function HuntStats({ lives, maxLives, score, streak, found, total }: {
  lives: number;
  maxLives: number;
  score: number;
  streak: number;
  found: number;
  total: number;
}) {
  // Stable keys for the heart row.
  const hearts = Array.from({ length: maxLives }, (_, i) => `heart-${i}`);
  return (
    <>
      <Chip phone="bar" role="img" aria-label={`${lives} of ${maxLives} hearts left`} render={<div />}>
        {hearts.map((key, i) => <HeartIcon key={key} lost={i >= lives} />)}
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
        {found} / {total}
        <span className="sr-only">flags</span>
      </Chip>
    </>
  );
}

// The board's top-right corner: Stop and the score bar on phones, the land chip on desktop.
// `children`: the `HuntStats` chips. `playing`: false on the end card, which has no Stop.
export function HuntHud({ playing, land, onStop, children }: {
  playing: boolean;
  land: number;
  onStop: () => void;
  children: ReactNode;
}) {
  return (
    <div className="absolute top-4 right-4 z-1 flex flex-wrap justify-end gap-3 max-md:top-3 max-md:right-3 max-md:left-3 max-md:flex-nowrap max-md:justify-start">
      {playing && (
        <IconButton aria-label="Stop game" onClick={onStop} className="md:hidden">
          <XIcon size={22} strokeWidth="3" />
        </IconButton>
      )}
      {/* Phones: one score bar over the globe. */}
      <div className="contents md:hidden max-md:box-border max-md:flex max-md:h-tap-icon max-md:min-w-0 max-md:flex-1 max-md:items-center max-md:justify-between max-md:rounded-pill max-md:border-3 max-md:border-outline max-md:bg-surface max-md:px-4 max-md:shadow-drop-sm">
        {children}
      </div>
      <Chip className="max-md:hidden" render={<div />}>
        Land {formatPercent(land)}
        <ProgressBar value={land} label="Land painted" />
      </Chip>
    </div>
  );
}
