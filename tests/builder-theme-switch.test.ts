import {describe,expect,it} from 'vitest'
import {createDefaultProject} from '../src/builder/defaultProject'
import {builderTemplates} from '../src/builder/templates'
import {prepareThemeSwitch} from '../src/builder/themeSwitch'

describe('safe beginner theme switching',()=>{
  const online=builderTemplates.find(item=>item.id==='storefront')!
  const simple=builderTemplates.find(item=>item.id==='essential')!
  it('creates a starter project without fake prior revisions',()=>{
    const next=prepareThemeSwitch(online,null,'merchant-17','Coffee & Gifts',1700000000000)
    expect(next.id).toBe('merchant-17')
    expect(next.name).toBe('Coffee & Gifts')
    expect(next.pages.length).toBeGreaterThan(0)
    expect(next.versions).toHaveLength(0)
  })
  it('keeps a restorable independent draft, existing media assets and project ownership',()=>{
    const previous=createDefaultProject()
    previous.id='merchant-42'
    previous.name='My handmade shop'
    previous.pages[0].name='Home · Old version'
    previous.assets=[{id:'asset-1',name:'Product image',type:'image',url:'https://example.com/product.jpg'}]
    previous.updatedAt='2026-10-01T00:00:00.000Z'
    const next=prepareThemeSwitch(simple,previous,'merchant-42','My handmade shop',Date.parse('2026-10-02T00:00:00.000Z'))
    expect(next.id).toBe(previous.id)
    expect(next.name).toBe(previous.name)
    expect(next.pages[0].name).not.toBe('Home · Old version')
    expect(next.assets).toEqual(previous.assets)
    expect(next.versions[0].label).toBe('Before switching to Simple')
    expect(next.versions[0].project.pages[0].name).toBe('Home · Old version')
    expect(next.versions[0].project).not.toHaveProperty('versions')
    expect(next.versions[0].project.pages[0].root).not.toBe(previous.pages[0].root)
    expect(next.updatedAt).not.toBe(previous.updatedAt)
    expect(next.version).toBeGreaterThan(previous.version)
  })
})
