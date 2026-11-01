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
