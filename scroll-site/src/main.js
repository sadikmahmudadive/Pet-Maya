import { createHalo } from './halo.js';

const $ = (s, r = document) => r.querySelector(s);
const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const canvas = $('#film');
const loader = $('#loader');
const loadbar = $('#loadbar');
const track = $('#track');
const captions = [...document.querySelectorAll('.caption')];
const scrollCue = $('#scroll-cue');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (shotName) document.documentElement.classList.add('shot');

/* ── scene ─────────────────────────────────────────────────────────────────────── */

let halo = null;
try {
  halo = createHalo(canvas);
} catch (err) {
  console.warn('[halo] WebGL unavailable, showing the still instead:', err);
  document.documentElement.classList.add('nogl');
  $('#poster').hidden = false;
  loader.classList.add('done');
}

if (halo) {
  document.querySelectorAll('[data-parts]').forEach((el) => { el.textContent = halo.partsCount; });
  halo.setReduced(reduced);
}

function size() {
  if (!halo) return;
  const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
  const cap = innerWidth < 800 ? 1.5 : 2;
  halo.resize(w, h, Math.min(devicePixelRatio || 1, cap));
}

/* ── stills for the page below the film: ?shot=hero|halo|exploded|signal|buckle|weave ── */

const SHOTS = {
  hero:     { p: 0.46, o: { d: 6.0, ty: 0.28, az: 0.0, el: 0.2, rotY: 0.55 } },
  halo:     { p: 0.4, o: { d: 1.9, ty: 1.12, az: -0.22, el: 0.5, rotY: 0.2 } },
  exploded: { p: 0.012, o: { d: 14.0, ty: 1.0, az: 0.3, el: 0.14, rotY: 0.9 } },
  signal:   { p: 0.8, o: { d: 8.6, ty: -0.35, az: 0.25, el: 0.4, rotY: 0.9 } },
  buckle:   { p: 0.46, o: { d: 2.3, ty: -1.0, az: 0.05, el: 0.3, rotY: 0.35 } },
  weave:    { p: 0.46, o: { d: 1.9, ty: -0.05, az: 0.0, el: 0.08, tx: -0.62, rotY: 0.95 } },
};

function renderShot() {
  const s = SHOTS[shotName];
  if (!s) return;
  halo.setOverride(s.o);
  size();
  halo.render(s.p, 2.0);
  halo.render(s.p, 2.0);
  window.__shotReady = true;
}

/* ── scroll → film progress ───────────────────────────────────────────────────── */

const clamp01 = (x) => Math.min(1, Math.max(0, x));
function scrollProgress() {
  const span = track.offsetHeight - innerHeight;
  return span > 0 ? clamp01(scrollY / span) : 0;
}

function updateCaptions(p) {
  for (const el of captions) {
    const tIn = parseFloat(el.dataset.in), tHold = parseFloat(el.dataset.hold), tOut = parseFloat(el.dataset.out);
    const rise = Math.max(tHold - tIn, 0.008);
    const fall = Math.max((tOut - tHold) * 0.6, 0.008);
    let o = 0;
    if (p >= tIn && p <= tOut) o = clamp01(Math.min((p - tIn) / rise, 1) * Math.min((tOut - p) / fall, 1));
    el.style.opacity = o.toFixed(3);
    const drift = (p - tHold) * -36;
    el.style.translate = `0 ${drift.toFixed(1)}px`;
  }
  scrollCue.style.opacity = p < 0.012 ? 1 : 0;
}

/* ── main loop ─────────────────────────────────────────────────────────────────── */

const state = { target: 0, smooth: 0, visible: true, last: performance.now(), t0: performance.now(), ready: false, frame: 0 };

function tick(now) {
  requestAnimationFrame(tick);
  if (!halo || shotName) return;
  const dt = Math.min((now - state.last) / 1000, 0.5) || 0.016;
  state.last = now;
  state.target = scrollProgress();
  // time-based easing: fast flicks glide, throttled tabs still converge
  state.smooth += (state.target - state.smooth) * (1 - Math.exp(-dt * 9));
  if (Math.abs(state.target - state.smooth) < 0.0003) state.smooth = state.target;
  updateCaptions(state.smooth);
  if (!state.visible) return;
  // while the scroll position is not changing only idle effects move: half rate saves battery
  const moving = state.target !== state.smooth;
  if (!moving && (state.frame++ & 1)) return;
  halo.render(state.smooth, (now - state.t0) / 1000);
  if (!state.ready) {
    state.ready = true;
    loadbar.style.width = '100%';
    setTimeout(() => loader.classList.add('done'), 250);
  }
}

if (halo) {
  addEventListener('resize', size);
  size();

  // render only while the film is on screen
  new IntersectionObserver(([e]) => { state.visible = e.isIntersecting; }, { threshold: 0 }).observe(track);

  // gentle pointer parallax (desktop only)
  if (!reduced && matchMedia('(pointer: fine)').matches) {
    addEventListener('pointermove', (e) => halo.setPointer((e.clientX / innerWidth - 0.5) * 2, (e.clientY / innerHeight - 0.5) * 2), { passive: true });
  }

  loadbar.style.width = '60%';
  if (shotName) {
    document.fonts?.ready?.then(renderShot, renderShot);
  } else {
    state.smooth = state.target = scrollProgress();
    requestAnimationFrame(tick);
  }
}

/* ── brand page: reveals + nav after the film ─────────────────────────────────── */

const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.18 });
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
const revealNow = () => document.querySelectorAll('[data-reveal]:not(.in)').forEach((el) => {
  const r = el.getBoundingClientRect();
  if (r.top < innerHeight * 0.92 && r.bottom > 0) el.classList.add('in');
});
addEventListener('scroll', revealNow, { passive: true });
revealNow();

const nav = $('#brandnav');
const filmEnd = () => track.offsetHeight - innerHeight;
addEventListener('scroll', () => nav.classList.toggle('on', scrollY > filmEnd() * 0.97), { passive: true });

// smooth anchor jumps (the film uses scroll for animation, so keep native behaviour elsewhere)
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const t = document.querySelector(a.getAttribute('href'));
  if (!t) return;
  e.preventDefault();
  t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}));
