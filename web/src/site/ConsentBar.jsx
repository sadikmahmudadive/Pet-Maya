import { useEffect, useState } from 'react';
import { Button } from '../ui/index.jsx';
import { getConsent, setConsent } from '../lib/analytics.js';

// Asks once. "Accept" turns on marketing measurement (Meta / Google Ads); "Only essentials" keeps it off.
// Anonymous site analytics stay on unless the browser sends Do Not Track.
export default function ConsentBar() {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(!getConsent().decided); }, []);
  if (!open) return null;
  const choose = (ads) => { setConsent({ analytics: true, ads }); setOpen(false); };
  return (
    <div className="consent-bar" role="dialog" aria-label="Cookie preferences">
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
