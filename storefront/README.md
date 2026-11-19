# tillery

Your shop's back office, built for the desktop. Describe a shop in one sentence, review what it generates, publish it, and run it from a keyboard-friendly dashboard that tells you what to do next.

- Every feature is on. There are no plans and no cut of your sales.
- Nothing on the storefront says who built it.
- Everything you do is saved to your own computer as you work.

This is a private, single-owner build that lives in `storefront/`, next to the Dispatch app in this repo.

## Run it on your computer

```bash
cd storefront
npm install
npm run app          # builds, then serves http://localhost:3100 (only reachable from this computer)
# or, while changing the code:
npm run dev
```

Open http://localhost:3100/dashboard. The first time, it asks you to create your first store; there is no sample data.

## Saving

**Every change saves automatically** within a moment of making it. The header shows `Saved · 2:41 PM`, and **⌘S / Ctrl+S** saves instantly. Saved data lives in `storefront/data/`:

```
data/db.json          everything: stores, products, orders, customers, tests, settings
data/backups/         a timestamped copy every 10 minutes while you work (newest 50 kept)
```

How saving handles edge cases:
- **More than one window:** if two windows (or a new order) save at the same moment, your changes are re-applied on top of the newer data, so nothing is lost.
- **Server down:** if the server stops, changes are kept in the page and retried, and the header says so.
- **Closing the tab mid-save:** the last change is still sent.

**Moving or keeping data:**
- **Another computer:** copy the `data` folder, or use Settings → Your data → Full backup / Restore.
- **Git:** `data/` is in `.gitignore`, so customer data never ends up in git.

## Desktop shortcuts

| keys | does |
| --- | --- |
| ⌘K / Ctrl+K | jump to any page, switch, or store |
| ⌘J / Ctrl+J | show/hide the assistant |
| ⌘S / Ctrl+S | save now |
| G then T / O / P / A / E / X / D / S | Today, Orders, Products, Apps, Email, Experiments, Design, Settings |
| ? | list of shortcuts |

## What's in it

**Owner app** (`/dashboard`):
- **Today:** a ranked to-do list with one-click fixes.
- **Orders**, **Products** (including AI drafts), **Built-in apps** (reviews, popup, email flows, loyalty) and **Email**.
- **Experiments:** A/B tests on headlines, prices, free-shipping thresholds and discounts.
- **Design:** AI restyle and the homepage section editor.
- **Settings:** shipping, discount codes, backups and CSV exports.
- **The assistant** on every page.

**Storefront** (`/store/<slug>`):
- Homepage, product pages with reviews, cart and guest checkout.
- **White-label:** your store name in the tab, your own favicon, no platform text anywhere, neutral storage keys.
- **Test cards:** `4242 4242 4242 4242` succeeds, `4000 0000 0000 0002` is declined.

**Platform site:** `/`, `/examples`, `/costs` (a running-cost calculator), `/faq`, `/about`.

## Security

See **[SECURITY.md](SECURITY.md)** for what's built in, the checklist before going online, and which accounts to protect. In short:
- **Without a password:** the owner app only opens on this computer.
- **With `OWNER_PASSWORD` set** (in `.env.local`): sign-in is required, and `npm run start:public` refuses to start without it.
- **The server checks every price, stock level and discount code** itself.

## Using real AI models

The assistant and store generator currently use built-in rules: free, and no API key. To use Claude instead you'd need an API key from the Claude Console. It's billed per use, separately from any Claude.ai subscription. At current list prices, Claude Opus 5.5 costs $4 per million input tokens and $20 per million output tokens. That works out to roughly:
- about 2¢ per assistant reply
- about 5–10¢ per generated store
- about $5–15 a month for daily use

Claude Haiku 5.5 ($0.10 / $0.50 per million tokens) costs well under a cent per reply, for simpler answers. The swap is contained in `lib/ai.ts`.

## Going live

1. Real payments with Stripe Checkout (test mode first).
2. Hosting on your domain, behind HTTPS, with `OWNER_PASSWORD` set.
3. A transactional email provider, so receipts and flows actually send.
4. Tax and shipping settings per country, plus terms, privacy and returns pages.

## Tests

`npm run build && npm run e2e` runs five suites against fresh, empty data folders: the core loop, A/B tests, owner tools, security, and a restart to prove data persists. Screenshots go to `replica/clone-screens/`. Planning notes (recon, architecture, brand, parity) are in `replica/`.
