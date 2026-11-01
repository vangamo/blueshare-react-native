import { createItemsModule } from '@/items/application/items-module';
import type { TimelineStore } from '@/items/application/timeline-store';
import { fixedClock, sequentialIds } from '@/test-utils/item-test-deps';
import { NodeSqlDatabase } from '@/test-utils/node-sql-database';

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
    const firstRun = createItemsModule({ db, clock: fixedClock(1000, 1), ids: sequentialIds('a') });
    await firstRun.store.createText('Uno');
    await firstRun.store.createText('Dos');

    const secondRun = createItemsModule({ db, clock: fixedClock(5000, 1), ids: sequentialIds('b') });
    await loaded(secondRun.store);

    expect(secondRun.store.getSnapshot().status).toBe('ready');
    expect(secondRun.store.getSnapshot().items.map((item) => item.body)).toEqual(['Dos', 'Uno']);
  });
});
