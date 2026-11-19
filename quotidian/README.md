# Quotidian

A quotes app: one quote per swipe, keep the ones that land, get a few through
the day. Built with the Replica skill pack as a clean-room rebuild of the
features of *Motivation - Daily quotes*. Its own name, icon, quotes and copy;
none of the original's.

> **Quotidian** is a working name. Run the trademark checks in
> `/replica-brand` before you ship anything under it.

## Run it on your iPhone

You need Node 20+ on a computer and the free **Expo Go** app on the phone.

```bash
cd quotidian
npm install
npx expo start          # add --tunnel if the phone is on a different network
```

Scan the QR code with the iPhone camera. It opens in Expo Go.

Web preview: `npm run web`.

## What's in it

| | |
| --- | --- |
| Feed | full-screen quotes, swipe up for the next; heart or double-tap to save; share as an image (phone) or text |
| Categories | 11 topics, your favorites, your own quotes, recently read, make-your-own mix, search |
| Themes | 16 built-in themes (all pass WCAG AA) and a theme editor: background, font, colour, size, alignment |
| Your quotes | write, edit and delete your own; they appear in the feed and reminders |
| Reminders | 1 to 20 a day between two times, from any source; each one a different quote |
| Onboarding | name, goals (the feed leans towards them), reminders, first theme |

Everything is stored on the device. No account, no server.

**Not built yet:** home-screen and lock-screen widgets (need a native
WidgetKit target and a development build), premium subscription (needs
RevenueCat or StoreKit with your own App Store products), photo backgrounds.

## Quotes

`src/data/quotes.ts`: public-domain lines by long-dead authors, from
public-domain translations, plus lines written for this app. Only append to
those lists. IDs are positional, so reordering breaks saved favorites.

## Checks

```bash
npx tsc --noEmit
npx expo lint
npm run build:web && npm run e2e     # 52 Playwright tests incl. axe WCAG scans
```

## Replica files

`replica/` holds the planning and scoring: `recon.md`, `features.csv`,
`architecture.md`, `design/tokens.json`, `test-plan.md`, `bugs.md`,
`build-log.md`, `parity.md`, and screenshots of every screen in
`clone-screens/`. The skills themselves are in `../.claude/skills/`.
