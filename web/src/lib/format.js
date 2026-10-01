export const TAKA = '৳';

export function money(n, { compact = false } = {}) {
  const v = Number(n) || 0;
  if (compact) {
    if (Math.abs(v) >= 1_000_000) return `${TAKA}${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (Math.abs(v) >= 1_000) return `${TAKA}${(v / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `${TAKA}${Math.round(v).toLocaleString('en-US')}`;
}

export function num(n) {
  return (Number(n) || 0).toLocaleString('en-US');
}

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function toMillis(v) {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  const t = Date.parse(v);
  return Number.isNaN(t) ? 0 : t;
}

export function timeOfDay(ms) {
  if (!ms) return '—';
  return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function shortDate(ms) {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ago(ms) {
  if (!ms) return '';
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)} d ago`;
  return shortDate(ms);
}

export function minutesSince(ms) {
  if (!ms) return 0;
  return Math.max(0, Math.round((Date.now() - ms) / 60000));
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export const cx = (...a) => a.filter(Boolean).join(' ');
