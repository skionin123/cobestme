export function isPlatformHost(hostname=''){
  const host=String(hostname).toLowerCase().split(':')[0]
  return host==='cobest.me'
    ||host==='www.cobest.me'
    ||host==='app.cobest.me'
    ||host==='localhost'
    ||host==='127.0.0.1'
    ||host.endsWith('.up.railway.app')
}

export function publicStoreSlug(pathname=''){
  const match=String(pathname).match(/^\/store\/([^/]+)/)
  return match?decodeURIComponent(match[1]):''
}
