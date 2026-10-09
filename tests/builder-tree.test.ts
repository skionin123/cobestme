import { describe, expect, it } from 'vitest'
import { createDefaultProject } from '../src/builder/defaultProject'
import { findNode, insertNode, moveNode, regenerateNodeIds } from '../src/builder/tree'
import { createElement } from '../src/builder/elements'

describe('builder tree',()=>{
  it('inserts and finds nested nodes',()=>{
    const project=createDefaultProject()
    const root=project.pages[0].root
    const section=createElement('section')
    const next=insertNode(root,root.id,section)
    expect(findNode(next,section.id)?.type).toBe('section')
  })

  it('moves a node between parents without duplicating it',()=>{
    const project=createDefaultProject()
    const root=project.pages[0].root
    const first=createElement('section')
    const second=createElement('section')
    let next=insertNode(root,root.id,first)
    next=insertNode(next,root.id,second)
    const child=createElement('paragraph')
    next=insertNode(next,first.id,child)
    next=moveNode(next,child.id,second.id)
    expect(findNode(next,first.id)?.children.some(x=>x.id===child.id)).toBe(false)
    expect(findNode(next,second.id)?.children.some(x=>x.id===child.id)).toBe(true)
  })

  it('refuses to move a parent into its own descendant',()=>{
    const project=createDefaultProject()
    const root=project.pages[0].root
    const section=createElement('section')
    const child=createElement('div')
    let next=insertNode(root,root.id,section)
    next=insertNode(next,section.id,child)
    const attempted=moveNode(next,section.id,child.id)
    expect(findNode(attempted,root.id)?.children.some(x=>x.id===section.id)).toBe(true)
  })

  it('rejects inserting children into content-only elements',()=>{
    const project=createDefaultProject()
    const root=project.pages[0].root
    const paragraph=createElement('paragraph')
    let next=insertNode(root,root.id,paragraph)
    const heading=createElement('heading')
    const attempted=insertNode(next,paragraph.id,heading)
    expect(findNode(attempted,heading.id)).toBeNull()
    expect(findNode(attempted,paragraph.id)?.children).toHaveLength(0)
  })

  it('rejects moving an element into an invalid parent',()=>{
    const project=createDefaultProject()
    const root=project.pages[0].root
    const section=createElement('section')
    const paragraph=createElement('paragraph')
    const button=createElement('button')
    let next=insertNode(root,root.id,section)
    next=insertNode(next,section.id,paragraph)
    next=insertNode(next,section.id,button)
    const attempted=moveNode(next,button.id,paragraph.id)
    expect(findNode(attempted,section.id)?.children.map(x=>x.id)).toContain(button.id)
    expect(findNode(attempted,paragraph.id)?.children).toHaveLength(0)
  })

  it('regenerates IDs for duplicated subtrees',()=>{
    const node=createElement('form')
    const copy=regenerateNodeIds(node,'copy')
    expect(copy.id).not.toBe(node.id)
    expect(copy.children[0].id).not.toBe(node.children[0].id)
  })
})
