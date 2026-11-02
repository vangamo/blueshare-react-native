---
type: Specification
title: item-storage
description: Items are kept in a local SQLite database on the phone, with a UUID, a type, UTC-millisecond timestamps, soft deletion into a history, editing with versions, a trimmed text of up to 8192 characters, image items with a photo copied into app storage and optional texts, all-or-nothing saves and data-safe schema upgrades.
tags: [spec, implemented, storage, sqlite, items]
resource: ../../openspec/specs/item-storage/spec.md
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T21:00:00Z
---

# item-storage (implemented)

Full text: `openspec/specs/item-storage/spec.md`. From the change `add-text-items`, extended by `edit-text-items` (editing, history and deletion) and `add-image-items` (image items).

| Requirement | Summary | Implemented in |
| --- | --- | --- |
| Items are stored on the device | A local database. No network, server or account. | [Local SQLite storage](../decisions/local-sqlite-storage.md) |
| Items survive restarts | Same items, same order after a force-close. | `blueshare.db`, device check in [Device testing](../development/device-testing.md) |
| Common item record | UUID v4 made on the phone, type `text`/`image`/`event`, created and updated times (equal for a new item), empty deletion time. UTC milliseconds. | [Items schema](../decisions/items-schema.md) |
| Text item content | Trimmed, inner line breaks kept, 1 to `TEXT_MAX_LENGTH` characters. Anything else is rejected, whatever its source. | `normalizeTextBody`, [Text limit](../decisions/text-limit.md) |
| Image item content | A photo (file, width, height) and an optional alternative text and caption. An image item without a photo is rejected. | `ImageItem`, [Items schema](../decisions/items-schema.md) |
| Image texts are trimmed and optional | Trimmed, an empty text is stored as none. | `normalizeImageTexts` |
| Image text limits | Alternative text at most 1000 and caption at most 500 characters, otherwise rejected. | `src/constants/limits.ts` |
| Photos are copied into app storage | The chosen photo is copied, so it survives gallery deletions and cache clean-ups. Only the file name is stored. | `PhotoStore`, [Items module](../architecture/items-module.md) |
| Photo files are kept for the history | Editing or deleting never removes a photo file that history points to. | same |
| Editing an image item | Replaces photo and texts, sets the update time, adds the previous version to the history. | `updateImageItem`, `withImageChanges` |
| Unchanged image edits are ignored | The same photo and equal trimmed texts store nothing and copy nothing. | same |
| Soft deletion | Deleting removes the item from the Timeline and keeps its last content and deletion time in the history. A user action ("Sí, borrar"). | `deleteItem`, [Items schema](../decisions/items-schema.md) |
| Editing a text item | Replaces the text and sets the update time. Id, type and creation time stay. Same text rules as a new item. | `updateTextItem`, `withNewText` |
| Unchanged edits are ignored | A trimmed text equal to the current one stores nothing. | same |
| Edit history | Before an edit or deletion the current version is added to the history, numbered 1, 2, 3, even within one millisecond. Never changed or removed. | `items_history`, `text_items_history` |
| Editing and deleting are all or nothing | The history version and the change happen together, or not at all. | `SqliteItemRepository` |
| Saving is all or nothing | The common record and the text are written in one transaction. | `SqliteItemRepository` |
| Schema upgrades keep data | The schema version is recorded. Missing steps run in order, each in full or not at all. | `migrations.ts`, [Items module](../architecture/items-module.md) |

Tests: the repository and migration tests under `src/__tests__/unit/items/`, which run the real SQL on `node:sqlite` (see [Injected SQL driver](../decisions/injected-sql-driver.md)).
