import {expect,test} from '@playwright/test'

test('CoBest homepage has a colorful and readable beginner-first entrance',async({page})=>{
  await page.goto('/')
  const landing=page.locator('.landing')
  await expect(landing).toBeVisible()
  await expect(page.getByRole('heading',{name:/Your products.*Your own shop/i})).toBeVisible()
  await expect(landing.locator('.hero-actions').getByRole('button',{name:'Create my shop'})).toBeVisible()
  await expect(landing.locator('.sample-shop')).toBeVisible()
  await expect(landing.locator('.sample-shop')).toContainText('Everyday enamel mug')
  await expect(landing.locator('.cb-theme-browser')).toHaveCount(2)
  await expect(landing.locator('.cb-usecase')).toHaveCount(3)
  await expect(landing.locator('.marketing-testimonials blockquote')).toHaveCount(0)
  await expect(landing.locator('.announcement')).toHaveCSS('background-image',/linear-gradient/)
  await expect(landing.locator('.hero-copy .hero-gradient')).toHaveText('Your own shop.')
  await expect(landing.locator('.hero-actions .btn-primary')).toHaveCSS('background-image',/linear-gradient/)
  expect(await landing.locator('.sample-shop img').evaluate(async image=>{await (image as HTMLImageElement).decode();return (image as HTMLImageElement).naturalWidth})).toBe(900)
  // Isolated main-branch release still has two themes; three-theme editor stays on draft PR #25.
  await expect(landing.locator('.marketing-template-grid article')).toHaveCount(2)
  const colors=await landing.locator('.feature-grid.four article').evaluateAll(elements=>
    elements.map(element=>getComputedStyle(element).backgroundColor))
  expect(new Set(colors).size).toBeGreaterThan(1)
  await landing.locator('.hero-actions').getByRole('button',{name:'Create my shop'}).click()
  await expect(page.getByRole('heading',{name:'Create your shop'})).toBeVisible()
})

test('CoBest colorful homepage works on small phone viewports',async({page})=>{
  for(const width of [320,390]){
    await page.setViewportSize({width,height:790})
    await page.goto('/')
    await expect(page.locator('.landing .hero-copy h1')).toBeVisible()
    await expect(page.locator('.landing .hero-actions .btn-primary')).toBeVisible()
    await expect(page.locator('.landing .sample-shop')).toBeVisible()
    const {scrollWidth,viewport}=await page.evaluate(()=>({
      scrollWidth:document.documentElement.scrollWidth,viewport:window.innerWidth
    }))
    expect(scrollWidth, 'Homepage overflows horizontally at '+width+'px').toBeLessThanOrEqual(viewport+2)
  }
})
