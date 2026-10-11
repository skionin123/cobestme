# CoBest — Five-Milestone MVP Delivery Register
Updated: 2026-10-11
Repository: skionin123/cobestme
Branch: feat/cobest-mvp-five-milestones

## Release rules
- Keep main/Railway production unchanged until checks are green and each release is reviewed.
- Preserve all existing websites, product IDs, SKUs, customers, orders, published snapshots, and tenant boundaries.
- A feature is implemented only when tested. A configured UI, mock API or empty provider adapter is not a verified live integration.
- Do not add payment-provider secrets to GitHub or browser code.
- User's Warhead/Doba/CJ operational files inform workflows, not active provider terms or guaranteed API compatibility.

## M1 — Real-account and builder reliability
- [x] Inspect deployed SHA, CI, runtime health and configured provider variable names.
- [ ] Test two real accounts and two sites for isolation (read/write/publish). (Code now rejects inaccessible/malformed selected-site headers; real account test pending.)
- [ ] Test signup, refresh, logout, password recovery and failure recovery in live staging.
- [ ] Test create → edit → save → refresh → preview → publish → draft-only edits → republish.
- [ ] Test mobile breakpoint and storefront navigation.
- [ ] Test failure recovery and persistence during interrupted saves.
Release gate: successful authenticated staging scenarios with no cross-account leaks or data loss.

## M2 — Safe product and inventory imports
- [x] Build BOM/quoted CSV parser with record limit and normalized supplier column names.
- [x] Preview SKU-based create/update/skip/error decisions before writing.
- [x] Block duplicate incoming/existing SKUs and invalid values.
- [x] Preserve omitted existing product fields; newly imported products default to Draft.
- [x] Add Doba/CJ labels and an import confirmation interface.
- [x] Add client-side stale-preview detection and recovery after interrupted sequential imports.
- [ ] Make import truly atomic and server-audited. The current sequential writes may still partially succeed; use a database transaction/RPC before production certification.
- [x] Block CSV variant-SKU collisions and prevent unhandled parent-product variant checkout at incorrect price.
- [ ] Implement real variant option selection and variant-level checkout/stock deduction (variant products cannot yet be purchased through the current public cart).
- [x] Add per-product supplier identity via existing tenant-scoped product tags, supplier overview and dedicated supplier assignment workspace.
- [ ] Add proper supplier entities, fulfillment references, product stock history and supplier contacts.
Release gate: staging import scenarios for new, repeat, invalid, duplicate and partial-failure feeds.

## M3 — Supplier and fulfillment operations
- [ ] Add tenant-scoped suppliers, supplier SKUs and order-item source attribution with migrations.
- [x] Surface identified supplier and SKU in order details; add manual Processing/Fulfilled and tracking guidance.
- [ ] Build supplier profile/contact details, order procurement IDs as separate fields and fuller fulfillment timeline.
- [ ] Track supplier order reference, warehouse, shipping method, carrier and customer-visible tracking.
- [ ] Validate cancellation/return/refund behavior and permissions.
- [ ] Establish Doba/CJ supplier feed templates using permitted current formats, not legacy UI assumptions.
Release gate: complete manual order → supplier procurement → shipment → customer lookup journey.

## M4 — Merchant launch readiness
- [x] Replace synthetic setup counts with checks derived from saved store data; distinguish external manual verifications.
- [ ] Expand server-integrated launch checks with proof of actual end-to-end behavior.
- [ ] Test forms, contact links, checkout policy, shipping/tax configuration, stock, search and mobile pages.
- [ ] Separate warnings, required launch blockers, and unavailable external providers.
- [ ] Provide user-friendly explanatory guidance derived from technician checklist.
Release gate: merchant can complete checks without mistaking missing integration for operational status.

## M5 — Verified payments
- [ ] Securely connect merchant Stripe/PayPal through supported provider process (merchant action needed).
- [x] Deny merchant order PATCH attempts to modify payment status; make payment field read-only in admin.
- [x] Only settle an order Paid on Stripe confirmed paid/async success event; add unit tests and keep signature verification.
- [x] Verify Stripe webhook raw-body signature using correct timestamp checking and multiple rotated v1 signatures.
- [x] Validate completed PayPal capture responses and set an idempotency header on capture requests.
- [x] Keep platform subscription billing and merchant checkout readiness separate; merchant checkout is opt-in.
- [x] Require a trusted HTTPS COBEST_PUBLIC_BASE_URL for payment and invitation redirects.
- [x] Reject attempts to delete Paid or Refunded orders through merchant resource routes.
- [ ] Verify replay/idempotency, refunds and PayPal order/amount ownership with real sandbox and database tests.
- [ ] Reconcile payments, order status, stock reservations/deductions, refunds and error paths.
- [ ] Test Stripe/PayPal sandbox before considering live activation.
Release gate: provider-configured authenticated sandbox passes reconciliation and negative-case tests.

## Known dependencies
- Railway currently has SUPABASE_URL, SUPABASE_ANON_KEY and COBEST_INTERNAL_SECRET, but no payment-provider or outbound-email keys.
- Real staging database/accounts and payment-provider sandboxes require external verification and access.
- Do not merge unfinished provider flows or change active production configuration.

## Notes
Development branch starts from production SHA af8e9e4d1e71645a24f8c665866554de663b8923.
The first branch commits address M2's product-import preview and tests; other unchecked entries remain pending.

## Current development notes (2026-10-11)
- PR #25 remains draft and must not be merged before end-to-end and user-account checks.
- Supplier assignment is stored in product metadata, not a dedicated suppliers table.
- Full product-variant checkout is intentionally blocked to avoid charging the parent product price; implement a complete variant-safe flow before enabling that catalog scenario.
- Provider payment credentials are not configured on Railway. Real sales and provider settlement have not been verified.
- Current import applies verified rows sequentially with resumable recovery; cross-request database atomicity and audit history are still pending.
- CI verifies code and mock browser flows but does not certify real Supabase multi-tenant operations.

## Additional improvements delivered in development (2026-10-12)

- [x] Consolidate duplicate cart item rows before checking inventory; reject quantities exceeding the per-product limit.
- [x] Make the public storefront label unhandled variant products as "View options" and display their specific price/stock instead of promising checkout.
- [x] Clarify redirect messaging: a return from Stripe does not mean the server has settled a payment.
- [x] Provide a header-only CSV template and safer row/header-format checks.
- [x] Ignore forged supplier tags inside imported CSVs; preserve owner-managed source attribution.
- [x] Add fulfillment filters, unpaid warnings, and preserve Paid/Refunded orders for reconciliation.
- [x] Add merchant instructions in `docs/SUPPLIER_IMPORT_AND_FULFILLMENT.md`.
- [ ] Database-backed atomic SKU updates, per-SKU reservations, supplier tables, detailed fulfillment events and real provider-account verification remain **release blockers**.

**Commerce configuration caveat:** `COBEST_ENABLE_COMMERCE_PAYMENTS` is disabled by default. It is a deliberate safeguard, **not** a replacement for per-merchant payment onboarding or a live gateway certification. `COBEST_PUBLIC_BASE_URL` is now required before provider redirects and team-invite email links can be created.
