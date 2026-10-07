import { describe, expect, it } from 'vitest'
import { isPlatformHost, publicStoreSlug } from '../src/routing.js'

describe('application routing',()=>{
  it('routes all CoBest application hosts to the platform app',()=>{
    for(const host of ['cobest.me','www.cobest.me','app.cobest.me','localhost','127.0.0.1','cobest-production.up.railway.app']){
      expect(isPlatformHost(host)).toBe(true)
    }
  })

  it('treats merchant domains as public storefront hosts',()=>{
    expect(isPlatformHost('shop.example.com')).toBe(false)
    expect(isPlatformHost('mybrand.com')).toBe(false)
  })

  it('extracts public store slugs only from store routes',()=>{
    expect(publicStoreSlug('/store/demo-shop')).toBe('demo-shop')
    expect(publicStoreSlug('/store/my%20store')).toBe('my store')
    expect(publicStoreSlug('/settings')).toBe('')
  })
})
