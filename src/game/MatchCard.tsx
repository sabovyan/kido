import type { ReactNode } from 'react';
import { Card } from '../ui/Card';

// Learn's memory game step. `children`: the `MemoryMatch` board.
export function MatchCard({ children }: { children: ReactNode }) {
  return (
    <Card padding="md" render={<section />} className="box-border flex w-[680px] max-w-full flex-col items-center gap-4">
      <div className="flex flex-col gap-0.5 text-center">
        <h2 className="m-0 font-display text-title-2">Find the pairs</h2>
        <p className="m-0 text-body text-fg-muted">Match each flag with its country.</p>
      </div>
      {children}
    </Card>
  );
}
