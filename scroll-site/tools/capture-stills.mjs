// Renders the stills used below the film (hero, halo, exploded, signal, buckle, weave)
// straight from the 3D scene, so the page needs no downloaded or generated images.
//   (serve the folder, e.g. python -m http.server 4199)  node tools/capture-stills.mjs
//   then: python tools/to_webp.py   (PNG → WebP)
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE = process.env.SITE_URL || 'http://127.0.0.1:4199/';
const NAMES = (process.argv[2] || 'hero,halo,exploded,signal,buckle,weave').split(',');
const out = fileURLToPath(new URL('../img/', import.meta.url));
await mkdir(out, { recursive: true });

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
for (const name of NAMES) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.goto(`${BASE}?shot=${name}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 60000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}${name}.png` });
  console.log('rendered', name);
  await page.close();
}
await browser.close();
