import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultProject } from '../src/builder/defaultProject'
import { chooseLatestProject } from '../src/builder/persistence'
import { useBuilderStore } from '../src/builder/store'

describe('monotonic revisions across undo and redo',()=>{
  beforeEach(()=>useBuilderStore.getState().replaceProject(createDefaultProject(),false))

  it('treats undo and redo as newer saveable edits',()=>{
    const initial=useBuilderStore.getState().project.name
    useBuilderStore.getState().renameProject('Changed name')
    const changed=useBuilderStore.getState().project
    useBuilderStore.getState().undo()
    const undone=useBuilderStore.getState().project
    expect(undone.name).toBe(initial)
    expect(undone.version).toBeGreaterThan(changed.version)
    expect(Date.parse(undone.updatedAt)).toBeGreaterThan(Date.parse(changed.updatedAt))
    expect(chooseLatestProject(undone,changed).project).toEqual(undone)

    useBuilderStore.getState().redo()
    const redone=useBuilderStore.getState().project
    expect(redone.name).toBe('Changed name')
    expect(redone.version).toBeGreaterThan(undone.version)
    expect(Date.parse(redone.updatedAt)).toBeGreaterThan(Date.parse(undone.updatedAt))
  })

  it('prefers the higher revision when timestamps are identical',()=>{
    const cloud=createDefaultProject()
    const local={...cloud,version:cloud.version+1}
    expect(chooseLatestProject(local,cloud).project).toEqual(local)
    expect(chooseLatestProject(cloud,local).project).toEqual(local)
  })
})
