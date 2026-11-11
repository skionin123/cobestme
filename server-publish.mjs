// Publishing rules and public-payload rules, kept free of I/O so they can be
// unit tested (see tests/server-publish.test.ts).
//
// Vocabulary
// - "storefront": the shop homepage made with the Storefront editor / shop flow.
// - "custom":     the Home page designed in the Advanced (visual) editor.
// - A snapshot's `visual_project` is the visual-editor project that is LIVE.
// - In the WORKSPACE, `editor.visualBuilderProject` is the merchant's DRAFT. It
//   must never go live as a side effect of another publish (product update,
//   theme change…), so the copy the browser sends is always thrown away.
// - In a PUBLISHED snapshot the live project is stored under both names, and
//   the homepage choice under both `home_source` and `editor.homeSource`.
//   Every version of the public page - and of the database function that
//   serves snapshots - has read at least one of each pair, so the live site
//   does not depend on which top-level keys that function passes on.

const HOME_SOURCES = new Set(['storefront', 'custom'])
const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

/** The visual-editor project that is live in a published snapshot (if any). */
export function liveVisualProject(snapshot) {
  if (!isObject(snapshot)) return null
  const project = snapshot.visual_project || snapshot.editor?.visualBuilderProject
  return isObject(project) && Array.isArray(project.pages) && project.pages.length ? project : null
}

/** Which homepage visitors see for a published snapshot. */
export function homeSourceOf(snapshot) {
  if (!isObject(snapshot)) return 'storefront'
  const stated = HOME_SOURCES.has(snapshot.home_source) ? snapshot.home_source
    : HOME_SOURCES.has(snapshot.editor?.homeSource) ? snapshot.editor.homeSource : ''
  if (stated) return stated === 'custom' && !liveVisualProject(snapshot) ? 'storefront' : stated
  // Snapshots published before the homepage choice existed.
  if (snapshot.editor?.shopDesign && !snapshot.visual_project) return 'storefront'
  return liveVisualProject(snapshot) ? 'custom' : 'storefront'
}

/**
 * Turn what the browser sent into what is stored and shown to visitors.
 *
 * - The visual-editor draft is always removed.
 * - A publish that does not come from the visual editor keeps the custom pages
 *   that are already live, and keeps the current homepage choice.
 * - Only Active products are published.
 */
export function preparePublishSnapshot(incoming, existing = null) {
  if (!isObject(incoming)) return null
  const next = { ...incoming }
  const editor = isObject(incoming.editor) ? { ...incoming.editor } : {}
  // Whatever the browser put here is the draft (or an attempt to set the
  // homepage directly): neither is ever taken from the browser.
  delete editor.visualBuilderProject
  delete editor.homeSource
  delete editor.previousShopDesign
  next.editor = editor

  const explicit = isObject(incoming.visual_project) && Array.isArray(incoming.visual_project.pages) && incoming.visual_project.pages.length
    ? incoming.visual_project
    : null
  const visual = explicit || liveVisualProject(existing)
  if (visual) {
    const live = { ...visual, versions: [] }
    next.visual_project = live
    editor.visualBuilderProject = live
  } else delete next.visual_project

  let home
  if (HOME_SOURCES.has(incoming.home_source)) home = incoming.home_source
  else if (explicit) home = 'custom' // older browsers: publishing the visual site made it the homepage
  else home = isObject(existing) ? homeSourceOf(existing) : 'storefront'
  if (home === 'custom' && !visual) home = 'storefront'
  next.home_source = home
  editor.homeSource = home

  if (Array.isArray(incoming.products)) next.products = incoming.products.filter(product => isObject(product) && product.status === 'Active')
  return next
}

/** Small, non-sensitive description of what is live. */
export function publishSummary(snapshot) {
  const visual = liveVisualProject(snapshot)
  return {
    home_source: homeSourceOf(snapshot),
    has_custom_pages: Boolean(visual),
    custom_page_names: visual ? visual.pages.filter(page => !page?.isCollectionTemplate).map(page => String(page?.name || '')).slice(0, 50) : [],
    storefront_theme: isObject(snapshot?.editor?.shopDesign) ? String(snapshot.editor.shopDesign.theme || '') : ''
  }
}

/**
 * What anonymous visitors may download. Discount codes are only needed by the
 * server (checkout totals) and must not be readable from the browser.
 */
export function publicStorePayload(store) {
  if (!isObject(store)) return store
  const { discounts, ...rest } = store
  const out = { ...rest }
  if (Array.isArray(out.products)) out.products = out.products.filter(product => isObject(product) && product.status === 'Active')
  // Visitors get the live pages once, as `visual_project`, whichever of the
  // two stored copies the database function returned.
  const visual = liveVisualProject(store)
  if (isObject(out.editor)) {
    const editor = { ...out.editor }
    delete editor.previousShopDesign
    delete editor.visualBuilderProject
    delete editor.homeSource
    out.editor = editor
  }
  if (visual) out.visual_project = visual
  else delete out.visual_project
  out.home_source = homeSourceOf(store)
  return out
}

/** Trim free text from anonymous visitors to a sane size. */
export function clipText(value, max) {
  return String(value ?? '').replace(/\u0000/g, '').trim().slice(0, max)
}

/** Keep small, flat analytics metadata only. */
export function clipMetadata(value, maxChars = 2000) {
  if (!isObject(value)) return {}
  let json = ''
  try { json = JSON.stringify(value) } catch { return {} }
  return json.length <= maxChars ? value : {}
}

const ADDRESS_KEYS = ['line1', 'line2', 'city', 'region', 'postal_code', 'country']
export function clipAddress(value) {
  if (!isObject(value)) return {}
  const out = {}
  for (const key of ADDRESS_KEYS) if (value[key] != null && value[key] !== '') out[key] = clipText(value[key], 200)
  return out
}

/**
 * Identify an upload by its first bytes. The browser-supplied content type is
 * not trusted: a file must really be the image/video/PDF it claims to be.
 */
export function sniffMediaType(buffer) {
  if (!buffer || buffer.length < 12) return ''
  const b = buffer
  const ascii = (start, end) => String.fromCharCode(...b.subarray(start, end))
  if (b[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png'
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (ascii(0, 4) === 'GIF8') return 'image/gif'
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  if (ascii(0, 5) === '%PDF-') return 'application/pdf'
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'video/webm'
  if (ascii(4, 8) === 'ftyp') {
    const brands = ascii(8, Math.min(b.length, 40))
    if (brands.includes('avif') || brands.includes('avis')) return 'image/avif'
    // HEIC/HEIF photos are not supported by browsers as website images.
    if (/^(heic|heix|hevc|hevx|mif1|msf1)/.test(brands)) return ''
    return 'video/mp4'
  }
  return ''
}
