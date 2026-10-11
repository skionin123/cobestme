import {describe,it,expect} from 'vitest'
import {readFileSync} from 'node:fs'

const server=readFileSync(new URL('../server.mjs',import.meta.url),'utf8')
const admin=readFileSync(new URL('../src/AdminAdvanced.jsx',import.meta.url),'utf8')

describe('CoBest security regression guards',()=>{
 it('does not silently select a different site when a requested site is inaccessible',()=>{
  const selection=server.slice(server.indexOf('async function resolveSiteId'),server.indexOf('async function rpc('))
  expect(selection).toContain('return found.ok&&Array.isArray(found.data)')
  expect(server).toContain('Selected site was not found or access was denied.')
 })
 it('does not allow merchants to create fake paid status via order PATCH',()=>{
  expect(server).toContain("Object.hasOwn(next,'payment_status')")
  expect(server).toContain('Payment status cannot be manually changed.')
  expect(server).toContain('New orders must start Pending until payment is verified by the provider.')
  expect(admin).toContain('Payment status (provider verified; read-only)')
  expect(admin).not.toContain('const payload={payment_status:draft.payment_status')
 })
 it('keeps merchant checkout opt-in and separate from platform subscription configuration',()=>{
  expect(server).toContain("COBEST_ENABLE_COMMERCE_PAYMENTS === 'true'")
  expect(server).toContain('stripe: canStripeCommerce()')
  expect(server).toContain('paypal: canPayPalCommerce()')
  expect(server).toContain('stripe_billing: Boolean(stripeSecret && stripeWebhookSecret)')
  expect(server).toContain("requestedProvider==='stripe'&&!canStripeCommerce()")
 })
 it('does not create pending orders for unsupported or missing online payment configurations',()=>{
  expect(server).toContain("Unsupported payment provider.")
  expect(server).toContain('Card payments are not configured for this store.')
  expect(server).toContain('PayPal is not configured for this store.')
  expect(server.indexOf('const requestedProvider=String(body.payment_provider')).toBeLessThan(server.indexOf("const result = await rpc('public_place_order'"))
 })
})
