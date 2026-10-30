import type { ComponentProps } from 'react';
import { flagUrl } from '../countries';
import { cx } from './focus';

const SIZES = {
  // Map hover tooltip. A smaller corner: rounded-sm would make it a capsule at this size.
  xs: 'h-6 w-9 shrink-0 rounded-[6px] border-2 border-on-sun',
  // Lists of countries.
  sm: 'h-10 w-15 shrink-0 rounded-sm border-2 border-outline',
  // Question cards.
  md: 'h-16 w-24 shrink-0 rounded-sm border-3 border-outline',
  // Meet card; the question card on phones.
  lg: 'h-20 w-30 shrink-0 rounded-sm border-3 border-outline',
  // As wide as its box: flag choices, memory cards.
  fill: 'aspect-[3/2] w-full rounded-sm border-2 border-outline',
};

export type FlagProps = Omit<ComponentProps<'img'>, 'src' | 'alt'> & {
  code: string;
  size?: keyof typeof SIZES;
  // Say what the flag is for ("Flag to find"), or "" when the text next to it already names it.
  alt: string;
};

// A country's flag with the sticker edge. `className` is for layout only.
export function Flag({ code, size = 'md', alt, className, ...props }: FlagProps) {
  return <img {...props} src={flagUrl(code)} alt={alt} className={cx('block object-cover', SIZES[size], className)} />;
}
