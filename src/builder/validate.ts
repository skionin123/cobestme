// Checks and repairs a website project that comes from outside the running
// editor: a backup file, the cloud copy, this browser's saved draft or the
// published snapshot. A damaged project must never crash the editor or the
// live store page, so anything unexpected is dropped or replaced by a default.
import { safeUrl } from './compiler'
import { createDefaultProject } from './defaultProject'
import { uid } from './tree'
import type {
  BuilderAsset, BuilderComponent, BuilderInteraction, BuilderNode, BuilderNodeType, BuilderPage, BuilderProject,
  BuilderProjectSnapshot, BuilderVersion, BreakpointId, ClassStyles, CmsCollection, CssProperties, NodeState, StyleMap,
} from './types'

const NODE_TYPES=new Set<string>([
  'section','container','div','grid','flex','columns','heading','paragraph','link','button','richText','list','quote',
  'image','video','icon','backgroundVideo','form','input','textarea','select','checkbox','radio','submit',
  'navbar','dropdown','footer','tabs','slider','lightbox','html','collectionList',
])
// Tags that would change the document itself are replaced by a plain box.
const BLOCKED_TAGS=new Set(['html','head','body','base','meta','link','title','script','style','object','embed','frame','frameset','template','noscript','svg','math'])
const BREAKPOINTS:BreakpointId[]=['desktop','tablet','mobileLandscape','mobilePortrait']
const STATES:NodeState[]=['none','hover','pressed','focused']
const TRIGGERS=new Set(['page-load','scroll-into-view','hover','click'])
const ANIMATIONS=new Set(['fade','slide-up','slide-left','scale','rotate'])

const MAX_DEPTH=60
const MAX_NODES=6000

const isObject=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)
const text=(value:unknown,max:number,fallback='')=>typeof value==='string'?value.slice(0,max):typeof value==='number'?String(value):fallback
const list=(value:unknown,max:number)=>Array.isArray(value)?value.slice(0,max):[]
const className=(value:unknown)=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(value)?value:''

function stringRecord(value:unknown,maxKeys:number,maxValue:number,keyTest:(key:string)=>boolean=()=>true):Record<string,string>{
  const out:Record<string,string>={}
  if(!isObject(value))return out
  let count=0
  for(const [key,item] of Object.entries(value)){
    if(count>=maxKeys)break
    if(!keyTest(key))continue
    if(typeof item==='string')out[key]=item.slice(0,maxValue)
    else if(typeof item==='number'&&Number.isFinite(item))out[key]=String(item)
    else if(item===true)out[key]='true'
    else continue
    count++
  }
  return out
}

const cssProps=(value:unknown):CssProperties=>stringRecord(value,120,2000,key=>/^[a-zA-Z-]{1,60}$/.test(key))
const attributeName=(key:string)=>/^[a-zA-Z_:][-a-zA-Z0-9_:.]{0,60}$/.test(key)&&!/^on/i.test(key)&&key.toLowerCase()!=='srcdoc'

function normalizeNode(value:unknown,depth:number,budget:{left:number},ids:Set<string>):BuilderNode|null{
  if(!isObject(value)||depth>MAX_DEPTH||budget.left<=0)return null
  budget.left--
  const type=(NODE_TYPES.has(String(value.type))?String(value.type):'div') as BuilderNodeType
  let tag=text(value.tag,24,'div').toLowerCase()
  if(!/^[a-z][a-z0-9-]*$/.test(tag)||BLOCKED_TAGS.has(tag))tag='div'
  let id=text(value.id,120)
  if(!id||ids.has(id))id=uid(type)
  ids.add(id)
  const attributes:Record<string,string>={}
  if(isObject(value.attributes)){
    for(const [key,item] of Object.entries(value.attributes).slice(0,60)){
      if(!attributeName(key))continue
      if(typeof item!=='string'&&typeof item!=='number'&&item!==true)continue
      attributes[key]=String(item).slice(0,key==='data-html'?200000:8000)
    }
  }
  const node:BuilderNode={
    id,type,tag,
    name:text(value.name,120)||'Element',
    classes:Array.from(new Set(list(value.classes,40).map(className).filter(Boolean))),
    attributes,
    children:list(value.children,400).map(child=>normalizeNode(child,depth+1,budget,ids)).filter((child):child is BuilderNode=>!!child),
  }
  if(typeof value.content==='string')node.content=value.content.slice(0,200000)
  if(value.hidden===true)node.hidden=true
  if(value.locked===true)node.locked=true
  if(typeof value.componentId==='string')node.componentId=value.componentId.slice(0,120)
  if(typeof value.componentInstanceId==='string')node.componentInstanceId=value.componentInstanceId.slice(0,160)
  return node
}

function normalizeStyles(value:unknown):StyleMap{
  const out:StyleMap={}
  if(!isObject(value))return out
  for(const [name,raw] of Object.entries(value).slice(0,4000)){
    if(!className(name)||!isObject(raw))continue
    const entry:ClassStyles={desktop:{none:{}}}
    for(const breakpoint of BREAKPOINTS){
      const states=raw[breakpoint]
      if(!isObject(states))continue
      const target:Partial<Record<NodeState,CssProperties>>={}
      for(const state of STATES)if(isObject(states[state]))target[state]=cssProps(states[state])
      if(breakpoint==='desktop')entry.desktop={...target,none:target.none||{}}
      else if(Object.keys(target).length)entry[breakpoint]=target
    }
    out[name]=entry
  }
  return out
}

function normalizePage(value:unknown,index:number,pageIds:Set<string>,nodeIds:Set<string>):BuilderPage|null{
  if(!isObject(value))return null
  let id=text(value.id,120)
  if(!id||pageIds.has(id))id=uid('page')
  pageIds.add(id)
  const name=text(value.name,120)||('Page '+(index+1))
  let slug=text(value.slug,200).trim()
  if(!slug.startsWith('/'))slug='/'+slug
  slug=slug.replace(/[\s"'<>]/g,'-')
  const seo=isObject(value.seo)?value.seo:{}
  const root=normalizeNode(value.root,0,{left:MAX_NODES},nodeIds)
    ||{id:uid('root'),type:'div',tag:'main',name:'Page',classes:['page-shell'],attributes:{},children:[]}
  const page:BuilderPage={
    id,name,slug,
    seo:{title:text(seo.title,200)||name,description:text(seo.description,600),slug},
    root,
  }
  const ogImage=text(seo.ogImage,2000)
  if(ogImage&&safeUrl(ogImage,true))page.seo.ogImage=ogImage
  if(value.isCollectionTemplate===true)page.isCollectionTemplate=true
  if(typeof value.collectionId==='string')page.collectionId=value.collectionId.slice(0,120)
  return page
}

function normalizeSnapshot(value:unknown):BuilderProjectSnapshot|null{
  if(!isObject(value)||!Array.isArray(value.pages))return null
  const defaults=createDefaultProject()
  const pageIds=new Set<string>(),nodeIds=new Set<string>()
  const pages=list(value.pages,200).map((page,index)=>normalizePage(page,index,pageIds,nodeIds)).filter((page):page is BuilderPage=>!!page)
  if(!pages.length)return null
  const globals=isObject(value.globals)?value.globals:{}
  const colors=stringRecord(globals.colors,60,200,key=>/^[a-zA-Z0-9_-]{1,40}$/.test(key))
  const textStyles:Record<string,CssProperties>={}
  if(isObject(globals.textStyles))for(const [key,item] of Object.entries(globals.textStyles).slice(0,40))if(/^[a-zA-Z0-9_-]{1,40}$/.test(key))textStyles[key]=cssProps(item)
  const assets:BuilderAsset[]=list(value.assets,500).filter(isObject).map(asset=>({
    id:text(asset.id,120)||uid('asset'),
    name:text(asset.name,200)||'Image',
    mimeType:text(asset.mimeType,80)||'image/*',
    url:safeUrl(text(asset.url,3_000_000),true),
    alt:text(asset.alt,300),
    createdAt:text(asset.createdAt,40)||new Date().toISOString(),
  })).filter(asset=>asset.url)
  const components:BuilderComponent[]=list(value.components,200).filter(isObject).map(component=>{
    const master=normalizeNode(component.master,0,{left:MAX_NODES},new Set())
    return master?{id:text(component.id,120)||uid('component'),name:text(component.name,120)||'Component',master,
      createdAt:text(component.createdAt,40)||new Date().toISOString(),updatedAt:text(component.updatedAt,40)||new Date().toISOString()}:null
  }).filter((component):component is BuilderComponent=>!!component)
  const number=(input:unknown,min:number,max:number,fallback:number)=>{const n=Number(input);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback}
  const interactions:BuilderInteraction[]=list(value.interactions,500).filter(isObject)
    .filter(item=>TRIGGERS.has(String(item.trigger))&&ANIMATIONS.has(String(item.animation))&&typeof item.nodeId==='string')
    .map(item=>({
      id:(text(item.id,120)||uid('interaction')).replace(/[^a-zA-Z0-9_-]/g,'-'),
      nodeId:String(item.nodeId).slice(0,120),
      trigger:item.trigger as BuilderInteraction['trigger'],
      animation:item.animation as BuilderInteraction['animation'],
      duration:number(item.duration,0,20000,500),
      delay:number(item.delay,0,20000,0),
      easing:/^[a-zA-Z0-9(),. -]{1,60}$/.test(String(item.easing))?String(item.easing):'ease-out',
    }))
  const collections:CmsCollection[]=list(value.collections,100).filter(isObject).map(collection=>({
    id:text(collection.id,120)||uid('collection'),
    name:text(collection.name,120)||'Collection',
    slug:text(collection.slug,120).replace(/[^a-z0-9-]/gi,'-').toLowerCase()||'collection',
    fields:list(collection.fields,60).filter(isObject).map(field=>({
      id:text(field.id,120)||uid('field'),name:text(field.name,120)||'Field',slug:text(field.slug,120)||'field',
      type:(['text','richText','image','link','date','reference'].includes(String(field.type))?field.type:'text') as CmsCollection['fields'][number]['type'],
      ...(field.required===true?{required:true}:{}),
    })),
    items:list(collection.items,2000).filter(isObject).map(item=>({
      id:text(item.id,120)||uid('item'),values:stringRecord(item.values,60,100000),
      createdAt:text(item.createdAt,40)||new Date().toISOString(),updatedAt:text(item.updatedAt,40)||new Date().toISOString(),
    })),
    ...(typeof collection.templatePageId==='string'?{templatePageId:collection.templatePageId.slice(0,120)}:{}),
  }))
  const activePageId=pages.some(page=>page.id===value.activePageId)?String(value.activePageId):pages[0].id
  const updatedAt=Number.isFinite(Date.parse(String(value.updatedAt)))?String(value.updatedAt):new Date().toISOString()
  return {
    id:text(value.id,120)||uid('project'),
    name:text(value.name,120)||'My website',
    version:Math.max(1,Math.floor(number(value.version,1,1e12,1))),
    activePageId,
    pages,
    // Class order is the CSS cascade order, so it is kept exactly as saved.
    styles:normalizeStyles(value.styles),
    globals:{
      colors:Object.keys(colors).length?{...defaults.globals.colors,...colors}:defaults.globals.colors,
      textStyles:Object.keys(textStyles).length?{...defaults.globals.textStyles,...textStyles}:defaults.globals.textStyles,
    },
    assets,components,interactions,collections,updatedAt,
  }
}

/**
 * Return a safe, complete copy of a project, or null when it cannot be used
 * at all (for example when it has no pages).
 */
export function normalizeProject(value:unknown):BuilderProject|null{
  let raw:unknown
  try{raw=JSON.parse(JSON.stringify(value))}catch{return null}
  const snapshot=normalizeSnapshot(raw)
  if(!snapshot)return null
  const versions:BuilderVersion[]=[]
  if(isObject(raw))for(const version of list(raw.versions,20)){
    if(!isObject(version))continue
    const project=normalizeSnapshot(version.project)
    if(project)versions.push({id:text(version.id,120)||uid('version'),label:text(version.label,120)||'Earlier version',
      createdAt:text(version.createdAt,40)||new Date().toISOString(),project})
  }
  return {...snapshot,versions}
}
