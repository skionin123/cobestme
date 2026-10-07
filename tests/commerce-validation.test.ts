import { describe, expect, it } from 'vitest'
import { calculateCheckout, isValidEmail, normalizeFutureDate, normalizeReviewRating, validateResourceWrite } from '../commerce-validation.mjs'

describe('public and commerce validation',()=>{
  it('validates email, review rating, and future booking dates',()=>{
    expect(isValidEmail('buyer@example.com')).toBe(true)
    expect(isValidEmail('buyer@')).toBe(false)
    expect(normalizeReviewRating(5)).toEqual({ok:true,value:5})
    expect(normalizeReviewRating(6).ok).toBe(false)
    expect(normalizeReviewRating(2.5).ok).toBe(false)
    expect(normalizeFutureDate('2027-01-01T10:00:00Z',Date.parse('2026-01-01T00:00:00Z')).ok).toBe(true)
    expect(normalizeFutureDate('not-a-date').ok).toBe(false)
    expect(normalizeFutureDate('2025-01-01T00:00:00Z',Date.parse('2026-01-01T00:00:00Z')).ok).toBe(false)
  })

  it('rejects malformed checkout quantities instead of producing NaN totals',()=>{
    const store={products:[{id:1,name:'Lamp',status:'Active',price:100,inventory:5}],discounts:[],settings:{shippingFlat:20,taxRate:10}}
    const bad=calculateCheckout(store,{items:[{product_id:1,quantity:'not-a-number'}]})
    expect(bad.items).toHaveLength(0)
    expect(bad.inputIssues).toHaveLength(1)
    expect(Number.isFinite(bad.total)).toBe(true)

    const fractional=calculateCheckout(store,{items:[{product_id:1,quantity:1.5}]})
    expect(fractional.inputIssues).toHaveLength(1)

    const good=calculateCheckout(store,{items:[{product_id:1,quantity:2}]})
    expect(good.inputIssues).toHaveLength(0)
    expect(good.inventoryIssues).toHaveLength(0)
    expect(good.subtotal).toBe(200)
    expect(good.total).toBe(240)
  })

  it('reports inventory conflicts without creating invalid line items',()=>{
    const store={products:[{id:7,name:'Chair',status:'Active',price:500,inventory:1}],settings:{}}
    const result=calculateCheckout(store,{items:[{product_id:7,quantity:2}]})
    expect(result.items).toHaveLength(0)
    expect(result.inventoryIssues[0]).toMatchObject({product_id:7,requested:2,available:1})
  })

  it('validates admin product, customer, and discount writes',()=>{
    expect(validateResourceWrite('products',{name:'',price:10,inventory:1})).toBe('Product name is required.')
    expect(validateResourceWrite('products',{name:'Good',price:-1,inventory:1})).toMatch(/price/i)
    expect(validateResourceWrite('products',{name:'Good',price:10,inventory:1.2})).toMatch(/inventory/i)
    expect(validateResourceWrite('customers',{name:'Buyer',email:'bad'})).toMatch(/email/i)
    expect(validateResourceWrite('discounts',{code:'SAVE',kind:'percent',value:101,min_spend:0})).toMatch(/100/)
    expect(validateResourceWrite('discounts',{code:'SAVE',kind:'fixed',value:500,min_spend:0})).toBe('')
  })
})
