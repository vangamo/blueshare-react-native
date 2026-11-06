---
type: Specification
title: item-storage
description: Items are kept in a local SQLite database on the phone, with a UUID, a type, UTC-millisecond timestamps, soft deletion into a history, editing with versions, a trimmed text of up to 8192 characters, image items with a photo copied into app storage and optional texts, event items with 1 to 10 ordered photos, a title, a category and an optional description, all-or-nothing saves and data-safe schema upgrades.
tags: [spec, implemented, storage, sqlite, items]
resource: ../../openspec/specs/item-storage/spec.md
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-06T12:00:00Z
---

# item-storage (implemented)

Full text: `openspec/specs/item-storage/spec.md`. From the change `add-text-items`, extended by `edit-text-items` (editing, history and deletion), `add-image-items` (image items) and `event-items` (event items, schema step 4).

| Requirement | Summary | Implemented in |
| --- | --- | --- |
| Items are stored on the device | A local database. No network, server or account. | [Local SQLite storage](../decisions/local-sqlite-storage.md) |
| Items survive restarts | Same items, same order after a force-close. | `blueshare.db`, device check in [Device testing](../development/device-testing.md) |
| Common item record | UUID v4 made on the phone, type `text`/`image`/`event`, created and updated times (equal for a new item), empty deletion time. UTC milliseconds. | [Items schema](../decisions/items-schema.md) |
| Text item content | Trimmed, inner line breaks kept, 1 to `TEXT_MAX_LENGTH` characters. Anything else is rejected, whatever its source. | `normalizeTextBody`, [Text limit](../decisions/text-limit.md) |
| Image item content | A photo (file, width, height) and an optional alternative text and caption. An image item without a photo is rejected. | `ImageItem`, [Items schema](../decisions/items-schema.md) |
| Image texts are trimmed and optional | Trimmed, an empty text is stored as none. | `normalizeImageTexts` |
| Image text limits | Alternative text at most 1000 and caption at most 500 characters, otherwise rejected. | `src/constants/limits.ts` |
| Event item content | Title, category, optional description and an ordered list of 1 to `EVENT_MAX_PHOTOS` (10) photos with their sizes. Anything else is rejected. | `EventItem`, `checkPhotoCount`, [Items schema](../decisions/items-schema.md) |
| Event photo order is kept | Stored and listed in the given order, across restarts. | `event_item_photos.position` |
| Event texts are trimmed | Trimmed. A blank title or category is rejected; a blank description is stored as none. | `normalizeEventTexts` |
| Event text limits | Title at most 120, category 24, description 2000, otherwise rejected. | `src/constants/limits.ts` |
| Editing an event item | Replaces the photo list and texts, sets the update time, adds the previous version (with its whole photo list) to the history. | `updateEventItem`, `withEventChanges` |
| Unchanged event edits are ignored | Same photos in the same order and equal trimmed texts store nothing and copy nothing. | same |
| Photos are copied into app storage | Each chosen photo of an image or event item is copied, so it survives gallery deletions and cache clean-ups. Only the file name is stored. | `PhotoStore`, [Items module](../architecture/items-module.md) |
| Photo files are kept for the history | Replacing, adding or removing photos, editing or deleting never removes a photo file that history points to. | same |
| Editing an image item | Replaces photo and texts, sets the update time, adds the previous version to the history. | `updateImageItem`, `withImageChanges` |
| Unchanged image edits are ignored | The same photo and equal trimmed texts store nothing and copy nothing. | same |
| Soft deletion | Deleting removes the item from the Timeline and keeps its last content and deletion time in the history. A user action ("Sí, borrar"). | `deleteItem`, [Items schema](../decisions/items-schema.md) |
| Editing a text item | Replaces the text and sets the update time. Id, type and creation time stay. Same text rules as a new item. | `updateTextItem`, `withNewText` |
| Unchanged edits are ignored | A trimmed text equal to the current one stores nothing. | same |
| Edit history | Before an edit or deletion the current version is added to the history, numbered 1, 2, 3, even within one millisecond. Never changed or removed. An event version keeps its whole photo list in order. | `items_history` and a history table per type |
| Editing and deleting are all or nothing | The history version and the change happen together, or not at all. | `SqliteItemRepository` |
| Saving is all or nothing | The common record and the type's content are written in one transaction. When an image or event save fails, its photo copies are removed. | `SqliteItemRepository`, the create use cases |
| Schema upgrades keep data | The schema version is recorded. Missing steps run in order, each in full or not at all. | `migrations.ts`, [Items module](../architecture/items-module.md) |

Tests: the repository and migration tests under `src/__tests__/unit/items/`, which run the real SQL on `node:sqlite` (see [Injected SQL driver](../decisions/injected-sql-driver.md)).
