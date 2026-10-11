import { describe, expect, it } from 'vitest'
import { editorShortcutFor } from '../src/builder/shortcuts'

describe('visual builder shortcut mapping',()=>{
  it('maps platform commands with modifiers',()=>{
    expect(editorShortcutFor({key:'z',ctrlKey:true},false)).toBe('undo')
    expect(editorShortcutFor({key:'z',metaKey:true,shiftKey:true},false)).toBe('redo')
    expect(editorShortcutFor({key:'y',ctrlKey:true},false)).toBe('redo')
    for(const [key,action] of [['c','copy'],['v','paste'],['d','duplicate'],['s','save']] as const)
      expect(editorShortcutFor({key,ctrlKey:true},false)).toBe(action)
  })
  it('supports arrows, shift nudge, delete and escape',()=>{
    expect(editorShortcutFor({key:'ArrowUp'},false)).toBe('nudge-up')
    expect(editorShortcutFor({key:'ArrowLeft',shiftKey:true},false)).toBe('nudge-left-large')
    expect(editorShortcutFor({key:'Delete'},false)).toBe('delete')
    expect(editorShortcutFor({key:'Backspace'},false)).toBe('delete')
    expect(editorShortcutFor({key:'Escape'},false)).toBe('escape')
  })
  it('never captures native shortcuts while typing or with Alt',()=>{
    expect(editorShortcutFor({key:'z',ctrlKey:true},true)).toBeNull()
    expect(editorShortcutFor({key:'c',ctrlKey:true},true)).toBeNull()
    expect(editorShortcutFor({key:'ArrowLeft'},true)).toBeNull()
    expect(editorShortcutFor({key:'z',ctrlKey:true,altKey:true},false)).toBeNull()
    expect(editorShortcutFor({key:'c',ctrlKey:true,shiftKey:true},false)).toBeNull()
  })
})
