---
type: Decision
title: Items schema
description: A base items table plus one table per item type, integer UTC-millisecond times, UUID v4 ids made on the phone, soft deletion, and append-only history tables for earlier versions.
tags: [decision, storage, sqlite, schema]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T12:00:00Z
---

# Items schema (add-text-items D2, edit-text-items D1 and D2, event-items D2 and D3)

**Decision:** a base `items` table (`id`, `type`, `created_at`, `updated_at`, `deleted_at`) plus one table per type (`text_items`, `image_items`, and `event_items` with `event_item_photos`). The timeline query `LEFT JOIN`s each type table. The current SQL is in `src/items/infrastructure/migrations.ts`.

**Why:**
- **Integer UTC milliseconds:** they sort and compare cheaply and need no time-zone parsing.
- **UUID v4 made on the phone:** items will travel between phones over Bluetooth, with no server to hand out ids.
- **Soft deletion:** a deletion can later be passed on to contacts. It is recorded in the history tables (`deleted_at` on the last version), and the live rows are removed. `items.deleted_at` stays in the table and is always NULL (edit-text-items D1).
- **No SQL CHECK on the text length:** the limit is a setting enforced in the domain, so changing it needs no migration ([Text limit](text-limit.md)).
- **Foreign keys on:** each driver runs `PRAGMA foreign_keys = ON`, since SQLite turns them off by default.
- **Live tables plus history tables** (edit-text-items D1, D2): `items` and `text_items` hold what the Timeline shows, so the feed query is unchanged and an edited card keeps its place (the feed orders by `created_at`). `items_history` and `text_items_history`, keyed by `(item_id, counter)`, are append-only: each edit or deletion first archives the previous state, in one transaction. The counter, not the time, orders versions.
- **Image tables** (add-image-items D2): `image_items` and `image_items_history` follow the same pattern as the text tables. `items.type` already accepted `'image'`, so no table was rebuilt. They store only the **relative** photo file name (`<uuid>.<ext>`), because on iOS the container's absolute path changes between installs, and the upright width and height. Text limits stay in the domain, as for text items.
- **Event tables** (event-items D2, D3): `event_items` holds the title, category and optional description, and `event_item_photos` holds **one row per photo** with a 0-based `position`, keyed by `(item_id, position)`. Their history twins copy both with the same counter, so each version keeps its whole photo list in order. The timeline reads photos with a second query instead of a join, which would repeat each item row once per photo. The photo count (1 to 10) and the text limits stay in the domain: a minimum of one photo can't be a CHECK across rows anyway.
- **Phase 4 note:** to know that an item was deleted, check the history for a version with `deleted_at` set, so an edit received from a contact doesn't bring it back.
- **Planned, not built:** an owner column with a `people` table (names live there, not copied on each item), `item_shares`, and location columns for image and event items.

**Rejected:**
- One table with nullable columns for every type: sparse, with tangled CHECKs.
- One table with a JSON payload: no column types or constraints. Revisit only if sharing sends whole items as blobs.
- One revisions table (`text_revisions`) with the feed joining the latest one: the feed query gets a "latest per item" join, and deletion still marks `items`.
- New rows in `items` for each version, with a `content_id`: needs a rebuilt primary key and a "latest per group" query, and the item id changes on each edit, which breaks Bluetooth sharing.
- Editing in place with no history: simplest, but loses what sync will need.
- Event photos as a JSON array in `event_items` (event-items D2): no column types or CHECKs, and history copies would hold opaque blobs, for the same reason JSON payloads were rejected above.
- Event photos as child image items with a `parent_id`: they would need filtering out of the feed, and their history would be split from the event's.

See [Items module](../architecture/items-module.md).
