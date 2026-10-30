import type { ComponentProps } from 'react';
import { useRender } from '@base-ui/react/use-render';
import { cx, FOCUS_RING } from './focus';

const CONTAINER = 'flex gap-2 rounded-pill bg-surface-sunk p-1.5';

// TanStack's `<Link>` sets `aria-current="page"` on the active route.
const TAB = `flex h-tap-min items-center gap-2 rounded-pill px-5 text-label text-fg no-underline ${FOCUS_RING} aria-[current=page]:bg-ocean-500 aria-[current=page]:text-on-ocean`;

export type PillTabsProps = ComponentProps<'nav'> & { 'aria-label': string };

// Route-level navigation: each tab is an icon and a word. `className` is for layout only.
export function PillTabs({ className, ...props }: PillTabsProps) {
  return <nav {...props} className={cx(CONTAINER, className)} />;
}

export type PillTabsItemProps = useRender.ComponentProps<'a'>;

// `render={<Link to="/country/learn" />}`.
function PillTabsItem({ render, className, ref, ...props }: PillTabsItemProps) {
  return useRender({ defaultTagName: 'a', render, ref, props: { ...props, className: cx(TAB, className) } });
}

PillTabs.Item = PillTabsItem;
