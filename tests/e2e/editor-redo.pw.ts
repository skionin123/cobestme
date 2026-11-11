import { test, expect, type Page } from '@playwright/test'
import { preparePublishSnapshot, publicStorePayload, publishSummary } from '../../server-publish.mjs'

// What the redone editor promises a business owner:
// - it works on a phone, not only on a big screen;
// - Preview behaves like the live website (menu, pages, contact form);
// - layers land where they are dropped;
// - publishing never swaps the homepage without asking;
// - a published website cannot run links or styles that reach outside it.

const canvas=(page:Page)=>page.frameLocator('iframe[title="CoBest visual builder canvas"]')
const preview=(page:Page)=>page.frameLocator('iframe[title="CoBest preview"]')
const rail=(page:Page,name:string)=>page.getByRole('navigation',{name:'Editor panels'}).getByRole('button',{name,exact:true})
const sectionNames=(page:Page)=>canvas(page).locator('main > [data-builder-node]').evaluateAll(nodes=>nodes.map(node=>(node as HTMLElement).dataset.builderName))

/** Tap something inside the editing page by its position on screen (the page is shown scaled on small screens). */
async function tapInCanvas(page:Page,selector:string){
  // Wait until the editing page has finished loading; a person cannot tap faster than that.
  await expect.poll(()=>canvas(page).locator('html').evaluate(()=>document.readyState)).toBe('complete')
  const inner=await canvas(page).locator(selector).evaluate(el=>{
    const r=el.getBoundingClientRect()
    return {x:r.left+r.width/2,y:r.top+r.height/2,width:window.innerWidth}
  })
  const outer=(await page.locator('iframe[title="CoBest visual builder canvas"]').boundingBox())!
  const scale=outer.width/inner.width
  await page.touchscreen.tap(outer.x+inner.x*scale,outer.y+inner.y*scale)
}

test.describe('on a phone',()=>{
  test.use({viewport:{width:390,height:844},hasTouch:true,isMobile:true})

  test('select, edit in a sheet, add a section and preview with a working menu',async({page})=>{
    const errors:string[]=[]
    page.on('pageerror',error=>errors.push(error.message))
    await page.goto('/e2e.html')
    const shell=page.locator('.ee-shell')
    await expect(shell).toHaveAttribute('data-layout','narrow')
    await expect(shell).toHaveAttribute('data-phone','true')
    // A phone starts on the phone-sized page, with the tools in a bottom bar.
    const bar=page.locator('.ee-bottombar')
    for(const name of ['Add','Layers','Pages','Media','Theme'])await expect(bar.getByRole('button',{name,exact:true})).toBeVisible()
    await expect(canvas(page).locator('[data-builder-node="hero-title-home"]')).toBeVisible()

    // Tap the headline: a bar names what is selected and offers Edit.
    await tapInCanvas(page,'[data-builder-node="hero-title-home"]')
    await expect(page.locator('.ee-selection-bar .ee-selection-name')).toContainText('Hero heading')
    await page.locator('.ee-selection-edit').tap()
    const sheet=page.getByRole('dialog',{name:'Edit selected element'})
    await expect(sheet).toBeVisible()
    await sheet.getByLabel('Element text').fill('Fresh bread, baked daily')
    await expect(canvas(page).locator('[data-builder-node="hero-title-home"]')).toHaveText('Fresh bread, baked daily')
    // Text fields are at least 16px so the phone does not zoom in on focus.
    expect(await sheet.getByLabel('Element text').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16)
    await sheet.getByRole('button',{name:'Close'}).tap()
    await expect(sheet).toHaveCount(0)

    // Add a section from the bottom bar; the sheet gets out of the way.
    await bar.getByRole('button',{name:'Add',exact:true}).tap()
    await page.locator('.ee-section-card',{hasText:'Contact form'}).tap()
    await expect(page.locator('.ee-sheet')).toHaveCount(0)
    await expect.poll(()=>sectionNames(page)).toContain('Contact')

    // Preview fills the screen and the phone menu opens and closes.
    await page.getByRole('button',{name:'Preview',exact:true}).tap()
    await expect(page.getByRole('dialog',{name:'Website preview'})).toBeVisible()
    const site=preview(page)
    await expect(site.getByText('Fresh bread, baked daily')).toBeVisible()
    const menuButton=site.locator('.nav-menu-button')
    await expect(menuButton).toBeVisible()
    await expect(site.locator('.nav-links')).toBeHidden()
    await menuButton.tap()
    await expect(site.locator('[data-nav-open="true"] .nav-links')).toBeVisible()
    await expect(menuButton).toHaveAttribute('aria-expanded','true')
    await menuButton.tap()
    await expect(site.locator('.nav-links')).toBeHidden()
    await page.getByRole('button',{name:/Exit preview/}).tap()

    // Nothing sticks out sideways, and nothing broke along the way.
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true)
    expect(errors).toEqual([])
  })
})

test.describe('on a laptop',()=>{
  test.use({viewport:{width:1440,height:900}})

  test('preview behaves like the live website: pages, menu and contact form',async({page})=>{
    await page.goto('/e2e.html')
    await rail(page,'Add').click()
    await page.locator('.ee-section-card',{hasText:'Contact form'}).click()
    await rail(page,'Pages').click()
    await page.getByRole('button',{name:'Add page'}).click()
    await page.getByLabel('New page name').fill('About us')
    await expect(page.getByLabel('Add a link to this page in the menu')).toBeChecked()
    await page.getByRole('button',{name:'Create page'}).click()
    await expect(page.getByLabel('Page URL')).toHaveValue('/about-us')

    await page.getByRole('button',{name:'Preview',exact:true}).click()
    const site=preview(page)
    await expect(site.locator('h1')).toHaveText('About us')
    // No editor leftovers in what visitors see.
    await expect(site.locator('[data-builder-node]')).toHaveCount(0)
    // The logo goes home, and the new menu link comes back: no dead ends.
    await site.locator('.brand-link').click()
    await expect(page.locator('.ee-preview-title')).toContainText('Home')
    await expect(site.locator('h1')).toHaveText('A clear headline about what you offer')
    await site.locator('.nav-link',{hasText:'About us'}).click()
    await expect(site.locator('h1')).toHaveText('About us')
    await page.getByLabel('Preview page').selectOption({label:'Home'})

    // The contact form answers, and says where real messages will arrive.
    const form=site.locator('form')
    await form.locator('input[name="name"]').fill('Maria')
    await form.locator('input[name="email"]').fill('maria@example.com')
    await form.locator('textarea').fill('Do you deliver on Sundays?')
    await form.locator('button[type="submit"]').click()
    await expect(form).toHaveAttribute('data-state','success')
    await expect(form.locator('[data-form-success]')).toBeVisible()
    await expect(page.locator('.ee-toast')).toContainText('messages arrive in your CoBest Inbox')

    // The same preview at phone size: menu links fold into a button.
    await page.getByRole('group',{name:'Preview device'}).getByRole('button',{name:'Mobile'}).click()
    await expect(site.locator('.nav-menu-button')).toBeVisible()
    await site.locator('.nav-menu-button').click()
    await expect(site.locator('[data-nav-open="true"] .nav-link',{hasText:'About us'})).toBeVisible()
    await page.getByRole('button',{name:/Exit preview/}).click()
    await expect(page.locator('.ee-shell')).toBeVisible()
  })

  test('layers land where they are dropped, and sections never end up inside each other',async({page})=>{
    await page.goto('/e2e.html')
    await rail(page,'Add').click()
    await page.locator('.ee-section-card',{hasText:'Features'}).click()
    await page.locator('.ee-section-card',{hasText:'Testimonials'}).click()
    await rail(page,'Layers').click()
    const start=await sectionNames(page)
    expect(start.slice(-3)).toEqual(['Hero','Features','Testimonials'])

    const row=(name:string)=>page.locator('.ee-layer-row',{has:page.getByRole('button',{name:'Select '+name+' layer',exact:true})}).first()
    const drag=async(from:string,to:string,zone:'before'|'inside'|'after')=>{
      const grip=(await row(from).locator('.ee-layer-grip').boundingBox())!
      const target=(await row(to).boundingBox())!
      const y=target.y+target.height*(zone==='before'?0.12:zone==='after'?0.9:0.5)
      await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2)
      await page.mouse.down()
      await page.mouse.move(grip.x+20,grip.y+10,{steps:4})
      await page.mouse.move(target.x+60,y,{steps:12})
      const hint=await page.locator('.ee-layer-row.drop-before,.ee-layer-row.drop-after,.ee-layer-row.drop-inside').evaluateAll(nodes=>nodes.map(node=>node.className.match(/drop-\w+/)![0]))
      await page.mouse.up()
      // The drag library ignores a click in the first moments after a drop,
      // so an accidental click cannot follow a drag. People are slower than that.
      await page.waitForTimeout(150)
      return hint
    }

    // Dropping on the top edge of Hero shows a line above it and lands before it.
    expect(await drag('Testimonials','Hero','before')).toEqual(['drop-before'])
    await expect.poll(async()=>(await sectionNames(page)).slice(-3)).toEqual(['Testimonials','Hero','Features'])
    // Dropping a section on the middle of another section goes after it, not inside it.
    expect(await drag('Features','Testimonials','inside')).toEqual(['drop-after'])
    await expect.poll(async()=>(await sectionNames(page)).slice(-3)).toEqual(['Testimonials','Features','Hero'])
    await expect(canvas(page).locator('main > [data-builder-node] [data-builder-type="section"]')).toHaveCount(0)
    // A section cannot be dropped into its own contents.
    await expect(row('Hero content')).toBeVisible()
    expect(await drag('Hero','Hero content','inside')).toEqual([])
    expect((await sectionNames(page)).slice(-3)).toEqual(['Testimonials','Features','Hero'])
    // One Undo per move.
    await page.getByRole('button',{name:'Undo'}).click()
    await expect.poll(async()=>(await sectionNames(page)).slice(-3)).toEqual(['Testimonials','Hero','Features'])
  })
})

test.describe('publishing',()=>{
  test.use({viewport:{width:1440,height:900}})

  test('the Advanced editor never replaces a live shop homepage without asking',async({page,context})=>{
    // The real app runs against a stand-in for the server that applies the
    // server's own publishing rules (server-publish.mjs).
    const shopDesign={theme:'market',heading:'Bread Shop',intro:'Baked every morning.',collection:'Today’s bread',cover:'auto'}
    let workspace:any={id:41,site_name:'Bread Shop',slug:'bread-shop',currency:'PHP',editor:{shopDesign},
      onboarding:{businessName:'Bread Shop',pages:['Home'],styles:[],features:[]},settings:{}}
    let live:any=preparePublishSnapshot({onboarding:workspace.onboarding,editor:{shopDesign},settings:{},products:[]},null)
    const sent:any[]=[]
    await context.addInitScript(()=>{
      localStorage.setItem('cobest-auth-token','mvp-e2e-token')
      localStorage.setItem('cobest-active-site-id','41')
      localStorage.setItem('cobest-v4-mode',JSON.stringify('app'))
    })
    await context.route('**/api/**',async route=>{
      const request=route.request()
      const path=new URL(request.url()).pathname
      const reply=(data:unknown,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)})
      if(path==='/api/sites')return reply([{id:41,site_name:workspace.site_name,slug:workspace.slug}])
      if(path==='/api/workspace'){
        if(request.method()==='PUT'){
          const body=request.postDataJSON()
          workspace={...workspace,...body,onboarding:{...workspace.onboarding,...(body.onboarding||{})},editor:{...workspace.editor,...(body.editor||{})},settings:{...workspace.settings,...(body.settings||{})}}
        }
        return reply([workspace])
      }
      if(path==='/api/publish/status')return reply({published:true,published_at:'2026-11-01T00:00:00.000Z',...publishSummary(live)})
      if(path==='/api/publish'){
        const body=request.postDataJSON()
        sent.push(body.snapshot)
        live=preparePublishSnapshot(body.snapshot,live)
        return reply({ok:true,slug:'bread-shop',custom_domain:null,store_url:'/store/bread-shop',...publishSummary(live)})
      }
      if(path==='/api/public/store/bread-shop')return reply(publicStorePayload({slug:'bread-shop',...live}))
      if(path.startsWith('/api/public/'))return reply({ok:true})
      return reply([])
    })
    const liveHome=async()=>{
      const visitor=await context.newPage()
      await visitor.goto('/store/bread-shop')
      await expect(visitor.locator('.public-store-shell,iframe.visual-published-frame').first()).toBeVisible()
      const result={custom:await visitor.locator('iframe.visual-published-frame').count(),shop:await visitor.locator('.designed-store').count()}
      await visitor.close()
      return result
    }

    await page.goto('/')
    await expect(page.getByRole('heading',{name:'Store overview'})).toBeVisible()
    expect(await liveHome()).toEqual({custom:0,shop:1})

    // Start custom pages from a template: this only creates a draft.
    await page.locator('.app-nav').getByRole('button',{name:'Website themes',exact:true}).click()
    await page.getByText('Advanced page templates',{exact:true}).click()
    await page.getByRole('button',{name:'Use Simple'}).click()
    await expect(page.getByRole('textbox',{name:'Website name'})).toBeVisible()
    await page.getByRole('button',{name:'Save',exact:true}).click()
    await expect.poll(()=>workspace.editor?.visualBuilderProject?.pages?.length).toBe(1)
    expect(sent).toHaveLength(0)
    expect(await liveHome()).toEqual({custom:0,shop:1})

    // Publishing asks which homepage visitors should see. Nothing is chosen for the owner.
    await page.locator('.vb-publish').click()
    const review=page.getByRole('dialog',{name:'Website launch review'})
    await expect(review.locator('.ee-home-choice')).toContainText('Your shop is live right now')
    const confirm=review.locator('.vb-launch-confirm')
    await expect(confirm).toBeDisabled()
    await expect(confirm).toHaveText('Choose a homepage above')
    await expect(review.locator('input[name="home-source"]:checked')).toHaveCount(0)

    // Keep the shop: the pages go live, the homepage does not change.
    await review.getByText('Keep my shop as the homepage').click()
    await expect(confirm).toHaveText('Publish now')
    await confirm.click()
    await expect(page.locator('.ee-notice')).toContainText('Your shop is still the homepage')
    expect(sent).toHaveLength(1)
    expect(sent[0].home_source).toBe('storefront')
    expect(sent[0].visual_project.pages).toHaveLength(1)
    // Version history and the unpublished draft stay private.
    expect(sent[0].visual_project.versions).toEqual([])
    expect(sent[0].editor.visualBuilderProject).toBeUndefined()
    expect(sent[0].editor.previousShopDesign).toBeUndefined()
    expect(sent[0].editor.shopDesign.theme).toBe('market')
    expect(await liveHome()).toEqual({custom:0,shop:1})

    // Publish again and choose the designed Home page: now it replaces the shop homepage.
    await page.locator('.ee-notice').getByRole('button').last().click()
    await page.locator('.vb-publish').click()
    await expect(review.locator('input[name="home-source"][value="storefront"]')).toBeChecked()
    await review.getByText('Use my Home page from this editor').click()
    await review.locator('.vb-launch-confirm').click()
    await expect(page.locator('.ee-notice')).toContainText('Your website is live')
    expect(sent[1].home_source).toBe('custom')
    expect(await liveHome()).toEqual({custom:1,shop:0})
  })
})

test.describe('published websites',()=>{
  test('links and custom CSS cannot run scripts or call other servers',async({page})=>{
    const outside:string[]=[]
    const dialogs:string[]=[]
    page.on('request',request=>{if(/evil\.example/.test(request.url()))outside.push(request.url())})
    page.on('dialog',dialog=>{dialogs.push(dialog.message());dialog.dismiss().catch(()=>{})})
    const snapshot={
      onboarding:{businessName:'Corner Shop',pages:['Home'],styles:[],features:[]},settings:{},products:[],home_source:'storefront',
      discounts:[{code:'SECRET50',type:'percent',value:50}],
      editor:{
        customCss:"@import url('https://evil.example/steal.css');\n.public-hero{background:url(https://evil.example/pixel.gif)}\n.public-hero{outline-offset:7px}",
        sectionOrder:['hero','block-1'],
        blocks:[{id:'block-1',type:'cta',title:'Today only',body:'Half price',buttonLabel:'Claim',buttonLink:'javascript:alert(document.domain)',columns:99999}],
      },
    }
    await page.route('**/api/public/**',route=>{
      const path=new URL(route.request().url()).pathname
      if(path==='/api/public/store/corner-shop')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(publicStorePayload({slug:'corner-shop',...snapshot}))})
      return route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'})
    })
    await page.goto('/store/corner-shop')
    const button=page.locator('.public-block-cta a')
    await expect(button).toHaveText('Claim')
    expect(await button.getAttribute('href')).toBe('#')
    await button.click()
    const css=await page.locator('.public-store-shell > style').first().textContent()
    // Ordinary styling still works; anything that loads from elsewhere is switched off.
    expect(css).toContain('outline-offset:7px')
    expect(css).not.toMatch(/@import|url\(/i)
    expect(await page.locator('.public-hero').evaluate(el=>getComputedStyle(el).outlineOffset)).toBe('7px')
    expect(await page.locator('.public-hero').evaluate(el=>getComputedStyle(el).backgroundImage)).not.toContain('evil.example')
    // Discount codes are checked by the server; visitors cannot read them.
    expect(await page.evaluate(()=>fetch('/api/public/store/corner-shop').then(r=>r.text()))).not.toContain('SECRET50')
    expect(outside).toEqual([])
    expect(dialogs).toEqual([])
  })
})
