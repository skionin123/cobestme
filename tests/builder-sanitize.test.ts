import { describe, expect, it } from 'vitest'
import { clampInt, safeHref, sanitizeCustomCss } from '../src/builder/sanitize'

describe('links shown outside the sandboxed website frame',()=>{
  it('keeps ordinary web, page, email and phone links',()=>{
    for(const href of ['https://example.com/a?b=1','http://example.com','/about','#contact','about.html','mailto:hi@example.com','tel:+639001234567','//cdn.example.com/x'])
      expect(safeHref(href)).toBe(href)
  })
  it('replaces script-capable and unknown schemes with "#"',()=>{
    for(const href of ['javascript:alert(1)',' JaVaScRiPt:alert(1)','java\tscript:alert(1)','\u0001javascript:alert(1)','data:text/html,<script>alert(1)</script>','vbscript:x','blob:https://cobest.me/1','file:///etc/passwd','ms-msdt:/id'])
      expect(safeHref(href)).toBe('#')
  })
  it('uses the fallback for empty values',()=>{
    expect(safeHref('')).toBe('#')
    expect(safeHref(null)).toBe('#')
    expect(safeHref(undefined,'/')).toBe('/')
  })
})

describe('owner-written CSS on the storefront page',()=>{
  it('keeps normal styling',()=>{
    const css='.public-hero h1{color:#832353;font-size:48px}@media(max-width:600px){.public-hero{padding:12px}}'
    expect(sanitizeCustomCss(css)).toBe(css)
  })
  it('cannot load anything from the network',()=>{
    const attacks=[
      'input[value^="a"]{background:url(https://evil.example/a)}',
      'input[value^="a"]{background:URL( "https://evil.example/a" )}',
      '@import "https://evil.example/x.css";',
      '@IMPORT url(https://evil.example/x.css);',
      'a{background:image-set("https://evil.example/a.png" 1x)}',
      'a{background:-webkit-image-set(url(https://evil.example/a.png) 1x)}',
      '@font-face{font-family:x;src:url(https://evil.example/f.woff)}',
      'a{background:u\\72l(https://evil.example/a)}',
      'a{background:\\75rl(https://evil.example/a)}',
      'a{cursor:url(https://evil.example/c.cur),auto}',
    ]
    for(const attack of attacks){
      const out=sanitizeCustomCss(attack)
      expect(out).not.toMatch(/(^|[^a-z-])(url|src|image-set)\(/i)
      expect(out).not.toMatch(/@import|@font-face/i)
      expect(out).not.toContain('\\')
    }
  })
  it('cannot close the style element or run legacy script hooks',()=>{
    expect(sanitizeCustomCss('a{color:red}</style><script>alert(1)</script>')).not.toContain('<')
    expect(sanitizeCustomCss('a{width:expression(alert(1))}')).not.toContain('expression(')
    expect(sanitizeCustomCss('a{behavior:url(x.htc)}')).not.toMatch(/behavior\s*:/)
  })
  it('limits the size and tolerates missing values',()=>{
    expect(sanitizeCustomCss('a'.repeat(50000))).toHaveLength(20000)
    expect(sanitizeCustomCss(undefined)).toBe('')
  })
})

describe('numbers that drive layout',()=>{
  it('stay inside their limits',()=>{
    expect(clampInt(3,1,6)).toBe(3)
    expect(clampInt('1e9',1,6)).toBe(6)
    expect(clampInt(-5,1,6)).toBe(1)
    expect(clampInt('abc',1,6,2)).toBe(2)
    expect(clampInt(2.9,1,6)).toBe(2)
  })
})
