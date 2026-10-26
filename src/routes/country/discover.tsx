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

function CountryDiscover() {
  const { view } = Route.useSearch();
  const isGlobe = view === 'globe';

  return (
    <div className={`view ${isGlobe ? 'globe' : 'map'}`}>
      <div className="view-toggle">
        <Link from={Route.fullPath} search={{}} activeProps={{}} className={isGlobe ? '' : 'active'}>Map</Link>
        <Link from={Route.fullPath} search={{ view: 'globe' }} activeProps={{}} className={isGlobe ? 'active' : ''}>Globe</Link>
      </div>
      {isGlobe ? <Globe /> : <FlatMap />}
    </div>
  );
}
