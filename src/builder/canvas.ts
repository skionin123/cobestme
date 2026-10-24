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
/* Only the exact hovered node gets a preview outline. :hover on all
   ancestors previously made nested headings and containers look selected. */
html.builder-editing [data-builder-node].builder-hovered:not(.builder-selected){
  outline:1px dashed rgba(99,102,241,.44);outline-offset:2px
}
html.builder-editing [data-builder-node].builder-selected{
  outline:2px solid #6366f1!important;outline-offset:2px
}
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
.builder-snap-guide{position:fixed;z-index:2147483644;background:#7c6dff;box-shadow:0 0 0 1px #ffffff80;pointer-events:none}
.builder-snap-guide.horizontal{left:0;right:0;height:1px}
.builder-snap-guide.vertical{top:0;bottom:0;width:1px}
html:not(.builder-editing) .builder-snap-guide{display:none}
.builder-drop-marker{position:fixed;z-index:2147483645;pointer-events:none;background:#6d5dfc;box-shadow:0 0 0 1px rgba(255,255,255,.5),0 5px 18px rgba(79,70,229,.25)}
.builder-drop-marker.inside{background:rgba(99,102,241,.10);border:2px solid #6d5dfc;box-shadow:inset 0 0 0 1px rgba(255,255,255,.22)}
html:not(.builder-editing) .builder-node-label,html:not(.builder-editing) .builder-geometry-handle,html:not(.builder-editing) .builder-spacing-handle,html:not(.builder-editing) .builder-drop-marker{display:none}
.builder-node-label{display:flex;align-items:center;gap:2px;cursor:default;padding:4px;background:#21252f;border:1px solid #454958;white-space:nowrap;border-radius:8px;box-shadow:0 8px 24px rgba(10,14,25,.2);pointer-events:none}
.builder-label-title{font:650 10px/1.25 Inter,Arial,sans-serif;color:#e8eaf4;max-width:115px;overflow:hidden;text-overflow:ellipsis;padding:0 9px 0 7px;border-right:1px solid #474b59}
.builder-node-label button{display:grid;place-items:center;width:27px;height:26px;font:750 15px/1 Inter,Arial,sans-serif;color:#d8daf0;background:transparent;border:0;border-radius:5px;padding:0;cursor:pointer;touch-action:none;pointer-events:auto}
.builder-node-label button:hover,.builder-node-label button:focus-visible{background:#3d4254;color:#fff}
.builder-node-label button.builder-move-button{color:#b8b1ff;cursor:grab}
.builder-node-label button.builder-move-button:active{cursor:grabbing}
.builder-node-label button.builder-size-button{color:#b8b1ff;cursor:nwse-resize}
.builder-node-label button.builder-add-section{color:#d9fbe7;background:rgba(16,185,129,.17);font-size:19px}
.builder-node-label button.builder-add-section:hover,.builder-node-label button.builder-add-section:focus-visible{background:#047857;color:white}
.builder-corner-hit{position:fixed;z-index:2147483647;display:grid;place-items:center;width:36px;height:36px;background:transparent;border:0;border-radius:5px;touch-action:none;user-select:none;cursor:nwse-resize}
.builder-corner-hit[data-edge="ne"],.builder-corner-hit[data-edge="sw"]{cursor:nesw-resize}
/* Professional, unobtrusive corners: no persistent square knobs. The hover
   target stays large at Fit zoom, while only a subtle corner bracket appears
   when the user hovers, focuses or actively resizes. */
.builder-corner-hit::after{content:"";box-sizing:border-box;width:14px;height:14px;border:solid #6255ec;opacity:0;pointer-events:none;transition:opacity .1s ease}
.builder-corner-hit[data-edge="nw"]::after{border-width:2px 0 0 2px}
.builder-corner-hit[data-edge="ne"]::after{border-width:2px 2px 0 0}
.builder-corner-hit[data-edge="sw"]::after{border-width:0 0 2px 2px}
.builder-corner-hit[data-edge="se"]::after{border-width:0 2px 2px 0}
.builder-corner-hit:hover::after,.builder-corner-hit:focus-visible::after,.builder-corner-hit.is-resizing::after{opacity:1}
.builder-corner-hit:focus-visible{outline:2px solid rgba(99,102,241,.65);outline-offset:-5px}
.builder-resize-edge{position:fixed;z-index:2147483645;display:block;touch-action:none;background:transparent;border:0;border-radius:2px}
.builder-resize-edge[data-edge="left"],.builder-resize-edge[data-edge="right"]{cursor:ew-resize}
.builder-resize-edge[data-edge="top"],.builder-resize-edge[data-edge="bottom"]{cursor:ns-resize}
.builder-resize-edge:hover,.builder-resize-edge:focus-visible{background:rgba(99,102,241,.34)}
html:not(.builder-editing) .builder-resize-edge{display:none}


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
  let snappingEnabled = true
  let snapGuides=[]
  const clearSnapGuides=()=>{snapGuides.forEach(item=>item.remove());snapGuides=[]}
  const showSnapGuides=(x,y)=>{
    clearSnapGuides()
    for(const [kind,pos] of [['vertical',x],['horizontal',y]]){
      if(pos===null||pos<0)continue
      const line=document.createElement('div')
      line.className='builder-snap-guide '+kind
      line.style[kind==='vertical'?'left':'top']=Math.round(pos)+'px'
      line.setAttribute('aria-hidden','true')
      document.body.appendChild(line)
      snapGuides.push(line)
    }
  }
  const alignToSiblings=(el,rect,dx,dy)=>{
    const others=Array.from(el.parentElement?.children||[]).filter(candidate=>
      candidate!==el&&candidate.dataset?.builderNode&&candidate.getBoundingClientRect)
    const peerX=[],peerY=[]
    for(const peer of others){
      const box=peer.getBoundingClientRect()
      peerX.push(box.left,box.right,box.left+box.width/2)
      peerY.push(box.top,box.bottom,box.top+box.height/2)
    }
    const nearest=(position,size,anchors)=>{
      const endpoints=[position,position+size,position+size/2]
      let best=7,offset=0,guide=null
      for(const anchor of anchors)for(const point of endpoints){
        const difference=anchor-point
        if(Math.abs(difference)<best){best=Math.abs(difference);offset=difference;guide=anchor}
      }
      return {offset,guide}
    }
    const horizontal=nearest(rect.left+dx,rect.width,peerX)
    const vertical=nearest(rect.top+dy,rect.height,peerY)
    return {horizontal,vertical}
  }
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
  const readTranslation=el=>{
    const value=getComputedStyle(el).translate
    if(!value||value==='none')return [0,0]
    const parts=value.split(/\\s+/)
    return [parseFloat(parts[0])||0,parseFloat(parts[1])||0]
  }
  const drawLabel=(el)=>{
    removeLabel();clearHandles()
    if(!el||!document.documentElement.classList.contains('builder-editing'))return
    const rect=el.getBoundingClientRect()
    const textElement=['heading','paragraph','button','link'].includes(el.dataset.builderType)
    const frameElement=['section','container','div','grid','flex','columns','navbar','footer'].includes(el.dataset.builderType)
    const movable=el.dataset.builderName!=='Page'
    label=document.createElement('div')
    label.className='builder-node-label'
    const toolbarWidth=el.dataset.builderType==='section'?245:(movable?185:110)
    label.style.left=Math.max(6,Math.min(rect.left+Math.max(0,rect.width/2-toolbarWidth/2),window.innerWidth-toolbarWidth-6))+'px'
    label.style.top=(rect.top>=44?rect.top-36:Math.min(window.innerHeight-36,rect.bottom+7))+'px'
    const labelName=document.createElement('span')
    labelName.className='builder-label-title'
    labelName.textContent=el.dataset.builderName||el.tagName.toLowerCase()
    label.appendChild(labelName)
    const control=(caption,title,action,extraClass)=>{
      const button=document.createElement('button')
      button.type='button'
      button.textContent=caption
      button.title=title
      button.setAttribute('aria-label',title)
      if(extraClass)button.className=extraClass
      button.onclick=event=>{event.preventDefault();event.stopPropagation();action()}
      label.appendChild(button)
      return button
    }
    const liveGeometry=(mode,handle,edge='corner')=>{
      if(!movable)return
      handle.onpointerdown=startEvent=>{
        if(startEvent.button!==0)return
        startEvent.preventDefault();startEvent.stopPropagation()
        try{handle.setPointerCapture(startEvent.pointerId)}catch{}
        handle.classList.add('is-resizing')
        nodeDragging=true
        const startX=startEvent.clientX,startY=startEvent.clientY
        const initialRect=el.getBoundingClientRect()
        const computed=getComputedStyle(el)
        const initialTranslate=readTranslation(el)
        const initialSize=parseFloat(computed.fontSize)||16
        const startWidth=initialRect.width,startHeight=initialRect.height
        const initialPaddingTop=parseFloat(computed.paddingTop)||0
        const initialPaddingBottom=parseFloat(computed.paddingBottom)||0
        // Intrinsic child size, not the section's themed 70vh minimum. Keep
        // the content visible while the user trims the large empty frame.
        const contentHeight=frameElement?Math.max(0,...Array.from(el.children)
          .filter(child=>!child.classList.contains('builder-node-label'))
          .map(child=>child.getBoundingClientRect().height)):0
        const minimumFrameHeight=Math.max(56,Math.ceil(contentHeight+24))
        let newPaddingTop=initialPaddingTop,newPaddingBottom=initialPaddingBottom
        let newX=initialTranslate[0],newY=initialTranslate[1]
        let newWidth=startWidth,newHeight=startHeight,newFont=initialSize
        let dragChanged=false
        let finished=false
        const move=event=>{
          if(finished)return
          const dx=event.clientX-startX,dy=event.clientY-startY
          if(Math.abs(dx)+Math.abs(dy)>2)dragChanged=true
          if(mode==='move'){
            if(snappingEnabled&&!event.altKey){
              const aligned=alignToSiblings(el,initialRect,dx,dy)
              newX=aligned.horizontal.guide!==null
                ?Math.round(initialTranslate[0]+dx+aligned.horizontal.offset)
                :Math.round((initialTranslate[0]+dx)/8)*8
              newY=aligned.vertical.guide!==null
                ?Math.round(initialTranslate[1]+dy+aligned.vertical.offset)
                :Math.round((initialTranslate[1]+dy)/8)*8
              showSnapGuides(aligned.horizontal.guide,aligned.vertical.guide)
            }else{
              clearSnapGuides()
              newX=Math.round(initialTranslate[0]+dx)
              newY=Math.round(initialTranslate[1]+dy)
            }
            el.style.translate=newX+'px '+newY+'px'
          }else{
            const leftSide=['left','nw','sw'].includes(edge)
            const topSide=['top','nw','ne'].includes(edge)
            const horizontal=['left','right','nw','ne','sw','se','corner','toolbar'].includes(edge)
            const vertical=['top','bottom','nw','ne','sw','se','corner','toolbar'].includes(edge)
            if(horizontal){
              newWidth=Math.max(32,Math.round(startWidth+(leftSide?-dx:dx)))
              el.style.width=newWidth+'px'
              el.style.maxWidth='none'
              if(leftSide)newX=Math.round(initialTranslate[0]+startWidth-newWidth)
            }
            if(vertical){
              newHeight=Math.max(frameElement?minimumFrameHeight:20,Math.round(startHeight+(topSide?-dy:dy)))
              if(topSide&&(!textElement||edge==='top'))newY=Math.round(initialTranslate[1]+startHeight-newHeight)
              if(!textElement||edge==='top'||edge==='bottom')el.style.height=newHeight+'px'
              if(frameElement){
                // Theme padding/minHeight cause the huge, unshrinkable Hero.
                // Reduce extra vertical padding as the frame gets smaller.
                const room=Math.max(24,newHeight-contentHeight)
                const paddingScale=Math.min(1,room/Math.max(1,initialPaddingTop+initialPaddingBottom))
                newPaddingTop=Math.max(12,Math.round(initialPaddingTop*paddingScale))
                newPaddingBottom=Math.max(12,Math.round(initialPaddingBottom*paddingScale))
                el.style.minHeight='0px'
                el.style.paddingTop=newPaddingTop+'px'
                el.style.paddingBottom=newPaddingBottom+'px'
              }
            }
            if(leftSide||(topSide&&(!textElement||edge==='top')))el.style.translate=newX+'px '+newY+'px'
            // Resizing a text box changes its wrapping width, not font size.
            // Typography has its own explicit control in the right inspector.
            if(el.tagName==='IMG')el.style.objectFit='cover'
          }
        }
        const up=event=>{
          // The canvas runs inside a scaled iframe. A pointer can be released
          // outside its visual edge. Listen on the grip and for capture loss,
          // so the last previewed resize is committed exactly once.
          if(finished)return
          finished=true
          window.removeEventListener('pointermove',move)
          window.removeEventListener('pointerup',up)
          window.removeEventListener('pointercancel',up)
          window.removeEventListener('mouseup',up)
          window.removeEventListener('blur',up)
          handle.removeEventListener('pointerup',up)
          handle.removeEventListener('lostpointercapture',up)
          document.removeEventListener('mouseleave',up)
          nodeDragging=false
          clearSnapGuides()
          handle.classList.remove('is-resizing')
          if(dragChanged){
            if(mode==='move')send('node-geometry',{id:el.dataset.builderNode,kind:'move',x:newX,y:newY})
            else{
              const horizontal=['left','right','nw','ne','sw','se','corner','toolbar'].includes(edge)
              const vertical=['top','bottom','nw','ne','sw','se','corner','toolbar'].includes(edge)
              const leftOrTop=['left','top','nw','ne','sw'].includes(edge)
              send('node-geometry',{id:el.dataset.builderNode,kind:'resize',
                ...(horizontal?{width:newWidth}:{}),
                ...((!textElement&&vertical)||edge==='top'||edge==='bottom'?{height:newHeight}:{}),
                ...(frameElement&&vertical?{frame:true,paddingTop:newPaddingTop,paddingBottom:newPaddingBottom}:{}),
                ...(leftOrTop?{x:newX,y:newY}:{})})
            }
          }else{
            el.style.translate='';el.style.width='';el.style.height='';el.style.maxWidth='';el.style.fontSize='';el.style.minHeight='';el.style.paddingTop='';el.style.paddingBottom=''
          }
          requestAnimationFrame(()=>{drawLabel(el);reportSize()})
        }
        window.addEventListener('pointermove',move)
        window.addEventListener('pointerup',up)
        window.addEventListener('pointercancel',up)
        window.addEventListener('mouseup',up)
        window.addEventListener('blur',up)
        handle.addEventListener('pointerup',up)
        handle.addEventListener('lostpointercapture',up)
        // Browser mouse release can occur outside this iframe (especially at Fit zoom).
        document.addEventListener('mouseleave',up)
      }
    }
    // Shopify-style on-canvas insertion: the owner chooses a section in the
    // outer editor rather than mutating the sandboxed preview directly.
    if(el.dataset.builderType==='section'){
      control('＋','Add section before '+(el.dataset.builderName||'section'),
        ()=>send('section-insert-request',{targetId:el.dataset.builderNode,mode:'before'}),'builder-add-section')
      control('＋','Add section after '+(el.dataset.builderName||'section'),
        ()=>send('section-insert-request',{targetId:el.dataset.builderNode,mode:'after'}),'builder-add-section')
    }
    if(movable){
      const moveButton=control('✥','Drag to move the selected element',()=>{},'builder-move-button')
      liveGeometry('move',moveButton)
      const sizeButton=control('⤡','Drag to resize the selected element',()=>{},'builder-size-button')
      liveGeometry('resize',sizeButton)
      control('↺','Reset position and size',()=>send('node-geometry',{id:el.dataset.builderNode,kind:'reset'}))
    }
    document.body.appendChild(label)
    if(!movable)return
    const handle=(kind,left,top,cssClass,edge,width,height)=>{
      const h=document.createElement('div')
      h.className=cssClass
      h.dataset.edge=edge
      const corner=['nw','ne','sw','se'].includes(edge)
      h.title=corner?'Drag '+edge.toUpperCase()+' corner to resize '+(el.dataset.builderName||'element'):'Drag '+edge+' edge to resize '+(el.dataset.builderName||'element')
      h.setAttribute('aria-label',h.title)
      h.style.left=left+'px';h.style.top=top+'px'
      h.style.width=width+'px';h.style.height=height+'px'
      liveGeometry(kind,h,edge)
      document.body.appendChild(h)
      handles.push(h)
    }
    // Transparent 36px hover targets at all four corners replace the old
    // always-visible bottom-right square. Edges remain directly draggable.
    const edgeInset=40
    const sideHeight=Math.max(8,rect.height-edgeInset*2)
    const sideTop=rect.top+(rect.height-sideHeight)/2
    const horizontalWidth=Math.max(8,rect.width-edgeInset*2)
    const horizontalLeft=rect.left+(rect.width-horizontalWidth)/2
    handle('resize',rect.left-5,sideTop,'builder-resize-edge','left',10,sideHeight)
    handle('resize',rect.right-5,sideTop,'builder-resize-edge','right',10,sideHeight)
    handle('resize',horizontalLeft,rect.top-5,'builder-resize-edge','top',horizontalWidth,10)
    handle('resize',horizontalLeft,rect.bottom-5,'builder-resize-edge','bottom',horizontalWidth,10)
    const size=36
    const anchor=(value,limit)=>Math.max(0,Math.min(value-size/2,limit-size))
    const corners=[
      ['nw',rect.left,rect.top],
      ['ne',rect.right,rect.top],
      ['sw',rect.left,rect.bottom],
      ['se',rect.right,rect.bottom],
    ]
    for(const [corner,x,y] of corners){
      // Do not render a misleading handle far away from an off-screen corner.
      if(x<0||y<0||x>window.innerWidth||y>window.innerHeight)continue
      const classes='builder-corner-hit'+(corner==='se'?' builder-geometry-handle builder-resize-corner':'')
      handle('resize',anchor(x,window.innerWidth),anchor(y,window.innerHeight),
        classes,corner,size,size)
    }
  }
  const send=(type,payload={})=>parent.postMessage({source:'cobest-builder',type,...payload},'*')
  const reportSize=()=>{
    if(!document.documentElement.classList.contains('builder-editing'))return
    const bottoms=Array.from(document.querySelectorAll('[data-builder-node]')).map(el=>el.getBoundingClientRect().bottom+window.scrollY+40)
    const height=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight,...bottoms,120)
    send('canvas-resize',{height})
  }
  let dropMarker=null
  const removeDropMarker=()=>{if(dropMarker){dropMarker.remove();dropMarker=null}}
  const dragPayload=event=>{
    let raw=''
    try{raw=event.dataTransfer?.getData('application/x-cobest-builder')||event.dataTransfer?.getData('text/plain')||''}catch{}
    if(raw.startsWith('cobest:'))raw=raw.slice(7)
    try{return raw?JSON.parse(raw):null}catch{return null}
  }
  const hasBuilderDrag=event=>{
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
  document.addEventListener('keydown',event=>{
    if(!document.documentElement.classList.contains('builder-editing')||event.altKey)return
    const target=event.target
    if(target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(target?.tagName))return
    const key=String(event.key||'').toLowerCase()
    const mod=event.ctrlKey||event.metaKey
    let action=null
    if(mod){
      if(key==='z')action=event.shiftKey?'redo':'undo'
      else if(key==='y'&&!event.shiftKey)action='redo'
      else if(!event.shiftKey&&['c','v','d','s'].includes(key))
        action={c:'copy',v:'paste',d:'duplicate',s:'save'}[key]
    }else if(key==='escape')action='escape'
    else if(key==='delete'||key==='backspace')action='delete'
    else if(['arrowleft','arrowright','arrowup','arrowdown'].includes(key))
      action='nudge-'+key.slice(5)+(event.shiftKey?'-large':'')
    if(!action)return
    // Preserve normal browser copy when nothing is selected in this canvas.
    if(['copy','duplicate','delete'].includes(action)&&!selected)return
    event.preventDefault();event.stopPropagation()
    send('editor-shortcut',{action})
  },true)
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
    if(msg.type==='snapping'){snappingEnabled=msg.enabled!==false;clearSnapGuides();return}
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
