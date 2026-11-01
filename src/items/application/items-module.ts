/**
 * Composition root of the items module: the one place that wires the
 * infrastructure (SQLite repository, migrations) into the use cases and the store.
 */
import type { Clock, IdGenerator } from '@/items/domain/ports';
import { migrate } from '@/items/infrastructure/migrations';
import type { SqlDatabase } from '@/items/infrastructure/sql-database';
import { SqliteItemRepository } from '@/items/infrastructure/sqlite-item-repository';

import { createTextItem } from './create-text-item';
import { listTimeline } from './list-timeline';
import { createTimelineStore, type TimelineStore } from './timeline-store';

export type ItemsAdapters = {
  db: SqlDatabase;
  ids: IdGenerator;
  clock: Clock;
};

export type ItemsModule = {
  store: TimelineStore;
};

export function createItemsModule({ db, ids, clock }: ItemsAdapters): ItemsModule {
  const deps = { repository: new SqliteItemRepository(db), clock, ids };
  const store = createTimelineStore({
    prepare: () => migrate(db),
    listTimeline: listTimeline(deps),
    createText: createTextItem(deps),
  });
  return { store };
}
