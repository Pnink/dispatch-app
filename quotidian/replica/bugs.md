# Bugs: Quotidian

Only bugs reproduced in this session. All found by replica-test and fixed;
each fix is covered by a test that now passes.

| ID | sev | where | bug | status |
| --- | --- | --- | --- | --- |
| B1 | S1 | all screens, web | Crash on load: `useAnimatedValue` is not exported by react-native-web | fixed: local `src/hooks/useAnimatedValue.ts` |
| B2 | S3 | S04, S02 | Selected theme's name was cream on cream, unreadable | fixed in `ThemeCard` |
| B3 | S2 | S03, S04, S05, S09 | Selection state (checked / selected) never reached screen readers on web; axe `aria-required-attr` | fixed: `role` + `aria-checked` / `aria-disabled` |
| B4 | S3 | S03, S08, S09 | Opened from a direct link, picking or saving left you stuck on the screen (no history to go back to) | fixed: `goBack()` falls back to the feed |
| B5 | S4 | S09 | Dimmed controls failed contrast with no disabled state | fixed: `aria-disabled` on the dimmed group |
| B6 | S4 | S05 | Preview card had no edge when its background matched the screen | fixed: border |
| B7 | S4 | S06 | Reminder detail wrapped onto two lines | fixed: shorter detail |
| B8 | S4 | tests | Same test id twice once an endless feed looped | fixed: page ids include the round |

Open: none. To check on a device: see the manual list in `test-plan.md`.
