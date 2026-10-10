import React, { useMemo, useState } from 'react'
import { BarChart3, Download } from 'lucide-react'
import { calculateSalesReport } from './salesMetrics.js'
import './sales-report.css'

const money=(amount,currency='PHP')=>{
  try{return new Intl.NumberFormat('en-PH',{style:'currency',currency}).format(amount)}
  catch{return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(amount)}
}
export default function SalesReport({orders=[],products=[],currency='PHP'}){
  const [period,setPeriod]=useState('30')
  const report=useMemo(()=>calculateSalesReport(orders,products,period==='all'?'all':Number(period)),[orders,products,period])
  const max=Math.max(1,...report.dailySales.map(x=>x.total))
  const exportCsv=()=>{
    const lines=[['Date','Paid sales ('+currency+')'],...report.dailySales.map(x=>[x.date,x.total])]
    const csv=lines.map(row=>row.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')).join('\n')
    const file=new Blob([csv],{type:'text/csv;charset=utf-8'})
    const url=URL.createObjectURL(file)
    const a=document.createElement('a')
    a.href=url;a.download='cobest-paid-sales.csv';a.click()
    URL.revokeObjectURL(url)
  }
  return <div className="page-wrap cobest-sales-report">
    <div className="page-head"><div><p className="overline">REPORTS</p><h1>Sales report</h1>
      <p>Track paid-order revenue, order activity, and your top products. No estimated sales or unconfirmed payments.</p></div>
      <div className="page-actions"><select aria-label="Sales report period" className="toolbar-select" value={period} onChange={e=>setPeriod(e.target.value)}>
        <option value="7">Last 7 days</option><option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option><option value="all">All time</option>
      </select><button className="btn btn-secondary" onClick={exportCsv}><Download size={15}/> Export CSV</button></div>
    </div>
    <div className="stat-grid">
      <div className="stat-card"><span>Paid sales</span><strong>{money(report.grossPaidSales,currency)}</strong><small>Revenue recorded on paid orders</small></div>
      <div className="stat-card"><span>Paid orders</span><strong>{report.paidOrders}</strong><small>{report.totalOrders} total orders in period</small></div>
      <div className="stat-card"><span>Average paid order</span><strong>{money(report.averagePaidOrder,currency)}</strong><small>Paid revenue ÷ paid orders</small></div>
      <div className="stat-card"><span>Pending / refunded</span><strong>{report.pendingOrders} / {report.refundedOrders}</strong><small>Excluded from paid revenue</small></div>
    </div>
    <div className="sales-report-grid">
      <section className="panel sales-report-panel">
        <div className="panel-head"><div><span>REVENUE</span><h3>Sales over time</h3></div><BarChart3 size={18}/></div>
        {report.dailySales.length
          ?<div className="sales-report-chart" aria-label="Paid sales by day">{report.dailySales.map(row=>
            <div key={row.date} className="sales-report-bar-row">
              <time>{row.date}</time><div className="sales-report-track"><div style={{width:(100*row.total/max)+'%'}}/></div><strong>{money(row.total,currency)}</strong>
            </div>)}</div>
          :<p className="sales-report-empty">No confirmed paid sales in this period.</p>}
      </section>
      <section className="panel sales-report-panel">
        <div className="panel-head"><div><span>PRODUCTS</span><h3>Top-selling products</h3></div></div>
        {report.topProducts.length?report.topProducts.map(p=><div className="metric-row" key={p.name}>
          <span>{p.name} <small>({p.quantity} sold)</small></span><strong>{money(p.sales,currency)}</strong>
        </div>):<p className="sales-report-empty">Paid order items will appear here.</p>}
      </section>
      <section className="panel sales-report-panel">
        <div className="panel-head"><div><span>CATALOG</span><h3>Paid sales by primary category</h3></div></div>
        {report.salesByCategory.length?report.salesByCategory.map(p=><div className="metric-row" key={p.name}>
          <span>{p.name}</span><strong>{money(p.total,currency)}</strong>
        </div>):<p className="sales-report-empty">Sales by category appear once paid orders include product items.</p>}
      </section>
    </div>
    <p className="sales-report-note">Paid sales use the order totals already recorded in CoBest. This is not a payout, tax, or net-profit report. Confirm payment providers before treating manual or test orders as settled revenue.</p>
  </div>
}
