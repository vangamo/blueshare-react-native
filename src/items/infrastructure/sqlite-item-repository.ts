import { ItemNotFoundError } from '@/items/domain/errors';
import type { ItemType } from '@/items/domain/item';
import type { ItemRepository } from '@/items/domain/ports';
import type { TextItem } from '@/items/domain/text-item';
import type { TimelineItem } from '@/items/domain/timeline-item';

import type { SqlDatabase, SqlExecutor } from './sql-database';

type TimelineRow = {
  id: string;
  type: ItemType;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  body: string | null;
};

// Each later item type adds its own LEFT JOIN. The rowid tie-break keeps insertion
// order for items created in the same millisecond.
const TIMELINE_SQL = `
  SELECT i.id, i.type, i.created_at, i.updated_at, i.deleted_at, t.body
  FROM items i
  LEFT JOIN text_items t ON t.item_id = i.id
  WHERE i.deleted_at IS NULL
  ORDER BY i.created_at DESC, i.rowid DESC`;

function toTimelineItem(row: TimelineRow): TimelineItem | null {
  if (row.type === 'text' && row.body !== null) {
    return {
      id: row.id,
      type: 'text',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      body: row.body,
    };
  }
  // Image and event items can't be shown yet.
  return null;
}

/**
 * Copies the live rows of `id` into the history as version `counter`, with `deletedAt`
 * (null for an edit). Image and event items add their own case when they exist.
 */
async function archive(
  tx: SqlExecutor,
  id: string,
  type: ItemType,
  deletedAt: number | null,
): Promise<void> {
  const last = await tx.getFirst<{ last: number }>(
    'SELECT COALESCE(MAX(counter), 0) AS last FROM items_history WHERE item_id = ?',
    [id],
  );
  const counter = (last?.last ?? 0) + 1;
  await tx.run(
    `INSERT INTO items_history (item_id, counter, type, created_at, updated_at, deleted_at)
     SELECT id, ?, type, created_at, updated_at, ? FROM items WHERE id = ?`,
    [counter, deletedAt, id],
  );
  if (type === 'text') {
    await tx.run(
      'INSERT INTO text_items_history (item_id, counter, body) SELECT item_id, ?, body FROM text_items WHERE item_id = ?',
      [counter, id],
    );
    return;
  }
  // Throwing rolls the transaction back, so content is never dropped silently.
  throw new Error(`Cannot archive items of type ${type} yet.`);
}

async function liveType(tx: SqlExecutor, id: string): Promise<ItemType> {
  const row = await tx.getFirst<{ type: ItemType }>(
    'SELECT type FROM items WHERE id = ? AND deleted_at IS NULL',
    [id],
  );
  if (!row) throw new ItemNotFoundError(id);
  return row.type;
}

/** `ItemRepository` over any `SqlDatabase` (expo-sqlite in the app, node:sqlite in Jest). */
export class SqliteItemRepository implements ItemRepository {
  constructor(private readonly db: SqlDatabase) {}

  saveText(item: TextItem): Promise<void> {
    return this.db.transaction(async (tx) => {
      await tx.run(
        'INSERT INTO items (id, type, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?)',
        [item.id, item.type, item.createdAt, item.updatedAt, item.deletedAt],
      );
      await tx.run('INSERT INTO text_items (item_id, body) VALUES (?, ?)', [item.id, item.body]);
    });
  }

  async listTimeline(): Promise<TimelineItem[]> {
    const rows = await this.db.getAll<TimelineRow>(TIMELINE_SQL);
    return rows.map(toTimelineItem).filter((item) => item !== null);
  }

  async findText(id: string): Promise<TextItem | null> {
    const row = await this.db.getFirst<TimelineRow>(
      `SELECT i.id, i.type, i.created_at, i.updated_at, i.deleted_at, t.body
       FROM items i JOIN text_items t ON t.item_id = i.id
       WHERE i.id = ? AND i.deleted_at IS NULL`,
      [id],
    );
    return row ? toTimelineItem(row) : null;
  }

  updateText(item: TextItem): Promise<void> {
    return this.db.transaction(async (tx) => {
      const type = await liveType(tx, item.id);
      await archive(tx, item.id, type, null);
      await tx.run('UPDATE items SET updated_at = ? WHERE id = ?', [item.updatedAt, item.id]);
      await tx.run('UPDATE text_items SET body = ? WHERE item_id = ?', [item.body, item.id]);
    });
  }

  deleteItem(id: string, deletedAt: number): Promise<void> {
    return this.db.transaction(async (tx) => {
      const type = await liveType(tx, id);
      await archive(tx, id, type, deletedAt);
      // Removed explicitly, not through the cascade: the Expo driver's exclusive
      // transactions don't enforce foreign keys.
      await tx.run('DELETE FROM text_items WHERE item_id = ?', [id]);
      await tx.run('DELETE FROM items WHERE id = ?', [id]);
    });
  }
}
