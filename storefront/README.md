# kovaz

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

## Build a store from photos

Go to **New store**, drop in photos of your products (one per product, up to 8) and, if you like, a few lines of notes. For example:

```
Juniper Candle Co — hand-poured soy candles
Lavender candle 8oz - $24
Cedar candle 12oz - $32
```

Then click **Build my store**. It uploads the photos and builds the whole store: name, colours taken from your photos, one product page per photo, homepage, story, FAQs and checkout. With "Put it live as soon as it's ready" ticked (the default), it publishes straight away.

- **With an AI model** (Settings → AI model), the model looks at each photo and writes the names, descriptions, prices, options, story and FAQs. Anything you put in the notes (names, prices, sizes) is used exactly.
- **With the free builder,** names and prices come from your notes lines and the photo file names, and descriptions stay minimal for you to fill in.
- **Photos are shrunk to 1600px** in your browser before upload, which also strips the hidden location data phones add. They're stored in `data/uploads`. Only JPG, PNG, WebP and GIF files are accepted.
- **No invented reviews or fake "was" prices** are ever generated: on a real store those are illegal in the US and many other countries.

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

## AI models

Pick the model in **Settings → AI model**. The default is **Auto**: until you add a key it uses the free rules; once you do, it picks for every request (`lib/ai/router.ts`):
- **Quick question:** a small, cheap model (Claude Haiku 5.5 / GPT-6 Luna).
- **Writing or a store change:** a mid model (Claude Sonnet 5.5 / GPT-6.2 Sol).
- **Numbers, strategy or building a store:** a top model (Claude Opus 5.5 / GPT-6.2 Astra).
- **Claude or ChatGPT:** whichever scored higher on your last practice test. Claude is used until you've tested both.
- **Combined (with both keys):** one company's model does the work and the other company's model checks it. If one company's API fails, the other takes over.

- **Claude (Anthropic):** Fable 5.2 / 5.1 / 5, Mythos 5.2 / 5.1 (verified organizations only), Opus 5.5 / 5 / 4.8 / 4.7 / 4.6, Sonnet 5.5 / 5 / 4.6, Haiku 5.5 / 4.5.
- **ChatGPT models (OpenAI):** GPT-6.2 Astra, GPT-6 Astra, GPT-6.2 Sol, GPT-6.1 Sol, GPT-6.1 Terra, GPT-6 Luna.
- **Your own accounts:** the picker also lists any other model your keys can use, read live from each provider.

To turn a provider on, put its key in `storefront/.env.local` and restart. The keys stay on the server and are never sent to the browser.

```
ANTHROPIC_API_KEY=...   # console.anthropic.com
OPENAI_API_KEY=...      # platform.openai.com
```

**Paying for it:** both providers bill per use, separately from any ChatGPT or Claude.ai subscription. The picker shows each model's price and a rough cost per reply. For example:
- Claude Opus 5.5 is about 2¢ a reply.
- Claude Haiku 5.5 and GPT-6 Luna are under 0.1¢ a reply.
- Fable 5.2 and GPT-6.2 Astra are about 5¢ a reply.

The Terra and Luna prices come from third-party trackers and are marked "unverified".

**How the models are kept in check:** a model can only *propose* one change from a fixed list (discount, product, colour, theme, headline, restock, app switch, refund, publish, headline test), and you approve it. If a model call fails, the built-in rules answer instead. Customer names, emails and addresses are never sent to a model.

**Tested vs. not yet tested:** `npm run e2e` tests the whole AI flow against a fake provider (`AI_FAKE=1`), so tests never spend money. Real Claude and OpenAI calls haven't been made from here, because no keys were available. The OpenAI code uses the standard Chat Completions call with JSON-schema output; check it on your first real request.

## AI team

**AI team** in the sidebar (or press G then I) opens six e-commerce specialists:
- product page writer
- pricing advisor
- email writer
- A/B test planner
- SEO writer
- customer service

Each one gets five things:
- **A playbook** (`lib/ai/playbook.ts`): written rules on honesty, voice, pricing, email, testing, SEO and support.
- **A worked example** of great output.
- **Your real store data:** products, units sold, revenue, stock, discounts, tests and flows. Customer details are not included.
- **Memory:** facts you teach it, plus the result of every finished A/B test, which is added automatically.
- **Checks before you see the answer.** Rule checks catch health claims, fake urgency, fake reviews, invented discount codes, unknown products and too-long text. An optional AI editor reviews the work, and the specialist revises it once if the editor finds problems.

Nothing changes until you click apply. Refunds and other exceptions are always flagged for you.

**Practice tests** score the team 0–100 on seven fixed questions about a sample candle shop (for example: don't invent a burn time; flag refund requests). Run them after changing model or memory and compare the scores. The history is kept in `data/evals.json`.

## Going live

1. Real payments with Stripe Checkout (test mode first).
2. Hosting on your domain, behind HTTPS, with `OWNER_PASSWORD` set.
3. A transactional email provider, so receipts and flows actually send.
4. Tax and shipping settings per country, plus terms, privacy and returns pages.

## Tests

`npm run build && npm run e2e` runs eight suites against fresh, empty data folders: the core loop, A/B tests, owner tools, security, AI models, photo-to-store, the AI team, and a restart to prove data persists. Screenshots go to `replica/clone-screens/`. Planning notes (recon, architecture, brand, parity) are in `replica/`.
