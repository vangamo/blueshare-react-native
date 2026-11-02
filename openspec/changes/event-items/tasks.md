# Tasks

Before writing code that touches an Expo or React Native API, check the v58 docs (https://docs.expo.dev/versions/v58.0.0/), as CLAUDE.md asks. The facts already checked are listed in design.md (Context).

Each task that creates or changes TS/TSX code is done only when these pass:
- `npx expo lint --max-warnings 0`
- `npx tsc --noEmit`
- `npm test`

No new `eslint-disable`, `.only` or `.skip`. Tests go in `src/__tests__/unit/<area>/` (`unit/items/` mirrors `src/items/`) or `src/__tests__/e2e/`. Shared helpers go in `src/test-utils/`. Start a dated entry for this change in `docs/log.md` with the first task, and add a line to it in each group.

## 1. Picker API check

- [ ] 1.1 Read the installed `expo-image-picker` types (`node_modules/expo-image-picker/build/ImagePicker.types.d.ts`) and confirm `allowsMultipleSelection`, `selectionLimit` (with `0` meaning the system maximum) and `orderedSelection`, as listed in design Context. Record any difference in design.md before going on. Start the `docs/log.md` entry. Verify that `npx expo install --check` reports no problems and that no package was added.

## 2. Limits, sizes and contrast

- [ ] 2.1 Add `EVENT_TITLE_MAX_LENGTH = 120`, `EVENT_CATEGORY_MAX_LENGTH = 24`, `EVENT_DESCRIPTION_MAX_LENGTH = 2000` and `EVENT_MAX_PHOTOS = 10` to `src/constants/limits.ts` (design D9), and extend `limits-test.ts`. Verify that `npm test` passes.
- [ ] 2.2 Add `eventTitle`, `badgeText` and `thumbColumns` to both size sets, and `accentBarWidth`, `eventTileGap`, `eventTilePeek`, `badgePaddingH`, `badgePaddingV` and `thumbRemoveInset` to `Layout`, in `src/constants/theme.ts` (design D12). Add the new values to the "tablet ≥ phone" expectations in `theme-test.ts`. Verify that `npm test` passes.
- [ ] 2.3 Add the contrast pairs of design D12 to `theme-test.ts`: `badgeText` on `badgeBg` (4.5), `textMain` on `surfaceMuted`, and `primaryDark` on `creationBg` and on `surfaceMuted` (3), in both palettes. Verify that they pass with no change to `design-system.json`.
- [ ] 2.4 Update `docs/design-system/layout-sizes.md` (the new sizes), `docs/design-system/color-palettes.md` (the badge pair and the event card's colors) and `docs/design-system/design-tokens.md` (the `event_card` note: squares replace the 110×90 tiles). Verify that the links resolve.

## 3. Domain

- [ ] 3.1 Create `src/items/domain/event-item.ts` with `EventItem`, `normalizeEventTexts`, `checkPhotoCount` and `withEventChanges`, and add `InvalidEventError` to `errors.ts` (design D1). Make `TimelineItem` the union of the three types and update the `ItemType` comment. Write `event-item-test.ts`:
  - all three texts trimmed, an empty description becomes `null`, and a blank title or category is rejected naming the field
  - 120, 24 and 2000 characters accepted, and 121, 25 and 2001 rejected
  - 1 and 10 photos accepted, and 0 and 11 rejected
  - `withEventChanges` returns `null` for the same files in the same order and trimmed-equal texts
  - it returns a changed item with the new `updatedAt` for a reordered, removed or added photo, a changed text, or a cleared description, keeping `id`, `type` and `createdAt`

  Fix any `switch` or narrowing that the new union breaks. Verify that `npx tsc --noEmit` and `npm test` pass.

## 4. Schema v4 and the repository

- [ ] 4.1 Append step 4 (design D2) to `MIGRATIONS` without touching steps 1 to 3. Extend `migrations-test.ts`:
  - a fresh database reaches version 4
  - a v3 database holding text and image items and their history upgrades with everything kept
  - the CHECKs reject a zero width or a negative position, and the primary key rejects two photos at one position

  Verify that `npm test` passes.
- [ ] 4.2 Add `saveEvent`, `findEvent` and `updateEvent` to `ItemRepository` and implement them in `sqlite-item-repository.ts`, with the second timeline query, the `event` case in `archive()` and the per-type table list in `deleteItem` (design D3). Extend `sqlite-item-repository-test.ts` on `NodeSqlDatabase`, covering the item-storage delta:
  - save, list (mixed with text and image items, newest first) and find an event, with photos in order
  - "Event item history": a photo removed and one added, then deleted, gives versions 1 and 2 with their photo lists in order, and the deletion time on version 2
  - update rewrites the photo list in place, and the item keeps its position in the feed
  - deletion removes the `event_items` and `event_item_photos` rows and keeps the history
  - `FailingSqlDatabase` on a photo insert leaves no `items` or `event_items` row, and on the update leaves the item, its photos and its history unchanged
  - an event row with no photos is hidden from the feed
  - `ItemNotFoundError` for an unknown id

  Verify that `npm test` passes.
- [ ] 4.3 Update `docs/architecture/items-module.md` (schema v4, the second timeline query, the new repository methods, the per-type table list) and `docs/decisions/items-schema.md` (event tables, one row per photo, and why not JSON or child image items). Update the "event items add a case" notes in `src/items/CLAUDE.md`. Verify that the links resolve.

## 5. Use cases

- [ ] 5.1 Create `src/items/application/create-event-item.ts` and `update-event-item.ts` with the order of operations of design D4, and wire them into `items-module.ts`. Write `event-use-cases-test.ts` on `NodeSqlDatabase` and `NodePhotoStore`, with `fixedClock` and `sequentialIds`:
  - create: texts and the count are validated before any file is copied; each photo gets its own file, and the rows point to them in order
  - the same picked photo twice gives two files
  - a failing third copy removes the first two, and a failing insert removes every copy, with the error rethrown
  - update with the same stored photos and trimmed-equal texts writes nothing and copies nothing
  - update copies only the picked photos and keeps the files of removed ones
  - a failing update removes only the new copies

  Verify that `npm test` passes.

## 6. Timeline store and hooks

- [ ] 6.1 Add `createEvent` and `updateEvent` to `timeline-store.ts`, and the `event` case to `differs()` (design D5). Extend `timeline-store-test.ts`: a created event comes first, an updated one keeps its index, a no-op keeps the same snapshot object, and failures reject with the snapshot unchanged. Expose both from `useTimeline()` and extend `use-timeline-test.tsx`. Verify that `npm test` passes.
- [ ] 6.2 Create `src/hooks/use-pick-photos.ts` (design D6), moving the zero-size fallback into a helper that `use-pick-photo.ts` also uses, with `use-pick-photo-test.tsx` passing unchanged. Write `use-pick-photos-test.tsx` with `expo-image-picker` mocked:
  - the options passed, including `selectionLimit: max`
  - a cancelled pick gives `[]`
  - a zero size is replaced by the decoded size for each asset
  - the order is the picker's
  - errors propagate

  Verify that `npm test` passes.
- [ ] 6.3 Add `eventTileSize` to `useShellLayout()` (design D11). Extend `use-shell-layout-test.tsx` for the four test windows: about 116 points on the phone portrait window, never more than `imageMaxHeight`, and updated when the window changes. Update `docs/design-system/layout-sizes.md` and the store section of `docs/architecture/items-module.md`. Verify that the links resolve and `npm test` passes.

## 7. Creation box event step

- [ ] 7.1 Extend `creation-box-provider.tsx` with the `event` step and its actions (design D7). Extend `creation-box-provider-test.ts`:
  - `confirmType` with `event` opens the step
  - `photosAdded` appends in order and truncates at `EVENT_MAX_PHOTOS`
  - `photoRemoved` keeps the others in order
  - the text actions clear the error
  - the save actions behave as in the other steps

  Verify that `npm test` passes.
- [ ] 7.2 Create `EventPhotoGrid` (design D8), `CategorySuggestions` and `EventFields` (design D7) in `src/components/`. Write tests for each:
  - `EventPhotoGrid`: square thumbnails, 3 per row on phones and 4 on tablets, labels "Foto N de M", "Quitar foto N" removes the right one, and the remove buttons are at least 44 points
  - `CategorySuggestions`: four buttons in order, a press replaces the value without focusing the field, and they are at least 44 points
  - `EventFields`: "Elegir fotos" or "Añadir fotos", the limit message and disabled button at 10 photos, the picker error, and `maxLength` on the three fields

  Verify that `npm test` passes.
- [ ] 7.3 Render the event step in `creation-box.tsx`, with Crear calling `createEvent`, and remove the "Evento does nothing yet" branch. Extend `creation-box-test.tsx` with `expo-image-picker` mocked, covering the item-creation delta:
  - "Guardar" with Evento shows the step with the keyboard closed and Crear disabled
  - picking several photos, adding more at the end, and a cancelled pick changing nothing
  - eight photos plus four keeps ten, shows and announces the limit message, and disables the button, which comes back after a removal
  - removing the middle photo and the only photo
  - a picker error and a retry
  - the Crear rule (no category, whitespace title, everything present without a description)
  - Crear trims, saves once on a double tap (`GatedSqlDatabase`), and closes the box
  - a failed save keeps the draft and shows the message (`FailingSqlDatabase`)
  - Cancelar and Android back discard the draft
  - the screen reader names in order

  Verify that `npm test` passes.
- [ ] 7.4 Update `docs/components/creation-box.md` and `docs/components/creation-box-provider.md` (the event step and its state), and write `docs/components/event-fields.md` (grid, suggestions, fields), listed in `docs/components/index.md`. Verify that the links resolve.

## 8. Event card and the feed

- [ ] 8.1 Add the `accent` option to `ItemCardFrame` (design D11), with `text-item-card-test.tsx` and `image-item-card-test.tsx` passing unchanged. Create `CategoryBadge`, `EventPhotoTile` and `src/components/event-item-card.tsx`. Write `event-item-card-test.tsx` covering the timeline-feed delta:
  - the `primaryDark` border, the `primaryBlue` left bar and the badge colors in both palettes
  - the title as a header, with the badge to its right and its label "Categoría: …"
  - square tiles of `eventTileSize` in order, with the label "Foto N de M de <title>"
  - one photo gives one tile
  - the description present or absent with no gap
  - a tile's `onError` shows "⚠️ Imagen no disponible" while the others still show
  - Editar calls `onEdit`, and Compartir does nothing

  Verify that `npm test` passes.
- [ ] 8.2 Make `TimelineFeed` render `EventItemCard` for event items. Extend `timeline-feed-test.tsx`: a feed mixing the three types keeps the newest-first order. Verify that `npm test` passes.
- [ ] 8.3 Write `docs/components/event-item-card.md`, list it in the components index, and update `docs/components/timeline-feed.md`. Verify that the links resolve.

## 9. Event edit dialog

- [ ] 9.1 Create `src/components/edit-event-dialog.tsx` on `EditDialogFrame` and `EventFields`, with Guardar calling `updateEvent` (design D10), and open it from `TimelineFeed` for event items. Add a harness in `src/test-utils/` like `edit-image-dialog-harness.tsx`. Write `edit-event-dialog-test.tsx` covering the item-editing delta:
  - prefilled thumbnails in the stored order and prefilled fields, keyboard closed, title "Editar elemento de evento:"
  - the Guardar rule: unchanged, whitespace only, a photo removed, the title cleared, the description cleared, every photo removed
  - adding photos at the end up to the limit; a cancelled pick changes nothing; a picker error shows the message; the card unchanged until Guardar
  - Guardar saves once and the card updates in place; a failed save keeps the edit and shows the message
  - Cancelar after photo changes keeps the card's photos
  - "Borrar este evento", "¿Borrar este evento?", "No, volver" keeping the photo changes, and "Sí, borrar" removing the card
  - the screen reader names

  Verify that `npm test` passes, with `edit-text-dialog-test.tsx` and `edit-image-dialog-test.tsx` unchanged.
- [ ] 9.2 Write `docs/components/edit-event-dialog.md`, list it in the components index, and add the event dialog to `docs/decisions/shared-edit-dialog-frame.md`. Verify that the links resolve.

## 10. Journeys

- [ ] 10.1 Add `src/__tests__/e2e/create-event-item-test.tsx` and `edit-event-item-test.tsx` through `renderRouter`, with `expo-image-picker` mocked to return fixture files:
  - create a text, then an event with three photos: the event card is first, and its three photo files exist in the store
  - with an event draft, switch to Circles and back: the photos and fields are intact
  - edit the event (remove a photo, add one, change the category): the card changes in place, and the history holds the previous photo list
  - delete the event: the card is gone, and every photo file still exists
  - rotate (`setMockWindow`) with an event draft and with the event dialog open: both keep their photos, order and fields, and the tiles resize

  Extend `rotation-test.tsx` if the rotation cases fit there better. Verify that `npm test` passes.

## 11. Device check and visual review

- [ ] 11.1 With the `run-on-emulator` skill, push about twelve photos to the emulator (portrait, landscape, very tall, EXIF orientation 6). Create an event with several photos in one pick. Record whether the Android picker keeps the tapped order and honors `selectionLimit` (design Risks), and how long a 10-photo save takes. Force-stop Expo Go, reopen it, and check that the event is still there (the migration ran on the existing v3 database). Write the results in `docs/log.md`.
- [ ] 11.2 Check all four layouts (phone and tablet emulators, both orientations): the tile size with the next tile peeking, sideways scrolling of the row inside the vertical feed, long titles with a 24-character category, and the event dialog with 10 photos scrolling to Guardar and "Borrar este evento" with and without the keyboard. Record any value tuned in design.md.
- [ ] 11.3 Check with TalkBack: the card heading, badge and tile labels, reaching the off-screen tiles, the thumbnails and "Quitar foto N" buttons in the step and the dialog, the suggestions, and the limit message announcement.
- [ ] 11.4 Run the `visual-review` skill in light and dark for the event card (one photo, five photos, no description, a missing photo), the event step (empty, with photos, at the limit) and the event dialog (edit and confirm steps). Compare with `sketches/mobile-portrait-event-item.png` and the approved references. Settle the accent bar rendering and the values in design Open Questions. With the user's approval, add the new references to `src/__tests__/e2e/screenshots/` and update `docs/development/visual-review.md`.

## 12. Final integration check

- [ ] 12.1 Run the full check:
  - `npx expo lint --max-warnings 0`, `npx tsc --noEmit` and `npm test` pass
  - `grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src --include=*.tsx` finds nothing
  - `grep -rn "expo-file-system\|expo-image-picker" src` finds them only in `expo-photo-store.ts`, the two picker hooks and tests
  - `package.json` has no new dependency
  - there are no `ios/` or `android/` folders, and nothing under `sketches/` changed
  - `grep -rnE "eslint-disable|\.only\(|\.skip\(" src` finds nothing new
  - `openspec validate event-items --strict` passes

## Workflow follow-up

- After review, run `/opsx:archive event-items`. Its guidance updates:
  - `docs/specs/` for item-creation, item-editing, item-storage, timeline-feed, app-theming and adaptive-layout, and the item-creation Purpose line, which still says events are "not yet active"
  - a `docs/decisions/` page for design D2 and D3 (event tables, one row per photo, two timeline queries) and for D11 (square cropped tiles in a peeking row)
  - the roadmap (event items done; next `add-item-locations` for image and event items) and known limitations (no photo reordering, picker order on Android, no date for the memory, "Guardar" with Evento no longer inactive)
  - `CLAUDE.md` ("Current state", and "When to read what" rows for the event card, fields and dialog) and `src/items/CLAUDE.md`
  - the `run-on-emulator` and `visual-review` skills (event screens)
- Then start `add-item-locations` with `/opsx:propose`. It covers image and event items, adding nullable location columns to `image_items` and `event_items` and their history tables (design Non-Goals).
