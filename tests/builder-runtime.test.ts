import { describe, expect, it } from 'vitest'
import { createCanvasDocument } from '../src/builder/canvas'
import { createDefaultProject } from '../src/builder/defaultProject'
import { createPrebuiltSection } from '../src/builder/elements'
import { exportFiles } from '../src/builder/export'
import { createPublishedDocument } from '../src/builder/publicDocument'
import { mapFormFields, NO_MESSAGE, rewriteLinksForExport, siteRuntime } from '../src/builder/runtime'

describe('one website script for live site, preview and export',()=>{
  const project=createDefaultProject()
  it('is safe to embed in a page',()=>{
    for(const mode of ['published','preview','export'] as const){
      const script=siteRuntime(project,mode)
      expect(script).not.toContain('</script')
      expect(script).not.toContain('\\')
      // It must parse as JavaScript.
      expect(()=>new Function(script)).not.toThrow()
    }
  })
  it('passes page links and form messages to the page around it',()=>{
    const html=createPublishedDocument(project,project.pages[0].id)
    expect(html).toContain("send('navigate',{href:href})")
    expect(html).toContain("'form-submit'")
    expect(html).toContain('data-nav-open')
    expect(html).toContain('var MODE="published"')
    expect(createPublishedDocument(project,project.pages[0].id,{mode:'preview'})).toContain('var MODE="preview"')
  })
  it('keeps the page still while it is being edited',()=>{
    const editing=createCanvasDocument(project,'desktop',true)
    expect(editing).not.toContain("send('navigate'")
    expect(editing).toContain("document.addEventListener('submit',event=>event.preventDefault(),true)")
    expect(createCanvasDocument(project,'desktop',false)).toContain("send('navigate'")
  })
  it('styles the open phone menu and form states in every output',()=>{
    const css=String(exportFiles(project)['styles.css'])
    expect(css).toContain('[data-nav-open="true"] .nav-links{display:flex;flex-direction:column')
    expect(css).toContain('form[data-state="success"] [data-form-success]{display:block}')
  })
})

describe('forms are delivered as name, email and message',()=>{
  it('maps a standard contact form',()=>{
    expect(mapFormFields([
      {tag:'input',type:'text',name:'name',label:'Name',value:' Maria '},
      {tag:'input',type:'email',name:'email',label:'Email',value:'maria@example.com'},
      {tag:'textarea',type:'textarea',name:'message',label:'Message',value:'Do you deliver?'},
    ])).toEqual({name:'Maria',email:'maria@example.com',message:'Do you deliver?',missing:''})
  })
  it('keeps extra answers by adding them to the message',()=>{
    const mapped=mapFormFields([
      {tag:'input',type:'email',label:'Your email',value:'a@b.co'},
      {tag:'input',type:'tel',label:'Phone',value:'0917 000 0000'},
      {tag:'input',type:'checkbox',label:'Call me back',value:'on'},
      {tag:'textarea',label:'How can we help?',value:'Quote please'},
    ])
    expect(mapped.missing).toBe('')
    expect(mapped.message).toBe('Quote please\n\nPhone: 0917 000 0000\nCall me back: Yes')
  })
  it('finds the email even when the field is not labelled as one',()=>{
    expect(mapFormFields([{tag:'input',type:'text',label:'Contact',value:'a@b.co'},{tag:'textarea',value:'Hi'}]).email).toBe('a@b.co')
  })
  it('reports what is missing instead of sending a useless message',()=>{
    expect(mapFormFields([{tag:'input',type:'text',label:'Name',value:'Ana'},{tag:'textarea',value:'Hi'}]).missing).toBe('email')
    expect(mapFormFields([{tag:'input',type:'email',value:'not-an-email'},{tag:'textarea',value:'Hi'}]).missing).toBe('email')
    // The visitor left the message box empty: ask for a message.
    expect(mapFormFields([{tag:'input',type:'email',value:'a@b.co'},{tag:'textarea',label:'Message',value:'  '}]).missing).toBe('message')
    expect(mapFormFields([{tag:'input',type:'email',value:'a@b.co'},{tag:'input',type:'text',label:'Your question',value:''}]).missing).toBe('message')
    expect(mapFormFields(null).missing).toBe('email')
    expect(mapFormFields('nonsense').missing).toBe('email')
  })
  it('still delivers a form that has no message box, so visitors never get stuck',()=>{
    // "Leave your email" and "name + email" forms have nothing more to fill in.
    expect(mapFormFields([{tag:'input',type:'email',value:'a@b.co'}])).toEqual({name:'',email:'a@b.co',message:NO_MESSAGE,missing:''})
    expect(mapFormFields([{tag:'input',type:'text',name:'name',label:'Name',value:'Ana'},{tag:'input',type:'email',label:'Email',value:'a@b.co'}]))
      .toEqual({name:'Ana',email:'a@b.co',message:NO_MESSAGE,missing:''})
    // Other answers are the message when there is no message box.
    expect(mapFormFields([{tag:'input',type:'email',value:'a@b.co'},{tag:'input',type:'tel',label:'Phone',value:'0917'}]).message).toBe('Phone: 0917')
  })
  it('bounds what a page can send',()=>{
    const many=Array.from({length:500},(_,i)=>({tag:'input',type:'text',label:'F'+i,value:'x'.repeat(9000)}))
    const mapped=mapFormFields([{tag:'input',type:'email',value:'a@b.co'},...many])
    expect(mapped.message.length).toBeLessThanOrEqual(5000)
  })
})

describe('exported websites work as plain files',()=>{
  it('points page links at the exported files',()=>{
    const files=new Map([['/','index.html'],['/about-us','about-us.html']])
    expect(rewriteLinksForExport('<a href="/about-us">A</a><a href="/">H</a><a href="/about-us#team">T</a><a href="/missing">M</a><a href="https://x.co/about-us">X</a>',files))
      .toBe('<a href="about-us.html">A</a><a href="index.html">H</a><a href="about-us.html#team">T</a><a href="/missing">M</a><a href="https://x.co/about-us">X</a>')
  })
  it('rewrites menu links in a real export',()=>{
    const p=createDefaultProject()
    p.pages.push({id:'about',name:'About us',slug:'/about-us',seo:{title:'About us',description:'',slug:'/about-us'},
      root:{id:'root-about',type:'div',tag:'main',name:'Page',classes:[],attributes:{},children:[]}})
    p.pages[0].root.children.unshift(createPrebuiltSection('navbar',{pages:p.pages.map(({name,slug})=>({name,slug}))}))
    const html=String(exportFiles(p)['index.html'])
    expect(html).toContain('href="about-us.html"')
    expect(html).toContain('href="index.html"')
    expect(Object.keys(exportFiles(p))).toContain('about-us.html')
  })
})
