import { createServer } from 'node:http'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { calculateCheckout } from './server-commerce.mjs'

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'dist')
const port = Number(process.env.PORT || 4173)
const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''
const internalSecret = process.env.COBEST_INTERNAL_SECRET || ''
const stripeSecret = process.env.STRIPE_SECRET_KEY || ''
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
const paypalClientId = process.env.PAYPAL_CLIENT_ID || ''
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET || ''
const paypalBase = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase() === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
const resendApiKey = process.env.RESEND_API_KEY || ''
const emailFrom = process.env.EMAIL_FROM || 'CoBest <onboarding@resend.dev>'
const stripeLaunchPriceId = process.env.STRIPE_LAUNCH_PRICE_ID || ''
const stripeGrowthPriceId = process.env.STRIPE_GROWTH_PRICE_ID || ''
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.pdf': 'application/pdf'
}
const allowedTables = new Set([
  'products','customers','orders','discounts','campaigns','media_assets',
  'site_pages','collections','blog_posts','catalog_terms','newsletter_subscribers','contact_messages',
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
  const own = await supabaseFetch(`/rest/v1/workspaces?user_id=eq.${encodeURIComponent(user.id)}&select=id&limit=1`, { headers: apiHeaders(token) })
  if (own.ok && Array.isArray(own.data) && own.data.length) return { ownerId: user.id, role: 'Owner' }
  const membership = await supabaseFetch(`/rest/v1/workspace_members?member_user_id=eq.${encodeURIComponent(user.id)}&select=owner_user_id,role&order=id.asc&limit=1`, { headers: apiHeaders(token) })
  if (membership.ok && Array.isArray(membership.data) && membership.data[0]) {
    return { ownerId: membership.data[0].owner_user_id, role: membership.data[0].role || 'Viewer' }
  }
  return { ownerId: user.id, role: 'Owner' }
}

async function resolveSiteId(req,token,ownerId){
  const requested=Number(req.headers['x-cobest-site-id']||0)
  if(requested){
    const found=await supabaseFetch(`/rest/v1/workspaces?id=eq.${requested}&user_id=eq.${encodeURIComponent(ownerId)}&select=id&limit=1`,{headers:apiHeaders(token)})
    if(found.ok&&Array.isArray(found.data)&&found.data[0])return Number(found.data[0].id)
  }
  const first=await supabaseFetch(`/rest/v1/workspaces?user_id=eq.${encodeURIComponent(ownerId)}&select=id&order=id.asc&limit=1`,{headers:apiHeaders(token)})
  return first.ok&&Array.isArray(first.data)&&first.data[0]?Number(first.data[0].id):null
}

async function rpc(name, payload) {
  return supabaseFetch(`/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(payload)
  })
}

async function userRpc(name,payload,token){
  return supabaseFetch(`/rest/v1/rpc/${name}`,{
    method:'POST',
    headers:apiHeaders(token),
    body:JSON.stringify(payload)
  })
}

async function internalPaymentUpdate(orderId, status, provider, reference='') {
  if (!internalSecret) throw new Error('Internal payment bridge is not configured.')
  const result = await rpc('internal_update_payment', {
    p_secret: internalSecret,
    p_order_id: Number(orderId),
    p_status: status,
    p_provider: provider || '',
    p_reference: reference || ''
  })
  if (!result.ok) throw new Error(typeof result.data === 'string' ? result.data : result.data?.message || result.data?.error || 'Unable to update payment.')
  return result.data
}

async function internalSubscriptionUpdate({ownerId,plan,status,customer='',subscription='',periodEnd=null}) {
  if(!internalSecret)throw new Error('Internal billing bridge is not configured.')
  const result=await rpc('internal_set_subscription',{
    p_secret:internalSecret,p_owner_user_id:ownerId,p_plan:plan||'Free',p_status:status||'inactive',
    p_provider:'stripe',p_customer_reference:customer||'',p_subscription_reference:subscription||'',
    p_current_period_end:periodEnd?new Date(Number(periodEnd)*1000).toISOString():null
  })
  if(!result.ok)throw new Error(result.data?.message||result.data?.error||'Unable to update subscription.')
  return result.data
}

async function stripeRequest(path,{method='GET',params=null}={}) {
  if(!stripeSecret)throw new Error('Stripe is not configured.')
  const response=await fetch(`https://api.stripe.com${path}`,{
    method,
    headers:{authorization:`Bearer ${stripeSecret}`,...(params?{'content-type':'application/x-www-form-urlencoded'}:{})},
    body:params?params.toString():undefined
  })
  const data=await response.json().catch(()=>({}))
  if(!response.ok)throw new Error(data?.error?.message||'Stripe request failed.')
  return data
}

async function createStripeSubscriptionCheckout({req,user,ownerId,plan}) {
  const priceId=plan==='Growth'?stripeGrowthPriceId:stripeLaunchPriceId
  if(!priceId)throw new Error(`${plan} Stripe price is not configured.`)
  const params=new URLSearchParams()
  params.set('mode','subscription')
  params.set('success_url',`${requestOrigin(req)}/?billing=success`)
  params.set('cancel_url',`${requestOrigin(req)}/?billing=cancelled`)
  params.set('customer_email',user.email||'')
  params.set('client_reference_id',String(ownerId))
  params.set('metadata[billing]','subscription')
  params.set('metadata[owner_id]',String(ownerId))
  params.set('metadata[plan]',plan)
  params.set('subscription_data[metadata][owner_id]',String(ownerId))
  params.set('subscription_data[metadata][plan]',plan)
  params.set('line_items[0][price]',priceId)
  params.set('line_items[0][quantity]','1')
  const session=await stripeRequest('/v1/checkout/sessions',{method:'POST',params})
  return session
}

async function createStripePortal({req,customer}) {
  const params=new URLSearchParams()
  params.set('customer',customer)
  params.set('return_url',`${requestOrigin(req)}/`)
  return stripeRequest('/v1/billing_portal/sessions',{method:'POST',params})
}

function requestOrigin(req) {
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0]
  return `${proto}://${req.headers.host || 'cobest.me'}`
}

async function createStripeCheckout({req,order,buyer,total,currency,slug}) {
  if (!stripeSecret) return null
  const params = new URLSearchParams()
  params.set('mode','payment')
  params.set('success_url',`${requestOrigin(req)}/store/${encodeURIComponent(slug)}?payment=success&order=${encodeURIComponent(order.order_number)}`)
  params.set('cancel_url',`${requestOrigin(req)}/store/${encodeURIComponent(slug)}?payment=cancelled&order=${encodeURIComponent(order.order_number)}`)
  params.set('customer_email',buyer.email)
  params.set('metadata[order_id]',String(order.id))
  params.set('metadata[order_number]',String(order.order_number))
  params.set('line_items[0][price_data][currency]',String(currency||'PHP').toLowerCase())
  params.set('line_items[0][price_data][product_data][name]',`Order ${order.order_number}`)
  params.set('line_items[0][price_data][unit_amount]',String(Math.max(0,Math.round(Number(total||0)*100))))
  params.set('line_items[0][quantity]','1')
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions',{
    method:'POST',
    headers:{authorization:`Bearer ${stripeSecret}`,'content-type':'application/x-www-form-urlencoded'},
    body:params
  })
  const data=await response.json().catch(()=>({}))
  if(!response.ok) throw new Error(data?.error?.message||'Stripe checkout could not be created.')
  await internalPaymentUpdate(order.id,'Pending','stripe',data.id)
  return {provider:'stripe',status:'Pending',reference:data.id,checkout_url:data.url}
}

async function paypalAccessToken() {
  if(!paypalClientId||!paypalClientSecret) return null
  const response=await fetch(`${paypalBase}/v1/oauth2/token`,{
    method:'POST',
    headers:{authorization:`Basic ${Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString('base64')}`,'content-type':'application/x-www-form-urlencoded'},
    body:'grant_type=client_credentials'
  })
  const data=await response.json().catch(()=>({}))
  if(!response.ok) throw new Error(data?.error_description||'PayPal authentication failed.')
  return data.access_token
}

async function createPayPalCheckout({req,order,total,currency,slug}) {
  const access=await paypalAccessToken()
  if(!access)return null
  const response=await fetch(`${paypalBase}/v2/checkout/orders`,{
    method:'POST',
    headers:{authorization:`Bearer ${access}`,'content-type':'application/json','paypal-request-id':`cobest-${order.id}-${Date.now()}`},
    body:JSON.stringify({
      intent:'CAPTURE',
      purchase_units:[{custom_id:String(order.id),invoice_id:String(order.order_number),amount:{currency_code:String(currency||'PHP').toUpperCase(),value:Number(total||0).toFixed(2)}}],
      payment_source:{paypal:{experience_context:{return_url:`${requestOrigin(req)}/store/${encodeURIComponent(slug)}?paypal=return`,cancel_url:`${requestOrigin(req)}/store/${encodeURIComponent(slug)}?payment=cancelled`,user_action:'PAY_NOW'}}}
    })
  })
  const data=await response.json().catch(()=>({}))
  if(!response.ok) throw new Error(data?.message||'PayPal checkout could not be created.')
  const approve=(data.links||[]).find(x=>x.rel==='payer-action'||x.rel==='approve')?.href
  await internalPaymentUpdate(order.id,'Pending','paypal',data.id)
  return {provider:'paypal',status:'Pending',reference:data.id,checkout_url:approve}
}

async function capturePayPal(paypalOrderId) {
  const access=await paypalAccessToken()
  if(!access) throw new Error('PayPal is not configured.')
  const response=await fetch(`${paypalBase}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,{
    method:'POST',headers:{authorization:`Bearer ${access}`,'content-type':'application/json'},body:'{}'
  })
  const data=await response.json().catch(()=>({}))
  if(!response.ok) throw new Error(data?.message||'PayPal capture failed.')
  const orderId=Number(data?.purchase_units?.[0]?.custom_id)
  if(data.status==='COMPLETED'&&orderId) await internalPaymentUpdate(orderId,'Paid','paypal',paypalOrderId)
  return data
}

function verifyStripeSignature(raw, header) {
  if(!stripeWebhookSecret||!header)return false
  const parts=Object.fromEntries(String(header).split(',').map(x=>x.split('=').map(v=>v.trim())))
  const timestamp=parts.t
  const signature=parts.v1
  if(!timestamp||!signature)return false
  if(Math.abs(Date.now()/1000-Number(timestamp))>300)return false
  const digest=createHmac('sha256',stripeWebhookSecret).update(`${timestamp}.${raw.toString('utf8')}`).digest('hex')
  try{return timingSafeEqual(Buffer.from(digest,'hex'),Buffer.from(signature,'hex'))}catch{return false}
}

async function sendEmail(to, subject, html) {
  if(!resendApiKey||!to)return {ok:false,skipped:true}
  const response=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{authorization:`Bearer ${resendApiKey}`,'content-type':'application/json'},
    body:JSON.stringify({from:emailFrom,to:[to],subject,html})
  })
  const data=await response.json().catch(()=>({}))
  return {ok:response.ok,status:response.status,data}
}

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))
}

function safeSlug(value='') {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)
}

function isValidEmail(value='') {
  const email=String(value).trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

function validateResourceMutation(table, body, method='POST') {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Invalid payload.' }
  const next = { ...body }
  if (table === 'products') {
    if (method === 'POST' && !String(next.name || '').trim()) return { error: 'Product name is required.' }
    for (const key of ['price','compare_at_price','inventory']) {
      if (next[key] == null || next[key] === '') continue
      const value = Number(next[key])
      if (!Number.isFinite(value) || value < 0) return { error: `${key.replaceAll('_',' ')} must be zero or greater.` }
      if (key === 'inventory' && !Number.isInteger(value)) return { error: 'Inventory must be a whole number.' }
      next[key] = value
    }
    if (next.status != null && !['Draft','Active','Archived'].includes(next.status)) return { error: 'Invalid product status.' }
  }
  if (table === 'discounts') {
    if (method === 'POST' && !String(next.code || '').trim()) return { error: 'Discount code is required.' }
    if (next.kind != null && !['percent','fixed'].includes(next.kind)) return { error: 'Invalid discount type.' }
    if (next.value != null && next.value !== '') {
      const value = Number(next.value)
      if (!Number.isFinite(value) || value <= 0) return { error: 'Discount value must be greater than zero.' }
      if ((next.kind || body.kind) === 'percent' && value > 100) return { error: 'Percent discount cannot exceed 100%.' }
      next.value = value
    }
    if (next.min_spend != null && next.min_spend !== '') {
      const value = Number(next.min_spend)
      if (!Number.isFinite(value) || value < 0) return { error: 'Minimum spend must be zero or greater.' }
      next.min_spend = value
    }
    if (next.usage_limit !== undefined && next.usage_limit !== null && next.usage_limit !== '') {
      const value = Number(next.usage_limit)
      if (!Number.isInteger(value) || value < 1) return { error: 'Usage limit must be a positive whole number.' }
      next.usage_limit = value
    }
  }
  if (table === 'orders' && method === 'PATCH') {
    const allowed = new Set(['payment_status','fulfillment_status','tracking_number','carrier','notes'])
    for (const key of Object.keys(next)) if (!allowed.has(key)) delete next[key]
    if (next.payment_status != null && !['Pending','Paid','Refunded','Failed'].includes(next.payment_status)) return { error: 'Invalid payment status.' }
    if (next.fulfillment_status != null && !['Unfulfilled','Processing','Fulfilled','Cancelled'].includes(next.fulfillment_status)) return { error: 'Invalid fulfillment status.' }
    if (!Object.keys(next).length) return { error: 'No editable order fields were provided.' }
  }
  return { body: next }
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

async function handlePublicApi(req, res, url) {
  const storeMatch = url.pathname.match(/^\/api\/public\/store\/([^/]+)$/)
  if (storeMatch && req.method === 'GET') {
    const store = await getPublishedStore(decodeURIComponent(storeMatch[1]))
    if (!store) return sendJson(res, 404, { error: 'Store not found.' })
    return sendJson(res, 200, { ...store, payment_options: { stripe: Boolean(stripeSecret), paypal: Boolean(paypalClientId && paypalClientSecret) } })
  }

  if (url.pathname === '/api/public/domain' && req.method === 'GET') {
    const host = String(url.searchParams.get('host') || '').toLowerCase().split(':')[0]
    const store = host ? await getPublishedStoreByDomain(host) : null
    if (!store) return sendJson(res, 404, { error: 'Store not found.' })
    return sendJson(res, 200, { ...store, payment_options: { stripe: Boolean(stripeSecret), paypal: Boolean(paypalClientId && paypalClientSecret) } })
  }

  const body = req.method === 'POST' ? await readJson(req) : {}
  if (req.method === 'POST' && body === null) return sendJson(res, 400, { error: 'Invalid JSON.' })

  if(url.pathname==='/api/public/customer/link'&&req.method==='POST'){
    const token=authToken(req);const user=await getUser(token)
    if(!user)return sendJson(res,401,{error:'Customer login required.'})
    const result=await userRpc('link_store_customer_account',{p_slug:body.slug},token)
    return sendJson(res,result.status,result.ok?result.data:result.data)
  }

  if(url.pathname==='/api/public/customer/account'&&req.method==='POST'){
    const token=authToken(req);const user=await getUser(token)
    if(!user)return sendJson(res,401,{error:'Customer login required.'})
    const result=await userRpc('customer_portal_data',{p_slug:body.slug},token)
    return sendJson(res,result.status,result.data)
  }

  if(url.pathname==='/api/public/customer/profile'&&req.method==='POST'){
    const token=authToken(req);const user=await getUser(token)
    if(!user)return sendJson(res,401,{error:'Customer login required.'})
    const result=await userRpc('update_customer_portal_profile',{
      p_slug:body.slug,p_name:body.name||'',p_phone:body.phone||'',p_address:body.address||{},
      p_marketing_consent:Boolean(body.marketing_consent)
    },token)
    return sendJson(res,result.status,result.data)
  }

  if (url.pathname === '/api/public/subscribe' && req.method === 'POST') {
    if (!body?.slug || !body?.email) return sendJson(res, 400, { error: 'Store and email are required.' })
    if (!isValidEmail(body.email)) return sendJson(res, 400, { error: 'Enter a valid email address.' })
    const result = await rpc('subscribe_store', { p_slug: body.slug, p_email: body.email })
    return sendJson(res, result.status, result.ok ? { ok: true } : result.data)
  }

  if (url.pathname === '/api/public/contact' && req.method === 'POST') {
    if (!body?.slug || !body?.email || !body?.message) return sendJson(res, 400, { error: 'Store, email, and message are required.' })
    if (!isValidEmail(body.email)) return sendJson(res, 400, { error: 'Enter a valid email address.' })
    const result = await rpc('contact_store', { p_slug: body.slug, p_name: body.name || '', p_email: body.email, p_message: body.message })
    if(result.ok&&resendApiKey){
      const store=await getPublishedStore(body.slug)
      const to=store?.settings?.contactEmail
      if(to)sendEmail(to,`New website message from ${body.name||body.email}`,`<p><strong>From:</strong> ${escapeHtml(body.name||'Visitor')} (${escapeHtml(body.email)})</p><p>${escapeHtml(body.message).replaceAll('\n','<br>')}</p>`).catch(()=>{})
    }
    return sendJson(res, result.status, result.ok ? { ok: true } : result.data)
  }

  if (url.pathname === '/api/public/booking' && req.method === 'POST') {
    if (!body?.slug || !body?.name || !body?.email || !body?.start_at) return sendJson(res, 400, { error: 'Store, name, email, and time are required.' })
    if (!isValidEmail(body.email)) return sendJson(res, 400, { error: 'Enter a valid email address.' })
    const bookingTime=Date.parse(body.start_at)
    if (!Number.isFinite(bookingTime) || bookingTime <= Date.now()) return sendJson(res, 400, { error: 'Booking time must be in the future.' })
    const result = await rpc('book_store', { p_slug: body.slug, p_name: body.name, p_email: body.email, p_phone: body.phone || '', p_start_at: body.start_at, p_notes: body.notes || '' })
    if(result.ok&&resendApiKey){
      const store=await getPublishedStore(body.slug)
      const to=store?.settings?.contactEmail
      if(to)sendEmail(to,`New booking request from ${body.name}`,`<p><strong>Customer:</strong> ${escapeHtml(body.name)} (${escapeHtml(body.email)})</p><p><strong>Requested:</strong> ${escapeHtml(body.start_at)}</p><p>${escapeHtml(body.notes||'')}</p>`).catch(()=>{})
      sendEmail(body.email,'Your booking request was received',`<p>Hi ${escapeHtml(body.name)},</p><p>Your booking request for <strong>${escapeHtml(body.start_at)}</strong> has been received.</p>`).catch(()=>{})
    }
    return sendJson(res, result.status, result.ok ? { ok: true } : result.data)
  }

  if (url.pathname === '/api/public/review' && req.method === 'POST') {
    if (!body?.slug || !body?.product_id || !body?.name || !body?.rating) return sendJson(res, 400, { error: 'Required review fields are missing.' })
    const rating=Number(body.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return sendJson(res, 400, { error: 'Rating must be between 1 and 5.' })
    if (body.email && !isValidEmail(body.email)) return sendJson(res, 400, { error: 'Enter a valid email address.' })
    const result = await rpc('review_store_product', {
      p_slug: body.slug, p_product_id: Number(body.product_id), p_name: body.name,
      p_email: body.email || '', p_rating: rating, p_body: body.body || ''
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
    if (!isValidEmail(body.email)) return sendJson(res, 400, { error: 'Enter a valid email address.' })
    const result = await rpc('lookup_store_order', { p_slug: body.slug, p_order_number: body.order_number, p_email: body.email })
    if (!result.ok) return sendJson(res, result.status, result.data)
    if (!result.data) return sendJson(res, 404, { error: 'Order not found. Check the order number and email address.' })
    return sendJson(res, 200, { order: result.data })
  }

  if (url.pathname === '/api/public/paypal-capture' && req.method === 'POST') {
    if(!body?.paypal_order_id)return sendJson(res,400,{error:'PayPal order ID is required.'})
    try{const data=await capturePayPal(body.paypal_order_id);return sendJson(res,200,{ok:true,status:data.status})}
    catch(error){return sendJson(res,502,{error:error.message})}
  }

  if (url.pathname === '/api/public/checkout' && req.method === 'POST') {
    if (!body?.slug || !body?.buyer?.name || !body?.buyer?.email) return sendJson(res, 400, { error: 'Buyer name and email are required.' })
    if (!isValidEmail(body.buyer.email)) return sendJson(res, 400, { error: 'Enter a valid buyer email address.' })
    const store = await getPublishedStore(body.slug)
    if (!store) return sendJson(res, 404, { error: 'Store not found.' })
    const totals = calculateCheckout(store, body)
    if (totals.inventoryIssues?.length) return sendJson(res, 409, { error: 'One or more products do not have enough inventory.', inventory_issues: totals.inventoryIssues })
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
    const order=result.data
    if(resendApiKey&&body.buyer?.email){
      sendEmail(body.buyer.email,`Order ${order.order_number} received`,`<p>Hi ${escapeHtml(body.buyer.name)},</p><p>We received order <strong>${escapeHtml(order.order_number)}</strong>.</p><p>Total: <strong>${escapeHtml(String(totals.total))} ${escapeHtml(String(store?.settings?.currency||'PHP'))}</strong></p><p>Payment status: Pending.</p>`).catch(()=>{})
    }
    const provider=String(body.payment_provider||'').toLowerCase()
    try{
      if(provider==='stripe'&&stripeSecret){
        const payment=await createStripeCheckout({req,order,buyer:body.buyer,total:totals.total,currency:store?.settings?.currency||'PHP',slug:body.slug})
        return sendJson(res,200,{order,totals,payment})
      }
      if(provider==='paypal'&&paypalClientId&&paypalClientSecret){
        const payment=await createPayPalCheckout({req,order,total:totals.total,currency:store?.settings?.currency||'PHP',slug:body.slug})
        return sendJson(res,200,{order,totals,payment})
      }
      return sendJson(res, 200, { order, totals, payment: { status: 'Pending', provider: null, checkout_url: null } })
    }catch(error){
      return sendJson(res,200,{
        order,
        totals,
        payment:{status:'Pending',provider:provider||null,checkout_url:null,error:error.message},
        warning:'Your order was created, but online payment could not be started. Do not place the order again. Contact the store or use the order number for follow-up.'
      })
    }
  }

  return sendJson(res, 404, { error: 'Public API route not found.' })
}

async function handleApi(req, res, url) {
  if (url.pathname === '/api/webhooks/stripe' && req.method === 'POST') {
    const raw=await readBuffer(req,2*1024*1024)
    if(!verifyStripeSignature(raw,req.headers['stripe-signature'])) return sendJson(res,400,{error:'Invalid Stripe signature.'})
    const event=JSON.parse(raw.toString('utf8'))
    const object=event?.data?.object||{}
    const orderId=Number(object?.metadata?.order_id)
    if(orderId&&event.type==='checkout.session.completed') await internalPaymentUpdate(orderId,'Paid','stripe',object.id||'')
    if(orderId&&event.type==='checkout.session.expired') await internalPaymentUpdate(orderId,'Failed','stripe',object.id||'')

    if(event.type==='checkout.session.completed'&&object?.metadata?.billing==='subscription'){
      const subscription=object.subscription?await stripeRequest(`/v1/subscriptions/${encodeURIComponent(object.subscription)}`):null
      const ownerId=object.metadata.owner_id||object.client_reference_id
      const plan=object.metadata.plan||subscription?.metadata?.plan||'Launch'
      if(ownerId&&subscription)await internalSubscriptionUpdate({ownerId,plan,status:subscription.status,customer:object.customer||subscription.customer,subscription:subscription.id,periodEnd:subscription.current_period_end})
    }
    if(event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted'){
      const ownerId=object?.metadata?.owner_id
      const plan=object?.metadata?.plan||'Free'
      if(ownerId)await internalSubscriptionUpdate({ownerId,plan,status:object.status||'canceled',customer:object.customer||'',subscription:object.id||'',periodEnd:object.current_period_end})
    }
    return sendJson(res,200,{received:true})
  }
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

  if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
    const token=authToken(req)
    if(!token)return sendJson(res,200,{ok:true})
    const result=await supabaseFetch('/auth/v1/logout',{method:'POST',headers:apiHeaders(token)})
    if(!result.ok && result.status!==401)return sendJson(res,result.status,result.data)
    return sendJson(res,200,{ok:true})
  }

  if (url.pathname === '/api/auth/reset' && req.method === 'POST') {
    const body = await readJson(req)
    if (!body?.email) return sendJson(res, 400, { error: 'Email is required.' })
    const redirectTo = 'https://cobest.me/reset-password'
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

  if (url.pathname === '/api/billing/status' && req.method === 'GET') {
    const result=await supabaseFetch(`/rest/v1/billing_subscriptions?owner_user_id=eq.${encodeURIComponent(ownerId)}&select=*&limit=1`,{headers:apiHeaders(token)})
    const subscription=result.ok&&Array.isArray(result.data)?result.data[0]||null:null
    return sendJson(res,200,{subscription,plan:subscription?.plan||'Free',stripe_connected:Boolean(stripeSecret&&stripeLaunchPriceId&&stripeGrowthPriceId)})
  }

  if (url.pathname === '/api/billing/checkout' && req.method === 'POST') {
    if(!stripeSecret)return sendJson(res,503,{error:'Stripe is not connected.'})
    if(!['Owner','Admin'].includes(role))return sendJson(res,403,{error:'Only owners and admins can change billing.'})
    const body=await readJson(req)
    const plan=body?.plan
    if(!['Launch','Growth'].includes(plan))return sendJson(res,400,{error:'Choose Launch or Growth.'})
    try{const session=await createStripeSubscriptionCheckout({req,user,ownerId,plan});return sendJson(res,200,{checkout_url:session.url,session_id:session.id})}
    catch(error){return sendJson(res,502,{error:error.message})}
  }

  if (url.pathname === '/api/billing/portal' && req.method === 'POST') {
    if(!['Owner','Admin'].includes(role))return sendJson(res,403,{error:'Only owners and admins can manage billing.'})
    if(!stripeSecret)return sendJson(res,503,{error:'Stripe is not connected.'})
    const result=await supabaseFetch(`/rest/v1/billing_subscriptions?owner_user_id=eq.${encodeURIComponent(ownerId)}&select=customer_reference&limit=1`,{headers:apiHeaders(token)})
    const customer=result.ok&&Array.isArray(result.data)?result.data[0]?.customer_reference:null
    if(!customer)return sendJson(res,400,{error:'No Stripe billing customer exists yet.'})
    try{const portal=await createStripePortal({req,customer});return sendJson(res,200,{url:portal.url})}catch(error){return sendJson(res,502,{error:error.message})}
  }

  if (url.pathname === '/api/me' && req.method === 'GET') {
    return sendJson(res, 200, { user: { id: user.id, email: user.email } })
  }

  if (url.pathname === '/api/integrations/status' && req.method === 'GET') {
    return sendJson(res, 200, {
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      paypal: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
      email: Boolean(resendApiKey),
      shipstation: Boolean(process.env.SHIPSTATION_API_KEY),
      amazon: Boolean(process.env.AMAZON_SELLING_PARTNER_CLIENT_ID && process.env.AMAZON_SELLING_PARTNER_CLIENT_SECRET),
      ebay: Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET),
      adobe: Boolean(process.env.ADOBE_CLIENT_ID && process.env.ADOBE_CLIENT_SECRET)
    })
  }

  if (url.pathname === '/api/sites' && req.method === 'GET') {
    const result=await supabaseFetch(`/rest/v1/workspaces?user_id=eq.${encodeURIComponent(ownerId)}&select=id,site_name,slug,custom_domain,is_published,plan,currency,timezone,created_at,updated_at&order=id.asc`,{headers:apiHeaders(token)})
    return sendJson(res,result.status,result.data)
  }

  if (url.pathname === '/api/sites' && req.method === 'POST') {
    if(role==='Viewer')return sendJson(res,403,{error:'Viewer access is read-only.'})
    const body=await readJson(req)
    const siteName=String(body?.site_name||'New website').trim()||'New website'
    const base=safeSlug(body?.slug||siteName||'site')||'site'
    let slug=base
    for(let i=0;i<10;i++){
      const check=await supabaseFetch(`/rest/v1/workspaces?slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`,{headers:apiHeaders(token)})
      if(check.ok&&Array.isArray(check.data)&&!check.data.length)break
      slug=`${base}-${i+2}`
    }
    const result=await supabaseFetch('/rest/v1/workspaces',{
      method:'POST',headers:apiHeaders(token,{Prefer:'return=representation'}),
      body:JSON.stringify({user_id:ownerId,site_name:siteName,slug,onboarding:{businessName:siteName,pages:['Home']},editor:{},settings:{},plan:'Free',currency:'PHP',timezone:'Asia/Manila'})
    })
    return sendJson(res,result.status,result.data)
  }

  const siteDelete=url.pathname.match(/^\/api\/sites\/(\d+)$/)
  if(siteDelete&&req.method==='DELETE'){
    if(role!=='Owner')return sendJson(res,403,{error:'Only the workspace owner can delete a site.'})
    const result=await supabaseFetch(`/rest/v1/workspaces?id=eq.${siteDelete[1]}&user_id=eq.${encodeURIComponent(ownerId)}`,{method:'DELETE',headers:apiHeaders(token,{Prefer:'return=representation'})})
    return sendJson(res,result.status,result.data)
  }

  const siteId = await resolveSiteId(req,token,ownerId)

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
    if(result.ok&&Array.isArray(result.data)&&result.data[0]&&resendApiKey){
      const inv=result.data[0]
      const link=`${requestOrigin(req)}/?invite=${inv.token}`
      sendEmail(inv.email,'You were invited to a CoBest workspace',`<p>You were invited as <strong>${escapeHtml(inv.role)}</strong>.</p><p><a href="${link}">Accept CoBest invitation</a></p><p>This link expires in 7 days.</p>`).catch(()=>{})
    }
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
      if(!siteId)return sendJson(res,200,[])
      const result = await supabaseFetch(`/rest/v1/workspaces?id=eq.${siteId}&user_id=eq.${encodeURIComponent(ownerId)}&select=*&limit=1`, { headers: apiHeaders(token) })
      return sendJson(res, result.status, result.data)
    }
    if (req.method === 'PUT') {
      if(role==='Viewer')return sendJson(res,403,{error:'Viewer access is read-only.'})
      const body = await readJson(req)
      if (!body) return sendJson(res, 400, { error: 'Invalid JSON.' })
      let existing=null
      if(siteId){
        const current=await supabaseFetch(`/rest/v1/workspaces?id=eq.${siteId}&user_id=eq.${encodeURIComponent(ownerId)}&select=*&limit=1`,{headers:apiHeaders(token)})
        if(current.ok)existing=Array.isArray(current.data)?current.data[0]||null:current.data
      }
      const mergedOnboarding={...(existing?.onboarding||{}),...(body.onboarding||{})}
      const mergedEditor={...(existing?.editor||{}),...(body.editor||{})}
      const mergedSettings={...(existing?.settings||{}),...(body.settings||{})}
      const slug = safeSlug(body.slug ?? existing?.slug ?? mergedOnboarding?.businessName ?? user.email?.split('@')[0] ?? 'store')
      const payload = {
        user_id: ownerId,
        onboarding: mergedOnboarding,
        editor: mergedEditor,
        settings: mergedSettings,
        site_name: body.site_name ?? existing?.site_name ?? mergedOnboarding?.businessName ?? 'Untitled website',
        slug,
        custom_domain: String(body.custom_domain ?? existing?.custom_domain ?? '').toLowerCase().trim(),
        plan: body.plan ?? existing?.plan ?? 'Free',
        currency: body.currency ?? existing?.currency ?? 'PHP',
        timezone: body.timezone ?? existing?.timezone ?? 'Asia/Manila',
        updated_at: new Date().toISOString()
      }
      const result = siteId
        ? await supabaseFetch(`/rest/v1/workspaces?id=eq.${siteId}&user_id=eq.${encodeURIComponent(ownerId)}`, {
            method:'PATCH',headers:apiHeaders(token,{Prefer:'return=representation'}),body:JSON.stringify(payload)
          })
        : await supabaseFetch('/rest/v1/workspaces', {
            method:'POST',headers:apiHeaders(token,{Prefer:'return=representation'}),body:JSON.stringify(payload)
          })
      return sendJson(res, result.status, result.data)
    }
  }

  if (url.pathname === '/api/publish' && req.method === 'POST') {
    if(role==='Viewer')return sendJson(res,403,{error:'Viewer access is read-only.'})
    const body = await readJson(req)
    if (!body?.snapshot) return sendJson(res, 400, { error: 'Published snapshot is required.' })
    const slug = safeSlug(body.slug || body.snapshot?.settings?.slug || body.snapshot?.onboarding?.businessName || user.email?.split('@')[0] || 'store')
    if (!slug) return sendJson(res, 400, { error: 'A store slug is required.' })
    const customDomain = String(body.custom_domain || '').toLowerCase().trim()
    if(!siteId)return sendJson(res,400,{error:'Create a site before publishing.'})
    const result = await supabaseFetch('/rest/v1/published_stores?on_conflict=workspace_id', {
      method: 'POST',
      headers: apiHeaders(token, { Prefer: 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify({ owner_user_id: ownerId, workspace_id: siteId, slug, custom_domain: customDomain, snapshot: body.snapshot, published_at: new Date().toISOString() })
    })
    if (!result.ok) return sendJson(res, result.status, result.data)
    await supabaseFetch(`/rest/v1/workspaces?id=eq.${siteId}&user_id=eq.${encodeURIComponent(ownerId)}`, {
      method: 'PATCH',
      headers: apiHeaders(token, { Prefer: 'return=minimal' }),
      body: JSON.stringify({ slug, custom_domain: customDomain, is_published: true, published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    })
    return sendJson(res, 200, { ok: true, slug, custom_domain: customDomain, store_url: `/store/${slug}` })
  }

  if (url.pathname === '/api/unpublish' && req.method === 'POST') {
    if(role==='Viewer')return sendJson(res,403,{error:'Viewer access is read-only.'})
    if(!siteId)return sendJson(res,400,{error:'No active site.'})
    await supabaseFetch(`/rest/v1/published_stores?workspace_id=eq.${siteId}&owner_user_id=eq.${encodeURIComponent(ownerId)}`, {
      method: 'DELETE', headers: apiHeaders(token, { Prefer: 'return=minimal' })
    })
    await supabaseFetch(`/rest/v1/workspaces?id=eq.${siteId}&user_id=eq.${encodeURIComponent(ownerId)}`, {
      method: 'PATCH', headers: apiHeaders(token), body: JSON.stringify({ is_published: false, updated_at: new Date().toISOString() })
    })
    return sendJson(res, 200, { ok: true })
  }

  if (url.pathname === '/api/media/upload' && req.method === 'POST') {
    if(role==='Viewer')return sendJson(res,403,{error:'Viewer access is read-only.'})
    const buffer = await readBuffer(req)
    if (!buffer.length) return sendJson(res, 400, { error: 'File is empty.' })
    const rawName = decodeURIComponent(String(req.headers['x-file-name'] || 'upload.bin'))
    const fileName = rawName.replace(/[^a-zA-Z0-9._-]+/g,'-').slice(-120)
    if(!siteId)return sendJson(res,400,{error:'No active site.'})
    const storagePath = `${ownerId}/${siteId}/${Date.now()}-${fileName}`
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
      body: JSON.stringify({ user_id: ownerId, site_id: siteId, name: rawName, url: publicUrl, mime_type: contentType, storage_path: storagePath })
    })
    return sendJson(res, record.status, record.data)
  }

  const campaignSend = url.pathname.match(/^\/api\/campaigns\/(\d+)\/send$/)
  if(campaignSend&&req.method==='POST'){
    if(role==='Viewer')return sendJson(res,403,{error:'Viewer access is read-only.'})
    if(!resendApiKey)return sendJson(res,503,{error:'Email delivery is not connected. Configure RESEND_API_KEY first.'})
    const campaignResult=await supabaseFetch(`/rest/v1/campaigns?id=eq.${campaignSend[1]}&user_id=eq.${encodeURIComponent(ownerId)}&site_id=eq.${siteId}&select=*&limit=1`,{headers:apiHeaders(token)})
    const campaign=campaignResult.ok&&Array.isArray(campaignResult.data)?campaignResult.data[0]:null
    if(!campaign)return sendJson(res,404,{error:'Campaign not found.'})
    const subsResult=await supabaseFetch(`/rest/v1/newsletter_subscribers?owner_user_id=eq.${encodeURIComponent(ownerId)}&site_id=eq.${siteId}&select=email`,{headers:apiHeaders(token)})
    const subscribers=subsResult.ok&&Array.isArray(subsResult.data)?subsResult.data:[]
    let sent=0,failed=0
    for(const sub of subscribers.slice(0,500)){
      const mail=await sendEmail(sub.email,campaign.subject||campaign.name,`<div style="font-family:Arial,sans-serif;line-height:1.6;white-space:pre-wrap">${escapeHtml(campaign.content||'').replaceAll('\n','<br>')}</div>`)
      if(mail.ok)sent++;else failed++
    }
    const updated=await supabaseFetch(`/rest/v1/campaigns?id=eq.${campaign.id}&user_id=eq.${encodeURIComponent(ownerId)}&site_id=eq.${siteId}`,{
      method:'PATCH',headers:apiHeaders(token,{Prefer:'return=representation'}),
      body:JSON.stringify({status:failed&&sent===0?'Draft':'Complete',sent_at:new Date().toISOString(),updated_at:new Date().toISOString()})
    })
    return sendJson(res,200,{sent,failed,total:subscribers.length,campaign:Array.isArray(updated.data)?updated.data[0]:updated.data})
  }

  const match = url.pathname.match(/^\/api\/data\/([a-z_]+)(?:\/(\d+))?$/)
  if (match) {
    if(!siteId)return sendJson(res,400,{error:'No active site.'})
    if (role === 'Viewer' && req.method !== 'GET') return sendJson(res, 403, { error: 'Viewer access is read-only.' })
    const table = match[1]
    const id = match[2]
    if (!allowedTables.has(table)) return sendJson(res, 404, { error: 'Unknown resource.' })
    const ownerColumn = ['newsletter_subscribers','contact_messages','bookings','product_reviews','store_events'].includes(table) ? 'owner_user_id' : 'user_id'

    if (req.method === 'GET') {
      const order = ['orders','contact_messages','store_events','newsletter_subscribers','bookings','product_reviews'].includes(table) ? '&order=created_at.desc' : '&order=id.desc'
      const idFilter = id ? `&id=eq.${encodeURIComponent(id)}` : ''
      const siteFilter=siteId?`&site_id=eq.${siteId}`:''
      const result = await supabaseFetch(`/rest/v1/${table}?${ownerColumn}=eq.${encodeURIComponent(ownerId)}${siteFilter}${idFilter}&select=*${order}`, { headers: apiHeaders(token) })
      return sendJson(res, result.status, result.data)
    }

    if (req.method === 'POST') {
      const body = await readJson(req)
      if (!body) return sendJson(res, 400, { error: 'Invalid JSON.' })
      const validated = validateResourceMutation(table, body, 'POST')
      if (validated.error) return sendJson(res, 400, { error: validated.error })
      const result = await supabaseFetch(`/rest/v1/${table}`, {
        method: 'POST', headers: apiHeaders(token, { Prefer: 'return=representation' }), body: JSON.stringify({ ...validated.body, [ownerColumn]: ownerId, site_id: siteId })
      })
      return sendJson(res, result.status, result.data)
    }

    if (req.method === 'PATCH' && id) {
      const body = await readJson(req)
      if (!body) return sendJson(res, 400, { error: 'Invalid JSON.' })
      delete body.user_id; delete body.owner_user_id; delete body.id; delete body.site_id
      const validated = validateResourceMutation(table, body, 'PATCH')
      if (validated.error) return sendJson(res, 400, { error: validated.error })
      const result = await supabaseFetch(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&${ownerColumn}=eq.${encodeURIComponent(ownerId)}${siteId?`&site_id=eq.${siteId}`:''}`, {
        method: 'PATCH', headers: apiHeaders(token, { Prefer: 'return=representation' }), body: JSON.stringify({ ...validated.body, updated_at: new Date().toISOString() })
      })
      return sendJson(res, result.status, result.data)
    }

    if (req.method === 'DELETE' && id) {
      if(table==='media_assets'){
        const lookup=await supabaseFetch(`/rest/v1/media_assets?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(ownerId)}&site_id=eq.${siteId}&select=storage_path&limit=1`,{headers:apiHeaders(token)})
        const path=lookup.ok&&Array.isArray(lookup.data)?lookup.data[0]?.storage_path:null
        if(path)await fetch(`${supabaseUrl}/storage/v1/object/cobest-media/${encodeURI(path)}`,{method:'DELETE',headers:{apikey:supabaseAnonKey,authorization:`Bearer ${token}`}}).catch(()=>{})
      }
      const result = await supabaseFetch(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&${ownerColumn}=eq.${encodeURIComponent(ownerId)}&site_id=eq.${siteId}`, {
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
    const extension = extname(filePath)
    const headers = { 'content-type': mime[extension] || 'application/octet-stream' }
    if (extension === '.html') headers['cache-control'] = 'no-store, max-age=0, must-revalidate'
    else if (url.pathname.startsWith('/assets/')) headers['cache-control'] = 'public, max-age=31536000, immutable'
    res.writeHead(200, headers)
    res.end(body)
  } catch (error) {
    console.error(error)
    if ((req.url || '').startsWith('/api/')) return sendJson(res, 500, { error: error?.message || 'Server error' })
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('Server error')
  }
}).listen(port, '0.0.0.0', () => console.log(`CoBest listening on ${port}`))
