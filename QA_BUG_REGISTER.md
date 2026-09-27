# CoBest QA Bug Register

Updated: 2026-09-28

This file is the working bug/error log for one-by-one production testing on https://cobest.me.

## Test rule

Test only one feature or workflow at a time.

For every test:
1. Record the exact feature and expected result.
2. Reproduce on the live production site.
3. Mark PASS / FAIL / PARTIAL.
4. If it fails, record the exact symptom, screenshot/error text, device/browser, and reproduction steps.
5. Fix only the confirmed issue.
6. Deploy.
7. Retest the same test before moving to the next one.
8. Record the fixing commit and Railway deployment.

## Severity

- P0 — blocks login, site loading, publishing, orders, or major workflows.
- P1 — core function broken; workaround may exist.
- P2 — function works incorrectly or incompletely.
- P3 — visual/usability/polish problem.

## Current production baseline

- Production: https://cobest.me
- Railway deployment: 76a9489b-87d1-4046-95bb-677d27f22fd1
- Commit: 01a52a9e3a707e57d53d338ef7f1a2ac3a7e9112
- Deployment status: SUCCESS

## Bugs discovered before formal one-by-one QA

| Bug ID | Severity | Area | Symptom | Root cause / action | Status | Fix |
|---|---|---|---|---|---|---|
| BUG-001 | P0 | Editor/UI | UI crashed with `Can't find variable: safeEditor` | Child components referenced an out-of-scope variable | FIXED | af294e2 |
| BUG-002 | P0 | Buttons/UI | Editing, preview and multiple controls appeared frozen | Runtime crash + placeholder/no-op controls | PARTIAL/FIXED CORE | 1c8d141 and later workflow releases |
| BUG-003 | P0 | Authentication | Existing user received `Invalid login credentials` | Login reaches Supabase; credentials/account password need recovery when incorrect | OPEN FOR RETEST | Improved recovery UX in 448317e / 86e8624 |
| BUG-004 | P0 | Password recovery | Reset link opened `localhost:3000` and failed with `otp_expired` | Recovery callback/URL configuration used localhost fallback | CODE FIXED; CONFIG + RETEST NEEDED | 01a52a9 |
| BUG-005 | P1 | UX/process | No clear end-to-end setup sequence | Store configuration was spread across screens without guided order | FIXED | Setup & Workflow center + operating process |
| BUG-006 | P1 | Store setup | Theme/navigation workflow unclear | No dedicated theme library/navigation manager | FIXED | Theme Library + Navigation Manager |

## Formal QA queue

We will not skip ahead after a failure.

| Test ID | Area | Test | Status |
|---|---|---|---|
| QA-001 | Authentication | Existing user login | NEXT |
| QA-002 | Authentication | Forgot password request | PENDING |
| QA-003 | Authentication | Password reset email callback | PENDING |
| QA-004 | Authentication | Set new password | PENDING |
| QA-005 | Authentication | Log out then log back in | PENDING |
| QA-006 | Onboarding | Start free → create account → onboarding | PENDING |
| QA-007 | Onboarding | Complete onboarding and generate brief | PENDING |
| QA-008 | Persistence | Refresh browser and verify saved workspace | PENDING |
| QA-009 | Workflow | Setup & Workflow progress/next step | PENDING |
| QA-010 | Themes | Select a theme and retain selection | PENDING |
| QA-011 | Pages | Add/edit/reorder/hide a page | PENDING |
| QA-012 | Navigation | Main/footer menu add/remove/reorder | PENDING |
| QA-013 | Editor | Edit Home content and save | PENDING |
| QA-014 | Editor | Desktop/tablet/mobile preview | PENDING |
| QA-015 | Editor | Blocks/grid/reorder/undo-redo | PENDING |
| QA-016 | Products | Create product | PENDING |
| QA-017 | Products | Edit/delete/search/filter product | PENDING |
| QA-018 | Taxonomy | Categories/brands/collections | PENDING |
| QA-019 | Media | Upload/select/use media | PENDING |
| QA-020 | Blog | Create/edit/publish blog post | PENDING |
| QA-021 | Storefront | Preview active products/pages/navigation | PENDING |
| QA-022 | Cart | Add/change/remove cart items | PENDING |
| QA-023 | Checkout | Internal/test checkout to order creation | PENDING |
| QA-024 | Orders | View/update fulfillment/tracking | PENDING |
| QA-025 | Customers | Create/edit/view history | PENDING |
| QA-026 | Discounts | Create/apply internal discount logic | PENDING |
| QA-027 | Inbox | Contacts/subscribers/bookings/reviews | PENDING |
| QA-028 | Settings | SEO/policies/store defaults | PENDING |
| QA-029 | Publish | Publish draft and verify public route | PENDING |
| QA-030 | Multi-site | Create/switch/delete sites safely | PENDING |
| QA-031 | Team | Invite/role/shared access | PENDING |
| QA-032 | Analytics | Events/sales/product performance | PENDING |
| QA-033 | Mobile | Full critical-path test on phone | PENDING |

## Active test

### QA-001 — Existing user login

**Expected:** Existing confirmed account can log in with the correct email/password and reach the dashboard.

**Steps:**
1. Open https://cobest.me.
2. Click Log in.
3. Enter the existing account email.
4. Enter the current password.
5. Click Log in.

**PASS:** Dashboard opens and the private workspace loads.

**FAIL:** Any error appears, login loops, blank screen appears, or login succeeds but workspace does not load.

**Current status:** WAITING FOR MANUAL RETEST.
