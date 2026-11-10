import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { compileProjectCss, renderNodeHtml, safeUrl, sanitizeCssValue } from '../src/builder/compiler'
import { createDefaultProject } from '../src/builder/defaultProject'
import type { BuilderNode } from '../src/builder/types'

const server=readFileSync(new URL('../server.mjs',import.meta.url),'utf8')

const node=(patch:Partial<BuilderNode>):BuilderNode=>({
  id:'n1',type:'link',tag:'a',name:'Link',children:[],classes:[],attributes:{},content:'Go',...patch,
})

describe('published HTML cannot be turned into script',()=>{
  const project=createDefaultProject()

  it('drops javascript: and data:text links',()=>{
    expect(renderNodeHtml(node({attributes:{href:'javascript:alert(1)'}}),project)).not.toContain('javascript')
    expect(renderNodeHtml(node({attributes:{href:' JaVa\tScRiPt:alert(1)'}}),project)).not.toMatch(/script:/i)
    expect(renderNodeHtml(node({attributes:{href:'data:text/html,<script>alert(1)</script>'}}),project)).not.toContain('data:')
    expect(renderNodeHtml(node({attributes:{href:'https://example.com'}}),project)).toContain('href="https://example.com"')
  })

  it('allows data:image only for image sources',()=>{
    expect(safeUrl('data:image/png;base64,AAAA',true)).toBe('data:image/png;base64,AAAA')
    expect(safeUrl('data:image/svg+xml;base64,AAAA',true)).toBe('')
    expect(safeUrl('data:image/png;base64,AAAA',false)).toBe('')
  })

  it('rejects attribute names that would inject event handlers',()=>{
    const html=renderNodeHtml(node({attributes:{'x onmouseover=alert(1) y':'1',onclick:'alert(1)',srcdoc:'<b>'}}),project)
    expect(html).not.toContain('onmouseover')
    expect(html).not.toContain('onclick')
    expect(html).not.toContain('srcdoc')
  })

  it('stops CSS values from closing the style element',()=>{
    expect(sanitizeCssValue('red}</style><script>alert(1)</script>')).not.toMatch(/[<>{}]/)
    const p=createDefaultProject()
    p.styles.evil={desktop:{none:{color:'red}</style><img src=x onerror=alert(1)>'}}}
    p.globals.colors['x}</style>']='blue'
    const css=compileProjectCss(p)
    expect(css).not.toContain('</style>')
    expect(css).not.toContain('<img')
  })
})

describe('server hardening',()=>{
  it('sends security headers on every response',()=>{
    for(const header of ['x-content-type-options','referrer-policy','x-frame-options','strict-transport-security','content-security-policy'])
      expect(server).toContain(`'${header}'`)
  })
  it('rate limits login, signup, reset and public forms',()=>{
    for(const route of ['/api/auth/login','/api/auth/signup','/api/auth/reset','/api/public/contact','/api/public/booking','/api/public/checkout'])
      expect(server).toContain(`'${route}': [`)
    expect(server).toContain('return sendJson(res, 429')
  })
  it('never lets the browser set its own billing plan',()=>{
    expect(server).not.toContain('plan: body.plan')
  })
  it('only accepts safe media types for public storage',()=>{
    expect(server).toContain('allowedMedia')
    expect(server).not.toMatch(/allowedMedia = new Set\([^)]*svg/)
    expect(server).not.toMatch(/allowedMedia = new Set\([^)]*html/)
  })
  it('hides invitation tokens from non-admin members',()=>{
    expect(server).toContain("canManage ? inv : { ...inv, token: undefined }")
  })
  it('does not trust the Host header for email and payment links',()=>{
    expect(server).toContain('trustedHosts')
  })
  it('keeps static files inside the build directory',()=>{
    expect(server).toContain('!filePath.startsWith(root + sep)')
  })
  it('does not leak internal error messages',()=>{
    expect(server).not.toContain("error: error?.message || 'Server error'")
  })
})
