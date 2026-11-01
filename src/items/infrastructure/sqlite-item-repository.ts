import type { ItemType } from '@/items/domain/item';
import type { ItemRepository } from '@/items/domain/ports';
import type { TextItem } from '@/items/domain/text-item';
import type { TimelineItem } from '@/items/domain/timeline-item';

import type { SqlDatabase } from './sql-database';

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
}
