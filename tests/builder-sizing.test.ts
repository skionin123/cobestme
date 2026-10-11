import { describe, expect, it } from 'vitest'
import { createDefaultProject } from '../src/builder/defaultProject'
import { setElementSizing, getElementSizingMode } from '../src/builder/sizing'
import { geometryClass } from '../src/builder/geometry'
import { compileProjectCss } from '../src/builder/compiler'

describe('element-specific responsive sizing',()=>{
  it('supports fit, fill and fixed width without modifying the shared template',()=>{
    const p=createDefaultProject(), cls=geometryClass('hero-title-home')
    const shared=JSON.stringify(p.styles.display)
    expect(setElementSizing(p,'hero-title-home','desktop','width','fill')).toBe(true)
    expect(p.styles[cls].desktop.none).toMatchObject({width:'100%',maxWidth:'100%'})
    expect(getElementSizingMode(p,'hero-title-home','desktop','width')).toBe('fill')
    setElementSizing(p,'hero-title-home','desktop','width','hug')
    expect(p.styles[cls].desktop.none.width).toBe('fit-content')
    setElementSizing(p,'hero-title-home','desktop','width','fixed',350)
    expect(p.styles[cls].desktop.none.width).toBe('350px')
    expect(getElementSizingMode(p,'hero-title-home','desktop','width')).toBe('fixed')
    expect(JSON.stringify(p.styles.display)).toBe(shared)
    expect(compileProjectCss(p)).toContain('width:350px')
    setElementSizing(p,'hero-title-home','desktop','width','theme')
    expect(p.styles[cls].desktop.none.width).toBeUndefined()
  })
  it('shrinks a section to content without modifying children or theme padding',()=>{
    const p=createDefaultProject(),cls=geometryClass('hero-home')
    const original=JSON.stringify(p.styles.hero)
    expect(setElementSizing(p,'hero-home','desktop','height','hug')).toBe(true)
    expect(p.styles[cls].desktop.none).toMatchObject({height:'auto',minHeight:'0px',paddingTop:'16px',paddingBottom:'16px'})
    setElementSizing(p,'hero-home','desktop','height','fixed',260)
    expect(p.styles[cls].desktop.none.height).toBe('260px')
    setElementSizing(p,'hero-home','desktop','height','theme')
    expect(p.styles[cls].desktop.none.height).toBeUndefined()
    expect(p.styles[cls].desktop.none.paddingTop).toBeUndefined()
    expect(JSON.stringify(p.styles.hero)).toBe(original)
  })
  it('preserves desktop width while overriding mobile sizing',()=>{
    const p=createDefaultProject(),cls=geometryClass('hero-inner-home')
    setElementSizing(p,'hero-inner-home','desktop','width','fixed',840)
    setElementSizing(p,'hero-inner-home','mobilePortrait','width','fill')
    expect(p.styles[cls].desktop.none.width).toBe('840px')
    expect(p.styles[cls].mobilePortrait?.none?.width).toBe('100%')
    expect(compileProjectCss(p)).toContain('@media(max-width:478px)')
  })
  it('rejects attempts to resize the page root or use invalid sizes',()=>{
    const p=createDefaultProject()
    expect(setElementSizing(p,'root-home','desktop','width','fill')).toBe(false)
    expect(setElementSizing(p,'hero-title-home','desktop','width','fixed',Number.NaN)).toBe(false)
    expect(setElementSizing(p,'hero-home','desktop','height','fill')).toBe(false)
  })
})
