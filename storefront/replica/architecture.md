# Architecture: Forgecart (a demo rebuild of Amboras's core features)

## Stack

| layer | choice | why |
| --- | --- | --- |
| web | Next.js 15 App Router + TypeScript | pack default; one app hosts marketing, admin and storefronts |
| styling | Tailwind CSS v4, tokens in `app/globals.css` (`@theme`) | pack default; tokens -> utilities like `bg-surface text-muted` |
| database | **browser localStorage** behind `lib/store.ts` | demo: no accounts/keys. Functions are async-shaped so a Postgres/Supabase layer can replace them without screen changes |
| auth | none (single demo merchant) | personal demo |
| payments | mocked in `lib/payments.ts` (test card rules) | no Stripe keys needed |
| AI | deterministic fake in `lib/ai.ts` (keyword -> category templates, seeded names/products, scripted assistant intents) | no LLM keys; swap for the Claude API later |
| email | rendered previews only | no sending |
| images | generated SVG artwork (`components/ProductArt.tsx`) | never load anything from the original's domain |
| hosting | `npm run dev` / any Node host | |

## Schema (target, for when the fake layer is replaced) — see `schema.sql`

Tables: 6 (stores, products, orders, order_items, reviews, email_flows). Access: one ownership check per query in the data layer (`store.owner_id = session.user`).

## API (fake layer function signatures in `lib/store.ts`)

| function | does | who | flow |
| --- | --- | --- | --- |
| `createStore(prompt, category)` | runs fake AI, saves store + products + reviews + flows | merchant | F01 |
| `getStore(slug)` / `listStores()` | read | anyone | F01, F04 |
| `updateStore(slug, patch)` | name, palette, apps toggles | merchant | F03 |
| `upsertProduct / deleteProduct` | catalog | merchant | F02 |
| `placeOrder(slug, cart, customer, card)` | mock charge, decrement stock, loyalty points | shopper | F04 |
| `updateOrderStatus(slug, id, status)` | fulfil / refund (restock) | merchant | F02 |

Webhooks: none. Jobs: none (email flows are previews).

## The parts that bite

- money: integer cents everywhere, formatted at the edge.
- stock races: single-browser demo; real version needs `update ... where stock >= qty`.
- persistence: localStorage is per-browser; merchant and shopper must use the same browser for the demo loop.
- hydration: all data screens are client components that render after mount to avoid SSR/localStorage mismatch.

## Build order

1. Vertical slice: S06 -> S07 -> S08 -> S14 -> S17 -> S18 -> S10 (stores, products, orders).
2. Must-haves: marketing S01-S04, S09, S11, S15, S16.
3. Should-haves: S05 examples, S12 email, S13 design, discount codes, analytics.
4. Could: A/B testing, multi-language, subscriptions.
