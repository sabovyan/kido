import type { ReactElement } from 'react';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { useRender } from '@base-ui/react/use-render';
import { cx, FOCUS_RING } from './focus';

// One sticker: the container has the outline and drop, the options inside are borderless.
const CONTAINER = 'inline-flex gap-1 rounded-md border-3 border-outline bg-surface p-1 shadow-drop-sm';

// Selected from Toggle's `data-pressed`, or `aria-current="page"` when the option is a link.
const ITEM = `inline-flex h-tap-min cursor-pointer items-center gap-2 rounded-sm border-0 bg-transparent px-4 font-body text-label text-fg no-underline transition-colors duration-(--dur-tap) motion-reduce:transition-none ${FOCUS_RING} not-data-pressed:not-aria-[current=page]:hover:bg-surface-sunk data-pressed:bg-ocean-500 data-pressed:text-on-ocean aria-[current=page]:bg-ocean-500 aria-[current=page]:text-on-ocean`;

export type SegmentedSwitchProps = Omit<ToggleGroup.Props, 'className' | 'render'> & {
  className?: string;
  // `<nav aria-label="…" />` when the options are links.
  render?: ReactElement;
};

// Pick one of 2-4 options in place. A Base UI ToggleGroup, or a `<nav>` of links via `render`.
// `className` is for layout only.
export function SegmentedSwitch({ render, className, ...props }: SegmentedSwitchProps) {
  return useRender({ render: render ?? <ToggleGroup />, props: { ...props, className: cx(CONTAINER, className) } });
}

export type SegmentedSwitchItemProps = Omit<Toggle.Props, 'className' | 'render'> & {
  className?: string;
  // `<Link … aria-current={selected ? 'page' : undefined} />` for a route option.
  render?: ReactElement;
};

function SegmentedSwitchItem({ render, className, ...props }: SegmentedSwitchItemProps) {
  return useRender({ render: render ?? <Toggle />, props: { ...props, className: cx(ITEM, className) } });
}

SegmentedSwitch.Item = SegmentedSwitchItem;
