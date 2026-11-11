import { describe, expect, it } from 'vitest'
import { compileProjectCss, renderPageBody } from '../src/builder/compiler'
import { createDefaultProject } from '../src/builder/defaultProject'
import { createElement, createPrebuiltSection, sectionCatalog } from '../src/builder/elements'
import { ensureKitStyles, kitStyles } from '../src/builder/kit'
import { reviewWebsiteLaunch } from '../src/builder/launchReview'
import { isSampleAddress, isSampleImage, isSampleText, P, S } from '../src/builder/samples'
import { builderTemplates } from '../src/builder/templates'
import { walkNodes } from '../src/builder/tree'
import type { BuilderNode, BuilderProject } from '../src/builder/types'

const classesOf=(node:BuilderNode)=>{const out=new Set<string>();walkNodes(node,n=>n.classes.forEach(c=>out.add(c)));return [...out]}
const find=(node:BuilderNode,test:(n:BuilderNode)=>boolean)=>{const out:BuilderNode[]=[];walkNodes(node,n=>{if(test(n))out.push(n)});return out}

describe('ready-made sections',()=>{
  it('look finished the moment they are added: every class has a style',()=>{
    for(const {id} of sectionCatalog){
      const project=createDefaultProject()
      const section=createPrebuiltSection(id)
      ensureKitStyles(project,section)
      for(const name of classesOf(section))expect(project.styles[name],`${id} uses .${name}`).toBeDefined()
    }
  })
  it('never overwrite a style the owner already has',()=>{
    const project=createDefaultProject()
    project.styles['form-input']={desktop:{none:{border:'3px solid red'}}}
    const added=ensureKitStyles(project,createPrebuiltSection('contact'))
    expect(project.styles['form-input'].desktop.none.border).toBe('3px solid red')
    expect(added).not.toContain('form-input')
    expect(added).toContain('form')
    // Asking again adds nothing.
    expect(ensureKitStyles(project,createPrebuiltSection('contact'))).toEqual([])
  })
  it('keeps light buttons after the base button style so they win',()=>{
    const project=createDefaultProject()
    ensureKitStyles(project,createPrebuiltSection('cta'))
    const names=Object.keys(project.styles)
    expect(names.indexOf('button-light')).toBeGreaterThan(names.indexOf('button'))
    expect(kitStyles['button-light'].desktop.none.color).not.toBe(kitStyles['button-light'].desktop.none.background)
  })
  it('contact form collects a name, a required email and a message, and has both result messages',()=>{
    const form=find(createPrebuiltSection('contact'),n=>n.type==='form')[0]
    expect(form.attributes.action).toBeUndefined()
    const email=find(form,n=>n.attributes.type==='email')[0]
    expect(email.attributes.required).toBe('true')
    expect(find(form,n=>n.attributes.name==='name')).toHaveLength(1)
    expect(find(form,n=>n.tag==='textarea'&&n.attributes.required==='true')).toHaveLength(1)
    expect(find(form,n=>n.type==='submit')).toHaveLength(1)
    expect(find(form,n=>n.attributes['data-form-success']==='true')).toHaveLength(1)
    expect(find(form,n=>n.attributes['data-form-error']==='true')).toHaveLength(1)
    // Every field has a visible label.
    expect(find(form,n=>n.classes.includes('form-label')).map(n=>n.content)).toEqual(['Name','Email','Message'])
    expect(createPrebuiltSection('contact').attributes.id).toBe('contact')
  })
  it('menu bar and footer link only to pages that exist',()=>{
    const context={pages:[{name:'Home',slug:'/'},{name:'About us',slug:'/about-us'},{name:'Prices',slug:'/prices'}],siteName:'Bloom & Co'}
    const nav=createPrebuiltSection('navbar',context)
    expect(find(nav,n=>n.classes.includes('nav-link')).map(n=>[n.content,n.attributes.href])).toEqual([['About us','/about-us'],['Prices','/prices']])
    expect(find(nav,n=>n.classes.includes('brand-link'))[0]).toMatchObject({content:'Bloom & Co',attributes:{href:'/'}})
    expect(find(nav,n=>n.classes.includes('nav-menu-button'))[0].attributes['aria-label']).toBe('Open menu')
    const footer=createPrebuiltSection('footer',context)
    expect(find(footer,n=>n.classes.includes('footer-link')).map(n=>n.attributes.href)).toEqual(['/about-us','/prices'])
    expect(find(footer,n=>n.classes.includes('footer-copy'))[0].content).toContain('Bloom & Co')
    // A one-page website links to its contact section instead of pages that do not exist.
    expect(find(createPrebuiltSection('navbar'),n=>n.classes.includes('nav-link')).map(n=>n.attributes.href)).toEqual(['#contact'])
  })
  it('gives images an alt attribute so file names are never read aloud',()=>{
    const project=createDefaultProject()
    project.pages[0].root.children.push(createElement('image'))
    expect(renderPageBody(project,project.pages[0].id,false)).toMatch(/<img[^>]* alt=""/)
  })
  it('uses a neutral sample video, not a joke one',()=>{
    expect(createElement('video').attributes.src).not.toContain('dQw4w9WgXcQ')
  })
})

describe('sample wording is tracked so it does not get published by accident',()=>{
  it('recognises instructions written for the owner',()=>{
    for(const text of [P.heroHeading,P.heroCopy,P.featureCopy,P.testimonialQuote,P.planPrice,P.faqAnswer,P.footerCopy,'  build something   REMARKABLE. ','© 2031 Your company','Lorem ipsum dolor sit amet'])
      expect(isSampleText(text),text).toBe(true)
  })
  it('leaves ordinary headings and real text alone',()=>{
    for(const text of [S.featuresHeading,S.contactHeading,S.faqHeading,...S.planNames,'Fresh bread, baked daily','Contact','','© 2026 Bloom & Co'])
      expect(isSampleText(text),text).toBe(false)
  })
  it('recognises the sample email address and stock photos',()=>{
    expect(isSampleAddress('mailto:hello@example.com')).toBe(true)
    expect(isSampleAddress('mailto:me@mybakery.ph')).toBe(false)
    expect(isSampleImage(createElement('image').attributes.src)).toBe(true)
    expect(isSampleImage('https://cdn.example.com/my-shop.jpg')).toBe(false)
  })
})

describe('templates work out of the box',()=>{
  const built=builderTemplates.map(template=>[template.name,template.build()] as [string,BuilderProject])
  it('have no dead links, no sample email address, and a working contact form',()=>{
    for(const [name,project] of built){
      const root=project.pages[0].root
      const ids=new Set(find(root,n=>!!n.attributes.id).map(n=>n.attributes.id))
      for(const link of find(root,n=>n.tag==='a')){
        const href=link.attributes.href||''
        expect(href,`${name}: ${link.name}`).not.toBe('#')
        expect(isSampleAddress(href),`${name}: ${link.name}`).toBe(false)
        if(href.startsWith('#'))expect(ids.has(href.slice(1)),`${name}: ${link.name} → ${href}`).toBe(true)
        else expect(href,`${name}: ${link.name}`).toBe('/')
      }
      expect(find(root,n=>n.type==='form')).toHaveLength(1)
    }
  })
  it('define every class they use and compile to CSS',()=>{
    for(const [name,project] of built){
      for(const cls of classesOf(project.pages[0].root))expect(project.styles[cls],`${name} uses .${cls}`).toBeDefined()
      expect(compileProjectCss(project)).toContain('.form-input{')
    }
  })
  it('pass the launch review with suggestions only, including the sample text reminder',()=>{
    for(const [,project] of built){
      const issues=reviewWebsiteLaunch(project)
      expect(issues.filter(issue=>issue.level==='blocker')).toEqual([])
      expect(issues.some(issue=>issue.id==='sample-'+project.pages[0].id)).toBe(true)
      expect(issues.some(issue=>issue.id.startsWith('link-'))).toBe(false)
      expect(issues.some(issue=>issue.id.startsWith('form-'))).toBe(false)
    }
  })
})
