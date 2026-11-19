# Architecture: Quotidian (a rebuild of Motivation - Daily quotes' core features)

The original keeps everything on the device: no account, no sign-in. The
clone does the same. There is no server, so there is no SQL schema; the
"database" is one versioned JSON document in AsyncStorage.

## Stack

| layer | choice | why |
| --- | --- | --- |
| app | Expo SDK 58 + React Native 0.88 + TypeScript | one codebase for iOS, Android and web; runs in Expo Go on the user's iPhone with no Mac |
| navigation | Expo Router (file routes in `src/app/`) | stack + modal sheets, real URLs on web for tests |
| storage | `@react-native-async-storage/async-storage` | local, survives restarts, localStorage on web |
| styling | `StyleSheet` + tokens in `src/theme/tokens.ts` | no extra runtime; values come from `replica/design/tokens.json` |
| backgrounds | `expo-linear-gradient` | gradient themes without shipping images |
| fonts | `@expo-google-fonts/*` (Lora, Playfair Display, Inter, Caveat, DM Mono) | all SIL Open Font License |
| icons | Feather via `@expo/vector-icons` | MIT |
| reminders | `expo-notifications` local daily triggers | works in Expo Go on iOS; no push server needed |
| sharing | `react-native-view-shot` + `expo-sharing`; text share and clipboard fallback | share the themed card as an image |
| payments | none yet | replica-backend: RevenueCat or StoreKit with the user's own products |
| widgets | none yet | needs a native WidgetKit target in a development build |
| hosting | static web export (`expo export -p web`) for previews; EAS Build for the stores | |

## Data (on device)

```ts
type Stored = {
  version: 1;
  profile:   { name: string; goals: CategoryId[]; onboarded: boolean };
  feed:      { mode: 'category' | 'mix'; categoryId: FeedSource; mix: CategoryId[] };
  themeId:   string;                    // built-in id or 'custom'
  custom:    CustomTheme;               // background, font, text colour, size, align
  favorites: { quoteId: string; at: number }[];
  own:       { id: string; text: string; author?: string; createdAt: number }[];
  history:   { quoteId: string; at: number }[];   // newest first, capped at 500
  reminders: { enabled: boolean; perDay: number; start: number; end: number; source: FeedSource };
};
```

Quotes ship in `src/data/quotes.ts` (id, text, author?, categories[]).
`FeedSource` is a topic id or one of `all`, `favorites`, `own`, `history`.

Access rules: single user, single device. Nothing leaves the phone except
what the user shares.

## API

None. Everything is a local function in `src/state/store.tsx`:

| function | does | flow |
| --- | --- | --- |
| `toggleFavorite(id)` | add or remove a favorite | F01 |
| `markSeen(id)` | push to history (deduped, capped) | F01 |
| `setFeedSource(src)` / `setMix(ids)` | what the feed shows | F03 |
| `setTheme(id)` / `saveCustomTheme(t)` | look of the feed | F04 |
| `addOwn / updateOwn / deleteOwn` | own quotes | F05 |
| `setReminders(plan)` | stores the plan, reschedules notifications | F06 |
| `completeOnboarding(profile)` | first launch | F07 |

Jobs: reminders are N daily local notifications spread evenly between the
start and end time, each with a quote from the chosen source. Rescheduled
whenever the plan, the favorites or the own quotes change.

## The parts that bite

- time zones: daily triggers use the device's local clock, so travel just works.
- iOS limit: at most 64 pending local notifications. The cap of 20 a day is well under it.
- permissions: denied stays denied; the reminders screen says so and links to Settings.
- web: no notifications, no image capture. Text share, then clipboard.
- paging: a vertical `FlatList` with `pagingEnabled` and a measured page
  height, so every quote is exactly one screen on phones and on the web.
- storage migrations: `version` field; unknown versions fall back to defaults.

## Build order

1. Vertical slice: S01 feed with the built-in quotes and the default theme, like + share.
2. Must-haves: S03 categories, S04 themes, S07 favorites, S09 reminders, S02 onboarding, persistence.
3. Should-haves: mix, search, S08 own quotes, S10 history, S05 theme editor, share as image, name.
4. Later: widgets (native target), premium (replica-backend), fixes from replica-entrepreneur.
