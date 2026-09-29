import { describe, expect, it } from 'vitest'
import { createDefaultProject } from '../src/builder/defaultProject'
import { exportFiles, makeZip } from '../src/builder/export'

describe('builder export',()=>{
  it('creates the expected clean site files',()=>{
    const project=createDefaultProject()
    const files=exportFiles(project)
    expect(Object.keys(files)).toContain('index.html')
    expect(Object.keys(files)).toContain('styles.css')
    expect(Object.keys(files)).toContain('site.js')
    expect(Object.keys(files)).toContain('sitemap.xml')
    expect(Object.keys(files)).toContain('project.cobest.json')
    expect(String(files['index.html'])).not.toContain('data-builder-node')
  })

  it('creates a valid ZIP local-file signature',()=>{
    const zip=makeZip({'index.html':'<h1>Hello</h1>','styles.css':'body{}'})
    expect(Array.from(zip.slice(0,4))).toEqual([0x50,0x4b,0x03,0x04])
    expect(zip.length).toBeGreaterThan(40)
  })

  it('exports CMS collection template items as pages',()=>{
    const project=createDefaultProject()
    project.collections=[{
      id:'collection-1',name:'Blog Posts',slug:'blog',
      fields:[{id:'title',name:'Title',slug:'title',type:'text'}],
      items:[{id:'item-1',values:{title:'Hello World'},createdAt:'2026-01-01',updatedAt:'2026-01-01'}],
      templatePageId:'template-1'
    }]
    project.pages.push({
      id:'template-1',name:'Blog Posts Template',slug:'/blog/{slug}',isCollectionTemplate:true,collectionId:'collection-1',
      seo:{title:'Blog',description:'',slug:'/blog/{slug}'},
      root:{id:'root-template',type:'div',tag:'main',name:'Template',classes:[],attributes:{},children:[
        {id:'title-node',type:'heading',tag:'h1',name:'Title',classes:[],attributes:{'data-cms-field':'title'},content:'Placeholder',children:[]}
      ]}
    })
    const files=exportFiles(project)
    expect(Object.keys(files)).toContain('blog-hello-world.html')
    expect(String(files['blog-hello-world.html'])).toContain('Hello World')
  })
})
