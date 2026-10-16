// Browser side of the tracking setup: Google Tag Manager loader, consent, dataLayer events and the
// first-party /collect beacon. Network calls to GTM and /collect are stubbed, nothing leaves the machine.
//
// Needs a production build made with a GTM id, served with the headers from firebase.json (the CSP matters):
//   VITE_GTM_ID=GTM-TEST123 npm run build
//   AUDIT_BASE_URL=http://127.0.0.1:4300 node tests/tracking/tracking.mjs     (PW_CHANNEL=msedge on this machine)
import { chromium } from 'playwright';

const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:4300';
const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
const failures = [];
const check = (ok, msg) => { console.log(`${ok ? '✔' : '✖'} ${msg}`); if (!ok) failures.push(msg); };

async function session({ gpc = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  if (gpc) await ctx.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true }));
  const beacons = [];
  const gtmHits = [];
  await ctx.route('**/collect', async (route) => {
    const req = route.request();
    try { beacons.push(JSON.parse(req.postData() || '{}')); } catch { beacons.push({ bad: true }); }
    await route.fulfill({ status: 204 });
  });
  await ctx.route('https://www.googletagmanager.com/**', async (route) => {
    gtmHits.push(route.request().url());
    await route.fulfill({ status: 200, contentType: 'text/javascript', body: '/* stub gtm */' });
  });
  const page = await ctx.newPage();
  const cspErrors = [];
  page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) cspErrors.push(m.text().slice(0, 160)); });
  page.on('pageerror', (e) => cspErrors.push('pageerror: ' + e.message));
  const dl = () => page.evaluate(() => (window.dataLayer || []).map((x) => (x && x.event ? { event: x.event, event_id: x.event_id, ecommerce: x.ecommerce, search_term: x.search_term } : { cmd: x[0], arg: x[1], val: x[2] })));
  return { ctx, page, beacons, gtmHits, cspErrors, dl };
}

// ── normal visitor ──
{
  const s = await session();
  await s.page.goto(BASE + '/', { waitUntil: 'load' });
  await s.page.waitForSelector('.pcard', { timeout: 20_000 });
  await s.page.waitForTimeout(2500); // GTM waits for idle time after load

  check(await s.page.locator('.consent-bar').isVisible(), 'consent bar is shown on the first visit');
  check(s.gtmHits.some((u) => u.includes('id=GTM-TEST123')), 'GTM container is requested after load (' + (s.gtmHits[0] || 'none') + ')');
  let dl = await s.dl();
  const def = dl.find((x) => x.cmd === 'consent' && x.arg === 'default');
  check(def && def.val.ad_storage === 'denied' && def.val.analytics_storage === 'granted', 'Consent Mode default: ads denied, analytics granted');
  const pv = dl.find((x) => x.event === 'page_view');
  check(!!pv && /^page_view_/.test(pv.event_id), 'page_view reaches the dataLayer with an event_id');
  const b0 = s.beacons.find((b) => b.name === 'page_view');
  check(!!b0 && b0.event_id === pv?.event_id, '/collect gets the same page_view event_id (de-duplication)');
  check(b0?.consent?.ads === false && b0?.consent?.analytics === true, '/collect carries consent: analytics yes, ads no');
  check(/^\d+\.\d+$/.test(b0?.client_id || ''), 'client_id looks like a GA client id (' + b0?.client_id + ')');

  await s.page.getByRole('button', { name: 'Accept' }).click();
  await s.page.waitForTimeout(200);
  check(!(await s.page.locator('.consent-bar').count()), 'consent bar closes after choosing');
  dl = await s.dl();
  const upd = dl.find((x) => x.cmd === 'consent' && x.arg === 'update');
  check(upd && upd.val.ad_storage === 'granted', 'Accept → Consent Mode update grants ads');

  // product view + add to cart
  await s.page.locator('.pcard .pcard-name').first().evaluate((a) => a.removeAttribute('target'));
  await s.page.locator('.pcard .pcard-name').first().click();
  await s.page.waitForSelector('h1', { timeout: 20_000 });
  await s.page.waitForTimeout(600);
  dl = await s.dl();
  const vi = dl.find((x) => x.event === 'view_item');
  check(!!vi && vi.ecommerce?.items?.[0]?.item_id && vi.ecommerce.currency === 'BDT', 'view_item pushes an ecommerce item in BDT');
  check(s.beacons.some((b) => b.name === 'view_item' && b.consent.ads === true), 'view_item beacon now reports ads consent');

  const add = s.page.getByRole('button', { name: /add to (bag|cart|care bag)/i }).first();
  if (await add.count()) {
    await add.click();
    await s.page.waitForTimeout(500);
    dl = await s.dl();
    const atc = dl.find((x) => x.event === 'add_to_cart');
    check(!!atc && atc.ecommerce.items[0].quantity >= 1 && atc.ecommerce.value > 0, 'add_to_cart pushes item + value');
    check(s.beacons.some((b) => b.name === 'add_to_cart' && b.params.items?.length === 1), 'add_to_cart reaches /collect');
  } else {
    check(false, 'could not find the add-to-bag button on the product page');
  }
  check(!s.beacons.some((b) => b.name === 'purchase'), 'purchase is never sent from the browser to /collect');
  check(s.cspErrors.length === 0, 'no CSP violations or page errors' + (s.cspErrors.length ? ': ' + s.cspErrors.join(' | ') : ''));
  await s.ctx.close();
}

// ── Global Privacy Control: marketing stays off even after "Accept" ──
{
  const s = await session({ gpc: true });
  await s.page.goto(BASE + '/', { waitUntil: 'load' });
  await s.page.waitForSelector('.consent-bar', { timeout: 20_000 });
  await s.page.getByRole('button', { name: 'Accept' }).click();
  await s.page.goto(BASE + '/shop', { waitUntil: 'load' });
  await s.page.waitForTimeout(1200);
  check(s.beacons.length > 0 && s.beacons.every((b) => b.consent.ads === false), 'GPC: every beacon has ads=false even after Accept');
  await s.ctx.close();
}

// ── a return visitor who chose "Only essentials" is not asked again and stays ads-off ──
{
  const s = await session();
  await s.page.goto(BASE + '/', { waitUntil: 'load' });
  await s.page.waitForSelector('.consent-bar', { timeout: 20_000 });
  await s.page.getByRole('button', { name: 'Only essentials' }).click();
  await s.page.reload({ waitUntil: 'load' });
  await s.page.waitForTimeout(800);
  check(!(await s.page.locator('.consent-bar').count()), 'choice is remembered: no banner on reload');
  check(s.beacons.every((b) => b.consent.ads === false), 'Only essentials: ads stay off across reloads');
  await s.ctx.close();
}

await browser.close();
if (failures.length) { console.log(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nAll tracking checks passed.');
