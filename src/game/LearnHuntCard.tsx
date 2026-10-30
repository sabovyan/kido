import type { ReactNode } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ArrowRightIcon } from '../ui/icons';
import { type LevelRow, LevelList } from './LevelList';

// Learn's first card when Flag Hunt sent countries to learn. `size`: how many will be learned
// (known before the map loads, when `countries` can still be empty).
export function LearnHuntCard({ board, loading, viewSwitch, size, countries, onStart, onNotNow }: {
  board: string;
  loading: boolean;
  viewSwitch?: ReactNode;
  size: number;
  countries: LevelRow[];
  onStart: () => void;
  onNotNow: () => void;
}) {
  return (
    <Card render={<section />} className="box-border flex w-[560px] max-w-full flex-col gap-[18px] max-md:max-h-full max-md:gap-4 max-md:overflow-y-auto">
      <div className="flex flex-col gap-1.5 text-center">
        <h2 className="m-0 font-display text-title-1">Learn {size === 1 ? 'this flag' : 'these flags'}</h2>
        <p className="m-0 text-body-lg text-fg-muted">
          From your Flag Hunt. Meet {size === 1 ? 'it' : 'them'}, build {size === 1 ? 'it' : 'them'}{size > 1 ? ', play a memory game' : ''} and find {size === 1 ? 'it' : 'them'} on the {board}.
        </p>
        {loading && <p className="m-0 text-body text-fg-muted">Loading map…</p>}
      </div>
      {viewSwitch && (
        <div className="flex items-center justify-center gap-3 md:hidden">
          <span className="text-label">Learn on</span>
          {viewSwitch}
        </div>
      )}
      <LevelList countries={countries} />
      <div className="flex flex-wrap justify-center gap-3 max-md:flex-col">
        <Button variant="main" fill disabled={loading} onClick={onStart}>
          Start learning <ArrowRightIcon />
        </Button>
        <Button fill onClick={onNotNow}>Not now</Button>
      </div>
    </Card>
  );
}
