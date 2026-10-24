import {describe,it,expect} from 'vitest'
import {getStoreReadiness} from '../src/storeReadiness.js'

describe('store internal setup checklist',()=>{
 it('does not claim the website is ready from empty or placeholder data',()=>{
   const state=getStoreReadiness()
   expect(state.percent).toBe(0)
   expect(state.completed).toBe(0)
   expect(state.manualChecks.length).toBeGreaterThan(0)
 })
 it('requires an active, stocked product instead of any product',()=>{
  const base={data:{businessName:'Studio',websiteType:'Shop'},products:[{status:'Draft',price:12,inventory:8}]}
  const draft=getStoreReadiness(base)
  expect(draft.steps.find(x=>x.title==='Build the catalog')?.done).toBe(false)
  const published=getStoreReadiness({...base,products:[{status:'Active',price:12,inventory:8}]})
  expect(published.steps.find(x=>x.title==='Build the catalog')?.done).toBe(true)
 })
 it('does not require products or refund policies for a portfolio site',()=>{
  const state=getStoreReadiness({
    data:{websiteType:'Portfolio',businessName:'Creative Studio'},
    workspace:{settings:{contactEmail:'hello@example.com',privacyPolicy:'Privacy policy'}},
    products:[]
  })
  expect(state.steps.some(x=>x.title==='Build the catalog')).toBe(false)
  expect(state.steps.find(x=>x.title==='Contact & privacy details')?.done).toBe(true)
  expect(state.manualChecks.some(x=>x.includes('sandbox test order'))).toBe(false)
 })

 it('keeps stock, refund policy, and sandbox checks required for an online store',()=>{
  const state=getStoreReadiness({data:{websiteType:'Online Store'},workspace:{settings:{contactEmail:'hello@example.com',privacyPolicy:'Policy'}},products:[]})
  expect(state.steps.find(x=>x.title==='Build the catalog')?.done).toBe(false)
  expect(state.steps.find(x=>x.title==='Store policies & defaults')?.done).toBe(false)
  expect(state.manualChecks.some(x=>x.includes('sandbox test order'))).toBe(true)
 })

 it('does not mistake a published snapshot for verified checkout or payment',()=>{
  const state=getStoreReadiness({workspace:{is_published:true}})
  expect(state.steps.find(x=>x.title==='Publish the store')?.done).toBe(true)
  expect(state.percent).toBeLessThan(100)
  expect(state.manualChecks.some(x=>x.includes('sandbox'))).toBe(true)
 })
})
