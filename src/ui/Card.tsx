import { useRender } from '@base-ui/react/use-render';
import { cx } from './focus';

const BASE = 'rounded-lg border-3 border-outline bg-surface text-fg shadow-drop-lg';

const PADDINGS = {
  // Question cards over the board.
  sm: 'px-[18px] py-3.5',
  // Game cards: build the flag, find the pairs.
  md: 'p-5',
  // Start and end cards; a little tighter on phones.
  lg: 'p-7 max-md:p-5',
};

export type CardProps = useRender.ComponentProps<'div'> & {
  padding?: keyof typeof PADDINGS;
};

// A sticker card. `render={<section />}` for a card that is a page section; `className` is for layout only.
export function Card({ padding = 'lg', render, className, ref, ...props }: CardProps) {
  return useRender({
    defaultTagName: 'div',
    render,
    ref,
    props: { ...props, className: cx(BASE, PADDINGS[padding], className) },
  });
}
