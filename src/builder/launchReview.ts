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
  // Compare all internal links against the complete set of page slugs.
  const knownPaths=new Set(project.pages.map(page=>
    (page.slug||'/').trim().replace(/\\/+$/,'').toLowerCase()||'/'))
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
    const walk=(node:BuilderNode)=>{
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
      if((node.type==='link'||node.type==='button')&&
        (!node.attributes.href?.trim()||node.attributes.href.trim()==='#')&&
        !node.attributes['data-action']){
        add({id:'link-'+node.id,level:'warning',title:'Check a button or link',
          detail:node.name+' has no destination yet.',pageId:page.id,nodeId:node.id,tab:'settings'})
      }
      if(['link','button'].includes(node.type)){
        const href=node.attributes.href?.trim()||''
        if(href.startsWith('/')&&!href.startsWith('//')&&!knownPaths.has(href.split(/[?#]/)[0].replace(/\\/+$/,'').toLowerCase()||'/')){
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
      if(node.type==='form'&&!node.attributes.action?.trim()){
        add({id:'form-'+node.id,level:'warning',title:'Verify the contact form destination',
          detail:node.name+' has no form action configured. Test a submission before launch.',
          pageId:page.id,nodeId:node.id,tab:'settings'})
      }
      for(const child of node.children||[])walk(child)
    }
    walk(page.root)
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
