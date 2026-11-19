# Build log

| ID | date | status | missing / notes |
| --- | --- | --- | --- |
| S01 Home | 2026-11-19 | done | backer logo strip replaced with a payment-method marquee (theirs is their identity) |
| S02 Pricing | 2026-11-19 | done | own plan names/prices; same 4-tier + monthly/yearly structure |
| S03 FAQ | 2026-11-19 | done | 10 categories, fresh Q&A describing this demo honestly; contact form doesn't send |
| S04 About | 2026-11-19 | done | no founder story/YC content (theirs); neutral "about this project" |
| S05 Examples | 2026-11-19 | done | cards are rendered live from the generator |
| S06 Create | 2026-11-19 | done | reference image not used by generator |
| S07 Review | 2026-11-19 | done | |
| S08 Dashboard | 2026-11-19 | done | |
| S09 Products | 2026-11-19 | done | variants are a single option list |
| S10 Orders | 2026-11-19 | done | |
| S11 Built-in apps | 2026-11-19 | done | |
| S12 Email | 2026-11-19 | done | previews only |
| S13 Design | 2026-11-19 | done | |
| S14–S18 Storefront → confirmation | 2026-11-19 | done | |
| W01–W04 Rebrand to Wharf | 2026-11-19 | done | new platform site structure, /costs, white-label storefront, Today, sections, ⌘K, backup |
| S20 Experiments | 2026-11-19 | done | refunds don't reverse experiment revenue; all visitors in one browser share one id |

Harder than expected: `scrollIntoView` returns a Promise in current Chromium, so an expression-bodied
`useEffect(() => ref.scrollIntoView(...))` crashed React ("destroy is not a function"). All effects now use block bodies.

Verification: `npm run e2e` (Playwright walkthrough of F01–F04 incl. decline, discount, loyalty, fulfil) passes with 0 console
errors; no horizontal overflow at 390px on the homepage. Contrast check on tokens: 0 AA failures.

A/B testing: `npm run e2e` also runs `e2e/experiments.cjs` (assistant-started test, validation, preview not counted,
new visitor counted once, order converts at the variant price, auto-rollout, manual rollout). Passes with 0 console errors.

Rebrand (2026-11-19): sweep with `replica/brand.json` is clean. Fixed along the way: two prompt boxes shared one HTML id;
the assistant's auto-scroll scrolled the whole page; the 7-day chart drew no bars (percent heights in an auto-height flex item);
an absolutely positioned sr-only table header escaped its scroll box and widened phone layouts. `e2e/owner-tools.cjs` covers
the new features; all three suites pass with 0 console errors, and no page overflows at 390px.
