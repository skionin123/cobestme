import { expect, test, type Page } from '@playwright/test'

// Canvas interactions run at 100% zoom on a wide window so the whole 1440px
// page is on screen (Playwright cannot target elements in a CSS-scaled iframe).
test.use({viewport:{width:2200,height:1100}})

const frame=(page:Page)=>page.frameLocator('iframe[title="CoBest visual builder canvas"]')

test('right-click shows plain-language element tools',async({page})=>{
  await page.goto('/e2e.html')
  await page.getByRole('button',{name:'Show canvas at actual size'}).click()
  const heading=frame(page).locator('[data-builder-node="hero-title-home"]')
  await heading.click({button:'right'})
  const menu=page.getByRole('menu',{name:/Element actions for Heading/})
  await expect(menu).toBeVisible()
  const bounds=await menu.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(2200)
  for(const name of ['Edit','Show in Layers','Copy','Paste','Duplicate','Delete'])
    await expect(menu.getByRole('menuitem',{name:new RegExp('^'+name)})).toBeVisible()
  await expect(menu.getByRole('menuitem',{name:/^Select “/})).toBeVisible()
  await menu.getByRole('menuitem',{name:/^Edit/}).click()
  await expect(page.getByRole('tab',{name:'Content'})).toHaveAttribute('aria-selected','true')
  await expect(page.getByLabel('Element text')).toHaveValue('Build something remarkable.')

  await heading.click({button:'right'})
  await page.getByRole('menuitem',{name:/^Select “/}).click()
  await expect(frame(page).locator('.builder-selected')).toHaveCount(1)
  await expect(frame(page).locator('[data-builder-node="hero-title-home"]')).not.toHaveClass(/builder-selected/)

  await heading.click({button:'right'})
  await page.getByRole('menuitem',{name:/^Show in Layers/}).click()
  await expect(page.getByRole('button',{name:'Select Heading layer'})).toBeVisible()
})

test('images can be uploaded, replaced from the library and given alt text',async({page})=>{
  await page.goto('/e2e.html')
  await page.getByRole('button',{name:'Show canvas at actual size'}).click()
  // Add an image with one click; it lands inside the selected hero area.
  await page.locator('.ee-element-tile',{hasText:'Image'}).click()
  const canvas=frame(page)
  const image=canvas.locator('[data-builder-type="image"]').first()
  await expect(image).toBeVisible()
  await expect(page.locator('.ee-badge')).toHaveText('Image')
  await image.click({button:'right'})
  await page.getByRole('menuitem',{name:/^Replace image/}).click()
  await expect(page.getByRole('region',{name:'Image settings'})).toBeVisible()

  const testUrl='https://example.com/cobest-image-test.png'
  await page.getByRole('textbox',{name:'Image URL'}).fill(testUrl)
  await expect(image).toHaveAttribute('src',testUrl)

  // Unsafe schemes never reach the published markup.
  await page.getByRole('textbox',{name:'Image URL'}).fill('javascript:alert(1)')
  await expect(canvas.locator('[data-builder-type="image"]').first()).not.toHaveAttribute('src',/javascript/)

  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl7jZ0AAAAASUVORK5CYII=','base64')
  await page.getByLabel('Upload replacement image').setInputFiles({name:'replacement.png',mimeType:'image/png',buffer:png})
  await expect.poll(()=>image.getAttribute('src')).toMatch(/^data:image\/png;base64,/)
  await expect(page.getByRole('button',{name:'Use image replacement.png'})).toBeVisible()

  // SVG files are rejected: they are not allowed in the media library.
  await page.getByLabel('Upload replacement image').setInputFiles({name:'logo.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')})
  await expect(page.getByRole('alert')).toContainText('PNG, JPG, WebP, GIF or AVIF')

  await page.getByRole('textbox',{name:'Image alt text'}).fill('Our team collaborating')
  await expect(image).toHaveAttribute('alt','Our team collaborating')
  await page.getByRole('button',{name:'Save',exact:true}).click()
  await expect(page.locator('.vb-save-status')).toHaveText('Saved')
  await page.reload()
  await page.getByRole('button',{name:'Show canvas at actual size'}).click()
  await expect(canvas.locator('[data-builder-type="image"]').first()).toHaveAttribute('alt','Our team collaborating')
})
