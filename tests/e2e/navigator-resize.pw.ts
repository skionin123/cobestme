import { expect, test } from '@playwright/test'

test('Navigator divider widens layers, refits canvas and remembers the width',async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/e2e.html')
  await page.getByRole('button',{name:'Navigator',exact:true}).click()

  const nav=page.locator('.vb-left')
  const stage=page.locator('.vb-stage')
  const grip=page.getByRole('separator',{name:'Resize Navigator sidebar'})
  await expect(grip).toBeVisible()
  const startingNav=await nav.boundingBox()
  const startingStage=await stage.boundingBox()
  expect(startingNav).not.toBeNull()
  expect(startingStage).not.toBeNull()
  expect(startingNav!.width).toBeGreaterThanOrEqual(315)
  const location=await grip.boundingBox()
  expect(location).not.toBeNull()
  const x=location!.x+location!.width/2,y=location!.y+Math.min(180,location!.height/3)
  await page.mouse.move(x,y)
  await page.mouse.down()
  await page.mouse.move(x+110,y,{steps:8})
  await page.mouse.up()
  await expect.poll(async()=>Math.round((await nav.boundingBox())!.width))
    .toBeGreaterThan(Math.round(startingNav!.width)+90)
  await expect.poll(async()=>Math.round((await stage.boundingBox())!.width))
    .toBeLessThan(Math.round(startingStage!.width)-90)
  await expect(page.getByRole('button',{name:'Select Hero Container layer'})).toHaveAttribute('title','Hero Container')
  // Fit canvas must stay within the resized workspace and never be cut off.
  await expect.poll(async()=>{
    const stageBounds=await stage.boundingBox()
    const iframe=await page.locator('iframe[title="CoBest visual builder canvas"]').boundingBox()
    return !!stageBounds&&!!iframe&&iframe.x>=stageBounds.x-2&&iframe.x+iframe.width<=stageBounds.x+stageBounds.width+2
  }).toBe(true)

  const widened=await nav.boundingBox()
  await page.reload()
  await expect.poll(async()=>Math.round((await page.locator('.vb-left').boundingBox())!.width))
    .toBe(Math.round(widened!.width))
  await page.getByRole('separator',{name:'Resize Navigator sidebar'}).dblclick()
  await expect.poll(async()=>Math.round((await page.locator('.vb-left').boundingBox())!.width)).toBe(320)
})

test('Navigator separator supports keyboard resizing and respects compact viewport',async({page})=>{
  await page.setViewportSize({width:1100,height:800})
  await page.goto('/e2e.html')
  const grip=page.getByRole('separator',{name:'Resize Navigator sidebar'})
  await grip.focus()
  const before=Number(await grip.getAttribute('aria-valuenow'))
  await grip.press('ArrowRight')
  await expect(grip).toHaveAttribute('aria-valuenow',String(before+20))
  await grip.press('Shift+ArrowLeft')
  await expect(grip).toHaveAttribute('aria-valuenow',String(before-20))
  await grip.press('Home')
  await expect(grip).toHaveAttribute('aria-valuenow','320')

  await page.setViewportSize({width:780,height:800})
  await expect.poll(async()=>{
    const bounds=await page.locator('.vb-stage').boundingBox()
    return bounds?.width||0
  }).toBeGreaterThan(300)
  await expect(grip).toHaveAttribute('aria-valuemax',/\d+/)
})
