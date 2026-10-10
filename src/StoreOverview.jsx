import React from 'react'
import { ArrowRight, BarChart3, Boxes, LayoutTemplate, Package, ShoppingBag, Users } from 'lucide-react'
import './store-overview.css'

const fmt=(amount,currency)=>{
  try{return new Intl.NumberFormat('en-PH',{style:'currency',currency}).format(amount)}
  catch{return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(amount)}
}
export default function StoreOverview({products=[],orders=[],customers=[],currency='PHP',project,onNavigate}){
  const paid=orders.filter(o=>String(o.payment_status||'').toLowerCase()==='paid')
  const grossPaidSales=paid.reduce((sum,o)=>sum+Math.max(0,Number(o.total)||0),0)
  const quick=[
    {name:'Manage products',note:'Names, prices, photos, inventory and variants',icon:Package,to:'products'},
    {name:'Categories & subcategories',note:'Organize your catalog in two levels',icon:Boxes,to:'taxonomy'},
    {name:'Orders',note:'Review payment and fulfillment status',icon:ShoppingBag,to:'orders'},
    {name:'Sales report',note:'Paid sales, order totals and top products',icon:BarChart3,to:'sales-report'},
    {name:'Customers',note:'Contacts and purchase history',icon:Users,to:'customers'},
    {name:'Website themes',note:'Simple or Professional, editable in the builder',icon:LayoutTemplate,to:'website'},
  ]
  return <div className="page-wrap commerce-mvp-home">
    <div className="page-head"><div><p className="overline">YOUR STORE</p><h1>Store overview</h1>
      <p>Manage your website, products, categories, orders and sales from one place.</p></div>
      <div className="page-actions"><button className="btn btn-primary" onClick={()=>onNavigate(project?.pages?.length?'editor':'website')}>{project?.pages?.length?'Edit website':'Choose website template'} <ArrowRight size={15}/></button></div>
    </div>
    <div className="stat-grid">
      <div className="stat-card"><span>Paid sales</span><strong>{fmt(grossPaidSales,currency)}</strong><small>Recorded paid-order totals</small></div>
      <div className="stat-card"><span>Orders</span><strong>{orders.length}</strong><small>{paid.length} paid</small></div>
      <div className="stat-card"><span>Products</span><strong>{products.length}</strong><small>{products.filter(p=>p.status==='Active').length} active</small></div>
      <div className="stat-card"><span>Customers</span><strong>{customers.length}</strong><small>Stored customer profiles</small></div>
    </div>
    <div className="commerce-mvp-section"><h2>Manage your store</h2><p>Start with the essentials. Advanced features remain available in the codebase for later.</p></div>
    <div className="commerce-mvp-shortcuts">{quick.map(({name,note,icon:Icon,to})=>
      <button key={to} onClick={()=>onNavigate(to)} className="commerce-mvp-shortcut">
        <span className="commerce-mvp-shortcut-icon"><Icon size={20}/></span>
        <span><strong>{name}</strong><small>{note}</small></span>
        <ArrowRight size={17}/>
      </button>)}
    </div>
    <p className="commerce-mvp-disclaimer">Sales figures include only orders marked Paid. Payment-provider confirmation is required before relying on them as settled revenue.</p>
  </div>
}
