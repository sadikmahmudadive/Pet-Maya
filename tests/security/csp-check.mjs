// Serves the built site (web/dist) with the security headers and rewrites from
// firebase.json, loads key pages in a real browser and fails on any
// Content-Security-Policy violation, script error or missing header.
//
// Run from the repo root after `npm run build`:
//   node tests/security/csp-check.mjs
// PW_CHANNEL=msedge|chrome uses an installed browser instead of Playwright's download.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const DIST = join(ROOT, 'web', 'dist');
const hosting = JSON.parse(await readFile(join(ROOT, 'firebase.json'), 'utf8')).hosting;
const globalHeaders = hosting.headers.find((h) => h.source === '**').headers;
const rewrites = Object.fromEntries(hosting.rewrites.filter((r) => r.source !== '**').map((r) => [r.source, r.destination]));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml' };

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(DIST, normalize(rewrites[path] || path));
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); } catch { file = join(DIST, 'index.html'); }
  try {
    const body = await readFile(file);
    for (const { key, value } of globalHeaders) res.setHeader(key, value);
    res.setHeader('Content-Type', TYPES[extname(file)] || 'application/octet-stream');
    res.end(body);
  } catch { res.statusCode = 404; res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const PAGES = ['/', '/shop', '/journal', '/specialists', '/gps', '/halo', '/sign-in', '/about.html', '/privacy-policy', '/admin'];
// software WebGL so /halo (three.js) can render in headless runs
const browser = await chromium.launch({
  ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const problems = [];
for (const path of PAGES) {
  const page = await browser.newPage();
  page.on('console', (m) => {
    const t = m.text();
    if (/Content Security Policy|Refused to (load|execute|connect|frame|apply|create)/i.test(t)) problems.push(`${path}: ${t}`);
  });
  page.on('pageerror', (e) => problems.push(`${path}: pageerror ${e.message}`));
  const res = await page.goto(BASE + path, { waitUntil: 'load', timeout: 30_000 }).catch((e) => ({ error: e }));
  if (res?.error) problems.push(`${path}: navigation ${res.error.message}`);
  await page.waitForTimeout(3500); // let the SPA render, fetch data and lazy-load chunks
  const csp = res?.headers?.()['content-security-policy'];
  if (!csp) problems.push(`${path}: missing Content-Security-Policy header`);
  const info = await page.evaluate(() => ({
    theme: document.documentElement.getAttribute('data-theme'),
    rendered: (document.getElementById('root')?.childElementCount ?? 1) > 0,
  })).catch(() => ({}));
  if (info.rendered === false) problems.push(`${path}: app did not render`);
  if (path === '/') {
    // the Maya Halo feature builds its 3D stage when scrolled near: it must start under the CSP too
    await page.evaluate(() => document.querySelector('.hxf-track')?.scrollIntoView({ block: 'start' }));
    await page.waitForSelector('.hxf-stage canvas, .hxf-poster', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const hx = await page.evaluate(() => ({ canvas: !!document.querySelector('.hxf-stage canvas'), live: !!document.querySelector('.hxf.hxf-live'), poster: !!document.querySelector('.hxf-poster') }));
    if (!hx.canvas && !hx.poster) problems.push('/: Maya Halo feature produced neither a 3D canvas nor the fallback still');
    if (hx.canvas && !hx.live) problems.push('/: Maya Halo 3D stage was created but never went live');
    console.log(`   / Maya Halo feature: canvas=${hx.canvas} live=${hx.live}`);
  }
  if (path === '/halo') {
    // three.js must start under the production Content-Security-Policy: canvas present and loader dismissed
    const gl = await page.evaluate(() => ({
      canvas: !!document.querySelector('.halo-stage canvas'),
      loaderDone: !!document.querySelector('.halo-loader.done'),
      poster: !!document.querySelector('.halo-poster'),
    }));
    if (!gl.canvas && !gl.poster) problems.push('/halo: neither the 3D canvas nor the fallback still appeared');
    if (gl.canvas && !gl.loaderDone) problems.push('/halo: 3D scene created but never finished loading');
    console.log(`   /halo 3D: canvas=${gl.canvas} loaderDone=${gl.loaderDone}`);
  }
  console.log(`${path.padEnd(16)} status=${res?.status?.() ?? '-'} theme=${info.theme} rendered=${info.rendered}`);
  await page.close();
}
await browser.close();
server.close();

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n` + problems.join('\n'));
  process.exit(1);
}
console.log('\nNo CSP violations or script errors.');
