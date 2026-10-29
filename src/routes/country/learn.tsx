import { useMemo } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { Learn } from '../../game/Learn';
import { parseCodes } from '../../game/learnSession';

// `codes`: the countries Flag Hunt's "Learn these" sends, e.g. "fr,de".
type LearnSearch = { view?: 'map'; codes?: string };

export const Route = createFileRoute('/country/learn')({
  validateSearch: (search: Record<string, unknown>): LearnSearch => ({
    ...(search.view === 'map' ? { view: 'map' } : {}),
    ...(typeof search.codes === 'string' ? { codes: search.codes } : {}),
  }),
  head: () => ({ meta: [{ title: 'Learn · Country · Flag Map of the World' }] }),
  component: CountryLearn,
});

const OPTION = 'inline-flex h-tap-min items-center gap-2 rounded-sm px-4 font-body text-label no-underline transition-colors duration-(--dur-tap) motion-reduce:transition-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500';
const SELECTED = `${OPTION} bg-ocean-500 text-on-ocean`;
const UNSELECTED = `${OPTION} text-fg hover:bg-surface-sunk`;

function ViewSwitch({ isMap, className = '' }: { isMap: boolean; className?: string }) {
  return (
    <nav aria-label="View" className={`inline-flex gap-1 rounded-md border-3 border-outline bg-surface p-1 shadow-drop-sm ${className}`}>
      <Link from={Route.fullPath} search={prev => ({ ...prev, view: 'map' })} activeProps={{}} aria-current={isMap ? 'page' : undefined} className={isMap ? SELECTED : UNSELECTED}>Map</Link>
      <Link from={Route.fullPath} search={prev => ({ ...prev, view: undefined })} activeProps={{}} aria-current={isMap ? undefined : 'page'} className={isMap ? UNSELECTED : SELECTED}>Globe</Link>
    </nav>
  );
}

function CountryLearn() {
  const { view, codes } = Route.useSearch();
  const isMap = view === 'map';
  const huntCodes = useMemo(() => parseCodes(codes), [codes]);

  return (
    <div className="relative h-full">
      {/* On phones the switch lives inside the start card instead. */}
      <ViewSwitch isMap={isMap} className="absolute top-4 left-4 z-3 max-md:hidden" />
      <Learn view={isMap ? 'map' : 'globe'} viewSwitch={<ViewSwitch isMap={isMap} />} codes={huntCodes} />
    </div>
  );
}
