---
type: Reference
title: Items module
description: How timeline items are stored and read. A hexagonal module in src/items with domain, application and infrastructure layers, an injected SQLite driver (expo-sqlite in the app, node:sqlite in Jest) and append-only migrations.
tags: [items, architecture, sqlite, hexagonal, persistence]
resource: ../../src/items/
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:55:28Z
---

# Items module

Items (texts now, images and events later) are kept in a local SQLite database on the phone. There is no server: items will later travel between phones over Bluetooth. Requirements: [item-storage](../specs/item-storage.md). Why it is built this way: [Local SQLite storage](../decisions/local-sqlite-storage.md), [Items schema](../decisions/items-schema.md), [Hexagonal items module](../decisions/hexagonal-items-module.md), [Injected SQL driver](../decisions/injected-sql-driver.md) and [UI state without effects](../decisions/ui-state-without-effects.md). Local rules: [`src/items/CLAUDE.md`](../../src/items/CLAUDE.md).

## Layout and dependency rule

```
src/items/
  domain/           ItemType, ItemMeta, TextItem, normalizeTextBody, TimelineItem, ports,
                    InvalidTextError, ItemNotFoundError
  application/      use cases, the timeline store, items-module.ts (composition root)
  infrastructure/   sql-database.ts (port), migrations.ts, sqlite-item-repository.ts,
                    expo-sql-database.ts, app-adapters.ts
```

- `domain/` ← `application/` ← `infrastructure/`. The domain imports no React, Expo or SQL (it only reads `TEXT_MAX_LENGTH` from `src/constants/limits.ts`).
- Use cases and the store depend on domain ports only. `application/items-module.ts` is the single place that wires the infrastructure in.
- Only `expo-sql-database.ts` and `app-adapters.ts` import Expo packages (`expo-sqlite`, `expo-crypto`).
- UI code (components and hooks) reaches the module only through `ItemsProvider` and its hooks.

## Ports

| Port | Methods | Implemented by |
| --- | --- | --- |
| `ItemRepository` (domain) | `saveText(item)`, `listTimeline()`, `findText(id)`, `updateText(item)`, `deleteItem(id, deletedAt)` | `SqliteItemRepository` |
| `Clock` (domain) | `now()`: UTC ms | `Date.now` |
| `IdGenerator` (domain) | `newId()`: UUID v4 | `randomUUID` from `expo-crypto` (Jest: `node:crypto`) |
| `SqlDatabase` (infrastructure) | `exec`, `run`, `getAll`, `getFirst`, `transaction(work)` | `ExpoSqlDatabase`, `NodeSqlDatabase` |

Only what the current features use exists. `updateText` and `deleteItem` throw `ItemNotFoundError` when no live item has the id.

## Driver injection: the app vs Jest

```
 migrate(), SqliteItemRepository  --- depend on --->  SqlDatabase (port)
                                                        ^          ^
         createExpoSqlDatabase() (the app) ------------+          +------- NodeSqlDatabase (Jest)
         src/items/infrastructure/expo-sql-database.ts                    src/test-utils/
```

- **App:** `createAppAdapters()` returns `{ db, ids, clock }`. The database is `blueshare.db`, opened once per session with `openDatabaseSync`, with `PRAGMA journal_mode = WAL` and `PRAGMA foreign_keys = ON`. `transaction` uses `withExclusiveTransactionAsync`, which runs on its own connection: only the `tx` queries belong to it, and foreign keys are not enforced inside it (the pragma can't be set once `BEGIN` has run). In `__DEV__` it logs `[items] SQLite <version>` once.
- **Jest:** `src/test-utils/jest-setup.ts` replaces `@/items/infrastructure/app-adapters` with a version that returns a fresh in-memory `NodeSqlDatabase`, `randomUUID` from `node:crypto` and `Date.now`. Each render of the app gets an empty database. Unit tests create `new NodeSqlDatabase()` directly.
- **No fake repository:** the real SQL and migrations run in Jest. Metro never bundles the Node driver, because only test code imports it.
- **SQL rules:** positional `?` parameters only, and only features both bundled SQLite versions support.

## Application layer

- **Use cases** take `{ repository, clock, ids }` (`updateTextItem` and `deleteItem` only need the repository and the clock): `createTextItem(deps)(rawText)` normalizes the text (throws `InvalidTextError` before storing anything), builds the item with `createdAt === updatedAt` and `deletedAt: null`, and saves it. `listTimeline(deps)()` returns the items newest first. `updateTextItem(deps)(id, raw)` finds the item (`ItemNotFoundError`), applies `withNewText` (`InvalidTextError` before anything is written; an unchanged trimmed text returns the current item and writes nothing) and calls `repository.updateText`. `deleteItem(deps)(id)` calls `repository.deleteItem(id, clock.now())`.
- **`createItemsModule({ db, ids, clock })`** builds the repository, the use cases and the store, and returns `{ store }`.
- **Timeline store** (`timeline-store.ts`), a plain object:
  - `getSnapshot()` returns `{ status: 'loading' | 'ready' | 'error', items }`. It is a new object only when something changes, as `useSyncExternalStore` requires.
  - `subscribe(listener)` returns an unsubscribe function. The first call starts the load: `migrate()`, then `listTimeline()`. Any failure gives `status: 'error'`.
  - `createText(raw)` waits for the load (starting it if needed), runs the use case, puts the new item first and notifies subscribers. On failure it rejects and leaves the snapshot unchanged, so the creation box can show its error.
  - `updateText(id, raw)` waits for the load, runs the use case and replaces the item **in place**, so its position doesn't change. An unchanged text leaves the snapshot object as it is. `deleteItem(id)` removes the item from the list. Both reject on failure with the snapshot untouched. The list isn't reloaded after a change: updating in place matches `createText` and avoids a query and a flash.
- **How the UI reads it:** `ItemsProvider` creates the module once, with a lazy `useState` initializer, and `useTimeline()` reads the store with `useSyncExternalStore`.
- **Why no `setState` in effects:** the React Compiler lint rule (`react-hooks/set-state-in-effect`) forbids it. The store owns the async load and pushes changes to React through `subscribe`, so no component fetches in an effect. A refresh after creating needs no extra mechanism either, which `use(promise)` with Suspense would.

## Schema v1

```sql
CREATE TABLE items (
  id         TEXT PRIMARY KEY NOT NULL,          -- UUID v4, generated on the phone
  type       TEXT NOT NULL CHECK (type IN ('text', 'image', 'event')),
  created_at INTEGER NOT NULL,                   -- UTC ms
  updated_at INTEGER NOT NULL,                   -- UTC ms, equal to created_at when new
  deleted_at INTEGER                             -- NULL = not deleted (soft delete)
);
CREATE INDEX items_timeline ON items (created_at DESC) WHERE deleted_at IS NULL;
CREATE TABLE text_items (
  item_id TEXT PRIMARY KEY NOT NULL REFERENCES items (id) ON DELETE CASCADE,
  body    TEXT NOT NULL
);
```

- The timeline query left-joins each type table, skips deleted rows and orders by `created_at DESC, rowid DESC` (insertion order breaks ties).
- `saveText` writes `items` and `text_items` in one transaction: all or nothing.
- The text length limit is not a SQL `CHECK`. The domain enforces `TEXT_MAX_LENGTH`, so changing it needs no migration.

## Schema v2: history tables

```sql
CREATE TABLE items_history (
  item_id TEXT NOT NULL, counter INTEGER NOT NULL CHECK (counter >= 1),
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'event')),
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  deleted_at INTEGER,                              -- set only on the version a deletion writes
  PRIMARY KEY (item_id, counter)                   -- no FK to items: the live row is gone after a deletion
);
CREATE TABLE text_items_history (
  item_id TEXT NOT NULL, counter INTEGER NOT NULL, body TEXT NOT NULL,
  PRIMARY KEY (item_id, counter),
  FOREIGN KEY (item_id, counter) REFERENCES items_history (item_id, counter) ON DELETE CASCADE
);
```

`items` and `text_items` keep what the Timeline shows. Each history row is the state **before** an action, and the counter (not the time) orders versions of one item. Both actions run in one transaction:

| Step | `updateText(item)` | `deleteItem(id, deletedAt)` |
| --- | --- | --- |
| 1 | read the live `type`, else `ItemNotFoundError` | same |
| 2 | next counter = `COALESCE(MAX(counter), 0) + 1` for the id | same |
| 3 | copy the `items` row into `items_history` (`deleted_at` null) | same, with `deleted_at = deletedAt` |
| 4 | copy the type's content (`text_items` into `text_items_history`) | same |
| 5 | `UPDATE items.updated_at` and `UPDATE text_items.body` | `DELETE` the `text_items` row, then the `items` row |

- The type's content is copied in `archive()`, which switches on `type`. Image and event items add a case. Any other type throws, so content is never dropped silently.
- Deletion removes the rows explicitly, because the Expo driver's exclusive transactions don't enforce foreign keys.
- `items.deleted_at` is now always NULL in the live table. The column and the partial index stay, since migrations are append-only.

## Migrations

- `MIGRATIONS` in `migrations.ts` is a list of SQL steps; step N brings `PRAGMA user_version` to N.
- `migrate(db)` reads `user_version` and runs each missing step together with its version bump in one transaction. A failing step leaves the version and the data unchanged.
- **Append-only:** never edit or reorder a shipped step. Add a new one.
- Rollback: revert the code. During development, clear Expo Go's data to reset the database (it lives inside Expo Go).

## Future tables (not built yet)

- `owner_id` on `items`, with `people (id, display_name, original_name, is_me)`. Names live on `people`, so a rename leaves no stale copies.
- `item_shares (item_id, person_id, shared_at)`.
- `image_items_history` and `event_items_history`, mirroring their live tables.
- `image_items`, `event_items` and `event_photos`, each with its own `LEFT JOIN` in the timeline query.

Related: [Project structure](project-structure.md), [Testing](../development/testing.md), [Dependencies](../development/dependencies.md).
