import React, { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { createResource, deleteResource, updateResource } from './api.js'
import { categoryIncludes, categorySlug, getPrimaryCategories, joinCategory, replaceCategoryPath, splitCategory } from './catalogHierarchy.js'

export default function CatalogCategories({items=[],setItems,products=[],setProducts}){
  const [tab,setTab]=useState('primary')
  const [label,setLabel]=useState('')
  const [parent,setParent]=useState('')
  const [editing,setEditing]=useState(null)
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const primaries=useMemo(()=>getPrimaryCategories(items,products),[items,products])
  const categories=items.filter(x=>x.term_type==='category')
  const brands=items.filter(x=>x.term_type==='brand')
  const visible=tab==='brand'?brands:categories.filter(x=>Boolean(splitCategory(x.name).subcategory)===(tab==='subcategory'))
  const changeTab=next=>{setTab(next);setLabel('');setParent('');setEditing(null);setError('')}
  const edit=item=>{
    const parsed=splitCategory(item.name)
    setEditing(item.id)
    setLabel(tab==='subcategory'?parsed.subcategory:item.name)
    setParent(tab==='subcategory'?parsed.primary:'')
    setError('')
  }
  const save=async()=>{
    const clean=label.trim()
    if(!clean)return setError('A name is required.')
    if(clean.includes(' / '))return setError('Please enter one category name at a time, without " / ".')
    if(tab==='subcategory'&&!parent)return setError('Choose a primary category first.')
    const nextName=tab==='subcategory'?joinCategory(parent,clean):clean
    const termType=tab==='brand'?'brand':'category'
    if(items.some(t=>t.id!==editing&&t.term_type===termType&&t.name.toLowerCase()===nextName.toLowerCase()))
      return setError('This category or brand already exists.')
    setBusy(true);setError('')
    try{
      if(editing){
        const previous=items.find(t=>t.id===editing)
        if(!previous)throw new Error('This category is no longer available.')
        const oldName=previous.name
        const related=tab==='primary'
          ? categories.filter(x=>x.id!==editing&&categoryIncludes(x.name,oldName))
          :[]
        // Category strings and product strings stay in sync without a schema change.
        const updates=[{row:previous,name:nextName},...related.map(row=>({row,name:replaceCategoryPath(row.name,oldName,nextName)}))]
        for(const entry of updates){
          const updated=await updateResource('catalog_terms',entry.row.id,{name:entry.name,slug:categorySlug(entry.name)})
          setItems(prev=>prev.map(t=>t.id===entry.row.id?updated:t))
        }
        const affected=products.filter(p=>tab==='brand'
          ?p.brand===oldName
          :categoryIncludes(p.category||'',oldName))
        for(const product of affected){
          const update=tab==='brand'
            ?{brand:nextName}
            :{category:replaceCategoryPath(product.category||'',oldName,nextName)}
          const updated=await updateResource('products',product.id,update)
          setProducts(prev=>prev.map(p=>p.id===product.id?updated:p))
        }
      }else{
        const created=await createResource('catalog_terms',{term_type:termType,name:nextName,slug:categorySlug(nextName)})
        if(!created?.id)throw new Error('Category was not confirmed by the server.')
        setItems(prev=>[created,...prev])
      }
      setLabel('');setEditing(null)
    }catch(err){setError(err?.message||'Could not save the category. Check for partially saved changes before retrying.')}
    finally{setBusy(false)}
  }
  const remove=async item=>{
    const descendants=tab==='primary'
      ?categories.filter(x=>x.id!==item.id&&categoryIncludes(x.name,item.name))
      :[]
    const used=products.filter(p=>tab==='brand'
      ?p.brand===item.name
      :categoryIncludes(p.category||'',item.name))
    if(descendants.length||used.length){
      setError('This entry is still used by products or subcategories. Reassign or remove them before deleting it.')
      return
    }
    if(!window.confirm('Delete '+item.name+'?'))return
    setBusy(true);setError('')
    try{
      await deleteResource('catalog_terms',item.id)
      setItems(prev=>prev.filter(x=>x.id!==item.id))
    }catch(err){setError(err?.message||'Could not delete the category.')}
    finally{setBusy(false)}
  }
  return <div className="page-wrap">
    <div className="page-head"><div><p className="overline">CATALOG</p><h1>Categories & brands</h1>
      <p>Organize products using primary categories and subcategories, like Home → Lighting.</p></div></div>
    {error&&<div className="auth-message auth-error" role="alert">{error}</div>}
    <div className="tab-row">
      <button className={tab==='primary'?'active':''} onClick={()=>changeTab('primary')}>Primary categories</button>
      <button className={tab==='subcategory'?'active':''} onClick={()=>changeTab('subcategory')}>Subcategories</button>
      <button className={tab==='brand'?'active':''} onClick={()=>changeTab('brand')}>Brands</button>
    </div>
    <section className="panel taxonomy-create">
      <div className="form-grid two">
        {tab==='subcategory'&&<label>Primary category
          <select aria-label="Primary category for subcategory" value={parent} onChange={e=>setParent(e.target.value)} disabled={busy}>
            <option value="">Choose primary category</option>
            {primaries.map(x=><option key={x} value={x}>{x}</option>)}
          </select>
        </label>}
        <label>{editing?'Rename':'New'} {tab==='primary'?'primary category':tab==='subcategory'?'subcategory':'brand'}
          <input aria-label="Category or brand name" value={label} onChange={e=>setLabel(e.target.value)} placeholder={tab==='primary'?'Home':tab==='subcategory'?'Lighting':'Brand name'} disabled={busy}/>
        </label>
        <div className="team-invite-action">
          <button className="btn btn-primary" disabled={busy} onClick={save}><Plus size={15}/>{busy?'Saving…':editing?'Save changes':'Add'}</button>
          {editing&&<button className="btn btn-secondary" onClick={()=>{setEditing(null);setLabel('');setParent('')}}>Cancel</button>}
        </div>
      </div>
    </section>
    {tab==='subcategory'&&!primaries.length&&<p className="field-help">Create a primary category first, then add its subcategories.</p>}
    <div className="taxonomy-grid">{visible.map(item=>{
      const parsed=splitCategory(item.name)
      const count=products.filter(p=>tab==='brand'
        ?p.brand===item.name
        :tab==='primary'?categoryIncludes(p.category||'',item.name):p.category===item.name).length
      return <article className="panel" key={item.id}>
        <div><strong>{tab==='subcategory'?parsed.subcategory:item.name}</strong>
          <span>{tab==='subcategory'?parsed.primary+' · ':''}{count} product{count===1?'':'s'}</span>
        </div>
        <div className="row-actions">
          <button aria-label={'Edit '+item.name} disabled={busy} onClick={()=>edit(item)}><Pencil size={15}/></button>
          <button aria-label={'Delete '+item.name} disabled={busy} onClick={()=>remove(item)}><Trash2 size={15}/></button>
        </div>
      </article>
    })}</div>
    {!visible.length&&<div className="panel"><p>No {tab==='primary'?'primary categories':tab==='subcategory'?'subcategories':'brands'} yet. Add one above.</p></div>}
  </div>
}
