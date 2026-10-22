// Cost of goods with per-variant cost prices (pure). Run: node --test tests/unit/pricing.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { orderLineCost, unitCost, variantLabelOf } from '../../web/src/lib/pricing.js';

const product = { id: 'p', cost: 500, variantOptions: [{ label: '2 kg', cost: 800 }, { label: '4 kg', cost: null }, { label: 'Trial', cost: 0 }] };

test('the variant label is read from an order line the same way the order function does', () => {
  assert.equal(variantLabelOf({ variantLabel: '2 kg', variant: '2 kg · 3 packs' }), '2 kg');
  assert.equal(variantLabelOf({ variant: '4 kg · 3 packs · Auto-refill' }), '4 kg');
  assert.equal(variantLabelOf({}), '');
});

test('a variant with its own cost uses it; others fall back to the product cost', () => {
  assert.equal(unitCost(product, '2 kg'), 800);
  assert.equal(unitCost(product, '4 kg'), 500);       // no cost set on the variant
  assert.equal(unitCost(product, 'Trial'), 0);        // an explicit zero is respected
  assert.equal(unitCost(product, 'Unknown'), 500);
  assert.equal(unitCost(product, ''), 500);
  assert.equal(unitCost(undefined, '2 kg'), 0);
  assert.equal(unitCost({ cost: 'x' }, ''), 0);
});

test('an online line costs unit cost x quantity x packs', () => {
  assert.equal(orderLineCost(product, { qty: 2, variant: '2 kg' }), 1600);
  assert.equal(orderLineCost(product, { qty: 2, variantLabel: '2 kg', variant: '2 kg · 3 packs', coursePacks: 3 }), 4800);
  assert.equal(orderLineCost(product, { qty: 1, variant: 'Auto-refill' }), 500);
  assert.equal(orderLineCost(undefined, { qty: 3 }), 0);
});
