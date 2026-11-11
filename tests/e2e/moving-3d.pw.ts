import {expect,test,type Page} from '@playwright/test'

// CoBest's own pages use moving 3D pictures. These checks look at what a
// visitor meets: the pictures move by themselves on every device, one button
// pauses them everywhere, the choice is remembered, and on devices that ask
// for less motion nothing follows the pointer or the scroll.

const transformOf=(page:Page,selector:string)=>page.locator(selector).first().evaluate(node=>getComputedStyle(node).transform)
async function isMoving(page:Page,selector:string){
  const before=await transformOf(page,selector)
  await page.waitForTimeout(500)
  return before!==await transformOf(page,selector)
}
const cssAnimationsRunning=(page:Page)=>page.evaluate(()=>document.getAnimations()
  .filter(animation=>animation instanceof CSSAnimation&&animation.playState==='running').length)

async function signIn(page:Page){
  const workspace={id:41,site_name:'Bread Shop',slug:'bread-shop',editor:{},settings:{},onboarding:{businessName:'Bread Shop',pages:['Home'],styles:[],features:[]}}
  await page.addInitScript(()=>{
    localStorage.setItem('cobest-auth-token','mvp-e2e-token')
    localStorage.setItem('cobest-active-site-id','41')
    localStorage.setItem('cobest-v4-mode',JSON.stringify('app'))
  })
  await page.route('**/api/**',route=>{
    const path=new URL(route.request().url()).pathname
    const reply=(data:unknown)=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)})
    if(path==='/api/sites')return reply([{id:41,site_name:'Bread Shop',slug:'bread-shop'}])
    if(path==='/api/workspace')return reply([workspace])
    return reply([])
  })
}

test('homepage hero is a moving 3D scene and one button pauses the whole site',async({page})=>{
  await page.route('**/api/**',route=>route.abort())
  await page.goto('/')
  const scene=page.getByRole('img',{name:/example shop on a phone/i})
  await expect(scene).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-motion','on')
  expect(await page.evaluate(()=>document.documentElement.hasAttribute('data-calm'))).toBe(false)

  // Real depth, not a flat picture: the stage keeps its parts in 3D, the phone
  // has thickness, and the card and coins have a front and a back.
  await expect(scene.locator('.lp-stage')).toHaveCSS('transform-style','preserve-3d')
  await expect(scene.locator('.lp-phone-edge')).toHaveCount(6)
  await expect(scene.locator('.lp-float')).toHaveCount(6)
  await expect(scene.locator('.lp-card3d-front,.lp-card3d-back')).toHaveCount(2)
  await expect(scene.locator('.lp-coin')).toHaveCount(2)
  const depths=await scene.locator('.lp-float').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).getPropertyValue('--z').trim()))
  expect(new Set(depths).size,'pictures sit at different depths').toBeGreaterThanOrEqual(5)

  // It moves on its own.
  expect(await isMoving(page,'.lp-stage'),'the phone sways').toBe(true)
  expect(await isMoving(page,'.lp-coin-spin'),'the coins spin').toBe(true)
  expect(await isMoving(page,'.lp-card3d-spin'),'the card turns').toBe(true)
  expect(await isMoving(page,'.lp-float-bags .i3d-lift'),'the pictures float').toBe(true)

  // It follows the pointer.
  const box=(await scene.boundingBox())!
  await page.mouse.move(box.x+box.width*.9,box.y+box.height*.2)
  await expect.poll(()=>scene.evaluate(node=>Number((node as HTMLElement).style.getPropertyValue('--px')))).toBeGreaterThan(.3)

  // Further down, the rocket is one of the pictures that plays as a short film.
  const rocket=page.locator('.lp-final-art')
  await rocket.scrollIntoViewIfNeeded()
  await expect(rocket.locator('.i3d-moving')).toHaveAttribute('src','/images/3d/rocket-anim.webp')
  await expect(rocket).toHaveClass(/is-moving/)

  // Pause: everything stops, and the choice is remembered on the next visit.
  const footer=page.locator('.lp-footer')
  await footer.getByRole('button',{name:'Pause animations'}).click()
  await expect(page.locator('html')).toHaveAttribute('data-motion','off')
  await expect(footer.getByRole('button',{name:'Play animations'})).toBeVisible()
  await expect.poll(()=>cssAnimationsRunning(page)).toBe(0)
  await expect(page.locator('.i3d-moving')).toHaveCount(0)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-motion','off')
  await expect(scene).toBeVisible()
  expect(await isMoving(page,'.lp-stage')).toBe(false)
  // Paused does not mean missing: every part of the picture is still shown.
  for(const part of ['.lp-phone','.lp-float-bags','.lp-float-package','.lp-float-card','.lp-float-order'])
    await expect(scene.locator(part)).toBeVisible()
  await expect(scene.locator('.lp-order')).toHaveCSS('opacity','1')

  // The same control sits on the picture itself. While paused it says what it
  // does; while playing it shrinks to a small round pause button.
  const onPicture=page.locator('.lp-hero .lp-scene-toggle')
  await expect(onPicture).toHaveAccessibleName('Play animations')
  await expect(onPicture.getByText('Play animations')).toBeVisible()
  expect((await onPicture.boundingBox())!.width).toBeGreaterThan(120)
  await onPicture.click()
  await expect(page.locator('html')).toHaveAttribute('data-motion','on')
  await expect(onPicture).toHaveAccessibleName('Pause animations')
  const round=(await onPicture.boundingBox())!
  expect([Math.round(round.width),Math.round(round.height)]).toEqual([44,44])
  // While the hero is scrolled out of sight it rests, so it costs no battery.
  await footer.getByRole('button',{name:'Pause animations'}).scrollIntoViewIfNeeded()
  await expect(page.locator('.lp-scene')).toHaveClass(/is-offscreen/)
  expect(await isMoving(page,'.lp-coin-spin')).toBe(false)
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}))
  await expect(page.locator('.lp-scene')).not.toHaveClass(/is-offscreen/)
  expect(await isMoving(page,'.lp-coin-spin')).toBe(true)
})

test('devices that ask for less motion still play by themselves, without following the pointer or the scroll',async({page})=>{
  await page.route('**/api/**',route=>route.abort())
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto('/')
  const scene=page.getByRole('img',{name:/example shop on a phone/i})
  await expect(scene).toBeVisible()
  // No click is needed: the page arrives moving.
  await expect(page.locator('html')).toHaveAttribute('data-motion','on')
  await expect(page.locator('html')).toHaveAttribute('data-calm','')
  expect(await isMoving(page,'.lp-stage'),'the phone sways').toBe(true)
  expect(await isMoving(page,'.lp-coin-spin'),'the coins spin').toBe(true)
  expect(await isMoving(page,'.lp-card3d-spin'),'the card turns').toBe(true)
  expect(await isMoving(page,'.lp-float-bags .i3d-lift'),'the pictures float').toBe(true)
  // The short films play too.
  await page.locator('.lp-final-art').scrollIntoViewIfNeeded()
  await expect(page.locator('.lp-final-art .i3d-moving')).toHaveAttribute('src','/images/3d/rocket-anim.webp')
  // What stays off is motion tied to the person's own movement: the scene
  // does not turn with the scroll or tilt under the pointer.
  const follow=()=>scene.evaluate(node=>['--px','--py','--scroll'].map(name=>Number((node as HTMLElement).style.getPropertyValue(name))))
  expect(await follow()).toEqual([0,0,0])
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}))
  const box=(await scene.boundingBox())!
  await page.mouse.move(box.x+box.width*.2,box.y+box.height*.8)
  await page.mouse.move(box.x+box.width*.9,box.y+box.height*.2)
  await page.waitForTimeout(300)
  expect(await follow()).toEqual([0,0,0])

  // Pause stops everything.
  const onPicture=page.locator('.lp-hero .lp-scene-toggle')
  await onPicture.click()
  await expect(page.locator('html')).toHaveAttribute('data-motion','off')
  await expect.poll(()=>cssAnimationsRunning(page)).toBe(0)
  await expect(page.locator('.i3d-moving')).toHaveCount(0)
  // Pressing Play is the person's own choice, so it gives the full version.
  await onPicture.click()
  await expect(page.locator('html')).toHaveAttribute('data-motion','on')
  expect(await page.evaluate(()=>document.documentElement.hasAttribute('data-calm'))).toBe(false)
  await page.mouse.move(box.x+box.width*.2,box.y+box.height*.8)
  await page.mouse.move(box.x+box.width*.9,box.y+box.height*.2)
  await expect.poll(async()=>(await follow())[0]).toBeGreaterThan(.3)
})

test('the dashboard also plays by itself on devices that ask for less motion',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'})
  await signIn(page)
  await page.goto('/')
  await expect(page.getByRole('heading',{name:'Store overview'})).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-motion','on')
  const picture=page.locator('.page-head .page-art')
  await expect(picture).toHaveClass(/is-playing/)
  expect(await isMoving(page,'.page-head .page-art .i3d-lift'),'the page picture plays on arrival').toBe(true)
  await page.locator('.app-nav').getByRole('button',{name:'Orders',exact:true}).click()
  await expect(picture.locator('.i3d-moving')).toHaveAttribute('src','/images/3d/truck-anim.webp')
  await expect(page.getByRole('button',{name:'Pause animations'})).toBeVisible()
})

test('log in, sign up and password pages carry moving pictures that never cover the form',async({page})=>{
  await page.route('**/api/**',route=>route.abort())
  await page.goto('/')
  await page.locator('.lp-nav').getByRole('button',{name:'Log in'}).click()
  await expect(page.getByRole('heading',{name:'Log in to CoBest'})).toBeVisible()
  const pictures=page.locator('.auth-art .i3d')
  await expect(pictures).toHaveCount(4)
  expect(await isMoving(page,'.auth-art .i3d-lift')).toBe(true)
  // The pictures are decoration: they sit behind the card and take no clicks.
  await expect(page.locator('.auth-art')).toHaveCSS('pointer-events','none')
  await expect(page.locator('.auth-art')).toHaveAttribute('aria-hidden','true')
  await page.getByLabel('Email address').fill('owner@example.com')
  await expect(page.getByLabel('Email address')).toHaveValue('owner@example.com')

  await page.getByRole('button',{name:'Create an account'}).click()
  await expect(page.getByRole('heading',{name:'Start with CoBest'})).toBeVisible()
  await expect(pictures).toHaveCount(4)
  await page.getByRole('button',{name:'Log in',exact:true}).last().click()
  await page.getByRole('button',{name:'Forgot password?'}).click()
  await expect(page.getByRole('heading',{name:'Reset your password'})).toBeVisible()
  await expect(page.locator('.auth-art img[src="/images/3d/lock.webp"]')).toBeVisible()

  // The pause link is on these pages too.
  await page.getByRole('button',{name:'Pause animations'}).click()
  await expect(page.locator('html')).toHaveAttribute('data-motion','off')
  expect(await isMoving(page,'.auth-art .i3d-lift')).toBe(false)

  // On a phone the pictures stay clear of the heading and the fields.
  await page.setViewportSize({width:390,height:844})
  const heading=(await page.getByRole('heading',{name:'Reset your password'}).boundingBox())!
  await expect(page.locator('.auth-art-item:visible')).toHaveCount(2)
  // The pictures glide to their phone size, so wait for them to settle.
  await expect.poll(()=>page.locator('.auth-art-item:visible').evaluateAll(nodes=>Math.max(...nodes.map(node=>node.getBoundingClientRect().bottom))),
    {message:'pictures end above the heading'}).toBeLessThanOrEqual(heading.y)
  const {scrollWidth,viewport}=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:window.innerWidth}))
  expect(scrollWidth).toBeLessThanOrEqual(viewport+2)
})

test('dashboard pages show their picture, which plays on arrival and then rests',async({page})=>{
  await signIn(page)
  await page.goto('/')
  await expect(page.getByRole('heading',{name:'Store overview'})).toBeVisible()
  const picture=page.locator('.page-head .page-art')
  await expect(picture.locator('.i3d-still')).toHaveAttribute('src','/images/3d/shopping-bags.webp')
  await expect(picture).toHaveClass(/is-playing/)

  // Each page has its own picture.
  const nav=page.locator('.app-nav')
  for(const [label,file] of [['Customers','handshake'],['Collections','star'],['Publish & domain','rocket'],['Orders','truck']]){
    await nav.getByRole('button',{name:label,exact:true}).click()
    await expect(picture.locator('.i3d-still')).toHaveAttribute('src',`/images/3d/${file}.webp`)
  }
  // The truck is one of the short films: it drives in, then rests as a still picture.
  await expect(picture.locator('.i3d-moving')).toHaveAttribute('src','/images/3d/truck-anim.webp')
  await expect(picture).not.toHaveClass(/is-playing/,{timeout:9000})
  await expect(picture.locator('.i3d-moving')).toHaveCount(0)
  await expect.poll(()=>cssAnimationsRunning(page)).toBe(0)
  // Touching the page header plays it again.
  await page.locator('.page-head').hover()
  await expect(picture).toHaveClass(/is-playing/)

  // Empty lists get a picture instead of a grey box.
  await expect(page.locator('.empty-state .i3d img').first()).toBeVisible()

  // The pause button sits beside Sign out on every dashboard page.
  await page.getByRole('button',{name:'Pause animations'}).click()
  await expect(page.locator('html')).toHaveAttribute('data-motion','off')
  await nav.getByRole('button',{name:'Overview',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Store overview'})).toBeVisible()
  await expect(picture).not.toHaveClass(/is-playing/)
  await expect(picture.locator('.i3d-lift')).toHaveCSS('opacity','1')
  await expect(page.locator('.i3d-moving')).toHaveCount(0)
  // Shortcut tiles keep their pictures while paused.
  await expect(page.locator('.commerce-mvp-shortcut .i3d-still')).toHaveCount(6)
  await page.getByRole('button',{name:'Play animations'}).click()
  await expect(page.locator('html')).toHaveAttribute('data-motion','on')
})

test('every 3D picture on the dashboard loads',async({page})=>{
  await signIn(page)
  const failed:string[]=[]
  page.on('response',response=>{if(response.url().includes('/images/3d/')&&response.status()>=400)failed.push(response.url())})
  await page.goto('/')
  await expect(page.getByRole('heading',{name:'Store overview'})).toBeVisible()
  const nav=page.locator('.app-nav')
  for(const label of ['Orders','Customers','Sales report','Products','Categories & subcategories','Collections','Discounts','Website themes','Publish & domain','My websites']){
    await nav.getByRole('button',{name:label,exact:true}).click()
    const still=page.locator('.page-art .i3d-still').first()
    await expect(still,label).toBeVisible()
    await expect.poll(()=>still.evaluate(node=>(node as HTMLImageElement).naturalWidth),{message:label}).toBeGreaterThan(0)
  }
  expect(failed).toEqual([])
})
