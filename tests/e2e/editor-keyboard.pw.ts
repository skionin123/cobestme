import { expect, test } from '@playwright/test'

const canvas=(page:import('@playwright/test').Page)=>
  page.frameLocator('iframe[title="CoBest visual builder canvas"]')

test('copy, paste, duplicate, nudge, undo, delete and save work with canvas keyboard focus',async({page})=>{
  await page.goto('/e2e.html')
  const title=canvas(page).locator('[data-builder-node="hero-title-home"]')
  await title.click()
  const headings=canvas(page).locator('[data-builder-type="heading"]')
  const before=await headings.count()
  await page.keyboard.press('Control+c')
  await page.keyboard.press('Control+v')
  await expect(headings).toHaveCount(before+1)
  const selected=canvas(page).locator('[data-builder-node].builder-selected')
  const insertedId=await selected.getAttribute('data-builder-node')
  expect(insertedId).toBeTruthy()
  expect(insertedId).not.toBe('hero-title-home')

  await page.keyboard.press('ArrowRight')
  await expect(selected).toHaveCSS('translate','1px')
  await page.keyboard.press('Control+z')
  await expect(selected).toHaveCSS('translate','none')
  await page.keyboard.press('Control+y')
  await expect(selected).toHaveCSS('translate','1px')

  await page.keyboard.press('Control+d')
  await expect(headings).toHaveCount(before+2)
  await page.keyboard.press('Delete')
  await expect(headings).toHaveCount(before+1)
  await page.keyboard.press('Escape')
  await expect(canvas(page).locator('.builder-selected')).toHaveCount(0)

  // Save from inside iframe; page must not refresh until save is confirmed.
  await title.click()
  await page.keyboard.press('Control+s')
  await expect(page.locator('.vb-save-status')).toHaveText('Saved')
  await page.reload()
  await expect(canvas(page).locator('[data-builder-type="heading"]')).toHaveCount(before+1)
})

test('input typing retains native clipboard/editing shortcuts',async({page})=>{
  await page.goto('/e2e.html')
  const input=page.getByRole('textbox',{name:'Project name'})
  await input.fill('Draft Website')
  await input.press('Control+a')
  await input.press('x')
  await expect(input).toHaveValue('x')
})
