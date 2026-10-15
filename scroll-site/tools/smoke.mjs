// Loads the page in a real browser (software WebGL), scrolls through the film and
// saves a screenshot per position, reporting console errors.
//   node tools/smoke.mjs [--w=1440 --h=900] [--at=0,0.1,0.2,...]
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] || d;
const W = +arg('w', 1440), H = +arg('h', 900);
const AT = arg('at', '0,0.08,0.2,0.27,0.37,0.43,0.58,0.76,0.86,0.97').split(',').map(Number);
const BASE = process.env.SITE_URL || 'http://127.0.0.1:4199/';
const out = fileURLToPath(new URL('../.shots/', import.meta.url));
await mkdir(out, { recursive: true });

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: W, height: H } });
const problems = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));

await page.goto(BASE, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('loader')?.classList.contains('done') || document.documentElement.classList.contains('nogl'), null, { timeout: 60000 });
const info = await page.evaluate(() => ({ track: document.getElementById('track').offsetHeight, gl: !document.documentElement.classList.contains('nogl') }));
console.log(`viewport ${W}x${H}  track=${info.track}px  webgl=${info.gl}`);

for (const p of AT) {
  const y = p * (info.track - H);
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(1500); // let the easing converge
  const file = `${out}p${String(Math.round(p * 100)).padStart(3, '0')}_${W}x${H}.png`;
  await page.screenshot({ path: file });
  console.log('saved', file.split('.shots/')[1]);
}
console.log(problems.length ? `\n${problems.length} console problem(s):\n${[...new Set(problems)].join('\n')}` : '\nNo console errors.');
await browser.close();
