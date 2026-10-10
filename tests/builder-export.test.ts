import { describe, expect, it } from 'vitest'
import { createDefaultProject } from '../src/builder/defaultProject'
import { exportFiles, makeZip } from '../src/builder/export'
import { createCanvasDocument } from '../src/builder/canvas'
import { createElement } from '../src/builder/elements'

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

  it('keeps preview content/styles aligned with exported output and rewrites embedded assets',()=>{
    const project=createDefaultProject()
    const image=createElement('image')
    const dataUrl='data:image/png;base64,AA=='
    image.attributes.src=dataUrl
    image.attributes.alt='MVP hero'
    project.assets=[{id:'asset-1',name:'hero.png',mimeType:'image/png',url:dataUrl,alt:'MVP hero',createdAt:'2026-10-09'}]
    project.pages[0].root.children.push(image)
    project.styles.display.desktop.none.fontSize='52px'
    project.styles.display.mobilePortrait={none:{fontSize:'30px'}}

    const preview=createCanvasDocument(project,'desktop',false)
    const files=exportFiles(project)
    const html=String(files['index.html'])
    const css=String(files['styles.css'])

    expect(preview).toContain('Build something remarkable.')
    expect(html).toContain('Build something remarkable.')
    expect(preview).toContain('font-size:52px')
    expect(css).toContain('font-size:52px')
    expect(css).toContain('@media(max-width:478px)')
    expect(html).toContain('assets/asset-1-hero.png')
    expect(Object.keys(files)).toContain('assets/asset-1-hero.png')
    expect(html).not.toContain('data-builder-node')
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
