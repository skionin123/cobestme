# Applying Shopify editor lessons to CoBest — test checklist

**Development branch:** `feat/cobest-mvp-five-milestones` / draft PR #25  
**Date:** October 22, 2026 (Asia/Manila)  
**Background:** `docs/SHOPIFY_EDITOR_TOOL_BY_TOOL_MANUAL_2026.md` and GitHub #35. The Shopify Theme Editor uses an ordered sections/blocks tree, contextual insertion, property editing, undo/redo, themes and responsive preview. Shopify Canvas has a separate early-access design history. CoBest should copy useful concepts, not claim product parity.

## Implemented in this code pass

| Shopify insight | CoBest change | Where | Test |
|---|---|---|---|
| Add a section at a chosen spot, rather than only at the bottom | **Add section here** between top-level sections; choose a ready-made section | Navigator sidebar, `panels.tsx` | `editor-sections.pw.ts` |
| Phone drag may be difficult | **Move up / Move down** for top-level sections; prevents moving across Navbar/footer | Navigator, `store.ts` | `builder-store.test.ts`, `editor-sections.pw.ts` |
| Edit real heading/button content without code | Dedicated **Content** control on phone, opening the existing field inspector; Style remains separate | Phone toolbar → Content / Style | `editor-sections.pw.ts` |
| Make saved versions recoverable | Expose existing **Version history** in editor header; restoring an older design creates a new increasing revision and a recovery snapshot | Editor header, `store.ts` | `builder-store.test.ts`, `editor-sections.pw.ts` |
| Keep modifications undoable | Section insertion/reorder and version restore use the existing history engine | Editor store | Unit + browser tests |

## Important current limitations

- The **Add section here** control is available from the **Navigator/Layers** tree, not yet as an overlay directly on the page preview. Contextual page-overlay placement remains a proposed enhancement in #35.
- Move Up/Down applies to top-level **section** siblings only; does not reorder arbitrary nested blocks. Invalid moves remain disabled.
- **Version history** stores a rolling history of edit snapshots as part of the project. CoBest still needs real cloud multi-user persistence/collision verification. Do not claim an unlimited revision archive or universal theme duplication.
- Content editing uses the existing panel fields, not a newly implemented direct in-place text editor. Some existing canvas text can already be edited directly.
- Shopify's ability to reference real product and collection records is still a separate CoBest engineering task, not introduced here.
- Merchant-authenticated live tests, iPhone Safari/Android Chrome physical tests, published storefront/draft separation, real inventory/payments remain unverified.
- Draft PR #25 remains **unmerged and not deployed to production**.

## Automated test results — release gate

GitHub CI now runs syntax/type/lint/unit/browser/build/server smoke checks **before** a mandatory `npm audit --audit-level=high` release gate. As of October 22, 2026, npm reports 1 high and 2 moderate advisories in development dependencies (Vite and Vitest/@vitest/mocker). **The audit is not skipped**; an otherwise passing test run still finishes with a red check until fixed. Security follow-up: #36.

The original `npm audit` was placed before tests and prevented all functional checks once the advisory appeared. Reordering the checks makes the editor test outcomes visible without loosening deployment protections.

## Manual test: test one action at a time with the owner

**Do not mark these PASS from browser simulation alone.** Record date, environment, browser/device, exact result, screenshot/video and relevant issue in #26 and `docs/QA_SESSION_LOG.md`.

### Live baseline: current CoBest production

- [ ] M01.1 — Open https://cobest.me in a private desktop window. Confirm page loads and storefront account CTA is readable.
- [ ] M01.2 — Sign in with a dedicated test account; open **Website Editor**. Verify visible controls, no clipped UI, and screenshot the first screen.
- [ ] M01.3 — Try selecting the existing hero heading and editing its text; Save and refresh on a test site only. **This tests current live code, not PR #25 features.**
- [ ] M01.4 — Preview desktop and phone layout. Note all observed errors and missing controls.

### Staging: after an isolated preview deployment of PR #25

- [ ] M02.1 — Open Layers/Navigator → **Add section after Hero → Features grid**; verify inserted immediately below Hero.
- [ ] M02.2 — Tap **Move section Features up**, then Undo, Redo; verify page order at each step.
- [ ] M02.3 — Select a Heading in Layers → **Content** (phone) / Settings (desktop) → change heading text → Save and reload.
- [ ] M02.4 — Open **Version history** → pick older snapshot → Restore; verify old layout and newer revision remain saveable; Undo restore if desired.
- [ ] M02.5 — Use Start Over, cancel once, then confirm; Undo and save. Confirm live published site is unchanged.
- [ ] M02.6 — On a physical phone, tap Add and long-press drag a section; move with ↑/↓; test editing, scroll and keyboard obstruction.
- [ ] M02.7 — Test publish-draft separation and two independently authenticated merchant workspaces against real backend.

**Next interactive step:** M01.1 — user opens https://cobest.me and shares whether it loads, with a redacted screenshot if possible. Only record observed result. The development improvements cannot be tested by clicking production until staged or deployed safely.


## October 24, 2026 — additional work implemented (Shopify section/theme lessons)

**Development branch only, not deployed to production.**

- **Storefront sections:** Added merchant-editable Store Announcement, Image With Text, Shop Introduction, and Shopping Information layouts in the existing Add library. These are design/layout blocks, not simulated products or live integrations.
- **Online Store starting theme:** Added a complete starter page with announcement, shop-introduction anchor, brand story, shopping information, CTA and existing header/footer. The palette is editable. This is **not** a fully integrated product grid or proof that /shop and /contact routes are present; links must be reviewed for the merchant site before publishing.
- **Theme picker discoverability:** The existing theme picker is now accessible through a primary **Themes** sidebar button, and from **Add → Choose a website theme** on phones. Applying a theme still prompts for confirmation and remains reversible through the existing history mechanism.
- **Beginner content inspector:** A selected Heading, paragraph, button/link, rich text, quote or image now offers **Content/Text, Link destination or Replace Image** above the advanced style tools. Selecting these elements directly on the preview opens the edit drawer on phone.
- **Regression checks:** New unit tests in `tests/storefront-builder-sections.test.ts`, updated `tests/builder-templates.test.ts` and `tests/builder-mvp.test.ts`, and browser tests `tests/e2e/editor-storefront-theme.pw.ts`. The editor remains a no-code editing workflow.
- **CI evidence:** [GitHub Actions run #40007244171](https://github.com/skionin123/cobestme/actions/runs/40007244171) — 29 unit test files / 132 unit tests passed, 28 browser tests passed, build/server smoke passed. Final job **fails** the mandatory high-severity `npm audit` gate (3 dependency advisories: 1 high, 2 moderate), tracked as [#36](https://github.com/skionin123/cobestme/issues/36). Do not merge/deploy while the gate is red.
- **Still to build/verify:** binding a featured product/collection section to **real merchant catalog records**, cross-merchant website isolation in staging, review of all template navigation paths, physical Android/iOS touch editing, and real merchant-publishing QA.

### Test together — next human step

Open the **current** production https://cobest.me in a private browser and send a screenshot of the welcome page (M01.1 in this log). Then open the existing website editor on a **test store** and share a screenshot (M01.2). After a safe, separate development preview environment is available, test **Themes → Online Store → choose**, **Add → Store Announcement**, **Layers → Add section here**, **Move Up/Down**, **tap heading → edit text**, **Undo/Redo**, **History restore**, **Save and Preview** one by one. **Do not mark any of these human tests PASS before observing them.**
