// Product form rules shared by "Add product" and the Inventory edit panel: defaults, ids, the saved shape,
// and validation. Pure (no React, no Firebase) so it can be unit-tested.

export const MAX_PHOTOS = 8;
export const MAX_NAME = 150;

export const CATEGORIES = [
  'medicine', 'preventives', 'vaccines', 'food', 'supplements', 'grooming', 'toys', 'accessories', 'travel',
  'smart-gear', 'skin', 'joint', 'antiparasitics', 'calming',
];
export const UNITS = ['pc', 'box', 'strip', 'bottle', 'vial', 'pack', 'kg', 'g', 'ml', 'l'];

export const BLANK_PRODUCT = Object.freeze({
  id: '', name: '', brand: '', category: 'food', pet: 'both', sku: '', barcode: '', cost: '', unit: 'pc', supplier: '',
  price: '', compareAt: '', stockCount: 0, reorderPoint: 20, stockTarget: 100, expiresInDays: '',
  isRx: false, coldChain: false, showOnStorefront: true, autoRefill: false,
  photos: [], shortDescription: '', description: '', ingredients: '', variantOptions: [],
});

const num = (v) => (v === '' || v == null ? NaN : Number(v));
const isInt = (n) => Number.isInteger(n);
const norm = (s) => String(s ?? '').trim().toLowerCase();

/** Store ids look like p_<milliseconds>; never one that already exists (saving onto an existing id would overwrite it). */
export function newProductId(existingIds = [], now = Date.now()) {
  const taken = new Set(existingIds);
  let n = now;
  while (taken.has(`p_${n}`)) n += 1;
  return `p_${n}`;
}

/** A starting SKU such as "RC-4821" from the brand (or name) initials; unique among the SKUs given. */
export function suggestSku({ brand = '', name = '' } = {}, existingSkus = [], rand = Math.random) {
  const letters = (String(brand).trim() || String(name).trim()).replace(/[^A-Za-z]+/g, ' ').trim().split(' ').filter(Boolean);
  const prefix = ((letters.length > 1 ? letters.slice(0, 2).map((w) => w[0]).join('') : (letters[0] || 'PM').slice(0, 2)).toUpperCase() || 'PM').padEnd(2, 'X');
  const taken = new Set(existingSkus.map(norm));
  for (let i = 0; i < 50; i++) {
    const sku = `${prefix}-${1000 + Math.floor(rand() * 9000)}`;
    if (!taken.has(norm(sku))) return sku;
  }
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}

/** GTIN-8/12/13/14 with a correct check digit. */
export function validGtin(v) {
  const s = String(v ?? '').replace(/\D+/g, '');
  if (![8, 12, 13, 14].includes(s.length)) return false;
  const d = s.split('').map(Number);
  const check = d.pop();
  const sum = d.reverse().reduce((a, x, i) => a + x * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/** https URL (≤ 500 chars) or ''. Used for photos added by link. */
export function cleanPhotoUrl(v) {
  const s = String(v ?? '').trim().slice(0, 500);
  try { return new URL(s).protocol === 'https:' ? new URL(s).href : ''; } catch { return ''; }
}

/** All photos of a stored product, cover first, without repeats: image, then images, then the app's imageGallery. */
export function photosFromProduct(p = {}) {
  const all = [p.image, p.imageUrl, ...(Array.isArray(p.images) ? p.images : []), ...(Array.isArray(p.imageGallery) ? p.imageGallery : [])]
    .map((u) => String(u || '').trim()).filter(Boolean);
  return [...new Set(all)].slice(0, MAX_PHOTOS);
}

/** Stored product → the editable form. */
export function formFromProduct(p) {
  const variants = Array.isArray(p.variantOptions) && p.variantOptions.length
    ? p.variantOptions.map((vo) => ({ label: vo.label || '', sku: vo.sku || '', price: vo.price ?? '', stockCount: vo.stockCount ?? '' }))
    : (p.variants || []).map((v) => ({ label: String(v), sku: '', price: '', stockCount: '' }));
  return {
    ...BLANK_PRODUCT,
    ...p,
    compareAt: p.compareAt || '',
    cost: p.cost || '',
    expiresInDays: p.expiresInDays ?? '',
    photos: photosFromProduct(p),
    variantOptions: variants,
  };
}

/**
 * The document written to Firestore. Photos are saved in every shape the apps read:
 *   image / imageUrl = cover · images = the other photos (the storefront shows [image, ...images])
 *   imageGallery = all photos, cover first (the mobile app).
 */
export function buildProductData(form, { isNew = false, now = Date.now() } = {}) {
  const photos = [...new Set((form.photos || []).filter(Boolean))].slice(0, MAX_PHOTOS);
  const cover = photos[0] || '';
  const variants = (form.variantOptions || [])
    .filter((vo) => String(vo.label || '').trim())
    .map((vo) => ({
      label: String(vo.label).trim(),
      sku: String(vo.sku || '').trim(),
      price: vo.price !== '' && vo.price != null ? Number(vo.price) : null,
      stockCount: vo.stockCount !== '' && vo.stockCount != null ? Number(vo.stockCount) : null,
    }));
  const stock = Math.max(0, Math.floor(Number(form.stockCount) || 0));
  const expires = num(form.expiresInDays);
  return {
    name: String(form.name).trim().slice(0, MAX_NAME),
    brand: String(form.brand || '').trim(),
    category: norm(form.category) || 'supplies',
    pet: form.pet || 'both',
    sku: String(form.sku || '').trim(),
    barcode: String(form.barcode || '').replace(/\s+/g, ''),
    price: Number(form.price) || 0,
    compareAt: Number(form.compareAt) > 0 ? Number(form.compareAt) : null,
    cost: Number(form.cost) || 0,
    unit: form.unit || 'pc',
    supplier: String(form.supplier || '').trim() || String(form.brand || '').trim(),
    stockCount: stock,
    reorderPoint: Math.max(0, Math.floor(Number(form.reorderPoint) || 0)),
    stockTarget: Math.max(0, Math.floor(Number(form.stockTarget) || 0)),
    inStock: stock > 0,
    ...(Number.isFinite(expires) && expires >= 0 ? { expiresInDays: Math.floor(expires) } : { expiresInDays: null }),
    isRx: !!form.isRx,
    coldChain: !!form.coldChain,
    showOnStorefront: !!form.showOnStorefront,
    autoRefill: !!form.autoRefill,
    subscribe: !!form.autoRefill,
    image: cover,
    imageUrl: cover,
    images: photos.slice(1),
    imageGallery: photos,
    shortDescription: String(form.shortDescription || '').trim(),
    description: String(form.description || '').trim() || String(form.shortDescription || '').trim(),
    ingredients: String(form.ingredients || '').trim(),
    variants: variants.map((v) => v.label),
    variantOptions: variants,
    ...(isNew ? { rating: 4.8, ratingCount: 0, createdAt: now } : {}),
  };
}

/**
 * Problems that must be fixed (errors) and things worth a second look (warnings).
 * `products` = the existing catalogue; `editingId` = the product being edited (so it doesn't clash with itself).
 */
export function validateProduct(form, products = [], { editingId = '', uploading = false } = {}) {
  const errors = [];
  const warnings = [];
  const err = (field, message) => errors.push({ field, message });
  const warn = (field, message) => warnings.push({ field, message });
  const others = products.filter((p) => p.id !== editingId);

  if (!String(form.name || '').trim()) err('name', 'Give the product a name.');
  if (String(form.name || '').length > MAX_NAME) err('name', `Keep the name under ${MAX_NAME} characters.`);
  if (!norm(form.category)) err('category', 'Choose or type a category.');

  const price = num(form.price);
  if (!(price > 0)) err('price', 'Enter a sale price above 0.');
  const compareAt = num(form.compareAt);
  if (Number.isFinite(compareAt) && compareAt > 0 && price > 0 && compareAt <= price) warn('compareAt', 'The regular price is not higher than the sale price, so no discount will show.');
  const cost = num(form.cost);
  if (Number.isFinite(cost) && cost < 0) err('cost', 'Cost cannot be negative.');
  if (Number.isFinite(cost) && price > 0 && cost > price) warn('cost', 'Cost is higher than the sale price: you would sell at a loss.');

  const stock = num(form.stockCount);
  if (!isInt(stock) || stock < 0) err('stockCount', 'Stock must be a whole number, 0 or more.');
  const reorder = num(form.reorderPoint);
  if (!isInt(reorder) || reorder < 0) err('reorderPoint', 'Reorder point must be a whole number, 0 or more.');
  const target = num(form.stockTarget);
  if (!isInt(target) || target < 0) err('stockTarget', 'Target stock must be a whole number, 0 or more.');
  else if (isInt(reorder) && target < reorder) warn('stockTarget', 'Target stock is below the reorder point, so reorder suggestions will look odd.');
  const exp = num(form.expiresInDays);
  if (String(form.expiresInDays ?? '') !== '' && (!isInt(exp) || exp < 0)) err('expiresInDays', 'Shelf life must be a whole number of days.');

  const sku = norm(form.sku);
  if (sku && others.some((p) => norm(p.sku) === sku)) err('sku', `SKU “${String(form.sku).trim()}” is already used by another product.`);
  const barcode = String(form.barcode || '').replace(/\s+/g, '');
  if (barcode) {
    if (others.some((p) => String(p.barcode || '').replace(/\s+/g, '') === barcode)) err('barcode', 'That barcode is already used by another product.');
    else if (!validGtin(barcode)) warn('barcode', 'This does not look like a valid EAN/UPC barcode. Fine for an in-house code, but Google and Meta ignore it.');
  }

  const seen = new Set();
  (form.variantOptions || []).forEach((vo, i) => {
    const label = norm(vo.label);
    if (!label) { if (vo.price !== '' || vo.stockCount !== '' || String(vo.sku || '').trim()) err(`variant-${i}`, `Variant ${i + 1} has a price, SKU or stock but no label.`); return; }
    if (seen.has(label)) err(`variant-${i}`, `Variant “${String(vo.label).trim()}” is listed twice.`);
    seen.add(label);
    if (vo.price !== '' && vo.price != null && !(Number(vo.price) >= 0)) err(`variant-${i}`, `Variant “${vo.label}” has an invalid price.`);
    if (vo.stockCount !== '' && vo.stockCount != null && !(isInt(Number(vo.stockCount)) && Number(vo.stockCount) >= 0)) err(`variant-${i}`, `Variant “${vo.label}” needs a whole-number stock.`);
  });

  if (uploading) err('photos', 'Wait for the photos to finish uploading.');
  else if (!(form.photos || []).length) warn('photos', 'No photo yet. Products without a photo are skipped by the Google and Meta product feeds.');

  return { errors, warnings };
}
