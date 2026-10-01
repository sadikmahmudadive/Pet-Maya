import { useEffect, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { useRouter } from '../lib/router.jsx';
import { saveReview } from '../data/actions.js';
import { useLockBody } from '../lib/motion.jsx';
import { Icon, Button, Field, Portal } from '../ui/index.jsx';
import { cx } from '../lib/format.js';

const LABEL = ['', 'Poor', 'Not great', 'Okay', 'Good', 'Excellent'];

export default function ReviewModal({ product, onClose, onSaved }) {
  const { user, toast, myOrders } = useStore();
  const { navigate } = useRouter();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  useLockBody(true);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const bought = (myOrders.items || []).some((o) => o.items.some((i) => i.id === product.id));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await saveReview({ user, product, rating, title, text });
    setBusy(false);
    if (res.ok) { toast('Thanks — your review is live'); onSaved?.(); onClose(); }
    else if (res.reason === 'signin') { onClose(); navigate(`/signin?next=/product/${product.id}`); }
    else toast('Couldn’t post your review — please try again', { tone: 'error' });
  };

  return (
    <Portal>
      <div className="scrim" onClick={onClose} />
      <form className="modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label={`Review ${product.name}`}>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="eyebrow">{product.brand}</div>
            <h2 className="serif" style={{ fontSize: 24, marginTop: 6 }}>Review {product.name}</h2>
          </div>
          <button type="button" className="btn btn-outline btn-square btn-sm" onClick={onClose} aria-label="Close"><Icon name="x" size={15} /></button>
        </div>

        {!user && <div className="rx-note" style={{ marginTop: 16 }}><Icon name="user" size={15} /> You’ll need to sign in to post a review.</div>}
        {user && !bought && <div className="panel sub" style={{ marginTop: 16, fontSize: 13 }}>We’ll mark reviews from verified buyers — order this product and yours gets a badge.</div>}

        <div style={{ marginTop: 20 }}>
          <span className="label">Your rating</span>
          <div className="row gap-6" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n} type="button" aria-label={`${n} star${n > 1 ? 's' : ''}`}
                onMouseEnter={() => setHover(n)} onClick={() => setRating(n)}
                className="star-btn" style={{ color: n <= (hover || rating) ? '#E0A526' : 'var(--line-2)' }}
              >
                <Icon name="star" size={28} stroke={1} style={{ fill: n <= (hover || rating) ? 'currentColor' : 'none' }} />
              </button>
            ))}
            <span className="sub" style={{ marginLeft: 8 }}>{LABEL[hover || rating]}</span>
          </div>
        </div>

        <div className="stack gap-14" style={{ marginTop: 18 }}>
          <Field label="Headline" hint="optional" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Easy to dose, arrived chilled" maxLength={70} />
          <Field label="Your review">
            <textarea className="textarea" required minLength={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="How did it work for your pet? Anything other pet parents should know?" />
          </Field>
        </div>

        <Button type="submit" variant="dark" size="lg" block style={{ marginTop: 18 }} disabled={busy || text.trim().length < 10}>
          {busy ? 'Posting…' : user ? 'Post review' : 'Sign in and post'}
        </Button>
        <p className="sub" style={{ marginTop: 10, fontSize: 12 }}>
          Please don’t include medical advice for other people’s pets — every animal is different.
        </p>
      </form>
    </Portal>
  );
}
