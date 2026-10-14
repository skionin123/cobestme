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

test('touch-and-drag a design block into the page on a phone viewport',async({page})=>{
  await page.goto('/e2e.html')
  await page.getByRole('button',{name:'Phone Add elements'}).click()
  const item=page.locator('.vb-section-library .vb-palette-item').first()
  await item.scrollIntoViewIfNeeded()
  const source=await item.boundingBox()
  const target=await page.locator('.vb-canvas-drop').boundingBox()
  expect(source).toBeTruthy()
  expect(target).toBeTruthy()
  const before=await canvas(page).locator('[data-builder-node]').count()
  const start={x:source!.x+source!.width/2,y:source!.y+source!.height/2}
  // Move into the canvas past the open drawer's right edge.
  const end={x:Math.min(378,target!.x+target!.width-12),y:Math.max(160,Math.min(650,target!.y+230))}
  const session=await page.context().newCDPSession(page)
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]})
  await page.waitForTimeout(240)
  for(let i=1;i<=7;i++){
    const x=start.x+(end.x-start.x)*i/7
    const y=start.y+(end.y-start.y)*i/7
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]})
  }
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
  await expect.poll(async()=>canvas(page).locator('[data-builder-node]').count()).toBeGreaterThan(before)
})
