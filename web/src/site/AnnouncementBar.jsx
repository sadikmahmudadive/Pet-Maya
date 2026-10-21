import { useEffect, useMemo, useState } from 'react';
import { Link } from '../lib/router.jsx';
import { Icon } from '../ui/index.jsx';
import { useDoc } from '../data/firestore.js';
import { activeMessages, announcementVersion, normalizeAnnouncement } from '../lib/announcement.js';

const CACHE_KEY = 'pm_announce_cache';
const DISMISS_KEY = 'pm_announce_dismissed';

const readJson = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const writeJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

/** The live configuration (settings/announcement), safe to render. The last copy is kept in the browser so the bar
 *  (and its height) is right on the first paint instead of jumping once Firestore answers. */
export function useAnnouncementConfig() {
  const { data } = useDoc('settings', 'announcement');
  const cached = useMemo(() => readJson(CACHE_KEY), []);
  useEffect(() => { if (data) writeJson(CACHE_KEY, data); }, [data]);
  return useMemo(() => normalizeAnnouncement(data ?? cached), [data, cached]);
}

const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

/** The bar itself. `preview` is the admin's live preview: links do nothing and the bar can't be dismissed. */
export default function AnnouncementBar({ config, preview = false, ignoreSchedule = false }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t); }, []); // start/end dates

  const msgs = useMemo(
    () => (ignoreSchedule ? config.messages.filter((m) => m.active) : activeMessages(config, now)),
    [config, now, ignoreSchedule],
  );

  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const still = useMemo(reducedMotion, []);
  useEffect(() => {
    if (msgs.length < 2 || paused || still) return undefined;
    const t = setInterval(() => setI((x) => x + 1), config.rotateSeconds * 1000);
    return () => clearInterval(t);
  }, [msgs.length, paused, still, config.rotateSeconds]);

  const version = announcementVersion(config);
  const [closed, setClosed] = useState(() => (preview ? null : readJson(DISMISS_KEY)));
  const dismiss = () => { setClosed(version); writeJson(DISMISS_KEY, version); };

  if (!config.enabled || msgs.length === 0) return null;
  if (!preview && config.dismissible && closed === version) return null;

  const m = msgs[i % msgs.length];
  const style = {};
  if (config.bgColor) style['--announce-bg'] = config.bgColor;
  if (config.textColor) style['--announce-ink'] = config.textColor;
  const inert = preview ? { onClick: (e) => e.preventDefault() } : {};

  return (
    <div
      className="announce" role="region" aria-label="Announcement" style={style}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
    >
      <div className="container row between">
        <span className="announce-msg">
          {m.linkUrl
            ? <Link key={`${m.id}-${i}`} to={m.linkUrl} className="announce-text announce-link" {...inert}>{m.text}</Link>
            : <span key={`${m.id}-${i}`} className="announce-text">{m.text}</span>}
        </span>
        <span className="announce-right row gap-12">
          {config.rightLink.enabled && <Link to={config.rightLink.url} className="announce-text" {...inert}>{config.rightLink.text}</Link>}
          {config.dismissible && !preview && (
            <button type="button" className="announce-close" aria-label="Dismiss announcement" onClick={dismiss}><Icon name="x" size={14} /></button>
          )}
        </span>
      </div>
    </div>
  );
}
