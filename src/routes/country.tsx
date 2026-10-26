import { Link, Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/country')({
  component: CountryLayout,
});

const SUB_LINK = 'flex h-tap-min items-center rounded-pill border-3 px-[18px] text-label no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500';
const SUB_ACTIVE = { className: 'border-on-sun bg-sun-400 text-on-sun' };
const SUB_INACTIVE = { className: 'border-outline bg-surface text-fg' };

function CountryLayout() {
  return (
    <div className="section">
      <nav aria-label="Country" className="flex flex-wrap items-center gap-3 bg-page px-6 py-3.5 font-body">
        <Link to="/country/discover" className={SUB_LINK} activeProps={SUB_ACTIVE} inactiveProps={SUB_INACTIVE}>Discover</Link>
        <Link to="/country/games" className={SUB_LINK} activeProps={SUB_ACTIVE} inactiveProps={SUB_INACTIVE}>Games</Link>
      </nav>
      <main className="stage">
        <Outlet />
      </main>
    </div>
  );
}
