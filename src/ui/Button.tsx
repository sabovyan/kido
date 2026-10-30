import { useRender } from '@base-ui/react/use-render';
import { cx, FOCUS_RING } from './focus';

const BASE = `inline-flex cursor-pointer items-center rounded-md border-3 border-outline font-display no-underline transition-transform duration-(--dur-tap) active:shadow-none motion-reduce:transition-none ${FOCUS_RING} disabled:cursor-default`;

const SIZES = {
  // A screen's big actions: start, play again, change mode.
  lg: 'h-tap-main gap-2.5 px-7 text-title-2 shadow-drop-md hover:-translate-y-0.5 active:translate-y-[5px]',
  // Actions inside a card: Next, Skip, Fun facts, Learn these.
  md: 'h-tap-min shrink-0 gap-2 px-5 text-title-3 shadow-drop-sm active:translate-y-1 disabled:border-dashed disabled:bg-surface-sunk disabled:text-fg-muted disabled:shadow-none',
};

const VARIANTS = {
  // The one "do this now" action on a screen.
  main: 'bg-sun-400 text-on-sun active:bg-sun-600',
  continue: 'bg-ocean-500 text-on-ocean active:bg-ocean-700',
  other: 'bg-surface text-fg',
};

// Full width on phones, with the label centred.
const FILL = 'max-md:box-border max-md:w-full max-md:justify-center';

export type ButtonProps = useRender.ComponentProps<'button'> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  fill?: boolean;
};

// A sticker button. `render={<Link to="…" />}` makes it a link; `className` is for layout only.
export function Button({ variant = 'other', size = 'lg', fill = false, render, className, ref, ...props }: ButtonProps) {
  return useRender({
    defaultTagName: 'button',
    render,
    ref,
    props: {
      type: render ? undefined : 'button',
      ...props,
      className: cx(BASE, SIZES[size], VARIANTS[variant], fill && FILL, className),
    },
  });
}
