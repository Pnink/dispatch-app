# Test plan: Quotidian

Automated: `npm run build:web && npm run e2e` (Playwright, iPhone-size viewport
390×844, Chromium). Every browser test fails on any console error, and six
screens get an axe WCAG 2 A/AA scan. Pure logic (feed order, reducer, theme
contrast, reminder times) runs in the `logic` project with no browser.

Result on 2026-11-19: **52 passed, 0 failed**, twice in a row.

| case | what | how |
| --- | --- | --- |
| F07-H1 | onboarding: name, goals, reminders, theme → greeting with name | e2e |
| F07-E1 | skip every step | e2e |
| F07-E2 | returning user skips onboarding | e2e |
| F01-H1 | swipe to next quote, heart it, saved to storage | e2e |
| F01-H2 | double tap likes; second double tap does not unlike | e2e |
| F01-E1 | favorites and history survive a reload | e2e |
| F01-E2 | endless topic feed keeps going past its last quote | e2e |
| F02-H1 | share on desktop web copies the quote to the clipboard | e2e |
| F03-H1 | pick a topic; every quote shown is in that topic | e2e |
| F03-H2 | make a mix; apply disabled until a topic is picked | e2e |
| F03-H3 | search by author, open a result at the top of the feed | e2e |
| F03-E1 | search with no match | e2e |
| F03-E2 | empty favorites feed has an empty state and a way out | e2e |
| F04-H1 | pick a built-in theme; text colour changes | e2e |
| F04-H2 | custom theme; low-contrast warning appears and clears; saved | e2e |
| F05-H1 | write (empty refused), read in feed, edit, delete with confirm | e2e |
| F05-E1 | over 280 characters refused, counter shown | e2e |
| F06-H1 | web: reminders saved for the phone, shown in profile | e2e |
| F06-E1 | start after end blocks saving | e2e |
| L-1..3 | favorites list unlike + open; history list + clear; name edit | e2e |
| A-1..7 | axe on feed, categories, themes, profile, reminders, theme editor, onboarding | e2e |
| A-8 | the longest quote fits one screen above the bottom bar | e2e |
| logic | quote ids unique, topics ≥ 8 quotes, no duplicate text | unit |
| logic | shuffle deterministic; topic/mix/goals/pinned/favorites order; next round no repeat | unit |
| logic | reducer: like toggle, history cap + dedupe, refresh rules, delete cascades, migrate junk | unit |
| logic | all 16 built-in themes ≥ 4.5:1; contrast maths; reminder spread; 12-hour format | unit |

## Manual, on a phone (not run in this session)

These need a real iPhone or Android phone with Expo Go, which a cloud session
cannot drive. Checklist for the user:

- [ ] Swipe feels like paging on iOS (one quote per flick, no half pages)
- [ ] Turn on reminders → permission prompt → notifications arrive at the set times with different quotes
- [ ] Tap a notification → app opens on that quote
- [ ] Deny permission → reminders screen shows the "Open Settings" notice
- [ ] Share → image of the themed card in the share sheet
- [ ] Haptic tick on like
- [ ] Safe areas: nothing under the notch or home indicator
