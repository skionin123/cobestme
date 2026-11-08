import React,{useEffect,useState} from 'react'
import ShopLaunch from './ShopLaunch.jsx'
import StorefrontEditor,{StorefrontDesign} from './StorefrontEditor.jsx'
import './store-overview.css'

const emptyShop=()=>({name:'',products:[],published:null})

async function localShop(change){
  const db=await new Promise((resolve,reject)=>{
    const request=indexedDB.open('cobest-guest-demo',1)
    request.onupgradeneeded=()=>request.result.createObjectStore('demo')
    request.onsuccess=()=>resolve(request.result)
    request.onerror=()=>reject(request.error)
  })
  try{
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction('demo',change?'readwrite':'readonly')
      const store=tx.objectStore('demo')
      const read=store.get('shop')
      let result,failure
      read.onsuccess=()=>{
        try{
          const current=read.result||emptyShop()
          result=change?change(current):current
          if(change)store.put(result,'shop')
        }catch(err){failure=err;tx.abort()}
      }
      tx.oncomplete=()=>resolve(result)
      tx.onabort=()=>reject(failure||new Error('Could not save the demo. Check that browser storage is available.'))
    })
  }finally{db.close()}
}

function readPhoto(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader()
    reader.onload=()=>resolve({url:reader.result})
    reader.onerror=()=>reject(new Error('Could not read the photo. Please select it again.'))
    reader.readAsDataURL(file)
  })
}

export default function GuestShop({preview}){
  const [shop,setShop]=useState(null)
  const [error,setError]=useState('')
  const choice=new URLSearchParams(window.location.search).get('theme')
  const theme=['atelier','market','blank'].includes(choice)?choice:null
  const [editing,setEditing]=useState(Boolean(theme))
  useEffect(()=>{
    let active=true
    localShop().then(value=>{if(active)setShop(value)}).catch(()=>{if(active)setError('Enable browser storage or try another browser to start the demo.')})
    return ()=>{active=false}
  },[])
  async function update(change){const next=await localShop(change);setShop(next)}
  function create(name){
    return update(current=>{
      if(current.name)throw new Error('A demo shop already exists. Refresh to open it.')
      return {...current,name,design:{theme:theme||'market'}}
    })
  }
  function add(product){
    return update(current=>{
      if(!current.name||current.name!==shop.name)throw new Error('Your demo shop changed. Refresh before adding a product.')
      return {...current,products:[{...product,id:crypto.randomUUID(),price:Number(product.price),inventory:Number(product.inventory)},...current.products]}
    })
  }
  async function publish(design){
    await update(current=>{
      if(!current.name||current.name!==shop.name||(!current.products.length&&!design))throw new Error('Refresh and add a product before publishing.')
      return {...current,published:{name:current.name,products:current.products,design:current.design}}
    })
    return '/demo/preview'
  }
  async function saveDesign(design){
    await update(current=>{
      if(!current.name||current.name!==shop.name)throw new Error('Refresh to open the current demo.')
      return JSON.stringify(current.design)===JSON.stringify(design)?current:{...current,previousDesign:current.design,design}
    })
  }
  if(editing&&shop?.name)return <main className="guest-editor"><p className="demo-editor-note">Guest demo · Publishing updates this browser’s preview.</p><StorefrontEditor name={shop.name} design={shop.design} previousDesign={shop.previousDesign} initialTheme={theme} products={shop.products} onSave={saveDesign} onPublish={publish} onBack={()=>{window.history.replaceState({},'', '/demo');setEditing(false)}}/></main>
  return <main className="guest-shop">
    <header><a href={preview?'/demo':'/'}>{preview?'← Back to demo':'← CoBest'}</a><span>Guest demo</span></header>
    {!preview&&<h1>Try your shop</h1>}
    <p>{preview?'This storefront preview is visible in this browser only.':'Test creating a shop and publishing products. Your demo is saved in this browser, including after a refresh.'}</p>
    {error?<p role="alert">{error}</p>:!shop?<p role="status">Loading demo…</p>:preview?
      (shop.published?<StorefrontDesign name={shop.published.name} design={shop.published.design} products={shop.published.products} currency="PHP"/>:<p>Publish a product in the demo to see it here.</p>):
      <ShopLaunch key={shop.name} demo ready publishReady currency="PHP" products={shop.products}
        workspace={shop.name?{id:'demo',slug:'demo',site_name:shop.name,is_published:!!shop.published}:null}
        onCreate={create} onAdd={add} onPublish={publish} onUpload={readPhoto}/>}
    {!preview&&shop?.name&&<button className="btn btn-primary" onClick={()=>setEditing(true)}>Edit storefront</button>}
    {!preview&&shop?.name&&<button className="btn btn-secondary" onClick={async()=>{
      if(!window.confirm('Clear this browser’s demo shop and start again?'))return
      try{await update(emptyShop)}catch{setError('Could not reset the demo. Refresh and try again.')}
    }}>Start demo again</button>}
  </main>
}
