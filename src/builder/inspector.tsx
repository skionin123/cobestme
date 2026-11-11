import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown, ChevronRight, ChevronUp, ClipboardCopy, Copy, CornerLeftUp, Eye, EyeOff,
  MousePointerClick, Plus, Trash2, X
} from 'lucide-react'
import { isAuthenticated, uploadMedia } from '../api.js'
import { safeUrl } from './compiler'
import { DesignControls } from './DesignControls'
import { activePage, deviceName, friendlyType, linkTypes, siblingPosition, textTypes, typeLabel } from './editorModel'
import { createElement } from './elements'
import { applyNodeGeometry, geometryClass } from './geometry'
import { getElementSizingMode, setElementSizing, type SizingMode } from './sizing'
import { useBuilderStore } from './store'
import { canAcceptChildren, findNode, findParent, slugify, uid } from './tree'
import type { BuilderAsset, BuilderInteraction, BuilderNode, BuilderNodeType } from './types'

type InspectorTab='content'|'design'|'advanced'

/* ───────────────────────── Image ───────────────────────── */

export function ImageSettings({node}:{node:BuilderNode}){
  const assets=useBuilderStore(s=>s.project.assets)
  const mutate=useBuilderStore(s=>s.mutate)
  const addAsset=useBuilderStore(s=>s.addAsset)
  const fileRef=useRef<HTMLInputElement>(null)
  const [uploading,setUploading]=useState(false)
  const [error,setError]=useState('')
  const select=(src:string,alt?:string)=>{
    mutate('Change image',draft=>{
      const target=findNode(activePage(draft).root,node.id)
      if(!target)return
      target.attributes.src=src
      if(alt!==undefined)target.attributes.alt=alt
    })
  }
  const upload=async(file?:File)=>{
    if(!file)return
    setError('')
    if(!/^image\/(png|jpeg|webp|gif|avif)$/.test(file.type)){setError('Choose a PNG, JPG, WebP, GIF or AVIF image.');return}
    if(file.size>10*1024*1024){setError('Use an image smaller than 10 MB.');return}
    if(!isAuthenticated()&&file.size>1024*1024){setError('Images must be under 1 MB until you sign in.');return}
    setUploading(true)
    try{
      let asset:BuilderAsset
      if(isAuthenticated()){
        const uploaded=await uploadMedia(file)
        if(!uploaded?.url)throw new Error('The upload did not finish. Please try again.')
        asset={id:String(uploaded.id||uid('asset')),name:uploaded.name||file.name,mimeType:uploaded.mime_type||file.type,url:uploaded.url,
          alt:'',createdAt:uploaded.created_at||new Date().toISOString()}
      }else{
        const url=await new Promise<string>((resolve,reject)=>{
          const reader=new FileReader()
          reader.onload=()=>resolve(String(reader.result))
          reader.onerror=()=>reject(reader.error)
          reader.readAsDataURL(file)
        })
        asset={id:uid('asset'),name:file.name,mimeType:file.type,url,alt:'',createdAt:new Date().toISOString()}
      }
      addAsset(asset)
      // Keep a description the owner already wrote; a file name is not a description.
      select(asset.url)
    }catch(e:any){setError(e?.message||'The image could not be uploaded.')}
    finally{setUploading(false);if(fileRef.current)fileRef.current.value=''}
  }
  return <section className="ee-image" aria-label="Image settings">
    <div className="ee-image-preview">{node.attributes.src
      ?<img src={safeUrl(node.attributes.src,true)} alt=""/>
      :<span>No image yet</span>}</div>
    <input ref={fileRef} className="ee-visually-hidden" aria-label="Upload replacement image"
      type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={e=>void upload(e.target.files?.[0])}/>
    <button type="button" className="ee-btn ee-btn-primary ee-wide" onClick={()=>fileRef.current?.click()} disabled={uploading}>
      {uploading?'Uploading…':'Upload a new image'}</button>
    {error&&<p role="alert" className="ee-alert">{error}</p>}
    {assets.length>0&&<div className="ee-field"><span>Or pick one you uploaded</span>
      <div className="ee-image-library">{assets.map(asset=><button type="button" key={asset.id}
        className={node.attributes.src===asset.url?'is-active':''} title={asset.name}
        aria-label={'Use image '+asset.name} aria-pressed={node.attributes.src===asset.url}
        onClick={()=>select(asset.url,node.attributes.alt||asset.alt||'')}>
        <img src={safeUrl(asset.url,true)} alt=""/>
      </button>)}</div></div>}
    <label className="ee-field"><span>Describe the image</span>
      <input className="ee-input" aria-label="Image alt text" value={node.attributes.alt||''} placeholder="e.g. Our team in the workshop"
        onChange={e=>select(node.attributes.src||'',e.target.value)}/>
      <small>Read aloud to visitors who cannot see the picture, and used by Google.</small></label>
    <details className="ee-more-options"><summary>Use an image address instead</summary>
      <label className="ee-field"><span>Image address</span>
        <input className="ee-input" aria-label="Image URL" value={node.attributes.src||''} placeholder="https://"
          onChange={e=>select(e.target.value)}/></label>
    </details>
  </section>
}

/* ───────────────────────── Links ───────────────────────── */

type LinkKind='none'|'page'|'shop'|'section'|'url'|'email'|'phone'

function uniqueAnchor(root:BuilderNode,wanted:string){
  const taken=new Set<string>()
  const walk=(node:BuilderNode)=>{if(node.attributes?.id)taken.add(node.attributes.id);(node.children||[]).forEach(walk)}
  walk(root)
  const base=slugify(wanted)||'section'
  if(!taken.has(base))return base
  for(let i=2;i<200;i++)if(!taken.has(base+'-'+i))return base+'-'+i
  return base+'-'+Date.now().toString(36)
}

function LinkEditor({node}:{node:BuilderNode}){
  const project=useBuilderStore(s=>s.project)
  const mutate=useBuilderStore(s=>s.mutate)
  const page=activePage(project)
  const pages=project.pages.filter(p=>!p.isCollectionTemplate)
  const href=node.attributes.href||''
  const sections=page.root.children.filter(child=>!child.hidden)
  const kind:LinkKind=href==='/shop'?'shop':pages.some(p=>p.slug===href)?'page':href.startsWith('mailto:')?'email':href.startsWith('tel:')?'phone'
    :href.startsWith('#')&&href.length>1?'section':href&&href!=='#'?'url':'none'
  const [draft,setDraft]=useState(href)
  useEffect(()=>setDraft(href),[node.id,href])
  const unsafe=draft.trim()!==''&&safeUrl(draft)===''
  const setLink=(value:string,extra?:(target:BuilderNode,root:BuilderNode)=>void)=>mutate('Change link',next=>{
    const root=activePage(next).root
    const target=findNode(root,node.id)
    if(!target)return
    if(value!==''&&safeUrl(value)==='')return
    target.attributes.href=value.trim()
    // Only links to other websites open a new tab.
    if(!/^https?:\/\//i.test(value)){delete target.attributes.target;delete target.attributes.rel}
    extra?.(target,root)
  })
  const linkToSection=(sectionId:string)=>mutate('Link to section',next=>{
    const root=activePage(next).root
    const target=findNode(root,node.id),section=findNode(root,sectionId)
    if(!target||!section)return
    // The section gets a short name the link can jump to.
    if(!section.attributes.id)section.attributes.id=uniqueAnchor(root,section.name)
    target.attributes.href='#'+section.attributes.id
    delete target.attributes.target;delete target.attributes.rel
  })
  const choose=(next:LinkKind)=>{
    if(next==='none')setLink('#')
    else if(next==='page')setLink(pages[0]?.slug||'/')
    else if(next==='shop')setLink('/shop')
    else if(next==='email')setLink('mailto:')
    else if(next==='phone')setLink('tel:')
    else if(next==='section'){const first=sections.find(section=>!findNode(section,node.id))||sections[0];if(first)linkToSection(first.id)}
    else setLink('https://')
  }
  const currentSection=sections.find(section=>section.attributes.id&&'#'+section.attributes.id===href)
  return <div className="ee-field-group">
    <label className="ee-field"><span>When clicked, go to</span>
      <select className="ee-input" aria-label="Link type" value={kind} onChange={e=>choose(e.target.value as LinkKind)}>
        <option value="none">Nothing yet</option>
        <option value="page">A page on this website</option>
        <option value="section">A section on this page</option>
        <option value="shop">Your shop (products)</option>
        <option value="url">Another website</option>
        <option value="email">Send an email</option>
        <option value="phone">Call a phone number</option>
      </select></label>
    {kind==='page'&&<label className="ee-field"><span>Page</span><select className="ee-input" aria-label="Link page" value={href} onChange={e=>setLink(e.target.value)}>
      {pages.map(p=><option key={p.id} value={p.slug}>{p.name}</option>)}</select></label>}
    {kind==='section'&&<label className="ee-field"><span>Section</span>
      <select className="ee-input" aria-label="Link section" value={currentSection?.id||''} onChange={e=>linkToSection(e.target.value)}>
        {!currentSection&&<option value="">{href} (not on this page)</option>}
        {sections.map(section=><option key={section.id} value={section.id}>{section.name}</option>)}
      </select>
      {!currentSection&&<small className="warn">Nothing on this page is named “{href.slice(1)}”. Pick a section.</small>}
    </label>}
    {kind==='shop'&&<p className="ee-muted">Opens the shop page with your products.</p>}
    {(kind==='url'||kind==='email'||kind==='phone')&&<label className="ee-field"><span>{kind==='email'?'Email address':kind==='phone'?'Phone number':'Web address'}</span>
      <input className={'ee-input '+(unsafe?'is-invalid':'')} aria-label="Link destination" inputMode={kind==='email'?'email':kind==='phone'?'tel':'url'}
        value={kind==='email'?draft.replace(/^mailto:/,''):kind==='phone'?draft.replace(/^tel:/,''):draft}
        placeholder={kind==='email'?'hello@yourbusiness.com':kind==='phone'?'+63 900 000 0000':'https://'}
        onChange={e=>{const raw=e.target.value;setDraft(kind==='email'?'mailto:'+raw.trim():kind==='phone'?'tel:'+raw.replace(/[^\d+]/g,''):raw)}}
        onBlur={()=>{
          // People often type "example.com"; make it a full web address.
          const value=kind==='url'&&draft.trim()&&!/^[a-z][a-z0-9+.-]*:|^\/|^#/i.test(draft.trim())?'https://'+draft.trim():draft
          setLink(value)
        }} onKeyDown={e=>{if(e.key==='Enter')(e.target as HTMLInputElement).blur()}}/>
      {unsafe&&<small className="warn">This kind of link is blocked for safety.</small>}
    </label>}
    {kind==='url'&&<label className="ee-check"><input type="checkbox" checked={node.attributes.target==='_blank'} onChange={e=>mutate('Change link',next=>{
      const target=findNode(activePage(next).root,node.id);if(!target)return
      if(e.target.checked){target.attributes.target='_blank';target.attributes.rel='noopener noreferrer'}
      else{delete target.attributes.target;delete target.attributes.rel}
    })}/> Open in a new tab</label>}
  </div>
}

/* ───────────────────────── Content tab ───────────────────────── */

function TextEditor({node,narrow}:{node:BuilderNode;narrow:boolean}){
  const updateNode=useBuilderStore(s=>s.updateNode)
  const multiline=node.type==='paragraph'||node.type==='quote'
  return <label className="ee-field"><span>{node.type==='heading'?'Heading text':node.type==='button'||node.type==='submit'?'Button label':node.type==='link'?'Link text':'Text'}</span>
    {multiline
      ?<textarea className="ee-input" rows={5} value={node.content||''} onChange={e=>updateNode(node.id,{content:e.target.value})} aria-label="Element text"/>
      :<input className="ee-input" value={node.content||''} onChange={e=>updateNode(node.id,{content:e.target.value})} aria-label="Element text"/>}
    {!narrow&&<small>Tip: double-click text on the page to type directly.</small>}
  </label>
}

function ChildrenList({node}:{node:BuilderNode}){
  const selectNode=useBuilderStore(s=>s.selectNode)
  const addNode=useBuilderStore(s=>s.addNode)
  const quick:[BuilderNodeType,string][]=[['heading','Heading'],['paragraph','Text'],['button','Button'],['image','Image']]
  return <div className="ee-field-group">
    <span className="ee-field-label">Inside this {friendlyType[node.type]?.toLowerCase()||'box'}</span>
    {node.children.length?<ul className="ee-children">{node.children.map(child=><li key={child.id}>
      <button type="button" onClick={()=>selectNode(child.id)}><span>{child.name}</span><small>{typeLabel(child)}</small><ChevronRight size={13}/></button>
    </li>)}</ul>:<p className="ee-muted">Empty. Add something below.</p>}
    <div className="ee-quick-add">{quick.map(([type,label])=><button key={type} type="button" className="ee-btn ee-btn-soft" onClick={()=>addNode(node.id,createElement(type))}><Plus size={12}/> {label}</button>)}</div>
  </div>
}

/** Accept the address people copy from YouTube or Vimeo and make it embeddable. */
export function embedAddress(value:string){
  const raw=value.trim()
  const youtube=raw.match(/^https?:\/\/(?:www\.|m\.)?youtube\.com\/watch\?(?:.*&)?v=([\w-]{6,})/i)||raw.match(/^https?:\/\/youtu\.be\/([\w-]{6,})/i)||raw.match(/^https?:\/\/(?:www\.)?youtube\.com\/shorts\/([\w-]{6,})/i)
  if(youtube)return 'https://www.youtube.com/embed/'+youtube[1]
  const vimeo=raw.match(/^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/i)
  if(vimeo)return 'https://player.vimeo.com/video/'+vimeo[1]
  return raw
}

function FormContent({node}:{node:BuilderNode}){
  const mutate=useBuilderStore(s=>s.mutate)
  const custom=(node.attributes.action||'').trim()
  const hasCustom=custom!==''&&custom!=='#'
  const addField=(kind:'text'|'email'|'tel'|'message')=>mutate('Add form field',draft=>{
    const form=findNode(activePage(draft).root,node.id)
    if(!form)return
    const label=kind==='email'?'Email':kind==='tel'?'Phone':kind==='message'?'Message':'Your answer'
    const control=createElement(kind==='message'?'textarea':'input')
    control.name=label+' input'
    control.attributes=kind==='message'?{name:'message',placeholder:'How can we help?'}
      :{type:kind,name:kind==='text'?'answer-'+uid('f').slice(-4):kind==='tel'?'phone':kind,placeholder:kind==='email'?'you@example.com':kind==='tel'?'Your phone number':'',
        ...(kind==='email'?{autocomplete:'email',required:'true'}:kind==='tel'?{autocomplete:'tel'}:{})}
    const field:BuilderNode={id:uid('field'),type:'div',tag:'label',name:label+' field',classes:['form-field'],attributes:{},children:[
      {id:uid('label'),type:'paragraph',tag:'span',name:label+' label',content:label,classes:['form-label'],attributes:{},children:[]},
      control,
    ]}
    // New fields go above the Send button.
    const submitIndex=form.children.findIndex(child=>child.type==='submit')
    form.children.splice(submitIndex>=0?submitIndex:form.children.length,0,field)
  })
  return <div className="ee-field-group">
    <div className="ee-info">{hasCustom
      ?<>Messages are sent to your own form address (see Advanced).</>
      :<><strong>Messages go to your CoBest Inbox.</strong> Open Inbox in your dashboard to read and answer them.</>}</div>
    <div className="ee-field"><span>Add a field</span>
      <div className="ee-quick-add">
        <button type="button" className="ee-btn ee-btn-soft" onClick={()=>addField('text')}><Plus size={12}/> Short answer</button>
        <button type="button" className="ee-btn ee-btn-soft" onClick={()=>addField('email')}><Plus size={12}/> Email</button>
        <button type="button" className="ee-btn ee-btn-soft" onClick={()=>addField('tel')}><Plus size={12}/> Phone</button>
        <button type="button" className="ee-btn ee-btn-soft" onClick={()=>addField('message')}><Plus size={12}/> Long answer</button>
      </div></div>
  </div>
}

function FieldContent({node}:{node:BuilderNode}){
  const updateAttr=useBuilderStore(s=>s.updateNodeAttribute)
  const type=(node.attributes.type||'text').toLowerCase()
  const isInput=node.tag==='input'&&!['checkbox','radio'].includes(type)
  return <>
    {isInput&&<label className="ee-field"><span>What visitors type here</span>
      <select className="ee-input" aria-label="Field type" value={['text','email','tel','number','date'].includes(type)?type:'text'} onChange={e=>updateAttr(node.id,'type',e.target.value)}>
        <option value="text">Any text</option><option value="email">Email address</option><option value="tel">Phone number</option>
        <option value="number">Number</option><option value="date">Date</option>
      </select></label>}
    {node.tag!=='select'&&!['checkbox','radio','date'].includes(type)&&<label className="ee-field"><span>Hint inside the box</span>
      <input className="ee-input" aria-label="Field hint" value={node.attributes.placeholder||''} onChange={e=>updateAttr(node.id,'placeholder',e.target.value)} placeholder="e.g. Your name"/></label>}
    <label className="ee-check"><input type="checkbox" checked={node.attributes.required==='true'} onChange={e=>updateAttr(node.id,'required',e.target.checked?'true':'')}/> Visitors must fill this in</label>
    <p className="ee-muted">To change the label above the box, click the label text on the page.</p>
  </>
}

function ContentTab({node,narrow}:{node:BuilderNode;narrow:boolean}){
  const updateNode=useBuilderStore(s=>s.updateNode)
  const updateAttr=useBuilderStore(s=>s.updateNodeAttribute)
  const [video,setVideo]=useState(node.attributes.src||'')
  useEffect(()=>setVideo(node.attributes.src||''),[node.id,node.attributes.src])
  return <div className="ee-tab-body">
    {node.type==='heading'&&/^h[1-6]$/.test(node.tag)&&<div className="ee-field"><span>Heading size</span><div className="ee-segment" role="group" aria-label="Heading level">
      {['h1','h2','h3','h4'].map(level=><button type="button" key={level} aria-pressed={node.tag===level} onClick={()=>updateNode(node.id,{tag:level})}>{level.toUpperCase()}</button>)}
    </div><small>Use one H1 per page for the main title.</small></div>}
    {textTypes.has(node.type)&&<TextEditor node={node} narrow={narrow}/>}
    {linkTypes.has(node.type)&&node.tag==='a'&&<LinkEditor node={node}/>}
    {node.type==='image'&&<ImageSettings node={node}/>}
    {(node.type==='video'||node.type==='backgroundVideo')&&<label className="ee-field"><span>Video address</span>
      <input className="ee-input" aria-label="Video address" value={video} onChange={e=>setVideo(e.target.value)}
        onBlur={()=>{const next=embedAddress(video);if(safeUrl(next)!==''||next==='')updateAttr(node.id,'src',next)}}
        onKeyDown={e=>{if(e.key==='Enter')(e.target as HTMLInputElement).blur()}} placeholder="Paste a YouTube or Vimeo link"/>
      <small>Paste the link from YouTube or Vimeo. It is converted automatically.</small></label>}
    {node.type==='form'&&<FormContent node={node}/>}
    {['input','textarea','select'].includes(node.type)&&<FieldContent node={node}/>}
    {node.type==='html'&&<label className="ee-field"><span>Custom HTML</span>
      <textarea className="ee-input ee-code" rows={8} value={node.attributes['data-html']||node.content||''} onChange={e=>updateAttr(node.id,'data-html',e.target.value)} spellCheck={false}/>
      <small className="warn">Only paste code from sources you trust. It runs on your published website.</small></label>}
    {canAcceptChildren(node)&&<ChildrenList node={node}/>}
  </div>
}

/* ───────────────────────── Advanced tab ───────────────────────── */

function NumberBox({name,value,placeholder='Auto',onCommit}:{name:string;value:string;placeholder?:string;onCommit:(next:string)=>void}){
  return <label className="ee-field"><span>{name}</span>
    <input key={name+':'+value} className="ee-input" type="number" inputMode="numeric" aria-label={name} defaultValue={value} placeholder={placeholder} step="1"
      onKeyDown={e=>{if(e.key==='Enter')(e.currentTarget as HTMLInputElement).blur()}}
      onBlur={e=>{const next=e.currentTarget.value.trim();if(next!==value)onCommit(next)}}/></label>
}

const triggerNames:Record<BuilderInteraction['trigger'],string>={'page-load':'When the page opens','scroll-into-view':'When it scrolls into view',hover:'When the mouse is over it',click:'When it is clicked'}
const animationNames:Record<BuilderInteraction['animation'],string>={fade:'Fade in','slide-up':'Slide up','slide-left':'Slide in from the side',scale:'Grow',rotate:'Rotate in'}

function AdvancedTab({node}:{node:BuilderNode}){
  const project=useBuilderStore(s=>s.project)
  const breakpoint=useBuilderStore(s=>s.breakpoint)
  const mutate=useBuilderStore(s=>s.mutate)
  const updateAttr=useBuilderStore(s=>s.updateNodeAttribute)
  const removeAttr=useBuilderStore(s=>s.removeNodeAttribute)
  const addClass=useBuilderStore(s=>s.addClass)
  const removeClass=useBuilderStore(s=>s.removeClass)
  const addInteraction=useBuilderStore(s=>s.addInteraction)
  const updateInteraction=useBuilderStore(s=>s.updateInteraction)
  const deleteInteraction=useBuilderStore(s=>s.deleteInteraction)
  const [className,setClassName]=useState('')
  const [anchor,setAnchor]=useState(node.attributes.id||'')
  useEffect(()=>setAnchor(node.attributes.id||''),[node.id,node.attributes.id])
  const geometry=project.styles[geometryClass(node.id)]
  const own=geometry?.[breakpoint]?.none||{}
  const fallback=geometry?.desktop?.none||{}
  const read=(key:string)=>own[key]||fallback[key]||''
  const offset=String(read('translate')).split(/\s+/)
  const x=String(parseFloat(offset[0])||0),y=String(parseFloat(offset[1])||0)
  const widthMode=getElementSizingMode(project,node.id,breakpoint,'width')
  const heightMode=getElementSizingMode(project,node.id,breakpoint,'height')
  const classes=node.classes.filter(name=>!name.startsWith('cb-geometry-'))
  const animations=project.interactions.filter(item=>item.nodeId===node.id)
  const move=(axis:'x'|'y',next:string)=>{
    const amount=next===''?0:Number(next)
    if(!Number.isFinite(amount))return
    mutate('Move element',draft=>{applyNodeGeometry(draft,node.id,breakpoint,{kind:'move',x:axis==='x'?amount:Number(x),y:axis==='y'?amount:Number(y)})})
  }
  const sizing=(axis:'width'|'height',mode:SizingMode,pixels?:number)=>mutate('Change '+axis,draft=>{
    const current=draft.styles[geometryClass(node.id)]?.[breakpoint]?.none||{}
    setElementSizing(draft,node.id,breakpoint,axis,mode,pixels??(parseFloat(current[axis]||'')||(axis==='width'?320:240)))
  })
  const commitAnchor=()=>{
    const clean=anchor.trim()?slugify(anchor):''
    setAnchor(clean)
    if(clean===(node.attributes.id||''))return
    if(clean)updateAttr(node.id,'id',clean);else removeAttr(node.id,'id')
  }
  const submitClass=()=>{
    const clean=className.trim().toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'')
    if(clean&&!clean.startsWith('cb-geometry-'))addClass(node.id,clean)
    setClassName('')
  }
  return <div className="ee-tab-body">
    <p className="ee-device-note">Extra controls. You rarely need these — Content and Design cover everyday changes.</p>

    <section className="ee-group-card" aria-label="Jump link name">
      <h3>Name for jump links</h3>
      <label className="ee-field"><span>Section name</span>
        <div className="ee-prefix"><em>#</em><input className="ee-input" aria-label="Section name for links" value={anchor} placeholder="e.g. contact"
          onChange={e=>setAnchor(e.target.value)} onBlur={commitAnchor} onKeyDown={e=>{if(e.key==='Enter')(e.target as HTMLInputElement).blur()}}/></div>
        <small>Buttons can jump here with “A section on this page”.</small></label>
    </section>

    <section className="ee-group-card" aria-label="Position and size">
      <h3>Position and size <small>{deviceName[breakpoint]}{breakpoint==='desktop'?' and smaller':' only'}</small></h3>
      <div className="ee-two">
        <NumberBox name="Move right (px)" value={x} placeholder="0" onCommit={next=>move('x',next)}/>
        <NumberBox name="Move down (px)" value={y} placeholder="0" onCommit={next=>move('y',next)}/>
      </div>
      <div className="ee-two">
        <label className="ee-field"><span>Width</span><select className="ee-input" aria-label="Width behavior" value={widthMode} onChange={e=>sizing('width',e.target.value as SizingMode)}>
          <option value="theme">Automatic</option><option value="hug">Fit the content</option><option value="fill">Fill the space</option><option value="fixed">Exact size</option></select></label>
        <label className="ee-field"><span>Height</span><select className="ee-input" aria-label="Height behavior" value={heightMode} onChange={e=>sizing('height',e.target.value as SizingMode)}>
          <option value="theme">Automatic</option><option value="hug">Fit the content</option><option value="fixed">Exact size</option></select></label>
      </div>
      {(widthMode==='fixed'||heightMode==='fixed')&&<div className="ee-two">
        {widthMode==='fixed'?<NumberBox name="Width (px)" value={String(parseFloat(read('width'))||'')} onCommit={next=>{const n=Number(next);if(next&&Number.isFinite(n))sizing('width','fixed',n)}}/>:<span/>}
        {heightMode==='fixed'?<NumberBox name="Height (px)" value={String(parseFloat(read('height'))||'')} onCommit={next=>{const n=Number(next);if(next&&Number.isFinite(n))sizing('height','fixed',n)}}/>:<span/>}
      </div>}
      <button type="button" className="ee-link-btn" onClick={()=>mutate('Reset element position and size',draft=>{applyNodeGeometry(draft,node.id,breakpoint,{kind:'reset'})})}>Reset position and size</button>
    </section>

    <section className="ee-group-card" aria-label="Animation">
      <h3>Animation</h3>
      {animations.length===0&&<p className="ee-muted">No animation. Add one to draw attention to this element.</p>}
      {animations.map(item=><div className="ee-animation" key={item.id}>
        <label className="ee-field"><span>Start</span><select className="ee-input" aria-label="Animation start" value={item.trigger} onChange={e=>updateInteraction(item.id,{trigger:e.target.value as BuilderInteraction['trigger']})}>
          {Object.entries(triggerNames).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <label className="ee-field"><span>Effect</span><select className="ee-input" aria-label="Animation effect" value={item.animation} onChange={e=>updateInteraction(item.id,{animation:e.target.value as BuilderInteraction['animation']})}>
          {Object.entries(animationNames).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <label className="ee-field"><span>Speed</span><select className="ee-input" aria-label="Animation speed" value={item.duration<=300?'300':item.duration<=600?'500':'900'} onChange={e=>updateInteraction(item.id,{duration:Number(e.target.value)})}>
          <option value="300">Fast</option><option value="500">Normal</option><option value="900">Slow</option></select></label>
        <button type="button" className="ee-link-btn danger" onClick={()=>deleteInteraction(item.id)}><Trash2 size={13}/> Remove animation</button>
      </div>)}
      <button type="button" className="ee-btn ee-btn-soft" onClick={()=>addInteraction({id:uid('interaction'),nodeId:node.id,trigger:'scroll-into-view',animation:'fade',duration:500,delay:0,easing:'ease-out'})}><Plus size={12}/> Add animation</button>
    </section>

    {node.type==='form'&&<section className="ee-group-card" aria-label="Form address">
      <h3>Send form somewhere else</h3>
      <label className="ee-field"><span>Form address (optional)</span>
        <input className="ee-input" aria-label="Form address" value={node.attributes.action==='#'?'':node.attributes.action||''} placeholder="https://formspree.io/f/…"
          onChange={e=>{const value=e.target.value.trim();if(value==='')removeAttr(node.id,'action');else if(safeUrl(value)!=='')updateAttr(node.id,'action',value)}}/>
        <small>Leave empty to receive messages in your CoBest Inbox.</small></label>
    </section>}

    <details className="ee-more-options"><summary>Style names (for designers)</summary>
      <p className="ee-muted">Elements that share a style name share its look.</p>
      <div className="ee-chips">{classes.map(name=><span key={name} className="ee-chip">{name}
        <button type="button" aria-label={'Remove style name '+name} onClick={()=>removeClass(node.id,name)}><X size={11}/></button></span>)}
        {!classes.length&&<span className="ee-muted">None</span>}</div>
      <div className="ee-row"><input className="ee-input" aria-label="New style name" value={className} placeholder="Add a style name" onChange={e=>setClassName(e.target.value)}
        onKeyDown={e=>{if(e.key==='Enter')submitClass()}}/><button type="button" className="ee-btn" onClick={submitClass} disabled={!className.trim()}>Add</button></div>
    </details>
  </div>
}

/* ───────────────────────── Inspector ───────────────────────── */

function PageOverview({narrow}:{narrow:boolean}){
  const project=useBuilderStore(s=>s.project)
  const selectNode=useBuilderStore(s=>s.selectNode)
  const page=activePage(project)
  return <div className="ee-tab-body">
    <div className="ee-empty-inspector">
      <MousePointerClick size={26}/>
      <h3>{narrow?'Tap':'Click'} anything on the page to edit it</h3>
      <p>Text, images, buttons and colors open here.{narrow?'':' Double-click text to type directly on the page.'}</p>
    </div>
    <div className="ee-field-group"><span className="ee-field-label">Sections on this page</span>
      {page.root.children.length?<ul className="ee-children">{page.root.children.map(child=><li key={child.id}>
        <button type="button" onClick={()=>selectNode(child.id)}><span>{child.name}</span><small>{typeLabel(child)}</small><ChevronRight size={13}/></button>
      </li>)}</ul>:<p className="ee-muted">No sections yet. Open “Add”.</p>}
    </div>
    {!narrow&&<div className="ee-shortcuts"><strong>Shortcuts</strong>
      <span><kbd>Ctrl</kbd>+<kbd>Z</kbd> Undo</span><span><kbd>Ctrl</kbd>+<kbd>D</kbd> Duplicate</span>
      <span><kbd>Del</kbd> Delete</span><span><kbd>Esc</kbd> Deselect</span><span><kbd>Ctrl</kbd>+<kbd>S</kbd> Save</span>
    </div>}
  </div>
}

export function EasyInspector({onCopy,narrow=false}:{onCopy:()=>void;narrow?:boolean}){
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
  const defaultTab:InspectorTab=node&&isContainer&&node.type!=='form'&&!textTypes.has(node.type)?'design':'content'
  const [tab,setTab]=useState<InspectorTab>(defaultTab)
  const top=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    setTab(defaultTab)
    // Start every element at the top of its settings, not where the last one was scrolled to.
    const scroller=top.current?.closest('.ee-right,.ee-sheet-body') as HTMLElement|null
    if(scroller)scroller.scrollTop=0
  },[selectedId])
  useEffect(()=>{
    // Other parts of the editor (context menu, publish review) can open a tab.
    const open=(event:Event)=>{const next=(event as CustomEvent).detail;if(next==='content'||next==='design'||next==='advanced')setTab(next)}
    window.addEventListener('cobest-inspector-tab',open)
    return()=>window.removeEventListener('cobest-inspector-tab',open)
  },[])
  const pos=useMemo(()=>node?siblingPosition(page.root,node.id):null,[page.root,node])
  if(!node||node.id===page.root.id)return <div className="ee-inspector" ref={top}><div className="ee-inspector-head"><span className="ee-badge">Page</span><h2>{page.name}</h2></div><PageOverview narrow={narrow}/></div>
  const parent=findParent(page.root,node.id)
  const locked=!!node.locked
  return <div className="ee-inspector" ref={top}>
    <div className="ee-inspector-head">
      <span className="ee-badge">{friendlyType[node.type]||node.type}</span>
      <input className="ee-name-input" aria-label="Element name" value={node.name} maxLength={80} onChange={e=>updateNode(node.id,{name:e.target.value})}/>
      <div className="ee-actions" role="toolbar" aria-label="Element actions">
        <button type="button" title="Move up" aria-label="Move up" disabled={locked||!pos||pos.index===0} onClick={()=>pos&&moveNode(node.id,pos.parent.id,pos.index-1)}><ChevronUp size={15}/></button>
        <button type="button" title="Move down" aria-label="Move down" disabled={locked||!pos||pos.index>=pos.count-1} onClick={()=>pos&&moveNode(node.id,pos.parent.id,pos.index+2)}><ChevronDown size={15}/></button>
        <button type="button" title="Select the box around this" aria-label="Select parent" disabled={!parent||parent.id===page.root.id} onClick={()=>parent&&selectNode(parent.id)}><CornerLeftUp size={15}/></button>
        <button type="button" title={node.hidden?'Show on website':'Hide on website'} aria-label={node.hidden?'Show element':'Hide element'} onClick={()=>updateNode(node.id,{hidden:!node.hidden})}>{node.hidden?<EyeOff size={15}/>:<Eye size={15}/>}</button>
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
    {tab==='content'&&<ContentTab node={node} narrow={narrow}/>}
    {tab==='design'&&<div className="ee-tab-body">
      <p className={'ee-device-note '+(breakpoint==='desktop'?'':'is-device')}>{breakpoint==='desktop'
        ?'Editing for all devices. Switch to Tablet or Mobile to adjust only smaller screens.'
        :'Editing only '+(breakpoint==='tablet'?'tablet':'mobile')+' and smaller. Desktop stays the same.'}</p>
      <div className="ee-legacy-light"><DesignControls/></div>
    </div>}
    {tab==='advanced'&&<AdvancedTab node={node}/>}
  </div>
}
