/**
 * Internal setup progress, not a production certification or payment-provider test.
 * Explicit manual verification stays separate from persisted project fields.
 */
export function getStoreReadiness({data={},editor={},workspace={},products=[],media=[],blogPosts=[]}={}) {
  const settings=workspace.settings||{}
  const websiteType=String(data.websiteType||'Online Store').trim().toLowerCase()
  const isStore=['online store','ecommerce','e-commerce','shop'].includes(websiteType)
  const builderPages=editor.visualBuilderProject?.pages
  const hasPages=Array.isArray(builderPages)?builderPages.length>0:Array.isArray(data.pages)&&data.pages.length>0
  const steps=[
    {title:'Business direction',note:'Review the business type, audience and goals.',done:Boolean(data.businessName&&data.websiteType),action:'Review brief',page:'brief'},
    {title:'Choose a theme',note:'Select the visual foundation for your website.',done:Boolean(editor.theme?.name||editor.visualBuilderProject?.name),action:'Choose theme',page:'themes'},
    {title:'Build pages',note:'Create at least one customer-facing page and review content.',done:hasPages,action:'Manage pages',page:'pages'},
    {title:'Set navigation',note:'Review the header/footer destinations in the live preview.',done:Array.isArray(editor.header?.menu)&&editor.header.menu.length>0,action:'Edit navigation',page:'navigation'},
    ...(isStore?[{title:'Build the catalog',note:'For a shop, make at least one sellable product with price and available inventory.',done:products.some(p=>p.status==='Active'&&Number.isFinite(Number(p.price))&&Number(p.price)>=0&&Number(p.inventory)>0),action:'Products',page:'products'}]:[]),
    {title:'Add content',note:'Add media or publish a blog article where needed.',done:media.length>0||blogPosts.length>0,action:'Content',page:'media'},
    {title:isStore?'Store policies & defaults':'Contact & privacy details',note:isStore?'Review contact details, taxes, shipping, privacy, terms and refunds.':'Review contact details and privacy information before publishing.',done:isStore?Boolean(settings.contactEmail&&settings.privacyPolicy&&settings.termsPolicy&&settings.refundPolicy):Boolean(settings.contactEmail&&settings.privacyPolicy),action:'Store settings',page:'settings'},
    {title:'Publish the store',note:'An approved public snapshot exists; open the public URL to verify it.',done:Boolean(workspace.is_published),action:'Publishing',page:'settings'}
  ]
  const completed=steps.filter(x=>x.done).length
  return {
    steps,completed,total:steps.length,percent:Math.round(completed/steps.length*100),
    next:steps.find(x=>!x.done)||null,
    manualChecks:[
      'Open the published website on desktop and mobile; test menus and forms.',
      ...(isStore?[
        'Verify shipping and tax rules for the merchant jurisdiction and supplier.',
        'Place a sandbox test order; verify paid/unpaid transitions, stock and confirmation messages.',
        'Do not accept live cards or PayPal until the payment provider is connected and verified.'
      ]: [
        'Test contact links and forms; confirm the intended destination receives the message.',
        'Confirm public pages, services/portfolio details, privacy information and navigation.'
      ])
    ]
  }
}
