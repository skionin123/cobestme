import React, { useMemo, useRef, useState } from 'react'
import { isAuthenticated, uploadMedia } from '../api.js'
import {
  ChevronDown, ChevronRight, Copy, File, FolderPlus, GripVertical, Image as ImageIcon,
  Layers, Plus, Save, Trash2, Upload, X
} from 'lucide-react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { createElement, createPrebuiltSection, mvpElementCatalog } from './elements'
import { applyTemplate, builderTemplates } from './templates'
import { applyNodeGeometry, geometryClass } from './geometry'
import { canAcceptChildren, findNode, findParent, slugify, uid, walkNodes } from './tree'
import { useBuilderStore } from './store'
import type { BuilderAsset, BuilderInteraction, BuilderNode, CmsCollection, CmsField, CssProperties } from './types'

const control='vb-control w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-[11px] text-zinc-100 outline-none focus:border-indigo-500'
const label='vb-label mb-1 block text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-500'
const panelButton='vb-panel-button rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-2 text-[10px] font-semibold text-zinc-200 hover:bg-zinc-700'
const panelSection='vb-panel-section border-b border-zinc-800 p-3'

function slugClass(value:string){
  return slugify(value).replaceAll('-','_')
}

const canvasContainerTypes=new Set(['div','section','container','grid','flex','columns','form','navbar','footer','tabs','collectionList'])

function DraggablePaletteItem({type,label:labelText,note,section=false}:{type:string;label:string;note?:string;section?:boolean}){
  const project=useBuilderStore(s=>s.project)
  const selected=useBuilderStore(s=>s.selectedNodeId)
  const addNode=useBuilderStore(s=>s.addNode)
  const page=project.pages.find(p=>p.id===project.activePageId)||project.pages[0]
  const selectedNode=findNode(page.root,selected)
  const clickAdd=()=>{
    const node=section?createPrebuiltSection(type):createElement(type as any)
    if(section){addNode(page.root.id,node);return}
    const parent=selectedNode&&canvasContainerTypes.has(selectedNode.type)
      ? selectedNode
      : selectedNode?findParent(page.root,selectedNode.id):null
    addNode(parent?.id||page.root.id,node)
  }
  const dragStart=(event:React.DragEvent<HTMLButtonElement>)=>{
    const payload=JSON.stringify({kind:section?'new-section':'new-element',type})
    event.dataTransfer.effectAllowed='copy'
    event.dataTransfer.setData('application/x-cobest-builder',payload)
    event.dataTransfer.setData('text/plain','cobest:'+payload)
  }
  return <button draggable onDragStart={dragStart} onClick={clickAdd} title={`Click to add ${labelText}, or drag it onto the page`} className="vb-palette-item flex min-h-16 w-full cursor-grab flex-col items-start rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 text-left hover:border-zinc-700 hover:bg-zinc-800 active:cursor-grabbing">
    <strong className="text-[11px] font-semibold text-zinc-100">{labelText}</strong>
    <span className="mt-1 text-[8px] font-medium text-zinc-600">{note||'Click to add · drag to place'}</span>
  </button>
}

export function AddPanel(){
  const [query,setQuery]=useState('')
  const q=query.trim().toLowerCase()
  return <div className="h-full overflow-auto">
    <div className={panelSection}>
      <span className={label}>Add elements</span>
      <strong className="mb-2 block text-[11px] text-zinc-200">Building blocks</strong>
      <input className={control} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search elements"/>
    </div>
    <div className="p-3">
      {mvpElementCatalog.map(group=>{
        const items=group.items.filter(([,name])=>!q||name.toLowerCase().includes(q))
        if(!items.length)return null
        return <section className="mb-4" key={group.group}><span className={label}>{group.group}</span><div className="vb-palette-grid grid grid-cols-1 gap-2">{items.map(([type,name])=><DraggablePaletteItem key={type} type={type} label={name}/>)}</div></section>
      })}

    </div>
  </div>
}

function DropLine({id}:{id:string}){
  const {setNodeRef,isOver}=useDroppable({id,data:{kind:'drop-line'}})
  return <div ref={setNodeRef} data-drop-id={id} className={'h-1 rounded-full transition '+(isOver?'bg-indigo-500':'bg-transparent')}/>
}

function NavigatorNode({node,depth=0}:{node:BuilderNode;depth?:number}){
  const selected=useBuilderStore(s=>s.selectedNodeId)
  const selectNode=useBuilderStore(s=>s.selectNode)
  const duplicateNode=useBuilderStore(s=>s.duplicateNode)
  const deleteNode=useBuilderStore(s=>s.deleteNode)
  const [open,setOpen]=useState(true)
  const {attributes,listeners,setNodeRef:dragRef,transform,isDragging}=useDraggable({id:`node:${node.id}`,data:{kind:'node',nodeId:node.id},disabled:depth===0})
  const acceptsChildren=canAcceptChildren(node)
  const {setNodeRef:dropRef,isOver}=useDroppable({id:`inside:${node.id}`,data:{kind:'node-inside',nodeId:node.id},disabled:!acceptsChildren})
  const childCount=node.children?.length||0
  return <div>
    {depth>0&&<DropLine id={`before:${node.id}`}/>} 
    <div ref={dropRef} className={'relative '+(isOver?'bg-indigo-500/10':'')}>
      <div ref={dragRef} style={{transform:CSS.Translate.toString(transform),opacity:isDragging?.4:1,paddingLeft:8+depth*14}} className={'vb-nav-row group flex h-8 items-center gap-1.5 rounded-md pr-1 text-[10px] '+(selected===node.id?'is-selected bg-indigo-500/20 text-white':'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200')}>
        <button className="vb-nav-toggle grid h-6 w-5 place-items-center text-zinc-600" onClick={()=>setOpen(x=>!x)}>{childCount?(open?<ChevronDown size={12}/>:<ChevronRight size={12}/>):null}</button>
        <button {...listeners} {...attributes} className="vb-nav-drag cursor-grab text-zinc-600 opacity-0 group-hover:opacity-100"><GripVertical size={12}/></button>
        <button className="vb-nav-name min-w-0 flex-1 truncate text-left" onClick={()=>selectNode(node.id)}><span className="vb-nav-type mr-2 text-[8px] uppercase text-zinc-600">{node.type}</span><span className="vb-nav-title">{node.name}</span></button>
        {node.componentId&&<span title="Component" className="rounded bg-violet-500/15 px-1 text-[8px] text-violet-300">C</span>}
        {depth>0&&<div className="hidden items-center gap-0.5 group-hover:flex"><button title="Duplicate" className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-white" onClick={()=>duplicateNode(node.id)}><Copy size={10}/></button><button title="Delete" className="rounded p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-300" onClick={()=>deleteNode(node.id)}><Trash2 size={10}/></button></div>}
      </div>
    </div>
    {open&&childCount>0&&<div>{node.children.map(child=><NavigatorNode key={child.id} node={child} depth={depth+1}/>)}</div>}
    {depth>0&&<DropLine id={`after:${node.id}`}/>}
  </div>
}

export function TemplatesPanel(){
  const project=useBuilderStore(s=>s.project)
  const replaceProject=useBuilderStore(s=>s.replaceProject)
  return <div className="h-full overflow-auto">
    <div className={panelSection}>
      <span className={label}>Starting theme</span>
      <strong className="block text-[12px] text-zinc-100">Choose one of two directions.</strong>
      <p className="mt-1 text-[9px] leading-4 text-zinc-500">Both are intentionally simple. Pick a base, then make the real design decisions directly on the canvas.</p>
    </div>
    <div className="space-y-3 p-3">{builderTemplates.map(template=><article key={template.id} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="h-28 p-3" style={{background:`linear-gradient(135deg,${template.accent}20,#13161b)`}}>
        <span className="rounded bg-black/25 px-2 py-1 text-[8px] font-semibold uppercase tracking-[.12em] text-white/70">{template.name}</span>
        <div className="mt-5 h-2 w-3/4 rounded bg-white/85"/><div className="mt-2 h-1.5 w-1/2 rounded bg-white/30"/>
        <div className="mt-4 grid grid-cols-3 gap-1.5"><i className="h-6 rounded bg-white/10"/><i className="h-6 rounded bg-white/10"/><i className="h-6 rounded bg-white/10"/></div>
      </div>
      <div className="p-3"><strong className="block text-[11px] text-white">{template.name}</strong><p className="mt-1 text-[9px] leading-4 text-zinc-500">{template.description}</p><button className={panelButton+' mt-3 w-full'} onClick={()=>{if(confirm(`Apply ${template.name}? Your current project remains in version history and undo.`))replaceProject(applyTemplate(template,project),true,'Apply theme')}}>Use {template.name}</button></div>
    </article>)}</div>
  </div>
}

export function NavigatorPanel(){
  const project=useBuilderStore(s=>s.project)
  const page=project.pages.find(p=>p.id===project.activePageId)||project.pages[0]
  return <div className="vb-navigator h-full overflow-auto p-2"><div className="vb-navigator-head"><span>Navigator</span><strong>{page.name}</strong></div><NavigatorNode node={page.root}/></div>
}

export function PagesPanel(){
  const project=useBuilderStore(s=>s.project)
  const setActivePage=useBuilderStore(s=>s.setActivePage)
  const addPage=useBuilderStore(s=>s.addPage)
  const renamePage=useBuilderStore(s=>s.renamePage)
  const duplicatePage=useBuilderStore(s=>s.duplicatePage)
  const deletePage=useBuilderStore(s=>s.deletePage)
  const reorderPage=useBuilderStore(s=>s.reorderPage)
  const updatePageSeo=useBuilderStore(s=>s.updatePageSeo)
  const [adding,setAdding]=useState(false)
  const [name,setName]=useState('')
  const create=()=>{if(!name.trim())return;addPage(name);setName('');setAdding(false)}
  return <div className="h-full overflow-auto">
    <div className="flex items-center justify-between border-b border-zinc-800 p-3"><div><span className={label}>Pages</span><strong className="text-xs text-zinc-100">{project.pages.length} pages</strong></div><button className={panelButton} aria-label="Add page" onClick={()=>setAdding(true)}><Plus size={12}/></button></div>
    {adding&&<div className={panelSection}><input autoFocus className={control} value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&create()} placeholder="Page name"/><div className="mt-2 flex gap-2"><button className={panelButton} onClick={create}>Create</button><button className={panelButton} onClick={()=>setAdding(false)}>Cancel</button></div></div>}
    <div className="p-2">{project.pages.map((page,i)=><div className={'group mb-1 rounded-lg border p-2 '+(page.id===project.activePageId?'border-indigo-500/60 bg-indigo-500/10':'border-transparent hover:bg-zinc-900')} key={page.id}>
      <button className="w-full text-left" onClick={()=>setActivePage(page.id)}><strong className="block text-[11px] text-zinc-100">{page.name}</strong><span className="text-[9px] text-zinc-500">{page.slug}</span></button>
      <div className="mt-2 hidden gap-1 group-hover:flex">
        <button className={panelButton} onClick={()=>{const next=prompt('Rename page',page.name);if(next)renamePage(page.id,next)}}>Rename</button>
        <button className={panelButton} onClick={()=>duplicatePage(page.id)}>Duplicate</button>
        {page.slug!=='/'&&<button className={panelButton} onClick={()=>{const next=prompt('Page path',page.slug);if(next)updatePageSeo(page.id,'slug',next)}}>Path</button>}
        <button className={panelButton} onClick={()=>reorderPage(page.id,-1)} disabled={i===0}>↑</button>
        <button className={panelButton} onClick={()=>reorderPage(page.id,1)} disabled={i===project.pages.length-1}>↓</button>
        {page.slug!=='/'&&project.pages.length>1&&<button className={panelButton} onClick={()=>confirm(`Delete ${page.name}?`)&&deletePage(page.id)}><Trash2 size={11}/></button>}
      </div>
    </div>)}</div>
  </div>
}

export function AssetsPanel(){
  const project=useBuilderStore(s=>s.project)
  const addAsset=useBuilderStore(s=>s.addAsset)
  const removeAsset=useBuilderStore(s=>s.removeAsset)
  const fileRef=useRef<HTMLInputElement>(null)
  const upload=async(files:FileList|null)=>{
    if(!files)return
    for(const file of Array.from(files)){
      if(!file.type.startsWith('image/'))continue
      try{
        if(isAuthenticated()){
          const uploaded=await uploadMedia(file)
          if(uploaded?.url){
            const asset:BuilderAsset={id:String(uploaded.id||uid('asset')),name:uploaded.name||file.name,mimeType:uploaded.mime_type||file.type,url:uploaded.url,alt:uploaded.name||file.name.replace(/\.[^.]+$/,''),createdAt:uploaded.created_at||new Date().toISOString()}
            addAsset(asset)
            continue
          }
        }
        const url=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(r.error);r.readAsDataURL(file)})
        const asset:BuilderAsset={id:uid('asset'),name:file.name,mimeType:file.type,url,alt:file.name.replace(/\.[^.]+$/,''),createdAt:new Date().toISOString()}
        addAsset(asset)
      }catch(error:any){
        alert(error?.message||`Could not upload ${file.name}`)
      }
    }
  }
  return <div className="h-full overflow-auto">
    <div className="flex items-center justify-between border-b border-zinc-800 p-3"><div><span className={label}>Assets</span><strong className="text-xs text-zinc-100">{project.assets.length} files</strong></div><><input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={e=>upload(e.target.files)}/><button className={panelButton} aria-label="Upload image" onClick={()=>fileRef.current?.click()}><Upload size={12}/></button></></div>
    <div className="grid grid-cols-2 gap-2 p-3">{project.assets.map(asset=><div className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900" key={asset.id}><img src={asset.url} alt={asset.alt||''} className="h-24 w-full object-cover"/><div className="p-2"><strong className="block truncate text-[9px] text-zinc-300">{asset.name}</strong></div><button className="absolute right-1 top-1 hidden rounded bg-black/70 p-1 text-white group-hover:block" onClick={()=>removeAsset(asset.id)}><X size={11}/></button></div>)}</div>
    {!project.assets.length&&<div className="p-6 text-center text-[10px] leading-5 text-zinc-500"><ImageIcon className="mx-auto mb-2" size={20}/>Upload images to reuse across pages.</div>}
  </div>
}

export function ComponentsPanel(){
  const project=useBuilderStore(s=>s.project)
  const selected=useBuilderStore(s=>s.selectedNodeId)
  const createComponent=useBuilderStore(s=>s.createComponent)
  const insertComponent=useBuilderStore(s=>s.insertComponent)
  const deleteComponent=useBuilderStore(s=>s.deleteComponent)
  const page=project.pages.find(p=>p.id===project.activePageId)||project.pages[0]
  const selectedNode=findNode(page.root,selected)
  const parent=selectedNode?findParent(page.root,selectedNode.id):null
  const saveSelected=()=>{
    if(!selectedNode)return
    const name=prompt('Component name',selectedNode.name)
    if(name)createComponent(selectedNode.id,name)
  }
  return <div className="h-full overflow-auto">
    <div className={panelSection}><button disabled={!selectedNode} className={panelButton+' w-full disabled:opacity-40'} onClick={saveSelected}><Save size={12} className="mr-1 inline"/> Save selected as component</button></div>
    <div className="p-2">{project.components.map(component=><div className="group mb-2 rounded-lg border border-zinc-800 bg-zinc-900 p-2" key={component.id}><strong className="block text-[11px] text-zinc-100">{component.name}</strong><span className="text-[9px] text-zinc-500">{component.master.type}</span><div className="mt-2 flex gap-1"><button className={panelButton} onClick={()=>insertComponent(component.id,parent?.id||page.root.id)}>Insert</button><button className={panelButton} onClick={()=>confirm('Delete component? Existing instances will remain as normal elements.')&&deleteComponent(component.id)}><Trash2 size={11}/></button></div></div>)}</div>
    {!project.components.length&&<div className="p-6 text-center text-[10px] leading-5 text-zinc-500">Select any section or element, then save it as a reusable component.</div>}
  </div>
}

function inheritedStyle(project:any,className:string,breakpoint:string,state:string,property:string){
  const order=['desktop','tablet','mobileLandscape','mobilePortrait']
  const index=order.indexOf(breakpoint)
  for(let i=index;i>=0;i--){
    const value=project.styles[className]?.[order[i]]?.[state]?.[property]
    if(value!=null&&value!=='')return {value,source:order[i],overridden:i===index}
    if(state!=='none'){
      const base=project.styles[className]?.[order[i]]?.none?.[property]
      if(base!=null&&base!=='')return {value:base,source:order[i],overridden:false}
    }
  }
  return {value:'',source:'—',overridden:false}
}

function StyleInput({className,property,labelText,type='text',options,placeholder}:{className:string;property:string;labelText:string;type?:string;options?:string[];placeholder?:string}){
  const project=useBuilderStore(s=>s.project)
  const breakpoint=useBuilderStore(s=>s.breakpoint)
  const state=useBuilderStore(s=>s.styleState)
  const setStyle=useBuilderStore(s=>s.setStyle)
  const removeStyle=useBuilderStore(s=>s.removeStyle)
  const inherited=inheritedStyle(project,className,breakpoint,state,property)
  const direct=project.styles[className]?.[breakpoint]?.[state]?.[property]??''
  const status=direct?'override':inherited.value?`inherited · ${inherited.source}`:'default'
  return <label className="block">
    <span className="mb-1 flex items-center justify-between text-[9px] text-zinc-500"><b className="font-medium uppercase tracking-[.08em]">{labelText}</b><em className={direct?'not-italic text-indigo-300':'not-italic text-zinc-600'}>{status}</em></span>
    <div className="flex gap-1">{options?<select className={control} value={direct||inherited.value||''} onChange={e=>e.target.value?setStyle(className,property,e.target.value):removeStyle(className,property)}><option value="">Default</option>{options.map(x=><option key={x}>{x}</option>)}</select>:<input className={control} type={type} value={direct} placeholder={placeholder||inherited.value||'—'} onChange={e=>setStyle(className,property,e.target.value)}/>} {direct&&<button type="button" title="Reset to inherited" className="rounded border border-zinc-700 px-2 text-zinc-500 hover:text-white" onClick={()=>removeStyle(className,property)}>↺</button>}</div>
  </label>
}

function ValueUnitInput({className,property,labelText,defaultUnit='px'}:{className:string;property:string;labelText:string;defaultUnit?:string}){
  const project=useBuilderStore(s=>s.project)
  const breakpoint=useBuilderStore(s=>s.breakpoint)
  const state=useBuilderStore(s=>s.styleState)
  const setStyle=useBuilderStore(s=>s.setStyle)
  const removeStyle=useBuilderStore(s=>s.removeStyle)
  const inherited=inheritedStyle(project,className,breakpoint,state,property)
  const direct=project.styles[className]?.[breakpoint]?.[state]?.[property]??''
  const source=direct||inherited.value
  const match=String(source).match(/^(-?[\d.]+)(px|%|em|rem|vw|vh)?$/)
  const [value,setValue]=useState(match?.[1]||'')
  const [unit,setUnit]=useState(match?.[2]||defaultUnit)
  React.useEffect(()=>{
    setValue(match?.[1]||'')
    setUnit(match?.[2]||defaultUnit)
  },[source,defaultUnit])
  const apply=(v:string,u:string)=>v===''?removeStyle(className,property):setStyle(className,property,v+u)
  const status=direct?'override':inherited.value?`inherited · ${inherited.source}`:'default'
  return <label className="block"><span className="mb-1 flex items-center justify-between text-[9px] text-zinc-500"><b className="font-medium uppercase tracking-[.08em]">{labelText}</b><em className={direct?'not-italic text-indigo-300':'not-italic text-zinc-600'}>{status}</em></span><div className="flex gap-1"><input className={control} value={value} placeholder={match?.[1]||'auto'} onChange={e=>{setValue(e.target.value);apply(e.target.value,unit)}}/><select className="rounded-md border border-zinc-700 bg-zinc-900 px-1 text-[10px] text-zinc-300" value={unit} onChange={e=>{setUnit(e.target.value);if(value)setStyle(className,property,value+e.target.value)}}>{['px','%','em','rem','vw','vh'].map(x=><option key={x}>{x}</option>)}</select><button type="button" className="rounded-md border border-zinc-700 px-2 text-[9px] text-zinc-400" onClick={()=>{setValue('');setStyle(className,property,'auto')}}>auto</button>{direct&&<button type="button" title="Reset to inherited" className="rounded-md border border-zinc-700 px-2 text-[9px] text-zinc-400 hover:text-white" onClick={()=>removeStyle(className,property)}>↺</button>}</div></label>
}

function BoxModel({className}:{className:string}){
  return <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
    <span className={label}>Box model</span>
    <div className="grid grid-cols-2 gap-2">
      {['marginTop','marginRight','marginBottom','marginLeft','paddingTop','paddingRight','paddingBottom','paddingLeft'].map(prop=><ValueUnitInput key={prop} className={className} property={prop} labelText={prop.replace(/([A-Z])/g,' $1')}/>)}
    </div>
  </div>
}

function InspectorNumber({name,value,onCommit,placeholder='Auto'}:{
  name:string;value:string;placeholder?:string;onCommit:(next:string)=>void
}){
  return <label className="vb-inspector-field">
    <span>{name}</span>
    <input key={value+'-'+name} type="number" aria-label={name} defaultValue={value}
      placeholder={placeholder} step="1"
      onKeyDown={e=>{if(e.key==='Enter')(e.currentTarget as HTMLInputElement).blur()}}
      onBlur={e=>{const next=e.currentTarget.value.trim();if(next!==value)onCommit(next)}}/>
  </label>
}

export function StylePanel(){
  const project=useBuilderStore(s=>s.project)
  const selectedId=useBuilderStore(s=>s.selectedNodeId)
  const breakpoint=useBuilderStore(s=>s.breakpoint)
  const styleState=useBuilderStore(s=>s.styleState)
  const setStyleState=useBuilderStore(s=>s.setStyleState)
  const addClass=useBuilderStore(s=>s.addClass)
  const removeClass=useBuilderStore(s=>s.removeClass)
  const renameClass=useBuilderStore(s=>s.renameClass)
  const page=project.pages.find(p=>p.id===project.activePageId)||project.pages[0]
  const node=findNode(page.root,selectedId)
  const [advanced,setAdvanced]=useState(false)
  const editableClasses=(node?.classes||[]).filter(x=>!x.startsWith('cb-geometry-'))
  const [activeClass,setActiveClass]=useState(editableClasses.at(-1)||'')
  React.useEffect(()=>setActiveClass(editableClasses.at(-1)||''),[selectedId,node?.classes?.join('|')])
  React.useEffect(()=>setAdvanced(false),[selectedId])
  if(!node)return <EmptyPanel text="Select an element to edit it."/>
  const geometryName=geometryClass(node.id)
  const geometry=project.styles[geometryName]
  const atBreakpoint=geometry?.[breakpoint]?.none||{}
  const fallback=geometry?.desktop?.none||{}
  const read=(key:string)=>atBreakpoint[key]||fallback[key]||''
  const pos=String(read('translate')).split(/\\s+/)
  const x=String(parseFloat(pos[0])||0)
  const y=String(parseFloat(pos[1])||0)
  const isText=['heading','paragraph','button','link'].includes(node.type)
  const editable=node.id!==page.root.id&&!node.locked
  const mutateGeometry=(labelText:string,change:Parameters<typeof applyNodeGeometry>[3])=>{
    useBuilderStore.getState().mutate(labelText,draft=>{applyNodeGeometry(draft,node.id,breakpoint,change)})
  }
  const changeNumber=(property:'x'|'y'|'width'|'fontSize',next:string)=>{
    const amount=next===''?null:Number(next)
    if(amount!==null&&!Number.isFinite(amount))return
    if(property==='x'||property==='y'){
      mutateGeometry('Move element', {
        kind:'move',x:property==='x'?(amount||0):Number(x),
        y:property==='y'?(amount||0):Number(y)
      })
    }else if(property==='width'){
      if(amount===null){
        useBuilderStore.getState().mutate('Reset width',draft=>{
          const properties=draft.styles[geometryName]?.[breakpoint]?.none
          if(properties){delete properties.width;delete properties.maxWidth}
        })
        return
      }
      mutateGeometry('Resize element',{kind:'resize',width:amount})
    }else{
      if(amount===null){
        useBuilderStore.getState().mutate('Reset text size',draft=>{
          const properties=draft.styles[geometryName]?.[breakpoint]?.none
          if(properties)delete properties.fontSize
        })
        return
      }
      mutateGeometry('Resize text',{kind:'font-size',fontSize:amount})
    }
  }
  const createClass=()=>{
    const name=prompt('Class name',slugClass(node.name))
    if(!name)return
    addClass(node.id,slugClass(name));setActiveClass(slugClass(name))
  }
  return <div className="vb-inspector-scroll h-full overflow-auto pb-8">
    <section className="vb-inspector-identity">
      <span className="vb-inspector-eyebrow">Selected element</span>
      <div className="vb-inspector-name"><strong>{node.name}</strong><span>{node.type}</span></div>
      <p>Edit directly on the page or refine its layout here.</p>
    </section>
    {editable&&<section className="vb-inspector-quick">
      <div className="vb-inspector-heading"><strong>Position</strong><span>{breakpoint.replace('mobilePortrait','Mobile').replace('mobileLandscape','Landscape')}</span></div>
      <div className="vb-inspector-grid">
        <InspectorNumber key={node.id+breakpoint+'x'} name="X" value={x} onCommit={next=>changeNumber('x',next)}/>
        <InspectorNumber key={node.id+breakpoint+'y'} name="Y" value={y} onCommit={next=>changeNumber('y',next)}/>
      </div>
      <div className="vb-inspector-heading"><strong>Dimensions</strong><span>px</span></div>
      <div className="vb-inspector-grid">
        <InspectorNumber key={node.id+breakpoint+'width'} name="Width" value={String(parseFloat(read('width'))||'')} onCommit={next=>changeNumber('width',next)}/>
        {isText&&<InspectorNumber key={node.id+breakpoint+'font'} name="Text size" value={String(parseFloat(read('fontSize'))||'')} onCommit={next=>changeNumber('fontSize',next)}/>}
      </div>
      <p className="vb-inspector-hint">Drag the element's toolbar to move or resize it. Use Navigator to change its order.</p>
      <button className="vb-inspector-reset" type="button" onClick={()=>mutateGeometry('Reset element position and size',{kind:'reset'})}>Reset position & size</button>
    </section>}
    <button type="button" className={'vb-inspector-advanced-toggle '+(advanced?'is-open':'')}
      aria-expanded={advanced} onClick={()=>setAdvanced(open=>!open)}>
      <span>Advanced styling</span><ChevronDown size={15}/>
    </button>
    {advanced&&<div className="vb-inspector-advanced">
      <div className={panelSection}>
        <span className={label}>CSS class</span>
        <div className="flex gap-1">
          <select className={control} value={activeClass} onChange={e=>setActiveClass(e.target.value)}>
            <option value="">Choose a class</option>{editableClasses.map(x=><option key={x}>{x}</option>)}
          </select>
          <button className={panelButton} onClick={createClass} title="Add CSS class" aria-label="Add CSS class"><Plus size={12}/></button>
        </div>
        {activeClass&&<div className="mt-2 flex flex-wrap gap-1">{editableClasses.map(x=>
          <button key={x} onClick={()=>setActiveClass(x)} className={'rounded px-2 py-1 text-[9px] '+(activeClass===x?'bg-indigo-500 text-white':'bg-zinc-800 text-zinc-400')}>
            {x} <span onClick={e=>{e.stopPropagation();removeClass(node.id,x)}}>×</span>
          </button>)}</div>}
        {activeClass&&<button className="mt-2 text-[9px] text-zinc-500 hover:text-zinc-200" onClick={()=>{const next=prompt('Rename class',activeClass);if(next){renameClass(activeClass,slugClass(next));setActiveClass(slugClass(next))}}}>Rename class</button>}
      </div>
      {!activeClass?<EmptyPanel text="Choose or create a CSS class to use advanced styles."/>:<>
        <div className={panelSection}><span className={label}>Responsive inheritance</span><p className="text-[10px] leading-5 text-zinc-500">Editing <strong className="text-zinc-300">{breakpoint}</strong>. Overrides apply to the active breakpoint and smaller viewports.</p></div>
        <StyleGroup title="Typography"><StyleInput className={activeClass} property="fontFamily" labelText="Font" options={['Inter, Arial, sans-serif','DM Sans, Arial, sans-serif','Manrope, Arial, sans-serif','Playfair Display, Georgia, serif','Georgia, serif','Arial, sans-serif']}/><ValueUnitInput className={activeClass} property="fontSize" labelText="Font size"/><StyleInput className={activeClass} property="fontWeight" labelText="Weight" options={['300','400','500','600','700','800','900']}/><StyleInput className={activeClass} property="fontStyle" labelText="Style" options={['normal','italic']}/><ValueUnitInput className={activeClass} property="lineHeight" labelText="Line height"/><StyleInput className={activeClass} property="textAlign" labelText="Alignment" options={['left','center','right','justify']}/><StyleInput className={activeClass} property="color" labelText="Text color" type="color"/></StyleGroup>
        <StyleGroup title="Size"><ValueUnitInput className={activeClass} property="width" labelText="Width"/><ValueUnitInput className={activeClass} property="height" labelText="Height"/><ValueUnitInput className={activeClass} property="minWidth" labelText="Min width"/><ValueUnitInput className={activeClass} property="maxWidth" labelText="Max width"/></StyleGroup>
        <div className={panelSection}><BoxModel className={activeClass}/></div>
        <StyleGroup title="Layout"><StyleInput className={activeClass} property="display" labelText="Display" options={['block','flex','grid','inline-flex','inline-block','none']}/><StyleInput className={activeClass} property="flexDirection" labelText="Flex direction" options={['row','column','row-reverse','column-reverse']}/><StyleInput className={activeClass} property="justifyContent" labelText="Justify" options={['flex-start','center','flex-end','space-between','space-around']}/><StyleInput className={activeClass} property="alignItems" labelText="Align" options={['stretch','flex-start','center','flex-end','baseline']}/><ValueUnitInput className={activeClass} property="gap" labelText="Gap"/><StyleInput className={activeClass} property="gridTemplateColumns" labelText="Grid columns" placeholder="repeat(3, minmax(0,1fr))"/></StyleGroup>
        <StyleGroup title="Appearance"><StyleInput className={activeClass} property="backgroundColor" labelText="Background" type="color"/><ValueUnitInput className={activeClass} property="borderWidth" labelText="Border width"/><StyleInput className={activeClass} property="borderStyle" labelText="Border style" options={['none','solid','dashed','dotted']}/><StyleInput className={activeClass} property="borderColor" labelText="Border color" type="color"/><ValueUnitInput className={activeClass} property="borderRadius" labelText="Radius"/><StyleInput className={activeClass} property="opacity" labelText="Opacity" placeholder="1"/></StyleGroup>
      </>}
    </div>}
  </div>
}

function TextStyleTokens(){
  const project=useBuilderStore(s=>s.project)
  const setTextStyle=useBuilderStore(s=>s.setTextStyle)
  return <div className={panelSection}><span className={label}>Global text styles</span><div className="space-y-3">{Object.entries(project.globals.textStyles).map(([name,props])=><div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2" key={name}><strong className="mb-2 block text-[10px] text-zinc-300">{name}</strong><div className="grid grid-cols-2 gap-2"><label><span className={label}>Font family</span><select className={control} value={props.fontFamily||'Inter, Arial, sans-serif'} onChange={e=>setTextStyle(name,{fontFamily:e.target.value})}>{['Inter, Arial, sans-serif','DM Sans, Arial, sans-serif','Manrope, Arial, sans-serif','Space Grotesk, Arial, sans-serif','Montserrat, Arial, sans-serif','Playfair Display, Georgia, serif','Lora, Georgia, serif','Georgia, serif'].map(x=><option key={x}>{x}</option>)}</select></label><label><span className={label}>Size</span><input className={control} value={props.fontSize||''} onChange={e=>setTextStyle(name,{fontSize:e.target.value})} placeholder="16px"/></label><label><span className={label}>Weight</span><input className={control} value={props.fontWeight||''} onChange={e=>setTextStyle(name,{fontWeight:e.target.value})} placeholder="400"/></label><label><span className={label}>Line height</span><input className={control} value={props.lineHeight||''} onChange={e=>setTextStyle(name,{lineHeight:e.target.value})} placeholder="1.6"/></label></div></div>)}</div></div>
}

function StyleGroup({title,children}:{title:string;children:React.ReactNode}){
  return <section className={panelSection+" vb-style-group"}><span className={label}>{title}</span><div className="space-y-3">{children}</div></section>
}

export function SettingsPanel(){
  const project=useBuilderStore(s=>s.project)
  const selectedId=useBuilderStore(s=>s.selectedNodeId)
  const updateNode=useBuilderStore(s=>s.updateNode)
  const updateAttr=useBuilderStore(s=>s.updateNodeAttribute)
  const removeAttr=useBuilderStore(s=>s.removeNodeAttribute)
  const page=project.pages.find(p=>p.id===project.activePageId)||project.pages[0]
  const node=findNode(page.root,selectedId)
  if(!node)return <EmptyPanel text="Select an element to edit settings."/>
  const linkTypes=['link','button','lightbox']
  return <div className="h-full overflow-auto pb-8">
    <StyleGroup title="Element"><label><span className={label}>Name</span><input className={control} value={node.name} onChange={e=>updateNode(node.id,{name:e.target.value})}/></label><label><span className={label}>ID</span><input className={control} value={node.attributes.id||''} onChange={e=>updateAttr(node.id,'id',e.target.value)}/></label>{node.type==='heading'&&<label><span className={label}>Heading level</span><select className={control} value={node.tag} onChange={e=>updateNode(node.id,{tag:e.target.value})}>{['h1','h2','h3','h4','h5','h6'].map(x=><option key={x}>{x}</option>)}</select></label>}</StyleGroup>
    {['heading','paragraph','button','link'].includes(node.type)&&<StyleGroup title="Content"><label><span className={label}>Text</span>{node.type==='paragraph'?<textarea className={control} rows={5} value={node.content||''} onChange={e=>updateNode(node.id,{content:e.target.value})}/>:<input className={control} value={node.content||''} onChange={e=>updateNode(node.id,{content:e.target.value})}/>}</label></StyleGroup>}
    {linkTypes.includes(node.type)&&<StyleGroup title="Link"><label><span className={label}>Destination</span><input className={control} value={node.attributes.href||''} onChange={e=>updateAttr(node.id,'href',e.target.value)} placeholder="URL, /page, #section, mailto:, tel:"/></label><label className="flex items-center gap-2 text-[10px] text-zinc-400"><input type="checkbox" checked={node.attributes.target==='_blank'} onChange={e=>e.target.checked?updateAttr(node.id,'target','_blank'):removeAttr(node.id,'target')}/> Open in new tab</label></StyleGroup>}
    {node.type==='image'&&<StyleGroup title="Image"><label><span className={label}>Asset library</span><select className={control} value={project.assets.some(a=>a.url===node.attributes.src)?node.attributes.src:''} onChange={e=>{const asset=project.assets.find(a=>a.url===e.target.value);if(asset){updateAttr(node.id,'src',asset.url);if(!node.attributes.alt)updateAttr(node.id,'alt',asset.alt||asset.name)}}}><option value="">Choose uploaded image</option>{project.assets.map(asset=><option value={asset.url} key={asset.id}>{asset.name}</option>)}</select></label><label><span className={label}>Source URL</span><input className={control} value={node.attributes.src||''} onChange={e=>updateAttr(node.id,'src',e.target.value)}/></label><label><span className={label}>Alt text</span><input className={control} value={node.attributes.alt||''} onChange={e=>updateAttr(node.id,'alt',e.target.value)}/></label></StyleGroup>}
    {node.type==='form'&&<StyleGroup title="Form"><label><span className={label}>Action</span><input className={control} value={node.attributes.action||''} onChange={e=>updateAttr(node.id,'action',e.target.value)}/></label><label><span className={label}>Redirect after success</span><input className={control} value={node.attributes['data-redirect']||''} onChange={e=>updateAttr(node.id,'data-redirect',e.target.value)}/></label></StyleGroup>}
    {node.type==='collectionList'&&<StyleGroup title="CMS binding"><label><span className={label}>Collection</span><select className={control} value={node.attributes.collectionId||''} onChange={e=>updateAttr(node.id,'collectionId',e.target.value)}><option value="">Select collection</option>{project.collections.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label></StyleGroup>}

  </div>
}

export function InteractionsPanel(){
  const project=useBuilderStore(s=>s.project)
  const nodeId=useBuilderStore(s=>s.selectedNodeId)
  const addInteraction=useBuilderStore(s=>s.addInteraction)
  const updateInteraction=useBuilderStore(s=>s.updateInteraction)
  const deleteInteraction=useBuilderStore(s=>s.deleteInteraction)
  const items=project.interactions.filter(x=>x.nodeId===nodeId)
  const add=()=>{
    if(!nodeId)return
    addInteraction({id:uid('interaction'),nodeId,trigger:'scroll-into-view',animation:'fade',duration:500,delay:0,easing:'ease-out'})
  }
  return <div className="h-full overflow-auto">
    <div className="flex items-center justify-between border-b border-zinc-800 p-3"><div><span className={label}>Interactions</span><strong className="text-xs text-zinc-100">{items.length} on selected</strong></div><button className={panelButton} onClick={add} disabled={!nodeId}><Plus size={11}/></button></div>
    <div className="space-y-2 p-3">{items.map(item=><InteractionCard key={item.id} item={item} update={patch=>updateInteraction(item.id,patch)} remove={()=>deleteInteraction(item.id)}/>)}</div>
    {!items.length&&<EmptyPanel text="Add a trigger and animation to the selected element."/>}
  </div>
}

function InteractionCard({item,update,remove}:{item:BuilderInteraction;update:(patch:Partial<BuilderInteraction>)=>void;remove:()=>void}){
  return <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3"><div className="mb-3 flex items-center justify-between"><strong className="text-[10px] text-zinc-200">{item.trigger} → {item.animation}</strong><button onClick={remove} className="text-zinc-600 hover:text-red-400"><Trash2 size={12}/></button></div><div className="space-y-2"><label><span className={label}>Trigger</span><select className={control} value={item.trigger} onChange={e=>update({trigger:e.target.value as any})}>{['page-load','scroll-into-view','hover','click'].map(x=><option key={x}>{x}</option>)}</select></label><label><span className={label}>Animation</span><select className={control} value={item.animation} onChange={e=>update({animation:e.target.value as any})}>{['fade','slide-up','slide-left','scale','rotate'].map(x=><option key={x}>{x}</option>)}</select></label><div className="grid grid-cols-2 gap-2"><label><span className={label}>Duration ms</span><input className={control} type="number" value={item.duration} onChange={e=>update({duration:Number(e.target.value)})}/></label><label><span className={label}>Delay ms</span><input className={control} type="number" value={item.delay} onChange={e=>update({delay:Number(e.target.value)})}/></label></div><label><span className={label}>Easing</span><select className={control} value={item.easing} onChange={e=>update({easing:e.target.value})}>{['linear','ease','ease-in','ease-out','ease-in-out','cubic-bezier(.2,.8,.2,1)'].map(x=><option key={x}>{x}</option>)}</select></label></div></div>
}

export function CmsPanel(){
  const project=useBuilderStore(s=>s.project)
  const addCollection=useBuilderStore(s=>s.addCollection)
  const updateCollection=useBuilderStore(s=>s.updateCollection)
  const deleteCollection=useBuilderStore(s=>s.deleteCollection)
  const [selected,setSelected]=useState(project.collections[0]?.id||'')
  const collection=project.collections.find(c=>c.id===selected)
  const create=()=>{
    const name=prompt('Collection name','Blog Posts');if(!name)return
    const c:CmsCollection={id:uid('collection'),name,slug:slugify(name),fields:[{id:uid('field'),name:'Title',slug:'title',type:'text',required:true}],items:[]}
    addCollection(c);setSelected(c.id)
  }
  const addField=()=>{
    if(!collection)return
    const name=prompt('Field name','Description');if(!name)return
    const type=(prompt('Field type: text, richText, image, link, date, reference','text')||'text') as any
    const field:CmsField={id:uid('field'),name,slug:slugify(name),type}
    updateCollection(collection.id,{fields:[...collection.fields,field]})
  }
  const addItem=()=>{
    if(!collection)return
    const values:Record<string,string>={}
    for(const field of collection.fields)values[field.id]=prompt(field.name,'')||''
    const now=new Date().toISOString()
    updateCollection(collection.id,{items:[...collection.items,{id:uid('item'),values,createdAt:now,updatedAt:now}]})
  }
  return <div className="h-full overflow-auto">
    <div className={panelSection}><div className="flex gap-1"><select className={control} value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Choose collection</option>{project.collections.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select><button className={panelButton} onClick={create}><Plus size={11}/></button></div></div>
    {collection?<><div className={panelSection}><div className="flex items-center justify-between"><div><span className={label}>Collection</span><strong className="text-xs text-zinc-100">{collection.name}</strong></div><button className="text-zinc-600 hover:text-red-400" onClick={()=>confirm('Delete collection?')&&deleteCollection(collection.id)}><Trash2 size={13}/></button></div></div><div className={panelSection}><div className="mb-2 flex items-center justify-between"><span className={label}>Fields</span><button className={panelButton} onClick={addField}><Plus size={10}/></button></div>{collection.fields.map(f=><div key={f.id} className="mb-1 flex items-center justify-between rounded bg-zinc-900 px-2 py-2"><strong className="text-[10px] text-zinc-300">{f.name}</strong><span className="text-[8px] text-zinc-600">{f.type}</span></div>)}</div><div className={panelSection}><div className="mb-2 flex items-center justify-between"><span className={label}>Items</span><button className={panelButton} onClick={addItem}><Plus size={10}/></button></div>{collection.items.map((item,i)=><div key={item.id} className="mb-1 rounded bg-zinc-900 px-2 py-2 text-[10px] text-zinc-400">Item {i+1} · {Object.values(item.values)[0]||'Untitled'}</div>)}</div></>:<EmptyPanel text="Create a collection such as Blog Posts, Products, Team Members, or Projects."/>}
  </div>
}

function EmptyPanel({text}:{text:string}){
  return <div className="vb-empty-panel p-6 text-center text-[10px] leading-5 text-zinc-500"><div className="vb-empty-icon">✦</div><strong>Nothing selected</strong><p>{text}</p><span>Tip: choose an element on the canvas or in Navigator.</span></div>
}

export { createElement, createPrebuiltSection }
