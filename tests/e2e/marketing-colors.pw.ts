import {expect,test} from '@playwright/test'

test('CoBest homepage speaks to first-time shop owners and leads to creating a shop',async({page})=>{
  await page.goto('/')
  const landing=page.locator('.lp')
  await expect(landing).toBeVisible()
  await expect(page.getByRole('heading',{level:1,name:'Open your online shop today.'})).toBeVisible()
  // The hero picture: a phone showing a shop, with 3D images around it.
  const scene=page.getByRole('img',{name:/example shop on a phone/i})
  await expect(scene).toBeVisible()
  await expect(scene.locator('.lp-float')).toHaveCount(6)
  // Every 3D image and the product photo actually load. Pictures further down
  // the page wait until they are near the screen, so read the page top to bottom first.
  await page.evaluate(async()=>{
    for(let y=0;y<document.documentElement.scrollHeight;y+=500){
      window.scrollTo({top:y,behavior:'instant'})
      await new Promise(resolve=>setTimeout(resolve,80))
    }
    window.scrollTo({top:0,behavior:'instant'})
  })
  const images=await landing.locator('img').evaluateAll(async nodes=>Promise.all(nodes.map(async node=>{
    const image=node as HTMLImageElement
    try{await image.decode()}catch{}
    return {src:image.getAttribute('src'),width:image.naturalWidth}
  })))
  expect(images.length).toBeGreaterThan(15)
  for(const image of images)expect(image.width,image.src||'').toBeGreaterThan(0)
  // One page, six short parts, with one brand colour on the main buttons.
  for(const name of ['Three steps to your first order','Everything a small shop needs, in one place','Start from a theme','Free to start. Upgrade when you’re ready.','Questions people ask','Your shop can be live today.'])
    await expect(page.getByRole('heading',{level:2,name})).toBeVisible()
  const blues=await landing.locator('.lp-btn-primary').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).backgroundColor))
  expect(new Set(blues)).toEqual(new Set(['rgb(43, 89, 230)']))
  // No notes meant for the owner, no dead "resources" links.
  await expect(landing).not.toContainText('You can change these plan names')
  await expect(landing).not.toContainText('Resources')
  await expect(landing.locator('.lp-plan')).toHaveCount(3)
  await expect(landing.locator('.lp-plan.is-featured').getByRole('button')).toHaveText('Get started')
  // Theme links open the no-sign-up demo.
  await expect(page.getByRole('link',{name:'Try Sunday Market'})).toHaveAttribute('href','/demo?theme=market')
  await expect(page.getByRole('link',{name:'Image credits'})).toHaveAttribute('href','/licenses/fluent-emoji-3d.txt')
  // Questions open and close.
  const question=landing.locator('details',{hasText:'Do I need to know how to code?'})
  await question.locator('summary').click()
  await expect(question.getByText('Everything is point and click.')).toBeVisible()
  await landing.locator('.lp-hero').getByRole('button',{name:'Create my shop'}).click()
  await expect(page.getByRole('heading',{name:'Create your shop'})).toBeVisible()
})

test('CoBest homepage fits small phones and keeps the main button in reach',async({page})=>{
  for(const width of [320,390]){
    await page.setViewportSize({width,height:790})
    await page.goto('/')
    await expect(page.locator('.lp-hero h1')).toBeVisible()
    const create=page.locator('.lp-hero').getByRole('button',{name:'Create my shop'})
    await expect(create).toBeInViewport()
    expect((await create.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    await expect(page.getByRole('img',{name:/example shop on a phone/i})).toBeVisible()
    const {scrollWidth,viewport}=await page.evaluate(()=>({
      scrollWidth:document.documentElement.scrollWidth,viewport:window.innerWidth
    }))
    expect(scrollWidth, 'Homepage overflows horizontally at '+width+'px').toBeLessThanOrEqual(viewport+2)
  }
})

test('Log in is one tap away from the homepage',async({page})=>{
  await page.goto('/')
  await page.locator('.lp-nav').getByRole('button',{name:'Log in'}).click()
  await expect(page.getByRole('heading',{name:'Log in to CoBest'})).toBeVisible()
  await expect(page.locator('.auth-page .btn-primary')).toHaveCSS('background-color','rgb(43, 89, 230)')
})
