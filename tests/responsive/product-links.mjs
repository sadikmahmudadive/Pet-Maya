// Product tiles open the product page in a NEW TAB, and the URL carries the
// product name: /product/<name-slug>/<id>. Old /product/<id> links still work
// and are rewritten to the named form.
//   (dev server on :5173)  node tests/responsive/product-links.mjs
import { chromium } from 'playwright';

const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const failures = [];
const check = (ok, msg) => { console.log(`${ok ? '✔' : '✖'} ${msg}`); if (!ok) failures.push(msg); };

for (const route of ['/shop', '/']) {
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: 'load' });
  await page.waitForSelector('.pcard', { timeout: 20_000 });
  await page.waitForTimeout(800);

  const first = page.locator('.pcard').first();
  const name = (await first.locator('.pcard-name').innerText()).trim();
  const href = await first.locator('.pcard-name').getAttribute('href');
  const target = await first.locator('.pcard-name').getAttribute('target');
  const rel = await first.locator('.pcard-name').getAttribute('rel');
  const imgTarget = await first.locator('a:has(.ph)').getAttribute('target');
  check(/^\/product\/[a-z0-9-]+\/[^/]+$/.test(href), `${route}: href has the name in it → ${href}`);
  check(target === '_blank' && imgTarget === '_blank', `${route}: name and image links target a new tab`);
  check(/noopener/.test(rel || ''), `${route}: new-tab link has rel="noopener" (${rel})`);

  // Real click → real new tab; the original page stays where it was.
  const [popup] = await Promise.all([ctx.waitForEvent('page'), first.locator('.pcard-name').click()]);
  await popup.waitForLoadState('load');
  await popup.waitForSelector('h1', { timeout: 20_000 });
  const url = new URL(popup.url());
  check(url.pathname === href, `${route}: new tab opened ${url.pathname}`);
  check(page.url() === BASE + route, `${route}: original tab stayed on ${route}`);
  const h1 = (await popup.locator('h1').first().innerText()).trim();
  check(h1.toLowerCase().includes(name.toLowerCase().slice(0, 12)) || !/couldn’t find/i.test(h1), `${route}: product page shows "${h1.slice(0, 40)}"`);

  // Old-style link → rewritten to the named URL once the product loads.
  if (route === '/shop') {
    const id = decodeURIComponent(href.split('/').pop());
    const old = await ctx.newPage();
    await old.goto(`${BASE}/product/${encodeURIComponent(id)}`, { waitUntil: 'load' });
    await old.waitForSelector('h1', { timeout: 20_000 });
    await old.waitForTimeout(800);
    check(new URL(old.url()).pathname === href, `old /product/${id} rewritten to ${new URL(old.url()).pathname}`);
    // Wrong name in the URL still resolves by id and is corrected.
    const wrong = await ctx.newPage();
    await wrong.goto(`${BASE}/product/some-other-name/${encodeURIComponent(id)}`, { waitUntil: 'load' });
    await wrong.waitForSelector('h1', { timeout: 20_000 });
    await wrong.waitForTimeout(800);
    check(new URL(wrong.url()).pathname === href, `wrong name in URL corrected to ${new URL(wrong.url()).pathname}`);
    // Back button after canonicalising doesn't trap the user.
    await old.close(); await wrong.close();
  }
  await popup.close();
  await page.close();
}

// Unknown product id still shows the friendly not-found state, no redirect loop.
const nf = await ctx.newPage();
await nf.goto(`${BASE}/product/nothing-here/zzz-not-real`, { waitUntil: 'load' });
await nf.waitForTimeout(2500);
check(/couldn’t find/i.test(await nf.locator('main').innerText()), 'unknown product shows the not-found message');
check(new URL(nf.url()).pathname === '/product/nothing-here/zzz-not-real', 'unknown product URL is left alone');

await browser.close();
console.log(failures.length ? `\n${failures.length} failure(s)` : '\nAll product link checks passed.');
process.exit(failures.length ? 1 : 0);
