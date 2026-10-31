import { afterEach, beforeEach, expect, vi } from 'vitest';
import { page } from 'vitest/browser';

// The same "random" numbers on every run (the jigsaw shuffles its pieces), so screenshots repeat.
beforeEach(() => {
  let seed = 1;
  vi.spyOn(Math, 'random').mockImplementation(() => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  });
});

// After each story has rendered (loaders and play function done), compare the page with its
// reference screenshot. Stories tagged `no-screenshot` are left out in vitest.storybook.config.ts.
afterEach(async () => {
  // Web fonts and flag images come from the network; wait for them before the first capture.
  await document.fonts.ready;
  await Promise.all([...document.images].map(img => img.decode().catch(() => {})));

  await expect.element(page.elementLocator(document.body)).toMatchScreenshot();
});
