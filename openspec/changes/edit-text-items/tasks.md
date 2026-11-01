# Tasks

Before writing code that touches an Expo or React Native API, check the v58 docs (https://docs.expo.dev/versions/v58.0.0/), as CLAUDE.md asks. The facts already checked are listed in design.md (Context).

Each task that creates or changes TS/TSX code is done only when these pass:
- `npx expo lint --max-warnings 0`
- `npx tsc --noEmit`
- `npm test`

No new `eslint-disable`, `.only` or `.skip`. Tests go in `src/__tests__/unit/<area>/` (`unit/items/` mirrors `src/items/`) or `src/__tests__/e2e/`. Shared helpers go in `src/test-utils/`. Start a dated entry for this change in `docs/log.md` with the first task, and add a line to it in each group.

## 1. Danger tokens

- [ ] 1.1 Add the `danger` and `on_danger` color roles to both `colors` and `colors_dark` in `src/constants/design-system.json`, with the values from design D7. Verify that `npx tsc --noEmit` passes (dark is typed as `ThemeColors`) and that `design-system-test.ts` passes.
- [ ] 1.2 Add the contrast pairs from design D7 to `src/__tests__/unit/constants/theme-test.ts`. Verify that `npm test` passes for both palettes. If a pair fails, adjust the token in both palettes and record why in the design.
- [ ] 1.3 Update `docs/design-system/color-palettes.md` (the new roles and the checked pairs with their ratios) and `docs/design-system/design-tokens.md` (the new roles in "Differences"). Verify that the links resolve.

## 2. Storage: schema v2 and the repository

- [ ] 2.1 Append step 2 (design D2) to `MIGRATIONS` in `src/items/infrastructure/migrations.ts`, without touching step 1. Extend `migrations-test.ts`:
  - a fresh database ends at version 2 with both history tables
  - a version 1 database with items is upgraded once and keeps every item
  - the composite foreign key rejects a `text_items_history` row with no matching `items_history` row

  Update the existing assertions that expect version 1. Verify that `npm test` passes.
- [ ] 2.2 Add `ItemNotFoundError` to `src/items/domain/errors.ts`, and `findText`, `updateText` and `deleteItem` to `ItemRepository` in `src/items/domain/ports.ts` (design D3). Verify with `npx tsc --noEmit`.
- [ ] 2.3 Implement `findText` and `updateText` in `src/items/infrastructure/sqlite-item-repository.ts`: one transaction that checks, takes the next counter, archives the item and its content, then updates (design D3). Extend `sqlite-item-repository-test.ts` on `NodeSqlDatabase`, covering the item-storage delta:
  - `findText` returns the live item, and `null` for an unknown id
  - an edit keeps the id and `created_at`, sets `updated_at` and the body, and writes history version 1 with the previous times and text
  - two edits in the same millisecond write versions 1 and 2
  - an unknown id throws `ItemNotFoundError` and writes nothing
  - a `FailingSqlDatabase` failing on `UPDATE text_items` leaves no history row and the old text

  Verify that `npm test` passes.
- [ ] 2.4 Implement `deleteItem` in the repository: archive with `deleted_at`, then delete the `text_items` and `items` rows (design D3). Extend the repository test:
  - "A" edited to "B", then to "C", then deleted leaves history versions 1 to 3 with "A", "B" and "C", and only version 3 has `deleted_at`
  - the item is no longer in `listTimeline`, and its live rows are gone
  - an unknown or already deleted id throws `ItemNotFoundError`
  - a `FailingSqlDatabase` failing on `DELETE FROM items` leaves no new history row and keeps the item listed

  Verify that `npm test` passes.
- [ ] 2.5 Update `docs/architecture/items-module.md` (schema v2, the history tables, the new port methods and their transaction steps) and `docs/decisions/items-schema.md` (soft deletion now lives in the history; the live tables vs history tables decision with its rejected alternatives from design D1; the note that Phase 4 must check the history for deletions). Verify that the links resolve.

## 3. Domain and use cases

- [ ] 3.1 Add `withNewText(item, rawText, now)` to `src/items/domain/text-item.ts` (design D3). Extend `text-item-test.ts`:
  - trims and returns a copy with the new body and `updatedAt`, keeping the id and `createdAt`
  - returns `null` when the trimmed text equals the current body (`"  Hola \n"` vs `"Hola"`)
  - throws `InvalidTextError` for blank text and for `TEXT_MAX_LENGTH + 1` characters

  Verify that `npm test` passes.
- [ ] 3.2 Create `src/items/application/update-text-item.ts` and `delete-item.ts` (design D3). Write their tests on `NodeSqlDatabase` with `fixedClock` and `sequentialIds`:
  - an edit returns the updated item and stores it
  - an unchanged edit returns the current item, with `updated_at` and the history unchanged
  - invalid text is rejected before anything is read or written
  - a deletion uses `clock.now()` as `deleted_at`
  - both throw `ItemNotFoundError` for an unknown id

  Verify that `npm test` passes.

## 4. Timeline store and hook

- [ ] 4.1 Add `updateText(id, raw)` and `deleteItem(id)` to `src/items/application/timeline-store.ts`, and wire the use cases in `items-module.ts` (design D4). Extend `timeline-store-test.ts`:
  - both wait for the first load
  - an edit replaces the item in place and keeps the order
  - a no-op edit keeps the same snapshot object
  - a deletion removes only that item
  - a failure rejects and leaves the snapshot object unchanged

  Extend the items-module restart test: edit and delete, then a second module on the same database lists the edited text in its original place and not the deleted item. Verify that `npm test` passes.
- [ ] 4.2 Expose `updateText` and `deleteItem` from `useTimeline()` in `src/hooks/use-timeline.ts`. Extend `use-timeline-test.tsx` (an edit and a deletion are reflected in `items`). Verify that `npm test` passes.
- [ ] 4.3 Add the application layer changes to `docs/architecture/items-module.md` (the store methods and the in-place updates). Verify that the links resolve.

## 5. Buttons

- [ ] 5.1 Add the `danger` and `dangerOutline` variants to `src/components/box-button.tsx` (design D7). Extend `box-button-test.tsx`: the colors and border of each new variant in both palettes, at least `Layout.touchTarget` tall, and the label equals the visible text. Verify that `npm test` passes.
- [ ] 5.2 Move the creation box text area styles into a shared text area component or style constants (design D6), and use them in `creation-box.tsx`. Verify that the existing `creation-box-test.tsx` passes unchanged.
- [ ] 5.3 Update `docs/components/box-button.md` (the new variants and their uses) and `docs/components/creation-box.md` (the shared text area). Verify that the links resolve.

## 6. Edit dialog

- [ ] 6.1 Create `src/components/edit-text-dialog.tsx` with the edit step (design D5 and D6):
  - the `Modal` and the overlay, with no outside-tap close
  - the box style and the header with the "Cerrar" close button
  - the prefilled text area, with no `autoFocus`
  - Cancelar and Guardar, then the divider and Borrar texto

  Guardar is enabled only when the trimmed text is non-empty and differs from the stored text, and it calls `updateText`, then `Keyboard.dismiss()` and `onClose`. Close, Cancelar and `onRequestClose` call `onClose`. Write `edit-text-dialog-test.tsx` covering the item-editing spec:
  - prefilled text
  - Guardar disabled for unchanged, whitespace-only and blank text, and enabled for a change
  - saving trims and closes
  - a double tap saves once (`GatedSqlDatabase`)
  - a failed save keeps the text and shows the message, and a retry works (`FailingSqlDatabase`)
  - Cancelar, close and `onRequestClose` close without changes
  - the overlay has no press handler
  - `maxLength` equals `TEXT_MAX_LENGTH`
  - the dialog box style in both palettes, and the close button size and label

  Verify that `npm test` passes.
- [ ] 6.2 Add the confirmation step:
  - "Borrar texto" dismisses the keyboard and shows the step
  - "No, volver" and `onRequestClose` return to the edit step with the edited text
  - the close button closes
  - "Sí, borrar" calls `deleteItem`, then `onClose`, guarded against double taps
  - a failed deletion stays in the step with "⚠️ No se pudo borrar. Inténtalo de nuevo."

  Extend the dialog test with these scenarios, the button labels and styles, and the iOS announcement for both errors (mock `Platform.OS`, as the creation box test does). Verify that `npm test` passes.
- [ ] 6.3 Write `docs/components/edit-text-dialog.md` (structure, styles, behavior, state, tests, specs), list it in `docs/components/index.md`, and add a `docs/decisions/` page for the dialog choices (local state, RN `Modal` instead of a route, in-dialog confirmation instead of `Alert`) listed in `docs/decisions/index.md`. Verify that the links resolve.

## 7. Cards and the feed

- [ ] 7.1 Give `TextItemCard` an `onEdit` prop and remove the "comes later" comment for Editar, keeping Compartir a no-op. Update `text-item-card-test.tsx`: Editar calls `onEdit`, Compartir still changes nothing. Verify that `npm test` passes.
- [ ] 7.2 In `src/components/timeline-feed.tsx`, keep `editingId` state, derive the item during render, and render `<EditTextDialog key={item.id} … />` next to the list (design D5). Extend `timeline-feed-test.tsx`:
  - Editar on the second card opens the dialog with its text
  - after Guardar, the second card shows the new text in the same position
  - after Sí, borrar, the card is gone and the others keep their order
  - deleting the only item shows the empty message

  Verify that `npm test` passes.
- [ ] 7.3 Add `src/__tests__/e2e/edit-text-item-test.tsx` with these journeys through `renderRouter`:
  - create two texts, edit the older one: it changes and keeps its place
  - edit, then Cancelar: unchanged
  - Borrar texto, No, volver, then Guardar: the edit is saved
  - Borrar texto, Sí, borrar: the card is gone
  - with the creation box open holding a draft, edit a card: after the dialog closes, the box and its draft are still there

  Verify that `npm test` passes.
- [ ] 7.4 Update `docs/components/text-item-card.md` (Editar opens the dialog) and `docs/components/timeline-feed.md` (the dialog wiring). Verify that the links resolve.

## 8. Device check and visual review

- [ ] 8.1 With the `run-on-emulator` skill, run the app in Expo Go on Android. Create three texts, edit one, cancel an edit, and delete one. Then force-stop Expo Go, reopen it, and check that the edited text is in its original place and the deleted one is gone (the migration ran on the existing v1 database).
- [ ] 8.2 Keyboard: with the text area focused and the text at its maximum height, the title, text area, Cancelar and Guardar stay above the keyboard, and Guardar works on the first tap. Borrar texto can be reached by scrolling. Fix any difference, or record it in the design's risks.
- [ ] 8.3 Back button (`adb shell input keyevent KEYCODE_BACK`):
  - the edit step closes the dialog
  - the confirm step returns to the edit step
  - with the creation box open underneath, back in the dialog leaves the box and its draft untouched
  - tapping the overlay does nothing
- [ ] 8.4 Check with TalkBack:
  - focus stays inside the dialog
  - the labels "Cerrar", "Editar elemento de texto", "Cancelar", "Guardar", "Borrar texto", "No, volver" and "Sí, borrar"
  - Guardar's disabled state
  - the error announcements, if they can be triggered
- [ ] 8.5 Run the `visual-review` skill in light and dark for the edit step (unchanged and with an edit), the confirm step, and a timeline after an edit. Compare with `sketches/mobile-portrait-new-text-component.png` and the approved creation box references. Tune the values listed in the design's Open Questions. With the user's approval, add the new references to `src/__tests__/e2e/screenshots/`, and update `docs/development/visual-review.md`.
- [ ] 8.6 Final integration check:
  - `npx expo lint --max-warnings 0`, `npx tsc --noEmit` and `npm test` pass
  - `grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src --include=*.tsx` finds nothing
  - there are no `ios/` or `android/` folders, and nothing under `sketches/` changed
  - `grep -rnE "eslint-disable|\.only\(|\.skip\(" src` finds nothing new
  - `openspec validate edit-text-items --strict` passes

## Workflow follow-up

- After review, run `/opsx:archive edit-text-items`. Its guidance updates:
  - `docs/specs/` (item-editing new, plus item-storage, timeline-feed and app-theming)
  - the `docs/decisions/` pages for design D1 and D5–D7
  - the roadmap (Editar done) and known limitations (Editar no longer inactive; the history isn't shown yet; Phase 4 must read the history to see deletions)
  - `CLAUDE.md` ("Current state", and a "When to read what" row for the edit dialog) and `src/items/CLAUDE.md` if its rules changed
  - the `visual-review` skill, if new screens were added to its list
