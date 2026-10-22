// Product form rules (pure, no browser). Run: node --test tests/unit/product-form.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BLANK_PRODUCT, MAX_PHOTOS, buildProductData, cleanPhotoUrl, formFromProduct, newProductId, photosFromProduct,
  suggestSku, validGtin, validateProduct, variantsFromCsv, variantsToCsv,
} from '../../web/src/admin/productForm.js';

const ok = (over = {}) => ({ ...BLANK_PRODUCT, name: 'Royal Canin Gastro', category: 'food', price: '3450', stockCount: 10, photos: ['https://x.test/a.jpg'], ...over });
const fields = (r, kind = 'errors') => r[kind].map((e) => e.field);

test('new ids look like p_<ms> and never reuse an existing one', () => {
  assert.equal(newProductId([], 1000), 'p_1000');
  assert.equal(newProductId(['p_1000'], 1000), 'p_1001');
  assert.equal(newProductId(['p_1000', 'p_1001', 'p_1002'], 1000), 'p_1003');
  assert.equal(newProductId(['royal-canin'], 5), 'p_5');
});

test('suggested SKUs come from the brand or name and are unique', () => {
  assert.equal(suggestSku({ brand: 'Royal Canin' }, [], () => 0), 'RC-1000');
  assert.equal(suggestSku({ brand: 'Zoetis' }, [], () => 0.5), 'ZO-5500');
  assert.equal(suggestSku({ name: 'Maya Calming Chew' }, [], () => 0), 'MC-1000');
  assert.equal(suggestSku({}, [], () => 0), 'PM-1000');
  const seq = [0, 0, 0.1]; let i = 0;
  assert.equal(suggestSku({ brand: 'Royal Canin' }, ['rc-1000'], () => seq[i++]), 'RC-1900'); // first try taken (case-insensitive)
});

test('GTIN check digits', () => {
  assert.ok(validGtin('4006381333931'));
  assert.ok(validGtin('4006 3813 3393 1'));
  assert.ok(!validGtin('4006381333932'));
  assert.ok(!validGtin('12345'));
  assert.ok(!validGtin(''));
});

test('photo links: https only', () => {
  assert.equal(cleanPhotoUrl(' https://cdn.test/p.jpg '), 'https://cdn.test/p.jpg');
  for (const bad of ['http://cdn.test/p.jpg', 'javascript:alert(1)', 'data:image/png;base64,AAAA', '//cdn.test/p.jpg', 'not a url', '']) assert.equal(cleanPhotoUrl(bad), '', bad);
});

test('a stored product yields its photos cover-first with no repeats', () => {
  assert.deepEqual(photosFromProduct({ image: 'A', imageUrl: 'A', images: ['B', 'C'], imageGallery: ['A', 'B', 'C', 'D'] }), ['A', 'B', 'C', 'D']);
  assert.deepEqual(photosFromProduct({ imageUrl: 'A' }), ['A']);
  assert.deepEqual(photosFromProduct({}), []);
  assert.equal(photosFromProduct({ images: Array.from({ length: 20 }, (_, i) => `u${i}`) }).length, MAX_PHOTOS);
});

test('photos are saved in every shape the apps read, without duplicating the cover', () => {
  const d = buildProductData(ok({ photos: ['A', 'B', 'C', 'B'] }));
  assert.equal(d.image, 'A');
  assert.equal(d.imageUrl, 'A');
  assert.deepEqual(d.images, ['B', 'C']);        // storefront shows [image, ...images]
  assert.deepEqual(d.imageGallery, ['A', 'B', 'C']); // mobile app
  const none = buildProductData(ok({ photos: [] }));
  assert.deepEqual([none.image, none.images, none.imageGallery], ['', [], []]);
});

test('the saved document is clean and typed', () => {
  const d = buildProductData(ok({ name: '  Gastro  ', price: '3450.5', compareAt: '', cost: '1200', stockCount: '10.9', sku: ' rc-1 ', barcode: '4006 3813 3393 1', brand: 'Royal Canin', supplier: '', expiresInDays: '' }), { isNew: true, now: 99 });
  assert.equal(d.name, 'Gastro');
  assert.equal(d.price, 3450.5);
  assert.equal(d.compareAt, null);
  assert.equal(d.stockCount, 10);
  assert.equal(d.inStock, true);
  assert.equal(d.sku, 'rc-1');
  assert.equal(d.barcode, '4006381333931');
  assert.equal(d.supplier, 'Royal Canin'); // defaults to the brand
  assert.equal(d.expiresInDays, null);
  assert.equal(d.createdAt, 99);
  assert.equal(buildProductData(ok({ stockCount: 0 })).inStock, false);
  assert.equal(buildProductData(ok()).createdAt, undefined); // edits don't reset it
});

test('variants: blank labels are dropped, numbers typed, labels mirrored into variants[]', () => {
  const d = buildProductData(ok({ variantOptions: [{ label: ' Small ', sku: 'S', price: '100', stockCount: '5' }, { label: '', price: '9' }, { label: 'Large', sku: '', price: '', stockCount: '' }] }));
  assert.deepEqual(d.variants, ['Small', 'Large']);
  assert.deepEqual(d.variantOptions[0], { label: 'Small', sku: 'S', price: 100, compareAt: null, cost: null, stockCount: 5 });
  assert.deepEqual(d.variantOptions[1], { label: 'Large', sku: '', price: null, compareAt: null, cost: null, stockCount: null });
});

test('editing round-trips: form → data → form keeps photos and variants', () => {
  const stored = { id: 'p_1', ...buildProductData(ok({ photos: ['A', 'B'], variantOptions: [{ label: 'S', sku: '', price: '10', stockCount: '3' }] })) };
  const form = formFromProduct(stored);
  assert.deepEqual(form.photos, ['A', 'B']);
  assert.equal(form.variantOptions[0].label, 'S');
  assert.deepEqual(buildProductData(form).imageGallery, ['A', 'B']);
});

test('a complete product passes with no errors', () => {
  const r = validateProduct(ok(), []);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
});

test('required things are enforced', () => {
  const r = validateProduct(ok({ name: '  ', price: '0', category: '', stockCount: -1, reorderPoint: 1.5, stockTarget: 'x' }), []);
  for (const f of ['name', 'price', 'category', 'stockCount', 'reorderPoint', 'stockTarget']) assert.ok(fields(r).includes(f), f);
});

test('duplicate SKU or barcode is an error, but a product does not clash with itself', () => {
  const others = [{ id: 'a', sku: 'RC-1', barcode: '4006381333931' }];
  assert.ok(fields(validateProduct(ok({ sku: 'rc-1' }), others)).includes('sku'));
  assert.ok(fields(validateProduct(ok({ barcode: '4006381333931' }), others)).includes('barcode'));
  assert.deepEqual(fields(validateProduct(ok({ sku: 'rc-1', barcode: '4006381333931' }), others, { editingId: 'a' })), []);
});

test('worth-a-look warnings do not block saving', () => {
  const r = validateProduct(ok({ compareAt: '3000', cost: '5000', barcode: '12345', stockTarget: 5, reorderPoint: 20, photos: [] }), []);
  assert.deepEqual(r.errors, []);
  for (const f of ['compareAt', 'cost', 'barcode', 'stockTarget', 'photos']) assert.ok(fields(r, 'warnings').includes(f), f);
});

test('variants: duplicate labels, orphan values and bad numbers are caught', () => {
  const r = validateProduct(ok({ variantOptions: [
    { label: 'Small', price: '100', stockCount: '5' }, { label: 'small', price: '', stockCount: '' },
    { label: '', price: '50', stockCount: '' }, { label: 'Big', price: '-1', stockCount: '' }, { label: 'Huge', price: '', stockCount: '2.5' },
  ] }), []);
  assert.equal(r.errors.filter((e) => e.field.startsWith('variant-')).length, 4);
});

test('uploads in progress block saving', () => {
  assert.ok(fields(validateProduct(ok(), [], { uploading: true })).includes('photos'));
});

// ── Category tree ──────────────────────────────────────────────────────────
const TREE = [
  { id: 'food', name: 'Food', slug: 'food', parentId: '', order: 10, active: true },
  { id: 'cat', name: 'Cat food', slug: 'cat-food', parentId: 'food', order: 10, active: true },
  { id: 'dry', name: 'Dry food', slug: 'dry-food', parentId: 'cat', order: 10, active: true },
];

test('picking a subcategory saves the main category plus the whole path', () => {
  const d = buildProductData(ok({ category: 'whatever', categoryId: 'dry' }), { categories: TREE });
  assert.equal(d.category, 'food');
  assert.equal(d.categoryId, 'dry');
  assert.deepEqual(d.categoryPath, ['food', 'cat', 'dry']);
  assert.deepEqual(d.categorySlugs, ['food', 'cat-food', 'dry-food']);
});

test('without a tree (or a pick) the typed category is saved as before and no path fields are written', () => {
  for (const d of [buildProductData(ok({ category: ' Toys ' })), buildProductData(ok({ category: ' Toys ', categoryId: '' }), { categories: TREE })]) {
    assert.equal(d.category, 'toys');
    assert.ok(!('categoryId' in d) && !('categoryPath' in d));
  }
});

test('editing an old product finds its place in the tree from the plain category', () => {
  assert.equal(formFromProduct({ id: 'p', name: 'x', category: 'food' }, TREE).categoryId, 'food');
  assert.equal(formFromProduct({ id: 'p', name: 'x', category: 'food', categoryId: 'dry' }, TREE).categoryId, 'dry');
  assert.equal(formFromProduct({ id: 'p', name: 'x', category: 'mystery' }, TREE).categoryId, '');
  assert.equal(formFromProduct({ id: 'p', name: 'x', category: 'food' }).categoryId, '');
});

test('with a tree, new products must pick a category; existing ones only get a nudge', () => {
  assert.ok(fields(validateProduct(ok({ categoryId: '' }), [], { categories: TREE })).includes('category'));
  assert.ok(fields(validateProduct(ok({ categoryId: 'ghost' }), [], { categories: TREE })).includes('category'));
  assert.ok(!fields(validateProduct(ok({ categoryId: 'dry' }), [], { categories: TREE })).includes('category'));
  const edit = validateProduct(ok({ categoryId: '', category: 'mystery' }), [], { categories: TREE, editingId: 'p1' });
  assert.ok(!fields(edit).includes('category'));
  assert.ok(fields(edit, 'warnings').includes('category'));
  assert.ok(!fields(validateProduct(ok({ category: 'anything' }), [])).includes('category')); // no tree yet: free text
});

// ── Variant prices ─────────────────────────────────────────────────────────
test('each variant can carry its own sale, regular and cost price', () => {
  const d = buildProductData(ok({ variantOptions: [
    { label: ' 2 kg ', sku: 'A', price: '1020', compareAt: '1200', cost: '800', stockCount: '30' },
    { label: '4 kg', sku: '', price: '', compareAt: '', cost: '', stockCount: '' },
  ] }));
  assert.deepEqual(d.variantOptions[0], { label: '2 kg', sku: 'A', price: 1020, compareAt: 1200, cost: 800, stockCount: 30 });
  assert.deepEqual(d.variantOptions[1], { label: '4 kg', sku: '', price: null, compareAt: null, cost: null, stockCount: null });
});

test('editing loads the variant prices back into the form', () => {
  const f = formFromProduct({ id: 'p', name: 'x', variantOptions: [{ label: '2 kg', sku: '', price: 1020, compareAt: 1200, cost: 800, stockCount: 30 }, { label: '4 kg', price: 2000, compareAt: null, cost: null, stockCount: null }] });
  assert.deepEqual(f.variantOptions.map((v) => [v.price, v.compareAt, v.cost]), [[1020, 1200, 800], [2000, '', '']]);
});

test('variant price validation: no negatives; odd combinations are only warnings', () => {
  const bad = validateProduct(ok({ variantOptions: [{ label: 'A', price: '10', compareAt: '-5', cost: '', stockCount: '' }, { label: 'B', price: '10', compareAt: '', cost: '-1', stockCount: '' }] }), []);
  assert.equal(bad.errors.filter((e) => e.field.startsWith('variant-')).length, 2);
  const odd = validateProduct(ok({ variantOptions: [{ label: 'A', price: '100', compareAt: '90', cost: '150', stockCount: '' }] }), []);
  assert.deepEqual(odd.errors, []);
  assert.equal(odd.warnings.filter((w) => w.field === 'variant-0').length, 2);
  // old-style rows without the new fields are fine, and a blank row with only a cost is flagged
  assert.deepEqual(validateProduct(ok({ variantOptions: [{ label: 'A', price: '', stockCount: '' }] }), []).errors, []);
  assert.equal(validateProduct(ok({ variantOptions: [{ label: '', cost: '5' }] }), []).errors.length, 1);
});

test('CSV variants carry sale, stock, regular and cost price, and old files still import', () => {
  assert.deepEqual(variantsFromCsv('2 kg:1020:30:1200:800|4 kg:2000:10'), [
    { label: '2 kg', sku: '', price: 1020, compareAt: 1200, cost: 800, stockCount: 30 },
    { label: '4 kg', sku: '', price: 2000, compareAt: null, cost: null, stockCount: 10 },
  ]);
  assert.deepEqual(variantsFromCsv('Small|Large').map((v) => [v.label, v.price, v.cost]), [['Small', null, null], ['Large', null, null]]);
  assert.deepEqual(variantsFromCsv('A::: :|:5'), [{ label: 'A', sku: '', price: null, compareAt: null, cost: null, stockCount: null }]);
  assert.deepEqual(variantsFromCsv('A:x:-3:0:abc')[0], { label: 'A', sku: '', price: null, compareAt: null, cost: null, stockCount: null });
  assert.deepEqual(variantsFromCsv(''), []);
  const p = { price: 500, stockCount: 7, variantOptions: [{ label: '2 kg', price: 1020, stockCount: 30, compareAt: 1200, cost: 800 }, { label: '4 kg', price: null, stockCount: null, compareAt: null, cost: null }] };
  assert.equal(variantsToCsv(p), '2 kg:1020:30:1200:800|4 kg:500:7');
  assert.deepEqual(variantsFromCsv(variantsToCsv(p)).map((v) => [v.label, v.price, v.compareAt, v.cost, v.stockCount]), [['2 kg', 1020, 1200, 800, 30], ['4 kg', 500, null, null, 7]]);
  assert.equal(variantsToCsv({ variants: ['S', 'M'] }), 'S|M');
});
