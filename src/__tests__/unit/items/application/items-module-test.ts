import { createItemsModule } from '@/items/application/items-module';
import type { TimelineStore } from '@/items/application/timeline-store';
import { fixedClock, sequentialIds } from '@/test-utils/item-test-deps';
import { NodePhotoStore } from '@/test-utils/node-photo-store';
import { NodeSqlDatabase } from '@/test-utils/node-sql-database';
import { bodyOf } from '@/test-utils/item-helpers';

function loaded(store: TimelineStore) {
  return new Promise<void>((resolve) => {
    const unsubscribe = store.subscribe(() => {
      if (store.getSnapshot().status !== 'loading') {
        unsubscribe();
        resolve();
      }
    });
  });
}

describe('createItemsModule', () => {
  test('items survive a restart: a new module on the same database lists them newest first', async () => {
    const db = new NodeSqlDatabase();
    const firstRun = createItemsModule({ db, clock: fixedClock(1000, 1), ids: sequentialIds('a'), photos: new NodePhotoStore() });
    await firstRun.store.createText('Uno');
    await firstRun.store.createText('Dos');

    const secondRun = createItemsModule({ db, clock: fixedClock(5000, 1), ids: sequentialIds('b'), photos: new NodePhotoStore() });
    await loaded(secondRun.store);

    expect(secondRun.store.getSnapshot().status).toBe('ready');
    expect(secondRun.store.getSnapshot().items.map(bodyOf)).toEqual(['Dos', 'Uno']);
  });

  test('an edit keeps its place and a deletion stays gone after a restart', async () => {
    const db = new NodeSqlDatabase();
    const firstRun = createItemsModule({ db, clock: fixedClock(1000, 1), ids: sequentialIds('a'), photos: new NodePhotoStore() });
    await firstRun.store.createText('Uno');
    await firstRun.store.createText('Dos');
    await firstRun.store.createText('Tres');
    const items = firstRun.store.getSnapshot().items;
    const idOf = (body: string) => items.find((item) => bodyOf(item) === body)!.id;

    await firstRun.store.updateText(idOf('Uno'), 'Uno editado');
    await firstRun.store.deleteItem(idOf('Dos'));

    const secondRun = createItemsModule({ db, clock: fixedClock(5000, 1), ids: sequentialIds('b'), photos: new NodePhotoStore() });
    await loaded(secondRun.store);
    expect(secondRun.store.getSnapshot().items.map(bodyOf)).toEqual([
      'Tres',
      'Uno editado',
    ]);
  });
});
