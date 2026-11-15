import { ItemNotFoundError } from '@/items/domain/errors';
import type { EventItem } from '@/items/domain/event-item';
import type { ImageItem, StoredPhoto } from '@/items/domain/image-item';
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
  title: string | null;
  category: string | null;
  description: string | null;
};

type PhotoRow = {
  item_id: string;
  photo_file: string;
  photo_width: number;
  photo_height: number;
};

// Each item type adds its own LEFT JOIN. Event photos are one-to-many, so they come
// from a second query (`PHOTOS_SQL`) instead of a join that would repeat the item rows.
const SELECT_ITEMS = `
  SELECT i.id, i.type, i.created_at, i.updated_at, i.deleted_at, t.body,
    m.photo_file, m.photo_width, m.photo_height, m.alt_text, m.caption,
    e.title, e.category, e.description
  FROM items i
  LEFT JOIN text_items t ON t.item_id = i.id
  LEFT JOIN image_items m ON m.item_id = i.id
  LEFT JOIN event_items e ON e.item_id = i.id`;

// The rowid tie-break keeps insertion order for items created in the same millisecond.
const TIMELINE_SQL = `${SELECT_ITEMS}
  WHERE i.deleted_at IS NULL
  ORDER BY i.created_at DESC, i.rowid DESC`;

const FIND_SQL = `${SELECT_ITEMS}
  WHERE i.id = ? AND i.deleted_at IS NULL`;

const PHOTO_COLUMNS = 'p.item_id, p.photo_file, p.photo_width, p.photo_height';

const PHOTOS_SQL = `
  SELECT ${PHOTO_COLUMNS}
  FROM event_item_photos p JOIN items i ON i.id = p.item_id
  WHERE i.deleted_at IS NULL
  ORDER BY p.item_id, p.position`;

const ITEM_PHOTOS_SQL = `
  SELECT ${PHOTO_COLUMNS}
  FROM event_item_photos p
  WHERE p.item_id = ?
  ORDER BY p.position`;

/** Groups photo rows (already in position order) by their event. */
function photosByItem(rows: readonly PhotoRow[]): Map<string, StoredPhoto[]> {
  const byItem = new Map<string, StoredPhoto[]>();
  for (const row of rows) {
    const photo = { file: row.photo_file, width: row.photo_width, height: row.photo_height };
    const list = byItem.get(row.item_id);
    if (list) list.push(photo);
    else byItem.set(row.item_id, [photo]);
  }
  return byItem;
}

/** The item a row describes, or `null` for a row whose content is missing (hidden). */
function toTimelineItem(
  row: TimelineRow,
  photos: ReadonlyMap<string, StoredPhoto[]>,
): TimelineItem | null {
  const meta = {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
  if (row.type === 'text' && row.body !== null) {
    return { ...meta, type: 'text', body: row.body };
  }
  if (
    row.type === 'image' &&
    row.photo_file !== null &&
    row.photo_width !== null &&
    row.photo_height !== null
  ) {
    return {
      ...meta,
      type: 'image',
      photo: { file: row.photo_file, width: row.photo_width, height: row.photo_height },
      altText: row.alt_text,
      caption: row.caption,
    };
  }
  const eventPhotos = photos.get(row.id);
  if (row.type === 'event' && row.title !== null && row.category !== null && eventPhotos?.length) {
    return {
      ...meta,
      type: 'event',
      title: row.title,
      category: row.category,
      description: row.description,
      photos: eventPhotos,
    };
  }
  return null;
}

/**
 * Copies the live rows of `id` into the history as version `counter`, with `deletedAt`
 * (null for an edit). An event's whole photo list goes in with the same counter.
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
  await tx.run(
    `INSERT INTO event_items_history (item_id, counter, title, category, description)
     SELECT item_id, ?, title, category, description FROM event_items WHERE item_id = ?`,
    [counter, id],
  );
  await tx.run(
    `INSERT INTO event_item_photos_history (item_id, counter, position, photo_file, photo_width, photo_height)
     SELECT item_id, ?, position, photo_file, photo_width, photo_height FROM event_item_photos WHERE item_id = ?`,
    [counter, id],
  );
}

async function liveType(tx: SqlExecutor, id: string): Promise<ItemType> {
  const row = await tx.getFirst<{ type: ItemType }>(
    'SELECT type FROM items WHERE id = ? AND deleted_at IS NULL',
    [id],
  );
  if (!row) throw new ItemNotFoundError(id);
  return row.type;
}

/** The tables that hold each type's own rows, children first, removed before the `items` row. */
const TYPE_TABLES: Record<ItemType, readonly string[]> = {
  text: ['text_items'],
  image: ['image_items'],
  event: ['event_item_photos', 'event_items'],
};

async function insertItem(tx: SqlExecutor, item: TimelineItem): Promise<void> {
  await tx.run(
    'INSERT INTO items (id, type, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?)',
    [item.id, item.type, item.createdAt, item.updatedAt, item.deletedAt],
  );
}

async function insertEventPhotos(tx: SqlExecutor, item: EventItem): Promise<void> {
  for (const [position, photo] of item.photos.entries()) {
    await tx.run(
      'INSERT INTO event_item_photos (item_id, position, photo_file, photo_width, photo_height) VALUES (?, ?, ?, ?, ?)',
      [item.id, position, photo.file, photo.width, photo.height],
    );
  }
}

/** `ItemRepository` over any `SqlDatabase` (expo-sqlite in the app, node:sqlite in Jest). */
export class SqliteItemRepository implements ItemRepository {
  constructor(private readonly db: SqlDatabase) {}

  saveText(item: TextItem): Promise<void> {
    return this.db.transaction(async (tx) => {
      await insertItem(tx, item);
      await tx.run('INSERT INTO text_items (item_id, body) VALUES (?, ?)', [item.id, item.body]);
    });
  }

  saveImage(item: ImageItem): Promise<void> {
    return this.db.transaction(async (tx) => {
      await insertItem(tx, item);
      await tx.run(
        'INSERT INTO image_items (item_id, photo_file, photo_width, photo_height, alt_text, caption) VALUES (?, ?, ?, ?, ?, ?)',
        [item.id, item.photo.file, item.photo.width, item.photo.height, item.altText, item.caption],
      );
    });
  }

  saveEvent(item: EventItem): Promise<void> {
    return this.db.transaction(async (tx) => {
      await insertItem(tx, item);
      await tx.run(
        'INSERT INTO event_items (item_id, title, category, description) VALUES (?, ?, ?, ?)',
        [item.id, item.title, item.category, item.description],
      );
      await insertEventPhotos(tx, item);
    });
  }

  // Both reads happen right after the migration with no writes in between, so they need
  // no transaction (design D3).
  async listTimeline(): Promise<TimelineItem[]> {
    const rows = await this.db.getAll<TimelineRow>(TIMELINE_SQL);
    const photos = photosByItem(await this.db.getAll<PhotoRow>(PHOTOS_SQL));
    return rows.map((row) => toTimelineItem(row, photos)).filter((item) => item !== null);
  }

  /** The live item with this id, of any type, or `null`. */
  private async find(id: string): Promise<TimelineItem | null> {
    const row = await this.db.getFirst<TimelineRow>(FIND_SQL, [id]);
    if (!row) return null;
    const photos =
      row.type === 'event'
        ? photosByItem(await this.db.getAll<PhotoRow>(ITEM_PHOTOS_SQL, [id]))
        : new Map<string, StoredPhoto[]>();
    return toTimelineItem(row, photos);
  }

  async findText(id: string): Promise<TextItem | null> {
    const item = await this.find(id);
    return item?.type === 'text' ? item : null;
  }

  async findImage(id: string): Promise<ImageItem | null> {
    const item = await this.find(id);
    return item?.type === 'image' ? item : null;
  }

  async findEvent(id: string): Promise<EventItem | null> {
    const item = await this.find(id);
    return item?.type === 'event' ? item : null;
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

  /** Rewrites the photo list rather than diffing it: at most `EVENT_MAX_PHOTOS` rows. */
  updateEvent(item: EventItem): Promise<void> {
    return this.db.transaction(async (tx) => {
      const type = await liveType(tx, item.id);
      await archive(tx, item.id, type, null);
      await tx.run('UPDATE items SET updated_at = ? WHERE id = ?', [item.updatedAt, item.id]);
      await tx.run('UPDATE event_items SET title = ?, category = ?, description = ? WHERE item_id = ?', [
        item.title,
        item.category,
        item.description,
        item.id,
      ]);
      await tx.run('DELETE FROM event_item_photos WHERE item_id = ?', [item.id]);
      await insertEventPhotos(tx, item);
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
      for (const table of TYPE_TABLES[type]) {
        await tx.run(`DELETE FROM ${table} WHERE item_id = ?`, [id]);
      }
      await tx.run('DELETE FROM items WHERE id = ?', [id]);
    });
  }
}
