import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '../ui/index.jsx';
import { getConsent, setConsent } from '../lib/analytics.js';

// Asks once. "Accept" turns on marketing measurement (Meta / Google Ads); "Only essentials" keeps it off.
// Anonymous site analytics stay on unless the browser sends Do Not Track.
export default function ConsentBar() {
  const [open, setOpen] = useState(false);
  const barRef = useRef(null);
  useEffect(() => { setOpen(!getConsent().decided); }, []);

  // Publish the space the banner takes (its height + the 12px under it) as --consent-space, so everything else that
  // floats at the bottom of the screen (Ask Maya AI, the compare bar, toasts, the buy bar) can sit above it instead of
  // on top of its buttons. Its height changes with the screen width, so it is measured, not guessed.
  useLayoutEffect(() => {
    const el = barRef.current;
    if (!open || !el) return undefined;
    const root = document.documentElement;
    const publish = () => root.style.setProperty('--consent-space', `${Math.ceil(el.getBoundingClientRect().height) + 12}px`);
    publish();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(publish) : null;
    ro?.observe(el);
    return () => { ro?.disconnect(); root.style.removeProperty('--consent-space'); };
  }, [open]);

  if (!open) return null;
  const choose = (ads) => { setConsent({ analytics: true, ads }); setOpen(false); };
  return (
    <div ref={barRef} className="consent-bar" role="dialog" aria-label="Cookie preferences">
      <p>
        We measure how the site is used to make it faster and easier. With your OK we also use marketing cookies to
        show Pet Maya ads to people who might like it. <a href="/privacy-policy">Privacy policy</a>
      </p>
      <div className="consent-actions">
        <Button variant="outline" size="sm" onClick={() => choose(false)}>Only essentials</Button>
        <Button variant="dark" size="sm" onClick={() => choose(true)}>Accept</Button>
      </div>
    </div>
  );
}
