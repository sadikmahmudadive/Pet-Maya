import { useLayoutEffect, useRef } from 'react';
import { Link } from '../lib/router.jsx';
import { useStore } from '../lib/store.jsx';
import { Icon, Button, Pill, Ph, Portal } from '../ui/index.jsx';
import { money, productPath } from '../lib/format.js';

export default function CompareDrawer() {
  const { compareIds = [], compareOpen, setCompareOpen, toggleCompare, clearCompare, products, addToCart } = useStore();
  const items = compareIds
    .map((id) => (products?.items || []).find((p) => p.id === id))
    .filter(Boolean);
  const showing = compareIds.length > 0 && items.length > 0;

  // Publish the bar's height (+ its 20px offset) as --compare-space so "Ask Maya AI" can sit above it. The bar wraps
  // onto more lines on narrow phones, so a fixed number is not enough.
  const barRef = useRef(null);
  useLayoutEffect(() => {
    const el = barRef.current;
    if (!showing || !el) return undefined;
    const root = document.documentElement;
    const publish = () => root.style.setProperty('--compare-space', `${Math.ceil(el.getBoundingClientRect().height) + 20}px`);
    publish();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(publish) : null;
    ro?.observe(el);
    return () => { ro?.disconnect(); root.style.removeProperty('--compare-space'); };
  }, [showing]);

  if (!compareIds.length) return null;
  if (!items.length) return null;

  return (
    <>
      <div
        ref={barRef}
        className="card row between wrap gap-12"
        style={{
          position: 'fixed',
          bottom: 'calc(20px + var(--consent-space, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 80,
          width: 'min(760px, calc(100vw - 32px))',
          padding: '10px 16px',
          borderRadius: 999,
          boxShadow: '0 14px 40px rgba(0,0,0,0.18)',
          border: '1px solid var(--line-2)',
          background: 'var(--surface)',
        }}
        role="region"
        aria-label="Product comparison bar"
      >
        <div className="row gap-10 wrap">
          <Pill tone="solid-teal" sm><Icon name="layers" size={12} /> Compare ({items.length}/4)</Pill>
          <div className="row gap-6 wrap hide-sm">
            {items.map((p) => (
              <span key={p.id} className="pill outline sm" style={{ gap: 6 }}>
                {p.name.slice(0, 22)}{p.name.length > 22 ? '…' : ''}
                <button type="button" className="link" onClick={() => toggleCompare(p.id)} aria-label={`Remove ${p.name}`}>×</button>
              </span>
            ))}
          </div>
        </div>
        <div className="row gap-8">
          <button type="button" className="link" style={{ fontSize: 12 }} onClick={clearCompare}>Clear</button>
          <Button variant="dark" size="sm" icon="layers" onClick={() => setCompareOpen(true)}>
            Compare side-by-side
          </Button>
        </div>
      </div>

      {compareOpen && (
        <Portal>
          <div className="scrim" onClick={() => setCompareOpen(false)} />
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Compare products"
            style={{ width: 'min(1020px, calc(100vw - 28px))', maxWidth: 1020, maxHeight: '88vh', overflowY: 'auto' }}
          >
            <div className="row between wrap gap-8">
              <div>
                <div className="eyebrow">Smart Product Discovery</div>
                <h2 className="serif" style={{ fontSize: 26 }}>Side-by-side comparison</h2>
              </div>
              <div className="row gap-8">
                <Button variant="outline" size="sm" onClick={clearCompare}>Clear all</Button>
                <button type="button" className="btn btn-outline btn-square btn-sm" onClick={() => setCompareOpen(false)} aria-label="Close"><Icon name="x" size={15} /></button>
              </div>
            </div>

            <div className="table-wrap" style={{ marginTop: 18 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 130 }}>Feature</th>
                    {items.map((p) => (
                      <th key={p.id} style={{ minWidth: 200, verticalAlign: 'top' }}>
                        <div className="stack gap-8">
                          <div className="row between">
                            <Ph src={p.image} label=" " style={{ width: 64, height: 64, minHeight: 0, borderRadius: 14 }} />
                            <button type="button" className="btn btn-ghost btn-square btn-sm" onClick={() => toggleCompare(p.id)} aria-label="Remove"><Icon name="x" size={14} /></button>
                          </div>
                          <div>
                            <div className="sub" style={{ fontSize: 11 }}>{p.brand}</div>
                            <Link to={productPath(p)} onClick={() => setCompareOpen(false)} style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{p.name}</Link>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>Price (BDT)</b></td>
                    {items.map((p) => (
                      <td key={p.id}>
                        <b style={{ fontSize: 16 }}>{money(p.price)}</b>
                        {p.compareAt > p.price && <span className="sub" style={{ marginLeft: 6, textDecoration: 'line-through' }}>{money(p.compareAt)}</span>}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td><b>Suitability</b></td>
                    {items.map((p) => (
                      <td key={p.id}>
                        <Pill sm tone="teal">{p.pet === 'dog' ? 'Dogs' : p.pet === 'cat' ? 'Cats' : 'Dogs & Cats'}</Pill>
                        <div className="sub" style={{ fontSize: 11, marginTop: 4 }}>{p.suitableAge || 'All life stages'}</div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td><b>Category</b></td>
                    {items.map((p) => <td key={p.id} style={{ textTransform: 'capitalize' }}>{p.category}</td>)}
                  </tr>
                  <tr>
                    <td><b>Prescription & Cold-chain</b></td>
                    {items.map((p) => (
                      <td key={p.id}>
                        <div className="row gap-6 wrap">
                          <Pill sm tone={p.isRx ? 'yellow' : ''}>{p.isRx ? 'Rx Required' : 'OTC (No Rx)'}</Pill>
                          {p.coldChain && <Pill sm tone="teal">Cold 2–8°C</Pill>}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td><b>Auto-refill</b></td>
                    {items.map((p) => (
                      <td key={p.id}>{p.subscribe ? <span className="teal">Eligible (Save 5%)</span> : <span className="muted">One-time purchase</span>}</td>
                    ))}
                  </tr>
                  <tr>
                    <td><b>Rating</b></td>
                    {items.map((p) => (
                      <td key={p.id}><b>★ {(p.rating || 4.8).toFixed(1)}</b> <span className="sub">({p.ratingCount || 0} reviews)</span></td>
                    ))}
                  </tr>
                  <tr>
                    <td><b>Variants / Sizes</b></td>
                    {items.map((p) => (
                      <td key={p.id} style={{ fontSize: 12 }}>
                        {(p.variants || []).length ? p.variants.join(' · ') : 'Standard pack'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td><b>Key ingredients / Info</b></td>
                    {items.map((p) => (
                      <td key={p.id} className="sub" style={{ fontSize: 12 }}>
                        {p.ingredients || p.shortDescription || 'Verified veterinary formulation'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td><b>Action</b></td>
                    {items.map((p) => (
                      <td key={p.id}>
                        <Button
                          variant="dark"
                          size="sm"
                          icon="plus"
                          disabled={p.stockCount <= 0 || !p.inStock}
                          onClick={() => addToCart(p, { variant: p.variants?.[0] || '' })}
                        >
                          {p.stockCount <= 0 || !p.inStock ? 'Sold out' : 'Add to bag'}
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

