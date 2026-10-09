import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { mvpElementCatalog } from '../src/builder/elements'

const visualBuilder=readFileSync(new URL('../src/builder/VisualBuilder.tsx',import.meta.url),'utf8')

describe('MVP builder surface',()=>{
  it('exposes only the focused MVP element catalog',()=>{
    const items=mvpElementCatalog.flatMap(group=>group.items.map(([type])=>type))
    expect(items).toEqual(['section','container','div','heading','paragraph','button','link','image','flex','grid'])
    expect(items).not.toContain('tabs')
    expect(items).not.toContain('collectionList')
    expect(items).not.toContain('form')
  })

  it('keeps only MVP left and right panel tabs visible',()=>{
    expect(visualBuilder).toContain("['add',PanelLeft,'Add'],['navigator',Layers,'Navigator'],['pages',FileJson,'Pages'],['assets',ImageIcon,'Assets']")
    expect(visualBuilder).toContain("(['style','settings'] as RightTab[])")
    expect(visualBuilder).not.toContain("['cms',Database,'CMS'],")
    expect(visualBuilder).not.toContain("['components',Component,'Components'],")
  })

  it('shows the three MVP breakpoints in the toolbar',()=>{
    const start=visualBuilder.indexOf('const breakpoints:')
    const end=visualBuilder.indexOf('if(preview)',start)
    const block=visualBuilder.slice(start,end)
    expect(block).toContain("['desktop','Desktop 1440'")
    expect(block).toContain("['tablet','Tablet 991'")
    expect(block).toContain("['mobilePortrait','Mobile 478'")
    expect(block).not.toContain("['mobileLandscape'")
  })
})
