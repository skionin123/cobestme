# CoBest manual QA runbook — test together from zero

**Owner:** CoBest project | **Started:** 2026-10-12 (Philippine local date)  
**GitHub master tracker:** [Issue #26](https://github.com/skionin123/cobestme/issues/26)  
**Development:** [Draft PR #25](https://github.com/skionin123/cobestme/pull/25)  
**Known live production URL:** https://cobest.me (Railway `cobestme` service)  

> Important: **Production and PR #25 are different builds.** We can begin basic account/onboarding smoke tests on production using new test data. Branch-only features (new Suppliers page, safe SKU CSV importing, payment safeguards) must not be recorded as working on production until they are actually deployed to a safe staging environment. No payment-provider sandbox or real supplier connection is currently verified.

## How we test together

1. Begin at **T01.1**, then perform exactly one numbered subtest at a time. I explain where to click, why we are testing, and what the expected result is.
2. The user sends **PASS**, **FAIL**, or **BLOCKED** with an optional screenshot (redact all personal/customer details).
3. Record an outcome in `docs/QA_SESSION_LOG.md` and issue #26. Never mark other steps as passed based only on CI.
4. For a failure, open a GitHub issue containing reproduction steps, evidence, environment, severity, owner of follow-up and retest result. For optional UX improvements, open a suggestion issue, not a confirmed defect.
5. Fix on a development branch, run CI, then retest **that exact environment and version**. Only close issues after verifying the fix.
6. Do not delete real sites or change real orders during tests. Use dedicated throwaway accounts/sites and harmless fake products. Never share or log passwords, access tokens, API keys or real payment details.
7. If the user is logged into an account with real data, use a private/incognito window for testing signup; do not sign out of or erase an important account without confirming it's safe.

## Environments

| Code | Environment | Use | Known limitations |
|---|---|---|---|
| LIVE | https://cobest.me | Public home, signup, ordinary current merchant workflows | Does **not** contain unmerged PR #25 upgrades |
| DEV | `feat/cobest-mvp-five-milestones`, PR #25 | Automated tests, code review, upcoming staged test deployment | Not a publicly navigable deployment |
| STAGE | Dedicated staging environment, when provisioned | New supplier, product, payments QA with separate test data | Not yet created or verified |

Record actual URL, browser, viewport, test-account alias (not the email), commit, and date in the session log.

## A complete start-to-launch journey

| ID | Area | Action & expected evidence | Status |
|---|---|---|---|
| T01.1 | Landing | Open https://cobest.me in a private window. Observe whether the page loads and the primary actions are visible; capture a screenshot. | NOT RUN |
| T01.2 | Signup | Create a throwaway account using your own safe test mailbox; expect a clear success/verification message or an actionable error. | NOT RUN |
| T01.3 | Login / session | Sign in to the test account, refresh, check session persistence, sign out, and confirm protected pages aren't accessible without authentication. | NOT RUN |
| T01.4 | Recovery | Try account recovery for the test account; **BLOCKED** if email/verification provider is not configured. | NOT RUN |
| T02.1 | Onboarding | Start a new **Online Store** and fill the business type, business name and goals; use fictional test details. | NOT RUN |
| T02.2 | Onboarding | Move Back/Continue between steps; verify values persist, errors are understandable, and finishing reaches the right workspace. | NOT RUN |
| T03.1 | Sites | Create a second throwaway website; verify names, selector and correct dashboard are shown. | NOT RUN |
| T03.2 | Sites | Switch back and forth; verify pages/settings/products don't appear on the wrong site. | NOT RUN |
| T04.1 | Template | Open **Website themes**, select Simple or Professional, then check you reach an editable design. | NOT RUN |
| T04.2 | Editor | Edit a heading and a button. Save, refresh and check values persist. | NOT RUN |
| T05.1 | Pages | Add, rename or rearrange a page; verify navigation and Preview match edits. | NOT RUN |
| T05.2 | Responsive | Review mobile/tablet/desktop preview; check text readability, footer, page scroll and menus. | NOT RUN |
| T06.1 | Publish | Publish a throwaway site using a safe non-identifying test slug; open its public link in a new/private window. | NOT RUN |
| T06.2 | Draft separation | Change draft content without republishing; confirm the public page remains unchanged, then publish and confirm the new version. | NOT RUN |
| T07.1 | Categories | Create test category/subcategory and check the hierarchy displays correctly. | NOT RUN |
| T07.2 | Products | Create one Draft and one Active product with harmless SKU, price and stock; verify visibility/filtering. | NOT RUN |
| T08.1 | Media | Add or choose a permitted image and check it saves and survives reload. | NOT RUN |
| T08.2 | Variants | Add two variants with different SKUs/prices/stock; verify editor persistence. **Do not place a live variant order** because full variant checkout is an open item. | NOT RUN |
| T09.1 | Suppliers | In **STAGE**: assign Doba/CJ/generic source to products; review sourcing totals and unassigned products. | NOT RUN |
| T09.2 | CSV | In **STAGE**: import a test CSV, preview new/updated/skipped counts, cancel, then confirm a safe repeat import. | NOT RUN |
| T09.3 | CSV safety | In **STAGE**: reject duplicate/missing SKU, negative stock, conflicting supplier and variant-SKU collisions. | NOT RUN |
| T10.1 | Cart | In a published *test* shop, add products and adjust quantities; verify subtotal and stock constraints. | NOT RUN |
| T10.2 | Checkout | Verify guest form and payment-option messaging in test mode. **Stop before spending real money.** | NOT RUN |
| T11.1 | Orders | With test orders only, verify customer, payment state (read-only), supplier notes and status choices. | NOT RUN |
| T11.2 | Fulfillment | In **STAGE**: move a test order through Unfulfilled → Processing → Fulfilled, add tracking and verify it persists. | NOT RUN |
| T12.1 | Reports | Open overview and sales report; ensure pending/unpaid orders don't count as verified revenue. | NOT RUN |
| T12.2 | Launch setup | Review contact details, policies, shipping/taxes, publish warnings and non-store vs store readiness. | NOT RUN |
| T13.1 | Mobile | Test actual phone-sized viewport and keyboard controls on critical pages. | NOT RUN |
| T13.2 | UX | Review empty/error/loading states, long forms, back buttons, scroll and navigation clarity. | NOT RUN |
| T14.1 | Isolation | In **STAGE**: independently sign in as a second merchant and try to access first merchant's site/products/orders via normal UI and safe route attempts. | NOT RUN |
| T15.1 | Payments | In **STAGE** with provider sandboxes: valid, cancelled, failed, delayed, duplicate/replayed webhook, refund, amount & stock reconciliation. | BLOCKED — external setup |

## When we discover something

Use this issue title format: `[T04.2][BUG][P1] Website editor loses heading on refresh`.  
Issue body template:

```md
### Test reference
Txx.y / YYYY-MM-DD / LIVE or STAGE / app commit

### Reproduction
1.
2.
3.

### Expected
...
### Actual
...
### Severity
P0 data/security/payment loss / P1 core function broken / P2 usability / P3 polish
### Evidence
Redacted screenshot or short screen recording
### Proposed improvement
...
### Fix
PR/commit:
### Retest
NOT RUN / PASS / FAIL, environment, date, evidence
```

## Release gates (never automatically waived)

- A real second-account/site isolation test passes.
- Publishing and database persistence are verified with authentic backend data.
- Inventory and order creation cannot oversell under concurrent requests.
- Product variants use accurate option-specific stock/price/fulfillment.
- Merchant-specific payment accounts are onboarded correctly, with provider webhook idempotency, refunds and reconciliation.
- Provider and email integrations pass their own sandbox testing.
- Any blocker is recorded as BLOCKED rather than silently skipped.
