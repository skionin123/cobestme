import { describe, expect, it } from 'vitest'
import { parseCsvRecords, planProductCsvImport } from '../src/productImport.js'

describe('supplier-aware product import', () => {
  it('parses quoted commas, embedded line breaks, BOM and escaped quotes', () => {
    const rows=parseCsvRecords('\uFEFFSKU,Name,Description\r\nA-1,"Lamp, large","He said ""hello""\nagain"\r\n')
    expect(rows).toEqual([['SKU','Name','Description'],['A-1','Lamp, large','He said "hello"\nagain']])
  })
  it('updates by SKU without wiping missing fields', () => {
    const plan=planProductCsvImport('SKU,Quantity,Price\nabc,7,15\n',
      [{id:3,sku:'ABC',name:'Lamp',description:'Keep',price:12,inventory:2,status:'Active'}],'Doba')
    expect(plan.counts).toMatchObject({create:0,update:1,error:0})
    expect(plan.rows[0].payload).toMatchObject({price:15,inventory:7,tags:['supplier:doba']})
    expect(plan.rows[0].payload).not.toHaveProperty('description')
    expect(plan.rows[0].payload).not.toHaveProperty('status')
  })
  it('never silently overwrites duplicates, conflicting existing SKUs or invalid numbers', () => {
    const duplicate=planProductCsvImport('SKU,Name,Price\nX,First,10\nX,Second,5',[])
    expect(duplicate.hasErrors).toBe(true)
    expect(duplicate.rows[1].action).toBe('error')
    const conflicting=planProductCsvImport('SKU,Quantity\nX,4',[{id:1,sku:'X'},{id:2,sku:'x'}])
    expect(conflicting.hasErrors).toBe(true)
    const bad=planProductCsvImport('SKU,Name,Price\nZ,New,-2',[])
    expect(bad.hasErrors).toBe(true)
  })
  it('allows new products, defaulting to Draft, but refuses incomplete new products', () => {
    const plan=planProductCsvImport('SKU,Product Name,Price,Available Stock\nT,Table,50,2')
    expect(plan.rows[0].payload).toMatchObject({name:'Table',price:50,inventory:2,status:'Draft'})
    expect(planProductCsvImport('SKU,Quantity\nT,3').hasErrors).toBe(true)
  })
  it('does not confuse supplier collisions or variant SKUs with products', () => {
    const product={id:10,sku:'ROOT',name:'Shirt',price:300,inventory:5,
      tags:['supplier:doba'],variants:[{sku:'ROOT-BLACK',title:'Black',inventory:3}]}
    const supplierCollision=planProductCsvImport('SKU,Quantity\nROOT,2', [product], 'CJ')
    expect(supplierCollision.hasErrors).toBe(true)
    expect(supplierCollision.rows[0].message).toMatch(/another supplier/)
    const customCollision=planProductCsvImport('SKU,Quantity\nROOT,2',[{...product,tags:['supplier:local-distributor']}],'Doba')
    expect(customCollision.hasErrors).toBe(true)
    const variantCollision=planProductCsvImport('SKU,Name,Price\nROOT-BLACK,Variant,99', [product], 'Doba')
    expect(variantCollision.hasErrors).toBe(true)
    expect(variantCollision.rows[0].message).toMatch(/variant/)
    const valid=planProductCsvImport('SKU,Quantity\nROOT,2',[product],'Doba')
    expect(valid.counts.update).toBe(1)
  })
  it('flags malformed column counts before mutating the catalog',()=>{
    const plan=planProductCsvImport('SKU,Name,Price\nA,Product,100,unexpected',[])
    expect(plan.hasErrors).toBe(true)
    expect(plan.rows[0].message).toMatch(/columns/)
  })

  it('does not let a generic CSV impersonate another supplier through tags',()=>{
    const plan=planProductCsvImport('SKU,Name,Price,Tags\nA,Lamp,20,supplier:cj|featured',[],'Generic')
    expect(plan.hasErrors).toBe(false)
    expect(plan.rows[0].payload.tags).toEqual(['featured'])
    const update=planProductCsvImport('SKU,Inventory,Tags\nB,1,supplier:cj|featured',
      [{id:1,sku:'B',name:'Table',inventory:1,tags:['supplier:doba']}],'Generic')
    expect(update.rows[0].payload.tags).toEqual(['supplier:doba','featured'])
  })

  it('handles empty unchanged updates and enforces safety limits', () => {
    const noChange=planProductCsvImport('SKU,Quantity\nX,2',[{id:1,sku:'X',inventory:2}])
    expect(noChange.counts.skip).toBe(1)
    expect(()=>parseCsvRecords('SKU,Name\nX,"unfinished')).toThrow(/unclosed quoted field/)
    expect(()=>parseCsvRecords('SKU\nX\nY',1)).toThrow(/limit exceeded/)
  })
})
