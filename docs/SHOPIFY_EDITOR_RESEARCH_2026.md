# Shopify Editor Research → CoBest Merchant-First Editor Blueprint

**Research date:** 2026-10-18  
**Research method:** Current Shopify Help Center, Shopify's September 2026 customization article, Shopify Academy's official course description, and externally published YouTube tutorial descriptions/chapter timelines. This is an **external workflow/documentation review**, not firsthand login to a merchant Shopify store and not a claim to have viewed each entire video.

**Product goal:** CoBest is a Shopify-like **multi-merchant** ecommerce platform; each merchant creates, customizes, publishes and sells from their own online storefront. CoBest should prioritize easy, reversible website editing over developer-facing complexity.

## A. Verified workflows from Shopify's standard Theme Editor

Source: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/features-overview

1. Merchant visits **Online Store → theme → Edit theme**.
2. **Top bar** navigates between page templates and includes responsive preview, Undo/Redo and Save.
3. **Left navigation/sidebar** presents a structural tree: Header, current Template, Footer → sections → blocks.
4. Merchant selects a section or block in the tree **or directly in the preview**; the relevant properties/settings appear in a sidebar (second right sidebar on larger screens).
5. Add a section, add blocks inside compatible sections, drag the section/block's reorder handle, hide, duplicate or remove. The preview updates as changes are made.
6. Change global colors, fonts, favicon and other design tokens in **Theme settings** instead of editing every section.
7. Templates define page-type layout. Product/collection records provide real content; shared template changes propagate to records using that template.
8. The mobile Shopify app supports add/rearrange/edit sections and blocks via a touch-friendly workflow. **Previewing a mobile layout on desktop is different from editing on a mobile phone.**
9. Standard Theme Editor Undo/Redo applies to **unsaved** customizations; after Save, previous undo history cannot be reused. Shopify recommends duplicating a theme before risky changes.

Sources:
- https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/customizing-sections
- https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/preview-inspector
- https://help.shopify.com/en/manual/online-store/themes/theme-structure/sections-and-blocks
- https://help.shopify.com/en/manual/online-store/themes/theme-structure/templates
- https://help.shopify.com/en/manual/shopify-admin/shopify-app/mobile-online-store

**Important nuance:** Section/block types and allowed drop positions vary by theme. A block is not necessarily freely positionable anywhere on the page. Invalid/incompatible destinations do not accept the move.

## B. Shopify's second editor: Canvas (2026 early access, not universal)

Sources:
- https://help.shopify.com/en/manual/online-store/themes/canvas
- https://help.shopify.com/en/manual/online-store/themes/canvas/navigating
- https://help.shopify.com/en/manual/online-store/themes/canvas/customizing
- https://help.shopify.com/en/manual/online-store/themes/canvas/requirements

The new **Shopify Canvas** is in early access for certain stores, desktop only. It opens multiple templates in a zoomable overview, allows clicking an individual template for full-screen editing, adjusting mobile/tablet/desktop preview width, directly editing text (where supported), and requesting AI assistant Sidekick changes. Canvas auto-saves draft changes; **Publish/Update** makes them visible to customers. Canvas has **version history and Restore**, while the classic theme editor has only unsaved Undo/Redo.

Canvas has limitations: it cannot be used for every third-party theme; adding a new block manually is not supported (merchant must request it from Sidekick); app blocks and embeds aren't configured there. **Do not position Canvas as Shopify's default or as mobile-compatible.** CoBest should imitate its *safe draft + history* concept rather than assume its AI-first editing constraints are a good beginner default.

## C. How customers connect website content to actual products

Source: https://www.shopify.com/blog/customizing-store-theme (Sep 24, 2026)

Editing a page's **layout** (hero/featured product grid/product detail structure) is different from changing product **records** (title, price, inventory, images, variants). Data-backed blocks/sections pull live product/collection resources; editing a shared product template doesn't require copying all product descriptions into each page.

New resource-editing controls are described as rolling out gradually, not guaranteed on every merchant store:
https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/add-and-edit-store-resources

**CoBest implication:** product grid should select an actual collection, product cards should bind to merchant products, and product detail layouts should use accurate variant/price/stock data. Never present illustrative template products as real sellable items.

## D. Verified tutorials and learning materials

### 1. Official Shopify Academy — Customizing Themes (free registration)
https://www.shopifyacademy.com/path/shopify-development-fundamentals/customizing-themes

Curriculum includes *Customizing Horizon with the theme editor*, *Theme building blocks*, and a collection-page lab. Strongest structured learning source for CoBest's **section/blocks/theme** architecture. Later lessons include Liquid (developer-focused), not needed for CoBest's initial beginner editor.

### 2. Shopify's illustrated 2026 theme customization guide
https://www.shopify.com/blog/customizing-store-theme

How to start from a theme, manage sections and blocks, theme settings, templates, store resources, and mobile preview. Use as merchant-facing process reference.

### 3. Beginner video with chapter index — Hogan Chua (independent creator, July 3 2025)
https://www.youtube.com/watch?v=YmVBbW3e9Q8

Published video description/chapter timestamps: **02:27** Horizon theme; **04:05** header editing; **08:53** logo; **10:41** hero; **14:42** hero slider; **16:35** products; **22:37** collections; **24:22** homepage/featured products; **36:02** AI; **42:58** page templates; **55:27** product pages; **1:01:46** menus; **1:04:50** footer; **1:10:12** payments/settings; **1:14:30** shipping; **1:25:45** fulfillment.

Helpful because it follows **a merchant's end-to-end selling workflow**, not just the design canvas. Video description discloses affiliate links; treat it as external teaching, not official policy.

### 4. Focused AI block tutorial — Just Ask Jake (independent, July 14 2025)
https://www.youtube.com/watch?v=flmzf7a0bss

Video description covers generating a block in the Shopify Theme Editor from a prompt, then previewing/editing/deleting it. Useful P2 exploration, **not** an MVP dependency.

**Verification caveat:** Descriptions/timestamps were checked in search materials. We have not watched or executed the videos end to end, nor entered a test Shopify admin as a merchant; direct product behavior is grounded in Shopify's official documentation instead.

## E. CoBest editor experience — what to implement/adopt next

### P0: Best beginner workflow (must be straightforward on desktop *and phone*)

1. **Choose Template** (store type and style presets), then show a complete usable demo site with a real homepage, product listing, product detail and policy pages.
2. **Editor layout**: left **Sections** tree and Add catalog, center **Live preview** with selected element outlines, simple **Style/Content** options. Header/Footer shared globally.
3. **Tap or drag a ready-made section** (Hero, Image with text, Product grid, Reviews, FAQ, Newsletter, Contact), and reorder within valid drop zones. On phone prefer **Tap Add + Move Up/Down** in addition to touch drag; avoid relying on difficult free-position dragging alone.
4. **Click/Tap element to edit** heading, photo, button/link, spacing and alignment directly, without opening developer-level controls. Advanced style controls can be behind an explicit secondary setting.
5. **Visible Back to Dashboard, Undo, Redo, Start Over, Preview, Save/Autosave and Publish**; Undo must work after resetting the draft. Restore earlier saved design versions and duplicate drafts as a future safety improvement.
6. **Draft/public separation**: saving a draft does not change customers' live storefront; publishing has explicit confirmation and runs launch validation.
7. **Responsive layout first**: mobile preview and mobile editing; verify no horizontal clipping, inaccessible drawers or overlap of panels/toolbar.
8. **Content versus data**: choose actual merchant products/collections for Product Grid and Featured Product sections; templates must not fabricate product pricing or stock.

### P1: Important quality details from Shopify

- Hover/tap **Add section here** between existing sections; contextual move/duplicate/hide/delete.
- Expand/collapse/navigate nested layers; meaningful block names; a selected element automatically opens a small understandable inspector.
- One-click change of logo, theme colors, typography, buttons, gallery and social links.
- Safe move constraints and no accidental layout destruction; accessible mobile reorder via Up/Down actions.
- Real reusable product/collection templates and consistent site header/footer.
- Autosave state with **Saving / Saved / Not published**, plus version list and restore with a preview.
- Theme duplicate/backup before large redesigns and a clear reset/restart confirmation.
- Device-appropriate UI: desktop design workspace versus phone's bottom bar/sheets.

### P2: Later, *after end-to-end merchant store launching works*

- Prompt-generated design blocks (Shopify's Horizon/AI influence).
- Multiple template overview/Canvas-like wide workspace.
- Theme app extensions and complex animations, advanced CSS/absolute-position controls.

## F. Proposed QA scenarios to test together

- T04: choose template; add Hero and Product grid, edit copy/image, move a block, undo and redo.
- T04: Reset draft → confirm → Undo restores entire design and site name; no publish unless explicitly requested.
- T04: duplicate draft/theme, save changes, reload, restore previous saved version (mark BLOCKED until implemented).
- T05: header and footer appear across all pages; edit globally once, verify on Home and Product pages.
- T05: product section binds to a real product from merchant catalog, shows correct image/price/out-of-stock status.
- T13: real Android Chrome/iPhone Safari **tap add**, long-press drag, reorder via buttons, style editing, save/reload, return to dashboard, visible overflow/scroll checks.
- T06: draft save/reload does not change published site; review and publish applies correct storefront snapshot.
- T14: independent merchants have isolated themes, assets and published websites.

## G. Current CoBest status — grounded in existing project work

Draft PR #25 currently contains a structured visual editor, ready-made sections, product site flows, desktop Undo/Redo, reversible Start Over, phone toolbar, touch sensor and automated Playwright phone workflow checks. These are **developer-branch changes**, not publicly deployed. The editor and real-phone QA are tracked in #33; intermittent desktop resize CI has #34. Cross-tenant and commerce/payment release blockers remain in #27–#32.

**Research deliverable only.** This document records recommendations and verified Shopify behavior. It does not claim new editor features have been implemented as a result of this research, and it should not be treated as proof that CoBest matches Shopify.
