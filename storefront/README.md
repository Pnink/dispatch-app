# wharf

A store platform you own. Describe a shop in one sentence, review what it generates, publish, and run it from a dashboard that tells you what to do next. Every feature is on, with no plans, no cut of your sales, and nothing on the storefront that says who built it.

This is a private, single-owner build that lives in `storefront/`, next to the Dispatch app in this repo.

## Run it

```bash
cd storefront
npm install
npm run dev          # http://localhost:3100
```

Tests (start the server first; Playwright must be installed):

```bash
npm run e2e          # full loop + A/B testing + owner tools; screenshots → replica/clone-screens/
```

## What's in it

**Platform site:** `/`, `/examples`, `/costs` (a running-cost calculator; `/pricing` redirects here), `/faq`, `/about`. These pages are hidden from search engines.

**Create** (`/create`): describe the store, watch it generate, review it, then publish.

**Dashboard** (`/dashboard`):
- **Today:** a ranked list of what needs doing (orders to ship, stock that's sold out or low, experiments with a winner, list-growth ideas), with one-click fixes.
- **Orders:** filter, search, fulfil and refund.
- **Products:** includes AI drafts.
- **Built-in apps:** reviews, email popup, email flows and loyalty points.
- **Email:** flow editor with previews, plus your subscriber list.
- **Experiments:** A/B tests on headlines, prices, free-shipping thresholds and popup discounts. Winners are chosen with Bayesian stats and can roll out automatically.
- **Design:**
  - AI restyle, colours and type.
  - Homepage sections: reorder or hide them, and edit the announcement bar, brand story and storefront FAQ.
- **Settings:**
  - Shipping and discount codes.
  - **Your data:** full JSON backup and restore, plus CSV exports of orders, products and the email list.
- **Assistant** on every page. It proposes an action and applies it when you approve.
- **⌘K / Ctrl+K** opens a command palette for every page, switch and store.

**Storefront** (`/store/<slug>`): homepage built from your sections, product pages with reviews, cart, guest checkout with discount codes, order confirmation and loyalty points.
- **White-label:**
  - The browser tab shows your store name, with your own favicon.
  - There is no "powered by" line anywhere.
  - The server HTML never mentions the platform.
  - The owner bar only appears in your own browser.
- **Test payments:** `4242 4242 4242 4242` succeeds, `4000 0000 0000 0002` is declined, and `4000 0000 0000 9995` has insufficient funds.

All data currently lives in **your browser's localStorage**. Use Settings → Your data to back it up or move it to another computer.

## Renaming it

The platform name lives in `lib/brand.ts`, and the mark lives in `components/Logo.tsx`. Neither ever appears on a storefront.

## Going live (what's still needed to sell real things)

1. **Real payments:**
   - Stripe Checkout in test mode first, then live.
   - Your bank details go into Stripe, never into this app.
   - The app needs a server route plus a webhook to confirm orders.
2. **Real database:**
   - Replace `lib/store.ts` with Postgres (schema in `replica/schema.sql`).
   - Add owner sign-in so only you can open `/dashboard`.
3. **Hosting and domain:**
   - Any Next.js host whose plan allows commercial use.
   - Point your domain at the storefront.
4. **Email:**
   - A transactional email provider, so order confirmations and flows actually send.
5. **Real AI (optional):**
   - Route `lib/ai.ts` through a model API for generation and the assistant.
6. **The basics:**
   - Tax settings, shipping rates per country.
   - Terms, privacy and returns pages.

The planning notes behind this build (recon, architecture, brand, fixes, parity) are in `replica/`.
