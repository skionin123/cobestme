import {expect,test} from '@playwright/test'

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true})

const canvas=(page:import('@playwright/test').Page)=>
  page.frameLocator('iframe[title="CoBest visual builder canvas"]')

test('phone editing has visible Add, Style, Undo, Redo, Save and safe start over',async({page})=>{
  await page.goto('/e2e.html')
  const tools=page.getByRole('navigation',{name:'Phone website editing tools'})
  await expect(tools).toBeVisible()
  await expect(page.getByRole('button',{name:'Start over with starter design'})).toBeVisible()
  await expect(tools.getByRole('button',{name:'Phone Add elements'})).toBeVisible()
  await expect(canvas(page).locator('[data-builder-type="heading"]').first()).toBeVisible()
  const headings=canvas(page).locator('[data-builder-type="heading"]')
  const original=await headings.count()

  await tools.getByRole('button',{name:'Phone Add elements'}).click()
  await expect(page.getByRole('button',{name:'Add Heading'})).toBeVisible()
  await page.getByRole('button',{name:'Add Heading'}).click()
  await expect(headings).toHaveCount(original+1)
  await tools.getByRole('button',{name:'Phone Undo'}).click()
  await expect(headings).toHaveCount(original)
  await tools.getByRole('button',{name:'Phone Redo'}).click()
  await expect(headings).toHaveCount(original+1)

  page.once('dialog',d=>d.accept())
  await page.getByRole('button',{name:'Start over with starter design'}).click()
  await expect(headings).toHaveCount(original)
  await tools.getByRole('button',{name:'Phone Undo'}).click()
  await expect(headings).toHaveCount(original+1)

  await tools.getByRole('button',{name:'Phone Style'}).click()
  await expect(page.locator('.vb-right.vb-mobile-open')).toBeVisible()
  await tools.getByRole('button',{name:'Phone Layers'}).click()
  await expect(page.locator('.vb-left.vb-mobile-open')).toBeVisible()
  await tools.getByRole('button',{name:'Phone Save'}).click()
  await expect(page.locator('.vb-save-status')).toHaveText('Saved')
  await page.getByRole('button',{name:'Preview',exact:true}).click()
  await expect(page.frameLocator('iframe[title="CoBest preview"]').locator('body')).toBeVisible()
  await page.getByRole('button',{name:'Exit preview'}).click()
})

test('tap a ready-made design section on phone and retain it after save',async({page})=>{
  await page.goto('/e2e.html')
  const tools=page.getByRole('navigation',{name:'Phone website editing tools'})
  await tools.getByRole('button',{name:'Phone Add elements'}).click()
  const before=await canvas(page).locator('[data-builder-node]').count()
  const library=page.getByRole('group',{name:'Prebuilt sections'}).or(page.locator('.vb-section-library'))
  await expect(library).toBeVisible()
  const section=library.locator('button.vb-palette-item').first()
  await section.click()
  await expect.poll(async()=>canvas(page).locator('[data-builder-node]').count()).toBeGreaterThan(before)
  await tools.getByRole('button',{name:'Phone Save'}).click()
  await expect(page.locator('.vb-save-status')).toHaveText('Saved')
})
