import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const server=readFileSync(new URL('../server.mjs',import.meta.url),'utf8')
const api=readFileSync(new URL('../src/api.js',import.meta.url),'utf8')
const admin=readFileSync(new URL('../src/AdminAdvanced.jsx',import.meta.url),'utf8')
const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8')

function routeBlock(start:string,end:string){
  const s=server.indexOf(start)
  const e=server.indexOf(end,s+start.length)
  expect(s).toBeGreaterThanOrEqual(0)
  expect(e).toBeGreaterThan(s)
  return server.slice(s,e)
}

describe('server authorization guards',()=>{
  it('keeps Viewer accounts read-only for publish and unpublish',()=>{
    const publish=routeBlock("if (url.pathname === '/api/publish'","if (url.pathname === '/api/unpublish'")
    const unpublish=routeBlock("if (url.pathname === '/api/unpublish'","if (url.pathname === '/api/media/upload'")
    expect(publish).toContain("if(role==='Viewer')return sendJson(res,403")
    expect(unpublish).toContain("if(role==='Viewer')return sendJson(res,403")
  })

  it('prevents Viewer media uploads',()=>{
    const media=routeBlock("if (url.pathname === '/api/media/upload'","const campaignSend")
    expect(media).toContain("if(role==='Viewer')return sendJson(res,403")
  })

  it('revokes the remote auth session during logout and still clears local tokens',()=>{
    expect(server).toContain("url.pathname === '/api/auth/logout'")
    expect(server).toContain("supabaseFetch('/auth/v1/logout'")
    expect(api).toContain("await fetch('/api/auth/logout'")
    expect(api).toContain('localStorage.removeItem(REFRESH_KEY)')
  })

  it('does not expose the stray campaign send action in Discounts',()=>{
    const start=admin.indexOf('export function DiscountsManager')
    const end=admin.indexOf('export function CampaignsManager',start)
    const block=admin.slice(start,end)
    expect(block).not.toContain('sendCampaign(')
    expect(block).not.toContain('Send now')
  })

  it('protects autosave when critical cloud startup fails',()=>{
    expect(app).toContain('Promise.allSettled')
    expect(app).toContain("Workspace sync failed. Editing autosave is paused")
    expect(app).toContain('if(!cloudReady || !isAuthenticated() || !workspace?.id) return')
    expect(app).not.toContain('.catch(()=>setCloudReady(true))')
  })

  it('limits billing management to Owner or Admin',()=>{
    const portal=routeBlock("if (url.pathname === '/api/billing/portal'","if (url.pathname === '/api/me'")
    expect(portal).toContain("if(!['Owner','Admin'].includes(role))return sendJson(res,403")
  })
})
