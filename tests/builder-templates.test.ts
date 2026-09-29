import { describe, expect, it } from 'vitest'
import { createDefaultProject } from '../src/builder/defaultProject'
import { applyTemplate, builderTemplates } from '../src/builder/templates'

describe('builder templates',()=>{
  it('covers every requested template category',()=>{
    expect(builderTemplates.map(x=>x.category).sort()).toEqual(
      ['Agency','Blog','Business','Ecommerce','Personal','Portfolio','Restaurant','SaaS'].sort()
    )
  })

  it('applies a template without changing the current project id',()=>{
    const current=createDefaultProject()
    current.id='site-123'
    current.assets=[{id:'asset-1',name:'photo.jpg',mimeType:'image/jpeg',url:'data:image/jpeg;base64,AA==',createdAt:'2026-01-01'}]
    const next=applyTemplate(builderTemplates[0],current)
    expect(next.id).toBe('site-123')
    expect(next.assets).toHaveLength(1)
    expect(next.pages[0].root.children.length).toBeGreaterThan(3)
  })
})
