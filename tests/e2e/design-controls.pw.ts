import { expect, test } from '@playwright/test'

// Canvas interactions run at 100% zoom on a wide window so the whole 1440px
// page is on screen (Playwright cannot target elements in a CSS-scaled iframe).
test.use({viewport:{width:2200,height:1100}})
const canvas=(page:import('@playwright/test').Page)=>page.frameLocator('iframe[title="CoBest visual builder canvas"]')

test('heading design: real values shown, font, size and spacing persist',async({page})=>{
  await page.goto('/e2e.html')
  await page.getByRole('button',{name:'Show canvas at actual size'}).click()
  const heading=canvas(page).locator('[data-builder-node="hero-title-home"]')
  await heading.click()
  await page.getByRole('tab',{name:'Design'}).click()
  // The inspector shows the heading's actual rendered size, not a generic default.
  await expect(page.getByRole('spinbutton',{name:'Font size'})).toHaveValue('76')
  await page.getByRole('combobox',{name:'Font family'}).selectOption('"DM Sans", Arial, sans-serif')
  await expect(heading).toHaveCSS('font-family',/DM Sans/)
  await page.getByRole('spinbutton',{name:'Font size'}).fill('45')
  await expect.poll(()=>heading.evaluate(el=>getComputedStyle(el).fontSize)).toBe('45px')
  await page.getByRole('spinbutton',{name:'Padding top'}).fill('19')
  await expect.poll(()=>heading.evaluate(el=>getComputedStyle(el).paddingTop)).toBe('19px')

  // Mobile edits only affect small screens.
  await page.getByRole('group',{name:'Edit for device'}).getByRole('button',{name:/Mobile/}).click()
  await expect(page.getByText(/Editing only mobile and smaller/)).toBeVisible()

  await page.getByRole('button',{name:'Save',exact:true}).click()
  await expect(page.locator('.vb-save-status')).toHaveText('Saved')
  await page.reload()
  await page.getByRole('button',{name:'Show canvas at actual size'}).click()
  await page.getByRole('group',{name:'Edit for device'}).getByRole('button',{name:/Desktop/}).click()
  await expect(canvas(page).locator('[data-builder-node="hero-title-home"]')).toHaveCSS('padding-top','19px')
})

test('section backgrounds and adding a ready-made section',async({page})=>{
  await page.goto('/e2e.html')
  await page.getByRole('button',{name:'Show canvas at actual size'}).click()
  const hero=canvas(page).locator('[data-builder-node="hero-home"]')
  await canvas(page).locator('[data-builder-node="hero-title-home"]').click()
  await page.getByRole('navigation',{name:'Selected element hierarchy'}).getByRole('button',{name:'Select Hero',exact:true}).click()
  await expect(hero).toHaveClass(/builder-selected/)
  // Sections open on the Design tab.
  await expect(page.getByRole('tab',{name:'Design'})).toHaveAttribute('aria-selected','true')
  const design=page.getByRole('group',{name:'Background type'})
  await design.getByRole('button',{name:'Gradient'}).click()
  await expect(hero).toHaveCSS('background-image',/linear-gradient/)
  await page.getByRole('slider',{name:'Gradient angle'}).fill('160')
  await expect.poll(()=>hero.evaluate(el=>getComputedStyle(el).backgroundImage)).toContain('160deg')
  await design.getByRole('button',{name:'Solid'}).click()
  await expect(hero).toHaveCSS('background-image','none')

  // Sections are added right after the section being edited.
  await expect(page.getByText('Adds after “Hero”')).toBeVisible()
  await page.locator('.ee-section-card',{hasText:'FAQ accordion'}).click()
  const faq=canvas(page).locator('[data-builder-name="FAQ"]')
  await expect(faq).toBeVisible()
  const order=await canvas(page).locator('main > [data-builder-node]').evaluateAll(nodes=>nodes.map(n=>(n as HTMLElement).dataset.builderName))
  expect(order.indexOf('FAQ')).toBe(order.indexOf('Hero')+1)
})
