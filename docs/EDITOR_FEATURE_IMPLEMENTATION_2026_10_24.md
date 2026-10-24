# CoBest visual editor implementation — October 24, 2026

**Branch:** `feat/cobest-mvp-five-milestones` • **Draft PR:** [#25](https://github.com/skionin123/cobestme/pull/25)  
**Implementation basis:** `docs/EDITOR_TOOL_DEEP_DIVE_COMPETITORS_2026.md`; independent CoBest implementation of common Shopify/Webflow/Framer/Wix/Squarespace patterns, no competitor source/theme/artwork copied.

## Implemented in this pass

1. **On-canvas insertion** — selecting a full-width top-level Section shows **Add section before/after** in the in-canvas toolbar. Click opens a searchable dialog, inserts the selected ready-made section directly beside its predecessor/successor and records Undo. The insert request is checked against current page's top-level section IDs, so a stale or malformed request cannot insert arbitrarily into nested content.
2. **Quick Add / Search** — visible Search/Add toolbar action + Ctrl/Cmd+K (when not typing), with searchable sections, MVP blocks, current pages and selected-page layers. Picking a section inserts after the selected top-level Section or before Footer; choosing a compatible block inserts inside selected container/nearest compatible ancestor; choosing page switches, layer selects. Prevent invalid parent insertion with `canAcceptChild`.
3. **Bidirectional Layers/Canvas visibility** — hovering Layers highlights the corresponding node on canvas; selecting a Layer scrolls to it where needed; selected row scrolls inside the Navigator.
4. **Mobile overflow preview check** — **Check mobile** selects the 478px portrait preview, measures node bounding boxes and scroll widths in the live sandboxed canvas, lists suspicious horizontal overspill/clipping, and lets merchant Inspect affected nodes. This is a **single-width heuristic**, not comprehensive responsive or real-device validation.
5. **Responsive design presets** — non-root Containers/Div/Grid/Flex/Columns can be switched with one click to Vertical Stack, Desktop Row → Phone Stack, or Desktop 2 Columns → Phone 1 Column. These update responsive layout CSS within a single Undo-able project transaction. Existing Fit/Fill/Fixed size controls and image crop/alt controls remain.
6. **Hide/Show Layers** — eye toggle preserves node data in editor and removes it from public compiled preview until unhidden, with Undo.
7. **Header usability on laptops** — Search/Add action collapses to icon; at smaller desktop widths less-critical labels collapse and Publish/Save remain reachable.

## Already implemented before this pass

- Three themes including Online Store; starter commerce sections; content-first text/link/image editor; pointer/touch DnD; preview; phone toolbar; section Move Up/Down; duplicate/drag; manual and autosave; Undo/Redo; reversible reset; snapshot history and revision-safe restore; image focal point and responsive controls.

## Verified automated results

[GitHub Actions Run #40077685253](https://github.com/skionin123/cobestme/actions/runs/40077685253) on branch head `e38d5d67afdbe87a4d5e7c53337abee3e40ac90d`:
- `npm run typecheck` PASS.
- `npm run lint` PASS.
- `npm test` PASS: **132 tests, 29 files**.
- `npm run test:e2e` PASS: **31 Chromium browser tests**, including new on-canvas +, Quick Add and overflow review tests.
- `npm run build` PASS.
- Server health and SPA fallback smoke PASS.
- Mandatory `npm audit --audit-level=high` **FAILED**: three advisories (one high, two moderate) in project development dependencies. See [#36](https://github.com/skionin123/cobestme/issues/36).

GitHub CI is **red** despite functional checks passing. The security gate is never bypassed or claimed resolved. An intermittent full-workspace publish browser test and desktop corner-resize test failed in earlier separate runs, but **both passed** on final complete functional run #40077685253. Keep monitoring.

## What 'implement all' does NOT yet mean

Important items still need design and testing, so don't claim full feature parity with Shopify/Webflow/Wix:

- **P0:** Real product and collection resource selection using authenticated merchant catalog, correct live price/variant/stock data, strictly isolated two-merchant permissions, no placeholder buy buttons linking to nonexistent store routes.
- **P0:** Independent tenant QA, verified draft/live publication and checkout, shipment, payments and refunds; platform-security release gates.
- **P0:** Real Android Chrome and iPhone Safari tests, physical long-press, keyboard obstruction, tiny phones (320px), accessibility/contrast and pointer behavior.
- **P1:** Site-wide brand-token UI with full local override/reset indicator, more precise validity hints during all drag operations, full responsive checker across 320–1440px rather than only portrait preview, saved-version **preview before restore**, cloud multi-user revision collision/merge tests.
- **P2:** Advanced grid/free-position mode, multi-select, style-copy, production-ready AI section generation and Canvas-like all-pages overview.
- Payment/supplier apps and ecommerce connectors were explicitly allowed to remain unconnected by owner; don't represent them as already available.

## Manual acceptance test sequence (not yet performed with merchant)

1. Choose Online Store from Themes → Save draft; ensure existing live site unchanged.
2. Select Hero on page canvas → **Add section after Hero** → choose Image with text; confirm section order in Layers.
3. Try **Search or Add** → choose Store announcement, find a heading by search, edit its copy and link.
4. Hover/select same item in Layers vs canvas, Hide, Undo, Show, duplicate.
5. Select Image/Text Columns → **2 columns → 1 on phone**, switch portrait preview, check all text/buttons.
6. **Check mobile**, Inspect a flagged item if present; test with actual phone hardware and at 320px.
7. Save → reload → restore earlier version → Undo restore; make sure no publishing occurs during drafts.
8. Run audited multi-tenant storefront and checkout tests before release.

**Production status:** The PR remains DRAFT/unmerged; no Railway production deployment performed by this work.
