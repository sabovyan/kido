import type { ReactNode } from 'react';
import { Card } from '../ui/Card';
import { type Mode, ModePicker } from './ModePicker';

// Flag Hunt's first card: how to play and the mode picker.
export function HuntStartCard({ view, lives, loading, viewSwitch, counts, onPick }: {
  view: 'map' | 'globe';
  lives: number;
  loading: boolean;
  viewSwitch?: ReactNode;
  counts: Partial<Record<Mode, number>>;
  onPick: (mode: Mode) => void;
}) {
  return (
    <Card render={<section />} className="box-border flex w-[760px] max-w-full flex-col gap-[18px] max-md:max-h-full max-md:gap-4 max-md:overflow-y-auto">
      <div className="flex flex-col gap-1.5 text-center">
        <h2 className="m-0 font-display text-title-1">Flag Hunt</h2>
        <p className="m-0 text-body-lg text-fg-muted">
          A flag pops up. Tap its country<span className="max-md:hidden"> on the {view}</span>. You have {lives} hearts.
        </p>
        {loading && <p className="m-0 text-body text-fg-muted">Loading map…</p>}
      </div>
      {viewSwitch && (
        <div className="flex items-center justify-center gap-3 md:hidden">
          <span className="text-label">Play on</span>
          {viewSwitch}
        </div>
      )}
      <ModePicker counts={counts} disabled={loading} onPick={onPick} />
    </Card>
  );
}
