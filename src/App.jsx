import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BarChart3, BriefcaseBusiness, Check, ChevronDown,
  CircleHelp, Eye, FileText, Home, Image as ImageIcon, LayoutDashboard,
  Menu, Monitor, Package, Palette, Pencil, Plus, Search, Settings, ShoppingBag,
  Smartphone, Sparkles, Store, Tablet, Upload, Users, X
} from 'lucide-react'
import { createResource, getWorkspace, isAuthenticated, listResource, logout, resetPassword, saveWorkspace, signIn, signUp } from './api.js'

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
  theme: { sectionGap: 32, radius: 0 },
  blocks: []
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
  { label: '', items: [['dashboard','Home',LayoutDashboard],['orders','Orders',ShoppingBag],['products','Products',Package],['customers','Customers',Users]] },
  { label: 'Sales channels', items: [['pages','Online store',Store],['editor','Website editor',Palette],['storefront','View store',Eye]] },
  { label: 'Content', items: [['media','Media',ImageIcon],['brief','Website brief',FileText]] },
  { label: 'Growth', items: [['analytics','Analytics',BarChart3],['marketing','Marketing',Sparkles],['discounts','Discounts',BriefcaseBusiness]] },
]
const navItems = navGroups.flatMap(group => group.items)

function AppShell({ page, setPage, children, onRestart, onSignOut, businessName }) {
  const [mobile, setMobile] = useState(false)
  return <div className="app-shell">
    <aside className={`app-sidebar ${mobile?'open':''}`}>
      <div className="sidebar-top"><Logo inverse/><button className="mobile-close" onClick={()=>setMobile(false)}><X/></button></div>
      <div className="store-switch"><div className="store-avatar">{(businessName||'C').charAt(0)}</div><div><strong>{businessName||'Your Store'}</strong><span>Online store</span></div><ChevronDown size={15}/></div>
      <nav className="app-nav">{navGroups.map(group=><div className="nav-group" key={group.label||'primary'}>{group.label&&<span className="nav-group-label">{group.label}</span>}{group.items.map(([id,label,I])=><button key={id} className={page===id?'active':''} onClick={()=>{setPage(id);setMobile(false)}}><I size={17}/><span>{label}</span></button>)}</div>)}</nav>
      <div className="sidebar-bottom"><button><Settings size={18}/> Settings</button><button><CircleHelp size={18}/> Help</button><button onClick={onRestart}><Sparkles size={18}/> Store setup</button>{onSignOut&&<button onClick={onSignOut}><X size={18}/> Sign out</button>}</div>
    </aside>
    <main className="app-main"><header className="app-header"><button className="menu-button" onClick={()=>setMobile(true)}><Menu size={20}/></button><div className="breadcrumb"><span>{businessName||APP_NAME}</span><b>/</b><strong>{navItems.find(x=>x[0]===page)?.[1]||'Workspace'}</strong></div><div className="header-actions"><button><Search size={18}/></button><div className="header-avatar">CO</div></div></header>{children}</main>
  </div>
}

function Dashboard({ data, products, customers=[], orders=[], setPage }) {
  const completeness = Math.min(96, 48 + data.pages.length * 4 + data.styles.length * 5 + products.length * 3)
  const paidSales = orders.filter(o=>o.payment_status==='Paid').reduce((sum,o)=>sum+Number(o.total||0),0)
  return <div className="page-wrap">
    <div className="page-head"><div><p className="overline">STORE HOME</p><h1>Good morning.</h1><p>Manage {data.businessName} from one place.</p></div><div className="page-actions"><Button variant="secondary" onClick={()=>setPage('storefront')}><Eye size={15}/> View store</Button><Button onClick={()=>setPage('editor')}><Pencil size={15}/> Edit website</Button></div></div>
    <div className="stat-grid"><Stat title="Sales" value={formatPrice(paidSales)} note={paidSales?"Paid revenue":"No paid sales yet"} icon={BarChart3}/><Stat title="Orders" value={String(orders.length)} note={orders.length?"Orders recorded":"No orders yet"} icon={ShoppingBag}/><Stat title="Conversion" value="—" note="Available after traffic" icon={Store}/><Stat title="Customers" value={String(customers.length)} note={customers.length?"Customer records":"No customers yet"} icon={Users}/></div>
    <div className="dashboard-grid commerce-home-grid"><section className="panel"><div className="panel-head"><div><span>Store activity</span><h3>Ready for your first visit</h3></div><Button variant="ghost" onClick={()=>setPage('analytics')}>View analytics <ArrowRight size={14}/></Button></div><div className="empty-panel"><BarChart3 size={24}/><strong>Performance will appear here</strong><p>Once your storefront receives traffic and orders, CoBest will show sales and conversion activity here.</p></div></section><section className="panel"><div className="panel-head"><div><span>Orders</span><h3>Nothing needs attention</h3></div><Button variant="ghost" onClick={()=>setPage('orders')}>View orders <ArrowRight size={14}/></Button></div><div className="empty-panel"><ShoppingBag size={24}/><strong>No orders yet</strong><p>New orders will appear here with payment and fulfillment status.</p></div></section></div>
    <div className="progress-panel"><div className="progress-ring" style={{'--p':`${completeness*3.6}deg`}}><span>{completeness}%</span></div><div className="progress-copy"><span>Store setup</span><h2>Keep building the storefront.</h2><p>Your business direction is captured. Continue refining pages, products, content, and the customer experience.</p><div className="progress-line"><i style={{width:`${completeness}%`}}/></div></div><div className="progress-action"><Button variant="secondary" onClick={()=>setPage('brief')}>View website brief</Button></div></div>
    <div className="workspace-grid"><button onClick={()=>setPage('products')}><Package size={20}/><div><span>Catalog</span><strong>{products.length} products</strong><p>Pricing, inventory, and product status.</p></div><ArrowRight size={15}/></button><button onClick={()=>setPage('editor')}><Palette size={20}/><div><span>Online store</span><strong>Customize website</strong><p>Edit sections and customer-facing pages.</p></div><ArrowRight size={15}/></button><button onClick={()=>setPage('customers')}><Users size={20}/><div><span>Customers</span><strong>Customer records</strong><p>Purchase history and customer details.</p></div><ArrowRight size={15}/></button><button onClick={()=>setPage('media')}><ImageIcon size={20}/><div><span>Content</span><strong>Media library</strong><p>Website and product assets in one place.</p></div><ArrowRight size={15}/></button></div>
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
  return <div className="page-wrap brief-page"><div className="page-head"><div><p className="overline">SINGLE SOURCE OF TRUTH</p><h1>Website brief</h1><p>Everything captured during onboarding, organized for the project.</p></div><Button variant="secondary"><Eye size={15}/> Preview brief</Button></div><div className="brief-layout"><aside className="brief-index"><span>Contents</span>{sections.map((x,i)=><a key={x[0]} href={`#brief-${i}`}>{String(i+1).padStart(2,'0')} {x[0]}</a>)}</aside><div className="brief-doc"><div className="brief-cover"><span>WEBSITE PROJECT BRIEF</span><h2>{data.businessName}</h2><p>{data.websiteType} · {data.styles.join(' + ')}</p><div className="brief-colors">{[data.primaryColor,data.secondaryColor,data.accentColor].map(c=><i key={c} style={{background:c}}/>)}</div></div>{sections.map((s,i)=><section key={s[0]} id={`brief-${i}`}><p className="overline">{String(i+1).padStart(2,'0')}</p><h3>{s[0]}</h3>{s[1].map(([label,val])=><div className="brief-row" key={label}><span>{label}</span><p>{val||'Not provided'}</p></div>)}</section>)}</div></div></div>
}

function Products({products,setProducts,onCreate}) {
  const [adding,setAdding]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [draft,setDraft]=useState({name:'',price:'',inventory:'',category:'',status:'Draft'})
  const add=async()=>{ 
    if(!draft.name) return
    setBusy(true); setError('')
    try {
      if(onCreate) await onCreate(draft)
      else setProducts(prev=>[...prev,{id:Date.now(),name:draft.name,price:Number(draft.price||0),inventory:Number(draft.inventory||0),category:draft.category||'Uncategorized',status:draft.status||'Draft'}])
      setDraft({name:'',price:'',inventory:'',category:'',status:'Draft'}); setAdding(false)
    } catch(err) { setError(err.message) }
    finally { setBusy(false) }
  }
  return <div className="page-wrap"><div className="page-head"><div><p className="overline">CATALOG</p><h1>Products</h1><p>Create the items that will appear in the storefront.</p></div><Button onClick={()=>setAdding(true)}><Plus size={16}/> Add product</Button></div><div className="toolbar"><div className="searchbox"><Search size={16}/><input placeholder="Search products"/></div><Button variant="secondary">All products <ChevronDown size={14}/></Button></div><div className="table-card"><table><thead><tr><th>Product</th><th>Status</th><th>Inventory</th><th>Category</th><th>Price</th></tr></thead><tbody>{products.map((p,i)=><tr key={p.id}><td><div className={`product-thumb thumb-${(i%4)+1}`}><ShoppingBag size={18}/></div><strong>{p.name}</strong></td><td><span className={`status ${String(p.status||'Draft').toLowerCase()}`}>{p.status||'Draft'}</span></td><td>{p.inventory} in stock</td><td>{p.category}</td><td>{formatPrice(p.price)}</td></tr>)}</tbody></table>{!products.length&&<div className="empty-panel"><Package size={24}/><strong>No products yet</strong><p>Create your first product to start the catalog.</p></div>}</div>{adding&&<Modal title="Add product" onClose={()=>setAdding(false)}><div className="modal-form">{error&&<div className="auth-message auth-error">{error}</div>}<Field label="Product name"><input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Product name"/></Field><div className="form-grid two"><Field label="Price"><input type="number" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})} placeholder="0"/></Field><Field label="Inventory"><input type="number" value={draft.inventory} onChange={e=>setDraft({...draft,inventory:e.target.value})} placeholder="0"/></Field></div><div className="form-grid two"><Field label="Category"><input value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})} placeholder="e.g. Lighting"/></Field><Field label="Status"><select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option>Draft</option><option>Active</option><option>Archived</option></select></Field></div><div className="modal-actions"><Button variant="secondary" onClick={()=>setAdding(false)}>Cancel</Button><Button onClick={add} disabled={busy}>{busy?'Saving…':'Create product'}</Button></div></div></Modal>}</div>
}
function Modal({title,onClose,children}) { return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><h3>{title}</h3><button onClick={onClose}><X size={20}/></button></div>{children}</div></div> }

function OnlineStorePage({pages,setPages,setPage}) {
  const [adding,setAdding]=useState(false)
  const [name,setName]=useState('')
  const addPage=()=>{const clean=name.trim();if(!clean)return;setPages?.(Array.from(new Set([...(pages||[]),clean])));setName('');setAdding(false)}
  return <div className="page-wrap"><div className="page-head"><div><p className="overline">SALES CHANNEL</p><h1>Online store</h1><p>Manage the storefront, theme, pages, and publishing settings.</p></div><div className="page-actions"><Button variant="secondary" onClick={()=>setPage('storefront')}><Eye size={15}/> View store</Button><Button onClick={()=>setPage('editor')}><Palette size={15}/> Customize</Button></div></div><div className="online-store-grid"><section className="panel theme-card"><div className="panel-head"><div><span>Theme</span><h3>Current storefront</h3></div><span className="status active">Active</span></div><div className="theme-preview"><div><small>NEW COLLECTION</small><h4>Objects for quieter living.</h4><span>Shop collection</span></div><div className="theme-products"><i/><i/><i/></div></div><div className="theme-actions"><strong>Aurelia</strong><div><Button variant="secondary" onClick={()=>setPage('editor')}>Customize</Button></div></div></section><section className="panel store-settings-card"><div className="panel-head"><div><span>Storefront</span><h3>Publishing</h3></div></div><SummaryRow label="Domain" value="cobest.me"/><SummaryRow label="Status" value="Online"/><SummaryRow label="Theme" value="Aurelia"/><SummaryRow label="Market" value="Philippines"/><Button variant="secondary" onClick={()=>setPage('storefront')}>Open storefront <ArrowRight size={14}/></Button></section></div><div className="page-section-head"><div><span>Website structure</span><h2>Pages</h2></div><Button variant="secondary" onClick={()=>setAdding(true)}><Plus size={15}/> Add page</Button></div><div className="page-list">{pages.map((p,i)=><div className="page-list-row" key={p}><div className="page-icon"><FileText size={18}/></div><div><strong>{p}</strong><span>/{p==='Home'?'':p.toLowerCase().replaceAll(' ','-')}</span></div><span className="status active">Visible</span><small>{i===0?'Homepage':'Published'}</small><button onClick={()=>setPage('editor')}><Pencil size={16}/></button></div>)}</div>{adding&&<Modal title="Add page" onClose={()=>setAdding(false)}><div className="modal-form"><Field label="Page name"><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Contact"/></Field><div className="modal-actions"><Button variant="secondary" onClick={()=>setAdding(false)}>Cancel</Button><Button onClick={addPage}>Add page</Button></div></div></Modal>}</div>
}
function EmptyState({icon:Icon,title,body,action}) { return <div className="empty-state"><div><Icon size={24}/></div><h3>{title}</h3><p>{body}</p>{action&&<Button>{action}</Button>}</div> }

function OperationsPage({type,orders=[],customers=[],items=[],onCreate}) {
  const [adding,setAdding]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [customerDraft,setCustomerDraft]=useState({name:'',email:'',phone:'',notes:''})
  const [orderDraft,setOrderDraft]=useState({customer_id:'',order_number:'',total:'',payment_status:'Pending',fulfillment_status:'Unfulfilled',notes:''})
  const [mediaDraft,setMediaDraft]=useState({name:'',url:'',mime_type:'image'})
  const [campaignDraft,setCampaignDraft]=useState({name:'',channel:'email',status:'Draft'})
  const [discountDraft,setDiscountDraft]=useState({code:'',kind:'percent',value:'',active:true})
  const saveCustomer=async()=>{
    if(!customerDraft.name) return
    setBusy(true);setError('')
    try { await onCreate?.(customerDraft); setCustomerDraft({name:'',email:'',phone:'',notes:''}); setAdding(false) }
    catch(err){setError(err.message)} finally{setBusy(false)}
  }
  const saveOrder=async()=>{
    setBusy(true);setError('')
    try {
      await onCreate?.({...orderDraft,customer_id:orderDraft.customer_id?Number(orderDraft.customer_id):null,total:Number(orderDraft.total||0),order_number:orderDraft.order_number||`CO-${Date.now().toString().slice(-6)}`})
      setOrderDraft({customer_id:'',order_number:'',total:'',payment_status:'Pending',fulfillment_status:'Unfulfilled',notes:''}); setAdding(false)
    } catch(err){setError(err.message)} finally{setBusy(false)}
  }
  if(type==='orders') {
    const paid=orders.filter(o=>o.payment_status==='Paid')
    const revenue=paid.reduce((sum,o)=>sum+Number(o.total||0),0)
    const open=orders.filter(o=>!['Fulfilled','Cancelled'].includes(o.fulfillment_status)).length
    return <div className="page-wrap"><div className="page-head"><div><p className="overline">COMMERCE</p><h1>Orders</h1><p>Track purchases, payment status, and fulfillment from one place.</p></div><Button onClick={()=>setAdding(true)}><Plus size={16}/> Add order</Button></div><div className="stat-grid compact-stats"><Stat title="Orders" value={String(orders.length)} note="All recorded orders" icon={ShoppingBag}/><Stat title="Open orders" value={String(open)} note="Needs fulfillment" icon={Package}/><Stat title="Revenue" value={formatPrice(revenue)} note="Paid orders" icon={BarChart3}/><Stat title="Average order" value={paid.length?formatPrice(revenue/paid.length):'—'} note="Paid orders" icon={BriefcaseBusiness}/></div>{orders.length?<div className="table-card"><table><thead><tr><th>Order</th><th>Customer</th><th>Payment</th><th>Fulfillment</th><th>Total</th></tr></thead><tbody>{orders.map(o=>{const customer=customers.find(c=>c.id===o.customer_id);return <tr key={o.id}><td><strong>{o.order_number||`#${o.id}`}</strong></td><td>{customer?.name||'Guest / manual'}</td><td><span className={`status ${String(o.payment_status).toLowerCase()}`}>{o.payment_status}</span></td><td>{o.fulfillment_status}</td><td>{formatPrice(o.total)}</td></tr>})}</tbody></table></div>:<EmptyState icon={ShoppingBag} title="No orders yet" body="Create a manual order for testing now; checkout-generated orders can be connected when payments are enabled."/>}{adding&&<Modal title="Add order" onClose={()=>setAdding(false)}><div className="modal-form">{error&&<div className="auth-message auth-error">{error}</div>}<Field label="Order number"><input value={orderDraft.order_number} onChange={e=>setOrderDraft({...orderDraft,order_number:e.target.value})} placeholder="Auto-generated if blank"/></Field><Field label="Customer"><select value={orderDraft.customer_id} onChange={e=>setOrderDraft({...orderDraft,customer_id:e.target.value})}><option value="">Guest / no customer</option>{customers.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field><Field label="Total"><input type="number" value={orderDraft.total} onChange={e=>setOrderDraft({...orderDraft,total:e.target.value})} placeholder="0"/></Field><div className="form-grid two"><Field label="Payment"><select value={orderDraft.payment_status} onChange={e=>setOrderDraft({...orderDraft,payment_status:e.target.value})}><option>Pending</option><option>Paid</option><option>Refunded</option><option>Failed</option></select></Field><Field label="Fulfillment"><select value={orderDraft.fulfillment_status} onChange={e=>setOrderDraft({...orderDraft,fulfillment_status:e.target.value})}><option>Unfulfilled</option><option>Processing</option><option>Fulfilled</option><option>Cancelled</option></select></Field></div><div className="modal-actions"><Button variant="secondary" onClick={()=>setAdding(false)}>Cancel</Button><Button disabled={busy} onClick={saveOrder}>{busy?'Saving…':'Create order'}</Button></div></div></Modal>}</div>
  }
  if(type==='customers') return <div className="page-wrap"><div className="page-head"><div><p className="overline">COMMERCE</p><h1>Customers</h1><p>Keep customer details and purchase history connected to the store.</p></div><Button onClick={()=>setAdding(true)}><Plus size={16}/> Add customer</Button></div>{customers.length?<div className="table-card"><table><thead><tr><th>Customer</th><th>Email</th><th>Phone</th><th>Orders</th></tr></thead><tbody>{customers.map(c=><tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.email||'—'}</td><td>{c.phone||'—'}</td><td>{orders.filter(o=>o.customer_id===c.id).length}</td></tr>)}</tbody></table></div>:<EmptyState icon={Users} title="No customers yet" body="Add your first customer to create a persistent customer record."/>}{adding&&<Modal title="Add customer" onClose={()=>setAdding(false)}><div className="modal-form">{error&&<div className="auth-message auth-error">{error}</div>}<Field label="Name"><input value={customerDraft.name} onChange={e=>setCustomerDraft({...customerDraft,name:e.target.value})}/></Field><Field label="Email"><input type="email" value={customerDraft.email} onChange={e=>setCustomerDraft({...customerDraft,email:e.target.value})}/></Field><Field label="Phone"><input value={customerDraft.phone} onChange={e=>setCustomerDraft({...customerDraft,phone:e.target.value})}/></Field><Field label="Notes"><textarea rows="3" value={customerDraft.notes} onChange={e=>setCustomerDraft({...customerDraft,notes:e.target.value})}/></Field><div className="modal-actions"><Button variant="secondary" onClick={()=>setAdding(false)}>Cancel</Button><Button disabled={busy} onClick={saveCustomer}>{busy?'Saving…':'Create customer'}</Button></div></div></Modal>}</div>
  if(type==='media') {
    const saveMedia=async()=>{if(!mediaDraft.name||!mediaDraft.url)return;setBusy(true);setError('');try{await onCreate?.(mediaDraft);setMediaDraft({name:'',url:'',mime_type:'image'});setAdding(false)}catch(err){setError(err.message)}finally{setBusy(false)}}
    return <div className="page-wrap"><div className="page-head"><div><p className="overline">CONTENT</p><h1>Media</h1><p>Keep website and product assets organized in one library.</p></div><Button onClick={()=>setAdding(true)}><Upload size={16}/> Add media</Button></div>{items.length?<div className="table-card"><table><thead><tr><th>Asset</th><th>Type</th><th>URL</th></tr></thead><tbody>{items.map(m=><tr key={m.id}><td><strong>{m.name}</strong></td><td>{m.mime_type||'asset'}</td><td><a href={m.url} target="_blank" rel="noreferrer">Open asset</a></td></tr>)}</tbody></table></div>:<EmptyState icon={ImageIcon} title="No media yet" body="Add a hosted image or asset URL now. Direct file uploads can be added with a storage bucket later."/>}{adding&&<Modal title="Add media" onClose={()=>setAdding(false)}><div className="modal-form">{error&&<div className="auth-message auth-error">{error}</div>}<Field label="Name"><input value={mediaDraft.name} onChange={e=>setMediaDraft({...mediaDraft,name:e.target.value})}/></Field><Field label="Asset URL"><input value={mediaDraft.url} onChange={e=>setMediaDraft({...mediaDraft,url:e.target.value})} placeholder="https://..."/></Field><Field label="Type"><select value={mediaDraft.mime_type} onChange={e=>setMediaDraft({...mediaDraft,mime_type:e.target.value})}><option value="image">Image</option><option value="video">Video</option><option value="document">Document</option></select></Field><div className="modal-actions"><Button variant="secondary" onClick={()=>setAdding(false)}>Cancel</Button><Button disabled={busy} onClick={saveMedia}>{busy?'Saving…':'Add media'}</Button></div></div></Modal>}</div>
  }
  if(type==='analytics') {
    const revenue=orders.filter(o=>o.payment_status==='Paid').reduce((sum,o)=>sum+Number(o.total||0),0)
    return <div className="page-wrap"><div className="page-head"><div><p className="overline">ANALYTICS</p><h1>Store performance</h1><p>Review sales and storefront activity from one business view.</p></div><Button variant="secondary">Live account data</Button></div><div className="stat-grid"><Stat title="Sales" value={formatPrice(revenue)} note="Paid order revenue" icon={BarChart3}/><Stat title="Orders" value={String(orders.length)} note="Recorded orders" icon={ShoppingBag}/><Stat title="Average order" value={orders.length?formatPrice(orders.reduce((s,o)=>s+Number(o.total||0),0)/orders.length):'—'} note="All orders" icon={Store}/><Stat title="Customers" value={String(customers.length)} note="Customer records" icon={Users}/></div><div className="panel"><div className="panel-head"><div><span>Data source</span><h3>Persistent commerce data</h3></div></div><p>These totals are calculated from the authenticated account's stored orders and customers rather than sample data.</p></div></div>
  }
  if(type==='marketing') {
    const saveCampaign=async()=>{if(!campaignDraft.name)return;setBusy(true);setError('');try{await onCreate?.(campaignDraft);setCampaignDraft({name:'',channel:'email',status:'Draft'});setAdding(false)}catch(err){setError(err.message)}finally{setBusy(false)}}
    return <div className="page-wrap"><div className="page-head"><div><p className="overline">GROWTH</p><h1>Marketing</h1><p>Organize store campaigns and customer touchpoints around the same business.</p></div><Button onClick={()=>setAdding(true)}><Plus size={16}/> Create campaign</Button></div>{items.length?<div className="table-card"><table><thead><tr><th>Campaign</th><th>Channel</th><th>Status</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td><strong>{x.name}</strong></td><td>{x.channel}</td><td>{x.status}</td></tr>)}</tbody></table></div>:<EmptyState icon={Sparkles} title="No campaigns yet" body="Create a campaign record now. Sending email still requires an email provider integration."/>}{adding&&<Modal title="Create campaign" onClose={()=>setAdding(false)}><div className="modal-form">{error&&<div className="auth-message auth-error">{error}</div>}<Field label="Campaign name"><input value={campaignDraft.name} onChange={e=>setCampaignDraft({...campaignDraft,name:e.target.value})}/></Field><Field label="Channel"><select value={campaignDraft.channel} onChange={e=>setCampaignDraft({...campaignDraft,channel:e.target.value})}><option value="email">Email</option><option value="social">Social</option><option value="launch">Launch</option></select></Field><Field label="Status"><select value={campaignDraft.status} onChange={e=>setCampaignDraft({...campaignDraft,status:e.target.value})}><option>Draft</option><option>Scheduled</option><option>Active</option><option>Complete</option></select></Field><div className="modal-actions"><Button variant="secondary" onClick={()=>setAdding(false)}>Cancel</Button><Button disabled={busy} onClick={saveCampaign}>{busy?'Saving…':'Create campaign'}</Button></div></div></Modal>}</div>
  }
  if(type==='discounts') {
    const saveDiscount=async()=>{if(!discountDraft.code)return;setBusy(true);setError('');try{await onCreate?.({...discountDraft,value:Number(discountDraft.value||0)});setDiscountDraft({code:'',kind:'percent',value:'',active:true});setAdding(false)}catch(err){setError(err.message)}finally{setBusy(false)}}
    return <div className="page-wrap"><div className="page-head"><div><p className="overline">COMMERCE</p><h1>Discounts</h1><p>Create offers that can be used across the storefront.</p></div><Button onClick={()=>setAdding(true)}><Plus size={16}/> Create discount</Button></div>{items.length?<div className="table-card"><table><thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Status</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td><strong>{x.code}</strong></td><td>{x.kind}</td><td>{x.kind==='percent'?x.value+'%':formatPrice(x.value)}</td><td>{x.active?'Active':'Inactive'}</td></tr>)}</tbody></table></div>:<EmptyState icon={Sparkles} title="No discounts yet" body="Create a persistent discount code now. Checkout enforcement will use these records when payment checkout is enabled."/>}{adding&&<Modal title="Create discount" onClose={()=>setAdding(false)}><div className="modal-form">{error&&<div className="auth-message auth-error">{error}</div>}<Field label="Code"><input value={discountDraft.code} onChange={e=>setDiscountDraft({...discountDraft,code:e.target.value.toUpperCase()})} placeholder="WELCOME10"/></Field><div className="form-grid two"><Field label="Type"><select value={discountDraft.kind} onChange={e=>setDiscountDraft({...discountDraft,kind:e.target.value})}><option value="percent">Percent</option><option value="fixed">Fixed amount</option></select></Field><Field label="Value"><input type="number" value={discountDraft.value} onChange={e=>setDiscountDraft({...discountDraft,value:e.target.value})}/></Field></div><div className="modal-actions"><Button variant="secondary" onClick={()=>setAdding(false)}>Cancel</Button><Button disabled={busy} onClick={saveDiscount}>{busy?'Saving…':'Create discount'}</Button></div></div></Modal>}</div>
  }
  return null
}
function Editor({data,products,editor,setEditor}) {
  const baseSections=[['header','Header'],['hero','Hero'],['featured','Featured products'],['story','Brand story'],['newsletter','Newsletter'],['footer','Footer']]
  const customSections=(editor.blocks||[]).map(b=>[b.id,b.title||'Content block'])
  const sections=[...baseSections.slice(0,4),...customSections,...baseSections.slice(4)]
  const update=(section,key,value)=>setEditor(prev=>({...prev,[section]:{...prev[section],[key]:value}}))
  const selectedBlock=(editor.blocks||[]).find(b=>b.id===editor.selected)
  const updateBlock=(key,value)=>setEditor(prev=>({...prev,blocks:(prev.blocks||[]).map(b=>b.id===prev.selected?{...b,[key]:value}:b)}))
  const addBlock=()=>{
    const id=`block-${Date.now()}`
    const block={id,type:'text',title:'New content block',body:'Add your content here.',background:'#ffffff',text:'#171717',padding:48,columns:1,imageUrl:'',items:'Item one, Item two, Item three'}
    setEditor(prev=>({...prev,blocks:[...(prev.blocks||[]),block],selected:id}))
  }
  const removeBlock=()=>{
    if(!selectedBlock)return
    setEditor(prev=>({...prev,blocks:(prev.blocks||[]).filter(b=>b.id!==selectedBlock.id),selected:'hero'}))
  }
  return <div className="editor-screen"><div className="editor-top"><div><Logo/><span className="editor-divider"/><strong>Home</strong><ChevronDown size={14}/></div><div className="device-toggle">{[['desktop',Monitor],['tablet',Tablet],['mobile',Smartphone]].map(([id,I])=><button key={id} className={editor.device===id?'active':''} onClick={()=>setEditor({...editor,device:id})}><I size={16}/></button>)}</div><div><Button variant="ghost"><Eye size={15}/> Live preview</Button><Button onClick={()=>saveWorkspace({onboarding:data,editor,settings:{}}).catch(()=>{})}>Save</Button></div></div><div className="editor-body"><aside className="section-panel"><div className="panel-title"><span>Page sections</span><button onClick={addBlock}><Plus size={16}/></button></div>{sections.map(([id,label],i)=><button key={id} className={`section-item ${editor.selected===id?'active':''}`} onClick={()=>setEditor({...editor,selected:id})}><span className="drag-dots">⠿</span><div className="section-thumb">{id.startsWith('block-')?<Plus size={14}/>:i<2?<ImageIcon size={14}/>:<LayoutDashboard size={14}/>}</div><strong>{label}</strong></button>)}<button className="add-section" onClick={addBlock}><Plus size={15}/> Add content block</button></aside><main className="canvas-area"><div className={`store-canvas device-${editor.device}`}><StorefrontMini data={data} products={products} editor={editor}/></div></main><aside className="settings-panel"><div className="settings-head"><span>Section settings</span><strong>{sections.find(s=>s[0]===editor.selected)?.[1]||'Section'}</strong></div>{editor.selected==='hero'&&<div className="settings-form"><Field label="Eyebrow"><input value={editor.hero.eyebrow} onChange={e=>update('hero','eyebrow',e.target.value)}/></Field><Field label="Heading"><textarea rows="3" value={editor.hero.heading} onChange={e=>update('hero','heading',e.target.value)}/></Field><Field label="Body"><textarea rows="4" value={editor.hero.body} onChange={e=>update('hero','body',e.target.value)}/></Field><Field label="Button label"><input value={editor.hero.button} onChange={e=>update('hero','button',e.target.value)}/></Field><Field label="Alignment"><div className="segment"><button className={editor.hero.align==='left'?'active':''} onClick={()=>update('hero','align','left')}>Left</button><button className={editor.hero.align==='center'?'active':''} onClick={()=>update('hero','align','center')}>Center</button></div></Field></div>}{editor.selected==='featured'&&<div className="settings-form"><Field label="Section heading"><input value={editor.featured.title} onChange={e=>update('featured','title',e.target.value)}/></Field><Field label="Columns"><div className="segment">{[2,3,4].map(n=><button key={n} className={editor.featured.columns===n?'active':''} onClick={()=>update('featured','columns',n)}>{n}</button>)}</div></Field></div>}{editor.selected==='story'&&<div className="settings-form"><Field label="Heading"><input value={editor.story.title} onChange={e=>update('story','title',e.target.value)}/></Field><Field label="Body"><textarea rows="5" value={editor.story.body} onChange={e=>update('story','body',e.target.value)}/></Field></div>}{selectedBlock&&<div className="settings-form"><Field label="Block type"><select value={selectedBlock.type} onChange={e=>updateBlock('type',e.target.value)}><option value="text">Text</option><option value="image">Image</option><option value="list">List</option><option value="menu">Menu</option></select></Field><Field label="Title"><input value={selectedBlock.title} onChange={e=>updateBlock('title',e.target.value)}/></Field><Field label="Body"><textarea rows="4" value={selectedBlock.body||''} onChange={e=>updateBlock('body',e.target.value)}/></Field>{selectedBlock.type==='image'&&<Field label="Image URL"><input value={selectedBlock.imageUrl||''} onChange={e=>updateBlock('imageUrl',e.target.value)} placeholder="https://..."/></Field>}{['list','menu'].includes(selectedBlock.type)&&<Field label="Items (comma separated)"><textarea rows="3" value={selectedBlock.items||''} onChange={e=>updateBlock('items',e.target.value)}/></Field>}<Field label="Columns"><div className="segment">{[1,2,3,4].map(n=><button key={n} className={Number(selectedBlock.columns||1)===n?'active':''} onClick={()=>updateBlock('columns',n)}>{n}</button>)}</div></Field><div className="form-grid two"><Field label="Background"><input type="color" value={selectedBlock.background||'#ffffff'} onChange={e=>updateBlock('background',e.target.value)}/></Field><Field label="Text"><input type="color" value={selectedBlock.text||'#171717'} onChange={e=>updateBlock('text',e.target.value)}/></Field></div><Field label={`Padding: ${selectedBlock.padding||48}px`}><input type="range" min="8" max="120" value={selectedBlock.padding||48} onChange={e=>updateBlock('padding',Number(e.target.value))}/></Field><Button variant="secondary" onClick={removeBlock}>Remove block</Button></div>}{!['hero','featured','story'].includes(editor.selected)&&!selectedBlock&&<div className="empty-settings"><Settings size={24}/><strong>Basic section</strong><p>Use the section controls to manage its content, layout, and visibility.</p></div>}<div className="settings-form precision-controls"><span className="overline">GLOBAL STYLE</span><Field label={`Section gap: ${editor.theme?.sectionGap||32}px`}><input type="range" min="0" max="96" value={editor.theme?.sectionGap||32} onChange={e=>setEditor(prev=>({...prev,theme:{...(prev.theme||{}),sectionGap:Number(e.target.value)}}))}/></Field><Field label={`Card radius: ${editor.theme?.radius||0}px`}><input type="range" min="0" max="40" value={editor.theme?.radius||0} onChange={e=>setEditor(prev=>({...prev,theme:{...(prev.theme||{}),radius:Number(e.target.value)}}))}/></Field></div><div className="project-context"><span>PROJECT CONTEXT</span><strong>{data.goals[0]||'Website goal'}</strong><p>{data.primaryAction}</p><div><b>Direction</b><em>{data.styles.join(' + ')}</em></div><div><b>Audience</b><em>{data.audience}</em></div></div></aside></div></div>
}
function StorefrontMini({data,products,editor,full=false,onAdd,cartCount=0}) {
  const visible = products.filter(x=>x.status==='Active')
  return <div className={`storefront ${full?'full-storefront':''}`} style={{'--brand':data.primaryColor,'--paper':data.secondaryColor,'--accent':data.accentColor}}><header><div className="store-logo">{data.businessName||'Your Store'}</div><nav><span>Shop</span><span>About</span><span>Journal</span></nav><div><Search size={15}/><span className="store-cart-indicator"><ShoppingBag size={16}/>{full&&cartCount>0&&<b>{cartCount}</b>}</span></div></header><section className={`sf-hero align-${editor.hero.align}`}><div><small>{editor.hero.eyebrow}</small><h1>{editor.hero.heading}</h1><p>{editor.hero.body}</p><button>{editor.hero.button}</button></div><div className="sf-hero-art"><div className="art-object"><i/><b/></div></div></section><section className="sf-products"><div className="sf-section-head"><h2>{editor.featured.title}</h2><span>{visible.length} products</span></div><div className={`sf-product-grid columns-${editor.featured.columns}`}>{visible.map((p,i)=><article key={p.id}><div className={`sf-product-image product-art-${(i%4)+1}`}><div/></div><h3>{p.name}</h3><p>{formatPrice(p.price)}</p>{full&&<button className="sf-add-cart" onClick={()=>onAdd?.(p)}>Add to cart</button>}</article>)}</div>{!visible.length&&<div className="empty-panel"><Package size={22}/><strong>No active products</strong><p>Activate a product in Catalog to show it in the storefront.</p></div>}</section><section className="sf-story"><small>OUR APPROACH</small><h2>{editor.story.title}</h2><p>{editor.story.body}</p></section><section className="sf-newsletter"><h2>Notes from the studio.</h2><p>Occasional stories, new arrivals, and thoughtful things worth sharing.</p><div><span>Email address</span><button>Join</button></div></section><footer><strong>{data.businessName||'Your Store'}</strong><span>Shop · About · Contact · Instagram</span><small>© 2026 {data.businessName||'Your Store'}</small></footer></div>
}

function StorefrontPage({data,products,editor,onCreateCustomer,onCreateOrder}) {
  const [cart,setCart]=useState([])
  const [checkout,setCheckout]=useState(false)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')
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

function Auth({variant='login',onSuccess,onBack,onSwitch}) {
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')
  const signup=variant==='signup'
  const submit=async(e)=>{
    e.preventDefault()
    setBusy(true); setError(''); setMessage('')
    try {
      const result=signup ? await signUp(email,password) : await signIn(email,password)
      if(signup && !result?.access_token) {
        setMessage('Account created. Check your email to confirm your address, then log in.')
      } else {
        onSuccess(signup ? 'onboarding' : 'app')
      }
    } catch(err) { setError(err.message) }
    finally { setBusy(false) }
  }
  const forgot=async()=>{
    if(!email) return setError('Enter your email address first.')
    setBusy(true); setError(''); setMessage('')
    try { await resetPassword(email); setMessage('Password reset email sent.') }
    catch(err) { setError(err.message) }
    finally { setBusy(false) }
  }
  return <div className="auth-page"><div className="auth-top"><button onClick={onBack}><ArrowLeft size={16}/> Back</button><Logo/></div><form className="auth-card" onSubmit={submit}><p className="overline">{signup?'CREATE YOUR ACCOUNT':'WELCOME BACK'}</p><h1>{signup?'Start with CoBest':'Log in to CoBest'}</h1><p>{signup?'Create an account, then build your business brief and storefront.':'Manage your website, products, customers, and store.'}</p>{error&&<div className="auth-message auth-error">{error}</div>}{message&&<div className="auth-message auth-success">{message}</div>}<Field label="Email address"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@business.com" required/></Field><Field label="Password"><input type="password" minLength="8" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimum 8 characters" required/></Field><Button type="submit" disabled={busy}>{busy?'Please wait…':signup?'Create account':'Log in'}</Button>{!signup&&<button type="button" className="auth-link" onClick={forgot}>Forgot password?</button>}<div className="auth-divider"><span>{signup?'Already have an account?':'New to CoBest?'}</span></div><Button type="button" variant="secondary" onClick={onSwitch}>{signup?'Log in':'Create an account'}</Button></form></div>
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
  const [page,setPage] = useState('dashboard')
  const [cloudReady,setCloudReady] = useState(false)

  useEffect(()=>{
    if(['app','onboarding'].includes(mode) && !isAuthenticated()) setMode('landing')
  },[])

  useEffect(()=>{
    if(!isAuthenticated()) return
    let active=true
    Promise.all([getWorkspace(),listResource('products'),listResource('customers'),listResource('orders'),listResource('media_assets'),listResource('discounts'),listResource('campaigns')]).then(([workspace,cloudProducts,cloudCustomers,cloudOrders,cloudMedia,cloudDiscounts,cloudCampaigns])=>{
      if(!active) return
      if(workspace?.onboarding) setOnboarding(prev=>({...prev,...workspace.onboarding}))
      if(workspace?.editor) setEditor(prev=>({...prev,...workspace.editor}))
      if(Array.isArray(cloudProducts)) setProducts(cloudProducts)
      if(Array.isArray(cloudCustomers)) setCustomers(cloudCustomers)
      if(Array.isArray(cloudOrders)) setOrders(cloudOrders)
      if(Array.isArray(cloudMedia)) setMediaAssets(cloudMedia)
      if(Array.isArray(cloudDiscounts)) setDiscounts(cloudDiscounts)
      if(Array.isArray(cloudCampaigns)) setCampaigns(cloudCampaigns)
      setCloudReady(true)
    }).catch(()=>setCloudReady(true))
    return ()=>{active=false}
  },[mode])

  useEffect(()=>{
    if(!cloudReady || !isAuthenticated()) return
    const timer=setTimeout(()=>saveWorkspace({onboarding,editor,settings:{lastPage:page}}).catch(()=>{}),700)
    return ()=>clearTimeout(timer)
  },[onboarding,editor,page,cloudReady])

  const complete = () => { setMode('app'); setPage('dashboard'); window.scrollTo(0,0) }
  const start = () => { setMode(isAuthenticated()?'onboarding':'signup'); window.scrollTo(0,0) }
  const authSuccess=(next)=>{ setMode(next); setPage('dashboard'); window.scrollTo(0,0) }
  const signOut=()=>{ logout(); setMode('landing'); setPage('dashboard') }
  const addProduct=async(draft)=>{
    const created=await createResource('products',{name:draft.name,price:Number(draft.price||0),inventory:Number(draft.inventory||0),category:draft.category||'Uncategorized',status:draft.status||'Draft'})
    if(created) setProducts(prev=>[created,...prev.filter(x=>x.id!==created.id)])
    return created
  }
  const addCustomer=async(draft)=>{
    const created=await createResource('customers',draft)
    if(created) setCustomers(prev=>[created,...prev])
    return created
  }
  const addOrder=async(draft)=>{
    const created=await createResource('orders',draft)
    if(created) setOrders(prev=>[created,...prev])
    return created
  }
  const addMedia=async(draft)=>{
    const created=await createResource('media_assets',draft)
    if(created) setMediaAssets(prev=>[created,...prev])
  }
  const addDiscount=async(draft)=>{
    const created=await createResource('discounts',draft)
    if(created) setDiscounts(prev=>[created,...prev])
  }
  const addCampaign=async(draft)=>{
    const created=await createResource('campaigns',draft)
    if(created) setCampaigns(prev=>[created,...prev])
  }

  if(mode==='landing') return <Landing onStart={start} onLogin={()=>setMode('login')}/>
  if(mode==='login') return <Auth variant="login" onSuccess={authSuccess} onBack={()=>setMode('landing')} onSwitch={()=>setMode('signup')}/>
  if(mode==='signup') return <Auth variant="signup" onSuccess={authSuccess} onBack={()=>setMode('landing')} onSwitch={()=>setMode('login')}/>
  if(mode==='onboarding') return <Onboarding data={onboarding} setData={setOnboarding} onComplete={complete} onExit={()=>setMode('landing')}/>
  let content = null
  if(page==='dashboard') content=<Dashboard data={onboarding} products={products} customers={customers} orders={orders} setPage={setPage}/>
  if(page==='brief') content=<Brief data={onboarding}/>
  if(page==='products') content=<Products products={products} setProducts={setProducts} onCreate={addProduct}/>
  if(page==='pages') content=<OnlineStorePage pages={onboarding.pages} setPages={pages=>setOnboarding(prev=>({...prev,pages}))} setPage={setPage}/>
  if(page==='media') content=<OperationsPage type="media" items={mediaAssets} onCreate={addMedia}/>
  if(page==='orders') content=<OperationsPage type="orders" orders={orders} customers={customers} onCreate={addOrder}/>
  if(page==='customers') content=<OperationsPage type="customers" customers={customers} orders={orders} onCreate={addCustomer}/>
  if(page==='analytics') content=<OperationsPage type="analytics" orders={orders} customers={customers}/>
  if(page==='marketing') content=<OperationsPage type="marketing" items={campaigns} onCreate={addCampaign}/>
  if(page==='discounts') content=<OperationsPage type="discounts" items={discounts} onCreate={addDiscount}/>
  if(page==='editor') content=<Editor data={onboarding} products={products} editor={editor} setEditor={setEditor}/>
  if(page==='storefront') content=<StorefrontPage data={onboarding} products={products} editor={editor} onCreateCustomer={addCustomer} onCreateOrder={addOrder}/>
  return <AppShell page={page} setPage={setPage} businessName={onboarding.businessName} onRestart={start} onSignOut={signOut}>{content}</AppShell>
}
