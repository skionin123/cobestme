import React,{useState} from 'react'
import {ArrowUpRight,Check,Monitor,Smartphone} from 'lucide-react'
import ProductGrid from './ProductGrid.jsx'
import './storefront-editor.css'

export const storefrontThemes=[
  {id:'market',name:'Sunday Market',note:'Sunflower, raspberry and bold type.'},
  {id:'atelier',name:'Midnight Atelier',note:'Ink, ivory and editorial serif type.'},
  {id:'blank',name:'Blank',note:'Neutral canvas with your existing content.'}
]

export function StorefrontDesign({name,design={},products=[],currency='PHP',heroOnly=false,onAdd,onOpen,onShop}){
  const active=products.filter(p=>p.status==='Active')
  const cover=active.find(p=>String(p.id)===String(design.cover))||active.find(p=>p.image_url||p.images?.[0])
  const photo=design.cover==='art'?'':cover?.image_url||cover?.images?.[0]
  return <div className={'designed-store skin-'+(storefrontThemes.some(t=>t.id===design.theme)?design.theme:'market')}>
    <section className="design-hero">
      <div className="design-hero-copy"><h1>{design.heading||name}</h1>
        {design.intro&&<p>{design.intro}</p>}
        {onShop&&<button onClick={onShop}>Shop collection <ArrowUpRight size={15}/></button>}
      </div>
      {(design.theme!=='blank'||(photo&&design.cover!=='auto'))&&<div className={'design-art'+(photo?' with-photo':'')} aria-hidden={!photo}>
        {photo?<img src={photo} alt={cover.name}/>:<i/>}
      </div>}
    </section>
    {!heroOnly&&<section className="design-collection"><h2>{design.collection||'Shop the collection'}</h2>
      {active.length?<ProductGrid products={active} currency={currency} onAdd={onAdd} onOpen={onOpen}/>:<p>Your products will appear here.</p>}
    </section>}
  </div>
}

export default function StorefrontEditor({name,design,previousDesign,initialTheme,backLabel='Store overview',products,currency='PHP',liveInfo=null,onSave,onPublish,onBack}){
  const defaults={theme:'market',heading:name,intro:'',collection:'Shop the collection',cover:'auto'}
  const baseline={...defaults,...design}
  const [history,setHistory]=useState(()=>initialTheme&&initialTheme!==baseline.theme
    ? {past:[baseline],current:{...baseline,theme:initialTheme},future:[]}
    : {past:[],current:baseline,future:[]})
  const draft=history.current
  const [saved,setSaved]=useState(JSON.stringify(baseline))
  const [phone,setPhone]=useState(false)
  const [mobilePreview,setMobilePreview]=useState(false)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')
  const [url,setUrl]=useState('')
  // The homepage may currently be a custom page from the Advanced editor.
  // Publishing this design only replaces it when the owner says so.
  const customHomeLive=!!liveInfo?.published&&liveInfo.home_source==='custom'
  const [makeHome,setMakeHome]=useState(false)
  function edit(next){
    setHistory(h=>JSON.stringify(h.current)===JSON.stringify(next)?h:
      {past:[...h.past,h.current].slice(-100),current:next,future:[]})
    setMessage('');setError('')
  }
  function field(key,value){edit({...draft,[key]:value})}
  function step(back){
    setHistory(h=>{
      if(back&&h.past.length)return {past:h.past.slice(0,-1),current:h.past.at(-1),future:[h.current,...h.future]}
      if(!back&&h.future.length)return {past:[...h.past,h.current],current:h.future[0],future:h.future.slice(1)}
      return h
    })
    setError('');setMessage('')
  }
  async function save(publish){
    if(busy)return
    setBusy(true);setMessage('');setError('')
    let confirmed=false
    try{
      await onSave(draft);confirmed=true;setSaved(JSON.stringify(draft))
      if(publish){
        const keepCustomHome=customHomeLive&&!makeHome
        setUrl(await onPublish(draft,customHomeLive&&makeHome?{homeSource:'storefront'}:{}))
        setMessage(keepCustomHome?'Design published. Your homepage still shows your custom Home page.':'Design published.')
      }
      else setMessage('Design saved. Publish when you’re ready.')
    }catch(err){setError((confirmed?'Design saved. Publishing failed. ':'')+(err.message||'Please retry.'))}
    finally{setBusy(false)}
  }
  return <section className="design-workspace">
    <header className="design-toolbar"><div><button onClick={()=>{
      if(JSON.stringify(draft)===saved||window.confirm('Leave without saving these design changes?'))onBack()
    }}>← {backLabel}</button><h1>Storefront editor</h1></div>
    <div><button className="btn btn-secondary" disabled={busy} onClick={()=>save(false)}>Save design</button>
    <button className="btn btn-primary" disabled={busy} onClick={()=>save(true)}>Publish design</button></div></header>
    {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message} {url&&<a href={url}>Open storefront</a>}</p>}
    {customHomeLive&&<label className="design-home-choice"><input type="checkbox" checked={makeHome} onChange={e=>setMakeHome(e.target.checked)}/>
      <span><strong>Make this storefront design my homepage</strong><small>Right now visitors first see the Home page from the Advanced editor. Leave this off to keep it.</small></span></label>}
    <div className="design-mobile-switch"><button aria-pressed={!mobilePreview} onClick={()=>setMobilePreview(false)}>Edit settings</button><button aria-pressed={mobilePreview} onClick={()=>setMobilePreview(true)}>Preview storefront</button></div>
    <div className={'design-layout'+(mobilePreview?' show-preview':'')}>
      <fieldset disabled={busy} className="design-controls"><legend>Store design</legend>
        <h2>Theme</h2><p className="theme-hint">Switch styles to preview. Your text and products stay in place.</p>
        <div className="theme-history"><button type="button" disabled={!history.past.length} onClick={()=>step(true)}>Undo</button><button type="button" disabled={!history.future.length} onClick={()=>step(false)}>Redo</button></div>
        {storefrontThemes.map(t=><button type="button" key={t.id} className="design-option" aria-pressed={draft.theme===t.id} onClick={()=>field('theme',t.id)}>
          <span className={'design-swatch swatch-'+t.id}/><span><strong>{t.name}</strong><small>{t.note}</small></span>
          {draft.theme===t.id&&<Check size={17}/>}
        </button>)}
        {previousDesign&&<button type="button" className="restore-design" onClick={()=>edit({...defaults,...previousDesign})}>Restore previous save</button>}
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
