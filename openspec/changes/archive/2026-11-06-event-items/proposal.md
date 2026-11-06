# Proposal

## Why

Families keep memories as small albums ("Tarde de juegos y café", "Our trip to Cádiz"), not as single photos. Today the Timeline only holds texts and single photos, and "📅 Evento" is listed in the creation box but "Guardar" does nothing with it. Event items are the last item type of the Phase 1 roadmap. An event is a **memory**: something that already happened, with a title, a category, one or more photos and an optional description (`sketches/mobile-portrait-event-item.png`).

The event's location was discussed together with this change and moved to the separate `add-item-locations` change, which will cover image and event items together. This change has no location, no new permissions and no new dependencies (see design, Non-Goals).

## What Changes

- **Creation:** "Guardar" with "📅 Evento" opens a new **event step** in the creation box, titled "Crear nuevo elemento de evento:":
  - an "Elegir fotos" button that opens the system photo picker with multiple selection (images only, no permission prompt), up to 10 photos per event; once some are chosen it reads "Añadir fotos" and adds to the end
  - a grid of square thumbnails of the chosen photos, each with a "Quitar" button
  - a "Título" single-line field (required, at most 120 characters)
  - a "Categoría" single-line field (required, at most 24 characters), with suggestion chips ("Familia", "Amigos", "Trabajo", "Encuentro") that fill it in one tap
  - a "Descripción" text area (optional, at most 2000 characters)
  - "Cancelar" and "Crear". Crear is enabled once there is at least one photo, a title and a category.
- **Storage:** on "Crear" every chosen photo is copied into the app's own document folder under a new random name, as for image items. The event stores its title, category, optional description and its ordered list of photos (relative file name, width and height). If any copy or the save fails, the copies already made are removed and nothing is stored.
- **Card:** an event item is drawn as a card with a blue accent bar on its left and a strong border (`sketches/mobile-portrait-event-item.png`). The title is in bold, with the category as a badge to its right. Below, a horizontal row of **square, cropped photo tiles** spans the card's content width and scrolls sideways, sized so the next tile peeks out. The optional description follows in full, then the same "Editar" and "Compartir" actions as other cards. Screen readers announce each tile as "Foto 2 de 5 de <title>".
- **Editing:** "Editar" on an event card opens an **event edit dialog** ("Editar elemento de evento:") with the same fields as the event step, prefilled: the photo grid (remove any photo, "Añadir fotos" to add more), title, category with its chips, description, "Cancelar", "Guardar" and "Borrar este evento". It follows the shared dialog rules: Guardar only for a real change, an in-dialog confirmation ("¿Borrar este evento?"), error messages, and scrolling inside the dialog.
- **History:** editing or deleting an event first archives its previous version, including its whole photo list, in new history tables, in the same transaction. Photo files are never overwritten or removed, as for image items.
- **Limits:** title 120, category 24, description 2000 characters, and 1 to 10 photos, enforced in the domain like the other limits.
- **No new colors:** the card uses the existing `badge_bg`, `badge_text`, `primary_blue_deep` (the accent bar, chosen by the user over the sketch's `primary_blue`), `primary_dark` and `image_backdrop` roles. The badge and accent bar pairs are added to the contrast tests.

## Capabilities

### New Capabilities

None. Event items extend the existing item capabilities, which are organized by behavior across item types (as image items did).

### Modified Capabilities

- `item-creation`: "Guardar with Evento does nothing yet" is removed. New requirements cover the event step (choosing several photos, the photo limit, removing a photo, title, category with suggestions, description, the Crear rule, saving, failure) and its accessibility. The box title, Cancelar and the draft across tab switches cover the event step.
- `item-editing`: "Editar", the dialog title, closing without changes, the confirmation and its wording ("Borrar este evento", "¿Borrar este evento?"), going back from it, and accessibility cover event items. New requirements cover the event dialog's contents, prefilled fields, adding and removing photos, its Guardar rule, saving, failure and scrolling inside.
- `item-storage`: new requirements for event item content (title, category, optional description, 1 to 10 ordered photos), its trimming and limits, editing it and ignoring unchanged edits. The all-or-nothing, history, photo-copy and photo-file requirements cover event items and their several photos.
- `timeline-feed`: new requirements for the event card (accent bar and border, title with category badge, square photo row, description, missing photo tile, accessibility, actions). "Compartir does nothing yet" and "Edits and deletions appear right away" cover event cards.
- `app-theming`: the contrast requirements cover the event card (title, badge, description), the event step and dialog labels and notices, the thumbnail "Quitar" buttons and the category chips. The palettes are required to hold the badge colors.
- `adaptive-layout`: tablet sizes for the event title, badge and thumbnails. Rotation keeps the event step's draft and the open event dialog. The photo tile size follows the layout.

## Impact

- **Code:**
  - `src/items/`: `EventItem` and its normalizer, `InvalidEventError`, migration step 4 (`event_items`, `event_item_photos` and their history tables), repository methods (`saveEvent`, `findEvent`, `updateEvent`, photos loaded per event, an `archive()` case, deletion of both event tables), use cases `createEventItem` and `updateEventItem`, timeline store actions, `TimelineItem` gains `EventItem`.
  - `src/constants/limits.ts` (four limits), `theme.ts` (event sizes and layout values), `use-shell-layout.ts` (tile and thumbnail sizes).
  - Hook `usePickPhotos(limit)` for multiple selection, next to `usePickPhoto`.
  - Components: the creation box and its reducer (event step), shared `EventFields` (photo grid, fields, chips) for the step and the dialog, `EventItemCard` with a photo row and a category badge, `EditEventDialog` on the shared `EditDialogFrame`, `TimelineFeed` choosing card and dialog for events, `ItemCardFrame` accepting the event card's border and accent.
- **Dependencies:** none. `expo-image-picker` already supports multiple selection in Expo Go.
- **Data:** schema version 3 to 4, adding four tables. Text and image items are untouched. Event photos live in the same `<documents>/images/` folder.
- **Tests:** domain, repository (on `node:sqlite`), use case (real files on the Node photo store), store and component tests, Jest journeys for creating, editing and deleting an event with a mocked multi-select picker, rotation, and the badge contrast pair.
- **Device checks:** picking several photos on Android, restart persistence, the card in all four layouts, the dialog in phone landscape, TalkBack reading the tiles, and a visual review in light and dark against the sketch.
- **Docs:** items module and items schema, new component pages, design tokens (event card notes), layout sizes, roadmap, known limitations and the log.
- **Not changed:** routes, the header, the tab bar, the create button, text and image items, locations (`add-item-locations`), the Events tab (Phase 3) and Compartir (Phase 4).
