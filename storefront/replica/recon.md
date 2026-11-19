# Recon map: Amboras (web)

Scope: marketing site (home, pricing, FAQ, about) + core loop: describe a store -> AI generates the storefront -> merchant dashboard -> customer storefront + checkout.
For: personal demo only. Placeholder brand **Forgecart**; all copy written fresh.
Date: 2026-11-19

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | homepage | https://amboras.com | hero, stats, feature blocks, prompt box w/ category chips |
| 2 | about | https://amboras.com/about | founder story, stat cards, 3 value cards |
| 3 | faq | https://amboras.com/faq | 10 categories, ~90 Qs; the best feature list |
| 4 | pricing | https://amboras.com/pricing | 4 plans, monthly/yearly toggle, editing tokens |
| 5 | what-is | https://amboras.com/what-is-amboras | 7 "included" cards, 3-step flow |
| 6 | examples | https://amboras.com/examples | 18 example stores, category filter chips, prompt shown per card |
| 7 | apps & integrations | https://amboras.com/apps-and-integrations | list didn't render in text fetch |
| 8 | A/B testing | https://amboras.com/ab-testing | Bayesian sequential testing, testable variables |

Text-only fetches: colours, fonts and pixel layout were NOT observed. No screenshots of the original were captured (no browser on the target), so `screens/` is empty and layout diff is not possible.

## Core loop

A merchant types one sentence describing a store; AI produces a branded storefront with products, then the merchant runs it from one admin with an AI assistant.

## Screens

| ID | screen | route | purpose | key components | states |
| --- | --- | --- | --- | --- | --- |
| S01 | Home | / | acquire merchants | nav w/ dropdowns, hero 2 CTAs, backer marquee, 3 stats, product screenshot, 5 feature blocks, prompt box + category chips, 5-col footer | — |
| S02 | Pricing | /pricing | plans | monthly/yearly toggle, 4 plan cards (popular badge), token footnote | monthly, yearly |
| S03 | FAQ | /faq | objections | jump-to category row, numbered accordion sections, contact form | collapsed/expanded, form sent |
| S04 | About | /about | story | hero, stat cards, value points, 3 cards, founders block, CTA | — |
| S05 | Examples | /examples | inspiration | category filter chips, store card grid with prompt | filtered, empty filter |
| S06 | Create store | /create | describe the store | prompt textarea, category chips, optional reference image | empty, generating (progress steps), error |
| S07 | Review generated store | /create (step 2) | review before going live | storefront preview, brand/products summary, publish | — |
| S08 | Dashboard home | /dashboard | metrics + AI assistant | icon sidebar, KPI cards, recent orders, chat panel | empty store, filled |
| S09 | Products | /dashboard/products | catalog | table, add product (AI draft), edit, stock | empty, filled |
| S10 | Orders | /dashboard/orders | fulfil/refund | table, status filter, order detail drawer | empty, filled |
| S11 | Apps (built-ins) | /dashboard/apps | reviews/popups/email/loyalty toggles | toggle cards w/ settings | on/off |
| S12 | Email flows | /dashboard/email | flows | flow list, preview | — |
| S13 | Design/editor | /dashboard/design | AI restyle | chat prompt, palette, preview | — |
| S14 | Storefront home | /store/[slug] | shopper landing | header, hero, product grid, reviews, popup | — |
| S15 | Product page | /store/[slug]/p/[id] | buy | gallery, variants, reviews, add to cart | out of stock |
| S16 | Cart | /store/[slug]/cart | review cart | line items, qty, free-ship bar | empty |
| S17 | Checkout | /store/[slug]/checkout | pay (mock) | guest form, shipping, payment methods, summary | validation error, processing |
| S18 | Order confirmed | /store/[slug]/order/[id] | thanks | summary, loyalty points | — |

## Flows

```
F01 Merchant creates a store
    S01 prompt box -> S06 (prefilled) -> generating -> S07 review -> S08 dashboard
    happy path clicks: 3
    edge: empty prompt, very long prompt, unknown category -> generic theme
F02 Merchant manages catalog / orders
    S08 -> S09 add product (AI draft) ; S08 -> S10 mark fulfilled / refund
F03 Merchant toggles built-ins
    S08 -> S11 toggle reviews / popup / email / loyalty -> visible on S14/S15/S18
F04 Shopper buys
    S14 -> S15 -> add to cart -> S16 -> S17 -> S18 ; order appears on S10
    edge: empty cart, invalid card (mock decline 4000...0002)
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Button | primary, secondary, ghost | default, hover, focus, disabled, loading | all |
| Input/Textarea | — | default, focus, error | S03, S06, S17 |
| Chip | filter, suggestion | default, selected | S01, S05, S06 |
| Card | plan, feature, stat, product | default, highlighted | many |
| Accordion | — | open/closed | S03 |
| Toggle | — | on/off | S02, S11 |
| Table | — | empty, filled | S09, S10 |
| Chat panel | — | idle, thinking | S08, S13 |
| Popup modal | — | open/closed | S14 |

## Inferred data model

```
Store     id, slug, name, tagline, prompt, category, palette{accent,bg,text}, font, plan,
          apps{reviews,popup,email,loyalty}, created_at       evidence: FAQ 01, examples   confidence: high
Product   id, store_id, title, description, price_cents, compare_at_cents, variants[], stock,
          image(seed), seo_title, status                       evidence: FAQ 03            confidence: high
Order     id, store_id, number, customer{name,email,address}, items[], subtotal, shipping,
          total, status (paid|fulfilled|refunded), created_at  evidence: FAQ 04/05, homepage screenshot  confidence: medium
Review    id, product_id, author, rating, body                 evidence: FAQ "reviews built in"  confidence: medium
EmailFlow id, store_id, kind (welcome|abandoned|post_purchase|review_request), enabled, delay  evidence: homepage email block  confidence: medium
LoyaltyMember email, points                                    evidence: FAQ "loyalty built in"  confidence: guess
```

Relationships: Store 1-n Product, Store 1-n Order, Product 1-n Review, Store 1-n EmailFlow.

## Feature matrix

See `features.csv`.

## Out of scope

- Real payments (Stripe Connect), real carriers/3PLs, real domains/SSL/CDN, real LLM + image generation (faked deterministically), migration from other platforms, SOC2/PCI/GDPR posture, investor/YC backing and founder story (that is theirs; replaced with neutral placeholder copy).

## Size

Screens 18, flows 4, entities 6. Hard parts: convincing fake AI generation, client-side persistence across admin/storefront, checkout state. Size: M (demo-grade: S).
