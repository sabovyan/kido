import { useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Learn } from '../../game/Learn';
import { parseCodes } from '../../game/learnSession';
import { ViewSwitch } from '../../ViewSwitch';

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

function CountryLearn() {
  const { view, codes } = Route.useSearch();
  const isMap = view === 'map';
  const huntCodes = useMemo(() => parseCodes(codes), [codes]);

  return (
    <div className="relative h-full">
      {/* On phones the switch lives inside the start card instead. */}
      <ViewSwitch from={Route.fullPath} isMap={isMap} className="absolute top-4 left-4 z-3 max-md:hidden" />
      <Learn view={isMap ? 'map' : 'globe'} viewSwitch={<ViewSwitch from={Route.fullPath} isMap={isMap} />} codes={huntCodes} />
    </div>
  );
}
