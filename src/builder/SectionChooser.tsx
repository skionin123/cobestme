import React,{useEffect,useRef,useState} from 'react'
import { Search,X } from 'lucide-react'
import {sectionCatalog} from './elements'

const sectionHelp:Record<string,string>={
  hero:'Introduce your business with a strong headline',
  announcement:'Share important shop information',
  imageText:'Put a picture and short story side by side',
  shopIntro:'Welcome shoppers to your collection',
  storeBenefits:'Explain delivery and customer support details',
  features:'Show what makes your business special',
  testimonials:'Share real feedback once you have permission',
  pricing:'Present a clear offer or service plan',
  faq:'Answer common visitor questions',
  cta:'Give visitors one clear next step',
  contact:'Make it easy to reach your business',
}

/** A single predictable section picker for on-canvas insertion. */
export function SectionChooser({placement,onInsert,onClose}:{
  placement:string
  onInsert:(id:string)=>void
  onClose:()=>void
}){
  const [query,setQuery]=useState('')
  const searchRef=useRef<HTMLInputElement>(null)
  useEffect(()=>{searchRef.current?.focus()},[])
  const items=sectionCatalog.filter(item=>item.id!=='footer'&&
    (item.label.toLowerCase().includes(query.trim().toLowerCase())||
      (sectionHelp[item.id]||'').toLowerCase().includes(query.trim().toLowerCase())))
  return <div className="vb-section-choice-backdrop" onMouseDown={event=>{
    if(event.target===event.currentTarget)onClose()
  }}>
    <section role="dialog" aria-modal="true" aria-label="Choose a section" className="vb-section-choice">
      <header>
        <div><strong>Add section</strong><p>{placement}</p></div>
        <button type="button" aria-label="Close section picker" onClick={onClose}><X size={18}/></button>
      </header>
      <label><Search size={15}/>
        <input ref={searchRef} aria-label="Search section designs" value={query}
          onChange={event=>setQuery(event.target.value)}
          onKeyDown={event=>{if(event.key==='Escape')onClose()}}
          placeholder="Search ready-made sections"/>
      </label>
      <div className="vb-section-choice-grid" role="group" aria-label="Ready-made section designs">
        {items.map(item=><button type="button" key={item.id}
          onClick={()=>onInsert(item.id)} aria-label={'Add '+item.label+' section'}>
          <span className={'vb-section-choice-preview vb-section-preview-'+item.id} aria-hidden="true"><i/><i/><i/></span>
          <strong>{item.label}</strong>
          <small>{sectionHelp[item.id]||'Ready to customize'}</small>
        </button>)}
        {!items.length&&<p>No sections match this search.</p>}
      </div>
    </section>
  </div>
}
