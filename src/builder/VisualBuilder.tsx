import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor,
  useDroppable, useSensor, useSensors
} from '@dnd-kit/core'
import {
  ChevronDown, Code2, Component, Database, Download, Eye, FileJson, FolderOpen, Image as ImageIcon,
  Layers, Monitor, PackageOpen, PanelLeft, Redo2, Save, Settings2, Smartphone, Tablet, Undo2,
  Sparkles, Upload, X, ZoomIn, ZoomOut
} from 'lucide-react'
import { createCanvasDocument } from './canvas'
import { downloadProjectJson, downloadProjectZip, importProjectJson } from './export'
import { loadProject, saveProject } from './persistence'
import {
  AddPanel, AssetsPanel, CmsPanel, ComponentsPanel, InteractionsPanel, NavigatorPanel,
  PagesPanel, SettingsPanel, StylePanel, TemplatesPanel, createElement, createPrebuiltSection
} from './panels'
import { useBuilderStore } from './store'
import { clone, findNode, findParent, regenerateNodeIds } from './tree'
import type { BreakpointId, BuilderNode, BuilderProject } from './types'
import './editor-tailwind.css'
import './visual-builder.css'

const widths:Record<BreakpointId,number>={desktop:1440,tablet:991,mobileLandscape:767,mobilePortrait:478}
const breakpointLabels:Record<BreakpointId,string>={desktop:'Desktop 1440',tablet:'Tablet 991',mobileLandscape:'Mobile landscape 767',mobilePortrait:'Mobile portrait 478'}
const viewportHeights:Record<BreakpointId,number>={desktop:900,tablet:760,mobileLandscape:430,mobilePortrait:844}

type LeftTab='add'|'navigator'|'pages'|'templates'|'assets'|'components'|'cms'
type RightTab='style'|'settings'|'interactions'

function CanvasDropZone({children,dragging}:{children:React.ReactNode;dragging:boolean}){
  const {setNodeRef,isOver}=useDroppable({id:'canvas-root',data:{kind:'canvas-root'}})
  return <div ref={setNodeRef} className={'vb-canvas-drop '+(isOver?'is-over':'')} data-dragging={dragging?'true':'false'}>{children}{dragging&&<div className={'vb-canvas-drop-label '+(isOver?'active':'')}>Drop to page</div>}</div>
}

function resolveDropTarget(root:BuilderNode,overId:string){
  if(overId==='canvas-root')return {parentId:root.id,index:root.children.length}
  const [mode,nodeId]=overId.split(':')
  const target=findNode(root,nodeId)
  if(!target)return {parentId:root.id,index:root.children.length}
  if(mode==='inside')return {parentId:nodeId,index:target.children.length}
  const parent=findParent(root,nodeId)
  if(!parent)return {parentId:root.id,index:root.children.length}
  const targetIndex=parent.children.findIndex(x=>x.id===nodeId)
  return {parentId:parent.id,index:mode==='after'?targetIndex+1:targetIndex}
}

function VersionPopover({onClose}:{onClose:()=>void}){
  const project=useBuilderStore(s=>s.project)
  const restoreVersion=useBuilderStore(s=>s.restoreVersion)
  return <div className="absolute right-3 top-12 z-[80] w-80 rounded-xl border border-zinc-700 bg-zinc-900 p-2 shadow-2xl">
    <div className="flex items-center justify-between p-2"><div><span className="block text-[9px] font-semibold uppercase tracking-[.12em] text-zinc-500">Version history</span><strong className="text-xs text-zinc-100">Last {project.versions.length} snapshots</strong></div><button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={14}/></button></div>
    <div className="max-h-80 overflow-auto">{project.versions.length?project.versions.map(v=><button key={v.id} onClick={()=>{if(confirm('Restore this version? Your current state remains available in undo history.')){restoreVersion(v.id);onClose()}}} className="mb-1 w-full rounded-lg p-2 text-left hover:bg-zinc-800"><strong className="block text-[10px] text-zinc-200">{v.label}</strong><span className="text-[9px] text-zinc-500">{new Date(v.createdAt).toLocaleString()}</span></button>):<div className="p-4 text-center text-[10px] text-zinc-500">Versions appear as you edit.</div>}</div>
  </div>
}

function ExportModal({onClose}:{onClose:()=>void}){
  const project=useBuilderStore(s=>s.project)
  const importProject=useBuilderStore(s=>s.importProject)
  const fileRef=useRef<HTMLInputElement>(null)
  const importFile=async(file:File|undefined)=>{
    if(!file)return
    try{
      const imported=await importProjectJson(file)
      if(confirm(`Import "${imported.name}" and replace the current local project?`)){importProject(imported);onClose()}
    }catch(error:any){alert(error?.message||'Unable to import project.')}
  }
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-5">
    <div className="w-full max-w-xl rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-800 p-4"><div><span className="block text-[9px] font-semibold uppercase tracking-[.12em] text-zinc-500">Portable output</span><h2 className="mt-1 text-base font-semibold text-white">Export or import project</h2></div><button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={17}/></button></div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <button onClick={()=>downloadProjectZip(project)} className="rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-left hover:border-indigo-500"><Download size={18} className="mb-4 text-indigo-400"/><strong className="block text-sm text-white">Export website ZIP</strong><p className="mt-1 text-[10px] leading-5 text-zinc-500">HTML per page, clean CSS, minimal runtime JS, sitemap, assets, and project JSON.</p></button>
        <button onClick={()=>downloadProjectJson(project)} className="rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-left hover:border-indigo-500"><FileJson size={18} className="mb-4 text-indigo-400"/><strong className="block text-sm text-white">Export project JSON</strong><p className="mt-1 text-[10px] leading-5 text-zinc-500">Portable editable project tree for backup or migration.</p></button>
        <button onClick={()=>fileRef.current?.click()} className="rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-left hover:border-indigo-500 sm:col-span-2"><Upload size={18} className="mb-4 text-indigo-400"/><strong className="block text-sm text-white">Import project JSON</strong><p className="mt-1 text-[10px] leading-5 text-zinc-500">Restore a previously exported CoBest project into this local builder.</p></button>
        <input ref={fileRef} className="hidden" type="file" accept=".json,.cobest.json,application/json" onChange={e=>importFile(e.target.files?.[0])}/>
      </div>
    </div>
  </div>
}

function ContextMenu({x,y,nodeId,onClose}:{x:number;y:number;nodeId:string;onClose:()=>void}){
  const duplicate=useBuilderStore(s=>s.duplicateNode)
  const remove=useBuilderStore(s=>s.deleteNode)
  const createComponent=useBuilderStore(s=>s.createComponent)
  return <div className="fixed z-[120] w-44 rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-2xl" style={{left:x,top:y}} onMouseLeave={onClose}>
    <button className="w-full rounded px-3 py-2 text-left text-[10px] text-zinc-300 hover:bg-zinc-800" onClick={()=>{duplicate(nodeId);onClose()}}>Duplicate</button>
    <button className="w-full rounded px-3 py-2 text-left text-[10px] text-zinc-300 hover:bg-zinc-800" onClick={()=>{const name=prompt('Component name','Component');if(name)createComponent(nodeId,name);onClose()}}>Create component</button>
    <button className="w-full rounded px-3 py-2 text-left text-[10px] text-red-300 hover:bg-red-500/10" onClick={()=>{remove(nodeId);onClose()}}>Delete</button>
  </div>
}

function LeftPanel({tab}:{tab:LeftTab}){
  if(tab==='add')return <AddPanel/>
  if(tab==='navigator')return <NavigatorPanel/>
  if(tab==='pages')return <PagesPanel/>
  if(tab==='templates')return <TemplatesPanel/>
  if(tab==='assets')return <AssetsPanel/>
  if(tab==='components')return <ComponentsPanel/>
  return <CmsPanel/>
}

function RightPanel({tab}:{tab:RightTab}){
  if(tab==='style')return <StylePanel/>
  if(tab==='settings')return <SettingsPanel/>
  return <InteractionsPanel/>
}

type VisualBuilderProps={
  projectKey?:string
  initialProject?:BuilderProject|null
  onCloudSave?:(project:BuilderProject)=>Promise<unknown>|unknown
  onPublish?:(project:BuilderProject)=>Promise<any>|any
}

export default function VisualBuilder({projectKey='local-default',initialProject=null,onCloudSave,onPublish}:VisualBuilderProps){
  const iframeRef=useRef<HTMLIFrameElement>(null)
  const project=useBuilderStore(s=>s.project)
  const selectedNodeId=useBuilderStore(s=>s.selectedNodeId)
  const hoveredNodeId=useBuilderStore(s=>s.hoveredNodeId)
  const breakpoint=useBuilderStore(s=>s.breakpoint)
  const history=useBuilderStore(s=>s.history)
  const future=useBuilderStore(s=>s.future)
  const saveStatus=useBuilderStore(s=>s.saveStatus)
  const selectNode=useBuilderStore(s=>s.selectNode)
  const hoverNode=useBuilderStore(s=>s.hoverNode)
  const setBreakpoint=useBuilderStore(s=>s.setBreakpoint)
  const setSaveStatus=useBuilderStore(s=>s.setSaveStatus)
  const replaceProject=useBuilderStore(s=>s.replaceProject)
  const renameProject=useBuilderStore(s=>s.renameProject)
  const setActivePage=useBuilderStore(s=>s.setActivePage)
  const addNode=useBuilderStore(s=>s.addNode)
  const updateNode=useBuilderStore(s=>s.updateNode)
  const deleteNode=useBuilderStore(s=>s.deleteNode)
  const duplicateNode=useBuilderStore(s=>s.duplicateNode)
  const moveNode=useBuilderStore(s=>s.moveNode)
  const addClass=useBuilderStore(s=>s.addClass)
  const setStyle=useBuilderStore(s=>s.setStyle)
  const createComponent=useBuilderStore(s=>s.createComponent)
  const undo=useBuilderStore(s=>s.undo)
  const redo=useBuilderStore(s=>s.redo)

  const [leftTab,setLeftTab]=useState<LeftTab>('add')
  const [rightTab,setRightTab]=useState<RightTab>('style')
  const [preview,setPreview]=useState(false)
  const [zoom,setZoom]=useState(80)
  const [canvasHeight,setCanvasHeight]=useState(viewportHeights.desktop)
  const [dragLabel,setDragLabel]=useState('')
  const [dragging,setDragging]=useState(false)
  const [versionsOpen,setVersionsOpen]=useState(false)
  const [exportOpen,setExportOpen]=useState(false)
  const [context,setContext]=useState<{x:number;y:number;nodeId:string}|null>(null)
  const copiedNodeRef=useRef<BuilderNode|null>(null)

  const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:5}}),useSensor(KeyboardSensor))
  const activePage=project.pages.find(p=>p.id===project.activePageId)||project.pages[0]
  const selectedNode=findNode(activePage.root,selectedNodeId)
  const editorDocumentHtml=useMemo(()=>createCanvasDocument(project,breakpoint,true),[project,breakpoint])
  const previewDocumentHtml=useMemo(()=>createCanvasDocument(project,breakpoint,false),[project,breakpoint])
  const frameWidth=Math.min(widths[breakpoint],1440)
  const scale=zoom/100

  useEffect(()=>{
    setCanvasHeight(viewportHeights[breakpoint])
  },[breakpoint,activePage.id])

  useEffect(()=>{
    let alive=true
    const hydrate=async()=>{
      if(initialProject?.pages?.length){
        const cloudProject={...clone(initialProject),id:projectKey||initialProject.id}
        if(!alive)return
        replaceProject(cloudProject,false)
        try{await saveProject(cloudProject)}catch{}
        return
      }
      try{
        const saved=await loadProject(projectKey)
        if(!alive)return
        if(saved)replaceProject(saved,false)
        else{
          const seeded={...clone(useBuilderStore.getState().project),id:projectKey}
          replaceProject(seeded,false)
          await saveProject(seeded)
        }
      }catch{}
    }
    hydrate()
    return()=>{alive=false}
  },[projectKey])

  useEffect(()=>{
    const handler=(event:MessageEvent)=>{
      const msg=event.data||{}
      if(msg.source!=='cobest-builder')return
      if(msg.type==='select')selectNode(msg.id||null)
      if(msg.type==='hover')hoverNode(msg.id||null)
      if(msg.type==='text-change'&&msg.id)updateNode(msg.id,{content:String(msg.content||'')})
      if(msg.type==='canvas-resize'&&Number(msg.height)){
        const next=Math.max(viewportHeights[breakpoint],Math.min(24000,Math.ceil(Number(msg.height))))
        setCanvasHeight(next)
      }
      if(msg.type==='canvas-drop'&&msg.payload&&msg.targetId&&msg.mode){
        const store=useBuilderStore.getState()
        const page=store.project.pages.find(p=>p.id===store.project.activePageId)||store.project.pages[0]
        const target=resolveDropTarget(page.root,`${msg.mode}:${msg.targetId}`)
        const payload=msg.payload
        if(payload.kind==='new-element')store.addNode(target.parentId,createElement(payload.type),target.index)
        else if(payload.kind==='new-section')store.addNode(target.parentId,createPrebuiltSection(payload.type),target.index)
        else if(payload.kind==='node'&&payload.nodeId&&payload.nodeId!==target.parentId)store.moveNode(payload.nodeId,target.parentId,target.index)
      }
      if(msg.type==='spacing-change'&&msg.id&&msg.property){
        const page=useBuilderStore.getState().project.pages.find(p=>p.id===useBuilderStore.getState().project.activePageId)||useBuilderStore.getState().project.pages[0]
        const node=findNode(page.root,msg.id)
        if(node){
          let className=node.classes.at(-1)
          if(!className){className='el-'+msg.id.replace(/[^a-zA-Z0-9_-]/g,'-');addClass(node.id,className)}
          setStyle(className,String(msg.property),String(msg.value))
        }
      }
      if(msg.type==='context'&&msg.id){
        const rect=iframeRef.current?.getBoundingClientRect()
        setContext({nodeId:msg.id,x:(rect?.left||0)+Number(msg.x||0),y:(rect?.top||0)+Number(msg.y||0)})
        selectNode(msg.id)
      }
    }
    window.addEventListener('message',handler)
    return()=>window.removeEventListener('message',handler)
  },[selectNode,hoverNode,updateNode,addClass,setStyle,breakpoint])

  useEffect(()=>{
    iframeRef.current?.contentWindow?.postMessage({source:'cobest-editor',type:'selection',selected:selectedNodeId,hovered:hoveredNodeId},'*')
  },[selectedNodeId,hoveredNodeId,editorDocumentHtml])

  const persistProject=async(current:BuilderProject)=>{
    await saveProject(current)
    if(onCloudSave)await onCloudSave(current)
  }

  useEffect(()=>{
    if(saveStatus!=='dirty')return
    const timer=window.setTimeout(async()=>{
      setSaveStatus('saving')
      try{await persistProject(project);setSaveStatus('saved')}catch{setSaveStatus('error')}
    },1100)
    return()=>window.clearTimeout(timer)
  },[project,saveStatus,setSaveStatus,onCloudSave])

  useEffect(()=>{
    const handler=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement
      if(['INPUT','TEXTAREA','SELECT'].includes(target.tagName)||target.isContentEditable)return
      const mod=event.metaKey||event.ctrlKey
      if(mod&&event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?redo():undo();return}
      if(mod&&event.key.toLowerCase()==='c'&&selectedNode){event.preventDefault();copiedNodeRef.current=clone(selectedNode);return}
      if(mod&&event.key.toLowerCase()==='d'&&selectedNodeId){event.preventDefault();duplicateNode(selectedNodeId);return}
      if(mod&&event.key.toLowerCase()==='v'&&copiedNodeRef.current){
        event.preventDefault()
        const parent=selectedNodeId?findParent(activePage.root,selectedNodeId):activePage.root
        const copy=regenerateNodeIds(copiedNodeRef.current,'paste')
        addNode(parent?.id||activePage.root.id,copy)
        return
      }
      if((event.key==='Delete'||event.key==='Backspace')&&selectedNodeId&&selectedNodeId!==activePage.root.id){event.preventDefault();deleteNode(selectedNodeId);return}
      if(event.key==='Escape'){if(preview)setPreview(false);setContext(null)}
    }
    window.addEventListener('keydown',handler)
    return()=>window.removeEventListener('keydown',handler)
  },[selectedNode,selectedNodeId,activePage,preview,undo,redo,duplicateNode,addNode,deleteNode])

  const manualSave=async()=>{
    setSaveStatus('saving')
    try{
      await persistProject(project)
      setSaveStatus('saved')
      return true
    }catch(error:any){
      setSaveStatus('error')
      alert(error?.message||'Project could not be saved.')
      return false
    }
  }

  const dropTarget=(overId:string)=>resolveDropTarget(activePage.root,overId)

  const onDragStart=(event:DragStartEvent)=>{
    setDragging(true)
    const data=event.active.data.current
    setDragLabel(data?.type||data?.nodeId||'Element')
  }

  const onDragEnd=(event:DragEndEvent)=>{
    setDragging(false);setDragLabel('')
    if(!event.over)return
    const active=event.active.data.current
    const target=dropTarget(String(event.over.id))
    if(active?.kind==='new-element'){
      addNode(target.parentId,createElement(active.type),target.index)
      setLeftTab('navigator')
    }else if(active?.kind==='new-section'){
      addNode(target.parentId,createPrebuiltSection(active.type),target.index)
      setLeftTab('navigator')
    }else if(active?.kind==='node'){
      if(active.nodeId===target.parentId)return
      moveNode(active.nodeId,target.parentId,target.index)
    }
  }

  const publish=async()=>{
    const saved=await manualSave()
    if(!saved)return
    if(!onPublish){
      alert('Project saved locally. Connect a publishing provider to publish this site.')
      return
    }
    try{
      const result=await onPublish(project)
      alert(result?.store_url?`Published successfully: ${result.store_url}`:'Published successfully.')
    }catch(error:any){
      alert(error?.message||'Publishing failed. Your saved project was not lost.')
    }
  }

  const breakpoints:[BreakpointId,string,React.ComponentType<{size?:number}>][]=[
    ['desktop','Desktop 1440',Monitor],
    ['tablet','Tablet 991',Tablet],
    ['mobileLandscape','Mobile L 767',Smartphone],
    ['mobilePortrait','Mobile P 478',Smartphone],
  ]

  if(preview)return <div className="vb-preview-mode"><div className="vb-preview-bar"><span>{project.name} · {activePage.name}</span><button onClick={()=>setPreview(false)}>Exit preview <X size={14}/></button></div><iframe ref={iframeRef} title="CoBest preview" sandbox="allow-scripts allow-forms allow-popups" srcDoc={previewDocumentHtml} className="vb-preview-frame"/></div>

  return <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
    <div className="vb-shell">
      <header className="vb-topbar">
        <div className="vb-project"><div className="vb-brand">C</div><div><small>COBEST DESIGNER</small><input value={project.name} onChange={e=>renameProject(e.target.value)} aria-label="Project name"/></div></div>
        <div className="vb-page-picker"><span>Page</span><select className="vb-page-switcher" value={activePage.id} onChange={e=>setActivePage(e.target.value)}>{project.pages.map(page=><option value={page.id} key={page.id}>{page.name}</option>)}</select></div>
        <div className="vb-breakpoints">{breakpoints.map(([id,labelText,Icon])=><button key={id} title={labelText} className={breakpoint===id?'active':''} onClick={()=>setBreakpoint(id)}><Icon size={15}/><span>{id==='mobileLandscape'?'Landscape':id==='mobilePortrait'?'Portrait':labelText.split(' ')[0]}</span></button>)}</div>
        <div className="vb-top-actions">
          <button className="vb-toolbar-icon" disabled={!history.length} onClick={undo} title="Undo" aria-label="Undo"><Undo2 size={16}/></button>
          <button className="vb-toolbar-icon" disabled={!future.length} onClick={redo} title="Redo" aria-label="Redo"><Redo2 size={16}/></button>
          <div className="vb-zoom"><button onClick={()=>setZoom(z=>Math.max(35,z-5))}><ZoomOut size={13}/></button><span>{zoom}%</span><button onClick={()=>setZoom(z=>Math.min(125,z+5))}><ZoomIn size={13}/></button></div>
          <span className={'vb-save-status '+saveStatus}>{saveStatus==='saving'?'Saving…':saveStatus==='error'?'Save failed':saveStatus==='dirty'?'Unsaved':'Saved'}</span>
          <button className="vb-toolbar-icon" onClick={()=>setVersionsOpen(x=>!x)} title="Version history" aria-label="Version history"><FolderOpen size={15}/></button>
          <button className="vb-toolbar-icon" onClick={()=>{setRightTab('settings');selectNode(selectedNodeId||activePage.root.id)}} title="Settings" aria-label="Settings"><Settings2 size={15}/></button>
          <button className="vb-preview-action" onClick={()=>setPreview(true)}><Eye size={15}/> Preview</button>
          <button onClick={()=>setExportOpen(true)}><Code2 size={15}/> Export</button>
          <button className="vb-save-action" onClick={manualSave}><Save size={15}/> Save</button>
          <button className="vb-publish" onClick={publish}>Publish</button>
        </div>
        {versionsOpen&&<VersionPopover onClose={()=>setVersionsOpen(false)}/>}
      </header>
      <div className="vb-workspace">
        <aside className="vb-left">
          <div className="vb-left-tabs">
            {([
              ['add',PanelLeft,'Add'],['navigator',Layers,'Navigator'],['pages',FileJson,'Pages'],
              ['templates',Sparkles,'Templates'],['assets',ImageIcon,'Assets'],['components',Component,'Components'],['cms',Database,'CMS'],
            ] as [LeftTab,any,string][]).map(([id,Icon,labelText])=><button key={id} title={labelText} className={leftTab===id?'active':''} data-label={labelText} aria-label={labelText} onClick={()=>setLeftTab(id)}><Icon size={16}/></button>)}
          </div>
          <div className="vb-left-content"><LeftPanel tab={leftTab}/></div>
        </aside>
        <main className="vb-stage">
          <div className="vb-stage-meta"><span>{activePage.name}</span><strong>{breakpointLabels[breakpoint]}</strong><em>{activePage.slug}</em></div>
          <CanvasDropZone dragging={dragging}>
            <div className="vb-canvas-scaler" style={{width:frameWidth*scale,height:canvasHeight*scale}}>
              <div className="vb-canvas-zoom" style={{width:frameWidth,transform:`scale(${scale})`,transformOrigin:'top left'}}>
                <div className="vb-canvas-wrap" style={{width:frameWidth,height:canvasHeight}}>
                  <iframe ref={iframeRef} title="CoBest visual builder canvas" sandbox="allow-scripts allow-forms allow-popups" srcDoc={editorDocumentHtml} className="vb-canvas" style={{height:canvasHeight,pointerEvents:dragging?'none':'auto'}} onLoad={()=>{
                    iframeRef.current?.contentWindow?.postMessage({source:'cobest-editor',type:'selection',selected:selectedNodeId,hovered:hoveredNodeId},'*')
                  }}/>
                </div>
              </div>
            </div>
          </CanvasDropZone>
        </main>
        <aside className="vb-right">
          <div className="vb-right-tabs">{(['style','settings','interactions'] as RightTab[]).map(id=><button key={id} title={id[0].toUpperCase()+id.slice(1)} className={rightTab===id?'active':''} onClick={()=>setRightTab(id)}>{id}</button>)}</div>
          <div className="vb-right-content"><RightPanel tab={rightTab}/></div>
        </aside>
      </div>
      {context&&<ContextMenu {...context} onClose={()=>setContext(null)}/>}
      {exportOpen&&<ExportModal onClose={()=>setExportOpen(false)}/>}
    </div>
    <DragOverlay>{dragging?<div className="vb-drag-overlay">{dragLabel}</div>:null}</DragOverlay>
  </DndContext>
}
