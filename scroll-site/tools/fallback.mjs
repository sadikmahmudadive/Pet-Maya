// Checks the page degrades gracefully: no WebGL → poster still; reduced motion → still scrubs.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const out = fileURLToPath(new URL('../.shots/', import.meta.url));
await mkdir(out, { recursive: true });
const URL_ = process.env.SITE_URL || 'http://127.0.0.1:4199/';
const ch = process.env.PW_CHANNEL || undefined;
let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? '✔' : '✖'} ${msg}`); if (!ok) failures++; };

// 1 — WebGL disabled
{
  const b = await chromium.launch({ channel: ch, args: ['--disable-3d-apis', '--disable-gpu', '--disable-webgl'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(URL_, { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  const s = await p.evaluate(() => ({
    nogl: document.documentElement.classList.contains('nogl'),
    loaderGone: getComputedStyle(document.getElementById('loader')).pointerEvents === 'none',
    posterShown: !document.getElementById('poster').hidden && document.getElementById('poster').naturalWidth > 0,
    trackH: document.getElementById('track').offsetHeight,
    finale: getComputedStyle(document.querySelector('.cap-finale')).display,
  }));
  await p.screenshot({ path: `${out}nogl.png` });
  check(s.nogl, 'no-WebGL: fallback class applied');
  check(s.loaderGone, 'no-WebGL: loader dismissed');
  check(s.posterShown, 'no-WebGL: poster image shown');
  check(s.trackH <= 900, `no-WebGL: film track collapsed (${s.trackH}px)`);
  check(errs.length === 0, `no-WebGL: no uncaught errors ${errs.join('|')}`);
  await b.close();
}

// 2 — reduced motion
{
  const b = await chromium.launch({ channel: ch, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(URL_, { waitUntil: 'load' });
  await p.waitForFunction(() => document.getElementById('loader')?.classList.contains('done'), null, { timeout: 60000 });
  check(await p.evaluate(() => getComputedStyle(document.querySelector('#scroll-cue'), '::after').animationName === 'none'), 'reduced motion: scroll cue animation off');
  await p.evaluate(() => window.scrollTo(0, 0.4 * (document.getElementById('track').offsetHeight - innerHeight)));
  await p.waitForTimeout(1200);
  const a = await p.screenshot();
  await p.waitForTimeout(1500); // idle: nothing should drift or pulse
  const c = await p.screenshot();
  check(Buffer.compare(a, c) === 0, 'reduced motion: scene is static when not scrolling');
  check(errs.length === 0, `reduced motion: no uncaught errors ${errs.join('|')}`);
  await b.close();
}
console.log(failures ? `\n${failures} failure(s)` : '\nFallbacks OK.');
process.exit(failures ? 1 : 0);
