import { Link } from '@tanstack/react-router';

const OPTION = 'inline-flex h-tap-min items-center gap-2 rounded-sm px-4 font-body text-label no-underline transition-colors duration-(--dur-tap) motion-reduce:transition-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500';
const SELECTED = `${OPTION} bg-ocean-500 text-on-ocean`;
const UNSELECTED = `${OPTION} text-fg hover:bg-surface-sunk`;

// Map / Globe switch for a game page. Keeps the page's other search params (Learn's `codes`).
export function ViewSwitch({ from, isMap, className = '' }: { from: '/country/games' | '/country/learn'; isMap: boolean; className?: string }) {
  return (
    <nav aria-label="View" className={`inline-flex gap-1 rounded-md border-3 border-outline bg-surface p-1 shadow-drop-sm ${className}`}>
      <Link from={from} search={prev => ({ ...prev, view: 'map' })} activeProps={{}} aria-current={isMap ? 'page' : undefined} className={isMap ? SELECTED : UNSELECTED}>Map</Link>
      <Link from={from} search={prev => ({ ...prev, view: undefined })} activeProps={{}} aria-current={isMap ? undefined : 'page'} className={isMap ? UNSELECTED : SELECTED}>Globe</Link>
    </nav>
  );
}
