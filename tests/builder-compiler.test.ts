import { describe, expect, it } from 'vitest'
import { createDefaultProject } from '../src/builder/defaultProject'
import { compileProjectCss, renderPageBody } from '../src/builder/compiler'

describe('builder compiler',()=>{
  it('compiles global variables and responsive breakpoints',()=>{
    const project=createDefaultProject()
    const css=compileProjectCss(project)
    expect(css).toContain('--ink:#111318')
    expect(css).toContain('@media(max-width:991px)')
    expect(css).toContain('@media(max-width:478px)')
  })

  it('does not emit editor attributes in clean output',()=>{
    const project=createDefaultProject()
    const html=renderPageBody(project,project.activePageId,false)
    expect(html).not.toContain('data-builder-node')
    expect(html).toContain('Build something remarkable.')
  })

  it('does emit selection attributes for editor rendering',()=>{
    const project=createDefaultProject()
    const html=renderPageBody(project,project.activePageId,true)
    expect(html).toContain('data-builder-node')
    expect(html).toContain('data-builder-name')
  })

  it('uses smaller-breakpoint overrides without removing desktop CSS',()=>{
    const project=createDefaultProject()
    project.styles.test={desktop:{none:{fontSize:'50px'}},mobilePortrait:{none:{fontSize:'28px'}}}
    const css=compileProjectCss(project)
    expect(css).toContain('.test{font-size:50px}')
    expect(css).toContain('@media(max-width:478px)')
    expect(css).toContain('.test{font-size:28px}')
  })
})
