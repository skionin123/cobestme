import React, {useState} from 'react'

export default function ShopLaunch({workspace,ready,publishReady,products,currency,onCreate,onAdd,onPublish}){
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [publishedUrl,setPublishedUrl]=useState('')
  const activeCount=products.filter(product=>product.status==='Active').length
  const storeUrl=publishedUrl||(workspace?.is_published&&workspace.slug?`/store/${encodeURIComponent(workspace.slug)}`:'')
  async function run(action){
    if(busy)return
    setBusy(true)
    setError('')
    setNotice('')
    try{await action()}catch(err){setError(err.message||'Unable to save. Please try again.')}
    finally{setBusy(false)}
  }
  function create(event){
    event.preventDefault()
    const name=new FormData(event.currentTarget).get('shopName').trim()
    if(!name)return setError('Enter a shop name.')
    run(()=>onCreate(name))
  }
  function add(event){
    event.preventDefault()
    const form=event.currentTarget
    const data=new FormData(form)
    const name=data.get('name').trim()
    if(!name)return setError('Enter a product name.')
    run(async()=>{
      await onAdd({name,price:data.get('price'),inventory:data.get('inventory'),status:'Active'})
      form.reset()
      setNotice(`${name} saved. Publish your shop to show it to customers.`)
    })
  }
  if(!ready)return <section className="panel" role="status">Waiting for shop data…</section>
  return <section className="panel shop-launch">
    {!workspace?.id?<form onSubmit={create}>
      <h2>Create your shop</h2>
      <label className="field"><span>Shop name</span><input name="shopName" required maxLength={100} placeholder="e.g. Isla Home"/></label>
      <button className="btn btn-primary" disabled={busy}>Create shop</button>
    </form>:<>
      <h2>{workspace.site_name||'Your shop'}</h2>
      <form onSubmit={add}>
        <h3>{products.length?'Add a product':'Add your first product'}</h3>
        <div className="shop-fields">
          <label className="field"><span>Product name</span><input name="name" required placeholder="e.g. Ceramic mug"/></label>
          <label className="field"><span>Price ({currency})</span><input name="price" type="number" required min="0" step="0.01"/></label>
          <label className="field"><span>Available quantity</span><input name="inventory" type="number" required min="1" step="1" defaultValue="1"/></label>
        </div>
        <button className="btn btn-secondary" disabled={busy}>Save product</button>
      </form>
      <div className="shop-publish">
        <p>{activeCount} active {activeCount===1?'product':'products'} · {storeUrl?'Shop is live':'Ready to publish when you add a product'}</p>
        <button className="btn btn-primary" disabled={busy||!activeCount||!publishReady} onClick={()=>run(async()=>{
          const url=await onPublish()
          setPublishedUrl(url)
          setNotice('Your shop is live. Share the link with customers.')
        })}>{storeUrl?'Publish updates':'Publish shop'}</button>
        {storeUrl&&<a href={storeUrl} target="_blank" rel="noreferrer">Open shop ↗</a>}
      </div>
    </>}
    {error&&<p role="alert">{error}</p>}
    {notice&&<p role="status">{notice}</p>}
  </section>
}
