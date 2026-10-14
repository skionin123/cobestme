export function calculateCheckout(snapshot, body, now=Date.now()) {
  const catalog = Array.isArray(snapshot?.products) ? snapshot.products : []
  const rawRequested = Array.isArray(body?.items) ? body.items : []
  const items = []
  const inventoryIssues = []
  const variantIssues = []
  const quantityIssues = []
  // Consolidate duplicate line items before validating inventory. Otherwise
  // two requests for the same SKU could each pass an independent stock check.
  const grouped = new Map()
  for (const row of rawRequested) {
    const productId = row?.product_id
    if (productId == null || String(productId).trim() === '') continue
    const raw = Number(row?.quantity)
    const quantity = Number.isFinite(raw) ? Math.max(1, Math.min(99, Math.floor(raw))) : 1
    const key = String(productId)
    const previous = grouped.get(key)
    const combined = (previous?.quantity || 0) + quantity
    grouped.set(key, {product_id:productId, quantity:combined})
    if (combined > 99 && !quantityIssues.some(issue => String(issue.product_id) === key)) {
      quantityIssues.push({product_id:productId,requested:combined,maximum:99})
    }
  }
  const requested = Array.from(grouped.values())

  for (const row of requested) {
    const product = catalog.find(p => String(p.id) === String(row?.product_id) && p.status === 'Active')
    if (!product) continue
    // Never charge the parent product price for a customer-selected option we
    // cannot record or reserve correctly in the current checkout RPC.
    if (Array.isArray(product.variants) && product.variants.length) {
      variantIssues.push({product_id:product.id,name:product.name})
      continue
    }

    const requestedQuantity = row.quantity

    const rawInventory = product.inventory
    const inventoryNumber = rawInventory == null || rawInventory === '' ? null : Number(rawInventory)
    const inventory = inventoryNumber == null
      ? null
      : Number.isFinite(inventoryNumber) ? Math.max(0, Math.floor(inventoryNumber)) : 0

    if (inventory != null && requestedQuantity > inventory) {
      inventoryIssues.push({
        product_id: product.id,
        name: product.name,
        requested: requestedQuantity,
        available: inventory
      })
      continue
    }

    const price = Number(product.price)
    if (!Number.isFinite(price) || price < 0) continue

    items.push({
      product_id: product.id,
      name: product.name,
      quantity: requestedQuantity,
      unit_price: price,
      line_total: price * requestedQuantity
    })
  }

  const subtotal = items.reduce((sum,x)=>sum+x.line_total,0)
  let discountAmount = 0
  let discountCode = ''
  const requestedCode = String(body?.discount_code || '').trim().toUpperCase()

  if (requestedCode) {
    const discounts = Array.isArray(snapshot?.discounts) ? snapshot.discounts : []
    const d = discounts.find(x => x.active && String(x.code).toUpperCase() === requestedCode)
    const expiry = d?.expires_at ? new Date(d.expires_at).getTime() : null
    const notExpired = !expiry || (Number.isFinite(expiry) && expiry > now)
    const usageLimit = Number(d?.usage_limit)
    const usedCount = Number(d?.used_count || 0)
    const underLimit = !d?.usage_limit || (Number.isFinite(usageLimit) && Number.isFinite(usedCount) && usedCount < usageLimit)
    const minSpend = Number(d?.min_spend || 0)
    const meetsMinimum = Number.isFinite(minSpend) && subtotal >= Math.max(0,minSpend)
    const value = Number(d?.value)

    if (d && notExpired && underLimit && meetsMinimum && Number.isFinite(value) && value > 0) {
      discountCode = requestedCode
      discountAmount = d.kind === 'fixed'
        ? Math.min(subtotal, value)
        : subtotal * Math.min(100, Math.max(0, value)) / 100
    }
  }

  const settings = snapshot?.settings || {}
  const shippingRaw = Number(settings.shippingFlat || 0)
  const taxRaw = Number(settings.taxRate || 0)
  const shippingAmount = subtotal > 0 && Number.isFinite(shippingRaw) ? Math.max(0, shippingRaw) : 0
  const taxableBase = Math.max(0, subtotal - discountAmount)
  const taxRate = Number.isFinite(taxRaw) ? Math.max(0, Math.min(100, taxRaw)) : 0
  const taxAmount = taxableBase * taxRate / 100
  const total = Math.max(0, taxableBase + shippingAmount + taxAmount)

  return { items, subtotal, discountCode, discountAmount, shippingAmount, taxAmount, total, inventoryIssues, variantIssues, quantityIssues }
}
