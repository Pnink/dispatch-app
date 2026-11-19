# Recon map: Motivation - Daily quotes (iOS)

Scope: the core loop. A full-screen feed of quotes you swipe through, plus
what shapes that feed: categories, themes, favorites, your own quotes and
reminders through the day.
For: the user's own version, to sell later under its own name.
Date: 2026-11-19

Working name for the clone: **Quotidian** (placeholder; replica-brand checks
have not been run).

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | App Store listing (screenshot from the user) | https://apps.apple.com/us/app/motivation-daily-quotes/id876080126 | 4.8 stars, 1.1M ratings, 13+, #47 Health & Fitness, part of the "Self Growth Essentials" bundle. The page itself could not be fetched from this session (host not allowed). |
| 2 | Google Play listing | https://play.google.com/store/apps/details?id=com.hrd.motivation&hl=en | quotes throughout the day, save, share, categories, ad-supported free tier |
| 3 | Developer FAQ | https://home.monkeytaps.app/frequently-asked-questions | topics: reminders, languages, widgets, editing themes and backgrounds, premium content locked, subscriptions |
| 4 | Store tracker | https://appgoblin.info/apps/com.hrd.motivation | bundle id, ratings history |
| 5 | Roundup | https://www.mindfulsuite.com/reviews/best-motivational-quotes-apps | fonts and colours customisable, category filter, widget customised in-app, free tier limits categories and reminders |
| 6 | Pricing tracker | https://apppricinglab.com/app/apple/876080126 | "Premium Motivation" IAP, roughly $3.99 to $99.99 in the US |

Not used: the app binary, its network calls, its quote database. Reading
the user's own account was not possible from a cloud session; layouts below
marked "guess" should be checked against the real app on the user's phone.

## Core loop

Open the app (or tap a reminder), read a quote full screen, swipe up for the
next one, heart or share the ones that land.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Feed | app launch, after onboarding | read quotes one per screen, swipe vertically | full-bleed themed background, centred serif quote, share + heart under the quote, bottom bar: category pill (left), theme + profile buttons (right) | filled, liked, empty category (favorites with none), long quote |
| S02 | Onboarding | first launch | name, goals, reminders, first theme | step pages, choice chips, time steppers, primary button, progress | each step, skip |
| S03 | Categories | category pill on S01 | choose what the feed shows | search field, "your quotes" group (favorites, own quotes, history), topic grid, make-your-own-mix | selected, mix selected, empty search |
| S04 | Themes | paint-brush on S01 | change background, font, text colour | grid of theme previews, "create your own" | selected |
| S05 | Theme editor | "create your own" on S04 | build a custom theme | live preview, background swatches, font list, text colour, size | editing, saved |
| S06 | Profile / settings | person button on S01 | hub for everything else | rows: favorites, own quotes, history, reminders, widgets, name, about | default |
| S07 | Favorites | S06 or S03 | the quotes you hearted | list, unlike, open in feed | empty, filled |
| S08 | Own quotes | S06 or S03 | write and keep your own lines | list, add/edit sheet, delete | empty, filled, editing, validation error |
| S09 | Reminders | S06 or onboarding | quotes as notifications through the day | how many per day, start time, end time, category, permission state | on, off, permission denied, web (not supported) |
| S10 | History | S06 or S03 | quotes you have already seen | list, newest first | empty, filled |
| S11 | Widgets help | S06 | how to add the home-screen widget | steps | static |
| S12 | Premium paywall | locked category / crown | subscription | plan cards | out of scope this pass |

## Flows

```
F01 Read and like a quote
    S01 -> swipe up -> double-tap or heart
    happy path clicks: 1 (heart)
    edge: last quote in a category (loops), very long quote, double tap twice (unlike)

F02 Share a quote
    S01 -> share -> system share sheet
    happy path clicks: 2
    edge: share cancelled, web without navigator.share (copy to clipboard)

F03 Switch category
    S01 -> category pill -> S03 -> tap a topic -> S01 shows only that topic
    happy path clicks: 2
    edge: favorites with nothing saved, mix with nothing ticked, search no match

F04 Change theme
    S01 -> theme button -> S04 -> tap a theme -> S01 restyled
    happy path clicks: 2
    edge: custom theme with low-contrast text colour

F05 Write your own quote
    S01 -> profile -> S08 -> add -> type -> save -> appears in "own quotes" feed
    happy path clicks: 4
    edge: empty text, 500+ characters, edit then cancel, delete

F06 Set reminders
    onboarding or S06 -> S09 -> pick count, start, end -> save -> permission prompt
    happy path clicks: 4
    edge: permission denied, start after end, count 0, web

F07 First launch
    S02 name -> goals -> reminders -> theme -> S01
    happy path clicks: 5
    edge: skip every step, kill the app mid-onboarding
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| QuoteCard | theme-driven | default, liked, long text | S01, theme previews |
| IconButton | round glass, plain | default, pressed, active, focus | S01, sheets |
| Pill | category | default, pressed | S01 |
| Sheet header | title + close | default | S03-S11 |
| Row | navigation, toggle | default, pressed, disabled | S06, S09 |
| Chip | single, multi | default, selected | S02, S03 |
| Tile | category, theme | default, selected, locked | S03, S04 |
| Stepper | number, time | default, min, max | S09, S02 |
| TextArea | quote input | empty, filled, error, counter | S08 |
| Primary button | full width | default, pressed, disabled | S02, S05, S08 |
| Toast | info | shown, hidden | copy-to-clipboard, saved |

## Inferred data model

```
Quote        id, text, author?, categoryIds[]
             evidence: S01, category filter in listings
             confidence: high

Category     id, name, icon, premium?
             evidence: S03, "limited set of categories" on the free tier
             confidence: high

Theme        id, background (colour or gradient or image), font, textColor,
             textSize, align
             evidence: listings ("change fonts and colours"), FAQ "editing themes and backgrounds"
             confidence: high

Favorite     quoteId, savedAt                         confidence: high
OwnQuote     id, text, author?, createdAt             confidence: medium (FAQ, settings)
SeenQuote    quoteId, seenAt                          confidence: medium (guess: history)
ReminderPlan count, start, end, categoryId, enabled   evidence: FAQ, listing; confidence: high
Profile      name, goals[], onboarded                 confidence: medium
```

Relationships: Category n-n Quote, Profile 1-1 ReminderPlan, Profile 1-n
Favorite / OwnQuote / SeenQuote. Everything is on-device (no account).

## Feature matrix

See `features.csv`. Must: 9, should: 10, could: 5, skip: 5.

## Out of scope (cannot or should not be cloned)

- Their quote library and its curation: content they own. The clone ships
  its own set: public-domain quotes by long-dead authors plus lines written
  fresh.
- Name, "99" quote-mark icon, store screenshots, marketing copy, their
  photo backgrounds: trademark and trade dress.
- The Self Growth Essentials bundle, Slack integration, Apple Watch app:
  their network and other products.
- Premium subscription and ads: needs StoreKit / RevenueCat (replica-backend).
- Home-screen and lock-screen widgets: need a native WidgetKit target and a
  development build, which this session cannot compile or test.

## Size

Screens 12, flows 7, entities 8. Hard parts: full-screen paging that feels
native on iOS and web, scheduling local notifications across the day, and
widgets (native code). Size: S for the core loop, M with widgets and
payments.
