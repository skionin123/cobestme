import {describe,it,expect} from 'vitest'
import {createHmac} from 'node:crypto'
import {stripeOrderTransition,verifyStripeSignature} from '../server-payment-safety.mjs'

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

describe('Stripe raw-body webhook authentication',()=>{
  const secret='whsec_test_only'
  const raw=Buffer.from('{"id":"evt_test","type":"checkout.session.completed"}')
  const ts=1700000000
  const hash=createHmac('sha256',secret).update(`${ts}.`).update(raw).digest('hex')
  it('accepts exact raw body with a correct v1 signature',()=>{
    expect(verifyStripeSignature(raw,`t=${ts},v1=${hash}`,secret,ts*1000)).toBe(true)
  })
  it('supports rotated signatures without accepting malformed ones',()=>{
    const multiple=`t=${ts},v1=${'0'.repeat(64)},v1=${hash}`
    expect(verifyStripeSignature(raw,multiple,secret,ts*1000)).toBe(true)
    expect(verifyStripeSignature(raw,`t=${ts},v1=invalid`,secret,ts*1000)).toBe(false)
  })
  it('rejects altered content, expired signatures and missing configuration',()=>{
    expect(verifyStripeSignature(Buffer.from('changed'),`t=${ts},v1=${hash}`,secret,ts*1000)).toBe(false)
    expect(verifyStripeSignature(raw,`t=${ts},v1=${hash}`,secret,(ts+301)*1000)).toBe(false)
    expect(verifyStripeSignature(raw,`t=${ts},v1=${hash}`,'',ts*1000)).toBe(false)
    expect(verifyStripeSignature(raw,`t=1e9,v1=${hash}`,secret,ts*1000)).toBe(false)
  })
})
