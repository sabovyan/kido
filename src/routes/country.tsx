import { Link, Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/country')({
  component: CountryLayout,
});

function CountryLayout() {
  return (
    <div className="section">
      <nav className="subbar">
        <Link to="/country/discover" activeProps={{ className: 'active' }}>Discover</Link>
        <Link to="/country/games" activeProps={{ className: 'active' }}>Games</Link>
      </nav>
      <main className="stage">
        <Outlet />
      </main>
    </div>
  );
}
