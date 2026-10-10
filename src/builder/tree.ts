import type { BuilderNode, BuilderPage, BuilderProject } from './types'

export const uid=(prefix='node')=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`

export const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value))

export function findNode(root:BuilderNode,id:string|null):BuilderNode|null{
  if(!id)return null
  if(root.id===id)return root
  for(const child of root.children||[]){
    const found=findNode(child,id)
    if(found)return found
  }
  return null
}

export function findParent(root:BuilderNode,id:string):BuilderNode|null{
  for(const child of root.children||[]){
    if(child.id===id)return root
    const found=findParent(child,id)
    if(found)return found
  }
  return null
}

export function walkNodes(root:BuilderNode,visit:(node:BuilderNode,parent:BuilderNode|null)=>void,parent:BuilderNode|null=null){
  visit(root,parent)
  for(const child of root.children||[])walkNodes(child,visit,root)
}

export function updateNode(root:BuilderNode,id:string,updater:(node:BuilderNode)=>BuilderNode):BuilderNode{
  if(root.id===id)return updater(root)
  return {...root,children:(root.children||[]).map(child=>updateNode(child,id,updater))}
}

export function removeNode(root:BuilderNode,id:string):{root:BuilderNode;removed:BuilderNode|null}{
  let removed:BuilderNode|null=null
  const next=(node:BuilderNode):BuilderNode=>({
    ...node,
    children:(node.children||[])
      .filter(child=>{
        if(child.id===id){removed=child;return false}
        return true
      })
      .map(next),
  })
  return {root:next(root),removed}
}

const containerTypes=new Set([
  'div','section','container','grid','flex','columns','form','navbar','footer','tabs','collectionList','dropdown','list','select'
])

export function canAcceptChildren(parent:BuilderNode){
  return containerTypes.has(parent.type)
}

export function canAcceptChild(parent:BuilderNode,child:BuilderNode){
  if(!canAcceptChildren(parent))return false
  if(parent.type==='list')return child.tag==='li'
  if(parent.type==='select')return child.tag==='option'
  if(parent.type==='navbar')return ['link','button','div','dropdown'].includes(child.type)
  return true
}

export function insertNode(root:BuilderNode,parentId:string,node:BuilderNode,index?:number):BuilderNode{
  const parent=findNode(root,parentId)
  if(!parent||!canAcceptChild(parent,node))return root
  return updateNode(root,parentId,current=>{
    const children=[...(current.children||[])]
    const at=index==null?children.length:Math.max(0,Math.min(index,children.length))
    children.splice(at,0,node)
    return {...current,children}
  })
}

export function moveNode(root:BuilderNode,nodeId:string,newParentId:string,index?:number):BuilderNode{
  if(nodeId===root.id||nodeId===newParentId)return root
  const newParent=findNode(root,newParentId)
  const moving=findNode(root,nodeId)
  if(!newParent||!moving||!canAcceptChild(newParent,moving))return root
  let invalid=false
  walkNodes(moving,n=>{if(n.id===newParentId)invalid=true})
  if(invalid)return root
  const oldParent=findParent(root,nodeId)
  const oldIndex=oldParent?.children.findIndex(x=>x.id===nodeId)??-1
  let targetIndex=index
  if(oldParent?.id===newParentId&&targetIndex!=null&&oldIndex>=0&&oldIndex<targetIndex)targetIndex=Math.max(0,targetIndex-1)
  const removed=removeNode(root,nodeId)
  if(!removed.removed)return root
  return insertNode(removed.root,newParentId,removed.removed,targetIndex)
}

export function regenerateNodeIds(node:BuilderNode,prefix='node'):BuilderNode{
  return {
    ...clone(node),
    id:uid(prefix),
    componentInstanceId:node.componentId?uid('instance'):node.componentInstanceId,
    children:(node.children||[]).map(child=>regenerateNodeIds(child,prefix)),
  }
}

export function replaceComponentInstances(project:BuilderProject,componentId:string,master:BuilderNode):BuilderProject{
  const pages=project.pages.map(page=>({
    ...page,
    root:replaceComponentInNode(page.root,componentId,master),
  }))
  return {...project,pages}
}

function replaceComponentInNode(node:BuilderNode,componentId:string,master:BuilderNode):BuilderNode{
  if(node.componentId===componentId){
    if(String(node.componentInstanceId||'').startsWith('master:'))return node
    const instanceId=node.componentInstanceId||uid('instance')
    const next=regenerateNodeIds(master,'component')
    return {...next,componentId,componentInstanceId:instanceId,name:node.name||master.name}
  }
  return {...node,children:(node.children||[]).map(child=>replaceComponentInNode(child,componentId,master))}
}

export function pageById(project:BuilderProject,pageId?:string):BuilderPage{
  return project.pages.find(p=>p.id===(pageId||project.activePageId))||project.pages[0]
}

export function slugify(value:string){
  const clean=value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
  return clean||'page'
}
