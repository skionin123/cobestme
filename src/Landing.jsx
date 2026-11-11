import React,{useRef} from 'react'
import { Check, Plus, ShoppingBag } from 'lucide-react'
import { Icon3D, MotionToggle, art3dSrc, useScene3D } from './Art3D.jsx'
import './landing.css'

// The public cobest.me homepage. Written for people opening their first
// online shop. 3D pictures: Microsoft Fluent Emoji (MIT), see /licenses.
// The phone, payment card and coins are real 3D objects built in CSS.

const steps=[
  ['shopping-bags','Name your shop','Type your shop’s name to begin. You can change it any time.'],
  ['package','Add your products','Upload a photo, set a price, and the product appears in your shop.'],
  ['rocket','Share your link','Publish, then post your shop link on Facebook, Instagram or Messenger.'],
]

const features=[
  ['palette','Themes made for selling','Start from a finished look, then change the words, photos and colours.'],
  ['phone','Looks right on phones','Most customers shop from their phone. Every page adjusts on its own.'],
  ['cart','Orders and customers','See every order and who placed it, and keep track of what needs sending.'],
  ['gift','Discount codes','Create codes for sales and loyal customers. They’re checked at checkout.'],
  ['chart','Sales report','See what sells, how much you made, and how your shop is doing.'],
  ['inbox','Messages in one inbox','Questions sent through your shop’s contact form arrive in CoBest.'],
]

const plans=[
  {name:'Free',price:'₱0',unit:'/ month',note:'For setting up your shop and getting it ready.',
    items:['1 website','Guided onboarding','Website brief','Visual website builder','CoBest storefront address'],cta:'Start free'},
  {name:'Launch',price:'₱990',unit:'/ site / month',note:'For shops ready to sell and run every day.',featured:true,
    items:['Everything in Free','Custom domain','Products and inventory','Orders and customers','Remove CoBest branding'],cta:'Get started'},
  {name:'Growth',price:'₱2,490',unit:'/ site / month',note:'For growing shops that need more people, reporting and support.',
    items:['Everything in Launch','Team access','Advanced analytics','Priority support','Additional publishing controls'],cta:'Get started'},
]

const faqs=[
  ['Do I need to know how to code?','No. You choose a theme, type your words and add photos. Everything is point and click.'],
  ['How much does it cost?','Building your shop is free. Paid plans start at ₱990 per site per month, when you want your own domain and more.'],
  ['Can I use my own domain name?','Yes, on the Launch and Growth plans. Every shop also gets a free CoBest address you can share right away.'],
  ['Does my shop work on phones?','Yes. Every theme adjusts to phones, tablets and computers, and you can check each size before you publish.'],
  ['Can I change my design later?','Yes. Change the theme, words, colours and photos whenever you like, then publish again. Your products and orders stay as they are.'],
  ['Where do customer messages go?','Messages sent through your shop’s contact form arrive in your CoBest Inbox.'],
]

function Mark(){
  return <span className="lp-logo"><span className="lp-logo-mark" aria-hidden="true">C</span>CoBest</span>
}

const layers=count=>Array.from({length:count},(_,index)=>index)

/** A payment card with real thickness that turns in space. */
function Card3D(){
  return <span className="lp-card3d"><span className="lp-card3d-spin">
    {layers(4).map(layer=><i key={layer} className="lp-card3d-edge" style={{'--i':layer}}/>)}
    <i className="lp-card3d-rim"/>
    <span className="lp-card3d-face lp-card3d-front"><i className="lp-card3d-chip"/><b>CoBest</b><em>•••• 4417</em></span>
    <span className="lp-card3d-face lp-card3d-back"><i className="lp-card3d-stripe"/><i className="lp-card3d-sign"/></span>
  </span></span>
}

/** A peso coin that spins. */
function Coin3D({size=56,speed=3.4,delay=0}){
  return <span className="lp-coin" style={{'--coin':size+'px','--coin-speed':speed+'s','--coin-delay':delay+'s'}}><span className="lp-coin-spin">
    {layers(5).map(layer=><i key={layer} className="lp-coin-edge" style={{'--i':layer}}/>)}
    <i className="lp-coin-rim"/>
    <b className="lp-coin-face lp-coin-front">₱</b>
    <b className="lp-coin-face lp-coin-back">₱</b>
  </span></span>
}

/** The hero picture: a 3D scene that turns slowly and follows the pointer and the scroll.
    On devices that ask for less motion it only turns slowly (see Art3D.jsx). */
function HeroScene(){
  const scene=useRef(null)
  useScene3D(scene,{scroll:true})
  return <div className="lp-scene" ref={scene} role="img" aria-label="An example shop on a phone, with a new order coming in">
    <div className="lp-stage-scale"><div className="lp-stage-tilt"><div className="lp-stage">
      <span className="lp-float lp-float-card"><Card3D/></span>
      <div className="lp-phone">
        {layers(6).map(layer=><i key={layer} className="lp-phone-edge" style={{'--i':layer}}/>)}
        <div className="lp-phone-body">
          <div className="lp-phone-screen">
            <div className="lp-shop-bar"><strong>Sunday Studio</strong><ShoppingBag size={16}/></div>
            <img className="lp-shop-photo" src="/images/studio-mug.webp" alt="" width="900" height="600" fetchpriority="high"/>
            <div className="lp-shop-item"><span>Enamel mug</span><b>₱350</b></div>
            <span className="lp-shop-button">Add to cart</span>
            <div className="lp-shop-more"><i/><i/></div>
            <i className="lp-phone-glare"/>
          </div>
        </div>
      </div>
      <span className="lp-float lp-float-bags"><Icon3D name="shopping-bags" size={150} ground={false}/></span>
      <span className="lp-float lp-float-coin-a"><Coin3D size={58}/></span>
      <span className="lp-float lp-float-coin-b"><Coin3D size={40} speed={4.6} delay={-1.3}/></span>
      <span className="lp-float lp-float-package"><Icon3D name="package" size={128} ground={false} delay={-2.4}/></span>
      <span className="lp-float lp-float-order"><span className="lp-order">
        <img src={art3dSrc('check')} alt="" width="40" height="40"/>
        <span><strong>New order</strong><small>Enamel mug, ₱350</small></span>
      </span></span>
    </div></div></div>
    <i className="lp-scene-shadow"/>
  </div>
}

export default function Landing({ onStart, onLogin }){
  return <div className="lp">
    <header className="lp-nav lp-wrap">
      <Mark/>
      <nav aria-label="Main">
        <a href="#features">Features</a><a href="#themes">Themes</a><a href="#pricing">Pricing</a><a href="#questions">Questions</a>
      </nav>
      <div className="lp-nav-actions">
        <button type="button" className="lp-link-button" onClick={onLogin}>Log in</button>
        <button type="button" className="lp-btn lp-btn-primary lp-btn-small" onClick={onStart}>Start free</button>
      </div>
    </header>

    <main>
      <section className="lp-hero">
        <div className="lp-wrap lp-hero-grid">
          <div className="lp-hero-copy">
            <h1>Open your online shop today.</h1>
            <p>Add your products, choose a look, and share one link on Facebook, Instagram or Messenger. Customers can browse and order from any phone.</p>
            <div className="lp-actions">
              <button type="button" className="lp-btn lp-btn-primary" onClick={onStart}>Create my shop</button>
              <a className="lp-btn lp-btn-quiet" href="#themes">See the themes</a>
            </div>
            <ul className="lp-assurance"><li><Check size={16} aria-hidden="true"/>Free to start</li><li><Check size={16} aria-hidden="true"/>No coding</li><li><Check size={16} aria-hidden="true"/>Prices in pesos</li></ul>
          </div>
          <div className="lp-hero-art"><HeroScene/><MotionToggle icon className="lp-scene-toggle"/></div>
        </div>
      </section>

      <section className="lp-steps" aria-labelledby="lp-steps-title">
        <div className="lp-wrap">
          <h2 id="lp-steps-title">Three steps to your first order</h2>
          <ol>{steps.map(([icon,title,text],index)=><li key={title}>
            <span className="lp-step-art"><Icon3D name={icon} size={96} delay={index*-1.7} lazy/><span className="lp-step-number">{index+1}</span></span>
            <h3>{title}</h3><p>{text}</p>
          </li>)}</ol>
        </div>
      </section>

      <section className="lp-features" id="features" aria-labelledby="lp-features-title">
        <div className="lp-wrap lp-features-grid">
          <div className="lp-features-intro">
            <h2 id="lp-features-title">Everything a small shop needs, in one place</h2>
            <p>Your website, products, orders, customers and messages live together, so you never copy things between apps.</p>
            <button type="button" className="lp-btn lp-btn-primary" onClick={onStart}>Create my shop</button>
          </div>
          <ul className="lp-feature-list">{features.map(([icon,title,text],index)=><li key={title}>
            <Icon3D name={icon} size={56} calm ground={false} delay={index*-1.1} lazy/>
            <div><h3>{title}</h3><p>{text}</p></div>
          </li>)}</ul>
        </div>
      </section>

      <section className="lp-themes" id="themes" aria-labelledby="lp-themes-title">
        <div className="lp-wrap">
          <div className="lp-section-head">
            <h2 id="lp-themes-title">Start from a theme</h2>
            <p>Each theme comes with its own colours and type. Swap in your photos and words, and it’s yours.</p>
          </div>
          <div className="lp-theme-grid">
            <article className="lp-theme">
              <div className="lp-theme-art lp-theme-market" aria-hidden="true">
                <div className="lp-theme-top"><b>studio.</b><span>Home</span><span>Shop</span><span>About</span></div>
                <div className="lp-theme-body"><div><small>Make room for new ideas</small><strong>A brighter way to begin.</strong><em>Shop now</em></div><i/></div>
              </div>
              <div className="lp-theme-text"><h3>Sunday Market</h3><p>Bold type, a sunflower cover and raspberry accents.</p></div>
              <a className="lp-theme-link" href="/demo?theme=market">Try Sunday Market</a>
            </article>
            <article className="lp-theme">
              <div className="lp-theme-art lp-theme-atelier" aria-hidden="true">
                <div className="lp-theme-top"><b>Maison</b><span>Home</span><span>Shop</span><span>About</span></div>
                <div className="lp-theme-body"><i/><div><small>An editorial point of view</small><strong>Objects with a story.</strong><em>Explore</em></div></div>
              </div>
              <div className="lp-theme-text"><h3>Midnight Atelier</h3><p>Editorial serif type, midnight ink and an arched cover.</p></div>
              <a className="lp-theme-link" href="/demo?theme=atelier">Try Midnight Atelier</a>
            </article>
          </div>
          <p className="lp-themes-more">Need more pages, like About us or a lookbook? Design them in the Advanced editor, on a computer or your phone.</p>
        </div>
      </section>

      <section className="lp-pricing" id="pricing" aria-labelledby="lp-pricing-title">
        <div className="lp-wrap">
          <div className="lp-section-head">
            <h2 id="lp-pricing-title">Free to start. Upgrade when you’re ready.</h2>
            <p>Build and preview your shop without a card. Prices are in Philippine pesos.</p>
          </div>
          <div className="lp-plan-grid">{plans.map(plan=><article key={plan.name} className={'lp-plan'+(plan.featured?' is-featured':'')}>
            {plan.featured&&<span className="lp-plan-badge">Most popular</span>}
            <h3>{plan.name}</h3>
            <p className="lp-plan-price"><strong>{plan.price}</strong><span>{plan.unit}</span></p>
            <p className="lp-plan-note">{plan.note}</p>
            <ul>{plan.items.map(item=><li key={item}><Check size={16} aria-hidden="true"/>{item}</li>)}</ul>
            <button type="button" className={'lp-btn '+(plan.featured?'lp-btn-primary':'lp-btn-outline')} onClick={onStart}>{plan.cta}</button>
          </article>)}</div>
        </div>
      </section>

      <section className="lp-faq" id="questions" aria-labelledby="lp-faq-title">
        <div className="lp-wrap lp-faq-grid">
          <div className="lp-faq-side">
            <h2 id="lp-faq-title">Questions people ask</h2>
            <Icon3D name="bulb" size={136} delay={-1} lazy className="lp-faq-art"/>
          </div>
          <div>{faqs.map(([question,answer])=><details key={question}>
            <summary>{question}<Plus size={18} aria-hidden="true"/></summary>
            <p>{answer}</p>
          </details>)}</div>
        </div>
      </section>

      <section className="lp-final" aria-labelledby="lp-final-title">
        <div className="lp-wrap lp-final-inner">
          <Icon3D name="rocket" size={132} ground={false} lazy className="lp-final-art"/>
          <div>
            <h2 id="lp-final-title">Your shop can be live today.</h2>
            <p>Start free. Add a product, publish, and share your link.</p>
          </div>
          <button type="button" className="lp-btn lp-btn-light" onClick={onStart}>Create my shop</button>
        </div>
      </section>
    </main>

    <footer className="lp-footer lp-wrap">
      <Mark/>
      <p>Online shops for small businesses.</p>
      <nav aria-label="Footer"><a href="#features">Features</a><a href="#pricing">Pricing</a><button type="button" className="lp-link-button" onClick={onLogin}>Log in</button><a href="/licenses/fluent-emoji-3d.txt">Image credits</a><MotionToggle className="lp-link-button"/></nav>
    </footer>
  </div>
}
