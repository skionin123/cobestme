/**
 * Warhead's "showInResults" variant visibility concept, adapted for CoBest.
 * Missing flag means visible to keep older product data backward compatible.
 * Visibility is not a checkout permission; option-specific checkout remains
 * blocked until its database stock and pricing operations are complete.
 */
export const visibleVariants = product =>
  (Array.isArray(product?.variants)?product.variants:[]).filter(variant=>variant?.showInResults!==false)
