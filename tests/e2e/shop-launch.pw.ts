import {expect,test} from '@playwright/test'

test('a new merchant can create a shop, list a product and open its published page',async({page,context})=>{
  await page.setViewportSize({width:390,height:844})
  let site:any=null
  const products:any[]=[]
  let published:any=null
  let attempts=0
  let uploads=0
  let saves=0
  const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='
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
    if(path==='/api/workspace'&&req.method()==='PUT'&&site){
      const patch=req.postDataJSON()
      site.editor={...site.editor,...patch.editor}
    }
    if(path==='/api/workspace'||path==='/api/sites')return reply(site?[site]:[])
    if(path==='/api/media/upload'){
      expect(req.headers()['x-cobest-site-id']).toBe('1')
      uploads++
      return reply([{url:photo}])
    }
    if(path==='/api/data/products'){
      expect(req.headers()['x-cobest-site-id']).toBe('1')
      if(req.method()==='POST'){
        if(++saves===1)return reply({error:'Try saving again.'},503)
        const row={id:products.length+3,...req.postDataJSON()}
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
  await page.getByLabel('Product photo (optional)').setInputFiles({
    name:'mug.png',mimeType:'image/png',buffer:Buffer.from(photo.split(',')[1],'base64')
  })
  await page.getByRole('button',{name:'Save product',exact:true}).click()
  await expect(page.getByRole('alert')).toHaveText('Try saving again.')
  await page.getByRole('button',{name:'Save and publish',exact:true}).click()
  await page.getByText('Preview catalog (1)').click()
  await expect(page.getByRole('img',{name:'Ceramic mug'})).toBeVisible()
  expect(uploads).toBe(1)
  await expect(page.getByRole('alert')).toHaveText('Ceramic mug was saved. Please retry publishing. Use Publish shop to retry.')
  expect(products.length).toBe(1)
  await publish.click()
  const popup=page.waitForEvent('popup')
  await page.getByRole('link',{name:'Open shop'}).click()
  const storefront=await popup
  await expect(storefront.getByText('Ceramic mug',{exact:true}).first()).toBeVisible()
  await storefront.getByRole('button',{name:'View Ceramic mug'}).first().click()
  await expect(storefront.getByText('4 in stock')).toBeVisible()
  expect(published.products).toMatchObject([{name:'Ceramic mug',inventory:4,price:150,status:'Active',image_url:photo}])
  await page.getByLabel('Product name').fill('Coaster')
  await page.getByLabel('Price (PHP)').fill('35')
  await page.getByRole('button',{name:'Save product',exact:true}).click()
  await expect(page.getByText('Preview catalog (2)')).toBeVisible()
  expect(published.products).toHaveLength(1)
  await page.getByRole('button',{name:'Publish updates'}).click()
  await expect.poll(()=>published.products.length).toBe(2)
  await page.getByLabel('Product name').fill('Tea set')
  await page.getByLabel('Price (PHP)').fill('400')
  await page.getByRole('button',{name:'Save and publish',exact:true}).click()
  await expect.poll(()=>published.products.length).toBe(3)
  expect(published.products.at(-1).name).toBe('Tea set')
  expect(uploads).toBe(1)
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{
    writeText:async(value:string)=>sessionStorage.setItem('testCopied',value)
  }}))
  await page.getByRole('button',{name:'Copy shop link'}).click()
  await expect(page.getByRole('status')).toHaveText('Shop link copied.')
  expect(await page.evaluate(()=>sessionStorage.getItem('testCopied'))).toBe(new URL('/store/isla-home',page.url()).href)
  await page.getByRole('button',{name:'Edit storefront'}).click()
  await page.getByRole('button',{name:/Midnight Atelier/}).click()
  await page.getByLabel('Headline',{exact:true}).fill('Isla Home Studio')
  await page.getByRole('button',{name:'Publish design'}).click()
  await expect(page.getByRole('status')).toContainText('Design published')
  expect(site.editor.shopDesign.theme).toBe('atelier')
  await storefront.reload()
  await expect(storefront.getByRole('heading',{name:'Isla Home Studio'})).toBeVisible()
  await storefront.getByRole('button',{name:'Ceramic mug',exact:true}).click()
  await expect(storefront.getByText('4 in stock')).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
