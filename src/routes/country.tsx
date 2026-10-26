import { Link, Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/country')({
  component: CountryLayout,
});

const SUB_LINK = 'flex h-tap-min items-center rounded-pill border-3 px-[18px] text-label no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500';
const SUB_ACTIVE = { className: 'border-on-sun bg-sun-400 text-on-sun' };
const SUB_INACTIVE = { className: 'border-outline bg-surface text-fg' };

// Phone tab bar: one sticker, the tabs inside are borderless and only the selected one is filled.
const TAB_LINK = 'flex h-tap-icon flex-1 items-center justify-center gap-2 rounded-pill text-label no-underline transition-colors duration-(--dur-tap) motion-reduce:transition-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500';
const TAB_ACTIVE = { className: 'bg-ocean-500 text-on-ocean' };
const TAB_INACTIVE = { className: 'text-fg hover:bg-surface-sunk' };

function CompassIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

function CountryLayout() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav aria-label="Country" className="flex flex-wrap items-center gap-3 bg-page px-6 py-3.5 font-body max-md:hidden">
        <Link to="/country/discover" className={SUB_LINK} activeProps={SUB_ACTIVE} inactiveProps={SUB_INACTIVE}>Discover</Link>
        <Link to="/country/games" className={SUB_LINK} activeProps={SUB_ACTIVE} inactiveProps={SUB_INACTIVE}>Games</Link>
      </nav>
      <main className="relative min-h-0 flex-1 overflow-hidden bg-page">
        <Outlet />
      </main>
      <nav aria-label="Country" className="border-t-3 border-outline bg-page px-4 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] font-body md:hidden group-has-[[data-game-active]]/app:hidden">
        <div className="flex gap-1 rounded-pill border-3 border-outline bg-surface p-1 shadow-drop-md">
          <Link to="/country/discover" className={TAB_LINK} activeProps={TAB_ACTIVE} inactiveProps={TAB_INACTIVE}><CompassIcon />Discover</Link>
          <Link to="/country/games" className={TAB_LINK} activeProps={TAB_ACTIVE} inactiveProps={TAB_INACTIVE}><TargetIcon />Games</Link>
        </div>
      </nav>
    </div>
  );
}
