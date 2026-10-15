import { useEffect, useRef, useState } from 'react';
import { Link } from '../lib/router.jsx';
import { Icon } from '../ui/index.jsx';
import '../styles/halo-home.css';

/* Home page: Maya Halo as a full-screen, scroll-driven product breakdown.

   The section pins to the whole screen. Scrolling lights the halo, flies the collar apart into its
   23 parts, visits seven of them in turn (camera + callout card + leader line), then reassembles it.
   The 3D scene (src/halo/scene.js) is drawn live with three.js and is only downloaded when the
   section is about to come on screen. Facts come from the firmware docs (firmware/README.md). */

const STEPS = [
  { id: 'strap-left', d: 4.2, title: 'Woven strap', text: 'A soft woven band with teal stitching, wide enough to spread the load across the neck.', chips: ['Woven', 'Teal stitching'] },
  { id: 'buckle', also: ['d-ring'], d: 4.9, title: 'Buckle & D-ring', text: 'A low-profile buckle that stays put, with a D-ring for the leash.', chips: ['Titanium', 'Leash ring'] },
  { id: 'housing', d: 3.7, title: 'Mount & housing', text: 'A curved saddle carries the module flat against the strap and holds the electronics together.', chips: ['Curved mount', '4 screws'] },
  { id: 'battery', d: 3.5, title: 'The battery', text: 'A LiPo cell sized for days, not hours: about 9–10 days at 2-minute reports (our estimate).', chips: ['LiPo cell', '≈ 9–10 days'] },
  { id: 'circuit-board', d: 3.6, title: 'The brain and the radios', text: 'One small board holds the processor, the GPS receiver and the LoRa radio.', chips: ['ESP32', 'u-blox NEO-6M GPS', 'LoRa SX1278'] },
  { id: 'antenna', d: 3.4, title: 'A 433 MHz antenna', text: 'Tuned for LoRa: 1–3 km across a city and up to 15 km with a clear line of sight.', chips: ['LoRa 433 MHz', 'AES-128'] },
  { id: 'halo-ring', also: ['glass'], d: 3.2, title: 'The halo', text: 'A ring of light for status at a glance: fast blink in lost mode, its own pattern when it has no link.', chips: ['Status light', 'Lost mode'] },
];

// scroll timeline (0..1 through the section)
const T = { introEnd: 0.1, explodeFrom: 0.1, explodeTo: 0.26, stepsFrom: 0.28, stepLen: 0.085, reFrom: 0.875, reTo: 0.96, finalIn: 0.93 };

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const smoother = (x) => { x = clamp01(x); return x * x * x * (x * (x * 6 - 15) + 10); };
const pad = (n) => String(n).padStart(2, '0');
// phones and portrait tablets put the callout card at the bottom; landscape screens put it beside the part
const isMobile = () => window.innerWidth < 800 || window.innerWidth / window.innerHeight < 1;
const win = (s, a, b, edge = 0.02) => smooth((s - a) / edge) * smooth((b - s) / edge);

/** Everything the scene needs for scroll position `s` and clock `t`. */
function view(s, t, mobile, aspect, reduced) {
  const e = Math.min(smoother((s - T.explodeFrom) / (T.explodeTo - T.explodeFrom)), 1 - smoother((s - T.reFrom) / (T.reTo - T.reFrom)));
  // which part we're on: f = 0..6 (centre of each step); weight 1 near the centre, crossfading between steps
  const f = (s - T.stepsFrom) / T.stepLen - 0.5;
  const w = STEPS.map((_, k) => {
    const d = Math.abs(f - k);
    return (d <= 0.25 ? 1 : d >= 0.75 ? 0 : smooth(1 - (d - 0.25) / 0.5)) * smooth(e * 1.4);
  });
  const W = w.reduce((a, b) => a + b, 0);
  const focusK = Math.min(1, W);
  // close-ups that frame two parts (buckle + ring) must be wider than a tall screen at the usual distance
  const fitS = aspect >= 1.2 ? 1 : Math.min(1.9, Math.pow(1.2 / aspect, 0.6));
  const dStep = W > 0 ? STEPS.reduce((acc, st, k) => acc + st.d * (st.also ? fitS : 1) * w[k], 0) / W : 5;
  // tall (portrait) screens need to pull back to fit the whole collar; the exploded view needs it less
  const fitA = aspect >= 1.6 ? 1 : Math.min(2.2, Math.pow(1.6 / aspect, 0.8));
  const fitE = aspect >= 1.6 ? 1 : Math.min(1.55, Math.pow(1.6 / aspect, 0.5));
  const dBase = lerp(5.4 * fitA, 11.6 * fitE, e);
  const d = lerp(dBase, dStep, focusK);
  const sway = reduced ? 0 : Math.sin(t * 0.45);
  return {
    e, w, W,
    p: lerp(0.3, 0.46, smooth(s / 0.08)), // the halo ignites as you arrive
    override: {
      noFit: true,
      d,
      ty: lerp(0.1, 0.9, e),
      az: lerp(0.0, 0.28, e) * (1 - focusK),
      el: lerp(0.2, 0.14, e),
      tx: -1.2 * smooth((s - 0.9) / 0.06),
      rotY: 0.55 - 0.35 * e + sway * 0.18 * (1 - focusK * 0.6),
      focus: STEPS.flatMap((st, k) => [st.id, ...(st.also || [])].map((id, _i, ids) => ({
        id,
        w: w[k] / ids.length,
        // slide the part off-centre, away from its card (desktop: card left → part right; phone: card at the bottom, so lift it)
        dx: mobile ? 0 : (k % 2 === 0 ? -1 : 1) * 0.115 * st.d * aspect,
        dy: mobile ? -0.09 * st.d : 0,
      }))),
    },
  };
}

export default function HaloBreakdown() {
  const track = useRef(null);
  const stage = useRef(null);
  const cardEls = useRef([]);
  const lineEls = useRef([]);
  const dotEls = useRef([]);
  const introEl = useRef(null);
  const takeEl = useRef(null);
  const finalEl = useRef(null);
  const barEl = useRef(null);
  const cueEl = useRef(null);
  const railEls = useRef([]);
  const [state, setState] = useState('idle'); // idle → loading → live | still

  useEffect(() => {
    const el = stage.current;
    if (!el) return undefined;
    let disposed = false, raf = 0, halo = null, canvas = null, started = false;
    const cleanups = [];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const start = async () => {
      if (started) return;
      started = true;
      setState('loading');
      try {
        const { createHalo } = await import('../halo/scene.js');
        if (disposed) return;
        canvas = document.createElement('canvas');
        canvas.setAttribute('aria-label', 'Live 3D breakdown of the Maya Halo collar: it flies apart into its parts and reassembles as you scroll');
        el.prepend(canvas);
        halo = createHalo(canvas);
      } catch (err) {
        console.warn('[halo] WebGL unavailable, showing the still instead:', err);
        canvas?.remove();
        if (!disposed) setState('still');
        return;
      }
      halo.setReduced(reduced);
      const size = () => {
        const w = el.clientWidth, h = el.clientHeight;
        if (w && h) halo.resize(w, h, Math.min(window.devicePixelRatio || 1, window.innerWidth < 800 ? 1.5 : 2));
      };
      size();
      const ro = new ResizeObserver(size);
      ro.observe(el);
      cleanups.push(() => ro.disconnect());

      if (!reduced && window.matchMedia('(pointer: fine)').matches) {
        const move = (e) => halo.setPointer((e.clientX / window.innerWidth - 0.5) * 2, (e.clientY / window.innerHeight - 0.5) * 2);
        window.addEventListener('pointermove', move, { passive: true });
        cleanups.push(() => window.removeEventListener('pointermove', move));
      }

      const vis = { on: true };
      const io = new IntersectionObserver(([e]) => { vis.on = e.isIntersecting; }, { threshold: 0 });
      io.observe(track.current);
      cleanups.push(() => io.disconnect());

      const progress = () => {
        const r = track.current.getBoundingClientRect();
        const span = r.height - el.clientHeight;
        return span > 0 ? clamp01(-r.top / span) : 0;
      };
      const st = { smooth: progress(), last: performance.now(), t0: performance.now(), n: 0, shown: false };

      const ui = (s, v) => {
        const mobile = isMobile();
        const sr = el.getBoundingClientRect();
        STEPS.forEach((step, k) => {
          const card = cardEls.current[k], line = lineEls.current[k], dot = dotEls.current[k];
          const o = smooth((v.w[k] - 0.4) / 0.45);
          if (card) {
            card.style.opacity = o.toFixed(3);
            card.style.visibility = o > 0.01 ? 'visible' : 'hidden';
            card.style.translate = `0 ${((1 - o) * 14).toFixed(1)}px`;
          }
          if (!line || !dot) return;
          // hidden markers are parked inside the screen so they never count as overflow
          const park = () => { line.style.opacity = 0; dot.style.opacity = 0; dot.setAttribute('cx', 12); dot.setAttribute('cy', 12); line.setAttribute('x1', 12); line.setAttribute('y1', 12); line.setAttribute('x2', 12); line.setAttribute('y2', 12); };
          if (o < 0.02) { park(); return; }
          const pt = halo.project(step.id);
          if (!pt || pt.behind) { park(); return; }
          const cr = card.getBoundingClientRect();
          const left = k % 2 === 0; // even steps: card on the left on desktop
          const ax = mobile ? cr.left - sr.left + cr.width / 2 : (left ? cr.right : cr.left) - sr.left;
          const ay = mobile ? cr.top - sr.top : cr.top - sr.top + 34;
          line.setAttribute('x1', ax); line.setAttribute('y1', ay);
          line.setAttribute('x2', pt.x); line.setAttribute('y2', pt.y);
          dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
          line.style.opacity = (o * 0.85).toFixed(3); dot.style.opacity = o.toFixed(3);
        });
        // opening / "take it apart" / closing captions
        const fade = (node, o) => { if (!node) return; node.style.opacity = o.toFixed(3); node.style.visibility = o > 0.01 ? 'visible' : 'hidden'; node.style.translate = `0 ${((1 - o) * 14).toFixed(1)}px`; };
        fade(introEl.current, win(s, -0.1, 0.085, 0.03));
        fade(takeEl.current, win(s, 0.12, 0.275, 0.03));
        fade(finalEl.current, win(s, T.finalIn, 1.2, 0.03));
        if (barEl.current) barEl.current.style.transform = `scaleX(${s.toFixed(4)})`;
        if (cueEl.current) cueEl.current.style.opacity = s < 0.02 ? 1 : 0;
        const active = v.W > 0.3 ? v.w.indexOf(Math.max(...v.w)) : -1;
        railEls.current.forEach((r, k) => r && r.classList.toggle('on', k === active));
      };

      // the site header sits in a different stacking layer, so hide it while this section owns the screen
      const root = document.documentElement;
      const setImmersive = (on) => { if (root.classList.contains('hxf-immersive') !== on) root.classList.toggle('hxf-immersive', on); };
      cleanups.push(() => root.classList.remove('hxf-immersive'));
      const pinned = () => {
        const r = el.getBoundingClientRect();
        return r.top <= 1 && r.bottom >= window.innerHeight - 1;
      };

      const draw = (now, s) => {
        const t = reduced ? 0 : (now - st.t0) / 1000;
        const v = view(s, t, isMobile(), window.innerWidth / window.innerHeight, reduced);
        halo.setExplode(v.e);
        halo.setOverride(v.override);
        halo.render(v.p, t);
        ui(s, v);
        setImmersive(pinned());
        if (!st.shown) { st.shown = true; setState('live'); }
      };

      const tick = (now) => {
        raf = requestAnimationFrame(tick);
        const dt = Math.min((now - st.last) / 1000, 0.5) || 0.016;
        st.last = now;
        const target = progress();
        st.smooth += (target - st.smooth) * (1 - Math.exp(-dt * 8));
        if (Math.abs(target - st.smooth) < 0.0004) st.smooth = target;
        if (!vis.on) { setImmersive(false); return; }
        // once the scroll settles only the gentle sway remains: half rate saves battery
        if (target === st.smooth && (st.n++ & 1)) return;
        draw(now, st.smooth);
      };
      raf = requestAnimationFrame(tick);
    };

    // build it only when the section is about to appear, so the home page itself stays light
    const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) { start(); near.disconnect(); } }, { rootMargin: '500px 0px' });
    near.observe(track.current);
    cleanups.push(() => near.disconnect());

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanups.forEach((fn) => fn());
      halo?.dispose();
      canvas?.remove();
    };
  }, []);

  // jump to the end of the pinned film, i.e. the first section after it
  const skip = () => {
    const r = track.current?.getBoundingClientRect();
    if (r) window.scrollTo({ top: window.scrollY + r.bottom, behavior: 'smooth' });
  };

  return (
    <section className={`hxf hxf-${state}`} aria-label="Maya Halo product breakdown">
      <div className="hxf-track" ref={track}>
        <div className="hxf-stage" ref={stage}>
          {state === 'still' && <img className="hxf-poster" src="/halo-img/exploded.webp" alt="The Maya Halo collar exploded into its 23 parts" />}
          <div className="hxf-vignette" />

          <svg className="hxf-lines" aria-hidden="true">
            {STEPS.map((s, k) => (
              <g key={s.id}>
                <line ref={(n) => { lineEls.current[k] = n; }} stroke="#5fe0d2" strokeWidth="1.2" strokeDasharray="3 4" style={{ opacity: 0 }} />
                <circle ref={(n) => { dotEls.current[k] = n; }} cx="12" cy="12" r="5" fill="none" stroke="#5fe0d2" strokeWidth="1.6" style={{ opacity: 0 }} />
              </g>
            ))}
          </svg>

          <div className="hxf-top">
            <span className="hxf-badge"><Icon name="star" size={12} stroke={1} style={{ fill: 'currentColor' }} /> Exclusively from Pet Maya</span>
            <button type="button" className="hxf-skip" onClick={skip}>Skip <Icon name="chevronDown" size={14} /></button>
          </div>

          {/* opening */}
          <div className="hxf-cap left" ref={introEl}>
            <h2>Meet <em>Maya Halo.</em></h2>
            <p>The GPS collar only Pet Maya makes. No SIM, no monthly fee, no signal bars.</p>
          </div>
          {/* the explosion */}
          <div className="hxf-cap left" ref={takeEl} style={{ opacity: 0, visibility: 'hidden' }}>
            <h2>Take it <em>apart.</em></h2>
            <p>23 parts. Keep scrolling to see what each one does.</p>
          </div>

          {/* one card per part */}
          {STEPS.map((s, k) => (
            <div key={s.id} ref={(n) => { cardEls.current[k] = n; }} className={`hxf-card ${k % 2 === 0 ? 'left' : 'right'}`} style={{ opacity: 0, visibility: 'hidden' }}>
              <span className="n">{pad(k + 1)} <i>/ {pad(STEPS.length)}</i></span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <div className="chips">{s.chips.map((c) => <span key={c}>{c}</span>)}</div>
            </div>
          ))}

          {/* closing */}
          <div className="hxf-cap left finale" ref={finalEl} style={{ opacity: 0, visibility: 'hidden' }}>
            <h2>Maya <em>Halo.</em></h2>
            <p>Designed by Pet Maya. Sold nowhere else.</p>
            <div className="hxf-actions">
              <Link className="hxf-btn solid" to="/halo">Explore Maya Halo</Link>
              <Link className="hxf-btn" to="/shop/smart-gear">Shop smart gear</Link>
            </div>
          </div>

          <div className="hxf-rail" aria-hidden="true">
            {STEPS.map((s, k) => <span key={s.id} ref={(n) => { railEls.current[k] = n; }} title={s.title} />)}
          </div>
          <div className="hxf-cue" ref={cueEl}>Scroll</div>
          <div className="hxf-bar"><i ref={barEl} /></div>
          <div className="hxf-loading" aria-hidden="true"><span>Maya Halo</span></div>
        </div>
      </div>
    </section>
  );
}
