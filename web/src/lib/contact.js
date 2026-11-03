// Support contact details (settings/support, edited in admin -> Support center -> Contact details). Pure helpers, no
// browser imports, so they run under `node --test`. The Flutter app has the same rules in SupportContact (keep in step).
// There are up to two phone numbers (`phone`, `phone2`) and two WhatsApp numbers (`whatsapp`, `whatsapp2`).

/** Digits only, for a wa.me link: Bangladesh local numbers (01XXXXXXXXX) get the 880 country code. */
export function waDigits(raw) {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = `880${d.slice(1)}`;
  return d;
}

/** A phone number that can be dialled: keeps a leading + and digits, drops spaces, dashes and brackets. */
export function dialNumber(raw) {
  const s = String(raw ?? '').trim();
  const digits = s.replace(/\D/g, '');
  if (!digits) return '';
  return s.startsWith('+') ? `+${digits}` : digits;
}

export const telHref = (raw) => { const n = dialNumber(raw); return n ? `tel:${n}` : ''; };

export function whatsappHref(raw, text = '') {
  const d = waDigits(raw);
  if (d.length < 8) return '';
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

/** What the admin form accepts: digits with an optional leading +, spaces, dashes and brackets. */
export const isPhoneLike = (v) => /^\+?[\d\s\-()]{6,30}$/.test(String(v ?? '').trim());
export const isEmailLike = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v ?? '').trim());

const PHONE_MSG = 'Use digits only, for example 01712 345678 or +880 1712 345678.';

/** Cleans the form before it is saved; returns { data, errors }. Empty fields are allowed (they hide the button). */
export function cleanContactForm(f) {
  const t = (k) => String(f[k] ?? '').trim();
  const data = {
    phone: t('phone'),
    phone2: t('phone2'),
    whatsapp: t('whatsapp'),
    whatsapp2: t('whatsapp2'),
    email: t('email'),
    hours: t('hours').slice(0, 80),
  };
  const errors = {};
  for (const k of ['phone', 'phone2']) {
    if (data[k] && !isPhoneLike(data[k])) errors[k] = PHONE_MSG;
  }
  for (const k of ['whatsapp', 'whatsapp2']) {
    if (data[k] && !isPhoneLike(data[k])) errors[k] = PHONE_MSG;
    else if (data[k] && waDigits(data[k]).length < 8) errors[k] = 'That number looks too short.';
  }
  if (data.email && !isEmailLike(data.email)) errors.email = 'That email address does not look right.';
  return { data, errors };
}

/**
 * The buttons to show: { calls: [{ number, href }], chats: [{ number, href }] }. Empty or unusable numbers are
 * skipped, and the same number entered twice (in any format) appears once.
 */
export function contactNumbers(c = {}, chatText = '') {
  const seen = new Set();
  const calls = [];
  for (const raw of [c.phone, c.phone2]) {
    const number = String(raw ?? '').trim();
    const key = dialNumber(number).replace(/^\+?880/, '0').replace(/^\+/, '');
    if (!telHref(number) || seen.has(key)) continue;
    seen.add(key);
    calls.push({ number, href: telHref(number) });
  }
  const seenChat = new Set();
  const chats = [];
  for (const raw of [c.whatsapp, c.whatsapp2]) {
    const number = String(raw ?? '').trim();
    const href = whatsappHref(number, chatText);
    const key = waDigits(number);
    if (!href || seenChat.has(key)) continue;
    seenChat.add(key);
    chats.push({ number, href });
  }
  return { calls, chats };
}
