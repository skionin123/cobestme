/**
 * Conservative, merchant-reviewed product import planner.
 * It deliberately does not write to the database. Apply changes only after a
 * complete preview has been checked and confirmed by the merchant.
 */
const HEADER_ALIASES = {
  sku: ['sku', 'product sku', 'item sku', 'supplier sku', 'item no', 'item number', 'item_no'],
  name: ['name', 'title', 'product name', 'product title'],
  description: ['description', 'product description'],
  price: ['price', 'selling price', 'retail price', 'sale price'],
  compare_at_price: ['compare at price', 'compare_at_price', 'compare price', 'original price'],
  inventory: ['inventory', 'quantity', 'qty', 'stock', 'stock quantity', 'available quantity', 'available stock', 'inventory quantity'],
  category: ['category', 'categories'],
  brand: ['brand', 'manufacturer'],
  image_url: ['image url', 'image_url', 'image', 'main image', 'image link'],
  status: ['status', 'product status'],
  tags: ['tags', 'tag']
}

function canonicalHeader(raw) {
  const normalized = String(raw || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some(x => x.replace(/[^a-z0-9]+/g, ' ').trim() === normalized)) return field
  }
  return null
}

export function parseCsvRecords(text, maxRows = 500) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('The CSV file is empty.')
  const source = text.replace(/^\uFEFF/, '')
  const records = []
  let row = [], value = '', quoted = false
  for (let i = 0; i < source.length; i++) {
    const c = source[i]
    if (c === '"') {
      if (quoted && source[i + 1] === '"') { value += '"'; i++ }
      else quoted = !quoted
    } else if (c === ',' && !quoted) {
      row.push(value); value = ''
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && source[i + 1] === '\n') i++
      row.push(value)
      if (row.some(cell => cell.trim() !== '')) records.push(row)
      if (records.length > maxRows + 1) throw new Error(`Import limit exceeded. Use at most ${maxRows} product rows per file.`)
      row = []; value = ''
    } else value += c
  }
  if (quoted) throw new Error('The CSV file has an unclosed quoted field.')
  row.push(value)
  if (row.some(cell => cell.trim() !== '')) records.push(row)
  if (records.length > maxRows + 1) throw new Error(`Import limit exceeded. Use at most ${maxRows} product rows per file.`)
  return records
}

const normalizedSku = value => String(value ?? '').trim().toUpperCase()
const numberField = (raw, label, {whole = false} = {}) => {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0 || (whole && !Number.isInteger(n))) {
    throw new Error(`${label} must be a non-negative ${whole ? 'whole number' : 'number'}.`)
  }
  return n
}

function supplierTag(supplier) {
  const value = String(supplier || 'Generic').trim().toLowerCase()
  return value === 'doba' || value === 'cj' ? `supplier:${value}` : null
}

function parseTags(value) {
  return String(value || '').split(/[|,]/).map(x => x.trim()).filter(Boolean)
}

/**
 * mode is intentionally explicit for supplier workflows. "update" requires
 * already-known SKUs; "create" requires new SKUs. "upsert" remains compatible
 * with older CoBest generic imports, with new products always set to Draft.
 */
export function planProductCsvImport(csvText, existingProducts = [], supplier = 'Generic', options = {}) {
  const mode = options.mode || 'upsert'
  if (!['upsert','update','create'].includes(mode)) throw new Error('Invalid import mode.')
  const records = parseCsvRecords(csvText)
  if (records.length < 2) throw new Error('The CSV file has no product rows.')
  const fields = records[0].map(canonicalHeader)
  const index = {}
  const ignoredHeaders = records[0].filter((header, i) => String(header).trim() && !fields[i])
  // These fields occur in the Doba/CJ guides but CoBest cannot persist them
  // safely without a schema, API and storefront cost/shipping model.
  const unsupportedBusinessFields = ignoredHeaders.filter(header => /^(cost|supplier cost|unit cost|shipping group|shipping cost|price 25 \+ shipping)$/i.test(String(header).trim()))
  fields.forEach((name, position) => {
    if (!name) return
    if (index[name] !== undefined) throw new Error(`Multiple CSV columns match ${name}. Keep just one.`)
    index[name] = position
  })
  if (index.sku === undefined && records[0].some(header => /^variant[\s_-]*sku$/i.test(String(header).trim()))) {
    throw new Error('Variant SKU feeds must be updated through variant management, not the product importer. Use a Product SKU feed.')
  }
  if (index.sku === undefined) throw new Error('A Product SKU column is required to match products safely and avoid duplicate imports.')
  if (index.name === undefined && index.price === undefined && index.inventory === undefined) {
    throw new Error('Add at least one product field (name, price, or inventory) alongside SKU.')
  }

  const bySku = new Map()
  for (const product of existingProducts || []) {
    const sku = normalizedSku(product.sku)
    if (!sku) continue
    const list = bySku.get(sku) || []
    list.push(product)
    bySku.set(sku, list)
  }

  // A supplier variant SKU must never be imported as a second product.
  const variantSkus = new Set()
  for (const product of existingProducts || []) {
    for (const variant of product.variants || []) {
      const variantSku = normalizedSku(variant?.sku)
      if (variantSku) variantSkus.add(variantSku)
    }
  }

  const incoming = new Set()
  const tag = supplierTag(supplier)
  const rows = records.slice(1).map((record, idx) => {
    const rowNumber = idx + 2
    const get = field => index[field] === undefined ? undefined : String(record[index[field]] ?? '').trim()
    const sku = get('sku') || ''
    const key = normalizedSku(sku)
    const current = bySku.get(key) || []
    const existing = current.length === 1 ? current[0] : null
    const base = {rowNumber, sku, name: get('name') || existing?.name || '', action:'error', message:'', payload:null, existingId:existing?.id || null}
    const fail = message => ({...base, action:'error', message})
    if (!key) return fail('Missing SKU. Add a unique SKU before importing.')
    if (key.length > 128) return fail('SKU must be 128 characters or less.')
    if (record.length !== records[0].length) return fail(`Row contains ${record.length} columns but the header contains ${records[0].length}. Review the CSV formatting.`)
    if (incoming.has(key)) return fail('This SKU appears more than once in the file.')
    incoming.add(key)
    if (current.length > 1) return fail('More than one existing product has this SKU. Resolve it manually first.')
    if (mode === 'update' && !existing) return fail('SKU was not found. Update-only mode never creates products; import it separately as a new Draft product.')
    if (mode === 'create' && existing) return fail('SKU already exists. Create-only mode will not overwrite an existing product.')
    if (variantSkus.has(key)) return fail('This SKU belongs to an existing variant. Update it through variant management, not the product importer.')
    const existingSupplierTag = (existing?.tags || []).find(x => /^supplier:[^:]+$/i.test(String(x)))
    if (existingSupplierTag && tag && String(existingSupplierTag).toLowerCase().replace('cj-dropshipping','cj') !== tag) {
      return fail('Product is assigned to another supplier. Verify and reassign the supplier before updating this SKU.')
    }

    try {
      const proposed = {}
      for (const field of ['name','description','category','brand','image_url','status','sku']) {
        const value = get(field)
        if (value === undefined || value === '') continue
        if (field === 'status') {
          const valid = ['Draft','Active','Archived'].find(x => x.toLowerCase() === value.toLowerCase())
          if (!valid) throw new Error('Status must be Draft, Active, or Archived.')
          proposed.status = valid
        } else if (field === 'image_url') {
          if (!/^https?:\/\//i.test(value)) throw new Error('Image URL must start with http:// or https://.')
          proposed.image_url = value
          proposed.images = Array.from(new Set([...(existing?.images || []), value]))
        } else proposed[field] = value
      }
      for (const field of ['price','compare_at_price','inventory']) {
        const value = get(field)
        if (value === undefined || value === '') continue
        proposed[field] = numberField(value,field,{whole:field === 'inventory'})
      }
      // Supplier attribution is controlled by the selected import source.
      // Supplier-looking values inside generic CSV tags cannot silently reassign stock.
      if (get('tags')) proposed.tags = parseTags(get('tags')).filter(value=>!/^supplier:/i.test(value))

      const tags = Array.from(new Set([...(existing?.tags || []), ...(proposed.tags || []), ...(tag ? [tag] : [])]))
      if (tag || proposed.tags) proposed.tags = tags
      if (existing) {
        // Never overwrite a product when there are no meaningful differences.
        const delta = Object.fromEntries(Object.entries(proposed).filter(([field,value]) => {
          const previous = existing[field]
          return Array.isArray(value)
            ? JSON.stringify(value) !== JSON.stringify(previous || [])
            : String(value) !== String(previous ?? '')
        }))
        if (!Object.keys(delta).length) return {...base,action:'skip',message:'No changes'}
        return {...base,action:'update',message:Object.entries(delta).map(([field,value])=>{
          if(['price','inventory','status'].includes(field))return `${field}: ${existing[field]??'—'} → ${value}`
          return field
        }).join(' · '),payload:delta}
      }
      if (!proposed.name) return fail('New products need a name.')
      if (!Number.isFinite(proposed.price)) return fail('New products need a valid price.')
      const payload = {
        name:proposed.name, sku, description:proposed.description || '',
        price:proposed.price, compare_at_price:proposed.compare_at_price ?? null,
        inventory:proposed.inventory ?? 0, category:proposed.category || 'Uncategorized',
        brand:proposed.brand || '', status:'Draft',
        image_url:proposed.image_url || '', images:proposed.images || [],
        tags:proposed.tags || [], variants:[]
      }
      return {...base,action:'create',message:'New product',payload}
    } catch (error) {
      return fail(error.message || 'Invalid product data.')
    }
  })

  const counts = {
    create:rows.filter(x => x.action === 'create').length,
    update:rows.filter(x => x.action === 'update').length,
    skip:rows.filter(x => x.action === 'skip').length,
    error:rows.filter(x => x.action === 'error').length
  }
  return {rows, counts, supplier, mode, ignoredHeaders, unsupportedBusinessFields, hasErrors:counts.error > 0}
}
