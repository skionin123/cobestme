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
| BUG-007 | P3 | Sidebar / site switcher | Store selector remained visually misaligned and looked unfinished after two CSS-only fixes | Rebuilt component into a two-row professional store card with aligned header row and full-width selector | PASS | 04ed805 + 77834c5 |
| BUG-008 | P0 | Password recovery | Reset emails could return to localhost or leave the user on an expired-link dead end instead of a CoBest recovery screen | Recovery callback was query/hash-based and did not provide a dedicated public reset route | FIX DEPLOYED / RETEST NEEDED | 0b3c1e5 |
| BUG-009 | P2 | Password recovery UX | Raw `email rate limit exceeded` error shown after repeated reset requests | Supabase built-in email service rate-limited repeated recovery emails; UI exposed raw provider error | FIX DEPLOYING / RETEST AFTER COOLDOWN | 3773407 |

## Formal QA queue

We will not skip ahead after a failure.

| Test ID | Area | Test | Status |
|---|---|---|---|
| QA-001 | Authentication | Existing user login | PASS |
| QA-002 | Authentication | Forgot password request | BLOCKED — provider rate limit; retest later |
| QA-003 | Authentication | Password reset email callback | BLOCKED BY QA-002 |
| QA-004 | Authentication | Set new password | BLOCKED BY QA-003 |
| QA-005 | Authentication | Log out then log back in | PARTIAL — logout PASS, relogin pending |
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

**Current status:** PASS — dashboard loaded successfully on production.


### QA-001 result — Existing user login

**Result:** PASS

Evidence:
- Production login completed successfully.
- Dashboard loaded.
- Private workspace and sidebar were visible.
- Orders / Products / Customers / Online Store navigation loaded.

Observed during the same screenshot:
- **BUG-007** sidebar site-switcher layout issue in the top-left store selector.
- CSS fix committed as `6137101db950dbc704e71d338bc946b68b9f1d8c`.
- Retest required after deployment before moving to QA-002.


### BUG-007 retest — first fix failed visual QA

**Result:** FAIL

Observed:
- Store name, dropdown, avatar, and create-site button fit inside the container.
- Dropdown and `+` button were still vertically misaligned.
- Avatar / selector controls did not share a clean baseline.

**Second fix:** align avatar, 32px select, and 32px create-site button to the bottom control row beneath the store label.

Commit: `5c91efa0b0deab7b4df0d728a23087463c68db34`

Retest: **PENDING after deployment**


### BUG-008 — Dedicated CoBest password reset page

Requested behavior:
- Forgot Password opens a CoBest recovery page.
- Reset emails return to `https://cobest.me/reset-password`.
- Valid recovery links show **Set a new password** on CoBest.
- Expired/invalid links remain on CoBest and show a form to request a new reset link.
- The user should never need a local development server to reset a production password.

Implementation:
- Client recovery redirect changed to `https://cobest.me/reset-password`.
- Server recovery endpoint forces the same production URL.
- Added a dedicated Reset Password request screen on CoBest.
- Valid Supabase recovery hash → new-password form.
- Invalid/expired hash → same CoBest reset page with a clear error and resend option.

Commits:
- `b5d195d` recovery URL
- `f204ccdf` server production callback
- `0b3c1e5` dedicated reset page and callback routing

Retest: **PENDING after deployment; use a newly requested email, not an older expired link.**


### QA-002 — Forgot password request

**Result:** PARTIAL / PROVIDER RATE-LIMITED

Observed production behavior:
- Earlier reset request returned HTTP 200.
- Repeated reset request later returned HTTP 429.
- UI exposed raw message: `email rate limit exceeded`.

Interpretation:
- CoBest's reset endpoint is reachable and works.
- Supabase's built-in auth email sender is temporarily limiting repeated emails.
- This is expected provider protection, but the raw message was poor UX.

Fixes:
- Friendly rate-limit message added.
- User is told to wait before requesting another reset email and to use only the newest link.
- HTML app shell now uses `Cache-Control: no-store` so users do not keep running stale JavaScript after deployments.
- Hashed assets remain long-cache/immutable.

Commits:
- `3773407` auth rate-limit UX
- `d5743ae` production app-shell cache control

Retest: **PENDING after email cooldown and deployment.**


## Active test update — QA-005

Password-reset QA-002 through QA-004 are temporarily deferred because the auth email provider is rate-limiting repeated recovery emails. They remain open and will be resumed after cooldown.

### QA-005 — Log out then log back in

**Expected:**
1. Sign out clears the authenticated session.
2. CoBest returns to the public/log-in state.
3. The private dashboard is no longer accessible without authentication.
4. Logging back in with the same account restores the workspace successfully.

**Steps:**
1. From the dashboard, click **Sign out** at the bottom-left.
2. Confirm the dashboard disappears and the public/login screen is shown.
3. Click **Log in**.
4. Enter the same working account credentials.
5. Confirm the dashboard and existing workspace load again.

**PASS:** logout prevents private access and subsequent login restores the workspace.

**FAIL:** dashboard remains accessible after logout, logout loops/errors, or login does not restore the workspace.


### BUG-007 retest — second fix still failed visual QA

**Result:** FAIL

Observed from production screenshot:
- Controls technically fit, but the card still looked visually uneven.
- Avatar, store label, dropdown, and add-site action competed for the same horizontal line.
- Overall appearance did not look polished enough for production.

**V3 redesign implemented:**
- Rebuilt the site selector from a cramped one-row control into a structured two-row store card.
- Row 1: store avatar + "Current store" label + active store name + aligned create-site button.
- Row 2: full-width site selector with store icon.
- Unified heights, spacing, border radius, typography, hover/focus states, and truncation.
- Removed the visual competition between the dropdown and create button.

Commits:
- `04ed805` component markup redesign
- `77834c5` professional styling

Retest: **PENDING after deployment**


### BUG-007 final retest — PASS

**Result:** PASS

Evidence from production screenshot:
- Avatar, current-store label, active store name, and create-site button are aligned.
- Site selector is separated into its own full-width row.
- Spacing, hierarchy, and control heights now look intentional and production-ready.
- No overlap or cramped one-line layout remains.

BUG-007 is closed.

### QA-005 remains active

Next action: test **Sign out → Log back in → same workspace restored**.


### QA-005 progress — logout half PASS

**Observed:** After clicking Sign out, the private dashboard disappeared.

**Result so far:** PASS for session logout/private-area removal.

Still required to complete QA-005:
1. Click **Log in**.
2. Sign back in with the same account.
3. Confirm the same store/workspace loads again.

QA-005 remains **PARTIAL** until the relogin/restoration step passes.
