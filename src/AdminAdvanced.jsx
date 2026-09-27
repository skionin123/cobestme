import React, { useEffect, useMemo, useState } from 'react'
import { Check, Copy, ExternalLink, FileText, Image as ImageIcon, Package, Pencil, Plus, RefreshCw, Search, Trash2, Upload, Users, X } from 'lucide-react'
import { createResource, deleteResource, getTeam, inviteTeamMember, publishStore, removeTeamMember, revokeTeamInvite, unpublishStore, updateResource, uploadMedia } from './api.js'

const money=(v,c='PHP')=>new Intl.NumberFormat('en-PH',{style:'currency',currency:c,maximumFractionDigits:2}).format(Number(v||0))
const splitCsv=v=>String(v||'').split(',').map(x=>x.trim()).filter(Boolean)

function Button({children,variant='primary',...props}){return <button className={`btn btn-${variant}`} {...props}>{children}</button>}
function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}
function Modal({title,onClose,children}){return <div className="modal-backdrop"><div className="modal admin-advanced-modal"><div className="modal-head"><h3>{title}</h3><button onClick={onClose}><X size={20}/></button></div>{children}</div></div>}
function Empty({icon:Icon=Package,title,body}){return <div className="empty-state"><div><Icon size={24}/></div><h3>{title}</h3><p>{body}</p></div>}

export function ProductsManager({products,setProducts,terms=[],currency='PHP'}) {
  const empty={name:'',description:'',price:'',compare_at_price:'',inventory:'',category:'',brand:'',sku:'',status:'Draft',image_url:'',images:[],tags:'',variants:[]}
  const [query,setQuery]=useState('')
  const [status,setStatus]=useState('All')
  const [editing,setEditing]=useState(null)
  const [draft,setDraft]=useState(empty)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const filtered=useMemo(()=>products.filter(p=>{
    const q=query.toLowerCase().trim()
    return (!q||[p.name,p.description,p.category,p.brand,p.sku].some(v=>String(v||'').toLowerCase().includes(q)))&&(status==='All'||p.status===status)
  }),[products,query,status])
  const openNew=()=>{setEditing('new');setDraft(empty);setError('')}
  const openEdit=p=>{setEditing(p.id);setDraft({...empty,...p,tags:Array.isArray(p.tags)?p.tags.join(', '):p.tags||'',variants:Array.isArray(p.variants)?p.variants:[]});setError('')}
  const save=async()=>{
    if(!draft.name.trim())return setError('Product name is required.')
    setBusy(true);setError('')
    const payload={...draft,price:Number(draft.price||0),compare_at_price:draft.compare_at_price===''?null:Number(draft.compare_at_price),inventory:Number(draft.inventory||0),tags:splitCsv(draft.tags),variants:Array.isArray(draft.variants)?draft.variants:[]}
    delete payload.id;delete payload.user_id;delete payload.created_at;delete payload.updated_at
    try{
      if(editing==='new'){
        const created=await createResource('products',payload);setProducts(prev=>[created,...prev])
      }else{
        const updated=await updateResource('products',editing,payload);setProducts(prev=>prev.map(x=>x.id===editing?updated:x))
      }
      setEditing(null)
    }catch(err){setError(err.message)}finally{setBusy(false)}
  }
  const remove=async p=>{
    if(!window.confirm(`Delete ${p.name}?`))return
    try{await deleteResource('products',p.id);setProducts(prev=>prev.filter(x=>x.id!==p.id))}catch(err){alert(err.message)}
  }
  const addVariant=()=>setDraft(d=>({...d,variants:[...(d.variants||[]),{title:'Default',sku:'',price:Number(d.price||0),inventory:0,option:''}]}))
  const updateVariant=(i,key,value)=>setDraft(d=>({...d,variants:(d.variants||[]).map((v,n)=>n===i?{...v,[key]:['price','inventory'].includes(key)?Number(value||0):value}:v)}))
  const removeVariant=i=>setDraft(d=>({...d,variants:(d.variants||[]).filter((_,n)=>n!==i)}))
  const uploadProductImage=async e=>{
    const file=e.target.files?.[0];if(!file)return
    setBusy(true);setError('')
    try{const asset=await uploadMedia(file);if(asset?.url)setDraft(d=>({...d,image_url:d.image_url||asset.url,images:Array.from(new Set([...(d.images||[]),asset.url]))}))}
    catch(err){setError(err.message)}finally{setBusy(false);e.target.value=''}
  }
  const exportCsv=()=>{
    const escape=v=>`"${String(v??'').replaceAll('"','""')}"`
    const rows=[['name','description','price','compare_at_price','inventory','category','brand','sku','status','image_url','tags'].join(',')]
    products.forEach(p=>rows.push([p.name,p.description,p.price,p.compare_at_price??'',p.inventory,p.category,p.brand,p.sku,p.status,p.image_url,(p.tags||[]).join('|')].map(escape).join(',')))
    const blob=new Blob([rows.join('\n')],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='cobest-products.csv';a.click();URL.revokeObjectURL(a.href)
  }
  const parseCsvLine=line=>{const out=[];let cur='',quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'&&line[i+1]==='"'&&quoted){cur+='"';i++}else if(ch==='"'){quoted=!quoted}else if(ch===','&&!quoted){out.push(cur);cur=''}else cur+=ch}out.push(cur);return out}
  const importCsv=async e=>{
    const file=e.target.files?.[0];if(!file)return
    setBusy(true);setError('')
    try{
      const text=await file.text();const lines=text.split(/\r?\n/).filter(Boolean);if(lines.length<2)throw new Error('CSV has no product rows.')
      const headers=parseCsvLine(lines[0]).map(x=>x.trim())
      const created=[]
      for(const line of lines.slice(1)){
        const vals=parseCsvLine(line);const row=Object.fromEntries(headers.map((h,i)=>[h,vals[i]??'']))
        if(!row.name)continue
        const payload={name:row.name,description:row.description||'',price:Number(row.price||0),compare_at_price:row.compare_at_price?Number(row.compare_at_price):null,inventory:Number(row.inventory||0),category:row.category||'Uncategorized',brand:row.brand||'',sku:row.sku||'',status:['Draft','Active','Archived'].includes(row.status)?row.status:'Draft',image_url:row.image_url||'',tags:String(row.tags||'').split('|').filter(Boolean),images:row.image_url?[row.image_url]:[],variants:[]}
        created.push(await createResource('products',payload))
      }
      setProducts(prev=>[...created.reverse(),...prev])
    }catch(err){setError(err.message)}finally{setBusy(false);e.target.value=''}
  }
  return <div className="page-wrap"><div className="page-head"><div><p className="overline">CATALOG</p><h1>Products</h1><p>Create, edit, price, organize, and archive products.</p></div><div className="page-actions"><Button variant="secondary" onClick={exportCsv}>Export CSV</Button><label className="btn btn-secondary file-button">Import CSV<input type="file" accept=".csv,text/csv" onChange={importCsv}/></label><Button onClick={openNew}><Plus size={16}/> Add product</Button></div></div>
    <div className="toolbar"><div className="searchbox"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products"/></div><select className="toolbar-select" value={status} onChange={e=>setStatus(e.target.value)}><option>All</option><option>Active</option><option>Draft</option><option>Archived</option></select></div>
    <div className="table-card"><table><thead><tr><th>Product</th><th>Status</th><th>Inventory</th><th>Category</th><th>Price</th><th/></tr></thead><tbody>{filtered.map((p,i)=><tr key={p.id}><td><div className="product-cell">{p.image_url?<img className="admin-product-image" src={p.image_url} alt=""/>:<div className={`product-thumb thumb-${(i%4)+1}`}><Package size={18}/></div>}<div><strong>{p.name}</strong><span>{p.sku||p.brand||''}</span></div></div></td><td><span className={`status ${String(p.status||'Draft').toLowerCase()}`}>{p.status||'Draft'}</span></td><td>{p.inventory}</td><td>{p.category||'—'}</td><td>{money(p.price,currency)}</td><td><div className="row-actions"><button onClick={()=>openEdit(p)}><Pencil size={15}/></button><button onClick={()=>remove(p)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table>{!filtered.length&&<Empty title="No matching products" body="Try a different search/filter or add a product."/>}</div>
    {editing&&<Modal title={editing==='new'?'Add product':'Edit product'} onClose={()=>setEditing(null)}><div className="modal-form">{error&&<div className="auth-message auth-error">{error}</div>}<Field label="Product name"><input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></Field><Field label="Description"><textarea rows="4" value={draft.description||''} onChange={e=>setDraft({...draft,description:e.target.value})}/></Field><div className="form-grid three"><Field label="Price"><input type="number" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})}/></Field><Field label="Compare-at price"><input type="number" value={draft.compare_at_price??''} onChange={e=>setDraft({...draft,compare_at_price:e.target.value})}/></Field><Field label="Inventory"><input type="number" value={draft.inventory} onChange={e=>setDraft({...draft,inventory:e.target.value})}/></Field></div><div className="form-grid three"><Field label="Category"><input list="cobest-category-options" value={draft.category||''} onChange={e=>setDraft({...draft,category:e.target.value})}/><datalist id="cobest-category-options">{terms.filter(x=>x.term_type==='category').map(x=><option key={x.id} value={x.name}/>)}</datalist></Field><Field label="Brand"><input list="cobest-brand-options" value={draft.brand||''} onChange={e=>setDraft({...draft,brand:e.target.value})}/><datalist id="cobest-brand-options">{terms.filter(x=>x.term_type==='brand').map(x=><option key={x.id} value={x.name}/>)}</datalist></Field><Field label="SKU"><input value={draft.sku||''} onChange={e=>setDraft({...draft,sku:e.target.value})}/></Field></div><div className="form-grid two"><Field label="Status"><select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option>Draft</option><option>Active</option><option>Archived</option></select></Field><Field label="Tags"><input value={draft.tags||''} onChange={e=>setDraft({...draft,tags:e.target.value})} placeholder="home, featured"/></Field></div><div className="product-media-editor"><Field label="Primary image URL"><input value={draft.image_url||''} onChange={e=>setDraft({...draft,image_url:e.target.value,images:Array.from(new Set([...(draft.images||[]),e.target.value].filter(Boolean)))})} placeholder="https://..."/></Field><label className="btn btn-secondary file-button"><Upload size={15}/> Upload product image<input type="file" accept="image/*" onChange={uploadProductImage}/></label>{(draft.images||[]).length>0&&<div className="product-image-strip">{draft.images.map(url=><button key={url} className={draft.image_url===url?'active':''} onClick={()=>setDraft({...draft,image_url:url})}><img src={url} alt=""/></button>)}</div>}</div><div className="variant-editor"><div className="panel-head"><div><span>Variants</span><h3>Options / SKUs</h3></div><Button variant="secondary" onClick={addVariant}><Plus size={14}/> Add variant</Button></div>{(draft.variants||[]).map((v,i)=><div className="variant-row" key={i}><input value={v.title||''} onChange={e=>updateVariant(i,'title',e.target.value)} placeholder="Title"/><input value={v.option||''} onChange={e=>updateVariant(i,'option',e.target.value)} placeholder="e.g. Black / M"/><input value={v.sku||''} onChange={e=>updateVariant(i,'sku',e.target.value)} placeholder="SKU"/><input type="number" value={v.price??0} onChange={e=>updateVariant(i,'price',e.target.value)} placeholder="Price"/><input type="number" value={v.inventory??0} onChange={e=>updateVariant(i,'inventory',e.target.value)} placeholder="Stock"/><button onClick={()=>removeVariant(i)}><Trash2 size={15}/></button></div>)}</div><div className="modal-actions"><Button variant="secondary" onClick={()=>setEditing(null)}>Cancel</Button><Button disabled={busy} onClick={save}>{busy?'Saving…':'Save product'}</Button></div></div></Modal>}
  </div>
}

export function CustomersManager({customers,setCustomers,orders}) {
  const empty={name:'',email:'',phone:'',notes:'',tags:'',marketing_consent:false,address:{}}
  const [query,setQuery]=useState('');const [editing,setEditing]=useState(null);const [draft,setDraft]=useState(empty);const [busy,setBusy]=useState(false);const [error,setError]=useState('')
  const filtered=customers.filter(c=>!query||[c.name,c.email,c.phone].some(v=>String(v||'').toLowerCase().includes(query.toLowerCase())))
  const open=x=>{setEditing(x?.id||'new');setDraft(x?{...empty,...x,tags:Array.isArray(x.tags)?x.tags.join(', '):x.tags||''}:empty);setError('')}
  const save=async()=>{if(!draft.name)return;setBusy(true);try{const payload={...draft,tags:splitCsv(draft.tags)};delete payload.id;delete payload.user_id;delete payload.created_at;delete payload.updated_at;if(editing==='new'){const x=await createResource('customers',payload);setCustomers(p=>[x,...p])}else{const x=await updateResource('customers',editing,payload);setCustomers(p=>p.map(y=>y.id===editing?x:y))}setEditing(null)}catch(err){setError(err.message)}finally{setBusy(false)}}
  const remove=async x=>{if(!window.confirm(`Delete ${x.name}?`))return;await deleteResource('customers',x.id);setCustomers(p=>p.filter(y=>y.id!==x.id))}
  return <div className="page-wrap"><div className="page-head"><div><p className="overline">COMMERCE</p><h1>Customers</h1><p>Profiles, purchase history, tags, and marketing consent.</p></div><Button onClick={()=>open()}><Plus size={16}/> Add customer</Button></div><div className="toolbar"><div className="searchbox"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search customers"/></div></div><div className="table-card"><table><thead><tr><th>Customer</th><th>Email</th><th>Phone</th><th>Orders</th><th>Spent</th><th/></tr></thead><tbody>{filtered.map(c=>{const history=orders.filter(o=>o.customer_id===c.id);const spent=history.filter(o=>o.payment_status==='Paid').reduce((s,o)=>s+Number(o.total||0),0);return <tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.email||'—'}</td><td>{c.phone||'—'}</td><td>{history.length}</td><td>{money(spent)}</td><td><div className="row-actions"><button onClick={()=>open(c)}><Pencil size={15}/></button><button onClick={()=>remove(c)}><Trash2 size={15}/></button></div></td></tr>})}</tbody></table>{!filtered.length&&<Empty icon={Users} title="No customers" body="Customer records from checkout will appear here."/>}</div>{editing&&<Modal title={editing==='new'?'Add customer':'Edit customer'} onClose={()=>setEditing(null)}><div className="modal-form">{error&&<div className="auth-message auth-error">{error}</div>}<Field label="Name"><input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></Field><Field label="Email"><input type="email" value={draft.email} onChange={e=>setDraft({...draft,email:e.target.value})}/></Field><Field label="Phone"><input value={draft.phone} onChange={e=>setDraft({...draft,phone:e.target.value})}/></Field><Field label="Tags"><input value={draft.tags||''} onChange={e=>setDraft({...draft,tags:e.target.value})}/></Field><label className="check-row"><input type="checkbox" checked={!!draft.marketing_consent} onChange={e=>setDraft({...draft,marketing_consent:e.target.checked})}/> Marketing consent</label><Field label="Notes"><textarea rows="4" value={draft.notes||''} onChange={e=>setDraft({...draft,notes:e.target.value})}/></Field><div className="customer-history"><strong>Order history</strong>{orders.filter(o=>o.customer_id===draft.id).map(o=><span key={o.id}>{o.order_number} · {money(o.total)} · {o.payment_status}</span>)}</div><div className="modal-actions"><Button variant="secondary" onClick={()=>setEditing(null)}>Cancel</Button><Button disabled={busy} onClick={save}>{busy?'Saving…':'Save customer'}</Button></div></div></Modal>}</div>
}

export function OrdersManager({orders,setOrders,customers}) {
  const [query,setQuery]=useState('');const [editing,setEditing]=useState(null);const [draft,setDraft]=useState(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('')
  const filtered=orders.filter(o=>!query||[o.order_number,o.payment_status,o.fulfillment_status,customers.find(c=>c.id===o.customer_id)?.name].some(v=>String(v||'').toLowerCase().includes(query.toLowerCase())))
  const edit=o=>{setEditing(o.id);setDraft({...o});setError('')}
  const save=async()=>{setBusy(true);try{const payload={payment_status:draft.payment_status,fulfillment_status:draft.fulfillment_status,tracking_number:draft.tracking_number||'',carrier:draft.carrier||'',notes:draft.notes||''};const x=await updateResource('orders',editing,payload);setOrders(p=>p.map(y=>y.id===editing?x:y));setEditing(null)}catch(err){setError(err.message)}finally{setBusy(false)}}
  const remove=async o=>{if(!window.confirm(`Delete order ${o.order_number}?`))return;await deleteResource('orders',o.id);setOrders(p=>p.filter(x=>x.id!==o.id))}
  return <div className="page-wrap"><div className="page-head"><div><p className="overline">COMMERCE</p><h1>Orders</h1><p>Payment, fulfillment, customer, items, and tracking.</p></div></div><div className="toolbar"><div className="searchbox"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search orders"/></div></div><div className="table-card"><table><thead><tr><th>Order</th><th>Customer</th><th>Payment</th><th>Fulfillment</th><th>Total</th><th/></tr></thead><tbody>{filtered.map(o=><tr key={o.id}><td><strong>{o.order_number||'#'+o.id}</strong></td><td>{customers.find(c=>c.id===o.customer_id)?.name||'Guest'}</td><td>{o.payment_status}</td><td>{o.fulfillment_status}</td><td>{money(o.total)}</td><td><div className="row-actions"><button onClick={()=>edit(o)}><Pencil size={15}/></button><button onClick={()=>remove(o)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table>{!filtered.length&&<Empty title="No orders" body="Published-store orders will appear here."/>}</div>{editing&&draft&&<Modal title={draft.order_number||'Order'} onClose={()=>setEditing(null)}><div className="modal-form">{error&&<div className="auth-message auth-error">{error}</div>}<div className="order-items"><strong>Items</strong>{(draft.items||[]).map((x,i)=><span key={i}>{x.quantity} × {x.name} — {money(x.line_total)}</span>)}</div><div className="form-grid two"><Field label="Payment status"><select value={draft.payment_status} onChange={e=>setDraft({...draft,payment_status:e.target.value})}><option>Pending</option><option>Paid</option><option>Refunded</option><option>Failed</option></select></Field><Field label="Fulfillment"><select value={draft.fulfillment_status} onChange={e=>setDraft({...draft,fulfillment_status:e.target.value})}><option>Unfulfilled</option><option>Processing</option><option>Fulfilled</option><option>Cancelled</option></select></Field></div><div className="form-grid two"><Field label="Carrier"><input value={draft.carrier||''} onChange={e=>setDraft({...draft,carrier:e.target.value})}/></Field><Field label="Tracking number"><input value={draft.tracking_number||''} onChange={e=>setDraft({...draft,tracking_number:e.target.value})}/></Field></div><Field label="Notes"><textarea rows="4" value={draft.notes||''} onChange={e=>setDraft({...draft,notes:e.target.value})}/></Field><div className="order-summary"><span>Subtotal <b>{money(draft.subtotal||draft.total)}</b></span><span>Discount <b>-{money(draft.discount_amount)}</b></span><span>Shipping <b>{money(draft.shipping_amount)}</b></span><span>Tax <b>{money(draft.tax_amount)}</b></span><strong>Total <b>{money(draft.total)}</b></strong></div><div className="modal-actions"><Button variant="secondary" onClick={()=>window.print()}>Print</Button><Button disabled={busy} onClick={save}>{busy?'Saving…':'Save order'}</Button></div></div></Modal>}</div>
}

export function MediaManager({items,setItems}) {
  const [busy,setBusy]=useState(false);const [error,setError]=useState('')
  const upload=async e=>{const file=e.target.files?.[0];if(!file)return;setBusy(true);setError('');try{const x=await uploadMedia(file);if(x)setItems(p=>[x,...p])}catch(err){setError(err.message)}finally{setBusy(false);e.target.value=''}}
  const remove=async item=>{if(!window.confirm(`Delete media record ${item.name}?`))return;await deleteResource('media_assets',item.id);setItems(p=>p.filter(x=>x.id!==item.id))}
  return <div className="page-wrap"><div className="page-head"><div><p className="overline">CONTENT</p><h1>Media</h1><p>Upload images, PDFs, and supported media directly to CoBest storage.</p></div><label className="btn btn-primary file-button"><Upload size={16}/>{busy?'Uploading…':'Upload media'}<input type="file" disabled={busy} onChange={upload}/></label></div>{error&&<div className="auth-message auth-error">{error}</div>}<div className="media-grid">{items.map(m=><article className="media-card" key={m.id}>{String(m.mime_type||'').startsWith('image')?<img src={m.url} alt={m.name}/>:<div className="media-file"><FileText size={28}/></div>}<strong>{m.name}</strong><div><a href={m.url} target="_blank" rel="noreferrer"><ExternalLink size={14}/></a><button onClick={()=>{navigator.clipboard?.writeText(m.url)}}><Copy size={14}/></button><button onClick={()=>remove(m)}><Trash2 size={14}/></button></div></article>)}</div>{!items.length&&<Empty icon={ImageIcon} title="No media yet" body="Upload your first image or file."/>}</div>
}

export function PublishingSettings({workspace,onWorkspace,snapshot}) {
  const [form,setForm]=useState({
    slug:workspace?.slug||'',
    custom_domain:workspace?.custom_domain||'',
    currency:workspace?.currency||'PHP',
    timezone:workspace?.timezone||'Asia/Manila',
    shippingFlat:Number(workspace?.settings?.shippingFlat||0),
    taxRate:Number(workspace?.settings?.taxRate||0),
    seoTitle:workspace?.settings?.seoTitle||'',
    seoDescription:workspace?.settings?.seoDescription||'',
    contactEmail:workspace?.settings?.contactEmail||'',
    privacyPolicy:workspace?.settings?.privacyPolicy||'',
    termsPolicy:workspace?.settings?.termsPolicy||'',
    refundPolicy:workspace?.settings?.refundPolicy||''
  })
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('')
  const publish=async()=>{setBusy(true);setError('');setMessage('');try{const payload={slug:form.slug,custom_domain:form.custom_domain,snapshot:{...snapshot,settings:{...(snapshot.settings||{}),...form}}};const result=await publishStore(payload);setMessage(`Published: ${window.location.origin}${result.store_url}`);onWorkspace?.({...workspace,...form,is_published:true,published_at:new Date().toISOString(),settings:{...(workspace?.settings||{}),shippingFlat:Number(form.shippingFlat||0),taxRate:Number(form.taxRate||0),seoTitle:form.seoTitle,seoDescription:form.seoDescription,contactEmail:form.contactEmail,privacyPolicy:form.privacyPolicy,termsPolicy:form.termsPolicy,refundPolicy:form.refundPolicy}})}catch(err){setError(err.message)}finally{setBusy(false)}}
  const unpublish=async()=>{setBusy(true);setError('');try{await unpublishStore();setMessage('Store unpublished.');onWorkspace?.({...workspace,is_published:false})}catch(err){setError(err.message)}finally{setBusy(false)}}
  return <div className="page-wrap"><div className="page-head"><div><p className="overline">PUBLISHING</p><h1>Store settings & publishing</h1><p>Control the public storefront, URL, currency, tax, and shipping defaults.</p></div>{workspace?.is_published&&form.slug&&<a className="btn btn-secondary" href={`/store/${form.slug}`} target="_blank" rel="noreferrer">Open live store <ExternalLink size={14}/></a>}</div>{error&&<div className="auth-message auth-error">{error}</div>}{message&&<div className="auth-message auth-success">{message}</div>}<div className="settings-columns"><section className="panel"><div className="panel-head"><div><span>Store identity</span><h3>Public URL</h3></div></div><Field label="Store slug"><input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')})} placeholder="my-store"/></Field><Field label="Custom domain"><input value={form.custom_domain} onChange={e=>setForm({...form,custom_domain:e.target.value.toLowerCase().trim()})} placeholder="shop.example.com"/></Field><Field label="Public contact email"><input type="email" value={form.contactEmail} onChange={e=>setForm({...form,contactEmail:e.target.value})}/></Field><p className="field-help">Custom domains still require the merchant to point DNS to CoBest before traffic can resolve.</p></section><section className="panel"><div className="panel-head"><div><span>Commerce</span><h3>Defaults</h3></div></div><div className="form-grid two"><Field label="Currency"><select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}><option>PHP</option><option>USD</option><option>AUD</option><option>GBP</option><option>EUR</option></select></Field><Field label="Timezone"><input value={form.timezone} onChange={e=>setForm({...form,timezone:e.target.value})}/></Field></div><div className="form-grid two"><Field label="Flat shipping"><input type="number" value={form.shippingFlat} onChange={e=>setForm({...form,shippingFlat:Number(e.target.value||0)})}/></Field><Field label="Tax rate %"><input type="number" value={form.taxRate} onChange={e=>setForm({...form,taxRate:Number(e.target.value||0)})}/></Field></div></section><section className="panel"><div className="panel-head"><div><span>Search</span><h3>SEO defaults</h3></div></div><Field label="SEO title"><input value={form.seoTitle} onChange={e=>setForm({...form,seoTitle:e.target.value})}/></Field><Field label="SEO description"><textarea rows="4" value={form.seoDescription} onChange={e=>setForm({...form,seoDescription:e.target.value})}/></Field></section><section className="panel"><div className="panel-head"><div><span>Policies</span><h3>Customer information</h3></div></div><Field label="Privacy policy"><textarea rows="4" value={form.privacyPolicy} onChange={e=>setForm({...form,privacyPolicy:e.target.value})}/></Field><Field label="Terms"><textarea rows="4" value={form.termsPolicy} onChange={e=>setForm({...form,termsPolicy:e.target.value})}/></Field><Field label="Refund policy"><textarea rows="4" value={form.refundPolicy} onChange={e=>setForm({...form,refundPolicy:e.target.value})}/></Field></section></div><div className="publish-bar"><div><span>Status</span><strong>{workspace?.is_published?'Published':'Draft'}</strong></div><div>{workspace?.is_published&&<Button variant="secondary" disabled={busy} onClick={unpublish}>Unpublish</Button>}<Button disabled={busy||!form.slug} onClick={publish}>{busy?'Publishing…':workspace?.is_published?'Publish updates':'Publish store'}</Button></div></div></div>
}

export function InboxManager({subscribers,contacts,bookings,reviews,setReviews}) {
  const [tab,setTab]=useState('contacts')
  const tabs=[['contacts',contacts.length],['subscribers',subscribers.length],['bookings',bookings.length],['reviews',reviews.length]]
  const approve=async review=>{const x=await updateResource('product_reviews',review.id,{status:'Approved'});setReviews(p=>p.map(y=>y.id===review.id?x:y))}
  return <div className="page-wrap"><div className="page-head"><div><p className="overline">INBOX</p><h1>Store activity</h1><p>Messages, subscribers, bookings, and product reviews from the public store.</p></div></div><div className="tab-row">{tabs.map(([id,count])=><button className={tab===id?'active':''} key={id} onClick={()=>setTab(id)}>{id} <b>{count}</b></button>)}</div>{tab==='contacts'&&<div className="table-card"><table><thead><tr><th>Name</th><th>Email</th><th>Message</th><th>Status</th></tr></thead><tbody>{contacts.map(x=><tr key={x.id}><td>{x.name||'—'}</td><td>{x.email}</td><td>{x.message}</td><td>{x.status}</td></tr>)}</tbody></table></div>}{tab==='subscribers'&&<div className="table-card"><table><thead><tr><th>Email</th><th>Joined</th></tr></thead><tbody>{subscribers.map(x=><tr key={x.id}><td>{x.email}</td><td>{new Date(x.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>}{tab==='bookings'&&<div className="table-card"><table><thead><tr><th>Name</th><th>Email</th><th>Time</th><th>Status</th></tr></thead><tbody>{bookings.map(x=><tr key={x.id}><td>{x.name}</td><td>{x.email}</td><td>{new Date(x.start_at).toLocaleString()}</td><td>{x.status}</td></tr>)}</tbody></table></div>}{tab==='reviews'&&<div className="table-card"><table><thead><tr><th>Reviewer</th><th>Rating</th><th>Review</th><th>Status</th><th/></tr></thead><tbody>{reviews.map(x=><tr key={x.id}><td>{x.author_name}</td><td>{x.rating}/5</td><td>{x.body}</td><td>{x.status}</td><td>{x.status!=='Approved'&&<button onClick={()=>approve(x)}><Check size={15}/> Approve</button>}</td></tr>)}</tbody></table></div>}</div>
}

export function AnalyticsAdvanced({orders,customers,events,products}) {
  const paid=orders.filter(o=>o.payment_status==='Paid')
  const sales=paid.reduce((s,o)=>s+Number(o.total||0),0)
  const views=events.filter(e=>e.event_type==='page_view').length
  const adds=events.filter(e=>e.event_type==='add_to_cart').length
  const conversion=views?orders.length/views*100:0
  const byProduct={}
  orders.forEach(o=>(o.items||[]).forEach(x=>{byProduct[x.name]=(byProduct[x.name]||0)+Number(x.quantity||0)}))
  const best=Object.entries(byProduct).sort((a,b)=>b[1]-a[1]).slice(0,5)
  return <div className="page-wrap"><div className="page-head"><div><p className="overline">ANALYTICS</p><h1>Store performance</h1><p>Sales, traffic, conversion, and product signals from your published store.</p></div></div><div className="stat-grid"><Stat title="Sales" value={money(sales)} note="Paid revenue"/><Stat title="Orders" value={String(orders.length)} note="All orders"/><Stat title="Store views" value={String(views)} note="Tracked page views"/><Stat title="Conversion" value={views?`${conversion.toFixed(1)}%`:'—'} note="Orders / views"/></div><div className="analytics-grid"><section className="panel"><h3>Top products</h3>{best.map(([name,count])=><div className="metric-row" key={name}><span>{name}</span><strong>{count} sold</strong></div>)}{!best.length&&<p>No order item data yet.</p>}</section><section className="panel"><h3>Commerce</h3><div className="metric-row"><span>Customers</span><strong>{customers.length}</strong></div><div className="metric-row"><span>Products</span><strong>{products.length}</strong></div><div className="metric-row"><span>Add-to-cart events</span><strong>{adds}</strong></div><div className="metric-row"><span>Average paid order</span><strong>{paid.length?money(sales/paid.length):'—'}</strong></div></section></div></div>
}

function Stat({title,value,note}){return <div className="stat-card"><span>{title}</span><strong>{value}</strong><small>{note}</small></div>}


export function DiscountsManager({items,setItems,currency='PHP'}) {
  const empty={code:'',kind:'percent',value:'',active:true,min_spend:'',usage_limit:'',expires_at:''}
  const [editing,setEditing]=useState(null);const[draft,setDraft]=useState(empty);const[busy,setBusy]=useState(false);const[error,setError]=useState('')
  const open=x=>{setEditing(x?.id||'new');setDraft(x?{...empty,...x,expires_at:x.expires_at?String(x.expires_at).slice(0,16):''}:empty);setError('')}
  const save=async()=>{if(!draft.code.trim())return setError('Discount code is required.');setBusy(true);setError('');const payload={...draft,code:draft.code.toUpperCase().trim(),value:Number(draft.value||0),min_spend:Number(draft.min_spend||0),usage_limit:draft.usage_limit===''?null:Number(draft.usage_limit),expires_at:draft.expires_at?new Date(draft.expires_at).toISOString():null};delete payload.id;delete payload.user_id;delete payload.created_at;try{if(editing==='new'){const x=await createResource('discounts',payload);setItems(p=>[x,...p])}else{const x=await updateResource('discounts',editing,payload);setItems(p=>p.map(y=>y.id===editing?x:y))}setEditing(null)}catch(err){setError(err.message)}finally{setBusy(false)}}
  const remove=async x=>{if(!window.confirm(`Delete ${x.code}?`))return;await deleteResource('discounts',x.id);setItems(p=>p.filter(y=>y.id!==x.id))}
  const toggle=async x=>{const y=await updateResource('discounts',x.id,{active:!x.active});setItems(p=>p.map(z=>z.id===x.id?y:z))}
  return <div className="page-wrap"><div className="page-head"><div><p className="overline">COMMERCE</p><h1>Discounts</h1><p>Create checkout-ready percentage and fixed-amount offers.</p></div><Button onClick={()=>open()}><Plus size={16}/> Create discount</Button></div><div className="table-card"><table><thead><tr><th>Code</th><th>Offer</th><th>Minimum</th><th>Usage</th><th>Expiry</th><th>Status</th><th/></tr></thead><tbody>{items.map(x=><tr key={x.id}><td><strong>{x.code}</strong></td><td>{x.kind==='percent'?x.value+'%':money(x.value,currency)}</td><td>{money(x.min_spend,currency)}</td><td>{x.used_count||0}{x.usage_limit?'/'+x.usage_limit:''}</td><td>{x.expires_at?new Date(x.expires_at).toLocaleDateString():'No expiry'}</td><td><button className={`status ${x.active?'active':'draft'}`} onClick={()=>toggle(x)}>{x.active?'Active':'Inactive'}</button></td><td><div className="row-actions">{x.channel==='email'&&x.status!=='Complete'&&<button title="Send now" onClick={()=>sendCampaign(x)}>Send</button>}<button onClick={()=>open(x)}><Pencil size={15}/></button><button onClick={()=>remove(x)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table>{!items.length&&<Empty title="No discounts" body="Create a code that customers can use during checkout."/>}</div>{editing&&<Modal title={editing==='new'?'Create discount':'Edit discount'} onClose={()=>setEditing(null)}><div className="modal-form">{error&&<div className="auth-message auth-error">{error}</div>}<Field label="Code"><input value={draft.code} onChange={e=>setDraft({...draft,code:e.target.value.toUpperCase()})}/></Field><div className="form-grid two"><Field label="Type"><select value={draft.kind} onChange={e=>setDraft({...draft,kind:e.target.value})}><option value="percent">Percent</option><option value="fixed">Fixed amount</option></select></Field><Field label="Value"><input type="number" value={draft.value} onChange={e=>setDraft({...draft,value:e.target.value})}/></Field></div><div className="form-grid two"><Field label="Minimum spend"><input type="number" value={draft.min_spend} onChange={e=>setDraft({...draft,min_spend:e.target.value})}/></Field><Field label="Usage limit"><input type="number" value={draft.usage_limit??''} onChange={e=>setDraft({...draft,usage_limit:e.target.value})} placeholder="Unlimited"/></Field></div><Field label="Expires"><input type="datetime-local" value={draft.expires_at||''} onChange={e=>setDraft({...draft,expires_at:e.target.value})}/></Field><label className="check-row"><input type="checkbox" checked={!!draft.active} onChange={e=>setDraft({...draft,active:e.target.checked})}/> Active</label><div className="modal-actions"><Button variant="secondary" onClick={()=>setEditing(null)}>Cancel</Button><Button disabled={busy} onClick={save}>{busy?'Saving…':'Save discount'}</Button></div></div></Modal>}</div>
}

export function CampaignsManager({items,setItems,subscribers=[]}) {
  const empty={name:'',channel:'email',status:'Draft',subject:'',content:'',scheduled_at:''}
  const [editing,setEditing]=useState(null);const[draft,setDraft]=useState(empty);const[busy,setBusy]=useState(false);const[error,setError]=useState('')
  const open=x=>{setEditing(x?.id||'new');setDraft(x?{...empty,...x,scheduled_at:x.scheduled_at?String(x.scheduled_at).slice(0,16):''}:empty);setError('')}
  const save=async()=>{if(!draft.name.trim())return setError('Campaign name is required.');setBusy(true);setError('');const payload={...draft,scheduled_at:draft.scheduled_at?new Date(draft.scheduled_at).toISOString():null};delete payload.id;delete payload.user_id;delete payload.created_at;try{if(editing==='new'){const x=await createResource('campaigns',payload);setItems(p=>[x,...p])}else{const x=await updateResource('campaigns',editing,payload);setItems(p=>p.map(y=>y.id===editing?x:y))}setEditing(null)}catch(err){setError(err.message)}finally{setBusy(false)}}
  const remove=async x=>{if(!window.confirm(`Delete campaign "${x.name}"?`))return;await deleteResource('campaigns',x.id);setItems(p=>p.filter(y=>y.id!==x.id))}
  const exportSubscribers=()=>{const rows=['email,joined',...subscribers.map(x=>`"${String(x.email).replaceAll('"','""')}","${x.created_at||''}"`)];const blob=new Blob([rows.join('\n')],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='cobest-subscribers.csv';a.click();URL.revokeObjectURL(a.href)}
  const sendCampaign=async x=>{
    if(!window.confirm(`Send "${x.name}" to the current subscriber list?`))return
    setBusy(true);setError('')
    try{
      const response=await fetch(`/api/campaigns/${x.id}/send`,{method:'POST',headers:{authorization:`Bearer ${localStorage.getItem('cobest-auth-token')||''}`,'content-type':'application/json'},body:'{}'})
      const data=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(data.error||'Campaign send failed.')
      if(data.campaign)setItems(p=>p.map(y=>y.id===x.id?data.campaign:y))
      alert(`Campaign finished: ${data.sent} sent, ${data.failed} failed.`)
    }catch(err){setError(err.message)}finally{setBusy(false)}
  }
  return <div className="page-wrap"><div className="page-head"><div><p className="overline">GROWTH</p><h1>Marketing</h1><p>Plan campaigns using the subscriber list collected by your published store.</p></div><div className="page-actions"><Button variant="secondary" onClick={exportSubscribers}>Export {subscribers.length} subscribers</Button><Button onClick={()=>open()}><Plus size={16}/> Create campaign</Button></div></div><div className="table-card"><table><thead><tr><th>Campaign</th><th>Channel</th><th>Status</th><th>Scheduled</th><th/></tr></thead><tbody>{items.map(x=><tr key={x.id}><td><strong>{x.name}</strong><span className="table-sub">{x.subject||''}</span></td><td>{x.channel}</td><td>{x.status}</td><td>{x.scheduled_at?new Date(x.scheduled_at).toLocaleString():'—'}</td><td><div className="row-actions"><button onClick={()=>open(x)}><Pencil size={15}/></button><button onClick={()=>remove(x)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table>{!items.length&&<Empty title="No campaigns" body="Create a campaign draft. Sending activates when an email provider is connected."/>}</div><div className="panel integration-note"><strong>Delivery integration</strong><p>Campaign content and scheduling are persistent. Actual email delivery requires a transactional/email marketing provider key; CoBest will not pretend a campaign was sent without one.</p></div>{editing&&<Modal title={editing==='new'?'Create campaign':'Edit campaign'} onClose={()=>setEditing(null)}><div className="modal-form">{error&&<div className="auth-message auth-error">{error}</div>}<Field label="Campaign name"><input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></Field><div className="form-grid two"><Field label="Channel"><select value={draft.channel} onChange={e=>setDraft({...draft,channel:e.target.value})}><option value="email">Email</option><option value="social">Social</option><option value="launch">Launch</option></select></Field><Field label="Status"><select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option>Draft</option><option>Scheduled</option><option>Active</option><option>Complete</option></select></Field></div><Field label="Subject"><input value={draft.subject||''} onChange={e=>setDraft({...draft,subject:e.target.value})}/></Field><Field label="Message"><textarea rows="8" value={draft.content||''} onChange={e=>setDraft({...draft,content:e.target.value})}/></Field><Field label="Schedule"><input type="datetime-local" value={draft.scheduled_at||''} onChange={e=>setDraft({...draft,scheduled_at:e.target.value})}/></Field><div className="modal-actions"><Button variant="secondary" onClick={()=>setEditing(null)}>Cancel</Button><Button disabled={busy} onClick={save}>{busy?'Saving…':'Save campaign'}</Button></div></div></Modal>}</div>
}

export function CollectionsManager({items,setItems,products}) {
  const [editing,setEditing]=useState(null);const[draft,setDraft]=useState({name:'',slug:'',description:'',product_ids:[]});const[error,setError]=useState('')
  const open=x=>{setEditing(x?.id||'new');setDraft(x?{...x,product_ids:Array.isArray(x.product_ids)?x.product_ids:[]}:{name:'',slug:'',description:'',product_ids:[]});setError('')}
  const toggle=id=>setDraft(d=>({...d,product_ids:d.product_ids.includes(id)?d.product_ids.filter(x=>x!==id):[...d.product_ids,id]}))
  const save=async()=>{if(!draft.name)return setError('Collection name is required.');const payload={name:draft.name,slug:(draft.slug||draft.name).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),description:draft.description||'',product_ids:draft.product_ids};try{if(editing==='new'){const x=await createResource('collections',payload);setItems(p=>[x,...p])}else{const x=await updateResource('collections',editing,payload);setItems(p=>p.map(y=>y.id===editing?x:y))}setEditing(null)}catch(err){setError(err.message)}}
  const remove=async x=>{if(!window.confirm(`Delete collection "${x.name}"?`))return;await deleteResource('collections',x.id);setItems(p=>p.filter(y=>y.id!==x.id))}
  return <div className="page-wrap"><div className="page-head"><div><p className="overline">CATALOG</p><h1>Collections</h1><p>Group products into customer-facing collections.</p></div><Button onClick={()=>open()}><Plus size={16}/> Add collection</Button></div><div className="collection-grid">{items.map(x=><article className="panel" key={x.id}><span className="overline">{(x.product_ids||[]).length} PRODUCTS</span><h3>{x.name}</h3><p>{x.description||'No description'}</p><div className="page-actions"><Button variant="secondary" onClick={()=>open(x)}>Edit</Button><button className="icon-danger" onClick={()=>remove(x)}><Trash2 size={15}/></button></div></article>)}</div>{!items.length&&<Empty title="No collections" body="Create a collection to group products on the public store."/>}{editing&&<Modal title={editing==='new'?'Add collection':'Edit collection'} onClose={()=>setEditing(null)}><div className="modal-form">{error&&<div className="auth-message auth-error">{error}</div>}<Field label="Name"><input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></Field><Field label="Slug"><input value={draft.slug||''} onChange={e=>setDraft({...draft,slug:e.target.value})} placeholder="auto-from-name"/></Field><Field label="Description"><textarea rows="4" value={draft.description||''} onChange={e=>setDraft({...draft,description:e.target.value})}/></Field><div className="product-pick-list">{products.map(p=><label key={p.id}><input type="checkbox" checked={draft.product_ids.includes(p.id)} onChange={()=>toggle(p.id)}/><span>{p.name}</span><small>{p.category}</small></label>)}</div><div className="modal-actions"><Button variant="secondary" onClick={()=>setEditing(null)}>Cancel</Button><Button onClick={save}>Save collection</Button></div></div></Modal>}</div>
}

export function IntegrationsPanel() {
  const [status,setStatus]=useState(null);const[error,setError]=useState('')
  const load=()=>{setError('');fetch('/api/integrations/status',{headers:{authorization:`Bearer ${localStorage.getItem('cobest-auth-token')||''}`}}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to load integrations');return d}).then(setStatus).catch(e=>setError(e.message))}
  useEffect(load,[])
  const providers=[
    ['Stripe','stripe','Card payments and subscription billing'],
    ['PayPal','paypal','PayPal checkout'],
    ['Email','email','Transactional and campaign delivery'],
    ['ShipStation','shipstation','Shipping labels and fulfillment'],
    ['Amazon','amazon','Marketplace product/channel publishing'],
    ['eBay','ebay','Marketplace product/channel publishing'],
    ['Adobe','adobe','Creative Cloud asset workflow']
  ]
  return <div className="page-wrap"><div className="page-head"><div><p className="overline">PLATFORM</p><h1>Integrations</h1><p>Provider connections that unlock external payment, delivery, shipping, marketplace, and creative workflows.</p></div><Button variant="secondary" onClick={load}><RefreshCw size={15}/> Refresh</Button></div>{error&&<div className="auth-message auth-error">{error}</div>}<div className="integration-grid">{providers.map(([name,key,note])=><article className="panel integration-card" key={key}><div><strong>{name}</strong><span>{note}</span></div><b className={status?.[key]?'connected':'not-connected'}>{status?.[key]?'Connected':'Not connected'}</b></article>)}</div><div className="panel integration-note"><strong>Secrets stay server-side.</strong><p>Provider API keys and OAuth credentials are configured as Railway environment variables or through a connected provider workflow; they are never stored in storefront JavaScript.</p></div></div>
}


export function TeamManager() {
  const [data,setData]=useState(null)
  const [email,setEmail]=useState('')
  const [role,setRole]=useState('Editor')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const load=()=>{setError('');getTeam().then(setData).catch(e=>setError(e.message))}
  useEffect(load,[])
  const invite=async()=>{
    if(!email.trim())return
    setBusy(true);setError('');setNotice('')
    try{
      const x=await inviteTeamMember(email,role)
      setEmail('')
      setNotice('Invitation created. Copy the invitation link below and send it to the team member.')
      await load()
      return x
    }catch(e){setError(e.message)}finally{setBusy(false)}
  }
  const copyInvite=inv=>{
    const link=`${window.location.origin}/?invite=${inv.token}`
    navigator.clipboard?.writeText(link)
    setNotice('Invitation link copied.')
  }
  const removeMember=async id=>{if(!window.confirm('Remove this team member?'))return;await removeTeamMember(id);await load()}
  const revoke=async id=>{if(!window.confirm('Revoke this invitation?'))return;await revokeTeamInvite(id);await load()}
  const canInvite=['Owner','Admin'].includes(data?.role)
  return <div className="page-wrap"><div className="page-head"><div><p className="overline">TEAM</p><h1>Team access</h1><p>Invite administrators, editors, or read-only viewers to the shared CoBest workspace.</p></div><span className="status active">{data?.role||'Loading…'}</span></div>{error&&<div className="auth-message auth-error">{error}</div>}{notice&&<div className="auth-message auth-success">{notice}</div>}{canInvite&&<section className="panel team-invite-panel"><div className="panel-head"><div><span>Invite</span><h3>Add a team member</h3></div></div><div className="form-grid three"><Field label="Email"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="person@example.com"/></Field><Field label="Role"><select value={role} onChange={e=>setRole(e.target.value)}><option>Admin</option><option>Editor</option><option>Viewer</option></select></Field><div className="team-invite-action"><Button disabled={busy||!email} onClick={invite}>{busy?'Creating…':'Create invite'}</Button></div></div><p className="field-help">Invitations are valid for 7 days. Email delivery is optional; you can copy the secure link and send it yourself.</p></section>}<div className="settings-columns"><section className="panel"><div className="panel-head"><div><span>Workspace members</span><h3>{data?.members?.length||0} team members</h3></div></div>{(data?.members||[]).map(m=><div className="team-row" key={m.id}><div><strong>{m.email||m.member_user_id}</strong><span>{m.role}</span></div>{canInvite&&<button onClick={()=>removeMember(m.id)}><Trash2 size={15}/></button>}</div>)}{!data?.members?.length&&<p>No additional team members yet.</p>}</section><section className="panel"><div className="panel-head"><div><span>Invitations</span><h3>Pending & recent</h3></div></div>{(data?.invites||[]).map(inv=><div className="team-row" key={inv.id}><div><strong>{inv.email}</strong><span>{inv.role} · {inv.accepted_at?'Accepted':new Date(inv.expires_at)<new Date()?'Expired':'Pending'}</span></div>{!inv.accepted_at&&canInvite&&<div className="row-actions"><button title="Copy invite" onClick={()=>copyInvite(inv)}><Copy size={14}/></button><button title="Revoke" onClick={()=>revoke(inv.id)}><Trash2 size={14}/></button></div>}</div>)}{!data?.invites?.length&&<p>No invitations yet.</p>}</section></div></div>
}


export function BlogManager({items,setItems,media=[]}) {
  const empty={title:'',slug:'',excerpt:'',content:'',featured_image:'',status:'Draft',seo_title:'',seo_description:'',published_at:null}
  const [editing,setEditing]=useState(null)
  const [draft,setDraft]=useState(empty)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const open=x=>{setEditing(x?.id||'new');setDraft(x?{...empty,...x}:{...empty});setError('')}
  const save=async()=>{
    if(!draft.title.trim())return setError('Post title is required.')
    setBusy(true);setError('')
    const slug=(draft.slug||draft.title).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
    const payload={...draft,slug,published_at:draft.status==='Published'?(draft.published_at||new Date().toISOString()):draft.published_at}
    delete payload.id;delete payload.user_id;delete payload.created_at;delete payload.updated_at
    try{
      if(editing==='new'){const x=await createResource('blog_posts',payload);setItems(p=>[x,...p])}
      else{const x=await updateResource('blog_posts',editing,payload);setItems(p=>p.map(y=>y.id===editing?x:y))}
      setEditing(null)
    }catch(err){setError(err.message)}finally{setBusy(false)}
  }
  const remove=async x=>{if(!window.confirm(`Delete post "${x.title}"?`))return;await deleteResource('blog_posts',x.id);setItems(p=>p.filter(y=>y.id!==x.id))}
  return <div className="page-wrap"><div className="page-head"><div><p className="overline">CMS</p><h1>Blog</h1><p>Write and publish long-form content to the public storefront.</p></div><Button onClick={()=>open()}><Plus size={16}/> New post</Button></div><div className="table-card"><table><thead><tr><th>Post</th><th>Status</th><th>Published</th><th/></tr></thead><tbody>{items.map(x=><tr key={x.id}><td><div className="product-cell">{x.featured_image?<img className="admin-product-image" src={x.featured_image} alt=""/>:<div className="product-thumb"><FileText size={18}/></div>}<div><strong>{x.title}</strong><span>/{x.slug}</span></div></div></td><td><span className={`status ${String(x.status).toLowerCase()}`}>{x.status}</span></td><td>{x.published_at?new Date(x.published_at).toLocaleDateString():'—'}</td><td><div className="row-actions"><button onClick={()=>open(x)}><Pencil size={15}/></button><button onClick={()=>remove(x)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table>{!items.length&&<Empty title="No posts" body="Create your first blog post or journal story."/>}</div>{editing&&<Modal title={editing==='new'?'New blog post':'Edit blog post'} onClose={()=>setEditing(null)}><div className="modal-form">{error&&<div className="auth-message auth-error">{error}</div>}<Field label="Title"><input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></Field><Field label="Slug"><input value={draft.slug||''} onChange={e=>setDraft({...draft,slug:e.target.value})} placeholder="auto-from-title"/></Field><Field label="Excerpt"><textarea rows="3" value={draft.excerpt||''} onChange={e=>setDraft({...draft,excerpt:e.target.value})}/></Field><Field label="Content"><textarea className="cms-content-editor" rows="14" value={draft.content||''} onChange={e=>setDraft({...draft,content:e.target.value})} placeholder="Write the article content here…"/></Field><Field label="Featured image"><select value={draft.featured_image||''} onChange={e=>setDraft({...draft,featured_image:e.target.value})}><option value="">No featured image</option>{media.filter(x=>String(x.mime_type||'').startsWith('image')).map(x=><option key={x.id} value={x.url}>{x.name}</option>)}</select></Field><div className="form-grid two"><Field label="Status"><select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option>Draft</option><option>Published</option><option>Archived</option></select></Field><Field label="SEO title"><input value={draft.seo_title||''} onChange={e=>setDraft({...draft,seo_title:e.target.value})}/></Field></div><Field label="SEO description"><textarea rows="3" value={draft.seo_description||''} onChange={e=>setDraft({...draft,seo_description:e.target.value})}/></Field><div className="modal-actions"><Button variant="secondary" onClick={()=>setEditing(null)}>Cancel</Button><Button disabled={busy} onClick={save}>{busy?'Saving…':'Save post'}</Button></div></div></Modal>}</div>
}


export function BillingManager() {
  const [data,setData]=useState(null)
  const [busy,setBusy]=useState('')
  const [error,setError]=useState('')
  const load=()=>{setError('');fetch('/api/billing/status',{headers:{authorization:`Bearer ${localStorage.getItem('cobest-auth-token')||''}`}}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to load billing.');return d}).then(setData).catch(e=>setError(e.message))}
  useEffect(load,[])
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search)
    if(params.get('billing')){window.history.replaceState({},document.title,'/');load()}
  },[])
  const upgrade=async plan=>{
    setBusy(plan);setError('')
    try{
      const r=await fetch('/api/billing/checkout',{method:'POST',headers:{authorization:`Bearer ${localStorage.getItem('cobest-auth-token')||''}`,'content-type':'application/json'},body:JSON.stringify({plan})})
      const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to start billing checkout.');window.location.assign(d.checkout_url)
    }catch(e){setError(e.message)}finally{setBusy('')}
  }
  const portal=async()=>{
    setBusy('portal');setError('')
    try{const r=await fetch('/api/billing/portal',{method:'POST',headers:{authorization:`Bearer ${localStorage.getItem('cobest-auth-token')||''}`,'content-type':'application/json'},body:'{}'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to open billing portal.');window.location.assign(d.url)}catch(e){setError(e.message)}finally{setBusy('')}
  }
  const plans=[
    {name:'Free',price:'₱0',note:'Build and preview',features:['Guided onboarding','Visual builder','Store preview']},
    {name:'Launch',price:'₱990 / month',note:'Publish and sell',features:['Public storefront','Custom domain routing','Products, orders, customers']},
    {name:'Growth',price:'₱2,490 / month',note:'Operate with a team',features:['Everything in Launch','Team roles','Advanced analytics and support']}
  ]
  const current=data?.plan||'Free'
  return <div className="page-wrap"><div className="page-head"><div><p className="overline">BILLING</p><h1>Plan & billing</h1><p>Choose the CoBest plan for this workspace.</p></div>{data?.subscription?.customer_reference&&<Button variant="secondary" onClick={portal}>Manage billing</Button>}</div>{error&&<div className="auth-message auth-error">{error}</div>}<div className="billing-plan-grid">{plans.map(plan=><article className={`panel billing-plan ${current===plan.name?'current':''}`} key={plan.name}><span className="overline">{plan.note}</span><h2>{plan.name}</h2><strong className="billing-price">{plan.price}</strong><ul>{plan.features.map(x=><li key={x}><Check size={14}/>{x}</li>)}</ul>{current===plan.name?<span className="status active">Current plan</span>:plan.name==='Free'?null:<Button disabled={!!busy||!data?.stripe_connected} onClick={()=>upgrade(plan.name)}>{busy===plan.name?'Opening checkout…':data?.stripe_connected?`Choose ${plan.name}`:'Stripe setup required'}</Button>}</article>)}</div><section className="panel integration-note"><strong>Subscription status</strong><div className="metric-row"><span>Plan</span><strong>{current}</strong></div><div className="metric-row"><span>Status</span><strong>{data?.subscription?.status||'No paid subscription'}</strong></div><div className="metric-row"><span>Stripe billing</span><strong>{data?.stripe_connected?'Ready':'Not connected'}</strong></div>{data?.subscription?.current_period_end&&<div className="metric-row"><span>Current period ends</span><strong>{new Date(data.subscription.current_period_end).toLocaleDateString()}</strong></div>}</section></div>
}


export function TaxonomyManager({items,setItems,products,setProducts}) {
  const [type,setType]=useState('category')
  const [name,setName]=useState('')
  const [editing,setEditing]=useState(null)
  const [error,setError]=useState('')
  const shown=items.filter(x=>x.term_type===type)
  const save=async()=>{
    const clean=name.trim();if(!clean)return
    setError('')
    const slug=clean.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
    try{
      if(editing){
        const before=items.find(x=>x.id===editing)
        const updated=await updateResource('catalog_terms',editing,{name:clean,slug})
        setItems(p=>p.map(x=>x.id===editing?updated:x))
        if(before?.name&&before.name!==clean){
          const affected=products.filter(p=>(type==='category'?p.category:p.brand)===before.name)
          for(const p of affected){
            const change=type==='category'?{category:clean}:{brand:clean}
            const updatedProduct=await updateResource('products',p.id,change)
            setProducts(prev=>prev.map(x=>x.id===p.id?updatedProduct:x))
          }
        }
        setEditing(null)
      }else{
        const created=await createResource('catalog_terms',{term_type:type,name:clean,slug})
        setItems(p=>[created,...p])
      }
      setName('')
    }catch(err){setError(err.message)}
  }
  const edit=x=>{setEditing(x.id);setName(x.name)}
  const remove=async x=>{
    const used=products.filter(p=>(x.term_type==='category'?p.category:p.brand)===x.name).length
    if(used&&!window.confirm(`${x.name} is used by ${used} products. Delete the saved ${x.term_type} anyway?`))return
    if(!used&&!window.confirm(`Delete ${x.name}?`))return
    await deleteResource('catalog_terms',x.id);setItems(p=>p.filter(y=>y.id!==x.id))
  }
  return <div className="page-wrap"><div className="page-head"><div><p className="overline">CATALOG</p><h1>Categories & brands</h1><p>Maintain reusable product taxonomy across the catalog.</p></div></div>{error&&<div className="auth-message auth-error">{error}</div>}<div className="tab-row"><button className={type==='category'?'active':''} onClick={()=>{setType('category');setEditing(null);setName('')}}>Categories</button><button className={type==='brand'?'active':''} onClick={()=>{setType('brand');setEditing(null);setName('')}}>Brands</button></div><section className="panel taxonomy-create"><div className="form-grid two"><Field label={editing?`Rename ${type}`:`New ${type}`}><input value={name} onChange={e=>setName(e.target.value)} placeholder={type==='category'?'Lighting':'Acme'}/></Field><div className="team-invite-action"><Button onClick={save}>{editing?'Save rename':'Add'}</Button>{editing&&<Button variant="secondary" onClick={()=>{setEditing(null);setName('')}}>Cancel</Button>}</div></div></section><div className="taxonomy-grid">{shown.map(x=>{const count=products.filter(p=>(type==='category'?p.category:p.brand)===x.name).length;return <article className="panel" key={x.id}><div><strong>{x.name}</strong><span>{count} products</span></div><div className="row-actions"><button onClick={()=>edit(x)}><Pencil size={15}/></button><button onClick={()=>remove(x)}><Trash2 size={15}/></button></div></article>})}</div>{!shown.length&&<Empty title={`No ${type}s`} body={`Add a reusable ${type} for your catalog.`}/>}</div>
}


export function SitesManager({sites=[],activeSiteId,onSwitch,onCreate,onDelete}) {
  return <div className="page-wrap"><div className="page-head"><div><p className="overline">PLATFORM</p><h1>Sites</h1><p>Create and switch between separate websites under the same CoBest account.</p></div><Button onClick={onCreate}><Plus size={16}/> Create site</Button></div><div className="sites-grid">{sites.map(site=><article className={`panel site-card ${String(site.id)===String(activeSiteId)?'current':''}`} key={site.id}><div className="panel-head"><div><span>{site.is_published?'PUBLISHED':'DRAFT'}</span><h3>{site.site_name||site.slug||'Untitled website'}</h3></div>{String(site.id)===String(activeSiteId)&&<span className="status active">Active</span>}</div><div className="metric-row"><span>Slug</span><strong>{site.slug||'—'}</strong></div><div className="metric-row"><span>Plan</span><strong>{site.plan||'Free'}</strong></div><div className="metric-row"><span>Domain</span><strong>{site.custom_domain||'CoBest URL'}</strong></div><div className="site-card-actions">{String(site.id)!==String(activeSiteId)&&<Button variant="secondary" onClick={()=>onSwitch(site.id)}>Open site</Button>}{sites.length>1&&<button className="icon-danger" title="Delete site" onClick={()=>onDelete(site.id)}><Trash2 size={15}/></button>}</div></article>)}</div>{!sites.length&&<Empty title="No sites yet" body="Complete onboarding to create your first website."/ >}</div>
}
