import { describe, expect, it } from 'vitest'
import { createDefaultProject } from '../src/builder/defaultProject'
import { applyTemplate, builderTemplates } from '../src/builder/templates'

describe('builder templates',()=>{
  it('keeps the theme choice intentionally limited to two professional options',()=>{
    expect(builderTemplates).toHaveLength(2)
    expect(builderTemplates.map(x=>x.name)).toEqual(['Simple','Professional'])
    expect(builderTemplates.map(x=>x.category)).toEqual(['Essential','Editorial'])
  })

  it('keeps both starting themes intentionally simple',()=>{
    for(const template of builderTemplates){
      const project=template.build()
      const sections=project.pages[0].root.children
      expect(sections.length).toBeGreaterThanOrEqual(4)
      expect(sections.length).toBeLessThanOrEqual(5)
      expect(sections[0].type).toBe('navbar')
      expect(sections.at(-1)?.type).toBe('footer')
    }
  })

  it('uses fluid professional CSS and visible focus states',()=>{
    const [essential,editorial]=builderTemplates.map(t=>t.build())
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
