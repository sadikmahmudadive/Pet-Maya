// End-to-end check of the /halo page inside the React site.
//   (dev server on :5173)  node tests/responsive/halo-page.mjs [--shots]
// PW_CHANNEL=msedge|chrome uses an installed browser.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5173';
const SHOTS = process.argv.includes('--shots');
const out = fileURLToPath(new URL('./shots/', import.meta.url));
if (SHOTS) await mkdir(out, { recursive: true });

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? '✔' : '✖'} ${msg}`); if (!ok) failures++; };

async function open(width, height, { reducedMotion = 'no-preference' } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion, hasTouch: width < 800, isMobile: width < 600 });
  const page = await ctx.newPage();
  const errors = [], requests = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  page.on('request', (r) => requests.push(r.url()));
  return { ctx, page, errors, requests };
}
const scrollToProgress = (page, p) => page.evaluate((p) => {
  const t = document.querySelector('.halo-track'), s = document.querySelector('.halo-stage');
  const top = t.getBoundingClientRect().top + scrollY;
  const hdr = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
  window.scrollTo(0, top - hdr + p * (t.offsetHeight - s.clientHeight));
}, p);

// 1 — three.js is lazy: not fetched on the home page, fetched on /halo
{
  const { ctx, page, requests } = await open(1440, 900);
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  check(!requests.some((u) => /halo\/scene|three/.test(u)), 'home page does not download three.js');
  await page.goto(BASE + '/halo', { waitUntil: 'load' });
  await page.waitForSelector('.halo-stage canvas', { timeout: 60000 });
  check(requests.some((u) => /halo\/scene|scene-/.test(u)), '/halo downloads the 3D scene on demand');
  await ctx.close();
}

// 2 — desktop and phone: film runs, header stays put, nothing overflows
for (const [name, w, h] of [['desktop', 1440, 900], ['phone', 390, 844], ['tablet', 820, 1180]]) {
  const { ctx, page, errors } = await open(w, h);
  await page.goto(BASE + '/halo', { waitUntil: 'load' });
  await page.waitForSelector('.halo-stage canvas', { timeout: 60000 });
  await page.waitForFunction(() => document.querySelector('.halo-loader')?.classList.contains('done'), null, { timeout: 60000 });
  check(true, `${name}: canvas created and loader dismissed`);

  const hdrTops = [];
  for (const p of [0.02, 0.2, 0.27, 0.4, 0.58, 0.76, 0.97]) {
    await scrollToProgress(page, p);
    await page.waitForTimeout(1500);
    hdrTops.push(await page.evaluate(() => Math.round(document.querySelector('.site-header').getBoundingClientRect().top)));
    const stageTop = await page.evaluate(() => Math.round(document.querySelector('.halo-stage').getBoundingClientRect().top));
    const hdrH = await page.evaluate(() => Math.round(document.querySelector('.site-header').getBoundingClientRect().height));
    if (p > 0.01 && p < 0.99) check(Math.abs(stageTop - hdrH) <= 3, `${name} p=${p}: stage pinned under the header (${stageTop} vs ${hdrH})`);
    if (SHOTS) await page.screenshot({ path: `${out}halo_${name}_${String(Math.round(p * 100)).padStart(3, '0')}.png` });
  }
  check(hdrTops.every((t) => t === 0), `${name}: site header stays pinned (${hdrTops.join(',')})`);

  // caption visible at its peak
  await scrollToProgress(page, 0.19); await page.waitForTimeout(1500);
  const op = await page.evaluate(() => Math.max(...[...document.querySelectorAll('.halo-cap')].map((e) => +e.style.opacity || 0)));
  check(op > 0.9, `${name}: a caption is fully visible mid-film (opacity ${op})`);

  // brand page below + overflow
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(800);
  const sideways = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check(sideways <= 0, `${name}: no sideways overflow (${sideways}px)`);
  const hidden = await page.evaluate(() => [...document.querySelectorAll('.halo .reveal')].filter((e) => !e.classList.contains('in')).length);
  console.log(`   (${hidden} reveal blocks not yet scrolled into view — expected)`);
  check(errors.length === 0, `${name}: no console errors ${errors.slice(0, 2).join(' | ')}`);
  await ctx.close();
}

// 3 — leave and come back with client-side navigation: scene is disposed and rebuilt
{
  const { ctx, page, errors } = await open(1280, 800);
  await page.goto(BASE + '/halo', { waitUntil: 'load' });
  await page.waitForSelector('.halo-stage canvas', { timeout: 60000 });
  await page.click('.site-footer a[href="/gps"]');
  await page.waitForSelector('.halo', { state: 'detached', timeout: 15000 });
  check(true, 'leaving /halo unmounts the page');
  await page.evaluate(() => { history.pushState({}, '', '/halo'); dispatchEvent(new PopStateEvent('popstate')); });
  await page.waitForSelector('.halo-stage canvas', { timeout: 60000 });
  await page.waitForFunction(() => document.querySelector('.halo-loader')?.classList.contains('done'), null, { timeout: 60000 });
  check(await page.evaluate(() => document.querySelectorAll('.halo-stage canvas').length === 1), 're-entering /halo builds exactly one canvas');
  check(errors.length === 0, `navigation round-trip: no console errors ${errors.slice(0, 2).join(' | ')}`);
  await ctx.close();
}

// 4 — no WebGL: still image + full page
{
  const b2 = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined, args: ['--disable-3d-apis', '--disable-gpu', '--disable-webgl'] });
  const page = await b2.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE + '/halo', { waitUntil: 'load' });
  await page.waitForSelector('.halo.nogl', { timeout: 30000 });
  check(await page.evaluate(() => !!document.querySelector('.halo-poster') && document.querySelector('.halo-poster').naturalWidth > 0), 'no-WebGL: still image shown');
  check(errors.length === 0, `no-WebGL: no uncaught errors ${errors.join('|')}`);
  await b2.close();
}

await browser.close();
console.log(failures ? `\n${failures} failure(s)` : '\nAll /halo checks passed.');
process.exit(failures ? 1 : 0);
