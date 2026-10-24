import {expect,test} from '@playwright/test'

test('CoBest homepage has a colorful and readable beginner-first entrance',async({page})=>{
  await page.goto('/')
  const landing=page.locator('.landing')
  await expect(landing).toBeVisible()
  await expect(page.getByRole('heading',{name:/Make your business impossible to ignore/i})).toBeVisible()
  await expect(landing.locator('.hero-actions').getByRole('button',{name:'Create my website'})).toBeVisible()
  await expect(landing.locator('.cb-demo-store')).toBeVisible()
  await expect(landing.locator('.cb-demo-store')).toContainText('Little things. Big personality.')
  await expect(landing.locator('.cb-theme-browser')).toHaveCount(2)
  await expect(landing.locator('.cb-usecase')).toHaveCount(3)
  await expect(landing.locator('.marketing-testimonials blockquote')).toHaveCount(0)
  await expect(landing.locator('.announcement')).toHaveCSS('background-image',/linear-gradient/)
  await expect(landing.locator('.hero-copy .hero-gradient')).toHaveText('impossible to ignore.')
  await expect(landing.locator('.hero-actions .btn-primary')).toHaveCSS('background-image',/linear-gradient/)
  // Isolated main-branch release still has two themes; three-theme editor stays on draft PR #25.
  await expect(landing.locator('.marketing-template-grid article')).toHaveCount(2)
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
    await expect(page.locator('.landing .cb-demo-store')).toBeVisible()
    const {scrollWidth,viewport}=await page.evaluate(()=>({
      scrollWidth:document.documentElement.scrollWidth,viewport:window.innerWidth
    }))
    expect(scrollWidth, 'Homepage overflows horizontally at '+width+'px').toBeLessThanOrEqual(viewport+2)
  }
})
