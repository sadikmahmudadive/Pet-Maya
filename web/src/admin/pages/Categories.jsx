import { useEffect, useMemo, useRef, useState } from 'react';
import { useAdmin } from '../data.jsx';
import { PageHead } from '../AdminApp.jsx';
import { Icon, Button, Pill, Toggle, Field, Empty } from '../../ui/index.jsx';
import { cx } from '../../lib/format.js';
import { useStore } from '../../lib/store.jsx';
import { commitWrites, categoryDoc } from '../categoryOps.js';
import { CATEGORIES } from '../productForm.js';
import {
  MAX_NAME, buildTree, canMove, categoryLabel, countProducts, flatten, moveWithinSiblings, newCategoryId, nextOrder,
  reRootUpdates, seedFromProducts, uniqueSlug, validateCategory,
} from '../../lib/categories.js';

const blank = (parentId = '') => ({ name: '', parentId, description: '', active: true });

export default function Categories() {
  const { categories, products, live } = useAdmin();
  const { toast } = useStore();
  const [sel, setSel] = useState(null);          // null | { id } (editing) | { parentId } (adding)
  const [draft, setDraft] = useState(blank());
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [showProblems, setShowProblems] = useState(false);
  const nameRef = useRef(null);

  const flat = useMemo(() => flatten(buildTree(categories).roots), [categories]);
  const counts = useMemo(() => countProducts(categories, products), [categories, products]);
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const visible = flat.filter((n) => !n.pathIds.slice(0, -1).some((id) => collapsed.has(id)));
  const editing = sel && sel.id ? byId.get(sel.id) : null;

  // Load the form when a different category is picked (not on every data update, which would wipe what is being typed).
  const selKey = sel ? (sel.id ? `e:${sel.id}` : `n:${sel.parentId}`) : '';
  useEffect(() => {
    setShowProblems(false);
    if (!sel) return;
    const cur = sel.id ? byId.get(sel.id) : null;
    setDraft(cur ? { name: cur.name, parentId: cur.parentId || '', description: cur.description || '', active: cur.active !== false } : blank(sel.parentId || ''));
    if (!sel.id) setTimeout(() => nameRef.current?.focus(), 0);
  }, [selKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // The category being edited disappeared (deleted elsewhere): close the panel.
  useEffect(() => { if (sel?.id && !byId.has(sel.id)) setSel(null); }, [byId, sel]);

  const problems = validateCategory({ name: draft.name, parentId: draft.parentId }, categories, { editingId: sel?.id || '' });
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const parentOptions = flat.filter((n) => !sel?.id || canMove(sel.id, n.id, categories));
  const movedCount = editing && (editing.parentId || '') !== draft.parentId && !problems.length
    ? reRootUpdates(editing.id, draft.parentId, categories, products).length : 0;

  const run = async (fn, okMsg) => {
    setBusy(true);
    try { await fn(); if (okMsg) toast(okMsg); return true; } catch {
      toast('Couldn’t save — check your connection or permissions', { tone: 'error' }); return false;
    } finally { setBusy(false); }
  };

  const save = async () => {
    setShowProblems(true);
    if (problems.length) { toast(problems[0], { tone: 'error' }); nameRef.current?.focus(); return; }
    const name = draft.name.trim();
    const parentId = draft.parentId;
    if (!sel.id) {
      const id = newCategoryId(categories);
      const node = { id, name, slug: uniqueSlug(name, categories, parentId), parentId, order: nextOrder(categories, parentId), active: draft.active, description: draft.description.trim() };
      const ok = await run(() => commitWrites([{ col: 'categories', id, data: categoryDoc(node) }]), `“${name}” added`);
      if (ok) { setSel({ parentId }); setDraft(blank(parentId)); setShowProblems(false); if (parentId) setCollapsed((s) => { const n = new Set(s); n.delete(parentId); return n; }); setTimeout(() => nameRef.current?.focus(), 0); }
      return;
    }
    const moved = (editing.parentId || '') !== parentId;
    const fixes = moved ? reRootUpdates(editing.id, parentId, categories, products) : [];
    if (fixes.length && !window.confirm(`Moving “${editing.name}” updates the category of ${fixes.length} product${fixes.length > 1 ? 's' : ''} so they follow it. Continue?`)) return;
    const next = { ...editing, name, parentId, description: draft.description.trim(), active: draft.active, order: moved ? nextOrder(categories, parentId) : editing.order };
    const writes = [{ col: 'categories', id: editing.id, data: categoryDoc(next) }, ...fixes.map((u) => ({ col: 'products', id: u.id, data: u.fields }))];
    await run(() => commitWrites(writes), moved ? `Moved “${name}”${fixes.length ? ` and updated ${fixes.length} product${fixes.length > 1 ? 's' : ''}` : ''}` : 'Category saved');
  };

  const remove = async () => {
    if (!editing || counts.get(editing.id) || flat.find((n) => n.id === editing.id)?.hasChildren) return;
    if (!window.confirm(`Delete “${editing.name}”? This can’t be undone.`)) return;
    const ok = await run(() => commitWrites([{ col: 'categories', id: editing.id, remove: true }]), `“${editing.name}” deleted`);
    if (ok) setSel(null);
  };

  const shift = (id, dir) => {
    const moves = moveWithinSiblings(categories, id, dir);
    if (moves.length) run(() => commitWrites(moves.map((m) => ({ col: 'categories', id: m.id, data: { order: m.order } }))));
  };

  // Main categories from the labels already on real products, or the usual pet-shop set.
  const seed = async (fromProducts) => {
    const acc = [];
    const writes = seedFromProducts(fromProducts ? products : [], categories, fromProducts ? [] : CATEGORIES).map((s) => {
      const id = newCategoryId([...categories, ...acc]);
      acc.push({ id });
      return { col: 'categories', id, data: categoryDoc({ ...s, description: '' }) };
    });
    await run(() => commitWrites(writes), writes.length ? `Created ${writes.length} main categor${writes.length > 1 ? 'ies' : 'y'}` : 'Nothing to create: no product has an old-style category');
  };

  const toggle = (id) => setCollapsed((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const parents = flat.filter((n) => n.hasChildren).map((n) => n.id);
  const hasChildrenSel = editing ? !!flat.find((n) => n.id === editing.id)?.hasChildren : false;
  const inUse = editing ? counts.get(editing.id) || 0 : 0;
  const nameErr = showProblems && problems.length ? problems[0] : '';

  return (
    <>
      <PageHead eyebrow="Catalogue & stock" title="Categories">
        {parents.length > 0 && (
          <>
            <Button variant="outline" onClick={() => setCollapsed(new Set())}>Expand all</Button>
            <Button variant="outline" onClick={() => setCollapsed(new Set(parents))}>Collapse all</Button>
          </>
        )}
        <Button variant="dark" icon="plus" onClick={() => setSel({ parentId: '' })}>Add main category</Button>
      </PageHead>

      <div className="adm-grid-side wide">
        <div className="card flush">
          {flat.length === 0 ? (
            <div style={{ padding: 20 }}>
              <Empty icon="tag" title="No categories yet">Create a main category such as Food, then add subcategories under it (Food → Cat food → Dry food). You can go as deep as you need.</Empty>
              <div className="row gap-8 wrap" style={{ justifyContent: 'center', marginTop: 12 }}>
                <Button variant="dark" icon="plus" onClick={() => setSel({ parentId: '' })}>Add main category</Button>
                {live.products && products.length > 0 && <Button variant="outline" disabled={busy} onClick={() => seed(true)}>Create from my products</Button>}
                <Button variant="outline" disabled={busy} onClick={() => seed(false)}>Start with common categories</Button>
              </div>
            </div>
          ) : (
            <div role="tree" aria-label="Product categories">
              {visible.map((n) => {
                const open = !collapsed.has(n.id);
                const active = sel?.id === n.id;
                return (
                  <div
                    key={n.id}
                    role="treeitem"
                    aria-level={n.depth + 1}
                    aria-selected={active}
                    aria-expanded={n.hasChildren ? open : undefined}
                    className={cx('cat-row', active && 'selected', n.active === false && 'is-hidden')}
                    style={{ paddingLeft: 12 + n.depth * 22 }}
                  >
                    {n.hasChildren
                      ? <button type="button" className="cat-caret" onClick={() => toggle(n.id)} aria-label={`${open ? 'Collapse' : 'Expand'} ${n.name}`}><Icon name={open ? 'chevronDown' : 'chevronRight'} size={14} /></button>
                      : <span className="cat-caret" aria-hidden="true" />}
                    <button type="button" className="cat-name" onClick={() => setSel({ id: n.id })}>
                      <span className="ellipsis">{n.name}</span>
                      {n.active === false && <Pill sm>Hidden</Pill>}
                    </button>
                    <span className="subtle" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{counts.get(n.id) || 0} product{(counts.get(n.id) || 0) === 1 ? '' : 's'}</span>
                    <span className="row gap-2 cat-tools">
                      <button type="button" className="btn btn-ghost btn-square btn-sm" onClick={() => shift(n.id, -1)} aria-label={`Move ${n.name} up`}><Icon name="chevronDown" size={14} style={{ transform: 'rotate(180deg)' }} /></button>
                      <button type="button" className="btn btn-ghost btn-square btn-sm" onClick={() => shift(n.id, 1)} aria-label={`Move ${n.name} down`}><Icon name="chevronDown" size={14} /></button>
                      <button type="button" className="btn btn-ghost btn-square btn-sm" onClick={() => setSel({ parentId: n.id })} aria-label={`Add a subcategory under ${n.name}`}><Icon name="plus" size={14} /></button>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {sel && (
          <div className="card" style={{ position: 'sticky', top: 84 }}>
            <div className="card-head">
              <div>
                <h2 className="h-card">{editing ? 'Edit category' : draft.parentId ? 'New subcategory' : 'New main category'}</h2>
                <div className="sub">{editing ? categoryLabel(editing.id, categories) : draft.parentId ? `Inside ${categoryLabel(draft.parentId, categories)}` : 'Top level of the shop menu'}</div>
              </div>
              <button type="button" className="btn btn-ghost btn-square btn-sm" onClick={() => setSel(null)} aria-label="Close"><Icon name="x" size={14} /></button>
            </div>
            <form className="fields" style={{ marginTop: 14 }} onSubmit={(e) => { e.preventDefault(); save(); }}>
              <Field className="full" label="Name" hint="required">
                <input ref={nameRef} className="input" maxLength={MAX_NAME} placeholder="e.g. Dry food" aria-invalid={nameErr ? 'true' : undefined} value={draft.name} onChange={(e) => set('name', e.target.value)} />
                {nameErr && <span className="field-err" role="alert">{nameErr}</span>}
              </Field>
              <Field className="full" label="Inside">
                <select className="select" value={draft.parentId} onChange={(e) => set('parentId', e.target.value)}>
                  <option value="">None — main category</option>
                  {parentOptions.map((n) => <option key={n.id} value={n.id}>{'  '.repeat(n.depth)}{n.depth ? '↳ ' : ''}{n.name}</option>)}
                </select>
              </Field>
              {editing && <div className="sub full" style={{ fontSize: 12 }}>Link name: <span className="mono">{editing.slug}</span> (stays the same when renamed, so shop links keep working)</div>}
              <Field className="full" label="Description" hint="optional">
                <textarea className="textarea" rows={2} maxLength={300} value={draft.description} onChange={(e) => set('description', e.target.value)} />
              </Field>
              <div className="toggle-row full"><span>Show in the shop and product forms</span><Toggle checked={draft.active} onChange={(v) => set('active', v)} label="Show in the shop and product forms" /></div>
              {movedCount > 0 && <div className="sub full" role="status" style={{ fontSize: 12 }}>Saving will update the category of {movedCount} product{movedCount > 1 ? 's' : ''} in this branch.</div>}
              <div className="row gap-8 full">
                <Button variant="dark" icon="check" className="grow" type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add category'}</Button>
                {!editing && <Button variant="ghost" onClick={() => setSel(null)}>Done</Button>}
              </div>
            </form>
            {editing && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                <div className="row between wrap gap-8">
                  <Button variant="outline" size="sm" icon="plus" onClick={() => setSel({ parentId: editing.id })}>Add subcategory</Button>
                  <Button variant="outline" size="sm" disabled={busy || inUse > 0 || hasChildrenSel} style={{ color: 'var(--red)' }} onClick={remove}>Delete</Button>
                </div>
                {(inUse > 0 || hasChildrenSel) && (
                  <div className="sub" style={{ fontSize: 12, marginTop: 8 }}>
                    {hasChildrenSel ? 'Move or delete its subcategories first. ' : ''}{inUse > 0 ? `${inUse} product${inUse > 1 ? 's' : ''} use${inUse > 1 ? '' : 's'} it: move ${inUse > 1 ? 'them' : 'it'} to another category first.` : ''}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
