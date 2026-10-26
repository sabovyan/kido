import { Link, createFileRoute } from '@tanstack/react-router';
import { Game } from '../../game/Game';

type GamesSearch = { view?: 'map' };

export const Route = createFileRoute('/country/games')({
  validateSearch: (search: Record<string, unknown>): GamesSearch =>
    search.view === 'map' ? { view: 'map' } : {},
  head: () => ({ meta: [{ title: 'Games · Country · Flag Map of the World' }] }),
  component: CountryGames,
});

const OPTION = 'inline-flex h-tap-min items-center gap-2 rounded-sm px-4 font-body text-label no-underline transition-colors duration-(--dur-tap) motion-reduce:transition-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500';
const SELECTED = `${OPTION} bg-ocean-500 text-on-ocean`;
const UNSELECTED = `${OPTION} text-fg hover:bg-surface-sunk`;

function ViewSwitch({ isMap, className = '' }: { isMap: boolean; className?: string }) {
  return (
    <nav aria-label="View" className={`inline-flex gap-1 rounded-md border-3 border-outline bg-surface p-1 shadow-drop-sm ${className}`}>
      <Link from={Route.fullPath} search={{ view: 'map' }} activeProps={{}} aria-current={isMap ? 'page' : undefined} className={isMap ? SELECTED : UNSELECTED}>Map</Link>
      <Link from={Route.fullPath} search={{}} activeProps={{}} aria-current={isMap ? undefined : 'page'} className={isMap ? UNSELECTED : SELECTED}>Globe</Link>
    </nav>
  );
}

function CountryGames() {
  const { view } = Route.useSearch();
  const isMap = view === 'map';

  return (
    <div className="relative h-full">
      {/* On phones the switch lives inside the start card instead. */}
      <ViewSwitch isMap={isMap} className="absolute top-4 left-4 z-3 max-md:hidden" />
      <Game view={isMap ? 'map' : 'globe'} viewSwitch={<ViewSwitch isMap={isMap} />} />
    </div>
  );
}
