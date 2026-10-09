import type { BuilderProject } from './types'
import { compileInteractionRuntime, compileProjectCss, renderPageBody } from './compiler'

export function createCanvasDocument(project:BuilderProject,breakpoint:'desktop'|'tablet'|'mobileLandscape'|'mobilePortrait'='desktop',editing=true){
  const rawCss=compileProjectCss(project)
  const virtualViewportHeight={desktop:900,tablet:760,mobileLandscape:430,mobilePortrait:844}[breakpoint]
  const css=editing
    ? rawCss.replace(/(-?[\d.]+)vh\b/g,(_,value)=>String((Number(value)*virtualViewportHeight)/100)+'px')
    : rawCss
  const body=renderPageBody(project,project.activePageId,editing)
  const activePage=project.pages.find(page=>page.id===project.activePageId)||project.pages[0]
  const emptyState=editing&&activePage?.root?.children?.length===0
    ? '<div class="builder-empty-state"><strong>Start building your page</strong><span>Drag a Section onto the canvas.</span></div>'
    : ''
  const interactionRuntime=compileInteractionRuntime(project)
  return `<!doctype html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,700&family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&family=Manrope:wght@300;400;500;600;700;800&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
${css}
html.builder-editing,html.builder-editing body{overflow:hidden}
html.builder-editing [data-builder-node]:hover{outline:1px solid rgba(99,102,241,.72);outline-offset:2px}
html.builder-editing [data-builder-node].builder-hovered{outline:1px solid #818cf8;outline-offset:2px}
html.builder-editing [data-builder-node].builder-selected{outline:2px solid #6366f1!important;outline-offset:3px}
html.builder-editing [data-builder-node][data-builder-type="container"]:empty,
html.builder-editing [data-builder-node][data-builder-type="div"]:empty,
html.builder-editing [data-builder-node][data-builder-type="grid"]:empty,
html.builder-editing [data-builder-node][data-builder-type="flex"]:empty{
  min-height:72px;outline:1px dashed rgba(99,102,241,.38);outline-offset:-1px;background:rgba(99,102,241,.025)
}
html.builder-editing [data-builder-node][data-builder-type="container"]:empty::after,
html.builder-editing [data-builder-node][data-builder-type="div"]:empty::after,
html.builder-editing [data-builder-node][data-builder-type="grid"]:empty::after,
html.builder-editing [data-builder-node][data-builder-type="flex"]:empty::after{
  content:"Drop elements here";display:grid;place-items:center;min-height:72px;color:#8b8fa3;font:500 11px/1.3 Inter,Arial,sans-serif;pointer-events:none
}
.builder-node-label{position:fixed;z-index:2147483647;pointer-events:auto;cursor:grab;background:#4f46e5;color:#fff;font:600 11px/1.2 Arial,sans-serif;padding:6px 8px;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.14);user-select:none}
.builder-node-label:active{cursor:grabbing}
.builder-drop-marker{position:fixed;z-index:2147483645;pointer-events:none;background:#6d5dfc;box-shadow:0 0 0 1px rgba(255,255,255,.5),0 5px 18px rgba(79,70,229,.25)}
.builder-drop-marker.inside{background:rgba(99,102,241,.10);border:2px solid #6d5dfc;box-shadow:inset 0 0 0 1px rgba(255,255,255,.22)}
html:not(.builder-editing) .builder-node-label,html:not(.builder-editing) .builder-spacing-handle,html:not(.builder-editing) .builder-drop-marker{display:none}
.builder-spacing-handle{position:fixed;z-index:2147483646;width:12px;height:12px;border-radius:3px;display:grid;place-items:center;color:#fff;font:700 7px/1 Arial,sans-serif;cursor:ns-resize;user-select:none;box-shadow:0 2px 8px rgba(0,0,0,.2)}
.builder-spacing-handle[data-edge="left"],.builder-spacing-handle[data-edge="right"]{cursor:ew-resize}
.builder-spacing-handle[data-kind="padding"]{background:#10b981}.builder-spacing-handle[data-kind="margin"]{background:#f59e0b}
.cms-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.cms-card{border:1px solid #e5e7eb;border-radius:12px;padding:18px}.cms-card img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;margin-bottom:14px}
.html-embed-preview{min-height:40px;outline:1px dashed #a1a1aa}
.builder-empty-state{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2147483000;display:grid;gap:7px;min-width:260px;padding:22px 26px;border:1px dashed #a5a9b2;border-radius:12px;background:rgba(255,255,255,.94);box-shadow:0 14px 40px rgba(15,23,42,.08);color:#4b5563;text-align:center;pointer-events:none;font:500 13px/1.45 Inter,Arial,sans-serif}.builder-empty-state strong{font-size:15px;color:#111827}.builder-empty-state span{font-size:12px;color:#6b7280}
html:not(.builder-editing) .builder-empty-state{display:none}
@media(max-width:767px){.cms-grid{grid-template-columns:1fr}}
</style>
</head>
<body>
${body}${emptyState}
<script>
(() => {
  document.documentElement.classList.toggle('builder-editing',${editing})
  let selected = null
  let hovered = null
  let label = null
  let nodeDragging = false
  let activeNodeDragPayload = null
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
    label.textContent=(el.dataset.builderName||el.tagName.toLowerCase())+'  ·  drag'
    label.title='Drag to move this element'
    label.draggable=true
    label.ondragstart=event=>{
      activeNodeDragPayload={kind:'node',nodeId:el.dataset.builderNode}
      const payload=JSON.stringify(activeNodeDragPayload)
      nodeDragging=true
      send('node-drag-start',{payload:activeNodeDragPayload,label:el.dataset.builderName||el.dataset.builderType||'Element'})
      document.documentElement.style.cursor='grabbing'
      document.body.style.cursor='grabbing'
      event.dataTransfer.effectAllowed='move'
      event.dataTransfer.setData('application/x-cobest-builder',payload)
      event.dataTransfer.setData('text/plain','cobest:'+payload)
    }
    label.ondragend=()=>{
      nodeDragging=false
      send('node-drag-end')
      activeNodeDragPayload=null
      document.documentElement.style.cursor=''
      document.body.style.cursor=''
      removeDropMarker()
    }
    label.style.left=Math.max(4,Math.min(rect.left,window.innerWidth-180))+'px'
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
          requestAnimationFrame(reportSize)
        }
        window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true})
      }
      document.body.appendChild(h);handles.push(h)
    }))
  }
  const send=(type,payload={})=>parent.postMessage({source:'cobest-builder',type,...payload},'*')
  const reportSize=()=>{
    if(!document.documentElement.classList.contains('builder-editing'))return
    const height=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight,120)
    send('canvas-resize',{height})
  }
  let dropMarker=null
  const removeDropMarker=()=>{if(dropMarker){dropMarker.remove();dropMarker=null}}
  const dragPayload=event=>{
    if(nodeDragging&&activeNodeDragPayload)return activeNodeDragPayload
    let raw=''
    try{raw=event.dataTransfer?.getData('application/x-cobest-builder')||event.dataTransfer?.getData('text/plain')||''}catch{}
    if(raw.startsWith('cobest:'))raw=raw.slice(7)
    try{return raw?JSON.parse(raw):null}catch{return null}
  }
  const hasBuilderDrag=event=>{
    if(nodeDragging&&activeNodeDragPayload)return true
    const types=Array.from(event.dataTransfer?.types||[])
    return types.includes('application/x-cobest-builder')||types.includes('text/plain')
  }
  const nestingTypes=new Set(['div','section','container','grid','flex','columns','form','navbar','footer','tabs','collectionList'])
  const dropIntentFor=(target,clientY)=>{
    const el=target?.closest?.('[data-builder-node]')
    if(!el)return null
    const rect=el.getBoundingClientRect()
    const y=(clientY-rect.top)/Math.max(rect.height,1)
    const canNest=nestingTypes.has(el.dataset.builderType)
    let mode='inside'
    if(!canNest||y<.24)mode='before'
    else if(y>.76)mode='after'
    return {el,rect,mode}
  }
  const dropIntent=event=>dropIntentFor(event.target,event.clientY)
  const drawDropMarker=intent=>{
    removeDropMarker()
    if(!intent)return
    const {rect,mode}=intent
    dropMarker=document.createElement('div')
    dropMarker.className='builder-drop-marker '+mode
    if(mode==='inside'){
      dropMarker.style.left=Math.max(0,rect.left)+'px'
      dropMarker.style.top=Math.max(0,rect.top)+'px'
      dropMarker.style.width=Math.max(12,rect.width)+'px'
      dropMarker.style.height=Math.max(12,rect.height)+'px'
    }else{
      dropMarker.style.left=Math.max(0,rect.left)+'px'
      dropMarker.style.top=(mode==='before'?rect.top:rect.bottom)-1+'px'
      dropMarker.style.width=Math.max(20,rect.width)+'px'
      dropMarker.style.height='3px'
    }
    document.body.appendChild(dropMarker)
  }
  document.addEventListener('dragover',event=>{
    if(!document.documentElement.classList.contains('builder-editing')||!hasBuilderDrag(event))return
    event.preventDefault()
    if(event.dataTransfer)event.dataTransfer.dropEffect='copy'
    drawDropMarker(dropIntent(event))
  },true)
  document.addEventListener('drop',event=>{
    if(!document.documentElement.classList.contains('builder-editing')||!hasBuilderDrag(event))return
    event.preventDefault();event.stopPropagation()
    const payload=dragPayload(event)
    const intent=dropIntent(event)
    removeDropMarker()
    if(payload&&intent)send('canvas-drop',{payload,targetId:intent.el.dataset.builderNode,mode:intent.mode})
  },true)
  document.addEventListener('dragleave',event=>{if(!event.relatedTarget)removeDropMarker()},true)
  if(document.documentElement.classList.contains('builder-editing')){
    requestAnimationFrame(reportSize)
    document.fonts?.ready?.then(reportSize).catch?.(()=>{})
    new ResizeObserver(()=>requestAnimationFrame(reportSize)).observe(document.body)
  }
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
    clearClass(selected,'builder-selected')
    selected=el.dataset.builderNode||null
    apply(selected,'builder-selected')
    drawLabel(el)
    send('select',{id:selected})
  }, true)
  document.addEventListener('dblclick', event => {
    if(!document.documentElement.classList.contains('builder-editing'))return
    const el=event.target.closest?.('[data-builder-node]')
    if(!el)return
    const type=el.dataset.builderType||''
    if(!['heading','paragraph','button','link'].includes(type))return
    event.preventDefault();event.stopPropagation()
    el.contentEditable='true'
    el.focus()
    const range=document.createRange();range.selectNodeContents(el);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range)
    const finish=()=>{
      el.contentEditable='false'
      send('text-change',{id:el.dataset.builderNode,content:el.textContent||''})
      requestAnimationFrame(reportSize)
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
  window.addEventListener('scroll',()=>{if(nodeDragging)return;const el=selected?document.querySelector('[data-builder-node="'+CSS.escape(selected)+'"]'):null;drawLabel(el)},{passive:true})
  window.addEventListener('message',event=>{
    const msg=event.data||{}
    if(msg.source!=='cobest-editor')return
    if(msg.type==='external-drag-leave'){
      removeDropMarker()
      return
    }
    if((msg.type==='external-drag-over'||msg.type==='external-drop')&&Number.isFinite(Number(msg.x))&&Number.isFinite(Number(msg.y))){
      const x=Number(msg.x),y=Number(msg.y)
      const target=document.elementFromPoint(x,y)
      const intent=dropIntentFor(target,y)
      if(msg.type==='external-drag-over'){
        drawDropMarker(intent)
        return
      }
      removeDropMarker()
      if(msg.payload&&intent)send('canvas-drop',{payload:msg.payload,targetId:intent.el.dataset.builderNode,mode:intent.mode})
      return
    }
    if(msg.type==='selection'){
      clearClass(selected,'builder-selected');clearClass(hovered,'builder-hovered')
      selected=msg.selected||null;hovered=msg.hovered||null
      apply(selected,'builder-selected');apply(hovered,'builder-hovered')
      const selectedEl=selected?document.querySelector('[data-builder-node="'+CSS.escape(selected)+'"]'):null
      if(!nodeDragging)drawLabel(selectedEl)
    }
    if(msg.type==='mode'){
      document.documentElement.classList.toggle('builder-editing',msg.editing!==false)
      if(msg.editing===false){clearClass(selected,'builder-selected');clearClass(hovered,'builder-hovered');removeLabel();clearHandles()}
      else {apply(selected,'builder-selected');apply(hovered,'builder-hovered');drawLabel(selected?document.querySelector('[data-builder-node="'+CSS.escape(selected)+'"]'):null);requestAnimationFrame(reportSize)}
    }
  })
  document.querySelectorAll('.nav-menu-button').forEach(button=>button.addEventListener('click',event=>{
    if(document.documentElement.classList.contains('builder-editing'))return
    event.preventDefault();const nav=button.closest('nav');const links=nav?.querySelector('.nav-links');if(!links)return;
    const open=links.dataset.open==='true';links.dataset.open=String(!open);links.style.display=open?'':'flex'
  }))
  document.querySelectorAll('[data-tabs]').forEach(tabs=>{
    const buttons=[...tabs.querySelectorAll('[data-tab]')],panes=[...tabs.querySelectorAll('[data-pane]')]
    panes.forEach((pane,index)=>pane.hidden=index!==0)
    buttons.forEach((button,index)=>button.addEventListener('click',event=>{if(document.documentElement.classList.contains('builder-editing'))return;event.preventDefault();buttons.forEach(x=>x.removeAttribute('aria-selected'));panes.forEach(x=>x.hidden=true);button.setAttribute('aria-selected','true');if(panes[index])panes[index].hidden=false}))
  })
  document.querySelectorAll('[data-slider]').forEach(slider=>{
    const slides=[...slider.children];let index=0;const show=()=>slides.forEach((x,i)=>x.hidden=i!==index);show()
    slider.addEventListener('click',event=>{if(document.documentElement.classList.contains('builder-editing'))return;event.preventDefault();index=(index+1)%slides.length;show()})
  })
  document.querySelectorAll('[data-dropdown]').forEach(dropdown=>{
    const toggle=dropdown.querySelector('[data-dropdown-toggle]'),list=dropdown.querySelector('[data-dropdown-list]')
    toggle?.addEventListener('click',event=>{if(document.documentElement.classList.contains('builder-editing'))return;event.preventDefault();if(list)list.hidden=!list.hidden})
  })
  document.querySelectorAll('[data-lightbox]').forEach(link=>link.addEventListener('click',event=>{
    if(document.documentElement.classList.contains('builder-editing'))return
    event.preventDefault();const src=link.getAttribute('href');if(!src)return
    const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.86);display:grid;place-items:center;padding:30px;cursor:zoom-out'
    const img=document.createElement('img');img.src=src;img.style.cssText='max-width:min(1200px,92vw);max-height:90vh;object-fit:contain';overlay.appendChild(img);overlay.onclick=()=>overlay.remove();document.body.appendChild(overlay)
  }))
  document.querySelectorAll('form').forEach(form=>form.addEventListener('submit',event=>{
    if(document.documentElement.classList.contains('builder-editing')){event.preventDefault();return}
    const action=form.getAttribute('action');if(!action||action==='#'){event.preventDefault();form.dataset.state='success'}
  }))
  ${interactionRuntime}
})()
</script>
</body>
</html>`
}
