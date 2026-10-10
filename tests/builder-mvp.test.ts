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
    const panels=readFileSync(new URL('../src/builder/panels.tsx',import.meta.url),'utf8')
    expect(panels).toContain("prompt('Page path',page.slug)")
    const settingsStart=panels.indexOf('export function SettingsPanel')
    const settingsEnd=panels.indexOf('export function InteractionsPanel',settingsStart)
    const settings=panels.slice(settingsStart,settingsEnd)
    expect(settings).not.toContain('Page SEO')
    expect(settings).not.toContain('Custom attributes')
  })

  it('keeps only MVP left and right panel tabs visible',()=>{
    expect(visualBuilder).toContain("['add',PanelLeft,'Add'],['navigator',Layers,'Navigator'],['pages',FileJson,'Pages'],['assets',ImageIcon,'Assets']")
    expect(visualBuilder).toContain("[['style','Style'],['settings','Settings']]")
    expect(visualBuilder).not.toContain("['cms',Database,'CMS'],")
    expect(visualBuilder).not.toContain("['components',Component,'Components'],")
  })

  it('does not cap long-page canvas height',()=>{
    expect(visualBuilder).not.toContain('Math.min(24000')
    expect(visualBuilder).toContain('Math.max(viewportHeights[breakpoint],Math.ceil(Number(msg.height)))')
  })

  it('shows the MVP breakpoints including the existing 767 layer',()=>{
    const start=visualBuilder.indexOf('const breakpoints:')
    const end=visualBuilder.indexOf('if(preview)',start)
    const block=visualBuilder.slice(start,end)
    expect(block).toContain("['desktop','Desktop 1440'")
    expect(block).toContain("['tablet','Tablet 991'")
    expect(block).toContain("['mobileLandscape','Mobile landscape 767'")
    expect(block).toContain("['mobilePortrait','Mobile 478'")
  })
})
