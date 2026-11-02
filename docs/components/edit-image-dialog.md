---
type: Component
title: Edit image dialog
description: Dialog over the Timeline opened by an image card's Editar button, to change or delete an image item. The photo, Cambiar foto, the alternative text and the caption in the shared dialog frame, with a deletion confirmation step.
tags: [component, edit-dialog, items, image, accessibility]
resource: ../../src/components/edit-image-dialog.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T12:00:00Z
---

# Edit image dialog

`EditImageDialog({ item, onClose })`. The [Timeline feed](timeline-feed.md) renders it with `key={item.id}` while an image item is being edited. It is the image body of the shared [`EditDialogFrame`](../decisions/shared-edit-dialog-frame.md) (modal, title, close button, buttons, confirmation, busy and error state: see [Edit text dialog](edit-text-dialog.md)) and reads `useTimeline().updateImage` and `deleteItem`.

## Edit step, top to bottom

"Editar elemento de imagen:" and the close button, then `ImageFields` (also the creation box's [image step](creation-box.md)): the [photo preview](photo-preview.md) (the stored photo, or the newly picked one), "Cambiar foto", "Texto alternativo" with its hint and multi-line field, "Pie de foto" with its single-line field. Then Cancelar and Guardar side by side, a divider and the full-width "Borrar esta imagen".

The dialog scrolls inside (the frame's `ScrollView`), so Guardar and "Borrar esta imagen" can be reached in every layout, also with the keyboard open.

## State and behavior

- Local state: `newPhoto` (a picked photo or `null`), `altText`, `caption` (from the item, `null` as an empty string) and `pickerFailed`. They live in this component, not in the frame, so they survive the confirmation step: "No, volver" keeps a new photo and every edit.
- **Cambiar foto** opens the picker. A pick only changes the preview, the card changes on Guardar. A cancelled pick changes nothing. A picker failure shows "⚠️ No se pudo abrir la galería. Inténtalo de nuevo." and announces it.
- **Guardar** is enabled when `newPhoto` is set or the trimmed alternative text or caption differs from the stored one (clearing a text counts). It calls `updateImage(id, { newPhoto, altText, caption })`: a new photo is copied under a new name (the old file stays, history points to it), and the card updates in place.
- **Borrar esta imagen** shows "¿Borrar esta imagen?" and "Sí, borrar" calls `deleteItem`. The photo files are kept.
- Editing a field hides a previous save error and the picker error.

## Tests

`src/__tests__/unit/components/edit-image-dialog-test.tsx`, through `EditImageDialogHarness` and `seededImageAdapters` (`src/test-utils/edit-image-dialog-harness.tsx`) with `expo-image-picker` mocked: prefilled content, Guardar's rule, the new photo, a cancelled pick, a picker error, saving, a double tap, a failed save with a retry, Cancelar and Cerrar after a new photo, the confirmation step (including "No, volver" keeping the new photo and deletion keeping the files), and the tablet sizes.

Spec: [item-editing](../specs/item-editing.md).
