const validNumber=value=>{const number=Number(value);return Number.isFinite(number)?number:0}
const dateOf=order=>Date.parse(order.created_at||order.createdAt||order.placed_at||'')
const dayOf=date=>new Date(date).toISOString().slice(0,10)

export function calculateSalesReport(orders=[],products=[],days=30,now=Date.now()){
  const cutoff=days==='all'?null:now-Number(days)*86400000
  const scoped=orders.filter(o=>{
    const date=dateOf(o)
    return cutoff==null||(Number.isFinite(date)&&date>=cutoff&&date<=now)
  })
  const paid=scoped.filter(o=>String(o.payment_status||'').toLowerCase()==='paid')
  const grossPaidSales=paid.reduce((s,o)=>s+Math.max(0,validNumber(o.total)),0)
  const dated=new Map()
  const topProducts=new Map()
  const categorySales=new Map()
  const catalog=new Map(products.map(p=>[String(p.id),p]))
  for(const order of paid){
    const date=dateOf(order)
    if(Number.isFinite(date)){
      const key=dayOf(date)
      dated.set(key,(dated.get(key)||0)+Math.max(0,validNumber(order.total)))
    }
    for(const item of (Array.isArray(order.items)?order.items:[])){
      const product=catalog.get(String(item.product_id))
      const key=String(item.name||product?.name||'Unnamed product')
      const qty=Math.max(0,validNumber(item.quantity))
      const amount=Math.max(0,validNumber(item.line_total??(qty*validNumber(item.price??item.unit_price??product?.price))))
      const old=topProducts.get(key)||{name:key,quantity:0,sales:0}
      topProducts.set(key,{name:key,quantity:old.quantity+qty,sales:old.sales+amount})
      const category=String(product?.category||'Uncategorized').split(' / ')[0]
      categorySales.set(category,(categorySales.get(category)||0)+amount)
    }
  }
  return {
    grossPaidSales,
    paidOrders:paid.length,
    totalOrders:scoped.length,
    pendingOrders:scoped.filter(o=>String(o.payment_status||'').toLowerCase()==='pending').length,
    refundedOrders:scoped.filter(o=>String(o.payment_status||'').toLowerCase()==='refunded').length,
    averagePaidOrder:paid.length?grossPaidSales/paid.length:0,
    dailySales:[...dated.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([date,total])=>({date,total})),
    topProducts:[...topProducts.values()].sort((a,b)=>b.sales-a.sales).slice(0,8),
    salesByCategory:[...categorySales.entries()].sort((a,b)=>b[1]-a[1]).map(([name,total])=>({name,total})),
  }
}
