import { useRender } from '@base-ui/react/use-render';
import { cx, FOCUS_RING } from './focus';

const BASE = `grid shrink-0 cursor-pointer place-items-center rounded-md border-3 border-outline bg-surface p-0 text-fg no-underline shadow-drop-sm transition-transform duration-(--dur-tap) active:translate-y-1 active:shadow-none motion-reduce:transition-none ${FOCUS_RING} data-popup-open:bg-surface-sunk data-popup-open:shadow-none disabled:cursor-default disabled:border-dashed disabled:bg-surface-sunk disabled:text-fg-muted disabled:shadow-none`;

const SIZES = {
  icon: 'size-tap-icon',
  // Inside a card, such as the map card's Close button.
  sm: 'size-tap-min',
};

export type IconButtonProps = useRender.ComponentProps<'button'> & {
  'aria-label': string;
  size?: keyof typeof SIZES;
};

// An icon-only sticker button. Works as a Base UI part: `<Menu.Trigger render={<IconButton aria-label="Menu" />} />`.
export function IconButton({ size = 'icon', render, className, ref, ...props }: IconButtonProps) {
  return useRender({
    defaultTagName: 'button',
    render,
    ref,
    props: {
      type: render ? undefined : 'button',
      ...props,
      className: cx(BASE, SIZES[size], className),
    },
  });
}
