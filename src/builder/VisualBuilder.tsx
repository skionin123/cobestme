import React, { useEffect, useMemo, useRef } from 'react'
import { ChevronDown, Monitor, Redo2, Save, Settings2, Smartphone, Tablet, Undo2 } from 'lucide-react'
import { createCanvasDocument } from './canvas'
import { loadProject, saveProject } from './persistence'
import { useBuilderStore } from './store'
import type { BreakpointId, BuilderNode } from './types'
import './visual-builder.css'

const widths:Record<BreakpointId,number>={desktop:1440,tablet:991,mobileLandscape:767,mobilePortrait:478}

function findNode(node:BuilderNode,id:string|null):BuilderNode|null{
  if(!id)return null
  if(node.id===id)return node
  for(const child of node.children||[]){
    const found=findNode(child,id)
    if(found)return found
  }
  return null
}

function treeRows(node:BuilderNode,depth=0):React.ReactNode[]{
  return [
    <NavigatorRow key={node.id} node={node} depth={depth}/>,
    ...(node.children||[]).flatMap(child=>treeRows(child,depth+1)),
  ]
}

function NavigatorRow({node,depth}:{node:BuilderNode;depth:number}){
  const selected=useBuilderStore(s=>s.selectedNodeId)
  const selectNode=useBuilderStore(s=>s.selectNode)
  return <button className={'vb-tree-row '+(selected===node.id?'is-selected':'')} style={{paddingLeft:12+depth*16}} onClick={()=>selectNode(node.id)}>
    <span>{node.type}</span><strong>{node.name}</strong>
  </button>
}

export default function VisualBuilder(){
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
  const undo=useBuilderStore(s=>s.undo)
  const redo=useBuilderStore(s=>s.redo)

  const activePage=project.pages.find(p=>p.id===project.activePageId)||project.pages[0]
  const selectedNode=findNode(activePage.root,selectedNodeId)
  const documentHtml=useMemo(()=>createCanvasDocument(project),[project])

  useEffect(()=>{
    let alive=true
    loadProject(project.id).then(saved=>{if(alive&&saved)replaceProject(saved,false)}).catch(()=>{})
    return()=>{alive=false}
  },[])

  useEffect(()=>{
    const handler=(event:MessageEvent)=>{
      const msg=event.data||{}
      if(msg.source!=='cobest-builder')return
      if(msg.type==='select')selectNode(msg.id||null)
      if(msg.type==='hover')hoverNode(msg.id||null)
    }
    window.addEventListener('message',handler)
    return()=>window.removeEventListener('message',handler)
  },[selectNode,hoverNode])

  useEffect(()=>{
    iframeRef.current?.contentWindow?.postMessage({source:'cobest-editor',type:'selection',selected:selectedNodeId,hovered:hoveredNodeId},'*')
  },[selectedNodeId,hoveredNodeId,documentHtml])

  useEffect(()=>{
    if(saveStatus!=='dirty')return
    const timer=window.setTimeout(async()=>{
      setSaveStatus('saving')
      try{await saveProject(project);setSaveStatus('saved')}catch{setSaveStatus('error')}
    },650)
    return()=>window.clearTimeout(timer)
  },[project,saveStatus,setSaveStatus])

  const manualSave=async()=>{
    setSaveStatus('saving')
    try{await saveProject(project);setSaveStatus('saved')}catch{setSaveStatus('error')}
  }

  const breakpoints:[BreakpointId,string,React.ComponentType<{size?:number}>][]=[
    ['desktop','Desktop 1440',Monitor],
    ['tablet','Tablet 991',Tablet],
    ['mobileLandscape','Mobile L 767',Smartphone],
    ['mobilePortrait','Mobile P 478',Smartphone],
  ]

  return <div className="vb-shell">
    <header className="vb-topbar">
      <div className="vb-project"><div className="vb-brand">C</div><div><small>PROJECT</small><strong>{project.name}</strong></div></div>
      <button className="vb-page-switcher">{activePage.name}<ChevronDown size={14}/></button>
      <div className="vb-breakpoints">{breakpoints.map(([id,label,Icon])=><button key={id} title={label} className={breakpoint===id?'active':''} onClick={()=>setBreakpoint(id)}><Icon size={15}/><span>{label.split(' ')[0]}</span></button>)}</div>
      <div className="vb-top-actions">
        <button disabled={!history.length} onClick={undo} title="Undo"><Undo2 size={16}/></button>
        <button disabled={!future.length} onClick={redo} title="Redo"><Redo2 size={16}/></button>
        <span className={'vb-save-status '+saveStatus}>{saveStatus==='saving'?'Saving…':saveStatus==='error'?'Save failed':saveStatus==='dirty'?'Unsaved':'Saved locally'}</span>
        <button onClick={manualSave}><Save size={15}/> Save</button>
        <button title="Project settings"><Settings2 size={16}/></button>
      </div>
    </header>
    <div className="vb-workspace">
      <aside className="vb-left">
        <div className="vb-panel-head"><span>Navigator</span><strong>{activePage.name}</strong></div>
        <div className="vb-tree">{treeRows(activePage.root)}</div>
      </aside>
      <main className="vb-stage">
        <div className="vb-stage-meta"><span>{breakpoint}</span><strong>{widths[breakpoint]} px</strong></div>
        <div className="vb-canvas-wrap" style={{width:Math.min(widths[breakpoint],1440)}}>
          <iframe ref={iframeRef} title="CoBest visual builder canvas" srcDoc={documentHtml} className="vb-canvas" onLoad={()=>iframeRef.current?.contentWindow?.postMessage({source:'cobest-editor',type:'selection',selected:selectedNodeId,hovered:hoveredNodeId},'*')}/>
        </div>
      </main>
      <aside className="vb-right">
        <div className="vb-panel-head"><span>Style</span><strong>{selectedNode?.name||'Nothing selected'}</strong></div>
        {selectedNode?<div className="vb-inspector">
          <div><small>ELEMENT</small><strong>{selectedNode.type}</strong></div>
          <label>ID<input value={selectedNode.id} readOnly/></label>
          <label>Tag<input value={selectedNode.tag} readOnly/></label>
          <label>Classes<input value={selectedNode.classes.join(' ')||'—'} readOnly/></label>
          <p>Phase 1 selection is live. Full class-based styling and breakpoint overrides arrive in Phase 3.</p>
        </div>:<div className="vb-empty">Select an element on the canvas or in the Navigator.</div>}
      </aside>
    </div>
  </div>
}
