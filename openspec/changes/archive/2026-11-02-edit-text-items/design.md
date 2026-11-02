# Design

## Context

For the motivation, see `proposal.md` (Why). The requirements are in `specs/`: item-editing (new), plus deltas for item-storage, timeline-feed and app-theming. Current state, as checked in the repo:

- **Storage (schema v1):**
  - `items (id PK, type, created_at, updated_at, deleted_at)` with the partial index `items_timeline` on `created_at DESC WHERE deleted_at IS NULL`.
  - `text_items (item_id PK → items.id ON DELETE CASCADE, body)`.
  - `MIGRATIONS` is append-only. `migrate()` runs each missing step and its `PRAGMA user_version` bump in one transaction.
  - Both drivers run `PRAGMA foreign_keys = ON`.
- **Items module:**
  - `ItemRepository` has only `saveText` and `listTimeline`.
  - `TimelineStore` has `subscribe`, `getSnapshot` and `createText`. Its snapshot identity changes only when something changes.
  - `UseCaseDeps` is `{ repository, clock, ids }`.
  - Test helpers exist in `src/test-utils/`:
    - `NodeSqlDatabase` runs the real SQL on `node:sqlite`.
    - `FailingSqlDatabase` throws on matching statements.
    - `GatedSqlDatabase` holds transactions open.
    - `fixedClock` and `sequentialIds` make the use cases deterministic.
    - `spyOnBackHandler` stands in for the missing BackHandler mock.
- **UI:**
  - `TextItemCard` renders "Editar" and "Compartir" with no-op handlers.
  - `TimelineFeed` is a `FlatList` with the creation box as its header, and it registers a `hardwareBackPress` listener while the box is open.
  - `BoxButton` has `primary` and `secondary` variants.
  - `TypeSelect` already uses a transparent RN `Modal` (`fade`, `statusBarTranslucent`, `navigationBarTranslucent`, `onRequestClose`) over the `overlay` token.
- **Facts checked for this change:**
  - The installed `react-native/Libraries/Modal/Modal.js` (RN 0.88) has `transparent`, `animationType`, `onRequestClose`, `onShow`, `onDismiss`, `backdropColor`, `statusBarTranslucent`, `navigationBarTranslucent` and `allowSwipeDismissal`.
  - `react-native-safe-area-context` ~5.10.1 is installed, and the header and footer already use `useSafeAreaInsets`.
  - Contrast of the proposed danger colors, computed with the WCAG formula:

    | Pair | Light | Dark |
    | --- | --- | --- |
    | `onDanger` on `danger` | 6.47 | 6.45 |
    | `danger` on `surfaceMuted` | 6.18 | 5.29 |
    | `danger` on `creationBg` | 5.99 | 5.71 |
    | `danger` on `cardBg` | 6.47 | 6.45 |
- **Project rules that shape this design:**
  - React Compiler is on: no manual memoization and no setState in effects.
  - Colors come only from the JSON tokens.
  - Touch targets are at least 44 pt.
  - The app runs in Expo Go only.
  - SQL uses positional `?` parameters only.

## Goals / Non-Goals

**Goals:**
- Keep the Timeline query and the live tables as they are. The history sits beside them.
- Make every edit and deletion one transaction, tested on the real SQL.
- Keep the dialog state local and derived, with no setState in effects.

**Non-Goals:**
- Showing the history, undo, restoring deleted items, or an "Editado" mark on cards.
- Editing image or event items. Those types don't exist yet, but the repository leaves room for them (D3).
- Sharing deletions with contacts (Phase 4). The history only keeps what that will need.
- Keeping an unsaved edit across app restarts or tab switches. The dialog is modal, so tabs can't be switched while it is open.

## Decisions

### D1. Live tables plus history tables

`items` and `text_items` keep holding exactly what the Timeline shows. Two new append-only tables keep earlier versions, keyed by `(item_id, counter)`:

```
 action        live tables (items, text_items)        history (items_history, text_items_history)
 ------        -------------------------------        -------------------------------------------
 Crear "A"     X: created T0, updated T0, "A"         -
 Guardar "B"   X: created T0, updated T1, "B"         #1 X: created T0, updated T0, deleted NULL, "A"
 Guardar "C"   X: created T0, updated T2, "C"         #2 X: created T0, updated T1, deleted NULL, "B"
 Sí, borrar    (rows removed)                         #3 X: created T0, updated T2, deleted T3,   "C"
```

- Each history row is the state **before** an action. The last row of a deleted item is its final content plus the deletion time, which serves as its tombstone.
- **Feed order is unchanged:** the query still orders by `created_at` and is not touched, so an edited card keeps its place (timeline-feed delta).
- **`items.deleted_at` stays NULL in the live table from now on.** Migrations are append-only, so the column and the partial index stay. They are harmless, and the filter in the Timeline query stays as a safeguard.
- **The counter**, not the time, orders versions. Two versions in the same millisecond still get 1 and 2 (item-storage "Edit history").

This is the user's design from the exploration. Alternatives considered:
- **One revisions table** (`text_revisions (item_id, revised_at, body)`, with the feed joining the latest one). It keeps the history too, but the Timeline query would need a "latest per item" join, and deletion would still mark `items`.
- **New rows in `items` for each version**, with a `content_id`. It needs a rebuilt primary key, a "latest row per group" query, and an item id that changes on each edit, which breaks the planned Bluetooth sharing.
- **Editing in place with no history.** Simplest, but it drops what the user asked for and what sync will need.

### D2. Migration step 2

```sql
CREATE TABLE items_history (
  item_id    TEXT    NOT NULL,                     -- no FK: the live row is gone after a deletion
  counter    INTEGER NOT NULL CHECK (counter >= 1),
  type       TEXT    NOT NULL CHECK (type IN ('text', 'image', 'event')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,                              -- set only on the version written by a deletion
  PRIMARY KEY (item_id, counter)
);
CREATE TABLE text_items_history (
  item_id TEXT    NOT NULL,
  counter INTEGER NOT NULL,
  body    TEXT    NOT NULL,
  PRIMARY KEY (item_id, counter),
  FOREIGN KEY (item_id, counter) REFERENCES items_history (item_id, counter) ON DELETE CASCADE
);
```

- The composite primary key also serves as the index for `MAX(counter) WHERE item_id = ?`.
- There is no data to copy: nothing has a history yet.
- **Not added:** an `archived_at` column. When a version stopped being current is the `updated_at` of the next version, or of the live row.
- Later item types add `image_items_history` and `event_items_history` in their own steps, mirroring their live tables.

### D3. Repository, use cases and errors

**Ports** (`domain/ports.ts`), with `ItemRepository` growing:

```ts
findText(id: string): Promise<TextItem | null>;             // live, not deleted
updateText(item: TextItem): Promise<void>;                   // archive, then update; ItemNotFoundError if gone
deleteItem(id: string, deletedAt: number): Promise<void>;    // archive with deletedAt, then remove; ItemNotFoundError if gone
```

**`SqliteItemRepository`.** Each method runs in one `db.transaction`:

```
updateText(item)                                deleteItem(id, deletedAt)
  1. SELECT type FROM items                       1. same check, also reads `type`
     WHERE id = ? AND deleted_at IS NULL
     -> none: throw ItemNotFoundError
  2. next = COALESCE(MAX(counter), 0) + 1         2. same
     FROM items_history WHERE item_id = ?
  3. INSERT INTO items_history                    3. same, with `?` (deletedAt) in place of
     SELECT id, ?, type, created_at,                 deleted_at
            updated_at, deleted_at
     FROM items WHERE id = ?
  4. archive the content for the type (text:      4. same
     INSERT INTO text_items_history
     SELECT item_id, ?, body FROM text_items
     WHERE item_id = ?)
  5. UPDATE items SET updated_at = ?              5. DELETE FROM text_items WHERE item_id = ?
     UPDATE text_items SET body = ?                  DELETE FROM items WHERE id = ?
```

- Step 4 goes through a private `archiveContent(tx, type, id, counter)` that switches on `type`. Image and event add their own cases later. Any other type throws, so content can never be dropped silently.
- Step 5 of a deletion removes the type row explicitly, rather than relying on the cascade. It still works if a future driver forgets `foreign_keys`.
- An error thrown inside `transaction` rolls everything back. That covers both all-or-nothing scenarios, and is tested with `FailingSqlDatabase` on the `UPDATE text_items` and `DELETE FROM items` statements.

**Domain:**
- `errors.ts` adds `ItemNotFoundError(id)`.
- `text-item.ts` adds `withNewText(item, rawText, now): TextItem | null`. It uses `normalizeTextBody`. It returns `null` when the trimmed text equals `item.body` (no-op) and otherwise a copy with the new `body` and `updatedAt`. It is pure, so it is tested without SQL.

**Use cases** (`application/`):
- `updateTextItem(deps)(id, rawText): Promise<TextItem>`:
  1. `findText` (throws `ItemNotFoundError` when it returns null)
  2. `withNewText`. When it returns `null`, the use case returns the current item and writes nothing.
  3. `repository.updateText(updated)`, then returns `updated`
  4. `InvalidTextError` is thrown before anything is read or written.
- `deleteItem(deps)(id): Promise<void>` calls `repository.deleteItem(id, clock.now())`.

### D4. Timeline store and hook

`TimelineStore` gains two methods, both of which wait for the first load, like `createText`:

- `updateText(id, rawText): Promise<TextItem>`
  - On success it replaces the item with the same id, in place.
  - When the returned item is the same object (a no-op edit), it keeps the snapshot as it is, so `useSyncExternalStore` doesn't re-render for nothing.
  - On failure it rejects and leaves the snapshot untouched.
- `deleteItem(id): Promise<void>`
  - On success it filters the item out.
  - On failure it rejects and leaves the snapshot untouched.

`useTimeline()` returns `updateText` and `deleteItem` next to `createText`. `items-module.ts` wires the two new use cases into the store.

Alternative: reload the whole list after each change. It is simpler to write, but it costs a query per action and causes a flash in the list. Updating in place matches how `createText` already works.

### D5. The edit dialog: where its state lives

- **`TimelineFeed` holds only `editingId: string | null`,** with `useState`. Pressing Editar sets it, and the dialog's `onClose` clears it. The item is **derived during render**: `items.find((i) => i.id === editingId)`. If the item disappears (deleted), the dialog simply isn't rendered. No effect is needed.
- **`EditTextDialog`** (`src/components/edit-text-dialog.tsx`) is rendered as `<EditTextDialog key={item.id} item={item} onClose={…} />` next to the `FlatList`, and only while editing. Mounting it per open means its draft starts from the stored text each time, through a `useReducer` initializer. This covers the scenario "Reopening after cancelling".

  ```
  DialogState = { step: 'edit' | 'confirm'; text: string; busy: boolean; error: null | 'save' | 'delete' }

  setText(s)       edit: text = s, error = null
  askDelete        edit -> confirm, error = null        (Keyboard.dismiss())
  backToEdit       confirm -> edit, error = null        (text kept)
  started          busy = true
  failed(kind)     busy = false, error = kind
  ```

  Closing is not a state: the parent clears `editingId`, which unmounts the dialog.
- **Guarding against double taps:** a `busyRef`, like `savingRef` in `CreationBox`, because a second tap can land before the `busy` render.
- **Why not a provider like `CreationBoxProvider`:** that state lives above the tabs so a draft survives tab switches. The dialog is modal, so tabs can't be switched while it's open, and keeping its state local is enough.
- **Which item:** `TextItemCard` gets an `onEdit: () => void` prop. The feed passes `() => setEditingId(item.id)`. Compartir stays a no-op.

Alternatives:
- An Expo Router modal route (`/edit/[id]`). It needs a stack above the tabs, which doesn't exist yet (known limitations), plus a route file, a deep link and more tests. It's not needed for a dialog over the feed.
- `Alert.alert` for the confirmation. Discussed in the exploration and rejected:
  - On Android it uses small, low-contrast text buttons outside our tokens, which can't be tested for AA or 44 pt.
  - On iOS it can conflict with a visible `Modal`.
  - It is harder to test with RNTL.

### D6. The edit dialog: Modal, layout, keyboard, back button

- **`Modal`** with `visible`, `transparent`, `animationType="fade"`, `statusBarTranslucent` and `navigationBarTranslucent`, the same as `TypeSelect`.
  - **Root:** a `View` filling the screen with the `overlay` background. It is not a `Pressable`, so tapping outside does nothing (spec).
  - **Back button:** `onRequestClose` gets Android back while the Modal is shown. In the edit step it closes the dialog. In the confirm step it dispatches `backToEdit`.
  - **Feed's back listener:** the feed's `hardwareBackPress` listener for the creation box is not involved, because the Modal's native dialog consumes the key first. The device check (task 8.3) confirms this.
- **Layout:**
  - A `ScrollView` (`keyboardShouldPersistTaps="handled"`, so Guardar works on the first tap with the keyboard up) holds the box.
  - The box sits at `insets.top + Spacing.lg` from the top, with `Spacing.lg` side margins, so it stays clear of the keyboard, which comes up from the bottom.
  - Height estimate with the text area at its maximum: about 16 + 20 + 10 + 200 + 10 + 44 + 32 + 4 ≈ 340 pt for the title through Guardar. That fits above a ~330 pt keyboard on the 780 pt reference screen. "Borrar este texto" may sit under the keyboard while typing, and the scroll view reaches it.
  - No `KeyboardAvoidingView`. Its behavior inside a translucent Android Modal varies, and top placement makes it unnecessary. To be confirmed on the device.
- **Box:**
  - `creationBg`, a 2 pt **solid** `primaryBlue` border, `Radius.lg`, `Spacing.lg` padding and a `Layout.creationGap` gap.
  - The header row has the title (`FontSize.small` bold, `textMain`, `accessibilityRole="header"`) and the close button on the right.
  - **Close button:** a `Pressable` of `Layout.touchTarget` × `Layout.touchTarget`. Its glyph is "✕" in `FontSize.titleCard` bold `textMain`. It has `accessibilityRole="button"` and `accessibilityLabel="Cerrar"`.
- **Text area:** the creation box's styles (`textAreaMinHeight` and `textAreaMaxHeight`, `primaryDark` border, `cardBg`, `FontSize.bodyLarge`), with `maxLength={TEXT_MAX_LENGTH}` and **no `autoFocus`**, so the keyboard doesn't hide the dialog's other actions. The shared style moves into a small `TextArea` component, or into shared style constants, so the two places don't drift apart.
- **Divider:** `Layout.hairlineWidth` in the `divider` color, then "Borrar este texto" at full width.
- **Confirm step:** the same box and header ("¿Borrar este texto?" with the close button), the message "Desaparecerá de tu línea de tiempo." (`FontSize.body`, `textMain`), and the buttons "No, volver" (secondary) and "Sí, borrar" (danger).
- **Screen readers:**
  - On Android, the Modal is its own window, so TalkBack stays inside it.
  - On iOS, the box gets `accessibilityViewIsModal`.
  - Both steps render their title first, so focus lands on it after a step change.
- **Errors:** `EDIT_SAVE_ERROR_MESSAGE` ("⚠️ No se pudo guardar. Inténtalo de nuevo.") and `DELETE_ERROR_MESSAGE` ("⚠️ No se pudo borrar. Inténtalo de nuevo."), shown the same way as the creation box error: `accessibilityLiveRegion="polite"`, `accessibilityRole="alert"`, plus `announceForAccessibility` on iOS.

### D7. Danger buttons and tokens

`BoxButton` gains two variants:

| Variant | Background | Border | Label | Used by |
| --- | --- | --- | --- | --- |
| `danger` | `danger` | none | `onDanger` | Sí, borrar |
| `dangerOutline` | `surfaceMuted` | 2 pt `danger` | `danger` | Borrar este texto |

They share the size, radius, press feedback and disabled behavior of the existing variants.

**New color roles** (both palettes, `design-system.json`):

| Role | Light | Dark | Why |
| --- | --- | --- | --- |
| `danger` | `#b91c1c` | `#f87171` | red-700 and red-400. AA as a label on `surfaceMuted` and as a border on `creationBg` (the Context table). |
| `on_danger` | `#ffffff` | `#0f172a` | Same pattern as `on_primary`: dark text on the lighter dark-mode red. |

**Contrast pairs added to `theme-test.ts`:**
- `onDanger` on `danger` (TEXT): Sí, borrar
- `danger` on `surfaceMuted` (TEXT): Borrar este texto label
- `danger` on `creationBg` (LARGE_OR_UI): Borrar este texto border
- `textMain` on `creationBg` (LARGE_OR_UI): close glyph. The TEXT pair already covers it.

The dialog border (`primaryBlue` on `creationBg`) and the overlay are decorative, like the creation box border.

Alternative: a danger-colored solid "Borrar este texto". It is louder than "Guardar", which is the main action of the edit step, so the outline keeps the hierarchy, and the solid style is kept for the actual confirmation.

### D8. Copy and labels

All new text is Spanish, and each label equals the visible text (WCAG 2.5.3), as in `add-text-items` D11:
- the title "Editar elemento de texto:", and the text area label "Editar elemento de texto"
- "Cerrar" (the close button's label; the glyph is "✕")
- "Cancelar", "Guardar", "Borrar este texto"
- "¿Borrar este texto?", "Desaparecerá de tu línea de tiempo.", "No, volver", "Sí, borrar"
- the two error messages

## Risks / Trade-offs

- [Android back might reach the feed's `BackHandler` listener instead of the Modal and close the creation box underneath.] → RN's Modal is a native dialog that handles back itself. Jest calls `onRequestClose`, and the device check with the creation box open confirms that only the dialog reacts.
- [The keyboard inside a translucent Modal could cover Guardar on small screens.] → Top placement, the capped text area and a scroll view, all checked on the emulator. If that isn't enough, add `KeyboardAvoidingView` with `behavior="padding"` on iOS only, or scroll to the buttons.
- [The history grows with every edit, up to 8192 characters per version.] → Acceptable for a personal, local timeline. Pruning or compaction can come later without a schema change.
- [Phase 4 must check the history to know that an item was deleted, so a received edit doesn't bring it back.] → Recorded in the items-schema decision page and the known limitations.
- [Two edits in the same millisecond.] → The counter orders them, not the time.
- [A no-op edit could still write a version if the UI rule were bypassed.] → `withNewText` returns `null`, and the use case writes nothing. This is tested in the domain and in the use case.
- [Old builds opening a v2 database.] → `migrate()` finds `user_version` above its step count and does nothing. The old code reads only `items` and `text_items`, which stay compatible.
- [The approved Timeline reference screenshots don't change, but new ones are needed for the dialog.] → Added in the visual review.

## Migration Plan

- On launch, `migrate()` applies step 2 once (`user_version` goes from 1 to 2) in one transaction. Existing items are untouched.
- Rollback: revert the code. The extra tables are ignored by v1 code, and no live data changes shape.
- During development, clearing Expo Go's data still resets everything.

## Open Questions

- The exact dialog top offset, the close glyph size and the dark `danger` shade get tuned in the visual review, with no spec change.
