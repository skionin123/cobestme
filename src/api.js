const TOKEN_KEY = 'cobest-auth-token'
const REFRESH_KEY = 'cobest-refresh-token'
const SITE_KEY = 'cobest-active-site-id'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY) || ''
}

export function isAuthenticated() {
  return Boolean(getToken())
}

export function getActiveSiteId(){ return localStorage.getItem(SITE_KEY) || '' }
export function setActiveSiteId(id){ if(id) localStorage.setItem(SITE_KEY,String(id)); else localStorage.removeItem(SITE_KEY) }

export function saveSession(payload) {
  if (payload?.access_token) localStorage.setItem(TOKEN_KEY, payload.access_token)
  if (payload?.refresh_token) localStorage.setItem(REFRESH_KEY, payload.refresh_token)
  return payload
}

export function acceptSessionFromHash() {
  if (!window?.location?.hash) return { ok:false, reason:'missing_hash' }
  const params = new URLSearchParams(window.location.hash.slice(1))
  const error = params.get('error')
  const error_code = params.get('error_code')
  const error_description = params.get('error_description')
  if (error || error_code) {
    return { ok:false, reason:error_code||error, message:error_description||'The recovery link is invalid or has expired.' }
  }
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  if (!access_token) return { ok:false, reason:'missing_token' }
  saveSession({ access_token, refresh_token })
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
  return { ok:true }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(SITE_KEY)
}

let refreshing = null
async function refreshSession() {
  const refresh_token = getRefreshToken()
  if (!refresh_token) throw new Error('Session expired. Please log in again.')
  if (!refreshing) {
    refreshing = fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refresh_token })
    }).then(async response => {
      const data = await response.json().catch(()=>({}))
      if (!response.ok) throw new Error(data?.error_description || data?.error || 'Session expired.')
      return saveSession(data)
    }).finally(()=>{ refreshing = null })
  }
  return refreshing
}

async function request(path, options = {}, retry = true) {
  const headers = { 'content-type': 'application/json', ...(options.headers || {}) }
  const token = getToken()
  if (token) headers.authorization = `Bearer ${token}`
  const siteId=getActiveSiteId()
  if(siteId) headers['x-cobest-site-id']=siteId
  const response = await fetch(path, { ...options, headers })
  if (response.status === 401 && retry && getRefreshToken()) {
    await refreshSession()
    return request(path, options, false)
  }
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
    body: JSON.stringify({ email, redirect_to: 'https://cobest.me/?mode=recovery' })
  })
}

export async function updatePassword(password) {
  return request('/api/auth/update-password', {
    method: 'POST',
    body: JSON.stringify({ password })
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
  const result=Array.isArray(rows) ? rows[0] || null : rows
  if(result?.id)setActiveSiteId(result.id)
  return result
}

export async function listSites(){ return request('/api/sites') }
export async function createSite(values={}){
  const rows=await request('/api/sites',{method:'POST',body:JSON.stringify(values)})
  const result=Array.isArray(rows)?rows[0]||null:rows
  if(result?.id)setActiveSiteId(result.id)
  return result
}
export async function deleteSite(id){ return request(`/api/sites/${id}`,{method:'DELETE'}) }

export async function publishStore(payload) {
  return request('/api/publish', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function unpublishStore() {
  return request('/api/unpublish', { method: 'POST', body: '{}' })
}

export async function getPublicStore(slug) {
  const response = await fetch(`/api/public/store/${encodeURIComponent(slug)}`, { cache: 'no-store' })
  const data = await response.json().catch(()=>({}))
  if (!response.ok) throw new Error(data?.error || 'Store not found.')
  return data
}

export async function getPublicStoreByDomain(host) {
  const response = await fetch(`/api/public/domain?host=${encodeURIComponent(host)}`, { cache: 'no-store' })
  const data = await response.json().catch(()=>({}))
  if (!response.ok) throw new Error(data?.error || 'Store not found.')
  return data
}

export async function publicAction(action, payload) {
  const response = await fetch(`/api/public/${action}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await response.json().catch(()=>({}))
  if (!response.ok) throw new Error(data?.error || 'Request failed.')
  return data
}

export async function uploadMedia(file) {
  const headers = { 'content-type': file.type || 'application/octet-stream', 'x-file-name': encodeURIComponent(file.name || 'upload.bin') }
  const token = getToken()
  if (token) headers.authorization = `Bearer ${token}`
  const siteId=getActiveSiteId();if(siteId)headers['x-cobest-site-id']=siteId
  let response = await fetch('/api/media/upload', { method: 'POST', headers, body: file })
  if (response.status === 401 && getRefreshToken()) {
    await refreshSession()
    headers.authorization = `Bearer ${getToken()}`
    response = await fetch('/api/media/upload', { method: 'POST', headers, body: file })
  }
  const text = await response.text()
  let data; try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!response.ok) throw new Error(data?.error || data?.message || 'Upload failed.')
  return Array.isArray(data) ? data[0] || null : data
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


export async function getTeam() {
  return request('/api/team')
}

export async function inviteTeamMember(email, role='Editor') {
  const rows = await request('/api/team/invite', {
    method: 'POST',
    body: JSON.stringify({ email, role })
  })
  return Array.isArray(rows) ? rows[0] || null : rows
}

export async function removeTeamMember(id) {
  return request(`/api/team/member/${id}`, { method: 'DELETE' })
}

export async function revokeTeamInvite(id) {
  return request(`/api/team/invite/${id}`, { method: 'DELETE' })
}

export async function acceptTeamInvite(token) {
  return request('/api/team/accept', {
    method: 'POST',
    body: JSON.stringify({ token })
  })
}


export async function publicCustomerAction(action, payload) {
  const send=async()=>{
    const headers={ 'content-type':'application/json' }
    const token=getToken()
    if(token)headers.authorization=`Bearer ${token}`
    const response=await fetch(`/api/public/customer/${action}`,{method:'POST',headers,body:JSON.stringify(payload)})
    if(response.status===401&&getRefreshToken()){await refreshSession();return send()}
    const data=await response.json().catch(()=>({}))
    if(!response.ok)throw new Error(data?.error||data?.message||'Customer account request failed.')
    return data
  }
  return send()
}
