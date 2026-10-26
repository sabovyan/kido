import type { ReactNode } from 'react';
import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import appCss from '../styles.css?url';
import { ThemeToggle, themeInitScript } from '../ThemeToggle';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Flag Map of the World' },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@500;600;700;800;900&display=swap' },
      { rel: 'stylesheet', href: appCss },
    ],
    scripts: [{ children: themeInitScript }],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
});

const NAV_LINK = 'flex h-tap-min items-center gap-2 rounded-pill px-5 text-label text-fg no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500';

function FlagIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
      <path d="M9 4v14" />
      <path d="M15 6v14" />
    </svg>
  );
}

function RootLayout() {
  return (
    <div className="app">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-4 border-b-3 border-outline bg-surface px-6 py-3.5 font-body text-fg">
        <h1 className="m-0 flex items-center gap-2.5 font-display text-title-3 font-extrabold">
          <span className="grid size-11 place-items-center rounded-sm border-3 border-on-sun bg-sun-400 text-on-sun">
            <FlagIcon />
          </span>
          Flag Map of the World
        </h1>
        <nav aria-label="Main" className="flex gap-2 rounded-pill bg-surface-sunk p-1.5">
          <Link to="/country" className={NAV_LINK} activeProps={{ className: 'bg-ocean-500 text-on-ocean' }}>
            <MapIcon />Country
          </Link>
        </nav>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>
      <Outlet />
    </div>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
