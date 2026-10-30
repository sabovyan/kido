import type { ReactNode } from 'react';
import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import appCss from '../styles.css?url';
import { ThemeToggle, themeInitScript } from '../ThemeToggle';
import { NavMenu } from '../NavMenu';
import { BookIcon, CompassIcon, FlagIcon, TargetIcon } from '../ui/icons';
import { PillTabs } from '../ui/PillTabs';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
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

function RootLayout() {
  return (
    // `group/app` lets the phone chrome hide itself while a game is being played.
    <div className="group/app isolate flex h-full flex-col bg-page max-md:h-dvh">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-4 border-b-3 border-outline bg-surface px-6 py-3.5 font-body text-fg max-md:box-border max-md:h-18 max-md:flex-nowrap max-md:gap-x-3 max-md:px-4 max-md:py-0 max-md:group-has-[[data-game-active]]/app:hidden">
        <h1 className="m-0 flex items-center gap-2.5 font-display text-title-3 font-extrabold">
          <span className="grid size-11 place-items-center rounded-sm border-3 border-on-sun bg-sun-400 text-on-sun max-md:box-border max-md:size-10">
            <FlagIcon />
          </span>
          <span>Flag Map<span className="max-md:hidden"> of the World</span></span>
        </h1>
        <PillTabs aria-label="Main" className="max-md:hidden">
          <PillTabs.Item render={<Link to="/country/discover" activeProps={{}} />}>
            <CompassIcon />Discover
          </PillTabs.Item>
          <PillTabs.Item render={<Link to="/country/learn" activeProps={{}} />}>
            <BookIcon />Learn
          </PillTabs.Item>
          <PillTabs.Item render={<Link to="/country/games" activeProps={{}} />}>
            <TargetIcon />Games
          </PillTabs.Item>
        </PillTabs>
        <div className="ml-auto flex items-center gap-3">
          {/* Desktop: Flag Hunt portals its score chips here while a game is being played. */}
          <div id="game-hud" className="contents max-md:hidden" />
          <ThemeToggle />
          <NavMenu />
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
