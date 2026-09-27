# CoBest Complete Feature Gap Audit

Audit date: 2026-09-27  
Basis: current `main` branch, Railway production architecture, Supabase schema, and the requested Warhead/Shopify-style direction.

## Status legend

- **IMPLEMENTED** — real code/data path exists; still requires live QA before marking production PASS.
- **PARTIAL** — some useful behavior exists but the feature is not complete.
- **NO-OP / UI ONLY** — visible control exists but does not perform the promised action.
- **MISSING** — feature is not implemented.
- **EXTERNAL INTEGRATION NEEDED** — requires a third-party provider and application integration.

## 1. Accounts & authentication

| Feature | Status | Current reality / gap |
|---|---|---|
| Sign up | IMPLEMENTED | Supabase email/password signup through same-origin API. |
| Log in | IMPLEMENTED | Supabase password login. |
| Log out | IMPLEMENTED | Local access/refresh tokens cleared. |
| Protected workspace | IMPLEMENTED | App/onboarding is redirected away when no token exists. |
| Forgot password request | PARTIAL | Recovery email request exists. |
| Complete password reset | MISSING | No recovery callback/update-password screen exists. |
| Session refresh | MISSING | Refresh token is stored but never used; expired access tokens are not automatically refreshed. |
| Account/profile settings | MISSING | No real user profile/account management UI. |
| Email verification UX | PARTIAL | Signup can require confirmation, but there is no dedicated verification/resend/status experience. |
| Social login | MISSING | Google/Apple/etc. not implemented. |
| MFA | MISSING | No multi-factor authentication UI. |
| Leaked-password protection | MISSING/CONFIG | Supabase advisor reports leaked-password protection disabled. |

## 2. Business onboarding & project brief

| Feature | Status | Current reality / gap |
|---|---|---|
| Business details | IMPLEMENTED | Name, industry, description, location, website type. |
| Goals | IMPLEMENTED | Multi-select goals + primary action. |
| Audience | IMPLEMENTED | Audience + differentiator. |
| Visual direction | IMPLEMENTED | Style/personality selection. |
| Brand colors | IMPLEMENTED | Primary/secondary/accent. |
| Typography direction | IMPLEMENTED | Preset direction only. |
| Inspiration/avoidance | IMPLEMENTED | Text/URL fields. |
| Content readiness | IMPLEMENTED | Asset checklist. |
| Pages/features planning | IMPLEMENTED | Suggested structure can be applied. |
| Website brief | IMPLEMENTED | Generated from onboarding. |
| Export brief | PARTIAL | Browser print only; no dedicated PDF/export/share workflow. |
| Validation / required fields | PARTIAL | Users can proceed with many important fields blank. |
| Re-enter/edit onboarding later | PARTIAL | Store setup reopens onboarding, but no dedicated settings editor. |

## 3. Feature-selection promises vs actual modules

Onboarding currently lets users request these features. Several are not actually available after selection.

| Onboarding feature | Status in product |
|---|---|
| Ecommerce | PARTIAL |
| Shopping cart | PARTIAL |
| Product search | NO-OP / UI ONLY |
| Product filters | NO-OP / UI ONLY |
| Newsletter | NO-OP / UI ONLY |
| Contact forms | MISSING |
| Reviews | MISSING |
| Customer accounts | MISSING |
| Booking | MISSING |
| Gallery | PARTIAL — image blocks exist, no real gallery component |

**Critical gap:** selected onboarding features do not drive feature provisioning or page generation.

## 4. Website builder / Warhead-style editor

| Feature | Status | Current reality / gap |
|---|---|---|
| Browser visual editor | IMPLEMENTED | Editor renders storefront preview. |
| Desktop/tablet/mobile preview | IMPLEMENTED | Device-width controls exist. |
| Hero editing | IMPLEMENTED | Eyebrow, heading, body, button label, alignment. |
| Featured-products editing | IMPLEMENTED | Heading + 2/3/4 columns. |
| Story editing | IMPLEMENTED | Heading/body. |
| Reusable blocks | PARTIAL | Text, image URL, list, menu blocks. |
| Column grid | PARTIAL | 1–4 equal columns only. |
| Background/text color | IMPLEMENTED for custom blocks | |
| Padding controls | IMPLEMENTED for custom blocks | |
| Global section gap/radius | IMPLEMENTED | |
| Header editor | MISSING | Header appears in section list but has no settings. |
| Newsletter editor | MISSING | Appears in list but no settings. |
| Footer editor | MISSING | Appears in list but no settings. |
| Drag/reorder sections | NO-OP / UI ONLY | Drag handle is decorative; no drag/drop implementation. |
| Resize rows/sectors | MISSING | Warhead-style resize handles/grid sectors are absent. |
| Add/remove rows | MISSING | Custom blocks are appended only. |
| Arbitrary sector layout | MISSING | No visual sector sizing or CSS grid span controls. |
| Precision CSS editor | PARTIAL | A few controlled values only; no margins, font sizes, borders, widths, typography, etc. |
| Undo/redo | MISSING | |
| Revision history | MISSING | |
| Draft autosave | PARTIAL | Cloud workspace autosave exists after auth; no revisions. |
| Publish button | MISSING | Save is not a publish workflow. |
| Preview draft vs live | PARTIAL | Internal preview exists, but there is no separate published version. |
| Multi-page visual editing | MISSING | Editor is effectively always Home; page picker is not functional. |
| Page-specific content | MISSING | Newly added page names do not create independent page content. |
| Page reorder | MISSING | |
| Page delete | MISSING | |
| Page visibility toggle | MISSING | |
| Page SEO fields | MISSING | |
| Theme library | MISSING | Only hard-coded “Aurelia” presentation exists. |
| Custom fonts | MISSING | |
| Adobe Creative Cloud integration | MISSING | Requested Warhead-style connection is not implemented. |

## 5. Publishing, domains & tenant websites

| Feature | Status | Current reality / gap |
|---|---|---|
| CoBest platform on cobest.me | IMPLEMENTED | Platform is live on Railway/Cloudflare. |
| Internal storefront preview | IMPLEMENTED | View Store shows an in-app preview. |
| Real public customer storefront | **MISSING** | There is no public route/site for a merchant's customers. |
| Draft vs published website | MISSING | |
| Publish/unpublish | MISSING | |
| Per-store subdomain | MISSING | e.g. store.cobest.me / merchant slug. |
| Custom domain per merchant | MISSING | Current cobest.me domain is the platform itself, not merchant-domain management. |
| Domain verification UI | MISSING | |
| SSL provisioning UI | MISSING | |
| Redirect management | MISSING | |
| Multi-site ownership | MISSING | `workspaces.user_id` is unique, so architecture currently permits only one CoBest workspace per user. |

**Critical gap:** this is currently a site-builder/admin prototype with preview, not yet a true website publishing platform.

## 6. CMS & media

| Feature | Status | Current reality / gap |
|---|---|---|
| Persistent media records | IMPLEMENTED | Name/URL/type stored. |
| Direct file/image upload | MISSING | User must paste an externally hosted URL. |
| Supabase Storage bucket | MISSING | |
| Image picker inside editor | MISSING | |
| Image optimization/transforms | MISSING | |
| Asset folders/tags | MISSING | |
| CMS collections | MISSING | |
| Blog posts | MISSING | “Blog” can be selected as a page only. |
| Rich text editor | MISSING | |
| Reusable content entries | MISSING | |
| Scheduled publishing | MISSING | |

## 7. Product catalog

| Feature | Status | Current reality / gap |
|---|---|---|
| Create product | IMPLEMENTED | Name, price, inventory, category, status. |
| Persistent products | IMPLEMENTED | Supabase-backed. |
| Active/draft/archive status | IMPLEMENTED | |
| Product search box | **NO-OP / UI ONLY** | Input does not filter product list. |
| “All products” filter | **NO-OP / UI ONLY** | Button has no action. |
| Edit product | MISSING | API supports PATCH, UI does not. |
| Delete product | MISSING | API supports DELETE, UI does not. |
| Product detail screen | MISSING | |
| Product description UI | MISSING | DB column exists but form does not expose it. |
| SKU UI | MISSING | DB column exists but form does not expose it. |
| Brand UI | MISSING | DB column exists but form does not expose it. |
| Product image UI/upload | MISSING | DB image URL exists, no product image workflow. |
| Categories manager | MISSING | Free-text category only. |
| Brands manager | MISSING | |
| Collections | MISSING | |
| Variants/options | MISSING | Size/color/etc. |
| Multiple images | MISSING | |
| Compare-at price / sale price | MISSING | |
| Taxes | MISSING | |
| Weight/shipping fields | MISSING | |
| Inventory movement/history | MISSING | |
| Automatic inventory decrement | MISSING | |
| Bulk import/export CSV | MISSING | |
| Bulk actions | MISSING | |

## 8. Storefront shopping experience

| Feature | Status | Current reality / gap |
|---|---|---|
| Render active products | IMPLEMENTED | |
| Add to cart | IMPLEMENTED basic | Each click appends product. |
| Cart count/total | IMPLEMENTED basic | |
| Cart drawer/page | MISSING | |
| Change quantity | MISSING | |
| Remove item | MISSING | |
| Persist cart | MISSING | Cart disappears on page reload/navigation. |
| Product detail page | MISSING | |
| Product search | MISSING | Store search icon is decorative. |
| Product filters | MISSING | |
| Store navigation | **NO-OP / UI ONLY** | Shop/About/Journal are text spans, not navigation. |
| Hero CTA | **NO-OP / UI ONLY** | Button label can be edited, but button performs no action. |
| Newsletter signup | **NO-OP / UI ONLY** | Join button performs no action. |
| Customer-facing login/account | MISSING | |
| Reviews | MISSING | |
| Wishlist | MISSING | |
| Related products | MISSING | |
| Policies pages | MISSING | |
| Contact page/form | MISSING | |
| Accessibility audit | NOT TESTED | |

## 9. Checkout & payments

| Feature | Status | Current reality / gap |
|---|---|---|
| Test checkout modal | IMPLEMENTED | Creates persistent customer/order record. |
| Real payment capture | EXTERNAL INTEGRATION NEEDED | Stripe/PayPal not connected. |
| Billing address | MISSING | |
| Shipping address | MISSING | |
| Shipping rates | MISSING | |
| Tax calculation | MISSING | |
| Discount code application | MISSING | Discounts are stored but checkout ignores them. |
| Payment success/failure webhooks | MISSING | |
| Order confirmation email | MISSING | |
| Checkout receipt | MISSING | |
| Refund workflow | MISSING | |
| Abandoned carts | MISSING | |

## 10. Orders & fulfillment

| Feature | Status | Current reality / gap |
|---|---|---|
| Create manual/test order | IMPLEMENTED | |
| Store order persistently | IMPLEMENTED | |
| Payment status field | IMPLEMENTED | Manual only. |
| Fulfillment status field | IMPLEMENTED | Manual only at creation. |
| Order list | IMPLEMENTED | |
| Order detail | MISSING | |
| Edit order/status after creation | MISSING | API supports PATCH; UI does not. |
| Cancel order action | MISSING | |
| Refund action | MISSING | |
| Fulfill/ship action | MISSING | |
| Tracking number | MISSING | |
| Packing slip/invoice | MISSING | |
| Shipping provider | EXTERNAL INTEGRATION NEEDED | ShipStation-style integration absent. |
| Customer notifications | MISSING | |

## 11. Customers

| Feature | Status | Current reality / gap |
|---|---|---|
| Create customer | IMPLEMENTED | |
| Persistent customer record | IMPLEMENTED | |
| Order count | IMPLEMENTED | |
| Customer detail/profile | MISSING | |
| Full purchase history view | MISSING | |
| Edit customer | MISSING | API supports PATCH; UI does not. |
| Delete customer | MISSING | API supports DELETE; UI does not. |
| Tags/segments | MISSING | |
| Marketing consent | MISSING | |
| Customer storefront account | MISSING | |

## 12. Discounts & marketing

| Feature | Status | Current reality / gap |
|---|---|---|
| Create discount record | IMPLEMENTED | |
| Percent/fixed discount storage | IMPLEMENTED | |
| Apply discount at checkout | MISSING | |
| Usage limits | MISSING | |
| Expiry dates | MISSING | |
| Minimum spend | MISSING | |
| Product/category targeting | MISSING | |
| Create campaign record | IMPLEMENTED | |
| Campaign scheduling | MISSING | Status field only. |
| Send email campaign | EXTERNAL INTEGRATION NEEDED | |
| Marketing automation | MISSING | |
| Newsletter subscriber storage | MISSING | |
| Social publishing | MISSING | |

## 13. Analytics

| Feature | Status | Current reality / gap |
|---|---|---|
| Sales total | IMPLEMENTED basic | Calculated from Paid orders. |
| Order count | IMPLEMENTED basic | |
| Average order | IMPLEMENTED basic | |
| Customer count | IMPLEMENTED basic | |
| Traffic tracking | MISSING | |
| Conversion rate | MISSING | Dashboard displays placeholder “—”. |
| Product performance | MISSING | |
| Funnel analytics | MISSING | |
| Date filters | MISSING | |
| Charts/trends | MISSING | |
| Export reports | MISSING | |
| Advanced analytics | MISSING | Despite Growth plan marketing copy. |

## 14. Settings, teams & plans

| Feature | Status | Current reality / gap |
|---|---|---|
| Settings screen | PARTIAL | Displays mode/domain/site name and navigation only. |
| Store settings | MISSING | Currency, timezone, addresses, policies, taxes etc. |
| User account settings | MISSING | |
| Team members | MISSING | Growth plan advertises Team access but none exists. |
| Roles/permissions | MISSING | |
| Invitations | MISSING | |
| Activity/audit log | MISSING | |
| Free/Launch/Growth billing | MISSING | Pricing is marketing copy only. |
| Subscription checkout | MISSING | |
| Plan enforcement | MISSING | No entitlements/limits are enforced. |
| Usage limits | MISSING | |

## 15. Integrations promised by Warhead/Shopify direction

| Integration | Status |
|---|---|
| Stripe | MISSING |
| PayPal | MISSING |
| ShipStation | MISSING |
| Amazon product/channel push | MISSING |
| eBay product/channel push | MISSING |
| Adobe Creative Cloud | MISSING |
| Transactional email provider | MISSING |
| Analytics provider | MISSING |

## 16. Reliability, security & production engineering

| Feature | Status | Current reality / gap |
|---|---|---|
| Error boundary | IMPLEMENTED | Shows recovery UI instead of frozen app. |
| Railway deployment | IMPLEMENTED | |
| Supabase RLS for CoBest tables | IMPLEMENTED | |
| CRUD API update/delete | IMPLEMENTED backend | UI does not use most update/delete routes. |
| Token refresh | MISSING | Important before production. |
| Rate limiting | MISSING | |
| CSRF strategy | NOT DOCUMENTED | API uses bearer token; needs production review. |
| Input validation/sanitization | PARTIAL | Mostly client-side/basic checks. |
| Structured server logging | MISSING | |
| Error monitoring | MISSING | |
| Automated tests | MISSING | No test framework/scripts in package.json. |
| End-to-end tests | MISSING | |
| CI checks before deploy | MISSING | |
| Backups/recovery UX | MISSING | Supabase platform capabilities are not surfaced/configured here. |
| Security advisor | NEEDS REVIEW | Supabase also reports unrelated existing SECURITY DEFINER warnings and leaked-password protection disabled. |

## 17. Buttons / controls currently known to be non-functional or misleading

1. Product **Search** input — does not filter.
2. Product **All products** filter button — no action.
3. Storefront top **Search** icon — no action.
4. Storefront **Shop / About / Journal** — not links.
5. Storefront hero CTA — no action.
6. Storefront newsletter **Join** — no action.
7. Editor drag handles — no drag/reorder behavior.
8. Header/Newsletter/Footer section entries — selectable but no editing controls.
9. Page pencil — opens generic Home editor; it does not edit the selected page.
10. Pricing plan buttons all route into the same signup flow; no billing/plan selection.
11. “Custom domain” / “Growth” entitlements on pricing page are not implemented.
12. Header search in the admin currently routes to Products rather than performing a global search.

## Highest-priority gaps before calling CoBest “full function”

### P0 — Core platform truth
1. Real merchant storefront/public publishing route.
2. Draft vs published state + Publish workflow.
3. Multi-page editing with page-specific content.
4. Fix every NO-OP control.
5. Product edit/delete/detail + images/variants.
6. Complete cart + checkout experience.
7. Real payments.
8. Order detail/status/fulfillment actions.
9. Customer detail/edit/history.
10. Token refresh + complete password reset.

### P1 — Warhead-level website builder
11. Drag/reorder sections.
12. Real rows/sectors/grid resizing.
13. Header/footer/newsletter editing.
14. Rich block library.
15. More complete precision style controls.
16. Undo/redo/version history.
17. Direct media upload and asset picker.

### P1 — Shopify-level commerce
18. Categories/collections/brands.
19. Discounts enforced at checkout.
20. Shipping/taxes.
21. Transactional emails.
22. Storefront search/filter.
23. Customer accounts.
24. Product detail pages.
25. Real analytics.

### P2 — Platform/business
26. Multi-site architecture.
27. Custom merchant domains.
28. Team access/roles.
29. Billing/subscriptions/plan enforcement.
30. SEO controls.
31. Marketing delivery/automation.
32. Amazon/eBay channels.
33. Adobe Creative Cloud.
34. ShipStation/other fulfillment integrations.
35. Automated tests/CI/error monitoring.

## Overall conclusion

CoBest now has a functioning **authenticated admin MVP and visual prototype**, but it is **not yet a full Warhead + Shopify replacement**.

The largest architectural gap is publishing: merchants can build and preview a storefront, but there is not yet a separate public merchant website that customers can browse and purchase from. Commerce records are persistent, but the shopping, payment, fulfillment, customer-account, and publishing layers still need to be completed.
