import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createCanvasDocument } from '../src/builder/canvas'
import { compileProjectCss, renderPageBody } from '../src/builder/compiler'
import { createDefaultProject } from '../src/builder/defaultProject'
import { createElement } from '../src/builder/elements'
import { exportFiles } from '../src/builder/export'
import { indexedDbRepository, loadProject, saveProject, setProjectRepository, type ProjectRepository } from '../src/builder/persistence'
import { useBuilderStore } from '../src/builder/store'
import { clone, findNode } from '../src/builder/tree'
import type { BuilderProject } from '../src/builder/types'

describe('CoBest MVP golden path',()=>{
  const records=new Map<string,BuilderProject>()
  const memory:ProjectRepository={
    async save(project){records.set(project.id,clone(project))},
    async load(id){const value=records.get(id);return value?clone(value):undefined},
    async remove(id){records.delete(id)}
  }

  beforeEach(()=>{
    records.clear()
    setProjectRepository(memory)
    const project=createDefaultProject()
    project.id='golden-path-project'
    project.name='Golden Path'
    project.pages[0].root.children=[]
    useBuilderStore.getState().replaceProject(project,false)
  })

  afterEach(()=>setProjectRepository(indexedDbRepository))

  it('builds, edits, styles, responds, saves, reopens, undoes/redoes and exports the same site',async()=>{
    const root=useBuilderStore.getState().project.pages[0].root

    const section=createElement('section')
    useBuilderStore.getState().addNode(root.id,section)
    const container=createElement('container')
    useBuilderStore.getState().addNode(section.id,container)
    const heading=createElement('heading')
    const paragraph=createElement('paragraph')
    const button=createElement('button')
    const image=createElement('image')
    useBuilderStore.getState().addNode(container.id,heading)
    useBuilderStore.getState().addNode(container.id,paragraph)
    useBuilderStore.getState().addNode(container.id,button)
    useBuilderStore.getState().addNode(container.id,image)

    useBuilderStore.getState().updateNode(heading.id,{content:'A professional website, built visually.'})
    useBuilderStore.getState().updateNode(paragraph.id,{content:'Clear structure, responsive styles, and dependable output.'})
    useBuilderStore.getState().updateNode(button.id,{content:'Get started'})
    useBuilderStore.getState().updateNodeAttribute(button.id,'href','/contact')

    // Reorder a sibling, then keep the content nested under the same valid container.
    useBuilderStore.getState().moveNode(image.id,container.id,1)
    let state=useBuilderStore.getState()
    expect(findNode(state.project.pages[0].root,container.id)?.children.map(n=>n.id)).toEqual([
      heading.id,image.id,paragraph.id,button.id
    ])

    useBuilderStore.getState().addClass(container.id,'mvp-stack')
    useBuilderStore.getState().setStyle('mvp-stack','display','flex','desktop','none')
    useBuilderStore.getState().setStyle('mvp-stack','flexDirection','column','desktop','none')
    useBuilderStore.getState().setStyle('mvp-stack','gap','24px','desktop','none')
    useBuilderStore.getState().setStyle('mvp-stack','paddingTop','48px','desktop','none')
    useBuilderStore.getState().setStyle('mvp-stack','paddingRight','48px','desktop','none')
    useBuilderStore.getState().setStyle('mvp-stack','paddingBottom','48px','desktop','none')
    useBuilderStore.getState().setStyle('mvp-stack','paddingLeft','48px','desktop','none')

    useBuilderStore.getState().addClass(heading.id,'mvp-heading')
    useBuilderStore.getState().setStyle('mvp-heading','fontSize','48px','desktop','none')
    useBuilderStore.getState().setStyle('mvp-heading','color','#17324d','desktop','none')
    useBuilderStore.getState().setStyle('mvp-heading','fontSize','38px','tablet','none')
    useBuilderStore.getState().setStyle('mvp-heading','fontSize','30px','mobilePortrait','none')

    state=useBuilderStore.getState()
    expect(state.project.styles['mvp-heading'].desktop.none.fontSize).toBe('48px')
    expect(state.project.styles['mvp-heading'].tablet?.none?.fontSize).toBe('38px')
    expect(state.project.styles['mvp-heading'].mobilePortrait?.none?.fontSize).toBe('30px')

    // Undo/redo must restore the actual document, not only UI state.
    useBuilderStore.getState().updateNode(heading.id,{content:'Temporary heading'})
    expect(findNode(useBuilderStore.getState().project.pages[0].root,heading.id)?.content).toBe('Temporary heading')
    useBuilderStore.getState().undo()
    expect(findNode(useBuilderStore.getState().project.pages[0].root,heading.id)?.content).toBe('A professional website, built visually.')
    useBuilderStore.getState().redo()
    expect(findNode(useBuilderStore.getState().project.pages[0].root,heading.id)?.content).toBe('Temporary heading')
    useBuilderStore.getState().undo()

    const finalProject=clone(useBuilderStore.getState().project)
    await saveProject(finalProject)
    const reopened=await loadProject(finalProject.id)
    expect(reopened).toEqual(finalProject)
    expect(findNode(reopened!.pages[0].root,heading.id)?.content).toBe('A professional website, built visually.')

    const expectedBody=renderPageBody(finalProject,finalProject.activePageId,false)
    const preview=createCanvasDocument(finalProject,'desktop',false)
    const files=exportFiles(finalProject)
    const exportedHtml=String(files['index.html'])
    const exportedCss=String(files['styles.css'])

    expect(preview).toContain(expectedBody)
    expect(exportedHtml).toContain(expectedBody)
    expect(exportedCss).toBe(compileProjectCss(finalProject))
    expect(exportedCss).toContain('.mvp-heading{font-size:48px;color:#17324d}')
    expect(exportedCss).toContain('@media(max-width:991px)')
    expect(exportedCss).toContain('font-size:38px')
    expect(exportedCss).toContain('@media(max-width:478px)')
    expect(exportedCss).toContain('font-size:30px')
    expect(exportedHtml).not.toContain('data-builder-node')
    expect(exportedHtml).not.toContain('builder-selected')
  })
})
