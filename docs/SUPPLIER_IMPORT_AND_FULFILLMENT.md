# CoBest merchant operations: products, suppliers, orders, payments

This is an implementation guide for the current **development branch**, not a claim that Doba, CJ, Stripe or PayPal are connected to live merchant accounts.

## 1. Prepare your product CSV

- Use UTF-8 CSV with a header row; download the header-only template from **Products → Supplier import preview → Download CSV template**.
- Each product needs a unique SKU. A new product must have **SKU, name and a nonnegative price**. Quantity defaults to zero and new records start as **Draft** so they are not immediately for sale.
- Existing SKUs can be updated with **SKU and price** or **SKU and inventory**. Blank columns leave existing values unchanged.
- Supported names include `SKU`, `Product Name`, `Price`, `Quantity`, `Available Stock`, `Inventory`, and product metadata. Supplier export column mappings vary; inspect them rather than assuming any live provider format.
- **Back up first.** Download both **Backup products CSV** and **Backup variants CSV** from the Products page before making supplier updates, following the separate export process in the Doba and CJ reference guides.
- Choose **Update existing SKUs** for routine Doba/CJ inventory and price files. Selecting Doba or CJ defaults to this safe mode; unknown SKUs are errors, not silent new products. Choose **Add new Draft products only** when onboarding supplier items. A third **Add new / update matching SKUs** mode is provided for deliberate mixed imports.
- Every newly imported product is **Draft** even when a CSV requests Active; review it and enable it manually before selling.
- Suppliers are selected as **Generic, Doba or CJ** before uploading. The selected source is stored as a product tag. The importer rejects a supplier mismatch, a variant SKU mistaken for a parent product, duplicate SKUs, negative prices and malformed rows.
- Supplier-related text inside the CSV tags field cannot override the selected source.
- CoBest currently imports **parent-product** CSVs, not separate variant supplier feeds. A CSV whose only identifier is `Variant SKU` must not be passed into this importer. Variant import by SKU is tracked in issue #32.
- Source export headers such as **Cost**, **Shipping Group** and supplier-specific selling-price formulas are identified as ignored/unsupported. CoBest does not automatically store those fields or apply the Warhead examples' optional 25% markup. Merchants must reconcile supplier cost, freight and selling price outside CoBest until schema/price logic is built.
- Merchants can now set **Show on store** on each product variant, adapting the `showInResults` field described in the variant hiding guide. Hiding only affects public variant visibility, **not** its presence in the catalog. Variant checkout is still blocked until proper price/stock matching is complete.
- Always inspect the entire preview. You can cancel without writing anything. A valid preview is rechecked against the latest catalog before applying.
- Imports presently save rows in sequence. An interrupted import may save **some**, not all, rows. CoBest refreshes the catalog and rebuilds the preview of remaining differences where possible. True database transaction and audit history remain development tasks.

## 2. Daily supplier operations

1. Open **Catalog → Suppliers**.
2. Review product counts, out-of-stock counts and products without a known supplier.
3. Assign the appropriate supplier to each product, or leave it unassigned when uncertain.
4. Update stock and selling prices using a reviewed CSV import. The Doba guide recommends regular (e.g. weekly) feed updates, but this is a **manual merchant task** and the exact schedule depends on the supplier. Zero stock and supplier discontinuation are different business states—do not delete products automatically.
5. Keep supplier invoices/order references in the order's internal notes until dedicated supplier-order fields and a full timeline are implemented.

**No supplier purchases, stock syncing, warehouse integration or returns authorization are performed automatically.**

## 3. Manual order fulfillment

1. Open **Sales → Orders** and filter by Unfulfilled or Processing.
2. Open an order and verify the **payment status**. The payment status field is read-only for merchants; a Stripe/PayPal provider transition is required for Paid.
3. Review the ordered product, SKU and currently linked supplier. Confirm the supplier's actual stock and your ability to dispatch.
4. Record the supplier order ID in the internal notes. Set fulfillment to Processing.
5. On dispatch, enter the carrier and tracking number and set fulfillment to Fulfilled.
6. Customer order lookup can show stored order/tracking details, but notifications depend on configured email delivery.
7. Never delete settled Paid or Refunded orders; they must remain available for reconciliation.

## 4. Payment-readiness requirements

The existence of provider code is **not** proof of a live payment service.

- Merchant checkout is disabled by default: `COBEST_ENABLE_COMMERCE_PAYMENTS` must be explicitly set to `true` before the server advertises Stripe/PayPal customer payment options.
- `STRIPE_SECRET_KEY` is used by the platform's subscription-billing implementation. A billing connection must not be mistaken for merchant-specific Stripe onboarding. A proper per-merchant payments architecture must be completed before general multi-merchant production selling.
- Stripe webhook verification requires `STRIPE_WEBHOOK_SECRET` and a matching signed provider event. A checkout return URL by itself is not payment confirmation.
- PayPal requires `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, correct `PAYPAL_ENV` and completed PayPal capture confirmation. Amount/currency and database reconciliation still need provider sandbox testing.
- `COBEST_PUBLIC_BASE_URL` must be a trustworthy HTTPS origin, e.g. `https://your-verified-domain.example`. It is used for callbacks/invitations; it is no longer derived from HTTP Host headers.
- Transactional emails need verified sender and supported email-provider configuration.
- Review refunds, shipping/tax rules and payout ownership before launch.

**Do not enable live commerce solely by setting credentials or changing the feature flag.** Merchant onboarding, database ownership, refund reconciliation, stock deduction and paid-order webhook idempotency must be verified.

## 5. Release acceptance checklist

- [ ] Two separate merchant accounts cannot read or mutate each other's sites, orders, products or published snapshots.
- [ ] Create/save/refresh/publish/mobile preview complete with actual backend data.
- [ ] Supplier CSV test: new, repeat, invalid, cross-supplier, variant collision and interrupted uploads.
- [ ] Product inventory and order creation are atomic under simultaneous purchases.
- [ ] Variant-priced/variant-stocked products have an end-to-end option-specific checkout, otherwise remain explicitly unavailable for online purchase.
- [ ] Verified provider sandbox purchases, webhooks, cancellations, refunds and retries complete without fake Paid statuses.
- [ ] Shipping, tax, customer support, policy, domain, contact form and notification checks are completed.
- [ ] The reviewed GitHub commit passes CI and staging tests before a controlled production release.

Reference practices come from the Warhead, Doba, and CJ training workflows supplied for CoBest analysis. They are examples of operational steps, not an assertion that current supplier APIs, policies or formats match those training documents.
