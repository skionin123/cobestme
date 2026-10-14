import {createHmac,timingSafeEqual} from 'node:crypto'

/**
 * Check the Stripe v1 signature(s) of the raw request body. Stripe can include
 * multiple v1 entries during key rotation. Never trust a parsed JSON body or
 * an unsigned client redirect as proof that an order was paid.
 */
export function verifyStripeSignature(raw,header,secret,now=Date.now()) {
  if (!secret || !header || !Buffer.isBuffer(raw)) return false
  const parts=String(header).split(',').map(piece=>{
    const index=piece.indexOf('=')
    return index<0?['','']:[piece.slice(0,index).trim(),piece.slice(index+1).trim()]
  })
  const timestampValue=parts.find(([key])=>key==='t')?.[1]
  if (!/^\d{1,12}$/.test(timestampValue||'')) return false
  const timestamp=Number(timestampValue)
  if (!Number.isSafeInteger(timestamp)||Math.abs(now/1000-timestamp)>300) return false
  const signatures=parts.filter(([key,value])=>key==='v1'&&/^[0-9a-f]{64}$/i.test(value)).map(([,value])=>value)
  if (!signatures.length) return false
  const expected=createHmac('sha256',secret).update(`${timestampValue}.`).update(raw).digest()
  return signatures.some(signature=>{
    try{return timingSafeEqual(expected,Buffer.from(signature,'hex'))}
    catch{return false}
  })
}

/**
 * Derive merchant order payment transitions ONLY from signed Stripe webhook
 * events. Stripe "session completed" can still mean unpaid for delayed methods.
 * The caller must verify the webhook signature before using this function.
 */
export function stripeOrderTransition(event) {
  const session=event?.data?.object||{}
  const orderId=Number(session?.metadata?.order_id)
  if(session.mode!=='payment'||!session.id||!Number.isSafeInteger(orderId)||orderId<1) return null
  const type=event?.type
  if((type==='checkout.session.completed'||type==='checkout.session.async_payment_succeeded') && session.payment_status==='paid') {
    return {orderId,status:'Paid',provider:'stripe',reference:session.id}
  }
  if((type==='checkout.session.expired'||type==='checkout.session.async_payment_failed')&&session.payment_status!=='paid') {
    return {orderId,status:'Failed',provider:'stripe',reference:session.id}
  }
  return null
}

/**
 * PayPal capture responses must report a completed capture, not merely a
 * completed approval/redirect. The supplier order's DB amount must still be
 * reconciled separately before enabling live multi-merchant payments.
 */
export function paypalCapturedOrder(data,requestedOrderId) {
  if(!data||data.status!=='COMPLETED'||!data.id||String(data.id)!==String(requestedOrderId))return null
  const units=Array.isArray(data.purchase_units)?data.purchase_units:[]
  if(units.length!==1)return null
  const unit=units[0]
  const orderId=Number(unit?.custom_id)
  if(!Number.isSafeInteger(orderId)||orderId<1)return null
  const captures=Array.isArray(unit?.payments?.captures)?unit.payments.captures:[]
  if(captures.length!==1||captures[0]?.status!=='COMPLETED'||!captures[0]?.id)return null
  const amount=captures[0]?.amount
  if(!amount||!/^[A-Z]{3}$/.test(String(amount.currency_code||'')))return null
  const paid=Number(amount.value)
  if(!Number.isFinite(paid)||paid<=0)return null
  if(unit.amount){
    if(unit.amount.currency_code!==amount.currency_code)return null
    if(Math.abs(Number(unit.amount.value)-paid)>0.001)return null
  }
  return {orderId,status:'Paid',provider:'paypal',reference:data.id,captureId:captures[0].id,amount:paid,currency:amount.currency_code}
}
