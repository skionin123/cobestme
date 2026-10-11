import type { BuilderNode, BuilderProject } from './types'

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
  for(const page of project.pages){
    const slug=(page.slug||'/').trim().replace(/\/+$/,'')||'/'
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
    let heading=false
    const walk=(node:BuilderNode)=>{
      if(node.type==='heading'&&node.tag==='h1')heading=true
      if(node.type==='image'){
        if(!node.attributes.src?.trim()){
          add({id:'image-src-'+node.id,level:'warning',title:'Choose an image',
            detail:'The '+node.name+' image has no source.',pageId:page.id,nodeId:node.id,tab:'settings'})
        }else if(!node.attributes.alt?.trim()){
          add({id:'image-alt-'+node.id,level:'warning',title:'Add image alt text',
            detail:'Describe '+node.name+' for screen-reader users.',pageId:page.id,nodeId:node.id,tab:'settings'})
        }
      }
      if((node.type==='link'||node.type==='button')&&
        (!node.attributes.href?.trim()||node.attributes.href.trim()==='#')&&
        !node.attributes['data-action']){
        add({id:'link-'+node.id,level:'warning',title:'Check a button or link',
          detail:node.name+' has no destination yet.',pageId:page.id,nodeId:node.id,tab:'settings'})
      }
      for(const child of node.children||[])walk(child)
    }
    walk(page.root)
    if(!heading){
      add({id:'h1-'+page.id,level:'warning',title:'Add a main heading',
        detail:page.name+' should have one clear H1 heading.',pageId:page.id,tab:'pages'})
    }
  }
  return issues
}
