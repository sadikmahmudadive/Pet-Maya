import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from '../lib/router.jsx';
import { useStore } from '../lib/store.jsx';
import { Icon, Button, Pill, Ph, Portal } from '../ui/index.jsx';
import { money, productPath } from '../lib/format.js';
import { DELIVERY, PAYMENT_CONFIG } from '../data/content.js';
import { functions, httpsCallable } from '../config/firebase';
import { isRealUser } from '../data/actions.js';

function searchCatalog(query, products = [], activePet = null) {
  const q = String(query || '').toLowerCase();
  const petSp = activePet ? (String(activePet.species || 'dog').toLowerCase().includes('cat') ? 'cat' : 'dog') : null;
  const activeList = products.filter((p) => p.showOnStorefront !== false && p.inStock !== false);

  const scored = activeList.map((p) => {
    let score = 0;
    const hay = `${p.name} ${p.brand} ${p.category} ${p.shortDescription || ''} ${p.description || ''} ${p.ingredients || ''}`.toLowerCase();
    const words = q.split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
    words.forEach((w) => {
      if (hay.includes(w)) score += 3;
      if (String(p.name || '').toLowerCase().includes(w)) score += 4;
      if (String(p.category || '').toLowerCase().includes(w)) score += 4;
    });
    if (/flea|tick|worm|preventive|nexgard|bravecto|simparica|advocate/.test(q) && (p.category === 'preventives' || p.category === 'antiparasitics')) score += 6;
    if (/joint|hip|arthritis|mobility|synoquin/.test(q) && (p.category === 'joint' || p.category === 'supplements')) score += 6;
    if (/skin|coat|itch|allergy|apoquel|omega/.test(q) && p.category === 'skin') score += 6;
    if (/food|diet|renal|kidney|gastro|kibble|royal canin/.test(q) && p.category === 'food') score += 6;
    if (/cold|vaccine|nobivac|rabies|dhppi/.test(q) && (p.coldChain || p.category === 'vaccines')) score += 6;
    if (/dental|teeth|groom|shampoo|brush/.test(q) && p.category === 'grooming') score += 6;
    if (/toy|chew|play|enrich/.test(q) && p.category === 'toys') score += 6;
    if (/gps|collar|halo|track/.test(q) && p.category === 'smart-gear') score += 6;
    if (/dog|puppy|canine/.test(q) && (p.pet === 'dog' || p.pet === 'both')) score += 3;
    if (/cat|kitten|feline/.test(q) && (p.pet === 'cat' || p.pet === 'both')) score += 3;
    if (/recommend|essential|best|for my pet/.test(q) && petSp && (p.pet === petSp || p.pet === 'both')) {
      score += 4 + (p.ratingCount || 0) / 100;
    }
    if (petSp && (p.pet === petSp || p.pet === 'both')) score += 1;
    return { p, score };
  });

  return scored
    .filter((x) => x.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.p);
}

function buildGroundedAnswer(query, matches, activePet) {
  const q = String(query || '').toLowerCase();
  if (/deliver|shipping|dhaka|outside|courier|fee/.test(q)) {
    return `We deliver across all 64 districts of Bangladesh:\n• Inside Dhaka Standard: ৳${DELIVERY.insideDhakaFee} (same-day before 4 PM, free over ৳${DELIVERY.freeOver})\n• Inside Dhaka Express: ৳${DELIVERY.insideDhakaExpressFee} (3–4 hours)\n• Outside Dhaka Courier: ৳${DELIVERY.outsideDhakaFee} (2–4 business days)\n• Cold-Chain (2°C–8°C): Insulated box with temperature tag within ${(DELIVERY.coldDistricts || ['Dhaka']).join(', ')}.`;
  }
  if (/pay|bkash|nagad|cod|cash on delivery|trxid/.test(q)) {
    return `You can pay by Cash on Delivery (COD) anywhere in Bangladesh, or via bKash (${PAYMENT_CONFIG.bkashNumber}) / Nagad (${PAYMENT_CONFIG.nagadNumber}) Send Money by entering your TrxID at checkout (or paying the rider on arrival).`;
  }
  if (/return|refund|cancel/.test(q)) {
    return `You can cancel any unshipped order directly from your Order Tracking page. Unopened ambient items are eligible for return within 7 days; cold-chain items are replaced free on arrival if the temperature tag indicates warming.`;
  }
  if (matches.length > 0) {
    const petNote = activePet ? ` tailored for ${activePet.name} (${activePet.species}${activePet.weight ? ` · ${activePet.weight}` : ''})` : '';
    const summary = matches.map((m) => `• ${m.name} (${money(m.price)}${m.isRx ? ' · Rx vet review' : ''}${m.coldChain ? ' · Cold-chain 2–8°C' : ''})`).join('\n');
    return `Here are our top verified catalog matches${petNote}:\n${summary}\n\nNote: For prescription (Rx) medicines, a licensed Pet Maya veterinarian reviews your order before dispatch.`;
  }
  return `I searched our verified pharmacy & care catalog${activePet ? ` for ${activePet.name}` : ''}. Try asking about flea & tick preventives, joint supplements, veterinary diets, cold-chain vaccines, or delivery & bKash options!`;
}

export default function AiShoppingAssistant() {
  const { products, activePet, addToCart, toggleCompare, compareIds = [], user } = useStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([]);
  const listRef = useRef(null);

  const starterPrompts = useMemo(() => [
    activePet ? `Recommend essentials for ${activePet.name}` : 'Best monthly flea & tick preventives',
    'Cold-chain vaccines & 2°C–8°C delivery',
    'Joint & mobility supplements',
    'How do Dhaka delivery & bKash work?',
  ], [activePet]);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const ask = async (rawText) => {
    const text = String(rawText || input).trim();
    if (!text || busy) return;
    setInput('');
    const matches = searchCatalog(text, products?.items || [], activePet);
    const localReply = buildGroundedAnswer(text, matches, activePet);

    const userMsg = { id: `u_${Date.now()}`, role: 'user', text };
    const botId = `b_${Date.now() + 1}`;
    setMessages((prev) => [...prev, userMsg, { id: botId, role: 'assistant', text: localReply, items: matches }]);

    // Optional cloud AI enrichment when signed in
    if (functions && isRealUser(user) && matches.length > 0) {
      setBusy(true);
      try {
        const catalogContext = matches.map((m) => `${m.name} (BDT ${m.price}, ${m.isRx ? 'Rx' : 'OTC'}, ${m.shortDescription || ''})`).join('; ');
        const petContext = activePet ? `Pet: ${activePet.name}, ${activePet.species}, ${activePet.breed || ''}, ${activePet.weight || ''}.` : '';
        const callAi = httpsCallable(functions, 'ai_proxy');
        const res = await callAi({
          prompt: `You are the Pet Maya Pharmacy & Shopping Assistant in Bangladesh. Answer concisely in 2-3 sentences using ONLY these verified catalog items: ${catalogContext}. ${petContext} Customer question: ${text}`,
        });
        const aiText = res?.data?.text || res?.data?.response;
        if (aiText && typeof aiText === 'string') {
          setMessages((prev) => prev.map((m) => (m.id === botId ? { ...m, text: aiText.trim() } : m)));
        }
      } catch {
        // Keep deterministic grounded response on error/offline
      } finally {
        setBusy(false);
      }
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-dark"
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          right: 22,
          bottom: compareIds.length > 0 ? 82 : 22,
          zIndex: 75,
          height: 46,
          padding: '0 18px',
          borderRadius: 999,
          boxShadow: '0 10px 28px rgba(0,0,0,0.22)',
          gap: 8,
        }}
        aria-label="Open AI Shopping Assistant"
      >
        <Icon name="sparkles" size={16} />
        <span>Ask Maya AI</span>
      </button>

      {open && (
        <Portal>
          <div className="scrim" onClick={() => setOpen(false)} />
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Pet Maya AI Shopping Assistant"
            style={{ width: 'min(520px, calc(100vw - 24px))', maxHeight: '86vh', display: 'flex', flexDirection: 'column', padding: 22 }}
          >
            <div className="row between">
              <div className="row gap-10">
                <span className="well teal round"><Icon name="sparkles" size={17} /></span>
                <div>
                  <div className="row gap-6">
                    <b style={{ fontSize: 16 }}>Maya Care & Shop Assistant</b>
                    <Pill tone="teal" sm>Catalog-grounded</Pill>
                  </div>
                  <div className="sub" style={{ fontSize: 12 }}>
                    {activePet ? `Personalised for ${activePet.name} (${activePet.species})` : 'Verified Pet Maya pharmacy & catalog answers'}
                  </div>
                </div>
              </div>
              <button type="button" className="btn btn-outline btn-square btn-sm" onClick={() => setOpen(false)} aria-label="Close"><Icon name="x" size={15} /></button>
            </div>

            <div
              ref={listRef}
              className="stack gap-12"
              style={{ flex: 1, overflowY: 'auto', marginTop: 16, paddingRight: 4, minHeight: 260, maxHeight: 420 }}
            >
              {messages.length === 0 && (
                <div className="panel stack gap-10" style={{ background: 'var(--surface)' }}>
                  <div style={{ fontSize: 13.5 }}>
                    Hi! I can help you find vet-verified medicines, diets, supplements, and care kits from our live catalog{activePet ? ` for ${activePet.name}` : ''}.
                  </div>
                  <div className="row gap-6 wrap">
                    {starterPrompts.map((p) => (
                      <button
                        type="button"
                        key={p}
                        className="pill outline sm"
                        style={{ cursor: 'pointer', height: 30, padding: '0 12px' }}
                        onClick={() => ask(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className="stack gap-8"
                  style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : ' stretch',
                    maxWidth: m.role === 'user' ? '85%' : '100%',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 16,
                      fontSize: 13.5,
                      whiteSpace: 'pre-line',
                      background: m.role === 'user' ? 'var(--ink)' : 'var(--sunk-2)',
                      color: m.role === 'user' ? 'var(--bg)' : 'var(--ink)',
                    }}
                  >
                    {m.text}
                  </div>
                  {m.items?.length > 0 && (
                    <div className="stack gap-8">
                      {m.items.map((p) => (
                        <div key={p.id} className="card row gap-10" style={{ padding: 10, borderRadius: 14 }}>
                          <Ph src={p.image} label=" " style={{ width: 46, height: 46, minHeight: 0, borderRadius: 10 }} />
                          <div className="grow" style={{ minWidth: 0 }}>
                            <Link to={productPath(p)} onClick={() => setOpen(false)} style={{ fontWeight: 600, fontSize: 13.5 }} className="ellipsis">
                              {p.name}
                            </Link>
                            <div className="sub" style={{ fontSize: 11.5 }}>
                              {p.brand} · <b>{money(p.price)}</b>
                              {p.isRx ? ' · Rx' : ''}
                              {p.coldChain ? ' · 2–8°C' : ''}
                            </div>
                          </div>
                          <div className="row gap-6">
                            <button
                              type="button"
                              className="btn btn-outline btn-square btn-sm"
                              title="Compare"
                              onClick={() => toggleCompare(p.id)}
                            >
                              <Icon name="layers" size={13} />
                            </button>
                            <Button
                              variant="dark"
                              size="sm"
                              icon="plus"
                              onClick={() => addToCart(p, { variant: p.variants?.[0] || '' })}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form
              className="row gap-8"
              style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}
              onSubmit={(e) => { e.preventDefault(); ask(); }}
            >
              <input
                className="input grow"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activePet ? `Ask about products for ${activePet.name}…` : 'Ask about medicine, food, delivery…'}
                aria-label="Ask Maya AI"
              />
              <Button type="submit" variant="dark" disabled={busy || !input.trim()}>
                {busy ? '…' : 'Ask'}
              </Button>
            </form>
          </div>
        </Portal>
      )}
    </>
  );
}

