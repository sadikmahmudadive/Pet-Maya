import { useEffect, useState } from 'react';
import { useAdmin } from '../data.jsx';
import { PageHead } from '../AdminApp.jsx';
import { saveRecord, printReceipt, DEFAULT_SETTINGS, ROLE_ACCESS } from '../erp.js';
import { Button, Field, Toggle, Pill } from '../../ui/index.jsx';
import { useStore } from '../../lib/store.jsx';
import { functions, httpsCallable } from '../../config/firebase';

function ListEditor({ label, items, onChange, placeholder }) {
  const [v, setV] = useState('');
  return (
    <div className="field">
      <span className="label">{label}</span>
      <div className="row gap-6 wrap" style={{ marginBottom: 8 }}>
        {items.map((it) => (
          <span key={it} className="pill">{it}<button type="button" className="link tap" style={{ marginLeft: 2 }} onClick={() => onChange(items.filter((x) => x !== it))} aria-label={`Remove ${it}`}>×</button></span>
        ))}
      </div>
      <div className="row gap-8">
        <input className="input grow" value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (v.trim() && !items.includes(v.trim())) onChange([...items, v.trim()]); setV(''); } }} />
        <Button variant="outline" onClick={() => { if (v.trim() && !items.includes(v.trim())) onChange([...items, v.trim()]); setV(''); }}>Add</Button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { settings } = useAdmin();
  const { toast } = useStore();
  const [f, setF] = useState(settings);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { if (!dirty) setF(settings); }, [settings, dirty]);
  const set = (k, v) => { setF((x) => ({ ...x, [k]: v })); setDirty(true); };
  const inp = (k) => ({ value: f[k] ?? '', onChange: (e) => set(k, e.target.value) });

  const save = async () => {
    try {
      await saveRecord('settings', 'erp', {
        ...f,
        vatRate: Number(f.vatRate) || 0,
        receiptWidthMm: Number(f.receiptWidthMm) || 80,
        insideDhakaFee: Number(f.insideDhakaFee) || 0,
        insideDhakaExpressFee: Number(f.insideDhakaExpressFee) || 0,
        outsideDhakaFee: Number(f.outsideDhakaFee) || 0,
        coldExpressFee: Number(f.coldExpressFee) || 0,
        freeDeliveryOver: Number(f.freeDeliveryOver) || 0,
        minOrderValue: Number(f.minOrderValue) || 0,
      });
      setDirty(false);
      toast('Settings saved');
    } catch { toast('Couldn’t save — only admins can change settings', { tone: 'error' }); }
  };

  const [backfill, setBackfill] = useState(null);
  const runBackfill = async () => {
    setBackfill('running');
    try {
      const { data } = await httpsCallable(functions, 'backfill_security_data', { timeout: 540_000 })({});
      setBackfill(`Updated ${data.profiles} public profiles and ${data.records} medical records.`);
    } catch (e) {
      setBackfill(null);
      toast(e?.code === 'functions/permission-denied' ? 'Only admins can run this' : 'Couldn’t run the update — try again', { tone: 'error' });
    }
  };

  const testReceipt = () => printReceipt({
    number: 'S-TEST', createdAt: Date.now(), cashier: { name: 'Test' }, customer: { name: 'Walk-in' },
    items: [{ name: 'NexGard Spectra Chews', qty: 1, price: 1568, lineTotal: 1568 }, { name: 'Royal Canin Renal 2kg', qty: 2, price: 2450, discount: 100, lineTotal: 4800 }],
    gross: 6468, totalDiscount: 100, vat: f.vatRate ? (f.pricesIncludeVat ? 6368 - 6368 / (1 + f.vatRate / 100) : 6368 * (f.vatRate / 100)) : 0,
    total: f.pricesIncludeVat || !f.vatRate ? 6368 : Math.round(6368 * (1 + f.vatRate / 100)), vatRate: Number(f.vatRate) || 0, pricesIncludeVat: f.pricesIncludeVat,
    payments: [{ method: 'Cash', amount: 7000 }], change: 632,
  }, { ...f, vatRate: Number(f.vatRate) || 0 });

  return (
    <>
      <PageHead eyebrow="Configuration" title="Settings">
        {dirty && <Pill sm>Unsaved changes</Pill>}
        <Button variant="outline" icon="printer" onClick={testReceipt}>Test receipt</Button>
        <Button variant="dark" icon="check" disabled={!dirty} onClick={save}>Save settings</Button>
      </PageHead>

      <div className="adm-grid-2 even">
        <div className="card">
          <h2 className="h-card">Business</h2>
          <div className="sub" style={{ marginBottom: 14 }}>Printed on receipts, tax invoices, purchase orders and reports.</div>
          <div className="fields">
            <Field className="full" label="Business name" {...inp('businessName')} />
            <Field label="Branch / outlet" {...inp('branch')} />
            <Field label="Phone" {...inp('phone')} />
            <Field className="full" label="Address" {...inp('address')} />
            <Field label="Email" type="email" {...inp('email')} />
            <Field label="VAT registration (BIN)" {...inp('bin')} />
          </div>
        </div>

        <div className="card">
          <h2 className="h-card">Online Store & Bangladesh Delivery</h2>
          <div className="sub" style={{ marginBottom: 14 }}>Configurable delivery charges, thresholds, cold-chain districts and mobile wallets.</div>
          <div className="fields">
            <Field label="Inside Dhaka Fee (৳)" type="number" min="0" {...inp('insideDhakaFee')} />
            <Field label="Express Dhaka Fee (৳)" type="number" min="0" {...inp('insideDhakaExpressFee')} />
            <Field label="Outside Dhaka Courier (৳)" type="number" min="0" {...inp('outsideDhakaFee')} />
            <Field label="Cold-Chain Express (৳)" type="number" min="0" {...inp('coldExpressFee')} />
            <Field label="Free delivery over (৳)" type="number" min="0" {...inp('freeDeliveryOver')} />
            <Field label="Minimum order value (৳)" type="number" min="0" {...inp('minOrderValue')} />
            <Field label="bKash Send Money #" {...inp('bkashMerchantNumber')} />
            <Field label="Nagad Send Money #" {...inp('nagadMerchantNumber')} />
          </div>
          <div style={{ marginTop: 14 }}>
            <ListEditor
              label="Cold-chain supported districts (2°C–8°C)"
              items={f.coldDistricts || DEFAULT_SETTINGS.coldDistricts}
              onChange={(v) => set('coldDistricts', v.length ? v : ['Dhaka'])}
              placeholder="e.g. Chattogram"
            />
          </div>
        </div>

        <div className="card">
          <h2 className="h-card">Tax & receipts</h2>
          <div className="sub" style={{ marginBottom: 14 }}>Confirm the VAT rate that applies to your products with your tax adviser.</div>
          <div className="fields">
            <Field label="VAT rate (%)" type="number" min="0" step="0.1" {...inp('vatRate')} />
            <Field label="Receipt paper width">
              <select className="select" value={f.receiptWidthMm} onChange={(e) => set('receiptWidthMm', Number(e.target.value))}><option value={80}>80 mm</option><option value={58}>58 mm</option></select>
            </Field>
            <Field className="full" label="Receipt footer" {...inp('receiptFooter')} />
          </div>
          <div className="toggle-row" style={{ marginTop: 8 }}><span>Prices already include VAT</span><Toggle checked={!!f.pricesIncludeVat} onChange={(v) => set('pricesIncludeVat', v)} label="Prices include VAT" /></div>
        </div>

        <div className="card">
          <h2 className="h-card">Point of sale</h2>
          <div style={{ marginTop: 10 }}>
            <div className="toggle-row"><span>Require an open cash-drawer shift to sell</span><Toggle checked={!!f.requireShift} onChange={(v) => set('requireShift', v)} label="Require shift" /></div>
            <div className="toggle-row"><span>Allow selling when stock is zero (negative stock)</span><Toggle checked={!!f.allowNegativeStock} onChange={(v) => set('allowNegativeStock', v)} label="Allow negative stock" /></div>
          </div>
          <div style={{ marginTop: 14 }}>
            <ListEditor label="Payment methods" items={f.paymentMethods || []} onChange={(v) => set('paymentMethods', v.length ? v : ['Cash'])} placeholder="e.g. Rocket, Upay" />
          </div>
        </div>

        <div className="card">
          <h2 className="h-card">Accounting</h2>
          <div style={{ marginTop: 10 }}>
            <ListEditor label="Expense categories" items={f.expenseCategories || []} onChange={(v) => set('expenseCategories', v.length ? v : DEFAULT_SETTINGS.expenseCategories)} placeholder="e.g. Veterinary consumables" />
          </div>
        </div>

        <div className="card">
          <h2 className="h-card">Role-Based Access Control</h2>
          <div className="sub" style={{ marginBottom: 12 }}>Staff roles assigned under Staff automatically enforce these console permissions.</div>
          <div className="list">
            {Object.entries(ROLE_ACCESS).map(([roleName, routes]) => (
              <div key={roleName} className="list-row" style={{ padding: '8px 0', fontSize: 13 }}>
                <b style={{ minWidth: 110 }}>{roleName}</b>
                <div className="row gap-6 wrap">
                  {routes.map((rt) => (
                    <Pill key={rt} mono sm>{rt === '*' ? 'Full console access' : rt.replace('/admin/', '') || 'dashboard'}</Pill>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="h-card">Security data</h2>
          <div className="sub" style={{ marginBottom: 14 }}>
            Run once after deploying the security update: builds public author cards (names and photos only)
            and links older medical records to their pet’s owner. New data is kept in sync automatically.
          </div>
          <Button variant="outline" icon="shield" disabled={backfill === 'running'} onClick={runBackfill}>
            {backfill === 'running' ? 'Updating…' : 'Update security data'}
          </Button>
          {backfill && backfill !== 'running' && <div className="sub" style={{ marginTop: 10 }}>{backfill}</div>}
        </div>
      </div>
    </>
  );
}
