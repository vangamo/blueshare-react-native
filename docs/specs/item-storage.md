---
type: Specification
title: item-storage
description: Items are kept in a local SQLite database on the phone, with a UUID, a type, UTC-millisecond timestamps, soft deletion, a trimmed text of up to 8192 characters, all-or-nothing saves and data-safe schema upgrades.
tags: [spec, implemented, storage, sqlite, items]
resource: ../../openspec/specs/item-storage/spec.md
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:55:28Z
---

# item-storage (implemented)

Full text: `openspec/specs/item-storage/spec.md`. From the change `add-text-items`.

| Requirement | Summary | Implemented in |
| --- | --- | --- |
| Items are stored on the device | A local database. No network, server or account. | [Local SQLite storage](../decisions/local-sqlite-storage.md) |
| Items survive restarts | Same items, same order after a force-close. | `blueshare.db`, device check in [Device testing](../development/device-testing.md) |
| Common item record | UUID v4 made on the phone, type `text`/`image`/`event`, created and updated times (equal for a new item), empty deletion time. UTC milliseconds. | [Items schema](../decisions/items-schema.md) |
| Text item content | Trimmed, inner line breaks kept, 1 to `TEXT_MAX_LENGTH` characters. Anything else is rejected, whatever its source. | `normalizeTextBody`, [Text limit](../decisions/text-limit.md) |
| Soft deletion | Deleting sets the deletion time and keeps the record. Deleted items are not listed. No user action deletes yet. | `items.deleted_at` |
| Saving is all or nothing | The common record and the text are written in one transaction. | `SqliteItemRepository` |
| Schema upgrades keep data | The schema version is recorded. Missing steps run in order, each in full or not at all. | `migrations.ts`, [Items module](../architecture/items-module.md) |

Tests: the repository and migration tests under `src/__tests__/unit/items/`, which run the real SQL on `node:sqlite` (see [Injected SQL driver](../decisions/injected-sql-driver.md)).
