# CoBest Functional Requirements & Test Matrix

Source of truth for checking CoBest against the requested Warhead/Shopify-style product scope.

## Product direction

CoBest combines a business-first onboarding flow with a visual website builder, CMS/content management, ecommerce operations, and publishing. The intended product flow is:

**Discovery → Brief → Website → Content → Commerce → Publish**

## Functional status — 2026-09-26

| ID | Function | Requested behavior | Current repo status | Test status |
|---|---|---|---|---|
| F01 | Guided onboarding | Capture business, goals, audience, style, brand, content, structure and review | IMPLEMENTED | PENDING |
| F02 | Website brief | Turn onboarding answers into a structured project brief | IMPLEMENTED | PENDING |
| F03 | Responsive visual preview | Desktop / tablet / mobile preview while editing | IMPLEMENTED | PENDING |
| F04 | Visual page editor | Edit page sections visually in browser | IMPLEMENTED for core sections + custom content blocks | PENDING |
| F05 | Grid / rows / sectors | Add, resize and organize layout rows/sectors visually | PARTIAL — custom blocks support 1–4 column grids; drag/reorder is not yet implemented | PENDING |
| F06 | Block library | Add reusable image, menu, list and other content blocks | IMPLEMENTED basic text/image/list/menu blocks | PENDING |
| F07 | Precision style controls | Fine-grained layout/spacing/color controls | PARTIAL — background, text color, padding, columns, section gap and radius are editable | PENDING |
| F08 | CMS / content | Manage site content separately from layout | IMPLEMENTED basic persistent media records by hosted URL | PENDING |
| F09 | Products | Create/manage products with pricing, inventory, category and status | IMPLEMENTED with persistent database storage | PENDING |
| F10 | Categories / brands | Organize catalog by categories and brands | PARTIAL — product categories supported; dedicated category/brand management not yet built | PENDING |
| F11 | Storefront | Render active products/content as customer-facing store | IMPLEMENTED in storefront preview | PENDING |
| F12 | Cart / checkout | Add products and complete checkout | IMPLEMENTED test checkout creating real customer/order records; payment provider not connected | PENDING |
| F13 | Payments | Production payments such as Stripe/PayPal | REQUIRES EXTERNAL PAYMENT PROVIDER | BLOCKED |
| F14 | Orders | Create/manage real orders, payment state and fulfillment | IMPLEMENTED persistent manual/test orders | PENDING |
| F15 | Fulfillment / shipping | Shipping methods, rates, fulfillment and notifications | PARTIAL — fulfillment status exists; shipping/rates/notifications not connected | PENDING |
| F16 | Customers | Persistent customer profiles and purchase history | IMPLEMENTED persistent customer records linked to orders | PENDING |
| F17 | Authentication | Real signup/login/logout/session handling | IMPLEMENTED with Supabase Auth | PENDING |
| F18 | Password recovery / security | Password reset and production account security | IMPLEMENTED password recovery flow; leaked-password protection still needs provider setting review | PENDING |
| F19 | Persistent backend storage | Production database rather than browser-only localStorage | IMPLEMENTED with Supabase + RLS for CoBest data | PENDING |
| F20 | Publishing | Preview changes and publish controlled updates | PARTIAL — cloud autosave + live preview exist; draft-vs-published versioning not yet implemented | PENDING |
| F21 | Analytics | Sales/order/customer analytics | IMPLEMENTED basic analytics from persistent commerce data | PENDING |
| F22 | Marketing / discounts | Campaign and discount management | IMPLEMENTED basic persistent records | PENDING |
| F23 | SEO / site settings | Metadata, search visibility and launch settings | NOT IMPLEMENTED | BLOCKED |
| F24 | External channels | Push products to Amazon/eBay | NOT IMPLEMENTED | BLOCKED |
| F25 | Integrations | PayPal / Stripe / ShipStation-style integrations | NOT IMPLEMENTED | BLOCKED |
| F26 | Mobile usability | Core flows usable on mobile without broken navigation/layout | NEEDS LIVE TEST | PENDING |
| F27 | Production domain | Public site served on cobest.me | IMPLEMENTED | PASS |

## Production architecture now connected

- **GitHub:** `skionin123/cobestme`
- **Hosting:** Railway production service
- **Database/Auth:** Supabase
- **Account isolation:** Row Level Security using authenticated user IDs
- **Persistent tables:** workspaces, products, customers, orders, discounts, campaigns, media assets
- **API:** same-origin Railway Node API proxies authentication and authorized data access
- **Workspace saving:** onboarding/editor settings are saved to the authenticated user's cloud workspace

## Important implementation note

CoBest is now beyond the original browser-only prototype and has a functional authenticated/persistent MVP. The remaining BLOCKED items are primarily external-provider or advanced-platform features: production payments, shipping integrations, marketplace channels, SEO controls, and true draft/publish versioning.

## Function-first live test order

1. F17 Authentication
2. F01 Guided onboarding
3. F19 Persistent workspace save/reload
4. F09 Products
5. F16 Customers
6. F14 Orders
7. F04–F07 Website editor/block builder
8. F11–F12 Storefront cart/test checkout
9. F21 Analytics
10. F08 / F22 Content, campaigns and discounts
11. F26 Mobile usability

## Rule for QA

Every function is marked PASS only after the behavior is tested in the live production build. A visible screen alone is not counted as a working function.
