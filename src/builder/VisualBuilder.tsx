import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext, DragEndEvent, DragMoveEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor,
  pointerWithin, useSensor, useSensors
} from '@dnd-kit/core'
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, CircleAlert, Copy, Download, Eye, FileJson, History,
  Image as ImageIcon, Layers, Monitor, MoreHorizontal, Palette, Pencil, Plus, Redo2, Rocket, Save, Smartphone,
  Tablet, Trash2, Undo2, Upload, X, FileText, Sparkles
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createCanvasDocument } from './canvas'
import { applyNodeGeometry } from './geometry'
import { reviewWebsiteLaunch, type LaunchIssue } from './launchReview'
import { duplicateWithIndependentGeometry } from './duplicate'
import { editorShortcutFor, type EditorShortcut } from './shortcuts'
import { downloadProjectJson, downloadProjectZip, importProjectJson } from './export'
import { chooseLatestProject, loadProject, saveProject } from './persistence'
import { createPublishedDocument } from './publicDocument'
import { HOST_MESSAGE_SOURCE, mapFormFields, SITE_MESSAGE_SOURCE } from './runtime'
import { createSaveQueue } from './saveQueue'
import { createElement } from './elements'
import { EasyAddPanel, EasyLayersPanel, EasyMediaPanel, EasyPagesPanel, EasyThemePanel, LayerDropContext } from './easyPanels'
import { EasyInspector } from './inspector'
import {
  activePage as pageOf, createSectionFor, deviceName, findSamples, friendlyType, layerDropTarget, siblingPosition,
  typeLabel, workflowProgress, type DropZone, type WorkflowStep
} from './editorModel'
import { ensureKitStyles } from './kit'
import { useBuilderStore } from './store'
import { canAcceptChild, clone, findNode, findParent } from './tree'
import { normalizeProject } from './validate'
import type { BreakpointId, BuilderNode, BuilderProject, StyleMap } from './types'
import './editor.css'

const widths:Record<BreakpointId,number>={desktop:1440,tablet:991,mobileLandscape:767,mobilePortrait:390}
const viewportHeights:Record<BreakpointId,number>={desktop:900,tablet:760,mobileLandscape:430,mobilePortrait:844}
const GUIDE_KEY='cobest-editor-guide-hidden'
const PROGRESS_KEY='cobest-editor-progress'
/** Below this width the tools move to the bottom of the screen (tablets, phones). */
const NARROW=1024
const PHONE=640
/** From this width the left panel sits beside the page instead of over it. */
const ROOMY=1680

type LeftTab='add'|'layers'|'pages'|'media'|'theme'
type HomeSource='storefront'|'custom'
type Flags={previewedMobile:boolean;published:boolean;home?:HomeSource}

/** What visitors currently see, as reported by the server. */
export interface LiveInfo{
  published:boolean
  home_source:HomeSource
  has_custom_pages:boolean
  custom_page_names?:string[]
  storefront_theme?:string
}

function readFlags(projectKey:string):Flags{
  try{const raw=JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}');return {previewedMobile:false,published:false,...(raw[projectKey]||{})}}
  catch{return {previewedMobile:false,published:false}}
}
function writeFlags(projectKey:string,flags:Flags){
  try{const raw=JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}');raw[projectKey]=flags;localStorage.setItem(PROGRESS_KEY,JSON.stringify(raw))}catch{}
}

function CanvasDropZone({children,dragging,nativePayload,iframeRef,scale,onNativeDropEnd}:{
  children:React.ReactNode;dragging:boolean;nativePayload:any|null
  iframeRef:React.RefObject<HTMLIFrameElement>;scale:number;onNativeDropEnd:()=>void
}){
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
  return <div className="vb-canvas-drop ee-canvas-drop" data-dragging={dragging?'true':'false'}>
    {children}
    {nativePayload&&<div className="vb-native-drop-overlay" aria-hidden="true"
      onDragOver={event=>{event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='copy';relay('external-drag-over',event)}}
      onDragLeave={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))relay('external-drag-leave')}}
      onDrop={event=>{event.preventDefault();event.stopPropagation();relay('external-drop',event);onNativeDropEnd()}}/>}
    {nativePayload&&<div className="vb-canvas-drop-label">Drop on the page</div>}
  </div>
}

/** Where something dropped on the page (from the Add panel) should go. */
function resolveCanvasDrop(root:BuilderNode,mode:string,nodeId:string){
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
    <p className="ee-muted">Your last {project.versions.length} changes. Restoring keeps today’s design in Undo.</p>
    <div className="ee-version-list">{project.versions.length?project.versions.map(v=><button type="button" key={v.id}
      onClick={()=>{if(confirm('Go back to how the website was before “'+v.label+'”?')){restoreVersion(v.id);onClose()}}}>
      <strong>{v.label}</strong><small>{new Date(v.createdAt).toLocaleString()}</small></button>)
      :<p className="ee-muted">Versions appear as you edit.</p>}</div>
  </div>
}

type MoreMenuProps={
  onClose:()=>void;onVersions:()=>void;narrow:boolean;phone:boolean;guideHidden:boolean
  onShowGuide:()=>void;onSave:()=>void
}
function MoreMenu({onClose,onVersions,narrow,phone,guideHidden,onShowGuide,onSave}:MoreMenuProps){
  const project=useBuilderStore(s=>s.project)
  const breakpoint=useBuilderStore(s=>s.breakpoint)
  const setBreakpoint=useBuilderStore(s=>s.setBreakpoint)
  const renameProject=useBuilderStore(s=>s.renameProject)
  const importProject=useBuilderStore(s=>s.importProject)
  const fileRef=useRef<HTMLInputElement>(null)
  const ref=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    const down=(e:PointerEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))onClose()}
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()}
    // Deferred so the click that opened the menu does not close it again.
    const timer=window.setTimeout(()=>document.addEventListener('pointerdown',down),0)
    document.addEventListener('keydown',key)
    return()=>{window.clearTimeout(timer);document.removeEventListener('pointerdown',down);document.removeEventListener('keydown',key)}
  },[onClose])
  const importFile=async(file?:File)=>{
    if(!file)return
    try{
      if(file.size>15*1024*1024)throw new Error('This file is too large to open.')
      const imported=await importProjectJson(file)
      if(confirm(`Replace this website with the backup “${imported.name}”? You can undo this, and today’s design is kept in Version history.`)){
        importProject(imported);onClose()
      }
    }catch(error:any){alert(error?.message||'This file could not be opened.')}
  }
  return <div ref={ref} className="ee-popover ee-more" role="menu" aria-label="More options">
    {narrow&&<>
      <button role="menuitem" type="button" onClick={()=>{const next=prompt('Website name',project.name);if(next?.trim())renameProject(next.trim().slice(0,80));onClose()}}><Pencil size={15}/> Rename website</button>
      <button role="menuitem" type="button" onClick={()=>{onSave();onClose()}}><Save size={15}/> Save now</button>
    </>}
    {phone&&<>
      <hr/><span className="ee-more-label">Edit for</span>
      {(['mobilePortrait','tablet','desktop'] as BreakpointId[]).map(id=><button key={id} role="menuitemradio" aria-checked={breakpoint===id} aria-pressed={breakpoint===id} type="button"
        onClick={()=>{setBreakpoint(id);onClose()}}>{id==='desktop'?<Monitor size={15}/>:id==='tablet'?<Tablet size={15}/>:<Smartphone size={15}/>} {deviceName[id]}{breakpoint===id?' ✓':''}</button>)}
      <hr/>
    </>}
    {guideHidden&&<button role="menuitem" type="button" onClick={()=>{onShowGuide();onClose()}}><Sparkles size={15}/> Show setup steps</button>}
    <button role="menuitem" type="button" onClick={()=>{onVersions();onClose()}}><History size={15}/> Version history</button>
    <button role="menuitem" type="button" onClick={()=>{downloadProjectZip(project);onClose()}}><Download size={15}/> Download website (ZIP)</button>
    <button role="menuitem" type="button" onClick={()=>{downloadProjectJson(project);onClose()}}><FileJson size={15}/> Download backup</button>
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
  return <div ref={ref} role="menu" aria-label={'Element actions for '+node.name} className="vb-context-menu" style={{left:x,top:y}} onContextMenu={e=>e.preventDefault()}>
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

const guideSteps:[WorkflowStep,string,string][]=[
  ['structure','Add sections','Build the page from ready-made sections'],
  ['content','Make it yours','Replace the sample text and pictures'],
  ['mobile','Check on mobile','See how phones show your website'],
  ['publish','Publish','Review and go live'],
]

function GuideStrip({progress,compact,onStep,onHide}:{progress:ReturnType<typeof workflowProgress>;compact:boolean;onStep:(step:WorkflowStep)=>void;onHide:()=>void}){
  const hint=(id:WorkflowStep,fallback:string)=>id==='content'&&progress.samplesLeft>0
    ?progress.samplesLeft+(progress.samplesLeft===1?' sample left to replace':' samples left to replace'):fallback
  const nextIndex=guideSteps.findIndex(([id])=>!progress[id])
  if(compact){
    const done=guideSteps.filter(([id])=>progress[id]).length
    const [id,title,text]=guideSteps[nextIndex<0?guideSteps.length-1:nextIndex]
    return <div className="ee-guide" role="region" aria-label="Website setup steps">
      <button type="button" className="ee-guide-next" onClick={()=>onStep(id)}>
        <span className="ee-guide-num">{nextIndex<0?<Check size={12}/>:nextIndex+1}</span>
        <span><strong>{nextIndex<0?'All steps done':'Next: '+title}</strong><small>{nextIndex<0?'Publish again whenever you make changes.':hint(id,text)}</small></span>
        <span className="ee-guide-count">{done}/4</span>
      </button>
      <button type="button" className="ee-guide-hide" aria-label="Hide setup steps" onClick={onHide}><X size={16}/></button>
    </div>
  }
  return <div className="ee-guide" role="region" aria-label="Website setup steps">
    <ol>{guideSteps.map(([id,title,text],i)=><li key={id} className={(progress[id]?'is-done ':'')+(nextIndex===i?'is-next':'')}>
      <button type="button" onClick={()=>onStep(id)} aria-label={'Step '+(i+1)+': '+title+(progress[id]?' (done)':'')}>
        <span className="ee-guide-num">{progress[id]?<Check size={12}/>:i+1}</span>
        <span><strong>{title}</strong><small>{hint(id,text)}</small></span>
      </button>
    </li>)}</ol>
    <button type="button" className="ee-guide-hide" aria-label="Hide setup steps" onClick={onHide}><X size={14}/></button>
  </div>
}

type VisualBuilderProps={
  projectKey?:string
  initialProject?:BuilderProject|null
  onCloudSave?:(project:BuilderProject)=>Promise<unknown>|unknown
  onPublish?:(project:BuilderProject,options:{homeSource:HomeSource})=>Promise<any>|any
  onBack?:()=>void
  /** What is live right now, so publishing cannot replace a shop homepage by surprise. */
  liveInfo?:LiveInfo|null
  /** This website also has a shop homepage made in the Storefront editor. */
  hasShopHome?:boolean
}

export default function VisualBuilder({projectKey='local-default',initialProject=null,onCloudSave,onPublish,onBack,liveInfo=null,hasShopHome=false}:VisualBuilderProps){
  const iframeRef=useRef<HTMLIFrameElement>(null)
  const previewRef=useRef<HTMLIFrameElement>(null)
  const stageRef=useRef<HTMLElement>(null)
  const sheetRef=useRef<HTMLDivElement>(null)
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
  const updateNode=useBuilderStore(s=>s.updateNode)
  const moveNode=useBuilderStore(s=>s.moveNode)
  const duplicateNode=useBuilderStore(s=>s.duplicateNode)
  const deleteNode=useBuilderStore(s=>s.deleteNode)
  const addClass=useBuilderStore(s=>s.addClass)
  const setStyle=useBuilderStore(s=>s.setStyle)
  const setSelectedComputed=useBuilderStore(s=>s.setSelectedComputed)
  const undo=useBuilderStore(s=>s.undo)
  const redo=useBuilderStore(s=>s.redo)

  const [viewportWidth,setViewportWidth]=useState(()=>typeof window==='undefined'?ROOMY:window.innerWidth)
  const narrow=viewportWidth<NARROW
  const phone=viewportWidth<PHONE
  const roomy=viewportWidth>=ROOMY
  const [leftTab,setLeftTab]=useState<LeftTab>('add')
  const [leftOpen,setLeftOpen]=useState(()=>typeof window!=='undefined'&&window.innerWidth>=ROOMY)
  const [sheet,setSheet]=useState<null|'panel'|'inspector'>(null)
  const [preview,setPreview]=useState(false)
  const [zoomMode,setZoomMode]=useState<'fit'|'actual'>('fit')
  const [snappingEnabled,setSnappingEnabled]=useState(()=>{try{return localStorage.getItem('cobest-designer-snap')!=='off'}catch{return true}})
  const [guideHidden,setGuideHidden]=useState(()=>{try{return localStorage.getItem(GUIDE_KEY)==='1'}catch{return false}})
  const [flags,setFlags]=useState<Flags>(()=>readFlags(projectKey))
  const [stageWidth,setStageWidth]=useState(0)
  const [canvasHeight,setCanvasHeight]=useState(viewportHeights.desktop)
  const [dragLabel,setDragLabel]=useState('')
  const [dragging,setDragging]=useState(false)
  const [dropHint,setDropHint]=useState<{anchorId:string;zone:DropZone}|null>(null)
  const [nativeDragPayload,setNativeDragPayload]=useState<any|null>(null)
  const [versionsOpen,setVersionsOpen]=useState(false)
  const [moreOpen,setMoreOpen]=useState(false)
  const [pagesOpen,setPagesOpen]=useState(false)
  const [context,setContext]=useState<{x:number;y:number;nodeId:string}|null>(null)
  const [publishNotice,setPublishNotice]=useState<{url?:string;message:string;error?:boolean}|null>(null)
  const [publishing,setPublishing]=useState(false)
  const [launchReviewOpen,setLaunchReviewOpen]=useState(false)
  const [homeChoice,setHomeChoice]=useState<''|HomeSource>('')
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
  const hasSelection=!!selectedNode&&selectedNode.id!==activePage.root.id
  const selectionPath:BuilderNode[]=[]
  if(selectedNode){
    let pointer:BuilderNode|null=selectedNode
    while(pointer){selectionPath.unshift(pointer);pointer=findParent(activePage.root,pointer.id)}
  }
  const pageIsEmpty=activePage.root.children.length===0

  // The shop homepage must never be replaced without the owner choosing to.
  const shopIsLive=!!liveInfo?.published&&liveInfo.home_source==='storefront'
  const askHome=shopIsLive||(hasShopHome&&!(liveInfo?.published&&liveInfo.home_source==='custom'))
  const homeSource:''|HomeSource=askHome?homeChoice:'custom'

  useEffect(()=>{
    const onResize=()=>setViewportWidth(window.innerWidth)
    window.addEventListener('resize',onResize)
    return()=>window.removeEventListener('resize',onResize)
  },[])
  // A phone shows the phone layout by default: that is what fits the screen.
  useEffect(()=>{if(window.innerWidth<PHONE)setBreakpoint('mobilePortrait')},[setBreakpoint])
  useEffect(()=>{if(!narrow)setSheet(null)},[narrow])
  useEffect(()=>{if(sheet==='inspector'&&!hasSelection)setSheet(null)},[sheet,hasSelection])

  useEffect(()=>setFlags(readFlags(projectKey)),[projectKey])
  const updateFlags=useCallback((patch:Partial<Flags>)=>{
    setFlags(prev=>{
      const next={...prev,...patch}
      if(JSON.stringify(next)===JSON.stringify(prev))return prev
      writeFlags(projectKey,next);return next
    })
  },[projectKey])
  useEffect(()=>{if(preview&&(breakpoint==='mobilePortrait'||window.innerWidth<PHONE))updateFlags({previewedMobile:true})},[preview,breakpoint,updateFlags])
  useEffect(()=>{if(!toast)return;const t=window.setTimeout(()=>setToast(''),3200);return()=>window.clearTimeout(t)},[toast])

  const openPanel=(tab:LeftTab)=>{
    setLeftTab(tab)
    if(narrow)setSheet('panel');else setLeftOpen(true)
  }
  const openInspector=(tab?:'content'|'design'|'advanced')=>{
    if(narrow)setSheet('inspector')
    if(tab)window.setTimeout(()=>window.dispatchEvent(new CustomEvent('cobest-inspector-tab',{detail:tab})),0)
  }

  const executeShortcut=(action:EditorShortcut)=>{
    const state=useBuilderStore.getState()
    const page=pageOf(state.project)
    const selected=page&&findNode(page.root,state.selectedNodeId)
    const editable=selected&&selected.id!==page.root.id&&!selected.locked
    if(action==='undo'){state.undo();return}
    if(action==='redo'){state.redo();return}
    if(action==='save'){void manualSave();return}
    if(action==='escape'){setContext(null);if(preview)setPreview(false);else if(sheet)setSheet(null);else state.selectNode(null);return}
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
        // Pasting into another website brings the copied element's look with it.
        for(const name of new Set(collectClasses(node)))if(!draft.styles[name]&&clipboard.styles[name])draft.styles[name]=clone(clipboard.styles[name])
        ensureKitStyles(draft,node)
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
  const previewDocumentHtml=useMemo(()=>preview?createPublishedDocument(project,activePage.id,{mode:'preview'}):'',[preview,project,activePage.id])
  const frameWidth=widths[breakpoint]
  const stagePadding=narrow?16:48
  const scale=zoomMode==='fit'&&stageWidth>0?Math.min(1,Math.max(.2,(stageWidth-stagePadding)/frameWidth)):1
  const zoom=Math.round(scale*100)

  // Measure before the first paint so the page never flashes at 100% before Fit.
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
  useEffect(()=>{if(narrow)setZoomMode('fit')},[narrow])

  // Load the newest copy: this browser's draft or the cloud version.
  useEffect(()=>{
    let alive=true
    const hydrate=async()=>{
      // Saved copies are checked before use so a damaged one cannot break the editor.
      const cloudCopy=initialProject?.pages?.length?normalizeProject(initialProject):null
      const cloudProject=cloudCopy?{...cloudCopy,id:projectKey||cloudCopy.id}:null
      let localProject:BuilderProject|undefined
      try{localProject=normalizeProject(await loadProject(projectKey))||undefined}catch{}
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
      const loaded=useBuilderStore.getState().project
      useBuilderStore.getState().selectNode(null)
      if(window.innerWidth>=NARROW&&pageOf(loaded).root.children.length===0){setLeftTab('add');setLeftOpen(true)}
    }
    hydrate()
    return()=>{alive=false}
  },[projectKey])

  // Messages from the sandboxed frames: the editing page and the preview.
  useEffect(()=>{
    const handler=(event:MessageEvent)=>{
      const msg=event.data||{}
      if(msg.source===SITE_MESSAGE_SOURCE){
        if(!previewRef.current||event.source!==previewRef.current.contentWindow)return
        if(msg.type==='navigate'&&typeof msg.href==='string'){
          const path=msg.href.split(/[?#]/)[0].replace(/\.html$/,'').replace(/\/+$/,'')||'/'
          const wanted=path.startsWith('/')?path:'/'+path
          if(wanted==='/shop'){setToast('On your live website this opens your shop.');return}
          const target=useBuilderStore.getState().project.pages.find(p=>!p.isCollectionTemplate&&(p.slug.replace(/\/+$/,'')||'/')===wanted)
          if(target)setActivePage(target.id)
          else setToast('“'+wanted+'” is not a page on this website yet.')
        }
        if(msg.type==='form-preview'&&typeof msg.id==='string'){
          const mapped=mapFormFields(msg.fields)
          const reply=(ok:boolean,error='')=>previewRef.current?.contentWindow?.postMessage({source:HOST_MESSAGE_SOURCE,type:'form-result',id:msg.id,ok,error},'*')
          if(mapped.missing==='email'){reply(false,'Please enter your email address.');setToast('Forms need an email address so you can reply.')}
          else if(mapped.missing==='message'){reply(false,'Please write a message.');setToast('The form was sent empty.')}
          else{reply(true);setToast('The form works. On your live website, messages arrive in your CoBest Inbox.')}
        }
        return
      }
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
          // On small screens an open sheet covers the lower part of the page.
          const covered=sheetRef.current?sheetRef.current.offsetHeight:0
          const view=stage.scrollTop,viewBottom=view+stage.clientHeight-covered
          if(top<view+40||bottom>viewBottom-40)stage.scrollTo({top:Math.max(0,top-(narrow?24:120)),behavior:'smooth'})
        }
      }
      if(msg.type==='text-change'&&msg.id)updateNode(msg.id,{content:String(msg.content||'').slice(0,20000)})
      if(msg.type==='canvas-resize'&&Number(msg.height))setCanvasHeight(Math.max(viewportHeights[breakpoint],Math.ceil(Number(msg.height))))
      if(msg.type==='canvas-drop'&&msg.payload&&msg.targetId&&msg.mode){
        const store=useBuilderStore.getState()
        const page=pageOf(store.project)
        const payload=msg.payload
        if(payload.kind==='new-section'&&typeof payload.type==='string'){
          // A section lands beside the section it was dropped on, never inside it.
          const node=createSectionFor(store.project,payload.type)
          if(node.type==='navbar'){store.addNode(page.root.id,node,0);return}
          if(node.type==='footer'){store.addNode(page.root.id,node,page.root.children.length);return}
          let topId=String(msg.targetId)
          let parent=findParent(page.root,topId)
          while(parent&&parent.id!==page.root.id){topId=parent.id;parent=findParent(page.root,topId)}
          const at=page.root.children.findIndex(child=>child.id===topId)
          const index=at<0?page.root.children.length:at+(msg.mode==='before'?0:1)
          store.addNode(page.root.id,node,index)
          return
        }
        const target=resolveCanvasDrop(page.root,String(msg.mode),String(msg.targetId))
        if(payload.kind==='new-element'&&typeof payload.type==='string')store.addNode(target.parentId,createElement(payload.type),target.index)
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
        setContext({nodeId:msg.id,x:Math.min(Math.max(6,x),Math.max(6,window.innerWidth-250)),y:Math.min(Math.max(6,y),Math.max(6,window.innerHeight-340))})
        selectNode(msg.id)
      }
    }
    window.addEventListener('message',handler)
    return()=>window.removeEventListener('message',handler)
  },[selectNode,hoverNode,updateNode,addClass,setStyle,setSelectedComputed,setActivePage,breakpoint,scale,narrow])

  // Keep the page's selection in sync; scroll new or picked elements into view.
  useEffect(()=>{
    const reveal=revealRef.current!==selectedNodeId
    revealRef.current=selectedNodeId
    iframeRef.current?.contentWindow?.postMessage({source:'cobest-editor',type:'selection',selected:selectedNodeId,hovered:hoveredNodeId,reveal},'*')
  },[selectedNodeId,hoveredNodeId,editorDocumentHtml])
  // Opening a sheet can cover the selected element: bring it back into view.
  useEffect(()=>{
    if(!sheet||!selectedNodeId)return
    const timer=window.setTimeout(()=>iframeRef.current?.contentWindow?.postMessage({source:'cobest-editor',type:'selection',selected:selectedNodeId,hovered:null,reveal:true},'*'),60)
    return()=>window.clearTimeout(timer)
  },[sheet])
  useEffect(()=>{
    try{localStorage.setItem('cobest-designer-snap',snappingEnabled?'on':'off')}catch{}
    iframeRef.current?.contentWindow?.postMessage({source:'cobest-editor',type:'snapping',enabled:snappingEnabled},'*')
  },[snappingEnabled,editorDocumentHtml])
  useEffect(()=>{
    iframeRef.current?.contentWindow?.postMessage({source:'cobest-editor',type:'zoom',scale},'*')
  },[scale,editorDocumentHtml])

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
      if(!saved&&!confirm('Your latest changes could not be saved to your account. Leave anyway? (They stay saved in this browser.)'))return
    }
    onBack()
  }

  // Reordering in the Layers panel: the line or highlight shows exactly where
  // the layer will land, and nothing moves unless that place is allowed.
  const layerTargetFor=(event:DragMoveEvent|DragEndEvent)=>{
    const active=event.active.data.current
    const over=event.over
    if(active?.kind!=='node'||!over||over.data.current?.kind!=='layer-row')return null
    const start=event.activatorEvent as PointerEvent|undefined
    const pointerY=(start&&typeof start.clientY==='number'?start.clientY:over.rect.top+over.rect.height/2)+event.delta.y
    const ratio=(pointerY-over.rect.top)/Math.max(1,over.rect.height)
    const zone:DropZone=ratio<.3?'before':ratio>.7?'after':'inside'
    const page=pageOf(useBuilderStore.getState().project)
    return layerDropTarget(page.root,String(active.nodeId),String(over.data.current.nodeId),zone)
  }
  const onDragStart=(event:DragStartEvent)=>{
    setDragging(true)
    setDragLabel(String(event.active.data.current?.type||'Element'))
  }
  const onDragMove=(event:DragMoveEvent)=>{
    const target=layerTargetFor(event)
    setDropHint(prev=>{
      const next=target?{anchorId:target.anchorId,zone:target.zone}:null
      return prev?.anchorId===next?.anchorId&&prev?.zone===next?.zone?prev:next
    })
  }
  const onDragEnd=(event:DragEndEvent)=>{
    const target=layerTargetFor(event)
    setDragging(false);setDragLabel('');setDropHint(null)
    const active=event.active.data.current
    if(target&&active?.kind==='node')moveNode(String(active.nodeId),target.parentId,target.index)
  }

  const openLaunchIssue=(issue:LaunchIssue)=>{
    if(issue.pageId)setActivePage(issue.pageId)
    setLaunchReviewOpen(false)
    if(issue.nodeId){selectNode(issue.nodeId);openInspector('content')}
    else if(issue.tab==='pages')openPanel('pages')
  }

  const openPublish=()=>{
    // Preselect only when it cannot surprise anyone: a remembered choice, or a
    // first publish. A live shop homepage is never replaced by default.
    const remembered=flags.home&&askHome&&!(shopIsLive&&flags.home==='custom')?flags.home:''
    setHomeChoice(remembered||(!shopIsLive&&liveInfo&&!liveInfo.published?'custom':''))
    setLaunchReviewOpen(true)
  }

  const publish=async()=>{
    if(publishing||launchBlockers.length||!homeSource)return
    setLaunchReviewOpen(false);setPublishNotice(null);setPublishing(true)
    try{
      const saved=await manualSave()
      if(!saved)throw new Error('Your changes could not be saved, so nothing was published. Please try again.')
      if(!onPublish)throw new Error('Publishing is available after you sign in and open this website from your dashboard.')
      const result=await onPublish(clone(useBuilderStore.getState().project),{homeSource})
      if(!result?.ok||!result?.store_url)throw new Error('The live website was not confirmed. Please try again.')
      updateFlags({published:true,home:homeSource})
      setPublishNotice({message:homeSource==='storefront'?'Your pages are live. Your shop is still the homepage.':'Your website is live.',url:new URL(result.store_url,window.location.origin).href})
    }catch(error:any){
      setPublishNotice({error:true,message:error?.message||'Publishing failed. Your saved design is safe.'})
    }finally{setPublishing(false)}
  }

  const onGuideStep=(step:WorkflowStep)=>{
    if(step==='structure')openPanel('add')
    if(step==='content'){
      // Jump to the next piece of sample wording, on whichever page it is.
      const state=useBuilderStore.getState()
      const samples=findSamples(state.project)
      const next=samples.find(sample=>sample.pageId===state.project.activePageId&&sample.nodeId!==state.selectedNodeId)||samples.find(sample=>sample.nodeId!==state.selectedNodeId)||samples[0]
      if(next){
        if(next.pageId!==state.project.activePageId)setActivePage(next.pageId)
        selectNode(next.nodeId);openInspector('content')
      }else setToast('No samples left. Click any text or picture to keep editing.')
    }
    if(step==='mobile'){setBreakpoint('mobilePortrait');setSheet(null);setPreview(true)}
    if(step==='publish')openPublish()
  }

  const beginNativeDrag=(event:React.DragEvent<HTMLDivElement>)=>{
    let raw=''
    try{raw=event.dataTransfer.getData('application/x-cobest-builder')||event.dataTransfer.getData('text/plain')||''}catch{}
    if(raw.startsWith('cobest:'))raw=raw.slice(7)
    try{
      const payload=raw?JSON.parse(raw):null
      if(payload?.kind==='new-element'||payload?.kind==='new-section')setNativeDragPayload(payload)
    }catch{}
  }
  const endNativeDrag=()=>{
    setNativeDragPayload(null)
    iframeRef.current?.contentWindow?.postMessage({source:'cobest-editor',type:'external-drag-leave'},'*')
  }

  const hideGuide=()=>{setGuideHidden(true);try{localStorage.setItem(GUIDE_KEY,'1')}catch{}}
  const showGuide=()=>{setGuideHidden(false);try{localStorage.removeItem(GUIDE_KEY)}catch{}}

  const devices:[BreakpointId,string,LucideIcon][]=[['desktop','Desktop',Monitor],['tablet','Tablet',Tablet],['mobilePortrait','Mobile',Smartphone]]
  const statusText=saveStatus==='saving'?'Saving…':saveStatus==='error'?'Not saved':saveStatus==='dirty'?'Unsaved':'Saved'

  if(preview)return <div className="ee-preview" role="dialog" aria-label="Website preview">
    <div className="ee-preview-bar">
      <span className="ee-preview-title"><Eye size={15}/> Preview · {activePage.name}</span>
      <div className="ee-devices" role="group" aria-label="Preview device">{devices.map(([id,label,Icon])=>
        <button key={id} type="button" aria-pressed={breakpoint===id} onClick={()=>setBreakpoint(id)} title={label}><Icon size={15}/><span>{label}</span></button>)}</div>
      <div className="ee-preview-actions">
        {project.pages.length>1&&<select className="ee-input ee-compact" aria-label="Preview page" value={activePage.id} onChange={e=>setActivePage(e.target.value)}>
          {project.pages.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>}
        <button type="button" className="ee-btn ee-btn-dark" onClick={()=>setPreview(false)}>Exit preview <X size={14}/></button>
      </div>
    </div>
    <div className="ee-preview-stage"><iframe ref={previewRef} title="CoBest preview" sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
      srcDoc={previewDocumentHtml} className={'ee-preview-frame '+(breakpoint!=='desktop'&&!phone?'is-device':'')}
      style={phone?{width:'100%',height:'100%'}:{width:frameWidth,height:breakpoint==='desktop'?'100%':viewportHeights[breakpoint]}}/></div>
    {toast&&<div className="ee-toast" role="status">{toast}</div>}
  </div>

  const leftTabs:[LeftTab,string,LucideIcon][]=[['add','Add',Plus],['layers','Layers',Layers],['pages','Pages',FileText],['media','Media',ImageIcon],['theme','Theme',Palette]]
  const panelTitle:Record<LeftTab,string>={add:'Add to page',layers:'Layers',pages:'Pages',media:'Media',theme:'Theme'}
  const panel=<>
    {leftTab==='add'&&<EasyAddPanel touch={narrow} onAdded={narrow?()=>setSheet(null):undefined}/>}
    {leftTab==='layers'&&<EasyLayersPanel/>}
    {leftTab==='pages'&&<EasyPagesPanel/>}
    {leftTab==='media'&&<EasyMediaPanel/>}
    {leftTab==='theme'&&<EasyThemePanel/>}
  </>
  const position=hasSelection&&selectedNode?siblingPosition(activePage.root,selectedNode.id):null

  return <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={onDragEnd}
    onDragCancel={()=>{setDragging(false);setDragLabel('');setDropHint(null)}}>
    <LayerDropContext.Provider value={dropHint}>
    <div className="ee-shell" data-layout={narrow?'narrow':'wide'} data-phone={phone?'true':'false'} data-selected={hasSelection?'true':'false'} data-sheet={sheet?'true':'false'}
      onDragStart={beginNativeDrag} onDragEnd={endNativeDrag}>
      <header className="ee-topbar">
        <div className="ee-top-left">
          {onBack&&<button type="button" className="ee-icon-btn" title="Back to dashboard" aria-label="Back to dashboard" onClick={returnToDashboard}><ArrowLeft size={18}/></button>}
          <div className="ee-site">
            <input value={project.name} onChange={e=>renameProject(e.target.value)} aria-label="Website name" maxLength={80}/>
            <div className="ee-page-picker">
              <button type="button" className="ee-page-button" aria-haspopup="listbox" aria-expanded={pagesOpen} aria-label={'Page: '+activePage.name+'. Change page'} onClick={()=>setPagesOpen(o=>!o)}>
                <FileText size={14}/> <span>{activePage.name}</span><ChevronDown size={14}/></button>
              {pagesOpen&&<div className="ee-popover ee-page-menu" role="listbox" aria-label="Pages" onMouseLeave={()=>setPagesOpen(false)}>
                {project.pages.map(p=><button key={p.id} role="option" aria-selected={p.id===activePage.id} type="button" onClick={()=>{setActivePage(p.id);setPagesOpen(false)}}>
                  <span>{p.name}</span><small>{p.slug}</small></button>)}
                <button type="button" className="ee-page-manage" onClick={()=>{openPanel('pages');setPagesOpen(false)}}><Plus size={14}/> Add or manage pages</button>
              </div>}
            </div>
          </div>
        </div>
        {!narrow&&<div className="ee-devices" role="group" aria-label="Edit for device">
          {devices.map(([id,label,Icon])=><button key={id} type="button" aria-pressed={breakpoint===id} title={'Edit for '+label} onClick={()=>setBreakpoint(id)}><Icon size={15}/><span>{label}</span></button>)}
        </div>}
        <div className="ee-top-right">
          {narrow&&!phone&&<div className="ee-devices" role="group" aria-label="Edit for device">
            {devices.map(([id,label,Icon])=><button key={id} type="button" aria-pressed={breakpoint===id} aria-label={'Edit for '+label} title={'Edit for '+label} onClick={()=>setBreakpoint(id)}><Icon size={16}/><span>{label}</span></button>)}
          </div>}
          <button type="button" className="ee-icon-btn" disabled={!history.length} onClick={undo} title="Undo (Ctrl+Z)" aria-label="Undo"><Undo2 size={17}/></button>
          <button type="button" className="ee-icon-btn" disabled={!future.length} onClick={redo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><Redo2 size={17}/></button>
          <span className={'vb-save-status ee-save '+saveStatus} role="status" aria-live="polite" title={statusText}>{statusText}</span>
          {!narrow&&<button type="button" className="ee-btn ee-btn-ghost" onClick={manualSave} aria-label="Save"><Save size={15}/><span>Save</span></button>}
          <div className="ee-more-wrap">
            <button type="button" className="ee-icon-btn" aria-label="More options" aria-expanded={moreOpen} onClick={()=>setMoreOpen(o=>!o)}><MoreHorizontal size={18}/></button>
            {moreOpen&&<MoreMenu onClose={()=>setMoreOpen(false)} onVersions={()=>setVersionsOpen(true)} narrow={narrow} phone={phone}
              guideHidden={guideHidden} onShowGuide={showGuide} onSave={()=>void manualSave()}/>}
            {versionsOpen&&<VersionPopover onClose={()=>setVersionsOpen(false)}/>}
          </div>
          <button type="button" className="ee-btn ee-btn-ghost" onClick={()=>{setSheet(null);setPreview(true)}} aria-label="Preview"><Eye size={16}/><span>Preview</span></button>
          {onPublish&&<button type="button" className="ee-btn ee-btn-primary vb-publish" onClick={openPublish} disabled={publishing}>
            <Rocket size={15}/>{publishing?'Publishing…':'Publish'}</button>}
        </div>
      </header>
      {!guideHidden&&<GuideStrip progress={progress} compact={narrow} onStep={onGuideStep} onHide={hideGuide}/>}
      <div className="ee-workspace">
        {!narrow&&<nav className="ee-rail" aria-label="Editor panels">
          {leftTabs.map(([id,label,Icon])=><button key={id} type="button" aria-label={label} aria-pressed={leftOpen&&leftTab===id} title={label}
            onClick={()=>{if(leftOpen&&leftTab===id)setLeftOpen(false);else{setLeftTab(id);setLeftOpen(true)}}}><Icon size={19}/><span>{label}</span></button>)}
          {guideHidden&&<button type="button" className="ee-rail-help" aria-label="Show setup steps" title="Show setup steps" onClick={showGuide}><Sparkles size={18}/><span>Steps</span></button>}
        </nav>}
        {!narrow&&leftOpen&&<aside className={'ee-left '+(roomy?'':'is-overlay')} aria-label={panelTitle[leftTab]+' panel'}>
          <button type="button" className="ee-panel-close" aria-label={'Close '+panelTitle[leftTab]+' panel'} onClick={()=>setLeftOpen(false)}><X size={16}/></button>
          {panel}
        </aside>}
        <main className="ee-stage" ref={stageRef} onMouseDown={e=>{if(e.target===e.currentTarget)selectNode(null)}}>
          {pageIsEmpty&&<div className="ee-empty-cta">
            <strong>This page is empty</strong>
            <p>Start with a ready-made section such as a Hero or a Contact form.</p>
            <button type="button" className="ee-btn ee-btn-primary" onClick={()=>openPanel('add')}><Plus size={15}/> Add a section</button>
          </div>}
          <CanvasDropZone dragging={!!nativeDragPayload} nativePayload={nativeDragPayload} iframeRef={iframeRef} scale={scale} onNativeDropEnd={endNativeDrag}>
            <div className={'ee-device-frame '+(breakpoint==='desktop'?'':'is-device')} style={{width:frameWidth*scale}}>
              <div className="ee-device-label">{breakpoint==='desktop'?'Desktop · changes apply to every screen size'
                :deviceName[breakpoint]+' layout · text and pictures change everywhere; colors and sizes change only on this size and smaller'}</div>
              <div className="vb-canvas-scaler" style={{width:frameWidth*scale,height:canvasHeight*scale}}>
                <div className="vb-canvas-zoom" style={{width:frameWidth,transform:`scale(${scale})`,transformOrigin:'top left'}}>
                  <div className="vb-canvas-wrap" style={{width:frameWidth,height:canvasHeight}}>
                    <iframe ref={iframeRef} title="CoBest visual builder canvas" sandbox="allow-scripts allow-forms allow-popups" srcDoc={editorDocumentHtml}
                      className="vb-canvas" style={{height:canvasHeight,pointerEvents:dragging?'none':'auto'}} onLoad={()=>{
                        const frame=iframeRef.current?.contentWindow
                        frame?.postMessage({source:'cobest-editor',type:'snapping',enabled:snappingEnabled},'*')
                        frame?.postMessage({source:'cobest-editor',type:'zoom',scale},'*')
                        frame?.postMessage({source:'cobest-editor',type:'selection',selected:selectedNodeId,hovered:hoveredNodeId},'*')
                      }}/>
                  </div>
                </div>
              </div>
            </div>
          </CanvasDropZone>
        </main>
        {!narrow&&<aside className="ee-right" aria-label="Edit selected element"><EasyInspector onCopy={()=>executeShortcut('copy')}/></aside>}
      </div>
      {!narrow&&<footer className="ee-statusbar">
        <nav className="ee-crumbs" aria-label="Selected element hierarchy">
          {selectionPath.length?selectionPath.map((node,index)=><React.Fragment key={node.id}>
            {index>0&&<span aria-hidden="true">›</span>}
            <button type="button" className={selectedNodeId===node.id?'active':''} aria-label={'Select '+node.name}
              aria-current={selectedNodeId===node.id?'true':undefined} onClick={()=>selectNode(node.id)}>{index===0?'Page':node.name}</button>
          </React.Fragment>):<span className="ee-muted">Nothing selected · click anything on the page</span>}
        </nav>
        <div className="ee-zoom" aria-label="Canvas zoom controls">
          <button type="button" className={'vb-snap-toggle '+(snappingEnabled?'active':'')} aria-label="Toggle alignment snapping"
            title="Line things up with nearby edges while dragging (hold Alt to switch off)" aria-pressed={snappingEnabled} onClick={()=>setSnappingEnabled(v=>!v)}>Snap {snappingEnabled?'on':'off'}</button>
          <button type="button" className={zoomMode==='fit'?'active':''} onClick={()=>setZoomMode('fit')} aria-label="Fit canvas to workspace">Fit</button>
          <span data-testid="canvas-zoom">{zoom}%</span>
          <button type="button" className={zoomMode==='actual'?'active':''} onClick={()=>setZoomMode('actual')} aria-label="Show canvas at actual size">100%</button>
        </div>
      </footer>}

      {narrow&&hasSelection&&selectedNode&&!sheet&&<div className="ee-selection-bar" role="toolbar" aria-label={'Selected: '+selectedNode.name}>
        <span className="ee-selection-name"><strong>{selectedNode.name}</strong>{typeLabel(selectedNode)&&<small>{typeLabel(selectedNode)}</small>}</span>
        <button type="button" aria-label="Move up" disabled={!position||position.index===0} onClick={()=>position&&moveNode(selectedNode.id,position.parent.id,position.index-1)}><ChevronUp size={18}/></button>
        <button type="button" aria-label="Move down" disabled={!position||position.index>=position.count-1} onClick={()=>position&&moveNode(selectedNode.id,position.parent.id,position.index+2)}><ChevronDown size={18}/></button>
        <button type="button" aria-label="Duplicate" onClick={()=>duplicateNode(selectedNode.id)}><Copy size={17}/></button>
        <button type="button" aria-label="Delete" onClick={()=>deleteNode(selectedNode.id)}><Trash2 size={17}/></button>
        <button type="button" className="ee-selection-edit" onClick={()=>openInspector()}><Pencil size={15}/> Edit</button>
        <button type="button" aria-label="Deselect" onClick={()=>selectNode(null)}><X size={18}/></button>
      </div>}
      {narrow&&<nav className="ee-bottombar" aria-label="Editor panels">
        {leftTabs.map(([id,label,Icon])=><button key={id} type="button" aria-label={label} aria-pressed={sheet==='panel'&&leftTab===id}
          onClick={()=>{if(sheet==='panel'&&leftTab===id)setSheet(null);else{setLeftTab(id);setSheet('panel')}}}><Icon size={20}/><span>{label}</span></button>)}
      </nav>}
      {narrow&&sheet&&<>
        <div ref={sheetRef} className="ee-sheet" data-size={sheet==='panel'&&leftTab!=='add'?'tall':'normal'} role="dialog" aria-label={sheet==='inspector'?'Edit selected element':panelTitle[leftTab]}>
          <div className="ee-sheet-head">
            <strong>{sheet==='inspector'?'Edit':panelTitle[leftTab]}</strong>
            <button type="button" aria-label="Close" onClick={()=>setSheet(null)}><X size={20}/></button>
          </div>
          <div className="ee-sheet-body">{sheet==='inspector'?<EasyInspector narrow onCopy={()=>executeShortcut('copy')}/>:panel}</div>
        </div>
      </>}

      {launchReviewOpen&&<div className="ee-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setLaunchReviewOpen(false)}}>
        <section className="ee-modal" role="dialog" aria-modal="true" aria-label="Website launch review">
          <header className="ee-modal-head">
            <div><small>Before you go live</small><h2>Review your website</h2></div>
            <button type="button" className="ee-icon-btn" aria-label="Close launch review" onClick={()=>setLaunchReviewOpen(false)}><X size={18}/></button>
          </header>
          <div className="ee-modal-body">
            <div className="ee-launch-summary">
              <div className={launchBlockers.length?'bad':'good'}><strong>{launchBlockers.length}</strong><span>must fix</span></div>
              <div><strong>{launchIssues.length-launchBlockers.length}</strong><span>suggestions</span></div>
              <div><strong>{project.pages.filter(p=>!p.isCollectionTemplate).length}</strong><span>{project.pages.length===1?'page':'pages'}</span></div>
            </div>
            {askHome&&<fieldset className="ee-home-choice">
              <legend>Which homepage should visitors see?</legend>
              <p>{shopIsLive?'Your shop is live right now. Nothing changes unless you choose it here.':'Your website has a shop homepage and the Home page you designed here.'}</p>
              <label><input type="radio" name="home-source" value="storefront" checked={homeChoice==='storefront'} onChange={()=>setHomeChoice('storefront')}/>
                <span><strong>Keep my shop as the homepage</strong><small>Pages from this editor are published as extra pages, linked from your shop’s menu.</small></span></label>
              <label><input type="radio" name="home-source" value="custom" checked={homeChoice==='custom'} onChange={()=>setHomeChoice('custom')}/>
                <span><strong>Use my Home page from this editor</strong><small>{shopIsLive?'Replaces the shop homepage. ':''}Visitors still reach your products through the Shop button.</small></span></label>
            </fieldset>}
            <div className="ee-launch-list">
              {launchIssues.length===0&&<div className="ee-launch-clean"><Check size={18}/><div><strong>Everything looks ready.</strong><p>Check the mobile preview once, then publish.</p></div></div>}
              {launchIssues.map(issue=><div key={issue.id} className={'ee-launch-item '+issue.level}>
                <CircleAlert size={16}/>
                <div><strong>{issue.title}</strong><p>{issue.detail}</p></div>
                <button type="button" className="ee-btn ee-btn-soft" onClick={()=>openLaunchIssue(issue)}>Fix <ArrowRight size={12}/></button>
              </div>)}
            </div>
          </div>
          <footer className="ee-modal-foot">
            <button type="button" className="ee-btn" onClick={()=>{setBreakpoint('mobilePortrait');setLaunchReviewOpen(false);setSheet(null);setPreview(true)}}><Smartphone size={14}/> Preview on mobile</button>
            <button type="button" className="ee-btn ee-btn-primary vb-launch-confirm" onClick={publish} disabled={publishing||!!launchBlockers.length||!homeSource}>
              {launchBlockers.length?'Fix the items marked “must fix”':!homeSource?'Choose a homepage above':publishing?'Publishing…':'Publish now'}</button>
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
        onEdit={()=>openInspector('content')} onLayers={()=>openPanel('layers')}
        onCopy={()=>executeShortcut('copy')} onPaste={()=>executeShortcut('paste')} canPaste={Boolean(copiedNodeRef.current)}/>}
    </div>
    </LayerDropContext.Provider>
    <DragOverlay dropAnimation={null}>{dragging?<div className="ee-drag-overlay">{dragLabel}</div>:null}</DragOverlay>
  </DndContext>
}

function collectClasses(node:BuilderNode):string[]{
  return [...(node.classes||[]),...(node.children||[]).flatMap(collectClasses)]
}
