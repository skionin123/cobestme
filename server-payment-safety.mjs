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
