import type { CountryProps } from './countries';
import { Flag } from './ui/Flag';
import { FOCUS_RING } from './ui/focus';
import { IconButton } from './ui/IconButton';
import { MinusIcon, PlusIcon, XIcon } from './ui/icons';

export type TipState = { x: number; y: number; country: CountryProps } | null;

// A tap (touch or pen) opens the country card; a mouse keeps the hover tooltip.
export function isTouch(e: MouseEvent) {
  const type = (e as PointerEvent).pointerType;
  return type ? type !== 'mouse' : window.matchMedia('(hover: none)').matches;
}

export function Tooltip({ tip }: { tip: TipState }) {
  if (!tip) return null;
  const { name, code } = tip.country;
  return (
    <div
      className="pointer-events-none fixed z-10 flex items-center gap-2.5 rounded-sm border-3 border-outline bg-surface py-2 pr-3.5 pl-2 font-body text-label text-fg shadow-drop-sm"
      style={{ left: tip.x + 12, top: tip.y + 12 }}
    >
      {code && <Flag code={code} size="xs" alt="" />}
      {name}
    </div>
  );
}

// The tapped country, shown at the bottom of the map on touch screens.
export function CountryCard({ country, onClose }: { country: CountryProps | null; onClose: () => void }) {
  if (!country) return null;
  const { name, code } = country;
  return (
    <output className="absolute inset-x-3 bottom-4 z-3 flex items-center gap-3 rounded-lg border-3 border-outline bg-surface p-3.5 font-body text-fg shadow-drop-lg">
      {code && <Flag code={code} size="md" alt="" />}
      <span className="min-w-0 flex-1 font-display text-title-2">{name}</span>
      <IconButton size="sm" aria-label="Close" onClick={onClose}>
        <XIcon />
      </IconButton>
    </output>
  );
}

const ZOOM_BUTTON = `grid size-tap-min cursor-pointer place-items-center rounded-sm border-0 bg-transparent p-0 text-fg transition-colors duration-(--dur-tap) motion-reduce:transition-none hover:bg-surface-sunk active:bg-surface-sunk ${FOCUS_RING}`;

// Phones only: many kids don't know pinch. One sticker holding both buttons.
export function ZoomButtons({ onZoom }: { onZoom: (factor: number) => void }) {
  return (
    <div className="absolute top-4 right-4 z-3 flex flex-col gap-1 rounded-md border-3 border-outline bg-surface p-1 shadow-drop-sm md:hidden">
      <button type="button" aria-label="Zoom in" onClick={() => onZoom(1.6)} className={ZOOM_BUTTON}><PlusIcon /></button>
      <button type="button" aria-label="Zoom out" onClick={() => onZoom(1 / 1.6)} className={ZOOM_BUTTON}><MinusIcon /></button>
    </div>
  );
}
