import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  AlignLeft, Box, ChevronDown, ChevronRight, ChevronUp, Columns3, Copy, CornerLeftUp, EyeOff, Eye,
  FileText, GripVertical, Heading1, Image as ImageIcon, LayoutGrid, Link2, MousePointerClick,
  Plus, Square, Trash2, Upload, X, Video, Quote, Rows3, ClipboardCopy
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { isAuthenticated, uploadMedia } from '../api.js'
import { DesignControls, fontChoices } from './DesignControls'
import { createElement, createPrebuiltSection, sectionCatalog } from './elements'
import { applyTemplate, builderTemplates } from './templates'
import { ImageSettings, InteractionsPanel, SettingsPanel, StylePanel } from './panels'
import { useBuilderStore } from './store'
import { canAcceptChildren, findNode, findParent, slugify, uid } from './tree'
import { safeUrl } from './compiler'
import {
  activePage, elementInsertTarget, friendlyType, linkTypes, sectionInsertTarget, siblingPosition, textTypes
} from './editorModel'
import type { BuilderAsset, BuilderNode, BuilderNodeType } from './types'

/* ───────────────────────── Add panel ───────────────────────── */

const sectionBlurb:Record<string,string>={
  navbar:'Logo and menu links',hero:'Big headline and button',features:'Three key benefits',
  testimonials:'Customer quotes',pricing:'Plans and prices',faq:'Questions and answers',
  cta:'Short call to action',contact:'Contact form',footer:'Bottom links and copyright',
}

function SectionThumb({id}:{id:string}){
  const line=(w:string,h=4,extra='')=><i className={'ee-thumb-line '+extra} style={{width:w,height:h}}/>
  if(id==='navbar')return <div className="ee-thumb ee-thumb-row">{line('22%',6,'dark')}<span className="ee-thumb-gap"/>{line('12%')}{line('12%')}{line('12%')}</div>
  if(id==='hero')return <div className="ee-thumb ee-thumb-hero">{line('70%',9,'dark')}{line('55%')}{line('40%')}<i className="ee-thumb-btn"/></div>
  if(id==='features')return <div className="ee-thumb ee-thumb-cols">{[0,1,2].map(i=><div key={i}><i className="ee-thumb-dot"/>{line('80%',4,'dark')}{line('60%')}</div>)}</div>
  if(id==='testimonials')return <div className="ee-thumb ee-thumb-cols">{[0,1].map(i=><div key={i} className="card">{line('85%')}{line('70%')}{line('40%',4,'dark')}</div>)}</div>
  if(id==='pricing')return <div className="ee-thumb ee-thumb-cols">{[0,1,2].map(i=><div key={i} className={'card '+(i===1?'accent':'')}>{line('50%',3)}{line('40%',7,'dark')}{line('70%',3)}</div>)}</div>
  if(id==='faq')return <div className="ee-thumb ee-thumb-list">{[0,1,2].map(i=><div key={i}>{line('70%',4,'dark')}<span>+</span></div>)}</div>
  if(id==='cta')return <div className="ee-thumb ee-thumb-cta">{line('60%',7,'light')}<i className="ee-thumb-btn light"/></div>
  if(id==='contact')return <div className="ee-thumb ee-thumb-form"><div>{line('70%',6,'dark')}{line('50%')}</div><div>{[0,1,2].map(i=><i key={i} className="ee-thumb-input"/>)}</div></div>
  return <div className="ee-thumb ee-thumb-footer">{line('20%',5,'light')}<span className="ee-thumb-gap"/>{line('12%',3,'light')}{line('12%',3,'light')}</div>
}

const elementTiles:[BuilderNodeType,string,LucideIcon][]=[
  ['heading','Heading',Heading1],['paragraph','Text',AlignLeft],['button','Button',MousePointerClick],
  ['image','Image',ImageIcon],['link','Link',Link2],['quote','Quote',Quote],
  ['container','Container',Square],['flex','Row',Rows3],['grid','Grid',LayoutGrid],
  ['columns','Columns',Columns3],['div','Box',Box],['video','Video',Video],
]

function nativeDragStart(kind:'new-element'|'new-section',type:string){
  return (event:React.DragEvent<HTMLButtonElement>)=>{
    const payload=JSON.stringify({kind,type})
    event.dataTransfer.effectAllowed='copy'
    event.dataTransfer.setData('application/x-cobest-builder',payload)
    event.dataTransfer.setData('text/plain','cobest:'+payload)
  }
}

export function EasyAddPanel(){
  const project=useBuilderStore(s=>s.project)
  const selectedId=useBuilderStore(s=>s.selectedNodeId)
  const addNode=useBuilderStore(s=>s.addNode)
  const [query,setQuery]=useState('')
  const q=query.trim().toLowerCase()
  const sectionsWithNav=[{id:'navbar',label:'Navigation'},...sectionCatalog.map(s=>({id:s.id as string,label:s.label as string}))]
  const sectionTarget=sectionInsertTarget(project,selectedId)
  const sampleTarget=elementInsertTarget(project,selectedId,createElement('heading'))
  const addSection=(id:string)=>{
    const node=createPrebuiltSection(id)
    const target=sectionInsertTarget(useBuilderStore.getState().project,useBuilderStore.getState().selectedNodeId)
    addNode(target.parentId,node,target.index)
  }
  const addElement=(type:BuilderNodeType)=>{
    const node=createElement(type)
    const state=useBuilderStore.getState()
    const target=elementInsertTarget(state.project,state.selectedNodeId,node)
    if(target)addNode(target.parentId,node,target.index)
  }
  return <div className="ee-panel">
    <div className="ee-panel-head">
      <h2>Add to page</h2>
      <p>Click to add, or drag onto the page.</p>
      <input className="ee-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search sections and elements" aria-label="Search sections and elements"/>
    </div>
    <section className="ee-group" aria-label="Sections">
      <div className="ee-group-title"><strong>Sections</strong><span>Adds {sectionTarget.description}</span></div>
      <div className="ee-section-grid">
        {sectionsWithNav.filter(s=>!q||s.label.toLowerCase().includes(q)).map(s=>
          <button key={s.id} type="button" draggable onDragStart={nativeDragStart('new-section',s.id)} onClick={()=>addSection(s.id)}
            className="ee-section-card ee-palette-item" title={'Add '+s.label+' section'}>
            <SectionThumb id={s.id}/>
            <strong>{s.label}</strong><span>{sectionBlurb[s.id]}</span>
          </button>)}
      </div>
    </section>
    <section className="ee-group" aria-label="Elements">
      <div className="ee-group-title"><strong>Elements</strong><span>{sampleTarget?'Adds '+sampleTarget.description:'Select a section first'}</span></div>
      <div className="ee-element-grid">
        {elementTiles.filter(([,label])=>!q||label.toLowerCase().includes(q)).map(([type,label,Icon])=>
          <button key={type} type="button" draggable onDragStart={nativeDragStart('new-element',type)} onClick={()=>addElement(type)}
            className="ee-element-tile ee-palette-item" title={'Add '+label}>
            <Icon size={18}/><span>{label}</span>
          </button>)}
      </div>
    </section>
  </div>
}

/* ───────────────────────── Layers ───────────────────────── */

function DropSlot({id}:{id:string}){
  const {setNodeRef,isOver}=useDroppable({id,data:{kind:'drop-line'}})
  return <div ref={setNodeRef} className={'ee-drop-slot '+(isOver?'is-over':'')}/>
}

function LayerRow({node,depth}:{node:BuilderNode;depth:number}){
  const selected=useBuilderStore(s=>s.selectedNodeId)
  const hovered=useBuilderStore(s=>s.hoveredNodeId)
  const selectNode=useBuilderStore(s=>s.selectNode)
  const hoverNode=useBuilderStore(s=>s.hoverNode)
  const updateNode=useBuilderStore(s=>s.updateNode)
  const [open,setOpen]=useState(depth<2)
  const isRoot=depth===0
  const {attributes,listeners,setNodeRef,transform,isDragging}=useDraggable({id:'node:'+node.id,data:{kind:'node',nodeId:node.id,type:node.name},disabled:isRoot})
  const accepts=canAcceptChildren(node)
  const {setNodeRef:dropRef,isOver}=useDroppable({id:'inside:'+node.id,data:{kind:'node-inside'},disabled:!accepts})
  const kids=node.children||[]
  useEffect(()=>{
    // Reveal the selected layer by opening its ancestors.
    if(selected&&selected!==node.id&&findNode(node,selected))setOpen(true)
  },[selected,node])
  return <div className="ee-layer">
    {!isRoot&&<DropSlot id={'before:'+node.id}/>}
    <div ref={dropRef} className={'ee-layer-drop '+(isOver?'is-over':'')}>
      <div ref={setNodeRef} style={{transform:CSS.Translate.toString(transform),opacity:isDragging?.4:1,paddingLeft:6+depth*14}}
        className={'ee-layer-row '+(selected===node.id?'is-selected ':'')+(hovered===node.id?'is-hovered ':'')+(node.hidden?'is-hidden':'')}
        onMouseEnter={()=>hoverNode(node.id)} onMouseLeave={()=>hoverNode(null)}>
        <button type="button" className="ee-layer-toggle" aria-label={open?'Collapse':'Expand'} onClick={()=>setOpen(o=>!o)} disabled={!kids.length}>
          {kids.length?(open?<ChevronDown size={13}/>:<ChevronRight size={13}/>):null}
        </button>
        {!isRoot&&<span className="ee-layer-grip" {...listeners} {...attributes} aria-label={'Drag '+node.name}><GripVertical size={13}/></span>}
        <button type="button" className="ee-layer-name" aria-label={'Select '+node.name+' layer'} onClick={()=>selectNode(node.id)}>
          <span>{isRoot?'Page':node.name}</span><small>{isRoot?'':friendlyType[node.type]||node.type}</small>
        </button>
        {!isRoot&&<button type="button" className="ee-layer-eye" aria-label={node.hidden?'Show '+node.name:'Hide '+node.name}
          title={node.hidden?'Show on website':'Hide from website'} onClick={()=>updateNode(node.id,{hidden:!node.hidden})}>
          {node.hidden?<EyeOff size={13}/>:<Eye size={13}/>}
        </button>}
      </div>
    </div>
    {open&&kids.map(child=><LayerRow key={child.id} node={child} depth={depth+1}/>)}
    {!isRoot&&<DropSlot id={'after:'+node.id}/>}
  </div>
}

export function EasyLayersPanel(){
  const project=useBuilderStore(s=>s.project)
  const page=activePage(project)
  return <div className="ee-panel">
    <div className="ee-panel-head"><h2>Layers</h2><p>Everything on “{page.name}”. Drag to reorder. Hidden items stay in the editor but not on the website.</p></div>
    <div className="ee-layers"><LayerRow node={page.root} depth={0}/></div>
  </div>
}

/* ───────────────────────── Pages ───────────────────────── */

export function EasyPagesPanel(){
  const project=useBuilderStore(s=>s.project)
  const setActivePage=useBuilderStore(s=>s.setActivePage)
  const addPage=useBuilderStore(s=>s.addPage)
  const renamePage=useBuilderStore(s=>s.renamePage)
  const duplicatePage=useBuilderStore(s=>s.duplicatePage)
  const deletePage=useBuilderStore(s=>s.deletePage)
  const reorderPage=useBuilderStore(s=>s.reorderPage)
  const updatePageSeo=useBuilderStore(s=>s.updatePageSeo)
  const [name,setName]=useState('')
  const [adding,setAdding]=useState(false)
  const page=activePage(project)
  const create=()=>{const value=name.trim();if(!value)return;addPage(value);setName('');setAdding(false)}
  const slugTaken=(slug:string)=>project.pages.some(p=>p.id!==page.id&&p.slug.replace(/\/+$/,'')===slug.replace(/\/+$/,''))
  const [slugDraft,setSlugDraft]=useState(page.slug)
  useEffect(()=>setSlugDraft(page.slug),[page.id,page.slug])
  const commitSlug=()=>{
    if(page.slug==='/')return
    const raw=slugDraft.replace(/^\/+/,'').trim()
    if(!raw||!/[a-z0-9]/i.test(raw)){setSlugDraft(page.slug);return}
    const clean='/'+slugify(raw).replace(/^-+|-+$/g,'')
    if(clean==='/'||slugTaken(clean)){setSlugDraft(page.slug);return}
    updatePageSeo(page.id,'slug',clean)
  }
  const descLen=(page.seo.description||'').trim().length
  return <div className="ee-panel">
    <div className="ee-panel-head ee-row"><div><h2>Pages</h2><p>{project.pages.length} page{project.pages.length===1?'':'s'} on this website.</p></div>
      <button type="button" className="ee-btn ee-btn-soft" onClick={()=>setAdding(true)} aria-label="Add page"><Plus size={14}/> Page</button></div>
    {adding&&<div className="ee-inline-form">
      <input autoFocus className="ee-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Page name, e.g. About us"
        aria-label="New page name" onKeyDown={e=>{if(e.key==='Enter')create();if(e.key==='Escape')setAdding(false)}}/>
      <div className="ee-row"><button type="button" className="ee-btn ee-btn-primary" onClick={create} disabled={!name.trim()}>Create page</button>
        <button type="button" className="ee-btn" onClick={()=>setAdding(false)}>Cancel</button></div>
    </div>}
    <ul className="ee-page-list">{project.pages.map((p,i)=><li key={p.id} className={p.id===page.id?'is-active':''}>
      <button type="button" className="ee-page-main" onClick={()=>setActivePage(p.id)}>
        <FileText size={15}/><span><strong>{p.name}</strong><small>{p.slug}</small></span>
      </button>
      <div className="ee-page-actions">
        <button type="button" aria-label={'Move '+p.name+' up'} disabled={i===0} onClick={()=>reorderPage(p.id,-1)}><ChevronUp size={13}/></button>
        <button type="button" aria-label={'Move '+p.name+' down'} disabled={i===project.pages.length-1} onClick={()=>reorderPage(p.id,1)}><ChevronDown size={13}/></button>
        <button type="button" aria-label={'Duplicate '+p.name} onClick={()=>duplicatePage(p.id)}><Copy size={13}/></button>
        {p.slug!=='/'&&project.pages.length>1&&<button type="button" className="danger" aria-label={'Delete '+p.name}
          onClick={()=>{if(confirm(`Delete the page “${p.name}”? You can undo this.`))deletePage(p.id)}}><Trash2 size={13}/></button>}
      </div>
    </li>)}</ul>
    <section className="ee-card" aria-label="Page settings">
      <h3>“{page.name}” settings</h3>
      <label className="ee-field"><span>Page name</span>
        <input className="ee-input" value={page.name} onChange={e=>renamePage(page.id,e.target.value)}/></label>
      <label className="ee-field"><span>Web address</span>
        <div className="ee-prefix"><em>yoursite.com</em><input className="ee-input" aria-label="Page URL" value={slugDraft} disabled={page.slug==='/'}
          onChange={e=>setSlugDraft(e.target.value)} onBlur={commitSlug} onKeyDown={e=>{if(e.key==='Enter')(e.target as HTMLInputElement).blur()}}/></div>
        {page.slug==='/'&&<small>The home page always lives at “/”.</small>}
      </label>
      <label className="ee-field"><span>Title in Google and browser tab</span>
        <input className="ee-input" value={page.seo.title} maxLength={70} onChange={e=>updatePageSeo(page.id,'title',e.target.value)} placeholder="e.g. Fresh flowers delivered in Manila"/>
        <small>{page.seo.title.length}/60 characters recommended</small></label>
      <label className="ee-field"><span>Description in Google</span>
        <textarea className="ee-input" rows={3} value={page.seo.description} maxLength={300} onChange={e=>updatePageSeo(page.id,'description',e.target.value)} placeholder="One or two sentences about this page."/>
        <small className={descLen&&(descLen<50||descLen>160)?'warn':''}>{descLen}/160 · aim for 50–160 characters</small></label>
      <div className="ee-search-preview" aria-label="Google preview">
        <small>Google preview</small>
        <strong>{page.seo.title||page.name}</strong>
        <span>{page.seo.description||'Add a description so people know what this page offers.'}</span>
      </div>
    </section>
  </div>
}

/* ───────────────────────── Media ───────────────────────── */

const allowedImage=/^image\/(png|jpeg|webp|gif|avif)$/

async function fileToAsset(file:File):Promise<BuilderAsset>{
  if(isAuthenticated()){
    const uploaded=await uploadMedia(file)
    if(!uploaded?.url)throw new Error('Upload did not return an image address.')
    return {id:String(uploaded.id||uid('asset')),name:uploaded.name||file.name,mimeType:uploaded.mime_type||file.type,
      url:uploaded.url,alt:file.name.replace(/\.[^.]+$/,''),createdAt:uploaded.created_at||new Date().toISOString()}
  }
  if(file.size>1024*1024)throw new Error(file.name+' is larger than 1 MB. Sign in to upload larger images.')
  const url=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(r.error);r.readAsDataURL(file)})
  return {id:uid('asset'),name:file.name,mimeType:file.type,url,alt:file.name.replace(/\.[^.]+$/,''),createdAt:new Date().toISOString()}
}

export function EasyMediaPanel(){
  const project=useBuilderStore(s=>s.project)
  const selectedId=useBuilderStore(s=>s.selectedNodeId)
  const addAsset=useBuilderStore(s=>s.addAsset)
  const removeAsset=useBuilderStore(s=>s.removeAsset)
  const mutate=useBuilderStore(s=>s.mutate)
  const addNode=useBuilderStore(s=>s.addNode)
  const fileRef=useRef<HTMLInputElement>(null)
  const [busy,setBusy]=useState(false)
  const [errors,setErrors]=useState<string[]>([])
  const page=activePage(project)
  const selected=findNode(page.root,selectedId)
  const upload=async(files:FileList|null)=>{
    if(!files?.length)return
    setBusy(true);const problems:string[]=[]
    for(const file of Array.from(files)){
      if(!allowedImage.test(file.type)){problems.push(file.name+': use PNG, JPG, WebP, GIF or AVIF.');continue}
      if(file.size>10*1024*1024){problems.push(file.name+' is larger than 10 MB.');continue}
      try{addAsset(await fileToAsset(file))}catch(e:any){problems.push(e?.message||'Could not upload '+file.name)}
    }
    setErrors(problems);setBusy(false)
    if(fileRef.current)fileRef.current.value=''
  }
  const useAsset=(asset:BuilderAsset)=>{
    if(selected?.type==='image'){
      mutate('Change image',draft=>{const n=findNode(activePage(draft).root,selected.id);if(n){n.attributes.src=asset.url;n.attributes.alt=n.attributes.alt||asset.alt||asset.name}})
      return
    }
    const img=createElement('image');img.attributes={...img.attributes,src:asset.url,alt:asset.alt||asset.name}
    const target=elementInsertTarget(project,selectedId,img)
    if(target)addNode(target.parentId,img,target.index)
  }
  return <div className="ee-panel">
    <div className="ee-panel-head ee-row"><div><h2>Media</h2><p>{selected?.type==='image'?'Click a picture to replace the selected image.':'Click a picture to add it to the page.'}</p></div>
      <button type="button" className="ee-btn ee-btn-soft" disabled={busy} onClick={()=>fileRef.current?.click()} aria-label="Upload image"><Upload size={14}/> {busy?'Uploading…':'Upload'}</button>
      <input ref={fileRef} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden onChange={e=>void upload(e.target.files)}/></div>
    {errors.length>0&&<div className="ee-alert" role="alert">{errors.map(e=><p key={e}>{e}</p>)}</div>}
    {project.assets.length===0
      ?<button type="button" className="ee-dropzone" onClick={()=>fileRef.current?.click()}><ImageIcon size={22}/><strong>Upload your photos</strong><span>PNG, JPG, WebP or GIF · up to 10 MB</span></button>
      :<div className="ee-media-grid">{project.assets.map(asset=><figure key={asset.id}>
        <button type="button" onClick={()=>useAsset(asset)} aria-label={'Use '+asset.name}><img src={asset.url} alt=""/></button>
        <figcaption title={asset.name}>{asset.name}</figcaption>
        <button type="button" className="ee-media-remove" aria-label={'Remove '+asset.name} onClick={()=>{if(confirm('Remove '+asset.name+' from the media library? Images already on the page stay.'))removeAsset(asset.id)}}><X size={12}/></button>
      </figure>)}</div>}
  </div>
}

/* ───────────────────────── Theme ───────────────────────── */

const colorLabels:Record<string,string>={ink:'Text',surface:'Background',muted:'Soft background',accent:'Brand / buttons',subtle:'Secondary text',line:'Borders'}

export function EasyThemePanel(){
  const project=useBuilderStore(s=>s.project)
  const setGlobalColor=useBuilderStore(s=>s.setGlobalColor)
  const mutate=useBuilderStore(s=>s.mutate)
  const replaceProject=useBuilderStore(s=>s.replaceProject)
  const bodyFont=project.globals.textStyles.body?.fontFamily||''
  const headingFont=project.globals.textStyles.heading?.fontFamily||''
  const setFont=(key:'body'|'heading',value:string)=>mutate('Change site font',draft=>{
    const keys=key==='heading'?['heading','display']:['body']
    for(const k of keys)draft.globals.textStyles[k]={...(draft.globals.textStyles[k]||{}),fontFamily:value}
    if(key==='body'&&draft.styles['page-shell']?.desktop?.none)draft.styles['page-shell'].desktop.none.fontFamily=value
  })
  return <div className="ee-panel">
    <div className="ee-panel-head"><h2>Theme</h2><p>Brand colors and fonts update the whole website.</p></div>
    <section className="ee-card"><h3>Brand colors</h3>
      <div className="ee-color-list">{Object.entries(project.globals.colors).map(([key,value])=><label key={key} className="ee-color-row">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value)?value:'#000000'} onChange={e=>setGlobalColor(key,e.target.value)} aria-label={(colorLabels[key]||key)+' color'}/>
        <span><strong>{colorLabels[key]||key}</strong><small>{value}</small></span>
      </label>)}</div>
    </section>
    <section className="ee-card"><h3>Fonts</h3>
      <label className="ee-field"><span>Headings</span><select className="ee-input" value={fontChoices.some(f=>f.value===headingFont)?headingFont:''} onChange={e=>setFont('heading',e.target.value)} aria-label="Heading font">
        <option value="" disabled>Current font</option>{fontChoices.map(f=><option key={f.name} value={f.value}>{f.name}</option>)}</select></label>
      <label className="ee-field"><span>Body text</span><select className="ee-input" value={fontChoices.some(f=>f.value===bodyFont)?bodyFont:''} onChange={e=>setFont('body',e.target.value)} aria-label="Body font">
        <option value="" disabled>Current font</option>{fontChoices.map(f=><option key={f.name} value={f.value}>{f.name}</option>)}</select></label>
    </section>
    <section className="ee-card"><h3>Start from a template</h3><p className="ee-muted">Replaces all pages. Your current design stays in Undo and Version history.</p>
      <div className="ee-template-list">{builderTemplates.map(t=><button type="button" key={t.id} className="ee-template" onClick={()=>{if(confirm(`Use the ${t.name} template? This replaces your current pages (you can undo).`))replaceProject(applyTemplate(t,project),true,'Apply template')}}>
        <i style={{background:`linear-gradient(135deg,${t.accent},${t.accent}33)`}}/><span><strong>{t.name}</strong><small>{t.description}</small></span>
      </button>)}</div>
    </section>
  </div>
}

/* ───────────────────────── Inspector ───────────────────────── */

type InspectorTab='content'|'design'|'advanced'

function LinkEditor({node}:{node:BuilderNode}){
  const pages=useBuilderStore(s=>s.project.pages)
  const updateAttr=useBuilderStore(s=>s.updateNodeAttribute)
  const removeAttr=useBuilderStore(s=>s.removeNodeAttribute)
  const href=node.attributes.href||''
  const pageMatch=pages.find(p=>!p.isCollectionTemplate&&p.slug===href)
  const kind=pageMatch?'page':href.startsWith('mailto:')?'email':href.startsWith('tel:')?'phone':href.startsWith('#')&&href.length>1?'section':href&&href!=='#'?'url':'none'
  const [draft,setDraft]=useState(href)
  useEffect(()=>setDraft(href),[node.id,href])
  const unsafe=draft.trim()!==''&&safeUrl(draft)===''
  const commit=(value:string)=>{if(safeUrl(value)!==''||value==='')updateAttr(node.id,'href',value.trim())}
  return <div className="ee-field-group">
    <label className="ee-field"><span>When clicked, go to</span>
      <select className="ee-input" aria-label="Link type" value={kind} onChange={e=>{
        const v=e.target.value
        if(v==='none')commit('#')
        else if(v==='page')commit(pages[0]?.slug||'/')
        else if(v==='email')commit('mailto:')
        else if(v==='phone')commit('tel:')
        else if(v==='section')commit('#contact')
        else commit('https://')
      }}>
        <option value="none">Nothing yet</option><option value="page">A page on this website</option><option value="url">Another website</option>
        <option value="section">A section on this page</option><option value="email">Send an email</option><option value="phone">Call a phone number</option>
      </select></label>
    {kind==='page'&&<label className="ee-field"><span>Page</span><select className="ee-input" aria-label="Link page" value={href} onChange={e=>commit(e.target.value)}>
      {pages.filter(p=>!p.isCollectionTemplate).map(p=><option key={p.id} value={p.slug}>{p.name} ({p.slug})</option>)}</select></label>}
    {['url','email','phone','section'].includes(kind)&&<label className="ee-field"><span>{kind==='email'?'Email address':kind==='phone'?'Phone number':kind==='section'?'Section ID (e.g. #contact)':'Web address'}</span>
      <input className={'ee-input '+(unsafe?'is-invalid':'')} aria-label="Link destination" value={kind==='email'?draft.replace(/^mailto:/,''):kind==='phone'?draft.replace(/^tel:/,''):draft}
        placeholder={kind==='email'?'hello@yourbusiness.com':kind==='phone'?'+63 900 000 0000':kind==='section'?'#contact':'https://'}
        onChange={e=>{const raw=e.target.value;const next=kind==='email'?'mailto:'+raw.trim():kind==='phone'?'tel:'+raw.replace(/[^\d+]/g,''):raw;setDraft(next)}}
        onBlur={()=>commit(draft)} onKeyDown={e=>{if(e.key==='Enter')(e.target as HTMLInputElement).blur()}}/>
      {unsafe&&<small className="warn">This kind of link is blocked for safety.</small>}
    </label>}
    {kind==='url'&&<label className="ee-check"><input type="checkbox" checked={node.attributes.target==='_blank'} onChange={e=>{
      if(e.target.checked){updateAttr(node.id,'target','_blank');updateAttr(node.id,'rel','noopener noreferrer')}else{removeAttr(node.id,'target');removeAttr(node.id,'rel')}
    }}/> Open in a new tab</label>}
  </div>
}

function TextEditor({node}:{node:BuilderNode}){
  const updateNode=useBuilderStore(s=>s.updateNode)
  const multiline=node.type==='paragraph'||node.type==='quote'
  return <label className="ee-field"><span>{node.type==='heading'?'Heading text':node.type==='button'||node.type==='submit'?'Button label':node.type==='link'?'Link text':'Text'}</span>
    {multiline
      ?<textarea className="ee-input" rows={5} value={node.content||''} onChange={e=>updateNode(node.id,{content:e.target.value})} aria-label="Element text"/>
      :<input className="ee-input" value={node.content||''} onChange={e=>updateNode(node.id,{content:e.target.value})} aria-label="Element text"/>}
    <small>Tip: double-click text on the page to type directly.</small>
  </label>
}

function ChildrenList({node}:{node:BuilderNode}){
  const selectNode=useBuilderStore(s=>s.selectNode)
  const addNode=useBuilderStore(s=>s.addNode)
  const quick:[BuilderNodeType,string][]=[['heading','Heading'],['paragraph','Text'],['button','Button'],['image','Image']]
  return <div className="ee-field-group">
    <span className="ee-field-label">Inside this {friendlyType[node.type]?.toLowerCase()||'box'}</span>
    {node.children.length?<ul className="ee-children">{node.children.map(child=><li key={child.id}>
      <button type="button" onClick={()=>selectNode(child.id)}><span>{child.name}</span><small>{friendlyType[child.type]||child.type}</small><ChevronRight size={13}/></button>
    </li>)}</ul>:<p className="ee-muted">Empty. Add something below.</p>}
    <div className="ee-quick-add">{quick.map(([type,label])=><button key={type} type="button" className="ee-btn ee-btn-soft" onClick={()=>addNode(node.id,createElement(type))}><Plus size={12}/> {label}</button>)}</div>
  </div>
}

function ContentTab({node}:{node:BuilderNode}){
  const updateNode=useBuilderStore(s=>s.updateNode)
  const updateAttr=useBuilderStore(s=>s.updateNodeAttribute)
  return <div className="ee-tab-body">
    {node.type==='heading'&&<div className="ee-field"><span>Heading size</span><div className="ee-segment" role="group" aria-label="Heading level">
      {['h1','h2','h3','h4'].map(level=><button type="button" key={level} aria-pressed={node.tag===level} onClick={()=>updateNode(node.id,{tag:level})}>{level.toUpperCase()}</button>)}
    </div><small>Use one H1 per page for the main title.</small></div>}
    {textTypes.has(node.type)&&<TextEditor node={node}/>}
    {linkTypes.has(node.type)&&<LinkEditor node={node}/>}
    {node.type==='image'&&<div className="ee-legacy-light"><ImageSettings node={node}/></div>}
    {(node.type==='video'||node.type==='backgroundVideo')&&<label className="ee-field"><span>Video address</span>
      <input className="ee-input" value={node.attributes.src||''} onChange={e=>updateAttr(node.id,'src',e.target.value)} placeholder="https://www.youtube.com/embed/…"/>
      <small>Use an embed link (YouTube “Share › Embed”) or an .mp4 address.</small></label>}
    {node.type==='form'&&<label className="ee-field"><span>Send form to</span>
      <input className="ee-input" value={node.attributes.action||''} onChange={e=>updateAttr(node.id,'action',e.target.value)} placeholder="Leave empty to show a thank-you message"/>
      <small>Test a submission after publishing.</small></label>}
    {['input','textarea','select'].includes(node.type)&&<>
      <label className="ee-field"><span>Field label (shown to screen readers)</span><input className="ee-input" value={node.attributes['aria-label']||node.attributes.placeholder||''} onChange={e=>updateAttr(node.id,'aria-label',e.target.value)}/></label>
      <label className="ee-field"><span>Placeholder</span><input className="ee-input" value={node.attributes.placeholder||''} onChange={e=>updateAttr(node.id,'placeholder',e.target.value)}/></label>
      <label className="ee-check"><input type="checkbox" checked={node.attributes.required==='true'} onChange={e=>updateAttr(node.id,'required',e.target.checked?'true':'')}/> Required</label>
    </>}
    {node.type==='html'&&<label className="ee-field"><span>Custom HTML</span>
      <textarea className="ee-input ee-code" rows={8} value={node.attributes['data-html']||node.content||''} onChange={e=>updateAttr(node.id,'data-html',e.target.value)} spellCheck={false}/>
      <small className="warn">Only paste code from sources you trust. It runs on your published website.</small></label>}
    {canAcceptChildren(node)&&<ChildrenList node={node}/>}
  </div>
}

function PageOverview(){
  const project=useBuilderStore(s=>s.project)
  const selectNode=useBuilderStore(s=>s.selectNode)
  const page=activePage(project)
  return <div className="ee-tab-body">
    <div className="ee-empty-inspector">
      <MousePointerClick size={26}/>
      <h3>Click anything on the page to edit it</h3>
      <p>Text, images, buttons and colors open here. Double-click text to type directly on the page.</p>
    </div>
    <div className="ee-field-group"><span className="ee-field-label">Sections on this page</span>
      {page.root.children.length?<ul className="ee-children">{page.root.children.map(child=><li key={child.id}>
        <button type="button" onClick={()=>selectNode(child.id)}><span>{child.name}</span><small>{friendlyType[child.type]||child.type}</small><ChevronRight size={13}/></button>
      </li>)}</ul>:<p className="ee-muted">No sections yet. Open “Add” on the left.</p>}
    </div>
    <div className="ee-shortcuts"><strong>Shortcuts</strong>
      <span><kbd>Ctrl</kbd>+<kbd>Z</kbd> Undo</span><span><kbd>Ctrl</kbd>+<kbd>D</kbd> Duplicate</span>
      <span><kbd>Del</kbd> Delete</span><span><kbd>Esc</kbd> Deselect</span><span><kbd>Ctrl</kbd>+<kbd>S</kbd> Save</span>
    </div>
  </div>
}

export function EasyInspector({onCopy}:{onCopy:()=>void}){
  const project=useBuilderStore(s=>s.project)
  const selectedId=useBuilderStore(s=>s.selectedNodeId)
  const breakpoint=useBuilderStore(s=>s.breakpoint)
  const selectNode=useBuilderStore(s=>s.selectNode)
  const updateNode=useBuilderStore(s=>s.updateNode)
  const duplicateNode=useBuilderStore(s=>s.duplicateNode)
  const deleteNode=useBuilderStore(s=>s.deleteNode)
  const moveNode=useBuilderStore(s=>s.moveNode)
  const page=activePage(project)
  const node=findNode(page.root,selectedId)
  const isContainer=!!node&&canAcceptChildren(node)
  const defaultTab:InspectorTab=node&&isContainer&&!textTypes.has(node.type)?'design':'content'
  const [tab,setTab]=useState<InspectorTab>(defaultTab)
  useEffect(()=>setTab(defaultTab),[selectedId])
  useEffect(()=>{
    // Other parts of the editor (context menu, publish review) can open a tab.
    const open=(event:Event)=>{const next=(event as CustomEvent).detail;if(next==='content'||next==='design'||next==='advanced')setTab(next)}
    window.addEventListener('cobest-inspector-tab',open)
    return()=>window.removeEventListener('cobest-inspector-tab',open)
  },[])
  const pos=useMemo(()=>node?siblingPosition(page.root,node.id):null,[page.root,node])
  if(!node||node.id===page.root.id)return <div className="ee-inspector"><div className="ee-inspector-head"><span className="ee-badge">Page</span><h2>{page.name}</h2></div><PageOverview/></div>
  const parent=findParent(page.root,node.id)
  const locked=!!node.locked
  return <div className="ee-inspector">
    <div className="ee-inspector-head">
      <span className="ee-badge">{friendlyType[node.type]||node.type}</span>
      <input className="ee-name-input" aria-label="Element name" value={node.name} onChange={e=>updateNode(node.id,{name:e.target.value})}/>
      <div className="ee-actions" role="toolbar" aria-label="Element actions">
        <button type="button" title="Move up" aria-label="Move up" disabled={locked||!pos||pos.index===0} onClick={()=>pos&&moveNode(node.id,pos.parent.id,pos.index-1)}><ChevronUp size={15}/></button>
        <button type="button" title="Move down" aria-label="Move down" disabled={locked||!pos||pos.index>=pos.count-1} onClick={()=>pos&&moveNode(node.id,pos.parent.id,pos.index+2)}><ChevronDown size={15}/></button>
        <button type="button" title="Select the box around this" aria-label="Select parent" disabled={!parent||parent.id===page.root.id} onClick={()=>parent&&selectNode(parent.id)}><CornerLeftUp size={15}/></button>
        <button type="button" title="Hide on website" aria-label={node.hidden?'Show element':'Hide element'} onClick={()=>updateNode(node.id,{hidden:!node.hidden})}>{node.hidden?<EyeOff size={15}/>:<Eye size={15}/>}</button>
        <button type="button" title="Duplicate (Ctrl+D)" aria-label="Duplicate element" disabled={locked} onClick={()=>duplicateNode(node.id)}><Copy size={15}/></button>
        <button type="button" title="Copy (Ctrl+C)" aria-label="Copy element" disabled={locked} onClick={onCopy}><ClipboardCopy size={15}/></button>
        <button type="button" title="Delete (Del)" aria-label="Delete element" className="danger" disabled={locked} onClick={()=>deleteNode(node.id)}><Trash2 size={15}/></button>
      </div>
      {node.hidden&&<p className="ee-note">Hidden: this element won’t appear on your published website.</p>}
    </div>
    <div className="ee-tabs" role="tablist" aria-label="Inspector">
      {(['content','design','advanced'] as InspectorTab[]).map(id=><button key={id} role="tab" type="button" aria-selected={tab===id} onClick={()=>setTab(id)}>
        {id==='content'?'Content':id==='design'?'Design':'Advanced'}</button>)}
    </div>
    {tab==='content'&&<ContentTab node={node}/>}
    {tab==='design'&&<div className="ee-tab-body">
      <p className={'ee-device-note '+(breakpoint==='desktop'?'':'is-device')}>{breakpoint==='desktop'
        ?'Editing for all devices. Switch to Tablet or Mobile at the top to adjust only smaller screens.'
        :'Editing only '+(breakpoint==='tablet'?'tablet':'mobile')+' and smaller. Desktop stays the same.'}</p>
      <div className="ee-legacy-light"><DesignControls/></div>
    </div>}
    {tab==='advanced'&&<div className="ee-tab-body">
      <p className="ee-muted">For designers: classes, exact sizes, positions, element ID and animations.</p>
      <div className="ee-pro"><StylePanel/></div>
      <div className="ee-pro"><SettingsPanel/></div>
      <div className="ee-pro"><InteractionsPanel/></div>
    </div>}
  </div>
}
