import {expect,test} from '@playwright/test'

test('CoBest homepage has a colorful and readable beginner-first entrance',async({page})=>{
  await page.goto('/')
  const landing=page.locator('.landing')
  await expect(landing).toBeVisible()
  await expect(page.getByRole('heading',{name:/Build your website, your way/i})).toBeVisible()
  await expect(page.getByRole('button',{name:'Start Building Free'})).toBeVisible()
  await expect(landing.locator('.announcement')).toHaveCSS('background-image',/linear-gradient/)
  await expect(landing.locator('.hero-copy .hero-gradient')).toHaveText('your way.')
  await expect(landing.locator('.hero-actions .btn-primary')).toHaveCSS('background-image',/linear-gradient/)
  await expect(landing.locator('.marketing-template-grid article')).toHaveCount(3)
  await expect(landing.locator('.marketing-template-grid')).toContainText('Online Store')
  const colors=await landing.locator('.feature-grid.four article').evaluateAll(elements=>
    elements.map(element=>getComputedStyle(element).backgroundColor))
  expect(new Set(colors).size).toBeGreaterThan(1)
})

test('CoBest colorful homepage works on small phone viewports',async({page})=>{
  for(const width of [320,390]){
    await page.setViewportSize({width,height:790})
    await page.goto('/')
    await expect(page.locator('.landing .hero-copy h1')).toBeVisible()
    await expect(page.locator('.landing .hero-actions .btn-primary')).toBeVisible()
    const {scrollWidth,viewport}=await page.evaluate(()=>({
      scrollWidth:document.documentElement.scrollWidth,viewport:window.innerWidth
    }))
    expect(scrollWidth, 'Homepage overflows horizontally at '+width+'px').toBeLessThanOrEqual(viewport+2)
  }
})
