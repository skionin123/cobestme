import { describe, expect, it } from 'vitest'
import { createDefaultProject } from '../src/builder/defaultProject'
import { duplicateWithIndependentGeometry, nodeGeometryClass } from '../src/builder/duplicate'
import { applyNodeGeometry } from '../src/builder/geometry'
import { findNode } from '../src/builder/tree'
import { useBuilderStore } from '../src/builder/store'

describe('independent element duplication',()=>{
  it('clones unique responsive position/size rules, keeping shared theme classes',()=>{
    const project=createDefaultProject()
    const page=project.pages[0]
    applyNodeGeometry(project,'hero-title-home','desktop',{kind:'resize',width:450})
    applyNodeGeometry(project,'hero-title-home','mobilePortrait',{kind:'move',x:14,y:8})
    const source=findNode(page.root,'hero-title-home')!
    const originalClass=nodeGeometryClass(source.id)
    const {node,styles}=duplicateWithIndependentGeometry(source,project.styles)
    const newClass=nodeGeometryClass(node.id)
    expect(node.id).not.toBe(source.id)
    expect(node.classes).toContain('display')
    expect(node.classes).toContain(newClass)
    expect(node.classes).not.toContain(originalClass)
    expect(styles[newClass]).toEqual(project.styles[originalClass])
    styles[newClass].desktop.none.width='200px'
    expect(project.styles[originalClass].desktop.none.width).toBe('450px')
  })
  it('assigns independent geometry rules to every nested child',()=>{
    const project=createDefaultProject()
    const node=findNode(project.pages[0].root,'hero-inner-home')!
    const child=findNode(node,'hero-title-home')!
    applyNodeGeometry(project,child.id,'desktop',{kind:'move',x:50,y:9})
    const {node:copy,styles}=duplicateWithIndependentGeometry(node,project.styles)
    const newChild=findNode(copy,copy.children.find(x=>x.name===child.name)?.id||'')!
    expect(newChild).toBeTruthy()
    expect(styles[nodeGeometryClass(newChild.id)]).toEqual(project.styles[nodeGeometryClass(child.id)])
  })
  it('duplicates saved node styles independently in the actual Zustand store',()=>{
    const project=createDefaultProject()
    applyNodeGeometry(project,'hero-title-home','desktop',{kind:'move',x:33,y:7})
    useBuilderStore.getState().replaceProject(project,false)
    useBuilderStore.getState().duplicateNode('hero-title-home')
    const state=useBuilderStore.getState()
    const copy=state.selectedNodeId!
    const newClass=nodeGeometryClass(copy)
    expect(state.project.styles[newClass].desktop.none.translate).toBe('33px 7px')
    expect(newClass).not.toBe(nodeGeometryClass('hero-title-home'))
  })
})
