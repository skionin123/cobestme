import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BarChart3, BriefcaseBusiness, Check, ChevronDown,
  CircleHelp, Eye, FileText, Home, Image as ImageIcon, LayoutDashboard,
  Menu, Monitor, Package, Palette, Pencil, Plus, Search, Settings, ShoppingBag,
  Smartphone, Sparkles, Store, Tablet, Upload, Users, X
} from 'lucide-react'
import { acceptSessionFromHash, acceptTeamInvite, createResource, createSite, deleteSite, getActiveSiteId, getWorkspace, isAuthenticated, listResource, listSites, logout, resetPassword, saveWorkspace, setActiveSiteId, signIn, signUp, updatePassword } from './api.js'
import { AnalyticsAdvanced, BillingManager, BlogManager, CampaignsManager, CollectionsManager, CustomersManager, DiscountsManager, InboxManager, IntegrationsPanel, MediaManager, OrdersManager, ProductsManager, PublishingSettings, SitesManager, TaxonomyManager, TeamManager } from './AdminAdvanced.jsx'

const APP_NAME = 'CoBest'

const styleChoices = [
  { name: 'Minimal', note: 'Whitespace, restraint, clean typography', className: 'style-minimal' },
  { name: 'Modern', note: 'Contemporary, structured, refined UI', className: 'style-modern' },
  { name: 'Luxury', note: 'Elegant, premium, editorial details', className: 'style-luxury' },
  { name: 'Bold', note: 'High contrast, oversized type, dramatic', className: 'style-bold' },
  { name: 'Playful', note: 'Friendly, colorful, expressive', className: 'style-playful' },
  { name: 'Editorial', note: 'Story-led, magazine-inspired', className: 'style-editorial' },
]

const personalityChoices = [
  'Professional', 'Friendly', 'Premium', 'Youthful', 'Elegant', 'Energetic',
  'Trustworthy', 'Creative', 'Bold', 'Sophisticated', 'Calm', 'Modern', 'Approachable'
]

const pageChoices = ['Home', 'Shop', 'About', 'Services', 'Collections', 'Portfolio', 'Testimonials', 'FAQ', 'Blog', 'Contact']
const featureChoices = ['Ecommerce', 'Shopping cart', 'Product search', 'Product filters', 'Newsletter', 'Contact forms', 'Reviews', 'Customer accounts', 'Booking', 'Gallery']
const contentChoices = ['Logo', 'Brand guide', 'Website copy', 'Product photos', 'Lifestyle photos', 'Product descriptions', 'Testimonials', 'Team information', 'Contact information', 'Policies']
const themePresets = {
  Aurelia: {
    name:'Aurelia', styleKey:'warm', category:'Warm minimal', fit:'Home · Lifestyle · Wellness',
    description:'Soft neutrals, balanced whitespace, and calm product storytelling.',
    sectionGap:36, radius:8, buttonRadius:6,
    fontFamily:"'DM Sans', Arial, Helvetica, sans-serif", displayFont:"'Playfair Display', Georgia, serif",
    paper:'#efe5d5', surface:'#fffdf8', ink:'#171713', accent:'#9f7657', muted:'#d8cbbb',
    previewHeading:'Objects for slower, better living.', previewEyebrow:'NEW COLLECTION'
  },
  Mono: {
    name:'Mono', styleKey:'mono', category:'Brutalist utility', fit:'Tech · Objects · Modern goods',
    description:'Sharp grids, mono type, strong contrast, and direct product-first layouts.',
    sectionGap:18, radius:0, buttonRadius:0,
    fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace', displayFont:'ui-monospace, SFMono-Regular, Menlo, monospace',
    paper:'#f0f0ec', surface:'#ffffff', ink:'#101010', accent:'#ff4f00', muted:'#d6d6cf',
    previewHeading:'Simple. Direct. Useful.', previewEyebrow:'DROP 01'
  },
  Atelier: {
    name:'Atelier', styleKey:'atelier', category:'Luxury editorial', fit:'Fashion · Jewelry · Beauty',
    description:'Refined serif typography, cinematic spacing, and a high-end editorial rhythm.',
    sectionGap:52, radius:2, buttonRadius:999,
    fontFamily:"'DM Sans', Arial, sans-serif", displayFont:'Georgia, Times New Roman, serif',
    paper:'#eee5da', surface:'#faf7f2', ink:'#2c201c', accent:'#7b2430', muted:'#d8c9bc',
    previewHeading:'Quiet luxury, considered.', previewEyebrow:'THE ATELIER EDIT'
  },
  Studio: {
    name:'Studio', styleKey:'studio', category:'Fashion campaign', fit:'Apparel · Creative brands · Drops',
    description:'Oversized typography, graphic framing, and image-led campaign energy.',
    sectionGap:40, radius:0, buttonRadius:0,
    fontFamily:"'Manrope', Arial, sans-serif", displayFont:"'Manrope', Arial, sans-serif",
    paper:'#e9e9e4', surface:'#fbfbf8', ink:'#111111', accent:'#b7ff38', muted:'#cfcfc7',
    previewHeading:'New season. No compromise.', previewEyebrow:'CAMPAIGN 26'
  },
  Market: {
    name:'Market', styleKey:'market', category:'Bold retail', fit:'Food · Kids · DTC · Gifts',
    description:'Friendly color, chunky cards, rounded controls, and clear conversion cues.',
    sectionGap:28, radius:18, buttonRadius:999,
    fontFamily:"'Manrope', Arial, sans-serif", displayFont:"'Manrope', Arial, sans-serif",
    paper:'#ffe176', surface:'#fff9ef', ink:'#1c1b19', accent:'#ff5b3c', muted:'#f2c96d',
    previewHeading:'Good things, made easy.', previewEyebrow:'FRESH PICKS'
  },
  Editorial: {
    name:'Editorial', styleKey:'editorial', category:'Magazine commerce', fit:'Publishing · Art · Fashion',
    description:'Text-forward layouts, modular rules, and a curated magazine-like storefront.',
    sectionGap:58, radius:0, buttonRadius:0,
    fontFamily:"'DM Sans', Arial, sans-serif", displayFont:'Georgia, Times New Roman, serif',
    paper:'#f3efe5', surface:'#fbfaf5', ink:'#14213d', accent:'#c6533e', muted:'#d9d4c7',
    previewHeading:'Stories worth browsing.', previewEyebrow:'ISSUE 04'
  },
  Vanta: {
    name:'Vanta', styleKey:'vanta', category:'Dark luxury', fit:'Jewelry · Watches · Premium goods',
    description:'Deep charcoal surfaces, metallic accents, and restrained luxury details.',
    sectionGap:44, radius:10, buttonRadius:999,
    fontFamily:"'DM Sans', Arial, sans-serif", displayFont:'Georgia, Times New Roman, serif',
    paper:'#1d1d1b', surface:'#111110', ink:'#f6f1e8', accent:'#c4a66a', muted:'#2b2a27',
    previewHeading:'Designed to be remembered.', previewEyebrow:'SIGNATURE SERIES'
  },
  Bloom: {
    name:'Bloom', styleKey:'bloom', category:'Soft boutique', fit:'Beauty · Skincare · Boutique',
    description:'Pastel warmth, rounded shapes, and an approachable boutique presentation.',
    sectionGap:34, radius:22, buttonRadius:999,
    fontFamily:"'DM Sans', Arial, sans-serif", displayFont:"'Playfair Display', Georgia, serif",
    paper:'#f6e8ec', surface:'#fffafa', ink:'#3e2932', accent:'#b66e86', muted:'#ead7dd',
    previewHeading:'Everyday rituals, beautifully made.', previewEyebrow:'NEW IN'
  }
}

const typeSuggestions = {
  'Online Store': { pages: ['Home','Shop','Collections','About','FAQ','Contact'], features: ['Ecommerce','Shopping cart','Product search','Product filters','Newsletter','Reviews'] },
  'Business Website': { pages: ['Home','About','Services','Testimonials','FAQ','Contact'], features: ['Contact forms','Newsletter'] },
  'Portfolio': { pages: ['Home','About','Portfolio','Testimonials','Contact'], features: ['Gallery','Contact forms'] },
  'Booking Website': { pages: ['Home','About','Services','Testimonials','FAQ','Contact'], features: ['Booking','Contact forms','Newsletter'] },
  'Landing Page': { pages: ['Home'], features: ['Contact forms','Newsletter'] }
}

const defaultOnboarding = {
  businessName: '',
  businessDescription: '',
  industry: '',
  location: '',
  websiteType: 'Online Store',
  currentWebsite: '',
  goals: [],
  primaryAction: '',
  audience: '',
  differentiator: '',
  styles: [],
  personalities: [],
  primaryColor: '#171717',
  secondaryColor: '#f4f1eb',
  accentColor: '#b69a78',
  typography: 'Clean Sans Serif',
  inspiration: '',
  avoid: '',
  pages: ['Home'],
  features: [],
  contentReady: [],
  launchDate: '',
  success: ''
}

const defaultProducts = []

const defaultEditor = {
  device: 'desktop',
  selected: 'hero',
  hero: {
    eyebrow: 'WELCOME',
    heading: 'A website built around your business.',
    body: 'Use CoBest to shape your storefront, organize content, and manage what you sell from one place.',
    button: 'Explore',
    align: 'left',
  },
  featured: { title: 'Featured products', columns: 3 },
  story: { title: 'Tell your story', body: 'Use this section to explain what your business believes in and why customers should choose you.' },
  theme: { ...themePresets.Aurelia },
  blocks: [],
  currentPage: 'Home',
  pageContent: {},
  pageMeta: {},
  header: { logoText: '', menu: ['Shop','About','Contact'] },
  newsletter: { heading: 'Stay in the loop.', body: 'New products, stories, and updates.', button: 'Join' },
  footer: { text: 'Built with CoBest', menu: ['Contact'] },
  sectionOrder: ['hero','featured','story','newsletter']
}

function normalizeOnboarding(value = {}) {
  const merged = { ...defaultOnboarding, ...(value || {}) }
  for (const key of ['goals','styles','personalities','pages','features','contentReady']) {
    if (!Array.isArray(merged[key])) merged[key] = [...defaultOnboarding[key]]
  }
  return merged
}

function normalizeEditor(value = {}) {
  const merged = { ...defaultEditor, ...(value || {}) }
  merged.hero = { ...defaultEditor.hero, ...((value || {}).hero || {}) }
  merged.featured = { ...defaultEditor.featured, ...((value || {}).featured || {}) }
  merged.story = { ...defaultEditor.story, ...((value || {}).story || {}) }
  merged.theme = { ...defaultEditor.theme, ...((value || {}).theme || {}) }
  merged.blocks = Array.isArray((value || {}).blocks) ? value.blocks : []
  merged.pageContent = { ...defaultEditor.pageContent, ...((value || {}).pageContent || {}) }
  merged.pageMeta = { ...defaultEditor.pageMeta, ...((value || {}).pageMeta || {}) }
  merged.header = { ...defaultEditor.header, ...((value || {}).header || {}) }
  merged.newsletter = { ...defaultEditor.newsletter, ...((value || {}).newsletter || {}) }
  merged.footer = { ...defaultEditor.footer, ...((value || {}).footer || {}) }
  merged.currentPage = (value || {}).currentPage || 'Home'
  merged.sectionOrder = Array.isArray((value || {}).sectionOrder) ? (value || {}).sectionOrder : [...defaultEditor.sectionOrder]
  return merged
}

function useStoredState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const existing = localStorage.getItem(key)
      return existing ? JSON.parse(existing) : initial
    } catch { return initial }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
  }, [key, value])
  return [value, setValue]
}

function formatPrice(value) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value)
}

function Logo({ inverse = false }) {
  return <div className={`logo ${inverse ? 'logo-inverse' : ''}`}><span className="logo-mark">C</span><span>{APP_NAME}</span></div>
}

function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button className={`btn btn-${variant} ${className}`} {...props}>{children}</button>
}

function Landing({ onStart, onLogin }) {
  const faqs = [
    ['What is CoBest?', 'CoBest is a website and commerce platform built around the business behind the site. Client discovery, website structure, content, products, customers, orders, analytics, and visual design live in one connected workspace.'],
    ['Can I use CoBest for an online store?', 'Yes. CoBest is designed for product-based businesses as well as service businesses, portfolios, booking websites, and brand sites. Store projects include catalog, customer, order, and storefront workflows alongside the website builder.'],
    ['How is CoBest different from a template builder?', 'CoBest starts with the business, audience, goals, brand direction, content readiness, and required functionality. Those decisions become project context that stays visible while the website is built and managed.'],
    ['Can designers and business owners use the same workspace?', 'Yes. The structure separates project context, website design, content, and commerce so each person can work in the area they understand without losing the shared direction.']
  ]
  return (
    <div className="landing">
      <div className="announcement"><span>Build your website, sell online, and manage the business from one place.</span><button onClick={onStart}>Start free <ArrowRight size={13}/></button></div>
      <nav className="landing-nav container">
        <Logo />
        <div className="landing-nav-links"><a href="#website">Website</a><a href="#commerce">Commerce</a><a href="#approach">How it works</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a><Button variant="ghost" onClick={onLogin}>Log in</Button><Button onClick={onStart}>Start free</Button></div>
      </nav>

      <main className="hero-wrap container" id="product">
        <div className="hero-copy">
          <div className="eyebrow-pill"><Sparkles size={14}/> Website building that starts with the business</div>
          <h1>Build a store people trust. Run it from one place.</h1>
          <p>CoBest gives growing businesses one home for website design, products, orders, customers, content, and the business context behind every decision.</p>
          <div className="hero-actions"><Button onClick={onStart}>Start free <ArrowRight size={16}/></Button><a className="btn btn-secondary" href="#approach">See how it works</a></div>
          <div className="trust-row"><span><Check size={15}/> Guided onboarding</span><span><Check size={15}/> Visual website builder</span><span><Check size={15}/> Commerce workspace</span></div>
        </div>
        <div className="hero-product-shell">
          <div className="mini-window-bar"><span/><span/><span/><b>app.cobest.me</b></div>
          <div className="mini-app">
            <aside><div className="mini-logo">C</div><span className="active-mini"/><span/><span/><span/><span/></aside>
            <section>
              <small>STORE HOME</small><h3>Aurelia Goods</h3>
              <div className="mini-progress"><div style={{width:'76%'}}/></div>
              <div className="mini-cards"><div><b>₱18.4K</b><span>Sales</span></div><div><b>12</b><span>Orders</span></div><div><b>3.2%</b><span>Conversion</span></div></div>
              <div className="mini-editor"><div className="mini-sidebar"><i/><i/><i/><i/></div><div className="mini-canvas"><div className="mini-hero"><span>Objects for quieter living.</span></div><div className="mini-products"><i/><i/><i/></div></div></div>
            </section>
          </div>
        </div>
      </main>

      <section className="audience-strip container">
        <span>One platform for the whole website business</span><div><b>Website</b><b>Products</b><b>Orders</b><b>Customers</b><b>Content</b><b>Analytics</b></div>
      </section>

      <section className="landing-section container" id="commerce">
        <p className="section-kicker">SELL AND MANAGE</p><h2>Everything you need behind the storefront.</h2>
        <div className="feature-grid four">
          <article><span>01</span><h3>Products</h3><p>Create products, organize categories, manage pricing and inventory, and surface the same catalog across the storefront.</p></article>
          <article><span>02</span><h3>Orders</h3><p>Keep purchases, payment state, fulfillment status, and customer details together in one clear order workflow.</p></article>
          <article><span>03</span><h3>Customers</h3><p>Understand who buys from the business with customer profiles, order history, contact details, and notes.</p></article>
          <article><span>04</span><h3>Analytics</h3><p>See store activity, sales signals, conversion, and website performance from the same business dashboard.</p></article>
        </div>
      </section>

      <section className="platform-section" id="website">
        <div className="container platform-intro"><div><p className="section-kicker">WEBSITE + COMMERCE</p><h2>Your storefront and your back office belong together.</h2></div><p>Content, layout, products, and business data are separated cleanly but stay connected, so a product update does not require redesigning a page and a redesign does not erase the store.</p></div>
        <div className="container platform-grid">
          <article className="platform-card dark"><div className="platform-label"><FileText size={18}/> Business context</div><h3>Start with the information a good designer asks first.</h3><p>Business goals, audience, brand direction, content readiness, pages, functionality, and references become a working website brief inside the project.</p><div className="brief-mock"><span>Primary goal</span><strong>Sell thoughtfully curated home goods</strong><span>Direction</span><strong>Luxury · Minimal · Editorial</strong><span>Audience</span><strong>Design-conscious homeowners</strong></div></article>
          <article className="platform-card"><div className="platform-label"><Palette size={18}/> Online store</div><h3>Build the storefront visually.</h3><p>Use reusable sections, live page preview, brand settings, and device controls to shape the customer experience without editing code.</p><div className="editor-mock"><aside><i/><i/><i/><i/></aside><main><div className="editor-mock-hero">New collection</div><div><i/><i/><i/></div></main><aside><span>Heading</span><b/><span>Spacing</span><b/><span>Alignment</span><b/></aside></div></article>
          <article className="platform-card"><div className="platform-label"><ShoppingBag size={18}/> Commerce</div><h3>Manage the business without touching the design.</h3><p>Products, inventory, orders, and customers live in dedicated management screens while the website reads from the same store information.</p><div className="commerce-mock"><div><i/><span>Arc Table Lamp</span><b>₱3,490</b></div><div><i/><span>Forma Catchall</span><b>₱1,290</b></div><div><i/><span>Linen House Throw</span><b>₱2,790</b></div></div></article>
          <article className="platform-card accent"><div className="platform-label"><Store size={18}/> Publishing</div><h3>Preview changes before they go live.</h3><p>Work on the storefront in a controlled editing environment, review the customer view, and keep the production domain separate from day-to-day design changes.</p><div className="publish-mock"><span>Workspace</span><strong>app.cobest.me</strong><ArrowRight size={20}/><span>Storefront</span><strong>aureliagoods.com</strong></div></article>
        </div>
      </section>

      <section className="builder-showcase container">
        <div className="builder-copy"><p className="section-kicker">VISUAL WEBSITE BUILDER</p><h2>Design from the customer’s point of view.</h2><p>Edit pages in the browser, control reusable sections, and see desktop, tablet, and mobile layouts while the business content and product catalog remain connected underneath.</p><div className="builder-points"><span><Check size={15}/> Live page preview</span><span><Check size={15}/> Desktop, tablet, mobile</span><span><Check size={15}/> Reusable sections</span><span><Check size={15}/> Brand-aware controls</span></div><Button onClick={onStart}>Start building <ArrowRight size={15}/></Button></div>
        <div className="builder-visual"><div className="builder-bar"><span>Home</span><div><Monitor size={14}/><Tablet size={14}/><Smartphone size={14}/></div><b>Save</b></div><div className="builder-body"><aside><span>SECTIONS</span><b>Header</b><b className="active">Hero</b><b>Featured products</b><b>Brand story</b><b>Newsletter</b></aside><main><div className="builder-page"><small>NEW COLLECTION</small><h3>Objects for quieter living.</h3><button>Shop collection</button><div><i/><i/><i/></div></div></main><aside><span>HERO SETTINGS</span><label>Heading</label><b/><label>Alignment</label><b/><label>Spacing</label><b/></aside></div></div>
      </section>

      <section className="landing-section container" id="approach">
        <p className="section-kicker">THE COBEST DIFFERENCE</p><h2>Do the discovery before the design decisions.</h2>
        <div className="feature-grid four">
          <article><span>01</span><h3>Understand</h3><p>Capture the business, target customer, goals, brand personality, visual references, content, and required functionality.</p></article>
          <article><span>02</span><h3>Organize</h3><p>Turn those answers into a clear website brief, page structure, content checklist, and store setup that the whole team can use.</p></article>
          <article><span>03</span><h3>Build</h3><p>Design the website with the project context still visible, instead of starting from a blank canvas with no business direction.</p></article>
          <article><span>04</span><h3>Run</h3><p>Move from launch into everyday website, product, order, customer, content, and performance management without changing systems.</p></article>
        </div>
      </section>

      <section className="pricing-section" id="pricing"><div className="container"><div className="pricing-intro"><p className="section-kicker">PRICING</p><h2>Build first. Pay when the business is ready to go live.</h2><p>Start the website without a card. Upgrade when you need a custom domain and a live commerce workspace.</p></div><div className="pricing-grid"><article><span>BUILD</span><h3>Free</h3><strong>₱0 <small>/ month</small></strong><p>For preparing the website and organizing the business before launch.</p><ul><li><Check size={14}/> 1 website</li><li><Check size={14}/> Guided onboarding</li><li><Check size={14}/> Website brief</li><li><Check size={14}/> Visual website builder</li><li><Check size={14}/> CoBest storefront address</li></ul><Button variant="secondary" onClick={onStart}>Start free</Button></article><article className="featured-plan"><span>LAUNCH</span><div className="plan-badge">Most popular</div><h3>Launch</h3><strong>₱990 <small>/ site / month</small></strong><p>For businesses ready to publish, sell, and manage their website every day.</p><ul><li><Check size={14}/> Everything in Free</li><li><Check size={14}/> Custom domain</li><li><Check size={14}/> Products and inventory</li><li><Check size={14}/> Orders and customers</li><li><Check size={14}/> Remove CoBest branding</li></ul><Button onClick={onStart}>Start free</Button></article><article><span>GROW</span><h3>Growth</h3><strong>₱2,490 <small>/ site / month</small></strong><p>For growing businesses that need more people, reporting, and support.</p><ul><li><Check size={14}/> Everything in Launch</li><li><Check size={14}/> Team access</li><li><Check size={14}/> Advanced analytics</li><li><Check size={14}/> Priority support</li><li><Check size={14}/> Additional publishing controls</li></ul><Button variant="secondary" onClick={onStart}>Start free</Button></article></div><p className="pricing-note">Pricing shown in Philippine pesos. You can change these plan names, prices, and entitlements before billing is connected.</p></div></section><section className="landing-cta"><div className="container"><p className="section-kicker">START WITH THE BUSINESS</p><h2>Build the store around what the business actually needs.</h2><p>Set the direction, organize the website, and manage the storefront from one place.</p><div><Button onClick={onStart}>Start free <ArrowRight size={16}/></Button><Button variant="secondary" onClick={onLogin}>Log in</Button></div></div></section>

      <section className="faq-section container" id="faq"><div><p className="section-kicker">FAQ</p><h2>Questions about CoBest.</h2></div><div>{faqs.map(([q,a])=><details key={q}><summary>{q}<Plus size={17}/></summary><p>{a}</p></details>)}</div></section>
      <footer className="landing-footer container"><Logo/><p>Website and commerce, built around the business.</p><div><span>cobest.me</span><span>Website</span><span>Commerce</span></div></footer>
    </div>
  )
}

function Onboarding({ data, setData, onComplete, onExit }) {
  const steps = ['Business', 'Goals', 'Audience', 'Style', 'Brand', 'Content', 'Structure', 'Review']
  const [step, setStep] = useState(0)
  const set = (key, value) => setData(prev => ({ ...prev, [key]: value }))
  const toggle = (key, item, max) => setData(prev => {
    const arr = prev[key] || []
    if (arr.includes(item)) return { ...prev, [key]: arr.filter(x => x !== item) }
    if (max && arr.length >= max) return prev
    return { ...prev, [key]: [...arr, item] }
  })
  const suggested = typeSuggestions[data.websiteType] || typeSuggestions['Business Website']
  const applySuggested = () => setData(prev => ({ ...prev, pages: Array.from(new Set([...prev.pages, ...suggested.pages])), features: Array.from(new Set([...prev.features, ...suggested.features])) }))
  const next = () => step < steps.length - 1 ? setStep(step + 1) : onComplete()
  return (
    <div className="onboarding-layout">
      <aside className="onboarding-side">
        <Logo inverse />
        <div className="onboarding-side-copy"><p>Website project setup</p><h2>Let's understand what you're building.</h2><span>Your answers become the design brief for this project.</span></div>
        <div className="step-list">
          {steps.map((s, i) => <div key={s} className={`step-item ${i === step ? 'current' : ''} ${i < step ? 'done' : ''}`}><b>{i < step ? <Check size={13}/> : i + 1}</b><span>{s}</span></div>)}
        </div>
        <button className="exit-link" onClick={onExit}><ArrowLeft size={15}/> Back to home</button>
      </aside>
      <main className="onboarding-main">
        <div className="mobile-progress"><span>{step + 1} / {steps.length}</span><div><i style={{width:`${((step+1)/steps.length)*100}%`}}/></div></div>
        <div className="onboarding-card">
          {step === 0 && <>
            <p className="overline">BUSINESS</p><h1>Tell us about your business.</h1><p className="lead">Start with the basics. You can update these details later.</p>
            <div className="form-grid two"><Field label="Business name"><input value={data.businessName} onChange={e=>set('businessName', e.target.value)} placeholder="Your business name"/></Field><Field label="Industry"><input value={data.industry} onChange={e=>set('industry', e.target.value)} placeholder="e.g. Fashion, Architecture"/></Field></div>
            <Field label="What does your business do?"><textarea value={data.businessDescription} onChange={e=>set('businessDescription', e.target.value)} rows="5" placeholder="Describe the business in your own words..."/></Field>
            <Field label="Where are you based?"><input value={data.location} onChange={e=>set('location', e.target.value)} placeholder="City, country"/></Field>
            <Field label="What are we building?"><div className="choice-row">{['Online Store','Business Website','Portfolio','Booking Website','Landing Page'].map(x=><Choice key={x} active={data.websiteType===x} onClick={()=>set('websiteType',x)}>{x}</Choice>)}</div></Field>
          </>}
          {step === 1 && <>
            <p className="overline">GOALS</p><h1>What should the website accomplish?</h1><p className="lead">Choose the outcomes that matter most to the business.</p>
            <Field label="Website goals"><div className="select-grid">{['Sell products','Generate leads','Get bookings','Build credibility','Showcase work','Grow an audience'].map(x=><SelectCard key={x} active={data.goals.includes(x)} onClick={()=>toggle('goals',x)} title={x}/>)}</div></Field>
            <Field label="What is the most important action a visitor should take?"><input value={data.primaryAction} onChange={e=>set('primaryAction', e.target.value)} placeholder="e.g. Book a consultation"/></Field>
          </>}
          {step === 2 && <>
            <p className="overline">AUDIENCE</p><h1>Who are we designing for?</h1><p className="lead">Strong design decisions start with a clear understanding of the customer.</p>
            <Field label="Describe your ideal customer"><textarea value={data.audience} onChange={e=>set('audience',e.target.value)} rows="5"/></Field>
            <Field label="Why should someone choose you instead of a competitor?"><textarea value={data.differentiator} onChange={e=>set('differentiator',e.target.value)} rows="4"/></Field>
          </>}
          {step === 3 && <>
            <p className="overline">VISUAL DIRECTION</p><h1>What should the website feel like?</h1><p className="lead">Select up to three directions. Think feeling, not template.</p>
            <div className="style-grid">{styleChoices.map(s=><button key={s.name} className={`style-card ${s.className} ${data.styles.includes(s.name)?'selected':''}`} onClick={()=>toggle('styles',s.name,3)}><div className="style-preview"><span>Aa</span><i/><i/></div><div><strong>{s.name}</strong><small>{s.note}</small></div>{data.styles.includes(s.name)&&<b className="selected-check"><Check size={13}/></b>}</button>)}</div>
            <Field label="Choose up to five personality words"><div className="choice-row">{personalityChoices.map(x=><Choice key={x} active={data.personalities.includes(x)} onClick={()=>toggle('personalities',x,5)}>{x}</Choice>)}</div></Field>
          </>}
          {step === 4 && <>
            <p className="overline">BRAND</p><h1>Bring the visual identity into focus.</h1><p className="lead">Use the details you already have to establish a clear visual direction for the site.</p>
            <div className="form-grid three"><ColorField label="Primary" value={data.primaryColor} onChange={v=>set('primaryColor',v)}/><ColorField label="Secondary" value={data.secondaryColor} onChange={v=>set('secondaryColor',v)}/><ColorField label="Accent" value={data.accentColor} onChange={v=>set('accentColor',v)}/></div>
            <Field label="Typography direction"><div className="choice-row">{['Clean Sans Serif','Elegant Serif','Bold Display','Editorial','Friendly Rounded'].map(x=><Choice key={x} active={data.typography===x} onClick={()=>set('typography',x)}>{x}</Choice>)}</div></Field>
            <Field label="Website inspiration"><input value={data.inspiration} onChange={e=>set('inspiration',e.target.value)} placeholder="https://..."/></Field>
            <Field label="What should we avoid?"><textarea value={data.avoid} onChange={e=>set('avoid',e.target.value)} rows="3"/></Field>
          </>}
          {step === 5 && <>
            <p className="overline">CONTENT</p><h1>What do you already have?</h1><p className="lead">A strong build plan depends on knowing what is ready and what is still missing.</p>
            <Field label="Content and brand assets ready today"><div className="select-grid compact">{contentChoices.map(x=><SelectCard key={x} active={data.contentReady.includes(x)} onClick={()=>toggle('contentReady',x)} title={x}/>)}</div></Field>
            <div className="form-grid two"><Field label="Desired launch date"><input type="date" value={data.launchDate} onChange={e=>set('launchDate',e.target.value)}/></Field><Field label="Existing website, if any"><input value={data.currentWebsite||''} onChange={e=>set('currentWebsite',e.target.value)} placeholder="https://..."/></Field></div>
          </>}
          {step === 6 && <>
            <p className="overline">STRUCTURE</p><h1>What does the website need?</h1><p className="lead">Choose the pages and features this website needs. CoBest can suggest a starting structure from the website type you selected.</p>
            <div className="suggestion-banner"><div><span>Suggested for {data.websiteType}</span><strong>{suggested.pages.join(' · ')}</strong><p>{suggested.features.join(' · ')}</p></div><Button variant="secondary" onClick={applySuggested}>Apply suggested setup</Button></div>
            <Field label="Pages"><div className="select-grid compact">{pageChoices.map(x=><SelectCard key={x} active={data.pages.includes(x)} onClick={()=>toggle('pages',x)} title={x}/>)}</div></Field>
            <Field label="Features"><div className="select-grid compact">{featureChoices.map(x=><SelectCard key={x} active={data.features.includes(x)} onClick={()=>toggle('features',x)} title={x}/>)}</div></Field>
            <Field label="What would make this project successful?"><textarea value={data.success} onChange={e=>set('success',e.target.value)} rows="4"/></Field>
          </>}
          {step === 7 && <Review data={data}/>} 
        </div>
        <div className="onboarding-footer"><Button variant="secondary" disabled={step===0} onClick={()=>setStep(step-1)}><ArrowLeft size={15}/> Back</Button><div className="autosave"><Check size={14}/> Saved locally</div><Button onClick={next}>{step===steps.length-1?'Complete onboarding':'Continue'} <ArrowRight size={15}/></Button></div>
      </main>
    </div>
  )
}

function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label> }
function Choice({active,onClick,children}) { return <button type="button" className={`choice ${active?'active':''}`} onClick={onClick}>{active&&<Check size={13}/>} {children}</button> }
function SelectCard({active,onClick,title}) { return <button type="button" className={`select-card ${active?'active':''}`} onClick={onClick}><span>{active?<Check size={15}/>:<Plus size={15}/>}</span><strong>{title}</strong></button> }
function ColorField({label,value,onChange}) { return <Field label={label}><div className="color-input"><input type="color" value={value} onChange={e=>onChange(e.target.value)}/><input value={value} onChange={e=>onChange(e.target.value)}/></div></Field> }

function Review({data}) {
  const groups = [
    ['Business', data.businessName, `${data.websiteType} · ${data.industry}`],
    ['Goal', data.primaryAction, data.goals.join(' · ')],
    ['Direction', data.styles.join(' + '), data.personalities.join(' · ')],
    ['Structure', `${data.pages.length} pages`, data.pages.join(' · ')],
    ['Content', `${data.contentReady.length} assets ready`, data.launchDate ? `Target launch · ${data.launchDate}` : 'Launch date not set'],
  ]
  return <><p className="overline">REVIEW</p><h1>Your website direction is ready.</h1><p className="lead">This becomes the working project brief and stays connected to the website, content, and commerce workspace.</p><div className="review-grid">{groups.map(g=><div className="review-card" key={g[0]}><span>{g[0]}</span><strong>{g[1]}</strong><p>{g[2]}</p></div>)}</div><div className="review-colors"><span>Brand colors</span><div>{[data.primaryColor,data.secondaryColor,data.accentColor].map(c=><i key={c} style={{background:c}} title={c}/>)}</div></div></>
}

const navGroups = [
  { label: '', items: [['dashboard','Home',LayoutDashboard],['processes','Setup & workflow',Sparkles],['orders','Orders',ShoppingBag],['products','Products',Package],['taxonomy','Categories & brands',FileText],['collections','Collections',Store],['customers','Customers',Users]] },
  { label: 'Online store', items: [['pages','Overview & pages',Store],['themes','Themes',Palette],['navigation','Navigation',Menu],['editor','Website editor',Pencil],['storefront','Preview store',Eye]] },
  { label: 'Content', items: [['media','Media',ImageIcon],['blog','Blog',FileText],['brief','Website brief',FileText],['inbox','Inbox',FileText]] },
  { label: 'Growth', items: [['analytics','Analytics',BarChart3],['marketing','Marketing',Sparkles],['discounts','Discounts',BriefcaseBusiness]] },
  { label: 'Workspace', items: [['sites','Sites',Store],['team','Team',Users]] },
]
const navItems = navGroups.flatMap(group => group.items)

function AppShell({ page, setPage, children, onRestart, onSignOut, businessName,sites=[],activeSiteId,onSiteChange,onCreateSite }) {
  const [mobile, setMobile] = useState(false)
  const activeSite = sites.find(site=>String(site.id)===String(activeSiteId))
  const activeSiteName = activeSite?.site_name || activeSite?.slug || businessName || 'Untitled website'
  return <div className="app-shell">
    <aside className={`app-sidebar ${mobile?'open':''}`}>
      <div className="sidebar-top"><Logo inverse/><button className="mobile-close" onClick={()=>setMobile(false)}><X/></button></div>
      <div className="site-switcher">
        <div className="site-switcher-head">
          <div className="store-avatar">{String(activeSiteName||'C').charAt(0).toUpperCase()}</div>
          <div className="site-switcher-copy"><span>Current store</span><strong>{activeSiteName}</strong></div>
          <button className="site-add-button" title="Create another site" onClick={onCreateSite} aria-label="Create another site"><Plus size={16}/></button>
        </div>
        <label className="site-switcher-control">
          <Store size={14}/>
          <select aria-label="Active site" value={activeSiteId||''} onChange={e=>onSiteChange?.(e.target.value)}>
            <option value="" disabled>Select site</option>
            {sites.map(s=><option key={s.id} value={s.id}>{s.site_name||s.slug||'Untitled website'}</option>)}
          </select>
        </label>
      </div>
      <nav className="app-nav">{navGroups.map(group=><div className="nav-group" key={group.label||'primary'}>{group.label&&<span className="nav-group-label">{group.label}</span>}{group.items.map(([id,label,I])=><button key={id} className={page===id?'active':''} onClick={()=>{setPage(id);setMobile(false)}}><I size={17}/><span>{label}</span></button>)}</div>)}</nav>
      <div className="sidebar-bottom"><button onClick={()=>setPage('settings')}><Settings size={18}/> Settings</button><button onClick={()=>setPage('help')}><CircleHelp size={18}/> Help</button><button onClick={onRestart}><Sparkles size={18}/> Store setup</button>{onSignOut&&<button onClick={onSignOut}><X size={18}/> Sign out</button>}</div>
    </aside>
    <main className="app-main"><header className="app-header"><button className="menu-button" onClick={()=>setMobile(true)}><Menu size={20}/></button><div className="breadcrumb"><span>{businessName||APP_NAME}</span><b>/</b><strong>{navItems.find(x=>x[0]===page)?.[1]||'Workspace'}</strong></div><div className="header-actions"><button title="Search products" onClick={()=>setPage('products')}><Search size={18}/></button><div className="header-avatar">CO</div></div></header>{children}</main>
  </div>
}

function Dashboard({ data, products, customers=[], orders=[], setPage }) {
  const completeness = Math.min(96, 48 + data.pages.length * 4 + data.styles.length * 5 + products.length * 3)
  const paidSales = orders.filter(o=>o.payment_status==='Paid').reduce((sum,o)=>sum+Number(o.total||0),0)
  return <div className="page-wrap">
    <div className="page-head"><div><p className="overline">STORE HOME</p><h1>Good morning.</h1><p>Manage {data.businessName} from one place.</p></div><div className="page-actions"><Button variant="secondary" onClick={()=>setPage('processes')}><Sparkles size={15}/> Setup & workflow</Button><Button variant="secondary" onClick={()=>setPage('storefront')}><Eye size={15}/> View store</Button><Button onClick={()=>setPage('editor')}><Pencil size={15}/> Edit website</Button></div></div>
    <div className="stat-grid"><Stat title="Sales" value={formatPrice(paidSales)} note={paidSales?"Paid revenue":"No paid sales yet"} icon={BarChart3}/><Stat title="Orders" value={String(orders.length)} note={orders.length?"Orders recorded":"No orders yet"} icon={ShoppingBag}/><Stat title="Conversion" value="—" note="Available after traffic" icon={Store}/><Stat title="Customers" value={String(customers.length)} note={customers.length?"Customer records":"No customers yet"} icon={Users}/></div>
    <div className="dashboard-grid commerce-home-grid"><section className="panel"><div className="panel-head"><div><span>Store activity</span><h3>Ready for your first visit</h3></div><Button variant="ghost" onClick={()=>setPage('analytics')}>View analytics <ArrowRight size={14}/></Button></div><div className="empty-panel"><BarChart3 size={24}/><strong>Performance will appear here</strong><p>Once your storefront receives traffic and orders, CoBest will show sales and conversion activity here.</p></div></section><section className="panel"><div className="panel-head"><div><span>Orders</span><h3>Nothing needs attention</h3></div><Button variant="ghost" onClick={()=>setPage('orders')}>View orders <ArrowRight size={14}/></Button></div><div className="empty-panel"><ShoppingBag size={24}/><strong>No orders yet</strong><p>New orders will appear here with payment and fulfillment status.</p></div></section></div>
    <div className="progress-panel"><div className="progress-ring" style={{'--p':`${completeness*3.6}deg`}}><span>{completeness}%</span></div><div className="progress-copy"><span>Store setup</span><h2>Keep building the storefront.</h2><p>Your business direction is captured. Continue refining pages, products, content, and the customer experience.</p><div className="progress-line"><i style={{width:`${completeness}%`}}/></div></div><div className="progress-action"><Button variant="secondary" onClick={()=>setPage('processes')}>Continue setup</Button></div></div>
    <div className="workspace-grid"><button onClick={()=>setPage('products')}><Package size={20}/><div><span>Catalog</span><strong>{products.length} products</strong><p>Pricing, inventory, and product status.</p></div><ArrowRight size={15}/></button><button onClick={()=>setPage('editor')}><Palette size={20}/><div><span>Online store</span><strong>Customize website</strong><p>Edit sections and customer-facing pages.</p></div><ArrowRight size={15}/></button><button onClick={()=>setPage('customers')}><Users size={20}/><div><span>Customers</span><strong>Customer records</strong><p>Purchase history and customer details.</p></div><ArrowRight size={15}/></button><button onClick={()=>setPage('media')}><ImageIcon size={20}/><div><span>Content</span><strong>Media library</strong><p>Website and product assets in one place.</p></div><ArrowRight size={15}/></button></div>
  </div>
}


function ProcessCenter({data,editor,workspace,products=[],collections=[],media=[],blogPosts=[],orders=[],customers=[],contacts=[],subscribers=[],setPage}) {
  const policies=workspace?.settings||{}
  const setup=[
    {title:'Business direction',note:'Business, audience, goals, brand direction, and required features.',done:!!data.businessName&&!!data.websiteType,action:'Review brief',page:'brief'},
    {title:'Choose a theme',note:'Pick the visual foundation before fine-tuning sections.',done:!!editor.theme?.name,action:'Theme library',page:'themes'},
    {title:'Build pages',note:'Create the customer-facing page structure and visibility.',done:(data.pages||[]).length>=3,action:'Manage pages',page:'pages'},
    {title:'Set navigation',note:'Choose the main-menu and footer links customers use.',done:(editor.header?.menu||[]).length>0,action:'Edit navigation',page:'navigation'},
    {title:'Build the catalog',note:'Add products, prices, inventory, images, variants, categories, and collections.',done:products.length>0,action:'Products',page:'products'},
    {title:'Add content',note:'Upload media and prepare blog/content used across the storefront.',done:media.length>0||blogPosts.length>0,action:'Content',page:'media'},
    {title:'Store policies & defaults',note:'Set contact details, SEO defaults, shipping, tax, privacy, terms, and refunds.',done:!!(policies.privacyPolicy&&policies.termsPolicy&&policies.refundPolicy),action:'Store settings',page:'settings'},
    {title:'Publish the store',note:'Publish the current approved draft to the public storefront.',done:!!workspace?.is_published,action:workspace?.is_published?'Publishing settings':'Publish',page:'settings'}
  ]
  const complete=setup.filter(x=>x.done).length
  const percent=Math.round((complete/setup.length)*100)
  const next=setup.find(x=>!x.done)
  const operations=[
    {title:'Orders',value:orders.length+' total',note:'Review payment, fulfillment, tracking, and order notes.',page:'orders',icon:ShoppingBag},
    {title:'Customers',value:customers.length+' records',note:'Manage customer profiles, purchase history, tags, and consent.',page:'customers',icon:Users},
    {title:'Inbox',value:contacts.length+' messages · '+subscribers.length+' subscribers',note:'Handle contact forms, bookings, subscribers, and reviews.',page:'inbox',icon:FileText},
    {title:'Analytics',value:'Store performance',note:'Review traffic, conversion, product performance, and sales signals.',page:'analytics',icon:BarChart3}
  ]
  return <div className="page-wrap process-center">
    <div className="page-head"><div><p className="overline">STORE OPERATING SYSTEM</p><h1>Setup & workflow</h1><p>Work through CoBest in the right order, then run day-to-day operations from the same workspace.</p></div>{next&&<Button onClick={()=>setPage(next.page)}>Next: {next.title} <ArrowRight size={15}/></Button>}</div>
    <div className="process-summary panel"><div className="process-progress"><div className="progress-ring" style={{'--p':(percent*3.6)+'deg'}}><span>{percent}%</span></div><div><span className="overline">LAUNCH READINESS</span><h2>{complete} of {setup.length} setup steps complete</h2><p>{next?'Recommended next step: '+next.title+'.':'Core setup is complete. Continue operating and improving the store.'}</p></div></div><div className="process-summary-actions"><Button variant="secondary" onClick={()=>setPage('storefront')}><Eye size={15}/> Preview</Button><Button variant="secondary" onClick={()=>setPage('settings')}><Settings size={15}/> Publishing</Button></div></div>
    <div className="process-layout"><section className="panel"><div className="panel-head"><div><span>Launch process</span><h3>Build → organize → publish</h3></div></div><div className="process-step-list">{setup.map((x,i)=><div className={'process-step '+(x.done?'done':'')} key={x.title}><div className="process-step-number">{x.done?<Check size={15}/>:String(i+1).padStart(2,'0')}</div><div><strong>{x.title}</strong><p>{x.note}</p></div><button onClick={()=>setPage(x.page)}>{x.done?'Review':x.action}<ArrowRight size={14}/></button></div>)}</div></section>
    <section className="panel"><div className="panel-head"><div><span>Daily operations</span><h3>Run the business</h3></div></div><div className="process-ops">{operations.map(x=>{const I=x.icon;return <button key={x.title} onClick={()=>setPage(x.page)}><div className="process-op-icon"><I size={18}/></div><div><strong>{x.title}</strong><span>{x.value}</span><p>{x.note}</p></div><ArrowRight size={15}/></button>})}</div></section></div>
    <div className="process-flow-strip"><span>01 Discover</span><b>→</b><span>02 Theme</span><b>→</b><span>03 Pages</span><b>→</b><span>04 Navigation</span><b>→</b><span>05 Catalog</span><b>→</b><span>06 Content</span><b>→</b><span>07 Settings</span><b>→</b><span>08 Publish</span><b>→</b><span>09 Operate</span></div>
  </div>
}

function Stat({title,value,note,icon:Icon}) { return <div className="stat-card"><div className="stat-icon"><Icon size={18}/></div><span>{title}</span><strong>{value}</strong><p>{note}</p></div> }
function Task({done,title,note,action,onClick}) { return <div className="task"><span className={`task-check ${done?'done':''}`}>{done&&<Check size={14}/>}</span><div><strong>{title}</strong><p>{note}</p></div>{action&&<button onClick={onClick}>{action}<ArrowRight size={14}/></button>}</div> }
function SummaryRow({label,value}) { return <div className="summary-row"><span>{label}</span><strong>{value||'—'}</strong></div> }

function Brief({data}) {
  const sections = [
    ['Project overview', [['Business',data.businessName],['Website type',data.websiteType],['Industry',data.industry],['Location',data.location]]],
    ['Business direction', [['Business description',data.businessDescription],['Primary action',data.primaryAction],['Success means',data.success]]],
    ['Audience', [['Ideal customer',data.audience],['Differentiator',data.differentiator]]],
    ['Visual direction', [['Styles',data.styles.join(' + ')],['Personality',data.personalities.join(', ')],['Typography',data.typography],['Inspiration',data.inspiration],['Avoid',data.avoid]]],
    ['Content readiness', [['Assets ready',data.contentReady.join(', ')],['Existing website',data.currentWebsite||'None provided'],['Target launch',data.launchDate||'Not set']]],
    ['Website structure', [['Pages',data.pages.join(', ')],['Features',data.features.join(', ')]]]
  ]
  return <div className="page-wrap brief-page"><div className="page-head"><div><p className="overline">SINGLE SOURCE OF TRUTH</p><h1>Website brief</h1><p>Everything captured during onboarding, organized for the project.</p></div><Button variant="secondary" onClick={()=>window.print()}><Eye size={15}/> Preview / print brief</Button></div><div className="brief-layout"><aside className="brief-index"><span>Contents</span>{sections.map((x,i)=><a key={x[0]} href={`#brief-${i}`}>{String(i+1).padStart(2,'0')} {x[0]}</a>)}</aside><div className="brief-doc"><div className="brief-cover"><span>WEBSITE PROJECT BRIEF</span><h2>{data.businessName}</h2><p>{data.websiteType} · {data.styles.join(' + ')}</p><div className="brief-colors">{[data.primaryColor,data.secondaryColor,data.accentColor].map(c=><i key={c} style={{background:c}}/>)}</div></div>{sections.map((s,i)=><section key={s[0]} id={`brief-${i}`}><p className="overline">{String(i+1).padStart(2,'0')}</p><h3>{s[0]}</h3>{s[1].map(([label,val])=><div className="brief-row" key={label}><span>{label}</span><p>{val||'Not provided'}</p></div>)}</section>)}</div></div></div>
}

function Modal({title,onClose,children}) { return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><h3>{title}</h3><button onClick={onClose}><X size={20}/></button></div>{children}</div></div> }

function OnlineStorePage({pages,setPages,setPage,editor,setEditor}) {
  const [adding,setAdding]=useState(false)
  const [name,setName]=useState('')
  const pageMeta=editor.pageMeta||{}
  const applyTheme=name=>setEditor(prev=>({...prev,theme:{...(themePresets[name]||themePresets.Aurelia)}}))
  const openPage=(p)=>{
    setEditor(prev=>({...prev,currentPage:p,pageContent:{...(prev.pageContent||{}),[p]:prev.pageContent?.[p]||{title:p,body:'',blocks:[]}}}))
    setPage('editor')
  }
  const addPage=()=>{
    const clean=name.trim()
    if(!clean)return
    const next=Array.from(new Set([...(pages||[]),clean]))
    setPages?.(next)
    setEditor(prev=>({...prev,pageContent:{...(prev.pageContent||{}),[clean]:prev.pageContent?.[clean]||{title:clean,body:'',blocks:[]}},pageMeta:{...(prev.pageMeta||{}),[clean]:{visible:true}},currentPage:clean}))
    setName('');setAdding(false);setPage('editor')
  }
  const toggleVisible=p=>setEditor(prev=>({...prev,pageMeta:{...(prev.pageMeta||{}),[p]:{...(prev.pageMeta?.[p]||{}),visible:prev.pageMeta?.[p]?.visible===false?true:false}}}))
  const removePage=p=>{
    if(p==='Home'||!window.confirm(`Delete page "${p}"?`))return
    setPages?.((pages||[]).filter(x=>x!==p))
    setEditor(prev=>{const pc={...(prev.pageContent||{})};const pm={...(prev.pageMeta||{})};delete pc[p];delete pm[p];return {...prev,pageContent:pc,pageMeta:pm,currentPage:prev.currentPage===p?'Home':prev.currentPage}})
  }
  const move=(p,delta)=>{
    const list=[...(pages||[])];const i=list.indexOf(p);const j=i+delta;if(i<0||j<0||j>=list.length)return
    ;[list[i],list[j]]=[list[j],list[i]];setPages?.(list)
  }
  return <div className="page-wrap"><div className="page-head"><div><p className="overline">SALES CHANNEL</p><h1>Online store</h1><p>Manage pages, storefront structure, preview, and publishing.</p></div><div className="page-actions"><Button variant="secondary" onClick={()=>setPage('storefront')}><Eye size={15}/> Preview store</Button><Button onClick={()=>openPage(editor.currentPage||'Home')}><Palette size={15}/> Customize</Button></div></div>
    <div className="online-store-grid"><section className="panel theme-card"><div className="panel-head"><div><span>Theme</span><h3>{editor.theme?.name||'Aurelia'}</h3></div><span className="status active">Editing</span></div><div className="theme-preview"><div><small>LIVE PREVIEW</small><h4>{editor.hero?.heading||'Your storefront'}</h4><span>{editor.hero?.button||'Shop now'}</span></div><div className="theme-products"><i/><i/><i/></div></div><div className="theme-actions"><strong>Theme preset</strong><div><select className="toolbar-select" value={editor.theme?.name||'Aurelia'} onChange={e=>applyTheme(e.target.value)}>{Object.keys(themePresets).map(x=><option key={x}>{x}</option>)}</select><Button variant="secondary" onClick={()=>openPage('Home')}>Customize home</Button></div></div></section><section className="panel store-settings-card"><div className="panel-head"><div><span>Publishing</span><h3>Production controls</h3></div></div><SummaryRow label="Preview" value="Available"/><SummaryRow label="Draft save" value="Automatic"/><SummaryRow label="Public store" value="Publish from Settings"/><Button variant="secondary" onClick={()=>setPage('settings')}>Publishing settings <ArrowRight size={14}/></Button></section></div>
    <div className="page-section-head"><div><span>Website structure</span><h2>Pages</h2></div><Button variant="secondary" onClick={()=>setAdding(true)}><Plus size={15}/> Add page</Button></div>
    <div className="page-list">{(pages||[]).map((p,i)=>{const visible=pageMeta[p]?.visible!==false;return <div className="page-list-row" key={p}><div className="page-icon"><FileText size={18}/></div><div><strong>{p}</strong><span>/{p==='Home'?'':p.toLowerCase().replaceAll(' ','-')}</span></div><button className={`status ${visible?'active':'draft'}`} onClick={()=>toggleVisible(p)}>{visible?'Visible':'Hidden'}</button><small>{i===0?'Homepage':'Page'}</small><div className="row-actions"><button title="Move up" disabled={i===0} onClick={()=>move(p,-1)}>↑</button><button title="Move down" disabled={i===(pages||[]).length-1} onClick={()=>move(p,1)}>↓</button><button title="Edit page" onClick={()=>openPage(p)}><Pencil size={16}/></button>{p!=='Home'&&<button title="Delete page" onClick={()=>removePage(p)}><X size={16}/></button>}</div></div>})}</div>
    {adding&&<Modal title="Add page" onClose={()=>setAdding(false)}><div className="modal-form"><Field label="Page name"><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Contact"/></Field><div className="modal-actions"><Button variant="secondary" onClick={()=>setAdding(false)}>Cancel</Button><Button onClick={addPage}>Add & edit page</Button></div></div></Modal>}
  </div>
}

function ThemePreview({theme,large=false}) {
  const t=theme||themePresets.Aurelia
  return <div className={`theme-showcase theme-showcase-${t.styleKey||'warm'} ${large?'large':''}`} style={{'--tp-paper':t.paper,'--tp-surface':t.surface,'--tp-ink':t.ink,'--tp-accent':t.accent,'--tp-muted':t.muted,'--tp-radius':`${t.radius||0}px`,'--tp-button-radius':`${t.buttonRadius||0}px`,'--tp-font':t.fontFamily,'--tp-display':t.displayFont}}>
    <div className="theme-showcase-header"><b>{t.name}</b><span>Shop&nbsp;&nbsp;Collections&nbsp;&nbsp;About</span><i/></div>
    <div className="theme-showcase-hero"><div><small>{t.previewEyebrow}</small><strong>{t.previewHeading}</strong><p>{t.description}</p><button>Shop the edit</button></div><div className="theme-showcase-art"><span/><b/><i/></div></div>
    <div className="theme-showcase-products"><div><i/><span>Edition 01</span></div><div><i/><span>Edition 02</span></div><div><i/><span>Edition 03</span></div></div>
  </div>
}

function ThemeLibrary({editor,setEditor,setPage}) {
  const current=editor.theme?.name||'Aurelia'
  const currentTheme=themePresets[current]||{...themePresets.Aurelia,...editor.theme}
  const useTheme=name=>setEditor(prev=>({...prev,theme:{...(themePresets[name]||themePresets.Aurelia)}}))
  return <div className="page-wrap">
    <div className="page-head"><div><p className="overline">ONLINE STORE</p><h1>Theme library</h1><p>Original CoBest themes built around modern ecommerce patterns: editorial storytelling, bold campaign layouts, minimalist product grids, and conversion-friendly retail.</p></div><Button onClick={()=>setPage('editor')}>Customize current theme <ArrowRight size={15}/></Button></div>
    <section className="panel current-theme-panel"><div className="panel-head"><div><span>Current theme</span><h3>{current}</h3></div><span className="status active">Draft</span></div><ThemePreview theme={currentTheme} large/></section>
    <div className="page-section-head"><div><span>CoBest themes</span><h2>Choose a design direction</h2></div></div>
    <div className="theme-library-grid">{Object.entries(themePresets).map(([name,t])=><article className={'theme-library-card '+(current===name?'selected':'')} key={name}>
      <ThemePreview theme={t}/>
      <div className="theme-library-meta"><div><strong>{name}</strong><span>{t.category}</span><small>{t.fit}</small></div>{current===name?<span className="status active">Current</span>:<Button variant="secondary" onClick={()=>useTheme(name)}>Use theme</Button>}</div>
    </article>)}</div>
  </div>
}
function NavigationManager({pages=[],editor,setEditor}) {
  const [menuType,setMenuType]=useState('main')
  const [selectedPage,setSelectedPage]=useState((pages||[]).find(x=>x!=='Home')||'')
  const main=editor.header?.menu||[]
  const footer=editor.footer?.menu||[]
  const list=menuType==='main'?main:footer
  const setList=next=>setEditor(prev=>menuType==='main'?({...prev,header:{...(prev.header||{}),menu:next}}):({...prev,footer:{...(prev.footer||{}),menu:next}}))
  const add=()=>{if(!selectedPage||list.includes(selectedPage))return;setList([...list,selectedPage])}
  const remove=item=>setList(list.filter(x=>x!==item))
  const move=(item,delta)=>{const next=[...list];const i=next.indexOf(item);const j=i+delta;if(i<0||j<0||j>=next.length)return;const temp=next[i];next[i]=next[j];next[j]=temp;setList(next)}
  return <div className="page-wrap">
    <div className="page-head"><div><p className="overline">ONLINE STORE</p><h1>Navigation</h1><p>Control the order customers move through your store. Menus are built from your existing pages.</p></div></div>
    <div className="settings-columns"><section className="panel"><div className="panel-head"><div><span>Menus</span><h3>Choose menu</h3></div></div><div className="nav-menu-tabs"><button className={menuType==='main'?'active':''} onClick={()=>setMenuType('main')}>Main menu <b>{main.length}</b></button><button className={menuType==='footer'?'active':''} onClick={()=>setMenuType('footer')}>Footer menu <b>{footer.length}</b></button></div><div className="nav-add-row"><select value={selectedPage} onChange={e=>setSelectedPage(e.target.value)}><option value="">Select a page</option>{pages.filter(p=>p!=='Home').map(p=><option key={p}>{p}</option>)}</select><Button onClick={add} disabled={!selectedPage||list.includes(selectedPage)}><Plus size={15}/> Add</Button></div><p className="field-help">Create missing pages first in Online store → Overview & pages.</p></section>
    <section className="panel"><div className="panel-head"><div><span>{menuType==='main'?'Main menu':'Footer menu'}</span><h3>Menu order</h3></div></div><div className="navigation-list">{list.map((item,i)=><div key={item}><span className="drag-dots">⠿</span><strong>{item}</strong><small>{'/'+item.toLowerCase().replaceAll(' ','-')}</small><div className="row-actions"><button disabled={i===0} onClick={()=>move(item,-1)}>↑</button><button disabled={i===list.length-1} onClick={()=>move(item,1)}>↓</button><button onClick={()=>remove(item)}><X size={15}/></button></div></div>)}{!list.length&&<div className="empty-panel"><Menu size={22}/><strong>No menu items yet</strong><p>Add pages to this menu.</p></div>}</div></section></div>
  </div>
}

function Editor({data,pages=[],products,media=[],editor,setEditor,onPreview}) {
  const currentPage=editor.currentPage||'Home'
  const [dragId,setDragId]=useState(null)
  const historyRef=useRef([])
  const futureRef=useRef([])
  const lastRef=useRef(JSON.stringify(editor))
  const skipHistoryRef=useRef(false)
  useEffect(()=>{
    const serialized=JSON.stringify(editor)
    if(skipHistoryRef.current){skipHistoryRef.current=false;lastRef.current=serialized;return}
    if(serialized!==lastRef.current){
      try{historyRef.current.push(JSON.parse(lastRef.current));if(historyRef.current.length>50)historyRef.current.shift()}catch{}
      futureRef.current=[]
      lastRef.current=serialized
    }
  },[editor])
  const undo=()=>{if(!historyRef.current.length)return;const previous=historyRef.current.pop();futureRef.current.push(JSON.parse(JSON.stringify(editor)));skipHistoryRef.current=true;setEditor(previous)}
  const redo=()=>{if(!futureRef.current.length)return;const next=futureRef.current.pop();historyRef.current.push(JSON.parse(JSON.stringify(editor)));skipHistoryRef.current=true;setEditor(next)}
  const save=()=>{
    try{localStorage.setItem('cobest-v4-editor',JSON.stringify(editor))}catch{}
    if(isAuthenticated()) saveWorkspace({onboarding:data,editor,settings:{}}).catch(()=>{})
    alert('Website changes saved.')
  }
  const changePage=p=>setEditor(prev=>({...prev,currentPage:p,selected:p==='Home'?'hero':'page-intro',pageContent:{...(prev.pageContent||{}),[p]:prev.pageContent?.[p]||{title:p,body:'',blocks:[]}}}))

  if(currentPage!=='Home'){
    const pageData=editor.pageContent?.[currentPage]||{title:currentPage,body:'',blocks:[]}
    const meta=editor.pageMeta?.[currentPage]||{visible:true,seo_title:'',seo_description:''}
    const selected=(pageData.blocks||[]).find(b=>b.id===editor.selected)
    const updatePage=(key,value)=>setEditor(prev=>({...prev,pageContent:{...(prev.pageContent||{}),[currentPage]:{...(prev.pageContent?.[currentPage]||pageData),[key]:value}}}))
    const updateMeta=(key,value)=>setEditor(prev=>({...prev,pageMeta:{...(prev.pageMeta||{}),[currentPage]:{...(prev.pageMeta?.[currentPage]||{}),[key]:value}}}))
    const add=()=>{const id=`page-block-${Date.now()}`;const b={id,type:'text',title:'New section',body:'Add page content here.',background:'#ffffff',text:'#171717',padding:48,margin:0,columns:1,columnTemplate:'1fr',gap:20,maxWidth:1180,fontSize:16,borderWidth:0,borderColor:'#dddddd',radius:0,imageUrl:'',items:''};updatePage('blocks',[...(pageData.blocks||[]),b]);setEditor(prev=>({...prev,selected:id}))}
    const updateBlock=(key,value)=>updatePage('blocks',(pageData.blocks||[]).map(b=>b.id===editor.selected?{...b,[key]:value}:b))
    const remove=()=>{updatePage('blocks',(pageData.blocks||[]).filter(b=>b.id!==editor.selected));setEditor(prev=>({...prev,selected:'page-intro'}))}
    const reorder=(from,to)=>{const list=[...(pageData.blocks||[])];const i=list.findIndex(x=>x.id===from),j=list.findIndex(x=>x.id===to);if(i<0||j<0||i===j)return;const [m]=list.splice(i,1);list.splice(j,0,m);updatePage('blocks',list)}
    return <div className="editor-screen"><div className="editor-top"><div><Logo/><span className="editor-divider"/><select className="editor-page-select" value={currentPage} onChange={e=>changePage(e.target.value)}>{pages.map(p=><option key={p}>{p}</option>)}</select></div><div className="device-toggle">{[['desktop',Monitor],['tablet',Tablet],['mobile',Smartphone]].map(([id,I])=><button key={id} className={editor.device===id?'active':''} onClick={()=>setEditor({...editor,device:id})}><I size={16}/></button>)}</div><div className="editor-actions"><Button variant="ghost" onClick={undo}>Undo</Button><Button variant="ghost" onClick={redo}>Redo</Button><Button variant="ghost" onClick={onPreview}><Eye size={15}/> Preview</Button><Button onClick={save}>Save</Button></div></div><div className="editor-body"><aside className="section-panel"><div className="panel-title"><span>{currentPage} sections</span><button onClick={add}><Plus size={16}/></button></div><button className={`section-item ${editor.selected==='page-intro'?'active':''}`} onClick={()=>setEditor({...editor,selected:'page-intro'})}><div className="section-thumb"><FileText size={14}/></div><strong>Page intro</strong></button>{(pageData.blocks||[]).map(b=><button draggable key={b.id} onDragStart={()=>setDragId(b.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>{reorder(dragId,b.id);setDragId(null)}} className={`section-item ${editor.selected===b.id?'active':''}`} onClick={()=>setEditor({...editor,selected:b.id})}><span className="drag-dots">⠿</span><div className="section-thumb"><LayoutDashboard size={14}/></div><strong>{b.title||'Section'}</strong></button>)}<button className="add-section" onClick={add}><Plus size={15}/> Add section</button></aside><main className="canvas-area"><div className={`store-canvas device-${editor.device}`}><div className="subpage-preview" style={{'--brand':data.primaryColor,'--paper':data.secondaryColor}}><header><strong>{editor.header?.logoText||data.businessName||'Your Store'}</strong></header><section className="subpage-hero"><small>{currentPage.toUpperCase()}</small><h1>{pageData.title||currentPage}</h1><p>{pageData.body||'Add page content using the settings panel.'}</p></section>{(pageData.blocks||[]).map(b=><EditorBlock key={b.id} block={b}/>)}</div></div></main><aside className="settings-panel"><div className="settings-head"><span>Page settings</span><strong>{editor.selected==='page-intro'?'Page intro':selected?.title||'Section'}</strong></div>{editor.selected==='page-intro'&&<div className="settings-form"><Field label="Page title"><input value={pageData.title||''} onChange={e=>updatePage('title',e.target.value)}/></Field><Field label="Intro/body"><textarea rows="6" value={pageData.body||''} onChange={e=>updatePage('body',e.target.value)}/></Field><label className="check-row"><input type="checkbox" checked={meta.visible!==false} onChange={e=>updateMeta('visible',e.target.checked)}/> Visible on published store</label><Field label="SEO title"><input value={meta.seo_title||''} onChange={e=>updateMeta('seo_title',e.target.value)}/></Field><Field label="SEO description"><textarea rows="4" value={meta.seo_description||''} onChange={e=>updateMeta('seo_description',e.target.value)}/></Field></div>}{selected&&<BlockSettings block={selected} update={updateBlock} remove={remove} media={media}/>}</aside></div></div>
  }

  const fixed=[['header','Header'],['hero','Hero'],['featured','Featured products'],['story','Brand story'],['newsletter','Newsletter'],['footer','Footer']]
  const customs=(editor.blocks||[]).map(b=>[b.id,b.title||'Content block'])
  const mainIds=[...new Set([...(editor.sectionOrder||['hero','featured','story','newsletter']),...customs.map(x=>x[0])])].filter(id=>['hero','featured','story','newsletter'].includes(id)||(editor.blocks||[]).some(b=>b.id===id))
  const labels=new Map([...fixed,...customs])
  const sections=[['header','Header'],...mainIds.map(id=>[id,labels.get(id)||'Content block']),['footer','Footer']]
  const update=(section,key,value)=>setEditor(prev=>({...prev,[section]:{...prev[section],[key]:value}}))
  const selectedBlock=(editor.blocks||[]).find(b=>b.id===editor.selected)
  const updateBlock=(key,value)=>setEditor(prev=>({...prev,blocks:(prev.blocks||[]).map(b=>b.id===prev.selected?{...b,[key]:value}:b)}))
  const addBlock=()=>{const id=`block-${Date.now()}`;const block={id,type:'text',title:'New content block',body:'Add your content here.',background:'#ffffff',text:'#171717',padding:48,margin:0,columns:1,columnTemplate:'1fr',gap:20,maxWidth:1180,fontSize:16,borderWidth:0,borderColor:'#dddddd',radius:0,imageUrl:'',items:'Item one, Item two, Item three'};setEditor(prev=>({...prev,blocks:[...(prev.blocks||[]),block],sectionOrder:[...(prev.sectionOrder||['hero','featured','story','newsletter']).filter(x=>x!=='newsletter'),id,'newsletter'],selected:id}))}
  const removeBlock=()=>{if(!selectedBlock)return;setEditor(prev=>({...prev,blocks:(prev.blocks||[]).filter(b=>b.id!==selectedBlock.id),sectionOrder:(prev.sectionOrder||[]).filter(x=>x!==selectedBlock.id),selected:'hero'}))}
  const reorder=(from,to)=>setEditor(prev=>{const order=[...(prev.sectionOrder||[])];const i=order.indexOf(from),j=order.indexOf(to);if(i<0||j<0||i===j)return prev;const [m]=order.splice(i,1);order.splice(j,0,m);return {...prev,sectionOrder:order}})
  return <div className="editor-screen"><div className="editor-top"><div><Logo/><span className="editor-divider"/><select className="editor-page-select" value="Home" onChange={e=>changePage(e.target.value)}>{pages.map(p=><option key={p}>{p}</option>)}</select></div><div className="device-toggle">{[['desktop',Monitor],['tablet',Tablet],['mobile',Smartphone]].map(([id,I])=><button key={id} className={editor.device===id?'active':''} onClick={()=>setEditor({...editor,device:id})}><I size={16}/></button>)}</div><div className="editor-actions"><Button variant="ghost" onClick={undo}>Undo</Button><Button variant="ghost" onClick={redo}>Redo</Button><Button variant="ghost" onClick={onPreview}><Eye size={15}/> Live preview</Button><Button onClick={save}>Save</Button></div></div><div className="editor-body"><aside className="section-panel"><div className="panel-title"><span>Home sections</span><button onClick={addBlock}><Plus size={16}/></button></div>{sections.map(([id,label],i)=>{const draggable=!['header','footer'].includes(id);return <button draggable={draggable} key={id} onDragStart={()=>draggable&&setDragId(id)} onDragOver={e=>draggable&&e.preventDefault()} onDrop={()=>{if(draggable){reorder(dragId,id);setDragId(null)}}} className={`section-item ${editor.selected===id?'active':''}`} onClick={()=>setEditor({...editor,selected:id})}>{draggable&&<span className="drag-dots">⠿</span>}<div className="section-thumb">{id.startsWith('block-')?<Plus size={14}/>:i<2?<ImageIcon size={14}/>:<LayoutDashboard size={14}/>}</div><strong>{label}</strong></button>})}<button className="add-section" onClick={addBlock}><Plus size={15}/> Add content block</button></aside><main className="canvas-area"><div className={`store-canvas device-${editor.device}`}><StorefrontMini data={data} products={products} editor={editor}/></div></main><aside className="settings-panel"><div className="settings-head"><span>Section settings</span><strong>{sections.find(s=>s[0]===editor.selected)?.[1]||'Section'}</strong></div>{editor.selected==='header'&&<div className="settings-form"><Field label="Store/logo text"><input value={editor.header?.logoText||''} onChange={e=>update('header','logoText',e.target.value)} placeholder={data.businessName||'Store name'}/></Field><Field label="Menu items (comma separated)"><input value={(editor.header?.menu||[]).join(', ')} onChange={e=>update('header','menu',e.target.value.split(',').map(x=>x.trim()).filter(Boolean))}/></Field></div>}{editor.selected==='hero'&&<div className="settings-form"><Field label="Eyebrow"><input value={editor.hero.eyebrow} onChange={e=>update('hero','eyebrow',e.target.value)}/></Field><Field label="Heading"><textarea rows="3" value={editor.hero.heading} onChange={e=>update('hero','heading',e.target.value)}/></Field><Field label="Body"><textarea rows="4" value={editor.hero.body} onChange={e=>update('hero','body',e.target.value)}/></Field><Field label="Button label"><input value={editor.hero.button} onChange={e=>update('hero','button',e.target.value)}/></Field><Field label="Alignment"><div className="segment"><button className={editor.hero.align==='left'?'active':''} onClick={()=>update('hero','align','left')}>Left</button><button className={editor.hero.align==='center'?'active':''} onClick={()=>update('hero','align','center')}>Center</button></div></Field></div>}{editor.selected==='featured'&&<div className="settings-form"><Field label="Section heading"><input value={editor.featured.title} onChange={e=>update('featured','title',e.target.value)}/></Field><Field label="Columns"><div className="segment">{[2,3,4].map(n=><button key={n} className={editor.featured.columns===n?'active':''} onClick={()=>update('featured','columns',n)}>{n}</button>)}</div></Field></div>}{editor.selected==='story'&&<div className="settings-form"><Field label="Heading"><input value={editor.story.title} onChange={e=>update('story','title',e.target.value)}/></Field><Field label="Body"><textarea rows="5" value={editor.story.body} onChange={e=>update('story','body',e.target.value)}/></Field></div>}{editor.selected==='newsletter'&&<div className="settings-form"><Field label="Heading"><input value={editor.newsletter?.heading||''} onChange={e=>update('newsletter','heading',e.target.value)}/></Field><Field label="Body"><textarea rows="4" value={editor.newsletter?.body||''} onChange={e=>update('newsletter','body',e.target.value)}/></Field><Field label="Button"><input value={editor.newsletter?.button||'Join'} onChange={e=>update('newsletter','button',e.target.value)}/></Field></div>}{editor.selected==='footer'&&<div className="settings-form"><Field label="Footer text"><input value={editor.footer?.text||''} onChange={e=>update('footer','text',e.target.value)}/></Field><p className="field-help">Footer links are managed in Online store → Navigation.</p></div>}{selectedBlock&&<BlockSettings block={selectedBlock} update={updateBlock} remove={removeBlock} media={media}/>}<div className="settings-form precision-controls"><span className="overline">GLOBAL STYLE</span><Field label={`Section gap: ${editor.theme?.sectionGap||32}px`}><input type="range" min="0" max="96" value={editor.theme?.sectionGap||32} onChange={e=>setEditor(prev=>({...prev,theme:{...(prev.theme||{}),sectionGap:Number(e.target.value)}}))}/></Field><Field label={`Card radius: ${editor.theme?.radius||0}px`}><input type="range" min="0" max="40" value={editor.theme?.radius||0} onChange={e=>setEditor(prev=>({...prev,theme:{...(prev.theme||{}),radius:Number(e.target.value)}}))}/></Field></div><div className="project-context"><span>PROJECT CONTEXT</span><strong>{data.goals[0]||'Website goal'}</strong><p>{data.primaryAction}</p><div><b>Direction</b><em>{data.styles.join(' + ')}</em></div><div><b>Audience</b><em>{data.audience}</em></div></div></aside></div></div>
}

function BlockSettings({block,update,remove,media=[]}){
  const cols=Number(block.columns||1)
  const templates=cols===1?['1fr']:cols===2?['1fr 1fr','2fr 1fr','1fr 2fr']:cols===3?['1fr 1fr 1fr','2fr 1fr 1fr','1fr 2fr 1fr','1fr 1fr 2fr']:['1fr 1fr 1fr 1fr','2fr 1fr 1fr 1fr','1fr 1fr 1fr 2fr']
  return <div className="settings-form"><Field label="Block type"><select value={block.type} onChange={e=>update('type',e.target.value)}><option value="text">Text</option><option value="image">Image</option><option value="list">List</option><option value="menu">Menu</option></select></Field><Field label="Title"><input value={block.title||''} onChange={e=>update('title',e.target.value)}/></Field><Field label="Body"><textarea rows="4" value={block.body||''} onChange={e=>update('body',e.target.value)}/></Field>{block.type==='image'&&<><Field label="Media library"><select value={block.imageUrl||''} onChange={e=>update('imageUrl',e.target.value)}><option value="">Choose an uploaded image</option>{media.filter(x=>String(x.mime_type||'').startsWith('image')).map(x=><option key={x.id} value={x.url}>{x.name}</option>)}</select></Field><Field label="Or image URL"><input value={block.imageUrl||''} onChange={e=>update('imageUrl',e.target.value)} placeholder="https://..."/></Field></>}{['list','menu'].includes(block.type)&&<Field label="Items (comma separated)"><textarea rows="3" value={block.items||''} onChange={e=>update('items',e.target.value)}/></Field>}<Field label="Columns / sectors"><div className="segment">{[1,2,3,4].map(n=><button key={n} className={cols===n?'active':''} onClick={()=>{update('columns',n);update('columnTemplate',Array(n).fill('1fr').join(' '))}}>{n}</button>)}</div></Field><Field label="Sector widths"><select value={block.columnTemplate||Array(cols).fill('1fr').join(' ')} onChange={e=>update('columnTemplate',e.target.value)}>{templates.map(x=><option key={x} value={x}>{x.replaceAll('fr',' parts')}</option>)}</select></Field><div className="form-grid two"><Field label="Background"><input type="color" value={block.background||'#ffffff'} onChange={e=>update('background',e.target.value)}/></Field><Field label="Text"><input type="color" value={block.text||'#171717'} onChange={e=>update('text',e.target.value)}/></Field></div><div className="form-grid two"><Field label="Border color"><input type="color" value={block.borderColor||'#dddddd'} onChange={e=>update('borderColor',e.target.value)}/></Field><Field label={`Border: ${block.borderWidth||0}px`}><input type="range" min="0" max="12" value={block.borderWidth||0} onChange={e=>update('borderWidth',Number(e.target.value))}/></Field></div><Field label={`Padding: ${block.padding??48}px`}><input type="range" min="0" max="160" value={block.padding??48} onChange={e=>update('padding',Number(e.target.value))}/></Field><Field label={`Outside margin: ${block.margin||0}px`}><input type="range" min="0" max="96" value={block.margin||0} onChange={e=>update('margin',Number(e.target.value))}/></Field><Field label={`Column gap: ${block.gap??20}px`}><input type="range" min="0" max="80" value={block.gap??20} onChange={e=>update('gap',Number(e.target.value))}/></Field><Field label={`Max content width: ${block.maxWidth||1180}px`}><input type="range" min="480" max="1600" step="20" value={block.maxWidth||1180} onChange={e=>update('maxWidth',Number(e.target.value))}/></Field><Field label={`Body font: ${block.fontSize||16}px`}><input type="range" min="10" max="32" value={block.fontSize||16} onChange={e=>update('fontSize',Number(e.target.value))}/></Field><Field label={`Corner radius: ${block.radius||0}px`}><input type="range" min="0" max="60" value={block.radius||0} onChange={e=>update('radius',Number(e.target.value))}/></Field><Button variant="secondary" onClick={remove}>Remove block</Button></div>
}

function EditorBlock({block}){
  const items=String(block.items||'').split(',').map(x=>x.trim()).filter(Boolean)
  const columns=Number(block.columns||1)
  return <section className="sf-custom-block" style={{background:block.background||'#fff',color:block.text||'#171717',padding:`${block.padding??48}px`,margin:`${block.margin||0}px`,border:`${block.borderWidth||0}px solid ${block.borderColor||'#dddddd'}`,borderRadius:`${block.radius??0}px`,fontSize:`${block.fontSize||16}px`}}><div className="sf-custom-inner" style={{display:'grid',gridTemplateColumns:block.columnTemplate||`repeat(${columns}, minmax(0, 1fr))`,gap:`${block.gap??20}px`,maxWidth:`${block.maxWidth||1180}px`}}>{Array.from({length:columns}).map((_,idx)=><div key={idx}>{block.type==='image'&&block.imageUrl?<img src={block.imageUrl} alt={block.title||'Content image'}/>:null}<h2>{block.title}</h2>{block.type==='text'&&<p>{block.body}</p>}{['list','menu'].includes(block.type)&&<ul>{items.map(item=><li key={item}>{item}</li>)}</ul>}{block.type==='image'&&block.body&&<p>{block.body}</p>}</div>)}</div></section>
}

function StorefrontMini({data,products,editor,full=false,onAdd,cartCount=0,onNavigate}) {
  const visible = products.filter(x=>x.status==='Active')
  const blocks=editor.blocks||[]
  const theme=editor.theme||{}
  const map=new Map(blocks.map(b=>[b.id,b]))
  const order=[...new Set([...(editor.sectionOrder||['hero','featured','story','newsletter']),...blocks.map(b=>b.id)])]
  const section=id=>{
    if(id==='hero') return <section key={id} className={`sf-hero align-${editor.hero.align}`}><div><small>{editor.hero.eyebrow}</small><h1>{editor.hero.heading}</h1><p>{editor.hero.body}</p><button onClick={full?()=>onNavigate?.('Shop'):undefined}>{editor.hero.button}</button></div><div className="sf-hero-art"><div className="art-object"><i/><b/></div></div></section>
    if(id==='featured') return <section key={id} className="sf-products"><div className="sf-section-head"><h2>{editor.featured.title}</h2><span>{visible.length} products</span></div><div className={`sf-product-grid columns-${editor.featured.columns}`}>{visible.map((p,i)=><article key={p.id}><div className={`sf-product-image product-art-${(i%4)+1}`}>{p.image_url?<img src={p.image_url} alt={p.name}/>:<div/>}</div><h3>{p.name}</h3><p>{formatPrice(p.price)}</p>{full&&<button className="sf-add-cart" onClick={()=>onAdd?.(p)}>Add to cart</button>}</article>)}</div>{!visible.length&&<div className="empty-panel"><Package size={22}/><strong>No active products</strong><p>Activate a product in Catalog to show it in the storefront.</p></div>}</section>
    if(id==='story') return <section key={id} className="sf-story"><small>OUR APPROACH</small><h2>{editor.story.title}</h2><p>{editor.story.body}</p></section>
    if(id==='newsletter') return <section key={id} className="sf-newsletter"><h2>{editor.newsletter?.heading||'Stay in the loop.'}</h2><p>{editor.newsletter?.body||'New products, stories, and updates.'}</p><div><span>Email address</span><button>{editor.newsletter?.button||'Join'}</button></div></section>
    const block=map.get(id);return block?<EditorBlock key={id} block={block}/>:null
  }
  return <div className={`storefront theme-${theme.styleKey||'warm'} ${full?'full-storefront':''}`} style={{'--brand':theme.ink||data.primaryColor,'--paper':theme.paper||data.secondaryColor,'--accent':theme.accent||data.accentColor,'--surface':theme.surface||'#fbfaf7','--muted':theme.muted||'#ded8cf','--section-gap':`${theme.sectionGap||32}px`,'--card-radius':`${theme.radius||0}px`,'--button-radius':`${theme.buttonRadius||0}px`,'--display-font':theme.displayFont||"'Playfair Display', Georgia, serif",fontFamily:theme.fontFamily||'Arial, Helvetica, sans-serif'}}><header><div className="store-logo">{editor.header?.logoText||data.businessName||'Your Store'}</div><nav>{(editor.header?.menu||['Shop','About','Contact']).map(item=><button key={item} onClick={full?()=>onNavigate?.(item):undefined}>{item}</button>)}</nav><div><Search size={15}/><span className="store-cart-indicator"><ShoppingBag size={16}/>{full&&cartCount>0&&<b>{cartCount}</b>}</span></div></header>{order.map(section)}<footer><strong>{data.businessName||'Your Store'}</strong><span>{editor.footer?.text||'Built with CoBest'}</span>{(editor.footer?.menu||[]).length>0&&<nav className="store-footer-menu">{(editor.footer?.menu||[]).map(item=><button key={item} onClick={full?()=>onNavigate?.(item):undefined}>{item}</button>)}</nav>}<small>© 2026 {data.businessName||'Your Store'}</small></footer></div>
}

function StorefrontPage({data,products,editor,onCreateCustomer,onCreateOrder}) {
  const [cart,setCart]=useState([])
  const [checkout,setCheckout]=useState(false)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState(()=>sessionStorage.getItem('cobest-auth-message')||'')
  const [error,setError]=useState(()=>sessionStorage.getItem('cobest-auth-error')||'')
  const [buyer,setBuyer]=useState({name:'',email:'',phone:''})
  const add=(p)=>setCart(prev=>[...prev,p])
  const total=cart.reduce((sum,p)=>sum+Number(p.price||0),0)
  const placeOrder=async()=>{
    if(!buyer.name||!buyer.email||!cart.length)return
    setBusy(true);setError('');setMessage('')
    try{
      const customer=await onCreateCustomer?.({...buyer,notes:'Created from storefront checkout test'})
      const order=await onCreateOrder?.({customer_id:customer?.id||null,order_number:`CO-${Date.now().toString().slice(-6)}`,total,payment_status:'Pending',fulfillment_status:'Unfulfilled',notes:`Storefront checkout test: ${cart.map(x=>x.name).join(', ')}`})
      if(order){setMessage(`Order ${order.order_number||'#'+order.id} created. Payment is pending until a payment provider is connected.`);setCart([]);setBuyer({name:'',email:'',phone:''});setCheckout(false)}
    }catch(err){setError(err.message)}finally{setBusy(false)}
  }
  return <div className="store-preview-page"><div className="store-preview-toolbar"><div><strong>Storefront preview</strong><span>{cart.length} item{cart.length===1?'':'s'} · {formatPrice(total)}</span></div><Button variant="secondary" disabled={!cart.length} onClick={()=>setCheckout(true)}>Checkout</Button></div>{message&&<div className="store-preview-message">{message}</div>}{error&&<div className="store-preview-message error">{error}</div>}<StorefrontMini data={data} products={products} editor={editor} full onAdd={add} cartCount={cart.length}/>{checkout&&<Modal title="Checkout test" onClose={()=>setCheckout(false)}><div className="modal-form"><p>This creates a real customer and order in your CoBest database. Payment stays Pending until Stripe/PayPal is connected.</p><Field label="Customer name"><input value={buyer.name} onChange={e=>setBuyer({...buyer,name:e.target.value})}/></Field><Field label="Email"><input type="email" value={buyer.email} onChange={e=>setBuyer({...buyer,email:e.target.value})}/></Field><Field label="Phone"><input value={buyer.phone} onChange={e=>setBuyer({...buyer,phone:e.target.value})}/></Field><SummaryRow label="Items" value={String(cart.length)}/><SummaryRow label="Total" value={formatPrice(total)}/><div className="modal-actions"><Button variant="secondary" onClick={()=>setCheckout(false)}>Cancel</Button><Button disabled={busy||!buyer.name||!buyer.email} onClick={placeOrder}>{busy?'Creating…':'Place test order'}</Button></div></div></Modal>}</div>
}

function ResetRequest({onBack}) {
  const [email,setEmail]=useState('')
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState(()=>sessionStorage.getItem('cobest-reset-message')||'')
  const [error,setError]=useState(()=>sessionStorage.getItem('cobest-reset-error')||'')
  useEffect(()=>{sessionStorage.removeItem('cobest-reset-message');sessionStorage.removeItem('cobest-reset-error')},[])
  const submit=async e=>{
    e.preventDefault()
    const clean=email.trim().toLowerCase()
    if(!clean)return setError('Enter your email address.')
    setBusy(true);setError('');setMessage('')
    try{
      await resetPassword(clean)
      setMessage('Reset email sent. Open the newest CoBest reset email. The reset button should return you to cobest.me/reset-password.')
    }catch(err){
      const raw=String(err.message||'')
      if(raw.toLowerCase().includes('rate limit')||raw.toLowerCase().includes('too many')) {
        setError('Too many reset emails were requested. Email sending is temporarily limited. Please wait before requesting another reset link, then use only the newest email.')
      } else setError(raw)
    }finally{setBusy(false)}
  }
  return <div className="auth-page"><div className="auth-top"><button onClick={onBack}><ArrowLeft size={16}/> Back to login</button><Logo/></div><form className="auth-card" onSubmit={submit}><p className="overline">ACCOUNT RECOVERY</p><h1>Reset your password</h1><p>Enter your account email and CoBest will send a password-reset link back to this website.</p>{error&&<div className="auth-message auth-error">{error}</div>}{message&&<div className="auth-message auth-success">{message}</div>}<Field label="Email address"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@business.com" autoComplete="email" required/></Field><Button type="submit" disabled={busy}>{busy?'Sending…':'Send reset link'}</Button><div className="auth-divider"><span>Remembered your password?</span></div><Button type="button" variant="secondary" onClick={onBack}>Back to log in</Button></form></div>
}

function Recovery({onDone}) {
  const [password,setPassword]=useState('')
  const [confirm,setConfirm]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  const submit=async e=>{
    e.preventDefault();setError('');setMessage('')
    if(password.length<8)return setError('Password must be at least 8 characters.')
    if(password!==confirm)return setError('Passwords do not match.')
    setBusy(true)
    try{await updatePassword(password);setMessage('Password updated. You can now log in with the new password.');setTimeout(onDone,900)}
    catch(err){setError(err.message)}finally{setBusy(false)}
  }
  return <div className="auth-page"><div className="auth-top"><button onClick={onDone}><ArrowLeft size={16}/> Back</button><Logo/></div><form className="auth-card" onSubmit={submit}><p className="overline">ACCOUNT RECOVERY</p><h1>Set a new password</h1><p>Choose a new password for your CoBest account.</p>{error&&<div className="auth-message auth-error">{error}</div>}{message&&<div className="auth-message auth-success">{message}</div>}<Field label="New password"><input type="password" minLength="8" value={password} onChange={e=>setPassword(e.target.value)} required/></Field><Field label="Confirm password"><input type="password" minLength="8" value={confirm} onChange={e=>setConfirm(e.target.value)} required/></Field><Button type="submit" disabled={busy}>{busy?'Updating…':'Update password'}</Button></form></div>
}

function Auth({variant='login',onSuccess,onBack,onSwitch,onForgot}) {
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [showPassword,setShowPassword]=useState(false)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')
  const signup=variant==='signup'
  useEffect(()=>{sessionStorage.removeItem('cobest-auth-message');sessionStorage.removeItem('cobest-auth-error')},[])
  const submit=async(e)=>{
    e.preventDefault()
    setBusy(true); setError(''); setMessage('')
    try {
      const cleanEmail=email.trim().toLowerCase()
      const result=signup ? await signUp(cleanEmail,password) : await signIn(cleanEmail,password)
      if(signup && !result?.access_token) {
        setMessage('Check your email to continue. If this email is already registered, use Log in or Forgot password instead.')
      } else {
        onSuccess(signup ? 'onboarding' : 'app')
      }
    } catch(err) {
      const raw=String(err.message||'')
      if(!signup&&raw.toLowerCase().includes('invalid login credentials')) setError('Email or password is incorrect. If this account already exists, use Forgot password to set a new password.')
      else if(signup&&raw.toLowerCase().includes('already')) setError('This email already has an account. Use Log in or Forgot password.')
      else if(raw.toLowerCase().includes('rate limit')||raw.toLowerCase().includes('too many')) setError('Too many account emails were requested. Please wait before trying again.')
      else setError(raw)
    }
    finally { setBusy(false) }
  }

  return <div className="auth-page"><div className="auth-top"><button onClick={onBack}><ArrowLeft size={16}/> Back</button><Logo/></div><form className="auth-card" onSubmit={submit}><p className="overline">{signup?'CREATE YOUR ACCOUNT':'WELCOME BACK'}</p><h1>{signup?'Start with CoBest':'Log in to CoBest'}</h1><p>{signup?'Create an account, then build your business brief and storefront.':'Manage your website, products, customers, and store.'}</p>{error&&<div className="auth-message auth-error">{error}</div>}{message&&<div className="auth-message auth-success">{message}</div>}<Field label="Email address"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@business.com" required/></Field><Field label="Password"><div className="password-input-wrap"><input type={showPassword?'text':'password'} minLength="8" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimum 8 characters" autoComplete={signup?'new-password':'current-password'} required/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?'Hide':'Show'}</button></div></Field><Button type="submit" disabled={busy}>{busy?'Please wait…':signup?'Create account':'Log in'}</Button>{!signup&&<div className="auth-recovery-row"><button type="button" className="auth-link" onClick={onForgot}>Forgot password?</button><span>Reset your password securely on cobest.me.</span></div>}<div className="auth-divider"><span>{signup?'Already have an account?':'New to CoBest?'}</span></div><Button type="button" variant="secondary" onClick={onSwitch}>{signup?'Log in':'Create an account'}</Button></form></div>
}

export default function App() {
  const [mode,setMode] = useStoredState('cobest-v4-mode','landing')
  const [onboarding,setOnboarding] = useStoredState('cobest-v4-onboarding',defaultOnboarding)
  const [products,setProducts] = useStoredState('cobest-v4-products',defaultProducts)
  const [editor,setEditor] = useStoredState('cobest-v4-editor',defaultEditor)
  const [customers,setCustomers] = useState([])
  const [orders,setOrders] = useState([])
  const [mediaAssets,setMediaAssets] = useState([])
  const [discounts,setDiscounts] = useState([])
  const [campaigns,setCampaigns] = useState([])
  const [collections,setCollections] = useState([])
  const [blogPosts,setBlogPosts] = useState([])
  const [catalogTerms,setCatalogTerms] = useState([])
  const [workspace,setWorkspace] = useState(null)
  const [sites,setSites] = useState([])
  const [subscribers,setSubscribers] = useState([])
  const [contacts,setContacts] = useState([])
  const [bookings,setBookings] = useState([])
  const [reviews,setReviews] = useState([])
  const [events,setEvents] = useState([])
  const [page,setPage] = useState('dashboard')
  const [cloudReady,setCloudReady] = useState(false)
  const safeOnboarding = normalizeOnboarding(onboarding)
  const safeEditor = normalizeEditor(editor)

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search)
    const queryMode=params.get('mode')
    const invite=params.get('invite')
    const isResetPath=window.location.pathname==='/reset-password'
    const hashParams=new URLSearchParams(window.location.hash.slice(1))
    const hasAuthHash=Boolean(hashParams.get('access_token')||hashParams.get('error')||hashParams.get('error_code')||hashParams.get('type')==='recovery')
    if(isResetPath||queryMode==='recovery'||hasAuthHash){
      if(hasAuthHash){
        const result=acceptSessionFromHash()
        if(result?.ok){
          setMode('recovery')
        }else{
          const msg=result?.message||'This password reset link is invalid or has expired.'
          sessionStorage.setItem('cobest-reset-error',msg+' Request a new reset email below and use the newest link.')
          setMode('reset-request')
          window.history.replaceState({},document.title,'/reset-password')
        }
      }else{
        setMode('reset-request')
      }
      return
    }
    if(invite){
      localStorage.setItem('cobest-pending-invite',invite)
      if(isAuthenticated()){
        acceptTeamInvite(invite).then(()=>{localStorage.removeItem('cobest-pending-invite');window.history.replaceState({},document.title,'/');setMode('app');setPage('dashboard')}).catch(()=>setMode('login'))
      }else setMode('login')
      return
    }
    if(['app','onboarding'].includes(mode) && !isAuthenticated()) setMode('landing')
  },[])

  useEffect(()=>{
    if(!isAuthenticated()) return
    let active=true
    Promise.all([
      listSites(),getWorkspace(),listResource('products'),listResource('customers'),listResource('orders'),
      listResource('media_assets'),listResource('discounts'),listResource('campaigns'),listResource('collections'),listResource('blog_posts'),listResource('catalog_terms'),
      listResource('newsletter_subscribers'),listResource('contact_messages'),listResource('bookings'),
      listResource('product_reviews'),listResource('store_events')
    ]).then(([siteList,workspaceData,cloudProducts,cloudCustomers,cloudOrders,cloudMedia,cloudDiscounts,cloudCampaigns,cloudCollections,cloudBlogPosts,cloudCatalogTerms,cloudSubscribers,cloudContacts,cloudBookings,cloudReviews,cloudEvents])=>{
      if(!active) return
      if(Array.isArray(siteList)){setSites(siteList);if(!getActiveSiteId()&&siteList[0]?.id)setActiveSiteId(siteList[0].id)}
      setWorkspace(workspaceData)
      if(workspaceData?.onboarding) setOnboarding(prev=>({...prev,...workspaceData.onboarding}))
      if(workspaceData?.editor) setEditor(prev=>({...prev,...workspaceData.editor}))
      if(Array.isArray(cloudProducts)) setProducts(cloudProducts)
      if(Array.isArray(cloudCustomers)) setCustomers(cloudCustomers)
      if(Array.isArray(cloudOrders)) setOrders(cloudOrders)
      if(Array.isArray(cloudMedia)) setMediaAssets(cloudMedia)
      if(Array.isArray(cloudDiscounts)) setDiscounts(cloudDiscounts)
      if(Array.isArray(cloudCampaigns)) setCampaigns(cloudCampaigns)
      if(Array.isArray(cloudCollections)) setCollections(cloudCollections)
      if(Array.isArray(cloudBlogPosts)) setBlogPosts(cloudBlogPosts)
      if(Array.isArray(cloudCatalogTerms)) setCatalogTerms(cloudCatalogTerms)
      if(Array.isArray(cloudSubscribers)) setSubscribers(cloudSubscribers)
      if(Array.isArray(cloudContacts)) setContacts(cloudContacts)
      if(Array.isArray(cloudBookings)) setBookings(cloudBookings)
      if(Array.isArray(cloudReviews)) setReviews(cloudReviews)
      if(Array.isArray(cloudEvents)) setEvents(cloudEvents)
      setCloudReady(true)
    }).catch(()=>setCloudReady(true))
    return ()=>{active=false}
  },[mode])

  useEffect(()=>{
    if(!cloudReady || !isAuthenticated()) return
    const timer=setTimeout(()=>saveWorkspace({onboarding,editor,settings:{...(workspace?.settings||{}),lastPage:page},slug:workspace?.slug,custom_domain:workspace?.custom_domain,site_name:onboarding.businessName,plan:workspace?.plan||'Free',currency:workspace?.currency||'PHP',timezone:workspace?.timezone||'Asia/Manila'}).then(x=>{if(x){setWorkspace(x);setSites(prev=>prev.some(s=>s.id===x.id)?prev.map(s=>s.id===x.id?{...s,...x}:s):[...prev,x])}}).catch(()=>{}),700)
    return ()=>clearTimeout(timer)
  },[onboarding,editor,page,cloudReady])

  const complete = () => {
    const featurePages=[]
    if(safeOnboarding.features.includes('Contact forms')) featurePages.push('Contact')
    if(safeOnboarding.features.includes('Booking')) featurePages.push('Booking')
    if(safeOnboarding.features.includes('Gallery')) featurePages.push('Gallery')
    const nextPages=Array.from(new Set(['Home',...safeOnboarding.pages,...featurePages]))
    setOnboarding(prev=>({...prev,pages:nextPages}))
    setEditor(prev=>({...prev,pageContent:{...(prev.pageContent||{}),...Object.fromEntries(nextPages.filter(p=>p!=='Home'&&!prev.pageContent?.[p]).map(p=>[p,{title:p,body:'',blocks:[]}]))}}))
    setMode('app'); setPage('dashboard'); window.scrollTo(0,0)
  }
  const start = () => { setMode(isAuthenticated()?'onboarding':'signup'); window.scrollTo(0,0) }
  const authSuccess=async(next)=>{ const invite=localStorage.getItem('cobest-pending-invite'); if(invite){try{await acceptTeamInvite(invite);localStorage.removeItem('cobest-pending-invite');window.history.replaceState({},document.title,'/');setMode('app')}catch{setMode(next)}}else setMode(next); setPage('dashboard'); window.scrollTo(0,0) }
  const signOut=()=>{ logout(); setMode('landing'); setPage('dashboard') }
  const switchSite=id=>{if(!id||String(id)===String(getActiveSiteId()))return;setActiveSiteId(id);window.location.reload()}
  const addSite=async()=>{const name=window.prompt('Name this website');if(!name?.trim())return;try{const site=await createSite({site_name:name.trim()});if(site?.id){setActiveSiteId(site.id);setMode('onboarding');window.location.reload()}}catch(err){alert(err.message)}}
  const removeSite=async id=>{if(!window.confirm('Delete this site and its site-scoped data? This cannot be undone.'))return;try{await deleteSite(id);if(String(id)===String(getActiveSiteId()))setActiveSiteId('');window.location.reload()}catch(err){alert(err.message)}}
  const addProduct=async(draft)=>{
    const payload={name:draft.name,price:Number(draft.price||0),inventory:Number(draft.inventory||0),category:draft.category||'Uncategorized',status:draft.status||'Draft'}
    if(!isAuthenticated()){const created={id:Date.now(),...payload};setProducts(prev=>[created,...prev]);return created}
    const created=await createResource('products',payload)
    if(created) setProducts(prev=>[created,...prev.filter(x=>x.id!==created.id)])
    return created
  }
  const addCustomer=async(draft)=>{
    if(!isAuthenticated()){const created={id:Date.now(),...draft};setCustomers(prev=>[created,...prev]);return created}
    const created=await createResource('customers',draft)
    if(created) setCustomers(prev=>[created,...prev])
    return created
  }
  const addOrder=async(draft)=>{
    if(!isAuthenticated()){const created={id:Date.now(),...draft};setOrders(prev=>[created,...prev]);return created}
    const created=await createResource('orders',draft)
    if(created) setOrders(prev=>[created,...prev])
    return created
  }
  const addMedia=async(draft)=>{
    if(!isAuthenticated()){const created={id:Date.now(),...draft};setMediaAssets(prev=>[created,...prev]);return created}
    const created=await createResource('media_assets',draft)
    if(created) setMediaAssets(prev=>[created,...prev])
    return created
  }
  const addDiscount=async(draft)=>{
    if(!isAuthenticated()){const created={id:Date.now(),...draft};setDiscounts(prev=>[created,...prev]);return created}
    const created=await createResource('discounts',draft)
    if(created) setDiscounts(prev=>[created,...prev])
    return created
  }
  const addCampaign=async(draft)=>{
    if(!isAuthenticated()){const created={id:Date.now(),...draft};setCampaigns(prev=>[created,...prev]);return created}
    const created=await createResource('campaigns',draft)
    if(created) setCampaigns(prev=>[created,...prev])
    return created
  }

  if(mode==='landing') return <Landing onStart={start} onLogin={()=>setMode('login')}/>
  if(mode==='login') return <Auth variant="login" onSuccess={authSuccess} onBack={()=>setMode('landing')} onSwitch={()=>setMode('signup')} onForgot={()=>{window.history.pushState({},document.title,'/reset-password');setMode('reset-request')}}/>
  if(mode==='signup') return <Auth variant="signup" onSuccess={authSuccess} onBack={()=>setMode('landing')} onSwitch={()=>setMode('login')} onForgot={()=>{window.history.pushState({},document.title,'/reset-password');setMode('reset-request')}}/>
  if(mode==='reset-request') return <ResetRequest onBack={()=>{window.history.replaceState({},document.title,'/');setMode('login')}}/>
  if(mode==='recovery') return <Recovery onDone={()=>{setMode('login');window.history.replaceState({},document.title,'/')}}/>
  if(mode==='onboarding') return <Onboarding data={safeOnboarding} setData={setOnboarding} onComplete={complete} onExit={()=>setMode('landing')}/>
  let content = null
  if(page==='dashboard') content=<Dashboard data={safeOnboarding} products={products} customers={customers} orders={orders} setPage={setPage}/>
  if(page==='processes') content=<ProcessCenter data={safeOnboarding} editor={safeEditor} workspace={workspace} products={products} collections={collections} media={mediaAssets} blogPosts={blogPosts} orders={orders} customers={customers} contacts={contacts} subscribers={subscribers} setPage={setPage}/>
  if(page==='brief') content=<Brief data={safeOnboarding}/>
  if(page==='products') content=<ProductsManager products={products} setProducts={setProducts} terms={catalogTerms} currency={workspace?.currency||'PHP'}/>
  if(page==='taxonomy') content=<TaxonomyManager items={catalogTerms} setItems={setCatalogTerms} products={products} setProducts={setProducts}/>
  if(page==='pages') content=<OnlineStorePage pages={safeOnboarding.pages} setPages={pages=>setOnboarding(prev=>({...prev,pages}))} setPage={setPage} editor={safeEditor} setEditor={setEditor}/>
  if(page==='themes') content=<ThemeLibrary editor={safeEditor} setEditor={setEditor} setPage={setPage}/>
  if(page==='navigation') content=<NavigationManager pages={safeOnboarding.pages} editor={safeEditor} setEditor={setEditor}/>
  if(page==='media') content=<MediaManager items={mediaAssets} setItems={setMediaAssets}/>
  if(page==='blog') content=<BlogManager items={blogPosts} setItems={setBlogPosts} media={mediaAssets}/>
  if(page==='orders') content=<OrdersManager orders={orders} setOrders={setOrders} customers={customers}/>
  if(page==='collections') content=<CollectionsManager items={collections} setItems={setCollections} products={products}/>
  if(page==='customers') content=<CustomersManager customers={customers} setCustomers={setCustomers} orders={orders}/>
  if(page==='analytics') content=<AnalyticsAdvanced orders={orders} customers={customers} events={events} products={products}/>
  if(page==='marketing') content=<CampaignsManager items={campaigns} setItems={setCampaigns} subscribers={subscribers}/>
  if(page==='discounts') content=<DiscountsManager items={discounts} setItems={setDiscounts} currency={workspace?.currency||'PHP'}/>
  if(page==='sites') content=<SitesManager sites={sites} activeSiteId={getActiveSiteId()} onSwitch={switchSite} onCreate={addSite} onDelete={removeSite}/>
  if(page==='team') content=<TeamManager/>
  if(page==='billing') content=<BillingManager/>
  if(page==='integrations') content=<IntegrationsPanel/>
  if(page==='editor') content=<Editor data={safeOnboarding} pages={safeOnboarding.pages} products={products} media={mediaAssets} editor={safeEditor} setEditor={setEditor} onPreview={()=>setPage('storefront')}/>
  if(page==='storefront') content=<StorefrontPage data={safeOnboarding} products={products} editor={safeEditor} onCreateCustomer={addCustomer} onCreateOrder={addOrder}/>
  if(page==='settings') content=<PublishingSettings workspace={workspace} onWorkspace={setWorkspace} snapshot={{onboarding:safeOnboarding,editor:safeEditor,products,discounts,collections,blog_posts:blogPosts.filter(x=>x.status==='Published'),reviews:reviews.filter(x=>x.status==='Approved'),media:mediaAssets,pages:safeOnboarding.pages,settings:{...(workspace?.settings||{}),currency:workspace?.currency||'PHP',timezone:workspace?.timezone||'Asia/Manila',siteName:safeOnboarding.businessName}}}/>
  if(page==='inbox') content=<InboxManager subscribers={subscribers} contacts={contacts} bookings={bookings} reviews={reviews} setReviews={setReviews}/>
  if(page==='help') content=<div className="page-wrap"><div className="page-head"><div><p className="overline">HELP</p><h1>CoBest controls</h1><p>Use the left navigation to manage the website and commerce workspace.</p></div></div><div className="panel"><h3>Quick actions</h3><div className="workspace-grid"><button onClick={()=>setPage('processes')}><Sparkles size={20}/><div><strong>Setup & workflow</strong><p>See the end-to-end process and recommended next action.</p></div><ArrowRight size={15}/></button><button onClick={()=>setPage('themes')}><Palette size={20}/><div><strong>Theme library</strong><p>Choose the visual starting point for the store.</p></div><ArrowRight size={15}/></button><button onClick={()=>setPage('editor')}><Pencil size={20}/><div><strong>Edit website</strong><p>Open the live visual editor.</p></div><ArrowRight size={15}/></button><button onClick={()=>setPage('storefront')}><Eye size={20}/><div><strong>View store</strong><p>Preview the customer-facing store.</p></div><ArrowRight size={15}/></button><button onClick={()=>setPage('products')}><Package size={20}/><div><strong>Products</strong><p>Manage products and inventory.</p></div><ArrowRight size={15}/></button></div></div></div>
  return <AppShell page={page} setPage={setPage} businessName={safeOnboarding.businessName} onRestart={start} onSignOut={signOut} sites={sites} activeSiteId={getActiveSiteId()} onSiteChange={switchSite} onCreateSite={addSite}>{content}</AppShell>
}
