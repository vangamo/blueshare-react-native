---
type: Specification
title: item-editing
description: The edit dialog opened by a text card's Editar button. Change the text with Guardar, close it with the close button, Cancelar or Android back, or delete the item after a confirmation.
tags: [spec, implemented, edit-dialog, items]
resource: ../../openspec/specs/item-editing/spec.md
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T12:00:00Z
---

# item-editing (implemented)

Full text: `openspec/specs/item-editing/spec.md`. From the change `edit-text-items`.

| Requirement | Summary | Implemented in |
| --- | --- | --- |
| Editar opens the edit dialog | The dialog opens over the dimmed Timeline, and nothing under it responds or is reachable by a screen reader. | [Edit text dialog](../components/edit-text-dialog.md) |
| Edit dialog appearance and contents | Creation background, solid primary-blue border, near the top. Title, close button, text area, Cancelar and Guardar, a divider and "Borrar este texto". | same |
| Edit text area | Prefilled with the current text, no keyboard on open, same limits as the creation box. | same |
| Guardar enabled only for a real change | Disabled while the trimmed text is blank or equal to the current one. | same |
| Guardar saves the new text | Trims, closes the dialog and keyboard, and the card keeps its position. One save per double tap. | same |
| Failed save keeps the edit | The dialog stays with the text and "⚠️ No se pudo guardar. Inténtalo de nuevo." | same |
| Closing without changes | The close button, Cancelar and Android back (edit step). Tapping outside does nothing. Reopening starts from the stored text. | same |
| Borrar asks for confirmation | "¿Borrar este texto?" with "Desaparecerá de tu línea de tiempo.", "No, volver" and "Sí, borrar". | same |
| Going back from the confirmation | "No, volver" and Android back return to the edit step with the text kept. The close button closes. | same |
| Sí, borrar deletes the item | Deletes, closes and removes the card at once. Shows the empty message for the last item. | same, [Items module](../architecture/items-module.md) |
| Failed deletion keeps the item | "⚠️ No se pudo borrar. Inténtalo de nuevo." The confirmation stays and can retry. | same |
| Dialog buttons, deletion styles, close button | At least 44 pt. "Borrar este texto" has a danger outline, "Sí, borrar" a solid danger background. The close button is 44×44, "Cerrar". | [Box button](../components/box-button.md) |
| Edit dialog accessibility | Labels equal the visible text, the text area is "Editar elemento de texto", and focus stays inside the dialog. | [Edit text dialog](../components/edit-text-dialog.md) |

Tests: `src/__tests__/unit/components/edit-text-dialog-test.tsx` and `src/__tests__/e2e/edit-text-item-test.tsx`. Decision: [Edit dialog](../decisions/edit-dialog.md).
