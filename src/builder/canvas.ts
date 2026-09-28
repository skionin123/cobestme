import type { BuilderNode, BuilderProject, BreakpointId, CssProperties, NodeState } from './types'

const escapeHtml=(value='')=>String(value).replace(/[&<>"']/g,ch=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[ch]||ch))

const escapeAttr=(value='')=>escapeHtml(value).replace(/\n/g,' ')

const styleObjectToCss=(style:CssProperties={})=>Object.entries(style)
  .map(([key,value])=>`${key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}:${value}`)
  .join(';')

const mediaQuery:Record<Exclude<BreakpointId,'desktop'>,string>={
  tablet:'@media(max-width:991px)',
  mobileLandscape:'@media(max-width:767px)',
  mobilePortrait:'@media(max-width:478px)',
}

function compileStateSelector(className:string,state:NodeState){
  if(state==='none') return `.${className}`
  if(state==='pressed') return `.${className}:active`
  if(state==='focused') return `.${className}:focus`
  return `.${className}:${state}`
}

export function compileProjectCss(project:BuilderProject){
  const rootVars=Object.entries(project.globals.colors).map(([key,value])=>`--${key}:${value};`).join('')
  let base=`:root{${rootVars}}*{box-sizing:border-box}html,body{margin:0;min-height:100%;}img,video{max-width:100%;display:block}button,input,textarea,select{font:inherit}`
  const responsive:Record<string,string[]>={tablet:[],mobileLandscape:[],mobilePortrait:[]}
  for(const [className,breakpoints] of Object.entries(project.styles)){
    for(const [breakpoint,states] of Object.entries(breakpoints)){
      if(!states)continue
      for(const [state,props] of Object.entries(states)){
        if(!props)continue
        const rule=`${compileStateSelector(className,state as NodeState)}{${styleObjectToCss(props)}}`
        if(breakpoint==='desktop')base+=rule
        else responsive[breakpoint]?.push(rule)
      }
    }
  }
  for(const bp of ['tablet','mobileLandscape','mobilePortrait'] as const){
    if(responsive[bp].length)base+=`${mediaQuery[bp]}{${responsive[bp].join('')}}`
  }
  return base
}

function nodeHtml(node:BuilderNode):string{
  const tag=/^[a-z][a-z0-9-]*$/i.test(node.tag)?node.tag:'div'
  const attrs=Object.entries(node.attributes||{})
    .filter(([key])=>!/^on/i.test(key))
    .map(([key,value])=>` ${key}="${escapeAttr(value)}"`).join('')
  const classes=(node.classes||[]).join(' ')
  const classAttr=classes?` class="${escapeAttr(classes)}"`:''
  const content=node.content?escapeHtml(node.content):''
  const children=(node.children||[]).map(nodeHtml).join('')
  return `<${tag} data-builder-node="${escapeAttr(node.id)}" data-builder-name="${escapeAttr(node.name)}"${classAttr}${attrs}>${content}${children}</${tag}>`
}

export function createCanvasDocument(project:BuilderProject){
  const page=project.pages.find(x=>x.id===project.activePageId)||project.pages[0]
  const css=compileProjectCss(project)
  return `<!doctype html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
${css}
[data-builder-node]{position:relative}
html.builder-editing [data-builder-node]:hover{outline:1px solid rgba(79,70,229,.65);outline-offset:2px}
html.builder-editing [data-builder-node].builder-hovered{outline:1px solid #6366f1;outline-offset:2px}
html.builder-editing [data-builder-node].builder-selected{outline:2px solid #4f46e5!important;outline-offset:3px}
.builder-node-label{position:fixed;z-index:2147483647;pointer-events:none;background:#4f46e5;color:#fff;font:600 11px/1.2 Arial,sans-serif;padding:5px 7px;border-radius:5px;box-shadow:0 4px 12px rgba(0,0,0,.14)}
</style>
</head>
<body>
${nodeHtml(page.root)}
<script>
(() => {
  document.documentElement.classList.add('builder-editing')
  let selected = null
  let hovered = null
  let label = null
  const clearClass = (id, cls) => {
    if(!id) return
    const el=document.querySelector('[data-builder-node="'+CSS.escape(id)+'"]')
    if(el) el.classList.remove(cls)
  }
  const apply = (id, cls) => {
    if(!id) return
    const el=document.querySelector('[data-builder-node="'+CSS.escape(id)+'"]')
    if(el) el.classList.add(cls)
  }
  const removeLabel=()=>{ if(label){label.remove();label=null} }
  const drawLabel=(el)=>{
    removeLabel()
    if(!el)return
    const rect=el.getBoundingClientRect()
    label=document.createElement('div')
    label.className='builder-node-label'
    label.textContent=el.dataset.builderName||el.tagName.toLowerCase()
    label.style.left=Math.max(4,rect.left)+'px'
    label.style.top=Math.max(4,rect.top-25)+'px'
    document.body.appendChild(label)
  }
  document.addEventListener('mousemove', event => {
    const el=event.target.closest?.('[data-builder-node]')
    const id=el?.dataset?.builderNode||null
    if(id===hovered)return
    hovered=id
    parent.postMessage({source:'cobest-builder',type:'hover',id},'*')
  }, {passive:true})
  document.addEventListener('mouseleave',()=>parent.postMessage({source:'cobest-builder',type:'hover',id:null},'*'))
  document.addEventListener('click', event => {
    const el=event.target.closest?.('[data-builder-node]')
    if(!el)return
    event.preventDefault()
    event.stopPropagation()
    parent.postMessage({source:'cobest-builder',type:'select',id:el.dataset.builderNode},'*')
  }, true)
  window.addEventListener('message',event=>{
    const msg=event.data||{}
    if(msg.source!=='cobest-editor')return
    if(msg.type==='selection'){
      clearClass(selected,'builder-selected');clearClass(hovered,'builder-hovered')
      selected=msg.selected||null;hovered=msg.hovered||null
      apply(selected,'builder-selected');apply(hovered,'builder-hovered')
      const selectedEl=selected?document.querySelector('[data-builder-node="'+CSS.escape(selected)+'"]'):null
      drawLabel(selectedEl)
    }
    if(msg.type==='mode'){
      document.documentElement.classList.toggle('builder-editing',msg.editing!==false)
      if(msg.editing===false){clearClass(selected,'builder-selected');clearClass(hovered,'builder-hovered');removeLabel()}
    }
  })
})()
</script>
</body>
</html>`
}
