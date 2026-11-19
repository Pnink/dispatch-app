# Parity: Quotidian vs Motivation - Daily quotes

Date: 2026-11-19. Tools: `replica-diff/parity.py`, `replica-brand/sweep.py`.

**Overall: 76 / 100.** Must-haves 8 of 9. **Verdict: not shippable yet**,
by the pack's rule (a must-have is partial): reminders are written but have
not been run on a phone.

| area | score |
| --- | --- |
| categories | 100 |
| library | 100 |
| onboarding | 100 |
| feed | 83 |
| themes | 83 |
| platform | 75 |
| reminders | 50 |
| settings | 0 |
| widgets | 0 |

## Layout score

Not measured. The only reference image available was the App Store listing
page, not screens from inside the app, so `imgdiff.py` had nothing to compare
against. To get a layout score, add screenshots from your own phone to
`replica/screens/` (same names as `replica/clone-screens/`) and run:

```bash
python3 .claude/skills/replica-diff/imgdiff.py replica/screens/S01-feed.png replica/clone-screens/S01-feed.png --out replica/diffs/S01.png
```

## Missing, in build order

1. [must] Reminders: run on a device and tick the manual checklist in `test-plan.md`.
2. [should] Home-screen widget and in-app widget settings (native WidgetKit target).
3. [should] Share as an image: confirm on a device.
4. [could] Lock-screen widget, photo backgrounds, alternate app icons, reading counter, languages.

## Behaviour

| flow | original | clone | fix or keep |
| --- | --- | --- | --- |
| F01 read + like | swipe, heart | swipe, heart or double tap | keep |
| F03 switch category | 2 taps | 2 taps | keep |
| F04 change theme | 2 taps | 2 taps | keep |
| F06 reminders | in onboarding and settings | same | verify on a device |
| Premium | paywall gates categories, themes, reminders | everything is free | replica-backend + replica-entrepreneur decide |

## Brand sweep

`sweep.py --avoid "Monkey Taps,Motivation - Daily quotes,Self Growth Essentials,monkeytaps" --domains "monkeytaps.app,monkeytaps.net,motivation.app"`:
**clean**. The name, icon, quotes and copy are all our own.
