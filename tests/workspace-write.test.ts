import { afterEach, describe, expect, it, vi } from 'vitest'
import { saveWorkspace } from '../src/api.js'

describe('workspace cloud save ordering',()=>{
  afterEach(()=>vi.unstubAllGlobals())

  it('serializes overlapping writes so an older response cannot overwrite a later save',async()=>{
    const values=new Map([['cobest-active-site-id','42']])
    vi.stubGlobal('localStorage',{
      getItem:(key:string)=>values.get(key)||null,
      setItem:(key:string,value:string)=>{values.set(key,value)},
      removeItem:(key:string)=>{values.delete(key)}
    })
    let releaseFirst:()=>void=()=>{}
    let startedFirst:()=>void=()=>{}
    const firstGate=new Promise<void>(resolve=>{releaseFirst=resolve})
    const firstStarted=new Promise<void>(resolve=>{startedFirst=resolve})
    const payloads:string[]=[]
    vi.stubGlobal('fetch',vi.fn(async (_url:string,options:RequestInit)=>{
      payloads.push(String(options.body))
      if(payloads.length===1){
        startedFirst()
        await firstGate
      }
      return new Response(JSON.stringify([{id:42}]),{
        status:200,headers:{'content-type':'application/json'}
      })
    }))
    const first=saveWorkspace({editor:{visualBuilderProject:{version:1}}})
    const second=saveWorkspace({editor:{visualBuilderProject:{version:2}}})
    await firstStarted
    expect(payloads).toHaveLength(1)
    releaseFirst()
    await Promise.all([first,second])
    expect(payloads).toHaveLength(2)
    expect(JSON.parse(payloads[0]).editor.visualBuilderProject.version).toBe(1)
    expect(JSON.parse(payloads[1]).editor.visualBuilderProject.version).toBe(2)
  })
})
