import React, { useEffect, useRef, useState } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import {
  AlignLeft, Box, ChevronDown, ChevronRight, ChevronUp, Columns3, Copy, EyeOff, Eye,
  FileText, GripVertical, Heading1, Image as ImageIcon, LayoutGrid, Link2, MousePointerClick,
  Plus, Square, Trash2, Upload, X, Video, Quote, Rows3, ListChecks
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { isAuthenticated, uploadMedia } from '../api.js'
import { safeUrl } from './compiler'
import { fontChoices } from './DesignControls'
import { createElement, sectionCatalog } from './elements'
import { applyTemplate, builderTemplates } from './templates'
import { useBuilderStore } from './store'
import { findNode, slugify, uid } from './tree'
import {
  activePage, createSectionFor, elementInsertTarget, sectionInsertTarget, typeLabel, type DropZone
} from './editorModel'
import type { BuilderAsset, BuilderNode, BuilderNodeType } from './types'

/* ───────────────────────── Add panel ───────────────────────── */

function SectionThumb({id}:{id:string}){
  const line=(w:string,h=4,extra='')=><i className={'ee-thumb-line '+extra} style={{width:w,height:h}}/>
  if(id==='navbar')return <div className="ee-thumb ee-thumb-row">{line('22%',6,'dark')}<span className="ee-thumb-gap"/>{line('12%')}{line('12%')}{line('12%')}</div>
  if(id==='hero')return <div className="ee-thumb ee-thumb-hero">{line('70%',9,'dark')}{line('55%')}{line('40%')}<i className="ee-thumb-btn"/></div>
  if(id==='about')return <div className="ee-thumb ee-thumb-form"><div>{line('70%',6,'dark')}{line('90%')}{line('60%')}</div><div><i className="ee-thumb-photo"/></div></div>
  if(id==='features')return <div className="ee-thumb ee-thumb-cols">{[0,1,2].map(i=><div key={i}><i className="ee-thumb-dot"/>{line('80%',4,'dark')}{line('60%')}</div>)}</div>
  if(id==='gallery')return <div className="ee-thumb ee-thumb-cols">{[0,1,2].map(i=><div key={i}><i className="ee-thumb-photo"/></div>)}</div>
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
  ['video','Video',Video],['form','Form',ListChecks],['container','Container',Square],
  ['flex','Row',Rows3],['grid','Grid',LayoutGrid],['columns','Columns',Columns3],['div','Box',Box],
]

function nativeDragStart(kind:'new-element'|'new-section',type:string){
  return (event:React.DragEvent<HTMLButtonElement>)=>{
    const payload=JSON.stringify({kind,type})
    event.dataTransfer.effectAllowed='copy'
    event.dataTransfer.setData('application/x-cobest-builder',payload)
    event.dataTransfer.setData('text/plain','cobest:'+payload)
  }
}

export function EasyAddPanel({onAdded,touch=false}:{onAdded?:()=>void;touch?:boolean}){
  const project=useBuilderStore(s=>s.project)
  const selectedId=useBuilderStore(s=>s.selectedNodeId)
  const addNode=useBuilderStore(s=>s.addNode)
  const [query,setQuery]=useState('')
  const q=query.trim().toLowerCase()
  const sectionTarget=sectionInsertTarget(project,selectedId)
  const sampleTarget=elementInsertTarget(project,selectedId,createElement('heading'))
  const addSection=(id:string)=>{
    const state=useBuilderStore.getState()
    const node=createSectionFor(state.project,id)
    const target=sectionInsertTarget(state.project,state.selectedNodeId,id)
    addNode(target.parentId,node,target.index)
    onAdded?.()
  }
  const addElement=(type:BuilderNodeType)=>{
    const node=createElement(type)
    const state=useBuilderStore.getState()
    const target=elementInsertTarget(state.project,state.selectedNodeId,node)
    if(target){addNode(target.parentId,node,target.index);onAdded?.()}
  }
  const sections=sectionCatalog.filter(s=>!q||(s.label+' '+s.hint).toLowerCase().includes(q))
  const elements=elementTiles.filter(([,label])=>!q||label.toLowerCase().includes(q))
  return <div className="ee-panel">
    <div className="ee-panel-head">
      <h2>Add to page</h2>
      <p>{touch?'Tap to add it to the page.':'Click to add, or drag onto the page.'}</p>
      <input className="ee-input" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search sections and elements" aria-label="Search sections and elements"/>
    </div>
    {sections.length>0&&<section className="ee-group" aria-label="Sections">
      <div className="ee-group-title"><strong>Ready-made sections</strong><span>Adds {sectionTarget.description}</span></div>
      <div className="ee-section-grid">
        {sections.map(s=>
          <button key={s.id} type="button" draggable={!touch} onDragStart={nativeDragStart('new-section',s.id)} onClick={()=>addSection(s.id)}
            className="ee-section-card ee-palette-item" title={'Add '+s.label+' section'}>
            <SectionThumb id={s.id}/>
            <strong>{s.label}</strong><span>{s.hint}</span>
          </button>)}
      </div>
    </section>}
    {elements.length>0&&<section className="ee-group" aria-label="Elements">
      <div className="ee-group-title"><strong>Single elements</strong><span>{sampleTarget?'Adds '+sampleTarget.description:'Select a section first'}</span></div>
      <div className="ee-element-grid">
        {elements.map(([type,label,Icon])=>
          <button key={type} type="button" draggable={!touch} onDragStart={nativeDragStart('new-element',type)} onClick={()=>addElement(type)}
            className="ee-element-tile ee-palette-item" title={'Add '+label}>
            <Icon size={18}/><span>{label}</span>
          </button>)}
      </div>
    </section>}
    {!sections.length&&!elements.length&&<p className="ee-muted">Nothing matches “{query}”.</p>}
  </div>
}

/* ───────────────────────── Layers ───────────────────────── */

/** Where the layer being dragged would land, shown as a line or highlight. */
export const LayerDropContext=React.createContext<{anchorId:string;zone:DropZone}|null>(null)

function LayerRow({node,depth}:{node:BuilderNode;depth:number}){
  const selected=useBuilderStore(s=>s.selectedNodeId)
  const hovered=useBuilderStore(s=>s.hoveredNodeId)
  const selectNode=useBuilderStore(s=>s.selectNode)
  const hoverNode=useBuilderStore(s=>s.hoverNode)
  const updateNode=useBuilderStore(s=>s.updateNode)
  const hint=React.useContext(LayerDropContext)
  const [open,setOpen]=useState(depth<2)
  const isRoot=depth===0
  const {attributes,listeners,setNodeRef:dragRef,isDragging}=useDraggable({id:'node:'+node.id,data:{kind:'node',nodeId:node.id,type:node.name},disabled:isRoot||!!node.locked})
  const {setNodeRef:dropRef}=useDroppable({id:'row:'+node.id,data:{kind:'layer-row',nodeId:node.id}})
  const kids=node.children||[]
  const zone=hint&&hint.anchorId===node.id?hint.zone:null
  useEffect(()=>{
    // Reveal the selected layer by opening its ancestors.
    if(selected&&selected!==node.id&&findNode(node,selected))setOpen(true)
  },[selected,node])
  return <div className="ee-layer">
    <div ref={dropRef} style={{paddingLeft:6+depth*14,opacity:isDragging?.4:1}}
      className={'ee-layer-row '+(selected===node.id?'is-selected ':'')+(hovered===node.id?'is-hovered ':'')+(node.hidden?'is-hidden ':'')+(zone?'drop-'+zone:'')}
      onMouseEnter={()=>hoverNode(node.id)} onMouseLeave={()=>hoverNode(null)}>
      <button type="button" className="ee-layer-toggle" aria-label={open?'Collapse '+node.name:'Expand '+node.name} onClick={()=>setOpen(o=>!o)} disabled={!kids.length}>
        {kids.length?(open?<ChevronDown size={13}/>:<ChevronRight size={13}/>):null}
      </button>
      {!isRoot&&<span ref={dragRef} className="ee-layer-grip" {...listeners} {...attributes} aria-label={'Drag '+node.name+' to move it'}><GripVertical size={14}/></span>}
      <button type="button" className="ee-layer-name" aria-label={'Select '+node.name+' layer'} onClick={()=>selectNode(node.id)}>
        <span>{isRoot?'Page':node.name}</span><small>{isRoot?'':typeLabel(node)}</small>
      </button>
      {!isRoot&&<button type="button" className="ee-layer-eye" aria-label={node.hidden?'Show '+node.name:'Hide '+node.name}
        title={node.hidden?'Show on website':'Hide from website'} onClick={()=>updateNode(node.id,{hidden:!node.hidden})}>
        {node.hidden?<EyeOff size={13}/>:<Eye size={13}/>}
      </button>}
    </div>
    {open&&kids.map(child=><LayerRow key={child.id} node={child} depth={depth+1}/>)}
  </div>
}

export function EasyLayersPanel(){
  const project=useBuilderStore(s=>s.project)
  const page=activePage(project)
  return <div className="ee-panel">
    <div className="ee-panel-head"><h2>Layers</h2><p>Everything on “{page.name}”, top to bottom. Drag the handle to reorder. Hidden items stay here but not on the website.</p></div>
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
  const [inMenu,setInMenu]=useState(true)
  const page=activePage(project)
  const create=()=>{const value=name.trim();if(!value)return;addPage(value,{addToMenu:inMenu});setName('');setAdding(false);setInMenu(true)}
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
      <input autoFocus className="ee-input" value={name} maxLength={80} onChange={e=>setName(e.target.value)} placeholder="Page name, e.g. About us"
        aria-label="New page name" onKeyDown={e=>{if(e.key==='Enter')create();if(e.key==='Escape')setAdding(false)}}/>
      <label className="ee-check"><input type="checkbox" checked={inMenu} onChange={e=>setInMenu(e.target.checked)}/> Add a link to this page in the menu</label>
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
        <button type="button" onClick={()=>useAsset(asset)} aria-label={'Use '+asset.name}><img src={safeUrl(asset.url,true)} alt=""/></button>
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
