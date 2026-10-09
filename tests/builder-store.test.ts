import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultProject } from '../src/builder/defaultProject'
import { createElement } from '../src/builder/elements'
import { useBuilderStore } from '../src/builder/store'
import { findNode } from '../src/builder/tree'

describe('MVP builder state history',()=>{
  beforeEach(()=>{
    useBuilderStore.getState().replaceProject(createDefaultProject(),false)
    useBuilderStore.getState().setBreakpoint('desktop')
    useBuilderStore.getState().setStyleState('none')
  })

  it('supports add, edit, style, move, duplicate, undo and redo',()=>{
    const store=useBuilderStore.getState()
    const rootId=store.project.pages[0].root.id
    const section=createElement('section')
    store.addNode(rootId,section)
    const container=createElement('container')
    useBuilderStore.getState().addNode(section.id,container)
    const heading=createElement('heading')
    useBuilderStore.getState().addNode(container.id,heading)
    useBuilderStore.getState().updateNode(heading.id,{content:'MVP heading'})
    useBuilderStore.getState().addClass(heading.id,'mvp-heading')
    useBuilderStore.getState().setStyle('mvp-heading','fontSize','48px','desktop','none')
    useBuilderStore.getState().setStyle('mvp-heading','fontSize','38px','tablet','none')
    useBuilderStore.getState().setStyle('mvp-heading','fontSize','30px','mobilePortrait','none')

    const paragraph=createElement('paragraph')
    useBuilderStore.getState().addNode(container.id,paragraph)
    useBuilderStore.getState().moveNode(paragraph.id,section.id,0)
    useBuilderStore.getState().duplicateNode(heading.id)

    let state=useBuilderStore.getState()
    expect(findNode(state.project.pages[0].root,heading.id)?.content).toBe('MVP heading')
    expect(state.project.styles['mvp-heading'].desktop.none.fontSize).toBe('48px')
    expect(state.project.styles['mvp-heading'].tablet?.none?.fontSize).toBe('38px')
    expect(state.project.styles['mvp-heading'].mobilePortrait?.none?.fontSize).toBe('30px')
    expect(findNode(state.project.pages[0].root,section.id)?.children[0].id).toBe(paragraph.id)
    const containerAfter=findNode(state.project.pages[0].root,container.id)
    expect(containerAfter?.children.filter(node=>node.type==='heading')).toHaveLength(2)

    useBuilderStore.getState().undo()
    state=useBuilderStore.getState()
    expect(findNode(state.project.pages[0].root,container.id)?.children.filter(node=>node.type==='heading')).toHaveLength(1)

    useBuilderStore.getState().redo()
    state=useBuilderStore.getState()
    expect(findNode(state.project.pages[0].root,container.id)?.children.filter(node=>node.type==='heading')).toHaveLength(2)
    expect(state.saveStatus).toBe('dirty')
  })

  it('does not create history or select a phantom node for invalid nesting',()=>{
    const store=useBuilderStore.getState()
    const page=store.project.pages[0]
    const paragraph=findNode(page.root,'hero-copy-home')
    expect(paragraph).not.toBeNull()
    const heading=createElement('heading')
    const historyBefore=store.history.length
    store.addNode(paragraph!.id,heading)
    const state=useBuilderStore.getState()
    expect(findNode(state.project.pages[0].root,heading.id)).toBeNull()
    expect(state.history).toHaveLength(historyBefore)
    expect(state.selectedNodeId).not.toBe(heading.id)
  })
})
