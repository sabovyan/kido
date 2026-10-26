import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/country')({
  component: CountryLayout,
});

function CountryLayout() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="relative min-h-0 flex-1 overflow-hidden bg-page">
        <Outlet />
      </main>
    </div>
  );
}
