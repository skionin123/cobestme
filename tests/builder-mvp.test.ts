import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createElement, mvpElementCatalog } from '../src/builder/elements'

const visualBuilder=readFileSync(new URL('../src/builder/VisualBuilder.tsx',import.meta.url),'utf8')

describe('MVP builder surface',()=>{
  it('exposes only the focused MVP element catalog',()=>{
    const items=mvpElementCatalog.flatMap(group=>group.items.map(([type])=>type))
    expect(items).toEqual(['section','container','div','heading','paragraph','button','link','image','flex','grid'])
    expect(items).not.toContain('tabs')
    expect(items).not.toContain('collectionList')
    expect(items).not.toContain('form')
  })

  it('gives every core MVP element a style class immediately',()=>{
    const types=['section','container','div','heading','paragraph','button','link','image','flex','grid'] as const
    for(const type of types)expect(createElement(type).classes.length).toBeGreaterThan(0)
  })

  it('keeps basic page path management in the Pages workflow',()=>{
    const panels=readFileSync(new URL('../src/builder/easyPanels.tsx',import.meta.url),'utf8')
    const inspector=readFileSync(new URL('../src/builder/inspector.tsx',import.meta.url),'utf8')
    // The web address of a page is edited in the Pages panel, next to its search title.
    expect(panels).toContain('aria-label="Page URL"')
    expect(panels).toContain('Title in Google and browser tab')
    // The element inspector stays about the element.
    expect(inspector).not.toContain('Page SEO')
    expect(inspector).not.toContain('Custom attributes')
  })

  it('keeps a small set of plain-language editor panels',()=>{
    expect(visualBuilder).toContain("[['add','Add',Plus],['layers','Layers',Layers],['pages','Pages',FileText],['media','Media',ImageIcon],['theme','Theme',Palette]]")
    expect(visualBuilder).not.toContain("'cms'")
    expect(visualBuilder).not.toContain("'components'")
  })

  it('does not cap long-page canvas height',()=>{
    expect(visualBuilder).not.toContain('Math.min(24000')
    expect(visualBuilder).toContain('Math.max(viewportHeights[breakpoint],Math.ceil(Number(msg.height)))')
  })

  it('offers Desktop, Tablet and Mobile editing that map to the compiled breakpoints',()=>{
    expect(visualBuilder).toContain("[['desktop','Desktop',Monitor],['tablet','Tablet',Tablet],['mobilePortrait','Mobile',Smartphone]]")
    expect(visualBuilder).toContain('mobilePortrait:390')
  })
})
