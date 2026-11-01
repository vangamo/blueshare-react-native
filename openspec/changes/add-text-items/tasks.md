# Tasks

Before writing code that touches an Expo or React Native API, check the v58 docs (https://docs.expo.dev/versions/v58.0.0/), as CLAUDE.md asks. The facts already checked are listed in design.md (Context).

Each task that creates or changes TS/TSX code is done only when these pass:
- `npx expo lint --max-warnings 0`
- `npx tsc --noEmit`
- `npm test`

No new `eslint-disable`, `.only` or `.skip`. Tests go in `src/__tests__/unit/<area>/` (new area: `items/`) or `src/__tests__/e2e/`. Shared helpers go in `src/test-utils/`.

## 1. Dependencies and Node version

- [ ] 1.1 Run `npx expo install expo-sqlite expo-crypto`. Verify that `package.json` lists both at SDK 58 versions and that `npx expo install --check` and `npx expo-doctor` pass.
- [ ] 1.2 Run `npx expo install @types/node -- --dev`, and add `"engines": { "node": ">=22.13" }` to `package.json` (design D4). Verify that `npm ls @types/node --depth=0` lists it and that `node -e "require('node:sqlite')"` exits 0.
- [ ] 1.3 Update `docs/development/dependencies.md` and `docs/decisions/kept-dependencies.md`:
  - add `expo-sqlite` and `expo-crypto` (both in Expo Go) and `@types/node` (dev)
  - add the Node ≥ 22.13 requirement for `node:sqlite` in tests

  Then start a dated entry for this change in `docs/log.md`. Verify that every relative link in the edited files resolves.

## 2. Tokens and the text limit

- [ ] 2.1 Add the color roles `card_shadow`, `divider` and `overlay` to both `colors` and `colors_dark` in `src/constants/design-system.json`, with the values from design D10. Verify that `npx tsc --noEmit` passes (dark is typed as `ThemeColors`) and that `design-system-test.ts` passes.
- [ ] 2.2 Add the `Layout` keys from design D10 to `src/constants/theme.ts`: `creationGap`, `textAreaMinHeight`, `textAreaMaxHeight`, `cardTextLineHeight`, `hairlineWidth`, `optionRowHeight` and `disabledOpacity`. Verify that `theme.ts` still has no color literals (`grep -nE "#[0-9a-fA-F]{3,8}|rgba?\(" src/constants/theme.ts` prints nothing).
- [ ] 2.3 Create `src/constants/limits.ts` exporting `TEXT_MAX_LENGTH = 8192` (design D9). Verify with a unit test in `src/__tests__/unit/constants/limits-test.ts`.
- [ ] 2.4 Add the contrast pairs from design D10 to `src/__tests__/unit/constants/theme-test.ts`. Verify that `npm test` passes for both palettes. If a pair fails, adjust the token (both palettes) and record why.
- [ ] 2.5 Update the docs and add a line to the log entry:
  - `docs/design-system/color-palettes.md`: the new roles and the new checked pairs with their ratios
  - `docs/design-system/layout-sizes.md`: the new `Layout` keys
  - `docs/design-system/design-tokens.md`: the new roles in "Differences"

  Verify that the links resolve.

## 3. Items domain

- [ ] 3.1 Create `src/items/domain/`: `item.ts` (`ItemType`, `ItemMeta`), `text-item.ts` (`TextItem`, `normalizeTextBody`), `timeline-item.ts`, `ports.ts` (`ItemRepository` with `saveText` and `listTimeline`, plus `Clock` and `IdGenerator`) and `errors.ts` (`InvalidTextError`), as in design D3. Verify that `grep -rnE "from '(react|react-native|expo)" src/items/domain` prints nothing.
- [ ] 3.2 Write `src/__tests__/unit/items/domain/text-item-test.ts` (item-storage spec, "Text item content"). It covers trimming `"\n  Hola\nabuela  \n"` to `"Hola\nabuela"`, rejecting blank text, accepting exactly `TEXT_MAX_LENGTH` characters and rejecting one more. Verify that `npm test` passes.
- [ ] 3.3 Create `src/items/CLAUDE.md` with the module's local rules:
  - the domain ← application ← infrastructure dependency rule
  - Expo imports only in `expo-sql-database.ts` and `app-adapters.ts`
  - migrations are append-only
  - pointers to the architecture page from 4.7

  Verify that it is under 20 lines and that its links resolve.

## 4. Storage infrastructure and driver injection

- [ ] 4.1 Create `src/items/infrastructure/sql-database.ts` with `SqlValue`, `SqlExecutor` and `SqlDatabase` (design D4). Verify with `npx tsc --noEmit`.
- [ ] 4.2 Create `src/test-utils/node-sql-database.ts`, a `NodeSqlDatabase` over `node:sqlite`:
  - `/// <reference types="node" />` at the top
  - `:memory:` by default, with `PRAGMA foreign_keys = ON`
  - prepared statements with positional parameters
  - `transaction` with `BEGIN`/`COMMIT`/`ROLLBACK`

  Write `src/__tests__/unit/items/infrastructure/node-sql-database-test.ts`, covering run, getAll and getFirst, a commit, a rollback when `work` throws, and that foreign keys are enforced. Verify that `npm test` passes, and that `tsconfig.json` `types` still lists only `jest`.
- [ ] 4.3 Create `src/items/infrastructure/migrations.ts` with `MIGRATIONS` (step 1 is the schema from design D2) and `migrate(db, steps = MIGRATIONS)`. It reads `PRAGMA user_version` and runs each missing step and its version bump in one transaction. Write `migrations-test.ts` on `NodeSqlDatabase`, following the item-storage spec "Schema upgrades keep data":
  - a fresh database ends at version 1 with the tables and index
  - an up-to-date database runs no step
  - an extra test step 2 runs once and keeps the existing items
  - a failing step leaves both the version and the data unchanged

  Verify that `npm test` passes.
- [ ] 4.4 Create `src/items/infrastructure/sqlite-item-repository.ts`. `saveText` writes `items` and `text_items` in one transaction, and `listTimeline` uses the D2 query, mapping rows to `TextItem`. Write `sqlite-item-repository-test.ts`, covering:
  - newest first, including the tie-break for equal `created_at`
  - a row with `deleted_at` set (written by the test) stays in the table but isn't listed
  - all or nothing: a wrapper driver that fails the `text_items` insert leaves no `items` row

  Verify that `npm test` passes.
- [ ] 4.5 Create `src/items/infrastructure/expo-sql-database.ts`:
  - `openDatabaseSync('blueshare.db')` and `PRAGMA foreign_keys = ON`
  - the method mapping, with `withExclusiveTransactionAsync` for `transaction`
  - in `__DEV__`, one `console.log` of `sqlite_version()`

  Also create `src/items/infrastructure/app-adapters.ts`: `createAppAdapters()` returns `{ db, ids, clock }`, with `randomUUID` from `expo-crypto` and `Date.now`. Re-check the v58 `expo-sqlite` and `expo-crypto` pages first. Verify with `npx tsc --noEmit` and lint. Behavior on the device is checked in 9.1.
- [ ] 4.6 In `src/test-utils/jest-setup.ts`, mock `@/items/infrastructure/app-adapters` so `createAppAdapters()` returns a fresh `NodeSqlDatabase`, `randomUUID` from `node:crypto` and `Date.now` (design D4). Verify with a test that `createAppAdapters()` in Jest gives a database answering `SELECT 1` and IDs matching the UUID v4 pattern, and that the existing suites still pass.
- [ ] 4.7 Write `docs/architecture/items-module.md`:
  - the hexagonal layout and dependency rule
  - the ports
  - the driver injection (the app vs Jest)
  - schema v1 and the append-only migration rule
  - the future tables from D2

  List it in `docs/architecture/index.md`. Update `docs/development/testing.md`: the `node:sqlite` driver, the `app-adapters` swap, the `unit/items/` folder, Node ≥ 22.13 and the coverage map. Update `docs/architecture/project-structure.md` with `src/items/`. Add a line to the log entry. Verify that the links resolve.

## 5. Use cases and the timeline store

- [ ] 5.1 Create `src/items/application/create-text-item.ts` and `list-timeline.ts`, which take `{ repository, clock, ids }`. Write tests on `NodeSqlDatabase` with a fixed clock and sequential IDs, covering the item-storage spec "Common item record":
  - type `text`
  - `createdAt === updatedAt`
  - `deletedAt` null
  - the injected ID
  - blank or too-long text rejected with nothing stored

  Verify that `npm test` passes.
- [ ] 5.2 Create `src/items/application/timeline-store.ts` (design D5). It has `subscribe`, `getSnapshot` and `createText`, loads (migrate, then list) on the first subscribe, keeps the snapshot identity stable, and puts new items first. Write `timeline-store-test.ts`, covering:
  - `loading` changes to `ready` with the items
  - `error` when migrating or loading fails (wrapper driver)
  - `createText` waits for the load and prepends
  - a failed `createText` rejects and leaves the items unchanged
  - `getSnapshot` returns the same object while nothing changes

  Verify that `npm test` passes.
- [ ] 5.3 Create `src/items/application/items-module.ts`: `createItemsModule(adapters)` returns `{ store }`. Write a test for the item-storage spec "Items survive restarts": two module instances share one `NodeSqlDatabase`, the first creates "Uno" and "Dos", and the second lists "Dos", then "Uno". Verify that `npm test` passes.
- [ ] 5.4 Add the application layer to `docs/architecture/items-module.md`: the store contract, how the UI reads it, and why there is no setState in effects. Add a line to the log entry. Verify that the links resolve.

## 6. Shared UI state and the `+` button

- [ ] 6.1 Create `src/components/items-provider.tsx` and `src/hooks/use-timeline.ts`:
  - the provider takes an optional `adapters` prop (dependency injection), defaulting to `createAppAdapters()`
  - it creates the module once with a lazy `useState` initializer
  - `useTimeline()` uses `useSyncExternalStore`

  Write `use-timeline-test.tsx` (the status goes from `loading` to `ready` with `[]`, then shows a created item first). Verify that `npm test` passes and that lint reports no `set-state-in-effect`.
- [ ] 6.2 Create `src/components/creation-box-provider.tsx` (the reducer and `openCount` from design D5) and `src/hooks/use-creation-box.ts`. Write reducer tests:
  - open goes to choose with no type
  - chooseType
  - confirmType goes to write only for `text`
  - setText clears `failed`
  - saveStarted and saveFailed
  - close from every step
  - `openCount` goes up on each open

  Verify that `npm test` passes.
- [ ] 6.3 Create `src/hooks/use-create-action.ts` (the design D6 table) and make `CreateButton` use it: hidden means not rendered, and the look is unchanged. In `src/app/_layout.tsx`, wrap the header, tabs and button in `ItemsProvider`, then `CreationBoxProvider`. Update `src/__tests__/unit/components/create-button-test.tsx` (app-shell delta):
  - pressing it on Timeline hides the button
  - pressing it on Circles or Events changes nothing and keeps it visible
  - with the box open on Timeline, the button shows on Events and hides again on Timeline
  - the size, placement and palette tests still pass

  Verify that `npm test` passes.
- [ ] 6.4 Update `docs/components/create-button.md` (per-route action, hidden while creating, its hook) and `docs/architecture/shell-layout.md` (the providers in the tree). Add new pages `docs/components/items-provider.md` and `docs/components/creation-box-provider.md`, list them in `docs/components/index.md`, and add a line to the log entry. Verify that the links resolve.

## 7. Creation box

- [ ] 7.1 Create `src/components/box-button.tsx` with the primary and secondary variants and the disabled state (design D10). Write `box-button-test.tsx`, covering:
  - at least `Layout.touchTarget` tall
  - colors per variant in both palettes
  - disabled: opacity `Layout.disabledOpacity`, `accessibilityState.disabled`, and `onPress` not called
  - the accessibility label equals the visible text

  Verify that `npm test` passes.
- [ ] 7.2 Create `src/components/type-select.tsx` (design D8). Write `type-select-test.tsx`, following the item-creation spec:
  - the placeholder value is "Selecciona una opción"
  - the list has exactly "📅 Evento", "📝 Texto" and "📷 Imagen", in order
  - picking an option updates the value
  - tapping the backdrop, or the Modal's `onRequestClose`, closes only the list and keeps the previous value
  - the label is "Crear nuevo elemento" with the value, and options have their checked state

  Verify that `npm test` passes.
- [ ] 7.3 Create `src/components/creation-box.tsx` with the choose step: dashed `primaryBlue` border, `creationBg`, the title, `TypeSelect`, then "Cancelar" and "Guardar" in a row with `Layout.creationGap` between them. Guardar is disabled until a type is chosen, does nothing for Evento and Imagen, and moves to the write step for Texto. Cancelar dispatches `close`. Write `creation-box-test.tsx` covering those item-creation spec scenarios, and the box style in both palettes. Verify that `npm test` passes.
- [ ] 7.4 Add the write step to `creation-box.tsx`:
  - the title
  - a multi-line `TextInput` with `maxLength={TEXT_MAX_LENGTH}`, `autoFocus`, min and max height, `textAlignVertical="top"` and the label "Crear nuevo elemento de texto"
  - "Cancelar" and "Crear". Crear is disabled while the text is blank and while saving. It calls `store.createText`, then `Keyboard.dismiss()` and `close`.
  - on failure, `saveFailed` and the message "⚠️ No se pudo guardar. Inténtalo de nuevo.", with a live region and announcement

  Extend `creation-box-test.tsx`:
  - Crear disabled for blank or whitespace-only text
  - `maxLength` equals `TEXT_MAX_LENGTH`
  - a double tap creates one item
  - a failing save, through the `adapters` prop with a failing driver, keeps the text and shows the message
  - Cancelar discards, and reopening starts empty

  Verify that `npm test` passes.
- [ ] 7.5 Write `docs/components/creation-box.md`, `type-select.md` and `box-button.md` (styles, behavior, tests, specs), list them in `docs/components/index.md`, and add a line to the log entry. Verify that the links resolve.

## 8. Timeline feed and text cards

- [ ] 8.1 Create `src/components/text-item-card.tsx` (design D10 card styles):
  - the full text with line breaks, at `cardTextLineHeight`
  - the `divider` line
  - "Editar" and "Compartir" as no-op card actions, each with a short comment saying the feature comes later

  Write `text-item-card-test.tsx`, covering the timeline-feed spec:
  - the text is shown with its line breaks
  - the card and text colors in both palettes
  - the actions are at least 44 tall with their labels
  - pressing either changes nothing

  Verify that `npm test` passes.
- [ ] 8.2 Create `src/components/timeline-feed.tsx` (design D7):
  - a `FlatList` with the box as header and `keyboardShouldPersistTaps="handled"`
  - the empty, loading and error rules
  - scroll to top keyed on `openCount`
  - the back-button listener while Timeline has focus and the box is open

  Make `src/app/index.tsx` render `<TimelineFeed />`. Write `timeline-feed-test.tsx`, covering:
  - the empty message on first launch
  - the empty message is hidden while the box is open
  - the empty message is not shown while loading
  - the error message when loading fails (failing adapters)
  - two creations listed newest first
  - `scrollToOffset` called with offset 0 when the box opens

  Verify that `npm test` passes.
- [ ] 8.3 Write a back-button test that spies on `BackHandler.addEventListener` and calls the registered handler (React Native 0.88 ships no mock). Cover the item-creation spec:
  - with the box open, the box closes and the handler returns `true`
  - with the box closed, there is no listener, or it returns `false`
  - on Events with a draft pending, the draft is not cancelled

  Verify that `npm test` passes.
- [ ] 8.4 Update `src/__tests__/e2e/navigation-test.tsx`: Timeline shows the feed, not "Coming soon.", while Circles and Events keep their placeholders. Add `src/__tests__/e2e/create-text-item-test.tsx` with these journeys:
  - open, choose Texto, Guardar, type, Crear: the card is on top and `+` is back
  - Cancelar discards the text
  - a tab switch keeps the step and text, and they come back on Timeline
  - Evento with Guardar does nothing

  Verify that `npm test` passes.
- [ ] 8.5 Write `docs/components/text-item-card.md` and `timeline-feed.md`, and update `placeholder-screen.md` (now Circles and Events only), `docs/components/index.md` and `docs/architecture/routing.md` if it mentions the Timeline placeholder. Add a line to the log entry. Verify that the links resolve.

## 9. Device check and visual review

- [ ] 9.1 With the `run-on-emulator` skill, run the app in Expo Go on Android and go through the full item-creation flow. Check that the `__DEV__` log prints the SQLite version, and note it in `docs/development/device-testing.md`.
- [ ] 9.2 Persistence: create "Uno" and "Dos", force-stop Expo Go, reopen the project, and check that the Timeline shows "Dos", then "Uno". Turn on airplane mode, create a text, and check that it saves.
- [ ] 9.3 Back button (`adb shell input keyevent KEYCODE_BACK`) and keyboard:
  - the box open closes and the app stays
  - the box closed leaves the app
  - the type list open closes only the list
  - Events with a draft returns to Timeline with the draft
  - entering the text step opens the keyboard
  - returning from another tab does not
  - with a text longer than the maximum height, Crear stays above the keyboard and works on the first tap
  - typing keeps focus

  Fix any difference, or record it in the design's risks.
- [ ] 9.4 Check with TalkBack:
  - the select's label and value
  - the box buttons' labels and disabled state
  - the card actions
  - that `+` is not reachable while the box is open
- [ ] 9.5 Run the `visual-review` skill in light and dark for:
  - the empty timeline
  - the choose step, with the placeholder and with Texto
  - the open type list
  - the text step with text
  - a timeline with cards

  Compare with `sketches/mobile-portrait-new-item*.png`, `mobile-portrait-new-text-component.png` and `mobile-portrait-text-item.png`. Tune the D10 starting values (disabled opacity, text area maximum height, dark `card_shadow`). Replace `timeline-light/dark.png` and add the new references to `src/__tests__/e2e/screenshots/`. Update `docs/development/visual-review.md`.
- [ ] 9.6 Final integration check: `npx expo lint --max-warnings 0`, `npx tsc --noEmit` and `npm test` pass. There are no `ios/` or `android/` folders. The implementation edited nothing under `sketches/` (the new sketch PNGs and the `mobile-portrait.html` edit came with the design, before this change). `grep -rnE "eslint-disable|\.only\(|\.skip\(" src` finds nothing new. `openspec validate add-text-items --strict` passes.

## Workflow follow-up

- Archive `basic-app-layout` before this change. Its specs are already synced, so this change's `app-shell` and `app-theming` deltas apply on the current text.
- After review, run `/opsx:archive add-text-items`. Its guidance updates:
  - `docs/specs/` (item-creation, timeline-feed, item-storage, app-shell, app-theming)
  - a `docs/decisions/` page for each design decision
  - the roadmap and known limitations: inactive Editar, Compartir, Evento and Imagen; the draft in memory only; the database inside Expo Go during development; emoji counting as 2 toward the limit
  - `CLAUDE.md` (current state, a "When to read what" row for the items module) and `src/items/CLAUDE.md`
  - the `visual-review` and `run-on-emulator` skills, if their steps changed
