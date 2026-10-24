import React,{useEffect,useMemo,useRef,useState} from 'react'
import {Search,X} from 'lucide-react'
import {mvpElementCatalog,sectionCatalog} from './elements'
import {walkNodes} from './tree'
import type {BuilderProject} from './types'

type Result={kind:'section'|'element'|'page'|'layer';id:string;name:string}
export function QuickAdd({project,onClose,onPick}:{
  project:BuilderProject
  onClose:()=>void
  onPick:(item:Result)=>void
}){
  const [query,setQuery]=useState('')
  const input=useRef<HTMLInputElement>(null)
  useEffect(()=>{input.current?.focus()},[])
  const results=useMemo(()=>{
    const q=query.trim().toLowerCase()
    const entries:Result[]=[
      ...sectionCatalog.filter(s=>s.id!=='footer').map(s=>({kind:'section' as const,id:s.id,name:s.label})),
      ...mvpElementCatalog.flatMap(g=>g.items.map(([id,name])=>({kind:'element' as const,id,name}))),
      ...project.pages.map(p=>({kind:'page' as const,id:p.id,name:p.name}))
    ]
    const page=project.pages.find(p=>p.id===project.activePageId)||project.pages[0]
    if(page)walkNodes(page.root,node=>entries.push({kind:'layer',id:node.id,name:node.name}))
    return entries.filter(v=>!q||v.name.toLowerCase().includes(q)).slice(0,35)
  },[project,query])
  const groupLabels:Record<Result['kind'],string>={section:'Ready-made sections',element:'Elements',page:'Pages',layer:'Current page layers'}
  const groups=(['section','element','page','layer'] as const)
    .map(kind=>({kind,items:results.filter(item=>item.kind===kind)})).filter(g=>g.items.length)
  return <div className="vb-quick-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <section className="vb-quick-dialog" role="dialog" aria-modal="true" aria-label="Search or add website elements">
      <div className="vb-quick-input"><Search size={17}/>
        <input ref={input} aria-label="Search website tools" value={query}
          onChange={e=>setQuery(e.target.value)}
          onKeyDown={e=>{
            if(e.key==='Escape')onClose()
            else if(e.key==='Enter'&&results[0])onPick(results[0])
          }} placeholder="Add sections, edit elements or find a page"/>
        <button type="button" aria-label="Close quick search" onClick={onClose}><X size={18}/></button>
      </div>
      <div className="vb-quick-results">
        {groups.map(group=><div key={group.kind} role="group" aria-label={groupLabels[group.kind]}>
          <strong>{groupLabels[group.kind]}</strong>
          {group.items.map(item=><button type="button" key={item.kind+item.id}
            aria-label={'Find '+item.name+' '+item.kind} onClick={()=>onPick(item)}>
            <span>{item.name}</span><small>{item.kind==='section'?'Add section':item.kind==='element'?'Add block':'Go to '+item.kind}</small>
          </button>)}
        </div>)}
        {!results.length&&<p>No matching designs or pages.</p>}
      </div>
      <footer>Press Enter for first result · Escape to close</footer>
    </section>
  </div>
}
