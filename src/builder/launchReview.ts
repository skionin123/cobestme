import { isSampleAddress, isSampleImage, isSampleText } from './samples'
import type { BuilderNode, BuilderProject } from './types'

/** Addresses the store page itself answers, besides the website's own pages. */
const builtInPaths=new Set(['/shop'])
const quote=(text:string)=>'“'+(text.length>48?text.slice(0,45)+'…':text)+'”'

export type LaunchLevel='blocker'|'warning'
export interface LaunchIssue{
  id:string
  level:LaunchLevel
  title:string
  detail:string
  pageId?:string
  nodeId?:string
  tab?:'pages'|'settings'
}

/**
 * Fast, local quality review. It never contacts the Internet or pretends to
 * verify domains, account permissions, email delivery or payment providers.
 */
export function reviewWebsiteLaunch(project:BuilderProject):LaunchIssue[]{
  const issues:LaunchIssue[]=[]
  const add=(issue:LaunchIssue)=>issues.push(issue)
  if(!project.pages.length){
    add({id:'no-pages',level:'blocker',title:'Add a website page',
      detail:'A website needs at least one page before it can be published.',tab:'pages'})
    return issues
  }
  const slugs=new Map<string,string>()
  // Compare all internal links against the complete set of page slugs.
  const knownPaths=new Set(project.pages.map(page=>
    (page.slug||'/').trim().replace(/\/+$/,'').toLowerCase()||'/'))
  for(const page of project.pages){
    const slug=(page.slug||'/').trim().replace(/\/+$/,'').toLowerCase()||'/'
    if(slugs.has(slug)){
      add({id:'duplicate-'+page.id,level:'blocker',title:'Two pages use the same URL',
        detail:'Rename this page URL so every page has a unique address.',pageId:page.id,tab:'pages'})
    }
    slugs.set(slug,page.id)
    if(!page.seo.title?.trim()||/^(untitled cobest site|new page)$/i.test(page.seo.title.trim())){
      add({id:'title-'+page.id,level:'warning',title:'Customize the page title',
        detail:page.name+' needs a descriptive search and browser title.',pageId:page.id,tab:'pages'})
    }
    if(!page.seo.description?.trim()||page.seo.description.trim().length<50){
      add({id:'description-'+page.id,level:'warning',title:'Improve the SEO description',
        detail:page.name+' needs a useful summary for search previews (about 50–160 characters).',pageId:page.id,tab:'pages'})
    }
    if(page.seo.description?.trim().length>160){
      add({id:'description-long-'+page.id,level:'warning',title:'Shorten the SEO description',
        detail:page.name+' has more than 160 characters. Keep search previews concise.',pageId:page.id,tab:'pages'})
    }
    let h1Count=0
    // Names that "#name" links on this page can jump to.
    const anchors=new Set<string>()
    const collectAnchors=(node:BuilderNode)=>{
      if(node.hidden)return
      if(node.attributes?.id)anchors.add(node.attributes.id.trim())
      for(const child of node.children||[])collectAnchors(child)
    }
    collectAnchors(page.root)
    const samples:BuilderNode[]=[]
    let samplePhotos=0
    const walk=(node:BuilderNode)=>{
      // Hidden elements are not part of the published website.
      if(node.hidden)return
      if(isSampleText(node.content)||isSampleAddress(node.attributes?.href))samples.push(node)
      if(node.type==='image'&&isSampleImage(node.attributes?.src))samplePhotos++
      if(node.type==='heading'&&node.tag==='h1')h1Count++
      if(node.type==='image'){
        if(!node.attributes.src?.trim()){
          add({id:'image-src-'+node.id,level:'warning',title:'Choose an image',
            detail:'The '+node.name+' image has no source.',pageId:page.id,nodeId:node.id,tab:'settings'})
        }else if(/^javascript:|^data:text\//i.test(node.attributes.src.trim())){
          add({id:'image-unsafe-'+node.id,level:'blocker',title:'Remove unsafe image URL',
            detail:'Use a trusted image URL or an uploaded asset.',pageId:page.id,nodeId:node.id,tab:'settings'})
        }else if(!node.attributes.alt?.trim()){
          add({id:'image-alt-'+node.id,level:'warning',title:'Add image alt text',
            detail:'Describe '+node.name+' for screen-reader users.',pageId:page.id,nodeId:node.id,tab:'settings'})
        }
      }
      // Only real links need a destination; menu, tab and dropdown buttons do not.
      const isLink=(node.type==='link'||node.type==='button')&&node.tag==='a'
      if(isLink&&
        (!node.attributes.href?.trim()||node.attributes.href.trim()==='#')&&
        !node.attributes['data-action']){
        add({id:'link-'+node.id,level:'warning',title:'Check a button or link',
          detail:node.name+' has no destination yet.',pageId:page.id,nodeId:node.id,tab:'settings'})
      }
      if(['link','button'].includes(node.type)){
        const href=node.attributes.href?.trim()||''
        const path=href.split(/[?#]/)[0].replace(/\/+$/,'').toLowerCase()||'/'
        if(href.startsWith('#')&&href.length>1&&!anchors.has(href.slice(1))){
          add({id:'link-anchor-'+node.id,level:'warning',title:'A link points to a section that is not on this page',
            detail:node.name+' jumps to “'+href+'”, but nothing on '+page.name+' has that name. '+
              (href==='#contact'?'Add a Contact form section, or choose another destination.':'Choose another destination, or name a section “'+href.slice(1)+'” in its Advanced tab.'),
            pageId:page.id,nodeId:node.id,tab:'settings'})
        }
        if(href.startsWith('/')&&!href.startsWith('//')&&!knownPaths.has(path)&&!builtInPaths.has(path)){
          add({id:'link-missing-'+node.id,level:'warning',title:'Internal link has no matching page',
            detail:node.name+' points to '+href+'. Choose an existing page or fix the URL.',
            pageId:page.id,nodeId:node.id,tab:'settings'})
        }
        if(/^http:\/\//i.test(href)){
          add({id:'link-http-'+node.id,level:'warning',title:'Check an insecure external link',
            detail:node.name+' uses HTTP. Prefer HTTPS if the destination supports it.',
            pageId:page.id,nodeId:node.id,tab:'settings'})
        }
      }
      if(node.type==='video'&&!node.attributes.src?.trim()){
        add({id:'video-src-'+node.id,level:'warning',title:'Choose a video',
          detail:node.name+' has no video address yet.',pageId:page.id,nodeId:node.id,tab:'settings'})
      }
      if(node.type==='form'){
        const action=node.attributes.action?.trim()||''
        if(!action||action==='#'){
          // Forms without their own address deliver to the owner's CoBest Inbox,
          // which needs an email address to reply to.
          let hasEmail=false,hasText=false
          const scan=(child:BuilderNode)=>{
            if(child.hidden)return
            const type=(child.attributes?.type||'').toLowerCase()
            const hint=((child.attributes?.name||'')+' '+(child.attributes?.['aria-label']||'')+' '+(child.attributes?.placeholder||'')).toLowerCase()
            if(child.tag==='input'&&(type==='email'||/e-?mail/.test(hint)))hasEmail=true
            if(child.tag==='textarea'||(child.tag==='input'&&!['email','checkbox','radio','submit','button','hidden'].includes(type)))hasText=true
            for(const inner of child.children||[])scan(inner)
          }
          scan(node)
          if(!hasEmail){
            add({id:'form-email-'+node.id,level:'warning',title:'Add an email field to your form',
              detail:node.name+' has no email field, so messages cannot be delivered or answered.',
              pageId:page.id,nodeId:node.id,tab:'settings'})
          }else if(!hasText){
            add({id:'form-message-'+node.id,level:'warning',title:'Add a message field to your form',
              detail:node.name+' has nothing for visitors to type a message into, so you will only receive their contact details.',
              pageId:page.id,nodeId:node.id,tab:'settings'})
          }
        }else if(/^http:\/\//i.test(action)){
          add({id:'form-http-'+node.id,level:'warning',title:'Form sends messages without encryption',
            detail:node.name+' sends to an HTTP address. Use an HTTPS address so messages stay private.',
            pageId:page.id,nodeId:node.id,tab:'settings'})
        }
      }
      for(const child of node.children||[])walk(child)
    }
    walk(page.root)
    if(samples.length){
      const first=samples[0]
      add({id:'sample-'+page.id,level:'warning',
        title:samples.length===1?'Replace 1 sample text':'Replace '+samples.length+' sample texts',
        detail:page.name+' still shows wording that came with the template, for example '+quote(first.content||first.attributes?.href||first.name)+'.',
        pageId:page.id,nodeId:first.id,tab:'settings'})
    }
    if(samplePhotos){
      add({id:'sample-photo-'+page.id,level:'warning',
        title:samplePhotos===1?'Replace 1 sample photo':'Replace '+samplePhotos+' sample photos',
        detail:page.name+' still shows stock photos. Use pictures of your own business.',pageId:page.id,tab:'pages'})
    }
    if(h1Count===0){
      add({id:'h1-'+page.id,level:'warning',title:'Add a main heading',
        detail:page.name+' should have one clear H1 heading.',pageId:page.id,tab:'pages'})
    }else if(h1Count>1){
      add({id:'h1-multiple-'+page.id,level:'warning',title:'Review multiple main headings',
        detail:page.name+' has '+h1Count+' H1 headings. Prefer one main page heading.',
        pageId:page.id,tab:'pages'})
    }
  }
  return issues
}
