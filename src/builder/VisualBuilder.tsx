import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor,
  useDroppable, useSensor, useSensors
} from '@dnd-kit/core'
import {
  ArrowLeft, Check, ChevronDown, CircleAlert, Download, Eye, FileJson, History, Image as ImageIcon,
  Layers, Monitor, MoreHorizontal, Palette, Plus, Redo2, Rocket, Save, Smartphone, Tablet, Undo2,
  Upload, X, FileText, Sparkles
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createCanvasDocument } from './canvas'
import { applyNodeGeometry } from './geometry'
import { reviewWebsiteLaunch, type LaunchIssue } from './launchReview'
import { duplicateWithIndependentGeometry } from './duplicate'
import { editorShortcutFor, type EditorShortcut } from './shortcuts'
import { downloadProjectJson, downloadProjectZip, importProjectJson } from './export'
import { chooseLatestProject, loadProject, saveProject } from './persistence'
import { createSaveQueue } from './saveQueue'
import { createElement, createPrebuiltSection } from './elements'
import { EasyAddPanel, EasyInspector, EasyLayersPanel, EasyMediaPanel, EasyPagesPanel, EasyThemePanel } from './easyPanels'
import { activePage as pageOf, friendlyType, workflowProgress } from './editorModel'
import { useBuilderStore } from './store'
import { canAcceptChild, clone, findNode, findParent } from './tree'
import type { BreakpointId, BuilderNode, BuilderProject, StyleMap } from './types'
import './editor-tailwind.css'
import './visual-builder.css'
import './easy-editor.css'

const widths:Record<BreakpointId,number>={desktop:1440,tablet:991,mobileLandscape:767,mobilePortrait:390}
const viewportHeights:Record<BreakpointId,number>={desktop:900,tablet:760,mobileLandscape:430,mobilePortrait:844}
const deviceLabel:Record<BreakpointId,string>={desktop:'Desktop',tablet:'Tablet',mobileLandscape:'Mobile (landscape)',mobilePortrait:'Mobile'}
const GUIDE_KEY='cobest-editor-guide-hidden'
const PROGRESS_KEY='cobest-editor-progress'

type LeftTab='add'|'layers'|'pages'|'media'|'theme'

function readFlags(projectKey:string){
  try{const raw=JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}');return raw[projectKey]||{previewedMobile:false,published:false}}
  catch{return {previewedMobile:false,published:false}}
}
function writeFlags(projectKey:string,flags:{previewedMobile:boolean;published:boolean}){
  try{const raw=JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}');raw[projectKey]=flags;localStorage.setItem(PROGRESS_KEY,JSON.stringify(raw))}catch{}
}

function CanvasDropZone({children,dragging,nativePayload,iframeRef,scale,onNativeDropEnd}:{
  children:React.ReactNode;dragging:boolean;nativePayload:any|null
  iframeRef:React.RefObject<HTMLIFrameElement>;scale:number;onNativeDropEnd:()=>void
}){
  const {setNodeRef,isOver}=useDroppable({id:'canvas-root',data:{kind:'canvas-root'}})
  const relay=(type:'external-drag-over'|'external-drop'|'external-drag-leave',event?:React.DragEvent<HTMLDivElement>)=>{
    const win=iframeRef.current?.contentWindow
    if(!win)return
    if(type==='external-drag-leave'){win.postMessage({source:'cobest-editor',type},'*');return}
    const rect=iframeRef.current?.getBoundingClientRect()
    if(!rect||!event)return
    const s=Math.max(scale,.01)
    const x=(event.clientX-rect.left)/s,y=(event.clientY-rect.top)/s
    if(x<0||y<0||x>rect.width/s||y>rect.height/s){win.postMessage({source:'cobest-editor',type:'external-drag-leave'},'*');return}
    win.postMessage({source:'cobest-editor',type,x,y,payload:nativePayload},'*')
  }
  return <div ref={setNodeRef} className={'vb-canvas-drop ee-canvas-drop '+(isOver?'is-over':'')} data-dragging={dragging?'true':'false'}>
    {children}
    {nativePayload&&<div className="vb-native-drop-overlay" aria-hidden="true"
      onDragOver={event=>{event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='copy';relay('external-drag-over',event)}}
      onDragLeave={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))relay('external-drag-leave')}}
      onDrop={event=>{event.preventDefault();event.stopPropagation();relay('external-drop',event);onNativeDropEnd()}}/>}
    {dragging&&<div className={'vb-canvas-drop-label '+(isOver?'active':'')}>Drop on the page</div>}
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
  return <div className="ee-popover ee-versions" role="dialog" aria-label="Version history">
    <div className="ee-popover-head"><strong>Version history</strong><button type="button" aria-label="Close version history" onClick={onClose}><X size={15}/></button></div>
    <p className="ee-muted">The last {project.versions.length} changes. Restoring keeps your current design in Undo.</p>
    <div className="ee-version-list">{project.versions.length?project.versions.map(v=><button type="button" key={v.id}
      onClick={()=>{if(confirm('Restore the design from before “'+v.label+'”?')){restoreVersion(v.id);onClose()}}}>
      <strong>{v.label}</strong><small>{new Date(v.createdAt).toLocaleString()}</small></button>)
      :<p className="ee-muted">Versions appear as you edit.</p>}</div>
  </div>
}

function MoreMenu({onClose,onVersions}:{onClose:()=>void;onVersions:()=>void}){
  const project=useBuilderStore(s=>s.project)
  const importProject=useBuilderStore(s=>s.importProject)
  const fileRef=useRef<HTMLInputElement>(null)
  const ref=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    const down=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))onClose()}
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()}
    document.addEventListener('mousedown',down);document.addEventListener('keydown',key)
    return()=>{document.removeEventListener('mousedown',down);document.removeEventListener('keydown',key)}
  },[onClose])
  const importFile=async(file?:File)=>{
    if(!file)return
    try{
      if(file.size>15*1024*1024)throw new Error('This file is too large to import.')
      const imported=await importProjectJson(file)
      if(confirm(`Replace this website with “${imported.name}”? You can undo.`)){importProject(imported);onClose()}
    }catch(error:any){alert(error?.message||'This file could not be imported.')}
  }
  return <div ref={ref} className="ee-popover ee-more" role="menu" aria-label="More options">
    <button role="menuitem" type="button" onClick={()=>{onVersions();onClose()}}><History size={15}/> Version history</button>
    <button role="menuitem" type="button" onClick={()=>{downloadProjectZip(project);onClose()}}><Download size={15}/> Download website (ZIP)</button>
    <button role="menuitem" type="button" onClick={()=>{downloadProjectJson(project);onClose()}}><FileJson size={15}/> Download backup (JSON)</button>
    <button role="menuitem" type="button" onClick={()=>fileRef.current?.click()}><Upload size={15}/> Restore from backup…</button>
    <input ref={fileRef} hidden type="file" accept=".json,application/json" onChange={e=>void importFile(e.target.files?.[0])}/>
  </div>
}

type ContextMenuProps={x:number;y:number;nodeId:string;onClose:()=>void;onEdit:()=>void;onLayers:()=>void;onCopy:()=>void;onPaste:()=>void;canPaste:boolean}
function ContextMenu({x,y,nodeId,onClose,onEdit,onLayers,onCopy,onPaste,canPaste}:ContextMenuProps){
  const project=useBuilderStore(s=>s.project)
  const selectNode=useBuilderStore(s=>s.selectNode)
  const duplicate=useBuilderStore(s=>s.duplicateNode)
  const remove=useBuilderStore(s=>s.deleteNode)
  const ref=useRef<HTMLDivElement>(null)
  const page=pageOf(project)
  const node=findNode(page.root,nodeId)
  const parent=node?findParent(page.root,nodeId):null
  const editable=!!node&&nodeId!==page.root.id&&!node.locked
  useEffect(()=>{
    const onPointer=(event:MouseEvent)=>{if(ref.current&&!ref.current.contains(event.target as Node))onClose()}
    const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();onClose()}}
    document.addEventListener('pointerdown',onPointer);document.addEventListener('keydown',onKey)
    return()=>{document.removeEventListener('pointerdown',onPointer);document.removeEventListener('keydown',onKey)}
  },[onClose])
  if(!node)return null
  const option=(label:string,act:()=>void,{disabled=false,danger=false,hint=''}={})=>
    <button key={label} role="menuitem" type="button" disabled={disabled} className={'vb-context-option '+(danger?'danger':'')} onClick={()=>{act();onClose()}}>
      <span>{label}</span>{hint&&<kbd>{hint}</kbd>}</button>
  return <div ref={ref} role="menu" aria-label={'Element actions for '+node.name} className="vb-context-menu ee-context" style={{left:x,top:y}} onContextMenu={e=>e.preventDefault()}>
    <div className="vb-context-title"><span>{node.name}</span><small>{friendlyType[node.type]||node.type}</small></div>
    {option(node.type==='image'?'Replace image':'Edit',onEdit)}
    {option('Show in Layers',onLayers)}
    {parent&&parent.id!==page.root.id&&option('Select “'+parent.name+'”',()=>selectNode(parent.id))}
    <div className="vb-context-separator"/>
    {option('Copy',onCopy,{disabled:!editable,hint:'Ctrl C'})}
    {option('Paste',onPaste,{disabled:!canPaste,hint:'Ctrl V'})}
    {option('Duplicate',()=>duplicate(nodeId),{disabled:!editable,hint:'Ctrl D'})}
    <div className="vb-context-separator"/>
    {option('Delete',()=>remove(nodeId),{disabled:!editable,danger:true,hint:'Del'})}
  </div>
}

function GuideStrip({progress,onStep,onHide}:{progress:ReturnType<typeof workflowProgress>;onStep:(step:'structure'|'content'|'mobile'|'publish')=>void;onHide:()=>void}){
  const steps:[keyof typeof progress,string,string][]=[
    ['structure','Add sections','Build the page from ready-made sections'],
    ['content','Make it yours','Click text and images to replace them'],
    ['mobile','Check on mobile','See how phones show your website'],
    ['publish','Publish','Review and go live'],
  ]
  const next=steps.find(([id])=>!progress[id])?.[0]
  return <div className="ee-guide" role="region" aria-label="Website setup steps">
    <ol>{steps.map(([id,title,hint],i)=><li key={id} className={(progress[id]?'is-done ':'')+(next===id?'is-next':'')}>
      <button type="button" onClick={()=>onStep(id)} aria-label={'Step '+(i+1)+': '+title+(progress[id]?' (done)':'')}>
        <span className="ee-guide-num">{progress[id]?<Check size={12}/>:i+1}</span>
        <span><strong>{title}</strong><small>{hint}</small></span>
      </button>
    </li>)}</ol>
    <button type="button" className="ee-guide-hide" aria-label="Hide setup steps" onClick={onHide}><X size={14}/></button>
  </div>
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
  const moveNode=useBuilderStore(s=>s.moveNode)
  const addClass=useBuilderStore(s=>s.addClass)
  const setStyle=useBuilderStore(s=>s.setStyle)
  const setSelectedComputed=useBuilderStore(s=>s.setSelectedComputed)
  const undo=useBuilderStore(s=>s.undo)
  const redo=useBuilderStore(s=>s.redo)

  const [leftTab,setLeftTab]=useState<LeftTab>('add')
  const [leftOpen,setLeftOpen]=useState(true)
  const [preview,setPreview]=useState(false)
  const [zoomMode,setZoomMode]=useState<'fit'|'actual'>('fit')
  const [snappingEnabled,setSnappingEnabled]=useState(()=>{try{return localStorage.getItem('cobest-designer-snap')!=='off'}catch{return true}})
  const [guideHidden,setGuideHidden]=useState(()=>{try{return localStorage.getItem(GUIDE_KEY)==='1'}catch{return false}})
  const [flags,setFlags]=useState(()=>readFlags(projectKey))
  const [stageWidth,setStageWidth]=useState(0)
  const [canvasHeight,setCanvasHeight]=useState(viewportHeights.desktop)
  const [dragLabel,setDragLabel]=useState('')
  const [dragging,setDragging]=useState(false)
  const [nativeDragPayload,setNativeDragPayload]=useState<any|null>(null)
  const [versionsOpen,setVersionsOpen]=useState(false)
  const [moreOpen,setMoreOpen]=useState(false)
  const [pagesOpen,setPagesOpen]=useState(false)
  const [context,setContext]=useState<{x:number;y:number;nodeId:string}|null>(null)
  const [publishNotice,setPublishNotice]=useState<{url?:string;message:string;error?:boolean}|null>(null)
  const [publishing,setPublishing]=useState(false)
  const [launchReviewOpen,setLaunchReviewOpen]=useState(false)
  const [toast,setToast]=useState('')
  const copiedNodeRef=useRef<{node:BuilderNode;styles:StyleMap}|null>(null)
  const saveQueueRef=useRef(createSaveQueue())
  const revealRef=useRef<string|null>(null)

  const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:5}}),useSensor(KeyboardSensor))
  const activePage=pageOf(project)
  const launchIssues=useMemo(()=>reviewWebsiteLaunch(project),[project])
  const launchBlockers=launchIssues.filter(issue=>issue.level==='blocker')
  const progress=useMemo(()=>workflowProgress(project,flags),[project,flags])
  const selectedNode=findNode(activePage.root,selectedNodeId)
  const selectionPath:BuilderNode[]=[]
  if(selectedNode){
    let pointer:BuilderNode|null=selectedNode
    while(pointer){selectionPath.unshift(pointer);pointer=findParent(activePage.root,pointer.id)}
  }

  useEffect(()=>setFlags(readFlags(projectKey)),[projectKey])
  const markFlag=useCallback((key:'previewedMobile'|'published')=>{
    setFlags((prev:{previewedMobile:boolean;published:boolean})=>{if(prev[key])return prev;const next={...prev,[key]:true};writeFlags(projectKey,next);return next})
  },[projectKey])
  useEffect(()=>{if(preview&&breakpoint==='mobilePortrait')markFlag('previewedMobile')},[preview,breakpoint,markFlag])
  useEffect(()=>{if(!toast)return;const t=window.setTimeout(()=>setToast(''),2600);return()=>window.clearTimeout(t)},[toast])

  const executeShortcut=(action:EditorShortcut)=>{
    const state=useBuilderStore.getState()
    const page=pageOf(state.project)
    const selected=page&&findNode(page.root,state.selectedNodeId)
    const editable=selected&&selected.id!==page.root.id&&!selected.locked
    if(action==='undo'){state.undo();return}
    if(action==='redo'){state.redo();return}
    if(action==='save'){void manualSave();return}
    if(action==='escape'){setContext(null);if(preview)setPreview(false);else state.selectNode(null);return}
    if(action==='copy'){if(editable){copiedNodeRef.current={node:clone(selected),styles:clone(state.project.styles)};setToast('Copied “'+selected.name+'”')}return}
    if(action==='duplicate'){if(editable)state.duplicateNode(selected.id);return}
    if(action==='delete'){if(editable)state.deleteNode(selected.id);return}
    if(action==='paste'){
      const clipboard=copiedNodeRef.current
      if(!clipboard||!page)return
      const parent=(selected&&selected.id!==page.root.id&&findParent(page.root,selected.id))||page.root
      if(!canAcceptChild(parent,clipboard.node))return
      const {node,styles}=duplicateWithIndependentGeometry(clipboard.node,clipboard.styles,'paste')
      const insertion=selected&&selected.id!==page.root.id?parent.children.findIndex(child=>child.id===selected.id)+1:undefined
      state.mutate('Paste element',draft=>{
        const draftParent=findNode(pageOf(draft).root,parent.id)
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
      const value=style?.[state.breakpoint]?.none?.translate||style?.desktop?.none?.translate||'0px 0px'
      const coordinates=value.split(/\s+/)
      const x=parseFloat(coordinates[0])||0
      const y=parseFloat(coordinates[1])||0
      state.mutate('Nudge element',draft=>{applyNodeGeometry(draft,selected.id,state.breakpoint,{kind:'move',x:x+xChange,y:y+yChange})})
    }
  }

  const editorDocumentHtml=useMemo(()=>createCanvasDocument(project,breakpoint,true),[project,breakpoint])
  const previewDocumentHtml=useMemo(()=>createCanvasDocument(project,breakpoint,false),[project,breakpoint])
  const frameWidth=widths[breakpoint]
  const scale=zoomMode==='fit'&&stageWidth>0?Math.min(1,Math.max(.3,(stageWidth-48)/frameWidth)):1
  const zoom=Math.round(scale*100)

  // Measure before the first paint so the canvas never flashes at 100% before Fit.
  useLayoutEffect(()=>{
    const stage=stageRef.current
    if(!stage)return
    const measure=()=>setStageWidth(stage.clientWidth)
    measure()
    const observer=new ResizeObserver(measure)
    observer.observe(stage)
    return()=>observer.disconnect()
  },[preview])
  useEffect(()=>{setCanvasHeight(viewportHeights[breakpoint])},[breakpoint,activePage.id])

  // Load the newest copy: this browser's draft or the cloud version.
  useEffect(()=>{
    let alive=true
    const hydrate=async()=>{
      const cloudProject=initialProject?.pages?.length?{...clone(initialProject),id:projectKey||initialProject.id}:null
      let localProject:BuilderProject|undefined
      try{localProject=await loadProject(projectKey)}catch{}
      if(!alive)return
      const {project:recovered,needsCloudSync}=chooseLatestProject(localProject,cloudProject)
      if(recovered){
        replaceProject(recovered,false)
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

  // Messages from the sandboxed canvas.
  useEffect(()=>{
    const handler=(event:MessageEvent)=>{
      const msg=event.data||{}
      if(msg.source!=='cobest-builder')return
      if(event.source!==iframeRef.current?.contentWindow)return
      if(msg.type==='editor-shortcut'&&typeof msg.action==='string'){
        const allowed=['undo','redo','copy','paste','duplicate','delete','save','escape',
          'nudge-left','nudge-right','nudge-up','nudge-down','nudge-left-large','nudge-right-large','nudge-up-large','nudge-down-large']
        if(allowed.includes(msg.action))executeShortcut(msg.action as EditorShortcut)
        return
      }
      if(msg.type==='select')selectNode(msg.id||null)
      if(msg.type==='hover')hoverNode(msg.id||null)
      if(msg.type==='computed'&&msg.id&&msg.style&&typeof msg.style==='object'){
        const safe:Record<string,string>={}
        for(const [k,v] of Object.entries(msg.style))if(typeof v==='string'&&v.length<64)safe[k]=v
        setSelectedComputed(String(msg.id),safe)
      }
      if(msg.type==='reveal'&&Number.isFinite(Number(msg.top))){
        const stage=stageRef.current
        if(stage){
          const top=Number(msg.top)*scale
          const bottom=top+Number(msg.height||0)*scale
          const view=stage.scrollTop,viewBottom=view+stage.clientHeight
          if(top<view+40||bottom>viewBottom-40)stage.scrollTo({top:Math.max(0,top-120),behavior:'smooth'})
        }
      }
      if(msg.type==='text-change'&&msg.id)updateNode(msg.id,{content:String(msg.content||'')})
      if(msg.type==='canvas-resize'&&Number(msg.height))setCanvasHeight(Math.max(viewportHeights[breakpoint],Math.ceil(Number(msg.height))))
      if(msg.type==='canvas-drop'&&msg.payload&&msg.targetId&&msg.mode){
        const store=useBuilderStore.getState()
        const page=pageOf(store.project)
        const payload=msg.payload
        let overId=`${msg.mode}:${msg.targetId}`
        if(payload.kind==='new-section'&&msg.targetId!==page.root.id){
          let topId=String(msg.targetId)
          let parent=findParent(page.root,topId)
          while(parent&&parent.id!==page.root.id){topId=parent.id;parent=findParent(page.root,topId)}
          overId=`${msg.mode==='before'?'before':'after'}:${topId}`
        }
        const target=resolveDropTarget(page.root,overId)
        if(payload.kind==='new-element'&&typeof payload.type==='string')store.addNode(target.parentId,createElement(payload.type),target.index)
        else if(payload.kind==='new-section'&&typeof payload.type==='string')store.addNode(target.parentId,createPrebuiltSection(payload.type),target.index)
        else if(payload.kind==='node'&&payload.nodeId&&payload.nodeId!==target.parentId)store.moveNode(payload.nodeId,target.parentId,target.index)
      }
      if(msg.type==='node-geometry'&&msg.id&&['move','resize','font-size','reset'].includes(msg.kind)){
        const state=useBuilderStore.getState()
        const page=pageOf(state.project)
        if(page&&msg.id!==page.root.id&&findNode(page.root,msg.id)){
          state.mutate(msg.kind==='move'?'Move element':msg.kind==='resize'?'Resize element':msg.kind==='reset'?'Reset element position':'Resize text',draft=>{
            applyNodeGeometry(draft,String(msg.id),state.breakpoint,msg)
          })
        }
      }
      if(msg.type==='spacing-change'&&msg.id&&msg.property){
        const page=pageOf(useBuilderStore.getState().project)
        const node=findNode(page.root,msg.id)
        if(node&&/^(padding|margin)(Top|Right|Bottom|Left)$/.test(String(msg.property))){
          let className=node.classes.at(-1)
          if(!className){className='el-'+msg.id.replace(/[^a-zA-Z0-9_-]/g,'-');addClass(node.id,className)}
          setStyle(className,String(msg.property),String(msg.value))
        }
      }
      if(msg.type==='context'&&msg.id){
        const rect=iframeRef.current?.getBoundingClientRect()
        const ratio=rect?rect.width/widths[breakpoint]:1
        const x=(rect?.left||0)+Number(msg.x||0)*ratio
        const y=(rect?.top||0)+Number(msg.y||0)*ratio
        setContext({nodeId:msg.id,x:Math.min(Math.max(6,x),Math.max(6,window.innerWidth-244)),y:Math.min(Math.max(6,y),Math.max(6,window.innerHeight-330))})
        selectNode(msg.id)
      }
    }
    window.addEventListener('message',handler)
    return()=>window.removeEventListener('message',handler)
  },[selectNode,hoverNode,updateNode,addClass,setStyle,setSelectedComputed,breakpoint,scale])

  // Keep the canvas selection in sync; scroll new or picked elements into view.
  useEffect(()=>{
    const reveal=revealRef.current!==selectedNodeId
    revealRef.current=selectedNodeId
    iframeRef.current?.contentWindow?.postMessage({source:'cobest-editor',type:'selection',selected:selectedNodeId,hovered:hoveredNodeId,reveal},'*')
  },[selectedNodeId,hoveredNodeId,editorDocumentHtml])
  useEffect(()=>{
    try{localStorage.setItem('cobest-designer-snap',snappingEnabled?'on':'off')}catch{}
    iframeRef.current?.contentWindow?.postMessage({source:'cobest-editor',type:'snapping',enabled:snappingEnabled},'*')
  },[snappingEnabled,editorDocumentHtml])

  // Full version history stays in this browser. The cloud copy keeps only the
  // latest few snapshots so saves stay small and fast (and under server limits).
  const persistProject=async(current:BuilderProject)=>{
    await saveProject(current)
    if(onCloudSave)await onCloudSave({...current,versions:(current.versions||[]).slice(0,3)})
  }
  const queuedPersist=(current:BuilderProject)=>saveQueueRef.current(()=>persistProject(current))
  const finishSave=(current:BuilderProject,status:'saved'|'error')=>{
    const latest=useBuilderStore.getState().project
    if(latest.id===current.id&&latest.version===current.version)setSaveStatus(status)
  }

  // Autosave shortly after the last change.
  useEffect(()=>{
    if(saveStatus!=='dirty')return
    const snapshot=clone(project)
    const timer=window.setTimeout(async()=>{
      setSaveStatus('saving')
      try{await queuedPersist(snapshot);finishSave(snapshot,'saved')}catch{finishSave(snapshot,'error')}
    },1100)
    return()=>window.clearTimeout(timer)
  },[project,saveStatus,setSaveStatus,onCloudSave])

  // Warn before closing the tab with unsaved changes.
  useEffect(()=>{
    const handler=(event:BeforeUnloadEvent)=>{
      const status=useBuilderStore.getState().saveStatus
      if(status==='saved')return
      event.preventDefault();event.returnValue=''
    }
    window.addEventListener('beforeunload',handler)
    return()=>window.removeEventListener('beforeunload',handler)
  },[])

  useEffect(()=>{
    const handler=(event:KeyboardEvent)=>{
      const element=event.target as HTMLElement|null
      const typing=Boolean(element?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(element?.tagName||''))
      const action=editorShortcutFor(event,typing)
      if(!action)return
      const state=useBuilderStore.getState()
      const page=pageOf(state.project)
      const node=page&&findNode(page.root,state.selectedNodeId)
      if(['copy','duplicate','delete','nudge-left','nudge-right','nudge-up','nudge-down','nudge-left-large','nudge-right-large','nudge-up-large','nudge-down-large'].includes(action)
        &&(!node||node.id===page.root.id||node.locked))return
      if(action==='paste'&&!copiedNodeRef.current)return
      event.preventDefault()
      executeShortcut(action)
    }
    window.addEventListener('keydown',handler)
    return()=>window.removeEventListener('keydown',handler)
  })

  const manualSave=async()=>{
    const snapshot=clone(useBuilderStore.getState().project)
    setSaveStatus('saving')
    try{await queuedPersist(snapshot);finishSave(snapshot,'saved');return true}
    catch(error:any){finishSave(snapshot,'error');setToast(error?.message||'Your changes could not be saved. Check your connection and try again.');return false}
  }

  const returnToDashboard=async()=>{
    if(!onBack)return
    if(useBuilderStore.getState().saveStatus!=='saved'){
      const saved=await manualSave()
      if(!saved&&!confirm('Your latest changes could not be saved to the cloud. Leave anyway? (They stay saved in this browser.)'))return
    }
    onBack()
  }

  const onDragStart=(event:DragStartEvent)=>{
    setDragging(true)
    const data=event.active.data.current
    setDragLabel(data?.type||'Element')
  }
  const onDragEnd=(event:DragEndEvent)=>{
    setDragging(false);setDragLabel('')
    if(!event.over)return
    const active=event.active.data.current
    const target=resolveDropTarget(activePage.root,String(event.over.id))
    if(active?.kind==='node'){
      if(active.nodeId===target.parentId)return
      moveNode(active.nodeId,target.parentId,target.index)
    }else if(active?.kind==='new-element'){
      addNode(target.parentId,createElement(active.type),target.index)
    }else if(active?.kind==='new-section'){
      addNode(target.parentId,createPrebuiltSection(active.type),target.index)
    }
  }

  const openLaunchIssue=(issue:LaunchIssue)=>{
    if(issue.pageId)setActivePage(issue.pageId)
    if(issue.nodeId){selectNode(issue.nodeId);window.setTimeout(()=>window.dispatchEvent(new CustomEvent('cobest-inspector-tab',{detail:'content'})),0)}
    else if(issue.tab==='pages'){setLeftTab('pages');setLeftOpen(true)}
    setLaunchReviewOpen(false)
  }

  const publish=async()=>{
    if(publishing||launchBlockers.length)return
    setLaunchReviewOpen(false);setPublishNotice(null);setPublishing(true)
    try{
      const saved=await manualSave()
      if(!saved)throw new Error('Your changes could not be saved, so nothing was published. Please try again.')
      if(!onPublish)throw new Error('Publishing is available after you sign in and open this website from your dashboard.')
      const result=await onPublish(clone(useBuilderStore.getState().project))
      if(!result?.ok||!result?.store_url)throw new Error('The live website was not confirmed. Please try again.')
      markFlag('published')
      setPublishNotice({message:'Your website is live.',url:new URL(result.store_url,window.location.origin).href})
    }catch(error:any){
      setPublishNotice({error:true,message:error?.message||'Publishing failed. Your saved design is safe.'})
    }finally{setPublishing(false)}
  }

  const onGuideStep=(step:'structure'|'content'|'mobile'|'publish')=>{
    if(step==='structure'){setLeftTab('add');setLeftOpen(true)}
    if(step==='content'){
      // Jump to the first piece of text that still needs editing.
      let first:BuilderNode|null=null
      const walk=(n:BuilderNode)=>{if(first)return;if(['heading','paragraph','button'].includes(n.type))first=n;n.children.forEach(walk)}
      walk(activePage.root)
      if(first)selectNode((first as BuilderNode).id)
    }
    if(step==='mobile'){setBreakpoint('mobilePortrait');setPreview(true)}
    if(step==='publish')setLaunchReviewOpen(true)
  }

  const beginNativeDrag=(event:React.DragEvent<HTMLDivElement>)=>{
    let raw=''
    try{raw=event.dataTransfer.getData('application/x-cobest-builder')||event.dataTransfer.getData('text/plain')||''}catch{}
    if(raw.startsWith('cobest:'))raw=raw.slice(7)
    try{
      const payload=raw?JSON.parse(raw):null
      if(payload?.kind==='new-element'||payload?.kind==='new-section'){setNativeDragPayload(payload);setDragLabel(payload.type||'Element')}
    }catch{}
  }
  const endNativeDrag=()=>{
    setNativeDragPayload(null)
    iframeRef.current?.contentWindow?.postMessage({source:'cobest-editor',type:'external-drag-leave'},'*')
  }

  const devices:[BreakpointId,string,LucideIcon][]=[['desktop','Desktop',Monitor],['tablet','Tablet',Tablet],['mobilePortrait','Mobile',Smartphone]]
  const statusText=saveStatus==='saving'?'Saving…':saveStatus==='error'?'Not saved':saveStatus==='dirty'?'Unsaved':'Saved'

  if(preview)return <div className="ee-preview" role="dialog" aria-label="Website preview">
    <div className="ee-preview-bar">
      <span className="ee-preview-title"><Eye size={15}/> Preview · {activePage.name}</span>
      <div className="ee-devices" role="group" aria-label="Preview device">{devices.map(([id,label,Icon])=>
        <button key={id} type="button" aria-pressed={breakpoint===id} onClick={()=>setBreakpoint(id)} title={label}><Icon size={15}/><span>{label}</span></button>)}</div>
      <div className="ee-preview-actions">
        <select className="ee-input ee-compact" aria-label="Preview page" value={activePage.id} onChange={e=>setActivePage(e.target.value)}>
          {project.pages.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <button type="button" className="ee-btn ee-btn-dark" onClick={()=>setPreview(false)}>Exit preview <X size={14}/></button>
      </div>
    </div>
    <div className="ee-preview-stage"><iframe ref={iframeRef} title="CoBest preview" sandbox="allow-scripts allow-forms allow-popups"
      srcDoc={previewDocumentHtml} className={'ee-preview-frame '+(breakpoint!=='desktop'?'is-device':'')} style={{width:frameWidth,height:breakpoint==='desktop'?'100%':viewportHeights[breakpoint]}}/></div>
  </div>

  const leftTabs:[LeftTab,string,LucideIcon][]=[['add','Add',Plus],['layers','Layers',Layers],['pages','Pages',FileText],['media','Media',ImageIcon],['theme','Theme',Palette]]

  return <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={()=>{setDragging(false);setDragLabel('')}}>
    <div className="ee-shell" onDragStart={beginNativeDrag} onDragEnd={endNativeDrag}>
      <header className="ee-topbar">
        <div className="ee-top-left">
          {onBack&&<button type="button" className="ee-icon-btn" title="Back to dashboard" aria-label="Back to dashboard" onClick={returnToDashboard}><ArrowLeft size={17}/></button>}
          <div className="ee-site">
            <input value={project.name} onChange={e=>renameProject(e.target.value)} aria-label="Website name" maxLength={80}/>
            <div className="ee-page-picker">
              <button type="button" className="ee-page-button" aria-haspopup="listbox" aria-expanded={pagesOpen} onClick={()=>setPagesOpen(o=>!o)}>
                <FileText size={13}/> {activePage.name}<ChevronDown size={13}/></button>
              {pagesOpen&&<div className="ee-popover ee-page-menu" role="listbox" aria-label="Pages" onMouseLeave={()=>setPagesOpen(false)}>
                {project.pages.map(p=><button key={p.id} role="option" aria-selected={p.id===activePage.id} type="button" onClick={()=>{setActivePage(p.id);setPagesOpen(false)}}>
                  <span>{p.name}</span><small>{p.slug}</small></button>)}
                <button type="button" className="ee-page-manage" onClick={()=>{setLeftTab('pages');setLeftOpen(true);setPagesOpen(false)}}><Plus size={13}/> Add or manage pages</button>
              </div>}
            </div>
          </div>
        </div>
        <div className="ee-devices" role="group" aria-label="Edit for device">
          {devices.map(([id,label,Icon])=><button key={id} type="button" aria-pressed={breakpoint===id} title={'Edit for '+label} onClick={()=>setBreakpoint(id)}><Icon size={15}/><span>{label}</span></button>)}
        </div>
        <div className="ee-top-right">
          <button type="button" className="ee-icon-btn" disabled={!history.length} onClick={undo} title="Undo (Ctrl+Z)" aria-label="Undo"><Undo2 size={16}/></button>
          <button type="button" className="ee-icon-btn" disabled={!future.length} onClick={redo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><Redo2 size={16}/></button>
          <span className={'vb-save-status ee-save '+saveStatus} role="status" aria-live="polite">{statusText}</span>
          <button type="button" className="ee-btn ee-btn-ghost" onClick={manualSave} aria-label="Save"><Save size={15}/><span>Save</span></button>
          <div className="ee-more-wrap">
            <button type="button" className="ee-icon-btn" aria-label="More options" aria-expanded={moreOpen} onClick={()=>setMoreOpen(o=>!o)}><MoreHorizontal size={17}/></button>
            {moreOpen&&<MoreMenu onClose={()=>setMoreOpen(false)} onVersions={()=>setVersionsOpen(true)}/>}
            {versionsOpen&&<VersionPopover onClose={()=>setVersionsOpen(false)}/>}
          </div>
          <button type="button" className="ee-btn ee-btn-ghost" onClick={()=>setPreview(true)} aria-label="Preview"><Eye size={15}/><span>Preview</span></button>
          {onPublish&&<button type="button" className="ee-btn ee-btn-primary vb-publish" onClick={()=>setLaunchReviewOpen(true)} disabled={publishing}>
            <Rocket size={15}/>{publishing?'Publishing…':'Publish'}</button>}
        </div>
      </header>
      {!guideHidden&&<GuideStrip progress={progress} onStep={onGuideStep} onHide={()=>{setGuideHidden(true);try{localStorage.setItem(GUIDE_KEY,'1')}catch{}}}/>}
      <div className={'ee-workspace '+(leftOpen?'':'left-collapsed')}>
        <nav className="ee-rail" aria-label="Editor panels">
          {leftTabs.map(([id,label,Icon])=><button key={id} type="button" aria-label={label} aria-pressed={leftOpen&&leftTab===id} title={label}
            onClick={()=>{if(leftOpen&&leftTab===id)setLeftOpen(false);else{setLeftTab(id);setLeftOpen(true)}}}><Icon size={18}/><span>{label}</span></button>)}
          {guideHidden&&<button type="button" className="ee-rail-help" aria-label="Show setup steps" title="Show setup steps" onClick={()=>{setGuideHidden(false);try{localStorage.removeItem(GUIDE_KEY)}catch{}}}><Sparkles size={17}/><span>Steps</span></button>}
        </nav>
        {leftOpen&&<aside className="ee-left" aria-label={leftTab+' panel'}>
          {leftTab==='add'&&<EasyAddPanel/>}
          {leftTab==='layers'&&<EasyLayersPanel/>}
          {leftTab==='pages'&&<EasyPagesPanel/>}
          {leftTab==='media'&&<EasyMediaPanel/>}
          {leftTab==='theme'&&<EasyThemePanel/>}
        </aside>}
        <main className="ee-stage" ref={stageRef} onMouseDown={e=>{if(e.target===e.currentTarget)selectNode(null)}}>
          <CanvasDropZone dragging={dragging||!!nativeDragPayload} nativePayload={nativeDragPayload} iframeRef={iframeRef} scale={scale} onNativeDropEnd={endNativeDrag}>
            <div className={'ee-device-frame '+(breakpoint==='desktop'?'':'is-device')} style={{width:frameWidth*scale}}>
              <div className="ee-device-label">{deviceLabel[breakpoint]} · {frameWidth}px{breakpoint!=='desktop'&&' · changes apply to this size and smaller'}</div>
              <div className="vb-canvas-scaler" style={{width:frameWidth*scale,height:canvasHeight*scale}}>
                <div className="vb-canvas-zoom" style={{width:frameWidth,transform:`scale(${scale})`,transformOrigin:'top left'}}>
                  <div className="vb-canvas-wrap" style={{width:frameWidth,height:canvasHeight}}>
                    <iframe ref={iframeRef} title="CoBest visual builder canvas" sandbox="allow-scripts allow-forms allow-popups" srcDoc={editorDocumentHtml}
                      className="vb-canvas" style={{height:canvasHeight,pointerEvents:dragging?'none':'auto'}} onLoad={()=>{
                        iframeRef.current?.contentWindow?.postMessage({source:'cobest-editor',type:'snapping',enabled:snappingEnabled},'*')
                        iframeRef.current?.contentWindow?.postMessage({source:'cobest-editor',type:'selection',selected:selectedNodeId,hovered:hoveredNodeId},'*')
                      }}/>
                  </div>
                </div>
              </div>
            </div>
          </CanvasDropZone>
        </main>
        <aside className="ee-right" aria-label="Edit selected element"><EasyInspector onCopy={()=>executeShortcut('copy')}/></aside>
      </div>
      <footer className="ee-statusbar">
        <nav className="ee-crumbs" aria-label="Selected element hierarchy">
          {selectionPath.length?selectionPath.map((node,index)=><React.Fragment key={node.id}>
            {index>0&&<span aria-hidden="true">›</span>}
            <button type="button" className={selectedNodeId===node.id?'active':''} aria-label={'Select '+node.name}
              aria-current={selectedNodeId===node.id?'true':undefined} onClick={()=>selectNode(node.id)}>{index===0?'Page':node.name}</button>
          </React.Fragment>):<span className="ee-muted">Nothing selected · click an element on the page</span>}
        </nav>
        <div className="ee-zoom" aria-label="Canvas zoom controls">
          <button type="button" className={'vb-snap-toggle '+(snappingEnabled?'active':'')} aria-label="Toggle alignment snapping"
            title="Snap to grid and nearby edges while dragging (hold Alt to bypass)" aria-pressed={snappingEnabled} onClick={()=>setSnappingEnabled(v=>!v)}>Snap {snappingEnabled?'on':'off'}</button>
          <button type="button" className={zoomMode==='fit'?'active':''} onClick={()=>setZoomMode('fit')} aria-label="Fit canvas to workspace">Fit</button>
          <span data-testid="canvas-zoom">{zoom}%</span>
          <button type="button" className={zoomMode==='actual'?'active':''} onClick={()=>setZoomMode('actual')} aria-label="Show canvas at actual size">100%</button>
        </div>
      </footer>

      {launchReviewOpen&&<div className="ee-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setLaunchReviewOpen(false)}}>
        <section className="ee-modal" role="dialog" aria-modal="true" aria-label="Website launch review">
          <header className="ee-modal-head">
            <div><small>Before you go live</small><h2>Review your website</h2></div>
            <button type="button" className="ee-icon-btn" aria-label="Close launch review" onClick={()=>setLaunchReviewOpen(false)}><X size={18}/></button>
          </header>
          <div className="ee-launch-summary">
            <div className={launchBlockers.length?'bad':'good'}><strong>{launchBlockers.length}</strong><span>must fix</span></div>
            <div><strong>{launchIssues.length-launchBlockers.length}</strong><span>suggestions</span></div>
            <div><strong>{project.pages.length}</strong><span>pages</span></div>
          </div>
          <div className="ee-launch-list">
            {launchIssues.length===0&&<div className="ee-launch-clean"><Check size={18}/><div><strong>Everything looks ready.</strong><p>Check the mobile preview once, then publish.</p></div></div>}
            {launchIssues.map(issue=><div key={issue.id} className={'ee-launch-item '+issue.level}>
              <CircleAlert size={16}/>
              <div><strong>{issue.title}</strong><p>{issue.detail}</p></div>
              <button type="button" className="ee-btn ee-btn-soft" onClick={()=>openLaunchIssue(issue)}>Fix</button>
            </div>)}
          </div>
          <footer className="ee-modal-foot">
            <button type="button" className="ee-btn" onClick={()=>{setBreakpoint('mobilePortrait');setLaunchReviewOpen(false);setPreview(true)}}><Smartphone size={14}/> Preview on mobile</button>
            <button type="button" className="ee-btn ee-btn-primary vb-launch-confirm" onClick={publish} disabled={publishing||!!launchBlockers.length}>
              {launchBlockers.length?'Fix the items above to publish':publishing?'Publishing…':'Publish now'}</button>
          </footer>
        </section>
      </div>}
      {publishNotice&&<div className={'ee-notice '+(publishNotice.error?'is-error':'')} role={publishNotice.error?'alert':'status'}>
        <strong>{publishNotice.message}</strong>
        {publishNotice.url&&<a href={publishNotice.url} target="_blank" rel="noopener noreferrer">Open live website ↗</a>}
        <button type="button" aria-label="Dismiss publishing notification" onClick={()=>setPublishNotice(null)}><X size={14}/></button>
      </div>}
      {toast&&<div className="ee-toast" role="status">{toast}</div>}
      {context&&<ContextMenu {...context} onClose={()=>setContext(null)}
        onEdit={()=>window.setTimeout(()=>window.dispatchEvent(new CustomEvent('cobest-inspector-tab',{detail:'content'})),0)} onLayers={()=>{setLeftTab('layers');setLeftOpen(true)}}
        onCopy={()=>executeShortcut('copy')} onPaste={()=>executeShortcut('paste')} canPaste={Boolean(copiedNodeRef.current)}/>}
    </div>
    <DragOverlay>{dragging?<div className="ee-drag-overlay">{dragLabel}</div>:null}</DragOverlay>
  </DndContext>
}
