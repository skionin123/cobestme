import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'dist')
const port = Number(process.env.PORT || 4173)
const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.pdf': 'application/pdf'
}
const allowedTables = new Set([
  'products','customers','orders','discounts','campaigns','media_assets',
  'site_pages','collections','blog_posts','newsletter_subscribers','contact_messages',
  'bookings','product_reviews','store_events'
])

function sendJson(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(payload))
}

async function readBuffer(req, limit = 12 * 1024 * 1024) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) throw new Error('Payload too large')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

async function readJson(req) {
  const buffer = await readBuffer(req, 2 * 1024 * 1024)
  if (!buffer.length) return {}
  try { return JSON.parse(buffer.toString('utf8')) } catch { return null }
}

function authToken(req) {
  const value = req.headers.authorization || ''
  return value.startsWith('Bearer ') ? value.slice(7) : ''
}

function apiHeaders(token = '', extra = {}) {
  return {
    apikey: supabaseAnonKey,
    authorization: `Bearer ${token || supabaseAnonKey}`,
    'content-type': 'application/json',
    ...extra
  }
}

async function supabaseFetch(path, options = {}) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, status: 503, data: { error: 'Backend is not configured yet.' } }
  }
  const response = await fetch(`${supabaseUrl}${path}`, options)
  const text = await response.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  return { ok: response.ok, status: response.status, data, headers: response.headers }
}

async function getUser(token) {
  if (!token) return null
  const result = await supabaseFetch('/auth/v1/user', { headers: apiHeaders(token) })
  return result.ok ? result.data : null
}

async function getAccessContext(token, user) {
  const own = await supabaseFetch(`/rest/v1/workspaces?user_id=eq.${encodeURIComponent(ownerId)}&select=id&limit=1`, { headers: apiHeaders(token) })
  if (own.ok && Array.isArray(own.data) && own.data.length) return { ownerId: user.id, role: 'Owner' }
  const membership = await supabaseFetch(`/rest/v1/workspace_members?member_user_id=eq.${encodeURIComponent(user.id)}&select=owner_user_id,role&order=id.asc&limit=1`, { headers: apiHeaders(token) })
  if (membership.ok && Array.isArray(membership.data) && membership.data[0]) {
    return { ownerId: membership.data[0].owner_user_id, role: membership.data[0].role || 'Viewer' }
  }
  return { ownerId: user.id, role: 'Owner' }
}

async function rpc(name, payload) {
  return supabaseFetch(`/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(payload)
  })
}

function safeSlug(value='') {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)
}

async function getPublishedStore(slug) {
  const result = await rpc('public_store_payload', { p_slug: slug })
  return result.ok ? result.data || null : null
}

async function getPublishedStoreByDomain(host) {
  const result = await supabaseFetch(`/rest/v1/published_stores?custom_domain=eq.${encodeURIComponent(host)}&select=slug&limit=1`, {
    headers: apiHeaders()
  })
  const row = result.ok && Array.isArray(result.data) ? result.data[0] || null : null
  return row?.slug ? getPublishedStore(row.slug) : null
}

function calculateCheckout(snapshot, body) {
  const catalog = Array.isArray(snapshot?.products) ? snapshot.products : []
  const requested = Array.isArray(body?.items) ? body.items : []
  const items = []
  for (const row of requested) {
    const product = catalog.find(p => String(p.id) === String(row.product_id) && p.status === 'Active')
    if (!product) continue
    const quantity = Math.max(1, Math.min(99, Number(row.quantity || 1)))
    const unitPrice = Number(product.price || 0)
    items.push({ product_id: product.id, name: product.name, quantity, unit_price: unitPrice, line_total: unitPrice * quantity })
  }
  const subtotal = items.reduce((sum,x)=>sum+x.line_total,0)
  let discountAmount = 0
  let discountCode = ''
  const requestedCode = String(body?.discount_code || '').trim().toUpperCase()
  if (requestedCode) {
    const discounts = Array.isArray(snapshot?.discounts) ? snapshot.discounts : []
    const d = discounts.find(x => x.active && String(x.code).toUpperCase() === requestedCode)
    const notExpired = !d?.expires_at || new Date(d.expires_at).getTime() > Date.now()
    const underLimit = !d?.usage_limit || Number(d.used_count || 0) < Number(d.usage_limit)
    if (d && notExpired && underLimit && subtotal >= Number(d.min_spend || 0)) {
      discountCode = requestedCode
      discountAmount = d.kind === 'fixed' ? Math.min(subtotal, Number(d.value || 0)) : subtotal * Math.min(100, Math.max(0, Number(d.value || 0))) / 100
    }
  }
  const settings = snapshot?.settings || {}
  const shippingAmount = subtotal > 0 ? Math.max(0, Number(settings.shippingFlat || 0)) : 0
  const taxableBase = Math.max(0, subtotal - discountAmount)
  const taxAmount = taxableBase * Math.max(0, Number(settings.taxRate || 0)) / 100
  const total = Math.max(0, taxableBase + shippingAmount + taxAmount)
  return { items, subtotal, discountCode, discountAmount, shippingAmount, taxAmount, total }
}

async function handlePublicApi(req, res, url) {
  const storeMatch = url.pathname.match(/^\/api\/public\/store\/([^/]+)$/)
  if (storeMatch && req.method === 'GET') {
    const store = await getPublishedStore(decodeURIComponent(storeMatch[1]))
    if (!store) return sendJson(res, 404, { error: 'Store not found.' })
    return sendJson(res, 200, store)
  }

  if (url.pathname === '/api/public/domain' && req.method === 'GET') {
    const host = String(url.searchParams.get('host') || '').toLowerCase().split(':')[0]
    const store = host ? await getPublishedStoreByDomain(host) : null
    if (!store) return sendJson(res, 404, { error: 'Store not found.' })
    return sendJson(res, 200, store)
  }

  const body = req.method === 'POST' ? await readJson(req) : {}
  if (req.method === 'POST' && body === null) return sendJson(res, 400, { error: 'Invalid JSON.' })

  if (url.pathname === '/api/public/subscribe' && req.method === 'POST') {
    if (!body?.slug || !body?.email) return sendJson(res, 400, { error: 'Store and email are required.' })
    const result = await rpc('subscribe_store', { p_slug: body.slug, p_email: body.email })
    return sendJson(res, result.status, result.ok ? { ok: true } : result.data)
  }

  if (url.pathname === '/api/public/contact' && req.method === 'POST') {
    if (!body?.slug || !body?.email || !body?.message) return sendJson(res, 400, { error: 'Store, email, and message are required.' })
    const result = await rpc('contact_store', { p_slug: body.slug, p_name: body.name || '', p_email: body.email, p_message: body.message })
    return sendJson(res, result.status, result.ok ? { ok: true } : result.data)
  }

  if (url.pathname === '/api/public/booking' && req.method === 'POST') {
    if (!body?.slug || !body?.name || !body?.email || !body?.start_at) return sendJson(res, 400, { error: 'Store, name, email, and time are required.' })
    const result = await rpc('book_store', { p_slug: body.slug, p_name: body.name, p_email: body.email, p_phone: body.phone || '', p_start_at: body.start_at, p_notes: body.notes || '' })
    return sendJson(res, result.status, result.ok ? { ok: true } : result.data)
  }

  if (url.pathname === '/api/public/review' && req.method === 'POST') {
    if (!body?.slug || !body?.product_id || !body?.name || !body?.rating) return sendJson(res, 400, { error: 'Required review fields are missing.' })
    const result = await rpc('review_store_product', {
      p_slug: body.slug, p_product_id: Number(body.product_id), p_name: body.name,
      p_email: body.email || '', p_rating: Number(body.rating), p_body: body.body || ''
    })
    return sendJson(res, result.status, result.ok ? { ok: true } : result.data)
  }

  if (url.pathname === '/api/public/event' && req.method === 'POST') {
    if (!body?.slug || !body?.event_type) return sendJson(res, 400, { error: 'Store and event are required.' })
    const result = await rpc('track_store_event', {
      p_slug: body.slug, p_event_type: body.event_type, p_path: body.path || '', p_metadata: body.metadata || {}
    })
    return sendJson(res, result.status, result.ok ? { ok: true } : result.data)
  }

  if (url.pathname === '/api/public/order-lookup' && req.method === 'POST') {
    if (!body?.slug || !body?.order_number || !body?.email) return sendJson(res, 400, { error: 'Store, order number, and email are required.' })
    const result = await rpc('lookup_store_order', { p_slug: body.slug, p_order_number: body.order_number, p_email: body.email })
    if (!result.ok) return sendJson(res, result.status, result.data)
    if (!result.data) return sendJson(res, 404, { error: 'Order not found. Check the order number and email address.' })
    return sendJson(res, 200, { order: result.data })
  }

  if (url.pathname === '/api/public/checkout' && req.method === 'POST') {
    if (!body?.slug || !body?.buyer?.name || !body?.buyer?.email) return sendJson(res, 400, { error: 'Buyer name and email are required.' })
    const store = await getPublishedStore(body.slug)
    if (!store) return sendJson(res, 404, { error: 'Store not found.' })
    const totals = calculateCheckout(store, body)
    if (!totals.items.length) return sendJson(res, 400, { error: 'Cart is empty or products are unavailable.' })
    const result = await rpc('public_place_order', {
      p_slug: body.slug,
      p_name: body.buyer.name,
      p_email: body.buyer.email,
      p_phone: body.buyer.phone || '',
      p_items: totals.items,
      p_subtotal: totals.subtotal,
      p_discount_code: totals.discountCode,
      p_discount_amount: totals.discountAmount,
      p_shipping_amount: totals.shippingAmount,
      p_tax_amount: totals.taxAmount,
      p_total: totals.total,
      p_shipping_address: body.shipping_address || {}
    })
    if (!result.ok) return sendJson(res, result.status, result.data)
    return sendJson(res, 200, { order: result.data, totals, payment: { status: 'Pending', provider: null } })
  }

  return sendJson(res, 404, { error: 'Public API route not found.' })
}

async function handleApi(req, res, url) {
  if (url.pathname.startsWith('/api/public/')) return handlePublicApi(req, res, url)

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, backendConfigured: Boolean(supabaseUrl && supabaseAnonKey), version: 'full-feature-foundation' })
  }

  if (url.pathname === '/api/auth/signup' && req.method === 'POST') {
    const body = await readJson(req)
    if (!body?.email || !body?.password) return sendJson(res, 400, { error: 'Email and password are required.' })
    const result = await supabaseFetch('/auth/v1/signup', {
      method: 'POST', headers: apiHeaders(), body: JSON.stringify({ email: body.email, password: body.password })
    })
    return sendJson(res, result.status, result.data)
  }

  if (url.pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await readJson(req)
    if (!body?.email || !body?.password) return sendJson(res, 400, { error: 'Email and password are required.' })
    const result = await supabaseFetch('/auth/v1/token?grant_type=password', {
      method: 'POST', headers: apiHeaders(), body: JSON.stringify({ email: body.email, password: body.password })
    })
    return sendJson(res, result.status, result.data)
  }

  if (url.pathname === '/api/auth/refresh' && req.method === 'POST') {
    const body = await readJson(req)
    if (!body?.refresh_token) return sendJson(res, 400, { error: 'Refresh token is required.' })
    const result = await supabaseFetch('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: apiHeaders(), body: JSON.stringify({ refresh_token: body.refresh_token })
    })
    return sendJson(res, result.status, result.data)
  }

  if (url.pathname === '/api/auth/reset' && req.method === 'POST') {
    const body = await readJson(req)
    if (!body?.email) return sendJson(res, 400, { error: 'Email is required.' })
    const redirectTo = body.redirect_to || 'https://cobest.me/'
    const result = await supabaseFetch('/auth/v1/recover', {
      method: 'POST', headers: apiHeaders(), body: JSON.stringify({ email: body.email, redirect_to: redirectTo })
    })
    return sendJson(res, result.status, result.data ?? { ok: true })
  }

  const token = authToken(req)
  const user = await getUser(token)
  if (!user) return sendJson(res, 401, { error: 'Authentication required.' })

  if (url.pathname === '/api/team/accept' && req.method === 'POST') {
    const body = await readJson(req)
    if (!body?.token) return sendJson(res, 400, { error: 'Invitation token is required.' })
    const result = await supabaseFetch('/rest/v1/rpc/accept_workspace_invite', {
      method: 'POST', headers: apiHeaders(token), body: JSON.stringify({ p_token: body.token })
    })
    return sendJson(res, result.status, result.data)
  }

  const access = await getAccessContext(token, user)
  const ownerId = access.ownerId
  const role = access.role

  if (url.pathname === '/api/auth/update-password' && req.method === 'POST') {
    const body = await readJson(req)
    if (!body?.password || String(body.password).length < 8) return sendJson(res, 400, { error: 'Password must be at least 8 characters.' })
    const result = await supabaseFetch('/auth/v1/user', {
      method: 'PUT', headers: apiHeaders(token), body: JSON.stringify({ password: body.password })
    })
    return sendJson(res, result.status, result.data)
  }

  if (url.pathname === '/api/me' && req.method === 'GET') {
    return sendJson(res, 200, { user: { id: user.id, email: user.email } })
  }

  if (url.pathname === '/api/integrations/status' && req.method === 'GET') {
    return sendJson(res, 200, {
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      paypal: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
      email: Boolean(process.env.RESEND_API_KEY || process.env.POSTMARK_SERVER_TOKEN || process.env.SENDGRID_API_KEY),
      shipstation: Boolean(process.env.SHIPSTATION_API_KEY),
      amazon: Boolean(process.env.AMAZON_SELLING_PARTNER_CLIENT_ID && process.env.AMAZON_SELLING_PARTNER_CLIENT_SECRET),
      ebay: Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET),
      adobe: Boolean(process.env.ADOBE_CLIENT_ID && process.env.ADOBE_CLIENT_SECRET)
    })
  }

  if (url.pathname === '/api/team' && req.method === 'GET') {
    const [members, invites] = await Promise.all([
      supabaseFetch(`/rest/v1/workspace_members?owner_user_id=eq.${encodeURIComponent(ownerId)}&select=id,member_user_id,email,role,created_at&order=id.asc`, { headers: apiHeaders(token) }),
      supabaseFetch(`/rest/v1/workspace_invites?owner_user_id=eq.${encodeURIComponent(ownerId)}&select=id,email,role,token,expires_at,accepted_at,created_at&order=id.desc`, { headers: apiHeaders(token) })
    ])
    return sendJson(res, 200, { owner_id: ownerId, role, members: members.ok ? members.data : [], invites: invites.ok ? invites.data : [] })
  }

  if (url.pathname === '/api/team/invite' && req.method === 'POST') {
    if (!['Owner','Admin'].includes(role)) return sendJson(res, 403, { error: 'Only owners and admins can invite team members.' })
    const body = await readJson(req)
    if (!body?.email) return sendJson(res, 400, { error: 'Email is required.' })
    const inviteRole = ['Admin','Editor','Viewer'].includes(body.role) ? body.role : 'Editor'
    const result = await supabaseFetch('/rest/v1/workspace_invites', {
      method: 'POST',
      headers: apiHeaders(token, { Prefer: 'return=representation' }),
      body: JSON.stringify({ owner_user_id: ownerId, email: String(body.email).trim().toLowerCase(), role: inviteRole })
    })
    return sendJson(res, result.status, result.data)
  }

  const memberDelete = url.pathname.match(/^\/api\/team\/member\/(\d+)$/)
  if (memberDelete && req.method === 'DELETE') {
    if (!['Owner','Admin'].includes(role)) return sendJson(res, 403, { error: 'Only owners and admins can remove members.' })
    const result = await supabaseFetch(`/rest/v1/workspace_members?id=eq.${memberDelete[1]}&owner_user_id=eq.${encodeURIComponent(ownerId)}`, {
      method: 'DELETE', headers: apiHeaders(token, { Prefer: 'return=representation' })
    })
    return sendJson(res, result.status, result.data)
  }

  const inviteDelete = url.pathname.match(/^\/api\/team\/invite\/(\d+)$/)
  if (inviteDelete && req.method === 'DELETE') {
    if (!['Owner','Admin'].includes(role)) return sendJson(res, 403, { error: 'Only owners and admins can revoke invitations.' })
    const result = await supabaseFetch(`/rest/v1/workspace_invites?id=eq.${inviteDelete[1]}&owner_user_id=eq.${encodeURIComponent(ownerId)}`, {
      method: 'DELETE', headers: apiHeaders(token, { Prefer: 'return=representation' })
    })
    return sendJson(res, result.status, result.data)
  }


  if (url.pathname === '/api/workspace') {
    if (req.method === 'GET') {
      const result = await supabaseFetch(`/rest/v1/workspaces?user_id=eq.${encodeURIComponent(ownerId)}&select=*&limit=1`, { headers: apiHeaders(token) })
      return sendJson(res, result.status, result.data)
    }
    if (req.method === 'PUT') {
      const body = await readJson(req)
      if (!body) return sendJson(res, 400, { error: 'Invalid JSON.' })
      const slug = safeSlug(body.slug || body.onboarding?.businessName || user.email?.split('@')[0] || 'store')
      const payload = {
        user_id: ownerId,
        onboarding: body.onboarding || {},
        editor: body.editor || {},
        settings: body.settings || {},
        site_name: body.site_name || body.onboarding?.businessName || '',
        slug,
        custom_domain: String(body.custom_domain || '').toLowerCase().trim(),
        plan: body.plan || 'Free',
        currency: body.currency || 'PHP',
        timezone: body.timezone || 'Asia/Manila',
        updated_at: new Date().toISOString()
      }
      const result = await supabaseFetch('/rest/v1/workspaces?on_conflict=user_id', {
        method: 'POST', headers: apiHeaders(token, { Prefer: 'resolution=merge-duplicates,return=representation' }), body: JSON.stringify(payload)
      })
      return sendJson(res, result.status, result.data)
    }
  }

  if (url.pathname === '/api/publish' && req.method === 'POST') {
    const body = await readJson(req)
    if (!body?.snapshot) return sendJson(res, 400, { error: 'Published snapshot is required.' })
    const slug = safeSlug(body.slug || body.snapshot?.settings?.slug || body.snapshot?.onboarding?.businessName || user.email?.split('@')[0] || 'store')
    if (!slug) return sendJson(res, 400, { error: 'A store slug is required.' })
    const customDomain = String(body.custom_domain || '').toLowerCase().trim()
    const result = await supabaseFetch('/rest/v1/published_stores?on_conflict=owner_user_id', {
      method: 'POST',
      headers: apiHeaders(token, { Prefer: 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify({ owner_user_id: ownerId, slug, custom_domain: customDomain, snapshot: body.snapshot, published_at: new Date().toISOString() })
    })
    if (!result.ok) return sendJson(res, result.status, result.data)
    await supabaseFetch(`/rest/v1/workspaces?user_id=eq.${encodeURIComponent(user.id)}`, {
      method: 'PATCH',
      headers: apiHeaders(token, { Prefer: 'return=minimal' }),
      body: JSON.stringify({ slug, custom_domain: customDomain, is_published: true, published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    })
    return sendJson(res, 200, { ok: true, slug, custom_domain: customDomain, store_url: `/store/${slug}` })
  }

  if (url.pathname === '/api/unpublish' && req.method === 'POST') {
    await supabaseFetch(`/rest/v1/published_stores?owner_user_id=eq.${encodeURIComponent(ownerId)}`, {
      method: 'DELETE', headers: apiHeaders(token, { Prefer: 'return=minimal' })
    })
    await supabaseFetch(`/rest/v1/workspaces?user_id=eq.${encodeURIComponent(user.id)}`, {
      method: 'PATCH', headers: apiHeaders(token), body: JSON.stringify({ is_published: false, updated_at: new Date().toISOString() })
    })
    return sendJson(res, 200, { ok: true })
  }

  if (url.pathname === '/api/media/upload' && req.method === 'POST') {
    const buffer = await readBuffer(req)
    if (!buffer.length) return sendJson(res, 400, { error: 'File is empty.' })
    const rawName = decodeURIComponent(String(req.headers['x-file-name'] || 'upload.bin'))
    const fileName = rawName.replace(/[^a-zA-Z0-9._-]+/g,'-').slice(-120)
    const storagePath = `${user.id}/${Date.now()}-${fileName}`
    const contentType = String(req.headers['content-type'] || 'application/octet-stream')
    const upload = await fetch(`${supabaseUrl}/storage/v1/object/cobest-media/${encodeURI(storagePath)}`, {
      method: 'POST',
      headers: { apikey: supabaseAnonKey, authorization: `Bearer ${token}`, 'content-type': contentType, 'x-upsert': 'false' },
      body: buffer
    })
    const uploadText = await upload.text()
    if (!upload.ok) {
      let data; try { data = JSON.parse(uploadText) } catch { data = { error: uploadText } }
      return sendJson(res, upload.status, data)
    }
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/cobest-media/${storagePath}`
    const record = await supabaseFetch('/rest/v1/media_assets', {
      method: 'POST', headers: apiHeaders(token, { Prefer: 'return=representation' }),
      body: JSON.stringify({ user_id: ownerId, name: rawName, url: publicUrl, mime_type: contentType })
    })
    return sendJson(res, record.status, record.data)
  }

  const match = url.pathname.match(/^\/api\/data\/([a-z_]+)(?:\/(\d+))?$/)
  if (match) {
    if (role === 'Viewer' && req.method !== 'GET') return sendJson(res, 403, { error: 'Viewer access is read-only.' })
    const table = match[1]
    const id = match[2]
    if (!allowedTables.has(table)) return sendJson(res, 404, { error: 'Unknown resource.' })
    const ownerColumn = ['newsletter_subscribers','contact_messages','bookings','product_reviews','store_events'].includes(table) ? 'owner_user_id' : 'user_id'

    if (req.method === 'GET') {
      const order = ['orders','contact_messages','store_events','newsletter_subscribers','bookings','product_reviews'].includes(table) ? '&order=created_at.desc' : '&order=id.desc'
      const idFilter = id ? `&id=eq.${encodeURIComponent(id)}` : ''
      const result = await supabaseFetch(`/rest/v1/${table}?${ownerColumn}=eq.${encodeURIComponent(ownerId)}${idFilter}&select=*${order}`, { headers: apiHeaders(token) })
      return sendJson(res, result.status, result.data)
    }

    if (req.method === 'POST') {
      const body = await readJson(req)
      if (!body) return sendJson(res, 400, { error: 'Invalid JSON.' })
      const result = await supabaseFetch(`/rest/v1/${table}`, {
        method: 'POST', headers: apiHeaders(token, { Prefer: 'return=representation' }), body: JSON.stringify({ ...body, [ownerColumn]: ownerId })
      })
      return sendJson(res, result.status, result.data)
    }

    if (req.method === 'PATCH' && id) {
      const body = await readJson(req)
      if (!body) return sendJson(res, 400, { error: 'Invalid JSON.' })
      delete body.user_id; delete body.owner_user_id; delete body.id
      const result = await supabaseFetch(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&${ownerColumn}=eq.${encodeURIComponent(user.id)}`, {
        method: 'PATCH', headers: apiHeaders(token, { Prefer: 'return=representation' }), body: JSON.stringify({ ...body, updated_at: new Date().toISOString() })
      })
      return sendJson(res, result.status, result.data)
    }

    if (req.method === 'DELETE' && id) {
      const result = await supabaseFetch(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&${ownerColumn}=eq.${encodeURIComponent(user.id)}`, {
        method: 'DELETE', headers: apiHeaders(token, { Prefer: 'return=representation' })
      })
      return sendJson(res, result.status, result.data)
    }
  }

  return sendJson(res, 404, { error: 'API route not found.' })
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url)

    const urlPath = decodeURIComponent(url.pathname)
    const safePath = normalize(urlPath).replace(/^([.][.][/\\])+/, '')
    let filePath = join(root, safePath === '/' ? 'index.html' : safePath)
    try {
      const info = await stat(filePath)
      if (info.isDirectory()) filePath = join(filePath, 'index.html')
    } catch {
      filePath = join(root, 'index.html')
    }
    const body = await readFile(filePath)
    res.writeHead(200, { 'content-type': mime[extname(filePath)] || 'application/octet-stream' })
    res.end(body)
  } catch (error) {
    console.error(error)
    if ((req.url || '').startsWith('/api/')) return sendJson(res, 500, { error: error?.message || 'Server error' })
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('Server error')
  }
}).listen(port, '0.0.0.0', () => console.log(`CoBest listening on ${port}`))
