import { expect, type Page, test } from '@playwright/test';
import { type Band, horizontalShift, openGlobe, settledShot, zoomAllTheWayIn } from './globe';

async function mouseDrag(page: Page, band: Band, dx: number) {
  const x = band.x + band.width / 2, y = band.y + band.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - dx, y, { steps: 6 });
  await page.mouse.up();
  // Off the globe, so the hover tooltip doesn't end up in the shot.
  await page.mouse.move(0, 0);
}

// rotateSpeed 1 at the starting zoom turns the surface ~3.8x further than the mouse moved.
test('a mouse drag keeps the default OrbitControls speed', async ({ page }) => {
  const band = await openGlobe(page);
  const before = await settledShot(page, band);
  const dx = 30;
  await mouseDrag(page, band, dx);

  const shift = await horizontalShift(page, before, await settledShot(page, band));
  expect(shift).toBeLessThan(-dx * 2.5);
});

test('zoomed all the way in, a mouse drag moves the surface as much as at the start', async ({ page }) => {
  const band = await openGlobe(page);
  await zoomAllTheWayIn(page, band);
  await page.mouse.move(0, 0);
  const before = await settledShot(page, band);
  const dx = 10;
  await mouseDrag(page, band, dx);

  const shift = await horizontalShift(page, before, await settledShot(page, band));
  // Before the fix this flung the surface ~38x further than the mouse moved.
  expect(shift).toBeLessThan(-dx * 2.5);
  expect(shift).toBeGreaterThan(-dx * 5.5);
});
