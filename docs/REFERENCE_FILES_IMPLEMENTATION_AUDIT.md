# CoBest — 17-file implementation audit and Shopify-style MVP scope

**Date:** 2026-10-15 · **Scope:** The 17 owner-provided Warhead/Web Support Center documents and workbooks, compared against CoBest draft PR #25.

**Status definitions**  
**Implemented on development branch** = code exists, not deployed; **Partial** = foundational flow only; **Backlog** = not implemented; **Reference only** = merchant-specific/legal/old third-party instruction should not be copied into the platform.

CoBest is a **multi-merchant ecommerce platform**, not a single dropshipping store. The intent is that each merchant can launch their own independent shop, list products, take payments into their own merchant account, and fulfill orders from own stock or outside suppliers.

| # | Source file | What the file actually covers | CoBest status and exact action |
|---|---|---|---|
| 1 | **Adding Products in Inventory.docx** | Doba search/select → Inventory List → Product List CSV download; includes a third-party email-to-formatter process | **Partial.** Reviewed catalog CSV import and Draft product creation. Do not require emailing feeds to a specific Warhead service. Source-native feed mapping remains #32. |
| 2 | **Business Registration.xlsx** | US state tax/registration agency phone numbers and client-specific reference links, plus Canada entry | **Reference only.** Merchant onboarding can ask for jurisdiction and registration where applicable, but do not embed outdated state numbers or present this as global legal advice. |
| 3 | **Checklist Warhead Technician.xlsx** | Training, categories/products, discounts, payment setup, shipping and comprehensive technician/merchant handoff checks | **Partial.** CoBest launch checklist, manual QA runbook #26. Provider validation, receipt/email, shipping/taxes and real end-to-end launch tests still needed #27/#30. |
| 4 | **Doba Product Update - Warhead Guide.docx** | Doba Inventory & Price feed; update existing SKU, backup Products and Variants, update price/cost/qty/shipping-group; recommended weekly cadence in guide | **Partial.** Explicit update-only mode, CSV backups, SKU preview, zero-stock handling explanation. Missing schema for cost/shipping group, automatic schedule and variant feed update #32. Do not force the guide's optional 25% markup. |
| 5 | **How to Guide Supplier Management.pdf** | Supplier diligence/discovery, buyer responsibility, registration and reseller documents (US-specific assumptions) | **Partial.** Manual supplier assignment and inventory overview. Detailed supplier profiles/due diligence/contacts and merchant-specific compliance remain #31. Do not blindly require US documents of all merchants. |
| 6 | **How to Hide Variants on the Site.pdf** | Export Variants, transform CSV, update by SKU, use `Show In Results → showInResults` | **Implemented in development for manual flag/display**, not for bulk variant update. Admin can mark each variant shown/hidden; public product details omit hidden options. Batch variant SKU import remains #32. |
| 7 | **How to Process an Order in CJ Dropshipping.docx** | Payment/order notification → Processing → locate product by SKU/name → place supplier order with customer destination → mark Shipped, tracking and customer-visible note → Completed | **Partial.** CoBest order supplier display, manual Processing/Fulfilled/tracking and notes; supplier procurement and messaging aren't automated. Full historical shipment timeline/notifications #31. |
| 8 | **How to Process an Order in Doba.docx** | Pending → Processing → supplier lookup by SKU → customer shipping/billing address → purchase → shipped tracking note and completed status | **Partial**, same manual fulfillment foundation. Supplier identity must be stored on order line **at purchase time** before production rollout #31. |
| 9 | **NEW STRIPE LINKING PROCESS.docx** | Merchant Stripe account checks, publishable/restricted API key workflow for Warhead | **Reference only / Partial.** Secure provider-verified settlement safeguards exist; CoBest needs its **own proper per-merchant connection** and must never ask users to paste secret keys into plain text. #30. |
| 10 | **Paypal Extended (Apple Pay_Google Pay).docx** | PayPal app/client credentials, merchant ID, eligibility, Apple Pay domain verification | **Backlog integration.** Basic guarded PayPal checkout code exists but not merchant-specific onboarded; Apple Pay/Google Pay/domain verification are **not implemented**. #30. |
| 11 | **Script Reference 1st Appointment.docx** | Dashboard/navigation, creating categories and products, storefront basics and first-session training | **Partial.** Initial merchant onboarding, catalog and editor support; add progressive self-guided lessons/docs, no Warhead-specific script. #26. |
| 12 | **Shipping Returns Combined of CJ and DOBA.docx** | A **specific retailer's** shipping/return/refund rules, evidence requirements and after-sales timing | **Reference only.** CoBest must require each merchant to author/review policies and agree supplier/jurisdiction obligations. Do not copy Bedding Bargain Shop's name, timelines or terms as universal CoBest policies. |
| 13 | **Stripe Payment Module Activation.docx** | Verification of Stripe merchant details, bank/tax details, API key install into Warhead | **Partial / not live.** Payment-state safeguards exist; secure account onboarding, payouts and provider sandbox testing must be finished. Legacy instructions for copying live keys are not platform design. #30. |
| 14 | **Third Appointment Script.docx** | Supplier CSV refresh and website completion/revisions/signoff training | **Partial.** Product import workflow and QA tracker. Merchant publish checklist and ongoing supplier feed scheduling/updates need development and testing. #26/#32. |
| 15 | **Updating Products For CJ.docx** | Category-generated CJ feed, export Products and Variants backups, SKU-matched update of both types, cost/quantity/shipping group/price incl. shipping | **Partial.** Separate backups and SKU-matched product updates; **variant feed updates are still missing**, as are cost/shipping group. #32. |
| 16 | **Updating Products for Doba.docx** | Doba inventory and price CSV, update existing SKUs, optional OOS handling, 25% example markup, separate Product/Variant updates and backups | **Partial.** Update-only mode and preview, no auto-deleting OOS. No universal 25% markup or automatic deactivation. #32. |
| 17 | **_Warhead Training 2nd Appointment Script.docx** | Discounts (price, percentage, buy/get, free shipping), promo codes, customer accounts/guest purchase and processing orders | **Partial.** Basic discounts and orders exist; richer discount types, free-shipping promos, policy-aware fulfillment and guest/user end-to-end testing remain. Add backlog issue when feature specifics are confirmed via manual test. #26/#31. |

## Changes implemented in the current CoBest development branch as a result of this review

- **Product importer now has explicit modes:** Update existing by SKU, Add new Draft products only, or Add/update. Selecting Doba/CJ defaults to update-only. Unknown SKUs must be handled deliberately rather than automatically created.
- **Backups before imports:** export both product and variant CSVs; backed-up variant CSV includes parent SKU/name, variant SKU, title, option, price and inventory.
- **Safety and transparency:** new supplier products remain Draft even if the CSV claims Active; ignored headers and unsupported business fields (e.g. cost, shipping group, custom calculated price) are identified in the preview. A CSV import does not delete absent products.
- **Visibility for variations:** merchant can hide/show a variant using `showInResults`; old variants without that field remain visible. This is **display only** and not evidence that variant checkout is complete.
- **Tests:** new unit tests for supplier import modes, Draft defaults, ignored field warnings and variant visibility; GitHub CI determines whether these changes pass.

## High-priority engineering and rollout gaps

1. **#27** Real staging environment and two independent merchant accounts.
2. **#28** Transactional imports/stock and safe concurrent checkout.
3. **#29** Full option-specific variant checkout.
4. **#30** Provider-connected multi-merchant payments, refunds and payouts.
5. **#31** Supplier profiles, procurement, historic order-line supplier mapping and events.
6. **#32** Cost/shipping group/profit model and separate SKU-matched variant supplier feeds.

## CoBest product decisions — adapted, not copied from sources

- All merchants own their own shop setup, catalog, payment accounts, customers, orders and shipping policies.
- CoBest's default should prioritize **manual product add → storefront → verified payment → manual fulfillment**, with supplier imports as a useful optional tool.
- Dropshipping merchants can start with manual Doba/CJ supplier fulfillment. The files do **not** prove any current provider API integration exists.
- Never hardcode another merchant's return policy, an obsolete government directory, an external Warhead spreadsheet formatter, a 25% markup, or any live payment secret workflow.
- Merchant/customer personal data and supplier credentials must not be included in test fixtures or GitHub issues.

## What has not been demonstrated

All items in this audit are based on the actual reference file instructions and current development code. **No real Doba/CJ account, multi-tenant staging database or Stripe/PayPal merchant sandbox has been exercised in this review.** The deployment under https://cobest.me remains unchanged; PR #25 must be tested before release. Human QA starts with master issue #26 and remains NOT RUN until the owner completes the first test.
