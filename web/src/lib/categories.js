// Product categories as a tree of any depth (Food › Cat food › Dry food › …).
//
// Storage: one flat Firestore collection, `categories`, one doc per node:
//   { name, slug, parentId ('' for a main category), order, active, createdAt, updatedAt }
// The slug is made once from the name and never changes, so references to it stay valid when a node is renamed.
// It is unique across the whole tree, so /shop/<slug> can find a node at any depth.
//
// What a product stores (the old flat `category` keeps working for every existing screen and for the mobile app):
//   category       slug of the MAIN (top) category: unchanged meaning, so filters, POS chips, reports and the shop's
//                  rules keep working
//   categoryId     the node the admin picked (any depth)
//   categoryPath   ids from the main category down to that node (queryable with array-contains)
//   categorySlugs  the same path as slugs
// The tree is the source of truth: names and paths are read from it, not copied onto products. Only when a branch
// is MOVED do the affected products get their path fields rewritten (reRootUpdates).
//
// Pure functions, no React or Firebase, so they can be unit-tested.

export const MAX_NAME = 60;

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

export function slugify(text, max = 60) {
  return String(text ?? '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, max).replace(/-+$/, '');
}

/** "smart-gear" → "Smart gear" (a readable name for a category made from an old plain value). */
export const nameFromSlug = (slug) => {
  const s = String(slug ?? '').trim().replace(/[-_]+/g, ' ');
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
};

/** Firestore doc → category. */
export function normCategory(id, d = {}) {
  const name = String(d.name ?? '').trim();
  return {
    id,
    name,
    slug: String(d.slug || slugify(name)),
    parentId: String(d.parentId ?? ''),
    order: num(d.order, 0),
    active: d.active !== false,
    description: String(d.description ?? ''),
  };
}

const byOrder = (a, b) => (a.order - b.order) || a.name.localeCompare(b.name);

/** id → node, and parent id → sorted children. Orphans (missing parent) are treated as main categories. */
function indexes(flat) {
  const byId = new Map(flat.map((c) => [c.id, c]));
  const kids = new Map();
  for (const c of flat) {
    const parent = c.parentId && byId.has(c.parentId) && c.parentId !== c.id ? c.parentId : '';
    if (!kids.has(parent)) kids.set(parent, []);
    kids.get(parent).push(c);
  }
  kids.forEach((list) => list.sort(byOrder));
  return { byId, kids };
}

/**
 * The tree for display: [{ ...category, depth, children: [...] }]. Broken data stays visible instead of vanishing:
 * a node whose parent is missing becomes a main category, and a loop (a under b under a) is cut open at one node.
 */
export function buildTree(flat) {
  const { byId, kids } = indexes(flat);
  const seen = new Set();
  const grow = (node, depth) => {
    seen.add(node.id);
    const children = (kids.get(node.id) || []).filter((c) => !seen.has(c.id)).map((c) => grow(c, depth + 1));
    return { ...node, depth, children };
  };
  const roots = (kids.get('') || []).map((c) => grow(c, 0));
  // anything not reached is part of a loop: surface it as main categories, one entry point per loop
  [...flat].sort(byOrder).forEach((c) => { if (!seen.has(c.id)) roots.push(grow(c, 0)); });
  return { roots, byId };
}

/** The tree as one ordered list (depth-first), for tables and select lists. */
export function flatten(roots) {
  const out = [];
  const walk = (nodes, trail) => nodes.forEach((n) => {
    const pathIds = [...trail.ids, n.id];
    const pathNames = [...trail.names, n.name];
    out.push({ ...n, children: undefined, hasChildren: n.children.length > 0, pathIds, pathNames });
    walk(n.children, { ids: pathIds, names: pathNames });
  });
  walk(roots, { ids: [], names: [] });
  return out;
}

/** Nodes from the main category down to `id` (empty if unknown). Safe on loops. */
export function pathOf(id, flat) {
  const byId = flat instanceof Map ? flat : new Map(flat.map((c) => [c.id, c]));
  const out = [];
  const seen = new Set();
  let cur = byId.get(id);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    out.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return out;
}

export const categoryLabel = (id, flat, sep = ' › ') => pathOf(id, flat).map((c) => c.name).join(sep);

/** Ids of everything below `id` (not including it). */
export function descendantIds(id, flat) {
  const { kids } = indexes(flat);
  const out = [];
  const stack = [...(kids.get(id) || [])];
  const seen = new Set([id]);
  while (stack.length) {
    const n = stack.pop();
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    out.push(n.id);
    stack.push(...(kids.get(n.id) || []));
  }
  return out;
}

/** A category can move under any other category except itself or one of its own descendants. */
export function canMove(id, newParentId, flat) {
  if (!newParentId) return true;                       // to the top level
  if (id === newParentId) return false;
  return !descendantIds(id, flat).includes(newParentId);
}

/** A slug nobody else uses: "dry-food", else "<parent>-dry-food", else "dry-food-2", "-3"… */
export function uniqueSlug(name, flat, parentId = '', ignoreId = '') {
  const taken = new Set(flat.filter((c) => c.id !== ignoreId).map((c) => c.slug));
  const base = slugify(name) || 'category';
  if (!taken.has(base)) return base;
  const parent = flat.find((c) => c.id === parentId);
  const prefixed = parent ? `${parent.slug}-${base}` : '';
  if (prefixed && !taken.has(prefixed)) return prefixed;
  for (let i = 2; i < 1000; i++) if (!taken.has(`${prefixed || base}-${i}`)) return `${prefixed || base}-${i}`;
  return `${base}-${Date.now()}`;
}

/** New ids look like c_<ms>; never one that exists. */
export function newCategoryId(flat, now = Date.now()) {
  const taken = new Set(flat.map((c) => c.id));
  let n = now;
  while (taken.has(`c_${n}`)) n += 1;
  return `c_${n}`;
}

/** Problems that stop a category being saved. `editingId` is the one being renamed or moved. */
export function validateCategory({ name, parentId = '' }, flat, { editingId = '' } = {}) {
  const errors = [];
  const n = String(name ?? '').trim();
  if (!n) errors.push('Give the category a name.');
  if (n.length > MAX_NAME) errors.push(`Keep the name under ${MAX_NAME} characters.`);
  if (parentId && !flat.some((c) => c.id === parentId)) errors.push('The chosen parent category no longer exists.');
  if (editingId && parentId && !canMove(editingId, parentId, flat)) errors.push('A category cannot be moved under itself or one of its own subcategories.');
  if (n && flat.some((c) => c.id !== editingId && c.parentId === parentId && c.name.toLowerCase() === n.toLowerCase())) {
    const parent = parentId && flat.find((c) => c.id === parentId);
    errors.push(parent ? `“${parent.name}” already has a subcategory called “${n}”.` : `There is already a main category called “${n}”.`);
  }
  return errors;
}

// ── products ↔ categories ─────────────────────────────────────────────────────────────────────────

/** The fields a product stores for a chosen node (see the header). `null` if the node does not exist. */
export function productFields(id, flat) {
  const path = pathOf(id, flat);
  if (!path.length) return null;
  return {
    category: path[0].slug,
    categoryId: path[path.length - 1].id,
    categoryPath: path.map((c) => c.id),
    categorySlugs: path.map((c) => c.slug),
  };
}

/**
 * Resolves which node a product sits in. Preference: its categoryId, then (older products with only a plain
 * `category`) the main category with that slug. Build once, use for many products.
 */
export function makeResolver(flat) {
  const byId = new Map(flat.map((c) => [c.id, c]));
  const rootBySlug = new Map();
  for (const c of flat) if (!c.parentId || !byId.has(c.parentId)) if (!rootBySlug.has(c.slug)) rootBySlug.set(c.slug, c);
  const anyBySlug = new Map(flat.map((c) => [c.slug, c]));

  const nodeOf = (p) => {
    if (p?.categoryId && byId.has(p.categoryId)) return byId.get(p.categoryId);
    const legacy = String(p?.category ?? '').trim().toLowerCase();
    return legacy ? (rootBySlug.get(legacy) || anyBySlug.get(legacy) || null) : null;
  };
  const pathIds = (p) => { const n = nodeOf(p); return n ? pathOf(n.id, byId).map((c) => c.id) : []; };
  return {
    byId,
    nodeOf,
    pathIds,
    inNode: (p, nodeId) => pathIds(p).includes(nodeId),
    label: (p, sep = ' › ') => { const n = nodeOf(p); return n ? categoryLabel(n.id, byId, sep) : ''; },
    nodeBySlug: (slug) => anyBySlug.get(String(slug ?? '').toLowerCase()) || null,
  };
}

/** id → number of products in it, counting everything in its subcategories too. */
export function countProducts(flat, products) {
  const r = makeResolver(flat);
  const counts = new Map(flat.map((c) => [c.id, 0]));
  for (const p of products) for (const id of r.pathIds(p)) counts.set(id, (counts.get(id) || 0) + 1);
  return counts;
}

/**
 * Products whose stored path fields no longer match the tree after `movedId` goes under `newParentId`.
 * Returns [{ id, fields }] to write (only the products inside the moved branch whose values actually change).
 */
export function reRootUpdates(movedId, newParentId, flat, products) {
  const after = flat.map((c) => (c.id === movedId ? { ...c, parentId: newParentId } : c));
  const inside = new Set([movedId, ...descendantIds(movedId, flat)]);
  const resolveBefore = makeResolver(flat);
  const updates = [];
  for (const p of products) {
    const node = resolveBefore.nodeOf(p);
    if (!node || !inside.has(node.id)) continue;
    const fields = productFields(node.id, after);
    if (!fields) continue;
    const same = p.category === fields.category && p.categoryId === fields.categoryId
      && JSON.stringify(p.categoryPath || []) === JSON.stringify(fields.categoryPath)
      && JSON.stringify(p.categorySlugs || []) === JSON.stringify(fields.categorySlugs);
    if (!same) updates.push({ id: p.id, fields });
  }
  return updates;
}

/** Main categories to create from products that only have the old plain `category` (plus some defaults). */
export function seedFromProducts(products, flat, defaults = []) {
  const have = new Set(flat.map((c) => c.slug));
  const wanted = [];
  const add = (slug) => {
    const s = slugify(slug);
    if (s && !have.has(s) && !wanted.includes(s)) wanted.push(s);
  };
  products.forEach((p) => { if (!p.categoryId) add(p.category); });
  defaults.forEach(add);
  const start = flat.filter((c) => !c.parentId).reduce((m, c) => Math.max(m, c.order), 0);
  return wanted.map((slug, i) => ({ name: nameFromSlug(slug), slug, parentId: '', order: start + (i + 1) * 10, active: true }));
}

/** New `order` values after moving `id` one place up (-1) or down (+1) among its siblings; only the changed ones. */
export function moveWithinSiblings(flat, id, dir) {
  const me = flat.find((c) => c.id === id);
  if (!me) return [];
  const { byId, kids } = indexes(flat);
  const parent = me.parentId && byId.has(me.parentId) ? me.parentId : '';
  const sibs = [...(kids.get(parent) || [])];
  const i = sibs.findIndex((c) => c.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= sibs.length) return [];
  [sibs[i], sibs[j]] = [sibs[j], sibs[i]];
  return sibs.map((c, k) => ({ id: c.id, order: (k + 1) * 10 })).filter((u) => flat.find((c) => c.id === u.id).order !== u.order);
}

/** Order value that puts a new node last among its siblings. */
export function nextOrder(flat, parentId = '') {
  const sibs = flat.filter((c) => c.parentId === parentId);
  return sibs.reduce((m, c) => Math.max(m, c.order), 0) + 10;
}

/**
 * Levels for the cascading picker on the product form: one pick-list for the main categories, then one more for
 * every chosen node that has children. Inactive nodes are offered only if they are already part of the choice.
 */
export function pickerLevels(selectedId, flat) {
  const { byId, kids } = indexes(flat);
  const path = pathOf(selectedId, byId);
  const keep = new Set(path.map((c) => c.id));
  const visible = (list) => list.filter((c) => c.active || keep.has(c.id));
  const levels = [{ parentId: '', options: visible(kids.get('') || []), value: path[0]?.id || '' }];
  path.forEach((node, i) => {
    const options = visible(kids.get(node.id) || []);
    if (options.length) levels.push({ parentId: node.id, options, value: path[i + 1]?.id || '' });
  });
  return levels;
}
