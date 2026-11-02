---
type: Specification
title: timeline-feed
description: What the Timeline shows. Items newest first, new items at once, edits and deletions at once, the text and image cards with Editar (opens the edit dialog) and Compartir (inactive), and the empty, loading and error states.
tags: [spec, implemented, timeline, feed]
resource: ../../openspec/specs/timeline-feed/spec.md
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T21:00:00Z
---

# timeline-feed (implemented)

Full text: `openspec/specs/timeline-feed/spec.md`. From the change `add-text-items`, changed by `edit-text-items`, extended by `add-image-items` (image cards).

| Requirement | Summary | Implemented in |
| --- | --- | --- |
| Items newest first | Not-deleted items by creation time, newest first. An edited item keeps its place. The layout's content padding (16 on phones), inside the centered content column (550, 500 or 600 outside phone portrait). The last card scrolls fully above the bottom bar or safe area. The creation box sits above the first item. | [Timeline feed](../components/timeline-feed.md) |
| New items appear right away | A saved item is the first card at once, with no reload. | timeline store in [Items module](../architecture/items-module.md) |
| Text card appearance | Card background, 2-point border, radius 16, padding 16, soft shadow. Full text in 15-point secondary color, line height 1.5. | [Text item card](../components/text-item-card.md) |
| Text card actions | A divider, then "Editar" and "Compartir" on the right, ≥ 44 tall, 14-point bold. | same |
| Compartir does nothing yet | Press feedback only. Editar opens the [text](../components/edit-text-dialog.md) or [image](../components/edit-image-dialog.md) edit dialog. | same |
| Image card appearance | Same card frame as the text card, with the photo on a backdrop colour. | [Image item card](../components/image-item-card.md) |
| Photo shown whole at its natural proportions | Never cropped, up to the layout's maximum height, centered on the backdrop. | same |
| Card space is kept while the photo loads | The card reserves its final size from the stored width and height, so scrolling does not jump. | same |
| Image caption | Shown below the photo in italic, when there is one. The alternative text is the photo's accessibility label. | same |
| Missing photo | "⚠️ Imagen no disponible" in the photo area, with the actions kept. | same |
| Image card accessibility | The photo is announced with its alternative text. Actions have labels. | same |
| Image card actions | Same divider, Editar and Compartir as the text card. | same |
| Edits and deletions appear right away | A saved edit or a deletion shows as soon as the dialog closes. | timeline store in [Items module](../architecture/items-module.md) |
| Empty timeline message | "Sin publicaciones todavía. Pulsa en el botón + para crear una." Hidden while the box is open. | [Timeline feed](../components/timeline-feed.md) |
| Loading the timeline | No empty message and no error while loading, so there is no flash on launch. | same |
| Loading error | "⚠️ No se pudieron cargar las publicaciones." The rest of the app keeps working. | same |

Tests: `src/__tests__/unit/components/timeline-feed-test.tsx`, `text-item-card-test.tsx`, `src/__tests__/e2e/create-text-item-test.tsx` and `edit-text-item-test.tsx`.
