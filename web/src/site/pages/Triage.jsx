import { useState } from 'react';
import { Link } from '../../lib/router.jsx';
import { useStore } from '../../lib/store.jsx';
import { Icon, Button, Pill, Avatar } from '../../ui/index.jsx';
import { runTriage, REGIONS, DURATIONS, GUMS, TIERS } from '../../lib/triage.js';
import { money, cx } from '../../lib/format.js';
import BookingModal from '../BookingModal.jsx';
import { saveTriageRecord, notify, isRealUser } from '../../data/actions.js';
import { Reveal } from '../../lib/motion.jsx';

const FAQ = [
  ['When does triage say “emergency”?', 'Some signs always need a vet straight away — trouble breathing, collapse, seizures, suspected poisoning, a swollen belly with retching, heavy bleeding, or not being able to pee. If any of these show up in what you tell us, we skip the AI and tell you to get help now.'],
  ['Where does the advice come from?', 'We combine fixed safety rules written with our vets with an AI summary of what you describe. The AI never prescribes medicine and never overrides an emergency rule.'],
  ['Does this replace a vet?', 'No. Triage helps you decide how quickly to act. Only a vet who examines your pet can diagnose and treat — you can book one from the result in a couple of taps.'],
];

export default function Triage() {
  const { user, pets, activePet, setPetId, vets, products, addToCart, toast } = useStore();
  const pet = activePet;
  const species = /cat|feline/i.test(pet?.species || '') ? 'cat' : 'dog';
  const [region, setRegion] = useState('gi');
  const [text, setText] = useState('');
  const [duration, setDuration] = useState(DURATIONS[1]);
  const [gums, setGums] = useState('brisk');
  const [rate, setRate] = useState(species === 'cat' ? 26 : 24);
  const [photo, setPhoto] = useState(null);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [book, setBook] = useState(null);

  const evaluate = async () => {
    setBusy(true);
    let imageBase64;
    if (photo) imageBase64 = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1]); fr.onerror = () => r(undefined); fr.readAsDataURL(photo); });
    const out = await runTriage({ region, text, duration, gums, rate, species, petName: pet?.name, imageBase64 });
    setRes(out);
    setBusy(false);

    // Keep a copy in the pet's health record so the vet sees it too.
    if (isRealUser(user)) {
      const saved = await saveTriageRecord({ user, pet, result: out, region, duration });
      if (saved.ok) {
        notify(user, {
          title: 'Symptom check saved',
          body: `${pet?.name || 'Your pet'} · ${TIERS[out.tier].short}. Saved to the Health Vault.`,
          category: 'rx',
          url: '/vault',
        });
        toast('Saved to the Health Vault');
      }
    }
    if (window.innerWidth < 1000) document.getElementById('triage-result')?.scrollIntoView({ behavior: 'smooth' });
  };

  const tier = res ? TIERS[res.tier] : null;
  const vet = res?.tier === 'emergency' ? vets.items.find((v) => v.emergency) || vets.items[0] : vets.items.find((v) => !v.emergency) || vets.items[0];
  const suggestion = res && res.tier !== 'emergency'
    ? products.items.find((p) => !p.isRx && (region === 'gi' ? /probiotic|gastro/i.test(p.name) : region === 'skin' ? /omega|ear/i.test(p.name) : region === 'msk' ? /joint|synoquin/i.test(p.name) : false))
    : null;

  return (
    <div className="container">
      <section className="split" style={{ marginTop: 40, alignItems: 'end' }}>
        <div>
          <Pill tone="teal" mono><span className="dot" /> Symptom checker</Pill>
          <h1 className="display-1" style={{ marginTop: 18, maxWidth: '15ch' }}>Calm, clear next steps when something seems off.</h1>
          <p className="lead" style={{ marginTop: 16 }}>Tell us what you’re seeing. We’ll tell you how urgent it is, what you can do at home, and connect you to a vet if needed.</p>
        </div>
        <div className="stack gap-10">
          {[['Safety rules first', 'Emergency signs always escalate', 'shield'], ['Takes about 2 minutes', 'Three short steps', 'clock'], ['A vet is one tap away', `Video consults from ${money(Math.min(...vets.items.map((v) => v.price), 500))}`, 'video']].map(([t, s, i]) => (
            <div key={t} className="card tight row gap-12"><div className="grow"><div className="stat-label" style={{ fontSize: 9.5 }}>{s}</div><div className="mono" style={{ fontSize: 15, marginTop: 4 }}>{t}</div></div><Icon name={i} className="teal" /></div>
          ))}
        </div>
      </section>

      <div className="split wide-right" style={{ marginTop: 36 }}>
        <div className="stack gap-16">
          <div className="card">
            <div className="row between"><div className="row gap-10"><span className="step-num">1</span><h2 className="serif" style={{ fontSize: 24 }}>Who’s unwell?</h2></div></div>
            <div className="row gap-10 wrap" style={{ marginTop: 18 }}>
              {(pets.items || []).map((p) => (
                <button key={p.id} className={cx('chip', p.id === pet?.id && 'active')} style={{ height: 56, padding: '0 18px 0 8px', background: p.id === pet?.id ? 'var(--sunk-2)' : undefined, color: 'var(--ink)', borderColor: p.id === pet?.id ? 'var(--sunk-2)' : undefined }} onClick={() => setPetId(p.id)}>
                  <Avatar name={p.name} src={p.photo} />
                  <span style={{ textAlign: 'left' }}><span className="serif" style={{ fontSize: 17, display: 'block' }}>{p.name}</span><span className="sub" style={{ fontSize: 11 }}>{[p.breed, p.age].filter(Boolean).join(' · ')}</span></span>
                </button>
              ))}
              <Link to="/vault" className="link-plain" style={{ fontSize: 13 }}>+ Add a pet</Link>
            </div>
            {pet && <div className="row gap-24 wrap sub" style={{ marginTop: 14, fontSize: 13 }}><span>Weight: <b className="mono" style={{ color: 'var(--ink)' }}>{pet.weight || '—'}</b></span><span>Species: <span className="teal">{pet.species}</span></span>{pet.microchip && <span>Microchip: <span className="mono" style={{ color: 'var(--ink)' }}>{pet.microchip}</span></span>}</div>}
          </div>

          <div className="card">
            <div className="row between"><div className="row gap-10"><span className="step-num">2</span><h2 className="serif" style={{ fontSize: 24 }}>Where’s the problem?</h2></div><span className="eyebrow">Step 2 of 3</span></div>
            <p className="muted" style={{ fontSize: 14, margin: '8px 0 16px' }}>Pick the area that changed most in the last 24 hours.</p>
            <div className="region-grid">
              {REGIONS.map((r) => (
                <button key={r.k} className={cx('region', region === r.k && 'on')} onClick={() => setRegion(r.k)} aria-pressed={region === r.k}>
                  <Icon name={r.icon} size={17} className="teal" />
                  <b style={{ fontSize: 14, marginTop: 'auto' }}>{r.label}</b>
                  <span className="sub" style={{ fontSize: 12 }}>{r.sub}</span>
                </button>
              ))}
            </div>
            <div className="panel" style={{ marginTop: 14 }}>
              <span className="label">Describe what you’re seeing</span>
              <textarea className="textarea white" value={text} onChange={(e) => setText(e.target.value)} placeholder={`e.g. ${pet?.name || 'Milo'} skipped his afternoon meal and vomited clear liquid once at 3:30 PM. Otherwise alert but quieter than usual.`} />
              <label className="btn btn-ghost btn-sm" style={{ marginTop: 8, cursor: 'pointer' }}>
                <Icon name="image" size={14} /> {photo ? photo.name : 'Add a photo (optional)'}
                <input type="file" accept="image/*" hidden onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>

          <div className="card">
            <div className="row between"><div className="row gap-10"><span className="step-num">3</span><h2 className="serif" style={{ fontSize: 24 }}>Quick checks</h2></div><span className="eyebrow">Step 3 of 3</span></div>
            <div style={{ marginTop: 18 }}>
              <div className="row between"><b style={{ fontSize: 14 }}>How long has this been going on?</b><span className="sub">{duration}</span></div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 10 }}>
                {DURATIONS.map((d) => <button key={d} className={cx('chip', d === duration && 'active')} style={{ justifyContent: 'center', background: d === duration ? undefined : 'var(--sunk)', borderColor: 'transparent' }} onClick={() => setDuration(d)}>{d}</button>)}
              </div>
            </div>
            <div style={{ marginTop: 22 }}>
              <div className="row between"><b style={{ fontSize: 14 }}>Gum check</b><Pill tone={gums === 'slow' ? 'red' : gums === 'delayed' ? 'yellow' : 'teal'} mono sm>{GUMS.find((g) => g.k === gums).sub}</Pill></div>
              <p className="sub" style={{ margin: '4px 0 10px' }}>Press gently on the upper gum until it goes pale, then count how long it takes to turn pink again.</p>
              <div className="row gap-8 wrap">
                {GUMS.map((g) => (
                  <button key={g.k} className={cx('region', gums === g.k && 'on')} style={{ minHeight: 0, padding: '10px 14px' }} onClick={() => setGums(g.k)}>
                    <b style={{ fontSize: 13 }}>{g.label}</b><span className={g.urgent ? 'red' : 'sub'} style={{ fontSize: 11.5 }}>{g.sub}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 22 }}>
              <div className="row between"><b style={{ fontSize: 14 }}>Breaths per minute while resting</b><span className="mono">{rate} / min</span></div>
              <input type="range" className="range" min={8} max={70} value={rate} onChange={(e) => setRate(Number(e.target.value))} style={{ marginTop: 12 }} aria-label="Breaths per minute" />
              <div className="row between sub mono" style={{ fontSize: 11 }}><span>8</span><span className="teal">Normal: {species === 'cat' ? '20–30' : '15–30'}</span><span>70</span></div>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 22 }}>
              <Button variant="dark" size="lg" icon="arrowRight" onClick={evaluate} disabled={busy}>{busy ? 'Checking…' : res ? 'Check again' : 'Get my result'}</Button>
            </div>
          </div>
        </div>

        <aside id="triage-result" className="stack gap-12" style={{ position: 'sticky', top: 150 }}>
          <div className="card dossier" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 22 }}>
              <div className="row between"><span className="eyebrow muted">Result{pet ? ` · ${pet.name}` : ''}</span>{res && <Pill tone={tier.tone} sm><span className={cx('dot', tier.tone === 'red' ? 'red' : tier.tone === 'yellow' ? 'amber' : '')} /> {res.fromAi ? 'Rules + AI' : 'Safety rules'}</Pill>}</div>
              {!res ? (
                <div className="stack gap-10" style={{ marginTop: 18 }}>
                  <span className="well lg round"><Icon name="pulse" size={22} /></span>
                  <h3 className="serif" style={{ fontSize: 22 }}>Your result will appear here</h3>
                  <p className="muted" style={{ fontSize: 14 }}>Answer the three steps and press “Get my result”. If you see breathing trouble, collapse or suspected poisoning, don’t wait — book an urgent call now.</p>
                </div>
              ) : (
                <>
                  <div className="row gap-10" style={{ marginTop: 14 }}>
                    <span className={cx('well round', tier.tone)}><Icon name={tier.icon} /></span>
                    <div><div className="eyebrow" style={{ fontSize: 10 }}>How urgent</div><h3 className="serif" style={{ fontSize: 22 }}>{tier.label}</h3></div>
                  </div>
                  <div className="panel serif" style={{ marginTop: 16, fontSize: 17, lineHeight: 1.45 }}>{res.summary}</div>
                  {res.tier !== 'emergency' && (
                    <>
                      <div className="eyebrow muted" style={{ marginTop: 18, fontSize: 10 }}>What you can do now</div>
                      <div className="list" style={{ marginTop: 6 }}>
                        {res.steps.map((s) => <div key={s} className="list-row" style={{ alignItems: 'flex-start', fontSize: 13.5 }}><Icon name="check" size={15} className="teal" style={{ marginTop: 2 }} /><span>{s}</span></div>)}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            {res && vet && (
              <div style={{ background: 'var(--sunk-2)', padding: 22 }}>
                <div className="row gap-10"><Avatar name={vet.name.replace('Dr. ', '')} src={vet.photo} tone="white" /><div><b style={{ fontSize: 14 }}>{vet.name}</b><div className="sub" style={{ fontSize: 12 }}>{vet.specialty} · {vet.availability}</div></div></div>
                <p className="muted" style={{ fontSize: 13, margin: '10px 0 14px' }}>{res.tier === 'emergency' ? 'Start an urgent video call now. The vet will tell you whether to go straight to a clinic.' : 'Want a vet to take a look? They can check on video in a few minutes.'}</p>
                <Button variant={res.tier === 'emergency' ? 'red' : 'teal'} block icon="video" onClick={() => setBook(vet)}>{res.tier === 'emergency' ? 'Urgent video call' : `Video consult · ${money(vet.price)}`}</Button>
              </div>
            )}
          </div>
          {suggestion && (
            <div className="card flat row gap-12">
              <Icon name="flask" className="teal" />
              <div className="grow"><b style={{ fontSize: 13 }}>May help: {suggestion.name}</b><div className="sub" style={{ fontSize: 12 }}>{money(suggestion.price)} · no prescription needed</div></div>
              <Button variant="dark" size="sm" icon="plus" onClick={() => addToCart(suggestion)}>Add</Button>
            </div>
          )}
        </aside>
      </div>

      <section className="section" style={{ maxWidth: 760, margin: '0 auto' }}>
        <div className="eyebrow" style={{ textAlign: 'center' }}>Safety & transparency</div>
        <h2 className="display-2" style={{ textAlign: 'center', margin: '10px 0 22px' }}>How the checker works</h2>
        <Reveal className="stack gap-10" stagger>
          {FAQ.map(([q, a]) => (
            <details key={q} className="faq"><summary>{q}<Icon name="chevronDown" size={16} /></summary><p>{a}</p></details>
          ))}
        </Reveal>
      </section>

      {book && <BookingModal vet={book} onClose={() => setBook(null)} />}
    </div>
  );
}
