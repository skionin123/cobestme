import React, { useEffect, useMemo } from 'react'
import { createPublishedDocument } from './publicDocument'
import type { BuilderPage, BuilderProject } from './types'

type Props={
  project:BuilderProject
  page:BuilderPage
  onNavigate:(name:string)=>void
  className?:string
}

export default function VisualProjectFrame({project,page,onNavigate,className='visual-published-frame'}:Props){
  const srcDoc=useMemo(()=>createPublishedDocument(project,page.id),[project,page.id])
  useEffect(()=>{
    const handler=(event:MessageEvent)=>{
      const msg=event.data||{}
      if(msg.source!=='cobest-public-visual'||msg.type!=='navigate')return
      const href=String(msg.href||'')
      if(href==='/shop'||href==='shop'){onNavigate('Shop');return}
      const normalized=href.split('?')[0].split('#')[0].replace(/\.html$/,'')
      const target=(project.pages||[]).find(p=>!p.isCollectionTemplate&&(p.slug===normalized||p.slug.replace(/\/$/,'')===normalized.replace(/\/$/,'')))
      if(target)onNavigate(target.name)
    }
    window.addEventListener('message',handler)
    return()=>window.removeEventListener('message',handler)
  },[project,onNavigate])
  return <iframe className={className} title={page.seo?.title||page.name} sandbox="allow-scripts allow-forms allow-popups" srcDoc={srcDoc}/>
}
