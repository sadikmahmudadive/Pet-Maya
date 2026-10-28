import { useMemo, useState } from 'react';
import { Link } from '../../lib/router.jsx';
import { useStore } from '../../lib/store.jsx';
import { useBlogFeed, useBlog } from '../../data/blogs.js';
import { Icon, Button, Ph, Pill, Avatar, Empty } from '../../ui/index.jsx';
import { cx } from '../../lib/format.js';
import { subscribeNewsletter } from '../../data/actions.js';
import { Reveal } from '../../lib/motion.jsx';
import { sanitizeHtml } from '../../lib/security.js';
import { articleJsonLd, blogPath, filterArticles, plainText, truncate } from '../../lib/blogs.js';
import { usePageMeta } from '../../lib/seo.js';

function Article({ post }) {
  const { toast } = useStore();
  const more = useBlogFeed({ size: 4 });
  const body = post.content || post.excerpt;
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(body);
  const related = more.items.filter((b) => b.id !== post.id).slice(0, 3);

  usePageMeta({
    title: `${post.title} · Pet Maya Journal`,
    description: truncate(post.excerpt || plainText(body), 160),
    image: post.image,
    type: 'article',
    path: blogPath(post.id),
    jsonLd: articleJsonLd(post, typeof window !== 'undefined' ? window.location.origin : ''),
  });

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: post.title, url }); return; }
      await navigator.clipboard.writeText(url);
      toast('Link copied');
    } catch { /* the share sheet was closed */ }
  };

  return (
    <article className="container" style={{ paddingTop: 28 }}>
      <nav className="crumbs"><Link to="/journal">Journal</Link><span>/</span><span style={{ color: 'var(--ink)' }}>{post.category}</span></nav>
      <div style={{ maxWidth: 780, margin: '28px auto 0', textAlign: 'center' }}>
        <Pill mono sm>{post.category}</Pill>
        <h1 className="display-1" style={{ marginTop: 18 }}>{post.title}</h1>
        <div className="row gap-10 wrap" style={{ justifyContent: 'center', marginTop: 20 }}>
          <Avatar name={post.author} src={post.authorPhoto} size="sm" /><span style={{ fontSize: 14 }}>{post.author}</span><span className="sub">· {post.readMin} min read{post.date ? ` · ${post.date}` : ''}</span>
        </div>
      </div>
      {post.image && <Ph src={post.image} tone="teal" label="feature photo" style={{ height: 'clamp(220px,40vw,440px)', borderRadius: 28, margin: '32px 0 40px' }} />}
      {isHtml
        ? <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }} />
        : <div className="prose">{String(body).split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}</div>}
      {post.tags.length > 0 && (
        <div className="prose row gap-6 wrap" style={{ marginTop: 24 }}>
          {post.tags.map((t) => <Pill key={t} sm>#{t}</Pill>)}
        </div>
      )}
      <div className="prose row gap-8 wrap" style={{ marginTop: 32 }}>
        <Button variant="outline" icon="share" onClick={share}>Share</Button>
        <Button variant="teal" icon="stethoscope" to="/specialists">Questions? Ask a vet</Button>
      </div>
      {related.length > 0 && (
        <section style={{ marginTop: 56 }}>
          <div className="section-head"><h2 className="display-3">Keep reading</h2><Link to="/journal" className="link-plain hide-sm">All articles →</Link></div>
          <div className="trio">
            {related.map((b) => (
              <Link key={b.id} to={blogPath(b.id)} className="card tight article-card">
                <Ph src={b.image} tone="teal" label="photo" style={{ height: 160 }} />
                <div className="sub" style={{ fontSize: 12, marginTop: 4 }}>{b.category} · {b.readMin} min read</div>
                <h3>{b.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function ArticlePage({ id }) {
  const { post, loading } = useBlog(id);
  if (post) return <Article post={post} />;
  return (
    <div className="container" style={{ paddingTop: 60 }}>
      {loading
        ? <div className="skeleton" style={{ height: 400 }} />
        : <div className="card"><Empty icon="book" title="Article not found"><Link to="/journal" className="link">Back to the journal</Link></Empty></div>}
    </div>
  );
}

export default function Journal({ params }) {
  return params.id ? <ArticlePage id={params.id} /> : <JournalList />;
}

function JournalList() {
  const blogs = useBlogFeed();
  const { toast } = useStore();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const subscribe = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await subscribeNewsletter(email, 'journal');
    setBusy(false);
    if (r.ok) { toast('Subscribed — thanks!'); setEmail(''); }
    else if (r.reason === 'email') toast('That email address doesn’t look right', { tone: 'error' });
    else if (r.reason === 'permission') toast('Sign-up isn’t switched on yet — add a rule for the newsletter collection', { tone: 'error', duration: 7000 });
    else toast('Couldn’t sign you up — please try again', { tone: 'error' });
  };

  usePageMeta({
    title: 'Journal · Pet Maya',
    description: 'Vet know-how for pet parents: health, nutrition, training and care guides from Pet Maya.',
    path: '/journal',
  });

  const items = blogs.items;
  const feature = items.find((b) => b.featured) || items[0];
  const others = useMemo(() => items.filter((b) => b.id !== feature?.id), [items, feature]);
  const rest = useMemo(() => filterArticles(others, { query: q, category: cat }), [others, q, cat]);
  const cats = [...new Set(others.map((b) => b.category))];
  const authors = [...new Set(items.map((b) => b.author))].filter((a) => /^Dr\.?/i.test(a)).slice(0, 4);
  const count = `${items.length}${blogs.hasMore ? '+' : ''}`;

  return (
    <div className="container">
      {feature && (
        <Link to={blogPath(feature.id)} className="feature-article">
          <div style={{ padding: 'clamp(24px,4vw,48px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
            <div className="row gap-8"><Pill mono sm>{feature.category}</Pill><span className="sub">{feature.readMin} min read{feature.date ? ` · ${feature.date}` : ''}</span></div>
            <h1 className="display-1" style={{ fontSize: 'clamp(34px,4.4vw,54px)' }}>{feature.title}</h1>
            <p className="lead" style={{ fontSize: 15 }}>{feature.excerpt}</p>
            <div className="row gap-10" style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}><Avatar name={feature.author} size="sm" /><span style={{ fontSize: 13 }}>{feature.author}</span></div>
            <div><span className="btn btn-teal" style={{ height: 46 }}><Icon name="arrowRight" size={16} /> Read article</span></div>
          </div>
          <Ph src={feature.image} label="feature photo">{/* keeps aspect on mobile */}</Ph>
        </Link>
      )}

      {items.length > 0 && (
        <>
      <div className="row between wrap gap-12" style={{ marginTop: 28 }}>
        <div className="searchbar" style={{ maxWidth: 420, flex: 1, height: 44 }}>
          <Icon name="search" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles…" aria-label="Search articles" />
        </div>
        <span className="eyebrow muted"><span className="dot" /> {count} articles</span>
      </div>
      <div className="row gap-8 wrap" style={{ marginTop: 14 }}>
        <button className={cx('chip teal', cat === 'all' && 'active')} onClick={() => setCat('all')}>All articles ({others.length})</button>
        {cats.map((c) => <button key={c} className={cx('chip teal', cat === c && 'active')} onClick={() => setCat(c)}>{c}</button>)}
      </div>
        </>
      )}

      <section style={{ marginTop: 36 }}>
        <div className="section-head"><h2 className="display-3">Latest articles</h2><span className="eyebrow muted hide-sm">Reviewed by the Pet Maya team</span></div>
        {blogs.loading && items.length === 0 ? (
          <div className="trio">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 340, borderRadius: 24 }} />)}</div>
        ) : blogs.error && items.length === 0 ? (
          <div className="card"><Empty icon="alert" title="Couldn’t load the articles"><button type="button" className="link" onClick={blogs.retry}>Try again</button></Empty></div>
        ) : items.length === 0 ? (
          <div className="card"><Empty icon="book" title="No articles yet">New guides from our vets are on the way. <Link to="/shop" className="link">Browse the shop</Link> in the meantime.</Empty></div>
        ) : rest.length === 0 ? (
          <div className="card"><Empty icon="book" title="No articles match">{blogs.hasMore ? 'Try another word, or load more articles below.' : 'Try another word or category.'}</Empty></div>
        ) : (
          <Reveal className="trio" stagger>
            {rest.map((b, i) => (
              <Link key={b.id} to={blogPath(b.id)} className="card tight article-card">
                <Ph src={b.image} tone={b.tone === 'teal' || i % 2 ? 'teal' : ''} label="photo" style={{ height: 190 }}>
                  <span className="pill" style={{ position: 'absolute', top: 10, left: 10, background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)' }}>{b.category}</span>
                </Ph>
                <div className="sub" style={{ fontSize: 12, marginTop: 4 }}>{b.readMin} min read · {b.author}{b.date ? ` · ${b.date}` : ''}</div>
                <h3>{b.title}</h3>
                <p className="muted" style={{ fontSize: 13.5 }}>{b.excerpt}</p>
                <div className="row between" style={{ marginTop: 'auto', paddingTop: 8 }}><span className="link-plain" style={{ fontSize: 13 }}>Read →</span><Icon name="bookmark" size={15} className="subtle" /></div>
              </Link>
            ))}
          </Reveal>
        )}
        {blogs.hasMore && (
          <div className="row" style={{ justifyContent: 'center', marginTop: 28 }}>
            <Button variant="outline" onClick={blogs.loadMore} disabled={blogs.loadingMore}>{blogs.loadingMore ? 'Loading…' : 'Load more articles'}</Button>
          </div>
        )}
        {blogs.error && items.length > 0 && <div className="sub" role="alert" style={{ textAlign: 'center', marginTop: 12 }}>Couldn’t load more right now. <button type="button" className="link" onClick={blogs.loadMore}>Try again</button></div>}
      </section>

      <section className="section">
        <div className="card" style={{ padding: 'clamp(24px,4vw,48px)', borderRadius: 32 }}>
          <div className="eyebrow row gap-6"><Icon name="message" size={13} /> Every two weeks</div>
          <h2 className="display-2" style={{ marginTop: 12 }}>The Pet Maya Digest</h2>
          <p className="muted" style={{ marginTop: 10, maxWidth: '60ch' }}>New articles, seasonal parasite and heat warnings, and medicine recall notices — straight to your inbox.</p>
          <form className="row gap-8 wrap" style={{ marginTop: 20 }} onSubmit={subscribe}>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ maxWidth: 320, borderRadius: 999 }} aria-label="Email" />
            <Button type="submit" variant="dark" disabled={busy}>{busy ? 'Signing up…' : 'Subscribe'}</Button>
          </form>
          <div className="sub row gap-6" style={{ marginTop: 10 }}><Icon name="check" size={13} /> No marketing spam. Unsubscribe anytime.</div>
        </div>
      </section>

      {authors.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div><div className="eyebrow">Who writes for us</div><h2 className="display-3">Our contributors</h2></div>
            <p className="sub hide-sm" style={{ maxWidth: '44ch', textAlign: 'right' }}>Every article is reviewed by the Pet Maya team before it is published.</p>
          </div>
          <div className="product-grid">
            {authors.map((a) => (
              <div key={a} className="card tight row gap-10"><Avatar name={a.replace(/^Dr\.?\s*/i, '')} /><div><b style={{ fontSize: 14 }}>{a}</b><div className="sub" style={{ fontSize: 12 }}>{items.filter((b) => b.author === a).length} articles</div></div></div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
