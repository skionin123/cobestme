export type EditorShortcut=
  | 'undo' | 'redo' | 'copy' | 'paste' | 'duplicate' | 'delete'
  | 'save' | 'escape'
  | 'nudge-left' | 'nudge-right' | 'nudge-up' | 'nudge-down'
  | 'nudge-left-large' | 'nudge-right-large' | 'nudge-up-large' | 'nudge-down-large'

export interface ShortcutKey{
  key:string
  ctrlKey?:boolean
  metaKey?:boolean
  shiftKey?:boolean
  altKey?:boolean
}

/** Keep the browser's native typing, text selection and contenteditable Undo. */
export function editorShortcutFor(event:ShortcutKey,isTyping:boolean):EditorShortcut|null{
  if(isTyping||event.altKey)return null
  const key=event.key.toLowerCase()
  const mod=Boolean(event.metaKey||event.ctrlKey)
  if(mod){
    if(key==='z')return event.shiftKey?'redo':'undo'
    if(key==='y'&&!event.shiftKey)return 'redo'
    if(event.shiftKey)return null
    if(key==='c')return 'copy'
    if(key==='v')return 'paste'
    if(key==='d')return 'duplicate'
    if(key==='s')return 'save'
    return null
  }
  if(key==='escape')return 'escape'
  if(key==='delete'||key==='backspace')return 'delete'
  const arrows:{[key:string]:EditorShortcut}={
    arrowleft:'nudge-left',arrowright:'nudge-right',
    arrowup:'nudge-up',arrowdown:'nudge-down',
  }
  const command=arrows[key]
  if(!command)return null
  return event.shiftKey?(`${command}-large` as EditorShortcut):command
}
