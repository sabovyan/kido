import type { ReactNode } from 'react';

// Holds the question card and feedback at the bottom of the board.
export function QuestionDock({ children }: { children: ReactNode }) {
  return (
    <div className="absolute bottom-6 left-1/2 flex w-[560px] max-w-[calc(100%-32px)] -translate-x-1/2 flex-col gap-3 max-md:right-3 max-md:bottom-[max(16px,env(safe-area-inset-bottom))] max-md:left-3 max-md:w-auto max-md:max-w-none max-md:translate-x-0">
      {children}
    </div>
  );
}
