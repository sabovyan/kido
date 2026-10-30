import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ArrowRightIcon } from '../ui/icons';
import { LEVELS, LevelChip } from './LevelList';

const flags = (n: number) => (n === 1 ? 'flag' : 'flags');

// Learn's first card. `counts`: how many countries are at each level (New, Met, Known, Mastered).
// `due`: flags to practice today. `hasNext`: whether there is anything left to learn.
export function LearnStartCard({ board, loading, viewSwitch, counts, due, hasNext, onStart }: {
  board: string;
  loading: boolean;
  viewSwitch?: ReactNode;
  counts: number[];
  due: number;
  hasNext: boolean;
  onStart: () => void;
}) {
  return (
    <Card render={<section />} className="box-border flex w-[640px] max-w-full flex-col gap-[18px] max-md:max-h-full max-md:gap-4 max-md:overflow-y-auto">
      <div className="flex flex-col gap-1.5 text-center">
        <h2 className="m-0 font-display text-title-1">Learn flags</h2>
        <p className="m-0 text-body-lg text-fg-muted">
          First a quick check. Then meet new flags, build them, play a memory game and find them on the {board}.
        </p>
        {loading && <p className="m-0 text-body text-fg-muted">Loading map…</p>}
      </div>
      {viewSwitch && (
        <div className="flex items-center justify-center gap-3 md:hidden">
          <span className="text-label">Learn on</span>
          {viewSwitch}
        </div>
      )}
      {!loading && (
        <div className="flex flex-wrap justify-center gap-2 tabular-nums">
          {LEVELS.slice(1).map((l, i) => (
            <span key={l.label} className="inline-flex items-center gap-2">
              <LevelChip level={i + 1} />
              <span className="text-caption">{counts[i + 1]}</span>
            </span>
          ))}
        </div>
      )}
      {due > 0 && (
        <p className="m-0 text-center text-body font-bold">
          {due} {flags(due)} to practice today
        </p>
      )}
      {!loading && !hasNext && (
        <p className="m-0 text-center text-body-lg">You know every flag. Amazing!</p>
      )}
      <div className="flex flex-wrap justify-center gap-3 max-md:flex-col">
        {hasNext && (
          <Button variant="main" fill disabled={loading} onClick={onStart}>
            {counts[1] + counts[2] + counts[3] ? 'Keep learning' : 'Start learning'} <ArrowRightIcon />
          </Button>
        )}
        <Button fill render={<Link to="/country/games" />}>Play Flag Hunt</Button>
      </div>
    </Card>
  );
}
