import { describe, expect, it } from 'vitest'
import { clientAddress, isCloudflareAddress, rateLimitKey } from '../server-network.mjs'

describe('who a request comes from',()=>{
  it('uses the address Railway saw for a visitor who connects directly',()=>{
    expect(clientAddress({'x-real-ip':'203.0.113.7','x-forwarded-for':'203.0.113.7'})).toBe('203.0.113.7')
    expect(clientAddress({'x-forwarded-for':'203.0.113.7'})).toBe('203.0.113.7')
  })
  it('does not believe an address the visitor typed in',()=>{
    // Proxies add the real address at the end; anything before it came from the visitor.
    expect(clientAddress({'x-forwarded-for':'1.1.1.1, 8.8.8.8, 203.0.113.7'})).toBe('203.0.113.7')
    // CF-Connecting-IP only counts when Cloudflare really sent the request.
    expect(clientAddress({'x-real-ip':'203.0.113.7','cf-connecting-ip':'9.9.9.9'})).toBe('203.0.113.7')
    expect(clientAddress({'x-forwarded-for':'9.9.9.9, 203.0.113.7','cf-connecting-ip':'9.9.9.9'})).toBe('203.0.113.7')
  })
  it('tells visitors apart when they arrive through Cloudflare',()=>{
    const viaCloudflare=(visitor:string)=>({'x-real-ip':'172.68.10.20','x-forwarded-for':'172.68.10.20','cf-connecting-ip':visitor})
    expect(clientAddress(viaCloudflare('112.200.5.6'))).toBe('112.200.5.6')
    expect(clientAddress(viaCloudflare('49.145.7.8'))).toBe('49.145.7.8')
    // Cloudflare can also connect over IPv6, and visitors can have IPv6 addresses.
    expect(clientAddress({'x-real-ip':'2400:cb00:12:1::a29e:d2','cf-connecting-ip':'2001:4450:ABCD:1234::5'})).toBe('2001:4450:abcd:1234:0:0:0:5')
    // When Railway keeps Cloudflare's own list, the last entry is still Cloudflare.
    expect(clientAddress({'x-forwarded-for':'112.200.5.6, 162.158.90.1','cf-connecting-ip':'112.200.5.6'})).toBe('112.200.5.6')
  })
  it('ignores a visitor address that is not an address',()=>{
    for(const junk of ['<script>','not-an-ip','1.2.3','999.1.1.1','1.2.3.4.5','::g','1:2:3:4:5:6:7:8:9','a'.repeat(60),'']){
      expect(clientAddress({'x-real-ip':'172.68.10.20','cf-connecting-ip':junk})).toBe('172.68.10.20')
    }
  })
  it('falls back to the connection itself, and never fails',()=>{
    expect(clientAddress({}, '::ffff:127.0.0.1')).toBe('127.0.0.1')
    expect(clientAddress({'x-real-ip':'1.2.3.4, 5.6.7.8'},'10.0.0.9')).toBe('10.0.0.9')
    expect(clientAddress({})).toBe('unknown')
    expect(clientAddress(undefined as any,undefined as any)).toBe('unknown')
    expect(clientAddress({'x-forwarded-for':', ,'},'')).toBe('unknown')
  })
})

describe('Cloudflare addresses',()=>{
  it('knows the edges of each range',()=>{
    const inside=['104.16.0.0','104.23.255.255','104.24.0.0','104.27.255.255','172.64.0.0','172.71.255.255','162.158.0.0','162.159.255.255',
      '198.41.128.0','198.41.255.255','131.0.72.0','131.0.75.255','173.245.48.1','188.114.111.255','103.21.244.0','141.101.127.255',
      '2606:4700::1','2606:4700:ffff:ffff:ffff:ffff:ffff:ffff','2a06:98c0::1','2a06:98c7:ffff::1','2400:cb00:12:1::a29e:d2','2C0F:F248::9']
    const outside=['104.15.255.255','104.28.0.0','172.63.255.255','172.72.0.0','162.157.255.255','162.160.0.0','198.41.127.255','198.42.0.0',
      '131.0.76.0','8.8.8.8','203.0.113.7','10.0.0.1','127.0.0.1','2606:4701::1','2a06:98bf:ffff::1','2a06:98c8::1','2001:db8::1','::1']
    for(const address of inside)expect(isCloudflareAddress(address),address).toBe(true)
    for(const address of outside)expect(isCloudflareAddress(address),address).toBe(false)
  })
  it('says no to anything that is not an address',()=>{
    for(const junk of ['','cloudflare','104.16','104.16.0.0/13','104.16.0.256',null,undefined,{},[]])expect(isCloudflareAddress(junk as any)).toBe(false)
  })
})

describe('what a rate limit counts by',()=>{
  it('counts an IPv4 address on its own',()=>{
    expect(rateLimitKey('203.0.113.7')).toBe('203.0.113.7')
    expect(rateLimitKey('unknown')).toBe('unknown')
  })
  it('counts one IPv6 connection as one visitor, whichever of its addresses is used',()=>{
    const a=rateLimitKey(clientAddress({'x-real-ip':'2001:4450:abcd:1234::5'}))
    const b=rateLimitKey(clientAddress({'x-real-ip':'2001:4450:abcd:1234:9999:8888:7777:6666'}))
    const neighbour=rateLimitKey(clientAddress({'x-real-ip':'2001:4450:abcd:1235::5'}))
    expect(a).toBe('2001:4450:abcd:1234::/64')
    expect(b).toBe(a)
    expect(neighbour).not.toBe(a)
  })
})
