import { useMemo, useState } from 'react';
import { Link } from '../../lib/router.jsx';
import { useStore } from '../../lib/store.jsx';
import { useBlogs } from '../../data/hooks.js';
import { Icon, Button, Ph, Pill, Avatar, Empty } from '../../ui/index.jsx';
import { cx } from '../../lib/format.js';
import { subscribeNewsletter } from '../../data/actions.js';
import { Reveal } from '../../lib/motion.jsx';

function sanitize(html) {
  return String(html)
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
}

function Article({ post }) {
  const { toast } = useStore();
  const body = post.content || post.excerpt;
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(body);
  return (
    <article className="container" style={{ paddingTop: 28 }}>
      <nav className="crumbs"><Link to="/journal">Journal</Link><span>/</span><span style={{ color: 'var(--ink)' }}>{post.category}</span></nav>
      <div style={{ maxWidth: 780, margin: '28px auto 0', textAlign: 'center' }}>
        <Pill mono sm>{post.category}</Pill>
        <h1 className="display-1" style={{ marginTop: 18 }}>{post.title}</h1>
        <div className="row gap-10" style={{ justifyContent: 'center', marginTop: 20 }}>
          <Avatar name={post.author} size="sm" /><span style={{ fontSize: 14 }}>{post.author}</span><span className="sub">· {post.readMin} min read{post.date ? ` · ${post.date}` : ''}</span>
        </div>
      </div>
      <Ph src={post.image} tone="teal" label="feature photo" style={{ height: 'clamp(220px,40vw,440px)', borderRadius: 28, margin: '32px 0 40px' }} />
      {isHtml
        ? <div className="prose" dangerouslySetInnerHTML={{ __html: sanitize(body) }} />
        : <div className="prose">{String(body).split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}</div>}
      <div className="prose row gap-8" style={{ marginTop: 32 }}>
        <Button variant="outline" icon="share" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast('Link copied'); }}>Share</Button>
        <Button variant="teal" icon="video" to="/specialists">Questions? Ask a vet</Button>
      </div>
    </article>
  );
}

export default function Journal({ params }) {
  const blogs = useBlogs();
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

  const items = blogs.items;
  const feature = items.find((b) => b.featured) || items[0];
  const rest = useMemo(() => items.filter((b) => b.id !== feature?.id).filter((b) => (cat === 'all' || b.category === cat) && (!q || `${b.title} ${b.excerpt} ${b.author}`.toLowerCase().includes(q.toLowerCase()))), [items, feature, cat, q]);
  const cats = [...new Set(items.filter((b) => b.id !== feature?.id).map((b) => b.category))];
  const authors = [...new Set(items.map((b) => b.author))].filter((a) => /^Dr\.?/i.test(a)).slice(0, 4);

  if (params.id) {
    const post = items.find((b) => b.id === params.id);
    if (post) return <Article post={post} />;
    return <div className="container" style={{ paddingTop: 60 }}>{blogs.loading ? <div className="skeleton" style={{ height: 400 }} /> : <div className="card"><Empty icon="book" title="Article not found"><Link to="/journal" className="link">Back to the journal</Link></Empty></div>}</div>;
  }

  return (
    <div className="container">
      {feature && (
        <Link to={`/journal/${feature.id}`} className="feature-article">
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

      <div className="row between wrap gap-12" style={{ marginTop: 28 }}>
        <div className="searchbar" style={{ maxWidth: 420, flex: 1, height: 44 }}>
          <Icon name="search" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles…" aria-label="Search articles" />
        </div>
        <span className="eyebrow muted"><span className="dot" /> {items.length} articles</span>
      </div>
      <div className="row gap-8 wrap" style={{ marginTop: 14 }}>
        <button className={cx('chip teal', cat === 'all' && 'active')} onClick={() => setCat('all')}>All articles ({items.length - 1})</button>
        {cats.map((c) => <button key={c} className={cx('chip teal', cat === c && 'active')} onClick={() => setCat(c)}>{c}</button>)}
      </div>

      <section style={{ marginTop: 36 }}>
        <div className="section-head"><h2 className="display-3">Latest articles</h2><span className="eyebrow muted hide-sm">Written & reviewed by vets</span></div>
        {rest.length === 0 ? <div className="card"><Empty icon="book" title="No articles match" /></div> : (
          <Reveal className="trio" stagger>
            {rest.map((b, i) => (
              <Link key={b.id} to={`/journal/${b.id}`} className="card tight article-card">
                <Ph src={b.image} tone={b.tone === 'teal' || i % 2 ? 'teal' : ''} label="photo" style={{ height: 190 }}>
                  <span className="pill" style={{ position: 'absolute', top: 10, left: 10, background: '#fff' }}>{b.category}</span>
                </Ph>
                <div className="sub" style={{ fontSize: 12, marginTop: 4 }}>{b.readMin} min read · {b.author}</div>
                <h3>{b.title}</h3>
                <p className="muted" style={{ fontSize: 13.5 }}>{b.excerpt}</p>
                <div className="row between" style={{ marginTop: 'auto', paddingTop: 8 }}><span className="link-plain" style={{ fontSize: 13 }}>Read →</span><Icon name="bookmark" size={15} className="subtle" /></div>
              </Link>
            ))}
          </Reveal>
        )}
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
            <p className="sub hide-sm" style={{ maxWidth: '44ch', textAlign: 'right' }}>Health articles are written or reviewed by practising vets before they’re published.</p>
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
