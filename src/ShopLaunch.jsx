import React, {useRef,useState} from 'react'
import ProductGrid from './ProductGrid.jsx'
import {uploadMedia} from './api.js'
import { Icon3D } from './Art3D.jsx'

export default function ShopLaunch({workspace,ready,publishReady,products,currency,onCreate,onAdd,onPublish,demo=false,onUpload=uploadMedia}){
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [publishedUrl,setPublishedUrl]=useState('')
  const [celebrate,setCelebrate]=useState(false)
  const uploadedPhoto=useRef(null)
  const activeProducts=products.filter(product=>product.status==='Active')
  const activeCount=activeProducts.length
  const storeUrl=publishedUrl||(workspace?.is_published&&workspace.slug?demo?'/demo/preview':`/store/${encodeURIComponent(workspace.slug)}`:'')
  async function run(action){
    if(busy)return
    setBusy(true)
    setError('')
    setNotice('')
    setCelebrate(false)
    try{await action()}catch(err){setError(err.message||'Unable to save. Please try again.')}
    finally{setBusy(false)}
  }
  function create(event){
    event.preventDefault()
    const name=new FormData(event.currentTarget).get('shopName').trim()
    if(!name)return setError('Enter a shop name.')
    run(()=>onCreate(name))
  }
  async function publish(){
    const url=await onPublish()
    setPublishedUrl(url)
    setCelebrate(true)
    setNotice(demo?'Your demo preview is ready.':'Your shop is live. Share the link with customers.')
  }
  function add(event){
    event.preventDefault()
    const publishNow=event.nativeEvent.submitter?.value==='publish'
    const form=event.currentTarget
    const data=new FormData(form)
    const name=data.get('name').trim()
    if(!name)return setError('Enter a product name.')
    run(async()=>{
      const file=form.elements.photo.files[0]
      let imageUrl=''
      if(file?.name){
        if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size===0||file.size>12*1024*1024){
          throw new Error('Choose a JPG, PNG or WebP photo of 12 MB or less.')
        }
        if(uploadedPhoto.current?.file!==file){
          const asset=await onUpload(file)
          if(!asset?.url)throw new Error('Photo upload was not confirmed. Please retry.')
          uploadedPhoto.current={file,url:asset.url}
        }
        imageUrl=uploadedPhoto.current.url
      }
      await onAdd({name,price:data.get('price'),inventory:data.get('inventory'),image_url:imageUrl,status:'Active'})
      uploadedPhoto.current=null
      form.reset()
      if(publishNow){
        try{await publish()}
        catch(err){throw new Error(`${name} was saved. ${err.message} Use ${storeUrl?'Publish updates':'Publish shop'} to retry.`)}
      }else{
        setNotice(demo?`${name} saved. Publish to update your demo preview.`:`${name} saved. Publish your shop to show it to customers.`)
      }
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
        <label className="field shop-photo"><span>Product photo (optional)</span>
          <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy}/>
        </label>
        <div className="shop-save-actions">
          <button className="btn btn-secondary" type="submit" value="save" disabled={busy}>Save product</button>
          <button className="btn btn-primary" type="submit" value="publish" disabled={busy||!publishReady}>Save and publish</button>
        </div>
      </form>
      <div className="shop-publish">
        {activeCount>0&&<details className="shop-catalog-preview">
          <summary>Preview catalog ({activeCount})</summary>
          <ProductGrid products={activeProducts} currency={currency}/>
        </details>}
        <p>{activeCount} active {activeCount===1?'product':'products'} · {storeUrl?(demo?'Demo preview available':'Shop is live'):activeCount?'Ready to publish':'Add a product to publish'}</p>
        <button className="btn btn-primary" disabled={busy||(!activeCount&&!storeUrl)||!publishReady} onClick={()=>run(publish)}>{storeUrl?'Publish updates':'Publish shop'}</button>
        {storeUrl&&<div className="shop-share">
          <a href={storeUrl} target={demo?undefined:"_blank"} rel="noreferrer">{demo?'Open demo preview':'Open shop ↗'}</a>
          {!demo&&<button className="btn btn-secondary" type="button" onClick={()=>run(async()=>{
            const link=new URL(storeUrl,window.location.origin).href
            try{await navigator.clipboard.writeText(link);setNotice('Shop link copied.')}
            catch{setNotice(link)}
          })}>Copy shop link</button>}
        </div>}
      </div>
    </>}
    {error&&<p role="alert">{error}</p>}
    {notice&&<p role="status" className={celebrate?'shop-live':undefined}>{celebrate&&<Icon3D name="party" size={52} play="enter" ground={false}/>}{notice}</p>}
  </section>
}
