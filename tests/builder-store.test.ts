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

    // New pages reuse the site's navigation and footer and start with an editable heading.
    expect(about!.root.children.length).toBeGreaterThan(0)
    expect(JSON.stringify(about!.root)).toContain('About Us')

    // Renaming keeps the web address so links to the page keep working.
    useBuilderStore.getState().renamePage(about!.id,'Company')
    state=useBuilderStore.getState()
    expect(state.project.pages.find(page=>page.id===about!.id)?.name).toBe('Company')
    expect(state.project.pages.find(page=>page.id===about!.id)?.slug).toBe('/about-us')

    // A second page with the same name gets a unique address.
    useBuilderStore.getState().addPage('About Us')
    state=useBuilderStore.getState()
    expect(state.project.pages.filter(page=>page.slug.startsWith('/about-us')).map(p=>p.slug).sort()).toEqual(['/about-us','/about-us-2'])
    useBuilderStore.getState().deletePage(state.project.activePageId)

    // Changing an address updates links that pointed to it.
    const home=useBuilderStore.getState().project.pages.find(p=>p.id===homeId)!
    useBuilderStore.getState().setActivePage(homeId)
    const link=JSON.stringify(home.root).match(/"id":"([^"]+)","type":"link"/)?.[1]
    if(link){
      useBuilderStore.getState().updateNodeAttribute(link,'href','/about-us')
      useBuilderStore.getState().updatePageSeo(about!.id,'slug','/company')
      const updated=JSON.stringify(useBuilderStore.getState().project.pages.find(p=>p.id===homeId)!.root)
      expect(updated).toContain('"href":"/company"')
      expect(updated).not.toContain('"href":"/about-us"')
    }

    useBuilderStore.getState().setActivePage(homeId)
    useBuilderStore.getState().deletePage(homeId)
    state=useBuilderStore.getState()
    expect(state.project.pages.some(page=>page.id===homeId)).toBe(true)

    useBuilderStore.getState().deletePage(about!.id)
    state=useBuilderStore.getState()
    expect(state.project.pages.some(page=>page.id===about!.id)).toBe(false)
    expect(state.project.pages[0].slug).toBe('/')
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
