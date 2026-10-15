import { useEffect, useRef, useState } from 'react';
import { Link } from '../../lib/router.jsx';
import { Reveal } from '../../lib/motion.jsx';
import '../../styles/halo.css';

/* Maya Halo — scroll-driven product film.
   The 3D scene (src/halo/scene.js) is drawn live with three.js, which is loaded lazily the first
   time this page opens, so the rest of the site never pays for it. `p` below is the scroll
   progress 0..1 through the film; caption windows are expressed in the same units. */

const CAPTIONS = [
  { side: 'left', in: -0.05, hold: 0.015, out: 0.085, title: <h1>Maya <em>Halo</em></h1>, text: 'The GPS collar that doesn’t need a SIM.' },
  { side: 'right', in: 0.14, hold: 0.19, out: 0.265, title: <h2><span data-parts>23</span> parts.<br /><em>One halo.</em></h2>, text: 'No SIM card. No monthly fee. A collar that simply knows where your pet is.' },
  { side: 'left', in: 0.355, hold: 0.4, out: 0.46, title: <h2>Light it <em>up.</em></h2>, text: 'One ring of light. Always on, barely there.' },
  { side: 'left', in: 0.52, hold: 0.555, out: 0.595, title: <h2>Made to be<br />forgotten.</h2>, text: 'A woven strap, titanium hardware, a module that sits flat against the neck.' },
  { side: 'right', in: 0.605, hold: 0.635, out: 0.675, title: <h2>Private<br /><em>by design.</em></h2>, text: 'Every report is AES-128 encrypted. Only you can read where your pet is.' },
  { side: 'right', in: 0.72, hold: 0.75, out: 0.8, title: <h2>No SIM.<br /><em>No signal bars.</em></h2>, text: 'Maya Halo speaks LoRa on 433 MHz. 1–3 km across a city, up to 15 km with a clear line of sight.' },
  { side: 'left', in: 0.815, hold: 0.845, out: 0.885, title: <h2>A network that<br /><em>grows with you.</em></h2>, text: 'Every gateway, at a clinic, a shelter or a neighbour’s window, carries every collar.' },
  { side: 'left finale', in: 0.93, hold: 0.975, out: 1.2, title: <h2 className="big">Know they’re <em>home.</em></h2>, text: 'Maya Halo, from Pet Maya.', cta: true },
];

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const IMG = '/halo-img';

export default function Halo() {
  const root = useRef(null);
  const track = useRef(null);
  const stage = useRef(null);
  const capEls = useRef([]);
  const cue = useRef(null);
  const [ready, setReady] = useState(false);
  const [nogl, setNogl] = useState(false);

  useEffect(() => {
    let disposed = false;
    let raf = 0;
    let halo = null;
    let canvas = null;
    const cleanups = [];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const header = () => document.querySelector('.site-header');
    const headerH = () => header()?.getBoundingClientRect().height || 0;

    // keep the sticky stage just below the site header
    const syncTop = () => root.current?.style.setProperty('--halo-top', `${Math.round(headerH())}px`);
    syncTop();
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(syncTop);
      if (header()) ro.observe(header());
      cleanups.push(() => ro.disconnect());
    }

    (async () => {
      try {
        const { createHalo } = await import('../../halo/scene.js');
        if (disposed) return;
        // a fresh canvas per mount (React StrictMode mounts twice in dev)
        canvas = document.createElement('canvas');
        canvas.setAttribute('aria-label', '3D render of the Maya Halo collar assembling, lighting up and sending a radio signal');
        stage.current.prepend(canvas);
        halo = createHalo(canvas);
      } catch (err) {
        console.warn('[halo] WebGL unavailable, showing the still instead:', err);
        canvas?.remove();
        if (!disposed) { setNogl(true); setReady(true); }
        return;
      }

      root.current.querySelectorAll('[data-parts]').forEach((el) => { el.textContent = halo.partsCount; });
      halo.setReduced(reduced);

      const size = () => {
        const w = stage.current.clientWidth, h = stage.current.clientHeight;
        if (!w || !h) return;
        halo.resize(w, h, Math.min(window.devicePixelRatio || 1, window.innerWidth < 800 ? 1.5 : 2));
      };
      size();
      window.addEventListener('resize', size);
      cleanups.push(() => window.removeEventListener('resize', size));
      if (typeof ResizeObserver !== 'undefined') {
        const sro = new ResizeObserver(size);
        sro.observe(stage.current);
        cleanups.push(() => sro.disconnect());
      }

      // render only while the film is on screen
      const vis = { on: true };
      const io = new IntersectionObserver(([e]) => { vis.on = e.isIntersecting; }, { threshold: 0 });
      io.observe(track.current);
      cleanups.push(() => io.disconnect());

      if (!reduced && window.matchMedia('(pointer: fine)').matches) {
        const move = (e) => halo.setPointer((e.clientX / window.innerWidth - 0.5) * 2, (e.clientY / window.innerHeight - 0.5) * 2);
        window.addEventListener('pointermove', move, { passive: true });
        cleanups.push(() => window.removeEventListener('pointermove', move));
      }

      // scroll position → film progress. The stage pins at `headerH` from the top of the viewport.
      const progress = () => {
        const r = track.current.getBoundingClientRect();
        const span = r.height - stage.current.clientHeight;
        return span > 0 ? clamp01((headerH() - r.top) / span) : 0;
      };
      const state = { smooth: progress(), last: performance.now(), t0: performance.now(), frame: 0, shown: false };

      const updateCaptions = (p) => {
        CAPTIONS.forEach((c, i) => {
          const el = capEls.current[i];
          if (!el) return;
          const rise = Math.max(c.hold - c.in, 0.008);
          const fall = Math.max((c.out - c.hold) * 0.6, 0.008);
          let o = 0;
          if (p >= c.in && p <= c.out) o = clamp01(Math.min((p - c.in) / rise, 1) * Math.min((c.out - p) / fall, 1));
          el.style.opacity = o.toFixed(3);
          el.style.translate = `0 ${((p - c.hold) * -36).toFixed(1)}px`;
        });
        if (cue.current) cue.current.style.opacity = p < 0.012 ? 1 : 0;
      };

      const tick = (now) => {
        raf = requestAnimationFrame(tick);
        const dt = Math.min((now - state.last) / 1000, 0.5) || 0.016;
        state.last = now;
        const target = progress();
        // time-based easing: fast flicks glide, throttled tabs still converge
        state.smooth += (target - state.smooth) * (1 - Math.exp(-dt * 9));
        if (Math.abs(target - state.smooth) < 0.0003) state.smooth = target;
        updateCaptions(state.smooth);
        if (!vis.on) return;
        // when the scroll position isn't changing only idle effects move: half rate saves battery
        if (target === state.smooth && (state.frame++ & 1)) return;
        halo.render(state.smooth, (now - state.t0) / 1000);
        if (!state.shown) { state.shown = true; setReady(true); }
      };
      raf = requestAnimationFrame(tick);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanups.forEach((fn) => fn());
      halo?.dispose();
      canvas?.remove();
    };
  }, []);

  return (
    <div className={`halo${nogl ? ' nogl' : ''}`} ref={root}>
      <div className="halo-track" ref={track}>
        <div className="halo-stage" ref={stage}>
          {nogl && <img className="halo-poster" src={`${IMG}/hero.webp`} alt="Maya Halo collar" />}
          <div className="halo-vignette" />
          {CAPTIONS.map((c, i) => (
            <div key={i} ref={(el) => { capEls.current[i] = el; }} className={`halo-cap ${c.side}`}>
              {c.title}
              <p>{c.text}</p>
              {c.cta && <Link className="halo-cta" to="/shop/smart-gear">See the smart gear</Link>}
            </div>
          ))}
          <div className="halo-cue" ref={cue}>Scroll</div>
          <div className={`halo-loader${ready ? ' done' : ''}`} role="status" aria-live="polite">
            <div className="mark">Maya Halo</div>
            <div className="bar"><i /></div>
          </div>
        </div>
      </div>

      <div className="halo-body">
      <section className="halo-sec halo-manifesto">
        <Reveal>
          <p className="kicker">Maya Halo</p>
          <h2>Let them roam. <em>You’ll still know.</em></h2>
        </Reveal>
      </section>

      <section className="halo-sec">
        <div className="halo-split">
          <Reveal>
            <p className="kicker">Why no SIM</p>
            <h2>Mobile data runs out where the park begins.</h2>
            <p className="lead">Cheap GSM modules are unreliable. Good ones are expensive. And coverage fades exactly where pets like to wander. So we built the collar on LoRa: a radio that sips power and reaches for kilometres.</p>
          </Reveal>
          <Reveal><img src={`${IMG}/hero.webp`} alt="The Maya Halo collar, lit" width="1600" height="1000" loading="lazy" /></Reveal>
        </div>
      </section>

      <section className="halo-sec">
        <div className="halo-split flip">
          <Reveal>
            <p className="kicker">Craft — 01</p>
            <h2>A very quiet radio.</h2>
            <p className="lead">Each report is 41 bytes and about 185 ms of airtime. That is why a small cell lasts days, not hours, and why the collar can sleep between reports.</p>
          </Reveal>
          <Reveal><img src={`${IMG}/halo.webp`} alt="Close-up of the glowing halo ring on the module" width="1600" height="1000" loading="lazy" /></Reveal>
        </div>
      </section>

      <section className="halo-sec">
        <div className="halo-split">
          <Reveal>
            <p className="kicker">Craft — 02</p>
            <h2>Private by default.</h2>
            <p className="lead">Every collar has its own AES-128 key. Gateways relay bytes they can’t read, change or forge. Replayed messages are rejected.</p>
          </Reveal>
          <Reveal><img src={`${IMG}/exploded.webp`} alt="The collar exploded into its 23 parts" width="1600" height="1000" loading="lazy" /></Reveal>
        </div>
      </section>

      <section className="halo-sec">
        <div className="halo-split flip">
          <Reveal>
            <p className="kicker">Craft — 03</p>
            <h2>Works with no internet at all.</h2>
            <p className="lead">Hold a LoRa Finder and it hears the collar directly, then shows its position in the Pet Maya app over Bluetooth. It can ring the collar too.</p>
          </Reveal>
          <Reveal><img src={`${IMG}/signal.webp`} alt="Radio pulses spreading from the collar to nearby gateways" width="1600" height="1000" loading="lazy" /></Reveal>
        </div>
      </section>

      <section className="halo-sec">
        <div className="halo-stats">
          {[['0', 'SIM cards'], ['20 s', 'Fastest updates in lost mode'], ['15 km', 'Best case, clear line of sight'], ['AES-128', 'Per-collar encryption']].map(([n, l]) => (
            <Reveal key={l}><div className="num">{n}</div><div className="lbl">{l}</div></Reveal>
          ))}
        </div>
      </section>

      <section className="halo-sec halo-specs">
        <Reveal>
          <p className="kicker" style={{ textAlign: 'center' }}>Specifications</p>
          <table>
            <tbody>
              {[
                ['Positioning', 'u-blox NEO-6M GPS'],
                ['Radio', 'LoRa, 433 MHz (SX1278)'],
                ['Security', 'AES-128-CCM, replay-protected'],
                ['Reporting', '20 s · 5 min · 30 min (set in the app)'],
                ['Range', '1–3 km city · 5–15 km line of sight'],
                ['Battery', 'About 9–10 days at 2-min reports*'],
                ['Alerts', 'Safe-zone exit · low battery · lost mode'],
                ['Find it', '30 s buzzer · offline LoRa Finder'],
                ['Mobile data', 'None'],
              ].map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
            </tbody>
          </table>
          <p className="fineprint">* Estimate for a 1000 mAh cell with a power-optimised build. Range depends on local regulations, antenna and terrain.</p>
        </Reveal>
      </section>

      <section className="halo-sec halo-quote">
        <Reveal>
          <blockquote>Every gateway we install makes the network better for every pet.</blockquote>
          <cite>The Pet Maya network</cite>
        </Reveal>
      </section>

      <section className="halo-sec">
        <div className="halo-gallery">
          <Reveal className="g1"><img src={`${IMG}/hero.webp`} alt="Maya Halo, front three-quarter" loading="lazy" /></Reveal>
          <Reveal className="g2"><img src={`${IMG}/buckle.webp`} alt="Titanium buckle and D-ring" loading="lazy" /></Reveal>
          <Reveal className="g3"><img src={`${IMG}/weave.webp`} alt="Woven strap with teal stitching" loading="lazy" /></Reveal>
          <Reveal className="g4"><img src={`${IMG}/halo.webp`} alt="The halo module" loading="lazy" /></Reveal>
        </div>
      </section>

      <section className="halo-sec halo-ctaband">
        <Reveal>
          <h2>Know they’re <em>home.</em></h2>
          <div className="row">
            <Link className="halo-cta solid" to="/shop/smart-gear">Shop smart gear</Link>
            <Link className="halo-cta" to="/gps">See the GPS radar</Link>
          </div>
        </Reveal>
      </section>

      <p className="halo-note">A concept render · everything above was drawn live in your browser</p>
      </div>
    </div>
  );
}
