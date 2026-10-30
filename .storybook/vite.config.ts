import { defineConfig } from 'vite';

import viteReact from '@vitejs/plugin-react';

import tailwindcss from '@tailwindcss/vite';

// Kept apart from vite.config.ts so Storybook skips the Cloudflare and Start plugins.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), viteReact()],
});
