const TOKEN_KEY = 'cobest-auth-token'
const REFRESH_KEY = 'cobest-refresh-token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function isAuthenticated() {
  return Boolean(getToken())
}

function saveSession(payload) {
  if (payload?.access_token) localStorage.setItem(TOKEN_KEY, payload.access_token)
  if (payload?.refresh_token) localStorage.setItem(REFRESH_KEY, payload.refresh_token)
  return payload
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

async function request(path, options = {}) {
  const headers = { 'content-type': 'application/json', ...(options.headers || {}) }
  const token = getToken()
  if (token) headers.authorization = `Bearer ${token}`
  const response = await fetch(path, { ...options, headers })
  const text = await response.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!response.ok) {
    const message = data?.msg || data?.message || data?.error_description || data?.error || `Request failed (${response.status})`
    throw new Error(message)
  }
  return data
}

export async function signUp(email, password) {
  return saveSession(await request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }))
}

export async function signIn(email, password) {
  return saveSession(await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }))
}

export async function resetPassword(email) {
  return request('/api/auth/reset', {
    method: 'POST',
    body: JSON.stringify({ email })
  })
}

export async function getMe() {
  return request('/api/me')
}

export async function getWorkspace() {
  const rows = await request('/api/workspace')
  return Array.isArray(rows) ? rows[0] || null : rows
}

export async function saveWorkspace(workspace) {
  const rows = await request('/api/workspace', {
    method: 'PUT',
    body: JSON.stringify(workspace)
  })
  return Array.isArray(rows) ? rows[0] || null : rows
}

export async function listResource(resource) {
  return request(`/api/data/${resource}`)
}

export async function createResource(resource, values) {
  const rows = await request(`/api/data/${resource}`, {
    method: 'POST',
    body: JSON.stringify(values)
  })
  return Array.isArray(rows) ? rows[0] || null : rows
}

export async function updateResource(resource, id, values) {
  const rows = await request(`/api/data/${resource}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(values)
  })
  return Array.isArray(rows) ? rows[0] || null : rows
}

export async function deleteResource(resource, id) {
  return request(`/api/data/${resource}/${id}`, { method: 'DELETE' })
}
