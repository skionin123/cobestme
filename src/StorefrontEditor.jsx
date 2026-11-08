import React,{useState} from 'react'
import {ArrowUpRight,Check,Monitor,Smartphone} from 'lucide-react'
import ProductGrid from './ProductGrid.jsx'
import './storefront-editor.css'

const themes=[
  {id:'market',name:'Sunday Market',note:'Sunflower, raspberry and bold type.'},
  {id:'atelier',name:'Midnight Atelier',note:'Ink, ivory and editorial serif type.'}
]

export function StorefrontDesign({name,design={},products=[],currency='PHP',onAdd,onOpen,onShop}){
  const active=products.filter(p=>p.status==='Active')
  const cover=active.find(p=>String(p.id)===String(design.cover))||active.find(p=>p.image_url||p.images?.[0])
  const photo=design.cover==='art'?'':cover?.image_url||cover?.images?.[0]
  return <div className={'designed-store skin-'+(design.theme==='atelier'?'atelier':'market')}>
    <section className="design-hero">
      <div className="design-hero-copy"><h1>{design.heading||name}</h1>
        {design.intro&&<p>{design.intro}</p>}
        {onShop&&<button onClick={onShop}>Shop collection <ArrowUpRight size={15}/></button>}
      </div>
      <div className={'design-art'+(photo?' with-photo':'')} aria-hidden={!photo}>
        {photo?<img src={photo} alt={cover.name}/>:<i/>}
      </div>
    </section>
    <section className="design-collection"><h2>{design.collection||'Shop the collection'}</h2>
      {active.length?<ProductGrid products={active} currency={currency} onAdd={onAdd} onOpen={onOpen}/>:<p>Your products will appear here.</p>}
    </section>
  </div>
}

export default function StorefrontEditor({name,design,products,currency='PHP',onSave,onPublish,onBack}){
  const [draft,setDraft]=useState(()=>({theme:'market',heading:name,intro:'',collection:'Shop the collection',cover:'auto',...design}))
  const [saved,setSaved]=useState(JSON.stringify(draft))
  const [phone,setPhone]=useState(false)
  const [mobilePreview,setMobilePreview]=useState(false)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')
  const [url,setUrl]=useState('')
  function field(key,value){setDraft(prev=>({...prev,[key]:value}));setMessage('');setError('')}
  async function save(publish){
    if(busy)return
    setBusy(true);setMessage('');setError('')
    let confirmed=false
    try{
      await onSave(draft);confirmed=true;setSaved(JSON.stringify(draft))
      if(publish){setUrl(await onPublish(draft));setMessage('Design published.')}
      else setMessage('Design saved. Publish when you’re ready.')
    }catch(err){setError((confirmed?'Design saved. Publishing failed. ':'')+(err.message||'Please retry.'))}
    finally{setBusy(false)}
  }
  return <section className="design-workspace">
    <header className="design-toolbar"><div><button onClick={()=>{
      if(JSON.stringify(draft)===saved||window.confirm('Leave without saving these design changes?'))onBack()
    }}>← Store overview</button><h1>Storefront editor</h1></div>
    <div><button className="btn btn-secondary" disabled={busy} onClick={()=>save(false)}>Save design</button>
    <button className="btn btn-primary" disabled={busy} onClick={()=>save(true)}>Publish design</button></div></header>
    {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message} {url&&<a href={url}>Open storefront</a>}</p>}
    <div className="design-mobile-switch"><button aria-pressed={!mobilePreview} onClick={()=>setMobilePreview(false)}>Edit settings</button><button aria-pressed={mobilePreview} onClick={()=>setMobilePreview(true)}>Preview storefront</button></div>
    <div className={'design-layout'+(mobilePreview?' show-preview':'')}>
      <fieldset disabled={busy} className="design-controls"><legend>Store design</legend>
        <h2>Theme</h2>
        {themes.map(t=><button type="button" key={t.id} className="design-option" aria-pressed={draft.theme===t.id} onClick={()=>field('theme',t.id)}>
          <span className={'design-swatch swatch-'+t.id}/><span><strong>{t.name}</strong><small>{t.note}</small></span>
          {draft.theme===t.id&&<Check size={17}/>}
        </button>)}
        <h2>Homepage</h2>
        <label className="field"><span>Headline</span><input value={draft.heading} maxLength={100} onChange={e=>field('heading',e.target.value)}/></label>
        <label className="field"><span>Introduction</span><textarea value={draft.intro} maxLength={300} onChange={e=>field('intro',e.target.value)}/></label>
        <label className="field"><span>Cover artwork</span><select value={draft.cover} onChange={e=>field('cover',e.target.value)}>
          <option value="auto">First available product photo</option><option value="art">Theme artwork</option>
          {products.filter(p=>p.status==='Active'&&(p.image_url||p.images?.[0])).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select></label>
        <label className="field"><span>Collection heading</span><input value={draft.collection} maxLength={80} onChange={e=>field('collection',e.target.value)}/></label>
      </fieldset>
      <div className="design-preview"><div className="design-preview-bar"><strong>Live preview</strong>
        <div><button aria-label="Desktop preview" aria-pressed={!phone} onClick={()=>setPhone(false)}><Monitor size={17}/></button>
        <button aria-label="Phone preview" aria-pressed={phone} onClick={()=>setPhone(true)}><Smartphone size={17}/></button></div></div>
        <div className={'design-device'+(phone?' phone':'')}>
          <StorefrontDesign name={name} design={draft} products={products} currency={currency}/>
        </div>
      </div>
    </div>
  </section>
}
