import { useState } from 'react';
import { Link } from '../lib/router.jsx';
import { useStore } from '../lib/store.jsx';
import { Icon, Ph } from '../ui/index.jsx';
import { money, cx } from '../lib/format.js';

const BADGE_TONE = { 'Best seller': 'dark', New: 'dark', Rx: 'yellow', 'Cold-chain': 'teal', 'Vet diet': 'teal', 'Smart gear': 'dark' };

export function productBadge(p) {
  if (p.badge) return p.badge;
  if (p.stockCount === 0) return 'Sold out';
  if (p.coldChain) return 'Cold-chain';
  if (p.isRx) return 'Rx';
  return '';
}

export default function ProductCard({ p }) {
  const { addToCart, wishlist, toggleWish } = useStore();
  const [variant, setVariant] = useState(p.variants?.[0] || '');
  const badge = productBadge(p);
  const fav = wishlist.includes(p.id);
  const soldOut = p.stockCount === 0 || !p.inStock;

  return (
    <article className="pcard">
      {badge && <span className={cx('pill sm pcard-badge', BADGE_TONE[badge] || (badge === 'Sold out' ? 'red' : ''))}>{badge}</span>}
      <button className={cx('pcard-fav', fav && 'on')} onClick={() => toggleWish(p.id)} aria-label={fav ? 'Remove from saved' : 'Save'} aria-pressed={fav}>
        <Icon name="heart" size={15} />
      </button>
      <Link to={`/product/${p.id}`} aria-label={p.name}>
        <Ph src={p.image} tone={p.coldChain ? 'teal' : ''} label={p.category === 'vaccines' ? 'vial' : 'product'} />
      </Link>
      <div className="pcard-body">
        <span className="pcard-brand">{p.brand}</span>
        <Link to={`/product/${p.id}`} className="pcard-name">{p.name}</Link>
        <span className="pcard-meta">
          <Icon name="star" size={12} stroke={1} style={{ fill: '#E0A526', color: '#E0A526' }} />
          <b style={{ color: 'var(--ink)' }}>{p.rating.toFixed(1)}</b> ({p.ratingCount})
        </span>
        {p.variants?.length > 0 && (
          <div className="variant-chips">
            {p.variants.slice(0, 3).map((v) => (
              <button key={v} className={cx('vchip', v === variant && 'on')} onClick={() => setVariant(v)}>{v}</button>
            ))}
          </div>
        )}
        {p.coldChain && <span className="teal" style={{ fontSize: 11.5, marginTop: 6 }}>Delivered at 2°C – 8°C</span>}
        {!p.coldChain && p.isRx && <span className="teal" style={{ fontSize: 11.5, marginTop: 6 }}>Vet approval required</span>}
        {!p.coldChain && !p.isRx && p.subscribe && <span className="teal" style={{ fontSize: 11.5, marginTop: 6 }}>Subscribe & save 5%</span>}
        <div className="pcard-foot">
          <span className="pcard-price">{money(p.price)}{p.compareAt > p.price && <s>{money(p.compareAt)}</s>}</span>
          <button className="btn btn-dark btn-sm" disabled={soldOut} onClick={() => addToCart(p, { variant })}>
            {soldOut ? 'Sold out' : <><Icon name="plus" size={14} /> Add</>}
          </button>
        </div>
      </div>
    </article>
  );
}
