---
type: Specification
title: timeline-feed
description: What the Timeline shows. Items newest first, new items at once, edits and deletions at once, the text card with Editar (opens the edit dialog) and Compartir (inactive), and the empty, loading and error states.
tags: [spec, implemented, timeline, feed]
resource: ../../openspec/specs/timeline-feed/spec.md
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T12:00:00Z
---

# timeline-feed (implemented)

Full text: `openspec/specs/timeline-feed/spec.md`. From the change `add-text-items`, changed by `edit-text-items`.

| Requirement | Summary | Implemented in |
| --- | --- | --- |
| Items newest first | Not-deleted items by creation time, newest first. An edited item keeps its place. 16-point padding. The creation box sits above the first item. | [Timeline feed](../components/timeline-feed.md) |
| New items appear right away | A saved item is the first card at once, with no reload. | timeline store in [Items module](../architecture/items-module.md) |
| Text card appearance | Card background, 2-point border, radius 16, padding 16, soft shadow. Full text in 15-point secondary color, line height 1.5. | [Text item card](../components/text-item-card.md) |
| Text card actions | A divider, then "Editar" and "Compartir" on the right, ≥ 44 tall, 14-point bold. | same |
| Compartir does nothing yet | Press feedback only. Editar opens the [edit dialog](../components/edit-text-dialog.md). | same |
| Edits and deletions appear right away | A saved edit or a deletion shows as soon as the dialog closes. | timeline store in [Items module](../architecture/items-module.md) |
| Empty timeline message | "Sin publicaciones todavía. Pulsa en el botón + para crear una." Hidden while the box is open. | [Timeline feed](../components/timeline-feed.md) |
| Loading the timeline | No empty message and no error while loading, so there is no flash on launch. | same |
| Loading error | "⚠️ No se pudieron cargar las publicaciones." The rest of the app keeps working. | same |

Tests: `src/__tests__/unit/components/timeline-feed-test.tsx`, `text-item-card-test.tsx`, `src/__tests__/e2e/create-text-item-test.tsx` and `edit-text-item-test.tsx`.
