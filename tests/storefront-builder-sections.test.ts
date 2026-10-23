import {describe,expect,it} from 'vitest'
import {createPrebuiltSection, sectionCatalog} from '../src/builder/elements'
import {builderTemplates} from '../src/builder/templates'
import {walkNodes} from '../src/builder/tree'

describe('merchant-first ecommerce sections',()=>{
  it('offers safe, editable storefront sections in the design library',()=>{
    expect(sectionCatalog.map(x=>x.id)).toEqual(expect.arrayContaining([
      'announcement','imageText','shopIntro','storeBenefits'
    ]))
    for(const type of ['announcement','imageText','shopIntro','storeBenefits']){
      const section=createPrebuiltSection(type)
      expect(section.type).toBe('section')
      expect(section.children.length).toBeGreaterThan(0)
      const all: string[]=[]
      walkNodes(section,node=>{if(node.content)all.push(node.content)})
      expect(all.join(' ')).not.toMatch(/\$\d+|5 stars|guaranteed delivery|limited stock/i)
    }
  })

  it('offers an Online Store template with real editing targets but no fabricated product pricing',()=>{
    const template=builderTemplates.find(t=>t.id==='storefront')
    expect(template).toBeDefined()
    const project=template!.build()
    expect(project.pages[0].root.children.map(n=>n.name)).toEqual([
      'Navbar','Hero','Store Announcement','Shop Introduction',
      'Image With Text','Shopping Information','CTA','Footer'
    ])
    const htmlCopy:string[]=[]
    walkNodes(project.pages[0].root,node=>{
      if(node.content)htmlCopy.push(node.content)
    })
    expect(htmlCopy.join(' ')).toContain('real products')
    expect(htmlCopy.join(' ')).not.toMatch(/\$\d+|4\.9\/5|100% free shipping/i)
    const shop=project.pages[0].root.children.find(n=>n.name==='Shop Introduction')
    expect(shop?.attributes.id).toBe('shop')
    const story=project.pages[0].root.children.find(n=>n.name==='Image With Text')
    expect(story?.attributes.id).toBe('story')
  })
})
