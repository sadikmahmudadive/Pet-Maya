/* ───────────────────────────────────────────────────────────
   Browser-side security helpers shared by the site and admin.
   Server-side equivalents live in firestore.rules, storage.rules
   and functions/src/security.ts — these are defence in depth.
   ─────────────────────────────────────────────────────────── */
import DOMPurify from 'dompurify';

/** Escape text for interpolation into HTML strings (print windows). */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"'`]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;',
  }[c]));
}

/** In-app path like "/account/orders/1", or '' for anything else
 *  (javascript:, data:, //evil.com, https://phish …). */
export function safeInternalPath(url) {
  const s = String(url ?? '').trim();
  return /^\/(?![/\\])[\w\-./?=&%#:+~]*$/.test(s) ? s : '';
}

/** href safe to render: relative paths, #anchors, http(s), mailto and tel. */
export function safeHref(to) {
  const s = String(to ?? '').trim();
  if (s === '' || s.startsWith('#')) return s;
  if (s.startsWith('/') && !/^\/[/\\]/.test(s)) return s;
  if (/^(https?:|mailto:|tel:)/i.test(s)) return s;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s) && !s.startsWith('//')) return s; // relative like "page.html"
  return '#';
}

/** Sanitised HTML for user/admin-authored rich text (blog posts). */
export function sanitizeHtml(html) {
  return DOMPurify.sanitize(String(html ?? ''), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['style'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}

// Links in sanitised content open safely in a new tab.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer nofollow');
  }
});

/* ── Uploads ──────────────────────────────────────────────── */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;

function sniff(bytes) {
  const at = (o, sig) => sig.every((b, i) => bytes[o + i] === b);
  const ascii = (o, s) => at(o, [...s].map((c) => c.charCodeAt(0)));
  if (at(0, [0xff, 0xd8, 0xff])) return { contentType: 'image/jpeg', ext: 'jpg' };
  if (at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { contentType: 'image/png', ext: 'png' };
  if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) return { contentType: 'image/webp', ext: 'webp' };
  if (ascii(0, 'GIF8')) return { contentType: 'image/gif', ext: 'gif' };
  if (ascii(4, 'ftyp') && ['heic', 'heix', 'hevc', 'mif1', 'msf1'].some((b) => ascii(8, b))) {
    return { contentType: 'image/heic', ext: 'heic' };
  }
  if (ascii(0, '%PDF-')) return { contentType: 'application/pdf', ext: 'pdf' };
  return null;
}

/**
 * Checks a File's real type (magic bytes, not its name or the browser's guess)
 * and size. kind: 'image' (≤ 5 MB) or 'document' (PDF/photo, ≤ 15 MB).
 * Resolves to { contentType, ext }; rejects with a user-facing Error.
 */
export async function validateUpload(file, kind = 'image') {
  if (!file) throw new Error('Please choose a file.');
  const max = kind === 'image' ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
  if (file.size <= 0) throw new Error('That file is empty.');
  if (file.size > max) throw new Error(`That file is too large (max ${max / 1024 / 1024} MB).`);
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const type = sniff(head);
  if (!type || (kind === 'image' && type.contentType === 'application/pdf')) {
    throw new Error(kind === 'image'
      ? 'Please choose a JPEG, PNG, WebP, GIF or HEIC photo.'
      : 'Please choose a PDF or a photo.');
  }
  return type;
}

/** Storage path inside the uploader's own folder: `${folder}/${uid}/${stamp}.${ext}`. */
export function ownUploadPath(folder, uid, ext) {
  return `${folder}/${uid}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

/* ── Print windows ────────────────────────────────────────── */

/**
 * Opens a print window for HTML the caller built with escapeHtml() around every
 * dynamic value. Printing is triggered from here, not by an inline <script>,
 * so it keeps working under the site's Content-Security-Policy.
 */
export function openPrintWindow(html, { features = 'width=720,height=900', closeAfter = false } = {}) {
  const w = window.open('', '_blank', features);
  if (!w) return null;
  w.opener = null; // the printed page can't reach back into the admin app
  w.document.open();
  w.document.write(html);
  w.document.close();
  const print = () => {
    w.focus();
    w.print();
    if (closeAfter) setTimeout(() => w.close(), 300);
  };
  if (w.document.readyState === 'complete') setTimeout(print, 50);
  else w.addEventListener('load', print, { once: true });
  return w;
}
