import { expect, test } from '@playwright/test';
import { TOUCH_GAIN } from '../src/globeRotate';
import { horizontalShift, openGlobe, settledShot } from './globe';

test('a touch drag moves the globe about TOUCH_GAIN times as far as the finger', async ({ page }) => {
  expect(await page.evaluate(() => matchMedia('(hover: none)').matches), 'device should count as touch').toBe(true);
  const band = await openGlobe(page);
  const before = await settledShot(page, band);

  // Real touch input, so OrbitControls sees pointerType "touch".
  const cdp = await page.context().newCDPSession(page);
  const x = band.x + band.width / 2, y = band.y + band.height / 2, dx = 60;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 6; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - (dx * i) / 6, y }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  const shift = await horizontalShift(page, before, await settledShot(page, band));
  // The surface runs TOUCH_GAIN times ahead of the finger.
  expect(shift).toBeLessThan(-dx * TOUCH_GAIN * 0.7);
  expect(shift).toBeGreaterThan(-dx * TOUCH_GAIN * 1.3);
});
