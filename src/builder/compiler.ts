import type { BuilderInteraction, BuilderNode, BuilderProject, BreakpointId, CmsCollection, CssProperties, NodeState } from './types'

const escapeHtml=(value='')=>String(value).replace(/[&<>"']/g,ch=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[ch]||ch))

const escapeAttr=(value='')=>escapeHtml(value).replace(/\n/g,' ')
const voidTags=new Set(['img','input','meta','link','br','hr','source','area','base','col','embed','param','track','wbr'])

const styleObjectToCss=(style:CssProperties={})=>Object.entries(style)
  .filter(([,value])=>value!=null&&value!=='')
  .map(([key,value])=>`${key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}:${value}`)
  .join(';')

const mediaQuery:Record<Exclude<BreakpointId,'desktop'>,string>={
  tablet:'@media(max-width:991px)',
  mobileLandscape:'@media(max-width:767px)',
  mobilePortrait:'@media(max-width:478px)',
}

function compileStateSelector(className:string,state:NodeState){
  const escaped=className.replace(/([^a-zA-Z0-9_-])/g,'\\$1')
  if(state==='none')return `.${escaped}`
  if(state==='pressed')return `.${escaped}:active`
  if(state==='focused')return `.${escaped}:focus`
  return `.${escaped}:${state}`
}

export function compileProjectCss(project:BuilderProject){
  const rootVars=Object.entries(project.globals.colors).map(([key,value])=>`--${key}:${value};`).join('')
  let base=`:root{${rootVars}}*{box-sizing:border-box}html{scroll-behavior:smooth}html,body{margin:0;min-height:100%}body{overflow-x:hidden}img,video{max-width:100%;display:block}button,input,textarea,select{font:inherit}a{color:inherit}details summary{cursor:pointer}`
  const responsive:Record<string,string[]>={tablet:[],mobileLandscape:[],mobilePortrait:[]}
  for(const [className,breakpoints] of Object.entries(project.styles)){
    for(const [breakpoint,states] of Object.entries(breakpoints)){
      if(!states)continue
      for(const [state,props] of Object.entries(states)){
        if(!props)continue
        const css=styleObjectToCss(props)
        if(!css)continue
        const rule=`${compileStateSelector(className,state as NodeState)}{${css}}`
        if(breakpoint==='desktop')base+=rule
        else responsive[breakpoint]?.push(rule)
      }
    }
  }
  for(const bp of ['tablet','mobileLandscape','mobilePortrait'] as const){
    if(responsive[bp].length)base+=`${mediaQuery[bp]}{${responsive[bp].join('')}}`
  }
  base+=compileInteractionCss(project.interactions)
  return base
}

function compileInteractionCss(interactions:BuilderInteraction[]){
  if(!interactions.length)return ''
  let css=`
@keyframes cb-fade{from{opacity:0}to{opacity:1}}
@keyframes cb-slide-up{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
@keyframes cb-slide-left{from{opacity:0;transform:translateX(32px)}to{opacity:1;transform:translateX(0)}}
@keyframes cb-scale{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
@keyframes cb-rotate{from{opacity:0;transform:rotate(-6deg)}to{opacity:1;transform:rotate(0)}}`
  for(const ix of interactions){
    if(ix.trigger==='hover')css+=`[data-ix~="${ix.id}"]:hover{animation:cb-${ix.animation} ${ix.duration}ms ${ix.easing} ${ix.delay}ms both}`
  }
  return css
}

function interactionAttrs(nodeId:string,interactions:BuilderInteraction[]){
  const ids=interactions.filter(x=>x.nodeId===nodeId).map(x=>x.id)
  return ids.length?{'data-ix':ids.join(' ')}:{}
}

function attrsToString(attrs:Record<string,string>){
  return Object.entries(attrs)
    .filter(([key,value])=>value!=null&&value!==''&&!/^on/i.test(key)&&key!=='data-html')
    .map(([key,value])=>{
      if(value==='true'&&['autoplay','muted','loop','playsinline','allowfullscreen','checked','required','disabled'].includes(key.toLowerCase()))return ` ${key}`
      return ` ${key}="${escapeAttr(value)}"`
    }).join('')
}

function collectionHtml(collection:CmsCollection|undefined,editorAttrs:string){
  if(!collection)return `<div${editorAttrs}>Connect a CMS collection.</div>`
  const cards=collection.items.map(item=>{
    const entries=collection.fields.map(field=>({field,value:item.values[field.id]||''}))
    const title=entries.find(x=>x.field.slug==='title')?.value||entries[0]?.value||'Untitled'
    const image=entries.find(x=>x.field.type==='image')?.value
    const description=entries.find(x=>x.field.type==='richText'||x.field.slug==='description')?.value
    return `<article class="cms-card">${image?`<img src="${escapeAttr(image)}" alt="${escapeAttr(title)}">`:''}<h3>${escapeHtml(title)}</h3>${description?`<p>${escapeHtml(description)}</p>`:''}</article>`
  }).join('')
  return `<section${editorAttrs}><div class="cms-grid">${cards||'<p>No CMS items yet.</p>'}</div></section>`
}

export function renderNodeHtml(node:BuilderNode,project:BuilderProject,editing=false):string{
  if(node.hidden)return ''
  const tag=/^[a-z][a-z0-9-]*$/i.test(node.tag)?node.tag:'div'
  const editorAttrs=editing?` data-builder-node="${escapeAttr(node.id)}" data-builder-name="${escapeAttr(node.name)}"`:''
  if(node.type==='html'){
    const html=node.attributes?.['data-html']||node.content||''
    return editing?`<div${editorAttrs} class="html-embed-preview">${html}</div>`:html
  }
  if(node.type==='collectionList'){
    return collectionHtml(project.collections.find(c=>c.id===node.attributes.collectionId),editorAttrs)
  }
  const attrs={...(node.attributes||{}),...interactionAttrs(node.id,project.interactions)}
  const className=(node.classes||[]).join(' ')
  const classAttr=className?` class="${escapeAttr(className)}"`:''
  const attrText=attrsToString(attrs)
  const content=node.content?escapeHtml(node.content):''
  const children=(node.children||[]).map(child=>renderNodeHtml(child,project,editing)).join('')
  if(voidTags.has(tag.toLowerCase()))return `<${tag}${editorAttrs}${classAttr}${attrText}>`
  return `<${tag}${editorAttrs}${classAttr}${attrText}>${content}${children}</${tag}>`
}

export function renderPageBody(project:BuilderProject,pageId?:string,editing=false){
  const page=project.pages.find(x=>x.id===(pageId||project.activePageId))||project.pages[0]
  return renderNodeHtml(page.root,project,editing)
}

export function compileInteractionRuntime(project:BuilderProject){
  const data=JSON.stringify(project.interactions).replace(/</g,'\\u003c')
  return `(() => {
  const interactions=${data};
  const animate=(el,ix)=>{
    if(!el||!ix)return;
    el.style.animation='cb-'+ix.animation+' '+ix.duration+'ms '+ix.easing+' '+ix.delay+'ms both';
  };
  interactions.forEach(ix=>{
    const el=document.querySelector('[data-node-id="'+CSS.escape(ix.nodeId)+'"]')||document.querySelector('[data-builder-node="'+CSS.escape(ix.nodeId)+'"]');
    if(!el)return;
    if(ix.trigger==='page-load')window.addEventListener('load',()=>animate(el,ix),{once:true});
    if(ix.trigger==='click')el.addEventListener('click',()=>animate(el,ix));
    if(ix.trigger==='scroll-into-view'){
      const obs=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){animate(el,ix);obs.unobserve(el)}}),{threshold:.15});
      obs.observe(el);
    }
  });
})();`
}

export function cleanNodeIdsForRuntime(html:string,project:BuilderProject){
  let next=html
  for(const page of project.pages){
    const visit=(node:BuilderNode)=>{
      const marker=` data-builder-node="${escapeAttr(node.id)}"`
      next=next.replace(marker,` data-node-id="${escapeAttr(node.id)}"`)
      node.children.forEach(visit)
    }
    visit(page.root)
  }
  return next
}
