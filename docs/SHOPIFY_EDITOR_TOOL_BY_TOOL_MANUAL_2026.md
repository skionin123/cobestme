# Shopify website editor — tool-by-tool operating manual and CoBest implementation study

**Reviewed:** 2026-10-18  
**Scope:** Shopify's **standard Theme Editor**, Shopify mobile app editor, official 2026 **Canvas** early access, related admin resource tools, official Academy and two Learn With Shopify 2026 video chapter outlines. Purpose is to understand *exactly where people click, what the control does, and how a CoBest beginner should do the equivalent*.

**Evidence levels:** `OFFICIAL` = Shopify Help Center or Shopify Academy published instructions; `VIDEO OUTLINE` = YouTube metadata/chapter index, not a verified watched demonstration; `PROPOSAL` = my CoBest product-design recommendation, **not** a Shopify fact or implemented code. Paths/icons vary by theme architecture/version and which editor a merchant gets. I have not logged into a private Shopify admin, watched every video minute, or physically tested every mobile device; do not claim that here.

## Core mental model: Website layout ≠ product data

- **Theme** is the overall website design package, preset style and common sections.
- **Template** controls a page type's structure (Home, Product, Collection, Page, Cart, Blog, Search); multiple products/pages can share the *same* template. Changing a shared template can update the layout across every assigned record.
- **Section** is a sizeable horizontal part of a template: Hero/Image banner, Image with text, Featured collection, Product information, FAQ, etc. The available sections depend on the theme.
- **Block** is an item inside a compatible section: Heading, Text, Button, Image, Slide, Price, Variant picker, etc. Blocks may have nesting/compatibility rules.
- **Content/resource record** is the actual Product/Collection/Page. Its title, price, stock, description, images and other data belong to that merchant record, **not** to an invented static template card.
- **Theme settings** change styles used throughout the store. **Section/block settings** customize only that instance.
- **Preview inspector** lets merchant click actual visible page elements and select the corresponding editable section/block rather than hunt through a tree.
- **App block/embed** is optional theme functionality added by compatible apps.
- **Canvas** (separate, limited-access 2026 editor) is not the normal Theme Editor. Canvas is desktop-only.

Source anchors:
- https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/features-overview
- https://help.shopify.com/en/manual/online-store/themes/theme-structure
- https://www.shopify.com/blog/customizing-store-theme (Sep 24, 2026)

## A. How to open and understand the standard Theme Editor

### 01. Open the editor [OFFICIAL]
**Desktop:** Shopify admin → **Online Store** → next to intended theme choose **Edit theme**. The theme can be Live or Draft; look for its status/name. Some earlier guides say Online Store > Themes > Customize; current Shopify Help Center primarily uses **Edit theme**. A theme showing the Canvas badge opens **Canvas** instead.

**Interface:**
- **Top/menu bar:** Sections, Theme settings, App embeds, theme name/status, Market selector, Template selector, Sidekick, Preview Inspector toggle, Mobile preview toggle, Undo, Redo, Save (or context-sensitive Publish).
- **Sidebar:** tree of header / current template / footer sections and nested blocks; click selects settings. On desktop widths >=1600 px the structure and settings are in separate side panels; narrower view stacks settings in a panel.
- **Preview:** live editing representation; mobile preview switch shows responsive layout.

**CoBest PROPOSAL:** simple three-part design: Page/Sections on left, central working preview, contextual Content/Style on right; phone uses drawers and bottom shortcuts. Show **DRAFT / SAVED / LIVE** unambiguously.

Source: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/features-overview

### 02. Change page or page template [OFFICIAL]
**Path:** in editor use top **Home page** / Template dropdown → choose desired Page/Product/Collection/Cart/Blog template. Select template to work on that layout. A product template preview may show a specific product; choose which product to preview as needed.

**Danger:** editing the template can modify *every product or page assigned to that template*. For a special layout, make an alternate template and assign it only to appropriate resources. Some section types can't be added to every page; checkout uses a separate editor.

**CoBest:** page selector includes Home, Shop, Product, Collection, About, Contact, Policies; transparent reusable template link; separate actual merchant products and layout.

Sources: https://help.shopify.com/en/manual/online-store/themes/theme-structure/templates
https://www.shopify.com/blog/customizing-store-theme

### 03. Sections sidebar/tree: expand, select, inspect [OFFICIAL]
Sections fall under shared **Header**, page **Template**, shared **Footer** groups. Expand/collapse arrows to see nested blocks; click one row to edit that section or block. Some block types or nested limits are theme-specific.

**Try it:** select **Image banner** in the Home template tree → change banner options → click **Heading** or **Button** below that section to edit its content.

**CoBest:** keep a readable nested list, clear selected-element highlight, drag handle separated from click-to-edit, and search/filter for larger pages.

Source: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/customizing-sections

## B. Actual drag/drop and element controls

### 04. Add a section [OFFICIAL]
**Desktop:** editor → choose template → **Add section** at correct position in the sidebar, or turn on **Preview inspector** and use contextual **Add section** appearing above/below the selected section → search/select an available section → edit options → **Save**.
**Mobile Shopify app:** open theme editor → template dropdown → **Sections → Add section** → select → **Add** → Save/✓.

**Example:** Home → Add section → Image banner or Featured collection → set its content and placement.

**CoBest:** show **+ Add section here** insertion between existing sections; offer section thumbnails, search, and source-specific defaults.

Sources: https://help.shopify.com/en/manual/online-store/themes/theme-structure/templates
https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/preview-inspector

### 05. Add a block [OFFICIAL]
**Desktop:** expand appropriate section, hover **Add block**, or preview inspector hover and click + near an existing block → choose compatible Heading/Text/Button/Image/theme/app block, search when necessary → edit → Save.
**Mobile app:** template → Sections → tap + Block within selected section → choose a supported block → Save/✓.

Not every block is legal in every section, and a section can reach its block count limit. A block that is incompatible cannot be placed there.

**CoBest:** category-grouped Add catalog (Text, Media, Commerce, Layout), clearly show allowed targets and friendly invalid-drop feedback.

Source: https://help.shopify.com/en/manual/online-store/themes/theme-structure/sections-and-blocks

### 06. Rearrange sections / reorder blocks [OFFICIAL]
**Desktop:** grip/drag handle next to section or block → hold and move to another allowed location → Save.
**Mobile app:** **Sections → Edit** → press-and-hold grip → reorder → **Done → Save**.
**Inspector:** when a section/block is selected, use **Move previous/next** arrows. Disabled arrow means the top/bottom boundary or invalid move.

**Important:** this is **structured reordering**, not free-position dragging anywhere on a blank pixel grid. Unsupported cross-section moves are rejected/restored to origin.

**CoBest:** provide both desktop drag and phone **Move up / Move down** plus tap-to-add fallback; free-position coordinates should be secondary advanced mode.

Sources: https://help.shopify.com/en/manual/online-store/themes/theme-structure/sections-and-blocks
https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/preview-inspector

### 07. Click-to-edit via Preview inspector [OFFICIAL]
Toggle **Preview inspector** from editor top bar (available on all free Shopify themes and activated by default). Click outlined preview element → corresponding settings open. Preview inspector may offer + section/block, move arrows, **Duplicate**, **Hide**, **Delete**.
**Phone:** tap element to select; tap twice to navigate website like a shopper. Long press a section to access manage tools.

**CoBest:** default click selects; provide clear **Edit text, Replace image, Change button link** quick actions. Separate **Preview as shopper** mode from editing interactions.

Source: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/preview-inspector

### 08. Hide vs remove vs duplicate [OFFICIAL]
- **Hide** uses eye/visibility icon; removes from customer view but keeps the configured block/section to unhide later in sidebar (inspector cannot unhide directly).
- **Remove** selects section/block → **Remove section/Remove block** or trash in sidebar/inspector; unlike Hide, deletion removes the element from the design tree.
- **Duplicate** via inspector makes a copy of section/block, with its content, to customize separately.
- Save/Publish as applicable.

**CoBest:** clearly distinguish **Hide from storefront**, **Duplicate**, **Delete**, and **Undo**. No surprises.

Sources: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/customizing-sections
https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/preview-inspector

## C. How to edit actual visible store elements

### 09. Edit a hero/banner [OFFICIAL + THEME-DEPENDENT]
Go to **Home page** → **Image banner** (or Hero, Slideshow depending on theme) → change image/media, layout/crop/height, text content in nested Heading/Text blocks and the CTA in Button block → preview mobile → Save. Section names and available settings vary by theme.

**CoBest:** a prebuilt Hero should expose **Replace Image, Heading, Subtitle, Primary Button Text, Button Destination, Alignment, Spacing** in one beginner-friendly panel, not separate developer controls.

Sources: https://help.shopify.com/en/manual/online-store/themes/theme-structure/sections-and-blocks
https://www.shopify.com/blog/customizing-store-theme

### 10. Heading, paragraph and rich text [OFFICIAL]
Click the **Heading**, **Text**, or **Rich text** block in sidebar or preview; edit copy and theme-provided typography/alignment settings; Save. Static pages/products often use a **different rich-text editor** in Shopify admin for descriptions and content.
**Page rich text:** Online Store → Pages → page → Content → text styling / link / image / video → Save.

**CoBest:** inline text editing with an inspector; don't confuse editing "Product title block" styling with changing the actual product's title in the product catalog.

Sources: https://help.shopify.com/en/manual/shopify-admin/productivity-tools/rich-text-editor
https://help.shopify.com/en/manual/online-store/add-edit-pages

### 11. Button and CTA destination [OFFICIAL]
Select compatible **Button** block → edit label and **link/destination** in available settings; choose internal page/product/collection if picker available, or a validated external URL; Save. In a banner, button options may be built into the section instead of nested blocks.

**CoBest:** clear label + URL picker + external open option; warn on broken links; button should navigate in Preview.

Source: https://help.shopify.com/en/manual/online-store/themes/theme-structure/sections-and-blocks

### 12. Upload/change images [OFFICIAL]
Editor → selected Image / Image banner block → **Image → Select image → Add images** (or choose existing) → file → **Done** → Save. Shopify may also offer **Explore free images**.
**Mobile:** Shopify app → theme editor → Sections → target → Image → Select image → Add images → select → Done → Save/✓.
**Focal point:** select image in image editor → click key visual point / drag blue point → Save; compatible themes try to keep that point in cropped mobile frames.
**Caution:** crop and positioning depend on image aspect ratios and theme. Public media is not suitable for confidential files.

**CoBest:** media library, replacement, alt text, thumbnail, focal-point selector, desktop/mobile preview; validate size/types and store isolation.

Source: https://help.shopify.com/en/manual/online-store/images/theme-images

### 13. Shared header, logo, announcement bar, footer [OFFICIAL]
Sidebar **Header** includes header and optional announcement bar; **Footer** includes footer and often email signup, social links or other sections. They are shared across pages.
- **Logo:** Theme settings → Logo → Select image → set desktop width → Save; depending on theme, additional header controls may apply.
- **Announcement:** select announcement/header section → edit its available text/link options → Save.
- **Footer:** choose footer section → edit text, menu association, signup/social layout as supported → Save.

**CoBest:** shared global header/footer settings with selectable brand logo and real merchant links, consistent across all pages. Don't duplicate navigation for each page.

Sources: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/customizing-sections
https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/theme-settings

### 14. Navigation menus and nested dropdowns [OFFICIAL; ADMIN tool, not only theme editor]
**Create/edit link:** Admin → **Content → Menus** → select Main/Footer menu → **Add menu item** → name → select Home/Product/Collection/Page/policy or URL → Add → **Save menu**.
**Reorder/nest:** drag handle in Content → Menus to change order and indent under parent → Save. The header's section/theme setting chooses which menu to display.
**Safety:** choose an internal resource rather than pasting its URL when possible; deleting the underlying resource may delete the associated navigation item.
**CoBest:** navigation menu manager with live link validation and dropdown nesting.

Source: https://help.shopify.com/en/manual/online-store/menus-and-links/editing-menus

### 15. Actual pages vs templates [OFFICIAL]
**Actual page content:** Admin → **Online Store → Pages → Add page**, fill Title and Content, select Visible/Hidden, Save. Then add it to **Content → Menus** if it should appear in navigation.
**Layout/template:** Theme editor top Template dropdown → Pages template → add/rearrange sections. Create alternate templates for special page designs, and assign them to specific page records.
**SEO:** Page editor → Search engine listing preview → edit title/description/URL handle.

**CoBest:** separate page content and visual layout where practical, ensure pages become accessible in the menu.

Sources: https://help.shopify.com/en/manual/online-store/add-edit-pages
https://help.shopify.com/en/manual/online-store/themes/theme-structure/templates

### 16. Featured collection / product grid [OFFICIAL; RESOURCE BINDING]
Create actual products under **Products** and collections under **Products → Collections** (or corresponding current catalog navigation), then in theme editor Home → **Add section → Featured collection / Product grid** → **Select collection** / resource picker → real collection → choose row/count/card settings if provided → Save.
**What changes where:** Layout, card count, typography are **theme** data. Product titles, images, prices, stock and variants are **product** data; edit in Products admin. A new resource editor within the theme editor is rolling out and **not universal**, so don't claim every account can edit a product directly in preview.

**CoBest:** real product/collection selectors and preview; never put static mock pricing into customer-facing product blocks.

Sources: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/add-and-edit-store-resources
https://www.shopify.com/blog/customizing-store-theme

### 17. Product page template and options [OFFICIAL]
Theme editor → Template dropdown → **Products → Default product** (or an alternate template) → select Product information section; edit Title, Price, Variant picker, Quantity selector, Buy buttons and image/media layout if supported. Save.
To edit actual product name/price/variants/stock: Admin → **Products → product → edit → Save**. Changes to a shared product template affect *all* products using it.

**CoBest:** keep product page responsive, reflect real variant SKU/price/inventory, keep checkout accurate; CoBest's unfinished variant checkout remains an independent release blocker.

Sources: https://www.shopify.com/blog/customizing-store-theme
https://help.shopify.com/en/manual/products/add-update-products

### 18. Connect dynamic product metadata (metafields) [OFFICIAL; ADVANCED OPTIONAL]
Admin → define product metafield in Custom data; set per-product values. In compatible product-template block, next to compatible setting click **Connect dynamic source** icon → choose appropriate product metafield → Save. Example: different candle **burn times** automatically shown for each product.
Not every theme or block supports data binding, and metafields require compatible types.

**CoBest:** only build this when catalog/checkout is reliable. Begin with fixed bindings for real product fields; custom fields later.

Source: https://help.shopify.com/en/manual/online-store/themes/theme-structure/sections-and-blocks

## D. Theme settings — the global design controls

All start in **Edit theme → Theme settings** icon. Available fields vary by theme/version.

| Tool | How to use it in Shopify | CoBest equivalent |
|---|---|---|
| **Logo** | Theme settings → Logo → Select image (existing/upload) → width slider/alt text → Save | Brand profile, responsive logo sizing |
| **Favicon** | Theme settings → Logo or Favicon (varies by version) → Select image → Save | Browser-tab icon in site settings |
| **Colors** | Theme settings → Colors → manage palette or schemes; optionally override one section/block color → Save | Brand color tokens + local overrides |
| **Typography** | Theme settings → Typography → Change **Heading** or **Body** font; sizes/sliders → Save | Readable font presets, mobile scale |
| **Layout** | Theme settings → Layout → page width and spacing between sections/grid elements → Save | Content max-width, section spacing |
| **Animations** | Theme settings → Animations → enable/adjust available reveal-on-scroll/hover effects → Save | Low-motion defaults; accessibility |
| **Media/card style** | Theme settings → relevant visual/media settings (available options vary) | Border, radii, crop and shadows |
| **Social media** | Theme settings → Social media → enter full URLs → Save | Store-wide verified social links |
| **Search behavior** | Theme settings → Search behavior → search suggestions and optional product price/vendor → Save | Useful storefront search and suggestions |
| **Cart presentation** | Theme settings → Cart → Drawer / Page / Popup notification; optional cart note; optional featured collection → Save | Merchant choices for cart presentation |
| **Theme style/preset** | Theme settings → Theme style → choose style → Change style → Save; changing style can replace customized theme settings | Named style presets with confirmation/undo |
| **Custom CSS** | Theme settings → Custom CSS (experienced users only) → CSS code → Save | Advanced feature; not the beginner path |

**Color nuance:** newer Horizon 4 themes can use named **color palettes** (central colors update all bound uses); other themes use **color schemes** applied to sections. CoBest can offer both brand palette and per-section override.

**Design rule:** theme settings are global. The merchant shouldn't adjust identical button styles 24 times.

Official source: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/theme-settings

## E. Optional apps and AI editing tools

### 19. App blocks [OFFICIAL]
Install compatible app → Edit theme → choose relevant template/section → **Add block** → **Apps** → pick installed app block → adjust/reposition → Save. Example: product-specific reviews or size chart. Only compatible section/page types show applicable app blocks.

### 20. App embeds [OFFICIAL]
Editor left **App embeds** icon → choose already installed app → activate toggle → inspect settings → Save → Preview. Example: chat bubble or tracking script. This is different from an inline page block.
Both are **optional extension capabilities**; don't conflate Shopify app ecosystem with CoBest's existing built-in widgets.

Source: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/apps

### 21. Sidekick AI [OFFICIAL; optional]
In Shopify theme editor, open Sidekick or use **Generate text** near supported text field → describe desired copy, review, edit and Save. Shopify describes custom block creation from prompts; generated copy/code needs human review. Sidekick may move/remove/hide sections on instruction.

**CoBest:** prioritize manual predictable section editing first. AI can help draft copy and layout later, but must never overwrite merchant content without preview, consent and recovery.

Source: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/sidekick

### 22. Edit theme code [OFFICIAL; developer tool, not MVP onboarding]
Admin Online Store → theme actions **... → Edit code**. Files include Liquid, CSS/JS, JSON templates, assets. Save code changes only with backups, test and review. This is distinct from zero-code design.
**CoBest:** hide raw code behind Advanced/Developer, if added at all.

Source: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/edit-code/edit-theme-code

## F. Undo, reset, backups, preview, Save and Publish

### 23. Undo / Redo [OFFICIAL]
Standard Theme Editor top bar Undo/Redo, or **Ctrl+Z / Ctrl+Y** (Windows) and **Cmd+Z / Cmd+Y** (Mac). Works on **unsaved changes**. **After saving, undo/redo history is no longer available in that editor session.** Disabled icons mean nothing to undo/redo.
**CoBest PROPOSAL:** Undo and Redo plus deliberate **Start Over → confirm → Undo immediately**, and persistent saved versions that survive Save. Clearly distinguish published and draft states.

Source: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/features-overview

### 24. Backup / duplicate theme [OFFICIAL]
Admin Online Store → intended theme **... → Duplicate** before extensive editing; a copy appears in drafts. Editing a duplicate gives a safe alternative to changing the live version.
Theme ZIP download doesn't include products, pages, collections and content records; a theme file backup is **not a full store backup**.
**CoBest PROPOSAL:** autosnapshot before Start Over/preset switch/publish, named revisions, preview and restore.

Source: https://help.shopify.com/en/manual/online-store/themes/managing-themes/duplicating-themes

### 25. Responsive preview [OFFICIAL]
In Theme Editor top bar choose mobile preview; collapse sidebar for larger view. This **previews the storefront on a mobile-shaped display**, not the same as editing from a physical phone.
**CoBest:** distinct responsive widths and real mobile-device editing, with actual viewport tests.

Source: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/features-overview

### 26. Publish vs Save [OFFICIAL, IMPORTANT]
Shopify uses **published Live theme** and **unpublished Draft themes**. Only one is live; publishing a different theme moves the previous live one to Draft themes. In a **live theme** editing workflow, saving/publishing design changes can affect the customer-visible storefront; **do not assume Save means safe unpublished changes in the standard editor**. The button/confirmation behavior is context-dependent in evolving Shopify UI.
For safer redesign, **duplicate the live theme**, edit/preview its draft, and explicitly Publish it when ready.

**CoBest PROPOSAL:** make a stronger, consistent rule: **Save Draft never changes live site; Publish reviews and updates live site**.

Source: https://help.shopify.com/en/manual/online-store/themes/managing-themes/publishing-themes
https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/customizing-sections

### 27. Share unpublished preview [OFFICIAL]
Draft themes can be previewed for feedback without publishing them; Shopify has specific preview links and time limits. Do not conflate a visitor preview with the live storefront or with preview inspector mode.
**CoBest:** safe temporary preview share for merchant review; do not expose unpublished order/customer data.

Source: https://help.shopify.com/en/manual/online-store/themes/adding-themes

## G. Editing on a physical phone

### 28. Shopify app mobile editor [OFFICIAL]
- Open **Shopify app → Menu → Online Store → Edit**, or **Manage all themes → Edit theme**, depending on current app screen.
- Select Template from **Home page** dropdown.
- Tap **Sections** → select section/block → settings in the mobile editor.
- **Add section** from Sections; **Add block** within compatible section.
- To reorder: **Sections → Edit → long press drag handle → Done → Save/✓**.
- To edit image: selected section/block → **Select image → Add images → Done → Save/✓**.
- Theme settings (colors, typography, logo, etc.) are available via menu / Theme settings.
- Preview inspector: tap a section/block to select and open controls in bottom sheet; double tap to browse like shopper.

**CoBest PROPOSAL:** phone bottom toolbar **Add, Layers, Style, Undo, Redo, Save**, tap-to-add and explicit **Move Up/Down** alternatives to long-press dragging. Keep Save/Preview/Exit visible above phone keyboard. Test real Android Chrome and iPhone Safari (Shopify's mobile editing is in its *app*, CoBest's implementation is currently browser-based).

Sources:
https://help.shopify.com/en/manual/shopify-admin/shopify-app/mobile-online-store
https://help.shopify.com/en/manual/online-store/themes/theme-structure/sections-and-blocks
https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/preview-inspector

## H. New Shopify Canvas (2026 EARLY ACCESS) — separate experience

### 29. Canvas overview and editing [OFFICIAL]
**Eligibility:** Certain accounts only; desktop only; currently Shopify-created/custom themes, not general third-party themes. Canvas must not be presented as Shopify's normal mobile editor.

**Open:** Online Store → Themes → New (create theme) / Duplicate in Canvas on supported themes / Edit theme for a theme bearing Canvas badge.

**Navigation tools:**
- **Template overview:** zoomed-out, multiple templates side by side. Pan mode or Space+drag, zoom to inspect.
- **Jump to...:** navigate to template quickly.
- **Full screen:** open template, Inspector on/off to select blocks vs browse links.
- **Preview width:** Desktop / Tablet / Mobile / Full width or custom by dragging resize handles.
- **Direct text edits:** click supported text blocks with inspector; change text directly or change selected block settings.
- **Sidekick:** theme-wide prompt or selected-block prompt for editing/generation.
- **Undo / Redo:** your direct edits, but **Sidekick changes clear the Undo history**; ask Sidekick to reverse or restore an earlier version instead.
- **Theme history:** open version list → preview older version → Restore; restored design is not visible to customers until re-published.
- **Autosave:** changes save in Canvas, but **Update/Publish** is still needed to make customers see them on live theme.
- **Publish:** button says Publish (draft theme) or Update (current published theme); review changes and Publish changes.

**CoBest:** borrow editable draft + version history, direct text, preview width; don't replace straightforward Add block with AI-only generation.

Sources:
https://help.shopify.com/en/manual/online-store/themes/canvas
https://help.shopify.com/en/manual/online-store/themes/canvas/navigating
https://help.shopify.com/en/manual/online-store/themes/canvas/customizing
https://help.shopify.com/en/manual/online-store/themes/canvas/requirements

## I. Real beginner practice — create a store home page

These are **reconstructed exercises from official feature instructions**, not a claim that I clicked through a live Shopify account.

**Exercise 1: 15-minute homepage redesign**
1. Online Store → Themes → **Duplicate** published theme.
2. On the copy, Edit theme → template **Home page**.
3. Choose Header: add logo, confirm navigation.
4. Add **Image banner**; upload image and set focal point; edit Heading/Text/Button label and destination.
5. Add **Featured collection**, choose a real collection with real products.
6. Add **Image with text** (brand story) and **Newsletter/email signup** section if available.
7. Drag Featured collection above/below brand story; try inspector Move arrows.
8. Temporarily **Hide** a section; **Unhide** from sidebar; duplicate a section, then Undo your last unsaved change.
9. Theme settings → Colors, Typography, Cart and Layout; set a coherent brand style.
10. Check mobile preview, header/menu links, images, product stock; Save the **draft**.
11. Open draft preview as customer, then explicitly publish only when ready.

**Exercise 2: Product page and catalog link**
1. Admin Products → create sample product with name, correct price, stock and image → Save.
2. Add product to a collection.
3. Edit draft theme → Home → Add Featured collection → link it to that collection.
4. Template selector → Products → Default product → inspect title, variant options, price, image and buy-button blocks.
5. Change an actual product price from Products admin, verify preview reflects product data without editing template static text.
6. Confirm editing default product template would affect all products assigned to it.

**Exercise 3: A phone edit**
1. Shopify app → Online Store → theme editor → Home.
2. Sections → Add section, choose available block/section, save.
3. Sections → Edit → long-press reorder handle → Done → Save.
4. Select banner image, replace it from phone.
5. Preview layout, compare with desktop view and customer experience.

**Exercise 4: Protect against a destructive change**
1. Duplicate theme before changing style.
2. Try a new theme style and see what global colors/fonts changed.
3. Use Undo before Save; if already saved in Theme Editor, go back to the duplicate (not an unlimited history timeline).
4. In eligible Canvas, open Theme history → preview earlier version → Restore → Update/Publish when approved.

## J. CoBest engineering comparison and concrete backlog (PROPOSAL)

| Priority | User action | Shopify design lesson | CoBest acceptance test |
|---|---|---|---|
| P0 | Select ready-made template | Give merchant a working structure | Start with understandable hero/shop/footer |
| P0 | Add/drag/reorder sections | Structured sections and drop targets | Click Add, drag, Move Up/Down phone |
| P0 | Tap visible block and edit | Preview inspector + contextual panel | Text/button/image edit without developer terms |
| P0 | Never lose work | Save status, Undo, backups | Save/reload, Undo reset, persisted revision restore |
| P0 | Edit on phone | Dedicated mobile editor | Real iOS/Android smoke tests |
| P0 | Product data consistent | Product resource vs template | Price/stock/variant from real merchant products |
| P0 | Safe publication | Draft theme vs live theme | Save Draft unchanged live; Publish atomically |
| P1 | Shared Header/Footer | Section groups | Edit once across pages |
| P1 | Brand-wide control | Theme settings/tokens | Theme-wide palette/fonts with local overrides |
| P1 | Menus | Separate menu manager with resource links | Internal menu links survive page changes |
| P1 | Responsive media | Image crop/focal point | Correct mobile hero crop |
| P1 | Clear nested structure | Section/block tree and boundaries | Reveal hierarchy; refuse incompatible drops |
| P1 | Contextual commerce blocks | Select real product/collection | Featured collection cards update with data |
| P2 | App widgets | Optional extension system | Versioned, tenant-scoped plugins |
| P2 | Sidekick | AI helper (optional) | Never destructive without review |
| P2 | Canvas overview | Multi-template wide canvas | Defer until beginner launch flow works |

**Current CoBest grounding:** draft PR #25 already has responsive visual builder, mouse/touch drag, tap-to-add, undo/redo, reversible start-over, page/save/publish flow and a phone toolbar. Its physical device verification is **not** done; GitHub #33. Desktop resize intermittent CI #34. Structured editor UX/design improvements #35. Saved-version restore, rich dynamic storefront bindings, publish/data isolation, true variant checkout and merchant payment ownership remain incomplete and need verified implementation.

### Engineering order
1. Use existing code as base; no total rebuild.
2. Add **Move up/down** and contextual **+ Add section here** before complex new layouts.
3. Add stable content/style quick inspector and real product/collection bindings.
4. Add saved-version history/restore with tenant isolation and explicit draft/publish separation.
5. Verify iOS Safari/Android Chrome real-device use and existing desktop drag tests.
6. Integrate only after branch QA and platform staging/payment/stock release gates.

## K. Video material used (outline only, not watched end-to-end)

- **Learn With Shopify**, [The COMPLETE Shopify Tutorial 2026](https://www.youtube.com/watch?v=_1caEZ7t3UY), 2026-04-27. Chapters: 08:54 store design; 09:12 Theme Editor; 10:04 theme editing; 11:20 colors; 11:39 fonts; 12:11 logo/favicon; 13:05 content sections; 14:45 menus; 16:32 preview; 18:52 checkout and payments; 25:49 shipping; 36:18 fulfillment; 44:34 pre-launch; 1:28:47 product page optimization. Checked published video description/chapter index.
- **Learn With Shopify**, [Official Shopify Tutorial For Beginners Part 1](https://www.youtube.com/watch?v=RWI59fC7Z48), 2026-02-02. Same beginner editing topics, 9:12–16:52 theme/design workflow. Checked published video description/chapter index.
- **Shopify Academy**, [Customizing Themes](https://www.shopifyacademy.com/path/shopify-development-fundamentals/customizing-themes) (free registration). Public curriculum lists Horizon editor, blocks and Liquid page lab; course lessons behind registration **not reviewed in full**.
- **Hogan Chua**, [Shopify Tutorial for Beginners](https://www.youtube.com/watch?v=YmVBbW3e9Q8), 2025 (independent). Published chapter pointers in previous study: 04:05 header; 10:41 hero; 24:22 homepage; 42:58 templates; 55:27 product pages; 1:04:50 footer. Video content **not watched end-to-end**.

## Source reading index — official

1. Standard Theme Editor & shortcuts: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/features-overview
2. Section tree: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/customizing-sections
3. Sections and blocks: https://help.shopify.com/en/manual/online-store/themes/theme-structure/sections-and-blocks
4. Inspector: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/preview-inspector
5. Templates: https://help.shopify.com/en/manual/online-store/themes/theme-structure/templates
6. Theme settings: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/theme-settings
7. Image uploads/focal points: https://help.shopify.com/en/manual/online-store/images/theme-images
8. Navigation: https://help.shopify.com/en/manual/online-store/menus-and-links/editing-menus
9. Page content: https://help.shopify.com/en/manual/online-store/add-edit-pages
10. Product records: https://help.shopify.com/en/manual/products/add-update-products
11. Dynamic resources rollout: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/add-and-edit-store-resources
12. Apps and embeds: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/apps
13. Sidekick: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/sidekick
14. Mobile app: https://help.shopify.com/en/manual/shopify-admin/shopify-app/mobile-online-store
15. Duplicate & restore safety: https://help.shopify.com/en/manual/online-store/themes/managing-themes/duplicating-themes
16. Publishing and live theme: https://help.shopify.com/en/manual/online-store/themes/managing-themes/publishing-themes
17. Canvas navigating: https://help.shopify.com/en/manual/online-store/themes/canvas/navigating
18. Canvas customizing: https://help.shopify.com/en/manual/online-store/themes/canvas/customizing
19. Canvas eligibility: https://help.shopify.com/en/manual/online-store/themes/canvas/requirements
20. Shopify 2026 customization article: https://www.shopify.com/blog/customizing-store-theme

**Research-only document;** no new CoBest editor functionality was implemented by authoring this file. Don't claim Shopify's Canvas is universally available or mobile-compatible.
