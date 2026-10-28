import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultProject } from '../src/builder/defaultProject'
import { createElement, createPrebuiltSection } from '../src/builder/elements'
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

  it('keeps selection valid when undo removes the selected node',()=>{
    const store=useBuilderStore.getState()
    const root=store.project.pages[0].root
    const section=createElement('section')
    store.addNode(root.id,section)
    expect(useBuilderStore.getState().selectedNodeId).toBe(section.id)
    useBuilderStore.getState().undo()
    const state=useBuilderStore.getState()
    expect(findNode(state.project.pages[0].root,section.id)).toBeNull()
    expect(state.selectedNodeId).toBe(state.project.pages[0].root.id)
  })

  it('deleting a parent removes its subtree and undo restores it',()=>{
    const store=useBuilderStore.getState()
    const root=store.project.pages[0].root
    const section=createElement('section')
    store.addNode(root.id,section)
    const container=createElement('container')
    useBuilderStore.getState().addNode(section.id,container)
    const heading=createElement('heading')
    useBuilderStore.getState().addNode(container.id,heading)

    useBuilderStore.getState().deleteNode(section.id)
    let state=useBuilderStore.getState()
    expect(findNode(state.project.pages[0].root,section.id)).toBeNull()
    expect(findNode(state.project.pages[0].root,heading.id)).toBeNull()

    useBuilderStore.getState().undo()
    state=useBuilderStore.getState()
    expect(findNode(state.project.pages[0].root,section.id)).not.toBeNull()
    expect(findNode(state.project.pages[0].root,heading.id)).not.toBeNull()
  })

  it('creates, renames, switches and deletes only non-required pages',()=>{
    const store=useBuilderStore.getState()
    const homeId=store.project.pages[0].id
    store.addPage('About Us')
    let state=useBuilderStore.getState()
    const about=state.project.pages.find(page=>page.name==='About Us')
    expect(about?.slug).toBe('/about-us')
    expect(state.project.activePageId).toBe(about?.id)

    useBuilderStore.getState().renamePage(about!.id,'Company')
    state=useBuilderStore.getState()
    expect(state.project.pages.find(page=>page.id===about!.id)?.slug).toBe('/company')

    useBuilderStore.getState().setActivePage(homeId)
    useBuilderStore.getState().deletePage(homeId)
    state=useBuilderStore.getState()
    expect(state.project.pages.some(page=>page.id===homeId)).toBe(true)

    useBuilderStore.getState().deletePage(about!.id)
    state=useBuilderStore.getState()
    expect(state.project.pages.some(page=>page.id===about!.id)).toBe(false)
    expect(state.project.pages[0].slug).toBe('/')
  })

  it('moves only top-level sections while preserving the header and supporting Undo',()=>{
    const store=useBuilderStore.getState()
    const root=store.project.pages[0].root
    const features=createPrebuiltSection('features')
    const faq=createPrebuiltSection('faq')
    store.addNode(root.id,features)
    useBuilderStore.getState().addNode(root.id,faq)
    const layout=()=>useBuilderStore.getState().project.pages[0].root.children.map(n=>n.name)
    expect(layout()).toEqual(['Navbar','Hero','Features','FAQ'])
    useBuilderStore.getState().reorderSection(features.id,1)
    expect(layout()).toEqual(['Navbar','Hero','FAQ','Features'])
    useBuilderStore.getState().undo()
    expect(layout()).toEqual(['Navbar','Hero','Features','FAQ'])
    useBuilderStore.getState().redo()
    expect(layout()).toEqual(['Navbar','Hero','FAQ','Features'])
    const before=useBuilderStore.getState().history.length
    useBuilderStore.getState().reorderSection('hero-home',-1)
    expect(layout()[0]).toBe('Navbar')
    expect(useBuilderStore.getState().history.length).toBe(before)
  })

  it('restores a saved earlier design as a newer revision and keeps a recovery snapshot',()=>{
    const store=useBuilderStore.getState()
    const root=store.project.pages[0].root
    const section=createPrebuiltSection('features')
    store.addNode(root.id,section)
    useBuilderStore.getState().setSaveStatus('saved')
    const originalVersion=useBuilderStore.getState().project.version
    useBuilderStore.getState().updateNode(section.id,{name:'Modified features'})
    const snapshot=useBuilderStore.getState().project
    const restoreTarget=snapshot.versions.find(v=>v.project.pages[0].root.children.some(n=>n.id===section.id&&n.name==='Features'))
    expect(restoreTarget).toBeDefined()
    useBuilderStore.getState().restoreVersion(restoreTarget!.id)
    const restored=useBuilderStore.getState()
    expect(restored.project.version).toBeGreaterThan(snapshot.version)
    expect(restored.project.version).toBeGreaterThan(originalVersion)
    expect(restored.saveStatus).toBe('dirty')
    expect(findNode(restored.project.pages[0].root,section.id)?.name).toBe('Features')
    expect(restored.project.versions[0].label).toBe('Before version restore')
    restored.undo()
    expect(findNode(useBuilderStore.getState().project.pages[0].root,section.id)?.name).toBe('Modified features')
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
