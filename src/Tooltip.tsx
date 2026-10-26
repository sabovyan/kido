import { flagUrl, type CountryProps } from './countries';

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
      {code && <img src={flagUrl(code)} alt="" className="block h-6 w-9 rounded-[6px] border-2 border-on-sun object-cover" />}
      {name}
    </div>
  );
}

function XIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
    </svg>
  );
}

// The tapped country, shown at the bottom of the map on touch screens.
export function CountryCard({ country, onClose }: { country: CountryProps | null; onClose: () => void }) {
  if (!country) return null;
  const { name, code } = country;
  return (
    <output className="absolute inset-x-3 bottom-4 z-3 flex items-center gap-3 rounded-lg border-3 border-outline bg-surface p-3.5 font-body text-fg shadow-drop-lg">
      {code && <img src={flagUrl(code)} alt="" className="block h-16 w-24 shrink-0 rounded-[10px] border-3 border-outline object-cover" />}
      <span className="min-w-0 flex-1 font-display text-title-2">{name}</span>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="grid size-tap-min shrink-0 cursor-pointer place-items-center rounded-md border-3 border-outline bg-surface p-0 text-fg shadow-drop-sm transition-transform duration-(--dur-tap) active:translate-y-1 active:shadow-none motion-reduce:transition-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500"
      >
        <XIcon />
      </button>
    </output>
  );
}

const ZOOM_BUTTON = 'grid size-tap-min cursor-pointer place-items-center rounded-sm border-0 bg-transparent p-0 text-fg transition-colors duration-(--dur-tap) motion-reduce:transition-none hover:bg-surface-sunk active:bg-surface-sunk focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500';

// Phones only: many kids don't know pinch. One sticker holding both buttons.
export function ZoomButtons({ onZoom }: { onZoom: (factor: number) => void }) {
  return (
    <div className="absolute top-4 right-4 z-3 flex flex-col gap-1 rounded-md border-3 border-outline bg-surface p-1 shadow-drop-sm md:hidden">
      <button type="button" aria-label="Zoom in" onClick={() => onZoom(1.6)} className={ZOOM_BUTTON}><PlusIcon /></button>
      <button type="button" aria-label="Zoom out" onClick={() => onZoom(1 / 1.6)} className={ZOOM_BUTTON}><MinusIcon /></button>
    </div>
  );
}
