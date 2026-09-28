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
- Collect QA findings and fixes in GitHub first.
- Use branch `qa/stabilization-batch` for stabilization work.
- Do **not** deploy each individual fix to Railway.
- Do **not** merge to `main` until the current QA batch is reviewed.
- Deploy to Railway only after the batch builds cleanly and the user explicitly wants a production retest.
- Keep this register updated as bugs are found, fixed, and retested.

### Current production baseline
- Production commit: `0c9113df3d65d66ec54c4f40448d25128ca84b69`
- Latest builder-foundation deployment was successful.
- Production remains unchanged while this QA batch is being prepared.

### Newly identified stabilization issues

#### QA-STAB-001 — Editor save can overwrite workspace/store settings
**Severity:** P0
**Area:** Website editor / persistence

The Website Editor save action sends `settings: {}`, while the workspace PUT endpoint writes the provided settings object and also applies defaults for omitted workspace-level fields.

**Risk:** Saving website content can unintentionally reset store configuration such as SEO/policies and other workspace settings.

**Status:** OPEN

#### QA-STAB-002 — Published Home does not follow editor section order/theme recipe
**Severity:** P0
**Area:** Publishing / storefront parity

The editor supports theme-specific recipes, custom sections, and `sectionOrder`, but the public Home renderer still outputs a fixed Hero → Featured → Story → custom-block sequence.

**Risk:** Published site can differ materially from the editor preview.

**Status:** OPEN

#### QA-STAB-003 — Custom CSS is not truly scoped
**Severity:** P1
**Area:** Website editor / custom code

Custom CSS is injected into a normal `<style>` element and can target the entire document, despite UI copy saying it is storefront-scoped.

**Risk:** A merchant can accidentally break or hide editor/application UI with selectors such as `body`, `button`, etc.

**Status:** OPEN

#### QA-STAB-004 — Blank canvas can reintroduce Newsletter automatically
**Severity:** P1
**Area:** Blank theme / section builder

Adding a custom Home block inserts the block before `newsletter`, even if the Blank theme currently has no Newsletter section.

**Risk:** Blank sites stop being truly blank/custom.

**Status:** OPEN

#### QA-STAB-005 — Product Grid sections on non-Home pages receive no product data
**Severity:** P1
**Area:** Pages / public storefront

Generic pages render `ContentBlock` without products/currency/cart callbacks.

**Risk:** Product Grid blocks can appear empty on About, Services, and other custom pages.

**Status:** OPEN

#### QA-STAB-006 — Newsletter is globally forced on published pages
**Severity:** P1
**Area:** Public storefront

Newsletter rendering is outside the page-specific content structure.

**Risk:** Newsletter can appear even when the merchant did not choose it for that page/theme.

**Status:** OPEN

#### QA-STAB-007 — Payment-provider failure can leave a created order behind
**Severity:** P1
**Area:** Checkout / payments

The order is created before Stripe/PayPal checkout-session creation. If provider creation fails, the customer sees an error although an order already exists.

**Risk:** Retrying checkout can create duplicate pending orders.

**Status:** OPEN

#### QA-STAB-008 — Editor Save reports success even when cloud save fails
**Severity:** P2
**Area:** Persistence / UX

Cloud save errors are swallowed and the UI still shows "Website changes saved."

**Risk:** Merchant believes work is safely stored when cloud persistence failed.

**Status:** OPEN

#### QA-STAB-009 — Non-Home editor preview does not fully match global design settings
**Severity:** P2
**Area:** Pages / editor parity

Subpage preview still uses older fixed styling and does not fully inherit the newer typography/custom design system.

**Status:** OPEN

#### QA-STAB-010 — Offered font weights exceed loaded font files
**Severity:** P2
**Area:** Typography

The UI offers weights such as 800/900, while some configured Google Font imports do not provide those weights.

**Status:** OPEN

#### QA-STAB-011 — Automated test coverage is missing
**Severity:** QA infrastructure
**Area:** CI

Current scripts validate build/start behavior but do not run unit, component, or end-to-end flows for authentication, builder persistence, products, checkout, publishing, and storefront parity.

**Status:** OPEN


## Visual Builder full implementation batch

**Branch:** `qa/stabilization-batch`  
**Draft PR:** #2 — Phase 1: TypeScript visual builder core  
**Validated head:** `cb03a75b3c774288b388e2544726896462708add`  
**CI run:** 150 — SUCCESS

### Validation
- npm ci — PASS
- Vite production build — PASS
- Server startup — PASS
- Health endpoint — PASS
- SPA fallback — PASS

### Implemented builder scope
- Phase 1: typed JSON model, Zustand, iframe canvas, select/hover, IndexedDB — COMPLETE
- Phase 2: Add Elements, dnd-kit drag/drop, nested Navigator — COMPLETE
- Phase 3: reusable classes, breakpoint/state CSS controls, visual box model — COMPLETE
- Phase 4: settings, pages, assets, inline editing, shortcuts — COMPLETE
- Phase 5: reusable components, interactions, preview, version history — COMPLETE
- Phase 6: CMS collections, bindings, template pages — COMPLETE
- Phase 7: clean HTML/CSS/JS ZIP export and project JSON import/export — COMPLETE

### Deployment state
- Railway deployment was NOT triggered.
- Production remains on the existing deployed main branch.
- The new visual builder remains isolated in GitHub until an explicit production push is requested.

### Important migration boundary
The new builder intentionally uses IndexedDB as its first persistence layer and publish simulation/export as its first publishing path. Existing Supabase/Railway storefront publishing has not yet been replaced by the new project JSON format. This is a migration task, not a Phase 1–7 builder feature gap.
