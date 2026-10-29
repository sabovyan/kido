import { createFileRoute } from '@tanstack/react-router';
import { Game } from '../../game/Game';
import { ViewSwitch } from '../../ViewSwitch';

type GamesSearch = { view?: 'map' };

export const Route = createFileRoute('/country/games')({
  validateSearch: (search: Record<string, unknown>): GamesSearch =>
    search.view === 'map' ? { view: 'map' } : {},
  head: () => ({ meta: [{ title: 'Games · Country · Flag Map of the World' }] }),
  component: CountryGames,
});

function CountryGames() {
  const { view } = Route.useSearch();
  const isMap = view === 'map';

  return (
    <div className="relative h-full">
      {/* On phones the switch lives inside the start card instead. */}
      <ViewSwitch from={Route.fullPath} isMap={isMap} className="absolute top-4 left-4 z-3 max-md:hidden" />
      <Game view={isMap ? 'map' : 'globe'} viewSwitch={<ViewSwitch from={Route.fullPath} isMap={isMap} />} />
    </div>
  );
}
