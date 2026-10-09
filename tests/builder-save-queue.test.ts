import { describe, expect, it } from 'vitest'
import { createSaveQueue } from '../src/builder/saveQueue'

describe('builder save queue',()=>{
  it('serializes saves in the order requested',async()=>{
    const queue=createSaveQueue()
    const events:string[]=[]
    let releaseFirst:()=>void=()=>{}
    const firstGate=new Promise<void>(resolve=>{releaseFirst=resolve})

    const first=queue(async()=>{
      events.push('first:start')
      await firstGate
      events.push('first:end')
    })
    const second=queue(async()=>{
      events.push('second:start')
      events.push('second:end')
    })

    await Promise.resolve()
    expect(events).toEqual(['first:start'])
    releaseFirst()
    await Promise.all([first,second])
    expect(events).toEqual(['first:start','first:end','second:start','second:end'])
  })

  it('continues with a newer save after an older save fails',async()=>{
    const queue=createSaveQueue()
    const events:string[]=[]
    const first=queue(async()=>{events.push('first');throw new Error('network')})
    const second=queue(async()=>{events.push('second')})
    await expect(first).rejects.toThrow('network')
    await expect(second).resolves.toBeUndefined()
    expect(events).toEqual(['first','second'])
  })
})
