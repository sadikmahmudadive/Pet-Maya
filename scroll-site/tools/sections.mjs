// Screenshots each brand-page section below the film (after the film has ended).
//   node tools/sections.mjs [--w=1440 --h=900]
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] || d;
const W = +arg('w', 1440), H = +arg('h', 900);
const out = fileURLToPath(new URL('../.shots/', import.meta.url));
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(process.env.SITE_URL || 'http://127.0.0.1:4199/', { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('loader')?.classList.contains('done'), null, { timeout: 60000 });
const filmEnd = await page.evaluate(() => document.getElementById('track').offsetHeight);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
console.log(`${W}x${H} page height ${total}px (film ${filmEnd}px)`);
let i = 0;
for (let y = filmEnd - H; y < total; y += Math.round(H * 0.95), i++) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}sec${String(i).padStart(2, '0')}_${W}x${H}.png` });
}
const sideways = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
console.log(`sections captured: ${i}; sideways overflow: ${sideways}px; errors: ${errors.length ? errors.join(' | ') : 'none'}`);
await browser.close();
