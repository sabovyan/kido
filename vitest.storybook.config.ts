import path from 'node:path'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

// Visual regression: every story rendered in a real browser and compared with its reference
// screenshot, in Day and Night, on phone and desktop. Kept apart from vitest.config.ts so
// `bun run test` stays plain unit tests.
//
// References are made in the Playwright Linux image (`bun run test:visual:update`) and CI
// compares in the same image (`bun run test:visual:docker`), so fonts render the same.
// `bun run test:visual` runs on this machine against its own, uncommitted references.

const THEMES = ['Day', 'Night']
const VIEWPORTS = ['phone', 'desktop']

const SCREENSHOTS = '.storybook/__screenshots__'

export default defineConfig({
  test: {
    projects: THEMES.flatMap(theme =>
      VIEWPORTS.map(viewport => {
        const name = `${theme.toLowerCase()}-${viewport}`
        return {
          extends: './.storybook/vite.config.ts',
          plugins: [
            storybookTest({
              configDir: '.storybook',
              initialGlobals: { theme, viewport: { value: viewport } },
              // The globe: its WebGL output differs between machines, and it can crash headless Chromium.
              tags: { exclude: ['no-screenshot'] },
            }),
          ],
          test: {
            name,
            setupFiles: ['.storybook/vitest.setup.ts'],
            browser: {
              enabled: true,
              headless: true,
              provider: playwright(),
              // Named after the project, so screenshot files read `…-day-phone-linux.png`.
              instances: [{ browser: 'chromium' as const, name }],
              // toMatchScreenshot writes its own diffs; skip the extra failure screenshots next to each story file.
              screenshotFailures: false,
              expect: {
                toMatchScreenshot: {
                  // Flag SVGs flip a pixel or two between runs; a real change touches far more.
                  comparatorName: 'pixelmatch',
                  comparatorOptions: { allowedMismatchedPixels: 10 },
                  // One folder for all references, one file per story, project and platform.
                  resolveScreenshotPath: ({ arg, ext, root, testFileDirectory, testFileName, platform, project }) =>
                    path.join(root, SCREENSHOTS, testFileDirectory, testFileName, `${arg}-${project.name}-${platform}${ext}`),
                  resolveDiffPath: ({ arg, ext, root, attachmentsDir, testFileDirectory, testFileName, platform, project }) =>
                    path.join(root, attachmentsDir, testFileDirectory, testFileName, `${arg}-${project.name}-${platform}${ext}`),
                },
              },
            },
          },
        }
      }),
    ),
  },
})
