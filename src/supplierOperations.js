/**
 * Supplier identification from product metadata already stored in the catalog.
 * No provider credentials or supplier APIs are needed for manual fulfillment.
 */
export function productSupplier(product) {
  const tags=Array.isArray(product?.tags)?product.tags:[]
  const value=tags.find(tag=>/^supplier:/i.test(String(tag)))
  if(!value)return {key:'unassigned',name:'Not assigned'}
  const key=String(value).slice('supplier:'.length).trim().toLowerCase()
  if(key==='doba')return {key,name:'Doba'}
  if(key==='cj')return {key,name:'CJ Dropshipping'}
  return {key:'unassigned',name:'Not assigned'}
}

export function orderSupplierItems(items=[],products=[]) {
  const byId=new Map(products.map(p=>[String(p.id),p]))
  return (items||[]).map(item=>{
    const product=byId.get(String(item.product_id))
    const supplier=productSupplier(product)
    return {...item,sku:product?.sku||item.sku||'',supplier:supplier.name,supplierKey:supplier.key}
  })
}

export function supplierCatalogSummary(products=[]) {
  const result=new Map()
  for(const p of products){
    const {key,name}=productSupplier(p)
    const current=result.get(key)||{key,name,total:0,active:0,outOfStock:0}
    current.total++
    if(p.status==='Active')current.active++
    if(p.inventory!=null&&Number(p.inventory)<=0)current.outOfStock++
    result.set(key,current)
  }
  return Array.from(result.values()).sort((a,b)=>b.total-a.total)
}
