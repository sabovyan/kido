import { Link, createFileRoute } from '@tanstack/react-router';
import { Game } from '../../game/Game';
import gameCss from '../../game/game.css?url';

type GamesSearch = { view?: 'map' };

export const Route = createFileRoute('/country/games')({
  validateSearch: (search: Record<string, unknown>): GamesSearch =>
    search.view === 'map' ? { view: 'map' } : {},
  head: () => ({
    meta: [{ title: 'Games · Country · Flag Map of the World' }],
    links: [{ rel: 'stylesheet', href: gameCss }],
  }),
  component: CountryGames,
});

function CountryGames() {
  const { view } = Route.useSearch();
  const isMap = view === 'map';

  return (
    <div className="view">
      <div className="view-toggle">
        <Link from={Route.fullPath} search={{ view: 'map' }} activeProps={{}} className={isMap ? 'active' : ''}>Map</Link>
        <Link from={Route.fullPath} search={{}} activeProps={{}} className={isMap ? '' : 'active'}>Globe</Link>
      </div>
      <Game view={isMap ? 'map' : 'globe'} />
    </div>
  );
}
