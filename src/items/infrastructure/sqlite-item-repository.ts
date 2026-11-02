import { ItemNotFoundError } from '@/items/domain/errors';
import type { ImageItem } from '@/items/domain/image-item';
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
  photo_file: string | null;
  photo_width: number | null;
  photo_height: number | null;
  alt_text: string | null;
  caption: string | null;
};

const COLUMNS = `i.id, i.type, i.created_at, i.updated_at, i.deleted_at, t.body,
  m.photo_file, m.photo_width, m.photo_height, m.alt_text, m.caption`;

// Each later item type adds its own LEFT JOIN. The rowid tie-break keeps insertion
// order for items created in the same millisecond.
const TIMELINE_SQL = `
  SELECT ${COLUMNS}
  FROM items i
  LEFT JOIN text_items t ON t.item_id = i.id
  LEFT JOIN image_items m ON m.item_id = i.id
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
  if (
    row.type === 'image' &&
    row.photo_file !== null &&
    row.photo_width !== null &&
    row.photo_height !== null
  ) {
    return {
      id: row.id,
      type: 'image',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      photo: { file: row.photo_file, width: row.photo_width, height: row.photo_height },
      altText: row.alt_text,
      caption: row.caption,
    };
  }
  // Event items can't be shown yet.
  return null;
}

/**
 * Copies the live rows of `id` into the history as version `counter`, with `deletedAt`
 * (null for an edit). Event items add their own case when they exist.
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
  if (type === 'image') {
    await tx.run(
      `INSERT INTO image_items_history (item_id, counter, photo_file, photo_width, photo_height, alt_text, caption)
       SELECT item_id, ?, photo_file, photo_width, photo_height, alt_text, caption FROM image_items WHERE item_id = ?`,
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

/** The table that holds each type's own row, removed before the `items` row on deletion. */
const TYPE_TABLES: Partial<Record<ItemType, string>> = {
  text: 'text_items',
  image: 'image_items',
};

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

  saveImage(item: ImageItem): Promise<void> {
    return this.db.transaction(async (tx) => {
      await tx.run(
        'INSERT INTO items (id, type, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?)',
        [item.id, item.type, item.createdAt, item.updatedAt, item.deletedAt],
      );
      await tx.run(
        'INSERT INTO image_items (item_id, photo_file, photo_width, photo_height, alt_text, caption) VALUES (?, ?, ?, ?, ?, ?)',
        [item.id, item.photo.file, item.photo.width, item.photo.height, item.altText, item.caption],
      );
    });
  }

  async listTimeline(): Promise<TimelineItem[]> {
    const rows = await this.db.getAll<TimelineRow>(TIMELINE_SQL);
    return rows.map(toTimelineItem).filter((item) => item !== null);
  }

  async findText(id: string): Promise<TextItem | null> {
    const row = await this.db.getFirst<TimelineRow>(
      `SELECT ${COLUMNS}
       FROM items i JOIN text_items t ON t.item_id = i.id
       LEFT JOIN image_items m ON m.item_id = i.id
       WHERE i.id = ? AND i.deleted_at IS NULL`,
      [id],
    );
    const item = row ? toTimelineItem(row) : null;
    return item?.type === 'text' ? item : null;
  }

  async findImage(id: string): Promise<ImageItem | null> {
    const row = await this.db.getFirst<TimelineRow>(
      `SELECT ${COLUMNS}
       FROM items i JOIN image_items m ON m.item_id = i.id
       LEFT JOIN text_items t ON t.item_id = i.id
       WHERE i.id = ? AND i.deleted_at IS NULL`,
      [id],
    );
    const item = row ? toTimelineItem(row) : null;
    return item?.type === 'image' ? item : null;
  }

  updateImage(item: ImageItem): Promise<void> {
    return this.db.transaction(async (tx) => {
      const type = await liveType(tx, item.id);
      await archive(tx, item.id, type, null);
      await tx.run('UPDATE items SET updated_at = ? WHERE id = ?', [item.updatedAt, item.id]);
      await tx.run(
        'UPDATE image_items SET photo_file = ?, photo_width = ?, photo_height = ?, alt_text = ?, caption = ? WHERE item_id = ?',
        [item.photo.file, item.photo.width, item.photo.height, item.altText, item.caption, item.id],
      );
    });
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
      // `archive()` already threw for a type without a table, so the lookup succeeds here.
      await tx.run(`DELETE FROM ${TYPE_TABLES[type]} WHERE item_id = ?`, [id]);
      await tx.run('DELETE FROM items WHERE id = ?', [id]);
    });
  }
}
