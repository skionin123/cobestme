// Works out who is on the other end of a request, so that rate limits count
// each visitor separately. Kept free of I/O so it can be unit tested
// (see tests/server-network.test.ts).
//
// Railway's edge reports the address that connected to it in X-Real-IP, and as
// the last entry of X-Forwarded-For. When a website is proxied by Cloudflare
// (cobest.me is, and merchants' own domains may be) that address belongs to
// Cloudflare and is shared by many visitors; the visitor's own address is then
// in CF-Connecting-IP. That header is believed only when the request really
// came from Cloudflare, because anyone can add it to a request that is sent
// straight to the Railway address.

// https://www.cloudflare.com/ips/ (last changed on 28 Sep 2023)
const CLOUDFLARE_V4 = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18',
  '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17',
  '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22'
]
const CLOUDFLARE_V6 = [
  '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32',
  '2a06:98c0::/29', '2c0f:f248::/32'
]

/** "203.0.113.7" as a number, or null when it is not an IPv4 address. */
function v4Number(text) {
  const parts = String(text).split('.')
  if (parts.length !== 4) return null
  let value = 0
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part) || Number(part) > 255) return null
    value = value * 256 + Number(part)
  }
  return value
}

/** The eight 16-bit groups of an IPv6 address, or null when it is not one. */
function v6Groups(text) {
  let address = String(text)
  const zone = address.indexOf('%')
  if (zone >= 0) address = address.slice(0, zone)
  if (address.length > 45 || !address.includes(':') || !/^[0-9a-f:.]+$/i.test(address)) return null
  // An IPv4 ending ("::ffff:203.0.113.7") counts as the last two groups.
  const lastColon = address.lastIndexOf(':')
  const ending = address.slice(lastColon + 1)
  if (ending.includes('.')) {
    const v4 = v4Number(ending)
    if (v4 === null) return null
    address = address.slice(0, lastColon + 1) + Math.floor(v4 / 65536).toString(16) + ':' + (v4 % 65536).toString(16)
  }
  const halves = address.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const rest = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const missing = 8 - head.length - rest.length
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...rest]
  const out = []
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/i.test(group)) return null
    out.push(parseInt(group, 16))
  }
  return out
}

/** An address in one fixed spelling, or '' when the text is not an address. */
function canonical(value) {
  const text = String(value ?? '').trim()
  if (!text || text.length > 45) return ''
  if (v4Number(text) !== null) return text.split('.').map(Number).join('.')
  const groups = v6Groups(text)
  if (!groups) return ''
  // "::ffff:203.0.113.7" is the IPv4 address 203.0.113.7.
  if (groups.slice(0, 5).every(group => group === 0) && groups[5] === 0xffff) {
    return [groups[6] >> 8, groups[6] & 255, groups[7] >> 8, groups[7] & 255].join('.')
  }
  return groups.map(group => group.toString(16)).join(':')
}

const v4Ranges = CLOUDFLARE_V4.map(range => {
  const [base, bits] = range.split('/')
  return { base: v4Number(base), size: 2 ** (32 - Number(bits)) }
})
const v6Ranges = CLOUDFLARE_V6.map(range => {
  const [base, bits] = range.split('/')
  return { groups: v6Groups(base), bits: Number(bits) }
})

/** True when the address is one of Cloudflare's own. */
export function isCloudflareAddress(value) {
  const address = canonical(value)
  if (!address) return false
  if (!address.includes(':')) {
    const number = v4Number(address)
    return v4Ranges.some(range => Math.floor(number / range.size) === Math.floor(range.base / range.size))
  }
  const groups = v6Groups(address)
  return v6Ranges.some(range => {
    let bits = range.bits
    for (let index = 0; index < 8 && bits > 0; index++) {
      const take = Math.min(16, bits)
      if (groups[index] >> (16 - take) !== range.groups[index] >> (16 - take)) return false
      bits -= take
    }
    return true
  })
}

/**
 * The visitor's address for a request.
 * `headers` are Node's lower-cased request headers.
 */
export function clientAddress(headers = {}, socketAddress = '') {
  const forwarded = String(headers['x-forwarded-for'] ?? '').split(',')
  const connecting = canonical(headers['x-real-ip']) || canonical(forwarded[forwarded.length - 1]) || canonical(socketAddress)
  const visitor = canonical(headers['cf-connecting-ip'])
  if (visitor && connecting && isCloudflareAddress(connecting)) return visitor
  return connecting || 'unknown'
}

/**
 * What a rate limit counts by. One home or phone connection usually has a
 * whole block of IPv6 addresses, so those are counted together.
 */
export function rateLimitKey(address) {
  const groups = String(address).includes(':') ? v6Groups(address) : null
  return groups ? groups.slice(0, 4).map(group => group.toString(16)).join(':') + '::/64' : String(address)
}
