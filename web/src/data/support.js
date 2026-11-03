import { useDoc } from './firestore.js';
import { BRAND } from './content.js';

/**
 * Support contact details from settings/support (edited in admin -> Support center -> Contact details), falling back
 * to the defaults in data/content.js. Never throws; while loading or offline it returns the defaults.
 */
export function useSupportContact() {
  const { data, loading } = useDoc('settings', 'support');
  return {
    loading,
    phone: (data?.phone ?? BRAND.supportPhone ?? '').trim(),
    phone2: (data?.phone2 ?? '').trim(),
    whatsapp: (data?.whatsapp ?? '').trim(),
    whatsapp2: (data?.whatsapp2 ?? '').trim(),
    email: (data?.email || BRAND.supportEmail || '').trim(),
    hours: (data?.hours ?? '').trim(),
  };
}
