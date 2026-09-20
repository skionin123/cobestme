# CoBest

CoBest is a business-first website and commerce platform. It combines guided client onboarding, a structured website brief, visual website editing, products, orders, customers, content, and store management in one workspace.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Production deployment

```bash
npm run build
npm run start
```

The included Railway configuration runs the production server after Vite builds the application.

## Domain structure

- `cobest.me` — public product website
- `app.cobest.me` — customer dashboard and website builder

## Billing

The public pricing and account journey are designed into the product. Before accepting paid subscriptions, connect a payment provider, production authentication, and persistent database storage. Do not take payment until those services are configured and tested.
