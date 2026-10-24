import {test,expect} from '@playwright/test'

const canvas=(page:import('@playwright/test').Page)=>
  page.frameLocator('iframe[title="CoBest visual builder canvas"]')

test('on-canvas insertion adds a section beside the selected section and undo removes it',async({page})=>{
  await page.goto('/e2e.html')
  await page.getByRole('button',{name:'Navigator',exact:true}).click()
  await page.getByRole('button',{name:'Select Hero layer'}).click()
  await expect(canvas(page).getByRole('button',{name:'Add section after Hero'})).toBeVisible()
  await canvas(page).getByRole('button',{name:'Add section after Hero'}).click()
  await expect(page.getByRole('dialog',{name:'Choose a section'})).toBeVisible()
  await page.getByRole('textbox',{name:'Search section designs'}).fill('image with text')
  await page.getByRole('button',{name:'Add Image with text section'}).click()
  await expect(canvas(page).getByText('Tell your customers what makes your store special.')).toBeVisible()
  await page.getByRole('button',{name:'Undo',exact:true}).click()
  await expect(canvas(page).getByText('Tell your customers what makes your store special.')).toHaveCount(0)
})

test('global quick search can add a section and select an existing layer',async({page})=>{
  await page.goto('/e2e.html')
  await page.getByRole('button',{name:'Search or add elements'}).click()
  await page.getByRole('textbox',{name:'Search website tools'}).fill('Shop collection intro')
  await page.getByRole('button',{name:'Find Shop collection intro section'}).click()
  await expect(canvas(page).getByText('Explore our collection')).toBeVisible()
  await page.getByRole('button',{name:'Search or add elements'}).click()
  await page.getByRole('textbox',{name:'Search website tools'}).fill('Heading')
  await page.getByRole('button',{name:'Find Heading layer'}).click()
  await expect(page.getByRole('navigation',{name:'Selected element hierarchy'})).toContainText('Heading')
})

test('mobile layout review measures actual preview and explains its limitations',async({page})=>{
  await page.goto('/e2e.html')
  await page.getByRole('button',{name:'Check mobile layout'}).click()
  const report=page.getByRole('dialog',{name:'Mobile layout review'})
  await expect(report).toBeVisible()
  await expect(report).toContainText('preview')
  await expect(report).toContainText('actual phone')
  await page.getByRole('button',{name:'Close mobile layout check'}).click()
  await expect(report).toHaveCount(0)
})
