---
type: Specification
title: timeline-feed
description: What the Timeline shows. Items newest first, new items at once, edits and deletions at once, the text, image and event cards with Editar (opens the edit dialog) and Compartir (inactive), and the empty, loading and error states.
tags: [spec, implemented, timeline, feed]
resource: ../../openspec/specs/timeline-feed/spec.md
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-06T12:00:00Z
---

# timeline-feed (implemented)

Full text: `openspec/specs/timeline-feed/spec.md`. From the change `add-text-items`, changed by `edit-text-items`, extended by `add-image-items` (image cards) and `event-items` (event cards).

| Requirement | Summary | Implemented in |
| --- | --- | --- |
| Items newest first | Not-deleted items by creation time, newest first. An edited item keeps its place. The layout's content padding (16 on phones), inside the centered content column (550, 500 or 600 outside phone portrait). The last card scrolls fully above the bottom bar or safe area. The creation box sits above the first item. | [Timeline feed](../components/timeline-feed.md) |
| New items appear right away | A saved item is the first card at once, with no reload. | timeline store in [Items module](../architecture/items-module.md) |
| Text card appearance | Card background, 2-point border, radius 16, padding 16, soft shadow. Full text in 15-point secondary color, line height 1.5. | [Text item card](../components/text-item-card.md) |
| Text card actions | A divider, then "Editar" and "Compartir" on the right, ≥ 44 tall, 14-point bold. | same |
| Compartir does nothing yet | Press feedback only, on text, image and event cards. Editar opens the [text](../components/edit-text-dialog.md), [image](../components/edit-image-dialog.md) or [event](../components/edit-event-dialog.md) edit dialog. | same |
| Image card appearance | Same card frame as the text card, with the photo on a backdrop colour. | [Image item card](../components/image-item-card.md) |
| Photo shown whole at its natural proportions | Never cropped, up to the layout's maximum height, centered on the backdrop. | same |
| Card space is kept while the photo loads | The card reserves its final size from the stored width and height, so scrolling does not jump. | same |
| Image caption | Shown below the photo in italic, when there is one. The alternative text is the photo's accessibility label. | same |
| Missing photo | "⚠️ Imagen no disponible" in the photo area, with the actions kept. | same |
| Image card accessibility | The photo is announced with its alternative text. Actions have labels. | same |
| Image card actions | Same divider, Editar and Compartir as the text card. | same |
| Event card appearance | The text card frame with a strong-ink border and a 6-point `primaryBlueDeep` accent bar on the left. | [Event item card](../components/event-item-card.md) |
| Event title and category | Bold title (17 points on phones) wrapping in full, with a category badge on its first line, never truncated. | same |
| Event photo row | Square tiles in stored order, 10 apart, cropped to fill, 12-point corners, in a row that scrolls sideways with the next tile peeking out. Tapping does nothing. | same, [Event items](../decisions/event-items.md) |
| Event card space is kept while photos load | Tiles have their size before the photo loads, on the backdrop color. | same |
| Event description | In full below the row with its line breaks; with none, the actions follow the row. | same |
| Missing event photo | That tile shows "⚠️ Imagen no disponible"; the rest of the card is unchanged. | `EventPhotoTile` |
| Event card accessibility | Title as a heading, "Categoría: <category>", tiles as "Foto N de M de <title>", every tile reachable. | same |
| Event card actions | Same divider, Editar and Compartir as the text card. Editar opens the event dialog. | same |
| Edits and deletions appear right away | A saved edit or a deletion shows as soon as the dialog closes. | timeline store in [Items module](../architecture/items-module.md) |
| Empty timeline message | "Sin publicaciones todavía. Pulsa en el botón + para crear una." Hidden while the box is open. | [Timeline feed](../components/timeline-feed.md) |
| Loading the timeline | No empty message and no error while loading, so there is no flash on launch. | same |
| Loading error | "⚠️ No se pudieron cargar las publicaciones." The rest of the app keeps working. | same |

Tests: `src/__tests__/unit/components/timeline-feed-test.tsx`, `text-item-card-test.tsx`, `image-item-card-test.tsx`, `event-item-card-test.tsx`, `src/__tests__/e2e/create-event-item-test.tsx`, `src/__tests__/e2e/create-text-item-test.tsx` and `edit-text-item-test.tsx`.
