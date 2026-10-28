import React, { useState } from 'react'
import { ArrowRight, Check, Eye, LayoutTemplate, Pencil, Sparkles, Save, Smartphone, Rocket } from 'lucide-react'
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
        <h1>{hasProject?'Your website, made simple.':'Your website starts here.'}</h1>
        <p>{hasProject?'Continue editing your website or choose a different starting design.':'Choose a design that fits your business. Then follow a guided editor to customize it, check phone layouts, save a draft, and publish when you are ready.'}</p>
      </div>
      {hasProject&&<div className="website-start-actions">
        <button className="website-start-secondary" onClick={onPublish}><Eye size={16}/> Publication settings</button>
        <button className="website-start-primary" onClick={onEdit}><Pencil size={16}/> Continue editing <ArrowRight size={16}/></button>
      </div>}
    </div>
    <section className="website-start-route" aria-label="Four steps to build your website">
      <div className="website-start-route-intro"><span>YOUR WEBSITE JOURNEY</span><strong>Four simple steps. No coding needed.</strong></div>
      <ol>
        <li><div className="website-route-icon"><LayoutTemplate size={19}/></div><div><strong>01 · Pick a theme</strong><p>Start with a design you'll love.</p></div></li>
        <li><div className="website-route-icon"><Pencil size={19}/></div><div><strong>02 · Personalize</strong><p>Edit words, pictures and sections.</p></div></li>
        <li><div className="website-route-icon"><Smartphone size={19}/></div><div><strong>03 · Check & save</strong><p>Preview on phone and save a draft.</p></div></li>
        <li><div className="website-route-icon"><Rocket size={19}/></div><div><strong>04 · Publish</strong><p>Review everything before going live.</p></div></li>
      </ol>
      <p className="website-start-route-note"><Save size={14}/> Draft changes stay private until you publish.</p>
    </section>
    {hasProject&&<div className="website-current-project">
      <div className="website-current-mark"><LayoutTemplate size={21}/></div>
      <div><span>YOUR WEBSITE</span><strong>{project.name||siteName||'Untitled website'}</strong><small>{project.pages.filter(p=>!p.isCollectionTemplate).length} page(s) · Saved designs open in the visual editor</small></div>
      <button onClick={onEdit}>Open editor <ArrowRight size={15}/></button>
    </div>}
    <div className="website-start-section-heading"><div><span>01 / START HERE</span><h2>{hasProject?'Three themes you can switch to':'Select your template'}</h2><p>Choose a design, then make it your own. Each one is fully editable.</p></div><div className="website-start-count">{builderTemplates.length} themes</div></div>
    <div className="website-template-grid">
      {builderTemplates.map(template=><article className={`website-template-card website-template-${template.id}`} key={template.id}>
        <div className="website-template-preview" aria-hidden="true">
          <div className="website-mini-browser"><i/><i/><i/><span>YOUR WEBSITE</span></div>
          <div className="website-mini-nav"><b>{template.id==='storefront'?'SHOP.CO':template.id==='essential'?'studio.':'MAISON'}</b><span>Home &nbsp; About &nbsp; Contact</span></div>
          <div className="website-mini-hero">
            <div className="website-mini-copy">
              <small>{template.id==='storefront'?'CURATED FOR YOU':template.id==='essential'?'BUILT FOR WHAT’S NEXT':'A DISTINCTIVE PRESENCE'}</small>
              <strong>{template.id==='storefront'?'Everyday finds, made special.':template.id==='essential'?'A clearer way to show what you do.':'Make your brand unforgettable.'}</strong>
              <span>{template.id==='storefront'?'Make your first online store feel like you.':template.id==='essential'?'A calm, confident home for your business.':'Beautiful simplicity. Meaningful details.'}</span>
              <i>{template.id==='storefront'?'Shop now':template.id==='essential'?'Get started':'Discover more'}</i>
            </div>
            <div className="website-mini-visual"><div/><div/></div>
          </div>
          <div className="website-mini-bottom"><i/><i/><i/></div>
        </div>
        <div className="website-template-details">
          <div><div className="website-template-title"><h3>{template.name}</h3><span>{template.id==='storefront'?'Ecommerce':template.id==='essential'?'Minimal':'Editorial'}</span></div><p>{template.id==='storefront'?'An engaging home for your products, brand story, and store information.':template.id==='essential'?'A clean, modern website for your business, services, or personal brand.':'An elegant, polished website for agencies, studios, portfolios, and brands.'}</p></div>
          <button onClick={()=>choose(template)} disabled={Boolean(busy)||loading}>
            {busy===template.id?'Creating website…':hasProject?`Switch to ${template.name}`:`Use ${template.name}`} <ArrowRight size={16}/>
          </button>
        </div>
      </article>)}
    </div>
    {hasProject&&<p className="website-switch-warning"><Sparkles size={15}/> Switching themes replaces your current draft layout. You'll be asked to confirm first; your published website stays unchanged until you publish again.</p>}
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
