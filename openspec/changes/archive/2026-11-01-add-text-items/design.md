# Design

## Context

For the motivation, see `proposal.md` (Why). The requirements are in `specs/` (item-creation, timeline-feed, item-storage, and the app-shell and app-theming deltas). Current state, as checked in the repo:

- **Shell:** `src/app/_layout.tsx` renders `AppHeader`, `Tabs` from `expo-router/js-tabs` with `FooterTabBar`, and `CreateButton`. `CreateButton` is absolutely positioned, has no props, and its `onPress` is a no-op. `src/app/index.tsx` renders `PlaceholderScreen` ("Timeline", "Coming soon."). JS tabs keep visited screens mounted.
- **Project rules that shape this design:**
  - React Compiler is on: no manual `useMemo`/`useCallback`, and no `setState` inside effects (lint rule `react-hooks/set-state-in-effect`).
  - Colors come only from `src/constants/design-system.json` through `useTheme()`. Sizes come from tokens and `Layout`.
  - Touch targets are at least 44 pt.
  - Expo Go only.
  - Routes only in `src/app/`. Native modules are swapped in `src/test-utils/jest-setup.ts`, and app code never changes for tests.
- **No persistence and no domain code exist yet.**
- **Facts checked for this change:**
  - SDK 58 docs: `expo-sqlite` and `expo-crypto` are "Included in Expo Go".
    - `expo-sqlite` offers `openDatabaseSync`, `execAsync`, `runAsync`, `getAllAsync` and `getFirstAsync`, plus two transaction helpers. `withTransactionAsync` is not exclusive. `withExclusiveTransactionAsync` runs only the queries made through its `txn` object.
    - The docs show the `PRAGMA user_version` migration pattern.
    - `expo-crypto` `randomUUID()` returns a version 4 UUID.
  - Node 24.21.0 is installed. Its `node:sqlite` `DatabaseSync` bundles SQLite 3.53.4. A throwaway Jest test under the project's `jest-expo` preset passed. It created this design's schema (including the partial index), inserted and joined rows, and read and wrote `PRAGMA user_version`. Jest 30's resolver treats `node:sqlite` as a core module.
  - `@types/node` 26.6.6 is installed transitively, through Jest, and includes `sqlite.d.ts`. `tsconfig.json` sets `"types": ["jest"]`.
  - expo-router 58 exports `usePathname`, `useFocusEffect` and `useIsFocused`.
  - React Native 0.88:
    - `BackHandler.addEventListener('hardwareBackPress', handler)` returns `{ remove }`. No BackHandler Jest mock ships.
    - `Modal` supports `onRequestClose`, `statusBarTranslucent` and `navigationBarTranslucent`.
  - Contrast:
    - White on `#0084ff` is 3.66:1, which fails AA for 15 pt bold text.
    - `onPrimary` on `primaryBlueHover` is 4.75:1 (light) and 9.05:1 (dark).
    - `textMain` on `creationBg` is 16.54:1 and 14.41:1.

## Goals / Non-Goals

**Goals:**
- A storage design that image and event items, owners and sharing can extend through migrations rather than rewrites.
- Domain and use-case code with no React, Expo or SQL imports.
- The same SQL and migrations, run in Jest and on the phone.
- UI state that follows the React Compiler rules, with no setState in effects.

**Non-Goals:**
- Editing, deleting, sharing, owners or contacts, and creating events or images. Their buttons and options exist but do nothing.
- Keeping the draft across app restarts.
- Search, pagination beyond `FlatList` virtualization, and truncating long cards.
- Device automation (Maestro), an ORM, sync or conflict handling.
- Setting up i18n. The new copy is Spanish, and the app-language question stays open.

## Decisions

### D1. Local storage with `expo-sqlite`

There is one database file, `blueshare.db`, opened with `openDatabaseSync` once per app session.

Why:
- It runs in Expo Go, with the same API on Android and iOS.
- It gives real queries: ordering, filtering out deleted items, and joining per-type tables.
- It gives transactions and versioned migrations, which items will need when sharing arrives.

Alternatives:
- `AsyncStorage` or `expo-sqlite/kv-store`. Key-value storage would hold the whole timeline as one blob, with no queries, and rewrite everything on each save.
- A JSON file. Same problem, plus atomic writes done by hand.
- Drizzle ORM on top of `expo-sqlite`. It gives a typed schema and migrations, but it adds a dependency and a Babel plugin for `.sql` files. The repository port already hides SQL, so Drizzle can still be adopted inside the adapter later.
- A remote backend: the product has no server.

### D2. Schema: a base table plus one table per type

```sql
-- migration 1
CREATE TABLE items (
  id         TEXT PRIMARY KEY NOT NULL,                              -- UUID v4
  type       TEXT NOT NULL CHECK (type IN ('text', 'image', 'event')),
  created_at INTEGER NOT NULL,                                       -- UTC ms
  updated_at INTEGER NOT NULL,                                       -- UTC ms
  deleted_at INTEGER                                                 -- NULL = not deleted
);
CREATE INDEX items_timeline ON items (created_at DESC) WHERE deleted_at IS NULL;
CREATE TABLE text_items (
  item_id TEXT PRIMARY KEY NOT NULL REFERENCES items (id) ON DELETE CASCADE,
  body    TEXT NOT NULL
);
```

- **Timeline query:** `SELECT i.id, i.type, i.created_at, i.updated_at, i.deleted_at, t.body FROM items i LEFT JOIN text_items t ON t.item_id = i.id WHERE i.deleted_at IS NULL ORDER BY i.created_at DESC, i.rowid DESC`. Each later type adds its own `LEFT JOIN`. The `rowid` tie-break keeps insertion order for items created in the same millisecond.
- **Times are integers (UTC milliseconds).** They sort and compare cheaply, need no time-zone parsing, and fit safely in a JS `number`.
- **IDs are UUID v4 strings generated on the phone.** Items will travel between phones over Bluetooth with no server to hand out IDs.
- **No SQL CHECK on the body length.** The limit is a configurable value (D9) enforced in the domain, so changing it needs no migration.
- **Foreign keys:** each driver runs `PRAGMA foreign_keys = ON` when it opens the database, since SQLite turns them off by default.
- **Later, not now:**
  - an `owner_id` column, with a `people (id, display_name, original_name, is_me)` table
  - `item_shares (item_id, person_id, shared_at)`
  - `image_items`, `event_items` and `event_photos`

  Owner names live on `people`, not as copies on each item, so a rename does not leave stale copies.

Alternatives:
- One `items` table with nullable columns for every type. It gets sparse, and the CHECKs grow tangled as types are added.
- One table with a JSON `payload` column. There are no column types or constraints. Revisit only if the sharing protocol ends up sending whole items as blobs.

### D3. Hexagonal module in `src/items/`

```
src/items/
  domain/                      no React, Expo or SQL imports
    item.ts                    ItemType, ItemMeta { id, type, createdAt, updatedAt, deletedAt }
    text-item.ts               TextItem; normalizeTextBody(raw) -> trimmed text or InvalidTextError
    timeline-item.ts           TimelineItem = TextItem   (a union that grows with image/event)
    ports.ts                   ItemRepository, Clock, IdGenerator
    errors.ts                  InvalidTextError
  application/
    create-text-item.ts        createTextItem(deps)(rawText): Promise<TextItem>
    list-timeline.ts           listTimeline(deps)(): Promise<TimelineItem[]>
    timeline-store.ts          external store read by the UI (D5)
    items-module.ts            createItemsModule(adapters) wires repository, use cases and store
  infrastructure/
    sql-database.ts            SqlExecutor / SqlDatabase ports (D4)
    migrations.ts              MIGRATIONS and migrate(db, steps = MIGRATIONS)
    sqlite-item-repository.ts  ItemRepository over SqlDatabase
    expo-sql-database.ts       expo-sqlite driver
    app-adapters.ts            createAppAdapters(): { db, ids, clock }   <- the one module Jest swaps
```

- **Dependency rule:** domain ← application ← infrastructure. UI code (components and hooks) reaches the items module only through the provider and hooks (D5). Only `expo-sql-database.ts` and `app-adapters.ts` import Expo packages.
- **Ports:**
  - `ItemRepository`: `saveText(item): Promise<void>` and `listTimeline(): Promise<TimelineItem[]>`
  - `Clock`: `now(): number`
  - `IdGenerator`: `newId(): string`

  Clock and IdGenerator make the use cases deterministic in tests.
- **Only what this change uses.** Update and soft-delete methods arrive with "Editar" in the next change. The columns already exist, so that change needs no migration.
- **A folder per module, not a top-level `src/domain/`.** Contacts and sharing will be their own modules next to `items/`. Routes stay in `src/app/`, and components and hooks stay in their usual folders.

Alternatives:
- Hooks that call `expo-sqlite` straight from components. Fast to write, but Jest can't test it and the UI gets tied to the storage.
- Classes with a DI container. Too heavy for this size.

### D4. The database driver is injected: Expo in the app, `node:sqlite` in Jest

```
 migrate(), SqliteItemRepository  --- depend on --->  SqlDatabase (port)
                                                        ^          ^
                       ExpoSqlDatabase (the app) -------+          +------- NodeSqlDatabase (Jest)
                       src/items/infrastructure/                            src/test-utils/
```

```ts
type SqlValue = string | number | null;
interface SqlExecutor {
  exec(sql: string): Promise<void>; // several statements, migrations only
  run(sql: string, params?: SqlValue[]): Promise<void>;
  getAll<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  getFirst<T>(sql: string, params?: SqlValue[]): Promise<T | null>;
}
interface SqlDatabase extends SqlExecutor {
  transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T>;
}
```

- **Expo driver:**
  - Opens with `openDatabaseSync('blueshare.db')` and runs `PRAGMA foreign_keys = ON`.
  - Maps the methods to `execAsync`, `runAsync`, `getAllAsync` and `getFirstAsync`.
  - `transaction` uses `withExclusiveTransactionAsync((txn) => work(wrap(txn)))`, so only the transaction's own queries run inside it.
- **Node driver:**
  - Uses `new DatabaseSync(':memory:')` by default, prepared statements, and `PRAGMA foreign_keys = ON`.
  - `transaction` wraps `work` in `BEGIN` / `COMMIT` / `ROLLBACK`. Results are returned as resolved promises.
- **Shared SQL rules:** only positional `?` parameters, because the drivers handle named-parameter prefixes differently. Only SQL features both bundled SQLite versions support. The device check logs `sqlite_version()` once.
- **Injection points:**
  1. Unit tests create `new NodeSqlDatabase()` and pass it straight to `migrate`, the repository or `createItemsModule`. For the all-or-nothing test, a wrapper driver throws on a chosen statement.
  2. Whole-app tests render `_layout.tsx`, which calls `createAppAdapters()`. `jest-setup.ts` replaces `@/items/infrastructure/app-adapters` with a version that returns a fresh `NodeSqlDatabase`, `randomUUID` from `node:crypto`, and `Date.now`. Each render gets an empty database, so tests never share data.
- **Metro never bundles the Node driver:** only `src/test-utils/` and `jest-setup.ts` import it.
- **Types:**
  - `node-sql-database.ts` starts with `/// <reference types="node" />`. Adding `"node"` to the tsconfig `types` would leak Node globals (`process`, `Buffer`) into app code.
  - `@types/node` becomes a direct dev dependency, so it doesn't disappear if Jest stops pulling it in.
- **Node version:** `package.json` gets `"engines": { "node": ">=22.13" }`, the first release where `node:sqlite` needs no flag.
- **No in-memory fake repository:** the real SQL runs in Jest.

Alternatives:
- `better-sqlite3`: mature, but it's a native addon compiled for each Node version, so installs can break when no prebuilt binary exists.
- `sql.js`: WebAssembly, async init, slower, and another dependency.
- Mocking `expo-sqlite`: that tests the mock, not the SQL.
- An in-memory fake repository: it never runs the SQL or the migrations.

### D5. UI state with no setState in effects

Two pieces of state live above the tabs, provided by components that `_layout.tsx` renders around the shell.

1. **Timeline store** (`application/timeline-store.ts`): a plain object with `subscribe`, `getSnapshot` and `createText(raw)`.
   - The snapshot is `{ status: 'loading' | 'ready' | 'error', items: TimelineItem[] }`. It is a new object only when something changes, as `useSyncExternalStore` requires.
   - The first `subscribe` starts `migrate()`, then `listTimeline()`.
   - `createText` waits for the load, runs the use case, puts the new item first and notifies subscribers. On failure it rejects, and the creation box shows the error.
   - Components read it through `useTimeline()`, which calls `useSyncExternalStore`.
2. **Creation box state:** a reducer in `CreationBoxProvider`, read through `useCreationBox()`.

   ```
   CreationState =
     | { step: 'closed' }
     | { step: 'choose'; type: ItemType | null }
     | { step: 'write'; text: string; saving: boolean; failed: boolean }
   plus openCount: number    (goes up on every open; used for scroll-to-top, D7)

   open            closed -> choose(null), openCount + 1
   chooseType(t)   choose -> choose(t)
   confirmType     choose('text') -> write(''); with 'event' or 'image' nothing changes
   setText(s)      write -> write(s), failed cleared
   saveStarted     write -> saving = true
   saveFailed      write -> saving = false, failed = true
   close           any -> closed   (Cancelar, back button, or a successful Crear)
   ```

   Because the state lives above the tabs, switching tabs keeps the draft, and the `+` button in the layout can read `step`.
- `ItemsProvider` creates the module once with a lazy initializer, `useState(() => createItemsModule(createAppAdapters()))`. No effect is involved.

Alternatives:
- `useEffect` + `setState` to load: forbidden by the lint rule.
- React 19 `use(promise)` with Suspense: it covers the first load, but refreshing after a create would need a second mechanism.
- TanStack Query: a dependency for an offline app.
- The `expo-sqlite` change listener: not needed while the app is the only writer. Revisit when items arrive over Bluetooth.

### D6. The `+` button acts per route

`CreateButton` keeps its look. A new hook, `useCreateAction()` in `src/hooks/`, gives it `{ visible, onPress }` from `usePathname()` and the creation box state:

| Pathname | Box | Visible | Press does |
| --- | --- | --- | --- |
| `/` | closed | yes | `open()` |
| `/` | open | no (not rendered) | – |
| `/circles` | any | yes | nothing yet (pairing comes later) |
| `/events` | any | yes | nothing yet (event creation comes later) |

Not rendering the button while it's hidden also takes it out of the accessibility tree.

Alternative: each screen registers its action in a context when it gains focus. That's more decoupled, but it needs a focus effect that sets state, which breaks the effect rule, and it creates ordering problems between screens. A map of three routes is enough.

### D7. Timeline screen: list, scroll, back button, keyboard

- **`TimelineFeed`** renders a `FlatList` of `TextItemCard`.
  - `ListHeaderComponent` is the `CreationBox` when the box is open.
  - The empty message shows only when `status === 'ready'`, there are no items and the box is closed.
  - The error message shows when `status === 'error'`.
  - The content has `Spacing.lg` padding on `backgroundMain`.
  - A `FlatList`, not a `ScrollView`, because the feed has no upper bound.
  - `src/app/index.tsx` renders `<TimelineFeed />`. `PlaceholderScreen` stays for Circles and Events.
- **Scroll to top:** an effect keyed on `openCount` calls `listRef.current?.scrollToOffset({ offset: 0, animated: true })`. This is an imperative call, not a state change.
- **Back button:**
  - While Timeline has focus (`useIsFocused()`) and the box is open, an effect adds a `hardwareBackPress` listener that dispatches `close` and returns `true`. Its cleanup removes the listener.
  - Listeners run newest first, so this one runs before React Navigation's.
  - When the type list `Modal` is open, the Modal's `onRequestClose` gets the back press and closes only the list.
  - On other tabs nothing is registered, so the JS tabs default (back to Timeline) runs.
- **Keyboard:**
  - `keyboardShouldPersistTaps="handled"`, so "Crear" and "Cancelar" work on the first tap while the keyboard is up.
  - The text area uses `autoFocus`. It mounts only when entering the write step, so returning from another tab, while the screen stays mounted, doesn't refocus it.
  - The text area height is capped (`Layout.textAreaMaxHeight`), so the buttons stay above the keyboard on a 780-pt-tall screen.
  - `Keyboard.dismiss()` runs after a successful Crear and on Cancelar.
- **Stable header component:** the list header must keep the same component type between renders. A new inline component type would remount the `TextInput` and drop focus on every keystroke.

### D8. A custom type select

`TypeSelect` is a 44-pt `Pressable` field:
- It is announced as a button labeled "Crear nuevo elemento". Its `accessibilityValue` text is the selection, or the placeholder.
- It shows the selection and a `▾` glyph.

Tapping it opens a transparent `Modal` (`animationType="fade"`, `statusBarTranslucent`, `navigationBarTranslucent`, and `onRequestClose` closes it):
- an `overlay` backdrop that closes the list when tapped
- a sheet styled like a card, listing the three options as rows at least `Layout.optionRowHeight` tall
- each row has `accessibilityRole="radio"` with a `checked` state, and the selected one shows `✓` on `creationBg`
- the placeholder is never an option

The option list (emoji and label mapped to `ItemType`) lives in the UI.

Alternatives:
- `@react-native-picker/picker`. It's in Expo Go, but:
  - on iOS it draws a wheel about 200 pt tall inside the box
  - on Android the closed field is hard to style
  - a disabled placeholder item only works on Android
  - it looks different on each platform, against the product principle
- Three large buttons instead of a select plus Guardar. One tap instead of three, but the user kept the sketch's select.

### D9. Text limit and normalization

- `src/constants/limits.ts` holds `export const TEXT_MAX_LENGTH = 8192;`, the single setting.
- The text area uses `maxLength={TEXT_MAX_LENGTH}`.
- The domain's `normalizeTextBody` trims the text and throws `InvalidTextError` when the result is empty or longer than `TEXT_MAX_LENGTH`, whatever its source (later, items received over Bluetooth too).
- Length is the JS string length (UTF-16 code units), the same unit `TextInput.maxLength` counts, so an emoji can count as 2. That's acceptable at 8192, and it gets documented.
- "Crear" is enabled when `text.trim().length > 0`.

### D10. Buttons, colors and new tokens

Button variants, with box buttons in `src/components/box-button.tsx` and card actions inside `text-item-card.tsx`:

| Variant | Background | Border | Label | Used by |
| --- | --- | --- | --- | --- |
| primary | `primaryBlueHover` | none | `onPrimary`, `FontSize.body` bold | Guardar, Crear |
| primary, disabled | the same, with view opacity `Layout.disabledOpacity` | none | the same | Guardar or Crear while disabled |
| secondary | `surfaceMuted` | 2 pt `borderDark` | `textMain`, `FontSize.body` bold | Cancelar |
| card action | `surfaceMuted` | 1 pt `borderDark`, `Radius.sm` | `textMain`, `FontSize.small` bold | Editar, Compartir |

- **Every variant:**
  - at least `Layout.touchTarget` tall, with a `Layout.controlRadius` corner radius, except card actions
  - press feedback at opacity 0.8
  - `accessibilityRole="button"`, an `accessibilityLabel` equal to the visible text, and `accessibilityState={{ disabled }}`
- **The disabled style is a faded primary, not gray,** so a disabled Guardar never looks like the gray Cancelar next to it. Disabled labels are exempt from contrast rules (app-theming delta).
- **The Cancelar border is decorative.** `borderDark` on `creationBg` is about 1.4:1, the same as the inactive tab border. The label identifies the button. The visual review checks it.
- **Contrast pairs added to `theme-test.ts`:**
  - `textMain` on `creationBg` (box title)
  - `onPrimary` on `primaryBlueHover` (Guardar and Crear; already tested as the active tab label)
  - `textMain` on `surfaceMuted` (Cancelar and the card actions)
  - `textSecondary` on `cardBg` (card text)
  - `textSecondary` on `backgroundMain` (empty and error messages)
  - `textMain` on `cardBg` (select text, options, text area)
  - `primaryDark` on `cardBg` (select and text area border)
  - `textMain` on `creationBg` (save error)
- **New color roles,** in both palettes in `design-system.json`:

  | Role | Light | Dark | Use |
  | --- | --- | --- | --- |
  | `card_shadow` | `rgba(15, 23, 42, 0.04)` (mock) | `rgba(2, 6, 23, 0.5)` | card `boxShadow` |
  | `divider` | `#f1f5f9` (mock) | `#1e293b` | the line above the card action row |
  | `overlay` | `rgba(15, 23, 42, 0.5)` | `rgba(2, 6, 23, 0.7)` | type list backdrop |
- **New `Layout` keys** in `theme.ts`, starting values tuned in the visual review:
  - `creationGap: 10`: the mock's space between controls and between the two buttons
  - `textAreaMinHeight: 96`: about three lines plus padding
  - `textAreaMaxHeight: 200`
  - `cardTextLineHeight: 22.5`: 15 × 1.5
  - `hairlineWidth: 1`: the divider and the card action border
  - `optionRowHeight: 56`
  - `disabledOpacity: 0.45`

  Radii reuse `Radius.lg` (box, card, sheet), `Radius.sm` (card actions) and `Layout.controlRadius` (select, text area, box buttons).

### D11. Copy and accessibility labels

- **Copy:** all new visible text is Spanish, from the sketches and the specs.
- **Labels:** each new control's label equals its visible text (WCAG 2.5.3, label in name), so voice control works. The select's label is its heading, "Crear nuevo elemento". Existing English labels ("Create", "Menu", "Search") stay. The app-language question stays open in the known limitations.
- **Announcements:** the save and load error messages use `accessibilityLiveRegion="polite"` on Android and `AccessibilityInfo.announceForAccessibility` on iOS.

### D12. Components, hooks and wiring

- **Components** (`src/components/`):
  - `items-provider.tsx`
  - `creation-box-provider.tsx`
  - `creation-box.tsx`: both steps
  - `type-select.tsx`
  - `box-button.tsx`
  - `text-item-card.tsx`
  - `timeline-feed.tsx`
- **Hooks** (`src/hooks/`): `use-timeline.ts`, `use-creation-box.ts` and `use-create-action.ts`.
- **`_layout.tsx`:** inside `ThemeProvider`, wraps the header, tabs and create button in `ItemsProvider`, then `CreationBoxProvider`.
- **`CreateButton`:** keeps its spec'd look and reads `useCreateAction()`.

## Risks / Trade-offs

- [`node:sqlite` is still experimental in Node. It may print an `ExperimentalWarning`, and its API may change.] → It's isolated in one file in `src/test-utils/`, Node is pinned with `engines`, and `better-sqlite3` can stand in behind the same port.
- [The SQLite in Node and the one in `expo-sqlite` may differ.] → Plain SQL, positional parameters, and a device check that logs the version and runs the persistence check.
- [During development, the database lives inside Expo Go's data. Clearing Expo Go or reinstalling it deletes the items.] → Document this in the known limitations. A development or store build keeps its own data.
- [With long texts on Android edge-to-edge, the keyboard may cover "Crear".] → The capped text area height, the box at the top of the list and `keyboardShouldPersistTaps`, all checked on the emulator. If that isn't enough, a follow-up scrolls to keep the buttons visible.
- [The text field could lose focus while typing if the list header remounts.] → A stable header component, checked on the device. Jest can't see focus reliably.
- [The back button might reach React Navigation first.] → Listeners run newest first. A Jest test spies on `BackHandler.addEventListener` and calls the registered handler, and the emulator check confirms it.
- [Very long cards (8192 characters) make the feed heavy.] → `FlatList` virtualization. A "Ver más" fold is a later UX decision.
- [In development, React may call the lazy initializer twice and open two connections.] → Harmless: same file, and only one module is kept.
- [The approved Timeline reference screenshots no longer match.] → Re-approve them in the visual review.
- [`basic-app-layout` is still not archived, though its specs are already synced.] → Archive it before archiving this change, so the app-shell and app-theming deltas apply on top of the current text.

## Migration Plan

- The first launch creates schema version 1 (`user_version` goes from 0 to 1). There is no earlier data.
- Later changes append steps (2, 3, …) to `MIGRATIONS` and never edit a step that has shipped. Each step runs in one transaction, together with its `user_version` bump.
- Rollback: revert the code. Older builds never open `blueshare.db`. During development, clear Expo Go's data to reset the database.

## Open Questions

- The exact disabled opacity, the text area's maximum height and the dark `card_shadow` value get tuned in the visual review, with no spec change.
- Whether very long texts later need a "Ver más" fold. That's a future UX decision.
