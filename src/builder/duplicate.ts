import { clone, regenerateNodeIds } from './tree'
import type { BuilderNode, StyleMap } from './types'

/**
 * Element duplication must not reuse the original element's geometry class:
 * otherwise resizing either copy modifies both. Shared theme classes remain
 * shared intentionally, but per-element responsive overrides are independent.
 */
export const nodeGeometryClass=(id:string)=>
  'cb-geometry-'+id.replace(/[^a-zA-Z0-9_-]/g,'-')

export function duplicateWithIndependentGeometry(
  source:BuilderNode,
  styles:StyleMap,
  prefix='copy',
):{node:BuilderNode;styles:StyleMap}{
  const node=regenerateNodeIds(source,prefix)
  const ownStyles:StyleMap={}
  const transfer=(oldNode:BuilderNode,newNode:BuilderNode)=>{
    const oldClass=nodeGeometryClass(oldNode.id)
    const newClass=nodeGeometryClass(newNode.id)
    if(oldNode.classes.includes(oldClass)){
      newNode.classes=newNode.classes.map(name=>name===oldClass?newClass:name)
      if(styles[oldClass])ownStyles[newClass]=clone(styles[oldClass])
    }
    for(let i=0;i<(oldNode.children||[]).length;i++){
      transfer(oldNode.children[i],newNode.children[i])
    }
  }
  transfer(source,node)
  return {node,styles:ownStyles}
}
