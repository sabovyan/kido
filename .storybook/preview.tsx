import type { Decorator, Preview } from '@storybook/react-vite';
import { DecoratorHelpers, withThemeByDataAttribute } from '@storybook/addon-themes';
import { RouterProvider, createMemoryHistory, createRootRoute, createRouter } from '@tanstack/react-router';
import '../src/styles.css';

const THEMES = { Day: 'light', Night: 'dark' };
const DEFAULT_THEME = 'Day';

// The addon sets html[data-theme] in an effect, after the story has mounted and painted in Day.
// Set it first, as themeInitScript does in the app, so ThemeToggle reads the right theme on mount.
const withThemeBeforeMount: Decorator = (Story, context) => {
  const theme = DecoratorHelpers.pluckThemeFromContext(context) || DEFAULT_THEME;
  document.documentElement.dataset.theme = THEMES[theme as keyof typeof THEMES];
  return <Story />;
};

// A memory-history router whose root route is the story, so `<Link>` works.
// Stories pick the current page with `parameters: { router: { path: '/country/learn' } }`.
// A new router per render also remounts the story when the theme changes.
// RouterProvider only loads the router it first mounted with, so key it to mount fresh for each new router;
// otherwise a re-render (theme, viewport, controls) leaves it with an unloaded router and an empty canvas.
let routerKey = 0;
const withRouter: Decorator = (Story, { parameters }) => {
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [parameters.router?.path ?? '/'] }),
    routeTree: createRootRoute({
      component: () => (
        <div className="min-h-dvh bg-page p-4 font-body text-fg">
          <Story />
        </div>
      ),
    }),
  });
  return <RouterProvider key={++routerKey} router={router} />;
};

const preview: Preview = {
  decorators: [
    withRouter,
    withThemeBeforeMount,
    withThemeByDataAttribute({
      themes: THEMES,
      defaultTheme: DEFAULT_THEME,
      attributeName: 'data-theme',
      parentSelector: 'html',
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    // The page colour comes from bg-page, so it follows Day / Night.
    backgrounds: { disable: true },
    viewport: {
      options: {
        phone: { name: 'Phone', styles: { width: '375px', height: '812px' }, type: 'mobile' },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' }, type: 'tablet' },
        desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' }, type: 'desktop' },
      },
    },
  },
};

export default preview;
