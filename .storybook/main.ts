import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-themes', '@storybook/addon-a11y'],
  // Boards load /countries.geojson.
  staticDirs: ['../public'],
  core: {
    // Not the app's vite.config.ts: the Cloudflare and Start plugins break outside the app.
    builder: { name: '@storybook/builder-vite', options: { viteConfigPath: '.storybook/vite.config.ts' } },
  },
};

export default config;
