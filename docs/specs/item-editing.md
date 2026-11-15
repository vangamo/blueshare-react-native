---
type: Specification
title: item-editing
description: The edit dialog opened by a text, image or event card's Editar button. Change the text with Guardar, close it with the close button, Cancelar or Android back, or delete the item after a confirmation.
tags: [spec, implemented, edit-dialog, items]
resource: ../../openspec/specs/item-editing/spec.md
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-06T12:00:00Z
---

# item-editing (implemented)

Full text: `openspec/specs/item-editing/spec.md`. From the change `edit-text-items`, extended by `add-image-items` (the image dialog) and `event-items` (the event dialog).

| Requirement | Summary | Implemented in |
| --- | --- | --- |
| Editar opens the edit dialog | For text, image and event cards, with that type's fields. The dialog opens over the dimmed Timeline, and nothing under it responds or is reachable by a screen reader. | [Edit text dialog](../components/edit-text-dialog.md) |
| Edit dialog appearance and contents | Creation background, solid primary-blue border, near the top, spanning the layout's content column (centered; 500 on tablet portrait) with the size set's padding and radius. On phones in landscape Android's full-screen editor may cover it while typing. Title per type ("Editar elemento de texto:", "…de imagen:", "…de evento:"), close button, the type's fields, Cancelar and Guardar, a divider and the deletion button. | same |
| Edit text area | Prefilled with the current text, no keyboard on open, same limits as the creation box. | same |
| Guardar enabled only for a real change | Disabled while the trimmed text is blank or equal to the current one. | same |
| Guardar saves the new text | Trims, closes the dialog and keyboard, and the card keeps its position. One save per double tap. | same |
| Failed save keeps the edit | The dialog stays with the text and "⚠️ No se pudo guardar. Inténtalo de nuevo." | same |
| Closing without changes | The close button, Cancelar and Android back (edit step). Tapping outside does nothing. Reopening starts from the stored text. | same |
| Borrar asks for confirmation | "¿Borrar este texto?", "¿Borrar esta imagen?" or "¿Borrar este evento?" with "Desaparecerá de tu línea de tiempo.", "No, volver" and "Sí, borrar". | same |
| Going back from the confirmation | "No, volver" and Android back return to the edit step with every edit kept (text, a new photo, added or removed event photos). The close button closes. | same |
| Sí, borrar deletes the item | Deletes, closes and removes the card at once. Shows the empty message for the last item. | same, [Items module](../architecture/items-module.md) |
| Failed deletion keeps the item | "⚠️ No se pudo borrar. Inténtalo de nuevo." The confirmation stays and can retry. | same |
| Dialog buttons, deletion styles, close button | At least 44 pt. "Borrar este texto", "Borrar esta imagen" and "Borrar este evento" have a danger outline, "Sí, borrar" a solid danger background. The close button is 44×44, "Cerrar". | [Box button](../components/box-button.md) |
| Image edit step contents | For an image item: the photo, "Cambiar foto", the alternative text and caption fields, Guardar, Cancelar and "Borrar esta imagen". | [Edit image dialog](../components/edit-image-dialog.md) |
| Image edit fields start from the stored item | Prefilled with the stored texts and photo. | same |
| Changing the photo of an image item | The new photo is only kept after Guardar. Cancelling leaves the item as it was. | same |
| Guardar for an image item is enabled only for a real change | A different photo or different trimmed texts. | same |
| Guardar saves the image item | Closes the dialog and the card keeps its position. One save per double tap. | same |
| Failed image save keeps the edit | The dialog stays with the changes and shows the error. | same |
| Image dialog scrolls inside | Guardar and the delete button stay reachable in every layout, including phone landscape. | [Shared edit dialog frame](../decisions/shared-edit-dialog-frame.md) |
| Event edit step contents | Thumbnails, "Añadir fotos", Título, Categoría with suggestions, Descripción, Cancelar and Guardar, a divider and "Borrar este evento". | [Edit event dialog](../components/edit-event-dialog.md), [Event fields](../components/event-fields.md) |
| Event edit fields start from the stored item | Stored photos in order and texts, no keyboard, and the same limits and behavior as the event step. | same |
| Changing the photos of an event item | Remove with "Quitar foto N", add at the end with "Añadir fotos" up to 10. The card changes only after Guardar. Picker failure shows the gallery message. | same |
| Guardar for an event item is enabled only for a valid real change | At least one photo, a non-blank title and category, and a different photo list or order or a different trimmed text. Clearing the description counts. | same |
| Guardar saves the event item | Saves photos in order and trimmed texts, closes, and the card keeps its position. One save per double tap. | same |
| Failed event save keeps the edit | The dialog stays with its photos and fields and shows the error. | same |
| Event dialog scrolls inside | Every control is reachable in every layout, with or without the keyboard (the frame's `KeyboardAvoidingView`). | [Shared edit dialog frame](../decisions/shared-edit-dialog-frame.md) |
| Edit dialog accessibility | Labels equal the visible text, the text area is "Editar elemento de texto", and focus stays inside the dialog. | [Edit text dialog](../components/edit-text-dialog.md) |

Tests: `src/__tests__/unit/components/edit-text-dialog-test.tsx`, `edit-image-dialog-test.tsx`, `edit-event-dialog-test.tsx`, and `src/__tests__/e2e/edit-text-item-test.tsx`, `edit-image-item-test.tsx` and `edit-event-item-test.tsx`. Decision: [Edit dialog](../decisions/edit-dialog.md).
