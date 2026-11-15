---
type: Component
title: Event fields
description: EventFields, EventPhotoGrid and CategorySuggestions, the form shared by the creation box's event step and the event dialog - square thumbnails with remove buttons, the multi-select photo button and limit message, title, category with suggestions, and description.
tags: [component, form, event, photos, accessibility]
resource: ../../src/components/event-fields.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T22:00:00Z
---

# Event fields

Three components shared by the [creation box](creation-box.md) event step and the [edit event dialog](edit-event-dialog.md). They are controlled: the step passes [reducer state](creation-box-provider.md), the dialog its local state.

## `EventFields`

`EventFields({ photos, title, category, description, onPhotosAdded, onPhotoRemoved, onTitleChange, onCategoryChange, onDescriptionChange, onPickerFailed, pickerFailed })`, top to bottom:

1. `EventPhotoGrid` (nothing while there are no photos).
2. The photo button, a secondary [box button](box-button.md): "Elegir fotos" with no photo, "Añadir fotos" once there is one. It calls `usePickPhotos()(room)` with `room = EVENT_MAX_PHOTOS − photos.length`, keeps only the first `room` photos (some Android pickers ignore `selectionLimit`) and passes them to `onPhotosAdded` as new drafts. A cancelled pick adds nothing. It is disabled at the limit, so the picker is never asked for `0` (which means the system maximum). A ref guard ignores a second tap while the picker opens.
3. At the limit, "Un evento puede tener hasta 10 fotos." (`PHOTO_LIMIT_MESSAGE`) with a live region, and `announceForAccessibility` on iOS when a pick fills the event. It goes away as soon as a photo is removed. Derived during render, not stored.
4. On a picker error, "⚠️ No se pudo abrir la galería. Inténtalo de nuevo." (shared with the image fields), with a live region and the iOS announcement.
5. "Título" ([`FieldLabel`](field-components.md) and `BoxTextField`, `EVENT_TITLE_MAX_LENGTH` 120), "Categoría" (`EVENT_CATEGORY_MAX_LENGTH` 24) with `CategorySuggestions` below it, and "Descripción" (`BoxTextArea`, `EVENT_DESCRIPTION_MAX_LENGTH` 2000). Each field is named by its label.

Messages are bold `textMain` at `sizes.boxTitle` on `creationBg`.

## `EventPhotoGrid`

`EventPhotoGrid({ photos, onRemove })`: square thumbnails in rows of `sizes.thumbColumns` (3 on phones, 4 on tablets) that wrap, so no nested scroll view is needed inside the dialog. The side is `(innerWidth − (columns − 1) × Layout.creationGap − 1 device pixel) / columns`, rounded down to whole device pixels, with the same inner width as the [photo preview](photo-preview.md) (about 107 points on the 411-point test phone). The free pixel matters: on the emulator a row of exactly `innerWidth` wrapped its last thumbnail, showing 2 per row instead of 3.

- Each thumbnail is an `expo-image` with `contentFit="cover"` on `imageBackdrop`, `Layout.photoRadius` corners, announced as the image "Foto N de M".
- A sibling remove button sits `Layout.thumbRemoveInset` (4) inside the top right corner: a `controlHeight` square on `surfaceMuted` with a 2-point `primaryDark` border and a `textMain` "✕", named "Quitar foto N". It is a sibling, not a child, of the accessible thumbnail, so the screen reader reaches both.
- Picked drafts show their cache URI and stored drafts their file through `usePhotoUriFor()`.

The file also exports the draft helpers: `EventPhotoDraft` (`{ key, kind: 'picked' | 'stored', photo }`), `pickedDrafts(photos)` (unique counter keys, so the same photo picked twice gets two thumbnails), `storedDrafts(photos)` (keyed by file name) and `appendPhotos(list, added)` (appends and keeps the first `EVENT_MAX_PHOTOS`).

## `CategorySuggestions`

`CategorySuggestions({ onSelect })`: "Familia", "Amigos", "Trabajo" and "Encuentro" (`CATEGORY_SUGGESTIONS`) as buttons named by their text, at least `controlHeight` tall, wrapping, on `surfaceMuted` with a 2-point `primaryDark` border and `textMain` labels. A press replaces the category with the word and doesn't focus the field, so the keyboard stays closed.

Contrast pairs (label and "✕" on `surfaceMuted`, borders on `creationBg` and `surfaceMuted`) are in [Color palettes](../design-system/color-palettes.md).

## Tests

`src/__tests__/unit/components/event-photo-grid-test.tsx` (draft helpers, labels, picked and stored sources, columns per device, square cells, the remove callback, 44-point remove buttons and colors in both palettes, resizing), `category-suggestions-test.tsx` (order, names, press, 44 points, colors, wrapping, tablet) and `event-fields-test.tsx` (button text, cancelled pick, `selectionLimit`, the limit message and disabled button, the picker error, field limits, suggestions).

Spec: [item-creation](../specs/item-creation.md), [item-editing](../specs/item-editing.md).
