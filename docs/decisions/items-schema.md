---
type: Decision
title: Items schema
description: A base items table plus one table per item type, integer UTC-millisecond times, UUID v4 ids made on the phone and soft deletion.
tags: [decision, storage, sqlite, schema]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:55:28Z
---

# Items schema (add-text-items D2)

**Decision:** a base `items` table (`id`, `type`, `created_at`, `updated_at`, `deleted_at`) plus one table per type (`text_items` now). The timeline query `LEFT JOIN`s each type table. The current SQL is in `src/items/infrastructure/migrations.ts`.

**Why:**
- **Integer UTC milliseconds:** they sort and compare cheaply and need no time-zone parsing.
- **UUID v4 made on the phone:** items will travel between phones over Bluetooth, with no server to hand out ids.
- **Soft deletion** (`deleted_at`): a deletion can later be passed on to contacts.
- **No SQL CHECK on the text length:** the limit is a setting enforced in the domain, so changing it needs no migration ([Text limit](text-limit.md)).
- **Foreign keys on:** each driver runs `PRAGMA foreign_keys = ON`, since SQLite turns them off by default.
- **Planned, not built:** an owner column with a `people` table (names live there, not copied on each item), `item_shares`, and image and event tables.

**Rejected:**
- One table with nullable columns for every type: sparse, with tangled CHECKs.
- One table with a JSON payload: no column types or constraints. Revisit only if sharing sends whole items as blobs.

See [Items module](../architecture/items-module.md).
