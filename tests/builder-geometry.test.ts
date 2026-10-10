import { describe, expect, it } from 'vitest'
import { createDefaultProject } from '../src/builder/defaultProject'
import { applyNodeGeometry, geometryClass } from '../src/builder/geometry'
import { compileProjectCss, renderPageBody } from '../src/builder/compiler'
import { findNode } from '../src/builder/tree'

describe('on-canvas element geometry',()=>{
  it('persists a moved element as an independent responsive class',()=>{
    const p=createDefaultProject()
    expect(applyNodeGeometry(p,'hero-title-home','desktop',{kind:'move',x:90,y:45})).toBe(true)
    const cls=geometryClass('hero-title-home')
    expect(findNode(p.pages[0].root,'hero-title-home')?.classes).toContain(cls)
    expect(p.styles[cls].desktop.none.translate).toBe('90px 45px')
    const css=compileProjectCss(p)
    expect(css).toContain('.'+cls+'{translate:90px 45px}')
    expect(renderPageBody(p,p.activePageId,false)).toContain(cls)
  })
  it('resizes only the selected element without changing shared hero styles',()=>{
    const p=createDefaultProject()
    const originalHero=JSON.stringify(p.styles.hero)
    expect(applyNodeGeometry(p,'hero-title-home','desktop',{kind:'resize',width:350,fontSize:36})).toBe(true)
    const cls=geometryClass('hero-title-home')
    expect(p.styles[cls].desktop.none).toMatchObject({width:'350px',maxWidth:'none',fontSize:'36px'})
    expect(JSON.stringify(p.styles.hero)).toBe(originalHero)
  })
  it('overrides mobile placement separately and supports resetting it',()=>{
    const p=createDefaultProject()
    const cls=geometryClass('hero-title-home')
    applyNodeGeometry(p,'hero-title-home','desktop',{kind:'move',x:95,y:25})
    applyNodeGeometry(p,'hero-title-home','mobilePortrait',{kind:'move',x:12,y:5})
    expect(p.styles[cls].desktop.none.translate).toBe('95px 25px')
    expect(p.styles[cls].mobilePortrait?.none?.translate).toBe('12px 5px')
    expect(compileProjectCss(p)).toContain('.'+cls+'{translate:12px 5px}')
    applyNodeGeometry(p,'hero-title-home','mobilePortrait',{kind:'reset'})
    expect(p.styles[cls].mobilePortrait?.none?.translate).toBeUndefined()
    expect(p.styles[cls].desktop.none.translate).toBe('95px 25px')
  })
  it('shrinks only the frame, overrides the theme minimum, and leaves text untouched',()=>{
    const p=createDefaultProject()
    const initialHero=JSON.stringify(p.styles.hero)
    const initialTitle=JSON.stringify(p.styles.display)
    const ok=applyNodeGeometry(p,'hero-home','desktop',{
      kind:'resize',height:365,frame:true,paddingTop:22,paddingBottom:22,
    })
    expect(ok).toBe(true)
    const name=geometryClass('hero-home')
    expect(p.styles[name].desktop.none).toMatchObject({
      minHeight:'0px',height:'365px',paddingTop:'22px',paddingBottom:'22px',
    })
    expect(p.styles[name].desktop.none.width).toBeUndefined()
    expect(p.styles[name].desktop.none.fontSize).toBeUndefined()
    expect(JSON.stringify(p.styles.hero)).toBe(initialHero)
    expect(JSON.stringify(p.styles.display)).toBe(initialTitle)
    expect(compileProjectCss(p)).toContain('min-height:0px')
    applyNodeGeometry(p,'hero-home','desktop',{kind:'reset'})
    expect(p.styles[name].desktop.none.height).toBeUndefined()
    expect(p.styles[name].desktop.none.paddingTop).toBeUndefined()
    expect(p.styles[name].desktop.none.minHeight).toBeUndefined()
  })
  it('refuses to edit the root or missing elements',()=>{
    const p=createDefaultProject()
    expect(applyNodeGeometry(p,'root-home','desktop',{kind:'move',x:40,y:20})).toBe(false)
    expect(applyNodeGeometry(p,'missing','desktop',{kind:'move',x:40,y:20})).toBe(false)
    expect(applyNodeGeometry(p,'hero-title-home','desktop',{kind:'resize',width:Number.NaN})).toBe(false)
  })
})
