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
  it('blocks empty projects without claiming server-verified readiness',()=>{
    const p=createDefaultProject();p.pages=[]
    expect(reviewWebsiteLaunch(p)).toContainEqual(expect.objectContaining({level:'blocker',id:'no-pages'}))
  })
})
