import { defineConfig, devices } from '@playwright/test'

// Runs against the dev server you already have on :3000 (`npm run dev`).
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:3000' },
  projects: [
    { name: 'mobile', testMatch: /touch\.spec\.ts/, use: { ...devices['Pixel 7'] } },
    { name: 'desktop', testMatch: /mouse\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
  ],
})
