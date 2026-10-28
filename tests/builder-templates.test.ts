import { describe, expect, it } from 'vitest'
import { createDefaultProject } from '../src/builder/defaultProject'
import { applyTemplate, builderTemplates } from '../src/builder/templates'

describe('builder templates',()=>{
  it('offers one ecommerce theme and two professional general-purpose themes',()=>{
    expect(builderTemplates).toHaveLength(3)
    expect(builderTemplates.map(x=>x.name)).toEqual(['Online Store','Simple','Professional'])
    expect(builderTemplates.map(x=>x.category)).toEqual(['Essential','Essential','Editorial'])
  })

  it('keeps starting themes structured and beginner-friendly',()=>{
    for(const template of builderTemplates){
      const project=template.build()
      const sections=project.pages[0].root.children
      expect(sections.length).toBeGreaterThanOrEqual(4)
      expect(sections.length).toBeLessThanOrEqual(template.id==='storefront'?8:6)
      expect(sections[0].type).toBe('navbar')
      expect(sections.at(-1)?.type).toBe('footer')
      const hero=sections.find(n=>n.name==='Hero')
      expect(hero?.children?.[0]?.children?.some(n=>n.name==='Hero eyebrow')).toBe(true)
      if(template.id==='storefront')expect(sections.some(n=>n.name==='Shop Introduction')).toBe(true)
      else expect(sections.some(n=>n.name==='Features')).toBe(true)
      expect(sections.some(n=>n.name==='CTA')).toBe(true)
    }
  })

  it('uses fluid professional CSS and visible focus states',()=>{
    const essential=builderTemplates.find(t=>t.id==='essential')!.build()
    const editorial=builderTemplates.find(t=>t.id==='editorial')!.build()
    expect(essential.styles.display.desktop.none.fontSize).toContain('clamp(')
    expect(editorial.styles.display.desktop.none.fontSize).toContain('clamp(')
    expect(essential.styles.button.desktop.focused?.outline).toContain('var(--accent)')
    expect(editorial.styles.button.desktop.focused?.outline).toContain('var(--accent)')
    expect(essential.styles['feature-grid'].mobilePortrait?.none?.gridTemplateColumns).toBe('1fr')
    expect(editorial.styles.quote.desktop.none.fontFamily).toContain('Playfair Display')
  })

  it('applies a theme without changing the current project id or assets',()=>{
    const current=createDefaultProject()
    current.id='site-123'
    current.assets=[{id:'asset-1',name:'photo.jpg',mimeType:'image/jpeg',url:'data:image/jpeg;base64,AA==',createdAt:'2026-01-01'}]
    const next=applyTemplate(builderTemplates[0],current)
    expect(next.id).toBe('site-123')
    expect(next.assets).toHaveLength(1)
    expect(next.pages[0].root.children.length).toBeGreaterThan(3)
  })
})
