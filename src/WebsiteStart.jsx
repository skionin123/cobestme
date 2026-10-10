import React, { useState } from 'react'
import { ArrowRight, Check, Eye, LayoutTemplate, Pencil, Sparkles } from 'lucide-react'
import { builderTemplates } from './builder/templates'
import './website-start.css'

// A website-first entry point. These are the SAME templates used by VisualBuilder.
export default function WebsiteStart({project,siteName,loading=false,onChoose,onEdit,onPublish}){
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
    <div className="website-start-heading">
      <div>
        <span className="website-start-eyebrow"><Sparkles size={14}/> COBEST WEBSITE BUILDER</span>
        <h1>{hasProject?'Your website, made simple.':'Choose a starting point.'}</h1>
        <p>{hasProject?'Continue editing your website or choose a different starting design.':'Pick one of two professionally designed templates. Everything can be changed in the editor.'}</p>
      </div>
      {hasProject&&<div className="website-start-actions">
        <button className="website-start-secondary" onClick={onPublish}><Eye size={16}/> Publishing</button>
        <button className="website-start-primary" onClick={onEdit}><Pencil size={16}/> Continue editing <ArrowRight size={16}/></button>
      </div>}
    </div>
    {hasProject&&<div className="website-current-project">
      <div className="website-current-mark"><LayoutTemplate size={21}/></div>
      <div><span>YOUR WEBSITE</span><strong>{project.name||siteName||'Untitled website'}</strong><small>{project.pages.filter(p=>!p.isCollectionTemplate).length} page(s) · Saved designs open in the visual editor</small></div>
      <button onClick={onEdit}>Open editor <ArrowRight size={15}/></button>
    </div>}
    <div className="website-start-section-heading"><div><span>01 / START HERE</span><h2>{hasProject?'Two templates you can switch to':'Select your template'}</h2><p>One editor, two starting styles. No complicated setup.</p></div><div className="website-start-count">2 templates</div></div>
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
    {error&&<p className="website-start-error" role="alert">{error}</p>}
    <div className="website-start-guide">
      <span><Check size={15}/> Choose a template</span>
      <ArrowRight size={15}/>
      <span><Check size={15}/> Edit text, images & layout</span>
      <ArrowRight size={15}/>
      <span><Check size={15}/> Preview, save & publish</span>
    </div>
  </div>
}
