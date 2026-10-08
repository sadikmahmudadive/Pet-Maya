import { useMemo, useState } from 'react';
import { useAdmin } from '../data.jsx';
import { PageHead } from '../AdminApp.jsx';
import { saveRecord, runPayroll, STAFF_ROLES, ROLE_ACCESS } from '../erp.js';
import { saveDoc } from '../../data/firestore.js';
import { Modal } from './POS.jsx';
import { Button, Pill, Stat, Tabs, Empty, Field, Toggle, Avatar } from '../../ui/index.jsx';
import { money, cx } from '../../lib/format.js';
import { useStore } from '../../lib/store.jsx';

const today = () => new Date().toISOString().slice(0, 10);
const hm = (ms) => (ms ? new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—');

function StaffModal({ person, users, onClose }) {
  const { toast } = useStore();
  const [f, setF] = useState({ name: '', role: 'Cashier', phone: '', email: '', salary: '', nid: '', joinedAt: today(), active: true, consoleAccess: false, ...person, ...(person?.joinedAt ? { joinedAt: new Date(person.joinedAt).toISOString().slice(0, 10) } : {}) });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const account = users.find((u) => f.email && u.email?.toLowerCase() === f.email.trim().toLowerCase());

  const save = async (e) => {
    e.preventDefault();
    try {
      await saveRecord('staff', person?.id, {
        name: f.name.trim(), role: f.role, phone: f.phone, email: f.email.trim(), salary: Number(f.salary) || 0, nid: f.nid,
        joinedAt: Date.parse(f.joinedAt) || Date.now(), active: !!f.active, consoleAccess: !!f.consoleAccess && !!account, uid: account?.uid || '',
      });
      // Console access = `staffRole` on the linked account (checked by the console gate and Firestore rules).
      // It's separate from `role`, which the mobile app manages, so app logins can't revoke it.
      if (account && !/admin/i.test(account.role)) {
        await saveDoc('users', account.uid, { staffRole: f.consoleAccess && f.active ? f.role : '' });
      }
      toast(person?.id ? 'Staff member saved' : 'Staff member added');
      onClose();
    } catch { toast('Couldn’t save — only admins can change staff', { tone: 'error' }); }
  };

  return (
    <Modal title={person?.id ? 'Edit staff member' : 'Add staff member'} onClose={onClose} width={580}>
      <form className="stack gap-14" onSubmit={save}>
        <div className="fields">
          <Field className="full" label="Full name" value={f.name} onChange={set('name')} required autoFocus />
          <Field label="Role"><select className="select" value={f.role} onChange={set('role')}>{STAFF_ROLES.map((r) => <option key={r}>{r}</option>)}</select></Field>
          <Field label="Monthly salary (BDT)" type="number" min="0" value={f.salary} onChange={set('salary')} />
          <Field label="Phone" value={f.phone} onChange={set('phone')} />
          <Field label="Email" type="email" value={f.email} onChange={set('email')} hint={account ? 'Pet Maya account found' : 'needed for console access'} />
          <Field label="NID / ID number" value={f.nid} onChange={set('nid')} />
          <Field label="Joined" type="date" value={f.joinedAt} onChange={set('joinedAt')} />
        </div>
        <div className="toggle-row"><span>Currently employed</span><Toggle checked={!!f.active} onChange={(v) => setF({ ...f, active: v })} label="Active" /></div>
        <div className="toggle-row">
          <span>Console access <span className="sub" style={{ fontSize: 12 }}>· {(ROLE_ACCESS[f.role] || []).includes('*') ? 'everything' : (ROLE_ACCESS[f.role] || []).map((p) => p.replace('/admin/', '').replace('/admin', 'dashboard')).join(', ')}</span></span>
          <Toggle checked={!!f.consoleAccess} onChange={(v) => setF({ ...f, consoleAccess: v })} label="Console access" />
        </div>
        {f.consoleAccess && !account && <div className="note-yellow">Ask them to sign up on Pet Maya with {f.email || 'their email'} first, then save again to link the account.</div>}
        <Button type="submit" variant="dark" block icon="check">Save</Button>
      </form>
    </Modal>
  );
}

export default function Staff({ user }) {
  const { staff, attendance, payroll, sales, allUsers } = useAdmin();
  const { toast } = useStore();
  const [tab, setTab] = useState('team');
  const [edit, setEdit] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const active = staff.filter((s) => s.active !== false);
  const day = today();
  const todayRec = Object.fromEntries(attendance.filter((a) => a.date === day).map((a) => [a.staffId, a]));
  const ran = payroll.find((p) => p.month === month || p.id === month);

  const clock = async (s, kind) => {
    const id = `${s.id}_${day}`;
    try {
      await saveRecord('attendance', id, kind === 'in' ? { staffId: s.id, name: s.name, date: day, in: Date.now() } : { out: Date.now() });
      toast(`${s.name} clocked ${kind}`);
    } catch { toast('Couldn’t record attendance', { tone: 'error' }); }
  };

  const monthAtt = useMemo(() => {
    const m = {};
    attendance.filter((a) => a.date?.startsWith(month)).forEach((a) => {
      m[a.staffId] ||= { days: 0, hours: 0, late: 0 };
      m[a.staffId].days++;
      if (a.in && a.out) m[a.staffId].hours += (a.out - a.in) / 3600e3;
      if (a.in && new Date(a.in).getHours() * 60 + new Date(a.in).getMinutes() > 9 * 60 + 15) m[a.staffId].late++;
    });
    return m;
  }, [attendance, month]);

  const perf = useMemo(() => {
    const p = {};
    sales.filter((s) => new Date(s.createdAt).toISOString().startsWith(month)).forEach((s) => {
      const k = s.cashier?.name || '—';
      p[k] ||= { n: 0, total: 0, refunds: 0 };
      p[k].n++; p[k].total += s.total || 0; p[k].refunds += s.refundedTotal || 0;
    });
    return Object.entries(p).sort((a, b) => b[1].total - a[1].total);
  }, [sales, month]);

  const payrollTotal = active.reduce((a, s) => a + (Number(s.salary) || 0), 0);

  return (
    <>
      <PageHead eyebrow="People" title="Staff">
        <input className="filter-select" type="month" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month" style={{ paddingRight: 16 }} />
        <Button variant="dark" icon="plus" onClick={() => setEdit({})}>Add staff</Button>
      </PageHead>

      <div className="stat-grid">
        <Stat label="Active staff" value={active.length} icon="users" note={`${staff.filter((s) => s.consoleAccess).length} with console access`} />
        <Stat label="On shift now" value={Object.values(todayRec).filter((a) => a.in && !a.out).length} icon="clock" note="clocked in, not out" />
        <Stat label="Monthly payroll" value={money(payrollTotal)} icon="cash" note={ran ? `${month} paid` : `${month} not run`} />
        <Stat label="Top seller" value={perf[0]?.[0] || '—'} icon="star" note={perf[0] ? money(perf[0][1].total) : 'no till sales'} />
      </div>

      <div style={{ marginTop: 16 }}><Tabs items={[{ value: 'team', label: 'Team & attendance' }, { value: 'payroll', label: 'Payroll' }, { value: 'perf', label: 'Sales by cashier' }]} value={tab} onChange={setTab} /></div>

      {tab === 'team' && (
        <div className="card flush" style={{ marginTop: 16 }}>
          {staff.length === 0 ? <Empty icon="users" title="No staff yet"><Button variant="dark" icon="plus" style={{ marginTop: 12 }} onClick={() => setEdit({})}>Add your first team member</Button></Empty> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Name</th><th>Role</th><th>Contact</th><th>Today</th><th>{month}</th><th /></tr></thead>
                <tbody>
                  {staff.map((s) => {
                    const a = todayRec[s.id];
                    const m = monthAtt[s.id];
                    return (
                      <tr key={s.id} className={cx(s.active === false && 'muted')}>
                        <td><div className="row gap-10"><Avatar name={s.name} size="sm" /><div><div className="cell-title">{s.name}</div><div className="cell-sub">{s.active === false ? 'Former staff' : s.consoleAccess ? 'Console access' : 'No console access'}</div></div></div></td>
                        <td><Pill sm>{s.role}</Pill></td>
                        <td><div>{s.phone}</div><div className="cell-sub">{s.email}</div></td>
                        <td>{a ? <span>{hm(a.in)} – {hm(a.out)}</span> : <span className="subtle">Not in</span>}</td>
                        <td>{m ? `${m.days} days · ${m.hours.toFixed(1)} h${m.late ? ` · ${m.late} late` : ''}` : '—'}</td>
                        <td>
                          <div className="row gap-6">
                            {s.active !== false && (!a ? <Button size="sm" variant="teal" onClick={() => clock(s, 'in')}>Clock in</Button>
                              : !a.out ? <Button size="sm" variant="outline" onClick={() => clock(s, 'out')}>Clock out</Button> : null)}
                            <Button size="sm" variant="outline" onClick={() => setEdit(s)}>Edit</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'payroll' && (
        <div className="adm-grid-2" style={{ marginTop: 16 }}>
          <div className="card flush">
            <div className="row between" style={{ padding: '16px 20px' }}>
              <div><h2 className="h-card">Payroll · {month}</h2><div className="sub">{ran ? `Run by ${ran.by} on ${new Date(ran.at).toLocaleDateString('en-GB')}` : 'Not run yet'}</div></div>
              <Button variant="dark" icon="cash" disabled={!!ran || !active.length} onClick={async () => {
                if (!window.confirm(`Post ${money(payrollTotal)} of salaries for ${month} as expenses?`)) return;
                try { const n = await runPayroll(month, active, { by: user?.name }); toast(`Payroll posted for ${n} staff`); } catch (e) { toast(e.message || 'Payroll failed', { tone: 'error' }); }
              }}>{ran ? 'Paid' : 'Run payroll'}</Button>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Employee</th><th>Role</th><th>Days worked</th><th>Salary</th></tr></thead>
                <tbody>
                  {(ran ? ran.lines.map((l) => ({ ...l, id: l.staffId, salary: l.amount })) : active).map((s) => <tr key={s.id}><td className="cell-title">{s.name}</td><td>{s.role}</td><td>{monthAtt[s.id || s.staffId]?.days ?? '—'}</td><td><b>{money(s.salary)}</b></td></tr>)}
                  <tr><td colSpan={3}><b>Total</b></td><td><b>{money(ran ? ran.total : payrollTotal)}</b></td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <h2 className="h-card">How payroll works</h2>
            <p className="sub" style={{ marginTop: 8, lineHeight: 1.6 }}>Running payroll posts one <b>Salaries</b> expense per active employee for the month, so it flows into Finance (P&amp;L and cash book). Each month can only be run once. Adjust salaries on the staff record before running it.</p>
          </div>
        </div>
      )}

      {tab === 'perf' && (
        <div className="card flush" style={{ marginTop: 16 }}>
          {perf.length === 0 ? <Empty icon="trend" title={`No till sales in ${month}`} /> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Cashier</th><th>Receipts</th><th>Takings</th><th>Avg. basket</th><th>Refunds</th><th /></tr></thead>
                <tbody>
                  {perf.map(([name, p]) => (
                    <tr key={name}>
                      <td className="cell-title">{name}</td><td>{p.n}</td><td><b>{money(p.total)}</b></td><td>{money(p.total / p.n)}</td>
                      <td className={p.refunds ? 'red' : ''}>{money(p.refunds)}</td>
                      <td style={{ minWidth: 140 }}><div className="meter" style={{ height: 6 }}><span style={{ width: `${(p.total / perf[0][1].total) * 100}%` }} /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {edit && <StaffModal person={edit.id ? edit : null} users={allUsers} onClose={() => setEdit(null)} />}
    </>
  );
}
