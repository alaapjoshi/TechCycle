// Renders every page in this folder to ../<name>.png at 2x.
// See ../README.md for an isolated rendering setup.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  const renderingRequire = createRequire(path.join(here, '../../../node_modules/.render-tools/package.json'));
  ({ chromium } = renderingRequire('playwright'));
}
const pages = {
  'cover': [1280, 640],
  'cover-linkedin': [1200, 627],
  'gallery-1': [1600, 1000],
  'gallery-2': [1600, 1000],
  'gallery-3': [1600, 1000],
  'gallery-4': [1600, 1000],
  'gallery-5': [1600, 1000],
  'gallery-6': [1600, 1000],
};

const browser = await chromium.launch({
  ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}),
});
for (const [name, [width, height]] of Object.entries(pages)) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.join(here, `${name}.html`));
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  if (!await page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0))) {
    throw new Error(`Missing image in ${name}.html`);
  }
  await page.screenshot({ path: path.join(here, '..', `${name}.png`) });
  await page.close();
}
await browser.close();
