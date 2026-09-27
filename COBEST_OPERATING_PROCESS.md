# CoBest Operating Process

Updated: 2026-09-28

This is the source of truth for how a CoBest store should be created, configured, launched, and operated.

External providers that are not yet activated (payments, email delivery, shipping APIs, marketplaces, creative-platform APIs) are intentionally excluded from this workflow. The focus is the complete internal CoBest process.

## Core lifecycle

**Discover → Theme → Pages → Navigation → Catalog → Content → Settings → Publish → Operate**

## Phase 1 — Business direction

### Goal
Capture enough business context that the website and store have a clear purpose before visual work starts.

### Process
1. Create or log into a CoBest account.
2. Complete guided onboarding.
3. Define business name, industry, website type, audience, goals, differentiator, visual direction, brand colors, typography direction, required pages, required functions, content readiness, and launch target.
4. Review the generated Website Brief.
5. Return to Store Setup if information needs to be changed.

### Complete when
- Business name exists.
- Website type exists.
- Website brief can be reviewed.
- Initial page/function requirements are present.

## Phase 2 — Theme

### Goal
Choose the visual starting point before fine-grained editing.

### Process
1. Open **Online store → Themes**.
2. Review the current theme.
3. Browse the theme library.
4. Select a theme preset.
5. Open **Customize current theme**.
6. Adjust colors, typography, section spacing, radius, and section-specific content.

### Current built-in themes
- Aurelia
- Mono
- Atelier
- Studio
- Market
- Editorial

### Complete when
- One theme is selected.
- Desktop/tablet/mobile preview can be opened.

## Phase 3 — Pages

### Goal
Create the site structure before content production expands.

### Process
1. Open **Online store → Overview & pages**.
2. Add required pages.
3. Reorder pages.
4. Hide pages that are not ready.
5. Open each page in the Website Editor.
6. Add the page title, body, SEO title, SEO description, and sections.
7. Save changes.

### Complete when
- Home exists.
- Required customer-facing pages exist.
- Visibility for each page is intentional.

## Phase 4 — Navigation

### Goal
Make customer movement through the site intentional.

### Process
1. Open **Online store → Navigation**.
2. Build the Main menu from existing pages.
3. Reorder items.
4. Remove irrelevant items.
5. Build the Footer menu.
6. Preview the storefront and test navigation.

### Complete when
- Main menu contains at least one customer-facing destination.
- Footer menu has the intended support/content links.

## Phase 5 — Catalog

### Goal
Create a clean sellable catalog.

### Product process
1. Open Products.
2. Create or import products.
3. Add title and description.
4. Add price and optional compare-at price.
5. Add inventory.
6. Add category, brand, SKU, tags.
7. Upload/select product images.
8. Add variants when needed.
9. Set Draft / Active / Archived state.
10. Save.
11. Test search/filter.

### Catalog organization
1. Create Categories & Brands.
2. Create Collections.
3. Assign products to collections.
4. Confirm active products appear in storefront preview.

### Complete when
- At least one Active product exists for a commerce store.
- Product metadata is complete enough for customers to understand the item.
- Product organization is intentional.

## Phase 6 — Content

### Goal
Prepare reusable customer-facing assets and editorial content.

### Process
1. Upload images/files to Media.
2. Build blog posts if needed.
3. Use media in products and website sections.
4. Confirm Contact, Booking, Newsletter, Reviews, Gallery, or Blog experiences required by onboarding are represented in the site.
5. Review Inbox for incoming customer activity after launch.

### Complete when
- Required media/content is available.
- Required content experiences are represented on the published site.

## Phase 7 — Store settings

### Goal
Complete the business rules the storefront needs before launch.

### Process
1. Open Settings.
2. Set store slug.
3. Set contact email.
4. Set currency and timezone.
5. Set flat shipping default when used.
6. Set tax rate default when used.
7. Set default SEO title/description.
8. Add Privacy Policy.
9. Add Terms.
10. Add Refund Policy.
11. Preview again.

### Complete when
- Required public settings are present.
- Policies are present.
- Store URL is defined.

## Phase 8 — Publish

### Goal
Release an approved snapshot instead of exposing unfinished edits.

### Process
1. Preview the store.
2. Check desktop/tablet/mobile.
3. Check main/footer navigation.
4. Check product pages/cart.
5. Check required forms/content.
6. Open Settings.
7. Click Publish Store / Publish Updates.
8. Open the live public store route.
9. Confirm the public version matches the approved draft.

### Complete when
- Workspace is marked Published.
- Public route loads successfully.
- No critical navigation/content errors are present.

## Phase 9 — Operate

### Orders
1. New orders appear in Orders.
2. Review customer and line items.
3. Review payment state.
4. Update fulfillment state.
5. Add carrier/tracking when applicable.
6. Add internal notes.
7. Print order details when needed.

### Customers
1. Review customer profiles.
2. Review order history.
3. Maintain tags.
4. Maintain marketing consent.
5. Correct contact details when needed.

### Inbox
1. Review contact messages.
2. Review newsletter subscribers.
3. Review bookings.
4. Moderate product reviews.

### Analytics
1. Review sales.
2. Review orders.
3. Review store views.
4. Review conversion.
5. Review add-to-cart activity.
6. Review top products.
7. Use results to improve products/content/store layout.

## Ongoing improvement loop

**Observe → Identify friction → Edit draft → Preview → Publish update → Measure**

Do not edit the public version directly. Make controlled draft changes, preview them, then publish an approved update.

## CoBest workspace navigation

### Primary
- Home
- Setup & workflow
- Orders
- Products
- Categories & brands
- Collections
- Customers

### Online store
- Overview & pages
- Themes
- Navigation
- Website editor
- Preview store

### Content
- Media
- Blog
- Website brief
- Inbox

### Growth
- Analytics
- Marketing
- Discounts

### Workspace
- Sites
- Team

### Utility
- Settings
- Help
- Store setup
- Sign out

## Deferred external activation

These should not block internal CoBest process testing:

- Stripe
- PayPal
- Resend
- ShipStation
- Amazon
- eBay
- Adobe

They remain separate integration activation work.
