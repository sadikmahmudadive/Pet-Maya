import { useMemo, useState } from 'react';
import { Link } from '../../lib/router.jsx';
import { useStore } from '../../lib/store.jsx';
import { usePosts } from '../../data/hooks.js';
import { addDocument, patchDoc } from '../../data/firestore.js';
import { increment } from '../../config/firebase';
import { Icon, Button, Pill, Avatar, Ph, Empty, Field, Portal } from '../../ui/index.jsx';
import { cx, ago } from '../../lib/format.js';
import CommentThread from '../CommentThread.jsx';
import { Reveal } from '../../lib/motion.jsx';

const CATS = ['All posts', 'Health & Recovery', 'Nutrition & GI', 'Puppies & Kittens', 'Rescue & Adoption', 'Lost & Found'];
const RAIL = [
  ['All posts', 'grid'], ['Photo moments', 'image', 'Moment'], ['Health & Recovery', 'pulse'], ['Rescue & Adoption', 'heart'], ['Lost & Found', 'pin'],
];

export default function Community() {
  const { user, pets, vets, toast } = useStore();
  const posts = usePosts();
  const [cat, setCat] = useState('All posts');
  const [text, setText] = useState('');
  const [liked, setLiked] = useState({});
  const [lostOpen, setLostOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [openThread, setOpenThread] = useState(null);
  const real = user && !String(user.uid).startsWith('demo_guest');

  const sorted = useMemo(() => [...posts.items].sort((a, b) => b.time - a.time), [posts.items]);
  const amber = sorted.find((p) => p.isAmberAlert && !p.isResolved);
  const feed = sorted.filter((p) => !p.isAmberAlert && (cat === 'All posts' || p.category === cat || (cat === 'Photo moments' && /moment/i.test(p.category))));
  const counts = useMemo(() => {
    const c = {}; posts.items.forEach((p) => { c[p.category] = (c[p.category] || 0) + 1; }); return c;
  }, [posts.items]);
  const trending = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const publish = async () => {
    if (!text.trim()) return;
    if (!real) { toast('Sign in to post'); return; }
    const pet = pets.items?.[0];
    try {
      await addDocument('community_posts', {
        userId: user.uid, userName: user.name, userPhoto: user.photoUrl || '', author: user.name, authorId: user.uid,
        postType: 'MOMENT', category: cat === 'All posts' ? 'Moment' : cat, content: text.trim(), petTag: pet?.name || '',
        likesCount: 0, commentsCount: 0, sharesCount: 0, likedBy: {}, isAmberAlert: false,
      });
      setText('');
      toast('Posted to the community');
    } catch { toast('Couldn’t post — try again', { tone: 'error' }); }
  };

  const like = async (p) => {
    if (liked[p.id]) return;
    setLiked({ ...liked, [p.id]: true });
    if (!real || !posts.live) return;
    try { await patchDoc('community_posts', p.id, { likesCount: increment(1), [`likedBy.${user.uid}`]: true }); } catch { /* optimistic */ }
  };

  const resolveAmber = async () => {
    if (!amber) return;
    if (posts.live && real) { try { await patchDoc('community_posts', amber.id, { isResolved: true }); } catch { /* ignore */ } }
    setDismissed(true);
    toast(`So glad ${amber.petName} is home!`);
  };

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="three-col">
        <aside className="stack gap-12">
          <div className="card">
            <div className="row gap-10">
              <Avatar name={user?.name || 'Guest'} src={user?.photoUrl} />
              <div><b style={{ fontSize: 14 }}>{user?.name || 'Guest'}</b><div className="sub" style={{ fontSize: 12 }}>{(pets.items || []).map((p) => p.name).join(' & ') || 'No pets yet'}</div></div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
              <div className="mini-stat"><div className="k">Points</div><div className="v">{user?.points || 0}</div></div>
              <div className="mini-stat"><div className="k">Pets</div><div className="v">{(pets.items || []).length}</div></div>
            </div>
          </div>
          <div className="card tight">
            <div className="eyebrow muted" style={{ padding: '4px 12px 8px' }}>Browse</div>
            {RAIL.map(([l, i]) => (
              <button key={l} className={cx('rail-link', cat === l && 'on')} style={{ width: '100%' }} onClick={() => setCat(l)}>
                <Icon name={i} size={16} className={l === 'Lost & Found' ? 'red' : 'teal'} /><span className="grow" style={{ textAlign: 'left' }}>{l}</span>
                {l === 'Lost & Found' && amber && <Pill tone="red" sm>1 active</Pill>}
              </button>
            ))}
          </div>
          <div className="card">
            <div className="eyebrow" style={{ color: 'var(--red)' }}>● Urgent help</div>
            <h3 className="h-card" style={{ marginTop: 8 }}>Worried about your pet?</h3>
            <p className="sub" style={{ margin: '6px 0 12px' }}>Talk to a vet on video in minutes.</p>
            <Button variant="red" block icon="video" to="/specialists">Urgent video call</Button>
          </div>
        </aside>

        <main className="stack gap-12">
          <div className="card tight row between" style={{ padding: '10px 16px', fontSize: 13 }}>
            <span className="row gap-8"><span className="dot" /> Pet parents in Dhaka</span>
            <span className="mono teal" style={{ fontSize: 11 }}>{posts.items.length} POSTS</span>
          </div>

          {amber && !dismissed && (
            <Reveal className="amber-alert">
              <div className="row between"><div className="row gap-8"><Pill tone="solid-teal" mono sm style={{ background: 'var(--red)' }}><Icon name="alert" size={11} /> Lost pet alert</Pill><span className="sub">Missing · {ago(amber.time)}</span></div><button onClick={() => setDismissed(true)} aria-label="Hide alert"><Icon name="x" size={15} /></button></div>
              <div className="row gap-16" style={{ marginTop: 14, alignItems: 'flex-start' }}>
                <Ph src={amber.image} label="photo" style={{ width: 96, height: 96, flex: 'none' }} />
                <div>
                  <h3 className="serif red" style={{ fontSize: 26 }}>Missing: {amber.petName}</h3>
                  <div style={{ fontSize: 14 }}>{amber.petBreed}</div>
                  <div className="row gap-6" style={{ fontSize: 13, marginTop: 8 }}><Icon name="pin" size={14} className="red" /> Last seen: {amber.location}</div>
                  {amber.microchipId && <div className="mono sub" style={{ fontSize: 11, marginTop: 6 }}>MICROCHIP #{amber.microchipId}</div>}
                </div>
              </div>
              <div className="row gap-8 wrap" style={{ marginTop: 16 }}>
                <Button variant="red" icon="eye" onClick={() => toast('Thanks — the owner has been notified')}>Report a sighting</Button>
                {amber.contactPhone && <Button variant="outline" icon="phone" to={`tel:${amber.contactPhone}`}>Contact owner</Button>}
                {real && amber.userId === user.uid && <Button variant="outline" onClick={resolveAmber}>Mark as found</Button>}
              </div>
            </Reveal>
          )}

          <div className="card">
            <div className="row gap-12">
              <Avatar name={user?.name || 'Guest'} src={user?.photoUrl} />
              <input className="input" style={{ height: 50 }} value={text} onChange={(e) => setText(e.target.value)} placeholder={`What’s new with ${(pets.items || [])[0]?.name || 'your pet'}${user?.name ? `, ${user.name.split(' ')[0]}` : ''}?`} aria-label="Write a post" onKeyDown={(e) => e.key === 'Enter' && publish()} />
            </div>
            <div className="row between" style={{ marginTop: 12 }}>
              <div className="row gap-4 sub">
                <span className="btn btn-ghost btn-sm"><Icon name="image" size={14} /> Photo</span>
                <span className="btn btn-ghost btn-sm hide-sm"><Icon name="paw" size={14} /> Tag pet</span>
              </div>
              <Button variant="teal" icon="arrowRight" onClick={publish} disabled={!text.trim()}>Post</Button>
            </div>
          </div>

          <div className="row gap-8 wrap">
            {CATS.map((c) => <button key={c} className={cx('chip', cat === c && 'active')} onClick={() => setCat(c)}>{c}</button>)}
          </div>

          {feed.length === 0 ? <div className="card"><Empty icon="paw" title="Nothing here yet">Be the first to share something.</Empty></div> : feed.map((p) => (
            <article key={p.id} className="card post stack gap-12">
              <div className="row between gap-8">
                <div className="row gap-10">
                  <Avatar name={p.author} src={p.authorPhoto} />
                  <div>
                    <div className="row gap-6"><b style={{ fontSize: 14 }}>{p.author}</b></div>
                    <div className="sub" style={{ fontSize: 12 }}>{p.petTag ? `${p.petTag} · ` : ''}{ago(p.time)}</div>
                  </div>
                </div>
                <Pill sm>{p.category}</Pill>
              </div>
              {p.title && <h3>{p.title}</h3>}
              <p style={{ fontSize: 14.5, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>{p.content}</p>
              {(p.image || p.metrics) && (
                <div className="grid" style={{ gridTemplateColumns: p.metrics ? '1fr 1fr' : '1fr', gap: 10 }}>
                  {(p.image || p.metrics) && <Ph src={p.image} label="photo" style={{ minHeight: 200 }} />}
                  {p.metrics && (
                    <div className="panel stack gap-12">
                      <div className="eyebrow muted" style={{ fontSize: 10 }}>Progress</div>
                      {p.metrics.map((m) => <div key={m.label}><div className="row between" style={{ fontSize: 13 }}><span>{m.label}</span><b>{m.value}%</b></div><div className="meter" style={{ marginTop: 6 }}><span style={{ width: `${m.value}%` }} /></div></div>)}
                      {p.vetNote && <div className="card tight" style={{ fontSize: 12.5 }}><div className="teal" style={{ fontWeight: 600 }}>Vet’s note</div><i className="muted">“{p.vetNote.text}”</i><div className="sub" style={{ fontSize: 11, marginTop: 4 }}>— {p.vetNote.by}</div></div>}
                    </div>
                  )}
                </div>
              )}
              {p.scores && (
                <div className="panel row gap-8" style={{ overflowX: 'auto' }}>
                  {p.scores.map((s, i) => (
                    <div key={i} className="card tight" style={{ minWidth: 56, textAlign: 'center', padding: 10, background: s <= 2 ? 'var(--teal-tint)' : 'var(--surface)' }}>
                      <div className="mono subtle" style={{ fontSize: 10 }}>D{i * 2 + 1}</div><b className={s >= 5 ? 'red' : ''} style={{ fontSize: 18 }}>{s}</b>
                    </div>
                  ))}
                </div>
              )}
              <div className="row between" style={{ fontSize: 13 }}>
                <div className="row gap-16 sub">
                  <button className={cx('row gap-4', liked[p.id] && 'red')} onClick={() => like(p)} aria-pressed={!!liked[p.id]}><Icon name="heart" size={15} style={liked[p.id] ? { fill: 'currentColor' } : undefined} /> {p.likes + (liked[p.id] ? 1 : 0)}</button>
                  <button className="row gap-4" onClick={() => setOpenThread(openThread === p.id ? null : p.id)} aria-expanded={openThread === p.id}>
                    <Icon name="message" size={15} /> {p.comments} comments
                  </button>
                </div>
                <div className="row gap-8 sub">
                  <button aria-label="Save"><Icon name="bookmark" size={15} /></button>
                  <button aria-label="Share" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/community#${p.id}`); toast('Link copied'); }}><Icon name="share" size={15} /></button>
                </div>
              </div>
              {openThread === p.id && <CommentThread post={p} onClose={() => setOpenThread(null)} />}
            </article>
          ))}
        </main>

        <aside className="stack gap-12">
          <div className="card">
            <div className="row between"><span className="eyebrow muted">Popular topics</span><Icon name="trend" size={15} className="subtle" /></div>
            <div className="stack gap-10" style={{ marginTop: 12 }}>
              {trending.map(([c, n]) => <button key={c} className="row between" style={{ fontSize: 14 }} onClick={() => setCat(c)}><b>#{c.replace(/[^a-z]/gi, '')}</b><span className="sub">{n} posts</span></button>)}
            </div>
          </div>
          <div className="card">
            <span className="eyebrow muted">Vets on Pet Maya</span>
            <div className="stack gap-12" style={{ marginTop: 12 }}>
              {vets.items.slice(0, 3).map((v) => (
                <div key={v.id} className="row gap-10">
                  <Avatar name={v.name.replace('Dr. ', '')} src={v.photo} size="sm" />
                  <div className="grow"><div style={{ fontSize: 13, fontWeight: 600 }}>{v.name}</div><div className="sub" style={{ fontSize: 11 }}>{v.specialty}</div></div>
                  <Button variant="outline" size="sm" to="/specialists">Book</Button>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="eyebrow" style={{ color: 'var(--red)' }}>● Lost pet?</div>
            <h3 className="h-card" style={{ marginTop: 8 }}>Raise an alert</h3>
            <p className="sub" style={{ margin: '6px 0 12px' }}>Post a lost-pet alert to everyone in the community with a photo and last-seen location.</p>
            <Button variant="danger" block icon="alert" onClick={() => (real ? setLostOpen(true) : toast('Sign in to raise an alert'))}>Report a lost pet</Button>
          </div>
          <div className="card flat sub" style={{ fontSize: 12.5 }}>
            <div className="row gap-6" style={{ color: 'var(--ink)', fontWeight: 600, marginBottom: 6 }}><Icon name="shield" size={14} /> Community guidelines</div>
            Be kind. Health posts are personal experiences, not medical advice — always check with a vet before changing treatment. No selling medicines.
          </div>
        </aside>
      </div>
      {lostOpen && <LostPetModal onClose={() => setLostOpen(false)} />}
    </div>
  );
}

function LostPetModal({ onClose }) {
  const { user, pets, toast } = useStore();
  const [f, setF] = useState({ petName: pets.items?.[0]?.name || '', petBreed: pets.items?.[0]?.breed || '', location: '', contactPhone: user?.phone || '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try {
      await addDocument('community_posts', {
        ...f, userId: user.uid, userName: user.name, author: user.name, category: 'Lost & Found', postType: 'LOST_FOUND',
        isAmberAlert: true, isResolved: false, content: `${f.petName} is missing. Last seen: ${f.location}.`, likesCount: 0, commentsCount: 0,
        microchipId: pets.items?.[0]?.microchip || '',
      });
      toast('Alert posted. We hope they’re home soon.');
      onClose();
    } catch { toast('Couldn’t post the alert', { tone: 'error' }); }
  };
  return (
    <Portal>
      <div className="scrim" onClick={onClose} />
      <form className="modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Report a lost pet">
        <h2 className="serif" style={{ fontSize: 26 }}>Report a lost pet</h2>
        <div className="fields" style={{ marginTop: 18 }}>
          <Field label="Pet name" required value={f.petName} onChange={set('petName')} />
          <Field label="Breed & description" value={f.petBreed} onChange={set('petBreed')} />
          <Field className="full" label="Last seen" required value={f.location} onChange={set('location')} placeholder="e.g. Gulshan Lake Park, near Road 11" />
          <Field className="full" label="Contact phone" value={f.contactPhone} onChange={set('contactPhone')} />
        </div>
        <div className="row gap-8" style={{ marginTop: 20 }}>
          <Button type="submit" variant="red" icon="alert" className="grow">Post alert</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Portal>
  );
}
