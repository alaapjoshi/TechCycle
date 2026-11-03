// Renders every page in this folder to ../<name>.png at 2x.
// Usage (from the repo root): npm i --no-save playwright && node docs/images/src/render.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const pages = {
  'cover': [1280, 640],
  'cover-linkedin': [1200, 627],
  'gallery-1': [1600, 1000],
  'gallery-2': [1600, 1000],
  'gallery-3': [1600, 1000],
  'gallery-4': [1600, 1000],
};

const browser = await chromium.launch();
for (const [name, [width, height]] of Object.entries(pages)) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.join(here, `${name}.html`));
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(here, '..', `${name}.png`) });
  await page.close();
}
await browser.close();
