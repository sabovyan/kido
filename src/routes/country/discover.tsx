import { Link, createFileRoute } from '@tanstack/react-router';
import { FlatMap } from '../../FlatMap';
import { Globe } from '../../Globe';

type DiscoverSearch = { view?: 'globe' };

export const Route = createFileRoute('/country/discover')({
  validateSearch: (search: Record<string, unknown>): DiscoverSearch =>
    search.view === 'globe' ? { view: 'globe' } : {},
  head: () => ({ meta: [{ title: 'Discover · Country · Flag Map of the World' }] }),
  component: CountryDiscover,
});

const OPTION = 'inline-flex h-tap-min items-center gap-2 rounded-sm px-4 font-body text-label no-underline transition-colors duration-(--dur-tap) motion-reduce:transition-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500';
const SELECTED = `${OPTION} bg-ocean-500 text-on-ocean`;
const UNSELECTED = `${OPTION} text-fg hover:bg-surface-sunk`;

function CountryDiscover() {
  const { view } = Route.useSearch();
  const isGlobe = view === 'globe';

  return (
    <div className="box-border h-full bg-page">
      <div className={`relative box-border h-full overflow-hidden ${isGlobe ? 'bg-backdrop' : 'bg-map-sea'}`}>
        <nav aria-label="View" className="absolute top-4 left-4 z-3 inline-flex gap-1 rounded-md border-3 border-outline bg-surface p-1 shadow-drop-sm">
          <Link from={Route.fullPath} search={{}} activeProps={{}} aria-current={isGlobe ? undefined : 'page'} className={isGlobe ? UNSELECTED : SELECTED}>Map</Link>
          <Link from={Route.fullPath} search={{ view: 'globe' }} activeProps={{}} aria-current={isGlobe ? 'page' : undefined} className={isGlobe ? SELECTED : UNSELECTED}>Globe</Link>
        </nav>
        {isGlobe ? <Globe /> : <FlatMap />}
      </div>
    </div>
  );
}
