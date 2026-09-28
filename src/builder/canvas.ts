import type { BuilderProject } from './types'
import { compileInteractionRuntime, compileProjectCss, renderPageBody } from './compiler'

export function createCanvasDocument(project:BuilderProject){
  const css=compileProjectCss(project)
  const body=renderPageBody(project,project.activePageId,true)
  const interactionRuntime=compileInteractionRuntime(project)
  return `<!doctype html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&family=Manrope:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
${css}
html.builder-editing [data-builder-node]{position:relative}
html.builder-editing [data-builder-node]:hover{outline:1px solid rgba(99,102,241,.72);outline-offset:2px}
html.builder-editing [data-builder-node].builder-hovered{outline:1px solid #818cf8;outline-offset:2px}
html.builder-editing [data-builder-node].builder-selected{outline:2px solid #6366f1!important;outline-offset:3px}
html.builder-editing [data-builder-node].builder-selected::after{content:'';position:absolute;inset:-4px;pointer-events:none;border:1px solid rgba(99,102,241,.25)}
.builder-node-label{position:fixed;z-index:2147483647;pointer-events:none;background:#4f46e5;color:#fff;font:600 11px/1.2 Arial,sans-serif;padding:5px 7px;border-radius:5px;box-shadow:0 4px 12px rgba(0,0,0,.14)}
html:not(.builder-editing) .builder-node-label,html:not(.builder-editing) .builder-spacing-handle{display:none}
.builder-spacing-handle{position:fixed;z-index:2147483646;width:12px;height:12px;border-radius:3px;display:grid;place-items:center;color:#fff;font:700 7px/1 Arial,sans-serif;cursor:ns-resize;user-select:none;box-shadow:0 2px 8px rgba(0,0,0,.2)}
.builder-spacing-handle[data-edge="left"],.builder-spacing-handle[data-edge="right"]{cursor:ew-resize}
.builder-spacing-handle[data-kind="padding"]{background:#10b981}.builder-spacing-handle[data-kind="margin"]{background:#f59e0b}
.cms-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.cms-card{border:1px solid #e5e7eb;border-radius:12px;padding:18px}.cms-card img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;margin-bottom:14px}
.html-embed-preview{min-height:40px;outline:1px dashed #a1a1aa}
@media(max-width:767px){.cms-grid{grid-template-columns:1fr}}
</style>
</head>
<body>
${body}
<script>
(() => {
  document.documentElement.classList.add('builder-editing')
  let selected = null
  let hovered = null
  let label = null
  let handles = []
  const clearHandles=()=>{handles.forEach(h=>h.remove());handles=[]}
  const spacingProperty=(kind,edge)=>kind+(edge[0].toUpperCase()+edge.slice(1))
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
    removeLabel();clearHandles()
    if(!el||!document.documentElement.classList.contains('builder-editing'))return
    const rect=el.getBoundingClientRect()
    label=document.createElement('div')
    label.className='builder-node-label'
    label.textContent=el.dataset.builderName||el.tagName.toLowerCase()
    label.style.left=Math.max(4,Math.min(rect.left,window.innerWidth-160))+'px'
    label.style.top=Math.max(4,rect.top-25)+'px'
    document.body.appendChild(label)
    const computed=getComputedStyle(el)
    const positions={
      top:{padding:[rect.left+rect.width/2,rect.top+9],margin:[rect.left+rect.width/2,rect.top-9]},
      bottom:{padding:[rect.left+rect.width/2,rect.bottom-9],margin:[rect.left+rect.width/2,rect.bottom+9]},
      left:{padding:[rect.left+9,rect.top+rect.height/2],margin:[rect.left-9,rect.top+rect.height/2]},
      right:{padding:[rect.right-9,rect.top+rect.height/2],margin:[rect.right+9,rect.top+rect.height/2]}
    }
    ;['margin','padding'].forEach(kind=>['top','right','bottom','left'].forEach(edge=>{
      const h=document.createElement('div');h.className='builder-spacing-handle';h.dataset.kind=kind;h.dataset.edge=edge;h.textContent=kind==='padding'?'P':'M'
      const pos=positions[edge][kind];h.style.left=(pos[0]-6)+'px';h.style.top=(pos[1]-6)+'px'
      h.onpointerdown=startEvent=>{
        startEvent.preventDefault();startEvent.stopPropagation();h.setPointerCapture?.(startEvent.pointerId)
        const prop=spacingProperty(kind,edge)
        const base=parseFloat(computed[prop])||0
        const startX=startEvent.clientX,startY=startEvent.clientY
        let finalValue=base
        const move=event=>{
          const dx=event.clientX-startX,dy=event.clientY-startY
          const factor=edge==='top'||edge==='left'?-1:1
          const delta=(edge==='left'||edge==='right'?dx:dy)*factor*(kind==='padding'?-1:1)
          finalValue=Math.max(kind==='padding'?0:-500,Math.round(base+delta))
          el.style[prop]=finalValue+'px'
          drawLabel(el)
        }
        const up=()=>{
          window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up)
          send('spacing-change',{id:el.dataset.builderNode,property:prop,value:finalValue+'px'})
        }
        window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true})
      }
      document.body.appendChild(h);handles.push(h)
    }))
  }
  const send=(type,payload={})=>parent.postMessage({source:'cobest-builder',type,...payload},'*')
  document.addEventListener('mousemove', event => {
    if(!document.documentElement.classList.contains('builder-editing'))return
    const el=event.target.closest?.('[data-builder-node]')
    const id=el?.dataset?.builderNode||null
    if(id===hovered)return
    hovered=id
    send('hover',{id})
  }, {passive:true})
  document.addEventListener('mouseleave',()=>send('hover',{id:null}))
  document.addEventListener('click', event => {
    if(!document.documentElement.classList.contains('builder-editing'))return
    const el=event.target.closest?.('[data-builder-node]')
    if(!el)return
    event.preventDefault()
    event.stopPropagation()
    send('select',{id:el.dataset.builderNode})
  }, true)
  document.addEventListener('dblclick', event => {
    if(!document.documentElement.classList.contains('builder-editing'))return
    const el=event.target.closest?.('[data-builder-node]')
    if(!el)return
    const tag=el.tagName.toLowerCase()
    if(['img','input','textarea','select','video','iframe','form'].includes(tag))return
    event.preventDefault();event.stopPropagation()
    el.contentEditable='true'
    el.focus()
    const range=document.createRange();range.selectNodeContents(el);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range)
    const finish=()=>{
      el.contentEditable='false'
      send('text-change',{id:el.dataset.builderNode,content:el.textContent||''})
      el.removeEventListener('blur',finish)
    }
    el.addEventListener('blur',finish)
  }, true)
  document.addEventListener('contextmenu',event=>{
    if(!document.documentElement.classList.contains('builder-editing'))return
    const el=event.target.closest?.('[data-builder-node]')
    if(!el)return
    event.preventDefault()
    send('context',{id:el.dataset.builderNode,x:event.clientX,y:event.clientY})
  })
  window.addEventListener('scroll',()=>{const el=selected?document.querySelector('[data-builder-node="'+CSS.escape(selected)+'"]'):null;drawLabel(el)},{passive:true})
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
      if(msg.editing===false){clearClass(selected,'builder-selected');clearClass(hovered,'builder-hovered');removeLabel();clearHandles()}
      else {apply(selected,'builder-selected');apply(hovered,'builder-hovered');drawLabel(selected?document.querySelector('[data-builder-node="'+CSS.escape(selected)+'"]'):null)}
    }
  })
  ${interactionRuntime}
})()
</script>
</body>
</html>`
}
