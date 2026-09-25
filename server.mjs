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
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2'
}
const allowedTables = new Set(['products', 'customers', 'orders', 'discounts', 'campaigns', 'media_assets'])

function sendJson(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(payload))
}

async function readJson(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (!chunks.length) return {}
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { return null }
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
  return { ok: response.ok, status: response.status, data }
}

async function getUser(token) {
  if (!token) return null
  const result = await supabaseFetch('/auth/v1/user', { headers: apiHeaders(token) })
  return result.ok ? result.data : null
}

async function handleApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, backendConfigured: Boolean(supabaseUrl && supabaseAnonKey) })
  }

  if (url.pathname === '/api/auth/signup' && req.method === 'POST') {
    const body = await readJson(req)
    if (!body?.email || !body?.password) return sendJson(res, 400, { error: 'Email and password are required.' })
    const result = await supabaseFetch('/auth/v1/signup', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ email: body.email, password: body.password })
    })
    return sendJson(res, result.status, result.data)
  }

  if (url.pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await readJson(req)
    if (!body?.email || !body?.password) return sendJson(res, 400, { error: 'Email and password are required.' })
    const result = await supabaseFetch('/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ email: body.email, password: body.password })
    })
    return sendJson(res, result.status, result.data)
  }

  if (url.pathname === '/api/auth/reset' && req.method === 'POST') {
    const body = await readJson(req)
    if (!body?.email) return sendJson(res, 400, { error: 'Email is required.' })
    const result = await supabaseFetch('/auth/v1/recover', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ email: body.email })
    })
    return sendJson(res, result.status, result.data ?? { ok: true })
  }

  const token = authToken(req)
  const user = await getUser(token)
  if (!user) return sendJson(res, 401, { error: 'Authentication required.' })

  if (url.pathname === '/api/me' && req.method === 'GET') {
    return sendJson(res, 200, { user: { id: user.id, email: user.email } })
  }

  if (url.pathname === '/api/workspace') {
    if (req.method === 'GET') {
      const result = await supabaseFetch(`/rest/v1/workspaces?user_id=eq.${encodeURIComponent(user.id)}&select=*&limit=1`, {
        headers: apiHeaders(token)
      })
      return sendJson(res, result.status, result.data)
    }
    if (req.method === 'PUT') {
      const body = await readJson(req)
      if (!body) return sendJson(res, 400, { error: 'Invalid JSON.' })
      const payload = {
        user_id: user.id,
        onboarding: body.onboarding || {},
        editor: body.editor || {},
        settings: body.settings || {},
        updated_at: new Date().toISOString()
      }
      const result = await supabaseFetch('/rest/v1/workspaces?on_conflict=user_id', {
        method: 'POST',
        headers: apiHeaders(token, { Prefer: 'resolution=merge-duplicates,return=representation' }),
        body: JSON.stringify(payload)
      })
      return sendJson(res, result.status, result.data)
    }
  }

  const match = url.pathname.match(/^\/api\/data\/([a-z_]+)(?:\/(\d+))?$/)
  if (match) {
    const table = match[1]
    const id = match[2]
    if (!allowedTables.has(table)) return sendJson(res, 404, { error: 'Unknown resource.' })

    if (req.method === 'GET') {
      const order = table === 'orders' ? '&order=created_at.desc' : '&order=id.desc'
      const idFilter = id ? `&id=eq.${encodeURIComponent(id)}` : ''
      const result = await supabaseFetch(`/rest/v1/${table}?user_id=eq.${encodeURIComponent(user.id)}${idFilter}&select=*${order}`, {
        headers: apiHeaders(token)
      })
      return sendJson(res, result.status, result.data)
    }

    if (req.method === 'POST') {
      const body = await readJson(req)
      if (!body) return sendJson(res, 400, { error: 'Invalid JSON.' })
      const result = await supabaseFetch(`/rest/v1/${table}`, {
        method: 'POST',
        headers: apiHeaders(token, { Prefer: 'return=representation' }),
        body: JSON.stringify({ ...body, user_id: user.id })
      })
      return sendJson(res, result.status, result.data)
    }

    if (req.method === 'PATCH' && id) {
      const body = await readJson(req)
      if (!body) return sendJson(res, 400, { error: 'Invalid JSON.' })
      delete body.user_id
      delete body.id
      const result = await supabaseFetch(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`, {
        method: 'PATCH',
        headers: apiHeaders(token, { Prefer: 'return=representation' }),
        body: JSON.stringify(body)
      })
      return sendJson(res, result.status, result.data)
    }

    if (req.method === 'DELETE' && id) {
      const result = await supabaseFetch(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`, {
        method: 'DELETE',
        headers: apiHeaders(token, { Prefer: 'return=representation' })
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
    if ((req.url || '').startsWith('/api/')) return sendJson(res, 500, { error: 'Server error' })
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('Server error')
  }
}).listen(port, '0.0.0.0', () => console.log(`CoBest listening on ${port}`))
