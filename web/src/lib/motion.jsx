import { useEffect, useRef, useState } from 'react';

export const prefersReduced = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ── Scroll reveal ──────────────────────────────────────────
   One shared IntersectionObserver for the whole page; each
   element gets `.in` once and is then unobserved.            */
let io;
function observer() {
  if (io) return io;
  io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }),
    { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
  );
  return io;
}

export function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // Never leave content invisible if the browser can't observe it.
    if (prefersReduced() || typeof IntersectionObserver === 'undefined') { el.classList.add('in'); return undefined; }
    const o = observer();
    o.observe(el);
    return () => o.unobserve(el);
  }, []);
  return ref;
}

/** Fades + lifts its children into view. `stagger` cascades direct children. */
export function Reveal({ as: Tag = 'div', delay = 0, stagger = false, className = '', style, children, ...rest }) {
  const ref = useReveal();
  return (
    <Tag
      ref={ref}
      className={`reveal${stagger ? ' reveal-stagger' : ''}${className ? ` ${className}` : ''}`}
      style={delay ? { ...style, transitionDelay: `${delay}ms` } : style}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ── Animated number ───────────────────────────────────────── */
export function Count({ value, format = (n) => Math.round(n).toLocaleString('en-US'), duration = 1100, className }) {
  const target = Number(value) || 0;
  const [n, setN] = useState(() => (prefersReduced() ? target : 0));
  const ref = useRef(null);
  const ran = useRef(false);

  useEffect(() => {
    if (prefersReduced() || ran.current || typeof IntersectionObserver === 'undefined') { setN(target); return undefined; }
    const el = ref.current;
    if (!el) return undefined;
    let raf;
    const o = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      o.disconnect();
      ran.current = true;
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / duration);
        setN(target * (1 - (1 - p) ** 3));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    o.observe(el);
    return () => { o.disconnect(); cancelAnimationFrame(raf); };
  }, [target, duration]);

  return <span ref={ref} className={className ? `count-val ${className}` : 'count-val'}>{format(n)}</span>;
}

/* ── Misc hooks ────────────────────────────────────────────── */

/** true once the page is scrolled past `y` — used for the glass header. */
export function useScrolled(y = 8) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const f = () => setOn(window.scrollY > y);
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, [y]);
  return on;
}

/** Adds a class for one animation cycle whenever `dep` changes. */
export function useBump(dep, ms = 420) {
  const [on, setOn] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    if (prefersReduced()) return undefined;
    setOn(true);
    const t = setTimeout(() => setOn(false), ms);
    return () => clearTimeout(t);
  }, [dep, ms]);
  return on;
}

/** Locks body scroll while a drawer or modal is open. */
export function useLockBody(active) {
  useEffect(() => {
    if (!active) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [active]);
}

/** Pointer-following highlight for large panels. Returns props to spread. */
export function useSpotlight() {
  const ref = useRef(null);
  const onMouseMove = (e) => {
    const el = ref.current;
    if (!el || prefersReduced()) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  return { ref, onMouseMove };
}
