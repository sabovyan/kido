import { defineConfig } from 'vitest/config'

// Kept apart from vite.config.ts so unit tests skip the Cloudflare and Start plugins.
export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
})
