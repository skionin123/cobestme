import {describe,it,expect} from 'vitest'
import {productSupplier,orderSupplierItems,supplierCatalogSummary} from '../src/supplierOperations.js'

describe('merchant supplier order tools',()=>{
 it('identifies supplier from explicit imported product metadata',()=>{
  expect(productSupplier({tags:['home','supplier:doba']})).toMatchObject({key:'doba',name:'Doba'})
  expect(productSupplier({tags:['supplier:CJ']})).toMatchObject({key:'cj',name:'CJ Dropshipping'})
  expect(productSupplier({tags:['suppliers:unknown']})).toMatchObject({key:'unassigned'})
 })
 it('shows an unassigned source instead of guessing the supplier',()=>{
  expect(orderSupplierItems([{product_id:4,quantity:2},{product_id:7,quantity:1}],
    [{id:4,sku:'SK-4',tags:['supplier:doba']}]))
    .toMatchObject([{sku:'SK-4',supplier:'Doba'},{supplier:'Not assigned'}])
 })
 it('counts active and out-of-stock products without using paid-order information',()=>{
  const summary=supplierCatalogSummary([{status:'Active',inventory:0,tags:['supplier:cj']},
    {status:'Draft',inventory:8,tags:['supplier:cj']},{status:'Active',inventory:5,tags:[]}])
  expect(summary[0]).toMatchObject({name:'CJ Dropshipping',total:2,active:1,outOfStock:1})
 })
})
