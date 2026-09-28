# CoBest Visual Builder Roadmap

## Target architecture
- React + TypeScript + Vite for the new visual-builder core.
- Zustand as the builder state/history layer.
- IndexedDB as the first persistence adapter, with storage isolated behind a data layer so it can later be replaced by Supabase.
- Website canvas rendered inside an iframe so editor styles and site styles are isolated.
- Project model: project → pages → JSON node tree, plus reusable class/style maps by breakpoint and interaction state.
- Production deployment remains separate from GitHub development batches.

## Phase 1 — Data model, store, iframe canvas, select/hover
**Status: COMPLETE — CI PASS**

Implemented:
- Typed node/page/project/style data model in `src/builder/types.ts`.
- Starter project represented as a JSON node tree.
- Class-style map with desktop/tablet/mobile breakpoint support in the model/compiler.
- Zustand builder store.
- Undo/redo history infrastructure capped at the latest 20 snapshots.
- IndexedDB project persistence adapter.
- Autosave status model: dirty / saving / saved / error.
- Iframe canvas using `srcDoc`; edited-site CSS is isolated from CoBest editor chrome.
- JSON-tree → semantic HTML renderer.
- Style-map → CSS compiler with responsive media queries.
- Hover communication from iframe to editor.
- Selection communication from iframe to editor.
- Selected/hover outlines and selected element label inside the iframe.
- Navigator tree for Phase 1 selection.
- Desktop 1440 / Tablet 991 / Mobile landscape 767 / Mobile portrait 478 canvas widths.
- New builder wired to the CoBest “Edit website” entry point.
- Zustand dependency locked successfully.
- GitHub CI build/smoke test passed on workflow run 113.

Notes:
- The new visual builder is TypeScript-first. Existing CoBest admin/commerce screens remain in the older React JS shell during the migration.
- The Phase 1 editor chrome currently uses a small isolated stylesheet. Tailwind wiring for the expanded editor UI is scheduled with Phase 2 so Tailwind remains editor-only and never enters the iframe/site output.
- No Railway deployment was performed for Phase 1.

## Phase 2 — Add panel, drag & drop, Navigator
**Status: NEXT**

Planned:
- Add Elements tabs/groups.
- dnd-kit dependency and drag sensors.
- Drag from Add panel to canvas.
- Drop indicators.
- Reorder and nest nodes in canvas and Navigator.
- Full Navigator expand/collapse and parent/child hierarchy.
- Section / Container / Div / Grid / Flex / Columns.
- Headings, paragraphs, links, buttons, media, forms, navigation, advanced elements, and prebuilt sections.
- Tailwind editor UI setup, scoped to editor chrome only.
- Node creation/deletion/duplication actions wired into Zustand history.

## Phase 3 — Classes, Style panel, breakpoints
**Status: PLANNED**

- Reusable classes and combo classes.
- States: none / hover / pressed / focused.
- Breakpoint cascade and inherited/overridden indicators.
- Full visual CSS controls.
- Global color swatches and text styles as CSS variables.

## Phase 4 — Settings, pages, assets, inline text
**Status: PLANNED**

- Element settings and attributes.
- Link controls.
- Per-page SEO.
- Page CRUD/reorder/duplicate.
- Assets manager.
- Inline text editing.
- Keyboard shortcuts.

## Phase 5 — Components, interactions, preview
**Status: PLANNED**

- Reusable components/master-instance updates.
- Shared navbar/footer.
- Interaction timeline.
- Preview mode.
- Version history UI.

## Phase 6 — CMS
**Status: PLANNED**

- Collections and custom fields.
- Collection List binding.
- Collection template pages.

## Phase 7 — Export/import
**Status: PLANNED**

- Clean HTML/CSS/JS compiler.
- ZIP export.
- Asset folder.
- Project JSON import/export.
- No editor-only attributes in exported output.
