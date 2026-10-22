// Responsive audit for the website: loads every route at phone, tablet and
// desktop sizes and reports horizontal overflow (the page scrolling sideways)
// and the elements that stick out of the viewport. Optional screenshots.
//
//   cd web && npx vite --port 5173      (dev server; admin uses ?preview)
//   node tests/responsive/audit-web.mjs [--shots] [--touch] [--only=/shop,/admin] [--sizes=phone,tablet]
// PW_CHANNEL=msedge|chrome uses an installed browser.
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5173';
const SHOTS = process.argv.includes('--shots');
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const OUT = new URL('./shots/', import.meta.url);

export const VIEWPORTS = [
  ['phone-xxs', 280, 653], ['phone-xs', 320, 640], ['phone-s', 360, 760], ['phone', 390, 844], ['phone-l', 430, 932],
  ['phone-land', 844, 390], ['fold', 600, 900], ['tablet', 768, 1024], ['tablet-l', 820, 1180],
  ['tablet-land', 1024, 768], ['laptop', 1280, 800], ['desktop', 1440, 900], ['wide', 1920, 1080],
];

const SITE = ['/', '/shop', '/product/p1', '/checkout', '/account/orders', '/specialists', '/triage', '/gps',
  '/vault', '/dashboard', '/profile', '/community', '/journal', '/halo', '/signin', '/nope'];
const ADMIN = ['/admin', '/admin/orders', '/admin/prescriptions', '/admin/inventory', '/admin/products/new', '/admin/categories', '/admin/promotions', '/admin/announcement',
  '/admin/appointments', '/admin/customers', '/admin/pos', '/admin/sales', '/admin/stock', '/admin/purchasing',
  '/admin/finance', '/admin/reports', '/admin/staff', '/admin/settings'];
const ROUTES = [...SITE, ...ADMIN].filter((r) => !only.length || only.some((o) => r === o || r.startsWith(o + '/')));

function overflowProbe() {
  const vw = document.documentElement.clientWidth;
  const sw = document.documentElement.scrollWidth;
  // Elements poking out past the screen edge. Content inside a horizontal
  // scroller (overflow-x auto/scroll) is fine, as is decoration clipped by a
  // component that itself fits (e.g. radar rings inside the radar card).
  // Page-wide wrappers with overflow-x:hidden don't count: they only hide the
  // problem, the content is still cut off.
  const scroller = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (/(auto|scroll)/.test(s.overflowX)) return true;
      if (/(hidden|clip)/.test(s.overflowX)) {
        const r = p.getBoundingClientRect();
        if (r.right <= vw + 1 && r.left >= -1 && r.width < vw - 2) return true;
      }
    }
    return false;
  };
  const offenders = [];
  for (const el of document.body.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const s = getComputedStyle(el);
    if (r.right <= 0 || r.left >= vw) continue; // parked off-canvas (closed drawers)
    if ((r.right > vw + 1 || r.left < -1) && !scroller(el)) {
      offenders.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className && typeof el.className === 'string' ? el.className : '').slice(0, 60),
        text: (el.textContent || '').trim().slice(0, 40),
        left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
      });
    }
  }
  // Touch ergonomics on phones/tablets.
  const touch = vw < 1024;
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && r.bottom > 0; };
  const smallInputs = touch ? [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([hidden]), select, textarea')]
    .filter((el) => visible(el) && parseFloat(getComputedStyle(el).fontSize) < 16)
    .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}(${getComputedStyle(el).fontSize})`) : [];
  const smallTargets = touch ? [...document.querySelectorAll('button, a[href], [role=button], select, input[type=checkbox], input[type=radio]')]
    .filter((el) => {
      if (!visible(el)) return false;
      const r = el.getBoundingClientRect();
      const inlineLink = el.tagName === 'A' && getComputedStyle(el).display === 'inline';
      return !inlineLink && (r.height < 32 || r.width < 32);
    })
    .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}(${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)})"${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 18)}"`) : [];
  const tinyText = [...document.querySelectorAll('body *')].filter((el) => {
    if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return false;
    return visible(el) && parseFloat(getComputedStyle(el).fontSize) < 11;
  }).map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}(${getComputedStyle(el).fontSize})`);
  return { vw, sw, offenders: offenders.slice(0, 12), smallInputs, smallTargets, tinyText };
}

const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
if (SHOTS) await mkdir(OUT, { recursive: true });
let failures = 0;
const sizes = (process.argv.find((a) => a.startsWith('--sizes=')) || '').slice(8).split(',').filter(Boolean);
for (const [name, width, height] of VIEWPORTS.filter(([n]) => !sizes.length || sizes.includes(n))) {
  // Reduced motion: scroll-reveal content is shown immediately in full-page shots.
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: width < 1024, isMobile: width < 600, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    const url = BASE + route + (route.startsWith('/admin') ? '?preview' : '');
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 30_000 });
      await page.waitForTimeout(route.startsWith('/admin') ? 1500 : 1200);
      const res = await page.evaluate(overflowProbe);
      const bad = res.sw > res.vw + 1 || res.offenders.length > 0;
      if (bad) {
        failures++;
        console.log(`✖ ${name} ${width}x${height} ${route}: scrollWidth ${res.sw} > ${res.vw}`);
        for (const o of res.offenders.slice(0, 6)) {
          console.log(`    ${o.tag}.${o.cls.replace(/\s+/g, '.')} [${o.left}→${o.right}] "${o.text}"`);
        }
      }
      if (process.argv.includes('--touch') && (res.smallInputs.length || res.smallTargets.length || res.tinyText.length)) {
        const uniq = (l) => [...new Set(l)].slice(0, 8).join('  ');
        if (res.smallInputs.length) console.log(`  ⚠ ${name} ${route} inputs<16px (iOS zoom): ${uniq(res.smallInputs)}`);
        if (res.smallTargets.length) console.log(`  ⚠ ${name} ${route} small tap targets (${res.smallTargets.length}): ${uniq(res.smallTargets)}`);
        if (res.tinyText.length) console.log(`  ⚠ ${name} ${route} text<11px (${res.tinyText.length}): ${uniq(res.tinyText)}`);
      }
      if (SHOTS) {
        const file = `${name}${route === '/' ? '_home' : route.replace(/\//g, '_')}.png`;
        if (process.argv.includes('--full')) {
          // Tall pages are saved in segments so each image stays readable.
          const total = await page.evaluate(() => document.documentElement.scrollHeight);
          const seg = Math.max(height, Math.round(width * 1.6));
          for (let y = 0, i = 1; y < total && i <= 8; y += seg, i++) {
            await page.screenshot({ path: fileURLToPath(new URL(file.replace('.png', `_${i}.png`), OUT)), fullPage: true,
              clip: { x: 0, y, width, height: Math.min(seg, total - y) } });
          }
        } else {
          await page.screenshot({ path: fileURLToPath(new URL(file, OUT)) });
        }
      }
    } catch (e) {
      failures++;
      console.log(`✖ ${name} ${route}: ${e.message.split('\n')[0]}`);
    }
  }
  await ctx.close();
}
await browser.close();
console.log(failures ? `\n${failures} problem(s)` : '\nNo horizontal overflow at any size.');
process.exit(failures ? 1 : 0);
