import { describe, expect, it } from 'vitest'
import { calculateSalesReport } from '../src/salesMetrics.js'

const now=Date.parse('2026-10-10T12:00:00Z')
const orders=[
  {id:1,created_at:'2026-10-10T10:00:00Z',payment_status:'Paid',total:1200,items:[{product_id:1,name:'Lamp',quantity:2,line_total:1200}]},
  {id:2,created_at:'2026-10-10T11:00:00Z',payment_status:'Pending',total:5000,items:[{product_id:1,name:'Lamp',quantity:1,line_total:5000}]},
  {id:3,created_at:'2026-10-10T11:30:00Z',payment_status:'Refunded',total:600,items:[]},
  {id:4,created_at:'2026-08-01T11:00:00Z',payment_status:'Paid',total:700,items:[]},
]
describe('MVP sales report',()=>{
  it('counts confirmed paid order totals, never pending/refunded amounts',()=>{
    const report=calculateSalesReport(orders,[{id:1,category:'Home / Lighting'}],30,now)
    expect(report.grossPaidSales).toBe(1200)
    expect(report.totalOrders).toBe(3)
    expect(report.paidOrders).toBe(1)
    expect(report.pendingOrders).toBe(1)
    expect(report.refundedOrders).toBe(1)
    expect(report.averagePaidOrder).toBe(1200)
    expect(report.topProducts).toEqual([{name:'Lamp',quantity:2,sales:1200}])
    expect(report.salesByCategory).toEqual([{name:'Home',total:1200}])
  })
  it('supports lifetime totals and empty-state metrics',()=>{
    expect(calculateSalesReport(orders,[], 'all',now).grossPaidSales).toBe(1900)
    const empty=calculateSalesReport([],[],7,now)
    expect(empty.grossPaidSales).toBe(0)
    expect(empty.averagePaidOrder).toBe(0)
    expect(empty.dailySales).toEqual([])
  })
})
