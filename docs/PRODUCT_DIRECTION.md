# CoBest product direction — Shopify-style ecommerce platform

**Clarified by owner: October 2026.**

## Product definition

**CoBest is a self-service ecommerce website builder for many independent merchants, comparable in workflow to Shopify.** Merchants can build and publish their own stores, sell stocked or dropshipped products, accept payments to their own merchant accounts, manage customers and orders, and fulfill deliveries. The platform must be genuinely operational, not just a visual page editor.

CoBest is **not** a single dropshipping store owned by the platform creator. Dropshipping is a supported merchant workflow, not the only merchant business model.

## First-time merchant journey (make this work before adding optional complexity)

1. **Register and create a store.** One merchant account can have multiple separately configured stores when authorized. Maintain strong cross-merchant authorization, scoped storage and safe account recovery.
2. **Choose a simple professional theme** and edit business name, colors, logo, navigation and pages. Preview desktop and mobile, save reliably, then publish a distinct storefront/URL.
3. **Add a sellable catalog.** Add products manually or import reviewed supplier CSVs; manage title, description, images, categories, SKU, optional variants, price, stock, visibility and supplier origin.
4. **Configure real operations.** Store-specific shipping rules, currency, applicable taxes, contact details, shipping/return/privacy/terms policies, domain and business settings.
5. **Connect the merchant's OWN payment account.** Stripe/PayPal onboarding must associate settlement and orders with the correct merchant. Platform subscription billing is separate from the merchant's revenue and cannot be reused as universal checkout for every store.
6. **Take a genuine order.** Trust server-calculated prices, variant-specific stock, shipping/tax and discounts; store customer/order/selected SKU; enforce concurrent stock protection, accurate provider settlement, refunds and idempotency.
7. **Fulfill and support.** Manual supplier purchase (Doba/CJ/other) is an acceptable initial option. Save the supplier order reference, shipment/tracking, customer notification and refunds/returns. Later supplier APIs are optional enhancements.
8. **Operate daily.** Dashboard, products, customers, orders, failed/unpaid orders, inventory updates, shipments, basic financial reports and exceptions.

## Supported merchant models

- Independent inventory / own physical products
- Dropshipping (supplier-sourced products with manual procurement first)
- Hybrid inventory and dropshipping

Other selling models such as bookings, subscriptions or digital downloads require their own verified workflows; do not advertise them as complete based only on templates.

## Where the owner's 17 Warhead / Doba / CJ guides fit

- **Supplier management, adding/updating products:** reviewed supplier mapping, SKU/variant updates, safe stock and price changes, no silent deletions when a feed is incomplete.
- **CJ and Doba order processing:** human-readable purchasing/fulfillment/tracking flow, supplier references, and shipping exceptions.
- **Variant hiding:** merchant-controlled visibility and per-variant stock/checkout.
- **Shipping/returns, business registration:** merchant-specific policy setup and launch checks; don't copy another merchant's terms or treat an old registration directory as authoritative legal advice.
- **Stripe/PayPal setup:** secure per-merchant payment onboarding and verified settlement; don't reproduce outdated secret-copy instructions.
- **Technician checklist:** merchant launch checks for navigation, images, taxes/shipping, forms, stock deduction, test checkout and order/email processing.
- **Three merchant appointment scripts:** progressive beginner onboarding: create site and products; configure payments/test sale; learn supplier updates/order management.

## MVP release priorities

**P0 — required for trustworthy multi-merchant commerce**
- Real authenticated two-merchant isolation with persisted data, publishing and storefront assets
- Reliable create/edit/save/publish flow and merchant-ready responsive storefront
- Atomic cart/order/inventory processing (including exact variant)
- Secure provider connection and payout ownership per merchant; verified sandbox settlement
- Policies, contact details, delivery configuration, guest/customer checkout, basic operational reporting

**P1 — operations that make dropshipping practical**
- Manual and supplier CSV product intake with safe SKU matching and history
- Supplier entities, supplier references on historical order lines, tracking and customer updates
- Basic import/fulfillment audit and merchant launch checklist

**Defer until the above passes:** sophisticated AI site creation, hundreds of themes, full supplier API automation, multi-marketplace syndication, advanced CRM or marketing suites, agency dashboards, and platform-scale analytics.

## Ground truth and safeguards

The GitHub development PR #25 contains partial implementations of these features, including basic visual building, merchant catalog/order management, supplier tagging, safe import previews, launch checks and checkout guardrails. **This is not a declaration that real multi-merchant checkout is production ready.** Test with real isolated accounts and payment provider sandboxes first.

Known blockers/issues: #27 real staging + independent tenant isolation, #28 atomic SKU imports & stock, #29 full variants, #30 correct per-merchant payments, #31 supplier fulfillment. Manual end-to-end QA begins from #26; keep human tests marked NOT RUN until confirmed.
