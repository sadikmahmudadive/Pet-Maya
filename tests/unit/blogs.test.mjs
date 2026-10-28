// Blog article logic (pure, no browser). Run: node --test tests/unit/blogs.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  articleJsonLd, blogPath, filterArticles, formatPostDate, millisOf, newestFirst, normBlog, plainText, readMinutes, truncate,
} from '../../web/src/lib/blogs.js';

const T = Date.UTC(2026, 9, 12, 8, 0, 0); // 12 Oct 2026, 14:00 in Dhaka

test('HTML becomes plain text: tags, scripts, entities and spacing', () => {
  assert.equal(plainText('<p>Fleas &amp; ticks</p><script>alert(1)</script><p>are&nbsp;common.</p>'), 'Fleas & ticks are common.');
  assert.equal(plainText(null), '');
  assert.equal(plainText('Plain text stays.'), 'Plain text stays.');
});

test('truncate cuts at a word and only marks real cuts', () => {
  assert.equal(truncate('short text', 50), 'short text');
  const t = truncate('Keep your dog cool in the heat with shade, water and short walks early in the morning', 40);
  assert.ok(t.endsWith('…') && t.length <= 40, t);
  assert.ok(!/\s…$/.test(t));
  assert.equal(truncate('x'.repeat(100), 10).length, 10);
});

test('read time: about 220 words a minute, at least one minute', () => {
  assert.equal(readMinutes('word '.repeat(10)), 1);
  assert.equal(readMinutes('word '.repeat(660)), 3);
  assert.equal(readMinutes('<p>' + 'word '.repeat(440) + '</p>'), 2);
  assert.equal(readMinutes(''), 1);
});

test('stored times in every shape the clients use', () => {
  assert.equal(millisOf(T), T);
  assert.equal(millisOf(T / 1000), T);                       // seconds
  assert.equal(millisOf(new Date(T).toISOString()), T);
  assert.equal(millisOf({ toMillis: () => T }), T);          // Firestore Timestamp
  assert.equal(millisOf({ seconds: T / 1000 }), T);
  assert.equal(millisOf('not a date'), 0);
  assert.equal(millisOf('Spring 2025'), 0);                  // free text is not a date
  assert.equal(millisOf(String(T)), T);
  assert.equal(millisOf(undefined), 0);
});

test('dates show the Dhaka day', () => {
  assert.equal(formatPostDate(T), '12 Oct 2026');
  assert.equal(formatPostDate(Date.UTC(2026, 9, 12, 19, 0, 0)), '13 Oct 2026'); // already the 13th in Dhaka
  assert.equal(formatPostDate(0), '');
});

test('an app document becomes an article with real date, read time and tags', () => {
  const a = normBlog('b1', {
    title: ' Heat tips ', content: '<p>' + 'word '.repeat(450) + '</p>', authorId: 'u1', authorName: 'Dr. Rahman', authorPhoto: 'https://x/p.jpg',
    imageUrl: 'https://x/c.jpg', category: 'Health', timestamp: T, readTimeMinutes: 4, tags: ['summer', ' dogs ', '', 5], isApproved: true, status: 'APPROVED',
  });
  assert.equal(a.title, 'Heat tips');
  assert.equal(a.author, 'Dr. Rahman');
  assert.equal(a.readMin, 4);
  assert.equal(a.date, '12 Oct 2026');
  assert.equal(a.timestamp, T);
  assert.deepEqual(a.tags, ['summer', 'dogs', '5']);
  assert.equal(a.image, 'https://x/c.jpg');
  assert.equal(a.published, true);
  assert.ok(a.excerpt.length <= 160 && !a.excerpt.includes('<'));
});

test('older shapes and missing fields still read sensibly', () => {
  const a = normBlog('b2', { title: 'Old', body: 'word '.repeat(440), summary: 'Short summary', coverUrl: 'https://x/o.jpg', date: 'Spring 2025' });
  assert.equal(a.excerpt, 'Short summary');
  assert.equal(a.image, 'https://x/o.jpg');
  assert.equal(a.readMin, 2);
  assert.equal(a.date, 'Spring 2025');                       // free text date kept when it cannot be parsed as a date
  const e = normBlog('b3', {});
  assert.deepEqual([e.title, e.author, e.category, e.date, e.tags.length, e.readMin], ['Untitled', 'Pet Maya', 'Pet care', '', 0, 1]);
});

test('only an explicit isApproved: true counts as published', () => {
  assert.equal(normBlog('a', { isApproved: true }).published, true);
  for (const d of [{}, { isApproved: false }, { isApproved: 'true' }, { status: 'APPROVED' }]) assert.equal(normBlog('a', d).published, false);
});

test('newest first, undated last', () => {
  const list = [normBlog('old', { timestamp: T - 1e9 }), normBlog('none', {}), normBlog('new', { timestamp: T })].sort(newestFirst);
  assert.deepEqual(list.map((x) => x.id), ['new', 'old', 'none']);
});

test('search data for an article', () => {
  const a = normBlog('b 1', { title: 'T'.repeat(150), content: '<p>Body text here.</p>', authorName: 'Dr. Rahman', imageUrl: 'https://x/c.jpg', category: 'Health', timestamp: T, tags: ['summer', 'dogs'] });
  const ld = articleJsonLd(a, 'https://www.petmaya.app');
  assert.equal(ld['@type'], 'Article');
  assert.ok(ld.headline.length <= 110);
  assert.equal(ld.url, 'https://www.petmaya.app/journal/b%201');
  assert.equal(blogPath('b 1'), '/journal/b%201');
  assert.equal(ld.datePublished, new Date(T).toISOString());
  assert.deepEqual(ld.image, ['https://x/c.jpg']);
  assert.equal(ld.keywords, 'summer, dogs');
  assert.equal(ld.author.name, 'Dr. Rahman');
  const bare = articleJsonLd(normBlog('x', { title: 'No extras' }), 'https://www.petmaya.app');
  assert.ok(!('image' in bare) && !('datePublished' in bare) && !('keywords' in bare));
});

test('journal search and category filter', () => {
  const items = [
    normBlog('1', { title: 'Heat tips', category: 'Health', authorName: 'Dr. Rahman', tags: ['summer'] }),
    normBlog('2', { title: 'Best kibble', category: 'Nutrition', authorName: 'Pet Maya' }),
  ];
  assert.equal(filterArticles(items).length, 2);
  assert.deepEqual(filterArticles(items, { category: 'Health' }).map((x) => x.id), ['1']);
  assert.deepEqual(filterArticles(items, { query: ' SUMMER ' }).map((x) => x.id), ['1']);   // matches tags, ignores case and spaces
  assert.deepEqual(filterArticles(items, { query: 'rahman', category: 'Nutrition' }), []);
});
