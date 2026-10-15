// Maya Halo on the home page: a full-screen, scroll-driven product breakdown.
//   (dev server)  AUDIT_BASE_URL=http://127.0.0.1:5174 node tests/responsive/halo-home.mjs [--shots]
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5173';
const SHOTS = process.argv.includes('--shots');
const out = fileURLToPath(new URL('./shots/', import.meta.url));
if (SHOTS) await mkdir(out, { recursive: true });

const STEPS = 7, STEP_FROM = 0.28, STEP_LEN = 0.085;
const stepCentre = (k) => STEP_FROM + STEP_LEN * (k + 0.5);

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? '✔' : '✖'} ${msg}`); if (!ok) failures++; };

async function open(width, height, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: width < 800, isMobile: width < 600, ...opts });
  const page = await ctx.newPage();
  const errors = [], requests = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  page.on('request', (r) => requests.push(r.url()));
  return { ctx, page, errors, requests };
}
// jump to fraction s of the pinned section (the page's own smooth scrolling is bypassed)
const toS = (page, s) => page.evaluate((s) => {
  document.documentElement.style.scrollBehavior = 'auto';
  const t = document.querySelector('.hxf-track');
  const top = t.getBoundingClientRect().top + scrollY;
  window.scrollTo(0, top + s * (t.offsetHeight - innerHeight));
}, s);
const settle = (page, ms = 2200) => page.waitForTimeout(ms);
const live = (page) => page.waitForFunction(() => document.querySelector('.hxf')?.classList.contains('hxf-live'), null, { timeout: 90000 });

// 1 — lazy
{
  const { ctx, page, requests } = await open(1440, 900);
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForSelector('.hxf', { state: 'attached', timeout: 30000 });
  await page.waitForTimeout(1500);
  check(!requests.some((u) => /halo\/scene|scene-/.test(u)), 'home: the 3D scene is not downloaded while the section is far below');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const t = document.querySelector('.hxf-track'); window.scrollTo(0, t.getBoundingClientRect().top + scrollY - innerHeight * 0.8); });
  await page.waitForSelector('.hxf-stage canvas', { timeout: 60000 });
  check(requests.some((u) => /halo\/scene|scene-/.test(u)), 'home: the 3D scene downloads when the section nears the screen');
  await ctx.close();
}

// 2 — the breakdown, per device
for (const [name, w, h] of [['desktop', 1440, 900], ['tablet', 820, 1180], ['phone', 390, 844]]) {
  const { ctx, page, errors } = await open(w, h);
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForSelector('.hxf', { state: 'attached', timeout: 30000 });
  await toS(page, 0.0);
  await page.waitForSelector('.hxf-stage canvas', { timeout: 60000 });
  await live(page);

  // full screen: the stage fills the viewport and sits above the site header
  await toS(page, 0.5); await settle(page, 1500);
  const geo = await page.evaluate(() => {
    const r = document.querySelector('.hxf-stage').getBoundingClientRect();
    const hdr = document.querySelector('.site-header').getBoundingClientRect();
    const hit = document.elementFromPoint(innerWidth / 2, Math.max(2, hdr.height / 2));
    return { top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), vw: innerWidth, vh: innerHeight, overHeader: !!hit?.closest('.hxf-stage') };
  });
  check(geo.top === 0 && geo.w === geo.vw && Math.abs(geo.h - geo.vh) <= 1, `${name}: pinned full screen (${geo.w}×${geo.h} in ${geo.vw}×${geo.vh})`);
  check(geo.overHeader, `${name}: covers the site header while pinned`);

  // captions
  const opacityOf = (sel) => page.evaluate((sel) => +document.querySelector(sel)?.style.opacity || 0, sel);
  await toS(page, 0.04); await settle(page, 1800);
  check(await page.evaluate(() => +document.querySelector('.hxf-cap').style.opacity) > 0.9, `${name}: opening caption "Meet Maya Halo" at the start`);
  const shotA = await page.screenshot();
  await toS(page, 0.2); await settle(page);
  check(await page.evaluate(() => +document.querySelectorAll('.hxf-cap')[1].style.opacity) > 0.9, `${name}: "Take it apart" caption while it explodes`);
  const shotB = await page.screenshot();
  check(Buffer.compare(shotA, shotB) !== 0, `${name}: the collar changes between assembled and exploded`);
  if (SHOTS) { await page.screenshot({ path: `${out}hxf_${name}_explode.png` }); }

  // each part: its card is the only one visible and its leader line points at the part, inside the screen
  for (let k = 0; k < STEPS; k++) {
    await toS(page, stepCentre(k)); await settle(page, 2300);
    const info = await page.evaluate((k) => {
      const cards = [...document.querySelectorAll('.hxf-card')];
      const ops = cards.map((c) => +c.style.opacity || 0);
      const line = document.querySelectorAll('.hxf-lines line')[k];
      const dot = document.querySelectorAll('.hxf-lines circle')[k];
      const cx = +dot.getAttribute('cx'), cy = +dot.getAttribute('cy');
      const cr = cards[k].getBoundingClientRect();
      const title = cards[k].querySelector('h3').textContent;
      return { ops, lineOp: +line.style.opacity, dotOp: +dot.style.opacity, cx, cy, vw: innerWidth, vh: innerHeight, cardInside: cr.left >= -1 && cr.right <= innerWidth + 1 && cr.top >= -1 && cr.bottom <= innerHeight + 1, title };
    }, k);
    const only = info.ops.every((o, i) => (i === k ? o > 0.9 : o < 0.1));
    check(only, `${name} step ${k + 1} "${info.title}": only its card is visible`);
    check(info.lineOp > 0.5 && info.dotOp > 0.9 && info.cx > 0 && info.cx < info.vw && info.cy > 0 && info.cy < info.vh, `${name} step ${k + 1}: leader line points at the part on screen (${Math.round(info.cx)},${Math.round(info.cy)})`);
    check(info.cardInside, `${name} step ${k + 1}: card fits on screen`);
    if (SHOTS) await page.screenshot({ path: `${out}hxf_${name}_step${k + 1}.png` });
  }

  // reassembled + closing
  await toS(page, 0.985); await settle(page);
  const fin = await page.evaluate(() => { const f = document.querySelector('.hxf-cap.finale'); return { op: +f.style.opacity, links: [...f.querySelectorAll('a')].map((a) => a.getAttribute('href')) }; });
  check(fin.op > 0.9 && fin.links.includes('/halo') && fin.links.includes('/shop/smart-gear'), `${name}: closing message with both buttons (${fin.links.join(', ')})`);
  if (SHOTS) await page.screenshot({ path: `${out}hxf_${name}_final.png` });

  // exclusive intro; the old details panel after the film is gone
  check(await page.locator('.hxf-badge').innerText().then((t) => /exclusively from pet maya/i.test(t)), `${name}: "Exclusively from Pet Maya" badge in the film`);
  check(await page.locator('.hx, #halo-details').count() === 0, `${name}: no separate details panel after the film`);

  // skip button jumps past the film
  await toS(page, 0.3); await settle(page, 600);
  await page.click('.hxf-skip');
  await page.waitForFunction(() => document.querySelector('.hxf-track').getBoundingClientRect().bottom <= 6, null, { timeout: 8000 });
  const next = await page.evaluate(() => { const t = document.querySelector('.hxf-bleed').nextElementSibling; return t ? Math.round(t.getBoundingClientRect().top) : null; });
  check(next !== null && next < h, `${name}: "Skip" leaves the film; the next section starts at ${next}px`);

  const sideways = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check(sideways <= 0, `${name}: no sideways overflow (${sideways}px)`);
  check(errors.length === 0, `${name}: no console errors ${errors.slice(0, 2).join(' | ')}`);
  await ctx.close();
}

// 3 — the buttons
{
  const { ctx, page } = await open(1280, 800);
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForSelector('.hxf-track', { state: 'attached' });
  await toS(page, 0.985);
  await page.waitForSelector('.hxf-stage canvas', { timeout: 60000 });
  await live(page);
  await toS(page, 0.985); // content above the film finishes loading while we wait, so scroll again
  await settle(page, 2200);
  await page.locator('.hxf-cap.finale a[href="/halo"]').click();
  await page.waitForSelector('.halo', { timeout: 30000 });
  check(new URL(page.url()).pathname === '/halo', 'the closing "Explore Maya Halo" button opens /halo');
  await ctx.close();
}

// 4 — reduced motion: no idle sway
{
  const { ctx, page, errors } = await open(1280, 800, { reducedMotion: 'reduce' });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForSelector('.hxf', { state: 'attached' });
  await toS(page, 0.5);
  await page.waitForSelector('.hxf-stage canvas', { timeout: 60000 });
  await live(page);
  await settle(page, 2500);
  const a = await page.screenshot();
  await page.waitForTimeout(1800);
  const b = await page.screenshot();
  check(Buffer.compare(a, b) === 0, 'reduced motion: nothing moves unless you scroll');
  check(errors.length === 0, `reduced motion: no console errors ${errors.slice(0, 2).join(' | ')}`);
  await ctx.close();
}

// 5 — no WebGL: still image with the closing message
{
  const b2 = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined, args: ['--disable-3d-apis', '--disable-gpu', '--disable-webgl'] });
  const page = await b2.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForSelector('.hxf', { state: 'attached' });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const t = document.querySelector('.hxf-track'); window.scrollTo(0, t.getBoundingClientRect().top + scrollY - innerHeight * 0.5); });
  await page.waitForSelector('.hxf-poster', { timeout: 30000 });
  check(await page.evaluate(() => document.querySelector('.hxf-poster').naturalWidth > 0), 'no-WebGL: the still image is shown');
  check(await page.evaluate(() => getComputedStyle(document.querySelector('.hxf-cap.finale')).display === 'block'), 'no-WebGL: closing message and buttons stay visible');
  check(errors.length === 0, `no-WebGL: no uncaught errors ${errors.join('|')}`);
  await b2.close();
}

await browser.close();
console.log(failures ? `\n${failures} failure(s)` : '\nAll home-page Maya Halo checks passed.');
process.exit(failures ? 1 : 0);
