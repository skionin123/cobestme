import { expect, test } from '@playwright/test'

test('real application shell saves each site and reopens its own builder document',async({page})=>{
  // The real App, auth gate, workspace API adapter, and VisualBuilder are used.
  // Only network responses are faked; this is not a live Supabase account test.
  const workspaces=new Map<number,any>([
    [41,{id:41,site_name:'Alpha Studio',slug:'alpha-studio',editor:{},onboarding:{businessName:'Alpha Studio',pages:['Home'],styles:[],features:[]},settings:{}}],
    [42,{id:42,site_name:'Beta Studio',slug:'beta-studio',editor:{},onboarding:{businessName:'Beta Studio',pages:['Home'],styles:[],features:[]},settings:{}}],
  ])
  const writes:number[]=[]
  const published:any[]=[]
  await page.addInitScript(()=>{
    localStorage.setItem('cobest-auth-token','mvp-e2e-token')
    localStorage.setItem('cobest-active-site-id',localStorage.getItem('cobest-active-site-id')||'41')
    localStorage.setItem('cobest-v4-mode',JSON.stringify('app'))
  })
  await page.route('**/api/**',async route=>{
    const request=route.request()
    const path=new URL(request.url()).pathname
    const siteId=Number(request.headers()['x-cobest-site-id']||'41')
    const reply=(data:unknown)=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)})
    if(path==='/api/sites')return reply(Array.from(workspaces.values()).map(({id,site_name,slug})=>({id,site_name,slug})))
    if(path==='/api/workspace'){
      const existing=workspaces.get(siteId)
      if(request.method()==='GET')return reply(existing?[existing]:[])
      if(request.method()==='PUT'&&existing){
        const body=request.postDataJSON()
        const updated={
          ...existing,...body,
          onboarding:{...existing.onboarding,...(body.onboarding||{})},
          editor:{...existing.editor,...(body.editor||{})},
          settings:{...existing.settings,...(body.settings||{})},
        }
        workspaces.set(siteId,updated)
        writes.push(siteId)
        return reply([updated])
      }
    }
    if(path==='/api/publish'){published.push(request.postDataJSON());return reply({ok:true,slug:'alpha-studio',store_url:'/store/alpha-studio'})}
    if(path.startsWith('/api/data/'))return reply([])
    return reply([])
  })

  await page.goto('/')
  await expect(page.getByRole('heading',{name:'Store overview'})).toBeVisible()
  await expect(page.getByRole('button',{name:'Orders',exact:true})).toBeVisible()
  await expect(page.getByRole('button',{name:'Products',exact:true})).toBeVisible()
  await expect(page.getByRole('button',{name:'Sales report',exact:true})).toBeVisible()
  await expect(page.locator('.app-nav').getByRole('button',{name:'Categories & subcategories',exact:true})).toBeVisible()
  await page.locator('.app-nav').getByRole('button',{name:'Website themes',exact:true}).click()
  await expect(page.getByRole('button',{name:'Use Simple'})).toBeVisible()
  await expect(page.getByRole('button',{name:'Use Professional'})).toBeVisible()
  await page.getByRole('button',{name:'Use Simple'}).click()
  const projectName=page.getByRole('textbox',{name:'Project name'})
  await expect(projectName).toBeVisible()
  await projectName.fill('Alpha Website')
  await page.getByRole('button',{name:'Save',exact:true}).click()
  await expect.poll(()=>workspaces.get(41)?.editor?.visualBuilderProject?.name).toBe('Alpha Website')
  page.on('dialog',dialog=>dialog.accept())
  await page.getByRole('button',{name:'Publish',exact:true}).click()
  await expect.poll(()=>published.length).toBe(1)
  expect(published[0].snapshot.visual_project.name).toBe('Alpha Website')

  await page.reload()
  await page.locator('.app-nav').getByRole('button',{name:'Website themes',exact:true}).click()
  await page.getByRole('button',{name:'Continue editing'}).click()
  await expect(page.getByRole('textbox',{name:'Project name'})).toHaveValue('Alpha Website')

  // A site switch loads the other workspace rather than the previous browser cache.
  await page.evaluate(()=>localStorage.setItem('cobest-active-site-id','42'))
  await page.reload()
  await page.locator('.app-nav').getByRole('button',{name:'Website themes',exact:true}).click()
  await page.getByRole('button',{name:'Use Professional'}).click()
  await expect(page.getByRole('textbox',{name:'Project name'})).not.toHaveValue('Alpha Website')
  await page.getByRole('textbox',{name:'Project name'}).fill('Beta Website')
  await page.getByRole('button',{name:'Save',exact:true}).click()
  await expect.poll(()=>workspaces.get(42)?.editor?.visualBuilderProject?.name).toBe('Beta Website')
  expect(workspaces.get(41)?.editor?.visualBuilderProject?.name).toBe('Alpha Website')
  expect(writes).toContain(41)
  expect(writes).toContain(42)

  await page.evaluate(()=>localStorage.setItem('cobest-active-site-id','41'))
  await page.reload()
  await page.locator('.app-nav').getByRole('button',{name:'Website themes',exact:true}).click()
  await page.getByRole('button',{name:'Continue editing'}).click()
  await expect(page.getByRole('textbox',{name:'Project name'})).toHaveValue('Alpha Website')
  await expect(page.getByRole('button',{name:'Back to dashboard'})).toBeVisible()
  await page.getByRole('button',{name:'Back to dashboard'}).click()
  await expect(page.getByRole('heading',{name:'Store overview'})).toBeVisible()
  await page.locator('.app-nav').getByRole('button',{name:'Website editor',exact:true}).click()
  await expect(page.getByRole('textbox',{name:'Project name'})).toHaveValue('Alpha Website')
})
