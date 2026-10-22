// Cost of goods for a sold line, aware of per-variant cost prices. Pure (no React, no Firebase).

/** The variant label of an order line: "2 kg · 3 packs · Auto-refill" → "2 kg" (same rule the order function uses). */
export const variantLabelOf = (item = {}) => String(item.variantLabel || item.variant || '').split(' · ')[0].trim();

/** Cost of one unit: the variant's own cost when it has one, otherwise the product's cost. */
export function unitCost(product, label = '') {
  if (!product) return 0;
  const vo = label ? (product.variantOptions || []).find((v) => v.label === label) : null;
  if (vo && vo.cost != null && Number(vo.cost) >= 0) return Number(vo.cost);
  return Number(product.cost) || 0;
}

/** Cost of an online order line: unit cost x quantity x packs (a "3 packs" course is three units per quantity). */
export const orderLineCost = (product, item) => unitCost(product, variantLabelOf(item)) * (Number(item.qty) || 0) * (Number(item.coursePacks) || 1);
