import type { SqlDatabase } from './sql-database';

/**
 * Schema steps, in order. Step N brings the database to `user_version` N.
 *
 * APPEND-ONLY: never edit or reorder a step that has shipped. Add a new one.
 */
export const MIGRATIONS: readonly string[] = [
  // 1. Base item record plus one table per type (openspec add-text-items design D2).
  `
  CREATE TABLE items (
    id         TEXT PRIMARY KEY NOT NULL,
    type       TEXT NOT NULL CHECK (type IN ('text', 'image', 'event')),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER
  );
  CREATE INDEX items_timeline ON items (created_at DESC) WHERE deleted_at IS NULL;
  CREATE TABLE text_items (
    item_id TEXT PRIMARY KEY NOT NULL REFERENCES items (id) ON DELETE CASCADE,
    body    TEXT NOT NULL
  );
  `,
  // 2. Append-only history of earlier versions (openspec edit-text-items design D2).
  // No foreign key from items_history to items: the live row is gone after a deletion.
  `
  CREATE TABLE items_history (
    item_id    TEXT NOT NULL,
    counter    INTEGER NOT NULL CHECK (counter >= 1),
    type       TEXT NOT NULL CHECK (type IN ('text', 'image', 'event')),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    PRIMARY KEY (item_id, counter)
  );
  CREATE TABLE text_items_history (
    item_id TEXT NOT NULL,
    counter INTEGER NOT NULL,
    body    TEXT NOT NULL,
    PRIMARY KEY (item_id, counter),
    FOREIGN KEY (item_id, counter) REFERENCES items_history (item_id, counter) ON DELETE CASCADE
  );
  `,
  // 3. Image items and their history (openspec add-image-items design D2). photo_file is
  // a name relative to <documents>/images/, never an absolute path.
  `
  CREATE TABLE image_items (
    item_id      TEXT PRIMARY KEY NOT NULL REFERENCES items (id) ON DELETE CASCADE,
    photo_file   TEXT NOT NULL,
    photo_width  INTEGER NOT NULL CHECK (photo_width > 0),
    photo_height INTEGER NOT NULL CHECK (photo_height > 0),
    alt_text     TEXT,
    caption      TEXT
  );
  CREATE TABLE image_items_history (
    item_id      TEXT NOT NULL,
    counter      INTEGER NOT NULL,
    photo_file   TEXT NOT NULL,
    photo_width  INTEGER NOT NULL,
    photo_height INTEGER NOT NULL,
    alt_text     TEXT,
    caption      TEXT,
    PRIMARY KEY (item_id, counter),
    FOREIGN KEY (item_id, counter) REFERENCES items_history (item_id, counter) ON DELETE CASCADE
  );
  `,
  // 4. Event items, one row per photo, and their history (openspec event-items design D2).
  // `position` is 0-based and dense. Text limits and the photo count are domain rules.
  `
  CREATE TABLE event_items (
    item_id     TEXT PRIMARY KEY NOT NULL REFERENCES items (id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    category    TEXT NOT NULL,
    description TEXT
  );
  CREATE TABLE event_item_photos (
    item_id      TEXT NOT NULL REFERENCES event_items (item_id) ON DELETE CASCADE,
    position     INTEGER NOT NULL CHECK (position >= 0),
    photo_file   TEXT NOT NULL,
    photo_width  INTEGER NOT NULL CHECK (photo_width > 0),
    photo_height INTEGER NOT NULL CHECK (photo_height > 0),
    PRIMARY KEY (item_id, position)
  );
  CREATE TABLE event_items_history (
    item_id     TEXT NOT NULL,
    counter     INTEGER NOT NULL,
    title       TEXT NOT NULL,
    category    TEXT NOT NULL,
    description TEXT,
    PRIMARY KEY (item_id, counter),
    FOREIGN KEY (item_id, counter) REFERENCES items_history (item_id, counter) ON DELETE CASCADE
  );
  CREATE TABLE event_item_photos_history (
    item_id      TEXT NOT NULL,
    counter      INTEGER NOT NULL,
    position     INTEGER NOT NULL,
    photo_file   TEXT NOT NULL,
    photo_width  INTEGER NOT NULL,
    photo_height INTEGER NOT NULL,
    PRIMARY KEY (item_id, counter, position),
    FOREIGN KEY (item_id, counter) REFERENCES items_history (item_id, counter) ON DELETE CASCADE
  );
  `,
];

/** The schema version recorded in the database (0 for a new file). */
export async function schemaVersion(db: SqlDatabase): Promise<number> {
  const row = await db.getFirst<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

/**
 * Applies every missing step in order. Each step and its version bump run in one
 * transaction, so a failing step leaves both the schema and the data unchanged.
 */
export async function migrate(db: SqlDatabase, steps: readonly string[] = MIGRATIONS): Promise<void> {
  const current = await schemaVersion(db);
  for (let version = current + 1; version <= steps.length; version++) {
    await db.transaction(async (tx) => {
      await tx.exec(steps[version - 1]);
      // PRAGMA takes no parameters; `version` is a loop integer, never user input.
      await tx.exec(`PRAGMA user_version = ${version}`);
    });
  }
}
