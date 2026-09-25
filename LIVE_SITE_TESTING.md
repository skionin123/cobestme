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
