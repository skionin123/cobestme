import { test, expect, type Locator, type Page } from '@playwright/test'

const canvas=(page:Page)=>page.frameLocator('iframe[title="CoBest visual builder canvas"]')
const preview=(page:Page)=>page.frameLocator('iframe[title="CoBest preview"]')
const palette=(page:Page,label:string)=>page.locator('.vb-palette-item',{hasText:label}).first()

async function createBlankPage(page:Page,name='Landing'){
  await page.getByRole('button',{name:'Pages',exact:true}).click()
  await page.getByRole('button',{name:'Add page'}).click()
  await page.getByPlaceholder('Page name').fill(name)
  await page.getByRole('button',{name:'Create',exact:true}).click()
  await expect(canvas(page).locator('.builder-empty-state')).toContainText('Start building your page')
}

async function dragPalette(page:Page,label:string,target:Locator){
  const source=palette(page,label)
  await expect(source).toBeVisible()
  await source.dragTo(target,{force:true})
}

test.describe('CoBest MVP browser golden path',()=>{
  test('builds, styles, previews, saves, reloads, navigates, uses assets and exports',async({page})=>{
    await page.goto('/e2e.html')
    await expect(page.getByText('COBEST DESIGNER')).toBeVisible()

    await expect(page.getByRole('button',{name:'Add',exact:true})).toBeVisible()
    await expect(page.getByRole('button',{name:'Navigator',exact:true})).toBeVisible()
    await expect(page.getByRole('button',{name:'Pages',exact:true})).toBeVisible()
    await expect(page.getByRole('button',{name:'Assets',exact:true})).toBeVisible()
    await expect(page.getByRole('button',{name:'Style',exact:true})).toBeVisible()
    await expect(page.getByRole('button',{name:'Settings',exact:true})).toBeVisible()
    await expect(page.getByRole('button',{name:'CMS'})).toHaveCount(0)
    await expect(page.getByRole('button',{name:'Interactions'})).toHaveCount(0)

    await createBlankPage(page)
    await page.getByRole('button',{name:'Add',exact:true}).click()

    const frame=canvas(page)
    const root=frame.locator('[data-builder-name="Page"]')
    await dragPalette(page,'Section',root)
    const section=frame.locator('[data-builder-type="section"]').first()
    await expect(section).toBeVisible()

    await dragPalette(page,'Container',section)
    const container=frame.locator('[data-builder-type="container"]').first()
    await expect(container).toBeVisible()
    await expect(container).toHaveCSS('min-height','72px')
    expect(await container.evaluate(el=>getComputedStyle(el,'::after').content)).toContain('Drop elements here')

    await dragPalette(page,'Heading',container)
    await dragPalette(page,'Paragraph',container)
    await dragPalette(page,'Button',container)
    await dragPalette(page,'Image',container)

    let heading=frame.locator('[data-builder-type="heading"]').first()
    let paragraph=frame.locator('[data-builder-type="paragraph"]').first()
    let image=frame.locator('[data-builder-type="image"]').first()
    let button=frame.locator('[data-builder-type="button"],[data-builder-type="link"]').filter({hasText:'Button'}).first()

    await heading.dblclick()
    await heading.fill('A professional website, built visually.')
    await paragraph.click()
    heading=frame.locator('[data-builder-type="heading"]').first()
    await expect(heading).toHaveText('A professional website, built visually.')

    await heading.click()
    await expect(heading).toHaveClass(/builder-selected/)
    const fontSize=page.locator('.vb-right-content label',{hasText:'Font size'}).first()
    await fontSize.locator('input').fill('52')

    const textColor=page.locator('.vb-right-content label',{hasText:'Text color'}).first().locator('input[type="color"]')
    await textColor.evaluate((element)=>{
      const input=element as HTMLInputElement
      input.value='#17324d'
      input.dispatchEvent(new Event('input',{bubbles:true}))
      input.dispatchEvent(new Event('change',{bubbles:true}))
    })

    await page.getByTitle('Tablet 991').click()
    await expect(fontSize).toContainText('inherited · desktop')
    await fontSize.locator('input').fill('38')
    await expect(fontSize).toContainText('override')

    await page.getByTitle('Mobile 478').click()
    await expect(fontSize).toContainText('inherited · tablet')
    await fontSize.locator('input').fill('30')
    await page.getByTitle('Desktop 1440').click()
    await expect(fontSize.locator('input')).toHaveValue('52')

    image=frame.locator('[data-builder-type="image"]').first()
    paragraph=frame.locator('[data-builder-type="paragraph"]').first()
    await image.click()
    await expect(frame.locator('.builder-node-label')).toContainText('Image')
    await frame.locator('.builder-node-label').dragTo(paragraph,{force:true,targetPosition:{x:8,y:2}})
    const order=await frame.locator('[data-builder-type="container"]').first().evaluate(el=>
      Array.from(el.children).map(child=>(child as HTMLElement).dataset.builderType)
    )
    expect(order.slice(0,4)).toEqual(['heading','image','paragraph','button'])

    await page.getByRole('button',{name:'Navigator',exact:true}).click()
    const headingRow=page.locator('.vb-nav-row',{hasText:'Heading'}).first()
    await headingRow.locator('.vb-nav-name').click()
    await expect(frame.locator('[data-builder-type="heading"]').first()).toHaveClass(/builder-selected/)

    await frame.locator('[data-builder-type="paragraph"]').first().click()
    await expect(page.locator('.vb-nav-row.is-selected')).toContainText('Paragraph')

    await page.getByRole('button',{name:'Assets',exact:true}).click()
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl7jZ0AAAAASUVORK5CYII=','base64')
    await page.locator('input[type="file"]').setInputFiles({name:'hero.png',mimeType:'image/png',buffer:png})
    await expect(page.getByText('hero.png',{exact:true})).toBeVisible()

    image=frame.locator('[data-builder-type="image"]').first()
    await image.click()
    await page.getByRole('button',{name:'Settings',exact:true}).click()
    const assetSelect=page.locator('.vb-right-content label',{hasText:'Asset library'}).locator('select')
    await assetSelect.selectOption({label:'hero.png'})
    await expect(frame.locator('[data-builder-type="image"]').first()).toHaveAttribute('src',/data:image\/png;base64/)

    await page.getByRole('button',{name:'Save',exact:true}).click()
    await expect(page.locator('.vb-save-status')).toHaveText('Saved')

    await page.reload()
    await expect(page.getByText('COBEST DESIGNER')).toBeVisible()
    heading=canvas(page).locator('[data-builder-type="heading"]').first()
    await expect(heading).toHaveText('A professional website, built visually.')
    await expect(canvas(page).locator('[data-builder-type="image"]').first()).toHaveAttribute('src',/data:image\/png;base64/)

    await heading.click()
    await page.getByRole('button',{name:'Settings',exact:true}).click()
    const contentInput=page.locator('.vb-right-content section',{hasText:'Content'}).locator('input').first()
    await contentInput.fill('Temporary browser change')
    await expect(canvas(page).locator('[data-builder-type="heading"]').first()).toHaveText('Temporary browser change')

    await page.locator('.vb-stage-meta').click()
    await page.getByTitle('Undo').click()
    await expect(canvas(page).locator('[data-builder-type="heading"]').first()).toHaveText('A professional website, built visually.')
    await page.getByTitle('Redo').click()
    await expect(canvas(page).locator('[data-builder-type="heading"]').first()).toHaveText('Temporary browser change')
    await page.getByTitle('Undo').click()

    await page.getByRole('button',{name:'Preview',exact:true}).click()
    const previewHeading=preview(page).locator('h1,h2,h3,h4,h5,h6').filter({hasText:'A professional website, built visually.'}).first()
    await expect(previewHeading).toBeVisible()
    await expect(preview(page).locator('[data-builder-node]')).toHaveCount(0)
    await expect(previewHeading).toHaveCSS('font-size','52px')
    await page.getByRole('button',{name:/Exit preview/}).click()

    await page.getByRole('button',{name:'Export',exact:true}).click()
    const downloadPromise=page.waitForEvent('download')
    await page.getByRole('button',{name:/Export website ZIP/}).click()
    const download=await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.zip$/)
  })

  test('keeps long pages scrollable to the bottom',async({page})=>{
    await page.goto('/e2e.html')
    await createBlankPage(page,'Long Page')
    await page.getByRole('button',{name:'Add',exact:true}).click()
    const sectionButton=palette(page,'Section')
    for(let i=0;i<18;i++)await sectionButton.click()

    const stage=page.locator('.vb-stage')
    await expect.poll(()=>stage.evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true)
    await stage.evaluate(el=>{el.scrollTop=el.scrollHeight})
    await expect.poll(()=>stage.evaluate(el=>el.scrollTop)).toBeGreaterThan(0)
    await expect(canvas(page).locator('[data-builder-type="section"]')).toHaveCount(18)
  })
})
