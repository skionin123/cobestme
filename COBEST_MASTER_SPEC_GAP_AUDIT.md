# CoBest Master Specification — Existing-System Audit and MVP Roadmap

Updated: 2026-10-11
Source of requirements: user-provided "MASTER DEVELOPMENT PROMPT: COBEST ALL-IN-ONE WEBSITE BUILDER" (30 sections, Phase 0–5)
Repository: `skionin123/cobestme`; hosting: Railway `cobestme` service
Policy: **preserve existing website editor, commerce functions, customer data and published sites**.

## 1. What is actually present (source-code inventory)

The inventory below means a feature is **implemented in code**; it does **not** certify an account-based production flow. Treat missing integrations and actual real-account testing separately.

| Area | Evidence in repo | Assessment |
| --- | --- | --- |
| Website creation, account/workspace | `src/App.jsx`, `server.mjs`, Supabase workspace/auth paths | Implemented in code; production account lifecycle and cross-tenant access still require live regression |
| Independent websites / active-site context | App site switcher and workspace APIs | Present; cloud sync and site isolation require real 2-site / 2-user test |
| Templates | `src/builder/templates.ts`: Simple (Essential) and Professional (Editorial) | **Two editable starter templates**, not the envisioned marketplace |
| Website editor | `src/builder/VisualBuilder.tsx`, `canvas.ts`, `store.ts`, `tree.ts` | Structured JSON page tree, drag before/inside/after, per-node geometry, text editing, styling, Navigator |
| Responsive editor | Desktop 1440, tablet 991, mobile landscape 767, mobile portrait 478; responsive style compiler | Implemented; real device and preview/live matching still require checks |
| Pages and navigation | Pages panel, SEO properties, public page compiler | Page creation/editing/navigation present; password protection, trash/restore, some advanced routes not verified |
| Saving / Undo / Export | IndexedDB `persistence.ts`, save queue, revisions, ZIP export, undo/redo | Automated tests cover editor; live Supabase sync and cross-device persistence need verification |
| Preview / publishing | App cloud save and publish actions, `server.mjs`, `publicDocument.ts`, `PublicStore.jsx` | Draft/publish code present; 2-account production publishing and custom domains not end-to-end verified |
| Product catalog | `src/AdminAdvanced.jsx`, commerce APIs | Products, variants, inventory, collections and discounts present in code |
| Category hierarchy | `src/AdminAdvanced.jsx`, catalog hierarchy tests | Primary/subcategory controls via category paths; multi-parent relational taxonomy **not** confirmed |
| Orders, customers, analytics | Store manager, commerce endpoints, sales-report tests | Core workflows present; reports are based on recorded paid orders, not proof of live transactions |
| Checkout / payments | Stripe/PayPal integration foundations in server code | **Not production-ready until provider credentials, secure webhook configuration and sandbox checkout are verified** |
| Contacts, content, marketing | `App.jsx` and commerce routes for blog, forms, marketing | Portions exist; dynamic CMS and automation suite are later phases, not confirmed functional |
| Team/admin/billing | Permissions and billing foundation in source | Some code exists; full isolation, entitlement enforcement and live subscriptions unverified |

### Deployment baseline

- GitHub `main` after PR #18: `494193bb91e052f084050152c5c88411dde42eea`.
- Railway production on 2026-10-11: deployment successful and 1/1 instance online.
- Existing tests run as CI (TypeScript, lint, Vitest, Playwright, build, server smoke). Browser editor tests mostly use a **local harness**, not authenticated live Supabase accounts.

## 2. Phase 1 editor gap analysis (required first)

| Requirement from master spec | Current status and release priority |
| --- | --- |
| Two templates, core elements, pages, Layers, layout editing | **Present**; maintain and polish instead of rebuilding |
| Real selectable and draggable elements | **Present** through structured insertion and visual translation. Full freeform positioning, snapping and multi-select remain **future improvements** |
| Edge/corner resizing | **Present in code**, extensively revised in PRs #13–#18; continue testing small elements, nested layout, hover hit targets at Fit zoom, content overflow and actual devices |
| Safe copy/paste/duplicate, delete, shortcuts inside iframe | **Phase 1 high priority**: this milestone extends shortcut forwarding and prevents copies sharing per-element geometry styles |
| Undo/redo, autosave, reliable refresh | **Present**; tests must cover post-shortcut persistence and cloud sync after real logins |
| Preview/publish fidelity | **Partially validated** by isolated tests; test the public output for each breakpoint and draft/live separation |
| Accessible editing | Keyboard and labels present in places; WCAG 2.2 AA audit, keyboard navigation for all controls and touch gesture validation still missing |
| Undoable version restore | Revision snapshots exist; complete tested revision-restore UX still needs a dedicated milestone |
| Actual multi-site isolation | Source includes active-site context and auth checks; verify with two independent accounts before production certification |
| Focused UI / visible back to dashboard | Present; retain simple inspector, Fit/100% controls, unambiguous selection and back navigation |

**Definition of done:** a new real user can create a site from Simple/Professional, add/edit/move/resize, save, refresh, preview, publish and revisit their public site on desktop and mobile. A second account must see none of the first account's data. All failures must be reported accurately.

## 3. Phase 2 — Business MVP (retain, harden; do not silently remove)

- Preserve: Products, **primary categories and subcategories**, variants, inventory, orders, customers, discounts, collections, sales reports and CSV export.
- Validate category hierarchy semantics, product-to-category assignments, inventory status, order access controls, and calculations using real sample orders.
- Before selling: activate payment integration with credentials, validate signatures/webhooks, simulate checkout **in provider sandbox**, test stock consistency and successful/failed/duplicate events. No claim that payment flows are live until verified.
- Keep merchant management independently navigable from the editor.

## 4. Phases 3–5 (planned; not MVP completion criteria)

**Phase 3:** richer layouts, component variants, reusable sections, advanced global design tokens, interactions, version restore and smart alignment/snapping.

**Phase 4:** dynamic CMS/data bindings, SEO diagnostics, forms/leads expansion, real privacy-aware website traffic analytics, marketing integrations and event automations.

**Phase 5:** advanced multi-user roles, subscription billing, AI website assistant, expanded template marketplace, agency operations, secure third-party integration credentials and full platform-admin observability.

Do not imply that a visible tab, integration button or service adapter equals a usable connected feature.

## 5. Architecture and data safety

- Frontend: React/Vite with TypeScript editor, Zustand for editor state; Tailwind/CSS for chrome.
- Editor document: typed project with pages, stable node identifiers, classes, responsive rules, assets, component and interaction definitions.
- Persistence: IndexedDB local backup and queued optional Supabase workspace save; revision history exists in builder project.
- Backend: Node `server.mjs`, Supabase database/auth APIs; hosted with Railway.
- Publishing: a separate saved public snapshot, rendered through shared website compiler/public-store views.
- This milestone changes **no database tables, no migrations, no external provider variables**; preserves existing project structure and published data.
- For later schema work, use explicit ownership/tenant keys, server-side role checks and safe migrations/backfills before changing production.

## 6. Release gates

1. Branch from deployed `main`, keep changes small and reviewable.
2. Validate typecheck, ESLint, unit, browser/e2e, build and server smoke.
3. Test actual editor interactions and reload, including focused iframe shortcuts and independent cloned styles.
4. Merge only on green tests; let Railway deploy the merged commit.
5. Confirm Railway deployed the **same merge SHA**, reports healthy service, and logs show successful server start.
6. Mark **deployment** separately from **verified user-account production behavior**.

## 7. Milestone register

| Milestone | Scope | Status |
| --- | --- | --- |
| 0 — Audit | Code and deployment inventory against master prompt | This report |
| 1A — Core visual editor | Two templates, pages, responsive canvas, border/corner editing, save, preview and publishing foundations | Implemented; further live QA required |
| 1B — Shortcuts and safe duplication | Canvas keyboard commands, paste/duplicate without geometry collisions, regression tests | Implementation in current PR; release pending until verified |
| 1C — Real-user golden path | Two users, two websites, edit/save/reload, publish/draft, mobile, public route | **Next high priority** |
| 2A — Merchant correctness | Product categories, stock, paid-order reports and customer scoping | Present in code; broaden real-account tests |
| 2B — Verified checkout | Provider sandbox, webhooks, taxes/shipping, order/inventory integrity | **Not verified / not enabled** |

### Recommended next development action
After this PR is green and deployed, test the complete authenticated Create Website → Edit → Save → Preview → Publish → Public Website flow with a real test account, then isolation with a second account. Fix any defects before adding new panels.

**This document is a roadmap and status audit, not a claim that the full master specification has been implemented.**
