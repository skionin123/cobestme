import { expect, test } from '@playwright/test'

test('store MVP: primary category, subcategory, product, and paid sales',async({page})=>{
  let nextId=100
  const catalog:any[]=[]
  const products:any[]=[]
  const orders=[{
    id:1,order_number:'COB-1001',payment_status:'Paid',fulfillment_status:'Unfulfilled',
    created_at:new Date().toISOString(),total:1200,
    items:[{product_id:100,name:'Desk Lamp',quantity:2,line_total:1200}]
  }]
  const workspace={id:41,site_name:'Example Store',slug:'example-store',editor:{},
    onboarding:{businessName:'Example Store',pages:['Home'],styles:[],features:[]},settings:{}}
  await page.addInitScript(()=>{
    localStorage.setItem('cobest-auth-token','mvp-e2e-token')
    localStorage.setItem('cobest-active-site-id','41')
    localStorage.setItem('cobest-v4-mode',JSON.stringify('app'))
  })
  await page.route('**/api/**',async route=>{
    const request=route.request()
    const path=new URL(request.url()).pathname
    const respond=(data:any)=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)})
    if(path==='/api/sites')return respond([{id:41,site_name:'Example Store',slug:'example-store'}])
    if(path==='/api/workspace')return respond([workspace])
    if(path==='/api/data/catalog_terms'){
      if(request.method()==='GET')return respond(catalog)
      if(request.method()==='POST'){
        const term={id:++nextId,...request.postDataJSON()}
        catalog.push(term)
        return respond([term])
      }
    }
    if(path==='/api/data/products'){
      if(request.method()==='GET')return respond(products)
      if(request.method()==='POST'){
        const product={id:100,...request.postDataJSON()}
        products.push(product)
        return respond([product])
      }
    }
    if(path==='/api/data/orders')return respond(orders)
    if(path.startsWith('/api/data/'))return respond([])
    return respond([])
  })
  await page.goto('/')
  await expect(page.getByRole('heading',{name:'Store overview'})).toBeVisible()
  await page.locator('.app-nav').getByRole('button',{name:'Categories & subcategories'}).click()
  await expect(page.getByRole('heading',{name:'Categories & brands'})).toBeVisible()
  await page.getByRole('textbox',{name:'Category or brand name'}).fill('Home')
  await page.getByRole('button',{name:'Add',exact:true}).click()
  await expect.poll(()=>catalog.map(x=>x.name)).toContain('Home')

  await page.getByRole('button',{name:'Subcategories',exact:true}).click()
  await page.getByRole('combobox',{name:'Primary category for subcategory'}).selectOption('Home')
  await page.getByRole('textbox',{name:'Category or brand name'}).fill('Lighting')
  await page.getByRole('button',{name:'Add',exact:true}).click()
  await expect.poll(()=>catalog.map(x=>x.name)).toContain('Home / Lighting')

  await page.locator('.app-nav').getByRole('button',{name:'Products',exact:true}).click()
  await page.getByRole('button',{name:'Add product'}).click()
  await page.getByRole('textbox',{name:'Product name'}).fill('Desk Lamp')
  await page.getByRole('spinbutton',{name:'Price',exact:true}).fill('600')
  await page.getByRole('spinbutton',{name:'Inventory'}).fill('10')
  await page.getByRole('combobox',{name:'Primary category'}).fill('Home')
  await page.getByRole('combobox',{name:'Subcategory'}).fill('Lighting')
  await page.getByRole('button',{name:'Save product'}).click()
  await expect.poll(()=>products.length).toBe(1)
  expect(products[0].category).toBe('Home / Lighting')

  await page.locator('.app-nav').getByRole('button',{name:'Sales report'}).click()
  await expect(page.getByRole('heading',{name:'Sales report'})).toBeVisible()
  await expect(page.getByText('₱1,200.00').first()).toBeVisible()
  await expect(page.getByText('Home',{exact:true})).toBeVisible()
})
