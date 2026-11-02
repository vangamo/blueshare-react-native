# Proposal

## Why

Families mostly share photos, but the Timeline only holds texts: "📷 Imagen" is listed in the creation box and "Guardar" does nothing with it. Image items are the next item on the Phase 1 roadmap. The audience includes older adults and people who use screen readers, so each photo needs an alternative text that TalkBack and VoiceOver can read, not only a caption.

Locations for photos were discussed together with this change and split out into a later change, `add-item-locations`, so this one has no permissions, no network and no unknowns (see design, Non-Goals).

## What Changes

- **Creation:** "Guardar" with "📷 Imagen" opens a new **image step** in the creation box, titled "Crear nuevo elemento de imagen:":
  - an "Elegir foto" button that opens the system photo picker (images only, one photo, no crop screen, no permission prompt)
  - a preview of the chosen photo, after which the button reads "Cambiar foto"
  - a "Texto alternativo" text area, with a hint that explains what it is for
  - a "Pie de foto" single-line field
  - "Cancelar" and "Crear". Crear is enabled once a photo is chosen. Alt text and caption are optional.
- **Storage:** on "Crear" the photo is **copied into the app's own document folder** under a new random name. The item stores that relative file name, the photo's width and height, the alt text and the caption. The picker's cache file is not relied on. If saving fails, the copy is removed.
- **Card:** an image item is drawn as a card. The photo spans the content column at its natural proportions, never cropped, up to a maximum height that depends on the layout. Taller photos are centered on a new `image_backdrop` color. The caption shows below it in italic muted text (`sketches/mobile-portrait-image-item.png`), followed by the same "Editar" and "Compartir" actions as text cards. Screen readers announce the photo as an image, using the alt text, else the caption, else "Foto".
- **Editing:** "Editar" on an image card opens an **image edit dialog** ("Editar elemento de imagen:") with the photo preview, "Cambiar foto", the alt text, the caption, "Cancelar", "Guardar" and "Borrar esta imagen". The dialog follows the text dialog's rules: Guardar only for a real change, closing without changes, an in-dialog confirmation ("¿Borrar esta imagen?"), and error messages. The dialog scrolls inside, so it works in phone landscape.
- **History:** editing or deleting an image item first archives its previous version in a new `image_items_history` table, in the same transaction as today. Photo files are never overwritten or removed, because history versions point to them.
- **Shared dialog frame:** the text and image edit dialogs share one frame (title, close button, button rows, confirmation step, messages). The text dialog's behavior and look stay the same.
- **Limits:** alt text at most 1000 characters and caption at most 500, enforced in the domain like the text limit.
- **Dependencies:** `expo-image-picker` (new) and `expo-file-system` (already installed through `expo`, now a direct dependency). Both are included in Expo Go.

## Capabilities

### New Capabilities

None. Image items extend the existing item capabilities, which are organized by behavior across item types.

### Modified Capabilities

- `item-creation`: "Guardar with Evento or Imagen does nothing yet" becomes Evento only. New requirements cover the image step (photo picker, preview, alt text, caption, Crear rule, saving, failure, Cancelar, draft across tab switches) and its accessibility.
- `item-editing`: "Editar opens the edit dialog" and the dialog requirements cover image items too. New requirements cover the image dialog's fields, its Guardar rule (any field changed), changing the photo, its wording ("Borrar esta imagen", "¿Borrar esta imagen?") and scrolling inside the dialog.
- `item-storage`: new requirements for image item content (the photo copied into app storage, its size, optional trimmed alt text and caption with their limits), editing an image item, and keeping photo files that history points to. The history and all-or-nothing requirements now name image items.
- `timeline-feed`: new requirements for the image card (photo at natural proportions with a layout-based maximum height, backdrop, caption, missing-photo fallback, accessibility). "Compartir does nothing yet" and "Edits and deletions appear right away" cover image cards too.
- `app-theming`: a new `image_backdrop` color role in both palettes. The contrast requirements cover the caption, the alt text hint and the image step's controls.
- `adaptive-layout`: the photo's maximum height depends on the layout. Rotation keeps the image step's draft and the open image dialog.

## Impact

- **Code:**
  - `src/items/`: `ImageItem` and its normalizers, `ImageFileStore` port, migration step 3 (`image_items`, `image_items_history`), repository methods, `archive()` case for images, use cases `createImageItem` and `updateImageItem`, timeline store actions, `TimelineItem` becomes a union.
  - New infrastructure adapter `expo-image-file-store.ts` (expo-file-system). A Node file store in `src/test-utils/` for Jest.
  - `src/constants/limits.ts` (two limits), `design-system.json` (`image_backdrop`), `theme.ts` (image sizes), `use-shell-layout.ts` (`imageMaxHeight`).
  - Components: the creation box and its reducer (image step), a new image card, a shared edit dialog frame with text and image bodies, `TimelineFeed` choosing card and dialog by type.
- **Dependencies:** `npx expo install expo-image-picker expo-file-system`. The `expo-image-picker` config plugin goes into `app.json` with a Spanish photo-library text for iOS builds. No change to the app-platform spec: everything stays in Expo Go.
- **Data:** schema version 2 to 3, adding two tables. Existing text items are untouched. Photo files live in `<documents>/images/`.
- **Tests:** domain, repository, use case, store and component tests, a Jest journey for creating, editing and deleting an image item with a mocked picker, contrast pairs for the new color.
- **Device checks:** picking a photo on Android, restart persistence, the card in all four layouts, the dialog with the keyboard in phone landscape, TalkBack reading the alt text, and a visual review in light and dark.
- **Docs:** items module, items schema decision, new component pages, design tokens and palettes, dependencies, roadmap, known limitations (files kept after deletion, original photos not resized) and the log.
- **Not changed:** routes, the header, the tab bar, the create button, event items and Compartir.
