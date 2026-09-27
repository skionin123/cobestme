# CoBest Live Site Testing

Production URL: https://cobest.me  
Repository: skionin123/cobestme  
Hosting: Railway  
DNS / edge: Cloudflare

## Purpose

This file is the source of truth for production smoke testing. Results are updated as each test is completed so the testing history stays in GitHub.

## Status legend

- PASS — expected result confirmed
- FAIL — problem reproduced
- PENDING — not tested yet or waiting on infrastructure
- PARTIAL — basic behavior works but follow-up is still required

## Test run — 2026-09-26

| ID | Area | Test | Expected | Result | Notes |
|---|---|---|---|---|---|
| T01 | Availability | Open https://cobest.me | CoBest landing page loads | PASS | Railway HTTP logs show GET / on host cobest.me returned 200; live screenshot shows the CoBest landing page. |
| T02 | HTTPS / SSL | Browser security state | Valid HTTPS with no browser warning | FAIL | Chrome currently shows “Not secure” even though the site loads over https://cobest.me. Cloudflare SSL/TLS mode is Full; certificate/edge state still needs verification. |
| T03 | Desktop UI | Landing page at desktop width | Header, hero, CTA and product mockup render without obvious breakage | PASS | Confirmed from production screenshot. |
| T04 | Navigation | Website / Commerce / How it works / Pricing / FAQ anchors | Each nav item moves to the correct section | PENDING | Test manually. |
| T05 | Start free | Main Start free CTA | Opens guided onboarding | PENDING | Test manually. |
| T06 | Login | Log in CTA | Opens login screen and Back returns home | PENDING | Test manually. |
| T07 | Onboarding | Complete all onboarding steps | Reaches app dashboard and preserves entered data | PENDING | Test manually. |
| T08 | Products | Create a draft product | Product appears in catalog and persists after refresh | PENDING | Test manually. |
| T09 | Website editor | Change hero content/device mode | Preview updates and data persists after refresh | PENDING | Test manually. |
| T10 | Store preview | Open storefront from Online store | Store preview renders using saved project/product data | PENDING | Test manually. |
| T11 | Responsive UI | Test mobile width | Navigation/content remain usable with no horizontal overflow | PENDING | Test on phone. |
| T12 | Refresh / SPA | Refresh while using the app | App reloads without server 404/500 | PENDING | server.mjs currently falls back to dist/index.html for unknown paths. |
| T13 | Production health | Railway deployment/runtime | Deployment stays healthy and requests return 2xx | PASS | Production deployment is successful and Railway received cobest.me requests with HTTP 200. |

## Known issue

### SSL / browser security warning

The production site currently loads, but Chrome displays **Not secure**. Do not mark the launch smoke test complete until this is resolved and T02 changes to PASS.

## Testing sequence

Run tests in this order so failures are easier to isolate:

1. Availability and HTTPS
2. Landing-page navigation
3. Start-free / onboarding flow
4. Login flow
5. Dashboard and persistence
6. Products
7. Visual editor
8. Store preview
9. Mobile / responsive behavior
10. Final Railway log and production-health check

## Change log

- 2026-09-26 — Created production smoke-test record after cobest.me began serving the CoBest application.


## Functional MVP deployment update — 2026-09-26

The production build now includes real authentication and persistent Supabase-backed data for workspace state, products, customers, orders, discounts, campaigns, and media records.

Additional implemented test targets:
- Real signup/login/password recovery
- Cloud workspace save/reload
- Persistent product creation
- Persistent customer creation
- Persistent order creation
- Basic sales/order/customer analytics
- Persistent campaign and discount records
- Basic media records by hosted URL
- Add-page workflow
- Visual content block builder
- 1–4 column block grids
- Block background/text/padding controls
- Storefront cart and test checkout creating real customer/order records

These features are **not marked PASS** until manually verified on the live build.


## Incident — controls not responding (2026-09-26)

User reported that website editing, preview/view, and multiple controls were not responding in the production UI.

### Hotfix applied

- Made **Start free** open onboarding in guest mode so the editor can be tested without an account.
- Added local fallbacks for product, customer, order, media, campaign, and discount actions when not signed in.
- Made **Website editor → Live preview** navigate to the storefront preview.
- Made **Save** persist editor state locally and sync to cloud when authenticated.
- Connected **Settings**, **Help**, header **Search**, brief preview/print, and analytics refresh actions.
- Added normalization for older saved onboarding/editor state to prevent missing-array crashes.
- Added a React error boundary with a recovery screen instead of leaving the interface frozen on runtime errors.
- Deployed hotfix commit `1c8d14191b269b8094fd2de8158f2dd70709e544` to Railway successfully.

### Verification status

Build/deploy: **PASS** (Railway deployment SUCCESS)
Manual button verification in browser: **PENDING USER RETEST**


### UI crash root-cause fix — 2026-09-26

Mobile production testing exposed the runtime error: `Can't find variable: safeEditor`.

Root cause: `safeEditor` was defined inside the top-level `App` component but was incorrectly referenced inside child components `Editor` and `StorefrontPage`, where that variable was out of scope.

Fix:
- Replaced both invalid child-component references with their local `editor` prop.
- Commit: `af294e2ccc21c37afc1c68977ba1a5df86f1205b`
- Railway deployment: `23fb50d8-027f-4ae9-9c8c-bbb46c754a98`
- Railway status: **SUCCESS**

Manual mobile retest: **PENDING**


### Authentication restored — 2026-09-27

The temporary guest bypass used during UI debugging has been removed.

Expected production flow:
- **Start free** → Create account
- **Create account** → Onboarding after successful authentication
- **Log in** → Existing account login
- Authenticated users → Dashboard / editor / store management
- Unauthenticated users cannot remain inside the private workspace

GitHub commit: `b22afec91a3aa8641cc5abab7faeed5b1d671ed2`

Railway production deployment: `489ced62-59ee-4332-adc3-67218eaeb4a5`

Railway status: **SUCCESS**

Manual browser verification: **PENDING**


## Internal-process release — 2026-09-28

Focus shifted from unavailable third-party provider activation to the complete internal CoBest workflow.

New live-test targets:
- Setup & workflow dashboard
- Theme library and theme switching
- Multi-page management
- Main/footer navigation management
- Website editor from selected theme
- Product/catalog process
- Media/content process
- Store settings/policies
- Preview → publish process
- Orders/customers/inbox/analytics operating loop
- Improved invalid-credentials recovery guidance

External provider activation is intentionally excluded from this test phase.


## Password reset redirect incident — 2026-09-28

Observed production recovery link redirecting to `http://localhost:3000` with:
- `error=access_denied`
- `error_code=otp_expired`
- message indicating the email link was invalid or expired.

### Code fixes applied
- Password-reset requests now always request `https://cobest.me/?mode=recovery`.
- Server reset endpoint now forces the CoBest production recovery callback instead of trusting the browser origin.
- Recovery callback parsing now handles Supabase error hashes.
- Expired/invalid links now route back to CoBest login with a useful recovery message instead of leaving the user on a broken callback screen.
- Valid recovery hashes route directly to the Set New Password screen.

Latest recovery code commit: `01a52a9e3a707e57d53d338ef7f1a2ac3a7e9112`
Railway successful deployment: `e7ddc77d-3727-476b-ba48-f3b6b7482012`

### Supabase dashboard configuration still required
The Supabase Auth project URL configuration must use:
- Site URL: `https://cobest.me`
- Allowed recovery redirect: `https://cobest.me/?mode=recovery`
- Recommended additional production allow-list pattern: `https://cobest.me/**`

After changing Auth URL Configuration, request a NEW password reset email. Existing reset links may remain expired or point to the previous localhost configuration.

Manual retest: **PENDING**
