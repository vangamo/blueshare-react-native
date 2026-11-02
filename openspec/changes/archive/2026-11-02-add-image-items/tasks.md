# Tasks

Before writing code that touches an Expo or React Native API, check the v58 docs (https://docs.expo.dev/versions/v58.0.0/), as CLAUDE.md asks. The facts already checked are listed in design.md (Context).

Each task that creates or changes TS/TSX code is done only when these pass:
- `npx expo lint --max-warnings 0`
- `npx tsc --noEmit`
- `npm test`

No new `eslint-disable`, `.only` or `.skip`. Tests go in `src/__tests__/unit/<area>/` (`unit/items/` mirrors `src/items/`) or `src/__tests__/e2e/`. Shared helpers go in `src/test-utils/`. Start a dated entry for this change in `docs/log.md` with the first task, and add a line to it in each group.

## 1. Dependencies and app config

- [x] 1.1 Run `npx expo install expo-image-picker expo-file-system`. Verify that both appear in `package.json` `dependencies` with SDK 58 versions, and that `npx expo install --check` and `npx expo-doctor` report no problems.
- [x] 1.2 Add the `expo-image-picker` plugin to `app.json` with the Spanish `photosPermission`, `cameraPermission: false` and `microphonePermission: false` (design D13). Check the plugin options against the v58 docs first. Verify that `npx expo config --type introspect` shows `NSPhotoLibraryUsageDescription` with the Spanish text and no Android `CAMERA` or `RECORD_AUDIO` permission.
- [x] 1.3 Update `docs/development/dependencies.md` (the two packages, where they are imported, and the Android storage permissions that can't be blocked) and `docs/decisions/kept-dependencies.md` (added by this change). Start the `docs/log.md` entry. Verify that the links resolve.

## 2. Tokens, sizes and limits

- [x] 2.1 Add the `image_backdrop` color role to both `colors` and `colors_dark` in `src/constants/design-system.json` (design D12). Add the caption, hint and missing-photo pairs from design Context to `src/__tests__/unit/constants/theme-test.ts`. Verify that `design-system-test.ts` and `theme-test.ts` pass in both palettes.
- [x] 2.2 Add `captionText`, `fieldLabel` and `fieldHint` to both size sets, and `photoRadius`, `photoGap`, `imageMinHeight` and `imageMaxRatio` to `Layout`, in `src/constants/theme.ts` (design D12). Verify that the existing "tablet ≥ phone" test in `theme-test.ts` passes, and add the new values to its expectations.
- [x] 2.3 Add `ALT_TEXT_MAX_LENGTH = 1000` and `CAPTION_MAX_LENGTH = 500` to `src/constants/limits.ts`, and extend `limits-test.ts`. Verify that `npm test` passes.
- [x] 2.4 Update `docs/design-system/color-palettes.md` (the new role and its checked pairs), `docs/design-system/design-tokens.md` and `docs/design-system/layout-sizes.md` (the new sizes). Verify that the links resolve.

## 3. Domain

- [x] 3.1 Create `src/items/domain/image-item.ts` with `ImageItem`, `PickedPhoto`, `normalizeImageTexts` and `withImageChanges`, and add `InvalidImageTextError` to `errors.ts` (design D3). Make `TimelineItem` the union `TextItem | ImageItem`. Write `image-item-test.ts`:
  - both texts trimmed, empty and whitespace-only become `null`
  - 1000 and 500 characters accepted, 1001 and 501 rejected with the field named
  - `withImageChanges` returns `null` for the same photo and trimmed-equal texts, and a changed item with the new `updatedAt` otherwise, keeping `id`, `type` and `createdAt`
  - clearing a text counts as a change

  Fix any place that assumed `TimelineItem` is a text item (narrow on `item.type`). Verify that `npx tsc --noEmit` and `npm test` pass.

## 4. Schema v3 and the repository

- [x] 4.1 Append step 3 (design D2) to `MIGRATIONS` without touching steps 1 and 2. Extend `migrations-test.ts`:
  - a fresh database reaches version 3
  - a v2 database holding text items and history upgrades with everything kept
  - the CHECKs reject a zero width or height

  Verify that `npm test` passes.
- [x] 4.2 Add `saveImage`, `findImage` and `updateImage` to `ItemRepository`, implement them in `sqlite-item-repository.ts`, add the `image` case to `archive()`, the `image_items` join to `TIMELINE_SQL`, and delete the type's own row in `deleteItem` (design D6). Extend `sqlite-item-repository-test.ts` on `NodeSqlDatabase`, covering the item-storage delta:
  - save, list (mixed with text items, newest first) and find an image item
  - update archives version N with the previous content, then updates in place
  - "Image item history": photo replaced, then deleted, gives versions 1 and 2 with the deletion time on 2
  - `FailingSqlDatabase` on the `image_items` insert leaves no `items` row, and on the update leaves item and history unchanged
  - `ItemNotFoundError` for an unknown id
  - an `event` type still throws in `archive()`

  Verify that `npm test` passes.
- [x] 4.3 Update `docs/architecture/items-module.md` (schema v3, the new repository methods and the delete-per-type rule) and `docs/decisions/items-schema.md` (image tables, relative file names). Verify that the links resolve.

## 5. Photo store

- [x] 5.1 Add the `PhotoStore` port to `src/items/domain/ports.ts` and implement `src/items/infrastructure/expo-photo-store.ts` with `File`, `Directory` and `Paths` from `expo-file-system` (design D4). Check the v58 API before writing it.
- [x] 5.2 Create `src/test-utils/node-photo-store.ts` (node:fs, a fresh temp folder per instance, plus a helper that writes a small fixture image and returns its path). Add `photos` to `createAppAdapters()` and to the Jest mock in `jest-setup.ts`, and pass it through `createItemsModule`, which now returns `{ store, photos }`. Write `node-photo-store-test.ts`: import copies the bytes under the given name, creates the folder, `removePhoto` ignores a missing file, and `uriFor` points inside the folder. Verify that `npm test` passes.
- [x] 5.3 Add `expo-photo-store.ts` to the Expo-imports rule in `src/items/CLAUDE.md`, and the port and adapters to `docs/architecture/items-module.md` (ports table and driver injection section). Verify that the links resolve.

## 6. Use cases

- [x] 6.1 Create `src/items/application/create-image-item.ts` and `update-image-item.ts` with the order of operations of design D5. Write their tests on `NodeSqlDatabase` and `NodePhotoStore` with `fixedClock` and `sequentialIds`:
  - create: texts are validated before any file is copied; the file exists under `<id>.<ext>` and the row points to it
  - create with a failing insert: the copied file is removed and the error is rethrown
  - update with the same photo and trimmed-equal texts writes nothing and copies nothing
  - update with a new photo copies a new file and keeps the old one
  - update with a failing write removes only the new copy
  - the extension comes from `mimeType`, else the `uri`, else `jpg`

  Verify that `npm test` passes.

## 7. Timeline store and hooks

- [x] 7.1 Add `createImage` and `updateImage` to `timeline-store.ts` and wire them in `items-module.ts` (design D7). Extend `timeline-store-test.ts`: the created item comes first, an updated item keeps its index, a no-op keeps the same snapshot object, and failures reject with the snapshot unchanged. Expose both from `useTimeline()` and extend `use-timeline-test.tsx`. Verify that `npm test` passes.
- [x] 7.2 Add `src/hooks/use-photo-uri.ts` (reads `photos.uriFor` from `ItemsContext`) and `src/hooks/use-pick-photo.ts` (design D8, with the `Image.loadAsync` fallback for a zero size). Test `use-pick-photo` with `expo-image-picker` mocked: options passed, a cancelled pick gives `null`, a zero size is replaced by the decoded size, and errors propagate. Verify that `npm test` passes.
- [x] 7.3 Add `imageMaxHeight` to `useShellLayout()` (design D11). Extend `use-shell-layout-test.tsx` for the four test windows: the value follows the formula, never falls below `Layout.imageMinHeight`, and changes when the window changes. Update `docs/design-system/layout-sizes.md` and `docs/architecture/items-module.md` (store methods). Verify that the links resolve and `npm test` passes.

## 8. Shared UI pieces

- [x] 8.1 Create `PhotoPreview` (backdrop box sized by design D11, `expo-image` with `contentFit="contain"`, `onError` fallback "⚠️ Imagen no disponible", image role and label), `BoxTextField` and `FieldLabel` in `src/components/`. Move the card frame and the Editar/Compartir row out of `TextItemCard` into shared pieces, with `text-item-card-test.tsx` passing unchanged. Write tests for each new component:
  - `PhotoPreview`: a 4000×3000 photo at 300 points is 225 tall, a 1000×3000 photo is capped at the smaller of 5/4 width and `imageMaxHeight`, the backdrop color in both palettes, the fallback after `onError`, and the label passed in
  - `BoxTextField`: `maxLength`, at least 44 points tall, border and colors from the theme
  - `FieldLabel`: the label and hint, with the hint as the field's `accessibilityHint`

  Verify that `npm test` passes.
- [x] 8.2 Write `docs/components/photo-preview.md` and a short page for the field components, and list them in `docs/components/index.md`. Verify that the links resolve.

## 9. Image card and the feed

- [x] 9.1 Create `src/components/image-item-card.tsx` (design D11): the shared card frame, `PhotoPreview` with the label `altText ?? caption ?? 'Foto'`, the italic caption when present, and the shared actions with `onEdit`. Write `image-item-card-test.tsx` covering the timeline-feed delta: style in both palettes, the caption shown or absent with no gap, the three label cases, Editar calls `onEdit`, Compartir does nothing, and the missing-photo message. Verify that `npm test` passes.
- [x] 9.2 Make `TimelineFeed` render `TextItemCard` or `ImageItemCard` by `item.type`. Extend `timeline-feed-test.tsx`: a feed mixing both types keeps the newest-first order. Verify that `npm test` passes.
- [x] 9.3 Write `docs/components/image-item-card.md`, list it in the components index, and update `docs/components/timeline-feed.md`. Verify that the links resolve.

## 10. Creation box image step

- [x] 10.1 Extend `creation-box-provider.tsx` with the `image` step and its actions (design D9). Extend `creation-box-provider-test.ts`: `confirmType` with `image` opens the step and with `event` does nothing, `photoPicked` replaces the photo and keeps the texts, `pickerFailed` sets the error, and the save actions behave as in the write step.
- [x] 10.2 Create `ImageFields` (photo button, `PhotoPreview` labeled "Foto elegida", "Texto alternativo" with hint and `ALT_TEXT_MAX_LENGTH`, "Pie de foto" with `CAPTION_MAX_LENGTH`) and render the image step in `creation-box.tsx`, with Crear calling `createImage`. Extend `creation-box-test.tsx` with `expo-image-picker` mocked, covering the item-creation delta:
  - "Guardar" with Imagen shows the step with the keyboard closed and Crear disabled
  - picking shows the preview and "Cambiar foto"; a cancelled pick keeps the previous photo; replacing keeps the texts
  - a picker error shows and announces the gallery message, and a retry opens the picker
  - Crear stays disabled with texts only and is enabled with a photo
  - Crear trims, saves once on a double tap (`GatedSqlDatabase`), and closes the box
  - a failed save keeps the photo and fields and shows the message (`FailingSqlDatabase`)
  - Cancelar and Android back discard the draft
  - the screen reader names and hint

  Verify that `npm test` passes.
- [x] 10.3 Update `docs/components/creation-box.md` (the image step and its state). Verify that the links resolve.

## 11. Edit dialogs

- [x] 11.1 Move the frame of `EditTextDialog` into `EditDialogFrame` (design D10), with the text body left in `edit-text-dialog.tsx`. Verify that `edit-text-dialog-test.tsx`, `edit-text-item-test.tsx` and `timeline-back-button-test.tsx` pass **without changing their assertions**.
- [x] 11.2 Create `src/components/edit-image-dialog.tsx` using `EditDialogFrame` and `ImageFields`, with Guardar calling `updateImage`. Make `TimelineFeed` open the dialog that matches the item's type. Write `edit-image-dialog-test.tsx` covering the item-editing delta:
  - prefilled photo and fields, keyboard closed, title "Editar elemento de imagen:"
  - Guardar disabled when unchanged or only whitespace was added, and enabled after clearing a field or picking a new photo
  - "Cambiar foto" updates only the dialog until Guardar; a cancelled pick changes nothing; a picker error shows the message
  - Guardar saves once and the card updates in place
  - a failed save keeps the edit and shows the message
  - Cancelar after a new photo keeps the old one on the card
  - "Borrar esta imagen", "¿Borrar esta imagen?", "No, volver" keeping the new photo, and "Sí, borrar" removing the card
  - the screen reader names

  Verify that `npm test` passes.
- [x] 11.3 Write `docs/components/edit-image-dialog.md`, update `docs/components/edit-text-dialog.md` (the shared frame), list the new page in the index, and add a `docs/decisions/` page for the shared frame (design D10), listed in `docs/decisions/index.md`. Verify that the links resolve.

## 12. Journeys

- [x] 12.1 Add `src/__tests__/e2e/create-image-item-test.tsx` and `edit-image-item-test.tsx` through `renderRouter`, with `expo-image-picker` mocked to return fixture files:
  - create a text, then an image: the image card is first, and the photo file exists in the store
  - with an image draft, switch to Circles and back: the draft is intact
  - edit the image's caption and photo: the card changes in place, and the history holds the previous version
  - delete the image: the card is gone, and its photo files still exist
  - rotate (`setMockWindow`) with an image draft and with the image dialog open: both keep their content

  Verify that `npm test` passes.

## 13. Device check and visual review

- [x] 13.1 With the `run-on-emulator` skill, push a few photos to the emulator (`adb push` plus a media scan), including a portrait, a very tall one and one with EXIF orientation 6. Create an image item from each. Check that the card shapes are right, especially for the rotated photo (design D8). Then force-stop Expo Go, reopen it, and check that the cards are still there (the migration ran on the existing v2 database).
- [x] 13.2 Remove an original from the gallery (`adb shell rm` plus a media scan) and check that its card still shows the photo. Then remove a copied file from the app folder in a debug session and check the "⚠️ Imagen no disponible" fallback.
- [x] 13.3 Check all four layouts (phone and tablet emulators, both orientations): the cards respect `imageMaxHeight`, a whole card with a tall photo fits in phone landscape, and the image dialog scrolls to Guardar and "Borrar esta imagen" with and without the keyboard. Record any value tuned in the design.
- [x] 13.4 Check with TalkBack: the card photo reads its alternative text, then the caption, then "Foto"; the image step and dialog names and the hint; and the picker error announcement, if it can be triggered.
- [x] 13.5 Run the `visual-review` skill in light and dark for the image card (wide, tall, no caption, missing photo), the image step (empty and with a photo) and the image dialog (edit and confirm steps). Compare with `sketches/mobile-portrait-image-item.png` and the approved references. Tune the values in the design's Open Questions. With the user's approval, add the new references to `src/__tests__/e2e/screenshots/` and update `docs/development/visual-review.md`.
- [x] 13.6 Final integration check:
  - `npx expo lint --max-warnings 0`, `npx tsc --noEmit` and `npm test` pass
  - `grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src --include=*.tsx` finds nothing
  - `grep -rn "expo-file-system\|expo-image-picker" src` finds them only in `expo-photo-store.ts`, `use-pick-photo.ts` and tests
  - there are no `ios/` or `android/` folders, and nothing under `sketches/` changed
  - `grep -rnE "eslint-disable|\.only\(|\.skip\(" src` finds nothing new
  - `openspec validate add-image-items --strict` passes

## Workflow follow-up

- After review, run `/opsx:archive add-image-items`. Its guidance updates:
  - `docs/specs/` for item-creation, item-editing, item-storage, timeline-feed, app-theming and adaptive-layout
  - the `docs/decisions/` pages for design D1, D4, D10 and D11
  - the roadmap (image items done; next `add-item-locations`) and known limitations (photos not resized, files kept after deletion, GPS data inside copied photos, "Guardar" with Evento still inactive)
  - `CLAUDE.md` ("Current state", and "When to read what" rows for the image card and dialogs) and `src/items/CLAUDE.md`
  - the `run-on-emulator` skill (pushing photos to the emulator) and the `visual-review` skill (new screens)
- Then start `add-item-locations` with `/opsx:propose`, using the decisions recorded in the exploration: places with optional coordinates, names per place, no location history, three sources (photo GPS data, current position, typed or saved), the phone's own geocoder behind a port, and privacy notes for Phase 4.
