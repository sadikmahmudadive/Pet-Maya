// Support contact details (settings/support, edited in admin -> Support center -> Contact details). Pure helpers, no
// browser imports, so they run under `node --test`. The Flutter app has the same rules in SupportContact (keep in step).

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

/** Cleans the form before it is saved; returns { data, errors }. Empty fields are allowed (they hide the button). */
export function cleanContactForm(f) {
  const data = {
    phone: String(f.phone ?? '').trim(),
    whatsapp: String(f.whatsapp ?? '').trim(),
    email: String(f.email ?? '').trim(),
    hours: String(f.hours ?? '').trim().slice(0, 80),
  };
  const errors = {};
  if (data.phone && !isPhoneLike(data.phone)) errors.phone = 'Use digits only, for example 01712 345678 or +880 1712 345678.';
  if (data.whatsapp && !isPhoneLike(data.whatsapp)) errors.whatsapp = 'Use digits only, for example 01712 345678 or +880 1712 345678.';
  if (data.whatsapp && !errors.whatsapp && waDigits(data.whatsapp).length < 8) errors.whatsapp = 'That number looks too short.';
  if (data.email && !isEmailLike(data.email)) errors.email = 'That email address does not look right.';
  return { data, errors };
}
