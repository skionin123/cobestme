import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, ChevronDown, Menu, Minus, Plus, Search, ShoppingBag, Star, Trash2, X } from 'lucide-react'
import { getPublicStore, getPublicStoreByDomain, isAuthenticated, logout, publicAction, publicCustomerAction, signIn, signUp } from './api.js'
import { createPublishedDocument } from './builder/publicDocument'

const money = (value, currency='PHP') => new Intl.NumberFormat('en-PH',{style:'currency',currency,maximumFractionDigits:2}).format(Number(value||0))
const keyFor = slug => `cobest-public-cart-${slug||'store'}`

function Modal({title,onClose,children}) {
  return <div className="modal-backdrop public-modal"><div className="modal"><div className="modal-head"><h3>{title}</h3><button onClick={onClose}><X size={20}/></button></div>{children}</div></div>
}

export default function PublicStore({slug:slugProp,host}) {
  const [store,setStore]=useState(null)
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(true)
  const [page,setPage]=useState('Home')
  const [query,setQuery]=useState('')
  const [category,setCategory]=useState('All')
  const [selectedProduct,setSelectedProduct]=useState(null)
  const [cartOpen,setCartOpen]=useState(false)
  const [checkoutOpen,setCheckoutOpen]=useState(false)
  const [accountOpen,setAccountOpen]=useState(false)
  const [menuOpen,setMenuOpen]=useState(false)
  const [notice,setNotice]=useState('')
  const [cart,setCart]=useState([])

  useEffect(()=>{
    let active=true
    setLoading(true)
    const load = slugProp ? getPublicStore(slugProp) : getPublicStoreByDomain(host)
    load.then(data=>{
      if(!active)return
      setStore(data)
      const saved=localStorage.getItem(keyFor(data.slug))
      if(saved){try{setCart(JSON.parse(saved))}catch{}}
      publicAction('event',{slug:data.slug,event_type:'page_view',path:window.location.pathname,metadata:{page:'Home'}}).catch(()=>{})
    }).catch(err=>setError(err.message)).finally(()=>setLoading(false))
    return()=>{active=false}
  },[slugProp,host])

  useEffect(()=>{
    if(store?.slug) localStorage.setItem(keyFor(store.slug),JSON.stringify(cart))
  },[cart,store?.slug])

  useEffect(()=>{
    if(!store)return
    const meta=store?.editor?.pageMeta?.[page]||{}
    const defaultTitle=store?.settings?.seoTitle||store?.onboarding?.businessName||'Store'
    document.title=meta.seo_title||`${page==='Home'?'':page+' · '}${defaultTitle}`
    let description=document.querySelector('meta[name="description"]')
    if(!description){description=document.createElement('meta');description.setAttribute('name','description');document.head.appendChild(description)}
    description.setAttribute('content',meta.seo_description||store?.settings?.seoDescription||store?.onboarding?.businessDescription||'')
  },[store,page])

  useEffect(()=>{
    if(!store)return
    const params=new URLSearchParams(window.location.search)
    const paypalReturn=params.get('paypal')==='return'
    const paypalOrder=params.get('token')
    const payment=params.get('payment')
    if(paypalReturn&&paypalOrder){
      publicAction('paypal-capture',{paypal_order_id:paypalOrder}).then(()=>{
        setCart([]);setNotice('PayPal payment completed. Your order is confirmed.')
        window.history.replaceState({},document.title,window.location.pathname)
      }).catch(err=>setNotice(`PayPal capture needs attention: ${err.message}`))
    }else if(payment==='success'){
      setCart([]);setNotice('Payment completed. Your order status will update automatically.')
      window.history.replaceState({},document.title,window.location.pathname)
    }else if(payment==='cancelled'){
      setNotice('Payment was cancelled. Your pending order remains available for follow-up.')
      window.history.replaceState({},document.title,window.location.pathname)
    }
  },[store?.slug])

  const products=(store?.products||[]).filter(p=>p.status==='Active')
  const categories=['All',...Array.from(new Set(products.map(p=>p.category).filter(Boolean)))]
  const filtered=products.filter(p=>{
    const q=query.trim().toLowerCase()
    const matchesQ=!q || [p.name,p.description,p.category,p.brand,p.sku].some(v=>String(v||'').toLowerCase().includes(q))
    const matchesCategory=category==='All'||p.category===category
    return matchesQ&&matchesCategory
  })
  const pageMeta=store?.editor?.pageMeta||{}
  const policyPages=[store?.settings?.privacyPolicy&&'Privacy',store?.settings?.termsPolicy&&'Terms',store?.settings?.refundPolicy&&'Refund Policy'].filter(Boolean)
  const pages=Array.from(new Set(['Home',...(store?.pages||store?.onboarding?.pages||[]),'Shop',...policyPages])).filter(p=>p==='Home'||p==='Shop'||policyPages.includes(p)||pageMeta[p]?.visible!==false)
  const headerMenu=Array.isArray(store?.editor?.header?.menu)&&store.editor.header.menu.length?store.editor.header.menu:pages.filter(p=>p!=='Home').slice(0,5)
  const footerMenu=Array.isArray(store?.editor?.footer?.menu)&&store.editor.footer.menu.length?store.editor.footer.menu:[]
  const currency=store?.settings?.currency||'PHP'
  const itemCount=cart.reduce((n,x)=>n+x.quantity,0)
  const subtotal=cart.reduce((sum,x)=>sum+Number(x.price||0)*x.quantity,0)

  const navigate=name=>{
    setPage(name)
    setMenuOpen(false)
    window.scrollTo({top:0,behavior:'smooth'})
    if(store?.slug) publicAction('event',{slug:store.slug,event_type:'page_view',path:window.location.pathname,metadata:{page:name}}).catch(()=>{})
  }
  const add=p=>{
    setCart(prev=>{
      const hit=prev.find(x=>String(x.id)===String(p.id))
      return hit?prev.map(x=>String(x.id)===String(p.id)?{...x,quantity:x.quantity+1}:x):[...prev,{...p,quantity:1}]
    })
    setNotice(`${p.name} added to cart.`)
    setTimeout(()=>setNotice(''),2200)
    if(store?.slug) publicAction('event',{slug:store.slug,event_type:'add_to_cart',path:window.location.pathname,metadata:{product_id:p.id}}).catch(()=>{})
  }
  const qty=(id,delta)=>setCart(prev=>prev.map(x=>String(x.id)===String(id)?{...x,quantity:Math.max(1,x.quantity+delta)}:x))
  const remove=id=>setCart(prev=>prev.filter(x=>String(x.id)!==String(id)))

  if(loading) return <div className="public-store-loading">Loading store…</div>
  if(error||!store) return <div className="public-store-loading"><h1>Store unavailable</h1><p>{error||'This store is not published.'}</p></div>

  const pageData=store?.editor?.pageContent?.[page]||{}
  const features=store?.onboarding?.features||[]
  return <div className="public-store-shell" style={{'--brand':store?.editor?.theme?.ink||store?.onboarding?.primaryColor||'#171717','--paper':store?.editor?.theme?.paper||store?.onboarding?.secondaryColor||'#f4f1eb','--surface':store?.editor?.theme?.surface||'#ffffff','--accent':store?.editor?.theme?.accent||store?.onboarding?.accentColor||'#b69a78','--display-font':store?.editor?.theme?.displayFont||'Georgia, Times New Roman, serif','--heading-weight':store?.editor?.typography?.headingWeight||600,'--body-weight':store?.editor?.typography?.bodyWeight||400,'--nav-weight':store?.editor?.typography?.navWeight||500,'--button-weight':store?.editor?.typography?.buttonWeight||600,'--h1-size':`${store?.editor?.typography?.h1Size||62}px`,'--h2-size':`${store?.editor?.typography?.h2Size||36}px`,'--body-size':`${store?.editor?.typography?.bodySize||16}px`,'--body-line':store?.editor?.typography?.lineHeight||1.6,'--letter-spacing':`${store?.editor?.typography?.letterSpacing||0}px`,fontFamily:store?.editor?.theme?.fontFamily||'Arial, Helvetica, sans-serif'}}>{store?.editor?.customCss?<style>{store.editor.customCss}</style>:null}
    <header className="public-store-header">
      <button className="public-store-menu" onClick={()=>setMenuOpen(v=>!v)}><Menu size={20}/></button>
      <button className="public-store-brand" onClick={()=>navigate('Home')}>{store?.onboarding?.businessName||store?.settings?.siteName||'Store'}</button>
      <nav className={menuOpen?'open':''}>
        {headerMenu.map(p=><button key={p} className={page===p?'active':''} onClick={()=>navigate(p)}>{p}</button>)}
      </nav>
      <div className="public-store-actions"><button className="public-account-button" onClick={()=>setAccountOpen(true)}>Account</button><button onClick={()=>navigate('Shop')}><Search size={18}/></button><button onClick={()=>setCartOpen(true)}><ShoppingBag size={18}/>{itemCount>0&&<b>{itemCount}</b>}</button></div>
    </header>
    {notice&&<div className="public-toast">{notice}</div>}

    {page==='Home'&&<Home store={store} products={products} currency={currency} onShop={()=>navigate('Shop')} onAdd={add}/>}
    {page==='Shop'&&<section className="public-shop-page">
      <div className="public-page-intro"><small>SHOP</small><h1>Products</h1><p>Browse what is currently available.</p></div>
      <div className="public-shop-tools"><label><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products"/></label><label className="public-category"><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select><ChevronDown size={15}/></label></div>
      <ProductGrid products={filtered} currency={currency} onAdd={add} onOpen={setSelectedProduct}/>
    </section>}
    {!['Home','Shop'].includes(page)&&<GenericPage store={store} name={page} data={pageData} features={features} onNavigate={navigate} products={products} currency={currency} onAdd={add}/>} 

    <Newsletter slug={store.slug}/>
    <footer className="public-footer"><strong>{store?.onboarding?.businessName||'Store'}</strong><span>{store?.editor?.footer?.text||'Built with CoBest'}</span><div className="public-footer-links">{footerMenu.map(item=><button key={item} onClick={()=>navigate(item)}>{item}</button>)}{!footerMenu.includes('Contact')&&<button onClick={()=>navigate('Contact')}>Contact</button>}{store?.settings?.privacyPolicy&&<button onClick={()=>navigate('Privacy')}>Privacy</button>}{store?.settings?.termsPolicy&&<button onClick={()=>navigate('Terms')}>Terms</button>}{store?.settings?.refundPolicy&&<button onClick={()=>navigate('Refund Policy')}>Refunds</button>}</div></footer>

    {selectedProduct&&<ProductModal product={selectedProduct} reviews={(store.reviews||[]).filter(r=>String(r.product_id)===String(selectedProduct.id)&&r.status==='Approved')} currency={currency} slug={store.slug} onClose={()=>setSelectedProduct(null)} onAdd={()=>{add(selectedProduct);setSelectedProduct(null)}}/>}
    {cartOpen&&<CartDrawer cart={cart} currency={currency} subtotal={subtotal} onClose={()=>setCartOpen(false)} qty={qty} remove={remove} onCheckout={()=>{setCartOpen(false);setCheckoutOpen(true)}}/>}
    {checkoutOpen&&<Checkout store={store} cart={cart} currency={currency} paymentOptions={store.payment_options||{}} onClose={()=>setCheckoutOpen(false)} onComplete={(order,warning='')=>{setCart([]);setCheckoutOpen(false);setNotice(warning||`Order ${order.order_number} created successfully.`);setTimeout(()=>setNotice(''),8000)}}/>}
    {accountOpen&&<CustomerAccount slug={store.slug} currency={currency} onClose={()=>setAccountOpen(false)}/>}
  </div>
}

function Home({store,products,currency,onShop,onAdd}) {
  const editor=store.editor||{}
  const hero=editor.hero||{}
  const featured=editor.featured||{}
  const story=editor.story||{}
  const blocks=editor.blocks||[]
  return <>
    <section className={`public-hero align-${hero.align||'left'}`}><div><small>{hero.eyebrow||'WELCOME'}</small><h1>{hero.heading||store.onboarding?.businessName||'Welcome'}</h1><p>{hero.body||store.onboarding?.businessDescription}</p><button onClick={onShop}>{hero.button||'Shop now'}</button></div><div className="public-hero-art"/></section>
    <section className="public-section"><div className="public-section-title"><h2>{featured.title||'Featured products'}</h2><button onClick={onShop}>View all</button></div><ProductGrid products={products.slice(0,Math.max(3,Number(featured.columns||3)))} currency={currency} onAdd={onAdd}/></section>
    <section className="public-story"><small>OUR STORY</small><h2>{story.title||store.onboarding?.businessName}</h2><p>{story.body||store.onboarding?.businessDescription}</p></section>
    {blocks.map(block=><ContentBlock key={block.id} block={block} products={products} currency={currency} onAdd={onAdd}/>)}
  </>
}

function ProductGrid({products,currency,onAdd,onOpen}) {
  return <div className="public-products">{products.map(p=><article key={p.id} className="public-product-card">
    <button className="public-product-image" onClick={()=>onOpen?.(p)}>{p.image_url||p.images?.[0]?<img src={p.image_url||p.images?.[0]} alt={p.name}/>:<span>{p.name?.slice(0,1)||'P'}</span>}</button>
    <div><button className="public-product-name" onClick={()=>onOpen?.(p)}>{p.name}</button><p>{p.category||'Product'}</p><strong>{money(p.price,currency)}</strong>{p.compare_at_price&&Number(p.compare_at_price)>Number(p.price)&&<del>{money(p.compare_at_price,currency)}</del>}</div>
    <button className="public-add" onClick={()=>onAdd(p)}>Add to cart</button>
  </article>)}
  {!products.length&&<div className="public-empty">No products match your search.</div>}</div>
}

function ProductModal({product,reviews=[],currency,slug,onClose,onAdd}) {
  const [reviewOpen,setReviewOpen]=useState(false)
  return <Modal title={product.name} onClose={onClose}><div className="public-product-detail">{product.image_url||product.images?.[0]?<img src={product.image_url||product.images?.[0]} alt={product.name}/>:null}<p>{product.description||'Product details will appear here.'}</p><div className="public-detail-price"><strong>{money(product.price,currency)}</strong>{product.inventory!=null&&<span>{product.inventory} in stock</span>}</div>{reviews.length>0&&<div className="public-reviews"><strong>Reviews</strong>{reviews.map(r=><article key={r.id}><span>{'★'.repeat(Number(r.rating||0))}</span><b>{r.author_name}</b><p>{r.body}</p></article>)}</div>}<div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setReviewOpen(true)}>Write review</button><button className="btn btn-primary" onClick={onAdd}>Add to cart</button></div>{reviewOpen&&<ReviewForm slug={slug} product={product} onDone={()=>setReviewOpen(false)}/>}</div></Modal>
}

function CartDrawer({cart,currency,subtotal,onClose,qty,remove,onCheckout}) {
  return <div className="cart-drawer-backdrop" onClick={onClose}><aside className="cart-drawer" onClick={e=>e.stopPropagation()}><div className="cart-drawer-head"><h2>Your cart</h2><button onClick={onClose}><X size={20}/></button></div>{cart.map(x=><div className="cart-line" key={x.id}><div><strong>{x.name}</strong><span>{money(x.price,currency)}</span></div><div className="cart-qty"><button onClick={()=>qty(x.id,-1)}><Minus size={14}/></button><b>{x.quantity}</b><button onClick={()=>qty(x.id,1)}><Plus size={14}/></button><button className="cart-remove" onClick={()=>remove(x.id)}><Trash2 size={15}/></button></div></div>)}{!cart.length&&<p>Your cart is empty.</p>}<div className="cart-total"><span>Subtotal</span><strong>{money(subtotal,currency)}</strong></div><button className="btn btn-primary" disabled={!cart.length} onClick={onCheckout}>Checkout</button></aside></div>
}

function CustomerAccount({slug,currency,onClose}) {
  const [authed,setAuthed]=useState(isAuthenticated())
  const [signupMode,setSignupMode]=useState(false)
  const [credentials,setCredentials]=useState({email:'',password:''})
  const [data,setData]=useState(null)
  const [profile,setProfile]=useState(null)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  const [guest,setGuest]=useState({order_number:'',email:''})
  const [guestOrder,setGuestOrder]=useState(null)

  const loadAccount=async()=>{
    setBusy(true);setError('')
    try{
      await publicCustomerAction('link',{slug})
      const account=await publicCustomerAction('account',{slug})
      setData(account);setProfile(account.customer);setAuthed(true)
    }catch(err){setError(err.message)}
    finally{setBusy(false)}
  }
  useEffect(()=>{if(authed)loadAccount()},[])

  const auth=async e=>{
    e.preventDefault();setBusy(true);setError('');setMessage('')
    try{
      const result=signupMode?await signUp(credentials.email,credentials.password):await signIn(credentials.email,credentials.password)
      if(signupMode&&!result?.access_token){setMessage('Account created. Confirm your email, then return here and log in.');return}
      setAuthed(true)
      await publicCustomerAction('link',{slug})
      const account=await publicCustomerAction('account',{slug})
      setData(account);setProfile(account.customer)
    }catch(err){setError(err.message)}
    finally{setBusy(false)}
  }
  const saveProfile=async()=>{
    setBusy(true);setError('')
    try{
      const updated=await publicCustomerAction('profile',{slug,name:profile.name,phone:profile.phone,address:profile.address||{},marketing_consent:!!profile.marketing_consent})
      setProfile(updated);setData(d=>({...d,customer:updated}));setMessage('Profile saved.')
    }catch(err){setError(err.message)}finally{setBusy(false)}
  }
  const signOut=()=>{logout();setAuthed(false);setData(null);setProfile(null);setMessage('Signed out.')}
  const guestLookup=async()=>{
    setBusy(true);setError('');setGuestOrder(null)
    try{const x=await publicAction('order-lookup',{slug,...guest});setGuestOrder(x.order)}
    catch(err){setError(err.message)}finally{setBusy(false)}
  }

  return <Modal title="Customer account" onClose={onClose}><div className="customer-account">
    {error&&<div className="auth-message auth-error">{error}</div>}{message&&<div className="auth-message auth-success">{message}</div>}
    {!authed&&<><form className="modal-form" onSubmit={auth}><h3>{signupMode?'Create customer account':'Log in'}</h3><Field label="Email"><input type="email" value={credentials.email} onChange={e=>setCredentials({...credentials,email:e.target.value})} required/></Field><Field label="Password"><input type="password" minLength="8" value={credentials.password} onChange={e=>setCredentials({...credentials,password:e.target.value})} required/></Field><button className="btn btn-primary" disabled={busy}>{busy?'Please wait…':signupMode?'Create account':'Log in'}</button><button type="button" className="auth-link" onClick={()=>setSignupMode(v=>!v)}>{signupMode?'Already have an account? Log in':'New customer? Create an account'}</button></form><div className="account-divider"><span>or track an order without an account</span></div><div className="modal-form"><Field label="Order number"><input value={guest.order_number} onChange={e=>setGuest({...guest,order_number:e.target.value.toUpperCase()})} placeholder="CO-XXXXXXXX"/></Field><Field label="Checkout email"><input type="email" value={guest.email} onChange={e=>setGuest({...guest,email:e.target.value})}/></Field><button className="btn btn-secondary" disabled={busy||!guest.order_number||!guest.email} onClick={guestLookup}>Find order</button>{guestOrder&&<OrderResult order={guestOrder} currency={currency}/>}</div></>}
    {authed&&<>{busy&&!data?<p>Loading account…</p>:data&&profile&&<div className="customer-portal"><div className="customer-portal-head"><div><span className="overline">PROFILE</span><h3>{profile.name||profile.email}</h3><p>{profile.email}</p></div><button className="btn btn-secondary" onClick={signOut}>Sign out</button></div><div className="form-grid two"><Field label="Name"><input value={profile.name||''} onChange={e=>setProfile({...profile,name:e.target.value})}/></Field><Field label="Phone"><input value={profile.phone||''} onChange={e=>setProfile({...profile,phone:e.target.value})}/></Field></div><label className="check-row"><input type="checkbox" checked={!!profile.marketing_consent} onChange={e=>setProfile({...profile,marketing_consent:e.target.checked})}/> Email me store updates</label><button className="btn btn-secondary" disabled={busy} onClick={saveProfile}>Save profile</button><div className="customer-portal-orders"><span className="overline">ORDERS</span>{(data.orders||[]).map(order=><OrderResult key={order.id} order={order} currency={currency}/>) }{!(data.orders||[]).length&&<p>No orders yet.</p>}</div></div>}</>}
  </div></Modal>
}

function OrderResult({order,currency}) {
  return <div className="customer-order-result"><div><span>Order</span><strong>{order.order_number}</strong></div><div><span>Placed</span><strong>{new Date(order.created_at).toLocaleString()}</strong></div><div><span>Payment</span><strong>{order.payment_status}</strong></div><div><span>Fulfillment</span><strong>{order.fulfillment_status}</strong></div>{order.tracking_number&&<div><span>Tracking</span><strong>{order.carrier} {order.tracking_number}</strong></div>}<div><span>Total</span><strong>{money(order.total,currency)}</strong></div><div className="customer-order-items">{(order.items||[]).map((x,i)=><span key={i}>{x.quantity} × {x.name}</span>)}</div></div>
}

function OrderLookup({slug,currency,onClose}) {
  const [form,setForm]=useState({order_number:'',email:''})
  const [order,setOrder]=useState(null)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const lookup=async()=>{
    setBusy(true);setError('');setOrder(null)
    try{const data=await publicAction('order-lookup',{slug,...form});setOrder(data.order)}
    catch(err){setError(err.message)}finally{setBusy(false)}
  }
  return <Modal title="Customer order lookup" onClose={onClose}><div className="modal-form"><p>Enter the order number and email used at checkout.</p>{error&&<div className="auth-message auth-error">{error}</div>}<Field label="Order number"><input value={form.order_number} onChange={e=>setForm({...form,order_number:e.target.value.toUpperCase()})} placeholder="CO-XXXXXXXX"/></Field><Field label="Email"><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></Field><button className="btn btn-primary" disabled={busy||!form.order_number||!form.email} onClick={lookup}>{busy?'Looking up…':'Find order'}</button>{order&&<OrderResult order={order} currency={currency}/>} </div></Modal>
}

function Checkout({store,cart,currency,paymentOptions={},onClose,onComplete}) {
  const [buyer,setBuyer]=useState({name:'',email:'',phone:''})
  const [address,setAddress]=useState({line1:'',city:'',region:'',postal_code:'',country:'Philippines'})
  const [discount,setDiscount]=useState('')
  const availableProviders=[paymentOptions.stripe&&'stripe',paymentOptions.paypal&&'paypal'].filter(Boolean)
  const [provider,setProvider]=useState(availableProviders[0]||'manual')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [totals,setTotals]=useState(null)
  const submit=async()=>{
    setBusy(true);setError('')
    try{
      const data=await publicAction('checkout',{slug:store.slug,buyer,shipping_address:address,discount_code:discount,payment_provider:provider==='manual'?'':provider,items:cart.map(x=>({product_id:x.id,quantity:x.quantity}))})
      setTotals(data.totals)
      if(data?.payment?.checkout_url){window.location.assign(data.payment.checkout_url);return}
      onComplete(data.order,data.warning||data?.payment?.error||'')
    }catch(err){setError(err.message)}finally{setBusy(false)}
  }
  return <Modal title="Checkout" onClose={onClose}><div className="modal-form">{error&&<div className="auth-message auth-error">{error}</div>}<div className="form-grid two"><Field label="Name"><input value={buyer.name} onChange={e=>setBuyer({...buyer,name:e.target.value})}/></Field><Field label="Email"><input type="email" value={buyer.email} onChange={e=>setBuyer({...buyer,email:e.target.value})}/></Field></div><Field label="Phone"><input value={buyer.phone} onChange={e=>setBuyer({...buyer,phone:e.target.value})}/></Field><Field label="Address"><input value={address.line1} onChange={e=>setAddress({...address,line1:e.target.value})}/></Field><div className="form-grid two"><Field label="City"><input value={address.city} onChange={e=>setAddress({...address,city:e.target.value})}/></Field><Field label="Region"><input value={address.region} onChange={e=>setAddress({...address,region:e.target.value})}/></Field></div><div className="form-grid two"><Field label="Postal code"><input value={address.postal_code} onChange={e=>setAddress({...address,postal_code:e.target.value})}/></Field><Field label="Discount code"><input value={discount} onChange={e=>setDiscount(e.target.value.toUpperCase())}/></Field></div><Field label="Payment method"><select value={provider} onChange={e=>setProvider(e.target.value)}>{paymentOptions.stripe&&<option value="stripe">Card / Stripe</option>}{paymentOptions.paypal&&<option value="paypal">PayPal</option>}<option value="manual">Manual / pay later</option></select></Field><div className="checkout-note">{provider==='manual'?'Your order will be created with payment Pending.':`You will continue to ${provider==='stripe'?'secure card checkout':'PayPal'} to complete payment.`}</div>{totals&&<strong>{money(totals.total,currency)}</strong>}<div className="modal-actions"><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy||!buyer.name||!buyer.email} onClick={submit}>{busy?'Creating order…':provider==='manual'?'Place order':'Continue to payment'}</button></div></div></Modal>
}

function GenericPage({store,name,data,features,onNavigate,products=[],currency='PHP',onAdd}) {
  if(name==='Contact') return <ContactPage slug={store.slug} email={store?.settings?.contactEmail}/>
  if(name==='Privacy') return <PolicyPage title="Privacy policy" body={store?.settings?.privacyPolicy}/>
  if(name==='Terms') return <PolicyPage title="Terms" body={store?.settings?.termsPolicy}/>
  if(name==='Refund Policy') return <PolicyPage title="Refund policy" body={store?.settings?.refundPolicy}/>
  if(name==='Booking'||(name==='Services'&&features.includes('Booking'))) return <BookingPage slug={store.slug}/>
  if(name==='Gallery') return <main className="public-generic-page"><small>GALLERY</small><h1>{data.title||'Gallery'}</h1><p>{data.body||'A selection from the business.'}</p><div className="public-gallery">{(store.media||[]).filter(x=>String(x.mime_type||'').startsWith('image')).map(x=><img key={x.id} src={x.url} alt={x.name}/>)}</div></main>
  if(name==='Blog') return <main className="public-generic-page public-blog-page"><small>JOURNAL</small><h1>{data.title||'Blog'}</h1><p>{data.body||'Stories, updates, and ideas from the business.'}</p><div className="public-blog-grid">{(store.blog_posts||[]).map(post=><article key={post.id}>{post.featured_image&&<img src={post.featured_image} alt={post.title}/>}<div><span>{post.published_at?new Date(post.published_at).toLocaleDateString():''}</span><h2>{post.title}</h2><p>{post.excerpt}</p><details><summary>Read article</summary><div className="blog-content">{String(post.content||'').split('\n').map((x,i)=><p key={i}>{x}</p>)}</div></details></div></article>)}</div>{!(store.blog_posts||[]).length&&<p>No published posts yet.</p>}</main>
  if(name==='Collections') return <main className="public-generic-page"><small>COLLECTIONS</small><h1>{data.title||'Collections'}</h1><p>{data.body||'Browse curated groups of products.'}</p><div className="public-collection-grid">{(store.collections||[]).map(col=><article key={col.id}><h2>{col.name}</h2><p>{col.description}</p><span>{(col.product_ids||[]).length} products</span><button className="btn btn-primary" onClick={()=>onNavigate('Shop')}>Shop collection</button></article>)}</div></main>
  return <main className="public-generic-page"><small>{name.toUpperCase()}</small><h1>{data.title||name}</h1><p>{data.body||defaultPageBody(name,store)}</p>{(data.blocks||[]).map(b=><ContentBlock key={b.id} block={b} products={products} currency={currency} onAdd={onAdd}/>)}{name==='Collections'&&<button className="btn btn-primary" onClick={()=>onNavigate('Shop')}>Shop products</button>}</main>
}

function defaultPageBody(name,store){
  if(name==='About') return store.onboarding?.businessDescription||'Tell customers about your business.'
  if(name==='FAQ') return 'Add frequently asked questions in the page editor.'
  if(name==='Services') return 'Describe your services and how customers can work with you.'
  return `Edit the ${name} page in CoBest to add your content.`
}

function ContentBlock({block,products=[],currency='PHP',onAdd}) {
  const items=String(block.items||'').split(',').map(x=>x.trim()).filter(Boolean)
  const columns=Number(block.columns||1)
  const visible=(products||[]).filter(x=>x.status==='Active').slice(0,Number(block.productLimit||4))
  const style={background:block.background||'#fff',color:block.text||'#171717',padding:`${block.padding??48}px 5vw`,margin:`${block.margin||0}px 0`,border:`${block.borderWidth||0}px solid ${block.borderColor||'#dddddd'}`,borderRadius:`${block.radius||0}px`,fontSize:`${block.fontSize||16}px`}
  if(block.type==='spacer') return <section className="public-content-block public-block-spacer" style={{...style,minHeight:`${block.padding??48}px`}}/>
  if(block.type==='products') return <section className="public-content-block public-block-products" style={style}><div className="public-block-inner" style={{maxWidth:`${block.maxWidth||1180}px`,margin:'0 auto'}}><div className="public-section-title"><h2>{block.title||'Products'}</h2></div><ProductGrid products={visible} currency={currency} onAdd={onAdd}/></div></section>
  if(block.type==='cta') return <section className="public-content-block public-block-cta" style={style}><div className="public-block-inner" style={{maxWidth:`${block.maxWidth||1180}px`,margin:'0 auto'}}><h2>{block.title}</h2><p>{block.body}</p><a className="btn btn-primary" href={block.buttonLink||'#'}>{block.buttonLabel||'Learn more'}</a></div></section>
  if(block.type==='quote') return <section className="public-content-block public-block-quote" style={style}><div className="public-block-inner" style={{maxWidth:`${block.maxWidth||1180}px`,margin:'0 auto'}}><blockquote>{block.body||block.title}</blockquote>{block.title&&block.body&&<cite>{block.title}</cite>}</div></section>
  return <section className="public-content-block" style={style}><div style={{display:'grid',gridTemplateColumns:block.columnTemplate||`repeat(${columns},minmax(0,1fr))`,gap:`${block.gap??24}px`,maxWidth:`${block.maxWidth||1180}px`,margin:'0 auto'}}>{Array.from({length:columns}).map((_,i)=><div key={i}>{block.type==='image'&&block.imageUrl&&<img src={block.imageUrl} alt={block.title||''}/>}<h2>{block.title}</h2>{block.type==='text'&&<p>{block.body}</p>}{['list','menu'].includes(block.type)&&<ul>{items.map(x=><li key={x}>{x}</li>)}</ul>}{block.type==='image'&&block.body&&<p>{block.body}</p>}</div>)}</div></section>
}

function Newsletter({slug}) {
  const [email,setEmail]=useState('')
  const [done,setDone]=useState(false)
  const submit=async e=>{e.preventDefault();if(!email)return;await publicAction('subscribe',{slug,email});setDone(true);setEmail('')}
  return <section className="public-newsletter"><h2>Stay in the loop.</h2><p>New products, stories, and updates.</p>{done?<span><Check size={16}/> You're subscribed.</span>:<form onSubmit={submit}><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" required/><button>Join</button></form>}</section>
}

function PolicyPage({title,body}) {
  return <main className="public-generic-page policy-page"><small>POLICY</small><h1>{title}</h1><div className="policy-copy">{String(body||'No policy has been published yet.').split('\n').map((p,i)=><p key={i}>{p}</p>)}</div></main>
}

function ContactPage({slug,email}) {
  const [form,setForm]=useState({name:'',email:'',message:''});const [done,setDone]=useState(false);const [error,setError]=useState('')
  const submit=async e=>{e.preventDefault();setError('');try{await publicAction('contact',{slug,...form});setDone(true)}catch(err){setError(err.message)}}
  return <main className="public-generic-page"><small>CONTACT</small><h1>Get in touch.</h1>{email&&<p className="public-contact-email">{email}</p>}{done?<p>Thanks — your message has been received.</p>:<form className="public-form" onSubmit={submit}>{error&&<div className="auth-message auth-error">{error}</div>}<Field label="Name"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field><Field label="Email"><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></Field><Field label="Message"><textarea rows="6" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} required/></Field><button className="btn btn-primary">Send message</button></form>}</main>
}

function BookingPage({slug}) {
  const [form,setForm]=useState({name:'',email:'',phone:'',start_at:'',notes:''});const [done,setDone]=useState(false);const [error,setError]=useState('')
  const submit=async e=>{e.preventDefault();setError('');try{await publicAction('booking',{slug,...form,start_at:new Date(form.start_at).toISOString()});setDone(true)}catch(err){setError(err.message)}}
  return <main className="public-generic-page"><small>BOOKING</small><h1>Book a time.</h1>{done?<p>Your booking request has been received.</p>:<form className="public-form" onSubmit={submit}>{error&&<div className="auth-message auth-error">{error}</div>}<Field label="Name"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></Field><Field label="Email"><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></Field><Field label="Phone"><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></Field><Field label="Date & time"><input type="datetime-local" value={form.start_at} onChange={e=>setForm({...form,start_at:e.target.value})} required/></Field><Field label="Notes"><textarea rows="4" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></Field><button className="btn btn-primary">Request booking</button></form>}</main>
}

function ReviewForm({slug,product,onDone}) {
  const [form,setForm]=useState({name:'',email:'',rating:5,body:''});const [busy,setBusy]=useState(false);const [error,setError]=useState('')
  const submit=async()=>{setBusy(true);setError('');try{await publicAction('review',{slug,product_id:product.id,...form});onDone()}catch(err){setError(err.message)}finally{setBusy(false)}}
  return <div className="review-form">{error&&<div className="auth-message auth-error">{error}</div>}<Field label="Name"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field>
  <Field label="Email"><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></Field>
  <Field label="Rating"><select value={form.rating} onChange={e=>setForm({...form,rating:Number(e.target.value)})}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} stars</option>)}</select></Field>
  <Field label="Review"><textarea rows="4" value={form.body} onChange={e=>setForm({...form,body:e.target.value})}/></Field><button className="btn btn-primary" disabled={busy||!form.name} onClick={submit}>{busy?'Submitting…':'Submit review'}</button></div>
}

function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}
