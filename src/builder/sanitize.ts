// Guards for content that is rendered outside the sandboxed website frame,
// i.e. directly in the dashboard or the storefront page. Anything here runs on
// the same origin as a signed-in owner, so links and CSS must not be able to
// run script or send data elsewhere.
import { safeUrl } from './compiler'

const SAFE_SCHEMES=new Set(['http','https','mailto','tel','sms','whatsapp','viber','tg','skype','fb-messenger','line','geo'])

/**
 * A link address that is safe to put in `href`. Relative addresses and a short
 * list of ordinary schemes are allowed; `javascript:`, `data:` and anything
 * unknown fall back to "#".
 */
export function safeHref(value:unknown,fallback='#'):string{
  const trimmed=String(value??'').trim()
  if(!trimmed)return fallback
  // Browsers ignore control characters and spaces inside a scheme.
  const compact=trimmed.replace(/[\u0000- ]+/g,'')
  const scheme=compact.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/)
  if(scheme&&!SAFE_SCHEMES.has(scheme[1].toLowerCase()))return fallback
  if(safeUrl(trimmed)==='')return fallback
  return trimmed
}

/**
 * Owner-written CSS for the storefront page. It may restyle the page but may
 * not load anything from the network: a stylesheet that can request addresses
 * based on what a visitor types can leak passwords and order details.
 *
 * Escapes are removed first so a blocked name cannot be spelled another way.
 */
export function sanitizeCustomCss(value:unknown,maxLength=20000):string{
  return String(value??'').slice(0,maxLength)
    .replace(/[\\<\u0000]/g,'')
    .replace(/@(import|font-face|namespace|document)/gi,'@blocked')
    .replace(/(url|src|image-set|image|cross-fade|element)\(/gi,'blocked(')
    .replace(/expression\(|behavior\s*:|-moz-binding/gi,'blocked')
}

/** A whole number between two limits, for values that drive loops and layout. */
export function clampInt(value:unknown,min:number,max:number,fallback=min):number{
  const number=Math.floor(Number(value))
  if(!Number.isFinite(number))return fallback
  return Math.min(max,Math.max(min,number))
}
