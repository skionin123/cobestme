# CoBest Backend Setup

## Production stack

- Frontend/API host: Railway
- Database/Auth: Supabase
- Public domain: https://cobest.me
- Repository: skionin123/cobestme

## Railway variables

The production service expects these variable names:

- SUPABASE_URL
- SUPABASE_ANON_KEY

Values are configured in Railway and should not be committed to GitHub.

## Supabase tables

CoBest now uses these persistent tables:

- workspaces
- products
- customers
- orders
- discounts
- campaigns
- media_assets

All CoBest tables have Row Level Security enabled and are restricted to the signed-in user's `auth.uid()`.

## Authentication

The Railway Node server exposes same-origin API routes that proxy Supabase Auth:

- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/reset
- GET /api/me

## Persistent app data

- GET /api/workspace
- PUT /api/workspace
- GET /api/data/:resource
- POST /api/data/:resource
- PATCH /api/data/:resource/:id
- DELETE /api/data/:resource/:id

Supported data resources:

- products
- customers
- orders
- discounts
- campaigns
- media_assets

## Current production limitations

The internal functional MVP is connected, but external-provider features still need dedicated production integrations:

- Stripe/PayPal payment capture
- Shipping/rate/fulfillment provider
- Transactional email provider
- Direct file uploads/storage bucket UI
- Amazon/eBay channel publishing
- Advanced SEO/site settings
- Draft/publish version history

Do not represent test checkout orders as paid unless a payment provider has actually confirmed payment.
