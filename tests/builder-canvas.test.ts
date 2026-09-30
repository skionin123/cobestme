import { describe, expect, it } from 'vitest'
import { createCanvasDocument } from '../src/builder/canvas'
import { createDefaultProject } from '../src/builder/defaultProject'

describe('visual builder canvas document',()=>{
  it('renders a clean preview without editor-only attributes',()=>{
    const project=createDefaultProject()
    const html=createCanvasDocument(project,'desktop',false)
    const bodyMarkup=html.split('<body>')[1].split('<script>')[0]
    expect(bodyMarkup).not.toContain('data-builder-node=')
    expect(bodyMarkup).not.toContain('data-builder-type=')
    expect(html).toContain("classList.toggle('builder-editing',false)")
    expect(html).toContain('min-height:72vh')
  })

  it('keeps edit layout stable while exposing full-page canvas controls',()=>{
    const project=createDefaultProject()
    const html=createCanvasDocument(project,'desktop',true)
    const bodyMarkup=html.split('<body>')[1].split('<script>')[0]
    expect(bodyMarkup).toContain('data-builder-node=')
    expect(bodyMarkup).toContain('data-builder-type=')
    expect(html).toContain("classList.toggle('builder-editing',true)")
    expect(html).toContain("send('canvas-resize'")
    expect(html).toContain("send('canvas-drop'")
    expect(html).toContain('builder-drop-marker')
    expect(html).not.toContain('html.builder-editing [data-builder-node]{position:relative}')
    expect(html).toContain('min-height:648px')
  })

  it('normalizes viewport units to the selected editing breakpoint',()=>{
    const project=createDefaultProject()
    expect(createCanvasDocument(project,'tablet',true)).toContain('min-height:547.2px')
    expect(createCanvasDocument(project,'mobileLandscape',true)).toContain('min-height:309.6px')
  })
})
