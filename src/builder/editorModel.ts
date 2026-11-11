import { canAcceptChild, canAcceptChildren, findNode, findParent } from './tree'
import type { BuilderNode, BuilderPage, BuilderProject } from './types'

/** Plain-language names for element types shown to business owners. */
export const friendlyType:Record<string,string>={
  section:'Section',container:'Container',div:'Box',grid:'Grid',flex:'Row',columns:'Columns',
  heading:'Heading',paragraph:'Text',link:'Link',button:'Button',richText:'Rich text',list:'List',quote:'Quote',
  image:'Image',video:'Video',icon:'Icon',backgroundVideo:'Background video',
  form:'Form',input:'Input field',textarea:'Message field',select:'Dropdown field',checkbox:'Checkbox',radio:'Option',submit:'Submit button',
  navbar:'Navigation',dropdown:'Dropdown menu',footer:'Footer',
  tabs:'Tabs',slider:'Slider',lightbox:'Lightbox',html:'Custom code',collectionList:'Collection',
}

export const textTypes=new Set(['heading','paragraph','button','link','quote','submit'])
export const linkTypes=new Set(['link','button','lightbox'])

export function activePage(project:BuilderProject):BuilderPage{
  return project.pages.find(p=>p.id===project.activePageId)||project.pages[0]
}

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
 * Where a new section is placed: directly after the section the user is
 * working in, otherwise at the end of the page.
 */
export function sectionInsertTarget(project:BuilderProject,selectedId:string|null):InsertTarget{
  const page=activePage(project)
  const top=topLevelAncestor(page.root,selectedId)
  if(top){
    const index=page.root.children.findIndex(c=>c.id===top.id)
    return {parentId:page.root.id,index:index+1,description:'after “'+top.name+'”'}
  }
  return {parentId:page.root.id,description:'at the end of the page'}
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
 * element, or inside the last section of the page.
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
  const last=page.root.children.at(-1)
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

export type WorkflowStep='structure'|'content'|'mobile'|'publish'

export interface WorkflowProgress{
  structure:boolean
  content:boolean
  mobile:boolean
  publish:boolean
}

const PLACEHOLDER_TEXT=/^(build something remarkable\.?|heading|new heading|your heading here|paragraph|button|link|lorem ipsum.*|this page is rendered from.*)$/i

/** Simple, explainable progress used by the guide strip. */
export function workflowProgress(project:BuilderProject,flags:{previewedMobile:boolean;published:boolean}):WorkflowProgress{
  const sections=project.pages.reduce((n,p)=>n+p.root.children.length,0)
  let edited=0,placeholders=0
  for(const page of project.pages){
    const walk=(node:BuilderNode)=>{
      if(textTypes.has(node.type)&&node.content?.trim()){
        if(PLACEHOLDER_TEXT.test(node.content.trim()))placeholders++
        else edited++
      }
      node.children.forEach(walk)
    }
    walk(page.root)
  }
  return {
    structure:sections>=3,
    content:edited>0&&placeholders===0,
    mobile:flags.previewedMobile,
    publish:flags.published,
  }
}
