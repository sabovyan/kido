import type { ComponentProps, ReactNode } from 'react';
import { cx } from './focus';
import { BulbIcon, CheckIcon, XIcon } from './icons';

// `idle` is the jigsaw's resting how-to line: no badge.
const TONES = {
  correct: { box: 'bg-tint-correct text-on-tint-correct', badge: 'border-on-leaf bg-leaf-500 text-on-leaf' },
  oops: { box: 'bg-tint-oops text-on-tint-oops', badge: 'border-on-coral bg-coral-500 text-on-coral' },
  hint: { box: 'bg-tint-hint text-on-tint-hint', badge: 'border-on-sun bg-sun-400 text-on-sun' },
  idle: { box: 'bg-surface-sunk text-fg', badge: '' },
};

const BASE = 'flex items-center gap-3 rounded-md border-3 border-outline px-4';
// Title over a small detail line.
const WITH_TITLE = 'py-3';
// One line of text, as tall as a main button.
const LINE = 'box-border min-h-tap-main py-2';
// On phones it takes the question card's place, so it looks like one.
const PHONE_CARD = 'max-md:min-h-16 max-md:gap-4 max-md:rounded-lg max-md:px-[18px] max-md:py-3.5 max-md:shadow-drop-lg';

function badgeIcon(tone: keyof typeof TONES, line: boolean) {
  if (line) {
    if (tone === 'correct') return <CheckIcon size={20} />;
    if (tone === 'oops') return <XIcon size={20} />;
    return <BulbIcon size={20} />;
  }
  if (tone === 'correct') return <CheckIcon size={22} strokeWidth="3" />;
  if (tone === 'oops') return <XIcon size={22} strokeWidth="3" />;
  return <BulbIcon size={22} />;
}

export type FeedbackProps = Omit<ComponentProps<'output'>, 'title' | 'children'> & {
  tone: keyof typeof TONES;
  // With a title: bold title over `detail`. Without: `detail` alone as one line.
  title?: ReactNode;
  detail?: ReactNode;
  // A small drop, for a toast floating over the board.
  raised?: boolean;
  phoneCard?: boolean;
};

// Right / wrong / hint message. An `<output>`, so screen readers hear each new one.
export function Feedback({ tone, title, detail, raised = false, phoneCard = false, className, ...props }: FeedbackProps) {
  const line = title === undefined;
  return (
    <output {...props} className={cx(BASE, line ? LINE : WITH_TITLE, raised && 'shadow-drop-sm', phoneCard && PHONE_CARD, TONES[tone].box, className)}>
      {tone !== 'idle' && (
        <span className={`grid size-10 shrink-0 place-items-center rounded-pill border-3 ${TONES[tone].badge}`}>
          {badgeIcon(tone, line)}
        </span>
      )}
      {line ? (
        <span className="text-body font-bold">{detail}</span>
      ) : (
        <span className="flex flex-col">
          <span className="font-display text-title-3 font-extrabold">{title}</span>
          {detail !== undefined && <span className="text-caption">{detail}</span>}
        </span>
      )}
    </output>
  );
}
