---
type: Component
title: Edit event dialog
description: The edit dialog for an event item - the shared event fields prefilled from the stored item, photos removed or added only in the dialog until Guardar, and "Borrar este evento" with its confirmation.
tags: [component, dialog, event, editing, photos]
resource: ../../src/components/edit-event-dialog.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T22:00:00Z
---

# Edit event dialog

`EditEventDialog({ item, onClose })`. The [Timeline feed](timeline-feed.md) renders it with `key={item.id}` while an event item is being edited. It is the event body of the shared [`EditDialogFrame`](../decisions/shared-edit-dialog-frame.md) (modal, title, close button, buttons, confirmation, busy and error state: see [Edit text dialog](edit-text-dialog.md)) and reads `useTimeline().updateEvent` and `deleteItem`.

## Edit step, top to bottom

"Editar elemento de evento:" and the close button, then the shared [`EventFields`](event-fields.md): the thumbnails with their "Quitar foto N" buttons, "Añadir fotos" (or "Elegir fotos" once every photo is removed), the gallery and limit messages, "Título", "Categoría" with its suggestions and "Descripción". Then Cancelar and Guardar side by side, a divider and the full-width "Borrar este evento".

The frame's `ScrollView` makes the dialog scroll inside, so Guardar and "Borrar este evento" can be reached with ten photos in every layout, with or without the keyboard. The frame's `KeyboardAvoidingView` ends the scroll area above the keyboard (checked on the phone and tablet emulators). The thumbnail grid wraps instead of scrolling, so there is no nested scroll view.

## State and behavior

- Local state: `photos` (`EventPhotoDraft[]`, starting as the stored photos keyed by file name), `title`, `category`, `description` (a missing one as an empty string) and `pickerFailed`. It lives in this component, not in the frame, so "No, volver" keeps removed and added photos and every edit, and so does a rotation.
- **Photos:** "Quitar foto N" removes a photo from the dialog only. "Añadir fotos" opens the multi-select picker for the photos that still fit and adds them at the end. A cancelled pick changes nothing. A picker failure shows "⚠️ No se pudo abrir la galería. Inténtalo de nuevo.". The card keeps its photos until Guardar, and Cancelar or Cerrar discards the changes.
- **Guardar** is enabled only while the dialog is valid (at least one photo, a title and a category that are not only whitespace) and changed: the draft keys differ from the stored files in order, a picked photo is present, or a trimmed text differs (clearing the description counts). It calls `updateEvent(id, { photos, title, category, description })` with each draft as `{ kind: 'stored' }` or `{ kind: 'picked' }`: only picked photos are copied, removed ones keep their files for the history, and the card updates in place.
- **Borrar este evento** shows "¿Borrar este evento?" and "Sí, borrar" calls `deleteItem`. The photo files are kept.
- Any edit hides a previous save error and the picker error.

## Tests

`src/__tests__/unit/components/edit-event-dialog-test.tsx`, through `EditEventDialogHarness` and `seededEventAdapters` (`src/test-utils/edit-event-dialog-harness.tsx`, an event with three photos) with `expo-image-picker` mocked: prefilled photos in order and fields, Guardar's rule (unchanged, whitespace, a photo removed, the title cleared, the description cleared, every photo removed), removing and adding photos with the card unchanged, the limit, a cancelled pick, a picker error, saving in order with trimmed texts, a double tap, a failed save with a retry, Cancelar and Cerrar after photo changes, the screen reader order, the confirmation step ("No, volver" keeping the photo changes, deletion keeping the files) and the tablet sizes. `edit-text-dialog-test.tsx` and `edit-image-dialog-test.tsx` pass unchanged.

Spec: [item-editing](../specs/item-editing.md).
