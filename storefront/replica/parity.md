# Parity report: Forgecart vs Amboras (demo slice)

Date: 2026-11-19

**Read this first.** The score below is measured against `features.csv`, which only lists the slice that was scoped
(marketing site + describe → generate → dashboard → storefront → checkout). Amboras's FAQ describes a much larger product
(B2B, blog, returns portal, multi-storefront, RBAC/audit log, carriers/3PL, migrations, 125+ real payment methods, etc.).
Against the *whole* product this demo is a small fraction.

**Layout score: not measured.** The recon used text-only page fetches; no screenshots of the original were captured, so
`imgdiff.py` had nothing to compare. Clone screenshots are in `clone-screens/` if you want to capture originals later
(`python3 imgdiff.py screens/S01.png clone-screens/S01-home.png`).

**Behaviour diff (core flow)**

| flow | original (as described publicly) | clone | fix or keep |
| --- | --- | --- | --- |
| F01 create | 1 sentence → ~2 min → 3 products, live URL | 1 sentence → ~4 s animated steps → 3–4 products, review screen, publish | keep |
| F01 input | text + optional reference image | text; image previewed but ignored | fix later (needs real model) |
| Assistant | page-aware, acts on store data, propose-then-approve | same pattern, rules-based intents only | swap in a real LLM |
| F04 checkout | 125+ real methods, Stripe Connect | test-card rules + simulated wallets | keep (demo) |
| A/B testing | agentic tests, Bayesian sequential, auto-rollout | headline/price/shipping/popup tests, Bayesian, auto-rollout, previews | keep |
| Persistence | server database, accounts | browser localStorage, single merchant | keep (demo) |

**Verdict:** within the scoped slice, all must-haves are done → shippable *as a demo*. Not a product.

## Parity: 95.1 / 100

features 95.1  (33 counted, must-haves 21 of 21 done)

## By area, weakest first
- seo                           50.0  (1 features)
- analytics                     50.0  (1 features)
- products                      80.0  (2 features)
- storefront                    90.0  (4 features)
- onboarding                    95.0  (4 features)
- marketing                    100.0  (6 features)
- ai                           100.0  (4 features)
- dashboard                    100.0  (1 features)
- orders                       100.0  (1 features)
- apps                         100.0  (4 features)
- email                        100.0  (1 features)
- checkout                     100.0  (3 features)
- growth                       100.0  (1 features)

## Missing, in build order
- [should] analytics: Analytics dashboard, partial  (KPIs + 7-day chart only)
- [should] products: Variants per product, partial  (single option list; no per-variant price/stock/SKU)
- [could] storefront: Multi-language storefront, no
- [could] onboarding: Optional reference image on prompt, partial  (image is previewed but not used by the generator)
- [could] seo: SEO meta per product, partial  (editable SEO title; no meta description/sitemap)

## Left out on purpose (not scored)
- Custom domains and SSL: needs real DNS/hosting; out of scope for a demo
- Real payment processing (125+ methods): mocked by design; no keys
- Shipping carriers labels and 3PL: needs carrier accounts
- Migration from Shopify/WooCommerce: needs third-party accounts
- Subscriptions and bundles: not needed: single-user personal demo

## Top five to build next
1. Real AI: route `lib/ai.ts` through the Claude API (store generation + assistant tool calls).
2. Real payments: Stripe Checkout in test mode via a Next.js route handler (see README).
3. Real persistence: Postgres via `replica/schema.sql`, replacing `lib/store.ts`.
4. Per-variant price/stock/SKU and a fuller analytics page.
5. Use the reference image in generation (palette extraction at minimum).
