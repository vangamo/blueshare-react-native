/**
 * Composition root of the items module: the one place that wires the
 * infrastructure (SQLite repository, migrations) into the use cases and the store.
 */
import type { Clock, IdGenerator, PhotoStore } from '@/items/domain/ports';
import { migrate } from '@/items/infrastructure/migrations';
import type { SqlDatabase } from '@/items/infrastructure/sql-database';
import { SqliteItemRepository } from '@/items/infrastructure/sqlite-item-repository';

import { createEventItem } from './create-event-item';
import { createImageItem } from './create-image-item';
import { createTextItem } from './create-text-item';
import { deleteItem } from './delete-item';
import { listTimeline } from './list-timeline';
import { createTimelineStore, type TimelineStore } from './timeline-store';
import { updateEventItem } from './update-event-item';
import { updateImageItem } from './update-image-item';
import { updateTextItem } from './update-text-item';

export type ItemsAdapters = {
  db: SqlDatabase;
  ids: IdGenerator;
  clock: Clock;
  photos: PhotoStore;
};

export type ItemsModule = {
  store: TimelineStore;
  /** Gives the UI the URI of a stored photo. */
  photos: PhotoStore;
};

export function createItemsModule({ db, ids, clock, photos }: ItemsAdapters): ItemsModule {
  const deps = { repository: new SqliteItemRepository(db), clock, ids, photos };
  const store = createTimelineStore({
    prepare: () => migrate(db),
    listTimeline: listTimeline(deps),
    createText: createTextItem(deps),
    updateText: updateTextItem(deps),
    createImage: createImageItem(deps),
    updateImage: updateImageItem(deps),
    createEvent: createEventItem(deps),
    updateEvent: updateEventItem(deps),
    deleteItem: deleteItem(deps),
  });
  return { store, photos };
}
