# Design

## Context

For the motivation, see `proposal.md` (Why). The requirements are in `specs/`: deltas for item-creation, item-editing, item-storage, timeline-feed, app-theming and adaptive-layout. Current state, as checked in the repo:

- **Storage (schema v2):** `items`, `text_items`, `items_history`, `text_items_history`. `items.type` already accepts `'image'` in its CHECK, so no table has to be rebuilt. `archive()` in `sqlite-item-repository.ts` throws for any type other than `text`. `deleteItem` removes the `text_items` row and the `items` row explicitly, because the Expo driver's exclusive transactions don't enforce foreign keys.
- **Items module:** `ItemRepository` has `saveText`, `listTimeline`, `findText`, `updateText` and `deleteItem`. `TimelineItem` is `TextItem`. Ports: `Clock`, `IdGenerator`, `SqlDatabase`. `createAppAdapters()` returns `{ db, ids, clock }`, and Jest replaces it in `src/test-utils/jest-setup.ts`.
- **UI:**
  - `CreationBoxProvider` holds a reducer with the `closed`, `choose` and `write` steps. `confirmType` only moves on for `text`.
  - `EditTextDialog` (290 lines) owns its whole state machine (edit and confirm steps, busy, errors) in a local reducer, inside an RN `Modal` with a `ScrollView`.
  - `TimelineFeed` renders `TextItemCard` for every item and `EditTextDialog` for `editingId`.
- **Layout:** `useShellLayout()` returns `kind`, `device`, `landscape`, `frame` (header and tab bar heights, column) and `sizes` (phone or tablet), and `columnWidth`. It already reads the window size and the safe-area insets.
- **Facts checked for this change (SDK 58 docs and installed types):**
  - `expo-image-picker`, `expo-file-system` and `expo-location` are included in Expo Go. `expo-file-system` 58.0.13 is installed only through `expo`. `expo-image-picker` is not installed.
  - The picker needs **no permission** to open the library. `launchImageLibraryAsync` resolves to `{ canceled, assets }`. Each asset has a `uri` in the **cache** folder, `width` and `height` (which "can be `0`"), and `mimeType`, `fileName` and `assetId`, which can be `null`. `mediaTypes` takes `'images'`.
  - The `expo-image-picker` config plugin takes `photosPermission` (iOS text), and `cameraPermission` and `microphonePermission`. Setting either of the last two to `false` blocks Android `CAMERA` or `RECORD_AUDIO`.
  - `expo-file-system` 58 has `File`, `Directory` and `Paths`. `Paths.document` is never cleared by the system. `Directory#create({ intermediates, idempotent })`, `File#copy()` (async), `File#delete()` and `exists` are available. The old functions live in `expo-file-system/legacy`.
  - `expo-image`'s `Image` takes `accessible`, `accessibilityLabel` (alias `alt`), `onLoad` and `onError`. `Image.loadAsync(source)` resolves to an `ImageRef` with the decoded size.
  - Contrast of the proposed colors (WCAG formula):

    | Pair | Light | Dark |
    | --- | --- | --- |
    | `textMuted` on `cardBg` (caption) | 7.58 | 6.96 |
    | `textMuted` on `creationBg` (hint) | 7.02 | 6.16 |
    | `textMuted` on `imageBackdrop` (missing photo) | 6.15 | 5.71 |
- **Assumptions from the exploration**, proposed and not yet confirmed by the user: the limits of 1000 and 500 characters (D3), keeping original photos with no resizing (D1), and keeping photo files after deletion (D1). Each can change during review without changing the approach.

## Goals / Non-Goals

**Goals:**
- Photos survive restarts, gallery deletions and cache clean-ups, and work offline.
- Every create, edit and deletion stays all or nothing, including the photo file, and is tested on real SQL and a real file system.
- The text item's behavior, look and tests stay unchanged while its dialog moves onto a shared frame.
- The image step and dialog work in all four layouts and rotations.

**Non-Goals:**
- **Locations.** The next change, `add-item-locations`, adds the `locations` and `location_names` tables, the three sources of coordinates, geocoding and the location UI. It will add nullable `location_id` and `location_name_id` columns to `image_items` with `ALTER TABLE ... ADD COLUMN`. Nothing here should depend on it.
- Taking a photo with the camera, several photos per item (carousels), cropping or rotating.
- Resizing, recompressing or stripping metadata from photos (see Risks).
- Removing unused photo files, showing history, full-screen viewing or zoom.
- Sharing (Phase 4).

## Decisions

### D1. Photos are copied into app storage, one immutable file per chosen photo

- On "Crear" or "Guardar" with a new photo, the picked file is copied to `Paths.document/images/<uuid>.<ext>`. The UUID comes from the existing `IdGenerator`, and the extension from the asset's `mimeType`, else from its `uri`, else `jpg`.
- **Only the relative file name is stored** (`photo_file`). The full URI is rebuilt at runtime, because on iOS the app container's absolute path changes between installs and updates.
- **Files are never overwritten or deleted** by edits or deletions. History versions point to them (item-storage "Photo files are kept for the history"). The one exception is the cleanup of a copy whose save failed (D5).
- The width and height are stored, so the card can reserve its space before the image loads.
- **Original quality is kept.** The copy is byte for byte the same as the picked file.

**Alternatives:**
- A blob in SQLite: the database grows with every photo and with every history version, and `expo-image` can't render a blob without base64 copies.
- Storing the picker's URI: it points to a cache file (or an Android content URI with a temporary grant) that can disappear.
- Naming the file after the item id: replacing a photo would overwrite the file that history points to.
- Resizing on import with `expo-image-manipulator`: smaller files, but another dependency and a quality choice that belongs with Phase 4 sharing.

### D2. Migration step 3

```sql
CREATE TABLE image_items (
  item_id      TEXT PRIMARY KEY NOT NULL REFERENCES items (id) ON DELETE CASCADE,
  photo_file   TEXT NOT NULL,                                  -- '<uuid>.<ext>' in <documents>/images/
  photo_width  INTEGER NOT NULL CHECK (photo_width > 0),
  photo_height INTEGER NOT NULL CHECK (photo_height > 0),
  alt_text     TEXT,                                           -- NULL = none
  caption      TEXT                                            -- NULL = none
);
CREATE TABLE image_items_history (
  item_id      TEXT NOT NULL,
  counter      INTEGER NOT NULL,
  photo_file   TEXT NOT NULL,
  photo_width  INTEGER NOT NULL,
  photo_height INTEGER NOT NULL,
  alt_text     TEXT,
  caption      TEXT,
  PRIMARY KEY (item_id, counter),
  FOREIGN KEY (item_id, counter) REFERENCES items_history (item_id, counter) ON DELETE CASCADE
);
```

- Appended to `MIGRATIONS`. Steps 1 and 2 are left untouched.
- The text limits are not SQL CHECKs, as for text items: the domain enforces them, so changing them needs no migration.
- `photo_width` and `photo_height` hold the displayed (upright) size, see D8.

### D3. Domain

- `src/items/domain/image-item.ts`:
  - `ImageItem = ItemMeta & { type: 'image'; photo: { file: string; width: number; height: number }; altText: string | null; caption: string | null }`
  - `normalizeImageTexts({ altText, caption })` trims both texts, turns an empty string into `null`, and throws `InvalidImageTextError(field, 'too_long', max)` over a limit.
  - `withImageChanges(item, changes, now)` returns the changed item, or `null` when the photo is the same and both trimmed texts are equal to the stored ones (item-storage "Unchanged image edits are ignored").
- `TimelineItem = TextItem | ImageItem`.
- `src/constants/limits.ts` gets `ALT_TEXT_MAX_LENGTH = 1000` and `CAPTION_MAX_LENGTH = 500`, counted in UTF-16 code units like `TEXT_MAX_LENGTH`.
- `UI` code narrows items on `item.type`.

### D4. `PhotoStore` port and its adapters

```
domain/ports.ts                                    infrastructure/
  interface PhotoStore {                             expo-photo-store.ts   (expo-file-system: File, Directory, Paths)
    importPhoto(sourceUri, fileName): Promise<void>  test-utils/
    removePhoto(fileName): Promise<void>               node-photo-store.ts (node:fs in a temp folder per test)
    uriFor(fileName): string
  }
```

- `importPhoto` creates `images/` with `{ intermediates: true, idempotent: true }` and copies the file. `removePhoto` ignores a missing file.
- `createAppAdapters()` returns `photos` too, and the Jest mock in `jest-setup.ts` returns a `NodePhotoStore` in a fresh temp folder. Real file I/O runs in tests, following the "no fake repository" rule.
- **How the UI gets a photo URI:** `createItemsModule` returns `{ store, photos }`. `ItemsProvider` already exposes the module, and a new hook `usePhotoUri(file)` reads `photos.uriFor`. The UI never imports `infrastructure/`.
- The local rule in `src/items/CLAUDE.md` ("Expo imports only in ...") gains `expo-photo-store.ts`.

**Alternative:** putting the full URI in `ImageItem`. Rejected, because the domain would then hold a device-specific path, and the stored value would be different from the domain value.

### D5. Use cases and the order of operations

`createImageItem(deps)({ photo: PickedPhoto, altText, caption })`:
1. `normalizeImageTexts` throws before anything is written.
2. Choose the file name, then `photos.importPhoto(photo.uri, fileName)`.
3. `repository.saveImage(item)`, in one transaction (`items` and `image_items`).
4. If step 3 fails, `photos.removePhoto(fileName)` runs as a best effort and the original error is rethrown.

`updateImageItem(deps)(id, { newPhoto: PickedPhoto | null, altText, caption })`:
1. `repository.findImage(id)`, else `ItemNotFoundError`.
2. `withImageChanges` with the new file name only when `newPhoto` is set. `null` means nothing is written.
3. If there's a new photo, import it. Then `repository.updateImage(item)`. If that fails, the new copy is removed and the error is rethrown.

`deleteItem` is unchanged at this level. The repository handles the type (D6).

`PickedPhoto = { uri, width, height, mimeType }` is a domain type, so the use cases don't depend on the picker.

### D6. Repository

- `TIMELINE_SQL` adds `LEFT JOIN image_items m ON m.item_id = i.id` and its columns. `toTimelineItem` builds an `ImageItem` when `type = 'image'` and `photo_file` is set.
- `saveImage(item)`, `findImage(id)` and `updateImage(item)` follow the text methods. `updateImage` archives, then updates `items.updated_at` and the `image_items` columns.
- `archive()` gets an `image` case that copies the `image_items` row into `image_items_history`.
- `deleteItem` deletes the row from the type's table (`text_items` or `image_items`) before the `items` row. A small map from type to table is enough. Event items still throw.

### D7. Timeline store and hook

- `createImage(input)` and `updateImage(id, input)` behave like `createText` and `updateText`: they wait for the load, put a created item first, replace an updated item in place, keep the snapshot unchanged on a no-op, and reject with the snapshot untouched.
- `useTimeline()` exposes both.

### D8. Picking a photo

- `src/hooks/use-pick-photo.ts` returns `pickPhoto(): Promise<PickedPhoto | null>`. It calls `launchImageLibraryAsync({ mediaTypes: 'images', allowsMultipleSelection: false, allowsEditing: false, quality: 1, exif: false })`. A cancelled pick returns `null`, and errors are thrown to the caller, which shows the picker message.
- **Size:** when the asset reports `0` for `width` or `height`, the hook calls `Image.loadAsync(uri)` from `expo-image` and uses the decoded size. The device check (task 9) also confirms that a rotated photo (EXIF orientation 6) reports its upright size. If it doesn't, the hook always takes the size from `Image.loadAsync`.
- The picker is a UI concern, so the hook lives in `src/hooks/` and not in `src/items/`. Jest mocks `expo-image-picker` per test, returning a real temp file from the Node photo store's fixtures.
- `exif: false` for now. `add-item-locations` will turn it on to read GPS data.
- The picker result arrives after an `await` in a press handler, so dispatching it is not a setState in an effect.

### D9. The creation box image step

- `CreationState` gains `{ step: 'image'; photo: PickedPhoto | null; altText: string; caption: string; saving: boolean; error: 'save' | 'picker' | null }`. New actions are `photoPicked`, `setAltText`, `setCaption` and `pickerFailed`. `confirmType` moves to `image` for `'image'` and still ignores `'event'`.
- The draft lives in `CreationBoxProvider` above the tabs, so tab switches and rotations keep it, as for text. It holds the cache URI, and the copy happens only on Crear.
- New shared components:
  - `PhotoPreview` (photo, backdrop, sizing from D11), used by the step, the dialog and the card.
  - `BoxTextField` (single line), next to `BoxTextArea`.
  - `FieldLabel` (label and optional hint), used by both forms.
- The image step's form (photo button, preview, labeled fields) is one `ImageFields` component, reused by the dialog.

### D10. A shared edit dialog frame

- `EditDialogFrame` takes over what `EditTextDialog` does around the text area: the `Modal`, overlay, `ScrollView`, column width, title and close button, the edit and confirm steps, busy and error state, the double-tap guard, back button handling, the divider, the deletion button and the error announcements.
- It takes `title`, `deleteLabel`, `confirmTitle`, `canSave`, `onSave`, `onDelete`, `onClose` and `children` (the body).
- `EditTextDialog` becomes a body holding the text state. `EditImageDialog` holds `{ newPhoto, altText, caption }` and renders `ImageFields`.
- The picker error message is shown by the image body.
- **Guard:** `edit-text-dialog-test.tsx` and `edit-text-item-test.tsx` must pass with no change to their assertions before the image dialog is added.
- The existing `ScrollView` already lets the content scroll. The image dialog adds no new mechanism for item-editing "Image dialog scrolls inside", only a check in phone landscape.

**Alternative:** a separate image dialog copied from the text one. Rejected, because two copies of the confirmation, error and back-button logic would drift.

### D11. The image card and its sizing

- **`imageMaxHeight` in `useShellLayout()`:** `height − insets.top − insets.bottom − frame.headerHeight − frame.tabBarHeight − 2·sizes.contentPadding − cardChrome`. `cardChrome` is the card's padding and border, the photo gap, one caption line, and the action row (padding and `sizes.actionHeight`). There is a floor of `Layout.imageMinHeight` (120).
- **Per photo:** `boxWidth = columnWidth − 2·(cardPadding + border)`, then `naturalHeight = boxWidth · h / w` and `boxHeight = min(naturalHeight, boxWidth · 5/4, imageMaxHeight)`.
- The box has the `imageBackdrop` background and `Layout.photoRadius` (12). `expo-image` uses `contentFit="contain"`, so a tall photo is centered with the backdrop on its sides, and a wide one fills the box.
- The preview in the creation box and the dialog uses the same function, with the box's inner width.
- **Missing photo:** `onError` switches the box to "⚠️ Imagen no disponible" in `textMuted`. That is local state set from an event, not an effect.
- **Accessibility:** the image is `accessible` with `accessibilityRole="image"`. Its label is `altText ?? caption ?? 'Foto'`. The caption is a separate `Text`.
- `ImageItemCard` reuses the card frame and the `CardAction` row from `TextItemCard`, moved into a shared `ItemCardFrame` or `CardActions`. `TimelineFeed` picks the card and the dialog by `item.type`.

**Alternatives:**
- A fixed 170-point box with cover, as in the sketch. Rejected by the user: it crops faces.
- Uncapped natural height. Rejected: one portrait photo fills the screen.

### D12. Tokens and sizes

- **Color role `image_backdrop`:** light `#e2e8f0` (the sketch's image box), dark `#1e293b`. It goes into both `colors` and `colors_dark` and into the contrast pairs in `theme-test.ts`, using the table in Context.
- **`Sizes` (phone / tablet):**
  - `captionText` 14 / 15
  - `fieldLabel` 14 / 15
  - `fieldHint` 14 / 15
  - The caption field reuses `controlHeight` and `inputFont`, and the photo button reuses the box button sizes.
- **`Layout`:**
  - `photoRadius` 12
  - `photoGap` 8
  - `imageMinHeight` 120
  - `imageMaxRatio` 1.25
- The caption is italic with `textMuted`. The labels are bold with `textMain` at `fieldLabel`. The hint uses `textMuted`.

### D13. Dependencies and app config

- `npx expo install expo-image-picker expo-file-system`, then `npx expo install --check` and `npx expo-doctor`.
- `app.json` plugin, so builds outside Expo Go ask only for what the app uses:

  ```json
  ["expo-image-picker", {
    "photosPermission": "BlueShare usa las fotos que eliges para compartirlas con tu familia.",
    "cameraPermission": false,
    "microphonePermission": false
  }]
  ```
- The storage permissions the library adds on Android can't be blocked through the plugin. They are harmless with the system photo picker, and are recorded in the docs.

### D14. Copy and labels

| Where | Text |
| --- | --- |
| Image step title | "Crear nuevo elemento de imagen:" |
| Photo button | "Elegir foto" / "Cambiar foto" |
| Field labels | "Texto alternativo", "Pie de foto" |
| Hint | "Describe la foto para quien no pueda verla." |
| Preview label | "Foto elegida" |
| Dialog title | "Editar elemento de imagen:" |
| Deletion | "Borrar esta imagen", "¿Borrar esta imagen?" |
| Picker error | "⚠️ No se pudo abrir la galería. Inténtalo de nuevo." |
| Missing photo | "⚠️ Imagen no disponible" |
| Card image label fallback | "Foto" |

The save and delete errors reuse the existing messages. Accessibility labels match the visible text, following the Spanish copy and labels decision (`docs/decisions/spanish-copy-labels.md`).

## Risks / Trade-offs

- [**Storage grows:** original photos (3 to 12 MB each) are kept, and files of replaced photos and deleted items are never removed.] → Accepted for a personal, local timeline. Recorded in known-limitations. A cleanup that removes files no live item or history version points to can come later without a schema change.
- [**Photo metadata:** the copied file may still contain the camera's GPS data. Phase 4 could leak a location by sending the file, even if places are never shared.] → Recorded for Phase 4 and for `add-item-locations`. Stripping metadata belongs with resizing before sharing.
- [**Rotated photos** might report a sideways width and height, giving the wrong box shape.] → D8: a device check with a rotated photo, and `Image.loadAsync` as the source of the size if needed.
- [**The cache file of a draft** could be cleared by the system before Crear.] → Rare while the app is running. The copy then fails and the step shows the save error. Picking again fixes it.
- [**A copied file without a database row** if the app is killed between the copy and the transaction.] → An unreferenced file, harmless and covered by the future cleanup. The UI never shows it.
- [**Moving `EditTextDialog` onto a shared frame** could change text editing.] → D10: the existing text dialog tests must pass unchanged first, then the visual review compares it with the approved screenshots.
- [**Small photos in phone landscape:** about 250 points of content leaves roughly 130 points for a tall photo.] → Required by the spec, so a whole card stays visible. The floor keeps it from collapsing. Tuned in the visual review.
- [**Old builds opening a v3 database.**] → `migrate()` does nothing above its step count. Old code skips image rows in `toTimelineItem`, so they are hidden there, not lost.

## Migration Plan

- Step 3 runs on launch on existing v2 databases. Text items and their history are untouched.
- **Rollback:** revert the code. A v3 database stays readable by v2 code, which hides image items. During development, clearing Expo Go's data resets both the database and `<documents>/images/`.

## Open Questions

- The exact `imageMinHeight` floor, the dark `image_backdrop` value and the tablet hint size are tuned in the visual review. None of them changes the specs.
