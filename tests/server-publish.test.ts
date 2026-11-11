import { describe, expect, it } from 'vitest'
import {
  clipAddress, clipMetadata, clipText, homeSourceOf, liveVisualProject,
  preparePublishSnapshot, publicStorePayload, publishSummary, sniffMediaType,
} from '../server-publish.mjs'

const visual=(name='Home')=>({name:'Site',pages:[{id:'p1',name,slug:'',root:{}}],versions:[{id:'v1'}]})
const shopDesign={theme:'market',headline:'Fresh bread'}

describe('what goes live when a merchant publishes',()=>{
  it('never publishes the Advanced editor draft from a shop or settings publish',()=>{
    const incoming={products:[],editor:{shopDesign,visualBuilderProject:visual('Draft home')}}
    const out=preparePublishSnapshot(incoming,null)
    expect(out.editor.visualBuilderProject).toBeUndefined()
    expect(out.visual_project).toBeUndefined()
    expect(out.home_source).toBe('storefront')
    // The browser's object is left alone.
    expect(incoming.editor.visualBuilderProject).toBeDefined()
  })

  it('keeps custom pages that are already live when products or the theme are republished',()=>{
    const existing={visual_project:visual('Live home'),home_source:'custom',editor:{shopDesign}}
    const out=preparePublishSnapshot({products:[],editor:{shopDesign,visualBuilderProject:visual('Unfinished draft')}},existing)
    expect(out.visual_project.pages[0].name).toBe('Live home')
    expect(out.home_source).toBe('custom')
  })

  it('lets the visual editor publish pages without replacing a storefront homepage',()=>{
    const existing={editor:{shopDesign},home_source:'storefront'}
    const out=preparePublishSnapshot({editor:{shopDesign},visual_project:visual(),home_source:'storefront'},existing)
    expect(out.home_source).toBe('storefront')
    expect(out.visual_project.pages).toHaveLength(1)
    expect(out.visual_project.versions).toEqual([])
  })

  it('stores the live pages and the homepage choice under both names, and never the draft',()=>{
    const out=preparePublishSnapshot({editor:{shopDesign,visualBuilderProject:visual('Unfinished draft')},visual_project:visual('Live home'),home_source:'storefront'},null)
    expect(out.visual_project.pages[0].name).toBe('Live home')
    expect(out.editor.visualBuilderProject.pages[0].name).toBe('Live home')
    expect(out.editor.visualBuilderProject.versions).toEqual([])
    expect(out.editor.homeSource).toBe('storefront')
    expect(JSON.stringify(out)).not.toContain('Unfinished draft')
    // A later shop publish carries both copies over, again without the draft.
    const later=preparePublishSnapshot({products:[],editor:{shopDesign,visualBuilderProject:visual('Newer draft')}},out)
    expect(later.visual_project.pages[0].name).toBe('Live home')
    expect(later.editor.visualBuilderProject.pages[0].name).toBe('Live home')
    expect(later.editor.homeSource).toBe('storefront')
    expect(JSON.stringify(later)).not.toContain('Newer draft')
  })

  it('does not let the browser set the homepage through the editor settings',()=>{
    const existing=preparePublishSnapshot({editor:{shopDesign},visual_project:visual(),home_source:'storefront'},null)
    const out=preparePublishSnapshot({products:[],editor:{shopDesign,homeSource:'custom'}},existing)
    expect(out.home_source).toBe('storefront')
    expect(out.editor.homeSource).toBe('storefront')
  })

  it('makes the custom homepage live only when asked',()=>{
    const out=preparePublishSnapshot({editor:{shopDesign},visual_project:visual(),home_source:'custom'},{editor:{shopDesign},home_source:'storefront'})
    expect(out.home_source).toBe('custom')
  })

  it('treats an older browser that publishes the visual site as choosing the custom homepage',()=>{
    expect(preparePublishSnapshot({visual_project:visual()},null).home_source).toBe('custom')
  })

  it('falls back to the storefront when a custom homepage is requested but no pages exist',()=>{
    expect(preparePublishSnapshot({home_source:'custom',editor:{}},null).home_source).toBe('storefront')
    expect(preparePublishSnapshot({home_source:'custom',visual_project:{pages:[]}},null).visual_project).toBeUndefined()
  })

  it('ignores home_source values it does not know',()=>{
    expect(preparePublishSnapshot({home_source:'<script>',editor:{}},{home_source:'custom',visual_project:visual()}).home_source).toBe('custom')
  })

  it('publishes only Active products',()=>{
    const out=preparePublishSnapshot({products:[{id:1,status:'Active'},{id:2,status:'Draft'},{id:3,status:'Archived'},null,'x']},null)
    expect(out.products.map((p:any)=>p.id)).toEqual([1])
  })

  it('removes editor history that visitors do not need',()=>{
    const out=preparePublishSnapshot({editor:{shopDesign,previousShopDesign:{theme:'atelier'}}},null)
    expect(out.editor.previousShopDesign).toBeUndefined()
    expect(out.editor.shopDesign).toEqual(shopDesign)
  })

  it('rejects snapshots that are not objects',()=>{
    for(const bad of [null,undefined,'x',5,[]]) expect(preparePublishSnapshot(bad as any,null)).toBeNull()
  })
})

describe('homepage rule for stores published before home_source existed',()=>{
  it('shows the storefront when only a shop design exists',()=>{
    expect(homeSourceOf({editor:{shopDesign}})).toBe('storefront')
    expect(homeSourceOf({editor:{shopDesign,visualBuilderProject:visual()}})).toBe('storefront')
  })
  it('shows the custom site when the visual project was published',()=>{
    expect(homeSourceOf({visual_project:visual(),editor:{shopDesign}})).toBe('custom')
    expect(homeSourceOf({editor:{visualBuilderProject:visual()}})).toBe('custom')
  })
  it('never reports a custom homepage without pages',()=>{
    expect(homeSourceOf({home_source:'custom'})).toBe('storefront')
    expect(homeSourceOf(null)).toBe('storefront')
    expect(liveVisualProject({visual_project:{pages:[]}})).toBeNull()
  })
})

describe('the live site does not depend on which keys the database passes on',()=>{
  // The function that serves published stores lives in the database, not in
  // this repository. Whether it returns the whole snapshot or only the parts
  // the first version of the public page used, visitors must see the same.
  const published=preparePublishSnapshot({editor:{shopDesign},visual_project:visual('About us'),home_source:'storefront',products:[]},null)
  const onlyOldKeys=(snapshot:any)=>{const {visual_project:_pages,home_source:_home,...rest}=snapshot;return rest}

  it('keeps the shop as the homepage and still finds the custom pages',()=>{
    for(const stored of [published,onlyOldKeys(published)]){
      expect(homeSourceOf(stored)).toBe('storefront')
      expect(liveVisualProject(stored).pages[0].name).toBe('About us')
      expect(publishSummary(stored)).toMatchObject({home_source:'storefront',has_custom_pages:true,custom_page_names:['About us']})
    }
  })
  it('keeps a custom homepage custom',()=>{
    const custom=preparePublishSnapshot({editor:{shopDesign},visual_project:visual('Home'),home_source:'custom'},null)
    expect(homeSourceOf(onlyOldKeys(custom))).toBe('custom')
  })
  it('sends visitors one copy of the pages either way',()=>{
    for(const stored of [published,onlyOldKeys(published)]){
      const out=publicStorePayload({slug:'bread',...stored})
      expect(out.home_source).toBe('storefront')
      expect(out.visual_project.pages[0].name).toBe('About us')
      expect(out.editor.visualBuilderProject).toBeUndefined()
      expect(out.editor.homeSource).toBeUndefined()
      expect(out.editor.shopDesign).toEqual(shopDesign)
      expect(JSON.stringify(out).split('About us')).toHaveLength(2)
    }
  })
  it('shows stores published by the previous version exactly as before',()=>{
    // Old publishes carried the editor copy only; with a shop design the shop was the homepage.
    const oldShop={editor:{shopDesign,visualBuilderProject:visual('Old pages')},products:[]}
    expect(publicStorePayload(oldShop)).toMatchObject({home_source:'storefront',visual_project:{pages:[{name:'Old pages'}]}})
    // Without a shop design the pages were the homepage.
    expect(publicStorePayload({editor:{visualBuilderProject:visual('Old home')}}).home_source).toBe('custom')
    // A store with no custom pages has none afterwards either.
    expect(publicStorePayload({editor:{shopDesign}}).visual_project).toBeUndefined()
  })
})

describe('publish summary and public payload',()=>{
  it('describes what is live without sending the whole snapshot',()=>{
    const summary=publishSummary({visual_project:visual('About us'),home_source:'storefront',editor:{shopDesign}})
    expect(summary).toEqual({home_source:'storefront',has_custom_pages:true,custom_page_names:['About us'],storefront_theme:'market'})
    expect(publishSummary(null)).toEqual({home_source:'storefront',has_custom_pages:false,custom_page_names:[],storefront_theme:''})
  })

  it('does not send discount codes or unpublished products to visitors',()=>{
    const store={
      products:[{id:1,status:'Active'},{id:2,status:'Draft'}],
      discounts:[{code:'VIP50',value:50}],
      editor:{shopDesign,previousShopDesign:{theme:'atelier'}},
      settings:{shippingFlat:5},
    }
    const out=publicStorePayload(store)
    expect(JSON.stringify(out)).not.toContain('VIP50')
    expect(out.discounts).toBeUndefined()
    expect(out.products).toHaveLength(1)
    expect(out.editor.previousShopDesign).toBeUndefined()
    expect(out.home_source).toBe('storefront')
    // The stored snapshot still has what checkout needs.
    expect(store.discounts).toHaveLength(1)
    expect(store.products).toHaveLength(2)
  })
})

describe('input from anonymous visitors is bounded',()=>{
  it('clips text and removes null bytes',()=>{
    expect(clipText('  hello  ',3)).toBe('hel')
    expect(clipText('a\u0000b',10)).toBe('ab')
    expect(clipText(null,10)).toBe('')
    expect(clipText({toString(){return 'obj'}},10)).toBe('obj')
  })
  it('drops oversized or non-object analytics metadata',()=>{
    expect(clipMetadata({page:'/'})).toEqual({page:'/'})
    expect(clipMetadata({blob:'x'.repeat(5000)})).toEqual({})
    expect(clipMetadata('x')).toEqual({})
    expect(clipMetadata([1,2])).toEqual({})
    const loop:any={}; loop.self=loop
    expect(clipMetadata(loop)).toEqual({})
  })
  it('keeps only known address fields',()=>{
    expect(clipAddress({line1:' 1 Main St ',city:'Cebu',admin:true,__proto__:{x:1},notes:'x'.repeat(999)})).toEqual({line1:'1 Main St',city:'Cebu'})
    expect(clipAddress('nope')).toEqual({})
    expect(clipAddress({line1:'x'.repeat(500)}).line1).toHaveLength(200)
  })
})

describe('uploads are identified by their real content',()=>{
  const bytes=(...parts:(number[]|string)[])=>{
    const out:number[]=[]
    for(const part of parts) for(const item of typeof part==='string'?[...part].map(c=>c.charCodeAt(0)):part) out.push(item)
    while(out.length<32) out.push(0)
    return Buffer.from(out)
  }
  it('recognises the allowed image, video and PDF formats',()=>{
    expect(sniffMediaType(bytes([0x89],'PNG\r\n',[0x1a,0x0a]))).toBe('image/png')
    expect(sniffMediaType(bytes([0xff,0xd8,0xff,0xe0]))).toBe('image/jpeg')
    expect(sniffMediaType(bytes('GIF89a'))).toBe('image/gif')
    expect(sniffMediaType(bytes('RIFF',[1,2,3,4],'WEBPVP8 '))).toBe('image/webp')
    expect(sniffMediaType(bytes('%PDF-1.7'))).toBe('application/pdf')
    expect(sniffMediaType(bytes([0x1a,0x45,0xdf,0xa3]))).toBe('video/webm')
    expect(sniffMediaType(bytes([0,0,0,0x20],'ftypavif'))).toBe('image/avif')
    expect(sniffMediaType(bytes([0,0,0,0x20],'ftypisom'))).toBe('video/mp4')
  })
  it('rejects HTML, SVG, scripts and renamed files',()=>{
    expect(sniffMediaType(Buffer.from('<!doctype html><script>alert(1)</script>'))).toBe('')
    expect(sniffMediaType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'))).toBe('')
    expect(sniffMediaType(Buffer.from('#!/bin/sh\nrm -rf / # padding padding'))).toBe('')
    expect(sniffMediaType(bytes([0,0,0,0x20],'ftypheic'))).toBe('')
    expect(sniffMediaType(Buffer.from('tiny'))).toBe('')
    expect(sniffMediaType(null as any)).toBe('')
  })
})
