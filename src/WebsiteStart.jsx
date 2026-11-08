import React, { useState } from 'react'
import { ArrowRight, Eye, Pencil } from 'lucide-react'
import { createDefaultProject } from './builder/defaultProject'
import { builderTemplates } from './builder/templates'
import {StorefrontDesign,storefrontThemes} from './StorefrontEditor.jsx'
import './website-start.css'

const blankTemplate={id:'blank',name:'Blank',build(){
  const project=createDefaultProject()
  project.pages[0].root.children=[]
  return project
}}

// A website-first entry point. These are the SAME templates used by VisualBuilder.
export default function WebsiteStart({project,siteName,products=[],design,hasShop,loading=false,onChoose,onEdit,onPublish,onPreview}){
  const [busy,setBusy]=useState('')
  const [error,setError]=useState('')
  const hasProject=Boolean(project?.pages?.length)
  const choose=async template=>{
    if(busy||loading)return
    setError('')
    setBusy(template.id)
    try{await onChoose(template)}
    catch(err){setError(err?.message||'Could not start your website. Please try again.')}
    finally{setBusy('')}
  }
  return <div className="website-start page-wrap">
    <div className="website-start-heading"><div><h1>Website themes</h1><p>Preview a theme with your shop’s content. Your live site changes when you publish.</p></div></div>
    <div className="store-theme-gallery">
      {storefrontThemes.map(theme=><article className="store-theme-tile" key={theme.id}>
        <div className="store-theme-sample" aria-hidden="true">
          <StorefrontDesign heroOnly name={siteName} design={{...design,theme:theme.id}} products={products}/>
        </div>
        <div className="store-theme-info"><h2>{theme.name}</h2><p>{theme.note}</p>
          {hasShop?<button type="button" className="btn btn-primary" disabled={loading} onClick={()=>onPreview(theme.id)}>Preview {theme.name} <ArrowRight size={15}/></button>:
            <a className="btn btn-secondary" href={`/demo?theme=${theme.id}`}>Try {theme.name} in demo</a>}
        </div>
      </article>)}
    </div>
    <details className="advanced-theme-library"><summary>Advanced page templates</summary>
    <p>Simple and Professional open in the advanced page editor.</p>
    {hasProject&&<div className="website-start-actions">
      <button className="website-start-secondary" onClick={onPublish}><Eye size={16}/> Publishing</button>
      <button className="website-start-primary" onClick={onEdit}><Pencil size={16}/> Continue editing <ArrowRight size={16}/></button>
    </div>}
    <div className="website-template-grid">
      {builderTemplates.map(template=><article className={`website-template-card website-template-${template.id}`} key={template.id}>
        <div className="website-template-preview" aria-hidden="true">
          <div className="website-mini-browser"><i/><i/><i/><span>YOUR WEBSITE</span></div>
          <div className="website-mini-nav"><b>{template.id==='essential'?'studio.':'MAISON'}</b><span>Home &nbsp; About &nbsp; Contact</span></div>
          <div className="website-mini-hero">
            <div className="website-mini-copy">
              <small>{template.id==='essential'?'BUILT FOR WHAT’S NEXT':'A DISTINCTIVE PRESENCE'}</small>
              <strong>{template.id==='essential'?'A clearer way to show what you do.':'Make your brand unforgettable.'}</strong>
              <span>{template.id==='essential'?'A calm, confident home for your business.':'Beautiful simplicity. Meaningful details.'}</span>
              <i>{template.id==='essential'?'Get started':'Discover more'}</i>
            </div>
            <div className="website-mini-visual"><div/><div/></div>
          </div>
          <div className="website-mini-bottom"><i/><i/><i/></div>
        </div>
        <div className="website-template-details">
          <div><div className="website-template-title"><h3>{template.name}</h3><span>{template.id==='essential'?'Minimal':'Editorial'}</span></div><p>{template.id==='essential'?'A clean, modern website for your business, services, or personal brand.':'An elegant, polished website for agencies, studios, portfolios, and brands.'}</p></div>
          <button onClick={()=>choose(template)} disabled={Boolean(busy)||loading}>
            {busy===template.id?'Creating website…':hasProject?`Switch to ${template.name}`:`Use ${template.name}`} <ArrowRight size={16}/>
          </button>
        </div>
      </article>)}
    </div>
    <button type="button" className="website-start-secondary" disabled={Boolean(busy)||loading} onClick={()=>choose(blankTemplate)}>Start with a blank page</button>
    {error&&<p className="website-start-error" role="alert">{error}</p>}
    </details>
  </div>
}
