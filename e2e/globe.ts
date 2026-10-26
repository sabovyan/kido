import { expect, type Page } from '@playwright/test';

export type Band = { x: number; y: number; width: number; height: number };

// Opens the Discover globe and returns a horizontal band through the middle of it.
export async function openGlobe(page: Page): Promise<Band> {
  await page.goto('/country/discover?view=globe');
  await expect(page.getByText('Loading flags…')).toBeHidden({ timeout: 30_000 });
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('globe canvas not found');
  return { x: box.x, y: box.y + box.height / 2 - 60, width: box.width, height: 120 };
}

// Wheels in until the camera sits at its closest distance.
export async function zoomAllTheWayIn(page: Page, band: Band) {
  await page.mouse.move(band.x + band.width / 2, band.y + band.height / 2);
  for (let i = 0; i < 40; i++) await page.mouse.wheel(0, -120);
}

// Waits for the damped rotation to stop, then captures the band.
export async function settledShot(page: Page, band: Band) {
  let prev = await page.screenshot({ clip: band, scale: 'css' });
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(250);
    const next = await page.screenshot({ clip: band, scale: 'css' });
    if (next.equals(prev)) return next;
    prev = next;
  }
  throw new Error('globe never stopped moving');
}

// How far (CSS px) the middle of the band moved sideways between two shots; negative is left.
export function horizontalShift(page: Page, before: Buffer, after: Buffer) {
  return page.evaluate(async ([a, b]) => {
    const gray = async (png: string) => {
      const img = await createImageBitmap(await (await fetch(`data:image/png;base64,${png}`)).blob());
      const ctx = new OffscreenCanvas(img.width, img.height).getContext('2d');
      if (!ctx) throw new Error('no 2d context');
      ctx.drawImage(img, 0, 0);
      const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);
      const g = new Float32Array(width * height);
      for (let i = 0; i < g.length; i++) g[i] = data[i * 4] * 0.3 + data[i * 4 + 1] * 0.59 + data[i * 4 + 2] * 0.11;
      return { g, width, height };
    };
    const A = await gray(a), B = await gray(b);
    const { width, height } = A;
    let best = 0, bestDiff = Infinity;
    for (let s = -200; s <= 200; s++) {
      let sum = 0, n = 0;
      for (let y = 0; y < height; y++) {
        for (let x = Math.floor(width / 4); x < Math.floor((3 * width) / 4); x++) {
          if (x + s < 0 || x + s >= width) continue;
          sum += Math.abs(A.g[y * width + x] - B.g[y * width + x + s]);
          n++;
        }
      }
      if (sum / n < bestDiff) { bestDiff = sum / n; best = s; }
    }
    return best;
  }, [before.toString('base64'), after.toString('base64')] as const);
}
