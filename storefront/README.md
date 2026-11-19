# Forgecart: storefront demo

A personal demo of an AI-native commerce platform, modelled on the features and flows of Amboras. **Forgecart** is a placeholder brand. All copy, the logo and the code are original, and no AI model or payment service is called.

This folder is separate from the Dispatch Electron app at the repo root.

## Run it

```bash
cd storefront
npm install
npm run dev          # http://localhost:3100
# or: npm run build && npm start
```

Optional end-to-end walkthrough (Playwright must be available; start the server first):

```bash
npm run e2e          # writes screenshots to replica/clone-screens/
```

## The demo loop

1. **Marketing site:** `/`, `/pricing`, `/faq`, `/about`, `/examples`.
2. **Describe a store:** type a sentence in the homepage prompt box or on `/create`, or tap a category chip.
3. **Generation:** progress steps, then a **review** screen with a live preview. Rename the store, then publish.
4. **Merchant dashboard** (`/dashboard`):
   - Home: KPIs, a 7-day revenue chart, a setup guide and recent orders.
   - Orders: filter and search; fulfil or refund (refunds restock).
   - Products: add, edit and delete, with **Draft with AI**.
   - Built-in apps: on/off switches for **reviews, popup, email, loyalty**.
   - Email: flow previews and editing.
   - Design: AI restyle, colours, type and copy.
   - Settings: shipping, discount codes, publish, reset demo.
   - **Assistant** panel on every page. It proposes actions and you approve them. Try "How are sales going?", "Create a 20% discount", "Add a product called Travel Mug", "Make the accent green", "What's low on stock?", "Refund order #1002".
5. **Customer storefront** (`/store/<slug>`): popup, product page with reviews, cart with a free-shipping bar, and guest checkout with discount codes.
   - Card `4242 4242 4242 4242` succeeds, `4000 0000 0000 0002` is declined, `4000 0000 0000 9995` has insufficient funds. Wallet buttons are simulated.
6. **Experiments** (`/dashboard/experiments`, or ask the assistant to "run an A/B test"):
   - Test the homepage headline, a product's price, the free-shipping threshold or the popup discount.
   - Each storefront visitor gets A or B and keeps it, and checkout charges the price that visitor was shown.
   - Visitors are counted once; their orders count as conversions with revenue.
   - Headline and shipping tests compare conversion rate. Price and discount tests compare revenue per visitor.
   - The winner is rolled out automatically at 95% confidence once each version has the minimum number of visitors, or you can roll out B or keep A yourself.
   - **Preview** links (`?ab=<id>.a|b`) show one version without counting it.
   - **Simulate 250 visitors** adds labelled demo traffic, since a single browser can't produce real traffic.
7. **Confirmation:** loyalty points are shown on the confirmation page, and the order appears in the dashboard.

All data lives in **your browser's localStorage**, so use the same browser for the dashboard and the storefront. On first load the app seeds a sample store. **Settings → Reset demo data** wipes everything.

## Layout

```
app/(marketing)/     home, pricing, faq, about, examples
app/create/          describe → generate → review
app/dashboard/       merchant admin + assistant (components/dashboard/Shell.tsx)
app/store/[slug]/    customer storefront, product, cart, checkout, order
lib/ai.ts            fake AI: store generator, product drafts, assistant intents
lib/store.ts         localStorage data layer (swap for a real DB; see replica/schema.sql)
lib/payments.ts      mocked card processor
replica/             recon, architecture, schema, design tokens, feature matrix, parity report
```

## Not done

See `replica/parity.md`. The main gaps:

- No real AI.
- No real accounts or database.
- No real payments, shipping, domains or migration.
- Variants have no per-variant price or stock.
- Refunds don't subtract revenue from experiment results.
