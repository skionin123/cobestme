import { describe, expect, it } from 'vitest'
import { createCanvasDocument } from '../src/builder/canvas'
import { createDefaultProject } from '../src/builder/defaultProject'
import { createPublishedDocument } from '../src/builder/publicDocument'
import { builderTemplates } from '../src/builder/templates'
import { clone, walkNodes } from '../src/builder/tree'
import { normalizeProject } from '../src/builder/validate'

describe('projects from outside the editor are checked before use',()=>{
  it('leaves a healthy project unchanged',()=>{
    for(const project of [createDefaultProject(),...builderTemplates.map(t=>t.build())]){
      expect(normalizeProject(project)).toEqual(clone(project))
    }
  })
  it('keeps the saved style order, which is the CSS cascade order',()=>{
    const project=builderTemplates[0].build()
    expect(Object.keys(normalizeProject(project)!.styles)).toEqual(Object.keys(project.styles))
  })
  it('refuses things that are not a website',()=>{
    for(const bad of [null,undefined,'x',42,[],{},{pages:[]},{pages:'nope'},{pages:[null,7]}])expect(normalizeProject(bad)).toBeNull()
    const loop:any={pages:[]};loop.self=loop
    expect(normalizeProject(loop)).toBeNull()
  })
  it('repairs a damaged project instead of crashing the editor',()=>{
    const damaged:any={
      name:{toString(){return 'x'}},version:'abc',activePageId:'gone',styles:'nope',globals:null,
      assets:[{url:'javascript:alert(1)'},{url:'https://cdn.example.com/a.png',name:'ok'},'junk'],
      interactions:[{id:'a b"c',nodeId:'n1',trigger:'click',animation:'fade',duration:'fast',easing:'ease;}*{x:y'},{trigger:'explode'}],
      collections:'x',components:[{master:null}],versions:[{project:{pages:[]}},{label:'Good',project:createDefaultProject()}],
      pages:[{
        id:7,name:'',slug:'about us',seo:null,
        root:{id:'r',type:'spaceship',tag:'SCRIPT',name:5,classes:['ok','bad class','x'.repeat(200),7],
          attributes:{onclick:'alert(1)',srcdoc:'<b>',href:'/a',title:9,nested:{a:1},'bad name':'x'},content:12,
          children:[
            {id:'r',type:'heading',tag:'h1',name:'Twin id',classes:[],attributes:{},children:'nope'},
            'junk',null,
            {id:'c2',type:'paragraph',tag:'p onmouseover=alert(1)',name:'Bad tag',children:[]},
          ]},
      },{id:7,name:'Second',slug:'/second',root:null}],
    }
    const project=normalizeProject(damaged)!
    expect(project).not.toBeNull()
    expect(project.name).toBe('My website')
    expect(project.version).toBe(1)
    expect(project.activePageId).toBe(project.pages[0].id)
    expect(project.assets.map(a=>a.url)).toEqual(['https://cdn.example.com/a.png'])
    expect(project.interactions).toHaveLength(1)
    expect(project.interactions[0]).toMatchObject({id:'a-b-c',duration:500,easing:'ease-out'})
    expect(project.versions.map(v=>v.label)).toEqual(['Good'])
    expect(project.components).toEqual([])
    const [first,second]=project.pages
    expect(first.slug).toBe('/about-us')
    expect(first.seo.title).toBe(first.name)
    expect(second.id).not.toBe(first.id)
    expect(second.root.children).toEqual([])
    const root=first.root
    expect(root.tag).toBe('div')
    expect(root.type).toBe('div')
    expect(root.classes).toEqual(['ok'])
    expect(root.attributes).toEqual({href:'/a',title:'9'})
    expect(root.children).toHaveLength(2)
    expect(root.children[0].id).not.toBe(root.id)
    expect(root.children[1].tag).toBe('div')
    // Whatever came in, both the editing page and the live page can be built.
    expect(()=>createCanvasDocument(project,'desktop',true)).not.toThrow()
    expect(()=>createPublishedDocument(project,project.pages[0].id)).not.toThrow()
  })
  it('limits how deep and how large a page can be',()=>{
    const deep:any={id:'d0',type:'div',tag:'div',name:'d',children:[]}
    let cursor=deep
    for(let i=1;i<200;i++){const next={id:'d'+i,type:'div',tag:'div',name:'d',children:[] as any[]};cursor.children.push(next);cursor=next}
    const wide:any={id:'w',type:'div',tag:'div',name:'w',children:Array.from({length:5000},(_,i)=>({id:'w'+i,type:'paragraph',tag:'p',name:'p',children:[]}))}
    const project=normalizeProject({pages:[{id:'p1',name:'Deep',slug:'/',root:deep},{id:'p2',name:'Wide',slug:'/wide',root:wide}]})!
    let depth=0,count=0
    const measure=(node:any,level:number)=>{depth=Math.max(depth,level);for(const child of node.children)measure(child,level+1)}
    measure(project.pages[0].root,0)
    walkNodes(project.pages[1].root,()=>{count++})
    expect(depth).toBeLessThanOrEqual(60)
    expect(count).toBeLessThanOrEqual(401)
  })
})
