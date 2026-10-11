import React, {useMemo, useState} from 'react'
import {Package, RefreshCw} from 'lucide-react'
import {updateResource} from './api.js'
import {productSupplier,supplierCatalogSummary} from './supplierOperations.js'

const normalizeName = value => String(value||'').trim().toLowerCase()
  .replace(/[^a-z0-9 -]/g,'').replace(/\s+/g,'-').slice(0,80)

export default function SuppliersManager({products=[],setProducts}) {
  const [selectedId,setSelectedId]=useState('')
  const [supplierName,setSupplierName]=useState('')
  const [filter,setFilter]=useState('all')
  const [query,setQuery]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  const summary=useMemo(()=>supplierCatalogSummary(products),[products])
  const filtered=useMemo(()=>products.filter(product=>{
    const matchSupplier=filter==='all'||productSupplier(product).key===filter
    const q=query.trim().toLowerCase()
    return matchSupplier&&(!q||[product.name,product.sku,productSupplier(product).name].some(x=>String(x||'').toLowerCase().includes(q)))
  }),[products,filter,query])
  const selectProduct=id=>{
    setSelectedId(id)
    const selected=products.find(p=>String(p.id)===String(id))
    const source=productSupplier(selected)
    setSupplierName(source.key==='unassigned'?'':source.name)
    setError('');setMessage('')
  }
  const assign=async()=>{
    const current=products.find(p=>String(p.id)===String(selectedId))
    if(!current)return setError('Choose a product first.')
    const name=normalizeName(supplierName)==='cj-dropshipping'?'cj':normalizeName(supplierName)
    const tags=(Array.isArray(current.tags)?current.tags:[]).filter(x=>!/^supplier:/i.test(String(x)))
    if(name)tags.push('supplier:'+name)
    setBusy(true);setError('');setMessage('')
    try{
      const updated=await updateResource('products',current.id,{tags})
      setProducts(prev=>prev.map(p=>p.id===current.id?updated:p))
      setMessage('Supplier assignment saved. Existing orders are not changed.')
    }catch(error){setError(error.message||'Supplier assignment could not be saved.')}
    finally{setBusy(false)}
  }
  return <div className="page-wrap">
    <div className="page-head"><div><p className="overline">CATALOG OPERATIONS</p><h1>Suppliers</h1><p>Keep product sources organized before buying stock or fulfilling orders.</p></div></div>
    <section className="panel" style={{padding:20,marginBottom:16}}>
      <div className="panel-head"><div><span>Supplier inventory</span><h3>Products by source</h3></div><Package size={19}/></div>
      <p className="field-help">Suppliers are identified from saved product metadata. This is manual supplier tracking: no API synchronization, automatic procurement or supplier payments are performed.</p>
      <div className="table-card"><table><thead><tr><th>Supplier</th><th>Products</th><th>Active</th><th>Out of stock</th></tr></thead><tbody>{summary.map(x=><tr key={x.key}><td><button className="btn btn-secondary" type="button" onClick={()=>setFilter(x.key)}>{x.name}</button></td><td>{x.total}</td><td>{x.active}</td><td>{x.outOfStock}</td></tr>)}</tbody></table>{!summary.length&&<p style={{padding:16}}>Add products and assign their suppliers to begin.</p>}</div>
    </section>
    <section className="panel" style={{padding:20,marginBottom:16}}>
      <div className="panel-head"><div><span>Manual assignment</span><h3>Set a product supplier</h3></div></div>
      {error&&<div className="auth-message auth-error" role="alert">{error}</div>}{message&&<div className="auth-message">{message}</div>}
      <div className="form-grid two">
        <label className="field"><span>Product</span><select aria-label="Product to assign" value={selectedId} onChange={e=>selectProduct(e.target.value)}><option value="">Choose a product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}{p.sku?' · '+p.sku:''}</option>)}</select></label>
        <label className="field"><span>Supplier name</span><input aria-label="Supplier name" value={supplierName} onChange={e=>setSupplierName(e.target.value)} placeholder="Doba, CJ, or custom name" disabled={!selectedId}/></label>
      </div>
      <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}><button className="btn btn-primary" disabled={busy||!selectedId} onClick={assign}>{busy?'Saving…':'Save supplier'}</button><span className="field-help">Leave the supplier blank to mark the product unassigned.</span></div>
    </section>
    <section className="panel" style={{padding:20}}>
      <div className="panel-head"><div><span>Product sourcing</span><h3>Supplier product list</h3></div><button className="btn btn-secondary" onClick={()=>{setFilter('all');setQuery('')}}><RefreshCw size={14}/> Clear filters</button></div>
      <div className="toolbar"><div className="searchbox"><input aria-label="Search supplier products" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products or SKUs"/></div><select aria-label="Filter by supplier" className="toolbar-select" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All suppliers</option>{summary.map(x=><option key={x.key} value={x.key}>{x.name}</option>)}</select></div>
      <div className="table-card"><table><thead><tr><th>Product</th><th>SKU</th><th>Supplier</th><th>Stock</th><th>Status</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td>{p.name}</td><td>{p.sku||'—'}</td><td>{productSupplier(p).name}</td><td>{p.inventory??'—'}</td><td>{p.status||'Draft'}</td></tr>)}</tbody></table>{!filtered.length&&<p style={{padding:16}}>No products match these filters.</p>}</div>
    </section>
  </div>
}
