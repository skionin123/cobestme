# CoBest Functional Requirements & Test Matrix

Source of truth for checking CoBest against the requested Warhead/Shopify-style product scope.

## Product direction

CoBest should combine a business-first onboarding flow with a visual website builder, CMS/content management, ecommerce operations, and publishing. The intended product flow is:

**Discovery → Brief → Website → Content → Commerce → Publish**

## Functional status — 2026-09-26

| ID | Function | Requested behavior | Current repo status | Test status |
|---|---|---|---|---|
| F01 | Guided onboarding | Capture business, goals, audience, style, brand, content, structure and review | IMPLEMENTED in prototype | PENDING |
| F02 | Website brief | Turn onboarding answers into a structured project brief | IMPLEMENTED in prototype | PENDING |
| F03 | Responsive visual preview | Desktop / tablet / mobile preview while editing | IMPLEMENTED in prototype | PENDING |
| F04 | Visual page editor | Edit page sections visually in browser | PARTIAL — hero, featured products and story controls exist | PENDING |
| F05 | Grid / rows / sectors | Add, resize and organize layout rows/sectors visually | NOT IMPLEMENTED | BLOCKED |
| F06 | Block library | Add reusable image, menu, list and other content blocks | NOT IMPLEMENTED | BLOCKED |
| F07 | Precision style controls | Fine-grained CSS/layout/typography/border/background controls | NOT IMPLEMENTED | BLOCKED |
| F08 | CMS / content | Manage site content separately from layout | PARTIAL — media/content areas are placeholders | PENDING |
| F09 | Products | Create and manage products with pricing/inventory/category/media | PARTIAL — draft product creation exists; media/advanced product data missing | PENDING |
| F10 | Categories / brands | Organize catalog by categories and brands | PARTIAL — category text exists; full management missing | BLOCKED |
| F11 | Storefront | Render products/content as customer-facing store | PARTIAL — preview exists | PENDING |
| F12 | Cart / checkout | Customer can add products and complete checkout | NOT IMPLEMENTED | BLOCKED |
| F13 | Payments | Production payments such as Stripe/PayPal | NOT IMPLEMENTED | BLOCKED |
| F14 | Orders | Create/manage real orders, payment state and fulfillment | NOT IMPLEMENTED — UI empty state only | BLOCKED |
| F15 | Fulfillment / shipping | Shipping methods, rates, fulfillment and notifications | NOT IMPLEMENTED | BLOCKED |
| F16 | Customers | Persistent customer profiles and purchase history | NOT IMPLEMENTED — UI empty state only | BLOCKED |
| F17 | Authentication | Real signup/login/logout/session handling | NOT IMPLEMENTED — current login accepts any non-empty email/password | BLOCKED |
| F18 | Password recovery / security | Password reset and production account security | NOT IMPLEMENTED | BLOCKED |
| F19 | Persistent backend storage | Data stored in production database, not browser-only localStorage | NOT IMPLEMENTED | BLOCKED |
| F20 | Publishing | Preview changes and publish controlled updates to live storefront | PARTIAL / MOCKED | BLOCKED |
| F21 | Analytics | Real traffic, conversion, sales and customer analytics | NOT IMPLEMENTED — UI placeholder only | BLOCKED |
| F22 | Marketing / discounts | Campaigns and discount management | NOT IMPLEMENTED — UI placeholders only | BLOCKED |
| F23 | SEO / site settings | Metadata, search visibility and launch settings | NOT IMPLEMENTED | BLOCKED |
| F24 | External channels | Push products to Amazon/eBay | NOT IMPLEMENTED | BLOCKED |
| F25 | Integrations | PayPal / Stripe / ShipStation-style integrations | NOT IMPLEMENTED | BLOCKED |
| F26 | Mobile usability | Core flows usable on mobile without broken navigation/layout | NEEDS TEST | PENDING |
| F27 | Production domain | Public site served on cobest.me | IMPLEMENTED | PASS |

## Important implementation note

The current repository is a **front-end prototype**, not yet the complete production platform described above. Several screens exist to demonstrate the intended workflow, but many operational modules are placeholders and data is primarily persisted with browser localStorage.

## Function-first test order

1. F01 Guided onboarding
2. F02 Website brief
3. F03 Responsive preview
4. F04 Visual page editor
5. F09 Products
6. F11 Storefront
7. F26 Mobile usability

The remaining BLOCKED functions should be implemented before they can be meaningfully tested as production features.

## Rule for QA

Every function is marked PASS only after the behavior is tested in the live production build. A visible screen or placeholder is not counted as a working function.
