import {expect,test} from '@playwright/test'

test('supplier workspace assigns product source and updates its inventory grouping',async({page})=>{
  let products:any[]=[{id:31,name:'Desk Lamp',sku:'LAMP-31',price:250,inventory:4,
    status:'Active',tags:['supplier:doba'],variants:[]}]
  const workspace={id:41,site_name:'Example Store',slug:'example-store',
    onboarding:{businessName:'Example Store',websiteType:'Shop',pages:['Home'],styles:[],features:[]},
    editor:{},settings:{}}
  await page.addInitScript(()=>{
    localStorage.setItem('cobest-auth-token','supplier-e2e-token')
    localStorage.setItem('cobest-active-site-id','41')
    localStorage.setItem('cobest-v4-mode',JSON.stringify('app'))
  })
  await page.route('**/api/**',async route=>{
    const req=route.request(),path=new URL(req.url()).pathname
    const respond=(payload:unknown)=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)})
    if(path==='/api/sites')return respond([{id:41,site_name:'Example Store',slug:'example-store'}])
    if(path==='/api/workspace')return respond([workspace])
    if(path==='/api/data/products'&&req.method()==='GET')return respond(products)
    if(path==='/api/data/products/31'&&req.method()==='PATCH'){
      const updated={...products[0],...req.postDataJSON()}
      products=[updated]
      return respond([updated])
    }
    if(path.startsWith('/api/data/'))return respond([])
    return respond({})
  })
  await page.goto('/')
  await expect(page.getByRole('heading',{name:'Store overview'})).toBeVisible()
  await page.locator('.app-nav').getByRole('button',{name:'Suppliers'}).click()
  await expect(page.getByRole('heading',{name:'Suppliers',exact:true})).toBeVisible()
  await expect(page.getByText('Doba',{exact:true}).first()).toBeVisible()
  await page.getByRole('combobox',{name:'Product to assign'}).selectOption('31')
  await page.getByRole('textbox',{name:'Supplier name'}).fill('CJ Dropshipping')
  await page.getByRole('button',{name:'Save supplier'}).click()
  await expect.poll(()=>products[0].tags).toContain('supplier:cj')
  await expect(page.getByText('Supplier assignment saved.')).toBeVisible()
  await expect(page.getByText('CJ Dropshipping',{exact:true}).first()).toBeVisible()
})
