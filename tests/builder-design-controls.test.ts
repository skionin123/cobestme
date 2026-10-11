import { describe, expect, it } from 'vitest'
import { createDefaultProject } from '../src/builder/defaultProject'
import { updateElementAppearance, makeGradient, safeBackgroundUrl, fontChoices } from '../src/builder/DesignControls'
import { geometryClass } from '../src/builder/geometry'
import { compileProjectCss } from '../src/builder/compiler'

describe('visual design inspector',()=>{
  it('gives only the selected element its own font and color rules',()=>{
    const p=createDefaultProject()
    const before=JSON.stringify(p.styles.display)
    expect(updateElementAppearance(p,'hero-title-home','desktop',{
      fontFamily:'"DM Sans", Arial, sans-serif',color:'#aabbcc',fontSize:'42px',
    })).toBe(true)
    const cls=geometryClass('hero-title-home')
    expect(p.styles[cls].desktop.none.fontFamily).toContain('DM Sans')
    expect(p.styles[cls].desktop.none.color).toBe('#aabbcc')
    expect(JSON.stringify(p.styles.display)).toBe(before)
    const compiled=compileProjectCss(p)
    expect(compiled).toContain('font-family:"DM Sans", Arial, sans-serif')
    expect(compiled).toContain('color:#aabbcc')
    expect(compiled).toContain('fonts.googleapis.com')
    expect(fontChoices.length).toBeGreaterThan(7)
  })
  it('keeps independent responsive device overrides',()=>{
    const p=createDefaultProject()
    updateElementAppearance(p,'hero-home','desktop',{backgroundColor:'#ffffff'})
    updateElementAppearance(p,'hero-home','mobilePortrait',{backgroundColor:'#222222',paddingTop:'20px'})
    const cls=geometryClass('hero-home')
    expect(p.styles[cls].desktop.none.backgroundColor).toBe('#ffffff')
    expect(p.styles[cls].mobilePortrait?.none?.backgroundColor).toBe('#222222')
    expect(compileProjectCss(p)).toContain('@media(max-width:478px)')
  })
  it('generates valid CSS gradients and resets without touching children',()=>{
    const p=createDefaultProject(),prev=JSON.stringify(p.styles.display)
    const gradient=makeGradient('linear','#112233','#ddeeff',120,90)
    expect(gradient).toBe('linear-gradient(120deg,#112233 0%,#ddeeff 90%)')
    expect(makeGradient('radial','#102030','#aabbcc',0)).toContain('radial-gradient(circle,')
    updateElementAppearance(p,'hero-home','desktop',{backgroundImage:gradient})
    expect(compileProjectCss(p)).toContain('background-image:'+gradient)
    updateElementAppearance(p,'hero-home','desktop',{backgroundImage:null})
    expect(p.styles[geometryClass('hero-home')].desktop.none.backgroundImage).toBeUndefined()
    expect(JSON.stringify(p.styles.display)).toBe(prev)
  })
  it('only accepts safe image URL schemes',()=>{
    expect(safeBackgroundUrl('https://cdn.example.com/hero.webp')).toBe('url("https://cdn.example.com/hero.webp")')
    expect(safeBackgroundUrl('/assets/hero.webp')).toBe('url("/assets/hero.webp")')
    expect(safeBackgroundUrl('javascript:alert(1)')).toBeNull()
    expect(safeBackgroundUrl('url("javascript:alert(1)")')).toBeNull()
    expect(safeBackgroundUrl('https://bad.example/");background:red')).toBeNull()
  })
  it('declines edits to the root page',()=>{
    const p=createDefaultProject()
    expect(updateElementAppearance(p,p.pages[0].root.id,'desktop',{color:'#111111'})).toBe(false)
  })
})
