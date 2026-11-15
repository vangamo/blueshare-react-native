# Decisions

Each page gives a decision, why it was taken and the rejected alternatives, grouped by the OpenSpec change that took it.

## basic-app-layout

The technical decisions taken in the `basic-app-layout` change (its `design.md`, D1 to D11, now in `openspec/changes/archive/2026-11-01-basic-app-layout/`). The decisions about tooling are in [Development](../development/index.md): mandatory lint (D9), the Jest setup (D10) and the screenshot review (D11).

* [JS tabs with a custom tab bar](js-tabs-custom-tab-bar.md) - D1: `expo-router/js-tabs` with a `tabBar` prop, instead of native or headless tabs.
* [Shell at the root layout](shell-at-root-layout.md) - D2: header, footer and FAB are rendered once around the navigator, not per screen.
* [No themed wrappers](no-themed-wrappers.md) - D3: components call `useTheme()` directly. There are no `ThemedText` or `ThemedView`.
* [Tokens in JSON](tokens-in-json.md) - D4: all colors and token sizes live in `design-system.json`, read by `theme.ts`.
* [Active tab contrast](active-tab-contrast.md) - D5: a darker active tab in light mode, and navy-on-blue in dark mode, to pass WCAG AA.
* [Splash hidden on first layout](splash-hidden-on-layout.md) - D6: keep the native splash until the shell's `onLayout`, with no animated overlay.
* [Title field state without effects](title-field-state.md) - D7: the displayed value is computed during render, and state changes only in focus and blur handlers.
* [Kept and removed dependencies](kept-dependencies.md) - D8: which packages were removed and why the others stay.
* [Mobile only, no web](mobile-only.md) - Android and iOS phones and tablets in any orientation, running in Expo Go.

## adaptive-layout

From the `adaptive-layout` change (its `design.md`, D1 to D9, now in `openspec/changes/archive/2026-11-02-adaptive-layout/`).

* [Adaptive layout](adaptive-layout.md) - D1, D2, D4 to D9: the layout from the window size, two size sets and four frames, the title field's rotation grace, safe areas and the content column, the `app.json` and test setup, and the full-screen editor kept on.
* [Tab bar stays in one slot](tab-bar-single-slot.md) - D3: the tab bar is drawn at the top in landscape without leaving the navigator's bottom slot, so a rotation keeps focus.

## add-text-items

From the `add-text-items` change (its `design.md`, now in `openspec/changes/archive/2026-11-01-add-text-items/`). Its D7 (Timeline list, scroll, back button and keyboard) and D12 (wiring) are described in [Timeline feed](../components/timeline-feed.md) and [Shell layout](../architecture/shell-layout.md).

* [Local SQLite storage](local-sqlite-storage.md) - D1: one `expo-sqlite` database on the phone, instead of key-value storage, a JSON file or a server.
* [Items schema](items-schema.md) - D2: a base `items` table plus a table per type, UTC-millisecond times, UUID v4 ids and soft deletion.
* [Hexagonal items module](hexagonal-items-module.md) - D3: `src/items/` with domain, application and infrastructure layers.
* [Injected SQL driver](injected-sql-driver.md) - D4: `expo-sqlite` in the app and `node:sqlite` in Jest behind one port, so tests run the real SQL.
* [UI state without effects](ui-state-without-effects.md) - D5: an external timeline store and a creation box reducer above the tabs.
* [Create action per route](create-action-per-route.md) - D6: `useCreateAction()` maps the route and box state to the `+` button.
* [Custom type select](custom-type-select.md) - D8: a `Pressable` field with a `Modal` list, instead of the platform picker.
* [Text limit](text-limit.md) - D9: `TEXT_MAX_LENGTH` (8192), trimmed and checked in the domain.
* [Creation box buttons](creation-box-buttons.md) - D10: active-tab blue for Guardar and Crear, a faded disabled state, and the new color roles.
* [Spanish copy and labels](spanish-copy-labels.md) - D11: Spanish copy, labels equal to the visible text, announced errors.

## edit-text-items

From the `edit-text-items` change (its `design.md`, now in `openspec/changes/archive/2026-11-02-edit-text-items/`). Its D1 and D2 (live and history tables) are in [Items schema](items-schema.md).

* [Edit dialog](edit-dialog.md) - D5 to D7: local state, an RN `Modal` instead of a route, in-dialog deletion confirmation, and the `danger` colors.

## add-image-items

From the `add-image-items` change (its `design.md`). D1 and D4 are described in [Items module](../architecture/items-module.md), [Items schema](items-schema.md) and the image components.

* [Shared edit dialog frame](shared-edit-dialog-frame.md) - D10: the text and image dialogs share `EditDialogFrame` and keep their own body state.

## event-items

From the `event-items` change (its `design.md`, now in `openspec/changes/archive/2026-11-06-event-items/`). D2 and D3 (event and photo tables) are in [Items schema](items-schema.md), D10's keyboard handling in [Shared edit dialog frame](shared-edit-dialog-frame.md), and D7, D8, D12 and D13 in the event component and design-system pages.

* [Event items](event-items.md) - D1, D6, D11: a separate event type with an ordered photo list, picking several photos at once, and the card's sideways row of square tiles with a peeking tile.
