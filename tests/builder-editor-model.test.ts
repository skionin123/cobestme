import { describe, expect, it } from 'vitest'
import { createDefaultProject } from '../src/builder/defaultProject'
import { activePage, createSectionFor, elementInsertTarget, findSamples, layerDropTarget, sectionContext, sectionInsertTarget, topLevelAncestor, typeLabel, workflowProgress } from '../src/builder/editorModel'
import { createElement, createPrebuiltSection } from '../src/builder/elements'
import { builderTemplates } from '../src/builder/templates'
import { findNode, walkNodes } from '../src/builder/tree'
import type { BuilderNode, BuilderProject } from '../src/builder/types'

/** A page with: menu bar, hero, features, footer. */
function sitePage():BuilderProject{
  const project=createDefaultProject()
  const root=project.pages[0].root
  root.children=[createPrebuiltSection('navbar'),createPrebuiltSection('hero'),createPrebuiltSection('features'),createPrebuiltSection('footer')]
  return project
}
const order=(project:BuilderProject)=>activePage(project).root.children.map(node=>node.type==='section'?node.name:node.type)
const place=(project:BuilderProject,selectedId:string|null,sectionId:string)=>{
  const target=sectionInsertTarget(project,selectedId,sectionId)
  const root=activePage(project).root
  root.children.splice(target.index??root.children.length,0,createPrebuiltSection(sectionId))
  return target
}

describe('where a new section goes',()=>{
  it('puts a menu bar first and a footer last, whatever is selected',()=>{
    const project=sitePage()
    const [,hero]=activePage(project).root.children
    expect(sectionInsertTarget(project,hero.id,'navbar')).toMatchObject({index:0,description:'at the top of the page'})
    expect(sectionInsertTarget(project,hero.id,'footer')).toMatchObject({index:4,description:'at the bottom of the page'})
  })
  it('adds after the section being worked on, even when something deep inside it is selected',()=>{
    const project=sitePage()
    const hero=activePage(project).root.children[1]
    let deepest:BuilderNode=hero
    walkNodes(hero,node=>{deepest=node})
    expect(deepest.id).not.toBe(hero.id)
    const target=place(project,deepest.id,'faq')
    expect(target.description).toBe('after “'+hero.name+'”')
    expect(order(project)).toEqual(['navbar','Hero','FAQ','Features','footer'])
  })
  it('never lands below the footer or above the menu bar',()=>{
    const project=sitePage()
    const [nav,,,footer]=activePage(project).root.children
    place(project,footer.id,'cta')
    expect(order(project).at(-1)).toBe('footer')
    place(project,nav.id,'gallery')
    expect(order(project)[0]).toBe('navbar')
    expect(order(project)[1]).toBe('Gallery')
  })
  it('with nothing selected, adds above the footer, or at the end when there is no footer',()=>{
    const project=sitePage()
    expect(sectionInsertTarget(project,null,'pricing')).toMatchObject({index:3,description:'above the footer'})
    activePage(project).root.children.pop()
    expect(sectionInsertTarget(project,null,'pricing')).toMatchObject({index:3,description:'at the end of the page'})
    // Selecting the page itself behaves like selecting nothing.
    expect(sectionInsertTarget(project,activePage(project).root.id,'pricing').index).toBe(3)
  })
  it('works on an empty page',()=>{
    const project=createDefaultProject()
    activePage(project).root.children=[]
    expect(sectionInsertTarget(project,null,'hero')).toMatchObject({index:0,description:'at the end of the page'})
  })
})

describe('where a new element goes',()=>{
  it('goes inside a selected box and after a selected element',()=>{
    const project=sitePage()
    const hero=activePage(project).root.children[1]
    const container=hero.children[0]
    const heading=container.children.find(node=>node.type==='heading')!
    expect(elementInsertTarget(project,container.id,createElement('paragraph'))).toMatchObject({parentId:container.id})
    const after=elementInsertTarget(project,heading.id,createElement('paragraph'))!
    expect(after.parentId).toBe(container.id)
    expect(after.index).toBe(container.children.findIndex(c=>c.id===heading.id)+1)
    expect(after.description).toBe('after “'+heading.name+'”')
  })
  it('with nothing selected, prefers the last content section over the footer',()=>{
    const project=sitePage()
    const features=activePage(project).root.children[2]
    const target=elementInsertTarget(project,null,createElement('paragraph'))!
    expect(findNode(features,target.parentId)).toBeTruthy()
    expect(target.description).toContain(features.name)
  })
})

describe('dragging layers',()=>{
  it('drops a section before or after another section, never inside one',()=>{
    const project=sitePage()
    const root=activePage(project).root
    const [,hero,features]=root.children
    expect(layerDropTarget(root,features.id,hero.id,'before')).toMatchObject({parentId:root.id,index:1,zone:'before'})
    expect(layerDropTarget(root,features.id,hero.id,'inside')).toMatchObject({parentId:root.id,index:2,zone:'after'})
    // Hovering something deep inside the hero still means "next to the hero".
    const deep=hero.children[0].children[0]
    expect(layerDropTarget(root,features.id,deep.id,'before')).toMatchObject({parentId:root.id,index:1,anchorId:hero.id})
    expect(layerDropTarget(root,features.id,deep.id,'after')).toMatchObject({parentId:root.id,index:2,anchorId:hero.id})
  })
  it('refuses to drop a layer into itself or its own contents',()=>{
    const project=sitePage()
    const root=activePage(project).root
    const hero=root.children[1]
    const container=hero.children[0]
    expect(layerDropTarget(root,hero.id,hero.id,'inside')).toBeNull()
    expect(layerDropTarget(root,hero.id,container.id,'inside')).toBeNull()
    expect(layerDropTarget(root,container.id,container.children[0].id,'after')).toBeNull()
    expect(layerDropTarget(root,root.id,hero.id,'before')).toBeNull()
    expect(layerDropTarget(root,'missing',hero.id,'before')).toBeNull()
    expect(layerDropTarget(root,hero.id,'missing','before')).toBeNull()
  })
  it('moves an element into a box, or next to an element that cannot hold others',()=>{
    const project=sitePage()
    const root=activePage(project).root
    const hero=root.children[1]
    const features=root.children[2]
    const heroBox=hero.children[0]
    const heading=heroBox.children.find(node=>node.type==='heading')!
    // The first card of the features grid.
    const featureBox=features.children.find(node=>node.type==='grid')!.children[0]
    expect(layerDropTarget(root,heading.id,featureBox.id,'inside')).toMatchObject({parentId:featureBox.id,index:featureBox.children.length,zone:'inside'})
    // A heading cannot contain things, so "inside" becomes "after".
    const text=featureBox.children.find(node=>!node.children.length)!
    const result=layerDropTarget(root,heading.id,text.id,'inside')!
    expect(result.zone).toBe('after')
    expect(result.parentId).toBe(featureBox.id)
    expect(result.index).toBe(featureBox.children.findIndex(c=>c.id===text.id)+1)
  })
  it('finds the section that owns any element',()=>{
    const project=sitePage()
    const root=activePage(project).root
    const hero=root.children[1]
    let deepest:BuilderNode=hero
    walkNodes(hero,node=>{deepest=node})
    expect(topLevelAncestor(root,deepest.id)?.id).toBe(hero.id)
    expect(topLevelAncestor(root,hero.id)?.id).toBe(hero.id)
    expect(topLevelAncestor(root,root.id)).toBeNull()
    expect(topLevelAncestor(root,null)).toBeNull()
    expect(topLevelAncestor(root,'missing')).toBeNull()
  })
})

describe('the guide tells the truth about progress',()=>{
  it('does not call the wording done while sample text is left',()=>{
    const project=builderTemplates[0].build()
    const before=workflowProgress(project,{previewedMobile:false,published:false})
    expect(before.structure).toBe(true)
    expect(before.content).toBe(false)
    expect(before.samplesLeft).toBeGreaterThan(0)
    expect(before.samplesLeft).toBe(findSamples(project).length)
    // Replace every sample with real wording.
    for(const sample of findSamples(project)){
      const node=findNode(project.pages.find(p=>p.id===sample.pageId)!.root,sample.nodeId)!
      if(node.type==='image')node.attributes.src='https://cdn.example.com/photo.jpg'
      else node.content='Fresh bread, baked every morning'
      if(node.attributes.href==='mailto:hello@example.com')node.attributes.href='mailto:owner@bakery.ph'
    }
    const after=workflowProgress(project,{previewedMobile:true,published:false})
    expect(after).toMatchObject({content:true,samplesLeft:0,mobile:true,publish:false})
  })
  it('ignores hidden elements and lists samples in page order',()=>{
    const project=builderTemplates[0].build()
    const samples=findSamples(project)
    const first=findNode(project.pages[0].root,samples[0].nodeId)!
    first.hidden=true
    expect(findSamples(project).map(s=>s.nodeId)).toEqual(samples.slice(1).map(s=>s.nodeId).filter(id=>!findNode(first,id)))
  })
})

describe('labels and section context',()=>{
  it('does not repeat the type when the name already says it',()=>{
    expect(typeLabel({name:'Footer',type:'footer'})).toBe('')
    expect(typeLabel({name:' menu bar ',type:'navbar'})).toBe('')
    expect(typeLabel({name:'Hero',type:'section'})).toBe('Section')
    expect(typeLabel({name:'Mystery',type:'whatever'})).toBe('whatever')
  })
  it('builds menu links from the real pages and skips placeholder site names',()=>{
    const project=createDefaultProject()
    project.pages.push({...project.pages[0],id:'p2',name:'Prices',slug:'/prices',root:{...project.pages[0].root,id:'r2',children:[]}})
    project.name='Untitled CoBest site'
    expect(sectionContext(project)).toEqual({pages:[{name:project.pages[0].name,slug:'/'},{name:'Prices',slug:'/prices'}],siteName:undefined})
    project.name='Bloom & Co'
    expect(sectionContext(project).siteName).toBe('Bloom & Co')
    const nav=createSectionFor(project,'navbar')
    const links:string[]=[]
    walkNodes(nav,node=>{if(node.classes.includes('nav-link'))links.push(node.attributes.href)})
    expect(links).toEqual(['/prices'])
  })
})
