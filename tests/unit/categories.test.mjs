// Category tree logic (pure, no browser). Run: node --test tests/unit/categories.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_NAME, buildTree, canMove, categoryLabel, countProducts, descendantIds, flatten, makeResolver, moveWithinSiblings,
  nameFromSlug, newCategoryId, nextOrder, normCategory, pathOf, pickerLevels, productFields, reRootUpdates, seedFromProducts,
  slugify, uniqueSlug, validateCategory,
} from '../../web/src/lib/categories.js';

const c = (id, name, parentId = '', extra = {}) => normCategory(id, { name, parentId, ...extra });
// Food › Cat food › Dry food, Food › Dog food, Toys
const TREE = [
  c('food', 'Food', '', { order: 10 }), c('cat', 'Cat food', 'food', { order: 10 }), c('dry', 'Dry food', 'cat', { order: 10 }),
  c('wet', 'Wet food', 'cat', { order: 20 }), c('dog', 'Dog food', 'food', { order: 20 }), c('toys', 'Toys', '', { order: 20 }),
];
const P = (id, extra) => ({ id, ...extra });

test('names become safe slugs', () => {
  assert.equal(slugify('Cat food'), 'cat-food');
  assert.equal(slugify('  Grooming & Dental! '), 'grooming-and-dental');
  assert.equal(slugify('Café Crème'), 'cafe-creme');
  assert.equal(slugify('খাবার'), '');
  assert.equal(nameFromSlug('smart-gear'), 'Smart gear');
  assert.equal(nameFromSlug(''), '');
});

test('the tree has unlimited depth, ordered by position then name, and flattens depth-first', () => {
  const { roots } = buildTree(TREE);
  assert.deepEqual(roots.map((r) => r.name), ['Food', 'Toys']);
  assert.deepEqual(roots[0].children.map((x) => x.name), ['Cat food', 'Dog food']);
  assert.deepEqual(roots[0].children[0].children.map((x) => x.name), ['Dry food', 'Wet food']);
  assert.equal(roots[0].children[0].children[0].depth, 2);
  const flat = flatten(roots);
  assert.deepEqual(flat.map((n) => n.name), ['Food', 'Cat food', 'Dry food', 'Wet food', 'Dog food', 'Toys']);
  assert.deepEqual(flat[2].pathNames, ['Food', 'Cat food', 'Dry food']);
  assert.equal(flat[1].hasChildren, true);
  assert.equal(flat[2].hasChildren, false);
});

test('a chain 40 levels deep works (no depth limit)', () => {
  const chain = Array.from({ length: 40 }, (_, i) => c(`n${i}`, `Level ${i}`, i ? `n${i - 1}` : ''));
  const flat = flatten(buildTree(chain).roots);
  assert.equal(flat.length, 40);
  assert.equal(flat[39].pathIds.length, 40);
  assert.equal(pathOf('n39', chain)[0].id, 'n0');
  assert.equal(categoryLabel('n2', chain), 'Level 0 › Level 1 › Level 2');
});

test('broken data stays visible: orphans become main categories and loops are cut open', () => {
  const broken = [c('a', 'A', 'b'), c('b', 'B', 'a'), c('o', 'Orphan', 'gone'), c('ok', 'Fine')];
  const { roots } = buildTree(broken);
  const names = flatten(roots).map((n) => n.name).sort();
  assert.deepEqual(names, ['A', 'B', 'Fine', 'Orphan']); // nothing lost, no infinite recursion
  assert.ok(roots.some((r) => r.name === 'Orphan'));
  assert.equal(pathOf('a', broken).length, 2);           // path walking stops on the loop
});

test('paths, labels and descendants', () => {
  assert.deepEqual(pathOf('dry', TREE).map((n) => n.id), ['food', 'cat', 'dry']);
  assert.deepEqual(pathOf('nope', TREE), []);
  assert.equal(categoryLabel('wet', TREE), 'Food › Cat food › Wet food');
  assert.equal(categoryLabel('wet', TREE, ' > '), 'Food > Cat food > Wet food');
  assert.deepEqual(descendantIds('food', TREE).sort(), ['cat', 'dog', 'dry', 'wet']);
  assert.deepEqual(descendantIds('dry', TREE), []);
});

test('moving: not under itself or its own descendants, anything else is fine', () => {
  assert.equal(canMove('cat', 'cat', TREE), false);
  assert.equal(canMove('food', 'dry', TREE), false);   // into its own grandchild
  assert.equal(canMove('cat', 'toys', TREE), true);
  assert.equal(canMove('dry', '', TREE), true);        // to the top
  assert.equal(canMove('dry', 'dog', TREE), true);
});

test('slugs are unique across the whole tree', () => {
  assert.equal(uniqueSlug('Snacks', TREE, ''), 'snacks');
  assert.equal(uniqueSlug('Dry food', TREE, 'dog'), 'dog-food-dry-food');           // "dry-food" is taken: prefixed with the parent
  assert.equal(uniqueSlug('Toys', TREE, ''), 'toys-2');
  const more = [...TREE, c('x', 'Dry food', 'dog', { slug: 'dog-food-dry-food' })];
  assert.equal(uniqueSlug('Dry food', more, 'dog'), 'dog-food-dry-food-2');
  assert.equal(uniqueSlug('Dry food', TREE, 'dog', 'dry'), 'dry-food');             // ignoring itself while editing: its own slug is free again
  assert.equal(uniqueSlug('খাবার', TREE), 'category');
  assert.equal(newCategoryId([{ id: 'c_5' }], 5), 'c_6');
});

test('validation: name, duplicates among siblings only, parent must exist, no loops', () => {
  assert.equal(validateCategory({ name: '  ' }, TREE).length, 1);
  assert.equal(validateCategory({ name: 'x'.repeat(MAX_NAME + 1) }, TREE).length, 1);
  assert.match(validateCategory({ name: 'cat FOOD', parentId: 'food' }, TREE)[0], /already has a subcategory called/);
  assert.match(validateCategory({ name: 'toys' }, TREE)[0], /already a main category/);
  assert.deepEqual(validateCategory({ name: 'Dry food', parentId: 'dog' }, TREE), []);   // same name under another parent is fine
  assert.deepEqual(validateCategory({ name: 'Cat food', parentId: 'food' }, TREE, { editingId: 'cat' }), []); // not a clash with itself
  assert.match(validateCategory({ name: 'Snacks', parentId: 'ghost' }, TREE)[0], /no longer exists/);
  assert.match(validateCategory({ name: 'Food', parentId: 'dry' }, TREE, { editingId: 'food' })[0], /under itself/);
});

test('what a product stores for a chosen node', () => {
  assert.deepEqual(productFields('dry', TREE), { category: 'food', categoryId: 'dry', categoryPath: ['food', 'cat', 'dry'], categorySlugs: ['food', 'cat-food', 'dry-food'] });
  assert.deepEqual(productFields('toys', TREE).categoryPath, ['toys']);
  assert.equal(productFields('ghost', TREE), null);
});

test('resolving a product to its node, including old products with only a plain category', () => {
  const r = makeResolver(TREE);
  assert.equal(r.nodeOf(P('1', { categoryId: 'dry' })).id, 'dry');
  assert.equal(r.nodeOf(P('2', { category: 'food' })).id, 'food');           // legacy → main category with that slug
  assert.equal(r.nodeOf(P('3', { category: 'Toys' })).id, 'toys');           // case-insensitive
  assert.equal(r.nodeOf(P('4', { category: 'dry-food' })).id, 'dry');        // legacy value that is now a subcategory
  assert.equal(r.nodeOf(P('5', { category: 'mystery' })), null);
  assert.equal(r.nodeOf(P('6', { categoryId: 'deleted', category: 'toys' })).id, 'toys'); // dangling id falls back
  assert.deepEqual(r.pathIds(P('1', { categoryId: 'dry' })), ['food', 'cat', 'dry']);
  assert.ok(r.inNode(P('1', { categoryId: 'dry' }), 'food'));                // a product shows under every ancestor
  assert.ok(!r.inNode(P('1', { categoryId: 'dry' }), 'dog'));
  assert.equal(r.label(P('1', { categoryId: 'dry' })), 'Food › Cat food › Dry food');
  assert.equal(r.nodeBySlug('cat-food').id, 'cat');
});

test('product counts include subcategories', () => {
  const counts = countProducts(TREE, [P('1', { categoryId: 'dry' }), P('2', { categoryId: 'wet' }), P('3', { category: 'food' }), P('4', { categoryId: 'toys' }), P('5', { category: 'nope' })]);
  assert.equal(counts.get('dry'), 1);
  assert.equal(counts.get('cat'), 2);
  assert.equal(counts.get('food'), 3);
  assert.equal(counts.get('dog'), 0);
  assert.equal(counts.get('toys'), 1);
});

test('moving a branch rewrites only the products inside it, and only what changed', () => {
  const products = [
    P('p1', { ...productFields('dry', TREE) }),
    P('p2', { ...productFields('dog', TREE) }),
    P('p3', { category: 'food' }),                     // legacy product on the main category: outside the moved branch
    P('p4', { ...productFields('toys', TREE) }),
  ];
  // "Cat food" (with Dry/Wet) moves from Food to Toys: p1 changes root; p2/p3/p4 are untouched
  const u = reRootUpdates('cat', 'toys', TREE, products);
  assert.deepEqual(u.map((x) => x.id), ['p1']);
  assert.deepEqual(u[0].fields, { category: 'toys', categoryId: 'dry', categoryPath: ['toys', 'cat', 'dry'], categorySlugs: ['toys', 'cat-food', 'dry-food'] });
  // moving within the same root changes the path but not the main category
  const inside = reRootUpdates('dry', 'dog', TREE, products);
  assert.equal(inside[0].fields.category, 'food');
  assert.deepEqual(inside[0].fields.categoryPath, ['food', 'dog', 'dry']);
  // a legacy product whose plain category IS the moved main category gets the full fields
  const legacy = reRootUpdates('toys', 'food', TREE, [P('x', { category: 'toys' })]);
  assert.deepEqual(legacy[0].fields.categoryPath, ['food', 'toys']);
  assert.equal(legacy[0].fields.category, 'food');
  // nothing to do when nothing changes
  assert.deepEqual(reRootUpdates('toys', '', TREE, [P('y', { ...productFields('toys', TREE) })]), []);
});

test('creating main categories from the old plain values', () => {
  const products = [P('1', { category: 'food' }), P('2', { category: 'smart-gear' }), P('3', { category: 'Food' }), P('4', { category: 'toys' }), P('5', { categoryId: 'dry', category: 'food' }), P('6', {})];
  const seeds = seedFromProducts(products, TREE, ['medicine', 'toys', 'food']);
  assert.deepEqual(seeds.map((s) => s.slug), ['smart-gear', 'medicine']);   // existing ones skipped; products with a categoryId ignored
  assert.deepEqual(seeds.map((s) => s.name), ['Smart gear', 'Medicine']);
  assert.ok(seeds.every((s) => s.parentId === '' && s.active === true));
  assert.ok(seeds[0].order > 20 && seeds[1].order > seeds[0].order);        // after the existing main categories
  assert.deepEqual(seedFromProducts([], [], []), []);
});

test('reordering among siblings renumbers and only reports what changed', () => {
  assert.deepEqual(moveWithinSiblings(TREE, 'dog', -1), [{ id: 'dog', order: 10 }, { id: 'cat', order: 20 }]);
  assert.deepEqual(moveWithinSiblings(TREE, 'cat', 1), [{ id: 'dog', order: 10 }, { id: 'cat', order: 20 }]);
  assert.deepEqual(moveWithinSiblings(TREE, 'cat', -1), []);       // already first
  assert.deepEqual(moveWithinSiblings(TREE, 'dog', 1), []);        // already last
  assert.deepEqual(moveWithinSiblings(TREE, 'ghost', 1), []);
  const tied = [c('a', 'A', '', { order: 0 }), c('b', 'B', '', { order: 0 }), c('z', 'Z', '', { order: 0 })];
  const fix = moveWithinSiblings(tied, 'z', -1);                    // equal orders are normalised to 10, 20, 30
  assert.deepEqual(fix.map((u) => u.id).sort(), ['a', 'b', 'z']);
  assert.equal(nextOrder(TREE, 'food'), 30);
  assert.equal(nextOrder(TREE, 'dry'), 10);
  assert.equal(nextOrder([], ''), 10);
});

test('the cascading picker shows one list per level of the choice', () => {
  assert.deepEqual(pickerLevels('', TREE).map((l) => l.options.map((o) => o.id)), [['food', 'toys']]);
  const lv = pickerLevels('dry', TREE);
  assert.deepEqual(lv.map((l) => l.value), ['food', 'cat', 'dry']);
  assert.deepEqual(lv[1].options.map((o) => o.id), ['cat', 'dog']);
  assert.deepEqual(lv[2].options.map((o) => o.id), ['dry', 'wet']);
  assert.equal(pickerLevels('toys', TREE).length, 1);                // no children → no extra list
  assert.equal(pickerLevels('food', TREE).length, 2);                // children exist → offer them, unselected
  assert.equal(pickerLevels('food', TREE)[1].value, '');
  const hidden = [...TREE, c('old', 'Old stuff', 'food', { active: false })];
  assert.ok(!pickerLevels('food', hidden)[1].options.some((o) => o.id === 'old'));     // inactive not offered…
  assert.ok(pickerLevels('old', hidden)[1].options.some((o) => o.id === 'old'));       // …unless it is the current choice
});

test('documents from Firestore are cleaned up', () => {
  const n = normCategory('x', { name: '  Dry food ', parentId: null, order: 'abc', active: false });
  assert.deepEqual(n, { id: 'x', name: 'Dry food', slug: 'dry-food', parentId: '', order: 0, active: false, description: '' });
  assert.equal(normCategory('y', {}).active, true);
});
