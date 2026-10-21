// Announcement bar: the settings document, its defaults, and the rules for what the website will show.
// The admin edits settings/announcement; the website only ever renders what normalizeAnnouncement() lets through,
// so a bad value in the database (bad link, bad colour, too many messages) cannot break or hijack the bar.
import { ANNOUNCEMENTS } from '../data/content.js';

export const MAX_MESSAGES = 8;
export const MAX_TEXT = 140;
export const MIN_ROTATE = 3;
export const MAX_ROTATE = 30;

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
// Same rule as safeInternalPath() in security.js, kept here so this file stays free of browser-only imports (DOMPurify).
const SITE_PATH = /^\/(?![/\\])[\w\-./?=&%#:+~]*$/;

/** What the site shows until an admin saves their own: the three messages it always had. */
export const DEFAULT_ANNOUNCEMENT = Object.freeze({
  enabled: true,
  messages: ANNOUNCEMENTS.map((text, i) => ({ id: `default-${i + 1}`, text, linkUrl: '', active: true, startAt: null, endAt: null })),
  rotateSeconds: 6,
  bgColor: '',   // '' = follow the light/dark theme
  textColor: '',
  dismissible: false,
  rightLink: { enabled: true, text: 'Track order →', url: '/account/orders' },
});

/** A link is a path on this site or an https URL. javascript:, data:, http: and //host are dropped. */
export function cleanLink(url) {
  const s = String(url ?? '').trim().slice(0, 300);
  if (!s) return '';
  if (SITE_PATH.test(s)) return s;
  try { const u = new URL(s); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; }
}

export const cleanColor = (v) => (HEX.test(String(v ?? '').trim()) ? String(v).trim() : '');

const clipText = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const ms = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.round(Number(v)) : null);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const copyDefaults = () => ({ ...DEFAULT_ANNOUNCEMENT, messages: DEFAULT_ANNOUNCEMENT.messages.map((m) => ({ ...m })), rightLink: { ...DEFAULT_ANNOUNCEMENT.rightLink } });

/** Any stored value (or nothing) → a complete, safe configuration. */
export function normalizeAnnouncement(raw) {
  if (!raw || typeof raw !== 'object') return copyDefaults();
  const d = DEFAULT_ANNOUNCEMENT;
  const messages = Array.isArray(raw.messages)
    ? raw.messages.slice(0, MAX_MESSAGES).map((m, i) => ({
      id: clipText(m?.id, 40) || `m${i + 1}`,
      text: clipText(m?.text, MAX_TEXT),
      linkUrl: cleanLink(m?.linkUrl),
      active: m?.active !== false,
      startAt: ms(m?.startAt),
      endAt: ms(m?.endAt),
    })).filter((m) => m.text)
    : copyDefaults().messages;
  const rl = raw.rightLink && typeof raw.rightLink === 'object' ? raw.rightLink : null;
  const rightUrl = rl ? cleanLink(rl.url) : d.rightLink.url;
  const rightText = rl ? clipText(rl.text, 40) : d.rightLink.text;
  return {
    enabled: raw.enabled !== false,
    messages,
    rotateSeconds: clamp(Math.round(Number(raw.rotateSeconds)) || d.rotateSeconds, MIN_ROTATE, MAX_ROTATE),
    bgColor: cleanColor(raw.bgColor),
    textColor: cleanColor(raw.textColor),
    dismissible: raw.dismissible === true,
    rightLink: { enabled: (rl ? rl.enabled !== false : true) && !!rightText && !!rightUrl, text: rightText, url: rightUrl },
    updatedAt: ms(raw.updatedAt),
  };
}

/** The messages that may be on screen right now (switched on, and inside their start/end dates). */
export const activeMessages = (cfg, now = Date.now()) =>
  (cfg?.messages || []).filter((m) => m.active && (!m.startAt || now >= m.startAt) && (!m.endAt || now < m.endAt));

export const isBarVisible = (cfg, now = Date.now()) => !!cfg?.enabled && activeMessages(cfg, now).length > 0;

/** Changes whenever the admin edits a message, so a visitor who closed the bar sees the new one. */
export function announcementVersion(cfg) {
  const s = JSON.stringify((cfg?.messages || []).map((m) => [m.text, m.linkUrl]));
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return String(h >>> 0);
}

// ── colour contrast (admin warning) ────────────────────────────────────────────────────────────────
const toRgb = (hex) => {
  let h = String(hex).replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const luminance = (hex) => {
  const [r, g, b] = toRgb(hex).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** WCAG contrast ratio of two #hex colours (1–21). Text needs 4.5 or more. */
export function contrastRatio(a, b) {
  if (!HEX.test(a) || !HEX.test(b)) return null;
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}
