# Design

## Context

For the motivation, see `proposal.md` (Why). The requirements are in `specs/`: deltas for item-creation, item-editing, item-storage, timeline-feed, app-theming and adaptive-layout. Current state, as checked in the repo:

- **Storage (schema v3):** `items`, `text_items`, `image_items` and their `*_history` tables. `items.type` already accepts `'event'` in its CHECK, so no table is rebuilt. `archive()` in `sqlite-item-repository.ts` throws for `event`. `deleteItem` removes one row from the type's table, looked up in `TYPE_TABLES` (`text` and `image`), then the `items` row. `toTimelineItem` returns `null` for event rows ("can't be shown yet").
- **Items module:** `ItemRepository` has save, find and update methods for text and image items, plus `listTimeline` and `deleteItem`. `TimelineItem = TextItem | ImageItem`. `PhotoStore` (`importPhoto`, `removePhoto`, `uriFor`) copies files into `<documents>/images/`. `StoredPhoto = { file, width, height }` and `PickedPhoto = { uri, width, height, mimeType }` live in `domain/image-item.ts`, with `photoExtension()`. `createImageItem` and `updateImageItem` show the order of operations: validate, copy, save, remove the copy on failure.
- **UI:**
  - `CreationBoxProvider` holds a reducer with the `closed`, `choose`, `write` and `image` steps. `confirmType` ignores `'event'` ("Evento does nothing yet").
  - `ImageFields` (photo button, preview, labeled fields, picker error) is shared by the image step and `EditImageDialog`. `EditDialogFrame` holds the dialog's frame, steps, busy and error state and the back button.
  - `ItemCardFrame` and `CardActions` are shared by the text and image cards. `TimelineFeed` picks the card and the dialog on `item.type`.
  - `BoxTextField`, `BoxTextArea`, `FieldLabel` and `BoxButton` exist. `BoxTextField` has a 2-point `primaryDark` border on `cardBg`.
- **Layout:** `useShellLayout()` returns `sizes`, `columnWidth` and `imageMaxHeight`. `PhotoPreview` computes its inner width as `columnWidth − 2·(cardPadding + borderWidth)`.
- **Tokens:** `badge_bg` and `badge_text` already exist in both palettes and are unused. `design-system.json` `components.feed_cards.event_card` describes a 2px `#0f172a` highlight border (our `primary_dark`), a 6px `#0084ff` left accent bar (our `primary_blue`), the badge colors and a carousel of 110×90 tiles. The user asked for square tiles instead, which overrides the 110×90 note.
- **Facts checked for this change (SDK 58 docs, to be re-checked against the installed types in task 1):**
  - `expo-image-picker` `allowsMultipleSelection` works on Android and iOS 14+, and is mutually exclusive with `allowsEditing`.
  - `selectionLimit` works on Android and iOS 14+. **`0` means the system maximum**, so the app must never pass `0` to mean "none left".
  - `orderedSelection` is iOS 15+ only, and returns assets in the tapped order. Elsewhere the docs give no order guarantee.
  - No permission is needed to open the library, as for image items.
  - Contrast of the colors this change starts using (WCAG formula):

    | Pair | Light | Dark |
    | --- | --- | --- |
    | `badgeText` on `badgeBg` (category) | 5.17 | 8.71 |
    | `textMain` on `cardBg` (event title) | 17.85 | 16.30 |
    | `primaryBlue` on `cardBg` (accent bar, decorative) | 3.66 | 6.80 |
- **Assumptions from the exploration**, proposed and not yet confirmed by the user:
  - the limits: 120, 24 and 2000 characters, and 10 photos (D9)
  - the four category suggestions (D7)
  - generated photo labels with no alt text per photo (D8)
  - removing every photo is allowed while editing, with Crear or Guardar disabled until one is added (D7)

  Each one can change during review without changing the approach.

## Goals / Non-Goals

**Goals:**
- Creating, editing and deleting an event stays all or nothing, across several photo copies, and is tested on real SQL and a real file system.
- Text and image items keep their behavior, look and tests.
- The event step, card and dialog work in all four layouts and rotations, and with TalkBack.
- The photo list is designed once and used by both the creation step and the dialog.

**Non-Goals:**
- **Location.** The separate `add-item-locations` change adds the location tables and UI for image and event items. It will add nullable location columns to `event_items` (and its history table) with `ALTER TABLE ... ADD COLUMN`, as already planned for `image_items`. Nothing here depends on it.
- A date for the memory other than `created_at`.
- Reordering photos, alt text per photo, a full-screen viewer, or tapping a tile.
- Taking photos with the camera.
- Resizing photos, or removing unused photo files.
- The Events tab (Phase 3) and sharing (Phase 4).

## Decisions

### D1. Domain: `EventItem` and its rules

- `src/items/domain/event-item.ts`:
  - `EventItem = ItemMeta & { type: 'event'; title: string; category: string; description: string | null; photos: StoredPhoto[] }`. `StoredPhoto` is reused from `image-item.ts`.
  - `normalizeEventTexts({ title, category, description })` trims all three. A blank title or category throws `InvalidEventError(field, 'blank')`. A text over its limit throws `InvalidEventError(field, 'too_long', max)`. An empty description becomes `null`.
  - `checkPhotoCount(count)` throws `InvalidEventError('photos', 'too_few' | 'too_many', limit)` outside `1..EVENT_MAX_PHOTOS`.
  - `withEventChanges(item, { title, category, description, photos }, now)` returns `null` when the photo files are equal in the same order and all trimmed texts are equal (item-storage "Unchanged event edits are ignored"). Otherwise it returns the changed item with `updatedAt = now`, keeping `id`, `type` and `createdAt`.
- `TimelineItem = TextItem | ImageItem | EventItem`.
- `InvalidEventError` goes in `errors.ts`. The comment on `ItemType` ("Events cannot be created yet") is updated.

**Alternative:** generalize `ImageItem` to hold a list of photos, and treat an event as an image item with a title. Rejected: the image card's "whole photo, never cropped" rules, its alt text and its caption don't apply to events, and both types would grow optional fields.

### D2. Migration step 4

```sql
CREATE TABLE event_items (
  item_id     TEXT PRIMARY KEY NOT NULL REFERENCES items (id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,
  description TEXT                                   -- NULL = none
);
CREATE TABLE event_item_photos (
  item_id      TEXT NOT NULL REFERENCES event_items (item_id) ON DELETE CASCADE,
  position     INTEGER NOT NULL CHECK (position >= 0),
  photo_file   TEXT NOT NULL,                        -- '<uuid>.<ext>' in <documents>/images/
  photo_width  INTEGER NOT NULL CHECK (photo_width > 0),
  photo_height INTEGER NOT NULL CHECK (photo_height > 0),
  PRIMARY KEY (item_id, position)
);
CREATE TABLE event_items_history (
  item_id TEXT NOT NULL, counter INTEGER NOT NULL,
  title TEXT NOT NULL, category TEXT NOT NULL, description TEXT,
  PRIMARY KEY (item_id, counter),
  FOREIGN KEY (item_id, counter) REFERENCES items_history (item_id, counter) ON DELETE CASCADE
);
CREATE TABLE event_item_photos_history (
  item_id TEXT NOT NULL, counter INTEGER NOT NULL, position INTEGER NOT NULL,
  photo_file TEXT NOT NULL, photo_width INTEGER NOT NULL, photo_height INTEGER NOT NULL,
  PRIMARY KEY (item_id, counter, position),
  FOREIGN KEY (item_id, counter) REFERENCES items_history (item_id, counter) ON DELETE CASCADE
);
```

- Appended to `MIGRATIONS`. Steps 1 to 3 are left untouched.
- Text limits and the photo count are domain rules, not SQL CHECKs, so changing them needs no migration. The minimum of one photo can't be a CHECK across rows anyway.
- `position` is 0-based and dense (0, 1, 2, …). The primary key keeps two rows from sharing a position and serves the per-event lookup.

**Alternatives:**
- A JSON array of photos in `event_items`: no column types or CHECKs, and history copies would hold opaque blobs. Rejected, as the items-schema decision rejected JSON payloads.
- Photos as image items with a `parent_id`: they would need to be filtered out of the feed and their history would be split from the event's. Rejected.

### D3. Repository

- **Timeline in two queries.** `TIMELINE_SQL` adds `LEFT JOIN event_items e` and its three columns. Photos are one-to-many, so a join would repeat the item rows. A second query fetches them:

  ```sql
  SELECT p.item_id, p.position, p.photo_file, p.photo_width, p.photo_height
  FROM event_item_photos p JOIN items i ON i.id = p.item_id
  WHERE i.deleted_at IS NULL
  ORDER BY p.item_id, p.position
  ```

  It is grouped into a `Map<itemId, StoredPhoto[]>` in TypeScript. `toTimelineItem` builds an `EventItem` when `type = 'event'`, the title is set and the map has at least one photo. Otherwise it returns `null`, which hides the row as for broken image rows. Both reads happen right after the migration, with no writes in between, so they need no transaction.
- `saveEvent(item)` inserts into `items`, `event_items` and one `event_item_photos` row per photo, in one transaction.
- `findEvent(id)` reads the joined row plus its photos.
- `updateEvent(item)`, in one transaction: `liveType`, then `archive()`, then `UPDATE items.updated_at`, `UPDATE event_items`, `DELETE FROM event_item_photos WHERE item_id = ?`, and insert the new list. Rewriting the list is simpler than diffing it, and costs at most 10 rows.
- `archive()` gets an `event` case. It copies the `event_items` row into `event_items_history`, and every `event_item_photos` row into `event_item_photos_history` with the same counter (one `INSERT ... SELECT`).
- **Deletion:** `TYPE_TABLES` becomes a list of tables per type, children first: `event: ['event_item_photos', 'event_items']`. Rows are still deleted explicitly, because the Expo driver's exclusive transactions don't enforce foreign keys.

### D4. Use cases and the order of operations

`createEventItem(deps)({ photos: PickedPhoto[], title, category, description })`:
1. `normalizeEventTexts` and `checkPhotoCount` throw before anything is copied.
2. For each photo, in order: pick a new file name (`ids.newId()` plus `photoExtension`), then `photos.importPhoto`. If a copy fails, the copies already made are removed (best effort) and the error is rethrown.
3. `repository.saveEvent(item)`. If it fails, every copy is removed and the error is rethrown.

`updateEventItem(deps)(id, { photos: EventPhotoInput[], title, category, description })`, where `EventPhotoInput = { kind: 'stored'; photo: StoredPhoto } | { kind: 'picked'; photo: PickedPhoto }`:
1. `repository.findEvent(id)`, else `ItemNotFoundError`.
2. Validate the texts and the count before copying anything.
3. Compare first, with the picked entries as placeholders. A list with any picked photo always counts as changed. If nothing changed, return the current item: nothing is copied or written.
4. Copy only the picked photos, in order. Then `repository.updateEvent`. If anything fails, only the new copies are removed. Removed photos keep their files, because history points to them.

Copies run one after another, not in parallel. That keeps the rollback list simple and avoids memory spikes with 10 large originals.

### D5. Timeline store and hook

- `createEvent(input)` and `updateEvent(id, input)` behave like their image twins: wait for the load, put a created item first, replace an updated one in place, keep the snapshot unchanged on a no-op, and reject with the snapshot untouched.
- `differs()` gets an `event` case: title, category, description, and the photo files joined in order.
- `useTimeline()` exposes both.

### D6. Picking several photos

- `src/hooks/use-pick-photos.ts` returns `pickPhotos(max: number): Promise<PickedPhoto[]>`. It calls `launchImageLibraryAsync({ mediaTypes: 'images', allowsMultipleSelection: true, selectionLimit: max, orderedSelection: true, quality: 1, exif: false })`.
  - It is only called with `max >= 1`, because the button is disabled at the limit and `0` would mean the system maximum.
  - A cancelled pick returns `[]`. Errors are thrown to the caller, which shows the gallery message.
  - Each asset gets the same size fallback as `usePickPhoto` (`Image.loadAsync` when the picker reports `0`). That code moves into one helper used by both hooks.
- **Truncation:** some Android pickers may ignore `selectionLimit`. The caller keeps only the first `max` photos, which fills the event, so the limit message shows (item-creation "Event photo limit").
- `exif: false`, as for image items. `add-item-locations` decides how locations are read.
- Jest mocks `expo-image-picker` per test, returning fixture files from the Node photo store.

### D7. The event step and the shared `EventFields`

- `CreationState` gains:

  ```ts
  { step: 'event'; photos: EventPhotoDraft[]; title: string; category: string; description: string;
    saving: boolean; error: 'save' | 'picker' | null }
  ```

  The actions are `photosAdded` (appends, keeping only the first photos up to `EVENT_MAX_PHOTOS`), `photoRemoved(key)`, `setTitle`, `setCategory`, `setDescription` and `pickerFailed`. The existing `saveStarted`, `saveFailed` and `close` handle the new step. `confirmType` moves to `event` for `'event'`.
- `EventPhotoDraft = { key: string; kind: 'stored' | 'picked'; ... }`. The `key` is the stored file name, or a counter for picked photos, so the same gallery photo picked twice still gets two thumbnails with stable React keys. In the creation step every entry is `picked`.
- The limit message and the disabled photo button are derived during render from `photos.length === EVENT_MAX_PHOTOS`. Truncation always leaves exactly the maximum, so no extra flag is needed, and both go away as soon as a photo is removed.
- **`EventFields`** (new, shared by the step and the dialog): `EventPhotoGrid` (thumbnails, remove buttons), the photo button ("Elegir fotos" or "Añadir fotos"), the picker and limit messages, the "Título" and "Categoría" `BoxTextField`s with `FieldLabel`s, `CategorySuggestions`, and the "Descripción" `BoxTextArea`. It is controlled: the step passes reducer state, and the dialog passes local state.
- **Category suggestions:** four `Pressable`s that wrap, at least `controlHeight` tall, on `surfaceMuted` with a 2-point `primaryDark` border (like `BoxTextField`) and `textMain` labels. A press calls `onCategoryChange(word)` and doesn't focus the field, so the keyboard stays closed.
- Crear rule: `photos.length >= 1 && title.trim() && category.trim() && !saving`.

### D8. The thumbnail grid

- Columns: `sizes.thumbColumns` (3 on phones, 4 on tablets). Side: `(innerWidth − (columns − 1)·Layout.creationGap) / columns`, using the same inner width as `PhotoPreview`. That is about 95 points on a 375-point phone.
- Each thumbnail is an `expo-image` with `contentFit="cover"` on `imageBackdrop`, `Layout.photoRadius` corners, `accessible`, `accessibilityRole="image"` and the label "Foto N de M".
- The remove button is a `Pressable` of `sizes.controlHeight` square, inset 4 points into the thumbnail's top right corner. It has a `surfaceMuted` background, a 2-point `primaryDark` border, a `textMain` "✕", and the label "Quitar foto N". Both contrasts are covered by the theme tests: the `✕` against the button, and the border against the button (app-theming).
- The grid wraps with `flexWrap`, so no nested scroll view is needed inside the dialog's `ScrollView`.

### D9. Limits

`src/constants/limits.ts` gets `EVENT_TITLE_MAX_LENGTH = 120`, `EVENT_CATEGORY_MAX_LENGTH = 24`, `EVENT_DESCRIPTION_MAX_LENGTH = 2000` and `EVENT_MAX_PHOTOS = 10`. Lengths count UTF-16 code units, like the others. 24 characters keeps the badge from squeezing the title on a phone: about 170 points at 14-point bold, out of about 300.

### D10. The event edit dialog

- `EditEventDialog` on `EditDialogFrame`, with the title "Editar elemento de evento:", the delete label "Borrar este evento" and the confirm title "¿Borrar este evento?". It holds local state `{ photos: EventPhotoDraft[], title, category, description, pickerFailed }`, starting from the stored item (photos as `stored` entries, keyed by file name). It renders `EventFields`.
- `canSave` = valid (at least one photo, title and category not blank) and changed. "Changed" means the photo keys differ from the stored file list in order, or any picked entry is present, or a trimmed text differs.
- `onSave` maps the drafts to `EventPhotoInput[]` and calls `updateEvent`. Rendered with `key={item.id}`, like the other dialogs.
- The frame's `ScrollView` already covers "Event dialog scrolls inside". It is checked with 10 photos in phone landscape.

### D11. The event card

- **Frame:** `ItemCardFrame` gets an optional `accent` prop. When it is set, the frame uses a `primaryDark` border and `borderLeftWidth: Layout.accentBarWidth` (6) in `primaryBlue`. RN draws per-side border colors with the card's rounded corners, which matches the sketch's bar inside the curve. The visual review confirms it on Android and adjusts if needed (Open Questions).
- **Header:** a row with the title (`Text`, `accessibilityRole="header"`, `flex: 1`, bold, `sizes.eventTitle`, `textMain`) and `CategoryBadge`. The badge has `flexShrink: 0` and `alignSelf: 'flex-start'`, `badgeBg` and `badgeText`, bold `sizes.badgeText`, `Radius.pill`, and `Layout.badgePaddingH/V`. Its accessibility label is "Categoría: <category>".
- **Photo row:** a horizontal `ScrollView` (at most 10 children, so no virtualization is needed), with `showsHorizontalScrollIndicator={false}` and a `Layout.eventTileGap` (10) gap. Each tile is an `EventPhotoTile`: a `View` of `tileSize` square on `imageBackdrop`, with `expo-image` `contentFit="cover"`. `onError` switches it to the "⚠️ Imagen no disponible" text, using local state set from an event, as `PhotoPreview` does. Label: "Foto N de M de <title>".
- **Tile size:** `useShellLayout()` adds `eventTileSize`: `min((eventInnerWidth − 2·eventTileGap) / Layout.eventTilePeek, imageMaxHeight)`, with `eventTilePeek = 2.4` (two tiles and 40% of a third). Here `eventInnerWidth = columnWidth − 2·cardPadding − borderWidth − accentBarWidth`. That gives about 116 points on a 375-point phone, close to the sketch.
- **Description:** like a text card's body (`sizes.cardText`, `cardLineHeight`, `textSecondary`), after `Layout.photoGap`.
- **Actions:** the shared `CardActions`.
- `TimelineFeed` renders `EventItemCard` for `type === 'event'` and `EditEventDialog` for an event `editing` item.

**Alternatives:**
- A horizontal `FlatList` for the row: virtualization isn't needed for 10 items, and a nested list inside the feed's `FlatList` adds warnings and complexity.
- Natural-proportion tiles (like the image card): rejected by the user, who asked for squares.
- Paging one photo per screen: hides the "more photos" cue that the peeking tile gives.

### D12. Tokens and sizes

- **No new color roles.** The card uses `primaryDark`, `primaryBlue`, `badgeBg`, `badgeText`, `imageBackdrop`, `textMain`, `textSecondary` and `textMuted`.
- **New contrast pairs in `theme-test.ts`** (both palettes):
  - `badgeText` on `badgeBg` ≥ 4.5
  - `textMain` on `surfaceMuted` for the suggestion labels and the `✕`
  - `primaryDark` on `creationBg` (suggestion border) and on `surfaceMuted` (remove button border) ≥ 3
- **`Sizes` (phone / tablet):**
  - `eventTitle` 17 / 19
  - `badgeText` 14 / 15
  - `thumbColumns` 3 / 4
  - The fields reuse `controlHeight`, `inputFont`, `fieldLabel`, `textAreaMin` and `textAreaMax`.
- **`Layout`:**
  - `accentBarWidth` 6
  - `eventTileGap` 10
  - `eventTilePeek` 2.4
  - `badgePaddingH` 10, `badgePaddingV` 4
  - `thumbRemoveInset` 4

### D13. Copy and labels

| Where | Text |
| --- | --- |
| Event step title | "Crear nuevo elemento de evento:" |
| Photo button | "Elegir fotos" / "Añadir fotos" |
| Thumbnail label | "Foto N de M" |
| Remove button | "✕", labeled "Quitar foto N" |
| Field labels | "Título", "Categoría", "Descripción" |
| Suggestions | "Familia", "Amigos", "Trabajo", "Encuentro" |
| Limit message | "Un evento puede tener hasta 10 fotos." |
| Dialog title | "Editar elemento de evento:" |
| Deletion | "Borrar este evento", "¿Borrar este evento?" |
| Card tile label | "Foto N de M de <title>" |
| Card badge label | "Categoría: <category>" |

The picker, save, delete and missing-photo messages reuse the existing ones. Accessibility labels match the visible text, except the `✕` buttons and the badge, which follow the existing close button's pattern (`docs/decisions/spanish-copy-labels.md`).

## Risks / Trade-offs

- [**Photo order on Android:** the docs only promise the tapped order on iOS 15+ (`orderedSelection`).] → Accepted. The order is the picker's, and the user can remove a photo and add it again to move it to the end. The device check records what the Android picker does. Reordering is a non-goal.
- [**`selectionLimit` ignored by some pickers.**] → The code truncates and shows the limit message, as the spec requires. Tested with a mock that returns too many.
- [**Ten originals at once:** copying 30 to 120 MB can take a few seconds, and decoding ten full-size photos in a row can use a lot of memory.] → Copies run one after another while Crear shows as busy. `expo-image` decodes to the view size. The device check times a 10-photo save and scrolls a feed of events. Resizing stays a later change (known limitations).
- [**A horizontal row inside the vertical feed:** gestures could clash, and TalkBack might not scroll to off-screen tiles.] → `ScrollView` handles the axis lock. TalkBack scrolls focused children into view on Android. Both are checked on the device (task 12). If needed, each tile gets `onAccessibilityAction` focus handling.
- [**Strong border plus accent bar** may render differently on iOS and Android with rounded corners.] → Checked in the visual review. The fallback is an absolutely positioned bar inside a clipped container.
- [**Orphan files** if the app is killed between the copies and the transaction.] → Unreferenced files, harmless, covered by the future cleanup (as for image items).
- [**Old builds opening a v4 database.**] → `migrate()` does nothing above its step count. Old code already returns `null` for event rows, so they are hidden there, not lost.
- [**Storage keeps growing:** removed photos keep their files for the history.] → Same trade-off as image items, already in known limitations.

## Migration Plan

- Step 4 runs on launch on existing v3 databases. Text and image items and their history are untouched.
- **Rollback:** revert the code. A v4 database stays readable by v3 code, which hides event items. During development, clearing Expo Go's data resets the database and `<documents>/images/`.

## Open Questions

- The exact `eventTilePeek`, the badge padding and the tablet `eventTitle` size are tuned in the visual review. None of them changes the specs.
- Whether the accent bar is drawn with `borderLeftWidth` or with a clipped inner view, depending on how Android draws it (D11).
