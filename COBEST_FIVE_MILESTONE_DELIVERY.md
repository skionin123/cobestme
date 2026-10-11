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
- [ ] Test two real accounts and two sites for isolation (read/write/publish).
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
- [ ] Make import apply atomic or resumable and server-audited. Current sequential writes can partially succeed; UI reports partial writes honestly.
- [ ] Verify imported variants and product-level versus variant-level checkout inventory.
- [ ] Add explicit supplier-product mapping and stock history.
Release gate: staging import scenarios for new, repeat, invalid, duplicate and partial-failure feeds.

## M3 — Supplier and fulfillment operations
- [ ] Add tenant-scoped suppliers, supplier SKUs and order-item source attribution with migrations.
- [ ] Build supplier profile and manual fulfillment timeline.
- [ ] Track supplier order reference, warehouse, shipping method, carrier and customer-visible tracking.
- [ ] Validate cancellation/return/refund behavior and permissions.
- [ ] Establish Doba/CJ supplier feed templates using permitted current formats, not legacy UI assumptions.
Release gate: complete manual order → supplier procurement → shipment → customer lookup journey.

## M4 — Merchant launch readiness
- [ ] Expand the current launch review and setup checklist with actionable verified statuses.
- [ ] Test forms, contact links, checkout policy, shipping/tax configuration, stock, search and mobile pages.
- [ ] Separate warnings, required launch blockers, and unavailable external providers.
- [ ] Provide user-friendly explanatory guidance derived from technician checklist.
Release gate: merchant can complete checks without mistaking missing integration for operational status.

## M5 — Verified payments
- [ ] Securely connect merchant Stripe/PayPal through supported provider process (merchant action needed).
- [ ] Ensure pay-later orders cannot be misrepresented as verified revenue.
- [ ] Test Stripe signature/webhook replay/idempotency and PayPal capture/order ownership.
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
