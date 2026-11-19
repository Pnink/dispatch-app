# Build log: Quotidian

| screen | date | state | missing | harder than expected |
| --- | --- | --- | --- | --- |
| shell, store, tokens | 2026-11-19 | done | | Expo's version API and docs host are blocked from this session; worked from the SDK 58 type definitions in node_modules |
| S01 feed | 2026-11-19 | done | quote counter | keeping the order stable while liking and opening modals: the order now lives in the store and only changes when the user picks a feed |
| S02 onboarding | 2026-11-19 | done | | |
| S03 categories, mix, search | 2026-11-19 | done | | |
| S04 themes | 2026-11-19 | done | photo backgrounds | |
| S05 theme editor | 2026-11-19 | done | | |
| S06 profile | 2026-11-19 | done | change app icon | |
| S07 favorites | 2026-11-19 | done | | |
| S08 own quotes | 2026-11-19 | done | | Alert buttons are a no-op on web; confirm uses `window.confirm` there |
| S09 reminders | 2026-11-19 | partial | device test | notifications cannot run on web or in this container |
| S10 history | 2026-11-19 | done | | |
| S11 widgets | | not built | everything | needs a native WidgetKit extension and a development build (`npx expo run:ios` or EAS) |
| S12 premium | | skipped | | replica-backend: RevenueCat or StoreKit with the user's own products |
