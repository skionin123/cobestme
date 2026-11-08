import {expect,test} from '@playwright/test'

test('a new merchant can create a shop, list a product and open its published page',async({page,context})=>{
  let site:any=null
  const products:any[]=[]
  let published:any=null
  let attempts=0
  await context.addInitScript(()=>{
    localStorage.setItem('cobest-auth-token','test-token')
    localStorage.setItem('cobest-v4-mode',JSON.stringify('app'))
  })
  await context.route('**/api/**',async route=>{
    const req=route.request()
    const path=new URL(req.url()).pathname
    const reply=(json:any,status=200)=>route.fulfill({status,json})
    if(path==='/api/sites'&&req.method()==='POST'){
      const name=req.postDataJSON().site_name
      site={id:1,site_name:name,slug:'isla-home',onboarding:{businessName:name},editor:{},settings:{}}
    }
    if(path==='/api/workspace'||path==='/api/sites')return reply(site?[site]:[])
    if(path==='/api/data/products'){
      expect(req.headers()['x-cobest-site-id']).toBe('1')
      if(req.method()==='POST'){
        const row={id:3,...req.postDataJSON()}
        products.push(row)
        return reply([row])
      }
      return reply(products)
    }
    if(path==='/api/publish'){
      if(++attempts===1)return reply({error:'Please retry publishing.'},503)
      published=req.postDataJSON().snapshot
      return reply({ok:true,slug:site.slug,store_url:'/store/isla-home'})
    }
    if(path==='/api/public/store/isla-home')return reply({...published,slug:site.slug})
    return reply([])
  })
  await page.goto('/')
  await page.getByLabel('Shop name').fill('Isla Home')
  await page.getByRole('button',{name:'Create shop',exact:true}).click()
  const publish=page.getByRole('button',{name:'Publish shop',exact:true})
  await expect(publish).toBeDisabled()
  await page.getByLabel('Product name').fill('Ceramic mug')
  await page.getByLabel('Price (PHP)').fill('150')
  await page.getByLabel('Available quantity').fill('4')
  await page.getByRole('button',{name:'Save product',exact:true}).click()
  await publish.click()
  await expect(page.getByRole('alert')).toHaveText('Please retry publishing.')
  await publish.click()
  const popup=page.waitForEvent('popup')
  await page.getByRole('link',{name:'Open shop'}).click()
  const storefront=await popup
  await expect(storefront.getByText('Ceramic mug',{exact:true}).first()).toBeVisible()
  expect(published.products).toMatchObject([{name:'Ceramic mug',inventory:4,price:150,status:'Active'}])
})
