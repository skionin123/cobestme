import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultProject } from '../src/builder/defaultProject'
import { createPrebuiltSection } from '../src/builder/elements'
import { P } from '../src/builder/samples'
import { useBuilderStore } from '../src/builder/store'
import { builderTemplates } from '../src/builder/templates'
import { walkNodes } from '../src/builder/tree'
import type { BuilderNode, BuilderProject } from '../src/builder/types'

const store=()=>useBuilderStore.getState()
const menuLinks=(project:BuilderProject,pageIndex=0)=>{
  const out:{text:string;href:string;cls:string}[]=[]
  walkNodes(project.pages[pageIndex].root,node=>{
    if(node.classes.includes('nav-link')||node.classes.includes('footer-link'))out.push({text:node.content||'',href:node.attributes.href,cls:node.classes.includes('nav-link')?'nav':'footer'})
  })
  return out
}
const ids=(node:BuilderNode)=>{const out:string[]=[];walkNodes(node,n=>out.push(n.id));return out}

describe('pages',()=>{
  beforeEach(()=>{
    const project=builderTemplates[0].build()
    store().replaceProject(project,false)
  })

  it('looking at another page is not an edit',()=>{
    store().addPage('About us')
    const aboutId=store().project.activePageId
    const homeId=store().project.pages[0].id
    const {history,project}=store()
    const versions=project.versions.length
    const {version,updatedAt}=project
    store().setActivePage(homeId)
    expect(store().project.activePageId).toBe(homeId)
    expect(store().history).toHaveLength(history.length)
    expect(store().project.versions).toHaveLength(versions)
    expect(store().project.version).toBe(version)
    expect(store().project.updatedAt).toBe(updatedAt)
    expect(store().selectedNodeId).toBe(store().project.pages[0].root.id)
    // Undo goes back to before the page was added; it does not just flip pages.
    store().undo()
    expect(store().project.pages).toHaveLength(1)
    expect(store().project.pages.some(p=>p.id===aboutId)).toBe(false)
    // Unknown pages are ignored.
    store().setActivePage('nope')
    expect(store().project.activePageId).toBe(homeId)
  })

  it('a new page arrives with the menu bar, a heading and the footer, and is linked from every page',()=>{
    store().addPage('  About us  ')
    const {project,selectedNodeId}=store()
    const page=project.pages[1]
    expect(page).toMatchObject({name:'About us',slug:'/about-us',seo:{title:'About us'}})
    expect(project.activePageId).toBe(page.id)
    expect(page.root.children.map(node=>node.type)).toEqual(['navbar','section','footer'])
    const heading=page.root.children[1].children[0].children[0]
    expect(heading).toMatchObject({tag:'h1',content:'About us'})
    expect(selectedNodeId).toBe(heading.id)
    expect(page.root.children[1].children[0].children[1].content).toBe(P.newPageCopy)
    // Copied menu bar and footer get their own ids.
    const homeIds=new Set(ids(project.pages[0].root))
    expect(ids(page.root).some(id=>homeIds.has(id))).toBe(false)
    for(const index of [0,1]){
      expect(menuLinks(project,index).filter(link=>link.cls==='nav').map(link=>link.href)).toContain('/about-us')
    }
    // One step to undo, and the menu links go with it.
    store().undo()
    expect(store().project.pages).toHaveLength(1)
    expect(menuLinks(store().project).map(link=>link.href)).not.toContain('/about-us')
  })

  it('can add a page without touching the menu',()=>{
    const before=menuLinks(store().project)
    store().addPage('Thank you',{addToMenu:false})
    expect(menuLinks(store().project,0)).toEqual(before)
    expect(store().project.pages[1].slug).toBe('/thank-you')
  })

  it('gives pages with the same name different addresses and never an empty name',()=>{
    store().addPage('Prices')
    store().addPage('Prices')
    store().addPage('   ')
    store().addPage('!!!')
    const slugs=store().project.pages.map(p=>p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(slugs.slice(0,3)).toEqual(['/','/prices','/prices-2'])
    expect(store().project.pages[3].name).toBe('Untitled')
    for(const slug of slugs)expect(slug).toMatch(/^\/[a-z0-9-]*$/)
  })

  it('renaming a page renames its menu links but keeps its address',()=>{
    store().addPage('About us')
    const page=store().project.pages[1]
    store().renamePage(page.id,'Our story')
    const {project}=store()
    expect(project.pages[1]).toMatchObject({name:'Our story',slug:'/about-us',seo:{title:'Our story'}})
    for(const index of [0,1]){
      const links=menuLinks(project,index).filter(link=>link.href==='/about-us')
      expect(links.length).toBeGreaterThan(0)
      expect(links.every(link=>link.text==='Our story')).toBe(true)
    }
  })

  it('a menu link the owner reworded is left alone on rename',()=>{
    store().addPage('About us')
    const page=store().project.pages[1]
    store().mutate('Reword link',draft=>{
      walkNodes(draft.pages[0].root,node=>{if(node.classes.includes('nav-link')&&node.attributes.href==='/about-us')node.content='Who we are'})
    })
    store().renamePage(page.id,'Our story')
    expect(menuLinks(store().project,0).find(link=>link.cls==='nav'&&link.href==='/about-us')?.text).toBe('Who we are')
  })

  it('deleting a page removes the links that led to it, and the homepage cannot be deleted',()=>{
    store().addPage('About us')
    store().addPage('Prices')
    const [home,about]=store().project.pages
    store().deletePage(about.id)
    const {project}=store()
    expect(project.pages.map(p=>p.slug)).toEqual(['/','/prices'])
    for(let index=0;index<project.pages.length;index++){
      const hrefs=menuLinks(project,index).map(link=>link.href)
      expect(hrefs).not.toContain('/about-us')
      expect(hrefs).toContain('/prices')
    }
    store().deletePage(home.id)
    expect(store().project.pages.map(p=>p.slug)).toEqual(['/','/prices'])
    // Deleting the page being viewed moves to the first page.
    store().deletePage(store().project.pages[1].id)
    expect(store().project.activePageId).toBe(home.id)
    expect(store().selectedNodeId).toBe(store().project.pages[0].root.id)
    store().deletePage(home.id)
    expect(store().project.pages).toHaveLength(1)
  })

  it('changing a page address keeps links to it working',()=>{
    store().addPage('About us')
    const page=store().project.pages[1]
    store().updatePageSeo(page.id,'slug','our-story')
    const {project}=store()
    expect(project.pages[1].slug).toBe('/our-story')
    expect(menuLinks(project,0).map(link=>link.href)).toContain('/our-story')
    expect(menuLinks(project,0).map(link=>link.href)).not.toContain('/about-us')
  })
})

describe('adding sections and restoring backups',()=>{
  beforeEach(()=>store().replaceProject(createDefaultProject(),false))

  it('a section brings its styles with it, in one undo step',()=>{
    const root=store().project.pages[0].root
    const before=Object.keys(store().project.styles)
    expect(before).not.toContain('gallery-grid')
    const gallery=createPrebuiltSection('gallery')
    store().addNode(root.id,gallery)
    expect(store().project.styles['gallery-grid']).toBeDefined()
    expect(store().selectedNodeId).toBe(gallery.id)
    store().undo()
    expect(Object.keys(store().project.styles)).toEqual(before)
  })

  it('every add and move is its own undo step, however quickly they follow each other',()=>{
    const root=store().project.pages[0].root
    const features=createPrebuiltSection('features')
    const faq=createPrebuiltSection('faq')
    store().addNode(root.id,features)
    store().addNode(root.id,faq)
    store().selectNode(null)
    const order=()=>store().project.pages[0].root.children.map(node=>node.id)
    const start=order()
    store().moveNode(faq.id,root.id,0)
    const afterFirstMove=order()
    store().moveNode(features.id,root.id,0)
    expect(order()).not.toEqual(afterFirstMove)
    store().undo()
    expect(order()).toEqual(afterFirstMove)
    store().undo()
    expect(order()).toEqual(start)
    // …and the two sections were two steps as well.
    store().undo()
    expect(order()).toEqual(start.filter(id=>id!==faq.id))
    store().undo()
    expect(order()).toEqual(start.filter(id=>id!==faq.id&&id!==features.id))
  })

  it('typing a word is still one undo step',()=>{
    store().selectNode('hero-title-home')
    const steps=store().history.length
    for(const text of ['F','Fr','Fre','Fres','Fresh'])store().updateNode('hero-title-home',{content:text})
    expect(store().history).toHaveLength(steps+1)
    store().undo()
    let content=''
    walkNodes(store().project.pages[0].root,node=>{if(node.id==='hero-title-home')content=node.content||''})
    expect(content).toBe(P.heroHeading)
  })

  it('restoring a backup can be undone, keeps the website identity and saves what it replaced',()=>{
    const original=store().project
    store().renameProject('Bloom & Co')
    const mine=store().project
    const backup=builderTemplates[1].build()
    backup.id='someone-elses-id'
    backup.name='Backup site'
    store().importProject(backup)
    const restored=store().project
    expect(restored.name).toBe('Backup site')
    expect(restored.id).toBe(original.id)
    // Newer than what it replaced, so an older cloud copy can never win on reload.
    expect(restored.version).toBeGreaterThan(mine.version)
    expect(restored.versions[0].label).toBe('Before restoring a backup')
    expect(restored.versions[0].project.name).toBe('Bloom & Co')
    expect(store().selectedNodeId).toBeNull()
    expect(store().saveStatus).toBe('dirty')
    store().undo()
    expect(store().project.name).toBe('Bloom & Co')
    store().redo()
    expect(store().project.name).toBe('Backup site')
  })
})
