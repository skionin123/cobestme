import { findNode } from './tree'
import type { BreakpointId, BuilderProject, CssProperties } from './types'

export type GeometryChange=
  | {kind:'move';x:number;y:number}
  | {kind:'resize';width:number;height?:number;fontSize?:number;x?:number;y?:number;frame?:boolean;paddingTop?:number;paddingBottom?:number}
  | {kind:'font-size';fontSize:number}
  | {kind:'reset'}

const bounded=(value:number,min:number,max:number)=>
  Number.isFinite(value)?Math.round(Math.max(min,Math.min(max,value))):null

export function geometryClass(id:string){
  return 'cb-geometry-'+id.replace(/[^a-zA-Z0-9_-]/g,'-')
}

/**
 * One element-specific style rule per node. The regular responsive compiler
 * renders these rules in editing, preview, published pages and ZIP exports.
 * Changes are committed once on pointer-up, so Undo is one operation.
 *
 * Translate leaves the element in document flow (safer than absolute
 * positioning), while letting the user place its visible box precisely.
 */
export function applyNodeGeometry(
  project:BuilderProject,nodeId:string,breakpoint:BreakpointId,change:GeometryChange,
){
  const page=project.pages.find(p=>p.id===project.activePageId)||project.pages[0]
  if(!page||nodeId===page.root.id)return false
  const node=findNode(page.root,nodeId)
  if(!node||node.locked)return false
  const className=geometryClass(nodeId)
  if(!node.classes.includes(className))node.classes.push(className)
  const css=project.styles[className]||(project.styles[className]={desktop:{none:{}}})
  const state=breakpoint==='desktop'?css.desktop:(css[breakpoint]||(css[breakpoint]={}))
  const props:CssProperties=state.none||(state.none={})
  if(change.kind==='move'){
    const x=bounded(change.x,-5000,5000),y=bounded(change.y,-5000,5000)
    if(x===null||y===null)return false
    props.translate=x+'px '+y+'px'
  }else if(change.kind==='resize'){
    const width=bounded(change.width,32,4000)
    if(width===null)return false
    props.width=width+'px'
    props.maxWidth='none'
    // A section/frame is a layout box. Removing its theme's fixed minimum
    // height lets the user reduce blank space without scaling child content.
    if(change.frame&&change.height!=null){
      props.minHeight='0px'
      if(change.paddingTop!=null){
        const top=bounded(change.paddingTop,0,2000)
        if(top!==null)props.paddingTop=top+'px'
      }
      if(change.paddingBottom!=null){
        const bottom=bounded(change.paddingBottom,0,2000)
        if(bottom!==null)props.paddingBottom=bottom+'px'
      }
    }
    if(change.x!=null||change.y!=null){
      const current=String(props.translate||'0px 0px').split(/\\s+/)
      const x=bounded(change.x??parseFloat(current[0]),-5000,5000)
      const y=bounded(change.y??parseFloat(current[1]),-5000,5000)
      if(x!==null&&y!==null)props.translate=x+'px '+y+'px'
    }
    if(change.height!=null){
      const height=bounded(change.height,20,4000)
      if(height!==null)props.height=height+'px'
    }
    if(change.fontSize!=null){
      const size=bounded(change.fontSize,10,240)
      if(size!==null)props.fontSize=size+'px'
    }
  }else if(change.kind==='font-size'){
    const size=bounded(change.fontSize,10,240)
    if(size===null)return false
    props.fontSize=size+'px'
  }else{
    for(const key of ['translate','width','height','fontSize','maxWidth','minHeight','paddingTop','paddingBottom'])delete props[key]
  }
  return true
}
