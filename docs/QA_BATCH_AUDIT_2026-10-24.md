# CoBest consolidated QA audit and one-batch fix plan

**Date:** 2026-10-24 (Asia/Manila)
**Repository:** `skionin123/cobestme`
**Revision tested:** `9a768744510fb39eb162e4e34007e1d8d3cd6a2f` on `feat/cobest-mvp-five-milestones`
**Pull request:** https://github.com/skionin123/cobestme/pull/25 — DRAFT, **UNMERGED**
**Full suite:** https://github.com/skionin123/cobestme/actions/runs/40077925018 — test suite re-run on the same SHA, overall failure caused by required dependency audit.
**QA master:** #26. **Editor feature tracker:** #35.

## Executive release decision

**NOT READY FOR PRODUCTION.** The complete available GitHub automated suite passed its functional checks, but the security gate failed. Several critical merchant/server/physical device workflows require isolated staging and real test accounts. Do not call automated fixtures a live payment, real merchant-authentication, or hardware test. Do not merge/release solely because unit/Playwright checks passed.

## 1. Actually executed: latest full GitHub Actions rerun

| Run step | Result | What is genuinely established |
|---|---|---|
| `npm ci` | PASS | Lockfile dependencies installed in the GitHub runner |
| `node --check server.mjs` / payment safety server file | PASS | Syntax parses, not provider integration |
| `npm run typecheck` | PASS | TypeScript types check |
| `npm run lint` | PASS | Configured builder/tests lint scope |
| `npm test` | **PASS — 132/132, 29 files** | Isolated unit/server-mock logic |
| `npm run test:e2e` | **PASS — 31/31 Chromium tests** | Visual UI behavior, desktop, emulated phone, app mock workflows |
| `npm run build` | PASS | Vite build succeeds |
| HTTP `/api/health` & SPA fallback | PASS | Server started in GitHub runner and answered smoke requests |
| `npm audit --audit-level=high` | **FAIL — 3 vulnerabilities, 1 high + 2 moderate** | Release security gate blocked, tracked #36 |

**Nuance:** Browser tests use a Chromium runner and Playwright mobile viewport/touch emulation, not a physical Android/iPhone. `tests/e2e/workspace-integration.pw.ts` explicitly mocks API routes, so it doesn't prove Supabase RLS, real merchant payment identity, or production persistence.

## 2. Automated coverage inventory by area

Statuses refer **only to CI coverage**, not staging/live validation.

| Test area | Relevant verified automated coverage | Status | Required next real test |
|---|---|---|---|
| Editor basic tools | section insertion, layers, selected inspector, drag, undo/redo, theme choice, save | **Automated PASS** | Merchant desktop session on branch preview |
| Editor advanced tools | canvas + section, quick add, resize, snapping, context menu, history, responsive controls | **Automated PASS** | Different widths, actual touch devices, contrast/keyboard |
| Mobile editing | viewport + touch emulation, bottom toolbar, section moves, phone Content editor | **Emulated PASS** | iOS Safari & Android Chrome physical tests (#33/#35) |
| Website draft/publish | browser mocked workspace save, publish snapshot, rerender/refresh, site switch | **Mocked PASS** | Real backend and two isolated merchant accounts (#27) |
| Preview / SEO / launch review | local test warnings and blockers, content checker | **Unit PASS** | Real links, policy pages, access and domain in staging |
| Categories / products | category hierarchy, products and visibility test paths | **Automated PASS** | Real catalog persistence and public storefront |
| Product variants | Guard/visibility logic | **Automated LIMITED** | Accurate option, price, stock, cart & order (#29) |
| Supplier feeds / CSV | import preview logic, supplier/workflow mocks | **Automated LIMITED** | Real SKU update atomicity, schema and supplier staging (#28,#31,#32) |
| Inventory & orders | isolated checkout/payment safety logic | **Automated LIMITED** | Concurrent last-stock tests, cancellation, refunds (#28) |
| Payments | safety/permission logic under fixtures | **Automated LIMITED** | Merchant-owned provider sandbox, signed webhooks and reconciliation (#30) |
| Auth and tenant isolation | server authorization mocks/unit, app mocked two-site context | **Automated LIMITED** | Real two-account RLS, permission and cross-site isolation tests (#27) |
| Operational server | GitHub runner syntax, build, health, SPA fallback | **Automated PASS** | Railway production-like isolated staging, public URL, logs |
| Dependency safety | npm audit gate | **CONFIRMED FAIL** | Patch dependencies, verify lockfile, rerun all tests (#36) |

## 3. Human/manual acceptance — preserve the original T01–T15 checklist

Nothing in this table is marked PASS without a human test. Full procedural notes remain in #26 and `docs/QA_RUNBOOK.md`.

| Test ID | Manual scenario | Status as of this audit | Blocker / note |
|---|---|---|---|
| T01 | Load deployed CoBest, sign up/in/out, refresh and recover | **NOT RUN** | Cannot access the user session; no live screenshots yet |
| T02 | Fresh site onboarding, refresh persistent settings | **NOT RUN** | Test account/environment needed |
| T03 | Multiple sites, no cross-site product/order leakage | **NOT RUN** | Staging, two test sites |
| T04 | Theme, heading, links, image, undo/redo, Save | **NOT RUN** | Must use correct branch preview; current live build may be older |
| T05 | Pages, header/footer, menu, scrolling, mobile/desktop preview | **NOT RUN** | Branch preview |
| T06 | Save draft, publish, public URL, new draft, republish | **NOT RUN** | Real workspace backend and safe test site |
| T07 | Categories/subcategories, Draft/Active products | **NOT RUN** | Test merchant + SKU fixtures |
| T08 | Media, variants, SKUs and invalid inputs | **NOT RUN** | Variant checkout intentionally guarded |
| T09 | Supplier assignment, CSV preview/update, stock validation | **NOT RUN** | Synthetic test CSV only; transactional sync missing |
| T10 | Guest cart and checkout without live money | **NOT RUN** | Staging with fake test purchase |
| T11 | Orders, customers, manual fulfillment/tracking | **NOT RUN** | Test data, no real fulfillment |
| T12 | Reports, dashboards, SEO, policies and launch checklist | **NOT RUN** | Backend and mock sales fixtures |
| T13 | Mobile hardware, keyboard, viewport 320–1440, error states | **NOT RUN** | Actual phones & human verification |
| T14 | Two independent merchant accounts tenant/ownership isolation | **BLOCKED** | #27: isolated staging and real auth/RLS |
| T15 | Stripe/PayPal sandbox settlement, refunds, webhook replay | **BLOCKED** | #30: provider sandbox architecture/accounts absent |

**Live Railway status this turn:** Tried connected Railway `environment_status` once, but it required authorization that was not granted. Per tool's instruction, don't repeat that call path. No assertion that a new Railway staging environment is configured, or that the draft editor is live. Public `https://cobest.me` was not accessible through the public web fetch on this turn, so this is **not** a live site smoke test.

## 4. Confirmed failing checks vs intermittent CI vs known gaps

**Confirmed actionable blocker**
- **SEC-01 / P0** — npm audit high-severity vulnerability; 3 advisories. Repro: GitHub run #40077925018, stage `Dependency security gate (must pass to release)`. Existing ticket #36. Fix Vite/Vitest dependencies, regenerate lockfile using npm, review downstream affected versions, rerun all checks; don't bypass audit.

**Observed intermittent automated test failures (not proven merchant bugs)**
- **QA-02 / P1** — full app Playwright `workspace-integration.pw.ts` timed out attempting `Publish` click around line 60 in earlier runs; later full-suite run PASS. Investigation ticket #37. Need 20 isolated repeats, tracing and viewport/overlay measurement.
- **QA-03 / P2** — intermittent desktop corner/border resize Playwright timing/geometry failure, ticket #34. Later passing full suite does not prove flake resolved.

**Known unresolved engineering or validation gaps (do NOT file as new verified runtime failures)**
- **REL-01 / P0** — safe preview/staging and two real merchant account isolation: #27.
- **INV-01 / P0** — atomic SKU imports / inventory and parallel order safety: #28.
- **PAY-01 / P0** — secure merchant-owned payment account & settlement verification: #30.
- **VAR-01 / P1; escalates to P0 for variant-selling launch** — option-specific public checkout/stock: #29.
- **SUP-01 / P1** — supplier profile, fulfillment and provenance: #31; safe feed schema, cost/shipping/margin and variant updates: #32.
- **EDITOR-01 / P1** — real mobile hardware, contextual editing, durable version safety, true catalog binding: #33, #35.
- **ADV-01 / P2** — complete responsive multi-width scanner (current Check mobile measures one 478px portrait preview), advanced grid/AI not release prerequisites.

## 5. One-batch fix order: tackle related issues together

### Batch A: Required security/release foundation — NO DEPLOY until passed
- [ ] Resolve #36, regenerate package-lock.json, no security bypass.
- [ ] Provision isolated Railway staging from the draft branch with separate seeded test merchant accounts, **no production data copied** (#27).
- [ ] Validate permission boundaries between two users/sites (auth, assets, orders, products, uploads, published snapshots). Fix any actual confirmed cross-tenant issue immediately.
- [ ] Fix #28 server-side atomic SKU/stock/order mutation before merchants can transact at scale.
- [ ] For production payments, resolve #30 provider/merchant identity and webhook reconciliation with sandbox evidence, otherwise keep checkout payment gate disabled.

### Batch B: Editor quality and merchant usability
- [ ] Reproduce/fix intermittent Publish toolbar and corner resize CI failures (#37/#34).
- [ ] Test all 11 main editor actions in one scenario: theme -> add -> reorder -> text -> image -> link -> hide/show -> responsive -> undo/redo -> save/restore -> publish.
- [ ] Check 320, 375, 390, 430, 478, 768, 1024, 1440 widths and actual phones; record screenshots with sensitive details hidden.
- [ ] Check accessible keyboard controls, undo/redo after edits, draft remains unpublished, saved version restore after reload.
- [ ] Implement/verify real merchant catalog binding for any featured product/collection block (#35).

### Batch C: Product and supplier readiness (after foundation)
- [ ] Complete variant SKU stock/price persistence + checkout (#29) **only if variant-selling is in launch scope**.
- [ ] Finish supplier profiles and safe feed update/sync (#31/#32) when integrations and appropriate test data are available.
- [ ] Verify tracking, returns, refunds and reports with synthetic data; no real customer transactions.
- [ ] Keep AI-assisted design, multi-canvas and free-position grid as P2 backlog until basic builder is stable.

### Batch D: All-up retest and release decision
- [ ] Execute full CI on the combined fix commit; security audit must pass.
- [ ] Run complete T01–T15 manual QA on a safe staging build; mark each PASS/FAIL/BLOCKED with evidence.
- [ ] Retest earlier failed flows with regression cases and separate tenant accounts.
- [ ] Approve release only after zero open P0 security/data bugs and explicit owner acceptance.
- [ ] Deploy production with verified commit, monitor Railway logs, and document rollback version.

## 6. Evidence and issue conventions

Every new runtime failure needs: test ID, environment URL/branch/commit, account alias only, browser/device, action sequence, expected vs actual, screenshot/trace **without personal data**, severity, issue owner, fix commit, retest evidence.

Use issue #26 for manual PASS/FAIL and this document/one-batch master for prioritization. Do not silently check off incomplete manual items.

**Conclusion:** Automated functionality is substantially covered and passing; release status remains **BLOCKED**, chiefly by npm dependency security and real backend/staging tests. A one-batch remediation is feasible as a coordinated PR, but external merchant payment integration and physical-device testing cannot be declared complete without the needed environment/evidence.
