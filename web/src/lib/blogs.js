// Blog articles: reading a Firestore document into what the pages show, plus the search-engine data for an article.
// Pure (no React, no Firebase) so it can be unit-tested. Both clients write to the same `blogs` collection:
//   app   { title, content, authorId, authorName, authorPhoto, imageUrl, category, timestamp (ms), readTimeMinutes, tags, status, isApproved }
//   older web/sample shapes { body, summary, coverUrl, date, readTime, ... } are still understood.

export const BLOG_PAGE_SIZE = 12;
export const blogPath = (id) => `/journal/${encodeURIComponent(id)}`;

const ENTITIES = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'" };

/** Article HTML (or plain text) → plain text on one line. Used for excerpts, read time and search descriptions. */
export function plainText(html) {
  return String(html ?? '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(nbsp|amp|lt|gt|quot|#39|apos);/g, (m) => ENTITIES[m])
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cuts at a word boundary and adds an ellipsis only when something was removed. */
export function truncate(text, max) {
  const t = String(text ?? '').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const at = cut.lastIndexOf(' ');
  return `${(at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s,.;:–-]+$/, '')}…`;
}

/** Whole minutes to read, at 220 words a minute, never below 1. */
export function readMinutes(text) {
  const words = plainText(text).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** A stored time in any of the shapes the clients write → milliseconds (0 when unknown). */
export function millisOf(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v > 1e11 ? v : v * 1000; // seconds → ms
  if (typeof v === 'string') {
    // Only ISO dates and numbers: Date.parse also "understands" free text such as "Spring 2025" (as 1 Jan 2025).
    const s = v.trim();
    if (/^\d+(\.\d+)?$/.test(s)) return millisOf(Number(s));
    const t = /^\d{4}-\d{2}-\d{2}/.test(s) ? Date.parse(s) : NaN;
    return Number.isFinite(t) ? t : 0;
  }
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  return 0;
}

/** "12 Oct 2026", in Dhaka time so the day does not depend on where the reader's device is. */
export function formatPostDate(ms) {
  if (!ms) return '';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' }).format(new Date(ms));
}

const text = (v) => String(v ?? '').trim();

/** Firestore blog document → the article the pages use. */
export function normBlog(id, d = {}) {
  const body = String(d.content ?? d.body ?? '');
  const ms = millisOf(d.timestamp ?? d.publishedAt ?? d.createdAt ?? d.date);
  const stored = Number(d.readTimeMinutes ?? d.readMin ?? d.readTime);
  const tags = (Array.isArray(d.tags) ? d.tags : []).map(text).filter(Boolean).slice(0, 10);
  return {
    id,
    title: text(d.title) || 'Untitled',
    excerpt: text(d.excerpt || d.summary) || truncate(plainText(body), 160),
    category: text(d.category) || 'Pet care',
    author: text(d.authorName || d.author) || 'Pet Maya',
    authorPhoto: text(d.authorPhoto),
    readMin: stored > 0 ? Math.round(stored) : readMinutes(body),
    timestamp: ms,
    date: ms ? formatPostDate(ms) : (typeof d.date === 'string' ? d.date.trim() : ''),
    image: text(d.imageUrl || d.coverUrl || d.coverImage || d.image),
    featured: d.featured === true || d.featured === 'true',
    tone: text(d.tone),
    tags,
    content: body,
    // Only an explicit isApproved:true is public. Older documents without the field are not shown.
    published: d.isApproved === true,
  };
}

/** Newest first; articles without a date go last, in their original order. */
export const newestFirst = (a, b) => (b.timestamp || 0) - (a.timestamp || 0);

/** schema.org Article data for search engines. `site` has no trailing slash. */
export function articleJsonLd(post, site) {
  const url = `${site}${blogPath(post.id)}`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: truncate(post.title, 110),
    description: truncate(post.excerpt || plainText(post.content), 200),
    articleSection: post.category,
    author: { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Organization', name: 'Pet Maya', url: site },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
  };
  if (post.image) data.image = [post.image];
  if (post.timestamp) { data.datePublished = new Date(post.timestamp).toISOString(); data.dateModified = data.datePublished; }
  if (post.tags.length) data.keywords = post.tags.join(', ');
  return data;
}

/** Cards on the journal page: matches the search box and the chosen category. */
export function filterArticles(items, { query = '', category = 'all' } = {}) {
  const q = query.trim().toLowerCase();
  return items.filter((b) => (category === 'all' || b.category === category)
    && (!q || `${b.title} ${b.excerpt} ${b.author} ${b.tags.join(' ')}`.toLowerCase().includes(q)));
}
