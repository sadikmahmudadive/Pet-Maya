import { useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { useRouter } from '../lib/router.jsx';
import { useCollection } from '../data/firestore.js';
import { addComment } from '../data/actions.js';
import { Icon, Button, Avatar } from '../ui/index.jsx';
import { ago, toMillis } from '../lib/format.js';

const normComment = (id, d) => ({
  id,
  name: d.userName || d.authorName || d.name || 'Pet parent',
  photo: d.userPhoto || d.authorPhoto || '',
  text: d.text || d.comment || '',
  time: toMillis(d.timestamp || d.createdAt),
});

export default function CommentThread({ post, onClose }) {
  const { user, toast } = useStore();
  const { navigate } = useRouter();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState([]);

  // Only subscribes once the thread is open, so the feed stays cheap.
  const res = useCollection(`community_posts/${post.id}/comments`, { map: normComment, sample: [], sampleWhenEmpty: false });
  const comments = [...res.items, ...local].sort((a, b) => a.time - b.time);

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    if (!user) { navigate('/signin?next=/community'); return; }
    setBusy(true);
    const r = await addComment(post.id, user, body);
    setBusy(false);
    if (r.ok) {
      setText('');
      if (!res.live) setLocal((l) => [...l, { id: `l${Date.now()}`, name: user.name, photo: user.photoUrl, text: body, time: Date.now() }]);
    } else if (r.reason === 'signin') navigate('/signin?next=/community');
    else toast('Couldn’t post your comment', { tone: 'error' });
  };

  return (
    <div className="comment-thread">
      <div className="row between" style={{ marginBottom: 12 }}>
        <b style={{ fontSize: 13 }}>{comments.length || post.comments} {(comments.length || post.comments) === 1 ? 'comment' : 'comments'}</b>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Hide</button>
      </div>

      {res.loading ? (
        <div className="skeleton" style={{ height: 52 }} />
      ) : comments.length === 0 ? (
        <p className="sub" style={{ fontSize: 13 }}>No comments yet — be the first to reply.</p>
      ) : (
        <div className="stack gap-12">
          {comments.map((c) => (
            <div key={c.id} className="row gap-10 slide-in" style={{ alignItems: 'flex-start' }}>
              <Avatar name={c.name} src={c.photo} size="sm" />
              <div className="grow">
                <div className="row gap-8"><b style={{ fontSize: 13 }}>{c.name}</b><span className="sub" style={{ fontSize: 11 }}>{ago(c.time)}</span></div>
                <p style={{ fontSize: 13.5, marginTop: 2, color: 'var(--ink-2)' }}>{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form className="row gap-8" style={{ marginTop: 14 }} onSubmit={send}>
        <Avatar name={user?.name || 'Guest'} src={user?.photoUrl} size="sm" />
        <input
          className="input" value={text} onChange={(e) => setText(e.target.value)}
          placeholder={user ? 'Write a reply…' : 'Sign in to reply'} aria-label="Write a comment" style={{ height: 42 }}
        />
        <Button variant="dark" size="sm" disabled={busy || !text.trim()} aria-label="Send">
          <Icon name="send" size={15} />
        </Button>
      </form>
    </div>
  );
}
