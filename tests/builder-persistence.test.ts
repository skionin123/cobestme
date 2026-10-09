import { afterEach, describe, expect, it } from 'vitest'
import { createDefaultProject } from '../src/builder/defaultProject'
import { indexedDbRepository, loadProject, saveProject, setProjectRepository, type ProjectRepository } from '../src/builder/persistence'
import type { BuilderProject } from '../src/builder/types'

const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value))

describe('builder persistence boundary',()=>{
  afterEach(()=>setProjectRepository(indexedDbRepository))

  it('round-trips the full editable project through the repository contract',async()=>{
    const records=new Map<string,BuilderProject>()
    const memory:ProjectRepository={
      async save(project){records.set(project.id,clone(project))},
      async load(id){const value=records.get(id);return value?clone(value):undefined},
      async remove(id){records.delete(id)}
    }
    setProjectRepository(memory)
    const project=createDefaultProject()
    project.name='Saved MVP'
    project.pages[0].root.children[1].children[0].children[0].content='Persisted heading'
    project.styles.display.mobilePortrait={none:{fontSize:'30px'}}
    project.assets=[{id:'asset-1',name:'hero.png',mimeType:'image/png',url:'data:image/png;base64,AA==',createdAt:'2026-10-09'}]

    await saveProject(project)
    const reopened=await loadProject(project.id)
    expect(reopened).toEqual(project)
    expect(reopened?.pages[0].root.children[1].children[0].children[0].content).toBe('Persisted heading')
    expect(reopened?.styles.display.mobilePortrait?.none?.fontSize).toBe('30px')
    expect(reopened?.assets[0].name).toBe('hero.png')
  })
})
