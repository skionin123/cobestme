import { describe, expect, it } from 'vitest'
import { calculateCheckout } from '../server-commerce.mjs'

const store={
  products:[
    {id:1,name:'Starter',status:'Active',price:100,inventory:5},
    {id:2,name:'Hidden',status:'Draft',price:50,inventory:5},
  ],
  discounts:[
    {code:'SAVE10',active:true,kind:'percent',value:10,min_spend:0,usage_limit:10,used_count:1},
    {code:'FIXED',active:true,kind:'fixed',value:30,min_spend:100},
  ],
  settings:{shippingFlat:20,taxRate:12}
}

describe('checkout calculation',()=>{
  it('normalizes malformed quantities instead of producing NaN totals',()=>{
    const x=calculateCheckout(store,{items:[{product_id:1,quantity:'not-a-number'}]})
    expect(x.items[0].quantity).toBe(1)
    expect(x.subtotal).toBe(100)
    expect(x.total).toBe(132)
    expect(Number.isFinite(x.total)).toBe(true)
  })

  it('rejects quantities above available inventory',()=>{
    const x=calculateCheckout(store,{items:[{product_id:1,quantity:6}]})
    expect(x.items).toHaveLength(0)
    expect(x.inventoryIssues).toEqual([{product_id:1,name:'Starter',requested:6,available:5}])
  })

  it('caps quantities and discounts safely',()=>{
    const x=calculateCheckout(
      {...store,products:[{id:1,name:'Starter',status:'Active',price:100,inventory:null}],discounts:[{code:'ALL',active:true,kind:'percent',value:250}]},
      {items:[{product_id:1,quantity:500}],discount_code:'all'}
    )
    expect(x.items[0].quantity).toBe(99)
    expect(x.discountAmount).toBe(9900)
    expect(x.total).toBe(20)
  })

  it('applies valid fixed discounts before tax and adds shipping',()=>{
    const x=calculateCheckout(store,{items:[{product_id:1,quantity:2}],discount_code:'FIXED'})
    expect(x.subtotal).toBe(200)
    expect(x.discountAmount).toBe(30)
    expect(x.shippingAmount).toBe(20)
    expect(x.taxAmount).toBeCloseTo(20.4)
    expect(x.total).toBeCloseTo(210.4)
  })

  it('ignores inactive, expired, over-limit, and invalid discounts',()=>{
    const now=Date.parse('2026-10-07T00:00:00Z')
    for(const d of [
      {code:'X',active:false,kind:'percent',value:10},
      {code:'X',active:true,kind:'percent',value:10,expires_at:'2026-10-06T00:00:00Z'},
      {code:'X',active:true,kind:'percent',value:10,usage_limit:1,used_count:1},
      {code:'X',active:true,kind:'percent',value:'bad'},
    ]){
      const x=calculateCheckout({...store,discounts:[d]},{items:[{product_id:1,quantity:1}],discount_code:'X'},now)
      expect(x.discountAmount).toBe(0)
      expect(x.discountCode).toBe('')
    }
  })
})
