# CoBest editor: deep comparative tool research & reproducible interaction blueprint (2026)

**Research date:** October 24, 2026. **Purpose:** Study how leading visual website builders' editing **tools behave**, and translate verified interaction patterns into an original, beginner-friendly CoBest ecommerce site builder.

**Sources:** Publicly accessible official documentation and published academy lesson descriptions from Shopify, Webflow, Wix Studio, Framer, Squarespace, and Elementor. No private competitor account was accessed, and video titles/transcripts/lesson summaries should not be misrepresented as a full real-account hands-on audit. All CoBest-specific recommended interaction details below are **product proposals**, not competitor claims or already-shipped functionality. No competitor code, trademark, icons, artwork, screenshots, CSS, theme, or protected design is copied.

## 1. Source-supported comparison, down to gestures and panel behavior

| Builder / interaction | Verified behavior | What CoBest can learn | Source |
|---|---|---|---|
| Shopify **Preview inspector** | Click outlined section/block in canvas to open settings; add section above/below selected section; add compatible block via contextual +; move previous/next; duplicate/hide/delete | Keep selected element centered; context + insertion and action bar; layer tree remains fallback | https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/preview-inspector |
| Shopify **Sidebar** | Tree groups content by template, header/footer and blocks; double sidebar on wide screens, stacked on narrower | Adaptive panels, reduce clutter | https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/features-overview |
| Shopify **Drop validity** | Blocks can move between compatible sections; invalid/incompatible drop reverts to origin | Validate data model and expose invalid-drop explanation | https://help.shopify.com/en/manual/online-store/themes/theme-structure/sections-and-blocks |
| Webflow **Add panel** | Click-to-add, drag onto canvas, drag into Navigator; category groupings for Layout, Basic, Typography, CMS, Media, Forms, Components | Same element accessible by click, drag and keyboard, all targeting structured insert positions | https://help.webflow.com/hc/en-us/articles/33961270096659-The-Add-panel |
| Webflow **Drag hover feedback** | Blue insertion line indicates target index; visual border and label indicate future parent | Predictable before/after/inside preview; never silently change parent | https://help.webflow.com/hc/en-us/articles/33961319255059-Webflow-canvas-overview |
| Webflow **Navigator** | Hierarchical tree; hover syncs canvas highlights; click scrolls to off-screen item; rename on double click; mark CMS, hidden, components, etc. | Bidirectional hover/selection and descriptive tree status | https://help.webflow.com/hc/en-us/articles/33961320786451-Navigator |
| Webflow **Style panel** | Collapsible Layout, Spacing, Size, Position, Typography, Backgrounds, Borders, Effects; reusable classes; Focus mode | Beginner Content/Style first; Advanced sections grouped and expandable | https://help.webflow.com/hc/en-us/articles/33961362040723-Style-panel-overview |
| Webflow **Quick find** | Cmd/Ctrl+E or K searches elements, pages, assets, components; insert directly without opening panels | One `Search or add…` palette; quick switch pages and select layers | https://help.webflow.com/hc/en-us/articles/33961382093587-Quick-find |
| Webflow **Responsive cascading** | Base desktop styles cascade to smaller breakpoints; changes on small breakpoint don't affect larger | Use style override indicators, reset override and continuous-width tests | https://university.webflow.com/videos/intro-to-breakpoints |
| Wix Studio **Responsive sizing** | Scale proportionally, relative width, fixed, stretch and hug; drag resize handles or edit width/height in Inspector | Simple sizing choices with intelligent flex behavior | https://support.wix.com/en/article/studio-editor-setting-the-size-of-your-elements |
| Wix Studio **Stacks/containers** | Stack related siblings vertically/horizontally with predictable gap, preventing unintentional overlap | Auto-layout default, intentional overlap optional/advanced | https://support.wix.com/en/article/studio-editor-stacking-elements |
| Wix Studio **Responsive checker** | Page scan across breakpoints; view issue, proposed fix, dismiss/rescan; can flag overlap, positioning, clipping | Launch-ready checker with fix suggestions and no hidden automatic edits | https://support.wix.com/en/article/studio-editor-scanning-pages-for-responsive-design-issues |
| Framer **Frame vs Stack** | Plain Frame allows free placement; Stack provides row/column flow, gap, padding and auto shifting with changing content | Differentiate flow and overlay content modes | https://www.framer.com/academy/lessons/frames-vs-stacks |
| Framer **Sizing** | Fixed, Relative, Fill (fractional), Fit Content, Viewport; min/max size bounds | Friendly presets: Fixed / Fill / Fit; advanced min/max | https://www.framer.com/academy/lessons/sizing-modes |
| Framer **On-page copy edit** | Editor may change visible text/CMS content in browser without redesigning layout; preview long copy | Double click to edit text; preserve structure | https://www.framer.com/academy/lessons/on-page-editing |
| Squarespace **Fluid Engine** | Drag/resize on grid; snapping/alignment guides; more free placement and overlap; separate desktop/mobile block layout | Optional advanced grid editing, not mandatory MVP | https://support.squarespace.com/hc/en-us/articles/6421525446541-Edit-your-site-with-Fluid-Engine |
| Squarespace **Mobile rearrange** | Move Up/Down arrow controls on mobile; desktop/mobile layouts can differ; text content shared | Phone tap actions should be first class, avoid drag-only reordering | https://support.squarespace.com/hc/en-us/articles/46306741295757-Design-mobile-page-layouts-in-Fluid-Engine |
| Squarespace **Resize** | Block handles and alignment indicators; desktop resize does not necessarily resize mobile Fluid Engine layout | Size and reposition with clear guides, breakpoint aware | https://support.squarespace.com/hc/en-us/articles/206543647-Resizing-blocks |
| Shopify **Canvas** | Early access desktop only; minimal common settings, expand for all; autosaves draft; explicit publish; version history; Undo can be cleared by Sidekick | Simplified inspector plus persistent version restore | https://help.shopify.com/en/manual/online-store/themes/canvas/customizing |
| Elementor **History** | Current Actions tab plus saved Revisions; Undo/Redo hotkeys | Separate session history from saved version history | https://elementor.com/help/revision-history-undo-and-redo/ |

**Terminology:** In CoBest, use **Section** (large page area), **Block** (text/image/button inside it), **Container/Stack** (responsive parent), **Layer** (tree item), **Content**, **Design**, and **Advanced**. Avoid editor jargon (CSS transform, z-index, node tree) on the beginner screen.

## 2. Exact interaction behavior to replicate independently

### T01 — Pick a ready-made theme
1. Merchant opens Website → Edit site → Themes and previews a thumbnail with Home, Store, Product page examples.
2. Picking a theme **does not immediately destroy current work**. Show a comparison and confirmation: Use theme / Cancel.
3. Choosing creates a new reversible draft edit; preserve merchant project/site ID and the site's existing assets, actual product catalog and sales settings.
4. Explain template demo copy/links are placeholders. Never invent real products, reviews, shipping claims or prices.

**Acceptance:** Undo restores exact prior design; after refresh, the selected theme draft is retained; published storefront unchanged until Publish. Always use test merchant/workspace.

### T02 — Add a section between two sections, on canvas
1. Hover edge of Hero -> contextual blue **+ Add section** line after it; focus/tap provides same on mobile.
2. Click +, choose a section from the searchable drawer (hero, banner, product showcase, image/text, FAQ).
3. Preview the new section **at the chosen index**, not always appended at end.
4. Clicking a section card inserts it; dragging same card shows insertion line before/after a target, with scroll auto-advance near viewport edges.
5. Restore focus to new section, scroll it into view, surface Undo.

**Acceptance:** preceding/following section IDs unchanged; a valid new section has unique node IDs; keyboard, mouse and touch insertion all create exactly one undo history entry. If a drop is incompatible, do nothing and show clear explanation.

### T03 — Add a block into an eligible parent
1. Select target section/container. Hover near child or choose + Add block.
2. Limit choices by parent compatibility: Heading, Paragraph, Image, Button, Spacer, Product block, etc.
3. Open Content inspector for new text/button and image picker for new image.
4. Mark invalid targets in visually disabled style; no silent reparenting/phantom history records.

**Acceptance:** reorder or insert never changes parent unexpectedly, no nested cycles, no invalid nav/form children.

### T04 — Click to edit text or image
- **Single-click** selects with named outline; **double-click** heading enters inline text editing when supported. On phone a single tap selects and opens bottom Content sheet, and a second explicit Edit text action opens keyboard if necessary. Avoid hijacking links in Edit mode; Preview mode navigates normally.
- **Text inspector**: label, copy, basic alignment, optional font preset, button URL picker. For very long text use textarea and ensure auto-height.
- **Image inspector**: Select/Upload, Replace, Alt text, Fit (Cover/Contain), crop/focal point. Keep drag-to-resize and optional aspect lock separate from photo replacement.
- **Button**: label and destination; product/page/collection link picker should require actual resources; broken links flagged before publish.
- **Undo** must restore previous text and links; saving and refreshing retains the new copy.

### T05 — Drag/reorder and selection feedback
- During drag: translucent ghost; insertion bar changes with target location; target parent named/highlighted; explicit **before/after/inside** rule.
- Preserve original element if drag aborts or lands on invalid target.
- On Layers: hover highlights canvas; select in canvas auto-scrolls and expands layer ancestors; selecting layer scrolls canvas to it.
- Keyboard alternative: Move Up/Down in layer actions; Enter to choose section; Esc cancels drag or inline edit.
- For nested layout, moving a child out of a Stack requires clear explicit command, not a vague pixel release.

### T06 — Responsive layout defaults
- Default hero body is **Stack vertical** (heading, description, button); images and text use **two-column row** desktop and **one-column stack** phone.
- Width behavior: **Fill** / **Fit content** / **Fixed**. Text minimum font and bounded maximum width.
- Breakpoints: desktop, tablet, small tablet/mobile landscape, mobile portrait. Desktop changes cascade; mobile overrides are visible and can be reset. Switching preview width must not silently change content.
- Test nonpreset widths (e.g. 320, 375, 430, 768, 1024, 1440), long words/translations and keyboard appearance. On phone allow reorder arrows and bottom sheet; drawers must not trap scrolling.

**Acceptance:** zero horizontal overflow; no overlapping purchase buttons, CTA hiding, inaccessible Save; initial defaults remain readable if no mobile override exists.

### T07 — Padding, spacing and size controls
1. Select container → Design → Layout: Row / Column, Gap, Align X/Y, Wrap; Size: Fixed/Fill/Fit and optional min/max.
2. Design → Spacing: adjust one padding side, linked horizontal/vertical groups, or all four. Display effect instantly.
3. Use friendly inputs initially (`Small / Medium / Large`), optionally show numeric px/rem under Advanced. Editor must not present raw X/Y coordinate controls first for normal text.
4. Optional snap-to-grid and alignment guides for advanced grid mode, not main flow.

### T08 — Theme-wide style changes
- Site-wide Color palette: Brand, Background, Text, Muted, Border, Button and Link tokens.
- Site-wide typography: heading/body font, sizes and weights; local override only when selected.
- Changing a theme color updates only elements using that token (preserve explicitly overridden colors).
- Display 'Theme color' vs 'Custom color', allow **Reset to theme default**.
- Avoid duplicating CSS/styles unnecessarily across each element.

### T09 — Copy, duplicate, hide, delete
- Context menu: Duplicate, Copy, Paste (where valid), Hide, Delete.
- Duplicate must create independent IDs and safe geometry/style references, preserve content, and insert next to original.
- **Hide** keeps data in editor tree but removes it from customer view; **Delete** removes and remains Undo-able; destructive operations visible in version history.
- For a global header/footer, clearly state whether changes apply to all pages.

### T10 — Search/Quick Add, keyboard shortcuts
- Small global **Search or add…** button on desktop and phone; input matches section names, blocks, pages and current layers.
- Search results grouped by Sections / Blocks / Pages / Layers, keyboard navigable; clicking current layer selects it, choosing Add inserts based on current target.
- Shortcuts: Undo (Ctrl/Cmd+Z), Redo (Ctrl/Cmd+Shift+Z), Duplicate (Ctrl/Cmd+D), Save (Ctrl/Cmd+S), Escape (close), Delete (with target selected, *not while typing*).
- Never intercept browser clipboard/typing shortcuts when an input, textarea or contenteditable is active.

### T11 — Session history vs saved versions
- **Undo/Redo** for edits during current session. Include reset, reordering, text edits.
- **Version history** persisted as small snapshots with label, timestamp, preview and restore.
- Restoring older design is a new revision with monotonically increasing version number and a pre-restore recovery point. Draft storage and cloud state must never race with older revisions.
- Show Saved/Unsaved/Saving/Error/Not Published in context; **Save draft is never Publish**.
- Publish validates links, resource bindings, mobile overflow, checkout availability and merchant permissions.

### T12 — Product binding, not fake product cards
- Merchant selects Featured Products/Featured Collection -> resource selector listing **only this merchant's catalog**.
- Store a structured `collectionId` / `productId` reference; do not copy mutable price/quantity/SKU into a design node.
- Preview state displays actual product image/price/variant/stock; unavailable resource shows editable warning; only validated data is publishable.
- Two merchant accounts can't select or edit each other's resources; verify asset URLs and backend ownership before use.

### T13 — Auto layout checks before publish
- Evaluate overflow, clipped element, text below readable min, duplicate heading IDs, empty navigation URLs, broken internal links, off-screen buttons, contrast / missing alt text, form labels, empty product bindings, and mobile order controls.
- Results should be actionable: **View issue / Fix suggested / Ignore intentional issue**, not automatically mutate existing designs.
- Scan multiple widths across every template, and run authenticated tenant separation test.

## 3. Suggested tool placement — original CoBest interface

Desktop:
- **Header:** Back to Dashboard · Page dropdown · Desktop/Tablet/Mobile · Undo · Redo · Saved status · Preview · Publish.
- **Left:** Themes · Add · Layers · Pages · Assets. Visible 'Search or add…' on top. Do not overload sidebar with complex unshipped commerce/admin tools.
- **Center canvas:** outlined selected element, context toolbar (Edit Content, Duplicate, Hide, Delete), blue insertion guides, hover + Add section, visible valid drop target.
- **Right:** tab **Content | Design**, with Advanced accordion. Content first for text/image/button; Design controls Typography, Colors, Layout, Spacing, Size; no raw X/Y for normal sections initially.
- **Footer/breadcrumb:** Page › Section › Container › Heading, with click to choose ancestor.

Phone:
- **Top compact bar:** Back, Page, Preview, Publish. Saving indicator visible.
- **Bottom fixed actions:** Add · Layers · Content · Style · Undo · Redo · Save.
- Editing opens a bottom sheet/slide-in; sheets are easy to close and return focus. A text edit does not block Save due to keyboard. Selected section offers **Move Up/Down** with wide touch targets.
- Provide tap-to-add as fallback when touch drag fails.

## 4. CoBest status on research date and concrete gaps

Inspected **draft PR #25** `feat/cobest-mvp-five-milestones` (head `db8e9bcb18ba41270c729bf8f43fdd573b7cd1bb`) on Oct 24, 2026:
- EXISTING IN DEVELOPMENT: visual builder, dnd-kit touch sensor, Layers/Navigator, context Add section in the Layers tree, top-level section Move Up/Down, selection inspector and quick text/link/image editing, Themes including Online Store, breakpoints, Save/Preview, Undo/Redo, Start Over, version history.
- STILL A PROPOSAL / REQUIRES CODE AUDIT: **on-canvas + Add section** overlay (not just Layers), visible target-parent + insertion-line semantics for *all* insertions, bidirectional highlight and auto-scroll hierarchy, robust phone text keyboard testing, searchable global Quick Add, safe fully responsive Stack/Fill/Fit defaults for all presets, responsive checking + fix suggestions, persistent history collision/restore QA, real product/collection data binding across tenant boundaries.
- Most recently reported CI (prior conversation): **132 unit + 28 Playwright browser tests passed**, but npm audit remained red due to high/moderate development dependency advisories (GitHub #36). This research DOES NOT mark release ready, alter production, or verify current CI on new commits.

## 5. MVP priority decision table

**P0 — first merchant must succeed (do before more complex features)**
1. Contextual on-canvas + insert and predictable drop targets.
2. Tap to edit / Replace image / Change CTA in one-step content controls.
3. Responsive Stack defaults + safe width modes and phone Move Up/Down.
4. Draft save, safe Undo/Redo and reliable persisted revisions.
5. Actual product/collection binding + ownership/permissions.
6. Publish validator and separate live snapshot.
7. Functional QA on desktop / actual Android and iPhone.

**P1 — substantial beginner usability upgrades**
1. Search or Add quick command menu.
2. Linked global theme design tokens and local overrides.
3. Bidirectional Layers/Canvas selection, scroll-to-selection, named ancestors.
4. Copy/paste block styles and clear Hide vs Delete.
5. Auto-detect mobile overflow and broken links with reviewable fixes.

**P2 — later**
1. Advanced grid/free-position mode and selectable snap guides.
2. Multi-selection, nudge/resize constraints.
3. AI-generated responsive sections and AI copy.
4. Multi-page zoomed-out canvas, design system library, third-party app blocks.

## 6. Testing protocol (do not claim without running)

- T1 Desktop: choose Online Store theme, insert image/text after hero *on canvas*, type new heading, replace photo, add button link, save draft, refresh, preview published unchanged.
- T2 Drag: reorder before and after existing section, visually verify insertion guide + correct parent, cancel invalid destination, undo/redo.
- T3 Structure: select heading in canvas -> layer highlights/expands; click layer -> canvas scrolls to selected item; duplicate creates independent copy.
- T4 Responsive: two-column desktop -> one-column mobile; 320/375/390/768/1024/1440 px; verify no overflow, clickable buttons, no lost content.
- T5 Phone hardware: Android Chrome and iOS Safari, tap-to-add and long-press DnD, sheets/keyboard, Move up/down, Save/Preview/Exit.
- T6 History: save, reload, restore saved previous version, Undo restoration, check cloud monotonic revision and live site unchanged.
- T7 Commerce: two tenant accounts; catalog binding correct and isolated; change real price then verify preview, invalid product unpublished; checkout disabled until ready.
- T8 Release: typecheck, lint, unit, Playwright, production build, security audit, merchant staging and owner acceptance.

## 7. Study references (official / primary)

Shopify: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/preview-inspector
https://help.shopify.com/en/manual/online-store/themes/theme-structure/sections-and-blocks
https://help.shopify.com/en/manual/online-store/themes/canvas/customizing

Webflow: https://help.webflow.com/hc/en-us/articles/33961270096659-The-Add-panel
https://help.webflow.com/hc/en-us/articles/33961319255059-Webflow-canvas-overview
https://help.webflow.com/hc/en-us/articles/33961320786451-Navigator
https://help.webflow.com/hc/en-us/articles/33961362040723-Style-panel-overview
https://help.webflow.com/hc/en-us/articles/33961382093587-Quick-find
https://university.webflow.com/videos/intro-to-breakpoints

Wix Studio: https://support.wix.com/en/article/studio-editor-setting-the-size-of-your-elements
https://support.wix.com/en/article/studio-editor-stacking-elements
https://support.wix.com/en/article/studio-editor-scanning-pages-for-responsive-design-issues

Framer Academy: https://www.framer.com/academy/lessons/frames-vs-stacks
https://www.framer.com/academy/lessons/sizing-modes
https://www.framer.com/academy/lessons/on-page-editing

Squarespace: https://support.squarespace.com/hc/en-us/articles/6421525446541-Edit-your-site-with-Fluid-Engine
https://support.squarespace.com/hc/en-us/articles/206543647-Resizing-blocks
https://support.squarespace.com/hc/en-us/articles/46306741295757-Design-mobile-page-layouts-in-Fluid-Engine

Elementor: https://elementor.com/help/revision-history-undo-and-redo/

**Copyright and product design note:** Adopt commonplace editor patterns and independently implement accessibility and responsive interactions. Do not transplant competitors' protected themes, codebases, iconography, demo media, logos, proprietary assets, or distinctive design trade dress.
