import { findNode } from './tree'
import { geometryClass } from './geometry'
import type { BreakpointId, BuilderProject, CssProperties } from './types'

export type SizingAxis='width'|'height'
export type SizingMode='theme'|'hug'|'fill'|'fixed'

const frameTypes=new Set(['section','container','div','flex','grid','columns','navbar','footer'])
const bounded=(n:number)=>Number.isFinite(n)?Math.min(4000,Math.max(32,Math.round(n))):null

/** Per-element responsive sizing, never a shared template-class edit. */
export function setElementSizing(
  project:BuilderProject,nodeId:string,breakpoint:BreakpointId,
  axis:SizingAxis,mode:SizingMode,pixels?:number,
):boolean{
  const page=project.pages.find(p=>p.id===project.activePageId)||project.pages[0]
  if(!page||page.root.id===nodeId)return false
  const node=findNode(page.root,nodeId)
  if(!node||node.locked)return false
  if(axis==='height'&&mode==='fill')return false
  const value=mode==='fixed'?bounded(pixels??(axis==='width'?320:240)):null
  if(mode==='fixed'&&value===null)return false
  const cls=geometryClass(nodeId)
  if(!node.classes.includes(cls))node.classes.push(cls)
  const style=project.styles[cls]||(project.styles[cls]={desktop:{none:{}}})
  const props:CssProperties=(breakpoint==='desktop'?style.desktop:
    (style[breakpoint]||(style[breakpoint]={}))).none||{}
  const target=breakpoint==='desktop'?style.desktop:style[breakpoint]!
  target.none=props

  if(axis==='width'){
    delete props.width
    delete props.maxWidth
    delete props.minWidth
    if(mode==='hug'){props.width='fit-content';props.maxWidth='100%'}
    if(mode==='fill'){props.width='100%';props.maxWidth='100%';props.minWidth='0px'}
    if(mode==='fixed'){props.width=value+'px';props.maxWidth='100%'}
  }else{
    delete props.height
    delete props.minHeight
    if(frameTypes.has(node.type)){
      // Restore the theme on Theme mode, including its original padding.
      if(mode==='theme'){
        delete props.paddingTop
        delete props.paddingBottom
      }else{
        props.minHeight='0px'
        props.paddingTop='16px'
        props.paddingBottom='16px'
      }
    }
    if(mode==='hug')props.height='auto'
    if(mode==='fixed')props.height=value+'px'
  }
  return true
}

export function getElementSizingMode(
  project:BuilderProject,nodeId:string,breakpoint:BreakpointId,axis:SizingAxis,
):SizingMode{
  const style=project.styles[geometryClass(nodeId)]
  const props=style?.[breakpoint]?.none||style?.desktop?.none||{}
  const value=props[axis]||''
  if(!value)return 'theme'
  if(axis==='width'&&value==='100%')return 'fill'
  if(value==='fit-content'||value==='auto')return 'hug'
  return /^\d+(?:\.\d+)?px$/.test(value)?'fixed':'theme'
}
