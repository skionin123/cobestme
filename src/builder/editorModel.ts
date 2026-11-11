import { createPrebuiltSection, type SectionContext } from './elements'
import { isSampleAddress, isSampleImage, isSampleText } from './samples'
import { canAcceptChild, canAcceptChildren, findNode, findParent, walkNodes } from './tree'
import type { BreakpointId, BuilderNode, BuilderPage, BuilderProject } from './types'

/** Plain-language names for element types shown to business owners. */
export const friendlyType:Record<string,string>={
  section:'Section',container:'Container',div:'Box',grid:'Grid',flex:'Row',columns:'Columns',
  heading:'Heading',paragraph:'Text',link:'Link',button:'Button',richText:'Rich text',list:'List',quote:'Quote',
  image:'Image',video:'Video',icon:'Icon',backgroundVideo:'Background video',
  form:'Form',input:'Field',textarea:'Message field',select:'Dropdown field',checkbox:'Checkbox',radio:'Option',submit:'Send button',
  navbar:'Menu bar',dropdown:'Dropdown menu',footer:'Footer',
  tabs:'Tabs',slider:'Slider',lightbox:'Lightbox',html:'Custom code',collectionList:'Collection',
}

/** The kind of element, unless its name already says so ("Hero · Section", but just "Footer"). */
export function typeLabel(node:{name:string;type:string}){
  const label=friendlyType[node.type]||node.type
  return label.toLowerCase()===node.name.trim().toLowerCase()?'':label
}

/** Names owners see for the three editing sizes. */
export const deviceName:Record<BreakpointId,string>={desktop:'Desktop',tablet:'Tablet',mobileLandscape:'Large phone',mobilePortrait:'Mobile'}

export const textTypes=new Set(['heading','paragraph','button','link','quote','submit'])
export const linkTypes=new Set(['link','button','lightbox'])
/** Blocks that only make sense directly on the page, never inside another box. */
export const pageBlockTypes=new Set(['section','navbar','footer'])

export function activePage(project:BuilderProject):BuilderPage{
  return project.pages.find(p=>p.id===project.activePageId)||project.pages[0]
}

/** What a new ready-made section should know about this website. */
export function sectionContext(project:BuilderProject):SectionContext{
  return {
    pages:project.pages.filter(page=>!page.isCollectionTemplate).map(page=>({name:page.name,slug:page.slug})),
    siteName:/^(untitled cobest site|essential|editorial)?$/i.test(project.name.trim())?undefined:project.name,
  }
}

/** A ready-made section whose menu and footer links match this website. */
export const createSectionFor=(project:BuilderProject,id:string)=>createPrebuiltSection(id,sectionContext(project))

/** The top-level section (direct child of the page body) that contains a node. */
export function topLevelAncestor(root:BuilderNode,nodeId:string|null):BuilderNode|null{
  if(!nodeId||nodeId===root.id)return null
  let current=findNode(root,nodeId)
  if(!current)return null
  let parent=findParent(root,current.id)
  while(parent&&parent.id!==root.id){current=parent;parent=findParent(root,current.id)}
  return current
}

export interface InsertTarget{parentId:string;index?:number;description:string}

/**
 * Where a new section is placed. A menu bar always goes to the top and a
 * footer to the bottom. Other sections go after the section being worked on,
 * but never above the menu bar or below the footer.
 */
export function sectionInsertTarget(project:BuilderProject,selectedId:string|null,sectionId=''):InsertTarget{
  const page=activePage(project)
  const sections=page.root.children
  if(sectionId==='navbar')return {parentId:page.root.id,index:0,description:'at the top of the page'}
  if(sectionId==='footer')return {parentId:page.root.id,index:sections.length,description:'at the bottom of the page'}
  const firstBody=sections[0]?.type==='navbar'?1:0
  const footerIndex=sections.findIndex(section=>section.type==='footer')
  const lastBody=footerIndex>=0?footerIndex:sections.length
  const top=topLevelAncestor(page.root,selectedId)
  if(top){
    const index=Math.min(lastBody,Math.max(firstBody,sections.findIndex(c=>c.id===top.id)+1))
    const before=sections[index-1]
    return {parentId:page.root.id,index,description:before?'after “'+before.name+'”':'at the top of the page'}
  }
  return {parentId:page.root.id,index:lastBody,description:footerIndex>=0?'above the footer':'at the end of the page'}
}

function firstContainer(node:BuilderNode):BuilderNode|null{
  if(node.type==='container')return node
  for(const child of node.children||[]){
    const found=firstContainer(child)
    if(found)return found
  }
  return null
}

/**
 * Where a new element is placed: inside a selected box, after a selected
 * element, or inside the last content section of the page.
 */
export function elementInsertTarget(project:BuilderProject,selectedId:string|null,child:BuilderNode):InsertTarget|null{
  const page=activePage(project)
  const selected=findNode(page.root,selectedId)
  if(selected&&selected.id!==page.root.id){
    if(canAcceptChildren(selected)&&canAcceptChild(selected,child))
      return {parentId:selected.id,description:'inside “'+selected.name+'”'}
    const parent=findParent(page.root,selected.id)
    if(parent&&canAcceptChild(parent,child)){
      const index=parent.children.findIndex(c=>c.id===selected.id)+1
      return {parentId:parent.id,index,description:'after “'+selected.name+'”'}
    }
  }
  // Prefer a normal content section over the menu bar or footer.
  const last=[...page.root.children].reverse().find(section=>section.type!=='footer'&&section.type!=='navbar')||page.root.children.at(-1)
  if(last){
    const target=firstContainer(last)||(canAcceptChildren(last)?last:null)
    if(target&&canAcceptChild(target,child))return {parentId:target.id,description:'inside “'+(target===last?last.name:last.name+' › '+target.name)+'”'}
  }
  return canAcceptChild(page.root,child)?{parentId:page.root.id,description:'at the end of the page'}:null
}

/** Siblings info for Move up / Move down buttons. */
export function siblingPosition(root:BuilderNode,nodeId:string){
  const parent=findParent(root,nodeId)
  if(!parent)return null
  const index=parent.children.findIndex(c=>c.id===nodeId)
  return {parent,index,count:parent.children.length}
}

export type DropZone='before'|'inside'|'after'

/**
 * Decide where a layer lands when it is dropped on another layer.
 * `zone` says which part of the target row the pointer is over.
 * Returns null when the move is not allowed, so nothing changes by accident.
 */
export function layerDropTarget(root:BuilderNode,movingId:string,targetId:string,zone:DropZone):{parentId:string;index:number;zone:DropZone;anchorId:string}|null{
  const moving=findNode(root,movingId)
  let target=findNode(root,targetId)
  if(!moving||!target||movingId===root.id)return null
  // A layer cannot be dropped into itself or something inside itself.
  if(findNode(moving,targetId))return null
  let mode=zone
  if(pageBlockTypes.has(moving.type)&&target.id!==root.id){
    // Whole sections stay directly on the page: snap to the section under the pointer.
    const top=topLevelAncestor(root,target.id)||target
    if(top.id===moving.id)return null
    if(top.id!==target.id||mode==='inside')mode=mode==='before'?'before':'after'
    target=top
  }
  if(target.id===root.id)return canAcceptChild(root,moving)?{parentId:root.id,index:root.children.length,zone:'inside',anchorId:root.id}:null
  if(mode==='inside'){
    if(canAcceptChildren(target)&&canAcceptChild(target,moving)&&!pageBlockTypes.has(moving.type))
      return {parentId:target.id,index:target.children.length,zone:'inside',anchorId:target.id}
    mode='after'
  }
  const parent=findParent(root,target.id)
  if(!parent||!canAcceptChild(parent,moving))return null
  if(pageBlockTypes.has(moving.type)&&parent.id!==root.id)return null
  const index=parent.children.findIndex(child=>child.id===target!.id)+(mode==='after'?1:0)
  return {parentId:parent.id,index,zone:mode,anchorId:target.id}
}

export type WorkflowStep='structure'|'content'|'mobile'|'publish'

export interface WorkflowProgress{
  structure:boolean
  content:boolean
  mobile:boolean
  publish:boolean
  /** How many sample texts and photos are still on the website. */
  samplesLeft:number
}

/** Visible text, links and photos that are still unchanged samples, in page order. */
export function findSamples(project:BuilderProject):{pageId:string;nodeId:string;text:string}[]{
  const found:{pageId:string;nodeId:string;text:string}[]=[]
  for(const page of project.pages){
    if(page.isCollectionTemplate)continue
    const walk=(node:BuilderNode)=>{
      if(node.hidden)return
      if(isSampleText(node.content)||isSampleAddress(node.attributes?.href)||(node.type==='image'&&isSampleImage(node.attributes?.src)))
        found.push({pageId:page.id,nodeId:node.id,text:node.content||(node.type==='image'?'Sample photo':'')})
      for(const child of node.children||[])walk(child)
    }
    walk(page.root)
  }
  return found
}

/** Simple, explainable progress used by the guide strip. */
export function workflowProgress(project:BuilderProject,flags:{previewedMobile:boolean;published:boolean}):WorkflowProgress{
  const sections=project.pages.reduce((n,p)=>n+p.root.children.length,0)
  let texts=0
  for(const page of project.pages)walkNodes(page.root,node=>{if(textTypes.has(node.type)&&node.content?.trim())texts++})
  const samplesLeft=findSamples(project).length
  return {
    structure:sections>=3,
    content:texts>0&&samplesLeft===0,
    mobile:flags.previewedMobile,
    publish:flags.published,
    samplesLeft,
  }
}
