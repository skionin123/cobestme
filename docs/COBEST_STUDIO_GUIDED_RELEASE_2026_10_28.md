# CoBest Studio — beginner-first editor implementation and release plan

**Date:** 2026-10-28 (Asia/Manila)
**Branch:** `feat/cobest-editor-guided-workflow-2026`
**Consolidated PR:** [#41](https://github.com/skionin123/cobestme/pull/41) — DRAFT, not production
**Older overlapping work:** [#25](https://github.com/skionin123/cobestme/pull/25)
**Live marketing homepage:** on `main`, separate from editor PR.

## Product objective

Help a first-time merchant build and publish a recognizable, appealing online storefront with few decisions and clear, undoable actions. Use the best interaction *principles* from published official documentation for Shopify (sections), Webflow (navigator and contextual insertion), Framer (responsive stacks), Wix Studio (mobile issue checks), Squarespace (phone rearrange) and Elementor (undo vs saved history). Reuse no proprietary code or templates.

## Implemented on development branch

| Need | Editor feature | Evidence / files |
|---|---|---|
| Start without a blank canvas | Three differentiated starter themes, including Online Store, four-step visual website journey | `src/WebsiteStart.jsx`, `src/website-start.css` |
| Beginner-friendly tool discovery | Six-step guide, helpful first-run banner, real actions for theme, add, content, phone, save and preview | `src/builder/BuilderGuide.tsx`, `src/builder/VisualBuilder.tsx` |
| Add a professional section quickly | On-canvas Add Section, searchable contextual chooser and Ctrl/Cmd+K Quick Add | `src/builder/SectionChooser.tsx`, `src/builder/QuickAdd.tsx` |
| Make changes with less jargon | Content inspector now default; tapping editable text/images opens Content instead of Design | `src/builder/VisualBuilder.tsx` |
| Make sections colorful in one step | Four original palette treatments (Vibrant, Ocean, Peach, Midnight), single undo-able mutation, Reset to theme style | `src/builder/DesignControls.tsx`, `src/builder/editor-journey.css` |
| Professional editing | Linked Layers/canvas selection, responsive layout presets, position/spacing, styles, duplicate/hide, version history | `src/builder/*` |
| Mobile-first adjustments | Phone actions for content/design/undo/save; 478px overflow heuristic; responsive row-to-stack and 2-to-1 columns | VisualBuilder, DesignControls, canvas |
| Reduce accidental loss | Theme switch uses reversible draft/history, keeps site identity and assets; drafts distinct from public publish | `src/builder/themeSwitch.ts`, `src/App.jsx` |

## Specific improvements in this pass

1. Fixed a real content-first discrepancy: tapping text/image in the canvas was opening the **Design** inspector despite beginner-first UX copy. It now opens **Content**; Design is still one click away.
2. Made **Content** the editor's starting tab for brand-new users.
3. Added vivid, accessible four-choice section color presets and an explicit reset to theme style; presets apply to **selected node only** and are undoable. Do not mistake this for fully implemented global design tokens.
4. Added E2E tests for selected inspector, palette, Undo, reset, and mobile tap. Updated existing design tests to explicitly open the Design tab.
5. Consolidated changes on #41 rather than deploying an incomplete editor over the public homepage.

## Release validation status and blockers

- **Previously passing:** the base guided-workflow branch had successful CI run [#40178962943](https://github.com/skionin123/cobestme/actions/runs/40178962943) at earlier SHA `23a96e69`. **This does not validate the new commits**.
- **Current HEAD:** verify PR #41's latest source/CI separately; no successful CI run of current HEAD confirmed when this document was written. A push-trigger CI rule was added in the branch but not yet observed running.
- **Merge conflict:** PR #41 currently reports `mergeable=false` against `main`; reconcile only the relevant editor and app integrations with the independently redesigned `main` marketing homepage. Do not replace all of `main` with a stale `App.jsx`.
- **Security/product gates:** merchant/tenant isolation, real product/collection bindings, accurate variant purchase, concurrency-safe inventory, merchant-specific payment and webhook reconciliation, supplier import/fulfillment, and 2-account staging remain incomplete or unverified (tracked #27–#35).
- **Device QA:** phone Playwright emulation does not replace Android Chrome, iOS Safari or keyboard-inset device testing.
- **Publishing:** preview the storefront and preserve separate saved draft vs live snapshot; test with synthetic products and sandbox payments, not real buyers.
- **Current Railway production:** was verified on old SHA `af8e9e4` on 2026-10-25. Do not assume a later deployment without a new Railway check.
- **No production publish:** this editor remains a draft PR.

## Next integration plan — one coordinated release

1. Reconcile #41's branch with `main` without overwriting the colorful marketing homepage. Preserve the existing store's site identity, product data and publish logic.
2. Run `npm ci`, `npm audit --audit-level=high`, typecheck, lint, all unit tests, all Chromium e2e, `npm run build`, and health/SPA smoke on the merged candidate. Require a green exact-SHA run.
3. Test T01–T15 from [QA #26](https://github.com/skionin123/cobestme/issues/26) against isolated staging and real merchant accounts; test on phones and multiple viewport widths.
4. Fix confirmed test failures inside a single workstream, tracking in [QA master #38](https://github.com/skionin123/cobestme/issues/38).
5. Only after the safety and merchant journey checks pass, request owner release approval; then deploy verified SHA to Railway, check the **actual** custom domain and log a rollback build.

## Beginner's target journey

**1 Choose theme → 2 Edit words and images → 3 Add/reorder sections → 4 Preview desktop/phone → 5 Save draft → 6 Review/Publish.**

Never require knowledge of CSS, breakpoints or component internals for the first successful edit. Advanced Design controls remain available for power users.

**Not implemented yet:** full commerce parity, AI site generation, real device review, dynamic live catalog section bindings and global theme-token override semantics. None should be described as shipped.
