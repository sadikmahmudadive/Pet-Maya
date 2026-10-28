import { useEffect } from 'react';

function setMeta(attr, key, val) {
  if (!val) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', val);
}

/**
 * Title, description, social-share tags, canonical link and (optionally) schema.org JSON-LD for the page that is open.
 * The JSON-LD block is removed again when the page closes, so it never leaks onto the next route.
 */
export function usePageMeta({ title, description, image, type = 'website', path, jsonLd } = {}) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    if (!title) return undefined;
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', window.location.origin + (path ?? window.location.pathname));
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.setAttribute('rel', 'canonical'); document.head.appendChild(canonical); }
    canonical.setAttribute('href', window.location.origin + (path ?? window.location.pathname));
    let script = null;
    if (ld) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.pageMeta = '1';
      script.textContent = ld;
      document.head.appendChild(script);
    }
    return () => { script?.remove(); };
  }, [title, description, image, type, path, ld]);
}
