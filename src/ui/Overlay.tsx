import type { ComponentProps } from 'react';
import { cx } from './focus';

const BASE = 'absolute inset-0 z-2 grid place-items-center bg-scrim p-4 max-md:grid-cols-1';
// Tall content scrolls, clear of the corner buttons.
const SCROLL = 'overflow-y-auto pt-20';

export type OverlayProps = ComponentProps<'div'> & {
  scroll?: boolean;
};

// Dims the board and centres a card on it.
export function Overlay({ scroll = false, className, ...props }: OverlayProps) {
  return <div {...props} className={cx(BASE, scroll && SCROLL, className)} />;
}
