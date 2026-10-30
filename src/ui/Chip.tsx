import { useRender } from '@base-ui/react/use-render';
import { cx } from './focus';

const SIZES = {
  // Score bar chips: hearts, points, streak, progress.
  md: 'flex h-tap-min items-center rounded-pill border-3 px-4 text-label tabular-nums',
  // Stat pills on the end card, level pills.
  sm: 'inline-flex items-center gap-1 rounded-pill border-2 px-3 py-1.5 text-caption tabular-nums',
};

// Brand fills keep an ink edge in both themes.
const TONES = {
  surface: 'border-outline bg-surface text-fg',
  reward: 'border-on-sun bg-grape-500 text-on-grape',
  sunk: 'border-outline bg-surface-sunk text-fg',
  'tint-hint': 'border-outline bg-tint-hint text-on-tint-hint',
  'tint-correct': 'border-outline bg-tint-correct text-on-tint-correct',
  'tint-reward': 'border-outline bg-tint-reward text-on-tint-reward',
};

// `md` only, on phones. `bar`: borderless inside one score bar sticker. `sticker`: its own 56px sticker.
const PHONE = {
  bar: 'max-md:h-auto max-md:border-0 max-md:bg-transparent max-md:px-0',
  sticker: 'max-md:box-border max-md:h-tap-icon max-md:shadow-drop-sm',
};

export type ChipProps = useRender.ComponentProps<'span'> & {
  tone?: keyof typeof TONES;
  size?: keyof typeof SIZES;
  // `md` only: a closer row, for the hearts.
  tight?: boolean;
  phone?: keyof typeof PHONE;
};

// A pill that shows a value. `className` is for layout only.
export function Chip({ tone = 'surface', size = 'md', tight = false, phone, render, className, ref, ...props }: ChipProps) {
  return useRender({
    defaultTagName: 'span',
    render,
    ref,
    props: {
      ...props,
      className: cx(SIZES[size], size === 'md' && (tight ? 'gap-1' : 'gap-2'), TONES[tone], size === 'md' && phone && PHONE[phone], className),
    },
  });
}
