import { Link, createFileRoute } from '@tanstack/react-router';
import { FlatMap } from '../../FlatMap';
import { Globe } from '../../Globe';
import { SegmentedSwitch } from '../../ui/SegmentedSwitch';

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
    <div className="box-border h-full bg-page">
      <div className={`relative box-border h-full overflow-hidden ${isGlobe ? 'bg-backdrop' : 'bg-map-sea'}`}>
        {/* Not `ViewSwitch`: here the map is the default and the globe sets `view`. `exact` so the Map link isn't also current on the globe. */}
        <SegmentedSwitch render={<nav aria-label="View" />} className="absolute top-4 left-4 z-3">
          <SegmentedSwitch.Item render={<Link from={Route.fullPath} search={{}} activeProps={{}} activeOptions={{ exact: true }} aria-current={isGlobe ? undefined : 'page'} />}>Map</SegmentedSwitch.Item>
          <SegmentedSwitch.Item render={<Link from={Route.fullPath} search={{ view: 'globe' }} activeProps={{}} activeOptions={{ exact: true }} aria-current={isGlobe ? 'page' : undefined} />}>Globe</SegmentedSwitch.Item>
        </SegmentedSwitch>
        {isGlobe ? <Globe /> : <FlatMap />}
      </div>
    </div>
  );
}
