import {describe,it,expect} from 'vitest'
import {stripeOrderTransition} from '../server-payment-safety.mjs'

const event=(type:string,payment_status:string,metadata:Record<string,string>={order_id:'123'})=>({
 type,data:{object:{id:'cs_123',mode:'payment',payment_status,metadata}}
})

describe('stripe signed event settlement rules',()=>{
 it('keeps delayed method checkout Pending until Stripe says paid',()=>{
  expect(stripeOrderTransition(event('checkout.session.completed','unpaid'))).toBe(null)
  expect(stripeOrderTransition(event('checkout.session.completed','paid'))).toMatchObject({orderId:123,status:'Paid'})
 })
 it('handles async success and failure without marking unpaid as successful',()=>{
  expect(stripeOrderTransition(event('checkout.session.async_payment_succeeded','paid'))?.status).toBe('Paid')
  expect(stripeOrderTransition(event('checkout.session.async_payment_failed','unpaid'))?.status).toBe('Failed')
  expect(stripeOrderTransition(event('checkout.session.expired','paid'))).toBe(null)
 })
 it('rejects subscription or missing/malformed order metadata',()=>{
  expect(stripeOrderTransition({...event('checkout.session.completed','paid'),data:{object:{id:'cs_1',mode:'subscription',metadata:{order_id:'1'},payment_status:'paid'}}})).toBe(null)
  expect(stripeOrderTransition(event('checkout.session.completed','paid',{}))).toBe(null)
  expect(stripeOrderTransition(event('checkout.session.completed','paid',{order_id:'NaN'}))).toBe(null)
 })
})
