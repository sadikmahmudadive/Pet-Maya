// Reading blog articles for the public site: only approved posts, newest first, a page at a time, cached for a few
// minutes so moving between the list and an article does not read Firestore again.
import { useCallback, useEffect, useRef, useState } from 'react';
import { db, collection, doc, getDoc, getDocs, query, where, orderBy, limit, startAfter } from '../config/firebase';
import { BLOG_PAGE_SIZE, newestFirst, normBlog } from '../lib/blogs.js';

const TTL_MS = 5 * 60_000;
const feeds = new Map();   // page size → { items, cursor, more, at }
const byId = new Map();    // id → article, filled by lists and single reads
const remember = (items) => items.forEach((a) => byId.set(a.id, a));

/** The `isApproved` + `timestamp` query needs a composite index (firestore.indexes.json). Until it is deployed the
 *  ordered query is refused, so fall back to a plain approved-only read, sorted here. */
const needsIndex = (e) => /failed-precondition|index/i.test(`${e?.code || ''} ${e?.message || ''}`);

async function fetchPage(cursor, size) {
  const base = [collection(db, 'blogs'), where('isApproved', '==', true)];
  try {
    const snap = await getDocs(query(...base, orderBy('timestamp', 'desc'), ...(cursor ? [startAfter(cursor)] : []), limit(size)));
    return { items: snap.docs.map((d) => normBlog(d.id, d.data())), cursor: snap.docs.at(-1) || null, more: snap.docs.length === size };
  } catch (e) {
    if (!needsIndex(e) || cursor) throw e;
    const snap = await getDocs(query(...base, limit(50)));
    return { items: snap.docs.map((d) => normBlog(d.id, d.data())).sort(newestFirst), cursor: null, more: false };
  }
}

/** Latest approved articles, `size` at a time. { items, loading, loadingMore, hasMore, error, loadMore, retry } */
export function useBlogFeed({ size = BLOG_PAGE_SIZE } = {}) {
  const [state, setState] = useState(() => {
    const hit = feeds.get(size);
    return hit && Date.now() - hit.at < TTL_MS
      ? { items: hit.items, loading: false, loadingMore: false, hasMore: hit.more, error: false }
      : { items: [], loading: true, loadingMore: false, hasMore: false, error: false };
  });
  const cursor = useRef(feeds.get(size)?.cursor || null);
  const gen = useRef(0);

  const first = useCallback(async () => {
    const id = ++gen.current;
    setState((s) => ({ ...s, loading: true, error: false }));
    try {
      const page = await fetchPage(null, size);
      if (id !== gen.current) return;
      remember(page.items);
      cursor.current = page.cursor;
      feeds.set(size, { items: page.items, cursor: page.cursor, more: page.more, at: Date.now() });
      setState({ items: page.items, loading: false, loadingMore: false, hasMore: page.more, error: false });
    } catch {
      if (id === gen.current) setState((s) => ({ ...s, loading: false, loadingMore: false, error: true }));
    }
  }, [size]);

  useEffect(() => {
    const hit = feeds.get(size);
    if (hit && Date.now() - hit.at < TTL_MS) return undefined;
    first();
    return () => { gen.current += 1; };
  }, [size, first]);

  const loadMore = useCallback(async () => {
    if (!cursor.current) return;
    setState((s) => (s.loadingMore ? s : { ...s, loadingMore: true }));
    try {
      const page = await fetchPage(cursor.current, size);
      remember(page.items);
      cursor.current = page.cursor;
      setState((s) => {
        const seen = new Set(s.items.map((a) => a.id));
        const items = [...s.items, ...page.items.filter((a) => !seen.has(a.id))];
        feeds.set(size, { items, cursor: page.cursor, more: page.more, at: Date.now() });
        return { ...s, items, loadingMore: false, hasMore: page.more };
      });
    } catch {
      setState((s) => ({ ...s, loadingMore: false, error: true }));
    }
  }, [size]);

  return { ...state, loadMore, retry: first };
}

/** One article by id. Posts that are not approved are refused by the security rules and come back as "not found". */
export function useBlog(id) {
  const [state, setState] = useState(() => ({ post: byId.get(id) || null, loading: !byId.has(id), notFound: false }));

  useEffect(() => {
    if (!id) { setState({ post: null, loading: false, notFound: true }); return undefined; }
    if (byId.has(id)) { setState({ post: byId.get(id), loading: false, notFound: false }); return undefined; }
    let live = true;
    setState({ post: null, loading: true, notFound: false });
    getDoc(doc(db, 'blogs', id))
      .then((snap) => {
        const post = snap.exists() ? normBlog(snap.id, snap.data()) : null;
        if (post?.published) remember([post]);
        if (live) setState({ post: post?.published ? post : null, loading: false, notFound: !post?.published });
      })
      .catch(() => { if (live) setState({ post: null, loading: false, notFound: true }); });
    return () => { live = false; };
  }, [id]);

  return state;
}
