---
type: Reference
title: Items module
description: How timeline items are stored and read. A hexagonal module in src/items with domain, application and infrastructure layers, an injected SQLite driver (expo-sqlite in the app, node:sqlite in Jest), live and history tables (schema v4) and append-only migrations.
tags: [items, architecture, sqlite, hexagonal, persistence]
resource: ../../src/items/
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T12:00:00Z
---

# Items module

Items (texts, images and events) are kept in a local SQLite database on the phone. There is no server: items will later travel between phones over Bluetooth. Requirements: [item-storage](../specs/item-storage.md). Why it is built this way: [Local SQLite storage](../decisions/local-sqlite-storage.md), [Items schema](../decisions/items-schema.md), [Hexagonal items module](../decisions/hexagonal-items-module.md), [Injected SQL driver](../decisions/injected-sql-driver.md) and [UI state without effects](../decisions/ui-state-without-effects.md). Editing and deletion: [item-editing](../specs/item-editing.md). Local rules: [`src/items/CLAUDE.md`](../../src/items/CLAUDE.md).

## Layout and dependency rule

```
src/items/
  domain/           ItemType, ItemMeta, TextItem, normalizeTextBody, ImageItem, PickedPhoto,
                    normalizeImageTexts, withImageChanges, EventItem, normalizeEventTexts,
                    checkPhotoCount, withEventChanges,
                    TimelineItem (TextItem | ImageItem | EventItem), ports, InvalidTextError,
                    InvalidImageTextError, InvalidEventError, ItemNotFoundError
  application/      use cases, the timeline store, items-module.ts (composition root)
  infrastructure/   sql-database.ts (port), migrations.ts, sqlite-item-repository.ts,
                    expo-sql-database.ts, app-adapters.ts
```

- `domain/` ← `application/` ← `infrastructure/`. The domain imports no React, Expo or SQL (it only reads the limits from `src/constants/limits.ts`).
- Use cases and the store depend on domain ports only. `application/items-module.ts` is the single place that wires the infrastructure in.
- Only `expo-sql-database.ts`, `expo-photo-store.ts` and `app-adapters.ts` import Expo packages (`expo-sqlite`, `expo-crypto`, `expo-file-system`).
- UI code (components and hooks) reaches the module only through `ItemsProvider` and its hooks.

## Ports

| Port | Methods | Implemented by |
| --- | --- | --- |
| `ItemRepository` (domain) | `saveText(item)`, `saveImage(item)`, `saveEvent(item)`, `listTimeline()`, `findText(id)`, `findImage(id)`, `findEvent(id)`, `updateText(item)`, `updateImage(item)`, `updateEvent(item)`, `deleteItem(id, deletedAt)` | `SqliteItemRepository` |
| `PhotoStore` (domain) | `importPhoto(sourceUri, fileName)`, `removePhoto(fileName)`, `uriFor(fileName)` | `createExpoPhotoStore()` (`expo-file-system`, `<documents>/images/`), `NodePhotoStore` (Jest, a temp folder per instance) |
| `Clock` (domain) | `now()`: UTC ms | `Date.now` |
| `IdGenerator` (domain) | `newId()`: UUID v4 | `randomUUID` from `expo-crypto` (Jest: `node:crypto`) |
| `SqlDatabase` (infrastructure) | `exec`, `run`, `getAll`, `getFirst`, `transaction(work)` | `ExpoSqlDatabase`, `NodeSqlDatabase` |

Only what the current features use exists. `updateText`, `updateImage`, `updateEvent` and `deleteItem` throw `ItemNotFoundError` when no live item has the id.

## Driver injection: the app vs Jest

```
 migrate(), SqliteItemRepository  --- depend on --->  SqlDatabase (port)
                                                        ^          ^
         createExpoSqlDatabase() (the app) ------------+          +------- NodeSqlDatabase (Jest)
         src/items/infrastructure/expo-sql-database.ts                    src/test-utils/
```

- **App:** `createAppAdapters()` returns `{ db, ids, clock, photos }` (`photos` copies files into `<documents>/images/`). The database is `blueshare.db`, opened once per session with `openDatabaseSync`, with `PRAGMA journal_mode = WAL` and `PRAGMA foreign_keys = ON`. `transaction` uses `withExclusiveTransactionAsync`, which runs on its own connection: only the `tx` queries belong to it, and foreign keys are not enforced inside it (the pragma can't be set once `BEGIN` has run). In `__DEV__` it logs `[items] SQLite <version>` once.
- **Jest:** `src/test-utils/jest-setup.ts` replaces `@/items/infrastructure/app-adapters` with a version that returns a fresh in-memory `NodeSqlDatabase`, `randomUUID` from `node:crypto`, `Date.now` and a `NodePhotoStore` (real file I/O in a fresh temp folder; `writeFixturePhoto()` makes a small picked file). Each render of the app gets an empty database. Unit tests create `new NodeSqlDatabase()` directly.
- **No fake repository:** the real SQL and migrations run in Jest. Metro never bundles the Node driver, because only test code imports it.
- **SQL rules:** positional `?` parameters only, and only features both bundled SQLite versions support.

## Application layer

- **Use cases** take `{ repository, clock, ids }` (`updateTextItem` and `deleteItem` only need the repository and the clock): `createTextItem(deps)(rawText)` normalizes the text (throws `InvalidTextError` before storing anything), builds the item with `createdAt === updatedAt` and `deletedAt: null`, and saves it. `listTimeline(deps)()` returns the items newest first. `updateTextItem(deps)(id, raw)` finds the item (`ItemNotFoundError`), applies `withNewText` (`InvalidTextError` before anything is written; an unchanged trimmed text returns the current item and writes nothing) and calls `repository.updateText`. `deleteItem(deps)(id)` calls `repository.deleteItem(id, clock.now())`.
- **`createItemsModule({ db, ids, clock })`** builds the repository, the use cases and the store, and returns `{ store, photos }`: the UI reads photo URIs from `photos.uriFor` and never imports `infrastructure/`.
- **Timeline store** (`timeline-store.ts`), a plain object:
  - `getSnapshot()` returns `{ status: 'loading' | 'ready' | 'error', items }`. It is a new object only when something changes, as `useSyncExternalStore` requires.
  - `subscribe(listener)` returns an unsubscribe function. The first call starts the load: `migrate()`, then `listTimeline()`. Any failure gives `status: 'error'`.
  - `createText(raw)` waits for the load (starting it if needed), runs the use case, puts the new item first and notifies subscribers. On failure it rejects and leaves the snapshot unchanged, so the creation box can show its error.
  - `updateText(id, raw)` waits for the load, runs the use case and replaces the item **in place**, so its position doesn't change. An unchanged text leaves the snapshot object as it is. `deleteItem(id)` removes the item from the list. Both reject on failure with the snapshot untouched. The list isn't reloaded after a change: updating in place matches `createText` and avoids a query and a flash.
- **Image items:** `createImage(input)` and `updateImage(id, input)` behave like their text twins: they wait for the load, put a created item first, replace an updated item in place (an unchanged edit keeps the snapshot object, decided by comparing the photo file, the texts and the update time) and reject with the snapshot untouched. Both are exposed by `useTimeline()`. `usePhotoUri(file)` reads `photos.uriFor` from the module.
- **Event items:** `createEventItem(deps)(input)` validates the texts and the photo count (`InvalidEventError`) before copying anything, copies each picked photo under a new `<id>.<ext>` name **one after another**, then calls `saveEvent`. If a copy fails, the copies already made are removed; if the save fails, every copy is removed; the error is rethrown either way (`importPhotos` and `removePhotos` in `application/import-photos.ts`). `updateEventItem(deps)(id, input)` takes a photo list of `EventPhotoInput` entries (`{ kind: 'stored', photo }` or `{ kind: 'picked', photo }`), names the picked ones first and compares with `withEventChanges`: an unchanged list and trimmed-equal texts return the current item with nothing copied or written, and a picked photo always counts as a change (its new name never matches). Only the picked photos are copied, removed photos keep their files for the history, and a failed save removes only the new copies. The store's `createEvent(input)` and `updateEvent(id, input)` behave like the image twins (`differs()` compares the title, category, description and the photo files in order), and `useTimeline()` exposes both.
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

- The type's content is copied in `archive()`, which has a case for each type (`text`, `image` and `event`). A new item type needs its own case.
- Deletion removes the rows explicitly, because the Expo driver's exclusive transactions don't enforce foreign keys. Step 5 deletes the rows of the **type's own tables**, children first (`TYPE_TABLES` in the repository: `text_items`, `image_items`, or `event_item_photos` then `event_items`), before the `items` row.
- `items.deleted_at` is now always NULL in the live table. The column and the partial index stay, since migrations are append-only.

## Schema v3: image items

```sql
CREATE TABLE image_items (
  item_id TEXT PRIMARY KEY NOT NULL REFERENCES items (id) ON DELETE CASCADE,
  photo_file TEXT NOT NULL,                          -- '<uuid>.<ext>' in <documents>/images/
  photo_width INTEGER NOT NULL CHECK (photo_width > 0),
  photo_height INTEGER NOT NULL CHECK (photo_height > 0),
  alt_text TEXT, caption TEXT                        -- NULL = none
);
CREATE TABLE image_items_history (
  item_id TEXT NOT NULL, counter INTEGER NOT NULL,
  photo_file TEXT NOT NULL, photo_width INTEGER NOT NULL, photo_height INTEGER NOT NULL,
  alt_text TEXT, caption TEXT,
  PRIMARY KEY (item_id, counter),
  FOREIGN KEY (item_id, counter) REFERENCES items_history (item_id, counter) ON DELETE CASCADE
);
```

- Only the **relative** file name is stored: the app container's absolute path changes between installs on iOS. The width and height are the upright size, so a card reserves its space before the photo loads.
- The text limits (`ALT_TEXT_MAX_LENGTH`, `CAPTION_MAX_LENGTH`) are enforced by the domain, not by SQL.
- The timeline query adds `LEFT JOIN image_items`. `saveImage` and `updateImage` follow the text methods (one transaction, `updateImage` archives first). An old build that opens a v3 database skips image rows in `toTimelineItem`, so they are hidden there, not lost.

## Schema v4: event items

```sql
CREATE TABLE event_items (
  item_id TEXT PRIMARY KEY NOT NULL REFERENCES items (id) ON DELETE CASCADE,
  title TEXT NOT NULL, category TEXT NOT NULL,
  description TEXT                                   -- NULL = none
);
CREATE TABLE event_item_photos (
  item_id TEXT NOT NULL REFERENCES event_items (item_id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0),   -- 0-based and dense
  photo_file TEXT NOT NULL,                          -- '<uuid>.<ext>' in <documents>/images/
  photo_width INTEGER NOT NULL CHECK (photo_width > 0),
  photo_height INTEGER NOT NULL CHECK (photo_height > 0),
  PRIMARY KEY (item_id, position)
);
-- event_items_history (item_id, counter, title, category, description) and
-- event_item_photos_history (item_id, counter, position, photo_file, photo_width, photo_height),
-- both with FOREIGN KEY (item_id, counter) REFERENCES items_history.
```

- **Two timeline queries.** The item query adds `LEFT JOIN event_items`. Photos are one-to-many, so a join would repeat item rows: a second query reads every live event's photos ordered by `item_id, position`, and the repository groups them into a `Map<itemId, StoredPhoto[]>`. `toTimelineItem` builds an `EventItem` only when the title is set and the map holds at least one photo, otherwise it hides the row (like a broken image row). Both reads run right after the migration with no writes in between, so they need no transaction. `findEvent(id)` runs the same item query for one id plus that event's photos.
- `saveEvent` writes `items`, `event_items` and one `event_item_photos` row per photo in one transaction. `updateEvent` archives first, then updates `items.updated_at` and `event_items`, deletes the event's photo rows and inserts the new list (rewriting is simpler than diffing, and costs at most 10 rows).
- `archive()` copies the `event_items` row and every photo row into the history tables with the same counter, so each version keeps its whole photo list in order.
- The text limits and the photo count (1 to `EVENT_MAX_PHOTOS`) are domain rules, not SQL CHECKs. An old build that opens a v4 database returns `null` for event rows, so they are hidden there, not lost.

## Migrations

- `MIGRATIONS` in `migrations.ts` is a list of SQL steps; step N brings `PRAGMA user_version` to N.
- `migrate(db)` reads `user_version` and runs each missing step together with its version bump in one transaction. A failing step leaves the version and the data unchanged.
- **Append-only:** never edit or reorder a shipped step. Add a new one.
- Rollback: revert the code. During development, clear Expo Go's data to reset the database (it lives inside Expo Go).

## Future tables (not built yet)

- `owner_id` on `items`, with `people (id, display_name, original_name, is_me)`. Names live on `people`, so a rename leaves no stale copies.
- `item_shares (item_id, person_id, shared_at)`.
- Nullable location columns on `image_items` and `event_items` and their history tables (`add-item-locations`).

Related: [Project structure](project-structure.md), [Testing](../development/testing.md), [Dependencies](../development/dependencies.md).
