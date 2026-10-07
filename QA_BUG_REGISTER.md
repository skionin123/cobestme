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
| QA-006 | Onboarding | Start free → create account → onboarding | NEXT |
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


### QA-005 progress update

Step 1 — **PASS**
- User clicked **Sign out**.
- Private dashboard disappeared as expected.
- This confirms logout removes the private workspace view.

Remaining:
- Log back in with the same account.
- Confirm the same workspace/store loads again.


### QA-005 final result — PASS

**Result:** PASS

Confirmed:
- Sign out removed the private dashboard.
- Logging back in with the same account succeeded.
- The same store/workspace remained available after reauthentication.

This confirms session logout and subsequent workspace restoration work as expected.

## Next active test — QA-006

### QA-006 — Start free → create account → onboarding

**Expected:**
1. Public homepage loads.
2. **Start free** opens the Create Account screen.
3. A brand-new email/password account can be created.
4. Successful signup proceeds into onboarding.
5. No login loop, blank screen, or UI crash occurs.

**Important:** use a different email address that is not already registered in CoBest.

**PASS:** new account reaches onboarding successfully.

**FAIL:** signup errors unexpectedly, returns to login, stays on the signup screen without explanation, or onboarding does not load.


# MVP-first QA phase — 2026-09-28

The user requested that testing now prioritize the working CoBest MVP rather than continue with account-creation/password-recovery edge cases.

Deferred for later:
- QA-002 Forgot password request
- QA-003 Password reset callback
- QA-004 Set new password
- QA-006 New account creation/onboarding

These remain open but do not block MVP functional testing.

## MVP critical path

| MVP Test | Area | Test | Status |
|---|---|---|---|
| MVP-001 | Workflow | Setup & Workflow screen loads and recommended next step works | PASS |
| MVP-002 | Themes | Choose theme and retain selection | NEXT |
| MVP-003 | Pages | Add/edit/reorder/hide page | PENDING |
| MVP-004 | Navigation | Main/footer menu add/remove/reorder | PENDING |
| MVP-005 | Website editor | Edit Home content and save | PENDING |
| MVP-006 | Responsive editor | Desktop/tablet/mobile preview | PENDING |
| MVP-007 | Products | Create product and persist after refresh | PENDING |
| MVP-008 | Catalog | Edit/search/filter product; taxonomy/collections | PENDING |
| MVP-009 | Media | Add/upload/select media | PENDING |
| MVP-010 | Storefront | Preview active product/pages/navigation | PENDING |
| MVP-011 | Cart | Add/remove/change cart items | PENDING |
| MVP-012 | Checkout | Internal/test checkout creates order/customer | PENDING |
| MVP-013 | Orders | View/update fulfillment/tracking | PENDING |
| MVP-014 | Customers | View/edit/history | PENDING |
| MVP-015 | Settings | SEO/policies/store defaults | PENDING |
| MVP-016 | Publish | Publish draft and verify public route | PENDING |
| MVP-017 | Persistence | Refresh/relogin and confirm data remains | PENDING |
| MVP-018 | Mobile | Critical MVP path on phone | PENDING |

## Active MVP test — MVP-001

### Setup & Workflow

**Expected:**
1. **Setup & workflow** opens from the dashboard/sidebar.
2. Launch-readiness percentage and setup steps render.
3. The next recommended action is visible.
4. Clicking the recommended action opens the correct CoBest module.
5. No blank screen, crash, or dead control occurs.

**PASS:** workflow center loads and next-step navigation works.

**FAIL:** screen crashes, values are obviously wrong, or next-step buttons do nothing.


### MVP-001 progress — Setup & Workflow screen

**Result so far:** PARTIAL PASS

Confirmed from production screenshot:
- Setup & Workflow page loads successfully.
- Launch-readiness percentage renders (38%).
- Setup progress renders as 3 of 8 steps complete.
- Recommended next step is shown as **Build pages**.
- Launch-process steps render correctly.
- Daily Operations cards render correctly.
- Preview and Publishing controls are visible.
- No blank screen, runtime crash, or obvious layout break is present.

Still required to complete MVP-001:
- Click **Next: Build pages**.
- Confirm it opens the correct page-management module.

If the button opens the page-management screen, MVP-001 can be marked PASS.


### MVP-001 final result — PASS

**Result:** PASS

Confirmed:
- Setup & Workflow screen loaded correctly.
- Launch readiness and setup steps rendered.
- Recommended next action was **Build pages**.
- Clicking **Next: Build pages** opened the **Online store / page-management** screen.
- The page-management screen showed the current theme, publishing controls, and Pages section without a crash.

No new bug was found in this test.

## Next active MVP test — MVP-002

### MVP-002 — Choose a theme and retain selection

**Expected:**
1. Open **Themes** from the sidebar.
2. Theme library loads.
3. Choose a theme different from the current theme.
4. The selected theme becomes current.
5. Navigate away and back, or refresh the page.
6. The chosen theme remains selected.

**PASS:** theme selection changes and persists.

**FAIL:** theme button does nothing, preview does not change, selection reverts unexpectedly, or page crashes.


### MVP-002 design review — theme library quality issue

**Result:** IMPROVEMENT REQUIRED

User feedback:
- Existing themes looked too similar and too placeholder-like.
- User requested checking contemporary ecommerce designs on the web and bringing stronger design variety into CoBest.

Research direction used:
- Modern Shopify/Webflow/Framer ecommerce patterns: editorial storytelling, oversized type, minimal grids, bold campaign layouts, dark luxury, and soft boutique systems.
- Designs remain original CoBest themes; no competitor theme was copied verbatim.

Implemented:
- Expanded theme metadata and visual systems.
- Added distinct palette, typography, spacing, radius, button shape, and storefront treatment per theme.
- Added two new themes: **Vanta** and **Bloom**.
- Rebuilt theme cards so every theme preview has a visibly different composition.
- Selected theme now materially changes the storefront preview, not only the font/radius.

Theme directions:
- Aurelia — Warm minimal
- Mono — Brutalist utility
- Atelier — Luxury editorial
- Studio — Fashion campaign
- Market — Bold retail
- Editorial — Magazine commerce
- Vanta — Dark luxury
- Bloom — Soft boutique

Commits:
- `4efb807` design-system metadata + upgraded theme library
- `107f433` distinct preview/storefront visual styles

Retest: **PENDING after deployment**


### MVP-002 second design review — themes still shared the same section structure

**Result:** IMPROVEMENT REQUIRED

User feedback:
- Theme colors/typography improved, but themes still used essentially the same section stack.
- User requested genuinely different kinds of sections per theme.

Implemented:
- Added a theme-recipe system so each theme has its own default section composition.
- Theme selection now changes both visual styling **and** the actual Home-page section structure.
- Theme-specific sections are editable in the Website Editor and can be reordered.

Distinct section recipes now include:

**Aurelia**
- Split hero
- Featured collection
- Image + story
- Brand quote
- Newsletter

**Mono**
- Announcement marquee
- Utility hero
- Spec grid
- Product grid
- Statement band

**Atelier**
- Editorial hero
- Collection spotlight
- Maison story
- Selected pieces
- Journal cards
- Private list

**Studio**
- Campaign hero
- Category strip
- Lookbook mosaic
- Latest drop
- Campaign CTA

**Market**
- Promo bar
- Retail hero
- Shop categories
- Best sellers
- Why-shop-here benefits
- Offers signup

**Editorial**
- Magazine masthead
- Issue opener
- Editorial story grid
- Objects in this issue
- Latest stories
- Reader list

**Vanta**
- Immersive hero
- Signature collection
- Craft metrics
- Selected pieces
- Private-access CTA

**Bloom**
- Soft hero
- Routine steps
- Ingredient cards
- Shop the ritual
- Customer story
- Community signup

Additional changes:
- Theme library previews now visually represent each theme's different section recipe.
- New theme-specific sections have editable heading/body/button content in the editor.
- New sections participate in section reordering.
- Responsive styles added for theme-specific layouts.

Commits:
- `b873c09` theme recipe system and editable sections
- `51e1156` section card rendering fix
- `966bb3e` distinct section layouts and responsive styling

Retest: **PENDING after deployment**


### MVP-002 third design review — section size and client choice

**User feedback:**
- Theme sections felt too large.
- Theme application should not force a client to accept every section in the recipe.
- Clients/customers need to be able to choose the sections they want.

**Changes implemented:**
- Theme previews made more compact.
- Theme-specific storefront sections reduced in vertical size and spacing.
- Theme cards now use **Choose theme** instead of instantly applying the full recipe.
- Applying a theme now opens a **section picker**.
- Clients can select/deselect individual sections before applying the theme.
- Existing/current themes also have **Choose sections / Edit sections** so the section set can be changed later.
- New themes default to a smaller recommended set (up to 4 sections), rather than forcing all 5–6.
- Section picker shows selected count and supports returning later to change the structure.

**Commits:**
- `75b94a4` client section-selection workflow
- `45dedde` compact theme/section sizing and picker styling

**Retest:** PENDING after deployment.


### MVP-002 fourth design review — theme library preview became oversized

**Result:** FAIL

Observed from production screenshots:
- Current-theme preview dominated the page vertically.
- Section previews were too tall and visually repetitive.
- Theme selection was pushed far below the fold.
- The experience felt more like a full rendered storefront than a theme picker.

**Fix implemented:**
- Replaced oversized full-section previews with compact fixed-height theme thumbnails.
- Current theme now uses a compact preview + summary/details/actions layout.
- Theme library now uses a 3-column desktop card grid (2-column medium, 1-column mobile).
- Each card keeps a distinct visual identity without rendering full-sized sections.
- Section picker remains available separately, so theme choice and section choice are no longer visually conflated.
- Theme cards now show concise **Choose / Edit** actions.

**Commits:**
- `daca6bd` compact theme-card redesign
- `7981fec` compact professional theme library styling

**Retest:** PENDING after deployment.


## Active MVP retest — MVP-002 Theme selection + section picker

### Goal
Confirm the redesigned theme library is usable and that clients can choose a theme plus only the sections they want.

### Steps
1. Hard-refresh the **Themes** page.
2. Confirm theme cards are compact and visible without giant full-page previews.
3. Pick a theme different from the current theme (recommended test: **Studio**).
4. Click **Choose**.
5. Confirm the section picker opens.
6. Select only 3 sections:
   - Campaign hero
   - Lookbook mosaic
   - Latest drop
7. Click **Apply Studio with 3 sections**.
8. Confirm Studio becomes the current theme.
9. Open **Website editor**.
10. Confirm the Home section list contains only the selected Studio sections (plus Header/Footer where applicable).
11. Refresh the browser.
12. Confirm Studio and the chosen section set remain selected.

### PASS
- Compact theme library is usable.
- Section picker opens.
- Selected sections apply correctly.
- Website editor reflects the chosen section structure.
- Theme + section choices persist after refresh.

### FAIL
- Theme cards are still oversized.
- Section picker does not open.
- Extra/unselected sections are forced in.
- Selected theme/sections revert after refresh.
- Any button is dead or page crashes.


## QA stabilization batch — GitHub-first workflow

### Working agreement
- Development and QA fixes stay on `qa/stabilization-batch`.
- Railway is not deployed until the user explicitly says to push it.
- Code-level validation must pass tests, security audit, production build, server startup, health check, and SPA fallback.
- Browser/live behavior is retested only after the exact tested branch is deployed.

### Production baseline
- Production remains on the previously deployed `main` version.
- This stabilization batch is not live yet.

### Stabilization issues

#### QA-STAB-001 — Partial saves could reset workspace settings
**Severity:** P0  
**Status:** FIXED IN CODE — LIVE RETEST PENDING

The workspace PUT endpoint now loads the current row and merges onboarding, editor, and settings objects. Unspecified slug, custom domain, plan, currency, timezone, and site name are preserved. The new visual builder saves only its project payload and no longer needs to resend empty/default workspace values.

#### QA-STAB-002 — Published site could differ from editor structure
**Severity:** P0  
**Status:** FIXED IN CODE — LIVE RETEST PENDING

The new visual project is now included in normal CoBest publish snapshots and rendered from the same JSON project model through an isolated published iframe. Legacy sites without a visual project now render Home according to `sectionOrder`, including theme-specific/custom sections.

#### QA-STAB-003 — Custom CSS could affect CoBest editor chrome
**Severity:** P1  
**Status:** FIXED IN CODE — LIVE RETEST PENDING

The new designer runs the edited site in a sandboxed iframe. Site styles/custom HTML are isolated from the application UI. The legacy in-app storefront preview no longer injects legacy custom CSS into the CoBest document.

#### QA-STAB-004 — Blank canvas reintroduced Newsletter
**Severity:** P1  
**Status:** FIXED IN CODE — LIVE RETEST PENDING

Adding a legacy block now preserves whether Newsletter was already part of the section order. A blank section order remains blank. The new visual builder has no forced Newsletter behavior.

#### QA-STAB-005 — Product Grid blocks were empty on non-Home pages
**Severity:** P1  
**Status:** FIXED IN CODE — LIVE RETEST PENDING

Legacy generic pages now pass products, currency, and add-to-cart callbacks to content blocks. New visual pages use the visual project renderer and keep Shop/Cart available through the commerce layer.

#### QA-STAB-006 — Newsletter was forced onto every published page
**Severity:** P1  
**Status:** FIXED IN CODE — LIVE RETEST PENDING

The unconditional global Newsletter render was removed. Legacy Newsletter appears only when present in the selected Home section order; visual projects control their own page trees.

#### QA-STAB-007 — Payment-provider failure encouraged duplicate order retries
**Severity:** P1  
**Status:** FIXED IN CODE — LIVE PROVIDER RETEST PENDING

Checkout now:
- rejects requested quantities above published inventory;
- preserves an already-created pending order if Stripe/PayPal session creation fails;
- returns that order plus a warning telling the customer not to place it again;
- clears the cart and surfaces the order/warning instead of showing a generic retry error.

A pending order is intentionally retained for merchant follow-up; duplicate-retry UX is removed.

#### QA-STAB-008 — Save could report success after cloud failure
**Severity:** P2  
**Status:** FIXED IN CODE — LIVE RETEST PENDING

The new designer awaits local and cloud persistence, exposes Saving/Saved/Save failed state, and alerts on manual-save failure. Autosave failures remain visible as Save failed.

#### QA-STAB-009 — Editor/public design parity on subpages
**Severity:** P2  
**Status:** FIXED IN CODE — LIVE RETEST PENDING

All visual-builder pages use the same JSON tree and CSS compiler for editor canvas, preview, publish, and export. Public visual pages render the same project model.

#### QA-STAB-010 — Typography controls exceeded loaded font weights
**Severity:** P2  
**Status:** FIXED IN CODE — LIVE RETEST PENDING

Google Font imports were expanded to cover the offered supported weight ranges. The new designer loads its fonts inside the canvas/exported site rather than relying on editor chrome CSS.

#### QA-STAB-011 — Automated application tests were missing
**Severity:** QA infrastructure  
**Status:** FIXED

Vitest is integrated into CI. Tests cover tree insert/move/cycle protection/duplication, breakpoint CSS compilation, clean editor-vs-export HTML, ZIP generation, CMS template item export, and all requested template categories. CI also includes a high/critical dependency audit.

### Additional stabilization completed
- Visual-builder project state is keyed per CoBest workspace/site, preventing two sites in one browser from sharing the same IndexedDB project.
- Authenticated builder assets upload through the existing CoBest/Supabase media endpoint instead of embedding large base64 images into cloud workspace JSON.
- Builder autosave persists to IndexedDB and the authenticated workspace.
- Builder Publish saves the project and publishes it through the existing CoBest published-store endpoint.
- Published visual pages retain access to CoBest Shop, Cart, Checkout, and Customer Account.
- Public visual-page SEO title/description come from the visual project page data.
- Visual navigation maps internal page URLs back to CoBest page navigation.
- Template gallery added inside the new designer: Business, Portfolio, Agency, SaaS, Ecommerce, Restaurant, Personal, Blog.
- Marketing site expanded with Product/Features/Templates/Resources/Pricing navigation, template gallery, testimonials, FAQ, and stronger CTAs.
- Dependency security audit passed after upgrading Vitest to the patched release.

## Visual Builder implementation batch

**Branch:** `qa/stabilization-batch`  
**Draft PR:** #2  
**Deployment:** NOT deployed to Railway

### Implemented phases
- Phase 1 — typed project model, Zustand, iframe canvas, selection/hover, IndexedDB: COMPLETE
- Phase 2 — Add Elements, dnd-kit drag/drop, nested Navigator: COMPLETE
- Phase 3 — classes, states, responsive visual CSS controls, spacing handles: COMPLETE
- Phase 4 — settings, page management, assets, SEO, inline text, shortcuts: COMPLETE
- Phase 5 — components, interactions, preview, last-20 version history: COMPLETE
- Phase 6 — CMS collections, Collection List, item template pages: COMPLETE
- Phase 7 — clean HTML/CSS/JS ZIP and project JSON export/import: COMPLETE
- Template marketplace/gallery inside builder: COMPLETE
- CoBest workspace save/publish bridge: COMPLETE IN CODE
- Published visual-project renderer with commerce bridge: COMPLETE IN CODE
- Automated builder test suite + dependency audit: COMPLETE

### Required live retest after deployment
The code batch is build/test validated in GitHub, but authenticated browser behavior and provider flows must be tested against the deployed environment before production QA is marked fully PASS.


## Functional production audit — 2026-10-07

Audit standard: trace the real MVP end to end, fix root causes, and only mark verified behavior as passing.

### AUDIT-001 — P1 — Viewer could mutate privileged workspace state
- **Areas:** publishing, unpublishing, media upload.
- **Problem:** Viewer is documented as read-only, but these authenticated mutation routes did not enforce the Viewer restriction server-side.
- **Root cause:** role checks existed on generic CRUD but were missing on standalone mutation routes.
- **Fix:** added server-side 403 guards for Viewer on publish, unpublish, and media upload.
- **Regression:** `tests/server-authorization.test.ts`.

### AUDIT-002 — P1 — Billing portal authorization inconsistent
- **Area:** subscription billing.
- **Problem:** billing checkout required Owner/Admin but billing portal did not.
- **Root cause:** missing role guard on the portal route.
- **Fix:** billing portal now requires Owner or Admin.
- **Regression:** `tests/server-authorization.test.ts`.

### AUDIT-003 — P1 — Checkout totals could become invalid from malformed numeric data
- **Areas:** public checkout, inventory, discounts, tax, shipping.
- **Problem:** malformed quantity or legacy numeric values could produce non-finite totals.
- **Root cause:** unchecked `Number(...)` values flowed through checkout arithmetic.
- **Fix:** extracted and hardened `calculateCheckout`; quantities, stock, prices, discounts, shipping, and tax are now validated/bounded.
- **Regression:** `tests/server-commerce.test.ts` covers malformed quantities, inventory limits, discount caps/expiry/usage, shipping, and tax.

### AUDIT-004 — P1 — Logout only cleared browser storage
- **Area:** authentication.
- **Problem:** signing out removed local tokens but did not revoke the Supabase session server-side.
- **Root cause:** no authenticated logout API route.
- **Fix:** added `POST /api/auth/logout`, revokes with Supabase, then client clears local auth/site tokens even if the network call fails.
- **Regression:** `tests/server-authorization.test.ts`.

### AUDIT-005 — P2 — Dead Campaign action leaked into Discounts UI
- **Area:** Discounts.
- **Problem:** discount rows contained a copied `sendCampaign` action that is not part of discounts and is undefined in that component.
- **Root cause:** accidental cross-feature UI code.
- **Fix:** removed the invalid action; retained Edit/Delete.
- **Regression:** source-level assertion in `tests/server-authorization.test.ts`.

### AUDIT-006 — P2 — Public form and cart edge cases
- **Areas:** cart, newsletter, contact, booking, review, order lookup, checkout.
- **Problems:** cart could exceed displayed stock before checkout; newsletter errors were unhandled; contact/booking allowed repeat submits; public endpoints accepted weak email/date/rating input.
- **Fixes:** stock-aware cart increments, form busy/error states, future-booking validation, server-side email validation, review rating 1–5 validation, checkout buyer email validation.
- **Status:** implementation complete; branch CI required before merge.

### AUDIT-007 — Build security gate
- **Area:** development/test dependencies.
- **Problem:** CI detected high/critical advisories in Vitest 3.2.7 dependency graph and source-map-js 1.2.1.
- **Fix:** refreshed lockfile with Vitest 4.1.11 / @vitest/mocker 4.1.11 and source-map-js 1.2.2; vulnerable tinypool is no longer installed.
- **Verification:** dependency refresh runner passed `npm audit --audit-level=high`, unit tests, and production build. Normal PR CI must still pass on the final clean head.

