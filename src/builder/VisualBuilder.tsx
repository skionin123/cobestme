import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor, TouchSensor,
  useDroppable, useSensor, useSensors
} from '@dnd-kit/core'
import {
  ArrowLeft, ChevronDown, Code2, Component, Database, Download, Eye, FileJson, FolderOpen, Image as ImageIcon,
  History, Layers, LayoutTemplate, Monitor, PackageOpen, PanelLeft, Redo2, Save, Settings2, Smartphone, Tablet, Undo2,
  RotateCcw, Sparkles, Upload, X, ZoomIn, ZoomOut
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createCanvasDocument } from './canvas'
import { SectionChooser } from './SectionChooser'
import { createDefaultProject } from './defaultProject'
import { applyNodeGeometry } from './geometry'
import { reviewWebsiteLaunch, type LaunchIssue } from './launchReview'
import { duplicateWithIndependentGeometry } from './duplicate'
import { editorShortcutFor, type EditorShortcut } from './shortcuts'
import { downloadProjectJson, downloadProjectZip, importProjectJson } from './export'
import { chooseLatestProject, loadProject, saveProject } from './persistence'
import { createSaveQueue } from './saveQueue'
import {
  AddPanel, AssetsPanel, CmsPanel, ComponentsPanel, InteractionsPanel, NavigatorPanel,
  PagesPanel, SettingsPanel, StylePanel, TemplatesPanel, createElement, createPrebuiltSection
} from './panels'
import { useBuilderStore } from './store'
import { canAcceptChild, clone, findNode, findParent } from './tree'
import type { BreakpointId, BuilderNode, BuilderProject, StyleMap } from './types'
import './editor-tailwind.css'
import './visual-builder.css'

const widths:Record<BreakpointId,number>={desktop:1440,tablet:991,mobileLandscape:767,mobilePortrait:478}
const breakpointLabels:Record<BreakpointId,string>={desktop:'Desktop 1440',tablet:'Tablet 991',mobileLandscape:'Mobile landscape 767',mobilePortrait:'Mobile portrait 478'}
const viewportHeights:Record<BreakpointId,number>={desktop:900,tablet:760,mobileLandscape:430,mobilePortrait:844}
const SIDEBAR_WIDTH_KEY='cobest-designer-navigator-width'
const SIDEBAR_DEFAULT_WIDTH=320
const SIDEBAR_MIN_WIDTH=230
const sidebarWidthLimit=(viewport:number)=>{
  const right=viewport>940?(viewport<=1180?258:viewport<=1500?282:294):0
  const canvasSpace=viewport<=940?300:Math.max(400,viewport*.38)
  return Math.min(520,Math.max(SIDEBAR_MIN_WIDTH,viewport-right-canvasSpace))
}


type LeftTab='add'|'navigator'|'pages'|'templates'|'assets'|'components'|'cms'
type RightTab='style'|'settings'|'interactions'

function CanvasDropZone({
  children,dragging,nativePayload,iframeRef,scale,onNativeDropEnd,
}:{
  children:React.ReactNode
  dragging:boolean
  nativePayload:any|null
  iframeRef:React.RefObject<HTMLIFrameElement>
  scale:number
  onNativeDropEnd:()=>void
}){
  const {setNodeRef,isOver}=useDroppable({id:'canvas-root',data:{kind:'canvas-root'}})
  const relay=(type:'external-drag-over'|'external-drop'|'external-drag-leave',event?:React.DragEvent<HTMLDivElement>)=>{
    const win=iframeRef.current?.contentWindow
    if(!win)return
    if(type==='external-drag-leave'){
      win.postMessage({source:'cobest-editor',type},'*')
      return
    }
    const rect=iframeRef.current?.getBoundingClientRect()
    if(!rect||!event)return
    const x=(event.clientX-rect.left)/Math.max(scale,.01)
    const y=(event.clientY-rect.top)/Math.max(scale,.01)
    if(x<0||y<0||x>rect.width/Math.max(scale,.01)||y>rect.height/Math.max(scale,.01)){
      win.postMessage({source:'cobest-editor',type:'external-drag-leave'},'*')
      return
    }
    win.postMessage({source:'cobest-editor',type,x,y,payload:nativePayload},'*')
  }
  return <div ref={setNodeRef} className={'vb-canvas-drop '+(isOver?'is-over':'')} data-dragging={dragging?'true':'false'}>
    {children}
    {nativePayload&&<div
      className="vb-native-drop-overlay"
      aria-hidden="true"
      onDragOver={event=>{event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='copy';relay('external-drag-over',event)}}
      onDragLeave={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))relay('external-drag-leave')}}
      onDrop={event=>{event.preventDefault();event.stopPropagation();relay('external-drop',event);onNativeDropEnd()}}
    />}
    {dragging&&<div className={'vb-canvas-drop-label '+(isOver?'active':'')}>Drop to page</div>}
  </div>
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
  return <div className="vb-version-popover absolute right-3 top-12 z-[80] w-80 rounded-xl border border-zinc-700 bg-zinc-900 p-2 shadow-2xl" role="dialog" aria-label="Saved design versions">
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

type ContextMenuProps={
  x:number;y:number;nodeId:string;onClose:()=>void
  onSettings:()=>void;onStyle:()=>void;onNavigator:()=>void
  onCopy:()=>void;onPaste:()=>void;canPaste:boolean
}
function ContextMenu({x,y,nodeId,onClose,onSettings,onStyle,onNavigator,onCopy,onPaste,canPaste}:ContextMenuProps){
  const project=useBuilderStore(s=>s.project)
  const selectNode=useBuilderStore(s=>s.selectNode)
  const duplicate=useBuilderStore(s=>s.duplicateNode)
  const remove=useBuilderStore(s=>s.deleteNode)
  const ref=useRef<HTMLDivElement>(null)
  const page=project.pages.find(p=>p.id===project.activePageId)||project.pages[0]
  const node=findNode(page.root,nodeId)
  const parent=node?findParent(page.root,nodeId):null
  const editable=!!node&&nodeId!==page.root.id&&!node.locked
  useEffect(()=>{
    const onPointer=(event:MouseEvent)=>{
      if(ref.current&&!ref.current.contains(event.target as Node))onClose()
    }
    const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();onClose()}}
    document.addEventListener('pointerdown',onPointer)
    document.addEventListener('keydown',onKey)
    return()=>{document.removeEventListener('pointerdown',onPointer);document.removeEventListener('keydown',onKey)}
  },[onClose])
  if(!node)return null
  const option=(label:string,act:()=>void,{disabled=false,danger=false}:{disabled?:boolean;danger?:boolean}={})=>
    <button key={label} role="menuitem" type="button" disabled={disabled}
      className={'vb-context-option '+(danger?'danger':'')}
      onClick={()=>{act();onClose()}}>{label}</button>
  return <div ref={ref} role="menu" aria-label={'Element actions for '+node.name}
    className="vb-context-menu" style={{left:x,top:y}} onContextMenu={event=>event.preventDefault()}>
    <div className="vb-context-title"><span>{node.name}</span><small>{node.type}</small></div>
    {option(node.type==='image'?'Replace image / Settings':'Edit element settings',onSettings)}
    {option('Edit style',onStyle)}
    {option('Show in Navigator',onNavigator)}
    {parent&&option('Select parent: '+parent.name,()=>selectNode(parent.id))}
    <div className="vb-context-separator"/>
    {option('Copy element  ·  Ctrl+C',onCopy,{disabled:!editable})}
    {option('Paste element  ·  Ctrl+V',onPaste,{disabled:!canPaste})}
    {option('Duplicate  ·  Ctrl+D',()=>duplicate(nodeId),{disabled:!editable})}
    <div className="vb-context-separator"/>
    {option('Delete element  ·  Delete',()=>remove(nodeId),{disabled:!editable,danger:true})}
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
  onBack?:()=>void
}

export default function VisualBuilder({projectKey='local-default',initialProject=null,onCloudSave,onPublish,onBack}:VisualBuilderProps){
  const iframeRef=useRef<HTMLIFrameElement>(null)
  const stageRef=useRef<HTMLElement>(null)
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
  const [mobilePanel,setMobilePanel]=useState<'add'|'navigator'|'style'|null>(null)
  const [sidebarWidth,setSidebarWidth]=useState(()=>{
    try{
      const saved=Number(window.localStorage.getItem(SIDEBAR_WIDTH_KEY))
      return Number.isFinite(saved)&&saved>=SIDEBAR_MIN_WIDTH&&saved<=520?saved:SIDEBAR_DEFAULT_WIDTH
    }catch{return SIDEBAR_DEFAULT_WIDTH}
  })
  const [viewportWidth,setViewportWidth]=useState(()=>typeof window==='undefined'?1440:window.innerWidth)
  const [sidebarDragging,setSidebarDragging]=useState(false)
  const sidebarDragRef=useRef<{pointerId:number;x:number;width:number}|null>(null)
  const maxSidebarWidth=sidebarWidthLimit(viewportWidth)
  const activeSidebarWidth=Math.min(sidebarWidth,maxSidebarWidth)
  const resizeSidebar=(width:number)=>setSidebarWidth(Math.round(Math.max(SIDEBAR_MIN_WIDTH,Math.min(maxSidebarWidth,width))))
  const onSidebarPointerDown=(event:React.PointerEvent<HTMLDivElement>)=>{
    if(event.button!==0)return
    event.preventDefault()
    event.stopPropagation()
    sidebarDragRef.current={pointerId:event.pointerId,x:event.clientX,width:activeSidebarWidth}
    event.currentTarget.setPointerCapture(event.pointerId)
    setSidebarDragging(true)
  }
  const onSidebarPointerMove=(event:React.PointerEvent<HTMLDivElement>)=>{
    const drag=sidebarDragRef.current
    if(!drag||drag.pointerId!==event.pointerId)return
    resizeSidebar(drag.width+event.clientX-drag.x)
  }
  const onSidebarPointerEnd=(event:React.PointerEvent<HTMLDivElement>)=>{
    if(sidebarDragRef.current?.pointerId!==event.pointerId)return
    sidebarDragRef.current=null
    setSidebarDragging(false)
    if(event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const onSidebarKeyDown=(event:React.KeyboardEvent<HTMLDivElement>)=>{
    if(event.key==='Home'){event.preventDefault();resizeSidebar(SIDEBAR_DEFAULT_WIDTH);return}
    if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return
    event.preventDefault()
    resizeSidebar(activeSidebarWidth+(event.key==='ArrowRight'?1:-1)*(event.shiftKey?40:20))
  }
  const [rightTab,setRightTab]=useState<RightTab>('style')
  const [preview,setPreview]=useState(false)
  const [zoomMode,setZoomMode]=useState<'fit'|'actual'>('fit')
  const [snappingEnabled,setSnappingEnabled]=useState(()=>{
    try{return window.localStorage.getItem('cobest-designer-snap')!=='off'}catch{return true}
  })
  const [stageWidth,setStageWidth]=useState(0)
  const [canvasHeight,setCanvasHeight]=useState(viewportHeights.desktop)
  const [dragLabel,setDragLabel]=useState('')
  const [dragging,setDragging]=useState(false)
  const [nativeDragPayload,setNativeDragPayload]=useState<any|null>(null)
  const [sectionInsert,setSectionInsert]=useState<{targetId:string;mode:'before'|'after'}|null>(null)
  const [versionsOpen,setVersionsOpen]=useState(false)
  const [exportOpen,setExportOpen]=useState(false)
  const [context,setContext]=useState<{x:number;y:number;nodeId:string}|null>(null)
  const [publishNotice,setPublishNotice]=useState<{url?:string;message:string;error?:boolean}|null>(null)
  const [publishing,setPublishing]=useState(false)
  const [launchReviewOpen,setLaunchReviewOpen]=useState(false)
  const copiedNodeRef=useRef<{node:BuilderNode;styles:StyleMap}|null>(null)
  const saveQueueRef=useRef(createSaveQueue())

  const sensors=useSensors(
    useSensor(PointerSensor,{activationConstraint:{distance:6}}),
    useSensor(TouchSensor,{activationConstraint:{delay:180,tolerance:8}}),
    useSensor(KeyboardSensor)
  )
  const activePage=project.pages.find(p=>p.id===project.activePageId)||project.pages[0]
  const launchIssues=useMemo(()=>reviewWebsiteLaunch(project),[project])
  const launchBlockers=launchIssues.filter(issue=>issue.level==='blocker')
  const selectedNode=findNode(activePage.root,selectedNodeId)
  const selectionPath:BuilderNode[]=[]
  if(selectedNode){
    let pointer:BuilderNode|null=selectedNode
    while(pointer){
      selectionPath.unshift(pointer)
      pointer=findParent(activePage.root,pointer.id)
    }
  }
  const executeShortcut=(action:EditorShortcut)=>{
    const state=useBuilderStore.getState()
    const page=state.project.pages.find(p=>p.id===state.project.activePageId)||state.project.pages[0]
    const selected=page&&findNode(page.root,state.selectedNodeId)
    const editable=selected&&selected.id!==page.root.id&&!selected.locked
    if(action==='undo'){state.undo();return}
    if(action==='redo'){state.redo();return}
    if(action==='save'){void manualSave();return}
    if(action==='escape'){
      setContext(null)
      if(preview)setPreview(false)
      else state.selectNode(null)
      return
    }
    if(action==='copy'){
      if(editable)copiedNodeRef.current={node:clone(selected),styles:clone(state.project.styles)}
      return
    }
    if(action==='duplicate'){
      if(editable)state.duplicateNode(selected.id)
      return
    }
    if(action==='delete'){
      if(editable)state.deleteNode(selected.id)
      return
    }
    if(action==='paste'){
      const clipboard=copiedNodeRef.current
      if(!clipboard||!page)return
      const parent=(selected&&findParent(page.root,selected.id))||page.root
      if(!canAcceptChild(parent,clipboard.node))return
      const {node,styles}=duplicateWithIndependentGeometry(clipboard.node,clipboard.styles,'paste')
      const insertion=selected?parent.children.findIndex(child=>child.id===selected.id)+1:undefined
      state.mutate('Paste element',draft=>{
        const current=draft.pages.find(p=>p.id===draft.activePageId)||draft.pages[0]
        const draftParent=findNode(current.root,parent.id)
        if(!draftParent)return
        draftParent.children.splice(insertion==null?draftParent.children.length:insertion,0,node)
        Object.assign(draft.styles,styles)
      })
      useBuilderStore.getState().selectNode(node.id)
      return
    }
    if(action.startsWith('nudge-')&&editable){
      const large=action.endsWith('-large')
      const key=action.replace('-large','')
      const step=large?10:1
      const xChange=key==='nudge-left'?-step:key==='nudge-right'?step:0
      const yChange=key==='nudge-up'?-step:key==='nudge-down'?step:0
      const custom='cb-geometry-'+selected.id.replace(/[^a-zA-Z0-9_-]/g,'-')
      const style=state.project.styles[custom]
      const value=style?.[state.breakpoint]?.none?.translate
        ||style?.desktop?.none?.translate||'0px 0px'
      const coordinates=value.split(/\\s+/)
      const x=parseFloat(coordinates[0])||0
      const y=parseFloat(coordinates[1])||0
      state.mutate('Nudge element',draft=>{
        applyNodeGeometry(draft,selected.id,state.breakpoint,{
          kind:'move',x:x+xChange,y:y+yChange,
        })
      })
    }
  }

  const editorDocumentHtml=useMemo(()=>createCanvasDocument(project,breakpoint,true),[project,breakpoint])
  const previewDocumentHtml=useMemo(()=>createCanvasDocument(project,breakpoint,false),[project,breakpoint])
  const frameWidth=Math.min(widths[breakpoint],1440)
  const scale=zoomMode==='fit'&&stageWidth>0
    ?Math.min(1,Math.max(.3,(stageWidth-42)/frameWidth))
    :1
  const zoom=Math.round(scale*100)

  useEffect(()=>{
    if(window.innerWidth<=680)setBreakpoint('mobilePortrait')
  },[])

  useEffect(()=>{
    const onResize=()=>setViewportWidth(window.innerWidth)
    window.addEventListener('resize',onResize)
    return()=>window.removeEventListener('resize',onResize)
  },[])
  useEffect(()=>{
    try{window.localStorage.setItem(SIDEBAR_WIDTH_KEY,String(sidebarWidth))}catch{}
  },[sidebarWidth])
  useEffect(()=>{
    document.documentElement.classList.toggle('vb-sidebar-resizing',sidebarDragging)
    return()=>document.documentElement.classList.remove('vb-sidebar-resizing')
  },[sidebarDragging])

  useEffect(()=>{
    const stage=stageRef.current
    if(!stage)return
    const measure=()=>setStageWidth(stage.clientWidth)
    measure()
    const observer=new ResizeObserver(measure)
    observer.observe(stage)
    return()=>observer.disconnect()
  },[])

  useEffect(()=>{
    // Selecting a deeply nested node introduces a breadcrumb. Recalculate fit
    // after that layout change rather than retaining the previous stage width.
    setStageWidth(stageRef.current?.clientWidth||0)
  },[selectedNodeId,breakpoint])

  useEffect(()=>{
    setCanvasHeight(viewportHeights[breakpoint])
  },[breakpoint,activePage.id])

  useEffect(()=>{
    let alive=true
    const hydrate=async()=>{
      const cloudProject=initialProject?.pages?.length
        ? {...clone(initialProject),id:projectKey||initialProject.id}
        : null
      let localProject:BuilderProject|undefined
      try{localProject=await loadProject(projectKey)}catch{}
      if(!alive)return
      const {project:recovered,needsCloudSync}=chooseLatestProject(localProject,cloudProject)
      if(recovered){
        replaceProject(recovered,false)
        // A newer local revision must not be reported as cloud-saved.
        if(needsCloudSync)setSaveStatus('dirty')
        try{await saveProject(recovered)}catch{}
      }else{
        const seeded={...clone(useBuilderStore.getState().project),id:projectKey}
        replaceProject(seeded,false)
        try{await saveProject(seeded)}catch{}
      }
    }
    hydrate()
    return()=>{alive=false}
  },[projectKey])

  useEffect(()=>{
    const handler=(event:MessageEvent)=>{
      const msg=event.data||{}
      if(msg.source!=='cobest-builder')return
      if(event.source!==iframeRef.current?.contentWindow)return
      if(msg.type==='history-shortcut'&&['undo','redo'].includes(msg.action)){
        executeShortcut(msg.action)
        return
      }
      if(msg.type==='editor-shortcut'&&typeof msg.action==='string'){
        const allowed=['undo','redo','copy','paste','duplicate','delete','save','escape',
          'nudge-left','nudge-right','nudge-up','nudge-down',
          'nudge-left-large','nudge-right-large','nudge-up-large','nudge-down-large']
        if(allowed.includes(msg.action))executeShortcut(msg.action as EditorShortcut)
        return
      }
      if(msg.type==='select'){
        selectNode(msg.id||null)
        if(msg.id){
          const active=useBuilderStore.getState().project
          const page=active.pages.find(item=>item.id===active.activePageId)||active.pages[0]
          const node=page?findNode(page.root,String(msg.id)):null
          if(node&&['heading','paragraph','richText','button','link','quote','image'].includes(node.type)){
            // Beginner-first: selecting real content opens its content controls.
            // Desktop keeps the inspector visible, phone opens its editing drawer.
            setRightTab('style')
            if(window.innerWidth<=680)setMobilePanel('style')
          }
        }
      }
      if(msg.type==='section-insert-request'&&typeof msg.targetId==='string'&&
         ['before','after'].includes(msg.mode)){
        const latest=useBuilderStore.getState().project
        const page=latest.pages.find(item=>item.id===latest.activePageId)||latest.pages[0]
        // An on-canvas insertion is always adjacent to a top-level page section.
        if(page?.root.children.some(node=>node.id===msg.targetId&&node.type==='section'))
          setSectionInsert({targetId:msg.targetId,mode:msg.mode})
        return
      }
      if(msg.type==='hover')hoverNode(msg.id||null)
      if(msg.type==='text-change'&&msg.id)updateNode(msg.id,{content:String(msg.content||'')})
      if(msg.type==='canvas-resize'&&Number(msg.height)){
        const next=Math.max(viewportHeights[breakpoint],Math.ceil(Number(msg.height)))
        setCanvasHeight(next)
      }
      if(msg.type==='canvas-drop'&&msg.payload&&msg.targetId&&msg.mode){
        const store=useBuilderStore.getState()
        const page=store.project.pages.find(p=>p.id===store.project.activePageId)||store.project.pages[0]
        const payload=msg.payload
        let overId=`${msg.mode}:${msg.targetId}`
        if(payload.kind==='new-section'&&msg.targetId!==page.root.id){
          let topId=String(msg.targetId)
          let parent=findParent(page.root,topId)
          while(parent&&parent.id!==page.root.id){topId=parent.id;parent=findParent(page.root,topId)}
          overId=`${msg.mode==='before'?'before':'after'}:${topId}`
        }
        const target=resolveDropTarget(page.root,overId)
        if(payload.kind==='new-element')store.addNode(target.parentId,createElement(payload.type),target.index)
        else if(payload.kind==='new-section')store.addNode(target.parentId,createPrebuiltSection(payload.type),target.index)
        else if(payload.kind==='node'&&payload.nodeId&&payload.nodeId!==target.parentId)store.moveNode(payload.nodeId,target.parentId,target.index)
      }
      if(msg.type==='node-geometry'&&msg.id&&['move','resize','font-size','reset'].includes(msg.kind)){
        const state=useBuilderStore.getState()
        const page=state.project.pages.find(p=>p.id===state.project.activePageId)||state.project.pages[0]
        if(page&&msg.id!==page.root.id&&findNode(page.root,msg.id)){
          state.mutate(msg.kind==='move'?'Move element':msg.kind==='resize'?'Resize element':msg.kind==='reset'?'Reset element geometry':'Resize text',draft=>{
            applyNodeGeometry(draft,String(msg.id),state.breakpoint,msg)
          })
        }
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
        // The iframe is scaled to Fit. Client coordinates from inside it are
        // unscaled CSS pixels, so map them to the outer viewport first.
        const ratio=rect?rect.width/widths[breakpoint]:1
        const x=(rect?.left||0)+Number(msg.x||0)*ratio
        const y=(rect?.top||0)+Number(msg.y||0)*ratio
        setContext({nodeId:msg.id,
          x:Math.min(Math.max(6,x),Math.max(6,window.innerWidth-254)),
          y:Math.min(Math.max(6,y),Math.max(6,window.innerHeight-347))})
        selectNode(msg.id)
      }
    }
    window.addEventListener('message',handler)
    return()=>window.removeEventListener('message',handler)
  },[selectNode,hoverNode,updateNode,addClass,setStyle,breakpoint])

  useEffect(()=>{
    iframeRef.current?.contentWindow?.postMessage({source:'cobest-editor',type:'selection',selected:selectedNodeId,hovered:hoveredNodeId},'*')
  },[selectedNodeId,hoveredNodeId,editorDocumentHtml])
  useEffect(()=>{
    try{window.localStorage.setItem('cobest-designer-snap',snappingEnabled?'on':'off')}catch{}
    iframeRef.current?.contentWindow?.postMessage({source:'cobest-editor',type:'snapping',enabled:snappingEnabled},'*')
  },[snappingEnabled,editorDocumentHtml])

  const persistProject=async(current:BuilderProject)=>{
    await saveProject(current)
    if(onCloudSave)await onCloudSave(current)
  }

  const queuedPersist=(current:BuilderProject)=>saveQueueRef.current(()=>persistProject(current))

  const finishSave=(current:BuilderProject,status:'saved'|'error')=>{
    const latest=useBuilderStore.getState().project
    if(latest.id===current.id&&latest.version===current.version)setSaveStatus(status)
  }

  useEffect(()=>{
    if(saveStatus!=='dirty')return
    const snapshot=clone(project)
    const timer=window.setTimeout(async()=>{
      setSaveStatus('saving')
      try{await queuedPersist(snapshot);finishSave(snapshot,'saved')}catch{finishSave(snapshot,'error')}
    },1100)
    return()=>window.clearTimeout(timer)
  },[project,saveStatus,setSaveStatus,onCloudSave])

  useEffect(()=>{
    const handler=(event:KeyboardEvent)=>{
      const element=event.target as HTMLElement|null
      const typing=Boolean(element?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(element?.tagName||''))
      const action=editorShortcutFor(event,typing)
      if(!action)return
      // Browser clipboard and page commands should work normally when there is
      // no selected node or no copied design element.
      const state=useBuilderStore.getState()
      const page=state.project.pages.find(p=>p.id===state.project.activePageId)||state.project.pages[0]
      const node=page&&findNode(page.root,state.selectedNodeId)
      if(['copy','duplicate','delete','nudge-left','nudge-right','nudge-up','nudge-down',
          'nudge-left-large','nudge-right-large','nudge-up-large','nudge-down-large'].includes(action)
          &&(!node||node.id===page.root.id||node.locked))return
      if(action==='paste'&&!copiedNodeRef.current)return
      event.preventDefault()
      executeShortcut(action)
    }
    window.addEventListener('keydown',handler)
    return()=>window.removeEventListener('keydown',handler)
  })


  const manualSave=async()=>{
    // Keyboard events forwarded from the iframe may reach a listener created
    // before the latest render. Always persist the latest committed revision.
    const snapshot=clone(useBuilderStore.getState().project)
    setSaveStatus('saving')
    try{
      await queuedPersist(snapshot)
      finishSave(snapshot,'saved')
      return true
    }catch(error:any){
      finishSave(snapshot,'error')
      alert(error?.message||'Project could not be saved.')
      return false
    }
  }

  const insertAtCanvas= (sectionType:string)=>{
    const request=sectionInsert
    if(!request)return
    const state=useBuilderStore.getState()
    const page=state.project.pages.find(item=>item.id===state.project.activePageId)||state.project.pages[0]
    const index=page?.root.children.findIndex(node=>node.id===request.targetId)??-1
    if(index<0||!page)return
    const insertIndex=index+(request.mode==='after'?1:0)
    // A section must remain in the page tree; the existing store records Undo.
    state.addNode(page.root.id,createPrebuiltSection(sectionType),insertIndex)
    setSectionInsert(null)
  }

  const startOver=()=>{
    if(!window.confirm('Start over with the CoBest starter design? This replaces all your draft pages and edits. Your published website stays unchanged until you publish again. You can Undo to restore this draft.'))return
    const current=useBuilderStore.getState().project
    const starter=createDefaultProject()
    // Preserve the merchant site identity and name; replace the DESIGN only.
    const next={...starter,id:current.id,name:current.name}
    replaceProject(next,true,'Start over with starter design')
    selectNode(starter.pages[0].root.id)
    // Keep the canvas usable after reset on a real phone.
    setBreakpoint(window.innerWidth<=680?'mobilePortrait':'desktop')
    setLeftTab('add')
    setMobilePanel(null)
    setPreview(false)
    setPublishNotice(null)
  }

  const returnToDashboard=async()=>{
    if(!onBack)return
    if(saveStatus!=='saved'){
      const saved=await manualSave()
      if(!saved)return
    }
    onBack()
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
      if(window.innerWidth<=680)setMobilePanel(null)
    }else if(active?.kind==='new-section'){
      addNode(target.parentId,createPrebuiltSection(active.type),target.index)
      setLeftTab('navigator')
      if(window.innerWidth<=680)setMobilePanel(null)
    }else if(active?.kind==='node'){
      if(active.nodeId===target.parentId)return
      moveNode(active.nodeId,target.parentId,target.index)
    }
  }

  const openLaunchIssue=(issue:LaunchIssue)=>{
    if(issue.pageId)setActivePage(issue.pageId)
    if(issue.nodeId)selectNode(issue.nodeId)
    if(issue.tab==='settings')setRightTab('settings')
    if(issue.tab==='pages')setLeftTab('pages')
    setLaunchReviewOpen(false)
  }

  const publish=async()=>{
    if(publishing||launchBlockers.length)return
    setLaunchReviewOpen(false)
    setPublishNotice(null)
    setPublishing(true)
    try{
      const saved=await manualSave()
      if(!saved)return
      if(!onPublish)throw new Error('Publishing is not available for this website.')
      const result=await onPublish(clone(useBuilderStore.getState().project))
      if(!result?.ok||!result?.store_url)throw new Error('The live website was not confirmed. Please try again.')
      setPublishNotice({message:'Website published successfully.',url:new URL(result.store_url,window.location.origin).href})
    }catch(error:any){
      setPublishNotice({error:true,message:error?.message||'Publishing failed. Your saved design is safe.'})
    }finally{setPublishing(false)}
  }

  const breakpoints:[BreakpointId,string,LucideIcon][]=[
    ['desktop','Desktop 1440',Monitor],
    ['tablet','Tablet 991',Tablet],
    ['mobileLandscape','Mobile landscape 767',Smartphone],
    ['mobilePortrait','Mobile 478',Smartphone],
  ]

  const beginNativeDrag=(event:React.DragEvent<HTMLDivElement>)=>{
    let raw=''
    try{raw=event.dataTransfer.getData('application/x-cobest-builder')||event.dataTransfer.getData('text/plain')||''}catch{}
    if(raw.startsWith('cobest:'))raw=raw.slice(7)
    try{
      const payload=raw?JSON.parse(raw):null
      if(payload?.kind==='new-element'||payload?.kind==='new-section'){
        setNativeDragPayload(payload)
        setDragLabel(payload.type||'Element')
      }
    }catch{}
  }
  const endNativeDrag=()=>{
    setNativeDragPayload(null)
    iframeRef.current?.contentWindow?.postMessage({source:'cobest-editor',type:'external-drag-leave'},'*')
  }

  if(preview)return <div className="vb-preview-mode"><div className="vb-preview-bar"><span>{project.name} · {activePage.name} · {breakpointLabels[breakpoint]} × {viewportHeights[breakpoint]}</span><button onClick={()=>setPreview(false)}>Exit preview <X size={14}/></button></div><div className="vb-preview-stage"><iframe ref={iframeRef} title="CoBest preview" sandbox="allow-scripts allow-forms allow-popups" srcDoc={previewDocumentHtml} className="vb-preview-frame" style={{width:frameWidth,height:viewportHeights[breakpoint]}}/></div></div>

  return <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={()=>{setDragging(false);setDragLabel('')}}>
    <div className="vb-shell" data-mobile-panel={mobilePanel||'none'} onDragStart={beginNativeDrag} onDragEnd={endNativeDrag}>
      <header className="vb-topbar">
        <div className="vb-project">
          {onBack&&<button type="button" className="vb-back-dashboard" title="Back to dashboard" aria-label="Back to dashboard" onClick={returnToDashboard}>
            <ArrowLeft size={16}/><span>Dashboard</span>
          </button>}
          <div className="vb-project-copy"><small>COBEST DESIGNER</small><input value={project.name} onChange={e=>renameProject(e.target.value)} aria-label="Project name"/></div>
        </div>
        <div className="vb-page-picker"><span>Page</span><select className="vb-page-switcher" value={activePage.id} onChange={e=>setActivePage(e.target.value)}>{project.pages.map(page=><option value={page.id} key={page.id}>{page.name}</option>)}</select></div>
        <div className="vb-breakpoints">{breakpoints.map(([id,labelText,Icon])=><button key={id} title={labelText} className={breakpoint===id?'active':''} onClick={()=>setBreakpoint(id)}><Icon size={15}/><span>{id==='mobileLandscape'?'Landscape':id==='mobilePortrait'?'Portrait':labelText.split(' ')[0]}</span></button>)}</div>
        <div className="vb-top-actions">
          <button className="vb-toolbar-icon vb-undo-action" disabled={!history.length} onClick={undo} title="Undo last change (Ctrl+Z)" aria-label="Undo"><Undo2 size={16}/><span>Undo</span></button>
          <button className="vb-toolbar-icon vb-redo-action" disabled={!future.length} onClick={redo} title="Redo (Ctrl+Y / Ctrl+Shift+Z)" aria-label="Redo"><Redo2 size={16}/><span>Redo</span></button>
          <button className="vb-start-over-action" onClick={startOver} aria-label="Start over with starter design" title="Replace draft with starter design (reversible)"><RotateCcw size={15}/><span>Start over</span></button>
          <button type="button" className="vb-history-action" aria-label="Version history" aria-expanded={versionsOpen} onClick={()=>setVersionsOpen(open=>!open)}
            title="Restore an earlier draft"><History size={16}/><span>History</span></button>
          <span className={'vb-save-status '+saveStatus}>{saveStatus==='saving'?'Saving…':saveStatus==='error'?'Error saving':saveStatus==='dirty'?'Unsaved':'Saved'}</span>
          <button className="vb-preview-action" onClick={()=>setPreview(true)}><Eye size={15}/> Preview</button>
          <button onClick={()=>setExportOpen(true)}><Code2 size={15}/> Export</button>
          <button className="vb-save-action" onClick={manualSave}><Save size={15}/> Save</button>
          {onPublish&&<button className="vb-publish" onClick={()=>setLaunchReviewOpen(true)} disabled={publishing}>{publishing?'Publishing…':'Publish'}</button>}
        </div>
        {versionsOpen&&<VersionPopover onClose={()=>setVersionsOpen(false)}/>}
      </header>
      <div className="vb-workspace" style={{'--vb-left-width':activeSidebarWidth+'px'} as React.CSSProperties}>
        <aside className={'vb-left '+(mobilePanel==='add'||mobilePanel==='navigator'?'vb-mobile-open':'')}>
          <div className={'vb-sidebar-resizer '+(sidebarDragging?'is-dragging':'')}
            role="separator" aria-orientation="vertical" aria-label="Resize Navigator sidebar"
            aria-valuemin={SIDEBAR_MIN_WIDTH} aria-valuemax={Math.round(maxSidebarWidth)}
            aria-valuenow={activeSidebarWidth} tabIndex={0}
            title="Drag to widen Navigator · Double-click to reset"
            onPointerDown={onSidebarPointerDown} onPointerMove={onSidebarPointerMove}
            onPointerUp={onSidebarPointerEnd} onPointerCancel={onSidebarPointerEnd}
            onLostPointerCapture={()=>{sidebarDragRef.current=null;setSidebarDragging(false)}}
            onDoubleClick={()=>resizeSidebar(SIDEBAR_DEFAULT_WIDTH)}
            onKeyDown={onSidebarKeyDown}>
            <span className="vb-sidebar-grip" aria-hidden="true"/>
          </div>
          <div className="vb-left-tabs">
            <button className="vb-mobile-close" title="Close editing panel" aria-label="Close editing panel" onClick={()=>setMobilePanel(null)}><X size={17}/></button>
            {([
              ['add',PanelLeft,'Add'],['templates',LayoutTemplate,'Themes'],['navigator',Layers,'Navigator'],['pages',FileJson,'Pages'],['assets',ImageIcon,'Assets'],
            ] as [LeftTab,any,string][]).map(([id,Icon,labelText])=><button key={id} title={labelText} className={leftTab===id?'active':''} data-label={labelText} aria-label={labelText} onClick={()=>setLeftTab(id)}><Icon size={16}/></button>)}
          </div>
          <div className="vb-left-content"><LeftPanel tab={leftTab}/></div>
        </aside>
        <main className="vb-stage" ref={stageRef}>
          <div className="vb-stage-meta">
            <div className="vb-stage-crumb"><span>{activePage.name}</span><strong>{breakpointLabels[breakpoint]}</strong></div>
            <div className="vb-stage-view" aria-label="Canvas zoom controls">
              <button type="button" className={zoomMode==='fit'?'active':''} onClick={()=>setZoomMode('fit')} aria-label="Fit canvas to workspace">Fit</button>
              <span data-testid="canvas-zoom">{zoom}%</span>
              <button type="button" className={zoomMode==='actual'?'active':''} onClick={()=>setZoomMode('actual')} aria-label="Show canvas at actual size">100%</button>
              <button type="button" className={'vb-snap-toggle '+(snappingEnabled?'active':'')}
                aria-label="Toggle alignment snapping" title="Snap to 8px grid and nearby element edges (hold Alt while dragging to bypass)"
                aria-pressed={snappingEnabled} onClick={()=>setSnappingEnabled(enabled=>!enabled)}>
                Snap {snappingEnabled?'On':'Off'}
              </button>
            </div>
          </div>
          {selectionPath.length>0&&<nav className="vb-selection-path" aria-label="Selected element hierarchy">
            <span className="vb-selection-caption">Selected</span>
            {selectionPath.map((node,index)=><React.Fragment key={node.id}>
              {index>0&&<span className="vb-selection-separator">›</span>}
              <button type="button" className={selectedNodeId===node.id?'active':''}
                aria-label={'Select '+node.name} aria-current={selectedNodeId===node.id?'true':undefined}
                onClick={()=>selectNode(node.id)} title={'Select '+node.name}>{node.name}</button>
            </React.Fragment>)}
          </nav>}
          <CanvasDropZone dragging={dragging||!!nativeDragPayload} nativePayload={nativeDragPayload} iframeRef={iframeRef} scale={scale} onNativeDropEnd={endNativeDrag}>
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
        <aside className={'vb-right '+(mobilePanel==='style'?'vb-mobile-open':'')}>
          <div className="vb-right-tabs"><button className="vb-mobile-close" aria-label="Close style panel" onClick={()=>setMobilePanel(null)}><X size={17}/></button>{([['style','Style'],['settings','Settings']] as [RightTab,string][]).map(([id,label])=><button key={id} title={label} aria-label={label} className={rightTab===id?'active':''} onClick={()=>setRightTab(id)}>{label}</button>)}</div>
          <div className="vb-right-content"><RightPanel tab={rightTab}/></div>
        </aside>
      </div>
      <nav className="vb-mobile-actions" aria-label="Phone website editing tools">
        <button type="button" aria-label="Phone Add elements" className={mobilePanel==='add'?'active':''} aria-pressed={mobilePanel==='add'} onClick={()=>{setLeftTab('add');setMobilePanel(mobilePanel==='add'?null:'add')}}><PanelLeft size={18}/> Add</button>
        <button type="button" aria-label="Phone Layers" className={mobilePanel==='navigator'?'active':''} aria-pressed={mobilePanel==='navigator'} onClick={()=>{setLeftTab('navigator');setMobilePanel(mobilePanel==='navigator'?null:'navigator')}}><Layers size={18}/> Layers</button>
        <button type="button" aria-label="Phone Edit content" className={mobilePanel==='style'&&rightTab==='settings'?'active':''}
          aria-pressed={mobilePanel==='style'&&rightTab==='settings'} onClick={()=>{setRightTab('settings');setMobilePanel('style')}}><PanelLeft size={18}/> Content</button>
        <button type="button" aria-label="Phone Style" className={mobilePanel==='style'&&rightTab==='style'?'active':''} aria-pressed={mobilePanel==='style'&&rightTab==='style'} onClick={()=>{setRightTab('style');setMobilePanel('style')}}><Settings2 size={18}/> Style</button>
        <button type="button" aria-label="Phone Undo" disabled={!history.length} onClick={undo}><Undo2 size={18}/> Undo</button>
        <button type="button" aria-label="Phone Redo" disabled={!future.length} onClick={redo}><Redo2 size={18}/> Redo</button>
        <button type="button" aria-label="Phone Save" onClick={()=>void manualSave()}><Save size={18}/> Save</button>
      </nav>
      {mobilePanel&&<button type="button" className="vb-mobile-backdrop" aria-label="Close edit tools" onClick={()=>setMobilePanel(null)}/>}
      {launchReviewOpen&&<div className="vb-launch-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setLaunchReviewOpen(false)}}>
        <section className="vb-launch-dialog" role="dialog" aria-modal="true" aria-label="Website launch review">
          <header className="vb-launch-header">
            <div><span className="vb-launch-eyebrow">Before you go live</span>
              <h2>Review your website</h2>
              <p>Check your pages and important details before publishing.</p>
            </div>
            <button type="button" aria-label="Close launch review" onClick={()=>setLaunchReviewOpen(false)}><X size={18}/></button>
          </header>
          <div className="vb-launch-summary">
            <span><strong>{project.pages.length}</strong> pages</span>
            <span><strong>{launchIssues.filter(x=>x.level==='warning').length}</strong> suggestions</span>
            <span className={launchBlockers.length?'blocked':'ready'}><strong>{launchBlockers.length}</strong> blockers</span>
          </div>
          <div className="vb-search-preview" aria-label="Search preview">
            <small>Search preview · {activePage.name}</small>
            <strong>{activePage.seo.title||activePage.name}</strong>
            <span>{activePage.seo.description||'Add a page description so visitors know what this website offers.'}</span>
          </div>
          <div className="vb-launch-issues">
            {launchIssues.length===0&&<div className="vb-launch-clean">
              <strong>Your website passes the local design checklist.</strong>
              <p>Review the preview and test forms, checkout, domains and mobile devices before inviting customers.</p>
            </div>}
            {launchIssues.map(issue=><div key={issue.id} className={'vb-launch-issue '+issue.level}>
              <span className="vb-launch-status">{issue.level==='blocker'?'Fix required':'Suggestion'}</span>
              <div><strong>{issue.title}</strong><p>{issue.detail}</p></div>
              <button type="button" onClick={()=>openLaunchIssue(issue)}>Fix</button>
            </div>)}
          </div>
          <footer className="vb-launch-footer">
            <p>Publishing updates the public website. Drafts stay separate until you publish again. Verify mobile layout, forms, payments and domain settings manually before inviting customers.</p>
            <div>
              <button type="button" className="vb-launch-cancel"
                onClick={()=>{setBreakpoint('mobilePortrait');setLaunchReviewOpen(false);setPreview(true)}}>Preview mobile</button>
              <button type="button" className="vb-launch-cancel" onClick={()=>{setLaunchReviewOpen(false);setPreview(true)}}>Preview first</button>
              <button type="button" className="vb-launch-confirm" onClick={publish} disabled={publishing||!!launchBlockers.length}>
                {launchBlockers.length?'Fix blockers to publish':publishing?'Publishing…':'Confirm publish'}
              </button>
            </div>
          </footer>
        </section>
      </div>}
      {publishNotice&&<div className={'vb-publish-notice '+(publishNotice.error?'is-error':'')} role={publishNotice.error?'alert':'status'}>
        <strong>{publishNotice.message}</strong>
        {publishNotice.url&&<a href={publishNotice.url} target="_blank" rel="noopener noreferrer">Open live website ↗</a>}
        <button type="button" aria-label="Dismiss publishing notification" onClick={()=>setPublishNotice(null)}>×</button>
      </div>}
      {context&&<ContextMenu {...context} onClose={()=>setContext(null)}
        onSettings={()=>setRightTab('settings')} onStyle={()=>setRightTab('style')}
        onNavigator={()=>setLeftTab('navigator')}
        onCopy={()=>executeShortcut('copy')} onPaste={()=>executeShortcut('paste')}
        canPaste={Boolean(copiedNodeRef.current)}/>}

      {sectionInsert&&<SectionChooser placement={'Insert '+sectionInsert.mode+' selected section'} onInsert={insertAtCanvas} onClose={()=>setSectionInsert(null)}/>}
      {exportOpen&&<ExportModal onClose={()=>setExportOpen(false)}/>}
    </div>
    <DragOverlay>{dragging?<div className="vb-drag-overlay">{dragLabel}</div>:null}</DragOverlay>
  </DndContext>
}
