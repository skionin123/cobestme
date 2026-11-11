import { test, expect, type Page } from '@playwright/test'

// Full editor workflow for a business owner: add → edit → pages → mobile → export.
// Canvas clicks use 100% zoom on a wide window (Playwright cannot target
// elements inside a CSS-scaled iframe).
test.use({viewport:{width:2200,height:1100}})

const canvas=(page:Page)=>page.frameLocator('iframe[title="CoBest visual builder canvas"]')
const preview=(page:Page)=>page.frameLocator('iframe[title="CoBest preview"]')
const panel=(page:Page,name:string)=>page.getByRole('navigation',{name:'Editor panels'}).getByRole('button',{name,exact:true})

test.describe('CoBest editor workflow',()=>{
  test('guided build: sections, text, links, pages, layers, theme, mobile and export',async({page})=>{
    await page.goto('/e2e.html')
    await page.getByRole('button',{name:'Show canvas at actual size'}).click()

    // Simple layout: five plain-language panels and a 4-step guide.
    for(const name of ['Add','Layers','Pages','Media','Theme'])await expect(panel(page,name)).toBeVisible()
    const guide=page.getByRole('region',{name:'Website setup steps'})
    for(const step of ['Add sections','Make it yours','Check on mobile','Publish'])await expect(guide.getByText(step,{exact:true})).toBeVisible()
    // Nothing is selected at first: the inspector explains what to do.
    await expect(page.getByText('Click anything on the page to edit it')).toBeVisible()

    // 1. Add sections with one click; each lands after the current section.
    const frame=canvas(page)
    await page.locator('.ee-section-card',{hasText:'Features'}).click()
    await page.locator('.ee-section-card',{hasText:'Contact form'}).click()
    await page.locator('.ee-section-card',{hasText:'Footer'}).click()
    await expect(guide.getByRole('button',{name:/Step 1: Add sections \(done\)/})).toBeVisible()

    // 2. Edit text from the inspector; one Undo reverts the whole edit.
    const title=frame.locator('[data-builder-node="hero-title-home"]')
    await title.click()
    for(const name of ['Content','Design','Advanced'])await expect(page.getByRole('tab',{name})).toBeVisible()
    await page.getByRole('tab',{name:'Content'}).click()
    await page.getByLabel('Element text').fill('Fresh flowers, delivered today')
    await expect(title).toHaveText('Fresh flowers, delivered today')
    await page.getByRole('button',{name:'Undo'}).click()
    await expect(title).toHaveText('A clear headline about what you offer')
    await page.getByRole('button',{name:'Redo'}).click()
    await expect(title).toHaveText('Fresh flowers, delivered today')
    await page.getByRole('group',{name:'Heading level'}).getByRole('button',{name:'H2'}).click()
    await expect(frame.locator('h2[data-builder-node="hero-title-home"]')).toBeVisible()
    await page.getByRole('group',{name:'Heading level'}).getByRole('button',{name:'H1'}).click()

    // Move up / down reorders within the parent.
    const copy=frame.locator('[data-builder-node="hero-copy-home"]')
    await copy.click()
    await page.getByRole('button',{name:'Move up'}).click()
    await expect.poll(()=>frame.locator('[data-builder-node="hero-copy-home"]').evaluate(el=>(el.parentElement!.children[0] as HTMLElement).dataset.builderNode).catch(()=>'')).toBe('hero-copy-home')
    await page.getByRole('button',{name:'Undo'}).click()

    // Links: choose a page, or a safe external address.
    const heroButton=frame.locator('[data-builder-node="hero-button-home"]')
    await heroButton.click()
    await page.getByRole('tab',{name:'Content'}).click()
    await page.getByLabel('Link type').selectOption('url')
    await page.getByLabel('Link destination').fill('javascript:alert(1)')
    await expect(page.getByText('blocked for safety')).toBeVisible()
    await page.getByLabel('Link destination').fill('https://example.com/shop')
    await page.getByLabel('Link destination').blur()
    await expect(heroButton).toHaveAttribute('href','https://example.com/shop')

    // Pages: new pages get the site navigation, a heading and a unique address.
    await panel(page,'Pages').click()
    await page.getByRole('button',{name:'Add page'}).click()
    await page.getByLabel('New page name').fill('About us')
    await page.getByRole('button',{name:'Create page'}).click()
    await expect(page.locator('.ee-page-button')).toContainText('About us')
    await expect(frame.locator('[data-builder-type="heading"]').first()).toHaveText('About us')
    await expect(page.getByLabel('Page URL')).toHaveValue('/about-us')
    await page.getByLabel('Page URL').fill('/')
    await page.getByLabel('Page URL').blur()
    await expect(page.getByLabel('Page URL')).toHaveValue('/about-us')
    await page.getByPlaceholder('e.g. Fresh flowers delivered in Manila').fill('About Bloom & Co')
    await expect(page.getByLabel('Google preview')).toContainText('About Bloom & Co')
    await page.getByRole('button',{name:'Add page'}).click()
    await page.getByLabel('New page name').fill('About us')
    await page.getByRole('button',{name:'Create page'}).click()
    await expect(page.getByLabel('Page URL')).toHaveValue('/about-us-2')
    page.once('dialog',d=>d.accept())
    await page.getByRole('button',{name:'Delete About us',exact:true}).last().click()

    // Layers: hide from the website, then show again.
    await page.locator('.ee-page-button').click()
    await page.getByRole('option',{name:/Home/}).click()
    await panel(page,'Layers').click()
    await page.getByRole('button',{name:'Hide Hero',exact:true}).click()
    await expect(frame.locator('[data-builder-node="hero-home"]')).toHaveCount(0)
    await page.getByRole('button',{name:'Show Hero',exact:true}).click()
    await expect(frame.locator('[data-builder-node="hero-home"]')).toBeVisible()

    // Theme: brand color updates the site variable.
    await panel(page,'Theme').click()
    await page.getByLabel('Brand / buttons color').fill('#e11d48')
    await expect.poll(()=>frame.locator('html').evaluate(el=>getComputedStyle(el).getPropertyValue('--accent').trim()).catch(()=>'')).toBe('#e11d48')

    // 3. Check on mobile from the guide; preview has no editor markup.
    await guide.getByRole('button',{name:/Step 3: Check on mobile/}).click()
    await expect(page.getByRole('dialog',{name:'Website preview'})).toBeVisible()
    await expect(preview(page).locator('[data-builder-node]')).toHaveCount(0)
    await expect(preview(page).getByText('Fresh flowers, delivered today')).toBeVisible()
    await page.getByRole('button',{name:/Exit preview/}).click()
    await expect(guide.getByRole('button',{name:/Step 3: Check on mobile \(done\)/})).toBeVisible()

    // Save, reload and keep the work.
    await page.getByRole('button',{name:'Save',exact:true}).click()
    await expect(page.locator('.vb-save-status')).toHaveText('Saved')
    await page.reload()
    await expect(canvas(page).locator('[data-builder-node="hero-title-home"]')).toHaveText('Fresh flowers, delivered today')

    // Version history and export live under More options.
    await page.getByRole('button',{name:'More options'}).click()
    const download=page.waitForEvent('download')
    await page.getByRole('menuitem',{name:/Download website \(ZIP\)/}).click()
    expect((await download).suggestedFilename()).toMatch(/\.zip$/)
    await page.getByRole('button',{name:'More options'}).click()
    await page.getByRole('menuitem',{name:/Version history/}).click()
    await expect(page.getByRole('dialog',{name:'Version history'})).toContainText('Edit color variable')
  })

  test('keeps long pages scrollable to the bottom',async({page})=>{
    await page.goto('/e2e.html')
    const card=page.locator('.ee-section-card',{hasText:'Features'})
    for(let i=0;i<12;i++)await card.click()
    const stage=page.locator('.ee-stage')
    await expect.poll(()=>stage.evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true)
    await stage.evaluate(el=>{el.scrollTop=el.scrollHeight})
    await expect.poll(()=>stage.evaluate(el=>el.scrollTop)).toBeGreaterThan(0)
    await expect(canvas(page).locator('[data-builder-name="Features"]')).toHaveCount(12)
  })

  test('works on a laptop-sized screen without hiding the canvas',async({page})=>{
    await page.setViewportSize({width:1280,height:800})
    await page.goto('/e2e.html')
    await expect(page.getByRole('button',{name:'Fit canvas to workspace'})).toHaveClass(/active/)
    // Measure with getBoundingClientRect (includes the Fit scale transform).
    await expect(page.getByTestId('canvas-zoom')).not.toHaveText('100%')
    const boxes=await page.evaluate(()=>{
      const r=(s:string)=>document.querySelector(s)!.getBoundingClientRect()
      const stage=r('.ee-stage'),frame=r('iframe[title="CoBest visual builder canvas"]')
      return {stageX:stage.x,stageW:stage.width,frameX:frame.x,frameW:frame.width}
    })
    expect(boxes.stageW).toBeGreaterThan(560)
    expect(boxes.frameX).toBeGreaterThanOrEqual(boxes.stageX)
    expect(boxes.frameX+boxes.frameW).toBeLessThanOrEqual(boxes.stageX+boxes.stageW)
  })
})
