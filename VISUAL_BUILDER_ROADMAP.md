# CoBest Visual Builder Roadmap

## Target architecture
- React + TypeScript + Vite for the visual-builder core.
- Tailwind CSS for editor chrome only; the edited site never receives Tailwind.
- Zustand for the project store and full session undo/redo history.
- dnd-kit for Add-panel and Navigator drag/drop.
- IndexedDB behind a swappable `ProjectRepository` data layer.
- Website canvas rendered inside a sandboxed iframe so editor/site styles and custom HTML cannot reach the CoBest application DOM.
- Project model: project → pages → JSON node tree + reusable class/style maps by breakpoint/state.
- User-facing version history retains the latest 20 snapshots.
- Production deployment remains separate from GitHub development batches.

## Phase 1 — Data model, store, iframe canvas, select/hover
**Status: COMPLETE — CI PASS**

Implemented:
- Typed node/page/project/style data model.
- JSON page tree.
- Zustand project store.
- Full session undo/redo history.
- 20-snapshot user-facing version history.
- IndexedDB persistence through a swappable repository interface.
- Autosave status: dirty / saving / saved / error.
- Sandboxed iframe canvas.
- JSON tree → semantic HTML renderer.
- Reusable class map → responsive CSS compiler.
- Hover and selected outlines.
- Selected-element canvas label.
- Desktop 1440 / Tablet 991 / Mobile landscape 767 / Mobile portrait 478.
- CoBest “Edit website” opens the new builder.

## Phase 2 — Add panel, drag & drop, Navigator
**Status: COMPLETE — CI PASS**

Implemented:
- Tailwind-powered editor panels, isolated from site output.
- dnd-kit pointer/keyboard sensors.
- Add Elements groups:
  - Layout: Section, Container, Div, Grid, Flex, Columns
  - Basic: H1–H6 capable Heading, Paragraph, Link, Button, Rich text, List, Quote
  - Media: Image, Video, Icon, Background video
  - Forms: Form, Input, Textarea, Select, Checkbox, Radio, Submit, success/error states
  - Navigation: Navbar, Dropdown, Footer
  - Advanced: Tabs, Slider, Lightbox, Custom HTML, Collection List
- Pre-built sections: Hero, Features, Testimonials, Pricing, FAQ, CTA, Contact, Footer.
- Drag Add-panel items onto the canvas.
- Drag Add-panel items into Navigator layers.
- Navigator parent/child hierarchy.
- Before / inside / after drop targets.
- Reorder and nest existing elements.
- Expand/collapse Navigator branches.
- Drag overlay and canvas drop indicator.

## Phase 3 — Classes, Style panel, breakpoints
**Status: COMPLETE — CI PASS**

Implemented:
- Reusable classes and multiple classes per element (combo-class behavior).
- Create / rename / reuse / remove classes.
- States: none / hover / pressed / focused.
- Breakpoint cascade with inherited-vs-overridden indication.
- Layout controls:
  - display
  - flex direction / alignment / justify / wrap / gap
  - grid columns / rows / gaps
- Visual box-model controls for margin and padding.
- On-canvas draggable margin/padding handles.
- Size:
  - width / height
  - min / max
  - overflow
  - object fit
- Position:
  - static / relative / absolute / fixed / sticky
  - offsets
  - z-index
- Typography:
  - Google Fonts choices
  - weight / size / line height / letter spacing
  - alignment / transform / color
- Background color / gradient or image / sizing / position.
- Borders, radius, shadows, opacity, transforms, transitions.
- Units: px / % / em / rem / vw / vh / auto.
- Global color swatches compiled as CSS variables.
- Global text styles compiled as CSS variables.

## Phase 4 — Settings, pages, assets, inline text
**Status: COMPLETE — CI PASS**

Implemented:
- Element name and ID.
- Custom attributes.
- Link destinations:
  - URL
  - page paths
  - anchors
  - mailto
  - tel
  - new tab
- Image source / asset picker / alt text.
- Form action and success redirect setting.
- Per-page SEO:
  - title
  - meta description
  - slug
  - OG image
- Page create / rename / duplicate / delete / reorder.
- Asset image upload to project data and reuse across pages.
- Double-click inline text editing inside iframe.
- Keyboard shortcuts:
  - Ctrl/Cmd+Z
  - Shift+Ctrl/Cmd+Z
  - Ctrl/Cmd+C
  - Ctrl/Cmd+V
  - Ctrl/Cmd+D
  - Delete / Backspace
  - Escape
- Right-click context menu.

## Phase 5 — Components, interactions, preview
**Status: COMPLETE — CI PASS**

Implemented:
- Turn selected element/section into a reusable component.
- Component master/instance model.
- Editing the master propagates to component instances.
- Components can be inserted across pages.
- Navbar/footer can be saved as shared components.
- Interactions:
  - page load
  - scroll into view
  - hover
  - click
- Animations:
  - fade
  - slide up
  - slide left
  - scale
  - rotate
- Duration / delay / easing.
- Preview mode hides editor chrome.
- Preview enables links, forms, mobile navbar, tabs, slider, dropdown, and lightbox behavior.
- Last-20 version-history UI with restore.

## Phase 6 — CMS
**Status: COMPLETE — CI PASS**

Implemented:
- CMS collections.
- Custom fields:
  - text
  - rich text
  - image
  - link
  - date
  - reference
- CMS items.
- Collection List element.
- Collection binding in Element Settings.
- Collection cards rendered in canvas/site output.
- Automatic collection template page creation.
- Template bindings using `data-cms-field`.
- Export generates one item page per collection item and links collection cards to those pages.

## Phase 7 — Export/import
**Status: COMPLETE — CI PASS**

Implemented:
- Clean site CSS compiled from reusable classes.
- Responsive media queries at CoBest breakpoints.
- One HTML file per normal page.
- CMS item HTML pages generated from collection templates.
- Minimal JS runtime for:
  - mobile navbar
  - tabs
  - slider
  - dropdown
  - lightbox
  - forms
  - interactions
- Real ZIP generator with no runtime export dependency.
- `styles.css`.
- `site.js`.
- `sitemap.xml`.
- `assets/` folder with exported image bytes and rewritten references.
- Project JSON included in ZIP.
- Standalone project JSON export.
- Project JSON import.
- Editor-only `data-builder-*` attributes are not included in exported HTML.
- Runtime-only data attributes are emitted only when required by site behavior.

## Current MVP status
**Visual builder phases 1–7 are implemented on `qa/stabilization-batch`.**

Validation:
- `npm ci`: passing on recent CI runs.
- Vite production build: passing on recent CI runs.
- Node server startup: passing.
- Health endpoint smoke test: passing.
- SPA fallback smoke test: passing.

## CoBest platform integration
**Status: IMPLEMENTED IN CODE — LIVE RETEST PENDING**

The visual builder now coexists safely with the legacy editor format:
- IndexedDB remains the local/offline project backup.
- Each local project is keyed by active CoBest workspace/site.
- Authenticated autosave stores the visual project under the workspace editor payload.
- Partial workspace saves use server-side merge semantics so existing settings are preserved.
- Authenticated image assets use the existing CoBest/Supabase media upload endpoint.
- Publish includes the visual project in the normal published-store snapshot.
- Public visual pages render from the same project JSON/CSS compiler in an isolated iframe.
- Existing CoBest Shop, Cart, Checkout, and Customer Account remain accessible alongside visual pages.
- Existing legacy sites without a visual project continue to use the legacy storefront fallback.
- Legacy Home fallback now honors the merchant's selected/reordered section structure.

## Template library
**Status: COMPLETE**
- Business
- Portfolio
- Agency
- SaaS
- Ecommerce
- Restaurant
- Personal
- Blog

Templates are original CoBest starters, apply through the same project tree, and participate in undo/version history.

## Marketing website
**Status: COMPLETE IN CODE**
- Product
- Features
- Templates
- Resources
- Pricing
- Login / Start Building Free
- Builder preview
- Website/commerce capabilities
- Template gallery
- Testimonials
- FAQ
- Final CTA and footer

## Quality gates
The stabilization branch CI requires:
1. `npm ci`
2. no high/critical dependency audit findings
3. Vitest unit tests
4. production Vite build
5. server startup
6. health endpoint smoke test
7. SPA fallback smoke test

## Remaining step before production sign-off
Deploy this exact tested branch only when explicitly requested, then run the authenticated/live browser checklist for:
- cloud save/reload,
- visual publish/public parity,
- responsive editor behavior,
- asset upload,
- CMS,
- components/interactions,
- Shop/cart/account bridge,
- inventory guard,
- Stripe/PayPal configured-provider behavior,
- mobile browser layout.

## Railway policy
No Railway deployment is performed from this builder batch unless explicitly requested.
