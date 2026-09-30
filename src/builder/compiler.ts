import type { BuilderInteraction, BuilderNode, BuilderProject, BreakpointId, CmsCollection, CmsItem, CssProperties, NodeState } from './types'

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
  const colorVars=Object.entries(project.globals.colors).map(([key,value])=>`--${key}:${value};`).join('')
  const textVars=Object.entries(project.globals.textStyles).flatMap(([styleName,props])=>Object.entries(props).map(([key,value])=>`--text-${styleName}-${key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}:${value};`)).join('')
  const rootVars=colorVars+textVars
  let base=`:root{${rootVars}}*{box-sizing:border-box}html{scroll-behavior:smooth}html,body{margin:0;min-height:100%}body{overflow-x:hidden}img,video{max-width:100%;display:block}button,input,textarea,select{font:inherit}a{color:inherit}details summary{cursor:pointer}[data-form-success],[data-form-error]{display:none}form[data-state="success"] [data-form-success]{display:block}form[data-state="error"] [data-form-error]{display:block}`
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
  return ids.length?{'data-ix':ids.join(' '),'data-node-id':nodeId}:{}
}

function attrsToString(attrs:Record<string,string>){
  return Object.entries(attrs)
    .filter(([key,value])=>value!=null&&value!==''&&!/^on/i.test(key)&&key!=='data-html')
    .map(([key,value])=>{
      if(value==='true'&&['autoplay','muted','loop','playsinline','allowfullscreen','checked','required','disabled'].includes(key.toLowerCase()))return ` ${key}`
      return ` ${key}="${escapeAttr(value)}"`
    }).join('')
}

const safeSlug=(value='')=>String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'item'
const cmsItemSlug=(collection:CmsCollection,item:CmsItem)=>{
  const slugField=collection.fields.find(f=>f.slug==='slug')
  const titleField=collection.fields.find(f=>f.slug==='title')||collection.fields[0]
  return safeSlug((slugField&&item.values[slugField.id])||(titleField&&item.values[titleField.id])||item.id)
}

function collectionHtml(collection:CmsCollection|undefined,editorAttrs:string){
  if(!collection)return `<div${editorAttrs}>Connect a CMS collection.</div>`
  const cards=collection.items.map(item=>{
    const entries=collection.fields.map(field=>({field,value:item.values[field.id]||''}))
    const title=entries.find(x=>x.field.slug==='title')?.value||entries[0]?.value||'Untitled'
    const image=entries.find(x=>x.field.type==='image')?.value
    const description=entries.find(x=>x.field.type==='richText'||x.field.slug==='description')?.value
    const href=`${collection.slug}-${cmsItemSlug(collection,item)}.html`
    return `<article class="cms-card"><a href="${escapeAttr(href)}">${image?`<img src="${escapeAttr(image)}" alt="${escapeAttr(title)}">`:''}<h3>${escapeHtml(title)}</h3>${description?`<p>${escapeHtml(description)}</p>`:''}</a></article>`
  }).join('')
  return `<section${editorAttrs}><div class="cms-grid">${cards||'<p>No CMS items yet.</p>'}</div></section>`
}

type CmsRenderContext={collection:CmsCollection;item:CmsItem}

function applyCmsBinding(node:BuilderNode,attrs:Record<string,string>,content:string,context?:CmsRenderContext){
  if(!context)return {attrs,content}
  const binding=node.attributes?.['data-cms-field']
  if(!binding)return {attrs,content}
  const field=context.collection.fields.find(f=>f.slug===binding||f.id===binding)
  if(!field)return {attrs,content}
  const value=context.item.values[field.id]||''
  const nextAttrs={...attrs}
  delete nextAttrs['data-cms-field']
  if(node.type==='image')nextAttrs.src=value
  else if(node.type==='link'||node.type==='button')nextAttrs.href=value
  else content=value
  return {attrs:nextAttrs,content}
}

export function renderNodeHtml(node:BuilderNode,project:BuilderProject,editing=false,cmsContext?:CmsRenderContext):string{
  if(node.hidden)return ''
  const tag=/^[a-z][a-z0-9-]*$/i.test(node.tag)?node.tag:'div'
  const editorAttrs=editing?` data-builder-node="${escapeAttr(node.id)}" data-builder-name="${escapeAttr(node.name)}" data-builder-type="${escapeAttr(node.type)}"`:''
  if(node.type==='html'){
    const html=node.attributes?.['data-html']||node.content||''
    return editing?`<div${editorAttrs} class="html-embed-preview">${html}</div>`:html
  }
  if(node.type==='collectionList'){
    return collectionHtml(project.collections.find(c=>c.id===node.attributes.collectionId),editorAttrs)
  }
  const baseAttrs={...(node.attributes||{}),...interactionAttrs(node.id,project.interactions)}
  const rawContent=node.content||''
  const bound=applyCmsBinding(node,baseAttrs,rawContent,cmsContext)
  const attrs=bound.attrs
  const className=(node.classes||[]).join(' ')
  const classAttr=className?` class="${escapeAttr(className)}"`:''
  const attrText=attrsToString(attrs)
  const content=bound.content?escapeHtml(bound.content):''
  const children=(node.children||[]).map(child=>renderNodeHtml(child,project,editing,cmsContext)).join('')
  if(voidTags.has(tag.toLowerCase()))return `<${tag}${editorAttrs}${classAttr}${attrText}>`
  return `<${tag}${editorAttrs}${classAttr}${attrText}>${content}${children}</${tag}>`
}

export function renderPageBody(project:BuilderProject,pageId?:string,editing=false,cmsItemId?:string){
  const page=project.pages.find(x=>x.id===(pageId||project.activePageId))||project.pages[0]
  let context:CmsRenderContext|undefined
  if(page.isCollectionTemplate&&page.collectionId){
    const collection=project.collections.find(c=>c.id===page.collectionId)
    const item=collection?.items.find(i=>i.id===cmsItemId)||collection?.items[0]
    if(collection&&item)context={collection,item}
  }
  return renderNodeHtml(page.root,project,editing,context)
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
