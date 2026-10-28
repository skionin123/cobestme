import {expect,test} from '@playwright/test'

const canvas=(page:import('@playwright/test').Page)=>
  page.frameLocator('iframe[title="CoBest visual builder canvas"]')

test('beginner selects content first and can style a section in one click',async({page})=>{
  await page.goto('/e2e.html')
  const heading=canvas(page).locator('[data-builder-node="hero-title-home"]')
  const hero=canvas(page).locator('[data-builder-node="hero-home"]')
  await heading.click()
  await expect(page.getByRole('button',{name:'Content',exact:true})).toHaveClass(/active/)
  await expect(page.getByRole('button',{name:'Design',exact:true})).toBeVisible()
  await page.getByRole('navigation',{name:'Selected element hierarchy'})
    .getByRole('button',{name:'Select Hero',exact:true}).click()
  await page.getByRole('button',{name:'Design',exact:true}).click()
  const original=await hero.evaluate(el=>getComputedStyle(el).backgroundImage)
  await page.getByRole('button',{name:'Apply Ocean color style'}).click()
  await expect(hero).toHaveCSS('background-image',/linear-gradient/)
  await expect.poll(()=>hero.evaluate(el=>getComputedStyle(el).backgroundImage))
    .toContain('207, 234, 255')
  await page.getByRole('button',{name:'Undo',exact:true}).click()
  await expect.poll(()=>hero.evaluate(el=>getComputedStyle(el).backgroundImage)).toBe(original)
  await page.getByRole('button',{name:'Apply Midnight color style'}).click()
  await page.getByRole('button',{name:'Reset to theme style'}).click()
  await expect.poll(()=>hero.evaluate(el=>getComputedStyle(el).backgroundImage)).toBe(original)
})

test.describe('phone-friendly inspector',()=>{
  test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true})
  test('tap heading opens Content sheet rather than advanced styles',async({page})=>{
    await page.goto('/e2e.html')
    await canvas(page).locator('[data-builder-node="hero-title-home"]').click()
    await expect(page.locator('.vb-right')).toHaveClass(/vb-mobile-open/)
    await expect(page.getByRole('button',{name:'Content',exact:true})).toHaveClass(/active/)
    await expect(page.getByRole('button',{name:'Phone Edit content'})).toHaveAttribute('aria-pressed','true')
  })
})
