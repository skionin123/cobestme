import { describe, expect, it } from 'vitest'
import { createDefaultProject } from '../src/builder/defaultProject'
import { reviewWebsiteLaunch } from '../src/builder/launchReview'
import { findNode } from '../src/builder/tree'

describe('launch readiness review',()=>{
  it('warns on placeholder metadata and links without destinations',()=>{
    const p=createDefaultProject()
    const found=reviewWebsiteLaunch(p)
    expect(found.some(x=>x.id==='title-page-home')).toBe(true)
    expect(found.some(x=>x.id==='description-page-home')).toBe(true)
    expect(found.every(x=>x.level==='warning')).toBe(true)
  })
  it('detects duplicate page URLs as a blocker',()=>{
    const p=createDefaultProject()
    p.pages.push({...p.pages[0],id:'another',slug:'/'})
    expect(reviewWebsiteLaunch(p)).toContainEqual(expect.objectContaining({
      level:'blocker',id:'duplicate-another'
    }))
  })
  it('flags absent images and missing accessible alt text and points to settings',()=>{
    const p=createDefaultProject(),hero=findNode(p.pages[0].root,'hero-home')!
    hero.children.push({id:'launch-img',name:'Banner',type:'image',tag:'img',classes:[],attributes:{src:'https://example.com/hero.png'},children:[]})
    expect(reviewWebsiteLaunch(p)).toContainEqual(expect.objectContaining({
      id:'image-alt-launch-img',nodeId:'launch-img',tab:'settings'
    }))
    hero.children.at(-1)!.attributes.src=''
    expect(reviewWebsiteLaunch(p)).toContainEqual(expect.objectContaining({id:'image-src-launch-img'}))
  })
  it('finds broken local page links and insecure external destinations',()=>{
    const p=createDefaultProject()
    const node=findNode(p.pages[0].root,'hero-cta-home')
      ||findNode(p.pages[0].root,'hero-button-home')
    if(!node)throw new Error('Default project button fixture missing')
    node.attributes.href='/this-page-does-not-exist'
    expect(reviewWebsiteLaunch(p)).toContainEqual(expect.objectContaining({
      id:'link-missing-'+node.id,level:'warning',tab:'settings'
    }))
    node.attributes.href='http://example.com'
    expect(reviewWebsiteLaunch(p)).toContainEqual(expect.objectContaining({id:'link-http-'+node.id}))
  })
  it('blocks unsafe image URLs and flags multiple H1 headings',()=>{
    const p=createDefaultProject()
    const parent=findNode(p.pages[0].root,'hero-home')!
    parent.children.push({id:'suspicious',name:'Image',type:'image',tag:'img',
      classes:[],attributes:{src:'javascript:alert(1)',alt:'bad'},children:[]})
    parent.children.push({id:'extra-h1',name:'Extra title',type:'heading',tag:'h1',
      classes:[],attributes:{},content:'Another main title',children:[]})
    const issues=reviewWebsiteLaunch(p)
    expect(issues).toContainEqual(expect.objectContaining({id:'image-unsafe-suspicious',level:'blocker'}))
    expect(issues).toContainEqual(expect.objectContaining({id:'h1-multiple-page-home',level:'warning'}))
  })
  it('blocks empty projects without claiming server-verified readiness',()=>{
    const p=createDefaultProject();p.pages=[]
    expect(reviewWebsiteLaunch(p)).toContainEqual(expect.objectContaining({level:'blocker',id:'no-pages'}))
  })
})
